<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventCollection;
use App\Http\Resources\SponsorResource;
use App\Models\Sponsor;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SponsorController extends Controller
{
    /**
     * List all sponsors.
     */
    public function index(): AnonymousResourceCollection
    {
        $sponsors = Sponsor::withCount('events')
            ->orderBy('name')
            ->get();

        return SponsorResource::collection($sponsors);
    }

    /**
     * Get a single sponsor.
     */
    public function show(Sponsor $sponsor): SponsorResource
    {
        $sponsor->loadCount('events');

        return new SponsorResource($sponsor);
    }

    /**
     * Get all events by a sponsor.
     */
    public function events(Sponsor $sponsor): EventCollection
    {
        $events = $sponsor->events()
            ->with(['category', 'location'])
            ->orderBy('start_datetime')
            ->paginate(20);

        return new EventCollection($events);
    }
}
