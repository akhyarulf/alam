def calculate_slope(distance_m, elevation_change):

    if distance_m == 0:
        return 0

    return (
        elevation_change /
        distance_m
    ) * 100



def classify_segment(slope):

    if slope >= 20:
        return "climb_hard"

    elif slope >= 8:
        return "climb"

    elif slope >= 2:
        return "climb_easy"

    elif slope <= -20:
        return "descent_hard"

    elif slope <= -8:
        return "descent"

    elif slope <= -2:
        return "descent_easy"

    else:
        return "flat"



def analyze_segments(track):

    segments = []


    for i in range(len(track)-1):

        a = track[i]
        b = track[i+1]


        distance = (
    b["distance"]
    -
    a["distance"]
) * 1000


        elevation_change = (
            b["ele"]
            -
            a["ele"]
        )


        slope = calculate_slope(
            distance,
            elevation_change
        )


        segments.append({

            "from": i,

            "to": i+1,

            "distance_m":
                round(distance,2),

            "elevation_change":
                round(elevation_change,2),

            "slope":
                round(slope,2),

            "type":
                classify_segment(slope)

        })


    return segments
    
    