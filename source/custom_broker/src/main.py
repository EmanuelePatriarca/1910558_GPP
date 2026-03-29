from fastapi import FastAPI
from run_task import lifespan


app = FastAPI(title="Custom Seismic Broker", lifespan=lifespan)


