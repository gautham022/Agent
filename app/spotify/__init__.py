from flask import Blueprint, request, jsonify

from app.spotify.player import (
    search_spotify,
    is_spotify_command,
    extract_spotify_query
)


spotify_bp = Blueprint(
    "spotify",
    __name__
)


@spotify_bp.route(
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

    if not is_spotify_command(command):

        return jsonify({
            "success": False,
            "message": "Please give a music command."
        }), 400

    query = extract_spotify_query(
        command
    )

    result = search_spotify(
        query
    )

    if not result:

        return jsonify({
            "success": False,
            "message": "Could not find the song"
        }), 404

    return jsonify({
        "success": True,
        "type": "spotify",
        "query": query,
        "track": result["track"],
        "artist": result["artist"],
        "embed_url": result["embed_url"],
        "preview_url": result.get("preview_url"),
        "spotify_url": result.get("spotify_url")
    })
