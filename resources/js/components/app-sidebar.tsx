import { Link, router, usePage } from '@inertiajs/react';
import { Building2, Calendar, CalendarClock, ClockAlert, Folder, Heart, LayoutGrid, Map, Monitor, Moon, NotebookPen, Plus, Settings, Shield, Sun, Users } from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { home, welcome } from '@/routes';
import type { NavItem, SharedData } from '@/types';

import AppLogo from './app-logo';

const publicNavItems: NavItem[] = [
    { title: 'Events',        href: '/events',    icon: Calendar },
    { title: 'Schedule',      href: '/schedule',  icon: CalendarClock },
    { title: 'Map',           href: '/map',       icon: Map },
    { title: 'My Favourites', href: '/favourites', icon: Heart },
];

const editorNavItems: NavItem[] = [
    { title: 'My Events',        href: '/profile/events',   icon: NotebookPen },
    { title: 'Create Event',     href: '/events/create',    icon: Plus },
    { title: 'My Event Hosts',   href: '/profile/sponsors', icon: Building2 },
];

const editorOnlyNavItems: NavItem[] = [
    { title: 'Manage Logos', href: '/sponsors', icon: Settings },
];

const adminNavItems: NavItem[] = [
    { title: 'Sponsors',        href: '/sponsors',              icon: Settings },
    { title: 'Users',           href: '/admin/users',           icon: Users },
    { title: 'Sponsor Claims',  href: '/admin/sponsor-claims',  icon: Building2 },
];

const footerNavItems: NavItem[] = [
    { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Folder },
];

const appearanceIcons = { light: Sun, dark: Moon, system: Monitor } as const;

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = auth?.user?.role;

    const homeHref = auth?.user ? welcome() : home();
    const mainNavItems: NavItem[] = [
        { title: 'Home', href: homeHref, icon: LayoutGrid },
        ...publicNavItems,
    ];
    const { appearance, updateAppearance } = useAppearance();
    const AppearanceIcon = appearanceIcons[appearance] ?? Monitor;

    const isEditor  = role === 'editor';
    const isAdmin   = role === 'admin';
    const isPending = role === 'editor_pending';
    const isViewer  = role === 'viewer';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main nav — visible to all authenticated users */}
                <NavMain items={mainNavItems} />

                {/* Editor section */}
                {(isEditor || isAdmin) && (
                    <>
                        <SidebarSeparator />
                        <NavMain items={[...editorNavItems, ...(isEditor ? editorOnlyNavItems : [])]} label="Editor" />
                    </>
                )}

                {/* Admin section */}
                {isAdmin && (
                    <>
                        <SidebarSeparator />
                        <NavMain items={adminNavItems} label="Admin">
                            {/* Pending editor requests badge */}
                        </NavMain>
                    </>
                )}

                {/* Request editor access — viewer only */}
                {isViewer && (
                    <>
                        <SidebarSeparator />
                        <SidebarMenu className="px-2 py-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => router.post('/profile/request-editor')}
                                    tooltip="Request editor access to create and manage events"
                                >
                                    <Shield className="size-4" />
                                    <span>Request Editor Access</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </>
                )}

                {/* Pending state — editor_pending */}
                {isPending && (
                    <>
                        <SidebarSeparator />
                        <SidebarMenu className="px-2 py-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => router.delete('/profile/request-editor')}
                                    tooltip="Your editor access request is pending admin approval"
                                    className="text-amber-600 hover:text-amber-700"
                                >
                                    <ClockAlert className="size-4" />
                                    <span>Editor Access Pending…</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />

                {/* Appearance toggle — uses SidebarMenuButton so it centres correctly when collapsed */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton tooltip="Toggle appearance">
                                    <AppearanceIcon className="size-4" />
                                    <span>Appearance</span>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="min-w-36">
                                <DropdownMenuItem onClick={() => updateAppearance('light')}>
                                    <Sun className="mr-2 size-4" /> Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppearance('dark')}>
                                    <Moon className="mr-2 size-4" /> Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateAppearance('system')}>
                                    <Monitor className="mr-2 size-4" /> System
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>

                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
