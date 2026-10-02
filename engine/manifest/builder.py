from pathlib import Path
from datetime import datetime
import json


class ManifestBuilder:
    """
    Manifest Builder

    Manifest adalah pusat informasi
    untuk satu jalur.

    Viewer hanya membaca manifest.
    """

    def __init__(

        self,

        name,

        mountain,

        route,

        route_id,

        engine_version

    ):

        self.route_id = route_id

        self.manifest = {

            "id": route_id,

            "engine": {

                "name": "Alam Engine",

                "version": engine_version

            },

            "track": {

                "name": name,

                "mountain": mountain,

                "route": route

            },

            "stats": {},

            "viewer": {

                "json": "track.json",

                "geojson": "track.geojson"

            },

            "downloads": {

                "gpx": None,

                "kml": None,

                "kmz": None,

                "fit": None,

                "tcx": None

            },

            "exports": [],

            "created_at": datetime.utcnow().isoformat()

        }

    # ======================================
    # STATS
    # ======================================

    def set_stats(

        self,

        stats

    ):

        self.manifest["stats"] = stats

    # ======================================
    # OUTPUTS
    # ======================================

    def add_outputs(

        self,

        outputs

    ):

        for item in outputs:

            file = Path(

                item["path"]

            )

            exists = file.exists()

            size = (

                file.stat().st_size

                if exists

                else 0

            )

            export = item.copy()

            export["exists"] = exists

            export["size"] = size

            export["status"] = (

                "success"

                if exists

                else "missing"

            )

            self.manifest["exports"].append(

                export

            )

    # ======================================
    # DOWNLOAD URL
    # ======================================

    def update_downloads(

        self,

        manifest

    ):

        for item in manifest["exports"]:

            fmt = item["format"]

            if fmt in self.manifest["downloads"]:

                self.manifest["downloads"][fmt] = item.get(

                    "download_url"

                )

    # ======================================
    # BUILD
    # ======================================

    def build(self):

        return self.manifest

    # ======================================
    # SAVE
    # ======================================

    def save(self):

        folder = (

            Path("output")

            / "data"

            / self.route_id

        )

        folder.mkdir(

            parents=True,

            exist_ok=True

        )

        file = folder / "manifest.json"

        with open(

            file,

            "w",

            encoding="utf-8"

        ) as f:

            json.dump(

                self.manifest,

                f,

                indent=2,

                ensure_ascii=False

            )

        return str(file)