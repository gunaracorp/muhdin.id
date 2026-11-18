/**
 * smoke-v14.mts — uji asap alur kupon v14.0 end-to-end terhadap server hidup.
 * Jalankan: BASE_URL=http://localhost:3005 bun scripts/smoke-v14.mts
 * (bun memuat .env otomatis — PAYMENT_WEBHOOK_SECRET tersedia untuk signature).
 */
import { createHmac } from "node:crypto";

const BASE = (process.env.BASE_URL || "http://localhost:3005").replace(/\/$/, "");
let failed = 0;

function check(name: string, cond: boolean, detail: string) {
  console.log(`  [${cond ? "PASS" : "FAIL"}] ${name} — ${detail}`);
  if (!cond) failed++;
}

async function post(path: string, body: unknown, headers?: Record<string, string>) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: res.status, json };
}

async function main() {
  console.log("== SMOKE v14.0 «KAMPANYE & KAWAL» ==");

  // 1) Validasi kupon demo
  const v1 = await post("/api/coupons/validate", { code: "UMRAH14", amount: 35_000_000 });
  check("validate UMRAH14", v1.status === 200 && v1.json?.ok === true && v1.json?.discount === 1_000_000,
    `status ${v1.status} discount=${v1.json?.discount} (maks 1 juta tercapai)`);

  const v2 = await post("/api/coupons/validate", { code: "  umrah14 ", amount: 35_000_000 });
  check("normalize lowercase+spasi", v2.status === 200 && v2.json?.ok === true, `status ${v2.status}`);

  const v3 = await post("/api/coupons/validate", { code: "TIDAKADA", amount: 35_000_000 });
  check("kode asing ditolak", v3.status === 200 && v3.json?.ok === false && v3.json?.reason === "NOT_FOUND", `reason=${v3.json?.reason}`);

  const v4 = await post("/api/coupons/validate", { code: "UMRAH14", amount: 2_000_000 });
  check("minimum belanja ditolak", v4.json?.ok === false && v4.json?.reason === "MIN_AMOUNT", `reason=${v4.json?.reason}`);

  // 2) Ambil paket terpublished untuk checkout
  const pkgs = (await fetch(`${BASE}/api/packages`).then((r) => r.json())) as { id: string; price: number; title: string }[];
  const pkg = Array.isArray(pkgs) ? pkgs[0] : null;
  if (!pkg) {
    console.log("  [SKIP] tidak ada paket PUBLISHED");
    process.exit(1);
  }
  const subtotal = pkg.price * 2;

  // 3) Checkout dengan kupon — potongan dihitung server
  const co = await post("/api/checkout", {
    packageId: pkg.id, name: "Tester Kupon", phone: "+628123450001", quantity: 2,
    couponCode: "UMRAH14", pdpConsent: true,
  });
  const coBody = (co.json ?? {}) as { order?: { number: string; amount: number; subtotal?: number; discountAmount?: number; couponCode?: string } };
  const order = coBody.order;
  const expectDiscount = Math.min(1_000_000, Math.floor((subtotal * 14) / 100));
  check(
    "checkout + kupon → amount berkurang",
    co.status === 201 && !!order && order.discountAmount === expectDiscount && order.amount === subtotal - expectDiscount && order.couponCode === "UMRAH14",
    `status ${co.status} subtotal ${order?.subtotal} − ${order?.discountAmount} = ${order?.amount}`
  );

  // 4) Checkout tanpa kupon tidak berubah
  const co2 = await post("/api/checkout", { packageId: pkg.id, name: "Tanpa Kupon", phone: "+628123450002", quantity: 1, pdpConsent: true });
  const o2 = (co2.json as { order?: { amount: number } } | null)?.order;
  check("checkout tanpa kupon tetap penuh", co2.status === 201 && o2?.amount === pkg.price, `amount=${o2?.amount}`);

  // 5) Webhook LUNAS (signature HMAC) → order PAID + tebusan tercatat + kuota naik
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || "";
  if (!secret) {
    console.log("  [SKIP] PAYMENT_WEBHOOK_SECRET tidak tersedia di env");
    process.exit(failed > 0 ? 1 : 0);
  }
  const payload = JSON.stringify({ orderNumber: order!.number, status: "SUCCESS", ref: "SMOKE-1", method: "SANDBOX" });
  const sig = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  const cb = await fetch(`${BASE}/api/payments/callback`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-muhdin-signature": sig },
    body: payload,
  });
  const cbJson = (await cb.json().catch(() => null)) as { applied?: boolean } | null;
  check("webhook LUNAS diterapkan", cb.status === 200 && cbJson?.applied === true, `status ${cb.status} applied=${cbJson?.applied}`);

  // Idempoten: callback ulang tidak menggandakan tebusan
  const cb2 = await fetch(`${BASE}/api/payments/callback`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-muhdin-signature": sig },
    body: payload,
  });
  const cb2Json = (await cb2.json().catch(() => null)) as { applied?: boolean } | null;
  check("callback ulang idempoten (applied=false)", cb2.status === 200 && cb2Json?.applied === false, `applied=${cb2Json?.applied}`);

  // 6) Verifikasi DB: tebusan 1 baris, usedCount 1
  const { createRequire } = await import("node:module");
  const require2 = createRequire(import.meta.url);
  const { PrismaClient } = require2("@prisma/client");
  const db = new PrismaClient();
  const redemptions = await db.couponRedemption.count({ where: { orderNumber: order!.number } });
  const coupon = await db.coupon.findUnique({ where: { code: "UMRAH14" } });
  check("tebusan tercatat tepat 1x", redemptions === 1, `redemptions=${redemptions}`);
  check("usedCount naik tepat 1", coupon?.usedCount === 1, `usedCount=${coupon?.usedCount}`);
  check("amount tebusan = diskon", (await db.couponRedemption.findFirst({ where: { orderNumber: order!.number } }))?.amount === expectDiscount, `amount=${expectDiscount}`);
  await db.$disconnect();

  console.log(failed === 0 ? "\nSEMUA SMOKE LOLOS" : `\n${failed} SMOKE GAGAL`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
