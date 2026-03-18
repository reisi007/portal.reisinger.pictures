<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Photo extends Model
{
    use Searchable;

    public const UPDATED_AT = null;

    protected $fillable = [
        'gallery_id',
        'filename',
        'lr_uuid',
        'width',
        'height',
        'deleted_at'
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    public function gallery()
    {
        return $this->belongsTo(Gallery::class);
    }

    // Indexierung für Suchmaschine
    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'filename' => $this->filename,
            'gallery_id' => $this->gallery_id,
        ];
    }
}
