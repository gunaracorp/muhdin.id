import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";

/**
 * R-051 «Dashboard Omzet Manajemen» (v13.0 «GERBANG»)
 * GET /api/management/omzet — ringkasan kesehatan bisnis dari Order:
 *   • summary  : omzet LUNAS, jumlah per status, rata-rata order, konversi
 *   • monthly  : 12 bulan terakhir (omzet LUNAS + jumlah order per bulan)
 *   • topPackages : 5 paket penyumbang omzet terbesar
 *   • recent   : 8 pesanan terbaru
 * Akses: SUPER_ADMIN / ADMIN (papan manajemen pusat).
 */
export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN"]);
  if (denied) return denied;
  try {
    const now = new Date();
    const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [statusGroups, paidAgg, monthlyRows, topRows, recent] = await Promise.all([
      db.order.groupBy({ by: ["status"], _count: { _all: true } }),
      db.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: { _all: true }, _avg: { amount: true } }),
      db.order.findMany({
        where: { createdAt: { gte: yearAgo } },
        select: { createdAt: true, amount: true, status: true },
      }),
      db.order.groupBy({
        by: ["packageTitle"],
        where: { status: "PAID" },
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          number: true,
          packageTitle: true,
          customerName: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    let allCount = 0;
    for (const g of statusGroups) {
      byStatus[g.status] = g._count._all;
      allCount += g._count._all;
    }

    // Series 12 bulan (Jan..Des urut kronologis, label singkat lokal).
    const monthly: { month: string; label: string; paid: number; count: number }[] = [];
    const LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: LABELS[d.getMonth()],
        paid: 0,
        count: 0,
      });
    }
    const monthIndex = new Map(monthly.map((m, i) => [m.month, i]));
    for (const r of monthlyRows) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const idx = monthIndex.get(key);
      if (idx === undefined) continue;
      monthly[idx].count += 1;
      if (r.status === "PAID") monthly[idx].paid += r.amount;
    }

    const paidCount = byStatus.PAID || 0;
    return ok({
      summary: {
        totalPaid: paidAgg._sum.amount || 0,
        paidCount,
        pendingCount: byStatus.PENDING || 0,
        cancelledCount: (byStatus.CANCELLED || 0) + (byStatus.EXPIRED || 0) + (byStatus.REFUNDED || 0),
        allCount,
        avgOrder: Math.round(paidAgg._avg.amount || 0),
        conversionRate: allCount > 0 ? Math.round((paidCount / allCount) * 100) : 0,
      },
      monthly,
      topPackages: topRows.map((r) => ({
        title: r.packageTitle,
        amount: r._sum.amount || 0,
        count: r._count._all,
      })),
      recent,
    });
  } catch {
    return fail("Gagal memuat ringkasan omzet.", 500);
  }
}
