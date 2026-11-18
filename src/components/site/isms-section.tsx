"use client";

/**
 * R-098 v15.0.0 «GOD MODE» — Seksi Kesiapan ISO 27001 (Transparansi ISMS).
 * Menampilkan register kendali Annex A (ISO 27001:2022) dengan status
 * PLANNED / IMPLEMENTED / VERIFIED dan ringkasan kesiapan (% kendali
 * terimplementasi) — dasar publik menuju audit sertifikasi eksternal.
 * Dipasang di #/compliance (Compliance Hub).
 */

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ISMSRow {
  id: string;
  code: string;
  title: string;
  category: string;
  status: "PLANNED" | "IMPLEMENTED" | "VERIFIED";
  evidence: string | null;
}

interface ISMSData {
  summary: { total: number; implemented: number; verified: number };
  readiness: number;
  controls: ISMSRow[];
}

const STATUS_TONE: Record<ISMSRow["status"], string> = {
  PLANNED: "bg-muted text-muted-foreground border-border",
  IMPLEMENTED: "bg-sky-500/10 text-sky-700 border-sky-500/40 dark:text-sky-300",
  VERIFIED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40 dark:text-emerald-300",
};

export function IsmsSection() {
  const { t } = useT();
  const [data, setData] = useState<ISMSData | null>(null);

  useEffect(() => {
    apiGet<ISMSData>("/api/isms-controls")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || data.summary.total === 0) return null;

  const cats = [...new Set(data.controls.map((c) => c.category))];

  return (
    <section className="py-14" aria-label={t("isms.aria")} data-testid="isms-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold-deep dark:text-gold">
          <Icon name="shield" className="h-3 w-3" aria-hidden /> R-098 · v15
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">{t("isms.title")}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t("isms.desc")}</p>

        {/* Ringkasan kesiapan */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
            <p className="text-4xl font-extrabold tabular-nums text-primary" dir="ltr">{data.readiness}%</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("isms.readiness")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
            <p className="text-4xl font-extrabold tabular-nums text-sky-600 dark:text-sky-400" dir="ltr">{data.summary.implemented}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("isms.implemented")}</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-center shadow-sm">
            <p className="text-4xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400" dir="ltr">{data.summary.verified}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("isms.verified")}</p>
          </div>
        </div>

        {/* Register per kategori */}
        {cats.map((cat) => (
          <div key={cat} className="mt-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{t(`isms.cat.${cat.toLowerCase()}`)}</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {data.controls.filter((c) => c.category === cat).map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-bold" dir="ltr">
                      <span className="font-mono text-xs text-gold-deep dark:text-gold">{c.code}</span> · {c.title}
                    </p>
                    {c.evidence && <p className="mt-0.5 truncate text-[11px] text-muted-foreground" dir="ltr">{c.evidence}</p>}
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase", STATUS_TONE[c.status])}>
                    {t(`isms.status.${c.status.toLowerCase()}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
