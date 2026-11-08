import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { lockState, recordFail, clearFails } from "@/lib/password-lockout";
import { verifyTotp } from "@/lib/totp";
import { logAudit } from "@/lib/audit";

/**
 * POST /api/auth/login — v12.3 «AMANAH»:
 *  1. Rate-limit per-IP (10/menit) — lapis 1.
 *  2. Lockout brute-force per-Email (5 gagal/15 menit → kunci 15 menit) — lapis 2.
 *  3. Verifikasi password + akun aktif.
 *  4. 2FA TOTP (RFC 6238) bila aktif: tanpa kode → { needTotp } (tanpa sesi),
 *     kode salah dihitung sebagai kegagalan lockout.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "login", 10, 60_000)) {
    return fail("Terlalu banyak percobaan dari jaringan Anda. Tunggu sebentar.", 429);
  }
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const totpCode = String(body.totpCode || "").trim();
    if (!email || !password) return fail("Email dan password wajib diisi.");

    const lock = lockState(email);
    if (lock.locked) {
      return fail(
        `Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${lock.minutes} menit.`,
        423,
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.password)) {
      const justLocked = recordFail(email);
      if (justLocked) void logAudit(req, { action: "LOGIN_LOCKOUT", entity: "User", entityId: email, detail: "5 kegagalan berturut — akun dikunci 15 menit" });
      return fail("Email atau password salah.", 401);
    }
    // Multi-admin (Task 15-c): akun nonaktif ditolak.
    if (!user.isActive) {
      return fail("Akun Anda dinonaktifkan. Hubungi Super Admin.", 403);
    }
    // v12.3 — 2FA TOTP: tantangan tanpa membuat sesi.
    if (user.totpEnabled && user.totpSecret) {
      if (!totpCode) return ok({ needTotp: true });
      if (!verifyTotp(user.totpSecret, totpCode)) {
        const justLocked = recordFail(email);
        if (justLocked) void logAudit(req, { action: "LOGIN_LOCKOUT", entity: "User", entityId: email, detail: "Kode 2FA salah berulang — akun dikunci 15 menit" });
        return fail("Kode autentikasi (2FA) salah atau kedaluwarsa.", 401);
      }
    }
    clearFails(email);
    // R-077 — rekam perangkat & IP pada sesi baru (device management).
    const fwd = req.headers.get("x-forwarded-for") || "";
    await createSession(user.id, {
      userAgent: req.headers.get("user-agent"),
      ip: (fwd.split(",")[0] || "").trim() || req.headers.get("x-real-ip") || null,
    });
    await db.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => {});
    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.isActive } });
  } catch {
    return fail("Terjadi kesalahan pada server.", 500);
  }
}
