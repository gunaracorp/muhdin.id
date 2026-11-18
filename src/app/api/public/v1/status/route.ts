import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticatePartner, partnerDenied } from "@/lib/api-partner";

/**
 * R-065 v14.1 «AKADEMI & MITRA» — API Publik v1 /status.
 * Autentikasi X-API-Key + kuota harian server-side. Payload ringkas
 * tanpa data pribadi: jumlah anggota, paket aktif, forum, versi portal.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticatePartner(req);
  if (!auth.ok || !auth.partner) return partnerDenied(auth.reason);
  try {
    const [members, packages, forumThreads, tutorials] = await Promise.all([
      db.member.count(),
      db.tourPackage.count({ where: { status: "PUBLISHED" } }),
      db.forumThread.count({ where: { status: "APPROVED" } }),
      db.tutorial.count({ where: { published: true } }).catch(() => 0),
    ]);
    return Response.json({
      ok: true,
      api: "MUHDIN Public API v1",
      partner: auth.partner.name,
      quota: { daily: auth.partner.quotaDaily },
      data: {
        members,
        packages,
        forumThreads,
        tutorials,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return Response.json({ ok: false, error: "Gagal mengambil status." }, { status: 500 });
  }
}
