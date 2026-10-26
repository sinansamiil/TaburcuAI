"""
Heart Failure GDMT (Guideline-Directed Medical Therapy) & Clinical Phenotyping Engine.

Based on ESC 2021/2023 and ACC/AHA Heart Failure Guidelines:
- Identifies the 4 GDMT Pillars for HFrEF:
  1. ARNI / ACEi / ARB (Sacubitril/Valsartan preferred)
  2. Evidence-Based Beta Blocker (Metoprolol succinate, Bisoprolol, Carvedilol, Nebivolol)
  3. MRA (Spironolactone, Eplerenone)
  4. SGLT2 Inhibitor (Dapagliflozin, Empagliflozin)
- Tracks Loop Diuretics (Furosemide, Torasemide) for decongestion.
- Extracts Clinical Phenotype (EF %, NYHA Class, Dry Weight).
"""

from __future__ import annotations

import re
from typing import Any

# Pillar drug definitions (generic + trade brand names in Turkey)
GDMT_PILLARS = [
    {
        "id": "arni_acei_arb",
        "name": "1. Sütun: ARNI / ACEi / ARB",
        "short_name": "ARNI / ACEi",
        "guideline_class": "ESC Sınıf I, Düzey A",
        "target": "Renin-Anjiyotensin-Aldosteron & Neprilisin İnhibisyonu",
        "drugs": {
            "ARNI (Tercih Edilen)": ["entresto", "sakubitril", "sacubitril"],
            "ACE İnhibitörü": ["ramipril", "delix", "enalapril", "konveril", "enapril", "lisinopril", "perindopril", "coversyl"],
            "ARB": ["valsartan", "diovan", "kandesartan", "candesartan", "atacand", "losartan", "cozaar"],
        },
        "missing_note": "Reçetede ARNI (Entresto) veya ACEi/ARB tespit edilmedi. Kontrendikasyon (hipotansiyon/böbrek yetmezliği) yoksa başlanması önerilir.",
    },
    {
        "id": "beta_blocker",
        "name": "2. Sütun: Kanıta Dayalı Beta-Bloker",
        "short_name": "Beta-Bloker",
        "guideline_class": "ESC Sınıf I, Düzey A",
        "target": "Sempatik Sinir Sistemi Blokajı & Ritim Kontrolü",
        "drugs": {
            "Metoprolol Süksinat": ["beloc", "saneloc", "metoprolol"],
            "Bisoprolol": ["concor", "bisoprolol", "bisoprol"],
            "Karvedilol": ["dilatrend", "karvedilol", "carvedilol"],
            "Nebivolol": ["vasoxen", "nebivolol"],
        },
        "missing_note": "Reçetede kanıta dayalı beta bloker (Metoprolol/Bisoprolol/Karvedilol) tespit edilmedi. Övolemi sağlandığında düşük dozla başlanıp titre edilmelidir.",
    },
    {
        "id": "mra",
        "name": "3. Sütun: Mineralokortikoid Reseptör Antagonisti (MRA)",
        "short_name": "MRA",
        "guideline_class": "ESC Sınıf I, Düzey A",
        "target": "Miyokardiyal Fibrozis Önleme & Aldosteron Blokajı",
        "drugs": {
            "Spironolakton": ["aldactone", "spironolakton", "spironolactone"],
            "Eplerenon": ["inspra", "eplerenon", "eplerenone"],
        },
        "missing_note": "Reçetede MRA grubu (Aldactone/Inspra) tespit edilmedi. Taburculuk sonrası potasyum (<5.0 mEq/L) ve kreatinin stabil olduğunda eklenmesi önerilir.",
    },
    {
        "id": "sglt2i",
        "name": "4. Sütun: SGLT2 İnhibitörü",
        "short_name": "SGLT2i",
        "guideline_class": "ESC Sınıf I, Düzey A",
        "target": "Kardiyovasküler Ölüm & Hospitalizasyon Azaltımı",
        "drugs": {
            "Dapagliflozin": ["forxiga", "dapagliflozin"],
            "Empagliflozin": ["jardiance", "empagliflozin"],
        },
        "missing_note": "Reçetede SGLT2 inhibitörü (Forxiga/Jardiance) tespit edilmedi. Diyabet olsun ya da olmasın tüm HFrEF hastalarında taburculuk öncesi veya erken kontrolde başlanmalıdır.",
    },
]

LOOP_DIURETICS = {
    "Furosemid": ["lasix", "furosemid", "desal", "furomid"],
    "Torasemid": ["torasemid", "torem"],
}

_TR_LOWER = str.maketrans("İIŞĞÜÖÇ", "iışğüöç")


def _tr_lower(text: str) -> str:
    return text.translate(_TR_LOWER).lower() if text else ""


