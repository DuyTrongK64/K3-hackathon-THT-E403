import json
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EvaluationCriterion, Portfolio
from app.services.crawler_tool import crawl_companies
from app.services.groq_client import structured_completion
from app.services.matching_tool import rank_companies


ANSWER_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["answer"],
    "properties": {"answer": {"type": "string"}},
}


def _normalize(value: str) -> str:
    return value.casefold().strip()


def _is_first_person_question(value: str) -> bool:
    return bool(
        re.search(
            r"(^|\W)(tôi|toi|mình|minh|của tôi|cua toi|cv của tôi|cv cua toi)(\W|$)",
            value,
        )
    )


def _requested_match_limit(value: str) -> int:
    match = re.search(r"\btop\s*(\d+)\b", value)
    return min(max(int(match.group(1)), 1), 6) if match else 3


async def process_agent_message(
    *,
    session: AsyncSession,
    message: str,
    portfolio_id=None,
    history: list[dict] | None = None,
) -> dict:
    normalized = _normalize(message)
    trace = [{"tool": "agent", "state": "done", "message": "Đã phân tích ý định."}]
    is_personal = _is_first_person_question(normalized)

    # Zero-tolerance fallback: do not call any tool or LLM without CV context.
    if is_personal and not portfolio_id:
        return {
            "intent": "personal_question",
            "answer": "Không biết bạn là ai, hãy thêm CV",
            "matches": [],
            "tool_trace": trace,
        }

    portfolio = None
    if portfolio_id:
        portfolio = await session.get(Portfolio, portfolio_id)
        if not portfolio:
            return {
                "intent": "personal_question" if is_personal else "match_cv",
                "answer": (
                    "Không biết bạn là ai, hãy thêm CV"
                    if is_personal
                    else "Không tìm thấy Portfolio. Vui lòng tải lại CV."
                ),
                "matches": [],
                "tool_trace": trace,
            }

    companies = await crawl_companies(session)

    match_phrases = ("phù hợp", "phu hop", "hợp với cv", "hop voi cv")
    asks_for_ranking = (
        any(phrase in normalized for phrase in match_phrases)
        or bool(re.search(r"\btop\s*\d+\b", normalized))
    )
    if asks_for_ranking:
        if not portfolio:
            return {
                "intent": "match_cv",
                "answer": "Hãy tải CV tại trang Portfolio trước để nhận Top 3 phù hợp.",
                "matches": [],
                "tool_trace": trace,
            }
        limit = _requested_match_limit(normalized)
        criteria_result = await session.scalars(
            select(EvaluationCriterion)
            .where(EvaluationCriterion.active.is_(True))
            .order_by(EvaluationCriterion.display_order)
        )
        matches = rank_companies(
            portfolio,
            companies,
            list(criteria_result.all()),
            limit=limit,
        )
        trace.append(
            {
                "tool": "matching",
                "state": "done",
                "message": "Đã chấm điểm bằng tiêu chí trong PostgreSQL.",
            }
        )
        answer = "Chưa có công ty đủ dữ liệu để xếp hạng."
        if matches:
            ranking = [
                (
                    f"{index}. {match['company_name']} — {match['score']}%: "
                    f"{' '.join(match['reasons'])}"
                )
                for index, match in enumerate(matches, start=1)
            ]
            answer = f"Top {len(matches)} công ty phù hợp nhất:\n" + "\n".join(ranking)
        return {
            "intent": "match_cv",
            "answer": answer,
            "matches": matches,
            "tool_trace": trace,
        }

    if any(phrase in normalized for phrase in ("cập nhật", "cap nhat", "crawler")):
        trace.append(
            {
                "tool": "crawler",
                "state": "done",
                "message": f"Đã đọc {len(companies)} công ty từ PostgreSQL.",
            }
        )
        return {
            "intent": "refresh_companies",
            "answer": f"Đã cập nhật {len(companies)} công ty từ hệ thống.",
            "matches": [],
            "tool_trace": trace,
        }

    grounded_data = [
        {
            "name": company.name,
            "division": company.division,
            "description": company.description,
            "locations": company.locations,
            "tech_stack": company.tech_stack,
            "work_environment": company.work_environment,
            "jobs": company.jd_data,
        }
        for company in companies
    ]
    portfolio_context = None
    if is_personal and portfolio:
        portfolio_context = {
            "skills": portfolio.skills,
            "experience_years": portfolio.experience_years,
            "target_domains": portfolio.target_domains,
            "work_modes": portfolio.work_modes,
            "priorities": portfolio.priorities,
            "summary": portfolio.summary,
        }
    result = await structured_completion(
        name="vincareer_grounded_answer",
        schema=ANSWER_SCHEMA,
        instructions=(
            "Bạn là cố vấn VinCareer AI. Trả lời tiếng Việt không quá 180 từ. "
            "Chỉ dùng dữ liệu PostgreSQL được cung cấp. Nếu thiếu dữ liệu phải "
            "nói rõ; không bịa lương, tỷ lệ offer hay chính sách nội bộ. "
            "Với câu hỏi về người dùng, phải ưu tiên dữ liệu CV được cung cấp."
            "Với những câu hỏi không liên quan đến nghề nghiệp, công ty, bản thân người dùng, hãy từ chối một cách lịch sự."
        ),
        content=(
            f"Câu hỏi: {message}\n"
            f"Lịch sử gần nhất: {json.dumps((history or [])[-6:], ensure_ascii=False)}\n"
            f"Dữ liệu CV: {json.dumps(portfolio_context, ensure_ascii=False)}\n"
            f"Dữ liệu công ty: {json.dumps(grounded_data, ensure_ascii=False)}"
        ),
        max_tokens=1000,
    )
    trace.append(
        {
            "tool": "crawler",
            "state": "done",
            "message": "Đã grounding câu trả lời bằng dữ liệu PostgreSQL.",
        }
    )
    return {
        "intent": "career_question",
        "answer": result["answer"],
        "matches": [],
        "tool_trace": trace,
    }
