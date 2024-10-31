import json
from hashlib import sha256
import uuid
import os


SALT_SIZE = 32


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

        self.data["accounts"][username] = {
            "email" : email,
            "username": username,
            "password": hashed,
            "id" : uuuid,
            "salt": salt,
            "email-validated": False
        }

        self.save()
        return True, "ok"

    
    def save(self):
        data = json.dumps(self.data)
        with open("data/data.json", "w") as file:
            file.write(data)


"""
import smtplib
# creates SMTP session
s = smtplib.SMTP('mx1.mail.ovh.net', 587)
# start TLS for security
s.starttls()
# Authentication
s.login("sender_email_id", "sender_email_id_password")
# message to be sent
message = "Message_you_need_to_send"
# sending the mail
s.sendmail("sender_email_id", "receiver_email_id", message)
# terminating the session
s.quit()"""