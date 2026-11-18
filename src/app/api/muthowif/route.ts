import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, parseIntOr } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v6.0 — Kolam Muthowif (hulu): pembimbing ibadah bersertifikat multi-bahasa.
 * v13.3 R-021 — GET juga membawa catatan sertifikasi berjenjang (certs) untuk
 * lencana jenjang di portal (DASAR/LANJUTAN/MENTOR).
 * GET  publik: semua muthowif; filter ?lang=ID/AR/EN &q= &availability=
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: daftarkan muthowif.
 */

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const lang = sp.get("lang");
    const availability = sp.get("availability");
    const q = sp.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (availability) where.availability = availability;
    if (lang) where.languages = { contains: lang.toUpperCase() };
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { agency: { contains: q } },
        { specialties: { contains: q } },
        { certNo: { contains: q } },
      ];
    }

    const rows = await db.muthowif.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, city: true } },
        certs: { select: { level: true, status: true, certNo: true, serviceHours: true, examScore: true } },
      },
      orderBy: [{ rating: "desc" }, { experienceYears: "desc" }, { fullName: "asc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat kolam muthowif.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const fullName = String(body.fullName || "").trim();
    if (fullName.length < 3) return fail("Nama muthowif minimal 3 karakter.");

    let memberId: string | null = null;
    if (body.memberId) {
      const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
      if (!member) return fail("Anggota afiliasi tidak ditemukan.", 404);
      memberId = member.id;
    }

    const rating = Number(body.rating);
    const experienceYears = parseIntOr(String(body.experienceYears ?? "") || null, 1) as number;

    const muthowif = await db.muthowif.create({
      data: {
        fullName,
        certNo: String(body.certNo || ""),
        agency: String(body.agency || ""),
        languages: String(body.languages || "ID").toUpperCase(),
        specialties: String(body.specialties || ""),
        experienceYears: Math.max(0, experienceYears),
        phone: String(body.phone || ""),
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
        availability: ["AVAILABLE", "ASSIGNED", "UNAVAILABLE"].includes(String(body.availability))
          ? String(body.availability)
          : "AVAILABLE",
        memberId,
      },
      include: { member: { select: { id: true, name: true, city: true } } },
    });

    void logAudit(req, { action: "CREATE", entity: "Muthowif", entityId: muthowif.id, detail: muthowif.fullName });
    return ok(muthowif, 201);
  } catch {
    return fail("Gagal menambah muthowif.", 500);
  }
}
