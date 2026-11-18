/**
 * Aggregator kamus i18n. Satu file per namespace berisi ketiga locale
 * { id, en, ar } — bebas konflik antar agent.
 */
import { commonDict } from "@/lib/i18n/locales/common";
import { kalenderDict } from "@/lib/i18n/locales/kalender";
import { navbarDict } from "@/lib/i18n/locales/navbar";
import { footerDict } from "@/lib/i18n/locales/footer";
import { homeDict } from "@/lib/i18n/locales/home";
import { miscDict } from "@/lib/i18n/locales/misc";
import { ecosystemDict } from "@/lib/i18n/locales/ecosystem";
import { journeyDict } from "@/lib/i18n/locales/journey";
import { membersDict } from "@/lib/i18n/locales/members";
import { aboutDict } from "@/lib/i18n/locales/about";
import { tutorialDict } from "@/lib/i18n/locales/tutorial";
import { newsDict } from "@/lib/i18n/locales/news";
import { contactDict } from "@/lib/i18n/locales/contact";
import { joinDict } from "@/lib/i18n/locales/join";
import { nusukDict } from "@/lib/i18n/locales/nusuk";
import { trackDict } from "@/lib/i18n/locales/track";
import { galleryDict } from "@/lib/i18n/locales/gallery";
import { agendaDict } from "@/lib/i18n/locales/agenda";
import { downloadsDict } from "@/lib/i18n/locales/downloads";
import { reportDict } from "@/lib/i18n/locales/report";
import { branchesDict } from "@/lib/i18n/locales/branches";
import { nusHomeDict } from "@/lib/i18n/locales/indonesia-home";
import { nusTrustDict } from "@/lib/i18n/locales/indonesia-trust";
import { nusJoinDict } from "@/lib/i18n/locales/indonesia-join";
import { pengurusDict } from "@/lib/i18n/locales/pengurus";
// Task 29 (v13.2) — Master Final Organisasi + Komunitas WA
import { orgMasterDict } from "@/lib/i18n/locales/org-master";
import { waKomunitasDict } from "@/lib/i18n/locales/komunitas";
import { latihanDict } from "@/lib/i18n/locales/latihan";
import { grupDict } from "@/lib/i18n/locales/grup";
// R-011 — Web Push Pengumuman Keberangkatan
import { pushDict } from "@/lib/i18n/locales/push";
// Task 50 — Pusat Layanan, Perizinan & Sertifikasi (menu baru)
import { layananDict } from "@/lib/i18n/locales/layanan";
// Task 48 — Super Dashboard Trio (jamaah / mitra / admin hub)
import { dashDict } from "@/lib/i18n/locales/dashboard";
// Task 51 — Dashboard PPIU & PPIHK + sinkronisasi Nusuk
import { ppiuPihkDict } from "@/lib/i18n/locales/ppiu-pihk";
// Task 52 (P0) — Infrastruktur Kepercayaan (8 halaman baru).
// Catatan: key menu (navbar.items.kepercayaan, layanan.groups.kepercayaan,
// footer.trust*) ditambahkan langsung ke locales/navbar.ts, locales/layanan.ts
// & locales/footer.ts karena Object.assign di file ini menimpa root utuh —
// root duplikat akan mencabut dict lama (bug footer.quick.* sudah terjadi).
import { regulasiDict } from "@/lib/i18n/locales/regulasi";
import { transparansiDict } from "@/lib/i18n/locales/transparansi";
import { etikDict } from "@/lib/i18n/locales/etik";
import { pdpDict } from "@/lib/i18n/locales/pdp";
import { daruratDict } from "@/lib/i18n/locales/darurat";
import { sehatDict } from "@/lib/i18n/locales/sehat";
import { kalkulatorDict } from "@/lib/i18n/locales/kalkulator";
import { widgetDict } from "@/lib/i18n/locales/widget";
// Task 53 — Live Queue Engine (papan slot pendaftaran realtime)
import { liveRegDict } from "@/lib/i18n/locales/live-reg";
// v4.1 — Halaman detail (anggota/agenda/galeri/dpd/faq/peta-situs)
import { detailDict } from "@/lib/i18n/locales/detail";
// v5.0 — Marketplace Paket, Forum Jamaah, Kartu Jamaah QR
import { fiturV5Dict } from "@/lib/i18n/locales/fitur-v5";
// v6.0 — Ekosistem Hulu-Hilir
import { fiturV6Dict } from "@/lib/i18n/locales/fitur-v6";
// v7.0 — Pindai Izin 360°
import { scanDict } from "@/lib/i18n/locales/fitur-v7";
import { complianceDict } from "@/lib/i18n/locales/fitur-v12";
// v12.2 «99 ROADMAP UPGRADE» — peta jalan 99 item (root `roadmap99`)
import { roadmap99Dict } from "@/lib/i18n/locales/fitur-v12b";
// v13.1 «PANEN & PANTAU» — Papan Status (R-097) + Duty Officer (R-096) + NPS (R-092)
import { v131Dict } from "@/lib/i18n/locales/v131";
// v12.4 «LUNAS» — Checkout + Pesanan & Invoice (root `checkout`, `pesanan`)
import { checkoutDict } from "@/lib/i18n/locales/fitur-v12c";
// v12.5 — Help Center #/bantuan (R-095, root `help`)
import { helpDict, itenDict } from "@/lib/i18n/locales/fitur-v12d";
// GABUNG v11 — WA-AI, Paspor Haji, Tracking GPS, Tur 360°, Statistik, Global Search, Keanggotaan
import { waaiDict } from "@/lib/i18n/locales/waai";
import { pasporDict } from "@/lib/i18n/locales/paspor";
import { trackingDict } from "@/lib/i18n/locales/tracking";
import { turDict } from "@/lib/i18n/locales/tur";
import { statistikDict } from "@/lib/i18n/locales/statistik";
import { searchDict } from "@/lib/i18n/locales/search";
import { keanggotaanDict } from "@/lib/i18n/locales/keanggotaan";
// Audit 2026 — Kemitraan FKK Banten, Pembayaran, Keamanan, Model Biaya, KPI, ARMINA
import { audit13Dict } from "@/lib/i18n/locales/audit13";
// v14.1 «AKADEMI & MITRA» — doa audio (R-016), kelas live (R-024),
// rombongan B2B (R-045), kemitraan masjid (R-090) + kunci refund/merchant (R-044/R-029)
import { doaDict } from "@/lib/i18n/locales/doa";
import { kelasDict } from "@/lib/i18n/locales/kelas";
import { rombonganDict } from "@/lib/i18n/locales/rombongan";
import { masjidDict } from "@/lib/i18n/locales/masjid";
import { v141Dict } from "@/lib/i18n/locales/v141";

