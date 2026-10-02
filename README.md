# Alam Viewer 🥾

Peta interaktif jalur pendakian — bagian dari **Nyasar Nyaman**
(nyasarnyaman.my.id). JS murni + Leaflet, tanpa framework, tanpa build step.

Live: <https://akhyarulf.github.io/alam-viewer/>

## Struktur Repo

```
alam-viewer/
├── index.html        # viewer (halaman utama)
├── assets/           # JS + CSS viewer (Leaflet & Chart.js via CDN)
├── config.js         # sumber data: githubUser / githubRepo / githubBranch / dataFolder
├── data/             # DATA JALUR — satu folder per jalur
│   └── <slug>/
│       ├── manifest.json   # metadata + statistik (format contoh: butak-via-panderman)
│       ├── track.geojson   # garis jalur untuk peta
│       └── track.json      # format lengkap engine (meta, stats, waypoints, segments)
├── engine/           # referensi pipeline Python (GPX -> data), tidak jalan di production
└── upload.html       # uploader browser: GPX -> commit ke data/
```

Viewer mengambil data dari:

```
https://raw.githubusercontent.com/akhyarulf/alam-viewer/main/data/<slug>/...
```

Sumbernya diatur di `config.js` (getter `rawBase`, `manifestURL`,
`geojsonURL`); fallback hardcoded di `assets/js/app.js` mengarah ke sumber yang
sama, jadi keduanya konsisten.

## Nambah Jalur Baru

**Cara gampang — uploader browser (rekomendasi):**

1. Buka <https://akhyarulf.github.io/alam-viewer/upload.html>
2. Upload file GPX — nama/gunung/jalur terdeteksi otomatis, slug dibuat
   otomatis (format: `gunung-` dibuang → `{gunung}-via-{jalur}`) dan dicek
   langsung kalau sudah pernah dipakai.
3. Tempel **GitHub fine-grained PAT** (repo ini saja, permission
   **Contents: Read and write**, pakai expiry). Opsional diingat di
   localStorage browser.
4. Klik **Publish** → 3 file (`track.json`, `track.geojson`,
   `manifest.json`) ter-commit ke `data/<slug>/` → viewer langsung bisa
   dibuka lewat `?route=<slug>`.

GPX diproses 100% di browser (togeojson + Turf.js): pembersihan titik,
spike elevasi, jarak, gain/loss, bbox, dan segmen mengikuti logika
`engine/` — hasil manifest persis format Butak.

**Cara manual:** tiru struktur `data/butak-via-panderman/` (3 file di atas),
ganti isinya, lalu commit ke folder `data/<slug>/` baru.

## Embed di Blog

```html
<iframe src="https://akhyarulf.github.io/alam-viewer/?route=butak-via-panderman"
        style="width:100%;height:600px;border:0;border-radius:10px"
        loading="lazy"></iframe>
```

- `?route=<slug>` memilih jalur; tanpa parameter memakai `defaultRoute` di
  `config.js`.
- Tambah `&theme=dark` / `&theme=light` biar senada blog — viewer juga
  auto-sinkron tema halaman parent via postMessage.

## Catatan

- **Jangan rename repo** — URL Pages ini dipakai embed iframe di blog, dan
  URL pattern `?route=<slug>` tidak boleh berubah (sudah tersebar di artikel).
- Repo lama `alam-engine-data` statusnya **ARCHIVE** (bukan delete); sumber
  data final sekarang folder `data/` di repo ini.
- `engine/` hanya referensi algoritma (parsing, cleaning, stats, segmen);
  logikanya sudah direplikasi di `upload.html`.
- `token.json`, `credentials.json`, `client_secret*.json` tidak pernah
  di-commit (sudah diblokir `.gitignore`).
