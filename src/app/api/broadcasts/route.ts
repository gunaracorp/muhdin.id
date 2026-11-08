/**
 * Task 19 (R-094) — Broadcast WA template terjadwal.
 *
 * GET  /api/broadcasts          (guardRole SUPER_ADMIN/ADMIN) — daftar + stats
 * POST /api/broadcasts          — buat DRAFT atau SCHEDULED (audit)
 * Body: { title, template, audience, scheduledAt?, action?: "DRAFT"|"SCHEDULED" }
 *
 * Template mendukung {{nama}} dan {{tanggal}}; kirim aktual lewat
 * POST /api/broadcasts/[id] (aksi "send" manual) atau worker jadwal
 * (scripts/broadcast-worker.ts — crontab tiap 5 menit, terdokumentasi di README).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

const AUDIENCES = ["ALL_MEMBERS", "KTA_ACTIVE", "PENDING_ORDERS"] as const;

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const [rows, scheduled, sent] = await Promise.all([
      db.broadcast.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.broadcast.count({ where: { status: "SCHEDULED" } }),
      db.broadcast.count({ where: { status: "SENT" } }),
    ]);
    return ok({ rows, stats: { total: rows.length, scheduled, sent } });
  } catch {
    return fail("Gagal memuat broadcast.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    const title = String(body?.title || "").trim();
    const template = String(body?.template || "").trim();
    const audience = String(body?.audience || "ALL_MEMBERS");
    const action = String(body?.action || "DRAFT").toUpperCase();

    if (title.length < 4) return fail("Judul broadcast minimal 4 karakter.");
    if (template.length < 20) return fail("Template pesan minimal 20 karakter.");
    if (!AUDIENCES.includes(audience as (typeof AUDIENCES)[number])) return fail("Audience tidak dikenal.");
    if (!template.includes("{{nama}}")) return fail("Template wajib memuat {{nama}} sebagai sapaan penerima.");

    let scheduledAt: Date | null = null;
    if (action === "SCHEDULED") {
      scheduledAt = body.scheduledAt ? new Date(String(body.scheduledAt)) : null;
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return fail("Jadwal kirim tidak valid.");
      if (scheduledAt.getTime() < Date.now()) return fail("Jadwal kirim harus di masa depan.");
    }

    const officer = (await import("@/lib/auth")).requireAdmin;
    const user = await officer();
    const bc = await db.broadcast.create({
      data: {
        title,
        template,
        audience,
        status: action === "SCHEDULED" ? "SCHEDULED" : "DRAFT",
        scheduledAt,
        createdBy: user?.name || user?.email || "admin",
      },
    });

    void logAudit(req, { action: "CREATE", entity: "Broadcast", entityId: bc.id, detail: `${title} → ${audience}` });
    return ok(bc, 201);
  } catch {
    return fail("Gagal membuat broadcast.", 500);
  }
}
