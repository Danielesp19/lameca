<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\Sede;
use Illuminate\Http\Request;
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
    /**
     * Versión del diseño de la carta. SÚBELA cada vez que cambies
     * `resources/views/pdf/carta.blade.php` o cualquier archivo de
     * `resources/pdf` (fuentes, logo, ramas de la cubierta): entra en el hash
     * del archivo cacheado, y sin eso el servidor seguiría entregando el PDF
     * viejo hasta que alguien editara un producto. El hash NO mira esos
     * archivos, solo esta constante.
     */
    private const DISENO = 11;

    public function __invoke(Request $request)
    {
        // ?sede=campestre → carta de esa sede (los productos que no se ofrecen
        // ahí no salen). Sin el parámetro: carta completa, como siempre.
        $sede = $request->query('sede')
            ? Sede::where('slug', $request->query('sede'))->where('is_active', true)->first()
            : null;

        $categories = MenuCategory::where('is_active', true)
            ->with(['availableItems.sedes:id'])
            ->orderBy('sort_order')
            ->get();

        if ($sede) {
            // No se puede filtrar la relación en la consulta y quedarse con la
            // colección ya cargada: se filtra en memoria y se reasigna, que a
            // esta escala (decenas de productos) no cuesta nada.
            $categories->each(fn ($cat) => $cat->setRelation(
                'availableItems',
                $cat->availableItems->filter(fn ($i) => $i->sedes->contains('id', $sede->id))->values()
            ));
        }

        $categories = $categories
            ->filter(fn ($cat) => $cat->availableItems->isNotEmpty())
            ->values();

        // El pie lleva solo la sede de la carta cuando está filtrada.
        $sedes = $sede
            ? collect([$sede])
            : Sede::where('is_active', true)->orderBy('sort_order')->get();

        $version = md5(
            'd' . self::DISENO . '#s' . ($sede->slug ?? 'todas') . '#'
            . $categories->map(fn ($cat) => $cat->id . ':' . $cat->updated_at
                . '|' . $cat->availableItems->map(fn ($i) => $i->id . ':' . $i->updated_at)->implode(','))->implode(';')
            . '#' . $sedes->map(fn ($s) => $s->id . ':' . $s->updated_at)->implode(',')
        );

        // El nombre lleva el ámbito (sede o "todas") porque abajo se limpian
        // las versiones viejas: sin distinguirlo, generar la carta de una sede
        // borraría la de la otra y cada descarga re-generaría el PDF entero.
        $ambito = $sede->slug ?? 'todas';
        $disk = Storage::disk('local');
        $file = "carta/carta-{$ambito}-{$version}.pdf";

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
                'ramas'      => resource_path('pdf/ramas.svg'),
                'ramasPie'   => resource_path('pdf/ramas-pie.svg'),
                'fecha'      => now()->timezone(config('coffee.timezone', 'America/Bogota'))
                                     ->locale('es')->isoFormat('MMMM [de] YYYY'),
            ])->setPaper('a4');

            // El pie va en `position:fixed` y dompdf lo pinta SIEMPRE al final,
            // por encima de todo — ni el z-index de la cubierta lo tapa. Como
            // en la portada no pinta nada (es una cubierta limpia), se repinta
            // la franja inferior del color del fondo solo en la página 1.
            // Coordenadas en puntos (A4 = 595.28 x 841.89) y color #F7F1E5.
            // render() va ANTES a propósito: el canvas definitivo se crea
            // durante el renderizado, así que registrar el script sobre el
            // canvas previo no tendría efecto (se pierde al reemplazarse).
            $pdf->render();
            $pdf->getDomPDF()->getCanvas()->page_script(
                'if ($PAGE_NUM == 1) { $pdf->filled_rectangle(0, 770, 595.28, 72, array(0.969, 0.945, 0.898)); }'
            );

            // Una sola versión viva POR ÁMBITO: al regenerar la carta de una
            // sede se limpian sus versiones anteriores, sin tocar las de las
            // otras sedes ni la carta completa.
            foreach ($disk->files('carta') as $old) {
                if ($old !== $file && str_starts_with(basename($old), "carta-{$ambito}-")) {
                    $disk->delete($old);
                }
            }

            $disk->put($file, $pdf->output());
        }

        return response()->file($disk->path($file), [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="carta-la-meca'
                                     . ($sede ? '-' . $sede->slug : '') . '.pdf"',
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
