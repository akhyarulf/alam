/* ==========================================================
   Alam Viewer v1.0
   app.js

   Main Application
========================================================== */

"use strict";

const App = {

    manifest: null,

    geojson: null,

    routeId: null,

    initialized: false,

    /* ======================================================
       Init
    ====================================================== */

    async init() {

        try {

            Loader.show();

            this.routeId = this.detectRoute();


            await this.loadManifest();

            await this.loadTrack();

            this.initializeModules();

            this.render();

            this.initialized = true;

            Loader.hide();


        }

        catch (error) {

            console.error(error);

            Loader.hide();

            this.showError(error);

        }

    },

    /* ======================================================
       Detect Route
    ====================================================== */

    detectRoute() {

        /*

        PRIORITAS

        1. ?route=lawu-via-cemoro-sewu

        2. window.ROUTE_ID

        3. config.js

        */

        const params = new URLSearchParams(

            window.location.search

        );

        if (

            params.has("route")

        ) {

            return params.get("route");

        }

        if (

            window.ROUTE_ID

        ) {

            return window.ROUTE_ID;

        }

        if (

            window.CONFIG &&

            CONFIG.route

        ) {

            return CONFIG.route;

        }

        return "default";

    },

	/* ======================================================
	Manifest URL
	====================================================== */

	getManifestURLs() {

		const remote = `https://raw.githubusercontent.com/akhyarulf/alam/main/data/${this.routeId}/manifest.json`;

		const list = [

			...(window.CONFIG ? [CONFIG.manifestURL, CONFIG.rawManifestURL] : []),

			remote

		];

		/* Buang duplikat & kosong supaya tidak fetch dua kali ke URL sama. */

		return [...new Set(list.filter(Boolean))];

	},

	/* ======================================================
	Track URL
	====================================================== */

	getTrackURLs() {

		const remote = `https://raw.githubusercontent.com/akhyarulf/alam/main/data/${this.routeId}/track.geojson`;

		const list = [

			...(window.CONFIG ? [CONFIG.geojsonURL, CONFIG.rawGeojsonURL] : []),

			remote

		];

		return [...new Set(list.filter(Boolean))];

	},
	
    /* ======================================================
       Load Manifest
    ====================================================== */

    async loadManifest() {

        const urls = this.getManifestURLs();

        let response = null;

        let lastStatus = 0;

        for (const url of urls) {

            try {

                response = await fetch(url, { cache: "no-cache" });

                if (response.ok) break;

                lastStatus = response.status;

            } catch (err) {

                /* Lanjut ke kandidat berikutnya. */

            }

        }

        if (!response || !response.ok) {

            throw new Error(

                `Manifest tidak ditemukan (${lastStatus || "tidak ada sumber yang bisa diakses"})`

            );

        }

        this.manifest = await response.json();

        if (

            !this.manifest ||

            !this.manifest.track

        ) {

            throw new Error(

                "Manifest.json tidak valid."

            );

        }

    },

    /* ======================================================
       Load GeoJSON
    ====================================================== */

    async loadTrack() {

        const file = (

            this.manifest &&

            this.manifest.viewer &&

            this.manifest.viewer.geojson

        )

            ? this.manifest.viewer.geojson

            : "track.geojson";

        let response = null;

        let lastStatus = 0;

        for (const base of this.getTrackURLs()) {

            const url = base.replace("track.geojson", file);

            try {

                response = await fetch(url, { cache: "no-cache" });

                if (response.ok) break;

                lastStatus = response.status;

            } catch (err) {

                /* Lanjut ke kandidat berikutnya. */

            }

        }

        if (!response || !response.ok) {

            throw new Error(

                `Track GeoJSON tidak ditemukan (${lastStatus || "tidak ada sumber yang bisa diakses"})`

            );

        }

        this.geojson = await response.json();

        if (

            !this.geojson ||

            this.geojson.type !== "FeatureCollection"

        ) {

            throw new Error(

                "GeoJSON tidak valid."

            );

        }

    },

    /* ======================================================
       Fetch JSON Helper
    ====================================================== */

    async fetchJSON(url) {

        const response = await fetch(url, {

            cache: "no-cache"

        });

        if (!response.ok) {

            throw new Error(

                `HTTP ${response.status}`

            );

        }

        return await response.json();

    },
	
    /* ======================================================
       Initialize Modules
    ====================================================== */

    initializeModules() {

        /* Loader */

        if (window.Loader) {

            Loader.update(
				
				"Menyiapkan Viewer...",
				
				"Menginisialisasi modul..."
		
			);

        }

        /* Theme */

        if (

            window.Theme &&

            typeof Theme.init === "function"

        ) {

            Theme.init();

        }

        /* Map */

        if (

            window.MapViewer &&

            typeof MapViewer.init === "function"

        ) {

            MapViewer.init(

                "map"

            );

        }

        /* Chart */

        if (

            window.ElevationChart &&

            typeof ElevationChart.init === "function"

        ) {

            ElevationChart.init();

            if (typeof ElevationChart.initToggle === "function") {

                ElevationChart.initToggle();

            }

        }

        /* Stats */

        if (

            window.Stats &&

            typeof Stats.init === "function"

        ) {

            Stats.init();

        }

        /* Download */

        if (

            window.DownloadManager &&

            typeof DownloadManager.init === "function"

        ) {

            DownloadManager.init();

        }

        /* Waypoint */

        if (

            window.WaypointManager &&

            typeof WaypointManager.init === "function"

        ) {

            WaypointManager.init();

        }

    },

    /* ======================================================
       Render Modules
    ====================================================== */

    render() {

        /* Statistik */

        if (window.Stats) {

            Stats.refresh(

                this.manifest,

                this.geojson

            );

        }

        /* Download */

        if (window.DownloadManager) {

            DownloadManager.refresh(

                this.manifest,

                this.geojson

            );

        }

        /* Map */

        if (window.MapViewer) {

            MapViewer.load(

                this.geojson,

                this.manifest

            );

        }

        /* Elevation */

        if (

            window.ElevationChart &&

            this.geojson.features.length

        ) {

            ElevationChart.update(

                this.geojson.features[0]

            );

        }

        /* Waypoint */

        if (

            window.WaypointManager

        ) {

            WaypointManager.refresh(

                this.extractWaypoints(),

                this.manifest?.legs || [],

                this.extractPois()

            );

        }

    },

    /* ======================================================
       Extract Waypoints
    ====================================================== */

    extractWaypoints() {

        if (

            !this.geojson ||

            !this.geojson.features

        ) {

            return [];

        }

        return this.geojson.features.filter(

            feature =>

                feature.geometry?.type === "Point"

        ).map(

            feature => ({

                name:

                    feature.properties?.name ||

                    feature.properties?.title ||

                    "Waypoint",

                lat:

                    feature.geometry.coordinates[1],

                lng:

                    feature.geometry.coordinates[0],

                ele:

                    feature.properties?.ele ||

                    feature.properties?.elevation ||

                    "-",

                distance_km:

                    feature.properties?.distance_km,

                category:

                    feature.properties?.category || "pos",

                locked:

                    feature.properties?.locked || false

            })

        );

    },

    /* ======================================================
       Extract POIs (subset kategori poi_* buat kartu terpisah)
    ====================================================== */

    extractPois() {

        return this.extractWaypoints().filter(
            wp => (wp.category || "pos").startsWith("poi_")
        );

    },
	
    /* ======================================================
       Reload Current Route
    ====================================================== */

    async reload() {

        Loader.show();

        try {

            await this.loadManifest();

            await this.loadTrack();

            this.render();

            Loader.hide();

        }

        catch (error) {

            Loader.hide();

            this.showError(error);

        }

    },

    /* ======================================================
       Reset Viewer
    ====================================================== */

    reset() {

        this.manifest = null;

        this.geojson = null;

        this.initialized = false;

        if (window.MapViewer) {

            MapViewer.destroy();

        }

        if (window.ElevationChart) {

            ElevationChart.destroy();

        }

        if (window.Stats) {

            Stats.destroy();

        }

        if (window.DownloadManager) {

            DownloadManager.destroy();

        }

        if (window.WaypointManager) {

            WaypointManager.destroy();

        }

    },

    /* ======================================================
       Error Handler
    ====================================================== */

    showError(error) {

        console.error(error);

        const title = document.getElementById(

            "track-title"

        );

        const route = document.getElementById(

            "track-route"

        );

        if (title) {

            title.textContent =

                "Viewer Error";

        }

        if (route) {

            route.textContent =

                error.message ||

                "Terjadi kesalahan.";

        }

        /* Tampilkan panel error di halaman (bukan alert() yang
           memblokir artikel Blogger), isi dengan textContent
           supaya pesan error tidak jadi markup. */

        const box = document.getElementById(

            "error-box"

        );

        if (box) {

            box.classList.remove("hidden");

            box.textContent = "";

            const titleEl = document.createElement("div");

            titleEl.className = "error-title";

            titleEl.textContent = "⚠ Gagal memuat jalur";

            const messageEl = document.createElement("div");

            messageEl.className = "error-message";

            messageEl.textContent = error.message || String(error);

            box.appendChild(titleEl);

            box.appendChild(messageEl);

            if (typeof box.scrollIntoView === "function") {

                box.scrollIntoView({ behavior: "smooth", block: "start" });

            }

        }

    },

    /* ======================================================
       Route Changed
    ====================================================== */

    async changeRoute(routeId) {

        if (!routeId) return;

        this.routeId = routeId;

        await this.reload();

    },

	/* ======================================================
	   Visibility Change
	====================================================== */

	onVisibilityChange() {

		if (document.visibilityState !== "visible") {
			return;
		}

		if (
			window.ElevationChart &&
			typeof ElevationChart.resize === "function"
		) {

			ElevationChart.resize();

		}

		if (
			window.MapViewer &&
			typeof MapViewer.resize === "function"
		) {

			MapViewer.resize();

		}

	},
    /* ======================================================
       Getter
    ====================================================== */

    getManifest() {

        return this.manifest;

    },

    getGeoJSON() {

        return this.geojson;

    },

    getRouteID() {

        return this.routeId;

    }

};


