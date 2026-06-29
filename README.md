# EduGame — Website Game Edukasi Kognitif

Kumpulan **6 mini-game kognitif prosedural** (gaya brain-training) yang ramah fokus,
untuk jenjang **SD / SMP / SMA / Umum**. Kesulitan tiap game diatur sebagai **data**
(`game_configs`) yang bisa diubah non-developer lewat admin tanpa deploy.

> Positioning: latihan kognitif yang menyenangkan & ramah fokus. **Bukan** alat
> diagnosis/pengobatan medis; tanpa klaim efikasi klinis.

## Stack
- **Laravel 13** + **Inertia v3** + **React 19** + **Vite 8** + **Tailwind v4**
- **Filament v3** (admin panel `/admin`)
- **MySQL/MariaDB**, auth session (Fortify) + passkeys/2FA
- Tes: **PHPUnit** (backend) + **Vitest** (logika game)

## 6 Game (logika prosedural, client-side React)
| Game | Domain | Slug |
|---|---|---|
| Hitung Cepat | numerik | `hitung-cepat` |
| Fokus Warna (Stroop) | atensi & inhibisi | `fokus-warna` |
| Memory Match | memori visual | `memory-match` |
| Ingat Urutan (Simon) | working memory | `ingat-urutan` |
| Lanjutkan Pola | logika | `lanjutkan-pola` |
| Susun Kata | verbal | `susun-kata` |

Tiap game = modul `init/renderRound/onAnswer/isFinished/getResult` yang dijalankan
oleh `GameShell` bersama, membaca `params` per jenjang dari `game_configs`.

## Menjalankan (lokal)
```bash
composer install
npm install
cp .env.example .env          # set DB (mysql/mariadb), lalu:
php artisan key:generate
php artisan migrate --seed     # levels, games, 24 game_configs, admin
npm run dev                    # + php artisan serve
```
Admin: `/admin` (kredensial dari `ADMIN_*` di `.env`).

## Tes
```bash
php artisan test     # backend + feature (91 tes)
npm run test:unit    # Vitest — logika 6 game (45 tes)
./vendor/bin/pint    # format PHP
npm run build        # build produksi (code-split per game)
```

## Aksesibilitas (ramah fokus)
Toggle global: **reduced-motion**, **kontras tinggi**, **font ramah disleksia**,
**suara off default (tanpa autoplay)**. Target tap besar, framing positif, tanpa
fail-state menghukum, `lang="id"`, focus-visible.

## API (untuk shell mobile, publik)
- `GET /api/catalog` — levels + games + params per (game, level) yang aktif.
- `GET /api/app/version` — metadata self-update APK shell.

## Dokumentasi
- [`WORKFLOW_EDUGAME.md`](WORKFLOW_EDUGAME.md) — rencana & fase pembangunan web.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — hardening & deploy produksi.
- [`GAME_EDUKASI_MOBILE_BUILD_WORKFLOW.md`](GAME_EDUKASI_MOBILE_BUILD_WORKFLOW.md) —
  build Android (Capacitor wrap, Opsi A); shell di [`mobile-shell/`](mobile-shell/).

## Keamanan ringkas
`POST /sessions` di-rate-limit + validasi server-side (bounds, plausibilitas,
binding ke config aktif). `.env`/keystore tidak pernah di-commit.
