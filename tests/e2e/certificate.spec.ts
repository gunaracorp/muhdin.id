/**
 * R-061 + R-022 — E2E jalur kritis: VERIFIKASI SERTIFIKAT PUBLIK.
 * Deep-link QR #/verifikasi-sertifikat/<kode> → hasil autentik langsung;
 * kode asing → pesan tidak ditemukan. Counter verifikasi bertambah server-side.
 */
import { test, expect } from "@playwright/test";

test.describe("Verifikasi sertifikat publik", () => {
  test("kode valid dari QR menampilkan pemegang & kursus", async ({ page }) => {
    await page.goto("/#/verifikasi-sertifikat/SERT-2026-99990001");
    await expect(page.getByText(/Ahmad E2E Tester/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/SERT-2026-99990001/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("kode tidak dikenal menampilkan status tidak ditemukan", async ({ page }) => {
    await page.goto("/#/verifikasi-sertifikat/SERT-2026-00000000");
    await expect(page.getByText(/tidak ditemukan|tidak terdaftar/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
