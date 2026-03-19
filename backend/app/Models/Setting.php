<?php

namespace AppModels;

use IlluminateDatabaseEloquentModel;

class Setting extends Model
{
    public $timestamps = false;
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = ['key', 'value'];
}
