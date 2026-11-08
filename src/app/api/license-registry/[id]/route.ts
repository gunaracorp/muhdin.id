import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { LEGAL_ENTITIES, parseDocsInput } from "@/lib/license-docs";

/**
 * v7.0 — Detail perusahaan registri Pindai Izin 360°.
 * PUT    admin [SUPER_ADMIN, ADMIN, EDITOR]: ubah data perusahaan; bila body.docs
 *        dikirim → seluruh dokumen diganti (ganti-total, pola sederhana & audit jelas).
 * DELETE admin [SUPER_ADMIN, ADMIN]: hapus perusahaan (+ dokumen ikut cascade).
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const existing = await db.registryCompany.findUnique({ where: { id } });
    if (!existing) return fail("Perusahaan registri tidak ditemukan.", 404);

    const data: Record<string, unknown> = {};
    if (body.nib !== undefined) {
      const nib = String(body.nib).replace(/\D+/g, "");
      if (nib.length < 6) return fail("NIB tidak valid — minimal 6 digit angka.");
      const dup = await db.registryCompany.findUnique({ where: { nib } });
      if (dup && dup.id !== id) return fail("NIB sudah dipakai perusahaan lain di registri.", 409);
      data.nib = nib;
    }
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) return fail("Nama perusahaan minimal 3 karakter.");
      data.name = name;
    }
    if (body.legalEntity !== undefined && LEGAL_ENTITIES.includes(String(body.legalEntity))) data.legalEntity = String(body.legalEntity);
    if (body.city !== undefined) data.city = String(body.city);
    if (body.province !== undefined) data.province = String(body.province);
    if (body.phone !== undefined) data.phone = String(body.phone);
    if (body.website !== undefined) data.website = body.website ? String(body.website) : null;
    if (body.note !== undefined) data.note = body.note ? String(body.note) : null;

    const docs = parseDocsInput(body.docs);
    if (docs === null) return fail("Ada kunci syarat (requirementKey) yang tidak dikenal pada dokumen.");

    const company = await db.$transaction(async (tx) => {
      const updated = await tx.registryCompany.update({
        where: { id },
        data,
      });
      if (docs) {
        await tx.registryDoc.deleteMany({ where: { companyId: id } });
        if (docs.length > 0) {
          await tx.registryDoc.createMany({ data: docs.map((d) => ({ ...d, companyId: id })) });
        }
      }
      return tx.registryCompany.findUniqueOrThrow({ where: { id }, include: { docs: { orderBy: { requirementKey: "asc" } } } });
    });

    void logAudit(req, { action: "UPDATE", entity: "RegistryCompany", entityId: id, detail: `${company.name} (NIB ${company.nib})` });
    return ok(company);
  } catch {
    return fail("Gagal memperbarui perusahaan registri.", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const existing = await db.registryCompany.findUnique({ where: { id } });
    if (!existing) return fail("Perusahaan registri tidak ditemukan.", 404);
    await db.registryCompany.delete({ where: { id } });
    void logAudit(req, { action: "DELETE", entity: "RegistryCompany", entityId: id, detail: `${existing.name} (NIB ${existing.nib})` });
    return ok({ deleted: true });
  } catch {
    return fail("Gagal menghapus perusahaan registri.", 500);
  }
}
