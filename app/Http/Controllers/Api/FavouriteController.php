<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventCollection;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavouriteController extends Controller
{
    /**
     * Get all favourited events for the authenticated user.
     */
    public function index(Request $request): EventCollection
    {
        $events = $request->user()
            ->favouriteEvents()
            ->with(['category', 'sponsor', 'location'])
            ->orderBy('start_datetime')
            ->get();

        return new EventCollection($events);
    }

    /**
     * Add an event to favourites.
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        if ($user->hasFavourited($event)) {
            return response()->json([
                'message' => 'Event already favourited',
                'favourited' => true,
            ], 200);
        }

        $user->favouriteEvents()->attach($event->id);

        return response()->json([
            'message' => 'Event added to favourites',
            'favourited' => true,
        ], 201);
    }

    /**
     * Remove an event from favourites.
     */
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $request->user()->favouriteEvents()->detach($event->id);

        return response()->json([
            'message' => 'Event removed from favourites',
            'favourited' => false,
        ]);
    }

    /**
     * Toggle favourite status for an event.
     */
    public function toggle(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        $isFavourited = $user->toggleFavourite($event);

        return response()->json([
            'message' => $isFavourited ? 'Event added to favourites' : 'Event removed from favourites',
            'favourited' => $isFavourited,
        ]);
    }
}