/* ==========================================================
   Export
========================================================== */

window.App = App;


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        await App.init();

        const printBtn = document.getElementById("btn-print");

        if (printBtn) {
            printBtn.addEventListener("click", () => {
                window.print();
            });
        }

    }

);


/* ==========================================================
   Browser Navigation
========================================================== */

window.addEventListener(

    "popstate",

    async () => {

        const newRoute = App.detectRoute();

        if (

            newRoute !== App.getRouteID()

        ) {

            await App.changeRoute(

                newRoute

            );

        }

    }

);


/* ==========================================================
   Visibility
========================================================== */

document.addEventListener(

    "visibilitychange",

    () => {

        App.onVisibilityChange();

    }

);


/* ==========================================================
   Resize
========================================================== */

window.addEventListener(

    "resize",

    Utils.debounce(

        () => {

            if (

                window.MapViewer &&

                typeof MapViewer.invalidateSize === "function"

            ) {

                MapViewer.invalidateSize();

            }

            if (

                window.ElevationChart &&

                typeof ElevationChart.resize === "function"

            ) {

                ElevationChart.resize();

            }

        },

        250

    )

);


/* ==========================================================
   Global Error Handler
========================================================== */

window.addEventListener(

    "unhandledrejection",

    event => {

        console.error(

            "Unhandled Promise:",

            event.reason

        );

    }

);

window.addEventListener(

    "error",

    event => {

        console.error(

            "Application Error:",

            event.error || event.message

        );

    }

);


/* ==========================================================
   Ready
========================================================== */

