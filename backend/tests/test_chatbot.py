import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_chatbot_faq_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/chatbot/faq")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 10
        # Check specific KBY NSAID rule exists
        nsaid = next((f for f in data if f["id"] == "kby-nsaid-warning"), None)
        assert nsaid is not None
        assert "NSAİİ" in nsaid["answer"]

@pytest.mark.asyncio
async def test_chatbot_ask_faq_match():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/chatbot/ask", json={
            "query": "Böbrek hastasıyım apranax veya majezik ağrı kesici alabilir miyim?",
            "disease": "kidney_failure"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["warning_level"] == "danger"
        assert "KESİNLİKLE KULLANMAMALIDIR" in data["answer"]
        assert data["matched_faq_id"] == "kby-nsaid-warning"

@pytest.mark.asyncio
async def test_chatbot_emergency_detection():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/chatbot/ask", json={
            "query": "Göğsüm sıkışıyor ve nefes alamıyorum çok fenayım",
        })
        assert res.status_code == 200
        data = res.json()
        assert data["emergency_detected"] is True
        assert "112" in data["answer"]
