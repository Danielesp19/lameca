"""Genera las ramas de cafeto que enmarcan el PDF de la carta.

    python3 resources/pdf/ramas.svg.py resources/pdf

Escribe dos archivos: `ramas.svg` (la orla grande de la cubierta) y
`ramas-pie.svg` (la ramita pequena que se repite al pie de las paginas de
dentro).

Se dibuja por script y no a mano porque las hojas van pegadas a la curva del
tallo y heredan su inclinacion: mover un punto de control obliga a recalcular
la posicion y el angulo de todas. Y la hoja de cafeto en si son ~90 puntos de
contorno ondulado mas una docena de nervios curvos, que a mano no se sostiene.

El modelo es la hoja de cafeto de verdad, que es lo que distingue el dibujo de
una hoja generica: ancha y oblonga, con la punta estirada (acuminada), el
BORDE ONDULADO y los nervios laterales arqueados hacia la punta, no rectos.

Dos limites del renderizador (php-svg-lib, el que usa dompdf) mandan sobre el
resultado y conviene no olvidarlos al retocar el dibujo:

  · NO se usan curvas cuadraticas (`Q`). php-svg-lib las traduce al operador
    `v` del PDF, que es una cubica cuyo primer control coincide con el punto de
    partida — no es lo mismo, y la curva sale deformada (en la libreria eso
    esta marcado con un "FIXME not accurate"). Aqui toda curva se emite como
    cubica `C`, convirtiendo las cuadraticas con la equivalencia exacta.
  · Solo se emiten <path> y <g transform>, que es lo que la libreria
    interpreta con seguridad: nada de <use>, degradados ni CSS interno.
"""
import math
import sys

PAPEL = "#F7F1E5"   # el crema del fondo de la cubierta
ORO   = "#CBA97A"   # dorado claro, un punto mas suave que el filete de la marca

W, H = 794, 1123    # A4 a 96dpi: la hoja completa
# En la pagina 1 el pie se tapa repintando la franja inferior (ver el
# page_script de MenuPdfController). Lo que caiga ahi desaparece, asi que el
# dibujo de abajo se apoya en ese borde y no en el del papel.
SUELO = 1020


def cubica(p0, c, p1):
    """Una cuadratica escrita como cubica exacta (control a 2/3 hacia C)."""
    c1 = (p0[0] + 2 / 3 * (c[0] - p0[0]), p0[1] + 2 / 3 * (c[1] - p0[1]))
    c2 = (p1[0] + 2 / 3 * (c[0] - p1[0]), p1[1] + 2 / 3 * (c[1] - p1[1]))
    return (f"M{p0[0]:.1f},{p0[1]:.1f} C{c1[0]:.1f},{c1[1]:.1f} "
            f"{c2[0]:.1f},{c2[1]:.1f} {p1[0]:.1f},{p1[1]:.1f}")


def catmull(pts, cerrado=False):
    """Cadena de cubicas que pasa por todos los puntos dados.

    El borde ondulado de la hoja se define muestreando su ancho punto a punto;
    esto convierte esa nube de puntos en curva suave (Catmull-Rom pasado a
    Bezier, que es la conversion estandar: los controles a un sexto de la
    cuerda entre los vecinos)."""
    p = list(pts)
    ext = ([p[-1]] + p + [p[0], p[1]]) if cerrado else ([p[0]] + p + [p[-1]])
    d = [f"M{p[0][0]:.1f},{p[0][1]:.1f}"]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}")
    return " ".join(d) + (" Z" if cerrado else "")


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return (u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
            u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1])


def tangente(p0, p1, p2, p3, t):
    u = 1 - t
    dx = 3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0])
    dy = 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])
    return math.degrees(math.atan2(dy, dx))


# Perfil de la hoja de cafeto: oblonga, mas ancha algo antes de la mitad y con
# la punta estirada. t^A·(1-t)^B da esa silueta; se normaliza para que el
# maximo valga 1 y el parametro de ancho signifique lo que dice.
_A, _B = 0.58, 0.78
_TOPE = max((t/600) ** _A * (1 - t/600) ** _B for t in range(1, 600))
ONDAS = 7          # ondulaciones del borde a cada lado
ARQUEO = 0.11      # cuanto se arquea el nervio central


def _ancho(t, W):
    """Semiancho de la hoja en t, con el borde ondulado.

    La onda multiplica al perfil en vez de sumarse: asi se desvanece sola en la
    base y en la punta, donde el ancho tiende a cero, y el contorno cierra
    limpio sin retocar los extremos."""
    cuerpo = (t ** _A) * ((1 - t) ** _B) / _TOPE
    # la onda se apaga hacia la punta: a plena amplitud le salia un rizo justo
    # en el apice y la hoja parecia partida en dos
    amplitud = 0.062 * math.sin(math.pi * t) ** 0.55
    return W * cuerpo * (1 + amplitud * math.sin(ONDAS * 2 * math.pi * t + 0.7))


