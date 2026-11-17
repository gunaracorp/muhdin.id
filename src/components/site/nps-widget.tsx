"use client";

/**
 * nps-widget.tsx — v13.1 — R-092 «Survei NPS Pasca-Perjalanan».
 * Widget ringkas 0-10 (promoter 9-10 / passive 7-8 / detractor 0-6) yang
 * mengirim ke POST /api/nps; skor langsung tampil di Dashboard Omzet CMS.
 */
import { useState } from "react";
import { apiSend } from "@/lib/client-api";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function NpsWidget({ cardNo, source = "TRACKING" }: { cardNo?: string; source?: string }) {
  const { t } = useT();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const send = async () => {
    if (score === null) return;
    setSending(true);
    try {
      await apiSend("/api/nps", "POST", { score, comment, cardNo, source });
      setDone(true);
    } catch {
      /* diam — widget opsional */
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5">
        <Icon name="badge-check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <div>
          <p className="text-sm font-extrabold">{t("nps.saved")} — {t("nps.thanks")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="text-base font-extrabold">{t("nps.title")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("nps.subtitle")}</p>
      <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("nps.title")}>
        {Array.from({ length: 11 }).map((_, n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            onClick={() => setScore(n)}
            className={cn(
              "h-10 w-10 rounded-xl border text-sm font-extrabold tabular-nums transition-all",
              score === n
                ? n >= 9
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-md"
                  : n >= 7
                    ? "border-amber-500 bg-amber-500 text-white shadow-md"
                    : "border-red-500 bg-red-500 text-white shadow-md"
                : "bg-muted/40 hover:border-primary hover:bg-primary/10"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-muted-foreground">
        <span>{t("nps.lowLabel")}</span>
        <span>{t("nps.highLabel")}</span>
      </div>
      {score !== null && (
        <>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("nps.comment")}
            rows={2}
            maxLength={500}
            className="mt-3"
          />
          <Button onClick={send} disabled={sending} className="mt-3 bg-gradient-to-r from-primary to-forest text-white">
            <Icon name="send" className="h-4 w-4" aria-hidden /> {t("nps.send")}
          </Button>
        </>
      )}
    </div>
  );
}
