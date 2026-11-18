"use client";

/**
 * PushEnableCard — R-011 Web Push Pengumuman Keberangkatan (portal).
 *
 * Kartu ringkas di #/pesanan: jamaah menyalakan notifikasi keberangkatan
 * dengan satu tombol. Kartu disembunyikan bila peramban/server tidak
 * mendukung (graceful). Bila kartu jamaah sedang dilacak, langganan
 * otomatis terikat nomor kartu tersebut agar pengumuman bisa terarah.
 */
import { useEffect, useState } from "react";
import { Icon } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { pushAvailable, enablePush, notificationState } from "@/lib/push-client";

export function PushEnableCard({ cardNo }: { cardNo?: string | null }) {
  const { t } = useT();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [perm, setPerm] = useState<ReturnType<typeof notificationState>>("default");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void Promise.resolve()
      .then(() => {
        setPerm(notificationState());
        return pushAvailable();
      })
      .then((v) => setSupported(v));
  }, []);

  if (supported === null) return null;
  if (!supported) return null; // graceful: tanpa dukungan → kartu tak muncul

  const onEnable = async () => {
    setBusy(true);
    setMsg(null);
    const res = await enablePush(cardNo || undefined);
    setBusy(false);
    setPerm(notificationState());
    setMsg({ ok: res.ok, text: res.message });
  };

  const alreadyOn = perm === "granted";

  return (
    <div
      className={cn(
        "rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/[0.08] to-card p-5 shadow-sm",
        cardNo ? "mt-5" : ""
      )}
      data-testid="push-enable-card"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold-deep dark:text-gold">
          <Icon name="bell" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold leading-snug">
            {t("push.enable.title")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("push.enable.desc")}
            {cardNo ? ` ${t("push.enable.bound")} ${cardNo}.` : ""}
          </p>
          {!alreadyOn && (
            <Button
              onClick={onEnable}
              disabled={busy}
              size="sm"
              className="mt-3 bg-gold text-forest-deep font-bold hover:bg-gold/90"
              data-testid="push-enable-btn"
            >
              <Icon name="bell-ring" className="me-1.5 h-4 w-4" />
              {busy ? t("push.enable.busy") : t("push.enable.btn")}
            </Button>
          )}
          {alreadyOn && !msg && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Icon name="check-circle-2" className="h-4 w-4" />
              {t("push.enable.on")}
            </p>
          )}
          {msg && (
            <p
              className={cn(
                "mt-3 flex items-start gap-1.5 text-xs font-semibold",
                msg.ok ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"
              )}
              role="status"
            >
              <Icon name={msg.ok ? "check-circle-2" : "alert-triangle"} className="mt-0.5 h-4 w-4 shrink-0" />
              {msg.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
