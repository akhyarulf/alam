from pathlib import Path


class OutputManager:

    def __init__(
        self,
        route_id
    ):

        self.route_id = route_id
        self.outputs = []

    # ======================================
    # ADD OUTPUT
    # ======================================

    def add(
        self,
        format,
        folder,
        destination,
        public=False
    ):

        # ----------------------------------
        # Standard filename
        # ----------------------------------

        filenames = {

            "json": "track.json",
            "geojson": "track.geojson",
            "gpx": "track.gpx"

        }

        filename = filenames.get(
            format,
            f"track.{format}"
        )

        path = (

            Path("output")

            / folder

            / self.route_id

            / filename

        )

        self.outputs.append({

            "route_id": self.route_id,

            "format": format,

            "filename": filename,

            "folder": folder,

            "path": str(path),

            "destination": destination,

            "public": public

        })

    # ======================================
    # GET OUTPUTS
    # ======================================

    def get_outputs(self):

        return self.outputs