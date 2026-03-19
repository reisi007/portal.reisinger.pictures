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

    public function check($token)
    {
        $invite = GalleryInvite::where('token', $token)->with('gallery')->firstOrFail();
        
        return response()->json([
            'gallery_name' => $invite->gallery->name,
            'requires_password' => !empty($invite->gallery->password_hash)
        ]);
    }

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

        if ($gallery->password_hash && !Hash::check($request->password, $gallery->password_hash)) {
            return response()->json(['error' => 'Das Galerie-Passwort ist nicht korrekt.'], 403);
        }

        $user = User::where('email', $request->email)->first();
        
        if ($user) {
            // FIX: Prevent Account Takeover
            if ($user->password || $user->is_admin) {
                return response()->json(['error' => 'Diese E-Mail ist bereits mit einem Passwort registriert. Bitte logge dich regulär ein.'], 403);
            }
            // Optional: Name aktualisieren, falls gewünscht.
        } else {
            $user = User::create([
                'email' => $request->email,
                'name' => $request->name
            ]);
        }

        $user->galleries()->syncWithoutDetaching([$gallery->id]);

        $jwt = Auth::guard('api')->login($user);

        return response()->json([
            'success' => true,
            'access_token' => $jwt,
            'full_path' => $gallery->full_path
        ]);
    }
}
