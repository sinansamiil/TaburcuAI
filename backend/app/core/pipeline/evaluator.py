"""
Answer evaluation step.

Evaluates free-text patient answers against question expected points:
- Safety check: If patient mentions emergency symptoms, immediate safety flag is raised.
- Semantic evaluation: Identifies matched points and missing points.
- Assigns verdict: correct, partial, incorrect, unclear.
"""

from app.core.pipeline.verifier import normalize_text
from app.core.schemas.models import AnswerEvaluation, Question, Verdict
from app.diseases.heart_failure.safety import (
    EMERGENCY_KEYWORDS,
    FIXED_EMERGENCY_MESSAGE,
)


def check_emergency_symptoms(answer_text: str) -> tuple[bool, str | None]:
    """Check if patient's answer mentions acute emergency red-flag symptoms."""
    norm = normalize_text(answer_text)
    for kw in EMERGENCY_KEYWORDS:
        if kw in norm:
            return True, FIXED_EMERGENCY_MESSAGE
    return False, None


def evaluate_single_answer(
    question: Question,
    raw_answer: str,
) -> AnswerEvaluation:
    """Evaluate patient's answer against expected points using semantic matching."""
    norm_answer = normalize_text(raw_answer)

    # Empty or dismissive answer
    if len(norm_answer) < 3 or norm_answer in ["bilmiyorum", "hatırlamıyorum", "yok", "bilmem", "fark etmez"]:
        return AnswerEvaluation(
            question_id=question.id,
            verdict=Verdict.INCORRECT,
            matched_points=[],
            missing_points=question.expected_points,
            raw_answer=raw_answer,
        )

    matched: list[str] = []
    missing: list[str] = []

    for point in question.expected_points:
        norm_point = normalize_text(point)
        # Extract keywords from expected point (len >= 4)
        keywords = [w for w in norm_point.split() if len(w) >= 4 and w not in ["için", "olan", "veya", "göre"]]

        matches = [kw for kw in keywords if kw in norm_answer]
        if matches and (len(matches) >= max(1, len(keywords) // 2)):
            matched.append(point)
        else:
            missing.append(point)

    total_expected = len(question.expected_points)
    matched_ratio = len(matched) / total_expected if total_expected > 0 else 0.0

    if matched_ratio >= 0.7:
        verdict = Verdict.CORRECT
    elif matched_ratio >= 0.3:
        verdict = Verdict.PARTIAL
    else:
        # If text is long but didn't match clinical concepts, consider unclear/incorrect
        if len(norm_answer) > 30 and len(matched) == 0:
            verdict = Verdict.UNCLEAR
        else:
            verdict = Verdict.INCORRECT

    return AnswerEvaluation(
        question_id=question.id,
        verdict=verdict,
        matched_points=matched,
        missing_points=missing,
        raw_answer=raw_answer,
    )
