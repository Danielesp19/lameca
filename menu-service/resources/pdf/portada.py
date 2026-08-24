"""Hornea las imagenes de la cubierta del PDF a partir de las ilustraciones.

    python3 resources/pdf/portada.py resources/pdf

Escribe `portada.png` (la capa de ramas de la cubierta) y `ramas-pie.png` (la
tira que se repite al pie de las paginas de dentro), leyendo los originales de
`resources/pdf/ramas/`.

Por que se hornea en vez de colocar cada PNG desde el Blade: el diseno apoya
las ramas en `opacity` y en `transform: rotate`, y el soporte de dompdf para
ambas es irregular. Aqui la opacidad y el giro se aplican con Pillow y quedan
grabados en el pixel, asi que dompdf solo tiene que pintar una imagen plana.
De paso se evita que la misma ilustracion se incruste seis veces en el PDF.

Las medidas salen del diseno original (`Carta Portada.dc.html`, carta de
816x1056). La cubierta util del PDF mide 794x1027 — no 1123 — porque en la
pagina 1 la franja de abajo se repinta para tapar el pie (ver el page_script
de MenuPdfController): esa franja ES el borde inferior efectivo de la hoja.
Da la casualidad de que 794/816 y 1027/1056 coinciden en 0,973, asi que el
diseno entero entra a escala uniforme.
"""
import os
import sys

from PIL import Image

DISENO = (816, 1056)     # la hoja del diseno original
HOJA = (794, 1027)       # la parte visible de la cubierta del PDF
K = HOJA[0] / DISENO[0]  # 0,973: la misma escala en ancho y en alto
S = 1.4                  # muestreo del horneado (a 1,37 los originales van 1:1)

VELO = 22                # ver `sin_velo()`


def sin_velo(im):
    """Quita el velo tenue que cubre el rectangulo entero de algunos originales.

    Los dos PNG de abajo traen ~70% de su superficie con alfa entre 6 y 40:
    un tinte oscuro uniforme de borde recto que, sobre el crema, se ve como un
    recuadro palido (se nota en el propio diseno de origen). Se resta ese
    umbral y se re-escala lo que queda, de modo que el degradado real de los
    trazos se conserva y el rectangulo desaparece."""
    alfa = im.getchannel("A").point(
        lambda a: 0 if a <= VELO else min(255, round((a - VELO) * 255 / (255 - VELO))))
    im.putalpha(alfa)
    return im


def pieza(ruta, ancho_diseno, opacidad, giro=0):
    """Un original listo para pegar: sin velo, a su tamano y con la opacidad
    y el giro del diseno ya aplicados."""
    im = sin_velo(Image.open(ruta).convert("RGBA"))
    ancho = round(ancho_diseno * K * S)
    im = im.resize((ancho, round(ancho * im.height / im.width)), Image.LANCZOS)
    if opacidad < 1:
        im.putalpha(im.getchannel("A").point(lambda a: round(a * opacidad)))
    if giro:
        # CSS gira en sentido horario y Pillow al reves; el giro es sobre el
        # centro, que es como se comporta `transform: rotate`
        im = im.rotate(-giro, resample=Image.BICUBIC, expand=True)
    return im


def pegar(lienzo, im, *, left=None, right=None, top=None, bottom=None, caja=None):
    """Coloca una pieza con las coordenadas del diseno (px de la hoja de 816).

    `caja` es el tamano sin girar: al girar con expand la imagen crece, y CSS
    mantiene la pieza centrada en el hueco que ocupaba, asi que el sobrante se
    reparte a los dos lados."""
    an, al = caja or (im.width, im.height)
    x = round(left * K * S) if left is not None else lienzo.width - an - round(right * K * S)
    y = round(top * K * S) if top is not None else lienzo.height - al - round(bottom * K * S)
    x -= (im.width - an) // 2
    y -= (im.height - al) // 2
    lienzo.alpha_composite(im, (x, y))


