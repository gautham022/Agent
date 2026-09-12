# NIKA - AI Voice Agent Hub

NIKA is a Flask-based AI agent platform that powers three intelligent agents — **Lost Tune**, **Speed Draft**, and **Brook** — each handling a specific task through simple voice-style commands.

---

## Agents

### 🎵 Lost Tune — YouTube Music Agent

Searches YouTube for any song or video and returns an auto-playing embed link.

| Detail | Value |
|---|---|
| Endpoint | `POST /youtube/play` |
| Trigger words | `play`, `song`, `music`, `youtube` |
| Example command | `play Blinding Lights by The Weeknd` |
| Response | YouTube embed URL with autoplay |

---

### ⚡ Speed Draft — Gmail AI Agent

Uses Google Gemini to convert a voice command into a professional email draft and opens Gmail's compose window pre-filled.

| Detail | Value |
|---|---|
| Endpoint | `POST /agent` |
| Trigger words | `gmail`, `email`, `mail`, `write an email`, `draft` |
| Example command | `write an email to john@example.com about the project deadline` |
| Response | Subject, body, and Gmail compose URL |
| Requires | `GEMINI_API_KEY` environment variable |

---

### 🎧 Brook — Spotify Music Agent

Searches the Spotify catalog for tracks and returns an embeddable player card.

| Detail | Value |
|---|---|
| Endpoint | `POST /spotify/play` |
| Trigger words | `play`, `song`, `music`, `spotify`, `track`, `album`, `artist` |
| Example command | `play Bohemian Rhapsody by Queen` |
| Response | Track name, artist, Spotify embed URL, preview URL |
| Optional | `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` for full API search (falls back to embed search) |

---

## Project Structure

```
app/
├── __init__.py              # Flask app factory, blueprint registration
├── wsgi.py                  # WSGI entry point
├── requirements.txt         # Python dependencies
├── templates/
│   └── index.html           # Frontend UI
├── gmail/
│   ├── __init__.py          # Public API exports
│   ├── gmail_gen.py         # Gemini AI email generation
│   └── gmail_write.py       # Email URL builder & keyword detection
├── youtube/
│   ├── __init__.py          # YouTube blueprint
│   └── player.py            # YouTube search & embed URL builder
└── spotify/
    ├── __init__.py          # Spotify blueprint
    └── player.py            # Spotify API search & embed builder
```

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
# Required for Speed Draft (Gmail AI Agent)
export GEMINI_API_KEY="your-gemini-api-key"

# Optional — enables direct Spotify API search for Brook
export SPOTIFY_CLIENT_ID="your-spotify-client-id"
export SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
```

### 3. Run locally

```bash
python wsgi.py
```

The app starts at `http://localhost:5000`.

### 4. Run with Gunicorn (production)

```bash
gunicorn wsgi:app --bind 0.0.0.0:5000 --workers 4
```

---

## API Reference

### Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "service": "Nova AI Agent"
}
```

### Lost Tune — Play on YouTube

```
POST /youtube/play
Content-Type: application/json

{ "command": "play Shape of You" }
```

```json
{
  "success": true,
  "type": "youtube",
  "query": "play Shape of You",
  "url": "https://www.youtube.com/embed/...?autoplay=1&mute=0"
}
```

### Speed Draft — Draft Email

```
POST /agent
Content-Type: application/json

{ "command": "email john@acme.com about rescheduling the meeting to Friday" }
```

```json
{
  "success": true,
  "type": "email",
  "email_generated": true,
  "recipient": "john@acme.com",
  "subject": "Meeting Reschedule to Friday",
  "body": "Hi John, ...",
  "gmail_url": "https://mail.google.com/mail/u/0/?..."
}
```

### Brook — Play on Spotify

```
POST /spotify/play
Content-Type: application/json

{ "command": "play Hey Jude by The Beatles" }
```

```json
{
  "success": true,
  "type": "spotify",
  "query": "hey jude by the beatles",
  "track": "Hey Jude",
  "artist": "The Beatles",
  "embed_url": "https://open.spotify.com/embed/track/...",
  "preview_url": "https://p.scdn.co/mp3-preview/...",
  "spotify_url": "https://open.spotify.com/track/..."
}
```

---

## License

Private — for internal use only.
