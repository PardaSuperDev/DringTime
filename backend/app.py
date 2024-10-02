import json
import os
import sys
from flask import Flask, request
from waitress import serve
import logging

app = Flask(__name__)

logger = logging.getLogger("DT API")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("logs/logs.log"),
        logging.StreamHandler()
    ]
)



with open("data/data.json", "r") as file:
    data = json.loads(file.read())
    

@app.route("/")
def index():
    return "<p>Dring Time Website API. Hello! <a href='https://dring-time.fr'>Go to the website.</a></p><p>This API has no purpose of being a public API. Sorry!</p>"


@app.route("/alarms/<pid>")
def alarm(pid: str):
    if pid in data["alarms"]:
        return data["alarms"][pid]
    
    return "Not found"

@app.route("/provider_list")
def provider_list():
    return data["providers"]

@app.route("/send_public_alarms", methods=["POST"])
def send_public_alarms():
    try:
        data = request.data.decode("UTF-8")
    except UnicodeDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user")
        return "Bad data"
    
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user")
        return "Bad data"

    logging.info(f"({request.remote_addr}) New Public alarm")
    return "ok"

if __name__ == "__main__":
    port = 5000
    serve(app, host='0.0.0.0', port=port)
