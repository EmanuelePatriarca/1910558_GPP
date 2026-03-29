from fastapi import FastAPI
import asyncio
import httpx
import websockets   
from contextlib import asynccontextmanager
import itertools

from src.connection_manager import manager

async def connect_to_sensor(sensor_id: str):
    uri = f"ws://simulator:8080/api/device/{sensor_id}/ws"

    while True: 
            try:
                print(f"[*] Tentativo di connessione a {uri}...")
                async with websockets.connect(uri, ping_interval=None) as websocket:
                    print(f"[+] Connesso con successo al sensore {sensor_id}!")
                    
                    while True:
                        message = await websocket.recv()
                        
                        try:
                            # Inoltra il messaggio a tutte le repliche connesse
                            await manager.broadcast(message, sensor_id)
                        except Exception as e:
                            print(f"Errore broadcast per {sensor_id}: {e}")
                
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