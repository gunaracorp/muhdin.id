/**
 * ai-brain.ts — Otak AI bersama MUHDIN v5 (Fase 2).
 *
 * Satu sumber kecerdasan untuk dua kanal:
 *  1. Sahabat MUHDIN Concierge Pro  (portal, streaming SSE)
 *  2. Chatbot AI WhatsApp           (webhook gateway + halaman tester)
 *
 * Keunggulan v5 ("Pro"):
 *  - KONTEKS HIDUP: setiap sesi menyuntikkan data nyata dari DB
 *    (jumlah anggota terverifikasi, sebaran provinsi, 13 ekosistem,
 *    agenda terdekat, berita terbaru, FAQ) — AI tidak mengarang data.
 *  - Cache konteks 5 menit agar DB tidak dipukul pada tiap pesan.
 *  - Dua mode output: streaming (portal) & teks utuh (WhatsApp).
 *  - Log percakapan ke AiChatLog (tanpa identitas pribadi — di-hash).
 *
 * z-ai-web-dev-sdk hanya boleh dipakai di server (backend).
 */
import ZAI from "z-ai-web-dev-sdk";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export type ChatLocale = "id" | "en" | "ar";
export type BrainMessage = { role: "user" | "assistant"; content: string };
export type BrainChannel = "PORTAL" | "WHATSAPP";

const CTX_TTL_MS = 5 * 60 * 1000;
const MAX_HISTORY = 12;
const MAX_QUESTION = 2000;

/* ================= KONTEKS HIDUP DARI DATABASE ================= */

type LiveContext = { text: string; at: number };
let ctxCache: LiveContext | null = null;

async function queryLiveFacts() {
  const now = new Date();

  const [memberTotal, memberVerified, provinces, ecosystems, events, articles, faqs] =
    await Promise.all([
      db.member.count(),
      db.member.count({ where: { status: "TERVERIFIKASI" } }),
      db.member.groupBy({ by: ["province"] }),
      db.ecosystem.findMany({ orderBy: { number: "asc" }, select: { name: true }, take: 13 }),
      db.event.findMany({
        where: { published: true, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 3,
        select: { title: true, startsAt: true, location: true },
      }),
      db.article.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { title: true, createdAt: true },
      }),
      db.faq.findMany({ orderBy: { order: "asc" }, take: 6, select: { question: true, answer: true } }),
    ]);

  return {
    memberTotal,
    memberVerified,
    provinceCount: provinces.length,
    provinceSample: provinces.slice(0, 8).map((p) => p.province),
    ecosystems: ecosystems.map((e) => e.name),
    events,
    articles,
    faqs,
  };
}

/** Bangun blok fakta (bahasa netral + label trilingual ringkas) untuk system prompt. */
export async function getLiveContext(force = false): Promise<string> {
  if (!force && ctxCache && Date.now() - ctxCache.at < CTX_TTL_MS) return ctxCache.text;

  let text: string;
  try {
    const f = await queryLiveFacts();
    const fmt = (d: Date | null) =>
      d ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d) : "-";
    const lines = [
      `DATA HIDUP PORTAL MUHDIN (ambil dari database, jamak boleh disebut ke pengguna):`,
      `- Anggota terdaftar: ${f.memberTotal} organisasi; terverifikasi: ${f.memberVerified}; tersebar di ${f.provinceCount} provinsi (contoh: ${f.provinceSample.join(", ")}).`,
      `- 13 layanan ekosistem: ${f.ecosystems.join("; ")}.`,
      `- Agenda terdekat: ${f.events.length ? f.events.map((e) => `${e.title} (${fmt(e.startsAt)}, ${e.location})`).join(" | ") : "belum ada agenda mendatang"}.`,
      `- Berita terbaru: ${f.articles.map((a) => `${a.title} (${fmt(a.createdAt)})`).join(" | ")}.`,
      `- FAQ populer:`,
      ...f.faqs.map((q) => `  * Q: ${q.question}\n    A: ${q.answer.slice(0, 180)}`),
    ];
    text = lines.join("\n");
  } catch {
    text = "DATA HIDUP: database sedang tidak dapat diakses — jangan sebut angka spesifik; arahkan ke halaman verifikasi.";
  }

  ctxCache = { text, at: Date.now() };
  return text;
}

