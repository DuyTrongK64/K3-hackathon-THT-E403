from __future__ import annotations

from collections.abc import Iterable

from app.models import Company, EvaluationCriterion, Portfolio
from app.services.semantic_embedding import (
    EmbeddingBackend,
    cosine_similarity,
    get_embedding_backend,
)


DEFAULT_WEIGHTS = {
    "candidate_wishes": 0.4,
    "required_skills": 0.5,
    "preferred_skills": 0.1,
}
PROFILE_SEMANTIC_WEIGHT = 0.15
MIN_SEMANTIC_MATCH = 0.20


def _normalized(values: Iterable[str]) -> set[str]:
    return {str(value).strip().casefold() for value in values if str(value).strip()}


def _keyword_ratio(candidate: Iterable[str], target: Iterable[str]) -> float:
    """Recall signal for diagnostics only, never the final score or ranking."""

    candidate_set = _normalized(candidate)
    target_set = _normalized(target)
    if not target_set:
        return 0
    return len(candidate_set & target_set) / len(target_set)


def _join(values: Iterable[object]) -> str:
    return ". ".join(str(value).strip() for value in values if str(value).strip())


def _company_requirements(company: Company) -> tuple[list[str], list[str], list[str]]:
    required: list[str] = []
    preferred: list[str] = []
    wishes: list[str] = []
    for job in company.jd_data or []:
        required.extend(job.get("required_skills", []))
        preferred.extend(job.get("preferred_skills", []))
        wishes.extend(job.get("target_wishes", []))
        if job.get("work_mode"):
            wishes.append(job["work_mode"])
    return required, preferred, wishes


def _company_profile_text(
    company: Company,
    required: list[str],
    preferred: list[str],
    wishes: list[str],
) -> str:
    job_context: list[str] = []
    for job in company.jd_data or []:
        job_context.extend(
            [
                job.get("team_name", ""),
                job.get("department", ""),
                job.get("position", ""),
            ]
        )
    return _join(
        [
            company.name,
            company.division,
            company.description,
            company.work_environment,
            *(company.tech_stack or []),
            *job_context,
            *required,
            *preferred,
            *wishes,
        ]
    )


def _portfolio_documents(portfolio: Portfolio) -> tuple[str, str, str]:
    skill_text = _join(portfolio.skills or [])
    wish_text = _join(
        [
            *(portfolio.target_domains or []),
            *(portfolio.work_modes or []),
            *(portfolio.priorities or []),
        ]
    )
    profile_text = _join(
        [
            portfolio.raw_text,
            portfolio.summary,
            skill_text,
            wish_text,
            f"{portfolio.experience_years} years experience",
        ]
    )
    return skill_text or profile_text, wish_text or profile_text, profile_text


