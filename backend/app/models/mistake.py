from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex


class Mistake(Base):
    __tablename__ = "mistakes"

    id: Mapped[str] = mapped_column(
        primary_key=True,
        default=generate_uuid_hex,
    )

    attempt_id: Mapped[str] = mapped_column(
        ForeignKey("attempts.id"),
        nullable=False,
    )

    mistake_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    mistake_subtype: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    wrong_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    correct_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    explanation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )