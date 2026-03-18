<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Prüfen, ob ein validierter User existiert und er ein Admin ist
        if (!auth()->check() || !auth()->user()->is_admin) {
            return response()->json(['error' => 'Zutritt verweigert. Admin-Rechte erforderlich.'], 403);
        }

        return $next($request);
    }
}
