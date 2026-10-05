/*

=========================================
 Alam Viewer
 Config

 githubRepo now points to: akhyarulf/alam

=========================================

*/

window.AlamViewer = window.AlamViewer || {};

const CONFIG = {

    /*

    =========================================

    DATA REPOSITORY

    =========================================

    */

    githubUser: "akhyarulf",

    githubRepo: "alam",

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
    LOKAL

    =========================================
    Data juga ikut ter-deploy di domain ini sendiri (folder data/),
    jadi lebih cepat diambil dari CDN sendiri daripada menunggu
    raw.githubusercontent.com. Dipakai duluan; rawBase tetap
    disimpan sebagai cadangan.

    =========================================

    */

    get localBase() {

        return this.dataFolder;

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

    defaultRoute: "lawu-via-cemoro-sewu",

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

        return `${this.localBase}/${this.route}/manifest.json`;

    },

    get geojsonURL() {

        return `${this.localBase}/${this.route}/track.geojson`;

    },

    /* Cadangan: dipakai kalau file lokal tidak tersedia
       (mis. viewer.html di-host tanpa folder data/). */

    get rawManifestURL() {

        return `${this.rawBase}/${this.route}/manifest.json`;

    },

    get rawGeojsonURL() {

        return `${this.rawBase}/${this.route}/track.geojson`;

    },

};


/*

=========================================

GLOBAL

=========================================

*/

window.CONFIG = CONFIG;

