
CREATE TABLE IF NOT EXISTS seismic_events (
    event_id SERIAL NOT NULL, 
    sensor_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,       -- TIMESTAMPTZ gestisce i fusi orari
    category_event VARCHAR(50) NOT NULL,
    dominant_frequency DOUBLE PRECISION NOT NULL,
    
    PRIMARY KEY (event_id, sensor_id, category_event)
);