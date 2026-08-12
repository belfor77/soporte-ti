from fastapi import FastAPI
import psutil
import socket
import docker
from datetime import datetime

app = FastAPI(title="T-SALES CLOUD API")

client = docker.from_env()

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/api/system")
def system():

    cpu = psutil.cpu_percent(interval=0.5)

    ram = psutil.virtual_memory().percent

    disk = psutil.disk_usage("/").percent

    hostname = socket.gethostname()

    ip = socket.gethostbyname(hostname)

    containers = client.containers.list()

    return {

        "cpu": cpu,

        "ram": ram,

        "disk": disk,

        "hostname": hostname,

        "ip": ip,

        "docker": len(containers),

        "time": datetime.now().strftime("%H:%M:%S")

    }
