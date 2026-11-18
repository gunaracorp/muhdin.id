import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail, computeLifecycle } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { decryptField, encryptField } from "@/lib/vault-crypto";

/**
 * v6.0 — Verifikasi brankas dokumen jamaah (CMS).
 * v13.3 R-076 — docNo/fileUrl/note ditulis terenkripsi AES-256-GCM (at-rest);
 * respons selalu plaintext hasil dekripsi agar UI CMS tetap terbaca.
 * PUT  admin [SUPER_ADMIN, ADMIN, VERIFIKATOR]: verifikasi/tolak pengajuan + ubah data.
 * DELETE admin [SUPER_ADMIN, ADMIN].
 */

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.jamaahDoc.findUnique({ where: { id }, include: { card: true } });
    if (!existing) return fail("Dokumen tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.kind !== undefined && ["PASPOR", "VISA", "VAKSIN", "TIKET", "ASURANSI", "LAINNYA"].includes(String(body.kind))) {
      data.kind = String(body.kind);
    }
    if (body.docNo !== undefined) data.docNo = encryptField(String(body.docNo)) ?? "";
    if (body.issueDate !== undefined) {
      if (!body.issueDate) data.issueDate = null;
      else {
        const d = new Date(String(body.issueDate));
        if (Number.isNaN(d.getTime())) return fail("Tanggal terbit tidak valid.");
        data.issueDate = d;
      }
    }
    if (body.expiryDate !== undefined) {
      if (!body.expiryDate) data.expiryDate = null;
      else {
        const d = new Date(String(body.expiryDate));
        if (Number.isNaN(d.getTime())) return fail("Tanggal kedaluwarsa tidak valid.");
        data.expiryDate = d;
      }
    }
    if (body.fileUrl !== undefined) data.fileUrl = body.fileUrl ? encryptField(String(body.fileUrl)) : null;
    if (body.note !== undefined) data.note = body.note ? encryptField(String(body.note)) : null;
    if (body.verifyStatus !== undefined && ["PENDING", "VERIFIED", "REJECTED"].includes(String(body.verifyStatus))) {
      data.verifyStatus = String(body.verifyStatus);
    }

    const doc = await db.jamaahDoc.update({
      where: { id },
      data,
      include: { card: { select: { id: true, cardNo: true, fullName: true, groupName: true, status: true } } },
    });
    void logAudit(req, {
      action: "UPDATE",
      entity: "JamaahDoc",
      entityId: id,
      detail: `${existing.card.cardNo} — ${doc.kind} → ${doc.verifyStatus}`,
    });
    const { lifecycle, daysLeft } = computeLifecycle(doc.expiryDate);
    return ok({ ...doc, docNo: decryptField(doc.docNo), fileUrl: decryptField(doc.fileUrl), note: decryptField(doc.note), lifecycle, daysLeft });
  } catch {
    return fail("Gagal memperbarui dokumen jamaah.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const doc = await db.jamaahDoc.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "JamaahDoc", entityId: id, detail: doc.kind });
    return ok({ success: true });
  } catch {
    return fail("Gagal menghapus dokumen jamaah.", 500);
  }
}
