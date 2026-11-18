/**
 * push-client.ts — R-011 Web Push sisi portal.
 *
 * Alur: cek konfigurasi (GET /api/push) → minta izin Notification →
 * registrasi /sw.js → subscribe push (applicationServerKey = VAPID) →
 * kirim langganan ke POST /api/push (opsional terikat kartu jamaah).
 * Seluruh kegagalan aman: tombol UI hanya menampilkan status jujur.
 */

import { withPort, apiGet } from "@/lib/client-api";

interface PushConfigResult {
  ok: boolean;
  data?: { publicKey: string } | null;
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Benaran: browser mendukung & server punya kunci VAPID. */
export async function pushAvailable(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return false;
    const res = await apiGet<PushConfigResult>("/api/push");
    return !!(res as unknown as { data?: { publicKey?: string } | null })?.data?.publicKey
      || !!(res as unknown as { publicKey?: string })?.publicKey;
  } catch {
    return false;
  }
}

/** Status notifikasi saat ini untuk label tombol. */
export function notificationState(): "default" | "granted" | "denied" | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/** Nyalakan notifikasi: izin + registrasi SW + subscribe + kirim ke server. */
export async function enablePush(cardNo?: string): Promise<{ ok: boolean; message: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, message: "Peramban ini belum mendukung notifikasi push." };
  }
  if (!("Notification" in window)) {
    return { ok: false, message: "Peramban ini tidak mendukung Notification API." };
  }

  // 1 — izin
  const perm = await Notification.requestPermission();
  if (perm !== "granted") {
    return { ok: false, message: "Izin notifikasi tidak diberikan. Aktifkan dari pengaturan peramban bila berubah pikiran." };
  }

  // 2 — kunci publik VAPID dari server
  const res = await fetch(withPort("/api/push")).then((r) => r.json()).catch(() => null);
  const cfg = (res as { data?: { publicKey?: string } | null } | null)?.data ?? res;
  const publicKey = (cfg as { publicKey?: string } | null)?.publicKey;
  if (!publicKey) {
    return { ok: false, message: "Notifikasi belum dikonfigurasi di server. Hubungi sekretariat." };
  }

  // 3 — registrasi service worker
  const reg = await navigator.serviceWorker.register("/sw.js");

  // 4 — subscribe
  const sub = (await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  }).then((s) => s.toJSON() as unknown as PushSubscriptionJSON));
  if (!sub) return { ok: false, message: "Gagal membuat langganan push." };

  // 5 — simpan di server (opsional terikat kartu jamaah)
  const save = await fetch(withPort("/api/push"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub, cardNo: cardNo || undefined }),
  }).catch(() => null);
  if (!save || !save.ok) {
    return { ok: false, message: "Langganan dibuat di peramban, tetapi gagal tersimpan di server." };
  }

  return { ok: true, message: "Notifikasi keberangkatan AKTIF. Anda akan menerima pengumuman MUHDIN." };
}

/** vapid applicationServerKey: base64url → Uint8Array (buffer ArrayBuffer murni). */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
