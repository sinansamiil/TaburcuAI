"""COPDModule implementing DiseaseModule protocol."""

from typing import Any
from app.diseases.copd_respiratory.prompts import build_extraction_prompt
from app.diseases.copd_respiratory.questions import get_copd_question_templates
from app.diseases.copd_respiratory.safety import (
    get_copd_risk_rules,
    get_copd_safety_rules,
    get_emergency_message,
)
from app.diseases.copd_respiratory.schema import COPDDischargeInfo


class COPDModule:
    id: str = "copd_respiratory"
    extraction_schema: type = COPDDischargeInfo

    def extraction_prompt(self, discharge_text: str) -> str:
        return build_extraction_prompt(discharge_text)

    def question_templates(self) -> list[dict[str, Any]]:
        return get_copd_question_templates()

    def risk_rules(self) -> list[dict[str, Any]]:
        return get_copd_risk_rules()

    def safety_rules(self) -> list[dict[str, Any]]:
        return get_copd_safety_rules()

    def emergency_message(self) -> str:
        return get_emergency_message()
