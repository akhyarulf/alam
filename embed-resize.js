/* ==========================================================
   Alam Viewer — embed-resize.js
   Helper sisi BLOG (Blogger / tema Derelogy).

   Dipakai dengan menempel satu baris di tema Blogger:

       Tema -> Edit HTML, sebelum </body>:

       <script src="https://alam.nyasarnyaman.my.id/embed-resize.js"></script>

   Fungsinya dua:

   1. HEIGHT OTOMATIS
      Viewer (embed-sync.js) mengirim
      {source:"alam", type:"resize", height:NNN}
      setiap kali isinya berubah. Script ini menyesuaikan
      tinggi iframe -> tidak ada scroll ganda di artikel.

   2. TEMA SINKRON (bolak-balik)
      -.blog -> viewer : membaca tema blog, lalu mengirim
        {source:"alam-blog", type:"theme", theme:"dark"|"light"}
      - viewer -> blog : kalau tema diganti di dalam viewer,
        script ini menekan tombol tema milik blog (bila ada).

   Kalau tidak menempel script ini, viewer tetap jalan normal;
   hanya tinggi iframe dan tema yang tidak ikut menyesuaikan.
========================================================== */

(function () {

    "use strict";

    var HOST = "alam.nyasarnyaman.my.id";
    var LOGO = "alam";
    var MIN_H = 400;
    var MAX_H = 20000;

    /* ==========================================================
       Util
    ========================================================== */

    function frames() {
        return Array.prototype.slice.call(
            document.querySelectorAll('iframe[src*="' + HOST + '"]')
        );
    }

    function clamp(n) {
        return Math.max(MIN_H, Math.min(MAX_H, Math.round(n)));
    }

    /* ==========================================================
       1. Auto height
    ========================================================== */

    var lastHeight = {};

    function applyHeight(height) {
        var h = clamp(height);

        frames().forEach(function (frame) {
            if (lastHeight[frame.src] === h) return;

            lastHeight[frame.src] = h;

            frame.style.height = h + "px";

            try {
                frame.setAttribute("height", String(h));
            } catch (e) {
                /* abaikan */
            }
        });
    }

    /* Iframe yang sudah ada di DOM saat script dimuat */
    function measure() {
        frames().forEach(function (frame) {
            try {
                if (!frame.contentWindow || !frame.contentDocument) return;

                var doc = frame.contentDocument;

                var body = doc.body;

                if (!body) return;

                /* Kalau dokumennya di origin sama (mis. opened
                   langsung dari file lokal), tinggi bisa dibaca
                   tanpa menunggu laporan. */
                var h = clamp(
                    Math.max(
                        doc.documentElement.getBoundingClientRect().height,
                        body.scrollHeight,
                        body.offsetHeight
                    )
                );

                if (h > 0) applyHeight(h);
            } catch (e) {
                /* cross-origin: tunggu laporan dari embed-sync.js */
            }
        });
    }

    /* ==========================================================
       2. Tema blog
    ========================================================== */

    function hasClass(el, name) {
        return el && new RegExp("(^|\\s)" + name + "(\\s|$)").test(el.className || "");
    }

    function blogTheme() {
        var root = document.documentElement;
        var body = document.body;

        if (root && root.dataset && root.dataset.theme) return root.dataset.theme;
        if (root && hasClass(root, "dark")) return "dark";
        if (root && hasClass(root, "light")) return "light";
        if (body && hasClass(body, "dark")) return "dark";
        if (body && hasClass(body, "light")) return "light";

        try {
            var bg = window.getComputedStyle(body).backgroundColor || "";
            var rgb = bg.match(/\d+/g);

            if (rgb && rgb.length >= 3) {
                var lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
                return lum < 128 ? "dark" : "light";
            }
        } catch (e) {
            /* abaikan */
        }

        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function pushTheme() {
        var theme = blogTheme();

        frames().forEach(function (frame) {
            try {
                frame.contentWindow.postMessage(
                    { source: "alam-blog", type: "theme", theme: theme },
                    "*"
                );
            } catch (e) {
                /* abaikan */
            }
        });

        return theme;
    }

    /* Tombol tema milik blog (kalau ketemu) */
    function findBlogToggle() {
        var selectors = [
            '[aria-label*="dark" i]',
            '[aria-label*="light" i]',
            '[aria-label*="tema" i]',
            '[title*="dark" i]',
            '[title*="light" i]',
            '[title*="tema" i]'
        ];

        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) return el;
        }

        return null;
    }

    function requestBlogTheme(theme) {
        if (blogTheme() === theme) return;

        var toggle = findBlogToggle();

        if (!toggle) return;

        try {
            toggle.click();
        } catch (e) {
            /* abaikan */
        }
    }

    /* ==========================================================
       Pesan dari dalam iframe
    ========================================================== */

    window.addEventListener("message", function (e) {
        var data = e.data;

        if (!data || data.source !== LOGO) return;

        if (data.type === "resize" && typeof data.height === "number") {

            applyHeight(data.height);

            return;
        }

        if (data.type === "theme" && (data.theme === "dark" || data.theme === "light")) {

            requestBlogTheme(data.theme);

        }

    });

    /* ==========================================================
       Pemicu
    ========================================================== */var started = false;

    function start() {

        if (started) return;

        started = true;

        measure();

        var current = blogTheme();

        pushTheme();

        /* Tema blog bisa berubah karena klik tombolnya;
           poll ringan + amati perubahan class. */
        window.setInterval(function () {
            var theme = blogTheme();
            if (theme === current) return;
            current = theme;
            pushTheme();
        }, 1500);

        try {
            var observer = new MutationObserver(function () {
                var theme = blogTheme();
                if (theme === current) return;
                current = theme;
                pushTheme();
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class", "data-theme"],
                subtree: false
            });
        } catch (e) {
            /* MutationObserver tidak tersedia -> andalkan interval */
        }

        /* Iframe yang dimuat belakangan (blogger lazy-load) */
        window.addEventListener("load", function () {
            measure();
            pushTheme();
        });

        window.setTimeout(function () {
            measure();
            pushTheme();
        }, 1200);

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", start);

        /* Jaring pengaman: kalau DOMContentLoaded sudah lewat
           tanpa memicu (mis. script dimuat async), tetap jalan. */
        window.setTimeout(start, 0);

    } else {

        start();

    }

})();