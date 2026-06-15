<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Bebidas Calientes',
                'slug' => 'bebidas-calientes',
                'description' => 'Cafés y bebidas para entrar en calor',
                'sort_order' => 1,
                'items' => [
                    ['name' => 'Espresso', 'description' => 'Café concentrado, 30ml de puro sabor.', 'price' => 3500],
                    ['name' => 'Americano', 'description' => 'Espresso suavizado con agua caliente.', 'price' => 4000],
                    ['name' => 'Cappuccino', 'description' => 'Espresso con leche vaporizada y espuma.', 'price' => 5500, 'is_featured' => true],
                    ['name' => 'Latte', 'description' => 'Espresso con abundante leche cremosa.', 'price' => 6000],
                ],
            ],
            [
                'name' => 'Bebidas Frías',
                'slug' => 'bebidas-frias',
                'description' => 'Refrescantes opciones para el calor',
                'sort_order' => 2,
                'items' => [
                    ['name' => 'Cold Brew', 'description' => 'Café infusionado en frío 12 horas.', 'price' => 7000, 'is_featured' => true],
                    ['name' => 'Iced Latte', 'description' => 'Latte sobre hielo.', 'price' => 6500],
                    ['name' => 'Frappé de Caramelo', 'description' => 'Café frío con caramelo y crema.', 'price' => 8000],
                ],
            ],
            [
                'name' => 'Pastelería',
                'slug' => 'pasteleria',
                'description' => 'El complemento perfecto para tu café',
                'sort_order' => 3,
                'items' => [
                    ['name' => 'Croissant de Mantequilla', 'description' => 'Hojaldrado y recién horneado.', 'price' => 4500],
                    ['name' => 'Muffin de Arándanos', 'description' => 'Esponjoso con arándanos frescos.', 'price' => 4000],
                    ['name' => 'Cheesecake de Café', 'description' => 'Cremoso con base de galleta y espresso.', 'price' => 6500, 'is_featured' => true],
                ],
            ],
            [
                'name' => 'Granos & Merch',
                'slug' => 'granos-merch',
                'description' => 'Lleva el café a casa',
                'sort_order' => 4,
                'items' => [
                    ['name' => 'Bolsa 250g (Blend House)', 'description' => 'Nuestra mezcla exclusiva tostada media.', 'price' => 28000],
                    ['name' => 'Bolsa 250g (Origen Huila)', 'description' => 'Café de origen único, notas frutales.', 'price' => 32000, 'is_featured' => true],
                    ['name' => 'Taza Coffee Club', 'description' => 'Taza cerámica 350ml con nuestro logo.', 'price' => 22000],
                ],
            ],
        ];

        foreach ($categories as $catData) {
            $items = $catData['items'];
            unset($catData['items']);

            $category = MenuCategory::create($catData);

            foreach ($items as $i => $itemData) {
                MenuItem::create(array_merge([
                    'menu_category_id' => $category->id,
                    'is_available'     => true,
                    'is_featured'      => false,
                    'sort_order'       => $i + 1,
                ], $itemData));
            }
        }
    }
}
