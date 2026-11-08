"use client";

/**
 * v11 — Verifikasi publik KTA Digital (target QR kartu: /verifikasi-kta/<no>).
 * Pola PassportVerifyView: auto-verifikasi saat kode hadir, form manual bila tidak.
 */
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT, formatDateL10n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface VerifyResult {
  cardNo: string;
  tier: string;
  status: string;
  issuedAt: string;
  member: {
    name: string; type: string; city: string; province: string;
    licenseNo: string; status: string; memberSince: number;
  };
}

export function KtaVerifyView({ code }: { code?: string }) {
  const { t, locale } = useT();
  const [input, setInput] = useState(code || "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "notfound" | "error">(code ? "loading" : "idle");
  const [message, setMessage] = useState("");

  const run = async (no: string) => {
    setState("loading");
    setMessage("");
    try {
      const res = await apiGet<VerifyResult>(`/api/cards/verify?no=${encodeURIComponent(no)}`);
      setResult(res);
      setState("idle");
    } catch (e) {
      setResult(null);
      setMessage(e instanceof Error ? e.message : "error");
      setState("notfound");
    }
  };

  useEffect(() => {
    if (!code) return;
    let alive = true;
    apiGet<VerifyResult>(`/api/cards/verify?no=${encodeURIComponent(code)}`)
      .then((res) => {
        if (!alive) return;
        setResult(res);
        setState("idle");
      })
      .catch((e) => {
        if (!alive) return;
        setResult(null);
        setMessage(e instanceof Error ? e.message : "error");
        setState("notfound");
      });
    return () => {
      alive = false;
    };
  }, [code]);

  return (
    <div className="flex-1">
      <section className="bg-forest py-14 text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Badge className="mb-3 bg-gold/20 text-gold border-gold/40 border">
            <Icon name="shield-check" className="h-3.5 w-3.5 me-1.5" />{t("ktav.badge")}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold">{t("ktav.title")}</h1>
          <p className="mt-2 text-white/80 text-sm">{t("ktav.subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-10">
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) run(input.trim()); }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="KTA-2026-00001" className="font-mono" />
          <Button type="submit" disabled={state === "loading"}>
            {state === "loading" ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="search" className="h-4 w-4" />}
            {t("ktav.check")}
          </Button>
        </form>

        {state === "notfound" && (
          <p className="mt-4 text-sm text-destructive flex items-center gap-1.5">
            <Icon name="alert-circle" className="h-4 w-4" />{message || t("ktav.notFound")}
          </p>
        )}

        {result && (
          <Reveal className="mt-8">
            <div className={cn("rounded-2xl border-2 p-6", result.status === "ACTIVE" ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t("ktav.cardNo")}</p>
                  <p className="font-mono text-lg font-extrabold">{result.cardNo}</p>
                </div>
                <Badge variant="outline" className={result.status === "ACTIVE" ? "bg-primary/10 text-primary border-primary/30" : "bg-destructive/10 text-destructive border-destructive/30"}>
                  <Icon name={result.status === "ACTIVE" ? "badge-check" : "ban"} className="h-3 w-3 me-1" />
                  {result.status === "ACTIVE" ? t("ktav.valid") : t("ktav.suspended")}
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div><p className="text-muted-foreground text-xs">{t("ktav.member")}</p><p className="font-semibold">{result.member.name}</p></div>
                <div><p className="text-muted-foreground text-xs">{t("ktav.type")}</p><p className="font-semibold">{result.member.type}</p></div>
                <div><p className="text-muted-foreground text-xs">{t("ktav.region")}</p><p className="font-semibold">{result.member.city}, {result.member.province}</p></div>
                <div><p className="text-muted-foreground text-xs">{t("ktav.tier")}</p><p className="font-semibold">{result.tier}</p></div>
                <div><p className="text-muted-foreground text-xs">{t("ktav.license")}</p><p className="font-mono text-xs font-semibold">{result.member.licenseNo}</p></div>
                <div><p className="text-muted-foreground text-xs">{t("ktav.issued")}</p><p className="font-semibold">{formatDateL10n(result.issuedAt, locale)}</p></div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("ktav.disclaimer")}</p>
          </Reveal>
        )}

        <div className="mt-10 text-center">
          <Button variant="ghost" onClick={() => navigate("kartu-anggota")}>
            <Icon name="wallet-cards" className="h-4 w-4 me-2" />{t("ktav.back")}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default KtaVerifyView;
