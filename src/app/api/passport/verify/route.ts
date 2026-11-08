import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";

/**
 * v5 Fase 3 — Verifikasi publik paspor (target pemindaian QR).
 * POST { code } → data pemegang + status validitas.
 *
 * Catatan privasi: hanya menampilkan data yang memang perlu untuk
 * verifikasi di lapangan (bandara/hotel/kantor DPD) — tanpa data sensitif.
 * Setiap verifikasi berhasil (paspor ACTIVE) dicatat hitungannya.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(req, "passport-verify", 20, 60_000)) {
    return ok({ found: false, throttled: true });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return ok({ found: false });

    const p = await db.hajjPassport.findFirst({
      where: { passportNo: code },
      include: { member: { select: { name: true, city: true } } },
    });
    if (!p) return ok({ found: false });

    // Kadaluarsa otomatis: paspor ACTIVE yang lewat masa berlaku
    // diperbarui statusnya menjadi EXPIRED (lazy expiry).
    let status = p.status;
    if (status === "ACTIVE" && p.expiresAt.getTime() < Date.now()) {
      status = "EXPIRED";
      await db.hajjPassport.update({ where: { id: p.id }, data: { status: "EXPIRED" } });
    }

    let verificationCount = p.verificationCount;
    let lastVerifiedAt = p.lastVerifiedAt;
    // silent=true → hanya cek (dipakai demo kartu di #/paspor), tanpa menaikkan counter.
    if (status === "ACTIVE" && !body.silent) {
      const updated = await db.hajjPassport.update({
        where: { id: p.id },
        data: { verificationCount: { increment: 1 }, lastVerifiedAt: new Date() },
        select: { verificationCount: true, lastVerifiedAt: true },
      });
      verificationCount = updated.verificationCount;
      lastVerifiedAt = updated.lastVerifiedAt;
    }

    return ok({
      found: true,
      valid: status === "ACTIVE",
      reason: status, // ACTIVE | EXPIRED | REVOKED | LOST
      passport: {
        passportNo: p.passportNo,
        holderName: p.holderName,
        type: p.type,
        gender: p.gender,
        nationality: p.nationality,
        rombongan: p.rombongan,
        status,
        issuedAt: p.issuedAt.toISOString(),
        expiresAt: p.expiresAt.toISOString(),
        verificationCount,
        lastVerifiedAt: lastVerifiedAt ? lastVerifiedAt.toISOString() : null,
        org: p.member ? { name: p.member.name, city: p.member.city } : null,
      },
    });
  } catch {
    return ok({ found: false, error: true });
  }
}
