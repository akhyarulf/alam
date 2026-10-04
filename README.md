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
│   ├── routes.json        # index daftar jalur (dibuat otomatis, dibaca landing)
│   └── <slug>/
│       ├── manifest.json   # metadata + statistik
│       ├── track.geojson   # garis jalur untuk peta
│       └── track.json      # format lengkap engine (meta, stats, waypoints, segments)
├── scripts/
│   └── build-routes-index.js  # scan data/*/manifest.json -> data/routes.json
├── .github/
│   └── workflows/
│       └── routes-index.yml   # jalankan script di atas tiap data/ berubah
├── .gitignore
└── README.md
```

> Catatan: `engine/` dan `alam-viewer/` tidak ada di repo ini lagi. Repo ini adalah
> static site + `data/<slug>/`. Semua URL data dan embed sudah dipindahkan ke
> `akhyarulf/alam`, `main`, `data/`.

## Cara Ganti Jalur / Route

`?route=<slug>` dipakai untuk memilih jalur.

Contoh:
- https://alam.nyasarnyaman.my.id/viewer.html?route=lawu-via-cemoro-sewu
- https://alam.nyasarnyaman.my.id/viewer.html?route=lawu-via-cemoro-sewu&theme=dark

Halaman `/` adalah landing page: daftar jalur, statistik, dan generator kode embed.

Tanpa parameter, versi default menggunakan `defaultRoute` di `config.js`:
- `lawu-via-cemoro-sewu`

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

> Angka `stats` di atas mengikuti data nyata `lawu-via-cemoro-sewu` (satu-satunya jalur yang masih ada).

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
  src="https://alam.nyasarnyaman.my.id/viewer.html?route=lawu-via-cemoro-sewu"
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

- `lawu-via-cemoro-sewu` — Lawu via Cemoro Sewu

> Jalur `butak-via-panderman` pernah ada sebagai data dummy dan sudah dihapus
> (lihat bagian Kekurangan & Rencana Perbaikan).

## Status Landing Page (2026-10-04)

Landing page sudah ditulis ulang dan **sudah terdeploy** di
`https://alam.nyasarnyaman.my.id/`:

- `index.html` mandiri: tidak lagi memakai `assets/css/style.css` (viewer stylesheet),
  hanya memuat Leaflet + `config.js` + `assets/js/landing.js`.
- Kartu jalur, peta mini, dan statistik dibangun dari `data/<slug>/manifest.json`
  (lokal dulu, fallback ke `CONFIG.rawBase`).
- Basemap tanpa API key: **OpenTopoMap** (terang) + **Esri Dark Gray Canvas** (gelap).
  CARTO tidak dipakai karena sekarang mewajibkan API key.
- URL aset di-version (`?v=3`) agar cache GitHub Pages tidak menahan versi lama.

Commit terkait: `f8240cb` (rewrite landing), `ca94a50` (cache-busting),
`7ed8972` (ganti basemap + anti overflow).

---

## Kekurangan & Rencana Perbaikan

Audit terakhir dilakukan pada 2026-10-04 terhadap `index.html`, `viewer.html`,
`upload.html`, `assets/js/*`, `assets/css/*`, dan `data/*`.

### A. Yang sudah beres

- Landing page merender: daftar jalur, peta (dengan `fitBounds`), marker
  start/finish, waypoint, statistik, dark mode, generator kode embed.
- Embed diarahkan ke `viewer.html` (sebelumnya ke `/` yang kini menjadi landing).
- Ubin peta tidak lagi ber-watermark "API KEY REQUIRED".

### B1. Kekurangan — yang dipakai sehari-hari

| # | Masalah | Dampak | Status |
|---|---------|--------|--------|
| 1 | Jalur baru **tidak otomatis muncul** di landing; slug masih ditulis manual di `assets/js/landing.js` (`ROUTE_SLUGS`). | Setelah upload GPX baru, harus tambah 1 baris JS. | **Selesai** — `data/routes.json` dibuat otomatis oleh `scripts/build-routes-index.js` via `.github/workflows/routes-index.yml` |
| 2 | `upload.html` **tidak punya satu pun `@media` query** → layout berdesakan di layar kecil. | Upload dari HP terasa sempit. | Belum dikerjakan |
| 3 | Tombol unduh GPX/KML **bergantung ke Google Drive** (`manifest.downloads.*`). | Kalau file Drive hilang/dibatasi, tombol mati. KML juga hanya ada kalau uploader berhasil menguggahnya. | Belum dikerjakan |

