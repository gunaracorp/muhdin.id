import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guardRole, ok, fail } from "@/lib/api-helpers";

/**
 * v12.4 «LUNAS» — Daftar pesanan untuk CMS.
 * GET admin [SUPER_ADMIN, ADMIN, VERIFIKATOR] + agregat ringkas
 * (total order, lunas, menunggu, pendapatan terkumpul).
 */
export async function GET(req: NextRequest) {
  const denied = await guardRole(["SUPER_ADMIN", "ADMIN", "VERIFIKATOR"]);
  if (denied) return denied;
  try {
    const status = req.nextUrl.searchParams.get("status");
    const where = status && status !== "all" ? { status } : {};
    const rows = await db.order.findMany({
      where,
      include: {
        invoice: { select: { number: true, issuedAt: true } },
        payments: { select: { method: true, status: true, providerRef: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const [total, paid, pending, cancelled, agg] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PAID" } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: { in: ["CANCELLED", "REFUNDED", "EXPIRED"] } } }),
      db.order.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    ]);

    return ok({
      stats: { total, paid, pending, closed: cancelled, revenue: agg._sum.amount ?? 0 },
      orders: rows,
    });
  } catch {
    return fail("Gagal memuat pesanan.", 500);
  }
}
