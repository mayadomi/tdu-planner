<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProfileEditorRequestController extends Controller
{
    /**
     * Submit a request for editor access (viewer → editor_pending).
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->role !== 'viewer') {
            return back()->withErrors(['role' => 'Only viewers can request editor access.']);
        }

        $user->update(['role' => 'editor_pending']);

        return back()->with('success', 'Your editor access request has been submitted. An admin will review it shortly.');
    }

    /**
     * Cancel a pending editor request (editor_pending → viewer).
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->role !== 'editor_pending') {
            return back();
        }

        $user->update(['role' => 'viewer']);

        return back()->with('success', 'Editor access request cancelled.');
    }
}
