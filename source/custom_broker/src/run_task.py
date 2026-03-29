from fastapi import FastAPI
import asyncio
import httpx
import websockets   
from contextlib import asynccontextmanager

http_client = httpx.AsyncClient()

async def connect_to_sensor(sensor_id: str):
    uri = f"ws://localhost:8080/api/device/{sensor_id}/ws"

    replica_url = f"http://localhost:9000/api/process_data/{sensor_id}/ws"

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
                                headers={"Content-Type": "application/json"}
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

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8080/api/devices/")
            devices = response.json()

        for device in devices:
            sensor_id = device["id"]
            task = asyncio.create_task(connect_to_sensor(sensor_id))
            tasks.append(task)
    
    except Exception as e:
        print(f"Impossibile recuperare i dispositivi dal simulatore: {e}")

    yield

    print("Spegnimento del Broker...")
    for task in tasks:
        task.cancel()