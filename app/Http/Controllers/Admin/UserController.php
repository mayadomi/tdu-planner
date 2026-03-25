<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::orderByRaw("CASE role
                WHEN 'editor_pending' THEN 0
                WHEN 'admin'          THEN 1
                WHEN 'editor'         THEN 2
                ELSE 3 END")
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return Inertia::render('admin/users/index', [
            'users'        => $users,
            'pendingCount' => $users->where('role', 'editor_pending')->count(),
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'role' => ['required', Rule::in(['viewer', 'editor_pending', 'editor', 'admin'])],
        ]);

        // Prevent admins from removing their own admin role
        if ($user->id === $request->user()->id && $request->input('role') !== 'admin') {
            return back()->withErrors(['role' => 'You cannot change your own admin role.']);
        }

        $user->update(['role' => $request->input('role')]);

        return back()->with('success', "Role updated to {$request->input('role')} for {$user->name}.");
    }
}
