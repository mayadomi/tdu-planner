import { Head, Link } from '@inertiajs/react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { EventCard, EventFilters, EventSearch } from '@/components/events';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Category, Event, EventFilters as Filters, Location, PaginatedResponse, Tag } from '@/types/events';

interface EventsIndexProps {
    events: PaginatedResponse<Event>;
    categories: Category[];
    locations: Location[];
    tags: Tag[];
    filters: Filters;
    featuredEvents?: Event[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Events', href: '/events' },
];

export default function EventsIndex({
    events,
    categories,
    locations,
    tags,
    filters,
    featuredEvents,
}: EventsIndexProps) {
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeFilterCount = Object.values(filters).filter(
        v => v !== undefined && v !== '' && v !== false,
    ).length;

    const pageLinks = events.links.slice(1, -1);
    const currentPage = events.current_page;
    const lastPage = events.last_page;

    const getVisiblePages = () => {
        if (lastPage <= 5) return pageLinks;

        const visible: typeof pageLinks = [];
        const activeIdx = pageLinks.findIndex(l => l.active);

        const indices = new Set<number>();
        indices.add(0);
        indices.add(pageLinks.length - 1);
        for (let i = Math.max(0, activeIdx - 1); i <= Math.min(pageLinks.length - 1, activeIdx + 1); i++) {
            indices.add(i);
        }

        const sorted = [...indices].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
                visible.push({ url: null, label: '...', active: false });
            }
            visible.push(pageLinks[sorted[i]]);
        }
        return visible;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events | TDU Planner" />

            <div className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-4 lg:p-6">
                {/* Header */}
                <div className="flex flex-col gap-1 sm:gap-2">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tour Down Under Events</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Discover cycling events, community rides, and festival activities
                    </p>
                </div>

                {/* Search */}
                <EventSearch currentFilters={filters} />

                {/* Featured Events (if available and no filters applied) */}
                {featuredEvents && featuredEvents.length > 0 && Object.keys(filters).length === 0 && (
                    <section className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-5 text-amber-500" />
                            <h2 className="text-lg font-semibold sm:text-xl">Featured Events</h2>
                        </div>
                        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {featuredEvents.slice(0, 3).map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Mobile Filter Button */}
                <div className="lg:hidden">
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <Filter className="mr-2 size-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>Narrow down the events you want to see.</SheetDescription>
                            </SheetHeader>
                            <div className="px-4 pb-4">
                                <EventFilters
                                    categories={categories}
                                    locations={locations}
                                    tags={tags}
                                    currentFilters={filters}
                                    onApply={() => setFiltersOpen(false)}
                                    bare
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                    {/* Sidebar Filters - desktop only */}
                    <aside className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
                        <EventFilters
                            categories={categories}
                            locations={locations}
                            tags={tags}
                            currentFilters={filters}
                        />
                    </aside>

                    {/* Events Grid */}
                    <main className="space-y-4 sm:space-y-6">
                        {/* Results Info */}
                        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-muted-foreground sm:size-5" />
                                <span className="text-sm text-muted-foreground">
                                    {events.total} event{events.total !== 1 ? 's' : ''} found
                                </span>
                                {filters.sort && (
                                    <Badge variant="outline" className="ml-2">
                                        <TrendingUp className="mr-1 size-3" />
                                        {filters.sort} {filters.order === 'desc' ? '↓' : '↑'}
                                    </Badge>
                                )}
                            </div>

                            {/* Quick Links */}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/events/popular">Popular</Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/events/featured">Featured</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Events List */}
                        {events.data.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                                {events.data.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center sm:py-16">
                                <Calendar className="mb-4 size-10 text-muted-foreground/50 sm:size-12" />
                                <h3 className="text-lg font-medium">No events found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try adjusting your filters to find more events
                                </p>
                                <Button variant="outline" className="mt-4" asChild>
                                    <Link href="/events">Clear Filters</Link>
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {events.last_page > 1 && (
                            <nav className="flex items-center justify-center gap-1 sm:gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!events.prev_page_url}
                                    asChild={!!events.prev_page_url}
                                >
                                    {events.prev_page_url ? (
                                        <Link href={events.prev_page_url}>
                                            <ChevronLeft className="size-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Previous</span>
                                        </Link>
                                    ) : (
                                        <>
                                            <ChevronLeft className="size-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Previous</span>
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center gap-1">
                                    {getVisiblePages().map((link, i) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            className="min-w-[36px] sm:min-w-[40px]"
                                            asChild={!!link.url && !link.active}
                                            disabled={!link.url}
                                        >
                                            {link.url && !link.active ? (
                                                <Link href={link.url}>{link.label}</Link>
                                            ) : (
                                                <span>{link.label}</span>
                                            )}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!events.next_page_url}
                                    asChild={!!events.next_page_url}
                                >
                                    {events.next_page_url ? (
                                        <Link href={events.next_page_url}>
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="size-4 sm:ml-1" />
                                        </Link>
                                    ) : (
                                        <>
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="size-4 sm:ml-1" />
                                        </>
                                    )}
                                </Button>
                            </nav>
                        )}
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
