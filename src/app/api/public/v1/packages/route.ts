import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticatePartner, partnerDenied } from "@/lib/api-partner";

/**
 * R-065 v14.1 «AKADEMI & MITRA» — API Publik v1 /packages.
 * Katalog paket PUBLISHED untuk mitra (tanpa data kontak internal):
 * judul, tipe, kota, harga (per jamaah), durasi, keberangkatan, slot.
 * `?limit=` 1–50 (default 20).
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticatePartner(req);
  if (!auth.ok || !auth.partner) return partnerDenied(auth.reason);
  try {
    const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);
    const limit = Math.max(1, Math.min(50, Number.isNaN(limitRaw) ? 20 : limitRaw));
    const packages = await db.tourPackage.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { featured: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        city: true,
        price: true,
        durationDays: true,
        departureDate: true,
        slots: true,
        slotsTaken: true,
        hotelMakkah: true,
        hotelMadinah: true,
        airline: true,
      },
    });
    return Response.json({
      ok: true,
      partner: auth.partner.name,
      count: packages.length,
      data: packages.map((p) => ({
        ...p,
        slotsAvailable: Math.max(0, p.slots - p.slotsTaken),
        landingUrl: p.slug ? `https://muhdin.id/#/paket/${p.slug}` : `https://muhdin.id/#/paket/${p.id}`,
      })),
    });
  } catch {
    return Response.json({ ok: false, error: "Gagal mengambil katalog paket." }, { status: 500 });
  }
}
