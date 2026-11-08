/**
 * R-061 — E2E jalur kritis: LOGIN & CMS.
 * Jalur login tak boleh rusak diam-diam. Kredensial TIDAK pernah di-commit:
 * dibaca dari env E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD (di CI = GitHub Secrets).
 * Env kosong → tes sukses login di-skip; tes penolakan tetap berjalan.
 */
import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

test.describe("Auth & CMS", () => {
  test("halaman login CMS tersaji", async ({ page }) => {
    await page.goto("/#/admin");
    await expect(page.getByRole("heading", { name: /Masuk ke CMS/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("password salah ditolak dengan pesan", async ({ page }) => {
    await page.goto("/#/admin");
    await page.locator("#email").fill(EMAIL || "e2e-tidak-ada@muhdin.test");
    await page.locator("#password").fill("bukan-password-betulan-123");
    await page.getByRole("button", { name: /masuk/i }).first().click();
    // Pesan galat (inline) atau notifikasi — cukup salah satu muncul.
    await expect(page.getByText(/salah|gagal|terkunci/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("login benar membuka CMS & sesi bertahan (env-gated)", async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD tidak diset — lewati tes login sukses.");
    await page.goto("/#/admin");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).first().click();
    // CMS pasca-login: sambutan atau navigasi admin.
    await expect(page.getByText(/Selamat datang|Dashboard|Keluar/i).first()).toBeVisible({ timeout: 20_000 });
    // Sesi bertahan lewat reload penuh (cookie httpOnly).
    await page.reload();
    await expect(page.getByText(/Selamat datang|Dashboard|Keluar/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /Masuk ke CMS/i })).toBeHidden();
  });
});
