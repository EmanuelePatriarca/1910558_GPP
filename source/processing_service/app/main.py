from fastapi import FastAPI
from app.core.config import settings
from app.api import api_router
from app.services import broker_websocket
from app.services.shutdown_sse import shutdown_sse
from app.services.database_manager import db_manager
from contextlib import asynccontextmanager

def get_application() -> FastAPI:

    # Start dei vari task in background
    # 1) Ricezione dati in input tramite websocket
    # 2) Ricezione comando di shutdown tramite SSE

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        await db_manager.connect_to_db()
        broker_websocket.broker_manager.start()
        shutdown_sse.start()
        yield
        await broker_websocket.broker_manager.stop()
        await shutdown_sse.stop()
        await db_manager.close_db_connection()

    application = FastAPI(
        title=settings.PROJECT_NAME,
        lifespan=lifespan,
    )

    application.include_router(api_router.api_router, prefix="")

    return application

app = get_application()