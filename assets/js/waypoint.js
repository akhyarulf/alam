/* ==========================================================
   Alam Viewer v1.0
   waypoint.js

   Waypoint Sidebar Manager
   -- render breakdown durasi per ruas (leg) antar waypoint,
      bukan cuma daftar titik.
========================================================== */

"use strict";

// Harus sinkron sama waypoint/category.py di backend
const POI_META = {
    poi_air: { icon: "💧", label: "Sumber Air" },
    poi_petilasan: { icon: "⛩️", label: "Petilasan/Sakral" },
    poi_kawah: { icon: "🌋", label: "Kawah" },
    poi_warung: { icon: "🏪", label: "Warung/Shelter" },
    poi_camp: { icon: "🏕️", label: "Camp Ground" },
    poi_bahaya: { icon: "⚠️", label: "Titik Bahaya" },
    poi_view: { icon: "📷", label: "Spot View" },
    poi_parkir: { icon: "🅿️", label: "Basecamp/Parkiran" },
    poi_lain: { icon: "📌", label: "POI" },
};const WaypointManager = {

    container: null,

    poiContainer: null,

    points: [],

    legs: [],

    pois: [],

    /* Di layar kecil hanya 6 ruas pertama yang ditampilkan,
       sisanya lewat tombol "lihat semua". */
    LEGS_PREVIEW: 6,

    legsExpanded: false,

    legItems: [],

    initialized: false,

    /* ======================================================
       Init
    ====================================================== */

    init() {

        this.container = document.getElementById("waypoint-list");
        this.poiContainer = document.getElementById("poi-list");

        this.initialized = true;

    },

    /* ======================================================
       Set Data
    ====================================================== */

    setData(points = [], legs = [], pois = []) {

        if (!this.initialized) {
            this.init();
        }

        this.points = Array.isArray(points) ? points : [];
        this.legs = Array.isArray(legs) ? legs : [];
        this.pois = Array.isArray(pois) ? pois : [];

    },

    /* ======================================================
       Render
    ====================================================== */render() {

        if (!this.container) return;

        this.container.innerHTML = "";

        if (this.legs.length === 0) {

            this.container.innerHTML = `
                <div class="empty">
                    Belum ada waypoint.
                </div>
            `;

        } else {

            this.legItems = [];

            this.legs.forEach((leg, index) => {

                const item = this.createLegItem(leg, index);

                if (index >= this.LEGS_PREVIEW && !this.legsExpanded) item.classList.add("is-hidden");

                this.legItems.push(item);

                this.container.appendChild(item);

            });

            if (this.legs.length > this.LEGS_PREVIEW) {

                this.container.appendChild(this.createMoreButton());

            }

        }

        this.renderPois();

    },

    /* ======================================================
       Tombol "lihat semua ruas"
    ====================================================== */

    createMoreButton() {

        const button = document.createElement("button");

        button.type = "button";

        button.className = "waypoint-more";

        button.setAttribute("aria-expanded", "false");

        this.updateMoreButton(button);

        button.addEventListener("click", () => {

            this.legsExpanded = !this.legsExpanded;

            /* Pakai indeks, bukan query .is-hidden, supaya tombol
               bisa dipakai bolak-balik (buka -> tutup lagi). */
            (this.legItems || []).forEach((el, i) => {

                el.classList.toggle("is-hidden", !this.legsExpanded && i >= this.LEGS_PREVIEW);

            });

            this.updateMoreButton(button);

        });

        return button;

    },

    updateMoreButton(button) {

        const total = this.legs.length;

        button.innerHTML = this.legsExpanded

            ? `Tampilkan lebih sedikit <i class="fa-solid fa-chevron-up"></i>`

            : `Lihat semua ${total} ruas <i class="fa-solid fa-chevron-down"></i>`;

    },

    /* ======================================================
       Render POI (terpisah dari breakdown Pos Jalur)
    ====================================================== */renderPois() {

        if (!this.poiContainer) return;

        this.poiContainer.innerHTML = "";

        /* Card POI disembunyikan kalau memang tidak ada POI,
           supaya tidak ada kotak kosong di sidebar. */
        this.togglePoiCard();

        if (this.pois.length === 0) {

            this.poiContainer.innerHTML = `
                <div class="empty">
                    Tidak ada POI di jalur ini.
                </div>
            `;

            return;

        }

        this.pois.forEach((poi, index) => {
            this.poiContainer.appendChild(this.createPoiItem(poi, index));
        });

    },

    togglePoiCard() {

        const card = this.poiContainer && this.poiContainer.closest(".card");

        if (!card) return;

        card.classList.toggle("hidden", this.pois.length === 0);

    },

    createPoiItem(poi, index) {

        const item = document.createElement("div");
        item.className = "waypoint poi-item";

        const meta = POI_META[poi.category] || POI_META.poi_lain;

        const ele =
            poi.ele !== undefined && poi.ele !== null && poi.ele !== "-"
                ? `${Math.round(poi.ele)} m`
                : "-";

        const distance =
            poi.distance_km !== undefined && poi.distance_km !== null
                ? `${Number(poi.distance_km).toFixed(2)} km dari start`
                : "-";

        item.innerHTML = `
            <div class="waypoint-dot poi-dot">${meta.icon}</div>
            <div class="waypoint-content">
                <div class="waypoint-title">
                    ${poi.name}
                </div>
                <div class="waypoint-subtitle">
                    ${meta.label} &nbsp;&bull;&nbsp; ${ele} &nbsp;&bull;&nbsp; ${distance}
                </div>
            </div>
        `;

        item.addEventListener("click", () => {

            if (
                window.MapViewer &&
                typeof MapViewer.flyTo === "function"
            ) {

                const mapEl = document.getElementById("map");
                if (mapEl && typeof mapEl.scrollIntoView === "function") {
                    mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }

                setTimeout(() => {
                    MapViewer.flyTo(poi.lat, poi.lng, 16);
                }, 300);

            }

        });

        return item;

    },

    /* ======================================================
       Cari koordinat waypoint berdasar nama (buat fly-to)
    ====================================================== */

    findPoint(name) {
        return this.points.find(p => (p.name || p.title) === name);
    },

    /* ======================================================
       Create Leg Item
    ====================================================== */

    createLegItem(leg, index) {

        const item = document.createElement("div");
        item.className = "waypoint";

        const duration =
            window.Utils
                ? `${Utils.formatDuration(leg.duration_minutes_low)} - ${Utils.formatDuration(leg.duration_minutes_high)}`
                : `${leg.duration_minutes_low} - ${leg.duration_minutes_high} menit`;

        const distance =
            leg.distance_km !== undefined && leg.distance_km !== null
                ? `${Number(leg.distance_km).toFixed(2)} km`
                : "-";

        const fromPoint = this.findPoint(leg.from);
        const toPoint = this.findPoint(leg.to);

        const fromLabel = this.labelWithElevation(leg.from, fromPoint);
        const toLabel = this.labelWithElevation(leg.to, toPoint);

        item.innerHTML = `
            <div class="waypoint-dot"></div>
            <div class="waypoint-content">
                <div class="waypoint-title">
                    ${fromLabel} &rarr; ${toLabel}
                </div>
                <div class="waypoint-subtitle">
                    ${distance} &nbsp;&bull;&nbsp; ${duration}
                </div>
            </div>
        `;

        item.addEventListener("click", () => {
            this.focus(leg, index);
        });

        return item;

    },

    /* ======================================================
       Nama + elevasi, misal "Pos 1 (2199 m)"
    ====================================================== */

    labelWithElevation(name, point) {

        const ele = point ? (point.ele ?? point.elevation) : null;

        if (ele === null || ele === undefined || ele === "-") {
            return name;
        }

        return `${name} (${Math.round(ele)} m)`;

    },

    /* ======================================================
       Focus (fly-to titik tujuan leg ini)
    ====================================================== */

    focus(leg, index) {

        this.highlight(index);

        const target = this.findPoint(leg.to);

        const mapEl = document.getElementById("map");

        if (mapEl && typeof mapEl.scrollIntoView === "function") {
            mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        if (
            target &&
            window.MapViewer &&
            typeof MapViewer.flyTo === "function"
        ) {
            // kasih jeda dikit biar scroll jalan duluan baru flyTo
            setTimeout(() => {
                MapViewer.flyTo(target.lat, target.lng, 16);
            }, 300);
        }

    },

    /* ======================================================
       Highlight Active Item
    ====================================================== */

    highlight(index) {

        if (!this.container) return;

        this.container
            .querySelectorAll(".waypoint")
            .forEach(el => el.classList.remove("active"));

        const active = this.container.children[index];

        if (active && active.classList.contains("waypoint")) {
            active.classList.add("active");
        }

    },

    /* ======================================================
       Refresh
    ====================================================== */

    refresh(points, legs, pois) {

        this.setData(points, legs, pois);

        this.render();

    },

    /* ======================================================
       Clear
    ====================================================== */

    clear() {

        this.points = [];
        this.legs = [];
        this.pois = [];

        if (this.container) {

            this.container.innerHTML = `
                <div class="empty">
                    Belum ada waypoint.
                </div>
            `;

        }

        if (this.poiContainer) {

            this.poiContainer.innerHTML = `
                <div class="empty">
                    Tidak ada POI di jalur ini.
                </div>
            `;

            this.togglePoiCard();

        }

    },

    /* ======================================================
       Count
    ====================================================== */

    count() {
        return this.legs.length;
    },

    /* ======================================================
       Destroy
    ====================================================== */

    destroy() {

        this.clear();

        this.container = null;

        this.initialized = false;

    }

};


/* ==========================================================
   Export
========================================================== */

window.WaypointManager = WaypointManager;


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    WaypointManager.init();
});



