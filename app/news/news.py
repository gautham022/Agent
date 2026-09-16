import os
import json
import urllib.request
import urllib.error
import urllib.parse

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY", "")

NEWS_KEYWORDS = [
    "news", "trending", "research", "headlines",
    "what's happening", "latest", "today",
    "breaking", "current events", "top stories",
    "tech news", "science", "world news"
]


def is_news_command(command):
    lower = command.lower()
    return any(kw in lower for kw in NEWS_KEYWORDS)


def _fetch_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "NIKA-Robin/1.0"
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def _search_gnews(query, max_results=5):
    if not GNEWS_API_KEY:
        return []

    try:
        encoded = urllib.parse.quote(query)
        url = (
            f"https://gnews.io/api/v4/search"
            f"?q={encoded}"
            f"&lang=en"
            f"&max={max_results}"
            f"&apikey={GNEWS_API_KEY}"
        )
        data = _fetch_json(url)
        articles = []
        for a in data.get("articles", [])[:max_results]:
            articles.append({
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "url": a.get("url", ""),
                "source": a.get("source", {}).get("name", ""),
                "published": a.get("publishedAt", ""),
                "provider": "GNews"
            })
        return articles
    except Exception:
        return []


def _search_wikipedia(query, max_results=5):
    try:
        encoded = urllib.parse.quote(query)
        url = (
            f"https://en.wikipedia.org/w/api.php"
            f"?action=query"
            f"&list=search"
            f"&srsearch={encoded}"
            f"&format=json"
            f"&srlimit={max_results}"
        )
        data = _fetch_json(url)
        results = []
        for r in data.get("query", {}).get("search", [])[:max_results]:
            # Strip HTML tags from snippet
            snippet = re.sub(r'<[^>]+>', '', r.get("snippet", ""))
            results.append({
                "title": r.get("title", ""),
                "description": snippet,
                "url": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(r.get('title', '').replace(' ', '_'))}",
                "source": "Wikipedia",
                "published": r.get("timestamp", ""),
                "provider": "Wikipedia"
            })
        return results
    except Exception:
        return []


import re


def _get_news_topic(query):
    lower = query.lower()
    if any(w in lower for w in ["tech", "ai", "software", "computer", "digital"]):
        return "technology"
    if any(w in lower for w in ["sport", "cricket", "football", "tennis"]):
        return "sports"
    if any(w in lower for w in ["business", "market", "stock", "economy"]):
        return "business"
    if any(w in lower for w in ["science", "space", "research"]):
        return "science"
    if any(w in lower for w in ["health", "medical", "covid"]):
        return "health"
    return "general"


def _trending_gnews(max_results=5):
    if not GNEWS_API_KEY:
        return []
    try:
        topic = "technology"
        url = (
            f"https://gnews.io/api/v4/top-headlines"
            f"?topic={topic}"
            f"&lang=en"
            f"&max={max_results}"
            f"&apikey={GNEWS_API_KEY}"
        )
        data = _fetch_json(url)
        articles = []
        for a in data.get("articles", [])[:max_results]:
            articles.append({
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "url": a.get("url", ""),
                "source": a.get("source", {}).get("name", ""),
                "published": a.get("publishedAt", ""),
                "provider": "GNews"
            })
        return articles
    except Exception:
        return []


def search_news(command):
    lower = command.lower()

    # Determine if this is a trending/top headlines request
    is_trending = any(kw in lower for kw in [
        "trending", "top", "headlines",
        "what's happening", "latest", "today",
        "breaking", "current events"
    ])

    # Extract search query (remove news-related filler words)
    query = command
    for word in ["news", "trending", "headlines", "about", "today",
                  "latest", "what's", "happening", "top", "give me",
                  "show me", "search for", "find"]:
        query = query.replace(word, "")
    query = re.sub(r'\s+', ' ', query).strip()
    if not query:
        query = "technology"

    # Fetch results
    if is_trending:
        articles = _trending_gnews(5)
    else:
        articles = _search_gnews(query, 5)

    # Always try Wikipedia for depth
    wiki_results = _search_wikipedia(query, 3)

    return {
        "articles": articles,
        "wikipedia": wiki_results,
        "query": query
    }
