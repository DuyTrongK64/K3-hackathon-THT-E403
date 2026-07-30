import secrets
from typing import Annotated

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_admin(
    x_admin_key: Annotated[str | None, Header()] = None,
) -> None:
    configured_key = get_settings().admin_api_key
    if not x_admin_key or not secrets.compare_digest(x_admin_key, configured_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ADMIN_API_KEY_INVALID",
        )
