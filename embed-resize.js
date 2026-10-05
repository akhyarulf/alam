/* ==========================================================
   Alam Viewer — embed-resize.js
   Helper sisi BLOG (Blogger, tema Derelogy).

   Pasang SATU BARIS di tema Blogger:

       Tema -> Edit HTML, sebelum </body>:

       <script src="https://alam.nyasarnyaman.my.id/embed-resize.js"></script>

   Ganti script lama yang menunda src iframe, supaya tidak
   ada dua script yang berebut set src & tinggi.

   Fungsinya:

   1. SRC DITUNDA (anti flash tema salah)
      <iframe class="alam-viewer-embed" data-route="lawu-via-cemoro-sewu">
      tanpa src. Script ini yang mengisinya, sekalian
      menyertakan &theme=... supaya viewer langsung benar
      sejak frame pertama (tidak berkedip).

   2. HEIGHT OTOMATIS
      Viewer (embed-sync.js) mengirim
      {source:"alam", type:"resize", height:NNN}
      setiap isinya berubah. Tinggi iframe menyesuaikan
      -> tidak ada area kosong atau scroll ganda.

   3. TEMA SINKRON DUA ARAH
      -. blog -> viewer : baca tema blog, kirim ke viewer
        {source:"alam-blog", type:"theme", theme:"dark"|"light"}
      - viewer -> blog : kalau tema diganti di dalam viewer,
        script ini mengubah tema blog (checkbox/label/button).
      Perubahan dari blog tidak dipantulkan balik (anti-loop).

   Cara baca tema blog (sesuai tema Derelogy):
      1. checkbox #mode  -> kalau tercentang = dark
      2. atribut data-theme di <html> atau <body>
      3. class dark/light di <html> atau <body>
      4. warna latar background (gelap/terang)
      5. prefers-color-scheme sistem

   Kalau script ini tidak terpasang, viewer tetap jalan
   normal; hanya tinggi iframe, src tertunda, dan sinkron
   tema yang tidak ikut menyesuaikan.
========================================================== */

