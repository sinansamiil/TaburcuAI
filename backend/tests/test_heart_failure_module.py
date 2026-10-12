"""Unit tests for HeartFailureModule conforming to the DiseaseModule protocol."""

from app.diseases.base import DiseaseModule
from app.diseases.heart_failure import HeartFailureDischargeInfo, HeartFailureModule
from app.diseases.heart_failure.safety import FIXED_EMERGENCY_MESSAGE


def test_heart_failure_module_protocol_compliance() -> None:
    module = HeartFailureModule()
    assert isinstance(module, DiseaseModule)
    assert module.id == "heart_failure"
    assert module.extraction_schema is HeartFailureDischargeInfo


def test_heart_failure_extraction_prompt() -> None:
    module = HeartFailureModule()
    prompt = module.extraction_prompt("Hasta kalp yetmezliği tanısıyla taburcu edildi.")
    assert "kalp yetmezliği" in prompt.lower()
    assert "source_span" in prompt


def test_heart_failure_question_templates() -> None:
    module = HeartFailureModule()
    templates = module.question_templates()
    assert len(templates) >= 4
    item_ids = [t["id"] for t in templates]
    assert "q_hf_daily_weight" in item_ids
    assert "q_hf_warning_signs" in item_ids


def test_heart_failure_risk_and_safety_rules() -> None:
    module = HeartFailureModule()
    risk_rules = module.risk_rules()
    safety_rules = module.safety_rules()

    assert len(risk_rules) > 0
    assert len(safety_rules) > 0
    assert module.emergency_message() == FIXED_EMERGENCY_MESSAGE
