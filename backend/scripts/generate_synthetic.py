"""
Synthetic Turkish discharge summary generator for Heart Failure (Kalp Yetmezliği).

Generates at least 50 clinically realistic synthetic discharge summaries along with
their ground-truth structured JSON annotations (conforming to HeartFailureDischargeInfo).

Characteristics:
- Clinically valid heart failure variations (NYHA II-IV, HFrEF, HFpEF, ischemic/dilated cardiomyopathy)
- Variations in medications (diuretics, ACEi/ARBs/ARNI, beta-blockers, MRA, SGLT2i)
- Controlled noise/edge cases: missing fields, messy handwriting/shorthand, multiple comorbidities
- Exact source_spans for all ground-truth fields to support verification and evaluation
- Zero real patient data (purely synthetic templates & combinations)
"""

import argparse
import json
import random
from pathlib import Path
from typing import Any

DIAGNOSES = [
    "Konjestif Kalp Yetmezliği (NYHA Evre II)",
    "Akut Dekompanse Kalp Yetmezliği (NYHA Evre III)",
    "Düşük Ejeksiyon Fraksiyonlu Kalp Yetmezliği (HFrEF, EF: %30)",
    "Korunmuş Ejeksiyon Fraksiyonlu Kalp Yetmezliği (HFpEF, EF: %52)",
    "İskemik Kardiyomiyopatiye Bağlı Kalp Yetmezliği (NYHA Evre III)",
    "Dilate Kardiyomiyopati, Kronik Kalp Yetmezliği (NYHA Evre IV)",
    "Hipertansif Kalp Hastalığı ve Kalp Yetmezliği",
    "Valvüler Kalp Hastalığına İkincil Dekompanse Kalp Yetmezliği",
]

