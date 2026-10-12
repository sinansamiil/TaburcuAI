"""
DiseaseModule – Protocol (structural subtyping) that every disease module must satisfy.

Each concrete module lives in diseases/<disease_id>/ and implements this interface.
core/ must never import from any concrete disease module.
"""

from typing import TYPE_CHECKING, Any, Protocol, runtime_checkable

if TYPE_CHECKING:
    pass


@runtime_checkable
class DiseaseModule(Protocol):
    """Structural interface for a disease-specific module.

    Attributes
    ----------
    id : str
        Unique machine-readable identifier, e.g. ``"heart_failure"``.
    extraction_schema : type
        Pydantic model class that describes the structured extraction output.
    """

    id: str
    extraction_schema: type

    def extraction_prompt(self, discharge_text: str) -> str:
        """Return the full extraction prompt for the given discharge text."""
        ...

    def question_templates(self) -> list[dict[str, Any]]:
        """Return a list of question template dicts for this disease."""
        ...

    def risk_rules(self) -> list[dict[str, Any]]:
        """Return risk-scoring rule definitions."""
        ...

    def safety_rules(self) -> list[dict[str, Any]]:
        """Return clinical safety guard-rail definitions."""
        ...

    def emergency_message(self) -> str:
        """Return a fixed, LLM-independent emergency redirect message."""
        ...
