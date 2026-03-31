<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Event extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'created_by_user_id',
        'title',
        'description',
        'start_datetime',
        'end_datetime',
        'category_id',
        'pace',
        'route_url',
        'sponsor_id',
        'location_id',
        'ride_distance_km',
        'elevation_gain_m',
        'is_featured',
        'is_recurring',
        'is_womens',
        'url',
        'min_cost',
        'max_cost',
        'is_free',
        'route_geojson',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'ride_distance_km' => 'decimal:2',
        'elevation_gain_m' => 'integer',
        'is_featured' => 'boolean',
        'is_recurring' => 'boolean',
        'is_womens' => 'boolean',
        'min_cost' => 'decimal:2',
        'max_cost' => 'decimal:2',
        'is_free' => 'boolean',
        'route_geojson' => 'array',
    ];

    /**
     * Get the user who created this event (null for system-imported events).
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get the category this event belongs to.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the sponsor for this event.
     */
    public function sponsor(): BelongsTo
    {
        return $this->belongsTo(Sponsor::class);
    }

    /**
     * Get the location for this event.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get the tags for this event.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Get users who have favourited this event.
     */
    public function favouritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favourites')
            ->withTimestamps();
    }

    /**
     * Scope: Events happening right now.
     */
    public function scopeHappeningNow(Builder $query): Builder
    {
        $now = now();

        return $query->where('start_datetime', '<=', $now)
            ->where('end_datetime', '>=', $now);
    }

    /**
     * Scope: Events on a specific date.
     */
    public function scopeOnDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('start_datetime', $date);
    }

    /**
     * Scope: Featured events only.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope: Events with ride metrics (ride-type events).
     */
    public function scopeRides(Builder $query): Builder
    {
        return $query->whereNotNull('ride_distance_km');
    }

    /**
     * Scope: Filter by minimum distance.
     */
    public function scopeMinDistance(Builder $query, float $km): Builder
    {
        return $query->where('ride_distance_km', '>=', $km);
    }

    /**
     * Scope: Filter by maximum distance.
     */
    public function scopeMaxDistance(Builder $query, float $km): Builder
    {
        return $query->where('ride_distance_km', '<=', $km);
    }

    /**
     * Scope: Filter by minimum elevation gain.
     */
    public function scopeMinElevation(Builder $query, int $meters): Builder
    {
        return $query->where('elevation_gain_m', '>=', $meters);
    }

    /**
     * Scope: Filter by maximum elevation gain.
     */
    public function scopeMaxElevation(Builder $query, int $meters): Builder
    {
        return $query->where('elevation_gain_m', '<=', $meters);
    }

    /**
     * Scope: Upcoming events (starting from now).
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('start_datetime', '>=', now())
            ->orderBy('start_datetime');
    }

    /**
     * Check if the event is currently happening.
     */
    public function isHappeningNow(): bool
    {
        $now = now();

        return $this->start_datetime <= $now && $this->end_datetime >= $now;
    }

    /**
     * Check if this is a ride event.
     */
    public function isRide(): bool
    {
        return $this->ride_distance_km !== null;
    }

    /**
     * Scope: Filter by location.
     */
    public function scopeAtLocation(Builder $query, int $locationId): Builder
    {
        return $query->where('location_id', $locationId);
    }

    /**
     * Scope: Filter by date range.
     */
    public function scopeBetweenDates(Builder $query, string $startDate, ?string $endDate = null): Builder
    {
        $query->whereDate('start_datetime', '>=', $startDate);

        if ($endDate) {
            $query->whereDate('start_datetime', '<=', $endDate);
        }

        return $query;
    }

    /**
     * Scope: Free events only.
     */
    public function scopeFree(Builder $query): Builder
    {
        return $query->where('is_free', true);
    }

    /**
     * Scope: Paid events only.
     */
    public function scopePaid(Builder $query): Builder
    {
        return $query->where('is_free', false);
    }

    /**
     * Scope: Filter by maximum cost.
     */
    public function scopeMaxCost(Builder $query, float $maxCost): Builder
    {
        return $query->where(function ($q) use ($maxCost) {
            $q->where(function ($sub) use ($maxCost) {
                $sub->whereNotNull('min_cost')
                    ->where('min_cost', '<=', $maxCost);
            })->orWhere(function ($sub) use ($maxCost) {
                $sub->whereNotNull('max_cost')
                    ->where('max_cost', '<=', $maxCost);
            })->orWhere('is_free', true);
        });
    }

    /**
     * Scope: Filter by minimum cost.
     */
    public function scopeMinCost(Builder $query, float $minCost): Builder
    {
        return $query->where(function ($q) use ($minCost) {
            $q->where(function ($sub) use ($minCost) {
                $sub->whereNotNull('max_cost')
                    ->where('max_cost', '>=', $minCost);
            })->orWhere(function ($sub) use ($minCost) {
                $sub->whereNotNull('min_cost')
                    ->where('min_cost', '>=', $minCost);
            });
        });
    }

    /**
     * Scope: Order by popularity (favourites count).
     */
    public function scopeOrderByPopularity(Builder $query, string $direction = 'desc'): Builder
    {
        return $query->withCount('favouritedBy')
            ->orderBy('favourited_by_count', $direction);
    }

    /**
     * Scope: Filter by minimum favourites count.
     */
    public function scopeMinFavourites(Builder $query, int $minCount): Builder
    {
        return $query->has('favouritedBy', '>=', $minCount);
    }

    /**
     * Scope: Recurring events only.
     */
    public function scopeRecurring(Builder $query): Builder
    {
        return $query->where('is_recurring', true);
    }

    /**
     * Scope: Women's tailored events only.
     */
    public function scopeWomens(Builder $query): Builder
    {
        return $query->where('is_womens', true);
    }

    /**
     * Compute the TDU year a given date belongs to.
     * October–December of year N belongs to TDU year N+1.
     */
    public static function tduYearFor(\Carbon\CarbonInterface $date): int
    {
        return $date->month >= 10 ? $date->year + 1 : $date->year;
    }

    /**
     * The TDU year that today falls within.
     */
    public static function currentTduYear(): int
    {
        return static::tduYearFor(now());
    }

    /**
     * All TDU years represented in the events table, newest first.
     * Always includes the current TDU year even if no events exist yet.
     *
     * @return array<int>
     */
    public static function availableTduYears(): array
    {
        $min = static::query()->min('start_datetime');
        $max = static::query()->max('start_datetime');

        if (! $min) {
            return [static::currentTduYear()];
        }

        $minYear = static::tduYearFor(\Carbon\CarbonImmutable::parse($min));
        $maxYear = max(
            static::tduYearFor(\Carbon\CarbonImmutable::parse($max)),
            static::currentTduYear()
        );

        return array_values(array_reverse(range($minYear, $maxYear)));
    }

    /**
     * Scope: events belonging to a specific TDU season.
     * TDU year Y spans October 1 of (Y-1) through September 30 of Y.
     */
    public function scopeForTduYear(Builder $query, int $year): Builder
    {
        return $query->whereBetween('start_datetime', [
            \Carbon\CarbonImmutable::create($year - 1, 10, 1)->startOfDay(),
            \Carbon\CarbonImmutable::create($year, 9, 30)->endOfDay(),
        ]);
    }

    /**
     * Scope: Full-text search across title and description.
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', '%'.$term.'%')
                ->orWhere('description', 'like', '%'.$term.'%');
        });
    }

    /**
     * Scope: Filter to events that have all of the given tag slugs.
     */
    public function scopeWithTags(Builder $query, array $slugs): Builder
    {
        foreach ($slugs as $slug) {
            $query->whereHas('tags', fn (Builder $q) => $q->where('slug', $slug));
        }

        return $query;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('banner')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

        // Stores the original GPX file for the route. The processed GeoJSON
        // is kept in the route_geojson column for fast map rendering.
        $this->addMediaCollection('route_gpx')
            ->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('card')
            ->width(800)
            ->height(400)
            ->nonQueued();

        $this->addMediaConversion('thumb')
            ->width(400)
            ->height(200)
            ->nonQueued();
    }
}
