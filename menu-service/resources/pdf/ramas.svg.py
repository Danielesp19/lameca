"""Genera `ramas.svg`: las ramas de cafeto que enmarcan la cubierta del PDF.

    python3 resources/pdf/ramas.svg.py resources/pdf/ramas.svg

Se dibuja por script y no a mano porque las hojas van pegadas a la curva del
tallo y heredan su inclinacion: mover un punto de control obliga a recalcular
la posicion y el angulo de todas.

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


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return (u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
            u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1])


def tangente(p0, p1, p2, p3, t):
    u = 1 - t
    dx = 3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0])
    dy = 3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])
    return math.degrees(math.atan2(dy, dx))


def hoja(L, W):
    """Hoja apuntando a +x con la base en el origen.

    Va rellena del color del papel a proposito: las hojas se tapan unas a
    otras y las cerezas se ven encima, como en un grabado. Sin relleno los
    trazos se cruzan todos y el conjunto se lee como un garabato.

    Los nervios laterales terminan sobre la MISMA curva que dibuja el borde,
    evaluada en el mismo parametro: con una elipse aproximada se salian del
    contorno y la hoja parecia una espina de pescado."""
    borde = ((0, 0), (L*0.16, -W*0.82), (L*0.60, -W), (L, 0))
    partes = [f'<path fill="{PAPEL}" d="M0,0 '
              f'C{L*0.16:.1f},{-W*0.82:.1f} {L*0.60:.1f},{-W:.1f} {L:.1f},0 '
              f'C{L*0.60:.1f},{W:.1f} {L*0.16:.1f},{W*0.82:.1f} 0,0 Z"/>']

    def nervio_y(x):                      # el nervio central va apenas arqueado
        u = min(max(x / L, 0.0), 1.0)
        return -W * 0.10 * math.sin(math.pi * u)

    partes.append(f'<path d="{cubica((L*0.04, 0), (L*0.55, -W*0.10), (L*0.93, 0))}"/>')
    for t in (0.24, 0.42, 0.60, 0.78):
        cx, cy = bezier(*borde, t)
        x0 = max(cx - L * 0.17, L * 0.05)   # arranque sobre el nervio central
        y0 = nervio_y(x0)
        for signo in (-1, 1):
            ex = x0 + (cx - x0) * 0.97      # se queda corto del borde a proposito
            ey = y0 + (signo * abs(cy) - y0) * 0.86
            partes.append(f'<path d="{cubica((x0, y0), ((x0+ex)/2, y0 + (ey-y0)*0.30), (ex, ey))}"/>')
    return "".join(partes)


def cereza(r):
    """Cereza de cafe: el circulo y el pliegue que la parte por la mitad."""
    k = r * 0.5523                        # el circulo, en cuatro cubicas
    circulo = (f'M0,{-r:.1f} C{k:.1f},{-r:.1f} {r:.1f},{-k:.1f} {r:.1f},0 '
               f'C{r:.1f},{k:.1f} {k:.1f},{r:.1f} 0,{r:.1f} '
               f'C{-k:.1f},{r:.1f} {-r:.1f},{k:.1f} {-r:.1f},0 '
               f'C{-r:.1f},{-k:.1f} {-k:.1f},{-r:.1f} 0,{-r:.1f} Z')
    pliegue = cubica((-r*0.55, -r*0.62), (0, 0), (-r*0.55, r*0.62))
    return f'<path fill="{PAPEL}" d="{circulo}"/><path d="{pliegue}"/>'


def rama(p0, p1, p2, p3, hojas, racimos):
    """Un tallo con sus hojas alternadas y sus racimos de cerezas.

    hojas:   (t sobre el tallo, lado, largo, ancho, giro respecto al tallo)
    racimos: (t sobre el tallo, lado, cuantas cerezas, radio)

    Los racimos se emiten al final para que queden por encima de las hojas.
    """
    tallo = [f'<path d="M{p0[0]},{p0[1]} C{p1[0]},{p1[1]} {p2[0]},{p2[1]} {p3[0]},{p3[1]}"/>']
    fronda, frutos = [], []
    for t, lado, L, A, giro in hojas:
        x, y = bezier(p0, p1, p2, p3, t)
        ang = tangente(p0, p1, p2, p3, t) + lado * giro
        fronda.append(f'<g transform="translate({x:.1f},{y:.1f}) rotate({ang:.1f})">{hoja(L, A)}</g>')
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
    (-14, 26), (86, 118), (150, 214), (292, 250),
    hojas=[
        (0.10, -1, 96, 27, 52), (0.16, 1, 84, 24, 58),
        (0.34, -1, 108, 30, 46), (0.42, 1, 92, 26, 54),
        (0.60, -1, 96, 27, 44), (0.68, 1, 80, 23, 52),
        (0.86, -1, 76, 21, 40), (0.93, 1, 62, 18, 50),
    ],
    racimos=[(0.25, 1, 3, 8.2), (0.53, -1, 3, 7.6), (0.79, 1, 2, 7.0)],
)

# Rama chica para las esquinas de abajo: mismo trazo, menos cuerpo.
CHICA = rama(
    (-10, 14), (58, 74), (104, 132), (196, 156),
    hojas=[
        (0.14, -1, 68, 19, 52), (0.22, 1, 58, 17, 58),
        (0.46, -1, 74, 21, 46), (0.55, 1, 62, 18, 54),
        (0.78, -1, 60, 17, 44), (0.88, 1, 48, 14, 52),
    ],
    racimos=[(0.34, 1, 3, 6.4), (0.68, -1, 2, 5.8)],
)

# Ramita de las paginas interiores. Va en una tira del ancho de la hoja que se
# coloca en la franja del pie, y solo puede ocupar los extremos: entre x=82 y
# x=740 estan el filete y los textos del pie. La tira entera cae dentro de la
# banda que la pagina 1 repinta, asi que en la cubierta desaparece sola y no
# hace falta esconderla aparte.
ALTO_PIE = 96
RAMITA = rama(
    (-8, 104), (10, 78), (22, 48), (46, 4),
    hojas=[
        (0.16, -1, 30, 8.5, 54), (0.28, 1, 25, 7.0, 60),
        (0.54, -1, 32, 9.0, 48), (0.66, 1, 26, 7.5, 56),
        (0.90, -1, 22, 6.0, 44),
    ],
    racimos=[(0.40, 1, 2, 3.4)],
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
