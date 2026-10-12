"""
Risk scoring and staff action recommendation engine.

Rules and weights:
- Calculates risk score between 0 (perfect understanding) and 100 (high risk).
- Criticality weights: HIGH=1.0, MEDIUM=0.6, LOW=0.3.
- Verdict weights: INCORRECT=1.0, UNCLEAR=0.8, PARTIAL=0.4, CORRECT=0.0.
- Applies disease module risk rules to force or elevate risk levels (e.g. warning_signs miss -> HIGH).
- Abstains if too many answers are unclear.
- Formulates practical staff recommendations (e.g. face-to-face teach-back).
"""

from app.core.schemas.models import (
    AnswerEvaluation,
    Criticality,
    ItemRisk,
    Question,
    RiskLevel,
    RiskReport,
    Verdict,
)
from app.diseases.base import DiseaseModule

CRITICALITY_WEIGHTS = {
    Criticality.HIGH: 1.0,
    Criticality.MEDIUM: 0.6,
    Criticality.LOW: 0.3,
}

VERDICT_WEIGHTS = {
    Verdict.INCORRECT: 1.0,
    Verdict.UNCLEAR: 0.8,
    Verdict.PARTIAL: 0.4,
    Verdict.CORRECT: 0.0,
}


def calculate_risk_report(
    case_id: str,
    questions: list[Question],
    evaluations: list[AnswerEvaluation],
    disease_module: DiseaseModule,
) -> RiskReport:
    """Calculate overall risk score, risk level, and staff recommendations."""
    eval_map = {ev.question_id: ev for ev in evaluations}
    item_risks: list[ItemRisk] = []

    total_weighted_penalty = 0.0
    total_possible_weight = 0.0
    unclear_count = 0
    reasons: list[str] = []

    for q in questions:
        ev = eval_map.get(q.id)
        if not ev:
            # Unanswered question treated as incorrect
            ev = AnswerEvaluation(
                question_id=q.id,
                verdict=Verdict.INCORRECT,
                matched_points=[],
                missing_points=q.expected_points,
                raw_answer="[Cevaplanmadı]",
            )

        crit_weight = CRITICALITY_WEIGHTS.get(q.criticality, 0.6)
        verd_weight = VERDICT_WEIGHTS.get(ev.verdict, 1.0)

        score_penalty = crit_weight * verd_weight
        total_weighted_penalty += score_penalty
        total_possible_weight += crit_weight

        if ev.verdict == Verdict.UNCLEAR:
            unclear_count += 1

        if ev.verdict in [Verdict.INCORRECT, Verdict.PARTIAL]:
            reasons.append(
                f"'{q.text}' sorusunda eksik/yanlış anlama tespit edildi ({ev.verdict.value})."
            )

        item_risks.append(
            ItemRisk(
                linked_item=q.linked_item,
                question_id=q.id,
                verdict=ev.verdict,
                criticality=q.criticality,
                weighted_score=round(verd_weight, 2),
            )
        )

    # Normalized score between 0 and 100
    if total_possible_weight > 0:
        overall_score = int(round((total_weighted_penalty / total_possible_weight) * 100))
    else:
        overall_score = 0

    overall_score = max(0, min(100, overall_score))

    # Base level determination
    if overall_score >= 60:
        level = RiskLevel.HIGH
    elif overall_score >= 30:
        level = RiskLevel.MEDIUM
    else:
        level = RiskLevel.LOW

    # Check disease module specific risk rules
    rules = disease_module.risk_rules()
    for rule in rules:
        target_item = rule.get("target_item")
        trigger_verdicts = rule.get("trigger_verdicts", [])

        # Check if any evaluation linked to target_item triggered the rule
        for item_r in item_risks:
            if item_r.linked_item == target_item and item_r.verdict.value in trigger_verdicts:
                force_lvl = rule.get("force_level")
                min_lvl = rule.get("min_level")
                if force_lvl == "high":
                    level = RiskLevel.HIGH
                elif min_lvl == "medium" and level == RiskLevel.LOW:
                    level = RiskLevel.MEDIUM

                rule_desc = rule.get("description")
                if rule_desc and rule_desc not in reasons:
                    reasons.append(f"Kural uyarısı: {rule_desc}")

    # Abstain check
    abstained = False
    if len(questions) > 0 and (unclear_count / len(questions)) > 0.5:
        abstained = True
        reasons.append("Cevapların çoğunluğu belirsiz/anlaşılamaz olduğu için kesin risk skoru hesaplanamadı.")

    # Staff recommendations
    if level == RiskLevel.HIGH:
        suggested_staff_action = (
            "YÜKSEK RİSK: Hasta taburcu edilmeden önce servis hemşiresi veya hekim tarafından "
            "yüz yüze acil durum uyarı belirtileri ve ilaç planı baştan tekrar anlatılmalı, "
            "anlaşılma teyit edilmelidir."
        )
    elif level == RiskLevel.MEDIUM:
        suggested_staff_action = (
            "ORTA RİSK: Hastanın eksik veya kısmi anladığı noktalar (özellikle kilo takibi ve "
            "idrar söktürücü zamanlaması) hakkında kısa yazılı bilgilendirme veya sözlü hatırlatma yapılmalıdır."
        )
    else:
        suggested_staff_action = (
            "DÜŞÜK RİSK: Hasta taburculuk talimatlarını yeterli düzeyde anlamıştır. "
            "Rutin poliklinik kontrolü hatırlatılarak taburculuk tamamlanabilir."
        )

    if not reasons:
        reasons.append("Tüm teach-back soruları hasta tarafından doğru ve eksiksiz anlaşıldı.")

    return RiskReport(
        case_id=case_id,
        item_risks=item_risks,
        overall_score=overall_score,
        level=level,
        abstained=abstained,
        reasons=reasons,
        suggested_staff_action=suggested_staff_action,
    )
