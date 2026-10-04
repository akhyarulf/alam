/* ==========================================
 Alam Viewer v2 — Landing Page
 ==========================================
 Gaya: layout responsif 2 kolom (desktop) / vertical (mobile).
 Data: header dari manifest.json / track.geojson di data/<slug>/.
 Kode: bawaan web + Leaflet + Chart.js + Turf (CDN).
 ========================================================== */

"use strict";

// ==========================================================
// KONFIG
// ==========================================================
window.ALAM = window.ALAM || {};
window.ALAM.landing = window.ALAM.landing || {};
window.ALAM.landing.routes = [
  { slug: "butak-via-panderman", uri: "https://raw.githubusercontent.com/akhyarulf/alam/main/data/butak-via-panderman/manifest.json" },
  { slug: "lawu-via-cemoro-sewu", uri: "https://raw.githubusercontent.com/akhyarulf/alam/main/data/lawu-via-cemoro-sewu/manifest.json" },
];
window.ALAM.landing.defaultRoute = "butak-via-panderman";

// ==========================================================
// MODE
// ==========================================================
window.ALAM.landing.mode = (function () {
  const m = new URLSearchParams(location.search).get("mode") || "grid";
  return (m === "list" || m === "grid") ? m : "grid";
})();

// ==========================================================
// STATE
// ==========================================================
window.ALAM.landing.state = {
  routes: [],
  loading: true,
  error: null,
  ids: {}
};

// ==========================================================
// UTIL
// ==========================================================
const L = window.ALAM.landing;
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const el = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") e.className = v;
    else if (k === "dataset" || k === "children") Object.assign(e, v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of children) e.append(c);
  return e;
};

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

// ==========================================================
// HERO MAP
// ==========================================================
function initHeroMap() {
  const el = document.getElementById("hero-map");
  if (!el) return;
  // gunakan icon default leaflet; kita set icon footer nanti
  const map = L.map(el, { center: [-7.9, 112.49], zoom: 14, scrollWheelZoom: false, attributionControl: false });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 18
  }).addTo(map);
  L.control.attribution({ position: "bottomright" }).setPrefix("").addTo(map);
  return map;
}

// ==========================================================
// PREVIEW MAP (per route)
// ==========================================================
function initRoutePreview(slug, containerId) {
  const id = containerId || `route-preview-${slug}`;
  const el = document.getElementById(id);
  if (!el) return null;
  const map = L.map(el, { scrollWheelZoom: false, attributionControl: false });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 18
  }).addTo(map);

  // load geojson dari data repo, fallback ke remote
  const geoUrl = `https://raw.githubusercontent.com/akhyarulf/alam/main/data/${slug}/track.geojson`;
  fetch(geoUrl)
    .then(r => { if (!r.ok) throw new Error("fetch " + r.status); return r.json(); })
    .then(data => {
      if (data.features?.length) {
        L.geoJSON(data, {
          style: { color: "#5a7562", weight: 4, opacity: 1, fillColor: "#5a7562", fillOpacity: 0.10 },
          onEachFeature: (f, layer) => {
            const name = f.properties?.name || f.properties?.route || slug;
            layer.bindPopup(name);
          }
        }).addTo(map);
      }
    })
    .catch(() => {});
  return map;
}

// ==========================================================
// ROUTE CARDS
// ==========================================================
function renderRouteCards() {
  const grid = document.getElementById("route-grid");
  if (!grid) return;
  const slug = L.routeId || L.defaultRoute;
  const cards = grid.querySelectorAll(".route-card");
  cards.forEach(card => {
    const path = card.dataset.slug || card.querySelector(".route-slug")?.textContent;
    const mapEl = card.querySelector(".route-map");
    const preview = initRoutePreview(slug, `route-preview-${slug}`);
    if (preview && path) {
      // preview map di card
      const map = L.map(mapEl, { scrollWheelZoom: false, attributionControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 18 }).addTo(map);
      fetch(`https://raw.githubusercontent.com/akhyarulf/alam/main/data/${path}/track.geojson`)
        .then(r => r.json())
        .then(data => {
          if (data.features?.length) L.geoJSON(data, {
            style: { color: "#5a7562", weight: 3, fillColor: "#5a7562", fillOpacity: 0.08 },
            onEachFeature: (f, l) => l.bindPopup(f.properties?.name || "")
          }).addTo(map);
        })
        .catch(() => {});
    }
  });
}

