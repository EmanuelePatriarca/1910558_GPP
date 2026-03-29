from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.events_websocket import manager

router = APIRouter()

@router.websocket("/ws/events_stream")
async def processed_data_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)