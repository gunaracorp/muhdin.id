import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { generateApiKey, hashKey } from "@/lib/api-partner";

/**
 * R-065 v14.1 — operasi mitra API (PATCH/DELETE).
 * PATCH: ubah nama/email/kuota/aktif. Ganti URL webhook → sekret webhook
 * BARU dihasilkan dan TAMPIL SEKALI pada respons (hash disimpan).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const existing = await db.apiPartner.findUnique({ where: { id } });
    if (!existing) return fail("Mitra API tidak ditemukan.", 404);

    const data: {
      name?: string;
      email?: string;
      quotaDaily?: number;
      webhookUrl?: string;
      active?: boolean;
      webhookSecretHash?: string;
    } = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) return fail("Nama mitra minimal 3 karakter.");
      data.name = name;
    }
    if (body.email !== undefined) data.email = String(body.email).trim().slice(0, 120);
    if (body.quotaDaily !== undefined) {
      const q = Math.max(0, Math.min(100_000, Math.floor(Number(body.quotaDaily))));
      if (Number.isNaN(q)) return fail("Kuota tidak valid.");
      data.quotaDaily = q;
    }
    if (body.active !== undefined) data.active = Boolean(body.active);

    let newSecret: string | null = null;
    if (body.webhookUrl !== undefined) {
      const url = String(body.webhookUrl).trim();
      if (url && !/^https?:\/\/.+/.test(url)) return fail("URL webhook harus dimulai http(s)://.");
      data.webhookUrl = url;
      newSecret = generateApiKey();
      data.webhookSecretHash = hashKey(newSecret);
    }

    const partner = await db.apiPartner.update({ where: { id }, data });
    await logAudit(req, { action: "UPDATE", entity: "ApiPartner", entityId: id, detail: `${existing.name} diperbarui` });
    return ok({
      partner,
      ...(newSecret ? { credentials: { webhookSecret: newSecret }, message: "Sekret webhook BARU — tampil sekali, salin sekarang." } : {}),
    });
  } catch {
    return fail("Gagal memperbarui mitra API.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.apiPartner.findUnique({ where: { id } });
    if (!existing) return fail("Mitra API tidak ditemukan.", 404);
    await db.apiPartner.delete({ where: { id } });
    await logAudit(req, { action: "DELETE", entity: "ApiPartner", entityId: id, detail: existing.name });
    return ok({ deleted: id });
  } catch {
    return fail("Gagal menghapus mitra API.", 500);
  }
}
