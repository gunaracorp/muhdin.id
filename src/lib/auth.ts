import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "muhdin_session";
const SESSION_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const original = Buffer.from(hash, "hex");
    return candidate.length === original.length && timingSafeEqual(candidate, original);
  } catch {
    return false;
  }
}

/** R-077 — ringkasan perangkat dari User-Agent (Chrome · Windows, dsb.). */
export function summarizeDevice(ua?: string | null): string {
  if (!ua) return "Perangkat tidak dikenal";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : /curl|Postman|insomnia/i.test(ua) ? "API Client"
    : "Browser";
  const os = /Windows/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad|iOS/.test(ua) ? "iOS"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : "";
  return os ? `${browser} · ${os}` : browser;
}

/** R-077 — metadata perangkat yang ikut tersimpan per sesi. */
export interface SessionMeta {
  userAgent?: string | null;
  ip?: string | null;
}

export async function createSession(userId: string, meta?: SessionMeta) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent: meta?.userAgent?.slice(0, 400) || null,
      ip: meta?.ip || null,
      device: summarizeDevice(meta?.userAgent),
      lastSeenAt: new Date(),
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Cookie Secure saat produksi (hosting sudah HTTPS). Di dev/preview lokal
    // tetap non-secure agar login tetap berfungsi tanpa SSL.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    // Multi-admin (Task 15-c): akun yang dinonaktifkan/dihapus oleh Super
    // Admin kehilangan akses seketika — sesi ikut dibersihkan.
    if (!session.user.isActive) {
      await db.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
      return null;
    }
    // R-077 — denyut lastSeenAt (maks sekali per 2 menit agar hemat tulis).
    if (session.revokedAt) return null;
    if (Date.now() - new Date(session.lastSeenAt).getTime() > 2 * 60_000) {
      await db.session
        .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
        .catch(() => {});
    }
    return session.user;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Returns user if admin session valid, else null — used inside API routes */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

/** Multi-admin: sesi valid DAN peran SUPER_ADMIN, else null. */
export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (!user || user.role !== "SUPER_ADMIN") return null;
  return user;
}
