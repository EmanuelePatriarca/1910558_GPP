from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.sse_manager import sse_manager

router = APIRouter()

@router.get("/events/stream")
async def events_sse_stream():
    """
    Endpoint per lo streaming SSE dei dati sismici elaborati.
    Restituisce una StreamingResponse che mantiene aperta la connessione HTTP.
    """
    return StreamingResponse(
        sse_manager.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" # Disabilita il buffering aggiuntivo su Nginx
        }
    )
