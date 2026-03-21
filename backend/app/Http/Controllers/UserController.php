<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index()
    {
        return \App\Http\Resources\UserResource::collection(User::with(['roles', 'galleryGroups', 'galleries'])->get());
    }

    public function roles()
    {
        return Role::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => null // Passwort wird erst beim Setup gesetzt
        ]);

        // Token generieren & speichern
        $token = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        // Einladungs-Email senden
        $frontendUrl = rtrim(config('app.url'), '/');
        $link = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        
        $html = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #2A9D8F;'>Hallo {$user->name},</h2>
                    <p>Es wurde ein Account für dich angelegt. Um deinen Account zu aktivieren und ein sicheres Passwort zu vergeben, klicke bitte auf den folgenden Button:</p>
                    <p style='margin: 30px 0;'>
                        <a href='{$link}' style='background-color: #2A9D8F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Account aktivieren & Passwort setzen</a>
                    </p>
                    <p style='font-size: 0.9em; color: #666;'>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br><a href='{$link}' style='color: #2A9D8F;'>{$link}</a></p>
                 </div>";

        Mail::html($html, function($msg) use ($user) {
            $msg->to($user->email)->subject('Dein neuer Account');
        });

        return response()->json(['success' => true, 'user' => new \App\Http\Resources\UserResource($user)]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'role_ids' => 'array',
            'gallery_group_ids' => 'array',
            'gallery_ids' => 'array',
            'can_edit_metadata' => 'boolean'
        ]);

        $user = User::findOrFail($id);
        
        $user->roles()->sync($request->role_ids ?? []);
        $user->galleryGroups()->sync($request->gallery_group_ids ?? []);
        $user->galleries()->sync($request->gallery_ids ?? []);

        if ($request->has('can_edit_metadata')) {
            $user->update(['can_edit_metadata' => $request->can_edit_metadata]);
        }

        return response()->json(['success' => true]);
    }
}
