import json
import os
import sys
from flask import Flask, request
from waitress import serve
import logging
from utils import check_iterable_integrity
from data_schemas import *

app = Flask(__name__)

logger = logging.getLogger("DT API") # Met en place le logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("logs/logs.log"), # Sortie dans le fichier de log
        logging.StreamHandler() # Sortie dans le stdout
    ]
)



with open("data/data.json", "r") as file:
    data = json.loads(file.read())
    

@app.route("/")
def index():
    """Page principale du site de l'API."""
    return "<p>Dring Time Website API. Hello! <a href='https://dring-time.fr'>Go to the website.</a></p><p>This API has no purpose of being a public API. Sorry!</p>"


@app.route("/alarms/<pid>")
def alarm(pid: str):
    """Permet à l'utilisateur de télécharger les sonneries pour un fournisseur avec
    le provider ID donné."""
    if pid in data["alarms"]:
        return data["alarms"][pid]
    
    return "Not found"

@app.route("/provider_list")
def provider_list():
    """Renvoie la liste des fournisseurs de sonneries liées à leur ID."""
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

@app.route("/create_account", methods=["POST"])
def create_account():
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
    
    if check_iterable_integrity(parsed, ACCOUNT_CREATION_PACKET_SCHEMA):
        return "Bad data"
    

if __name__ == "__main__":
    port = 5000
    serve(app, host='0.0.0.0', port=port)
