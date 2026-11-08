/**
 * Task 19 (R-082) — Anti-spam & moderasi otomatis forum.
 *
 * spamScore() menghitung risiko sebuah kiriman (0–100) dari sinyal:
 *   • tautan berlebihan / pemendek tautan mencurigakan
 *   • huruf kapital dominan & karakter berulang
 *   • kata kunci promosi/judi/pinjol
 *   • duplikasi konten dari kontak yang sama (10 menit)
 *   • frekuensi kirim tinggi dari kontak yang sama (10 menit)
 *
 * Keputusan: <30 low (moderasi biasa) · 30–59 HOLD (antrean + ditandai)
 *            ≥60 BLOCK (ditolak filter).
 * Skor + alasan disimpan ke baris forum agar moderasi CMS punya konteks.
 */
import { db } from "@/lib/db";

const SUSPICIOUS_LINK_HOSTS = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "s.id", "shorturl.at"];
const BANNED_PATTERNS: RegExp[] = [
  /judi|slot\b|togel|casino/i,
  /pinjol|pinjam(an)? online( tanpa)?/i,
  /investasi( bijak| aman)? (100%|terbukti|cepat)/i,
  /wa\.me|api\.whatsapp\.com/i,
  /promo(?!si)?.{0,18}(diskon|gratis)[!！1l]{2,}/i,
  /sewa bot|jual (akun|database|data jamaah)/i,
];

export interface SpamVerdict {
  score: number;
  reasons: string[];
  action: "LOW" | "HOLD" | "BLOCK";
}

export function decide(score: number): SpamVerdict["action"] {
  if (score >= 60) return "BLOCK";
  if (score >= 30) return "HOLD";
  return "LOW";
}

export async function spamScore(input: {
  text: string;
  title?: string;
  authorContact: string;
  entity: "thread" | "reply";
}): Promise<SpamVerdict> {
  const reasons: string[] = [];
  let score = 0;
  const text = `${input.title || ""}\n${input.text}`.trim();

  /* 1. Tautan */
  const urls = text.match(/https?:\/\/[^\s]+/gi) || [];
  if (urls.length > 2) {
    score += (urls.length - 2) * 25;
    reasons.push(`banyak tautan (${urls.length})`);
  }
  for (const u of urls) {
    try {
      const host = new URL(u).hostname.toLowerCase();
      if (SUSPICIOUS_LINK_HOSTS.includes(host)) {
        score += 15;
        reasons.push(`pemendek tautan (${host})`);
        break;
      }
    } catch {
      /* URL tidak valid — abaikan */
    }
  }

  /* 2. Kapital dominan (teks cukup panjang) */
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 30) {
    const caps = letters.replace(/[^A-Z]/g, "").length;
    if (caps / letters.length > 0.45) {
      score += 15;
      reasons.push("kapital dominan");
    }
  }

  /* 3. Karakter berulang (aaaaa / !!!!!) */
  if (/(.)\1{5,}/.test(text)) {
    score += 10;
    reasons.push("karakter berulang");
  }

  /* 4. Kata kunci terlarang / spam klasik */
  let banned = 0;
  for (const re of BANNED_PATTERNS) {
    if (re.test(text)) banned++;
  }
  if (banned > 0) {
    score += Math.min(50, banned * 25);
    reasons.push(`kata kunci mencurigakan (${banned})`);
  }

  /* 5. Duplikasi konten dari kontak yang sama (10 menit) */
  const since = new Date(Date.now() - 10 * 60_000);
  if (input.authorContact) {
    if (input.entity === "thread") {
      const dupe = await db.forumThread.findFirst({
        where: { authorContact: input.authorContact, body: input.text, createdAt: { gte: since } },
        select: { id: true },
      });
      if (dupe) {
        score += 30;
        reasons.push("konten duplikat dalam 10 menit");
      }
      const freq = await db.forumThread.count({
        where: { authorContact: input.authorContact, createdAt: { gte: since } },
      });
      if (freq >= 3) {
        score += 25;
        reasons.push(`frekuensi tinggi (${freq} utas/10 menit)`);
      }
    } else {
      const dupe = await db.forumReply.findFirst({
        where: { authorName: input.authorContact, body: input.text, createdAt: { gte: since } },
        select: { id: true },
      });
      if (dupe) {
        score += 30;
        reasons.push("balasan duplikat dalam 10 menit");
      }
      const freq = await db.forumReply.count({
        where: { authorName: input.authorContact, createdAt: { gte: since } },
      });
      if (freq >= 3) {
        score += 25;
        reasons.push(`frekuensi tinggi (${freq} balasan/10 menit)`);
      }
    }
  }

  score = Math.min(100, score);
  return { score, reasons, action: decide(score) };
}
