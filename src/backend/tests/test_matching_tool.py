import uuid
from decimal import Decimal

from app.models import Company, EvaluationCriterion, Portfolio
from app.services.matching_tool import rank_companies
from app.services.semantic_embedding import (
    DomainHashEmbeddingBackend,
    cosine_similarity,
)


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

    result = rank_companies(
        portfolio,
        companies,
        criteria,
        embedding_backend=DomainHashEmbeddingBackend(),
    )

    assert result[0]["company_name"] == "OneMount"
    assert result[0]["score"] > result[1]["score"]
    assert result[0]["score_detail"]["semantic_final"] > 0
    assert result[0]["score_detail"]["semantic_required_skills"] > 0
    assert "keyword_recall" in result[0]["score_detail"]


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
        embedding_backend=DomainHashEmbeddingBackend(),
    )

    assert "salary" not in result[0]["score_detail"]
    assert all("lương" not in reason.casefold() for reason in result[0]["reasons"])


def test_matching_returns_exact_requested_limit() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="cv.pdf",
        raw_text="React Git",
        skills=["React", "Git"],
        target_domains=[],
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
        embedding_backend=DomainHashEmbeddingBackend(),
    )

    assert len(result) == 5
    assert [item["company_name"] for item in result] == [
        "Company1",
        "Company2",
        "Company3",
        "Company4",
        "Company5",
    ]


def test_semantic_matching_understands_equivalent_skill_phrases() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="cv.pdf",
        raw_text="Từng phát triển giao diện bằng một front-end framework.",
        skills=["Front-end framework"],
        target_domains=["Product"],
        work_modes=[],
        priorities=[],
    )
    companies = [
        company("ReactTeam", ["ReactJS"], []),
        company("PythonTeam", ["Python"], []),
    ]

    result = rank_companies(
        portfolio,
        companies,
        [criterion("required_skills", "1.0")],
        embedding_backend=DomainHashEmbeddingBackend(),
    )

    assert result[0]["company_name"] == "ReactTeam"
    assert result[0]["score_detail"]["keyword_recall"] == 0
    assert result[0]["score_detail"]["semantic_required_skills"] >= 99
    assert result[0]["embedding_backend"] == "domain-hash-v1"


def test_semantic_embedding_understands_leadership_equivalence() -> None:
    backend = DomainHashEmbeddingBackend()
    leadership, team_management = backend.embed(["Leadership", "Quản lý nhóm"])

    assert cosine_similarity(leadership, team_management) >= 0.99


class OrderedSemanticBackend:
    name = "test-semantic"

    def embed(self, texts: list[str]) -> list[list[float]]:
        assert len(texts) == 11
        return [
            [1.0, 0.0],
            [1.0, 0.0],
            [1.0, 0.0],
            *([[0.0, 1.0]] * 4),
            *([[1.0, 0.0]] * 4),
        ]


def test_final_ranking_is_semantic_not_keyword_exact_match() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="cv.pdf",
        raw_text="React developer",
        skills=["React"],
        target_domains=["Product"],
        work_modes=[],
        priorities=[],
    )
    exact_keyword_company = company("ExactKeyword", ["React"], ["Product"])
    semantic_company = company(
        "SemanticMeaning",
        ["Front-end framework"],
        ["Sản phẩm"],
    )

    result = rank_companies(
        portfolio,
        [exact_keyword_company, semantic_company],
        [criterion("required_skills", "1.0")],
        embedding_backend=OrderedSemanticBackend(),
    )

    assert result[0]["company_name"] == "SemanticMeaning"
    assert result[0]["score_detail"]["semantic_final"] >= 99
    assert result[0]["score_detail"]["semantic_final"] > result[1]["score_detail"][
        "semantic_final"
    ]


def test_semantic_noise_does_not_force_irrelevant_top_companies() -> None:
    portfolio = Portfolio(
        id=uuid.uuid4(),
        source_filename="accounting.pdf",
        raw_text="Kế toán tài chính, kiểm toán và lập báo cáo thuế.",
        skills=["Kế toán", "Kiểm toán", "Báo cáo thuế"],
        target_domains=["Tài chính kế toán"],
        work_modes=[],
        priorities=[],
    )

    result = rank_companies(
        portfolio,
        [
            company("ReactTeam", ["ReactJS", "TypeScript"], ["Product"]),
            company("AITeam", ["Python", "PyTorch"], ["AI Research"]),
        ],
        [criterion("required_skills", "1.0")],
        embedding_backend=DomainHashEmbeddingBackend(),
    )

    assert result == []
