import json
import os
from flask import Flask

app = Flask(__name__)

with open("data/data.json", "r") as file:
    data = json.loads(file.read())
    

@app.route("/")
def index():
    return "<p>Dring Time Website API. Hello! </p><a href='https://dring-time.fr'>Go to the website.</a>"


@app.route("/alarms/<pid>")
def alarm(pid: str):
    if pid in data["alarms"]:
        return data["alarms"][pid]
    
    return {"error": "Not found"}

@app.route("/provider_list")
def provider_list():
    return data["providers"]

if __name__ == "__main__":
    port = 5000
    app.run(debug=True, host='0.0.0.0', port=port)