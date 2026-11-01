/* Dados y Mazmorras · enemigos normales en alta definición (segunda tanda).
   Cada entrada de MONSTRUOS_HD devuelve una Rejilla nueva de 48×48, con contorno, mirando a la
   izquierda (hacia los héroes) y con los pies en la fila 46. Los que flotan (elemental, sombra)
   acaban en llamas o jirones en vez de pies. Misma identidad y paleta que en monstruos.js. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral } = PX;
  const W = 48;
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  /* Rampas propias (5 tonos, de la sombra al brillo). */
  const LOBO = ["#17191b", "#26292c", "#3b3f42", "#565b5e", "#777c7e"]; // pelaje oscuro del lomo del huargo
  const ESPECTRO = ["#1e2c3c", "#3c5a74", "#6a92ae", "#9cc2d8", "#d8eef6"]; // ojos y garras pálidas de la sombra
  const CALOR = ["#a8360e", "#e0661a", "#ffa53a", "#ffe08a", "#fffbe6"]; // corazón del fuego, hasta el blanco
  const VACIO = ["#050308", "#0c0712", "#160e1e", "#241732", "#36234a"]; // hueco de la armadura
  const CUERDA = ["#3a2a14", "#5e4622", "#8a6a36", "#b8945a", "#dcc08a"]; // red del kobold

  const capa = () => new Capa(W, W);
  /* Varios píxeles del mismo tono de una rampa. */
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Pinta una capa solo donde no hay nada todavía, como si quedara detrás. */
  function detras(g, c, ram, op) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (g.get(x, y)) c.off(x, y);
    return c.pintar(g, ram, op);
  }
  /* Rellena una capa con un degradado tramado entre dos tonos; f(x, y) va de 0 a 1. */
  function tramar(g, c, ram, i0, i1, f) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (c.tiene(x, y)) g.set(x, y, ram[f(x, y) > umbral(x, y) ? i1 : i0], ram);
  }
  /* Línea fina sin contorno: solo pinta los píxeles vacíos. */
  function hilo(g, x0, y0, x1, y1, color, ram = null) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (!g.get(x, y)) g.set(x, y, color, ram);
    }
  }
  /* Cambia de tono (±d) los píxeles de una rampa que caen dentro de la capa. */
  function tono(g, c, ram, d, cond = () => true) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y) || g.rampa(x, y) !== ram || !cond(x, y)) continue;
      const k = ram.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, ram[Math.max(0, Math.min(4, k + d))], ram);
    }
  }
  /* Pasa a otra rampa (mismo índice de tono) los píxeles de una rampa dentro de la capa. */
  function cambiar(g, c, de, a, cond = () => true) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y) || g.rampa(x, y) !== de || !cond(x, y)) continue;
      const k = de.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, a[k], a);
    }
  }
  /* Borde iluminado arriba a la izquierda, para que lo muy oscuro se lea sobre fondos oscuros. */
  function bordeLuz(g, ram, t = 3) {
    const borde = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < t) borde.push([x, y]);
    pon(g, ram, t, ...borde);
  }
  /* Distancia (aproximada) de cada píxel de la capa a su borde. */
  function distancia(c) {
    const d = new Float32Array(W * W);
    for (let i = 0; i < d.length; i++) d[i] = c.m[i] ? 1e6 : 0;
    const D = (x, y) => (x < 0 || y < 0 || x >= W || y >= W ? 0 : d[y * W + x]);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i]) d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
    }
    for (let y = W - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (d[i]) d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
    }
    return d;
  }
  /* Pinta algo que da luz propia (fuego): más claro cuanto más hacia dentro, con tramado en los saltos. */
  function brasa(g, c, ram, cortes, base = 0, sesgo = () => 0) {
    const d = distancia(c);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      const v = d[y * W + x] + sesgo(x, y) + (umbral(x, y) - 0.5) * 0.9;
      let t = base;
      for (const k of cortes) if (v > k) t++;
      g.set(x, y, ram[Math.min(4, t)], ram);
    }
  }
  /* Destello de cuatro puntas, sin contorno. */
  const destello = (g, x, y, ram = R.bronce) => {
    pon(g, ram, 4, [x, y]);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!g.get(x + a, y + b)) pon(g, HUESO, 4, [x + a, y + b]); });
  };
  /* Muesca triangular con la punta hacia arriba, para deshilachar bordes inferiores. */
  const muesca = (x, y, abajo, ancho = 1.7) => capa().poly([[x - ancho, abajo], [x, y], [x + ancho, abajo]]);
  /* Lengua de fuego o mechón: triángulo de la base (x0..x1, y) a una punta. */
  const lengua = (c, x0, x1, y, px, py) => c.poly([[x0, y], [px, py], [x1, y]]);

  /* ---------- Huargo: un lobo enorme, agazapado y gruñendo, con el lomo erizado ---------- */
  function lobo() {
    const g = new Rejilla(W, W), G = R.piel.gris, D = LOBO;
    const az = PX.azar(7);
    /* Cola tupida, baja y tensa. */
    const cola = capa().curva(38, 26, 46, 27, 45, 37, 5, 2.5);
    lengua(cola, 44, 47, 30, 47.5, 33); lengua(cola, 43, 46, 34, 46, 38.5); lengua(cola, 40, 43, 28, 44, 26);
    cola.pintar(g, D, { relieve: 2, max: 3 });
    /* Patas del lado de lejos, en sombra. */
    capa().ell(36, 32, 4, 5).linea(37, 35, 40, 40, 3).linea(40, 40, 39, 44, 2).ell(38.5, 45.3, 2.4, 1.3)
      .linea(21, 32, 22, 43, 3).ell(21, 45.2, 2.5, 1.4).pintar(g, D, { relieve: 1.5, max: 2 });
    /* Cuerpo: pecho hondo, lomo arqueado y el pelo de la cruz de punta. */
    const cuerpo = capa().ell(28, 29.5, 11, 6.5).ell(19, 29, 7.5, 8).ell(36, 30, 5, 6);
    for (const [x, b, h] of [[12, 24, 3], [14.5, 22.5, 4.5], [17.5, 21.5, 6], [20.5, 21.5, 6.5], [23.5, 22.5, 5.5], [26.5, 23, 4.5], [29.5, 23, 3.5], [32.5, 23.5, 3], [35.5, 24.5, 2.5]])
      cuerpo.poly([[x - 2, b + 1.5], [x + 2.2, b - h], [x + 1.8, b + 1.5]]);
    for (const x of [21, 25, 29, 33]) lengua(cuerpo, x - 1.6, x + 1.4, 35, x - 0.4, 38);
    cuerpo.pintar(g, G, { relieve: 4, separar: true });
    /* Lomo más oscuro, con borde tramado. */
    cambiar(g, cuerpo, G, D, (x, y) => y < 25.5 + Math.sin(x * 0.8) * 1.2 + (umbral(x, y) > 0.5 ? 1 : 0));
    /* Mechones: trazos cortos en la dirección del pelo (hacia atrás y abajo). */
    for (let i = 0; i < 26; i++) {
      const x = Math.round(14 + az() * 26), y = Math.round(25 + az() * 9);
      if (!cuerpo.tiene(x, y) || !cuerpo.tiene(x + 1, y + 1)) continue;
      const ram = g.rampa(x, y), k = ram ? ram.indexOf(g.get(x, y)) : -1;
      if (k > 0) { g.set(x, y, ram[k - 1], ram); g.set(x + 1, y + 1, ram[Math.max(0, k - 1)], ram); }
    }
    /* Pechera más clara. */
    tono(g, capa().ell(15, 31, 4, 5), G, 1, (x, y) => y > 28);
    /* Patas de este lado: la delantera recta y la trasera con el corvejón. */
    const pd = capa().linea(16, 31, 14, 39, 4).linea(14, 39, 13, 43, 3).ell(11.5, 45, 3, 1.6);
    pd.pintar(g, G, { relieve: 2, separar: true });
    const pt = capa().ell(33, 32.5, 5, 5.5).linea(34, 36, 37, 40, 3).linea(37, 40, 36, 44, 2).ell(34, 45.3, 2.8, 1.3);
    pt.pintar(g, G, { relieve: 2.5, separar: true });
    pon(g, G, 1, [11, 45], [13, 45], [33, 45], [35, 45], [20, 45]);
    pon(g, HUESO, 4, [9, 46], [11, 46], [32, 46]);
    pon(g, HUESO, 3, [19, 46], [37, 46]);
    /* Cabeza gacha, orejas aplastadas, hocico arrugado y las fauces abiertas. */
    capa().poly([[10, 22.5], [13.5, 17.5], [14, 23]]).pintar(g, D, { relieve: 1.5, max: 2 });
    const cab = capa().ell(12, 26, 5.5, 4.8)
      .poly([[10, 23.5], [3, 25.5], [1, 27.2], [1.5, 29.4], [11, 30]])
      .poly([[11, 31.4], [3.5, 32.2], [4.5, 34.4], [12, 34]]);
    lengua(cab, 15, 17.5, 24, 21, 20.5); // oreja
    for (const [y, h] of [[27, 3], [29.5, 3.5], [32, 2.5]]) cab.poly([[16, y - 1.5], [16 + h + 1.5, y + 0.5], [16, y + 1.5]]); // gorguera
    cab.pintar(g, G, { relieve: 3, separar: true });
    tono(g, capa().poly([[15, 21], [21, 20.5], [16.5, 24.5]]), G, -1);
    pon(g, D, 1, [16, 23], [17, 22]);
    /* Boca: encía oscura, colmillos y lengua. */
    for (let x = 2; x <= 11; x++) pon(g, R.sangre, x < 6 ? 0 : 1, [x, 30], [x, 31]);
    pon(g, R.sangre, 3, [6, 31], [7, 31], [8, 31]);
    pon(g, R.sangre, 4, [7, 31]);
    pon(g, HUESO, 4, [3, 30], [3, 31], [7, 30], [4, 32], [4, 31], [6, 32]);
    pon(g, HUESO, 3, [5, 30], [9, 30], [8, 32], [10, 30]);
    pon(g, NEGRO, 0, [1, 27], [1, 28], [2, 27]);
    pon(g, G, 4, [2, 26]);
    /* Arrugas del gruñido y ceño. */
    pon(g, G, 1, [4, 26], [5, 25], [6, 26], [7, 25], [8, 26], [5, 28], [7, 28]);
    pon(g, NEGRO, 1, [8, 24], [9, 24], [10, 24], [11, 25]);
    pon(g, R.bronce, 4, [9, 25], [10, 25]);
    pon(g, R.fuego, 2, [10, 26]);
    pon(g, NEGRO, 0, [11, 26]);
    pon(g, G, 1, [7, 33], [9, 34], [11, 34], [13, 33]);
    return g.contorno();
  }

  /* ---------- Armadura animada: placas de hierro sin nadie dentro, ojos azules en la celada y un mandoble ---------- */
  function armadura() {
    const g = new Rejilla(W, W), F = R.hierro, P = R.plata, Gr = R.tela.granate, Ox = R.oricalco, M = R.mar, V = VACIO;
    /* Capa raída a la espalda. */
    const manto = capa().poly([[26, 16], [33, 16], [38, 27], [41, 43], [33, 44], [28, 40]]);
    for (const [x, y] of [[31.5, 40], [35.5, 38.5], [39, 40.5]]) manto.restar(muesca(x, y, 45, 1.4));
    manto.pintar(g, Gr, { relieve: 2.5, max: 2 });
    for (const [x0, y0, x1] of [[33, 20, 36], [35, 26, 39], [37, 33, 40]]) for (let x = x0, y = y0; x <= x1; x++, y += 2) if (manto.tiene(x, y)) pon(g, Gr, 0, [x, y]);
    /* Lo de dentro: vacío oscuro, que se ve por las juntas. */
    capa().rect(19, 14, 10, 30).pintar(g, V, { relieve: 2, max: 1 });
    /* Pierna de atrás. */
    capa().rect(27, 35, 5, 8).pintar(g, F, { relieve: 1.5, max: 2, separar: true });
    capa().ell(29.5, 38.5, 3, 2.2).pintar(g, F, { relieve: 1.5, max: 2, separar: true });
    capa().poly([[25, 46.6], [26.5, 43], [32.5, 43], [33, 46.6]]).pintar(g, F, { relieve: 1.5, max: 2, separar: true });
    /* Hombrera de atrás. */
    capa().ell(30.5, 19.5, 4.5, 4).pintar(g, F, { relieve: 2, max: 2, separar: true });
    /* Peto abombado, con un ristre y remaches. */
    const peto = capa().poly([[17, 18], [30, 18], [31.5, 23], [29.5, 30.5], [18.5, 30.5], [16, 23]]);
    peto.pintar(g, F, { relieve: 6, separar: true });
    for (let x = 17; x <= 30; x++) if (peto.tiene(x, 26)) pon(g, F, 1, [x, 26]);
    for (let x = 18; x <= 29; x++) if (peto.tiene(x, 27)) pon(g, F, x < 22 ? 3 : 2, [x, 27]);
    pon(g, P, 4, [19, 27], [23, 27], [27, 27]);
    pon(g, P, 4, [19, 20], [20, 20], [19, 21]);
    /* Faldar: tres láminas solapadas. */
    for (let i = 0; i < 3; i++) {
      const l = capa().poly([[18 - i * 0.7, 30.5 + i * 2], [30 + i * 0.6, 30.5 + i * 2], [30.5 + i * 0.6, 32.5 + i * 2], [17.5 - i * 0.7, 32.5 + i * 2]]);
      l.pintar(g, F, { relieve: 1.2, separar: true });
      pon(g, F, 4, [Math.round(18 - i * 0.7), 31 + i * 2]);
    }
    /* Tabardo hecho jirones colgando por delante, con el emblema de oro. */
    const tab = capa().poly([[20, 30], [26, 30], [26.5, 40.5], [19.5, 40.5]]);
    tab.restar(muesca(23, 38, 41.5, 1.2));
    tab.pintar(g, Gr, { relieve: 1.5, separar: true });
    pon(g, R.bronce, 3, [22, 32], [21, 33], [22, 34], [23, 35], [24, 34], [25, 33], [24, 32]);
    pon(g, R.bronce, 4, [23, 31]);
    pon(g, Gr, 1, [23, 33]);
    pon(g, Gr, 3, [22, 33], [23, 32]);
    /* Pierna de delante: muslera, rodillera, greba y escarpe puntiagudo. */
    capa().rect(18, 36, 5, 4).pintar(g, F, { relieve: 1.5, separar: true });
    capa().rect(18, 41, 5, 3).pintar(g, F, { relieve: 1.5, separar: true });
    capa().ell(20.5, 40, 3, 2).pintar(g, F, { relieve: 1.5, min: 2, separar: true });
    capa().poly([[13, 46.6], [15, 43.6], [18, 43], [23.5, 43], [23.5, 46.6]]).pintar(g, F, { relieve: 1.5, separar: true });
    pon(g, F, 4, [19, 39], [15, 44], [16, 44]);
    pon(g, F, 1, [18, 45], [19, 45], [20, 45], [21, 45]);
    /* Cresta de crin roja. */
    const cresta = capa().curva(21, 3.5, 28, 1, 34, 6, 3, 1.5);
    lengua(cresta, 31, 34, 5, 37, 9.5); lengua(cresta, 28, 31, 4, 34, 9);
    cresta.pintar(g, Gr, { relieve: 1.5, separar: true });
    pon(g, Gr, 4, [23, 2], [24, 2]);
    /* Yelmo cerrado: frente plana hacia la izquierda, rendija de los ojos y respiraderos. */
    const yelmo = capa().ell(24, 9, 6, 5.6).rect(18, 9, 12, 7).off(29, 15).off(18, 15);
    yelmo.pintar(g, F, { relieve: 4, separar: true });
    for (let y = 5; y <= 15; y++) if (yelmo.tiene(19, y)) pon(g, F, 3, [18, y]);
    for (let x = 18; x <= 29; x++) if (yelmo.tiene(x, 8)) pon(g, F, x < 23 ? 4 : 3, [x, 8]);
    for (let x = 17; x <= 23; x++) pon(g, V, 0, [x, 10]);
    for (let x = 18; x <= 23; x++) pon(g, F, 1, [x, 11]);
    pon(g, M, 4, [18, 10], [21, 10]);
    pon(g, M, 3, [19, 10], [22, 10]);
    pon(g, M, 2, [17, 10], [20, 10]);
    pon(g, M, 1, [18, 9], [21, 9]);
    for (const [x, y] of [[19, 13], [21, 13], [19, 14], [21, 14], [23, 13]]) pon(g, V, 1, [x, y]);
    pon(g, F, 1, [26, 9], [26, 10], [26, 11], [26, 12], [26, 13], [26, 14], [26, 15]);
    pon(g, P, 4, [27, 12]);
    /* Gola: hueco oscuro bajo el yelmo, con el brillo azul de dentro. */
    capa().rect(20, 16, 8, 2).pintar(g, V, { relieve: 1, max: 2, separar: true });
    pon(g, M, 1, [23, 16], [24, 17]);
    pon(g, M, 2, [24, 16]);
    /* Hombrera de delante con láminas. */
    const hom = capa().ell(17.5, 19.5, 5.5, 4.2);
    hom.pintar(g, F, { relieve: 3, separar: true });
    for (let x = 12; x <= 23; x++) if (hom.tiene(x, 21) && hom.tiene(x, 23)) pon(g, F, 1, [x, 21]);
    pon(g, F, 4, [14, 17], [15, 17], [16, 16]);
    /* Brazo: codal, avambrazo y los guanteletes cerrados sobre el puño del mandoble. */
    capa().linea(16, 22, 14, 26, 4).pintar(g, F, { relieve: 1.5, separar: true });
    pon(g, V, 0, [15, 26], [16, 26]);
    capa().ell(14, 27, 2.4, 1.8).pintar(g, F, { relieve: 1.5, min: 2, separar: true });
    capa().linea(14, 28, 12, 30, 4).pintar(g, F, { relieve: 1.5, separar: true });
    /* Mandoble alzado, con la hoja de plata y un canal oscuro. */
    const hoja = capa().rect(8, 3, 3, 24).poly([[8, 3.5], [9.5, -0.5], [11, 3.5]]);
    hoja.pintar(g, P, { relieve: 1, min: 2, separar: true });
    for (let y = 4; y <= 24; y++) { pon(g, P, 1, [9, y]); pon(g, P, 3, [8, y]); }
    pon(g, P, 4, [8, 5], [8, 6], [8, 14], [8, 15], [9, 1], [9, 2]);
    capa().rect(4, 27, 11, 2).pintar(g, F, { relieve: 1, min: 2, separar: true });
    pon(g, R.bronce, 3, [4, 27], [14, 27], [4, 28], [14, 28]);
    pon(g, R.bronce, 4, [4, 27], [14, 27]);
    capa().rect(8, 29, 3, 6).pintar(g, R.madera, { relieve: 1, max: 2 });
    capa().ell(9.5, 35.8, 1.6, 1.3).pintar(g, R.bronce, { relieve: 1, min: 2, separar: true });
    capa().rect(7, 29, 5, 3).pintar(g, F, { relieve: 1.2, min: 2, separar: true });
    capa().rect(7, 32, 5, 2).pintar(g, F, { relieve: 1.2, min: 1, max: 2, separar: true });
    pon(g, F, 4, [7, 29], [8, 29], [9, 29]);
    pon(g, F, 1, [8, 30], [10, 30]);
    /* Algo de óxido. */
    for (const [x, y] of [[28, 22], [20, 24], [29, 41], [25, 13], [13, 20]]) pon(g, Ox, 1, [x, y]);
    pon(g, Ox, 2, [29, 22], [26, 13]);
    return g.contorno();
  }

  /* ---------- Kobold trampero: pequeño, de escamas rojas, con lanza, red y una bolsa de lo que ha robado ---------- */
  function kobold() {
    const g = new Rejilla(W, W), P = R.piel.roja, T = R.tela.terracota, Md = R.madera, Fe = R.hierro, C = CUERDA;
    /* Cola enroscada en el suelo. */
    capa().curva(28, 35, 38, 45, 44, 38, 4, 1.5).pintar(g, P, { relieve: 2 });
    /* Red recogida colgando de la mano de atrás: malla de cuerda. */
    const red = capa().poly([[31, 24], [37, 27], [40, 36], [37, 42], [30, 41], [29, 33]]);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (red.tiene(x, y) && (x + y) % 3 && (x - y + 99) % 3) red.off(x, y);
    red.pintar(g, C, { relieve: 1.5, min: 1, max: 3 });
    capa().ell(33, 40.5, 1.6, 1.3).ell(38.5, 38, 1.3, 1.3).ell(36, 42, 1.2, 1.2).pintar(g, Fe, { relieve: 1, min: 1 });
    /* Pierna de atrás, en sombra. */
    capa().ell(27, 36, 3, 3.5).linea(28, 38, 30, 42, 2).linea(30, 42, 29, 45, 2).rect(27, 45, 4, 2).pintar(g, P, { relieve: 1.5, max: 2 });
    /* Brazo de atrás que sujeta la red. */
    capa().linea(27, 24, 31, 28, 3).ell(31.5, 28.5, 1.6, 1.6).pintar(g, P, { relieve: 1.5, max: 2, separar: true });
    /* Torso encorvado y barriga más clara. */
    const tor = capa().ell(23, 29, 5.5, 6.5);
    tor.pintar(g, P, { relieve: 3.5, separar: true });
    tono(g, capa().ell(20, 30, 2.6, 4.5), P, 1);
    for (const y of [27, 29, 31, 33]) pon(g, P, 2, [19, y], [20, y], [21, y]);
    /* Taparrabos y cinturón con la bolsa de oro. */
    const tap = capa().poly([[17.5, 33], [28.5, 33], [29, 38], [25, 39.5], [23, 37], [20.5, 39.5], [17, 38]]);
    tap.pintar(g, T, { relieve: 2, separar: true });
    for (let x = 17; x <= 29; x++) if (tap.tiene(x, 33)) pon(g, Md, x % 3 ? 2 : 1, [x, 33]);
    pon(g, R.bronce, 4, [22, 33]);
    capa().ell(28, 36, 2.6, 2.4).pintar(g, Md, { relieve: 1.5, separar: true });
    pon(g, R.bronce, 4, [27, 34], [29, 34]);
    pon(g, R.bronce, 3, [28, 34]);
    /* Pierna de delante: muslo, espinilla hacia atrás y pie de tres dedos. */
    const pierna = capa().ell(20.5, 37.5, 3.4, 3.5).linea(21, 40, 22.5, 43, 3).linea(22.5, 43, 21, 45, 2).poly([[16, 46.6], [17, 44.5], [23, 44.5], [23.5, 46.6]]);
    pierna.pintar(g, P, { relieve: 2, separar: true });
    pon(g, HUESO, 4, [15, 46], [17, 46]);
    pon(g, HUESO, 3, [19, 46]);
    pon(g, P, 1, [18, 46], [20, 46]);
    /* Cabeza de lagarto: cráneo, hocico largo, mandíbula, cuernos hacia atrás y cresta. */
    const cuernos = capa().curva(24, 15, 29, 11, 33, 12.5, 2.5, 1).curva(25, 18, 30, 16.5, 32, 18.5, 2, 1);
    cuernos.pintar(g, HUESO, { relieve: 1, separar: true });
    const cresta = capa();
    for (const [x, y] of [[25, 18], [26.5, 20.5], [27, 23]]) cresta.poly([[x - 1, y], [x + 3, y + 0.5], [x, y + 2]]);
    cresta.pintar(g, R.tela.granate, { relieve: 1, separar: true });
    const cab = capa().ell(22, 18, 5, 4.5)
      .poly([[19, 15], [11, 17], [10, 18.8], [11, 20.5], [20, 21]])
      .poly([[19, 21], [12, 21.2], [13, 22.8], [21, 23.5]]);
    cab.pintar(g, P, { relieve: 3, separar: true });
    pon(g, P, 1, [12, 21], [13, 21], [14, 21], [15, 21], [16, 21], [17, 21]);
    pon(g, HUESO, 4, [13, 21], [16, 21]);
    pon(g, NEGRO, 0, [11, 18]);
    pon(g, P, 4, [13, 16], [14, 16], [21, 14]);
    /* Ojo grande y amarillo, con ceja de escamas. */
    pon(g, NEGRO, 1, [17, 15], [18, 15], [19, 15], [20, 16]);
    pon(g, R.bronce, 4, [17, 16], [18, 16]);
    pon(g, R.bronce, 3, [18, 17]);
    pon(g, NEGRO, 0, [19, 16], [19, 17]);
    for (const [x, y] of [[23, 16], [25, 17], [22, 19], [24, 20], [26, 15]]) pon(g, P, 1, [x, y]);
    /* Brazo de delante con la lanza. */
    capa().linea(20, 24, 16, 28, 3).linea(16, 28, 12.5, 29, 2).pintar(g, P, { relieve: 1.5, separar: true });
    const lanza = capa().linea(15, 44, 6, 9, 1);
    lanza.pintar(g, Md, { plano: 2 });
    for (let y = 10; y <= 43; y++) if (y % 4 === 0) for (let x = 0; x < W; x++) if (lanza.tiene(x, y)) pon(g, Md, 3, [x, y]);
    capa().poly([[3.5, 9.5], [4.5, 2.5], [8.5, 8.5], [6, 10.5]]).pintar(g, Fe, { relieve: 1, min: 2, separar: true });
    pon(g, Fe, 4, [5, 4], [5, 5], [6, 6]);
    pon(g, R.tela.granate, 3, [7, 11], [8, 12], [9, 12]);
    pon(g, R.tela.granate, 2, [7, 12], [9, 13]);
    pon(g, R.tela.granate, 4, [6, 11]);
    capa().ell(11.5, 29, 1.8, 1.8).pintar(g, P, { relieve: 1, separar: true });
    pon(g, P, 1, [10, 30], [12, 30]);
    return g.contorno();
  }

  /* ---------- Elemental de fuego: fuego vivo con forma de cuerpo; flota y acaba en una cola de llamas ---------- */
  function elemental() {
    const g = new Rejilla(W, W), F = R.fuego, C = CALOR;
    /* Brazo de atrás alzado, con una bola de fuego en la mano. */
    const atras = capa().linea(30, 20, 35, 15, 4).linea(35, 15, 37, 9, 3).ell(37.5, 6.5, 3.4, 3.4);
    lengua(atras, 35, 39.5, 5, 38, 0); lengua(atras, 37.5, 41, 6, 42, 1.5); lengua(atras, 34, 36.5, 6, 33.5, 2);
    brasa(g, atras, F, [1, 2.2, 3.5], 1);
    /* Cuerpo: cabeza, pecho ancho y una cintura que se deshace en lenguas de fuego hacia abajo. */
    const cuerpo = capa().ell(23, 12.5, 5.2, 5.5).ell(23.5, 24, 8.5, 7).ell(23, 31, 5.5, 4.5)
      .curva(23, 32, 16, 39, 26, 46.5, 8, 1);
    lengua(cuerpo, 17, 20, 37, 13, 40); lengua(cuerpo, 25, 27.5, 35, 30, 39); lengua(cuerpo, 22, 25, 42, 27, 43.5);
    for (const [x0, x1, y, px, py] of [[18, 22, 10, 18, 2], [21, 26, 9, 23, 0], [24.5, 29, 10, 29, 2.5], [27, 30, 13, 32.5, 8], [15, 19, 21, 13, 15], [28, 32, 20, 34, 16.5], [28, 30, 30, 33, 27]])
      lengua(cuerpo, x0, x1, y, px, py);
    /* Brazo de delante: un zarpazo de fuego hacia los héroes. */
    const brazo = capa().linea(17, 21, 12, 25, 4).linea(12, 25, 7, 22, 3).ell(6, 21.5, 2.4, 2.4);
    lengua(brazo, 3.5, 6, 21, 1, 17); lengua(brazo, 5, 7.5, 20, 5.5, 15.5); lengua(brazo, 4, 6.5, 23, 0.5, 23.5);
    lengua(brazo, 10, 13, 24, 9, 29);
    brasa(g, brazo, F, [1, 2.2, 3.5], 1);
    brasa(g, cuerpo, F, [1.6, 3, 5], 1);
    /* Corazón blanco del fuego en el pecho y en la frente. */
    brasa(g, capa().ell(23.5, 24.5, 4, 4.5).ell(22.5, 12.5, 2.3, 2.5).ell(22, 33, 2, 3).ell(20.5, 37.5, 1.2, 1.5), C, [1, 2.4], 2);
    /* Cara tallada: ojos que arden en blanco bajo un ceño oscuro y una boca abierta. */
    pon(g, F, 0, [18, 11], [19, 11], [20, 12], [23, 12], [24, 11], [25, 11]);
    pon(g, R.sangre, 2, [19, 12], [24, 12], [20, 11], [23, 11]);
    pon(g, C, 4, [19, 12], [24, 12]);
    pon(g, F, 0, [20, 15], [21, 15], [22, 15], [23, 15], [21, 16], [22, 16]);
    pon(g, C, 3, [21, 16]);
    g.contorno(F[0]);
    /* Chispas y pavesas sueltas alrededor. */
    for (const [i, j, k] of [[12, 8, 4], [33, 25, 3], [12, 33, 3], [31, 36, 4], [9, 29, 2], [40, 13, 4], [14, 44, 2], [30, 45, 3], [3, 12, 3], [43, 6, 2], [35, 30, 2], [11, 39, 4], [26, 47, 2]])
      if (!g.get(i, j)) pon(g, F, k, [i, j]);
    for (const [i, j] of [[12, 8], [31, 36], [40, 13], [11, 39]]) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!g.get(i + a, j + b)) pon(g, F, 1, [i + a, j + b]);
    return g;
  }

  /* ---------- Diablillo: pequeño y cabezón, alas de murciélago, cuernos, cola de flecha y tridente ---------- */
  function diablillo() {
    const g = new Rejilla(W, W), Rj = R.piel.roja, S = R.sangre, N = NEGRO, Fe = R.hierro;
    /* Ala de murciélago: membrana con el borde festoneado y varillas desde la muñeca. */
    const ala = (pts, muneca, puntas, op, tonoHueso) => {
      capa().poly(pts).pintar(g, S, op);
      const h = capa().linea(pts[0][0], pts[0][1], muneca[0], muneca[1], 2);
      puntas.forEach(([x, y]) => h.linea(muneca[0], muneca[1], x, y, 1));
      h.pintar(g, S, { relieve: 1, min: tonoHueso - 1, max: tonoHueso });
      pon(g, HUESO, tonoHueso + 1, [muneca[0] - 1, muneca[1] - 1]);
    };
    ala([[25, 26], [28, 13], [33, 7], [38, 10], [35, 13], [37.5, 17], [33.5, 17], [31.5, 22]], [28, 13], [[33, 7], [38, 10], [37.5, 17]], { relieve: 1.5, max: 0, profundo: true }, 1);
    ala([[27, 28], [32, 15], [39, 10], [45.5, 16.5], [41.5, 18], [44.5, 24.5], [39, 23], [36, 27.5], [31, 30]], [32, 15], [[39, 10], [45.5, 16.5], [44.5, 24.5]], { relieve: 2, max: 2, separar: 0 }, 3);
    /* Cola acabada en flecha. */
    capa().curva(28, 38, 42, 46, 41, 34, 2.5, 1.5).pintar(g, Rj, { relieve: 1, max: 3, separar: true });
    capa().poly([[37.5, 35.5], [41.5, 28.5], [45, 35.5], [41.3, 33.8]]).pintar(g, Rj, { relieve: 1, min: 2, max: 3, separar: true });
    /* Pierna de atrás. */
    capa().linea(27, 38, 29.5, 41, 3).linea(29.5, 41, 28.5, 44, 2).pintar(g, Rj, { relieve: 1, max: 2 });
    capa().rect(27, 44, 4, 3).pintar(g, N, { relieve: 1, min: 1, max: 2, separar: true });
    /* Cuerpo: barriga redonda. */
    const cuerpo = capa().ell(25, 34, 4.8, 5.2);
    cuerpo.pintar(g, Rj, { relieve: 3, min: 2, separar: true });
    tono(g, capa().ell(23, 35, 2, 2.8), Rj, 1);
    pon(g, Rj, 1, [24, 38], [25, 38], [26, 37]);
    /* Pierna de delante, de cabra, con pezuña. */
    capa().linea(23, 37, 20, 41, 3).linea(20, 41, 21.5, 44, 2).pintar(g, Rj, { relieve: 1.5, min: 2, separar: true });
    capa().rect(18.5, 44, 4.5, 3).pintar(g, N, { relieve: 1, min: 2, separar: true });
    pon(g, N, 4, [19, 44]);
    pon(g, N, 0, [20, 46]);
    /* Tridente. */
    capa().rect(10, 15, 2, 32).pintar(g, R.madera, { relieve: 1, max: 3 });
    for (let y = 18; y <= 46; y += 4) pon(g, R.madera, 1, [11, y]);
    const tri = capa().rect(6, 14, 10, 2).rect(6, 9, 2, 5).rect(10, 7, 2, 7).rect(14, 9, 2, 5);
    tri.poly([[5.5, 9.5], [7, 6], [8.5, 9.5]]).poly([[9.5, 7.5], [11, 3.5], [12.5, 7.5]]).poly([[13.5, 9.5], [15, 6], [16.5, 9.5]]);
    tri.pintar(g, Fe, { relieve: 1, min: 2, separar: true });
    pon(g, Fe, 4, [7, 7], [11, 5], [15, 7], [6, 10], [10, 9], [14, 10]);
    pon(g, R.fuego, 3, [11, 1], [7, 4], [15, 4]);
    pon(g, R.fuego, 2, [11, 2]);
    /* Cabeza grande: orejas puntiagudas, cuernos curvos, sonrisa de dientes. */
    const cab = capa().ell(21, 23, 6, 5.5)
      .poly([[17.5, 25], [15, 30.5], [21.5, 28.5]])     // barbilla
      .poly([[25, 21.5], [32, 19], [26, 25.5]])         // oreja
      .poly([[15.5, 22], [12.5, 24.5], [15.5, 25]]);    // nariz
    cab.pintar(g, Rj, { relieve: 4, min: 2, separar: true });
    tono(g, capa().poly([[26, 22], [31, 19.6], [26.5, 24.5]]), Rj, -1);
    const cuernos = capa().curva(18, 19, 15, 16, 16.5, 12, 3, 1).curva(23, 18.5, 26, 16, 25, 11.5, 3, 1);
    cuernos.pintar(g, HUESO, { relieve: 1.2, separar: true });
    pon(g, HUESO, 1, [16, 17], [24, 17], [25, 16]);
    /* Ojos: amarillos con pupila de rendija y ceja en pico. */
    pon(g, N, 0, [15, 20], [16, 20], [17, 21], [19, 21], [20, 20], [21, 20], [22, 20]);
    pon(g, R.bronce, 4, [16, 21], [20, 21], [21, 21]);
    pon(g, R.bronce, 3, [16, 22], [21, 22]);
    pon(g, N, 0, [17, 22], [20, 22]);
    /* Sonrisa: boca oscura de oreja a oreja con dientes. */
    pon(g, N, 0, [14, 25], [15, 26], [16, 26], [17, 26], [18, 26], [19, 26], [20, 26], [21, 25], [16, 27], [17, 27], [18, 27], [19, 27]);
    pon(g, HUESO, 4, [15, 26], [17, 26], [19, 26]);
    pon(g, S, 3, [17, 27], [18, 27]);
    pon(g, Rj, 1, [22, 26], [22, 27], [23, 25]);
    /* Brazo hacia el tridente. */
    capa().linea(24, 31, 18, 33, 3).linea(18, 33, 13, 31, 2).pintar(g, Rj, { relieve: 1.5, min: 2, separar: true });
    capa().ell(11.5, 30.5, 2, 1.8).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    pon(g, Rj, 1, [11, 31], [12, 31]);
    pon(g, Rj, 4, [17, 32], [19, 19]);
    return g.contorno();
  }

  /* ---------- Araña de las sombras: negra violácea, patas acodadas, ojos en racimo y el reloj de arena rojo ---------- */
  function arana() {
    const g = new Rejilla(W, W), S = R.sombra, Sg = R.sangre, F = R.fuego, Mg = R.magia, V = VACIO;
    /* Pata acodada: fémur grueso, tibia y tarso finos. */
    const pata = (pts, ram, op) => {
      const c = capa();
      const gr = [3, 2, 1];
      for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], gr[i]);
      c.pintar(g, ram, { relieve: 1.2, ...op });
      return c;
    };
    /* Patas del lado de lejos, casi negras. */
    for (const p of [[[16, 31], [11, 17], [6, 37], [5, 41]], [[19, 31], [20, 19], [17, 38], [16, 42]], [[24, 31], [33, 29], [37, 38], [38, 42]], [[25, 30], [45, 27], [47, 35], [47, 40]]]) pata(p, V, { max: 3 });
    /* Abdomen grande con el reloj de arena. */
    const abd = capa().ell(34, 18, 10, 9).ell(28, 23, 4, 4);
    abd.pintar(g, S, { relieve: 5, separar: true });
    tramar(g, capa().ell(30, 13, 5, 3.5).recortar(abd), Mg, 1, 2, (x, y) => 0.6 - Math.hypot(x - 30, (y - 13) * 1.4) / 8);
    for (const [x, y] of [[27, 15], [39, 11], [41, 16], [37, 24], [42, 21]]) pon(g, Mg, 1, [x, y]);
    const reloj = capa().poly([[31, 12], [38, 12], [34.5, 18], [38, 24], [31, 24], [34.5, 18]]).recortar(abd);
    reloj.pintar(g, Sg, { relieve: 1.5, min: 2 });
    pon(g, Sg, 4, [32, 13], [33, 14], [32, 23]);
    pon(g, F, 3, [34, 18]);
    /* Pelillos en el borde del abdomen. */
    for (const [x, y] of [[24, 16], [27, 10], [33, 8], [40, 9], [44, 13], [45, 19], [43, 25]]) if (!g.get(x, y)) pon(g, S, 2, [x, y]);
    /* Cefalotórax y cabeza. */
    const tor = capa().ell(20.5, 31.5, 6.5, 5).ell(14, 31.5, 4.4, 4);
    tor.pintar(g, S, { relieve: 3.5, separar: true });
    pon(g, Mg, 2, [19, 28], [20, 28], [21, 28]);
    pon(g, S, 0, [17, 31], [17, 32]);
    /* Patas de este lado: cuatro, bien acodadas, con las articulaciones marcadas. */
    for (const p of [[[15, 34], [7, 21], [2, 41], [1, 46]], [[18, 35], [14, 25], [11, 43], [10, 46]], [[22, 35], [28, 29], [27, 42], [25, 46]], [[25, 34], [40, 30], [44, 41], [45, 46]]]) {
      pata(p, S, { max: 3, separar: true });
      const [rx, ry] = p[1], [tx, ty] = p[2];
      pon(g, S, 4, [rx, ry]);
      pon(g, S, 3, [rx + (rx < 20 ? -1 : 0), ry + 1]);
      pon(g, Sg, 2, [tx, ty]);
      pon(g, S, 0, [tx, ty + 1]);
      /* Púas en las tibias. */
      for (let k = 1; k < 4; k++) {
        const x = Math.round(rx + (tx - rx) * k / 4), y = Math.round(ry + (ty - ry) * k / 4);
        if (!g.get(x + 2, y)) pon(g, S, 2, [x + 2, y]);
      }
    }
    /* Quelíceros con colmillos. */
    capa().curva(11, 33, 8.5, 36, 10, 39, 3, 1.5).curva(14.5, 34, 13, 37, 14, 40, 3, 1.5).pintar(g, S, { relieve: 1, max: 2, separar: true });
    pon(g, HUESO, 3, [10, 39], [14, 40]);
    pon(g, HUESO, 4, [10, 40], [14, 41]);
    /* Racimo de ojos rojos encendidos. */
    pon(g, S, 0, [11, 30], [12, 31], [13, 30], [14, 31], [15, 30], [16, 30], [12, 29], [14, 29], [16, 29]);
    pon(g, F, 4, [12, 30], [15, 29]);
    pon(g, Sg, 4, [11, 31], [14, 30], [16, 29]);
    pon(g, F, 3, [13, 29], [13, 31], [10, 32]);
    pon(g, Sg, 3, [17, 30], [15, 31]);
    bordeLuz(g, S);
    return g.contorno();
  }

  /* ---------- Sombra famélica: espectro de humo violeta, capucha vacía, ojos pálidos y garras; flota en jirones ---------- */
  function sombra() {
    const g = new Rejilla(W, W), S = R.sombra, Mg = R.magia, E = ESPECTRO;
    /* Brazo de atrás, colgando con garras. */
    capa().curva(31, 18, 38, 24, 39, 32, 3, 2).pintar(g, S, { relieve: 1, max: 2 });
    const ga = capa(); for (const [a, b] of [[-1.5, 4], [0.5, 4.5], [2.5, 3.5]]) ga.linea(39, 32, 39 + a, 32 + b, 1);
    ga.pintar(g, E, { relieve: 1, max: 2 });
    /* Cuerpo de humo: capucha, hombros caídos y faldón que se deshace en jirones y se arrastra hacia atrás. */
    const cuerpo = capa().ell(24, 11, 6.2, 6.8)
      .poly([[17, 12], [31, 12], [35, 19], [37, 27], [36.5, 34], [34, 39], [28, 42], [21, 42], [16.5, 39], [15, 33], [15, 26], [16, 18]]);
    lengua(cuerpo, 26, 31, 7, 34, 3.5); // pico de la capucha, echado hacia atrás
    /* Jirones del faldón, que se arrastran hacia atrás al flotar. */
    for (const [x0, x1, y, px, py] of [[16, 20.5, 38, 13.5, 45], [20, 25, 40, 20.5, 47], [24.5, 29.5, 40, 28.5, 46.5], [29, 34, 39, 35, 46], [33, 37, 34, 41, 42]]) lengua(cuerpo, x0, x1, y, px, py);
    cuerpo.pintar(g, S, { relieve: 5, separar: true });
    /* El humo se apaga hacia abajo (tramado suave) y lo cruzan vetas violetas que ondulan. */
    for (let y = 26; y < W; y++) for (let x = 0; x < W; x++) {
      if (!cuerpo.tiene(x, y)) continue;
      const f = (y - 26) / 17, k = S.indexOf(g.get(x, y));
      if (k < 0) continue;
      const baja = f * 0.9 > umbral(x, y) ? 1 : 0;
      if (baja) pon(g, S, Math.max(0, k - baja), [x, y]);
    }
    /* Vetas onduladas: cada una serpentea hacia abajo y se apaga. */
    for (const [x0, fase, y0, y1] of [[18.5, 0, 22, 40], [24, 2, 20, 42], [29.5, 4, 19, 41], [34, 1, 25, 40]])
      for (let y = y0; y <= y1; y++) {
        const x = Math.round(x0 + Math.sin(y * 0.32 + fase) * 1.8 + (y - y0) * 0.08);
        if (cuerpo.tiene(x, y) && umbral(x, y) > (y - 30) / 14) pon(g, Mg, y < 28 ? 2 : 1, [x, y]);
      }
    /* Hueco de la capucha y el borde iluminado. */
    capa().ell(21.5, 13, 3.8, 4.4).rect(18, 13, 6, 5).pintar(g, S, { plano: 0 });
    capa().linea(17, 9, 23, 5, 1).linea(17, 9, 16.5, 17, 1).linea(16.5, 17, 18, 19, 1).recortar(cuerpo).pintar(g, Mg, { plano: 3 });
    pon(g, Mg, 4, [19, 7], [20, 6], [17, 10]);
    pon(g, Mg, 2, [24, 5], [25, 5], [17, 18], [22, 19], [23, 19], [16, 13]);
    /* Ojos pálidos, con un halo frío. */
    pon(g, E, 1, [18, 12], [19, 11], [20, 11], [22, 12], [23, 11], [24, 11], [19, 14], [23, 14]);
    pon(g, E, 4, [19, 12], [20, 12], [23, 12], [24, 12]);
    pon(g, E, 3, [19, 13], [23, 13]);
    pon(g, E, 2, [20, 13], [24, 13]);
    /* Brazo de delante que se estira hacia los héroes con garras largas. */
    capa().curva(18, 21, 13, 23.5, 8, 21, 3.4, 2).pintar(g, S, { relieve: 1.2, max: 3, separar: true });
    pon(g, Mg, 2, [13, 22], [11, 21]);
    const garra = capa(); for (const [a, b] of [[-4, -3], [-4.5, 0], [-3.5, 2.5], [-1, -3.5]]) garra.linea(7.5, 21, 7.5 + a, 21 + b, 1);
    garra.ell(7.5, 21, 1.2, 1.2);
    garra.pintar(g, E, { relieve: 1, min: 2, max: 4, separar: true });
    pon(g, E, 4, [3, 18], [3, 21], [4, 23], [6, 17]);
    bordeLuz(g, S);
    g.contorno(S[0]);
    /* El faldón se disuelve en el aire: tramado hacia lo transparente. */
    for (let y = 43; y < W; y++) for (let x = 0; x < W; x++) if (g.get(x, y) && umbral(x, y) < (y - 42) / 7) g.quitar(x, y);
    /* Jirones sueltos y motas de humo. */
    for (const [x0, y0, x1, y1] of [[13, 44, 11, 47], [36, 45, 38, 47], [14, 35, 10, 39], [41, 41, 44, 44]]) hilo(g, x0, y0, x1, y1, S[3], S);
    for (const [i, j, k] of [[8, 43, 2], [42, 33, 3], [36, 8, 3], [11, 11, 2], [41, 26, 2], [6, 33, 3], [38, 46, 2], [30, 1, 2], [44, 39, 2]]) if (!g.get(i, j)) pon(g, Mg, k, [i, j]);
    return g;
  }

  window.MONSTRUOS_HD = window.MONSTRUOS_HD || {};
  Object.assign(window.MONSTRUOS_HD, { lobo, armadura, kobold, elemental, diablillo, arana, sombra });
})();
