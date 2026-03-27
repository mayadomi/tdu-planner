import { Link } from '@inertiajs/react';
import { ExternalLink, MapPin } from 'lucide-react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CategoryColor, ScheduleEvent } from '@/types/schedule';

interface TimelineEventProps {
    event: ScheduleEvent & { lane: number };
    startHour: number;
    hourWidth: number;
    /** Pre-computed top offset in px (lane * LANE_H + LANE_PAD) */
    top: number;
    /** Card height in px */
    cardHeight: number;
    colors: CategoryColor;
}

// Format time for display.
// Datetimes are stored as naive Adelaide local time and sent with a +00:00 offset,
// so we read HH:MM directly from the ISO string to avoid browser timezone conversion.
function formatTime(dateString: string): string {
    return dateString.substring(11, 16);
}

export function TimelineEvent({
    event,
    startHour,
    hourWidth,
    top,
    cardHeight,
    colors,
}: TimelineEventProps) {
    const left = (event.start_hour - startHour) * hourWidth;
    // Enforce a minimum width so very short events are still visible as a coloured sliver
    const width = Math.max(event.duration_hours * hourWidth, 24);

    // Progressive disclosure thresholds
    const showTitle   = width >= 36;
    const showDetails = width >= 100;

    const timeLabel = `${formatTime(event.start_datetime)}–${formatTime(event.end_datetime)}`;

    const card = (
        <div
            className={cn(
                'absolute rounded border-l-4 shadow-sm transition-shadow hover:z-10 hover:shadow-md',
                colors.border,
                'bg-white dark:bg-gray-800',
            )}
            style={{ left, width, top, height: cardHeight }}
        >
            <Link
                href={`/events/${event.id}`}
                className="flex h-full flex-col justify-center overflow-hidden px-1.5 py-1"
            >
                {showTitle && (
                    <h4 className="truncate text-[10px] font-semibold text-foreground sm:text-xs">
                        {event.title}
                    </h4>
                )}

                {showDetails && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="shrink-0 font-medium tabular-nums">{timeLabel}</span>

                        {event.location && (
                            <span className="hidden items-center gap-0.5 truncate lg:flex">
                                <MapPin className="size-2.5 shrink-0" />
                                {event.location}
                            </span>
                        )}
                    </div>
                )}
            </Link>

            {/* External link — only when card is wide enough */}
            {event.url && showDetails && (
                <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-0.5 top-0.5 rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="size-2.5" />
                </a>
            )}

            {/* Featured dot */}
            {event.is_featured && (
                <div className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-yellow-400 ring-1 ring-white" />
            )}
        </div>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>{card}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
                <p className="font-semibold">{event.title}</p>
                <p className="mt-0.5 text-xs opacity-80">{timeLabel}</p>
                {event.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs opacity-80">
                        <MapPin className="size-3 shrink-0" />
                        {event.location}
                    </p>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
