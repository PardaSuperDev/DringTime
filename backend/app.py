from flask import Flask

app = Flask(__name__)

@app.route("/")
def index():
    return "<p>Dring Time Website API. Hello! </p><a href='https://dring-time.fr'>Go to the website.</a>"
