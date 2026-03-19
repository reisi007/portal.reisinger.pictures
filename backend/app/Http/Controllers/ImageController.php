<?php

namespace AppHttpControllers;

use IlluminateHttpRequest;
use AppModelsGallery;
use AppModelsPhoto;
use IlluminateSupportFacadesLog;
use IlluminateSupportStr;

class ImageController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'gallery_id' => 'required|integer',
            'lr_uuid' => 'required|string',
            'file' => 'required|image|max:20480',
        ]);

        $gallery = Gallery::find($request->gallery_id);
        if (!$gallery) return response()->json(['error' => 'Galerie nicht gefunden'], 404);

        $user = auth('api')->user();
        $file = $request->file('file');
        
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        $filename = Str::slug($originalName) . '.' . $extension;
        
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $targetDir = $baseStoragePath . '/' . $gallery->id;
        $thumbsDir = $targetDir . '/_thumbs';

        if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
        if (!is_dir($thumbsDir)) mkdir($thumbsDir, 0755, true);

        $targetPath = $targetDir . '/' . $filename;

        if (!move_uploaded_file($file->getPathname(), $targetPath)) {
            return response()->json(['error' => 'Datei konnte nicht gespeichert werden.'], 500);
        }

        // Metadaten AUSLESEN (statt schreiben)
        $cmd = "exiftool -json -Title -ObjectName -XPTitle -ImageDescription -Caption-Abstract -Artist -By-line -Copyright " . escapeshellarg($targetPath);
        $metaOutput = shell_exec($cmd);
        $metaData = json_decode($metaOutput, true);
        
        $title = null; $desc = null; $artist = $user->metadata_copyright ?: $user->name;
        if (is_array($metaData) && isset($metaData[0])) {
            $m = $metaData[0];
            $title = $m['Title'] ?? $m['ObjectName'] ?? $m['XPTitle'] ?? null;
            $desc = $m['ImageDescription'] ?? $m['Caption-Abstract'] ?? null;
            // Wenn das Bild schon einen Autor hat, behalten wir diesen, sonst Fallback auf den uploader
            $artist = $m['Artist'] ?? $m['By-line'] ?? $m['Copyright'] ?? $artist;
        }

        $size = @getimagesize($targetPath);
        $width = $size ? (int) $size[0] : 0;
        $height = $size ? (int) $size[1] : 0;

        $thumbPath = $thumbsDir . '/' . md5($filename . '1024') . '.webp';

        try {
            $im = new \Imagick($targetPath);
            $im->autoOrient();
            if ($width > 1024) $im->thumbnailImage(1024, 0, false);
            $im->setImageFormat('webp');
            $im->setImageCompressionQuality(80);
            $im->writeImage($thumbPath);
            $im->clear();
            $im->destroy();
        } catch (\Exception $e) {
            Log::error("Imagick Error on Upload: " . $e->getMessage());
        }

        $photo = Photo::updateOrCreate(
            ['gallery_id' => $gallery->id, 'lr_uuid' => $request->lr_uuid],
            [
                'filename' => $filename, 
                'width' => $width, 
                'height' => $height, 
                'title' => $title, 
                'description' => $desc, 
                'artist' => $artist
            ]
        );

        return response()->json(['success' => true, 'photo_id' => $photo->id, 'filename' => $filename]);
    }
}
