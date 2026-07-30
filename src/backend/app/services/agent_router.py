import json

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


async def process_agent_message(
    *,
    session: AsyncSession,
    message: str,
    portfolio_id=None,
    history: list[dict] | None = None,
) -> dict:
    normalized = _normalize(message)
    trace = [{"tool": "agent", "state": "done", "message": "Đã phân tích ý định."}]
    companies = await crawl_companies(session)

    match_phrases = ("phù hợp", "phu hop", "top 3", "hợp với cv", "hop voi cv")
    if any(phrase in normalized for phrase in match_phrases):
        if not portfolio_id:
            return {
                "intent": "match_cv",
                "answer": "Hãy tải CV tại trang Portfolio trước để nhận Top 3 phù hợp.",
                "matches": [],
                "tool_trace": trace,
            }
        portfolio = await session.get(Portfolio, portfolio_id)
        if not portfolio:
            return {
                "intent": "match_cv",
                "answer": "Không tìm thấy Portfolio. Vui lòng tải lại CV.",
                "matches": [],
                "tool_trace": trace,
            }
        criteria_result = await session.scalars(
            select(EvaluationCriterion)
            .where(EvaluationCriterion.active.is_(True))
            .order_by(EvaluationCriterion.display_order)
        )
        matches = rank_companies(
            portfolio,
            companies,
            list(criteria_result.all()),
        )
        trace.append(
            {
                "tool": "matching",
                "state": "done",
                "message": "Đã chấm điểm bằng tiêu chí trong PostgreSQL.",
            }
        )
        best = matches[0] if matches else None
        answer = (
            f"Phù hợp nhất là {best['company_name']} với {best['score']}%. "
            + " ".join(best["reasons"])
            if best
            else "Chưa có công ty đủ dữ liệu để xếp hạng."
        )
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
    result = await structured_completion(
        name="vincareer_grounded_answer",
        schema=ANSWER_SCHEMA,
        instructions=(
            "Bạn là cố vấn VinCareer AI. Trả lời tiếng Việt không quá 180 từ. "
            "Chỉ dùng dữ liệu PostgreSQL được cung cấp. Nếu thiếu dữ liệu phải "
            "nói rõ; không bịa lương, tỷ lệ offer hay chính sách nội bộ."
        ),
        content=(
            f"Câu hỏi: {message}\n"
            f"Lịch sử gần nhất: {json.dumps((history or [])[-6:], ensure_ascii=False)}\n"
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
