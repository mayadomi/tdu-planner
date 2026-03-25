<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim($request->input('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $results = Event::search($q)
            ->with('category')
            ->select(['id', 'title', 'start_datetime', 'category_id'])
            ->limit(8)
            ->get()
            ->map(fn (Event $event) => [
                'id'         => $event->id,
                'title'      => $event->title,
                'category'   => $event->category?->name,
                'start_date' => $event->start_datetime->format('D j M'),
                'date'       => $event->start_datetime->format('Y-m-d'),
            ]);

        return response()->json($results);
    }
}
