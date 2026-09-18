from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.services.translate_service import TranslateService

router = APIRouter(prefix="/api", tags=["Learning API"])


# =============================================================================
# DB Dependency
# =============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================================================================
# Pydantic Schemas
# =============================================================================

class UserAuthRequest(BaseModel):
    username: str
    telegram_id: Optional[str] = None
    email: Optional[str] = None


class UserAuthResponse(BaseModel):
    id: str
    username: str
    telegram_id: Optional[str] = None
    email: Optional[str] = None


class TopicResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None


class LevelResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None


class GenerateExerciseRequest(BaseModel):
    user_id: str
    topic_id: str
    level_id: str
    difficulty: str = Field(default="medium", description="easy, medium, hard")


class GeneratedExerciseResponse(BaseModel):
    sentence_id: str
    vietnamese_text: str
    topic_id: str
    level_id: str
    difficulty: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    user_id: str
    sentence_id: str
    user_answer: str


# =============================================================================
# Endpoints
# =============================================================================

@router.post("/users/login", response_model=UserAuthResponse)
def login_or_register_user(
    payload: UserAuthRequest, db: Session = Depends(get_db)
):
    service = TranslateService(db=db)
    user = service.get_or_create_user(
        username=payload.username,
        telegram_id=payload.telegram_id,
        email=payload.email,
    )
    return UserAuthResponse(
        id=user.id,
        username=user.username,
        telegram_id=user.telegram_id,
        email=user.email,
    )


@router.get("/topics", response_model=List[TopicResponse])
def get_topics(db: Session = Depends(get_db)):
    service = TranslateService(db=db)
    topics = service.get_topics()
    return [
        TopicResponse(id=t.id, name=t.name, description=t.description)
        for t in topics
    ]


@router.get("/levels", response_model=List[LevelResponse])
def get_levels(db: Session = Depends(get_db)):
    service = TranslateService(db=db)
    levels = service.get_levels()
    return [
        LevelResponse(id=l.id, name=l.name, description=l.description)
        for l in levels
    ]


@router.post("/exercise/generate", response_model=GeneratedExerciseResponse)
def generate_exercise(
    payload: GenerateExerciseRequest, db: Session = Depends(get_db)
):
    service = TranslateService(db=db)
    try:
        sentence = service.create_exercise(
            user_id=payload.user_id,
            topic_id=payload.topic_id,
            level_id=payload.level_id,
            difficulty=payload.difficulty,
        )
        return GeneratedExerciseResponse(
            sentence_id=sentence.id,
            vietnamese_text=sentence.vietnamese_text,
            topic_id=sentence.topic_id,
            level_id=sentence.level_id,
            difficulty=sentence.difficulty,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/exercise/submit")
def submit_exercise(
    payload: SubmitAnswerRequest, db: Session = Depends(get_db)
):
    service = TranslateService(db=db)
    try:
        result = service.submit_translation(
            user_id=payload.user_id,
            sentence_id=payload.sentence_id,
            user_answer=payload.user_answer,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/users/{user_id}/stats")
def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    service = TranslateService(db=db)
    return service.get_user_progress(user_id=user_id)
