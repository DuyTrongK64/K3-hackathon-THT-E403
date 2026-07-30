import csv
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Company, EvaluationCriterion


DATA_DIR = Path(__file__).resolve().parents[1] / "data"

DEFAULT_CRITERIA = [
    {
        "key": "candidate_wishes",
        "label": "Mong muốn ứng viên",
        "description": "Domain, định hướng và môi trường làm việc mong muốn.",
        "weight": Decimal("0.40"),
        "display_order": 1,
    },
    {
        "key": "required_skills",
        "label": "Kỹ năng bắt buộc",
        "description": "Mức khớp với yêu cầu chính của nhà tuyển dụng.",
        "weight": Decimal("0.50"),
        "display_order": 2,
    },
    {
        "key": "preferred_skills",
        "label": "Kỹ năng ưu tiên",
        "description": "Các kỹ năng tạo lợi thế nhưng không bắt buộc.",
        "weight": Decimal("0.10"),
        "display_order": 3,
    },
]


def _split(value: str) -> list[str]:
    return [item.strip() for item in (value or "").split("|") if item.strip()]


async def seed_database(session: AsyncSession) -> None:
    company_count = await session.scalar(select(func.count()).select_from(Company))
    if not company_count:
        jobs_by_company: dict[str, list[dict]] = defaultdict(list)
        with (DATA_DIR / "careerPages.csv").open(encoding="utf-8") as file:
            for row in csv.DictReader(file):
                jobs_by_company[row["company_id"]].append(
                    {
                        "id": row["id"],
                        "team_id": row["team_id"],
                        "team_name": row["team_name"],
                        "department": row["department"],
                        "position": row["position"],
                        "source_url": row["url"],
                        "required_skills": _split(row["required_skills"]),
                        "preferred_skills": _split(row["preferred_skills"]),
                        "target_wishes": _split(row["target_wishes"]),
                        "work_mode": row["work_mode"],
                        "slots": int(row["slots"] or 0),
                        "applicants": int(row["applicants"] or 0),
                    }
                )
        with (DATA_DIR / "companies.csv").open(encoding="utf-8") as file:
            for row in csv.DictReader(file):
                jobs = jobs_by_company[row["id"]]
                tech_stack = sorted(
                    {
                        skill
                        for job in jobs
                        for skill in [
                            *job["required_skills"],
                            *job["preferred_skills"],
                        ]
                    }
                )
                session.add(
                    Company(
                        slug=row["id"],
                        name=row["name"],
                        division=row["division"],
                        description=row["summary"],
                        locations=_split(row["location"]),
                        tech_stack=tech_stack,
                        work_environment=", ".join(
                            sorted({job["work_mode"] for job in jobs})
                        ),
                        fresher_score=float(row["fresher_friendly"] or 0),
                        open_roles=sum(int(job["slots"]) for job in jobs),
                        jd_data=jobs,
                    )
                )

    criterion_count = await session.scalar(
        select(func.count()).select_from(EvaluationCriterion)
    )
    if not criterion_count:
        for criterion in DEFAULT_CRITERIA:
            session.add(EvaluationCriterion(**criterion))

    await session.commit()
