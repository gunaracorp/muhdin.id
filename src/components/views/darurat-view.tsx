"use client";

/**
 * Task 5-c — DaruratView: Posko Darurat Jamaah (route #/darurat).
 * Tone darurat: TrustHero tone="red". Nomor darurat Saudi (tel:), perwakilan
 * RI + portal Yordam, posko MUHDIN, jaringan posko wilayah (LIVE /api/branches,
 * maks 8, skeleton/error/empty), prosedur cepat (TrustSteps), aplikasi resmi,
 * callout danger anti-penipuan.
 */
import { useEffect, useState } from "react";
import { navigate } from "@/hooks/use-hash-route";
import { apiGet } from "@/lib/client-api";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { TrustHero, TrustSection, TrustCallout, TrustSteps } from "@/components/views/p0-shared";
// v6.0 — Direktori darurat live dari database (KJRI, KKI, RS, nomor darurat)
import { SosDirectory } from "@/components/views/sos-directory";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n";

/* ============================================================
 * v13.1 — R-096 «Duty Officer 24/7» — petugas jaga berjenjang.
 * Data: GET /api/duty-officer (publik). Eskalasi = urutan sortOrder.
 * ============================================================ */

interface DutyOfficerItem {
  id: string;
  name: string;
  phone: string;
  role: string;
  shiftDays: string;
  escalationMin: number;
  sortOrder: number;
}

const DAY_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

function dutyDays(shiftDays: string): number[] {
  return shiftDays.split(",").map((d) => Number(d)).filter((d) => d >= 0 && d <= 6);
}

