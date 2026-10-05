/* ==========================================================
   Alam v1.2
   download.js

   Download Manager

   - GPX & KML dibuat langsung di browser dari track.geojson
     (lewat assets/js/export-file.js). Tidak ada layanan eksternal.
   - Kalau GeoJSON belum tersedia, tombol memakai tautan yang
     dicantumkan di manifest.downloads (bila ada).
========================================================== */

"use strict";

const DownloadManager = {

    manifest: null,

    geojson: null,

    downloads: {},

    buttons: {},

    initialized: false,

    bound: false,

    /* ======================================================
       Init
    ====================================================== */

    init() {

        this.buttons = {

            gpx: document.getElementById("btn-download-gpx"),

            kml: document.getElementById("btn-download-kml")

        };

        this.initialized = true;

        this.bindEvents();

    },

    /* ======================================================
       Bind
    ====================================================== */

    bindEvents() {

        if (this.bound) return;

        this.bound = true;

        [["gpx", this.buttons.gpx], ["kml", this.buttons.kml]].forEach(([type, button]) => {

            if (!button) return;

            const handler = (event) => this.onGenerateClick(event, type);

            button.addEventListener("click", handler);

            button.addEventListener("keydown", (event) => {

                if (event.key === "Enter" || event.key === " ") handler(event);

            });

        });

    },

    /* ======================================================
       Data
    ====================================================== */

    setManifest(manifest) {

        if (!this.initialized) this.init();

        this.manifest = manifest || {};

        this.downloads = this.manifest.downloads || {};

    },

    setGeojson(geojson) {

        this.geojson = geojson || null;

    },

    canGenerate() {

        return !!(this.geojson && window.AlamExport);

    },

    meta() {

        const track = (this.manifest && this.manifest.track) || {};

        return {

            name: track.name || document.title || "Jalur",

            slug:
                (this.manifest && this.manifest.id) ||
                (window.CONFIG && window.CONFIG.route) ||
                "jalur"

        };

    },

    /* ======================================================
       Generate & Save
    ====================================================== */

    onGenerateClick(event, type) {

        /* Tanpa GeoJSON: biarkan tautan dari manifest bekerja. */

        if (!this.canGenerate()) return;

        event.preventDefault();

        const meta = this.meta();

        try {

            const text =
                type === "gpx"
                    ? window.AlamExport.buildGpx(this.geojson, meta)
                    : window.AlamExport.buildKml(this.geojson, meta);

            this.saveFile(
                text,
                window.AlamExport.fileName(meta, type),
                type === "gpx"
                    ? "application/gpx+xml"
                    : "application/vnd.google-earth.kml+xml"
            );

        } catch (err) {

            console.error("Gagal membuat file unduhan:", err);

        }

    },

    saveFile(text, filename, mime) {

        const blob = new Blob([text], { type: `${mime};charset=utf-8` });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;

        a.download = filename;

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 4000);

    },

    /* ======================================================
       Update
    ====================================================== */

    update() {

        const canGenerate = this.canGenerate();

        [["gpx", this.downloads.gpx], ["kml", this.downloads.kml]].forEach(([type, url]) => {

            if (canGenerate) {

                this.markGenerated(type);

            } else {

                this.updateButton(type, url);

            }

        });

    },

    /* Tombol dibuat dari GeoJSON: tautan dummy + aksi klik. */

    markGenerated(type) {

        const button = this.buttons[type];

        if (!button) return;

        button.href = "#";

        button.removeAttribute("target");

        button.removeAttribute("rel");

        button.setAttribute("role", "button");

        button.setAttribute("aria-disabled", "false");

        button.setAttribute("title", "Dibuat dari track.geojson di browser");

        button.classList.remove("disabled");

    },

    /* Tautan langsung dari manifest.downloads. */

    updateButton(type, url) {

        const button = this.buttons[type];

        if (!button) return;

        button.removeAttribute("role");

        if (!url) {

            button.removeAttribute("href");

            button.classList.add("disabled");

            button.setAttribute("aria-disabled", "true");

            return;

        }

        button.href = url;

        button.target = "_blank";

        button.rel = "noopener";

        button.classList.remove("disabled");

        button.removeAttribute("aria-disabled");

    },

    /* ======================================================
       Disable All
    ====================================================== */

    disableAll() {

        Object.keys(this.buttons).forEach((type) => {

            const button = this.buttons[type];

            if (!button) return;

            button.removeAttribute("href");

            button.classList.add("disabled");

            button.setAttribute("aria-disabled", "true");

        });

    },

    /* ======================================================
       Refresh
    ====================================================== */

    refresh(manifest, geojson) {

        this.setManifest(manifest);

        this.setGeojson(geojson);

        this.update();

    },

    /* ======================================================
       Destroy
    ====================================================== */

    destroy() {

        this.disableAll();

        this.manifest = null;

        this.geojson = null;

        this.downloads = {};

        this.buttons = {};

        this.initialized = false;

    }

};


/* ==========================================================
   Export
========================================================== */

window.DownloadManager = DownloadManager;


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        DownloadManager.init();

    }

);


/* ==========================================================
   Ready
========================================================== */