/**
 * MUHDIN Registration Gateway (Task 53) — mini-service realtime.
 *
 * Arsitektur dua listener dalam SATU proses:
 *  1. Port 3003 (publik, via Caddy `/?XTransformPort=3003`) — MURNI socket.io
 *     dengan path '/'. Catatan penting: engine.io dengan path '/' menyita
 *     SEMUA request HTTP yang URL-nya berawalan '/', sehingga endpoint HTTP
 *     biasa MUSTAHIL hidup di port ini (coba /health → 400 Transport unknown).
 *  2. Port 3004 (internal 127.0.0.1) — HTTP murni untuk trigger dari Next.js:
 *     • POST /notify  (header x-mhd-secret) → io.emit ke SEMUA klien socket
 *     • GET  /health  → status gateway untuk pemantauan
 *
 * Payload yang diteruskan TANPA data sensitif (PDP): nomor urut, jenis
 * pendaftar, kota, waktu. Tanpa nama organisasi / kontak / email.
 */
import { createServer } from "http";
import { Server } from "socket.io";

const PUBLIC_PORT = 3003;
const INTERNAL_PORT = Number(process.env.MUHDIN_NOTIFY_PORT || 3004);
const SECRET = process.env.MUHDIN_GATEWAY_SECRET || "muhdin-local-gateway";

const publicServer = httpServerPublic();

const io = new Server(publicServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

/** Jejak kejadian terakhir — dikirim ulang ke klien yang minta sinkronisasi. */
let lastEvent: { event: string; payload?: unknown; at: string } | null = null;

io.on("connection", (socket) => {
  console.log(`Klien terhubung: ${socket.id} (total ${io.engine.clientsCount})`);

  // Klien yang baru bergabung / reconnect bisa meminta potongan terakhir
  // agar papan slot langsung segar tanpa menunggu polling.
  socket.on("sync", () => {
    if (lastEvent) socket.emit(lastEvent.event, lastEvent.payload);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Klien lepas: ${socket.id} (${reason}) (total ${io.engine.clientsCount})`);
  });

  socket.on("error", (err) => {
    console.error(`Socket error (${socket.id}):`, err);
  });
});

/* ------------------------------------------------------------------ */
/* Server INTERNAL (3004) — trigger dari Next.js API                   */
/* ------------------------------------------------------------------ */

const internal = createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/health" || req.url?.startsWith("/health?"))) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "registration-gateway",
        clients: io.engine.clientsCount,
        lastEventAt: lastEvent?.at ?? null,
        lastN: (lastEvent?.payload as { n?: number } | undefined)?.n ?? null,
        uptimeSec: Math.round(process.uptime()),
      })
    );
    return;
  }

  if (req.method === "POST" && (req.url === "/notify" || req.url?.startsWith("/notify?"))) {
    if (req.headers["x-mhd-secret"] !== SECRET) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Secret tidak valid." }));
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 64_000) req.destroy(); // rem badan besar
    });
    req.on("end", () => {
      try {
        const { event, payload } = JSON.parse(body || "{}") as {
          event?: string;
          payload?: unknown;
        };
        if (!event || typeof event !== "string") {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Field 'event' wajib." }));
          return;
        }
        lastEvent = { event, payload, at: new Date().toISOString() };
        io.emit(event, payload);
        console.log(`[broadcast] ${event} → ${io.engine.clientsCount} klien`, JSON.stringify(payload));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, clients: io.engine.clientsCount }));
      } catch {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "JSON tidak valid." }));
      }
    });
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "Not found" }));
});

/* ------------------------------------------------------------------ */
/* Server PUBLIK (3003) — hanya socket.io                              */
/* ------------------------------------------------------------------ */

function httpServerPublic() {
  return createServer((req, res) => {
    // Engine.io menyita semua request berawalan path '/' — baris ini hanya
    // jaring pengaman untuk request aneh yang lolos dari handler engine.
    res.writeHead(426, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Upgrade Required (socket.io only)" }));
  });
}

internal.listen(INTERNAL_PORT, "127.0.0.1", () => {
  console.log(`Internal notify API berjalan di 127.0.0.1:${INTERNAL_PORT}`);
});

publicServer.listen(PUBLIC_PORT, () => {
  console.log(`Registration Gateway (socket.io) berjalan di port ${PUBLIC_PORT}`);
});

(process as NodeJS.Process).on("SIGTERM", () => {
  console.log("SIGTERM — menutup gateway...");
  internal.close();
  process.exit(0);
});
(process as NodeJS.Process).on("SIGINT", () => {
  internal.close();
  process.exit(0);
});
