<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderAdminController extends Controller
{
    /**
     * Listado paginado para render rápido.
     * - Usa el índice (status, created_at).
     * - Pagina (25 por página) en vez de traer todo el historial.
     * - Capa 4: marca mesas con muchos descartes recientes.
     *
     * Query params: ?status=active|pending|seen|served|dismissed|expired|all  &page=N
     */
    public function index(Request $request)
    {
        $status  = $request->query('status', 'active');
        // El tablero trae todo el operativo del día sin paginar (se purga cada noche).
        $perPage = $status === 'board' ? 300 : min((int) $request->query('per_page', 25), 100);

        $query = Order::query()
            ->with(['items:id,order_id,name,price,quantity,notes,sugar_level'])
            ->when($request->filled('sede_id'), fn ($q) => $q->where('sede_id', $request->query('sede_id')))
            ->orderByDesc('created_at');

        match ($status) {
            'active'  => $query->whereIn('status', ['pending', 'seen']),
            'board'   => $query->whereIn('status', ['pending', 'seen', 'served', 'billed']),
            'all'     => null,
            default   => $query->where('status', $status),
        };

        $page = $query->paginate($perPage);

        // Capa 4: # de descartes por mesa en las últimas 24h → bandera de abuso.
        $tableIds = collect($page->items())->pluck('table_id')->filter()->unique()->all();
        $abuse = $tableIds
            ? Order::whereIn('table_id', $tableIds)
                ->whereIn('status', ['dismissed', 'expired'])
                ->where('created_at', '>=', now()->subDay())
                ->groupBy('table_id')
                ->select('table_id', DB::raw('count(*) as c'))
                ->pluck('c', 'table_id')
            : collect();

        return response()->json([
            'data' => collect($page->items())->map(fn (Order $o) => $this->fmt($o, (int) ($abuse[$o->table_id] ?? 0))),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page'    => $page->lastPage(),
                'total'        => $page->total(),
                'per_page'     => $page->perPage(),
            ],
        ]);
    }

    /**
     * Conteo ligero para el polling del panel (badge + sonido).
     * No trae filas, solo el número → barato de llamar cada pocos segundos.
     */
    public function pendingCount(Request $request)
    {
        $sedeId = $request->query('sede_id');

        return response()->json([
            'pending' => Order::where('status', 'pending')
                ->when($sedeId, fn ($q) => $q->where('sede_id', $sedeId))->count(),
            'active'  => Order::whereIn('status', ['pending', 'seen'])
                ->when($sedeId, fn ($q) => $q->where('sede_id', $sedeId))->count(),
        ]);
    }

    /** Cambia el estado del tablero: seen | served | billed | dismissed (se puede mover en cualquier dirección). */
    public function updateStatus(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,seen,served,billed,dismissed',
        ]);

        $order->update(['status' => $data['status']]);

        return response()->json($this->fmt($order->load('items')));
    }

    private function fmt(Order $order, int $tableDismissals = 0): array
    {
        return [
            'id'          => $order->id,
            'table_label' => $order->table_label,
            'table_id'    => $order->table_id,
            'sede_id'     => $order->sede_id,
            'type'        => $order->type,
            'status'      => $order->status,
            'total'       => (float) $order->total,
            'note'        => $order->note,
            'created_at'  => $order->created_at?->toIso8601String(),
            // Capa 4: si la mesa tiene varios descartes recientes, el panel la resalta.
            'abuse_flag'  => $tableDismissals >= 3,
            'abuse_count' => $tableDismissals,
            'items'       => $order->items->map(fn ($i) => [
                'name'        => $i->name,
                'price'       => (float) $i->price,
                'quantity'    => $i->quantity,
                'notes'       => $i->notes,
                'sugar_level' => $i->sugar_level,
            ])->values()->all(),
        ];
    }
}
