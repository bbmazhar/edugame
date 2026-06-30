# EduGame — Android App (Capacitor, Standalone / Offline)

A **fully standalone** Android app: the 6 games + local scores are **bundled into
the APK** and run **offline — no server, no internet, no BASE_URL**.

Built as **Option B**: a self-contained React SPA (in `resources/js/standalone/`,
reusing the existing game modules) compiled to `dist/`, which Capacitor packages
into the APK.

## What's here
- `package.json` — Capacitor deps & scripts
- `capacitor.config.ts` — offline config (`webDir: dist`, no `server.url`; 🔧 set `appId`)
- `dist/` — the built standalone SPA (git-ignored; regenerate with `npm run build:standalone`)

## Build the standalone web bundle (from repo root)
```bash
npm install
npm run build:standalone     # → mobile-shell/dist  (the offline app)
```

## Package the APK (needs Android Studio / Android SDK — run by you)
```bash
cd mobile-shell
# 1) edit capacitor.config.ts → set appId   🔧
npm install
npx cap add android          # generates android/ (git-ignored)
npx cap sync android         # copies dist/ into the native project
npx cap run android          # test on a device/emulator (works offline)
# 2) release build + signing → see workflow Fase 7
```

After changing the games/SPA: `npm run build:standalone` (root) then `npx cap sync android`.

## Notes
- No `BASE_URL`, no hosted website, no API needed — everything runs on-device.
- Scores & accessibility settings are stored locally (localStorage), guest-first.
- Updating game content requires shipping a new APK (no live web to push to).