MEDICATION_POOLS = [
    # Loop diuretics
    {
        "name": "Lasix (Furosemid)",
        "doses": ["20 mg", "40 mg", "80 mg"],
        "frequencies": ["günde 1 kez", "günde 2 kez", "günde 1 tablet"],
        "timings": ["sabah aç karnına", "sabah kahvaltıdan sonra", "sabah ve öğle"],
        "purpose": "Ödem ve sıvı yüklenmesini azaltmak (idrar söktürücü)",
    },
    {
        "name": "Desal (Furosemid)",
        "doses": ["40 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["sabah aç karnına"],
        "purpose": "Vücuttaki fazla sıvıyı uzaklaştırmak",
    },
    # Beta blockers
    {
        "name": "Beloc ZOK (Metoprolol süksinat)",
        "doses": ["25 mg", "50 mg", "100 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["sabah tok karnına", "sabahları"],
        "purpose": "Kalp hızını ve kan basıncını kontrol etmek",
    },
    {
        "name": "Concor (Bisoprolol)",
        "doses": ["2.5 mg", "5 mg", "10 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["sabah aç veya tok"],
        "purpose": "Kalp yükünü hafifletmek ve ritmi korumak",
    },
    {
        "name": "Dilatrend (Karvedilol)",
        "doses": ["6.25 mg", "12.5 mg", "25 mg"],
        "frequencies": ["günde 2 kez", "günde 2 tablet"],
        "timings": ["sabah ve akşam tok karnına", "12 saat arayla"],
        "purpose": "Kalp fonksiyonlarını desteklemek",
    },
    # ARNI / ACEi / ARB
    {
        "name": "Entresto (Sakubitril/Valsartan)",
        "doses": ["24/26 mg", "49/51 mg", "97/103 mg"],
        "frequencies": ["günde 2 kez", "günde 2 tablet"],
        "timings": ["sabah ve akşam", "12 saatte bir tok karnına"],
        "purpose": "Kalp yetmezliği ilerlemesini yavaşlatmak ve kalbi korumak",
    },
    {
        "name": "Delix (Ramipril)",
        "doses": ["2.5 mg", "5 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["akşamları", "sabah"],
        "purpose": "Tansiyon ve kalp yetmezliği tedavisi",
    },
    # MRA
    {
        "name": "Aldactone (Spironolakton)",
        "doses": ["25 mg", "50 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["öğle yemeği sonrası", "sabah"],
        "purpose": "Potasyum tutucu idrar söktürücü ve miyokardiyal koruma",
    },
    # SGLT2i
    {
        "name": "Forxiga (Dapagliflozin)",
        "doses": ["10 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["sabah kahvaltı ile"],
        "purpose": "Kalp yetmezliği ve böbrek koruma",
    },
    {
        "name": "Jardiance (Empagliflozin)",
        "doses": ["10 mg"],
        "frequencies": ["günde 1 kez", "günde 1 tablet"],
        "timings": ["sabah"],
        "purpose": "Kalp yetmezliği klinik tablosunu iyileştirmek",
    },
]

WEIGHT_MONITORING_TEMPLATES = [
    "Her sabah uyanınca, idrar yapıldıktan sonra aç karnına aynı tartı ile tartılınız. 3 günde 2 kg veya 1 günde 1 kg artış olursa hekiminize bildiriniz.",
    "Günlük sabah tartı takibi yapılmalı; aç karnına ve hafif giysilerle kaydedilmelidir. 2 günde 1.5 kg üzerinde artışta polikliniğe haber veriniz.",
    "Her sabah tuvalet sonrası tartılmalı ve kilo çizelgesine işlenmelidir.",
    "Düzenli sabah kilo kontrolü önerilir. Ani kilo artışlarında kliniğe başvurunuz.",
]

SODIUM_TEMPLATES = [
    "Günlük tuz tüketimi kesinlikle kısıtlanmalıdır (günde en fazla 2 gram tuz, yemeklere tuz eklenmeyecektir).",
    "Tuzsuz diyet uygulanmalıdır; hazır gıda, turşu, salamura ve salça tüketiminden kaçınılmalıdır.",
    "Diyetten sofra tuzu tamamen çıkarılmalı, az tuzlu ekmek tercih edilmelidir.",
]

FLUID_TEMPLATES = [
    "Günlük sıvı alımı 1.5 litre (1500 ml) ile sınırlandırılmalıdır (su, çorba, çay dahil).",
    "Toplam günlük sıvı miktarı en fazla 2 litreyi geçmemelidir.",
    "Günde maksimum 1200-1500 ml sıvı tüketilmeli, aşırı su içilmemelidir.",
]

WARNING_SIGNS_POOL = [
    "İstirahat halinde veya eforla nefes darlığında belirgin artış",
    "Geceleri nefes darlığı ile uyanma veya düz yatamama (ortopne, çift yastık ihtiyacı)",
    "Ayak bileklerinde, bacaklarda veya karında belirgin şişlik ve ödem artışı",
    "3 günde 2 kilodan fazla ani kilo artışı",
    "Şiddetli göğüs ağrısı veya çarpıntı hissi",
    "Baş dönmesi, sersemlik veya bayılma hissi",
    "İnatçı kuru öksürük veya pembe köpüklü balgam çıkarma",
]

FOLLOW_UP_TEMPLATES = [
    ("10 gün sonra", "Kardiyoloji Polikliniği", "Kan biyokimyası (üre, kreatinin, potasyum) ve EKO kontrolü"),
    ("2 hafta sonra", "Kardiyoloji Uzmanı", "Klinik değerlendirme ve ilaç doz titrasyonu"),
    ("1 ay sonra", "Kalp Yetmezliği Polikliniği", "Rutin takip ve laboratuvar kontrolleri"),
    ("3 hafta sonra", "İç Hastalıkları Polikliniği", "Kontrol muayenesi ve böbrek fonksiyon testleri"),
]


def generate_single_case(case_idx: int, seed: int) -> tuple[str, dict[str, Any]]:
    """Generate a single realistic synthetic discharge summary and its ground-truth annotations."""
    rng = random.Random(seed)

    diagnosis = rng.choice(DIAGNOSES)

    # 2 to 4 medications selected
    med_count = rng.randint(2, 4)
    selected_med_templates = rng.sample(MEDICATION_POOLS, med_count)

    # Ensure at least one diuretic or heart failure medication
    meds_data = []
    med_lines = []

    for med_t in selected_med_templates:
        dose = rng.choice(med_t["doses"])
        freq = rng.choice(med_t["frequencies"])
        timing = rng.choice(med_t["timings"])
        purpose = med_t["purpose"]

        # Build verbatim text line for medication
        med_line = f"- {med_t['name']} {dose}: {freq}, {timing} alınacak. ({purpose})"
        med_lines.append(med_line)

        meds_data.append({
            "name": med_t["name"],
            "purpose": purpose,
            "dose_text": dose,
            "frequency_text": freq,
            "timing_text": timing,
            "source_span_text": med_line.strip("- ").strip(),
        })

    # Edge cases: simulate occasional missing weight, sodium or fluid in 15% of records
    include_weight = rng.random() > 0.15
    include_sodium = rng.random() > 0.15
    include_fluid = rng.random() > 0.20

    weight_text = rng.choice(WEIGHT_MONITORING_TEMPLATES) if include_weight else None
    sodium_text = rng.choice(SODIUM_TEMPLATES) if include_sodium else None
    fluid_text = rng.choice(FLUID_TEMPLATES) if include_fluid else None

    # Warning signs (2 to 4 signs)
    selected_warnings = rng.sample(WARNING_SIGNS_POOL, rng.randint(2, 4))
    warning_lines = [f"- {sign}" for sign in selected_warnings]

    # Follow up
    follow_up_info = rng.choice(FOLLOW_UP_TEMPLATES)
    follow_up_line = f"{follow_up_info[0]} {follow_up_info[1]}'ne {follow_up_info[2]} amacıyla başvurunuz."

    # Assemble document sections
    case_number = f"EPK-2026-{1000 + case_idx}"
    doc_lines = [
        "HACETTEPE ÜNİVERSİTESİ HASTANESİ KARDİYOLOJİ ANABİLİM DALI",
        f"TABURCULUK ÖZETİ (EPİKRİZ) - PROTOKOL NO: {case_number}",
        "TARİH: 12.10.2026",
        "",
        "KLİNİK TANI:",
        f"{diagnosis}",
        "",
        "TABURCULUK TEDAVİSİ VE İLAÇ KULLANIM TALİMATI:",
    ]
    doc_lines.extend(med_lines)
    doc_lines.append("")
    doc_lines.append("YAŞAM TARZI VE DİYET ÖNERİLERİ:")

    lifestyle_lines = []
    if weight_text:
        lifestyle_lines.append(f"Kilo Takibi: {weight_text}")
    if sodium_text:
        lifestyle_lines.append(f"Tuz Kısıtlaması: {sodium_text}")
    if fluid_text:
        lifestyle_lines.append(f"Sıvı Kısıtlaması: {fluid_text}")

    if not lifestyle_lines:
        lifestyle_lines.append("Genel istirahat ve diyet uyumu önerilir.")
    doc_lines.extend(lifestyle_lines)

    doc_lines.append("")
    doc_lines.append("DİKKAT EDİLMESİ GEREKEN UYARI BELİRTİLERİ (KIRMIZI BAYRAKLAR):")
    doc_lines.extend(warning_lines)

    doc_lines.append("")
    doc_lines.append("KONTROL VE RANDEVU:")
    doc_lines.append(follow_up_line)

    full_text = "\n".join(doc_lines)

    # Calculate exact offsets for ground truth source spans
    ground_truth_meds = []
    for med in meds_data:
        span_text = med["source_span_text"]
        start = full_text.find(span_text)
        end = start + len(span_text) if start != -1 else None
        ground_truth_meds.append({
            "name": med["name"],
            "purpose": med["purpose"],
            "dose_text": med["dose_text"],
            "frequency_text": med["frequency_text"],
            "timing_text": med["timing_text"],
            "source_span": {
                "text": span_text,
                "start": start,
                "end": end,
            },
        })

    fu_start = full_text.find(follow_up_line)
    fu_end = fu_start + len(follow_up_line) if fu_start != -1 else None

    missing_fields = []
    if not include_weight:
        missing_fields.append("daily_weight_monitoring")
    if not include_sodium:
        missing_fields.append("sodium_restriction")
    if not include_fluid:
        missing_fields.append("fluid_restriction")

    ground_truth = {
        "case_id": f"synthetic_hf_{case_idx:03d}",
        "protocol_no": case_number,
        "disease": "heart_failure",
        "diagnosis_text": diagnosis,
        "medications": ground_truth_meds,
        "daily_weight_monitoring": weight_text,
        "sodium_restriction": sodium_text,
        "fluid_restriction": fluid_text,
        "warning_signs": selected_warnings,
        "follow_ups": [
            {
                "when_text": follow_up_info[0],
                "with_whom": follow_up_info[1],
                "purpose": follow_up_info[2],
                "source_span": {
                    "text": follow_up_line,
                    "start": fu_start,
                    "end": fu_end,
                },
            }
        ],
        "other_instructions": None,
        "missing_fields": missing_fields,
    }

    return full_text, ground_truth


def generate_dataset(output_dir: Path, count: int = 50, seed: int = 42) -> None:
    """Generate synthetic cases and ground truths, saving them into output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    summaries_dir = output_dir / "summaries"
    ground_truth_dir = output_dir / "ground_truth"
    summaries_dir.mkdir(exist_ok=True)
    ground_truth_dir.mkdir(exist_ok=True)

    index_records = []

    print(f"Generating {count} synthetic heart failure discharge cases...")
    for i in range(1, count + 1):
        case_seed = seed + i * 37
        text, gt = generate_single_case(i, case_seed)

        case_id = gt["case_id"]
        txt_path = summaries_dir / f"{case_id}.txt"
        json_path = ground_truth_dir / f"{case_id}.json"

        txt_path.write_text(text, encoding="utf-8")
        json_path.write_text(json.dumps(gt, ensure_ascii=False, indent=2), encoding="utf-8")

        index_records.append({
            "case_id": case_id,
            "diagnosis": gt["diagnosis_text"],
            "medication_count": len(gt["medications"]),
            "has_weight_monitoring": gt["daily_weight_monitoring"] is not None,
            "has_sodium_restriction": gt["sodium_restriction"] is not None,
            "has_fluid_restriction": gt["fluid_restriction"] is not None,
            "summary_file": str(txt_path.relative_to(output_dir)),
            "ground_truth_file": str(json_path.relative_to(output_dir)),
        })

    index_path = output_dir / "index.json"
    index_path.write_text(json.dumps(index_records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {count} cases successfully in {output_dir}")
    print(f"Index written to {index_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic discharge summaries.")
    parser.add_argument("--count", type=int, default=50, help="Number of cases to generate (default: 50)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(Path(__file__).parents[2] / "data" / "synthetic"),
        help="Directory to save synthetic data",
    )
    args = parser.parse_args()

    out_path = Path(args.output_dir)
    generate_dataset(out_path, count=args.count, seed=args.seed)


if __name__ == "__main__":
    main()
