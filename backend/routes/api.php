<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\GalleryFrontendController;
use App\Http\Controllers\DownloadController;
use App\Http\Controllers\InviteController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DomainMappingController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\FtpController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\EmailTemplateController;

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
});
Route::get('/ping', function() { return response()->json(['message' => 'API OK']); });

Route::get('/sitemap-galleries.xml', [SitemapController::class, 'galleries']);
Route::get('/sitemap-images.xml', [SitemapController::class, 'images']);

Route::get('/invites/{token}', [InviteController::class, 'check']);
Route::middleware('throttle:10,1')->post('/invites/redeem', [InviteController::class, 'redeem']);

Route::get('/search', [SearchController::class, 'search']);
Route::get('/photos/{id}/context', [SearchController::class, 'photoContext']);
Route::get('/galleries/{slug}', [GalleryFrontendController::class, 'show']);

Route::get('/photos/{photoId}/download', [DownloadController::class, 'downloadSingle']);
Route::get('/galleries/{galleryId}/download-zip', [DownloadController::class, 'downloadZip']);

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/photos/{photoId}/rate', [GalleryFrontendController::class, 'rate']);
    Route::post('/galleries/{id}/finish-rating', [MailController::class, 'finishRating']);

    Route::put('/photos/{id}/meta', [PhotoController::class, 'updateMetadata']);
    Route::delete('/photos/{id}', [PhotoController::class, 'destroy']);
});

Route::middleware(['auth:api', 'admin'])->group(function () {
    Route::get('/admin/galleries', [GalleryController::class, 'indexAdmin']);
    Route::post('/admin/gallery-groups', [GalleryController::class, 'storeGroup']);
    Route::post('/admin/galleries', [GalleryController::class, 'storeGallery']);
    Route::put('/admin/galleries/{id}', [GalleryController::class, 'updateGallery']); // NEU
    Route::delete('/admin/galleries/{id}', [GalleryController::class, 'destroyGallery']);
    Route::get('/admin/galleries/{id}/export', [GalleryController::class, 'exportRatings']);
    
    Route::post('/admin/galleries/{id}/invites', [InviteController::class, 'generate']);
    Route::post('/admin/galleries/{id}/invites/send', [InviteController::class, 'sendEmail']);
    Route::post('/admin/upload', [ImageController::class, 'upload']);
    Route::post('/admin/galleries/{id}/send-custom-email', [MailController::class, 'sendCustom']);

    Route::get('/admin/roles', [UserController::class, 'roles']);
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::put('/admin/users/{id}', [UserController::class, 'update']);
    
    Route::get('/admin/domain-mappings', [DomainMappingController::class, 'index']);
    Route::post('/admin/domain-mappings', [DomainMappingController::class, 'store']);
    Route::delete('/admin/domain-mappings/{id}', [DomainMappingController::class, 'destroy']);

    Route::get('/admin/settings/watermark', [SettingsController::class, 'getWatermark']);
    Route::post('/admin/settings/watermark', [SettingsController::class, 'updateWatermark']);

    Route::get('/admin/ftp/status', [FtpController::class, 'status']);
    Route::post('/admin/ftp/target', [FtpController::class, 'setTarget']);
    Route::post('/admin/ftp/process', [FtpController::class, 'process']);

    Route::get('/admin/stats', [StatsController::class, 'index']);
    Route::get('/admin/logs', [StatsController::class, 'logs']);

    Route::get('/admin/email-templates', [EmailTemplateController::class, 'index']);
    Route::post('/admin/email-templates', [EmailTemplateController::class, 'store']);
    Route::put('/admin/email-templates/{id}', [EmailTemplateController::class, 'update']);
    Route::delete('/admin/email-templates/{id}', [EmailTemplateController::class, 'destroy']);
});
