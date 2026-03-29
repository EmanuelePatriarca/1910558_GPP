import asyncio
import logging
import json
import os
import signal
import httpx
from httpx_sse import aconnect_sse
from app.core.config import settings

logger = logging.getLogger(__name__)

async def shutdown_sse_task(uri: str):
    while True:
        try:
            logger.info(f"Connecting to SSE at {uri}")
            # timeout=None is important to keep the connection open indefinitely
            async with httpx.AsyncClient(timeout=None) as client:
                async with aconnect_sse(client, "GET", uri) as event_source:
                    logger.info(f"Successfully connected to SSE at {uri}")
                    
                    async for sse in event_source.aiter_sse():
                        try:
                            data = json.loads(sse.data)
                            print(data)
                            content = data.get("command")

                            if content == "SHUTDOWN":
                                logger.warning("SHUTDOWN command received!")
                                os.kill(os.getpid(), signal.SIGTERM)

                        except json.JSONDecodeError:
                            logger.error(f"Failed to parse JSON: {sse.data}")
                        except Exception as e:
                            logger.error(f"Error processing SSE message: {e}")

        except httpx.RequestError as e:
            logger.warning(f"SSE connection error: {e}. Reconnecting in 5 seconds...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}. Reconnecting in 5 seconds...")

        await asyncio.sleep(5)

class ShutdownSSEManager:
    def __init__(self):
        self.task = None

    def start(self):
        self.task = asyncio.create_task(shutdown_sse_task(settings.SHUTDOWN_SSE_URI))

    async def stop(self):
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

shutdown_sse = ShutdownSSEManager()