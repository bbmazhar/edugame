# WORKFLOW — Website Game Edukasi Kognitif

> Dokumen ini adalah **rencana eksekusi** untuk Claude Code (VS Code).
> Bisa di-paste utuh, atau **per fase** (tiap fase = satu prompt mandiri).
> Bahasa instruksi: Indonesia + istilah teknis English (standar).

---

## 0. KONTEKS PROYEK

**Produk:** Website game edukasi berisi kumpulan **mini-game kognitif** (gaya "brain-training") yang seru, ronde pendek, dan **ramah fokus**. Target: anak SD, SMP, SMA, dan Umum. Target pasar dapat dibatasi sewaktu-waktu oleh client.

**Genre (LOCKED — Genre A):** Mini-game kognitif **prosedural**. Tiap game menghasilkan rondenya sendiri secara otomatis (tidak ada bank soal yang diketik manual). Variasi & kesulitan diatur lewat parameter, bukan konten.

**Positioning (PENTING — jangan dilanggar):** Pasarkan sebagai *latihan kognitif yang seru dan ramah fokus*. **JANGAN** klaim "menyembuhkan/mengobati ADHD", "terbukti melatih otak", atau klaim medis apa pun. Prinsip desain ramah-fokus boleh dipakai; klaim efikasi klinis tidak.

### Non-Goals (v1 — JANGAN dibangun)
- Multiplayer / real-time (gaya Kahoot). *Arsitektur disiapkan agar bisa ditambah nanti, tapi tidak dibuat sekarang.*
- Bank soal kurikulum yang di-authoring guru (Genre B).
- Pembayaran / monetisasi.
- Mobile app native (web responsive sudah cukup).
- Phaser / game engine arcade. Keenam game v1 berbasis DOM/CSS/Canvas ringan.

---

## 1. STACK (LOCKED)

| Layer | Teknologi |
|---|---|
| Backend | **Laravel 11** |
| Frontend bridge | **Inertia.js 2** |
| UI runtime | **React 18 + Vite** |
| Styling | **Tailwind CSS** + tokens kustom |
| Animasi | CSS / `framer-motion` (ringan, wajib hormati `prefers-reduced-motion`) |
| Admin / CMS | **Filament v3** |
| Database | **MySQL** |
| Auth | Laravel session (Breeze Inertia+React atau setara) |

**Catatan instalasi:** Scaffold via starter kit resmi Laravel untuk Inertia+React (verifikasi versi installer terbaru saat eksekusi — jangan asumsikan dari memori). Jangan campur Livewire untuk halaman publik; Livewire hanya hidup di dalam Filament.

**Loop prototyping (opsional, dianjurkan):** Sebelum integrasi, tiap game boleh diprototipe sebagai komponen React mandiri lalu ditanam sebagai page Inertia. Ini mempercepat iterasi "rasa" game.

---

## 2. ARSITEKTUR

Tiga layer ter-decouple:

```
┌─────────────────────────────────────────────┐
│  FRONTEND PUBLIK (React via Inertia)         │
│  - Katalog game per jenjang                  │
│  - GameShell (kerangka bersama semua game)   │
│  - 6 game = 6 komponen prosedural            │
│  - Profil pemain, statistik, streak          │
│  - Sistem aksesibilitas (reduced-motion dst) │
└───────────────┬─────────────────────────────┘
                │ Inertia (props) + JSON API (skor)
┌───────────────┴─────────────────────────────┐
│  BACKEND (Laravel 11)                        │
│  - Auth & profil                             │
│  - Serve config kesulitan per (game, level)  │
│  - Simpan game_session (skor/akurasi/durasi) │
│  - Hitung statistik & streak                 │
└───────────────┬─────────────────────────────┘
                │ Eloquent
┌───────────────┴─────────────────────────────┐
│  ADMIN (Filament v3)                         │
│  - CRUD games, levels, game_configs          │
│  - Toggle jenjang/game (batasi target pasar) │
│  - Lihat analytics / leaderboard / user      │
│  - Pengumuman                                │
└──────────────────────────────────────────────┘
                MySQL
```

