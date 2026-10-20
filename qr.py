# -*- coding: utf-8 -*-
"""El QR del registro, en rojo institucional y a 1800 px.

Mismo criterio que el de Casa Abierta: módulos redondeados, ojos en
vino, corrección de error alta y SIN logotipo al centro, para que
aguante la lectura de lejos y de reojo, que es como se escanea un
cartel.

Salen tres archivos en qr/:
  qr-registro.png        suelto, fondo transparente
  qr-registro-blanco.png sobre cuadro blanco, para carteles oscuros
  qr-registro-tarjeta.png con el texto, para pegar en redes

Y AL FINAL SE DECODIFICA LO DIBUJADO. Un QR que no se probó es un
QR que no sirve; aquí se lee con OpenCV y se compara contra la
dirección, no contra lo que uno cree que escribió.
"""
import pathlib
import sys

import cv2
import numpy as np
import qrcode
from PIL import Image, ImageDraw, ImageFont
from qrcode.constants import ERROR_CORRECT_H

AQUI = pathlib.Path(__file__).resolve().parent
SALIDA = AQUI / "qr"
DIRECCION = "https://cci-iberotj.github.io/conferencia-canaco/"

ROJO, VINO, BLANCO = (234, 36, 47), (123, 30, 46), (255, 255, 255)
BORDE, LADO = 4, 1800


def en_ojo(r, c, n):
    for er, ec in [(BORDE, BORDE), (BORDE, n - BORDE - 7), (n - BORDE - 7, BORDE)]:
        if er <= r < er + 7 and ec <= c < ec + 7:
            return True
    return False


def dibujar(texto, lado=LADO):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, border=BORDE, box_size=1)
    qr.add_data(texto)
    qr.make(fit=True)
    m = qr.get_matrix()
    n = len(m)
    u = lado / n
    im = Image.new("RGBA", (lado, lado), (255, 255, 255, 0))
    d = ImageDraw.Draw(im)

    for r in range(n):
        for c in range(n):
            if not m[r][c] or en_ojo(r, c, n):
                continue
            x, y = c * u, r * u
            d.rounded_rectangle([x, y, x + u, y + u], radius=u * .36, fill=ROJO)

    # Los tres ojos, dibujados aparte para que salgan limpios y en vino.
    for er, ec in [(BORDE, BORDE), (BORDE, n - BORDE - 7), (n - BORDE - 7, BORDE)]:
        x, y = ec * u, er * u
        d.rounded_rectangle([x, y, x + 7 * u, y + 7 * u], radius=u * 1.2,
                            outline=VINO, width=int(round(u)))
        d.rounded_rectangle([x + 2 * u, y + 2 * u, x + 5 * u, y + 5 * u],
                            radius=u * .7, fill=VINO)
    return im, n


def sobre_blanco(im):
    fondo = Image.new("RGB", im.size, BLANCO)
    fondo.paste(im, (0, 0), im)
    return fondo


def tarjeta(im):
    """El QR con el texto debajo, para mandar por WhatsApp o redes."""
    an, al = 1200, 1560
    t = Image.new("RGB", (an, al), BLANCO)
    q = sobre_blanco(im).resize((980, 980), Image.LANCZOS)
    t.paste(q, ((an - 980) // 2, 70))

    d = ImageDraw.Draw(t)
    try:
        gorda = ImageFont.truetype("arialbd.ttf", 62)
        normal = ImageFont.truetype("arial.ttf", 42)
        chica = ImageFont.truetype("arial.ttf", 34)
    except OSError:
        gorda = normal = chica = ImageFont.load_default()

    def centrado(txt, y, fuente, color):
        w = d.textbbox((0, 0), txt, font=fuente)[2]
        d.text(((an - w) / 2, y), txt, font=fuente, fill=color)

    centrado("Aparta tu lugar", 1090, gorda, (25, 23, 19))
    centrado("Conferencias Empresariales · CANACO", 1178, normal, (70, 63, 56))
    centrado("22 de octubre · 4:00 p.m.", 1234, normal, (70, 63, 56))
    d.rounded_rectangle([(an - 620) / 2, 1320, (an + 620) / 2, 1400], radius=40, fill=ROJO)
    centrado("Sólo 25 lugares", 1338, normal, BLANCO)
    centrado("tijuana.ibero.mx", 1452, chica, (101, 92, 84))
    return t


def comprobar(ruta, esperado):
    """Lo lee de vuelta. Si no coincide, truena aquí y no en el cartel."""
    img = cv2.imread(str(ruta))
    leido, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    bien = leido == esperado
    print("   %-34s %s" % (ruta.name, "lee bien" if bien else "NO COINCIDE: %r" % leido))
    return bien


def main():
    SALIDA.mkdir(exist_ok=True)
    im, n = dibujar(DIRECCION)
    print("  %d × %d módulos · %s\n" % (n, n, DIRECCION))

    suelto = SALIDA / "qr-registro.png"
    blanco = SALIDA / "qr-registro-blanco.png"
    carta = SALIDA / "qr-registro-tarjeta.png"
    im.save(suelto)
    sobre_blanco(im).save(blanco)
    tarjeta(im).save(carta)

    print("  COMPROBANDO QUE DE VERDAD SE LEAN")
    todos = all(comprobar(p, DIRECCION) for p in (blanco, carta))
    if not todos:
        sys.exit("\n  Algún QR no se lee. No lo mandes así.")
    print("\n  Listos en %s" % SALIDA)


if __name__ == "__main__":
    main()
