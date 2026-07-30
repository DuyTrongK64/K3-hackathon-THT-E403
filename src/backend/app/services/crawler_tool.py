from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Company


async def crawl_companies(session: AsyncSession) -> list[Company]:
    """Tool 1: database-backed crawler output used by Agent and Matching."""
    result = await session.scalars(
        select(Company).where(Company.active.is_(True)).order_by(Company.name)
    )
    return list(result.all())


def _unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        cleaned = str(value or "").strip()
        key = cleaned.casefold()
        if cleaned and key not in seen:
            seen.add(key)
            result.append(cleaned)
    return result


def analyze_company(company: Company) -> dict:
    """Tool 1: turn stored JD data into one grounded company evaluation.

    The output deliberately excludes interview steps, pros and cons. It is the
    only payload consumed by the public company-detail pop-up.
    """
    jobs = company.jd_data or []
    required_skills = _unique(
        [
            skill
            for job in jobs
            for skill in (job.get("required_skills") or [])
        ]
    )
    preferred_skills = _unique(
        [
            skill
            for job in jobs
            for skill in (job.get("preferred_skills") or [])
        ]
    )
    focus_areas = _unique(
        [
            company.division,
            *[
                value
                for job in jobs
                for value in (
                    job.get("department"),
                    job.get("team_name"),
                    *(job.get("target_wishes") or []),
                )
            ],
        ]
    )
    opportunities = [
        {
            "position": job.get("position") or "Vị trí đang cập nhật",
            "department": job.get("department") or company.division,
            "team_name": job.get("team_name") or "Nhóm dự án đang cập nhật",
            "work_mode": job.get("work_mode") or company.work_environment,
        }
        for job in jobs
    ]

    return {
        "company_id": company.id,
        "company_name": company.name,
        "business_direction": company.description
        or f"{company.name} tập trung vào lĩnh vực {company.division}.",
        "company_requirements": required_skills + [
            f"Ưu tiên: {skill}" for skill in preferred_skills
        ],
        "focus_areas": focus_areas,
        "tech_stack": _unique([*(company.tech_stack or []), *required_skills]),
        "work_environment": company.work_environment or "Đang cập nhật",
        "current_opportunities": opportunities,
        "source": "tool_1",
    }
