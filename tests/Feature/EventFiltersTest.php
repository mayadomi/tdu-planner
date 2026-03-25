<?php

use App\Models\Category;
use App\Models\Event;
use App\Models\Location;
use App\Models\Sponsor;
use App\Models\Tag;
use App\Models\User;

// ── Basic access ──────────────────────────────────────────────────────────────

test('events index is publicly accessible', function () {
    $this->get(route('events.index'))->assertOk();
});

test('events index returns paginated events', function () {
    Event::factory()->count(3)->create();

    $response = $this->get(route('events.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/index')
            ->has('events.data', 3)
        );
});

// ── Category filter ───────────────────────────────────────────────────────────

test('category filter returns only events in that category', function () {
    $categoryA = Category::factory()->create(['slug' => 'race-stages']);
    $categoryB = Category::factory()->create(['slug' => 'expo']);

    $inA  = Event::factory()->create(['category_id' => $categoryA->id]);
    $inB  = Event::factory()->create(['category_id' => $categoryB->id]);

    $response = $this->get(route('events.index', ['category' => 'race-stages']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $inA->id)
        );
});

// ── Sponsor filter ────────────────────────────────────────────────────────────

test('sponsor filter returns only events for that sponsor', function () {
    $sponsorA = Sponsor::factory()->create(['slug' => 'santos']);
    $sponsorB = Sponsor::factory()->create(['slug' => 'other']);

    $match   = Event::factory()->create(['sponsor_id' => $sponsorA->id]);
    $noMatch = Event::factory()->create(['sponsor_id' => $sponsorB->id]);

    $response = $this->get(route('events.index', ['sponsor' => 'santos']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $match->id)
        );
});

// ── Location filter ───────────────────────────────────────────────────────────

test('location filter returns only events at that location', function () {
    $locationA = Location::factory()->create();
    $locationB = Location::factory()->create();

    $match   = Event::factory()->create(['location_id' => $locationA->id]);
    $noMatch = Event::factory()->create(['location_id' => $locationB->id]);

    $response = $this->get(route('events.index', ['location' => $locationA->id]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $match->id)
        );
});

// ── Date filters ──────────────────────────────────────────────────────────────

test('date filter returns only events on that date', function () {
    $match   = Event::factory()->startingAt('2026-05-10 09:00:00')->create();
    $noMatch = Event::factory()->startingAt('2026-05-11 09:00:00')->create();

    $response = $this->get(route('events.index', ['date' => '2026-05-10']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $match->id)
        );
});

test('date range filter returns events within the range', function () {
    $inRange  = Event::factory()->startingAt('2026-06-05 09:00:00')->create();
    $before   = Event::factory()->startingAt('2026-05-31 09:00:00')->create();
    $after    = Event::factory()->startingAt('2026-06-11 09:00:00')->create();

    $response = $this->get(route('events.index', [
        'start_date' => '2026-06-01',
        'end_date'   => '2026-06-10',
    ]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $inRange->id)
        );
});

test('date filter takes precedence over date range when both are present', function () {
    $onDate    = Event::factory()->startingAt('2026-05-10 09:00:00')->create();
    $inRange   = Event::factory()->startingAt('2026-05-15 09:00:00')->create();

    $response = $this->get(route('events.index', [
        'date'       => '2026-05-10',
        'start_date' => '2026-05-01',
        'end_date'   => '2026-05-31',
    ]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $onDate->id)
        );
});

// ── Boolean flag filters ──────────────────────────────────────────────────────
// The frontend converts JS `true` → integer `1` before building the query string.
// Tests use '1' to match that serialisation. Using 'true' would fail Laravel's
// boolean validation — see the regression test below.

