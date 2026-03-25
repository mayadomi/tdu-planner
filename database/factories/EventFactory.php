<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Location;
use App\Models\Sponsor;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('+1 day', '+30 days');
        $end   = (clone $start)->modify('+2 hours');

        return [
            'title'            => $this->faker->sentence(4),
            'description'      => $this->faker->paragraph(),
            'start_datetime'   => $start,
            'end_datetime'     => $end,
            'category_id'      => Category::factory(),
            'sponsor_id'       => Sponsor::factory(),
            'location_id'      => Location::factory(),
            'ride_distance_km' => null,
            'elevation_gain_m' => null,
            'is_featured'      => false,
            'is_recurring'     => false,
            'is_womens'        => false,
            'is_free'          => true,
            'min_cost'         => null,
            'max_cost'         => null,
            'url'              => null,
            'pace'             => null,
            'route_url'        => null,
        ];
    }

    public function featured(): static
    {
        return $this->state(['is_featured' => true]);
    }

    public function recurring(): static
    {
        return $this->state(['is_recurring' => true]);
    }

    public function womens(): static
    {
        return $this->state(['is_womens' => true]);
    }

    public function ride(float $distanceKm = 50.0, int $elevationM = 500): static
    {
        return $this->state([
            'ride_distance_km' => $distanceKm,
            'elevation_gain_m' => $elevationM,
        ]);
    }

    public function free(): static
    {
        return $this->state(['is_free' => true, 'min_cost' => null, 'max_cost' => null]);
    }

    public function paid(float $minCost, float $maxCost = null): static
    {
        return $this->state([
            'is_free'  => false,
            'min_cost' => $minCost,
            'max_cost' => $maxCost,
        ]);
    }

    public function startingAt(string $datetime): static
    {
        return $this->state(fn () => [
            'start_datetime' => $datetime,
            'end_datetime'   => date('Y-m-d H:i:s', strtotime($datetime) + 7200),
        ]);
    }

    public function happeningNow(): static
    {
        return $this->state([
            'start_datetime' => now()->subHour(),
            'end_datetime'   => now()->addHour(),
        ]);
    }

    public function past(): static
    {
        return $this->state([
            'start_datetime' => now()->subDays(7),
            'end_datetime'   => now()->subDays(7)->addHours(2),
        ]);
    }
}
