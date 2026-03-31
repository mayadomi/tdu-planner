import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, ExternalLink, Layers, MapPin, Mountain, Route, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { Layer, Map as MapGL, Marker, Popup, Source } from 'react-map-gl/maplibre';

import { FavouriteButton } from '@/components/events/favourite-button';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapEvent {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    category_slug: string;
    category_name: string;
    url: string | null;
    ride_distance_km: number | null;
    elevation_gain_m: number | null;
    is_featured: boolean;
    route_geojson: GeoJSON.FeatureCollection | null;
    sponsor_logo_url: string | null;
    sponsor_logo_dark_url: string | null;
    is_favourited: boolean;
}

interface MapMarker {
    location_id: number;
    location_name: string;
    latitude: number;
    longitude: number;
    events: MapEvent[];
}

interface MapIndexProps {
    markers: MapMarker[];
    selectedDate: string;
    availableDates: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const MAP_STYLE_LIGHT = `https://api.maptiler.com/maps/019d2f2b-b1d3-7ba1-8984-4301aab9b7f8/style.json?key=${MAPTILER_KEY ?? ''}`;
const MAP_STYLE_DARK  = `https://api.maptiler.com/maps/019d3df5-9af4-73ae-a327-71e87f370058/style.json?key=${MAPTILER_KEY ?? ''}`;

// Default view centred on the Adelaide region
const DEFAULT_VIEW = { longitude: 138.5999, latitude: -34.9281, zoom: 11 };

const CATEGORY_COLORS: Record<string, string> = {
    'race-stages':     'bg-blue-600',
    'official-events': 'bg-violet-600',
    'watch-parties':   'bg-sky-500',
    'group-rides':     'bg-orange-500',
    'local-racing':    'bg-purple-500',
    'pop-up':          'bg-rose-400',
    'expo':            'bg-teal-500',
    'pop-ups':         'bg-cyan-500',
    'team-meets':      'bg-indigo-500',
    'food-wine':       'bg-amber-500',
    'entertainment':   'bg-pink-500',
    'podcast':         'bg-lime-600',
    'other':           'bg-gray-500',
};

function getCategoryColor(slug: string): string {
    return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS['other'];
}

// Hex colours for MapLibre line layers (mirrors CATEGORY_COLORS above)
const CATEGORY_LINE_COLORS: Record<string, string> = {
    'race-stages':     '#2563eb',
    'official-events': '#7c3aed',
    'watch-parties':   '#0ea5e9',
    'group-rides':     '#f97316',
    'local-racing':    '#a855f7',
    'pop-up':          '#fb7185',
    'expo':            '#14b8a6',
    'pop-ups':         '#06b6d4',
    'team-meets':      '#6366f1',
    'food-wine':       '#f59e0b',
    'entertainment':   '#ec4899',
    'podcast':         '#65a30d',
    'other':           '#6b7280',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Datetimes are stored as Adelaide local time but sent with +00:00, so read
// the HH:MM characters directly to avoid browser-timezone conversion.
function formatTime(iso: string): string {
    return iso.substring(11, 16);
}

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

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Map', href: '/map' }];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapIndex({ markers, selectedDate, availableDates }: MapIndexProps) {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<MapEvent[]>([]);
    const [popupLngLat, setPopupLngLat] = useState<{ longitude: number; latitude: number } | null>(null);
    const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
    const [cursor, setCursor] = useState<string>('auto');
    const selectedDateRef = useRef<HTMLButtonElement>(null);
    const dateScrollRef = useRef<HTMLDivElement>(null);
    const dateScrollMounted = useRef(false);

    // Build a single GeoJSON FeatureCollection from all events that have routes
    const routeCollection = useMemo<GeoJSON.FeatureCollection>(() => {
        const features: GeoJSON.Feature[] = markers.flatMap((marker) =>
            marker.events
                .filter((e) => e.route_geojson !== null)
                .flatMap((e) =>
                    (e.route_geojson!.features ?? []).map((f) => ({
                        ...f,
                        properties: {
                            ...f.properties,
                            event_id: String(e.id),
                            color: CATEGORY_LINE_COLORS[e.category_slug] ?? CATEGORY_LINE_COLORS['other'],
                        },
                    })),
                ),
        );
        return { type: 'FeatureCollection', features };
    }, [markers]);

    // Fast event_id → MapEvent lookup for line-click handling
    const eventIdToEvent = useMemo(() => {
        const map = new globalThis.Map<number, MapEvent>();
        for (const marker of markers) {
            for (const event of marker.events) {
                map.set(event.id, event);
            }
        }
        return map;
    }, [markers]);

    // IDs of events whose route lines are currently highlighted
    const selectedEventIds = useMemo(() => selectedEvents.map((e) => e.id), [selectedEvents]);

    // Separate GeoJSON collection for just the hovered event's route —
    // updating this source is fully React-driven, no imperative map calls needed.
    const hoveredRouteCollection = useMemo<GeoJSON.FeatureCollection>(() => {
        if (hoveredEventId === null) {
            return { type: 'FeatureCollection', features: [] };
        }
        const features: GeoJSON.Feature[] = markers.flatMap((marker) =>
            marker.events
                .filter((e) => e.id === hoveredEventId && e.route_geojson !== null)
                .flatMap((e) =>
                    (e.route_geojson!.features ?? []).map((f) => ({
                        ...f,
                        properties: { ...f.properties, event_id: String(e.id) },
                    })),
                ),
        );
        return { type: 'FeatureCollection', features };
    }, [hoveredEventId, markers]);

    // Only show legend entries for categories present on this day
    const visibleCategories = useMemo(() => {
        const seen = new globalThis.Map<string, string>();
        for (const marker of markers) {
            for (const event of marker.events) {
                if (!seen.has(event.category_slug)) {
                    seen.set(event.category_slug, event.category_name);
                }
            }
        }
        return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
    }, [markers]);

    // Clicking near route line(s) — query all features within 6px tolerance
    const handleMapClick = useCallback(
        (e: MapLayerMouseEvent) => {
            const TOLERANCE = 6;
            const bbox = [
                [e.point.x - TOLERANCE, e.point.y - TOLERANCE],
                [e.point.x + TOLERANCE, e.point.y + TOLERANCE],
            ] as [[number, number], [number, number]];

            const features = e.target.queryRenderedFeatures(bbox, { layers: ['route-lines'] });

            // Deduplicate by event_id, preserving order
            const seen = new globalThis.Set<number>();
            const events: MapEvent[] = [];
            for (const f of features) {
                const eventId = f.properties?.event_id != null ? Number(f.properties.event_id) : undefined;
                if (eventId !== undefined && !seen.has(eventId)) {
                    seen.add(eventId);
                    const event = eventIdToEvent.get(eventId);
                    if (event) events.push(event);
                }
            }

            setSelectedMarker(null);

            if (events.length > 0) {
                setPopupLngLat({ longitude: e.lngLat.lng, latitude: e.lngLat.lat });
            } else {
                setPopupLngLat(null);
            }

            // Toggle: re-clicking the same highlighted line(s) deselects
            setSelectedEvents((prev) => {
                if (events.length === 0) return [];
                const sameSelection =
                    prev.length === events.length &&
                    events.every((ev) => prev.some((p) => p.id === ev.id));
                return sameSelection ? [] : events;
            });
        },
        [eventIdToEvent],
    );

    const currentDateIndex = availableDates.indexOf(selectedDate);
    const hasPrevDate = currentDateIndex > 0;
    const hasNextDate = currentDateIndex < availableDates.length - 1;

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!dateScrollMounted.current) {
            dateScrollMounted.current = true;
            if (dateScrollRef.current) dateScrollRef.current.scrollLeft = 0;
            return;
        }
        selectedDateRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [selectedDate]);

    // Keep selected date pill in view when the container resizes (e.g. desktop → mobile)
    useEffect(() => {
        const container = dateScrollRef.current;
        if (!container) return;
        const observer = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                selectedDateRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const navigateToDate = useCallback((date: string) => {
        setSelectedMarker(null);
        setSelectedEvents([]);
        setPopupLngLat(null);
        router.get('/map', { date }, { preserveState: true });
    }, []);

    const goToPrevDate = () => {
        if (hasPrevDate) navigateToDate(availableDates[currentDateIndex - 1]);
    };

    const goToNextDate = () => {
        if (hasNextDate) navigateToDate(availableDates[currentDateIndex + 1]);
    };

    const closeRoutePopup = useCallback(() => {
        setSelectedEvents([]);
        setPopupLngLat(null);
        setHoveredEventId(null);
    }, []);

    const closeMarkerPopup = useCallback(() => {
        setSelectedMarker(null);
        setHoveredEventId(null);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Map | TDU Planner" />

            <div className="flex min-h-0 flex-1 flex-col">
                {/* Header — matches schedule page style */}
                <div className="shrink-0 border-b bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-3 text-white sm:px-4 sm:py-4">

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

                        <div ref={dateScrollRef} className="scrollbar-none min-w-0 flex-1 overflow-x-auto">
                            <div className="mx-auto flex w-fit gap-1">
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

                    <p className="mt-1 text-center text-xs text-white/80 sm:mt-2 sm:text-sm">
                        {formatDateFull(selectedDate)}
                    </p>
                </div>

                {/* Map */}
                <div className="relative min-h-0 flex-1">
                    {MAPTILER_KEY ? (
                        <MapGL
                            initialViewState={DEFAULT_VIEW}
                            minZoom={8}
                            style={{ width: '100%', height: '100%' }}
                            mapStyle={isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
                            interactiveLayerIds={['route-lines', 'route-lines-casing']}
                            cursor={cursor}
                            onClick={handleMapClick}
                            onMouseMove={(e) => setCursor(e.features?.length ? 'pointer' : 'auto')}
                        >
                            {/* Route polylines — rendered below markers */}
                            {routeCollection.features.length > 0 && (
                                <Source id="routes" type="geojson" data={routeCollection}>
                                    {/* Base casing */}
                                    <Layer
                                        id="route-lines-casing"
                                        type="line"
                                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                        paint={{
                                            'line-color': '#ffffff',
                                            'line-width': 5,
                                            'line-opacity': isDark ? 0 : selectedEventIds.length > 0 ? 0.15 : 0.6,
                                        }}
                                    />
                                    {/* Base lines */}
                                    <Layer
                                        id="route-lines"
                                        type="line"
                                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                        paint={{
                                            'line-color': ['get', 'color'],
                                            'line-width': 3,
                                            'line-opacity': hoveredEventId !== null ? 0.3 : selectedEventIds.length > 0 ? 0.2 : 0.85,
                                        }}
                                    />
                                    {/* Highlight casing for selected lines */}
                                    <Layer
                                        id="route-lines-highlight-casing"
                                        type="line"
                                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                        paint={{ 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': isDark ? 0 : 0.75 }}
                                        filter={['match', ['get', 'event_id'], selectedEventIds.length > 0 ? selectedEventIds.map(String) : ['-1'], true, false]}
                                    />
                                    {/* Highlight lines for selected events */}
                                    <Layer
                                        id="route-lines-highlight"
                                        type="line"
                                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                        paint={{ 'line-color': ['get', 'color'], 'line-width': 5, 'line-opacity': 1 }}
                                        filter={['match', ['get', 'event_id'], selectedEventIds.length > 0 ? selectedEventIds.map(String) : ['-1'], true, false]}
                                    />
                                </Source>
                            )}

                            {/* Hover highlight — separate source, fully React-driven */}
                            <Source id="hover-route" type="geojson" data={hoveredRouteCollection}>
                                <Layer
                                    id="route-lines-hover-casing"
                                    type="line"
                                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                    paint={{ 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': isDark ? 0 : 0.6 }}
                                />
                                <Layer
                                    id="route-lines-hover"
                                    type="line"
                                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                    paint={{ 'line-color': '#22c55e', 'line-width': 5, 'line-opacity': 1 }}
                                />
                            </Source>

                            {markers.map((marker) => (
                                <Marker
                                    key={marker.location_id}
                                    longitude={marker.longitude}
                                    latitude={marker.latitude}
                                    anchor="bottom"
                                    onClick={(e) => {
                                        e.originalEvent.stopPropagation();
                                        setSelectedEvents([]);
                                        setPopupLngLat(null);
                                        setSelectedMarker(
                                            selectedMarker?.location_id === marker.location_id
                                                ? null
                                                : marker,
                                        );
                                    }}
                                >
                                    <MarkerPin
                                        marker={marker}
                                        isSelected={selectedMarker?.location_id === marker.location_id}
                                        isHovered={hoveredEventId !== null && marker.events.some((e) => e.id === hoveredEventId)}
                                    />
                                </Marker>
                            ))}

                            {/* Marker popup */}
                            {selectedMarker && selectedEvents.length === 0 && (
                                <Popup
                                    longitude={selectedMarker.longitude}
                                    latitude={selectedMarker.latitude}
                                    anchor="bottom"
                                    offset={16}
                                    onClose={closeMarkerPopup}
                                    closeButton={false}
                                    closeOnClick={false}
                                    maxWidth="min(320px, calc(100vw - 32px))"
                                    className="[&_.maplibregl-popup-content]:!bg-transparent [&_.maplibregl-popup-content]:!p-0 [&_.maplibregl-popup-content]:!shadow-none [&_.maplibregl-popup-tip]:!hidden"
                                >
                                    <MapPopup
                                        title={selectedMarker.location_name}
                                        subtitle="Location"
                                        events={selectedMarker.events}
                                        onClose={closeMarkerPopup}
                                        onEventHover={setHoveredEventId}
                                    />
                                </Popup>
                            )}

                            {/* Route popup */}
                            {selectedEvents.length > 0 && popupLngLat && (
                                <Popup
                                    longitude={popupLngLat.longitude}
                                    latitude={popupLngLat.latitude}
                                    anchor="bottom"
                                    offset={16}
                                    onClose={closeRoutePopup}
                                    closeButton={false}
                                    closeOnClick={false}
                                    maxWidth="min(320px, calc(100vw - 32px))"
                                    className="[&_.maplibregl-popup-content]:!bg-transparent [&_.maplibregl-popup-content]:!p-0 [&_.maplibregl-popup-content]:!shadow-none [&_.maplibregl-popup-tip]:!hidden"
                                >
                                    <MapPopup
                                        title={
                                            selectedEvents.length === 1
                                                ? selectedEvents[0].title
                                                : `${selectedEvents.length} results found`
                                        }
                                        subtitle={(() => {
                                            const unique = [...new Set(selectedEvents.map((e) => e.category_name))];
                                            return unique.length === 1 ? unique[0] : 'Multiple categories';
                                        })()}
                                        events={selectedEvents}
                                        onClose={closeRoutePopup}
                                        onEventHover={setHoveredEventId}
                                        showHeader={selectedEvents.length > 1}
                                    />
                                </Popup>
                            )}
                        </MapGL>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-muted/30">
                            <div className="text-center">
                                <MapPin className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                                <p className="font-medium">Map key not configured</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add <code className="rounded bg-muted px-1">VITE_MAPTILER_KEY</code> to your{' '}
                                    <code className="rounded bg-muted px-1">.env</code> file.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Category legend */}
                    {visibleCategories.length > 0 && MAPTILER_KEY && (
                        <MapLegend categories={visibleCategories} />
                    )}

                    {/* No events message */}
                    {markers.length === 0 && MAPTILER_KEY && (
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
                            <div className="rounded-lg bg-white/90 px-4 py-3 shadow-md dark:bg-gray-800/90">
                                <p className="text-sm font-medium">No events with locations on this day</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend({ categories }: { categories: { slug: string; name: string }[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="absolute bottom-8 left-3">
            {open ? (
                <div className="max-h-64 overflow-y-auto rounded-lg border bg-background/90 p-3 shadow-lg backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Categories
                        </p>
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Close legend"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {categories.map(({ slug, name }) => (
                            <div key={slug} className="flex items-center gap-2">
                                <div
                                    className="size-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: CATEGORY_LINE_COLORS[slug] ?? CATEGORY_LINE_COLORS['other'] }}
                                />
                                <span className="text-xs">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border bg-background/90 px-2.5 py-2 shadow-lg backdrop-blur-sm hover:bg-background"
                    aria-label="Show legend"
                >
                    <Layers className="size-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Legend</span>
                </button>
            )}
        </div>
    );
}

// ─── Marker pin ───────────────────────────────────────────────────────────────

function MarkerPin({ marker, isSelected, isHovered }: { marker: MapMarker; isSelected: boolean; isHovered: boolean }) {
    const primarySlug = marker.events[0]?.category_slug ?? 'other';
    const color = getCategoryColor(primarySlug);
    const count = marker.events.length;

    return (
        <div className="flex cursor-pointer flex-col items-center">
            <div
                className={cn(
                    'flex min-w-[32px] items-center justify-center rounded-full px-2 py-1 text-xs font-bold text-white shadow-lg ring-2 transition-transform',
                    color,
                    isSelected ? 'scale-110 ring-white' : isHovered ? 'scale-110 ring-white' : 'ring-white/60 hover:scale-105',
                )}
            >
                {count > 1 ? count : <MapPin className="size-3.5" />}
            </div>
            {/* Pointer triangle */}
            <div
                className={cn('size-0 border-x-4 border-t-8 border-x-transparent', {
                    'border-t-blue-600':   primarySlug === 'race-stages',
                    'border-t-violet-600': primarySlug === 'official-events',
                    'border-t-sky-500':    primarySlug === 'watch-parties',
                    'border-t-orange-500': primarySlug === 'group-rides',
                    'border-t-purple-500': primarySlug === 'local-racing',
                    'border-t-rose-400':   primarySlug === 'pop-up',
                    'border-t-teal-500':   primarySlug === 'expo',
                    'border-t-cyan-500':   primarySlug === 'pop-ups',
                    'border-t-indigo-500': primarySlug === 'team-meets',
                    'border-t-amber-500':  primarySlug === 'food-wine',
                    'border-t-pink-500':   primarySlug === 'entertainment',
                    'border-t-lime-600':   primarySlug === 'podcast',
                    'border-t-gray-500':   !CATEGORY_COLORS[primarySlug],
                })}
            />
        </div>
    );
}

// ─── Map popup ────────────────────────────────────────────────────────────────

function MapPopup({
    title,
    subtitle,
    events,
    onClose,
    onEventHover,
    showHeader = true,
}: {
    title: string;
    subtitle: string;
    events: MapEvent[];
    onClose: () => void;
    onEventHover: (id: number | null) => void;
    showHeader?: boolean;
}) {
    return (
        <div className="relative flex max-h-80 w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/8 dark:bg-zinc-900 dark:ring-white/10">
            {showHeader && (
                <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
                    <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {subtitle}
                        </p>
                        <p className="truncate text-sm font-semibold leading-snug">{title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto">
                {events.map((event, i) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        onEventHover={onEventHover}
                        onClose={!showHeader && i === 0 ? onClose : undefined}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
    event,
    onEventHover,
    onClose,
}: {
    event: MapEvent;
    onEventHover?: (id: number | null) => void;
    onClose?: () => void;
}) {
    const hexColor = CATEGORY_LINE_COLORS[event.category_slug] ?? CATEGORY_LINE_COLORS['other'];

    return (
        <div
            className="flex border-b last:border-0"
            onMouseEnter={() => onEventHover?.(event.id)}
            onMouseLeave={() => onEventHover?.(null)}
        >
            {/* Left: sponsor logo */}
            <div className="flex w-16 shrink-0 items-center justify-center">
                {event.sponsor_logo_url && (
                    <>
                        <img
                            src={event.sponsor_logo_url}
                            alt=""
                            className="size-12 object-contain p-1 dark:hidden"
                        />
                        <img
                            src={event.sponsor_logo_dark_url ?? event.sponsor_logo_url}
                            alt=""
                            className="hidden size-12 object-contain p-1 dark:block"
                        />
                    </>
                )}
            </div>

            {/* Centre: content */}
            <div className="min-w-0 flex-1 py-2.5 pr-2.5">
                <Link
                    href={`/events/${event.id}`}
                    className="block text-sm font-medium leading-snug hover:underline"
                >
                    {event.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTime(event.start_datetime)} – {formatTime(event.end_datetime)}
                    </span>
                    {event.ride_distance_km && (
                        <span className="flex items-center gap-1">
                            <Route className="size-3" />
                            {event.ride_distance_km} km
                        </span>
                    )}
                    {event.elevation_gain_m && (
                        <span className="flex items-center gap-1">
                            <Mountain className="size-3" />
                            {event.elevation_gain_m} m
                        </span>
                    )}
                </div>
            </div>

            {/* Right: close + favourite + external link stacked in category-coloured panel */}
            <div className="flex w-10 shrink-0 flex-col" style={{ backgroundColor: hexColor }}>
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="flex flex-1 items-center justify-center hover:brightness-90"
                    >
                        <X className="size-4 stroke-[2.5] text-white" />
                    </button>
                )}
                <div className="flex flex-1 items-center justify-center">
                    <FavouriteButton
                        eventId={event.id}
                        isFavourited={event.is_favourited}
                        className="border-0 bg-transparent text-white shadow-none hover:bg-white/20 hover:text-white"
                    />
                </div>
                {event.url && (
                    <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center hover:brightness-90"
                    >
                        <ExternalLink className="size-5 stroke-[2.5] text-white" />
                    </a>
                )}
            </div>
        </div>
    );
}
