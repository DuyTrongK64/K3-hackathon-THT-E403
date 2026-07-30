import uuid

from sqlalchemy import Boolean, Float, Integer, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    slug: Mapped[str] = mapped_column(
        String(80),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    division: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    locations: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    tech_stack: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    work_environment: Mapped[str] = mapped_column(
        String(180),
        default="Đang cập nhật",
        nullable=False,
    )
    fresher_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    open_roles: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    jd_data: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
