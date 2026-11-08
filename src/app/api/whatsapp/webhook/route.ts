import { NextRequest, after } from "next/server";
import { getWhatsAppSetting, sendBotReply } from "@/lib/whatsapp";
import {
  askBrain,
  detectLocale,
  hashSender,
  logChat,
  sanitize,
  type BrainChannel,
  type BrainMessage,
  type ChatLocale,
} from "@/lib/ai-brain";

/**
 * MUHDIN v5 Fase 2 — Webhook Chatbot AI WhatsApp (endpoint publik).
 *
 * Satu URL untuk banyak gateway populer Indonesia — payload diparse otomatis:
 *  - WhatsApp Cloud API (Meta)  : entry[].changes[].value.messages[] + verifikasi GET hub.challenge
 *  - Fonnte                      : { sender, message, pushName? }
 *  - Wablas                      : { data: { phone, message, pushName? } } (objek atau array)
 *  - Generic                     : { from|sender, message|text|body }
 *
 * Alur: parse → anti-duplikat → rate limit per pengirim → AI (otak bersama
 * src/lib/ai-brain.ts, KONTEKS HIDUP dari DB) → balas lewat gateway yang sama
 * → log AiChatLog (pengirim di-hash). Respons 200 segera; pemrosesan berat
 * dijalankan lewat `after()` agar gateway tidak timeout.
 *
 * Keamanan:
 *  - GET verifikasi Cloud API membandingkan hub.verify_token dengan
 *    botWebhookSecret (CMS → Pengaturan WhatsApp).
 *  - Bila botWebhookSecret terisi, POST wajib menyertakan rahasia yang sama
 *    pada header X-Webhook-Token atau query ?token=…; bila kosong, terbuka
 *    (mode demo) tetapi tetap rate-limited.
 *  - Saklar induk: botEnabled di CMS → Pengaturan WhatsApp.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============ SESSION MEMORY (in-process, ringan) ============ */
const SESSION_TTL = 30 * 60 * 1000;
const session = new Map<string, { at: number; history: BrainMessage[] }>();
const seenIds = new Map<string, number>(); // anti-duplikat gateway
const senderHits = new Map<string, number[]>(); // rate limit per pengirim

const MAX_HISTORY = 8;
const MAX_PER_MIN = 8;

function getSession(sender: string): BrainMessage[] {
  const now = Date.now();
  const s = session.get(sender);
  if (!s || now - s.at > SESSION_TTL) {
    session.set(sender, { at: now, history: [] });
    return [];
  }
  return s.history;
}
function saveSession(sender: string, history: BrainMessage[]) {
  // Pangkas peta agar memori terjaga
  if (session.size > 500) {
    const now = Date.now();
    for (const [k, v] of session) if (now - v.at > SESSION_TTL) session.delete(k);
  }
  session.set(sender, { at: Date.now(), history });
}

function isDuplicate(id?: string): boolean {
  if (!id) return false;
  if (seenIds.has(id)) return true;
  seenIds.set(id, Date.now());
  if (seenIds.size > 1000) {
    const now = Date.now();
    for (const [k, t] of seenIds) if (now - t > 10 * 60 * 1000) seenIds.delete(k);
  }
  return false;
}

function tooFast(sender: string): boolean {
  const now = Date.now();
  const hits = (senderHits.get(sender) || []).filter((t) => now - t < 60_000);
  if (hits.length >= MAX_PER_MIN) {
    senderHits.set(sender, hits);
    return true;
  }
  hits.push(now);
  senderHits.set(sender, hits);
  return false;
}

/* ============ PARSER MULTI-PROVIDER ============ */

type Incoming = { from: string; text: string; id?: string; name?: string };

