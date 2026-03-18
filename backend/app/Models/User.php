<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    // Wir haben laut Flyway nur created_at
    public const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'email',
    ];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     */
    public function getJWTCustomClaims()
    {
        return []; // Keine Rollen im Token (Sicherheit!)
    }

    // --- RELATIONEN ---
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function galleryGroups()
    {
        return $this->belongsToMany(GalleryGroup::class, 'user_gallery_groups');
    }

    public function galleries()
    {
        return $this->belongsToMany(Gallery::class, 'user_galleries');
    }

    // --- LOGIC ---
    public function getIsPendingAttribute(): bool
    {
        // Ein User ist pending, wenn er keine Rechte im System hat
        return $this->roles()->count() === 0 
            && $this->galleryGroups()->count() === 0 
            && $this->galleries()->count() === 0;
    }

    public function getIsAdminAttribute(): bool
    {
        return $this->roles()->where('name', 'admin')->exists();
    }
}
