from fastapi import FastAPI
from app.core.config import settings
from app.api import api_router


def get_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME
    )

    application.include_router(api_router.api_router, prefix="")

    return application

app = get_application()