from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.agents.supervise_ import SupervisorAgent
from app.models.attempts import Attempt
from app.models.levels import Levels
from app.models.mistake import Mistake
from app.models.sentences import Sentence
from app.models.topics import Topics
from app.models.user import Users


class TranslateService:
    def __init__(self, db: Session, supervisor: Optional[SupervisorAgent] = None):
        self.db = db
        self.supervisor = supervisor or SupervisorAgent()

    # =========================================================================
    # User Management
    # =========================================================================

    def get_or_create_user(
        self,
        username: str,
        telegram_id: Optional[str] = None,
        email: Optional[str] = None,
    ) -> Users:
        query = self.db.query(Users)
        if telegram_id:
            user = query.filter(Users.telegram_id == str(telegram_id)).first()
            if user:
                return user

        user = query.filter(Users.username == username).first()
        if user:
            if telegram_id and not user.telegram_id:
                user.telegram_id = str(telegram_id)
                self.db.commit()
                self.db.refresh(user)
            return user

        new_user = Users(
            username=username,
            telegram_id=str(telegram_id) if telegram_id else None,
            email=email,
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    # =========================================================================
    # Topics & Levels Management
    # =========================================================================

    def get_topics(self) -> List[Topics]:
        topics = self.db.query(Topics).all()
        if not topics:
            default_topics = [
                ("Daily Life", "Cuộc sống hàng ngày, giao tiếp cơ bản"),
                ("Travel", "Du lịch, hỏi đường, khách sạn, sân bay"),
                ("Work & Office", "Công việc, văn phòng, họp hành"),
                ("Technology", "Công nghệ, máy tính, mạng xã hội"),
                ("Food & Dining", "Ẩm thực, nhà hàng, nấu ăn"),
            ]
            for name, desc in default_topics:
                t = Topics(name=name, description=desc)
                self.db.add(t)
            self.db.commit()
            topics = self.db.query(Topics).all()
        return topics

    def get_levels(self) -> List[Levels]:
        levels = self.db.query(Levels).all()
        if not levels:
            default_levels = [
                ("A1", "Sơ cấp (Beginner)"),
                ("A2", "Sơ trung cấp (Elementary)"),
                ("B1", "Trung cấp (Intermediate)"),
                ("B2", "Trung cao cấp (Upper Intermediate)"),
                ("C1", "Cao cấp (Advanced)"),
            ]
            for name, desc in default_levels:
                lvl = Levels(name=name, description=desc)
                self.db.add(lvl)
            self.db.commit()
            levels = self.db.query(Levels).all()
        return levels

    # =========================================================================
    # User Weaknesses Retrieval
    # =========================================================================

    def get_user_recent_weaknesses(
        self, user_id: str, limit: int = 5
    ) -> List[str]:
        """
        Retrieves the most frequent mistake subtypes for a given user.
        """
        results = (
            self.db.query(
                Mistake.mistake_subtype,
                func.count(Mistake.id).label("cnt"),
            )
            .join(Attempt, Mistake.attempt_id == Attempt.id)
            .filter(Attempt.user_id == user_id)
            .group_by(Mistake.mistake_subtype)
            .order_by(func.count(Mistake.id).desc())
            .limit(limit)
            .all()
        )
        return [row[0] for row in results if row[0]]

    # =========================================================================
    # Exercise Generation
    # =========================================================================

    def create_exercise(
        self,
        user_id: str,
        topic_id: str,
        level_id: str,
        difficulty: str = "medium",
    ) -> Sentence:
        topic = self.db.query(Topics).filter(Topics.id == topic_id).first()
        level = self.db.query(Levels).filter(Levels.id == level_id).first()

        if not topic:
            raise ValueError(f"Topic not found for id: {topic_id}")
        if not level:
            raise ValueError(f"Level not found for id: {level_id}")

        weaknesses = self.get_user_recent_weaknesses(user_id=user_id)

        generated = self.supervisor.generate_exercise(
            level=level.name,
            topic=topic.name,
            difficulty=difficulty,
            weaknesses=weaknesses,
        )

        sentence = Sentence(
            vietnamese_text=generated.vietnamese_text,
            english_answer=generated.english_answer,
            level_id=level.id,
            topic_id=topic.id,
            difficulty=difficulty,
        )
        self.db.add(sentence)
        self.db.commit()
        self.db.refresh(sentence)
        return sentence

    # =========================================================================
    # Attempt Submission & Grading
    # =========================================================================

    def submit_translation(
        self,
        user_id: str,
        sentence_id: str,
        user_answer: str,
    ) -> Dict:
        sentence = (
            self.db.query(Sentence).filter(Sentence.id == sentence_id).first()
        )
        if not sentence:
            raise ValueError(f"Sentence not found for id: {sentence_id}")

        analysis = self.supervisor.evaluate_exercise(
            vietnamese_text=sentence.vietnamese_text,
            english_answer=sentence.english_answer,
            user_answer=user_answer,
        )

        attempt = Attempt(
            user_id=user_id,
            sentence_id=sentence.id,
            user_answer=user_answer,
            score=analysis.score,
            is_correct=analysis.is_correct,
            feedback=analysis.feedback,
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)

        saved_mistakes = []
        for m in analysis.mistakes:
            mistake_obj = Mistake(
                attempt_id=attempt.id,
                mistake_type=m.mistake_type,
                mistake_subtype=m.mistake_subtype,
                wrong_text=m.wrong_text,
                correct_text=m.correct_text,
                explanation=m.explanation,
            )
            self.db.add(mistake_obj)
            saved_mistakes.append(mistake_obj)

        self.db.commit()

        return {
            "attempt_id": attempt.id,
            "sentence_id": sentence.id,
            "vietnamese_text": sentence.vietnamese_text,
            "english_answer": sentence.english_answer,
            "user_answer": user_answer,
            "score": analysis.score,
            "is_correct": analysis.is_correct,
            "corrected_answer": analysis.corrected_answer,
            "feedback": analysis.feedback,
            "mistakes": [
                {
                    "mistake_type": m.mistake_type,
                    "mistake_subtype": m.mistake_subtype,
                    "wrong_text": m.wrong_text,
                    "correct_text": m.correct_text,
                    "explanation": m.explanation,
                }
                for m in analysis.mistakes
            ],
        }

    # =========================================================================
    # User Progress Stats
    # =========================================================================

    def get_user_progress(self, user_id: str) -> Dict:
        total_attempts = (
            self.db.query(func.count(Attempt.id))
            .filter(Attempt.user_id == user_id)
            .scalar()
            or 0
        )
        correct_attempts = (
            self.db.query(func.count(Attempt.id))
            .filter(Attempt.user_id == user_id, Attempt.is_correct == True)
            .scalar()
            or 0
        )
        avg_score = (
            self.db.query(func.avg(Attempt.score))
            .filter(Attempt.user_id == user_id)
            .scalar()
            or 0.0
        )

        top_weaknesses = (
            self.db.query(
                Mistake.mistake_subtype,
                func.count(Mistake.id).label("cnt"),
            )
            .join(Attempt, Mistake.attempt_id == Attempt.id)
            .filter(Attempt.user_id == user_id)
            .group_by(Mistake.mistake_subtype)
            .order_by(func.count(Mistake.id).desc())
            .limit(5)
            .all()
        )

        return {
            "user_id": user_id,
            "total_attempts": total_attempts,
            "correct_attempts": correct_attempts,
            "accuracy_rate": round(
                (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0.0,
                2,
            ),
            "average_score": round(float(avg_score), 2),
            "top_weaknesses": [
                {"subtype": row[0], "count": row[1]} for row in top_weaknesses
            ],
        }
