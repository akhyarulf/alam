import re
import unicodedata


def slugify(text):
    """
    Mengubah teks menjadi slug URL friendly.

    Contoh:
    "Gunung Butak via Panderman"

    menjadi:

    gunung-butak-via-panderman
    """

    if not text:
        return ""


    text = unicodedata.normalize(
        "NFKD",
        text
    )


    text = text.encode(
        "ascii",
        "ignore"
    ).decode(
        "ascii"
    )


    text = text.lower()


    text = re.sub(
        r"[^a-z0-9]+",
        "-",
        text
    )


    text = re.sub(
        r"-+",
        "-",
        text
    )


    return text.strip("-")



def create_route_id(
    mountain,
    route
):
    """
    Membuat ID jalur.

    Contoh:

    mountain:
    Gunung Butak

    route:
    Panderman


    hasil:

    butak-via-panderman
    """


    mountain = slugify(
        mountain
    )


    route = slugify(
        route
    )


    mountain = mountain.replace(
        "gunung-",
        ""
    )


    if route:

        return f"{mountain}-via-{route}"


    return mountain


import re as _re


def extract_mountain_route(title):
    """
    Ambil nama gunung & jalur dari judul track.
    "Gunung Butak via Panderman" -> ("Gunung Butak", "Panderman")
    """

    title = title or ""

    pattern = _re.compile(r"Gunung\s+(.+?)\s+via\s+(.+)", _re.IGNORECASE)

    match = pattern.search(title)

    if match:
        mountain = f"Gunung {match.group(1).strip()}"
        route = match.group(2).strip()
    else:
        mountain = title
        route = ""

    return mountain, route


def build_track_meta(title, name_override=None, mountain_override=None, route_override=None):
    """
    Bangun dict meta (name, mountain, route, route_id) dari judul
    track, dengan opsi override manual (dipakai dari UI editor).
    """

    name = name_override or title or "Untitled Track"

    mountain, route = extract_mountain_route(title)

    if mountain_override:
        mountain = mountain_override

    if route_override:
        route = route_override

    route_id = create_route_id(mountain, route)

    return {
        "name": name,
        "mountain": mountain,
        "route": route,
        "route_id": route_id
    }