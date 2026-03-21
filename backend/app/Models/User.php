<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    public const UPDATED_AT = null;

    protected $visible = [
        'id', 'name', 'email', 'metadata_copyright', 'can_edit_metadata', 
        'current_ftp_gallery_id', 'created_at', 'is_admin', 'is_photographer', 
        'is_pending', 'roles', 'galleryGroups', 'galleries', 'currentFtpGallery'
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'metadata_copyright',
        'can_edit_metadata',
        'current_ftp_gallery_id'
    ];

    protected $casts = [
        'can_edit_metadata' => 'boolean'
    ];

    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }

    public function roles() { return $this->belongsToMany(Role::class, 'user_roles'); }
    public function galleryGroups() { return $this->belongsToMany(GalleryGroup::class, 'user_gallery_groups'); }
    public function galleries() { return $this->belongsToMany(Gallery::class, 'user_galleries'); }
    
    public function currentFtpGallery() { return $this->belongsTo(Gallery::class, 'current_ftp_gallery_id'); }

    public function getIsPendingAttribute(): bool {
        return $this->roles()->count() === 0 && $this->galleryGroups()->count() === 0 && $this->galleries()->count() === 0;
    }

    public function getIsPhotographerAttribute(): bool {
        return $this->roles()->where('name', 'photographer')->exists();
    }

    public function getIsAdminAttribute(): bool {
        return $this->roles()->where('name', 'admin')->exists();
    }

    public function canAccessGallery($galleryId): bool
    {
        if ($this->is_admin) return true;
        return $this->galleries()->where('galleries.id', $galleryId)->exists();
    }
}
