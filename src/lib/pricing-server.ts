/**
 * pricing-server.ts — R-043 v14.1 «AKADEMI & MITRA» — lapisan DB untuk harga.
 * Hanya boleh diimpot dari kode server (API route). Fungsi murni ada di
 * lib/pricing.ts agar aman juga dipakai komponen klien (label promo).
 */
import { db } from "@/lib/db";
import { computePriceFromRules, type PriceQuote } from "@/lib/pricing";

/**
 * Hitung harga final per jamaah untuk sebuah paket — SELALU di sisi server.
 * @param packageId  id paket
 * @param departureDate tanggal keberangkatan (fallback: data paket / hari ini)
 * @param now untuk uji deadline early bird
 */
export async function computePackagePrice(
  packageId: string,
  departureDate?: Date | null,
  now: Date = new Date()
): Promise<PriceQuote> {
  const pkg = await db.tourPackage.findUnique({
    where: { id: packageId },
    select: { price: true, departureDate: true },
  });
  const basePrice = pkg?.price ?? 0;
  const dep = departureDate ?? pkg?.departureDate ?? now;

  const rules = await db.priceRule.findMany({
    where: { packageId, active: true },
    orderBy: { createdAt: "asc" },
    select: { kind: true, adjustType: true, value: true, monthFrom: true, monthTo: true, deadline: true, label: true },
  });

  return computePriceFromRules(basePrice, rules, dep, now);
}
