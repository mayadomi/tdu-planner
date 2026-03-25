<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Category Mappings
    |--------------------------------------------------------------------------
    | Maps scraped category header text to internal category slugs.
    */
    'category_mappings' => [
        'Race Stages'    => 'race-stages',
        'Official Events'=> 'official-events',
        'Street Parties' => 'street-parties',
        'Group Rides'    => 'group-rides',
        'Demo Bikes'     => 'demo-bikes',
        'Pop Up'         => 'pop-up',
        'Cycling Shops'  => 'cycling-shops',
        'Local Racing'   => 'local-racing',
        'Team Meets'     => 'team-meets',
        'Expo'           => 'expo',
        'Food'           => 'food-wine',
        'Entertainment'  => 'entertainment',
    ],

    /*
    |--------------------------------------------------------------------------
    | Sponsor Mappings
    |--------------------------------------------------------------------------
    | Maps sponsor name keywords to slugs used in the database.
    */
    'sponsor_mappings' => [
        'Santos'             => 'santos',
        'Ziptrak'            => 'ziptrak',
        'Specialized'        => 'specialized',
        'Trek'               => 'trek-bikes',
        'Shimano'            => 'shimano',
        'Giant'              => 'giant-bicycles',
        'Castelli'           => 'castelli',
        'Santini'            => 'santini',
        'MAAP'               => 'maap',
        'Pedla'              => 'pedla',
        'Black Sheep'        => 'black-sheep',
        'Wahoo'              => 'wahoo',
        'Oakley'             => 'oakley',
        'Health Partners'    => 'health-partners',
        'Canyon'             => 'canyon',
        'Knog'               => 'knog',
        'Rapha'              => 'rapha',
        'Focus'              => 'focus',
        'MOOD'               => 'mood',
        'Cycle Closet'       => 'cycle-closet',
        'Kask'               => 'kask',
        'Knights of Suburbia'=> 'knights-of-suburbia',
        'RADL GRVL'          => 'radl-grvl',
        'Quad Lock'          => 'quad-lock',
        'Cannondale'         => 'cannondale',
        'Pinarello'          => 'pinarello',
        'DASH Adelaide'      => 'dash-adelaide',
        'FE Sports'          => 'fe-sports',
        'Echelon Sports'     => 'echelon-sports',
        'Zwift'              => 'zwift',
    ],

    /*
    |--------------------------------------------------------------------------
    | Location Normalisations
    |--------------------------------------------------------------------------
    | Maps location text fragments to canonical display names.
    */
    'location_mappings' => [
        'tarntanyangga' => 'Tour Village, Adelaide',
        'victoria square'=> 'Tour Village, Adelaide',
        'tour village'  => 'Tour Village, Adelaide',
        'willunga'      => 'Willunga',
        'mclaren vale'  => 'McLaren Vale',
        'tanunda'       => 'Tanunda',
        'glenelg'       => 'Glenelg',
        'henley beach'  => 'Henley Beach',
        'stirling'      => 'Stirling',
        'hahndorf'      => 'Hahndorf',
        'norwood'       => 'Norwood',
        'unley'         => 'Unley',
        'campbelltown'  => 'Campbelltown',
        'magill'        => 'Magill',
        'paracombe'     => 'Paracombe',
        'hay valley'    => 'Hay Valley',
        'lot.100'       => 'Hay Valley',
        'rundle st'     => 'Rundle St, Adelaide',
        'mount barker'  => 'Mount Barker',
    ],

    /*
    |--------------------------------------------------------------------------
    | Featured Event Keywords
    |--------------------------------------------------------------------------
    | Events whose titles contain any of these keywords are marked featured.
    */
    'featured_keywords' => [
        'stage',
        "women's tdu",
        "men's tdu",
        'santos tour',
        'challenge tour',
        'epic ride',
    ],

    /*
    |--------------------------------------------------------------------------
    | Women's Event Keywords
    |--------------------------------------------------------------------------
    | Events whose titles contain any of these keywords are marked as women's.
    */
    'womens_keywords' => [
        "women's",
        'womens',
        'ladies',
        'she rides',
        'female',
    ],

];
