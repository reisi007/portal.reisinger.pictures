<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Gallery;
use App\Models\GalleryInvite;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\GalleryInviteMail;

class InviteController extends Controller
{
    /**
     * Erstellt einen neuen Magic-Link-Token für eine Galerie.
     */
    public function generate(Request $request, $galleryId)
    {
        $gallery = Gallery::findOrFail($galleryId);
        $token = Str::random(64);
        
        GalleryInvite::create([
            'gallery_id' => $gallery->id,
            'token' => $token
        ]);

        return response()->json([
            'success' => true,
            'link' => url('/invite/' . $token)
        ]);
    }

    /**
     * Sendet einen Magic-Link direkt per E-Mail an den Gast.
     */
    public function sendEmail(Request $request, $galleryId)
    {
        $request->validate(['email' => 'required|email']);

        $gallery = Gallery::findOrFail($galleryId);
        $token = Str::random(64);
        
        GalleryInvite::create([
            'gallery_id' => $gallery->id,
            'token' => $token
        ]);

        $link = url('/invite/' . $token);
        Mail::to($request->email)->send(new GalleryInviteMail($gallery->name, $link));

        return response()->json(['success' => true]);
    }

    /**
     * Prüft die Gültigkeit eines Gast-Tokens.
     */
    public function check($token)
    {
        $invite = GalleryInvite::where('token', $token)->with('gallery')->firstOrFail();
        
        return response()->json([
            'gallery_name' => $invite->gallery->name,
            'requires_password' => !empty($invite->gallery->password_hash)
        ]);
    }

    /**
     * Wandelt den Token + Gast-Daten in ein gültiges JWT um.
     * Dies ist der Haupt-Login für alle Kunden (Selection & Delivery).
     */
    public function redeem(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'name' => 'required|string',
            'email' => 'required|email',
            'password' => 'nullable|string'
        ]);

        $invite = GalleryInvite::where('token', $request->token)->with('gallery')->firstOrFail();
        $gallery = $invite->gallery;

        // Passwort-Check falls für Galerie aktiviert
        if ($gallery->password_hash && !Hash::check($request->password, $gallery->password_hash)) {
            return response()->json(['error' => 'Das Galerie-Passwort ist nicht korrekt.'], 403);
        }

        // Gast-User finden oder neu anlegen
        $user = User::firstOrCreate(
            ['email' => $request->email],
            ['name' => $request->name]
        );

        // Explizite Berechtigung für diese Galerie verknüpfen
        $user->galleries()->syncWithoutDetaching([$gallery->id]);

        // Zustandslose Authentifizierung via JWT
        $jwt = Auth::guard('api')->login($user);

        return response()->json([
            'success' => true,
            'access_token' => $jwt,
            'slug' => $gallery->slug
        ]);
    }
}
