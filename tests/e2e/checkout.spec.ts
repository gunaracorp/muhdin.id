/**
 * R-061 — E2E jalur kritis: CHECKOUT (pendaftaran → order).
 * Alur v12.4: katalog → detail paket → panel checkout → order PENDING
 * bernomor ORD-… → halaman lacak #/pesanan menampilkan pesanan tersebut.
 */
import { test, expect } from "@playwright/test";

test.describe("Checkout paket", () => {
  test("alur lengkap katalog hingga lacak pesanan", async ({ page }) => {
    await page.goto("/#/paket");

    // Buka detail paket seed E2E.
    await page.getByText(/Paket E2E Umroh GERBANG/i).first().click();
    const panel = page.getByTestId("checkout-panel");
    await expect(panel).toBeVisible({ timeout: 20_000 });

    // Isi data pemesan (validasi: nama ≥3 char, telepon 8–20 digit).
    await page.locator("#ck-name").fill("Ahmad E2E Playwright");
    await page.locator("#ck-phone").fill("081234567890");
    // PDP consent (R-078) wajib dicentang.
    await page.getByTestId("checkout-consent").click();
    await page.getByTestId("checkout-submit").click();

    // Konfirmasi: nomor order ORD-…
    const orderNo = page.getByTestId("order-number");
    await expect(orderNo).toBeVisible({ timeout: 20_000 });
    const number = (await orderNo.innerText()).trim();
    expect(number).toMatch(/^ORD-/);

    // Lacak pesanan — tombol bawa konfirmasi menuju #/pesanan.
    await page.getByTestId("track-order-btn").click();
    await expect(page.getByText(number).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/PENDING|Menunggu|DIPROSES/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
