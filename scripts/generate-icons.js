/* ==========================================
 Alam — Icon Generator
 ==========================================
 Membuat PNG raster dari desain yang sama dengan
 assets/img/favicon.svg:

   assets/img/icon-180.png   -> apple-touch-icon
   assets/img/icon-512.png   -> webmanifest (192 & 512)
   assets/img/og-image.png   -> Open Graph / Twitter Card (1200x630)

 Kenapa perlu PNG?
   - apple-touch-icon di iOS TIDAK mendukung SVG.
   - Open Graph / Twitter Card juga tidak reliably
     mendukung SVG; yangOG idealnya PNG/JPG >= 1200x630.

 Tanpa dependency: PNG ditulis manual (IHDR/IDAT/IEND)
 memakai zlib bawaan Node. Font 5x7 digambar dari piksel
 supaya teks tetap tampil tanpa library.

 Jalankan:  node scripts/generate-icons.js
 Output dianggap hasil build, bukan diedit manual.
 ========================================== */

"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.resolve(__dirname, "..", "assets", "img");

/* ---------- Palet (samakan favicon.svg) ---------- */
const C = {
    bg: [0x20, 0x2c, 0x24],
    sun: [0xf2, 0xc1, 0x4e],
    mtn: [0x6f, 0x9b, 0x78],
    snow: [0xee, 0xf4, 0xef],
    cream: [0xf6, 0xf6, 0xfa],
    green: [0x5a, 0x75, 0x62],
};

/* ---------- PNG ---------- */
const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
    }
    return t;
})();

function crc32(buf) {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;   // bit depth
    ihdr[9] = 6;   // RGBA
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    /* tiap baris diawali byte filter 0 */
    const stride = w * 4;
    const raw = Buffer.alloc((stride + 1) * h);
    for (let y = 0; y < h; y++) {
        raw[y * (stride + 1)] = 0;
        rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

/* ---------- Canvas (supersampling buat tepi halus) ---------- */
const SS = 3;

function canvas(w, h) {
    const W = w * SS, H = h * SS;
    const buf = Buffer.alloc(W * H * 4); // transparan
    return {
        W, H, buf,
        px(x, y, c) {
            const i = (y * W + x) * 4;
            buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
        },
    };
}

function fillRect(cv, x0, y0, x1, y1, c) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(cv.H, Math.ceil(y1)); y++)
        for (let x = Math.max(0, Math.floor(x0)); x < Math.min(cv.W, Math.ceil(x1)); x++)
            cv.px(x, y, c);
}

/* rounded rect: pojok dipotong sesuai radius */
function fillRoundRect(cv, x0, y0, x1, y1, r, c) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(cv.H, Math.ceil(y1)); y++) {
        for (let x = Math.max(0, Math.floor(x0)); x < Math.min(cv.W, Math.ceil(x1)); x++) {
            const cx = Math.min(Math.max(x + 0.5, x0 + r), x1 - r);
            const cy = Math.min(Math.max(y + 0.5, y0 + r), y1 - r);
            const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
            if (dx * dx + dy * dy <= r * r) cv.px(x, y, c);
        }
    }
}

function fillCircle(cv, cx, cy, r, c) {
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(cv.H, Math.ceil(cy + r)); y++)
        for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(cv.W, Math.ceil(cx + r)); x++) {
            const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
            if (dx * dx + dy * dy <= r * r) cv.px(x, y, c);
        }
}

/* polygon pakai even-odd ray casting */
function fillPoly(cv, pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    for (let y = Math.max(0, Math.floor(minY)); y < Math.min(cv.H, Math.ceil(maxY) + 1); y++) {
        const sy = y + 0.5;
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) {
                xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
            }
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
            for (let x = Math.max(0, Math.floor(xs[k])); x < Math.min(cv.W, Math.ceil(xs[k + 1])); x++) {
                if (x + 0.5 >= xs[k] && x + 0.5 <= xs[k + 1]) cv.px(x, y, c);
            }
        }
    }
}

/* Turunkan resolusi (box filter) */
function downsample(cv, w, h) {
    const out = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let dy = 0; dy < SS; dy++) {
                for (let dx = 0; dx < SS; dx++) {
                    const i = ((y * SS + dy) * cv.W + (x * SS + dx)) * 4;
                    const al = cv.buf[i + 3];
                    r += cv.buf[i] * al; g += cv.buf[i + 1] * al; b += cv.buf[i + 2] * al;
                    a += al;
                }
            }
            const o = (y * w + x) * 4;
            out[o] = a ? Math.round(r / a) : 0;
            out[o + 1] = a ? Math.round(g / a) : 0;
            out[o + 2] = a ? Math.round(b / a) : 0;
            out[o + 3] = Math.round(a / (SS * SS));
        }
    }
    return out;
}