(function () {

    "use strict";

    var LOGO = "alam";

    /* Base iframe viewer.

       PENTING: harus sampai ke viewer.html. Kalau hanya "/alam/",
       domain akhyarulf.github.io mengarahkan ke "/", yaitu halaman
       depan (landing), DAN parameter ?route= ikut hilang. */
    var VIEWER_BASE = "https://akhyarulf.github.io/alam/viewer.html";

    /* Dipakai untuk mengenali iframe viewer di halaman blog. */
    var HOSTS = ["alam.nyasarnyaman.my.id", "akhyarulf.github.io/alam"];

    var MIN_H = 400;
    var MAX_H = 20000;

    /* ==========================================================
       Util
    ========================================================== */

    function clamp(n) {
        return Math.max(MIN_H, Math.min(MAX_H, Math.round(n)));
    }

    function hasClass(el, name) {
        return !!el &&
            new RegExp("(^|\\s)" + name + "(\\s|$)").test(el.className || "");
    }

    /* Kumpulan iframe viewer, unik, dari beberapa pola penulisan. */
    function frames() {
        var selectors = ['iframe[data-route]', "iframe.alam-viewer-embed"];

        HOSTS.forEach(function (host) {
            selectors.push('iframe[src*="' + host + '"]');
        });

        var out = [];

        selectors.forEach(function (sel) {
            var list;

            try {
                list = document.querySelectorAll(sel);
            } catch (e) {
                return;
            }

            for (var i = 0; i < list.length; i++) {
                if (out.indexOf(list[i]) === -1) out.push(list[i]);
            }
        });

        return out;
    }

    /* ==========================================================
       1. Src ditunda
    ========================================================== */

    function initFrames() {
        frames().forEach(function (frame) {
            /* Sudah diisi sebelumnya, atau memang ditulis manual
               (pakai src) -> janganSentuh. */
            if (frame.dataset.alamSrc) return;

            var route = frame.getAttribute("data-route");

            if (!route) return;

            frame.dataset.alamSrc = "1";

            frame.src = VIEWER_BASE + "?route=" + encodeURIComponent(route) +
                "&theme=" + readTheme();
        });
    }

    /* ==========================================================
       2. Tinggi otomatis
    ========================================================== */

    function applyHeight(height) {
        var h = clamp(height);

        frames().forEach(function (frame) {
            if (frame.dataset.alamH === String(h)) return;

            frame.dataset.alamH = String(h);

            frame.style.height = h + "px";

            try {
                frame.setAttribute("height", String(h));
            } catch (e) {
                /* abaikan */
            }
        });
    }

    /* ==========================================================
       Tema blog
    ========================================================== */

    function themeBox() {
        return document.getElementById("mode");
    }

    function readTheme() {
        var root = document.documentElement;
        var body = document.body;

        /* 1. checkbox #mode (pola Derelogy) */
        var box = themeBox();

        if (box && box.checked) return "dark";

        /* 2. atribut data-theme */
        var attr = (root && root.getAttribute("data-theme")) ||
            (body && body.getAttribute("data-theme"));

        if (attr === "dark" || attr === "light") return attr;

        /* 3. class dark/light */
        if (hasClass(root, "dark")) return "dark";
        if (hasClass(root, "light")) return "light";
        if (hasClass(body, "dark")) return "dark";
        if (hasClass(body, "light")) return "light";

        /* 4. warna latar */
        try {
            var bg = window.getComputedStyle(body).backgroundColor || "";
            var rgb = bg.match(/[\d.]+/g);

            if (rgb && rgb.length >= 3) {
                var alpha = rgb.length > 3 ? parseFloat(rgb[3]) : 1;

                if (alpha > 0.05) {
                    var lum = 0.299 * rgb[0] +
                        0.587 * rgb[1] +
                        0.114 * rgb[2];

                    return lum < 128 ? "dark" : "light";
                }
            }
        } catch (e) {
            /* abaikan */
        }

        /* 5. sistem */
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    var lastSent = null;

    function pushTheme(force) {
        var theme = readTheme();

        if (!force && theme === lastSent) return theme;

        lastSent = theme;

        frames().forEach(function (frame) {
            try {
                if (!frame.contentWindow) return;

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

    /* Kontrol tema blog: label lebih dulu (pola klik pengguna
       asli), checkbox sebagai cadangan. */
    function findControl() {
        var box = themeBox();

        if (box) {
            var label = document.querySelector(
                'label[for="mode"], label.mode, .mode'
            );

            return label || box;
        }

        var selectors = [
            '[aria-label*="dark" i]',
            '[aria-label*="light" i]',
            '[aria-label*="mode" i]',
            '[aria-label*="tema" i]',
            '[aria-label*="theme" i]',
            '[title*="dark" i]',
            '[title*="light" i]',
            '[title*="tema" i]',
            '[title*="theme" i]'
        ];

        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);

            if (el) return el;
        }

        return null;
    }

    function setBlogTheme(theme) {
        if (readTheme() === theme) return false;

        var control = findControl();

        if (!control) return false;

        /* Kalau yang ditemukan checkbox (label tidak ada),
           ubah state-nya langsung lalu kabari theme blog. */
        if (control.type === "checkbox") {
            try {
                if (control.checked === (theme === "dark")) return false;

                control.checked = theme === "dark";

                control.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            } catch (e) {
                /* abaikan */
            }

            return true;
        }

        try {
            control.click();
        } catch (e) {
            return false;
        }

        return true;
    }

    /* ==========================================================
       Pesan dari dalam iframe
    ========================================================== */

    window.addEventListener("message", function (e) {
        var data = e.data;

        if (!data || data.source !== LOGO) return;

        /* Viewer baru siap -> balas tema saat ini. */
        if (data.type === "ready") {
            pushTheme(true);
            return;
        }

        /* Sisanya hanya diterima dari iframe viewer kita. */
        var list = frames();
        var fromViewer = false;

        for (var i = 0; i < list.length; i++) {
            if (list[i].contentWindow === e.source) {
                fromViewer = true;
                break;
            }
        }

        /* Kalau tidak cocok dan ada banyak iframe, jangan
           menebak-nebak. Dengan satu iframe, lanjut saja. */
        if (!fromViewer && list.length !== 1) return;

        if (data.type === "resize" && typeof data.height === "number") {
            applyHeight(data.height);
            return;
        }

        if (data.type === "theme" &&
            (data.theme === "dark" || data.theme === "light")) {
            setBlogTheme(data.theme);
        }
    });

    /* ==========================================================
       Start
    ========================================================== */

    var started = false;

    function start() {
        if (started) return;

        started = true;

        try { initFrames(); } catch (e) { }
        try { pushTheme(true); } catch (e) { }

        window.addEventListener("load", function () {
            try { initFrames(); } catch (e) { }
            try { pushTheme(true); } catch (e) { }
        });

        /* Poll ringan: tema blog bisa berubah karena preferensi
           sistem atau skrip blog, tanpa mengubah atribut. */
        try {
            window.setInterval(function () {
                try { pushTheme(); } catch (e) { }
            }, 1500);
        } catch (e) { }

        /* Amati perubahan atribut tema di <html> dan <body>. */
        try {
            var observer = new MutationObserver(function () {
                try { pushTheme(); } catch (e) { }
            });

            var options = {
                attributes: true,
                attributeFilter: ["class", "data-theme"],
                subtree: false
            };

            observer.observe(document.documentElement, options);

            if (document.body) observer.observe(document.body, options);
        } catch (e) {
            /* andalkan interval */
        }

        /* Iframe bisa dimuat belakangan (Blogger lazy-load). */
        window.setTimeout(function () {
            try { initFrames(); } catch (e) { }
            try { pushTheme(true); } catch (e) { }
        }, 1200);
    }

    /* Setiap blok dilindungi try/catch sendiri supaya satu
       kegagalan tidak mematikan bagian lain. */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
        window.setTimeout(start, 0);
    } else {
        start();
    }

})();