from fastapi import FastAPI
from src.run_task import lifespan


app = FastAPI(title="Custom Seismic Broker", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"status": "Broker is running", "message": "Benvenuto nel Custom Seismic Broker!"}

