/**
 * pack-capacitor — R-067 v15.0.0 «GOD MODE» — Mobile App Wrapper.
 *
 * Menyiapkan scaffold native (android/ios) untuk build ke toko aplikasi:
 *  1. Validasi capacitor.config.ts + akses portal produksi.
 *  2. `bunx cap add android` / `cap add ios` bila folder belum ada.
 *  3. `bunx cap sync` menyalin konfigurasi + aset PWA (ikon/splash).
 *
 * Hasil scaffold TIDAK di-commit (butuh SDK platform — Android Studio /
 * Xcode — dan binari besar). Runbook lengkap: docs/MOBILE-APP.md.
 * Pakai: bun run mobile:pack
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`[mobile:pack] $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

console.log("[mobile:pack] R-067 — Mobile App Wrapper (Capacitor)");

if (!existsSync("capacitor.config.ts")) {
  console.error("[mobile:pack] capacitor.config.ts tidak ditemukan — jalankan dari akar repo.");
  process.exit(1);
}

// Portal produksi harus hidup sebelum scaffold (WebView memuat URL ini).
try {
  const res = await fetch("https://muhdin.web.id", { method: "HEAD" });
  console.log(`[mobile:pack] portal muhdin.web.id → HTTP ${res.status}`);
} catch {
  console.warn("[mobile:pack] portal tidak terjangkau dari sandbox — scaffold tetap disiapkan, cek ulang sebelum build store.");
}

if (!existsSync("android")) run("bunx --yes @capacitor/cli cap add android");
else run("bunx --yes @capacitor/cli cap copy android");

if (process.platform === "darwin") {
  if (!existsSync("ios")) run("bunx --yes @capacitor/cli cap add ios");
  else run("bunx --yes @capacitor/cli cap copy ios");
} else {
  console.log("[mobile:pack] iOS di-scaffold di macOS saja — build Play Store siap di folder android/.");
}

run("bunx --yes @capacitor/cli cap sync");
console.log("[mobile:pack] Selesai — buka android/ di Android Studio untuk build AAB (docs/MOBILE-APP.md).");
