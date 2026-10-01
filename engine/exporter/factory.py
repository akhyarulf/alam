from .json_export import export_json
from .geojson_export import export_geojson
from .gpx_export import export_gpx
from .kml_export import export_kml


EXPORTERS = {
    "json": export_json,
    "geojson": export_geojson,
    "gpx": export_gpx,
    "kml": export_kml,
}


def export(data, outputs):

    for item in outputs:

        fmt = item["format"]

        exporter = EXPORTERS.get(fmt)

        if exporter:
            exporter(
                data,
                item["path"]
            )
