import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { pushConfig } from "@/lib/web-push";
import { safeBody, PushSubscribeSchema } from "@/lib/validation";

/**
 * R-011 Web Push — langganan notifikasi keberangkatan jamaah.
 *
 * GET  /api/push  → konfigurasi publik { vapidPublicKey } (null bila belum diset)
 * POST /api/push  → simpan langganan perangkat (rate-limit 10/menit)
 *                   body: { subscription: { endpoint, keys: { p256dh, auth } }, cardNo? }
 * DELETE /api/push → cabut langganan; body: { endpoint }
 */
export async function GET() {
  return ok(pushConfig());
}

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "push-subscribe", 10, 60_000)) {
    return fail("Terlalu sering. Coba lagi nanti.", 429);
  }
  try {
    const body = await req.json().catch(() => ({}));
    // R-081 — langganan divalidasi Zod (endpoint URL + kunci p256dh/auth).
    const parsed = safeBody(PushSubscribeSchema, body?.subscription ? { ...body.subscription, cardNo: body.cardNo ?? null } : null);
    if (!parsed.ok) return fail(parsed.error, 400);
    const endpoint = parsed.data.endpoint;
    const p256dh = parsed.data.keys.p256dh;
    const auth = parsed.data.keys.auth;
    if (!endpoint.startsWith("https://")) {
      return fail("Langganan push tidak valid.", 400);
    }
    const cardNo = parsed.data.cardNo ? String(parsed.data.cardNo).trim().slice(0, 40) : null;
    await db.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, cardNo },
      create: {
        endpoint: endpoint.slice(0, 900),
        p256dh: p256dh.slice(0, 400),
        auth: auth.slice(0, 200),
        cardNo,
        userAgent: (req.headers.get("user-agent") || "").slice(0, 300) || null,
      },
    });
    return ok({ subscribed: true });
  } catch {
    return fail("Gagal menyimpan langganan.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (!rateLimit(req, "push-unsubscribe", 10, 60_000)) {
    return fail("Terlalu sering. Coba lagi nanti.", 429);
  }
  try {
    const body = await req.json().catch(() => ({}));
    const endpoint = String(body?.endpoint || "");
    if (!endpoint) return fail("Endpoint wajib diisi.", 400);
    await db.pushSubscription.deleteMany({ where: { endpoint } });
    return ok({ unsubscribed: true });
  } catch {
    return fail("Gagal mencabut langganan.", 500);
  }
}
