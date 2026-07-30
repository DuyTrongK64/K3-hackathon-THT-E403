from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models import Portfolio, User
from app.schemas import AgentChatRequest, AgentChatResponse
from app.services.agent_router import process_agent_message


router = APIRouter(prefix="/agent", tags=["AI Agent"])


@router.post("/chat", response_model=AgentChatResponse)
async def chat(
    payload: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    if payload.portfolio_id:
        portfolio = await session.get(Portfolio, payload.portfolio_id)
        if not portfolio:
            raise HTTPException(status_code=404, detail="PORTFOLIO_NOT_FOUND")
        if portfolio.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="PORTFOLIO_ACCESS_DENIED")
    return await process_agent_message(
        session=session,
        message=payload.message,
        portfolio_id=payload.portfolio_id,
        history=payload.history,
    )
