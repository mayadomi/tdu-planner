import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { GpxUpload } from '@/components/ui/gpx-upload';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SimpleOption {
    id: number;
    name: string;
}

interface EditableEvent {
    id: number;
    title: string;
    description: string | null;
    start_datetime: string;
    end_datetime: string;
    category_id: number | null;
    sponsor_id: number | null;
    location_id: number | null;
    pace: string | null;
    route_url: string | null;
    url: string | null;
    is_featured: boolean;
    is_recurring: boolean;
    is_womens: boolean;
    is_free: boolean;
    min_cost: number | null;
    max_cost: number | null;
    ride_distance_km: number | null;
    elevation_gain_m: number | null;
    tag_ids: number[];
    banner_image_url: string | null;
    has_route: boolean;
    route_gpx_name: string | null;
}

interface EventEditProps {
    event: EditableEvent;
    categories: SimpleOption[];
    sponsors: SimpleOption[];
    locations: SimpleOption[];
    tags: SimpleOption[];
}

type FormData = {
    title: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    category_id: string;
    sponsor_id: string;
    location_id: string;
    pace: string;
    route_url: string;
    url: string;
    is_featured: boolean;
    is_recurring: boolean;
    is_womens: boolean;
    is_free: boolean;
    min_cost: string;
    max_cost: string;
    ride_distance_km: string;
    elevation_gain_m: string;
    tag_ids: number[];
};

