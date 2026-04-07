<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSponsorClaimRequest;
use App\Models\Sponsor;
use App\Models\SponsorClaim;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileSponsorClaimController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('profile/sponsors', [
            'claims' => SponsorClaim::where('user_id', $request->user()->id)
                ->with('sponsor')
                ->latest()
                ->get(),
            'availableSponsors' => Sponsor::orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(StoreSponsorClaimRequest $request): RedirectResponse
    {
        SponsorClaim::create([
            'user_id' => $request->user()->id,
            'sponsor_id' => $request->input('sponsor_id'),
            'status' => 'pending',
            'request_type' => $request->input('request_type'),
            'editor_note' => $request->input('editor_note'),
            'proposed_sponsor_name' => $request->input('proposed_sponsor_name'),
            'proposed_sponsor_website' => $request->input('proposed_sponsor_website'),
        ]);

        return back()->with('success', 'Claim submitted. An admin will review it shortly.');
    }

    public function destroy(Request $request, SponsorClaim $sponsorClaim): RedirectResponse
    {
        if ($sponsorClaim->user_id !== $request->user()->id || $sponsorClaim->status !== 'pending') {
            abort(403);
        }

        $sponsorClaim->delete();

        return back()->with('success', 'Claim withdrawn.');
    }
}
