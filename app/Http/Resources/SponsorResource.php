<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SponsorResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'events_count' => $this->whenCounted('events'),
            'logo_square_url'      => $this->getFirstMediaUrl('logo_square', 'display'),
            'logo_square_dark_url' => $this->getFirstMediaUrl('logo_square_dark', 'display'),
            'logo_rect_url'        => $this->getFirstMediaUrl('logo_rect', 'display'),
            'logo_rect_dark_url'   => $this->getFirstMediaUrl('logo_rect_dark', 'display'),
        ];
    }
}
