// Event-related types for the TDU Planner

export interface Category {
    id: number;
    name: string;
    slug: string;
    events_count?: number;
}

export interface Sponsor {
    id: number;
    name: string;
    slug: string;
    events_count?: number;
    logo_square_url?: string;
    logo_square_dark_url?: string;
    logo_rect_url?: string;
    logo_rect_dark_url?: string;
}

export interface Location {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    address: string | null;
    events_count?: number;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    events_count?: number;
}

export interface Event {
    id: number;
    title: string;
    description: string | null;
    start_datetime: string;
    end_datetime: string;
    start_date: string;
    start_time: string;
    end_time: string;
    day_of_week: string;
    pace: string | null;
    route_url: string | null;
    is_featured: boolean;
    is_recurring: boolean;
    is_womens: boolean;
    is_happening_now: boolean;
    url: string | null;
    banner_image_url?: string;
    banner_image_thumb_url?: string;

    // Cost fields
    min_cost: number | null;
    max_cost: number | null;
    is_free: boolean;
    cost_formatted: string;

    // Ride-specific fields
    ride_distance_km: number | null;
    elevation_gain_m: number | null;
    is_ride: boolean;

    // Popularity
    favourites_count?: number;
    is_favourited?: boolean;

    // Relationships
    category?: Category;
    sponsor?: Sponsor;
    location?: Location;
    tags?: Tag[];

    // Timestamps
    created_at: string;
    updated_at: string;
}

// Laravel Eloquent Pagination format (default when using ->paginate())
export interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface EventFilters {
    search?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    category?: string;
    sponsor?: string;
    location?: number;
    min_distance?: number;
    max_distance?: number;
    min_elevation?: number;
    max_elevation?: number;
    rides_only?: boolean;
    featured?: boolean;
    free?: boolean;
    recurring?: boolean;
    womens?: boolean;
    tags?: string[];
    min_cost?: number;
    max_cost?: number;
    min_favourites?: number;
    sort?: 'date' | 'popularity' | 'cost' | 'distance' | 'elevation';
    order?: 'asc' | 'desc';
    per_page?: number;
}
