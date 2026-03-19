<?php

namespace AppHttpControllers;

use AppModelsUser;
use AppModelsRole;
use IlluminateHttpRequest;

class UserController extends Controller
{
    public function index()
    {
        return User::with(['roles', 'galleryGroups', 'galleries'])->get();
    }

    public function roles()
    {
        return Role::all();
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
