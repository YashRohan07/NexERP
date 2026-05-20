<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Default admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@nexerp.com',
            'password' => 'password',
            'role' => 'admin',
        ]);

        // Default member user
        User::create([
            'name' => 'Member User',
            'email' => 'member@nexerp.com',
            'password' => 'password',
            'role' => 'member',
        ]);
    }
}