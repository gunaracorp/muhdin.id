"use client";

/**
 * v11 — Verifikasi publik sertifikat digital (target QR: /verifikasi-sertifikat/<code>).
 * Menampilkan nama pemegang, kursus, skor, tanggal terbit + counter verifikasi.
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

interface CertResult {
  code: string;
  holderName: string;
  courseSlug: string;
  courseTitle: string | Record<string, string>;
  score: number;
  issuedAt: string;
  verificationCount: number;
}

export function CertificateVerifyView({ code }: { code?: string }) {
  const { t, locale } = useT();
  const [input, setInput] = useState(code || "");
  const [result, setResult] = useState<CertResult | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "notfound">(code ? "loading" : "idle");
  const [message, setMessage] = useState("");

  const run = async (c: string) => {
    setState("loading");
    setMessage("");
    try {
      const res = await apiGet<CertResult>(`/api/certificates/verify?code=${encodeURIComponent(c)}`);
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
    apiGet<CertResult>(`/api/certificates/verify?code=${encodeURIComponent(code)}`)
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

  const titleText =
    typeof result?.courseTitle === "string"
      ? result.courseTitle
      : result?.courseTitle?.[locale] || result?.courseTitle?.id || result?.courseSlug;

  return (
    <div className="flex-1">
      <section className="bg-forest py-14 text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Badge className="mb-3 bg-gold/20 text-gold border-gold/40 border">
            <Icon name="award" className="h-3.5 w-3.5 me-1.5" />{t("certv.badge")}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold">{t("certv.title")}</h1>
          <p className="mt-2 text-white/80 text-sm">{t("certv.subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-10">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (input.trim()) run(input.trim()); }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="SERT-2026-00000001" className="font-mono" />
          <Button type="submit" disabled={state === "loading"}>
            {state === "loading" ? <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> : <Icon name="search" className="h-4 w-4" />}
            {t("certv.check")}
          </Button>
        </form>

        {state === "notfound" && (
          <p className="mt-4 text-sm text-destructive flex items-center gap-1.5">
            <Icon name="alert-circle" className="h-4 w-4" />{message || t("certv.notFound")}
          </p>
        )}

        {result && (
          <Reveal className="mt-8">
            <div className="relative overflow-hidden rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-card to-muted p-8 text-center">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/10 blur-2xl" />
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold-deep">
                <Icon name="award" className="h-7 w-7" />
              </span>
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">{t("certv.issuer")}</p>
              <h2 className="mt-1 text-xl font-extrabold">{result.holderName}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("certv.completed")}</p>
              <p className="font-bold text-primary">{titleText}</p>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div><p className="text-xs text-muted-foreground">{t("certv.score")}</p><p className="text-lg font-extrabold text-primary">{result.score}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("certv.issued")}</p><p className="font-semibold">{formatDateL10n(result.issuedAt, locale)}</p></div>
                <div><p className="text-xs text-muted-foreground">{t("certv.checks")}</p><p className="font-semibold">{result.verificationCount}×</p></div>
              </div>
              <p className="mt-5 font-mono text-xs text-muted-foreground">{result.code}</p>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("certv.disclaimer")}</p>
          </Reveal>
        )}

        <div className="mt-10 text-center">
          <Button variant="ghost" onClick={() => navigate("academy")}>
            <Icon name="graduation-cap" className="h-4 w-4 me-2" />{t("certv.back")}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default CertificateVerifyView;
