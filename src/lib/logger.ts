/**
 * Task 19 (R-062) — Logger terstruktur dengan ring buffer in-memory.
 *
 * • log(level, msg, meta) — baris JSON {ts, level, msg, ...meta} ke stdout
 *   (siap dikumpulkan docker/VPS) dan disimpan ring buffer 250 terakhir
 *   untuk papan kesehatan CMS tanpa dependensi eksternal.
 * • Aman dipanggil dari mana saja (tanpa NextRequest) — tanpa import db.
 */
export type LogLevel = "info" | "warn" | "error" | "security";

interface LogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  meta?: Record<string, unknown>;
}

const RING_MAX = 250;
const ring: LogEntry[] = [];

function push(entry: LogEntry) {
  ring.push(entry);
  if (ring.length > RING_MAX) ring.shift();
  // stdout terstruktur — mudah disaring di VPS: grep '"level":"error"'
  try {
    console.log(JSON.stringify(entry));
  } catch {
    /* stdout gagal (mis. pipa ditutup) — ring tetap terisi */
  }
}

export function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  push({ ts: new Date().toISOString(), level, msg, ...(meta ? { meta } : {}) });
}

/** 250 log terakhir, terbaru di akhir. */
export function recentLogs(limit = 100): LogEntry[] {
  return ring.slice(-Math.min(limit, RING_MAX));
}

/** Statistik level untuk kartu dashboard. */
export function logStats(sinceMs = 60 * 60_000) {
  const since = Date.now() - sinceMs;
  const recent = ring.filter((e) => new Date(e.ts).getTime() >= since);
  const by = { info: 0, warn: 0, error: 0, security: 0 } as Record<LogLevel, number>;
  for (const e of recent) by[e.level]++;
  return { total: recent.length, ...by };
}
