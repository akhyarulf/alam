# Alam 🥾

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
├── embed-resize.js   # penerima pesan auto-height & sinkron tema di sisi blog
├── nyasar-widget.html # widget promo aplikasi Nyasar untuk ditempel di Blogger
├── CNAME             # domain kustom GitHub Pages
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── landing.css
│   ├── img/
│   │   ├── favicon.svg        # ikon SVG (sumber untuk generate-icons.js)
│   │   ├── icon-180.png       # apple-touch-icon
│   │   ├── icon-192.png       # webmanifest
│   │   ├── icon-512.png       # webmanifest
│   │   └── og-image.png       # preview saat link dibagikan (1200x630)
│   └── js/
│       ├── app.js
│       ├── chart.js
│       ├── download.js
│       ├── export-file.js
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
│       └── track.geojson   # garis jalur + waypoint untuk peta
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

### Daftar Jalur di Landing (otomatis)

Daftar jalur pada landing page **tidak ditulis manual**. Alurnya:

1. `upload.html` commit `data/<slug>/manifest.json` ke repo.
2. GitHub Actions (`.github/workflows/routes-index.yml`) menjalankan
   `scripts/build-routes-index.js` → menulis ulang `data/routes.json`.
3. `assets/js/landing.js` membaca `data/routes.json` (satu request untuk semua jalur)
   lalu menampilkan kartunya.

Jadi setelah publish, jalur baru **otomatis muncul** di landing page — tidak perlu
menambah slug di `landing.js`. Kalau workflow gagal, jalankan manual:

```bash
node scripts/build-routes-index.js
```

