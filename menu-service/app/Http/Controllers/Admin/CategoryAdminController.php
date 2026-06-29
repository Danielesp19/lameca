<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    /**
     * Reordena las categorías. Recibe los ids en el orden deseado y reasigna
     * sort_order = posición (0, 1, 2, …) en una sola transacción.
     */
    public function reorder(Request $request)
    {
        $data = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:menu_categories,id',
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['ids'] as $position => $id) {
                MenuCategory::where('id', $id)->update(['sort_order' => $position]);
            }
        });

        return MenuCategory::withCount('items')->orderBy('sort_order')->get();
    }
}
