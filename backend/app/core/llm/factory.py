"""Factory function for creating an LLMClient instance based on configuration."""

from app.core.config import settings
from app.core.llm.base import LLMClient
from app.core.llm.mock import MockLLMClient
from app.core.llm.openai_adapter import OpenAILLMClient


def get_llm_client(provider: str | None = None) -> LLMClient:
    """Return an instantiated LLMClient based on provider name or settings."""
    active_provider = (provider or settings.llm_provider).lower()

    if active_provider == "mock":
        return MockLLMClient()
    elif active_provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured in environment/.env")
        return OpenAILLMClient(api_key=settings.openai_api_key)
    else:
        raise ValueError(f"Unsupported LLM provider: {active_provider}")
