"""API v1 router bundle."""

from fastapi import APIRouter

from app.api.v1.cases import router as cases_router
from app.api.v1.staff import router as staff_router
from app.api.v1.management import router as management_router
from app.api.v1.hospital import router as hospital_router
from app.api.v1.chatbot import router as chatbot_router

api_v1_router = APIRouter(prefix="/v1")
api_v1_router.include_router(cases_router)
api_v1_router.include_router(staff_router)
api_v1_router.include_router(management_router)
api_v1_router.include_router(hospital_router)
api_v1_router.include_router(chatbot_router)
