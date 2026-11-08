/**
 * optimize-images.mjs — Task 19 (R-058 WebP + Lazy Load).
 *
 * Mengonversi seluruh gambar raster di public/images → .webp (canvas sama,
 * kualitas 80) via sharp. File .webp ditulis SEBELUM sumber asli — jadi
 * SmartImage mencoba .webp dulu dan jatuh ke asli bila gagal.
 *
 * Idempoten: lewati bila .webp sudah ada dan lebih baru dari sumbernya.
 * Jalankan: node scripts/optimize-images.mjs
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const DIRS = [join(ROOT, "public", "images")];
const EXT_OK = new Set([".jpg", ".jpeg", ".png"]);

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

for (const dir of DIRS) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    const ext = extname(file).toLowerCase();
    if (!EXT_OK.has(ext)) continue;
    const src = join(dir, file);
    const out = join(dir, basename(file, ext) + ".webp");

    // Idempoten: webp sudah lebih baru → lewati.
    if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
      skipped++;
      totalBefore += statSync(src).size;
      totalAfter += statSync(out).size;
      continue;
    }

    const before = statSync(src).size;
    const buf = await sharp(src).webp({ quality: 80, effort: 4 }).toBuffer();
    const { writeFileSync } = await import("node:fs");
    writeFileSync(out, buf);
    converted++;
    totalBefore += before;
    totalAfter += buf.length;
    const saved = ((1 - buf.length / before) * 100).toFixed(0);
    console.log(`  ${file} → ${basename(out)}  (${(before / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB, -${saved}%)`);
  }
}

console.log(
  `\nSelesai: ${converted} dikonversi, ${skipped} dilewati (sudah mutakhir). ` +
    `Total ${(totalBefore / 1024 / 1024).toFixed(2)}MB → ${(totalAfter / 1024 / 1024).toFixed(2)}MB ` +
    `hemat ${totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(0) : 0}%.`
);
