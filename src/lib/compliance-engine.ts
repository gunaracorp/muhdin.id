/**
 * v12.1 — GOD-MODE IZIN COMPLIANCE CHECKER (engine pelengkap).
 *
 * Berdiri di atas engine Pindai Izin 360° (license-engine.ts): satu eksekusi
 * audit menilai SELURUH perusahaan registri, menghasilkan:
 *   • grade kepatuhan A–E  (A ≥90 · B ≥80 · C ≥70 · D ≥60 · E <60)
 *   • level risiko         (RENDAH · SEDANG · TINGGI · KRITIS)
 *   • temuan berprioritas  (tier 0 darurat … 4 nilai tambah)
 *   • pesan temuan siap-notifikasi (Email sekretariat + WhatsApp admin)
 *
 * Fungsi murni tanpa DB/React — dipakai bersama oleh API /api/compliance/*,
 * portal #/compliance, CMS, dan skrip seed. Nama grade/risk stabil (dikirim
 * apa adanya ke klien; label diterjemahkan via i18n `compliance.grade.*`).
 */

import { buildScan, type ChecklistItem, type ScanResult, type EngineDoc, type EngineCompany } from "./license-engine";

export type Grade = "A" | "B" | "C" | "D" | "E";
export type Risk = "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
export type Severity = "KRITIS" | "PERINGATAN" | "INFO";

export interface FindingDraft {
  requirementKey: string;
  letter: string;
  category: string;
  relevance: string;
  status: Exclude<ChecklistItem["status"], "VALID">;
  tier: number;
  severity: Severity;
  message: string;
}

export interface AuditCompanyResult {
  scan: ScanResult;
  grade: Grade;
  risk: Risk;
  findings: FindingDraft[];
}

/** Grade kepatuhan dari skor 0–100. */
export function gradeOf(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

/**
 * Level risiko — gabungan skor & kondisi dokumen wajib:
 *  • KRITIS : ada dokumen WAJIB kedaluwarsa ATAU skor < 45
 *  • TINGGI : ada dokumen wajib segera berakhir (≤90 hari) ATAU skor < 60
 *  • SEDANG : skor < 80
 *  • RENDAH : sisanya
 */
export function riskOf(scan: ScanResult): Risk {
  const wajibExpired = scan.checklist.some(
    (c) => c.status === "EXPIRED" && c.relevance === "WAJIB"
  );
  if (wajibExpired || scan.score < 45) return "KRITIS";
  const wajibExpiring = scan.checklist.some(
    (c) => c.status === "EXPIRING" && c.relevance === "WAJIB"
  );
  if (wajibExpiring || scan.score < 60) return "TINGGI";
  if (scan.score < 80) return "SEDANG";
  return "RENDAH";
}

/**
 * Pesan temuan bahasa Indonesia — dipakai untuk baris ComplianceFinding,
 * isi notifikasi Email/WA, dan modul CMS. Kunci syarat diterjemahkan di
 * portal via i18n `scan.req.<KEY>`; pesan di sini berorientasi admin.
 */
export function findingMessage(item: ChecklistItem, companyName: string): string {
  const reqLabel = `${item.letter.toUpperCase()}) ${item.key}`;
  switch (item.status) {
    case "EXPIRED":
      return `${companyName}: dokumen wajib ${reqLabel} KEDALUWARSA${item.daysLeft !== null ? ` (${Math.abs(item.daysLeft)} hari lalu)` : ""} — perpanjangan darurat diperlukan.`;
    case "EXPIRING":
      return `${companyName}: dokumen ${reqLabel} berakhir dalam ${item.daysLeft ?? "?"} hari (≤90 hari) — jadwalkan perpanjangan.`;
    case "MISSING":
      return item.relevance === "JALUR"
        ? `${companyName}: syarat ${reqLabel} (jalur naik kelas) belum direkam — peluang pengembangan.`
        : `${companyName}: syarat ${reqLabel} belum direkam pada registri — lengkapi dokumen.`;
    default:
      return `${companyName}: ${reqLabel} perlu ditinjau.`;
  }
}

/** Severity temuan dari tier prioritas engine. */
export function severityOfTier(tier: number): Severity {
  if (tier <= 0) return "KRITIS";
  if (tier <= 2) return "PERINGATAN";
  return "INFO";
}

/** Nilai SATU perusahaan: scan penuh + grade + risiko + daftar temuan. */
export function auditCompany(company: EngineCompany, docs: EngineDoc[]): AuditCompanyResult {
  const scan = buildScan(company, docs);
  const grade = gradeOf(scan.score);
  const risk = riskOf(scan);
  const findings: FindingDraft[] = scan.recommendations
    .filter((r) => r.tier <= 3) // tier 4 (bonus/IATA-DIGITAL) tidak mengotori temuan audit
    .map((r) => {
      const item = scan.checklist.find((c) => c.key === r.key)!;
      return {
        requirementKey: r.key,
        letter: r.letter,
        category: item.category,
        relevance: r.relevance,
        status: r.status,
        tier: r.tier,
        severity: severityOfTier(r.tier),
        message: findingMessage(item, company.name),
      };
    });
  return { scan, grade, risk, findings };
}

/** Warna konsisten grade & risiko — token design system (tanpa hardcode lintas file). */
export const GRADE_TONE: Record<Grade, string> = {
  A: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60",
  B: "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/60",
  C: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60",
  D: "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60",
  E: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60",
};

export const RISK_TONE: Record<Risk, string> = {
  RENDAH: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60",
  SEDANG: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60",
  TINGGI: "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60",
  KRITIS: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60",
};

/** Warna skor (0–100) → hsl bar: merah (0) → emerald (100). */
export function scoreColor(score: number): string {
  const hue = Math.round((Math.min(100, Math.max(0, score)) / 100) * 145); // 0=merah … 145=hijau
  return `hsl(${hue} 70% 45%)`;
}
