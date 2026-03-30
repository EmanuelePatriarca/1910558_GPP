from fastapi import APIRouter
from app.api.endpoints import events_websocket_api, history_api

api_router = APIRouter()

api_router.include_router(events_websocket_api.router, tags=["websockets"])
api_router.include_router(history_api.router, tags=["history"])
