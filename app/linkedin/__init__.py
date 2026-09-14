from flask import Blueprint, request, jsonify

from app.linkedin.post import (
    is_linkedin_command,
    generate_post_with_gemini,
    build_linkedin_share_url
)


linkedin_bp = Blueprint(
    "linkedin",
    __name__
)


@linkedin_bp.route(
    "/post",
    methods=["POST"]
)
def post():

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

        if not is_linkedin_command(command):

            return jsonify({
                "success": False,
                "message": "Please give a LinkedIn command."
            }), 400

        result = generate_post_with_gemini(
            command
        )

        return jsonify({
            "success": True,
            "type": "linkedin",
            "post": result["post"],
            "linkedin_url": build_linkedin_share_url(
                result["post"]
            )
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
