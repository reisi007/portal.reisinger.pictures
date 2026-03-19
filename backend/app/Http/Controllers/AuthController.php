<?php

namespace AppHttpControllers;

use IlluminateHttpRequest;
use IlluminateSupportFacadesAuth;
use IlluminateSupportFacadesHash;
use AppModelsUser;
use AppModelsRole;
use AppModelsDomainMapping;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        
        // 1. Check Admin Credentials (ENV)
        $adminEmail = env('ADMIN_EMAIL', 'florian@reisinger.pictures');
        $adminPass = env('ADMIN_PASSWORD', 'admin');

        if ($credentials['email'] === $adminEmail && $credentials['password'] === $adminPass) {
            $user = User::firstOrCreate(
                ['email' => $adminEmail],
                ['name' => 'Florian Reisinger']
            );
            $adminRole = Role::firstOrCreate(['name' => 'admin']);
            $user->roles()->syncWithoutDetaching([$adminRole->id]);

            $token = Auth::guard('api')->login($user);
            return $this->respondWithToken($token);
        }

        // 2. Check regular users in Database
        $user = User::where('email', $credentials['email'])->first();
        if ($user && $user->password && Hash::check($credentials['password'], $user->password)) {
            $token = Auth::guard('api')->login($user);
            return $this->respondWithToken($token);
        }

        return response()->json(['error' => 'Ungültige Zugangsdaten.'], 401);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Auto-Zuordnung via Domain
        $domain = substr(strrchr($validated['email'], "@"), 1);
        $mapping = DomainMapping::where('domain', $domain)->first();

        if ($mapping) {
            if ($mapping->role_id) {
                $user->roles()->syncWithoutDetaching([$mapping->role_id]);
            }
            if ($mapping->gallery_group_id) {
                $user->galleryGroups()->syncWithoutDetaching([$mapping->gallery_group_id]);
            }
        }

        $token = Auth::guard('api')->login($user);
        return $this->respondWithToken($token);
    }

    public function me()
    {
        $user = Auth::guard('api')->user();
        
        // Lade Galerien für Kunden-Dashboard mit
        if (!$user->is_admin) {
            $user->load('galleries');
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => $user->is_admin,
            'is_pending' => $user->is_pending,
            'my_galleries' => $user->galleries ?? []
        ]);
    }

    public function logout()
    {
        Auth::guard('api')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60
        ]);
    }
}
