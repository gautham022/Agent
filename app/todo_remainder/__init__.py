from flask import Blueprint, request, jsonify

from app.todo_remainder.reminder import (
    is_reminder_command,
    parse_reminder
)


todo_remainder_bp = Blueprint(
    "todo_remainder",
    __name__
)


@todo_remainder_bp.route(
    "/parse",
    methods=["POST"]
)
def parse():
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

        if not is_reminder_command(command):
            return jsonify({
                "success": False,
                "message": "Please give a reminder or to-do command."
            }), 400

        result = parse_reminder(command)

        return jsonify({
            "success": True,
            "type": "todo_remainder",
            "task": result["task"],
            "datetime": result["datetime"],
            "relative": result["relative"]
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
