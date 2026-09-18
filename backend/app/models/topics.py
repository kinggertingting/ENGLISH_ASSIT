from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex


class Topics(Base):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(
        primary_key=True,
        default=generate_uuid_hex,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )