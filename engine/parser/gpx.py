import re
import xml.etree.ElementTree as ET

from utils.route_id import create_route_id


def parse_gpx(file_path):

    tree = ET.parse(file_path)

    root = tree.getroot()

    namespace = ""

    if "}" in root.tag:

        namespace = root.tag.split("}")[0] + "}"

    data = {

        "name": "",

        "mountain": "",

        "route": "",

        "route_id": "",

        "track": []

    }

    # ======================================
    # TRACK NAME
    # ======================================

    for name in root.iter(namespace + "name"):

        data["name"] = name.text.strip()

        break

    # ======================================
    # PARSE MOUNTAIN & ROUTE
    # ======================================

    title = data["name"]

    pattern = re.compile(

        r"Gunung\s+(.+?)\s+via\s+(.+)",

        re.IGNORECASE

    )

    match = pattern.search(title)

    if match:

        mountain = f"Gunung {match.group(1).strip()}"

        route = match.group(2).strip()

    else:

        mountain = title

        route = ""

    data["mountain"] = mountain

    data["route"] = route

    data["route_id"] = create_route_id(

        mountain,

        route

    )

    # ======================================
    # TRACK POINTS
    # ======================================

    for point in root.iter(namespace + "trkpt"):

        lat = float(

            point.attrib["lat"]

        )

        lng = float(

            point.attrib["lon"]

        )

        ele = None

        for child in point:

            tag = child.tag.replace(

                namespace,

                ""

            )

            if tag == "ele":

                ele = float(

                    child.text

                )

        if ele is None:

            if "ele" in point.attrib:

                ele = float(

                    point.attrib["ele"]

                )

        data["track"].append({

            "lat": lat,

            "lng": lng,

            "ele": ele

        })

    return data