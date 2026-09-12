import os
import re

import requests


SPOTIFY_KEYWORDS = [
    "play", "music", "song", "songs", "artist",
    "album", "genre", "playlist", "listen",
    "spotify", "track", "tracks", "band",
    "singer", "sing", "lyrics", "tune",
    "beat", "remix", "cover", "acoustic",
    "live", "unplugged", "mix", "dj"
]


def is_spotify_command(
    command: str
) -> bool:

    lower = command.lower()

    return any(
        kw in lower
        for kw in SPOTIFY_KEYWORDS
    )


def extract_spotify_query(
    command: str
) -> str:

    lower = command.lower()

    phrases_to_remove = [
        "play", "music", "song", "songs",
        "artist", "album", "genre", "playlist",
        "listen to", "listen", "spotify",
        "track", "tracks", "band", "singer",
        "sing", "lyrics", "tune", "beat",
        "remix", "cover", "acoustic", "live",
        "unplugged", "mix", "dj",
        "on spotify", "for me", "please",
        "can you", "could you", "i want to hear",
        "i want to listen to",
        "put on", "start playing"
    ]

    query = lower

    for phrase in phrases_to_remove:
        query = query.replace(phrase, "")

    query = re.sub(
        r'\s+', ' ',
        query
    ).strip()

    return query if query else command.strip()


def search_spotify(
    query: str
) -> dict | None:

    try:

        client_id = os.environ.get(
            "SPOTIFY_CLIENT_ID",
            ""
        )
        client_secret = os.environ.get(
            "SPOTIFY_CLIENT_SECRET",
            ""
        )

        if client_id and client_secret:

            return _search_with_api(
                query,
                client_id,
                client_secret
            )

        return _search_with_embed(
            query
        )

    except Exception:
        return None


def _search_with_api(
    query: str,
    client_id: str,
    client_secret: str
) -> dict | None:

    try:

        token_resp = requests.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret
            },
            timeout=10
        )

        if token_resp.status_code != 200:
            return None

        token = token_resp.json().get(
            "access_token"
        )

        if not token:
            return None

        search_resp = requests.get(
            "https://api.spotify.com/v1/search",
            headers={
                "Authorization": f"Bearer {token}"
            },
            params={
                "q": query,
                "type": "track",
                "limit": 1
            },
            timeout=10
        )

        if search_resp.status_code != 200:
            return None

        tracks = search_resp.json().get(
            "tracks", {}
        ).get("items", [])

        if not tracks:
            return None

        track = tracks[0]
        track_id = track.get("id", "")

        return {
            "track": track.get("name", ""),
            "artist": ", ".join(
                a.get("name", "")
                for a in track.get(
                    "artists", []
                )
            ),
            "embed_url": (
                f"https://open.spotify.com/embed"
                f"/track/{track_id}"
                f"?utm_source=generator"
                f"&theme=0"
            ),
            "preview_url": track.get(
                "preview_url"
            ),
            "spotify_url": track.get(
                "external_urls", {}
            ).get("spotify")
        }

    except Exception:
        return None


def _search_with_embed(
    query: str
) -> dict | None:

    try:

        search_url = (
            f"https://open.spotify.com/search"
            f"/{requests.utils.quote(query)}"
        )

        return {
            "track": query.title(),
            "artist": "Unknown Artist",
            "embed_url": (
                f"https://open.spotify.com/embed"
                f"/search/{requests.utils.quote(query)}"
                f"?utm_source=generator"
                f"&theme=0"
            ),
            "preview_url": None,
            "spotify_url": search_url
        }

    except Exception:
        return None
