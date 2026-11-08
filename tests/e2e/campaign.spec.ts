/**
 * R-061 + R-089 — E2E jalur kritis: LANDING KAMPANYE & LEAD.
 * SSR /kampanye/[slug] harus hidup, metadata terpasang, dan formulir lead
 * menerima pendaftaran (honeypot + rate-limit di sisi server).
 */
import { test, expect } from "@playwright/test";

const SLUG = "kampanye-e2e-gerbang";

test.describe("Landing kampanye musiman", () => {
  test("landing SSR terbuka dengan judul & form lead", async ({ page }) => {
    const res = await page.goto(`/kampanye/${SLUG}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Kampanye E2E GERBANG/i, { timeout: 20_000 });
    await expect(page.getByPlaceholder(/Nama lengkap/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Nomor WhatsApp/i)).toBeVisible();
  });

  test("kirim lead konversi sukses", async ({ page }) => {
    await page.goto(`/kampanye/${SLUG}`);
    await page.getByPlaceholder(/Nama lengkap/i).fill("Siti E2E Kampanye");
    await page.getByPlaceholder(/Nomor WhatsApp/i).fill("081298765432");
    await page.getByRole("button", { name: /Daftar Sekarang/i }).click();
    await expect(page.getByText(/Terima kasih/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("slug tak dikenal → 404", async ({ page }) => {
    const res = await page.goto("/kampanye/kampanye-tidak-ada-xyz");
    expect(res?.status()).toBe(404);
  });
});
