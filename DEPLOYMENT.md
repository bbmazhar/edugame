# Deployment — EduGame

Production deploy & hardening guide. **Never commit `.env`** (it is git-ignored).
There is intentionally no `.env.production` in the repo — configure it on the server.

## 1. Requirements

- **PHP 8.2+** (tested on 8.3) with extensions: `pdo_mysql`, `mbstring`, `openssl`,
  `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`, `gd`, `zip`.
- **MySQL 8+ / MariaDB 10.4+**.
- **Composer 2**.
- **Node 20+** for building front-end assets (build locally or in CI, then deploy
  `public/build`; Node is not required on the server).

## 2. Production `.env`

Copy `.env.example` to `.env` on the server and set:

```dotenv
APP_NAME=EduGame
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.example

# php artisan key:generate  (sets APP_KEY)
APP_KEY=

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edugame
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Used once to create the admin (see step 5). Remove/rotate afterwards.
ADMIN_NAME="EduGame Admin"
ADMIN_EMAIL=admin@your-domain.example
ADMIN_PASSWORD=use-a-strong-password
```

Keep `APP_DEBUG=false` in production. Store a backup of `.env` somewhere secure.

## 3. Install

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate        # only if APP_KEY is empty
```

## 4. Database (back up first)

```bash
# Always back up before migrating an existing database:
mysqldump -u USER -p edugame > backup-$(date +%F).sql

php artisan migrate --force     # non-interactive, safe for production
php artisan db:seed --class=ProductionSeeder --force   # levels, games, game_configs (idempotent)
```

## 5. Create the admin (one-time)

With `ADMIN_*` set in `.env`:

```bash
php artisan db:seed --class=AdminUserSeeder --force
# or, interactively:
php artisan make:filament-user
```

The admin panel is at `/admin` (only users with `role=admin` can sign in).

## 6. Front-end assets

Build locally or in CI (Node not needed on the server), then deploy `public/build`:

```bash
npm ci
npm run build
```

## 7. Optimize & link

```bash
php artisan optimize        # caches config, routes, events, views
php artisan storage:link    # if you serve uploaded files
```

Re-run `php artisan optimize` after any `.env`/route change, or
`php artisan optimize:clear` to drop caches.

## 8. Web server

- Point the document root at **`/public`**.
- Ensure `storage/` and `bootstrap/cache/` are writable by the web user.

### Shared hosting (Indonesia)
- Select **PHP 8.2+** in the control panel; set the site docroot to `public/`.
- Run the scheduler via cron if you add scheduled tasks:
  `* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1`

### VPS
- Run the queue worker (driver: **database**) under supervisor:
  `php artisan queue:work --queue=default --tries=3`
- (No jobs are dispatched yet, but the `jobs` table and driver are ready.)

## 9. Security notes

- `POST /sessions` is rate-limited (`30/min`) and server-validated: scores,
  accuracy, duration and rounds are bounds-checked, cross-field plausibility is
  enforced, and each session must match an **enabled** `(game, level)` config.
  Full anti-cheat (signed run tokens) can be added later if needed.
- `/sessions/claim` is rate-limited (`20/min`) and only moves unclaimed
  (`user_id` null) guest sessions.
- Toggle levels/games/configs in `/admin` to control the live catalog without a
  deploy.
