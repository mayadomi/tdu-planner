import { Head } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SponsorItem {
    id: number;
    name: string;
    slug: string;
    events_count: number;
    logo_square_url: string;
    logo_square_dark_url: string;
    logo_rect_url: string;
    logo_rect_dark_url: string;
}

interface SponsorsIndexProps {
    sponsors: SponsorItem[];
    isAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sponsors', href: '/sponsors' },
];

export default function SponsorsIndex({ sponsors, isAdmin }: SponsorsIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Hosts | TDU Planner" />

            <div className="mx-auto max-w-4xl p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">
                        {isAdmin ? 'Event Hosts' : 'My Event Hosts'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isAdmin
                            ? 'Manage logos for all event hosts shown across the planner.'
                            : 'Manage logos for your verified event hosts.'}
                    </p>
                </div>

                {sponsors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Building2 className="mb-4 size-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                            {isAdmin
                                ? 'No event hosts found.'
                                : 'You have no verified event hosts yet. Visit My Event Hosts in your settings to submit a claim or request a new host.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sponsors.map((sponsor) => (
                            <Card key={sponsor.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{sponsor.name}</CardTitle>
                                        <span className="text-xs text-muted-foreground">
                                            {sponsor.events_count} event{sponsor.events_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Light mode logos */}
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Light mode</p>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <ImageUpload
                                                currentUrl={sponsor.logo_square_url || null}
                                                uploadRoute={`/sponsors/${sponsor.slug}/images/logo_square`}
                                                deleteRoute={`/sponsors/${sponsor.slug}/images/logo_square`}
                                                fieldName="image"
                                                label="Square logo"
                                                hint="Used in event cards. Recommended: 200×200px."
                                                aspectRatio="1/1"
                                            />
                                            <ImageUpload
                                                currentUrl={sponsor.logo_rect_url || null}
                                                uploadRoute={`/sponsors/${sponsor.slug}/images/logo_rect`}
                                                deleteRoute={`/sponsors/${sponsor.slug}/images/logo_rect`}
                                                fieldName="image"
                                                label="Rectangular logo"
                                                hint="Used in banners and headers. Recommended: 400×100px."
                                                aspectRatio="4/1"
                                            />
                                        </div>
                                    </div>

                                    {/* Dark mode logos */}
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dark mode</p>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <ImageUpload
                                                currentUrl={sponsor.logo_square_dark_url || null}
                                                uploadRoute={`/sponsors/${sponsor.slug}/images/logo_square_dark`}
                                                deleteRoute={`/sponsors/${sponsor.slug}/images/logo_square_dark`}
                                                fieldName="image"
                                                label="Square logo"
                                                hint="Used in event cards. Recommended: 200×200px."
                                                aspectRatio="1/1"
                                            />
                                            <ImageUpload
                                                currentUrl={sponsor.logo_rect_dark_url || null}
                                                uploadRoute={`/sponsors/${sponsor.slug}/images/logo_rect_dark`}
                                                deleteRoute={`/sponsors/${sponsor.slug}/images/logo_rect_dark`}
                                                fieldName="image"
                                                label="Rectangular logo"
                                                hint="Used in banners and headers. Recommended: 400×100px."
                                                aspectRatio="4/1"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
