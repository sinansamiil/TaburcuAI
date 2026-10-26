"""Tests for modular disease support, patient/staff management, and hospital white-labeling."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.diseases.registry import get_disease_module, DISEASE_CATALOG
from app.diseases.kidney_failure import KidneyFailureModule
from app.diseases.diabetes_type2 import DiabetesType2Module
from app.diseases.copd_respiratory import COPDModule
from app.core.pipeline.simplifier import simplify_discharge_plan
from app.core.schemas.models import DischargeInfo, Medication, SourceSpan


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_disease_registry_resolves_all_modules():
    hf = get_disease_module("heart_failure")
    assert hf.id == "heart_failure"

    kf = get_disease_module("kidney_failure")
    assert isinstance(kf, KidneyFailureModule)
    assert kf.id == "kidney_failure"
    assert len(kf.question_templates()) >= 4

    dia = get_disease_module("diabetes_type2")
    assert isinstance(dia, DiabetesType2Module)
    assert dia.id == "diabetes_type2"

    copd = get_disease_module("copd_respiratory")
    assert isinstance(copd, COPDModule)
    assert copd.id == "copd_respiratory"


def test_kidney_failure_questions_and_safety():
    mod = KidneyFailureModule()
    questions = mod.question_templates()
    q_ids = [q["id"] for q in questions]
    assert "q_kf_potassium_diet" in q_ids
    assert "q_kf_forbidden_nsaids" in q_ids
    assert "q_kf_phosphate_timing" in q_ids

    emergency_msg = mod.emergency_message()
    assert "böbrek yetmezliğinde acil müdahale" in emergency_msg.lower() or "112" in emergency_msg


def test_multi_disease_simplification():
    info = DischargeInfo(
        diagnosis_text="Kronik Böbrek Yetmezliği Evre 4",
        medications=[
            Medication(
                name="Renagel (Sevelamer) 800 mg",
                dose_text="800 mg",
                frequency_text="3x1",
                timing_text="yemek ortasında",
                source_span=SourceSpan(text="Renagel 800 mg", start=0, end=14),
            ),
            Medication(
                name="Anti-potasyum granül",
                dose_text="1 poşet",
                frequency_text="1x1",
                timing_text="sabah aç",
                source_span=SourceSpan(text="Anti-potasyum", start=0, end=13),
            ),
        ],
        warning_signs=["İdrar çıkışında azalma"],
    )

    plan = simplify_discharge_plan(info, disease_id="kidney_failure")

    # Verify friendly drug tag was added for phosphate binder
    renagel_med = next(m for m in plan.daily_schedule if "renagel" in m.name.lower())
    assert "Fosfat Bağlayıcı" in renagel_med.purpose

    # Verify NSAID avoidance for kidney disease is present
    has_nsaid_warning = any("NSAİİ" in w or "ağrı kesici" in w.lower() for w in plan.warning_signs)
    assert has_nsaid_warning

    # Verify potassium/phosphorus diet in routine
    has_potassium_diet = any("potasyum" in r.lower() for r in plan.daily_routine)
    assert has_potassium_diet


def test_doctor_crud_endpoints(client):
    # 1. List
    res = client.get("/api/v1/management/doctors")
    assert res.status_code == 200
    initial_count = len(res.json())

    # 2. Create
    new_doc = {
        "name": "Dr. Ayça Demir",
        "title": "Uzm. Dr.",
        "specialty": "Nefroloji",
        "email": "ayca.demir@hastane.com",
        "phone": "0532 999 88 77",
        "room": "B-210",
        "is_active": True,
    }
    create_res = client.post("/api/v1/management/doctors", json=new_doc)
    assert create_res.status_code == 201
    doc_id = create_res.json()["id"]

    # 3. Update
    upd_res = client.put(f"/api/v1/management/doctors/{doc_id}", json={"room": "B-215"})
    assert upd_res.status_code == 200
    assert upd_res.json()["room"] == "B-215"

    # 4. Delete
    del_res = client.delete(f"/api/v1/management/doctors/{doc_id}")
    assert del_res.status_code == 204


def test_nurse_crud_endpoints(client):
    res = client.get("/api/v1/management/nurses")
    assert res.status_code == 200

    new_nurse = {
        "name": "Hemşire Fatma Yıldız",
        "title": "Kardiyoloji Servis Hemşiresi",
        "ward": "Kardiyoloji Servisi",
        "shift": "Nöbetçi (16:00 - 08:00)",
        "phone": "0555 444 33 22",
    }
    create_res = client.post("/api/v1/management/nurses", json=new_nurse)
    assert create_res.status_code == 201
    nid = create_res.json()["id"]

    del_res = client.delete(f"/api/v1/management/nurses/{nid}")
    assert del_res.status_code == 204


def test_patient_crud_and_history(client):
    pat_data = {
        "protocol_no": "PRT-TEST-9999",
        "tc_kimlik": "11122233344",
        "name": "Test Hasta",
        "age": 55,
        "phone": "0500 123 45 67",
        "ward": "Nefroloji Kliniği",
        "assigned_doctor": "Prof. Dr. Deniz Aksoy",
        "primary_disease": "kidney_failure",
        "notes": "Test hasta kaydı",
    }
    res = client.post("/api/v1/management/patients", json=pat_data)
    assert res.status_code == 201
    pid = res.json()["id"]

    # Query history
    hist_res = client.get(f"/api/v1/management/patients/PRT-TEST-9999/history")
    assert hist_res.status_code == 200
    assert hist_res.json()["patient"]["name"] == "Test Hasta"

    # Clean up
    client.delete(f"/api/v1/management/patients/{pid}")


def test_hospital_config_and_presets(client):
    # 1. Get config
    res = client.get("/api/v1/hospital/config")
    assert res.status_code == 200
    data = res.json()
    assert "hospital_name" in data
    assert "primary_color" in data

    # 2. Update config
    upd_res = client.put(
        "/api/v1/hospital/config",
        json={"hospital_name": "Özel Test Hastanesi", "primary_color": "#ff0000"},
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["hospital_name"] == "Özel Test Hastanesi"

    # 3. Presets
    presets_res = client.get("/api/v1/hospital/presets")
    assert presets_res.status_code == 200
    assert len(presets_res.json()["presets"]) >= 3

    # 4. Apply preset
    apply_res = client.post("/api/v1/hospital/presets/sehir_hastanesi/apply")
    assert apply_res.status_code == 200
    assert "Şehir" in apply_res.json()["hospital_name"]
