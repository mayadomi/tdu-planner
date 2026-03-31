import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar, CalendarClock, Heart, Map, Plus } from 'lucide-react';

import { EventCard } from '@/components/events';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Event } from '@/types/events';

interface DashboardProps {
    upcomingEvents: Event[];
    favouritesCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

function greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard({ upcomingEvents, favouritesCount }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.role;
    const firstName = auth?.user?.name?.split(' ')[0] ?? '';
    const isEditor = role === 'editor' || role === 'admin';

    const quickLinks = [
        { href: '/events',    icon: Calendar,     label: 'Events' },
        { href: '/schedule',  icon: CalendarClock, label: 'Schedule' },
        { href: '/map',       icon: Map,           label: 'Map' },
        { href: '/favourites', icon: Heart,         label: `Favourites${favouritesCount > 0 ? ` (${favouritesCount})` : ''}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard | TDU Planner" />

            <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            {greeting()}{firstName ? `, ${firstName}` : ''}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Here's what's coming up at TDU.
                        </p>
                    </div>
                    {isEditor && (
                        <Button asChild>
                            <Link href="/events/create">
                                <Plus className="mr-1.5 size-4" />
                                Create event
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {quickLinks.map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-sm font-medium shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
                        >
                            <Icon className="size-6 text-orange-500" />
                            <span className="text-center text-xs">{label}</span>
                        </Link>
                    ))}
                </div>

                {/* Upcoming events */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Upcoming events</h2>
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                            <Link href="/events">
                                View all
                                <ArrowRight className="ml-1.5 size-3.5" />
                            </Link>
                        </Button>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {upcomingEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-muted/30 py-12 text-center">
                            <Calendar className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                            <p className="font-medium">No upcoming events</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Check back closer to the event dates.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
