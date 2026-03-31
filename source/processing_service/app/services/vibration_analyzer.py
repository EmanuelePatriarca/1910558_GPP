import sys
import numpy as np
import logging
from datetime import datetime, timezone
from app.services.events_sse import events_sse_manager
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
        self.ids_last_events_detected = {"earthquake": 0, "conventional_explosion": 0, "nuclear_like": 0}

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

        response = None

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

            # Send the results obtained via SSE to API Gateway (US-11)

            event_time = datetime.fromtimestamp(self.timestamps[-1], tz=timezone.utc).isoformat()
            
            response = EventDataResponse(
                event_id = 0,
                sensor_id=self.sensor_id,
                timestamp=event_time,
                category_event=categorize_event(dominant_freq),
                dominant_frequency=float(dominant_freq)
            )

        except Exception as e:
            logger.error(f"Error computing FFT: {e}")

        # Saving considerable events to db only if the previous event detected is different from the current one
        # Example: Earthquake begin -> event_detected = "earthquake" != "" -> Event saved
        #          Earthquake continues -> event_detected = "earthquake" == "earthquake" -> No event saved
        #          Earthquake ends -> event_detected = "" != "earthquake" -> Event not saved being not a considerable event
        #
        # This logic prevent the same replica to save event multiple time

        # Broadcast to gateway:
        # A considerable event is sent with category_event != "" only once, then it is sent with category_event = ""
        # in this way the frontend can correctly populate:
        # 1) the event history (considerable events are unique)
        # 2) the graph of all the events (considerable events are shown untile they last)

        if response is not None:
            try:

                if response.category_event != "":

                    if self.event_detected != response.category_event:
                        self.event_detected = response.category_event

                        event_id = self.ids_last_events_detected[response.category_event] + 1
                        self.ids_last_events_detected[response.category_event] = event_id

                        # event_id received also by gateway to maintain consistency between history in DB and data sent to frontend
                        response.event_id = event_id

                        await save_event(event_id, response.sensor_id, response.timestamp, response.category_event, response.dominant_frequency)
                        await events_sse_manager.broadcast(response.model_dump_json())

                    else:

                        response.category_event = ""
                        await events_sse_manager.broadcast(response.model_dump_json())

                else:

                    self.event_detected = response.category_event
                    await events_sse_manager.broadcast(response.model_dump_json())

            except Exception as e:
                logger.error(f"Error broadcasting event or saving event to DB: {e}")

def categorize_event(dominant_frequency):
    if dominant_frequency < 0.5:
        return ""
    elif dominant_frequency < 3.0:
        return "earthquake"
    elif dominant_frequency < 8.0:
        return "conventional_explosion"
    else:
        return "nuclear_like"
