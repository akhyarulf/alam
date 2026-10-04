# Alam Viewer 🥾

Peta interaktif jalur pendakian — bagian dari **Nyasar Nyaman** (nyasarnyaman.my.id).
Stark JavaScript murni + Leaflet, tanpa framework, tanpa build step.

Live:
- Domain: <https://alam.nyasarnyaman.my.id/>
- GitHub Pages fallback: <https://akhyarulf.github.io/alam/>

## Struktur Repo

```
alam/
├── index.html        # landing page (daftar jalur, statistik, embed)
├── viewer.html       # viewer (halaman pemutaran jalur)
├── upload.html       # uploader browser: GPX -> commit ke data/
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── landing.css
│   ├── img/
│   │   └── favicon.svg
│   └── js/
│       ├── app.js
│       ├── chart.js
│       ├── download.js
│       ├── embed-sync.js
│       ├── landing.js
│       ├── loader.js
│       ├── map.js
│       ├── stats.js
│       ├── theme.js
│       ├── utils.js
│       └── waypoint.js
├── config.js         # sumber data: githubUser / githubRepo / githubBranch / dataFolder
├── data/
│   └── <slug>/
│       ├── manifest.json   # metadata + statistik
│       ├── track.geojson   # garis jalur untuk peta
│       └── track.json      # format lengkap engine (meta, stats, waypoints, segments)
├── .gitignore
└── README.md
```

> Catatan: `engine/` dan `alam-viewer/` tidak ada di repo ini lagi. Repo ini adalah
> static site + `data/<slug>/`. Semua URL data dan embed sudah dipindahkan ke
> `akhyarulf/alam`, `main`, `data/`.

## Cara Ganti Jalur / Route

`?route=<slug>` dipakai untuk memilih jalur.

Contoh:
- https://alam.nyasarnyaman.my.id/viewer.html?route=butak-via-panderman
- https://alam.nyasarnyaman.my.id/viewer.html?route=butak-via-panderman&theme=dark

Halaman `/` adalah landing page: daftar jalur, statistik, dan generator kode embed.

Tanpa parameter, versi default menggunakan `defaultRoute` di `config.js`:
- `butak-via-panderman`

### Format `manifest.json`

Setiap `data/<slug>/` harus memiliki:

```json
{
  "id": "slugsatu",
  "engine": {
    "name": "Alam Engine",
    "version": "1.4.0"
  },
  "track": {
    "name": "Jalur ...",
    "mountain": "Gunung ...",
    "route": "Jalur ..."
  },
  "stats": {
    "points": 434,
    "distance_km": 5.92,
    "gain": 1410,
    "loss": 62,
    "highest": 3250.99,
    "lowest": 1900.3,
    "start": 1900.3,
    "finish": 3247.68
  },
  "viewer": {
    "json": "track.json",
    "geojson": "track.geojson"
  }
}
```

Referensi lengkap:
- https://raw.githubusercontent.com/akhyarulf/alam/main/data/<slug>/manifest.json
- https://raw.githubusercontent.com/akhyarulf/alam/main/data/<slug>/track.json
- https://raw.githubusercontent.com/akhyarulf/alam/main/data/<slug>/track.geojson

## Fitur

- **Viewer statis**: dibuka dari GitHub Pages, no `npm install`, no `vite build`.
- **Data dari GitHub raw**: semua `track.json`, `track.geojson`, dan `manifest.json`
  diambil lewat `config.js` → `rawBase`/`manifestURL`/`geojsonURL`.
- **Uploader browser**: `upload.html` memproses GPX 100% di browser
  (`@mapbox/togeojson` + Turf.js), lalu commit ke `data/<slug>/` melalui GitHub API.
- **Theme dark/light**: dikontrol di `viewer.html` / `index.html` oleh `?theme=dark|light` dan sinkron
  dengan iframe parent via `embed-sync.js`.
- **Download**: GPX autorun / KML panggilan tambahan dapat diunduh dari `data/<slug>/`.

## Embed di Blog

```html
<iframe
  src="https://alam.nyasarnyaman.my.id/viewer.html?route=butak-via-panderman"
  style="width:100%;height:600px;border:0;border-radius:10px"
  loading="lazy"
></iframe>
```

- `?route=<slug>` memilih jalur; tanpa parameter memakai `defaultRoute` di `config.js`.
- Tambah `&theme=dark` / `&theme=light` biar senada blog — viewer juga auto-sinkron
  tema halaman parent via `postMessage`.

## Upload Data Baru

Gunakan uploader di:

- https://alam.nyasarnyaman.my.id/upload.html

1. Buka uploader.
2. Upload file GPX — nama/gunung/jalur terdeteksi otomatis, slug dibuat otomatis
   (format: `gunung-` dibuang → `{gunung}-via-{jalur}`).
3. Tempel **GitHub fine-grained PAT** (repo ini saja, permission **Contents:
   Read and write**, pakai expiry). Opsional diingat di `localStorage`.
4. Klik **Publish** → 3 file (`track.json`, `track.geojson`, `manifest.json`) ter-commit
   ke `data/<slug>/`.

Setelah publish, viewer langsung bisa dibuka lewat `?route=<slug>`.

## Catatan Penting

- **Domain production**: `alam.nyasarnyaman.my.id` sudah mengarah ke
  `https://akhyarulf.github.io/alam/`.
- **Repo**: `akhyarulf/alam`, branch `main`.
- **Data folder**: `data/`.
- URL `?route=<slug>` tetap dipakai. Jangan ubah polanya agar embed blog dan history
  tetap bekerja.
- `engine/` hanyalah referensi algoritma (parsing, cleaning, stats, segmen). Di
  production, logika ini sudah direplikasi di `upload.html`.

## Daftar Jalur Saat Ini

- `butak-via-panderman` — Gunung Butak via Panderman
- `lawu-via-cemoro-sewu` — Lawu via Cemoro Sewu

## Roadmap / Follow-up (rekomendasi, belum diimplementasikan)

- Menampilkan daftar jalur (slug, mountain, route, distance, gain/loss) di halaman utama.
- Menambahkan tombol copy embed dari halaman detail.
- Menambah halaman jumlah terpendek: `viewer.html?route=<slug>` detail.
- Menambahkan validasi schema `manifest.json` lebih ketat di `upload.html`.
- Menambahkan notifikasi upload progress per file.
- Menghapus data lama/placeholder `exports` dari `manifest.json` jika ingin lebih clean.
- Menyesuaikan `README.md` jika fungsi `engine/` dipakai lebih lanjut di pipeline internal.

## Files

- `index.html` — landing page
- `viewer.html` — viewer jalur (`viewer.html?route=<slug>`)
- `upload.html` — uploader
- `config.js` — config GitHub Pages data
- `assets/js/*.js` — viewer modules
- `assets/js/landing.js` — script landing page (daftar jalur + peta mini)
- `assets/css/style.css` — viewer styles
- `assets/css/landing.css` — landing page styles (standalone)
- `data/*/manifest.json`, `track.json`, `track.geojson` — jalur data
