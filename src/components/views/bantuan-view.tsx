"use client";

/**
 * Task 19 (R-095) — Help Center (Pusat Bantuan) route #/bantuan.
 *
 * FAQ dinamis naik kelas jadi help center: pencarian terpadu yang langsung
 * menyaring FAQ (dari /api/faqs) DAN menyarankan kategori belajar + tautan
 * layanan cepat, lalu CTA kontak. Route #/faq tetap hidup untuk semua FAQ.
 */
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import { navigate } from "@/hooks/use-hash-route";
import { Icon } from "@/components/site/icon";
import { Reveal } from "@/components/site/reveal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import type { Faq } from "@/lib/types";

type HelpCard = { icon: string; title: string; desc: string; href: string };

/** Data array per-locale — i18n t() hanya untuk string tunggal. */
const CONTENT: Record<"id" | "en" | "ar", { chips: string[]; cards: HelpCard[]; quick: HelpCard[] }> = {
  id: {
    chips: ["verifikasi", "keanggotaan", "dana", "Nusuk", "tracking"],
    cards: [
      { icon: "book-open", title: "Manasik & Ibadah", desc: "Panduan ihram, tawaf, sa'i hingga doa perjalanan.", href: "/berita" },
      { icon: "graduation-cap", title: "Akademi & Sertifikasi", desc: "Kelas muthowif, tour leader, dan standar layanan.", href: "/akademi" },
      { icon: "play-circle", title: "Tutorial Portal", desc: "Langkah demi langkah memakai fitur portal.", href: "/tutorial" },
      { icon: "shield-check", title: "Keamanan & Privasi", desc: "Hak subjek data, kebijakan PDP, dan keamanan akun.", href: "/privasi" },
    ],
    quick: [
      { icon: "package", title: "Cek Pesanan & Invoice", desc: "Lacak status pembayaran dan unduh invoice PDF.", href: "/pesanan" },
      { icon: "map", title: "Verifikasi Penyelenggara", desc: "Periksa legalitas PPIU/PIHK dalam direktori.", href: "/verifikasi" },
      { icon: "qr-code", title: "Paspor Haji Digital", desc: "Kartu QR pribadi untuk titik layanan.", href: "/paspor" },
      { icon: "help-circle", title: "Semua FAQ", desc: "Seluruh pertanyaan terjawab dalam satu halaman.", href: "/faq" },
    ],
  },
  en: {
    chips: ["verification", "membership", "funds", "Nusuk", "tracking"],
    cards: [
      { icon: "book-open", title: "Manasik & Worship", desc: "Guides on ihram, tawaf, sa'i and travel prayers.", href: "/berita" },
      { icon: "graduation-cap", title: "Academy & Certification", desc: "Muthowif, tour leader classes and service standards.", href: "/akademi" },
      { icon: "play-circle", title: "Portal Tutorials", desc: "Step-by-step usage of portal features.", href: "/tutorial" },
      { icon: "shield-check", title: "Safety & Privacy", desc: "Data subject rights, PDP policy, account security.", href: "/privasi" },
    ],
    quick: [
      { icon: "package", title: "Check Order & Invoice", desc: "Track payment status and download PDF invoice.", href: "/pesanan" },
      { icon: "map", title: "Verify Organizers", desc: "Check PPIU/PIHK licenses in the directory.", href: "/verifikasi" },
      { icon: "qr-code", title: "Digital Hajj Passport", desc: "Personal QR card for service points.", href: "/paspor" },
      { icon: "help-circle", title: "All FAQs", desc: "Every answered question in one page.", href: "/faq" },
    ],
  },
  ar: {
    chips: ["التحقق", "عضوية", "الأموال", "Nusuk", "التتبع"],
    cards: [
      { icon: "book-open", title: "المناسك والعبادة", desc: "أدلة الإحرام والطواف والسعي وأدعية السفر.", href: "/berita" },
      { icon: "graduation-cap", title: "الأكاديمية والاعتماد", desc: "دروس المرشد وقائد الرحلة ومعايير الخدمة.", href: "/akademi" },
      { icon: "play-circle", title: "دروس البوابة", desc: "خطوات استخدام ميزات البوابة.", href: "/tutorial" },
      { icon: "shield-check", title: "الأمان والخصوصية", desc: "حقوق صاحب البيانات وسياسة الحماية وأمان الحساب.", href: "/privasi" },
    ],
    quick: [
      { icon: "package", title: "فحص الطلب والفاتورة", desc: "تتبع حالة الدفع وتنزيل الفاتورة PDF.", href: "/pesanan" },
      { icon: "map", title: "التحقق من المنظمين", desc: "افحص تراخيص PPIU/PIHK في الدليل.", href: "/verifikasi" },
      { icon: "qr-code", title: "جواز الحج الرقمي", desc: "بطاقة QR شخصية لنقاط الخدمة.", href: "/paspor" },
      { icon: "help-circle", title: "كل الأسئلة", desc: "كل الأسئلة المجابة في صفحة واحدة.", href: "/faq" },
    ],
  },
};

