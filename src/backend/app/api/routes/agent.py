from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas import AgentChatRequest, AgentChatResponse
from app.services.agent_router import process_agent_message


router = APIRouter(prefix="/agent", tags=["AI Agent"])


@router.post("/chat", response_model=AgentChatResponse)
async def chat(
    payload: AgentChatRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    return await process_agent_message(
        session=session,
        message=payload.message,
        portfolio_id=payload.portfolio_id,
        history=payload.history,
    )
