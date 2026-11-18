/**
 * badges.ts — R-032 v15.0.0 «GOD MODE» — engine gamifikasi lencana capaian.
 *
 * Murni (tanpa import server) agar aman dipakai komponen klien maupun API:
 * masukan berupa hitungan aktivitas, keluaran daftar lencana yang terbuka.
 * Kehidupan lencana: statistik dihitung dari data nyata (kelas dihadiri,
 * kuis dikerjakan, balasan forum, kelengkapan dokumen, transaksi) —
 * server menggabungkan hitungan DB + perangkat, lalu menyimpan yang baru.
 *
 * Nomenklatur kode: BADGE-<SUMBER>-<AMBANG>.
 */

export interface BadgeStats {
  /** kelas live/webinar yang dihadiri */
  kelas: number;
  /** soal manasik yang dikerjakan (#/latihan) */
  kuis: number;
  /** balasan/kontribusi forum */
  forum: number;
  /** dokumen wajib yang sudah lengkap di brankas */
  dokumen: number;
  /** transaksi/pesanan LUNAS */
  transaksi: number;
}

export interface BadgeDef {
  code: string;
  source: "KELAS" | "KUIS" | "FORUM" | "DOKUMEN" | "TRANSAKSI" | "GENERAL";
  threshold: number;
  /** kunci i18n lencana.badges.<code> */
  i18n: string;
}

/** Daftar definisi lencana resmi — urutan menentukan tampilan di UI. */
export const BADGE_DEFS: BadgeDef[] = [
  { code: "BADGE-KELAS-1", source: "KELAS", threshold: 1, i18n: "kelas1" },
  { code: "BADGE-KELAS-5", source: "KELAS", threshold: 5, i18n: "kelas5" },
  { code: "BADGE-KELAS-10", source: "KELAS", threshold: 10, i18n: "kelas10" },
  { code: "BADGE-KUIS-10", source: "KUIS", threshold: 10, i18n: "kuis10" },
  { code: "BADGE-KUIS-50", source: "KUIS", threshold: 50, i18n: "kuis50" },
  { code: "BADGE-FORUM-1", source: "FORUM", threshold: 1, i18n: "forum1" },
  { code: "BADGE-FORUM-25", source: "FORUM", threshold: 25, i18n: "forum25" },
  { code: "BADGE-DOKUMEN-5", source: "DOKUMEN", threshold: 5, i18n: "dokumen5" },
  { code: "BADGE-TRANSAKSI-1", source: "TRANSAKSI", threshold: 1, i18n: "transaksi1" },
  { code: "BADGE-TRANSAKSI-3", source: "TRANSAKSI", threshold: 3, i18n: "transaksi3" },
];

export interface EarnedBadge {
  code: string;
  source: BadgeDef["source"];
  i18n: string;
}

/** Evaluasi murni: statistik → daftar lencana yang terbuka. */
export function evaluateBadges(stats: BadgeStats): EarnedBadge[] {
  const count: Record<BadgeDef["source"], number> = {
    KELAS: stats.kelas,
    KUIS: stats.kuis,
    FORUM: stats.forum,
    DOKUMEN: stats.dokumen,
    TRANSAKSI: stats.transaksi,
    GENERAL: 0,
  };
  return BADGE_DEFS.filter((d) => count[d.source] >= d.threshold).map((d) => ({
    code: d.code,
    source: d.source,
    i18n: d.i18n,
  }));
}

/** Lencana yang belum terbuka (untuk tampilan "terkunci" di UI). */
export function lockedBadges(earnedCodes: string[]): BadgeDef[] {
  const have = new Set(earnedCodes);
  return BADGE_DEFS.filter((d) => !have.has(d.code));
}
