"""
Teach-back question generation step.

Produces 3 to 5 targeted questions tailored to the patient's specific DischargeInfo:
- Focuses on daily weight tracking, diuretic timing, salt/fluid limits, warning signs, and follow-ups.
- Avoids asking questions about topics not mentioned in the patient's summary (unless checking awareness).
"""

from app.core.schemas.models import Criticality, DischargeInfo, Question, QuestionType
from app.diseases.base import DiseaseModule


def generate_questions_for_case(
    info: DischargeInfo,
    disease_module: DiseaseModule,
) -> list[Question]:
    """Select and instantiate relevant teach-back questions for the case."""
    templates = disease_module.question_templates()
    selected_questions: list[Question] = []

    for tmpl in templates:
        linked_item = tmpl["linked_item"]

        # Relevance filtering
        if linked_item == "daily_weight_monitoring" and not info.daily_weight_monitoring:
            continue
        if linked_item == "sodium_restriction" and not (info.sodium_restriction or info.fluid_restriction):
            continue
        if linked_item == "follow_ups" and not info.follow_ups:
            continue
        if linked_item == "warning_signs" and not info.warning_signs:
            continue

        selected_questions.append(
            Question(
                id=tmpl["id"],
                type=QuestionType(tmpl.get("type", "open")),
                text=tmpl["text"],
                expected_points=tmpl["expected_points"],
                linked_item=linked_item,
                criticality=Criticality(tmpl.get("criticality", "medium")),
            )
        )

    # If fewer than 3 questions selected due to missing sections, include all high criticality ones
    if len(selected_questions) < 3:
        for tmpl in templates:
            if not any(q.id == tmpl["id"] for q in selected_questions):
                selected_questions.append(
                    Question(
                        id=tmpl["id"],
                        type=QuestionType(tmpl.get("type", "open")),
                        text=tmpl["text"],
                        expected_points=tmpl["expected_points"],
                        linked_item=tmpl["linked_item"],
                        criticality=Criticality(tmpl.get("criticality", "medium")),
                    )
                )
            if len(selected_questions) >= 4:
                break

    return selected_questions
