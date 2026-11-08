/**
 * v7.0 — ENGINE "PINDAI IZIN 360°".
 *
 * Fungsi murni (tanpa DB/React) agar mudah diuji dan dipakai bersama oleh
 * API /api/license-scan, portal #/pindai, dan CMS. Menerima perusahaan +
 * daftar dokumen registri, mengembalikan dossier lengkap: kelas usaha yang
 * terdeteksi, checklist kelengkapan a–l, skor, dan rekomendasi berprioritas.
 *
 * Urutan rekomendasi (permintaan owner: berhuruf a–l):
 *   1. wajib KEDALUWARSA  (darurat — izin mati)
 *   2. wajib segera berakhir (≤90 hari)
 *   3. wajib kelas saat ini belum ada
 *   4. jalur naik kelas (BPW → PPIU → PIHK) belum ada
 *   5. nilai tambah (IATA, integrasi digital)
 *   Dalam satu tingkat diurutkan mengikuti huruf a–l.
 */

import {
  CATALOG_BY_KEY,
  CLASS_RANK,
  LICENSE_CATALOG,
  type CatalogRequirement,
  type LicenseClass,
  type Relevance,
} from "./license-catalog";

export type ScanStatus = "VALID" | "EXPIRING" | "EXPIRED" | "MISSING";
export type ClassStatus = "AKTIF" | "BERMASALAH" | "TIDAK_ADA";

export interface EngineDoc {
  requirementKey: string;
  docNo?: string | null;
  issuedBy?: string | null;
  validUntil?: string | Date | null;
}

export interface EngineCompany {
  nib: string;
  name: string;
  legalEntity: string;
  city: string;
  province: string;
  note?: string | null;
}

export interface ChecklistItem {
  key: string;
  letter: string;
  category: string;
  relevance: Relevance;
  status: ScanStatus;
  daysLeft: number | null;
  docNo: string | null;
  issuedBy: string | null;
  validUntil: string | null;
}

export interface RecommendationItem {
  key: string;
  letter: string;
  status: Exclude<ScanStatus, "VALID">;
  relevance: Relevance;
  tier: 0 | 1 | 2 | 3 | 4;
}

export interface ScanResult {
  company: EngineCompany;
  classStatus: Record<LicenseClass, ClassStatus>;
  heldClasses: LicenseClass[];
  currentClass: LicenseClass | null;
  nextClass: LicenseClass | null;
  score: number;
  checklist: ChecklistItem[];
  recommendations: RecommendationItem[];
  summary: { total: number; valid: number; expiring: number; expired: number; missing: number };
}

/** Siklus hidup dokumen — ambang identik computeLifecycle (api-helpers): ≤90 hari. */
function docStatus(validUntil: string | Date | null | undefined): { status: ScanStatus; daysLeft: number | null } {
  if (!validUntil) return { status: "VALID", daysLeft: null };
  const exp = new Date(validUntil);
  if (Number.isNaN(exp.getTime())) return { status: "VALID", daysLeft: null };
  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return { status: "EXPIRED", daysLeft };
  if (daysLeft <= 90) return { status: "EXPIRING", daysLeft };
  return { status: "VALID", daysLeft };
}

const STATUS_SCORE: Record<ScanStatus, number> = { VALID: 1, EXPIRING: 0.7, EXPIRED: 0.15, MISSING: 0 };

/** Pilih dokumen terbaik per syarat (validUntil terjauh menang). */
function bestDocByKey(docs: EngineDoc[]): Map<string, EngineDoc> {
  const map = new Map<string, EngineDoc>();
  for (const d of docs) {
    const key = String(d.requirementKey || "").toUpperCase();
    if (!CATALOG_BY_KEY[key]) continue;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, d);
      continue;
    }
    const prevT = prev.validUntil ? new Date(prev.validUntil).getTime() : Infinity;
    const curT = d.validUntil ? new Date(d.validUntil).getTime() : Infinity;
    if (curT > prevT) map.set(key, d);
  }
  return map;
}

function classOfKey(key: string): LicenseClass | null {
  if (key === "BPW") return "BPW";
  if (key === "PPIU") return "PPIU";
  if (key === "PIHK") return "PIHK";
  return null;
}

