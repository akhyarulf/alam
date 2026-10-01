"""
Alam Engine - Editor UI (lokal)

Jalanin dengan:
    python app.py

Buka di browser:
    http://localhost:8000
"""

from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify, render_template

from parser.factory import parse as parse_file
from editor.trim import trim_track
from cleaner.validator import validate
from cleaner.cleaner import clean
from cleaner.spike import remove_elevation_spikes
from analyzer.stats import analyze, calculate_distances
from analyzer.segment import analyze_segments
from analyzer.merge import merge_segments
from waypoint.generator import generate_waypoints
from utils.route_id import create_route_id

from pipeline import process_track

from config import INPUT_DIR, ALLOWED_INPUT, OUTPUT_FORMATS


app = Flask(__name__)

INPUT_DIR.mkdir(parents=True, exist_ok=True)


# ==========================================================
# HALAMAN UTAMA
# ==========================================================

@app.route("/")
def index():
    return render_template(
        "index.html",
        formats=OUTPUT_FORMATS
    )


# ==========================================================
# LIST FILE DI workspace/input
# ==========================================================

@app.route("/api/files")
def api_files():

    files = sorted(
        f.name for f in INPUT_DIR.glob("*")
        if f.suffix.lower() in ALLOWED_INPUT
    )

    return jsonify({"files": files})


# ==========================================================
# UPLOAD FILE BARU
# ==========================================================

@app.route("/api/upload", methods=["POST"])
def api_upload():

    if "file" not in request.files:
        return jsonify({"error": "Tidak ada file yang dikirim."}), 400

    f = request.files["file"]

    if not f.filename:
        return jsonify({"error": "Nama file kosong."}), 400

    ext = Path(f.filename).suffix.lower()

    if ext not in ALLOWED_INPUT:
        return jsonify({
            "error": f"Format '{ext}' belum didukung. "
                     f"Yang didukung: {', '.join(ALLOWED_INPUT)}"
        }), 400

    dest = INPUT_DIR / f.filename

    f.save(dest)

    return jsonify({"filename": f.filename})


# ==========================================================
# PREVIEW (parse + trim, TANPA export/upload)
# ==========================================================

@app.route("/api/preview", methods=["POST"])
def api_preview():

    body = request.get_json(force=True)

    filename = body.get("filename")

    trim_start = int(body.get("trim_start", 0))
    trim_end = int(body.get("trim_end", 0))

    if not filename:
        return jsonify({"error": "filename wajib diisi."}), 400

    file_path = INPUT_DIR / filename

    if not file_path.exists():
        return jsonify({"error": f"File '{filename}' tidak ditemukan."}), 404

    try:
        hasil = parse_file(str(file_path))

        track = trim_track(hasil["track"], trim_start, trim_end)

        if not track:
            return jsonify({"error": "Trim menghabiskan semua titik track."}), 400

        track, _ = validate(track)
        track, _ = clean(track)
        track, _ = remove_elevation_spikes(track)
        track = calculate_distances(track)

        stats = analyze(track)
        segments = merge_segments(analyze_segments(track))
        waypoints = generate_waypoints(track, stats)

        return jsonify({
            "name": hasil["name"],
            "mountain": hasil["mountain"],
            "route": hasil["route"],
            "route_id": hasil["route_id"],
            "total_points": len(hasil["track"]),
            "track": track,
            "stats": stats,
            "segments": segments,
            "waypoints": waypoints
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ==========================================================
# PROCESS (jalanin pipeline penuh: export + upload opsional)
# ==========================================================

@app.route("/api/process", methods=["POST"])
def api_process():

    body = request.get_json(force=True)

    filename = body.get("filename")

    if not filename:
        return jsonify({"error": "filename wajib diisi."}), 400

    file_path = INPUT_DIR / filename

    if not file_path.exists():
        return jsonify({"error": f"File '{filename}' tidak ditemukan."}), 404

    try:
        hasil = process_track(
            file=str(file_path),
            trim_start=int(body.get("trim_start", 0)),
            trim_end=int(body.get("trim_end", 0)),
            name=body.get("name") or None,
            mountain=body.get("mountain") or None,
            route=body.get("route") or None,
            extra_waypoints=body.get("waypoints") or [],
            formats=body.get("formats") or None,
            export=True,
            upload=bool(body.get("upload", True)),
            verbose=False
        )

        return jsonify({
            "route_id": hasil["route_id"],
            "name": hasil["name"],
            "stats": hasil["stats"],
            "outputs": hasil["outputs"],
            "manifest": hasil["manifest"],
            "processed_at": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
