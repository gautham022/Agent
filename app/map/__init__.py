from flask import Blueprint, request, jsonify

from app.map.maps import (
    is_travel_command,
    handle_travel_command
)


map_bp = Blueprint(
    "map",
    __name__
)


@map_bp.route(
    "/route",
    methods=["POST"]
)
def route():
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

        if not is_travel_command(command):
            return jsonify({
                "success": False,
                "message": "Please give a travel or maps command."
            }), 400

        result = handle_travel_command(command)

        return jsonify({
            "success": True,
            "type": "map",
            **result
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
