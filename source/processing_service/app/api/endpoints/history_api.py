from fastapi import APIRouter, HTTPException
from app.services.database_manager import get_seismic_history, connect_to_db
from app.schemas.event_data import EventDataResponse

router = APIRouter()

@router.get("/history", response_model=list[EventDataResponse])
async def get_history():
    
    conn = await connect_to_db()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection error")
    
    try:
        history = await get_seismic_history(conn)
        return history
    finally:
        await conn.close()
