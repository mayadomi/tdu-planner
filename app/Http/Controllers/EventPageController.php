<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltersEvents;
use App\Http\Requests\FilterEventsRequest;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Category;
use App\Models\Event;
use App\Models\Location;
use App\Models\Sponsor;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class EventPageController extends Controller
{
    use FiltersEvents;

    /**
     * Display the events listing page.
     */
    public function index(FilterEventsRequest $request): Response
    {
        $tduYear = (int) ($request->input('year') ?: Event::currentTduYear());

        $query = Event::with(['category', 'sponsor', 'location', 'tags'])
            ->forTduYear($tduYear)
            ->withCount('favouritedBy');

        // Apply filters and sorting
        $this->applyEventFilters($query, $request);
        $this->applyEventSorting($query, $request->input('sort', 'date'), $request->input('order', 'asc'));

        // Get paginated results
        $perPage = min((int) $request->input('per_page', 12), 100);
        $paginator = $query->paginate($perPage)->withQueryString();

        // Transform to array format expected by frontend
        $events = [
            'data' => EventResource::collection($paginator->items())->resolve(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'next_page_url' => $paginator->nextPageUrl(),
            'links' => $paginator->linkCollection()->toArray(),
        ];

        // Get filter options (cached — these change only when events are imported)
        $categories = Cache::remember('filter_categories', 3600, fn () => Category::withCount('events')->orderBy('name')->get()
        );
        $locations = Cache::remember('filter_locations', 3600, fn () => Location::withCount('events')->orderBy('name')->get()
        );
        $tags = Cache::remember('filter_tags', 3600, fn () => Tag::withCount('events')->orderBy('name')->get()
        );

        // Get featured events when no content filters are active
        $featuredEvents = null;
        $contentFilters = $request->except(['page', 'per_page', 'year', 'sort', 'order']);
        if (empty($contentFilters)) {
            $featuredEvents = EventResource::collection(
                Event::with(['category', 'sponsor', 'location', 'tags'])
                    ->forTduYear($tduYear)
                    ->withCount('favouritedBy')
                    ->featured()
                    ->orderBy('start_datetime')
                    ->limit(6)
                    ->get()
            )->resolve();
        }

        return Inertia::render('events/index', [
            'events' => $events,
            'categories' => $categories,
            'locations' => $locations,
            'tags' => $tags,
            'filters' => (object) $request->only([
                'search', 'date', 'start_date', 'end_date', 'category', 'sponsor', 'location',
                'min_distance', 'max_distance', 'min_elevation', 'max_elevation',
                'rides_only', 'featured', 'free', 'recurring', 'womens', 'min_cost', 'max_cost',
                'min_favourites', 'tags', 'sort', 'order',
            ]),
            'tduYear' => $tduYear,
            'availableYears' => Event::availableTduYears(),
            'featuredEvents' => $featuredEvents,
        ]);
    }

    /**
     * Show the create event form.
     */
    public function create(): Response
    {
        $this->authorize('create', Event::class);

        $user = auth()->user();

        return Inertia::render('events/create', [
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'sponsors' => $user->isAdmin()
                ? Sponsor::orderBy('name')->get(['id', 'name'])
                : $user->verifiedSponsors()->orderBy('sponsors.name')->get(['sponsors.id', 'sponsors.name']),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'tags' => Tag::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a new event.
     */
    public function store(StoreEventRequest $request): RedirectResponse
    {
        $event = Event::create([
            ...$request->safe()->except(['tag_ids', 'gpx', 'route_geojson']),
            'created_by_user_id' => $request->user()->id,
        ]);

        $event->tags()->sync($request->input('tag_ids', []));

        if ($request->hasFile('gpx')) {
            $geojson = json_decode($request->input('route_geojson'), true);
            $event->addMediaFromRequest('gpx')->toMediaCollection('route_gpx');
            $event->update(['route_geojson' => $geojson]);
        }

        return redirect()->route('events.show', $event)
            ->with('success', 'Event created successfully.');
    }

    /**
     * Show the edit form for an event (editor role required).
     */
    public function edit(Event $event): Response
    {
        $this->authorize('update', $event);
        $event->load('tags');

        $user = auth()->user();

        return Inertia::render('events/edit', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'start_datetime' => $event->start_datetime->format('Y-m-d\TH:i'),
                'end_datetime' => $event->end_datetime->format('Y-m-d\TH:i'),
                'category_id' => $event->category_id,
                'sponsor_id' => $event->sponsor_id,
                'location_id' => $event->location_id,
                'pace' => $event->pace,
                'route_url' => $event->route_url,
                'url' => $event->url,
                'is_featured' => $event->is_featured,
                'is_recurring' => $event->is_recurring,
                'is_womens' => $event->is_womens,
                'is_free' => $event->is_free,
                'min_cost' => $event->min_cost,
                'max_cost' => $event->max_cost,
                'ride_distance_km' => $event->ride_distance_km,
                'elevation_gain_m' => $event->elevation_gain_m,
                'tag_ids' => $event->tags->pluck('id')->toArray(),
                'banner_image_url' => $event->getFirstMediaUrl('banner', 'card'),
                'has_route' => $event->hasMedia('route_gpx'),
                'route_gpx_name' => $event->getFirstMedia('route_gpx')?->file_name,
            ],
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'sponsors' => $user->isAdmin()
                ? Sponsor::orderBy('name')->get(['id', 'name'])
                : $user->verifiedSponsors()->orderBy('sponsors.name')->get(['sponsors.id', 'sponsors.name']),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'tags' => Tag::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update an event (editor role required).
     */
    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $event->update($request->safe()->except('tag_ids'));
        $event->tags()->sync($request->input('tag_ids', []));

        return redirect()->route('events.show', $event);
    }

    /**
     * Upload (or replace) the event banner image.
     */
    public function uploadBanner(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('manageBanner', $event);
        $request->validate([
            'banner' => ['required', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp,gif'],
        ]);

        $event->addMediaFromRequest('banner')
            ->toMediaCollection('banner');

        return back()->with('success', 'Banner image updated.');
    }

    /**
     * Remove the event banner image.
     */
    public function deleteBanner(Event $event): RedirectResponse
    {
        $this->authorize('manageBanner', $event);
        $event->clearMediaCollection('banner');

        return back()->with('success', 'Banner image removed.');
    }

    /**
     * Upload (or replace) the event GPX route file and its derived GeoJSON.
     */
    public function uploadRoute(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('manageRoute', $event);
        $request->validate([
            'gpx' => ['required', 'file', 'max:10240'],
            'route_geojson' => ['required', 'string'],
        ]);

        // Validate that route_geojson is well-formed JSON
        $geojson = json_decode($request->input('route_geojson'), true);
        if (json_last_error() !== JSON_ERROR_NONE || ! isset($geojson['type'])) {
            return back()->withErrors(['route_geojson' => 'Invalid GeoJSON data.']);
        }

        // Store original GPX for future re-processing (e.g. PostGIS migration)
        $event->addMediaFromRequest('gpx')->toMediaCollection('route_gpx');

        // Store the processed GeoJSON for fast map rendering
        $event->update(['route_geojson' => $geojson]);

        return back()->with('success', 'Route uploaded.');
    }

    /**
     * Remove the event GPX route and its GeoJSON.
     */
    public function deleteRoute(Event $event): RedirectResponse
    {
        $this->authorize('manageRoute', $event);
        $event->clearMediaCollection('route_gpx');
        $event->update(['route_geojson' => null]);

        return back()->with('success', 'Route removed.');
    }

    /**
     * Display a single event.
     */
    public function show(Event $event): Response
    {
        $event->load(['category', 'sponsor', 'location', 'tags']);
        $event->loadCount('favouritedBy');

        // Check if current user has favourited this event
        if ($user = auth()->user()) {
            $event->is_favourited = $user->hasFavourited($event);
        }

        return Inertia::render('events/show', [
            'event' => (new EventResource($event))->resolve(),
            'can_edit' => auth()->user()?->can('update', $event) ?? false,
        ]);
    }
}
