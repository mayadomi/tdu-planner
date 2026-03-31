<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $upcomingEvents = Event::upcoming()
            ->with(['category', 'sponsor.media', 'location'])
            ->withCount('favouritedBy')
            ->with(['favouritedBy' => fn ($q) => $q->where('users.id', $user->id)])
            ->limit(6)
            ->get();

        return Inertia::render('dashboard', [
            'upcomingEvents' => EventResource::collection($upcomingEvents)->resolve(),
            'favouritesCount' => $user->favourites()->count(),
        ]);
    }
}
