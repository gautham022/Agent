import os
import json
import re
import time
import random
import urllib.request
import urllib.error

API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

LINKEDIN_KEYWORDS = [
    "linkedin", "professional post",
    "job post", "network"
]


def is_linkedin_command(command):
    lower = command.lower()
    return any(kw in lower for kw in LINKEDIN_KEYWORDS)


def generate_post_with_gemini(command):
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY is missing.")

    prompt = f"""
You are a professional LinkedIn content writer.

Convert the user's voice command into a ready-to-post LinkedIn post.

Rules:
- Write one polished post (80-150 words).
- Professional but human tone, first person.
- No explanations, no subject lines, no markdown headers.
- Use at most 3 emojis, only if it fits the topic.
- End with 3-5 relevant hashtags on the last line.

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
            "temperature": 0.8,
            "maxOutputTokens": 600
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

            if not text:
                raise RuntimeError("Gemini returned an empty post.")

            return {"post": text}

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


def build_linkedin_share_url(post_text):
    # LinkedIn has no URL-prefill for feed posts, so the post is
    # copied to the clipboard in the UI and this opens the composer.
    return "https://www.linkedin.com/feed/?shareActive=true"
