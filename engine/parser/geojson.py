import json

from exceptions import AlamEngineError
from utils.route_id import build_track_meta


def parse_geojson(file):

    with open(file, "r", encoding="utf-8") as f:
        data = json.load(f)

    coords = []
    title = ""

    features = data.get("features") if data.get("type") == "FeatureCollection" else [data]

    for feature in features or []:

        geom = feature.get("geometry", {}) or {}
        props = feature.get("properties", {}) or {}

        if not title:
            title = props.get("name") or props.get("title") or ""

        gtype = geom.get("type")

        if gtype == "LineString":
            coords.extend(geom.get("coordinates", []))

        elif gtype == "MultiLineString":
            for line in geom.get("coordinates", []):
                coords.extend(line)

    if not coords:
        raise AlamEngineError(
            "GeoJSON tidak punya LineString/MultiLineString yang valid."
        )

    meta = build_track_meta(title)

    track = []

    for c in coords:
        lng = c[0]
        lat = c[1]
        ele = c[2] if len(c) > 2 else None
        track.append({"lat": lat, "lng": lng, "ele": ele})

    return {
        "name": meta["name"],
        "mountain": meta["mountain"],
        "route": meta["route"],
        "route_id": meta["route_id"],
        "track": track
    }
