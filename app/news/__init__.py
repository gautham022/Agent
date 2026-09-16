from flask import Blueprint, request, jsonify

from app.news.news import (
    is_news_command,
    search_news
)


news_bp = Blueprint(
    "news",
    __name__
)


@news_bp.route(
    "/search",
    methods=["POST"]
)
def search():
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

        if not is_news_command(command):
            return jsonify({
                "success": False,
                "message": "Please give a news or research command."
            }), 400

        result = search_news(command)

        return jsonify({
            "success": True,
            "type": "news",
            "articles": result["articles"],
            "wikipedia": result.get("wikipedia", []),
            "query": result.get("query", command)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
