from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from src.run_task import lifespan
from src.connection_manager import manager


app = FastAPI(title="Custom Seismic Broker", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "Broker is running", "message": "Benvenuto nel Custom Seismic Broker!"}

# Nuova rotta in ascolto per le Repliche con i WebSockets
@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Rimane in attesa, mantenendo viva la connessione
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

