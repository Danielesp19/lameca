<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sede;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TableAdminController extends Controller
{
    public function index(Request $request)
    {
        return Table::with('sede')
            ->when($request->filled('sede_id'), fn ($q) => $q->where('sede_id', $request->query('sede_id')))
            ->orderBy('sede_id')
            ->orderBy('number')
            ->get()
            ->map(fn ($t) => $this->fmt($t));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sede_id'   => 'required|integer|exists:sedes,id',
            'number'    => [
                'required', 'string', 'max:50',
                Rule::unique('tables', 'number')->where(fn ($q) => $q->where('sede_id', $request->input('sede_id'))),
            ],
            'name'      => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        $table = Table::create($data); // qr_token se genera solo (modelo)

        return response()->json($this->fmt($table->load('sede')), 201);
    }

    public function update(Request $request, Table $table)
    {
        $data = $request->validate([
            'sede_id'   => 'sometimes|integer|exists:sedes,id',
            'number'    => [
                'sometimes', 'string', 'max:50',
                Rule::unique('tables', 'number')
                    ->where(fn ($q) => $q->where('sede_id', $request->input('sede_id', $table->sede_id)))
                    ->ignore($table->id),
            ],
            'name'      => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        $table->update($data);

        return response()->json($this->fmt($table->load('sede')));
    }

    public function destroy(Table $table)
    {
        $table->delete();
        return response()->noContent();
    }

    /** Capa 5: rotar el token de una mesa (invalida QRs viejos/fotografiados). */
    public function rotateToken(Table $table)
    {
        $table->update([
            'qr_token'         => Table::freshToken(),
            'token_rotated_at' => now(),
        ]);

        return response()->json($this->fmt($table));
    }

    private function fmt(Table $table): array
    {
        return [
            'id'               => $table->id,
            'sede_id'          => $table->sede_id,
            'sede_name'        => $table->sede?->name,
            'number'           => $table->number,
            'name'             => $table->name,
            'label'            => $table->label(),
            'qr_token'         => $table->qr_token,
            'token_rotated_at' => $table->token_rotated_at?->toIso8601String(),
            'is_active'        => (bool) $table->is_active,
        ];
    }
}
