import json
import os
import sys
from flask import Flask, request
from waitress import serve
import logging
from utils import check_iterable_integrity
from data_schemas import *

app = Flask(__name__)

if not os.path.isdir("logs"):
    os.mkdir("logs")

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
        logging.warning(f"({request.remote_addr}) Invalid data from user UTF-8 decode failed when creating alarm.")
        return "Bad data"
    
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user not a valid JSON when creating alarm.")
        return "Bad data"

    logging.info(f"({request.remote_addr}) New Public alarm")

    return "ok"

@app.route("/create_account", methods=["POST"])
def create_account():
    try:
        data = request.data.decode("UTF-8")
    except UnicodeDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user UTF-8 decode failed when creating account.")
        return "Bad data. Should I give you more debug info by the fact that you are not supposed to use this private API? Oh, you'r lucky today! The data you sent don't seems to be UTF-8 encoded. (Don't say my boss that I helped you!)"
    
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user not a valid JSON when creating account.")
        return "Bad data. I don't want to give you more info about this error. (Or you can read the code at <a href=\"https://github.com/PardaSuperDev/DringTime\">https://github.com/PardaSuperDev/DringTime</a> to see the problem.)"
    
    if not check_iterable_integrity(parsed, ACCOUNT_CREATION_PACKET_SCHEMA):
        return "Bad data. The given information seems to be wrong. Why are you trying to use our private API? SUS"
    
    logging.info(f"({request.remote_addr}) Creating new account. Username: {parsed['username']}")

    return "OUI"
    

if __name__ == "__main__":
    port = 5000
    serve(app, host='0.0.0.0', port=port)
