from pathlib import Path

from parser.gpx import parse_gpx
from parser.geojson import parse_geojson
from parser.kml import parse_kml
from parser.kmz import parse_kmz
from parser.csv import parse_csv
from parser.tcx import parse_tcx

from exceptions import AlamEngineError


PARSERS = {
    ".gpx": parse_gpx,
    ".geojson": parse_geojson,
    ".json": parse_geojson,
    ".kml": parse_kml,
    ".kmz": parse_kmz,
    ".csv": parse_csv,
    ".tcx": parse_tcx,
}


def parse(file):

    ext = Path(file).suffix.lower()

    parser_fn = PARSERS.get(ext)

    if not parser_fn:
        raise AlamEngineError(
            f"Format '{ext}' belum didukung. "
            f"Format yang didukung: {', '.join(sorted(PARSERS))}"
        )

    return parser_fn(file)
