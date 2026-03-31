import { router } from '@inertiajs/react';
import { Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { EventFilters as Filters } from '@/types/events';

interface Suggestion {
    id: number;
    title: string;
    category: string | null;
    start_date: string;
}

interface EventSearchProps {
    currentFilters: Filters;
    tduYear?: number;
    availableYears?: number[];
}

export function EventSearch({ currentFilters, tduYear, availableYears }: EventSearchProps) {
    const [query, setQuery] = useState(currentFilters.search ?? '');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keep input in sync when search is cleared externally (e.g. "Clear all" filters).
    useEffect(() => {
        setQuery(currentFilters.search ?? '');
    }, [currentFilters.search]);

    // Debounced typeahead fetch.
    useEffect(() => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsFetching(true);
            try {
                const res = await fetch(`/api/events/search?q=${encodeURIComponent(query.trim())}`);
                const data: Suggestion[] = await res.json();
                setSuggestions(data);
                setIsOpen(data.length > 0);
                setActiveIndex(-1);
            } finally {
                setIsFetching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown on outside click.
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navigate = useCallback((params: Filters) => {
        const clean: Record<string, unknown> = Object.fromEntries(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0))
                .map(([k, v]) => [k, v === true ? 1 : v]),
        );
        if (tduYear !== undefined && availableYears && tduYear !== availableYears[0]) {
            clean.year = tduYear;
        }
        router.get('/events', clean, { preserveState: true });
    }, [tduYear, availableYears]);

    const applySearch = useCallback((term: string) => {
        const trimmed = term.trim();
        setIsOpen(false);
        navigate({ ...currentFilters, search: trimmed || undefined });
    }, [currentFilters, navigate]);

    const clearSearch = useCallback(() => {
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        const { search: _, ...rest } = currentFilters;
        navigate(rest);
    }, [currentFilters, navigate]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    router.get(`/events/${suggestions[activeIndex].id}`);
                } else {
                    applySearch(query);
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, -1));
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder="Search events…"
                    className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {isFetching && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {!isFetching && query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
                    <ul role="listbox">
                        {suggestions.map((suggestion, i) => (
                            <li key={suggestion.id} role="option" aria-selected={i === activeIndex}>
                                <button
                                    type="button"
                                    className={cn(
                                        'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                                        i === activeIndex ? 'bg-accent' : 'hover:bg-accent',
                                    )}
                                    onMouseEnter={() => setActiveIndex(i)}
                                    onMouseLeave={() => setActiveIndex(-1)}
                                    onClick={() => router.get(`/events/${suggestion.id}`)}
                                >
                                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate font-medium">
                                        {suggestion.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {suggestion.start_date}
                                    </span>
                                    {suggestion.category && (
                                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                            {suggestion.category}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* "Search all" footer */}
                    <div className="border-t px-3 py-2">
                        <button
                            type="button"
                            className="w-full text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() => applySearch(query)}
                        >
                            Search all events for &ldquo;<span className="font-medium">{query}</span>&rdquo;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
