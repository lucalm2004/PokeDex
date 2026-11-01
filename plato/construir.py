#!/usr/bin/env python3
"""Junta src/ en un único index.html jugable sin servidor (y una versión sin envoltorio para publicar).

Uso: python3 construir.py [ruta_de_la_version_sin_envoltorio]
"""
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
SRC = RAIZ / "src"
ORDEN = ["pixel.js", "interfaz.js", "heroes.js", "monstruos.js", "fondos.js",
         "heroes_hd.js", "monstruos_hd_a.js", "monstruos_hd_b.js", "jefes_hd.js", "pnj_hd.js",
         "fondos_hd_a.js", "fondos_hd_b.js", "fondos_hd_c.js", "iconos_hd.js",
         "datos.js", "contenido.js", "historia.js", "escenario.js", "juego.js"]


def leer(nombre):
    return (SRC / nombre).read_text(encoding="utf-8")


def main():
    plantilla = leer("plantilla.html")
    cabeza, cuerpo = plantilla.split("<!--CUERPO-->")
    js = "\n".join(leer(f) for f in ORDEN if (SRC / f).exists())
    if "</script" in js:
        sys.exit("El JavaScript no puede contener '</script'")
    cabeza = cabeza.replace("/*CSS*/", leer("estilo.css"))
    cuerpo = cuerpo.replace("/*JS*/", js)
    completo = (
        "<!doctype html>\n<html lang=\"es\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        + cabeza + "</head>\n<body>\n" + cuerpo + "</body>\n</html>\n"
    )
    (RAIZ / "index.html").write_text(completo, encoding="utf-8")
    if len(sys.argv) > 1:
        pathlib.Path(sys.argv[1]).write_text(cabeza + cuerpo, encoding="utf-8")
    faltan = [f for f in ORDEN if not (SRC / f).exists()]
    print(f"index.html: {len(completo) // 1024} KB" + (f" (faltan: {', '.join(faltan)})" if faltan else ""))


if __name__ == "__main__":
    main()
