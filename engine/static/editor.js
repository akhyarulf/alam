"use strict";

const state = {
  filename: null,
  totalPoints: 0,
  track: [],
  waypoints: [],      // waypoint hasil generate_waypoints (start/finish/highest)
  extraWaypoints: [],  // waypoint bikinan user (klik map)
};

const map = L.map("map").setView([-7.9, 112.5], 9);

L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "OpenTopoMap"
}).addTo(map);

let trackLayer = null;
let waypointMarkers = [];

// ==========================================================
// UPLOAD FILE
// ==========================================================

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  state.filename = data.filename;
  document.getElementById("fileList").textContent = "📄 " + data.filename;

  state.extraWaypoints = [];
  await refreshPreview();
});

// ==========================================================
// TRIM SLIDER
// ==========================================================

const trimStart = document.getElementById("trimStart");
const trimEnd = document.getElementById("trimEnd");

trimStart.addEventListener("input", () => {
  document.getElementById("trimStartVal").textContent = trimStart.value;
});
trimEnd.addEventListener("input", () => {
  document.getElementById("trimEndVal").textContent = trimEnd.value;
});

trimStart.addEventListener("change", refreshPreview);
trimEnd.addEventListener("change", refreshPreview);

// ==========================================================
// PREVIEW: panggil /api/preview, gambar ulang peta
// ==========================================================

async function refreshPreview() {

  if (!state.filename) return;

  const res = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: state.filename,
      trim_start: parseInt(trimStart.value || 0),
      trim_end: parseInt(trimEnd.value || 0),
    })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("stats").innerHTML = `<b>⚠️ Error</b>${data.error}`;
    return;
  }

  state.track = data.track;
  state.waypoints = data.waypoints;
  state.totalPoints = data.total_points;

  trimStart.max = Math.max(0, data.total_points - 2);
  trimEnd.max = Math.max(0, data.total_points - 2);

  document.getElementById("fieldName").value = data.name;
  document.getElementById("fieldMountain").value = data.mountain;
  document.getElementById("fieldRoute").value = data.route;
  document.getElementById("fieldRouteId").value = data.route_id;

  document.getElementById("stats").innerHTML = `
    <b>${data.name}</b>
    Jarak: ${data.stats.distance_km} km<br>
    Naik: ${data.stats.gain} m &nbsp; Turun: ${data.stats.loss} m<br>
    Titik: ${data.track.length} / ${data.total_points}
  `;

  drawTrack();
  drawWaypoints();
  buildFormatList();

  document.getElementById("processBtn").disabled = false;
}

function drawTrack() {

  if (trackLayer) map.removeLayer(trackLayer);

  const latlngs = state.track.map(p => [p.lat, p.lng]);

  trackLayer = L.polyline(latlngs, { color: "#e65100", weight: 4 }).addTo(map);

  map.fitBounds(trackLayer.getBounds(), { padding: [20, 20] });

  trackLayer.on("click", (e) => {
    addWaypointAt(e.latlng.lat, e.latlng.lng);
  });
}

function drawWaypoints() {

  waypointMarkers.forEach(m => map.removeLayer(m));
  waypointMarkers = [];

  const all = [...state.waypoints, ...state.extraWaypoints];

  all.forEach((wp, idx) => {
    const marker = L.marker([wp.lat, wp.lng]).addTo(map).bindPopup(wp.name);
    waypointMarkers.push(marker);
  });

  renderWaypointList();
}

// update marker popup teks tanpa render ulang list (biar input gak kehilangan fokus)
function updateMarkerLabel(offset, idx, name) {
  const marker = waypointMarkers[offset + idx];
  if (marker) marker.setPopupContent(name);
}

