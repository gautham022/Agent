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
        "put on", "start playing",
        " on ", " some ", " the ",
        "brook", "hey brook"
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

            result = _search_with_api(
                query,
                client_id,
                client_secret
            )

            if result:
                return result

        return _search_with_itunes(
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


def _search_with_itunes(
    query: str
) -> dict | None:

    # No Spotify API keys set. Spotify's /embed/search URLs
    # return 404, so use the iTunes Search API (no key needed)
    # to resolve a real track + 30s preview, and link to the
    # Spotify search page for full playback.

    try:

        resp = requests.get(
            "https://itunes.apple.com/search",
            params={
                "term": query,
                "entity": "song",
                "limit": 1
            },
            headers={
                "User-Agent": "Mozilla/5.0"
            },
            timeout=10
        )

        if resp.status_code != 200:
            return None

        results = resp.json().get(
            "results", []
        )

        if not results:
            return None

        item = results[0]

        return {
            "track": item.get(
                "trackName", query
            ),
            "artist": item.get(
                "artistName",
                "Unknown Artist"
            ),
            "embed_url": None,
            "preview_url": item.get(
                "previewUrl"
            ),
            "spotify_url": (
                f"https://open.spotify.com/search"
                f"/{requests.utils.quote(query)}"
            )
        }

    except Exception:
        return None
