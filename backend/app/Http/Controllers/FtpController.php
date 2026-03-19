<?php

namespace AppHttpControllers;

use IlluminateHttpRequest;
use AppModelsGallery;
use AppModelsPhoto;
use IlluminateSupportFacadesLog;
use IlluminateSupportStr;

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

        foreach ($files as $file) {
            $originalName = pathinfo($file, PATHINFO_FILENAME);
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            $filename = Str::slug($originalName) . '.' . strtolower($extension);
            $targetPath = $targetDir . '/' . $filename;
            
            if (file_exists($targetPath)) {
                $filename = Str::slug($originalName) . '-' . uniqid() . '.' . strtolower($extension);
                $targetPath = $targetDir . '/' . $filename;
            }

            if (!rename($file, $targetPath)) continue;

            // Metadaten AUSLESEN (statt schreiben)
            $cmd = "exiftool -json -Title -ObjectName -XPTitle -ImageDescription -Caption-Abstract -Artist -By-line -Copyright " . escapeshellarg($targetPath);
            $metaOutput = shell_exec($cmd);
            $metaData = json_decode($metaOutput, true);
            
            $title = null; $desc = null; $artist = $defaultArtist;
            if (is_array($metaData) && isset($metaData[0])) {
                $m = $metaData[0];
                $title = $m['Title'] ?? $m['ObjectName'] ?? $m['XPTitle'] ?? null;
                $desc = $m['ImageDescription'] ?? $m['Caption-Abstract'] ?? null;
                $artist = $m['Artist'] ?? $m['By-line'] ?? $m['Copyright'] ?? $artist;
            }

            $size = @getimagesize($targetPath);
            $width = $size ? (int)$size[0] : 0;
            $height = $size ? (int)$size[1] : 0;

            $thumbPath = $thumbsDir . '/' . md5($filename . '1024') . '.webp';

            try {
                $im = new \Imagick($targetPath);
                $im->autoOrient();
                if ($width > 1024) $im->thumbnailImage(1024, 0, false);
                $im->setImageFormat('webp');
                $im->setImageCompressionQuality(80);
                $im->writeImage($thumbPath);
                $im->clear(); $im->destroy();
            } catch (\Exception $e) {
                Log::error("Imagick Error in FTP Process: " . $e->getMessage());
            }

            Photo::create([
                'gallery_id' => $gallery->id,
                'lr_uuid' => 'ftp-' . uniqid(),
                'filename' => $filename,
                'width' => $width,
                'height' => $height,
                'title' => $title,
                'description' => $desc,
                'artist' => $artist
            ]);

            $processedCount++;
        }

        return response()->json(['success' => true, 'processed' => $processedCount]);
    }
}
