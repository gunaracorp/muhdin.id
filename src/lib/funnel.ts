/**
 * funnel.ts — R-093 Analitik Funnel Pendaftaran.
 *
 * Sumber kebenaran tunggal stage funnel + helper pencatat event server.
 * Stage berurutan ( atas ke bawah = alur calon anggota/jamaah ):
 *   VIEW_PAKET   → melihat detail paket ibadah (client track, anonim)
 *   VIEW_DAFTAR  → membuka formulir pendaftaran (client track, anonim)
 *   DAFTAR_SUBMIT→ mengirim pendaftaran (hook /api/applications POST)
 *   APP_APPROVED → pendaftaran disetujui verifikator (hook PATCH)
 *   KTA_ISSUED   → Kartu Tanda Anggota diterbitkan (hook pilgrim-cards POST)
 *
 * Tanpa data pribadi: hanya stage + referensi anonim (slug/kode tiket).
 */

import { db } from "@/lib/db";

export const FUNNEL_STAGES = [
  "VIEW_PAKET",
  "VIEW_DAFTAR",
  "DAFTAR_SUBMIT",
  "APP_APPROVED",
  "KTA_ISSUED",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export function isFunnelStage(v: string): v is FunnelStage {
  return (FUNNEL_STAGES as readonly string[]).includes(v);
}

/** Label ringkas (CMS berbahasa Indonesia). */
export const FUNNEL_LABELS: Record<FunnelStage, string> = {
  VIEW_PAKET: "Lihat Paket",
  VIEW_DAFTAR: "Buka Formulir",
  DAFTAR_SUBMIT: "Kirim Pendaftaran",
  APP_APPROVED: "Disetujui Verifikator",
  KTA_ISSUED: "KTA Terbit",
};

/** Catat event funnel — fire-and-forget aman (gagal dicatat tidak mengganggu alur utama). */
export function recordFunnel(stage: FunnelStage, refId?: string | null, source: "WEB" | "API" = "API") {
  void db.funnelEvent
    .create({ data: { stage, refId: refId ? String(refId).slice(0, 120) : null, source } })
    .catch(() => {});
}
