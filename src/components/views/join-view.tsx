"use client";

import { useState } from "react";
import { apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { PromoSlotLine, dispatchPromoRefresh } from "@/components/site/slot-counter"; // Task 44 — kuota live
import { QueueSuccessCard } from "@/components/site/live-slot-board"; // Task 53 — nomor urut realtime
import { MEMBER_TYPES, PARTNERS } from "@/lib/constants";

const PROCESS_STEPS = [
  { icon: "file-text", titleKey: "join.step1Title", descKey: "join.step1Desc" },
  { icon: "shield-check", titleKey: "join.step2Title", descKey: "join.step2Desc" },
  { icon: "handshake", titleKey: "join.step3Title", descKey: "join.step3Desc" },
  { icon: "sparkles", titleKey: "join.step4Title", descKey: "join.step4Desc" },
];

const MEMBER_TYPE_KEY: Record<string, string> = {
  PPIU: "join.typePPIU",
  PIHK: "join.typePIHK",
  KBIHU: "join.typeKBIHU",
  IPHI: "join.typeIPHI",
  TRAVEL_WISATA: "join.typeTravelWisata",
};

const PARTNER_FULL_KEY: Record<string, string> = {
  PPIU: "join.partnerFullPPIU",
  PIHK: "join.partnerFullPIHK",
  KBIHU: "join.partnerFullKBIHU",
  IPHI: "join.partnerFullIPHI",
  TW: "join.partnerFullTW",
};

const BENEFITS = [
  { icon: "git-merge", key: "join.benefit1" },
  { icon: "smartphone", key: "join.benefit2" },
  { icon: "badge-check", key: "join.benefit3" },
  { icon: "users", key: "join.benefit4" },
  { icon: "graduation-cap", key: "join.benefit5" },
  { icon: "wallet", key: "join.benefit6" },
];

export function JoinView() {
  const { toast } = useToast();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState(false);
  const [queue, setQueue] = useState<number | null>(null); // Task 53 — nomor urut realtime
  const [form, setForm] = useState({
    orgName: "",
    type: "PPIU",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    province: "",
    licenseNo: "",
    message: "",
  });
  // R-078 UU PDP — persetujuan pemrosesan data pribadi wajib.
  const [pdpConsent, setPdpConsent] = useState(false);

  const submit = async () => {
    if (!pdpConsent) {
      toast({ title: t("join.toastFailTitle"), description: t("join.pdpConsent"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiSend<{ ticketCode?: string; queueNumber?: number | null }>(
        "/api/applications",
        "POST",
        { ...form, pdpConsent }
      );
      if (res?.ticketCode) {
        // Task 18-c: respons kini memuat kode tiket — tampilkan kartu sukses.
        setTicket(res.ticketCode);
        setCopied(false);
        setCopyFail(false);
      }
      // Task 53 — simpan nomor urut realtime & tandai slot di papan.
      if (typeof res?.queueNumber === "number" && res.queueNumber > 0) {
        setQueue(res.queueNumber);
        try {
          localStorage.setItem("muhdin-queue-number", String(res.queueNumber));
        } catch {
          /* penyimpanan lokal tidak tersedia */
        }
        window.dispatchEvent(
          new CustomEvent<number | null>("muhdin:queue-set", { detail: res.queueNumber })
        );
      }
      dispatchPromoRefresh(); // Task 52 — perbarui counter pendaftar gratis di seluruh situs seketika
      toast({
        title: t("join.toastSuccessTitle"),
        description: t("join.toastSuccessDesc"),
      });
      setForm({ orgName: "", type: "PPIU", contactName: "", email: "", phone: "", city: "", province: "", licenseNo: "", message: "" });
    } catch (e) {
      toast({ title: t("join.toastFailTitle"), description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyTicket = async () => {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket);
      setCopied(true);
      setCopyFail(false);
    } catch {
      setCopied(false);
      setCopyFail(true);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-col">
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("join.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("join.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("join.subtitle")}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-gold-soft">
              <Icon name="check-circle-2" className="h-4 w-4" aria-hidden />
              {t("join.freeBadge")}
            </p>
            {/* Task 52 — penghitung pendaftar gratis live di header formulir */}
            <PromoSlotLine dark className="mt-3 justify-start" />
          </Reveal>
        </div>
      </section>

      {/* Manfaat & proses */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-14">
            {PROCESS_STEPS.map((s, i) => (
              <Reveal key={s.titleKey} delay={i * 0.07}>
                <div className="relative h-full rounded-2xl border bg-card p-5 shadow-sm overflow-hidden">
                  <span aria-hidden className="absolute -right-2 -top-3 text-6xl font-extrabold text-primary/5 select-none">{i + 1}</span>
                  <div className="h-10 w-10 rounded-xl bg-gold/15 grid place-items-center text-gold-deep">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-bold text-sm">{t(s.titleKey)}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t(s.descKey)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Manfaat keanggotaan */}
            <Reveal className="lg:col-span-2">
              <div className="rounded-3xl bg-gradient-to-br from-forest to-forest-deep p-8 text-white h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-islamic-pattern-gold opacity-30" />
                <div className="relative">
                  <h2 className="text-2xl font-extrabold">{t("join.benefitsTitle")}</h2>
                  <div className="gold-divider w-24 mt-3" />
                  <ul className="mt-6 space-y-4">
                    {BENEFITS.map((b) => (
                      <li key={b.key} className="flex gap-3 text-sm text-emerald-50/90">
                        <span className="shrink-0 h-8 w-8 rounded-lg bg-gold/20 grid place-items-center text-gold">
                          <Icon name={b.icon} className="h-4 w-4" />
                        </span>
                        {t(b.key)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-8 text-xs text-emerald-100/90 leading-relaxed">{t("join.duesNote")}</p>
                </div>
              </div>
            </Reveal>

            {/* Form */}
            <Reveal delay={0.1} className="lg:col-span-3">
              {/* Kartu sukses + kode tiket — Task 18-c */}
              {ticket && (
                <div className="mb-6 rounded-3xl border border-primary/30 bg-card p-6 sm:p-8 shadow-md" role="status">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
                      <Icon name="check-circle-2" className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-lg text-primary">{t("join.ticketTitle")}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{t("join.ticketDesc")}</p>
                    </div>
                  </div>
                  {/* Task 53 — nomor urut realtime + konfeti */}
                  <QueueSuccessCard queueNumber={queue} />
                  <div className="mt-5 rounded-2xl border bg-muted/40 p-5 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("join.ticketLabel")}
                    </p>
                    <p
                      className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-primary select-all break-all"
                      dir="ltr"
                    >
                      {ticket}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                      <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
                      {t("join.ticketSave")}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={copyTicket}
                      aria-label={t("join.ticketCopyAria")}
                      className="flex-1"
                    >
                      <Icon name={copied ? "check-circle-2" : "file-text"} className="h-4 w-4 me-1.5" />
                      {copied ? t("join.ticketCopied") : t("join.ticketCopy")}
                    </Button>
                    <Button
                      onClick={() => navigate("lacak")}
                      aria-label={t("join.ticketTrackAria")}
                      className="flex-1 bg-gradient-to-r from-primary to-forest text-white shadow-md hover:shadow-lg"
                    >
                      <Icon name="search" className="h-4 w-4 me-1.5" />
                      {t("join.ticketTrack")}
                    </Button>
                  </div>
                  {copyFail && (
                    <p role="alert" className="mt-2 text-xs font-semibold text-destructive text-center">
                      {t("join.ticketCopyFail")}
                    </p>
                  )}
                </div>
              )}
              <div className="rounded-3xl border bg-card p-6 sm:p-8 shadow-sm">
                <SectionHeading
                  align="left"
                  title={t("join.formTitle")}
                  subtitle={t("join.formSubtitle")}
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="j-license">{t("join.labelLicense")}</Label>
                    <Input id="j-license" value={form.licenseNo} onChange={set("licenseNo")} placeholder={t("join.licensePlaceholder")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="j-org">{t("join.labelOrg")}</Label>
                    <Input id="j-org" value={form.orgName} onChange={set("orgName")} placeholder={t("join.orgPlaceholder")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-type">{t("join.labelType")}</Label>
                    <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                      <SelectTrigger id="j-type" aria-label={t("join.labelType")}>
                        <SelectValue placeholder={t("join.typePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_TYPES.map((mt) => (
                          <SelectItem key={mt} value={mt}>
                            {t(MEMBER_TYPE_KEY[mt] ?? "") || mt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-contact">{t("join.labelContact")}</Label>
                    <Input id="j-contact" value={form.contactName} onChange={set("contactName")} placeholder={t("join.contactPlaceholder")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-email">{t("join.labelEmail")}</Label>
                    <Input id="j-email" type="email" value={form.email} onChange={set("email")} placeholder={t("join.emailPlaceholder")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-phone">{t("join.labelPhone")}</Label>
                    <Input id="j-phone" value={form.phone} onChange={set("phone")} placeholder={t("join.phonePlaceholder")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-city">{t("join.labelCity")}</Label>
                    <Input id="j-city" value={form.city} onChange={set("city")} placeholder={t("join.cityPlaceholder")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="j-province">{t("join.labelProvince")}</Label>
                    <Input id="j-province" value={form.province} onChange={set("province")} placeholder={t("join.provincePlaceholder")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="j-profile">{t("join.labelProfile")}</Label>
                    <Textarea
                      id="j-profile"
                      value={form.message}
                      onChange={set("message")}
                      rows={4}
                      placeholder={t("join.profilePlaceholder")}
                    />
                  </div>
                </div>
                {/* R-078 UU PDP — persetujuan pemrosesan data (wajib) */}
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={pdpConsent}
                    onChange={(e) => setPdpConsent(e.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-emerald-700"
                    required
                  />
                  <span className="text-foreground/85">{t("join.pdpConsent")}</span>
                </label>
                <Button
                  onClick={submit}
                  disabled={loading}
                  className="mt-6 w-full h-12 text-base bg-gradient-to-r from-primary to-forest text-white shadow-lg hover:shadow-xl"
                >
                  {loading ? <Icon name="loader-2" className="h-4 w-4 me-2 animate-spin" /> : <Icon name="send" className="h-4 w-4 me-2" />}
                  {t("join.btnSubmit")}
                </Button>
                <p className="mt-3 text-[11px] text-muted-foreground text-center">{t("join.disclaimer")}</p>
              </div>
            </Reveal>
          </div>

          {/* Jenis mitra ringkas */}
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PARTNERS.map((p, i) => (
              <Reveal key={p.code} delay={i * 0.05}>
                <div className="rounded-xl border bg-muted/30 p-4 text-center h-full">
                  <Icon name={p.icon} className="h-6 w-6 mx-auto text-primary" />
                  <p className="mt-2 text-sm font-extrabold text-primary">
                    {p.code === "TW" ? t("join.partnerNameTW") : p.name}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                    {PARTNER_FULL_KEY[p.code] ? t(PARTNER_FULL_KEY[p.code]) : p.fullName}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
