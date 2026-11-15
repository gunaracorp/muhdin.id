"use client";

/**
 * Task 48 — AdminDashboard supercharged:
 *  - Hero sapaan waktu-nyata (hydration aman — dihitung setelah mount)
 *  - 10 kartu KPI (tetap, klik → navigasi seksi)
 *  - BARU: kartu live Pendaftar Gratis (/api/promo/counter, bar progres) — Task 52
 *  - BARU: strip kesehatan sistem (/api/health — DB + latensi + status Nusuk ringkas)
 *  - Status integrasi Nusuk + 2 chart recharts + 2 daftar terbaru (dipertahankan)
 * Catatan: CMS admin konsisten berbahasa Indonesia (konvensi Task 15/33).
 */
import { useEffect, useState } from "react";
import { apiGet, formatDateTime } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminBadge } from "@/components/admin/crud-manager";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AdminStats, MembershipApplication, ContactMessage, NusukPublicData } from "@/lib/types";

const PIE_COLORS = ["#0b5c3f", "#d4a017", "#3e8e68", "#8a6d1f", "#5db08c", "#b5cc4e"];

/** Respons /api/promo/counter (publik). */
type PromoCounter = { total: number; taken: number; remaining: number; closed: boolean };
/** Respons /api/health. */
type Health = { ok: boolean; service: string; checks: Record<string, { ok: boolean; latencyMs?: number }> & Record<string, unknown> };

function greetingOf(h: number): string {
  if (h >= 4 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 19) return "Selamat sore";
  return "Selamat malam";
}

