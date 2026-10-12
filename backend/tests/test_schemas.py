"""Unit tests for core schemas and validation constraints."""

import pytest
from pydantic import ValidationError

from app.core.schemas.models import (
    AnswerEvaluation,
    Criticality,
    DischargeInfo,
    ItemRisk,
    Medication,
    Question,
    QuestionType,
    RiskLevel,
    RiskReport,
    SourceSpan,
    Verdict,
)


def test_source_span_creation() -> None:
    span = SourceSpan(text="Günde 1 kez sabah aç karnına", start=12, end=40)
    assert span.text == "Günde 1 kez sabah aç karnına"
    assert span.start == 12
    assert span.end == 40


def test_medication_schema() -> None:
    span = SourceSpan(text="Lasix 40 mg 1x1")
    med = Medication(
        name="Lasix",
        purpose="Ödem ve sıvı atılımı",
        dose_text="40 mg",
        frequency_text="günde 1 kez",
        timing_text="sabah",
        source_span=span,
    )
    assert med.name == "Lasix"
    assert med.dose_text == "40 mg"
    assert med.source_span.text == "Lasix 40 mg 1x1"


def test_discharge_info_defaults() -> None:
    info = DischargeInfo(
        diagnosis_text="Akut dekompanse kalp yetmezliği",
    )
    assert info.medications == []
    assert info.warning_signs == []
    assert info.missing_fields == []
    assert info.daily_weight_monitoring is None


def test_question_and_answer_evaluation() -> None:
    q = Question(
        id="q_weight",
        type=QuestionType.OPEN,
        text="Kilonuzu ne zaman takip etmelisiniz?",
        expected_points=["Sabah aç karnına", "Tuvalet sonrası"],
        linked_item="daily_weight_monitoring",
        criticality=Criticality.HIGH,
    )
    assert q.criticality == Criticality.HIGH

    ans_eval = AnswerEvaluation(
        question_id=q.id,
        verdict=Verdict.CORRECT,
        matched_points=["Sabah aç karnına"],
        missing_points=[],
        raw_answer="Her sabah aç karnına tartılacağım",
    )
    assert ans_eval.verdict == Verdict.CORRECT


def test_risk_report_validation() -> None:
    item_risk = ItemRisk(
        linked_item="daily_weight_monitoring",
        question_id="q_weight",
        verdict=Verdict.CORRECT,
        criticality=Criticality.HIGH,
        weighted_score=0.1,
    )
    report = RiskReport(
        case_id="case_123",
        item_risks=[item_risk],
        overall_score=15,
        level=RiskLevel.LOW,
        abstained=False,
        reasons=["Tüm kritik sorular doğru anlaşıldı."],
        suggested_staff_action="Standart taburculuk protokolü.",
    )
    assert report.overall_score == 15
    assert report.level == RiskLevel.LOW

    # Score out of bounds should fail
    with pytest.raises(ValidationError):
        RiskReport(
            case_id="c_err",
            item_risks=[],
            overall_score=150,  # invalid: > 100
            level=RiskLevel.HIGH,
        )
