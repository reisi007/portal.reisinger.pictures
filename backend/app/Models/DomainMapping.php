<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DomainMapping extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'domain',
        'role_id',
        'gallery_group_id'
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function galleryGroup()
    {
        return $this->belongsTo(GalleryGroup::class);
    }
}
