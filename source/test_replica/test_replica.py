from fastapi import FastAPI, Request, Header

app = FastAPI(title="Finta Replica di Test")

@app.get("/")
def read_root():
    return {"status": "Replica is running", "message": "Finta Replica in ascolto!"}

# Questo è l'endpoint esatto che il tuo Broker sta cercando di chiamare!
@app.post("/api/process_data/ws")
async def ricevi_dati(request: Request, sensor_id: str | None = Header(default=None)):
    # Leggiamo il "corpo" della richiesta (il JSON del professore)
    body = await request.body()
    
    # Stampiamo a schermo cosa è arrivato e da chi
    print(f" BERSAGLIO COLPITO! Sensore: {sensor_id} | Dati: {body.decode()}")
    
    return {"status": "ricevuto"}