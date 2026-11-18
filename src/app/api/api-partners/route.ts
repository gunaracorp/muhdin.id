import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { generateApiKey, hashKey, keyPrefix } from "@/lib/api-partner";

/**
 * R-065 v14.1 «AKADEMI & MITRA» — CMS API Publik v1.
 * GET  admin: seluruh mitra API + statistik pemanggilan.
 * POST admin: daftarkan mitra baru — kunci penuh TAMPIL SEKALI di respons
 *      (tersimpan hanya sha256 hash + prefix) & sekret webhook baru.
 */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const partners = await db.apiPartner.findMany({ orderBy: { createdAt: "desc" } });
    return ok({
      partners,
      stats: {
        total: partners.length,
        active: partners.filter((p) => p.active).length,
        callsToday: partners.reduce((a, p) => a + p.callsToday, 0),
        withWebhook: partners.filter((p) => p.webhookUrl).length,
      },
    });
  } catch {
    return fail("Gagal memuat mitra API.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const name = String(body.name || "").trim();
    if (name.length < 3) return fail("Nama mitra minimal 3 karakter.");
    const email = String(body.email || "").trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Format email tidak valid.");
    const quotaDaily = Math.max(0, Math.min(100_000, Math.floor(Number(body.quotaDaily ?? 1000))));
    const webhookUrl = String(body.webhookUrl || "").trim();
    if (webhookUrl && !/^https?:\/\/.+/.test(webhookUrl)) return fail("URL webhook harus dimulai http(s)://.");

    const key = generateApiKey();
    const webhookSecret = generateApiKey();
    const partner = await db.apiPartner.create({
      data: {
        name,
        email,
        keyHash: hashKey(key),
        keyPrefix: keyPrefix(key),
        quotaDaily,
        webhookUrl,
        webhookSecretHash: hashKey(webhookSecret),
        active: body.active === false ? false : true,
      },
    });
    await logAudit(req, { action: "CREATE", entity: "ApiPartner", entityId: partner.id, detail: `${name} (kuota ${quotaDaily}/hari)` });
    // Kunci penuh hanya ada di respons ini — tidak pernah disimpan plaintext.
    return ok(
      {
        partner: { id: partner.id, name: partner.name, keyPrefix: partner.keyPrefix, quotaDaily: partner.quotaDaily, webhookUrl },
        credentials: { apiKey: key, webhookSecret },
        message: "Kunci API TAMPIL SEKALI — salin dan simpan aman sekarang. Rotasi kunci menghasilkan kunci baru.",
      },
      201
    );
  } catch {
    return fail("Gagal mendaftarkan mitra API.", 500);
  }
}
