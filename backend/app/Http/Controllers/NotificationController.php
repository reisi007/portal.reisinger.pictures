<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\GalleryGroup;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class NotificationController extends Controller
{
    public function notifyUsers(Request $request, $galleryId)
    {
        $gallery = Gallery::with('galleryGroup')->findOrFail($galleryId);
        
        // 1. User mit direktem Galerie-Zugriff
        $userIds = DB::table('user_galleries')->where('gallery_id', $gallery->id)->pluck('user_id')->toArray();

        // 2. Vererbung: Finde alle übergeordneten Gruppen
        $groupIds = [];
        $currentGroup = $gallery->galleryGroup;
        while ($currentGroup) {
            $groupIds[] = $currentGroup->id;
            $currentGroup = GalleryGroup::find($currentGroup->parent_id);
        }

        if (!empty($groupIds)) {
            $groupUserIds = DB::table('user_gallery_groups')
                ->whereIn('gallery_group_id', $groupIds)
                ->pluck('user_id')
                ->toArray();
            $userIds = array_merge($userIds, $groupUserIds);
        }

        // 3. Eindeutige User-IDs filtern und User laden
        $userIds = array_unique($userIds);
        
        if (empty($userIds)) {
            return response()->json(['message' => 'Keine berechtigten User gefunden.'], 404);
        }

        $users = User::whereIn('id', $userIds)->whereNotNull('email')->get();
        $count = 0;

        foreach ($users as $user) {
            $html = "<h2>Hallo {$user->name},</h2>
                     <p>Es gibt Neuigkeiten in der Galerie <strong>{$gallery->name}</strong>!</p>
                     <p>Du kannst die Galerie über deinen persönlichen Link ansehen.</p>";

            // Nutzt den GmailRestTransport aus der config
            Mail::html($html, function ($message) use ($user, $gallery) {
                $message->to($user->email)
                        ->subject("Neuigkeiten in Galerie: {$gallery->name}");
            });
            $count++;
        }

        return response()->json(['success' => true, 'notified_count' => $count]);
    }
}
