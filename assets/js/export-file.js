/* ==========================================================
   Alam Viewer — Export File (GPX & KML)
 ==========================================================
   Mengubah track.geojson menjadi file GPX 1.1 dan KML 2.2
   langsung di browser. Tidak butuh server, tidak butuh layanan eksternal.

   Dipakai oleh assets/js/download.js.

   Fungsi ini murni (tidak menyentuh DOM) supaya bisa diuji
   sendiri di luar browser.
   ========================================================== */

(function () {

    "use strict";

    /* ---------- helper ---------- */

    function escapeXml(value) {

        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

    }

    function num(value, digits) {

        const n = Number(value);

        if (!Number.isFinite(n)) return null;

        return digits == null ? String(n) : String(Number(n.toFixed(digits)));

    }

    function splitFeatures(geojson) {

        const features = geojson && Array.isArray(geojson.features)
            ? geojson.features
            : [];

        const lines = [];
        const points = [];

        features.forEach((f) => {

            const g = f && f.geometry;

            if (!g) return;

            if (g.type === "LineString" && Array.isArray(g.coordinates)) {
                lines.push(g.coordinates);
            } else if (g.type === "MultiLineString" && Array.isArray(g.coordinates)) {
                g.coordinates.forEach((c) => lines.push(c));
            } else if (g.type === "Point" && Array.isArray(g.coordinates)) {
                points.push({ coordinates: g.coordinates, properties: f.properties || {} });
            }

        });

        return { lines, points };

    }

    function titleOf(meta, fallback) {

        return (meta && (meta.name || meta.title)) || fallback || "Jalur";

    }

    /* ==========================================================
       GPX 1.1
       ========================================================== */

    function buildGpx(geojson, meta) {

        const { lines, points } = splitFeatures(geojson);
        const name = titleOf(meta);

        if (!lines.length && !points.length) {

            throw new Error("Tidak ada geometri untuk diekspor.");

        }

        const parts = [];

        parts.push('<?xml version="1.0" encoding="UTF-8"?>');

        parts.push(
            '<gpx version="1.1" creator="Alam Viewer (akhyarulf/alam)"' +
            ' xmlns="http://www.topografix.com/GPX/1/1"' +
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1' +
            ' http://www.topografix.com/GPX/1/1/gpx.xsd">'
        );

        parts.push(`<metadata><name>${escapeXml(name)}</name></metadata>`);

        points.forEach((p) => {

            const lat = num(p.coordinates[1], 7);
            const lon = num(p.coordinates[0], 7);
            const ele = num(p.coordinates[2], 2);
            const label = p.properties.name || p.properties.route || "Waypoint";

            parts.push(`<wpt lat="${lat}" lon="${lon}">`);
            if (ele) parts.push(`<ele>${ele}</ele>`);
            parts.push(`<name>${escapeXml(label)}</name>`);

            if (p.properties.desc) {
                parts.push(`<desc>${escapeXml(p.properties.desc)}</desc>`);
            }

            parts.push("</wpt>");

        });

        lines.forEach((coords, idx) => {

            parts.push("<trk>");
            parts.push(`<name>${escapeXml(lines.length > 1 ? `${name} (bagian ${idx + 1})` : name)}</name>`);
            parts.push("<trkseg>");

            coords.forEach((c) => {

                const lat = num(c[1], 7);
                const lon = num(c[0], 7);
                const ele = num(c[2], 2);

                parts.push(
                    ele
                        ? `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele></trkpt>`
                        : `<trkpt lat="${lat}" lon="${lon}"></trkpt>`
                );

            });

            parts.push("</trkseg></trk>");

        });

        parts.push("</gpx>");

        return parts.join("\n");

    }

    /* ==========================================================
       KML 2.2
       ========================================================== */

    function buildKml(geojson, meta) {

        const { lines, points } = splitFeatures(geojson);
        const name = titleOf(meta);

        if (!lines.length && !points.length) {

            throw new Error("Tidak ada geometri untuk diekspor.");

        }

        const parts = [];

        parts.push('<?xml version="1.0" encoding="UTF-8"?>');
        parts.push('<kml xmlns="http://www.opengis.net/kml/2.2">');
        parts.push("<Document>");
        parts.push(`<name>${escapeXml(name)}</name>`);

        parts.push(
            '<Style id="alam-route">' +
            "<LineStyle><color>ff526b3f</color><width>4</width></LineStyle>" +
            "</Style>"
        );
        parts.push(
            '<Style id="alam-point">' +
            '<IconStyle><Icon><href>http://maps.google.com/mapfiles/kml/paddle/go.png</href></Icon>' +
            "<scale>0.8</scale></IconStyle></Style>"
        );

        lines.forEach((coords, idx) => {

            const kmlCoords = coords
                .map((c) => {
                    const lon = num(c[0], 7);
                    const lat = num(c[1], 7);
                    const ele = num(c[2], 2);
                    return ele ? `${lon},${lat},${ele}` : `${lon},${lat}`;
                })
                .join(" ");

            parts.push("<Placemark>");
            parts.push(
                `<name>${escapeXml(lines.length > 1 ? `${name} (bagian ${idx + 1})` : name)}</name>`
            );
            parts.push('<styleUrl>#alam-route</styleUrl>');
            parts.push("<LineString><tessellate>1</tessellate>");
            parts.push(`<coordinates>${kmlCoords}</coordinates>`);
            parts.push("</LineString></Placemark>");

        });

        points.forEach((p) => {

            const lon = num(p.coordinates[0], 7);
            const lat = num(p.coordinates[1], 7);
            const ele = num(p.coordinates[2], 2);
            const label = p.properties.name || p.properties.route || "Waypoint";

            parts.push("<Placemark>");
            parts.push(`<name>${escapeXml(label)}</name>`);
            parts.push("<styleUrl>#alam-point</styleUrl>");
            parts.push(
                `<Point><altitudeMode>absolute</altitudeMode><coordinates>${
                    ele ? `${lon},${lat},${ele}` : `${lon},${lat}`
                }</coordinates></Point>`
            );
            parts.push("</Placemark>");

        });

        parts.push("</Document></kml>");

        return parts.join("\n");

    }

    /* ==========================================================
       Nama file
       ========================================================== */

    function fileName(meta, ext) {

        const base = (meta && (meta.slug || meta.name)) || "jalur";

        const safe = String(base)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return `${safe || "jalur"}.${ext}`;

    }

    /* ---------- export ---------- */

    window.AlamExport = { buildGpx, buildKml, fileName };

    if (typeof module !== "undefined" && module.exports) {

        module.exports = window.AlamExport;

    }

})();