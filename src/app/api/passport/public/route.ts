import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api-helpers";

/**
 * v5 Fase 3 — Data publik Paspor Haji Digital untuk halaman #/paspor:
 * kode demo paspor ACTIVE (prefill kartu e-paspor) + statistik agregat.
 * Tidak mengekspos data pribadi selain nomor/jenis paspor demo.
 */
export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const [active, haji, umrah, verifications, demo] = await Promise.all([
      db.hajjPassport.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
      db.hajjPassport.count({ where: { type: "HAJI" } }),
      db.hajjPassport.count({ where: { type: "UMRAH" } }),
      db.hajjPassport.aggregate({ _sum: { verificationCount: true } }),
      db.hajjPassport.findFirst({
        where: { status: "ACTIVE", expiresAt: { gt: now } },
        orderBy: { createdAt: "asc" },
        select: { passportNo: true, type: true },
      }),
    ]);
    return ok({
      demo,
      stats: { active, haji, umrah, verifications: verifications._sum.verificationCount || 0 },
    });
  } catch {
    return ok({ demo: null, stats: { active: 0, haji: 0, umrah: 0, verifications: 0 } });
  }
}