**Prinsip kunci:** Game di-hardcode sebagai mesin. **Tuning = data** (`game_configs`), dapat diubah non-developer di Filament tanpa deploy. Penambahan layer multiplayer nanti (Laravel Reverb/WebSocket) = layer baru, **tanpa menulis ulang** yang ada.

---

## 3. MODEL DATA

Taksonomi jenjang & tuning sebagai data adalah inti desain ini.

```
users            (Laravel default + role)
  - id, name, email (nullable utk guest-upgrade), password, role[admin|player], timestamps

profiles         (extend user; data minimal — hindari PII anak)
  - user_id, display_name, avatar, preferred_level_id (nullable)
  - settings JSON { reduced_motion, sound, theme, font, high_contrast }
  - NB: JANGAN simpan data sensitif anak (alamat, sekolah persis, dll)

levels           (taksonomi jenjang — filter target pasar)
  - id, code[SD|SMP|SMA|UMUM], name, sort_order
  - is_enabled (bool)  ← matikan utk batasi target pasar (no-code)

games            (katalog mekanik game)
  - id, slug, name, description, cognitive_domain, icon
  - is_enabled (bool), sort_order

game_configs     (LAPISAN TUNING — diedit di Filament tanpa deploy)
  - id, game_id, level_id
  - params JSON  ← knob kesulitan (lihat Appendix per game)
  - is_enabled (bool)  ← nonaktifkan game utk jenjang tertentu
  - UNIQUE(game_id, level_id)

game_sessions    (riwayat main; sumber statistik)
  - id, user_id (nullable utk guest), game_id, level_id
  - score (int), accuracy (decimal), duration_ms (int), rounds (int)
  - metadata JSON, played_at, created_at

user_stats       (read cepat; di-update saat sesi selesai)
  - user_id, game_id (nullable utk agregat)
  - best_score, total_sessions, streak_count, last_played_date

announcements    (dikelola Filament — opsional ditampilkan di home)
  - id, title, body, is_active, starts_at, ends_at
```

> Achievements/badge = **stub** dulu (struktur disiapkan, logika menyusul). Tidak menghambat v1.

---

## 4. PROTOKOL KERJA UNTUK CLAUDE CODE (WAJIB IKUTI)

1. **Plan mode dulu, tiap fase.** Keluarkan rencana langkah + file yang akan disentuh. **TUNGGU konfirmasi `GO`** sebelum menulis kode. Jangan eksekusi tanpa gate.
2. **Satu fase = satu branch.** Format: `feat/phase-N-slug`. Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).
3. **Audit-first.** Sebelum mengedit file yang sudah ada, baca dulu dan laporkan temuan. Jangan menimpa membabi buta.
4. **No scope creep.** Kerjakan hanya objektif fase berjalan. Jika ambigu atau terblokir → **BERHENTI dan tanya**, jangan menebak arsitektur.
5. **Verifikasi tiap fase.** Jalankan migrasi/test/build, laporkan status (hijau/merah) sebelum lanjut.
6. **Secrets di `.env`.** Jangan commit `.env`. Sediakan `.env.example`.
7. **Definition of Done (DoD)** tiap fase harus lulus sebelum fase berikutnya.
8. **Aksesibilitas bukan opsional.** Tiap komponen interaktif wajib lulus checklist di Appendix B.

---

## 5. RENCANA FASE

### FASE 0 — Scaffold & Fondasi
**Objektif:** Project jalan kosong dengan stack terpasang.
**Gate:** Tampilkan rencana instalasi + struktur folder → tunggu `GO`.
**Tugas:**
- Init Laravel 11, pasang Inertia 2 + React 18 + Vite + Tailwind (starter kit Inertia/React).
- Pasang Filament v3, buat 1 admin user via seeder.
- Layout dasar publik (header, footer, container) + halaman landing placeholder.
- Konfigurasi `.env.example`, MySQL connection, format/lint (Pint + ESLint/Prettier).
**Deliverable:** App boot, `/` render, `/admin` login.
**DoD:** `php artisan migrate` hijau; `npm run build` sukses; Filament login berhasil.
**Commit:** `chore: scaffold laravel inertia react filament`