/* ---------- Font 5x7 (huruf yang dipakai aja) ---------- */
const FONT = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

function drawText(cv, text, x, y, px, c, tracking = 1) {
    let cx = x;
    for (const ch of text.toUpperCase()) {
        const g = FONT[ch];
        if (!g) { cx += (5 + tracking) * px; continue; }
        for (let r = 0; r < 7; r++) {
            for (let col = 0; col < 5; col++) {
                if (g[r][col] === "1") {
                    fillRect(cv, cx + col * px, y + r * px, cx + (col + 1) * px, y + (r + 1) * px, c);
                }
            }
        }
        cx += (5 + tracking) * px;
    }
    return cx;
}

function textWidth(text, px, tracking = 1) {
    return text.length * (5 + tracking) * px - tracking * px;
}

/* ---------- Desain ---------- */

/* Ikon persegi: mengikuti favicon.svg (viewBox 64x64)

   CATATAN: latar dibuat FULL-PERSI opaque, bukan rounded + transparan.
   Alasannya:
   - iOS (apple-touch-icon) tidak mendukung transparansi; piksel
     transparan dirender jadi HITAM, bukan mengikuti warna beranda.
   - iOS dan Android sudah memasang mask sendiri (squircle/rounded),
     jadi membulatkan di sini hanya menghasilkan mask ganda dan
     sudut gelap pada ikon berlatar terang. */
function makeIcon(size) {
    const cv = canvas(size, size);
    const u = (size * SS) / 64;

    fillRect(cv, 0, 0, size * SS, size * SS, C.bg);
    fillCircle(cv, 47 * u, 17 * u, 6 * u, C.sun);
    fillPoly(cv, [[6, 52], [26, 20], [37, 37], [44, 28], [58, 52]].map(([x, y]) => [x * u, y * u]), C.mtn);
    fillPoly(cv, [[26, 20], [33, 31], [26, 36], [19, 31]].map(([x, y]) => [x * u, y * u]), C.snow);
    fillPoly(cv, [[44, 28], [47.5, 33.5], [44, 36], [40.5, 33.5]].map(([x, y]) => [x * u, y * u]), C.snow);

    return encodePNG(size, size, downsample(cv, size, size));
}

/* OG image 1200x630:zeitig + gunung + judul */
function makeOG() {
    const W = 1200, H = 630;
    const cv = canvas(W, H);
    const u = (W * SS) / 64;
    const h = H * SS;

    fillRect(cv, 0, 0, W * SS, h, C.bg);
    fillCircle(cv, 1000 * u, 120 * u, 46 * u, C.sun);

    /* gunung di bagian bawah, dibesar dari desain ikon */
    fillPoly(cv, [
        [-40 * u, 70 * u], [180 * u, 26 * u], [320 * u, 50 * u],
        [430 * u, 36 * u], [560 * u, 70 * u],
    ].map(([x, y]) => [x * u, y * u]), C.mtn);

    /* garis dasar */
    fillRect(cv, 0, h - 6 * SS, W * SS, h, C.green);

    /* judul */
    const px = 16 * SS;
    drawText(cv, "ALAM", 80 * SS, 300 * SS, px, C.snow);
    drawText(cv, "PETA JALUR", 80 * SS, 300 * SS + 9 * px, px * 0.8, C.mtn);
    fillRect(cv, 80 * SS, 300 * SS + 22 * px, 80 * SS + 300 * SS, 300 * SS + 22 * px + 4 * SS, C.sun);

    return encodePNG(W, H, downsample(cv, W, H));
}

/* ---------- Main ---------- */
const targets = [
    ["icon-180.png", () => makeIcon(180)],
    ["icon-192.png", () => makeIcon(192)],
    ["icon-512.png", () => makeIcon(512)],
    ["og-image.png", makeOG],
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [name, fn] of targets) {
    const png = fn();
    fs.writeFileSync(path.join(OUT_DIR, name), png);
    console.log(`${name.padEnd(14)} ${String(png.length).padStart(7)} byte`);
}

console.log("\nSelesai. Jalankan ulang script ini kalau favicon.svg berubah.");