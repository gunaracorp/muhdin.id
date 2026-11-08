/**
 * v12.4 «LUNAS» — R-039 Invoice PDF Otomatis.
 *
 * Generator PDF invoice native (pdfkit, font Helvetica AFM bawaan — nol
 * file font eksternal). Dipanggil dari GET /api/invoices/[number] dan
 * CMS → Pesanan & Invoice. Struktur:
 *
 *   ┌ band header MUHDIN (emerald gelap + aksen emas)
 *   │  INVOICE + nomor seri + tanggal terbit WIB
 *   ├ blok pesanan (nomor, status, paket, penyelenggara)
 *   ├ blok pelanggan (nama, WA, email)
 *   ├ tabel rincian (uraian · qty · harga · jumlah)
 *   ├ total besar + QR lacak (scan → halaman status pesanan)
 *   └ footer GRATIS SELAMANYA + WA resmi
 */

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { BRAND } from "@/lib/constants";

const EMERALD = "#064e3b";
const GOLD = "#d4af37";
const INK = "#1f2937";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function fmtWib(d: Date): string {
  // WIB = UTC+7 tetap — server lokal/idle pun konsisten.
  const t = new Date(d.getTime() + 7 * 3600_000);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(t.getDate())}/${p(t.getMonth() + 1)}/${t.getFullYear()} ${p(t.getHours())}:${p(t.getMinutes())} WIB`;
}

export interface InvoicePdfInput {
  invoiceNumber: string;
  issuedAt: Date;
  order: {
    number: string;
    packageTitle: string;
    memberName: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    quantity: number;
    unitPrice: number;
    amount: number;
    paidAt?: Date | null;
    paymentMethod?: string;
    paymentProvider?: string;
  };
  trackUrl?: string; // ditembakkan ke QR (default halaman lacak lokal)
}

export async function generateInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const { invoiceNumber, issuedAt, order } = input;

  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: `Invoice ${invoiceNumber} — MUHDIN`,
      Author: BRAND.fullName,
      Subject: `Pesanan ${order.number}`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Uint8Array>((resolve) => doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks)))));

  const W = doc.page.width;
  const M = doc.page.margins.left;
  const CW = W - M * 2;

  /* ---------- Band header ---------- */
  doc.rect(0, 0, W, 118).fill(EMERALD);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(24).text("MUHDIN", M, 30);
  doc.fillColor("#a7f3d0").font("Helvetica").fontSize(8.5)
    .text(BRAND.fullName.toUpperCase(), M, 60)
    .text(BRAND.legalName, M, 72);

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26).text("INVOICE", W - M - 150, 30, { width: 150, align: "right" });
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12)
    .text(invoiceNumber, W - M - 150, 62, { width: 150, align: "right" });
  doc.fillColor("#a7f3d0").font("Helvetica").fontSize(9)
    .text(`Diterbitkan ${fmtWib(issuedAt)}`, W - M - 150, 80, { width: 150, align: "right" });

  let y = 150;

  /* ---------- Blok pesanan ---------- */
  doc.fillColor(EMERALD).font("Helvetica-Bold").fontSize(10).text("RINCIAN PESANAN", M, y);
  y += 16;
  const rows: [string, string][] = [
    ["Nomor Pesanan", order.number],
    ["Status", order.paidAt ? "LUNAS" : "PENDING"],
    ...(order.paidAt ? [["Dibayar", fmtWib(order.paidAt)] as [string, string]] : []),
    ...(order.paymentMethod ? [["Metode Pembayaran", `${order.paymentMethod}${order.paymentProvider ? ` · ${order.paymentProvider}` : ""}`] as [string, string]] : []),
    ["Paket", order.packageTitle],
    ["Penyelenggara", order.memberName || "-"],
  ];
  doc.font("Helvetica").fontSize(10);
  for (const [label, value] of rows) {
    doc.fillColor(MUTED).text(label, M, y, { continued: false });
    doc.fillColor(INK).font("Helvetica-Bold").text(value, M + 170, y, { width: CW - 170 });
    doc.font("Helvetica");
    y += 15;
  }

  /* ---------- Blok pelanggan ---------- */
  y += 10;
  doc.fillColor(EMERALD).font("Helvetica-Bold").fontSize(10).text("PELANGGAN", M, y);
  y += 16;
  doc.font("Helvetica").fontSize(10);
  const cRows: [string, string][] = [
    ["Nama", order.customerName],
    ["WhatsApp", order.customerPhone],
    ["Email", order.customerEmail || "-"],
  ];
  for (const [label, value] of cRows) {
    doc.fillColor(MUTED).text(label, M, y);
    doc.fillColor(INK).font("Helvetica-Bold").text(value, M + 170, y, { width: CW - 170 });
    doc.font("Helvetica");
    y += 15;
  }

  /* ---------- Tabel rincian ---------- */
  y += 18;
  const colQty = W - M - 200; // kolom qty (kanan)
  const colPrice = W - M - 130;
  const colAmt = W - M;

  doc.rect(M, y, CW, 22).fill("#ecfdf5");
  doc.fillColor(EMERALD).font("Helvetica-Bold").fontSize(9.5);
  doc.text("URAIAN", M + 8, y + 7);
  doc.text("QTY", colQty - 24, y + 7, { width: 24, align: "right" });
  doc.text("HARGA", colPrice - 80, y + 7, { width: 80, align: "right" });
  doc.text("JUMLAH", colAmt - 100, y + 7, { width: 100, align: "right" });
  y += 22;

  doc.font("Helvetica").fontSize(10);
  const lineH = 24;
  doc.save();
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor(LINE).lineWidth(1).stroke();
  doc.restore();
  doc.fillColor(INK).text(order.packageTitle, M + 8, y + 7, { width: colQty - M - 30, ellipsis: true });
  doc.text(String(order.quantity), colQty - 24, y + 7, { width: 24, align: "right" });
  doc.text(rupiah(order.unitPrice), colPrice - 80, y + 7, { width: 80, align: "right" });
  doc.font("Helvetica-Bold").fillColor(INK).text(rupiah(order.unitPrice * order.quantity), colAmt - 100, y + 7, { width: 100, align: "right" });
  y += lineH;
  doc.save();
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor(LINE).lineWidth(1).stroke();
  doc.restore();

  /* ---------- Total ---------- */
  y += 14;
  doc.rect(M, y, CW, 40).fill(EMERALD);
  doc.fillColor("#a7f3d0").font("Helvetica-Bold").fontSize(10).text("TOTAL TAGIHAN", M + 12, y + 13);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(16).text(rupiah(order.amount), colAmt - 190, y + 10, { width: 180, align: "right" });
  y += 56;

  /* ---------- QR lacak + catatan ---------- */
  const trackUrl = input.trackUrl || "https://muhdin.web.id/#/pesanan";
  try {
    const qr = await QRCode.toBuffer(trackUrl, { width: 240, margin: 1, color: { dark: EMERALD, light: "#ffffff" } });
    doc.image(qr, M, y, { width: 92 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text("Lacak status pesanan", M + 108, y + 4, { link: trackUrl, underline: true });
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(
      "Pindai QR atau buka halaman Pesanan di portal MUHDIN, masukkan nomor pesanan & nomor WhatsApp yang terdaftar untuk memantau status pembayaran dan mengunduh ulang invoice ini.",
      M + 108, y + 20, { width: CW - 120 }
    );
  } catch {
    /* QR gagal (sangat tidak mungkin) → invoice tetap sah tanpa QR */
  }

  /* ---------- Footer (kompres agar 1 halaman A4 utuh) ---------- */
  const footY = doc.page.height - 100;
  doc.save();
  doc.moveTo(M, footY).lineTo(W - M, footY).strokeColor(GOLD).lineWidth(2).stroke();
  doc.restore();
  doc.fillColor(EMERALD).font("Helvetica-Bold").fontSize(9)
    .text(BRAND.promise, M, footY + 8, { width: CW, align: "center" });
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5)
    .text(
      `${BRAND.motto}  ·  WhatsApp ${BRAND.whatsappDisplay}  ·  ${BRAND.poweredBy}`,
      M, footY + 21, { width: CW, align: "center" }
    );
  doc.fillColor("#9ca3af").font("Helvetica-Oblique").fontSize(7)
    .text("Dokumen ini dihasilkan otomatis oleh sistem MUHDIN dan sah tanpa tanda tangan basah.", M, footY + 33, { width: CW, align: "center" });

  doc.end();
  return done;
}