---

### FASE 1 — Domain & Database
**Objektif:** Skema data lengkap + seeder.
**Gate:** Tampilkan daftar migrasi + isi seeder → `GO`.
**Tugas:**
- Migrasi semua tabel di Bagian 3.
- Model + relasi Eloquent + casts JSON.
- Seeder: 4 `levels` (SD/SMP/SMA/UMUM, semua enabled), 6 `games` (lihat Appendix A), `game_configs` default tiap (game × level) dengan `params` awal dari Appendix A.
**Deliverable:** DB terisi data dasar yang siap dipakai frontend & Filament.
**DoD:** `migrate:fresh --seed` hijau; relasi diuji via tinker.
**Commit:** `feat: core domain schema and seeders`

---

### FASE 2 — Admin (Filament)
**Objektif:** Non-developer bisa kelola katalog & tuning.
**Gate:** Rencana resource + field → `GO`.
**Tugas:**
- Resource: `Game`, `Level`, `GameConfig`, `User`, `Announcement`.
- `GameConfig`: form `params` pakai key-value/JSON editor yang ramah (idealnya field terstruktur per game, minimal JSON valid).
- Toggle `is_enabled` di Level & Game & GameConfig (= kontrol target pasar).
- Dashboard ringkas: total sesi, sesi per game, pemain aktif (widget sederhana).
**Deliverable:** CRUD penuh + toggle berfungsi.
**DoD:** Matikan satu level di Filament → tercermin di API katalog (diuji di Fase 3).
**Commit:** `feat: filament admin resources`

---

### FASE 3 — Frontend Shell & Aksesibilitas
**Objektif:** Kerangka publik + sistem desain ramah-fokus.
**Gate:** Rencana komponen + design tokens → `GO`. **Konsultasi skill `frontend-design`.**
**Tugas:**
- Design tokens (warna tenang, kontras tinggi opsional, font dyslexia-friendly opsional, spacing besar untuk anak).
- `AccessibilityProvider` global: toggle reduced-motion, sound on/off, theme, high-contrast, font — persist ke `profiles.settings` (atau memory utk guest).
- Halaman: Home (hero jujur, tanpa klaim medis), **Katalog game terfilter per jenjang** (hanya tampilkan level & game yang `is_enabled`), pemilih jenjang.
- Navigasi, state guest vs login.
**Deliverable:** Katalog membaca data nyata; filter jenjang bekerja; preferensi aksesibilitas tersimpan.
**DoD:** Toggle reduced-motion benar-benar menonaktifkan animasi; katalog menghormati flag dari Filament.
**Commit:** `feat: public shell and accessibility system`

---

### FASE 4 — GameShell (Kerangka Bersama) ⟵ BANGUN INI SEBELUM GAME
**Objektif:** Harness yang dipakai ulang semua game. **Jangan bikin 6 game bespoke; bikin 1 kerangka lalu colok game.**
**Gate:** Rencana API komponen + kontrak data → `GO`.
**Tugas:**
- Komponen `GameShell` menangani: layar mulai → countdown → loop ronde → layar hasil; timer; skor; pause; retry; tombol keluar.
- Kontrak game: tiap game = modul yang mengekspos `init(params)`, `renderRound()`, `onAnswer()`, `isFinished()`, `getResult()`. `params` di-inject dari `game_configs` sesuai jenjang yang dipilih.
- Endpoint API `POST /sessions` simpan hasil (guest → tanpa user_id); update `user_stats`.
- Layar hasil: skor, akurasi, durasi, streak, tombol "main lagi" / "game lain". Framing positif, tanpa fail-state menghukum.
**Deliverable:** Harness lengkap + 1 game dummy untuk validasi alur penyimpanan skor.
**DoD:** Selesaikan sesi dummy → tersimpan di `game_sessions`, `user_stats` terupdate, tampil di hasil.
**Commit:** `feat: shared game shell and session pipeline`

---

