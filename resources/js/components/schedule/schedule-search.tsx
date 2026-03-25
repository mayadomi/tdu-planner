import { router } from '@inertiajs/react';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface Suggestion {
    id: number;
    title: string;
    category: string | null;
    start_date: string;
    date: string; // ISO YYYY-MM-DD for navigation
}

interface ScheduleSearchProps {
    selectedDate: string;
}

export function ScheduleSearch({ selectedDate }: ScheduleSearchProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const navigateTo = (suggestion: Suggestion) => {
        setQuery('');
        setIsOpen(false);
        router.get('/schedule', { date: suggestion.date, highlight: suggestion.id });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && suggestions[activeIndex]) {
                    navigateTo(suggestions[activeIndex]);
                } else if (suggestions.length > 0) {
                    navigateTo(suggestions[0]);
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
                setQuery('');
                inputRef.current?.blur();
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Input — styled for the orange header */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder="Find an event…"
                    className="w-full rounded-lg bg-white/20 py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/60 transition-colors focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                {isFetching && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/60" />
                )}
                {!isFetching && query && (
                    <button
                        type="button"
                        onClick={() => { setQuery(''); setIsOpen(false); }}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white"
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
                                    onClick={() => navigateTo(suggestion)}
                                >
                                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate font-medium">
                                        {suggestion.title}
                                    </span>
                                    <span className={cn(
                                        'shrink-0 text-xs',
                                        suggestion.date === selectedDate
                                            ? 'font-semibold text-orange-500'
                                            : 'text-muted-foreground',
                                    )}>
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
                </div>
            )}
        </div>
    );
}
