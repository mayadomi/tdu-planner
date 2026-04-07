import { router } from '@inertiajs/react';
import { Building2, CheckCircle, Clock, Plus, Tag, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { destroy, store } from '@/actions/App/Http/Controllers/ProfileSponsorClaimController';
import type { BreadcrumbItem } from '@/types';

interface Sponsor {
    id: number;
    name: string;
    slug: string;
}

interface SponsorClaim {
    id: number;
    sponsor_id: number | null;
    sponsor: Sponsor | null;
    status: 'pending' | 'verified' | 'rejected';
    request_type: 'claim_existing' | 'new_sponsor_request';
    editor_note: string | null;
    admin_note: string | null;
    proposed_sponsor_name: string | null;
    proposed_sponsor_website: string | null;
    verified_at: string | null;
    created_at: string;
}

interface ProfileSponsorsProps {
    claims: SponsorClaim[];
    availableSponsors: Sponsor[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/profile' },
    { title: 'My Event Hosts', href: '/profile/sponsors' },
];

const statusBadge = (status: SponsorClaim['status']) => {
    switch (status) {
        case 'verified':
            return <Badge className="bg-green-500 text-white"><CheckCircle className="mr-1 size-3" />Verified</Badge>;
        case 'pending':
            return <Badge className="bg-amber-500 text-white"><Clock className="mr-1 size-3" />Pending review</Badge>;
        case 'rejected':
            return <Badge className="bg-red-500 text-white"><XCircle className="mr-1 size-3" />Rejected</Badge>;
    }
};

export default function ProfileSponsors({ claims, availableSponsors }: ProfileSponsorsProps) {
    const [claimSponsorId, setClaimSponsorId] = useState('');
    const [claimNote, setClaimNote] = useState('');
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorWebsite, setSponsorWebsite] = useState('');
    const [newSponsorNote, setNewSponsorNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitClaim = (requestType: 'claim_existing' | 'new_sponsor_request') => {
        setSubmitting(true);
        router.post(store().url, {
            request_type: requestType,
            sponsor_id: requestType === 'claim_existing' ? claimSponsorId : undefined,
            editor_note: requestType === 'claim_existing' ? claimNote : newSponsorNote,
            proposed_sponsor_name: requestType === 'new_sponsor_request' ? sponsorName : undefined,
            proposed_sponsor_website: requestType === 'new_sponsor_request' ? sponsorWebsite : undefined,
        }, {
            onSuccess: () => {
                setClaimSponsorId('');
                setClaimNote('');
                setSponsorName('');
                setSponsorWebsite('');
                setNewSponsorNote('');
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const withdrawClaim = (claimId: number) => {
        router.delete(destroy({ sponsorClaim: claimId }).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        title="Event Hosts"
                        description="You can create events on behalf of clubs, businesses or other entities - but to do so
                        you need to be associated with them through this platform. The status of your associations
                        are shown below."
                    />

                    <p className="text-sm text-muted-foreground">
                        If you have any queries, please contact us at{' '}
                        <a href="mailto:info@tdu-planner.com.au" className="text-foreground underline underline-offset-4 hover:text-primary">
                            info@tdu-planner.com.au
                        </a>
                    </p>

                    {/* Existing claims */}
                    {claims.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {claims.map((claim) => (
                                <Card key={claim.id} className="gap-0 py-0">
                                    <div className="flex items-start justify-between gap-3 px-4 py-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-medium">
                                                        {claim.sponsor?.name ?? claim.proposed_sponsor_name}
                                                    </p>
                                                    {statusBadge(claim.status)}
                                                </div>
                                                {claim.editor_note && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Your note: {claim.editor_note}
                                                    </p>
                                                )}
                                                {claim.admin_note && claim.status === 'rejected' && (
                                                    <p className="text-xs text-destructive">
                                                        Admin note: {claim.admin_note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {claim.status === 'pending' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => withdrawClaim(claim.id)}
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">Withdraw</span>
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    <Separator />

                    {/* Add new association */}
                    <div className="flex flex-col gap-5">
                        <h3 className="text-sm font-medium">Claim or add a new event host</h3>

                        <Tabs defaultValue="claim_existing">
                            <TabsList>
                                <TabsTrigger value="claim_existing">
                                    <Tag className="mr-2 size-4" />
                                    Claim existing event host
                                </TabsTrigger>
                                <TabsTrigger value="new_sponsor_request">
                                    <Plus className="mr-2 size-4" />
                                    Request new event host
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="claim_existing" className="mt-4 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Claim an existing event host</CardTitle>
                                        <CardDescription>
                                            Represent one of the sponsors, businesses, clubs, or other organising entities 
                                            already in the system? Select the one you represent below to be linked to it and 
                                            to be able to create events under its banner. 
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-5">
                                        <p className="text-sm text-muted-foreground">
                                            If your club/business/entity is not in the list, you can submit a request to have it added using the 
                                            toggle/button above.
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="sponsor-select">Find your event host:</Label>
                                            <Select value={claimSponsorId} onValueChange={setClaimSponsorId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a host" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSponsors.map(s => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                    {availableSponsors.length === 0 && (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground">No organising bodies found</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="claim-note">Note <span className="text-muted-foreground">(optional)</span></Label>
                                            <Textarea
                                                id="claim-note"
                                                placeholder="Briefly describe your role with this event host…"
                                                value={claimNote}
                                                onChange={e => setClaimNote(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => submitClaim('claim_existing')}
                                            disabled={!claimSponsorId || submitting}
                                        >
                                            Submit claim
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="new_sponsor_request" className="mt-4 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Request a new organising body</CardTitle>
                                        <CardDescription>
                                            If your organising body isn't in the system yet, submit a request here to have it added.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-5">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="sponsor-name">Name <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="sponsor-name"
                                                placeholder="e.g. Pedal Adelaide"
                                                value={sponsorName}
                                                onChange={e => setSponsorName(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="sponsor-website">Website <span className="text-muted-foreground">(optional)</span></Label>
                                            <Input
                                                id="sponsor-website"
                                                type="url"
                                                placeholder="https://example.com"
                                                value={sponsorWebsite}
                                                onChange={e => setSponsorWebsite(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="new-sponsor-note">Note <span className="text-muted-foreground">(optional)</span></Label>
                                            <Textarea
                                                id="new-sponsor-note"
                                                placeholder="Describe your role and why this organising body should be added…"
                                                value={newSponsorNote}
                                                onChange={e => setNewSponsorNote(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => submitClaim('new_sponsor_request')}
                                            disabled={!sponsorName.trim() || submitting}
                                        >
                                            Submit request
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
