<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\GalleryGroup;
use App\Models\Photo;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $q = $request->input('q', '');
        if (strlen($q) < 2) {
            return response()->json(['galleries' => [], 'photos' => []]);
        }

        $user = auth('api')->user();
        
        $allowedGalleryIds = $user && $user->is_admin
            ? Gallery::pluck('id')->toArray()
            : ($user ? $user->galleries()->pluck('galleries.id')->toArray() : []);

        $publicGalleryIds = Gallery::where('is_public', true)->pluck('id')->toArray();
        $allowedGalleryIds = array_unique(array_merge($allowedGalleryIds, $publicGalleryIds));

        if (empty($allowedGalleryIds)) {
            return response()->json(['galleries' => [], 'photos' => []]);
        }

        $photos = Photo::search($q)->whereIn('gallery_id', $allowedGalleryIds)->take(100)->get();

        $photos->transform(function($p) {
            $p->load('gallery');
            $baseUrl = '/media/' . $p->gallery->slug;
            $p->thumb_url = $baseUrl . '/_thumbs/' . md5($p->filename . '1024') . '.webp';
            return $p;
        });

        $galleries = Gallery::search($q)->whereIn('id', $allowedGalleryIds)->take(50)->get();

        return response()->json([
            'galleries' => $galleries,
            'photos' => $photos
        ]);
    }

    public function photoContext($id)
    {
        $photo = Photo::with('gallery')->findOrFail($id);
        $user = auth('api')->user();

        if (!$photo->gallery->is_public) {
            if (!$user) return response()->json(['error' => 'Unauthenticated'], 401);
            if (!$user->canAccessGallery($photo->gallery_id)) {
                return response()->json(['error' => 'Kein Zugriff auf dieses Foto.'], 403);
            }
        }

        $breadcrumbs = [];
        $breadcrumbs[] = ['name' => $photo->gallery->name, 'full_path' => $photo->gallery->full_path, 'type' => 'gallery'];

        $groupId = $photo->gallery->gallery_group_id;
        while ($groupId) {
            $group = GalleryGroup::find($groupId);
            if ($group) {
                $gPath = $group->slug;
                $pGroup = $group->parent;
                while($pGroup) { $gPath = $pGroup->slug . '/' . $gPath; $pGroup = $pGroup->parent; }
                
                array_unshift($breadcrumbs, ['name' => $group->name, 'full_path' => 'galleries/' . $gPath, 'type' => 'group']);
                $groupId = $group->parent_id;
            } else {
                break;
            }
        }

        $baseUrl = '/media/' . $photo->gallery->slug;
        $photo->url = $baseUrl . '/' . $photo->filename;
        $photo->thumb_url = $baseUrl . '/_thumbs/' . md5($photo->filename . '1024') . '.webp';

        return response()->json([
            'photo' => $photo,
            'breadcrumbs' => $breadcrumbs
        ]);
    }
}
