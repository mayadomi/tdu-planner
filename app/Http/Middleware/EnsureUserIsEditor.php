<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsEditor
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->canEditEvents()) {
            abort(403, 'Access denied. Editor role required.');
        }

        return $next($request);
    }
}
