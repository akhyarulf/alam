/* ==========================================================
   Alam Viewer v1.0
   utils.js

   Global Utility Functions

   Dipakai oleh: app.js, chart.js, stats.js, theme.js,
   map.js, download.js, loader.js, waypoint.js.

   Catatan: URL data & fetch tidak ada di sini — satu-satunya
   jalur baca data ada di app.js (manifest + track.geojson).
========================================================== */

"use strict";

/* ==========================================================
   Text
========================================================== */

function setText(target, value = "-") {
    let el = target;

    // jika dikirim string -> cari ID
    if (typeof target === "string") {
        el = document.getElementById(target);
    }

    // jika element tidak ada
    if (!el) return;

    el.textContent = value;
}

/* ==========================================================
   Formatter
========================================================== */

function formatDistance(km) {
    if (km === undefined) return "-";
    return `${Number(km).toFixed(2)} km`;
}

function formatElevation(m) {
    if (m === undefined) return "-";
    return `${Math.round(m)} m`;
}

function formatDuration(minutes) {
    if (minutes === undefined || minutes === null) return "-";
    minutes = Math.round(Number(minutes));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours <= 0) return `${mins} menit`;
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
}

/* ==========================================================
   Sleep — untuk animasi loader
========================================================== */

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/* ==========================================================
   Debounce — cegah eksekusi berulang
========================================================== */

function debounce(fn, delay = 250) {
    let timer = null;

    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

/* ==========================================================
   Fullscreen
========================================================== */

function openFullscreen(element = document.documentElement) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

/* ==========================================================
   Local Storage
========================================================== */

function saveLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadLocal(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

/* ==========================================================
   Export Global
========================================================== */

window.Utils = {
    setText,
    formatDistance,
    formatElevation,
    formatDuration,
    sleep,
    debounce,
    openFullscreen,
    closeFullscreen,
    saveLocal,
    loadLocal
};
