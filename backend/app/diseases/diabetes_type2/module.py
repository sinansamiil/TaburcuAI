"""DiabetesType2Module implementing DiseaseModule protocol."""

from typing import Any
from app.diseases.diabetes_type2.prompts import build_extraction_prompt
from app.diseases.diabetes_type2.questions import get_diabetes_question_templates
from app.diseases.diabetes_type2.risk_rules import get_diabetes_risk_rules
from app.diseases.diabetes_type2.safety import get_diabetes_safety_rules, get_emergency_message
from app.diseases.diabetes_type2.schema import DiabetesDischargeInfo


class DiabetesType2Module:
    id: str = "diabetes_type2"
    extraction_schema: type = DiabetesDischargeInfo

    def extraction_prompt(self, discharge_text: str) -> str:
        return build_extraction_prompt(discharge_text)

    def question_templates(self) -> list[dict[str, Any]]:
        return get_diabetes_question_templates()

    def risk_rules(self) -> list[dict[str, Any]]:
        return get_diabetes_risk_rules()

    def safety_rules(self) -> list[dict[str, Any]]:
        return get_diabetes_safety_rules()

    def emergency_message(self) -> str:
        return get_emergency_message()
