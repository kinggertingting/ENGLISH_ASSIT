import sqlalchemy
from sqlalchemy.orm import Mapped

from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex
class Users(Base):
    __tablename__ = "users"

    id: Mapped[str] = sqlalchemy.orm.mapped_column(primary_key=True, default=generate_uuid_hex)
    username: Mapped[str] = sqlalchemy.orm.mapped_column(unique=True, nullable=False)
    password: Mapped[str] = sqlalchemy.orm.mapped_column(nullable=True)
    email:Mapped[str] = sqlalchemy.orm.mapped_column(unique=True, nullable=True)
    telegram_id:Mapped[str] = sqlalchemy.orm.mapped_column(unique=True, nullable=True)