function extractIncoming(body: unknown): Incoming[] {
  const out: Incoming[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  // 1) WhatsApp Cloud API (Meta)
  if (Array.isArray(b.entry)) {
    for (const e of b.entry as Array<Record<string, unknown>>) {
      for (const ch of (e?.changes ?? []) as Array<Record<string, unknown>>) {
        const v = (ch?.value ?? {}) as Record<string, unknown>;
        for (const m of (v.messages ?? []) as Array<Record<string, unknown>>) {
          const text = (m?.text as Record<string, unknown> | undefined)?.body;
          if (typeof text === "string" && m?.from) {
            out.push({
              from: String(m.from),
              text: text,
              id: m.id ? String(m.id) : undefined,
              name:
                String(
                  (v.contacts as Array<{ profile?: { name?: string } }> | undefined)?.[0]?.profile?.name ?? ""
                ) || undefined,
            });
          }
        }
      }
    }
    return out;
  }

  // 2) Wablas — { data: {...} | [{...}] }
  if (b.data) {
    const arr = Array.isArray(b.data) ? b.data : [b.data];
    for (const d of arr as Array<Record<string, unknown>>) {
      const from = d.phone || d.sender || d.from;
      const text = d.message ?? (d.text as Record<string, unknown> | undefined)?.body ?? d.text;
      if (from && typeof text === "string" && text.trim()) {
        out.push({
          from: String(from),
          text: text.trim(),
          id: d.id ? String(d.id) : undefined,
          name: (d.pushName || d.name) as string | undefined,
        });
      }
    }
    return out;
  }

  // 3) Fonnte & generic
  const from = (b.sender || b.from || b.phone) as string | undefined;
  const text = (b.message ?? b.text ?? b.body) as unknown;
  if (from && typeof text === "string" && text.trim()) {
    out.push({
      from: String(from),
      text: text.trim(),
      id: b.id ? String(b.id) : undefined,
      name: (b.pushName || b.name) as string | undefined,
    });
  }
  return out;
}

/* ============ GET — verifikasi webhook Cloud API ============ */

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge) {
    const cfg = await getWhatsAppSetting();
    const secret = cfg.botWebhookSecret || process.env.WHATSAPP_VERIFY_TOKEN || "";
    if (!secret || token === secret) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Health endpoint webhook
  const cfg = await getWhatsAppSetting();
  return Response.json({
    ok: true,
    service: "MUHDIN WhatsApp AI Chatbot",
    botEnabled: cfg.botEnabled,
    secured: Boolean(cfg.botWebhookSecret),
    providers: ["WHATSAPP_CLOUD_API", "FONNTE", "WABLAS", "GENERIC"],
  });
}

/* ============ POST — pesan masuk → balasan AI ============ */

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 200 });
  }

  // Rahasia bersama (bila dikonfigurasi)
  const cfg = await getWhatsAppSetting();
  if (cfg.botWebhookSecret) {
    const given =
      req.headers.get("x-webhook-token") ||
      new URL(req.url).searchParams.get("token") ||
      "";
    if (given !== cfg.botWebhookSecret) {
      return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  const incoming = extractIncoming(body);
  if (incoming.length === 0) {
    // Status delivery (Cloud API) / ping — tidak perlu balasan.
    return Response.json({ ok: true, ignored: true });
  }

  // Pemrosesan berat SETELAH respons terkirim (gateway tidak menunggu AI).
  after(async () => {
    if (!cfg.botEnabled) return;

    for (const msg of incoming) {
      if (isDuplicate(msg.id)) continue;
      if (tooFast(msg.from)) continue;

      const text = sanitize(msg.text);
      if (!text) continue;

      const locale: ChatLocale = detectLocale(text);
      const channel: BrainChannel = "WHATSAPP";
      const history = getSession(msg.from);
      const withUser: BrainMessage[] = [...history, { role: "user" as const, content: text }].slice(
        -MAX_HISTORY
      );

      try {
        const { reply, latencyMs } = await askBrain({
          history: withUser,
          locale,
          channel,
        });

        if (reply) {
          const send = await sendBotReply(cfg.provider, cfg.apiUrl, cfg.token, msg.from, reply);
          saveSession(msg.from, [...withUser, { role: "assistant" as const, content: reply }].slice(-MAX_HISTORY));
          await logChat({
            channel,
            locale,
            question: text,
            answer: reply,
            userHash: hashSender(msg.from),
            latencyMs,
          });
          if (!send.sent) {
            console.warn(
              `[wa/webhook] balasan gagal terkirim ke ${hashSender(msg.from)}: ${send.detail}`
            );
          }
        }
      } catch (err) {
        console.error("[wa/webhook]", err);
      }
    }
  });

  return Response.json({ ok: true });
}