export default function EventEdit({ event, categories, sponsors, locations, tags }: EventEditProps) {
    const fromParam = new URLSearchParams(window.location.search).get('from');
    // fromParam points to either an events list URL (/events?page=N) or a show URL (/events/{id})
    const isFromList = fromParam ? !/^\/events\/\d+/.test(fromParam) : false;
    const backHref = fromParam ?? `/events/${event.id}`;
    const backLabel = isFromList ? 'Back to Events' : 'Back to Event';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.id}` },
        { title: 'Edit', href: `/events/${event.id}/edit` },
    ];

    const { data, setData, patch, processing, errors } = useForm<FormData>({
        title: event.title,
        description: event.description ?? '',
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        category_id: event.category_id?.toString() ?? '',
        sponsor_id: event.sponsor_id?.toString() ?? '',
        location_id: event.location_id?.toString() ?? '',
        pace: event.pace ?? '',
        route_url: event.route_url ?? '',
        url: event.url ?? '',
        is_featured: event.is_featured,
        is_recurring: event.is_recurring,
        is_womens: event.is_womens,
        is_free: event.is_free,
        min_cost: event.min_cost?.toString() ?? '',
        max_cost: event.max_cost?.toString() ?? '',
        ride_distance_km: event.ride_distance_km?.toString() ?? '',
        elevation_gain_m: event.elevation_gain_m?.toString() ?? '',
        tag_ids: event.tag_ids,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/events/${event.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${event.title} | TDU Planner`} />

            <div className="mx-auto max-w-3xl p-4 lg:p-6">
                <Button variant="ghost" size="sm" className="mb-4" asChild>
                    <Link href={backHref}>
                        <ArrowLeft className="mr-2 size-4" />
                        {backLabel}
                    </Link>
                </Button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Event title"
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">{errors.title}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Event description"
                                    rows={4}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="url">External URL</Label>
                                <Input
                                    id="url"
                                    type="url"
                                    value={data.url}
                                    onChange={(e) => setData('url', e.target.value)}
                                    placeholder="https://..."
                                />
                                {errors.url && (
                                    <p className="text-sm text-destructive">{errors.url}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timing */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Date &amp; Time</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_datetime">Start *</Label>
                                    <Input
                                        id="start_datetime"
                                        type="datetime-local"
                                        value={data.start_datetime}
                                        onChange={(e) => setData('start_datetime', e.target.value)}
                                    />
                                    {errors.start_datetime && (
                                        <p className="text-sm text-destructive">{errors.start_datetime}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_datetime">End *</Label>
                                    <Input
                                        id="end_datetime"
                                        type="datetime-local"
                                        value={data.end_datetime}
                                        onChange={(e) => setData('end_datetime', e.target.value)}
                                    />
                                    {errors.end_datetime && (
                                        <p className="text-sm text-destructive">{errors.end_datetime}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Relations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Category, Sponsor &amp; Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category *</Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(v) => setData('category_id', v)}
                                >
                                    <SelectTrigger id="category_id">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && (
                                    <p className="text-sm text-destructive">{errors.category_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sponsor_id">Sponsor</Label>
                                <Select
                                    value={data.sponsor_id}
                                    onValueChange={(v) => setData('sponsor_id', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger id="sponsor_id">
                                        <SelectValue placeholder="No sponsor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No sponsor</SelectItem>
                                        {sponsors.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.sponsor_id && (
                                    <p className="text-sm text-destructive">{errors.sponsor_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location_id">Location</Label>
                                <Select
                                    value={data.location_id}
                                    onValueChange={(v) => setData('location_id', v === 'none' ? '' : v)}
                                >
                                    <SelectTrigger id="location_id">
                                        <SelectValue placeholder="No location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No location</SelectItem>
                                        {locations.map((loc) => (
                                            <SelectItem key={loc.id} value={loc.id.toString()}>
                                                {loc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.location_id && (
                                    <p className="text-sm text-destructive">{errors.location_id}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tags</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {tags.map((tag) => (
                                    <div key={tag.id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`tag-${tag.id}`}
                                            checked={data.tag_ids.includes(tag.id)}
                                            onCheckedChange={(checked) => {
                                                setData(
                                                    'tag_ids',
                                                    checked
                                                        ? [...data.tag_ids, tag.id]
                                                        : data.tag_ids.filter((id) => id !== tag.id),
                                                );
                                            }}
                                        />
                                        <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer font-normal">
                                            {tag.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.tag_ids && (
                                <p className="mt-2 text-sm text-destructive">{errors.tag_ids}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Banner Image */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Banner Image</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                currentUrl={event.banner_image_url}
                                uploadRoute={`/events/${event.id}/banner`}
                                deleteRoute={`/events/${event.id}/banner`}
                                fieldName="banner"
                                label="Event card banner"
                                hint="Displayed on event cards and the event detail page. Recommended: 800×400px."
                                aspectRatio="2/1"
                            />
                        </CardContent>
                    </Card>

                    {/* Flags */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Flags</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="is_featured"
                                    checked={data.is_featured}
                                    onCheckedChange={(v) => setData('is_featured', Boolean(v))}
                                />
                                <Label htmlFor="is_featured" className="cursor-pointer font-normal">
                                    Featured event
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="is_recurring"
                                    checked={data.is_recurring}
                                    onCheckedChange={(v) => setData('is_recurring', Boolean(v))}
                                />
                                <Label htmlFor="is_recurring" className="cursor-pointer font-normal">
                                    Recurring event
                                </Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="is_womens"
                                    checked={data.is_womens}
                                    onCheckedChange={(v) => setData('is_womens', Boolean(v))}
                                />
                                <Label htmlFor="is_womens" className="cursor-pointer font-normal">
                                    Women's event
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="is_free"
                                    checked={data.is_free}
                                    onCheckedChange={(v) => setData('is_free', Boolean(v))}
                                />
                                <Label htmlFor="is_free" className="cursor-pointer font-normal">
                                    Free event
                                </Label>
                            </div>

                            {!data.is_free && (
                                <>
                                    <Separator />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="min_cost">Min Cost ($)</Label>
                                            <Input
                                                id="min_cost"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={data.min_cost}
                                                onChange={(e) => setData('min_cost', e.target.value)}
                                                placeholder="0.00"
                                            />
                                            {errors.min_cost && (
                                                <p className="text-sm text-destructive">{errors.min_cost}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="max_cost">Max Cost ($)</Label>
                                            <Input
                                                id="max_cost"
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={data.max_cost}
                                                onChange={(e) => setData('max_cost', e.target.value)}
                                                placeholder="0.00"
                                            />
                                            {errors.max_cost && (
                                                <p className="text-sm text-destructive">{errors.max_cost}</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ride & Route */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ride &amp; Route</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Leave blank if this is not a ride event.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="pace">Pace</Label>
                                <Input
                                    id="pace"
                                    value={data.pace}
                                    onChange={(e) => setData('pace', e.target.value)}
                                    placeholder="e.g. 28–32 km/h, A-grade, Social"
                                />
                                {errors.pace && (
                                    <p className="text-sm text-destructive">{errors.pace}</p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ride_distance_km">Distance (km)</Label>
                                    <Input
                                        id="ride_distance_km"
                                        type="number"
                                        min={0}
                                        step="0.1"
                                        value={data.ride_distance_km}
                                        onChange={(e) => setData('ride_distance_km', e.target.value)}
                                        placeholder="e.g. 120"
                                    />
                                    {errors.ride_distance_km && (
                                        <p className="text-sm text-destructive">{errors.ride_distance_km}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="elevation_gain_m">Elevation Gain (m)</Label>
                                    <Input
                                        id="elevation_gain_m"
                                        type="number"
                                        min={0}
                                        step="1"
                                        value={data.elevation_gain_m}
                                        onChange={(e) => setData('elevation_gain_m', e.target.value)}
                                        placeholder="e.g. 1500"
                                    />
                                    {errors.elevation_gain_m && (
                                        <p className="text-sm text-destructive">{errors.elevation_gain_m}</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="route_url">Route URL</Label>
                                <Input
                                    id="route_url"
                                    type="url"
                                    value={data.route_url}
                                    onChange={(e) => setData('route_url', e.target.value)}
                                    placeholder="e.g. https://www.strava.com/routes/..."
                                />
                                {errors.route_url && (
                                    <p className="text-sm text-destructive">{errors.route_url}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Route File</Label>
                                <GpxUpload
                                    hasRoute={event.has_route}
                                    routeGpxName={event.route_gpx_name}
                                    uploadRoute={`/events/${event.id}/route`}
                                    deleteRoute={`/events/${event.id}/route`}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={backHref}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
