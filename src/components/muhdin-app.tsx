"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useHashRoute, navigate, useScrollToTopOnRoute } from "@/hooks/use-hash-route";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { HomeView } from "@/components/views/home-view";
import { EcosystemView } from "@/components/views/ecosystem-view";
import { JourneyView } from "@/components/views/journey-view";
import { MembersView } from "@/components/views/members-view";
import { TutorialView } from "@/components/views/tutorial-view";
import { NewsView } from "@/components/views/news-view";
import { AboutView } from "@/components/views/about-view";
import { ContactView } from "@/components/views/contact-view";
import { JoinView } from "@/components/views/join-view";
import { NusukView } from "@/components/views/nusuk-view";
import { TrackView } from "@/components/views/track-view";
import { GalleryView } from "@/components/views/gallery-view";
import { AgendaView } from "@/components/views/agenda-view";
import { DownloadsView } from "@/components/views/downloads-view";
import { ReportView } from "@/components/views/report-view";
import { PengurusView } from "@/components/views/pengurus-view";
// Task 50 — Pusat Layanan dinamis (#/layanan/<slug>)
import { LayananView } from "@/components/views/layanan-view";
import { AdminView } from "@/components/admin/admin-view";
// Task 33 — MUHDIN INDONESIA (Trusted Pilgrim Ecosystem)
import { DaftarView } from "@/components/views/daftar-view";
import { VerifyView } from "@/components/views/verify-view";
import { PrivacyView } from "@/components/views/privacy-view";
import { TermsView } from "@/components/views/terms-view";
// Task 48 — Super Dashboard Trio (#/dashboard): DashboardView (portal tiket lama) digantikan
import { DashboardHub } from "@/components/views/dashboard-hub";
import { JamaahDashboard } from "@/components/views/jamaah-dashboard";
import { MitraDashboard } from "@/components/views/mitra-dashboard";
// Task 51 — Dashboard PPIU & PPIHK + sinkronisasi Nusuk
import { PpiuPpihkDashboard } from "@/components/views/ppiu-pihk-dashboard";
// Task 52 (P0) — Infrastruktur Kepercayaan (8 halaman baru)
import { RegulasiView } from "@/components/views/regulasi-view";
import { TransparansiView } from "@/components/views/transparansi-view";
import { EtikView } from "@/components/views/etik-view";
import { PdpView } from "@/components/views/pdp-view";
import { DaruratView } from "@/components/views/darurat-view";
import { StatusView } from "@/components/views/status-view";
import { SehatView } from "@/components/views/sehat-view";
import { KalkulatorView } from "@/components/views/kalkulator-view";
import { WidgetView } from "@/components/views/widget-view";
import { LocaleProvider, useT } from "@/lib/i18n";
import { RegisterSW } from "@/components/pwa/register-sw";
import { WaFab } from "@/components/site/wa-fab";
// v4.0 — Sahabat MUHDIN (AI Concierge): asisten ibadah AI di semua halaman publik.
import { SahabatMuhdin } from "@/components/site/ai-concierge";
// v4.1 — Halaman detail lengkap (setiap entitas punya halaman sendiri)
import { MemberDetail } from "@/components/views/member-detail";
import { AgendaDetail } from "@/components/views/agenda-detail";
import { GalleryDetail } from "@/components/views/gallery-detail";
import { BranchIndex, BranchDetail } from "@/components/views/branch-pages";
import { BantuanView } from "@/components/views/bantuan-view";
import { FaqView } from "@/components/views/faq-view";
import { SitemapView } from "@/components/views/sitemap-view";
// GABUNG v11 — WA-AI, Paspor Haji (QR), Tracking GPS, Tur 360°, Power Pack
import { WaAiView } from "@/components/views/wa-ai-view";
import { PasporView } from "@/components/views/paspor-view";
import { PassportVerifyView } from "@/components/views/passport-verify-view";
import { TrackingView } from "@/components/views/tracking-view";
import { TourView } from "@/components/views/tour-view";
import { KartuAnggotaView } from "@/components/views/kartu-anggota-view";
import { AcademyView } from "@/components/views/academy-view";
import { BookingView } from "@/components/views/booking-view";
import { BenefitView } from "@/components/views/benefit-view";
import { KtaVerifyView } from "@/components/views/kta-verify-view";
import { CertificateVerifyView } from "@/components/views/certificate-verify-view";
import { PengurusDetail } from "@/components/views/pengurus-detail";
// Task 29 (v13.2) — Master WhatsApp Community Architecture (18 kanal)
import { KomunitasView } from "@/components/views/komunitas-view";
import { LatihanView } from "@/components/views/latihan-view";
import { GrupView } from "@/components/views/grup-view";
// v5.0 — Marketplace paket, forum jamaah, kartu jamaah digital
import { PaketView } from "@/components/views/paket-view";
import { PaketDetail } from "@/components/views/paket-detail";
import { ForumView } from "@/components/views/forum-view";
import { ForumDetail } from "@/components/views/forum-detail";
import { KartuView } from "@/components/views/kartu-view";
// v6.0 — Ekosistem hulu-hilir: Pusat Bisnis B2B + Brankas Jamaah
import { BisnisView } from "@/components/views/bisnis-view";
import { PindaiView } from "@/components/views/pindai-view"; // v7.0 — Pindai Izin 360°
import { ComplianceView } from "@/components/views/compliance-view"; // v12.1 — God-Mode Compliance Checker
// v12.4 «LUNAS» — Checkout & Pesanan
import { PesananView } from "@/components/views/pesanan-view";
import { VaultView } from "@/components/views/vault-view";
// Audit 2026 — Kemitraan FKK Banten, Pembayaran, Keamanan, Model Biaya
import { KemitraanView } from "@/components/views/kemitraan-view";
import { PembayaranView } from "@/components/views/pembayaran-view";
import { KeamananView } from "@/components/views/keamanan-view";
import { BiayaView } from "@/components/views/biaya-view";

