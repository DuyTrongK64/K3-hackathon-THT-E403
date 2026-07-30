import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user, require_admin
from app.models import EvaluationCriterion, User
from app.schemas import CriterionCreate, CriterionRead, CriterionUpdate


router = APIRouter(prefix="/criteria", tags=["Evaluation criteria"])


@router.get("", response_model=list[CriterionRead])
async def list_criteria(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[EvaluationCriterion]:
    statement = select(EvaluationCriterion).order_by(
        EvaluationCriterion.display_order,
        EvaluationCriterion.label,
    )
    if not include_inactive or current_user.role != "admin":
        statement = statement.where(EvaluationCriterion.active.is_(True))
    result = await session.scalars(statement)
    return list(result.all())


@router.post(
    "",
    response_model=CriterionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_criterion(
    payload: CriterionCreate,
    session: AsyncSession = Depends(get_session),
) -> EvaluationCriterion:
    criterion = EvaluationCriterion(**payload.model_dump())
    session.add(criterion)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="CRITERION_KEY_EXISTS") from error
    await session.refresh(criterion)
    return criterion


@router.patch(
    "/{criterion_id}",
    response_model=CriterionRead,
    dependencies=[Depends(require_admin)],
)
async def update_criterion(
    criterion_id: uuid.UUID,
    payload: CriterionUpdate,
    session: AsyncSession = Depends(get_session),
) -> EvaluationCriterion:
    criterion = await session.get(EvaluationCriterion, criterion_id)
    if not criterion:
        raise HTTPException(status_code=404, detail="CRITERION_NOT_FOUND")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(criterion, key, value)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="CRITERION_KEY_EXISTS") from error
    await session.refresh(criterion)
    return criterion


@router.delete(
    "/{criterion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_criterion(
    criterion_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Response:
    criterion = await session.get(EvaluationCriterion, criterion_id)
    if not criterion:
        raise HTTPException(status_code=404, detail="CRITERION_NOT_FOUND")
    await session.delete(criterion)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
