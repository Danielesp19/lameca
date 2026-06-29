<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sede;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SedeAdminController extends Controller
{
    public function index()
    {
        return Sede::orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (Sede $s) => $this->fmt($s));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:120',
            'slug'           => 'nullable|string|max:60|unique:sedes,slug',
            'whatsapp_phone' => 'nullable|string|max:20',
            'address'        => 'nullable|string|max:200',
            'is_active'      => 'nullable|boolean',
            'sort_order'     => 'nullable|integer|min:0',
        ]);

        $data['slug'] ??= Str::slug($data['name']);
        $data['whatsapp_phone'] = $this->cleanPhone($data['whatsapp_phone'] ?? null);

        $sede = Sede::create($data);

        return response()->json($this->fmt($sede), 201);
    }

    public function update(Request $request, Sede $sede)
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:120',
            'slug'           => 'sometimes|nullable|string|max:60|unique:sedes,slug,' . $sede->id,
            'whatsapp_phone' => 'sometimes|nullable|string|max:20',
            'address'        => 'sometimes|nullable|string|max:200',
            'is_active'      => 'sometimes|boolean',
            'sort_order'     => 'sometimes|integer|min:0',
        ]);

        if (array_key_exists('whatsapp_phone', $data)) {
            $data['whatsapp_phone'] = $this->cleanPhone($data['whatsapp_phone']);
        }

        $sede->update($data);

        return response()->json($this->fmt($sede));
    }

    public function destroy(Sede $sede)
    {
        // No dejamos borrar la última sede: el sistema necesita al menos una.
        if (Sede::count() <= 1) {
            return response()->json(['error' => 'Debe existir al menos una sede.'], 422);
        }

        $sede->delete();
        return response()->noContent();
    }

    /** Deja el número solo con dígitos (formato wa.me: "573001234567"). */
    private function cleanPhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $phone);
        return $digits ?: null;
    }

    private function fmt(Sede $sede): array
    {
        return [
            'id'             => $sede->id,
            'name'           => $sede->name,
            'slug'           => $sede->slug,
            'whatsapp_phone' => $sede->whatsapp_phone,
            'address'        => $sede->address,
            'is_active'      => (bool) $sede->is_active,
            'sort_order'     => $sede->sort_order,
        ];
    }
}
