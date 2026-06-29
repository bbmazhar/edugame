# GAME EDUKASI — MOBILE (ANDROID) BUILD WORKFLOW

> Deliverable workflow untuk dieksekusi **step-by-step oleh Claude Code**.
> **Arsitektur terkunci: OPSI A — Capacitor WRAP URL hosted** (rekomendasi terbaik; reuse 100% web).
> Distribusi: **APK langsung** (bukan Play Store). Update **konten otomatis via web**; **self-update APK hanya bila shell native/plugin berubah** (Fase 6, opsional).
>
> Aturan eksekusi: satu fase per langkah, lulus **Checkpoint** sebelum lanjut.
> **🔧 [ISI: …]** = nilai yang harus diisi manusia. **JANGAN invent** — pakai fakta Fase 0.

---

## FASE 0 — HASIL AUDIT (fakta terkunci)

**Stack web aktual (dari `composer.lock`/`package.json`):** Laravel **13.17** · `inertiajs/inertia-laravel` **v3.1** · `@inertiajs/react` **v3** · React **19.2** · Tailwind **v4** · Vite **8** · Filament **v3.3.54** · Fortify (**session/cookie**) + passkeys + 2FA. **Tidak ada** `routes/api.php`, **tanpa** Sanctum.

**6 game = client-side React** (`resources/js/games/`), **murni DOM/CSS + tap**, **tanpa** audio/drag/canvas/Phaser/framer-motion; timer `setInterval/setTimeout`.

**Kopling (kritis):** seluruh app **Inertia server-driven** + **auth cookie**; skor via `fetch POST /sessions` (web route + **CSRF cookie**, same-origin). → **Cocok sempurna untuk WRAP**: WebView memuat situs hosted, cookie/CSRF same-origin jalan apa adanya, **zero re-dev game**.

**Kenapa A (bukan B/C):** karena app ter-couple erat ke Inertia + cookie session, A me-reuse semuanya tanpa membangun API token (B) atau menulis ulang 6 game (C). **Trade-off A: wajib online + server hosted hidup** (inheren Inertia 2).

---

## FASE 1 — KEPUTUSAN ARSITEKTUR (TERKUNCI: A)

**Tujuan:** Kunci arah workflow.
**Keputusan:** **A — Capacitor wrap URL hosted.** (Rekomendasi terbaik berdasarkan audit.)
**Implikasi:** reuse 100% web; **butuh internet**; **tanpa** lapisan API baru; **tanpa** rewrite game; self-update APK **opsional** (hanya saat shell native berubah).
**Checkpoint — Selesai kalau:** keputusan A tercatat. ✅
**Dependency:** Fase 0.

---

## FASE 2 — PRASYARAT SERVER HOSTED (web sudah ada)

**Tujuan:** Pastikan situs Laravel/Inertia ter-deploy publik (HTTPS) & cookie ramah-WebView.

**File diubah (server):**
```
.env                      (APP_URL, SESSION_*, cookie)
config/session.php        (verifikasi same_site/secure)
```

**Perintah / langkah:**
```bash
# Deploy mengikuti DEPLOYMENT.md (Fase 8 web): migrate --force, ProductionSeeder, optimize, build.
```

**Kode kunci / konfigurasi** — `.env` produksi (server):
```dotenv
APP_URL=https://[BASE_URL]            # 🔧 [ISI: domain hosted, HTTPS]
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true            # WebView via HTTPS
SESSION_SAME_SITE=lax                 # cookie tetap terkirim di navigasi WebView same-origin
```

**Checkpoint — Selesai kalau:**
- `https://[BASE_URL]/` (landing), `/katalog`, `/main/hitung-cepat?level=SD` → **200** di browser HP.
- Login (email/password) di browser HP berhasil & sesi bertahan (cookie OK).
**Dependency:** Fase 1. 🔧 [ISI: `BASE_URL`].

---

## FASE 3 — SCAFFOLD CAPACITOR (shell native terpisah)

**Tujuan:** Buat shell Capacitor (folder terpisah agar tak ganggu build Vite web) yang memuat URL hosted.

**File dibuat:**
```
mobile-shell/                       (BARU — sibling repo web)
  package.json
  capacitor.config.ts
  dist/index.html                   (halaman fallback offline minimal)
  android/                          (di-generate `cap add android`)
```

**Perintah terminal EXACT:**
```bash
mkdir mobile-shell && cd mobile-shell
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android \
  @capacitor/app @capacitor/status-bar @capacitor/splash-screen @capacitor/network
npx cap init EduGame com.edugame.app --web-dir=dist   # 🔧 [ISI: appId final]
mkdir -p dist && printf '<!doctype html><meta charset=utf-8><title>EduGame</title><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>EduGame</h1><p>Tidak ada koneksi. Periksa internet lalu coba lagi.</p><button onclick="location.reload()">Coba lagi</button></body>' > dist/index.html
npx cap add android
npx cap sync android
```

