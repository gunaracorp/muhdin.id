/**
 * pricing.ts — R-043 v14.1 «AKADEMI & MITRA» — Harga Musiman & Early Bird.
 *
 * VERSI MURNI (aman di client & server — TIDAK meng-import db).
 * Keputusan harga selalu dihitung di server (checkout & group order
 * memakai pricing-server.ts); fungsi di sini dipakai bersama untuk
 * label promo katalog dan uji logika.
 *
 *   • SEASONAL  → potongan saat bulan keberangkatan jatuh di jendela musim
 *     (monthFrom..monthTo; rentang boleh memutar tahun, mis. Nov→Feb).
 *   • EARLYBIRD → potongan saat checkout sebelum deadline pemesan awal.
 * Bisa bertumpuk (early bird dulu, lalu musiman) — hasil TIDAK PERNAH negatif.
 */

export interface PriceAdjustment {
  kind: "SEASONAL" | "EARLYBIRD";
  label: string;
  discount: number;
}

export interface PriceQuote {
  basePrice: number;
  /** harga final per jamaah = base − total potongan aturan (≥ 0). */
  finalPrice: number;
  adjustments: PriceAdjustment[];
  /** true bila minimal satu aturan aktif memotong harga. */
  hasDiscount: boolean;
}

/** Bentuk aturan minimal yang dipakai perhitungan/label (tanpa db types). */
export interface RuleLite {
  kind: string;
  adjustType: string;
  value: number;
  monthFrom?: number | null;
  monthTo?: number | null;
  deadline?: Date | string | null;
  label?: string | null;
}

function applyRule(adjustType: string, value: number, base: number): number {
  let disc = 0;
  if (adjustType === "PERCENT") {
    disc = Math.floor((base * Math.max(0, Math.min(100, value))) / 100);
  } else {
    disc = Math.max(0, value);
  }
  return Math.min(disc, base);
}

/** Bulan (1–12) berada di jendela musim? Rentang boleh memutar tahun. */
export function monthInSeason(month: number, monthFrom?: number | null, monthTo?: number | null): boolean {
  if (!monthFrom || !monthTo) return false;
  if (monthFrom <= monthTo) return month >= monthFrom && month <= monthTo;
  // memutar tahun: mis. 11 → 2 (Nov, Des, Jan, Feb)
  return month >= monthFrom || month <= monthTo;
}

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Hitung harga final per jamaah dari aturan — fungsi murni (dipakai server).
 * Urutan deterministik: EARLYBIRD dulu (insentif paling awal), lalu SEASONAL.
 */
export function computePriceFromRules(
  basePrice: number,
  rules: RuleLite[],
  departureDate?: Date | null,
  now: Date = new Date()
): PriceQuote {
  const dep = departureDate ?? now;
  const month = dep.getMonth() + 1; // 1–12

  let running = basePrice;
  const adjustments: PriceAdjustment[] = [];

  for (const kind of ["EARLYBIRD", "SEASONAL"] as const) {
    for (const r of rules.filter((x) => x.kind === kind)) {
      if (kind === "EARLYBIRD") {
        const dl = toDate(r.deadline);
        if (!dl || now > dl) continue; // kelewat deadline
      } else {
        if (!monthInSeason(month, r.monthFrom, r.monthTo)) continue;
      }
      const disc = applyRule(r.adjustType, r.value, running);
      if (disc > 0) {
        running -= disc;
        adjustments.push({ kind, label: r.label || (kind === "EARLYBIRD" ? "Early Bird" : "Musim"), discount: disc });
      }
    }
  }

  return {
    basePrice,
    finalPrice: Math.max(0, running),
    adjustments,
    hasDiscount: adjustments.length > 0,
  };
}

/** Ringkasan label promo untuk kartu katalog ("Early Bird 10% s.d. 1 Des"). */
export function describeRule(r: RuleLite): string {
  const amount = r.adjustType === "PERCENT" ? `${r.value}%` : `Rp${r.value.toLocaleString("id-ID")}`;
  if (r.kind === "EARLYBIRD") {
    const dl = toDate(r.deadline);
    if (dl) return `Early Bird −${amount} s.d. ${dl.toLocaleDateString("id-ID")}`;
    return `Early Bird −${amount}`;
  }
  const bulan = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  if (r.monthFrom && r.monthTo) return `Musim ${bulan[r.monthFrom]}–${bulan[r.monthTo]} −${amount}`;
  return `Potongan −${amount}`;
}
