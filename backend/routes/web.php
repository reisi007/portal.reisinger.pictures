<?php

use IlluminateSupportFacadesRoute;
use AppHttpControllersFileDeliveryController;

// Zentraler und sicherer Auslieferungspunkt für Bilder
Route::get('/media/{slug}/{filename}', [FileDeliveryController::class, 'serve'])
    ->where('filename', '.*');
