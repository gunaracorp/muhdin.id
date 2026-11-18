import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-012 (v13.3) — Grup Perjalanan Digital: ruang khusus per rombongan.
 * GET  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: daftar semua grup + hitungan anggota/pesan/jadwal (?status=ACTIVE/ARCHIVED).
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: buat grup — kode bergabung dibangkitkan unik server (MHD-GR-XXXX).
 */

/** Kode bergabung 4 karakter tanpa karakter membingungkan (0/O, 1/I). */
function genGroupCode(): string {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `MHD-GR-${s}`;
}

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get("status");
    const rows = await db.travelGroup.findMany({
      where: status ? { status } : undefined,
      include: {
        pkg: { select: { id: true, title: true, departureDate: true } },
        _count: { select: { members: true, messages: true, schedules: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat daftar grup perjalanan.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return fail("Data tidak valid.");

    const name = String(body.name || "").trim();
    if (name.length < 3) return fail("Nama grup minimal 3 karakter.");

    let packageId: string | null = null;
    if (body.packageId) {
      const pkg = await db.tourPackage.findUnique({ where: { id: String(body.packageId) } });
      if (!pkg) return fail("Paket tidak ditemukan.", 404);
      packageId = pkg.id;
    }
    if (body.marshalPhone && !/^[+0-9 ()-]{6,20}$/.test(String(body.marshalPhone))) {
      return fail("Nomor telepon marshal tidak valid.");
    }

    // Kode unik — ulang bila tabrakan (ruang kode 32^4, tabrakan nyaris mustahil).
    let code = genGroupCode();
    for (let i = 0; i < 5; i++) {
      const clash = await db.travelGroup.findUnique({ where: { code } });
      if (!clash) break;
      code = genGroupCode();
    }

    const departureDate = body.departureDate ? new Date(String(body.departureDate)) : null;

    const group = await db.travelGroup.create({
      data: {
        code,
        name,
        packageId,
        departureDate: departureDate && !Number.isNaN(departureDate.getTime()) ? departureDate : null,
        marshalName: String(body.marshalName || "").trim(),
        marshalPhone: String(body.marshalPhone || "").trim(),
        notes: body.notes ? String(body.notes) : null,
        status: body.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
      },
      include: {
        pkg: { select: { id: true, title: true, departureDate: true } },
        _count: { select: { members: true, messages: true, schedules: true } },
      },
    });

    void logAudit(req, { action: "CREATE", entity: "TravelGroup", entityId: group.id, detail: `${group.name} (${code})` });
    return ok(group, 201);
  } catch {
    return fail("Gagal membuat grup perjalanan.", 500);
  }
}
