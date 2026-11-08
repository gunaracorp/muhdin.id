/**
 * v7.0 — KATALOG IZIN "PINDAI IZIN 360°" (hulu-hilir, khas MUHDIN).
 *
 * 12 syarat kelengkapan berlabel huruf a–l untuk kelas usaha jasa perjalanan
 * ibadah: BPW → PPIU → PIHK. Semua teks (nama, penerbit, alasan, langkah,
 * estimasi) hidup di i18n `scan.req.<KEY>.*` (3 bahasa) — file ini HANYA
 * struktur agar urutan/label huruf stabil dan bisa diuji.
 *
 * Prinsip akurasi: katalog ini bersifat INDIKATIF untuk pemetaan kesiapan —
 * bukan putusan hukum. Setiap hasil pemindaian diakhiri disclaimer +
 * ajakan verifikasi final via mitra sertifikasi (CERT_PARTNERS).
 */

export type LicenseClass = "BPW" | "PPIU" | "PIHK";

export type RequirementCategory = "LEGALITAS" | "IZIN_USAHA" | "IZIN_IBADAH" | "OPERASIONAL" | "DIGITAL";

export type Relevance = "WAJIB" | "JALUR" | "BONUS";

export interface CatalogRequirement {
  /** Kunci stabil — dipakai sebagai requirementKey di DB & key i18n scan.req.<KEY> */
  key: string;
  /** Label huruf rekomendasi (a–l) — permintaan owner: rekomendasi berhuruf */
  letter: string;
  category: RequirementCategory;
  /** Kelas usaha yang WAJIB memegang syarat ini */
  requiredFor: LicenseClass[];
  /** Bobot skor (wajib 1, nilai tambah 0.5) */
  weight: number;
  /** true = nilai tambah (tidak memblokir kelas) */
  bonus: boolean;
  /** Urutan alami jalur naik kelas (a paling dasar) */
  order: number;
}

/** Urutan kelas pada jalur naik: BPW → PPIU → PIHK (grading kesiapan). */
export const CLASS_RANK: Record<LicenseClass, number> = { BPW: 1, PPIU: 2, PIHK: 3 };

export const LICENSE_CATALOG: CatalogRequirement[] = [
  { key: "NIB",             letter: "a", category: "LEGALITAS",     requiredFor: ["BPW", "PPIU", "PIHK"], weight: 1,   bonus: false, order: 1 },
  { key: "AKTA",            letter: "b", category: "LEGALITAS",     requiredFor: ["BPW", "PPIU", "PIHK"], weight: 1,   bonus: false, order: 2 },
  { key: "NPWP",            letter: "c", category: "LEGALITAS",     requiredFor: ["BPW", "PPIU", "PIHK"], weight: 1,   bonus: false, order: 3 },
  { key: "BPW",             letter: "d", category: "IZIN_USAHA",    requiredFor: ["BPW"],                 weight: 1,   bonus: false, order: 4 },
  { key: "PPIU",            letter: "e", category: "IZIN_IBADAH",   requiredFor: ["PPIU"],                weight: 1,   bonus: false, order: 5 },
  { key: "PPIU_AKREDITASI", letter: "f", category: "IZIN_IBADAH",   requiredFor: ["PPIU"],                weight: 1,   bonus: false, order: 6 },
  { key: "PIHK",            letter: "g", category: "IZIN_IBADAH",   requiredFor: ["PIHK"],                weight: 1,   bonus: false, order: 7 },
  { key: "PIHK_ESCROW",     letter: "h", category: "IZIN_IBADAH",   requiredFor: ["PIHK"],                weight: 1,   bonus: false, order: 8 },
  { key: "IATA",            letter: "i", category: "OPERASIONAL",   requiredFor: [],                      weight: 0.5, bonus: true,  order: 9 },
  { key: "MUTHOWIF_SDM",    letter: "j", category: "OPERASIONAL",   requiredFor: ["PPIU", "PIHK"],        weight: 1,   bonus: false, order: 10 },
  { key: "ASURANSI",        letter: "k", category: "OPERASIONAL",   requiredFor: ["PPIU", "PIHK"],        weight: 1,   bonus: false, order: 11 },
  { key: "DIGITAL",         letter: "l", category: "DIGITAL",       requiredFor: [],                      weight: 0.5, bonus: true,  order: 12 },
];

export const CATALOG_BY_KEY: Record<string, CatalogRequirement> = Object.fromEntries(
  LICENSE_CATALOG.map((r) => [r.key, r])
);

export const CATALOG_KEYS = LICENSE_CATALOG.map((r) => r.key);

/** Kategori — label i18n scan.cat.<KEY>. */
export const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  "LEGALITAS", "IZIN_USAHA", "IZIN_IBADAH", "OPERASIONAL", "DIGITAL",
];

/**
 * Mitra verifikasi & sertifikasi kelengkapan izin (tautan dari setiap
 * rekomendasi + panel mitra di halaman pindai).
 */
export const CERT_PARTNERS = [
  {
    id: "arofa-hajj",
    name: "Arofa Hajj Certification",
    url: "https://sertifikasi-arofahajj.vercel.app/",
    services: ["VERIFIKASI", "SERTIFIKASI", "AUDIT"] as const,
  },
];
