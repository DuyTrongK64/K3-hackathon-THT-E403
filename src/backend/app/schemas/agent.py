import uuid

from pydantic import BaseModel, Field


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    portfolio_id: uuid.UUID | None = None
    history: list[dict[str, str]] = Field(default_factory=list)


class MatchResult(BaseModel):
    company_id: uuid.UUID
    company_slug: str
    company_name: str
    score: int
    score_detail: dict[str, float]
    reasons: list[str]
    embedding_backend: str


class AgentChatResponse(BaseModel):
    intent: str
    answer: str
    matches: list[MatchResult] = Field(default_factory=list)
    tool_trace: list[dict] = Field(default_factory=list)
