<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        /*
         * updateOrCreate keeps this seeder safe to run multiple times.
         * User model has password cast set to "hashed", so plain "password"
         * will be hashed automatically before storing.
         */
        User::updateOrCreate(
            ['email' => 'admin@nexerp.com'],
            [
                'name' => 'Admin User',
                'password' => 'Admin@1234',
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'member@nexerp.com'],
            [
                'name' => 'Member User',
                'password' => 'Member@1234',
                'role' => 'member',
            ]
        );
    }
}