// ==========================================================
// STATS
// ==========================================================
function renderStats(routes) {
  const totalWays = routes.reduce((s, r) => s + (r.stats?.points || 0), 0);
  const totalDist = routes.reduce((s, r) => s + (r.stats?.distance_km || 0), 0);
  const ids = { route: routes.length, poi: totalWays, walk: 0, km: totalDist };
  Object.assign(window.ALAM.landing.state.ids, ids);
  document.getElementById("stat-jalur")?.textContent = routes.length;
  document.getElementById("stat-poity")?.textContent = totalWays;
  document.getElementById("stat-berjalan")?.textContent = "—"; // akan diisi stats detail
  document.getElementById("stat-kilometer")?.textContent = totalDist.toFixed(2);
}

// ==========================================================
// EMBED
// ==========================================================
function initEmbed() {
  const textarea = document.getElementById("embed-code");
  if (!textarea) return;
  const btn = document.getElementById("btn-copy-embed");
  function copy() {
    textarea.select();
    document.execCommand("copy");
    btn.textContent = "Tersalin!";
  }
  if (btn) btn.addEventListener("click", copy);
}

// ==========================================================
// ROUTE RESOLVER (cocok sama ?route=/?alambora=)
// ==========================================================
function resolveRoute() {
  const params = new URLSearchParams(location.search);
  if (params.has("route")) return params.get("route");
  if (params.has("alambora")) return params.get("alambora");
  if (window.AlamViewer?.route) return window.AlamViewer.route;
  return "butak-via-panderman";
}

window.ALAM.landing.routeId = resolveRoute();

// ==========================================================
// LOADER
// ==========================================================
function showLoader(visible) {
  const l = document.getElementById("loader");
  if (!l) return;
  l.style.display = visible ? "flex" : "none";
}

// ==========================================================
// INISIALISASI
// ==========================================================
async function init() {
  const route = window.ALAM.landing.routeId;
  try {
    const ids = { route: window.ALAM.landing.routes.length, poi: 0, walk: 0, km: 0 };
    window.ALAM.landing.state.ids = ids;
    for (const r of window.ALAM.landing.routes) {
      const res = await fetch(r.uri);
      const json = await res.json();
      ids.route = json.id || ids.route;
      ids.poi = (json.stats?.points || 0) + ids.poi;
      ids.walk = (json.stats?.distance_km || 0) + ids.walk;
      ids.km = json.stats?.distance_km || 0;
      window.ALAM.landing.state.routes.push({ ...r, ...json });
    }
    window.ALAM.landing.state.loading = false;
    document.title = "Alam Viewer — Nyasar Nyaman";
    renderRouteCards();
    renderStats(window.ALAM.landing.state.routes);
    document.querySelectorAll('.route-card').forEach(card => {
      const slug = card.dataset.slug || card.querySelector(".route-slug")?.textContent;
      if (slug) {
        const map = L.map(`route-preview-${slug}`, { scrollWheelZoom: false, attributionControl: false });
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 18 }).addTo(map);
        fetch(`https://raw.githubusercontent.com/akhyarulf/alam/main/data/${slug}/track.geojson`)
          .then(r => r.json())
          .then(data => {
            if (data.features?.length) L.geoJSON(data, {
              style: { color: "#5a7562", weight: 3, fillColor: "#5a7562", fillOpacity: 0.08 },
              onEachFeature: (f, l) => l.bindPopup(f.properties?.name || "")
            }).addTo(map);
          })
          .catch(() => {});
      }
    });
    const heroMap = document.getElementById("hero-map");
    if (heroMap) {
      // keep existing hero map if any
    }
  } catch (e) {
    window.ALAM.landing.state.error = e;
    window.ALAM.landing.state.loading = false;
  }
}

// run
init();
