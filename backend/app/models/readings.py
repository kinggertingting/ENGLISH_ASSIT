import sqlalchemy
from sqlalchemy.orm import Mapped
from app.database.base import Base
from app.func_assit.func_support import generate_uuid_hex

class Readings(Base):

    __tablename__ = "readings"

    id: Mapped[str] = sqlalchemy.orm.mapped_column(primary_key=True, default=generate_uuid_hex)
    title: Mapped[str] = sqlalchemy.orm.mapped_column(sqlalchemy.String, nullable=False)
    content: Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.String, nullable=True)
    source: Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.String, nullable=True)
    level: Mapped[str | None] = sqlalchemy.orm.mapped_column(sqlalchemy.String, nullable=True)