import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# =====================================================
# ENGINE
# =====================================================

ENGINE_NAME = "Alam Engine"

ENGINE_VERSION = "1.4.0"

DEBUG = True


# =====================================================
# WORKSPACE (tempat kerja sementara: upload & scratch)
# =====================================================

WORKSPACE = Path("workspace")

INPUT_DIR = WORKSPACE / "input"

TEMP_DIR = WORKSPACE / "temp"

# Semua hasil export (file & viewer json) disimpan di sini
OUTPUT_DIR = Path("output")


# =====================================================
# DEFAULT INPUT
# =====================================================

DEFAULT_INPUT = "buthak-via-panderman.gpx"

TRIM_START = 0

TRIM_END = 0


# =====================================================
# OUTPUT
# =====================================================

VIEWER_FOLDER = "viewer"

FILES_FOLDER = "files"

OUTPUT_FORMATS = [
    "json",
    "geojson",
    "gpx",
    "kml",
]


# =====================================================
# VIEWER
# =====================================================

VIEWER_JSON = True

VIEWER_GEOJSON = True


# =====================================================
# STORAGE
# =====================================================

ENABLE_STORAGE = True

AUTO_CLEANUP = True


# =====================================
# GOOGLE DRIVE
# =====================================

GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "oauth.json")

GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")

# Suffix nama file waktu diupload ke Drive, karena Drive
# nggak punya struktur folder per-route kaya di GitHub.
# Hasil: {route_id}-{DRIVE_SUFFIX}.{ext}
# contoh: butak-via-panderman-nyasarnyaman.gpx
DRIVE_SUFFIX = os.getenv("DRIVE_SUFFIX", "nyasarnyaman")


# ======================================
# GITHUB
# ======================================

GITHUB_OWNER = os.getenv("GITHUB_OWNER", "")

GITHUB_REPOSITORY = os.getenv("GITHUB_REPOSITORY", "")

GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

# PENTING: token TIDAK boleh hardcode di sini.
# Isi lewat file .env (lihat .env.example).
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")


# =====================================================
# ESTIMASI DURASI JALAN
# =====================================================

# Kecepatan rata-rata pendaki di jalur datar (km/jam)
HIKING_PACE_KMH = 3.0

# Tambahan menit per 100m elevation gain (varian Naismith's Rule)
HIKING_MINUTES_PER_100M_GAIN = 10


# =====================================================
# API / UI
# =====================================================

HOST = "0.0.0.0"

PORT = 8000

MAX_UPLOAD_SIZE = 100

ALLOWED_INPUT = [
    ".gpx",
    ".geojson",
    ".json",
    ".kml",
    ".kmz",
    ".csv",
    ".tcx",
]
