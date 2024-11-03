import json
from hashlib import sha256
import logging
import time
import getpass
import uuid
import os
import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import request
import yaml
import secrets
import asyncio

SALT_SIZE = 32
EMAIL = "contact@dring-time.fr"
SMTP_SERVER = "ssl0.ovh.net"
EMAIL_PASSWORD = getpass.getpass() # TODO : get from env variables
VALIDATION_TOKEN_EXPIRATION_DELAY = 30 * 60 # 30 minutes
ACCOUNT_TOKEN_EXPIRATION_DELAY = 30 * 60
WEB_SERVER = "http://localhost:5000"

with open("email-presets.yaml", encoding="UTF-8") as file:
    presets = yaml.safe_load(file.read())


class DbManager:
    def __init__(self):
        with open("data/data.json", "r") as file:
            self.data = json.loads(file.read())
        self.waiting_email_tokens = {}
        self.connected_tokens = {}
        self.email_validation_waiting_tokens = {}
    
    def get_alarm(self, pid):
        if pid in self.data["alarms"]:
            return self.data["alarms"][pid]
        return None
    
    def get_providers(self):
        return self.data["providers"]
    
    def create_account(self, username, email, password):
        if username.lower() in self.data["used-usernames"]:
            return False, "existing_account"
                
        salt = os.urandom(32).hex()
        hashed = sha256((salt+password).encode("UTF-8")).hexdigest()
        uuuid = str(uuid.uuid4())

        self.data["accounts"][uuuid] = {
            "email" : email,
            "username": username,
            "password": hashed,
            "salt": salt,
            "email-validation": False,
            "owned-alarms": []
        }

        self.data["used-usernames"][username.lower()] = uuuid

        self.save()

        token = asyncio.run(self.verify_email(uuuid))

        email_validation_waiting_token = secrets.token_urlsafe(32)

        self.email_validation_waiting_tokens[email_validation_waiting_token] = (token, uuuid)

        return True, email_validation_waiting_token
    
    def is_email_validated(self, token):
        if not token in self.email_validation_waiting_tokens:
            return "unexisting_waiting_token"
        
        print(self.waiting_email_tokens)
        
        if self.email_validation_waiting_tokens[token][0] in self.waiting_email_tokens:
                return "waiting"
        else:
            uuuid = self.email_validation_waiting_tokens[token][1]
            if self.data["accounts"][uuuid]["email-validation"]:
                return "validated"
            else:
                return "expired"

    def save(self):
        data = json.dumps(self.data)
        with open("data/data.json", "w") as file:
            file.write(data)
    
    async def verify_email(self, uuid):
        self.check_tokens_expiration()
        port = 465  # For SSL

        sender_email = EMAIL
        receiver_email = self.data["accounts"][uuid]["email"]

        # Génère le token de vérification
        token = secrets.token_urlsafe(50)
        self.waiting_email_tokens[token] = {
            "uuid": uuid,
            "expiration-date": time.time() + VALIDATION_TOKEN_EXPIRATION_DELAY
        }

        link = f"{WEB_SERVER}/validate_email/{token}"

        # Ecrit le mail
        message = MIMEMultipart("alternative")
        message["Subject"] = presets["email_validation"]["subject"]
        message["From"] = sender_email
        message["To"] = receiver_email

        text = presets["email_validation"]["text"].format(validation_link=link, username=self.data["accounts"][uuid]["username"])

        html = presets["email_validation"]["html"].format(validation_link=link, username=self.data["accounts"][uuid]["username"])

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        message.attach(part1)
        message.attach(part2)

        # Envoie le mail
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, port, context=context) as server:
            server.login(sender_email, EMAIL_PASSWORD)
            print(server.sendmail(sender_email, receiver_email, message.as_string()))
        
        return token
    
    def check_tokens_expiration(self):
        for i in list(self.waiting_email_tokens.keys()):
            if time.time() > self.waiting_email_tokens[i]["expiration-date"]:
                self.waiting_email_tokens.pop(i)
                uuuid = self.waiting_email_tokens[i]["uuid"]
                if not self.data["accounts"][uuuid]["email-validation"]:
                    self.data["accounts"].pop(uuuid)
    
    def validate_token_email(self, token):
        self.check_tokens_expiration()
        if token not in self.waiting_email_tokens:
            logging.warning(f"({request.remote_addr}) Tryed to validate an expired token.")
            return False, "expired_token"
        
        if self.waiting_email_tokens[token]["uuid"] in self.data["accounts"]:
            user = self.data["accounts"][self.waiting_email_tokens[token]["uuid"]]
            user["email-validation"] = True
            self.save()
            logging.info(f"({request.remote_addr}) Validated email. Username: {self.data['accounts'][self.waiting_email_tokens[token]['uuid']]['username']}")
            self.waiting_email_tokens.pop(token)
            return True,
        logging.warning(f"({request.remote_addr}) Tryed to validate an email on an unexisting account. Original uuid : {self.waiting_email_tokens[token]['uuid']}")
        return False, "unknown"
    
    def connect_accout(self, username, password):
        self.check_expired_sessions()
        if username.lower() not in self.data["used-usernames"]:
            logging.warning(f"({request.remote_addr}) Tryed to connect to an unexisting account. Gived username : {username}")
            return False, {"error": "bad_credentials"}
        
        uuuid = self.data["used-usernames"][username.lower()]
        
        user = self.data["accounts"][uuuid]

        salt = user["salt"]
        hashed = sha256((salt+password).encode("UTF-8")).hexdigest()

        if hashed != user["password"]:
            logging.warning(f"({request.remote_addr}) Bad password. Username : {username}.")
            return False, {"error": "bad_credentials"}
        
        token = secrets.token_urlsafe(256)

        self.connected_tokens[token] = {
            "uuid": uuuid,
            "expiration-date": time.time() + ACCOUNT_TOKEN_EXPIRATION_DELAY
        }

        return True, token, {"username" : user["username"], "email": user["email"]}
    
    def check_expired_sessions(self):
        for i in list(self.connected_tokens.keys()):
            if time.time() > self.connected_tokens[i]["expiration-date"]:
                self.connected_tokens.pop(i)
    
    def disconnect_account(self, token):
        if token in self.connected_tokens:
            self.connected_tokens.pop(token)

    def update_account_expiration_date(self, token):
        if token not in self.connected_tokens:
            return "expired_session"
        if time.time() > self.connected_tokens[token]["expiration-date"]:
            self.connected_tokens.pop(token)
            return "expired_session"
        self.connected_tokens[token]["expiration-date"] = time.time() + ACCOUNT_TOKEN_EXPIRATION_DELAY
        return "Ok"

    def add_alarms(self, token, name, data):
        if token not in self.connected_tokens:
            logging.warning(f"({request.remote_addr}) The user seems to be disconnected sending alarms.")
            return False, "not_connected"
        if name in self.data["providers"]:
            logging.warning(f"({request.remote_addr}) Tryed to create alarms that already exist.")
            return False, "name_already_used"
        
        alarm_uuid = str(uuid.uuid4())
        
        user = self.data["accounts"][self.connected_tokens[token]["uuid"]]

        user["owned-alarms"].append(alarm_uuid)

        self.data["providers"][name] = alarm_uuid

        self.data["alarms"][alarm_uuid] = data

        self.save()
        return True,
