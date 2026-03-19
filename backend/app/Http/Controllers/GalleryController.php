<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryGroup;
use App\Models\Gallery;
use App\Models\Photo;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    public function indexAdmin(Request $request)
    {
        $user = auth('api')->user();
        
        $tree = Cache::rememberForever('gallery_tree_admin', function () {
            $groups = GalleryGroup::whereNull('parent_id')->with(['children', 'galleries'])->get();
            $rootGalleries = Gallery::whereNull('gallery_group_id')->get();
            return ['groups' => $groups, 'root_galleries' => $rootGalleries];
        });

        $filterType = $request->query('filter_type');
        if ($filterType) {
            $treeArray = json_decode(json_encode($tree), true);

        if (!$user->is_admin && $user->is_photographer) {
            $allowedGalleryIds = $user->galleries()->pluck('galleries.id')->toArray();
            
            $filterNode = function($groups) use (&$filterNode, $allowedGalleryIds) {
                $result = [];
                foreach ($groups as $group) {
                    if (isset($group['galleries'])) {
                        $group['galleries'] = array_values(array_filter($group['galleries'], fn($g) => in_array($g['id'], $allowedGalleryIds)));
                    }
                    if (isset($group['children'])) {
                        $group['children'] = $filterNode($group['children']);
                    }
                    $result[] = $group;
                }
                return $result;
            };

            $treeArray['groups'] = $filterNode($treeArray['groups']);
            $treeArray['root_galleries'] = array_values(array_filter($treeArray['root_galleries'], fn($g) => in_array($g['id'], $allowedGalleryIds)));
        }

            $filterNode = function($groups) use (&$filterNode, $filterType) {
                $result = [];
                foreach ($groups as $group) {
                    if (isset($group['galleries'])) {
                        $group['galleries'] = array_values(array_filter($group['galleries'], function($g) use ($filterType) {
                            return $g['type'] === $filterType;
                        }));
                    }
                    if (isset($group['children'])) {
                        $group['children'] = $filterNode($group['children']);
                    }
                    $result[] = $group;
                }
                return $result;
            };

            $treeArray['groups'] = $filterNode($treeArray['groups']);
            $treeArray['root_galleries'] = array_values(array_filter($treeArray['root_galleries'], function($g) use ($filterType) {
                return $g['type'] === $filterType;
            }));

            return response()->json($treeArray);
        }

        return response()->json($tree);
    }

    public function storeGroup(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255', 'parent_id' => 'nullable|integer|exists:gallery_groups,id']);
        
        $slug = Str::slug($request->name);
        if (GalleryGroup::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }
        
        $group = GalleryGroup::create(['name' => $request->name, 'slug' => $slug, 'parent_id' => $request->parent_id]);
        return response()->json(['success' => true, 'group' => $group]);
    }

    public function storeGallery(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|in:selection,delivery',
            'gallery_group_id' => 'nullable|integer|exists:gallery_groups,id',
            'is_public' => 'boolean',
        ]);

        $slug = Str::slug($request->name);
        if (Gallery::where('slug', $slug)->exists()) $slug = $slug . '-' . time();

        $gallery = Gallery::create([
            'name' => $request->name,
            'slug' => $slug,
            'type' => $request->type ?? 'delivery',
            'is_public' => $request->is_public ?? false,
            'gallery_group_id' => $request->gallery_group_id,
        ]);

        $user = auth('api')->user();
        if ($user && !$user->is_admin && $user->is_photographer) {
            $user->galleries()->syncWithoutDetaching([$gallery->id]);
        }

        return response()->json(['success' => true, 'gallery' => $gallery]);
    }

    public function updateGallery(Request $request, $id)
    {
        $gallery = Gallery::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'nullable|in:selection,delivery',
            'is_live' => 'nullable|boolean',
            'is_public' => 'nullable|boolean',
            'gallery_group_id' => 'nullable|integer|exists:gallery_groups,id',
        ]);

        $gallery->update($validated);
        return response()->json(['success' => true, 'gallery' => $gallery]);
    }

    public function destroyGallery($id)
    {
        $gallery = Gallery::findOrFail($id);
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $targetDir = $baseStoragePath . '/' . $gallery->id;
        
        File::deleteDirectory($targetDir);
        
        $gallery->delete();
        return response()->json(['success' => true]);
    }

    public function exportRatings($id)
    {
        Gallery::findOrFail($id);
        $photos = Photo::where('gallery_id', $id)->get();
        $export = [];

        foreach ($photos as $photo) {
            $ratings = DB::table('ratings')
                ->join('users', 'ratings.user_id', '=', 'users.id')
                ->where('photo_id', $photo->id)
                ->select('ratings.rating', 'ratings.comment', 'users.name')
                ->get();

            if ($ratings->isEmpty()) continue;
            $validRatings = $ratings->where('rating', '>', 0);
            $avg = $validRatings->avg('rating');

            $comments = [];
            foreach ($ratings as $r) {
                $ratingStr = $r->rating > 0 ? $r->rating . ' Sterne' : 'Ignoriert';
                $line = "{$r->name} ({$ratingStr})";
                if (!empty($r->comment)) $line .= ": {$r->comment}";
                $comments[] = $line;
            }

            $export[] = [
                'lr_uuid' => $photo->lr_uuid,
                'avg_rating' => $avg ? ceil($avg) : 0,
                'all_comments' => implode("\n", $comments)
            ];
        }

        return response()->json($export);
    }
}
