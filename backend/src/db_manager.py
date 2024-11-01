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
TOKEN_EXPIRATION_DELAY = 30*60 # 30 minutes
WEB_SERVER = "http://localhost:5000"

with open("email-presets.yaml", encoding="UTF-8") as file:
    presets = yaml.safe_load(file.read())


class DbManager:
    def __init__(self):
        with open("data/data.json", "r") as file:
            self.data = json.loads(file.read())
        self.waiting_tokens = {}
    
    def get_alarm(self, pid):
        if pid in self.data["alarms"]:
            return self.data["alarms"][pid]
        return None
    
    def get_providers(self):
        return self.data["providers"]
    
    def create_account(self, username, email, password):
        if username.lower() in self.data["used-usernames"]:
            return False, "existing_account"
        
        self.data["used-usernames"].append(username.lower())
        
        salt = os.urandom(32).hex()
        hashed = sha256((salt+password).encode("UTF-8")).hexdigest()
        uuuid = str(uuid.uuid4())

        self.data["accounts"][uuuid] = {
            "email" : email,
            "username": username,
            "password": hashed,
            "salt": salt,
            "email-validation": False
        }

        self.save()

        asyncio.run(self.verify_email(uuuid))

        return True, "ok"

    
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
        self.waiting_tokens[token] = {
            "uuid": uuid,
            "expiration-date": time.time() + TOKEN_EXPIRATION_DELAY
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
    
    def check_tokens_expiration(self):
        for i in list(self.waiting_tokens.keys()):
            if time.time() > self.waiting_tokens[i]["expiration-date"]:
                self.waiting_tokens.pop(i)
    
    def validate_token_email(self, token):
        self.check_tokens_expiration()
        if token not in self.waiting_tokens:
            logging.warning(f"({request.remote_addr}) Tryed to validate an expired token.")
            return False, "expired_token"
        
        if self.waiting_tokens[token]["uuid"] in self.data["accounts"]:
            user = self.data["accounts"][self.waiting_tokens[token]["uuid"]]
            user["email-validation"] = True
            self.save()
            logging.info(f"({request.remote_addr}) Validated email. Username: {self.data['accounts'][self.waiting_tokens[token]['uuid']]['username']}")
            return True,
        logging.warning(f"({request.remote_addr}) Tryed to validate an email on an unexisting account. Original uuid : {self.waiting_tokens[token]['uuid']}")
        return False, "unknown"
    
