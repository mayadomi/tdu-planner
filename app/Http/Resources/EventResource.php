<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'start_datetime' => $this->start_datetime->toIso8601String(),
            'end_datetime' => $this->end_datetime->toIso8601String(),
            'start_date' => $this->start_datetime->format('Y-m-d'),
            'start_time' => $this->start_datetime->format('H:i'),
            'end_time' => $this->end_datetime->format('H:i'),
            'day_of_week' => $this->start_datetime->format('l'),
            'pace' => $this->pace,
            'route_url' => $this->route_url,
            'is_featured' => $this->is_featured,
            'is_recurring' => $this->is_recurring,
            'is_womens' => $this->is_womens,
            'is_happening_now' => $this->isHappeningNow(),
            'url' => $this->url,
            'banner_image_url'       => $this->getFirstMediaUrl('banner', 'card'),
            'banner_image_thumb_url' => $this->getFirstMediaUrl('banner', 'thumb'),

            // Cost fields
            'min_cost' => $this->min_cost,
            'max_cost' => $this->max_cost,
            'is_free' => $this->is_free,
            'cost_formatted' => $this->formatCostRange(),

            // Ride-specific fields (nullable)
            'ride_distance_km' => $this->ride_distance_km,
            'elevation_gain_m' => $this->elevation_gain_m,
            'is_ride' => $this->isRide(),

            // Popularity (when loaded via withCount)
            'favourites_count' => $this->when(
                isset($this->favourited_by_count),
                $this->favourited_by_count
            ),

            // Relationships (when loaded)
            'category' => $this->when(
                $this->relationLoaded('category'),
                fn () => (new CategoryResource($this->category))->resolve()
            ),
            'sponsor' => $this->when(
                $this->relationLoaded('sponsor'),
                fn () => (new SponsorResource($this->sponsor))->resolve()
            ),
            'location' => $this->when(
                $this->relationLoaded('location'),
                fn () => (new LocationResource($this->location))->resolve()
            ),
            'tags' => $this->when(
                $this->relationLoaded('tags'),
                fn () => $this->tags->map(fn ($tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'slug' => $tag->slug,
                ])
            ),

            // Auth-specific: whether current user has favourited (when available)
            'is_favourited' => $this->when(
                $request->user() && $this->relationLoaded('favouritedBy'),
                fn () => $this->favouritedBy->contains('id', $request->user()?->id)
            ),

            // Timestamps
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }

    /**
     * Format cost range for display.
     */
    private function formatCostRange(): string
    {
        if ($this->is_free) {
            return 'Free';
        }

        $min = $this->min_cost;
        $max = $this->max_cost;

        if ($min !== null && $max !== null) {
            if ((float) $min > (float) $max) {
                return 'Pricing TBA';
            }
            if ((float) $min === (float) $max) {
                return '$' . number_format($min, 2);
            }
            return '$' . number_format($min, 2) . ' - $' . number_format($max, 2);
        }

        if ($min !== null) {
            return 'From $' . number_format($min, 2);
        }

        if ($max !== null) {
            return 'Up to $' . number_format($max, 2);
        }

        return 'Pricing TBA';
    }
}
