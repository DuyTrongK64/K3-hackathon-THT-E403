from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VinCareer Insight AI API"
    api_prefix: str = "/api/v1"
    environment: str = "development"
    database_url: str = (
        "postgresql+asyncpg://vincareer:vincareer@localhost:5432/vincareer"
    )
    frontend_origins: str = "http://localhost:3000,http://localhost:3001"
    admin_api_key: str = "change-me-in-env"
    groq_api_key: str = Field(default="", repr=False)
    groq_model: str = "openai/gpt-oss-20b"
    max_cv_bytes: int = 8 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
