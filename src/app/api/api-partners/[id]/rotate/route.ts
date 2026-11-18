import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { generateApiKey, hashKey } from "@/lib/api-partner";

/**
 * R-065 v14.1 — ROTASI KUNCI API mitra: kunci baru dibangkitkan server-side,
 * kunci penuh TAMPIL SEKALI pada respons; hash lama digantikan. Kredensial
 * lama dianggap hangus begitu rotasi sukses.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.apiPartner.findUnique({ where: { id } });
    if (!existing) return fail("Mitra API tidak ditemukan.", 404);
    const key = generateApiKey();
    const partner = await db.apiPartner.update({
      where: { id },
      data: { keyHash: hashKey(key), keyPrefix: key.slice(0, 8), callsToday: 0 },
    });
    await logAudit(req, { action: "ROTATE_KEY", entity: "ApiPartner", entityId: id, detail: `${existing.name} kunci baru (prefix ${partner.keyPrefix})` });
    return ok({
      partner: { id: partner.id, name: partner.name, keyPrefix: partner.keyPrefix, quotaDaily: partner.quotaDaily },
      credentials: { apiKey: key },
      message: "Kunci API BARU tampil sekali — salin dan simpan aman sekarang.",
    });
  } catch {
    return fail("Gagal merotasi kunci.", 500);
  }
}
