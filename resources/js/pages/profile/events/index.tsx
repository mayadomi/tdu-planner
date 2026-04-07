import { Head, Link } from '@inertiajs/react';
import { Calendar, Clock, Pencil, Plus } from 'lucide-react';

import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Event } from '@/types/events';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Events', href: '/profile/events' },
];

interface MyEventsProps {
    events: Event[];
}

export default function MyEventsIndex({ events }: MyEventsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Events | TDU Planner" />

            <div className="mx-auto max-w-4xl p-4 lg:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="My Events" description="Events you have created." />
                    <Button asChild>
                        <Link href="/events/create">
                            <Plus className="mr-2 size-4" />
                            Create Event
                        </Link>
                    </Button>
                </div>

                {events.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <Calendar className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">You haven't created any events yet.</p>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/events/create">Create your first event</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => (
                            <EventRow key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function EventRow({ event }: { event: Event }) {
    const start = new Date(event.start_datetime);
    const isUpcoming = start > new Date();

    return (
        <Card>
            <CardContent className="flex items-center gap-4 py-4">
                {/* Date block */}
                <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-muted px-2 py-2 text-center">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                        {start.toLocaleDateString('en-AU', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold leading-none">{start.getDate()}</span>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/events/${event.id}`}
                            className="truncate font-medium hover:underline"
                        >
                            {event.title}
                        </Link>
                        {event.is_featured && (
                            <Badge variant="secondary" className="shrink-0">Featured</Badge>
                        )}
                        {!isUpcoming && (
                            <Badge variant="outline" className="shrink-0 text-muted-foreground">Past</Badge>
                        )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {event.category && (
                            <span>{event.category.name}</span>
                        )}
                        {event.sponsor && (
                            <span>{event.sponsor.name}</span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {start.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Edit button */}
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/events/${event.id}/edit`}>
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
