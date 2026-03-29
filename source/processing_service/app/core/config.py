from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "A Fragile Balance of Power"
    DATABASE_URL: str

    class Config:
        env_file = ".env"


settings = Settings()