def extract_clinical_phenotype(raw_text: str, diagnosis_text: str = "") -> dict[str, Any]:
    """Extract EF %, NYHA Class, Dry Weight, and determine HF phenotype."""
    combined = f"{raw_text} {diagnosis_text}"
    low_combined = _tr_lower(combined)

    # 1. Ejection Fraction (EF %)
    ef_val: int | None = None
    ef_display: str | None = None

    # Patterns like "EF: %30", "LVEF %35", "EF % 28", "ejeksiyon fraksiyonu: %40", "EF: 35%"
    patterns = [
        r"(?:lvef|ef|ejeksiyon\s+fraksiyonu)\s*[:=]?\s*[%]?\s*(\d{2})\s*[%]?",
        r"[%]\s*(\d{2})\s*(?:lvef|ef)?",
        r"ef\s*[%]?\s*(\d{2})",
    ]
    for p in patterns:
        m = re.search(p, low_combined)
        if m:
            try:
                candidate = int(m.group(1))
                if 10 <= candidate <= 75:
                    ef_val = candidate
                    ef_display = f"%{candidate}"
                    break
            except ValueError:
                pass

    # Phenotype determination based on ESC criteria
    if ef_val is not None:
        if ef_val <= 40:
            phenotype = f"HFrEF (Düşük Ejeksiyon Fraksiyonu, EF ≤ %40)"
            phenotype_code = "HFrEF"
        elif 41 <= ef_val <= 49:
            phenotype = f"HFmrEF (Hafif Azalmış Ejeksiyon Fraksiyonu, EF %41-%49)"
            phenotype_code = "HFmrEF"
        else:
            phenotype = f"HFpEF (Korunmuş Ejeksiyon Fraksiyonu, EF ≥ %50)"
            phenotype_code = "HFpEF"
    elif "hfref" in low_combined or "düşük ejeksiyon" in low_combined:
        phenotype = "HFrEF (Düşük Ejeksiyon Fraksiyonlu Kalp Yetmezliği)"
        phenotype_code = "HFrEF"
    elif "hfmref" in low_combined or "hafif azalmış" in low_combined:
        phenotype = "HFmrEF (Hafif Azalmış Ejeksiyon Fraksiyonu)"
        phenotype_code = "HFmrEF"
    elif "hfpef" in low_combined or "korunmuş ejeksiyon" in low_combined:
        phenotype = "HFpEF (Korunmuş Ejeksiyon Fraksiyonu)"
        phenotype_code = "HFpEF"
    else:
        phenotype = "Klinik Kalp Yetersizliği (EF Belirtilmemiş)"
        phenotype_code = "HF_UNSPECIFIED"

    # 2. NYHA Class
    nyha_display: str | None = None
    nyha_match = re.search(r"nyha\s*(?:class|sınıf[ıi]?)?\s*([ivı1-4]+)", low_combined)
    if nyha_match:
        raw_nyha = nyha_match.group(1).replace("ı", "i").upper()
        # normalize 1->I, 2->II, 3->III, 4->IV
        mapping = {"1": "I", "2": "II", "3": "III", "4": "IV"}
        normalized = mapping.get(raw_nyha, raw_nyha)
        if normalized in ["I", "II", "III", "IV"]:
            nyha_display = f"NYHA Sınıf {normalized}"

    # 3. Dry Weight (Kuru Kilo)
    dry_weight: str | None = None
    weight_match = re.search(r"(?:kuru\s+kilo|taburculuk\s+kilosu?|hedef\s+kilo)\s*[:=]?\s*(\d{2,3}(?:[.,]\d)?)\s*(?:kg)?", low_combined)
    if weight_match:
        dry_weight = f"{weight_match.group(1)} kg"

    return {
        "ejection_fraction": ef_display,
        "ef_value": ef_val,
        "phenotype": phenotype,
        "phenotype_code": phenotype_code,
        "nyha_class": nyha_display,
        "dry_weight": dry_weight,
    }


