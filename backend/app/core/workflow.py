"""
Staff workflow helpers:
- Protocol number / patient name masking
- Lazily ensuring a workflow row exists for every case
- Medication reconciliation (epikriz text vs. extracted medication list)
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.db.models import CaseModel, CaseWorkflowModel

WORKFLOW_ACTIONS = {
    "contacted": "Hasta/yakını ile iletişime geçildi",
    "education_planned": "Yüz yüze eğitim planlandı",
    "education_done": "Yüz yüze eğitim tamamlandı",
    "closed": "Vaka kapatıldı / onaylandı",
    "reopened": "Vaka yeniden açıldı",
    "note": "Klinik not eklendi",
}

# Common heart-failure drugs (brand + generic). Used to detect drugs mentioned in the
# epikriz that the extraction step did NOT capture (possible omissions).
KNOWN_HF_DRUGS: dict[str, list[str]] = {
    "Furosemid": ["lasix", "furosemid", "desal"],
    "Torasemid": ["torasemid", "torem"],
    "Metoprolol": ["beloc", "metoprolol"],
    "Bisoprolol": ["concor", "bisoprolol"],
    "Karvedilol": ["dilatrend", "karvedilol", "carvedilol"],
    "Nebivolol": ["vasoxen", "nebivolol"],
    "Sakubitril/Valsartan": ["entresto", "sakubitril", "sacubitril"],
    "Dapagliflozin": ["forxiga", "dapagliflozin"],
    "Empagliflozin": ["jardiance", "empagliflozin"],
    "Eplerenon": ["inspra", "eplerenon"],
    "Spironolakton": ["aldactone", "spironolakton"],
    "Ramipril": ["delix", "ramipril"],
    "Enalapril": ["enapril", "konveril", "enalapril"],
    "Valsartan": ["diovan", "valsartan"],
    "Digoksin": ["lanoxin", "digoksin", "digoxin"],
    "İvabradin": ["coralan", "ivabradin"],
    "Asetilsalisilik asit": ["coraspin", "ecopirin", "aspirin"],
    "Varfarin": ["coumadin", "varfarin"],
    "Atorvastatin": ["lipitor", "atorvastatin"],
}

_TR_LOWER = str.maketrans("İIŞĞÜÖÇ", "iışğüöç")


def tr_lower(text: str) -> str:
    return text.translate(_TR_LOWER).lower()


def default_protocol_no(case: CaseModel) -> str:
    """Deterministic, human-readable protocol number derived from the case id."""
    year = (case.created_at or datetime.now(UTC)).year
    try:
        num = int(case.id.replace("-", "")[:6], 16) % 9000 + 1000
    except ValueError:
        num = 1000
    return f"PRT-{year}-{num}"


def extract_protocol_from_text(raw_text: str) -> str | None:
    match = re.search(r"PROTOKOL\s*NO\s*[:\-]?\s*([A-Z]{2,4}-\d{4}-\d{2,6})", raw_text, re.IGNORECASE)
    return match.group(1).upper() if match else None


def mask_name(full_name: str | None) -> str | None:
    """'Ahmet Yılmaz' -> 'Ahmet Y.'"""
    if not full_name or not full_name.strip():
        return None
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0]
    return f"{' '.join(parts[:-1])} {parts[-1][0].upper()}."


def ensure_workflow(
    db: Session,
    case: CaseModel,
    *,
    protocol_no: str | None = None,
    patient_name: str | None = None,
    ward: str | None = None,
    commit: bool = True,
) -> CaseWorkflowModel:
    wf = case.workflow
    if wf is None:
        wf = CaseWorkflowModel(
            case_id=case.id,
            protocol_no=(protocol_no or extract_protocol_from_text(case.raw_text) or default_protocol_no(case)),
            patient_name=patient_name,
            ward=ward or "Kardiyoloji Servisi",
            status="pending",
            events=[],
        )
        db.add(wf)
        case.workflow = wf
        if commit:
            db.commit()
            db.refresh(wf)
    return wf


def derive_status(wf: CaseWorkflowModel) -> str:
    if wf.closed:
        return "closed"
    if wf.education_status == "done":
        return "education_done"
    if wf.education_status == "planned":
        return "education_planned"
    if wf.contacted:
        return "contacted"
    return "pending"


def apply_action(wf: CaseWorkflowModel, action: str, note: str | None, author: str) -> None:
    if action not in WORKFLOW_ACTIONS:
        raise ValueError(f"Bilinmeyen aksiyon: {action}")

    if action == "contacted":
        wf.contacted = True
    elif action == "education_planned":
        wf.education_status = "planned"
    elif action == "education_done":
        wf.education_status = "done"
    elif action == "closed":
        wf.closed = True
    elif action == "reopened":
        wf.closed = False
    elif action == "note" and not (note and note.strip()):
        raise ValueError("Not metni boş olamaz.")

    events = list(wf.events or [])
    events.append(
        {
            "action": action,
            "label": WORKFLOW_ACTIONS[action],
            "note": note.strip() if note and note.strip() else None,
            "author": author or "Klinik Personel",
            "at": datetime.now(UTC).isoformat(),
        }
    )
    wf.events = events  # reassign so SQLAlchemy detects JSON change
    wf.status = derive_status(wf)
    wf.updated_at = datetime.now(UTC)


def reconcile_medications(raw_text: str, medications: list[dict]) -> dict:
    """
    Compare extracted medications with the original epikriz text.

    Returns:
      items:       one row per extracted medication with verification flags
      unextracted: known HF drugs mentioned in the text but missing from the extracted list
    """
    low_text = tr_lower(raw_text)
    items = []
    extracted_lower = []

    for med in medications:
        name = med.get("name", "")
        span = (med.get("source_span") or {}).get("text") or ""
        name_found = bool(name) and tr_lower(name.split("(")[0].strip()) in low_text
        span_found = bool(span) and tr_lower(span.strip()) in low_text
        dose = med.get("dose_text") or ""
        dose_found = bool(dose) and tr_lower(dose.replace(" ", "")) in low_text.replace(" ", "")

        if name_found and (span_found or dose_found):
            status = "verified"
        elif name_found:
            status = "partial"
        else:
            status = "not_found"

        items.append(
            {
                "name": name,
                "dose_text": dose,
                "frequency_text": med.get("frequency_text") or "",
                "timing_text": med.get("timing_text"),
                "source_text": span or None,
                "name_found": name_found,
                "dose_found": dose_found,
                "status": status,
            }
        )
        extracted_lower.append(tr_lower(name))

    unextracted = []
    joined_extracted = " ".join(extracted_lower)
    for generic, aliases in KNOWN_HF_DRUGS.items():
        hit = next((a for a in aliases if re.search(rf"\b{re.escape(a)}", low_text)), None)
        if not hit:
            continue
        if any(a in joined_extracted for a in aliases):
            continue
        # capture the line the drug appears on, for context
        line = next((ln.strip() for ln in raw_text.splitlines() if hit in tr_lower(ln)), "")
        unextracted.append({"generic": generic, "matched_alias": hit, "context": line or None})

    return {"items": items, "unextracted": unextracted}
