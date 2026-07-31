import uuid

import pytest

from app.models import Company
from app.services.agent_router import (
    _is_first_person_question,
    _requested_match_limit,
    process_agent_message,
)
from app.services.crawler_tool import analyze_company


def test_first_person_and_top_n_detection() -> None:
    assert _is_first_person_question("Công ty nào phù hợp với tôi?")
    assert _is_first_person_question("Hãy xem CV của tôi")
    assert not _is_first_person_question("Lấy cho tôi thông tin JD VinFast")
    assert not _is_first_person_question("So sánh VinAI và VinFast")
    assert _requested_match_limit("top 5 công ty phù hợp") == 5
    assert _requested_match_limit("công ty phù hợp") == 3


@pytest.mark.asyncio
async def test_personal_question_without_cv_stops_with_exact_fallback() -> None:
    result = await process_agent_message(
        session=None,
        message="Tôi phù hợp với công ty nào?",
        portfolio_id=None,
    )

    assert result["answer"] == "Không biết bạn là ai, hãy thêm CV"
    assert result["matches"] == []


def test_tool_one_company_analysis_excludes_removed_sections() -> None:
    company = Company(
        id=uuid.uuid4(),
        slug="vinai",
        name="VinAI",
        division="AI",
        description="Nghiên cứu và phát triển sản phẩm AI.",
        tech_stack=["Python"],
        work_environment="Hybrid",
        active=True,
        jd_data=[
            {
                "position": "AI Intern",
                "department": "Research",
                "team_name": "Perception",
                "required_skills": ["Python", "PyTorch"],
                "preferred_skills": ["Math"],
                "target_wishes": ["AI Research"],
                "interview_process": [{"title": "Không được xuất hiện"}],
                "pros": ["Không được xuất hiện"],
                "cons": ["Không được xuất hiện"],
            }
        ],
    )

    result = analyze_company(company)

    assert result["source"] == "tool_1"
    assert result["company_requirements"] == ["Python", "PyTorch", "Ưu tiên: Math"]
    assert "AI Research" in result["focus_areas"]
    assert "interview_process" not in result
    assert "pros" not in result
    assert "cons" not in result
