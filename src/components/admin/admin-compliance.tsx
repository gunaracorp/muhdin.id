"use client";

/**
 * v12.1 — CMS COMPLIANCE CHECKER (God-Mode Izin).
 *
 * Satu kartu untuk mengoperasikan mesin kepatuhan:
 *   • Tombol JALANKAN AUDIT — menilai seluruh RegistryCompany (engine Pindai
 *     Izin 360°), menyimpan snapshot skor + temuan, dan meneruskan ringkasan
 *     ke sekretariat via Email & WhatsApp (saklar notifyCompliance).
 *   • Riwayat audit (20 terakhir) — agregat per eksekusi + rincian temuan
 *     berprioritas saat dibuka.
 *
 * Data nyata: POST/GET /api/compliance/audit (guardRole SUPER_ADMIN/ADMIN/
 * VERIFIKATOR; EDITOR hanya membaca).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportCsvButton } from "@/components/admin/import-csv-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AuditRow {
  id: string;
  scope: string;
  triggeredBy: string;
  total: number;
  passed: number;
  warnings: number;
  critical: number;
  avgScore: number;
  expiredDocs: number;
  expiringDocs: number;
  missingDocs: number;
  notified: boolean;
  note: string | null;
  startedAt: string;
  finishedAt: string | null;
  _count?: { findings: number };
}

interface FindingRow {
  id: string;
  companyName: string;
  companyNib: string;
  requirementKey: string;
  letter: string;
  relevance: string;
  status: string;
  tier: number;
  severity: string;
  message: string;
  createdAt: string;
}

interface RunResult {
  audit: AuditRow;
  findingsCount: number;
  topFindings: FindingRow[];
  notified: boolean;
}

export function AdminCompliance() {
  const { toast } = useToast();
  const [audits, setAudits] = useState<AuditRow[] | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<RunResult | null>(null);
  const [openFindings, setOpenFindings] = useState<Record<string, FindingRow[] | "LOADING">>({});

  const load = useCallback(async () => {
    try {
      setAudits(await apiGet<AuditRow[]>("/api/compliance/audit"));
    } catch {
      setAudits([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAudit = async () => {
    setRunning(true);
    try {
      const res = await apiSend<RunResult>("/api/compliance/audit", "POST", {});
      setLastRun(res);
      toast({
        title: "Audit god-mode selesai ✓",
        description: `${res.audit.total} perusahaan dinilai — rata-rata ${Math.round(res.audit.avgScore)}/100, ${res.audit.critical} kritis, ${res.findingsCount} temuan.${res.notified ? " Notifikasi Email & WhatsApp diteruskan." : ""}`,
      });
      await load();
    } catch (e) {
      toast({ title: "Audit gagal", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const toggleFindings = async (auditId: string) => {
    if (openFindings[auditId]) {
      setOpenFindings((s) => {
        const next = { ...s };
        delete next[auditId];
        return next;
      });
      return;
    }
    setOpenFindings((s) => ({ ...s, [auditId]: "LOADING" }));
    try {
      const res = await apiGet<{ audit: AuditRow; findings: FindingRow[] }>(`/api/compliance/audit?auditId=${auditId}`);
      setOpenFindings((s) => ({ ...s, [auditId]: res.findings }));
    } catch {
      setOpenFindings((s) => {
        const next = { ...s };
        delete next[auditId];
        return next;
      });
      toast({ title: "Gagal memuat temuan", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      {/* ===== PANEL JALANKAN AUDIT ===== */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-gold-deep">
              <Icon name="shield-check" className="h-4 w-4" aria-hidden />
              God-Mode Izin Compliance Checker
            </p>
            <h2 className="mt-1 text-lg font-black">Audit kepatuhan seluruh registri</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Menilai seluruh perusahaan dengan engine Pindai Izin 360° (12 syarat a–l): skor, grade A–E, level
              risiko, dan temuan berprioritas. Snapshot tersimpan sebagai tren; temuan diteruskan ke sekretariat
              via Email &amp; WhatsApp bila saklar <em>notifyCompliance</em> aktif.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ImportCsvButton type="registry" />
            <Button onClick={() => void runAudit()} disabled={running} className="shrink-0 gap-2">
              <Icon name={running ? "loader" : "play"} className={cn("h-4 w-4", running && "animate-spin")} aria-hidden />
              {running ? "Menilai registri…" : "JALANKAN AUDIT"}
            </Button>
          </div>
        </div>

        {lastRun && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <RunStat label="Perusahaan" value={lastRun.audit.total} tone="text-foreground" />
            <RunStat label="Rata-rata" value={Math.round(lastRun.audit.avgScore)} tone="text-primary" />
            <RunStat label="A–B (sehat)" value={lastRun.audit.passed} tone="text-emerald-600 dark:text-emerald-400" />
            <RunStat label="C–D (perhatian)" value={lastRun.audit.warnings} tone="text-amber-600 dark:text-amber-400" />
            <RunStat label="E (kritis)" value={lastRun.audit.critical} tone="text-red-600 dark:text-red-400" />
          </div>
        )}
      </div>

      {/* ===== RIWAYAT AUDIT ===== */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-gold-deep">
          <Icon name="history" className="h-4 w-4" aria-hidden />
          Riwayat Audit ({audits?.length ?? 0})
        </p>

        {!audits ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : audits.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-xs italic text-muted-foreground">
            Belum ada audit — jalankan audit pertama dengan tombol di atas.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {audits.map((a) => (
              <div key={a.id} className="overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() => void toggleFindings(a.id)}
                  aria-expanded={Boolean(openFindings[a.id])}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 p-3.5 text-start hover:bg-muted/40"
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Icon name="calendar" className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    {new Date(a.finishedAt ?? a.startedAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    oleh <strong className="text-foreground">{a.triggeredBy}</strong>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {a.total} perusahaan
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {a.passed} sehat
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-400">
                      {a.warnings} perhatian
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-red-700 dark:text-red-400">
                      {a.critical} kritis
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      rata-rata {Math.round(a.avgScore)}
                    </Badge>
                    {a.note && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {a.note}
                      </Badge>
                    )}
                  </span>
                  <span className="ms-auto flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                    {a._count ? `${a._count.findings} temuan` : ""}
                    <Icon
                      name="chevron-down"
                      className={cn("h-3.5 w-3.5 transition-transform", openFindings[a.id] && "rotate-180")}
                      aria-hidden
                    />
                  </span>
                </button>

                {openFindings[a.id] === "LOADING" && (
                  <div className="border-t p-3">
                    <Skeleton className="h-8 rounded-lg" />
                  </div>
                )}
                {Array.isArray(openFindings[a.id]) && (
                  <div className="max-h-96 space-y-1.5 overflow-y-auto border-t bg-background/60 p-3">
                    {(openFindings[a.id] as FindingRow[]).length === 0 ? (
                      <p className="p-2 text-center text-xs italic text-muted-foreground">
                        Tidak ada temuan — seluruh syarat berlaku.
                      </p>
                    ) : (
                      (openFindings[a.id] as FindingRow[]).map((f) => (
                        <div key={f.id} className="flex items-start gap-2 rounded-lg border bg-card px-3 py-2">
                          <span
                            className={cn(
                              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-black uppercase",
                              f.severity === "KRITIS" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                              f.severity === "PERINGATAN" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                              f.severity === "INFO" && "bg-muted text-muted-foreground"
                            )}
                          >
                            {f.letter}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold">
                              {f.companyName}
                              <span className="ms-2 font-mono text-[10px] font-normal text-muted-foreground" dir="ltr">
                                {f.companyNib}
                              </span>
                            </p>
                            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{f.message}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[9px]",
                              f.severity === "KRITIS" && "border-red-300 text-red-700 dark:text-red-400",
                              f.severity === "PERINGATAN" && "border-amber-300 text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {f.severity}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Kotak statistik hasil audit terakhir. */
function RunStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border bg-background/60 px-3 py-2 text-center">
      <p className={cn("text-xl font-black tabular-nums", tone)} dir="ltr">
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
