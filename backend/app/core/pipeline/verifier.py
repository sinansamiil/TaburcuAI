"""
Span and numeric verification for extracted discharge information.

Pipeline Step 2: Verification
- Verifies that extracted source_spans actually exist verbatim or normalized in the original text.
- Calculates character offsets (start, end) for verified spans.
- Verifies numerical values (doses, frequencies, numbers) with regex against the source text.
- Flags unverified items and adds them to missing_fields.
"""

import re
import unicodedata

from app.core.schemas.models import DischargeInfo, FollowUp, Medication, SourceSpan


def normalize_text(text: str) -> str:
    """Normalize text for whitespace, unicode normalization, and casing."""
    text = unicodedata.normalize("NFKC", text)
    # Collapse multiple whitespaces and trim
    return re.sub(r"\s+", " ", text).strip().casefold()


def find_span_offsets(source_text: str, span_text: str) -> tuple[int, int] | None:
    """
    Find exact or normalized start and end offsets of span_text in source_text.
    Returns (start, end) or None if not found.
    """
    if not span_text or not source_text:
        return None

    # 1. Exact match attempt
    idx = source_text.find(span_text)
    if idx != -1:
        return idx, idx + len(span_text)

    # 2. Case-insensitive match attempt
    idx = source_text.lower().find(span_text.lower())
    if idx != -1:
        return idx, idx + len(span_text)

    # 3. Normalized whitespace/unicode matching
    norm_source = normalize_text(source_text)
    norm_span = normalize_text(span_text)

    norm_idx = norm_source.find(norm_span)
    if norm_idx != -1:
        # Approximate boundary in original text
        pattern = re.escape(span_text)
        # Allow flexible whitespace
        pattern = re.sub(r"\\\s+", r"\\s+", pattern)
        match = re.search(pattern, source_text, re.IGNORECASE)
        if match:
            return match.start(), match.end()
        # Fallback to normalized indices if regex match didn't find exact whitespace boundary
        return 0, len(source_text)

    return None


def extract_numbers(text: str) -> list[str]:
    """Extract all numbers (including decimals and fractions) from text."""
    return re.findall(r"\b\d+(?:[.,]\d+)?\b", text)


def verify_numeric_presence(source_text: str, candidate_text: str) -> bool:
    """Verify that numbers present in candidate_text exist in source_text."""
    numbers = extract_numbers(candidate_text)
    if not numbers:
        return True

    norm_source = normalize_text(source_text)
    for num in numbers:
        # Normalize comma/point in numbers
        normalized_num = num.replace(",", ".")
        if num not in norm_source and normalized_num not in norm_source:
            return False
    return True


def verify_discharge_info(
    info: DischargeInfo,
    original_text: str,
) -> DischargeInfo:
    """
    Verify all spans and numeric fields in DischargeInfo against the original discharge text.

    - Updates source_span start and end positions.
    - If a medication or follow-up source_span does not exist in the source, it is marked
      and recorded in missing_fields.
    - Checks numbers in doses against the source document.
    """
    verified_medications: list[Medication] = []
    unverified_fields: list[str] = list(info.missing_fields)

    # 1. Verify medications
    for med in info.medications:
        span_offsets = find_span_offsets(original_text, med.source_span.text)
        numeric_ok = verify_numeric_presence(original_text, med.dose_text)

        if span_offsets and numeric_ok:
            updated_span = SourceSpan(
                text=med.source_span.text,
                start=span_offsets[0],
                end=span_offsets[1],
            )
            verified_med = med.model_copy(update={"source_span": updated_span})
            verified_medications.append(verified_med)
        else:
            reason = []
            if not span_offsets:
                reason.append(f"kaynak alıntı bulunamadı ('{med.source_span.text[:30]}...')")
            if not numeric_ok:
                reason.append(f"doz sayısı eşleşmedi ('{med.dose_text}')")
            unverified_fields.append(f"medication:{med.name} ({', '.join(reason)})")

    # 2. Verify follow-ups
    verified_follow_ups: list[FollowUp] = []
    for fu in info.follow_ups:
        span_offsets = find_span_offsets(original_text, fu.source_span.text)
        numeric_ok = verify_numeric_presence(original_text, fu.when_text)

        if span_offsets and numeric_ok:
            updated_span = SourceSpan(
                text=fu.source_span.text,
                start=span_offsets[0],
                end=span_offsets[1],
            )
            verified_fu = fu.model_copy(update={"source_span": updated_span})
            verified_follow_ups.append(verified_fu)
        else:
            unverified_fields.append(f"follow_up:{fu.when_text}")

    # 3. Check presence of critical heart failure components in source text
    if info.daily_weight_monitoring:
        if not find_span_offsets(original_text, info.daily_weight_monitoring):
            # Check if key keywords exist
            if "kilo" not in original_text.lower() and "tartı" not in original_text.lower():
                unverified_fields.append("daily_weight_monitoring (metinde kilo takibi geçmiyor)")

    return info.model_copy(
        update={
            "medications": verified_medications,
            "follow_ups": verified_follow_ups,
            "missing_fields": list(dict.fromkeys(unverified_fields)),
        }
    )
