<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\Photo;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        if (!$gallery) {
            return response()->json(['error' => 'Galerie nicht gefunden'], 404);
        }

        $file = $request->file('file');
        
        // SECURITY: Path Traversal Prevention
        // Extrahiere nur den reinen Dateinamen ohne Pfadbestandteile und sichere ihn
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        $filename = Str::slug($originalName) . '.' . $extension;
        
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $targetDir = $baseStoragePath . '/' . $gallery->slug;
        $thumbsDir = $targetDir . '/_thumbs';

        if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
        if (!is_dir($thumbsDir)) mkdir($thumbsDir, 0755, true);

        $targetPath = $targetDir . '/' . $filename;

        if (!move_uploaded_file($file->getPathname(), $targetPath)) {
            return response()->json(['error' => 'Datei konnte nicht gespeichert werden.'], 500);
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
            ['filename' => $filename, 'width' => $width, 'height' => $height]
        );

        return response()->json(['success' => true, 'photo_id' => $photo->id, 'filename' => $filename]);
    }
}
