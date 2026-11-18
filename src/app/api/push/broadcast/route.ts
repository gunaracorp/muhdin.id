import { NextRequest } from "next/server";
import { guardRole, ok, fail } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/ratelimit";
import { logAudit } from "@/lib/audit";
import { sendPushToAll, pushConfig } from "@/lib/web-push";

/**
 * R-011 Web Push — broadcast pengumuman keberangkatan (CMS).
 *
 * POST /api/push/broadcast — (guardRole SUPER_ADMIN/ADMIN)
 *   body: { title, body, url?, cardNo? }
 *   → kirim notifikasi push ke seluruh perangkat terdaftar (atau hanya
 *     perangkat yang terikat kartu jamaah tertentu).
 * GET  /api/push/broadcast — jumlah langganan aktif + status konfigurasi.
 */
export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  const [{ count }, config] = await Promise.all([
    (async () => ({ count: await (await import("@/lib/db")).db.pushSubscription.count() }))(),
    Promise.resolve(pushConfig()),
  ]);
  return ok({ subscribers: count, configured: !!config });
}

export async function POST(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  if (!rateLimit(req, "push-broadcast", 5, 60_000)) {
    return fail("Terlalu sering. Tunggu sebentar.", 429);
  }
  try {
    const body = await req.json();
    const title = String(body?.title || "").trim();
    const text = String(body?.body || "").trim();
    const url = String(body?.url || "#/pesanan").trim();
    const cardNo = body?.cardNo ? String(body.cardNo).trim() : undefined;
    if (title.length < 3 || title.length > 80) return fail("Judul wajib 3–80 karakter.");
    if (text.length < 3 || text.length > 240) return fail("Isi pesan wajib 3–240 karakter.");

    const result = await sendPushToAll(
      { title, body: text, url: url.slice(0, 200), tag: "muhdin-announcement" },
      cardNo || undefined
    );
    void logAudit(req, {
      action: "PUSH_BROADCAST",
      entity: "PushSubscription",
      detail: `"${title}" → terkirim ${result.sent}, gagal ${result.failed}, dibersihkan ${result.removed}`,
    });
    return ok(result);
  } catch {
    return fail("Gagal mengirim notifikasi push.", 500);
  }
}
