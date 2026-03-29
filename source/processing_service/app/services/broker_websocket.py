import asyncio
import logging
import websockets
import json
from datetime import datetime
from app.core.config import settings
from app.services.process_data import VibrationAnalyzer

logger = logging.getLogger(__name__)

analyzer = VibrationAnalyzer("sensor-01", window_size=512, step_size=128)

async def broker_websocket_task(uri: str):
    while True:
        try:
            logger.info(f"Connecting to WebSocket at {uri}")
            async with websockets.connect(uri) as websocket:
                logger.info(f"Successfully connected to {uri}")
                while True:
                    message = await websocket.recv()
                    try:
                        data = json.loads(message)

                        # Parse the ISO 8601 timestamp string into a Unix epoch float
                        timestamp_str = data.get("timestamp")
                        timestamp = datetime.fromisoformat(timestamp_str).timestamp() if timestamp_str else 0.0
                        
                        value = float(data.get("value", 0.0))

                        await analyzer.add_data(timestamp, value)

                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse JSON: {message}")
                    except Exception as e:
                        logger.error(f"Error processing websocket message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed. Reconnecting in 5 seconds...")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}. Reconnecting in 5 seconds...")
        
        await asyncio.sleep(5)

class BrokerWebsocketManager:
    def __init__(self):
        self.task = None

    def start(self):
        self.task = asyncio.create_task(broker_websocket_task(settings.BROKER_WEBSOCKET_URI))

    async def stop(self):
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

broker_manager = BrokerWebsocketManager()
