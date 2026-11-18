/**
 * web-push.ts — R-011 Web Push Pengumuman Keberangkatan.
 *
 * Lapisan server untuk PWA Push (VAPID):
 *  • `pushConfig()` — kunci publik VAPID (graceful: null bila belum diset →
 *    UI tombol notifikasi otomatis disembunyikan; fitur tidak meledak).
 *  • `sendPushToAll()` — kirim notifikasi ke seluruh langganan (atau per
 *    kartu jamaah) dengan pembersihan otomatis langganan mati (404/410).
 *  • Seluruh kegagalan push di-log-aman dan TIDAK mengganggu alur utama.
 *
 * Kredensial: VAPID_PUBLIC_KEY & VAPID_PRIVATE_KEY di .env (tidak di-commit).
 * Subject: mailto:asosiasi.muhdin@gmail.com
 */

import { createRequire } from "node:module";
import { db } from "@/lib/db";

// web-push adalah paket CommonJS tanpa ekspor default ESM — muat via require
// agar kompatibel dengan bundler Next (Turbopack).
const require = createRequire(import.meta.url);
const webpush = require("web-push") as typeof import("web-push");

const SUBJECT = "mailto:asosiasi.muhdin@gmail.com";

let configured = false;
function configure(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(SUBJECT, pub, priv);
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

/** Kunci publik VAPID untuk browser; null bila kredensial belum diset. */
export function pushConfig(): { publicKey: string } | null {
  const pub = process.env.VAPID_PUBLIC_KEY || "";
  if (!pub) return null;
  return { publicKey: pub };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Kirim ke seluruh langganan (opsional filter cardNo); kembalikan rekap. */
export async function sendPushToAll(payload: PushPayload, cardNo?: string): Promise<{
  sent: number; failed: number; removed: number;
}> {
  if (!configure()) return { sent: 0, failed: 0, removed: 0 };

  const where = cardNo ? { cardNo } : {};
  const subs = await db.pushSubscription.findMany({ where, take: 500 });
  let sent = 0;
  let failed = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 24 * 60 * 60 }
        );
        sent++;
        await db.pushSubscription
          .update({ where: { id: s.id }, data: { lastSentAt: new Date() } })
          .catch(() => {});
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode ?? 0;
        if (status === 404 || status === 410) {
          // Langganan mati — bersihkan agar tabel tetap sehat.
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          removed++;
        } else {
          failed++;
        }
      }
    })
  );

  return { sent, failed, removed };
}
