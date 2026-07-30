import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import get_current_user, require_admin
from app.models import User
from app.schemas import UserRead


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_admin)])
async def list_users(
    session: AsyncSession = Depends(get_session),
) -> list[User]:
    result = await session.scalars(select(User).order_by(User.created_at.desc()))
    return list(result.all())


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="USER_ACCESS_DENIED")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="USER_NOT_FOUND")
    return user
