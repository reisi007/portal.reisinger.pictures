<?php

use Illuminate\Support\Facades\Route;

// Wir entfernen Route::get('/', ...) komplett, da die 'web' Middleware-Gruppe 
// sonst bei jedem Ping unnötig Boot-Prozesse (wie Cookies/Sessions) startet. 
// Das Backend ist ohnehin nur eine API.

// Lokaler Datei-Server für Herd. 
// In Produktion übernimmt das Nginx, deshalb binden wir es an lokale Umgebungen.
if (env('APP_ENV') === 'local' || env('APP_DEBUG') === true) {
    Route::get('/photos/{slug}/{filename}', function($slug, $filename) {
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $path = $baseStoragePath . '/' . $slug . '/' . $filename;
        
        if (!file_exists($path)) {
            abort(404);
        }
        
        $mime = mime_content_type($path);
        return response()->file($path, ['Content-Type' => $mime]);
    })->where('filename', '.*');
}
