<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Seed the locations table from config.
     */
    public function run(): void
    {
        $locations = config('tdu.locations', []);

        foreach ($locations as $slug => $data) {
            Location::firstOrCreate(
                ['name' => $data['name']],
                [
                    'address' => $data['address'] ?? null,
                    'latitude' => $data['latitude'] ?? 0,
                    'longitude' => $data['longitude'] ?? 0,
                ]
            );
        }
    }
}
