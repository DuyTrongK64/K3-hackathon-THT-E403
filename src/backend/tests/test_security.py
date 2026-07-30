import uuid

import jwt
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    hash_password,
    require_admin,
    verify_password,
)
from app.models import User
from app.schemas import RegisterRequest


def make_user(role: str = "user") -> User:
    return User(
        id=uuid.uuid4(),
        email=f"{role}@example.com",
        full_name=role.title(),
        password_hash=hash_password("StrongPass123!"),
        role=role,
    )


def test_password_hash_and_jwt_claims() -> None:
    user = make_user("admin")
    assert verify_password("StrongPass123!", user.password_hash)
    assert not verify_password("wrong-password", user.password_hash)

    settings = get_settings()
    payload = jwt.decode(
        create_access_token(user),
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    assert payload["sub"] == str(user.id)
    assert payload["role"] == "admin"
    assert payload["email"] == user.email


@pytest.mark.asyncio
async def test_rbac_rejects_non_admin() -> None:
    with pytest.raises(HTTPException) as error:
        await require_admin(make_user("user"))
    assert error.value.status_code == 403
    assert error.value.detail == "ADMIN_ROLE_REQUIRED"


def test_registration_requires_strong_minimum_length() -> None:
    with pytest.raises(ValidationError):
        RegisterRequest(
            email="student@example.com",
            full_name="Student",
            password="short",
        )
