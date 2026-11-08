/**
 * R-061 — E2E jalur kritis: PORTAL PUBLIK.
 * Menjaga tiga pintu utama jamaah: beranda hidup, katalog paket menampilkan
 * kartu seed E2E, dan seksi portal 99 Roadmap (Tentang Kami) tetap tersaji.
 */
import { test, expect } from "@playwright/test";

test.describe("Portal publik", () => {
  test("beranda MUHDIN dirender penuh", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/MUHDIN/i);
    await expect(page.locator("body")).toContainText(/MUHDIN/i, { timeout: 20_000 });
  });

  test("katalog paket menampilkan paket seed E2E", async ({ page }) => {
    await page.goto("/#/paket");
    await expect(page.getByText(/Paket E2E Umroh GERBANG/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("seksi 99 Roadmap tersaji di Tentang Kami", async ({ page }) => {
    await page.goto("/#/tentang");
    await expect(page.getByText(/99\s*ROADMAP/i).first()).toBeVisible({ timeout: 20_000 });
    // Kartu item roadmap (kode R-###) muncul di grid.
    await expect(page.getByText(/^R-\d{3}$/).first()).toBeVisible({ timeout: 20_000 });
  });
});
