/**
 * v7.0 — Helper bersama untuk API Registri Izin (validasi payload dokumen).
 * Dipakai /api/license-registry & /api/license-registry/[id].
 */
import { CATALOG_KEYS } from "./license-catalog";

export const LEGAL_ENTITIES = ["PT", "CV", "KOPERASI", "UD", "YAYASAN"];

export interface ParsedDocRow {
  requirementKey: string;
  docNo: string;
  issuedBy: string;
  validUntil: Date | null;
}

/**
 * Validasi array dokumen dari body → baris RegistryDoc.
 * - undefined/null → null (payload tidak menyentuh dokumen)
 * - array → baris tervalidasi (kunci tidak dikenal → null = gagal)
 */
export function parseDocsInput(raw: unknown): ParsedDocRow[] | null {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) return [];
  const rows: ParsedDocRow[] = [];
  for (const item of raw) {
    const key = String((item as Record<string, unknown>)?.requirementKey || "").toUpperCase();
    if (!CATALOG_KEYS.includes(key)) return null;
    const vu = (item as Record<string, unknown>)?.validUntil;
    const parsed = vu ? new Date(String(vu)) : null;
    rows.push({
      requirementKey: key,
      docNo: String((item as Record<string, unknown>)?.docNo || "").trim(),
      issuedBy: String((item as Record<string, unknown>)?.issuedBy || "").trim(),
      validUntil: parsed && !Number.isNaN(parsed.getTime()) ? parsed : null,
    });
  }
  return rows;
}
