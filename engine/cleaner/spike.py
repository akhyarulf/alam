def remove_elevation_spikes(track, threshold=80):

    if len(track) < 3:
        return track, 0

    cleaned = track.copy()

    fixed = 0

    for i in range(1, len(track)-1):

        prev = cleaned[i-1]["ele"]
        curr = cleaned[i]["ele"]
        nxt  = cleaned[i+1]["ele"]

        # jika titik sekarang jauh dari titik sebelum dan sesudah
        if abs(curr-prev) > threshold and abs(curr-nxt) > threshold:

            cleaned[i]["ele"] = round((prev+nxt)/2,1)

            fixed += 1

    return cleaned, fixed