/* ================= SYSTEM PROMPT (3 BAHASA) ================= */

const IDENTITY: Record<ChatLocale, string> = {
  id: `Kamu adalah "Sahabat MUHDIN" — asisten AI resmi Portal MUHDIN Indonesia (MU = Masyarakat, U = Umroh, H = Haji, D = Digital, I = Indonesia), asosiasi haji & umrah digital pertama di dunia.

IDENTITAS & TUGAS:
- Pemandu ibadah yang hangat, adab, dan berilmu: menjawab pertanyaan seputar haji, umrah, manasik, doa, dan persiapan perjalanan.
- Mewakili ekosistem MUHDIN: 13 layanan bisnis (PPIU/PIHK, travel, hotel, katering, transportasi, vaksin, dokumen paspor-visa, asuransi, perlengkapan, pelatihan manasik, dll), direktori anggota terverifikasi, cek verifikasi penyelenggara, portal berita & tutorial, pelacakan pendaftaran, dan integrasi Nusuk (Kementerian Haji Arab Saudi).
- Warisan: MUHDIN pewaris garis pelopor PHI (Perjalanan Haji Indonesia) & IPHI (Ikatan Persaudaraan Haji Indonesia) yang menyelenggarakan haji sebelum Kemenag RI berdiri (1946).

GAYA JAWAB:
- Buka dengan salam ringan bila pas (mis. "Assalamu'alaikum" saat sapaan pertama), gunakan Bahasa Indonesia yang santun dan mudah dipahami.
- Ringkas dan terstruktur: maksimal ~180 kata, pakai poin/daftar bila membantu, tebal **penting**.
- Bila pertanyaan keluar dari topik haji/umrah/MUHDIN, jawab singkat lalu arahkan kembali dengan sopan.
- Bila ditanya data resmi/kebijakan yang tidak kamu ketahui pastinya, sarankan menghubungi WhatsApp resmi 0811 1116 5165 atau menuju halaman verifikasi (#/verifikasi) — jangan mengarang angka atau regulasi.
- Tidak pernah memberi fatwa; untuk masalah fikih yang khidmat, sarankan konsultasi ke ustadz/mufti terpercaya.`,
  en: `You are "Sahabat MUHDIN" — the official AI assistant of MUHDIN Indonesia Portal (MU = Masyarakat, U = Umroh, H = Haji, D = Digital, I = Indonesia), the world's first digital hajj & umrah association.

IDENTITY & TASK:
- A warm, respectful, knowledgeable pilgrimage guide: answer questions about hajj, umrah, rituals (manasik), prayers, and travel preparation.
- Represent the MUHDIN ecosystem: 13 business services (PPIU/PIHK operators, travel, hotels, catering, transport, vaccination, passport & visa documents, insurance, equipment, manasik training, etc.), verified member directory, organizer verification check, news & tutorial portal, application tracking, and Nusuk integration (Saudi Ministry of Hajj).
- Heritage: MUHDIN inherits the pioneer line of PHI (Perjalanan Haji Indonesia) & IPHI (Ikatan Persaudaraan Haji Indonesia), organizing hajj before Indonesia's Ministry of Religious Affairs existed (1946).

ANSWER STYLE:
- A brief Islamic greeting when appropriate, clear and friendly English.
- Concise and structured: max ~180 words, use bullets when helpful, bold **key points**.
- If a question drifts off-topic (hajj/umrah/MUHDIN), answer briefly then politely steer back.
- For official data/policy you are unsure about, suggest the official WhatsApp +62 811 1116 5165 or the verification page (#/verifikasi) — never invent numbers or regulations.
- Never issue fatwas; for sensitive fiqh matters, advise consulting a trusted scholar.`,
  ar: `أنت "صاحب مُهدين" — المساعد الذكي الرسمي لبوابة مُهدين إندونيسيا (أول جمعية رقمية للحج والعمرة في العالم).

الهوية والمهمة:
- مرشد حج وعمرة ودود ومؤدب وذي علم: تجيب عن أسئلة الحج والعمرة والمناسك والأدعية والاستعداد للرحلة.
- تمثّل منظومة مُهدين: ١٣ خدمة (منظمو الرحلات PPIU/PIHK، الفنادق، النقل، التغذية، التطعيمات، الجوازات والتأشيرات، التأمين، تدريب المناسك...) ودليل الأعضاء الموثوقين والتحقق ونسك (وزارة الحج السعودية).
- الإرث: مُهدين وريث خط الرواد PHI وIPHI الذين نظّموا الحج قبل تأسيس وزارة الشؤون الدينية الإندونيسية (١٩٤٦).

أسلوب الإجابة:
- ابدأ بالسلام اللطيف عند المناسبة، وبالعربية الفصحى الميسّرة.
- موجز ومنظم: ~١٨٠ كلمة كأقصى حد، استخدم النقاط عند الحاجة.
- إذا خرج السؤال عن الحج والعمرة، أجب باختصار ثم عد بالمحبة إلى الموضوع.
- لا تفتِ أرقاماً أو لوائح غير مؤكدة؛ وجّه إلى واتساب الرسمي أو صفحة التحقق.
- لا تصدر فتاوى؛ للفقه الحساس وجّه إلى عالم موثوق.`,
};

const CHANNEL_RULES: Record<BrainChannel, Record<ChatLocale, string>> = {
  PORTAL: {
    id: "\nKANAL: widget portal web. Boleh memakai markdown ringan (**tebal**, poin). Tawarkan tautan internal bila relevan (#/verifikasi, #/anggota, #/berita, #/agenda, #/faq).",
    en: "\nCHANNEL: web portal widget. Light markdown allowed (**bold**, bullets). Offer internal links when relevant (#/verifikasi, #/anggota, #/berita, #/agenda, #/faq).",
    ar: "\nالقناة: أداة البوابة الإلكترونية. يُسمح بتنسيق خفيف. اعرض الروابط الداخلية عند الحاجة.",
  },
  WHATSAPP: {
    id: "\nKANAL: WhatsApp. Jawab dalam TEKS POLOS gaya WhatsApp (penekanan pakai *bintang tunggal*, poin pakai tanda \"•\" atau angka) — TANPA markdown (**), TANPA tautan [#]. Maksimal ~110 kata per balasan. Akhiri dengan tawaran bantuan lanjut bila relevan.",
    en: "\nCHANNEL: WhatsApp. Reply in PLAIN WhatsApp-style text (emphasis with *single asterisks*, bullets with \"•\" or numbers) — NO markdown (**), NO [#] links. Max ~110 words per reply. End with an offer of further help when relevant.",
    ar: "\nالقناة: واتساب. رُد بنص عادي بأسلوب واتساب (التأكيد بنجمة واحدة، النقاط بـ «•» أو أرقام) — بلا تنسيق ماركداون وبلا روابط. بحدود ١١٠ كلمة. اختم بعرض مساعدة إضافية عند الحاجة.",
  },
};

/* ================= INTI: BANGUN PESAN ================= */

export function sanitize(raw: unknown): string {
  return String(raw ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, MAX_QUESTION);
}

export function sanitizeHistory(raw: unknown): BrainMessage[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .filter(
      (m): m is BrainMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as BrainMessage).role === "user" || (m as BrainMessage).role === "assistant") &&
        typeof (m as BrainMessage).content === "string"
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: sanitize(m.content) }));
}

