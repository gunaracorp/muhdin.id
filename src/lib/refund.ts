/**
 * refund.ts — R-044 v14.1 «AKADEMI & MITRA» — Refund & Pembatalan Berjenjang.
 *
 * Kebijakan pembatalan bertahap berdasar sisa hari menuju keberangkatan.
 * Semua angka kebijakan di satu tempat; dihitung server-side saat pengajuan
 * dan diverifikasi ulang saat keputusan panitia. Jejak audit dicatat pada
 * tiap keputusan (logAudit di route).
 */

export interface RefundTier {
  code: string; // T1..T5
  minDays: number; // sisa hari minimum (inklusif)
  maxDays: number | null; // null = tanpa batas atas
  percent: number; // persen dari jumlah terbayar yang kembali
  labelId: string;
}

export const REFUND_TIERS: RefundTier[] = [
  { code: "T1", minDays: 30, maxDays: null, percent: 100, labelId: "H−30 ke atas: refund penuh 100%" },
  { code: "T2", minDays: 14, maxDays: 29, percent: 70, labelId: "H−29 s.d. H−14: refund 70%" },
  { code: "T3", minDays: 7, maxDays: 13, percent: 50, labelId: "H−13 s.d. H−7: refund 50%" },
  { code: "T4", minDays: 3, maxDays: 6, percent: 25, labelId: "H−6 s.d. H−3: refund 25%" },
  { code: "T5", minDays: 0, maxDays: 2, percent: 0, labelId: "H−2 ke bawah: tanpa refund (transfer rombongan dianjurkan)" },
];

export const REFUND_SLA_DAYS = 7; // SLA proses keputusan (hari kerja)

/** Tentukan tier kebijakan dari sisa hari. */
export function tierForDays(daysLeft: number): RefundTier {
  for (const t of REFUND_TIERS) {
    const withinMin = daysLeft >= t.minDays;
    const withinMax = t.maxDays === null || daysLeft <= t.maxDays;
    if (withinMin && withinMax) return t;
  }
  return REFUND_TIERS[REFUND_TIERS.length - 1];
}

/** Sisa hari kalender menuju keberangkatan (dibulatkan ke bawah, min 0). */
export function daysLeftTo(departureDate: Date | null | undefined, now: Date = new Date()): number {
  if (!departureDate) return -1; // tak diketahui → kebijakan default dipakai di route
  const ms = departureDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export interface RefundQuote {
  tier: RefundTier | null;
  daysLeft: number;
  percent: number;
  approvedAmount: number;
  knownDeparture: boolean;
}

/** Estimasi refund server-side — tidak pernah dipercaya dari klien. */
export function quoteRefund(amountPaid: number, departureDate: Date | null | undefined, now: Date = new Date()): RefundQuote {
  const days = daysLeftTo(departureDate, now);
  if (days < 0 || !departureDate) {
    // Keberangkatan belum ditetapkan → pakai tier T2 (70%) sebagai default
    // konservatif; keputusan final tetap di panitia.
    const t = tierForDays(20);
    return {
      tier: t,
      daysLeft: -1,
      percent: t.percent,
      approvedAmount: Math.floor((amountPaid * t.percent) / 100),
      knownDeparture: false,
    };
  }
  const tier = tierForDays(days);
  return {
    tier,
    daysLeft: days,
    percent: tier.percent,
    approvedAmount: Math.floor((amountPaid * tier.percent) / 100),
    knownDeparture: true,
  };
}

/** Uji kelayakan pengajuan: hanya order terbayar yang boleh diajukan. */
export function isRefundableStatus(status: string): boolean {
  return status === "PAID";
}
