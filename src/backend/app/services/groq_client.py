import json
from typing import Any

from fastapi import HTTPException, status
from openai import AsyncOpenAI, APIError

from app.core.config import get_settings


async def structured_completion(
    *,
    name: str,
    schema: dict[str, Any],
    instructions: str,
    content: str,
    max_tokens: int = 2000,
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY_MISSING",
        )

    client = AsyncOpenAI(
        api_key=settings.groq_api_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=60,
        max_retries=2,
    )
    try:
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": content},
            ],
            reasoning_effort="low",
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": name,
                    "strict": True,
                    "schema": schema,
                },
            },
            max_completion_tokens=max_tokens,
        )
    except APIError as error:
        raise HTTPException(
            status_code=getattr(error, "status_code", 502) or 502,
            detail={
                "code": getattr(error, "code", None) or "GROQ_REQUEST_FAILED",
                "message": "Groq không thể hoàn thành yêu cầu.",
            },
        ) from error

    output = response.choices[0].message.content if response.choices else None
    if not output:
        raise HTTPException(status_code=502, detail="GROQ_EMPTY_RESPONSE")
    try:
        return json.loads(output)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=502, detail="GROQ_INVALID_JSON") from error
