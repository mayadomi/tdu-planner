<?php

namespace App\Http\Controllers;

use App\Models\Sponsor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SponsorPageController extends Controller
{
    /**
     * List all sponsors for the editor management view.
     */
    public function index(): Response
    {
        $sponsors = Sponsor::withCount('events')
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id'                  => $s->id,
                'name'                => $s->name,
                'slug'                => $s->slug,
                'events_count'        => $s->events_count,
                'logo_square_url'      => $s->getFirstMediaUrl('logo_square', 'display'),
                'logo_square_dark_url' => $s->getFirstMediaUrl('logo_square_dark', 'display'),
                'logo_rect_url'        => $s->getFirstMediaUrl('logo_rect', 'display'),
                'logo_rect_dark_url'   => $s->getFirstMediaUrl('logo_rect_dark', 'display'),
            ]);

        return Inertia::render('sponsors/index', [
            'sponsors' => $sponsors,
        ]);
    }

    /**
     * Upload a sponsor image to the given collection (logo_square or logo_rect).
     */
    public function uploadImage(Request $request, Sponsor $sponsor, string $collection): RedirectResponse
    {
        abort_unless(in_array($collection, ['logo_square', 'logo_square_dark', 'logo_rect', 'logo_rect_dark'], true), 404);

        $request->validate([
            'image' => ['required', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp,svg'],
        ]);

        $sponsor->addMediaFromRequest('image')
            ->toMediaCollection($collection);

        return back()->with('success', 'Image updated.');
    }

    /**
     * Delete a sponsor image from the given collection.
     */
    public function deleteImage(Sponsor $sponsor, string $collection): RedirectResponse
    {
        abort_unless(in_array($collection, ['logo_square', 'logo_square_dark', 'logo_rect', 'logo_rect_dark'], true), 404);

        $sponsor->clearMediaCollection($collection);

        return back()->with('success', 'Image removed.');
    }
}
