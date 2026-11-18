import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { signWebhook, generateApiKey, hashKey } from "@/lib/api-partner";

/**
 * R-065 v14.1 — UJI WEBHOOK: kirim event `ping` ke URL webhook mitra dengan
 * tanda tangan HMAC sementara (sekret baru dipakai untuk uji ini dan
 * SEKALIGUS menjadi sekret baru yang tersimpan — tampil sekali di respons).
 * Hasil kirim (HTTP status / error) dilaporkan jujur ke CMS.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  const { id } = await params;
  try {
    const existing = await db.apiPartner.findUnique({ where: { id } });
    if (!existing) return fail("Mitra API tidak ditemukan.", 404);
    if (!existing.webhookUrl) return fail("Mitra belum mengisi URL webhook.");

    const body = JSON.stringify({
      event: "ping",
      data: { partner: existing.name, portal: "MUHDIN.ID", api: "v1" },
      sentAt: new Date().toISOString(),
    });
    const secret = generateApiKey();
    const signature = signWebhook(secret, body);
    try {
      const res = await fetch(existing.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MUHDIN-Event": "ping",
          "X-MUHDIN-Signature": signature,
        },
        body,
        signal: AbortSignal.timeout(5000),
      });
      // Uji sukses → sekret uji menjadi sekres aktif baru (tersimpan hash).
      await db.apiPartner.update({ where: { id }, data: { webhookSecretHash: hashKey(secret) } });
      await logAudit(req, { action: "TEST_WEBHOOK", entity: "ApiPartner", entityId: id, detail: `${existing.name} → HTTP ${res.status}` });
      return ok({ delivered: true, httpStatus: res.status, message: `Webhook diterima endpoint mitra (HTTP ${res.status}). Sekret baru aktif.` });
    } catch (err) {
      await logAudit(req, { action: "TEST_WEBHOOK", entity: "ApiPartner", entityId: id, detail: `${existing.name} gagal: ${(err as Error).message.slice(0, 80)}` });
      return ok({ delivered: false, message: `Webhook gagal dikirim: ${(err as Error).message.slice(0, 120)}` });
    }
  } catch {
    return fail("Gagal menguji webhook.", 500);
  }
}
