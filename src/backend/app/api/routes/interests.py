import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user
from app.models import Company, CompanyInterest, User
from app.schemas import CompanyInterestStatus


router = APIRouter(prefix="/interests", tags=["Company Interests"])
MAX_INTERESTED_COMPANIES = 3


def _enforce_interest_limit(selected_count: int) -> None:
    if selected_count >= MAX_INTERESTED_COMPANIES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="INTEREST_LIMIT_REACHED",
        )


async def _company_status(
    session: AsyncSession,
    company_id: uuid.UUID,
    user_id: uuid.UUID,
) -> dict:
    interest_count = await session.scalar(
        select(func.count())
        .select_from(CompanyInterest)
        .where(CompanyInterest.company_id == company_id)
    )
    is_interested = bool(
        await session.scalar(
            select(CompanyInterest.user_id).where(
                CompanyInterest.company_id == company_id,
                CompanyInterest.user_id == user_id,
            )
        )
    )
    return {
        "company_id": company_id,
        "interest_count": int(interest_count or 0),
        "is_interested": is_interested,
    }


@router.get("", response_model=list[CompanyInterestStatus])
async def list_interest_statuses(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[dict]:
    company_ids = list(
        (
            await session.scalars(
                select(Company.id)
                .where(Company.active.is_(True))
                .order_by(Company.name)
            )
        ).all()
    )
    if not company_ids:
        return []

    count_rows = await session.execute(
        select(CompanyInterest.company_id, func.count())
        .where(CompanyInterest.company_id.in_(company_ids))
        .group_by(CompanyInterest.company_id)
    )
    counts = {company_id: int(count) for company_id, count in count_rows.all()}
    selected_ids = set(
        (
            await session.scalars(
                select(CompanyInterest.company_id).where(
                    CompanyInterest.user_id == current_user.id,
                    CompanyInterest.company_id.in_(company_ids),
                )
            )
        ).all()
    )
    return [
        {
            "company_id": company_id,
            "interest_count": counts.get(company_id, 0),
            "is_interested": company_id in selected_ids,
        }
        for company_id in company_ids
    ]


@router.post(
    "/{company_id}",
    response_model=CompanyInterestStatus,
    status_code=status.HTTP_201_CREATED,
)
async def follow_company(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    company = await session.get(Company, company_id)
    if not company or not company.active:
        raise HTTPException(status_code=404, detail="COMPANY_NOT_FOUND")

    # Serialize changes per user so simultaneous requests cannot bypass the cap.
    await session.execute(
        select(User.id)
        .where(User.id == current_user.id)
        .with_for_update()
    )
    existing = await session.get(
        CompanyInterest,
        {"user_id": current_user.id, "company_id": company_id},
    )
    if existing:
        return await _company_status(session, company_id, current_user.id)

    selected_count = await session.scalar(
        select(func.count())
        .select_from(CompanyInterest)
        .where(CompanyInterest.user_id == current_user.id)
    )
    try:
        _enforce_interest_limit(int(selected_count or 0))
    except HTTPException:
        await session.rollback()
        raise

    session.add(
        CompanyInterest(user_id=current_user.id, company_id=company_id)
    )
    await session.commit()
    return await _company_status(session, company_id, current_user.id)


@router.delete("/{company_id}", response_model=CompanyInterestStatus)
async def unfollow_company(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    await session.execute(
        delete(CompanyInterest).where(
            CompanyInterest.user_id == current_user.id,
            CompanyInterest.company_id == company_id,
        )
    )
    await session.commit()
    return await _company_status(session, company_id, current_user.id)
