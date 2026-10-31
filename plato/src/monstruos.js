/* Dados y Mazmorras · monstruos y personajes no jugadores en pixel art.
   Cada entrada de MONSTRUOS (enemigos) y de PNJ devuelve una Rejilla nueva de 36×36, con contorno
   y mirando a la izquierda, hacia los héroes. Los PNJ con cuerpo humano salen de HEROES.componer. */
const { MONSTRUOS, PNJ } = (() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R } = PX;
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  /* Rampas propias (5 tonos, de la sombra al brillo): piel gris verdosa del trol y azul pálido del fantasma. */
  const CENIZA = ["#262b23", "#3d463a", "#5f6b59", "#8b9881", "#bac4ab"];
  const ESPECTRO = ["#1e2c3c", "#3c5a74", "#6a92ae", "#9cc2d8", "#d8eef6"];
  /* Una clase que heroes.js no conoce viste una túnica lisa, sin tocado ni objeto propio. */
  const LLANO = "llano";

  /* Varios píxeles del mismo tono de una rampa. */
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Trazos de 1 píxel que salen de un mismo punto (garras, dedos, plumas). */
  const abanico = (c, x, y, puntas) => { puntas.forEach(([a, b]) => c.linea(x, y, x + a, y + b, 1)); return c; };
  /* Muesca triangular con la punta hacia arriba, para deshilachar bordes inferiores. */
  const muesca = (x, y, abajo = 35.5, ancho = 1.7) => new Capa().poly([[x - ancho, abajo], [x, y], [x + ancho, abajo]]);
  /* Pinta una capa solo donde no hay nada todavía, como si quedara detrás. */
  function detras(g, capa, ram, op) {
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (g.get(x, y)) capa.off(x, y);
    return capa.pintar(g, ram, op);
  }
  /* Rellena una capa con un degradado tramado entre dos tonos; f(x, y) va de 0 a 1. */
  function tramar(g, capa, ram, i0, i1, f) {
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++)
      if (capa.tiene(x, y)) g.set(x, y, ram[f(x, y) > PX.umbral(x, y) ? i1 : i0], ram);
  }
  /* Línea fina sin contorno: solo pinta los píxeles vacíos. */
  function hilo(g, x0, y0, x1, y1, color) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (!g.get(x, y)) g.set(x, y, color);
    }
  }
  /* Destello de cuatro puntas, sin contorno. */
  const destello = (g, x, y, ram = R.bronce) => { pon(g, ram, 4, [x, y]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!g.get(x + a, y + b)) pon(g, HUESO, 4, [x + a, y + b]); }); };
  /* Borde iluminado arriba a la izquierda, para que lo muy oscuro se lea sobre fondos oscuros. */
  function bordeLuz(g, ram, tono = 3) {
    const borde = [];
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++)
      if (g.rampa(x, y) === ram && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < tono) borde.push([x, y]);
    pon(g, ram, tono, ...borde);
  }
  /* Torso y falda como los de heroes.js. */
  const torso = t => new Capa().rect(t.torL, t.torTop, t.torR - t.torL + 1, t.torBot - t.torTop + 1).off(t.torL, t.torTop).off(t.torR, t.torTop);
  const falda = (t, largo, vuelo) => new Capa().poly([[t.torL, t.torBot - 1], [t.torR + 1, t.torBot - 1], [t.torR + 1 + vuelo, t.pierTop + largo], [t.torL - vuelo, t.pierTop + largo]]);
  /* Brazo de delante de un héroe (sin manga), para repintarlo encima de lo que lo tape. */
  function brazoDelante(g, t, piel) {
    const [hx, hy] = t.hombro, [cx, cy] = t.codo, [mx, my] = t.mano;
    new Capa().linea(hx, hy, cx, cy, 2).pintar(g, piel, { relieve: 1.5, separar: true });
    new Capa().linea(cx, cy, mx - 1, my, 2).pintar(g, piel, { relieve: 1.5, separar: true });
    new Capa().rect(mx - 1, my - 1, 2, 2).pintar(g, piel, { relieve: 1, separar: true });
  }

  /* ---------- Monstruos ---------- */
  function rata() {
    const g = new Rejilla(), G = R.piel.gris, C = R.pelo.castano, P = R.piel.clara;
    new Capa().curva(31, 18, 35, 15, 33, 9, 2, 1).pintar(g, P, { relieve: 1, max: 2 });
    new Capa().ell(26.5, 16.5, 6, 4.2).ell(21, 16, 2.8, 2.6).poly([[21, 13.5], [15, 16.5], [15.5, 17.5], [21, 19]]).pintar(g, G, { relieve: 2.5, max: 3 });
    new Capa().ell(22.5, 12.8, 1.6, 1.6).pintar(g, G, { relieve: 1, max: 3, separar: true });
    pon(g, P, 2, [22, 13]);
    pon(g, R.sangre, 4, [18, 15]);
    pon(g, P, 3, [15, 17]);
    pon(g, P, 2, [18, 19], [19, 19]);
    new Capa().curva(25, 30, 35, 34, 33, 24, 2.5, 1).pintar(g, P, { relieve: 1 });
    new Capa().linea(21, 29, 20, 33, 3).pintar(g, C, { relieve: 1, max: 2 });
    const cuerpo = new Capa().ell(17, 27.5, 8.5, 5).ell(22, 26.5, 5, 5.5).ell(9.5, 27, 3.6, 3.2).poly([[9, 24.5], [2, 28.5], [2.5, 29.5], [9, 30.5]]);
    cuerpo.pintar(g, C, { relieve: 3, separar: true });
    for (let i = 8; i <= 24; i++) if (cuerpo.tiene(i, 31) && !cuerpo.tiene(i, 32)) pon(g, C, 3, [i, 31]);
    [[13, 23.5, 16, 22.5], [18, 22, 21, 21.5], [15, 25, 18, 24]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(cuerpo).pintar(g, C, { plano: 1 }));
    new Capa().ell(11.5, 23, 2, 2).pintar(g, C, { relieve: 1, separar: true });
    pon(g, P, 2, [11, 23], [11, 24]);
    new Capa().linea(9, 30, 8, 33, 2).pintar(g, C, { relieve: 1, separar: true });
    pon(g, P, 3, [6, 34], [7, 34], [8, 34], [16, 34], [17, 34], [18, 34], [19, 34]);
    pon(g, P, 2, [20, 33], [21, 34]);
    pon(g, R.sangre, 4, [8, 26]);
    pon(g, R.fuego, 4, [8, 25]);
    pon(g, P, 3, [2, 28]);
    pon(g, HUESO, 4, [3, 30], [4, 30]);
    g.contorno();
    [[3, 27, 0, 25], [3, 28, 0, 29], [16, 16, 13, 14]].forEach(([x0, y0, x1, y1]) => hilo(g, x0, y0, x1, y1, HUESO[2]));
    return g;
  }

  function goblin() {
    const piel = R.piel.verde, t = HEROES.plantilla("bajo");
    const g = HEROES.componer({ raza: "gnomo", clase: LLANO, piel: "verde", pelo: "negro", peinado: "rapado", tela: "terracota", objeto: "ninguno", sinContorno: true });
    const x = t.cabX, cy = t.cabY, y = t.ojoY, [mx, my] = t.mano;
    detras(g, new Capa().poly([[t.torL + 1, t.torTop], [t.torL + 4, t.torTop], [t.torL + 1, t.suelo - 2], [t.torL - 4, t.suelo - 3]]), R.tela.granate, { relieve: 2, max: 2 });
    torso(t).pintar(g, R.hierro, { relieve: 2, separar: true });
    pon(g, R.oricalco, 1, [t.torL + 2, t.torTop + 2], [t.torR - 2, t.torTop + 4], [t.cx, t.torBot - 1]);
    for (let i = t.torL; i <= t.torR; i++) pon(g, R.madera, 2, [i, t.torBot - 2]);
    new Capa().ell(t.torR - 1, t.torTop + 0.5, 2.6, 2).on(t.torR - 1, t.torTop - 2.5).pintar(g, R.hierro, { relieve: 1.5, separar: true });
    brazoDelante(g, t, piel);
    const casco = new Capa().ell(x - 0.3, cy - 1.4, t.cabRx + 0.6, t.cabRy - 0.2).poly([[x - 2, cy - 4.5], [x - 3.5, cy - 9.5], [x + 1, cy - 4.5]]);
    casco.quitarRect(0, y - 1, 36, 36);
    casco.pintar(g, R.hierro, { relieve: 2, separar: true });
    pon(g, R.oricalco, 2, [x + 2, y - 3], [x - 3, y - 4]);
    new Capa().curva(x - 2, cy + 1, x - 6, cy - 1, x - 11, cy - 5, 3, 1).pintar(g, piel, { relieve: 1.5, separar: true });
    detras(g, new Capa().curva(x + 2, cy - 3, x + 6, cy - 6, x + 11, cy - 8, 3, 1), piel, { relieve: 1.5, separar: true });
    pon(g, piel, 1, [x - 5, cy - 1], [x - 7, cy - 2]);
    pon(g, R.bronce, 4, [x, y + 1], [x + 3, y + 1]);
    pon(g, NEGRO, 1, [x + 1, y - 1], [x + 2, y], [x + 4, y], [x + 5, y - 1]);
    pon(g, NEGRO, 0, [x + 1, y + 3], [x + 3, y + 3], [x + 5, y + 3]);
    pon(g, HUESO, 4, [x + 2, y + 3], [x + 4, y + 3]);
    pon(g, piel, 0, [x + 6, y + 2]);
    new Capa().curva(mx, my - 2, mx + 6, my - 6, mx + 4, my - 13, 2.4, 1).pintar(g, R.plata, { relieve: 1, min: 2 });
    new Capa().rect(mx - 1, my - 2, 3, 1).pintar(g, R.bronce, { plano: 3 });
    pon(g, R.bronce, 2, [mx, my + 1]);
    g.contorno();
    return g.espejo();
  }

  function osolechuza() {
    const g = new Rejilla(), C = R.pelo.castano, O = R.tela.ocre, P = R.piedra;
    const unas = (x, y, puntas) => abanico(new Capa(), x, y, puntas).pintar(g, HUESO, { relieve: 1, min: 3 });
    new Capa().linea(22, 15, 26, 10, 4).linea(26, 10, 25, 6, 4).ell(25, 5, 2.4, 2).pintar(g, C, { relieve: 2, max: 2 });
    unas(25, 3.5, [[-2.5, -1.5], [-0.5, -2.5], [1.5, -2]]);
    new Capa().rect(21, 25, 6, 8).rect(19, 32, 8, 3).pintar(g, C, { relieve: 2, max: 2 });
    new Capa().rect(12, 25, 6, 8).rect(9, 32, 8, 3).pintar(g, C, { relieve: 2.5, separar: true });
    pon(g, HUESO, 4, [9, 34], [11, 34], [19, 34], [21, 34]);
    const cuerpo = new Capa().ell(18.5, 20.5, 8, 8.5);
    cuerpo.pintar(g, C, { relieve: 4, separar: true });
    const pecho = new Capa().ell(15, 21, 4.5, 6).recortar(cuerpo);
    pecho.pintar(g, O, { relieve: 2, max: 3 });
    for (const j of [17, 20, 23, 26]) for (let i = 11 + (j % 2 ? 1 : 0); i <= 19; i += 3) if (pecho.tiene(i, j) && pecho.tiene(i + 1, j)) pon(g, O, 1, [i, j], [i + 1, j]);
    for (const [i, j] of [[21, 14], [24, 17], [22, 21], [25, 23], [20, 26]]) pon(g, C, 1, [i, j], [i + 1, j + 1]);
    const cab = new Capa().ell(13, 9.5, 6, 5.5).poly([[7.5, 7], [6.5, 1.5], [10.5, 5]]).poly([[15.5, 5], [19, 1.5], [19, 7]]);
    cab.pintar(g, R.madera, { relieve: 3, separar: true });
    pon(g, O, 3, [7, 2], [7, 3], [18, 2], [18, 3]);
    for (const [i, j] of [[16, 8], [17, 11], [15, 13], [18, 9], [16, 5]]) pon(g, R.madera, 1, [i, j]);
    new Capa().ell(11.5, 10, 4.6, 4).pintar(g, O, { relieve: 1, min: 2, max: 3 });
    new Capa().ell(11.5, 10, 3.8, 3.3).pintar(g, HUESO, { relieve: 2, min: 2 });
    for (const ex of [9.5, 13.5]) new Capa().ell(ex, 9, 1.4, 1.4).pintar(g, R.bronce, { relieve: 1, min: 3 });
    pon(g, NEGRO, 0, [9, 9], [10, 9], [13, 9], [14, 9]);
    pon(g, HUESO, 4, [9, 8], [13, 8]);
    pon(g, C, 1, [8, 7], [9, 7], [10, 7], [13, 7], [14, 7], [15, 7]);
    new Capa().poly([[10.5, 10.5], [12.5, 10.5], [12.5, 12.5], [11.5, 14.5], [10.5, 12.5]]).pintar(g, P, { relieve: 1, min: 2, separar: true });
    pon(g, P, 4, [11, 11]);
    new Capa().linea(14, 16, 10, 21, 4).linea(10, 21, 6, 20.5, 3).ell(5, 20.5, 2.4, 2.2).pintar(g, C, { relieve: 2, separar: true });
    unas(3.5, 20.5, [[-2.5, -2.5], [-3, 0], [-2.5, 2.5]]);
    return g.contorno();
  }

  function trol() {
    const g = new Rejilla(), P = CENIZA, V = R.piel.verde;
    const garras = (x, y, puntas) => abanico(new Capa(), x, y, puntas).pintar(g, NEGRO, { relieve: 1, min: 2 });
    new Capa().linea(24, 11, 28, 19, 3).linea(28, 19, 29, 27, 2).ell(29.5, 28.5, 1.8, 1.8).pintar(g, P, { relieve: 1.5, max: 2 });
    garras(29.5, 29.5, [[-1.5, 3], [0, 3.5], [1.5, 3]]);
    new Capa().linea(22, 21, 26, 26, 3).linea(26, 26, 25, 31, 3).rect(22, 33, 6, 2).pintar(g, P, { relieve: 1.5, max: 2 });
    const cuerpo = new Capa().poly([[13, 10], [17, 6.5], [23, 6.5], [26, 10], [25.5, 16], [23, 22], [17, 22], [15, 16]]).ell(20, 17.5, 4.5, 4.5);
    cuerpo.pintar(g, P, { relieve: 3.5, separar: true });
    const trapo = new Capa().poly([[16.5, 20], [24, 20], [25, 25], [22.5, 24], [20.5, 26.5], [18.5, 24], [16, 25]]);
    trapo.pintar(g, R.madera, { relieve: 1.5, separar: true });
    new Capa().linea(18, 22, 14, 27, 3).linea(14, 27, 15, 31, 3).rect(11, 33, 6, 2).pintar(g, P, { relieve: 1.5, separar: true });
    garras(11, 34, [[-1, 0]]);
    const cab = new Capa().ell(11, 12, 4, 3.8).poly([[7.5, 11], [3, 14.5], [4.5, 16], [8, 14]]).rect(6, 14, 6, 3);
    cab.pintar(g, P, { relieve: 3, separar: true });
    new Capa().linea(14, 10, 17.5, 8, 2).pintar(g, P, { relieve: 1, separar: 2 });
    pon(g, NEGRO, 1, [8, 10], [9, 10], [10, 10], [11, 10], [12, 11]);
    pon(g, R.bronce, 4, [9, 11], [11, 11]);
    pon(g, NEGRO, 0, [6, 16], [7, 16], [8, 16], [9, 16], [10, 16]);
    pon(g, HUESO, 3, [7, 15], [10, 15]);
    pon(g, HUESO, 4, [7, 14], [10, 14]);
    [[12, 8, 16, 5], [13, 9, 18, 7], [14, 9, 19, 10]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).pintar(g, NEGRO, { plano: 2 }));
    new Capa().linea(14, 11, 10, 18, 3).linea(10, 18, 6, 26, 2).ell(5.5, 27.5, 2, 1.8).pintar(g, P, { relieve: 1.5, separar: true });
    garras(5.5, 28.5, [[-2, 3], [-0.5, 3.5], [1, 3]]);
    for (const [i, j] of [[19, 9], [22, 11], [17, 14], [24, 14], [21, 19], [9, 21], [12, 15], [27, 23]]) if (g.rampa(i, j) === P) { pon(g, P, 4, [i, j]); pon(g, V, 1, [i, j + 1]); }
    [[18, 12], [19, 13], [20, 14], [21, 15], [22, 16]].forEach(([i, j], k) => pon(g, R.piel.clara, k % 2 ? 3 : 4, [i, j]));
    pon(g, R.piel.verde, 4, [17, 12], [23, 16]);
    return g.contorno();
  }

  function esqueleto() {
    const g = new Rejilla(), H = HUESO, F = R.hierro, O = R.oricalco;
    const hueso = (c, op = {}) => c.pintar(g, H, { relieve: 1, min: 2, ...op });
    hueso(new Capa().linea(20, 13, 22, 17, 1).linea(22, 17, 24, 18, 1), { max: 2 });
    const escudo = new Capa().poly([[21, 12.5], [30.5, 12.5], [30.5, 20.5], [25.75, 27], [21, 20.5]]);
    escudo.pintar(g, F, { relieve: 2, separar: true });
    for (const [i, j] of [[23, 14], [28, 15], [24, 19], [27, 21], [29, 18], [25, 24]]) pon(g, O, 1, [i, j], [i + 1, j]);
    new Capa().rect(25, 14, 2, 10).rect(22, 17, 8, 2).recortar(escudo).pintar(g, R.sangre, { relieve: 1, max: 2 });
    hueso(new Capa().linea(15.5, 23, 14, 28, 2).linea(14, 28.5, 13, 33, 1).rect(10, 33, 4, 2));
    hueso(new Capa().linea(19, 23, 21, 28, 2).linea(21, 28.5, 22, 33, 1).rect(20, 33, 4, 2), { max: 3 });
    pon(g, H, 4, [14, 28], [21, 28]);
    new Capa().poly([[15, 22], [20, 22], [20.5, 28.5], [19, 27], [17.5, 29.5], [16.5, 27], [15, 28.5]]).pintar(g, R.tela.granate, { relieve: 1.5, max: 2, separar: true });
    hueso(new Capa().ell(17.5, 22, 3, 1.4), { separar: true });
    hueso(new Capa().rect(17, 17, 1, 5));
    for (let j = 17; j <= 21; j += 2) pon(g, H, 1, [17, j]);
    const costillas = new Capa().ell(17.5, 15, 3.8, 3.2);
    hueso(costillas, { relieve: 2, separar: true });
    for (const j of [14, 16]) for (let i = 14; i <= 21; i++) if (costillas.tiene(i, j) && i !== 17) pon(g, NEGRO, 0, [i, j]);
    hueso(new Capa().linea(13.5, 12, 21.5, 12, 1).rect(17, 10, 1, 2));
    hueso(new Capa().ell(15.5, 7, 3.6, 3.4).rect(13, 9, 4, 2.5), { relieve: 2.5, separar: true });
    pon(g, NEGRO, 0, [13, 7], [14, 7], [13, 8], [16, 7], [17, 7], [16, 8], [12, 9], [13, 11], [15, 11]);
    pon(g, R.fuego, 4, [13, 7], [16, 7]);
    pon(g, R.fuego, 2, [14, 7], [17, 7]);
    const yelmo = new Capa().ell(15.8, 5.6, 4.4, 3.4).rect(11, 6, 10, 1);
    yelmo.quitarRect(0, 7, 36, 36);
    yelmo.pintar(g, F, { relieve: 2, separar: true });
    pon(g, O, 1, [14, 3], [18, 4], [12, 6]);
    pon(g, O, 2, [16, 2], [19, 6]);
    hueso(new Capa().linea(14, 12.5, 11, 16, 1).linea(11, 16, 8.5, 18, 1), { separar: true });
    pon(g, H, 4, [11, 16]);
    new Capa().linea(8, 16, 3, 5, 2).pintar(g, F, { relieve: 1, min: 2 });
    [[5, 10], [4, 7], [6, 13]].forEach(([i, j]) => g.quitar(i, j));
    new Capa().rect(6, 16, 5, 1).pintar(g, F, { plano: 3 });
    pon(g, R.madera, 2, [8, 18], [8, 19]);
    pon(g, F, 4, [8, 20]);
    return g.contorno();
  }

  function mimico() {
    const g = new Rejilla(), M = R.madera, F = R.hierro, B = R.bronce, L = R.piel.roja, S = R.sangre;
    const [hx, hy] = [30, 21], a = 35 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const girar = pts => pts.map(([x, y]) => [hx + (x - hx) * ca - (y - hy) * sa, hy + (x - hx) * sa + (y - hy) * ca]);
    const [bocaX, bocaY] = girar([[6, 21]])[0];
    new Capa().poly([[6, 22.5], [bocaX, bocaY], [30, 21.5]]).pintar(g, S, { relieve: 2, max: 2 });
    for (const [i, j] of [[13, 20], [15, 19], [18, 20], [21, 19], [20, 18], [24, 20]]) pon(g, B, j % 2 ? 4 : 3, [i, j], [i + 1, j]);
    const caja = new Capa().rect(6, 22, 25, 13);
    caja.pintar(g, M, { relieve: 2.5, separar: true });
    for (const j of [26, 30]) for (let i = 6; i <= 30; i++) pon(g, M, 1, [i, j]);
    new Capa().rect(9, 22, 2, 13).rect(26, 22, 2, 13).pintar(g, F, { relieve: 1, separar: true });
    for (const i of [9, 26]) pon(g, F, 4, [i, 24], [i, 28], [i, 32]);
    new Capa().rect(4, 23, 3, 4).pintar(g, B, { relieve: 1, separar: true });
    pon(g, NEGRO, 0, [5, 25]);
    const tapa = new Capa().poly(girar([[6, 21], [30, 21], [30, 16], [27, 14], [9, 14], [6, 16]]));
    tapa.pintar(g, M, { relieve: 2.5, separar: true });
    for (const bx of [9.5, 26.5]) {
      const [p0, p1] = girar([[bx, 21], [bx, 14.5]]);
      new Capa().linea(p0[0], p0[1], p1[0], p1[1], 2).recortar(tapa).pintar(g, F, { relieve: 1 });
    }
    const dx = ca, dy = sa, nx = -sa, ny = ca;
    for (let s = 1.5; s <= 22; s += 3) {
      const bx = bocaX + dx * s, by = bocaY + dy * s;
      new Capa().poly([[bx - dx * 1.2, by - dy * 1.2], [bx + nx * 2.6, by + ny * 2.6], [bx + dx * 1.2, by + dy * 1.2]]).pintar(g, HUESO, { relieve: 1, min: 3 });
    }
    for (let i = 8; i <= 28; i += 3) new Capa().poly([[i - 1.2, 22.5], [i, 19.4], [i + 1.2, 22.5]]).pintar(g, HUESO, { relieve: 1, min: 3 });
    const lengua = new Capa().curva(16, 20.5, 5, 18.5, 4, 28, 4, 3).ell(4.2, 28.5, 1.8, 1.6);
    lengua.pintar(g, L, { relieve: 2, separar: true });
    new Capa().curva(14, 20, 6, 19.5, 4.5, 27, 1).recortar(lengua).pintar(g, L, { plano: 1 });
    pon(g, L, 4, [3, 29]);
    const [ox, oy] = girar([[14, 17.5]])[0].map(Math.round);
    new Capa().ell(ox, oy, 2, 1.6).pintar(g, R.bronce, { relieve: 1, min: 3, separar: true });
    pon(g, NEGRO, 0, [ox, oy - 1], [ox, oy], [ox, oy + 1]);
    pon(g, M, 0, [ox - 2, oy - 2], [ox - 1, oy - 2], [ox, oy - 2], [ox + 1, oy - 2]);
    g.contorno();
    destello(g, 12, 17); destello(g, 23, 16);
    return g;
  }

  function liche() {
    const g = new Rejilla(), N = R.tela.negro, V = R.tela.violeta, E = R.piel.esmeralda, B = R.bronce;
    new Capa().rect(7, 9, 1, 26).pintar(g, R.madera, { relieve: 1, max: 2 });
    new Capa().ell(7.5, 5.5, 2.4, 2.2).rect(6, 7, 3, 2).pintar(g, HUESO, { relieve: 1.5, min: 2 });
    pon(g, E, 4, [6, 5], [8, 5]);
    pon(g, NEGRO, 0, [7, 8]);
    const manto = new Capa().poly([[17, 11], [25, 11], [28, 18], [30, 26], [31.5, 34.5], [13.5, 34.5], [15, 26], [15.5, 18]]);
    [[15, 31], [18.5, 32.5], [22, 30], [26, 32], [29.5, 30.5]].forEach(([x, y]) => manto.restar(muesca(x, y, 35.5, 1.4)));
    manto.pintar(g, N, { relieve: 3 });
    new Capa().poly([[17, 12], [19, 12], [18, 24], [18.5, 34.5], [15, 34.5], [16.5, 24]]).recortar(manto).pintar(g, V, { relieve: 1, max: 2, separar: true });
    new Capa().poly([[14.5, 6], [17.5, 11], [24.5, 11], [27.5, 6], [26.5, 13], [15.5, 13]]).pintar(g, V, { relieve: 1.5, max: 2, separar: true });
    for (let i = 16; i <= 26; i++) if (g.rampa(i, 13) === V) pon(g, B, 2, [i, 13]);
    const craneo = new Capa().ell(20.5, 7.5, 3.3, 3.5).rect(18.5, 9.5, 4, 2);
    craneo.pintar(g, HUESO, { relieve: 2.5, separar: true });
    pon(g, NEGRO, 0, [18, 7], [19, 7], [18, 8], [21, 7], [22, 7], [21, 8], [17, 9], [18, 11], [20, 11]);
    pon(g, E, 4, [18, 7], [21, 7]);
    pon(g, R.hoja, 4, [19, 7], [22, 7]);
    new Capa().rect(17, 3.5, 8, 1.5).rect(17, 1.5, 1, 2).rect(19.5, 1, 1, 3).rect(22, 1.5, 1, 2).rect(24, 2, 1, 2).pintar(g, B, { relieve: 1, max: 3 });
    pon(g, E, 4, [20, 4]);
    new Capa().linea(17, 14, 11, 16, 3).poly([[17, 13], [10, 15.5], [11, 19.5], [14, 18]]).pintar(g, N, { relieve: 2, separar: true });
    pon(g, HUESO, 3, [8, 15], [9, 15], [8, 17]);
    pon(g, HUESO, 2, [9, 16], [9, 17]);
    new Capa().linea(25, 14, 28, 11, 2).pintar(g, N, { relieve: 1, max: 2, separar: true });
    pon(g, HUESO, 3, [28, 10], [29, 9], [30, 10]);
    new Capa().ell(29.5, 6.5, 1.8, 2.4).on(29.5, 3.5).pintar(g, E, { relieve: 1.5, min: 2 });
    pon(g, E, 4, [29, 7], [29, 6]);
    bordeLuz(g, N);
    return g.contorno();
  }

  function cubo() {
    const g = new Rejilla(), E = R.piel.esmeralda, Hj = R.hoja;
    const frente = new Capa().rect(2, 11, 24, 24);
    const arriba = new Capa().poly([[2, 11], [9.5, 3.5], [33.5, 3.5], [26, 11]]).restar(frente);
    const lado = new Capa().poly([[25.5, 11], [33.5, 3.5], [33.5, 27], [25.5, 34.5]]).restar(frente).restar(arriba);
    tramar(g, frente, E, 2, 3, (x, y) => 0.75 - (x + y) / 70);
    tramar(g, arriba, E, 3, 4, (x, y) => 0.7 - x / 60);
    tramar(g, lado, E, 1, 2, (x, y) => 0.6 - y / 50);
    for (const [x0, y0, x1, y1] of [[9.5, 3.5, 9.5, 27], [9.5, 27, 33.5, 27], [2, 34, 9.5, 27]]) new Capa().linea(x0, y0, x1, y1, 1).recortar(frente).pintar(g, E, { plano: 3 });
    /* Lo que flota dentro se ve a medias, tramado con la gelatina. */
    const dentro = new Rejilla();
    new Capa().linea(13, 31, 23, 15, 2).pintar(dentro, R.hierro, { relieve: 1, min: 2 });
    new Capa().rect(19, 21, 5, 1).pintar(dentro, R.bronce, { plano: 2 });
    new Capa().ell(9, 19, 3, 2.8).rect(7.5, 21, 3, 2).pintar(dentro, HUESO, { relieve: 1.5, min: 2 });
    pon(dentro, NEGRO, 1, [8, 19], [10, 19], [9, 21]);
    new Capa().linea(4, 28, 11, 26, 1).pintar(dentro, HUESO, { plano: 3 });
    pon(dentro, HUESO, 4, [4, 27], [4, 29], [11, 25], [12, 27]);
    for (const [i, j] of [[6, 32], [9, 31], [15, 32], [20, 30], [17, 26], [22, 33], [12, 14]]) pon(dentro, R.bronce, 3, [i, j], [i + 1, j]);
    for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) {
      const c = dentro.get(i, j);
      if (c && frente.tiene(i, j) && PX.umbral(i, j) < 0.72) g.set(i, j, c, dentro.rampa(i, j));
    }
    for (let i = 2; i <= 25; i++) pon(g, Hj, 4, [i, 11]);
    for (let j = 11; j <= 34; j++) pon(g, Hj, 3, [2, j]);
    for (let j = 11; j <= 34; j++) pon(g, E, 3, [25, j]);
    new Capa().linea(2, 11, 9.5, 3.5, 1).linea(9.5, 3.5, 33.5, 3.5, 1).linea(26, 11, 33.5, 3.5, 1).pintar(g, Hj, { plano: 4 });
    for (let j = 4; j <= 27; j++) pon(g, E, 2, [33, j]);
    pon(g, HUESO, 4, [3, 12], [4, 12], [3, 13], [10, 4], [11, 4], [5, 15], [6, 16]);
    for (const [i, j] of [[14, 17], [7, 25], [21, 27], [18, 13]]) pon(g, Hj, 4, [i, j]);
    return g.contorno(E[0]);
  }

  function golem() {
    const g = new Rejilla(), B = R.hierro, F = R.fuego;
    new Capa().linea(26, 12, 29, 18, 4).linea(29, 18, 29.5, 23, 4).ell(29.5, 25.5, 2.8, 2.6).pintar(g, B, { relieve: 2, max: 2 });
    new Capa().rect(19, 23, 5, 9).rect(17, 32, 7, 3).pintar(g, B, { relieve: 2, max: 2 });
    new Capa().rect(11, 23, 5, 9).rect(8, 32, 8, 3).pintar(g, B, { relieve: 2.5, separar: true });
    for (const [x0, x1] of [[11, 15], [19, 23]]) for (let x = x0; x <= x1; x++) pon(g, F, x % 2 ? 2 : 1, [x, 27]);
    const cuerpo = new Capa().ell(17.5, 13.5, 9.5, 7).rect(12, 18, 11, 6);
    cuerpo.pintar(g, B, { relieve: 4, separar: true });
    new Capa().rect(14, 11, 7, 6).pintar(g, B, { plano: 0 });
    for (let j = 12; j <= 15; j++) for (let i = 15; i <= 19; i++) pon(g, F, j > 13 ? 4 : 3, [i, j]);
    for (const i of [14, 16, 18, 20]) for (let j = 11; j <= 16; j++) pon(g, B, 2, [i, j]);
    for (const y of [20, 23]) for (let x = 12; x <= 22; x++) if (g.rampa(x, y) === B) pon(g, B, 1, [x, y]);
    pon(g, B, 4, [12, 23], [15, 23], [18, 23], [21, 23], [12, 10], [22, 10], [13, 18], [21, 18], [16, 21], [19, 21]);
    new Capa().rect(10, 6, 6, 4).pintar(g, B, { relieve: 1.5, max: 2 });
    const cab = new Capa().rect(8.5, 1.5, 8, 6).off(8, 1).off(16, 1);
    cab.pintar(g, B, { relieve: 2, separar: true });
    for (let x = 9; x <= 16; x++) pon(g, B, 1, [x, 3]);
    pon(g, F, 4, [10, 4], [13, 4]);
    pon(g, F, 2, [11, 4], [14, 4]);
    const barba = new Capa().poly([[8.5, 6], [16, 6], [15, 10], [12, 11.5], [9, 9.5]]);
    barba.pintar(g, B, { relieve: 1.5, max: 3, separar: true });
    for (const x of [10, 12, 14]) for (let y = 7; y <= 10; y++) if (barba.tiene(x, y)) pon(g, B, 1, [x, y]);
    new Capa().ell(9, 11, 4, 3.6).linea(8, 13, 6, 19, 4).linea(6, 19, 5, 23, 4).pintar(g, B, { relieve: 2.5, separar: true });
    for (let x = 3; x <= 8; x++) if (g.rampa(x, 19) === B) pon(g, F, x % 2 ? 2 : 1, [x, 19]);
    pon(g, R.bronce, 3, [7, 10], [8, 9], [9, 10], [10, 9], [11, 10]);
    new Capa().ell(5, 26, 3.2, 3).pintar(g, B, { relieve: 2, separar: true });
    pon(g, B, 1, [3, 26], [5, 26], [7, 26]);
    return g.contorno();
  }

  /* Ala de murciélago: del hombro a la muñeca y de ahí los dedos, con la membrana recortada entre ellos. */
  function alaMembrana(g, hombro, muneca, puntas, anclaje, membrana, opMembrana, hueso, opHueso) {
    const c = new Capa();
    const todos = [...puntas, anclaje];
    for (let i = 0; i < todos.length - 1; i++) {
      const [ax, ay] = todos[i], [bx, by] = todos[i + 1];
      const mx = (ax + bx) / 2 * 0.6 + muneca[0] * 0.4, my = (ay + by) / 2 * 0.6 + muneca[1] * 0.4;
      c.poly([muneca, [ax, ay], [mx, my], [bx, by]]);
    }
    c.poly([hombro, muneca, todos[todos.length - 1]]);
    c.pintar(g, membrana, opMembrana);
    const huesos = new Capa().linea(hombro[0], hombro[1], muneca[0], muneca[1], 2);
    puntas.forEach(([x, y]) => huesos.linea(muneca[0], muneca[1], x, y, 1));
    huesos.pintar(g, hueso, { relieve: 1, ...opHueso });
  }

  function dragon() {
    const g = new Rejilla(), Rj = R.piel.roja, S = R.sangre, O = R.tela.ocre, F = R.fuego;
    alaMembrana(g, [24, 16], [27.5, 1.5], [[32, 1], [34, 7], [34, 14]], [30, 19], S, { relieve: 2, max: 1 }, Rj, { min: 1, max: 2 });
    new Capa().curva(28, 29, 35, 30, 31, 34, 4, 2).linea(31, 33.5, 26, 34, 1).pintar(g, Rj, { relieve: 2, max: 3 });
    new Capa().poly([[24, 34.5], [26.5, 32], [27.5, 34.5]]).pintar(g, Rj, { relieve: 1, max: 3 });
    new Capa().ell(25.5, 27, 4, 4.5).linea(26.5, 29, 25.5, 32, 4).rect(21, 33, 7, 2).pintar(g, Rj, { relieve: 2, max: 3 });
    const cuerpo = new Capa().ell(21, 24, 8, 6).ell(15, 22.5, 5, 6.2);
    cuerpo.pintar(g, Rj, { relieve: 4, separar: true });
    new Capa().ell(25.5, 27, 4, 4.5).recortar(cuerpo).pintar(g, Rj, { relieve: 2, separar: true });
    new Capa().linea(14.5, 26, 12.5, 31, 4).rect(8, 33, 7, 2).pintar(g, Rj, { relieve: 2, separar: true });
    pon(g, HUESO, 4, [8, 34], [10, 34], [21, 34], [23, 34]);
    const cuello = new Capa().curva(16, 21, 13, 13, 9, 9.5, 6, 4);
    cuello.pintar(g, Rj, { relieve: 3, separar: true });
    const vientre = new Capa().curva(7, 13.5, 12, 16, 13, 28, 2.5, 4.5).recortar(cuello.copia().unir(cuerpo));
    vientre.pintar(g, O, { relieve: 1.5, max: 3 });
    for (let j = 14; j <= 29; j += 2) for (let i = 4; i <= 18; i++) if (vientre.tiene(i, j)) pon(g, O, 1, [i, j]);
    for (const [i, j] of [[13, 9], [15, 12], [17, 15], [20, 17.5], [24, 18]]) new Capa().poly([[i - 1, j + 1], [i + 1, j - 2], [i + 1.5, j + 1]]).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    const cab = new Capa().ell(8, 8, 3.6, 3).poly([[6, 6], [1.5, 8.5], [1.5, 11], [6.5, 11.5]]).poly([[6.5, 11.5], [2, 12.5], [3, 14.5], [9, 13]]);
    cab.pintar(g, Rj, { relieve: 2.5, separar: true });
    for (let i = 2; i <= 7; i++) pon(g, F, i < 5 ? 4 : 3, [i, 12]);
    pon(g, HUESO, 4, [3, 11], [5, 11], [4, 13], [6, 13]);
    pon(g, F, 3, [1, 12]);
    pon(g, F, 4, [1, 11]);
    new Capa().curva(9, 5.5, 12, 2, 16, 2.5, 2, 1).curva(10.5, 6.5, 14, 4.5, 17, 6, 2, 1).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    pon(g, R.bronce, 4, [6, 8]);
    pon(g, NEGRO, 0, [6, 7], [5, 8]);
    pon(g, S, 1, [4, 7], [5, 7], [7, 7], [2, 9]);
    alaMembrana(g, [18, 17], [15.5, 1.5], [[20.5, 1], [24, 5.5], [25, 11.5], [23.5, 16]], [21.5, 18.5], S, { relieve: 2.5, max: 2, separar: true }, Rj, { min: 3, max: 4 });
    return g.contorno();
  }

  function lobo() {
    const g = new Rejilla(), G = R.piel.gris, P = R.piedra;
    new Capa().curva(28, 22, 34, 22, 34, 29, 3.5, 2).pintar(g, G, { relieve: 2, max: 3 });
    new Capa().linea(26, 27, 28, 33, 2).rect(26, 33, 4, 2).linea(16, 27, 15, 33, 2).rect(13, 33, 4, 2).pintar(g, G, { relieve: 1, max: 2 });
    const cuerpo = new Capa().ell(20, 24.5, 9, 5).ell(13, 23, 4.5, 5);
    for (const i of [14, 17, 20, 23, 26]) cuerpo.poly([[i - 1.5, 21], [i + 1, 17.5], [i + 1.5, 21]]);
    cuerpo.pintar(g, G, { relieve: 3.5, separar: true });
    for (const [i, j] of [[16, 22], [20, 21], [24, 22], [19, 25], [23, 26], [14, 26]]) pon(g, G, 1, [i, j], [i + 1, j + 1]);
    new Capa().linea(23, 27, 25, 33, 2).rect(23, 33, 4, 2).linea(12, 27, 10, 33, 2).rect(7, 33, 4, 2).pintar(g, G, { relieve: 1.5, separar: true });
    pon(g, HUESO, 4, [7, 34], [9, 34], [23, 34]);
    const cab = new Capa().ell(9, 20.5, 4, 3.5).poly([[7, 19], [1.5, 21.5], [2, 23.5], [8, 24]]).poly([[9, 18], [10, 13.5], [12.5, 18]]).poly([[6, 18.5], [6, 14.5], [8.5, 18]]);
    cab.pintar(g, G, { relieve: 3, separar: true });
    pon(g, G, 1, [10, 16], [7, 16]);
    pon(g, P, 0, [2, 23], [3, 23], [4, 23], [5, 23], [6, 23], [1, 21]);
    pon(g, HUESO, 4, [3, 22], [5, 22], [4, 24]);
    pon(g, R.sangre, 2, [3, 24], [5, 24]);
    pon(g, R.bronce, 4, [6, 19]);
    pon(g, NEGRO, 0, [7, 19], [5, 18], [6, 18], [7, 18]);
    pon(g, G, 1, [3, 20], [4, 20], [5, 20]);
    return g.contorno();
  }

  function armadura() {
    const t = HEROES.plantilla("normal"), piel = R.piel.clara, F = R.hierro;
    const g = HEROES.componer({ raza: "humano", clase: "guerrero", piel: "clara", tela: "negro", objeto: "ninguno", sinContorno: true });
    const x = t.cabX, y = t.ojoY, [mx, my] = t.mano;
    for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) {
      if (g.rampa(i, j) !== piel && g.get(i, j) !== "#1b1210" && g.get(i, j) !== "#f4ead8") continue;
      if (j >= y - 1 && j <= y + 3 && i >= x - 1 && i <= x + 6) g.set(i, j, R.tela.negro[0], R.tela.negro);
      else if (g.rampa(i, j) === piel) g.set(i, j, F[Math.max(1, piel.indexOf(g.get(i, j)))], F);
    }
    pon(g, R.mar, 4, [x + 2, y], [x + 5, y]);
    pon(g, R.mar, 2, [x + 2, y + 1], [x + 5, y + 1], [x + 1, y]);
    for (const [i, j] of [[t.torL + 2, t.torTop + 3], [t.torR - 1, t.torTop + 6], [x - 3, y - 3], [x + 1, t.cabY - 4], [t.cx - 3, t.pierTop + 4], [t.cx + 3, t.suelo - 4], [t.torL, t.torBot]]) pon(g, R.oricalco, 1, [i, j], [i + 1, j]);
    new Capa().rect(mx, my - 16, 2, 15).poly([[mx, my - 16], [mx + 1, my - 18.5], [mx + 2, my - 16]]).pintar(g, R.plata, { relieve: 1, min: 2 });
    pon(g, R.plata, 4, [mx, my - 15], [mx, my - 12], [mx, my - 9]);
    new Capa().rect(mx - 2, my - 1, 6, 1).pintar(g, F, { plano: 3 });
    pon(g, R.madera, 2, [mx, my + 1], [mx + 1, my + 1], [mx, my + 2], [mx + 1, my + 2]);
    pon(g, F, 4, [mx, my + 3], [mx + 1, my + 3]);
    brazoDelante(g, t, F);
    g.contorno();
    return g.espejo();
  }

  function vampiro() {
    const t = HEROES.plantilla("normal");
    const g = HEROES.componer({ raza: "humano", clase: LLANO, piel: "plata", pelo: "negro", peinado: "corto", tela: "negro", objeto: "ninguno", sinContorno: true, extras: [(g, t, { piel, pelo, tela }) => {
      for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) if (g.rampa(i, j) === pelo) pon(g, pelo, Math.min(2, pelo.indexOf(g.get(i, j))), [i, j]);
      faldaLarga(g, t, tela);
      for (let i = t.cx - 1; i <= t.cx + 2; i++) for (let j = t.torTop; j <= t.torTop + 3; j++) if (g.rampa(i, j) === tela) pon(g, HUESO, j === t.torTop ? 4 : 3, [i, j]);
      pon(g, R.sangre, 3, [t.cx, t.torTop + 2], [t.cx + 1, t.torTop + 2]);
      const x = t.cabX, y = t.ojoY;
      pon(g, R.sangre, 4, [x + 1, y], [x + 4, y]);
      pon(g, R.sangre, 2, [x + 1, y + 1], [x + 4, y + 1]);
      pon(g, NEGRO, 1, [x + 1, y - 1], [x + 2, y - 1], [x + 4, y - 1], [x + 5, y - 1], [x, y - 1]);
      pon(g, piel, 0, [x + 3, y + 3], [x + 4, y + 3]);
      pon(g, HUESO, 4, [x + 3, y + 4], [x + 5, y + 4]);
      pon(g, NEGRO, 3, [x - 2, t.cabY - 4], [x + 1, t.cabY - 4]);
    }] });
    const N = R.tela.negro, S = R.sangre;
    const ala = new Capa().poly([[t.torL + 2, t.torTop], [3, 9], [1.5, 22], [4, 33], [t.torL, 33]]).poly([[t.torR - 2, t.torTop], [32, 9], [33.5, 22], [31, 33], [t.torR, 33]]);
    for (const [i, j] of [[2.5, 15], [2.5, 27], [33, 15], [32.5, 27]]) ala.quitarEll(i + (i < 18 ? -1.5 : 1.5), j, 2.2, 3);
    const forro = ala.copia();
    for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) if (!ala.tiene(i - 1, j) || !ala.tiene(i + 1, j) || !ala.tiene(i, j - 1)) forro.off(i, j);
    detras(g, new Capa().poly([[t.cabX - 7, t.torTop - 8], [t.cabX - 3, t.torTop], [t.cabX + 3, t.torTop], [t.cabX + 7, t.torTop - 8], [t.cabX + 4, t.torTop + 2], [t.cabX - 4, t.torTop + 2]]), S, { relieve: 1.5, separar: true });
    detras(g, ala, N, { relieve: 2, separar: true });
    for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) if (!ala.tiene(i, j)) forro.off(i, j);
    forro.pintar(g, S, { relieve: 2.5, max: 3 });
    bordeLuz(g, N);
    g.contorno();
    return g.espejo();
  }

  function kobold() {
    const t = HEROES.plantilla("bajo");
    const g = HEROES.componer({ raza: "draconido", clase: LLANO, cuerpo: "bajo", piel: "roja", tela: "terracota", objeto: "ninguno", sinContorno: true, extras: [(g, t, { piel }) => {
      const [mx, my] = t.mano, [ax, ay] = t.manoAtras;
      for (let i = t.torL; i <= t.torR; i++) pon(g, R.madera, 2, [i, t.torBot - 2]);
      detras(g, new Capa().ell(ax - 1, ay + 1, 3, 3.2), R.madera, { relieve: 1.5, separar: true });
      new Capa().rect(mx, 9, 1, t.suelo - 9).pintar(g, R.madera, { plano: 2 });
      new Capa().poly([[mx - 1.5, 9.5], [mx + 0.5, 4.5], [mx + 2.5, 9.5]]).pintar(g, R.hierro, { relieve: 1, min: 2 });
      pon(g, R.tela.granate, 3, [mx - 1, 10], [mx + 1, 11]);
      brazoDelante(g, t, piel);
      pon(g, HUESO, 4, [t.cabX + 2, t.cabY - 1]);
    }] });
    const [ax, ay] = t.manoAtras;
    pon(g, R.hierro, 3, [ax - 1, ay + 1]);
    g.contorno();
    for (const [i, j] of [[t.cabX + 5, t.cabY - 5], [t.cabX + 6, t.cabY - 4]]) if (!g.get(i, j)) pon(g, R.mar, 4, [i, j]);
    return g.espejo();
  }

  function elemental() {
    const g = new Rejilla(), F = R.fuego;
    const llamas = (c, puntas) => { puntas.forEach(([x, y, h, a = 1.4]) => c.poly([[x - a, y], [x + 0.5, y - h], [x + a, y]])); return c; };
    const cuerpo = new Capa().ell(18, 9, 4, 4.2).ell(18.5, 18, 6, 6).poly([[13, 21], [24, 21], [21, 28], [19, 31], [17, 28]]);
    llamas(cuerpo, [[15, 7, 4], [18, 6, 5.5], [21, 7, 4.5], [13.5, 15, 3], [23.5, 14, 3.5], [16, 28, 3, 1], [22, 26, 3, 1]]);
    const brazos = new Capa().linea(14, 15, 9, 18, 3).linea(9, 18, 5, 14, 2).linea(23, 15, 27, 19, 3).linea(27, 19, 29, 24, 2);
    llamas(brazos, [[5, 13, 3, 1], [7, 15.5, 3, 1], [29, 23, 3, 1]]);
    brazos.pintar(g, F, { relieve: 1.5, min: 1, max: 3 });
    cuerpo.pintar(g, F, { relieve: 3, separar: true });
    new Capa().ell(18.5, 18, 3, 3.5).ell(18, 10, 2, 2).pintar(g, F, { relieve: 1.5, min: 3 });
    pon(g, HUESO, 4, [18, 17], [19, 18], [18, 19], [17, 10]);
    pon(g, F, 0, [15, 9], [16, 9], [19, 9], [20, 9]);
    pon(g, R.sangre, 1, [16, 12], [17, 12], [18, 12]);
    g.contorno(F[0]);
    for (const [i, j, k] of [[10, 8, 4], [26, 9, 3], [12, 26, 3], [25, 30, 4], [8, 24, 2], [30, 14, 4]]) if (!g.get(i, j)) pon(g, F, k, [i, j]);
    return g;
  }

  /* Diablillo: pequeño y cabezón, alas de murciélago a la espalda, cola acabada en flecha y un tridente. */
  function diablillo() {
    const g = new Rejilla(), Rj = R.piel.roja, S = R.sangre, N = NEGRO, F = R.hierro;
    /* Ala pequeña: membrana con el borde de salida festoneado y varillas finas desde la muñeca. */
    const ala = (pts, muneca, puntas, op, tonoHueso) => {
      new Capa().poly(pts).pintar(g, S, op);
      const h = new Capa().linea(pts[0][0], pts[0][1], muneca[0], muneca[1], 1);
      puntas.forEach(([x, y]) => h.linea(muneca[0], muneca[1], x, y, 1));
      h.pintar(g, S, { plano: tonoHueso });
    };
    ala([[19, 20], [21, 9], [25, 5], [28.5, 8], [26, 10], [27.5, 13.5], [24.5, 13], [22, 17]], [21, 9], [[25, 5], [28.5, 8], [27.5, 13.5]], { relieve: 1.5, max: 0, profundo: true }, 1);
    ala([[20, 22], [24, 11], [29, 8], [33.5, 13], [30.5, 14.5], [32.5, 19.5], [28.5, 18], [26, 21], [23, 23]], [24, 11], [[29, 8], [33.5, 13], [32.5, 19.5]], { relieve: 2, max: 1, separar: 0 }, 3);
    new Capa().curva(21, 29, 31, 34, 30, 27, 2, 1).pintar(g, Rj, { relieve: 1, max: 3, separar: true });
    new Capa().poly([[26.8, 27.5], [30, 22], [33.2, 27.5], [30, 26.2]]).pintar(g, Rj, { relieve: 1, min: 2, max: 3, separar: true });
    new Capa().linea(20, 29, 22, 31, 2).linea(22, 31, 21, 33, 2).pintar(g, Rj, { relieve: 1, max: 2 });
    const cuerpo = new Capa().ell(18.5, 26, 3.4, 3.6);
    cuerpo.pintar(g, Rj, { relieve: 2.5, min: 2, separar: true });
    new Capa().linea(17, 28, 15, 31, 2).linea(15, 31, 16, 33, 2).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    for (const x of [14, 20]) new Capa().rect(x, 33, 3, 2).pintar(g, N, { relieve: 1, min: 2, separar: true });
    new Capa().rect(8, 12, 1, 23).pintar(g, R.madera, { relieve: 1, max: 2 });
    new Capa().rect(6, 12, 5, 1).rect(6, 9, 1, 3).rect(8, 8, 1, 4).rect(10, 9, 1, 3).pintar(g, F, { relieve: 1, min: 2 });
    pon(g, F, 4, [6, 9], [8, 8], [10, 9]);
    const cab = new Capa().ell(15.5, 18, 4.3, 3.9).poly([[13, 19], [11, 22.5], [16, 21.5]]).poly([[18.5, 16.5], [23.5, 14.5], [19, 19.5]]);
    cab.pintar(g, Rj, { relieve: 3, min: 2, separar: true });
    new Capa().curva(13.5, 15, 11.5, 13, 12, 10.5, 2, 1).curva(17.5, 14.5, 18.5, 12, 20.5, 11, 2, 1).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    pon(g, R.bronce, 4, [12, 17], [15, 17]);
    pon(g, N, 0, [11, 16], [12, 16], [15, 16], [16, 15], [13, 17], [16, 17]);
    pon(g, N, 0, [11, 20], [12, 21], [13, 21], [14, 21], [15, 21], [16, 20]);
    pon(g, HUESO, 4, [12, 20], [15, 20]);
    pon(g, Rj, 1, [17, 19], [18, 18]);
    new Capa().linea(17, 24, 12, 25, 2).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    new Capa().ell(9, 24.5, 1.4, 1.3).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    pon(g, Rj, 4, [13, 15], [20, 24]);
    return g.contorno();
  }

  /* Araña gigante de las cuevas: patas acodadas bien altas, ojos en racimo y un reloj de arena rojo en el lomo. */
  function arana() {
    const g = new Rejilla(), S = R.sombra, Sg = R.sangre, F = R.fuego;
    const pata = (pts, op) => {
      const c = new Capa();
      for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], i === 0 ? 2 : 1);
      c.pintar(g, S, { relieve: 1, ...op });
    };
    for (const p of [[[12, 23], [7, 12], [3, 29]], [[14, 23], [13, 12], [12, 31]], [[17, 23], [25, 21], [28, 31]], [[18, 22], [33, 19], [35, 29]]]) pata(p, { max: 1 });
    const abdomen = new Capa().ell(26, 14, 7.6, 7);
    abdomen.pintar(g, S, { relieve: 4, separar: true });
    new Capa().poly([[23.5, 9], [28.5, 9], [26, 12.5], [28.5, 16], [23.5, 16], [26, 12.5]]).recortar(abdomen).pintar(g, Sg, { relieve: 1, min: 3 });
    for (const [i, j] of [[21, 12], [30, 10], [31, 15], [22, 17], [27, 19], [32, 18], [20, 15]]) pon(g, S, 4, [i, j]);
    const torax = new Capa().ell(14, 23.5, 5, 3.6).ell(10.5, 23, 2.8, 2.6);
    torax.pintar(g, S, { relieve: 2.5, separar: true });
    for (const p of [[[12, 25], [5, 15], [1, 33]], [[14, 26], [10, 18], [7, 34]], [[16, 26], [21, 20], [24, 34]], [[17, 25], [29, 22], [32, 34]]]) pata(p, { max: 3, separar: true });
    new Capa().curva(9, 25, 7, 27, 8.5, 29, 2, 1).curva(11, 26, 10, 28, 11, 30, 2, 1).pintar(g, S, { relieve: 1, max: 2, separar: true });
    pon(g, HUESO, 2, [8, 29], [11, 30]);
    pon(g, F, 4, [10, 22]);
    pon(g, Sg, 4, [9, 22], [11, 22]);
    pon(g, F, 4, [9, 21], [11, 21]);
    pon(g, Sg, 3, [8, 23], [12, 21], [13, 22], [10, 20]);
    bordeLuz(g, S);
    return g.contorno();
  }

  /* Sombra: un espectro de humo violeta con la capucha vacía y dos ojos pálidos; flota, así que acaba en jirones. */
  function sombra() {
    const g = new Rejilla(), S = R.sombra, Mg = R.magia, E = ESPECTRO;
    new Capa().linea(23, 14, 27, 19, 2).linea(27, 19, 29, 24, 2).pintar(g, S, { relieve: 1, max: 2 });
    abanico(new Capa(), 29, 24, [[-1, 3], [0.5, 3], [2, 2]]).pintar(g, E, { relieve: 1, max: 2 });
    const cuerpo = new Capa().ell(18, 8.5, 4.6, 5).poly([[13, 9], [23, 9], [27, 18], [28, 26], [25, 33], [15, 34.5], [10, 29], [11, 18]]);
    [[12, 27, 1.4], [15.5, 29.5, 1.2], [19, 26.5, 1.5], [22.5, 30, 1.2], [26, 27, 1.5]].forEach(([x, y, a]) => cuerpo.restar(muesca(x, y, 35.5, a)));
    cuerpo.pintar(g, S, { relieve: 3, separar: true });
    /* El humo se va apagando hacia abajo en vetas onduladas, no en cuadrícula. */
    for (let y = 16; y < 36; y++) for (let x = 0; x < 36; x++) {
      if (!cuerpo.tiene(x, y)) continue;
      const veta = Math.sin(x * 1.3 + Math.sin(y * 0.45) * 2.2), f = (y - 16) / 18;
      const k = S.indexOf(g.get(x, y));
      if (veta < f * 1.6 - 0.6 && PX.umbral(x, y) < 0.3 + f) pon(g, S, Math.max(0, k - 1 - (f > 0.6 ? 1 : 0)), [x, y]);
      else if (veta > 0.82 && f < 0.85) pon(g, Mg, 1, [x, y]);
    }
    new Capa().ell(16, 10, 2.8, 3.2).pintar(g, S, { plano: 0 });
    new Capa().linea(13, 6, 18, 3.5, 1).linea(13, 6, 12.5, 13, 1).recortar(cuerpo).pintar(g, Mg, { plano: 3 });
    pon(g, Mg, 2, [14, 14], [18, 13], [19, 4], [20, 4]);
    pon(g, E, 4, [15, 9], [17, 9], [15, 10], [17, 10]);
    pon(g, E, 2, [15, 11], [17, 11]);
    new Capa().linea(14, 14, 9, 17, 2).linea(9, 17, 5, 15, 2).pintar(g, S, { relieve: 1, max: 3, separar: true });
    abanico(new Capa(), 4.5, 15, [[-3, -2], [-3.5, 0.5], [-2.5, 2.5]]).pintar(g, E, { relieve: 1, min: 2, max: 3 });
    bordeLuz(g, S);
    g.contorno(S[0]);
    for (const [x0, y0, x1, y1] of [[13, 32, 11, 35], [18, 33, 19, 35], [24, 32, 27, 35], [10, 28, 7, 31], [28, 24, 31, 27]]) hilo(g, x0, y0, x1, y1, S[3]);
    for (const [i, j, k] of [[8, 33, 2], [30, 31, 3], [26, 6, 3], [8, 9, 2], [31, 19, 2], [5, 25, 3]]) if (!g.get(i, j)) pon(g, Mg, k, [i, j]);
    return g;
  }

  /* Nhazgul, el Devorador de Estrellas: una masa de vacío con estrellas dentro, un ojo enorme,
     corona de cuernos y tentáculos. Borde violeta por la luz y cian por el otro lado. */
  const VACIO = ["#040208", "#0b0616", "#170d2c", "#2a1748", "#432670"];
  const CIAN = ["#08222a", "#0f4a56", "#1c8590", "#47c6c8", "#b6fff2"];
  function devorador() {
    const g = new Rejilla(), V = VACIO, Mg = R.magia, C = CIAN, az = PX.azar(23);
    const tentaculos = (op, ...l) => { const c = new Capa(); l.forEach(a => c.curva(...a)); c.pintar(g, V, { relieve: 2, ...op }); return c; };
    /* Ventosas que brillan en la cara de abajo de cada tentáculo. */
    const ventosas = (c, ram) => { for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (c.tiene(x, y) && !c.tiene(x, y + 1) && c.tiene(x - 1, y) && (x + y) % 3 === 0) pon(g, ram, 3, [x, y - 1]); };
    ventosas(tentaculos({ max: 2 }, [27, 22, 35, 25, 34, 14, 5, 1.5], [24, 27, 29, 35, 35, 32, 5, 1.5]), C);
    const cuernos = new Capa();
    for (const [x0, y0, cx, cy, x1, y1, gr] of [[11, 11, 5, 7, 5, 1, 4], [16, 8, 13.5, 3, 14.5, 0, 3.5], [21, 7, 22, 2, 25, 0, 4], [26, 9, 30, 5, 32, 0, 3.5], [29, 13, 34, 12, 35, 6, 3.5]]) cuernos.curva(x0, y0, cx, cy, x1, y1, gr, 1);
    cuernos.pintar(g, Mg, { relieve: 1.5, max: 3, separar: true });
    for (const [x, y] of [[5, 1], [14, 0], [25, 0], [32, 0], [35, 6], [5, 2], [32, 1]]) pon(g, C, 4, [x, y]);
    for (const [x, y] of [[8, 6], [15, 4], [22, 3], [29, 5], [32, 10]]) pon(g, Mg, 1, [x, y]);
    const cuerpo = new Capa().ell(19.5, 17.5, 12.5, 11).ell(14, 21, 8, 7);
    cuerpo.pintar(g, V, { relieve: 6, separar: true });
    /* Una nebulosa en espiral y estrellas sueltas dentro del vacío. */
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
      if (!cuerpo.tiene(x, y)) continue;
      const a = Math.atan2(y - 18, x - 22), d = Math.hypot(x - 22, y - 18), v = Math.sin(a * 2 + d * 0.45);
      if (v > 0.5 && PX.umbral(x, y) < (v - 0.5) * 2) pon(g, Mg, v > 0.9 && d > 4 ? 2 : 1, [x, y]);
    }
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(az() * 36), y = Math.floor(az() * 36), r = az();
      if (cuerpo.tiene(x, y) && cuerpo.tiene(x + 1, y) && cuerpo.tiene(x, y + 1) && cuerpo.tiene(x - 1, y)) pon(g, r > 0.8 ? HUESO : r > 0.4 ? C : Mg, r > 0.92 ? 4 : 3, [x, y]);
    }
    /* El ojo: párpado de vacío, globo cian, iris violeta y pupila rasgada. */
    const ojo = new Capa().ell(13.5, 15.5, 5.6, 4.4);
    new Capa().ell(13.5, 15.5, 6.8, 5.6).pintar(g, V, { plano: 0 });
    for (let a = 3.5; a < 6.0; a += 0.12) pon(g, Mg, 3, [Math.round(13.5 + Math.cos(a) * 6.6), Math.round(15.5 + Math.sin(a) * 5.4)]);
    ojo.pintar(g, C, { relieve: 3, min: 2 });
    new Capa().ell(12.5, 15.5, 3, 3.2).recortar(ojo).pintar(g, Mg, { relieve: 2, min: 2 });
    new Capa().rect(12, 12.5, 1, 7).recortar(ojo).pintar(g, V, { plano: 0 });
    pon(g, V, 0, [11, 15], [11, 16], [13, 15], [13, 16]);
    pon(g, HUESO, 4, [10, 13], [11, 13], [15, 13]);
    pon(g, Mg, 4, [14, 17]);
    /* Las fauces, con un resplandor de estrellas tragadas al fondo. */
    const boca = new Capa().poly([[8.5, 24], [25, 22], [23, 28.5], [12, 29.5]]);
    boca.pintar(g, V, { plano: 0 });
    for (let y = 22; y < 31; y++) for (let x = 8; x < 26; x++) if (boca.tiene(x, y)) {
      const f = 1 - Math.hypot((x - 17) / 7, (y - 26.5) / 2.6);
      if (f > 0 && PX.umbral(x, y) < f * 1.4) pon(g, C, f > 0.55 ? 3 : f > 0.25 ? 2 : 1, [x, y]);
    }
    for (let x = 10; x <= 23; x += 2) {
      const ya = Math.round(24 - (x - 9) * 0.12);
      pon(g, HUESO, 4, [x, ya]); pon(g, HUESO, 2, [x, ya + 1]);
      if (x < 22) pon(g, HUESO, 3, [x + 1, 28 + (x < 13 ? 1 : 0)]);
    }
    const delante = tentaculos({ separar: true }, [11, 26, 4, 25, 2, 33, 5, 2], [16, 28, 14, 34, 8, 35, 5, 2], [21, 28, 23, 33, 28, 35, 4.5, 1.5], [9, 19, 2, 16, 1, 24, 4, 1.5]);
    ventosas(delante, Mg);
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
      if (g.rampa(x, y) !== V) continue;
      if (!g.get(x - 1, y) || !g.get(x, y - 1)) pon(g, Mg, 2, [x, y]);
      else if (cuerpo.tiene(x, y) && (!g.get(x + 1, y) || !g.get(x, y + 1))) pon(g, C, 2, [x, y]);
    }
    g.contorno(V[0]);
    for (const [i, j, ram, k] of [[2, 9, C, 4], [1, 13, Mg, 3], [35, 22, C, 3], [5, 29, Mg, 4], [10, 2, Mg, 3], [30, 31, C, 4], [27, 1, C, 3], [0, 28, C, 3]]) if (!g.get(i, j)) pon(g, ram, k, [i, j]);
    destello(g, 2, 5, C); destello(g, 33, 28, Mg);
    return g;
  }

  /* ---------- Personajes no jugadores ---------- */
  /* PNJ con cuerpo de héroe, mirando a la izquierda. «encima» pinta antes del contorno y «brillo» después
     (destellos sin borde). Las dos reciben las coordenadas del héroe, que mira a la derecha. */
  function pnj(aspecto, encima, brillo) {
    const g = HEROES.componer({ ...aspecto, extras: encima ? [encima] : [], sinContorno: true });
    g.contorno();
    if (brillo) brillo(g, HEROES.plantilla(aspecto.cuerpo || HEROES.RAZAS[aspecto.raza].cuerpo));
    return g.espejo();
  }
  /* Falda larga hasta los tobillos, encima de las piernas. */
  const faldaLarga = (g, t, tela) => falda(t, t.suelo - t.pierTop - 2, 2).pintar(g, tela, { relieve: 3 });
  /* Delantal recto del pecho a las rodillas; «salvo» deja a la vista lo que sea de esa rampa (una barba). */
  function delantal(g, t, ram, salvo) {
    const c = new Capa().poly([[t.torL + 1, t.torTop + 2], [t.torR - 1, t.torTop + 2], [t.torR + 1, t.pierTop + 4], [t.torL - 1, t.pierTop + 4]]);
    if (salvo) for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (g.rampa(x, y) === salvo) c.off(x, y);
    c.pintar(g, ram, { relieve: 2, separar: true });
  }

  function fantasma() {
    const t = HEROES.plantilla("normal");
    const rey = HEROES.componer({ raza: "humano", clase: LLANO, piel: "clara", pelo: "canoso", barba: true, peinado: "largo", tela: "azul", objeto: "ninguno", sinContorno: true, extras: [(g, t) => {
      faldaLarga(g, t, R.tela.azul);
    }] });
    const g = rey.tenida(ESPECTRO);
    for (let y = t.pierTop + 1; y < 36; y++) for (let x = 0; x < 36; x++) g.quitar(x, y);
    const jiron = new Capa().poly([[t.torL - 2, t.pierTop], [t.torR + 3, t.pierTop], [t.torR + 1, t.pierTop + 3]]).curva(t.torR + 1, t.pierTop + 2, t.cx - 2, t.pierTop + 7, t.torL - 5, t.pierTop + 5, 4, 1);
    tramar(g, jiron, ESPECTRO, 1, 2, (x, y) => 0.9 - (y - t.pierTop) / 8);
    const x = t.cabX, y = t.ojoY;
    new Capa().poly([[x - 2, y + 2.5], [x + 5.5, y + 2.5], [x + 4.5, t.torTop + 5], [x + 1.5, t.torTop + 10], [x - 1, t.torTop + 5]]).pintar(g, ESPECTRO, { relieve: 2, min: 2, separar: 2 });
    [[x + 1, y + 4, x + 1, t.torTop + 7], [x + 3, y + 4, x + 2.5, t.torTop + 5]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).pintar(g, ESPECTRO, { plano: 2 }));
    new Capa().rect(x - 4, t.cabY - 5, 9, 2).rect(x - 4, t.cabY - 7, 1, 2).rect(x - 1, t.cabY - 8, 1, 3).rect(x + 2, t.cabY - 8, 1, 3).rect(x + 4, t.cabY - 7, 1, 2).pintar(g, ESPECTRO, { relieve: 1, min: 3, separar: true });
    pon(g, ESPECTRO, 4, [x - 1, t.cabY - 9], [x + 2, t.cabY - 9]);
    pon(g, ESPECTRO, 0, [x + 1, y], [x + 1, y + 1], [x + 4, y], [x + 4, y + 1], [x, y - 1], [x + 3, y - 1]);
    pon(g, ESPECTRO, 4, [x + 1, y + 1], [x + 4, y + 1]);
    for (let j = 0; j < 36; j++) for (let i = 0; i < 36; i++) if (g.get(i, j) && j > t.torBot && PX.umbral(i, j) > 0.55) pon(g, ESPECTRO, Math.max(1, ESPECTRO.indexOf(g.get(i, j)) - 1), [i, j]);
    g.contorno(ESPECTRO[0]);
    return g.espejo();
  }

  const PNJS = {
    tabernero: () => pnj({ raza: "humano", clase: LLANO, cuerpo: "fornido", piel: "clara", pelo: "castano", peinado: "rapado", tela: "ocre", objeto: "ninguno" }, (g, t, { piel, pelo }) => {
      const x = t.cabX, y = t.ojoY, [mx, my] = t.mano;
      new Capa().ell(x - 4.2, t.cabY + 0.5, 1.8, 2.6).pintar(g, pelo, { relieve: 1.5, separar: true });
      new Capa().rect(x - 3, t.cabY, 2, 3).pintar(g, piel, { relieve: 1, separar: 2 });
      new Capa().poly([[x + 1.5, y + 2], [x + 6.5, y + 2], [x + 7.5, y + 4.5], [x + 5, y + 3.2], [x + 3, y + 3.2], [x + 0.5, y + 4.5]]).pintar(g, pelo, { relieve: 1, separar: 2 });
      pon(g, R.piel.roja, 4, [x + 1, y + 2]);
      delantal(g, t, R.tela.blanco);
      for (let i = t.torL; i <= t.torR; i++) pon(g, R.madera, 2, [i, t.torBot - 2]);
      new Capa().rect(t.torL, t.torTop, 3, 5).pintar(g, R.tela.blanco, { relieve: 1, max: 3, separar: true });
      brazoDelante(g, t, piel);
      new Capa().rect(mx + 1, my - 4, 4, 5).pintar(g, R.madera, { relieve: 1.5, separar: true });
      for (let i = mx + 1; i <= mx + 4; i++) pon(g, R.hierro, 2, [i, my - 3], [i, my]);
      new Capa().ell(mx + 2.5, my - 4.8, 2.4, 1.2).pintar(g, HUESO, { relieve: 1, min: 3, separar: true });
    }),
    forastero: () => pnj({ raza: "humano", clase: "brujo", piel: "morena", tela: "negro", objeto: "ninguno" }, (g, t, { piel, tela }) => {
      const x = t.cabX, y = t.ojoY, [mx, my] = t.mano;
      for (let j = y - 2; j <= y + 4; j++) for (let i = x - 1; i <= x + 7; i++) if (g.get(i, j) && g.rampa(i, j) !== tela) g.set(i, j, tela[0], tela);
      pon(g, R.bronce, 4, [x + 2, y + 1], [x + 5, y + 1]);
      pon(g, piel, 1, [x + 6, y + 2]);
      pon(g, R.bronce, 3, [t.cx + 1, t.torTop + 1]);
      new Capa().rect(mx, my - 2, 6, 2).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
      pon(g, HUESO, 1, [mx + 5, my - 2], [mx + 5, my - 1]);
      pon(g, R.sangre, 3, [mx + 2, my - 2], [mx + 2, my - 1]);
      bordeLuz(g, tela);
    }),
    mercader: () => pnj({ raza: "humano", clase: LLANO, piel: "clara", pelo: "cobrizo", peinado: "recogido", tela: "azul", objeto: "balanza" }, (g, t) => {
      const x = t.cabX, [mx, my] = t.mano;
      faldaLarga(g, t, R.tela.azul);
      new Capa().poly([[t.cx - 2, t.torBot - 2], [t.cx + 4, t.torBot - 2], [t.cx + 5, t.suelo - 3], [t.cx - 3, t.suelo - 3]]).pintar(g, R.tela.blanco, { relieve: 2, separar: true });
      for (let i = t.torL; i <= t.torR; i++) pon(g, R.tela.blanco, 2, [i, t.torBot - 2]);
      pon(g, NEGRO, 1, [t.cx + 1, t.torTop + 2], [t.cx + 2, t.torTop + 3], [t.cx + 1, t.torTop + 4], [t.cx + 2, t.torTop + 5]);
      const cofia = new Capa().ell(x - 0.6, t.cabY - 1.6, t.cabRx + 0.8, t.cabRy - 0.4);
      for (let yy = 0; yy < 36; yy++) for (let xx = 0; xx < 36; xx++) if ((xx >= x - 1 && yy > t.ojoY - 3) || (xx < x - 1 && yy > t.cabY)) cofia.off(xx, yy);
      cofia.pintar(g, R.tela.blanco, { relieve: 2, separar: true });
      new Capa().ell(t.torL - 0.5, t.torBot, 1.6, 2).pintar(g, R.madera, { relieve: 1, separar: true });
      pon(g, R.bronce, 4, [t.torL - 1, t.torBot + 1]);
      pon(g, R.bronce, 2, [mx - 3, my - 5], [mx - 3, my - 4], [mx + 3, my - 5], [mx + 3, my - 4], [mx - 3, my - 2], [mx + 3, my - 2]);
      pon(g, R.bronce, 4, [mx, my - 7]);
    }),
    driada: () => pnj({ raza: "elfo", clase: LLANO, piel: "verde", pelo: "castano", peinado: "rapado", tela: "terracota", objeto: "ninguno" }, (g, t, { piel }) => {
      const H = R.hoja, M = R.madera, x = t.cabX;
      for (let y = t.pierTop + 3; y <= t.suelo; y++) for (let i = 0; i < 36; i++)
        if (g.rampa(i, y) === piel) g.set(i, y, M[Math.max(1, piel.indexOf(g.get(i, y)))], M);
      new Capa().linea(t.cx - 4, t.suelo, t.cx - 7, t.suelo, 1).linea(t.cx + 4, t.suelo, t.cx + 7, t.suelo, 1).pintar(g, M, { plano: 2 });
      const corteza = torso(t).unir(falda(t, 4, 1));
      [[t.torL, t.pierTop + 4.5], [t.cx, t.pierTop + 5], [t.torR + 1, t.pierTop + 4.5]].forEach(([i, j]) => corteza.restar(muesca(i, j - 2, j + 1, 1.2)));
      corteza.pintar(g, M, { relieve: 3 });
      for (let j = t.torTop + 1; j <= t.pierTop + 3; j++) for (let i = t.torL; i <= t.torR + 1; i++) if (g.rampa(i, j) === M && (i * 2 + j) % 5 === 0) pon(g, M, 1, [i, j]);
      for (const [i, j] of [[t.torL, t.pierTop + 2], [t.torR, t.pierTop + 3], [t.cx + 1, t.torTop + 1], [t.torL + 1, t.torTop + 3]]) new Capa().ell(i, j, 1.2, 1).pintar(g, H, { relieve: 1, min: 2, separar: true });
      brazoDelante(g, t, piel);
      const pelo = new Capa().ell(x - 0.8, t.cabY - 1.4, t.cabRx + 1.2, t.cabRy + 0.4);
      for (let yy = 0; yy < 36; yy++) for (let xx = 0; xx < 36; xx++) if (xx >= x - 1 && yy >= t.ojoY - 2) pelo.off(xx, yy);
      pelo.poly([[x - 6.5, t.cabY - 1], [x - 1.5, t.cabY], [x - 2, t.cabY + 3], [x - 3, t.torTop + 8], [x - 8.5, t.torTop + 6]]);
      for (const [i, j] of [[x - 7, t.cabY - 5], [x - 3, t.cabY - 8], [x + 2, t.cabY - 7.5], [x + 5, t.cabY - 4.5], [x - 9, t.cabY + 1], [x - 9, t.torTop + 3], [x - 4, t.torTop + 8]]) pelo.ell(i, j, 1.4, 1.4);
      pelo.pintar(g, H, { relieve: 2, separar: true });
      for (let yy = 0; yy < 36; yy++) for (let xx = 0; xx < 36; xx++) if (pelo.tiene(xx, yy) && (xx * 3 + yy * 5) % 7 === 0) pon(g, H, 1, [xx, yy]);
      new Capa().linea(x - 2, t.cabY + 1, x - 6, t.cabY - 3, 2).on(x - 3, t.cabY + 2).pintar(g, piel, { relieve: 1, separar: 2 });
      for (const [i, j, c] of [[x - 4, t.cabY - 6, 0], [x + 3, t.cabY - 6, 1], [x - 8, t.cabY + 3, 0], [x - 1, t.cabY - 8, 1], [x - 7, t.torTop + 4, 1], [x - 6, t.cabY - 2, 0]]) {
        pon(g, c ? HUESO : R.piel.roja, 4, [i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]);
        pon(g, R.bronce, 4, [i, j]);
      }
      const [mx, my] = t.mano;
      new Capa().curva(mx - 3, my + 1, mx, my - 3, mx + 2, my - 6, 1).pintar(g, H, { plano: 2 });
      pon(g, R.piel.roja, 4, [mx + 2, my - 7], [mx + 3, my - 7]);
      pon(g, R.bronce, 4, [mx + 2, my - 6]);
    }),
    gnomo: () => pnj({ raza: "gnomo", clase: LLANO, piel: "clara", pelo: "canoso", peinado: "rizado", tela: "granate", objeto: "ninguno" }, (g, t) => {
      const x = t.cabX, y = t.ojoY, [mx, my] = t.mano;
      detras(g, new Capa().rect(t.torL - 7, t.torTop - 7, 8, 13).off(t.torL - 7, t.torTop - 7), R.madera, { relieve: 2, separar: true });
      for (let j = t.torTop - 5; j <= t.torTop + 5; j += 3) pon(g, R.madera, 1, [t.torL - 6, j], [t.torL - 5, j]);
      detras(g, new Capa().ell(t.torL - 3, t.torTop - 8, 4, 1.6), R.tela.azul, { relieve: 1.5, separar: true });
      detras(g, new Capa().rect(t.torL - 6, t.torTop - 13, 1, 5).ell(t.torL - 6, t.torTop - 13, 1.2, 1.2), R.plata, { relieve: 1, min: 2 });
      new Capa().linea(t.torL + 1, t.torTop, t.torL + 2, t.torBot - 2, 1).pintar(g, R.madera, { plano: 1 });
      for (const ex of [x + 1.5, x + 4.5]) new Capa().ell(ex, y - 3, 1.3, 1.2).pintar(g, R.bronce, { relieve: 1, min: 2, separar: true });
      pon(g, R.mar, 4, [x + 1, y - 3], [x + 4, y - 3]);
      pon(g, HUESO, 4, [x + 2, y - 4], [x + 5, y - 4]);
      for (let i = x - 5; i <= x - 1; i++) if (g.rampa(i, y - 3) === R.pelo.canoso) pon(g, R.madera, 1, [i, y - 3]);
      new Capa().rect(mx + 1, my - 6, 2, 3).pintar(g, R.plata, { relieve: 1, min: 3, separar: true });
      new Capa().ell(mx + 1.5, my - 1.5, 2.2, 2.2).pintar(g, R.hoja, { relieve: 1.5, min: 2, separar: true });
      pon(g, HUESO, 4, [mx + 1, my - 2]);
    }, (g, t) => {
      const [mx, my] = t.mano;
      for (const [i, j] of [[mx + 2, my - 8], [mx + 1, my - 10], [mx + 3, my - 11]]) if (!g.get(i, j)) pon(g, R.hoja, 4, [i, j]);
    }),
    fantasma,
    herrero: () => pnj({ raza: "enano", clase: LLANO, piel: "oliva", pelo: "canoso", peinado: "corto", tela: "terracota", objeto: "martillo" }, (g, t, { piel, pelo }) => {
      delantal(g, t, R.madera, pelo);
      for (let yy = t.torTop + 3; yy <= t.pierTop + 3; yy += 3) pon(g, R.madera, 1, [t.cx + 2, yy]);
      for (let yy = 0; yy < 36; yy++) for (let xx = 0; xx < 36; xx++) if (g.rampa(xx, yy) === pelo) g.set(xx, yy, R.hierro[pelo.indexOf(g.get(xx, yy))], R.hierro);
      pon(g, R.bronce, 4, [t.cabX + 1, t.torTop + 3], [t.cabX + 1, t.torTop + 6]);
      pon(g, R.piedra, 2, [t.cabX + 2, t.ojoY - 1], [t.cabX + 5, t.ojoY + 1], [t.cabX - 1, t.ojoY]);
      brazoDelante(g, t, piel);
      const [mx, my] = t.mano;
      pon(g, R.fuego, 3, [mx - 2, my - 8], [mx + 2, my - 9]);
    }),
    planar: () => pnj({ raza: "tiefling", clase: LLANO, piel: "azul", pelo: "negro", peinado: "rapado", tela: "granate", objeto: "ninguno" }, (g, t, { piel, tela }) => {
      const x = t.cabX, y = t.ojoY, [mx, my] = t.mano;
      faldaLarga(g, t, tela);
      for (let yy = t.torBot; yy <= t.suelo; yy++) for (let xx = 0; xx < 36; xx++) if (g.rampa(xx, yy) === tela && g.rampa(xx, yy + 1) !== tela) pon(g, R.bronce, 3, [xx, yy]);
      for (let i = t.torL; i <= t.torR; i++) pon(g, R.tela.ocre, 3, [i, t.torBot - 2], [i, t.torBot - 3]);
      const turbante = new Capa().ell(x - 0.5, t.cabY - 2.6, t.cabRx + 1, 3.4).ell(x - 1.5, t.cabY - 6, 2.6, 1.8);
      turbante.quitarRect(0, y - 1, 36, 36);
      turbante.pintar(g, R.tela.blanco, { relieve: 2, separar: true });
      for (let i = x - 6; i <= x + 4; i++) for (let j = t.cabY - 8; j <= y - 2; j++) if (turbante.tiene(i, j) && (i + j * 2) % 5 === 0) pon(g, R.tela.blanco, 1, [i, j]);
      pon(g, R.magia, 4, [x + 3, t.cabY - 3]);
      pon(g, R.bronce, 4, [x + 4, t.cabY - 3]);
      pon(g, piel, 1, [x + 1, y], [x + 4, y]);
      pon(g, piel, 0, [x + 3, y + 3], [x + 5, y + 2]);
      pon(g, HUESO, 4, [x + 4, y + 3]);
      new Capa().ell(mx + 1.5, my + 2.5, 2.4, 2.8).rect(mx + 1, my, 2, 1).pintar(g, R.tela.violeta, { relieve: 2, separar: true });
      pon(g, R.bronce, 3, [mx + 1, my + 1], [mx + 2, my + 1]);
      pon(g, R.bronce, 4, [mx - 1, my], [mx, my - 1]);
    }, (g, t) => {
      const [mx, my] = t.mano;
      destello(g, mx + 5, my + 1, R.magia);
      if (!g.get(mx + 4, my + 5)) pon(g, R.magia, 4, [mx + 4, my + 5]);
    })
  };

  return {
    MONSTRUOS: { rata, goblin, osolechuza, trol, esqueleto, mimico, liche, cubo, golem, dragon, lobo, armadura, vampiro, kobold, elemental, diablillo, arana, sombra, devorador },
    PNJ: PNJS
  };
})();
