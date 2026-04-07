<?php

namespace Database\Factories;

use App\Models\Sponsor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SponsorClaim>
 */
class SponsorClaimFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'sponsor_id' => Sponsor::factory(),
            'status' => 'pending',
            'request_type' => 'claim_existing',
            'editor_note' => null,
            'admin_note' => null,
            'proposed_sponsor_name' => null,
            'proposed_sponsor_website' => null,
            'verified_at' => null,
            'verified_by_user_id' => null,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn () => [
            'status' => 'verified',
            'verified_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => 'rejected']);
    }

    public function newSponsorRequest(): static
    {
        return $this->state(fn () => [
            'request_type' => 'new_sponsor_request',
            'sponsor_id' => null,
            'proposed_sponsor_name' => fake()->company(),
            'proposed_sponsor_website' => fake()->url(),
        ]);
    }
}
