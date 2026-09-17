import re
import urllib.parse
import urllib.request


BROOK_KEYWORDS = [
    "play", "music", "song", "songs", "artist",
    "album", "genre", "playlist", "listen",
    "brook", "track", "tracks", "band",
    "singer", "sing", "lyrics", "tune",
    "beat", "remix", "cover", "acoustic",
    "live", "unplugged", "mix", "dj"
]


def is_brook_command(command: str) -> bool:
    lower = command.lower()
    return any(kw in lower for kw in BROOK_KEYWORDS)


def extract_brook_query(command: str) -> str:
    lower = command.lower()

    phrases_to_remove = [
        "play", "music", "song", "songs",
        "artist", "album", "genre", "playlist",
        "listen to", "listen", "youtube music", "yt music",
        "track", "tracks", "band", "singer",
        "sing", "lyrics", "tune", "beat",
        "remix", "cover", "acoustic", "live",
        "unplugged", "mix", "dj",
        "on youtube music", "on yt music", "for me", "please",
        "can you", "could you", "i want to hear",
        "i want to listen to",
        "put on", "start playing",
        " on ", " some ", " the ",
        "brook", "hey brook"
    ]

    query = lower

    for phrase in phrases_to_remove:
        query = query.replace(phrase, "")

    query = re.sub(r'\s+', ' ', query).strip()

    return query if query else command.strip()


def get_vid(query: str) -> str | None:
    try:
        encoded = urllib.parse.quote(query + " music")

        url = "https://www.youtube.com/results?search_query=" + encoded

        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0"}
        )

        data = urllib.request.urlopen(
            request,
            timeout=5
        ).read().decode("utf-8", errors="ignore")

        ids = re.findall(r'"videoId":"([^"]+)"', data)

        return ids[0] if ids else None

    except Exception:
        return None


def search_youtube_music(query: str) -> dict | None:
    video_id = get_vid(query)

    encoded_query = urllib.parse.quote(query)

    if not video_id:
        return {
            "track": query,
            "artist": "YouTube Music",
            "embed_url": None,
            "ytmusic_url": f"https://music.youtube.com/search?q={encoded_query}"
        }

    return {
        "track": query,
        "artist": "YouTube Music",
        "embed_url": f"https://www.youtube.com/embed/{video_id}?autoplay=1&mute=0",
        "ytmusic_url": f"https://music.youtube.com/watch?v={video_id}"
    }
