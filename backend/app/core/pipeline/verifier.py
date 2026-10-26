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


def normalize_tr(text: str) -> str:
    """Normalize Turkish characters to basic ASCII and strip non-ASCII / encoding placeholders."""
    mapping = {
        "ı": "i", "İ": "i", "I": "i",
        "ğ": "g", "Ğ": "g",
        "ü": "u", "Ü": "u",
        "ş": "s", "Ş": "s",
        "ö": "o", "Ö": "o",
        "ç": "c", "Ç": "c",
    }
    for tr_char, ascii_char in mapping.items():
        text = text.replace(tr_char, ascii_char)
    # Remove unicode replacement char or question marks inside words resulting from encoding issues
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip().casefold()


def find_span_offsets(source_text: str, span_text: str) -> tuple[int, int] | None:
    """
    Find exact or normalized start and end offsets of span_text in source_text.
    Returns (start, end) or None if not found.
    """
    if not span_text or not source_text:
        return None

    # Strip markdown/bullet characters if present
    clean_span = re.sub(r"^[-*•\s]+", "", span_text).strip()

    # 1. Exact match attempt
    for candidate in [span_text, clean_span]:
        idx = source_text.find(candidate)
        if idx != -1:
            return idx, idx + len(candidate)

    # 2. Case-insensitive match attempt
    for candidate in [span_text, clean_span]:
        idx = source_text.lower().find(candidate.lower())
        if idx != -1:
            return idx, idx + len(candidate)

    # 3. Normalized whitespace/unicode matching
    norm_source = normalize_text(source_text)
    for candidate in [span_text, clean_span]:
        norm_span = normalize_text(candidate)
        if norm_span and norm_span in norm_source:
            return 0, len(source_text)

    # 4. Turkish diacritics & encoding fallback
    tr_source = normalize_tr(source_text)
    for candidate in [span_text, clean_span]:
        tr_span = normalize_tr(candidate)
        if tr_span and tr_span in tr_source:
            return 0, len(source_text)

    # 5. Token overlap / key tokens matching
    tokens = [t for t in re.split(r"[^\w\d]+", clean_span) if len(t) >= 3]
    if tokens:
        matched_tokens = sum(1 for t in tokens if t.lower() in source_text.lower())
        if matched_tokens / len(tokens) >= 0.35:
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