**Kode kunci / konfigurasi** — `capacitor.config.ts`:
```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.edugame.app',            // 🔧 [ISI]
  appName: 'EduGame',
  webDir: 'dist',                      // hanya fallback offline; konten asli dari server.url
  server: {
    url: 'https://[BASE_URL]',         // 🔧 [ISI: domain hosted]
    cleartext: false,                  // wajib HTTPS
    allowNavigation: ['[BASE_URL_HOST]'], // 🔧 [ISI: host saja, mis. app.edugame.id]
  },
  android: { backgroundColor: '#FDFDFC' },
};
export default config;
```

**Checkpoint — Selesai kalau:** `npx cap run android` (emulator/HP) memuat **situs hosted di dalam app** (landing EduGame tampil) — 6 game dapat dibuka & dimainkan langsung.
**Dependency:** Fase 2.

---

## FASE 4 — KONFIG NATIVE (id, ikon, splash, back, izin, link)

**Tujuan:** Perilaku app native rapi: tombol back, status bar, splash, izin minimal, link eksternal aman.

**File dibuat/diubah:**
```
mobile-shell/android/app/src/main/AndroidManifest.xml   (izin INTERNET; label app)
mobile-shell/android/app/src/main/res/                   (ikon mipmap, splash)
mobile-shell/src/native.ts → (script kecil di dist/index.html bila perlu)
mobile-shell/android/app/build.gradle                    (applicationId, versionCode/Name)
```

**Perintah terminal EXACT:**
```bash
cd mobile-shell
# (opsional) generator ikon/splash:
npm install -D @capacitor/assets
npx capacitor-assets generate --android     # butuh assets/icon.png & splash.png  🔧 [ISI aset]
npx cap sync android
```

**Kode kunci / konfigurasi:**
- `AndroidManifest.xml`: pastikan `<uses-permission android:name="android.permission.INTERNET"/>` (default). **Tidak** butuh izin lain untuk A.
- **Tombol back → history WebView** (via `@capacitor/app`): hubungkan `App.addListener('backButton', …)` ke `window.history.back()` agar back menavigasi Inertia, bukan langsung keluar.
- **Link eksternal** (mis. tautan `laravel.com/docs` di landing): buka di browser sistem, bukan terjebak di WebView (gunakan `allowNavigation` ketat + `@capacitor/browser` untuk host lain).
- `build.gradle`: `applicationId "com.edugame.app"` · `versionCode 1` · `versionName "1.0.0"` · `minSdkVersion 23`.

**Checkpoint — Selesai kalau:** back button menavigasi mundur dalam app (bukan langsung exit dari beranda); splash & ikon tampil; tautan eksternal membuka browser sistem.
**Dependency:** Fase 3.

---

## FASE 5 — AUTH & CSRF DALAM WEBVIEW (verifikasi)

**Tujuan:** Pastikan login cookie, CSRF, dan simpan skor jalan di dalam WebView (tanpa kode baru — verifikasi konfigurasi).

**File diubah (bila perlu, server):**
```
config/session.php / .env     (SESSION_SAME_SITE=lax, SESSION_SECURE_COOKIE=true — dari Fase 2)
```

**Kode kunci / konfigurasi:**
- Karena `server.url` = domain hosted → **WebView same-origin** → cookie sesi Fortify & **`XSRF-TOKEN`** terbaca; `fetch POST /sessions` (header `X-XSRF-TOKEN`) **jalan apa adanya** (kode `resources/js/lib/csrf.ts` tak diubah).
- **Passkey/2FA**: WebAuthn di Android WebView terbatas → **login email/password dipakai**; passkey **mungkin tak muncul/works** di WebView. 🔧 [KONFIRMASI: cukup email/password untuk mobile?].

**Checkpoint — Selesai kalau (di dalam APK):**
- Login email/password → masuk; restart app tetap login (cookie persist).
- Main 1 game sampai selesai → layar hasil → cek row baru di `game_sessions` server (skor tersimpan via cookie+CSRF).
- `/profil` menampilkan statistik.
**Dependency:** Fase 3, 4.

---

## FASE 6 — (OPSIONAL) SELF-UPDATE SHELL APK

**Tujuan:** Hanya untuk saat **shell native/plugin Capacitor** berubah (BUKAN konten — konten auto via web). Beri tahu user ada APK shell baru.

