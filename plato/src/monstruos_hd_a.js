/* Dados y Mazmorras · enemigos normales en alta definición (48×48), primera tanda.
   rata, goblin, osolechuza, esqueleto, mimico, cubo y golem. Cada función devuelve una Rejilla
   nueva de 48×48 con contorno, mirando a la izquierda (hacia los héroes) y con los pies en la fila 46.
   Misma identidad y paleta que los de monstruos.js, con más detalle. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R } = PX;
  const W = 48;
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  /* Rampas propias: herrumbre del hierro viejo y verde del ácido del cubo. */
  const OXIDO = ["#2e1408", "#4e220e", "#7a3a16", "#a4582a", "#c97c44"];
  const BABA = ["#14321e", "#215230", "#337a44", "#5aa860", "#a6e08a"];

  const capa = () => new Capa(W, W);
  /* Varios píxeles del mismo tono de una rampa. */
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Trazos de 1 píxel que salen de un mismo punto (garras, dedos, plumas). */
  const abanico = (c, x, y, puntas) => { puntas.forEach(([a, b]) => c.linea(x, y, x + a, y + b, 1)); return c; };
  /* Pinta una capa solo donde no hay nada todavía, como si quedara detrás. */
  function detras(g, c, ram, op) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (g.get(x, y)) c.off(x, y);
    return c.pintar(g, ram, op);
  }
  /* Rellena una capa con un degradado tramado entre dos tonos; f(x, y) va de 0 a 1. */
  function tramar(g, c, ram, i0, i1, f) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (c.tiene(x, y)) g.set(x, y, ram[f(x, y) > PX.umbral(x, y) ? i1 : i0], ram);
  }
  /* Línea fina sin contorno: solo pinta los píxeles vacíos (bigotes, babas). */
  function hilo(g, x0, y0, x1, y1, color, ram = null) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (!g.get(x, y)) g.set(x, y, color, ram);
    }
  }
  /* Destello de cuatro puntas, sin contorno. */
  const destello = (g, x, y, ram = R.bronce) => { pon(g, ram, 4, [x, y]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!g.get(x + a, y + b)) pon(g, HUESO, 4, [x + a, y + b]); }); };
  /* Remache: brillo arriba a la izquierda y sombra abajo a la derecha. */
  const remache = (g, ram, x, y) => { pon(g, ram, 4, [x, y]); pon(g, ram, 1, [x + 1, y + 1]); };
  /* Tono de un píxel ya pintado de una rampa (o -1). */
  const tonoDe = (g, x, y, ram) => (g.rampa(x, y) === ram ? ram.indexOf(g.get(x, y)) : -1);
  /* Oscurece o aclara un tono los píxeles de una rampa dentro de una capa. */
  function matiz(g, c, ram, d, min = 0, max = 4) {
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      const t = tonoDe(g, x, y, ram);
      if (t >= 0) pon(g, ram, Math.max(min, Math.min(max, t + d)), [x, y]);
    }
  }
  /* Borde iluminado arriba a la izquierda, para que lo oscuro se lea sobre fondos oscuros. */
  function bordeLuz(g, ram, tono = 3) {
    const borde = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < tono) borde.push([x, y]);
    pon(g, ram, tono, ...borde);
  }
  /* Pelaje: trazos cortos de sombra que siguen una dirección, solo sobre la rampa indicada. */
  function pelaje(g, c, ram, semilla, n, dx, dy, tono = 1) {
    const az = PX.azar(semilla);
    for (let k = 0; k < n; k++) {
      const x = Math.floor(az() * W), y = Math.floor(az() * W);
      if (!c.tiene(x, y) || tonoDe(g, x, y, ram) < 1) continue;
      const t = Math.min(tonoDe(g, x, y, ram) - 1, tono + 1);
      pon(g, ram, Math.max(0, t), [x, y]);
      if (c.tiene(x + dx, y + dy) && g.rampa(x + dx, y + dy) === ram) pon(g, ram, Math.max(0, t), [x + dx, y + dy]);
      if (c.tiene(x - dx, y - dy) && tonoDe(g, x - dx, y - dy, ram) >= 1 && tonoDe(g, x - dx, y - dy, ram) < 4) pon(g, ram, tonoDe(g, x - dx, y - dy, ram) + 1, [x - dx, y - dy]);
    }
  }

  /* ---------- La plaga de ratas: una rata enorme y sarnosa delante y otra gris detrás ---------- */
  function rata() {
    const g = new Rejilla(W, W), G = R.piel.gris, C = R.pelo.castano, P = R.piel.clara, S = R.sangre;

    /* Rata gris del fondo, asomando por encima del lomo de la grande. */
    capa().curva(39, 28, 46, 29, 45, 18, 2.6, 1).pintar(g, P, { relieve: 1, max: 2 });
    const gris = capa().ell(33.5, 27, 8, 5.2).ell(26, 27, 4.2, 3.9).poly([[25.5, 23.4], [17.5, 27.6], [18, 29.2], [25.5, 30.8]]);
    gris.pintar(g, G, { relieve: 3.5, max: 3 });
    pelaje(g, gris, G, 11, 30, 1, 0);
    capa().curva(29, 23, 30, 28, 29, 31, 1).recortar(gris).pintar(g, G, { plano: 1 });
    capa().curva(33, 23, 37, 23, 40, 26, 1).recortar(gris).pintar(g, G, { plano: 1 });
    capa().ell(27.5, 22.8, 2.4, 2.4).pintar(g, G, { relieve: 1.5, max: 3, separar: true });
    pon(g, P, 2, [27, 22], [27, 23]);
    pon(g, P, 1, [28, 23], [28, 24]);
    pon(g, NEGRO, 0, [21, 25], [22, 25], [23, 25]);
    pon(g, S, 4, [21, 26], [22, 26]);
    pon(g, R.fuego, 4, [21, 26]);
    pon(g, G, 1, [20, 27], [21, 27], [22, 27], [23, 27]);
    pon(g, P, 3, [17, 27], [18, 27]);
    pon(g, P, 1, [18, 28]);
    pon(g, R.tela.ocre, 4, [19, 30]);
    /* Patitas rosadas apoyadas en el lomo de la grande. */
    pon(g, P, 3, [22, 31], [23, 31]);
    pon(g, P, 2, [24, 31]);

    /* Rata grande del frente. Cola primero, que queda detrás. */
    capa().curva(36, 41, 46, 46, 45, 34, 3.4, 1).pintar(g, P, { relieve: 1.2 });
    for (const [i, j] of [[40, 44], [43, 45], [44, 42], [45, 38]]) if (g.rampa(i, j) === P) pon(g, P, 1, [i, j]);
    /* Pata trasera del fondo. */
    capa().linea(29, 40, 27, 45, 3).pintar(g, C, { relieve: 1, max: 1 });
    pon(g, P, 2, [25, 46], [26, 46], [27, 46]);
    const cuerpo = capa().ell(25.5, 37.8, 11, 6.2).ell(32.5, 36.8, 6.6, 7.2).ell(17, 38.4, 6, 5.6).ell(11.5, 37.6, 4.8, 4.2)
      .poly([[11, 33.6], [2, 38.6], [2.4, 40.3], [11, 41.8]]);
    /* Mechones de pelo sucio en el lomo. */
    for (const [i, j] of [[21, 32.4], [26, 31.4], [31, 29.8], [35, 30.4]]) cuerpo.poly([[i - 1.8, j + 1.5], [i + 1.2, j - 1.8], [i + 1.8, j + 1.5]]);
    cuerpo.pintar(g, C, { relieve: 4, separar: true });
    pelaje(g, cuerpo, C, 7, 70, 1, 0);
    /* Capas de pelo. */
    for (const [x0, y0, cx, cy, x1, y1] of [[18, 35, 22, 32.5, 27, 33], [24, 37, 29, 34.5, 33, 35], [30, 32, 35, 31, 38, 35], [20, 39, 24, 37.5, 28, 39]])
      capa().curva(x0, y0, cx, cy, x1, y1, 1).recortar(cuerpo).pintar(g, C, { plano: 1 });
    /* Mejilla separada del cuello. */
    capa().curva(14, 34, 16.5, 37, 14.5, 41, 1).recortar(cuerpo).pintar(g, C, { plano: 1 });
    /* Vientre más claro. */
    for (let i = 8; i <= 38; i++) for (let j = 38; j <= 46; j++)
      if (cuerpo.tiene(i, j) && !cuerpo.tiene(i, j + 1)) { pon(g, C, 3, [i, j]); if (cuerpo.tiene(i, j - 1) && (i + j) % 2) pon(g, C, 2, [i, j - 1]); }
    /* Cicatrices y una calva de sarna. */
    capa().linea(25, 33.5, 29, 36.5, 1).linea(27, 33, 30, 35.5, 1).recortar(cuerpo).pintar(g, P, { plano: 2 });
    pon(g, P, 1, [26, 35], [29, 37]);
    pon(g, S, 2, [28, 35]);
    capa().ell(35, 34, 1.6, 1.2).recortar(cuerpo).pintar(g, P, { relieve: 1, min: 1, max: 2 });
    /* Muslo trasero marcado. */
    capa().curva(30, 31.5, 37.5, 33, 35.5, 41, 1).recortar(cuerpo).pintar(g, C, { plano: 1 });
    /* Pata trasera delantera y pie rosado de dedos largos. */
    capa().linea(35, 40, 34, 45, 3).pintar(g, C, { relieve: 1.2, separar: true });
    capa().rect(31, 45, 5, 2).pintar(g, P, { relieve: 1, separar: true });
    pon(g, P, 3, [31, 46], [33, 46]);
    pon(g, HUESO, 4, [30, 46]);
    /* Patas delanteras. */
    capa().linea(13, 41, 11, 45, 2.6).pintar(g, C, { relieve: 1, separar: true });
    capa().rect(8, 45, 4, 2).pintar(g, P, { relieve: 1, separar: true });
    pon(g, HUESO, 4, [7, 46]);
    capa().linea(18, 42, 19, 45, 2.6).pintar(g, C, { relieve: 1, max: 2, separar: true });
    capa().rect(17, 45, 4, 2).pintar(g, P, { relieve: 1, max: 2, separar: true });
    pon(g, HUESO, 3, [16, 46]);
    /* Oreja, ojo rojo, hocico, dientes amarillos. */
    capa().ell(15, 32.4, 3, 3).pintar(g, C, { relieve: 1.5, separar: true });
    pon(g, P, 2, [14, 31], [14, 32], [15, 32]);
    pon(g, P, 1, [15, 33], [16, 33]);
    pon(g, P, 3, [14, 31]);
    pon(g, NEGRO, 0, [8, 34], [9, 34], [10, 34], [11, 34]);
    pon(g, S, 4, [9, 35], [10, 35]);
    pon(g, R.fuego, 4, [9, 35]);
    pon(g, S, 1, [11, 35]);
    pon(g, C, 1, [8, 36], [9, 36], [10, 36], [11, 36]);
    pon(g, P, 3, [2, 38], [2, 39]);
    pon(g, P, 1, [3, 39]);
    pon(g, C, 3, [5, 37], [6, 37], [7, 36]);
    pon(g, NEGRO, 1, [4, 41], [5, 41], [6, 41], [7, 41], [8, 41]);
    pon(g, R.tela.ocre, 4, [4, 42]);
    pon(g, R.tela.ocre, 3, [5, 42]);
    pon(g, R.tela.ocre, 2, [4, 43]);
    g.contorno();
    /* Bigotes. */
    [[4, 38, 0, 35], [4, 39, 0, 41], [5, 38, 2, 34], [18, 27, 14, 25], [18, 28, 14, 29]].forEach(([x0, y0, x1, y1]) => hilo(g, x0, y0, x1, y1, HUESO[2], HUESO));
    return g;
  }

  /* ---------- Krug, el jefe goblin: chatarra por armadura, capa roja rota y una cuchilla ---------- */
  function goblin() {
    const g = new Rejilla(W, W), V = R.piel.verde, F = R.hierro, M = R.madera, T = R.tela.granate, Cu = R.pelo.castano, B = R.bronce;
    /* Capa raída detrás. */
    capa().poly([[21, 23], [30, 23], [34, 44.5], [31.5, 42.5], [29.5, 45.5], [27, 42.5], [24.5, 45], [22, 41]]).pintar(g, T, { relieve: 2.5, max: 2 });
    /* Oreja de atrás. */
    capa().poly([[23, 11.5], [24.5, 18.5], [31, 13.5], [38, 7.5], [30, 9.5]]).pintar(g, V, { relieve: 2, max: 2 });
    capa().linea(25, 14, 34, 9.5, 1).pintar(g, R.piel.roja, { plano: 1 });
    pon(g, R.piel.roja, 2, [26, 14], [27, 13]);
    /* Pierna y brazo de atrás. */
    capa().linea(23, 36, 25, 42, 4).pintar(g, V, { relieve: 1.5, max: 2 });
    capa().rect(23, 42, 6, 5).off(28, 42).pintar(g, M, { relieve: 1.5, max: 2 });
    pon(g, M, 1, [23, 44], [24, 44], [25, 44], [26, 44], [27, 44], [28, 44]);
    capa().linea(26, 26, 29, 31, 3).linea(29, 31, 29, 34, 3).pintar(g, V, { relieve: 1.5, max: 2 });
    /* Saco del botín que cuelga de la mano de atrás. */
    const saco = capa().ell(30.5, 38, 3.4, 3.6).poly([[29, 33], [32, 33], [31.5, 35.5], [29.5, 35.5]]);
    saco.pintar(g, R.tela.ocre, { relieve: 2, max: 3, separar: true });
    pon(g, M, 2, [29, 35], [30, 35], [31, 35], [32, 35]);
    pon(g, B, 4, [29, 38]);
    pon(g, B, 3, [31, 40]);
    /* Torso: jubón de cuero bajo placas de chatarra. */
    const torso = capa().ell(19.5, 28.5, 6.5, 5.5).rect(13, 28, 13, 8);
    torso.pintar(g, Cu, { relieve: 2.5, separar: true });
    const peto = capa().poly([[14, 25.5], [24, 24.5], [25, 32], [19.5, 34], [14, 32.5]]);
    peto.pintar(g, F, { relieve: 2.5, separar: true });
    /* Chapas desparejas y herrumbre. */
    capa().linea(15, 29, 24, 28, 1).recortar(peto).pintar(g, F, { plano: 1 });
    for (const [i, j] of [[16, 26], [22, 26], [16, 31], [23, 31]]) remache(g, F, i, j);
    for (const [i, j] of [[19, 30], [20, 31], [21, 30], [24, 27], [14, 28]]) pon(g, OXIDO, (i + j) % 2 ? 2 : 3, [i, j]);
    /* Correa en bandolera y cinturón con hebilla. */
    capa().linea(24, 24, 15, 33, 1).recortar(torso).pintar(g, M, { plano: 1 });
    capa().rect(13, 34, 13, 2).pintar(g, M, { relieve: 1, separar: true });
    capa().rect(17, 34, 3, 2).pintar(g, B, { plano: 3 });
    pon(g, B, 4, [17, 34]);
    pon(g, M, 0, [18, 35]);
    /* Taparrabos. */
    capa().poly([[14, 36], [24, 36], [23, 40], [19, 41.5], [15, 40]]).pintar(g, Cu, { relieve: 1.5, max: 2, separar: true });
    pon(g, Cu, 0, [17, 39], [21, 39]);
    /* Pierna de delante y pie envuelto en trapos. */
    capa().linea(16, 37, 14, 42, 4).pintar(g, V, { relieve: 1.5, separar: true });
    capa().rect(9, 42, 8, 5).off(16, 42).off(9, 42).pintar(g, M, { relieve: 1.5, separar: true });
    pon(g, M, 1, [10, 44], [11, 44], [12, 44], [13, 44], [14, 44], [15, 44], [16, 44]);
    pon(g, V, 2, [9, 46]);
    pon(g, HUESO, 4, [8, 46]);
    /* Hombrera con pincho. */
    const hombrera = capa().ell(15, 25, 4, 3).poly([[13, 23], [11.5, 18.5], [15.5, 22.5]]);
    hombrera.pintar(g, F, { relieve: 2, separar: true });
    pon(g, OXIDO, 2, [16, 27], [17, 26]);
    remache(g, F, 15, 24);
    /* Cabeza grande, orejas de soplillo y nariz ganchuda. */
    const x = 18, y = 17;
    capa().rect(16, 22, 5, 3).pintar(g, V, { relieve: 1, max: 2, separar: true });
    const cab = capa().ell(x, y, 7, 6.2).poly([[13, 17], [8, 20.5], [9.5, 22.5], [13, 21.5]]).ell(15.5, 21, 4.6, 3);
    cab.pintar(g, V, { relieve: 4, separar: true });
    capa().poly([[13.5, 11.5], [12.5, 18.5], [7, 15.5], [1, 8.5], [7, 10]]).pintar(g, V, { relieve: 2, separar: true });
    capa().linea(11, 14, 4, 10, 1).pintar(g, R.piel.roja, { plano: 1 });
    pon(g, R.piel.roja, 2, [10, 14], [9, 13], [11, 15]);
    pon(g, V, 4, [2, 9], [4, 10], [6, 11]);
    /* Muesca en la oreja. */
    g.quitar(6, 15); g.quitar(7, 16);
    /* Casco abollado con cuerno. */
    capa().curva(x + 1.5, y - 6, x + 6.5, y - 9, x + 4, y - 15, 3.2, 1).pintar(g, HUESO, { relieve: 1.5, min: 2 });
    pon(g, HUESO, 1, [x + 4, y - 9], [x + 5, y - 11]);
    const casco = capa().ell(x + 0.5, y - 2.2, 7.6, 5.6);
    casco.quitarRect(0, y - 1, W, W);
    casco.pintar(g, F, { relieve: 2.5, separar: true });
    for (let i = 11; i <= 26; i++) if (g.rampa(i, y - 2) === F) pon(g, F, (i % 3) ? 1 : 3, [i, y - 2]);
    pon(g, OXIDO, 2, [x - 3, y - 4], [x + 3, y - 6], [x + 6, y - 3]);
    pon(g, OXIDO, 3, [x - 2, y - 5]);
    pon(g, F, 0, [x - 1, y - 3], [x, y - 4]);
    remache(g, F, x - 4, y - 3); remache(g, F, x + 4, y - 4);
    /* Cara: ceño, ojos amarillos, nariz y sonrisa de colmillos torcidos. */
    pon(g, V, 0, [12, 15], [13, 15], [14, 16], [17, 16], [18, 15], [19, 15]);
    pon(g, HUESO, 4, [12, 17], [17, 17]);
    pon(g, B, 4, [13, 17], [18, 17]);
    pon(g, NEGRO, 0, [14, 17], [19, 17], [13, 18], [18, 18]);
    pon(g, B, 2, [12, 18], [17, 18]);
    pon(g, V, 1, [15, 18], [16, 18], [14, 19], [13, 20], [11, 20]);
    pon(g, V, 4, [11, 18], [10, 19]);
    pon(g, NEGRO, 0, [10, 22], [11, 23], [12, 23], [13, 23], [14, 23], [15, 23], [16, 23], [17, 22], [18, 22]);
    pon(g, R.piel.roja, 1, [13, 24], [14, 24], [15, 24]);
    pon(g, HUESO, 4, [12, 22], [15, 22], [16, 22]);
    pon(g, HUESO, 3, [12, 24], [16, 24]);
    pon(g, V, 2, [19, 21], [20, 20]);
    pon(g, V, 0, [21, 21]);
    /* Cicatriz en la mejilla. */
    pon(g, V, 4, [20, 18]);
    pon(g, R.piel.roja, 1, [21, 19], [22, 20]);
    /* Brazo de delante, puño y cuchilla de carnicero. */
    const hoja = capa().poly([[1, 19.5], [7, 17.5], [9.5, 29.5], [3, 31.5]]);
    hoja.pintar(g, R.plata, { relieve: 2, min: 1 });
    /* Filo brillante a la izquierda, lomo oscuro, agujero y sangre seca. */
    capa().linea(1.5, 20, 3.5, 31, 1).pintar(g, R.plata, { plano: 4 });
    capa().linea(7, 18, 9, 29, 1).recortar(hoja).pintar(g, R.plata, { plano: 1 });
    pon(g, NEGRO, 1, [5, 20]);
    pon(g, R.plata, 0, [5, 21]);
    pon(g, R.sangre, 3, [3, 25], [3, 27], [2, 23]);
    pon(g, R.sangre, 2, [4, 26], [4, 28], [3, 29]);
    pon(g, R.sangre, 1, [4, 30]);
    capa().linea(8, 28, 8.5, 36, 2).pintar(g, M, { relieve: 1, separar: true });
    pon(g, B, 3, [8, 36], [9, 36]);
    const brazo = capa().linea(15, 26, 12.5, 31, 3.4).linea(12.5, 31, 10, 32, 3);
    brazo.pintar(g, V, { relieve: 1.5, separar: true });
    capa().ell(9, 32, 2.2, 2).pintar(g, V, { relieve: 1.2, separar: true });
    pon(g, V, 0, [8, 32], [9, 33]);
    pon(g, V, 3, [8, 31]);
    g.contorno();
    destello(g, 2, 21, R.plata);
    return g;
  }

  /* ---------- Oso-lechuza: cuerpo de oso, cabeza de lechuza con pico y plumas ---------- */
  function osolechuza() {
    const g = new Rejilla(W, W), C = R.pelo.castano, O = R.tela.ocre, M = R.madera, P = R.piedra;
    const unas = (x, y, puntas) => abanico(capa(), x, y, puntas).pintar(g, HUESO, { relieve: 1, min: 3 });
    /* Brazo levantado de atrás. */
    capa().linea(32, 21, 37, 14, 5).linea(37, 14, 36, 7, 5).ell(36, 6, 3.2, 2.6).pintar(g, C, { relieve: 2.5, max: 2 });
    pelaje(g, capa().rect(30, 3, 10, 20), C, 3, 40, 0, 1);
    unas(36, 4, [[-3.5, -2], [-1, -3.5], [1.5, -3.5], [3.5, -2]]);
    /* Pierna de atrás. */
    capa().rect(29, 34, 8, 10).rect(26, 42, 11, 5).off(26, 42).pintar(g, C, { relieve: 2.5, max: 2 });
    /* Cuerpo enorme. */
    const cuerpo = capa().ell(25.5, 28, 11, 11.5).ell(22, 33, 9, 7);
    cuerpo.pintar(g, C, { relieve: 5, separar: true });
    pelaje(g, cuerpo, C, 5, 110, 0, 1);
    /* Pierna de delante. */
    const pierna = capa().rect(15, 35, 9, 9).rect(11, 42, 12, 5).off(11, 42);
    pierna.pintar(g, C, { relieve: 3, separar: true });
    pelaje(g, pierna, C, 9, 60, 0, 1);
    unas(12, 46, [[-1, 0]]);
    pon(g, HUESO, 4, [11, 46], [13, 46], [15, 46], [27, 46], [29, 46]);
    pon(g, HUESO, 2, [12, 46], [14, 46], [28, 46]);
    /* Pecho de plumas en escamas. */
    const pecho = capa().ell(20, 29, 6, 8.5).recortar(cuerpo);
    pecho.pintar(g, O, { relieve: 3, max: 3 });
    for (let j = 22, f = 0; j <= 38; j += 3, f++) for (let i = 12 + (f % 2 ? 2 : 0); i <= 27; i += 4)
      if (pecho.tiene(i, j) && pecho.tiene(i + 3, j) && pecho.tiene(i, j + 1)) {
        pon(g, O, 1, [i, j], [i + 1, j + 1], [i + 2, j + 1], [i + 3, j]);
        if (tonoDe(g, i + 1, j, O) >= 3) pon(g, O, 4, [i + 1, j]);
      }
    /* Plumas que cubren el cuello y caen sobre los hombros. */
    const gorguera = capa();
    for (const [i, j] of [[13, 19], [16, 20.5], [19, 21], [22, 21], [25, 20], [28, 19.5], [11, 18]]) gorguera.poly([[i - 2.4, j - 3], [i + 2.4, j - 3], [i, j + 2.5]]);
    gorguera.pintar(g, M, { relieve: 1.5, separar: true });
    /* Cabeza de lechuza con penachos. */
    const cab = capa().ell(17.5, 13, 8, 7.2).poly([[10.5, 9], [8.5, 1.5], [14.5, 6.5]]).poly([[21, 6.5], [26.5, 1.5], [25.5, 9.5]]);
    cab.pintar(g, M, { relieve: 4, separar: true });
    for (const [i, j] of [[22, 9], [23, 12], [21, 15], [24, 15], [22, 17], [20, 7], [25, 11]]) { pon(g, M, 1, [i, j]); pon(g, M, 3, [i - 1, j - 1]); }
    pon(g, O, 3, [9, 2], [9, 3], [10, 4], [25, 3], [25, 2], [24, 4]);
    pon(g, O, 4, [9, 2], [25, 2]);
    /* Disco facial: anillo ocre y cara clara. */
    capa().ell(15.5, 13.5, 6.4, 5.6).pintar(g, O, { relieve: 1.5, min: 2, max: 3 });
    const cara = capa().ell(15.5, 13.6, 5.4, 4.7);
    cara.pintar(g, HUESO, { relieve: 2.5, min: 2 });
    pon(g, O, 2, [15, 10], [15, 11], [16, 10]);
    /* Ojos enormes ámbar, con pupila y brillo; ceño fruncido. */
    for (const ex of [12, 18.5]) {
      capa().ell(ex, 13, 2.6, 2.4).pintar(g, NEGRO, { plano: 1 });
      capa().ell(ex, 13, 2.2, 2).pintar(g, R.bronce, { relieve: 1.5, min: 3 });
    }
    pon(g, NEGRO, 0, [11, 13], [12, 13], [11, 14], [12, 14], [17, 13], [18, 13], [17, 14], [18, 14]);
    pon(g, HUESO, 4, [11, 12], [17, 12]);
    pon(g, R.bronce, 2, [11, 15], [12, 15], [13, 15], [17, 15], [18, 15], [19, 15]);
    pon(g, M, 0, [9, 10], [10, 10], [11, 10], [12, 11], [13, 11], [14, 12], [16, 12], [17, 11], [18, 10], [19, 10], [20, 10]);
    /* Pico ganchudo. */
    const pico = capa().poly([[14, 14.5], [17, 14.5], [17, 17.5], [15.5, 20.5], [14, 19.5], [13.5, 17]]);
    pico.pintar(g, P, { relieve: 1.5, min: 1, separar: true });
    pon(g, P, 4, [14, 15], [15, 15]);
    pon(g, P, 3, [14, 16]);
    pon(g, P, 0, [16, 18], [16, 19]);
    pon(g, NEGRO, 0, [15, 18]);
    /* Brazo de delante con zarpa abierta hacia los héroes. */
    const brazo = capa().linea(19, 22, 13, 28, 5).linea(13, 28, 8, 28, 4).ell(6.5, 28, 2.8, 2.6);
    brazo.pintar(g, C, { relieve: 2.5, separar: true });
    pelaje(g, brazo, C, 13, 50, 1, 0);
    unas(4.5, 28, [[-3, -3], [-3.5, -0.5], [-3, 2], [-1, 3.5]]);
    pon(g, C, 1, [7, 27], [7, 29]);
    return g.contorno();
  }

  /* ---------- La guardia esqueleto: yelmo oxidado, escudo con la cruz roja y espada mellada ---------- */
  function esqueleto() {
    const g = new Rejilla(W, W), H = HUESO, F = R.hierro, Sg = R.sangre, T = R.tela.granate;
    const hueso = (c, op = {}) => c.pintar(g, H, { relieve: 1, min: 2, ...op });
    /* Brazo de atrás, que sujeta el escudo. */
    hueso(capa().linea(27, 16, 30, 21, 1.6).linea(30, 21, 32, 22, 1.4), { max: 2 });
    /* Escudo de cometa de hierro viejo con la cruz roja de Valdren. */
    const escudo = capa().poly([[29, 15.5], [42.5, 15.5], [42.5, 26], [35.75, 35.5], [29, 26]]);
    escudo.pintar(g, F, { relieve: 3, separar: true });
    const campo = capa().poly([[30.5, 17], [41, 17], [41, 25.5], [35.75, 33.5], [30.5, 25.5]]);
    campo.pintar(g, F, { relieve: 2, max: 3 });
    capa().rect(35, 17, 2, 16).rect(31, 21, 10, 2).recortar(campo).pintar(g, Sg, { relieve: 1.2, max: 3 });
    /* Desconchones y óxido. */
    for (const [i, j] of [[32, 18], [39, 19], [33, 27], [38, 24], [40, 22], [34, 30], [31, 24]]) pon(g, OXIDO, (i + j) % 2 ? 2 : 3, [i, j], [i + 1, j]);
    pon(g, OXIDO, 1, [39, 20], [33, 28]);
    for (const [i, j] of [[30, 16], [41, 16], [30, 25], [41, 25], [35, 34]]) remache(g, F, i, j);
    pon(g, Sg, 1, [36, 23], [35, 26]);
    /* Mella en el borde del escudo. */
    g.quitar(42, 20); g.quitar(42, 21); g.quitar(41, 21);
    /* Piernas. */
    hueso(capa().linea(20, 29, 18, 36, 2).linea(18, 37, 17, 43, 1.6).rect(13, 44, 5, 3).off(13, 44));
    hueso(capa().linea(25, 29, 27, 36, 2).linea(27, 37, 28, 43, 1.6).rect(27, 44, 5, 3).off(31, 44), { max: 3 });
    pon(g, H, 4, [18, 36], [27, 36]);
    pon(g, H, 1, [18, 37], [27, 37]);
    for (const i of [14, 16, 28, 30]) pon(g, H, 1, [i, 46]);
    /* Faldón granate hecho jirones. */
    const falda = capa().poly([[18, 27], [27.5, 27], [28.5, 35], [26.5, 33], [25, 36.5], [23, 33.5], [21, 36], [19.5, 33], [17, 35]]);
    falda.pintar(g, T, { relieve: 2, max: 3, separar: true });
    pon(g, T, 1, [21, 30], [21, 31], [24, 30], [24, 32]);
    pon(g, R.bronce, 3, [22, 28], [23, 28]);
    /* Pelvis y columna. */
    hueso(capa().ell(22.5, 27, 4, 1.6), { separar: true });
    pon(g, NEGRO, 0, [21, 27], [24, 27]);
    hueso(capa().rect(22, 21, 2, 6));
    for (let j = 21; j <= 25; j += 2) pon(g, H, 1, [22, j], [23, j]);
    /* Costillas con huecos. */
    const costillas = capa().ell(22.5, 17.5, 5.2, 4.2);
    hueso(costillas, { relieve: 2.5, separar: true });
    for (const j of [15, 17, 19]) for (let i = 16; i <= 29; i++) if (costillas.tiene(i, j) && i !== 22 && i !== 23) pon(g, NEGRO, 0, [i, j]);
    for (const j of [16, 18, 20]) for (let i = 16; i <= 29; i++) if (costillas.tiene(i, j) && costillas.tiene(i, j - 1) && g.get(i, j - 1) === NEGRO[0] && i % 3 === 0) pon(g, H, 4, [i, j]);
    pon(g, OXIDO, 2, [22, 21]);
    /* Clavículas y cuello. */
    hueso(capa().linea(16, 13.5, 28, 13.5, 1).rect(22, 11, 2, 2));
    pon(g, H, 4, [17, 13], [27, 13]);
    /* Cráneo con mandíbula desencajada. */
    hueso(capa().ell(20.5, 7.5, 4.6, 4.4).rect(17.5, 10, 5, 2.5), { relieve: 3, separar: true });
    hueso(capa().rect(17, 12, 5, 1.5).off(21, 13), { max: 3, separar: true });
    pon(g, NEGRO, 0, [17, 7], [18, 7], [17, 8], [18, 8], [21, 7], [22, 7], [21, 8], [22, 8], [16, 10], [18, 11], [20, 11], [18, 13], [20, 13]);
    pon(g, H, 1, [19, 10], [20, 10], [23, 9]);
    pon(g, R.fuego, 4, [17, 7], [21, 7]);
    pon(g, R.fuego, 2, [18, 8], [22, 8]);
    pon(g, R.fuego, 3, [18, 7], [22, 7]);
    /* Grieta del cráneo. */
    pon(g, H, 1, [24, 7], [23, 6]);
    /* Yelmo de nasal, oxidado. */
    const yelmo = capa().ell(20.8, 5.6, 5.6, 4.6).rect(14.5, 5.5, 13, 1.5);
    yelmo.quitarRect(0, 7, W, W);
    yelmo.pintar(g, F, { relieve: 2.5, separar: true });
    capa().rect(19, 6, 1, 3).pintar(g, F, { relieve: 1, min: 2 });
    for (let i = 15; i <= 27; i++) if (g.rampa(i, 6) === F) pon(g, F, i % 2 ? 1 : 2, [i, 6]);
    pon(g, OXIDO, 2, [23, 3], [16, 4], [24, 4]);
    pon(g, OXIDO, 3, [22, 3]);
    remache(g, F, 17, 5); remache(g, F, 24, 5);
    /* Brazo de la espada, levantado hacia delante. */
    hueso(capa().linea(17, 14, 14, 19, 1.6).linea(14, 19, 11, 22, 1.4), { separar: true });
    pon(g, H, 4, [14, 19]);
    /* Espada oxidada y mellada. */
    const hoja = capa().linea(10, 19, 4, 5, 2).poly([[3, 6.5], [3.5, 2.5], [5.5, 5.5]]);
    hoja.pintar(g, F, { relieve: 1, min: 2 });
    capa().linea(9, 18, 3.5, 4.5, 1).pintar(g, F, { plano: 4 });
    capa().linea(11, 19, 6, 7, 1).recortar(hoja).pintar(g, F, { plano: 1 });
    g.quitar(4, 9); g.quitar(4, 8);
    pon(g, OXIDO, 2, [7, 13], [8, 15]);
    pon(g, OXIDO, 3, [6, 12], [5, 9]);
    capa().linea(7, 22, 13, 19, 1.6).pintar(g, F, { relieve: 1, min: 2, max: 3 });
    capa().linea(11, 22, 12, 25, 1).pintar(g, R.madera, { relieve: 1 });
    pon(g, F, 4, [12, 26]);
    hueso(capa().ell(10.5, 21.5, 1.4, 1.3), { separar: true });
    return g.contorno();
  }

  /* ---------- El mímico: cofre con la tapa abierta, dientes, lengua y un ojo ---------- */
  function mimico() {
    const g = new Rejilla(W, W), M = R.madera, F = R.hierro, B = R.bronce, L = R.piel.roja, S = R.sangre;
    const [hx, hy] = [40, 30], a = 34 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const girar = pts => pts.map(([x, y]) => [hx + (x - hx) * ca - (y - hy) * sa, hy + (x - hx) * sa + (y - hy) * ca]);
    const [bocaX, bocaY] = girar([[7, 30]])[0];
    /* Garganta: rojo profundo, más oscuro al fondo. */
    const boca = capa().poly([[7, 31.5], [bocaX, bocaY], [40, 30.5]]);
    boca.pintar(g, S, { relieve: 3, max: 2 });
    tramar(g, boca, S, 0, 1, (x, y) => (x - 22) / 14 + (y - 22) / 20);
    /* Monedas y una gema dentro de las fauces. */
    for (const [i, j] of [[17, 28], [20, 27], [24, 28], [27, 26], [29, 28], [22, 25], [31, 27]]) pon(g, B, j % 2 ? 4 : 3, [i, j], [i + 1, j]);
    pon(g, R.piel.esmeralda, 4, [26, 28]);
    /* Cofre. */
    const caja = capa().rect(7, 31, 33, 16);
    caja.pintar(g, M, { relieve: 3, separar: true });
    for (const j of [36, 41]) for (let i = 7; i <= 39; i++) pon(g, M, 1, [i, j]);
    for (const j of [37, 42]) for (let i = 7; i <= 39; i++) if (tonoDe(g, i, j, M) > 2) pon(g, M, 3, [i, j]);
    /* Vetas de la madera. */
    const az = PX.azar(5);
    for (let k = 0; k < 26; k++) { const i = 8 + Math.floor(az() * 31), j = 32 + Math.floor(az() * 14); if (tonoDe(g, i, j, M) >= 2 && j !== 36 && j !== 41) pon(g, M, tonoDe(g, i, j, M) - 1, [i, j], [i + 1, j]); }
    /* Herrajes. */
    capa().rect(10, 31, 3, 16).rect(34, 31, 3, 16).pintar(g, F, { relieve: 1.5, separar: true });
    for (const i of [11, 35]) for (const j of [33, 38, 43]) remache(g, F, i, j);
    capa().rect(7, 44, 33, 1).pintar(g, F, { plano: 1 });
    capa().rect(7, 45, 33, 2).pintar(g, F, { relieve: 1, max: 2 });
    for (const i of [8, 16, 24, 31, 38]) pon(g, F, 4, [i, 45]);
    /* Cerradura de latón. */
    capa().rect(20, 31, 6, 6).off(20, 36).off(25, 36).pintar(g, B, { relieve: 1.5, separar: true });
    pon(g, NEGRO, 0, [22, 33], [23, 33], [22, 34]);
    pon(g, B, 4, [21, 32]);
    /* Tapa abovedada, abierta. */
    const tapa = capa().poly(girar([[7, 30], [40, 30], [40, 24], [37, 21], [10, 21], [7, 24]]));
    tapa.pintar(g, M, { relieve: 3.5, separar: true });
    for (const bx of [11.5, 35.5]) {
      const [p0, p1] = girar([[bx, 30], [bx, 21.5]]);
      capa().linea(p0[0], p0[1], p1[0], p1[1], 3).recortar(tapa).pintar(g, F, { relieve: 1.5 });
      const [r0, r1] = girar([[bx, 28], [bx, 24]]);
      remache(g, F, Math.round(r0[0]), Math.round(r0[1])); remache(g, F, Math.round(r1[0]), Math.round(r1[1]));
    }
    /* Tabla del borde de la tapa. */
    { const [p0, p1] = girar([[8, 26], [39, 26]]); capa().linea(p0[0], p0[1], p1[0], p1[1], 1).recortar(tapa).pintar(g, M, { plano: 1 }); }
    /* Dientes de la tapa y del cofre. */
    const dx = ca, dy = sa, nx = -sa, ny = ca;
    for (let s = 2; s <= 31; s += 3.2) {
      const bx = bocaX + dx * s, by = bocaY + dy * s, lg = s < 6 ? 4.2 : 3;
      capa().poly([[bx - dx * 1.4, by - dy * 1.4], [bx + nx * lg, by + ny * lg], [bx + dx * 1.4, by + dy * 1.4]]).pintar(g, HUESO, { relieve: 1, min: 3 });
    }
    for (let i = 9; i <= 38; i += 3.2) {
      const lg = i < 13 ? 4.5 : 3.4;
      capa().poly([[i - 1.4, 31.5], [i, 31.5 - lg], [i + 1.4, 31.5]]).pintar(g, HUESO, { relieve: 1, min: 3 });
    }
    /* Lengua larga que cae hasta el suelo. */
    const lengua = capa().curva(21, 28, 0, 34, 4, 22, 5.4, 3.4).ell(4.4, 21.6, 2.4, 2.2);
    lengua.pintar(g, L, { relieve: 2.5, separar: true });
    capa().curva(19, 28, 3, 32, 4.5, 22, 1).recortar(lengua).pintar(g, L, { plano: 1 });
    pon(g, L, 4, [9, 28], [10, 28], [3, 27], [3, 26]);
    pon(g, L, 0, [7, 33], [8, 33], [9, 32]);
    /* Ojo amarillo inyectado en sangre, en la tapa. */
    const [ox, oy] = girar([[17, 25.5]])[0].map(Math.round);
    capa().ell(ox, oy, 2.8, 2.2).pintar(g, M, { plano: 0 });
    capa().ell(ox, oy, 2.4, 1.8).pintar(g, R.tela.ocre, { relieve: 1.2, min: 2 });
    pon(g, NEGRO, 0, [ox, oy - 1], [ox, oy], [ox, oy + 1]);
    pon(g, HUESO, 4, [ox - 1, oy - 1]);
    pon(g, S, 3, [ox + 2, oy], [ox - 2, oy + 1]);
    pon(g, M, 0, [ox - 3, oy - 2], [ox - 2, oy - 3], [ox - 1, oy - 3], [ox, oy - 3], [ox + 1, oy - 3]);
    /* Un ojillo más pequeño en el cofre. */
    capa().ell(29.5, 34, 1.4, 1.2).pintar(g, R.tela.ocre, { relieve: 1, min: 2 });
    pon(g, NEGRO, 0, [29, 34]);
    pon(g, M, 0, [28, 32], [29, 32], [30, 32]);
    g.contorno();
    /* Babas. */
    pon(g, L, 4, [26, 21], [26, 22], [26, 23], [16, 18], [16, 19]); pon(g, L, 3, [26, 24], [16, 20]);
    hilo(g, 13, 32, 13, 34, BABA[4], BABA);
    destello(g, 15, 24); destello(g, 28, 18);
    return g;
  }

  /* ---------- Cubo gelatinoso: casi transparente, con los restos de otros aventureros dentro ---------- */
  function cubo() {
    const g = new Rejilla(W, W), E = R.piel.esmeralda, Hj = R.hoja;
    const X0 = 2, Y0 = 15, L = 32, PR = 10;
    const X1 = X0 + L - 1, Y1 = 46;
    const frente = capa().rect(X0, Y0, L, Y1 - Y0 + 1);
    const arriba = capa().poly([[X0, Y0], [X0 + PR, Y0 - PR], [X1 + PR + 0.5, Y0 - PR], [X1 + 0.5, Y0]]).restar(frente);
    const lado = capa().poly([[X1 + 0.5, Y0], [X1 + PR + 0.5, Y0 - PR], [X1 + PR + 0.5, Y1 - PR], [X1 + 0.5, Y1 + 0.5]]).restar(frente).restar(arriba);
    tramar(g, frente, E, 2, 3, (x, y) => 0.8 - (x + y) / 85);
    tramar(g, arriba, E, 3, 4, x => 0.75 - x / 70);
    tramar(g, lado, E, 1, 2, (x, y) => 0.65 - y / 60);
    /* Aristas del fondo, vistas a través de la gelatina. */
    for (const [x0, y0, x1, y1] of [[X0 + PR, Y0 - PR, X0 + PR, Y1 - PR], [X0 + PR, Y1 - PR, X1 + PR, Y1 - PR], [X0, Y1, X0 + PR, Y1 - PR]])
      capa().linea(x0, y0, x1, y1, 1).recortar(frente).pintar(g, E, { plano: 3 });
    /* Lo que flota dentro, mezclado con la gelatina. */
    const dentro = new Rejilla(W, W);
    /* Espada atravesada. */
    capa().linea(14, 42, 27, 21, 2).pintar(dentro, R.hierro, { relieve: 1, min: 2 });
    capa().rect(22, 28, 7, 1).pintar(dentro, R.bronce, { plano: 3 });
    capa().linea(28, 20, 30, 17, 1.4).pintar(dentro, R.madera, { relieve: 1 });
    /* Calavera. */
    capa().ell(10, 24, 4, 3.6).rect(8, 26.5, 4, 2.5).pintar(dentro, HUESO, { relieve: 2, min: 2 });
    pon(dentro, NEGRO, 1, [8, 24], [9, 24], [11, 24], [12, 24], [10, 26], [9, 28], [11, 28]);
    /* Costillas sueltas y un fémur. */
    capa().linea(4, 37, 13, 34, 1.4).pintar(dentro, HUESO, { relieve: 1, min: 3 });
    pon(dentro, HUESO, 4, [4, 36], [4, 38], [13, 33], [14, 35]);
    for (const k of [0, 1, 2]) capa().curva(18 + k * 3, 35, 20 + k * 3, 32, 23 + k * 3, 34, 1).pintar(dentro, HUESO, { plano: 3 });
    /* Yelmo hundido. */
    capa().ell(26, 40, 3.4, 2.6).pintar(dentro, R.hierro, { relieve: 1.5, min: 1 });
    pon(dentro, R.hierro, 0, [24, 41], [25, 41], [26, 41], [27, 41], [28, 41]);
    /* Monedas. */
    for (const [i, j] of [[6, 43], [10, 42], [17, 44], [22, 45], [29, 44], [19, 38], [13, 18], [27, 33], [31, 39], [6, 30]]) pon(dentro, R.bronce, (i + j) % 2 ? 3 : 4, [i, j], [i + 1, j]);
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const c = dentro.get(i, j);
      if (c && frente.tiene(i, j) && PX.umbral(i, j) < 0.75) g.set(i, j, c, dentro.rampa(i, j));
    }
    /* Burbujas. */
    for (const [i, j, r] of [[20, 20, 1], [7, 33, 0], [29, 25, 0], [16, 29, 0], [24, 17, 1], [31, 34, 0]]) {
      if (r) { pon(g, Hj, 4, [i, j - 1], [i - 1, j]); pon(g, E, 4, [i + 1, j], [i, j + 1]); pon(g, E, 2, [i, j]); }
      else pon(g, Hj, 4, [i, j]);
    }
    /* Aristas de delante, brillantes. */
    for (let i = X0; i <= X1; i++) pon(g, Hj, 4, [i, Y0]);
    for (let j = Y0; j <= Y1; j++) pon(g, Hj, 3, [X0, j]);
    for (let j = Y0; j <= Y1; j++) pon(g, E, 3, [X1, j]);
    capa().linea(X0, Y0, X0 + PR, Y0 - PR, 1).linea(X0 + PR, Y0 - PR, X1 + PR, Y0 - PR, 1).linea(X1 + 0.5, Y0, X1 + PR + 0.5, Y0 - PR, 1).pintar(g, Hj, { plano: 4 });
    for (let j = Y0 - PR + 1; j <= Y1 - PR; j++) pon(g, E, 2, [X1 + PR, j]);
    /* Reflejos de luz arriba a la izquierda. */
    pon(g, HUESO, 4, [3, 16], [4, 16], [5, 16], [3, 17], [3, 18], [12, 6], [13, 6], [14, 6], [6, 20], [7, 21]);
    pon(g, Hj, 4, [4, 17], [8, 23], [9, 24]);
    for (const [i, j] of [[18, 22], [9, 35], [26, 37], [22, 19], [14, 26]]) pon(g, Hj, 4, [i, j]);
    /* Babas que gotean por la base y charco. */
    for (const [i, h] of [[7, 2], [15, 1], [24, 3], [30, 1]]) for (let k = 1; k <= h; k++) if (k < h) pon(g, E, 2, [i, Y1 - 1 + k]);
    return g.contorno(E[0]);
  }

  /* ---------- El gólem de hierro: placas remachadas, junturas al rojo y un horno en el pecho ---------- */
  function golem() {
    const g = new Rejilla(W, W), B = R.hierro, F = R.fuego;
    /* Brazo de atrás. */
    capa().linea(36, 15, 40, 24, 5).linea(40, 24, 40.5, 31, 5).pintar(g, B, { relieve: 2.5, max: 2 });
    capa().ell(40.5, 34, 4, 3.8).pintar(g, B, { relieve: 2, max: 2 });
    for (let x = 37; x <= 43; x++) if (g.rampa(x, 26) === B) pon(g, F, x % 2 ? 2 : 1, [x, 26]);
    /* Pierna de atrás. */
    capa().rect(27, 33, 8, 10).rect(26, 42, 11, 5).off(36, 42).pintar(g, B, { relieve: 2.5, max: 2 });
    for (let x = 27; x <= 34; x++) pon(g, F, x % 2 ? 2 : 1, [x, 37]);
    /* Torso enorme. */
    const cuerpo = capa().ell(24, 19, 13, 9.5).rect(15, 24, 18, 10).off(15, 33).off(32, 33);
    cuerpo.pintar(g, B, { relieve: 5, separar: true });
    /* Juntas de las placas y remaches. */
    capa().linea(15, 25, 33, 25, 1).linea(16, 29, 32, 29, 1).linea(24, 25, 24, 33, 1).recortar(cuerpo).pintar(g, B, { plano: 1 });
    for (let x = 16; x <= 32; x++) if (cuerpo.tiene(x, 26) && tonoDe(g, x, 26, B) > 1) pon(g, B, Math.min(4, tonoDe(g, x, 26, B) + 1), [x, 26]);
    for (const [i, j] of [[17, 27], [22, 27], [26, 27], [31, 27], [18, 31], [22, 31], [26, 31], [30, 31], [13, 16], [35, 16], [18, 11], [30, 11]]) remache(g, B, i, j);
    /* Horno del pecho con rejilla. */
    capa().ell(24, 18, 5.4, 5).pintar(g, B, { plano: 0 });
    const horno = capa().ell(24, 18, 4.4, 4);
    for (let y = 13; y <= 23; y++) for (let x = 18; x <= 30; x++) if (horno.tiene(x, y)) {
      const d = Math.hypot(x - 24, (y - 18.5) * 1.1);
      pon(g, F, d < 1.6 ? 4 : d < 2.8 ? 3 : d < 3.6 ? 2 : 1, [x, y]);
    }
    for (const x of [22, 24, 26]) for (let y = 14; y <= 22; y++) if (horno.tiene(x, y)) pon(g, B, y < 17 ? 2 : 1, [x, y]);
    for (let x = 20; x <= 28; x++) if (horno.tiene(x, 18)) pon(g, B, 1, [x, 18]);
    pon(g, B, 3, [21, 14], [22, 13], [23, 13]);
    /* Resplandor del horno sobre el pecho. */
    for (const [i, j] of [[18, 23], [30, 23], [19, 24], [29, 24], [24, 24]]) if (tonoDe(g, i, j, B) >= 0) pon(g, OXIDO, 3, [i, j]);
    /* Pierna de delante. */
    const pierna = capa().rect(13, 33, 9, 10).rect(9, 42, 13, 5).off(9, 42);
    pierna.pintar(g, B, { relieve: 2.5, separar: true });
    for (let x = 13; x <= 21; x++) pon(g, F, x % 2 ? 3 : 2, [x, 37]);
    remache(g, B, 14, 34); remache(g, B, 19, 34); remache(g, B, 11, 43); remache(g, B, 17, 43);
    for (let x = 10; x <= 21; x++) pon(g, B, 1, [x, 45]);
    /* Hombrera de atrás. */
    capa().ell(35.5, 13.5, 5, 4.5).pintar(g, B, { relieve: 2.5, max: 3, separar: true });
    remache(g, B, 35, 12);
    /* Respiradero del hombro con gas venenoso. */
    capa().rect(32, 8, 4, 3).pintar(g, B, { relieve: 1, max: 2, separar: true });
    pon(g, NEGRO, 0, [33, 9], [34, 9]);
    /* Cabeza baja entre los hombros, con visera de rendija ardiente. */
    capa().rect(14, 9, 9, 4).pintar(g, B, { relieve: 1.5, max: 2, separar: true });
    const cab = capa().rect(10, 3, 11, 8).off(10, 3).off(20, 3);
    cab.pintar(g, B, { relieve: 2.5, separar: true });
    for (let x = 11; x <= 20; x++) pon(g, B, 0, [x, 6]);
    for (let x = 11; x <= 17; x++) pon(g, F, x <= 13 ? 4 : x <= 15 ? 3 : 2, [x, 6]);
    pon(g, F, 4, [12, 5]);
    pon(g, B, 4, [11, 4], [12, 4], [13, 4]);
    remache(g, B, 19, 4);
    /* Barbilla de placas (como una barba de hierro). */
    const barba = capa().poly([[10, 9], [20, 9], [19, 13], [15, 14.5], [11, 12.5]]);
    barba.pintar(g, B, { relieve: 1.5, max: 3, separar: true });
    for (const x of [12, 14, 16, 18]) for (let y = 10; y <= 14; y++) if (barba.tiene(x, y)) pon(g, B, 1, [x, y]);
    pon(g, R.bronce, 3, [11, 9], [13, 9], [15, 9], [17, 9], [19, 9]);
    /* Hombrera y brazo de delante con el puño. */
    const hombro = capa().ell(12, 17, 6, 5.4);
    hombro.pintar(g, B, { relieve: 3, separar: true });
    remache(g, B, 10, 15); remache(g, B, 14, 14); remache(g, B, 12, 19);
    const brazo = capa().linea(11, 21, 8, 28, 5).linea(8, 28, 7, 31, 5);
    brazo.pintar(g, B, { relieve: 2.5, separar: true });
    for (let x = 4; x <= 11; x++) if (g.rampa(x, 26) === B) pon(g, F, x % 2 ? 3 : 2, [x, 26]);
    const puno = capa().ell(7, 35, 4.8, 4.2);
    puno.pintar(g, B, { relieve: 2.5, separar: true });
    for (const y of [34, 37]) for (let x = 3; x <= 9; x++) if (puno.tiene(x, y)) pon(g, B, 1, [x, y]);
    remache(g, B, 8, 32);
    bordeLuz(g, B, 2);
    g.contorno();
    /* Volutas de gas que salen del respiradero. */
    for (const [i, j, t] of [[34, 7, 3], [35, 6, 2], [35, 5, 3], [36, 4, 2], [37, 3, 1], [36, 2, 2]]) if (!g.get(i, j)) pon(g, BABA, t + 1, [i, j]);
    return g;
  }

  window.MONSTRUOS_HD = window.MONSTRUOS_HD || {};
  Object.assign(window.MONSTRUOS_HD, { rata, goblin, osolechuza, esqueleto, mimico, cubo, golem });
})();
