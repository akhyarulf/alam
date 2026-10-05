/* ==========================================
 Alam — Routes Index Builder
 ==========================================
 Membaca setiap data/<slug>/manifest.json lalu menulis satu
 ringkasan ke data/routes.json supaya landing page cukup
 melakukan SATU request untuk seluruh daftar jalur.

 Jalankan:  node scripts/build-routes-index.js
 Dijalankan otomatis oleh .github/workflows/routes-index.yml
 setiap ada perubahan di folder data/.

 Tanpa dependency, tanpa npm install.
 ========================================== */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const OUTPUT = path.join(DATA_DIR, "routes.json");

/* ==========================================
   Util
   ========================================== */
function round(value, digits) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.warn(`  ! lewati (JSON tidak valid): ${path.relative(ROOT, file)} — ${err.message}`);
    return null;
  }
}

/* ==========================================
   Ambil metadata satu jalur
   ========================================== */
function toEntry(slug, manifest) {
  const track = manifest.track || {};
  const stats = manifest.stats || {};
  const center = stats.center || null;

  return {
    slug,
    name: track.name || slug,
    mountain: track.mountain || slug,
    route: track.route || "",
    points: round(Number(stats.points), 0),
    distance_km: round(Number(stats.distance_km), 2),
    gain: round(Number(stats.gain), 0),
    loss: round(Number(stats.loss), 0),
    highest: round(Number(stats.highest), 2),
    lowest: round(Number(stats.lowest), 2),
    center:
      center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))
        ? { lat: Number(round(Number(center.lat), 6)), lng: Number(round(Number(center.lng), 6)) }
        : null,
    updated: manifest.created_at || manifest.updated_at || null,
  };
}

/* ==========================================
   Scan folder data/
   ========================================== */
function collectRoutes() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Folder data/ tidak ditemukan: ${DATA_DIR}`);
    process.exit(1);
  }

  const entries = [];

  for (const slug of fs.readdirSync(DATA_DIR).sort()) {
    const dir = path.join(DATA_DIR, slug);
    if (!fs.statSync(dir).isDirectory()) continue; // lewati routes.json dsb.

    const manifestPath = path.join(dir, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      console.warn(`  ! lewati (manifest.json tidak ada): ${slug}`);
      continue;
    }

    const manifest = readJSON(manifestPath);
    if (!manifest) continue;

    entries.push(toEntry(slug, manifest));
  }

  // Urutan stabil: nama gunung, lalu nama jalur.
  entries.sort((a, b) => a.mountain.localeCompare(b.mountain, "id") || a.name.localeCompare(b.name, "id"));

  return entries;
}

/* ==========================================
   Tulis sitemap.xml

   Dibuat di sini (bukan file statis) supaya sitemap
   selalu ikut jalur baru yang di-publish lewat uploader.
   ========================================== */
const SITE = "https://alam.nyasarnyaman.my.id";
const SITEMAP_OUTPUT = path.join(ROOT, "sitemap.xml");

function urlEntry(loc, lastmod, priority) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : null,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

function writeSitemap(routes) {
  const urls = [urlEntry(`${SITE}/`, null, "1.0")];

  for (const r of routes) {
    urls.push(urlEntry(`${SITE}/viewer.html?route=${encodeURIComponent(r.slug)}`, null, "0.8"));
  }

  urls.push(urlEntry(`${SITE}/upload.html`, null, "0.4"));

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join("\n") +
    "\n</urlset>\n";

  const previous = fs.existsSync(SITEMAP_OUTPUT) ? fs.readFileSync(SITEMAP_OUTPUT, "utf8") : null;

  if (previous === xml) {
    console.log(`sitemap.xml sudah sama — ${routes.length} jalur, tidak ada perubahan.`);
    return false;
  }

  fs.writeFileSync(SITEMAP_OUTPUT, xml);
  console.log(`sitemap.xml ditulis — ${urls.length} URL.`);
  return true;
}

/* ==========================================
   Tulis data/routes.json
   ========================================== */
function main() {
  const routes = collectRoutes();
  const payload = {
    generated: new Date().toISOString(),
    count: routes.length,
    routes,
  };

  const json = JSON.stringify(payload, null, 2) + "\n";

  const previous = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : null;

  // Hanya perubahan pada field "generated" yang diabaikan, supaya workflow
  // tidak membuat commit baru setiap kali tanggal berubah saja.
  if (previous && stripGenerated(previous) === stripGenerated(json)) {
    console.log(`data/routes.json sudah sama — ${routes.length} jalur, tidak ada perubahan.`);
    writeSitemap(routes);
    return;
  }

  fs.writeFileSync(OUTPUT, json);
  console.log(`data/routes.json ditulis — ${routes.length} jalur:`);
  routes.forEach((r) => console.log(`  - ${r.slug} (${r.distance_km ?? "?"} km)`));
  writeSitemap(routes);
}

function stripGenerated(text) {
  return text.replace(/"generated": "[^"]*"/, '"generated": ""');
}

main();