<?php

namespace AppModels;

use IlluminateDatabaseEloquentModel;

class EmailTemplate extends Model
{
    public const UPDATED_AT = null;
    protected $fillable = ['name', 'subject', 'body'];
}
