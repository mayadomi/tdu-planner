# TDU Planner

A web-based event planner and schedule viewer for the **Santos Tour Down Under** cycling festival. Browse the full event program, explore a live timeline of race stages and community rides, filter by category, cost, distance, and more — then save your personal schedule with favourites.

<!-- Screenshot: events listing page -->
![Events listing](docs/screenshots/events-index.png)

## Features

- **Event browser** — searchable, filterable listing of all TDU events with category, cost, distance, recurrence, and women's event indicators
- **Timeline / schedule view** — visual day-by-day timeline grid showing overlapping events across the festival week
- **Event detail pages** — full event info with banner images and route links
- **Favourites** — authenticated users can save events to a personal shortlist
- **Editor role** — credentialed users can create and edit events, upload banner images, and manage sponsor logos
- **Admin panel** — user management and editor access approval workflow
- **Data import** — scraper and importer pipeline for ingesting event data from the official TDU program

<!-- Screenshot: schedule / timeline view -->
![Schedule view](docs/screenshots/schedule.png)

## Stack

| Layer | Technology |
|---|---|
| Backend | PHP 8.2+, Laravel 12 |
| Frontend | React 19, TypeScript, Inertia.js |
| Styling | Tailwind CSS 4, Radix UI |
| Auth | Laravel Fortify (with 2FA) |
| Media | Spatie MediaLibrary |
| Routing | Laravel Wayfinder (type-safe) |
| Database | SQLite (local) |

## Getting Started

### Prerequisites

- PHP 8.2+ (via [Laravel Herd](https://herd.laravel.com) or another local server)
- Composer
- Node.js 20+

### Installation

```bash
git clone https://github.com/mayadomi/tdu-planner.git
cd tdu-planner

composer install
npm install

cp .env.example .env
php artisan key:generate

php artisan migrate
php artisan db:seed

npm run build
```

### Development

```bash
composer dev        # starts PHP server, queue worker, and Vite together
```

Or run each separately:

```bash
php artisan serve
php artisan queue:listen
npm run dev
```

### Importing Event Data

```bash
php artisan events:import
```

The importer reads JSON scraped from the TDU website and normalises it against the canonical categories, sponsors, and locations defined in `config/tdu.php`.

The scraped data required a meaningful amount of manual curation — event titles, categories, and venue names varied significantly across the source, and sponsor associations were often missing or inconsistent. The normalisation aliases in `config/tdu.php` capture the bulk of these mappings, but edge cases were resolved by hand.

<!-- Screenshot: event detail page -->
![Event detail](docs/screenshots/event-detail.png)

## User Roles

| Role | Access |
|---|---|
| `viewer` | Browse events, manage favourites |
| `editor` | Create and edit events, manage sponsor images |
| `admin` | Full access including user management |

Viewers can request editor access from the sidebar; admins approve requests from the Users panel.

<!-- Screenshot: sidebar with role-based navigation -->
![Sidebar navigation](docs/screenshots/sidebar.png)

## Key Commands

```bash
composer test               # lint + full test suite
php artisan test            # tests only
composer lint               # PHP auto-fix (Pint)
npm run types               # TypeScript check
npm run lint                # ESLint auto-fix
php artisan wayfinder:generate   # regenerate type-safe route helpers
```

## Next Steps

### Map-based event view

Route GeoJSON data has been collected for a significant portion of events (via RideWithGPS and direct TDU downloads). The next major feature is a map view that renders event routes as interactive overlays, allowing riders to visually explore start locations, course profiles, and route density across the festival.

### Agentic integration

A planned agentic layer would allow users to describe what they're looking for in natural language — *"show me beginner-friendly morning rides near the city under $30"* — and have an AI assistant query, filter, and build a personalised schedule on their behalf. This would sit on top of the existing filter and favourites infrastructure and could also assist editors with event data entry and normalisation.

## License

MIT
