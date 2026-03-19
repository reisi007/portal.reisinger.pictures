<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    public const UPDATED_AT = null;
    protected $fillable = ['name', 'subject', 'body'];
}
