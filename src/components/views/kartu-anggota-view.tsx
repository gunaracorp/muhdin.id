"use client";

/**
 * v11 — KTA DIGITAL (Kartu Tanda Anggota Digital).
 * Benchmark Nusuk Card (KSA): kartu identitas digital ber-QR, tier,
 * poin loyalty, buku besar poin, papan peringkat, program referal.
 */
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT, formatDateL10n } from "@/lib/i18n";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface CardData {
  cardNo: string;
  tier: string;
  points: number;
  referralCode: string;
  status: string;
  issuedAt: string;
  verificationCount: number;
  member: {
    name: string; type: string; city: string; province: string;
    licenseNo: string; status: string; memberSince: number;
  };
}
interface LedgerRow {
  id: string; delta: number; reason: string; note: string | null; balanceAfter: number; createdAt: string;
}
interface LeaderRow {
  rank: number; cardNo: string; tier: string; points: number; memberName: string; memberType: string; province: string;
}

const TIER_STYLE: Record<string, string> = {
  KLASIK: "from-emerald-700 via-emerald-800 to-stone-900",
  VERIFIED: "from-teal-600 via-emerald-700 to-stone-900",
  PLATINUM: "from-stone-700 via-stone-800 to-black",
};
const REASON_ICON: Record<string, string> = {
  REGISTER: "sparkles", REFERRAL: "users", ACADEMY: "graduation-cap",
  BOOKING: "calendar-check", REDEEM: "gift", ADMIN: "settings",
};

