"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object – values come from .env or environment."""

    # Server
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000

    # LLM provider: mock | openai | anthropic | google
    llm_provider: str = "mock"

    # Provider API keys (optional; only the active provider is required)
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""

    # CORS – allow the Vite dev server and any configured frontend origin
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
