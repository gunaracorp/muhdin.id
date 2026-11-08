"use client";

/**
 * roadmap99-section.tsx — v12.2 «99 ROADMAP UPGRADE» (seksi portal Tentang Kami).
 * 4 kartu statistik + bar progres + filter pilar/status + grid 99 item + CTA WA.
 * Nilai kanonik (JAMAAH/P0/DONE) dipetakan ke label via kamus roadmap99.
 */
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/constants";
import type { RoadmapItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const PILLARS = ["JAMAAH", "AKADEMI", "BISNIS", "PLATFORM", "KEAMANAN", "EKOSISTEM"] as const;
const STATUSES = ["DONE", "IN_PROGRESS", "PLANNED"] as const;

const PILLAR_ICON: Record<string, string> = {
  JAMAAH: "users",
  AKADEMI: "graduation-cap",
  BISNIS: "briefcase",
  PLATFORM: "cpu",
  KEAMANAN: "shield-check",
  EKOSISTEM: "network",
};

const STATUS_TONE: Record<string, string> = {
  DONE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
  IN_PROGRESS: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/40",
  PLANNED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/40",
};
const STATUS_ICON: Record<string, string> = {
  DONE: "check-circle-2",
  IN_PROGRESS: "timer",
  PLANNED: "clock",
};
const PRIORITY_TONE: Record<string, string> = {
  P0: "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/40",
  P1: "bg-orange-500/12 text-orange-700 dark:text-orange-400 border-orange-500/40",
  P2: "bg-sky-500/12 text-sky-700 dark:text-sky-400 border-sky-500/40",
  P3: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/40",
};

const WA_LINK = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(
  "Assalamu'alaikum, saya ingin mengusulkan upgrade ke-100 untuk peta jalan MUHDIN.ID."
)}`;

export function Roadmap99Section() {
  const { t, locale } = useT();
  const [items, setItems] = useState<RoadmapItem[] | null>(null);
  const [pillar, setPillar] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");

  useEffect(() => {
    apiGet<RoadmapItem[]>(`/api/roadmap/items?locale=${locale}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [locale]);

  const stats = useMemo(() => {
    const all = items ?? [];
    return {
      total: all.length,
      done: all.filter((i) => i.status === "DONE").length,
      inprogress: all.filter((i) => i.status === "IN_PROGRESS").length,
      planned: all.filter((i) => i.status === "PLANNED").length,
    };
  }, [items]);

  const filtered = useMemo(
    () =>
      (items ?? []).filter(
        (i) => (pillar === "ALL" || i.pillar === pillar) && (status === "ALL" || i.status === status),
      ),
    [items, pillar, status],
  );

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const statCards = [
    { key: "total", value: stats.total, icon: "map", tone: "text-primary" },
    { key: "done", value: stats.done, icon: "check-circle-2", tone: "text-emerald-600 dark:text-emerald-400" },
    { key: "inprogress", value: stats.inprogress, icon: "timer", tone: "text-amber-600 dark:text-amber-400" },
    { key: "planned", value: stats.planned, icon: "clock", tone: "text-slate-500 dark:text-slate-400" },
  ];

  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge className="bg-primary/10 text-primary border-primary/30 font-bold">{t("roadmap99.badge")}</Badge>
            <Badge className="bg-gold/15 text-gold-deep border-gold/40 font-bold">
              {t("roadmap99.progress.label")} · {pct}%
            </Badge>
          </div>
        </Reveal>
        <SectionHeading
          eyebrow={t("roadmap99.eyebrow")}
          title={t("roadmap99.title")}
          subtitle={t("roadmap99.subtitle")}
        />

        {!items ? (
          <Skeleton className="mt-10 h-64 rounded-2xl" />
        ) : (
          <>
            {/* Statistik + progres */}
            <Reveal className="mt-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map((s) => (
                  <div key={s.key} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
                    <Icon name={s.icon} className={cn("mx-auto h-5 w-5", s.tone)} />
                    <p className={cn("mt-1 text-2xl font-extrabold", s.tone)}>{s.value}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {t(`roadmap99.stats.${s.key}`)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>{t("roadmap99.progress.label")}</span>
                  <span className="text-foreground">
                    {stats.done}/{stats.total} {t("roadmap99.progress.unit")} · {pct}%
                  </span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct}%`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-primary transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex gap-4 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t("roadmap99.status.DONE")}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{t("roadmap99.status.IN_PROGRESS")}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />{t("roadmap99.status.PLANNED")}</span>
                </div>
              </div>
            </Reveal>

            {/* Filter pilar */}
            <Reveal className="mt-8">
              <div className="flex flex-wrap justify-center gap-2">
                <FilterChip active={pillar === "ALL"} onClick={() => setPillar("ALL")}>
                  {t("roadmap99.filter.all")}
                </FilterChip>
                {PILLARS.map((p) => (
                  <FilterChip key={p} active={pillar === p} onClick={() => setPillar(p)}>
                    <Icon name={PILLAR_ICON[p]} className="h-3.5 w-3.5" />
                    {t(`roadmap99.pillar.${p}`)}
                  </FilterChip>
                ))}
              </div>
              {/* Filter status */}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <FilterChip active={status === "ALL"} onClick={() => setStatus("ALL")} small>
                  {t("roadmap99.filter.allStatus")}
                </FilterChip>
                {STATUSES.map((s) => (
                  <FilterChip key={s} active={status === s} onClick={() => setStatus(s)} small>
                    <Icon name={STATUS_ICON[s]} className="h-3.5 w-3.5" />
                    {t(`roadmap99.status.${s}`)}
                  </FilterChip>
                ))}
              </div>
            </Reveal>

            {/* Grid item */}
            <Reveal className="mt-8">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {filtered.length} {t("roadmap99.item.count")}
              </p>
              {filtered.length === 0 ? (
                <p className="rounded-2xl border border-dashed bg-card/60 p-8 text-center text-sm text-muted-foreground">
                  {t("roadmap99.empty")}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((item) => (
                    <article
                      key={item.id}
                      className={cn(
                        "group flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                        item.status === "DONE" && "border-emerald-500/30",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                          {item.code}
                        </span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold", STATUS_TONE[item.status] ?? "")}>
                          <Icon name={STATUS_ICON[item.status] ?? "circle"} className="h-3 w-3" />
                          {t(`roadmap99.status.${item.status}`)}
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-sm font-extrabold leading-snug">{item.title}</h3>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1 mt-auto">
                        <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[11px] font-semibold text-foreground/75">
                          <Icon name={PILLAR_ICON[item.pillar] ?? "circle"} className="h-3 w-3 text-gold-deep" />
                          {t(`roadmap99.pillar.${item.pillar}`)}
                        </span>
                        <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px] font-bold", PRIORITY_TONE[item.priority] ?? "")}>
                          {item.priority} · {t(`roadmap99.priority.${item.priority}`)}
                        </span>
                        <span className="rounded-md border bg-muted/50 px-1.5 py-0.5 text-[11px] font-semibold text-foreground/75">
                          {t("roadmap99.effort.label")} {item.effort} · {t(`roadmap99.effort.${item.effort}`)}
                        </span>
                        <span className="ms-auto rounded-md bg-gold/15 px-1.5 py-0.5 text-[11px] font-bold text-gold-deep">
                          {item.target}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Reveal>

            {/* CTA usulkan upgrade ke-100 */}
            <Reveal className="mt-10">
              <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-mint/40 to-gold/10 p-6 text-center shadow-sm sm:p-8">
                <h3 className="text-lg font-extrabold text-forest dark:text-emerald-300">{t("roadmap99.cta.title")}</h3>
                <p className="mx-auto mt-1 max-w-xl text-sm text-foreground/70">{t("roadmap99.cta.sub")}</p>
                <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105">
                  <Icon name="message-circle" className="h-4 w-4" />
                  {t("roadmap99.cta.button")}
                </a>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all",
        small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
