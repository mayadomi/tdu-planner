import { router } from '@inertiajs/react';
import { Filter, Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import type { Category, EventFilters as Filters, Location, Tag } from '@/types/events';

interface EventFiltersProps {
    categories: Category[];
    locations: Location[];
    tags: Tag[];
    currentFilters: Filters;
    className?: string;
    onApply?: () => void;
    bare?: boolean;
}

export function EventFilters({
    categories,
    locations,
    tags,
    currentFilters,
    className,
    onApply,
    bare = false,
}: EventFiltersProps) {
    const [filters, setFilters] = useState<Filters>(currentFilters);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Keep local state in sync with server-returned filters after each navigation.
    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    const navigate = useCallback((updated: Filters) => {
        const params = Object.fromEntries(
            Object.entries(updated)
                .filter(([, v]) => v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0))
                .map(([k, v]) => [k, v === true ? 1 : v]),
        );
        setIsLoading(true);
        router.get('/events', params, {
            preserveState: true,
            onFinish: () => setIsLoading(false),
        });
        onApply?.();
    }, [onApply]);

    // For instant-apply controls (checkboxes, selects, tags).
    const updateAndApply = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
        const next = { ...filters, [key]: value };
        setFilters(next);
        navigate(next);
    }, [filters, navigate]);

    // For buffered inputs (date, number) — update local state only; call applyNow on blur.
    const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const applyNow = useCallback(() => {
        navigate(filters);
    }, [filters, navigate]);

    const toggleTag = useCallback((slug: string) => {
        const current = filters.tags ?? [];
        const next = current.includes(slug)
            ? current.filter(s => s !== slug)
            : [...current, slug];
        const updated = { ...filters, tags: next.length > 0 ? next : undefined };
        setFilters(updated);
        navigate(updated);
    }, [filters, navigate]);

    const resetFilters = useCallback(() => {
        setFilters({});
        setIsLoading(true);
        router.get('/events', {}, {
            preserveState: true,
            onFinish: () => setIsLoading(false),
        });
        onApply?.();
    }, [onApply]);

    // Exclude 'search' — it has its own dedicated search bar above the page
    const { search: _search, ...sidebarFilters } = currentFilters;
    const activeFilterCount = Object.values(sidebarFilters).filter(
        v => v !== undefined && v !== '' && v !== false,
    ).length;

    const clearAllButton = (
        <Button variant="outline" size="sm" onClick={resetFilters} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
                <RotateCcw className="mr-1.5 size-3.5" />
            )}
            Clear all
        </Button>
    );

    const filterContent = (
        <div className="space-y-6">
            {/* Quick Filters Row */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="free"
                        checked={filters.free ?? false}
                        onCheckedChange={(checked) => updateAndApply('free', checked as boolean)}
                    />
                    <Label htmlFor="free" className="cursor-pointer text-sm font-normal">
                        Free events only
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="featured"
                        checked={filters.featured ?? false}
                        onCheckedChange={(checked) => updateAndApply('featured', checked as boolean)}
                    />
                    <Label htmlFor="featured" className="cursor-pointer text-sm font-normal">
                        Featured
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="rides_only"
                        checked={filters.rides_only ?? false}
                        onCheckedChange={(checked) => updateAndApply('rides_only', checked as boolean)}
                    />
                    <Label htmlFor="rides_only" className="cursor-pointer text-sm font-normal">
                        Rides only
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="recurring"
                        checked={filters.recurring ?? false}
                        onCheckedChange={(checked) => updateAndApply('recurring', checked as boolean)}
                    />
                    <Label htmlFor="recurring" className="cursor-pointer text-sm font-normal">
                        Recurring
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="womens"
                        checked={filters.womens ?? false}
                        onCheckedChange={(checked) => updateAndApply('womens', checked as boolean)}
                    />
                    <Label htmlFor="womens" className="cursor-pointer text-sm font-normal">
                        Women's events
                    </Label>
                </div>
            </div>

            <Separator />

            {/* Category */}
            <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select
                    value={filters.category ?? '__all__'}
                    onValueChange={(value) => updateAndApply('category', value === '__all__' ? undefined : value)}
                >
                    <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>
                                {cat.name}
                                {cat.events_count !== undefined && (
                                    <span className="ml-1 text-muted-foreground">
                                        ({cat.events_count})
                                    </span>
                                )}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Select
                    value={filters.location?.toString() ?? '__all__'}
                    onValueChange={(value) => updateAndApply('location', value === '__all__' ? undefined : parseInt(value))}
                >
                    <SelectTrigger id="location" className="w-full">
                        <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All locations</SelectItem>
                        {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id.toString()}>
                                {loc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => {
                            const isActive = filters.tags?.includes(tag.slug) ?? false;
                            return (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.slug)}
                                    className={cn(
                                        'inline-flex cursor-pointer items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                                        isActive
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background text-foreground hover:bg-accent',
                                    )}
                                >
                                    {tag.name}
                                    {tag.events_count !== undefined && (
                                        <span className="ml-1 opacity-60">({tag.events_count})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Date Range */}
            <div className="space-y-4">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_date" className="text-xs text-muted-foreground">From</Label>
                        <Input
                            id="start_date"
                            type="date"
                            className="w-full"
                            value={filters.start_date ?? ''}
                            onChange={(e) => updateFilter('start_date', e.target.value || undefined)}
                            onBlur={applyNow}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end_date" className="text-xs text-muted-foreground">To</Label>
                        <Input
                            id="end_date"
                            type="date"
                            className="w-full"
                            value={filters.end_date ?? ''}
                            onChange={(e) => updateFilter('end_date', e.target.value || undefined)}
                            onBlur={applyNow}
                        />
                    </div>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <>
                    <Separator />

                    {/* Distance Range */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Distance (km)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_distance" className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                    id="min_distance"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={filters.min_distance ?? ''}
                                    onChange={(e) => updateFilter('min_distance', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    onBlur={applyNow}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_distance" className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                    id="max_distance"
                                    type="number"
                                    min="0"
                                    placeholder="Any"
                                    value={filters.max_distance ?? ''}
                                    onChange={(e) => updateFilter('max_distance', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    onBlur={applyNow}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Elevation Range */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Elevation (m)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_elevation" className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                    id="min_elevation"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={filters.min_elevation ?? ''}
                                    onChange={(e) => updateFilter('min_elevation', e.target.value ? parseInt(e.target.value) : undefined)}
                                    onBlur={applyNow}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_elevation" className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                    id="max_elevation"
                                    type="number"
                                    min="0"
                                    placeholder="Any"
                                    value={filters.max_elevation ?? ''}
                                    onChange={(e) => updateFilter('max_elevation', e.target.value ? parseInt(e.target.value) : undefined)}
                                    onBlur={applyNow}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cost Range */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Cost ($)</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_cost" className="text-xs text-muted-foreground">Min</Label>
                                <Input
                                    id="min_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    value={filters.min_cost ?? ''}
                                    onChange={(e) => updateFilter('min_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    onBlur={applyNow}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_cost" className="text-xs text-muted-foreground">Max</Label>
                                <Input
                                    id="max_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Any"
                                    value={filters.max_cost ?? ''}
                                    onChange={(e) => updateFilter('max_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    onBlur={applyNow}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Sort Options */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Sort</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sort" className="text-xs text-muted-foreground">Sort by</Label>
                                <Select
                                    value={filters.sort || 'date'}
                                    onValueChange={(value) => updateAndApply('sort', value as Filters['sort'])}
                                >
                                    <SelectTrigger id="sort">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="popularity">Popularity</SelectItem>
                                        <SelectItem value="cost">Cost</SelectItem>
                                        <SelectItem value="distance">Distance</SelectItem>
                                        <SelectItem value="elevation">Elevation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order" className="text-xs text-muted-foreground">Order</Label>
                                <Select
                                    value={filters.order || 'asc'}
                                    onValueChange={(value) => updateAndApply('order', value as Filters['order'])}
                                >
                                    <SelectTrigger id="order">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asc">Ascending</SelectItem>
                                        <SelectItem value="desc">Descending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Clear all — shown in bare mode only */}
            {bare && activeFilterCount > 0 && (
                <div className="pt-2">
                    {clearAllButton}
                </div>
            )}
        </div>
    );

    if (bare) {
        return <div className={className}>{filterContent}</div>;
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="size-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && clearAllButton}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-muted-foreground"
                        >
                            {isExpanded ? 'Less' : 'More'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filterContent}
            </CardContent>
        </Card>
    );
}
