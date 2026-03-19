<?php

namespace AppHttpControllers;

use AppModelsGallery;
use IlluminateHttpRequest;
use AppServicesWatermarkService;

class FileDeliveryController extends Controller
{
    public function serve(Request $request, $slug, $filename)
    {
        $gallery = Gallery::where('slug', $slug)->firstOrFail();
        $user = auth('api')->user();

        if (!$gallery->is_public) {
            if (!$user) abort(401, 'Unauthorized');
            if (!$user->is_admin && !$user->galleries()->where('galleries.id', $gallery->id)->exists()) abort(403, 'Forbidden');
        }

        $isGuest = !$user;
        $cleanFilename = basename($filename);
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $watermarkService = app(WatermarkService::class);

        // Nutze $gallery->id für den physischen Pfad
        if (str_starts_with($request->path(), "media/$slug/_thumbs/")) {
            $sourcePath = $baseStoragePath . '/' . $gallery->id . '/_thumbs/' . $cleanFilename;
            $path = $sourcePath;
            $xAccelPath = '/protected-photos/' . $gallery->id . '/_thumbs/' . $cleanFilename;
            
            if ($isGuest) {
                $path = $baseStoragePath . '/' . $gallery->id . '/_thumbs/_watermarked/' . $cleanFilename;
                $xAccelPath = '/protected-photos/' . $gallery->id . '/_thumbs/_watermarked/' . $cleanFilename;
                if (!file_exists($path) && file_exists($sourcePath)) {
                    if (!is_dir(dirname($path))) mkdir(dirname($path), 0755, true);
                    $watermarkService->applyWatermark($sourcePath, $path);
                }
            }
        } else {
            $sourcePath = $baseStoragePath . '/' . $gallery->id . '/' . $cleanFilename;
            $path = $sourcePath;
            $xAccelPath = '/protected-photos/' . $gallery->id . '/' . $cleanFilename;

            if ($isGuest) {
                $path = $baseStoragePath . '/' . $gallery->id . '/_watermarked/' . $cleanFilename;
                $xAccelPath = '/protected-photos/' . $gallery->id . '/_watermarked/' . $cleanFilename;
                if (!file_exists($path) && file_exists($sourcePath)) {
                    if (!is_dir(dirname($path))) mkdir(dirname($path), 0755, true);
                    $watermarkService->applyWatermark($sourcePath, $path, 2000);
                }
            }
        }

        if (!file_exists($path)) abort(404, 'File not found');

        $mime = mime_content_type($path);

        if (env('USE_X_ACCEL_REDIRECT', false)) {
            return response('', 200)->withHeaders([
                'Content-Type' => $mime,
                'X-Accel-Redirect' => $xAccelPath
            ]);
        }

        return response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable'
        ]);
    }
}
