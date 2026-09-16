import os
import json
import re
import time
import random
import urllib.request
import urllib.error
from datetime import datetime, timedelta

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

REMINDER_KEYWORDS = [
    "remind", "reminder", "todo", "to-do",
    "to do", "task", "schedule",
    "don't forget", "dont forget", "remember"
]


def is_reminder_command(command):
    lower = command.lower()
    return any(kw in lower for kw in REMINDER_KEYWORDS)


def _call_groq(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 300
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}"
        },
        method="POST"
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
            return data["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 2:
                try:
                    detail = e.read().decode()
                except Exception:
                    detail = str(e)
                raise RuntimeError(f"Groq API error: {detail}")
            time.sleep((2 ** attempt) + random.random())
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1)


def _call_gemini(prompt):
    url = (
        f"https://generativelanguage.googleapis.com/"
        f"v1beta/models/{GEMINI_MODEL}:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 300
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        },
        method="POST"
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 2:
                try:
                    detail = e.read().decode()
                except Exception:
                    detail = str(e)
                raise RuntimeError(f"Gemini API error: {detail}")
            time.sleep((2 ** attempt) + random.random())
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1)


def parse_reminder(command):
    now = datetime.now()
    prompt = f"""You are a time parsing assistant. Extract the task and datetime from this reminder command.

Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} ({now.strftime('%A')})

Return ONLY a JSON object with these fields:
- "task": the reminder task text (remove "remind me to", "don't forget to", etc.)
- "datetime": ISO 8601 datetime string (YYYY-MM-DDTHH:MM:SS)
- "relative": human-readable relative time (e.g. "in 2 hours", "tomorrow at 5pm")

If no specific time is given, default to 1 hour from now.
If only a time is given (e.g. "5pm"), use today's date if the time hasn't passed, otherwise tomorrow.

User command: {command}

Return ONLY valid JSON, no other text."""

    if GROQ_API_KEY:
        text = _call_groq(prompt)
    elif GEMINI_API_KEY:
        text = _call_gemini(prompt)
    else:
        raise RuntimeError("Set GROQ_API_KEY or GEMINI_API_KEY.")

    # Extract JSON from response
    json_match = re.search(r'\{[^}]+\}', text, re.DOTALL)
    if not json_match:
        raise RuntimeError("Could not parse reminder time.")

    result = json.loads(json_match.group())

    # Validate datetime is in the future
    try:
        dt = datetime.fromisoformat(result["datetime"])
        if dt <= now:
            dt = now + timedelta(hours=1)
            result["datetime"] = dt.isoformat()
            result["relative"] = "in 1 hour"
    except (KeyError, ValueError):
        dt = now + timedelta(hours=1)
        result["datetime"] = dt.isoformat()
        result["relative"] = "in 1 hour"

    return result
