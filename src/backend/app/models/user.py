from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin

if TYPE_CHECKING:
    from app.models.portfolio import Portfolio


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        index=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    password_hash: Mapped[str] = mapped_column(
        String(255),
        default="",
        server_default="",
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(30), default="user", nullable=False)

    portfolios: Mapped[list[Portfolio]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
