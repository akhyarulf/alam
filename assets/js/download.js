/* ==========================================================
   Alam Viewer v1.0
   download.js

   Download Manager
========================================================== */

"use strict";

const DownloadManager = {

    manifest: null,

    downloads: {},

    buttons: {},

    initialized: false,

    /* ======================================================
       Init
    ====================================================== */

    init() {

        this.buttons = {

            gpx: document.getElementById("btn-download-gpx"),

            kml: document.getElementById("btn-download-kml")

        };

        this.initialized = true;

    },

    /* ======================================================
       Set Manifest
    ====================================================== */

    setManifest(manifest) {

        if (!this.initialized) {

            this.init();

        }

        this.manifest = manifest || {};

        this.downloads =

            this.manifest.downloads || {};

    },

    /* ======================================================
       Update
    ====================================================== */

    update() {

        this.updateButton(

            "gpx",

            this.downloads.gpx

        );

        this.updateButton(

            "kml",

            this.downloads.kml

        );

    },

    /* ======================================================
       Update Button
    ====================================================== */

    updateButton(type, url) {

        const button = this.buttons[type];

        if (!button) {

            return;

        }

        if (!url) {

            button.removeAttribute("href");

            button.classList.add("disabled");

            button.setAttribute(

                "aria-disabled",

                "true"

            );

            return;

        }

        button.href = url;

        button.target = "_blank";

        button.rel = "noopener";

        button.classList.remove("disabled");

        button.removeAttribute(

            "aria-disabled"

        );

    },

    /* ======================================================
       Open Download
    ====================================================== */

    open(type) {

        const url = this.downloads[type];

        if (!url) {

            console.warn(

                `${type.toUpperCase()} tidak tersedia.`

            );

            return false;

        }

        window.open(

            url,

            "_blank",

            "noopener"

        );

        return true;

    },

    /* ======================================================
       Disable All
    ====================================================== */

    disableAll() {

        Object.keys(this.buttons).forEach(type => {

            const button = this.buttons[type];

            if (!button) return;

            button.removeAttribute("href");

            button.classList.add("disabled");

            button.setAttribute(

                "aria-disabled",

                "true"

            );

        });

    },

    /* ======================================================
       Refresh
    ====================================================== */

    refresh(manifest) {

        this.setManifest(manifest);

        this.update();

    },

    /* ======================================================
       Getter
    ====================================================== */

    getDownloads() {

        return this.downloads;

    },

    has(type) {

        return !!this.downloads[type];

    },

    /* ======================================================
       Destroy
    ====================================================== */

    destroy() {

        this.disableAll();

        this.manifest = null;

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

