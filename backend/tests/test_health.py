"""Tests for the /health endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """Return a synchronous test client for the FastAPI app."""
    return TestClient(app)


class TestHealth:
    """Unit tests for GET /health."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """Health endpoint must respond with HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_body_has_status_ok(self, client: TestClient) -> None:
        """Response body must contain {"status": "ok"}."""
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "ok"

    def test_health_body_has_service_name(self, client: TestClient) -> None:
        """Response body must identify the service."""
        response = client.get("/health")
        data = response.json()
        assert data["service"] == "taburcuai-backend"

    def test_health_content_type_is_json(self, client: TestClient) -> None:
        """Response must be JSON."""
        response = client.get("/health")
        assert "application/json" in response.headers["content-type"]
