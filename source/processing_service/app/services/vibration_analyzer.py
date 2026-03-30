import sys
import numpy as np
import logging
from datetime import datetime, timezone
from app.services.events_websocket import manager
from app.schemas.event_data import EventDataResponse
from app.services.database_manager import save_event

logger = logging.getLogger(__name__)

class VibrationAnalyzer:
    def __init__(self, sensor_id: str, window_size: int = 512, step_size: int = 128):
        self.window_size = window_size
        self.step_size = step_size
        self.timestamps = []
        self.values = []
        self.sensor_id = sensor_id
        self.event_detected = ""

    async def add_data(self, sensor_id, timestamp: float, value: float):

        if sensor_id == self.sensor_id:
            self.timestamps.append(timestamp)
            self.values.append(value)

        # Once we have enough data points, perform the FFT
        if len(self.values) >= self.window_size:
            await self.calculate_dominant_frequency()
            
            # Slide the window forward by removing the oldest 'step_size' elements
            self.timestamps = self.timestamps[self.step_size:]
            self.values = self.values[self.step_size:]

    async def calculate_dominant_frequency(self):
        try:
            t = np.array(self.timestamps)
            y = np.array(self.values)
            
            # Calculate the average sampling interval (dt)
            dt = np.mean(np.diff(t))
            if dt <= 0:
                return
                
            # Remove the DC offset (mean) to prevent a massive peak at 0 Hz
            y_centered = y - np.mean(y)

            # Perform real FFT
            yf = np.fft.rfft(y_centered)
            xf = np.fft.rfftfreq(len(y_centered), d=dt)

            # Find the index of the maximum magnitude
            magnitudes = np.abs(yf)
            dominant_idx = np.argmax(magnitudes)
            dominant_freq = xf[dominant_idx]
            
            # Send the results obtained via WebSocket to API Gateway

            event_time = datetime.fromtimestamp(self.timestamps[-1], tz=timezone.utc).isoformat()
            
            response = EventDataResponse(
                sensor_id=self.sensor_id,
                timestamp=event_time,
                category_event=categorize_event(dominant_freq),
                dominant_frequency=float(dominant_freq)
            )

            # Saving considerable events to db only if the previous event detected is different from the current one
            # Example: Earthquake begin -> event_detected = "earthquake" != "" -> Event saved
            #          Earthquake continues -> event_detected = "earthquake" == "earthquake" -> No event saved
            #          Earthquake ends -> event_detected = "" != "earthquake" -> Event not saved being not a considerable event
            #
            # This logic is to prevent the same replica to save event multiple time

            if response.category_event != "":

                if self.event_detected != response.category_event:
                    self.event_detected = response.category_event

                    if self.event_detected != "":
                        await save_event(response.sensor_id, response.timestamp, response.category_event, response.dominant_frequency)

                print(response.model_dump_json())


            await manager.broadcast(response.model_dump_json())
            
        except Exception as e:
            logger.error(f"Error computing FFT: {e}")

def categorize_event(dominant_frequency):
    if dominant_frequency < 0.5:
        return ""
    elif dominant_frequency < 3.0:
        return "earthquake"
    elif dominant_frequency < 5.0:
        return "conventional_explosion"
    else:
        return "nuclear_like"
