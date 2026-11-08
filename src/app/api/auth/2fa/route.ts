import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { generateTotpSecret, verifyTotp, otpauthUri } from "@/lib/totp";
import { logAudit } from "@/lib/audit";

/**
 * v12.3 «AMANAH» — R-074: Autentikasi Dua Faktor (TOTP) per akun admin.
 *
 * GET  /api/auth/2fa            → status 2FA akun sendiri.
 * POST { action: "setup" }      → buat rahasia baru + QR (belum aktif).
 * POST { action: "enable", code } → verifikasi kode → aktifkan 2FA.
 * POST { action: "disable", code } → verifikasi kode → matikan & hapus rahasia.
 * Semua bekerja pada akun yang sedang login (bukan akun orang lain).
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return fail("Tidak diizinkan — silakan login sebagai admin.", 401);
  return ok({ enabled: user.totpEnabled });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return fail("Tidak diizinkan — silakan login sebagai admin.", 401);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "setup") {
      const secret = generateTotpSecret();
      await db.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } });
      const uri = otpauthUri(user.email, secret);
      const qr = await QRCode.toDataURL(uri, { width: 220, margin: 1 });
      return ok({ secret, uri, qr });
    }

    if (action === "enable") {
      const code = String(body.code || "");
      if (!user.totpSecret) return fail("Jalankan setup terlebih dahulu.", 400);
      if (!verifyTotp(user.totpSecret, code)) return fail("Kode salah — coba lagi dengan kode terbaru.", 401);
      await db.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
      void logAudit(req, { action: "2FA_ENABLE", entity: "User", entityId: user.id, detail: `2FA diaktifkan untuk ${user.email}` });
      return ok({ enabled: true });
    }

    if (action === "disable") {
      const code = String(body.code || "");
      if (!user.totpSecret || !verifyTotp(user.totpSecret, code))
        return fail("Kode salah — 2FA tidak dimatikan.", 401);
      await db.user.update({ where: { id: user.id }, data: { totpSecret: null, totpEnabled: false } });
      void logAudit(req, { action: "2FA_DISABLE", entity: "User", entityId: user.id, detail: `2FA dimatikan untuk ${user.email}` });
      return ok({ enabled: false });
    }

    return fail("Aksi tidak dikenal.", 400);
  } catch {
    return fail("Gagal memproses permintaan 2FA.", 500);
  }
}
