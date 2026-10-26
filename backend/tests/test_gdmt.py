"""Tests for Heart Failure GDMT 4-pillar analysis and clinical phenotyping."""

from app.diseases.heart_failure.gdmt import analyze_heart_failure_case, extract_clinical_phenotype, analyze_gdmt


def test_phenotype_extraction():
    text = "KARDİYOLOJİ TABURCULUK. KLİNİK TANI: Akut Dekompanse Kalp Yetmezliği. EF: %30, NYHA Sınıf III. Hedef Kuru Kilo: 74 kg."
    pheno = extract_clinical_phenotype(text)
    assert pheno["ejection_fraction"] == "%30"
    assert pheno["ef_value"] == 30
    assert pheno["phenotype_code"] == "HFrEF"
    assert "HFrEF" in pheno["phenotype"]
    assert pheno["nyha_class"] == "NYHA Sınıf III"
    assert pheno["dry_weight"] == "74 kg"


def test_gdmt_4_pillars():
    # Patient with Entresto (ARNI) and Beloc (Beta Blocker)
    meds = [
        {"name": "Entresto 49/51 mg"},
        {"name": "Beloc ZOK 50 mg"},
        {"name": "Lasix 40 mg"},
    ]
    raw_text = "Entresto ve Beloc ZOK başlandı. Lasix sabah aç."
    analysis = analyze_heart_failure_case(raw_text, meds, "HFrEF EF: %35")

    gdmt = analysis["gdmt"]
    assert gdmt["total_pillars"] == 4
    # ARNI met (pillar 1), Beta Blocker met (pillar 2), MRA missing (pillar 3), SGLT2i missing (pillar 4)
    assert gdmt["pillars_met"] == 2
    assert gdmt["score_percent"] == 50
    assert gdmt["loop_diuretic_prescribed"] is True
    assert len(gdmt["clinical_recommendations"]) > 0
