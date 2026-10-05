/* ==========================================================
   Alam Viewer v1.0
   stats.js

   Statistics & Information Module
========================================================== */

"use strict";

const Stats = {

    manifest: null,

    stats: null,

    track: null,

    initialized: false,

    elements: {},

    /* ======================================================
       Init
    ====================================================== */

    init() {

        this.elements = {

            title: document.getElementById("track-title"),

            routeTitle: document.getElementById("track-route"),

            mountain: document.getElementById("mountain"),

            route: document.getElementById("route"),

			distanceInfo: document.getElementById("distance-info"),

			ascentDurationInfo: document.getElementById("ascent-duration-info"),

			descentDurationInfo: document.getElementById("descent-duration-info"),

			gainInfo: document.getElementById("gain-info"),

			lossInfo: document.getElementById("loss-info"),
			
			highestInfo: document.getElementById("highest-info"),

			lowestInfo: document.getElementById("lowest-info"),

			directionBtn: document.getElementById("btn-direction-info"),

			directionPanel: document.getElementById("direction-info-panel")

        };

        if (this.elements.directionBtn) {

            this.elements.directionBtn.addEventListener("click", () => {

                this.toggleDirectionPanel();

            });

        }

        this.initialized = true;

    },

    /* ======================================================
       Set Manifest
    ====================================================== */

    setManifest(manifest, geojson) {

        if (!this.initialized) {

            this.init();

        }

        this.manifest = manifest || {};

        this.stats = this.manifest.stats || {};

        this.track = this.manifest.track || {};

        this.geojson = geojson || null;

        this.climbCache = undefined;

    },

    /* ======================================================
       Update Header
    ====================================================== */

    updateHeader() {

        Utils.setText(

            this.elements.title,

            this.track.name || "-"

        );

        Utils.setText(

            this.elements.routeTitle,

            `${this.track.mountain || "-"} • ${this.track.route || "-"}`

        );

        /* Kalau nama jalur sudah memuat nama gunung + jalur,
           subjudul di bawahnya cuma pengulangan -> disembunyikan. */
        if (this.elements.routeTitle) {

            const name = String(this.track.name || "").toLowerCase();

            const mountain = String(this.track.mountain || "").toLowerCase();

            const route = String(this.track.route || "").toLowerCase();

            const redundant = Boolean(mountain && route && name.includes(mountain) && name.includes(route));

            this.elements.routeTitle.classList.toggle("is-redundant", redundant);

        }

    },

    /* ======================================================
       Waktu naik / turun
       ======================================================
       Sumber: stats.ascent/descent_duration_minutes_* di
       manifest. Kalau field itu tidak ada (jalur hasil upload
       browser), dihitung dari track.geojson dengan formula
       Naismith yang sama seperti upload.html.
    ====================================================== */

    climbData() {

        const fromManifest = {

            ascent_low: this.stats.ascent_duration_minutes_low,

            ascent_high: this.stats.ascent_duration_minutes_high,

            descent_low: this.stats.descent_duration_minutes_low,

            descent_high: this.stats.descent_duration_minutes_high

        };

        if (Object.keys(fromManifest).every((k) => Number.isFinite(fromManifest[k]))) {

            return fromManifest;

        }

        if (this.climbCache === undefined) {

            const line = this.geojson && (this.geojson.features || []).find((f) => f.geometry && f.geometry.type === "LineString");

            this.climbCache = line && window.Utils && typeof Utils.climbTimes === "function"

                ? Utils.climbTimes(line.geometry.coordinates)

                : null;

        }

        return this.climbCache;

    },

    formatClimbTime(kind) {

        const data = this.climbData();

        if (!data) return "Data tidak tersedia";

        let low = data[`${kind}_low`];

        let high = data[`${kind}_high`];

        /* Kalau jalur punya daftar ruas, Total Naik diambil dari
           jumlah ruas supaya angka di sidebar dan angka total
           selalu sama (tidak berbeda 15-30 menit). */
        if (kind === "ascent" && Array.isArray(this.manifest.legs) && this.manifest.legs.length) {

            const legs = this.manifest.legs;

            low = legs.reduce((s, l) => s + (Number(l.duration_minutes_low) || 0), 0);

            high = legs.reduce((s, l) => s + (Number(l.duration_minutes_high) || 0), 0);

            if (low > 0) return `${Utils.formatDuration(low)} - ${Utils.formatDuration(high)}`;

        }

        return `${Utils.formatDuration(low)} - ${Utils.formatDuration(high)}`;

    },

    /* ======================================================
       Update Track Info
    ====================================================== */

    updateInfo() {

        Utils.setText(

            this.elements.mountain,

            this.track.mountain || "-"

        );

        Utils.setText(

            this.elements.route,

            this.track.route || "-"

        );

		Utils.setText(

			this.elements.distanceInfo,

			Utils.formatDistance(

				this.stats.distance_km || 0

			)

		);Utils.setText(

            this.elements.ascentDurationInfo,

            this.formatClimbTime("ascent")

        );

        Utils.setText(

            this.elements.descentDurationInfo,

            this.formatClimbTime("descent")

        );

		Utils.setText(

			this.elements.gainInfo,

			Utils.formatElevation(

				this.stats.gain || 0

			)

		);

		Utils.setText(

			this.elements.lossInfo,

			Utils.formatElevation(

				this.stats.loss || 0

			)

		);

		Utils.setText(

			this.elements.highestInfo,

			Utils.formatElevation(

				this.stats.highest || 0

			)

		);

		Utils.setText(

			this.elements.lowestInfo,

			Utils.formatElevation(

				this.stats.lowest || 0

			)

		);
    },

    /* ======================================================
       Direction Panel (naik / turun / campuran)
    ====================================================== */

    directionText() {

        const map = {

            ascent: "Jalur ini didominasi tanjakan — cocok dibaca sebagai rute NAIK (basecamp ke puncak).",

            descent: "Jalur ini didominasi turunan — cocok dibaca sebagai rute TURUN (puncak ke basecamp).",

            mixed: "Jalur ini naik-turun cukup seimbang — biasanya rute pulang-pergi (PP) atau loop."

        };

        return map[this.stats.direction] || "Arah jalur belum bisa ditentukan.";

    },

    toggleDirectionPanel() {

        if (!this.elements.directionPanel) return;

        const panel = this.elements.directionPanel;

        const willShow = panel.classList.contains("hidden");

        if (willShow) {

            panel.textContent = this.directionText();

        }

        panel.classList.toggle("hidden", !willShow);

        const button = this.elements.directionBtn;

        if (button) {

            button.setAttribute("aria-expanded", String(willShow));

        }

    },

    /* ======================================================
       Update Summary
    ====================================================== */

    updateSummary() {

        document.title =

            this.track.name ||

            "Alam Viewer";

        const description = document.querySelector(

            'meta[name="description"]'

        );

        if (description) {

            description.setAttribute(

                "content",

                `${this.track.name || ""} • ${this.track.mountain || ""} • ${Utils.formatDistance(this.stats.distance_km || 0)}`

            );

        }

    },

    /* ======================================================
       Update All
    ====================================================== */

    update() {

        this.updateHeader();

        this.updateInfo();

        this.updateSummary();

    },
	
    /* ======================================================
       Clear
    ====================================================== */

    clear() {

        this.manifest = null;

        this.stats = null;

        this.track = null;

        Object.entries(this.elements).forEach(([key, element]) => {

            if (!element) return;

            if (key === "directionBtn") return;

            if (key === "directionPanel") {
                element.classList.add("hidden");
                element.textContent = "";
                return;
            }

            element.textContent = "-";

        });

    },

    /* ======================================================
       Refresh
    ====================================================== */

    refresh(manifest, geojson) {

        this.setManifest(manifest, geojson);

        this.update();

    },

    /* ======================================================
       Getter
    ====================================================== */

    getManifest() {

        return this.manifest;

    },

    getStats() {

        return this.stats;

    },

    getTrack() {

        return this.track;

    },

    /* ======================================================
       Destroy
    ====================================================== */

    destroy() {

        this.clear();

        this.elements = {};

        this.initialized = false;

    }

};


/* ==========================================================
   Export
========================================================== */

window.Stats = Stats;


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        Stats.init();

    }

);


/* ==========================================================
   Ready
========================================================== */

