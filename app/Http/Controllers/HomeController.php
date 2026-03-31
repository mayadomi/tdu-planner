<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $upcomingEvents = Event::upcoming()
            ->with(['category', 'sponsor.media', 'location'])
            ->withCount('favouritedBy')
            ->when($user, function ($query) use ($user): void {
                $query->with(['favouritedBy' => fn ($q) => $q->where('users.id', $user->id)]);
            })
            ->limit(12)
            ->get();

        return Inertia::render('home', [
            'upcomingEvents' => EventResource::collection($upcomingEvents)->resolve(),
        ]);
    }
}
