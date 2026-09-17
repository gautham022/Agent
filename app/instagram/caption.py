import os
import json
import re
import time
import random
import urllib.request
import urllib.error

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

INSTAGRAM_KEYWORDS = [
    "instagram", "insta", "caption",
    "hashtags", "hashtag", "reel"
]

CAPTION_PROMPT = """
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


def is_instagram_command(command):
    lower = command.lower()
    return any(kw in lower for kw in INSTAGRAM_KEYWORDS)


def _call_groq(prompt, temperature=0.9, max_tokens=500):
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens
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


def _call_gemini(prompt, temperature=0.9, max_tokens=500):
    url = (
        f"https://generativelanguage.googleapis.com/"
        f"v1beta/models/{GEMINI_MODEL}:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens
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


def generate_caption_with_gemini(command):
    prompt = CAPTION_PROMPT.format(command=command)

    if GROQ_API_KEY:
        text = _call_groq(prompt, temperature=0.9, max_tokens=500)
    elif GEMINI_API_KEY:
        text = _call_gemini(prompt, temperature=0.9, max_tokens=500)
    else:
        raise RuntimeError("Set GROQ_API_KEY or GEMINI_API_KEY.")

    text = re.sub(r"```(?:text)?|```", "", text).strip()

    hashtags = re.search(r"HASHTAGS:\s*(.+)", text, re.I)
    captions = re.split(r"HASHTAGS:.*", text, flags=re.I)[0].strip()

    if not captions:
        raise RuntimeError("LLM returned an invalid caption format.")

    return {
        "captions": captions,
        "hashtags": hashtags.group(1).strip() if hashtags else ""
    }


def build_instagram_url():
    return "https://www.instagram.com/"
