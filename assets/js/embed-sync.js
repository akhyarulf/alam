/* ==========================================================
   Alam Viewer v1.1
   embed-sync.js

   Saat viewer ini di-embed lewat <iframe> di artikel
   Blogger, file ini melaporkan tinggi konten ke halaman
   induk supaya iframe bisa menyesuaikan tinggi otomatis
   (auto-height) -- tidak perlu height tetap & tidak
   terpotong/overflow di HP.

   Kerja bareng dengan script tambahan di theme Blogger
   (lihat bagian "ADDITIONAL SCRIPT" pada file index.xml).
========================================================== */

"use strict";

(function () {

    const embedded = (function () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    })();

    if (!embedded) return;

    let lastHeight = 0;

    function reportHeight() {

        const height = Math.ceil(
            document.documentElement.getBoundingClientRect().height
        );

        if (Math.abs(height - lastHeight) < 4) return;

        lastHeight = height;

        try {
            window.parent.postMessage(
                { source: "alam-viewer", type: "resize", height: height },
                "*"
            );
        } catch (e) {
            /* silent */
        }

    }

    /* Laporkan setiap ada perubahan ukuran konten
       (peta selesai load, chart digambar, waypoint
       bertambah, dsb). */
    const observer = new ResizeObserver(() => {
        reportHeight();
    });

    document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.body);
        reportHeight();
        setTimeout(reportHeight, 800);
        setTimeout(reportHeight, 2000);
    });

    window.addEventListener("load", reportHeight);

})();


