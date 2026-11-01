/* Dados y Mazmorras · iconos de interfaz HD (20×20): nodos del mapa, objetos, recursos, tipos de daño y estados.
   Cada icono es una función que devuelve una Rejilla nueva de 20×20 con contorno oscuro,
   luz desde arriba a la izquierda y sombreado con rampas de cinco tonos. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, CONTORNO } = PX;
  const N = 20;
  const C = () => new Capa(N, N);
  const nuevo = () => new Rejilla(N, N);
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const PL = R.plata, HI = R.hierro, B = R.bronce, M = R.madera, F = R.fuego, HU = R.hueso, P = R.piedra, MG = R.magia, SA = R.sangre;
  const AZ = R.tela.azul, VI = R.tela.violeta, GRA = R.tela.granate, BL = R.tela.blanco, NE = R.tela.negro, TE = R.tela.terracota;

  /* Rampas propias de los iconos (de sombra a brillo). */
  const VENENO = ["#0e2410", "#1f4a1a", "#3a7f26", "#6cbf3a", "#c4f07a"];
  const HIELO = ["#16304a", "#2a5a80", "#4f94c0", "#8fd0ec", "#e8faff"];
  const RAYO = ["#5a3a08", "#9a6a10", "#d8a820", "#f8e050", "#fffbd0"];
  const MANA = ["#0c1640", "#1a3480", "#2f62c8", "#5aa0f0", "#c8ecff"];
  const CORAZON = ["#3a0610", "#701020", "#b41e2c", "#ea4a40", "#ffa890"];
  const VERDE = ["#0c2a18", "#185a2c", "#2a8f44", "#5ccf6a", "#c8f8b8"];
  const QUESO = ["#5a3a08", "#a07018", "#e0b030", "#f8dc6a", "#fff6c0"];
  const PAN = ["#3e1e08", "#7a4214", "#b87028", "#e0a04a", "#f8d890"];
  const CARNE = ["#3a1008", "#6e2214", "#a8402a", "#d87050", "#f8b090"];
  const VIDRIO = ["#26303c", "#46566a", "#7e96aa", "#bcd4e2", "#f2fbff"];
  const CUERO = ["#2a1408", "#4e2a12", "#7a4422", "#a8683a", "#d09a62"];
  const ESMERALDA = ["#06200f", "#0c3e1e", "#17703a", "#36b062", "#a8f0b8"];
  const ESPECTRO = ["#0b1618", "#122e2d", "#1f5450", "#3b8a7a", "#8cd6ba"];
  const AMATISTA = ["#1e0a2e", "#3e1660", "#6e2aa0", "#a65ad8", "#e6c0ff"];

  /* ---------- Herramientas ---------- */
  const pon = (g, x, y, ram, k) => g.set(x, y, ram[k], ram);
  /* Antes de pintar una pieza encima de otra, marca su borde con el contorno para que se separen. */
  function recorte(g, c, col = CONTORNO) {
    const borde = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (c.tiene(x, y) || !g.get(x, y)) continue;
      if (c.tiene(x + 1, y) || c.tiene(x - 1, y) || c.tiene(x, y + 1) || c.tiene(x, y - 1)) borde.push([x, y]);
    }
    for (const [x, y] of borde) g.set(x, y, col);
  }
  function pieza(g, c, ram, op = {}) {
    if (op.recorte !== false) recorte(g, c);
    c.pintar(g, ram, op);
    return c;
  }
  /* Dibujo a mano: una cadena por fila; cada letra apunta a [rampa, tono] o a un color. */
  function dibujo(g, filas, x0, y0, mapa) {
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        const v = mapa[fila[i]];
        if (!v) continue;
        if (Array.isArray(v)) g.set(x0 + i, y0 + j, v[0][v[1]], v[0]);
        else g.set(x0 + i, y0 + j, v);
      }
    });
  }
  /* Sube o baja un tono un píxel dentro de su rampa. */
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), c = g.get(x, y);
    if (!r || !c) return;
    const k = r.indexOf(c);
    if (k >= 0) g.set(x, y, r[lim(k + d, 0, r.length - 1)], r);
  }
  /* Brillo en estrella de cuatro puntas. */
  function destello(g, x, y, col = HU[4], brazo = 1) {
    g.set(x, y, col);
    for (let k = 1; k <= brazo; k++) { g.set(x - k, y, col); g.set(x + k, y, col); g.set(x, y - k, col); g.set(x, y + k, col); }
  }
  /* Espada en diagonal a 45°: punta en (tx, ty) y la hoja baja hacia el puño; sx = -1 (como «/») o 1 (como «\»). */
  function espada(g, tx, ty, largo, sx, op = {}) {
    const hoja = op.hoja || PL, guarda = op.guarda || B, puno = op.puno || CUERO, pomo = op.pomo || B;
    const c = C();
    for (let i = 0; i < largo; i++) { c.on(tx + sx * i, ty + i); if (i > 0) c.on(tx + sx * i + 1, ty + i); }
    recorte(g, c);
    for (let i = 0; i < largo; i++) {
      const x = tx + sx * i, y = ty + i;
      if (i === 0) { pon(g, x, y, hoja, 4); continue; }
      pon(g, x, y, hoja, sx < 0 ? 4 : 3); pon(g, x + 1, y, hoja, sx < 0 ? 2 : 1);
      if (i > 2 && i < largo - 1 && op.acanaladura) pon(g, x + (sx < 0 ? 1 : 0), y, hoja, 3);
    }
    // guarda perpendicular a la hoja
    const ex = tx + sx * largo, ey = ty + largo, gc = C();
    for (let k = -3; k <= 3; k++) { gc.on(ex - sx * k + (sx < 0 ? 1 : 0), ey + k); gc.on(ex - sx * k + (sx < 0 ? 1 : 0) + 1, ey + k); }
    gc.off(ex - sx * 3 + (sx < 0 ? 1 : 0) + (sx < 0 ? 0 : 1), ey + 3);
    gc.off(ex + sx * 3 + (sx < 0 ? 1 : 0) + (sx < 0 ? 1 : 0), ey - 3);
    pieza(g, gc, guarda, { relieve: 1, min: 2 });
    // puño y pomo
    const pc = C();
    for (let i = 1; i <= (op.puno_largo || 3); i++) pc.on(ex + sx * i + (sx < 0 ? 1 : 0), ey + i).on(ex + sx * i + (sx < 0 ? 0 : 1), ey + i);
    pieza(g, pc, puno, { relieve: 1, min: 1, max: 3 });
    const L = op.puno_largo || 3, px = ex + sx * (L + 1) + (sx < 0 ? 0 : 0), py = ey + L + 1;
    const po = C().rect(px - (sx < 0 ? 1 : -1) * 0 , py, 2, 2);
    pieza(g, po, pomo, { relieve: 1, min: 2 });
    pon(g, px, py, pomo, 4);
  }
  /* Disco con un signo dentro (para los nodos «evento» y «misterio»). */
  function disco(g, ram, signo, colSigno, colSombra) {
    pieza(g, C().ell(9.5, 9.5, 8.6, 8.6), ram, { relieve: 4 });
    const c = C().ell(9.5, 9.5, 7, 7), borde = C().ell(9.5, 9.5, 8.6, 8.6).restar(c);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (borde.tiene(x, y)) matiz(g, x, y, x + y < 19 ? 1 : -1);
    const filas = signo === "?" ? [" XXXX ", "XX  XX", "XX  XX", "   XX ", "  XX  ", "  XX  ", "      ", "  XX  ", "  XX  "]
      : ["  XX  ", "  XX  ", "  XX  ", "  XX  ", "  XX  ", "  XX  ", "      ", "  XX  ", "  XX  "];
    dibujo(g, filas, 7, 6, { X: colSombra });
    dibujo(g, filas, 6, 5, { X: colSigno });
  }
  /* Calavera de frente (jefe y maldito). */
  function craneo(g, ram, ojo, op = {}) {
    const cr = C().ell(10, 8.5, 6.6, 6.2).rect(6, 12, 8, 3);
    pieza(g, cr, ram, { relieve: 3.5 });
    const mand = C().rect(7, 14, 6, 3);
    pieza(g, mand, ram, { relieve: 1.5, max: 3 });
    for (const x of [8, 10, 12]) g.set(x, 15, CONTORNO).set(x, 16, CONTORNO);
    g.set(7, 16, CONTORNO); g.set(12, 16, CONTORNO);
    // cuencas de los ojos y nariz
    for (const [x, y] of [[6, 8], [7, 8], [6, 9], [7, 9], [8, 9], [6, 10], [7, 10], [11, 8], [12, 8], [11, 9], [12, 9], [13, 9], [12, 10], [13, 10], [11, 10]]) g.set(x, y, CONTORNO);
    g.set(9, 11, CONTORNO).set(10, 11, CONTORNO).set(9, 12, ram[1], ram).set(10, 12, ram[1], ram);
    g.set(7, 9, ojo).set(12, 9, ojo);
    if (op.brillo !== false) { pon(g, 6, 4, ram, 4); pon(g, 7, 4, ram, 4); pon(g, 5, 5, ram, 4); }
  }
  /* Llama de varias lenguas: capas de fuera adentro. */
  function llama(g, cx, base, alto, ancho, ram = F, op = {}) {
    const exterior = C().ell(cx, base - ancho * 0.75, ancho, ancho * 0.8).poly([[cx - ancho, base - ancho * 0.8], [cx - ancho * 0.3, base - alto], [cx + ancho * 0.2, base - alto * 0.55], [cx + ancho * 0.55, base - alto * 0.85], [cx + ancho, base - ancho * 0.8]]);
    if (op.lenguas !== false) exterior.poly([[cx - ancho * 0.9, base - ancho], [cx - ancho - 1.5, base - alto * 0.62], [cx - ancho * 0.3, base - ancho * 1.4]]);
    pieza(g, exterior, ram, { relieve: 2, min: 1, max: 2, recorte: op.recorte });
    const medio = C().ell(cx + 0.3, base - ancho * 0.7, ancho * 0.65, ancho * 0.6).poly([[cx - ancho * 0.6, base - ancho * 0.8], [cx - ancho * 0.1, base - alto * 0.78], [cx + ancho * 0.25, base - alto * 0.45], [cx + ancho * 0.6, base - ancho * 0.8]]);
    medio.pintar(g, ram, { plano: 3 });
    const nucleo = C().ell(cx + 0.4, base - ancho * 0.55, ancho * 0.34, ancho * 0.38).poly([[cx - ancho * 0.25, base - ancho * 0.6], [cx + 0.2, base - alto * 0.5], [cx + ancho * 0.35, base - ancho * 0.6]]);
    nucleo.pintar(g, ram, { plano: 4 });
  }
  /* Matraz redondo de vidrio con un líquido (pocion, fuego). */
  function matraz(g, liquido, op = {}) {
    const cx = 10, cy = op.cy || 13, r = op.r || 6;
    const cuerpo = C().ell(cx - 0.5, cy, r, r - 0.4);
    const cuello = C().rect(cx - 2.5, cy - r - 3, 4, 4);
    pieza(g, cuello, VIDRIO, { relieve: 1, min: 2, max: 3 });
    pieza(g, cuerpo, VIDRIO, { relieve: 3, min: 1, max: 3 });
    // el líquido, con su superficie más clara
    const nivel = op.nivel ?? cy - 1;
    const liq = C().ell(cx - 0.5, cy, r - 1, r - 1.4).quitarRect(0, 0, N, nivel);
    liq.pintar(g, liquido, { relieve: 3, luz: [-0.6, -0.4, 0.6] });
    for (let x = 0; x < N; x++) if (liq.tiene(x, nivel)) pon(g, x, nivel, liquido, 4);
    // brillos del vidrio
    pon(g, cx - r + 1, cy - 2, VIDRIO, 4); pon(g, cx - r + 1, cy - 1, VIDRIO, 4); pon(g, cx - r + 2, cy - 3, VIDRIO, 4);
    pon(g, cx + r - 2, cy + 2, VIDRIO, 3);
    // labio del cuello
    const labio = C().rect(cx - 3.5, cy - r - 3, 6, 1);
    labio.pintar(g, VIDRIO, { plano: 3 });
    return { cx, cy, r, tope: cy - r - 3 };
  }

  /* ---------- Nodos del mapa ---------- */
  function combate() {
    const g = nuevo();
    espada(g, 16, 2, 10, -1, { acanaladura: true });
    espada(g, 3, 2, 10, 1, { acanaladura: true });
    return g.contorno();
  }
  function elite() {
    const g = nuevo();
    // estallido rojo detrás de las espadas
    const pts = [];
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 4.6 : 9; pts.push([9.5 + Math.cos(a) * r, 9.5 + Math.sin(a) * r]); }
    pieza(g, C().poly(pts), SA, { relieve: 3, min: 1 });
    pieza(g, C().ell(9.5, 9.5, 4.5, 4.5), SA, { relieve: 2, min: 2 });
    espada(g, 16, 2, 10, -1, { hoja: PL, guarda: R.tela.negro, pomo: SA });
    espada(g, 3, 2, 10, 1, { hoja: PL, guarda: R.tela.negro, pomo: SA });
    return g.contorno();
  }
  function evento() {
    const g = nuevo();
    disco(g, AZ, "!", HU[4], AZ[0]);
    return g.contorno();
  }
  function misterio() {
    const g = nuevo();
    disco(g, VI, "?", B[4], VI[0]);
    g.set(14, 4, B[4]).set(4, 13, HU[4]);
    return g.contorno();
  }
  function tesoro() {
    const g = nuevo();
    // tapa abombada y caja
    const tapa = C().ell(9.5, 8, 8, 4).quitarRect(0, 9, N, 12).rect(2, 8, 16, 2);
    pieza(g, tapa, M, { relieve: 2.5 });
    const caja = C().rect(2, 10, 16, 8);
    pieza(g, caja, M, { relieve: 2, max: 3 });
    // tablas
    for (let x = 3; x < 17; x++) { pon(g, x, 13, M, 1); pon(g, x, 16, M, 1); pon(g, x, 6, M, 2); }
    // herrajes de bronce
    for (const x0 of [3, 15]) for (let y = 5; y < 18; y++) { if (y === 4) continue; if (g.get(x0, y)) pon(g, x0, y, B, y < 10 ? 4 : 3); if (g.get(x0 + 1, y)) pon(g, x0 + 1, y, B, y < 10 ? 2 : 1); }
    for (let x = 2; x < 18; x++) { pon(g, x, 10, B, x < 10 ? 4 : 3); pon(g, x, 9, M, 1); }
    // cerradura
    const cer = C().rect(8, 9, 4, 4);
    pieza(g, cer, B, { relieve: 1, min: 2 });
    g.set(9, 11, CONTORNO).set(10, 11, CONTORNO).set(9, 12, CONTORNO);
    pon(g, 8, 9, B, 4);
    return g.contorno();
  }
  function tienda() {
    const g = nuevo();
    // bolsa de cuero atada con una moneda delante
    const bolsa = C().ell(10, 12.5, 7, 5.6).poly([[6, 9], [8, 6], [12, 6], [14, 9]]);
    pieza(g, bolsa, CUERO, { relieve: 3.5 });
    const boca = C().ell(10, 4, 4.4, 1.8).poly([[6.5, 4], [8, 2], [9.5, 3], [11, 1.5], [13.5, 4]]);
    pieza(g, boca, CUERO, { relieve: 1.5, min: 2 });
    for (let x = 7; x <= 13; x++) pon(g, x, 6, GRA, x < 10 ? 4 : 3);
    pon(g, 13, 7, GRA, 3); pon(g, 14, 8, GRA, 2);
    for (const [x, y] of [[8, 10], [7, 12], [12, 15]]) matiz(g, x, y, -1);
    const moneda = C().ell(10.5, 13.5, 3.2, 3.2);
    pieza(g, moneda, B, { relieve: 2, min: 1 });
    pon(g, 10, 12, B, 4); pon(g, 11, 13, B, 2); pon(g, 10, 14, B, 2); pon(g, 11, 15, B, 1);
    return g.contorno();
  }
  function hoguera() {
    const g = nuevo();
    // piedras alrededor
    for (const [x, y, r] of [[3, 17, 2], [16.5, 17, 2], [9.5, 18, 1.8]]) pieza(g, C().ell(x, y, r * 1.2, r * 0.8), P, { relieve: 1.5, min: 1 });
    // dos troncos cruzados
    const t1 = C().linea(3, 17, 16, 12, 3), t2 = C().linea(3, 12, 16, 17, 3);
    pieza(g, t1, M, { relieve: 1.5, max: 3 });
    pieza(g, t2, M, { relieve: 1.5, max: 3 });
    for (const [x, y] of [[2, 12], [3, 12], [2, 13]]) pon(g, x, y, PAN, 3);
    for (const [x, y] of [[17, 12], [16, 11], [17, 13]]) pon(g, x, y, PAN, 2);
    llama(g, 9.5, 14, 13, 4.2);
    pon(g, 5, 4, F, 3); pon(g, 15, 6, F, 4);
    return g.contorno();
  }
  function altar() {
    const g = nuevo();
    // losa, cuerpo y base de piedra
    pieza(g, C().rect(3, 17, 14, 2), P, { relieve: 1 });
    pieza(g, C().rect(4, 12, 12, 5), P, { relieve: 2, max: 3 });
    pieza(g, C().rect(2, 10, 16, 2), P, { relieve: 1, min: 2 });
    for (let x = 2; x < 18; x++) pon(g, x, 10, P, x < 9 ? 4 : 3);
    // runa grabada que brilla en rojo
    dibujo(g, [" a ", "aaa", " a ", "a a"], 8, 13, { a: [SA, 4] });
    // orbe de sangre sobre la losa y velas
    pieza(g, C().ell(10, 6, 3.4, 3.4), SA, { relieve: 2.5 });
    pon(g, 9, 4, CORAZON, 4); pon(g, 8, 5, CORAZON, 3);
    for (const x of [3, 15]) {
      pieza(g, C().rect(x, 6, 2, 4), HU, { relieve: 1, min: 2 });
      pon(g, x, 6, HU, 4);
      g.set(x, 5, F[3], F).set(x, 4, F[4], F).set(x + 1, 5, F[2], F);
    }
    return g.contorno();
  }
  function jefe() {
    const g = nuevo();
    // cuernos curvos
    pieza(g, C().curva(5, 6, 1.5, 5, 2, 0.5, 3, 1.4), HU, { relieve: 1.2, min: 1, max: 3 });
    pieza(g, C().curva(15, 6, 18.5, 5, 18, 0.5, 3, 1.4), HU, { relieve: 1.2, min: 1, max: 3 });
    craneo(g, HU, SA[4]);
    g.set(6, 9, SA[3]).set(13, 9, SA[3]);
    return g.contorno();
  }
  function huellas() {
    const g = nuevo();
    // dos huellas de bota sobre la tierra: puntera y tacón separados
    const pie = (x, y) => {
      pieza(g, C().ell(x, y, 2.4, 3.2), CUERO, { relieve: 1.5, min: 1 });
      pieza(g, C().ell(x + 0.3, y + 5.4, 1.9, 1.4), CUERO, { relieve: 1.2, min: 1 });
      pon(g, Math.round(x - 1), Math.round(y - 2), CUERO, 4);
      pon(g, Math.round(x), Math.round(y + 1), CUERO, 1);
    };
    pie(5.5, 10.5);
    pie(13.5, 3.5);
    return g.contorno();
  }

  function inicio() {
    const g = nuevo();
    // montón de piedras, mástil y estandarte
    pieza(g, C().ell(5, 17.5, 4, 1.6).ell(8, 16.8, 2, 1.4), P, { relieve: 1.5 });
    const mastil = C().rect(4, 3, 2, 14);
    pieza(g, mastil, M, { relieve: 1, min: 2, luz: [-1, 0, 0.4] });
    const ban = C().poly([[6, 3], [12, 2.5], [18, 4], [16.5, 7], [18, 10], [12, 9.5], [6, 11]]);
    pieza(g, ban, GRA, { relieve: 2.5 });
    for (const [x, y] of [[11, 3], [11, 4], [11, 5], [11, 6], [11, 7], [11, 8]]) matiz(g, x, y, -1);
    for (const [x, y] of [[12, 3], [12, 4], [12, 5]]) matiz(g, x, y, 1);
    // emblema de un dado en el estandarte
    dibujo(g, ["bbb", "bab", "bbb"], 7, 5, { b: [B, 3], a: [B, 1] });
    pieza(g, C().ell(5, 2, 1.5, 1.5), B, { relieve: 1, min: 2 });
    return g.contorno();
  }

  /* ---------- Objetos ---------- */
  function arma_fisica() {
    const g = nuevo();
    espada(g, 17, 1, 12, -1, { acanaladura: true });
    destello(g, 15, 3, HU[4], 1);
    return g.contorno();
  }
  function arma_magica() {
    const g = nuevo();
    // báculo de madera con un cristal arcano sujeto por garras
    const vara = C().linea(3, 18, 12, 8, 2);
    pieza(g, vara, M, { relieve: 1, min: 1, max: 3 });
    for (const [x, y] of [[5, 15], [6, 14], [8, 12]]) pon(g, x, y, M, 4);
    for (const [x, y] of [[4, 16], [7, 13]]) pon(g, x, y, B, 3);
    const garra = C().poly([[10, 9], [10, 5], [12, 7], [14, 5], [15, 10], [12, 11]]);
    pieza(g, garra, B, { relieve: 1.2, min: 1 });
    const cristal = C().poly([[13, 1], [16.5, 4.5], [13.5, 9], [10, 5.5]]);
    pieza(g, cristal, AMATISTA, { relieve: 2, luz: [-0.7, -0.6, 0.5] });
    pon(g, 12, 4, AMATISTA, 4); pon(g, 13, 3, AMATISTA, 4); pon(g, 12, 5, AMATISTA, 4);
    destello(g, 17, 1, MG[4]);
    destello(g, 6, 5, MG[3]);
    return g.contorno();
  }
  function arma_cura() {
    const g = nuevo();
    // maza sagrada: mango forrado, cabeza dorada con aletas y una cruz que brilla
    const mango = C().linea(3, 18, 10, 11, 2);
    pieza(g, mango, CUERO, { relieve: 1, min: 1, max: 3 });
    for (const [x, y] of [[4, 16], [6, 14], [8, 12]]) pon(g, x, y, CUERO, 4);
    pieza(g, C().rect(2, 17, 2, 2), B, { relieve: 1, min: 2 });
    const aletas = C().poly([[13, 1], [15, 5], [19, 7], [15, 9], [13, 13], [11, 9], [7, 7], [11, 5]]);
    pieza(g, aletas, B, { relieve: 1.5, min: 1, max: 3 });
    const cabeza = C().ell(13, 7, 3.4, 3.4);
    pieza(g, cabeza, B, { relieve: 2.5 });
    dibujo(g, [" w ", "www", " w "], 12, 6, { w: HU[4] });
    destello(g, 17, 2, HU[4]);
    return g.contorno();
  }
  function armadura() {
    const g = nuevo();
    // peto de acero con hombreras, cinturón y remaches
    const peto = C().poly([[4, 4], [8, 3], [10, 5], [12, 3], [16, 4], [16.5, 10], [15, 17], [10, 18.5], [5, 17], [3.5, 10]]);
    peto.quitarEll(10, 2.6, 2.6, 2);
    pieza(g, peto, PL, { relieve: 4 });
    for (let y = 6; y < 17; y++) { pon(g, 10, y, PL, 4); pon(g, 11, y, PL, 2); }
    const hombro = C().ell(3.5, 5.5, 2.5, 2.2), hombro2 = C().ell(16.5, 5.5, 2.5, 2.2);
    pieza(g, hombro, HI, { relieve: 1.5, min: 1 });
    pieza(g, hombro2, HI, { relieve: 1.5, min: 1 });
    for (let x = 5; x <= 15; x++) { pon(g, x, 13, CUERO, x < 10 ? 3 : 2); pon(g, x, 14, CUERO, 1); }
    pieza(g, C().rect(9, 13, 3, 2), B, { relieve: 1, min: 2, recorte: false });
    for (const [x, y] of [[6, 7], [14, 7], [6, 10], [14, 10]]) pon(g, x, y, B, 3);
    return g.contorno();
  }
  function talisman() {
    const g = nuevo();
    // cadena de eslabones y medallón con una gema
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (0.08 + (k / 12) * 0.84), x = Math.round(10 + Math.cos(a) * 7), y = Math.round(7 - Math.sin(a) * 6);
      g.set(x, y, B[k % 2 ? 2 : 4], B);
    }
    const marco = C().ell(10, 13, 5.4, 5.4).rect(9, 6, 2, 3);
    pieza(g, marco, B, { relieve: 2.5 });
    const gema = C().ell(10, 13, 3, 3);
    pieza(g, gema, ESMERALDA, { relieve: 2.2 });
    pon(g, 9, 12, ESMERALDA, 4); pon(g, 9, 11, ESMERALDA, 4);
    g.set(8, 12, HU[4]);
    for (const [x, y] of [[10, 8.5], [5.5, 13], [14.5, 13], [10, 17.5]]) pon(g, Math.round(x), Math.round(y), B, 4);
    return g.contorno();
  }
  function pocion() {
    const g = nuevo();
    const m = matraz(g, CORAZON);
    pieza(g, C().rect(8, m.tope - 2, 4, 3), CUERO, { relieve: 1, min: 2 });
    pon(g, 8, m.tope - 2, CUERO, 4);
    return g.contorno();
  }
  function superior() {
    const g = nuevo();
    // frasco alto y facetado, con tapón y anilla de oro y un líquido dorado que brilla
    const cuerpo = C().poly([[10, 5], [16, 11], [14, 18], [6, 18], [4, 11]]);
    pieza(g, C().rect(8, 3, 4, 3), VIDRIO, { relieve: 1, min: 2 });
    pieza(g, cuerpo, VIDRIO, { relieve: 3, min: 1, max: 3 });
    const liq = C().poly([[10, 7.5], [14.5, 11.5], [13, 17], [7, 17], [5.5, 11.5]]).quitarRect(0, 0, N, 10);
    liq.pintar(g, AMATISTA, { relieve: 3 });
    for (let x = 0; x < N; x++) if (liq.tiene(x, 10)) pon(g, x, 10, AMATISTA, 4);
    pieza(g, C().rect(7, 5, 6, 1), B, { relieve: 1, min: 3 });
    pieza(g, C().poly([[7, 1], [13, 1], [12, 3], [8, 3]]), B, { relieve: 1, min: 2 });
    pon(g, 8, 1, B, 4);
    for (const [x, y] of [[6, 12], [7, 11], [6, 13]]) pon(g, x, y, VIDRIO, 4);
    destello(g, 16, 4, HU[4]);
    destello(g, 11, 14, AMATISTA[4], 0);
    pon(g, 12, 13, B, 4);
    return g.contorno();
  }
  function bendicion() {
    const g = nuevo();
    // pergamino desplegado con rodillos, renglones y sello de cera
    const hoja = C().rect(4, 4, 12, 12);
    pieza(g, hoja, BL, { relieve: 2, min: 2 });
    for (const y of [6, 8, 10]) for (let x = 6; x < 14; x++) if ((x * 3 + y) % 7 !== 0) pon(g, x, y, BL, 1);
    for (const y of [2.5, 16.5]) {
      const r = C().rect(3, Math.round(y - 1), 14, 2).ell(3, y, 1.4, 1.4).ell(17, y, 1.4, 1.4);
      pieza(g, r, BL, { relieve: 1.2, min: 1, luz: [0, -1, 0.5] });
      pon(g, 3, Math.round(y - 1), BL, 4);
    }
    pieza(g, C().ell(13, 13, 2.6, 2.6), SA, { relieve: 1.5, min: 1 });
    pon(g, 12, 12, SA, 4);
    pieza(g, C().poly([[12, 15], [11, 19], [13, 18], [14, 19], [14, 15]]), GRA, { relieve: 1, min: 2 });
    destello(g, 6, 13, B[4], 0);
    return g.contorno();
  }
  function fuego() {
    const g = nuevo();
    // fuego de alquimista: matraz con líquido ardiente y un trapo encendido en el cuello
    const m = matraz(g, F, { cy: 14, r: 5.5, nivel: 12 });
    pieza(g, C().rect(8, m.tope - 1, 4, 2), GRA, { relieve: 1, min: 2 });
    llama(g, 10, m.tope - 1, 8, 2.6, F, { lenguas: false });
    for (const [x, y] of [[8, 15], [11, 16], [12, 14]]) pon(g, x, y, F, 4);
    return g.contorno();
  }
  function sueno() {
    const g = nuevo();
    // saquito de polvo de sueño con zetas que flotan
    const saco = C().ell(8, 14, 5.5, 4.6).poly([[5, 11], [7, 8], [10, 8], [11, 11]]);
    pieza(g, saco, VI, { relieve: 3 });
    pieza(g, C().ell(8.5, 7, 3, 1.5), VI, { relieve: 1, min: 2 });
    for (let x = 6; x <= 11; x++) pon(g, x, 9, B, x < 9 ? 4 : 2);
    for (const [x, y] of [[11, 6], [13, 8], [12, 4], [15, 10], [5, 6]]) g.set(x, y, AMATISTA[4]);
    dibujo(g, ["zzz", "  z", " z ", "z  ", "zzz"], 13, 1, { z: HU[4] });
    dibujo(g, ["zz", " z", "z ", "zz"], 16, 7, { z: AMATISTA[4] });
    return g.contorno();
  }
  function racion() {
    const g = nuevo();
    // hogaza de pan con cortes y una cuña de queso
    const pan = C().ell(8, 11, 6.5, 4.6).rect(2, 11, 13, 4);
    pieza(g, pan, PAN, { relieve: 3 });
    for (const x of [5, 8, 11]) { pon(g, x, 8, PAN, 1); pon(g, x + 1, 9, PAN, 1); pon(g, x, 9, PAN, 4); }
    const queso = C().poly([[10, 12], [18.5, 9.5], [18.5, 18], [10, 18]]);
    pieza(g, queso, QUESO, { relieve: 2, luz: [-0.4, -0.9, 0.5] });
    for (let x = 11; x <= 18; x++) for (let y = 9; y < 13; y++) if (queso.tiene(x, y) && !queso.tiene(x, y - 1)) pon(g, x, y, QUESO, 4);
    for (const [x, y] of [[13, 15], [16, 13], [17, 16], [12, 17]]) { pon(g, x, y, QUESO, 1); pon(g, x + 1, y, QUESO, 2); }
    return g.contorno();
  }
  function posada() {
    const g = nuevo();
    // cama con cabecero, almohada y manta
    pieza(g, C().rect(2, 5, 3, 14).ell(3.5, 5, 1.5, 1.5), M, { relieve: 1.2 });
    pieza(g, C().rect(4, 11, 14, 4), BL, { relieve: 1.5, min: 2 });
    pieza(g, C().ell(7, 10, 2.8, 1.8), BL, { relieve: 1.5, min: 2 });
    const manta = C().rect(9, 10, 9, 5).ell(9, 12.5, 1, 2.5);
    pieza(g, manta, GRA, { relieve: 2 });
    for (let x = 10; x < 18; x++) pon(g, x, 10, GRA, 4);
    for (let y = 11; y < 15; y++) pon(g, 13, y, GRA, 1);
    pieza(g, C().rect(2, 15, 17, 2), M, { relieve: 1, max: 3 });
    pieza(g, C().rect(16, 9, 3, 8), M, { relieve: 1 });
    pieza(g, C().rect(3, 17, 2, 2).rect(16, 17, 2, 2), M, { plano: 1 });
    return g.contorno();
  }

  /* ---------- Interfaz ---------- */
  function oro() {
    const g = nuevo();
    // dos pilas de monedas y una moneda suelta
    const moneda = (x, y, r = 4.6) => {
      const c = C().ell(x, y + 1, r, 2).ell(x, y, r, 2);
      pieza(g, c, B, { relieve: 1, max: 2, min: 1 });
      const cara = C().ell(x, y, r - 0.4, 1.6);
      cara.pintar(g, B, { relieve: 1.5, min: 3 });
      pon(g, Math.round(x - r + 1), y, B, 4);
    };
    for (let k = 0; k < 4; k++) moneda(7, 16 - k * 3);
    for (let k = 0; k < 2; k++) moneda(14, 16 - k * 3, 4);
    pieza(g, C().ell(15, 6, 3.2, 3.2), B, { relieve: 2 });
    pon(g, 15, 5, B, 4); pon(g, 14, 6, B, 4); pon(g, 16, 7, B, 2);
    destello(g, 3, 3, HU[4]);
    return g.contorno();
  }
  function pm() {
    const g = nuevo();
    // cristal de maná: facetas claras a la izquierda
    const c = C().poly([[10, 0.5], [15.5, 6], [14.5, 15], [10, 19.5], [5.5, 15], [4.5, 6]]);
    pieza(g, c, MANA, { relieve: 3 });
    for (let y = 1; y < 19; y++) for (let x = 0; x < N; x++) {
      if (!c.tiene(x, y)) continue;
      if (x < 10) matiz(g, x, y, x < 8 ? 1 : 0); else if (x > 10) matiz(g, x, y, -1);
    }
    for (let y = 3; y < 17; y++) pon(g, 10, y, MANA, 4);
    for (const [x, y] of [[7, 6], [7, 7], [6, 8]]) g.set(x, y, HU[4]);
    destello(g, 16, 2, MANA[4]);
    return g.contorno();
  }
  function pg() {
    const g = nuevo();
    const c = C().ell(6.2, 7, 4.4, 4.2).ell(13.8, 7, 4.4, 4.2).poly([[2, 8], [18, 8], [10, 17.5]]);
    pieza(g, c, CORAZON, { relieve: 4 });
    pon(g, 4, 5, CORAZON, 4); pon(g, 5, 4, CORAZON, 4); pon(g, 4, 6, CORAZON, 4);
    g.set(5, 5, HU[4]);
    return g.contorno();
  }
  function xp() {
    const g = nuevo();
    const pts = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 3.9 : 9.2; pts.push([9.5 + Math.cos(a) * r, 10.3 + Math.sin(a) * r]); }
    const c = C().poly(pts);
    pieza(g, c, RAYO, { relieve: 2.5 });
    // facetas: mitad iluminada de cada punta
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!c.tiene(x, y)) continue;
      const a = Math.atan2(y - 10.3, x - 9.5), d = Math.hypot(x - 9.5, y - 10.3), sector = ((a + Math.PI / 2) / (Math.PI * 2 / 5) % 1 + 1) % 1;
      if (d > 1.5) matiz(g, x, y, sector < 0.5 ? (x + y < 20 ? 1 : 0) : -1);
    }
    g.set(9, 3, HU[4]).set(9, 9, HU[4]);
    return g.contorno();
  }
  function runa() {
    const g = nuevo();
    // piedra rúnica con un signo grabado que brilla
    const c = C().ell(10, 10.5, 7, 8.2).quitarRect(0, 18, N, 2).rect(4, 17, 12, 1);
    pieza(g, c, P, { relieve: 3.5 });
    for (const [x, y] of [[5, 7], [14, 13], [7, 15]]) matiz(g, x, y, -1);
    const signo = [" g  ", " gg ", " g g", " gg ", " g  ", "gg  ", " g  "];
    dibujo(g, signo, 9, 7, { g: [ESPECTRO, 2] });
    dibujo(g, signo, 8, 6, { g: [ESPECTRO, 4] });
    for (const [x, y] of [[8, 5], [12, 9], [7, 12]]) g.set(x, y, ESPECTRO[3], ESPECTRO);
    return g.contorno();
  }
  function mochila() {
    const g = nuevo();
    // macuto de cuero redondeado, con petate enrollado encima, correas y hebillas
    const cuerpo = C().rect(4, 8, 12, 10).ell(10, 8, 6, 3).ell(10, 17, 6, 1.6);
    pieza(g, cuerpo, CUERO, { relieve: 3.5 });
    const petate = C().rect(5, 2, 10, 4).ell(5, 4, 1.6, 2).ell(15, 4, 1.6, 2);
    pieza(g, petate, GRA, { relieve: 1.5, luz: [0, -1, 0.5] });
    pon(g, 4, 4, GRA, 2); pon(g, 15, 3, GRA, 3);
    const solapa = C().rect(5, 7, 10, 4).ell(10, 11, 5, 2);
    pieza(g, solapa, CUERO, { relieve: 2, min: 2 });
    for (const x of [7, 12]) for (let y = 2; y < 17; y++) if (g.get(x, y) && !(y > 6 && y < 13 && x === 12 && false)) pon(g, x, y, y < 7 ? CUERO : CUERO, y < 7 ? 1 : 1);
    for (const x of [7, 12]) { pieza(g, C().rect(x, 12, 1, 2), B, { plano: 3, recorte: false }); pon(g, x, 12, B, 4); }
    const bolsillo = C().rect(6, 14, 8, 3);
    pieza(g, bolsillo, CUERO, { relieve: 1.2, max: 3 });
    pon(g, 6, 14, CUERO, 4); pon(g, 5, 8, CUERO, 4); pon(g, 6, 7, CUERO, 4);
    return g.contorno();
  }

  function comida() {
    const g = nuevo();
    // muslo asado con su hueso
    const hueso = C().linea(4, 16, 8, 12, 2);
    pieza(g, hueso, HU, { relieve: 1, min: 2 });
    pieza(g, C().ell(2.8, 16, 1.5, 1.5).ell(4, 17.4, 1.5, 1.5), HU, { relieve: 1, min: 2 });
    const carne = C().ell(12, 8, 6, 5.6).ell(8.5, 11.5, 3, 2.5);
    pieza(g, carne, CARNE, { relieve: 3.5 });
    for (const [x, y] of [[9, 5], [10, 4], [8, 6]]) pon(g, x, y, CARNE, 4);
    for (const [x, y] of [[14, 10], [15, 8], [12, 12]]) pon(g, x, y, CARNE, 1);
    return g.contorno();
  }

  /* ---------- Tipos de daño ---------- */
  function fisica() {
    const g = nuevo();
    // puño cerrado visto de frente: cuatro dedos, el pulgar cruzado delante y el guante en la muñeca
    const PIEL = R.piel.clara;
    const dorso = C().rect(4, 8, 12, 6).ell(10, 13, 6, 2.5);
    pieza(g, dorso, PIEL, { relieve: 3, max: 3 });
    for (let k = 0; k < 4; k++) {
      const x = 4 + k * 3, top = k === 1 ? 3 : k === 0 ? 5 : 4;
      const dedo = C().rect(x, top + 1, 3, 9 - top).ell(x + 1, top + 1.2, 1.3, 1.2);
      pieza(g, dedo, PIEL, { relieve: 1.6, luz: [-0.6, -0.7, 0.5] });
      pon(g, x, top + 1, PIEL, 4);
      pon(g, x + 2, 8, PIEL, 1);
    }
    for (let x = 4; x < 16; x++) if (g.rampa(x, 8) === PIEL) pon(g, x, 8, PIEL, x % 3 === 0 ? 1 : 2);
    const pulgar = C().rect(4, 10, 8, 3).ell(11.5, 11.5, 1.6, 1.5);
    pieza(g, pulgar, PIEL, { relieve: 1.5, luz: [-0.3, -0.9, 0.5] });
    for (let x = 5; x < 12; x++) pon(g, x, 10, PIEL, 4);
    const guante = C().rect(6, 15, 9, 4);
    pieza(g, guante, CUERO, { relieve: 1.2, max: 3 });
    for (let x = 6; x < 15; x++) pon(g, x, 15, B, x < 10 ? 4 : 2);
    // líneas de impacto
    for (const [x0, y0, x1, y1] of [[1, 2, 3, 4], [18, 1, 16, 3], [18, 6, 17, 6], [1, 7, 2, 7]]) {
      const c = C().linea(x0, y0, x1, y1, 1);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (c.tiene(x, y)) g.set(x, y, HU[4]);
    }
    return g.contorno();
  }

  function arcana() {
    const g = nuevo();
    // estrella arcana de cuatro puntas dentro de un anillo
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const x = Math.round(9.5 + Math.cos(a) * 8), y = Math.round(9.5 + Math.sin(a) * 4.2);
      if (!g.get(x, y)) g.set(x, y, MG[Math.sin(a) < 0 ? 2 : 3], MG);
    }
    const est = C().poly([[9.5, 0.5], [11.5, 7.5], [18.5, 9.5], [11.5, 11.5], [9.5, 18.5], [7.5, 11.5], [0.5, 9.5], [7.5, 7.5]]);
    pieza(g, est, MG, { relieve: 2.5, min: 1 });
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (est.tiene(x, y) && ((x < 10 && y < 10) || (x < 10 && y === 9) || (y < 10 && x === 9))) matiz(g, x, y, 1);
    // el anillo pasa por delante en la mitad de abajo
    for (let a = 0.2; a < Math.PI - 0.2; a += 0.05) {
      const x = Math.round(9.5 + Math.cos(a) * 8), y = Math.round(9.5 + Math.sin(a) * 4.2);
      g.set(x, y, MG[4], MG);
    }
    g.set(9, 9, HU[4]).set(10, 9, MG[4]).set(9, 10, MG[4]);
    return g.contorno();
  }
  function sagrada() {
    const g = nuevo();
    // sol sagrado: rayos dorados alrededor de un disco blanco con una cruz
    const rayos = C();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, l = k % 2 ? 7.2 : 9.3, w = 0.36;
      rayos.poly([[9.5 + Math.cos(a - w) * 4, 9.5 + Math.sin(a - w) * 4], [9.5 + Math.cos(a) * l, 9.5 + Math.sin(a) * l], [9.5 + Math.cos(a + w) * 4, 9.5 + Math.sin(a + w) * 4]]);
    }
    pieza(g, rayos, RAYO, { relieve: 1.2, min: 2 });
    pieza(g, C().ell(9.5, 9.5, 5, 5), RAYO, { relieve: 2.5, min: 2 });
    pieza(g, C().ell(9.5, 9.5, 3.2, 3.2), BL, { relieve: 2, min: 3, recorte: false });
    dibujo(g, [" b ", "bbb", " b "], 8, 8, { b: [RAYO, 2] });
    g.set(8, 7, HU[4]);
    return g.contorno();
  }

  /* ---------- Estados ---------- */
  function gota(g, cx, cy, r, ram, op = {}) {
    const c = C().ell(cx, cy, r, r).poly([[cx - r * 0.72, cy - r * 0.62], [cx, cy - r * 2.25], [cx + r * 0.72, cy - r * 0.62]]);
    pieza(g, c, ram, { relieve: Math.max(1.5, r * 0.7) });
    pon(g, Math.round(cx - r * 0.5), Math.round(cy - r * 0.4), ram, 4);
    if (r > 3) pon(g, Math.round(cx - r * 0.5), Math.round(cy - r * 0.4) + 1, ram, 4).set(Math.round(cx - r * 0.5) + 1, Math.round(cy - r * 0.4) - 1, ram[4], ram);
    return c;
  }
  function veneno() {
    const g = nuevo();
    gota(g, 10, 13, 5.6, VENENO);
    // calavera pequeña dentro de la gota
    dibujo(g, [" sss ", "s.s.s", "sssss", " s s "], 8, 11, { s: [VENENO, 4], ".": [VENENO, 0] });
    for (const [x, y, r] of [[3.5, 5, 1.6], [16, 3.5, 1.2]]) { pieza(g, C().ell(x, y, r, r), VENENO, { relieve: 1, min: 2 }); g.set(Math.round(x - 0.5), Math.round(y - 0.5), VENENO[4]); }
    return g.contorno();
  }

  function quemadura() {
    const g = nuevo();
    llama(g, 9.5, 18.5, 18, 6.2);
    return g.contorno();
  }
  function sangrado() {
    const g = nuevo();
    gota(g, 8, 12.5, 5.2, SA);
    gota(g, 15.5, 15.5, 2.6, SA);
    gota(g, 15, 5.5, 1.8, SA);
    return g.contorno();
  }
  function paralisis() {
    const g = nuevo();
    const c = C().poly([[11, 0.5], [16, 0.5], [12, 7.5], [16, 7.5], [6, 19.5], [9, 11], [5, 11]]);
    pieza(g, c, RAYO, { relieve: 1.8, luz: [-0.7, -0.6, 0.5] });
    for (const [x, y] of [[12, 1], [11, 2], [10, 4], [9, 6], [7, 9]]) pon(g, x, y, RAYO, 4);
    for (const [x, y] of [[2, 5], [18, 12], [3, 15]]) destello(g, x, y, RAYO[4], 0);
    g.set(1, 5, RAYO[3]).set(3, 5, RAYO[3]).set(17, 12, RAYO[3]);
    return g.contorno();
  }
  function congelado() {
    const g = nuevo();
    // copo de nieve de seis brazos con ramitas
    const c = C();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 2, ex = 9.5 + Math.cos(a) * 8.6, ey = 9.5 + Math.sin(a) * 8.6;
      c.linea(9.5, 9.5, ex, ey, 1);
      for (const f of [0.55, 0.8]) {
        const bx = 9.5 + Math.cos(a) * 8.6 * f, by = 9.5 + Math.sin(a) * 8.6 * f, l = f > 0.7 ? 1.8 : 2.6;
        c.linea(bx, by, bx + Math.cos(a + 0.9) * l, by + Math.sin(a + 0.9) * l, 1).linea(bx, by, bx + Math.cos(a - 0.9) * l, by + Math.sin(a - 0.9) * l, 1);
      }
    }
    c.ell(9.5, 9.5, 2.2, 2.2);
    pieza(g, c, HIELO, { relieve: 1, min: 2 });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (c.tiene(x, y) && x + y < 19) matiz(g, x, y, 1);
    g.set(9, 9, HU[4]);
    return g.contorno();
  }
  function debil() {
    const g = nuevo();
    // espada partida de hierro mate, la punta caída a un lado, y una flecha que baja
    espada(g, 10, 6, 7, -1, { hoja: HI, guarda: HI, pomo: HI, puno: CUERO });
    for (const [x, y, k] of [[10, 6, 3], [11, 6, 1], [11, 5, 2], [9, 6, 0]]) g.set(x, y, HI[k], HI);
    const punta = C().poly([[12, 2], [14, 0.5], [18.5, 1], [15, 3.5], [13, 4]]);
    pieza(g, punta, HI, { relieve: 1, min: 1 });
    pon(g, 14, 1, HI, 4); pon(g, 15, 1, HI, 4);
    const flecha = C().rect(15, 8, 3, 5).poly([[12.5, 12.5], [19.5, 12.5], [16, 17]]);
    pieza(g, flecha, SA, { relieve: 1.5, min: 1 });
    pon(g, 15, 8, SA, 4); pon(g, 15, 9, SA, 4); pon(g, 14, 13, SA, 4);
    return g.contorno();
  }

  function maldito() {
    const g = nuevo();
    // calavera violeta con ojos verdes y humo que sube
    for (const [x, y] of [[4, 4], [3, 2], [4, 1], [15, 3], [16, 1], [15, 0]]) g.set(x, y, AMATISTA[3], AMATISTA);
    g.set(5, 3, AMATISTA[2]).set(14, 2, AMATISTA[2]);
    craneo(g, AMATISTA, VENENO[4]);
    g.set(6, 9, VENENO[3]).set(13, 9, VENENO[3]);
    return g.contorno();
  }
  function ciego() {
    const g = nuevo();
    // ojo almendrado tapado por una venda de lino en diagonal
    const ojo = C().poly([[1.5, 10], [5, 5.5], [10, 4], [15, 5.5], [18.5, 10], [15, 14.5], [10, 16], [5, 14.5]]);
    pieza(g, ojo, BL, { relieve: 2.5, min: 2 });
    pieza(g, C().ell(10, 10, 4, 4), AZ, { relieve: 2.5, recorte: false });
    pieza(g, C().ell(10, 10, 1.8, 1.8), NE, { plano: 0, recorte: false });
    g.set(8, 8, HU[4]).set(9, 8, HU[4]);
    for (let x = 4; x < 16; x++) { const y = Math.round(10 - Math.sqrt(Math.max(0, 1 - ((x - 10) / 8.5) ** 2)) * 5.5); if (g.get(x, y)) g.set(x, y, CONTORNO); }
    const venda = C().linea(1, 13, 18, 4, 2);
    pieza(g, venda, HU, { relieve: 1, min: 1, max: 3, luz: [-0.3, -0.9, 0.5] });
    for (let x = 1; x < 19; x++) { const y = Math.round(13 - (x - 1) * (9 / 17)); if (venda.tiene(x, y)) pon(g, x, y, HU, 4); }
    for (const [x, y] of [[6, 10], [12, 7]]) { pon(g, x, y, HU, 1); pon(g, x, y + 1, HU, 1); }
    const nudo = C().poly([[16, 3], [19, 1], [18.5, 4.5]]).poly([[16, 5], [19, 7], [17, 8]]);
    pieza(g, nudo, HU, { relieve: 1, min: 1, max: 3 });
    return g.contorno();
  }

  function regen() {
    const g = nuevo();
    // cruz verde que sana, con una hoja y chispas
    const cruz = C().rect(7, 2, 6, 16).rect(2, 7, 16, 6);
    pieza(g, cruz, VERDE, { relieve: 2.5 });
    for (let y = 3; y < 17; y++) pon(g, 8, y, VERDE, 4);
    for (let x = 3; x < 17; x++) if (!(x >= 7 && x <= 12)) pon(g, x, 8, VERDE, 4);
    const hoja = C().ell(15.5, 15.5, 3, 2).poly([[13, 17.5], [12, 19], [14, 18]]);
    pieza(g, hoja, ESMERALDA, { relieve: 1.5, min: 1 });
    for (const [x, y] of [[14, 16], [15, 15], [16, 14]]) pon(g, x, y, ESMERALDA, 1);
    destello(g, 3, 3, VERDE[4]);
    destello(g, 16, 3, HU[4], 0);
    return g.contorno();
  }

  window.ICONOS_HD = window.ICONOS_HD || {};
  Object.assign(window.ICONOS_HD, {
    // nodos del mapa
    combate, elite, evento, misterio, tesoro, tienda, hoguera, altar, jefe, huellas, inicio,
    // categorías de objeto
    arma_fisica, arma_magica, arma_cura, armadura, talisman, pocion, superior, bendicion, fuego, sueno, racion, posada,
    // interfaz
    oro, pm, pg, xp, runa, mochila, comida,
    // tipos de daño
    fisica, arcana, sagrada,
    // estados
    veneno, quemadura, sangrado, paralisis, congelado, debil, maldito, ciego, regen
  });
})();