def _nervio(t, L, W):
    return (t * L, -ARQUEO * W * math.sin(math.pi * t))


def hoja(L, W, nervios=8):
    """Hoja de cafeto apuntando a +x, con la base en el origen.

    Va rellena del color del papel a proposito: las hojas se tapan unas a otras
    y las cerezas se ven encima, como en un grabado. Sin relleno los trazos se
    cruzan todos y el conjunto se lee como un garabato."""
    pasos = 44
    arriba, abajo = [], []
    for i in range(pasos + 1):
        t = i / pasos
        cx, cy = _nervio(t, L, W)
        a = _ancho(t, W)
        arriba.append((cx, cy - a))
        abajo.append((cx, cy + a))
    contorno = arriba + abajo[::-1][1:-1]

    partes = [f'<path fill="{PAPEL}" d="{catmull(contorno, cerrado=True)}"/>']
    partes.append(f'<path d="{catmull([_nervio(i/12, L, W) for i in range(13)])}"/>')

    # Nervios laterales: salen del nervio central y se arquean hacia la punta,
    # como en la hoja de verdad. Terminan un poco antes del borde.
    for i in range(1, nervios + 1):
        t0 = 0.08 + 0.80 * (i - 1) / max(nervios - 1, 1)
        # el alcance se acorta hacia la punta: con un salto fijo, los ultimos
        # nervios se juntaban todos en el apice
        t1 = min(t0 + 0.17 * (1 - t0), 0.97)
        x0, y0 = _nervio(t0, L, W)
        cx1, cy1 = _nervio(t1, L, W)
        for signo in (-1, 1):
            x1 = cx1
            y1 = cy1 + signo * _ancho(t1, W) * 0.84
            ctrl = (x0 + (x1 - x0) * 0.35, y0 + (y1 - y0) * 0.82)
            partes.append(f'<path d="{cubica((x0, y0), ctrl, (x1, y1))}"/>')
    return "".join(partes)


def cereza(r):
    """Cereza de cafe: el circulo, el pliegue que la parte y el resto del caliz."""
    k = r * 0.5523                        # el circulo, en cuatro cubicas
    circulo = (f'M0,{-r:.1f} C{k:.1f},{-r:.1f} {r:.1f},{-k:.1f} {r:.1f},0 '
               f'C{r:.1f},{k:.1f} {k:.1f},{r:.1f} 0,{r:.1f} '
               f'C{-k:.1f},{r:.1f} {-r:.1f},{k:.1f} {-r:.1f},0 '
               f'C{-r:.1f},{-k:.1f} {-k:.1f},{-r:.1f} 0,{-r:.1f} Z')
    pliegue = cubica((-r*0.52, -r*0.66), (r*0.10, 0), (-r*0.52, r*0.66))
    caliz = cubica((r*0.55, -r*0.30), (r*0.95, 0), (r*0.55, r*0.30))
    return (f'<path fill="{PAPEL}" d="{circulo}"/>'
            f'<path d="{pliegue}"/><path d="{caliz}"/>')


def rama(p0, p1, p2, p3, hojas, racimos):
    """Un tallo con sus hojas alternadas y sus racimos de cerezas.

    hojas:   (t sobre el tallo, lado, largo, giro respecto al tallo)
             El ancho no se pasa: la hoja de cafeto es ~2,4:1, asi que sale del
             largo y no hay que cuadrar dos numeros a cada retoque.
    racimos: (t sobre el tallo, lado, cuantas cerezas, radio)

    Los racimos se emiten al final para que queden por encima de las hojas.
    """
    tallo = [f'<path d="M{p0[0]},{p0[1]} C{p1[0]},{p1[1]} {p2[0]},{p2[1]} {p3[0]},{p3[1]}"/>']
    fronda, frutos = [], []
    # de la punta hacia la base: asi las hojas del arranque quedan ENCIMA, que
    # es como se ve una rama de frente. Al reves, alguna quedaba tapada casi
    # entera por su vecina y solo asomaba la punta, que se leia como una mota
    # suelta en medio del papel.
    for t, lado, L, giro in sorted(hojas, key=lambda h: -h[0]):
        x, y = bezier(p0, p1, p2, p3, t)
        ang = tangente(p0, p1, p2, p3, t) + lado * giro
        nervios = max(5, min(9, round(L / 15)))
        # peciolo: la hoja no nace pegada al tallo, cuelga de un rabillo corto
        peciolo = L * 0.10
        fronda.append(
            f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f})">'
            f'<path d="M0,0 L{peciolo:.1f},0"/>'
            f'<g transform="translate({peciolo:.1f},0)">{hoja(L, L * 0.21, nervios)}</g>'
            f'</g>')
    for t, lado, cuantas, r in racimos:
        x, y = bezier(p0, p1, p2, p3, t)
        ang = math.radians(tangente(p0, p1, p2, p3, t) + lado * 90)
        for i in range(cuantas):
            # el racimo cuelga separado del tallo y se abre en abanico: pegado
            # al tallo lo tapaban las hojas
            sep = (i - (cuantas - 1) / 2) * r * 2.3
            fuera = r * (2.9 - abs(i - (cuantas - 1) / 2) * 0.55)
            px = x + math.cos(ang) * fuera - math.sin(ang) * sep
            py = y + math.sin(ang) * fuera + math.cos(ang) * sep
            rabo = ((x + px) / 2 - math.sin(ang) * sep * 0.3,
                    (y + py) / 2 + math.cos(ang) * sep * 0.3)
            frutos.append(f'<path d="{cubica((x, y), rabo, (px, py))}"/>')
            frutos.append(f'<g transform="translate({px:.1f},{py:.1f})">{cereza(r)}</g>')
    return "".join(tallo + fronda + frutos)


