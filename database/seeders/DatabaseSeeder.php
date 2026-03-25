<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Seed TDU base data (categories, sponsors, locations from config)
        $this->call([
            CategorySeeder::class,
            SponsorSeeder::class,
            LocationSeeder::class,
            TagSeeder::class,
        ]);

        // Only seed sample events if explicitly requested
        // To seed sample events: php artisan db:seed --class=EventSeeder
        // For production, use: php artisan events:import --source=json --file=allthetdu-scraped.json
    }
}
