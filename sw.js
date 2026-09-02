/* ═══ Sofortstart: IMMER zuerst aus dem Gerätespeicher ═══
   Die App startet ohne Netzzugriff — auch wenn die Adresse ?v=… enthält
   (Home-Bildschirm-Verknüpfungen speichern diese Parameter mit!).
   Die Aktualisierung läuft danach im Hintergrund; der Update-Balken in der
   App meldet neue Versionen. Nur ?upd= (die Versionsprüfung selbst) und
   ?fresh=1 (Notfall-Neuladen) gehen bewusst zuerst ins Netz. */
const SHELL_CACHE = "famcal-shell-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("famcal-shell-") && k !== SHELL_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const netWithTimeout = (req, ms) => new Promise((resolve) => {
  let done = false;
  const t = setTimeout(() => { if (!done) { done = true; resolve(null); } }, ms);
  fetch(req).then((r) => { if (!done) { done = true; clearTimeout(t); resolve(r); } })
            .catch(() => { if (!done) { done = true; clearTimeout(t); resolve(null); } });
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;            // Supabase & Co. nie anfassen
  const isShell = req.mode === "navigate" || url.pathname.endsWith("familienkalender.html");
  const isAsset = /\/(config\.js|manifest\.webmanifest|icon-\d+\.png|apple-touch-icon\.png)$/.test(url.pathname);
  if (!isShell && !isAsset) return;

  // Versionsprüfung und Notfall-Neuladen: bewusst frisch aus dem Netz
  if (url.searchParams.has("upd") || url.searchParams.get("fresh") === "1") {
    event.respondWith((async () => {
      const r = await netWithTimeout(req, 8000);
      if (r && r.ok && isShell) (await caches.open(SHELL_CACHE)).put("shell", r.clone());
      return r || (await caches.match(isShell ? "shell" : req)) ||
        new Response("Offline", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    })());
    return;
  }

  // Normalfall (auch mit ?v=…): SOFORT aus dem Speicher, Auffrischung im Hintergrund
  event.respondWith((async () => {
    const c = await caches.open(SHELL_CACHE);
    const key = isShell ? "shell" : req;
    const hit = await c.match(key);
    if (hit) {
      event.waitUntil((async () => {
        const fresh = await netWithTimeout(req, 10000);
        if (fresh && fresh.ok) await c.put(key, fresh.clone());
      })());
      return hit;
    }
    const fresh = await netWithTimeout(req, 12000);
    if (fresh && fresh.ok) { await c.put(key, fresh.clone()); return fresh; }
    return fresh || new Response("Offline — bitte einmal mit Internet öffnen.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  })());
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
