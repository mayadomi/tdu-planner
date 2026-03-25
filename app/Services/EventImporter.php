<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Event;
use App\Models\Location;
use App\Models\Sponsor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EventImporter
{
    protected array $stats = [
        'events_created' => 0,
        'events_updated' => 0,
        'events_skipped' => 0,
        'categories_created' => 0,
        'sponsors_created' => 0,
        'locations_created' => 0,
        'errors' => [],
    ];

    protected array $categoryCache = [];
    protected array $sponsorCache = [];
    protected array $locationCache = [];

    // Config-loaded mappings
    protected array $categoryAliases = [];
    protected array $sponsorAliases = [];
    protected array $locationAliases = [];
    protected array $configCategories = [];
    protected array $configSponsors = [];
    protected array $configLocations = [];

    public function __construct()
    {
        $this->loadConfig();
    }

    /**
     * Load normalization mappings from config.
     */
    protected function loadConfig(): void
    {
        $this->configCategories = config('tdu.categories', []);
        $this->configSponsors = config('tdu.sponsors', []);
        $this->configLocations = config('tdu.locations', []);

        $this->categoryAliases = config('tdu.category_aliases', []);
        $this->sponsorAliases = config('tdu.sponsor_aliases', []);
        $this->locationAliases = config('tdu.location_aliases', []);
    }

    /**
     * Import events from a JSON file or array.
     */
    public function import(array $data, bool $dryRun = false): array
    {
        $this->resetStats();
        $this->warmCaches();

        $events = $data['events'] ?? [];
        $source = $data['source'] ?? 'unknown';

        Log::info("Starting event import from source: {$source}", [
            'event_count' => count($events),
            'dry_run' => $dryRun,
        ]);

        if (!$dryRun) {
            DB::beginTransaction();
        }

        try {
            foreach ($events as $index => $eventData) {
                try {
                    $this->importEvent($eventData, $dryRun);
                } catch (\Exception $e) {
                    $this->stats['errors'][] = [
                        'index' => $index,
                        'title' => $eventData['title'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                    ];
                    $this->stats['events_skipped']++;
                    Log::warning("Failed to import event", [
                        'index' => $index,
                        'title' => $eventData['title'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if (!$dryRun) {
                DB::commit();
            }
        } catch (\Exception $e) {
            if (!$dryRun) {
                DB::rollBack();
            }
            throw $e;
        }

        Log::info("Event import completed", $this->stats);

        return $this->stats;
    }

    /**
     * Import a single event.
     */
    protected function importEvent(array $data, bool $dryRun): void
    {
        // Validate required fields
        $this->validateEventData($data);

        // Normalize and resolve relationships
        $categoryId = $this->resolveCategory($data['category'], $dryRun);
        $sponsorId = $this->resolveSponsor($data['sponsor'] ?? null, $dryRun);
        $locationId = $this->resolveLocation($data['location'] ?? null, $dryRun);

        // Use defaults for required fields if not provided
        // (database has NOT NULL constraints on these)
        if (!$sponsorId) {
            $sponsorId = $this->getOrCreateDefaultSponsor($dryRun);
        }
        if (!$locationId) {
            $locationId = $this->getOrCreateDefaultLocation($dryRun);
        }

        // Parse dates — prefer ISO 8601 from the scraper, fall back to generic parse
        $startDatetime = Carbon::createFromFormat('Y-m-d\TH:i:sP', $data['start_datetime'])
            ?? Carbon::parse($data['start_datetime']);
        $endDatetime = Carbon::createFromFormat('Y-m-d\TH:i:sP', $data['end_datetime'])
            ?? Carbon::parse($data['end_datetime']);

        if (!$startDatetime || !$endDatetime) {
            throw new \InvalidArgumentException("Invalid datetime format for event '{$data['title']}'");
        }

        if ($endDatetime->lt($startDatetime)) {
            throw new \InvalidArgumentException("end_datetime is before start_datetime for event '{$data['title']}'");
        }

        // Determine cost/free status
        $minCost = $data['min_cost'] ?? ($data['cost'] ?? null);
        $maxCost = $data['max_cost'] ?? ($data['cost'] ?? null);
        $isFree = $data['is_free'] ?? (($minCost === null && $maxCost === null) || ($maxCost == 0));

        // Prepare event data
        $eventAttributes = [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'start_datetime' => $startDatetime,
            'end_datetime' => $endDatetime,
            'category_id' => $categoryId,
            'sponsor_id' => $sponsorId,
            'location_id' => $locationId,
            'ride_distance_km' => $data['ride_distance_km'] ?? null,
            'elevation_gain_m' => $data['elevation_gain_m'] ?? null,
            'min_cost' => $minCost,
            'max_cost' => $maxCost,
            'is_free' => $isFree,
            'is_featured' => $data['is_featured'] ?? false,
            'is_recurring' => $data['is_recurring'] ?? false,
            'is_womens' => $data['is_womens'] ?? false,
            'url' => $this->sanitizeUrl($data['url'] ?? null),
        ];

        if ($dryRun) {
            // Just count what would happen
            $existingEvent = $this->findExistingEvent($data, $startDatetime);
            if ($existingEvent) {
                $this->stats['events_updated']++;
            } else {
                $this->stats['events_created']++;
            }
            return;
        }

        // Check for existing event (by external_id or title+date)
        $existingEvent = $this->findExistingEvent($data, $startDatetime);

        if ($existingEvent) {
            $existingEvent->update($eventAttributes);
            $this->stats['events_updated']++;
        } else {
            Event::create($eventAttributes);
            $this->stats['events_created']++;
        }
    }

    /**
     * Find an existing event by external_id or title+date.
     */
    /**
     * Validate and return a URL, or null if invalid/missing.
     * Only allows http/https schemes to prevent javascript: or data: URLs.
     */
    protected function sanitizeUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        $validated = filter_var($url, FILTER_VALIDATE_URL);
        if ($validated === false) {
            return null;
        }

        $scheme = strtolower(parse_url($validated, PHP_URL_SCHEME) ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        return $validated;
    }

    protected function findExistingEvent(array $data, Carbon $startDatetime): ?Event
    {
        // First try by external_id if provided
        if (!empty($data['external_id'])) {
            // We'd need to add external_id column for this - for now skip
        }

        // Fall back to title + date matching
        return Event::where('title', $data['title'])
            ->whereDate('start_datetime', $startDatetime->toDateString())
            ->first();
    }

    /**
     * Normalize a category name using config aliases and resolve to ID.
     */
    protected function resolveCategory(string $name, bool $dryRun): int
    {
        // First, normalize the name using aliases
        $slug = $this->normalizeCategoryName($name);

        if (isset($this->categoryCache[$slug])) {
            return $this->categoryCache[$slug];
        }

        $category = Category::where('slug', $slug)->first();

        if (!$category && !$dryRun) {
            // Get display name from config or use original
            $displayName = $this->configCategories[$slug] ?? ucwords(str_replace('-', ' ', $slug));

            $category = Category::create([
                'name' => $displayName,
                'slug' => $slug,
            ]);
            $this->stats['categories_created']++;
        }

        if ($category) {
            $this->categoryCache[$slug] = $category->id;
            return $category->id;
        }

        // For dry run, return a placeholder
        $this->stats['categories_created']++;
        return 0;
    }

    /**
     * Normalize category name to canonical slug.
     */
    protected function normalizeCategoryName(string $name): string
    {
        $lower = strtolower(trim($name));

        // Check if it's already a valid slug in config
        if (isset($this->configCategories[$lower])) {
            return $lower;
        }

        // Check aliases
        if (isset($this->categoryAliases[$lower])) {
            return $this->categoryAliases[$lower];
        }

        // Convert to slug and check
        $slug = Str::slug($name);
        if (isset($this->configCategories[$slug])) {
            return $slug;
        }

        // Check if any alias matches the slug
        foreach ($this->categoryAliases as $alias => $canonical) {
            if (Str::slug($alias) === $slug) {
                return $canonical;
            }
        }

        // Default: return as slug (may create new category)
        return $slug;
    }

    /**
     * Resolve or create a sponsor.
     */
    protected function resolveSponsor(?string $name, bool $dryRun): ?int
    {
        if (empty($name)) {
            return null;
        }

        // Normalize the name using aliases
        $slug = $this->normalizeSponsorName($name);

        if (isset($this->sponsorCache[$slug])) {
            return $this->sponsorCache[$slug];
        }

        $sponsor = Sponsor::where('slug', $slug)->first();

        if (!$sponsor && !$dryRun) {
            // Get display name from config or use original
            $displayName = $this->configSponsors[$slug] ?? ucwords(str_replace('-', ' ', $slug));

            $sponsor = Sponsor::create([
                'name' => $displayName,
                'slug' => $slug,
            ]);
            $this->stats['sponsors_created']++;
        }

        if ($sponsor) {
            $this->sponsorCache[$slug] = $sponsor->id;
            return $sponsor->id;
        }

        // For dry run
        $this->stats['sponsors_created']++;
        return 0;
    }

    /**
     * Normalize sponsor name to canonical slug.
     */
    protected function normalizeSponsorName(string $name): string
    {
        $lower = strtolower(trim($name));

        // Check if it's already a valid slug in config
        if (isset($this->configSponsors[$lower])) {
            return $lower;
        }

        // Check aliases
        if (isset($this->sponsorAliases[$lower])) {
            return $this->sponsorAliases[$lower];
        }

        // Convert to slug and check
        $slug = Str::slug($name);
        if (isset($this->configSponsors[$slug])) {
            return $slug;
        }

        // Check if any alias matches the slug
        foreach ($this->sponsorAliases as $alias => $canonical) {
            if (Str::slug($alias) === $slug) {
                return $canonical;
            }
        }

        // Default: return as slug (may create new sponsor)
        return $slug;
    }

    /**
     * Resolve or create a location.
     */
    protected function resolveLocation(?array $locationData, bool $dryRun): ?int
    {
        if (empty($locationData) || empty($locationData['name'])) {
            return null;
        }

        $name = $locationData['name'];

        // Try to match against config locations first
        $configLocation = $this->findConfigLocation($name);

        if ($configLocation) {
            // Use config data, but allow overrides from input
            $locationData = array_merge($configLocation, array_filter($locationData));
            $name = $configLocation['name'];
        }

        $cacheKey = Str::slug($name);

        if (isset($this->locationCache[$cacheKey])) {
            return $this->locationCache[$cacheKey];
        }

        $location = Location::where('name', $name)->first();

        if (!$location && !$dryRun) {
            $location = Location::create([
                'name' => $name,
                'address' => $locationData['address'] ?? null,
                'latitude' => $locationData['latitude'] ?? 0,
                'longitude' => $locationData['longitude'] ?? 0,
            ]);
            $this->stats['locations_created']++;
        }

        if ($location) {
            $this->locationCache[$cacheKey] = $location->id;
            return $location->id;
        }

        // For dry run
        $this->stats['locations_created']++;
        return 0;
    }

    /**
     * Find a location in config by name or alias.
     */
    protected function findConfigLocation(string $name): ?array
    {
        $lower = strtolower(trim($name));
        $slug = Str::slug($name);

        // Check if name matches a config location directly
        if (isset($this->configLocations[$slug])) {
            return $this->configLocations[$slug];
        }

        // Check aliases
        if (isset($this->locationAliases[$lower])) {
            $canonical = $this->locationAliases[$lower];
            return $this->configLocations[$canonical] ?? null;
        }

        // Check if any location name matches
        foreach ($this->configLocations as $key => $location) {
            if (Str::slug($location['name']) === $slug) {
                return $location;
            }
        }

        return null;
    }

    /**
     * Validate event data has required fields.
     */
    protected function validateEventData(array $data): void
    {
        $required = ['title', 'start_datetime', 'end_datetime', 'category'];

        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: {$field}");
            }
        }
    }

    /**
     * Pre-load existing categories, sponsors, and locations into cache.
     */
    protected function warmCaches(): void
    {
        $this->categoryCache = Category::pluck('id', 'slug')->toArray();
        $this->sponsorCache = Sponsor::pluck('id', 'slug')->toArray();
        $this->locationCache = Location::pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [Str::slug($name) => $id])
            ->toArray();
    }

    /**
     * Reset statistics.
     */
    protected function resetStats(): void
    {
        $this->stats = [
            'events_created' => 0,
            'events_updated' => 0,
            'events_skipped' => 0,
            'categories_created' => 0,
            'sponsors_created' => 0,
            'locations_created' => 0,
            'errors' => [],
        ];
    }

    /**
     * Get import statistics.
     */
    public function getStats(): array
    {
        return $this->stats;
    }

    /**
     * Get or create a default sponsor for events without one.
     */
    protected function getOrCreateDefaultSponsor(bool $dryRun): int
    {
        $slug = 'tdu';
        $name = 'Tour Down Under';

        if (isset($this->sponsorCache[$slug])) {
            return $this->sponsorCache[$slug];
        }

        $sponsor = Sponsor::where('slug', $slug)->first();

        if (!$sponsor && !$dryRun) {
            $sponsor = Sponsor::create([
                'name' => $name,
                'slug' => $slug,
            ]);
            $this->stats['sponsors_created']++;
        }

        if ($sponsor) {
            $this->sponsorCache[$slug] = $sponsor->id;
            return $sponsor->id;
        }

        return 1; // Fallback for dry run
    }

    /**
     * Get or create a default location for events without one.
     */
    protected function getOrCreateDefaultLocation(bool $dryRun): int
    {
        $name = 'Adelaide Region';

        $cacheKey = Str::slug($name);
        if (isset($this->locationCache[$cacheKey])) {
            return $this->locationCache[$cacheKey];
        }

        $location = Location::where('name', $name)->first();

        if (!$location && !$dryRun) {
            $location = Location::create([
                'name' => $name,
                'address' => 'Greater Adelaide, South Australia',
                'latitude' => -34.9285,
                'longitude' => 138.6007,
            ]);
            $this->stats['locations_created']++;
        }

        if ($location) {
            $this->locationCache[$cacheKey] = $location->id;
            return $location->id;
        }

        return 1; // Fallback for dry run
    }
}
