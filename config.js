/*
=========================================
 Alam Viewer
 Config
 Powered by Alam Engine
=========================================
*/

window.AlamViewer = window.AlamViewer || {};

const CONFIG = {

    /*
    =========================================
    APP
    =========================================
    */

    appName: "Alam Viewer",

    version: "1.0.0",

    engine: "Alam Engine",

    engineVersion: "1.3.2",


    /*
    =========================================
    DATA REPOSITORY
    =========================================
    */

    githubUser: "akhyarulf",

    githubRepo: "alam-viewer",

    githubBranch: "main",

    dataFolder: "data",


    /*
    =========================================
    RAW URL
    =========================================
    */

    get rawBase() {

        return `https://raw.githubusercontent.com/${this.githubUser}/${this.githubRepo}/${this.githubBranch}/${this.dataFolder}`;

    },


    /*
    =========================================
    ROUTE
    Priority:

    1 window.AlamViewer.route
    2 ?route=
    3 defaultRoute
    =========================================
    */

    defaultRoute: "butak-via-panderman",

    get route() {

        if (

            window.AlamViewer

            &&

            window.AlamViewer.route

        ) {

            return window.AlamViewer.route;

        }

        const params = new URLSearchParams(

            location.search

        );

        if (

            params.has("route")

        ) {

            return params.get("route");

        }

        return this.defaultRoute;

    },


    /*
    =========================================
    URL
    =========================================
    */

    get manifestURL() {

        return `${this.rawBase}/${this.route}/manifest.json`;

    },

    get jsonURL() {

        return `${this.rawBase}/${this.route}/track.json`;

    },

    get geojsonURL() {

        return `${this.rawBase}/${this.route}/track.geojson`;

    },


    /*
    =========================================
    MAP
    =========================================
    */

    map: {

        zoom: 14,

        minZoom: 4,

        maxZoom: 19,

        zoomControl: false,

        attributionControl: false

    },


    /*
    =========================================
    BASEMAPS
    =========================================
    */

    basemaps: {

        osm: {

            name: "OpenStreetMap",

            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            attribution: "&copy; OpenStreetMap"

        },

        satellite: {

            name: "Esri Satellite",

            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

            attribution: "Esri"

        },

        topo: {

            name: "OpenTopoMap",

            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",

            attribution: "OpenTopoMap"

        }

    },

    defaultBasemap: "topo",


    /*
    =========================================
    CHART
    =========================================
    */

    chart: {

        tension: 0.3,

        fill: true,

        pointRadius: 0,

        borderWidth: 2

    },


    /*
    =========================================
    UI
    =========================================
    */

    ui: {

        loadingDelay: 300,

        animation: true,

        darkMode: true,

        autoFit: true

    }

};


/*
=========================================
GLOBAL
=========================================
*/

window.CONFIG = CONFIG;

console.log(

    `${CONFIG.appName} ${CONFIG.version}`

);

console.log(

    "Route :", CONFIG.route

);

console.log(

    "Manifest :", CONFIG.manifestURL

);