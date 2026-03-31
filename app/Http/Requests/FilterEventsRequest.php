<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterEventsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:200',
            'date' => 'nullable|date_format:Y-m-d',
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            'category' => 'nullable|string|max:100',
            'sponsor' => 'nullable|string|max:100',
            'location' => 'nullable|integer|min:1',
            'min_distance' => 'nullable|numeric|min:0',
            'max_distance' => 'nullable|numeric|min:0',
            'min_elevation' => 'nullable|integer|min:0',
            'max_elevation' => 'nullable|integer|min:0',
            'min_cost' => 'nullable|numeric|min:0',
            'max_cost' => ['nullable', 'numeric', 'min:0', Rule::when($this->filled('min_cost'), 'gte:min_cost')],
            'min_favourites' => 'nullable|integer|min:0',
            'rides_only' => 'nullable|boolean',
            'featured' => 'nullable|boolean',
            'free' => 'nullable|boolean',
            'recurring' => 'nullable|boolean',
            'womens' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
            'sort' => 'nullable|in:date,popularity,cost,distance,elevation',
            'order' => 'nullable|in:asc,desc',
            'per_page' => 'nullable|integer|min:1',
            'year' => 'nullable|integer|min:2000|max:2100',
        ];
    }
}
