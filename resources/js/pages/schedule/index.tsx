import { Head, Link, router } from '@inertiajs/react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { ScheduleSearch } from '@/components/schedule/schedule-search';
import { TimelineGrid } from '@/components/schedule/timeline-grid';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { ScheduleCategory, TimelineBounds } from '@/types/schedule';

interface ScheduleIndexProps {
    timelineData: ScheduleCategory[];
    selectedDate: string;
    availableDates: string[];
    timelineBounds: TimelineBounds;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Schedule', href: '/schedule' },
];

function formatDateShort(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}`;
}

function formatDateFull(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function ScheduleIndex({
    timelineData,
    selectedDate,
    availableDates,
    timelineBounds,
}: ScheduleIndexProps) {
    const currentDateIndex = availableDates.indexOf(selectedDate);
    const hasPrevDate = currentDateIndex > 0;
    const hasNextDate = currentDateIndex < availableDates.length - 1;

    // Scroll the active date pill into view whenever selectedDate changes
    const selectedDateRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        selectedDateRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [selectedDate]);

    const navigateToDate = (date: string) => {
        router.get('/schedule', { date }, { preserveState: true });
    };

    const goToPrevDate = () => {
        if (hasPrevDate) navigateToDate(availableDates[currentDateIndex - 1]);
    };

    const goToNextDate = () => {
        if (hasNextDate) navigateToDate(availableDates[currentDateIndex + 1]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule | TDU Planner" />

            <div className="flex h-[calc(100dvh-4rem)] flex-col">
                {/* Header */}
                <div className="shrink-0 border-b bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-3 text-white sm:px-4 sm:py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold sm:text-2xl">Schedule</h1>
                        <Link href="/events">
                            <Button variant="secondary" size="sm">
                                <Calendar className="size-4 sm:mr-2" />
                                <span className="hidden sm:inline">List View</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="mt-2 sm:mt-3">
                        <ScheduleSearch selectedDate={selectedDate} />
                    </div>

                    {/* Date navigation */}
                    <div className="mt-2 flex items-center gap-1 sm:mt-3 sm:gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-white hover:bg-white/20 sm:size-10"
                            onClick={goToPrevDate}
                            disabled={!hasPrevDate}
                        >
                            <ChevronLeft className="size-4 sm:size-5" />
                        </Button>

                        <div className="scrollbar-none flex flex-1 justify-center gap-1 overflow-x-auto">
                            {availableDates.map((date) => (
                                <button
                                    key={date}
                                    ref={date === selectedDate ? selectedDateRef : undefined}
                                    onClick={() => navigateToDate(date)}
                                    className={cn(
                                        'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm',
                                        date === selectedDate
                                            ? 'bg-white text-orange-600 shadow-md'
                                            : 'text-white/90 hover:bg-white/20',
                                    )}
                                >
                                    {formatDateShort(date)}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-white hover:bg-white/20 sm:size-10"
                            onClick={goToNextDate}
                            disabled={!hasNextDate}
                        >
                            <ChevronRight className="size-4 sm:size-5" />
                        </Button>
                    </div>

                    {/* Selected date display */}
                    <p className="mt-1 text-center text-xs text-white/80 sm:mt-2 sm:text-sm">
                        {formatDateFull(selectedDate)}
                    </p>
                </div>

                {/* Timeline Grid */}
                <div className="min-h-0 flex-1 overflow-hidden">
                    {timelineData.length > 0 ? (
                        <TimelineGrid
                            categories={timelineData}
                            startHour={timelineBounds.startHour}
                            endHour={timelineBounds.endHour}
                            selectedDate={selectedDate}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center p-4">
                            <div className="text-center">
                                <Calendar className="mx-auto mb-4 size-12 text-muted-foreground/30 sm:size-16" />
                                <h3 className="text-lg font-medium">No events on this day</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Select another date to view events
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
