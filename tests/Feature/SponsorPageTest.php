<?php

use App\Models\Sponsor;
use App\Models\SponsorClaim;
use App\Models\User;

// ── Access ────────────────────────────────────────────────────────────────────

test('guest is redirected from sponsors page', function () {
    $this->get(route('sponsors.index'))->assertRedirect(route('login'));
});

test('viewer cannot access sponsors page', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->get(route('sponsors.index'))
        ->assertForbidden();
});

test('editor can access sponsors page', function () {
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->get(route('sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('sponsors/index'));
});

test('admin can access sponsors page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('sponsors/index'));
});

// ── Filtered results ──────────────────────────────────────────────────────────

test('editor only sees their verified sponsors', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $verifiedSponsor = Sponsor::factory()->create();
    Sponsor::factory()->create(); // another sponsor not claimed

    SponsorClaim::factory()->verified()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $verifiedSponsor->id,
    ]);

    $this->actingAs($editor)
        ->get(route('sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('sponsors/index')
            ->has('sponsors', 1)
            ->where('sponsors.0.id', $verifiedSponsor->id)
            ->where('isAdmin', false)
        );
});

test('editor with no verified sponsors sees empty list', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    Sponsor::factory()->create();

    $this->actingAs($editor)
        ->get(route('sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('sponsors', 0));
});

test('editor with only a pending claim does not see that sponsor', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    SponsorClaim::factory()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
        'status' => 'pending',
    ]);

    $this->actingAs($editor)
        ->get(route('sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('sponsors', 0));
});

test('admin sees all sponsors', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sponsor::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('sponsors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('sponsors', 3)
            ->where('isAdmin', true)
        );
});

// ── Image upload authorisation ────────────────────────────────────────────────

test('editor cannot upload image for a sponsor they are not verified with', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    $this->actingAs($editor)
        ->post(route('sponsors.image.upload', [$sponsor->slug, 'logo_square']), [
            'image' => \Illuminate\Http\UploadedFile::fake()->image('logo.png'),
        ])
        ->assertForbidden();
});

test('editor can upload image for their verified sponsor', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    SponsorClaim::factory()->verified()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('sponsors.image.upload', [$sponsor->slug, 'logo_square']), [
            'image' => \Illuminate\Http\UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertRedirect();
});

test('editor cannot delete image for a sponsor they are not verified with', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $sponsor = Sponsor::factory()->create();

    $this->actingAs($editor)
        ->delete(route('sponsors.image.delete', [$sponsor->slug, 'logo_square']))
        ->assertForbidden();
});

test('admin can upload image for any sponsor', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $sponsor = Sponsor::factory()->create();

    $this->actingAs($admin)
        ->post(route('sponsors.image.upload', [$sponsor->slug, 'logo_square']), [
            'image' => \Illuminate\Http\UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertRedirect();
});
