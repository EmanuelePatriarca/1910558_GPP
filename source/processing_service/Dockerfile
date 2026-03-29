# --- Stage 1: Build Stage ---
FROM python:3.11-slim AS builder

WORKDIR /processing_service

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies needed for building certain Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies into a temporary directory
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt


# --- Stage 2: Runtime Stage ---
FROM python:3.11-slim AS runtime

WORKDIR /processing_service

# Add a non-root user for security
RUN adduser --disabled-password --gecos "" nonrootuser

# Copy only the installed packages from the builder stage
COPY --from=builder /root/.local /home/nonrootuser/.local
COPY . .

# Ensure the appuser can access the installed packages and app files
RUN chown -R nonrootuser:nonrootuser /processing_service/app
USER nonrootuser

# Update PATH to include the local bin where packages were installed
ENV PATH=/home/nonrootuser/.local/bin:$PATHclea

# Expose the port FastAPI will run on
EXPOSE 8000

# Run the application using uvicorn
# Using 0.0.0.0 is mandatory for Docker to reach the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]