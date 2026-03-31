from fastapi import APIRouter
from app.api.endpoints import history_api, events_sse_api, health_api, devices_api

api_router = APIRouter()

api_router.include_router(history_api.router, tags=["history"])
api_router.include_router(events_sse_api.router, tags=["streaming"])
api_router.include_router(health_api.router, tags=["health"])
api_router.include_router(devices_api.router, tags=["devices"])

