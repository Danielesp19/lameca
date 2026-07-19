<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Sede;
use App\Models\Table;
use App\Support\ServiceHours;
use App\Support\TableSession;
use App\Support\Turnstile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Minteo de sesión de mesa a partir del token secreto del QR (capa 1 + 5).
     *
     * El QR físico apunta aquí. Se valida la mesa y se devuelve una SESIÓN
     * cifrada de vida corta (~15 min). El token fijo de la mesa NO se devuelve:
     * el cliente solo se queda con la sesión, que caduca. Para volver a pedir
     * tras la expiración hay que re-escanear el QR.
     */
    public function mintSession(string $token)
    {
        $table = Table::with('sede')
            ->where('qr_token', $token)
            ->where('is_active', true)
            ->first();

        if (! $table || ($table->sede && ! $table->sede->is_active)) {
            return response()->json(['error' => 'Mesa no válida'], 404);
        }

        $session = TableSession::issue($table);

        return response()->json([
            'session'    => $session,
            'expires_in' => TableSession::ttlMinutes() * 60,
            'table'      => [
                'number' => $table->number,
                'label'  => $table->label(),
            ],
            'sede' => $table->sede ? [
                'id'             => $table->sede->id,
                'name'           => $table->sede->name,
                'whatsapp_phone' => $table->sede->whatsapp_phone,
            ] : null,
        ]);
    }

    /**
     * Listado público de sedes (para el botón de WhatsApp del menú público).
     * Solo expone lo necesario: nombre y número de contacto.
     */
    public function sedes()
    {
        return Sede::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Sede $s) => [
                'id'             => $s->id,
                'name'           => $s->name,
                'whatsapp_phone' => $s->whatsapp_phone,
                'address'        => $s->address,
            ]);
    }

    /**
     * Crea un pedido (o una llamada al mesero).
     * Capas anti-abuso: 1) sesión de mesa firmada y corta  2) rate limit (ruta)
     *                   3) Turnstile  4) registro de IP para flag de abuso.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'session'          => 'required|string',
            'type'             => 'nullable|in:order,call',
            'note'             => 'nullable|string|max:500',
            'turnstile_token'  => 'nullable|string',
            'items'            => 'nullable|array|max:50',
            'items.*.id'          => 'required|integer|exists:menu_items,id',
            'items.*.quantity'    => 'required|integer|min:1|max:50',
            'items.*.notes'       => 'nullable|string|max:200',
            'items.*.sugar_level' => 'nullable|string|max:30',
        ]);

        // ── Capa 1: la sesión debe ser válida y no haber expirado ─────────────
        $payload = TableSession::verify($data['session']);
        if (! $payload) {
            return response()->json([
                'error'   => 'Tu sesión de mesa expiró. Vuelve a escanear el QR.',
                'expired' => true,
            ], 419);
        }

        $table = Table::where('id', $payload['tid'])
            ->where('is_active', true)
            ->first();

        if (! $table) {
            return response()->json(['error' => 'Mesa no válida o inactiva'], 422);
        }

        // ── Horario de atención: fuera de horario no entra nada ───────────────
        if (! ServiceHours::isOpen()) {
            return response()->json([
                'error' => 'En este momento estamos fuera del horario de atención.',
            ], 422);
        }

        // ── Tope de pedidos activos por mesa (frena inundación aunque la URL
        //    del QR se haya filtrado; el mesero libera cupo al atenderlos) ──────
        $maxActive = (int) config('coffee.max_active_orders', 3);
        if ($maxActive > 0 && $table->orders()->active()->count() >= $maxActive) {
            return response()->json([
                'error' => 'Esta mesa ya tiene pedidos en curso. Un mesero pasará a atenderlos.',
            ], 422);
        }

        // ── Capa 3: Turnstile (se omite si no hay clave configurada) ──────────
        if (! Turnstile::verify($data['turnstile_token'] ?? null, $request->ip())) {
            return response()->json(['error' => 'Verificación de seguridad fallida'], 422);
        }

        $type = $data['type'] ?? 'order';

        // Una "llamada al mesero" no requiere productos.
        if ($type === 'order' && empty($data['items'])) {
            return response()->json(['error' => 'El pedido no tiene productos'], 422);
        }

        // ── Precios desde la BD, NUNCA del cliente (anti-manipulación) ────────
        $lines = [];
        $total = 0;

        if (! empty($data['items'])) {
            $ids   = collect($data['items'])->pluck('id')->all();
            $menu  = MenuItem::whereIn('id', $ids)
                ->where('is_available', true)
                ->get()
                ->keyBy('id');

            foreach ($data['items'] as $row) {
                $item = $menu->get($row['id']);
                if (! $item) {
                    return response()->json(['error' => 'Un producto ya no está disponible'], 422);
                }
                $qty   = (int) $row['quantity'];
                $price = (float) $item->price;
                $total += $price * $qty;

                // El nivel de azúcar solo se guarda si el producto lo permite.
                $sugar = $item->has_sugar_option ? ($row['sugar_level'] ?? null) : null;

                $lines[] = [
                    'menu_item_id' => $item->id,
                    'name'         => $item->name,
                    'price'        => $price,
                    'quantity'     => $qty,
                    'notes'        => $row['notes'] ?? null,
                    'sugar_level'  => $sugar,
                ];
            }
        }

        $order = DB::transaction(function () use ($table, $type, $data, $total, $lines) {
            $order = Order::create([
                'table_id'    => $table->id,
                'sede_id'     => $table->sede_id,
                'table_label' => $table->label(),
                'type'        => $type,
                'status'      => 'pending',
                'total'       => $total,
                'note'        => $data['note'] ?? null,
                'ip'          => request()->ip(),
                'expires_at'  => now()->addMinutes((int) config('coffee.order_ttl', 45)),
            ]);

            if ($lines) {
                $order->items()->createMany($lines);
            }

            return $order;
        });

        return response()->json([
            'id'      => $order->id,
            'status'  => $order->status,
            'message' => $type === 'call'
                ? 'Un mesero va en camino'
                : 'Pedido recibido, un mesero lo confirmará en tu mesa',
        ], 201);
    }
}
