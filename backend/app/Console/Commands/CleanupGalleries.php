<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Gallery;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CleanupGalleries extends Command
{
    protected $signature = 'app:cleanup-galleries';
    protected $description = 'Löscht abgelaufene Galerien und deren Dateien nach einer konfigurierbaren Grace-Periode.';

    public function handle()
    {
        // Grace Periode in Monaten aus der .env lesen (Standard: 3 Monate)
        $graceMonths = env('GALLERY_CLEANUP_GRACE_MONTHS', 3);
        
        // Stichtag berechnen: Heute minus X Monate
        $cutoffDate = Carbon::now()->subMonths($graceMonths);

        $expiredGalleries = Gallery::whereNotNull('expires_at')
                                   ->where('expires_at', '<', $cutoffDate)
                                   ->get();

        $count = 0;

        foreach ($expiredGalleries as $gallery) {
            $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
            $targetDir = $baseStoragePath . '/' . $gallery->id;

            // Dateien physisch löschen
            if (is_dir($targetDir)) {
                $files = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($targetDir, \RecursiveDirectoryIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::CHILD_FIRST
                );
                foreach ($files as $fileinfo) {
                    $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
                    @$todo($fileinfo->getRealPath());
                }
                @rmdir($targetDir);
            }

            // Galerie aus der Datenbank löschen (Hard Delete)
            $galleryName = $gallery->name;
            $galleryExpire = $gallery->expires_at;
            $gallery->delete();

            $this->info("Gelöscht: {$galleryName}");
            Log::info("Automated cleanup: Deleted gallery {$galleryName} (expired at {$galleryExpire})");
            $count++;
        }

        $this->info("Cleanup abgeschlossen. {$count} Galerien wurden dauerhaft gelöscht.");
    }
}
