import xml.etree.ElementTree as ET

from exceptions import AlamEngineError
from utils.route_id import build_track_meta


def parse_kml(file):

    tree = ET.parse(file)
    root = tree.getroot()

    ns = ""
    if "}" in root.tag:
        ns = root.tag.split("}")[0] + "}"

    title = ""
    for name in root.iter(ns + "name"):
        if name.text:
            title = name.text.strip()
            break

    coords_text = None
    for coord_el in root.iter(ns + "coordinates"):
        if coord_el.text and coord_el.text.strip():
            coords_text = coord_el.text.strip()
            break

    if not coords_text:
        raise AlamEngineError("KML tidak punya <coordinates> yang valid.")

    track = []

    for chunk in coords_text.split():
        parts = chunk.split(",")
        if len(parts) < 2:
            continue
        lng = float(parts[0])
        lat = float(parts[1])
        ele = float(parts[2]) if len(parts) > 2 and parts[2] != "" else None
        track.append({"lat": lat, "lng": lng, "ele": ele})

    if not track:
        raise AlamEngineError("KML tidak punya titik koordinat.")

    meta = build_track_meta(title)

    return {
        "name": meta["name"],
        "mountain": meta["mountain"],
        "route": meta["route"],
        "route_id": meta["route_id"],
        "track": track
    }
