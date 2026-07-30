import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user, require_admin
from app.models import Company, User
from app.schemas import CompanyAnalysis, CompanyCreate, CompanyRead, CompanyUpdate
from app.services.crawler_tool import analyze_company


router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=list[CompanyRead])
async def list_companies(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[Company]:
    statement = select(Company).order_by(Company.name)
    if not include_inactive or current_user.role != "admin":
        statement = statement.where(Company.active.is_(True))
    result = await session.scalars(statement)
    return list(result.all())


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(
    company_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Company:
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="COMPANY_NOT_FOUND")
    return company


@router.get("/{company_id}/analysis", response_model=CompanyAnalysis)
async def get_company_analysis(
    company_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    company = await session.get(Company, company_id)
    if not company or not company.active:
        raise HTTPException(status_code=404, detail="COMPANY_NOT_FOUND")
    return analyze_company(company)


@router.post(
    "",
    response_model=CompanyRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_company(
    payload: CompanyCreate,
    session: AsyncSession = Depends(get_session),
) -> Company:
    company = Company(**payload.model_dump())
    session.add(company)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="COMPANY_SLUG_EXISTS") from error
    await session.refresh(company)
    return company


@router.patch(
    "/{company_id}",
    response_model=CompanyRead,
    dependencies=[Depends(require_admin)],
)
async def update_company(
    company_id: uuid.UUID,
    payload: CompanyUpdate,
    session: AsyncSession = Depends(get_session),
) -> Company:
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="COMPANY_NOT_FOUND")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="COMPANY_SLUG_EXISTS") from error
    await session.refresh(company)
    return company


@router.delete(
    "/{company_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_company(
    company_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Response:
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="COMPANY_NOT_FOUND")
    await session.delete(company)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
