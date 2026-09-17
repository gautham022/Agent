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

LINKEDIN_KEYWORDS = [
    "linkedin", "professional post",
    "job post", "network"
]

POST_PROMPT = """
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


def is_linkedin_command(command):
    lower = command.lower()
    return any(kw in lower for kw in LINKEDIN_KEYWORDS)


def _call_groq(prompt, temperature=0.8, max_tokens=600):
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


def _call_gemini(prompt, temperature=0.8, max_tokens=600):
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


def generate_post_with_gemini(command):
    prompt = POST_PROMPT.format(command=command)

    if GROQ_API_KEY:
        text = _call_groq(prompt, temperature=0.8, max_tokens=600)
    elif GEMINI_API_KEY:
        text = _call_gemini(prompt, temperature=0.8, max_tokens=600)
    else:
        raise RuntimeError("Set GROQ_API_KEY or GEMINI_API_KEY.")

    text = re.sub(r"```(?:text)?|```", "", text).strip()

    if not text:
        raise RuntimeError("LLM returned an empty post.")

    return {"post": text}


def build_linkedin_share_url(post_text):
    # LinkedIn has no URL-prefill for feed posts, so the post is
    # copied to the clipboard in the UI and this opens the composer.
    return "https://www.linkedin.com/feed/?shareActive=true"
