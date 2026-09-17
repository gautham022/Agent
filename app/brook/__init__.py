from flask import Blueprint, request, jsonify

from app.brook.player import (
    search_youtube_music,
    extract_brook_query
)


brook_bp = Blueprint(
    "brook",
    __name__
)


@brook_bp.route(
    "/play",
    methods=["POST"]
)
def play():

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
            "message": "Song name is required"
        }), 400

    query = extract_brook_query(command)

    result = search_youtube_music(query)

    if not result:
        return jsonify({
            "success": False,
            "message": "Could not find the song"
        }), 404

    return jsonify({
        "success": True,
        "type": "brook",
        "query": query,
        "track": result["track"],
        "artist": result["artist"],
        "embed_url": result.get("embed_url"),
        "ytmusic_url": result.get("ytmusic_url")
    })
