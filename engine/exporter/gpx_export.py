import xml.etree.ElementTree as ET
from pathlib import Path


def export_gpx(data, filename):

    # ======================================
    # CREATE DIRECTORY
    # ======================================

    Path(filename).parent.mkdir(

        parents=True,

        exist_ok=True

    )

    # ======================================
    # ROOT
    # ======================================

    gpx = ET.Element(

        "gpx",

        {

            "version": "1.1",

            "creator": "Alam Engine",

            "xmlns": "http://www.topografix.com/GPX/1/1"

        }

    )

    # ======================================
    # TRACK
    # ======================================

    trk = ET.SubElement(

        gpx,

        "trk"

    )

    name = ET.SubElement(

        trk,

        "name"

    )

    name.text = data["name"]

    # ======================================
    # METADATA
    # ======================================

    extensions = ET.SubElement(

        trk,

        "extensions"

    )

    ET.SubElement(

        extensions,

        "route_id"

    ).text = data["route_id"]

    ET.SubElement(

        extensions,

        "mountain"

    ).text = data["mountain"]

    ET.SubElement(

        extensions,

        "route"

    ).text = data["route"]

    ET.SubElement(

        extensions,

        "engine"

    ).text = "Alam Engine"

    # ======================================
    # TRACK SEGMENT
    # ======================================

    seg = ET.SubElement(

        trk,

        "trkseg"

    )

    for p in data["track"]:

        point = ET.SubElement(

            seg,

            "trkpt",

            {

                "lat": str(p["lat"]),

                "lon": str(p["lng"])

            }

        )

        if p.get("ele") is not None:

            ele = ET.SubElement(

                point,

                "ele"

            )

            ele.text = str(p["ele"])

    # ======================================
    # SAVE
    # ======================================

    tree = ET.ElementTree(gpx)

    ET.indent(

        tree,

        space="  "

    )

    tree.write(

        filename,

        encoding="utf-8",

        xml_declaration=True

    )