<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Photo extends Model
{
    use Searchable;

    public const UPDATED_AT = null;

    protected $visible = [
        'id', 'gallery_id', 'filename', 'lr_uuid', 'width', 'height', 
        'title', 'description', 'artist', 'created_at', 'url', 'thumb_url', 
        'rating', 'comment', 'gallery'
    ];

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
