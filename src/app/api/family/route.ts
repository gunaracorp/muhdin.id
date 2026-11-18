/**
 * R-018 v15.0.0 «GOD MODE» — Akun Pengampu Keluarga.
 * GET    ?phone=   → daftar anggota keluarga milik pengampu (masking sebagian).
 * POST             → tambah anggota keluarga (Zod + rate-limit + audit).
 * DELETE ?id=&phone= → hapus anggota (hanya pemilik nomor pengampu).
 *
 * Satu pengampu mengelola data & status anggota keluarga (anak, orang tua,
 * lansia) dalam satu layar — gerbang aksesnya nomor WhatsApp pengampu.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, FamilyMemberSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

/** Samarkan sebagian nomor di log/audit (non-PII penuh). */
function maskPhone(phone: string): string {
  if (phone.length < 6) return "***";
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim() ?? "";
  if (phone.length < 8) return fail("Nomor pengampu tidak valid.");
  try {
    const rows = await db.familyMember.findMany({
      where: { guardianPhone: phone },
      orderBy: { createdAt: "asc" },
    });
    return ok({
      guardian: maskPhone(phone),
      members: rows.map((r) => ({
        id: r.id,
        name: r.name,
        relation: r.relation,
        birthYear: r.birthYear,
        passportNo: r.passportNo,
        notes: r.notes,
      })),
    });
  } catch {
    return fail("Gagal memuat data keluarga.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "family-add", 6, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(FamilyMemberSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const member = await db.familyMember.create({
      data: {
        guardianPhone: parsed.data.guardianPhone,
        name: parsed.data.name,
        relation: parsed.data.relation,
        birthYear: parsed.data.birthYear ?? null,
        passportNo: parsed.data.passportNo || null,
        notes: parsed.data.notes || null,
      },
    });
    void logAudit(req, {
      action: "CREATE",
      entity: "FamilyMember",
      entityId: member.id,
      detail: `pengampu ${maskPhone(parsed.data.guardianPhone)} menambah ${member.name} (${member.relation})`,
    });
    return ok(
      {
        id: member.id,
        name: member.name,
        relation: member.relation,
        message: `${member.name} ditambahkan ke daftar keluarga Anda.`,
      },
      201,
    );
  } catch {
    return fail("Gagal menambah anggota keluarga.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  const phone = req.nextUrl.searchParams.get("phone")?.trim() ?? "";
  if (!id || phone.length < 8) return fail("Permintaan hapus tidak valid.");
  try {
    // Pastikan anggota benar milik pengampu dengan nomor tersebut.
    const member = await db.familyMember.findFirst({ where: { id, guardianPhone: phone } });
    if (!member) return fail("Data tidak ditemukan untuk nomor pengampu ini.", 404);
    await db.familyMember.delete({ where: { id } });
    void logAudit(req, {
      action: "DELETE",
      entity: "FamilyMember",
      entityId: id,
      detail: `pengampu ${maskPhone(phone)} menghapus ${member.name}`,
    });
    return ok({ message: `${member.name} dihapus dari daftar keluarga.` });
  } catch {
    return fail("Gagal menghapus anggota keluarga.", 500);
  }
}
