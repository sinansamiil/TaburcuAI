"""
Simplification pipeline step.

Transforms clinical DischargeInfo into an understandable, structured SimplifiedPlan for the patient:
- Groups medications into schedule slots: sabah, öğle, akşam, gece
- Formulates daily routine tasks (daily morning weight, salt restriction, fluid limit)
- Clarifies warning signs into plain Turkish
- Adds mandatory disclaimer: 'Bu bilgi hekiminizin yazdığı talimatın sadeleştirilmiş halidir; sorunuz varsa hekiminize danışın.'
"""

from app.core.schemas.models import (
    DischargeInfo,
    MedicationScheduleSlot,
    SimplifiedMedication,
    SimplifiedPlan,
)
from app.diseases.heart_failure.safety import CLINICAL_DISCLAIMER


def parse_schedule_slots(frequency_text: str, timing_text: str | None) -> list[MedicationScheduleSlot]:
    """Determine schedule slots (sabah, öğle, akşam, gece) from timing and frequency text."""
    combined = f"{frequency_text} {timing_text or ''}".lower()
    slots: list[MedicationScheduleSlot] = []

    if "sabah" in combined:
        slots.append(MedicationScheduleSlot.MORNING)
    if "öğle" in combined:
        slots.append(MedicationScheduleSlot.NOON)
    if "akşam" in combined:
        slots.append(MedicationScheduleSlot.EVENING)
    if "gece" in combined or "yatarken" in combined:
        slots.append(MedicationScheduleSlot.NIGHT)

    # Fallbacks based on frequency counts if no specific timing keyword
    if not slots:
        if "2 kez" in combined or "2 tablet" in combined or "2x1" in combined:
            slots = [MedicationScheduleSlot.MORNING, MedicationScheduleSlot.EVENING]
        elif "3 kez" in combined or "3x1" in combined:
            slots = [MedicationScheduleSlot.MORNING, MedicationScheduleSlot.NOON, MedicationScheduleSlot.EVENING]
        else:
            # Default to morning
            slots = [MedicationScheduleSlot.MORNING]

    return slots


def simplify_discharge_plan(info: DischargeInfo) -> SimplifiedPlan:
    """Transform DischargeInfo into patient-facing SimplifiedPlan."""
    daily_schedule: list[SimplifiedMedication] = []

    for med in info.medications:
        slots = parse_schedule_slots(med.frequency_text, med.timing_text)
        daily_schedule.append(
            SimplifiedMedication(
                name=med.name,
                dose_text=med.dose_text,
                slots=slots,
                timing_text=med.timing_text or med.frequency_text,
                purpose=med.purpose,
                source_span=med.source_span,
            )
        )

    daily_routine: list[str] = []
    if info.daily_weight_monitoring:
        daily_routine.append(f"Tartı Takibi: {info.daily_weight_monitoring}")
    if info.sodium_restriction:
        daily_routine.append(f"Tuz Kısıtlaması: {info.sodium_restriction}")
    if info.fluid_restriction:
        daily_routine.append(f"Sıvı Kısıtlaması: {info.fluid_restriction}")

    warning_signs: list[str] = list(info.warning_signs)

    follow_ups: list[str] = []
    for fu in info.follow_ups:
        detail = fu.when_text
        if fu.with_whom:
            detail += f" ({fu.with_whom})"
        if fu.purpose:
            detail += f" - {fu.purpose}"
        follow_ups.append(detail)

    return SimplifiedPlan(
        daily_schedule=daily_schedule,
        daily_routine=daily_routine,
        warning_signs=warning_signs,
        follow_ups=follow_ups,
        disclaimer=CLINICAL_DISCLAIMER,
    )
