def build_geometry(track):
    """
    Bangun array geometry [lat, lng, ele, distance_km] buat elevation
    chart di viewer. Pakai distance kumulatif yang sudah dihitung
    calculate_distances() -- tidak dihitung ulang di sini.
    """

    coordinates = [
        [
            p["lat"],
            p["lng"],
            p["ele"],
            round(p.get("distance", 0) / 1000, 3)
        ]
        for p in track
    ]

    return {
        "type": "LineString",
        "coordinates": coordinates
    }
