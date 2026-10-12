"""
LLMClient – provider-agnostic abstract interface.

All concrete adapters must implement this protocol so that the pipeline
never couples to a specific LLM provider.
"""

from abc import ABC, abstractmethod
from typing import Any


class LLMClient(ABC):
    """Abstract base class for all LLM adapters."""

    # -----------------------------------------------------------------------
    # Core interface
    # -----------------------------------------------------------------------

    @abstractmethod
    def generate_json(
        self,
        prompt: str,
        schema: dict[str, Any],
        *,
        temperature: float = 0.0,
        max_retries: int = 1,
    ) -> dict[str, Any]:
        """
        Send *prompt* to the LLM and parse the response as JSON.

        Parameters
        ----------
        prompt:
            The full prompt string (system + user message merged).
        schema:
            A JSON Schema dict describing the expected response structure.
            Used for validation and, where supported, for structured output mode.
        temperature:
            Sampling temperature. Should be 0–0.2 for clinical tasks.
        max_retries:
            How many times to retry on invalid JSON before raising.

        Returns
        -------
        dict
            Parsed JSON response that conforms to *schema*.

        Raises
        ------
        LLMResponseError
            If the response is not valid JSON after *max_retries* attempts.
        """

    @abstractmethod
    def generate_text(
        self,
        prompt: str,
        *,
        temperature: float = 0.1,
    ) -> str:
        """
        Send *prompt* to the LLM and return the raw text response.

        Parameters
        ----------
        prompt:
            The full prompt string.
        temperature:
            Sampling temperature.

        Returns
        -------
        str
            The model's text completion.
        """

    # -----------------------------------------------------------------------
    # Metadata (optional override)
    # -----------------------------------------------------------------------

    @property
    def provider_name(self) -> str:
        """Human-readable provider identifier, e.g. ``'mock'``, ``'openai'``."""
        return self.__class__.__name__


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class LLMResponseError(RuntimeError):
    """Raised when the LLM returns an unparseable or invalid response."""
