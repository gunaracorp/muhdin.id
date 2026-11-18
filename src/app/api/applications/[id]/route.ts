import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit"; // Task 18
import { recordFunnel } from "@/lib/funnel"; // R-093 — funnel pendaftaran

/**
 * Task 17 — Verifikasi keanggotaan.
 * PUT  : Super Admin / Admin / VERIFIKATOR — setujui (auto-tambah anggota)
 *        atau tolak (wajib menyertakan alasan). Jejak pemeriksa disimpan.
 * DELETE: Super Admin / Admin saja (verifikator tidak dapat menghapus).
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  const me = await requireAdmin();
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const note = body.reviewNote ? String(body.reviewNote).trim() : "";

    if (action === "approve") {
      const app = await db.membershipApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewNote: note || null,
          reviewedBy: me?.name || null,
          reviewedAt: new Date(),
        },
      });
      // Buat anggota otomatis dari pendaftaran yang disetujui
      const existing = await db.member.findFirst({ where: { licenseNo: app.licenseNo } });
      if (!existing) {
        await db.member.create({
          data: {
            name: app.orgName,
            type: app.type,
            city: app.city,
            province: app.province,
            licenseNo: app.licenseNo,
            phone: app.phone,
            email: app.email,
            status: "TERVERIFIKASI",
            memberSince: new Date().getFullYear(),
            description: app.message,
          },
        });
      }
      // Task 18 — jejak audit persetujuan.
      void logAudit(req, { action: "APPROVE", entity: "Application", entityId: id, detail: `Setujui ${app.orgName}` });
      // R-093 — funnel: pendaftaran disetujui (gagal-aman).
      recordFunnel("APP_APPROVED", app.ticketCode);
      return ok(app);
    }

    if (action === "reject") {
      if (note.length < 5) {
        return fail("Alasan penolakan wajib diisi (minimal 5 karakter) agar pencalar mendapat kejelasan.");
      }
      const app = await db.membershipApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewNote: note,
          reviewedBy: me?.name || null,
          reviewedAt: new Date(),
        },
      });
      // Task 18 — jejak audit penolakan.
      void logAudit(req, { action: "REJECT", entity: "Application", entityId: id, detail: `Tolak ${app.orgName}` });
      return ok(app);
    }

    return fail("Aksi tidak dikenal.");
  } catch {
    return fail("Gagal memproses pendaftaran.", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await db.membershipApplication.delete({ where: { id } });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus pendaftaran.", 500);
  }
}
