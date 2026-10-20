# -*- coding: utf-8 -*-
"""Saca el logotipo oficial de IBERO Tijuana en vectorial, para la web.

Del PDF oficial 2026/00_RECURSOS/Logos/IBEROTijuana_LOGO.pdf:
  página 1 → la versión en BLANCO, que es la que va sobre el rojo
  página 2 → la versión en negro

Se usa la de blanco dentro de una caja roja #EA242F: ése es el
membrete oficial, el mismo que trae el formato de autorización de
viaje que manda la oficina. El logotipo NO se recorta ni se
reacomoda, va entero dentro de su caja.

Queda logo-ibero.svg, vectorial: imprime y escala sin pixelearse,
que era justo el problema de dibujarlo con CSS.
"""
import pathlib
import re

import fitz

AQUI = pathlib.Path(__file__).resolve().parent
OFICIAL = (pathlib.Path(r"C:\Users\leonardo.gonzalez\Documents\IBERO - DG")
           / "2026" / "00_RECURSOS" / "Logos" / "IBEROTijuana_LOGO.pdf")


def main():
    d = fitz.open(OFICIAL)
    pg = d[0]                                   # la versión en blanco
    svg = pg.get_svg_image()

    # Fuera el ancho y alto fijos: que mande la caja del HTML. El
    # viewBox se queda, que es lo que guarda la proporción.
    svg = re.sub(r'(<svg[^>]*?)\swidth="[^"]*"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\sheight="[^"]*"', r"\1", svg, count=1)

    destino = AQUI / "logo-ibero.svg"
    destino.write_text(svg, encoding="utf-8")

    print("  %s" % destino.name)
    print("  caja %.0f × %.0f · proporción %.3f · %d trazos · %d KB"
          % (pg.rect.width, pg.rect.height, pg.rect.width / pg.rect.height,
             svg.count("<path"), len(svg) // 1024))


if __name__ == "__main__":
    main()
