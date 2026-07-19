<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Support\ImageOptimizer;
use App\Support\VideoOptimizer;
use App\Support\VideoPoster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ItemAdminController extends Controller
{
    public function index()
    {
        return MenuItem::with(['category:id,name', 'extraImages'])
            ->orderBy('menu_category_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($i) => $this->fmt($i));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'caffeine_level'   => 'nullable|integer|min:0|max:3',
            'has_sugar_option' => 'nullable|boolean',
            'price'            => 'required|numeric|min:0',
            'menu_category_id' => 'required|exists:menu_categories,id',
            'video'            => 'nullable|file|mimetypes:video/mp4,video/webm,video/quicktime|max:15360',
            'new_images'       => 'nullable|array|max:4',
            'new_images.*'     => 'nullable|file|image|max:10240',
            'is_available'     => 'nullable|boolean',
            'is_featured'      => 'nullable|boolean',
            'sort_order'       => 'nullable|integer',
        ], $this->validationMessages());

        if ($request->hasFile('video')) {
            $data['video']        = VideoOptimizer::store($request->file('video'), 'menu-items/videos');
            $data['video_poster'] = VideoPoster::generate($data['video']);
        }

        $item = MenuItem::create($data);

        // All uploaded images: first = cover (image column), rest = extras
        if ($request->hasFile('new_images')) {
            $files = $request->file('new_images');
            foreach ($files as $idx => $file) {
                $path = ImageOptimizer::store($file, 'menu-items/images');
                if ($idx === 0) {
                    $item->update(['image' => $path]);
                } else {
                    $item->extraImages()->create(['path' => $path, 'sort_order' => $idx - 1]);
                }
            }
        }

        return response()->json($this->fmt($item->load('extraImages')), 201);
    }

    public function update(Request $request, MenuItem $item)
    {
        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'caffeine_level'   => 'nullable|integer|min:0|max:3',
            'has_sugar_option' => 'nullable|boolean',
            'price'            => 'sometimes|numeric|min:0',
            'menu_category_id' => 'sometimes|exists:menu_categories,id',
            'video'            => 'nullable|file|mimetypes:video/mp4,video/webm,video/quicktime|max:15360',
            'new_images'       => 'nullable|array|max:4',
            'new_images.*'     => 'nullable|file|image|max:10240',
            'is_available'     => 'nullable|boolean',
            'is_featured'      => 'nullable|boolean',
            'sort_order'       => 'nullable|integer',
        ], $this->validationMessages());

        // ── Video ─────────────────────────────────────────────────────────────
        if ($request->input('delete_anim') === '1') {
            if ($item->video) { Storage::disk('public')->delete($item->video); $data['video'] = null; }
            if ($item->video_poster) { Storage::disk('public')->delete($item->video_poster); $data['video_poster'] = null; }
        }
        if ($request->hasFile('video')) {
            if ($item->video) Storage::disk('public')->delete($item->video);
            if ($item->video_poster) Storage::disk('public')->delete($item->video_poster);
            $data['video']        = VideoOptimizer::store($request->file('video'), 'menu-items/videos');
            $data['video_poster'] = VideoPoster::generate($data['video']);
        }

        // ── Image management via slots ────────────────────────────────────────
        if ($request->has('images_managed')) {
            $this->processImageSlots($request, $item, $data);
        }

        $item->update($data);
        return response()->json($this->fmt($item->fresh(['extraImages'])));
    }

    public function destroy(MenuItem $item)
    {
        foreach (['image', 'video', 'video_poster'] as $field) {
            if ($item->$field) Storage::disk('public')->delete($item->$field);
        }
        foreach ($item->extraImages as $img) {
            Storage::disk('public')->delete($img->path);
        }
        $item->delete();
        return response()->noContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Process image_slots[] + new_images[] + delete_extra_ids[]
    //
    // image_slots[] values:
    //   "keep_cover"   → keep existing menu_items.image unchanged
    //   "extra:{id}"   → keep/reorder existing menu_item_images row
    //   "new:{idx}"    → file at new_images[{idx}]
    //
    // First slot = portada. Subsequent slots = extras (sort_order 0, 1, 2…)
    // ─────────────────────────────────────────────────────────────────────────
    private function processImageSlots(Request $request, MenuItem $item, array &$data): void
    {
        // 1. Delete explicitly removed extras
        $deleteIds = $request->input('delete_extra_ids', []);
        if ($deleteIds) {
            foreach ($item->extraImages()->whereIn('id', $deleteIds)->get() as $img) {
                Storage::disk('public')->delete($img->path);
            }
            $item->extraImages()->whereIn('id', $deleteIds)->delete();
        }

        $slots    = $request->input('image_slots', []);
        $newFiles = $request->file('new_images', []);

        if (empty($slots)) {
            // No images at all → clear cover if it existed
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
                $data['image'] = null;
            }
            return;
        }

        $coverHandled = false;
        $extraOrder   = 0;

        foreach ($slots as $slot) {
            if ($slot === 'keep_cover') {
                $coverHandled = true;

            } elseif (str_starts_with($slot, 'extra:')) {
                $id    = (int) substr($slot, 6);
                $extra = $item->extraImages()->find($id);
                if (!$extra) continue;

                if (!$coverHandled) {
                    // Promote this extra to be the new cover
                    if ($item->image) Storage::disk('public')->delete($item->image);
                    $data['image'] = $extra->path;
                    $extra->delete();
                    $coverHandled = true;
                } else {
                    $extra->update(['sort_order' => $extraOrder++]);
                }

            } elseif (str_starts_with($slot, 'new:')) {
                $idx  = (int) substr($slot, 4);
                $file = $newFiles[$idx] ?? null;
                if (!$file) continue;

                $path = ImageOptimizer::store($file, 'menu-items/images');

                if (!$coverHandled) {
                    if ($item->image) Storage::disk('public')->delete($item->image);
                    $data['image'] = $path;
                    $coverHandled  = true;
                } else {
                    $item->extraImages()->create(['path' => $path, 'sort_order' => $extraOrder++]);
                }
            }
        }

        // If no cover ended up in the slots, clear it
        if (!$coverHandled && $item->image) {
            Storage::disk('public')->delete($item->image);
            $data['image'] = null;
        }
    }

    /** Mensajes de validación en español para los archivos subidos. */
    private function validationMessages(): array
    {
        return [
            'video.max'        => 'El video supera el límite de 15 MB. Comprímelo antes de subirlo (480–720p, sin audio).',
            'video.mimetypes'  => 'El video debe ser MP4, WebM o MOV.',
            'new_images.*.max' => 'Cada imagen no puede superar los 10 MB.',
        ];
    }

    private function fmt(MenuItem $item): array
    {
        return [
            'id'               => $item->id,
            'name'             => $item->name,
            'description'      => $item->description,
            'caffeine_level'   => $item->caffeine_level,
            'has_sugar_option' => (bool) $item->has_sugar_option,
            'price'            => (float) $item->price,
            'menu_category_id' => $item->menu_category_id,
            'category_name'    => $item->category?->name,
            'image_url'        => $item->image ? asset('storage/'.$item->image) : null,
            'video_url'        => $item->video ? asset('storage/'.$item->video) : null,
            'video_poster_url' => $item->video_poster ? asset('storage/'.$item->video_poster) : null,
            // Admin gets IDs so the UI can manage individual images
            'extra_images'     => $item->extraImages->map(fn($img) => [
                'id'  => $img->id,
                'url' => asset('storage/'.$img->path),
            ])->values()->all(),
            'is_available'     => (bool) $item->is_available,
            'is_featured'      => (bool) $item->is_featured,
            'sort_order'       => $item->sort_order,
        ];
    }
}
