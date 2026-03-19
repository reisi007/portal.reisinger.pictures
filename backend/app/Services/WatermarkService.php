<?php

namespace App\Services;

use Imagick;
use ImagickPixel;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;

class WatermarkService
{
    // Verfügbare Render-Buckets für die Breite des Master-PNGs
    private array $buckets = [500, 1000, 2000, 4000];

    public function applyWatermark($sourcePath, $destPath, $maxWidth = null)
    {
        $svgPath = storage_path('app/private/watermark.svg');
        
        if (!file_exists($svgPath)) {
            copy($sourcePath, $destPath);
            return true;
        }

        $scale = (float) (Setting::where('key', 'watermark_scale')->value('value') ?? 0.10);
        $opacity = (float) (Setting::where('key', 'watermark_opacity')->value('value') ?? 0.6);
        $position = Setting::where('key', 'watermark_position')->value('value') ?? 'bottom-right';

        try {
            $im = new Imagick($sourcePath);
            $im->autoOrient();
            $geo = $im->getImageGeometry();
            
            // Bild skalieren, falls z.B. für Gäste limitiert
            if ($maxWidth && $geo['width'] > $maxWidth) {
                $im->resizeImage($maxWidth, 0, Imagick::FILTER_LANCZOS, 1);
                $geo = $im->getImageGeometry();
            }

            // Ziel-Breite des Wasserzeichens berechnen
            $longest = max($geo['width'], $geo['height']);
            $targetWmWidth = $longest * $scale;

            // Den kleinstmöglichen Bucket finden, der größer/gleich der Ziel-Breite ist
            // So verhindern wir Upscaling und rastern das SVG nur so groß wie nötig.
            $selectedBucket = 8000; // Fallback für gigantische Bilder
            foreach ($this->buckets as $bucket) {
                if ($bucket >= $targetWmWidth) {
                    $selectedBucket = $bucket;
                    break;
                }
            }

            // Cache Key für diesen spezifischen Bucket
            $configHash = md5(filemtime($svgPath) . $opacity);
            $masterPngPath = storage_path("app/private/watermark_master_${configHash}_bucket_${selectedBucket}.png");

            if (!file_exists($masterPngPath)) {
                $this->generateMasterPng($svgPath, $masterPngPath, $opacity, $selectedBucket);
            }

            $wm = new Imagick($masterPngPath);
            
            // Auf die exakte Pixel-Größe für dieses spezifische Bild herunterskalieren
            $wm->resizeImage((int) $targetWmWidth, 0, Imagick::FILTER_LANCZOS, 1);
            $wGeo = $wm->getImageGeometry();

            // Position berechnen (2% Padding)
            $pad = $longest * 0.02; 
            $x = $geo['width'] - $wGeo['width'] - $pad; // default: bottom-right
            $y = $geo['height'] - $wGeo['height'] - $pad;

            if ($position === 'center') {
                $x = ($geo['width'] / 2) - ($wGeo['width'] / 2);
                $y = ($geo['height'] / 2) - ($wGeo['height'] / 2);
            } elseif ($position === 'bottom-left') {
                $x = $pad;
            } elseif ($position === 'top-right') {
                $y = $pad;
            } elseif ($position === 'top-left') {
                $x = $pad;
                $y = $pad;
            }

            // Compositing
            $im->compositeImage($wm, Imagick::COMPOSITE_OVER, (int) $x, (int) $y);
            
            $im->setImageCompressionQuality(80);
            $im->writeImage($destPath);

            $wm->clear(); $wm->destroy();
            $im->clear(); $im->destroy();

            return true;
        } catch (\Exception $e) {
            Log::error("Watermark generation failed: " . $e->getMessage());
            copy($sourcePath, $destPath); 
            return false;
        }
    }

    private function generateMasterPng($svgPath, $outPath, $opacity, $renderWidth)
    {
        try {
            $im = new Imagick();
            $im->setBackgroundColor(new ImagickPixel('transparent'));
            
            // SVG Resolution erhöhen für einen scharfen Vektor-zu-Raster Render
            $im->setResolution(300, 300);
            $im->readImage($svgPath);
            $im->setImageFormat("png32");
            
            if ($opacity < 1.0) {
                $im->evaluateImage(Imagick::EVALUATE_MULTIPLY, $opacity, Imagick::CHANNEL_ALPHA);
            }
            
            // Das SVG wird genau in der Bucket-Breite gerastert
            $im->resizeImage($renderWidth, 0, Imagick::FILTER_LANCZOS, 1);
            $im->writeImage($outPath);
            $im->clear(); $im->destroy();
        } catch (\Exception $e) {
            Log::error("Master PNG generation failed for bucket {$renderWidth}: " . $e->getMessage());
        }
    }
}
