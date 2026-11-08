/**
 * Task 19 (R-078) — Penanganan permintaan PDP oleh petugas.
 * PUT /api/privacy-requests/[id]  { status: "PROCESSED"|"REJECTED", result? }
 * guardRole SUPER_ADMIN/ADMIN/VERIFIKATOR + audit log.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => null);
    const status = String(body?.status || "").toUpperCase();
    if (!["PROCESSED", "REJECTED", "PENDING"].includes(status)) return fail("Status tidak valid.");

    const existing = await db.privacyRequest.findUnique({ where: { id } });
    if (!existing) return fail("Permintaan tidak ditemukan.", 404);
    if (status === "PROCESSED" && !String(body?.result || "").trim()) {
      return fail("Catatan penanganan wajib diisi saat memproses (bukti kepatuhan UU PDP).");
    }

    const officer = await requireAdmin();
    const processedBy = officer?.name || officer?.email || "petugas";

    const pr = await db.privacyRequest.update({
      where: { id },
      data: {
        status,
        result: status === "PENDING" ? null : String(body.result || existing.result || "").trim() || null,
        processedBy: status === "PENDING" ? null : processedBy,
        processedAt: status === "PENDING" ? null : new Date(),
      },
    });

    void logAudit(req, {
      action: "UPDATE",
      entity: "PrivacyRequest",
      entityId: id,
      detail: `${existing.type} → ${status}`,
    });

    return ok(pr);
  } catch {
    return fail("Gagal memperbarui permintaan PDP.", 500);
  }
}
