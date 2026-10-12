"""Pipeline sub-package – extraction, simplification, questions, evaluation, risk scoring."""

from app.core.pipeline.evaluator import check_emergency_symptoms, evaluate_single_answer
from app.core.pipeline.extractor import ExtractionError, extract_discharge_info
from app.core.pipeline.question_gen import generate_questions_for_case
from app.core.pipeline.risk_scorer import calculate_risk_report
from app.core.pipeline.simplifier import simplify_discharge_plan
from app.core.pipeline.verifier import find_span_offsets, normalize_text, verify_discharge_info

__all__ = [
    "ExtractionError",
    "calculate_risk_report",
    "check_emergency_symptoms",
    "evaluate_single_answer",
    "extract_discharge_info",
    "find_span_offsets",
    "generate_questions_for_case",
    "normalize_text",
    "simplify_discharge_plan",
    "verify_discharge_info",
]
