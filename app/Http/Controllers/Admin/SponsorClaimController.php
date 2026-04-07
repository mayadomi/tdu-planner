<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveSponsorClaimRequest;
use App\Http\Requests\RejectSponsorClaimRequest;
use App\Models\Sponsor;
use App\Models\SponsorClaim;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SponsorClaimController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/sponsor-claims/index', [
            'claims' => SponsorClaim::with(['user', 'sponsor', 'verifiedBy'])
                ->pending()
                ->latest()
                ->get(),
            'pendingCount' => SponsorClaim::pending()->count(),
        ]);
    }

    public function approve(ApproveSponsorClaimRequest $request, SponsorClaim $sponsorClaim): RedirectResponse
    {
        if ($sponsorClaim->request_type === 'new_sponsor_request') {
            $name = $request->input('sponsor_name', $sponsorClaim->proposed_sponsor_name);
            $sponsor = Sponsor::create([
                'name' => $name,
                'slug' => Str::slug($name),
                'website' => $request->input('sponsor_website', $sponsorClaim->proposed_sponsor_website),
            ]);
            $sponsorClaim->sponsor_id = $sponsor->id;
            $sponsorClaim->save();
        }

        $sponsorClaim->approve($request->user());

        return back()->with('success', "Claim approved for {$sponsorClaim->user->name}.");
    }

    public function reject(RejectSponsorClaimRequest $request, SponsorClaim $sponsorClaim): RedirectResponse
    {
        $sponsorClaim->reject($request->user(), $request->input('admin_note'));

        return back()->with('success', 'Claim rejected.');
    }
}
