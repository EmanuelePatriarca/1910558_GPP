from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "A Fragile Balance of Power"
    DATABASE_URL: str = ""
    BROKER_WEBSOCKET_URI: str = "ws://broker:8081/api/process_data/ws"
    SHUTDOWN_SSE_URI: str = "http://simulator:8080/api/control"

    class Config:
        env_file = ".env"


settings = Settings()
