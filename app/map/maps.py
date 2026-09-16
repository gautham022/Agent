import os
import json
import re
import urllib.request
import urllib.error
import urllib.parse

OPENCHARGEMAP_KEY = os.getenv("OPENCHARGEMAP_KEY", "")

TRAVEL_KEYWORDS = [
    "route", "directions", "navigate", "travel",
    "go to", "reach", "how to get", "distance",
    "charge", "charging", "ev charging", "ev station",
    "ev bike", "electric vehicle",
    "book", "ticket", "bus", "train", "flight",
    "car", "drive", "driving", "walk", "walking"
]

BOOKING_KEYWORDS = ["book", "ticket", "reserve"]
BUS_KEYWORDS = ["bus", "redbus"]
TRAIN_KEYWORDS = ["train", "irctc"]
FLIGHT_KEYWORDS = ["flight", "airplane", "plane", "fly"]


def is_travel_command(command):
    lower = command.lower()
    return any(kw in lower for kw in TRAVEL_KEYWORDS)


def _fetch_json(url, headers=None):
    hdrs = {"User-Agent": "NIKA-Nami/1.0"}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, headers=hdrs)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def _geocode(place):
    """Geocode a place name to lat/lon using Nominatim."""
    encoded = urllib.parse.quote(place)
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={encoded}&format=json&limit=1"
    )
    data = _fetch_json(url)
    if data:
        return {
            "lat": float(data[0]["lat"]),
            "lon": float(data[0]["lon"]),
            "display_name": data[0].get("display_name", place)
        }
    return None


def _get_route(origin_coords, dest_coords):
    """Get driving route via OSRM."""
    coords = f"{origin_coords['lon']},{origin_coords['lat']};{dest_coords['lon']},{dest_coords['lat']}"
    url = (
        f"https://router.project-osrm.org/route/v1/driving/{coords}"
        f"?steps=true&geometries=geojson&overview=simplified"
    )
    data = _fetch_json(url)

    if data.get("code") != "Ok" or not data.get("routes"):
        return None

    route = data["routes"][0]
    distance_km = route["distance"] / 1000
    duration_min = route["duration"] / 60

    # Extract turn-by-turn steps
    steps = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            maneuver = step.get("maneuver", {})
            modifier = maneuver.get("modifier", "")
            mtype = maneuver.get("type", "")

            instruction = ""
            if mtype == "depart":
                instruction = f"Start on {step.get('name', 'road')}"
            elif mtype == "arrive":
                instruction = "Arrive at destination"
            elif mtype == "rotary":
                instruction = f"At roundabout, take exit on {step.get('name', 'road')}"
            else:
                direction = modifier.replace("-", " ").title() if modifier else "Continue"
                road = step.get("name", "")
                if road:
                    instruction = f"{direction} onto {road}"
                else:
                    instruction = f"{direction}"

            step_dist = step.get("distance", 0)
            if step_dist > 0:
                instruction += f" ({step_dist:.0f}m)"

            steps.append(instruction)

    map_url = (
        f"https://www.openstreetmap.org/directions"
        f"?engine=osrm_car"
        f"&route={origin_coords['lat']},{origin_coords['lon']}"
        f";{dest_coords['lat']},{dest_coords['lon']}"
    )

    return {
        "distance": f"{distance_km:.1f} km",
        "duration": f"{duration_min:.0f} minutes",
        "steps": steps,
        "map_url": map_url,
        "origin": origin_coords.get("display_name", ""),
        "destination": dest_coords.get("display_name", "")
    }