# Rama principal: entra por la esquina superior izquierda y baja abriendose.
GRANDE = rama(
    (-16, 20), (92, 116), (156, 218), (300, 258),
    hojas=[
        (0.07, -1, 118, 54), (0.13, 1, 104, 60),
        (0.28, -1, 136, 50), (0.35, 1, 120, 56),
        (0.50, -1, 128, 48), (0.57, 1, 112, 54),
        (0.72, -1, 112, 46), (0.79, 1, 96, 52),
        (0.93, -1, 88, 44), (0.99, 1, 74, 50),
    ],
    racimos=[(0.21, 1, 4, 8.0), (0.45, -1, 3, 7.4), (0.66, 1, 4, 7.6), (0.88, -1, 3, 6.8)],
)

# Rama chica para las esquinas de abajo: mismo trazo, menos cuerpo.
CHICA = rama(
    (-12, 12), (62, 76), (110, 138), (204, 162),
    hojas=[
        (0.10, -1, 84, 54), (0.18, 1, 74, 60),
        (0.40, -1, 92, 50), (0.49, 1, 80, 56),
        (0.71, -1, 78, 46), (0.80, 1, 66, 52),
        (0.96, -1, 58, 44),
    ],
    racimos=[(0.29, 1, 3, 6.2), (0.60, -1, 3, 5.8)],
)

# Ramita de las paginas interiores. Va en una tira del ancho de la hoja que se
# coloca en la franja del pie, y solo puede ocupar los extremos: entre x=82 y
# x=740 estan el filete y los textos del pie. La tira entera cae dentro de la
# banda que la pagina 1 repinta, asi que en la cubierta desaparece sola y no
# hace falta esconderla aparte.
ALTO_PIE = 96   # tiene que coincidir con .pie-ramas en carta.blade.php
# El dibujo tiene que caber ENTERO en la tira, con holgura arriba y abajo:
# dompdf coloca el elemento fijo unos pixeles mas arriba de lo que sale del
# calculo en CSS, y lo que se salga por arriba asoma por encima de la franja
# que la pagina 1 repinta (aparecian dos motas sueltas en la cubierta, una en
# cada esquina de abajo). Medida sobre el render, la ramita ocupa y 8..72 de
# los 80 de la tira: ~8px de aire por arriba y por abajo.
RAMITA = rama(
    (-8, 90), (8, 74), (20, 54), (42, 30),
    hojas=[
        (0.14, -1, 30, 56), (0.28, 1, 25, 62),
        (0.52, -1, 31, 50), (0.66, 1, 26, 58),
        (0.90, -1, 22, 46),
    ],
    racimos=[(0.40, 1, 2, 3.2)],
)

pie = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{ALTO_PIE}" viewBox="0 0 {W} {ALTO_PIE}">
<!-- Generado por resources/pdf/ramas.svg.py — no editar a mano. -->
<g fill="none" stroke="{ORO}" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">
  <g transform="translate(0,0)">{RAMITA}</g>
  <g transform="translate({W},0) scale(-1,1)">{RAMITA}</g>
</g>
</svg>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<!-- Generado por resources/pdf/ramas.svg.py — no editar a mano. -->
<g fill="none" stroke="{ORO}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">
  <g transform="translate(0,0)">{GRANDE}</g>
  <g transform="translate({W},0) scale(-1,1)">{GRANDE}</g>
  <g transform="translate(0,{SUELO}) scale(1,-1)">{CHICA}</g>
  <g transform="translate({W},{SUELO}) scale(-1,-1)">{CHICA}</g>
</g>
</svg>'''

carpeta = sys.argv[1] if len(sys.argv) > 1 else "."
for nombre, contenido in (("ramas.svg", svg), ("ramas-pie.svg", pie)):
    open(f"{carpeta}/{nombre}", "w").write(contenido)
    print(f"{len(contenido):6} bytes -> {carpeta}/{nombre}")
