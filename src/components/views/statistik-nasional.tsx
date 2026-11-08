"use client";

/**
 * v10 — StatistikNasional: seksi dashboard publik live di #/transparansi.
 * Data: /api/stats/public (agregat non-PII, cache 5 menit).
 * Chart recharts mengikuti konvensi admin-dashboard (hijau #0b5c3f, emas #d4a017).
 * i18n namespace "statistik.*" — RTL-aman & dark-mode-aman.
 */
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/client-api";
import { formatNumberL10n, useT } from "@/lib/i18n";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Snapshot = {
  generatedAt: string;
  members: {
    total: number;
    verified: number;
    byType: { type: string; count: number }[];
    byProvince: { name: string; count: number }[];
    growth: { month: string; label: string; total: number }[];
  };
  content: { articles: number; articleViews: number; tutorials: number; tutorialViews: number; events: number; upcomingEvents: number; gallery: number; testimonials: number; faqs: number };
  passports: { total: number; byStatus: { status: string; count: number }[]; verifications: number };
  tracking: { devices: number; online: number; pax: number };
  tour: { scenes: number; views: number };
  ai: { total: number; today: number; avgLatencyMs: number; byDay14: { date: string; label: string; portal: number; whatsapp: number }[] };
};

/** Palet pie komposisi tipe (hijau-emas klasik + turunannya). */
const PIE_COLORS = ["#0b5c3f", "#d4a017", "#2f9e6e", "#8a6d1a", "#5cc493", "#c9a227"];

/** Label tipe anggota: pakai kamus members.type.* bila ada, fallback kode mentah. */
function typeLabel(ty: string, t: (k: string) => string): string {
  const val = t(`members.type.${ty}`);
  return val === `members.type.${ty}` ? ty : val;
}

function ChartCard({ title, sub, children, height = 260 }: { title: string; sub?: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <p className="text-sm font-extrabold text-foreground">{title}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      <div className="mt-3" style={{ height }} dir="ltr">
        {children}
      </div>
    </div>
  );
}

export function StatistikNasional() {
  const { t, locale } = useT();
  const [state, setState] = useState<{ loading: boolean; error: boolean; data: Snapshot | null }>({
    loading: true,
    error: false,
    data: null,
  });

  const load = useCallback(() => {
    apiGet<Snapshot>("/api/stats/public")
      .then((d) => setState({ loading: false, error: false, data: d }))
      .catch(() => setState({ loading: false, error: true, data: null }));
  }, []);

  const reload = useCallback(() => {
    setState({ loading: true, error: false, data: null });
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  if (state.loading) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 sm:flex-row sm:items-center">
        <Icon name="alert-triangle" className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" aria-hidden />
        <p className="flex-1 text-sm font-bold text-foreground/85">{t("transparansi.stats.error")}</p>
        <Button variant="outline" onClick={reload} className="shrink-0 rounded-full font-bold">
          <Icon name="rotate" className="me-1.5 h-4 w-4" aria-hidden />
          {t("transparansi.stats.retry")}
        </Button>
      </div>
    );
  }

  const d = state.data;
  const num = (n: number) => formatNumberL10n(n, locale);
  const contentTotal = d.content.articles + d.content.tutorials;
  const kpis: [icon: string, label: string, value: number, accent: string][] = [
    ["badge-check", t("statistik.kpi.verified"), d.members.verified, "text-primary"],
    ["boxes", t("statistik.kpi.ecosystem"), d.members.total, "text-emerald-700 dark:text-emerald-400"],
    ["book-marked", t("statistik.kpi.content"), contentTotal, "text-sky-700 dark:text-sky-400"],
    ["qr-code", t("statistik.kpi.passports"), d.passports.byStatus.find((s) => s.status === "ACTIVE")?.count ?? 0, "text-gold-deep dark:text-gold"],
    ["brain-circuit", t("statistik.kpi.ai"), d.ai.total, "text-violet-700 dark:text-violet-400"],
    ["orbit", t("statistik.kpi.tour"), d.tour.views, "text-teal-700 dark:text-teal-400"],
  ];

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map(([icon, label, value, accent]) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground">
              <Icon name={icon} className={`h-4 w-4 ${accent}`} aria-hidden />
              <span className="line-clamp-1">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{num(value)}</p>
          </div>
        ))}
      </div>

      {/* Baris chart 1: provinsi + pertumbuhan */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("statistik.chart.provinceTitle")} sub={t("statistik.chart.provinceSub")} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.members.byProvince} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} cursor={{ fill: "rgba(11,92,63,0.06)" }} />
              <Bar dataKey="count" name={t("statistik.chart.members")} fill="#0b5c3f" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("statistik.chart.growthTitle")} sub={t("statistik.chart.growthSub")} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={d.members.growth} margin={{ left: -14, right: 8 }}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b5c3f" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0b5c3f" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Area type="monotone" dataKey="total" name={t("statistik.chart.members")} stroke="#0b5c3f" strokeWidth={2.5} fill="url(#growthFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Baris chart 2: komposisi tipe + sesi AI */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("statistik.chart.typeTitle")} sub={t("statistik.chart.typeSub")} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={d.members.byType} dataKey="count" nameKey="type" innerRadius="55%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
                {d.members.byType.map((entry, i) => (
                  <Cell key={entry.type} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(value: number | string, name: string) => [value, typeLabel(name, t)]}
              />
              <Legend
                wrapperStyle={{ fontSize: 10 }}
                formatter={(value: string) => typeLabel(value, t)}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("statistik.chart.aiTitle")} sub={t("statistik.chart.aiSub")} height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.ai.byDay14}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} cursor={{ fill: "rgba(212,160,23,0.08)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="portal" name={t("statistik.chart.portal")} stackId="ai" fill="#0b5c3f" />
              <Bar dataKey="whatsapp" name={t("statistik.chart.whatsapp")} stackId="ai" fill="#d4a017" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Rincian paspor + catatan live */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <p className="text-sm font-extrabold">{t("statistik.table.title")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {d.passports.byStatus.map((s) => {
            const tone =
              s.status === "ACTIVE"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : s.status === "EXPIRED"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  : "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300";
            return (
              <span key={s.status} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${tone}`}>
                <span dir="ltr">{s.status}</span>
                <span className="opacity-70">·</span>
                {num(s.count)}
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("statistik.table.verifications")}: <span className="font-bold text-foreground">{num(d.passports.verifications)}</span>
          {" · "}
          {t("statistik.chart.aiSub")}: {num(d.ai.total)} {t("statistik.chart.sessions")}
        </p>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Icon name="database-zap" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {t("statistik.note")}{" "}
          <span dir="ltr">
            ({t("statistik.hero.updated")}: {new Date(d.generatedAt).toLocaleTimeString(locale === "ar" ? "ar" : locale === "en" ? "en-GB" : "id-ID")})
          </span>
        </span>
      </p>
    </div>
  );
}
