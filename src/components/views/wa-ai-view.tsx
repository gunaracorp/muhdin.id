"use client";

/**
 * WaAiView (v5 Fase 2) — halaman publik #/whatsapp-ai.
 *
 * Dua fungsi:
 *  1. DEMO HIDUP: panel chat gaya WhatsApp yang memanggil /api/whatsapp/bot —
 *    otak yang SAMA dengan webhook bot asli, sehingga pengunjung merasakan
 *    persis seperti mengobrol dengan bot WhatsApp sungguhan.
 *  2. PANDUAN: 3 langkah menghubungkan bot ke gateway WhatsApp asli
 *    (Fonnte/Wablas/Cloud API) via CMS → Pengaturan WhatsApp.
 *
 * Desain hijau-emas klasik memakai DetailShell (konsisten v4.1),
 * trilingual + RTL-aware, aksesibilitas penuh.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { DetailHero, DetailSectionHead } from "@/components/views/detail-shell";

type Msg = { role: "user" | "assistant"; content: string };

export function WaAiView() {
  const { t, locale, dir } = useT();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sapaan pembuka (tergantung locale → seed ulang saat locale berganti).
  useEffect(() => {
    setMsgs([{ role: "assistant", content: t("waai.chat.welcome") }]);
  }, [locale, t]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const withUser: Msg[] = [...msgs, { role: "user", content: question }];
      setMsgs(withUser);
      setInput("");
      setBusy(true);

      try {
        const res = await fetch("/api/whatsapp/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            locale,
            history: withUser.slice(1, -1).slice(-6), // tanpa welcome, tanpa pesan terakhir
          }),
        });
        const data = await res.json().catch(() => ({}));
        const reply = res.ok ? String(data?.reply ?? "") : String(data?.error ?? "");
        setMsgs((prev) => [
          ...prev,
          { role: "assistant", content: reply || t("waai.chat.error") },
        ]);
      } catch {
        setMsgs((prev) => [...prev, { role: "assistant", content: t("waai.chat.error") }]);
      } finally {
        setBusy(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [busy, msgs, locale, t]
  );

  const chips = t("waai.chat.chips") as unknown as string[];
  const waHref = `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(BRAND.waGreeting)}`;

  return (
    <>
      <DetailHero
        eyebrow={t("waai.hero.eyebrow")}
        title={t("waai.hero.title")}
        subtitle={t("waai.hero.subtitle")}
        backTo="/beranda"
        backLabel={t("common.backHome")}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
            <Icon name="sparkles" className="h-3.5 w-3.5" aria-hidden />
            {t("waai.hero.badge")}
          </span>
        }
      />

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
            {/* ===== Panel chat gaya WhatsApp ===== */}
            <Reveal>
              <div
                dir={dir}
                className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border-4 border-forest/90 bg-forest shadow-[0_32px_80px_-24px_oklch(0.3_0.08_160/0.6)]"
              >
                {/* Header gaya WA */}
                <div className="flex items-center gap-3 bg-forest-deep px-4 py-3 text-white">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-deep to-primary text-white ring-2 ring-gold/50">
                    <Icon name="message-circle" className="h-5 w-5" aria-hidden />
                    <span className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-forest-deep bg-emerald-400" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">{t("waai.chat.title")}</p>
                    <p className="truncate text-[11px] text-white/75">
                      {busy ? t("waai.chat.thinking") : t("waai.chat.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Area pesan */}
                <div
                  ref={scrollRef}
                  className="h-[26rem] space-y-2.5 overflow-y-auto bg-muted/60 px-3 py-4"
                  role="log"
                  aria-live="polite"
                >
                  {msgs.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm",
                          m.role === "user"
                            ? "rounded-se-md bg-gradient-to-br from-primary to-forest text-white"
                            : "rounded-ss-md border border-border bg-background text-foreground"
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-ss-md border border-border bg-background px-4 py-2.5">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                            style={{ animationDelay: `${d * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chips saran */}
                <div className="flex flex-wrap gap-1.5 border-t border-border/60 bg-background px-3 pt-2.5">
                  {(Array.isArray(chips) ? chips : []).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      disabled={busy}
                      className="rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[10px] font-medium text-primary transition hover:bg-primary/15 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form
                  className="flex items-center gap-2 bg-background px-3 py-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(input);
                  }}
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("waai.chat.placeholder")}
                    aria-label={t("waai.chat.inputAria")}
                    maxLength={1000}
                    disabled={busy}
                    className="h-10 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    aria-label={t("waai.chat.sendAria")}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-forest text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
                  >
                    <Icon name="send" className={cn("h-4 w-4", dir === "rtl" && "-scale-x-100")} aria-hidden />
                  </button>
                </form>

                <p className="bg-muted/50 px-3 py-2 text-center text-[10px] leading-snug text-muted-foreground">
                  {t("waai.chat.disclaimer")}
                </p>
              </div>
            </Reveal>

            {/* ===== Panduan & fitur ===== */}
            <div className="space-y-8">
              <Reveal>
                <DetailSectionHead icon="list-checks" title={t("waai.steps.title")} />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(["s1", "s2", "s3"] as const).map((s) => (
                    <div
                      key={s}
                      className="rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-gold/50 hover:shadow-md"
                    >
                      <p className="text-sm font-extrabold text-forest">{t(`waai.steps.${s}t`)}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {t(`waai.steps.${s}d`)}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal>
                <DetailSectionHead icon="sparkles" title={t("waai.features.title")} />
                <ul className="mt-4 space-y-2.5">
                  {(["f1", "f2", "f3", "f4"] as const).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon name="check" className="h-3 w-3" aria-hidden />
                      </span>
                      <span className="text-foreground/90">{t(`waai.features.${f}`)}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal>
                <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest via-primary to-forest p-6 text-white shadow-[0_24px_60px_-20px_oklch(0.4_0.1_160/0.6)] sm:p-8">
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                      <Icon name="message-circle" className="h-6 w-6" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-extrabold">{t("waai.cta.title")}</p>
                      <p className="mt-0.5 text-sm text-white/85">{t("waai.cta.desc")}</p>
                    </div>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-extrabold text-forest shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    >
                      <Icon name="message-circle" className="h-4 w-4" aria-hidden />
                      {t("waai.cta.btn")}
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
