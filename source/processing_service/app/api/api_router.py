from fastapi import APIRouter
from app.api.endpoints import events_websocket_api

api_router = APIRouter()

api_router.include_router(events_websocket_api.router, tags=["websockets"])
