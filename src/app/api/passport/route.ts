import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * v5 Fase 3 — Paspor Haji Digital (QR).
 * GET   : daftar paspor + statistik (SUPER_ADMIN/ADMIN/VERIFIKATOR)
 * POST  : terbitkan paspor baru (SUPER_ADMIN/ADMIN)
 * PATCH : ubah status/keterangan paspor (SUPER_ADMIN/ADMIN)
 */

const STATUSES = ["ACTIVE", "EXPIRED", "REVOKED", "LOST"];

/** Nomor paspor berurutan per jenis per tahun: PH-HAJ-2026-0001. */
async function nextPassportNo(type: string): Promise<string> {
  const seg = type === "HAJI" ? "HAJ" : "UMR";
  const prefix = `PH-${seg}-${new Date().getFullYear()}-`;
  const last = await db.hajjPassport.findFirst({
    where: { passportNo: { startsWith: prefix } },
    orderBy: { passportNo: "desc" },
    select: { passportNo: true },
  });
  const seq = last ? parseInt(last.passportNo.slice(-4), 10) || 0 : 0;
  for (let i = 1; i <= 50; i++) {
    const no = `${prefix}${String(seq + i).padStart(4, "0")}`;
    const exists = await db.hajjPassport.findFirst({ where: { passportNo: no }, select: { id: true } });
    if (!exists) return no;
  }
  throw new Error("Nomor paspor tidak tersedia.");
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const type = sp.get("type") || undefined;
    const q = sp.get("q") || undefined;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (type) where.type = type;
    if (q) where.OR = [{ holderName: { contains: q } }, { passportNo: { contains: q.toUpperCase() } }, { rombongan: { contains: q } }];

    const [rows, active, expired, revoked, lost, verifications] = await Promise.all([
      db.hajjPassport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { member: { select: { name: true } } },
      }),
      db.hajjPassport.count({ where: { status: "ACTIVE" } }),
      db.hajjPassport.count({ where: { status: "EXPIRED" } }),
      db.hajjPassport.count({ where: { status: "REVOKED" } }),
      db.hajjPassport.count({ where: { status: "LOST" } }),
      db.hajjPassport.aggregate({ _sum: { verificationCount: true } }),
    ]);

    return ok({
      rows,
      stats: { active, expired, revoked, lost, total: rows.length, verifications: verifications._sum.verificationCount || 0 },
    });
  } catch {
    return fail("Gagal memuat paspor.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const holderName = String(body.holderName || "").trim();
    if (!holderName) return fail("Nama pemegang wajib diisi.");
    const type = body.type === "HAJI" ? "HAJI" : "UMRAH";
    const gender = body.gender === "F" ? "F" : "M";

    // Kedaluwarsa default: HAJI +5 tahun, UMRAH +2 tahun.
    const years = type === "HAJI" ? 5 : 2;
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : new Date(Date.now() + years * 365.25 * 86400_000);
    if (Number.isNaN(expiresAt.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");

    const passportNo = await nextPassportNo(type);
    const passport = await db.hajjPassport.create({
      data: {
        passportNo,
        holderName,
        type,
        gender,
        nationality: String(body.nationality || "IDN").slice(0, 3).toUpperCase(),
        rombongan: body.rombongan ? String(body.rombongan).trim() : null,
        memberId: body.memberId ? String(body.memberId) : null,
        status: "ACTIVE",
        expiresAt,
        notes: body.notes ? String(body.notes).slice(0, 300) : null,
      },
    });
    await logAudit(req, { action: "PASSPORT_ISSUE", entity: "HajjPassport", entityId: passport.id, detail: passportNo });
    return ok(passport, 201);
  } catch {
    return fail("Gagal menerbitkan paspor.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return fail("ID paspor wajib diisi.");
    const existing = await db.hajjPassport.findUnique({ where: { id } });
    if (!existing) return fail("Paspor tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(String(body.status))) return fail("Status tidak valid.");
      data.status = String(body.status);
    }
    if (body.rombongan !== undefined) data.rombongan = body.rombongan ? String(body.rombongan).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).slice(0, 300) : null;
    if (body.expiresAt !== undefined) {
      const d = new Date(String(body.expiresAt));
      if (Number.isNaN(d.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");
      data.expiresAt = d;
    }
    if (!Object.keys(data).length) return fail("Tidak ada perubahan.");

    const passport = await db.hajjPassport.update({ where: { id }, data });
    await logAudit(req, {
      action: "PASSPORT_UPDATE",
      entity: "HajjPassport",
      entityId: id,
      detail: `${existing.passportNo} → ${data.status ?? existing.status}`,
    });
    return ok(passport);
  } catch {
    return fail("Gagal memperbarui paspor.", 500);
  }
}
