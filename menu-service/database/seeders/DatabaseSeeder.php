<?php

namespace Database\Seeders;

use App\Models\User;
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
        // Admin por defecto para el panel Filament
        User::factory()->create([
            'name'  => 'Admin',
            'email' => 'admin@coffeeclub.com',
        ]);

        $this->call(MenuSeeder::class);
    }
}
