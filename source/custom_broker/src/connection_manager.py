from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[Broker] Nuova replica connessa! Repliche attive: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print("[Broker] Una replica si è disconnessa.")

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

        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                pass

manager = ConnectionManager()
