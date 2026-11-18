import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticatePartner, partnerDenied } from "@/lib/api-partner";

/**
 * R-065 v14.1 «AKADEMI & MITRA» — API Publik v1 /members.
 * Direktori anggota terverifikasi untuk mitra (hanya data publik):
 * nama lembaga, jenis, kota, provinsi — TANPA kontak pribadi.
 * `?province=` filter (case-insensitive contains), `?limit=` 1–100.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticatePartner(req);
  if (!auth.ok || !auth.partner) return partnerDenied(auth.reason);
  try {
    const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
    const limit = Math.max(1, Math.min(100, Number.isNaN(limitRaw) ? 50 : limitRaw));
    const province = (req.nextUrl.searchParams.get("province") ?? "").trim().slice(0, 60);
    const members = await db.member.findMany({
      where: {
        status: "TERVERIFIKASI",
        ...(province ? { province: { contains: province } } : {}),
      },
      orderBy: { name: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        province: true,
        licenseNo: true,
      },
    });
    return Response.json({
      ok: true,
      partner: auth.partner.name,
      count: members.length,
      data: members.map((m) => ({
        ...m,
        // Kontak internal tidak pernah diekspos lewat API publik.
        detailUrl: `https://muhdin.id/#/anggota/${m.id}`,
      })),
    });
  } catch {
    return Response.json({ ok: false, error: "Gagal mengambil direktori anggota." }, { status: 500 });
  }
}
