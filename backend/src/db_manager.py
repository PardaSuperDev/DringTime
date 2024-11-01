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

SALT_SIZE = 32
EMAIL = "contact@dring-time.fr"
SMTP_SERVER = "ssl0.ovh.net"
EMAIL_PASSWORD = getpass.getpass() # TODO : get from env variables

with open("email-presets.yaml", encoding="UTF-8") as file:
    presets = yaml.safe_load(file.read())


class DbManager:
    def __init__(self):
        with open("data/data.json", "r") as file:
            self.data = json.loads(file.read())
    
    def get_alarm(self, pid):
        if pid in self.data["alarms"]:
            return self.data["alarms"][pid]
        return None
    
    def get_providers(self):
        return self.data["providers"]
    
    def create_account(self, username, email, password):
        if username in self.data["accounts"]:
            return False, "existing_account"
        
        salt = os.urandom(32).hex()
        hashed = sha256((salt+password).encode("UTF-8")).hexdigest()
        uuuid = str(uuid.uuid4())

        self.data["accounts"][uuuid] = {
            "email" : email,
            "username": username,
            "password": hashed,
            "salt": salt,
            "email-validated": False
        }

        self.save()

        self.verify_email(uuuid)

        return True, "ok"

    
    def save(self):
        data = json.dumps(self.data)
        with open("data/data.json", "w") as file:
            file.write(data)
    
    def verify_email(self, uuid):
        port = 465  # For SSL

        sender_email = EMAIL
        receiver_email = self.data["accounts"][uuid]["email"]
        # Create a secure SSL context
        context = ssl.create_default_context()

        message = MIMEMultipart("alternative")
        message["Subject"] = presets["email_validation"]["subject"]
        message["From"] = sender_email
        message["To"] = receiver_email

        # Create the plain-text and HTML version of your message
        text = presets["email_validation"]["text"].format(validation_link="link", username=self.data["accounts"][uuid]["username"])

        html = presets["email_validation"]["html"].format(validation_link="link", username=self.data["accounts"][uuid]["username"])

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        message.attach(part1)
        message.attach(part2)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, port, context=context) as server:
            server.login(sender_email, EMAIL_PASSWORD)
            print(server.sendmail(sender_email, receiver_email, message.as_string()))
