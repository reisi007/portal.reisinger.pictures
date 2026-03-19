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
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $user = auth()->user();

        // Fotografen dürfen nur auf bestimmte Bereiche zugreifen
        if ($user->is_photographer && !$user->is_admin) {
            $allowedPrefixes = ['api/admin/galleries', 'api/admin/gallery-groups', 'api/admin/upload', 'api/admin/ftp'];
            $path = $request->path();
            $isAllowed = false;
            foreach ($allowedPrefixes as $prefix) {
                if (str_starts_with($path, $prefix)) {
                    $isAllowed = true; break;
                }
            }
            if (!$isAllowed) {
                 return response()->json(['error' => 'Zutritt verweigert. Nur für Administratoren.'], 403);
            }
            return $next($request);
        }

        if (!$user->is_admin) {
            return response()->json(['error' => 'Zutritt verweigert. Admin-Rechte erforderlich.'], 403);
        }

        return $next($request);
    }
}
