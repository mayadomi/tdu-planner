<?php

namespace Database\Seeders;

use App\Models\Sponsor;
use Illuminate\Database\Seeder;

class SponsorSeeder extends Seeder
{
    /**
     * Seed the sponsors table from config.
     */
    public function run(): void
    {
        $sponsors = config('tdu.sponsors', []);

        foreach ($sponsors as $slug => $name) {
            Sponsor::firstOrCreate(
                ['slug' => $slug],
                ['name' => $name]
            );
        }
    }
}
