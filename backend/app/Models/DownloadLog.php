<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DownloadLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'user_name_snapshot',
        'gallery_id',
        'gallery_name_snapshot',
        'item_type', // 'single_image', 'full_zip'
        'item_identifier',
        'user_agent'
    ];
}
