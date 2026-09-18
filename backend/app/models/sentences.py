from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex


class Sentence(Base):
    __tablename__ = "sentences"

    id: Mapped[str] = mapped_column(
        primary_key=True,
        default=generate_uuid_hex,
    )

    vietnamese_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    english_answer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    level_id: Mapped[str] = mapped_column(
        ForeignKey("levels.id"),
        nullable=False,
    )

    topic_id: Mapped[str] = mapped_column(
        ForeignKey("topics.id"),
        nullable=False,
    )

    difficulty: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )