"""HeartFailureModule implementing the DiseaseModule protocol."""

from typing import Any

from app.diseases.heart_failure.prompts import build_extraction_prompt
from app.diseases.heart_failure.questions import get_heart_failure_question_templates
from app.diseases.heart_failure.risk_rules import get_heart_failure_risk_rules
from app.diseases.heart_failure.safety import get_emergency_message, get_heart_failure_safety_rules
from app.diseases.heart_failure.schema import HeartFailureDischargeInfo


class HeartFailureModule:
    """Disease module for heart failure."""

    id: str = "heart_failure"
    extraction_schema: type = HeartFailureDischargeInfo

    def extraction_prompt(self, discharge_text: str) -> str:
        """Return the extraction prompt for the given discharge text."""
        return build_extraction_prompt(discharge_text)

    def question_templates(self) -> list[dict[str, Any]]:
        """Return the question templates for heart failure."""
        return get_heart_failure_question_templates()

    def risk_rules(self) -> list[dict[str, Any]]:
        """Return the risk scoring rules for heart failure."""
        return get_heart_failure_risk_rules()

    def safety_rules(self) -> list[dict[str, Any]]:
        """Return the clinical safety rules for heart failure."""
        return get_heart_failure_safety_rules()

    def emergency_message(self) -> str:
        """Return the fixed emergency message."""
        return get_emergency_message()
