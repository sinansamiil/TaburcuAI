"""KidneyFailureModule implementing the DiseaseModule protocol."""

from typing import Any

from app.diseases.kidney_failure.prompts import build_extraction_prompt
from app.diseases.kidney_failure.questions import get_kidney_failure_question_templates
from app.diseases.kidney_failure.risk_rules import get_kidney_failure_risk_rules
from app.diseases.kidney_failure.safety import get_emergency_message, get_kidney_failure_safety_rules
from app.diseases.kidney_failure.schema import KidneyFailureDischargeInfo


class KidneyFailureModule:
    """Disease module for chronic kidney disease and nephrology discharge."""

    id: str = "kidney_failure"
    extraction_schema: type = KidneyFailureDischargeInfo

    def extraction_prompt(self, discharge_text: str) -> str:
        """Return the extraction prompt for the given nephrology discharge text."""
        return build_extraction_prompt(discharge_text)

    def question_templates(self) -> list[dict[str, Any]]:
        """Return teach-back question templates for kidney failure."""
        return get_kidney_failure_question_templates()

    def risk_rules(self) -> list[dict[str, Any]]:
        """Return the risk scoring rules for kidney failure."""
        return get_kidney_failure_risk_rules()

    def safety_rules(self) -> list[dict[str, Any]]:
        """Return the clinical safety rules for kidney failure."""
        return get_kidney_failure_safety_rules()

    def emergency_message(self) -> str:
        """Return the fixed emergency message."""
        return get_emergency_message()
