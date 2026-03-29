from fastapi import APIRouter
from app.api.endpoints import process_data

api_router = APIRouter()

api_router.include_router(process_data.router, prefix="/process_data", tags=["process_data"])