export function AdminDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [promo, setPromo] = useState<PromoCounter | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    apiGet<AdminStats>("/api/stats").then(setStats).catch((e) => setError(e.message));
    apiGet<PromoCounter>("/api/promo/counter").then(setPromo).catch(() => setPromo(null));
    apiGet<Health>("/api/health").then(setHealth).catch(() => setHealth(null));
    // Sapaan & tanggal dihitung setelah mount via defer satu tick (pola React
    // codebase) — hydration aman sekaligus memenuhi aturan set-state-in-effect.
    const timer = window.setTimeout(() => {
      const now = new Date();
      setGreeting(greetingOf(now.getHours()));
      try {
        setToday(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
      } catch {
        setToday(now.toDateString());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (error)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <Icon name="alert-triangle" className="mx-auto h-8 w-8 text-destructive" />
        <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
      </div>
    );

  if (!stats)
    return (
      <div className="space-y-5">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );

  const cards = [
    { label: "Berita & Artikel", value: stats.articles, icon: "newspaper", section: "articles", tone: "text-primary bg-primary/10" },
    { label: "Anggota Terverifikasi", value: stats.members, icon: "grid-3x3", section: "members", tone: "text-gold-deep bg-gold/15" },
    { label: "Tutorial Aktif", value: stats.tutorials, icon: "graduation-cap", section: "tutorials", tone: "text-primary bg-primary/10" },
    { label: "Total Dilihat", value: stats.totalViews, icon: "eye", section: "articles", tone: "text-gold-deep bg-gold/15" },
    { label: "Pesan Belum Dibaca", value: stats.unreadMessages, icon: "inbox", section: "messages", tone: "text-destructive bg-destructive/10", alert: stats.unreadMessages > 0 },
    { label: "Pendaftaran Menunggu", value: stats.pendingApplications, icon: "user-plus", section: "applications", tone: "text-destructive bg-destructive/10", alert: stats.pendingApplications > 0 },
    { label: "Pengaduan Baru", value: stats.unreadComplaints ?? 0, icon: "shield-alert", section: "complaints", tone: "text-destructive bg-destructive/10", alert: (stats.unreadComplaints ?? 0) > 0 },
    { label: "Pelanggan Newsletter", value: stats.subscribers ?? 0, icon: "mail", section: "subscribers", tone: "text-primary bg-primary/10" },
    { label: "FAQ", value: stats.faqs, icon: "help-circle", section: "faqs", tone: "text-primary bg-primary/10" },
    { label: "Testimoni", value: stats.testimonials, icon: "quote", section: "testimonials", tone: "text-gold-deep bg-gold/15" },
  ];

  const promoPct = promo && promo.total > 0 ? Math.min(100, (promo.taken / promo.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome — sapaan waktu-nyata */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-forest to-primary p-6 text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" />
        <div aria-hidden className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">{today || "…"}</p>
            <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">
              {greeting ? `${greeting}, Admin! 👋` : "Assalamu'alaikum, Admin! 👋"}
            </h2>
            <p className="mt-1 text-sm text-emerald-50/85">
              Ringkasan aktivitas ekosistem MUHDIN hari ini — Bersama Melayani Tamu Allah.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => onNavigate("applications")}>
              <Icon name="user-plus" className="mr-1.5 h-4 w-4" />
              Verifikasi Pendaftaran
            </Button>
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => onNavigate("nusuk")}>
              <Icon name="satellite" className="mr-1.5 h-4 w-4" />
              Kelola Nusuk
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onNavigate(c.section)}
            className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.tone}`}>
                <Icon name={c.icon} className="h-5 w-5" />
              </div>
              {c.alert && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-extrabold">{c.value.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Pendaftar gratis live + kesehatan sistem */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-deep">
                <Icon name="megaphone" className="h-3.5 w-3.5" />
                PENDAFTAR GRATIS BERGABUNG
              </p>
              <p className="mt-1.5 text-3xl font-black tracking-tight" dir="ltr">
                {promo ? promo.taken.toLocaleString("id-ID") : "—"}
                <span className="ms-1.5 text-sm font-bold text-muted-foreground">pendaftar</span>
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-deep">
              <Icon name="tag" className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(promoPct)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-soft transition-all duration-700"
              style={{ width: `${promoPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {promo ? `Fase awal tanpa biaya pendaftaran — tanpa kuota` : "Memuat data…"}
            </span>
            <button className="font-bold text-primary hover:underline" onClick={() => onNavigate("applications")}>
              Lihat Pendaftar →
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Icon name="heart-pulse" className="h-3.5 w-3.5" />
            Kesehatan Sistem
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-muted/20 p-3 text-center">
              <Icon
                name={health?.ok ? "check-circle-2" : "alert-triangle"}
                className={`mx-auto h-5 w-5 ${health?.ok ? "text-primary" : "text-destructive"}`}
              />
              <p className="mt-1.5 text-xs font-extrabold">{health ? (health.ok ? "Sehat" : "Gangguan") : "…"}</p>
              <p className="text-[10px] text-muted-foreground">Database</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3 text-center">
              <Icon name="timer" className="mx-auto h-5 w-5 text-gold-deep" />
              <p className="mt-1.5 text-xs font-extrabold" dir="ltr">
                {health?.checks?.database && typeof (health.checks.database as { latencyMs?: number }).latencyMs === "number"
                  ? `${(health.checks.database as { latencyMs: number }).latencyMs} ms`
                  : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Latensi DB</p>
            </div>
            <div className="rounded-xl border bg-muted/20 p-3 text-center">
              <Icon name="satellite" className={`mx-auto h-5 w-5 ${stats.pendingApplications > 0 ? "text-destructive" : "text-primary"}`} />
              <p className="mt-1.5 text-xs font-extrabold" dir="ltr">
                {stats.pendingApplications}
              </p>
              <p className="text-[10px] text-muted-foreground">Antrean Verifikasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrasi Nusuk status */}
      <NusukStatusCard onNavigate={onNavigate} />

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">Artikel per Kategori</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} />
                <Bar dataKey="count" name="Jumlah" fill="#0b5c3f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold">Komposisi Anggota per Jenis Mitra</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.memberByType} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {(stats.memberByType ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            {(stats.memberByType ?? []).map((m, i) => (
              <span key={m.type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {m.type} ({m.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent lists */}
      <div className="grid gap-5 lg:grid-cols-2">
        <RecentList
          title="Pesan Masuk Terbaru"
          icon="inbox"
          action={() => onNavigate("messages")}
          items={stats.recentMessages.map((m: ContactMessage) => ({
            id: m.id,
            title: `${m.name} — ${m.subject}`,
            subtitle: formatDateTime(m.createdAt),
            badge: m.status,
          }))}
        />
        <RecentList
          title="Pendaftaran Terbaru"
          icon="user-plus"
          action={() => onNavigate("applications")}
          items={stats.recentApplications.map((a: MembershipApplication) => ({
            id: a.id,
            title: `${a.orgName} (${a.type})`,
            subtitle: `${a.city} · ${formatDateTime(a.createdAt)}`,
            badge: a.status,
          }))}
        />
      </div>
    </div>
  );
}

function RecentList({
  title,
  icon,
  items,
  action,
}: {
  title: string;
  icon: string;
  items: { id: string; title: string; subtitle: string; badge: string }[];
  action: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Icon name={icon} className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <Button variant="ghost" size="sm" className="h-7 text-primary" onClick={action}>
          Kelola <Icon name="chevron-right" className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="max-h-64 divide-y overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Belum ada data.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.subtitle}</p>
              </div>
              <AdminBadge status={it.badge} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= INTEGRASI NUSUK — STATUS CARD ================= */
function NusukStatusCard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [data, setData] = useState<NusukPublicData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiGet<NusukPublicData>("/api/nusuk/public")
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const connected = data?.connection.status === "CONNECTED";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon name="satellite" className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-3 w-3" aria-hidden>
            {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />}
            <span className={`relative inline-flex h-3 w-3 rounded-full border-2 border-card ${connected ? "bg-primary" : "bg-muted-foreground/50"}`} />
          </span>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold">
            Integrasi Nusuk
            {data && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${connected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {connected ? "Terhubung" : "Terputus"}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {data
              ? `${data.connection.environment || "—"} · ${data.metrics.permitsActive} izin aktif · ${data.metrics.successRate}% sukses sinkron`
              : "Memuat status integrasi…"}
          </p>
        </div>
      </div>
      <div className="sm:ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-primary border-primary/40 hover:bg-primary/10"
          onClick={() => onNavigate("nusuk")}
        >
          Kelola Integrasi
          <Icon name="chevron-right" className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
