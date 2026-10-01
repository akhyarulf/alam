from pathlib import Path


def export_kml(data, filename):

    Path(filename).parent.mkdir(parents=True, exist_ok=True)

    coords = "\n".join(
        f"{p['lng']},{p['lat']},{p.get('ele') or 0}"
        for p in data["track"]
    )

    kml = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>{data['name']}</name>
    <Placemark>
      <name>{data['name']}</name>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
{coords}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
"""

    with open(filename, "w", encoding="utf-8") as f:
        f.write(kml)