function renderWaypointList() {

  const box = document.getElementById("waypointList");
  box.innerHTML = "";

  state.waypoints.forEach(wp => {
    const row = document.createElement("div");
    row.className = "waypoint-row";
    row.innerHTML = `<span>🔒 ${wp.name} (${wp.ele ?? "-"} mdpl)</span>`;
    box.appendChild(row);
  });

  const offset = state.waypoints.length;

  state.extraWaypoints.forEach((wp, i) => {
    const row = document.createElement("div");
    row.className = "waypoint-row";

    const up = document.createElement("button");
    up.textContent = "↑";
    up.title = "Naikkan urutan";
    up.disabled = i === 0;
    up.addEventListener("click", () => {
      [state.extraWaypoints[i - 1], state.extraWaypoints[i]] =
        [state.extraWaypoints[i], state.extraWaypoints[i - 1]];
      drawWaypoints();
    });

    const down = document.createElement("button");
    down.textContent = "↓";
    down.title = "Turunkan urutan";
    down.disabled = i === state.extraWaypoints.length - 1;
    down.addEventListener("click", () => {
      [state.extraWaypoints[i + 1], state.extraWaypoints[i]] =
        [state.extraWaypoints[i], state.extraWaypoints[i + 1]];
      drawWaypoints();
    });

    const input = document.createElement("input");
    input.type = "text";
    input.value = wp.name;
    // cuma update state + label marker, JANGAN render ulang list ini
    input.addEventListener("input", () => {
      wp.name = input.value;
      updateMarkerLabel(offset, i, wp.name);
    });

    const del = document.createElement("button");
    del.textContent = "✕";
    del.addEventListener("click", () => {
      state.extraWaypoints.splice(i, 1);
      drawWaypoints();
    });

    row.appendChild(up);
    row.appendChild(down);
    row.appendChild(input);
    row.appendChild(del);
    box.appendChild(row);
  });
}

function addWaypointAt(lat, lng) {

  // cari titik terdekat di track biar elevasinya akurat
  let nearest = state.track[0];
  let min = Infinity;

  for (const p of state.track) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d < min) { min = d; nearest = p; }
  }

  state.extraWaypoints.push({
    name: `Waypoint ${state.extraWaypoints.length + 1}`,
    lat: nearest.lat,
    lng: nearest.lng,
    ele: nearest.ele
  });

  drawWaypoints();
}

// ==========================================================
// FORMAT CHECKBOX
// ==========================================================

function buildFormatList() {

  const box = document.getElementById("formatList");
  if (box.dataset.built) return;

  box.innerHTML = "";

  (window.OUTPUT_FORMATS || []).forEach(fmt => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${fmt}" checked> .${fmt}`;
    box.appendChild(label);
  });

  box.dataset.built = "1";
}

// ==========================================================
// PROSES (export + upload)
// ==========================================================

document.getElementById("processBtn").addEventListener("click", async () => {

  const formats = Array.from(
    document.querySelectorAll("#formatList input:checked")
  ).map(el => el.value);

  const payload = {
    filename: state.filename,
    trim_start: parseInt(trimStart.value || 0),
    trim_end: parseInt(trimEnd.value || 0),
    name: document.getElementById("fieldName").value,
    mountain: document.getElementById("fieldMountain").value,
    route: document.getElementById("fieldRoute").value,
    waypoints: state.extraWaypoints,
    formats: formats,
    upload: document.getElementById("uploadToggle").checked
  };

  const btn = document.getElementById("processBtn");
  const resultBox = document.getElementById("result");

  btn.disabled = true;
  btn.textContent = "⏳ Memproses...";
  resultBox.innerHTML = "";

  try {
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.error) {
      resultBox.innerHTML = `<div class="err">⚠️ ${data.error}</div>`;
      return;
    }

    let html = `<div class="ok">✅ Selesai: ${data.route_id}</div>`;

    (data.outputs || []).forEach(o => {
      const link = o.html_url || o.raw_url || o.url || null;
      if (link) {
        html += `<a href="${link}" target="_blank">${o.destination}: ${o.file}</a>`;
      } else {
        html += `<div>${o.destination}: ${o.file} (${o.status})</div>`;
      }
    });

    resultBox.innerHTML = html;

  } catch (err) {
    resultBox.innerHTML = `<div class="err">⚠️ ${err}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 Proses & Simpan";
  }
});

// ==========================================================
// LOAD DAFTAR FILE YANG SUDAH ADA
// ==========================================================

(async function loadExistingFiles() {
  const res = await fetch("/api/files");
  const data = await res.json();
  if (data.files && data.files.length) {
    document.getElementById("fileList").textContent =
      "File tersedia: " + data.files.join(", ");
  }
})();