function DutyBadge({ role }: { role: string }) {
  const { t } = useT();
  const tone =
    role === "MEDIS"
      ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
      : role === "MARSHAL"
        ? "border-primary/40 bg-primary/10 text-primary"
        : role === "IT_SUPPORT"
          ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
          : "border-gold/40 bg-gold/10 text-gold-deep dark:text-gold-soft";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${tone}`}>
      <Icon name="shield" className="h-3 w-3" aria-hidden />
      {t(`duty.role.${role}`)}
    </span>
  );
}

function DutyOfficerSection() {
  const { t } = useT();
  const [data, setData] = useState<{ onDuty: DutyOfficerItem[]; roster: DutyOfficerItem[] } | null>(null);
  const [today, setToday] = useState(0);

  useEffect(() => {
    apiGet<{ today: number; onDuty: DutyOfficerItem[]; roster: DutyOfficerItem[] }>("/api/duty-officer")
      .then((d) => {
        setData({ onDuty: d.onDuty, roster: d.roster });
        setToday(d.today);
      })
      .catch(() => setData({ onDuty: [], roster: [] }));
  }, []);

  return (
    <div>
      <SectionHeading
        align="left"
        eyebrow={t("duty.eyebrow")}
        title={t("duty.title")}
        subtitle={t("duty.subtitle")}
      />
      {!data ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : data.onDuty.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">{t("duty.empty")}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.onDuty.map((o, i) => (
            <Reveal key={o.id} delay={Math.min(i * 0.05, 0.25)}>
              <li className="flex h-full flex-col rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                      <Icon name="headphones" className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold leading-snug">{o.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("duty.onDuty")} · {t("duty.order")} {o.sortOrder}
                      </p>
                    </div>
                  </div>
                  <DutyBadge role={o.role} />
                </div>
                <p className="mt-3 font-mono text-lg font-bold tracking-tight" dir="ltr">
                  +{o.phone.replace(/^\+?/, "")}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("duty.escalation")}: {o.escalationMin} {t("duty.minutes")}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <a href={`tel:+${o.phone.replace(/^\+?/, "")}`} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-md transition-transform hover:scale-105">
                    <Icon name="phone" className="h-3.5 w-3.5" aria-hidden /> {t("duty.callCta")}
                  </a>
                  <a
                    href={`https://wa.me/${o.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Assalamu'alaikum, saya butuh bantuan darurat (MUHDIN Duty Officer).")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
                  >
                    <Icon name="message-circle" className="h-3.5 w-3.5" aria-hidden /> {t("duty.waCta")}
                  </a>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      )}
      {data && data.roster.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-extrabold">{t("duty.roster")}</th>
                <th className="px-4 py-2.5 font-extrabold">{t("duty.shiftDays")}</th>
                <th className="px-4 py-2.5 font-extrabold">{t("duty.escalation")}</th>
              </tr>
            </thead>
            <tbody>
              {data.roster.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-bold">{o.name}</span>
                    <span className="ml-2"><DutyBadge role={o.role} /></span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex gap-1">
                      {DAY_OF_WEEK.map((di) => (
                        <span
                          key={di}
                          className={`inline-grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold ${
                            dutyDays(o.shiftDays).includes(di)
                              ? di === today
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground/50"
                          }`}
                        >
                          {t(`duty.days.${di}`)}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {o.sortOrder} · {o.escalationMin} {t("duty.minutes")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- tipe & helper ---------- */

/** Bentuk minimum baris /api/branches (publik, published). */
type Branch = {
  name: string;
  code: string;
  province: string;
  city: string;
  officeName: string;
  address: string;
  picName: string;
  picPhone: string;
  email: string | null;
};

/** picPhone format bebas → link wa.me: digits-only, buang awalan 0/8 → tambah 62. */
function waHref(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return `https://wa.me/${d}`;
}

/* ---------- daftar item (pola ITEMS + t(ns.x.key)) ---------- */

const NUMBERS = [
  { icon: "siren", key: "n911", tel: "911" },
  { icon: "shield-alert", key: "n999", tel: "999" },
  { icon: "heart-pulse", key: "n997", tel: "997" },
  { icon: "users", key: "n998", tel: "998" },
  { icon: "stethoscope", key: "n937", tel: "937" },
] as const;

const PROCEDURES = [
  { icon: "passport", key: "passport" },
  { icon: "users", key: "separated" },
  { icon: "heart-pulse", key: "sick" },
  { icon: "heart-handshake", key: "deceased" },
  { icon: "bus", key: "transport" },
] as const;

const APPS = [
  { icon: "smartphone", key: "nusuk", href: "https://www.nusuk.sa" },
  { icon: "smartphone", key: "tawakkalna", href: "https://tawakkalna.sa" },
  { icon: "smartphone", key: "sihat", href: "https://sihatalhajj.sa" },
] as const;

/* --------------------- LIVE: jaringan posko wilayah --------------------- */

function BranchNetwork() {
  const { t, locale } = useT();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGet<Branch[]>(`/api/branches?locale=${locale}`)
      .then((rows) => {
        if (!alive) return;
        setBranches(rows);
        setError(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
      });
    return () => {
      alive = false;
    };
  }, [locale, reloadKey]);

  if (error)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <Icon name="siren" className="mx-auto h-8 w-8 text-destructive/70" aria-hidden />
        <p className="mt-3 text-sm font-bold">{t("darurat.network.error")}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 rounded-full font-bold"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          <Icon name="refresh" className="me-1.5 h-3.5 w-3.5" aria-hidden />
          {t("darurat.network.retry")}
        </Button>
      </div>
    );

  if (!branches)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    );

  if (branches.length === 0)
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <Icon name="network" className="mx-auto h-8 w-8 text-muted-foreground/40" aria-hidden />
        <p className="mt-3 text-sm text-muted-foreground">{t("darurat.network.empty")}</p>
      </div>
    );

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground" aria-live="polite">
        {t("darurat.network.countLabel", { n: Math.min(branches.length, 8) })}
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {branches.slice(0, 8).map((b, i) => (
          <Reveal key={`${b.code}-${b.name}-${i}`} delay={Math.min(i * 0.05, 0.3)}>
            <li className="flex h-full flex-col rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon name="landmark" className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-snug">{b.name}</p>
                  {(b.city || b.province) && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Icon name="map-pin" className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{[b.city, b.province].filter(Boolean).join(", ")}</span>
                    </p>
                  )}
                </div>
              </div>
              {b.picName && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="user" className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>
                    <span className="font-bold text-foreground/80">{b.picName}</span>
                    {b.picPhone && (
                      <span className="ms-1 font-mono" dir="ltr">
                        {b.picPhone}
                      </span>
                    )}
                  </span>
                </p>
              )}
              {b.picPhone && (
                <div className="mt-auto flex gap-2 pt-3">
                  <Button asChild size="sm" variant="outline" className="h-8 flex-1 rounded-full text-xs font-bold">
                    <a href={`tel:${b.picPhone}`} aria-label={`${t("darurat.network.telCta")}: ${b.name}`}>
                      <Icon name="phone" className="me-1 h-3.5 w-3.5" aria-hidden />
                      {t("darurat.network.telCta")}
                    </a>
                  </Button>
                  <Button asChild size="sm" className="h-8 flex-1 rounded-full bg-gradient-to-r from-primary to-forest text-xs font-bold text-white">
                    <a
                      href={waHref(b.picPhone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t("darurat.network.waCta")}: ${b.name}`}
                    >
                      <Icon name="message-circle" className="me-1 h-3.5 w-3.5" aria-hidden />
                      {t("darurat.network.waCta")}
                    </a>
                  </Button>
                </div>
              )}
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- VIEW --------------------------------- */

export function DaruratView() {
  const { t } = useT();

  return (
    <div className="flex flex-col">
      <TrustHero
        tone="red"
        eyebrow={t("darurat.hero.eyebrow")}
        title={t("darurat.hero.title")}
        subtitle={t("darurat.hero.subtitle")}
      />

      <section aria-label={t("darurat.hero.title")} className="py-12">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6">
          {/* Nomor Darurat Arab Saudi */}
          <div>
            <SectionHeading
              eyebrow="tel:"
              title={t("darurat.numbers.title")}
              subtitle={t("darurat.numbers.desc")}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {NUMBERS.map((n, i) => (
                <Reveal key={n.key} delay={Math.min(i * 0.05, 0.25)}>
                  <li className="h-full">
                    <a
                      href={`tel:${n.tel}`}
                      aria-label={`${t(`darurat.numbers.items.${n.key}.t`)} — ${n.tel}`}
                      className="group flex h-full flex-col rounded-2xl border-2 border-red-500/40 bg-red-500/5 p-5 shadow-sm transition-all hover:border-red-500/70 hover:bg-red-500/10 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-600/15 text-red-700 dark:text-red-300">
                          <Icon name={n.icon} className="h-5.5 w-5.5" strokeWidth={1.9} aria-hidden />
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-md transition-transform group-hover:scale-105">
                          <Icon name="phone" className="h-3.5 w-3.5" aria-hidden />
                          {t("darurat.network.telCta")}
                        </span>
                      </div>
                      <p className="mt-4 font-mono text-4xl font-extrabold tracking-tight text-red-700 dark:text-red-300" dir="ltr">
                        {n.tel}
                      </p>
                      <p className="mt-1 text-sm font-extrabold leading-snug">
                        {t(`darurat.numbers.items.${n.key}.t`)}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {t(`darurat.numbers.items.${n.key}.d`)}
                      </p>
                    </a>
                  </li>
                </Reveal>
              ))}
              <Reveal delay={0.25}>
                <li className="flex h-full items-center gap-3 rounded-2xl border border-dashed p-5 text-sm leading-relaxed text-muted-foreground">
                  <Icon name="info" className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  {t("darurat.numbers.freeNote")}
                </li>
              </Reveal>
            </ul>
          </div>

          {/* v13.1 — Duty Officer 24/7 (R-096) */}
          <DutyOfficerSection />

          {/* Perwakilan RI */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="🇮🇩"
              title={t("darurat.rep.title")}
              subtitle={t("darurat.rep.desc")}
            />
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {(
                [
                  { icon: "landmark", key: "kbri" },
                  { icon: "building-2", key: "kjri" },
                ] as const
              ).map((r, i) => (
                <Reveal key={r.key} delay={i * 0.06}>
                  <div className="flex h-full items-start gap-3 rounded-2xl border bg-card p-5 shadow-sm">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={r.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold leading-snug">{t(`darurat.rep.items.${r.key}.t`)}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t(`darurat.rep.items.${r.key}.d`)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
              <Reveal delay={0.12}>
                <div className="flex h-full flex-col rounded-2xl border border-gold/40 bg-gold/5 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                      <Icon name="globe" className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold leading-snug">{t("darurat.rep.yordam.t")}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t("darurat.rep.yordam.d")}
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://yordam.kemlu.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex w-fit items-center gap-1.5 pt-3 text-sm font-bold text-primary hover:underline"
                  >
                    {t("darurat.rep.yordam.cta")}
                    <Icon name="external-link" className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </Reveal>
            </div>
            <TrustCallout tone="amber" icon="shield-alert">
              {t("darurat.rep.hotlineNote")}
            </TrustCallout>
          </div>

          {/* Posko MUHDIN */}
          <TrustSection icon="life-buoy" title={t("darurat.posko.title")} desc={t("darurat.posko.desc")}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={() => navigate("kontak")}
                className="h-11 rounded-full bg-gradient-to-r from-primary to-forest px-6 font-bold text-white"
              >
                <Icon name="send" className="me-2 h-4 w-4" aria-hidden />
                {t("darurat.posko.cta")}
              </Button>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                {t("darurat.posko.fabNote")}
              </p>
            </div>
          </TrustSection>

          {/* Jaringan Posko Wilayah — LIVE */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="DPD / DPC"
              title={t("darurat.network.title")}
              subtitle={t("darurat.network.desc")}
            />
            <Reveal className="mt-6">
              <BranchNetwork />
            </Reveal>
          </div>

          {/* Prosedur Cepat — TrustSteps */}
          <div>
            <SectionHeading
              eyebrow="SOP"
              title={t("darurat.procedure.title")}
              subtitle={t("darurat.procedure.desc")}
            />
            <div className="mt-6">
              <TrustSteps
                items={PROCEDURES.map((p) => ({
                  icon: p.icon,
                  title: t(`darurat.procedure.items.${p.key}.t`),
                  desc: t(`darurat.procedure.items.${p.key}.d`),
                }))}
              />
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate("lapor")} className="rounded-full px-6 font-bold">
                  <Icon name="megaphone" className="me-2 h-4 w-4" aria-hidden />
                  {t("darurat.procedure.cta")}
                </Button>
              </div>
            </div>
          </div>

          {/* Aplikasi resmi */}
          <div>
            <SectionHeading
              align="left"
              eyebrow="App"
              title={t("darurat.apps.title")}
              subtitle={t("darurat.apps.desc")}
            />
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {APPS.map((a, i) => (
                <Reveal key={a.key} delay={i * 0.06}>
                  <a
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`darurat.apps.items.${a.key}.t`)}
                    className="group flex h-full items-start gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon name={a.icon} className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 font-extrabold">
                        {t(`darurat.apps.items.${a.key}.t`)}
                        <Icon name="external-link" className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t(`darurat.apps.items.${a.key}.d`)}
                      </p>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              {t("darurat.apps.downloadNote")}
            </p>
          </div>

          {/* v6.0 — Direktori darurat live (database, dipelihara via CMS) */}
          <SosDirectory />

          {/* Callout danger anti-penipuan */}
          <TrustCallout tone="danger" icon="ban" title={t("darurat.fraud.title")}>
            {t("darurat.fraud.text")}{" "}
            <button
              type="button"
              onClick={() => navigate("verifikasi")}
              className="inline-flex items-center gap-1 font-extrabold underline decoration-2 underline-offset-2 hover:opacity-80"
            >
              {t("darurat.fraud.cta")}
              <Icon name="arrow-right" className="h-3.5 w-3.5 icon-flip" aria-hidden />
            </button>
          </TrustCallout>
        </div>
      </section>
    </div>
  );
}
