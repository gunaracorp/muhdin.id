/**
 * funnel-client.ts — R-093 track event funnel dari sisi portal (anonim).
 * Fire-and-forget: kegagalan jaringan diabaikan; dedupe per sesi browser
 * (sessionStorage) agar React StrictMode / navigasi ulang tidak menggandakan.
 */

import { withPort } from "@/lib/client-api";

/** Stage yang boleh dikirim dari klien (server stage tidak bisa dipalsukan). */
export type ClientFunnelStage = "VIEW_PAKET" | "VIEW_DAFTAR";

/** Kirim event funnel sekali per sesi untuk kombinasi stage+ref. */
export function trackFunnel(stage: ClientFunnelStage, refId?: string): void {
  try {
    if (typeof window === "undefined") return;
    const key = `mhd-fx-${stage}-${refId ?? ""}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    void fetch(withPort("/api/funnel"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, refId: refId || undefined }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analitik tidak boleh mengganggu UX */
  }
}