### FASE 5 — Implementasi 6 Game (satu per satu)
**Objektif:** Isi katalog. Tiap game = sub-tugas & branch sendiri.
**Gate per game:** Rencana mekanik + parameter → `GO`. **Mulai dari 1–2 game untuk validasi harness, baru lanjut sisanya.**
**Tugas (ulang untuk tiap game di Appendix A):**
- Implementasi mekanik prosedural sesuai spec.
- Baca `params` dari `game_configs` (kesulitan per jenjang).
- Integrasi penuh ke `GameShell`.
- Lulus checklist aksesibilitas (Appendix B).
**Urutan disarankan:** Hitung Cepat → Fokus Warna → Memory Match → Ingat Urutan → Lanjutkan Pola → Susun Kata.
**DoD per game:** Main tuntas di keempat jenjang dengan kesulitan berbeda; skor tersimpan; responsif mobile.
**Commit:** `feat: game <slug>`

---

### FASE 6 — Profil Pemain & Dashboard
**Objektif:** Pemain lihat progres sendiri.
**Gate:** Rencana halaman + query statistik → `GO`.
**Tugas:**
- Halaman profil: riwayat sesi, best score per game, streak, total main.
- Guest → opsi upgrade ke akun (klaim progres lokal bila memungkinkan).
- Privasi anak: minimkan data; tanpa data sensitif.
**DoD:** Statistik akurat lintas game; guest bisa main tanpa akun.
**Commit:** `feat: player profile and stats`

---

### FASE 7 — Polish & Aksesibilitas Final
**Objektif:** Rasa rapi, ramah fokus, responsif.
**Gate:** Daftar item polish → `GO`.
**Tugas:**
- Audit aksesibilitas menyeluruh (Appendix B) di semua game.
- Reduced-motion, sound toggle, kontras, font — verifikasi tiap game.
- Performa (lazy-load game, ukuran bundle), responsif (mobile-first, target tap besar).
- Empty/loading/error states.
**DoD:** Lighthouse a11y ≥ 90; semua toggle bekerja di semua game; mobile mulus.
**Commit:** `refactor: accessibility and polish pass`

---

### FASE 8 — Hardening & Deploy Prep
**Objektif:** Siap rilis.
**Gate:** Rencana deploy + checklist env → `GO`.
**Tugas:**
- Validasi & rate-limit endpoint `/sessions` (cegah skor palsu).
- `.env.production` guidance, `php artisan optimize`, `npm run build`.
- Catatan hosting: shared hosting Indonesia atau VPS; pastikan PHP 8.2+, ekstensi MySQL; queue (jika ada) pakai database driver dulu.
- Seeder produksi (levels, games, configs).
- Backup & migrasi aman ke produksi.
**DoD:** Build produksi jalan; data awal ter-seed; tidak ada secret ter-commit.
**Commit:** `chore: production hardening and deploy prep`

---

## APPENDIX A — SPEC 6 GAME

> Lapisan yang paling mudah ditukar. Tiap `params` di bawah masuk ke `game_configs.params` (JSON), diedit di Filament.

### A1. Hitung Cepat — *numerik* (jembatan ke kurikulum)
Soal aritmetika muncul, jawab cepat sebelum waktu habis.
`params`: `{ operations:["+","-","×","÷"], max_operand:int, time_per_question_ms:int, allow_negative:bool, total_questions:int }`
- SD: `+,-`, max 20, 8000ms, no-neg
- SMP: `+,-,×`, max 50, 6000ms
- SMA/UMUM: semua op, max 100, 5000ms, allow_negative
Skor: benar × bobot kecepatan; akurasi = benar/total.

### A2. Fokus Warna (Stroop) — *atensi & inhibisi* (paling relevan fokus)
Tampil kata nama warna ber-tinta berbeda; pemain pilih **warna tinta**, bukan teksnya. Variasi: tap target di antara distraktor.
`params`: `{ display_ms:int, congruent_ratio:float, distractor_count:int, rounds:int }`
- SD: 3000ms, congruent 0.6, distraktor 2
- SMA/UMUM: 1500ms, congruent 0.3, distraktor 4
Skor: benar − penalti salah; ukur waktu reaksi.