### B2. Kekurangan — viewer

| # | Masalah | Lokasi | Status |
|---|---------|--------|--------|
| 4 | Tidak ada tombol ganti tema (`#btn-theme` tidak pernah dibuat, padahal `theme.js` sudah siap). | `viewer.html` | Belum dikerjakan |
| 5 | `scrollWheelZoom` default Leaflet (`true`) → saat viewer di-embed, scroll halaman ikut terjerat di atas peta. | `assets/js/map.js` | Belum dikerjakan |
| 6 | `min-height:100vh` memaksa dokumen embedded setinggi viewport → ruang kosong/gulir dobel. | `assets/css/style.css` | Belum dikerjakan |
| 7 | Error masih pakai `alert()` + judul "Viewer Error" (Inggris). | `assets/js/app.js` | Belum dikerjakan |
| 8 | Bahasa bercampur: `Distance`, `Elevation Gain/Loss`, `Highest/Lowest Point` berdampingan dengan `Gunung`, `Jalur`, `Total Naik/Turun`. | `viewer.html` | Belum dikerjakan |
| 9 | Tidak ada pemilih jalur di dalam viewer; harus lewat `?route=` atau datang dari landing. | `viewer.html` | Belum dikerjakan |
| 10 | Tombol fullscreen gagal di iframe Blogger (snippet embed belum punya `allowfullscreen`). | `index.html` | Belum dikerjakan |
| 11 | Tombol toolbar hanya punya `title`, tanpa `aria-label`. | `viewer.html` | Belum dikerjakan |

### B3. Kekurangan — embed Blogger

| # | Masalah | Lokasi | Status |
|---|---------|--------|--------|
| 12 | Auto-height **tidak jalan** untuk snippet dari landing: `embed-sync.js` mengirim `{source:"alam",type:"resize"}`, tapi receiver-nya harus ada di theme Blogger (`index.xml`) dan tidak disertakan. | `assets/js/embed-sync.js` | Belum dikerjakan |
| 13 | Handshake tema tidak dijawab: `theme.js` mengirim `{source:"alam",type:"ready"}`, tetapi tidak ada skrip di sisi blog yang membalas `{source:"nyasar-blog",theme}`. | `assets/js/theme.js` | Belum dikerjakan |
| 14 | Iframe dipatok `height:600px` + `overflow:hidden` → jebakan scroll di tengah artikel. | `index.html` | Belum dikerjakan |

### B4. Kekurangan — data & dokumentasi

| # | Masalah | Lokasi | Status |
|---|---------|--------|--------|
| 15 | `track.json` (±92 KB total) **tidak pernah dibaca** halaman mana pun; uploader masih mem-publish-nya. | `data/*/track.json` | Belum dikerjakan |
| 16 | Viewer selalu ambil data dari `raw.githubusercontent.com` (`CONFIG.manifestURL`), landing dari lokal — sumber data tidak konsisten & bisa lebih lambat. | `assets/js/app.js`, `config.js` | Belum dikerjakan |
| 17 | `exports[]` di `manifest.json` Butak menyimpan path internal Windows (`output\\viewer\\...`). | — | **Selesai** — data dummy Butak dihapus |
| 18 | `engine.version` tidak sinkron antar jalur. | `data/*/manifest.json` | **Selesai untuk sekarang** — tersisa satu jalur (`lawu-via-cemoro-sewu`, versi `1.4.0`); perhatikan sinkronisasi saat menambah jalur baru |
| 19 | README contoh manifest menulis angka yang salah untuk jalurnya. | `README.md` | **Sudah diperbaiki** |

### B5. Kekurangan — polish situs

| # | Masalah | Status |
|---|---------|--------|
| 20 | Tidak ada `404.html` → tautan rusak tampil error GitHub. | Belum dikerjakan |
| 21 | Tidak ada `robots.txt` dan `sitemap.xml` untuk domain kustom. | Belum dikerjakan |
| 22 | Tidak ada Open Graph / Twitter Card → tidak ada preview saat link dibagikan. | Belum dikerjakan |
| 23 | Tidak ada `apple-touch-icon` / `webmanifest` → ikon "Add to Home Screen" memakai screenshot. | Belum dikerjakan |
| 24 | Tidak ada analytics (disarankan GoatCounter/Umami untuk situs statik). | Belum dikerjakan |

