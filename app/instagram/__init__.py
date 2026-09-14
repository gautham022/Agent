from flask import Blueprint, request, jsonify

from app.instagram.caption import (
    is_instagram_command,
    generate_caption_with_gemini,
    build_instagram_url
)


instagram_bp = Blueprint(
    "instagram",
    __name__
)


@instagram_bp.route(
    "/caption",
    methods=["POST"]
)
def caption():

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

        if not is_instagram_command(command):

            return jsonify({
                "success": False,
                "message": "Please give an Instagram command."
            }), 400

        result = generate_caption_with_gemini(
            command
        )

        return jsonify({
            "success": True,
            "type": "instagram",
            "captions": result["captions"],
            "hashtags": result["hashtags"],
            "instagram_url": build_instagram_url()
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
