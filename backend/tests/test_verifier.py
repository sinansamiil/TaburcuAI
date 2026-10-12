"""Unit tests for verifier (span matching, numbers, and offset verification)."""

from app.core.pipeline.verifier import (
    find_span_offsets,
    normalize_text,
    verify_discharge_info,
    verify_numeric_presence,
)
from app.core.schemas.models import DischargeInfo, Medication, SourceSpan


def test_normalize_text() -> None:
    raw = "  TABURCU   talimatı:\n\tLasix   40 mg  "
    normalized = normalize_text(raw)
    assert normalized == "taburcu talimatı: lasix 40 mg"


def test_find_span_offsets_exact() -> None:
    source = "Hasta Lasix 40 mg 1x1 sabah almalıdır."
    offsets = find_span_offsets(source, "Lasix 40 mg 1x1")
    assert offsets is not None
    start, end = offsets
    assert source[start:end] == "Lasix 40 mg 1x1"


def test_find_span_offsets_missing() -> None:
    source = "Hasta taburcu edildi."
    offsets = find_span_offsets(source, "Digoksin 0.25 mg")
    assert offsets is None


def test_verify_numeric_presence() -> None:
    source = "Günde 1 kez sabah 40 mg Lasix alacak."
    assert verify_numeric_presence(source, "40 mg") is True
    assert verify_numeric_presence(source, "1 kez") is True
    assert verify_numeric_presence(source, "80 mg") is False


def test_verify_discharge_info_valid_and_hallucinated() -> None:
    source = "Hasta taburcu edilirken Lasix 40 mg sabah önerildi. Her sabah tartılmalıdır."

    valid_med = Medication(
        name="Lasix",
        dose_text="40 mg",
        frequency_text="sabah",
        source_span=SourceSpan(text="Lasix 40 mg sabah"),
    )
    hallucinated_med = Medication(
        name="Coraspin",
        dose_text="100 mg",
        frequency_text="günde 1",
        source_span=SourceSpan(text="Coraspin 100 mg"),
    )

    info = DischargeInfo(
        diagnosis_text="Kalp Yetmezliği",
        medications=[valid_med, hallucinated_med],
        daily_weight_monitoring="Her sabah tartılmalıdır.",
    )

    verified = verify_discharge_info(info, original_text=source)

    # Valid med should remain and have offsets set
    assert len(verified.medications) == 1
    assert verified.medications[0].name == "Lasix"
    assert verified.medications[0].source_span.start is not None
    assert verified.medications[0].source_span.end is not None

    # Hallucinated med should be noted in missing_fields
    assert any("Coraspin" in field for field in verified.missing_fields)
