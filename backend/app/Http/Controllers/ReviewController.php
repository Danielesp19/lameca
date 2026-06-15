<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $sort = $request->input('sort', 'rating');
        $type = $request->input('type', 'desc');

        $validSort = ['rating', 'qualification', 'user_id', 'product_id'];
        $validType = ['asc', 'desc'];

        if (! in_array($sort, $validSort)) {
            return response()->json(['error' => "Invalid sort field: $sort"], 400);
        }

        if (! in_array($type, $validType)) {
            return response()->json(['error' => "Invalid sort type: $type"], 400);
        }

        $reviews = Review::orderBy($sort, $type)->get();

        return response()->json($reviews, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'comment' => 'required|string',
            'rating' => 'required|integer|min:1|max:5',
            'qualification' => 'integer|min:0',
            'user_id' => 'required|exists:users,id',
            'product_id' => 'required|exists:products,id',
        ]);

        $review = Review::create($validatedData);

        return response()->json($review, 201);
    }

    public function show(Review $review)
    {
        return response()->json($review, 200);
    }

    public function update(Request $request, Review $review)
    {
        $validatedData = $request->validate([
            'title' => 'string|max:255',
            'comment' => 'string',
            'rating' => 'integer|min:1|max:5',
            'qualification' => 'integer|min:0',
            'user_id' => 'exists:users,id',
            'product_id' => 'exists:products,id',
        ]);

        $review->update($validatedData);

        return response()->json($review, 200);
    }

    public function destroy(Review $review)
    {
        $review->delete();

        return response()->json(null, 204);
    }

    public function myReview(User $user)
    {
        // Busca todas las reviews asociadas al usuario
        $reviews = Review::where('user_id', $user->id)->get();

        // Retorna las reviews en formato JSON
        return response()->json($reviews, 200);
    }

    public function reviewProduct(Product $product)
    {
        // Busca todas las reviews asociadas al usuario
        $reviews = Review::where('product_id', $product->id)->get();

        // Retorna las reviews en formato JSON
        return response()->json($reviews, 200);
    }
}
