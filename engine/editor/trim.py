def trim_track(track, trim_start=0, trim_end=0):
    """
    Memotong track berdasarkan jumlah titik
    yang dibuang dari depan dan belakang.

    Contoh:
        trim_start=10
        trim_end=20

    berarti:
        buang 10 titik pertama
        buang 20 titik terakhir
    """

    total = len(track)

    if trim_start < 0:
        trim_start = 0

    if trim_end < 0:
        trim_end = 0

    if trim_start >= total:
        return []

    if trim_end == 0:
        return track[trim_start:]

    if trim_start + trim_end >= total:
        return []

    return track[trim_start: total - trim_end]