def _find_ev_charging(lat, lon):
    """Find nearby EV charging stations via OpenChargeMap."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "distance": 10,
        "distanceunit": "KM",
        "maxresults": 10,
        "compact": "true",
        "verbose": "false"
    }
    if OPENCHARGEMAP_KEY:
        params["key"] = OPENCHARGEMAP_KEY

    query = urllib.parse.urlencode(params)
    url = f"https://api.openchargemap.io/v3/poi/?{query}"

    try:
        data = _fetch_json(url)
    except Exception:
        # Return mock data if API fails
        return [{
            "name": "EV Charging Station",
            "address": "Nearby location",
            "distance": "Check OpenChargeMap app",
            "connectors": "Multiple types"
        }]

    stations = []
    for poi in data[:10]:
        addr_parts = []
        addr = poi.get("AddressInfo", {})
        if addr.get("Town"):
            addr_parts.append(addr["Town"])
        if addr.get("StateOrProvince"):
            addr_parts.append(addr["StateOrProvince"])

        connections = poi.get("Connections", [])
        conn_types = list(set(
            c.get("ConnectionType", {}).get("Title", "")
            for c in connections if c.get("ConnectionType")
        ))

        stations.append({
            "name": addr.get("Title", "Charging Station"),
            "address": ", ".join(addr_parts) if addr_parts else addr.get("AddressLine1", "Address unavailable"),
            "distance": f"{poi.get('Distance', '?')} km" if poi.get("Distance") else "Nearby",
            "connectors": ", ".join(conn_types[:3]) if conn_types else "Unknown"
        })

    return stations if stations else [{
        "name": "No stations found nearby",
        "address": "Try expanding search radius",
        "distance": "-",
        "connectors": "-"
    }]


def _generate_booking_links(origin, destination):
    """Generate booking URLs for bus, train, flight."""
    links = []

    # Bus - RedBus
    bus_url = (
        f"https://www.redbus.in/search"
        f"?fromCity={urllib.parse.quote(origin)}"
        f"&toCity={urllib.parse.quote(destination)}"
    )
    links.append({
        "label": "🚌 Book Bus (RedBus)",
        "url": bus_url,
        "mode": "bus"
    })

    # Train - IRCTC
    train_url = "https://www.irctc.co.in/nget/train-search"
    links.append({
        "label": "🚂 Book Train (IRCTC)",
        "url": train_url,
        "mode": "train"
    })

    # Flight - MakeMyTrip
    flight_url = (
        f"https://www.makemytrip.com/flight/search"
        f"?from={urllib.parse.quote(origin)}"
        f"&to={urllib.parse.quote(destination)}"
    )
    links.append({
        "label": "✈️ Book Flight (MakeMyTrip)",
        "url": flight_url,
        "mode": "flight"
    })

    return links


def _parse_places(command):
    """Extract origin and destination from command."""
    lower = command.lower()

    # Try patterns like "from X to Y"
    patterns = [
        r"from\s+(.+?)\s+to\s+(.+?)(?:\s*$)",
        r"(?:route|directions?|navigate|go)\s+(?:from\s+)?(.+?)\s+to\s+(.+?)(?:\s*$)",
        r"(.+?)\s+to\s+(.+?)(?:\s*$)",
    ]

    for pattern in patterns:
        match = re.search(pattern, lower)
        if match:
            origin = match.group(1).strip()
            dest = match.group(2).strip()
            # Clean up filler words
            for word in ["please", "give me", "show me", "find", "search"]:
                origin = origin.replace(word, "").strip()
                dest = dest.replace(word, "").strip()
            if origin and dest:
                return origin, dest

    return None, None


def _detect_intent(command):
    """Detect the type of travel command."""
    lower = command.lower()

    # EV charging intent
    if any(kw in lower for kw in ["charge", "charging", "ev station", "ev bike", "electric vehicle"]):
        return "ev_charging"

    # Booking intent
    if any(kw in lower for kw in BOOKING_KEYWORDS):
        return "booking"

    # Route/directions intent
    return "route"


def handle_travel_command(command):
    intent = _detect_intent(command)

    if intent == "ev_charging":
        # Find EV charging near a location
        location = command
        for word in ["find", "search", "near", "around", "close to",
                      "charge", "charging", "ev", "station", "bike",
                      "my", "me", "please", "give me", "show me"]:
            location = location.replace(word, "")
        location = re.sub(r'\s+', ' ', location).strip()
        if not location:
            location = "current location"

        coords = _geocode(location)
        if not coords:
            return {
                "intent": "ev_charging",
                "message": f"Could not find location: {location}",
                "stations": []
            }

        stations = _find_ev_charging(coords["lat"], coords["lon"])
        return {
            "intent": "ev_charging",
            "location": coords.get("display_name", location),
            "stations": stations
        }

    elif intent == "booking":
        origin, destination = _parse_places(command)
        if not origin or not destination:
            # Try to extract just a destination
            dest = command
            for word in ["book", "ticket", "bus", "train", "flight",
                          "to", "from", "please", "give me"]:
                dest = dest.replace(word, "")
            dest = re.sub(r'\s+', ' ', dest).strip()
            if dest:
                links = _generate_booking_links("my city", dest)
            else:
                links = []
        else:
            links = _generate_booking_links(origin, destination)

        return {
            "intent": "booking",
            "origin": origin or "your city",
            "destination": destination or "destination",
            "links": links
        }

    else:
        # Route/directions intent
        origin, destination = _parse_places(command)
        if not origin or not destination:
            return {
                "intent": "route",
                "message": "Please specify origin and destination (e.g., 'route from A to B')",
                "route": None
            }

        origin_coords = _geocode(origin)
        dest_coords = _geocode(destination)

        if not origin_coords:
            return {
                "intent": "route",
                "message": f"Could not find: {origin}",
                "route": None
            }
        if not dest_coords:
            return {
                "intent": "route",
                "message": f"Could not find: {destination}",
                "route": None
            }

        route = _get_route(origin_coords, dest_coords)
        if not route:
            return {
                "intent": "route",
                "message": "Could not calculate route",
                "route": None
            }

        return {
            "intent": "route",
            "route": route
        }
