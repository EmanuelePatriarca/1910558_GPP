
CREATE TABLE IF NOT EXISTS seismic_events (
    sensor_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,       -- TIMESTAMPTZ gestisce i fusi orari
    category_event VARCHAR(50) NOT NULL,
    dominant_frequency DOUBLE PRECISION NOT NULL,
    
    -- La tua eccellente Chiave Primaria Composta!
    PRIMARY KEY (sensor_id, timestamp)
);