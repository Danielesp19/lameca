<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CategoryAdminController extends Controller
{
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
     * Borra la categoría. Sus productos caen en cascada a nivel de base de
     * datos (constraint), pero eso NUNCA pasa por el código de Laravel que
     * limpia imágenes/videos del storage (ver ItemAdminController::destroy).
     * Por eso aquí se borran primero los archivos físicos de cada producto y
     * su galería — si no, quedan huérfanos en disco para siempre.
     */
    public function destroy(MenuCategory $category)
    {
        $disk = Storage::disk('public');

        foreach ($category->items()->with('extraImages')->get() as $item) {
            foreach (['image', 'video', 'video_poster'] as $field) {
                if ($item->$field) $disk->delete($item->$field);
            }
            foreach ($item->extraImages as $img) {
                $disk->delete($img->path);
            }
        }

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
