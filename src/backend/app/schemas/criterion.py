import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CriterionBase(BaseModel):
    key: str = Field(min_length=2, max_length=80)
    label: str = Field(min_length=2, max_length=160)
    description: str = ""
    weight: Decimal = Field(default=Decimal("0"), ge=0, le=1)
    max_score: int = Field(default=100, ge=1, le=100)
    display_order: int = 0
    active: bool = True


class CriterionCreate(CriterionBase):
    pass


class CriterionUpdate(BaseModel):
    key: str | None = None
    label: str | None = None
    description: str | None = None
    weight: Decimal | None = Field(default=None, ge=0, le=1)
    max_score: int | None = Field(default=None, ge=1, le=100)
    display_order: int | None = None
    active: bool | None = None


class CriterionRead(CriterionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
