from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[str] = mapped_column(
        primary_key=True,
        default=generate_uuid_hex,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    sentence_id: Mapped[str] = mapped_column(
        ForeignKey("sentences.id"),
        nullable=False,
    )

    user_answer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    is_correct: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )