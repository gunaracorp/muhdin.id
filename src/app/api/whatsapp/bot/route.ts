import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import {
  askBrain,
  hashSender,
  logChat,
  sanitizeHistory,
  type BrainChannel,
  type BrainMessage,
  type ChatLocale,
} from "@/lib/ai-brain";

/**
 * MUHDIN v5 Fase 2 — Otak Chatbot WhatsApp untuk HALAMAN TESTER publik
 * (#/whatsapp-ai). Endpoint ini MENGGUNAKAN otak yang sama persis dengan
 * webhook /api/whatsapp/webhook (kanal WHATSAPP: teks polos gaya WA,
 * maksimal ~110 kata), sehingga yang diuji pengguna = yang dijalankan bot.
 *
 * Bedanya dengan webhook: tanpa gateway — balasan langsung dikembalikan
 * sebagai JSON agar halaman demo bisa menampilkannya. Riwayat percakapan
 * dikelola klien (dikirim ulang tiap permintaan, maks 8 pesan).
 *
 * Keamanan: rate limit 20 pesan/menit/IP; riwayat disanitasi; log AiChatLog.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "wa-bot", 20, 60_000)) {
    return Response.json(
      { error: "Terlalu banyak pesan. Mohon jeda sebentar, ya." },
      { status: 429 }
    );
  }

  let body: { message?: unknown; history?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const question = String(body.message ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, 2000);
  if (!question) {
    return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  }

  const channel: BrainChannel = "WHATSAPP";
  const locale: ChatLocale =
    body.locale === "en" || body.locale === "ar" ? body.locale : "id";

  const clientHistory = sanitizeHistory(body.history);
  // Pertanyaan terkini WAJIB jadi pesan user terakhir (kontrak API chat).
  const history: BrainMessage[] = [
    ...clientHistory.slice(-7),
    { role: "user", content: question },
  ];

  const started = Date.now();
  try {
    const { reply } = await askBrain({ history, locale, channel });

    await logChat({
      channel,
      locale,
      question,
      answer: reply,
      userHash: hashSender(req.headers.get("x-forwarded-for") || "local"),
      latencyMs: Date.now() - started,
    });

    return Response.json({ reply });
  } catch (err) {
    console.error("[wa/bot]", err);
    return Response.json(
      { error: "Layanan AI sedang sibuk. Silakan coba beberapa saat lagi." },
      { status: 503 }
    );
  }
}
