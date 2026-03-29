from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "A Fragile Balance of Power"
    DATABASE_URL: str = ""
    BROKER_WEBSOCKET_URI: str = "ws://localhost:8080/api/process_data/ws"

    class Config:
        env_file = ".env"


settings = Settings()
