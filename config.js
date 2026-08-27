/* ═══════════════════════════════════════════════════════════════════
   Unser Kalender — Zugangsdaten
   ═══════════════════════════════════════════════════════════════════
   Diese Datei EINMAL ausfüllen und hochladen. Bei künftigen Updates
   nur noch familienkalender.html ersetzen — diese Datei bleibt liegen
   und wird NICHT überschrieben.

   Wo finde ich die Werte?
   • SUPABASE_URL + SUPABASE_ANON_KEY:
     supabase.com → dein Projekt → Project Settings → API
     („Project URL" und der Schlüssel „anon public")
   • FAMILY_EMAIL: die E-Mail des Familien-Benutzers (Authentication → Users)
   • VAPID_PUBLIC_KEY: nur für Push-Mitteilungen nötig —
     steht kopierfertig in ANLEITUNG-PUSH.md. Sonst leer lassen.

   Bleiben alle Felder leer, läuft die App im Demo-Modus
   (Daten nur auf diesem einen Gerät, keine Familien-Synchronisierung).
   ═══════════════════════════════════════════════════════════════════ */

window.FAMILY_CONFIG = {
 SUPABASE_URL:      "https://jpnrqexhzavzbisxuxhc.supabase.co",   // z. B. "https://abcdefgh.supabase.co"
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwbnJxZXhoemF2emJpc3h1eGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjQzODMsImV4cCI6MjEwMDIwMDM4M30.9E-BMyzWM8nCd-6-nqA4dvw8yhDAyeFRp0P_EwtbsVU",   // der "anon public" Key aus Supabase → Settings → API
  FAMILY_EMAIL:      "familie@adam.de",    // die E-Mail des Familien-Benutzers, z. B. "familie@beispiel.de"
  VAPID_PUBLIC_KEY:  "BBjT9yRmPcxgS51bkiQBpNzOKOXQ6BrB5sC_pNonKoCBlwQM-yj5x5AmH24nBV5MpW3i_5RT3uOomjohJvm0v2I",
};
