/* sw.js — R-011 Web Push Pengumuman Keberangkatan MUHDIN (service worker).
 * Menangani push event (tampilkan notifikasi) + klik notifikasi (buka URL).
 * Diregistrasi otomatis oleh push-client.ts saat jamaah menyalakan notifikasi.
 */
const CACHE = "muhdin-push-sw-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "MUHDIN — Pengumuman Keberangkatan", body: "Ada pengumuman baru untuk jamaah Anda.", url: "#/pesanan" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-maskable-192.png",
      tag: data.tag || "muhdin-announcement",
      data: { url: data.url },
      dir: "auto",
      lang: "id",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "#/pesanan";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        try {
          const target = new URL(client.url);
          if (target.hash === url || target.href.includes(url)) return client.focus();
        } catch (e) {
          /* abaikan klien dengan URL tidak standar */
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("notificationclose", () => {
  /* tanpa telemetri — privasi jamaah diutamakan */
});

self.addEventListener("message", (event) => {
  if (event.data === CACHE) {
    event.source.postMessage({ ok: true, cache: CACHE });
  }
});
