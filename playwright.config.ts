/**
 * R-061 «Test Suite E2E Jalur Kritis» — konfigurasi Playwright (v13.0 «GERBANG»).
 *
 * • testDir tests/e2e — spec jalur kritis: portal, auth CMS, checkout, sertifikat.
 * • webServer: memakai dev server yang SUDAH hidup dulu (reuseExistingServer)
 *   agar sprint lokal cepat; di CI server dinyalakan otomatis.
 * • Kredensial admin TIDAK pernah di-commit — selalu dari env
 *   (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD), kosong → spec login di-skip.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3000);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // SQLite tunggal — jalankan berurutan agar data stabil
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  outputDir: "test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "id-ID",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 240_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
