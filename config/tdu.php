<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Event Categories
    |--------------------------------------------------------------------------
    |
    | Canonical list of event categories. Each category has a slug (used for
    | database storage and URLs) and a display name.
    |
    */

    'categories' => [
        'race-stages' => 'Race Stages',
        'official-events' => 'Official Events',
        'watch-parties' => 'Watch Parties',
        'group-rides' => 'Group Rides',
        'local-racing' => 'Local Racing',
        'pop-up' => 'Pop Up',
        'expo' => 'Expo',
        'pop-ups' => 'Pop Ups',
        'team-meets' => 'Team Meets',
        'food-wine' => 'Food & Wine',
        'entertainment' => 'Entertainment',
        'podcast' => 'Podcast',
        'other' => 'Other',
        // Legacy — kept so existing event data isn't orphaned
        'street-parties' => 'Street Parties',
        'demo-bikes' => 'Demo Bikes',
        'cycling-shops' => 'Cycling Shops',
    ],

    /*
    |--------------------------------------------------------------------------
    | Category Aliases (for import normalization)
    |--------------------------------------------------------------------------
    |
    | Maps alternative names/variations to canonical category slugs.
    | Used when importing data from external sources.
    |
    */

    'category_aliases' => [
        // Race Stage aliases
        'road race' => 'race-stage',
        'stage' => 'race-stage',
        'race' => 'race-stage',
        'men\'s stage' => 'race-stage',
        'women\'s stage' => 'race-stage',

        // Time Trial aliases
        'tt' => 'time-trial',
        'individual time trial' => 'time-trial',
        'itt' => 'time-trial',
        'team time trial' => 'time-trial',
        'ttt' => 'time-trial',

        // Criterium aliases
        'crit' => 'criterium',
        'criteriums' => 'criterium',

        // Community Ride aliases
        'community event' => 'community-ride',
        'public ride' => 'community-ride',
        'recreational ride' => 'community-ride',

        // Gran Fondo aliases
        'fondo' => 'gran-fondo',
        'challenge tour' => 'gran-fondo',
        'sportive' => 'gran-fondo',

        // Festival aliases
        'festival' => 'expo',
        'village' => 'expo',
        'fan zone' => 'expo',

        // Kids Race aliases
        'junior race' => 'family-ride',
        'children\'s race' => 'family-ride',
        'kids event' => 'family-ride',

        // Entertainment aliases
        'live music' => 'entertainment',
        'concert' => 'entertainment',
        'performance' => 'entertainment',

        // Food & Wine aliases
        'food' => 'food-wine',
        'wine' => 'food-wine',
        'dining' => 'food-wine',
        'tasting' => 'food-wine',
    ],

    /*
    |--------------------------------------------------------------------------
    | Sponsors
    |--------------------------------------------------------------------------
    |
    | Official sponsors associated with TDU events.
    |
    */

    'sponsors' => [
        'santos' => 'Santos',
        'ziptrak' => 'Ziptrak',
        'specialized' => 'Specialized',
        'trek-bikes' => 'Trek Bikes',
        'shimano' => 'Shimano',
        'giant-bicycles' => 'Giant Bicycles',
        'castelli' => 'Castelli',
        'santini' => 'Santini',
        'maap' => 'MAAP',
        'pedla' => 'Pedla',
        'black-sheep' => 'Black Sheep',
        'wahoo'=> 'Wahoo',
        'oakley' => 'Oakley',
        'health-partners' => 'Health Partners',
        'canyon' => 'Canyon',
        'knog' => 'Knog',
        'rapha' => 'Rapha',
        'focus' => 'Focus',
        'mood' => 'MOOD',
        'cycle-closet' => 'Cycle Closet',
        'kask' => 'Kask',
        'knights-of-suburbia' => 'Knights of Suburbia',
        'radl-grvl' => 'RADL GRVL',
        'quad-lock' => 'Quad Lock',
        'cannondale' => 'Cannondale',
        'pinarello' => 'Pinarello',
        'dash-adelaide' => 'DASH Adelaide',
        'fe-sports' => 'FE Sports',
        'echelon-sports' => 'Echelon Sports',
        'zwift' => 'Zwift',

    ],

    /*
    |--------------------------------------------------------------------------
    | Sponsor Aliases (for import normalization)
    |--------------------------------------------------------------------------
    */

    'sponsor_aliases' => [
        'santos tour down under' => 'santos-tdu',
        'trek' => 'trek-bikes',
        'giant' => 'giant-bicycles',

    ],

    /*
    |--------------------------------------------------------------------------
    | Locations
    |--------------------------------------------------------------------------
    |
    | Common TDU event locations with coordinates.
    |
    */

    'locations' => [
        'adelaide-city' => [
            'name' => 'Adelaide City',
            'address' => 'Victoria Square, Adelaide SA 5000',
            'latitude' => -34.9285,
            'longitude' => 138.6007,
        ],
        'mclaren-vale' => [
            'name' => 'McLaren Vale',
            'address' => 'Main Road, McLaren Vale SA 5171',
            'latitude' => -35.2192,
            'longitude' => 138.5456,
        ],
        'tanunda' => [
            'name' => 'Tanunda',
            'address' => 'Murray Street, Tanunda SA 5352',
            'latitude' => -34.5247,
            'longitude' => 138.9608,
        ],
        'willunga' => [
            'name' => 'Willunga',
            'address' => 'High Street, Willunga SA 5172',
            'latitude' => -35.2717,
            'longitude' => 138.5517,
        ],
        'victor-harbor' => [
            'name' => 'Victor Harbor',
            'address' => 'Ocean Street, Victor Harbor SA 5211',
            'latitude' => -35.5524,
            'longitude' => 138.6178,
        ],
        'glenelg' => [
            'name' => 'Glenelg',
            'address' => 'Jetty Road, Glenelg SA 5045',
            'latitude' => -34.9799,
            'longitude' => 138.5148,
        ],
        'stirling' => [
            'name' => 'Stirling',
            'address' => 'Mount Barker Road, Stirling SA 5152',
            'latitude' => -34.9967,
            'longitude' => 138.7200,
        ],
        'hahndorf' => [
            'name' => 'Hahndorf',
            'address' => 'Main Street, Hahndorf SA 5245',
            'latitude' => -35.0286,
            'longitude' => 138.8075,
        ],
        'uraidla' => [
            'name' => 'Uraidla',
            'address' => 'Greenhill Road, Uraidla SA 5142',
            'latitude' => -34.9692,
            'longitude' => 138.7336,
        ],
        'campbelltown' => [
            'name' => 'Campbelltown',
            'address' => 'Lower North East Road, Campbelltown SA 5074',
            'latitude' => -34.8737,
            'longitude' => 138.6677,
        ],
        'unley' => [
            'name' => 'Unley',
            'address' => 'Unley Road, Unley SA 5061',
            'latitude' => -34.9500,
            'longitude' => 138.6000,
        ],
        'clare' => [
            'name' => 'Clare',
            'address' => 'Main North Road, Clare SA 5453',
            'latitude' => -33.8333,
            'longitude' => 138.6000,
        ],
        'strathalbyn' => [
            'name' => 'Strathalbyn',
            'address' => 'High Street, Strathalbyn SA 5255',
            'latitude' => -35.2603,
            'longitude' => 138.8931,
        ],
        'norwood' => [
            'name' => 'Norwood',
            'address' => 'The Parade, Norwood SA 5067',
            'latitude' => -34.9214,
            'longitude' => 138.6317,
        ],
        'mount-barker' => [
            'name' => 'Mount Barker',
            'address' => 'Gawler Street, Mount Barker SA 5251',
            'latitude' => -35.0667,
            'longitude' => 138.8500,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Location Aliases (for import normalization)
    |--------------------------------------------------------------------------
    */

    'location_aliases' => [
        'adelaide' => 'adelaide-city',
        'city' => 'adelaide-city',
        'victoria square' => 'adelaide-city',
        'mclaren' => 'mclaren-vale',
        'vale' => 'mclaren-vale',
        'willunga hill' => 'willunga',
        'old willunga hill' => 'willunga',
        'victor harbour' => 'victor-harbor',
        'the parade' => 'norwood',
        'barossa' => 'tanunda',
        'barossa valley' => 'tanunda',
        'adelaide hills' => 'stirling',
        'mt barker' => 'mount-barker',
    ],

];
