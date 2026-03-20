<?php

namespace AppHttpControllers;

use IlluminateHttpRequest;
use AppModelsGallery;
use AppModelsPhoto;
use AppModelsDownloadLog;
use ZipStreamZipStream;
use IlluminateSupportFacadesLog;
use AppServicesWatermarkService;
use SymfonyComponentProcessProcess;

class DownloadController extends Controller
{
    private function authorizeGalleryAccess($gallery)
    {
        $user = auth('api')->user();
        if (!$gallery->is_public) {
            if (!$user)
                abort(401, 'Unauthorized access to this gallery.');
            if (!$user->canAccessGallery($gallery->id)) {
                abort(403, 'Unauthorized access to this gallery.');
            }
        }
        return $user;
    }

    private function injectMetadata($sourcePath, $photo, $userName)
    {
        $tempDir = storage_path('app/private/temp');
        if (!is_dir($tempDir))
            mkdir($tempDir, 0755, true);

        $tempPath = $tempDir . '/' . uniqid('dl_') . '.jpg';
        copy($sourcePath, $tempPath);

        // FIX: Korrekter String für den Trim-Befehl ohne Syntax-Fehler
        $artist = trim($photo->artist ?? config('app.name', 'Reisinger Portal'), "\"\'");
        $copyright = 'Copyright ' . date('Y') . ' ' . $artist;
        $instructions = 'Licensed to / Downloaded by: ' . $userName;

        $args = [
            'exiftool',
            '-overwrite_original',
            '-q',
            '-m',
            '-charset',
            'utf8',
            '-charset',
            'iptc=utf8',
            '-charset',
            'exif=utf8',
            '-IPTC:CodedCharacterSet=utf8'
        ];

        if (!empty($photo->title)) {
            $args[] = "-ObjectName={$photo->title}";
            $args[] = "-XPTitle={$photo->title}";
        }
        if (!empty($photo->description)) {
            $args[] = "-Caption-Abstract={$photo->description}";
            $args[] = "-ImageDescription={$photo->description}";
        }

        array_push(
            $args,
            "-Artist={$artist}",
            "-By-line={$artist}",
            "-Copyright={$copyright}",
            "-CopyrightNotice={$copyright}",
            "-SpecialInstructions={$instructions}",
            $tempPath
        );

        $process = new Process($args);
        $process->run();

        if (!$process->isSuccessful()) {
            Log::error("ExifTool failed on {$sourcePath}: " . $process->getErrorOutput());
            @unlink($tempPath);
            return $sourcePath;
        }

        return $tempPath;
    }

    public function downloadSingle(Request $request, $photoId)
    {
        $photo = Photo::with('gallery')->findOrFail($photoId);
        $gallery = $photo->gallery;
        $user = $this->authorizeGalleryAccess($gallery);

        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $sourcePath = $baseStoragePath . '/' . $gallery->id . '/' . $photo->filename;

        if (!file_exists($sourcePath))
            abort(404, 'Datei nicht gefunden');

        $userName = $user ? $user->name : 'Gast';

        DownloadLog::create([
            'user_id' => $user ? $user->id : null,
            'user_name_snapshot' => $userName,
            'gallery_id' => $gallery->id,
            'gallery_name_snapshot' => $gallery->name,
            'item_type' => 'single_image',
            'item_identifier' => $photo->filename,
            'user_agent' => $request->userAgent()
        ]);

        $hasFullAccess = $user && ($user->is_admin || $user->canAccessGallery($gallery->id));
        if (!$hasFullAccess) {
            $wmPath = $baseStoragePath . '/' . $gallery->id . '/_watermarked/' . $photo->filename;
            if (!file_exists($wmPath)) {
                if (!is_dir(dirname($wmPath)))
                    mkdir(dirname($wmPath), 0755, true);
                app(WatermarkService::class)->applyWatermark($sourcePath, $wmPath, 2000);
            }
            $sourcePath = $wmPath;
        }

        $processedPath = $this->injectMetadata($sourcePath, $photo, $userName);
        return response()->download($processedPath, $photo->filename)->deleteFileAfterSend($processedPath !== $sourcePath);
    }

    public function downloadZip(Request $request, $galleryId)
    {
        $gallery = Gallery::with('photos')->findOrFail($galleryId);
        $user = $this->authorizeGalleryAccess($gallery);

        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $userName = $user ? $user->name : 'Gast';

        DownloadLog::create([
            'user_id' => $user ? $user->id : null,
            'user_name_snapshot' => $userName,
            'gallery_id' => $gallery->id,
            'gallery_name_snapshot' => $gallery->name,
            'item_type' => 'full_zip',
            'item_identifier' => $gallery->slug . '.zip',
            'user_agent' => $request->userAgent()
        ]);

        return response()->streamDownload(function () use ($gallery, $baseStoragePath, $userName, $user) {
            $zip = new ZipStream(sendHttpHeaders: false);
            $watermarkService = app(WatermarkService::class);

            foreach ($gallery->photos as $photo) {
                $sourcePath = $baseStoragePath . '/' . $gallery->id . '/' . $photo->filename;
                if (!file_exists($sourcePath))
                    continue;

                $hasFullAccess = $user && ($user->is_admin || $user->canAccessGallery($gallery->id));
        if (!$hasFullAccess) {
            $wmPath = $baseStoragePath . '/' . $gallery->id . '/_watermarked/' . $photo->filename;
                    if (!file_exists($wmPath)) {
                        if (!is_dir(dirname($wmPath)))
                            mkdir(dirname($wmPath), 0755, true);
                        $watermarkService->applyWatermark($sourcePath, $wmPath, 2000);
                    }
                    $sourcePath = $wmPath;
                }

                $processedPath = $this->injectMetadata($sourcePath, $photo, $userName);
                $zip->addFileFromPath($photo->filename, $processedPath);

                if ($processedPath !== $sourcePath) {
                    @unlink($processedPath);
                }
            }

            $zip->finish();
        }, $gallery->slug . '.zip');
    }
}
