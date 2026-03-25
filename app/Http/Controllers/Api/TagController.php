<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        $tags = Tag::withCount('events')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json($tags);
    }
}
