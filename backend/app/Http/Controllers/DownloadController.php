<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\Photo;
use App\Models\DownloadLog;
use ZipStream\ZipStream;
use Illuminate\Support\Facades\Log;

class DownloadController extends Controller
{
    /**
     * SECURITY: Prüft, ob der User Rechte für diese Galerie hat (IDOR Protection)
     */
    private function authorizeGalleryAccess($galleryId)
    {
        $user = auth()->user();
        if (!$user->is_admin && !$user->galleries()->where('galleries.id', $galleryId)->exists()) {
            abort(403, 'Unauthorized access to this gallery.');
        }
    }

    /**
     * Injiziert dynamisch Copyrights und den Downloader-Namen in die Bilddatei.
     */
    private function injectMetadata($sourcePath, $photo, $userName)
    {
        $tempDir = storage_path('app/private/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Temporäre Kopie erstellen, damit das Original auf dem Server unangetastet bleibt
        $tempPath = $tempDir . '/' . uniqid('dl_') . '.jpg';
        copy($sourcePath, $tempPath);

        // Metadaten vorbereiten
        $artist = escapeshellarg(config('app.name', 'Reisinger Portal'));
        $copyright = escapeshellarg('Copyright ' . date('Y') . ' ' . config('app.name', 'Reisinger Portal'));
        $instructions = escapeshellarg('Licensed to / Downloaded by: ' . $userName);
        
        // ExifTool Command (Analog zur alten Live-Architektur, aber dynamisch)
        $cmd = "exiftool -overwrite_original -q -m -charset utf8 -charset iptc=utf8 -charset exif=utf8 -IPTC:CodedCharacterSet=utf8 "
             . "-Artist={$artist} -Copyright={$copyright} -By-line={$artist} -CopyrightNotice={$copyright} "
             . "-SpecialInstructions={$instructions} "
             . escapeshellarg($tempPath);
             
        exec($cmd . ' 2>&1', $output, $returnVar);

        if ($returnVar !== 0) {
            Log::error("ExifTool failed on {$sourcePath}: " . implode("\n", $output));
            @unlink($tempPath);
            return $sourcePath; // Fallback: Wenn Exiftool crasht, Original ausliefern
        }

        return $tempPath;
    }

    public function downloadSingle(Request $request, $photoId)
    {
        $photo = Photo::with('gallery')->findOrFail($photoId);
        
        // SECURITY: IDOR Check
        $this->authorizeGalleryAccess($photo->gallery_id);
        
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $path = $baseStoragePath . '/' . $photo->gallery->slug . '/' . $photo->filename;

        if (!file_exists($path)) {
            abort(404, 'Datei nicht gefunden');
        }

        $userName = auth()->check() ? auth()->user()->name : 'Gast';

        // DSGVO Audit-Log
        DownloadLog::create([
            'user_id' => auth()->id(),
            'user_name_snapshot' => $userName,
            'gallery_id' => $photo->gallery_id,
            'gallery_name_snapshot' => $photo->gallery->name,
            'item_type' => 'single_image',
            'item_identifier' => $photo->filename,
            'user_agent' => $request->userAgent()
        ]);

        // Metadaten injizieren
        $processedPath = $this->injectMetadata($path, $photo, $userName);
        
        // deleteFileAfterSend räumt die temp-Datei automatisch auf!
        return response()->download($processedPath, $photo->filename)->deleteFileAfterSend($processedPath !== $path);
    }

    public function downloadZip(Request $request, $galleryId)
    {
        // SECURITY: IDOR Check
        $this->authorizeGalleryAccess($galleryId);

        $gallery = Gallery::with('photos')->findOrFail($galleryId);
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));

        $userName = auth()->check() ? auth()->user()->name : 'Gast';

        // DSGVO Audit-Log
        DownloadLog::create([
            'user_id' => auth()->id(),
            'user_name_snapshot' => $userName,
            'gallery_id' => $gallery->id,
            'gallery_name_snapshot' => $gallery->name,
            'item_type' => 'full_zip',
            'item_identifier' => $gallery->slug . '.zip',
            'user_agent' => $request->userAgent()
        ]);

        return response()->streamDownload(function () use ($gallery, $baseStoragePath, $userName) {
            $zip = new ZipStream(sendHttpHeaders: false);
            
            foreach ($gallery->photos as $photo) {
                $path = $baseStoragePath . '/' . $gallery->slug . '/' . $photo->filename;
                if (file_exists($path)) {
                    // Metadaten injizieren
                    $processedPath = $this->injectMetadata($path, $photo, $userName);
                    
                    // Bild in den ZIP-Stream laden
                    $zip->addFileFromPath($photo->filename, $processedPath);
                    
                    // Temp-Datei sofort löschen, um Speicherplatz zu sparen
                    if ($processedPath !== $path) {
                        @unlink($processedPath);
                    }
                }
            }
            
            $zip->finish();
        }, $gallery->slug . '.zip');
    }
}
