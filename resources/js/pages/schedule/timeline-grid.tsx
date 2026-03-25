import { useEffect, useMemo, useRef, useState } from 'react';

import type { Event } from '@/types/events';

import { TimelineEvent } from './timeline-event';

interface TimelineGridProps {
    eventsByCategory: Record<string, Event[]>;
    date: string;
}

// Configuration
const HOUR_WIDTH = 120; // pixels per hour
const ROW_HEIGHT = 80; // pixels per row
const CATEGORY_WIDTH = 100; // width of category label column
const START_HOUR = 0; // 0 AM
const END_HOUR = 24; // Midnight

// Category colors based on the mockup
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Race Stage': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
    'race-stage': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
    'Community Ride': { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
    'community-ride': { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
    'Gran Fondo': { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
    'gran-fondo': { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-500' },
    'Festival Event': { bg: 'bg-orange-300', text: 'text-orange-900', border: 'border-orange-400' },
    'festival-event': { bg: 'bg-orange-300', text: 'text-orange-900', border: 'border-orange-400' },
    'Criterium': { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600' },
    'criterium': { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600' },
    'Time Trial': { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600' },
    'time-trial': { bg: 'bg-fuchsia-500', text: 'text-white', border: 'border-fuchsia-600' },
    'Expo': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
    'expo': { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600' },
    'Entertainment': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
    'entertainment': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
    'Food & Wine': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
    'food-wine': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
    'Kids Race': { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
    'kids-race': { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-600' },
    'Hill Climb': { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700' },
    'hill-climb': { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700' },
};

const DEFAULT_COLOR = { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-600' };

export function getEventColor(categoryName: string | undefined, categorySlug: string | undefined) {
    if (categoryName && CATEGORY_COLORS[categoryName]) {
        return CATEGORY_COLORS[categoryName];
    }
    if (categorySlug && CATEGORY_COLORS[categorySlug]) {
        return CATEGORY_COLORS[categorySlug];
    }
    return DEFAULT_COLOR;
}

// Generate time slots for the header
function generateTimeSlots() {
    const slots = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
        slots.push({
            hour,
            label: `${hour.toString().padStart(2, '0')}:00`,
        });
    }
    return slots;
}

// Calculate event position and width based on time
function calculateEventPosition(event: Event) {
    const startTime = event.start_time.split(':');
    const endTime = event.end_time.split(':');
    
    const startHour = parseInt(startTime[0]) + parseInt(startTime[1]) / 60;
    const endHour = parseInt(endTime[0]) + parseInt(endTime[1]) / 60;
    
    // Handle events that end after midnight
    const adjustedEndHour = endHour < startHour ? endHour + 24 : endHour;
    
    const left = (startHour - START_HOUR) * HOUR_WIDTH;
    const width = Math.max((adjustedEndHour - startHour) * HOUR_WIDTH, HOUR_WIDTH / 2); // Minimum width
    
    return { left, width };
}

// Calculate current time position
function calculateNowPosition(date: string): number | null {
    const now = new Date();
    const eventDate = new Date(date + 'T00:00:00');
    
    // Only show NOW indicator if it's today
    if (
        now.getFullYear() !== eventDate.getFullYear() ||
        now.getMonth() !== eventDate.getMonth() ||
        now.getDate() !== eventDate.getDate()
    ) {
        return null;
    }
    
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    if (currentHour < START_HOUR || currentHour > END_HOUR) {
        return null;
    }
    
    return (currentHour - START_HOUR) * HOUR_WIDTH;
}

export function TimelineGrid({ eventsByCategory, date }: TimelineGridProps) {
    const timeSlots = useMemo(() => generateTimeSlots(), []);
    const gridRef = useRef<HTMLDivElement>(null);
    const [nowPosition, setNowPosition] = useState<number | null>(null);
    
    // Update NOW position every minute
    useEffect(() => {
        const updateNow = () => setNowPosition(calculateNowPosition(date));
        updateNow();
        
        const interval = setInterval(updateNow, 60000);
        return () => clearInterval(interval);
    }, [date]);
    
    // Scroll to current time on mount
    useEffect(() => {
        if (gridRef.current && nowPosition !== null) {
            const scrollTo = Math.max(0, nowPosition - 200);
            gridRef.current.scrollLeft = scrollTo;
        }
    }, [nowPosition]);
    
    const totalWidth = (END_HOUR - START_HOUR + 1) * HOUR_WIDTH;
    const categories = Object.keys(eventsByCategory);

    return (
        <div className="relative h-full">
            {/* Fixed Category Labels Column */}
            <div className="absolute left-0 top-0 z-20 h-full bg-background shadow-md">
                {/* Empty corner cell */}
                <div
                    className="flex items-end border-b border-r bg-slate-100 px-2 pb-2 dark:bg-slate-800"
                    style={{ width: CATEGORY_WIDTH, height: 60 }}
                >
                    <span className="text-xs font-medium text-muted-foreground">Category</span>
                </div>
                
                {/* Category labels */}
                {categories.map((category) => (
                    <div
                        key={category}
                        className="flex items-center border-b border-r bg-slate-50 px-2 dark:bg-slate-900"
                        style={{ width: CATEGORY_WIDTH, height: ROW_HEIGHT }}
                    >
                        <span className="text-xs font-semibold leading-tight text-slate-700 dark:text-slate-300">
                            {category}
                        </span>
                    </div>
                ))}
            </div>

            {/* Scrollable Grid Area */}
            <div
                ref={gridRef}
                className="h-full overflow-auto"
                style={{ paddingLeft: CATEGORY_WIDTH }}
            >
                <div style={{ width: totalWidth, minHeight: '100%' }}>
                    {/* Time Header */}
                    <div className="sticky top-0 z-10 flex bg-slate-100 dark:bg-slate-800" style={{ height: 60 }}>
                        {timeSlots.map((slot) => (
                            <div
                                key={slot.hour}
                                className="flex shrink-0 flex-col items-center justify-end border-b border-r pb-2"
                                style={{ width: HOUR_WIDTH }}
                            >
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {slot.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Event Rows */}
                    {categories.map((category) => {
                        const categoryEvents = eventsByCategory[category];
                        const color = getEventColor(category, categoryEvents[0]?.category?.slug);
                        
                        return (
                            <div
                                key={category}
                                className="relative border-b"
                                style={{ height: ROW_HEIGHT }}
                            >
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex">
                                    {timeSlots.map((slot) => (
                                        <div
                                            key={slot.hour}
                                            className="shrink-0 border-r border-slate-200 dark:border-slate-700"
                                            style={{ width: HOUR_WIDTH }}
                                        />
                                    ))}
                                </div>
                                
                                {/* Events */}
                                {categoryEvents.map((event) => {
                                    const { left, width } = calculateEventPosition(event);
                                    
                                    return (
                                        <TimelineEvent
                                            key={event.id}
                                            event={event}
                                            left={left}
                                            width={width}
                                            color={color}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* NOW Indicator */}
                    {nowPosition !== null && (
                        <div
                            className="absolute top-0 z-30 w-0.5 bg-red-500"
                            style={{
                                left: nowPosition,
                                height: 60 + categories.length * ROW_HEIGHT,
                            }}
                        >
                            {/* NOW label */}
                            <div className="absolute -left-6 top-1 rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                                NOW
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
