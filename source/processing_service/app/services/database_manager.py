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
        print(f"Critical DB connection error: {e}")
        return None

async def save_seismic_event(conn, sensor_id: str, event_timestamp: str, category_event: str, dominant_frequency: float):

    if conn is None:
        print("Cannot save: DB connection is missing.")
        return

    try:

        parsed_timestamp = datetime.fromisoformat(event_timestamp.replace('Z', '+00:00'))
        # SQL Query with conflict management
        query = """
            INSERT INTO seismic_events (sensor_id, timestamp, category_event, dominant_frequency)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (sensor_id, timestamp) DO NOTHING;
        """
        
        # Execute the query passing the parameters
        result = await conn.execute(query, sensor_id, parsed_timestamp, category_event, dominant_frequency)
        
        # Check the operation result to log accordingly
        if result == "INSERT 0 1":
            print(f"NEW EVENT SAVED: {category_event} on {sensor_id}")
        else:
            print(f"DUPLICATE IGNORED: {category_event} on {sensor_id} (Already exists)")

    except Exception as e:
        print(f"Error during DB insertion: {e}")