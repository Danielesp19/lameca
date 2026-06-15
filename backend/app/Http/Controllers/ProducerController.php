<?php

namespace App\Http\Controllers;

use App\Models\Producer;
use Illuminate\Http\Request;

class ProducerController extends Controller
{
    public function index()
    {
        $producers = Producer::all();

        return response()->json($producers, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:producers',
            'password' => 'required|string|min:8',
            'region' => 'required|string|max:255',
            'balance' => 'required|numeric|min:0',
            'bio' => 'nullable|string',
        ]);
        $producer = new Producer;
        $producer->name = $request->name;
        $producer->email = $request->email;
        $producer->password = bcrypt($request->password);
        $producer->region = $request->region;
        $producer->balance = $request->balance;
        $producer->bio = $request->bio;
        $producer->save();

        return response()->json($producer, 201);
    }

    public function show(Producer $producer)
    {
        return response()->json($producer, 200);
    }

    public function update(Request $request, Producer $producer)
    {
        $validatedData = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:producers,email,'.$producer->id,
            'password' => 'nullable|string|min:8',
            'region' => 'string|max:255',
            'balance' => 'numeric|min:0',
            'bio' => 'nullable|string',
        ]);

        $producer->update($validatedData);

        return response()->json($producer, 200);
    }

    public function destroy(Producer $producer)
    {
        $producer->delete();

        return response()->json(null, 204);
    }
}
