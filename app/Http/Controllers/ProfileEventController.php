<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileEventController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $events = Event::with(['category', 'sponsor', 'location'])
            ->where('created_by_user_id', $user->id)
            ->withCount('favouritedBy')
            ->orderByDesc('start_datetime')
            ->get();

        return Inertia::render('profile/events/index', [
            'events' => EventResource::collection($events)->resolve(),
        ]);
    }
}
