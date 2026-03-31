<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    // All hour calculations use this timezone so the frontend and server agree
    private const DISPLAY_TZ = 'Australia/Adelaide';

    // Canonical display order for the schedule rows
    private const CATEGORY_ORDER = [
        'race-stages',
        'official-events',
        'watch-parties',
        'group-rides',
        'local-racing',
        'pop-up',
        'expo',
        'pop-ups',
        'team-meets',
        'food-wine',
        'entertainment',
        'podcast',
        'other',
    ];

    /**
     * Display the schedule/timeline view.
     */
    public function index(Request $request): Response
    {
        $tduYear = (int) ($request->input('year') ?: Event::currentTduYear());

        // Get date range for the selected TDU year
        $dateRange = $this->getEventDateRange($tduYear);

        // Selected date (default to first event date or today), in display timezone
        $selectedDate = $request->input('date')
            ? Carbon::parse($request->input('date'), self::DISPLAY_TZ)->startOfDay()
            : ($dateRange['start'] ?? Carbon::now(self::DISPLAY_TZ)->startOfDay());

        // Get events for the selected date, scoped to the TDU year
        $events = Event::with(['category', 'sponsor', 'location'])
            ->forTduYear($tduYear)
            ->whereDate('start_datetime', $selectedDate)
            ->orderBy('start_datetime')
            ->get();

        // Load all schedule categories keyed by slug
        $allCategories = Category::whereIn('slug', self::CATEGORY_ORDER)->get()->keyBy('slug');

        // Group the day's events by category slug
        $eventsBySlug = $events->groupBy(fn ($event) => $event->category?->slug ?? 'other');

        // Build timeline rows in canonical order, always including every category
        $timelineData = [];
        foreach (self::CATEGORY_ORDER as $slug) {
            $category = $allCategories->get($slug);
            if (! $category) {
                continue;
            }

            $categoryEvents = $eventsBySlug->get($slug, collect());

            $timelineData[] = [
                'category' => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ],
                'events' => $categoryEvents->map(function ($event) {
                    $start = $event->start_datetime;
                    $end = $event->end_datetime;

                    return [
                        'id' => $event->id,
                        'title' => $event->title,
                        'start_datetime' => $start->toIso8601String(),
                        'end_datetime' => $end->toIso8601String(),
                        'start_hour' => $start->hour + ($start->minute / 60),
                        'end_hour' => $end->hour + ($end->minute / 60),
                        'duration_hours' => $start->diffInMinutes($end) / 60,
                        'category_slug' => $event->category?->slug ?? 'other',
                        'location' => $event->location?->name,
                        'ride_distance_km' => $event->ride_distance_km,
                        'elevation_gain_m' => $event->elevation_gain_m,
                        'is_featured' => $event->is_featured,
                        'url' => $event->url,
                    ];
                })->values()->toArray(),
            ];
        }

        // Get available dates scoped to the TDU year
        $availableDates = Event::forTduYear($tduYear)
            ->selectRaw('DATE(start_datetime) as date')
            ->distinct()
            ->orderBy('date')
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->format('Y-m-d'))
            ->toArray();

        // Calculate timeline bounds (earliest start, latest end for the day)
        $dayStart = 6; // 6 AM minimum
        $dayEnd = 23;  // 11 PM

        if ($events->isNotEmpty()) {
            $latestEnd = $events->max(fn ($e) => $e->end_datetime->hour + 1);
            $dayEnd = min(24, max($dayEnd, $latestEnd));
        }

        return Inertia::render('schedule/index', [
            'timelineData' => $timelineData,
            'selectedDate' => $selectedDate->format('Y-m-d'),
            'availableDates' => $availableDates,
            'timelineBounds' => [
                'startHour' => $dayStart,
                'endHour' => $dayEnd,
            ],
            'currentTime' => now()->toIso8601String(),
            'highlightEventId' => $request->integer('highlight') ?: null,
            'tduYear' => $tduYear,
            'availableYears' => Event::availableTduYears(),
        ]);
    }

    /**
     * Get the date range of events for a given TDU year.
     */
    private function getEventDateRange(int $year): array
    {
        $firstEvent = Event::forTduYear($year)->orderBy('start_datetime')->first();
        $lastEvent = Event::forTduYear($year)->orderBy('start_datetime', 'desc')->first();

        return [
            'start' => $firstEvent?->start_datetime?->startOfDay(),
            'end' => $lastEvent?->start_datetime?->startOfDay(),
        ];
    }
}
