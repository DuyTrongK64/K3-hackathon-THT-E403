from collections.abc import Iterable

from app.models import Company, EvaluationCriterion, Portfolio


DEFAULT_WEIGHTS = {
    "candidate_wishes": 0.4,
    "required_skills": 0.5,
    "preferred_skills": 0.1,
}


def _normalized(values: Iterable[str]) -> set[str]:
    return {str(value).strip().casefold() for value in values if str(value).strip()}


def _ratio(candidate: Iterable[str], target: Iterable[str]) -> float:
    candidate_set = _normalized(candidate)
    target_set = _normalized(target)
    if not target_set:
        return 0
    return len(candidate_set & target_set) / len(target_set)


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


def rank_companies(
    portfolio: Portfolio,
    companies: list[Company],
    criteria: list[EvaluationCriterion],
    limit: int = 3,
) -> list[dict]:
    active_criteria = [criterion for criterion in criteria if criterion.active]
    configured = {
        criterion.key: float(criterion.weight) for criterion in active_criteria
    }
    weights = configured or DEFAULT_WEIGHTS
    total_weight = sum(max(weight, 0) for weight in weights.values()) or 1
    candidate_wishes = [
        *(portfolio.target_domains or []),
        *(portfolio.work_modes or []),
        *(portfolio.priorities or []),
    ]

    ranked: list[dict] = []
    for company in companies:
        required, preferred, target_wishes = _company_requirements(company)
        ratios = {
            "candidate_wishes": _ratio(candidate_wishes, target_wishes),
            "required_skills": _ratio(portfolio.skills, required),
            "preferred_skills": _ratio(portfolio.skills, preferred),
        }
        score_detail = {
            key: round(ratios.get(key, 0) * (weight / total_weight) * 100, 2)
            for key, weight in weights.items()
        }
        score = min(100, round(sum(score_detail.values())))
        matched_required = sorted(_normalized(portfolio.skills) & _normalized(required))
        reasons = [
            (
                f"Khớp {len(matched_required)}/{len(_normalized(required))} "
                "kỹ năng bắt buộc."
            ),
            (
                "Mong muốn nghề nghiệp phù hợp với định hướng team."
                if ratios["candidate_wishes"] > 0
                else "Chưa thấy mong muốn nghề nghiệp trùng rõ với team."
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
            }
        )

    return sorted(ranked, key=lambda item: item["score"], reverse=True)[:limit]
