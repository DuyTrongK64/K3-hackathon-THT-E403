from io import BytesIO
from pathlib import Path

from docx import Document
from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader

from app.core.config import get_settings


async def extract_cv_text(file: UploadFile) -> str:
    content = await file.read()
    settings = get_settings()
    if not content:
        raise HTTPException(status_code=400, detail="CV_EMPTY_CONTENT")
    if len(content) > settings.max_cv_bytes:
        raise HTTPException(status_code=413, detail="CV_FILE_TOO_LARGE")

    extension = Path(file.filename or "").suffix.lower()
    try:
        if extension == ".pdf":
            reader = PdfReader(BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif extension == ".docx":
            document = Document(BytesIO(content))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        else:
            raise HTTPException(status_code=415, detail="CV_FILE_UNSUPPORTED")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CV_FILE_READ_FAILED",
        ) from error

    normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip())
    if len(normalized) < 20:
        raise HTTPException(status_code=422, detail="CV_UNREADABLE_CONTENT")
    return normalized[:60_000]
