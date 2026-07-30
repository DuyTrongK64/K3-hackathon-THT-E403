import uuid
from decimal import Decimal

from app.models import Company, EvaluationCriterion, Portfolio
from app.services.matching_tool import rank_companies


def criterion(key: str, weight: str) -> EvaluationCriterion:
    return EvaluationCriterion(
        id=uuid.uuid4(),
        key=key,
        label=key,
        weight=Decimal(weight),
        active=True,
    )


def company(name: str, required: list[str], wishes: list[str]) -> Company:
    return Company(
        id=uuid.uuid4(),
        slug=name.casefold(),
        name=name,
        division="Technology",
        jd_data=[
            {
                "required_skills": required,
                "preferred_skills": ["Git"],
                "target_wishes": wishes,
                "work_mode": "Hybrid",
            }
        ],
    )


def test_matching_prioritizes_skills_and_candidate_wishes() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="cv.pdf",
        raw_text="React Python",
        skills=["React", "Git"],
        target_domains=["Fintech"],
        work_modes=["Hybrid"],
        priorities=["Product"],
    )
    companies = [
        company("OneMount", ["React", "Git"], ["Fintech", "Product"]),
        company("VinAI", ["Python", "PyTorch"], ["AI Research"]),
    ]
    criteria = [
        criterion("candidate_wishes", "0.40"),
        criterion("required_skills", "0.50"),
        criterion("preferred_skills", "0.10"),
    ]

    result = rank_companies(portfolio, companies, criteria)

    assert result[0]["company_name"] == "OneMount"
    assert result[0]["score"] > result[1]["score"]
    assert set(result[0]["score_detail"]) == {
        "candidate_wishes",
        "required_skills",
        "preferred_skills",
    }


def test_matching_has_no_salary_dimension() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="cv.pdf",
        raw_text="Python",
        skills=["Python"],
        target_domains=["AI"],
        work_modes=[],
        priorities=[],
    )
    result = rank_companies(
        portfolio,
        [company("VinAI", ["Python"], ["AI"])],
        [criterion("required_skills", "1.0")],
    )

    assert "salary" not in result[0]["score_detail"]
    assert all("lương" not in reason.casefold() for reason in result[0]["reasons"])


def test_matching_returns_exact_requested_limit() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="cv.pdf",
        raw_text="React Git",
        skills=["React", "Git"],
        target_domains=["Product"],
        work_modes=["Hybrid"],
        priorities=[],
    )
    companies = [
        company(f"Company{index}", ["React"], ["Product"])
        for index in range(1, 7)
    ]

    result = rank_companies(
        portfolio,
        companies,
        [criterion("required_skills", "1.0")],
        limit=5,
    )

    assert len(result) == 5
    assert [item["company_name"] for item in result] == [
        "Company1",
        "Company2",
        "Company3",
        "Company4",
        "Company5",
    ]
