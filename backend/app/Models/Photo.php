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
        'title',
        'description',
        'artist'
    ];

    public function gallery()
    {
        return $this->belongsTo(Gallery::class);
    }

    public function toSearchableArray()
    {
        return [
            'id' => $this->id,
            'filename' => $this->filename,
            'title' => $this->title,
            'description' => $this->description,
            'artist' => $this->artist,
            'gallery_id' => $this->gallery_id,
        ];
    }
}
