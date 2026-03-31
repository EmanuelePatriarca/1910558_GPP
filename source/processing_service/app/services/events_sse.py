import asyncio
import logging
import sys
from typing import AsyncGenerator
from datetime import datetime, timedelta, timezone
from app.services.database_manager import get_seismic_history, connect_to_db

logger = logging.getLogger(__name__)

class EventsSSEManager:

    def __init__(self):
        self.active_queues: set[asyncio.Queue] = set()

    async def subscribe(self) -> AsyncGenerator[str, None]:

        queue = asyncio.Queue()
        self.active_queues.add(queue)
        logger.error(f"Nuovo client SSE connesso. Client attivi: {len(self.active_queues)}")
        
        try:

            flag_new_connection_initial_history = False

            while True:

                message = await queue.get()
                yield f"data: {message}\n\n"

                if not flag_new_connection_initial_history:
                    conn = await connect_to_db()
                    if conn is not None:
                        history = await get_seismic_history(conn)
                        
                        # Define the time window for recent events
                        one_minute_ago = datetime.now(timezone.utc) - timedelta(minutes=1)
                        
                        recent_history = []
                        for elem in history:
                            elem_timestamp = datetime.fromisoformat(elem.timestamp.replace('Z', '+00:00'))
                            if elem_timestamp >= one_minute_ago:
                                recent_history.append(elem)

                        for elem in recent_history:
                            await self.broadcast(elem.model_dump_json())

                        await conn.close()
                        flag_new_connection_initial_history = True

                        print("Initial history delivered to the gateway. Number of event sent: " + str(len(recent_history)))
                        sys.stdout.flush()
                    else:
                        print("Initial history not retrieved")

        except asyncio.CancelledError:
            logger.info("Connessione SSE chiusa dal client.")
            raise
        finally:
            self.active_queues.remove(queue)
            logger.info(f"Client SSE rimosso. Client attivi: {len(self.active_queues)}")

    async def broadcast(self, message: str):

        if not self.active_queues:
            return

        for queue in self.active_queues:
            await queue.put(message)

events_sse_manager = EventsSSEManager()
