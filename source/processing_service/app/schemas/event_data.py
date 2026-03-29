from pydantic import BaseModel

class EventDataResponse(BaseModel):
    sensor_id: str
    timestamp: str
    category_event: str
    dominant_frequency: float