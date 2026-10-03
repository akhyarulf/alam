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

    get geojsonURL() {

        return `${this.rawBase}/${this.route}/track.geojson`;

    },

};


/*

=========================================

GLOBAL

=========================================

*/

window.CONFIG = CONFIG;

