/**
 * pengurus-data.ts — SUSUNAN PENGURUS MUHDIN (MASTER FINAL 2026–2031).
 *
 * Keputusan super final owner (dokumen "MASTER FINAL — RANCANGAN ORGANISASI
 * DPP MUHDIN 2026–2031", diupload 2026-11-18). Data inti kini hidup di
 * src/lib/org-master.ts; file ini lapisan ekspor untuk kompatibilitas view.
 *
 * FOTO: taruh file foto resmi di /public/images/pengurus/ lalu isi field
 * `photo`. Bila kosong, UI merender monogram emas elegan sebagai fallback.
 *
 * Peran i18n & mandat ada di src/lib/i18n/locales/pengurus.ts + org-master.ts
 * (id/en/ar). Nama tetap Latin di semua locale — pola asosiasi internasional.
 */

import {
  KETUA_UMUM,
  SEKJEN,
  BIDANG_STRATEGIS,
  DPW_38,
} from "@/lib/org-master";

/* ---------- Dua pilar kepemimpinan (halaman detail tetap tersedia) ---------- */

export type PengurusId = "ketum" | "sekjen";

export interface PengurusPerson {
  id: PengurusId;
  /** Nama lengkap + gelar (ditulis apa adanya). */
  name: string;
  /** Path foto di /public — opsional; monogram dipakai bila kosong. */
  photo?: string;
  /** Ikon lencana foto (fallback) & aksen kartu. */
  icon: string;
}

export const PENGURUS_PERSON: Record<PengurusId, PengurusPerson> = {
  ketum: { id: "ketum", name: KETUA_UMUM.name, icon: KETUA_UMUM.icon },
  sekjen: { id: "sekjen", name: SEKJEN.name, icon: SEKJEN.icon },
};

/** Person tambahan yang ditautkan dari sitemap (dua pilar). */
export const SITEMAP_PEOPLE: PengurusPerson[] = [
  PENGURUS_PERSON.ketum,
  PENGURUS_PERSON.sekjen,
];

/* ---------- 15 bidang strategis (ikon per bidang) ---------- */

export const PENGURUS_BIDANG: { id: string; icon: string; no: string }[] =
  BIDANG_STRATEGIS.map((b) => ({ id: b.key, icon: b.icon, no: b.no }));

/* ---------- Jaringan kewilayahan ---------- */

export const NET_COUNTS = {
  bakorwil: DPW_38.length, // 38 provinsi
  bakorcab: 514, // target kab/kota (BPS)
} as const;
