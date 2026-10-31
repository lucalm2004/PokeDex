/* Diálogos y Dados · monstruos y personajes no jugadores en pixel art.
   Cada entrada de MONSTRUOS (enemigos) y de PNJ devuelve una Rejilla nueva de 36×36, con contorno
   y mirando a la izquierda, hacia los héroes. Los PNJ con cuerpo humano salen de HEROES.componer. */
const { MONSTRUOS, PNJ } = (() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R } = PX;
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  /* Piel gris verdosa de la harpía (5 tonos, de la sombra al brillo). */
  const CENIZA = ["#262b23", "#3d463a", "#5f6b59", "#8b9881", "#bac4ab"];

  /* Varios píxeles del mismo tono de una rampa. */
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Trazos de 1 píxel que salen de un mismo punto (garras, dedos, plumas). */
  const abanico = (c, x, y, puntas) => { puntas.forEach(([a, b]) => c.linea(x, y, x + a, y + b, 1)); return c; };
  /* Muesca triangular con la punta hacia arriba, para deshilachar bordes inferiores. */
  const muesca = (x, y, abajo = 35.5, ancho = 1.7) => new Capa().poly([[x - ancho, abajo], [x, y], [x + ancho, abajo]]);
  /* Línea fina sin contorno: solo pinta los píxeles vacíos. */
  function hilo(g, x0, y0, x1, y1, color) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (!g.get(x, y)) g.set(x, y, color);
    }
  }
  /* Torso y falda como los de heroes.js, para reponer la ropa donde se borra un brazo. */
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
  function sombra() {
    const g = new Rejilla(), S = R.sombra;
    const atras = abanico(new Capa().linea(18, 18, 15, 24, 2).linea(15, 24, 9, 27, 2), 8, 27, [[-3, -3], [-4, 0], [-3, 3]]);
    atras.pintar(g, S, { relieve: 1.5, max: 2 });
    const c = new Capa().ell(19.5, 14.5, 6.5, 6.8);
    c.poly([[13.5, 18], [25, 15], [27.5, 23], [26.5, 28], [30, 30.5], [34, 32.5], [34, 34.5], [10.5, 34.5], [13.5, 31], [15.5, 25]]);
    c.linea(11, 15, 15, 12, 3);
    c.curva(25, 22, 31, 21, 34, 26, 3.5, 1);
    [[13, 32.5], [17, 31], [21, 33], [25, 31.5], [29.5, 33.5]].forEach(([x, y]) => c.restar(muesca(x, y, 35.5, 1.3)));
    c.pintar(g, S, { relieve: 3.5, sesgo: 0.08 });
    [[20, 21, 19, 27], [23, 24, 23, 29], [17, 28, 15.5, 32], [25, 29, 29, 32]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(c).pintar(g, S, { plano: 3 }));
    new Capa().ell(9, 15, 3.3, 3).pintar(g, S, { relieve: 2.5, sesgo: 0.08, separar: true });
    const delante = abanico(new Capa().linea(15, 17, 10, 21, 2).linea(10, 21, 4, 20, 2), 4, 20, [[-3, -2], [-3, 0], [-2, 3]]);
    delante.pintar(g, S, { relieve: 1.5, sesgo: 0.08, separar: true });
    /* Borde iluminado arriba a la izquierda, para que la sombra se lea sobre fondos oscuros. */
    const borde = [];
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++)
      if (g.rampa(x, y) === S && (!g.get(x - 1, y) || !g.get(x, y - 1)) && S.indexOf(g.get(x, y)) < 3) borde.push([x, y]);
    pon(g, S, 3, ...borde);
    pon(g, R.bronce, 4, [7, 14], [10, 14]);
    pon(g, R.fuego, 3, [6, 13], [11, 13]);
    pon(g, S, 0, [6, 16], [7, 16], [8, 16], [9, 16], [10, 16], [7, 17], [9, 17]);
    pon(g, HUESO, 3, [6, 16], [8, 16], [10, 16]);
    return g.contorno();
  }

  function titiritero() {
    const g = new Rejilla(), N = R.tela.negro, S = R.sangre, M = R.madera;
    const manto = new Capa().poly([[18, 12], [26, 12], [28, 18], [29.5, 26], [31, 34.5], [15, 34.5], [16.5, 26], [17, 18]]);
    [[16.5, 30], [19.5, 32], [22.5, 29], [26, 31.5], [29.5, 30.5]].forEach(([x, y]) => manto.restar(muesca(x, y, 35.5, 1.4)));
    manto.ell(21.5, 7, 4.6, 5.2).poly([[20, 3], [24.5, 0.6], [27, 5.5]]);
    manto.pintar(g, N, { relieve: 3 });
    new Capa().poly([[17, 13], [18.6, 13], [17.6, 25], [18, 34.5], [15.5, 34.5], [16.5, 25]]).recortar(manto).pintar(g, S, { relieve: 1, separar: true });
    const gola = new Capa().poly([[16.5, 11.5], [26.5, 11.5], [25.5, 13.5], [17.5, 13.5]]);
    gola.pintar(g, S, { relieve: 1, min: 2, separar: true });
    for (let x = 18; x <= 25; x += 2) pon(g, S, 1, [x, 13]);
    new Capa().ell(20.5, 6.6, 3.3, 3.5).pintar(g, HUESO, { relieve: 2, min: 2, sesgo: 0.2, separar: true });
    pon(g, NEGRO, 0, [17, 6], [18, 5], [19, 6], [21, 6], [22, 5], [23, 6]);
    pon(g, S, 1, [17, 8], [18, 9], [19, 9], [20, 9], [21, 9], [22, 9], [23, 8]);
    const manga = new Capa().linea(18, 14, 13, 12, 2).linea(13, 12, 10, 9, 2);
    manga.poly([[18, 14], [12.5, 11.5], [12, 15], [13.5, 17.5], [16, 16]]);
    manga.pintar(g, N, { relieve: 2, separar: true });
    new Capa().rect(2, 8, 12, 1).rect(3, 6, 1, 5).rect(12, 6, 1, 5).pintar(g, M, { relieve: 1, min: 2 });
    pon(g, HUESO, 3, [9, 7], [10, 7]);
    pon(g, HUESO, 2, [8, 8], [9, 9], [11, 7]);
    const muneco = new Capa().ell(8, 19.5, 2, 2).rect(7, 22, 3, 4);
    muneco.linea(7, 22, 5, 25, 1).linea(9, 22, 11, 25, 1).linea(7, 26, 6, 30, 1).linea(9, 26, 10, 30, 1);
    muneco.pintar(g, M, { relieve: 1.5, min: 2 });
    new Capa().rect(7, 22, 3, 4).pintar(g, R.tela.terracota, { relieve: 1.5 });
    pon(g, NEGRO, 0, [7, 19], [7, 21]);
    g.contorno();
    /* Los hilos van después del contorno para que queden finos. */
    [[3, 11, 5, 25], [8, 9, 8, 17], [12, 11, 11, 25]].forEach(([x0, y0, x1, y1]) => hilo(g, x0, y0, x1, y1, HUESO[3]));
    return g;
  }

  function trasimaco() {
    const piel = R.piel.oliva, tela = R.tela.violeta, t = HEROES.plantilla("fornido");
    const g = HEROES.componer({ raza: "humano", clase: "sofista", tela: "violeta", pelo: "negro", piel: "oliva", barba: true, peinado: "corto", objeto: "ninguno", cuerpo: "fornido", sinContorno: true });
    const ropa = new Rejilla();
    torso(t).unir(falda(t, 4, 1)).pintar(ropa, tela, { relieve: 3 });
    for (let y = t.torTop; y <= t.mano[1] + 2; y++) for (let x = t.torR - 2; x <= t.mano[0] + 2; x++) {
      if (g.rampa(x, y) !== piel) continue;
      if (ropa.get(x, y)) g.set(x, y, ropa.get(x, y), tela); else g.quitar(x, y);
    }
    const [hx, hy] = t.hombro;
    new Capa().linea(hx, hy, hx + 5, hy - 1, 2).linea(hx + 5, hy - 1, hx + 7, hy - 6, 2).pintar(g, piel, { relieve: 1.5, separar: true });
    new Capa().rect(hx + 6, hy - 9, 2, 3).rect(hx + 7, hy - 12, 1, 3).pintar(g, piel, { relieve: 1, separar: true });
    for (let j = t.torBot; j <= t.suelo; j++) for (let i = 0; i < 36; i++)
      if (g.rampa(i, j) === tela && g.rampa(i, j + 1) !== tela) pon(g, R.bronce, 3, [i, j]);
    for (let j = t.torTop + 2; j < t.torBot + 4; j++) if (g.rampa(t.cx + 2, j) === tela) pon(g, R.bronce, j % 2 ? 2 : 3, [t.cx + 2, j]);
    const x = t.cabX, y = t.ojoY;
    pon(g, NEGRO, 1, [x + 1, y - 1], [x + 2, y - 1], [x + 4, y - 1], [x + 5, y - 1], [x + 3, y]);
    pon(g, HUESO, 3, [x + 3, y + 3], [x + 4, y + 3], [x + 5, y + 3]);
    pon(g, R.sangre, 1, [x + 3, y + 4], [x + 4, y + 4], [x + 5, y + 4]);
    g.contorno();
    return g.espejo();
  }

  function harpia() {
    const g = new Rejilla(), M = R.madera, P = CENIZA;
    const alaAtras = new Capa().poly([[21, 13], [25, 6], [29, 2.5], [34, 1.5], [34.5, 6], [34.5, 10], [33.5, 14], [31, 17], [28, 18.5], [25, 19.5], [22, 18.5]]);
    [[34.5, 8], [34, 12], [32, 16], [28.5, 18.5], [25, 19]].forEach(([a, b]) => alaAtras.off(a, b));
    alaAtras.pintar(g, M, { relieve: 2.5, max: 3 });
    abanico(new Capa(), 30, 3, [[4, 4], [4, 9], [2, 12], [-2, 14], [-5, 15]]).recortar(alaAtras).pintar(g, M, { plano: 1 });
    new Capa().curva(22, 13, 25, 6, 31, 3, 3, 2).recortar(alaAtras).pintar(g, HUESO, { relieve: 1, max: 3 });
    new Capa().rect(15, 14, 5, 5).pintar(g, P, { relieve: 2 });
    const cuerpo = new Capa().ell(17.5, 22.5, 4.3, 3.8).poly([[13.5, 21], [14.5, 17.5], [16, 19], [17.5, 16.5], [19, 19], [20.5, 17.5], [21.5, 21]]);
    [[15, 26.5], [17.5, 27], [20, 26.5]].forEach(([a, b]) => cuerpo.restar(muesca(a, b - 1.5, b + 1, 0.9)));
    cuerpo.pintar(g, M, { relieve: 2, separar: true });
    pon(g, M, 3, [15, 20], [17, 19], [19, 20], [16, 22], [18, 22], [20, 22], [15, 24], [17, 24], [19, 24]);
    const patas = new Capa().linea(16, 26, 14, 28.5, 1).linea(19.5, 26, 19, 28.5, 1);
    abanico(patas, 14, 28.5, [[-2, 1.5], [0, 2], [1.5, 1.5]]);
    abanico(patas, 19, 28.5, [[-2, 1.5], [0, 2], [1.5, 1.5]]);
    patas.pintar(g, R.bronce, { relieve: 1, min: 2 });
    pon(g, HUESO, 1, [12, 30], [14, 30.5], [15, 30], [17, 30], [19, 30.5], [20, 30]);
    const pelo = new Capa().ell(19.5, 9, 4.2, 4.4);
    pelo.poly([[18, 6.5], [27, 2.5], [24, 8.5]]).poly([[20, 8.5], [30, 8], [23.5, 12]]).poly([[20, 11], [29, 14.5], [21.5, 14.5]]).poly([[19.5, 12.5], [24, 19], [19, 16]]);
    pelo.poly([[14.5, 7.5], [17, 3.5], [19, 6]]).poly([[17.5, 5.5], [22, 1.5], [22, 6]]);
    pelo.pintar(g, NEGRO, { relieve: 2, min: 2, separar: true });
    [[22, 6, 26, 4], [22, 10, 28, 9], [22, 13, 27, 15]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(pelo).pintar(g, NEGRO, { plano: 4 }));
    const cab = new Capa().ell(17, 10.5, 3.8, 4).on(12.6, 11);
    cab.pintar(g, P, { relieve: 3, separar: true });
    pon(g, R.bronce, 4, [15, 10], [17.5, 10]);
    pon(g, NEGRO, 0, [14, 10], [17, 10], [14, 11], [17, 11]);
    pon(g, NEGRO, 1, [13, 9], [14, 9], [16, 8], [17, 9]);
    pon(g, R.sangre, 1, [13, 13], [14, 13], [15, 13], [14, 14]);
    pon(g, HUESO, 4, [13, 13]);
    const alaDelante = new Capa().poly([[15, 15], [10, 12], [6, 6], [3, 2.5], [1.5, 2], [1, 7], [1, 11], [2, 15], [4.5, 18], [7, 19], [10, 19.5], [14, 18.5]]);
    [[1, 9], [1.5, 13], [3, 16.5], [5.5, 18.5], [8.5, 19.5]].forEach(([a, b]) => alaDelante.off(a, b));
    alaDelante.pintar(g, M, { relieve: 2.5, separar: true });
    abanico(new Capa(), 5, 3, [[-4, 4], [-4, 9], [-2, 12], [2, 14], [5, 15]]).recortar(alaDelante).pintar(g, M, { plano: 1 });
    new Capa().curva(14, 14, 9, 10, 4, 3, 3, 2).recortar(alaDelante).pintar(g, HUESO, { relieve: 1, max: 3 });
    return g.contorno();
  }

  function androgino() {
    const g = new Rejilla(), P = R.piel.clara, Pe = R.pelo.castano, cx = 17.5, cy = 21;
    /* Ocho miembros en rueda, un poco girados como si rodara hacia los héroes. */
    const giro = -10 * Math.PI / 180;
    const punto = (ang, r, lado = 0) => {
      const a = ang * Math.PI / 180 + giro;
      return [cx + Math.cos(a) * r - Math.sin(a) * lado, cy + Math.sin(a) * r + Math.cos(a) * lado];
    };
    const miembro = (c, ang, largo, grosor, doblez) => {
      const [x0, y0] = punto(ang, 5), [x1, y1] = punto(ang, largo * 0.55 + 3, doblez), [x2, y2] = punto(ang, largo);
      c.linea(x0, y0, x1, y1, grosor).linea(x1, y1, x2, y2, grosor);
      return [x2, y2];
    };
    const brazos = new Capa(), piernas = new Capa(), pies = new Capa();
    for (const [ang, d] of [[-145, 2], [-35, -2], [180, 1.5], [0, -1.5]]) {
      const [x, y] = miembro(brazos, ang, 13, 2, d);
      brazos.ell(x, y, 1.2, 1.2);
    }
    for (const [ang, d, largo] of [[148, -1.5, 11.5], [32, 1.5, 11.5], [104, -1, 12.5], [76, 1, 12.5]]) {
      const [x, y] = miembro(piernas, ang, largo, 3, d);
      pies.rect(Math.round(x) + (x < cx ? -3 : -1), Math.round(y), 5, 2);
    }
    brazos.pintar(g, P, { relieve: 1.5 });
    piernas.pintar(g, P, { relieve: 1.5 });
    pies.pintar(g, R.madera, { relieve: 1, min: 2, separar: true });
    const bola = new Capa().ell(cx, cy, 7, 7);
    bola.pintar(g, P, { relieve: 5, separar: true });
    new Capa().rect(9, 21, 18, 3).recortar(bola).pintar(g, R.tela.terracota, { relieve: 1.5 });
    for (let x = 11; x <= 25; x += 3) pon(g, R.tela.terracota, 4, [x, 22]);
    new Capa().rect(15, 12, 6, 3).pintar(g, P, { relieve: 1, max: 2 });
    const cab = new Capa().ell(cx, 8, 5, 4.8).on(11.6, 8.6).on(23.4, 8.6);
    cab.pintar(g, P, { relieve: 4, separar: true });
    const pelo = new Capa().ell(cx, 4.6, 4.6, 2.1).ell(cx, 1.8, 1.6, 1.2).ell(cx, 7, 1.6, 4);
    pelo.pintar(g, Pe, { relieve: 2, separar: true });
    pon(g, Pe, 1, [15, 5], [20, 5], [17, 8], [18, 10]);
    /* Cara de mujer a la izquierda y de hombre con barba a la derecha. */
    pon(g, NEGRO, 1, [14, 7], [14, 8], [21, 7], [21, 8]);
    pon(g, HUESO, 4, [15, 8], [20, 8]);
    pon(g, NEGRO, 1, [13, 6], [14, 6]);
    pon(g, P, 0, [21, 6], [22, 6], [23, 6]);
    pon(g, R.sangre, 3, [13, 10], [14, 10]);
    pon(g, Pe, 2, [21, 10], [22, 10], [23, 10], [20, 11], [21, 11], [22, 11], [23, 9]);
    pon(g, Pe, 1, [22, 10]);
    return g.contorno();
  }

  function talos() {
    const g = new Rejilla(), B = R.bronce, F = R.fuego, H = R.hierro;
    new Capa().linea(26, 12, 29, 18, 4).linea(29, 18, 29.5, 23, 4).ell(29.5, 25.5, 2.8, 2.6).pintar(g, B, { relieve: 2, max: 2 });
    new Capa().rect(19, 23, 5, 9).rect(17, 32, 7, 3).pintar(g, B, { relieve: 2, max: 2 });
    new Capa().rect(11, 23, 5, 9).rect(8, 32, 8, 3).pintar(g, B, { relieve: 2.5, separar: true });
    for (const [x0, x1] of [[11, 15], [19, 23]]) for (let x = x0; x <= x1; x++) pon(g, B, 1, [x, 27]);
    const cuerpo = new Capa().ell(17.5, 13.5, 9.5, 7).rect(12, 18, 11, 6);
    cuerpo.pintar(g, B, { relieve: 4, separar: true });
    new Capa().linea(17, 9, 17, 18, 1).curva(10, 15, 13, 18.5, 17, 18, 1).curva(17, 18, 22, 18.5, 25, 15, 1).recortar(cuerpo).pintar(g, B, { plano: 1 });
    for (const y of [20, 23]) for (let x = 12; x <= 22; x++) if (g.rampa(x, y) === B) pon(g, B, 1, [x, y]);
    pon(g, B, 4, [12, 23], [15, 23], [18, 23], [21, 23], [13, 10], [21, 10], [16, 21], [19, 21]);
    new Capa().rect(10, 6, 6, 4).pintar(g, B, { relieve: 1.5, max: 2 });
    const cab = new Capa().ell(12.5, 4.8, 3.6, 3.4).on(8.4, 5);
    cab.pintar(g, B, { relieve: 2.5, separar: true });
    const barba = new Capa().poly([[9, 6.5], [15.5, 6], [15, 9], [12, 10.5], [9.5, 9]]);
    barba.pintar(g, B, { relieve: 1.5, max: 2, separar: true });
    pon(g, B, 1, [10, 8], [12, 9], [14, 8], [11, 2], [13, 2], [15, 3]);
    pon(g, F, 4, [10, 4], [13, 4]);
    pon(g, F, 2, [11, 4], [14, 4]);
    new Capa().ell(9, 11, 4, 3.6).linea(8, 13, 6, 19, 4).linea(6, 19, 5, 23, 4).pintar(g, B, { relieve: 2.5, separar: true });
    for (let x = 3; x <= 8; x++) if (g.rampa(x, 19) === B) pon(g, B, 1, [x, 19]);
    new Capa().ell(5, 26, 3.2, 3).pintar(g, B, { relieve: 2, separar: true });
    pon(g, B, 1, [3, 26], [5, 26], [7, 26]);
    for (let y = 24; y <= 29; y++) pon(g, F, y % 2 ? 2 : 3, [12, y]);
    new Capa().ell(10, 30, 1.6, 1.6).pintar(g, H, { relieve: 1, min: 2, separar: true });
    pon(g, H, 4, [9, 29]);
    pon(g, H, 0, [10, 30]);
    return g.contorno();
  }

  function atlas() {
    const g = new Rejilla(), O = R.oricalco, B = R.bronce, Ma = R.mar, Pe = R.pelo.canoso, P = R.piel.oliva;
    const capa = new Capa().poly([[19, 11], [25, 11], [29, 18], [33, 28], [33.5, 34.5], [22, 34.5], [24, 26], [22, 16]]);
    capa.pintar(g, Ma, { relieve: 3 });
    [[22, 17, 25, 33], [24, 15, 29, 31]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(capa).pintar(g, Ma, { plano: 1 }));
    for (let x = 22; x <= 33; x++) for (let y = 30; y <= 34; y++) if (g.rampa(x, y) === Ma && !g.get(x, y + 1)) {
      pon(g, Ma, 4, [x, y]);
      if (x % 3 === 0) pon(g, Ma, 4, [x, y - 1]);
      if (x % 3 === 1) pon(g, Ma, 3, [x, y - 1]);
    }
    new Capa().rect(5, 6, 1, 29).pintar(g, B, { plano: 2 });
    const tri = new Capa().rect(5, 1, 1, 6).rect(2, 6, 7, 1).rect(2, 2, 1, 4).rect(8, 2, 1, 4);
    tri.pintar(g, B, { relieve: 1, min: 2 });
    new Capa().rect(12, 28, 3, 6).rect(18, 28, 3, 6).pintar(g, P, { relieve: 1.5 });
    new Capa().rect(12, 29, 3, 4).rect(18, 29, 3, 4).pintar(g, B, { relieve: 1 });
    new Capa().rect(10, 33, 5, 2).rect(17, 33, 5, 2).pintar(g, R.madera, { relieve: 1 });
    new Capa().poly([[10, 24], [24, 24], [25, 29], [9, 29]]).pintar(g, O, { relieve: 2 });
    for (let x = 10; x <= 24; x += 2) for (let y = 25; y <= 28; y++) if (g.rampa(x, y) === O) pon(g, O, 1, [x, y]);
    new Capa().poly([[11, 12], [23, 12], [24, 16], [23, 24], [11, 24], [10, 16]]).pintar(g, O, { relieve: 3, separar: true });
    for (let x = 10; x <= 24; x++) if (g.rampa(x, 23) === O) pon(g, B, 3, [x, 23]);
    new Capa().curva(12, 17, 14.5, 19, 17, 17.5, 1).curva(17, 17.5, 19.5, 19, 22, 17, 1).linea(17, 18, 17, 22, 1).pintar(g, O, { plano: 1 });
    pon(g, O, 1, [15, 21], [19, 21]);
    pon(g, B, 4, [17, 15], [16, 14], [18, 14]);
    pon(g, B, 3, [17, 16]);
    new Capa().ell(17, 7.5, 4.4, 4.6).on(12, 8).pintar(g, P, { relieve: 3 });
    new Capa().ell(19, 6.5, 3.8, 4).poly([[18, 8], [23, 6], [24, 14], [20, 14]]).pintar(g, Pe, { relieve: 2, separar: true });
    const barba = new Capa().poly([[12, 9.5], [19, 9.5], [19, 14], [17, 19], [15, 21], [13, 18], [12, 13]]);
    barba.pintar(g, Pe, { relieve: 2, separar: 2 });
    pon(g, NEGRO, 1, [14, 7], [17, 7]);
    pon(g, HUESO, 4, [15, 7], [18, 7]);
    pon(g, P, 1, [13, 6], [14, 6], [16, 6], [17, 6]);
    new Capa().rect(12, 3, 10, 2).rect(13, 1, 1, 2).rect(16, 1, 2, 2).rect(20, 1, 1, 2).pintar(g, B, { relieve: 1, min: 2 });
    pon(g, Ma, 4, [16, 3]);
    new Capa().linea(11, 14, 8, 17, 3).linea(8, 17, 6, 19, 2).pintar(g, O, { relieve: 1.5, separar: true });
    new Capa().rect(4, 18, 3, 3).pintar(g, P, { relieve: 1, separar: true });
    return g.contorno();
  }

  function esfinge() {
    const g = new Rejilla(), L = R.tela.ocre, H = HUESO, P = R.piel.oliva, A = R.tela.azul;
    const ala = new Capa().poly([[15.5, 21], [16.5, 13], [17.5, 8.5], [16.5, 5.5], [13.5, 3.5], [15.5, 1.2], [20.5, 1], [24.5, 3], [26.8, 8], [27, 14], [25.5, 19], [22.5, 21.5]]);
    ala.pintar(g, H, { relieve: 3 });
    [[21, 19, 26.5, 8], [21, 19, 27, 13], [21, 20, 25.5, 17.5], [20, 18, 24, 3.5], [19.5, 18, 21.5, 1.5]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(ala).pintar(g, H, { plano: 1 }));
    new Capa().curva(18.5, 19, 21.5, 9, 18, 2.5, 2, 1.5).recortar(ala).pintar(g, A, { relieve: 1, min: 2 });
    for (let y = 4; y <= 18; y += 2) for (let x = 15 + (y % 4 ? 1 : 0); x <= 19; x += 2) if (g.rampa(x, y) === H) pon(g, H, 2, [x, y]);
    new Capa().curva(32, 29, 35, 25, 33, 21, 2, 1.5).pintar(g, L, { relieve: 1 });
    new Capa().ell(33, 20, 1.4, 1.4).pintar(g, R.madera, { relieve: 1, min: 2, separar: true });
    new Capa().linea(12, 26, 10.5, 29.5, 3).linea(10.5, 29.5, 5, 29.5, 3).ell(4.5, 29.5, 1.8, 1.4).pintar(g, L, { relieve: 1.5, max: 2 });
    const cuerpo = new Capa().ell(21, 26.5, 8, 4).ell(13.5, 25, 5, 6).ell(28, 25.5, 5.5, 6).ell(17, 22.5, 3.5, 2.5).rect(12, 29, 20, 5);
    cuerpo.pintar(g, L, { relieve: 4, separar: true });
    new Capa().curva(22, 33, 22, 26, 27, 21.5, 1).recortar(cuerpo).pintar(g, L, { plano: 1 });
    new Capa().rect(18, 32, 7, 2).ell(18.5, 32.5, 1.5, 1).pintar(g, L, { relieve: 1, separar: true });
    new Capa().linea(15, 24, 12.5, 31, 3).linea(12.5, 31.5, 4, 32, 3).ell(3.5, 32, 2, 1.6).pintar(g, L, { relieve: 1.5, separar: true });
    pon(g, L, 1, [4, 33], [6, 33]);
    pon(g, H, 4, [1, 32], [3, 29], [17, 33]);
    pon(g, H, 3, [1, 33], [2, 29]);
    new Capa().rect(9, 15, 5, 7).pintar(g, P, { relieve: 1.5, max: 2 });
    new Capa().ell(10, 12.5, 3.6, 4).on(6, 13).pintar(g, P, { relieve: 3 });
    const tocado = new Capa().poly([[6.5, 10.5], [8, 7.5], [13, 7], [15.5, 9.5], [16, 21], [11.5, 21], [12, 15], [10.5, 10.5]]);
    tocado.pintar(g, A, { relieve: 2, separar: true });
    for (let y = 8; y <= 20; y += 2) for (let x = 6; x <= 16; x++) if (g.rampa(x, y) === A) pon(g, R.bronce, 3, [x, y]);
    pon(g, NEGRO, 1, [7, 11], [8, 11], [9, 11], [7, 12]);
    pon(g, R.bronce, 4, [8, 12]);
    pon(g, R.sangre, 3, [7, 15]);
    pon(g, P, 1, [8, 15], [9, 14]);
    return new Rejilla().pegar(g, 0, 1).contorno();
  }

  function doxa() {
    const g = new Rejilla(), G = R.piel.gris, V = R.piel.violeta, S = R.sombra;
    const nubes = (lista, ram, op) => lista.forEach(([x, y, rx, ry = rx]) => new Capa().ell(x, y, rx, ry).pintar(g, ram, op));
    const fondo = new Capa().ell(18, 18.5, 12.5, 11);
    [[8, 9, 5], [17.5, 6, 5.3], [27, 8, 5], [4.5, 17, 3.6], [31.5, 16.5, 3.4], [5.5, 25, 4], [30, 24.5, 4], [12.5, 29, 4.4], [22.5, 29.5, 4.4]].forEach(([x, y, r]) => fondo.ell(x, y, r, r));
    fondo.curva(6, 28, 3, 31, 2, 34, 3, 1).curva(13, 32, 11, 34, 8, 34, 2.6, 1).curva(27, 31, 30, 33, 33, 34, 2.6, 1);
    fondo.quitarRect(0, 0, 36, 1).quitarRect(0, 35, 36, 1).quitarRect(0, 0, 1, 36).quitarRect(35, 0, 1, 36);
    fondo.pintar(g, S, { relieve: 3, min: 2 });
    nubes([[27, 8.5, 4.5, 4.2], [31, 16.5, 2.8, 3.2], [29.5, 24.5, 3.8, 3.6], [22.5, 29, 4.2, 3.6], [12.5, 28.5, 4.2, 3.6], [5.5, 24.5, 3.4, 3.4], [17.5, 23.5, 5, 4]], V, { relieve: 3, separar: true });
    nubes([[8, 9.5, 4.4, 4], [17.5, 6.5, 4.6, 4.2], [12, 14.5, 5, 4], [23, 13.5, 4.8, 4], [5, 17, 2.8, 3], [16.5, 19.5, 4.6, 3.5], [26.5, 20, 3.4, 2.8]], G, { relieve: 3, separar: true });
    nubes([[18.5, 11.5, 2.4, 2], [3.8, 13, 1.6, 1.8]], V, { relieve: 2, separar: true });
    /* Ojos: los grandes, almendrados con pupila de 2×2; los pequeños, de 3×2 con pupila de un píxel. */
    const ojo = (x, y, rx, ry, dx, dy) => {
      new Capa().ell(x, y, rx, ry).pintar(g, HUESO, { relieve: 1.5, min: 3, separar: 2 });
      const px = Math.round(x + dx - 0.5), py = Math.round(y + dy - 0.5);
      pon(g, NEGRO, 0, [px, py], [px + 1, py], [px, py + 1], [px + 1, py + 1]);
      pon(g, HUESO, 4, [px, py]);
    };
    const ojito = (x, y, dx, dy) => {
      new Capa().rect(x, y, 3, 2).pintar(g, HUESO, { relieve: 1, min: 3, separar: 2 });
      pon(g, NEGRO, 0, [x + 1 + dx, y + dy]);
    };
    ojo(12, 14.5, 2.6, 1.6, -1, 0); ojo(23, 13.5, 2.2, 1.4, 1, -0.5); ojo(16.5, 19.5, 2, 1.3, 0, 0.6);
    ojito(4, 16, -1, 1); ojito(25, 19, 1, 1); ojito(16, 5, 0, 0); ojito(7, 8, -1, 1); ojito(27, 7, 1, 0); ojito(28.5, 23.5, 0, 1); ojito(4, 24, -1, 0); ojito(21, 28, 1, 1);
    pon(g, G, 4, [9, 12], [10, 11], [11, 11], [21, 10], [22, 10], [23, 10]);
    pon(g, V, 4, [27, 26], [28, 27], [29, 27], [31, 14], [31, 15], [15, 23], [16, 23]);
    pon(g, S, 0, [14, 24], [15, 25], [16, 25], [17, 25], [18, 25], [19, 24]);
    pon(g, HUESO, 3, [15, 25], [17, 25]);
    pon(g, S, 0, [11, 28], [12, 28], [11, 29], [12, 29]);
    pon(g, S, 0, [24, 22], [25, 22], [26, 21]);
    return g.contorno();
  }

  /* ---------- Personajes no jugadores ---------- */
  /* Una clase que heroes.js no conoce viste una túnica lisa, sin tocado ni objeto propio. */
  const LLANO = "llano";
  /* PNJ con cuerpo de héroe, mirando a la izquierda. «encima» pinta antes del contorno y «brillo» después
     (destellos sin borde). Las dos reciben las coordenadas del héroe, que mira a la derecha. */
  function pnj(aspecto, encima, brillo) {
    const g = HEROES.componer({ ...aspecto, extras: encima ? [encima] : [], sinContorno: true });
    g.contorno();
    if (brillo) brillo(g, HEROES.plantilla(aspecto.cuerpo || HEROES.RAZAS[aspecto.raza].cuerpo));
    return g.espejo();
  }
  /* Destello de cuatro puntas, sin contorno. */
  const destello = (g, x, y) => { pon(g, R.bronce, 4, [x, y]); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!g.get(x + a, y + b)) pon(g, HUESO, 4, [x + a, y + b]); }); };

  /* Nota musical de 4×5 (cabeza de 2×2, plica y corchete). */
  const nota = (g, x, y, ram, i) => pon(g, ram, i, [x, y + 3], [x + 1, y + 3], [x, y + 4], [x + 1, y + 4], [x + 1, y], [x + 1, y + 1], [x + 1, y + 2], [x + 2, y], [x + 3, y + 1]);

  function sirena() {
    const g = new Rejilla(), P = R.piel.clara, Pe = R.pelo.cobrizo, Pi = R.piedra, Ma = R.mar, Es = R.piel.esmeralda;
    const roca = new Capa().ell(20, 30.5, 11, 4.2).ell(26, 26.5, 6.5, 5).ell(12, 31.5, 5.5, 3).ell(31, 30, 3, 3.5);
    roca.quitarRect(0, 35, 36, 1);
    roca.pintar(g, Pi, { relieve: 3 });
    [[17, 29, 20, 31], [26, 24, 27, 28], [9, 32, 12, 31]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(roca).pintar(g, Pi, { plano: 1 }));
    for (let x = 8; x <= 33; x++) if (g.rampa(x, 34) === Pi && x % 3 !== 1) pon(g, Ma, x % 3 ? 4 : 3, [x, 34]);
    const pelo = new Capa().ell(24.5, 8, 4.6, 4.4).poly([[23, 8], [28.5, 7], [30.5, 14], [30, 21], [27.5, 23.5], [26, 16]]);
    pelo.pintar(g, Pe, { relieve: 2.5 });
    [[27, 10, 28, 20], [29, 12, 29, 19]].forEach(([x0, y0, x1, y1]) => new Capa().linea(x0, y0, x1, y1, 1).recortar(pelo).pintar(g, Pe, { plano: 1 }));
    new Capa().linea(27, 15, 28.5, 21, 2).pintar(g, P, { relieve: 1, max: 2 });
    const cola = new Capa().curva(24.5, 21.5, 13, 18.5, 8.5, 28, 6, 2.2);
    cola.pintar(g, Ma, { relieve: 2.5, separar: true });
    for (let y = 17; y <= 30; y++) for (let x = 6; x <= 27; x++)
      if (g.rampa(x, y) === Ma && (x + 2 * y) % 4 === 0 && g.get(x, y) !== Ma[1]) pon(g, Es, 4, [x, y]);
    new Capa().poly([[9.5, 27], [3.5, 24], [5.5, 28.5], [3, 32.5], [10, 30]]).pintar(g, Es, { relieve: 1.5, separar: true });
    pon(g, Es, 2, [5, 26], [6, 27], [5, 31], [6, 30]);
    const torso = new Capa().poly([[21.5, 14], [26.5, 14], [26, 18], [25.5, 22], [22, 22], [22, 18]]);
    torso.pintar(g, P, { relieve: 2.5, separar: true });
    new Capa().rect(23, 12, 2, 3).pintar(g, P, { relieve: 1, max: 2 });
    pon(g, HUESO, 3, [22, 17], [24, 17]);
    pon(g, HUESO, 4, [23, 17], [25, 17]);
    new Capa().linea(22.5, 15, 20.5, 19, 2).linea(20.5, 19, 18, 20, 2).pintar(g, P, { relieve: 1.5, separar: true });
    const cab = new Capa().ell(22.5, 8.5, 4, 4.2).on(18, 9.5);
    cab.pintar(g, P, { relieve: 3, separar: true });
    new Capa().ell(24, 5.8, 3.6, 2).poly([[24, 6], [27, 6], [27.5, 13], [26, 13]]).pintar(g, Pe, { relieve: 2, separar: true });
    pon(g, NEGRO, 1, [21, 8], [21, 9], [19, 8], [19, 9]);
    pon(g, HUESO, 4, [22, 9], [20, 9]);
    pon(g, P, 1, [20, 7], [21, 7], [18, 7]);
    pon(g, R.sangre, 2, [19, 11], [20, 11]);
    nota(g, 11, 3, HUESO, 4);
    nota(g, 5, 9, HUESO, 3);
    return g.contorno();
  }

  const PNJS = {
    demetria: () => pnj({ raza: "humano", clase: "filosofo", piel: "oliva", pelo: "castano", peinado: "corto", tela: "ocre", objeto: "balanza" }, (g, t) => {
      const T = R.tela.terracota;
      const pa = new Capa().ell(t.cabX - 0.4, t.cabY - 1.6, t.cabRx + 0.9, t.cabRy - 0.3);
      for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++)
        if ((x >= t.cabX - 1 && y > t.ojoY - 3) || (x < t.cabX - 1 && y > t.cabY - 1)) pa.off(x, y);
      pa.ell(t.cabX - 6, t.cabY - 1.5, 1.6, 1.6).linea(t.cabX - 6, t.cabY - 1, t.cabX - 8, t.cabY + 4, 2).linea(t.cabX - 6, t.cabY, t.cabX - 6, t.cabY + 5, 1);
      pa.pintar(g, T, { relieve: 2, separar: true });
      for (let x = t.cabX - 5; x <= t.cabX + 4; x++) for (let y = t.cabY - 7; y <= t.cabY; y++)
        if (g.rampa(x, y) === T && g.rampa(x, y + 1) !== T && g.rampa(x, y + 1)) pon(g, R.bronce, 3, [x, y]);
      pon(g, T, 1, [t.cabX - 6, t.cabY - 1]);
      pon(g, R.bronce, 4, [t.cabX - 2, t.cabY + 3]);
      const [mx, my] = t.mano;
      pon(g, R.bronce, 2, [mx - 3, my - 5], [mx - 3, my - 4], [mx + 3, my - 5], [mx + 3, my - 4], [mx - 3, my - 2], [mx + 3, my - 2]);
      pon(g, R.bronce, 4, [mx, my - 7]);
    }),
    muchacho: () => pnj({ raza: "humano", clase: LLANO, cuerpo: "bajo", piel: "morena", pelo: "negro", peinado: "rizado", tela: "blanco", objeto: "ninguno" }, (g, t) => {
      const [mx, my] = t.mano;
      new Capa().linea(mx + 1, my - 2, mx + 6, t.suelo, 1).pintar(g, R.madera, { plano: 2 });
      for (let x = t.torL; x <= t.torR; x++) if (g.rampa(x, t.torBot - 2) === R.tela.blanco) pon(g, R.madera, 2, [x, t.torBot - 2]);
    }),
    pastor: () => pnj({ raza: "humano", clase: LLANO, piel: "morena", pelo: "castano", barba: true, peinado: "corto", tela: "oliva", objeto: "cayado" }, (g, t) => {
      const gorro = new Capa().ell(t.cabX - 0.5, t.cabY - 2, t.cabRx + 0.6, 3.6);
      gorro.quitarRect(0, t.ojoY - 1, 36, 36);
      gorro.curva(t.cabX - 1, t.cabY - 5, t.cabX + 1, t.cabY - 9, t.cabX + 4, t.cabY - 7, 3, 1.5);
      gorro.pintar(g, R.tela.granate, { relieve: 2, separar: true });
      new Capa().ell(t.cx - 1, t.torTop + 1, 5.5, 2.2).pintar(g, HUESO, { relieve: 1.5, separar: true });
      for (let x = t.cx - 6; x <= t.cx + 4; x += 2) pon(g, HUESO, 2, [x, t.torTop + 2]);
      const [mx, my] = t.mano;
      pon(g, R.bronce, 4, [mx - 1, my - 1]);
      pon(g, R.bronce, 2, [mx - 1, my]);
    }, (g, t) => destello(g, t.mano[0] + 3, t.mano[1] - 3)),
    alcibiades: () => pnj({ raza: "humano", clase: "rapsoda", piel: "clara", pelo: "rubio", peinado: "rizado", tela: "granate", objeto: "copa" }, (g, t, { piel }) => {
      const x = t.cabX, y = t.ojoY;
      pon(g, R.tela.violeta, 1, [x - 3, t.cabY - 4], [x, t.cabY - 5], [x + 2, t.cabY - 4]);
      pon(g, R.piel.roja, 4, [x + 2, y + 2], [x + 5, y + 2]);
      pon(g, piel, 1, [x + 1, y], [x + 4, y], [x, y]);
      pon(g, R.sangre, 2, [x + 3, y + 3], [x + 4, y + 3]);
      pon(g, piel, 1, [x + 5, y + 2], [x + 2, y + 3]);
      const [mx, my] = t.mano;
      pon(g, R.sangre, 3, [mx + 3, my - 2], [mx + 3, my]);
    }),
    sileno: () => pnj({ raza: "satiro", clase: "atleta", cuerpo: "fornido", piel: "clara", pelo: "castano", peinado: "rapado", tela: "violeta", objeto: "ninguno" }, (g, t, { piel }) => {
      const cuerno = R.pelo.castano;
      for (let y = 0; y < t.cabY - 2; y++) for (let x = 0; x < 36; x++)
        if (g.rampa(x, y) === HUESO) g.set(x, y, cuerno[Math.min(4, HUESO.indexOf(g.get(x, y)) + 1)], cuerno);
      new Capa().ell(t.cx + 1.5, t.torTop + 7, 5, 4.6).pintar(g, piel, { relieve: 4, separar: true });
      pon(g, piel, 1, [t.cx + 2, t.torTop + 7]);
      const y = t.ojoY;
      new Capa().ell(t.cabX - 4.6, t.cabY + 1, 1.6, 2.2).pintar(g, R.pelo.canoso, { relieve: 1.5, separar: true });
      new Capa().linea(t.cabX - 2, t.cabY + 1, t.cabX - 4, t.cabY - 2, 2).on(t.cabX - 3, t.cabY + 2).pintar(g, piel, { relieve: 1, separar: 2 });
      pon(g, piel, 1, [t.cabX - 3, t.cabY]);
      new Capa().poly([[t.cabX - 2, y + 1.5], [t.cabX + 5.5, y + 2], [t.cabX + 5, y + 5], [t.cabX + 2, t.torTop + 5], [t.cabX - 1, t.torTop + 3], [t.cabX - 3, y + 3]]).pintar(g, R.pelo.canoso, { relieve: 2, separar: 2 });
      pon(g, R.pelo.canoso, 0, [t.cabX + 3, y + 3], [t.cabX + 4, y + 3]);
      pon(g, R.pelo.canoso, 1, [t.cabX + 1, y + 6], [t.cabX + 3, y + 7]);
      brazoDelante(g, t, piel);
      const [mx, my] = t.mano;
      new Capa().ell(mx + 1, my + 3.5, 2.6, 3).rect(mx, my, 2, 2).pintar(g, R.madera, { relieve: 2, separar: true });
      pon(g, R.madera, 1, [mx, my + 1], [mx + 1, my + 1]);
      pon(g, R.madera, 4, [mx, my + 3]);
      pon(g, R.tela.violeta, 2, [t.cabX - 3, t.cabY - 5], [t.cabX + 1, t.cabY - 5], [t.cabX - 4, t.cabY - 4]);
    }),
    diotima: () => pnj({ raza: "humano", clase: "filosofo", piel: "oliva", pelo: "negro", peinado: "largo", tela: "blanco", objeto: "ninguno" }, (g, t, { piel }) => {
      const velo = new Capa().ell(t.cabX - 1, t.cabY - 1.2, t.cabRx + 0.8, t.cabRy + 0.2);
      for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (x >= t.cabX - 1 && y >= t.cabY - 3) velo.off(x, y);
      velo.poly([[t.cabX - 6.5, t.cabY - 2], [t.cabX - 2, t.cabY - 2], [t.cabX - 2, t.torTop + 2], [t.torL, t.pierTop], [t.cabX - 9, t.pierTop + 2]]);
      velo.pintar(g, R.tela.blanco, { relieve: 2.5, separar: true });
      for (let x = t.cabX - 4; x <= t.cabX + 3; x++) pon(g, R.bronce, 3, [x, t.cabY - 4 + (x > t.cabX + 1 ? 1 : 0)]);
      const x = t.cabX, y = t.ojoY;
      pon(g, piel, 2, [x, y + 1], [x + 1, y], [x + 3, y + 1], [x + 4, y]);
      pon(g, piel, 0, [x + 1, y + 1], [x + 4, y + 1], [x, y + 1], [x + 3, y + 1]);
      const [mx, my] = t.mano;
      pon(g, R.hoja, 3, [mx + 1, my - 2], [mx + 2, my - 3], [mx + 1, my - 4]);
      pon(g, R.hoja, 2, [mx, my - 3], [mx + 2, my - 5]);
    }),
    hefesto: () => pnj({ raza: "humano", clase: "atleta", cuerpo: "fornido", piel: "oliva", pelo: "negro", barba: true, peinado: "corto", tela: "negro", objeto: "martillo" }, (g, t, { piel }) => {
      new Capa().poly([[t.torL + 1, t.torTop + 2], [t.torR - 1, t.torTop + 2], [t.torR + 1, t.pierTop + 4], [t.torL - 1, t.pierTop + 4]]).pintar(g, R.madera, { relieve: 2, separar: true });
      const pilos = new Capa().poly([[t.cabX - 5.5, t.cabY - 2], [t.cabX + 4.5, t.cabY - 2], [t.cabX + 1.5, t.cabY - 9], [t.cabX - 2.5, t.cabY - 9]]);
      pilos.pintar(g, R.tela.terracota, { relieve: 2, separar: true });
      pon(g, R.piedra, 2, [t.cabX + 2, t.ojoY - 1], [t.cabX + 3, t.ojoY - 2], [t.cabX + 5, t.ojoY + 1], [t.cabX - 1, t.ojoY]);
      pon(g, R.piedra, 3, [t.cabX + 1, t.ojoY - 2], [t.cabX + 4, t.ojoY + 2]);
      for (let yy = t.torTop + 3; yy <= t.pierTop + 3; yy += 3) pon(g, R.madera, 1, [t.cx + 2, yy]);
      brazoDelante(g, t, piel);
    }),
    sirena,
    hermes: () => pnj({ raza: "humano", clase: LLANO, piel: "clara", pelo: "castano", peinado: "corto", tela: "azul", objeto: "caduceo" }, (g, t) => {
      new Capa().poly([[t.torL - 1, t.torTop], [t.cx + 2, t.torTop], [t.torL + 2, t.torTop + 6], [t.torL - 3, t.torBot], [t.torL - 4, t.torTop + 3]]).pintar(g, R.tela.terracota, { relieve: 2, separar: true });
      const sombrero = new Capa().ell(t.cabX + 0.5, t.cabY - 3.6, 7.2, 1.2).ell(t.cabX - 0.5, t.cabY - 5, 4, 2.4);
      sombrero.quitarRect(0, t.cabY - 2, 36, 36);
      sombrero.pintar(g, R.tela.ocre, { relieve: 1.5, separar: true });
      abanico(new Capa(), t.cabX - 3, t.cabY - 6, [[-3, -3], [-5, -3], [-5, -1]]).pintar(g, HUESO, { relieve: 1, min: 3, separar: true });
      pon(g, HUESO, 4, [t.cx - 6, t.suelo - 2], [t.cx - 7, t.suelo - 3], [t.cx + 1, t.suelo - 2], [t.cx, t.suelo - 3]);
    }),
    cefalo: () => pnj({ raza: "humano", clase: "filosofo", piel: "clara", pelo: "canoso", barba: true, peinado: "corto", tela: "oliva", objeto: "copa" }, (g, t, { piel }) => {
      const y = t.ojoY;
      new Capa().poly([[t.cabX - 3, y + 3], [t.cabX + 5, y + 3], [t.cabX + 4, t.torTop + 4], [t.cabX + 1, t.torTop + 7], [t.cabX - 2, t.torTop + 4]]).pintar(g, R.pelo.canoso, { relieve: 2, separar: 2 });
      pon(g, R.pelo.canoso, 0, [t.cabX + 3, y + 3], [t.cabX + 4, y + 3]);
      for (let x = t.cabX - 5; x <= t.cabX + 3; x++) pon(g, R.hoja, x % 2 ? 3 : 2, [x, t.cabY - 4 + (x < t.cabX - 3 ? 1 : 0) + (x > t.cabX + 1 ? 1 : 0)]);
      pon(g, piel, 2, [t.cabX + 1, y + 1], [t.cabX + 4, y + 1]);
    })
  };

  return {
    MONSTRUOS: { sombra, titiritero, trasimaco, harpia, androgino, talos, atlas, esfinge, doxa },
    PNJ: PNJS
  };
})();
