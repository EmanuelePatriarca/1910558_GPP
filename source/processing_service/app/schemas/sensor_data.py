from pydantic import BaseModel, field_validator
from datetime import datetime

class SensorDataInput(BaseModel):
    sensor_id: str
    timestamp: float
    value: float

    @field_validator("timestamp", mode="before")
    @classmethod
    def parse_timestamp(cls, value):
        if isinstance(value, str):
            return datetime.fromisoformat(value).timestamp()
        return float(value)