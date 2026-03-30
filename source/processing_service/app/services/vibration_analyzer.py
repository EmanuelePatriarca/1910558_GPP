import sys
import numpy as np
import logging
from datetime import datetime, timezone
from app.services.events_websocket import manager
from app.schemas.event_data import EventDataResponse

logger = logging.getLogger(__name__)

class VibrationAnalyzer:
    def __init__(self, sensor_id: str, window_size: int = 512, step_size: int = 128):
        self.window_size = window_size
        self.step_size = step_size
        self.timestamps = []
        self.values = []
        self.sensor_id = sensor_id

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

            # print(f"{dominant_freq:.2f}")
            sys.stdout.flush()

            # logger.info(f"Dominant Frequency found: {dominant_freq:.2f} Hz (Peak Magnitude: {magnitudes[dominant_idx]:.2f})")
            
            # Send the results obtained via WebSocket to API Gateway

            event_time = datetime.fromtimestamp(self.timestamps[-1], tz=timezone.utc).isoformat()
            
            response = EventDataResponse(
                sensor_id=self.sensor_id,
                timestamp=event_time,
                category_event=categorize_event(dominant_freq),
                dominant_frequency=float(dominant_freq)
            )

            if response.category_event != "":
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
