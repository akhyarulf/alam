/* ==========================================================
   Alam Viewer v1.0
   map.js

   Leaflet Map Module
========================================================== */

"use strict";

const MapViewer = {

    map: null,

    layers: {},

    currentLayer: null,

    trackLayer: null,

    waypointLayer: null,

    startMarker: null,

    finishMarker: null,

    bounds: null,

    initialized: false,

    /* ======================================================
       Init
    ====================================================== */

    init(center = [-7.9, 112.48], zoom = 13) {

        if (this.initialized) {

            return this.map;

        }

        this.map = L.map("map", {

            zoomControl: true,

            attributionControl: true,

        });

        this.createBaseLayers();

        this.currentLayer = this.layers.osm;

        this.currentLayer.addTo(this.map);

        this.map.setView(center, zoom);

        this.initialized = true;


        return this.map;

    },

    /* ======================================================
       Basemap
    ====================================================== */

    createBaseLayers() {

        this.layers.osm = L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {

                maxZoom: 19,

                attribution: "&copy; OpenStreetMap"

            }

        );

        this.layers.satellite = L.tileLayer(

            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

            {

                maxZoom: 19,

                attribution: "&copy; Esri"

            }

        );

        this.layers.topo = L.tileLayer(

            "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",

            {

                maxZoom: 17,

                attribution: "&copy; OpenTopoMap"

            }

        );

    },

    /* ======================================================
       Change Basemap
    ====================================================== */

    setBasemap(name) {

        if (!this.layers[name]) {

            return;

        }

        if (this.currentLayer) {

            this.map.removeLayer(

                this.currentLayer

            );

        }

        this.currentLayer = this.layers[name];

        this.currentLayer.addTo(this.map);

    },

    /* ======================================================
       Clear Track
    ====================================================== */

    clearTrack() {

        if (this.trackLayer) {

            this.map.removeLayer(

                this.trackLayer

            );

            this.trackLayer = null;

        }

        if (this.startMarker) {

            this.map.removeLayer(

                this.startMarker

            );

        }

        if (this.finishMarker) {

            this.map.removeLayer(

                this.finishMarker

            );

        }

    },
	
    /* ======================================================
       Load GeoJSON
    ====================================================== */

    loadGeoJSON(geojson) {

        this.clearTrack();

        if (!geojson) {

            console.warn("GeoJSON kosong.");

            return;

        }

        this.drawTrack(geojson);

    },

	/* ======================================================
	Load
	====================================================== */

	load(geojson, manifest = null) {

		this.loadGeoJSON(geojson);

		this.drawWaypoints(this.extractWaypoints(geojson));

	},

	/* ======================================================
	   Extract Waypoints From GeoJSON
	====================================================== */

	extractWaypoints(geojson) {

		if (
			!geojson ||
			!Array.isArray(geojson.features)
		) {
			return [];
		}

		return geojson.features.filter(

			feature => feature.geometry?.type === "Point"

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
					feature.properties?.ele ??
					feature.properties?.elevation ??
					"-",

				distance_km:
					feature.properties?.distance_km,

				locked:
					feature.properties?.locked || false

			})

		);

	},

    /* ======================================================
       Draw Track
    ====================================================== */

    drawTrack(geojson) {

        this.trackLayer = L.geoJSON(

            geojson,

            {

                style: feature => ({

                    color: "#5a7562",

                    weight: 5,

                    opacity: 0.95,

                    lineJoin: "round",

                    lineCap: "round"

                }),

                onEachFeature: (feature, layer) => {

                    const props = feature.properties || {};

                    const title =
                        props.name ||
                        props.route ||
                        "Track";

                    layer.bindPopup(`

                        <div class="map-popup">

                            <strong>${title}</strong>

                        </div>

                    `);

                }

            }

        );

        this.trackLayer.addTo(this.map);

        this.bounds = this.trackLayer.getBounds();

        if (this.bounds.isValid()) {

            this.map.fitBounds(

                this.bounds,

                {

                    padding: [40, 40]

                }

            );

        }


    },

    /* ======================================================
       Draw Start Marker
    ====================================================== */

    drawStart(latlng) {

        if (!latlng) return;

        if (this.startMarker) {

            this.map.removeLayer(

                this.startMarker

            );

        }

        this.startMarker = L.marker(

            latlng,

            {

                title: "Start"

            }

        )

        .bindPopup("<b>Start</b>")

        .addTo(this.map);

    },

    /* ======================================================
       Draw Finish Marker
    ====================================================== */

    drawFinish(latlng) {

        if (!latlng) return;

        if (this.finishMarker) {

            this.map.removeLayer(

                this.finishMarker

            );

        }

        this.finishMarker = L.marker(

            latlng,

            {

                title: "Finish"

            }

        )

        .bindPopup("<b>Finish</b>")

        .addTo(this.map);

    },
	
    /* ======================================================
       Waypoint Layer
    ====================================================== */

    createWaypointLayer() {

        if (this.waypointLayer) {

            this.map.removeLayer(

                this.waypointLayer

            );

        }

        this.waypointLayer = L.layerGroup();

        this.waypointLayer.addTo(this.map);

    },

    /* ======================================================
       Clear Waypoints
    ====================================================== */

    clearWaypoints() {

        if (!this.waypointLayer) return;

        this.waypointLayer.clearLayers();

    },

    /* ======================================================
       Draw Waypoints
    ====================================================== */

    drawWaypoints(waypoints = []) {

        if (!this.waypointLayer) {

            this.createWaypointLayer();

        }

        this.clearWaypoints();

        if (!Array.isArray(waypoints)) {

            return;

        }

        waypoints.forEach((wp, index) => {

            this.drawWaypoint(wp, index);

        });

    },

    /* ======================================================
       Draw Single Waypoint
    ====================================================== */

    drawWaypoint(wp, index = 0) {

        if (!wp) return;

        const lat = wp.lat ?? wp.latitude;

        const lng = wp.lng ?? wp.lon ?? wp.longitude;

        if (lat == null || lng == null) {

            return;

        }

        const marker = L.circleMarker(

            [lat, lng],

            {

                radius: 6,

                color: "#ffffff",

                weight: 2,

                fillColor: "#f59e0b",

                fillOpacity: 1

            }

        );

        const title =

            wp.name ||

            wp.title ||

            `Waypoint ${index + 1}`;

        const ele =

            wp.ele ??

            wp.elevation ??

            "-";

        marker.bindPopup(`

            <div class="map-popup">

                <strong>${title}</strong>

                <br>

                Elevasi : ${ele} m

            </div>

        `);

        marker.on("click", () => {

            this.flyTo(lat, lng, 16);

        });

        marker.addTo(

            this.waypointLayer

        );

    },

    /* ======================================================
       Fly To
    ====================================================== */

    flyTo(lat, lng, zoom = 16) {

        if (!this.map) return;

        this.map.flyTo(

            [lat, lng],

            zoom,

            {

                animate: true,

                duration: 1.2

            }

        );

    },

    /* ======================================================
       Zoom To Bounds
    ====================================================== */

    fitTrack() {

        if (!this.bounds) return;

        this.map.fitBounds(

            this.bounds,

            {

                padding: [40, 40]

            }

        );

    },
	
    /* ======================================================
       Resize Map
    ====================================================== */

    resize() {

        if (!this.map) return;

        setTimeout(() => {

            this.map.invalidateSize();

        }, 200);

    },

    /* ======================================================
       Toggle Basemap
    ====================================================== */

    toggleBasemap() {

        const order = [

            "osm",

            "satellite",

            "topo"

        ];

        let current = order.findIndex(

            name => this.currentLayer === this.layers[name]

        );

        current++;

        if (current >= order.length) {

            current = 0;

        }

        this.setBasemap(

            order[current]

        );

    },

    /* ======================================================
       Fullscreen
    ====================================================== */

    fullscreen() {

        const mapElement = document.getElementById("map");

        if (!mapElement) return;

        if (!document.fullscreenElement) {

            Utils.openFullscreen(

                mapElement

            );

        } else {

            Utils.closeFullscreen();

        }

        setTimeout(() => {

            this.resize();

        }, 400);

    },

    /* ======================================================
       Destroy
    ====================================================== */

    destroy() {

        if (!this.map) return;

        this.map.remove();

        this.map = null;

        this.trackLayer = null;

        this.waypointLayer = null;

        this.startMarker = null;

        this.finishMarker = null;

        this.bounds = null;

        this.initialized = false;

    },

    /* ======================================================
       Getter
    ====================================================== */

    getMap() {

        return this.map;

    },

    getTrackLayer() {

        return this.trackLayer;

    },

    getBounds() {

        return this.bounds;

    }

};


/* ==========================================================
   Export
========================================================== */

window.MapViewer = MapViewer;


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        MapViewer.init();

        const fitBtn = document.getElementById(

            "btn-fit"

        );

        if (fitBtn) {

            fitBtn.addEventListener(

                "click",

                () => MapViewer.fitTrack()

            );

        }

        const baseBtn = document.getElementById(

            "btn-basemap"

        );

        if (baseBtn) {

            baseBtn.addEventListener(

                "click",

                () => MapViewer.toggleBasemap()

            );

        }

        const fullscreenBtn = document.getElementById(

            "btn-fullscreen"

        );

        if (fullscreenBtn) {

            fullscreenBtn.addEventListener(

                "click",

                () => MapViewer.fullscreen()

            );

        }

        window.addEventListener(

            "resize",

            () => MapViewer.resize()

        );

    }

);


/* ==========================================================
   Ready
========================================================== */

