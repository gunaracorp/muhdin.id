"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { BRAND } from "@/lib/constants";
import { BranchesSection } from "@/components/site/branches-section";
import type { Faq } from "@/lib/types";

/** Task 30 — setiap kartu kini BENAR-BENAR KLIKABLE: mailto, tel, Google Maps, dan kanal pengaduan #/lapor. */
const CONTACT_CARDS: {
  icon: string;
  value: string;
  titleKey: string;
  descKey: string;
  href: string;
  external?: boolean;
}[] = [
  {
    icon: "mail",
    value: "info@muhdin.web.id",
    titleKey: "contact.cardEmailTitle",
    descKey: "contact.cardEmailDesc",
    href: "mailto:info@muhdin.web.id",
  },
  {
    // Task 40 → 10 — WhatsApp resmi MUHDIN 0812 2234 5856 (salam pembuka terisi otomatis).
    icon: "message-circle",
    value: BRAND.whatsappDisplay,
    titleKey: "contact.cardPhoneTitle",
    descKey: "contact.cardPhoneDesc",
    href: `https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent(BRAND.waGreeting)}`,
    external: true,
  },
  {
    icon: "map-pin",
    value: "Kantor Jakarta — Cempaka Putih",
    titleKey: "contact.cardAddressTitle",
    descKey: "contact.cardAddressDesc",
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      "Jl. Cempaka Putih Tengah RT.9/RW.7, Cempaka Putih Timur, Jakarta Pusat 10510"
    )}`,
    external: true,
  },
  {
    icon: "shield-check",
    value: "Kanal Prioritas 24/7",
    titleKey: "contact.cardFraudTitle",
    descKey: "contact.cardFraudDesc",
    href: "#/lapor",
  },
];

export function ContactView() {
  const { t } = useT();
  return (
    <div className="flex flex-col">
      <section className="relative bg-forest-deep text-white overflow-hidden">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" />
              {t("contact.eyebrow")}
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("contact.title")}</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/80">{t("contact.subtitle")}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Contact cards — Task 30: seluruh kartu adalah tautan hidup */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {CONTACT_CARDS.map((c, i) => (
              <Reveal key={c.titleKey} delay={i * 0.06}>
                <a
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  aria-label={`${t(c.titleKey)}: ${c.value}`}
                  className="group block h-full rounded-2xl border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <Icon name={c.icon} className="h-5 w-5" />
                    </div>
                    <Icon
                      name="chevron-right"
                      className="h-4 w-4 text-muted-foreground/40 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all icon-flip"
                    />
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(c.titleKey)}</p>
                  <p className="mt-1 font-bold text-sm break-words text-primary group-hover:text-primary/80">{c.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(c.descKey)}</p>
                </a>
              </Reveal>
            ))}
          </div>

          {/* Audit 2026 — Kanal Resmi & Terverifikasi (tuntutan audit #2: data kontak resmi) */}
          <Reveal className="mb-12">
            <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/5 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <Icon name="badge-check" className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">{t("audit13.kontakv.title")}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t("audit13.kontakv.desc")}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["ch1", "ch2", "ch3", "ch4"].map((k) => (
                  <div key={k} className="flex items-start gap-2.5 rounded-xl border bg-card p-4 text-sm">
                    <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    <div>
                      <p className="font-extrabold">{t(`audit13.kontakv.${k}t`)}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{t(`audit13.kontakv.${k}d`)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-4 text-sm text-foreground/85">
                <p className="font-extrabold text-gold-deep dark:text-gold">{t("audit13.kontakv.badgeT")}</p>
                <p className="mt-1 leading-relaxed">{t("audit13.kontakv.badgeD")}</p>
              </div>
              <div className="mt-3 flex flex-col items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 sm:flex-row sm:items-center">
                <Icon name="alert-triangle" className="h-5 w-5 shrink-0 text-red-700 dark:text-red-400" aria-hidden />
                <p className="flex-1 text-sm leading-relaxed text-foreground/85">
                  <span className="font-extrabold">{t("audit13.kontakv.warnTitle")}: </span>
                  {t("audit13.kontakv.warnText")}
                </p>
                <Button variant="outline" onClick={() => navigate("lapor")} className="shrink-0 rounded-full font-bold">
                  <Icon name="megaphone" className="me-1.5 h-4 w-4" aria-hidden />
                  {t("audit13.kontakv.reportCta")}
                </Button>
              </div>
            </div>
          </Reveal>

          <Tabs defaultValue="pesan" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              {/* id/aria deterministik (Task 35-h addendum) — imun geser useId dev */}
              <TabsTrigger
                value="pesan"
                id="muhdin-contact-tab-pesan"
                aria-controls="muhdin-contact-panel-pesan"
                className="gap-2"
              >
                <Icon name="message-square" className="h-4 w-4" /> {t("contact.tabMessage")}
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                id="muhdin-contact-tab-faq"
                aria-controls="muhdin-contact-panel-faq"
                className="gap-2"
              >
                <Icon name="help-circle" className="h-4 w-4" /> {t("contact.tabFaq")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pesan" id="muhdin-contact-panel-pesan" aria-labelledby="muhdin-contact-tab-pesan">
              <MessageForm />
            </TabsContent>
            <TabsContent value="faq" id="muhdin-contact-panel-faq" aria-labelledby="muhdin-contact-tab-faq">
              <FaqSection />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Kantor cabang & jaringan daerah (DPD) — Task 19 */}
      <section className="py-14 bg-mint/30 dark:bg-muted/30">
        <BranchesSection />
      </section>
    </div>
  );
}

function MessageForm() {
  const { toast } = useToast();
  const { t } = useT();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiSend("/api/messages", "POST", form);
      toast({ title: t("contact.toastSuccessTitle"), description: t("contact.toastSuccessDesc") });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (e) {
      toast({ title: t("contact.toastFailTitle"), description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Reveal>
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <SectionHeading
          align="left"
          title={t("contact.formTitle")}
          subtitle={t("contact.formSubtitle")}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">{t("contact.labelName")}</Label>
            <Input id="c-name" value={form.name} onChange={set("name")} placeholder={t("contact.namePlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">{t("contact.labelEmail")}</Label>
            <Input id="c-email" type="email" value={form.email} onChange={set("email")} placeholder={t("contact.emailPlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">{t("contact.labelPhone")}</Label>
            <Input id="c-phone" value={form.phone} onChange={set("phone")} placeholder={t("contact.phonePlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-subject">{t("contact.labelSubject")}</Label>
            <Input id="c-subject" value={form.subject} onChange={set("subject")} placeholder={t("contact.subjectPlaceholder")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="c-message">{t("contact.labelMessage")}</Label>
            <Textarea id="c-message" value={form.message} onChange={set("message")} rows={5} placeholder={t("contact.messagePlaceholder")} />
          </div>
        </div>
        <Button
          onClick={submit}
          disabled={loading}
          className="mt-6 w-full sm:w-auto h-11 px-8 bg-gradient-to-r from-primary to-forest text-white"
        >
          {loading ? <Icon name="loader-2" className="h-4 w-4 me-2 animate-spin" /> : <Icon name="send" className="h-4 w-4 me-2" />}
          {t("contact.btnSend")}
        </Button>
      </div>
    </Reveal>
  );
}

function FaqSection() {
  const { t, locale } = useT();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);

  useEffect(() => {
    apiGet<Faq[]>(`/api/faqs?locale=${locale}`).then(setFaqs).catch(() => setFaqs([]));
  }, [locale]);

  if (!faqs)
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );

  if (faqs.length === 0)
    return <div className="py-12 text-center text-sm text-muted-foreground">{t("contact.faqEmpty")}</div>;

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <Reveal key={f.id} delay={Math.min(i * 0.04, 0.3)}>
            <AccordionItem value={f.id} className="rounded-xl border bg-card px-5 shadow-sm">
              <AccordionTrigger className="text-sm font-bold text-start hover:text-primary hover:no-underline">
                <span className="flex items-center gap-2.5">
                  <Icon name="help-circle" className="h-4 w-4 text-primary shrink-0" />
                  {f.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {f.answer}
              </AccordionContent>
            </AccordionItem>
          </Reveal>
        ))}
      </Accordion>
      {/* v4.1 — pusat bantuan lengkap di halaman sendiri */}
      <button
        type="button"
        onClick={() => (window.location.hash = "#/faq")}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/15"
      >
        {t("detail.faq.title")}
        <Icon name="chevron-right" className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
    </div>
  );
}
