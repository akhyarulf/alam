/* ==========================================================
   Alam Viewer v1.0
   chart.js

   Elevation Profile
========================================================== */

"use strict";

const ElevationChart = {

    chart: null,

    canvas: null,

    ctx: null,

    labels: [],

    elevations: [],

    distances: [],

    initialized: false,

    /* ======================================================
       Init
    ====================================================== */

    init() {

        this.canvas = document.getElementById(

            "elevation-chart"

        );

        if (!this.canvas) {

            console.warn(

                "Elevation chart canvas not found."

            );

            return;

        }

        this.ctx = this.canvas.getContext("2d");

        this.initialized = true;

    },

    /* ======================================================
       Clear Data
    ====================================================== */

    clearData() {

        this.labels = [];

        this.elevations = [];

        this.distances = [];

    },

	/* ======================================================
	   Set Track
	====================================================== */

	setTrack(track) {

		this.clearData();

		if (!track) return;

		let coordinates = [];

		/* ------------------------------------------
		   FeatureCollection
		------------------------------------------ */

		if (track.type === "FeatureCollection") {

			const line = track.features.find(

				f =>

					f.geometry &&

					f.geometry.type === "LineString"

			);

			if (line) {

				coordinates = line.geometry.coordinates;

			}

		}

		/* ------------------------------------------
		   Feature
		------------------------------------------ */

		else if (

			track.type === "Feature" &&

			track.geometry?.type === "LineString"

		) {

			coordinates = track.geometry.coordinates;

		}

		/* ------------------------------------------
		   Legacy Geometry
		------------------------------------------ */

		else if (

			Array.isArray(track.geometry)

		) {

			coordinates = track.geometry;

		}

		/* ------------------------------------------
		   Parse Coordinates
		------------------------------------------ */

		let totalDistance = 0;

		coordinates.forEach((coord, index) => {

			const ele = coord[2] || 0;

			if (index > 0) {

				const prev = coordinates[index - 1];

				totalDistance += this.calculateDistance(
					prev[1], prev[0],
					coord[1], coord[0]
				);

			}

			const km = totalDistance / 1000;

			this.labels.push(km.toFixed(2));
			this.distances.push(km);
			this.elevations.push(ele);

		});

	},

    /* ======================================================
       Dataset
    ====================================================== */

    getDataset() {

        return [

            {

                label: "Elevation",

                data: this.elevations,

                borderColor: "#5a7562",

                backgroundColor:

                    "rgba(90,117,98,.18)",

                fill: true,

                tension: .25,

                borderWidth: 3,

                pointRadius: 0,

                pointHoverRadius: 4,

                pointHitRadius: 12

            }

        ];

    },
	
    /* ======================================================
       Chart Options
    ====================================================== */

    getOptions() {

        const dark = Theme.isDark();

        return {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {

                mode: "index",

                intersect: false

            },

            animation: {

                duration: 700

            },

            plugins: {

                legend: {

                    display: false

                },

                tooltip: {

                    backgroundColor: dark
                        ? "#1f1f1f"
                        : "#ffffff",

                    titleColor: dark
                        ? "#f8f9fa"
                        : "#232428",

                    bodyColor: dark
                        ? "#cbd5e1"
                        : "#36383a",

                    borderWidth: 1,

                    borderColor: dark
                        ? "#303136"
                        : "#dededf",

                    displayColors: false,

                    callbacks: {

                        title: items => {

                            return `${items[0].label} km`;

                        },

                        label: context => {

                            return `Elevasi : ${context.raw} m`;

                        }

                    }

                }

            },

            scales: {

                x: {

                    title: {

                        display: true,

                        text: "Jarak (km)",

                        color: dark
                            ? "#cbd5e1"
                            : "#36383a"

                    },

                    ticks: {

                        color: dark
                            ? "#7f8893"
                            : "#606060",

                        maxTicksLimit: 10

                    },

                    grid: {

                        color: dark
                            ? "rgba(255,255,255,.05)"
                            : "rgba(0,0,0,.05)"

                    }

                },

                y: {

                    title: {

                        display: true,

                        text: "Elevasi (m)",

                        color: dark
                            ? "#cbd5e1"
                            : "#36383a"

                    },

                    ticks: {

                        color: dark
                            ? "#7f8893"
                            : "#606060"

                    },

                    grid: {

                        color: dark
                            ? "rgba(255,255,255,.05)"
                            : "rgba(0,0,0,.05)"

                    }

                }

            }

        };

    },
	
	/* ======================================================
       Calculator
    ====================================================== */
	
		calculateDistance(lat1, lon1, lat2, lon2) {

		const R = 6371000;

		const dLat = (lat2 - lat1) * Math.PI / 180;
		const dLon = (lon2 - lon1) * Math.PI / 180;

		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(lat1 * Math.PI / 180) *
			Math.cos(lat2 * Math.PI / 180) *
			Math.sin(dLon / 2) ** 2;

		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	},

    /* ======================================================
       Render
    ====================================================== */

    render() {

        if (!this.initialized) {

            this.init();

        }

        if (!this.ctx) {

            return;

        }

        if (this.chart) {

            this.chart.destroy();

        }

        this.chart = new Chart(

            this.ctx,

            {

                type: "line",

                data: {

                    labels: this.labels,

                    datasets: this.getDataset()

                },

                options: this.getOptions()

            }

        );

    },

    /* ======================================================
       Update Track
    ====================================================== */

    update(track) {

        this.setTrack(track);

        if (!this.chart) {

            this.render();

            return;

        }

        this.chart.data.labels = this.labels;

        this.chart.data.datasets = this.getDataset();

        this.chart.update();

    },

    /* ======================================================
       Refresh Theme
    ====================================================== */

    refreshTheme() {

        if (!this.chart) {

            return;

        }

        this.chart.options = this.getOptions();

        this.chart.update();

    },

    /* ======================================================
       Resize
    ====================================================== */

    resize() {

        if (!this.chart) {

            return;

        }

        this.chart.resize();

    },

    /* ======================================================
       Highlight Point
    ====================================================== */

    highlight(index) {

        if (!this.chart) {

            return;

        }

        if (

            index < 0 ||

            index >= this.elevations.length

        ) {

            return;

        }

        this.chart.setActiveElements([

            {

                datasetIndex: 0,

                index: index

            }

        ]);

        this.chart.tooltip.setActiveElements(

            [

                {

                    datasetIndex: 0,

                    index: index

                }

            ],

            {

                x: 0,

                y: 0

            }

        );

        this.chart.update();

    },
	
    /* ======================================================
       Clear
    ====================================================== */

    clear() {

        this.clearData();

        if (!this.chart) {

            return;

        }

        this.chart.data.labels = [];

        this.chart.data.datasets = [];

        this.chart.update();

    },

    /* ======================================================
       Destroy
    ====================================================== */

    destroy() {

        if (this.chart) {

            this.chart.destroy();

            this.chart = null;

        }

        this.clearData();

        this.initialized = false;

    },

    /* ======================================================
       Getter
    ====================================================== */

    getChart() {

        return this.chart;

    },

    getElevation(index) {

        if (

            index < 0 ||

            index >= this.elevations.length

        ) {

            return null;

        }

        return this.elevations[index];

    },

    getDistance(index) {

        if (

            index < 0 ||

            index >= this.distances.length

        ) {

            return null;

        }

        return this.distances[index];

    }

};


