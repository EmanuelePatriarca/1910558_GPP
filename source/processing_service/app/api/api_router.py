from fastapi import APIRouter
from app.api.endpoints import history_api, events_sse_api

api_router = APIRouter()

api_router.include_router(history_api.router, tags=["history"])
api_router.include_router(events_sse_api.router, tags=["streaming"])
