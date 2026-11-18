/**
 * open-core/compliance-rules.ts — Aturan kepatuhan izin penyelenggara (referensi).
 *
 * Mirror skala dari src/lib/compliance-engine.ts (v12.1):
 *   grade A ≥90 · B ≥80 · C ≥70 · D ≥60 · E <60
 *   risiko KRITIS bila dokumen WAJIB kedaluwarsa / skor <45, dst.
 * Implementasi murni tanpa DB — skor dihitung dari daftar dokumen yang
 * dibawa pemanggil (hasil pindai / input manual).
 */

export type DocRelevance = "WAJIB" | "PENDUKUNG";
export type DocStatus = "VALID" | "EXPIRING" | "EXPIRED" | "MISSING";

export interface ComplianceDoc {
  kind: string; // mis. NIB | IJIN_UIPPIKU | AKTA | P4GN
  relevance: DocRelevance;
  status: DocStatus;
  /** hari menuju kedaluwarsa (0 = hari ini) */
  daysToExpiry?: number;
}

export interface ComplianceScore {
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "E";
  risk: "RENDAH" | "SEDANG" | "TINGGI" | "KRITIS";
  warnings: string[];
}

/** Skor kepatuhan 0–100 dari daftar dokumen. */
export function scoreCompliance(docs: ComplianceDoc[]): ComplianceScore {
  const warnings: string[] = [];
  const wajib = docs.filter((d) => d.relevance === "WAJIB");
  const pendukung = docs.filter((d) => d.relevance === "PENDUKUNG");

  let score = 100;
  for (const d of wajib) {
    if (d.status === "MISSING") {
      score -= 25;
      warnings.push(`${d.kind} wajib tetapi belum tersedia (−25)`);
    } else if (d.status === "EXPIRED") {
      score -= 20;
      warnings.push(`${d.kind} wajib kedaluwarsa (−20)`);
    } else if (d.status === "EXPIRING") {
      const days = d.daysToExpiry ?? 0;
      const potong = days <= 30 ? 8 : 4;
      score -= potong;
      warnings.push(`${d.kind} wajib segera berakhir (≤${days} hari, −${potong})`);
    }
  }
  for (const d of pendukung) {
    if (d.status === "MISSING") {
      score -= 5;
      warnings.push(`${d.kind} pendukung belum tersedia (−5)`);
    } else if (d.status === "EXPIRED") {
      score -= 4;
      warnings.push(`${d.kind} pendukung kedaluwarsa (−4)`);
    }
  }
  score = Math.max(0, Math.min(100, score));

  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "E";
  const wajibExpired = wajib.some((d) => d.status === "EXPIRED");
  const wajibExpiring = wajib.some((d) => d.status === "EXPIRING");
  const risk =
    wajibExpired || score < 45
      ? "KRITIS"
      : wajibExpiring || score < 60
        ? "TINGGI"
        : score < 80
          ? "SEDANG"
          : "RENDAH";

  return { score, grade, risk, warnings };
}
