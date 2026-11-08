/**
 * debug-totp.ts — bantu diagnosis E2E 2FA: ambil secret admin, cetak kode
 * saat ini + hasil verifikasi mandiri (self-test lib).
 * Jalankan: bun scripts/debug-totp.ts
 */
import { db } from "../src/lib/db";
import { totpNow, verifyTotp } from "../src/lib/totp";

async function main() {
  const u = await db.user.findUnique({ where: { email: "admin@muhdin.web.id" } });
  if (!u?.totpSecret) {
    console.log("SECRET: KOSONG (totpEnabled:", u?.totpEnabled, ")");
    return;
  }
  const code = totpNow(u.totpSecret);
  console.log("totpEnabled:", u.totpEnabled);
  console.log("secret   :", u.totpSecret.slice(0, 8) + "…(" + u.totpSecret.length + ")");
  console.log("kode     :", code);
  console.log("self-verify:", verifyTotp(u.totpSecret, code));
  console.log("step detik:", new Date().getSeconds(), "(±1 window)");
  await db.$disconnect();
}
main();
