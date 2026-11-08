/**
 * v10 QA — mobile overflow check (iPhone 14 emulation) via Playwright.
 * Halaman: beranda, transparansi (statistik), paspor, tracking, tur-virtual.
 * Keluar: overflow-x per halaman + jumlah chart + screenshot.
 */
const { chromium, devices } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...devices["iPhone 14"],
    locale: "id-ID",
  });
  const page = await ctx.newPage();
  const routes = ["", "#/transparansi", "#/paspor", "#/tracking", "#/tur-virtual"];
  const results = [];
  for (const r of routes) {
    await page.goto(`http://localhost:3000/${r}`, { waitUntil: "load", timeout: 45000 });
    await page.waitForTimeout(3500);
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      charts: document.querySelectorAll(".recharts-responsive-container").length,
      title: document.body.innerText.slice(0, 60).replace(/\n/g, " "),
    }));
    results.push({ route: r || "beranda", overflow: m.sw - m.cw > 2, ...m });
    await page.screenshot({ path: `/tmp/v10-mob-${(r || "beranda").replace(/[^\w]/g, "_")}.png` });
  }
  console.log(JSON.stringify(results, null, 1));
  await browser.close();
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
