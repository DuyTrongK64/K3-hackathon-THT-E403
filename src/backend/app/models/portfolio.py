from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Portfolio(TimestampMixin, Base):
    __tablename__ = "portfolios"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    source_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    experience_years: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    target_domains: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    work_modes: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    priorities: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    structured_data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    user: Mapped[User | None] = relationship(back_populates="portfolios")
