def _safe_avg_slope(elevation_change, distance_m):
    if not distance_m:
        return 0.0
    return round(elevation_change / distance_m * 100, 2)


def merge_segments(segments):

    if not segments:
        return []

    merged = []

    current = segments[0].copy()

    for seg in segments[1:]:

        if seg["type"] == current["type"]:

            current["to"] = seg["to"]
            current["distance_m"] += seg["distance_m"]
            current["elevation_change"] += seg["elevation_change"]

        else:

            current["avg_slope"] = _safe_avg_slope(
                current["elevation_change"],
                current["distance_m"]
            )

            merged.append(current)

            current = seg.copy()

    current["avg_slope"] = _safe_avg_slope(
        current["elevation_change"],
        current["distance_m"]
    )

    merged.append(current)

    return merged
