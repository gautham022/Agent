import os
import json
import re
import time
import random
import urllib.request
import urllib.error

API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

INSTAGRAM_KEYWORDS = [
    "instagram", "insta", "caption",
    "hashtags", "hashtag", "reel"
]


def is_instagram_command(command):
    lower = command.lower()
    return any(kw in lower for kw in INSTAGRAM_KEYWORDS)


def generate_caption_with_gemini(command):
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY is missing.")

    prompt = f"""
You are a professional Instagram content writer.

Convert the user's voice command into a ready-to-post Instagram caption.

Rules:
- Write 1-3 short caption options, separated by blank lines.
- Match the vibe the user asks for (funny, aesthetic, motivational, etc).
- No explanations, no numbering, no quotes around captions.
- End with a line starting with HASHTAGS: followed by
  8-12 relevant hashtags separated by spaces.

User command:
{command}
"""

    url = (
        f"https://generativelanguage.googleapis.com/"
        f"v1beta/models/{MODEL}:generateContent"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.9,
            "maxOutputTokens": 500
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY
        },
        method="POST"
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())

            text = data["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r"```(?:text)?|```", "", text).strip()

            hashtags = re.search(r"HASHTAGS:\s*(.+)", text, re.I)
            captions = re.split(r"HASHTAGS:.*", text, flags=re.I)[0].strip()

            if not captions:
                raise RuntimeError("Gemini returned an invalid caption format.")

            return {
                "captions": captions,
                "hashtags": hashtags.group(1).strip() if hashtags else ""
            }

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


def build_instagram_url():
    return "https://www.instagram.com/"
