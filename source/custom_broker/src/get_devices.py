from fastapi import APIRouter, HTTPException
import httpx

get_devices_router = APIRouter()

@get_devices_router.get("/api/devices", tags=["devices"])
async def get_devices():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://simulator:8080/api/devices/")
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503, detail=f"Error communicating with simulator: {exc}"
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Non-successful response from simulator. Status: {exc.response.status_code}. Response: '{exc.response.text}'"
        )
