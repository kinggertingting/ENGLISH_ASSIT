import sqlalchemy
from sqlalchemy.orm import Mapped
from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex

class Levels(Base):

    __tablename__ = "levels"

    id: Mapped[str] = sqlalchemy.orm.mapped_column(primary_key=True, default=generate_uuid_hex)
    name: Mapped[str] = sqlalchemy.orm.mapped_column(sqlalchemy.String, nullable=False)
    description: Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.String, nullable=True)