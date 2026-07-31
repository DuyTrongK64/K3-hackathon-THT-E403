import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PortfolioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID | None
    source_filename: str
    summary: str
    skills: list[str]
    experience_years: float
    target_domains: list[str]
    work_modes: list[str]
    priorities: list[str]
    structured_data: dict
    created_at: datetime
    updated_at: datetime
