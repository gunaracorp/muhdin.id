/**
 * R-096 «Duty Officer 24/7» — jadwal piket petugas darurat dengan eskalasi berjenjang.
 * GET  publik  → petugas yang jaga HARI INI (urut eskalasi) + seluruh roster aktif ringkas.
 * POST/PUT/DELETE guardAdmin — kelola roster (CMS/API).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ROLES = ["KOORDINATOR", "MARSHAL", "MEDIS", "IT_SUPPORT"] as const;
type DutyRole = (typeof ROLES)[number];

function isDutyRole(v: string): v is DutyRole {
  return (ROLES as readonly string[]).includes(v);
}

function parseDays(v: unknown): string | null {
  const s = String(v ?? "0,1,2,3,4,5,6").trim();
  if (!s) return null;
  const days = s.split(",").map((d) => Number(d.trim()));
  if (!days.length || days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return null;
  return Array.from(new Set(days)).sort().join(",");
}

export async function GET() {
  try {
    const roster = await db.dutyOfficer.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    const today = new Date().getDay(); // 0 = Minggu
    const onDuty = roster.filter((o) =>
      o.shiftDays.split(",").map((d) => Number(d)).includes(today)
    );
    return ok({
      today,
      onDuty: onDuty.length ? onDuty : roster.slice(0, 1), // fallback: petugas pertama
      roster,
    });
  } catch {
    return fail("Gagal memuat jadwal piket.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const b = await req.json().catch(() => null);
    if (!b) return fail("Data tidak valid.");
    const name = String(b.name || "").trim();
    const phone = String(b.phone || "").replace(/\D/g, "");
    if (name.length < 3) return fail("Nama petugas minimal 3 karakter.");
    if (phone.length < 9) return fail("Nomor telepon tidak valid (format internasional tanpa +).");
    const role = isDutyRole(String(b.role)) ? String(b.role) : "KOORDINATOR";
    const shiftDays = parseDays(b.shiftDays);
    if (!shiftDays) return fail("shiftDays tidak valid (hari 0-6, pisah koma).");
    const officer = await db.dutyOfficer.create({
      data: {
        name,
        phone,
        role,
        shiftDays,
        escalationMin: Math.min(120, Math.max(5, Number(b.escalationMin) || 15)),
        active: b.active === undefined ? true : !!b.active,
        sortOrder: Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 9,
      },
    });
    void logAudit(req, { action: "CREATE", entity: "DutyOfficer", entityId: officer.id, detail: `${name} (${role})` });
    return ok(officer, 201);
  } catch {
    return fail("Gagal menyimpan petugas jaga.", 500);
  }
}

export async function PUT(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const b = await req.json().catch(() => null);
    const id = String(b?.id || "");
    if (!id) return fail("id wajib diisi.");
    const data: Record<string, string | number | boolean> = {};
    if (b.name !== undefined) data.name = String(b.name).trim();
    if (b.phone !== undefined) data.phone = String(b.phone).replace(/\D/g, "");
    if (b.role !== undefined && isDutyRole(String(b.role))) data.role = String(b.role);
    if (b.shiftDays !== undefined) {
      const d = parseDays(b.shiftDays);
      if (!d) return fail("shiftDays tidak valid.");
      data.shiftDays = d;
    }
    if (b.escalationMin !== undefined) data.escalationMin = Math.min(120, Math.max(5, Number(b.escalationMin) || 15));
    if (b.active !== undefined) data.active = !!b.active;
    if (b.sortOrder !== undefined && Number.isFinite(Number(b.sortOrder))) data.sortOrder = Number(b.sortOrder);
    const officer = await db.dutyOfficer.update({ where: { id }, data });
    void logAudit(req, { action: "UPDATE", entity: "DutyOfficer", entityId: id, detail: officer.name });
    return ok(officer);
  } catch {
    return fail("Gagal memperbarui petugas jaga.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) return fail("id wajib diisi.");
    await db.dutyOfficer.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "DutyOfficer", entityId: id });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus petugas jaga.", 500);
  }
}
