import { Head, router } from '@inertiajs/react';
import { Building2, CheckCircle, Clock, Tag, XCircle } from 'lucide-react';
import { useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { approve, reject } from '@/actions/App/Http/Controllers/Admin/SponsorClaimController';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Sponsor {
    id: number;
    name: string;
}

interface SponsorClaimRow {
    id: number;
    user: User;
    sponsor: Sponsor | null;
    request_type: 'claim_existing' | 'new_sponsor_request';
    editor_note: string | null;
    proposed_sponsor_name: string | null;
    proposed_sponsor_website: string | null;
    status: 'pending';
    created_at: string;
}

interface AdminSponsorClaimsProps {
    claims: SponsorClaimRow[];
    pendingCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/users' },
    { title: 'Sponsor Claims', href: '/admin/sponsor-claims' },
];

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminSponsorClaims({ claims, pendingCount }: AdminSponsorClaimsProps) {
    const [approvingClaim, setApprovingClaim] = useState<SponsorClaimRow | null>(null);
    const [rejectingClaim, setRejectingClaim] = useState<SponsorClaimRow | null>(null);
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorWebsite, setSponsorWebsite] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const openApprove = (claim: SponsorClaimRow) => {
        setApprovingClaim(claim);
        setSponsorName(claim.proposed_sponsor_name ?? '');
        setSponsorWebsite(claim.proposed_sponsor_website ?? '');
    };

    const openReject = (claim: SponsorClaimRow) => {
        setRejectingClaim(claim);
        setAdminNote('');
    };

    const submitApprove = () => {
        if (!approvingClaim) return;
        setSubmitting(true);
        router.post(approve({ sponsorClaim: approvingClaim.id }).url, {
            sponsor_name: approvingClaim.request_type === 'new_sponsor_request' ? sponsorName : undefined,
            sponsor_website: approvingClaim.request_type === 'new_sponsor_request' ? sponsorWebsite : undefined,
        }, {
            onSuccess: () => setApprovingClaim(null),
            onFinish: () => setSubmitting(false),
        });
    };

    const submitReject = () => {
        if (!rejectingClaim) return;
        setSubmitting(true);
        router.post(reject({ sponsorClaim: rejectingClaim.id }).url, {
            admin_note: adminNote || undefined,
        }, {
            onSuccess: () => setRejectingClaim(null),
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sponsor Claims | Admin" />

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Sponsor Claims</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review and approve editor sponsor associations.
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <Badge className="bg-amber-500 text-white">
                            <Clock className="mr-1 size-3" />
                            {pendingCount} pending
                        </Badge>
                    )}
                </div>

                {claims.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <CheckCircle className="mb-4 size-10 text-green-500/60" />
                            <h3 className="text-lg font-medium">All caught up</h3>
                            <p className="mt-1 text-sm text-muted-foreground">No pending sponsor claims to review.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {claims.map((claim) => (
                            <Card key={claim.id}>
                                <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        {claim.request_type === 'new_sponsor_request' ? (
                                            <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <Tag className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-medium">{claim.user.name}</span>
                                                <span className="text-xs text-muted-foreground">{claim.user.email}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {claim.request_type === 'claim_existing' ? 'Claim existing' : 'New sponsor'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {claim.request_type === 'claim_existing'
                                                    ? <>Claiming: <span className="font-medium text-foreground">{claim.sponsor?.name}</span></>
                                                    : <>Requesting: <span className="font-medium text-foreground">{claim.proposed_sponsor_name}</span>
                                                        {claim.proposed_sponsor_website && (
                                                            <span className="ml-1 text-xs">({claim.proposed_sponsor_website})</span>
                                                        )}
                                                    </>
                                                }
                                            </p>
                                            {claim.editor_note && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    "{claim.editor_note}"
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">Submitted {formatDate(claim.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 text-white hover:bg-green-700"
                                            onClick={() => openApprove(claim)}
                                        >
                                            <CheckCircle className="mr-1.5 size-3.5" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => openReject(claim)}
                                        >
                                            <XCircle className="mr-1.5 size-3.5" />
                                            Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Approve dialog */}
            <Dialog open={!!approvingClaim} onOpenChange={(open) => !open && setApprovingClaim(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve sponsor claim</DialogTitle>
                        <DialogDescription>
                            {approvingClaim?.request_type === 'new_sponsor_request'
                                ? 'Confirm the sponsor details below. A new sponsor record will be created.'
                                : `Verify that ${approvingClaim?.user.name} represents ${approvingClaim?.sponsor?.name}.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {approvingClaim?.request_type === 'new_sponsor_request' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-sponsor-name">Sponsor name</Label>
                                <Input
                                    id="new-sponsor-name"
                                    value={sponsorName}
                                    onChange={e => setSponsorName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-sponsor-website">Website</Label>
                                <Input
                                    id="new-sponsor-website"
                                    type="url"
                                    value={sponsorWebsite}
                                    onChange={e => setSponsorWebsite(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApprovingClaim(null)}>Cancel</Button>
                        <Button
                            className="bg-green-600 text-white hover:bg-green-700"
                            onClick={submitApprove}
                            disabled={submitting || (approvingClaim?.request_type === 'new_sponsor_request' && !sponsorName.trim())}
                        >
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject dialog */}
            <Dialog open={!!rejectingClaim} onOpenChange={(open) => !open && setRejectingClaim(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject sponsor claim</DialogTitle>
                        <DialogDescription>
                            Optionally leave a note explaining why the claim was rejected.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="admin-note">Note for editor <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea
                            id="admin-note"
                            placeholder="e.g. Could not verify your association with this sponsor."
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingClaim(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={submitReject} disabled={submitting}>
                            Reject claim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
