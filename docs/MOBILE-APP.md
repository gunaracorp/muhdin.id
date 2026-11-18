# Mobile App Wrapper (R-067) — Play Store & App Store dari Satu Kodebase

PWA MUHDIN dibungkus **Capacitor** menjadi aplikasi native tanpa menulis
ulang: satu kodebase web, dua saluran distribusi tambahan. PWA yang sudah
ada (manifest + service worker + push di `pwa-src/`) tetap bekerja di dalam
WebView, termasuk mode offline dan notifikasi keberangkatan.

## Arsitektur

| Lapis | Isi |
| --- | --- |
| `capacitor.config.ts` | appId `web.id.muhdin.app`, nama **MUHDIN**, WebView memuat `https://muhdin.web.id` (https scheme, tanpa mixed content) |
| `pwa-src/` | service worker + manifest — tidak berubah |
| `scripts/pack-capacitor.mjs` | scaffold `android/` & `ios/` + `cap sync` (tidak di-commit — butuh SDK platform & binari besar) |

## Alur build mobile

```bash
bun install                    # deps web + @capacitor/cli (devDependency)
bun run mobile:pack            # scaffold android/ (dan ios/ di macOS) + sync
# Android:
#   buka android/ di Android Studio → Build > Generate Signed Bundle (AAB)
# iOS:
#   buka ios/ di Xcode → Product > Archive → upload ke App Store Connect
```

## Yang perlu disiapkan sebelum submit

1. **Ikon & splash**: letakkan ikon 1024×1024 di `assets/icon.png`, jalankan
   `bunx @capacitor/assets generate` — ikon/splash semua ukuran dibuat otomatis.
2. **Keystore Android** (simpan aman, jangan commit): `keytool -genkey -v
   -keystore muhdin.keystore -alias muhdin -keyalg RSA -keysize 2048`.
3. **Listing store**: deskripsi Indonesia/Inggris + screenshot 6 buah —
   sumber visual: hero beranda, katalog paket, paspor digital, grup, akademi,
   compliance.
4. **Data keamanan Play Console**: portal memakai HTTPS, tidak mengumpulkan
   data kesehatan/keuangan di WebView (pembayaran di luar aplikasi).

## Pembaruan

Karena WebView memuat portal produksi, **pembaruan konten tidak butuh
release baru** — cukup deploy web. Release native hanya bila
`capacitor.config.ts` atau versi SDK berubah: naikkan `version` di
`package.json`, jalankan `bun run mobile:pack`, lalu build ulang.

## Status

- Konfigurasi + runbook: selesai (R-068 cache/CDN ikut menguntungkan WebView).
- Scaffold native: dibuat saat `bun run mobile:pack` di mesin dengan SDK.
