from fastapi import FastAPI
from app.core.config import settings
from app.api import api_router
from app.services import broker_websocket
from contextlib import asynccontextmanager

def get_application() -> FastAPI:

    # Start del task in background per la ricezione dei dati dal broker

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        broker_websocket.broker_manager.start()
        yield
        await broker_websocket.broker_manager.stop()

    application = FastAPI(
        title=settings.PROJECT_NAME,
        lifespan=lifespan,
    )

    application.include_router(api_router.api_router, prefix="")

    return application

app = get_application()