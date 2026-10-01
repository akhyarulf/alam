import xml.etree.ElementTree as ET

from exceptions import AlamEngineError
from utils.route_id import build_track_meta


def parse_tcx(file):

    tree = ET.parse(file)
    root = tree.getroot()

    ns = ""
    if "}" in root.tag:
        ns = root.tag.split("}")[0] + "}"

    title = ""
    for name_el in root.iter(ns + "Name"):
        if name_el.text:
            title = name_el.text.strip()
            break

    track = []

    for tp in root.iter(ns + "Trackpoint"):

        pos = tp.find(ns + "Position")
        if pos is None:
            continue

        lat_el = pos.find(ns + "LatitudeDegrees")
        lng_el = pos.find(ns + "LongitudeDegrees")

        if lat_el is None or lng_el is None:
            continue

        ele_el = tp.find(ns + "AltitudeMeters")
        ele = float(ele_el.text) if ele_el is not None and ele_el.text else None

        track.append({
            "lat": float(lat_el.text),
            "lng": float(lng_el.text),
            "ele": ele
        })

    if not track:
        raise AlamEngineError("TCX tidak punya Trackpoint dengan koordinat.")

    meta = build_track_meta(title)

    return {
        "name": meta["name"],
        "mountain": meta["mountain"],
        "route": meta["route"],
        "route_id": meta["route_id"],
        "track": track
    }
