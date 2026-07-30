from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Company


async def crawl_companies(session: AsyncSession) -> list[Company]:
    """Tool 1: database-backed crawler output used by Agent and Matching."""
    result = await session.scalars(
        select(Company).where(Company.active.is_(True)).order_by(Company.name)
    )
    return list(result.all())
