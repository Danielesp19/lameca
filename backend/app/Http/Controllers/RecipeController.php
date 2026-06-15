<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index(Request $request)
    {
        // Obtener todas las recetas, ordenadas por el campo deseado (por ejemplo, 'created_at')
        $recipes = Recipe::orderBy('created_at', 'desc')->get();

        // Retornar las recetas en formato JSON
        return response()->json($recipes, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'publication_date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'user_id' => 'required|exists:users,id',
        ]);

        $recipe = Recipe::create($validatedData);

        return response()->json($recipe, 201);
    }

    public function show(Recipe $recipe)
    {
        return response()->json($recipe, 200);
    }

    public function update(Request $request, Recipe $recipe)
    {
        $validatedData = $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'publication_date' => 'date',
            'product_id' => 'exists:products,id',
            'user_id' => 'exists:users,id',
        ]);

        $recipe->update($validatedData);

        return response()->json($recipe, 200);
    }

    public function destroy(Recipe $recipe)
    {
        $recipe->delete();

        return response()->json(null, 204);
    }
}
