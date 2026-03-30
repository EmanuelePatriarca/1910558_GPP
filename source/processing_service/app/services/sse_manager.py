import asyncio
import logging
import json
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

class SSEManager:
    """
    Gestore centralizzato per lo streaming Server-Sent Events (SSE).
    Mantiene una lista di code (Queue) attive, una per ogni client connesso.
    """
    def __init__(self):
        # Insieme dei set di code per gestire più client simultaneamente
        self.active_queues: set[asyncio.Queue] = set()

    async def subscribe(self) -> AsyncGenerator[str, None]:
        """
        Sottoscrive un nuovo client allo stream.
        Crea una coda dedicata e genera messaggi nel formato SSE (data: ...\n\n).
        """
        queue = asyncio.Queue()
        self.active_queues.add(queue)
        logger.info(f"Nuovo client SSE connesso. Client attivi: {len(self.active_queues)}")
        
        try:
            while True:
                # Resta in attesa di nuovi messaggi dalla coda
                message = await queue.get()
                # Formattazione standard SSE: ogni messaggio deve terminare con doppia riga vuota
                yield f"data: {message}\n\n"
        except asyncio.CancelledError:
            logger.info("Connessione SSE chiusa dal client.")
            raise
        finally:
            # Pulizia della coda alla disconnessione
            self.active_queues.remove(queue)
            logger.info(f"Client SSE rimosso. Client attivi: {len(self.active_queues)}")

    async def broadcast(self, message: str):
        """
        Invia un messaggio a tutti i client attualmente sottoscritti.
        """
        if not self.active_queues:
            return

        # Distribuiamo il messaggio a tutte le code attive
        for queue in self.active_queues:
            await queue.put(message)

# Istanza globale del gestore SSE
sse_manager = SSEManager()
