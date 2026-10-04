/* ==========================================================
   Alam Viewer v1.1
   theme.js

   Light / Dark Theme Manager
   + Sinkron otomatis dengan tema Blogger (Derelogy)
   saat viewer ini di-embed via <iframe> di artikel.
========================================================== */

"use strict";

const Theme = {

    STORAGE_KEY: "alam-theme",

    current: "light",

    button: null,

    icon: null,

    initialized: false,

    /* Apakah viewer ini berjalan di dalam iframe (embed) */
    embedded: (function () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    })(),

    /* Sudah menerima tema dari parent (Blogger)? */
    syncedFromParent: false,

    /* ======================================================
       Init
    ====================================================== */

    init() {

        this.button = document.getElementById("btn-theme");

        if (this.button) {
            this.icon = this.button.querySelector("i");
        }

        this.current = this.resolveInitialTheme();

        this.apply(this.current, { persist: !this.syncedFromParent });

        this.bindEvents();

        if (this.embedded) {
            this.bindParentSync();
        }

        this.initialized = true;

    },

    /* ======================================================
       Resolve Initial Theme

       Prioritas:
       1. ?theme=dark/light di URL (dikirim Blogger saat
          membuat iframe, mencegah "kedip" tema salah)
       2. localStorage viewer sendiri (kunjungan langsung)
       3. prefers-color-scheme sistem
    ====================================================== */

    resolveInitialTheme() {

        const params = new URLSearchParams(location.search);
        const fromUrl = params.get("theme");

        if (fromUrl === "dark" || fromUrl === "light") {
            this.syncedFromParent = true;
            return fromUrl;
        }

        const saved = Utils.loadLocal(this.STORAGE_KEY, null);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

    },

    /* ======================================================
       Bind
    ====================================================== */

    bindEvents() {

        if (this.button) {
            this.button.addEventListener("click", () => {
                this.toggle();
            });
        }

        window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
            "change",
            e => {
                if (this.syncedFromParent) return;
                if (Utils.loadLocal(this.STORAGE_KEY, null) === null) {
                    this.apply(e.matches ? "dark" : "light");
                }
            }
        );

    },

    /* ======================================================
       Sinkron dengan Blogger (parent window)

       - Kirim handshake "ready" supaya parent membalas
         tema yang sedang aktif (untuk kasus iframe
         sudah lebih dulu selesai load dibanding script
         Blogger).
       - Dengarkan pesan tema baru setiap kali toggle
         dark/light di-klik di halaman Blogger (live,
         tanpa reload iframe).
    ====================================================== */

    bindParentSync() {

        window.addEventListener("message", e => {

            const data = e.data;

            if (
                !data ||
                data.source !== "nyasar-blog" ||
                (data.theme !== "dark" && data.theme !== "light")
            ) {
                return;
            }

            this.syncedFromParent = true;

            this.apply(data.theme, { persist: false });

        });

        try {
            window.parent.postMessage(
                { source: "alam", type: "ready" },
                "*"
            );
        } catch (e) {
            console.warn("Theme: gagal handshake ke parent.", e);
        }

    },

    /* ======================================================
       Apply Theme
    ====================================================== */

    apply(mode, opts) {

        opts = opts || {};

        document.body.classList.remove("light", "dark");
        document.body.classList.add(mode);

        this.current = mode;

        if (opts.persist !== false) {
            Utils.saveLocal(this.STORAGE_KEY, mode);
        }

        this.updateIcon();
        this.updateMetaTheme();

        document.dispatchEvent(
            new CustomEvent("themeChanged", { detail: { theme: mode } })
        );

    },

    /* ======================================================
       Toggle

       Toggle manual tetap tersedia (mis. mau lihat peta
       dalam mode gelap walau artikel-nya terang). Setelah
       manual toggle, sinkron otomatis dari parent berhenti
       sampai pesan tema baru datang lagi dari Blogger.
    ====================================================== */

    toggle() {

        this.syncedFromParent = false;

        if (this.current === "dark") {
            this.apply("light");
        } else {
            this.apply("dark");
        }

    },

    /* ======================================================
       Icon
    ====================================================== */

    updateIcon() {

        if (!this.icon) return;

        this.icon.className =
            this.current === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";

    },

    /* ======================================================
       Update Browser Theme Color
    ====================================================== */

    updateMetaTheme() {

        const meta = document.querySelector('meta[name="theme-color"]');

        if (!meta) return;

        meta.setAttribute(
            "content",
            this.current === "dark" ? "#202124" : "#ed783c"
        );

    },

    /* ======================================================
       Getter
    ====================================================== */

    isDark() {
        return this.current === "dark";
    },

    isLight() {
        return this.current === "light";
    },

    /* ======================================================
       Setter
    ====================================================== */

    setDark() {
        this.syncedFromParent = false;
        this.apply("dark");
    },

    setLight() {
        this.syncedFromParent = false;
        this.apply("light");
    },

    /* ======================================================
       Reset
    ====================================================== */

    reset() {

        localStorage.removeItem(this.STORAGE_KEY);
        this.syncedFromParent = false;

        this.current = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

        this.apply(this.current);

    }

};


/* ==========================================================
   Export
========================================================== */

window.Theme = Theme;


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
    Theme.init();
});


/* ==========================================================
   Ready
========================================================== */