def rank_companies(
    portfolio: Portfolio,
    companies: list[Company],
    criteria: list[EvaluationCriterion],
    limit: int = 3,
    *,
    embedding_backend: EmbeddingBackend | None = None,
) -> list[dict]:
    """Rank companies with semantic vectors as the authoritative score.

    Exact keyword recall remains visible for QA, but it is not part of
    ``score`` or the ranking key.
    """

    if limit <= 0 or not companies:
        return []

    active_criteria = [criterion for criterion in criteria if criterion.active]
    configured = {
        criterion.key: max(float(criterion.weight), 0)
        for criterion in active_criteria
    }
    weights = configured or DEFAULT_WEIGHTS
    total_weight = sum(weights.values()) or 1

    candidate_skills = portfolio.skills or []
    candidate_wishes = [
        *(portfolio.target_domains or []),
        *(portfolio.work_modes or []),
        *(portfolio.priorities or []),
    ]
    skill_text, wish_text, profile_text = _portfolio_documents(portfolio)

    company_inputs: list[tuple[Company, list[str], list[str], list[str]]] = []
    texts = [skill_text, wish_text, profile_text]
    for company in companies:
        required, preferred, target_wishes = _company_requirements(company)
        company_inputs.append((company, required, preferred, target_wishes))
        texts.extend(
            [
                _join(required),
                _join(preferred),
                _join(target_wishes),
                _company_profile_text(
                    company,
                    required,
                    preferred,
                    target_wishes,
                ),
            ]
        )

    backend = embedding_backend or get_embedding_backend()
    vectors = backend.embed(texts)
    if len(vectors) != len(texts):
        raise ValueError("EMBEDDING_VECTOR_COUNT_MISMATCH")

    candidate_skill_vector, candidate_wish_vector, candidate_profile_vector = (
        vectors[:3]
    )
    ranked: list[dict] = []
    for index, (company, required, preferred, target_wishes) in enumerate(
        company_inputs
    ):
        offset = 3 + index * 4
        required_vector, preferred_vector, wish_vector, company_profile_vector = (
            vectors[offset : offset + 4]
        )
        semantic_components = {
            "candidate_wishes": cosine_similarity(
                candidate_wish_vector,
                wish_vector,
            ),
            "required_skills": cosine_similarity(
                candidate_skill_vector,
                required_vector,
            ),
            "preferred_skills": cosine_similarity(
                candidate_skill_vector,
                preferred_vector,
            ),
        }
        criteria_semantic = sum(
            semantic_components.get(key, 0) * (weight / total_weight)
            for key, weight in weights.items()
        )
        profile_semantic = cosine_similarity(
            candidate_profile_vector,
            company_profile_vector,
        )
        final_semantic = (
            (1 - PROFILE_SEMANTIC_WEIGHT) * criteria_semantic
            + PROFILE_SEMANTIC_WEIGHT * profile_semantic
        )
        keyword_components = {
            "candidate_wishes": _keyword_ratio(candidate_wishes, target_wishes),
            "required_skills": _keyword_ratio(candidate_skills, required),
            "preferred_skills": _keyword_ratio(candidate_skills, preferred),
        }
        keyword_recall = sum(keyword_components.values()) / len(keyword_components)
        score = min(100, round(final_semantic * 100))
        score_detail = {
            "semantic_candidate_wishes": round(
                semantic_components["candidate_wishes"] * 100,
                2,
            ),
            "semantic_required_skills": round(
                semantic_components["required_skills"] * 100,
                2,
            ),
            "semantic_preferred_skills": round(
                semantic_components["preferred_skills"] * 100,
                2,
            ),
            "semantic_profile": round(profile_semantic * 100, 2),
            "semantic_final": round(final_semantic * 100, 2),
            "keyword_recall": round(keyword_recall * 100, 2),
        }
        semantic_skill_score = max(
            semantic_components["required_skills"],
            semantic_components["preferred_skills"],
        )
        reasons = [
            (
                "Kỹ năng/kinh nghiệm có mức tương đồng ngữ nghĩa cao với JD."
                if semantic_skill_score >= 0.55
                else "Kỹ năng mới tương đồng ngữ nghĩa một phần với JD."
            ),
            (
                "Mong muốn nghề nghiệp phù hợp ngữ nghĩa với định hướng team."
                if semantic_components["candidate_wishes"] >= 0.45
                else "Mong muốn nghề nghiệp chưa tương đồng rõ với định hướng team."
            ),
        ]
        ranked.append(
            {
                "company_id": company.id,
                "company_slug": company.slug,
                "company_name": company.name,
                "score": score,
                "score_detail": score_detail,
                "reasons": reasons,
                "embedding_backend": backend.name,
                "_semantic_sort": final_semantic,
            }
        )

    # Reject the whole ranking when even the best company is unrelated. Once
    # at least one viable semantic match exists, keep the requested Top N and
    # let semantic score determine their complete order.
    best_semantic = max(
        (item["_semantic_sort"] for item in ranked),
        default=0.0,
    )
    viable = ranked if best_semantic >= MIN_SEMANTIC_MATCH else []
    ordered = sorted(
        viable,
        key=lambda item: (
            -item["_semantic_sort"],
            item["company_name"].casefold(),
        ),
    )[:limit]
    for item in ordered:
        item.pop("_semantic_sort", None)
    return ordered
