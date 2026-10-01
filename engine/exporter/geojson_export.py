import json
from pathlib import Path


def export_geojson(data, filename):

    # ======================================
    # CREATE DIRECTORY
    # ======================================

    Path(filename).parent.mkdir(parents=True, exist_ok=True)

    # ======================================
    # COORDINATES (garis track)
    # ======================================

    coordinates = [
        [p["lng"], p["lat"], p["ele"]]
        for p in data["track"]
    ]

    features = [
        {
            "type": "Feature",
            "properties": {
                "name": data["name"],
                "route_id": data["route_id"],
                "mountain": data["mountain"],
                "route": data["route"],
                "engine": "Alam Engine",
                "distance_km": data["stats"]["distance_km"],
                "elevation_gain": data["stats"]["gain"],
                "elevation_loss": data["stats"]["loss"]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            }
        }
    ]

    # ======================================
    # WAYPOINTS -> Point Feature
    # (viewer baca waypoint dari sini, bukan dari track.json)
    # ======================================

    for wp in data.get("waypoints", []):

        features.append({
            "type": "Feature",
            "properties": {
                "name": wp.get("name", "Waypoint"),
                "ele": wp.get("ele"),
                "distance_km": wp.get("distance_km"),
                "estimated_duration_minutes": wp.get("estimated_duration_minutes"),
                "locked": wp.get("locked", False),
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    wp["lng"],
                    wp["lat"],
                ] + ([wp["ele"]] if wp.get("ele") is not None else [])
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # ======================================
    # SAVE
    # ======================================

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
