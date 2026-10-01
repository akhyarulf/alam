def validate(track):

    valid = []

    removed = 0

    for point in track:

        lat = point["lat"]
        lng = point["lng"]
        ele = point["ele"]

        # koordinat wajib ada
        if lat is None or lng is None:
            removed += 1
            continue

        # koordinat dunia
        if lat < -90 or lat > 90:
            removed += 1
            continue

        if lng < -180 or lng > 180:
            removed += 1
            continue

        # elevasi kosong
        if ele is None:
            ele = 0

        valid.append({

            "lat": lat,

            "lng": lng,

            "ele": ele

        })

    return valid, removed