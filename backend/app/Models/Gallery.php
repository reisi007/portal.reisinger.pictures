<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Laravel\Scout\Searchable;

class Gallery extends Model
{
    use Searchable;

    public const UPDATED_AT = null;
    
    protected $fillable = [
        'gallery_group_id',
        'name',
        'slug',
        'type',
        'is_live',
        'is_public',
        'password_hash',
        'expires_at',
        'deleted_at'
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_live' => 'boolean',
        'expires_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Dieses Attribut wird bei JSON-Responses automatisch angehängt
    protected $appends = ['full_path'];

    public function getFullPathAttribute()
    {
        $path = $this->slug;
        $group = $this->galleryGroup;
        
        while ($group) {
            $path = $group->slug . '/' . $path;
            $group = $group->parent; 
        }
        
        return 'galleries/' . $path;
    }

    protected static function booted()
    {
        static::saved(function () { Cache::forget('gallery_tree_admin'); });
        static::deleted(function () { Cache::forget('gallery_tree_admin'); });
    }

    public function photos()
    {
        return $this->hasMany(Photo::class)->orderBy('id', 'desc');
    }

    public function galleryGroup()
    {
        return $this->belongsTo(GalleryGroup::class);
    }

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
        ];
    }
}
