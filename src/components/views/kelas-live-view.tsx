"use client";

/**
 * R-024 (v14.1) — Kelas Live & Webinar Terjadwal → Portal #/kelas.
 * Agenda kelas daring Akademi MUHDIN: daftar kelas mendatang (kapasitas,
 * pendaftar, platform), dialog pendaftaran (nama + WA, satu nomor per
 * kelas), forum diskusi per-kelas (R-025) dan rekaman kelas selesai.
 * Data dari /api/live-classes; pendaftaran POST /api/live-classes/register.
 */

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { navigate } from "@/hooks/use-hash-route";
import { cn } from "@/lib/utils";

interface LiveClassItem {
  id: string;
  title: string;
  description: string;
  instructor: string;
  level: string;
  startsAt: string;
  durationMin: number;
  platform: string;
  capacity: number;
  registered: number;
  status: string;
}

const LEVEL_STYLE: Record<string, string> = {
  UMUM: "bg-primary/10 text-primary border-primary/30",
  DASAR: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  LANJUTAN: "bg-gold/15 text-gold-deep border-gold/40 dark:text-gold",
  MENTOR: "bg-destructive/10 text-destructive border-destructive/30",
};

function fmtTanggal(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-GB" : "id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function KelasLiveView() {
  const { t, locale } = useT();
  const k = (key: string) => t(`kelas.${key}`);

  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LiveClassItem | null>(null);
  // R-034 v15.0.0 — evaluasi instruktur (kelas selesai).
  const [reviewFor, setReviewFor] = useState<LiveClassItem | null>(null);
  const [reviewPhone, setReviewPhone] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetch("/api/live-classes").then((r) => r.json());
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    load().then(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/live-classes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selected.id, name, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult({ ok: true, message: data.message ?? k("daftarSukses") });
        setName("");
        setPhone("");
        void load();
      } else {
        setResult({ ok: false, message: data.error ?? k("daftarGagal") });
      }
    } catch {
      setResult({ ok: false, message: k("daftarGagal") });
    } finally {
      setSubmitting(false);
    }
  }

  const totalSeats = classes.reduce((a, c) => a + c.capacity, 0);
  const totalReg = classes.reduce((a, c) => a + c.registered, 0);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {k("eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight" data-testid="kelas-title">{k("title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{k("subtitle")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" data-testid="kelas-stats">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{k("statKelas")}</p>
                <p className="mt-1 text-sm font-extrabold">{classes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{k("statKursi")}</p>
                <p className="mt-1 text-sm font-extrabold">{totalSeats}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold">{k("statTerdaftar")}</p>
                <p className="mt-1 text-sm font-extrabold">{totalReg}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Daftar kelas */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {loading && <p className="py-12 text-center text-sm text-muted-foreground">{k("memuat")}</p>}
          {!loading && classes.length === 0 && (
            <div className="rounded-2xl border bg-card p-10 text-center">
              <Icon name="video" className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">{k("kosong")}</p>
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((c, i) => {
              const penuh = c.registered >= c.capacity;
              const persen = Math.min(100, Math.round((c.registered / Math.max(1, c.capacity)) * 100));
              return (
                <Reveal key={c.id} delay={Math.min(i * 0.04, 0.3)}>
                  <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md" data-testid={`kelas-card-${c.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase", LEVEL_STYLE[c.level] ?? LEVEL_STYLE.UMUM)}>
                        {c.level}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{c.platform}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-extrabold leading-snug">{c.title}</h3>
                    <p className="mt-1 text-xs font-semibold text-primary">{c.instructor}</p>
                    {c.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p className="inline-flex items-center gap-1.5"><Icon name="calendar-days" className="h-3.5 w-3.5" aria-hidden />{fmtTanggal(c.startsAt, locale)}</p>
                      <p className="inline-flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5" aria-hidden />{c.durationMin} {k("menit")}</p>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>{c.registered}/{c.capacity} {k("kursi")}</span>
                        <span className={cn(penuh && "text-destructive")}>{persen}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", penuh ? "bg-destructive" : "bg-primary")} style={{ width: `${persen}%` }} />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1" disabled={penuh || c.status === "DONE"} onClick={() => { setSelected(c); setResult(null); }} data-testid={`kelas-daftar-${c.id}`}>
                        {c.status === "DONE" ? k("selesai") : penuh ? k("penuh") : k("daftar")}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`forum?kelasId=${c.id}`)} data-testid={`kelas-forum-${c.id}`}>
                        <Icon name="message-square" className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      {c.status === "DONE" && (
                        <Button size="sm" variant="outline" onClick={() => { setReviewFor(c); setReviewResult(null); }} aria-label={t("kelasRev.title")} data-testid={`kelas-review-${c.id}`}>
                          <Icon name="star" className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dialog pendaftaran */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected && fmtTanggal(selected.startsAt, locale)} · {selected?.platform}
            </DialogDescription>
          </DialogHeader>
          {result?.ok ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm" data-testid="kelas-sukses">
              <p className="font-extrabold text-emerald-700 dark:text-emerald-400">{k("suksesTitle")}</p>
              <p className="mt-1 text-foreground/80">{result.message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="kelas-name">{k("nama")}</Label>
                <Input id="kelas-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={k("namaPh")} data-testid="kelas-nama" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kelas-phone">{k("telepon")}</Label>
                <Input id="kelas-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 8xx-xxxx-xxxx" data-testid="kelas-telepon" />
                <p className="text-[11px] text-muted-foreground">{k("teleponCatatan")}</p>
              </div>
              {result && !result.ok && (
                <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" data-testid="kelas-gagal">{result.message}</p>
              )}
              <Button className="w-full" onClick={submit} disabled={submitting || name.trim().length < 2 || phone.trim().length < 8} data-testid="kelas-submit">
                {submitting ? k("mengirim") : k("daftar")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog evaluasi instruktur (R-034) */}
      <Dialog open={!!reviewFor} onOpenChange={(open) => !open && setReviewFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("kelasRev.title")}</DialogTitle>
            <DialogDescription>
              {reviewFor?.title} · {reviewFor?.instructor}
            </DialogDescription>
          </DialogHeader>
          {reviewResult?.ok ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm" data-testid="kelas-review-sukses">
              <p className="font-extrabold text-emerald-700 dark:text-emerald-400">{t("kelasRev.thanks")}</p>
              <p className="mt-1 text-foreground/80">{reviewResult.message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center gap-1.5" role="radiogroup" aria-label={t("kelasRev.rating")}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={reviewRating === n}
                    aria-label={`${n} / 5`}
                    onClick={() => setReviewRating(n)}
                    className="rounded-lg p-1.5 transition hover:scale-110"
                    data-testid={`kelas-review-star-${n}`}
                  >
                    <Icon
                      name="star"
                      className={cn("h-7 w-7", n <= reviewRating ? "fill-gold text-gold" : "text-muted-foreground/40")}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-phone">{k("telepon")}</Label>
                <Input id="review-phone" value={reviewPhone} onChange={(e) => setReviewPhone(e.target.value)} placeholder="+62 8xx-xxxx-xxxx" />
                <p className="text-[11px] text-muted-foreground">{t("kelasRev.phoneNote")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment">{t("kelasRev.comment")}</Label>
                <textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder={t("kelasRev.commentPh")}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">{t("kelasRev.privacyNote")}</p>
              </div>
              {reviewResult && !reviewResult.ok && (
                <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{reviewResult.message}</p>
              )}
              <Button
                className="w-full"
                disabled={reviewBusy || reviewRating < 1 || reviewPhone.trim().length < 8}
                onClick={async () => {
                  if (!reviewFor) return;
                  setReviewBusy(true);
                  setReviewResult(null);
                  try {
                    const res = await fetch("/api/instructor-reviews", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        classId: reviewFor.id,
                        phone: reviewPhone.trim(),
                        rating: reviewRating,
                        comment: reviewComment.trim() || undefined,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                      setReviewResult({ ok: true, message: data.message ?? t("kelasRev.thanks") });
                      setReviewComment("");
                      setReviewRating(0);
                    } else {
                      setReviewResult({ ok: false, message: data.error ?? t("kelasRev.fail") });
                    }
                  } catch {
                    setReviewResult({ ok: false, message: t("kelasRev.fail") });
                  } finally {
                    setReviewBusy(false);
                  }
                }}
                data-testid="kelas-review-submit"
              >
                {reviewBusy ? k("mengirim") : t("kelasRev.send")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
