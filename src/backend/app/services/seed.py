import csv
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.models import Company, EvaluationCriterion, User


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

INTERVIEW_PROCESS = [
    {
        "title": "CV & Motivation Screening",
        "detail": "Trao đổi về dự án, mục tiêu thực tập và mức phù hợp với team.",
    },
    {
        "title": "Technical Interview",
        "detail": "Kiểm tra nền tảng, coding và cách giải quyết bài toán theo vị trí.",
    },
    {
        "title": "Team Fit & Offer",
        "detail": "Trao đổi với quản lý về cách cộng tác, lộ trình học và kỳ vọng.",
    },
]

COMPANY_NOTES = {
    "vinfast": {
        "pros": ["Sản phẩm quy mô lớn", "Va chạm nhiều hệ thống", "Domain toàn cầu"],
        "cons": ["Nhịp độ nhanh", "Một số team onsite"],
    },
    "vinai": {
        "pros": ["Mentor AI chuyên sâu", "Bài toán nghiên cứu thực tế"],
        "cons": ["Yêu cầu nền tảng cao", "Cần chủ động đọc paper"],
    },
    "vinbigdata": {
        "pros": ["Dữ liệu quy mô lớn", "Lộ trình Data/AI rõ ràng"],
        "cons": ["Pipeline phức tạp", "Cần Python/SQL chắc"],
    },
    "onemount": {
        "pros": ["Product mindset rõ", "Phản hồi nhanh", "Thân thiện Fresher"],
        "cons": ["Nhịp release nhanh", "Cần giao tiếp chủ động"],
    },
    "vinbrain": {
        "pros": ["Bài toán HealthTech có tác động", "Quy trình sản phẩm chặt chẽ"],
        "cons": ["Domain y tế cần học thêm", "Tiêu chuẩn chất lượng cao"],
    },
    "vincss": {
        "pros": ["Bài toán an toàn thông tin thực tế", "Tiếp xúc IoT và Identity"],
        "cons": ["Cần nền tảng hệ thống", "Một số vị trí onsite"],
    },
}


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
                        "responsibilities": [
                            f"Tham gia phát triển và kiểm thử cho vị trí {row['position']}.",
                            "Phối hợp cùng mentor và các thành viên trong project team.",
                            "Viết tài liệu, review code và báo cáo tiến độ theo sprint.",
                        ],
                        "interview_process": INTERVIEW_PROCESS,
                        "pros": COMPANY_NOTES.get(
                            row["company_id"], {}
                        ).get("pros", []),
                        "cons": COMPANY_NOTES.get(
                            row["company_id"], {}
                        ).get("cons", []),
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

    # Backfill detail fields for databases seeded by an earlier version.
    companies = list((await session.scalars(select(Company))).all())
    for company in companies:
        enriched_jobs = []
        changed = False
        for job in company.jd_data or []:
            next_job = dict(job)
            defaults = {
                "responsibilities": [
                    f"Tham gia phát triển và kiểm thử cho vị trí "
                    f"{job.get('position', 'thực tập sinh')}.",
                    "Phối hợp cùng mentor và project team theo sprint.",
                ],
                "interview_process": INTERVIEW_PROCESS,
                "pros": COMPANY_NOTES.get(company.slug, {}).get("pros", []),
                "cons": COMPANY_NOTES.get(company.slug, {}).get("cons", []),
            }
            for key, value in defaults.items():
                if key not in next_job:
                    next_job[key] = value
                    changed = True
            enriched_jobs.append(next_job)
        if changed:
            company.jd_data = enriched_jobs

    criterion_count = await session.scalar(
        select(func.count()).select_from(EvaluationCriterion)
    )
    if not criterion_count:
        for criterion in DEFAULT_CRITERIA:
            session.add(EvaluationCriterion(**criterion))

    settings = get_settings()
    if settings.seed_admin_email and settings.seed_admin_password:
        admin_result = await session.scalars(
            select(User).where(User.email == settings.seed_admin_email.casefold())
        )
        admin = admin_result.first()
        if not admin:
            session.add(
                User(
                    email=settings.seed_admin_email.casefold(),
                    full_name=settings.seed_admin_name,
                    password_hash=hash_password(settings.seed_admin_password),
                    role="admin",
                )
            )
        elif not verify_password(settings.seed_admin_password, admin.password_hash):
            admin.password_hash = hash_password(settings.seed_admin_password)
            admin.role = "admin"

    await session.commit()
