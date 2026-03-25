<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class LocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'      => $this->faker->unique()->city(),
            'latitude'  => $this->faker->latitude(-35, -34),
            'longitude' => $this->faker->longitude(138, 139),
            'address'   => $this->faker->streetAddress(),
        ];
    }
}
