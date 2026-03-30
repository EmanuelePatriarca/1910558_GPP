import asyncpg
import os
from datetime import datetime

# Connection parameters (read from Docker environment variables or using defaults)
DB_USER = os.getenv("POSTGRES_USER", "admin")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "supersecret")
DB_DB = os.getenv("POSTGRES_DB", "seismic_data")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost") 
DB_PORT = os.getenv("POSTGRES_PORT", "5432")

async def connect_to_db():
    try:
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DB,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Error during connection to DB: {e}")
        return None

async def save_event(sensor_id: str, event_timestamp: str, category_event: str, dominant_frequency: float):

    conn = await connect_to_db()

    if conn is None:
        print("Connection to DB failed. Event not saved.")
        return

    try:
        parsed_timestamp = datetime.fromisoformat(event_timestamp.replace('Z', '+00:00'))

        time_bucket = get_time_bucket(parsed_timestamp, 2)

        query = """
            INSERT INTO seismic_events (sensor_id, parsed_timestamp, category_event, dominant_frequency, time_bucket)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (sensor_id, time_bucket, category_event) DO NOTHING;
        """

        result = await conn.execute(query, sensor_id, parsed_timestamp, category_event, dominant_frequency, time_bucket)

        if result == "INSERT 0 1":
            print(f"NEW EVENT SAVED: {category_event} on {sensor_id}")
        else:
            print(f"DUPLICATE IGNORED: {category_event} on {sensor_id} (Already exists)")

    except Exception as e:
        print(f"Error during DB insertion: {e}")

    finally:
        await conn.close()

def get_time_bucket(timestamp: datetime, window_seconds: int = 2) -> datetime:

    total_seconds = timestamp.hour * 3600 + timestamp.minute * 60 + timestamp.second
    bucketed_total_seconds = (total_seconds // window_seconds) * window_seconds

    hours, remainder = divmod(bucketed_total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    # New timestamp truncated to the bucket start: 12:00:01.789 -> 12:00:00
    return timestamp.replace(hour=hours, minute=minutes, second=seconds, microsecond=0)
