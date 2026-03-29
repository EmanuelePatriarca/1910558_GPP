from pydantic import BaseModel

class ShutdownRequest(BaseModel):
    command: str