"use client";

/**
 * v11 — BENEFIT MITRA (katalog keuntungan anggota, tebus dengan poin KTA).
 * Benchmark Nusuk: paket/hotel/layanan partner — di MUHDIN diberikan
 * oleh anggota ekosistem (hotel, transportasi, klinik, pendidikan).
 */
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Benefit {
  id: string; title: string; partnerName: string; category: string; description: string;
  discountText: string; pointsCost: number; quota: number | null; claimed: number;
  icon: string; color: string;
  member?: { name: string; type: string; province: string } | null;
  _count?: { redemptions: number };
}

const CATS = ["ALL", "HOTEL", "TRANSPORT", "VAKSIN", "UMRAH_PAKET", "EDUKASI", "LAINNYA"] as const;
const CAT_ICON: Record<string, string> = {
  HOTEL: "hotel", TRANSPORT: "bus", VAKSIN: "syringe",
  UMRAH_PAKET: "plane", EDUKASI: "graduation-cap", LAINNYA: "gift",
};

export function BenefitView() {
  const { t } = useT();
  const [rows, setRows] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("ALL");
  const [active, setActive] = useState<Benefit | null>(null);
  const [cardNo, setCardNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; pointsLeft: number } | null>(null);

  useEffect(() => {
    apiGet<{ rows: Benefit[] }>("/api/benefits")
      .then((r) => setRows(r.rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => (cat === "ALL" ? rows : rows.filter((b) => b.category === cat)), [rows, cat]);

  async function redeem() {
    if (!active) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiSend<{ redemption: { code: string }; pointsLeft: number }>(
        "/api/benefits/redeem", "POST", { cardNo: cardNo.trim(), benefitId: active.id }
      );
      setDone({ code: res.redemption.code, pointsLeft: res.pointsLeft });
      setActive(null);
      setCardNo("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_30%_20%,rgba(212,175,55,0.16),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal>
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/40 border">
              <Icon name="gift" className="h-3.5 w-3.5 me-1.5" />{t("benef.heroBadge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t("benef.title")}</h1>
            <p className="mt-3 max-w-2xl text-white/85 md:text-lg">{t("benef.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                cat === c ? "border-primary bg-primary text-white" : "bg-card hover:bg-muted")}
            >
              {c === "ALL" ? t("benef.all") : t(`benef.cat.${c}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center py-20"><Icon name="loader-circle" className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((b, i) => (
              <Reveal key={b.id} delay={i * 50}>
                <div className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                      <Icon name={b.icon || CAT_ICON[b.category] || "gift"} className="h-5 w-5" />
                    </span>
                    {b.pointsCost > 0 ? (
                      <Badge className="bg-gold/15 text-gold-deep border-gold/40 border text-[11px]">
                        <Icon name="coins" className="h-3 w-3 me-1" />{b.pointsCost} {t("benef.pts")}
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/10 text-primary border-primary/30 border text-[11px]">{t("benef.free")}</Badge>
                    )}
                  </div>
                  {b.discountText && <p className="mt-3 text-sm font-extrabold text-primary">{b.discountText}</p>}
                  <h3 className="mt-1 font-bold leading-snug">{b.title}</h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{b.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="store" className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t("benef.partner")}: {b.partnerName}</span>
                  </div>
                  {b.quota !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("benef.quotaLeft", { left: String(Math.max(0, b.quota - b.claimed)), total: String(b.quota) })}
                    </p>
                  )}
                  <Button className="mt-4 w-full" onClick={() => { setActive(b); setError(""); }}>
                    <Icon name="ticket-check" className="h-4 w-4 me-2" />{t("benef.cta")}
                  </Button>
                </div>
              </Reveal>
            ))}
            {!shown.length && (
              <div className="col-span-full rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
                <Icon name="gift" className="mx-auto mb-2 h-8 w-8 opacity-40" />{t("benef.empty")}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dialog tebus */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
            <DialogDescription>{active?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {active && active.pointsCost > 0 && (
              <p className="rounded-lg bg-gold/10 border border-gold/30 px-3 py-2 text-sm text-gold-deep flex items-center gap-2">
                <Icon name="coins" className="h-4 w-4 shrink-0" />
                {t("benef.costNote", { cost: String(active.pointsCost) })}
              </p>
            )}
            <Input
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value)}
              placeholder="KTA-2026-00001"
              className="font-mono"
              aria-label="KTA"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy || !cardNo.trim()} onClick={redeem}>
              {busy ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="ticket-check" className="h-4 w-4 me-2" />}
              {t("benef.confirm")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("benef.noCard")}{" "}
              <button className="underline text-primary" onClick={() => { setActive(null); navigate("kartu-anggota"); }}>
                {t("benef.getCard")}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog sukses */}
      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-sm text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon name="party-popper" className="h-7 w-7" />
          </span>
          <h3 className="font-bold">{t("benef.success")}</h3>
          <p className="text-sm text-muted-foreground">{t("benef.successDesc")}</p>
          {done && (
            <>
              <p className="font-mono text-lg font-extrabold tracking-wider text-primary">{done.code}</p>
              <p className="text-xs text-muted-foreground">{t("benef.pointsLeft", { left: String(done.pointsLeft) })}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BenefitView;
