import asyncio
import websockets
from contextlib import asynccontextmanager
from fastapi import FastAPI
import json

async def connect_to_broker():
    uri = "ws://broker:8000/ws/stream"
    
    while True:
        try:
            print(f"[*] Tentativo di connessione al broker: {uri}")
            async with websockets.connect(uri) as websocket:
                print("[+] Connesso al broker! In ascolto di messaggi dal simulatore...")
                while True:
                    messaggio_dal_broker = await websocket.recv()
                    
                    try:
                        dati = json.loads(messaggio_dal_broker)
                        # Recupera il sensor_id iniettato dal Broker
                        sensor_id = dati.get("sensor_id", "Sconosciuto")
                        print(f" BERSAGLIO COLPITO! | Dati: {dati}")
                    except json.JSONDecodeError:
                        print(f" [REPLICA MSG CATTURATO Raw] {messaggio_dal_broker}")
                    
        except Exception as e:
            print(f"[-] Errore connessione al broker: {e}. Riprovo tra 5 secondi...")
            await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Avvia la connessione persistente al broker in background
    task = asyncio.create_task(connect_to_broker())
    yield
    task.cancel()

app = FastAPI(title="Finta Replica di Test (Subscriber)", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "Replica Subscriber is running", "message": "Finta Replica Sub in funzione!"}
