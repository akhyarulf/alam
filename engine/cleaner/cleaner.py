def clean(track):

    cleaned = []

    removed = 0

    last = None

    for point in track:

        if last:

            if (

                point["lat"] == last["lat"]

                and

                point["lng"] == last["lng"]

            ):

                removed += 1

                continue

        cleaned.append(point)

        last = point

    return cleaned, removed