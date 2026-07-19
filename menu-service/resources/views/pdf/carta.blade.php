{{-- Carta descargable en PDF (dompdf). Estética de la carta web: crema/chocolate/terracota. --}}
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
    @page { margin: 118px 52px 88px 52px; }
    /* OJO (dompdf): nada de `* { ... }` (el selector universal rompe la
       cabecera/pie fijos) y nada de margin en html/body (pisa los márgenes
       de @page). Reset explícito solo sobre elementos de contenido: */
    div, h1, h2, p, table, td, span { margin: 0; padding: 0; }

    body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #3E2A1C; }

    /* dompdf no conoce las etiquetas semánticas de HTML5: forzar bloque */
    header, footer, main { display: block; }

    /* Fondo crema a sangre completa, repetido en cada página (medidas fijas:
       dompdf no estira con top+bottom; A4 = 794x1123px, se sobrepasa y recorta) */
    .bg { position: fixed; top: -118px; left: -52px; width: 900px; height: 1400px; background: #F7F1E5; z-index: -10; }

    /* Cabecera repetida en todas las páginas */
    header { position: fixed; top: -92px; left: 0; right: 0; text-align: center; }
    header img { width: 40px; height: 40px; }
    .brand { font-family: 'DejaVu Serif', serif; font-size: 15px; font-weight: bold; letter-spacing: 7px; color: #3E2A1C; margin-top: 5px; }
    .tagline { font-size: 7.4px; letter-spacing: 3.2px; text-transform: uppercase; color: #9A7055; margin-top: 4px; }

    /* Pie repetido en todas las páginas */
    footer { position: fixed; bottom: -66px; left: 0; right: 0; text-align: center; color: #8A6F57; font-size: 7.8px; line-height: 1.65; padding-top: 8px; border-top: 0.6px solid #E2D6C6; }
    footer .sede { font-weight: bold; color: #6B5744; }

    /* Portada tipográfica de la primera página */
    .titulo { text-align: center; margin: 4px 0 20px; }
    .titulo .bienvenido { font-size: 8px; letter-spacing: 4.5px; text-transform: uppercase; color: #BC5A32; }
    .titulo h1 { font-family: 'DejaVu Serif', serif; font-style: italic; font-size: 27px; font-weight: normal; color: #3E2A1C; margin-top: 6px; }
    .titulo .nota { font-size: 8.2px; color: #9A7055; margin-top: 7px; }

    /* Categorías */
    .cat { margin-top: 16px; }
    .cat-head { margin-bottom: 6px; }
    .cat-head h2 { font-family: 'DejaVu Serif', serif; font-style: italic; font-size: 15.5px; font-weight: bold; color: #3E2A1C; display: inline; }
    .cat-head .linea { border-top: 1px solid rgba(62,42,28,0.18); margin-top: 5px; }
    .cat-desc { font-size: 8.6px; color: #9A7055; margin: 2px 0 6px; }

    /* Productos: una fila por producto */
    table.items { width: 100%; border-collapse: collapse; }
    table.items td { vertical-align: top; padding: 7px 0; border-bottom: 0.6px solid #E8DCCB; }
    table.items tr { page-break-inside: avoid; }
    td.foto { width: 46px; padding-right: 12px; }
    td.foto img { width: 40px; height: 40px; }
    td.foto .sinfoto { width: 40px; height: 40px; background: #EFE5D5; }
    .nombre { font-family: 'DejaVu Serif', serif; font-style: italic; font-size: 12px; font-weight: bold; color: #BC5A32; }
    .destacado { font-size: 7.6px; color: #6E8B4E; font-weight: bold; letter-spacing: 1px; }
    .desc { font-size: 8.8px; color: #7A6551; line-height: 1.5; margin-top: 2.5px; max-width: 360px; }
    td.precio { width: 76px; text-align: right; white-space: nowrap; }
    .precio-num { font-family: 'DejaVu Serif', serif; font-size: 12px; font-weight: bold; color: #3E2A1C; }
</style>
</head>
<body>
    <div class="bg"></div>

    <header>
        @if (is_file($logo))
            <img src="{{ $logo }}" alt="">
        @endif
        <div class="brand">LA MECA</div>
        <div class="tagline">Café de origen &middot; tostado en casa</div>
    </header>

    <footer>
        @if ($sedes->isNotEmpty())
            <div>
                @foreach ($sedes as $sede)
                    <span class="sede">{{ $sede->name }}</span>@if ($sede->address) &mdash; {{ $sede->address }}@endif @if ($sede->whatsapp_phone) &middot; WhatsApp +{{ $sede->whatsapp_phone }}@endif
                    @if (! $loop->last) &nbsp;&nbsp;|&nbsp;&nbsp; @endif
                @endforeach
            </div>
        @endif
        <div>Precios en pesos colombianos. Carta vigente a {{ $fecha }} &mdash; pueden variar sin previo aviso.</div>
    </footer>

    <main>
        <div class="titulo">
            <div class="bienvenido">Bienvenido</div>
            <h1>Nuestra Carta</h1>
            <div class="nota">Tostado en casa, servido con calma</div>
        </div>

        @foreach ($categories as $cat)
            <div class="cat">
                <div class="cat-head">
                    <h2>{{ $cat->name }}</h2>
                    <div class="linea"></div>
                    @if ($cat->description)
                        <div class="cat-desc">{{ $cat->description }}</div>
                    @endif
                </div>

                <table class="items">
                    @foreach ($cat->availableItems as $item)
                        <tr>
                            <td class="foto">
                                @if (! empty($thumbs[$item->id]))
                                    <img src="{{ $thumbs[$item->id] }}" alt="">
                                @else
                                    <div class="sinfoto"></div>
                                @endif
                            </td>
                            <td>
                                <span class="nombre">{{ $item->name }}</span>
                                @if ($item->is_featured)
                                    <span class="destacado">&nbsp;&#9733; DESTACADO</span>
                                @endif
                                @if ($item->caffeine_level === 0)
                                    <span class="destacado" style="color:#9A7055;">&nbsp;SIN CAFE&Iacute;NA</span>
                                @endif
                                @if ($item->description)
                                    <div class="desc">{{ $item->description }}</div>
                                @endif
                            </td>
                            <td class="precio">
                                <span class="precio-num">${{ number_format((float) $item->price, 0, ',', '.') }}</span>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
        @endforeach
    </main>
</body>
</html>
