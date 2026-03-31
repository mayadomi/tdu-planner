<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    private const DISPLAY_TZ = 'Australia/Adelaide';

    public function index(Request $request): Response
    {
        $dateRange = $this->getEventDateRange();

        $selectedDate = $request->input('date')
            ? Carbon::parse($request->input('date'), self::DISPLAY_TZ)->startOfDay()
            : ($dateRange['start'] ?? Carbon::now(self::DISPLAY_TZ)->startOfDay());

        $events = Event::with(['category', 'location', 'sponsor.media'])
            ->whereDate('start_datetime', $selectedDate)
            ->whereHas('location')
            ->orderBy('start_datetime')
            ->get();

        $availableDates = Event::selectRaw('DATE(start_datetime) as date')
            ->distinct()
            ->orderBy('date')
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->format('Y-m-d'))
            ->toArray();

        // Fetch the authenticated user's favourite event IDs in one query
        $user = $request->user();
        $favouriteEventIds = $user
            ? $user->favourites()->pluck('event_id')->flip()->all()
            : [];

        // Group events by location so each pin can show multiple events
        $markers = $events
            ->groupBy('location_id')
            ->map(function ($locationEvents) use ($favouriteEventIds) {
                $location = $locationEvents->first()->location;

                return [
                    'location_id' => $location->id,
                    'location_name' => $location->name,
                    'latitude' => (float) $location->latitude,
                    'longitude' => (float) $location->longitude,
                    'events' => $locationEvents->map(fn ($event) => [
                        'id' => $event->id,
                        'title' => $event->title,
                        'start_datetime' => $event->start_datetime->toIso8601String(),
                        'end_datetime' => $event->end_datetime->toIso8601String(),
                        'category_slug' => $event->category?->slug ?? 'other',
                        'category_name' => $event->category?->name ?? 'Other',
                        'url' => $event->url,
                        'ride_distance_km' => $event->ride_distance_km,
                        'elevation_gain_m' => $event->elevation_gain_m,
                        'is_featured' => $event->is_featured,
                        'route_geojson' => $event->route_geojson,
                        'sponsor_logo_url' => $event->sponsor?->getFirstMediaUrl('logo_square', 'display') ?: null,
                        'sponsor_logo_dark_url' => $event->sponsor?->getFirstMediaUrl('logo_square_dark', 'display') ?: null,
                        'is_favourited' => isset($favouriteEventIds[$event->id]),
                    ])->values()->toArray(),
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('map/index', [
            'markers' => $markers,
            'selectedDate' => $selectedDate->format('Y-m-d'),
            'availableDates' => $availableDates,
        ]);
    }

    private function getEventDateRange(): array
    {
        $firstEvent = Event::orderBy('start_datetime')->first();
        $lastEvent = Event::orderBy('start_datetime', 'desc')->first();

        return [
            'start' => $firstEvent?->start_datetime?->startOfDay(),
            'end' => $lastEvent?->start_datetime?->startOfDay(),
        ];
    }
}
