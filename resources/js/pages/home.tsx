import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Heart,
    Mail,
    Map,
    MapPin,
    Mountain,
    Route,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import { useRef, useState } from 'react';

import AppLogo from '@/components/app-logo';
import { FavouriteButton } from '@/components/events/favourite-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';
import type { Event } from '@/types/events';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeProps {
    upcomingEvents: Event[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatEventTime(iso: string): string {
    return iso.substring(11, 16);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home({ upcomingEvents }: HomeProps) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth?.user;

    return (
        <>
            <Head title="TDU Planner — Tour Down Under Event Guide" />
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                <SiteNav isLoggedIn={isLoggedIn} userName={auth?.user?.name} />
                <main className="flex-1">
                    <HeroSection isLoggedIn={isLoggedIn} />
                    <UpcomingEventsSection events={upcomingEvents} isLoggedIn={isLoggedIn} />
                    <FeaturesSection />
                    {!isLoggedIn && <CreatorCtaSection />}
                </main>
                <SiteFooter />
            </div>
        </>
    );
}

// ─── Site nav ─────────────────────────────────────────────────────────────────

function SiteNav({ isLoggedIn, userName }: { isLoggedIn: boolean; userName?: string }) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <AppLogo />
                </Link>

                <nav className="flex items-center gap-2">
                    <Link
                        href="/events"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                        Events
                    </Link>
                    <Link
                        href="/schedule"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                        Schedule
                    </Link>
                    <Link
                        href="/map"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                        Map
                    </Link>

                    <div className="ml-2 flex items-center gap-2">
                        {isLoggedIn ? (
                            <Button asChild size="sm">
                                <Link href={dashboard().url}>
                                    Go to app
                                    <ArrowRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={login().url}>Sign in</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={register().url}>Sign up free</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 py-20 text-white sm:py-28">
            {/* Subtle background pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,.15) 40px, rgba(255,255,255,.15) 41px)',
                }}
            />

            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
                <Badge className="mb-6 inline-flex items-center gap-1.5 bg-white/20 text-white hover:bg-white/25">
                    <Sparkles className="size-3.5" />
                    Santos Tour Down Under
                </Badge>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    Your guide to every
                    <br />
                    <span className="text-amber-200">TDU event</span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
                    Discover race stages, group rides, watch parties, expos and more — all in one place.
                    Plan your perfect TDU experience.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {isLoggedIn ? (
                        <>
                            <Button
                                asChild
                                size="lg"
                                className="bg-white font-semibold text-orange-600 hover:bg-orange-50"
                            >
                                <Link href="/events">
                                    Browse all events
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link href="/favourites">
                                    <Heart className="mr-2 size-4" />
                                    My Favourites
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                asChild
                                size="lg"
                                className="bg-white font-semibold text-orange-600 hover:bg-orange-50"
                            >
                                <Link href={register().url}>
                                    Plan My TDU
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link href={`${register().url}?intent=creator`}>
                                    List my event
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Quick stats */}
                <div className="mt-14 flex flex-wrap justify-center gap-8 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        <span>Race stages &amp; official events</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Route className="size-4" />
                        <span>Group rides &amp; local racing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Map className="size-4" />
                        <span>Interactive map &amp; schedule</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Upcoming events section ───────────────────────────────────────────────────

function UpcomingEventsSection({ events, isLoggedIn }: { events: Event[]; isLoggedIn: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollState = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
    };

    if (events.length === 0) return null;

    return (
        <section className="py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">
                            Coming up
                        </p>
                        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Upcoming events</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="flex size-9 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="flex size-9 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {events.map((event) => (
                        <EventCarouselCard
                            key={event.id}
                            event={event}
                            isLoggedIn={isLoggedIn}
                        />
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Button asChild variant="outline" size="lg">
                        <Link href="/events">
                            View all events
                            <ArrowRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

// ─── Event carousel card ──────────────────────────────────────────────────────

function EventCarouselCard({ event, isLoggedIn }: { event: Event; isLoggedIn: boolean }) {
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const sponsorLogo = isDark
        ? (event.sponsor?.logo_square_dark_url || event.sponsor?.logo_square_url)
        : event.sponsor?.logo_square_url;

    return (
        <div
            className="w-72 shrink-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            style={{ scrollSnapAlign: 'start' }}
        >
            {/* Banner */}
            <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {event.banner_image_url ? (
                    <img
                        src={event.banner_image_url}
                        alt={event.title}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="size-10 text-slate-300 dark:text-slate-600" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute left-2 top-2 flex gap-1">
                    {event.is_happening_now && (
                        <Badge className="animate-pulse bg-green-500 text-white text-[10px]">
                            <span className="mr-1 size-1.5 rounded-full bg-white" />
                            Live
                        </Badge>
                    )}
                    {event.is_featured && (
                        <Badge className="bg-amber-500 text-white text-[10px]">
                            <Sparkles className="mr-1 size-2.5" />
                            Featured
                        </Badge>
                    )}
                </div>

                {/* Sponsor logo */}
                {sponsorLogo && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-white/95 p-1.5 shadow dark:bg-gray-900/95">
                        <img src={sponsorLogo} alt={event.sponsor?.name} className="size-8 object-contain" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <Link
                    href={`/events/${event.id}`}
                    className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
                >
                    {event.title}
                </Link>

                {event.category && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800 text-[10px] dark:bg-blue-900/30 dark:text-blue-300">
                        {event.category.name}
                    </Badge>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        <span>{formatEventDate(event.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" />
                        <span>{formatEventTime(event.start_datetime)} – {formatEventTime(event.end_datetime)}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{event.location.name}</span>
                        </div>
                    )}
                    {event.is_ride && event.ride_distance_km && (
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Route className="size-3.5" />
                                {event.ride_distance_km} km
                            </span>
                            {event.elevation_gain_m && (
                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                    <Mountain className="size-3.5" />
                                    {event.elevation_gain_m} m
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-4 py-2.5">
                <span className={cn('text-xs font-medium', event.is_free ? 'text-green-600 dark:text-green-400' : 'text-foreground')}>
                    {event.is_free ? 'Free' : event.cost_formatted}
                </span>
                {isLoggedIn ? (
                    <FavouriteButton eventId={event.id} isFavourited={event.is_favourited} />
                ) : (
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link href={`/events/${event.id}`}>View details</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Features section ─────────────────────────────────────────────────────────

function FeaturesSection() {
    const features = [
        {
            icon: Calendar,
            title: 'All events in one place',
            description:
                'Race stages, watch parties, group rides, expos, food & wine events — everything TDU, curated and up to date.',
        },
        {
            icon: Map,
            title: 'Interactive map',
            description:
                "See every event plotted on a map with route overlays. Find what's happening near you or along the race course.",
        },
        {
            icon: Heart,
            title: 'Save your favourites',
            description:
                "Bookmark the events you don't want to miss. Your personal favourites list is always one tap away.",
        },
        {
            icon: Trophy,
            title: 'Daily schedule',
            description:
                'Navigate the packed TDU calendar with a day-by-day timeline that makes planning your week effortless.',
        },
        {
            icon: Users,
            title: 'Community & sponsors',
            description:
                'Discover events from official sponsors, local clubs, and community organisers all under one roof.',
        },
        {
            icon: Route,
            title: 'Ride details',
            description:
                "Distance, elevation, pace and route maps for every group ride — so you know what you're getting into.",
        },
    ];

    return (
        <section className="bg-muted/40 py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-12 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">Why TDU Planner</p>
                    <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Everything you need for TDU</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="rounded-xl border bg-background p-6 shadow-sm">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <Icon className="size-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="font-semibold">{title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Creator CTA section ──────────────────────────────────────────────────────

function CreatorCtaSection() {
    return (
        <section className="py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-8 text-white shadow-xl sm:p-12">
                    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                        <div>
                            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/25">
                                For event organisers &amp; sponsors
                            </Badge>
                            <h2 className="text-2xl font-bold sm:text-3xl">
                                List your TDU event or sponsorship
                            </h2>
                            <p className="mt-4 text-white/85">
                                Are you organising a group ride, watch party, expo stand, or community event
                                during TDU? Get your event in front of thousands of cycling fans and
                                participants by listing it on TDU Planner.
                            </p>
                            <ul className="mt-6 space-y-2 text-sm text-white/80">
                                <li className="flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-amber-200" />
                                    Free to list community events
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-amber-200" />
                                    Appear in the schedule, map, and event search
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-amber-200" />
                                    Sponsor branding and logo placement available
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-4 lg:items-end">
                            <Button
                                asChild
                                size="lg"
                                className="w-full bg-white font-semibold text-orange-600 hover:bg-orange-50 lg:w-auto"
                            >
                                <Link href={`${register().url}?intent=creator`}>
                                    Sign up as event organiser
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <p className="text-center text-sm text-white/70 lg:text-right">
                                Editor access is requested automatically at sign-up.
                            </p>
                            <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                <a href="mailto:hello@tdu-planner.com.au">
                                    <Mail className="mr-1.5 size-4" />
                                    Contact us directly
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Site footer ──────────────────────────────────────────────────────────────

function SiteFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2">
                            <AppLogo />
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Your unofficial guide to the Santos Tour Down Under — the Southern Hemisphere's
                            biggest cycling event.
                        </p>
                    </div>

                    {/* Explore */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold">Explore</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/events" className="hover:text-foreground">All events</Link></li>
                            <li><Link href="/schedule" className="hover:text-foreground">Schedule</Link></li>
                            <li><Link href="/map" className="hover:text-foreground">Map</Link></li>
                            <li><Link href="/favourites" className="hover:text-foreground">My Favourites</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold">Account</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={login().url} className="hover:text-foreground">Sign in</Link></li>
                            <li><Link href={register().url} className="hover:text-foreground">Create account</Link></li>
                            <li><Link href={`${register().url}?intent=creator`} className="hover:text-foreground">List your event</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold">Contact</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="mailto:hello@tdu-planner.com.au" className="flex items-center gap-2 hover:text-foreground">
                                    <Mail className="size-3.5" />
                                    hello@tdu-planner.com.au
                                </a>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                <span>Adelaide, South Australia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
                    <p>
                        &copy; {currentYear} TDU Planner. Not affiliated with Santos Tour Down Under or Events South Australia.
                    </p>
                </div>
            </div>
        </footer>
    );
}
