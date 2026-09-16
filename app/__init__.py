import os

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

from app.gmail import (
    is_email_command,
    extract_email,
    create_gmail_url,
    generate_email_with_gemini
)

from app.youtube import youtube_bp

from app.spotify import spotify_bp

from app.instagram import instagram_bp

from app.linkedin import linkedin_bp

from app.todo_remainder import todo_remainder_bp

from app.news import news_bp

from app.map import map_bp


def create_app():

    app = Flask(__name__)

    CORS(app)


    # YouTube
    app.register_blueprint(
        youtube_bp,
        url_prefix="/youtube"
    )


    # Spotify
    app.register_blueprint(
        spotify_bp,
        url_prefix="/spotify"
    )


    # Instagram
    app.register_blueprint(
        instagram_bp,
        url_prefix="/instagram"
    )


    # LinkedIn
    app.register_blueprint(
        linkedin_bp,
        url_prefix="/linkedin"
    )


    # Todo Remainder (Reminders)
    app.register_blueprint(
        todo_remainder_bp,
        url_prefix="/todo-remainder"
    )


    # News
    app.register_blueprint(
        news_bp,
        url_prefix="/news"
    )


    # Map (Maps/Travel)
    app.register_blueprint(
        map_bp,
        url_prefix="/map"
    )


    # Home
    @app.route("/")
    def home():

        return render_template("index.html")


    # HTML
    @app.route("/html")
    def html():

        return render_template("index.html")


    # Health
    @app.route("/health")
    def health():

        return jsonify({
            "status": "ok",
            "service": "Nova AI Agent"
        })


    # Gmail AI Agent
    @app.route("/agent", methods=["POST"])
    def agent():

        try:

            data = request.get_json(
                silent=True
            ) or {}

            command = data.get(
                "command",
                ""
            ).strip()


            if not command:

                return jsonify({
                    "success": False,
                    "message": "Command is required"
                }), 400


            if not is_email_command(command):

                return jsonify({
                    "success": False,
                    "message": "Please give a Gmail command."
                }), 400


            recipient = extract_email(
                command
            )


            email = generate_email_with_gemini(
                command
            )


            return jsonify({

                "success": True,

                "type": "email",

                "email_generated": True,

                "recipient": recipient,

                "subject": email["subject"],

                "body": email["body"],

                "gmail_url": create_gmail_url(
                    email["subject"],
                    email["body"],
                    recipient
                )
            })


        except Exception as e:

            return jsonify({
                "success": False,
                "message": str(e)
            }), 500


    return app
