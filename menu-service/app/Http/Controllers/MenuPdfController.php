<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\Sede;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

/**
 * Carta en PDF para descargar (GET /api/menu/pdf).
 *
 * Se genera con dompdf a partir de la vista `pdf.carta` y se cachea en disco:
 * solo se re-genera cuando algo del menú o las sedes cambia (hash de
 * updated_at). Las fotos entran como miniaturas JPEG cuadradas (también
 * cacheadas) para que el archivo pese poco; los videos se ignoran.
 */
class MenuPdfController extends Controller
{
    public function __invoke()
    {
        $categories = MenuCategory::where('is_active', true)
            ->with('availableItems')
            ->orderBy('sort_order')
            ->get()
            ->filter(fn ($cat) => $cat->availableItems->isNotEmpty())
            ->values();

        $sedes = Sede::where('is_active', true)->orderBy('sort_order')->get();

        $version = md5(
            $categories->map(fn ($cat) => $cat->id . ':' . $cat->updated_at
                . '|' . $cat->availableItems->map(fn ($i) => $i->id . ':' . $i->updated_at)->implode(','))->implode(';')
            . '#' . $sedes->map(fn ($s) => $s->id . ':' . $s->updated_at)->implode(',')
        );

        $disk = Storage::disk('local');
        $file = "carta/carta-{$version}.pdf";

        if (! $disk->exists($file)) {
            $thumbs = [];
            foreach ($categories as $cat) {
                foreach ($cat->availableItems as $item) {
                    if ($item->image) {
                        $thumbs[$item->id] = $this->thumbnail($item->image);
                    }
                }
            }

            $pdf = Pdf::loadView('pdf.carta', [
                'categories' => $categories,
                'sedes'      => $sedes,
                'thumbs'     => $thumbs,
                'logo'       => resource_path('pdf/logo.png'),
                'fecha'      => now()->timezone(config('coffee.timezone', 'America/Bogota'))
                                     ->locale('es')->isoFormat('MMMM [de] YYYY'),
            ])->setPaper('a4');

            // Una sola versión viva: al regenerar se limpian las anteriores.
            foreach ($disk->files('carta') as $old) {
                if ($old !== $file) {
                    $disk->delete($old);
                }
            }

            $disk->put($file, $pdf->output());
        }

        return response()->file($disk->path($file), [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="carta-la-meca.pdf"',
            // El CDN puede servirla un rato sin pegar al backend.
            'Cache-Control'       => 'public, max-age=300, s-maxage=600',
        ]);
    }

    /**
     * Miniatura JPEG cuadrada (240px) de la foto del producto, cacheada por
     * contenido. Devuelve la ruta absoluta (dompdf lee archivos locales) o
     * null si la imagen no se puede procesar.
     */
    private function thumbnail(string $imagePath): ?string
    {
        $publicDisk = Storage::disk('public');
        if (! $publicDisk->exists($imagePath)) {
            return null;
        }

        $local = Storage::disk('local');
        $thumb = 'carta-thumbs/' . md5($imagePath . '|' . $publicDisk->lastModified($imagePath)) . '.jpg';

        if (! $local->exists($thumb)) {
            try {
                $manager = new ImageManager(
                    extension_loaded('imagick') ? new ImagickDriver() : new GdDriver()
                );
                $encoded = $manager->decodePath($publicDisk->path($imagePath))
                    ->cover(240, 240)
                    ->encode(new JpegEncoder(quality: 82));
                $local->put($thumb, (string) $encoded);
            } catch (\Throwable $e) {
                Log::warning('Carta PDF: no se pudo generar miniatura', [
                    'image' => $imagePath,
                    'error' => $e->getMessage(),
                ]);

                return null;
            }
        }

        return $local->path($thumb);
    }
}
