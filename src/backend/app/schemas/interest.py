import uuid

from pydantic import BaseModel, Field


class CompanyInterestStatus(BaseModel):
    company_id: uuid.UUID
    interest_count: int = Field(ge=0)
    is_interested: bool
