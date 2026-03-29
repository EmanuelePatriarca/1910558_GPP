from fastapi import FastAPI
import asyncio
import httpx
import websockets   
from contextlib import asynccontextmanager
import itertools

REPLICAS = [
    "http://replica-1:8081",
    "http://replica-2:8082",
    "http://replica-3:8083",
    "http://replica-4:8084",
    "http://replica-5:8085",
]
replica_cycle = itertools.cycle(REPLICAS)

http_client = httpx.AsyncClient()

async def connect_to_sensor(sensor_id: str):
    uri = f"ws://simulator:8080/api/device/{sensor_id}/ws"

    base_url = next(replica_cycle)
    replica_url = f"{base_url}/api/process_data/ws"

    while True: 
            try:
                print(f"[*] Tentativo di connessione a {uri}...")
                async with websockets.connect(uri, ping_interval=None) as websocket:
                    print(f"[+] Connesso con successo al sensore {sensor_id}!")
                    
                    while True:
                        message = await websocket.recv()
                        
                        try:
                            await http_client.post(
                                replica_url, 
                                content=message,
                                headers={"Content-Type": "application/json", "Sensor-ID": f"{sensor_id}"}
                                )
                        except httpx.ConnectError:
                            pass
                
            except Exception as e:
                print(f"[-] Errore con {sensor_id}: {e}. Riprovo tra 5 secondi...")
                await asyncio.sleep(5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Avvio del Broker: cerco i sensori disponibili...")
    tasks = []

    # Tentiamo di connetterci al simulatore finché non è pronto
    max_retries = 10
    retry_delay = 3
    devices = []

    async with httpx.AsyncClient() as client:
        for attempt in range(max_retries):
            try:
                response = await client.get("http://simulator:8080/api/devices/")
                response.raise_for_status()
                devices = response.json()
                print("Simulatore contattato con successo!")
                break
            except Exception as e:
                print(f"Simulatore non ancora pronto... (Tentativo {attempt + 1}/{max_retries}). Riprovo tra {retry_delay}s")
                await asyncio.sleep(retry_delay)
        else:
            print("Impossibile recuperare i dispositivi dal simulatore dopo ripetuti tentativi!")

    if devices:
        for device in devices:
            sensor_id = device["id"]
            task = asyncio.create_task(connect_to_sensor(sensor_id))
            tasks.append(task)

    yield

    print("Spegnimento del Broker...")
    for task in tasks:
        task.cancel()