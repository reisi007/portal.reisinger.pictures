<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileDeliveryController;

// Zentraler und sicherer Auslieferungspunkt für Bilder
Route::get('/media/{slug}/{filename}', [FileDeliveryController::class, 'serve'])
    ->where('filename', '.*');