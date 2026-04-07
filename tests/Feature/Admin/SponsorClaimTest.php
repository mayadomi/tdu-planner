<?php

use App\Models\Sponsor;
use App\Models\SponsorClaim;
use App\Models\User;

// ── Access ────────────────────────────────────────────────────────────────────

test('guest is redirected from admin sponsor claims', function () {
    $this->get(route('admin.sponsor-claims.index'))->assertRedirect(route('login'));
});

test('viewer cannot access admin sponsor claims', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->get(route('admin.sponsor-claims.index'))
        ->assertForbidden();
});

test('editor cannot access admin sponsor claims', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->get(route('admin.sponsor-claims.index'))
        ->assertForbidden();
});

test('admin can view sponsor claims page', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    SponsorClaim::factory()->count(2)->create();

    $this->actingAs($admin)
        ->get(route('admin.sponsor-claims.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/sponsor-claims/index')
            ->has('claims', 2)
            ->where('pendingCount', 2)
        );
});

// ── Approve claim_existing ────────────────────────────────────────────────────

test('admin can approve a claim_existing claim', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    $claim = SponsorClaim::factory()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
        'request_type' => 'claim_existing',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.sponsor-claims.approve', $claim->id))
        ->assertRedirect();

    $claim->refresh();

    expect($claim->status)->toBe('verified')
        ->and($claim->verified_by_user_id)->toBe($admin->id)
        ->and($claim->verified_at)->not->toBeNull();
});

// ── Approve new_sponsor_request ───────────────────────────────────────────────

test('admin approving a new_sponsor_request creates the sponsor', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $editor = User::factory()->create(['role' => 'editor']);

    $claim = SponsorClaim::factory()->newSponsorRequest()->create([
        'user_id' => $editor->id,
        'proposed_sponsor_name' => 'Pedal Adelaide',
        'proposed_sponsor_website' => 'https://pedaladelaide.com.au',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.sponsor-claims.approve', $claim->id), [
            'sponsor_name' => 'Pedal Adelaide',
            'sponsor_website' => 'https://pedaladelaide.com.au',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('sponsors', ['name' => 'Pedal Adelaide', 'slug' => 'pedal-adelaide']);

    $claim->refresh();
    expect($claim->status)->toBe('verified')
        ->and($claim->sponsor_id)->not->toBeNull();
});

test('admin cannot approve a new_sponsor_request without sponsor_name', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $claim = SponsorClaim::factory()->newSponsorRequest()->create();

    $this->actingAs($admin)
        ->post(route('admin.sponsor-claims.approve', $claim->id), [])
        ->assertSessionHasErrors('sponsor_name');
});

// ── Reject ────────────────────────────────────────────────────────────────────

test('admin can reject a claim with a note', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $claim = SponsorClaim::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.sponsor-claims.reject', $claim->id), [
            'admin_note' => 'Could not verify your association.',
        ])
        ->assertRedirect();

    $claim->refresh();

    expect($claim->status)->toBe('rejected')
        ->and($claim->admin_note)->toBe('Could not verify your association.')
        ->and($claim->verified_by_user_id)->toBe($admin->id);
});

test('admin can reject a claim without a note', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $claim = SponsorClaim::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.sponsor-claims.reject', $claim->id))
        ->assertRedirect();

    expect($claim->fresh()->status)->toBe('rejected');
});

// ── Event sponsor enforcement ─────────────────────────────────────────────────

test('editor with verified sponsor can create event for that sponsor', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();
    $category = \App\Models\Category::factory()->create();
    $location = \App\Models\Location::factory()->create();

    SponsorClaim::factory()->verified()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('events.store'), [
            'title' => 'Test Event',
            'start_datetime' => now()->addDay()->toDateTimeString(),
            'end_datetime' => now()->addDay()->addHours(2)->toDateTimeString(),
            'category_id' => $category->id,
            'location_id' => $location->id,
            'sponsor_id' => $sponsor->id,
            'is_featured' => false,
            'is_recurring' => false,
            'is_womens' => false,
            'is_free' => true,
        ])
        ->assertRedirect();
});

test('editor without verified sponsor cannot create event with a sponsor', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();
    $category = \App\Models\Category::factory()->create();
    $location = \App\Models\Location::factory()->create();

    $this->actingAs($editor)
        ->post(route('events.store'), [
            'title' => 'Test Event',
            'start_datetime' => now()->addDay()->toDateTimeString(),
            'end_datetime' => now()->addDay()->addHours(2)->toDateTimeString(),
            'category_id' => $category->id,
            'location_id' => $location->id,
            'sponsor_id' => $sponsor->id,
            'is_featured' => false,
            'is_recurring' => false,
            'is_womens' => false,
            'is_free' => true,
        ])
        ->assertSessionHasErrors('sponsor_id');
});

test('admin can create event with any sponsor', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $sponsor = Sponsor::factory()->create();
    $category = \App\Models\Category::factory()->create();
    $location = \App\Models\Location::factory()->create();

    $this->actingAs($admin)
        ->post(route('events.store'), [
            'title' => 'Test Event',
            'start_datetime' => now()->addDay()->toDateTimeString(),
            'end_datetime' => now()->addDay()->addHours(2)->toDateTimeString(),
            'category_id' => $category->id,
            'location_id' => $location->id,
            'sponsor_id' => $sponsor->id,
            'is_featured' => false,
            'is_recurring' => false,
            'is_womens' => false,
            'is_free' => true,
        ])
        ->assertRedirect();
});
