<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\GalleryGroup;
use App\Models\Gallery;
use App\Models\Photo;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GalleryController extends Controller
{
    public function indexAdmin()
    {
        $tree = Cache::rememberForever('gallery_tree_admin', function () {
            $groups = GalleryGroup::whereNull('parent_id')
                ->with(['children', 'galleries'])
                ->get();
            
            $rootGalleries = Gallery::whereNull('gallery_group_id')->get();

            return [
                'groups' => $groups,
                'root_galleries' => $rootGalleries
            ];
        });

        return response()->json($tree);
    }

    public function storeGroup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:gallery_groups,id'
        ]);

        $group = GalleryGroup::create([
            'name' => $request->name,
            'parent_id' => $request->parent_id
        ]);

        return response()->json(['success' => true, 'group' => $group]);
    }

    public function storeGallery(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:selection,delivery',
            'gallery_group_id' => 'nullable|integer|exists:gallery_groups,id',
            'is_live' => 'boolean',
            'password' => 'nullable|string|min:4',
            'expires_at' => 'nullable|date'
        ]);

        $slug = Str::slug($request->name);
        if (Gallery::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }

        $gallery = Gallery::create([
            'name' => $request->name,
            'slug' => $slug,
            'type' => $request->type,
            'is_live' => $request->is_live ?? false,
            'gallery_group_id' => $request->gallery_group_id,
            'is_public' => false,
            'password_hash' => $request->password ? Hash::make($request->password) : null,
            'expires_at' => $request->expires_at
        ]);

        return response()->json(['success' => true, 'gallery' => $gallery]);
    }

    public function destroyGallery($id)
    {
        $gallery = Gallery::findOrFail($id);
        $baseStoragePath = env('PHOTO_STORAGE_PATH', base_path('../photos'));
        $targetDir = $baseStoragePath . '/' . $gallery->slug;
        
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
                if (!empty($r->comment)) {
                    $line .= ": {$r->comment}";
                }
                $comments[] = $line;
            }

            $export[] = [
                'lr_uuid' => $photo->lr_uuid,
                // NEU: Wir runden hier immer strikt auf (ceil statt round)
                'avg_rating' => $avg ? ceil($avg) : 0,
                'all_comments' => implode("\n", $comments)
            ];
        }

        return response()->json($export);
    }
}
