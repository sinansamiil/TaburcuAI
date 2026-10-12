"""
MockLLMClient – deterministic, zero-network LLM adapter for tests.

Behaviour:
- ``generate_json`` returns whatever was registered for the given prompt key
  (matched by substring), or a configurable default.
- ``generate_text`` similarly looks up registered responses.
- No HTTP calls are ever made; suitable for pytest without mocking.
"""

from typing import Any

from app.core.llm.base import LLMClient, LLMResponseError


class MockLLMClient(LLMClient):
    """
    Deterministic mock LLM client for unit / integration tests.

    Usage::

        client = MockLLMClient()
        client.register_json_response("extract", {"diagnosis_text": "Kalp yetmezliği"})
        result = client.generate_json("Please extract...", schema={})
        # → {"diagnosis_text": "Kalp yetmezliği"}

    If no registered response matches the prompt, the ``default_json`` or
    ``default_text`` values are returned (both empty by default).
    If ``raise_on_unmatched=True``, an ``LLMResponseError`` is raised instead.
    """

    def __init__(
        self,
        *,
        default_json: dict[str, Any] | None = None,
        default_text: str = "",
        raise_on_unmatched: bool = False,
    ) -> None:
        self._json_responses: list[tuple[str, dict[str, Any]]] = []
        self._text_responses: list[tuple[str, str]] = []
        self._default_json: dict[str, Any] = default_json or {}
        self._default_text: str = default_text
        self._raise_on_unmatched = raise_on_unmatched

        # Counters for test assertions
        self.json_call_count: int = 0
        self.text_call_count: int = 0

    # ------------------------------------------------------------------
    # Registration helpers
    # ------------------------------------------------------------------

    def register_json_response(self, prompt_substring: str, response: dict[str, Any]) -> None:
        """Register a JSON response that is returned when *prompt_substring* is found."""
        self._json_responses.append((prompt_substring, response))

    def register_text_response(self, prompt_substring: str, response: str) -> None:
        """Register a text response that is returned when *prompt_substring* is found."""
        self._text_responses.append((prompt_substring, response))

    # ------------------------------------------------------------------
    # LLMClient interface
    # ------------------------------------------------------------------

    def generate_json(
        self,
        prompt: str,
        schema: dict[str, Any],
        *,
        temperature: float = 0.0,
        max_retries: int = 1,
    ) -> dict[str, Any]:
        self.json_call_count += 1
        for substring, response in self._json_responses:
            if substring.lower() in prompt.lower():
                return response
        if self._raise_on_unmatched:
            raise LLMResponseError(
                f"MockLLMClient: no registered JSON response for prompt starting with "
                f"{prompt[:80]!r}"
            )
        return self._default_json

    def generate_text(
        self,
        prompt: str,
        *,
        temperature: float = 0.1,
    ) -> str:
        self.text_call_count += 1
        for substring, response in self._text_responses:
            if substring.lower() in prompt.lower():
                return response
        if self._raise_on_unmatched:
            raise LLMResponseError(
                f"MockLLMClient: no registered text response for prompt starting with "
                f"{prompt[:80]!r}"
            )
        return self._default_text

    @property
    def provider_name(self) -> str:
        return "mock"