test('featured filter returns only featured events', function () {
    $featured    = Event::factory()->featured()->create();
    $notFeatured = Event::factory()->create();

    $this->get(route('events.index', ['featured' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $featured->id)
        );
});

test('rides_only filter returns only ride events', function () {
    $ride    = Event::factory()->ride(50.0)->create();
    $nonRide = Event::factory()->create();

    $this->get(route('events.index', ['rides_only' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $ride->id)
        );
});

test('free filter returns only free events', function () {
    $free = Event::factory()->free()->create();
    $paid = Event::factory()->paid(20.0)->create();

    $this->get(route('events.index', ['free' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $free->id)
        );
});

test('recurring filter returns only recurring events', function () {
    $recurring    = Event::factory()->recurring()->create();
    $notRecurring = Event::factory()->create();

    $this->get(route('events.index', ['recurring' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $recurring->id)
        );
});

test('womens filter returns only women\'s events', function () {
    $womens    = Event::factory()->womens()->create();
    $notWomens = Event::factory()->create();

    $this->get(route('events.index', ['womens' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $womens->id)
        );
});

test('boolean filter rejects the string "true" — only "1" and "0" are valid', function () {
    // JS URLSearchParams serialises `true` as the string "true", which Laravel's
    // boolean validation does not accept. The frontend must convert true → 1.
    $this->get(route('events.index', ['free' => 'true']))
        ->assertSessionHasErrors('free');
});

// ── Distance filters ──────────────────────────────────────────────────────────

test('min_distance filter excludes rides below threshold', function () {
    $short = Event::factory()->ride(20.0)->create();
    $long  = Event::factory()->ride(100.0)->create();

    $response = $this->get(route('events.index', ['min_distance' => 50]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $long->id)
        );
});

test('max_distance filter excludes rides above threshold', function () {
    $short = Event::factory()->ride(20.0)->create();
    $long  = Event::factory()->ride(100.0)->create();

    $response = $this->get(route('events.index', ['max_distance' => 50]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $short->id)
        );
});

// ── Elevation filters ─────────────────────────────────────────────────────────

test('min_elevation filter excludes events below elevation threshold', function () {
    $flat = Event::factory()->ride(50.0, 100)->create();
    $hilly = Event::factory()->ride(50.0, 1500)->create();

    $response = $this->get(route('events.index', ['min_elevation' => 500]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $hilly->id)
        );
});

test('max_elevation filter excludes events above elevation threshold', function () {
    $flat  = Event::factory()->ride(50.0, 100)->create();
    $hilly = Event::factory()->ride(50.0, 1500)->create();

    $response = $this->get(route('events.index', ['max_elevation' => 500]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $flat->id)
        );
});

// ── Cost filters ──────────────────────────────────────────────────────────────

test('min_cost filter excludes cheap events', function () {
    $cheap     = Event::factory()->paid(10.0, 20.0)->create();
    $expensive = Event::factory()->paid(100.0, 150.0)->create();

    $response = $this->get(route('events.index', ['min_cost' => 50]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $expensive->id)
        );
});

test('max_cost filter excludes events above budget and includes free events', function () {
    $affordable = Event::factory()->paid(10.0, 30.0)->create();
    $expensive  = Event::factory()->paid(100.0, 200.0)->create();
    $free       = Event::factory()->free()->create();

    $this->get(route('events.index', ['max_cost' => 50]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 2)
            ->where('events.data', fn ($data) =>
                collect($data)->pluck('id')->contains($affordable->id) &&
                collect($data)->pluck('id')->contains($free->id) &&
                ! collect($data)->pluck('id')->contains($expensive->id)
            )
        );
});

// ── Tags filter ───────────────────────────────────────────────────────────────

test('tags filter returns events with the specified tag', function () {
    $tag     = Tag::factory()->create(['slug' => 'family-friendly']);
    $match   = Event::factory()->create();
    $noMatch = Event::factory()->create();

    $match->tags()->attach($tag);

    $response = $this->get(route('events.index', ['tags' => ['family-friendly']]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $match->id)
        );
});

test('tags filter with multiple tags uses AND logic', function () {
    $tagA = Tag::factory()->create(['slug' => 'tag-a']);
    $tagB = Tag::factory()->create(['slug' => 'tag-b']);

    $both  = Event::factory()->create();
    $both->tags()->attach([$tagA->id, $tagB->id]);

    $onlyA = Event::factory()->create();
    $onlyA->tags()->attach($tagA);

    $response = $this->get(route('events.index', ['tags' => ['tag-a', 'tag-b']]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
            ->where('events.data.0.id', $both->id)
        );
});

// ── Sorting ───────────────────────────────────────────────────────────────────

test('sort by date ascending orders earliest event first', function () {
    $later  = Event::factory()->startingAt(now()->addDays(5)->toDateTimeString())->create();
    $sooner = Event::factory()->startingAt(now()->addDays(2)->toDateTimeString())->create();

    $response = $this->get(route('events.index', ['sort' => 'date', 'order' => 'asc']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('events.data.0.id', $sooner->id)
        );
});

test('sort by date descending orders latest event first', function () {
    $later  = Event::factory()->startingAt(now()->addDays(5)->toDateTimeString())->create();
    $sooner = Event::factory()->startingAt(now()->addDays(2)->toDateTimeString())->create();

    $response = $this->get(route('events.index', ['sort' => 'date', 'order' => 'desc']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('events.data.0.id', $later->id)
        );
});

test('sort by distance places nulls last', function () {
    $nonRide = Event::factory()->create(['ride_distance_km' => null]);
    $short   = Event::factory()->ride(10.0)->create();
    $long    = Event::factory()->ride(100.0)->create();

    $this->get(route('events.index', ['sort' => 'distance', 'order' => 'asc']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('events.data.0.id', $short->id)
            ->where('events.data.2.id', $nonRide->id)
        );
});

test('sort by cost places free events first and sorts by min cost', function () {
    $expensive = Event::factory()->paid(100.0)->create();
    $cheap     = Event::factory()->paid(10.0)->create();
    $free      = Event::factory()->free()->create();

    $this->get(route('events.index', ['sort' => 'cost', 'order' => 'asc']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('events.data.0.id', $free->id)
        );
});

// ── Pagination ────────────────────────────────────────────────────────────────

test('per_page parameter controls result count', function () {
    Event::factory()->count(10)->create();

    $response = $this->get(route('events.index', ['per_page' => 3]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('events.per_page', 3)
            ->has('events.data', 3)
        );
});

test('per_page is capped at 100 even when a higher value is passed', function () {
    Event::factory()->count(5)->create();

    $this->get(route('events.index', ['per_page' => 999]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('events.per_page', 100)
        );
});

// ── Filter validation ─────────────────────────────────────────────────────────

test('invalid date format returns a validation error', function () {
    $response = $this->get(route('events.index', ['date' => 'not-a-date']));

    $response->assertSessionHasErrors('date');
});

test('end_date before start_date returns a validation error', function () {
    $response = $this->get(route('events.index', [
        'start_date' => '2026-06-10',
        'end_date'   => '2026-06-01',
    ]));

    $response->assertSessionHasErrors('end_date');
});

test('invalid sort value returns a validation error', function () {
    $response = $this->get(route('events.index', ['sort' => 'random']));

    $response->assertSessionHasErrors('sort');
});

test('negative min_distance returns a validation error', function () {
    $response = $this->get(route('events.index', ['min_distance' => -5]));

    $response->assertSessionHasErrors('min_distance');
});

test('max_cost less than min_cost returns a validation error', function () {
    $response = $this->get(route('events.index', ['min_cost' => 100, 'max_cost' => 50]));

    $response->assertSessionHasErrors('max_cost');
});

// ── Featured events ───────────────────────────────────────────────────────────

test('featured events are included when no filters are applied', function () {
    Event::factory()->featured()->startingAt(now()->addDay()->toDateTimeString())->create();

    $response = $this->get(route('events.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('featuredEvents')
        );
});

test('featured events are not included when filters are active', function () {
    Event::factory()->featured()->create();

    $response = $this->get(route('events.index', ['featured' => '1']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('featuredEvents', null)
        );
});

// ── Filters are passed back to the view ───────────────────────────────────────

test('active filters are returned in the response', function () {
    $response = $this->get(route('events.index', [
        'featured'  => '1',
        'sort'      => 'date',
        'order'     => 'desc',
    ]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.featured', '1')
            ->where('filters.sort', 'date')
            ->where('filters.order', 'desc')
        );
});
