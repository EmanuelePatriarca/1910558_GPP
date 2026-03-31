from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.run_task import lifespan
from src.connection_manager import manager
from src.get_devices import get_devices_router


app = FastAPI(title="Custom Seismic Broker", lifespan=lifespan)

# Configurazione CORS per consentire l'accesso da web frontend esterni
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modifica questo mettendo l'URL del tuo client web (es. ["http://localhost:3000"]) in produzione
    allow_credentials=False,
    allow_methods=["*"],  # Consente tutti i metodi: GET, POST, DELETE, ecc.
    allow_headers=["*"],  # Consente tutti gli headers
)

app.include_router(get_devices_router)

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