async function buildMessages(
  history: BrainMessage[],
  locale: ChatLocale,
  channel: BrainChannel
) {
  const [ctx] = await Promise.all([getLiveContext()]);
  const system = `${IDENTITY[locale]}${CHANNEL_RULES[channel][locale]}\n\n${ctx}`;
  return [{ role: "assistant" as const, content: system }, ...history];
}

/** Deteksi bahasa sederhana untuk pesan WhatsApp masuk. */
export function detectLocale(text: string): ChatLocale {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  const t = text.toLowerCase();
  const enHits = ["hajj", "umrah", "package", "verify", "membership", "how to", "what is", "price", "cost"];
  const idHits = ["haji", "umroh", "paket", "verifikasi", "keanggotaan", "bagaimana", "apa itu", "biaya", "daftar"];
  const en = enHits.filter((k) => t.includes(k)).length;
  const id = idHits.filter((k) => t.includes(k)).length;
  return en > id ? "en" : "id";
}

export function hashSender(raw: string): string {
  return createHash("sha256").update(`muhdin-v5:${raw}`).digest("hex").slice(0, 24);
}

/* ================= MODE 1: TEKS UTUH (WhatsApp + fallback) ================= */

/** Rapikan jawaban AI ke teks polos gaya WhatsApp (markdown → format WA). */
export function toWhatsAppText(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "*$1*") // **tebal** → *tebal*
    .replace(/\[([^\]]+)\]\(#[^)]*\)/g, "$1") // [teks](#/link) → teks
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [teks](url) → teks
    .replace(/^#{1,6}\s+/gm, "") // heading markdown → polos
    .trim();
}

export async function askBrain(opts: {
  history: BrainMessage[];
  locale: ChatLocale;
  channel: BrainChannel;
}): Promise<{ reply: string; latencyMs: number }> {
  const started = Date.now();
  const zai = await ZAI.create();
  const messages = await buildMessages(opts.history, opts.locale, opts.channel);
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });
  const raw = String(completion.choices[0]?.message?.content ?? "").trim();
  // Kanal WhatsApp: pastikan teks polos gaya WA (bukan markdown).
  const reply = opts.channel === "WHATSAPP" ? toWhatsAppText(raw) : raw;
  return { reply, latencyMs: Date.now() - started };
}

/* ================= MODE 2: STREAMING (portal Concierge Pro) ================= */

/** Yield potongan teks seiring model menulis. Fallback: satu potong utuh. */
export async function* streamBrain(opts: {
  history: BrainMessage[];
  locale: ChatLocale;
  channel: BrainChannel;
}): AsyncGenerator<string, void, undefined> {
  const zai = await ZAI.create();
  const messages = await buildMessages(opts.history, opts.locale, opts.channel);

  try {
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
      stream: true,
    });
    let emitted = false;
    for await (const chunk of completion as unknown as AsyncIterable<{
      choices?: Array<{ delta?: { content?: string | null } }>;
    }>) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) {
        emitted = true;
        yield delta;
      }
    }
    if (!emitted) {
      const { reply } = await askBrain(opts);
      yield reply || "";
    }
  } catch {
    // Streaming tidak tersedia/gagal di tengah → fallback jawaban utuh.
    const { reply } = await askBrain(opts);
    yield reply;
  }
}

/* ================= LOG (privasi-aman) ================= */

export async function logChat(entry: {
  channel: BrainChannel;
  locale: ChatLocale;
  question: string;
  answer: string;
  userHash: string;
  latencyMs: number;
}) {
  try {
    await db.aiChatLog.create({
      data: {
        channel: entry.channel,
        locale: entry.locale,
        question: entry.question.slice(0, 2000),
        answer: entry.answer.slice(0, 6000),
        userHash: entry.userHash,
        latencyMs: entry.latencyMs,
      },
    });
  } catch {
    /* logging tidak boleh menggagalkan jawaban */
  }
}