/* ==========================================================
   Theme Refresh
========================================================== */

document.addEventListener(

    "themeChanged",

    () => {

        ElevationChart.refreshTheme();

    }

);


/* ==========================================================
   Resize
========================================================== */

window.addEventListener(

    "resize",

    Utils.debounce(

        () => {

            ElevationChart.resize();

        },

        250

    )

);


/* ==========================================================
   Export
========================================================== */

window.ElevationChart = ElevationChart;


/* ==========================================================
   Lipat / buka grafik
   Di HP default-nya tertutup supaya halaman tidak panjang,
   di desktop tetap terbuka.
========================================================== */

ElevationChart.collapsed = false;

ElevationChart.toggleCollapsed = function (force) {

    const card = document.getElementById("elevation-card");

    const button = document.getElementById("btn-elevation-toggle");

    if (!card) return;

    const next = typeof force === "boolean" ? force : !this.collapsed;

    this.collapsed = next;

    card.classList.toggle("is-collapsed", next);

    if (button) {

        button.setAttribute("aria-expanded", String(!next));

        const icon = button.querySelector("i");

        if (icon) {

            icon.className = next

                ? "fa-solid fa-chevron-down"

                : "fa-solid fa-chevron-up";

        }

    }

    if (!next) {

        setTimeout(() => this.resize(), 60);

    }

};

ElevationChart.initToggle = function () {

    const button = document.getElementById("btn-elevation-toggle");

    if (button) {

        button.addEventListener("click", () => this.toggleCollapsed());

    }

    /* Default tertutup di layar kecil (HP), terbuka di desktop */
    if (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {

        this.toggleCollapsed(true);

    }

};

/* ==========================================================
   Ready
========================================================== */

