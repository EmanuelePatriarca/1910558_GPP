from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[Broker] Nuova replica connessa! Repliche attive: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[Broker] Una replica si è disconnessa. Repliche rimaste: {len(self.active_connections)}")

    async def broadcast(self, message: str, sensor_id: str = None):
        # Aggiungiamo il sensor_id al payload JSON per le repliche!
        try:
            data = json.loads(message)
            if sensor_id:
                data["sensor_id"] = sensor_id
            payload = json.dumps(data)
        except json.JSONDecodeError:
            # Se non fosse un json valido, usiamo il raw
            payload = message

        # Funzione asincrona locale per inviare al singolo client
        async def send(connection: WebSocket):
            try:
                await connection.send_text(payload)
            except Exception:
                # Se l'invio fallisce, è probabile che il client sia "morto" (es. staccato improvvisamente)
                self.disconnect(connection)

        # Eseguiamo tutti gli invii contemporaneamente per non creare ritardi (collo di bottiglia)
        if self.active_connections:
            await asyncio.gather(*(send(conn) for conn in self.active_connections))

manager = ConnectionManager()
