from app.services.groq_client import structured_completion


CV_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "summary",
        "skills",
        "experience_years",
        "target_domains",
        "work_modes",
        "priorities",
    ],
    "properties": {
        "summary": {"type": "string"},
        "skills": {"type": "array", "items": {"type": "string"}},
        "experience_years": {"type": "number"},
        "target_domains": {"type": "array", "items": {"type": "string"}},
        "work_modes": {"type": "array", "items": {"type": "string"}},
        "priorities": {"type": "array", "items": {"type": "string"}},
    },
}


async def scan_cv(text: str) -> dict:
    return await structured_completion(
        name="vincareer_cv_profile",
        schema=CV_SCHEMA,
        instructions=(
            "Bạn là Tool Scanner CV cho sinh viên công nghệ. Chỉ trích xuất dữ "
            "kiện có trong CV, không tự thêm kỹ năng hoặc kinh nghiệm. Chuẩn hóa "
            "tên kỹ năng. experience_years có thể là số thập phân. Mong muốn phải "
            "suy ra thận trọng từ mục tiêu và dự án. Không sử dụng kỳ vọng lương."
        ),
        content=f"Nội dung CV:\n{text}",
        max_tokens=1800,
    )
