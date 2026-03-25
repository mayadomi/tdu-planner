// Shared types for the schedule / timeline view

export type CategorySlug =
    | 'race-stages'
    | 'official-events'
    | 'watch-parties'
    | 'group-rides'
    | 'local-racing'
    | 'pop-up'
    | 'expo'
    | 'pop-ups'
    | 'team-meets'
    | 'food-wine'
    | 'entertainment'
    | 'podcast'
    | 'other';

export interface CategoryColor {
    bg: string;
    border: string;
    text: string;
}

export interface ScheduleEvent {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    start_hour: number;
    end_hour: number;
    duration_hours: number;
    category_slug: string;
    location: string | null;
    ride_distance_km: number | null;
    elevation_gain_m: number | null;
    is_featured: boolean;
    url: string | null;
}

export interface ScheduleCategory {
    category: {
        id: number | null;
        name: string;
        slug: string;
    };
    events: ScheduleEvent[];
}

export interface TimelineBounds {
    startHour: number;
    endHour: number;
}
