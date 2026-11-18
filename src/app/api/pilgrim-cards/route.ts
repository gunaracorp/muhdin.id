import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { recordFunnel } from "@/lib/funnel"; // R-093 — funnel pendaftaran

/**
 * v5.0 — Kartu Jamaah Digital.
 * GET  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: daftar kartu (+ anggota terkait).
 * POST admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: terbitkan kartu baru —
 *      nomor kartu otomatis berurutan MHD-JM-<tahun>-<4 digit>.
 */
const cardInclude = {
  member: { select: { id: true, name: true, city: true } },
};

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (q) {
      where.OR = [
        { cardNo: { contains: q } },
        { fullName: { contains: q } },
        { groupName: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const cards = await db.pilgrimCard.findMany({ where, include: cardInclude, orderBy: { createdAt: "desc" } });
    return ok(cards);
  } catch {
    return fail("Gagal memuat kartu jamaah.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const fullName = String(body.fullName || "").trim();
    if (fullName.length < 3) return fail("Nama lengkap minimal 3 karakter.");

    const phone = String(body.phone || "").trim();
    const type = ["JAMAAH", "PENDAMPING", "PETUGAS"].includes(String(body.type)) ? String(body.type) : "JAMAAH";
    const groupName = String(body.groupName || "").trim();
    const note = String(body.note || "").trim();
    let memberId: string | null = null;
    if (body.memberId) {
      const member = await db.member.findUnique({ where: { id: String(body.memberId) } });
      if (!member) return fail("Anggota tidak ditemukan.", 404);
      memberId = member.id;
    }
    let validUntil: Date | null = null;
    if (body.validUntil) {
      validUntil = new Date(String(body.validUntil));
      if (Number.isNaN(validUntil.getTime())) return fail("Tanggal berlaku tidak valid.");
    }

    // Nomor kartu otomatis: lanjutkan urutan terpakai (tahan race dengan retry kecil).
    let cardNo = "";
    for (let attempt = 0; attempt < 5 && !cardNo; attempt++) {
      const agg = await db.pilgrimCard.aggregate({ _max: { cardNo: true } });
      const lastSeq = agg._max?.cardNo ? parseInt(agg._max.cardNo.slice(-4), 10) || 0 : 0;
      const candidate = `MHD-JM-${new Date().getFullYear()}-${String(lastSeq + 1).padStart(4, "0")}`;
      const clash = await db.pilgrimCard.findUnique({ where: { cardNo: candidate } });
      if (!clash) cardNo = candidate;
    }
    if (!cardNo) return fail("Gagal membangkitkan nomor kartu. Coba lagi.");

    const { getSessionUser } = await import("@/lib/auth");
    const user = await getSessionUser().catch(() => null);

    const card = await db.pilgrimCard.create({
      data: {
        cardNo,
        fullName,
        phone,
        type,
        memberId,
        groupName,
        status: "ACTIVE",
        validUntil,
        issuedBy: user?.name ?? "sistem",
        note: note || null,
      },
      include: cardInclude,
    });

    void logAudit(req, { action: "CREATE", entity: "PilgrimCard", entityId: card.id, detail: `${cardNo} — ${fullName}` });
    // R-093 — funnel: KTA diterbitkan (gagal-aman).
    recordFunnel("KTA_ISSUED", cardNo);
    return ok(card, 201);
  } catch {
    return fail("Gagal menerbitkan kartu.", 500);
  }
}
