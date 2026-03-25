<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\FiltersEvents;
use App\Http\Requests\FilterEventsRequest;
use App\Http\Resources\EventCollection;
use App\Http\Resources\EventResource;
use App\Models\Event;

class EventController extends Controller
{
    use FiltersEvents;

    /**
     * List all events with optional filters.
     *
     * Query parameters:
     * - date: Filter by specific date (Y-m-d)
     * - start_date: Filter events starting from this date (Y-m-d)
     * - end_date: Filter events up to this date (Y-m-d)
     * - category: Filter by category slug
     * - sponsor: Filter by sponsor slug
     * - location: Filter by location ID
     * - min_distance: Minimum ride distance in km
     * - max_distance: Maximum ride distance in km
     * - min_elevation: Minimum elevation gain in meters
     * - max_elevation: Maximum elevation gain in meters
     * - rides_only: Only show ride events (1/0)
     * - featured: Only show featured events (1/0)
     * - free: Only show free events (1/0)
     * - max_cost: Maximum event cost
     * - min_cost: Minimum event cost
     * - sort: Sort field (date, popularity, cost, distance, elevation)
     * - order: Sort direction (asc, desc)
     * - per_page: Items per page (default 20, max 100)
     */
    public function index(FilterEventsRequest $request): EventCollection
    {
        $query = Event::with(['category', 'sponsor', 'location', 'tags']);

        // Always include favourites count for popularity sorting/display
        $query->withCount('favouritedBy');

        $this->applyEventFilters($query, $request);
        $this->applyEventSorting($query, $request->input('sort', 'date'), $request->input('order', 'asc'));

        // Pagination
        $perPage = min((int) $request->input('per_page', 20), 100);

        return new EventCollection($query->paginate($perPage));
    }

    /**
     * Get events happening right now.
     */
    public function happeningNow(): EventCollection
    {
        $events = Event::with(['category', 'sponsor', 'location', 'tags'])
            ->withCount('favouritedBy')
            ->happeningNow()
            ->orderBy('end_datetime')
            ->get();

        return new EventCollection($events);
    }

    /**
     * Get featured events.
     */
    public function featured(): EventCollection
    {
        $events = Event::with(['category', 'sponsor', 'location', 'tags'])
            ->withCount('favouritedBy')
            ->featured()
            ->upcoming()
            ->limit(10)
            ->get();

        return new EventCollection($events);
    }

    /**
     * Get popular events (most favourited).
     */
    public function popular(Request $request): EventCollection
    {
        $limit = min((int) $request->input('limit', 10), 50);

        $events = Event::with(['category', 'sponsor', 'location', 'tags'])
            ->withCount('favouritedBy')
            ->orderBy('favourited_by_count', 'desc')
            ->limit($limit)
            ->get();

        return new EventCollection($events);
    }

    /**
     * Get a single event.
     */
    public function show(Event $event): EventResource
    {
        $event->load(['category', 'sponsor', 'location', 'tags']);
        $event->loadCount('favouritedBy');

        return new EventResource($event);
    }
}
