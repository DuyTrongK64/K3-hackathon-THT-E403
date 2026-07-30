import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import require_admin
from app.models import Company
from app.schemas import CompanyCreate, CompanyRead, CompanyUpdate


router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("", response_model=list[CompanyRead])
async def list_companies(
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
) -> list[Company]:
    statement = select(Company).order_by(Company.name)
    if not include_inactive:
        statement = statement.where(Company.active.is_(True))
    result = await session.scalars(statement)
    return list(result.all())


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(
    company_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Company:
    company = await session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="COMPANY_NOT_FOUND")
    return company


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
