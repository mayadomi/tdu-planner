# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

**Laravel 12 + React 19 + Inertia.js + TypeScript + Tailwind CSS 4**

- Backend: PHP 8.2+, Laravel 12, Spatie MediaLibrary, Laravel Wayfinder (type-safe routing), Laravel Fortify (auth + 2FA)
- Frontend: React 19 with React Compiler, Inertia.js (server-driven SPA), Radix UI primitives, class-variance-authority for variants
- Database: SQLite (local), with Eloquent ORM
- PHP runs via Laravel Herd (not artisan serve in most cases)

## Commands

```bash
# Start all dev processes (PHP server + queue + Vite)
composer dev

# Run tests (clears config, lints PHP, then runs Pest)
composer test

# Run tests only (no lint)
php artisan test

# Run a single test file
php artisan test tests/Feature/Auth/AuthenticationTest.php

# PHP linting (Laravel Pint)
composer lint          # auto-fix
composer test:lint     # check only

# Frontend
npm run dev            # Vite dev server
npm run build          # production build
npm run types          # TypeScript type check
npm run lint           # ESLint (auto-fix)
npm run format         # Prettier (auto-fix)
npm run format:check   # Prettier check

# Artisan helpers
php artisan migrate
php artisan db:seed
php artisan wayfinder:generate   # regenerate type-safe route helpers in resources/js/routes/
```

## Architecture

### Data Model

`Event` is the core entity. It belongs to `Category`, `Sponsor`, and `Location`; has many `Tag` (many-to-many); and is favourited by `User` (many-to-many via `Favourite`). Events have banner images via Spatie MediaLibrary (two conversions: `card` 800×400 and `thumb` 400×200).

`Sponsor` has four media collections per record: `logo_square`, `logo_square_dark`, `logo_rect`, `logo_rect_dark`.

### Backend Patterns

- **Filtering**: `app/Http/Concerns/FiltersEvents.php` provides reusable event filtering logic consumed by `EventPageController` and `ScheduleController`. The `Event` model has rich query scopes (`happeningNow()`, `upcoming()`, `rides()`, `minDistance()`, `maxCost()`, `withTags()`, etc.).
- **Role access**: `EnsureUserIsEditor` middleware guards editor routes. Users have a `role` field; check `$user->role === 'editor'`.
- **Resources**: `EventResource`, `SponsorResource`, etc. transform models for API/Inertia responses.
- **Config normalization**: `config/tdu.php` defines canonical categories, sponsors, and locations with aliases used during import to normalize scraped data.
- **Import**: `EventImporter` service reads JSON and maps to DB records using `config/tdu.php` aliases.

### Frontend Patterns

- **Routing**: Use Wayfinder imports from `@/routes/` for type-safe URLs rather than hardcoding paths. Run `php artisan wayfinder:generate` after adding/changing routes.
- **Inertia pages** live in `resources/js/pages/`. Props are typed via interfaces in `resources/js/types/events.d.ts` and `schedule.d.ts`.
- **UI components** in `resources/js/components/ui/` are Radix-based with Tailwind variants. New UI primitives should follow the same CVA pattern.
- **Path alias**: `@/*` maps to `resources/js/*`.

### Key Routes

| Purpose | Route |
|---|---|
| Events listing (public) | `GET /events` |
| Event detail (public) | `GET /events/{event}` |
| Schedule/timeline (public) | `GET /schedule` |
| Edit event (editor) | `GET /events/{event}/edit`, `PATCH /events/{event}` |
| Banner image (editor) | `POST/DELETE /events/{event}/banner` |
| Sponsor management (editor) | `GET /sponsors`, `POST/DELETE /sponsors/{sponsor}/images/{collection}` |
| Favourites (auth) | `GET/POST/DELETE /api/favourites`, `POST /api/favourites/{event}/toggle` |
