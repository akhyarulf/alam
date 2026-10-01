import csv as _csv
from pathlib import Path

from exceptions import AlamEngineError
from utils.route_id import build_track_meta


LAT_KEYS = ["lat", "latitude"]
LNG_KEYS = ["lng", "lon", "long", "longitude"]
ELE_KEYS = ["ele", "elevation", "alt", "altitude"]


def _find_key(fieldnames, candidates):
    lower = {f.lower(): f for f in fieldnames}
    for c in candidates:
        if c in lower:
            return lower[c]
    return None


def parse_csv(file):

    with open(file, "r", encoding="utf-8-sig", newline="") as f:
        reader = _csv.DictReader(f)

        if not reader.fieldnames:
            raise AlamEngineError("CSV tidak punya header kolom.")

        lat_key = _find_key(reader.fieldnames, LAT_KEYS)
        lng_key = _find_key(reader.fieldnames, LNG_KEYS)
        ele_key = _find_key(reader.fieldnames, ELE_KEYS)

        if not lat_key or not lng_key:
            raise AlamEngineError(
                "CSV wajib punya kolom lat & lng (atau latitude/longitude)."
            )

        track = []

        for row in reader:
            try:
                lat = float(row[lat_key])
                lng = float(row[lng_key])
            except (TypeError, ValueError):
                continue

            ele = None
            if ele_key and row.get(ele_key) not in (None, ""):
                try:
                    ele = float(row[ele_key])
                except ValueError:
                    ele = None

            track.append({"lat": lat, "lng": lng, "ele": ele})

    if not track:
        raise AlamEngineError("CSV tidak punya baris koordinat yang valid.")

    title = Path(file).stem
    meta = build_track_meta(title)

    return {
        "name": meta["name"],
        "mountain": meta["mountain"],
        "route": meta["route"],
        "route_id": meta["route_id"],
        "track": track
    }