export function buildScan(company: EngineCompany, docs: EngineDoc[]): ScanResult {
  const docMap = bestDocByKey(docs);

  // ---- 1. Checklist seluruh katalog a–l ----------------------------------
  const checklist: ChecklistItem[] = LICENSE_CATALOG.map((req) => {
    const doc = docMap.get(req.key);
    const st = doc ? docStatus(doc.validUntil) : { status: "MISSING" as ScanStatus, daysLeft: null };
    return {
      key: req.key,
      letter: req.letter,
      category: req.category,
      relevance: "WAJIB" as Relevance, // ditimpa di bawah setelah kelas terdeteksi
      status: st.status,
      daysLeft: st.daysLeft,
      docNo: doc?.docNo ?? null,
      issuedBy: doc?.issuedBy ?? null,
      validUntil: doc?.validUntil ? new Date(doc.validUntil).toISOString() : null,
    };
  });

  // ---- 2. Deteksi kelas usaha --------------------------------------------
  const classStatus: Record<LicenseClass, ClassStatus> = { BPW: "TIDAK_ADA", PPIU: "TIDAK_ADA", PIHK: "TIDAK_ADA" };
  for (const cls of Object.keys(classStatus) as LicenseClass[]) {
    const item = checklist.find((c) => c.key === cls);
    if (!item) continue;
    if (item.status === "VALID" || item.status === "EXPIRING") classStatus[cls] = "AKTIF";
    else if (item.status === "EXPIRED") classStatus[cls] = "BERMASALAH";
  }
  const heldClasses = (Object.keys(classStatus) as LicenseClass[]).filter((c) => classStatus[c] === "AKTIF");
  const currentRank = heldClasses.reduce((mx, c) => Math.max(mx, CLASS_RANK[c]), 0);
  const currentClass = heldClasses.find((c) => CLASS_RANK[c] === currentRank) ?? null;
  const nextClass = (Object.keys(CLASS_RANK) as LicenseClass[])
    .filter((c) => CLASS_RANK[c] === currentRank + 1)
    .at(0) ?? null;

  // ---- 3. Relevansi per syarat terhadap posisi perusahaan -----------------
  for (const item of checklist) {
    const req = CATALOG_BY_KEY[item.key];
    if (req.bonus) {
      item.relevance = "BONUS";
      continue;
    }
    const neededNow = req.requiredFor.some((c) => heldClasses.includes(c));
    // LEGALITAS selalu wajib bagi semua kelas (requiredFor memuat seluruh kelas).
    item.relevance = neededNow || req.requiredFor.length === 0 ? "WAJIB" : "JALUR";
  }

  // ---- 4. Skor kelengkapan ------------------------------------------------
  const weightSum = LICENSE_CATALOG.reduce((s, r) => s + r.weight, 0);
  const score =
    Math.round(
      (checklist.reduce((s, item) => s + STATUS_SCORE[item.status] * CATALOG_BY_KEY[item.key].weight, 0) /
        weightSum) *
        100
    );

  // ---- 5. Ringkasan -------------------------------------------------------
  const summary = {
    total: checklist.length,
    valid: checklist.filter((c) => c.status === "VALID").length,
    expiring: checklist.filter((c) => c.status === "EXPIRING").length,
    expired: checklist.filter((c) => c.status === "EXPIRED").length,
    missing: checklist.filter((c) => c.status === "MISSING").length,
  };

  // ---- 6. Rekomendasi berprioritas ---------------------------------------
  const tierOf = (item: ChecklistItem): RecommendationItem["tier"] | null => {
    if (item.status === "VALID") return null;
    if (item.relevance === "BONUS") return 4;
    if (item.relevance === "WAJIB") {
      if (item.status === "EXPIRED") return 0;
      if (item.status === "EXPIRING") return 1;
      return 2;
    }
    return 3; // JALUR naik kelas
  };
  const recommendations: RecommendationItem[] = checklist
    .map((item) => {
      const t = tierOf(item);
      if (t === null) return null;
      return {
        key: item.key,
        letter: item.letter,
        status: item.status as Exclude<ScanStatus, "VALID">,
        relevance: item.relevance,
        tier: t,
      } satisfies RecommendationItem;
    })
    .filter((x): x is RecommendationItem => x !== null)
    .sort((a, b) => a.tier - b.tier || CATALOG_BY_KEY[a.key].order - CATALOG_BY_KEY[b.key].order);

  return {
    company,
    classStatus,
    heldClasses,
    currentClass,
    nextClass,
    score,
    checklist,
    recommendations,
    summary,
  };
}

/** Nama syarat utama per kelas — untuk stepper jalur naik kelas. */
export function classRequirementKey(cls: LicenseClass): string {
  return cls;
}

export type { CatalogRequirement };
