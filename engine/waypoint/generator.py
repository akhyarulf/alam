from analyzer.stats import estimate_duration_minutes


def _nearest_point(track, lat, lng):
    """Cari titik track terdekat, buat ambil jarak-kumulatif & elevasi asli."""

    best = track[0]
    best_dist = float("inf")

    for p in track:
        d = (p["lat"] - lat) ** 2 + (p["lng"] - lng) ** 2
        if d < best_dist:
            best_dist = d
            best = p

    return best


def _cumulative_gain(track):
    """Elevation gain kumulatif di tiap titik, buat estimasi durasi per pos."""

    gains = [0.0]
    total = 0.0

    for i in range(1, len(track)):
        diff = track[i]["ele"] - track[i - 1]["ele"]
        if diff > 0:
            total += diff
        gains.append(total)

    return gains


def _enrich(wp, track, gains, locked=False):
    """Tempelin distance_km & estimated_duration_minutes ke satu waypoint."""

    nearest = _nearest_point(track, wp["lat"], wp["lng"])
    idx = track.index(nearest)

    distance_km = round(nearest.get("distance", 0) / 1000, 2)
    gain_so_far = gains[idx] if idx < len(gains) else gains[-1]

    return {
        "name": wp["name"],
        "lat": wp["lat"],
        "lng": wp["lng"],
        "ele": wp.get("ele"),
        "distance_km": distance_km,
        "estimated_duration_minutes": estimate_duration_minutes(
            distance_km, gain_so_far
        ),
        "locked": locked
    }


def generate_waypoints(track, stats, extra=None):
    """
    Bangun daftar waypoint lengkap: Start, Finish, Highest Point
    (otomatis & terkunci) + waypoint tambahan bikinan user.

    Tiap waypoint dilengkapi jarak dari titik start (distance_km)
    dan estimasi durasi jalan sampai ke situ (estimated_duration_minutes),
    dihitung dari posisi titik track terdekat.
    """

    gains = _cumulative_gain(track)

    waypoints = []

    start = track[0]
    waypoints.append(_enrich(
        {"name": "Start", "lat": start["lat"], "lng": start["lng"], "ele": start["ele"]},
        track, gains, locked=True
    ))

    finish = track[-1]
    waypoints.append(_enrich(
        {"name": "Finish", "lat": finish["lat"], "lng": finish["lng"], "ele": finish["ele"]},
        track, gains, locked=True
    ))

    highest = max(track, key=lambda x: x["ele"])
    waypoints.append(_enrich(
        {"name": "Highest Point", "lat": highest["lat"], "lng": highest["lng"], "ele": highest["ele"]},
        track, gains, locked=True
    ))

    for wp in (extra or []):
        waypoints.append(_enrich(wp, track, gains, locked=False))

    return waypoints