**File dibuat/diubah:**
```
routes/api.php (server, BARU minimal)             GET /api/app/version
app/Http/Controllers/Api/AppVersionController.php  (BARU)
config/mobile.php (server, BARU)                   (versi APK via .env)
bootstrap/app.php (server)                         (api: routes/api.php)
mobile-shell/dist/ (script cek versi)              panggil saat start
```

**Kode kunci / konfigurasi** — endpoint (bentuk respons WAJIB):
```php
// AppVersionController
return response()->json([
  'latest_version_code' => (int) config('mobile.version_code'),
  'latest_version_name' => config('mobile.version_name'),
  'apk_url'             => config('mobile.apk_url'),     // 🔧 [ISI: URL APK publik]
  'changelog'           => config('mobile.changelog'),
  'force_update'        => (bool) config('mobile.force_update'),
]);
```
Flow di shell (start): ambil `versionCode` lokal (`@capacitor/app` `App.getInfo()`), `GET /api/app/version`, **banding integer**; bila `latest_version_code > lokal` → dialog → buka `apk_url` (download manual via browser) → user **tap Install** + aktifkan **"Install unknown apps"** sekali. `force_update=true` → blokir.

**PERINGATAN:** install diam-diam **mustahil** di luar Play Store; untuk A ini **jarang** (hanya saat shell berubah).

**Checkpoint — Selesai kalau:** menaikkan `MOBILE_VERSION_CODE` di server → app shell lama memunculkan dialog update; tap → membuka unduhan APK.
**Dependency:** Fase 3. 🔧 [ISI: `MOBILE_APK_URL`].

---

## FASE 7 — BUILD, SIGN, & DISTRIBUSI APK

**Tujuan:** Hasilkan APK release ter-tanda dari shell Capacitor & host.

**File dibuat/diubah:**
```
mobile-shell/android/key.properties        (🔧 RAHASIA — JANGAN commit)
mobile-shell/android/app/build.gradle      (signingConfigs release)
mobile-shell/.gitignore                     (+ key.properties, *.keystore)
```

**Perintah terminal EXACT:**
```bash
# 1) keystore (sekali)  🔧 [ISI password & alias]
keytool -genkey -v -keystore ~/edugame-release.keystore -storetype JKS \
  -keyalg RSA -keysize 2048 -validity 10000 -alias edugame

# 2) mobile-shell/android/key.properties  🔧 [ISI]:
#    storePassword=...  keyPassword=...  keyAlias=edugame  storeFile=/abs/path/edugame-release.keystore

# 3) build release
cd mobile-shell && npx cap sync android
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# 4) host APK ke storage publik / CDN  🔧 [ISI URL], lalu (bila Fase 6) update MOBILE_VERSION_* di server.
```

**Kode kunci / konfigurasi** — `android/app/build.gradle` (signing): identik pola standar (load `key.properties`, `buildTypes.release.signingConfig = signingConfigs.release`).

**Checkpoint — Selesai kalau:**
- `assembleRelease` sukses → `app-release.apk` **ter-tanda** (bukan debug).
- APK terpasang di HP fisik → app memuat situs hosted → **6 game jalan**, login & skor tersimpan.
- **Tidak ada secret ter-commit** (`key.properties`/keystore di `.gitignore`).
**Dependency:** Fase 3–6.

---

## RINGKASAN DEPENDENSI
```
0 (audit) → 1 (lock A) → 2 (server hosted siap) → 3 (Capacitor wrap)
   → 4 (native config) → 5 (auth/CSRF verif) → 6 (opsional self-update) → 7 (build/sign/APK)
```

## DAFTAR 🔧 YANG HARUS DIISI MANUSIA
- `BASE_URL` + host domain server hosted (HTTPS).
- `appId`/`applicationId` (mis. `com.edugame.app`).
- Aset ikon & splash (`assets/icon.png`, `assets/splash.png`).
- Keystore: path + `storePassword`/`keyPassword`/`keyAlias` (rahasia, jangan commit).
- (Bila Fase 6 dipakai) `MOBILE_APK_URL` + `MOBILE_VERSION_CODE/NAME/CHANGELOG/FORCE_UPDATE`.
- Konfirmasi: passkey/2FA tak wajib di mobile (cukup email/password).

## CATATAN PENTING (Opsi A)
- **Inertia 2 = server-driven** → app **wajib online** & server hosted **harus hidup**. Tanpa server, hanya halaman fallback `dist/index.html` yang tampil.
- **Update konten/game = via deploy web** (APK tak perlu reinstall). APK baru **hanya** saat shell/plugin Capacitor berubah.
- **Zero duplikasi logika** (beda dari C): satu sumber kebenaran = kode web. Inilah keunggulan A.
- Aset web di-cache WebView; untuk paksa segar setelah deploy, andalkan Vite hashing (sudah aktif) — pengguna otomatis dapat bundle baru.
```
