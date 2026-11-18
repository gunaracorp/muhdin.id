/**
 * Tipe minimal konfigurasi (sengaja tidak meng-import @capacitor/cli —
 * dependency native di-install saat `bun run mobile:pack`, bukan saat dev).
 */
interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: { url: string; androidScheme?: string; iosScheme?: string };
  android?: { backgroundColor?: string; allowMixedContent?: boolean };
  ios?: { backgroundColor?: string; contentInset?: string };
  plugins?: { SplashScreen?: Record<string, unknown> };
}

/**
 * R-067 v15.0.0 «GOD MODE» — Mobile App Wrapper (Capacitor).
 *
 * Satu kodebase PWA → dua saluran toko aplikasi (Play Store & App Store)
 * tanpa menulis ulang: WebView membuka portal https://muhdin.web.id dengan
 * splash/ikon native. Konfigurasi di-commit bersama repo; scaffold android/
 * ios dibuat oleh `bun run mobile:pack` (scripts/pack-capacitor.mjs) saat
 * build mobile — tidak di-commit (bundler native butuh SDK platform).
 *
 * PWA sudah memenuhi syarat install (manifest + service worker di pwa-src/),
 * jadi perilaku offline & push tetap berjalan di dalam WebView.
 */
const config: CapacitorConfig = {
  appId: "web.id.muhdin.app",
  appName: "MUHDIN",
  webDir: "public",
  server: {
    // WebView memuat portal produksi (tanpa duplikasi build native).
    url: "https://muhdin.web.id",
    androidScheme: "https",
    iosScheme: "https",
  },
  android: {
    // Status bar transparan ala PWA; warna brand forest.
    backgroundColor: "#0B3D2E",
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: "#0B3D2E",
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0B3D2E",
      showSpinner: false,
    },
  },
};

export default config;
