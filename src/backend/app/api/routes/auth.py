from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserRead


router = APIRouter(prefix="/auth", tags=["Authentication"])


async def _authenticate(
    email: str,
    password: str,
    session: AsyncSession,
) -> User:
    result = await session.scalars(
        select(User).where(User.email == email.casefold())
    )
    user = result.first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="AUTH_CREDENTIALS_INVALID")
    return user


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    user = User(
        email=str(payload.email).casefold(),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        role="user",
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status_code=409, detail="USER_EMAIL_EXISTS") from error
    await session.refresh(user)
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    user = await _authenticate(str(payload.email), payload.password, session)
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": user,
    }


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def oauth_token(
    form: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
) -> dict:
    user = await _authenticate(form.username, form.password, session)
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
