"""Unit tests for Phase 3 pipeline components (simplifier, question_gen, evaluator, risk_scorer)."""

from app.core.pipeline import (
    calculate_risk_report,
    check_emergency_symptoms,
    evaluate_single_answer,
    generate_questions_for_case,
    simplify_discharge_plan,
)
from app.core.schemas.models import (
    Criticality,
    DischargeInfo,
    Medication,
    MedicationScheduleSlot,
    Question,
    QuestionType,
    RiskLevel,
    SourceSpan,
    Verdict,
)
from app.diseases.heart_failure import HeartFailureModule


def test_simplify_discharge_plan() -> None:
    med = Medication(
        name="Lasix",
        dose_text="40 mg",
        frequency_text="günde 1 kez",
        timing_text="sabah aç karnına",
        purpose="Ödem atılması",
        source_span=SourceSpan(text="Lasix 40 mg sabah"),
    )
    info = DischargeInfo(
        diagnosis_text="Akut Kalp Yetmezliği",
        medications=[med],
        daily_weight_monitoring="Her sabah aç karnına tartılınız.",
        sodium_restriction="Tuzsuz diyet",
        fluid_restriction="Günde 1.5 litre",
        warning_signs=["Nefes darlığı artışı"],
    )

    plan = simplify_discharge_plan(info)
    assert len(plan.daily_schedule) == 1
    assert MedicationScheduleSlot.MORNING in plan.daily_schedule[0].slots
    assert len(plan.daily_routine) == 3
    assert "hekiminize danışın" in plan.disclaimer


def test_generate_questions_for_case() -> None:
    module = HeartFailureModule()
    info = DischargeInfo(
        diagnosis_text="Kalp Yetmezliği",
        daily_weight_monitoring="Her sabah tartılınız.",
        warning_signs=["Ödem artışı"],
    )

    questions = generate_questions_for_case(info, module)
    assert len(questions) >= 3
    ids = [q.id for q in questions]
    assert "q_hf_daily_weight" in ids


def test_evaluator_correct_and_incorrect() -> None:
    q = Question(
        id="q1",
        type=QuestionType.OPEN,
        text="Kilonuzu ne zaman takip etmelisiniz?",
        expected_points=["Sabah aç karnına", "Tuvalete çıktıktan sonra"],
        linked_item="daily_weight_monitoring",
        criticality=Criticality.HIGH,
    )

    # Correct answer
    eval_correct = evaluate_single_answer(q, "Her sabah aç karnına tuvalete çıktıktan sonra tartılacağım")
    assert eval_correct.verdict == Verdict.CORRECT
    assert len(eval_correct.matched_points) > 0

    # Dismissive / incorrect answer
    eval_inc = evaluate_single_answer(q, "bilmiyorum")
    assert eval_inc.verdict == Verdict.INCORRECT


def test_emergency_symptoms_detection() -> None:
    # Trigger emergency
    is_emerg, msg = check_emergency_symptoms("Göğsümde baskı var ve nefes alamıyorum")
    assert is_emerg is True
    assert msg is not None
    assert "112" in msg

    # Safe answer
    is_emerg_safe, _ = check_emergency_symptoms("Sabahları tartılacağım ve ilaçlarımı alacağım")
    assert is_emerg_safe is False


def test_risk_scorer_high_risk_rule() -> None:
    module = HeartFailureModule()
    q_warning = Question(
        id="q_hf_warning_signs",
        type=QuestionType.OPEN,
        text="Hangi belirtilerde acile gitmelisiniz?",
        expected_points=["Ani nefes darlığı", "Bacaklarda şişlik"],
        linked_item="warning_signs",
        criticality=Criticality.HIGH,
    )

    eval_fail = evaluate_single_answer(q_warning, "önemli bir şey yok")
    report = calculate_risk_report("case_1", [q_warning], [eval_fail], module)

    assert report.level == RiskLevel.HIGH
    assert report.overall_score >= 60
    assert "YÜKSEK RİSK" in report.suggested_staff_action