### A3. Memory Match — *memori visual*
Balik kartu, cocokkan pasangan.
`params`: `{ rows:int, cols:int, flip_back_ms:int, theme:string }` (rows×cols harus genap)
- SD 3×4, SMP 4×4, SMA 4×6, UMUM 5×6
Skor: berbasis jumlah percobaan & waktu.

### A4. Ingat Urutan (Simon) — *working memory*
Urutan tampil lalu pemain ulangi; urutan memanjang tiap ronde.
`params`: `{ start_length:int, max_length:int, show_ms:int, gap_ms:int, modality:"color"|"number"|"sound" }`
- SD: start 3, show 800ms
- SMA/UMUM: start 4, show 500ms
Skor: panjang urutan terjauh yang benar.

### A5. Lanjutkan Pola — *logika*
Diberi deret (angka/bentuk/warna), pilih lanjutan yang benar.
`params`: `{ pattern_types:["arithmetic","geometric","shape","color"], sequence_length:int, options_count:int }`
- SD: arithmetic/shape, length 4, 3 opsi
- SMA/UMUM: + geometric, length 6, 4 opsi
Skor: benar × kecepatan.

### A6. Susun Kata — *verbal*
Mode anagram (susun huruf jadi kata) atau cari-kata di grid.
`params`: `{ mode:"anagram"|"search", min_len:int, max_len:int, time_ms:int, dictionary:"id"|"en", grid_size:int }`
- SD: anagram, 3–4 huruf, kamus id
- SMA/UMUM: search, 5–8 huruf, grid lebih besar
Skor: kata ditemukan × panjang.

---

## APPENDIX B — CHECKLIST AKSESIBILITAS & RAMAH-FOKUS (wajib per game)

- [ ] Ronde pendek (60–180 dtk); ada start/stop jelas; bisa pause kapan saja.
- [ ] Satu aksi utama terlihat saat bermain; chrome minimal, tanpa clutter.
- [ ] Feedback instan tiap aksi (visual; audio opsional, **tanpa autoplay**).
- [ ] Tanpa fail-state menghukum; selalu ada "coba lagi"; framing positif.
- [ ] Progress terlihat (ronde x/y, skor, streak).
- [ ] Hormati `prefers-reduced-motion`; toggle reduced-motion mematikan animasi.
- [ ] Opsi tema tenang + kontras tinggi + font dyslexia-friendly.
- [ ] Sound on/off; tidak ada notifikasi yang mengganggu.
- [ ] Target tap besar (mobile-first, untuk anak).
- [ ] SD: tekanan waktu lebih longgar daripada jenjang atas.
- [ ] Tanpa dark pattern, tanpa iklan, tanpa nag.

---

## APPENDIX C — KEPUTUSAN TERBUKA (konfirmasi bila perlu)

1. **Akun:** Asumsi = guest bisa main; login opsional untuk simpan progres. Anak SD idealnya guest-first / login tanpa email. (Override bila client wajib login.)
2. **Bahasa UI:** Asumsi = Indonesia. Tambah English? → tinggal i18n.
3. **Lineup game:** 6 di atas. Tukar/ tambah/ kurang bebas — tiap game independen.
4. **Hosting target:** Asumsi = shared hosting ID / VPS. Konfirmasi spesifikasi saat Fase 8.
5. **Multiplayer:** Di luar v1. Saat diaktifkan → tambah Laravel Reverb + butuh hosting yang dukung proses persisten.

---

## CARA PAKAI DOKUMEN INI DI CLAUDE CODE

1. Paste bagian **Konteks + Stack + Arsitektur + Model Data + Protokol Kerja** sekali di awal sesi sebagai konteks utama.
2. Lalu paste **satu Fase** per langkah. Tunggu Claude Code keluarkan plan → ketik `GO` → review hasil → lanjut fase berikutnya.
3. Untuk Fase 5, ulangi alur untuk tiap game (rujuk Appendix A).
4. Tahan setiap gate. Jangan biarkan lompat fase tanpa DoD lulus.
