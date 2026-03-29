# Usa un'immagine ufficiale di Python leggera (versione 3.11)
FROM python:3.11-slim

# Imposta la cartella di lavoro dentro il container
WORKDIR /app

# Copia il file dei requisiti e installa le dipendenze
# (Lo facciamo prima per sfruttare la cache di Docker e velocizzare le build future)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia tutto il resto del tuo codice (main.py e run_task.py) nel container
COPY . .

# Espone la porta standard di FastAPI (utile per Uvicorn)
EXPOSE 8000

# Il comando per avviare il tuo broker FastAPI
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]