import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=160)


class UserRead(UserCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    created_at: datetime
    updated_at: datetime
