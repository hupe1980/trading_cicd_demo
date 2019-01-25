"The Flask application"
from flask import Flask, render_template

application = Flask(__name__)

@application.route("/")
def home():
    "The home route"
    return render_template('main.html')

if __name__ == "__main__": # pragma: no cover
    application.run(debug=True, host='0.0.0.0', port=8080)
