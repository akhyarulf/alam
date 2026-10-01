# Cara Pakai Alam Engine (lokal di laptop)

## 1. Setup sekali di awal

```bash
cd alam-engine
python3 -m venv venv
source venv/bin/activate        # windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`, isi minimal:
- `GITHUB_TOKEN` = token GitHub baru kamu (generate di github.com/settings/tokens, scope `repo`)
- `GITHUB_OWNER`, `GITHUB_REPOSITORY`, `GITHUB_BRANCH` sesuai repo `alam-engine-data` kamu
- `GOOGLE_DRIVE_FOLDER_ID` = folder id Drive tujuan upload
- `DRIVE_SUFFIX` = suffix nama file pas ke Drive, default `nyasarnyaman`

**⚠️ PENTING SEBELUM LANJUT:** token GitHub lama kamu (yang dulu ke-hardcode di `config.py`)
sekarang sudah pernah "keluar" dari laptopmu (lewat file yang kamu upload ke chat ini).
Anggap token itu bocor. Revoke/generate baru di https://github.com/settings/tokens,
lalu masukkan yang baru ke `.env`. Jangan pernah hardcode token di file `.py` lagi —
makanya sekarang lewat `.env`, yang sudah masuk `.gitignore` biar nggak ke-commit.

## 2. Jalanin editor

```bash
python app.py
```

Buka `http://localhost:8000` di browser.

## 3. Alur kerja di UI

1. **Upload file** track (gpx/geojson/kml/kmz/csv/tcx) di panel kiri.
2. **Trim** pakai slider "potong dari awal/akhir" — peta otomatis update.
3. **Info Jalur** — nama/gunung/jalur kedetect otomatis dari judul (`Gunung X via Y`),
   bisa kamu edit manual, `route_id` auto ikut berubah.
4. **Waypoint** — klik di garis track pada peta buat nambah waypoint, kasih nama, atau hapus.
   Start/Finish/Highest Point otomatis selalu ada (dikunci).
5. **Output** — centang format yang mau di-export (json/geojson/gpx/kml).
   json & geojson → GitHub (buat viewer). gpx & kml → Google Drive (buat didownload orang lain).
6. Centang/uncentang **"Upload ke GitHub & Google Drive"** — matiin dulu kalau cuma mau
   coba-coba lokal tanpa publish beneran.
7. Klik **Proses & Simpan**. Link hasil upload muncul di bawah tombol.

Login Google Drive pertama kali bakal buka browser buat OAuth consent — normal, token
tersimpan otomatis di `token.json` (jangan di-share/commit file ini).

## 4. Kenapa penamaan GitHub vs Drive beda

- **GitHub**: `viewer/{route_id}/track.json`, `viewer/{route_id}/track.geojson`,
  `viewer/{route_id}/manifest.json` — rapi karena tiap jalur otomatis punya folder sendiri.
- **Drive**: `{route_id}-{DRIVE_SUFFIX}.gpx`, contoh `butak-via-panderman-nyasarnyaman.gpx` —
  di-rename gitu karena folder tujuan di Drive itu flat (satu folder isinya semua jalur),
  jadi nggak bisa numpuk nama file sama kaya sebelumnya. Ganti `DRIVE_SUFFIX` di `.env`
  kalau mau ganti akhiran (misal ganti nama blog).

## 5. Sambung ke viewer / Blogger

Viewer kamu (`alam-viewer`) baca `viewer/{route_id}/manifest.json` dari GitHub raw URL —
struktur ini nggak diubah sama sekali, jadi viewer tetap jalan seperti biasa. Tinggal
embed viewer di Blogger, terus arahin ke jalur yang mau ditampilin lewat parameter
`?route={route_id}`, contoh:

```html
<iframe src="https://USERNAME.github.io/alam-viewer/?route=butak-via-panderman"></iframe>
```

## 6. Format input yang didukung sekarang

`.gpx`, `.geojson`/`.json`, `.kml`, `.kmz`, `.csv` (kolom `lat`,`lng`/`lon`,`ele` opsional),
`.tcx`. FIT belum, karena formatnya biner dan butuh library tambahan (`fitparse`) —
gampang ditambahin nanti kalau perlu.
