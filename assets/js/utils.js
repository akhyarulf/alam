/* ==========================================================
   Alam v1.0
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
   Waktu naik / turun (Naismith)
   Dipakai kalau manifest tidak punya
   ascent/descent_duration_minutes_* (mis. jalur hasil
   upload browser).
   - naik  = start -> finish (bagian yang mendaki)
   - turun = finish -> start (perjalanan balik; profil
     elevasi dibalik, jadi yang climbed adalah turunan
     asli dan yang diturun adalah naikan asli)
   Jarak ascent/descent dihitung dari arah elevasi tiap
   segmen track.
========================================================== */

const CLIMB_SPEED_KMH = 4;

const CLIMB_GAIN_M_PER_HOUR = 600;

function haversineKm(lat1, lon1, lat2, lon2) {

    const R = 6371;

    const toRad = (d) => d * Math.PI / 180;

    const dlat = toRad(lat2 - lat1);

    const dlon = toRad(lon2 - lon1);

    const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlon / 2) * Math.sin(dlon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

}

function roundMinutes(minutes) {

    return Math.max(5, Math.round(minutes / 5) * 5);

}

function climbTimes(coords) {

    if (!Array.isArray(coords) || coords.length < 2) return null;

    let upKm = 0, downKm = 0, gain = 0, loss = 0;

    for (let i = 1; i < coords.length; i++) {

        const a = coords[i - 1], b = coords[i];

        const km = haversineKm(a[1], a[0], b[1], b[0]);

        const ea = Number.isFinite(a[2]) ? a[2] : 0;

        const eb = Number.isFinite(b[2]) ? b[2] : 0;

        const diff = eb - ea;

        if (diff > 0) {

            upKm += km;

            gain += diff;

        } else {

            downKm += km;

            loss += Math.abs(diff);

        }

    }

    if (upKm + downKm <= 0) return null;

    const ascentHours = upKm / CLIMB_SPEED_KMH + gain / CLIMB_GAIN_M_PER_HOUR;

    /* Perjalanan balik: seluruh jarak ditempuh, yang didaki
       adalah total turunan asli, yang diturun adalah total
       naikan asli. */
    const descentHours = (upKm + downKm) / CLIMB_SPEED_KMH + loss / CLIMB_GAIN_M_PER_HOUR;

    return {

        ascent_km: Math.round(upKm * 100) / 100,

        descent_km: Math.round((upKm + downKm) * 100) / 100,

        profile_descent_km: Math.round(downKm * 100) / 100,

        total_km: Math.round((upKm + downKm) * 100) / 100,

        ascent_low: roundMinutes(ascentHours * 60 * 0.85),

        ascent_high: roundMinutes(ascentHours * 60 * 1.3),

        descent_low: roundMinutes(descentHours * 60 * 0.85),

        descent_high: roundMinutes(descentHours * 60 * 1.3)

    };

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
    loadLocal,
    climbTimes
};
