<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class PhotoProcessingService
{
    /**
     * Extrahiert Metadaten (ExifTool) und generiert ein WebP Thumbnail (Imagick).
     *
     * @param string $targetPath Absoluter Pfad zum hochgeladenen Original-JPEG
     * @param string $thumbPath Absoluter Pfad zum gewünschten Thumbnail-Ziel
     * @param string|null $defaultArtist Fallback, falls das Bild keinen eigenen Artist enthält
     * @return array Gibt Breite, Höhe, Titel, Beschreibung und Artist als Array zurück
     */
    public function processImage(string $targetPath, string $thumbPath, ?string $defaultArtist = null): array
    {
        // 1. Metadaten AUSLESEN (Exiftool)
        $process = new Process([
            'exiftool', '-json', '-Title', '-ObjectName', '-XPTitle', 
            '-ImageDescription', '-Caption-Abstract', '-Artist', '-By-line', '-Copyright', $targetPath
        ]);
        $process->run();
        $metaOutput = $process->getOutput();
        $metaData = json_decode($metaOutput, true);
        
        $title = null; 
        $desc = null; 
        $artist = $defaultArtist;
        
        if (is_array($metaData) && isset($metaData[0])) {
            $m = $metaData[0];
            $title = $m['Title'] ?? $m['ObjectName'] ?? $m['XPTitle'] ?? null;
            $desc = $m['ImageDescription'] ?? $m['Caption-Abstract'] ?? null;
            $artist = $m['Artist'] ?? $m['By-line'] ?? $m['Copyright'] ?? $artist;
        }

        $size = @getimagesize($targetPath);
        $width = $size ? (int) $size[0] : 0;
        $height = $size ? (int) $size[1] : 0;

        // 2. Thumbnail generieren (Imagick)
        try {
            $im = new \Imagick($targetPath);
            $im->autoOrient();
            if ($width > 1024) {
                $im->thumbnailImage(1024, 0, false);
            }
            $im->setImageFormat('webp');
            $im->setImageCompressionQuality(80);
            $im->writeImage($thumbPath);
            $im->clear();
            $im->destroy();
        } catch (\Exception $e) {
            Log::error("Imagick Error in PhotoProcessingService: " . $e->getMessage());
        }

        return [
            'width' => $width,
            'height' => $height,
            'title' => $title,
            'description' => $desc,
            'artist' => $artist
        ];
    }
}
