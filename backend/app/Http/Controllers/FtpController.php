<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\Photo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\PhotoProcessingService;

class FtpController extends Controller
{
    private function getInboxPath($userId)
    {
        $base = env('FTP_STORAGE_PATH', base_path('../ftp'));
        return $base . '/' . $userId;
    }

    public function status()
    {
        $user = auth('api')->user();
        $inboxPath = $this->getInboxPath($user->id);
        
        $fileCount = 0;
        if (is_dir($inboxPath)) {
            $files = glob($inboxPath . '/*.{jpg,jpeg,JPG,JPEG}', GLOB_BRACE);
            $fileCount = count($files);
        }

        $user->load('currentFtpGallery');

        return response()->json([
            'ftp_folder' => '/ftp/' . $user->id,
            'file_count' => $fileCount,
            'current_target_gallery' => $user->currentFtpGallery
        ]);
    }

    public function setTarget(Request $request)
    {
        $request->validate(['gallery_id' => 'nullable|integer|exists:galleries,id']);
        $user = auth('api')->user();
        
        if ($request->gallery_id && !$user->is_admin && !$user->galleries()->where('galleries.id', $request->gallery_id)->exists()) {
            return response()->json(['error' => 'Keine Rechte für diese Galerie.'], 403);
        }

        $user->update(['current_ftp_gallery_id' => $request->gallery_id]);
        return response()->json(['success' => true]);
    }

    public function process(Request $request)
    {
        $user = auth('api')->user();
        if (!$user->current_ftp_gallery_id) return response()->json(['error' => 'Keine Ziel-Galerie ausgewählt.'], 400);

        $gallery = Gallery::find($user->current_ftp_gallery_id);
        $inboxPath = $this->getInboxPath($user->id);
        
        if (!is_dir($inboxPath)) return response()->json(['success' => true, 'processed' => 0]);

        $files = glob($inboxPath . '/*.{jpg,jpeg,JPG,JPEG}', GLOB_BRACE);
        if (empty($files)) return response()->json(['success' => true, 'processed' => 0]);

        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $targetDir = $baseStoragePath . '/' . $gallery->id;
        $thumbsDir = $targetDir . '/_thumbs';

        if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
        if (!is_dir($thumbsDir)) mkdir($thumbsDir, 0755, true);

        $processedCount = 0;
        $defaultArtist = $user->metadata_copyright ?: $user->name;
        $photoService = app(PhotoProcessingService::class);

        foreach ($files as $file) {
            $originalName = pathinfo($file, PATHINFO_FILENAME);
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            $filename = Str::slug($originalName) . '.' . strtolower($extension);
            $targetPath = $targetDir . '/' . $filename;
            
            // Bestehende Dateien überschreiben, um Metadaten zu aktualisieren
            if (!rename($file, $targetPath)) continue;

            $thumbPath = $thumbsDir . '/' . md5($filename . '1024') . '.webp';
            
            $meta = $photoService->processImage($targetPath, $thumbPath, $defaultArtist);

            $photo = Photo::where('gallery_id', $gallery->id)->where('filename', $filename)->first();
            
            if ($photo) {
                $photo->update($meta);
            } else {
                Photo::create(array_merge([
                    'gallery_id' => $gallery->id,
                    'lr_uuid' => 'ftp-' . uniqid(),
                    'filename' => $filename,
                ], $meta));
            }

            $processedCount++;
        }

        return response()->json(['success' => true, 'processed' => $processedCount]);
    }
}
