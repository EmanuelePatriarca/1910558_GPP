from fastapi import APIRouter
from app.api.endpoints import process_data, websockets

api_router = APIRouter()

api_router.include_router(websockets.router, tags=["websockets"])
