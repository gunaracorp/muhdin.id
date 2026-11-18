import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

/**
 * R-043 v14.1 «AKADEMI & MITRA» — Aturan Harga Musiman & Early Bird.
 * GET  admin (+?packageId=): daftar aturan harga per paket.
 * POST admin: buat aturan — SEASONAL (bulan 1–12) atau EARLYBIRD (deadline);
 *      harga final SELALU dihitung server-side di checkout & group order.
 */
export async function GET(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const packageId = req.nextUrl.searchParams.get("packageId");
    const rules = await db.priceRule.findMany({
      where: packageId ? { packageId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { tourPackage: { select: { title: true } } },
    });
    return ok(rules);
  } catch {
    return fail("Gagal memuat aturan harga.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");
    const packageId = String(body.packageId || "");
    if (!packageId) return fail("Paket wajib dipilih.");
    const pkg = await db.tourPackage.findUnique({ where: { id: packageId } });
    if (!pkg) return fail("Paket tidak ditemukan.", 404);

    const kind = String(body.kind || "SEASONAL");
    if (!["SEASONAL", "EARLYBIRD"].includes(kind)) return fail("Jenis aturan tidak dikenal (SEASONAL | EARLYBIRD).");
    const adjustType = String(body.adjustType || "PERCENT");
    if (!["PERCENT", "FIXED"].includes(adjustType)) return fail("Jenis potongan tidak dikenal (PERCENT | FIXED).");
    const value = Math.floor(Number(body.value ?? 0));
    if (adjustType === "PERCENT" && (value < 1 || value > 100)) return fail("Potongan persen harus 1–100.");
    if (adjustType === "FIXED" && value < 1) return fail("Potongan rupiah harus lebih dari 0.");
    if (adjustType === "FIXED" && value >= pkg.price) return fail("Potongan rupiah tidak boleh ≥ harga paket.");

    let monthFrom: number | null = null;
    let monthTo: number | null = null;
    let deadline: Date | null = null;
    if (kind === "SEASONAL") {
      monthFrom = Math.floor(Number(body.monthFrom ?? 0));
      monthTo = Math.floor(Number(body.monthTo ?? 0));
      if (monthFrom < 1 || monthFrom > 12 || monthTo < 1 || monthTo > 12) {
        return fail("Bulan harus 1–12 (Jan=1 … Des=12).");
      }
    } else {
      deadline = new Date(String(body.deadline || ""));
      if (isNaN(deadline.getTime())) return fail("Deadline early bird tidak valid.");
      if (deadline < new Date()) return fail("Deadline early bird sudah lewat — gunakan tanggal masa depan.");
    }

    const rule = await db.priceRule.create({
      data: {
        packageId,
        kind,
        monthFrom,
        monthTo,
        deadline,
        adjustType,
        value,
        label: String(body.label || "").slice(0, 100),
        active: body.active === false ? false : true,
      },
    });
    await logAudit(req, {
      action: "CREATE",
      entity: "PriceRule",
      entityId: rule.id,
      detail: `${pkg.title} ${kind} ${adjustType === "PERCENT" ? `${value}%` : `Rp${value}`}`,
    });
    return ok(rule, 201);
  } catch {
    return fail("Gagal membuat aturan harga.", 500);
  }
}
