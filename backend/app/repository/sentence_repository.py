from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.attempts import Attempt
from app.models.levels import Levels
from app.models.mistake import Mistake
from app.models.sentences import Sentence
from app.models.topics import Topics
from app.models.user import Users


class SentenceRepository:
    """
    Repository pattern for handling database interactions related to
    users, topics, levels, generated sentences, user attempts, and mistake tracking.
    """

    def __init__(self, db: Session):
        self.db = db

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
    # Topics & Levels
    # =========================================================================

    def get_all_topics(self) -> List[Topics]:
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

    def get_topic_by_id(self, topic_id: str) -> Optional[Topics]:
        return self.db.query(Topics).filter(Topics.id == topic_id).first()

    def get_all_levels(self) -> List[Levels]:
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

    def get_level_by_id(self, level_id: str) -> Optional[Levels]:
        return self.db.query(Levels).filter(Levels.id == level_id).first()

    # =========================================================================
    # User Weaknesses & History Retrieval
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

    def get_user_recent_sentences(
        self, user_id: str, limit: int = 10
    ) -> List[str]:
        """
        Retrieves recent Vietnamese sentences generated/attempted for a user
        to avoid repetitive exercises.
        """
        results = (
            self.db.query(Sentence.vietnamese_text)
            .join(Attempt, Sentence.id == Attempt.sentence_id)
            .filter(Attempt.user_id == user_id)
            .order_by(Attempt.created_at.desc())
            .limit(limit)
            .all()
        )
        return [row[0] for row in results if row[0]]

    # =========================================================================
    # Sentence & Attempt Persistence
    # =========================================================================

    def save_sentence(
        self,
        vietnamese_text: str,
        english_answer: str,
        level_id: str,
        topic_id: str,
        difficulty: str = "medium",
    ) -> Sentence:
        sentence = Sentence(
            vietnamese_text=vietnamese_text,
            english_answer=english_answer,
            level_id=level_id,
            topic_id=topic_id,
            difficulty=difficulty,
        )
        self.db.add(sentence)
        self.db.commit()
        self.db.refresh(sentence)
        return sentence

    def get_sentence_by_id(self, sentence_id: str) -> Optional[Sentence]:
        return self.db.query(Sentence).filter(Sentence.id == sentence_id).first()

    def save_attempt(
        self,
        user_id: str,
        sentence_id: str,
        user_answer: str,
        score: float,
        is_correct: bool,
        feedback: str,
        mistakes_data: List[Dict],
    ) -> Dict:
        attempt = Attempt(
            user_id=user_id,
            sentence_id=sentence_id,
            user_answer=user_answer,
            score=score,
            is_correct=is_correct,
            feedback=feedback,
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)

        saved_mistakes = []
        for m in mistakes_data:
            mistake_obj = Mistake(
                attempt_id=attempt.id,
                mistake_type=m.get("mistake_type", "General"),
                mistake_subtype=m.get("mistake_subtype", "Unknown"),
                wrong_text=m.get("wrong_text", ""),
                correct_text=m.get("correct_text", ""),
                explanation=m.get("explanation", ""),
            )
            self.db.add(mistake_obj)
            saved_mistakes.append(mistake_obj)

        self.db.commit()

        return {
            "attempt_id": attempt.id,
            "sentence_id": sentence_id,
            "score": score,
            "is_correct": is_correct,
            "feedback": feedback,
            "mistakes": mistakes_data,
        }

    # =========================================================================
    # User Stats
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
