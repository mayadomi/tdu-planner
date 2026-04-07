<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('event')) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'sponsor_id' => [
                'nullable',
                'integer',
                'exists:sponsors,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $user = $this->user();
                    if ($value === null || $user->isAdmin()) {
                        return;
                    }
                    $isVerified = $user->verifiedSponsors()
                        ->where('sponsors.id', $value)
                        ->exists();
                    if (! $isVerified) {
                        $fail('You may only update events for sponsors you are verified with.');
                    }
                },
            ],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'pace' => ['nullable', 'string', 'max:100'],
            'route_url' => ['nullable', 'url', 'max:500'],
            'url' => ['nullable', 'url', 'max:500'],
            'is_featured' => ['boolean'],
            'is_recurring' => ['boolean'],
            'is_womens' => ['boolean'],
            'is_free' => ['boolean'],
            'min_cost' => ['nullable', 'numeric', 'min:0'],
            'max_cost' => ['nullable', 'numeric', 'min:0', 'gte:min_cost'],
            'ride_distance_km' => ['nullable', 'numeric', 'min:0'],
            'elevation_gain_m' => ['nullable', 'integer', 'min:0'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
