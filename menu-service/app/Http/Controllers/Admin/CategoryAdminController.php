<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoryAdminController extends Controller
{
    /** Slug de la categoría protegida donde caen los productos huérfanos. */
    private const OTROS_SLUG = 'otros';

    public function index()
    {
        return MenuCategory::withCount('items')->orderBy('sort_order')->get();
    }

    public function store(Request $request)
    {
        // El modelo deriva el slug del name (columna única en BD): sin esta
        // validación, una categoría repetida llegaba cruda a la BD y salía
        // como error 500 en vez de un mensaje claro.
        $data = $request->validate([
            'name'        => 'required|string|max:255|unique:menu_categories,name',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.unique' => 'Ya existe una categoría con ese nombre.',
        ]);
        return response()->json(MenuCategory::create($data), 201);
    }

    public function update(Request $request, MenuCategory $category)
    {
        // "Otros" es el destino fijo de productos huérfanos: si se pudiera
        // renombrar, quien borra otra categoría no sabría dónde buscar sus
        // productos.
        if ($category->slug === self::OTROS_SLUG && $request->filled('name') && $request->input('name') !== $category->name) {
            return response()->json(['message' => 'La categoría "Otros" no se puede renombrar.'], 422);
        }

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255', Rule::unique('menu_categories', 'name')->ignore($category->id)],
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ], [
            'name.unique' => 'Ya existe una categoría con ese nombre.',
        ]);
        $category->update($data);
        return response()->json($category->fresh()->loadCount('items'));
    }

    /**
     * Borra la categoría. Sus productos NUNCA se borran: se reasignan a la
     * categoría protegida "Otros" para que nada se pierda por accidente
     * (fotos, videos, cumplidos de venta, etc. quedan intactos).
     */
    public function destroy(MenuCategory $category)
    {
        if ($category->slug === self::OTROS_SLUG) {
            return response()->json(['message' => 'La categoría "Otros" no se puede eliminar.'], 422);
        }

        $otros = MenuCategory::where('slug', self::OTROS_SLUG)->first();
        if (!$otros) {
            // No debería pasar (la migración la crea), pero por si acaso.
            $otros = MenuCategory::create([
                'name'       => 'Otros',
                'sort_order' => (MenuCategory::max('sort_order') ?? -1) + 1,
            ]);
        }

        DB::transaction(function () use ($category, $otros) {
            $nextOrder = ($otros->items()->max('sort_order') ?? -1) + 1;
            foreach ($category->items as $item) {
                $item->update(['menu_category_id' => $otros->id, 'sort_order' => $nextOrder++]);
            }
            $category->delete();
        });

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