### C. Rencana perbaikan 1–4

**1. Jalur baru otomatis muncul di landing — ✅ SELESAI**
- `scripts/build-routes-index.js`: script Node tanpa dependency yang memindai
  `data/*/manifest.json` lalu menulis `data/routes.json` (slug, nama, gunung, jalur,
  points, distance_km, gain, loss, highest, lowest, center). Idempoten: perubahan
  hanya pada field `generated` tidak menghasilkan commit baru.
- `.github/workflows/routes-index.yml`: jalan di setiap push ke `main` yang menyentuh
  `data/**`, `scripts/build-routes-index.js`, atau workflow itu sendiri. Hanya commit
  ulang `data/routes.json` bila isinya berubah (menghindari loop). Ada juga
  `workflow_dispatch` untuk menjalankan manual.
- `assets/js/landing.js`: membaca `data/routes.json` dengan **satu request** untuk seluruh
  daftar; `track.geojson` per jalur tetap diambil saat kartu mendekati layar. Kalau
  `routes.json` tidak ada/gagal → fallback ke `ROUTE_SLUGS` + `manifest.json` seperti
  sebelumnya, jadi halaman tidak pernah rusak. Status sumber data terekspos di
  `window.ALAM.landing.state.source` (`"index"` atau `"manifest"`).

Cara menambah jalur sekarang: upload lewat `upload.html` seperti biasa → workflow
memperbarui `data/routes.json` → jalur muncul di landing. **Tidak perlu edit kode lagi.**
Untuk menjalankan manual: `node scripts/build-routes-index.js`.

**2. `upload.html` responsif — belum**
Tambah satu blok `@media (max-width: 720px)` di `<style>` inline: kolom jadi 1,
tombol full width, `<pre>` JSON gets `overflow:auto`. Estimasi ~20 menit, risiko rendah.

**3. Unduh GPX/KML tanpa Drive — belum**
Buat `GPX` (`<wpt>` + `<trk>`) dan `KML` (`Placemark` + `LineString`) langsung di browser
dari `track.geojson` yang sudah ada. Nol dependency eksternal, jalan untuk semua jalur
tidak pernah mati. Link Drive dipertahankan sebagai tombol kedua
"GPX asli". Estimasi ~45 menit, risiko sedang → hasil file harus divalidasi (XML) dulu.

**4. Tombol ganti tema di viewer — belum**
Sisipkan satu tombol `#btn-theme` di `viewer.html` (Font Awesome sudah termuat) plus
gaya tombolnya di `assets/css/style.css`. Logika `theme.js` tidak berubah sama sekali.
Estimasi ~15 menit, risiko sangat rendah.

Saran urutan pengerjaan: **1 ✅ sudah** → **4 → 2 → 3**.

### D. Yang diputuskan tidak dikerjakan

- **Sinkron tema dua arah dengan Blogger** (tombol di viewer mengubah tema blog).
  Pengguna situs ini hanya pemilik, jadi dianggap tidak penting.
- Embed auto-height mandiri, `upload.html` responsif penuh, SEO/social metadata
  ditunda; landing page sudah cukup untuk pemakaian pribadi.

### E. Riwayat perubahan landing page

- `f8240cb` — landing page mandiri (dulu `landing.js` tidak pernah dimuat).
- `ca94a50` — versioning URL aset (`?v=2`) agar cache Pages tidak menahan CSS lama.
- `7ed8972` — ganti CARTO (wajib API key) ke OpenTopoMap + Esri, anti overflow, `?v=3`.
- `d14de63` / `28790fb` — hapus data dummy Butak, Lawu jadi default, `?v=4`.
- B1 — index `data/routes.json` + workflow otomatis, `?v=5`.

## Files

- `index.html` — landing page
- `viewer.html` — viewer jalur (`viewer.html?route=<slug>`)
- `upload.html` — uploader
- `config.js` — config GitHub Pages data
- `assets/js/*.js` — viewer modules
- `assets/js/landing.js` — script landing page (daftar jalur + peta mini)
- `assets/css/style.css` — viewer styles
- `assets/css/landing.css` — landing page styles (standalone)
- `data/routes.json` — index daftar jalur (otomatis, dipakai landing page)
- `data/*/manifest.json`, `track.json`, `track.geojson` — jalur data
- `scripts/build-routes-index.js` — pembuat `data/routes.json`
- `.github/workflows/routes-index.yml` — otomatisasi pembuat index