export function KartuAnggotaView() {
  const { t, locale } = useT();
  const [cardNo, setCardNo] = useState("");
  const [data, setData] = useState<{ card: CardData; ledger: LedgerRow[] } | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);

  const load = useCallback(async (no: string) => {
    setState("loading");
    setError("");
    try {
      const res = await apiGet<{ card: CardData; ledger: LedgerRow[] }>(`/api/cards?no=${encodeURIComponent(no)}`);
      setData(res);
      setState("idle");
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "error");
      setState("error");
    }
  }, []);

  useEffect(() => {
    apiGet<{ leaderboard: LeaderRow[] }>("/api/cards?leaderboard=1")
      .then((r) => setLeaders(r.leaderboard))
      .catch(() => {});
  }, []);

  const nextTier =
    data?.card.tier === "KLASIK" ? { name: "VERIFIED", need: 300 } :
    data?.card.tier === "VERIFIED" ? { name: "PLATINUM", need: 800 } : null;
  const progress = data && nextTier ? Math.min(100, Math.round((data.card.points / nextTier.need) * 100)) : 100;

  return (
    <div className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_10%,rgba(212,175,55,0.18),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Reveal>
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/40 border">
              <Icon name="wallet-cards" className="h-3.5 w-3.5 me-1.5" />
              {t("mcard.heroBadge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t("mcard.title")}</h1>
            <p className="mt-3 max-w-2xl text-white/85 md:text-lg">{t("mcard.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      {/* LOOKUP + KARTU */}
      <section className="mx-auto max-w-6xl px-4 py-12 grid lg:grid-cols-2 gap-8 items-start">
        <Reveal className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="search" className="h-5 w-5 text-primary" /> {t("mcard.lookupTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("mcard.lookupDesc")}</p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (cardNo.trim()) load(cardNo.trim());
            }}
          >
            <Input
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value)}
              placeholder="KTA-2026-00001"
              className="font-mono"
              aria-label={t("mcard.lookupTitle")}
            />
            <Button type="submit" disabled={state === "loading"}>
              {state === "loading" ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="search" className="h-4 w-4" />}
              {t("mcard.lookupBtn")}
            </Button>
          </form>
          {state === "error" && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <Icon name="alert-circle" className="h-4 w-4" /> {error}
            </p>
          )}

          {/* Kartu digital */}
          {data && (
            <div className="space-y-4">
              <div className={cn("relative overflow-hidden rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br", TIER_STYLE[data.card.tier] || TIER_STYLE.KLASIK)}>
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-white/70">MUHDIN · KTA Digital</p>
                    <p className="mt-1 text-lg font-extrabold leading-tight">{data.card.member.name}</p>
                    <p className="text-xs text-white/80">{data.card.member.type} · {data.card.member.city}, {data.card.member.province}</p>
                  </div>
                  <Badge className="bg-white/15 text-white border-white/30 border uppercase tracking-wide">
                    <Icon name="shield-check" className="h-3 w-3 me-1" />{data.card.tier}
                  </Badge>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="font-mono text-sm tracking-wider text-white/95">{data.card.cardNo}</div>
                  <div className="rounded-lg bg-white p-1.5">
                    <QRCode value={`${typeof window !== "undefined" ? window.location.origin : ""}/verifikasi-kta/${data.card.cardNo}`} size={64} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/75">
                  <span>{t("mcard.issued")} {formatDateL10n(data.card.issuedAt, locale)}</span>
                  <span className="font-mono">{data.card.referralCode}</span>
                </div>
              </div>

              {/* Poin + progress tier */}
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2"><Icon name="coins" className="h-4 w-4 text-gold-deep" />{t("mcard.points")}</p>
                  <p className="text-2xl font-extrabold text-primary">{data.card.points.toLocaleString("id-ID")}</p>
                </div>
                {nextTier && (
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-gold transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t("mcard.nextTier", { tier: nextTier.name, need: String(Math.max(0, nextTier.need - data.card.points)) })}
                    </p>
                  </div>
                )}
              </div>

              {/* Buku besar poin */}
              <div className="rounded-xl border bg-card">
                <p className="border-b px-5 py-3 text-sm font-semibold">{t("mcard.ledgerTitle")}</p>
                <ul className="max-h-64 overflow-y-auto divide-y">
                  {data.ledger.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                      <Icon name={REASON_ICON[l.reason] || "circle"} className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{l.note || l.reason}</p>
                        <p className="text-xs text-muted-foreground">{formatDateL10n(l.createdAt, locale)}</p>
                      </div>
                      <span className={cn("font-mono font-bold", l.delta >= 0 ? "text-emerald-700" : "text-destructive")}>
                        {l.delta >= 0 ? "+" : ""}{l.delta}
                      </span>
                    </li>
                  ))}
                  {!data.ledger.length && <li className="px-5 py-6 text-sm text-muted-foreground">{t("mcard.empty")}</li>}
                </ul>
              </div>
            </div>
          )}
        </Reveal>

        {/* Cara kerja poin + referal */}
        <Reveal className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold flex items-center gap-2"><Icon name="coins" className="h-5 w-5 text-gold-deep" />{t("mcard.rulesTitle")}</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex gap-2.5">
                  <Icon name="check-circle-2" className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{t(`mcard.rule${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold flex items-center gap-2"><Icon name="users" className="h-5 w-5 text-primary" />{t("mcard.refTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("mcard.refDesc")}</p>
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl border bg-card">
            <p className="border-b px-5 py-3 text-sm font-semibold flex items-center gap-2">
              <Icon name="trophy" className="h-4 w-4 text-gold-deep" />{t("mboard.title")}
            </p>
            <ul className="divide-y">
              {leaders.map((l) => (
                <li key={l.cardNo} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    l.rank === 1 ? "bg-gold text-white" : l.rank === 2 ? "bg-stone-300 text-stone-800" : l.rank === 3 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground")}>
                    {l.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{l.memberName}</p>
                    <p className="text-xs text-muted-foreground">{l.memberType} · {l.province}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] me-1">{l.tier}</Badge>
                  <span className="font-mono font-bold text-primary">{l.points}</span>
                </li>
              ))}
              {!leaders.length && <li className="px-5 py-6 text-sm text-muted-foreground">{t("mcard.empty")}</li>}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* CTA verifikasi */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">{t("mcard.verifyCtaTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("mcard.verifyCtaDesc")}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("verifikasi")}>
            <Icon name="badge-check" className="h-4 w-4 me-2" />{t("mcard.verifyCta")}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default KartuAnggotaView;
