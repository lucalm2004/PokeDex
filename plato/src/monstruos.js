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
    MONSTRUOS: { rata, goblin, osolechuza, trol, esqueleto, mimico, liche, cubo, golem, dragon },
    PNJ: PNJS
  };
})();
