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

EMAIL_PROMPT = """
You are a professional Gmail email writing assistant.

Convert the user's voice command into a professional email.

Rules:
- Do not copy the command literally.
- Do not explain anything.
- Do not invent names, dates, prices, companies, attachments, or facts.
- Keep the email natural and concise.
- Include an appropriate greeting and closing.

Output exactly:

SUBJECT: <subject>
BODY:
<email body>

User command:
{command}
"""


def _call_groq(prompt, temperature=0.7, max_tokens=800):
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
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
            return data["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 3:
                try:
                    detail = e.read().decode()
                except Exception:
                    detail = str(e)
                raise RuntimeError(f"Groq API error: {detail}")
            time.sleep((2 ** attempt) + random.random())
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1)


def _call_gemini(prompt, temperature=0.7, max_tokens=800):
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
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 3:
                try:
                    detail = e.read().decode()
                except Exception:
                    detail = str(e)
                raise RuntimeError(f"Gemini API error: {detail}")
            time.sleep((2 ** attempt) + random.random())
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1)


def generate_email_with_gemini(command):
    prompt = EMAIL_PROMPT.format(command=command)

    if GROQ_API_KEY:
        text = _call_groq(prompt, temperature=0.7, max_tokens=800)
    elif GEMINI_API_KEY:
        text = _call_gemini(prompt, temperature=0.7, max_tokens=800)
    else:
        raise RuntimeError("Set GROQ_API_KEY or GEMINI_API_KEY.")

    text = re.sub(r"```(?:text)?|```", "", text).strip()

    subject = re.search(r"SUBJECT:\s*(.+)", text, re.I)
    body = re.search(r"BODY:\s*([\s\S]+)", text, re.I)

    if not subject or not body:
        raise RuntimeError("LLM returned an invalid email format.")

    return {
        "subject": subject.group(1).strip(),
        "body": body.group(1).strip()
    }