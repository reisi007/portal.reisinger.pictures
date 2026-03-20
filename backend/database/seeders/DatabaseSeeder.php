<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Der lokale Test-User wurde entfernt. 
        // Der erste Admin wird automatisch beim Login (via .env Fallback) mit ID 1 angelegt.
    }
}
