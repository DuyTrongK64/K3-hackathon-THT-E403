import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompanyBase(BaseModel):
    slug: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=160)
    division: str = Field(min_length=2, max_length=120)
    description: str = ""
    locations: list[str] = Field(default_factory=list)
    tech_stack: list[str] = Field(default_factory=list)
    work_environment: str = "Đang cập nhật"
    fresher_score: float = Field(default=0, ge=0, le=5)
    open_roles: int = Field(default=0, ge=0)
    jd_data: list[dict] = Field(default_factory=list)
    active: bool = True


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=2, max_length=80)
    name: str | None = Field(default=None, min_length=2, max_length=160)
    division: str | None = None
    description: str | None = None
    locations: list[str] | None = None
    tech_stack: list[str] | None = None
    work_environment: str | None = None
    fresher_score: float | None = Field(default=None, ge=0, le=5)
    open_roles: int | None = Field(default=None, ge=0)
    jd_data: list[dict] | None = None
    active: bool | None = None


class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
