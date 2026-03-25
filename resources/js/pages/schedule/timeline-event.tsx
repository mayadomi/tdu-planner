import { Link } from '@inertiajs/react';

import { cn } from '@/lib/utils';
import type { Event } from '@/types/events';

interface TimelineEventProps {
    event: Event;
    left: number;
    width: number;
    color: {
        bg: string;
        text: string;
        border: string;
    };
}

export function TimelineEvent({ event, left, width, color }: TimelineEventProps) {
    // Format distance and elevation for display
    const rideInfo = [];
    if (event.ride_distance_km) {
        rideInfo.push(`${event.ride_distance_km}km`);
    }
    if (event.elevation_gain_m) {
        rideInfo.push(`${event.elevation_gain_m}m`);
    }

    return (
        <Link
            href={`/events/${event.id}`}
            className={cn(
                'absolute top-2 bottom-2 overflow-hidden rounded-lg border-2 px-2 py-1 shadow-sm transition-all hover:shadow-md hover:brightness-110',
                color.bg,
                color.text,
                color.border,
            )}
            style={{
                left: `${left}px`,
                width: `${Math.max(width - 4, 60)}px`, // Subtract padding, minimum 60px
            }}
        >
            <div className="flex h-full flex-col justify-center">
                {/* Event Title */}
                <span className="line-clamp-2 text-xs font-semibold leading-tight">
                    {event.title}
                </span>
                
                {/* Ride Info (distance/elevation) */}
                {rideInfo.length > 0 && (
                    <span className="mt-0.5 text-[10px] font-medium opacity-90">
                        {rideInfo.join(' / ')}
                    </span>
                )}
                
                {/* Time (for small events) */}
                {width < 100 && (
                    <span className="mt-0.5 text-[10px] opacity-75">
                        {event.start_time}
                    </span>
                )}
            </div>
        </Link>
    );
}
