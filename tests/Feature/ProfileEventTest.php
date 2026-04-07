<?php

use App\Models\Category;
use App\Models\Event;
use App\Models\Location;
use App\Models\User;

test('guest is redirected from my events page', function () {
    $this->get(route('profile.events.index'))->assertRedirect(route('login'));
});

test('viewer cannot access my events page', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->get(route('profile.events.index'))
        ->assertForbidden();
});

test('editor can view their own events', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $category = Category::factory()->create();
    $location = Location::factory()->create();

    Event::factory()->count(2)->create([
        'created_by_user_id' => $editor->id,
        'category_id' => $category->id,
        'location_id' => $location->id,
    ]);

    // Another editor's event — should not appear
    $other = User::factory()->create(['role' => 'editor']);
    Event::factory()->create([
        'created_by_user_id' => $other->id,
        'category_id' => $category->id,
        'location_id' => $location->id,
    ]);

    $this->actingAs($editor)
        ->get(route('profile.events.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profile/events/index')
            ->has('events', 2)
        );
});

test('admin can access my events page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('profile.events.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('profile/events/index'));
});
