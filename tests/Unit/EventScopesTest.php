<?php

use App\Models\Category;
use App\Models\Event;
use App\Models\Location;
use App\Models\Sponsor;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

// ── Date scopes ──────────────────────────────────────────────────────────────

test('scopeHappeningNow returns only in-progress events', function () {
    $inProgress = Event::factory()->happeningNow()->create();
    $notStarted = Event::factory()->create(['start_datetime' => now()->addHour(), 'end_datetime' => now()->addHours(3)]);
    $ended      = Event::factory()->past()->create();

    $results = Event::happeningNow()->pluck('id');

    expect($results)->toContain($inProgress->id)
        ->not->toContain($notStarted->id)
        ->not->toContain($ended->id);
});

test('scopeOnDate filters by start date', function () {
    $target  = Event::factory()->startingAt('2026-05-10 09:00:00')->create();
    $other   = Event::factory()->startingAt('2026-05-11 09:00:00')->create();

    $results = Event::onDate('2026-05-10')->pluck('id');

    expect($results)->toContain($target->id)
        ->not->toContain($other->id);
});

test('scopeUpcoming excludes past events and orders by start_datetime', function () {
    $future1 = Event::factory()->startingAt(now()->addDays(2)->toDateTimeString())->create();
    $future2 = Event::factory()->startingAt(now()->addDays(1)->toDateTimeString())->create();
    $past    = Event::factory()->past()->create();

    $results = Event::upcoming()->pluck('id');

    expect($results)->toContain($future1->id)
        ->toContain($future2->id)
        ->not->toContain($past->id);

    // Earlier future event comes first
    expect($results->first())->toBe($future2->id);
});

test('scopeBetweenDates filters to start_date only when end_date is omitted', function () {
    $match  = Event::factory()->startingAt('2026-06-15 10:00:00')->create();
    $before = Event::factory()->startingAt('2026-06-14 10:00:00')->create();

    $results = Event::betweenDates('2026-06-15')->pluck('id');

    expect($results)->toContain($match->id)
        ->not->toContain($before->id);
});

test('scopeBetweenDates filters inclusive date range', function () {
    $start  = Event::factory()->startingAt('2026-06-01 09:00:00')->create();
    $middle = Event::factory()->startingAt('2026-06-05 09:00:00')->create();
    $end    = Event::factory()->startingAt('2026-06-10 09:00:00')->create();
    $after  = Event::factory()->startingAt('2026-06-11 09:00:00')->create();
    $before = Event::factory()->startingAt('2026-05-31 09:00:00')->create();

    $results = Event::betweenDates('2026-06-01', '2026-06-10')->pluck('id');

    expect($results)
        ->toContain($start->id)
        ->toContain($middle->id)
        ->toContain($end->id)
        ->not->toContain($after->id)
        ->not->toContain($before->id);
});

// ── Boolean flag scopes ───────────────────────────────────────────────────────

test('scopeFeatured returns only featured events', function () {
    $featured    = Event::factory()->featured()->create();
    $notFeatured = Event::factory()->create();

    $results = Event::featured()->pluck('id');

    expect($results)->toContain($featured->id)
        ->not->toContain($notFeatured->id);
});

test('scopeRecurring returns only recurring events', function () {
    $recurring    = Event::factory()->recurring()->create();
    $notRecurring = Event::factory()->create();

    $results = Event::recurring()->pluck('id');

    expect($results)->toContain($recurring->id)
        ->not->toContain($notRecurring->id);
});

test('scopeWomens returns only women\'s events', function () {
    $womens    = Event::factory()->womens()->create();
    $notWomens = Event::factory()->create();

    $results = Event::womens()->pluck('id');

    expect($results)->toContain($womens->id)
        ->not->toContain($notWomens->id);
});

// ── Ride / distance scopes ────────────────────────────────────────────────────

test('scopeRides returns only events with a distance set', function () {
    $ride    = Event::factory()->ride(50.0)->create();
    $nonRide = Event::factory()->create(['ride_distance_km' => null]);

    $results = Event::rides()->pluck('id');

    expect($results)->toContain($ride->id)
        ->not->toContain($nonRide->id);
});

test('scopeMinDistance filters by minimum km', function () {
    $short = Event::factory()->ride(20.0)->create();
    $long  = Event::factory()->ride(100.0)->create();

    $results = Event::minDistance(50.0)->pluck('id');

    expect($results)->toContain($long->id)
        ->not->toContain($short->id);
});

test('scopeMaxDistance filters by maximum km', function () {
    $short = Event::factory()->ride(20.0)->create();
    $long  = Event::factory()->ride(100.0)->create();

    $results = Event::maxDistance(50.0)->pluck('id');

    expect($results)->toContain($short->id)
        ->not->toContain($long->id);
});

test('scopeMinElevation filters by minimum elevation', function () {
    $low  = Event::factory()->ride(50.0, 100)->create();
    $high = Event::factory()->ride(50.0, 1000)->create();

    $results = Event::minElevation(500)->pluck('id');

    expect($results)->toContain($high->id)
        ->not->toContain($low->id);
});

test('scopeMaxElevation filters by maximum elevation', function () {
    $low  = Event::factory()->ride(50.0, 100)->create();
    $high = Event::factory()->ride(50.0, 1000)->create();

    $results = Event::maxElevation(500)->pluck('id');

    expect($results)->toContain($low->id)
        ->not->toContain($high->id);
});

