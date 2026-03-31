from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.events_sse import events_sse_manager

router = APIRouter()

@router.get("/events/stream")
async def events_sse_stream():

    return StreamingResponse(
        events_sse_manager.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" # Disabilita il buffering aggiuntivo su Nginx
        }
    )
