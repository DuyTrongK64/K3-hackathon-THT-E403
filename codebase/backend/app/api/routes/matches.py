import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models import Company, EvaluationCriterion, Portfolio, User
from app.schemas import MatchResult
from app.services.matching_tool import rank_companies


router = APIRouter(prefix="/matches", tags=["Matching Tool"])


async def _rank_for_portfolio(
    portfolio_id: uuid.UUID,
    current_user: User,
    session: AsyncSession,
    limit: int,
) -> list[dict]:
    portfolio = await session.get(Portfolio, portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="PORTFOLIO_NOT_FOUND")
    if portfolio.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="PORTFOLIO_ACCESS_DENIED")

    companies_result = await session.scalars(
        select(Company).where(Company.active.is_(True)).order_by(Company.name)
    )
    criteria_result = await session.scalars(
        select(EvaluationCriterion)
        .where(EvaluationCriterion.active.is_(True))
        .order_by(EvaluationCriterion.display_order)
    )
    return rank_companies(
        portfolio,
        list(companies_result.all()),
        list(criteria_result.all()),
        limit=limit,
    )


@router.get("/top/{portfolio_id}", response_model=list[MatchResult])
async def top_matches(
    portfolio_id: uuid.UUID,
    limit: int = Query(default=3, ge=1, le=6),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    return await _rank_for_portfolio(portfolio_id, current_user, session, limit)


@router.get("/top3/{portfolio_id}", response_model=list[MatchResult])
async def top_three_matches(
    portfolio_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    """Backward-compatible endpoint for the existing Top 3 UI."""
    return await _rank_for_portfolio(portfolio_id, current_user, session, 3)
