/**
 * R-049 v15.0.0 «GOD MODE» — Kas Rombongan & Laporan Grup.
 * GET    ?code= → daftar catatan kas + ringkasan (saldo, iuran, pengeluaran)
 *                 — gerbang kode grup yang sama dengan ruang rombongan.
 * POST   → catat iuran/pengeluaran (Zod + rate-limit + audit; grup harus ada).
 * DELETE ?id=   → CMS menghapus catatan salah input (guardAdmin).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { safeBody, GroupLedgerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (code.length < 6) return fail("Kode grup tidak valid.");
  try {
    const group = await db.travelGroup.findUnique({ where: { code } });
    if (!group) return fail("Grup tidak ditemukan — periksa kode grup.", 404);
    const rows = await db.groupLedgerEntry.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: "desc" },
    });
    const income = rows.filter((r) => r.kind === "INCOME").reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter((r) => r.kind === "EXPENSE").reduce((s, r) => s + r.amount, 0);
    return ok({
      group: { code: group.code, name: group.name, marshalName: group.marshalName },
      summary: { income, expense, saldo: income - expense, count: rows.length },
      entries: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        amount: r.amount,
        note: r.note,
        byName: r.byName,
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return fail("Gagal memuat kas grup.", 500);
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "kas-grup", 8, 60_000)) {
    return fail("Terlalu banyak percobaan. Coba lagi beberapa saat.", 429);
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const parsed = safeBody(GroupLedgerSchema, body);
    if (!parsed.ok) return fail(parsed.error);

    const group = await db.travelGroup.findUnique({ where: { code: parsed.data.code } });
    if (!group) return fail("Grup tidak ditemukan — periksa kode grup.", 404);

    const entry = await db.groupLedgerEntry.create({
      data: {
        groupId: group.id,
        kind: parsed.data.kind,
        amount: parsed.data.amount,
        note: parsed.data.note,
        byName: parsed.data.byName,
      },
    });
    void logAudit(req, {
      action: "CREATE",
      entity: "GroupLedgerEntry",
      entityId: entry.id,
      detail: `${parsed.data.kind} Rp ${parsed.data.amount} di grup ${group.code} (oleh ${parsed.data.byName})`,
    });

    const rows = await db.groupLedgerEntry.findMany({ where: { groupId: group.id } });
    const income = rows.filter((r) => r.kind === "INCOME").reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter((r) => r.kind === "EXPENSE").reduce((s, r) => s + r.amount, 0);
    return ok(
      {
        entry: {
          id: entry.id,
          kind: entry.kind,
          amount: entry.amount,
          note: entry.note,
          byName: entry.byName,
          createdAt: entry.createdAt,
        },
        summary: { income, expense, saldo: income - expense, count: rows.length },
        message: "Catatan kas tersimpan — seluruh anggota melihat laporan yang sama.",
      },
      201,
    );
  } catch {
    return fail("Gagal menyimpan catatan kas.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!id) return fail("Parameter id wajib diisi.");
  try {
    const entry = await db.groupLedgerEntry.delete({ where: { id } });
    void logAudit(req, {
      action: "DELETE",
      entity: "GroupLedgerEntry",
      entityId: id,
      detail: `catatan kas ${entry.kind} Rp ${entry.amount} dihapus`,
    });
    return ok({ message: "Catatan kas dihapus." });
  } catch {
    return fail("Gagal menghapus catatan kas.", 500);
  }
}
