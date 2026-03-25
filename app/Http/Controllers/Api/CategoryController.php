<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\EventCollection;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    /**
     * List all categories.
     */
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::withCount('events')
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * Get a single category.
     */
    public function show(Category $category): CategoryResource
    {
        $category->loadCount('events');

        return new CategoryResource($category);
    }

    /**
     * Get all events in a category.
     */
    public function events(Category $category): EventCollection
    {
        $events = $category->events()
            ->with(['sponsor', 'location'])
            ->orderBy('start_datetime')
            ->paginate(20);

        return new EventCollection($events);
    }
}