function LoadingSplash() {
  const { t } = useT();
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{t("misc.loading")}</p>
      </div>
    </div>
  );
}

/**
 * Task 21 — Scroll Progress: garis rambut emas di puncak viewport yang
 * mengikuti posisi gulir (sentuhan konsultan kelas dunia, ala McKinsey).
 * RTL-aware (dari kanan di bahasa Arab), tersembunyi di rute admin.
 *
 * Fix hydration (Task 35-d): hooks framer-motion (useScroll/useSpring)
 * menggeser counter useId React di client saat hydration, sehingga seluruh
 * ID internal Radix SETELAHNYA (switcher tema & bahasa di Navbar) berbeda
 * dari yang dirender server → hydration mismatch (radix-_R_...).
 * Solusi: <ScrollProgressBar /> hanya disertakan di tree SETELAH mount
 * (gate `mounted` di MuhdinApp) — SSR & hydration tidak pernah mengeksekusi
 * hooks framer, counter useId server == client, ID Radix tetap sinkron.
 * Visual tidak berubah: bar memang tak terlihat di posisi gulir teratas.
 *
 * Addendum (Task 35-h, akar masalah diperbarui): investigasi lanjutan membuktikan
 * gejala radix-_R_... yang persisten/intermiten BUKAN regresi kode aplikasi —
 * SSR 100% deterministik (10/10 probe identik), fiber tree client pun identik
 * setelah hydrasi. Sumber sesungguhnya: race bookkeeping TreeContext useId
 * React 19 selama hydration pass di region puncak tree yang diisi komponen
 * DEV-ONLY Next 16 (SegmentStateProvider, SegmentViewNode, HotReload,
 * AppDevOverlayErrorBoundary, NavigationPromisesContext) — diperparah OOM
 * (next-server tewas dibunuh kernel saat RAM penuh). Tidak ada di production
 * build; dampak fungsional nihil (React mempertahankan id server; menu tetap
 * berfungsi). Remedy operator: `bun run dev:clean` (purge .next) + restart,
 * dan jaga memori bebas. Gate `mounted` dipertahankan sebagai lapisan aman.
 *
 * LAPISAN 2 — id deterministik (fix final, user-reported 3×): seluruh trigger
 * Radix yang merender atribut turunan useId saat SSR kini diberi id/aria
 * EKSPLISIT (consumer props menimpa id internal Radix yang di-spread lebih
 * awal — terverifikasi di dist @radix-ui): ThemeSwitcher (desktop+compact),
 * LocaleSwitcher, AdminBell, TabsTrigger/TabsContent (kontak & anggota).
 * Dengan atribut yang 100% sama di server & client, mismatch radix-_R_...
 * MUSTAHIL terjadi apapun kondisi race dev — tanpa efek samping fungsional.
 */
