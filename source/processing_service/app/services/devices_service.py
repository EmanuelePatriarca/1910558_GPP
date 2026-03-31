import asyncio
import httpx
from fastapi import HTTPException


async def get_devices():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://broker:8000/api/devices/")
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503, detail=f"Error communicating with simulator: {exc}"
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code, detail=f"Non-successful response from simulator: {exc.response.text}"
        )