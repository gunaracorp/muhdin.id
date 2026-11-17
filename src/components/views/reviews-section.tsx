"use client";

/**
 * v6.0 — Ulasan Jamaah Terverifikasi (hilir): daftar ulasan APPROVED sebuah
 * paket + form tulis ulasan (wajib nomor Kartu Jamaah aktif — divalidasi
 * server; identitas penulis diambil otomatis dari kartu).
 */

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend, formatDate } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PilgrimReviewItem } from "@/lib/types";
import { DetailSectionHead } from "@/components/views/detail-shell";

function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" className={cn(size, i <= value ? "text-gold" : "text-muted-foreground/25")} aria-hidden />
      ))}
    </span>
  );
}

function AspectBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 font-semibold text-muted-foreground">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-gradient-to-r from-primary to-forest" style={{ width: `${value * 20}%` }} />
      </span>
      <span className="w-4 text-end font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function ReviewsSection({ packageId }: { packageId: string }) {
  const { t } = useT();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<PilgrimReviewItem[] | null>(null);
  const [aggCount, setAggCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ cardNo: "", rating: 5, hotelRate: 5, transportRate: 5, guideRate: 5, body: "" });

  const load = useCallback(() => {
    // Server mengirim { reviews, aggregate } (R-014); array lama tetap ditoleransi.
    apiGet<PilgrimReviewItem[] | { reviews: PilgrimReviewItem[]; aggregate: { count: number } }>(
      `/api/reviews?packageId=${encodeURIComponent(packageId)}`
    )
      .then((d) => {
        if (Array.isArray(d)) { setReviews(d); setAggCount(null); }
        else { setReviews(d.reviews); setAggCount(d.aggregate.count); }
      })
      .catch(() => { setReviews([]); setAggCount(null); });
  }, [packageId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiSend<{ message: string }>("/api/reviews", "POST", { packageId, ...form });
      toast({ title: t("ulasan.success"), description: res.message });
      setOpen(false);
      setForm({ cardNo: "", rating: 5, hotelRate: 5, transportRate: 5, guideRate: 5, body: "" });
    } catch (err) {
      toast({ title: "Gagal mengirim ulasan", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const list = reviews ?? [];
  const avg = list.length ? list.reduce((a, r) => a + r.rating, 0) / list.length : 0;

  return (
    <div className="mt-12">
      <DetailSectionHead icon="message-circle" title={t("ulasan.title")} />

      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("ulasan.subtitle")}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Ringkasan */}
        <div className="rounded-2xl border bg-card p-5 text-center shadow-sm sm:self-start">
          <p className="text-4xl font-extrabold text-gold-deep tabular-nums">{avg.toFixed(1)}</p>
          <div className="mt-1.5 flex justify-center"><Stars value={Math.round(avg)} /></div>
          <p className="mt-1 text-xs text-muted-foreground">
            {avg.toFixed(1)} {t("ulasan.avg")} · {aggCount ?? list.length} {t("ulasan.count")}
          </p>
          {list.length > 0 && (
            <div className="mt-4 space-y-2 border-t pt-4 text-start">
              <AspectBar label={t("ulasan.aspectHotel")} value={Math.round(list.reduce((a, r) => a + r.hotelRate, 0) / list.length)} />
              <AspectBar label={t("ulasan.aspectTransport")} value={Math.round(list.reduce((a, r) => a + r.transportRate, 0) / list.length)} />
              <AspectBar label={t("ulasan.aspectGuide")} value={Math.round(list.reduce((a, r) => a + r.guideRate, 0) / list.length)} />
            </div>
          )}
          <Button onClick={() => setOpen(true)} className="mt-5 w-full bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="pencil" className="h-4 w-4" aria-hidden /> {t("ulasan.writeCta")}
          </Button>
        </div>

        {/* Daftar ulasan */}
        <div className="space-y-4">
          {!reviews ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : list.length === 0 ? (
            <div className="rounded-2xl border bg-muted/30 p-8 text-center">
              <Icon name="message-circle" className="mx-auto h-9 w-9 text-muted-foreground/50" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">{t("ulasan.empty")}</p>
            </div>
          ) : (
            list.map((r) => (
              <article key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-forest text-sm font-extrabold text-gold-soft" aria-hidden>
                      {r.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-bold">
                        {r.authorName}
                        <Badge variant="outline" className="bg-emerald-500/10 text-[9px] font-bold text-emerald-700 border-emerald-500/30 dark:text-emerald-400">
                          <Icon name="badge-check" className="h-2.5 w-2.5" aria-hidden /> {t("ulasan.verifiedBadge")}
                        </Badge>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">{r.body}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 text-[11px] text-muted-foreground">
                  <span>{t("ulasan.aspectHotel")} {r.hotelRate}/5</span>
                  <span>{t("ulasan.aspectTransport")} {r.transportRate}/5</span>
                  <span>{t("ulasan.aspectGuide")} {r.guideRate}/5</span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Dialog tulis ulasan */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <Icon name="pencil" className="h-5 w-5 text-primary" aria-hidden /> {t("ulasan.dialogTitle")}
            </DialogTitle>
            <DialogDescription className="text-left">{t("ulasan.dialogDesc")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("ulasan.cardNoLabel")} *</Label>
              <Input
                value={form.cardNo}
                onChange={(e) => setForm({ ...form, cardNo: e.target.value.toUpperCase() })}
                placeholder="MHD-JM-2026-0001"
                required
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">{t("ulasan.mustHaveCard")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                ["rating", t("ulasan.ratingLabel")],
                ["hotelRate", t("ulasan.aspectHotel")],
                ["transportRate", t("ulasan.aspectTransport")],
                ["guideRate", t("ulasan.aspectGuide")],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label>{label}</Label>
                  <select
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option key={v} value={v}>{v} ★</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label>{t("ulasan.bodyLabel")} *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                placeholder={t("ulasan.bodyPh")}
                required
                minLength={15}
                maxLength={1200}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={sending} className="bg-gradient-to-r from-primary to-forest text-white">
                {sending ? (
                  <><Icon name="loader-2" className="h-4 w-4 animate-spin" aria-hidden /> …</>
                ) : (
                  <><Icon name="send" className="h-4 w-4" aria-hidden /> {t("ulasan.submit")}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