const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 z-[70] h-[3px] origin-left rtl:origin-right bg-gradient-to-r from-gold via-gold-soft to-gold shadow-[0_0_12px_rgba(212,175,55,0.55)]"
    />
  );
}

function NotFound() {
  const { t } = useT();
  return (
    <div className="flex-1 grid place-items-center py-32 px-4">
      <div className="text-center space-y-4">
        <p className="text-7xl font-extrabold text-primary/20">{t("misc.notfound.code")}</p>
        <h1 className="text-2xl font-bold">{t("misc.notfound.title")}</h1>
        <p className="text-muted-foreground max-w-md">
          {t("misc.notfound.body")}
        </p>
        <button
          onClick={() => navigate("beranda")}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest transition-colors"
        >
          {t("misc.notfound.cta")}
        </button>
      </div>
    </div>
  );
}

export function MuhdinApp({ initialLocale = "id" }: { initialLocale?: "id" | "en" | "ar" }) {
  const route = useHashRoute();
  // v7.0 — dukung deep-link query pada hash: #/pindai?q=<id> → root dibersihkan.
  const root = (route[0] || "beranda").split("?")[0];
  const routeQuery =
    route[0] && route[0].includes("?") ? (new URLSearchParams(route[0].split("?")[1]).get("q") ?? "") : "";
  const isAdmin = root === "admin";
  // Task 35-d — ScrollProgress (framer-motion) memanggil useId internal saat SSR
  // sehingga seluruh ID Radix setelahnya (switcher Navbar) tidak sinkron saat
  // hydration. Gate di PARENT: elemen TIDAK disertakan di tree sampai mount
  // (replikasi persis kondisi uji yang terbukti bebas hydration mismatch).
  const mounted = useMounted();

  useScrollToTopOnRoute([root, route[1]]);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/beranda");
    }
  }, []);

  let content: React.ReactNode;
  switch (root) {
    case "beranda":
      content = <HomeView />;
      break;
    case "ekosistem":
      // Task 30 — deep-link #/ekosistem/<nomor> membuka dialog detail langsung.
      content = <EcosystemView focusNumber={route[1]} />;
      break;
    case "alur":
      content = <JourneyView />;
      break;
    case "anggota":
      // Task 30 — deep-link #/anggota/verifikasi membuka tab Cek Verifikasi.
      // v4.1 — #/anggota/<id> → HALAMAN DETAIL ANGGOTA.
      if (route[1] && route[1] !== "verifikasi") {
        content = <MemberDetail id={route[1]} />;
        break;
      }
      // key-remount agar state tab mengikuti hash terbaru.
      content = <MembersView key={`anggota-${route[1] ?? ""}`} initialTab={route[1]} />;
      break;
    case "tutorial":
      content = <TutorialView slug={route[1]} />;
      break;
    case "berita":
      content = <NewsView slug={route[1]} />;
      break;
    case "tentang":
      content = <AboutView />;
      break;
    // Task 37 — Susunan Pengurus MUHDIN (struktur organisasi internasional)
    case "pengurus":
      // v4.1 — #/pengurus/<id> → HALAMAN DETAIL TOKOH.
      content = route[1] ? <PengurusDetail id={route[1]} /> : <PengurusView />;
      break;
    // Task 29 (v13.2) — 18 Kanal WhatsApp Resmi (17 grup + 1 pengumuman)
    case "komunitas":
      content = <KomunitasView />;
      break;
    // v13.3 R-023 — Latihan Manasik Berjenjang (bank soal teracak server-side)
    case "latihan":
      content = <LatihanView />;
      break;
    // v13.3 R-012 — Grup Perjalanan Digital (ruang rombongan berbasis kode)
    case "grup":
      content = <GrupView />;
      break;
    // Task 50 — Pusat Layanan, Perizinan & Sertifikasi (menu baru)
    case "layanan":
      content = <LayananView slug={route[1]} />;
      break;
    case "kontak":
      content = <ContactView />;
      break;
    case "gabung":
      content = <JoinView />;
      break;
    // Task 33 — engine pendaftaran cerdas multi-step (15 peran; Task 49: individu & profesional dihapus)
    case "daftar":
      content = <DaftarView />;
      break;
    // Task 33 — halaman verifikasi publik + QR (ROLE 13)
    case "verifikasi":
      content = <VerifyView key={route[1] ?? "search"} query={route[1]} />;
      break;
    // Task 33 — portal anggota (ROLE 16) → Task 48: Super Dashboard Trio
    case "dashboard":
      content =
        route[1] === "jamaah" ? (
          <JamaahDashboard />
        ) : route[1] === "mitra" ? (
          <MitraDashboard />
        ) : route[1] === "ppiu-pihk" ? (
          // Task 51 — konsol operasional PPIU & PPIHK + sinkronisasi Nusuk
          <PpiuPpihkDashboard />
        ) : (
          <DashboardHub />
        );
      break;
    // Task 33 — privasi & ketentuan (ROLE 21)
    case "privasi":
      content = <PrivacyView />;
      break;
    case "syarat":
      content = <TermsView />;
      break;
    case "nusuk":
      content = <NusukView />;
      break;
    case "lacak":
      content = <TrackView />;
      break;
    case "galeri":
      // v4.1 — #/galeri/<id> → HALAMAN DETAIL DOKUMENTASI.
      content = route[1] ? <GalleryDetail id={route[1]} /> : <GalleryView />;
      break;
    case "agenda":
      // v4.1 — #/agenda/<id> → HALAMAN DETAIL AGENDA.
      content = route[1] ? <AgendaDetail id={route[1]} /> : <AgendaView />;
      break;
    // v4.1 — Jaringan daerah: #/dpd (indeks) & #/dpd/<code> (detail cabang)
    case "dpd":
      content = route[1] ? <BranchDetail code={route[1]} /> : <BranchIndex />;
      break;
    // v4.1 — Pusat bantuan FAQ
    case "faq":
      content = <FaqView />;
      break;
    // v12.5 — Help Center (R-095): hub bantuan dengan pencarian & kategori belajar
    case "bantuan":
      content = <BantuanView />;
      break;
    // v5.0 — Marketplace paket ibadah: #/paket & #/paket/<id>
    case "paket":
      content = route[1] ? <PaketDetail id={route[1]} /> : <PaketView />;
      break;
    // v5.0 — Forum jamaah: #/forum & #/forum/<id>
    case "forum":
      content = route[1] ? <ForumDetail id={route[1]} /> : <ForumView />;
      break;
    // v5.0 — Kartu jamaah digital: #/kartu & #/kartu/<cardNo> (target QR)
    case "kartu":
      content = <KartuView key={route[1] ?? "lookup"} initialCardNo={route[1]} />;
      break;
    // v6.0 — Pusat Bisnis B2B: bursa kursi, vendor, muthowif, kepatuhan
    case "bisnis":
      content = <BisnisView />;
      break;
    // v7.0 — Pindai Izin 360°: input NIB → dossier kelengkapan BPW/PPIU/PIHK
    case "pindai":
      content = <PindaiView key={`pindai-${routeQuery}`} initialQuery={routeQuery} />;
      break;
    // v12.1 — God-Mode Compliance Checker: papan kepatuhan seluruh registri
    case "compliance":
      content = <ComplianceView key={`compliance-${routeQuery}`} initialQuery={routeQuery} />;
      break;
    // v12.4 «LUNAS» — Lacak pesanan & invoice: #/pesanan[?no=ORD-…]
    case "pesanan":
      content = <PesananView key={`pesanan-${route[0] ?? ""}`} />;
      break;
    // v6.0 — Brankas Jamaah: #/vault & #/vault/<cardNo> (target lanjutan QR)
    case "vault":
      content = <VaultView key={route[1] ?? "lookup"} />;
      break;
    // v4.1 — Peta situs: seluruh halaman portal
    case "peta-situs":
      content = <SitemapView />;
      break;
    case "unduhan":
      content = <DownloadsView />;
      break;
    case "lapor":
      content = <ReportView />;
      break;
    // Task 52 (P0) — Infrastruktur Kepercayaan (8 halaman baru)
    case "regulasi":
      content = <RegulasiView />;
      break;
    case "transparansi":
      content = <TransparansiView />;
      break;
    case "etik":
      content = <EtikView />;
      break;
    case "pdp":
      content = <PdpView />;
      break;
    case "darurat":
      content = <DaruratView />;
      break;
    // v13.1 — Papan Status Layanan Publik (R-097)
    case "status":
      content = <StatusView />;
      break;
    // Audit 2026 — halaman kemitraan, pembayaran, keamanan & model biaya
    case "kemitraan":
      content = <KemitraanView />;
      break;
    case "pembayaran":
      content = <PembayaranView />;
      break;
    case "keamanan":
      content = <KeamananView />;
      break;
    case "biaya":
      content = <BiayaView />;
      break;
    case "sehat":
      content = <SehatView />;
      break;
    case "kalkulator":
      content = <KalkulatorView />;
      break;
    case "widget":
      content = <WidgetView />;
      break;
    // GABUNG v11 — WhatsApp AI Chatbot (demo otak bot + panduan gateway)
    case "whatsapp-ai":
      content = <WaAiView />;
      break;
    // GABUNG v11 — Paspor Haji Digital + verifikasi QR + GPS Tracking
    case "paspor":
      content = <PasporView />;
      break;
    case "verifikasi-paspor":
      // QR mendarat di #/verifikasi-paspor/PH-XXX-TTTT-0000 → auto-verifikasi.
      content = <PassportVerifyView code={route[1]} />;
      break;
    case "tracking":
      content = <TrackingView />;
      break;
    // GABUNG v11 — Virtual Tour 360° situs suci
    case "tur-virtual":
      content = <TourView />;
      break;
    // GABUNG v11 — Keanggotaan Power Pack
    case "kartu-anggota":
      content = <KartuAnggotaView />;
      break;
    case "academy":
      content = <AcademyView />;
      break;
    case "booking":
      content = <BookingView />;
      break;
    case "benefit":
      content = <BenefitView />;
      break;
    case "verifikasi-kta":
      // QR kartu mendarat di #/verifikasi-kta/KTA-2026-00001 → auto-verifikasi.
      content = <KtaVerifyView key={route[1] ?? "kta"} code={route[1]} />;
      break;
    case "verifikasi-sertifikat":
      // QR sertifikat mendarat di #/verifikasi-sertifikat/SERT-2026-… → auto-verifikasi.
      content = <CertificateVerifyView key={route[1] ?? "sert"} code={route[1]} />;
      break;
    case "admin":
      content = <AdminView />;
      break;
    default:
      content = <NotFound />;
  }

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <RegisterSW />
      {!isAdmin && mounted && (
        <>
          <ScrollProgressBar />
          <WaFab />
          <SahabatMuhdin />
        </>
      )}
      {isAdmin ? (
        <div className="min-h-screen bg-muted/40 flex flex-col">
          <AdminView />
        </div>
      ) : (
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-1 flex flex-col">{content}</main>
          <Footer />
        </div>
      )}
    </LocaleProvider>
  );
}

export default MuhdinApp;
