import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import {
  CERT_LEVELS,
  CERT_REQUIREMENTS,
  evaluateCert,
  genCertNo,
  type CertLevel,
} from "@/lib/muthawwif-cert";

/**
 * R-021 (v13.3) — Jalur Sertifikasi Muthawwif Berjenjang: DASAR → LANJUTAN → MENTOR.
 * GET  publik: seluruh jalur (syarat per jenjang) + status sertifikasi tiap muthowif
 *              (?muthowifId= filter) — transparansi jenjang untuk jamaah.
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: catat jam pelayanan + skor ujian per jenjang;
 *              evaluasi otomatis server-side → PASSED (nomor sertifikat + masa berlaku 24 bln)
 *              atau tetap CANDIDATE beserta alasan yang belum terpenuhi.
 */

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const muthowifId = sp.get("muthowifId")?.trim();
    const rows = await db.muthawwifCert.findMany({
      where: muthowifId ? { muthowifId } : undefined,
      include: { muthowif: { select: { id: true, fullName: true, agency: true, experienceYears: true, rating: true } } },
      orderBy: [{ muthowifId: "asc" }, { level: "asc" }],
    });
    return ok({
      jalur: CERT_LEVELS.map((lv) => ({
        level: lv,
        ...CERT_REQUIREMENTS[lv],
      })),
      rows,
    });
  } catch {
    return fail("Gagal memuat jalur sertifikasi muthawwif.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const muthowifId = String(body.muthowifId || "").trim();
    const level = String(body.level || "").toUpperCase() as CertLevel;
    if (!muthowifId) return fail("Muthawif wajib dipilih.");
    if (!CERT_LEVELS.includes(level)) return fail("Jenjang harus DASAR, LANJUTAN, atau MENTOR.");

    const muthowif = await db.muthowif.findUnique({ where: { id: muthowifId } });
    if (!muthowif) return fail("Muthawif tidak ditemukan.", 404);

    const serviceHours = Math.max(0, Math.floor(Number(body.serviceHours) || 0));
    const examScore = Math.min(100, Math.max(0, Math.floor(Number(body.examScore) || 0)));

    // Jenjang yang telah lulus (dari catatan sertifikasi yang ada).
    const passed = await db.muthawwifCert.findMany({
      where: { muthowifId, status: "PASSED" },
      select: { level: true },
    });
    const evaluation = evaluateCert(level, {
      examScore,
      serviceHours,
      experienceYears: muthowif.experienceYears,
      passedLevels: passed.map((p) => p.level),
    });

    const existing = await db.muthawwifCert.findFirst({
      where: { muthowifId, level },
    });

    let row;
    if (evaluation.eligible) {
      const certNo = await genCertNo(level, (p) =>
        db.muthawwifCert.count({ where: { certNo: { startsWith: p } } }),
      );
      const now = new Date();
      const data = {
        serviceHours,
        examScore,
        status: "PASSED" as const,
        certNo,
        issuedAt: now,
        expiresAt: new Date(now.getTime() + 24 * 30 * 24 * 60 * 60 * 1000),
        note: body.note ? String(body.note) : null,
      };
      row = existing
        ? await db.muthawwifCert.update({ where: { id: existing.id }, data })
        : await db.muthawwifCert.create({ data: { muthowifId, level, ...data } });
    } else {
      const data = {
        serviceHours,
        examScore,
        status: "CANDIDATE" as const,
        note: [body.note ? String(body.note) : null, ...evaluation.reasons].filter(Boolean).join(" | ") || null,
      };
      row = existing
        ? await db.muthawwifCert.update({ where: { id: existing.id }, data })
        : await db.muthawwifCert.create({ data: { muthowifId, level, ...data } });
    }

    void logAudit(req, {
      action: "UPDATE",
      entity: "MuthawwifCert",
      entityId: row.id,
      detail: `${muthowif.fullName} ${level}: jam ${serviceHours}, skor ${examScore} → ${row.status}${row.certNo ? ` (${row.certNo})` : ""}`,
    });

    return ok({
      cert: row,
      evaluation,
      syarat: { level, ...CERT_REQUIREMENTS[level] },
    });
  } catch {
    return fail("Gagal menyimpan catatan sertifikasi muthawwif.", 500);
  }
}
