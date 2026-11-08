import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { LEGAL_ENTITIES, parseDocsInput } from "@/lib/license-docs";

/**
 * v7.0 — Registri perusahaan Pindai Izin 360° (CMS).
 * GET  admin [SUPER_ADMIN, ADMIN, EDITOR, VERIFIKATOR]: seluruh perusahaan + dokumen.
 * POST admin [SUPER_ADMIN, ADMIN, EDITOR]: daftarkan perusahaan (+ dokumen awal).
 */

export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const rows = await db.registryCompany.findMany({
      include: { docs: { orderBy: { requirementKey: "asc" } } },
      orderBy: { name: "asc" },
    });
    return ok(rows);
  } catch {
    return fail("Gagal memuat registri perusahaan.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const nib = String(body.nib || "").replace(/\D+/g, "");
    if (nib.length < 6) return fail("NIB tidak valid — minimal 13 digit NIB OSS (terima min. 6 digit angka).");
    const name = String(body.name || "").trim();
    if (name.length < 3) return fail("Nama perusahaan minimal 3 karakter.");

    const dup = await db.registryCompany.findUnique({ where: { nib } });
    if (dup) return fail("NIB sudah terdaftar di registri.", 409);

    const docs = parseDocsInput(body.docs);
    if (docs === null) return fail("Ada kunci syarat (requirementKey) yang tidak dikenal pada dokumen.");

    const company = await db.registryCompany.create({
      data: {
        nib,
        name,
        legalEntity: LEGAL_ENTITIES.includes(String(body.legalEntity)) ? String(body.legalEntity) : "PT",
        city: String(body.city || ""),
        province: String(body.province || ""),
        phone: String(body.phone || ""),
        website: body.website ? String(body.website) : null,
        note: body.note ? String(body.note) : null,
        ...(docs ? { docs: { create: docs } } : {}),
      },
      include: { docs: true },
    });

    void logAudit(req, { action: "CREATE", entity: "RegistryCompany", entityId: company.id, detail: `${company.name} (NIB ${company.nib})` });
    return ok(company, 201);
  } catch {
    return fail("Gagal menambah perusahaan registri.", 500);
  }
}
