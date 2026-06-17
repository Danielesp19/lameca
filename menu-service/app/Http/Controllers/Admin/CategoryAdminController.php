<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\Request;

class CategoryAdminController extends Controller
{
    public function index()
    {
        return MenuCategory::withCount('items')->orderBy('sort_order')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);
        return response()->json(MenuCategory::create($data), 201);
    }

    public function update(Request $request, MenuCategory $category)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);
        $category->update($data);
        return response()->json($category->fresh()->loadCount('items'));
    }

    public function destroy(MenuCategory $category)
    {
        $category->delete();
        return response()->noContent();
    }
}
