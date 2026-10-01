import json
from pathlib import Path


def export_json(data, filename):

    # ======================================
    # CREATE DIRECTORY
    # ======================================

    Path(filename).parent.mkdir(

        parents=True,

        exist_ok=True

    )

    # ======================================
    # OUTPUT
    # ======================================

    output = {

        "meta": {

            "name": data["name"],

            "route_id": data["route_id"],

            "mountain": data["mountain"],

            "route": data["route"],

            "engine": "Alam Engine"

        },

        "stats": data["stats"],

        "waypoints": data.get(

            "waypoints",

            []

        ),

        "geometry": data["geometry"],

        "segments": data.get(

            "segments",

            []

        )

    }

    with open(

        filename,

        "w",

        encoding="utf-8"

    ) as f:

        json.dump(

            output,

            f,

            indent=2,

            ensure_ascii=False

        )