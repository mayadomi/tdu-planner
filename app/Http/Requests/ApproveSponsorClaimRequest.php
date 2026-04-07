<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApproveSponsorClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $claim = $this->route('sponsorClaim');

        return [
            'sponsor_name' => [
                Rule::requiredIf($claim?->request_type === 'new_sponsor_request'),
                'nullable',
                'string',
                'max:255',
            ],
            'sponsor_website' => ['nullable', 'url', 'max:500'],
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
