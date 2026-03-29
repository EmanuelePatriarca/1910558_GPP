import asyncio
import logging
import websockets
from app.core.config import settings
from app.services.vibration_analyzer import VibrationAnalyzer
from pydantic import ValidationError
from app.schemas.sensor_data import SensorDataInput

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

                        data = SensorDataInput.model_validate_json(message)
                        
                        await analyzer.add_data(data.sensor_id, data.timestamp, data.value)

                    except ValidationError as e:
                        logger.error(f"Failed to validate incoming data: {e} - Message: {message}")
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
