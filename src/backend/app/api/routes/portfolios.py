import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models import Portfolio, User
from app.schemas import PortfolioRead
from app.services.cv_scanner_tool import scan_cv
from app.services.document_parser import extract_cv_text


router = APIRouter(prefix="/portfolios", tags=["Portfolios"])


class CVTextRequest(BaseModel):
    text: str = Field(min_length=20, max_length=60_000)
    user_id: uuid.UUID | None = None


async def _save_portfolio(
    *,
    session: AsyncSession,
    raw_text: str,
    source_filename: str,
    user_id: uuid.UUID | None,
) -> Portfolio:
    if user_id and not await session.get(User, user_id):
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    structured = await scan_cv(raw_text)
    portfolio = Portfolio(
        user_id=user_id,
        source_filename=source_filename,
        raw_text=raw_text,
        summary=structured.get("summary", ""),
        skills=structured.get("skills", []),
        experience_years=max(float(structured.get("experience_years", 0)), 0),
        target_domains=structured.get("target_domains", []),
        work_modes=structured.get("work_modes", []),
        priorities=structured.get("priorities", []),
        structured_data=structured,
    )
    session.add(portfolio)
    await session.commit()
    await session.refresh(portfolio)
    return portfolio


@router.post(
    "/scan",
    response_model=PortfolioRead,
    status_code=status.HTTP_201_CREATED,
)
async def scan_portfolio_file(
    file: UploadFile = File(...),
    user_id: uuid.UUID | None = Form(default=None),
    session: AsyncSession = Depends(get_session),
) -> Portfolio:
    raw_text = await extract_cv_text(file)
    return await _save_portfolio(
        session=session,
        raw_text=raw_text,
        source_filename=file.filename or "cv",
        user_id=user_id,
    )


@router.post(
    "/scan-text",
    response_model=PortfolioRead,
    status_code=status.HTTP_201_CREATED,
)
async def scan_portfolio_text(
    payload: CVTextRequest,
    session: AsyncSession = Depends(get_session),
) -> Portfolio:
    return await _save_portfolio(
        session=session,
        raw_text=payload.text,
        source_filename="pasted-cv.txt",
        user_id=payload.user_id,
    )


@router.get("/users/{user_id}/latest", response_model=PortfolioRead)
async def get_latest_portfolio(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Portfolio:
    result = await session.scalars(
        select(Portfolio)
        .where(Portfolio.user_id == user_id)
        .order_by(Portfolio.created_at.desc())
        .limit(1)
    )
    portfolio = result.first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="PORTFOLIO_NOT_FOUND")
    return portfolio


@router.get("/{portfolio_id}", response_model=PortfolioRead)
async def get_portfolio(
    portfolio_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Portfolio:
    portfolio = await session.get(Portfolio, portfolio_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="PORTFOLIO_NOT_FOUND")
    return portfolio
