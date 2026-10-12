"""TaburcuAI FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="TaburcuAI API",
    description=(
        "Kalp yetmezliği taburculuk talimatlarının anlaşılmasını ölçen yapay zeka asistanı."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return service liveness status.

    This endpoint is intentionally simple and dependency-free so that
    infrastructure probes and the frontend connectivity check always succeed
    as long as the process is running.
    """
    return {"status": "ok", "service": "taburcuai-backend"}
