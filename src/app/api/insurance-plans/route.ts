/**
 * R-048 v15.0.0 «GOD MODE» — Paket asuransi perjalanan add-on.
 * GET  : publik — daftar paket aktif untuk dropdown checkout (cache 60 dtk).
 * POST : CMS — buat paket (guardAdmin).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, guardAdmin } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { cached, bustCache } from "@/lib/hot-cache";

export async function GET(req: NextRequest) {
  try {
    // ?all=1 untuk CMS — termasuk paket nonaktif bila sesi admin sah.
    const all = req.nextUrl.searchParams.get("all") === "1";
    if (all) {
      const { requireAdmin } = await import("@/lib/auth");
      const admin = await requireAdmin();
      if (admin) {
        const rows = await db.insurancePlan.findMany({ orderBy: { createdAt: "desc" } });
        return ok({ total: rows.length, plans: rows });
      }
    }
    const plans = await cached("asuransi:list", 60_000, async () =>
      db.insurancePlan.findMany({
        where: { active: true },
        orderBy: { premium: "asc" },
        select: { code: true, name: true, provider: true, coverage: true, premium: true },
      }),
    );
    return ok({ total: plans.length, plans });
  } catch {
    return fail("Gagal memuat paket asuransi.", 500);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const name = String(body.name || "").trim();
    const provider = String(body.provider || "").trim();
    const premium = Number(body.premium);
    if (!code || !name || !provider || !Number.isFinite(premium) || premium < 0) {
      return fail("Kode, nama, penyedia, dan premi (≥ 0) wajib diisi.");
    }
    const plan = await db.insurancePlan.create({
      data: {
        code,
        name,
        provider,
        coverage: String(body.coverage || "").trim() || "Perlindungan perjalanan ibadah.",
        premium: Math.round(premium),
      },
    });
    bustCache("asuransi:");
    void logAudit(req, {
      action: "CREATE",
      entity: "InsurancePlan",
      entityId: plan.id,
      detail: `paket asuransi ${code} (premi Rp ${plan.premium}/jamaah)`,
    });
    return ok({ message: `Paket asuransi "${name}" dibuat.`, id: plan.id }, 201);
  } catch {
    return fail("Gagal membuat paket asuransi (kode mungkin sudah dipakai).", 500);
  }
}