def cubierta(origen):
    # Transparente, no con el crema pintado: dompdf pinta las cajas colocadas
    # (la imagen) por encima del contenido en flujo, asi que un fondo opaco
    # aqui tapaba el aro y el titulo de la cubierta. El crema lo pone el fondo
    # de .cubierta en el Blade.
    lienzo = Image.new("RGBA", (round(HOJA[0] * S), round(HOJA[1] * S)), (0, 0, 0, 0))
    r = lambda n: os.path.join(origen, n)

    # Las dos grandes de arriba, a plena opacidad.
    pegar(lienzo, pieza(r("branch-top-left.png"), 330, 0.9), left=-46, top=-24)
    pegar(lienzo, pieza(r("branch-top-right.png"), 330, 0.9), right=-46, top=-24)

    # Las de abajo, a poco mas de media tinta. Se salen por el borde inferior:
    # como ese borde es donde empieza la franja repintada, el sangrado queda
    # igual que en el diseno.
    pegar(lienzo, pieza(r("branch-bottom-left.png"), 206, 0.495), left=-30, bottom=-18)
    pegar(lienzo, pieza(r("branch-bottom-right.png"), 206, 0.495), right=-30, bottom=-18)

    # Dos apuntes girados a media altura, casi transparentes.
    caja = lambda a: (round(a * K * S), None)
    for lado, arch, giro in (("left", "branch-bottom-left.png", -14),
                             ("right", "branch-bottom-right.png", 14)):
        base = pieza(r(arch), 150, 1.0)          # sin girar, para saber su caja
        im = pieza(r(arch), 150, 0.28, giro)
        pegar(lienzo, im, **{lado: -58}, top=round(DISENO[1] * 0.44),
              caja=(base.width, base.height))
    return lienzo


def tira_pie(origen, ancho=794, alto=96):
    """La ramita de las paginas interiores: la misma ilustracion, pequena, en
    los dos extremos de una tira del ancho del papel.

    Solo puede haber dibujo en los extremos: entre x=82 y x=740 estan el filete
    y los textos del pie. Y tiene que quedar aire por arriba, porque dompdf
    coloca el elemento fijo unos pixeles mas alto de lo que sale del calculo en
    CSS y lo que asome por encima de la franja repintada se ve en la cubierta."""
    lienzo = Image.new("RGBA", (round(ancho * S), round(alto * S)), (0, 0, 0, 0))
    for arch, lado in (("branch-bottom-left.png", "left"), ("branch-bottom-right.png", "right")):
        im = sin_velo(Image.open(os.path.join(origen, arch)).convert("RGBA"))
        an = round(78 * S)
        im = im.resize((an, round(an * im.height / im.width)), Image.LANCZOS)
        im.putalpha(im.getchannel("A").point(lambda a: round(a * 0.45)))
        x = round(-16 * S) if lado == "left" else lienzo.width - an - round(-16 * S)
        lienzo.alpha_composite(im, (x, round(14 * S)))
    return lienzo


COLORES = 64             # ver `guardar()`


def guardar(im, destino):
    """Guarda en PNG de paleta. La ilustracion es tinta de un solo color sobre
    transparencia, asi que 64 entradas la reproducen sin diferencia apreciable
    (medido: 0,25% de error medio) y el archivo baja de 732 KB a 119 KB, que en
    el PDF se nota porque la cubierta se incrusta entera."""
    im.quantize(colors=COLORES, method=Image.FASTOCTREE).save(destino, optimize=True)


if __name__ == "__main__":
    carpeta = sys.argv[1] if len(sys.argv) > 1 else "."
    origen = os.path.join(carpeta, "ramas")
    for nombre, im in (("portada.png", cubierta(origen)), ("ramas-pie.png", tira_pie(origen))):
        destino = os.path.join(carpeta, nombre)
        guardar(im, destino)
        print(f"{os.path.getsize(destino) // 1024:5} KB  {im.size}  -> {destino}")
