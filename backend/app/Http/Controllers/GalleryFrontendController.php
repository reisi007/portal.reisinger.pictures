<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\Photo;
use Illuminate\Support\Facades\DB;

class GalleryFrontendController extends Controller
{
    /**
     * Lädt die Galerie und liefert die Fotos echt paginiert zurück (Backend Pagination)
     */
    public function show($slug)
    {
        $gallery = Gallery::where('slug', $slug)->firstOrFail();
        $user = auth()->user();

        // Security Check: Hat der User Rechte?
        if (!$user->is_admin && !$user->galleries()->where('galleries.id', $gallery->id)->exists()) {
            return response()->json(['error' => 'Kein Zugriff auf diese Galerie.'], 403);
        }

        // Fotos paginieren (50 pro Seite)
        $photos = $gallery->photos()->paginate(50);

        $photos->getCollection()->transform(function ($photo) use ($gallery, $user) {
            $baseUrl = '/photos/' . $gallery->slug;
            $photo->url = $baseUrl . '/' . $photo->filename;
            $photo->thumb_url = $baseUrl . '/_thumbs/' . md5($photo->filename . '1024') . '.webp';
            
            $rating = DB::table('ratings')
                ->where('photo_id', $photo->id)
                ->where('user_id', $user->id)
                ->first();
                
            $photo->rating = $rating ? $rating->rating : null; 
            return $photo;
        });

        return response()->json([
            'gallery' => $gallery,
            'photos' => $photos->items(),
            'current_page' => $photos->currentPage(),
            'last_page' => $photos->lastPage(),
            'total' => $photos->total()
        ]);
    }

    public function rate(Request $request, $photoId)
    {
        $request->validate([
            'rating' => 'required|integer|min:0|max:5',
            'comment' => 'nullable|string'
        ]);

        $photo = Photo::findOrFail($photoId);
        $userId = auth()->id(); 

        DB::table('ratings')->updateOrInsert(
            ['photo_id' => $photo->id, 'user_id' => $userId],
            ['rating' => $request->rating, 'comment' => $request->comment ?? '']
        );

        return response()->json(['success' => true]);
    }
}
