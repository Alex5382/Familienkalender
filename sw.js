/* Sofortstart-Cache: App lädt aus dem Gerätespeicher, Netz aktualisiert im Hintergrund.
   Aufrufe mit ?-Parametern (Update-Knopf, Update-Prüfung) gehen IMMER zuerst ins Netz. */
const SHELL_CACHE = "famcal-shell-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase & Co. nie anfassen
  const isShell = req.mode === "navigate" || url.pathname.endsWith("familienkalender.html");
  if (!isShell) return;
  if (url.search) {
    // frisch erzwungen (?v=…, ?upd=…): Netz zuerst, Cache auffrischen, Cache nur als Notnagel
    event.respondWith(
      fetch(req).then((r) => { if (r.ok) caches.open(SHELL_CACHE).then((c) => c.put("shell", r.clone())); return r; })
        .catch(() => caches.match("shell"))
    );
  } else {
    // Normalstart: sofort aus dem Cache, parallel im Hintergrund aktualisieren
    event.respondWith((async () => {
      const c = await caches.open(SHELL_CACHE);
      const hit = await c.match("shell");
      const net = fetch(req).then((r) => { if (r.ok) c.put("shell", r.clone()); return r; }).catch(() => null);
      if (hit) { net.catch(() => {}); return hit; }
      const fresh = await net;
      return fresh || new Response("Offline — bitte einmal mit Internet öffnen.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    })());
  }
});

/* Unser Kalender – Service Worker für Push-Erinnerungen */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "🔔 Erinnerung", body: "" };
  try { data = { ...data, ...event.data.json() }; } catch (e) { if (event.data) data.body = event.data.text(); }
  try { if (self.navigator.setAppBadge) self.navigator.setAppBadge(new Date().getDate()); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag || undefined,
      icon: "icon-192.png",
      badge: "icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      return self.clients.openWindow("./");
    })
  );
});
