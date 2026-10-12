"""
OpenAILLMClient – adapter for the OpenAI Chat Completions API.

Provider selection: set LLM_PROVIDER=openai in .env.
Requires: OPENAI_API_KEY in .env.

Structured output is achieved via response_format={"type": "json_object"}.
Temperature is kept low (default 0.0) for deterministic clinical extraction.
"""

import json
from typing import Any

from app.core.llm.base import LLMClient, LLMResponseError


class OpenAILLMClient(LLMClient):
    """LLM adapter for OpenAI Chat Completions (gpt-4o / gpt-4o-mini)."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        timeout: float = 60.0,
    ) -> None:
        # Import here to keep openai an optional dependency
        try:
            import openai  # noqa: PLC0415
        except ImportError as exc:
            raise ImportError(
                "openai package is required for OpenAILLMClient. "
                "Run: pip install openai"
            ) from exc

        self._client = openai.OpenAI(api_key=api_key, timeout=timeout)
        self._model = model

    def generate_json(
        self,
        prompt: str,
        schema: dict[str, Any],
        *,
        temperature: float = 0.0,
        max_retries: int = 1,
    ) -> dict[str, Any]:
        for attempt in range(max_retries + 1):
            try:
                response = self._client.chat.completions.create(
                    model=self._model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    response_format={"type": "json_object"},
                )
                content = response.choices[0].message.content or ""
                return json.loads(content)
            except (json.JSONDecodeError, ValueError) as exc:
                if attempt == max_retries:
                    raise LLMResponseError(
                        f"OpenAI returned invalid JSON after {max_retries + 1} attempt(s): {exc}"
                    ) from exc

        return {}  # unreachable, satisfies type checker

    def generate_text(
        self,
        prompt: str,
        *,
        temperature: float = 0.1,
    ) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    @property
    def provider_name(self) -> str:
        return f"openai:{self._model}"
