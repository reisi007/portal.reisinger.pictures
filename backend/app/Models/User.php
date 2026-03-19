<?php

namespace AppModels;

use IlluminateDatabaseEloquentFactoriesHasFactory;
use IlluminateFoundationAuthUser as Authenticatable;
use IlluminateNotificationsNotifiable;
use PHPOpenSourceSaverJWTAuthContractsJWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    public const UPDATED_AT = null;

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

    public function getIsAdminAttribute(): bool {
        return $this->roles()->where('name', 'admin')->exists();
    }
}
