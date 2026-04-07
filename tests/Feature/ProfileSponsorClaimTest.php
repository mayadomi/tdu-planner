<?php

use App\Models\Sponsor;
use App\Models\SponsorClaim;
use App\Models\User;

// ── Access ────────────────────────────────────────────────────────────────────

test('guest is redirected from profile sponsors page', function () {
    $this->get(route('profile.sponsors.index'))->assertRedirect(route('login'));
});

test('editor can view their sponsors page', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->get(route('profile.sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profile/sponsors')
            ->has('claims')
            ->has('availableSponsors')
        );
});

test('viewer cannot submit a claim', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);
    $sponsor = Sponsor::factory()->create();

    $this->actingAs($viewer)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'claim_existing',
            'sponsor_id' => $sponsor->id,
        ])
        ->assertForbidden();
});

// ── Claim existing sponsor ────────────────────────────────────────────────────

test('editor can submit a claim for an existing sponsor', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    $this->actingAs($editor)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'claim_existing',
            'sponsor_id' => $sponsor->id,
            'editor_note' => 'I am the events coordinator.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('sponsor_user', [
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
        'status' => 'pending',
        'request_type' => 'claim_existing',
        'editor_note' => 'I am the events coordinator.',
    ]);
});

test('editor cannot claim the same sponsor twice when one is pending', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    SponsorClaim::factory()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
        'status' => 'pending',
    ]);

    $this->actingAs($editor)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'claim_existing',
            'sponsor_id' => $sponsor->id,
        ])
        ->assertSessionHasErrors('sponsor_id');
});

test('editor cannot claim the same sponsor twice when one is already verified', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    SponsorClaim::factory()->verified()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'claim_existing',
            'sponsor_id' => $sponsor->id,
        ])
        ->assertSessionHasErrors('sponsor_id');
});

test('claim_existing requires sponsor_id', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'claim_existing',
        ])
        ->assertSessionHasErrors('sponsor_id');
});

// ── New sponsor request ───────────────────────────────────────────────────────

test('editor can submit a new sponsor request', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'new_sponsor_request',
            'proposed_sponsor_name' => 'Pedal Adelaide',
            'proposed_sponsor_website' => 'https://pedaladelaide.com.au',
            'editor_note' => 'We are a new sponsor for 2025.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('sponsor_user', [
        'user_id' => $editor->id,
        'sponsor_id' => null,
        'status' => 'pending',
        'request_type' => 'new_sponsor_request',
        'proposed_sponsor_name' => 'Pedal Adelaide',
    ]);
});

test('new_sponsor_request requires proposed_sponsor_name', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->post(route('profile.sponsors.store'), [
            'request_type' => 'new_sponsor_request',
        ])
        ->assertSessionHasErrors('proposed_sponsor_name');
});

// ── Withdraw claim ────────────────────────────────────────────────────────────

test('editor can withdraw their own pending claim', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $claim = SponsorClaim::factory()->create(['user_id' => $editor->id, 'status' => 'pending']);

    $this->actingAs($editor)
        ->delete(route('profile.sponsors.destroy', $claim->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('sponsor_user', ['id' => $claim->id]);
});

test('editor cannot withdraw another user\'s pending claim', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $otherEditor = User::factory()->create(['role' => 'editor']);
    $claim = SponsorClaim::factory()->create(['user_id' => $otherEditor->id, 'status' => 'pending']);

    $this->actingAs($editor)
        ->delete(route('profile.sponsors.destroy', $claim->id))
        ->assertForbidden();
});

test('editor cannot withdraw a verified claim', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $claim = SponsorClaim::factory()->verified()->create(['user_id' => $editor->id]);

    $this->actingAs($editor)
        ->delete(route('profile.sponsors.destroy', $claim->id))
        ->assertForbidden();
});
