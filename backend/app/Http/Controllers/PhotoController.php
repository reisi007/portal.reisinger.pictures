<?php

namespace AppHttpControllers;

use IlluminateHttpRequest;
use AppModelsPhoto;
use IlluminateSupportFacadesLog;

class PhotoController extends Controller
{
    private function hasMetadataRights($photo)
    {
        $user = auth('api')->user();
        if (!$user) return false;
        if ($user->is_admin) return true;
        if ($user->can_edit_metadata && $user->galleries()->where('galleries.id', $photo->gallery_id)->exists()) {
            return true;
        }
        return false;
    }

    public function updateMetadata(Request $request, $id)
    {
        $photo = Photo::with('gallery')->findOrFail($id);
        
        if (!$this->hasMetadataRights($photo)) {
            return response()->json(['error' => 'Keine Berechtigung, Metadaten zu bearbeiten.'], 403);
        }

        $user = auth('api')->user();
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'artist' => 'nullable|string|max:255',
        ]);

        // EXIFTOOL ENTFÄLLT HIER KOMPLETT! Wir updaten nur noch die DB.
        $photo->title = $validated['title'] ?? $photo->title;
        $photo->description = $validated['description'] ?? $photo->description;
        if ($user->is_admin && isset($validated['artist'])) {
            $photo->artist = $validated['artist'];
        }
        $photo->save();

        return response()->json(['success' => true, 'photo' => $photo]);
    }

    public function destroy($id)
    {
        $photo = Photo::with('gallery')->findOrFail($id);
        $user = auth('api')->user();

        if (!$user->is_admin && !$user->galleries()->where('galleries.id', $photo->gallery_id)->exists()) {
            return response()->json(['error' => 'Keine Löschberechtigung.'], 403);
        }

        $basePath = env('PHOTO_STORAGE_PATH', base_path('../photos')) . '/' . $photo->gallery->id;
        
        @unlink($basePath . '/' . $photo->filename);
        @unlink($basePath . '/_watermarked/' . $photo->filename);
        $thumbName = md5($photo->filename . '1024') . '.webp';
        @unlink($basePath . '/_thumbs/' . $thumbName);
        @unlink($basePath . '/_thumbs/_watermarked/' . $thumbName);

        $photo->delete();

        return response()->json(['success' => true]);
    }
}
