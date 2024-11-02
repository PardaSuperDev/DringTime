import json
import os
import sys
from flask import Flask, request, make_response
from waitress import serve
import logging
from db_manager import DbManager
from utils import check_iterable_integrity
from data_schemas import *
import mailbox

app = Flask(__name__)
db_manager = DbManager()

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


@app.route("/")
def index():
    """Page principale du site de l'API."""
    return "<p>Dring Time Website API. Hello! <a href='https://dring-time.fr'>Go to the website.</a></p><p>This API has no purpose of being a public API. Sorry!</p>"


@app.route("/alarms/<pid>")
def alarm(pid: str):
    """Permet à l'utilisateur de télécharger les sonneries pour un fournisseur avec
    le provider ID donné."""

    result = db_manager.get_alarm(pid)
    if result is not None:
        return result
    
    return "Not found"

@app.route("/provider_list")
def provider_list():
    """Renvoie la liste des fournisseurs de sonneries liées à leur ID."""
    return db_manager.get_providers()

@app.route("/send_public_alarms", methods=["POST"])
def send_public_alarms():
    try:
        data = request.data.decode("UTF-8")
    except UnicodeDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user UTF-8 decode failed when creating alarm.")
        return "Bad data. I'm french and the website is in majority used by french people but I like speaking english so that's why I'm doing so."
    
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user not a valid JSON when creating alarm.")
        return "Bad data. For your information, most of the packets are JSON."
    
    if not check_iterable_integrity(parsed, SEND_ALARMS_PACKET_SCHEMA):
        logging.warning(f"({request.remote_addr}) Invalid data from user the JSON doesn't match the schema.")
        return "Bad data. The only answer I can give to you is : <img src='https://media.tenor.com/yheo1GGu3FwAAAAM/rick-roll-rick-ashley.gif'>"
    
    token = request.cookies.get("SESSION-TOKEN")
    if token is None:
        logging.warning(f"({request.remote_addr}) The user seems to be disconnected sending alarms.")
        return "not_connected"

    result = db_manager.add_alarms(token, parsed["name"], parsed["data"])

    if not result[0]:
        return result[1]

    logging.info(f"({request.remote_addr}) New Public alarm")

    return "Ok"

@app.route("/connect_account", methods=["POST"])
def connect_account():
    try:
        data = request.data.decode("UTF-8")
    except UnicodeDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user UTF-8 decode failed when connecting to account.")
        return "Bad data. Bro, are you trying to break our website?"
    
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        logging.warning(f"({request.remote_addr}) Invalid data from user not a valid JSON when connecting to account.")
        return "Bad data. You can't use this API like this! please stop"
    
    if not check_iterable_integrity(parsed, ACCOUNT_CONNEXION_PACKET_SCHEMA):
        logging.warning(f"({request.remote_addr}) Invalid data from user the JSON doesn't match the schema. Potential API reverse engineering.")
        return "Bad data. Why are you trying to do this? Please juste watch the dring-time.fr website..."
    
    result = db_manager.connect_accout(parsed["username"], parsed["password"])

    if result[0]:
        logging.info(f"({request.remote_addr}) Connection successful. Username: {parsed['username']}")
        res = make_response("Ok")
        res.set_cookie("SESSION-TOKEN", result[1], secure=True, httponly=True)
        return res
    
    return result[1]
    
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
        logging.warning(f"({request.remote_addr}) Invalid data from user the JSON doesn't match the schema. Potential API reverse engineering.")
        return "Bad data. The given information seems to be wrong. Why are you trying to use our private API? SUS"

    result = db_manager.create_account(parsed["username"], parsed["email"], parsed["password"])

    if not result[0]:
        logging.warning(f"({request.remote_addr}) Tryed to create a new account but an account with the same username already exists. Username: {parsed['username']}")
        return {"error": result[1]}
    
    logging.info(f"({request.remote_addr}) Created new account. Username: {parsed['username']}")

    return {"waiting_token": result[1]}

@app.route("/is_email_validated/<token>")
def is_email_validated(token):
    return db_manager.is_email_validated(token)
    
@app.route("/validate_email/<token>")
def validate_token(token):
    result = db_manager.validate_token_email(token)
    if result[0]:
        return "Votre email a été validé, vous pouvez fermer cette fenetre. <script>window.onload = window.close</script>"
    else:
        return result[1]

if __name__ == "__main__":
    port = 5000
    serve(app, host='0.0.0.0', port=port)
