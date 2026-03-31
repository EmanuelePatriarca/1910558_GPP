from fastapi import APIRouter
from app.services.devices_service import get_devices_service

router = APIRouter()

@router.get("/devices")
async def get_devices():
    return await get_devices_service()