const dicts = [
  commonDict,
  navbarDict,
  footerDict,
  homeDict,
  miscDict,
  ecosystemDict,
  journeyDict,
  membersDict,
  aboutDict,
  tutorialDict,
  newsDict,
  contactDict,
  joinDict,
  nusukDict,
  trackDict,
  galleryDict,
  agendaDict,
  downloadsDict,
  reportDict,
  branchesDict,
  // Task 33 — MUHDIN INDONESIA (Trusted Pilgrim Ecosystem)
  nusHomeDict,
  nusTrustDict,
  nusJoinDict,
  // Task 37 — Susunan Pengurus MUHDIN (#/pengurus)
  pengurusDict,
  // Task 50 — Pusat Layanan dinamis (#/layanan/<slug>)
  layananDict,
  // Task 48 — Super Dashboard Trio (#/dashboard)
  dashDict,
  // Task 51 — Dashboard PPIU & PPIHK (#/dashboard/ppiu-pihk)
  ppiuPihkDict,
  // Task 52 (P0) — Infrastruktur Kepercayaan (8 halaman + menu/footer)
  regulasiDict,
  transparansiDict,
  etikDict,
  pdpDict,
  daruratDict,
  sehatDict,
  kalkulatorDict,
  widgetDict,
  // Task 53 — Live Queue Engine (papan slot pendaftaran realtime)
  liveRegDict,
  // v4.1 — Halaman detail (anggota/agenda/galeri/dpd/faq/peta-situs)
  detailDict,
  // v5.0 — Marketplace Paket (#/paket), Forum Jamaah (#/forum), Kartu Jamaah (#/kartu)
  fiturV5Dict,
  // v6.0 — Ekosistem Hulu-Hilir (Pusat Bisnis, Brankas Jamaah, Ulasan, Composer, SOS)
  fiturV6Dict,
  scanDict,
  // GABUNG v11 — WhatsApp AI Chatbot (#/whatsapp-ai)
  waaiDict,
  // GABUNG v11 — Paspor Haji Digital (QR) + GPS Tracking rombongan
  pasporDict,
  trackingDict,
  // GABUNG v11 — Virtual Tour 360° (#/tur-virtual)
  turDict,
  // GABUNG v11 — Statistik Nasional & Transparansi + Global Search
  statistikDict,
  searchDict,
  // v12.1 — God-Mode Izin Compliance Checker (#/compliance)
  complianceDict,
  // v12.2 — 99 Roadmap Upgrade (seksi Tentang Kami)
  roadmap99Dict,
  // v13.1 — status + duty + nps
  v131Dict,
  // Task 29 (v13.2) — Master Final Organisasi DPP 2026–2031 + 18 Kanal WA
  orgMasterDict,
  waKomunitasDict,
  // v13.3 R-023 — Bank Soal Manasik
  latihanDict,
  // v13.3 R-012 — Grup Perjalanan Digital
  grupDict,
  // R-011 — Web Push
  pushDict,
  // v12.4 «LUNAS» — Checkout & Lacak Pesanan
  checkoutDict,
  // v12.5 — Help Center (R-095)
  helpDict,
  // v12.5 — Itinerary + Seat Map + Waitlist (R-009/R-040)
  itenDict,
  // GABUNG v11 — Keanggotaan Power Pack
  keanggotaanDict,
  // Audit 2026 — Kemitraan, Pembayaran, Keamanan, Biaya, KPI, ARMINA, Nusuk positioning
  audit13Dict,
  // v14.0 «KAMPANYE & KAWAL» — R-017 Kalender Musim Umrah & Haji
  kalenderDict,
  // v14.1 «AKADEMI & MITRA» — doa audio, kelas live, rombongan B2B, kemitraan masjid,
  // refund berjenjang, merchant KTA, item layanan baru
  doaDict,
  kelasDict,
  rombonganDict,
  masjidDict,
  v141Dict,
];

export const dictionaries: Record<"id" | "en" | "ar", Record<string, unknown>> = {
  id: Object.assign({}, ...dicts.map((d) => d.id)),
  en: Object.assign({}, ...dicts.map((d) => d.en)),
  ar: Object.assign({}, ...dicts.map((d) => d.ar)),
};