export function BantuanView() {
  const { t, locale } = useT();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiGet<Faq[]>("/api/faqs")
      .then(setFaqs)
      .catch(() => setFaqs([]));
  }, []);

  const cards = CONTENT[locale]?.cards ?? CONTENT.id.cards;
  const quick = CONTENT[locale]?.quick ?? CONTENT.id.quick;
  const chips = CONTENT[locale]?.chips ?? CONTENT.id.chips;

  const q = query.trim().toLowerCase();
  const matched = useMemo(
    () =>
      (faqs ?? [])
        .filter((f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
        .slice(0, 6),
    [faqs, q]
  );

  return (
    <div className="flex flex-col">
      {/* HERO + PENCARIAN */}
      <section className="relative overflow-hidden bg-forest-deep text-white">
        <div className="absolute inset-0 bg-islamic-pattern-gold opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-current opacity-60" aria-hidden />
              {t("help.eyebrow")}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("help.title")}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-emerald-50/80">{t("help.subtitle")}</p>
            <div className="relative mx-auto mt-7 max-w-xl">
              <Icon name="search" className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("help.searchPlaceholder")}
                aria-label={t("help.searchAria")}
                data-testid="help-search"
                className="h-13 rounded-2xl border-transparent bg-white ps-12 text-foreground shadow-xl focus-visible:ring-gold/60"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-emerald-50/60">{t("help.popularLabel")}</span>
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQuery(c)}
                  className="rounded-full border border-white/25 px-3 py-1 font-bold text-emerald-50 transition hover:bg-white/10"
                >
                  {c}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* HASIL CARI FAQ (muncul saat mengetik) */}
      {q ? (
        <section className="py-10" aria-live="polite">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold">
              <Icon name="help-circle" className="h-5 w-5 text-primary" aria-hidden />
              {t("help.faqTitle")} · {matched.length}
            </h2>
            {!faqs ? (
              <div className="mt-4 space-y-3" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
              </div>
            ) : matched.length === 0 ? (
              <div className="mt-4 rounded-2xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                {t("help.empty")}
              </div>
            ) : (
              <Accordion type="single" collapsible className="mt-4 space-y-3">
                {matched.map((f) => (
                  <AccordionItem key={f.id} value={f.id} className="rounded-2xl border bg-card px-5 shadow-sm last:border-b">
                    <AccordionTrigger className="py-4 text-start text-sm font-bold hover:no-underline hover:text-primary">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            <button
              type="button"
              onClick={() => navigate("/faq")}
              className="mt-5 text-sm font-extrabold text-primary hover:underline"
            >
              {t("help.faqSeeAll")} →
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* KATEGORI BELAJAR */}
          <section className="py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <Reveal>
                <h2 className="flex items-center gap-2 text-xl font-extrabold">
                  <Icon name="book-open" className="h-5 w-5 text-primary" aria-hidden />
                  {t("help.learnTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("help.learnDesc")}</p>
              </Reveal>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((c, i) => (
                  <Reveal key={c.title} delay={i * 0.05}>
                    <button
                      type="button"
                      onClick={() => navigate(c.href.replace(/^\//, ""))}
                      className="group h-full w-full rounded-2xl border bg-card p-5 text-start shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                        <Icon name={c.icon} className="h-5.5 w-5.5" aria-hidden />
                      </span>
                      <h3 className="mt-3.5 font-extrabold leading-snug group-hover:text-primary">{c.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* LAYANAN CEPAT */}
          <section className="pb-6">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <Reveal>
                <h2 className="flex items-center gap-2 text-xl font-extrabold">
                  <Icon name="zap" className="h-5 w-5 text-gold-deep" aria-hidden />
                  {t("help.quickTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("help.quickDesc")}</p>
              </Reveal>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {quick.map((c, i) => (
                  <Reveal key={c.title} delay={i * 0.04}>
                    <button
                      type="button"
                      onClick={() => navigate(c.href.replace(/^\//, ""))}
                      className="group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-start shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-deep">
                        <Icon name={c.icon} className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold group-hover:text-primary">{c.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.desc}</span>
                      </span>
                      <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-muted-foreground icon-flip" aria-hidden />
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* CTA KONTAK */}
      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/5 to-gold/10 p-8 text-center">
            <Icon name="message-circle" className="mx-auto h-9 w-9 text-primary" aria-hidden />
            <h2 className="mt-3 text-xl font-extrabold">{t("help.contactTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("help.contactDesc")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/${BRAND.whatsappIntl}?text=${encodeURIComponent("Assalamu'alaikum, saya membuka Pusat Bantuan MUHDIN dan butuh bantuan.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-700"
              >
                <Icon name="message-circle" className="h-4 w-4" aria-hidden />
                WhatsApp {BRAND.whatsappDisplay}
              </a>
              <button
                type="button"
                onClick={() => navigate("/kontak")}
                className={cn("inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-6 py-3 text-sm font-extrabold text-primary transition hover:bg-primary/10")}
              >
                <Icon name="mail" className="h-4 w-4" aria-hidden />
                Formulir Kontak
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
