<?php

namespace App\Http\Controllers;

use App\Models\Producer;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $sort = $request->input('sort', 'name');
        $type = $request->input('type', 'asc');

        $validSort = ['name', 'price', 'region', 'quantity'];
        $validType = ['asc', 'desc'];

        if (! in_array($sort, $validSort)) {
            return response()->json(['error' => "Invalid sort field: $sort"], 400);
        }

        if (! in_array($type, $validType)) {
            return response()->json(['error' => "Invalid sort type: $type"], 400);
        }

        $products = Product::orderBy($sort, $type)->get();

        return response()->json($products, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'flavor' => 'required|string|max:255',
            'preparation_method' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'region' => 'required|string|max:255',
            'quantity' => 'integer|min:1',
            'producer_id' => 'nullable|exists:producers,id',
        ]);

        $product = Product::create($validatedData);

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product, 200);
    }

    public function update(Request $request, Product $product)
    {
        $validatedData = $request->validate([
            'name' => 'string|max:255',
            'description' => 'string',
            'flavor' => 'string|max:255',
            'preparation_method' => 'string|max:255',
            'price' => 'numeric|min:0',
            'region' => 'string|max:255',
            'quantity' => 'integer|min:1',
            'producer_id' => 'nullable|exists:producers,id',
        ]);

        $product->update($validatedData);

        return response()->json($product, 200);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(null, 204);
    }

    public function getMyProducts(Producer $producer)
    {
        // Consulta para obtener los productos asociados al productor
        $products = Product::where('producer_id', $producer->id)->get();

        // Retornar los productos en formato JSON
        return response()->json($products, 200);
    }
}
