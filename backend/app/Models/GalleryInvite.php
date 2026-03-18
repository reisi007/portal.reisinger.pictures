<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GalleryInvite extends Model
{
    public const UPDATED_AT = null;
    
    protected $fillable = [
        'gallery_id',
        'token',
        'created_at'
    ];

    public function gallery()
    {
        return $this->belongsTo(Gallery::class);
    }
}