Kalau `data/routes.json` belum ada sama sekali, landing page jatuh ke daftar cadangan
`ROUTE_SLUGS` di `assets/js/landing.js`, jadi halaman tidak pernah kosong.
Rincian implementasi ada di bagian [Kekurangan & Rencana Perbaikan](#c-rencana-perbaikan-14).

Tanpa parameter, versi default menggunakan `defaultRoute` di `config.js`:
- `lawu-via-cemoro-sewu`

### Format `manifest.json`

Setiap `data/<slug>/` harus memiliki:

```json
{
  "id": "slugsatu",
  "engine": {
    "name": "Alam",
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
    "geojson": "track.geojson"
  }
}
```

> Angka `stats` di atas mengikuti data nyata `lawu-via-cemoro-sewu`.

> `viewer.json` dan `track.json` sudah dihapus — tidak ada kode yang membacanya.
> Viewer hanya butuh `track.geojson`; GPX/KML dibuat di browser dari file itu.

Referensi lengkap:
- https://raw.githubusercontent.com/akhyarulf/alam/main/data/<slug>/manifest.json
- https://raw.githubusercontent.com/akhyarulf/alam/main/data/<slug>/track.geojson

## Fitur

- **Viewer statis**: dibuka dari GitHub Pages, no `npm install`, no `vite build`.
- **Data dari domain sendiri**: `manifest.json` & `track.geojson` diambil lewat
  `config.js` → `localBase`, dengan fallback ke `rawBase` (GitHub raw) bila
  domain kustom belum sempat mem-build.
- **Uploader browser**: `upload.html` memproses GPX 100% di browser
  (`@mapbox/togeojson` + Turf.js), lalu commit ke `data/<slug>/` melalui GitHub API.
- **Theme dark/light**: dikontrol di `viewer.html` / `index.html` oleh `?theme=dark|light` dan sinkron
  dengan iframe parent via `embed-sync.js`.
- **Download**: GPX autorun / KML panggilan tambahan dapat diunduh dari `data/<slug>/`.
- **Ruas waypoint**: tiap ruas hasil upload punya `gain_m` dan durasi yang dihitung
  per segmen (bukan hanya beda elevasi dua ujung), dan **Total Naik di viewer diambil dari
  jumlah ruas** (`stats.js`) supaya angka di sidebar selalu sama dengan total.
  Data `lawu-via-candi-cetho` (12 ruas → 275–435 mnt) dan `lawu-via-cemoro-sewu`
  (8 ruas → 255–390 mnt) sudah diselaraskan.
- **Waktu naik/turun**: baris “Total Naik/Turun” memakai `stats.ascent/descent_duration_minutes_*`
  di manifest. Kalau field itu tidak ada (jalur hasil upload browser), `Utils.climbTimes()`
  menghitungnya dari `track.geojson` dengan formula Naismith (4 km/jam + 600 m/jam elevasi,
  rentang 0.85x–1.3x). **Semantiknya: naik = start → finish (bagian yang mendaki), turun =
  finish → start (perjalanan balik, profil elevasi dibalik).** Tanpa sumber data, baris
  menampilkan “Data tidak tersedia”, bukan “---”.

## Embed di Blog

```html
<iframe
  src="https://alam.nyasarnyaman.my.id/viewer.html?route=lawu-via-cemoro-sewu"
  style="width:100%;height:1300px;border:0;border-radius:10px"
  loading="lazy"
  scrolling="no"
  allowfullscreen
  title="Viewer jalur Lawu via Cemoro Sewu"
></iframe>
```

- `?route=<slug>` memilih jalur; tanpa parameter memakai `defaultRoute` di `config.js`.
- Tambah `&theme=dark` / `&theme=light` biar senada blog — viewer juga auto-sinkron
  tema halaman parent via `postMessage`.
- `scrolling="no"` + `scrollWheelZoom` otomatis mati saat di-embed, jadi scroll di
  atas peta tidak lagi menggerakkan halaman artikel (zoom tetap pakai tombol `+`/`-`).

### Tampilan ringkas di HP

Supaya tidak terlalu memanjang ke bawah di artikel:

- Tabel Informasi Jalur tidak lagi mengulang **Gunung/Jalur** (sudah ada di judul hero) — 9 → 7 baris.
- Grafik elevasi **200px** di ≤768px, dan bisa **dilipat** lewat tombol di judul card
  (default tertutup di HP, terbuka di desktop).
- Daftar pos menampilkan **6 ruas pertama** + tombol “Lihat semua N ruas” (indeks & klik untuk
  fly-to tetap utuh karena semua ruas tetap ada di DOM).
- Tombol unduh GPX/KML/Print jadi **3 kolom** di HP, dan baris pos lebih rapat (`padding:10px`).
- **Subjudul hero disembunyikan kalau pengulangan**: bila `track.name` sudah memuat nama gunung
  **dan** nama jalur (mis. "Lawu via Candi Cetho"), baris "Lawu • Candi Cetho" di bawahnya
  disembunyikan. Kalau nama jalur dikustom ("Rute Favorit Saya"), subjudul tetap tampil.
- **Header diringkas di HP** (buka langsung maupun embed): foto cover & badge disembunyikan,
  tinggi otomatis (`padding:12px`) dan judul 19px
  supaya tidak turun ke baris sendiri.
- Efeknya tinggi konten di HP turun dari ~2.000px jadi ~1.500–1.600px, cocok dengan
  `height:1300px` di snippet embed.

### Tampilan di dalam artikel

Saat dibuka di iframe artikel, `assets/js/embed-sync.js` menandai `body.embedded`, lalu
`assets/css/style.css` menyederhanakan tampilan: footer disembunyikan, hero 200px
menjadi strip tipis (judul jalur tetap tampil), badge disembunyikan, dan tombol
tema disembunyikan karena tema sudah ikut blog.
Card POI juga otomatis disembunyikan kalau jalurnya memang tidak punya POI.
Dibuka langsung (`viewer.html?route=…` tanpa iframe) tampilannya tetap utuh.

### Tinggi iframe otomatis + tema sinkron (disarankan)

`assets/js/embed-sync.js` mengirim tinggi konten ke halaman induk
(`postMessage {source:"alam", type:"resize", height}`), dan `assets/js/theme.js`
menerima tema dari blog. Penerimanya sudah disiapkan di `embed-resize.js`.
Tambahkan **satu baris** ini di tema Blogger (**Tema → Edit HTML**, sebelum
`</body>`):

```html
<script src="https://alam.nyasarnyaman.my.id/embed-resize.js"></script>
```

Setelah itu:

1. **Tinggi otomatis** — tinggi iframe mengikuti isi viewer (dibatasi 400–20.000px),
   jadi tidak ada lagi area kosong besar atau scroll di dalam iframe, di HP maupun
   desktop. Nilai `height` di snippet embed hanya cadangan awal kalau script belum
   terpasang.
2. **Tema sinkron dua arah** — `embed-resize.js` membaca tema blog lalu mengirimnya
   ke viewer. Di dalam iframe tombol tema disembunyikan, jadi tema viewer selalu
   mengikuti tema blog. Perubahan dari blog tidak dipantulkan balik (anti-loop).
3. **Src iframe yang ditunda** — kalau iframe ditulis tanpa `src`:

   ```html
   <iframe class="alam-viewer-embed" data-route="lawu-via-cemoro-sewu"></iframe>
   ```

   `embed-resize.js` yang mengisinya (sertakan `&theme=…`), sehingga viewer tampil
   dengan tema yang benar sejak frame pertama dan tidak berkedip.

**Penting — ganti, jangan ditumpuk.** Kalau tema Blogger masih memuat script lama
yang menunda `src` iframe, hapus dulu script itu sebelum memasang baris di atas.
Dua script sekaligus akan berebut set `src` dan tinggi iframe.

Kalau `embed-resize.js` belum terpasang, viewer tetap jalan normal — hanya tinggi
iframe, src tertunda, dan sinkron tema yang tidak ikut menyesuaikan.

### Cara `embed-resize.js` membaca tema blog

Diurutkan dari yang paling spesifik:

1. checkbox `#mode` — pola tema Derelogy, tercentang = dark
2. atribut `data-theme` di `<html>` atau `<body>`
3. class `dark`/`light` di `<html>` atau `<body>`
4. warna latar `background-color` (gelap/terang)
5. `prefers-color-scheme` sistem

Kalau tema blog pakai kontrol lain (tombol ber-`aria-label`/`title` berisi "dark",
"light", "mode", "tema", atau "theme"), kontrol itu tetap dipakai untuk
mengubah tema blog.

## Upload Data Baru

Gunakan uploader di:

- https://alam.nyasarnyaman.my.id/upload.html

1. Buka uploader.
2. Upload file GPX — nama/gunung/jalur terdeteksi otomatis, slug dibuat otomatis
   (format: `gunung-` dibuang → `{gunung}-via-{jalur}`).
   Nama jalur = gabungan **Gunung + Jalur** (`buildTrackName()`), jadi tidak bisa
   tidak sinkron: judul `Gunung Lawu via Candi Cetho` maupun `Lawu via Candi Cetho`
   sama-sama jadi `Lawu` + `Candi Cetho` + nama `Lawu via Candi Cetho`. Kalau nama
   diketik manual, kolom itu berhenti mengikuti (Gunung/Jalur berubah).
3. Tempel **GitHub fine-grained PAT** (repo ini saja, permission **Contents:
   Read and write**, pakai expiry). Opsional diingat di `localStorage`.
4. Klik **Publish** → 2 file (`track.geojson`, `manifest.json`) ter-commit
   ke `data/<slug>/`.

Setelah publish, viewer langsung bisa dibuka lewat `?route=<slug>`, dan daftar jalur
di landing page ikut ter-update otomatis oleh GitHub Actions (lihat
[Daftar Jalur di Landing](#daftar-jalur-di-landing-otomatis)).

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

- `lawu-via-candi-cetho` — Lawu via Candi Cetho
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
- URL aset di-version (semarang dinaikkan tiap aset berubah) agar cache
  GitHub Pages tidak menahan versi lama.

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
| 2 | `upload.html` tidak punya `@media` query → padding & `<pre>` JSON melebar di HP. | Tampilan upload dari HP. | **Selesai** — dua breakpoint (`640px`, `380px`): padding dirapatkan, `.stats-grid` jadi `minmax(112px,1fr)` lalu 2 kolom di ≤380px, `<pre>` JSON pakai `pre-wrap` + `overflow-wrap:anywhere` (anti scroll horizontal), plus `text-size-adjust:100%` biar iOS tidak membesarkan teks. Layout dasarnya memang sudah fluid (`.wrap` max-width, `button{width:100%}`, `auto-fit`). |
| 3 | Tombol unduh GPX/KML **bergantung pada layanan eksternal** (`manifest.downloads.*`); jalur hasil upload browser punya `downloads: null` sehingga tombolnya mati. | Tidak ada layanan eksternal lagi. | **Selesai** — GPX & KML dibuat di browser dari `track.geojson` (`assets/js/export-file.js`); semua referensi layanan eksternal (Drive) sudah dibuang dari kode, data, dan dokumen |

### B2. Kekurangan — viewer

| # | Masalah | Lokasi | Status |
|---|---------|--------|--------|
| 4 | Tidak ada tombol ganti tema (`#btn-theme` tidak pernah dibuat, padahal `theme.js` sudah siap). | `viewer.html` | **Selesai** — tombol `#btn-theme` + gaya `.theme-toggle`; ikon `fa-sun`/`fa-moon` di `assets/js/theme.js` yang mengisinya |
| 5 | `scrollWheelZoom` default Leaflet (`true`) → saat viewer di-embed, scroll halaman ikut terjerat di atas peta. | `assets/js/map.js` | **Selesai** — `scrollWheelZoom: !(window.self !== window.top)`: di iframe mati, dibuka langsung tetap normal |
| 6 | `min-height:100vh` memaksa dokumen embedded setinggi viewport → ruang kosong/gulir dobel. | `assets/css/style.css` | **Selesai** — `min-height:100svh` dengan fallback `100vh` |
| 7 | Error masih pakai `alert()` + judul "Viewer Error" (Inggris). | `assets/js/app.js` | **Selesai** — panel `#error-box` (CSS `.error-box`) diisi pakai `textContent`, tanpa alert |
| 8 | Bahasa bercampur: `Distance`, `Elevation Gain/Loss`, `Highest/Lowest Point` berdampingan dengan `Gunung`, `Jalur`, `Total Naik/Turun`. | `viewer.html` | Belum dikerjakan |
| 9 | Tidak ada pemilih jalur di dalam viewer; harus lewat `?route=` atau datang dari landing. | `viewer.html` | Belum dikerjakan |
| 10 | Tombol fullscreen gagal di iframe Blogger. | `index.html`, `upload.html` | **Selesai** — snippet embed (landing & uploader) sudah memakai `allowfullscreen` |
| 11 | Tombol toolbar hanya punya `title`, tanpa `aria-label`. | `viewer.html` | **Selesai** — `aria-label` ditambahkan ke `btn-fit`, `btn-fullscreen`, `btn-basemap`, `btn-direction-info`; tombol `btn-theme` sudah punya sebelumnya. `btn-print` (punya teks) dan `btn-elevation-toggle` (sudah punya `aria-expanded`) tidak perlu tambahan |

### B3. Kekurangan — embed Blogger

| # | Masalah | Lokasi | Status |
|---|---------|--------|--------|
| 12 | Auto-height **tidak jalan** untuk snippet dari landing: `embed-sync.js` mengirim `{source:"alam",type:"resize"}`, tapi receiver-nya harus ada di theme Blogger (`index.xml`) dan tidak disertakan. | `embed-resize.js` | **Selesai** — `embed-resize.js` di root menerima pesan resize (tinggi 400–20.000px) + push/pull tema dua arah; dipasang lewat satu `<script src>` di tema Blogger |
| 13 | Handshake tema tidak dijawab: `theme.js` mengirim `{source:"alam",type:"ready"}`, tetapi tidak ada skrip di sisi blog yang membalas. | `assets/js/theme.js` | **Selesai** — `embed-resize.js` menjawab `{source:"alam-blog",type:"theme"}` saat menerima `type:"ready"` (embedded), plus push tema berkala (interval + MutationObserver). `theme.js` menerima bentuk `alam-blog` dan bentuk lama `nyasar-blog`. |
| 14 | Iframe dipatok `height:600px` + `overflow:hidden` → jebakan scroll di tengah artikel. | `index.html`, `upload.html` | **Selesai** — snippet embed `height:1300px` + `scrolling="no"`; kalau `embed-resize.js` terpasang, tinggi jadi otomatis |

### B4. Kekurangan — data & dokumentasi

| # | Masalah | Lokasi | Status |
|---|---------|--------|--------|
| 15 | `track.json` (±92 KB total) **tidak pernah dibaca** halaman mana pun; uploader masih mem-publish-nya. | `data/*/track.json` | **Selesai** — penerbitan `track.json` dihapus dari `upload.html` (juga blok preview `prev-trackjson`), `viewer.json` dibersihkan dari kedua `manifest.json`, dan file `track.json` dihapus dari repo |
| 16 | Viewer selalu ambil data dari `raw.githubusercontent.com` (`CONFIG.manifestURL`), landing dari lokal — sumber data tidak konsisten & bisa lebih lambat. | `assets/js/app.js`, `config.js` | **Selesai** — `config.js` menambah `localBase`/`rawManifestURL`/`rawGeojsonURL`; `getManifestURLs()` & `getTrackURLs()` mencoba domain sendiri dulu, baru fallback ke raw. Versi URL aset dinaikkan tiap kali berubah supaya cache Pages tidak menahan versi lama |
| 17 | `exports[]` di `manifest.json` Butak menyimpan path internal Windows (`output\\viewer\\...`). | — | **Selesai** — data dummy Butak dihapus |
| 18 | `engine.version` tidak sinkron antar jalur. | `data/*/manifest.json` | **Selesai** — kedua jalur sudah `1.4.0`; perhatikan sinkronisasi saat menambah jalur baru |
| 19 | README contoh manifest menulis angka yang salah untuk jalurnya. | `README.md` | **Sudah diperbaiki** |

### B5. Kekurangan — polish situs

| # | Masalah | Status |
|---|---------|--------|
| 20 | Tidak ada `404.html` → tautan rusak tampil error GitHub. | **Selesai** — `404.html` (halaman mandiri ber-noindex, tautan kembali ke daftar jalur & uploader) |
| 21 | Tidak ada `robots.txt` dan `sitemap.xml` untuk domain kustom. | **Selesai** — `robots.txt` + `sitemap.xml`. Sitemap dibangun `scripts/build-routes-index.js`, jadi otomatis ikut terbaru setiap ada jalur baru (bukan file statis) |
| 22 | Tidak ada Open Graph / Twitter Card → tidak ada preview saat link dibagikan. | **Selesai** — Open Graph + Twitter Card di `index.html`, `viewer.html`, `upload.html`. `og:image` = `assets/img/og-image.png` (1200x630). `404.html` dikecualikan (noindex) |
| 23 | Tidak ada `apple-touch-icon` / `webmanifest` → ikon "Add to Home Screen" memakai screenshot. | **Selesai** — `apple-touch-icon` (180px) + `site.webmanifest` (192/512). Ikon PNG dibuat `scripts/generate-icons.js` dari desain `favicon.svg`; dibuat full-bleed opaque karena iOS merender transparansi jadi hitam |
| 24 | Tidak ada analytics (disarankan GoatCounter/Umami untuk situs statik). | **Diputuskan tidak dikerjakan** — statistik sudah tersedia di Statistik Blogger; `alam` hanya viewer map, jadi nilainya kecil. Bisa dipasang nanti tanpa mengubah kode lain |

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

**3. Unduh GPX/KML tanpa layanan eksternal — ✅ SELESAI** (`assets/js/export-file.js` + `download.js`)
Buat `GPX` (`<wpt>` + `<trk>`) dan `KML` (`Placemark` + `LineString`) langsung di browser
dari `track.geojson` yang sudah ada. Nol dependency eksternal, jalan untuk semua jalur
tidak pernah mati. Semua referensi layanan eksternal kemudian dibuang dari kode,
data (`manifest.json`), dan README. Estimasi ~45 menit → hasil file divalidasi (XML).

**5. Waypoint & ruas otomatis untuk jalur hasil upload — ✅ SELESAI** (`upload.html` + `data/lawu-via-candi-cetho`)
Viewer membaca waypoint dari **Point features di `track.geojson`**, bukan dari
`manifest.legs`. Sebelumnya `upload.html` hanya menulis satu fitur `LineString`,
jadi semua `<wpt>` dari GPX hilang (marker peta kosong + sidebar “Belum ada waypoint”).
Sekarang uploader juga menulis:
- `Point` per waypoint (Start/Finish/Highest Point + `<wpt>` dari GPX), diurutkan
  sesuai arah jalan, snapped ke titik track terdekat, plus `distance_km` & `locked`;
- `manifest.legs` (breakdown antar waypoint, estimasi Naismith 4 km/jam + 600 m/jam).

Data `lawu-via-candi-cetho` yang terlanjur ter-publish diperbaiki dengan algoritma
yang sama: 14 waypoint, 12 ruas, total 8,66 km (sesuai `stats.distance_km`).

**4. Tombol ganti tema di viewer — ✅ SELESAI**
Tombol `#btn-theme` sudah ada di hero `viewer.html` (dengan `aria-label`), gaya
`.theme-toggle` di `assets/css/style.css`. Warna tombol ikut `var(--card)` /
`var(--border)` supaya kontras di kedua mode, dan `meta theme-color` mengikuti
warna latar halaman (`#f6f6fa` terang, `#202124` gelap).

**6. Embed di artikel Blogger — ✅ SELESAI (sebagian)**
`scrollWheelZoom` dimatikan saat embedded, snippet embed dapat `scrolling="no"` +
`title`, dan README sekarang memuat script penerima auto-height
(`{source:"alam", type:"resize"}`) yang tinggal ditempel di tema Blogger.

Saran urutan pengerjaan: **1 ✅ → 4 ✅ → 2 → 3**.

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
- Perbaikan viewer/uploader kecil: link hasil publish diarahkan ke `viewer.html`, snippet embed diberi `allowfullscreen`, `?v=6`.
- Viewer: unduh GPX/KML dibuat di browser dari `track.geojson`; tombol "GPX asli" dan seluruh referensi layanan eksternal dibuang.
- `upload.html` menulis waypoint (`Point`) + `manifest.legs`; data `lawu-via-candi-cetho` diperbaiki, `?v=7`.
- Viewer: tombol tema, `scrollWheelZoom` mati saat embedded, panel error (ganti `alert()`), `100svh`; snippet embed dapat `scrolling="no"` + `title`; README tambah panduan auto-height. Aksen (`--primary`) tetap hijau `#5a7562` di tombol, ikon, dan grafik.
- Embed: `body.embedded` mengecilkan hero & menyembunyikan footer, card POI kosong otomatis disembunyikan, dan seluruh aset viewer diberi `?v=1` (cache busting).
- Uploader: nama jalur otomatis dari Gunung + Jalur (`buildTrackName()`), `extractMountainRoute()` sekarang juga memecah `X via Y` tanpa awalan "Gunung".
- Tampilan HP diringkas: hapus 2 baris duplikat, grafik 200px + bisa dilipat, 6 pos pertama + “lihat semua”, tombol unduh 3 kolom.
- Ruas waypoint disinkronkan dengan total: `buildLegs()` menghitung gain per segmen + `gain_m`, dan `stats.js` memakai jumlah ruas sebagai Total Naik.
- “Total Naik/Turun” tidak lagi “---”: `upload.html` menulis `ascent/descent_duration_minutes_*` + `ascent_km`/`return_km`/`profile_descent_km`, `stats.js` jatuh ke estimasi `Utils.climbTimes()` bila field kosong, dan `data/lawu-via-candi-cetho/manifest.json` di-backfill. Semantik turun diubah ke “finish → start”; untuk Cemoro Sewu angka engine (90–120 mnt) cocok dengan hitungan itu (80–125).

### Perawatan

- Penamaan dirapikan jadi satu nama: “Alam Viewer” dan “Alam Engine” (yang foldernya sudah
  dihapus lama lalu) digabung menjadi “Alam”. `window.AlamViewer` menjadi `window.Alam`,
  dan `og-image.png` digambar ulang karena teksnya dilukis di dalam PNG.
- Header viewer sekarang memakai `var(--bg)` seperti halaman, bukan gradient hijau:
  gambar cover memang tidak pernah diisi, sehingga overlay hitam hanya membuat header
  semakin gelap tanpa gunanya. Tombol tema dan badge ikut `var(--card)` + border.
- Field `manifest.downloads` dibuang seluruhnya — isinya sudah lama hanya `null`, dan
  sekarang GPX/KML dibangun dari `track.geojson` di browser tanpa layanan eksternal.

## Files

- `index.html` — landing page
- `viewer.html` — viewer jalur (`viewer.html?route=<slug>`)
- `upload.html` — uploader
- `404.html` — halaman 404 mandiri (`noindex`)
- `embed-resize.js` — penerima pesan auto-height + sinkron tema, dipasang di tema Blogger
- `nyasar-widget.html` — widget promo aplikasi Nyasar untuk ditempel di Blogger
- `robots.txt`, `sitemap.xml`, `site.webmanifest` — SEO & ikon aplikasi
- `config.js` — config GitHub Pages data (`localBase` + `rawBase`)
- `assets/js/*.js` — viewer modules
- `assets/js/landing.js` — script landing page (daftar jalur + peta mini)
- `assets/js/export-file.js` — pembuat file GPX & KML dari `track.geojson`
- `assets/css/style.css` — viewer styles
- `assets/css/landing.css` — landing page styles (standalone)
- `data/routes.json` — index daftar jalur (otomatis, dipakai landing page)
- `data/*/manifest.json`, `track.geojson` — jalur data
- `scripts/build-routes-index.js` — pembuat `data/routes.json` (+ sitemap)
- `scripts/generate-icons.js` — pembuat ikon PNG dari `assets/img/favicon.svg`
- `.github/workflows/routes-index.yml` — otomatisasi pembuat index
