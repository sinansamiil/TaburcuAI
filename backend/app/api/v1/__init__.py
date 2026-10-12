"""API v1 router bundle."""

from fastapi import APIRouter

from app.api.v1.cases import router as cases_router
from app.api.v1.staff import router as staff_router

api_v1_router = APIRouter(prefix="/v1")
api_v1_router.include_router(cases_router)
api_v1_router.include_router(staff_router)
