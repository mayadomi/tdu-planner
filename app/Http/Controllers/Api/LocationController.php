<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    /**
     * List all locations (useful for map view).
     */
    public function index(): AnonymousResourceCollection
    {
        $locations = Location::withCount('events')
            ->orderBy('name')
            ->get();

        return LocationResource::collection($locations);
    }

    /**
     * Get a single location with its events.
     */
    public function show(Location $location): LocationResource
    {
        $location->load(['events' => function ($query) {
            $query->with(['category', 'sponsor'])
                ->orderBy('start_datetime');
        }]);

        return new LocationResource($location);
    }
}
