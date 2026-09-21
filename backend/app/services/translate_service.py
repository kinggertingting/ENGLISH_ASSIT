from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.agents.translate_agent.supervise_ import SupervisorAgent
from app.models.levels import Levels
from app.models.sentences import Sentence
from app.models.topics import Topics
from app.models.user import Users
from app.repository.sentence_repository import SentenceRepository


class TranslateService:
    def __init__(
        self,
        db: Session,
        supervisor: Optional[SupervisorAgent] = None,
        repository: Optional[SentenceRepository] = None,
    ):
        self.db = db
        self.repository = repository or SentenceRepository(db=db)
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
        return self.repository.get_or_create_user(
            username=username,
            telegram_id=telegram_id,
            email=email,
        )

    # =========================================================================
    # Topics & Levels Management
    # =========================================================================

    def get_topics(self) -> List[Topics]:
        return self.repository.get_all_topics()

    def get_levels(self) -> List[Levels]:
        return self.repository.get_all_levels()

    # =========================================================================
    # User Weaknesses & Sentence History Retrieval
    # =========================================================================

    def get_user_recent_weaknesses(
        self, user_id: str, limit: int = 5
    ) -> List[str]:
        return self.repository.get_user_recent_weaknesses(user_id=user_id, limit=limit)

    def get_user_recent_sentences(
        self, user_id: str, limit: int = 10
    ) -> List[str]:
        return self.repository.get_user_recent_sentences(user_id=user_id, limit=limit)

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
        topic = self.repository.get_topic_by_id(topic_id)
        level = self.repository.get_level_by_id(level_id)

        if not topic:
            raise ValueError(f"Topic not found for id: {topic_id}")
        if not level:
            raise ValueError(f"Level not found for id: {level_id}")

        weaknesses = self.repository.get_user_recent_weaknesses(user_id=user_id)
        recent_sentences = self.repository.get_user_recent_sentences(user_id=user_id)

        generated = self.supervisor.generate_exercise(
            level=level.name,
            topic=topic.name,
            difficulty=difficulty,
            weaknesses=weaknesses,
            recent_sentences=recent_sentences,
        )

        sentence = self.repository.save_sentence(
            vietnamese_text=generated.vietnamese_text,
            english_answer=generated.english_answer,
            level_id=level.id,
            topic_id=topic.id,
            difficulty=difficulty,
        )
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
        sentence = self.repository.get_sentence_by_id(sentence_id)
        if not sentence:
            raise ValueError(f"Sentence not found for id: {sentence_id}")

        analysis = self.supervisor.evaluate_exercise(
            vietnamese_text=sentence.vietnamese_text,
            english_answer=sentence.english_answer,
            user_answer=user_answer,
        )

        mistakes_payload = [
            {
                "mistake_type": m.mistake_type,
                "mistake_subtype": m.mistake_subtype,
                "wrong_text": m.wrong_text,
                "correct_text": m.correct_text,
                "explanation": m.explanation,
            }
            for m in analysis.mistakes
        ]

        attempt_res = self.repository.save_attempt(
            user_id=user_id,
            sentence_id=sentence.id,
            user_answer=user_answer,
            score=analysis.score,
            is_correct=analysis.is_correct,
            feedback=analysis.feedback,
            mistakes_data=mistakes_payload,
        )

        return {
            "attempt_id": attempt_res["attempt_id"],
            "sentence_id": sentence.id,
            "vietnamese_text": sentence.vietnamese_text,
            "english_answer": sentence.english_answer,
            "user_answer": user_answer,
            "score": analysis.score,
            "is_correct": analysis.is_correct,
            "corrected_answer": analysis.corrected_answer,
            "feedback": analysis.feedback,
            "mistakes": mistakes_payload,
        }

    # =========================================================================
    # User Progress Stats
    # =========================================================================

    def get_user_progress(self, user_id: str) -> Dict:
        return self.repository.get_user_progress(user_id=user_id)
