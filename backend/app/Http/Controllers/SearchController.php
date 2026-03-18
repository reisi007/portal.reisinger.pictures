<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\GalleryGroup;
use App\Models\Photo;

class SearchController extends Controller
{
    /**
     * Sucht über Scout in Meilisearch und filtert nach den Berechtigungen des Users.
     */
    public function search(Request $request)
    {
        $q = $request->input('q', '');
        if (strlen($q) < 2) {
            return response()->json(['galleries' => [], 'photos' => []]);
        }

        $user = auth()->user();
        
        // Hole alle erlaubten Galerie-IDs für diesen User
        $allowedGalleryIds = $user->is_admin
            ? Gallery::pluck('id')->toArray()
            : $user->galleries()->pluck('galleries.id')->toArray();

        if (empty($allowedGalleryIds)) {
            return response()->json(['galleries' => [], 'photos' => []]);
        }

        // Fotos über Scout suchen. Wir holen etwas mehr (100) und filtern sie in PHP, 
        // um komplexe Meilisearch filterableAttributes Konfigurationen beim MVP zu vermeiden.
        $rawPhotos = Photo::search($q)->take(100)->get();
        $photos = $rawPhotos->filter(fn($p) => in_array($p->gallery_id, $allowedGalleryIds))->values();

        $photos->transform(function($p) {
            $p->load('gallery');
            $baseUrl = '/photos/' . $p->gallery->slug;
            $p->thumb_url = $baseUrl . '/_thumbs/' . md5($p->filename . '1024') . '.webp';
            return $p;
        });

        // Galerien über Scout suchen
        $rawGalleries = Gallery::search($q)->take(50)->get();
        $galleries = $rawGalleries->filter(fn($g) => in_array($g->id, $allowedGalleryIds))->values();

        return response()->json([
            'galleries' => $galleries,
            'photos' => $photos
        ]);
    }

    /**
     * Liefert ein einzelnes Foto und seinen kompletten "Breadcrumb" Pfad zurück.
     */
    public function photoContext($id)
    {
        $photo = Photo::with('gallery')->findOrFail($id);
        $user = auth()->user();

        // Auth Check
        if (!$user->is_admin && !$user->galleries()->where('galleries.id', $photo->gallery_id)->exists()) {
            return response()->json(['error' => 'Kein Zugriff auf dieses Foto.'], 403);
        }

        $breadcrumbs = [];
        // Die Galerie selbst ist der letzte Brotkrümel (klickbar)
        $breadcrumbs[] = ['name' => $photo->gallery->name, 'slug' => $photo->gallery->slug, 'type' => 'gallery'];

        // Parent-Gruppen rekursiv auflösen
        $groupId = $photo->gallery->gallery_group_id;
        while ($groupId) {
            $group = GalleryGroup::find($groupId);
            if ($group) {
                array_unshift($breadcrumbs, ['name' => $group->name, 'type' => 'group']);
                $groupId = $group->parent_id;
            } else {
                break;
            }
        }

        $baseUrl = '/photos/' . $photo->gallery->slug;
        $photo->url = $baseUrl . '/' . $photo->filename;
        $photo->thumb_url = $baseUrl . '/_thumbs/' . md5($photo->filename . '1024') . '.webp';

        return response()->json([
            'photo' => $photo,
            'breadcrumbs' => $breadcrumbs
        ]);
    }
}
