<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Run application seeders
        $this->call([
            UserSeeder::class,
        ]);
    }
}