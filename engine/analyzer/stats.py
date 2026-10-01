from geopy.distance import geodesic
import math

from config import HIKING_PACE_KMH, HIKING_MINUTES_PER_100M_GAIN


def calculate_distances(track):

    total = 0
    result = []

    for i, point in enumerate(track):

        if i == 0:
            distance = 0
        else:
            prev = track[i - 1]
            distance = haversine(
                prev["lat"], prev["lng"],
                point["lat"], point["lng"]
            )
            total += distance

        data = point.copy()
        data["distance"] = round(total, 3)
        result.append(data)

    return result


def haversine(lat1, lon1, lat2, lon2):

    R = 6371

    lat1 = math.radians(lat1)
    lat2 = math.radians(lat2)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def estimate_duration_minutes(distance_km, gain_m):
    """
    Estimasi lama jalan pakai varian Naismith's Rule:
    - waktu dasar dari jarak (kecepatan rata-rata pendaki)
    - tambahan waktu per 100m tanjakan (nafas ngos-ngosan tax)

    Ini perkiraan kasar buat gambaran umum, bukan patokan mutlak
    (kondisi trek, cuaca, & fisik masing-masing beda-beda).
    """

    base_minutes = (distance_km / HIKING_PACE_KMH) * 60
    climb_minutes = (gain_m / 100) * HIKING_MINUTES_PER_100M_GAIN

    return round(base_minutes + climb_minutes)


def classify_direction(gain, loss):
    """
    Klasifikasi arah jalur berdasarkan dominasi elevasi:
    - "ascent"  : didominasi tanjakan (rute naik / summit attack)
    - "descent" : didominasi turunan (rute turun)
    - "mixed"   : naik-turun seimbang (pulang-pergi / loop)
    """

    if gain == 0 and loss == 0:
        return "mixed"

    if gain > loss * 1.3:
        return "ascent"

    if loss > gain * 1.3:
        return "descent"

    return "mixed"


def analyze(track):

    total_distance = 0

    gain = 0
    loss = 0

    highest = None
    lowest = None

    min_lat = None
    max_lat = None

    min_lng = None
    max_lng = None

    for i, point in enumerate(track):

        lat = point["lat"]
        lng = point["lng"]
        ele = point["ele"]

        if min_lat is None or lat < min_lat:
            min_lat = lat

        if max_lat is None or lat > max_lat:
            max_lat = lat

        if min_lng is None or lng < min_lng:
            min_lng = lng

        if max_lng is None or lng > max_lng:
            max_lng = lng

        if highest is None or ele > highest:
            highest = ele

        if lowest is None or ele < lowest:
            lowest = ele

        if i > 0:

            prev = track[i - 1]

            total_distance += geodesic(
                (prev["lat"], prev["lng"]),
                (lat, lng)
            ).meters

            diff = ele - prev["ele"]

            if diff > 0:
                gain += diff
            else:
                loss += abs(diff)

    distance_km = round(total_distance / 1000, 2)

    gain = round(gain)
    loss = round(loss)

    return {

        "points": len(track),

        "distance_km": distance_km,

        "gain": gain,

        "loss": loss,

        "highest": highest,

        "lowest": lowest,

        "start": track[0]["ele"],

        "finish": track[-1]["ele"],

        "estimated_duration_minutes": estimate_duration_minutes(
            distance_km, gain
        ),

        "direction": classify_direction(gain, loss),

        "bbox": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lng": min_lng,
            "max_lng": max_lng
        },

        "center": {
            "lat": (min_lat + max_lat) / 2,
            "lng": (min_lng + max_lng) / 2
        }

    }
