"""Integration tests for FastAPI REST API endpoints."""

from fastapi.testclient import TestClient

from app.core.llm.mock import MockLLMClient
from app.db.session import Base, engine
from app.main import app


def setup_module():
    Base.metadata.create_all(bind=engine)


client = TestClient(app)

SAMPLE_DISCHARGE_TEXT = """
HACETTEPE HASTANESİ KARDİYOLOJİ TABURCULUK ÖZETİ
KLİNİK TANI: Akut Kalp Yetmezliği
İLAÇLAR:
- Lasix 40 mg: günde 1 kez sabah aç karnına.
ÖNERİLER:
- Kilo Takibi: Her sabah aç karnına tartılınız.
- Sıvı Kısıtlaması: Günde 1.5 litreden fazla sıvı almayınız.
UYARI BELİRTİLERİ:
- Ani nefes darlığı ve bacaklarda aşırı şişlik olursa acile başvurunuz.
KONTROL:
- 2 hafta sonra Kardiyoloji polikliniğine kontrol muayenesi için geliniz.
"""


def test_api_create_and_get_case(monkeypatch) -> None:
    # Use mock LLM with valid registered data
    mock_llm = MockLLMClient()
    mock_data = {
        "diagnosis_text": "Akut Kalp Yetmezliği",
        "medications": [
            {
                "name": "Lasix",
                "purpose": "Ödem",
                "dose_text": "40 mg",
                "frequency_text": "günde 1 kez",
                "timing_text": "sabah aç karnına",
                "source_span": {"text": "Lasix 40 mg: günde 1 kez sabah aç karnına."},
            }
        ],
        "daily_weight_monitoring": "Her sabah aç karnına tartılınız.",
        "fluid_restriction": "Günde 1.5 litreden fazla sıvı almayınız.",
        "warning_signs": ["Ani nefes darlığı ve bacaklarda aşırı şişlik olursa acile başvurunuz."],
        "follow_ups": [
            {
                "when_text": "2 hafta sonra",
                "with_whom": "Kardiyoloji polikliniği",
                "purpose": "kontrol",
                "source_span": {
                    "text": "2 hafta sonra Kardiyoloji polikliniğine kontrol muayenesi için geliniz."
                },
            }
        ],
    }
    mock_llm.register_json_response("kalp yetmezliği", mock_data)
    monkeypatch.setattr("app.api.v1.cases.get_llm_client", lambda: mock_llm)

    # 1. Create case
    res = client.post("/api/v1/cases", json={"raw_text": SAMPLE_DISCHARGE_TEXT})
    assert res.status_code == 201
    data = res.json()
    case_id = data["id"]
    assert data["disease"] == "heart_failure"
    assert len(data["simplified_plan"]["daily_schedule"]) == 1

    # 2. Get case
    get_res = client.get(f"/api/v1/cases/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == case_id

    # 3. Generate questions
    q_res = client.post(f"/api/v1/cases/{case_id}/questions")
    assert q_res.status_code == 200
    q_data = q_res.json()
    questions = q_data["questions"]
    assert len(questions) >= 3

    # 4. Submit answers
    answers_payload = [
        {
            "question_id": questions[0]["id"],
            "answer": "Her sabah aç karnına tuvaletten sonra tartılacağım",
        }
    ]
    ans_res = client.post(f"/api/v1/cases/{case_id}/answers", json={"answers": answers_payload})
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert "risk_report" in ans_data
    assert ans_data["risk_report"]["level"] in ["low", "medium", "high"]

    # 5. Staff list cases
    staff_res = client.get("/api/v1/staff/cases")
    assert staff_res.status_code == 200
    staff_data = staff_res.json()
    assert staff_data["total"] >= 1
    assert any(c["case_id"] == case_id for c in staff_data["cases"])
