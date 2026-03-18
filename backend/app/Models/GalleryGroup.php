<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class GalleryGroup extends Model
{
    public const UPDATED_AT = null;
    
    protected $fillable = [
        'parent_id',
        'name',
        'is_public',
        'deleted_at'
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    protected static function booted()
    {
        // Cache leeren, sobald sich eine Gruppe ändert
        static::saved(function () {
            Cache::forget('gallery_tree_admin');
        });
        static::deleted(function () {
            Cache::forget('gallery_tree_admin');
        });
    }

    // Die Magie für den rekursiven Baum: 
    // Lädt automatisch alle Untergruppen und deren Galerien mit!
    public function children()
    {
        return $this->hasMany(GalleryGroup::class, 'parent_id')->with(['children', 'galleries']);
    }

    public function galleries()
    {
        return $this->hasMany(Gallery::class);
    }
}