def analyze_gdmt(raw_text: str, medications: list[dict[str, Any]] | list[Any]) -> dict[str, Any]:
    """
    Evaluate discharge medications against ESC 4-pillar GDMT guidelines.

    Returns:
      - pillars: list of status for each of the 4 pillars
      - pillars_met: count of pillars satisfied (0-4)
      - total_pillars: 4
      - score_percent: 0-100
      - compliance_level: label
      - loop_diuretic_prescribed: bool
      - loop_diuretic_drug: str | None
      - clinical_recommendations: list of suggestions for staff
    """
    # Extract medication names and details into lower case list
    med_names: list[str] = []
    for m in medications:
        if isinstance(m, dict):
            name = m.get("name", "")
        else:
            name = getattr(m, "name", "")
        if name:
            med_names.append(_tr_lower(name))

    combined_meds_text = " ".join(med_names) + " " + _tr_lower(raw_text)

    analyzed_pillars = []
    pillars_met_count = 0

    for p in GDMT_PILLARS:
        matched_drug_name: str | None = None
        matched_category: str | None = None

        # Check each sub-category
        for cat_name, aliases in p["drugs"].items():
            for alias in aliases:
                # Prioritize exact search in extracted medication names
                for m_text in med_names:
                    if alias in m_text:
                        matched_drug_name = m_text.title()
                        matched_category = cat_name
                        break
                if matched_drug_name:
                    break

            if matched_drug_name:
                break

        # If not found in medication list, check raw text for mention
        if not matched_drug_name:
            for cat_name, aliases in p["drugs"].items():
                for alias in aliases:
                    if re.search(rf"\b{re.escape(alias)}", _tr_lower(raw_text)):
                        matched_drug_name = f"{alias.title()} (Metinde Mevcut)"
                        matched_category = cat_name
                        break
                if matched_drug_name:
                    break

        is_prescribed = matched_drug_name is not None
        if is_prescribed:
            pillars_met_count += 1

        analyzed_pillars.append(
            {
                "pillar_id": p["id"],
                "name": p["name"],
                "short_name": p["short_name"],
                "guideline_class": p["guideline_class"],
                "target": p["target"],
                "status": "prescribed" if is_prescribed else "missing",
                "matched_drug": matched_drug_name,
                "matched_category": matched_category,
                "clinical_note": (
                    f"{matched_category or 'İlaç'}: {matched_drug_name} reçete edilmiş."
                    if is_prescribed
                    else p["missing_note"]
                ),
            }
        )

    # Check loop diuretic
    loop_prescribed = False
    loop_drug_name: str | None = None
    for generic, aliases in LOOP_DIURETICS.items():
        for alias in aliases:
            for m_text in med_names:
                if alias in m_text:
                    loop_prescribed = True
                    loop_drug_name = f"{generic} ({m_text.title()})"
                    break
            if loop_prescribed:
                break
        if loop_prescribed:
            break

    score_pct = int((pillars_met_count / 4) * 100)
    if pillars_met_count == 4:
        compliance_level = "Tam Uyumlu (ESC Kılavuz Standardı)"
        badge_variant = "success"
    elif pillars_met_count == 3:
        compliance_level = "Yüksek Uyum (1 Sütun Eksik)"
        badge_variant = "primary"
    elif pillars_met_count == 2:
        compliance_level = "Kısmi Uyum (2 Sütun Eksik)"
        badge_variant = "warning"
    else:
        compliance_level = "Düşük Kılavuz Uyumu (Öncelikli Titrasyon)"
        badge_variant = "danger"

    # Formulate clinical recommendations
    recommendations: list[str] = []
    missing_pillars = [p["name"] for p in analyzed_pillars if p["status"] == "missing"]
    if missing_pillars:
        recommendations.append(
            f"Kılavuz Uyarısı: Reçetede eksik kalan sütunlar ({', '.join(missing_pillars)}), "
            "hekim kontrolünde tolere edildikçe sırayla eklenmelidir."
        )

    if loop_prescribed:
        recommendations.append(
            "Konjesyon Yönetimi: Kıvrım diüretiği reçete edilmiş. Hastanın sabah aç karnına alması, "
            "gece idrara kalkmayı önlemek için vurgulanmalıdır."
        )
    else:
        recommendations.append(
            "Diüretik Notu: Kıvrım diüretiği reçetelenmemiş. Hastanın övolemik (ödem yok) olduğu doğrulanmalıdır."
        )

    recommendations.append(
        "Kardiyak Güvenlik Kuralı: 3 günde 2 kg kilo artışı ve ortopne (yastık sayısını artırma) acil dekompansasyon habercisidir."
    )

    return {
        "pillars_met": pillars_met_count,
        "total_pillars": 4,
        "score_percent": score_pct,
        "compliance_level": compliance_level,
        "badge_variant": badge_variant,
        "pillars": analyzed_pillars,
        "loop_diuretic_prescribed": loop_prescribed,
        "loop_diuretic_drug": loop_drug_name,
        "clinical_recommendations": recommendations,
    }


def analyze_heart_failure_case(
    raw_text: str,
    medications: list[dict[str, Any]] | list[Any],
    diagnosis_text: str = "",
) -> dict[str, Any]:
    """Complete Heart Failure clinical analysis: Phenotype + 4-Pillar GDMT."""
    phenotype = extract_clinical_phenotype(raw_text, diagnosis_text)
    gdmt = analyze_gdmt(raw_text, medications)
    return {
        "phenotype": phenotype,
        "gdmt": gdmt,
    }
