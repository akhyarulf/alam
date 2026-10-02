from pathlib import Path

from parser import parse

from cleaner.validator import validate
from cleaner.cleaner import clean
from cleaner.spike import remove_elevation_spikes

from analyzer.stats import (
    analyze,
    calculate_distances
)

from analyzer.segment import analyze_segments
from analyzer.merge import merge_segments
from analyzer.geometry import build_geometry

from editor.trim import trim_track

from waypoint.generator import generate_waypoints

from outputs.manager import OutputManager

from exporter.factory import export as export_outputs

from manifest.builder import ManifestBuilder
from manifest.writer import ManifestWriter

from storage.manager import StorageManager
from storage.drivers.github import GithubStorage

from utils.report import print_summary
from utils.route_id import create_route_id

from config import *


def process_track(
    file=DEFAULT_INPUT,
    trim_start=TRIM_START,
    trim_end=TRIM_END,
    name=None,
    mountain=None,
    route=None,
    extra_waypoints=None,
    formats=None,
    export=True,
    upload=True,
    verbose=True
):
    """
    Jalanin pipeline lengkap: parse -> trim -> clean ->
    analyze -> waypoint -> export -> upload.

    Param tambahan (dipakai UI editor):

    name / mountain / route
        override manual, kalau kosong dipakai hasil
        deteksi otomatis dari judul track.

    extra_waypoints
        list waypoint tambahan bikinan user, format:
        [{"name": "...", "lat":.., "lng":.., "ele":..}, ...]

    formats
        list format output yang mau dipakai, misal
        ["json", "geojson", "gpx"]. Default dari config.

    upload
        kalau False, file cuma di-export ke folder
        output lokal, TIDAK diupload ke GitHub.
        Berguna buat preview dulu sebelum publish beneran.
    """

    # =====================================
    # PARSE
    # =====================================

    hasil = parse(str(file))

    track = hasil["track"]

    # =====================================
    # OVERRIDE METADATA (dari UI, kalau ada)
    # =====================================

    if name:
        hasil["name"] = name

    if mountain:
        hasil["mountain"] = mountain

    if route:
        hasil["route"] = route

    if mountain or route:
        hasil["route_id"] = create_route_id(
            hasil["mountain"],
            hasil["route"]
        )

    # =====================================
    # TRIM
    # =====================================

    track = trim_track(
        track,
        trim_start,
        trim_end
    )

    if not track:
        raise ValueError(
            "Trim yang dipilih menghabiskan semua titik track. "
            "Kurangi trim_start/trim_end."
        )

    # =====================================
    # CLEANER
    # =====================================

    track, removed_invalid = validate(track)

    track, removed_duplicate = clean(track)

    track, fixed_spike = remove_elevation_spikes(track)

    # =====================================
    # DISTANCE
    # =====================================

    track = calculate_distances(track)

    hasil["track"] = track

    # =====================================
    # GEOMETRY
    # =====================================

    hasil["geometry"] = build_geometry(track)

    # =====================================
    # STATISTICS
    # =====================================

    stats = analyze(track)

    hasil["stats"] = stats

    # =====================================
    # SEGMENTS
    # =====================================

    segments = analyze_segments(track)

    segments = merge_segments(segments)

    hasil["segments"] = segments

    # =====================================
    # WAYPOINTS
    # =====================================

    waypoints = generate_waypoints(
        track,
        stats,
        extra=extra_waypoints
    )

    hasil["waypoints"] = waypoints

    # =====================================
    # OUTPUT
    # =====================================

    hasil["outputs"] = []

    hasil["manifest"] = None

    if export:

        output_formats = formats or OUTPUT_FORMATS

        # ---------------------------------
        # OUTPUT MANAGER
        # ---------------------------------

        manager = OutputManager(
            route_id=hasil["route_id"]
        )

        # format -> (folder, destination, public)
        format_routing = {
            "json": (VIEWER_FOLDER, "github", True),
            "geojson": (VIEWER_FOLDER, "github", True),
        }

        for fmt in output_formats:

            routing = format_routing.get(fmt)

            if not routing:
                continue

            folder, destination, public = routing

            manager.add(
                format=fmt,
                folder=folder,
                destination=destination,
                public=public
            )

        outputs = manager.get_outputs()

        # ---------------------------------
        # EXPORT FILES
        # ---------------------------------

        export_outputs(
            hasil,
            outputs
        )

        # ---------------------------------
        # BUILD MANIFEST
        # ---------------------------------

        builder = ManifestBuilder(
            name=hasil["name"],
            mountain=hasil["mountain"],
            route=hasil["route"],
            route_id=hasil["route_id"],
            engine_version=ENGINE_VERSION
        )

        builder.set_stats(stats)

        builder.add_outputs(outputs)

        hasil["outputs"] = builder.build()["exports"]

        # ---------------------------------
        # STORAGE (opsional)
        # ---------------------------------

        if upload and ENABLE_STORAGE:

            storage = StorageManager()

            storage.register(GithubStorage())

            upload_result = storage.upload(
                builder.build()
            )

            builder.update_downloads(
                upload_result["manifest"]
            )

            hasil["outputs"] = upload_result["manifest"]["exports"]

        # ---------------------------------
        # SAVE MANIFEST
        # ---------------------------------

        writer = ManifestWriter(builder.build())

        manifest_file = writer.save(
            f"{OUTPUT_DIR}/{VIEWER_FOLDER}/{hasil['route_id']}"
        )

        # ---------------------------------
        # UPLOAD MANIFEST
        # ---------------------------------

        if upload and ENABLE_STORAGE:

            github = storage.get_driver("github")

            if github:
                github.upload_manifest(
                    manifest_file,
                    hasil["route_id"]
                )

        hasil["manifest"] = ManifestWriter.load(manifest_file)

    # =====================================
    # SUMMARY
    # =====================================

    if verbose:
        print_summary(
            hasil,
            stats,
            removed_invalid,
            removed_duplicate,
            fixed_spike
        )

    return hasil