// ── Cost scopes ───────────────────────────────────────────────────────────────

test('scopeFree returns only free events', function () {
    $free = Event::factory()->free()->create();
    $paid = Event::factory()->paid(20.0)->create();

    $results = Event::free()->pluck('id');

    expect($results)->toContain($free->id)
        ->not->toContain($paid->id);
});

test('scopePaid returns only paid events', function () {
    $free = Event::factory()->free()->create();
    $paid = Event::factory()->paid(20.0)->create();

    $results = Event::paid()->pluck('id');

    expect($results)->toContain($paid->id)
        ->not->toContain($free->id);
});

test('scopeMinCost excludes events below threshold', function () {
    $cheap     = Event::factory()->paid(10.0, 20.0)->create();
    $expensive = Event::factory()->paid(50.0, 100.0)->create();
    $free      = Event::factory()->free()->create();

    $results = Event::minCost(30.0)->pluck('id');

    expect($results)->toContain($expensive->id)
        ->not->toContain($cheap->id)
        ->not->toContain($free->id);
});

test('scopeMinCost includes events where max_cost meets the threshold even if min_cost does not', function () {
    // min=20, max=80 — the event can cost up to $80, so it qualifies for a $60 minimum
    $event = Event::factory()->paid(20.0, 80.0)->create();

    $results = Event::minCost(60.0)->pluck('id');

    expect($results)->toContain($event->id);
});

test('scopeMaxCost includes free events regardless of threshold', function () {
    $free = Event::factory()->free()->create();

    $results = Event::maxCost(0.0)->pluck('id');

    expect($results)->toContain($free->id);
});

test('scopeMaxCost excludes paid events above threshold', function () {
    $affordable = Event::factory()->paid(10.0, 30.0)->create();
    $expensive  = Event::factory()->paid(80.0, 120.0)->create();

    $results = Event::maxCost(50.0)->pluck('id');

    expect($results)->toContain($affordable->id)
        ->not->toContain($expensive->id);
});

test('scopeMaxCost includes paid events where min_cost is within threshold', function () {
    // min=30, max=200 — min_cost is affordable even though max_cost is not
    $event = Event::factory()->paid(30.0, 200.0)->create();

    $results = Event::maxCost(50.0)->pluck('id');

    expect($results)->toContain($event->id);
});

// ── Location scope ────────────────────────────────────────────────────────────

test('scopeAtLocation filters by location', function () {
    $locationA = Location::factory()->create();
    $locationB = Location::factory()->create();

    $eventA = Event::factory()->create(['location_id' => $locationA->id]);
    $eventB = Event::factory()->create(['location_id' => $locationB->id]);

    $results = Event::atLocation($locationA->id)->pluck('id');

    expect($results)->toContain($eventA->id)
        ->not->toContain($eventB->id);
});

// ── Tag scope ─────────────────────────────────────────────────────────────────

test('scopeWithTags returns events that have the specified tag', function () {
    $tag     = Tag::factory()->create(['slug' => 'cycling']);
    $match   = Event::factory()->create();
    $noMatch = Event::factory()->create();

    $match->tags()->attach($tag);

    $results = Event::withTags(['cycling'])->pluck('id');

    expect($results)->toContain($match->id)
        ->not->toContain($noMatch->id);
});

test('scopeWithTags requires ALL specified tags (AND behaviour)', function () {
    $tagA = Tag::factory()->create(['slug' => 'tag-a']);
    $tagB = Tag::factory()->create(['slug' => 'tag-b']);

    $both = Event::factory()->create();
    $both->tags()->attach([$tagA->id, $tagB->id]);

    $onlyA = Event::factory()->create();
    $onlyA->tags()->attach($tagA);

    $results = Event::withTags(['tag-a', 'tag-b'])->pluck('id');

    expect($results)->toContain($both->id)
        ->not->toContain($onlyA->id);
});

// ── Popularity scope ──────────────────────────────────────────────────────────

test('scopeMinFavourites filters by minimum favourites count', function () {
    $popular   = Event::factory()->create();
    $unpopular = Event::factory()->create();

    $users = User::factory()->count(3)->create();
    foreach ($users as $user) {
        $popular->favouritedBy()->attach($user);
    }

    $results = Event::minFavourites(2)->pluck('id');

    expect($results)->toContain($popular->id)
        ->not->toContain($unpopular->id);
});

test('scopeOrderByPopularity returns most-favourited events first', function () {
    $popular   = Event::factory()->create();
    $unpopular = Event::factory()->create();

    $users = User::factory()->count(5)->create();
    foreach ($users as $user) {
        $popular->favouritedBy()->attach($user);
    }

    $ids = Event::orderByPopularity('desc')->pluck('id');

    expect($ids->first())->toBe($popular->id);
});

// ── isRide / isHappeningNow helpers ──────────────────────────────────────────

test('isRide returns true only when ride_distance_km is set', function () {
    $ride    = Event::factory()->ride()->create();
    $nonRide = Event::factory()->create();

    expect($ride->isRide())->toBeTrue();
    expect($nonRide->isRide())->toBeFalse();
});

test('isHappeningNow returns true for in-progress event', function () {
    $inProgress = Event::factory()->happeningNow()->create();
    $future     = Event::factory()->create();

    expect($inProgress->isHappeningNow())->toBeTrue();
    expect($future->isHappeningNow())->toBeFalse();
});
