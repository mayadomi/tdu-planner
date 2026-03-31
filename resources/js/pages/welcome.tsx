import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Heart,
    Map,
    Route,
    Sparkles,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Welcome', href: '/welcome' }];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.role;
    const name = auth?.user?.name?.split(' ')[0] ?? 'there';

    const isCreator = role === 'editor_pending' || role === 'editor';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Welcome | TDU Planner" />
            <div className="mx-auto max-w-3xl p-4 py-10 sm:p-8 sm:py-14">
                {isCreator ? (
                    <CreatorWelcome name={name} role={role as string} />
                ) : (
                    <ViewerWelcome name={name} />
                )}
            </div>
        </AppLayout>
    );
}

// ─── Viewer welcome ───────────────────────────────────────────────────────────

function ViewerWelcome({ name }: { name: string }) {
    const features = [
        {
            icon: Calendar,
            title: 'Browse all events',
            description: 'Explore race stages, group rides, watch parties, expos and more.',
            href: '/events',
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            icon: Heart,
            title: 'Save your favourites',
            description: "Tap the heart on any event to build your personal TDU itinerary.",
            href: '/favourites',
            color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        },
        {
            icon: Clock,
            title: 'Day-by-day schedule',
            description: 'See every event laid out by day — perfect for planning your week.',
            href: '/schedule',
            color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
        },
        {
            icon: Map,
            title: 'Interactive map',
            description: 'Find events near you with an interactive map and route overlays.',
            href: '/map',
            color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Sparkles className="size-8 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">Welcome, {name}!</h1>
                <p className="mt-3 text-lg text-muted-foreground">
                    Your TDU Planner account is ready. Here's what you can do.
                </p>
            </div>

            {/* Feature cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                {features.map(({ icon: Icon, title, description, href, color }) => (
                    <Link
                        key={href}
                        href={href}
                        className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
                    >
                        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', color)}>
                            <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold group-hover:text-primary">{title}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                        </div>
                        <ArrowRight className="ml-auto mt-0.5 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                ))}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                    <Link href="/events">
                        Browse all events
                        <ArrowRight className="ml-2 size-4" />
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href={dashboard().url}>Go to dashboard</Link>
                </Button>
            </div>
        </div>
    );
}

// ─── Creator welcome ──────────────────────────────────────────────────────────

function CreatorWelcome({ name, role }: { name: string; role: string }) {
    const isPending = role === 'editor_pending';

    const steps = [
        { label: 'Create your account', done: true },
        { label: 'Submit editor access request', done: true },
        { label: 'Admin review & approval', done: !isPending, active: isPending },
        { label: 'Start creating events', done: !isPending, active: false },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Route className="size-8 text-orange-500" />
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">
                    {isPending ? `You're almost there, ${name}!` : `Welcome, ${name}!`}
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                    {isPending
                        ? 'Your editor access request has been submitted and is awaiting admin approval.'
                        : "Your editor access has been approved. You're ready to create events!"}
                </p>
            </div>

            {/* Progress steps */}
            <div className="mb-6 rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Your progress
                </h2>
                <ol className="space-y-4">
                    {steps.map(({ label, done, active }, i) => (
                        <li key={i} className="flex items-center gap-3">
                            {done ? (
                                <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                            ) : active ? (
                                <Circle className="size-5 shrink-0 animate-pulse text-amber-500" />
                            ) : (
                                <Circle className="size-5 shrink-0 text-muted-foreground/30" />
                            )}
                            <span
                                className={cn(
                                    'text-sm',
                                    done && 'font-medium text-foreground',
                                    active && 'font-medium text-amber-600 dark:text-amber-400',
                                    !done && !active && 'text-muted-foreground',
                                )}
                            >
                                {label}
                                {active && ' — pending'}
                            </span>
                        </li>
                    ))}
                </ol>

                {isPending && (
                    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            You'll receive an email when your request is approved. This usually happens within 24 hours.
                        </p>
                    </div>
                )}
            </div>

            {/* In the meantime */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 font-semibold">In the meantime, explore the app</h2>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Browse events', href: '/events' },
                        { label: 'Check the schedule', href: '/schedule' },
                        { label: 'View the map', href: '/map' },
                        { label: 'Go to dashboard', href: dashboard().url },
                    ].map(({ label, href }) => (
                        <Button key={href} asChild variant="outline" size="sm">
                            <Link href={href}>{label}</Link>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Cancel request */}
            {isPending && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.delete('/profile/request-editor')}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
                    >
                        <X className="size-3.5" />
                        Cancel editor access request
                    </button>
                </div>
            )}
        </div>
    );
}
