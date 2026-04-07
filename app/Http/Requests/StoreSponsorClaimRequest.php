<?php

namespace App\Http\Requests;

use App\Models\SponsorClaim;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSponsorClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canEditEvents() ?? false;
    }

    public function rules(): array
    {
        return [
            'request_type' => ['required', Rule::in(['claim_existing', 'new_sponsor_request'])],
            'sponsor_id' => [
                'nullable',
                'integer',
                'exists:sponsors,id',
                Rule::requiredIf($this->input('request_type') === 'claim_existing'),
            ],
            'proposed_sponsor_name' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf($this->input('request_type') === 'new_sponsor_request'),
            ],
            'proposed_sponsor_website' => ['nullable', 'url', 'max:500'],
            'editor_note' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('request_type') !== 'claim_existing') {
                return;
            }

            $alreadyActive = SponsorClaim::where('user_id', $this->user()->id)
                ->where('sponsor_id', $this->input('sponsor_id'))
                ->whereIn('status', ['pending', 'verified'])
                ->exists();

            if ($alreadyActive) {
                $validator->errors()->add('sponsor_id', 'You already have a pending or verified claim for this sponsor.');
            }
        });
    }
}
