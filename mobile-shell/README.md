# EduGame — Android Shell (Capacitor, Option A)

Wraps the **hosted** EduGame web app in a native Android WebView. Reuses 100% of
the web (6 games + cookie auth + score sync) — no game re-development.

Full step-by-step plan: [`../GAME_EDUKASI_MOBILE_BUILD_WORKFLOW.md`](../GAME_EDUKASI_MOBILE_BUILD_WORKFLOW.md).

## What is committed here
- `package.json` — Capacitor deps & scripts
- `capacitor.config.ts` — shell config (🔧 fill `server.url`, host, `appId`)
- `dist/index.html` — offline fallback page (real content comes from `server.url`)

## Finish setup (requires Node + Android SDK / Android Studio — run by you)
```bash
cd mobile-shell

# 1) Edit capacitor.config.ts: set HOSTED_URL, HOSTED_HOST, appId   🔧
# 2) Install + add the Android platform (generates android/, git-ignored)
npm install
npx cap add android
npx cap sync android

# 3) Run on a device/emulator (loads the hosted site inside the app)
npx cap run android

# 4) Release build & signing → see workflow Fase 7
```

## Requirements
- Hosted Laravel site live over **HTTPS** (`server.url`), with
  `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax` (workflow Fase 2).
- Android SDK / Android Studio installed locally.

## Notes
- Content/game updates ship via the **web deploy** — the APK is not reinstalled
  for content. A new APK is only needed when this native shell changes.
- App requires **internet** + the server alive (Inertia is server-driven); offline
  shows `dist/index.html`.
