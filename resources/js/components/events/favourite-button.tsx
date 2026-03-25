import { router, usePage } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

interface FavouriteButtonProps {
    eventId: number;
    isFavourited?: boolean;
    size?: 'sm' | 'default';
    showLabel?: boolean;
    className?: string;
}

// Get CSRF token from cookie (Laravel stores it in XSRF-TOKEN cookie)
function getCsrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='));
    
    if (cookie) {
        // Cookie value is URL-encoded, so decode it
        return decodeURIComponent(cookie.split('=')[1]);
    }
    return '';
}

export function FavouriteButton({
    eventId,
    isFavourited: initialFavourited = false,
    size = 'sm',
    showLabel = false,
    className,
}: FavouriteButtonProps) {
    const { auth } = usePage<SharedData>().props;
    const [isFavourited, setIsFavourited] = useState(initialFavourited);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        if (!auth?.user) {
            // Redirect to login if not authenticated
            router.visit('/login');
            return;
        }

        setIsLoading(true);
        setIsFavourited(!isFavourited); // Optimistic update

        try {
            const response = await fetch(`/api/favourites/${eventId}/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'same-origin', // Include cookies
            });

            if (!response.ok) {
                // Revert on error
                setIsFavourited(isFavourited);
            } else {
                const data = await response.json();
                setIsFavourited(data.favourited);
            }
        } catch {
            // Revert on error
            setIsFavourited(isFavourited);
        } finally {
            setIsLoading(false);
        }
    };

    const button = (
        <Button
            variant={isFavourited ? 'default' : 'outline'}
            size={size === 'sm' ? 'icon' : 'default'}
            onClick={handleToggle}
            disabled={isLoading}
            className={cn(
                'transition-all',
                isFavourited && 'bg-red-500 text-white hover:bg-red-600',
                size === 'sm' && 'size-8',
                className,
            )}
        >
            <Heart
                className={cn(
                    'size-4 transition-transform',
                    isFavourited && 'fill-current',
                    isLoading && 'animate-pulse',
                )}
            />
            {showLabel && (
                <span className="ml-1">
                    {isFavourited ? 'Saved' : 'Save'}
                </span>
            )}
        </Button>
    );

    if (!showLabel) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent>
                        <p>{isFavourited ? 'Remove from favourites' : 'Add to favourites'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return button;
}
