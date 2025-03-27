FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y gcc g++ libgl1-mesa-glx && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    cadquery \
    ocp_vscode \
    fastapi \
    uvicorn \
    python-dotenv\
    openai

WORKDIR /app

# Pre-cache CadQuery to reduce first-run latency
RUN python -c "import cadquery; print('CadQuery ready')"

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]