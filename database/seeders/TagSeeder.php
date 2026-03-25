<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            'Family Friendly',
            'Gravel',
            'Spectate',
            'Race or Spectate',
            'Indoor',
            'Outdoor',
            'Interview',
            'Happy Hour/Drinks',
            'MTB',
            'Supported',
            'Unsupported',
            'Semi-Supported',
            'Recovery',
        ];

        foreach ($tags as $name) {
            Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            );
        }
    }
}
