import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Clock,
    ExternalLink,
    MapPin,
    Mountain,
    Pencil,
    Route,
    Share2,
    Users,
} from 'lucide-react';

import { FavouriteButton } from '@/components/events';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Event } from '@/types/events';

interface EventShowProps {
    event: Event;
    can_edit: boolean;
}

export default function EventShow({ event, can_edit }: EventShowProps) {
    const page = usePage<SharedData>();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.id}` },
    ];

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: event.title,
                text: event.description || '',
                url: window.location.href,
            });
        } else {
            await navigator.clipboard.writeText(window.location.href);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${event.title} | TDU Planner`} />

            <div className="mx-auto max-w-4xl p-4 lg:p-6">
                {/* Back Button */}
                <Button variant="ghost" size="sm" className="mb-4" asChild>
                    <Link href="/events">
                        <ArrowLeft className="mr-2 size-4" />
                        Back to Events
                    </Link>
                </Button>

                {/* Main Card */}
                <Card>
                    <CardHeader className="space-y-4">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                            {event.is_happening_now && (
                                <Badge className="animate-pulse bg-green-500 text-white">
                                    <span className="mr-1.5 size-2 rounded-full bg-white" />
                                    Happening Now
                                </Badge>
                            )}
                            {event.is_featured && (
                                <Badge className="bg-amber-500 text-white">Featured</Badge>
                            )}
                            {event.category && (
                                <Badge variant="secondary">{event.category.name}</Badge>
                            )}
                            {event.is_womens && (
                                <Badge className="bg-pink-500 text-white">Women's</Badge>
                            )}
                            {event.is_free ? (
                                <Badge variant="outline" className="text-green-600">Free</Badge>
                            ) : (
                                <Badge variant="outline">{event.cost_formatted}</Badge>
                            )}
                            {event.tags?.map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>

                        {/* Title & Actions */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-2xl lg:text-3xl">{event.title}</CardTitle>
                                {event.sponsor && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Sponsored by {event.sponsor.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {can_edit && (
                                    <Button variant="outline" size="default" asChild>
                                        <Link href={`/events/${event.id}/edit?from=${encodeURIComponent(page.url)}`}>
                                            <Pencil className="mr-2 size-4" />
                                            Edit
                                        </Link>
                                    </Button>
                                )}
                                <FavouriteButton
                                    eventId={event.id}
                                    isFavourited={event.is_favourited}
                                    showLabel
                                    size="default"
                                />
                                <Button variant="outline" size="default" onClick={handleShare}>
                                    <Share2 className="mr-2 size-4" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Banner Image */}
                    {event.banner_image_url && (
                        <div className="overflow-hidden rounded-b-none">
                            <img
                                src={event.banner_image_url}
                                alt={event.title}
                                className="h-48 w-full object-cover sm:h-64"
                            />
                        </div>
                    )}

                    <CardContent className="space-y-6">
                        {/* Date, Time & Location */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Calendar className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{event.day_of_week}</p>
                                    <p className="text-sm text-muted-foreground">{event.start_date}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-primary/10 p-2">
                                    <Clock className="size-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{event.start_time} - {event.end_time}</p>
                                    <p className="text-sm text-muted-foreground">Event time</p>
                                </div>
                            </div>
                            {event.location && (
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-primary/10 p-2">
                                        <MapPin className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{event.location.name}</p>
                                        {event.location.address && (
                                            <p className="text-sm text-muted-foreground">
                                                {event.location.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ride Stats */}
                        {event.is_ride && (
                            <>
                                <Separator />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {event.ride_distance_km && (
                                        <div className="flex items-center gap-3 rounded-lg border p-4">
                                            <Route className="size-8 text-blue-500" />
                                            <div>
                                                <p className="text-2xl font-bold">{event.ride_distance_km} km</p>
                                                <p className="text-sm text-muted-foreground">Distance</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.elevation_gain_m && (
                                        <div className="flex items-center gap-3 rounded-lg border p-4">
                                            <Mountain className="size-8 text-orange-500" />
                                            <div>
                                                <p className="text-2xl font-bold">{event.elevation_gain_m} m</p>
                                                <p className="text-sm text-muted-foreground">Elevation Gain</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Description */}
                        {event.description && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="mb-2 font-semibold">About this event</h3>
                                    <p className="leading-relaxed text-muted-foreground">
                                        {event.description}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Popularity */}
                        {event.favourites_count !== undefined && event.favourites_count > 0 && (
                            <>
                                <Separator />
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="size-4" />
                                    <span>
                                        {event.favourites_count} {event.favourites_count === 1 ? 'person has' : 'people have'} saved this event
                                    </span>
                                </div>
                            </>
                        )}

                        {/* External Link */}
                        {event.url && (
                            <>
                                <Separator />
                                <Button asChild className="w-full sm:w-auto">
                                    <a href={event.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 size-4" />
                                        View Official Event Page
                                    </a>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
