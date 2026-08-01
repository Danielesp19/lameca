{{-- Carta descargable en PDF (dompdf).

     OJO — dompdf NO soporta flexbox ni `column-count`. El diseño de referencia
     está hecho con ambos, así que aquí se reconstruye a base de tablas:
       · las dos columnas son una tabla de 2 celdas con los ítems partidos
         en dos mitades por categoría;
       · la línea punteada entre nombre y precio es una celda con
         `border-bottom: dotted` que se come el espacio sobrante.
     Tampoco uses `* { ... }`: el selector universal rompe el pie fijo. --}}
@php
    $fonts = resource_path('pdf/fonts');
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
    /* Cada variante se registra como su propia familia: dompdf empareja pesos y
       estilos de forma caprichosa, y así se elige el archivo exacto. */
    @font-face { font-family: 'CormSB';  font-style: normal; font-weight: normal; src: url("{{ $fonts }}/CormorantGaramond-SemiBold.ttf") format('truetype'); }
    @font-face { font-family: 'CormSBI'; font-style: normal; font-weight: normal; src: url("{{ $fonts }}/CormorantGaramond-SemiBoldItalic.ttf") format('truetype'); }
    @font-face { font-family: 'Jost4';   font-style: normal; font-weight: normal; src: url("{{ $fonts }}/Jost-400-Book.ttf") format('truetype'); }
    @font-face { font-family: 'Jost5';   font-style: normal; font-weight: normal; src: url("{{ $fonts }}/Jost-500-Medium.ttf") format('truetype'); }
    @font-face { font-family: 'Jost6';   font-style: normal; font-weight: normal; src: url("{{ $fonts }}/Jost-600-Semi.ttf") format('truetype'); }

    /* Margen holgado, y más ancho por la izquierda: la carta se imprime y se
       archiva en un cuaderno, así que ese borde se lo come la encuadernación
       (o la perforadora). */
    @page { margin: 62px 52px 88px 82px; }
    div, h1, h2, p, table, td, span { margin: 0; padding: 0; }

    body { font-family: 'Jost4', sans-serif; font-size: 10px; color: #2e1c10; }
    header, footer, main { display: block; }

    /* Pie repetido en todas las páginas */
    footer { position: fixed; bottom: -68px; left: 0; right: 0; text-align: center;
             padding-top: 12px; border-top: 1px solid #e0cfb8; }
    footer .sedes { font-family: 'Jost5', sans-serif; font-size: 8px; letter-spacing: 0.10em;
                    color: #7d6449; text-transform: uppercase; }
    footer .fina  { font-family: 'Jost4', sans-serif; font-size: 7.6px; letter-spacing: 0.16em;
                    color: #a98c6a; text-transform: uppercase; margin-top: 5px; }

    /* ── Cubierta a página completa (1ª hoja) ──
       Reproduce la animación de entrada de la carta digital: fondo crema, el
       logo dentro de un disco de café, la marca espaciada y el filete terra.
       Va en `position:absolute` con desplazamientos negativos porque @page
       aplica márgenes a todo el contenido en flujo y aquí hace falta sangrado
       completo, de borde a borde de la hoja (A4 a 96dpi = 794x1123px). */
    /* Desplazamientos negativos = los márgenes de @page: dompdf resuelve
       `absolute` contra el área de texto, así que hay que salirse de ella para
       llegar al borde de la hoja (A4 a 96dpi = 794x1123px). */
    .cubierta { position: absolute; top: -62px; left: -82px; width: 794px; height: 1123px;
                background: #F7F1E5; text-align: center; z-index: 10; }
    /* Disco de café con el aro crema y el logo al centro. El centrado vertical
       de cada capa se hace con PADDING del contenedor, no con margin del hijo:
       sin borde ni padding propio, el margin-top del hijo se colapsa hacia
       afuera y empuja al padre en vez de separarse dentro de él (el aro crema
       quedaba pegado al borde superior del disco). */
    /* Los alto llevan descontado su propio padding-top (sin depender de
       box-sizing): 213+37 = 250 y 149+27 = 176, para que sigan siendo
       círculos exactos con su border-radius. */
    .disco     { width: 250px; height: 213px; border-radius: 125px; background: #B9895B;
                 margin: 330px auto 0; padding-top: 37px; }
    .disco-in  { width: 176px; height: 149px; border-radius: 88px; background: #FFFCF5;
                 margin: 0 auto; padding-top: 27px; }
    .disco-lg  { display: block; width: 122px; height: 122px; margin: 0 auto; }
    .cub-marca { font-family: 'CormSB', serif; font-size: 34px; letter-spacing: 0.3em;
                 color: #3E2A1C; margin-top: 62px; padding-left: 0.3em; }
    .cub-filete{ width: 40px; height: 1px; background: #BC5A32; margin: 22px auto 0; }
    .cub-lema  { font-family: 'Jost4', sans-serif; font-size: 11px; letter-spacing: 0.34em;
                 color: #8a7157; margin-top: 20px; padding-left: 0.34em; text-transform: uppercase; }

    /* ── Portada (solo primera página, va en el flujo) ── */
    .portada { text-align: center; padding-bottom: 2px; }
    .portada img { width: 46px; height: 46px; }
    .marca    { font-family: 'Jost6', sans-serif; letter-spacing: 0.42em; font-size: 19px;
                color: #3a2417; margin-top: 12px; padding-left: 0.42em; }
    .lema     { font-family: 'Jost4', sans-serif; letter-spacing: 0.28em; font-size: 9px;
                color: #9a7d5c; margin-top: 7px; padding-left: 0.28em; text-transform: uppercase; }
    .filete   { width: 38px; height: 1px; background: #c9a87e; margin: 15px auto; }
    .titulo   { font-family: 'CormSBI', serif; font-size: 42px; color: #3a2417; line-height: 1; }
    .subtitulo{ font-family: 'Jost4', sans-serif; letter-spacing: 0.16em; font-size: 9px;
                color: #a98c6a; margin-top: 11px; text-transform: uppercase; }

    /* ── Categoría ── */
    /* `avoid` evita el título huérfano al pie de página con sus productos en la
       siguiente. Aquí es seguro porque ninguna categoría es alta: con dos
       columnas, incluso la más larga ocupa pocas filas. */
    .cat { margin-top: 26px; page-break-inside: avoid; }
    /* Métodos va a una sola columna y ocupa mucho más alto que las demás: si
       se le exigiera no partirse, empujaría la categoría entera a la hoja
       siguiente dejando medio folio en blanco. Cada método por separado sí
       evita partirse (table.item ya lo hace). */
    .cat-ancha { page-break-inside: auto; }

    /* ── Métodos: una sola columna, a todo el ancho ──
       Estos rara vez llevan foto, y con el formato de dos columnas quedaba un
       cuadro beige vacío por cada uno. Sin la foto sobra ancho, así que se
       aprovecha para dar aire: tipografía más grande y la descripción a lo
       largo de toda la caja en vez de partida en media columna. La miniatura
       se muestra solo si el método realmente tiene una. */
    table.metodo { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    table.metodo td { padding: 13px 0; vertical-align: top; }
    td.m-foto { width: 94px; }
    td.m-foto img { width: 82px; height: 82px; border-radius: 10px; }
    td.m-nombre { font-family: 'CormSB', serif; font-size: 20px; color: #2e1c10; line-height: 1.15;
                  padding-right: 14px; }
    td.m-nombre.con-foto { padding-left: 14px; }
    .m-desc { font-family: 'Jost4', sans-serif; font-size: 9.4px; line-height: 1.5; color: #8a7157;
              margin-top: 6px; }
    td.m-guia div { border-bottom: 1px dotted #d6c2a6; height: 1px; margin-top: 15px; }
    td.m-precio { font-family: 'Jost5', sans-serif; font-size: 15px; color: #3a2417;
                  text-align: right; white-space: nowrap; width: 1%; padding-left: 10px; padding-top: 11px; }
    table.cat-head { width: 100%; border-collapse: collapse; margin-bottom: 9px; }
    table.cat-head td { padding: 0; vertical-align: bottom; }
    td.cat-name { font-family: 'CormSBI', serif; font-size: 22px; color: #9a4d2e; white-space: nowrap; width: 1%; }
    td.cat-rule { padding-left: 13px; }
    td.cat-rule div { border-top: 1px solid #e0cfb8; height: 1px; margin-bottom: 7px; }

    /* ── Dos columnas ── */
    /* Sin combinador `>`: la tabla lleva un <tbody> implícito y `table > tr`
       no coincidiría — los td se quedarían en `vertical-align: middle` y la
       columna más corta saldría centrada en vez de alineada arriba. */
    table.cols { width: 100%; border-collapse: collapse; }
    td.col { width: 48%; vertical-align: top; }
    td.gap { width: 4%; }

    /* ── Ítem ── */
    /* Todo alineado arriba: con descripción la fila crece, y la guía punteada y
       el precio deben quedarse a la altura del NOMBRE, no centrarse en el alto
       total. Los `margin-top`/`padding-top` de abajo los bajan hasta la línea
       base del nombre. */
    table.item { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
    table.item td { padding: 8px 0; vertical-align: top; }
    td.foto { width: 68px; }
    td.foto img { width: 58px; height: 58px; border-radius: 9px; }
    td.foto .sinfoto { width: 58px; height: 58px; background: #efe3d2; }
    td.nombre { font-family: 'CormSB', serif; font-size: 15px; color: #2e1c10; line-height: 1.15;
                padding-left: 11px; padding-right: 6px; }
    .tag { font-family: 'Jost5', sans-serif; font-size: 6.5px; letter-spacing: 0.12em; color: #a98c6a;
           border: 1px solid #ddc9ac; padding: 1px 3px; text-transform: uppercase; white-space: nowrap; }
    .desc { font-family: 'Jost4', sans-serif; font-size: 8.4px; line-height: 1.45; color: #8a7157;
            margin-top: 4px; }
    td.guia div { border-bottom: 1px dotted #d6c2a6; height: 1px; margin-top: 12px; }
    td.precio { font-family: 'Jost5', sans-serif; font-size: 12.5px; color: #3a2417;
                text-align: right; white-space: nowrap; width: 1%; padding-left: 7px; padding-top: 9px; }
</style>
</head>
<body>
    <footer>
        @if ($sedes->isNotEmpty())
            <div class="sedes">
                {{-- Dirección sí, horarios no: este pie se repite en TODAS las
                     páginas y los horarios (sobre todo los de Centro, con tres
                     tramos) lo harían crecer a varias líneas. El horario
                     completo está en la carta digital, en "Nuestras sedes". --}}
                @foreach ($sedes as $sede)
                    {{ $sede->name }}@if ($sede->address) &middot; {{ $sede->address }}@endif@if ($sede->whatsapp_phone) &middot; WhatsApp +{{ $sede->whatsapp_phone }}@endif
                    @if (! $loop->last) &nbsp;&nbsp;|&nbsp;&nbsp; @endif
                @endforeach
            </div>
        @endif
        <div class="fina">La Meca &middot; Caf&eacute; de origen &middot; Precios en pesos colombianos &middot; Carta vigente a {{ $fecha }}</div>
    </footer>

    <main>
        {{-- Cubierta: hoja completa, y salto de página para que la carta
             empiece limpia en la siguiente. --}}
        <div class="cubierta">
            <div class="disco">
                <div class="disco-in">
                    @if (is_file($logo))
                        <img class="disco-lg" src="{{ $logo }}" alt="">
                    @endif
                </div>
            </div>
            <div class="cub-marca">LA MECA</div>
            <div class="cub-filete"></div>
            <div class="cub-lema">Caf&eacute; de origen</div>
        </div>
        <div style="page-break-after: always;"></div>

        <div class="portada">
            @if (is_file($logo))
                <img src="{{ $logo }}" alt="">
            @endif
            <div class="marca">LA MECA</div>
            <div class="lema">Caf&eacute; de origen &middot; Tostado en casa</div>
            <div class="filete"></div>
            <div class="titulo">Nuestra Carta</div>
            <div class="subtitulo">Tostado en casa, servido con calma</div>
        </div>

        @foreach ($categories as $cat)
            @php
                // Partir en dos mitades: la izquierda se queda con la de más si
                // el total es impar, que es como reparte el diseño.
                $items = $cat->availableItems->values();
                $corte = (int) ceil($items->count() / 2);
                $columnas = [$items->take($corte), $items->slice($corte)];
                // "horizontal" es Métodos: en la carta digital tiene vitrina
                // propia y aquí también va distinto (ver la nota en el CSS).
                $esMetodos = $cat->display_mode === 'horizontal';
            @endphp
            <div class="cat {{ $esMetodos ? 'cat-ancha' : '' }}">
                <table class="cat-head">
                    <tr>
                        <td class="cat-name">{{ $cat->name }}</td>
                        <td class="cat-rule"><div></div></td>
                    </tr>
                </table>

                @if ($esMetodos)
                    @foreach ($items as $item)
                        @php $foto = ! empty($thumbs[$item->id]); @endphp
                        <table class="metodo">
                            <tr>
                                @if ($foto)
                                    <td class="m-foto"><img src="{{ $thumbs[$item->id] }}" alt=""></td>
                                @endif
                                <td class="m-nombre {{ $foto ? 'con-foto' : '' }}">
                                    {{ $item->name }}
                                    @if ($item->description)
                                        <div class="m-desc">{{ $item->description }}</div>
                                    @endif
                                </td>
                                <td class="m-guia"><div></div></td>
                                <td class="m-precio">${{ number_format((float) $item->price, 0, ',', '.') }}</td>
                            </tr>
                        </table>
                    @endforeach
                @else
                <table class="cols">
                    <tr>
                        @foreach ($columnas as $ci => $columna)
                            @if ($ci === 1)
                                <td class="gap"></td>
                            @endif
                            <td class="col">
                                @foreach ($columna as $item)
                                    <table class="item">
                                        <tr>
                                            <td class="foto">
                                                @if (! empty($thumbs[$item->id]))
                                                    <img src="{{ $thumbs[$item->id] }}" alt="">
                                                @else
                                                    <div class="sinfoto"></div>
                                                @endif
                                            </td>
                                            <td class="nombre">
                                                {{ $item->name }}@if ($item->caffeine_level === 0) <span class="tag">Sin cafe&iacute;na</span>@endif
                                                @if ($item->description)
                                                    <div class="desc">{{ $item->description }}</div>
                                                @endif
                                            </td>
                                            <td class="guia"><div></div></td>
                                            <td class="precio">${{ number_format((float) $item->price, 0, ',', '.') }}</td>
                                        </tr>
                                    </table>
                                @endforeach
                            </td>
                        @endforeach
                    </tr>
                </table>
                @endif
            </div>
        @endforeach
    </main>
</body>
</html>
