import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, ok, fail } from "@/lib/api-helpers";

/**
 * v5 Fase 4 — Insight dashboard modern (semua peran CMS).
 * Mengagregasi aktivitas fitur v5: sesi AI Concierge per hari (14 hari, split
 * kanal), locale pengguna AI, KPI v5 (paspor aktif, perangkat GPS, kunjungan
 * tur), dan daftar pertanyaan AI terbaru.
 */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const now = Date.now();
    const day14 = new Date(now - 14 * 24 * 3600 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [chats14, chatTotal, chatToday, locales, passportsActive, passportsExpired, devicesOnline, devicesTotal, tourViews, tourScenes, verifiesAgg, recentChats] =
      await Promise.all([
        db.aiChatLog.findMany({ where: { createdAt: { gte: day14 } }, select: { channel: true, createdAt: true, latencyMs: true }, orderBy: { createdAt: "asc" } }),
        db.aiChatLog.count(),
        db.aiChatLog.count({ where: { createdAt: { gte: todayStart } } }),
        db.aiChatLog.groupBy({ by: ["locale"], _count: { locale: true } }),
        db.hajjPassport.count({ where: { status: "ACTIVE" } }),
        db.hajjPassport.count({ where: { status: "EXPIRED" } }),
        db.trackingDevice.count({ where: { status: "ONLINE" } }),
        db.trackingDevice.count(),
        db.tourScene.aggregate({ _sum: { viewCount: true } }),
        db.tourScene.count(),
        db.hajjPassport.aggregate({ _sum: { verificationCount: true } }),
        db.aiChatLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { question: true, channel: true, locale: true, createdAt: true, latencyMs: true } }),
      ]);

    // Binning 14 hari terakhir (tanggal lokal server).
    const days: { date: string; label: string; portal: number; whatsapp: number }[] = [];
    const idx = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      idx.set(key, days.length);
      days.push({ date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, portal: 0, whatsapp: 0 });
    }
    let latencySum = 0;
    for (const c of chats14) {
      const key = new Date(c.createdAt).toISOString().slice(0, 10);
      const i = idx.get(key);
      if (i === undefined) continue;
      if (c.channel === "WHATSAPP") days[i].whatsapp += 1;
      else days[i].portal += 1;
      latencySum += c.latencyMs;
    }
    const avgLatency = chats14.length ? Math.round(latencySum / chats14.length) : 0;

    return ok({
      chat: {
        total: chatTotal,
        today: chatToday,
        avgLatencyMs: avgLatency,
        byDay: days,
        byLocale: locales.map((l) => ({ locale: l.locale, count: l._count.locale })),
        recent: recentChats,
      },
      passport: {
        active: passportsActive,
        expired: passportsExpired,
        verifications: verifiesAgg._sum.verificationCount || 0,
      },
      tracking: { online: devicesOnline, total: devicesTotal },
      tour: { views: tourViews._sum.viewCount || 0, scenes: tourScenes },
    });
  } catch {
    return fail("Gagal memuat insight.", 500);
  }
}
