/**
 * e2e-v141.mts — verifikasi browser sprint v14.1 «AKADEMI & MITRA».
 * Buka halaman baru, cek elemen kunci, simpan screenshot bukti di download/.
 * Jalankan: bun scripts/e2e-v141.mts
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3105";

async function main() {
  const browser = await chromium.launch({ executablePath: "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome" });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  async function shot(name: string) {
    await page.screenshot({ path: `download/v141-${name}.png`, fullPage: false });
    console.log(`  📸 v141-${name}.png`);
  }

  // 1. #/doa
  await page.goto(`${BASE}/#/doa`, { waitUntil: "networkidle" });
  const doaTitle = await page.locator('[data-testid="doa-title"]').textContent().catch(() => null);
  const doaCards = await page.locator('[data-testid^="doa-card-"]').count();
  console.log(`#/doa — title: ${doaTitle} · kartu: ${doaCards}`);
  await page.locator('[data-testid="doa-play-d01"]').first().click().catch(() => {});
  await shot("doa");

  // 2. #/kelas
  await page.goto(`${BASE}/#/kelas`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  const kelasCards = await page.locator('[data-testid^="kelas-card-"]').count();
  const kelasStats = await page.locator('[data-testid="kelas-stats"]').count();
  console.log(`#/kelas — kartu: ${kelasCards} · stats: ${kelasStats}`);
  await shot("kelas");

  // 3. #/rombongan
  await page.goto(`${BASE}/#/rombongan`, { waitUntil: "networkidle" });
  const rombTitle = await page.locator('[data-testid="rombongan-title"]').textContent().catch(() => null);
  const rombForm = await page.locator('[data-testid="rombongan-form"]').count();
  console.log(`#/rombongan — ${rombTitle} · form: ${rombForm}`);
  await shot("rombongan");

  // 4. #/masjid
  await page.goto(`${BASE}/#/masjid`, { waitUntil: "networkidle" });
  const masjidProgram = await page.locator('[data-testid="masjid-program"]').count();
  const masjidForm = await page.locator('[data-testid="masjid-form"]').count();
  console.log(`#/masjid — program: ${masjidProgram} · form: ${masjidForm}`);
  await shot("masjid");

  // 5. #/paket — badge promo
  await page.goto(`${BASE}/#/paket`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const promoBadges = await page.locator("text=/Early Bird|Musim Nov/").count();
  console.log(`#/paket — badge promo terlihat: ${promoBadges}`);
  await shot("paket-promo");

  // 6. #/tutorial — kartu baru
  await page.goto(`${BASE}/#/tutorial`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const tPanduan = await page.locator("text=Panduan Doa & Dzikir Audio").count();
  const tRombongan = await page.locator("text=Rombongan B2B").count();
  console.log(`#/tutorial — tutorial baru terlihat: doa=${tPanduan} rombongan=${tRombongan}`);
  await shot("tutorial");

  // 7. #/forum?kelasId= — diskusi kelas
  const kelasId = await page.evaluate(async () => {
    const r = await fetch("/api/live-classes").then((x) => x.json());
    return Array.isArray(r) && r[0] ? r[0].id : null;
  });
  if (kelasId) {
    await page.goto(`${BASE}/#/forum?kelasId=${kelasId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const threadKelas = await page.locator("text=tawaf putaran keempat").count();
    console.log(`#/forum?kelasId — thread kelas terlihat: ${threadKelas}`);
  }

  // 8. CMS login → Kelas Live & Mentor
  await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const email = page.locator('input[type="email"], input[name="email"]');
  if (await email.count()) {
    await email.fill("qa-v141@muhdin.local");
    await page.locator('input[type="password"], input[name="password"]').fill("QaV141-TempOnly");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1800);
  }
  const mentorMenu = page.locator("text=Kelas Live & Mentor");
  if (await mentorMenu.count()) {
    await mentorMenu.first().click();
    await page.waitForTimeout(1500);
    const dash = await page.locator('[data-testid="mentor-dashboard"]').count();
    const chips = await page.locator('[data-testid="mentor-classes"] button').count();
    console.log(`CMS Kelas Live & Mentor — dashboard: ${dash} · chip kelas: ${chips}`);
    await shot("cms-mentor");
    if (chips > 0) {
      await page.locator('[data-testid="mentor-classes"] button').first().click();
      await page.waitForTimeout(1200);
      const students = await page.locator('[data-testid="mentor-students"]').count();
      console.log(`  murid panel: ${students}`);
      await shot("cms-mentor-murid");
    }
  }

  console.log(errors.length === 0 ? "✅ 0 page error" : `❌ ${errors.length} page error:\n${errors.slice(0, 5).join("\n")}`);
  await browser.close();
  if (errors.length > 0) process.exit(1);
}

await main();
