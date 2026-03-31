<?php

use App\Models\Event;
use Carbon\CarbonImmutable;

// ── tduYearFor() ──────────────────────────────────────────────────────────────

test('tduYearFor returns same year for months Jan through Sep', function () {
    foreach ([1, 2, 3, 4, 5, 6, 7, 8, 9] as $month) {
        expect(Event::tduYearFor(CarbonImmutable::create(2025, $month, 15)))->toBe(2025);
    }
});

test('tduYearFor returns next year for months Oct through Dec', function () {
    foreach ([10, 11, 12] as $month) {
        expect(Event::tduYearFor(CarbonImmutable::create(2024, $month, 15)))->toBe(2025);
    }
});

// ── scopeForTduYear() ─────────────────────────────────────────────────────────

test('scopeForTduYear includes events between Oct Y-1 and Sep Y', function () {
    $inside = Event::factory()->startingAt('2025-01-20 09:00:00')->create();
    $outside = Event::factory()->startingAt('2025-11-01 09:00:00')->create();

    $results = Event::forTduYear(2025)->pluck('id');

    expect($results)->toContain($inside->id)
        ->not->toContain($outside->id);
});

test('scopeForTduYear includes event on Oct 1 boundary of preceding year', function () {
    $boundary = Event::factory()->startingAt('2024-10-01 00:00:00')->create();

    expect(Event::forTduYear(2025)->pluck('id'))->toContain($boundary->id);
});

test('scopeForTduYear includes event on Sep 30 boundary', function () {
    $boundary = Event::factory()->startingAt('2025-09-30 23:59:00')->create();

    expect(Event::forTduYear(2025)->pluck('id'))->toContain($boundary->id);
});

test('scopeForTduYear excludes event after Sep 30', function () {
    $outside = Event::factory()->startingAt('2025-10-01 00:00:00')->create();

    expect(Event::forTduYear(2025)->pluck('id'))->not->toContain($outside->id);
});

// ── availableTduYears() ───────────────────────────────────────────────────────

test('availableTduYears returns current year when no events exist', function () {
    $currentYear = Event::currentTduYear();

    expect(Event::availableTduYears())->toBe([$currentYear]);
});

test('availableTduYears returns sorted descending list of years', function () {
    Event::factory()->startingAt('2024-01-15 09:00:00')->create(); // TDU 2024
    Event::factory()->startingAt('2025-01-15 09:00:00')->create(); // TDU 2025

    $years = Event::availableTduYears();

    expect($years)->toBeArray()
        ->and($years[0])->toBeGreaterThan($years[1]); // descending
});

// ── Events index year param ───────────────────────────────────────────────────

test('events index defaults to current tdu year', function () {
    $currentYear = Event::currentTduYear();
    $inCurrentYear = Event::factory()->startingAt('2025-01-15 09:00:00')->create();

    $response = $this->get(route('events.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/index')
            ->where('tduYear', $currentYear)
        );
});

test('events index filters to requested year', function () {
    // TDU 2024 event (Oct 2023 – Sep 2024)
    $year2024Event = Event::factory()->startingAt('2024-01-15 09:00:00')->create();
    // TDU 2025 event (Oct 2024 – Sep 2025)
    $year2025Event = Event::factory()->startingAt('2025-01-15 09:00:00')->create();

    $response = $this->get(route('events.index', ['year' => 2024]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/index')
            ->where('tduYear', 2024)
            ->has('events.data', 1)
            ->where('events.data.0.id', $year2024Event->id)
        );
});

test('events index passes available years as prop', function () {
    Event::factory()->startingAt('2024-01-15 09:00:00')->create();
    Event::factory()->startingAt('2025-01-15 09:00:00')->create();

    $response = $this->get(route('events.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('availableYears')
        );
});

// ── Schedule index year param ─────────────────────────────────────────────────

test('schedule index filters to requested year', function () {
    $year2024Event = Event::factory()->startingAt('2024-01-15 09:00:00')->create();
    $year2025Event = Event::factory()->startingAt('2025-01-15 09:00:00')->create();

    $response = $this->get(route('schedule.index', ['year' => 2024, 'date' => '2024-01-15']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tduYear', 2024)
        );
});
