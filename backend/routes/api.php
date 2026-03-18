<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\GalleryFrontendController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\InviteController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\NotificationController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/ping', function() { return response()->json(['message' => 'API OK']); });

Route::get('/invites/{token}', [InviteController::class, 'check']);
Route::post('/invites/redeem', [InviteController::class, 'redeem']);

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/photos/{id}/context', [SearchController::class, 'photoContext']);

    Route::get('/galleries/{slug}', [GalleryFrontendController::class, 'show']);
    Route::post('/photos/{photoId}/rate', [GalleryFrontendController::class, 'rate']);

    Route::get('/photos/{photoId}/download', [DownloadController::class, 'downloadSingle']);
    Route::get('/galleries/{galleryId}/download-zip', [DownloadController::class, 'downloadZip']);
});

Route::middleware(['auth:api', 'admin'])->group(function () {
    Route::get('/admin/galleries', [GalleryController::class, 'indexAdmin']);
    Route::post('/admin/gallery-groups', [GalleryController::class, 'storeGroup']);
    Route::post('/admin/galleries', [GalleryController::class, 'storeGallery']);
    Route::delete('/admin/galleries/{id}', [GalleryController::class, 'destroyGallery']);
    Route::get('/admin/galleries/{id}/export', [GalleryController::class, 'exportRatings']);
    Route::post('/admin/galleries/{id}/invites', [InviteController::class, 'generate']);
    Route::post('/admin/galleries/{id}/invites/send', [InviteController::class, 'sendEmail']);
    Route::post('/admin/upload', [ImageController::class, 'upload']);
    
    // NEU: Notification Endpoint
    Route::post('/admin/galleries/{id}/notify', [NotificationController::class, 'notifyUsers']);
});
