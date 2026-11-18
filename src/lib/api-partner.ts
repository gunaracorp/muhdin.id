/**
 * api-partner.ts — R-065 v14.1 «AKADEMI & MITRA» — API Publik v1 untuk Mitra.
 *
 * Kunci API mitra:
 *   • Dibangkitkan 32 byte random (base64url, 43 karakter) → ditampilkan
 *     SATU KALI di CMS, yang tersimpan hanya sha256 hex (keyHash) + prefix.
 *   • Autentikasi endpoint publik v1 via header X-API-Key → hash → cocokkan
 *     dengan keyHash aktif → kuota harian dicek & dicatat server-side.
 *   • Webhook event ditandatangani HMAC-SHA256 (secret hash tersimpan).
 *
 * Kunci penuh TIDAK PERNAH disimpan — rotasi = generate baru.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

export function generateApiKey(): string {
  return randomBytes(32).toString("base64url"); // 43 chars
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function keyPrefix(key: string): string {
  return key.slice(0, 8);
}

/** Bandingkan dua hash secara konstan-waktu (anti timing attack). */
export function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export interface PartnerAuthResult {
  ok: boolean;
  reason: "NO_KEY" | "NOT_FOUND" | "INACTIVE" | "QUOTA" | "OK";
  partner?: { id: string; name: string; quotaDaily: number };
}

/**
 * Autentikasi & kuota untuk endpoint /api/public/v1/*.
 * Kuota harian di-reset saat tanggal berganti (dihitung dari lastCallAt).
 * Pencatatan pemanggilan gagal-aman — API tetap hidup walau log gagal.
 */
export async function authenticatePartner(req: Request): Promise<PartnerAuthResult> {
  const key = req.headers.get("x-api-key")?.trim() ?? "";
  if (!key || key.length < 20) return { ok: false, reason: "NO_KEY" };

  const keyHash = hashKey(key);
  const partner = await db.apiPartner.findUnique({ where: { keyHash } });
  if (!partner) return { ok: false, reason: "NOT_FOUND" };
  if (!partner.active) return { ok: false, reason: "INACTIVE" };

  const today = new Date().toISOString().slice(0, 10);
  const lastDay = partner.lastCallAt ? partner.lastCallAt.toISOString().slice(0, 10) : null;
  const callsToday = lastDay === today ? partner.callsToday : 0;
  if (partner.quotaDaily > 0 && callsToday >= partner.quotaDaily) {
    return { ok: false, reason: "QUOTA", partner: { id: partner.id, name: partner.name, quotaDaily: partner.quotaDaily } };
  }

  // Pencatatan pemanggilan (idempoten per hari, gagal-aman).
  await db.apiPartner
    .update({ where: { id: partner.id }, data: { callsToday: callsToday + 1, lastCallAt: new Date() } })
    .catch(() => undefined);

  return {
    ok: true,
    reason: "OK",
    partner: { id: partner.id, name: partner.name, quotaDaily: partner.quotaDaily },
  };
}

/** Tanda tangan payload webhook event (HMAC-SHA256 hex). */
export function signWebhook(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Kirim event webhook ke mitra (fire-and-forget, timeout 5 detik, gagal-aman).
 * Header: X-MUHDIN-Signature = HMAC(secret, rawBody), X-MUHDIN-Event.
 */
export function sendPartnerWebhook(
  webhookUrl: string,
  secret: string,
  event: string,
  data: unknown
): void {
  if (!webhookUrl) return;
  const body = JSON.stringify({ event, data, sentAt: new Date().toISOString() });
  const signature = signWebhook(secret, body);
  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MUHDIN-Event": event,
      "X-MUHDIN-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(5000),
  }).catch(() => undefined); // webhook mitra mati tidak boleh mengganggu inti
}

/** 401/403 response builder untuk endpoint publik v1. */
export function partnerDenied(reason: PartnerAuthResult["reason"]): Response {
  const messages: Record<string, string> = {
    NO_KEY: "Header X-API-Key wajib diisi (lihat README bagian API Publik v1).",
    NOT_FOUND: "Kunci API tidak dikenali. Hubungi sekretariat MUHDIN.",
    INACTIVE: "Akses mitra dinonaktifkan. Hubungi sekretariat MUHDIN.",
    QUOTA: "Kuota harian API habis. Besok pukul 00:00 WIB kuota direset otomatis.",
  };
  return new Response(
    JSON.stringify({ ok: false, error: messages[reason] ?? "Akses ditolak." }),
    { status: reason === "NO_KEY" ? 401 : 403, headers: { "Content-Type": "application/json" } }
  );
}
