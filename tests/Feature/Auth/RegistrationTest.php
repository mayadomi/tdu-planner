<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $this->get(route('register'))->assertOk();
});

test('registration screen passes intent prop for creator path', function () {
    $this->get(route('register').'?intent=creator')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('intent', 'creator'));
});

test('new users are redirected to welcome after registration', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/welcome');
});

test('new viewer users are registered with viewer role', function () {
    $this->post(route('register.store'), [
        'name' => 'Viewer User',
        'email' => 'viewer@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    expect(User::where('email', 'viewer@example.com')->first()->role)->toBe('viewer');
});

test('creator sign-up automatically sets role to editor_pending', function () {
    $this->post(route('register.store'), [
        'name' => 'Creator User',
        'email' => 'creator@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'intent' => 'creator',
    ]);

    expect(User::where('email', 'creator@example.com')->first()->role)->toBe('editor_pending');
});
