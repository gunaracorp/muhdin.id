/**
 * v10 — Statistik Nasional & Transparansi (endpoint PUBLIK).
 * Hanya agregat non-PII: jumlah anggota per provinsi/tipe, pertumbuhan bulanan,
 * konten edukasi, status paspor, perangkat GPS, kunjungan tur, sesi AI per hari.
 * Cache memori 5 menit — hemat SQLite & aman dari spam.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail } from "@/lib/api-helpers";

type Snapshot = {
  generatedAt: string;
  members: {
    total: number;
    verified: number;
    byType: { type: string; count: number }[];
    byProvince: { name: string; count: number }[];
    growth: { month: string; label: string; total: number }[];
  };
  content: {
    articles: number;
    articleViews: number;
    tutorials: number;
    tutorialViews: number;
    events: number;
    upcomingEvents: number;
    gallery: number;
    testimonials: number;
    faqs: number;
  };
  passports: { total: number; byStatus: { status: string; count: number }[]; verifications: number };
  tracking: { devices: number; online: number; pax: number };
  tour: { scenes: number; views: number };
  ai: { total: number; today: number; avgLatencyMs: number; byDay14: { date: string; label: string; portal: number; whatsapp: number }[] };
};

let cache: { at: number; data: Snapshot } | null = null;
const TTL = 5 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" },
    });
  }
  try {
    const now = Date.now();
    const day14 = new Date(now - 14 * 24 * 3600 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yearAgo = new Date(now - 370 * 24 * 3600 * 1000);

    const [
      memberTotal,
      memberVerified,
      byTypeRows,
      memberDates,
      articleCount,
      articleAgg,
      tutorialCount,
      tutorialAgg,
      eventCount,
      upcomingEvents,
      galleryCount,
      testimonialCount,
      faqCount,
      passportTotal,
      passportByStatus,
      passportVerifyAgg,
      devicesTotal,
      devicesOnline,
      paxAgg,
      tourScenes,
      tourViewsAgg,
      chats14,
      chatTotal,
      chatToday,
    ] = await Promise.all([
      db.member.count(),
      db.member.count({ where: { status: "TERVERIFIKASI" } }),
      db.member.groupBy({ by: ["type"], _count: { type: true } }),
      db.member.findMany({ where: { createdAt: { gte: yearAgo } }, select: { createdAt: true } }),
      db.article.count(),
      db.article.aggregate({ _sum: { views: true } }),
      db.tutorial.count(),
      db.tutorial.aggregate({ _sum: { views: true } }),
      db.event.count(),
      db.event.count({ where: { startsAt: { gte: new Date(now) } } }),
      db.gallery.count(),
      db.testimonial.count({ where: { published: true } }),
      db.faq.count(),
      db.hajjPassport.count(),
      db.hajjPassport.groupBy({ by: ["status"], _count: { status: true } }),
      db.hajjPassport.aggregate({ _sum: { verificationCount: true } }),
      db.trackingDevice.count(),
      db.trackingDevice.count({ where: { status: "ONLINE" } }),
      db.trackingDevice.aggregate({ _sum: { pax: true } }),
      db.tourScene.count({ where: { active: true } }),
      db.tourScene.aggregate({ _sum: { viewCount: true } }),
      db.aiChatLog.findMany({
        where: { createdAt: { gte: day14 } },
        select: { channel: true, createdAt: true, latencyMs: true },
      }),
      db.aiChatLog.count(),
      db.aiChatLog.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    // Provinsi: agregasi di memori (data demo kecil) — top 10.
    const provRows = await db.member.findMany({ select: { province: true } });
    const provMap = new Map<string, number>();
    for (const r of provRows) {
      const key = (r.province || "Lainnya").trim();
      provMap.set(key, (provMap.get(key) || 0) + 1);
    }
    const byProvince = Array.from(provMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Pertumbuhan kumulatif 12 bulan terakhir (bulan kalender, bukan offset 30 hari).
    const months: { month: string; label: string; total: number }[] = [];
    const base = new Date(now);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("id-ID", { month: "short" }),
        total: 0,
      });
    }
    let running = memberTotal - memberDates.length; // anggota sebelum 12 bulan terakhir
    for (const m of months) {
      const created = memberDates.filter((r) => {
        const d = new Date(r.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === m.month;
      }).length;
      running += created;
      m.total = running;
    }

    // AI 14 hari (binning sama dengan /api/stats/insights).
    const days: Snapshot["ai"]["byDay14"] = [];
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

    const data: Snapshot = {
      generatedAt: new Date().toISOString(),
      members: {
        total: memberTotal,
        verified: memberVerified,
        byType: byTypeRows.map((r) => ({ type: r.type, count: r._count.type })).sort((a, b) => b.count - a.count),
        byProvince,
        growth: months,
      },
      content: {
        articles: articleCount,
        articleViews: articleAgg._sum.views || 0,
        tutorials: tutorialCount,
        tutorialViews: tutorialAgg._sum.views || 0,
        events: eventCount,
        upcomingEvents,
        gallery: galleryCount,
        testimonials: testimonialCount,
        faqs: faqCount,
      },
      passports: {
        total: passportTotal,
        byStatus: passportByStatus.map((r) => ({ status: r.status, count: r._count.status })).sort((a, b) => b.count - a.count),
        verifications: passportVerifyAgg._sum.verificationCount || 0,
      },
      tracking: { devices: devicesTotal, online: devicesOnline, pax: paxAgg._sum.pax || 0 },
      tour: { scenes: tourScenes, views: tourViewsAgg._sum.viewCount || 0 },
      ai: { total: chatTotal, today: chatToday, avgLatencyMs: chats14.length ? Math.round(latencySum / chats14.length) : 0, byDay14: days },
    };

    cache = { at: Date.now(), data };
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("[stats/public]", e);
    return fail("Gagal memuat statistik publik.", 500);
  }
}
