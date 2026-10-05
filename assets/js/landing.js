/* ==========================================
 Alam — Landing Page
 ==========================================
 Data   : data/routes.json (index, satu request untuk semua jalur)
            + data/<slug>/track.geojson (hanya saat kartu dilihat)
            Fallback : manifest per slug + ROUTE_SLUGS
            (lokal dulu, remote CONFIG.rawBase sebagai cadangan)
 Peta   : Leaflet
 ========================================== */

"use strict";

(function () {

  /* ==========================================================
     KONFIGURASI
     ROUTE_SLUGS hanya dipakai sebagai cadangan kalau
     data/routes.json belum ada (mis. workflow belum pernah jalan).
     Jalur baru tidak perlu ditambah di sini lagi.
     ========================================================== */
  const ROUTE_SLUGS = [
    "lawu-via-cemoro-sewu",
  ];

  const THEME_KEY = "alam-theme";
  const BASE = (window.CONFIG && window.CONFIG.rawBase) || null;

  /* Basemap tanpa API key — CARTO sekarang mewajibkan key, jadi pakai
   OpenTopoMap (terang, topografis) dan Esri Dark Gray (gelap),
   sama seperti layer yang dipakai viewer. */
  const tiles = {
    light: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      maxZoom: 17,
      attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    dark: {
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      maxZoom: 16,
      attribution: '&copy; Esri, HERE, Garmin &copy; OpenStreetMap contributors',
    },
  };

  const state = {
    routes: [],
    maps: [],
    theme: "light",
    source: null, // "index" | "manifest"
  };

  /* ==========================================================
     UTIL
     ========================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const nfInt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtInt = (n) => (Number.isFinite(n) ? nfInt.format(Math.round(n)) : "–");
  const fmtKm = (n) => (Number.isFinite(n) ? `${nf2.format(n)} km` : "–");
  const fmtM = (n) => (Number.isFinite(n) ? `+${fmtInt(n)} m` : "–");
  const fmtElev = (n) => (Number.isFinite(n) ? `${nfInt.format(Math.round(n))} mdpl` : "–");

  const slugToTitle = (slug) =>
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  function localUrl(slug, file) {
    return `data/${slug}/${file}`;
  }

  function remoteUrl(slug, file) {
    return BASE ? `${BASE}/${slug}/${file}` : null;
  }

  /** Coba beberapa URL berurutan; kembali hasil fetch pertama yang sukses. */
  async function fetchFirst(urls) {
    const list = urls.filter(Boolean);
    let lastError = null;

    for (const url of list) {
      try {
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("tidak ada sumber data");
  }

  function loadManifest(slug) {
    return fetchFirst([localUrl(slug, "manifest.json"), remoteUrl(slug, "manifest.json")]);
  }

  /** Index daftar jalur: satu request untuk seluruh koleksi. */
  function loadRouteIndex() {
    return fetchFirst(["data/routes.json", BASE ? `${BASE}/routes.json` : null]);
  }

  /** Ubah entri index menjadi bentuk yang dipakai komponen di bawah. */
  function fromIndex(entry) {
    return {
      slug: entry.slug,
      track: {
        name: entry.name || slugToTitle(entry.slug),
        mountain: entry.mountain || "",
        route: entry.route || "",
      },
      stats: {
        points: entry.points,
        distance_km: entry.distance_km,
        gain: entry.gain,
        loss: entry.loss,
        highest: entry.highest,
        lowest: entry.lowest,
        center: entry.center || null,
      },
    };
  }

  /**
   * Sumber daftar jalur:
   * 1. data/routes.json (dibuat otomatis oleh scripts/build-routes-index.js)
   * 2. fallback — baca manifest tiap slug di ROUTE_SLUGS
   */
  async function loadRoutes() {
    try {
      const index = await loadRouteIndex();
      const list = Array.isArray(index && index.routes)
        ? index.routes.filter((r) => r && r.slug)
        : [];

      if (list.length) {
        state.source = "index";
        return list.map(fromIndex);
      }
    } catch (err) {
      console.warn("Daftar jalur dari routes.json tidak dipakai:", err.message);
    }

    const results = await Promise.all(
      ROUTE_SLUGS.map((slug) =>
        loadManifest(slug)
          .then((manifest) => ({ slug, manifest, ok: true }))
          .catch(() => ({ slug, manifest: null, ok: false }))
      )
    );

    state.source = "manifest";
    return results
      .filter((r) => r.ok)
      .map((r) => Object.assign({ slug: r.slug }, r.manifest));
  }

  function loadGeoJSON(slug) {
    return fetchFirst([localUrl(slug, "track.geojson"), remoteUrl(slug, "track.geojson")]);
  }

  /* ==========================================================
     TEMA
     ========================================================== */
  function initialTheme() {
    const param = new URLSearchParams(location.search).get("theme");
    if (param === "dark" || param === "light") return param;

    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (_) { /* storage diblokir */ }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme, persist) {
    state.theme = theme;
    document.body.classList.toggle("dark", theme === "dark");
    $("meta[name='theme-color']").setAttribute("content", theme === "dark" ? "#14181a" : "#2f4638");

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (_) { /* abaikan */ }
    }

    $$("#btn-theme").forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });

    // tile layer peta ikut tema
    state.maps.forEach((m) => {
      if (!m || !m.tileLayer) return;
      const t = tiles[theme === "dark" ? "dark" : "light"];
      m.tileLayer.options.maxZoom = t.maxZoom;
      m.tileLayer.setUrl(t.url);
      if (typeof m.tileLayer.redraw === "function") m.tileLayer.redraw();
    });
  }

  function initTheme() {
    applyTheme(initialTheme(), false);

    const btn = $("#btn-theme");
    if (btn) {
      btn.addEventListener("click", () => {
        applyTheme(state.theme === "dark" ? "light" : "dark", true);
      });
    }
  }

  /* ==========================================================
     PETA
     ========================================================== */
  const trackStyle = (weight) => ({
    color: "#3f6b52",
    weight,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round",
  });

  function baseTile() {
    const t = tiles[state.theme === "dark" ? "dark" : "light"];
    return L.tileLayer(t.url, { maxZoom: t.maxZoom, attribution: t.attribution });
  }

  const waypointStyle = {
    radius: 3.5,
    color: "#2f4638",
    weight: 1.4,
    fillColor: "#f2c14e",
    fillOpacity: 0.95,
  };

  /** Pasang garis jalur, waypoint, dan marker start/finish pada peta. */
  function paintTrack(map, geo, weight) {
    const lineStarts = [];
    const lineEnds = [];

    const layer = L.geoJSON(geo, {
      style: (feature) =>
        feature.geometry && feature.geometry.type === "LineString"
          ? trackStyle(weight)
          : { stroke: false, ...waypointStyle },
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, waypointStyle),
      onEachFeature: (feature, lyr) => {
        const geometry = feature.geometry;

        if (geometry && geometry.type === "LineString" && geometry.coordinates.length) {
          const c = geometry.coordinates;
          lineStarts.push([c[0][1], c[0][0]]);
          lineEnds.push([c[c.length - 1][1], c[c.length - 1][0]]);
        }

        const name = (feature.properties && (feature.properties.name || feature.properties.route)) || "";
        if (name) lyr.bindPopup(name);
      },
    }).addTo(map);

    if (lineStarts.length) {
      L.circleMarker(lineStarts[0], {
        radius: 5.5, color: "#2f4638", weight: 2, fillColor: "#f2c14e", fillOpacity: 1,
      }).bindTooltip("Start").addTo(map);
    }

    if (lineEnds.length) {
      L.circleMarker(lineEnds[lineEnds.length - 1], {
        radius: 5.5, color: "#6d2424", weight: 2, fillColor: "#d94f4f", fillOpacity: 1,
      }).bindTooltip("Finish").addTo(map);
    }

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [12, 12] });
    }
  }

  /** Peta hero: lebih interaktif, ada tombol zoom. */
  function initHeroMap(route) {
    const node = $("#hero-map");
    if (!node || typeof L === "undefined") return null;

    const stats = (route && route.stats) || {};
    const center = stats.center || null;

    const map = L.map(node, {
      center: center ? [center.lat, center.lng] : [-7.8, 112.4],
      zoom: 12,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    const tileLayer = baseTile().addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    state.maps.push({ map, tileLayer });

    loadGeoJSON(route.slug)
      .then((geo) => {
        paintTrack(map, geo, 5);
        setTimeout(() => map.invalidateSize(), 250);
      })
      .catch(() => {
        if (center) {
          L.circleMarker([center.lat, center.lng], {
            radius: 8, color: "#3f6b52", weight: 3, fillOpacity: 0.25,
          }).addTo(map);
        }
      });

    return map;
  }

  /** Peta kecil di dalam kartu: non-interaktif supaya klik tetap membuka viewer. */
  function initPreviewMap(node, route) {
    const stats = (route && route.stats) || {};
    const center = stats.center || null;

    const map = L.map(node, {
      center: center ? [center.lat, center.lng] : [-7.8, 112.4],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    const tileLayer = baseTile().addTo(map);
    state.maps.push({ map, tileLayer });

    // cegah klik/seret pada peta agar tidak memicu navigasi kartu
    L.DomEvent.disableClickPropagation(node);
    L.DomEvent.disableScrollPropagation(node);

    loadGeoJSON(route.slug)
      .then((geo) => {
        paintTrack(map, geo, 3.5);
        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch(() => {
        if (center) {
          L.circleMarker([center.lat, center.lng], {
            radius: 6, color: "#3f6b52", weight: 2, fillOpacity: 0.3,
          }).addTo(map);
        }
      });
  }

  /** Peta cukup dibuat saat kartunya benar-benar terlihat. */
  function observePreviews() {
    const nodes = $$("[data-preview]");

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(boot);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        boot(entry.target);
      });
    }, { rootMargin: "200px" });

    nodes.forEach((node) => io.observe(node));

    function boot(node) {
      if (node.dataset.ready === "1") return;
      node.dataset.ready = "1";
      const route = state.routes.find((r) => r.slug === node.dataset.preview);
      if (route) initPreviewMap(node, route);
      node.classList.add("is-loaded");
    }
  }

  /* ==========================================================
     KARTU JALUR
     ========================================================== */
  function cardTemplate(route, index) {
    const stats = route.stats || {};
    const track = route.track || {};

    const a = document.createElement("a");
    a.className = "route-card reveal";
    a.href = `viewer.html?route=${encodeURIComponent(route.slug)}`;
    a.style.setProperty("--delay", `${Math.min(index, 6) * 60}ms`);
    a.dataset.slug = route.slug;
    a.setAttribute("aria-label", `Buka viewer ${track.name || slugToTitle(route.slug)}`);

    a.innerHTML = `
      <div class="route-map">
        <div class="route-map-canvas" data-preview="${route.slug}"></div>
        <span class="route-map-badge">${track.mountain || slugToTitle(route.slug)}</span>
      </div>
      <div class="route-body">
        <span class="route-slug">${route.slug}</span>
        <h3 class="route-title">${track.name || slugToTitle(route.slug)}</h3>
        <p class="route-meta">
          <span><span class="route-meta-ico" aria-hidden="true">▸</span>${track.route || "—"}</span>
        </p>
        <ul class="route-stats">
          <li><strong>${fmtKm(Number(stats.distance_km))}</strong><span>jarak</span></li>
          <li><strong>${fmtM(Number(stats.gain))}</strong><span>gain</span></li>
          <li><strong>${fmtElev(Number(stats.highest))}</strong><span>tertinggi</span></li>
        </ul>
      </div>
      <span class="route-go" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
      </span>
    `;

    return a;
  }

  function renderRoutes() {
    const grid = $("#route-grid");
    if (!grid) return;

    grid.textContent = "";

    if (!state.routes.length) {
      const empty = $("#route-empty");
      if (empty) empty.hidden = false;
      return;
    }

    const active = new URLSearchParams(location.search).get("route");
    const frag = document.createDocumentFragment();

    state.routes.forEach((route, i) => {
      const card = cardTemplate(route, i);
      if (route.slug === active) card.classList.add("is-active");
      frag.appendChild(card);
    });

    grid.appendChild(frag);
    observePreviews();
  }

  function skeletonCards(count) {
    const grid = $("#route-grid");
    if (!grid) return;

    grid.textContent = "";
    for (let i = 0; i < count; i += 1) {
      const box = document.createElement("div");
      box.className = "route-card route-card--skeleton";
      box.innerHTML = `
        <div class="route-map skeleton"></div>
        <div class="route-body">
          <span class="skeleton skeleton-line w-40"></span>
          <span class="skeleton skeleton-line w-80"></span>
          <span class="skeleton skeleton-line w-60"></span>
        </div>
      `;
      grid.appendChild(box);
    }
  }

  /* ==========================================================
     STATISTIK
     ========================================================== */
  function renderStats() {
    const sum = (key) =>
      state.routes.reduce((acc, r) => acc + (Number(r.stats && r.stats[key]) || 0), 0);

    const count = state.routes.length;
    const distance = sum("distance_km");
    const highest = state.routes.reduce(
      (acc, r) => Math.max(acc, Number(r.stats && r.stats.highest) || 0),
      0,
    );

    const set = (sel, value) => {
      const node = $(sel);
      if (node) node.textContent = value;
    };

    set("#stat-jalur", `${count}`);
    set("#stat-titik", `${fmtInt(sum("points"))}`);
    set("#stat-jarak", fmtKm(distance));
    set("#stat-elevasi", count ? fmtElev(highest) : "–");

    // chip ringkasan di hero
    const chips = $("#hero-chips");
    if (!chips) return;

    const items = count
      ? [
        { v: `${count}`, l: "jalur" },
        { v: fmtKm(distance), l: "total jarak" },
        { v: fmtElev(highest), l: "titik tertinggi" },
      ]
      : [{ v: "–", l: "jalur" }];

    chips.textContent = "";
    items.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.className = "hero-chip";
      wrap.innerHTML = `<strong>${item.v}</strong><span>${item.l}</span>`;
      chips.appendChild(wrap);
    });
  }

  /* ==========================================================
     HERO
     ========================================================== */
  function renderHero() {
    const featured =
      state.routes.find((r) => r.slug === window.CONFIG?.route) || state.routes[0];

    const label = $("#hero-map-label");
    const link = $("#hero-map-link");
    const cta = $("[data-hero-cta]");

    if (featured) {
      const name = (featured.track && featured.track.name) || slugToTitle(featured.slug);
      if (label) label.textContent = name;
      if (cta) cta.href = `viewer.html?route=${encodeURIComponent(featured.slug)}`;
    } else {
      if (label) label.textContent = "Peta belum tersedia";
    }

    if (link && featured) {
      link.href = `viewer.html?route=${encodeURIComponent(featured.slug)}`;
    }

    const heroRoute = featured || (ROUTE_SLUGS[0] ? { slug: ROUTE_SLUGS[0], stats: {} } : null);
    if (heroRoute) initHeroMap(heroRoute);
  }

  /* ==========================================================
     EMBED
     ========================================================== */
  function embedSource() {
    const origin = location.origin && location.origin !== "null"
      ? location.origin
      : "https://alam.nyasarnyaman.my.id";

    const page = new URL("viewer.html", origin + location.pathname).href;
    return page;
  }

  function initEmbed() {
    const select = $("#embed-route");
    const themeSelect = $("#embed-theme");
    const textarea = $("#embed-code");
    const btn = $("#btn-copy-embed");
    const status = $("#embed-status");
    if (!select || !textarea || !btn) return;

    const slugs = state.routes.length
      ? state.routes.map((r) => r.slug)
      : ROUTE_SLUGS;

    slugs.forEach((slug) => {
      const route = state.routes.find((r) => r.slug === slug);
      const name = (route && route.track && route.track.name) || slugToTitle(slug);
      const opt = document.createElement("option");
      opt.value = slug;
      opt.textContent = name;
      select.appendChild(opt);
    });

    const active = new URLSearchParams(location.search).get("route");
    if (active && slugs.includes(active)) select.value = active;

    if (themeSelect) {
      const param = new URLSearchParams(location.search).get("theme");
      if (param === "dark" || param === "light") themeSelect.value = param;
      themeSelect.addEventListener("change", build);
    }

    function build() {
      const slug = select.value || slugs[0];
      const src = new URL(embedSource());
      src.searchParams.set("route", slug);
      if (themeSelect && themeSelect.value) src.searchParams.set("theme", themeSelect.value);

      textarea.value =
        `<iframe\n` +
        `  src="${src.href}"\n` +
        `  style="width:100%;height:1300px;border:0;border-radius:12px;overflow:hidden"\n` +
        `  loading="lazy"\n` +
        `  scrolling="no"\n` +
        `  allowfullscreen\n` +
        `  title="Viewer jalur ${slug}"\n` +
        `></iframe>`;

      if (status) status.textContent = "";
    }

    select.addEventListener("change", build);

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        setStatus("Kode embed disalin ke clipboard.");
      } catch (_) {
        textarea.removeAttribute("readonly");
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const ok = document.execCommand && document.execCommand("copy");
        textarea.setAttribute("readonly", "");
        setStatus(ok ? "Kode embed disalin ke clipboard." : "Gagal menyalin otomatis — blok kodenya lalu salin manual (Ctrl/Cmd + C).");
      }
    });

    function setStatus(text) {
      if (!status) return;
      status.textContent = text;
      btn.textContent = text.startsWith("Kode") ? "Tersalin" : btn.textContent;
      if (text.startsWith("Kode")) {
        setTimeout(() => {
          btn.textContent = "Salin kode";
        }, 1800);
      }
    }

    build();
  }

  /* ==========================================================
     REVEAL ON SCROLL
     ========================================================== */
  function initReveal() {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      $$(".reveal").forEach((n) => n.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    $$(".reveal").forEach((n) => io.observe(n));
  }

  /* ==========================================================
     INIT
     ========================================================== */
  async function init() {
    initTheme();
    skeletonCards(ROUTE_SLUGS.length);

    state.routes = await loadRoutes();

    renderRoutes();
    renderStats();
    renderHero();
    initEmbed();
    initReveal();

    window.addEventListener("resize", () => {
      state.maps.forEach((m) => m.map && m.map.invalidateSize());
    });
  }

  window.ALAM = window.ALAM || {};
  window.ALAM.landing = { routes: state.routes, state, init };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();