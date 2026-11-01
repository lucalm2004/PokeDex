/* Dados y Mazmorras · jefes a 96×96.
   El trol del puente, Malakar el liche, Lord Varkhul, Ignárax y Nhazgul. Cada función devuelve una Rejilla NUEVA
   de 96×96 con contorno, mirando a la izquierda (hacia los héroes) y con los pies en la fila 94 (la 95 solo contorno).
   Misma identidad que los de 80×80 (jefes_hd.js), con más tamaño y acabado: luz desde arriba a la izquierda,
   rampas de 5 tonos con sombras frías y luces cálidas, contorno selectivo y texturas por material. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral } = PX;
  const W = 96, H = 96, SUELO = 94;
  const NEGRO = R.pelo.negro, HUESO = R.hueso, ORO = R.bronce;

  /* ---------- Rampas propias (5 tonos, de la sombra al brillo) ---------- */
  const TROL = ["#16202a", "#2a3f38", "#476544", "#76924f", "#b3c47c"];        // piel del trol: sombra pizarra, luz de liquen
  const TROL_V = ["#2a2c2e", "#4b5244", "#747a57", "#a2a173", "#d2cca0"];      // barriga y palmas
  const MUSGO = ["#0e1916", "#1c3222", "#33532b", "#5a8036", "#97b452"];       // pelambre de musgo
  const UNA = ["#0e0b10", "#211a1c", "#3a2e2a", "#5e4c40", "#8c7660"];         // uñas y garras de cuerno
  const CUERO = ["#1e1010", "#3a2016", "#5e3820", "#8a5830", "#b88050"];       // taparrabos
  const PALIDO = ["#3c3a50", "#6c6a86", "#a29fba", "#d4d1e2", "#f7f5fc"];      // piel del vampiro
  const NOCHE = ["#06060c", "#10101c", "#1c1b2e", "#2e2c48", "#4c4a6e"];       // paño negro azulado
  const AZABACHE = ["#040409", "#0d0c16", "#1b1a2c", "#35324e", "#5e5a80"];    // pelo engominado
  const CARMIN = ["#2a0612", "#540e1a", "#8c1a22", "#c4342c", "#ec6a4a"];      // forro de la capa: sombra vino, luz coral
  const VIOLETA = ["#10081a", "#241334", "#402056", "#683a80", "#9a62ac"];     // túnica del liche
  const VERDE = ["#082418", "#12582e", "#22a04a", "#5ee07a", "#d4ffd8"];       // fuego fatuo
  const HUESO_L = ["#4a4450", "#837a7a", "#bdb29e", "#e6dcc6", "#fff8e8"];     // hueso del liche, sombra fría
  const MEMBRANA = ["#1c0614", "#3c0c1c", "#661a22", "#962e28", "#c44c34"];    // piel de las alas
  const ESCAMA = ["#2a0818", "#5c1020", "#9c1c1e", "#d8402a", "#ff8a52"];      // escamas de Ignárax, rojo vivo
  const VIENTRE = ["#3a1c10", "#7a4a18", "#c08a2c", "#ecc458", "#fff0a8"];     // placas del vientre
  const CUERNO = ["#26201e", "#4e4440", "#867a6c", "#c4b8a0", "#f4ecd8"];      // cuernos y púas
  const VACIO = ["#040208", "#0b0618", "#170c30", "#2a164e", "#44267a"];       // cuerpo de Nhazgul
  const CIAN = ["#06222c", "#0c4a58", "#188a94", "#46cac8", "#bafff2"];        // su ojo y sus brillos
  const AURA = ["#2a0e3a", "#5a1e74", "#9a3cc0", "#d27aef", "#ffd6ff"];        // filo de luz magenta del devorador

  /* ---------- Herramientas ---------- */
  const C = () => new Capa(W, H);
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Recorre los píxeles de una capa. */
  const cada = (capa, f) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (capa.m[y * W + x]) f(x, y); };
  /* Pinta una capa solo donde no hay nada todavía, como si quedara detrás. */
  function detras(g, capa, ram, op) {
    cada(capa.copia(), (x, y) => { if (g.get(x, y)) capa.off(x, y); });
    return sombrear(capa, g, ram, op);
  }
  /* Baja (o sube, con n negativo) el tono de lo ya pintado dentro de una capa: sombras arrojadas y reflejos. */
  function tono(g, capa, n, soloRam = null, tramado = 1) {
    cada(capa, (x, y) => {
      if (!g.get(x, y)) return;
      const ram = g.rampa(x, y);
      if (!ram || (soloRam && ram !== soloRam)) return;
      if (tramado < 1 && umbral(x, y) >= tramado) return;
      const i = ram.indexOf(g.get(x, y));
      if (i < 0) return;
      g.set(x, y, ram[Math.max(0, Math.min(ram.length - 1, i - n))], ram);
    });
  }
  /* Destello de cuatro puntas, sin contorno. */
  function destello(g, x, y, ram = ORO, largo = 1) {
    pon(g, ram, 4, [x, y]);
    for (let k = 1; k <= largo; k++)
      for (const [a, b] of [[k, 0], [-k, 0], [0, k], [0, -k]])
        if (!g.get(x + a, y + b)) pon(g, ram, k === largo && largo > 1 ? 2 : 3, [x + a, y + b]);
  }
  /* Borde iluminado arriba a la izquierda, para que lo oscuro se lea sobre fondos oscuros. */
  function bordeLuz(g, ram, t = 3, destino = ram, f = () => true) {
    const borde = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < t && f(x, y)) borde.push([x, y]);
    pon(g, destino, t, ...borde);
  }
  /* Luz de rebote por el lado de la sombra (derecha y abajo): separa lo oscuro del fondo oscuro. */
  function bordeReflejo(g, ram, t = 2, destino = ram, f = () => true, abajo = false) {
    const borde = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && ((!g.get(x + 1, y) && g.get(x - 1, y)) || (abajo && !g.get(x, y + 1) && g.get(x, y - 1))) && f(x, y)) borde.push([x, y]);
    pon(g, destino, t, ...borde);
  }
  /* Línea de pliegue o de músculo de un tono fijo, recortada a una capa. */
  function trazo(g, capa, ram, i, ...lineas) {
    const c = C();
    for (const l of lineas) l.length === 4 ? c.linea(...l, 1) : c.curva(...l, 1);
    if (capa) c.recortar(capa);
    c.pintar(g, ram, { plano: i });
  }
  /* Punto de una curva cuadrática. */
  const bez = (x0, y0, cx, cy, x1, y1, t) => { const u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; };
  /* Como Capa.pintar, pero con el tono continuo y un tramado estrecho entre bandas, para volúmenes grandes.
     op.caida oscurece hacia abajo (luz cenital); op.volumen añade un degradado de esfera desde arriba a la izquierda;
     op.tramado = anchura del tramado (0 = bandas limpias); op.extra(x, y) suma luz a mano (pliegues, ondas). */
  const DIST = new Float32Array(W * H);
  function sombrear(capa, g, ram, op = {}) {
    const w = W, h = H, Rr = op.relieve || 6, m = capa.m;
    /* Solo se trabaja dentro de la caja de la capa: las piezas pequeñas (púas, dedos) salen casi gratis. */
    let y0 = h, y1 = -1, x0 = w, x1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    if (y1 < 0) return g;
    const d = DIST;
    for (let y = Math.max(0, y0 - 1); y <= Math.min(h - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(w - 1, x1 + 1); x++) d[y * w + x] = m[y * w + x] ? 1e6 : 0;
    const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
    }
    for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
    }
    const alto = (x, y) => { const v0 = D(x, y); if (!v0) return 0; const v = Math.min(v0, Rr) / Rr; return Math.sqrt(1 - (1 - v) * (1 - v)); };
    const L = op.luz || [-0.5, -0.62, 0.6], ln = Math.hypot(...L), k = op.fuerza || 2.4;
    const cx = op.centro ? op.centro[0] : (x0 + x1) / 2, cy = op.centro ? op.centro[1] : (y0 + y1) / 2;
    const rx = Math.max(1, (x1 - x0) / 2), ry = Math.max(1, (y1 - y0) / 2), vol = op.volumen || 0;
    const TH = [-0.4, 0.02, 0.4, 0.74, 0.965, 1.2], s = op.tramado === undefined ? 0.4 : op.tramado;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!m[y * w + x]) continue;
      const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k, ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
      const l = (nx * L[0] + ny * L[1] + L[2]) / ln / Math.sqrt(nx * nx + ny * ny + 1) + (op.sesgo || 0) - (op.caida || 0) * (y - y0) / Math.max(1, y1 - y0)
        - vol * (((x - cx) / rx) * 0.55 + ((y - cy) / ry) * 0.75) + (op.extra ? op.extra(x, y) : 0);
      let v = 0;
      for (let b = 0; b < 5; b++) if (l > TH[b]) v = b + Math.min(1, (l - TH[b]) / (TH[b + 1] - TH[b]));
      let t = Math.floor(v + (umbral(x, y) - 0.5) * s);
      t = Math.max(op.min || 0, Math.min(op.max === undefined ? 4 : op.max, t));
      if (op.separar) {
        const borde = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !capa.tiene(x + a, y + b) && g.get(x + a, y + b));
        if (borde) t = Math.min(t, op.separar === true ? 1 : op.separar);
      }
      g.set(x, y, ram[t], ram);
    }
    return g;
  }
  /* Garras, colmillos y púas: triángulos de la base a la punta, con su arista de luz. */
  function pua(g, ram, x0, y0, x1, y1, ancho = 1.2, op = { relieve: 1, min: 2 }, brillo = true) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * ancho, ny = dx / l * ancho;
    const c = C().poly([[x0 + nx, y0 + ny], [x1, y1], [x0 - nx, y0 - ny]]);
    if (c.vacia()) c.linea(x0, y0, x1, y1, 1);
    sombrear(c, g, ram, { tramado: 0, ...op });
    if (brillo && l > 3) {
      /* Arista iluminada por el lado de arriba a la izquierda. */
      const lado = (nx + ny) < 0 ? 1 : -1;
      for (let s = 0.15; s < 0.75; s += 1 / l) {
        const x = Math.round(x0 + dx * s + nx * 0.45 * lado), y = Math.round(y0 + dy * s + ny * 0.45 * lado);
        if (c.tiene(x, y)) pon(g, ram, 4, [x, y]);
      }
    }
    return c;
  }
  /* Antialias manual: en las esquinas de la silueta pone un tono intermedio del propio color. */
  function suavizar(g, ram, f = () => true) {
    const cambios = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (g.rampa(x, y) !== ram || !f(x, y)) continue;
      const vac = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => !g.get(x + a, y + b)).length;
      if (vac < 2) continue;
      const i = ram.indexOf(g.get(x, y));
      if (i > 1) cambios.push([x, y, i - 1]);
    }
    for (const [x, y, i] of cambios) pon(g, ram, i, [x, y]);
  }
  /* Contorno selectivo: oscuro en el lado de la sombra; en el lado iluminado, la sombra del color vecino.
     «claro» = tono de la rampa vecina para el contorno iluminado (0 = el más oscuro); «ramOscuro», la rampa
     del color oscuro cuando no es el contorno general. */
  function contornear(g, oscuro = PX.CONTORNO, claro = 0, ramOscuro = null) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      let col = oscuro, ram = ramOscuro;
      if (!iz && !ar) {
        ram = ab ? g.rampa(x, y + 1) : g.rampa(x + 1, y);
        if (ram) col = ram[claro];
      }
      nuevos.push([x, y, col, ram]);
    }
    for (const [x, y, col, ram] of nuevos) g.set(x, y, col, ram);
    return g;
  }
  /* Escamas: medias lunas oscuras en tresbolillo, con un brillo encima en la parte iluminada. */
  function escamas(g, capa, ram, paso = 4, alto = 3, desde = 1, fase = 0) {
    for (let j = 0; j * alto < H; j++) for (let i = -1; i * paso < W; i++) {
      const x = i * paso + (j % 2 ? paso / 2 : 0) + fase, y = j * alto;
      if (!capa.tiene(x, y) || !capa.tiene(x - 1, y) || !capa.tiene(x + 1, y + 1) || g.rampa(x, y) !== ram) continue;
      const k = ram.indexOf(g.get(x, y));
      if (k < desde) continue;
      pon(g, ram, Math.max(0, k - 1), [x - 1, y], [x, y + 1], [x + 1, y]);
      if (paso >= 5) pon(g, ram, Math.max(0, k - 1), [x - 2, y - 1], [x + 2, y - 1]);
      if (k >= 2 && capa.tiene(x, y - 1)) pon(g, ram, Math.min(4, k + 1), [x, y - 1]);
    }
  }

  /* =====================================================================
     El trol del puente: una mole jorobada con una porra de tronco alzada.
     ===================================================================== */
  function trol() {
    const g = new Rejilla(W, H), P = TROL, V = TROL_V, M = R.madera, F = R.hierro, Mu = MUSGO, Cu = CUERO;

    /* La porra: un tronco nudoso con aros de hierro y clavos, alzada por encima de la cabeza. */
    const porra = C().curva(85, 22, 66, 9, 42, 8, 5, 14).ell(40, 8, 7.2, 6.6);
    sombrear(porra, g, M, { relieve: 6, volumen: 0.35, tramado: 0.2 });
    /* Vetas de la corteza a lo largo del tronco. */
    for (const [x0, y0, x1, y1] of [[46, 4, 58, 6], [44, 11, 60, 12], [52, 8, 66, 10], [62, 13, 74, 16], [36, 6, 41, 3], [35, 10, 43, 13], [66, 9, 76, 12], [48, 14, 56, 15]])
      trazo(g, porra, M, 1, [x0, y0, x1, y1]);
    for (const [x0, y0, x1, y1] of [[45, 3, 55, 4], [60, 7, 70, 9], [34, 4, 38, 2]]) trazo(g, porra, M, 4, [x0, y0, x1, y1]);
    /* Un nudo de la madera. */
    new Capa(W, H).ell(57, 9.5, 2.2, 1.5).pintar(g, M, { plano: 1 });
    pon(g, M, 0, [57, 10], [58, 10]); pon(g, M, 3, [56, 8], [57, 8]);
    for (const ax of [49, 64]) {
      const aro = C().linea(ax - 1.8, -2, ax + 1.8, 20, 3).recortar(porra);
      sombrear(aro, g, F, { relieve: 1.2, min: 1, tramado: 0 });
      cada(aro, (x, y) => { if (!aro.tiene(x + 1, y)) pon(g, F, 0, [x, y]); });
      for (let y = 0; y < 20; y += 5) { const x = Math.round(ax - 1.6 + y * 0.18); if (aro.tiene(x, y)) pon(g, F, 4, [x, y]); }
    }
    /* Clavos que asoman de la cabeza de la porra. */
    for (const [x, y, a, b] of [[36, 3, -3, -4], [33, 7, -5, -1], [34, 11, -4, 3], [41, 2, 0, -5], [40, 14, -1, 4], [46, 3, 1, -4], [45, 13, 1, 4]])
      pua(g, F, x, y, x + a, y + b, 1.4, { relieve: 1, min: 1 });
    pon(g, F, 4, [34, 7], [39, 2], [41, 4]);

    /* Brazo de atrás, alzado: del hombro al codo, que asoma por la derecha, y la mano en el mango. */
    const brazoAtras = C().curva(62, 31, 78, 27, 85, 38, 13, 10).curva(85, 38, 89, 29, 80, 20, 10, 8);
    sombrear(brazoAtras, g, P, { relieve: 6, caida: 0.3, max: 3 });
    trazo(g, brazoAtras, P, 1, [75, 33, 80, 36, 82, 42], [84, 30, 86, 26]);
    trazo(g, brazoAtras, P, 3, [66, 28, 74, 26, 80, 29]);
    const manoAtras = C().ell(78, 18, 5.6, 5).ell(74, 16.5, 3, 3.2);
    sombrear(manoAtras, g, P, { relieve: 3, max: 3, separar: true });
    for (const j of [14.5, 17.5, 20.5]) trazo(g, manoAtras, P, 1, [73, j, 77, j + 0.5]);
    pon(g, P, 4, [73, 13], [75, 12], [76, 13]);
    pua(g, UNA, 72, 14, 70, 13, 0.8, { relieve: 1, min: 1 }, false);
    pua(g, UNA, 72, 20, 70, 20, 0.8, { relieve: 1, min: 1 }, false);

    /* Pierna de atrás. */
    const piernaAtras = C().curva(58, 64, 68, 74, 66, 86, 14, 11).rect(58, 87, 17, 8).ell(66, 90, 8.5, 4.6);
    sombrear(piernaAtras, g, P, { relieve: 6, max: 2, caida: 0.45 });
    trazo(g, piernaAtras, P, 0, [64, 80, 68, 84, 67, 88]);
    for (const x of [59, 64, 69]) pua(g, UNA, x + 1, 92, x - 2, 94.5, 1.3, { relieve: 1, min: 2 });

    /* El cuerpo: joroba enorme, hombros caídos y barriga. */
    const cuerpo = C().ell(52, 37, 20, 18).ell(60, 29, 12, 11).ell(48, 55, 18, 14).ell(38, 34, 11, 10);
    sombrear(cuerpo, g, P, { relieve: 12, volumen: 0.45, caida: 0.2, separar: true });
    const barriga = C().ell(44, 57, 13, 11.5).recortar(cuerpo);
    sombrear(barriga, g, V, { relieve: 8, volumen: 0.45, caida: 0.25 });
    tono(g, C().ell(51, 68, 17, 3.5), 1, V);
    trazo(g, barriga, V, 1, [35, 51, 43, 54, 52, 52], [36, 60, 43, 62.5, 51, 61]);
    pon(g, V, 0, [43, 57], [44, 58], [43, 58]); pon(g, V, 3, [42, 56]);
    /* Pectoral, joroba y costillas marcados. */
    trazo(g, cuerpo, P, 1, [36, 40, 45, 46, 55, 41], [56, 19, 65, 21, 70, 31], [60, 42, 63, 48, 61, 54]);
    trazo(g, cuerpo, P, 3, [55, 18, 62, 19, 67, 25], [38, 39, 45, 43, 52, 40]);
    for (const y of [44, 48, 52]) trazo(g, cuerpo, P, 1, [62, y, 66, y + 1.5, 68, y + 4]);
    /* Pliegues de la piel en la joroba y el costado. */
    trazo(g, cuerpo, P, 1, [44, 26, 50, 24, 56, 26], [47, 31, 53, 29, 58, 31], [70, 44, 72, 50, 70, 56], [33, 47, 37, 52, 36, 58]);
    trazo(g, cuerpo, P, 4, [44, 25, 50, 23]);
    /* Cicatriz en el hombro. */
    trazo(g, cuerpo, P, 0, [64, 30, 69, 36]); trazo(g, cuerpo, P, 4, [63, 30, 68, 36]);
    for (const [i, j] of [[64, 32], [66, 34]]) pon(g, P, 3, [i + 1, j - 1]);
    /* Pelambre de musgo por el lomo: mechones que caen hacia atrás. */
    const crin = C();
    for (let i = 0; i < 9; i++) {
      const x = 37 + i * 3.6, y = 22 + Math.abs(i - 4) * 0.9;
      crin.curva(x, y + 5, x + 1, y - 2, x + 6, y - 3 - (i % 2) * 2.5, 3.6, 1);
    }
    crin.curva(70, 26, 74, 30, 74, 36, 3, 1).curva(68, 30, 72, 36, 71, 41, 2.5, 1);
    sombrear(crin, g, Mu, { relieve: 1.6, max: 4, separar: true, tramado: 0 });
    for (let i = 0; i < 9; i++) { const x = Math.round(38 + i * 3.6), y = Math.round(22 + Math.abs(i - 4) * 0.9); if (crin.tiene(x, y)) pon(g, Mu, 1, [x + 1, y + 1]); }
    /* Taparrabos de cuero con cuerda y un hueso. */
    const trapo = C().poly([[31, 65], [65, 64], [66, 72], [61, 71], [57, 80], [52, 72], [46, 78], [41, 71], [34, 77], [30, 70]]);
    sombrear(trapo, g, Cu, { relieve: 3, separar: true, tramado: 0.2 });
    trazo(g, trapo, Cu, 1, [38, 67, 39, 74], [52, 67, 55, 76], [46, 67, 45, 74], [60, 66, 62, 70]);
    trazo(g, trapo, Cu, 4, [36, 67, 37, 70], [49, 67, 51, 72]);
    for (const [i, j] of [[44, 70], [56, 69], [34, 70]]) pon(g, Cu, 0, [i, j], [i + 1, j]);
    const cuerda = C().curva(30, 65.5, 48, 69, 66, 64.5, 2.4);
    sombrear(cuerda, g, R.tela.ocre, { relieve: 1, max: 3, separar: true, tramado: 0 });
    for (let x = 31; x <= 65; x += 3) pon(g, R.tela.ocre, 1, [x, Math.round(65.5 + Math.sin((x - 30) / 36 * Math.PI) * 2.8)]);
    const hueso = new Capa(W, H).linea(35, 68, 33, 79, 2).ell(32.5, 80, 1.9, 1.6).ell(35, 67.5, 1.9, 1.6);
    sombrear(hueso, g, HUESO, { relieve: 1, min: 2, separar: true, tramado: 0 });

    /* Pierna de delante, combada, con el pie plantado y garras de cuerno. */
    const pierna = C().curva(41, 67, 31, 77, 35, 87, 15, 11).rect(23, 87, 20, 8).ell(29, 90, 7.5, 4.6);
    sombrear(pierna, g, P, { relieve: 6, volumen: 0.35, separar: true });
    trazo(g, pierna, P, 1, [29, 76, 33, 80, 32, 85], [36, 86, 41, 88]);
    trazo(g, pierna, P, 3, [33, 70, 30, 74]);
    for (const x of [23, 28, 33]) pua(g, UNA, x + 1, 92, x - 3, 94.5, 1.5, { relieve: 1, min: 2 });
    pon(g, P, 1, [37, 80], [38, 81], [36, 81]); pon(g, P, 4, [36, 79]);

    /* La cabeza, adelantada y baja: frente pesada, nariz ganchuda, mandíbula saliente con colmillos. */
    const oreja = C().poly([[31, 29], [49, 13], [44, 22], [39, 32]]);
    sombrear(oreja, g, P, { relieve: 2.5, separar: true, tramado: 0 });
    trazo(g, oreja, P, 1, [34, 29, 44, 19]);
    pon(g, P, 3, [43, 17], [44, 16], [45, 15]);
    for (const [x, y] of [[46, 16], [46, 17], [47, 16]]) g.quitar(x, y);   // muesca de una vieja pelea
    /* Aro de cobre en la oreja. */
    new Capa(W, H).curva(34, 31, 33, 35.5, 36.5, 35, 1.6).pintar(g, R.oricalco, { plano: 3 });
    pon(g, R.oricalco, 4, [34, 32]); pon(g, R.oricalco, 1, [36, 35]);
    const craneo = C().ell(27, 28, 10.5, 9).ell(31, 22.5, 6.6, 4.8);
    sombrear(craneo, g, P, { relieve: 7, volumen: 0.35, separar: true });
    /* Mandíbula de abajo, más ancha y adelantada que la de arriba. */
    const mandibula = C().poly([[5, 42], [32, 38], [36, 45], [30, 52], [14, 53.5], [6, 49]]);
    sombrear(mandibula, g, P, { relieve: 5, volumen: 0.4, separar: true });
    tono(g, C().rect(7, 50, 26, 4), 1, P);
    trazo(g, mandibula, P, 1, [13, 49, 22, 51, 31, 47]);
    trazo(g, mandibula, P, 3, [8, 44, 18, 44.5]);
    pon(g, P, 4, [7, 45], [8, 45]);
    /* La boca entreabierta: encía oscura y una fila de dientes torcidos abajo. */
    const boca = C().poly([[7, 41], [20, 41.5], [33, 38.5], [33, 40.5], [21, 44.5], [8, 43.5]]);
    cada(boca, (x, y) => pon(g, R.sangre, boca.tiene(x, y - 1) ? 1 : 0, [x, y]));
    for (const [x, h] of [[13, 3], [16, 2], [19, 3], [29, 2]]) {
      const yb = Math.round(43.8 - (x - 8) * 0.13);
      for (let j = 0; j < h; j++) pon(g, HUESO, j === h - 1 ? 3 : 2, [x, yb - j], [x + 1, yb - j]);
      pon(g, HUESO, 4, [x, yb - h + 1]); pon(g, HUESO, 1, [x + 1, yb]);
    }
    /* Hocico y labio de arriba, que cuelga sobre la boca. */
    const hocico = C().ell(21, 36, 11, 4.4);
    sombrear(hocico, g, P, { relieve: 3.5, volumen: 0.3, separar: 2 });
    cada(hocico, (x, y) => { if (!hocico.tiene(x, y + 1)) pon(g, P, 0, [x, y]); });
    /* Colmillos que salen de la mandíbula y suben por fuera del labio. */
    for (const [x, y, h, a] of [[11, 44, 10, 2.4], [25.5, 42.5, 12, 3.2]]) {
      const c = C().poly([[x - a, y + 1], [x - a * 0.6, y - h * 0.6], [x - 1.2, y - h], [x + 0.6, y - h + 2], [x + a, y + 1]]);
      sombrear(c, g, HUESO, { relieve: 1.8, min: 1, tramado: 0, volumen: 0.4 });
      for (let j = 2; j < h - 2; j++) pon(g, HUESO, 4, [Math.round(x - a * 0.5 - (j / h) * 0.4), y - j]);
      pon(g, HUESO, 1, [Math.round(x + a - 0.5), y], [Math.round(x + a - 0.5), y - 1], [Math.round(x + a - 1), y - 3]);
      pon(g, HUESO, 0, [Math.round(x - a), y + 1], [Math.round(x + a), y + 1]);
      /* Vetas amarillentas del marfil. */
      pon(g, R.tela.ocre, 2, [Math.round(x), y - 2], [Math.round(x), y - Math.round(h * 0.55)]);
    }
    /* Nariz ganchuda y colgante. */
    const nariz = C().poly([[20, 24], [24, 27.5], [22, 34], [17, 39], [10, 40], [6.5, 37.5], [10, 33], [15, 27]]);
    tono(g, C().ell(19, 38, 7, 3), 1, P);
    sombrear(nariz, g, P, { relieve: 3.2, volumen: 0.55, separar: true, sesgo: 0.12 });
    cada(nariz, (x, y) => { if (!nariz.tiene(x + 1, y + 1) && !nariz.tiene(x, y + 1)) pon(g, P, 1, [x, y]); });
    trazo(g, nariz, P, 4, [16, 28, 13, 32, 10, 35]);
    pon(g, P, 4, [17, 27], [9, 36]);
    pon(g, NEGRO, 1, [12, 38], [13, 38], [14, 38]); pon(g, P, 0, [11, 38], [15, 38], [16, 37]);
    trazo(g, null, P, 1, [20, 35, 22, 37], [17, 39, 21, 39]);
    /* Ceño: una cresta de hueso sobre los ojos, con el entrecejo fruncido. */
    const cejo = C().curva(11, 27.5, 21, 21.5, 36, 24.5, 5.2, 4);
    sombrear(cejo, g, P, { relieve: 1.8, min: 2, separar: 2, tramado: 0 });
    for (const [i, j] of [[13, 25], [15, 24], [17, 23], [19, 22], [21, 22], [24, 22], [27, 22]]) pon(g, P, 4, [i, j]);
    trazo(g, cejo, P, 1, [20, 23, 21, 26], [23, 23, 23, 25]);
    /* Ojos pequeños hundidos bajo el ceño, con un brillo de brasa. */
    for (const [x, ancho] of [[13, 4], [24, 6]]) {
      new Capa(W, H).rect(x, 27, ancho, 3).pintar(g, P, { plano: 0 });
      const ix = x + ancho - 3;
      pon(g, R.fuego, 4, [ix, 28]); pon(g, R.bronce, 4, [ix - 1, 28]);
      pon(g, R.fuego, 2, [ix, 29], [ix - 1, 29]); pon(g, R.fuego, 3, [ix + 1, 28]);
      pon(g, NEGRO, 0, [ix + 1, 29]);
      pon(g, HUESO, 4, [ix - 1, 27]);
      pon(g, P, 1, [x, 30], [x + 1, 30], [x + ancho - 1, 30]);
    }
    /* Arrugas, verrugas y liquen en la cara. */
    trazo(g, craneo, P, 1, [29, 31, 32, 35], [27, 20, 33, 20.5], [28, 22.5, 33, 23]);
    trazo(g, hocico, P, 1, [24, 33, 28, 35]);
    for (const [i, j] of [[32, 28], [32, 40], [19, 46], [25, 48], [34, 33], [9, 46]]) { pon(g, P, 4, [i, j]); pon(g, P, 1, [i, j + 1]); }
    pon(g, Mu, 2, [34, 31], [35, 32], [28, 49], [29, 49]);
    /* Mechones de pelo sucio en la coronilla. */
    const mechon = C().curva(24, 21, 28, 13, 35, 12, 3.4, 1).curva(29, 21, 35, 16, 41, 16, 3.4, 1).curva(20, 22, 21, 16, 26, 13, 3, 1);
    sombrear(mechon, g, Mu, { relieve: 1.6, max: 4, separar: true, tramado: 0 });
    /* Brazo de delante: largo hasta casi el suelo, con el puño apoyado. */
    const brazo = C().curva(38, 37, 25, 46, 23, 60, 15, 12).curva(23, 60, 19, 68, 17, 76, 12, 9.5);
    sombrear(brazo, g, P, { relieve: 6, volumen: 0.3, caida: 0.15, separar: true });
    trazo(g, brazo, P, 1, [29, 48, 25, 55, 27, 62], [19, 66, 17, 71]);
    trazo(g, brazo, P, 3, [32, 39, 26, 44, 23, 53]);
    trazo(g, brazo, P, 4, [31, 40, 27, 43]);
    tono(g, C().ell(30, 39, 6, 2.4), 1, P);
    const puno = C().ell(15.5, 79, 8.4, 7).ell(11, 84, 6, 4.2);
    sombrear(puno, g, P, { relieve: 6, separar: true });
    for (const [x0, y0, x1] of [[7, 81, 11], [9, 85, 13], [13, 86, 17], [18, 85, 21]]) trazo(g, puno, P, 1, [x0, y0, x1, y0 + 1]);
    pon(g, P, 4, [10, 75], [12, 74], [8, 79], [9, 83], [13, 84]);
    for (const [x, y] of [[6, 85], [9, 88], [14, 88.5], [19, 88]]) pua(g, UNA, x + 1, y, x - 1.6, y + 4.5, 1.4, { relieve: 1, min: 2 });
    /* Aro de hierro oxidado en la muñeca, con un remache. */
    const pulsera = C().curva(10, 71, 17, 73.5, 24, 70, 3.6).recortar(brazo.copia().unir(puno));
    sombrear(pulsera, g, R.oricalco, { relieve: 1.2, max: 4, tramado: 0 });
    pon(g, R.oricalco, 1, [13, 74], [20, 73]);
    pon(g, R.oricalco, 4, [12, 71], [13, 71], [16, 72]);

    /* Verrugas por todo el cuerpo: un brillo y su sombra debajo. */
    for (const [i, j] of [[46, 27], [54, 24], [62, 32], [49, 42], [66, 40], [57, 48], [68, 26], [26, 55], [22, 65], [53, 59], [62, 53], [64, 76], [31, 82], [80, 30], [43, 36], [37, 56], [70, 47], [50, 30]]) {
      const ram = g.rampa(i, j);
      if (ram !== P && ram !== V) continue;
      pon(g, ram, 4, [i, j]); pon(g, ram, 1, [i, j + 1]);
    }
    /* Manchas de liquen. */
    for (const [i, j] of [[60, 36], [61, 37], [62, 36], [70, 35], [55, 43], [25, 59], [77, 34], [40, 26], [24, 58], [59, 37]]) if (g.rampa(i, j) === P) pon(g, Mu, 3, [i, j]);
    /* Luz fría de rebote por la derecha. */
    bordeReflejo(g, P, 2, P, (x, y) => y > 30 && g.get(x, y) === P[1]);
    contornear(g);
    return g;
  }

  /* =====================================================================
     Malakar, el liche: calavera coronada, túnica violeta y su filacteria.
     ===================================================================== */
  function liche() {
    const g = new Rejilla(W, H), V = VIOLETA, N = R.tela.negro, E = VERDE, B = ORO, Md = R.madera, Hu = HUESO_L;

    /* El cetro: vara de madera negra con aros de oro y una calavera con cuernos en lo alto. */
    const vara = C().rect(13, 18, 4, 77);
    sombrear(vara, g, Md, { relieve: 1.8, max: 2, tramado: 0 });
    cada(vara, (x, y) => { if (x === 13 && y % 7 < 4) pon(g, Md, 3, [x, y]); if (x === 16) pon(g, Md, 0, [x, y]); });
    for (const y of [27, 60, 84]) {
      const aro = C().rect(12, y, 6, 3);
      sombrear(aro, g, B, { relieve: 1, min: 1, tramado: 0 });
      pon(g, B, 4, [12, y], [13, y]); pon(g, B, 1, [17, y + 2], [16, y + 2]);
    }
    /* Cintas raídas que cuelgan del cetro. */
    const cinta = C().curva(17, 28, 22, 34, 20, 42, 2, 1).curva(17, 29, 20, 36, 24, 39, 1.6, 1);
    sombrear(cinta, g, VIOLETA, { relieve: 1, min: 1, max: 3, tramado: 0 });
    const cuernosV = C().curva(12, 11, 5, 7, 5, 17, 3, 1).curva(19, 11, 26, 7, 25, 17, 3, 1);
    sombrear(cuernosV, g, B, { relieve: 1.2, min: 1, tramado: 0 });
    pon(g, B, 4, [8, 8], [9, 8], [22, 8], [23, 8]);
    const calV = C().ell(15.5, 10, 5, 4.8).rect(12, 12, 7, 5);
    sombrear(calV, g, Hu, { relieve: 3, min: 1, separar: true, tramado: 0 });
    pon(g, NEGRO, 0, [12, 10], [13, 10], [12, 11], [13, 11], [17, 10], [18, 10], [17, 11], [15, 13], [15, 14]);
    pon(g, E, 4, [12, 10], [17, 10]); pon(g, E, 3, [13, 10], [18, 10]);
    for (let x = 12; x <= 18; x++) pon(g, x % 2 ? NEGRO : Hu, x % 2 ? 0 : 3, [x, 16]);
    pon(g, Hu, 4, [13, 6], [14, 6], [12, 7]);

    /* Brazo de atrás alzado, con la manga caída, sosteniendo la filacteria. */
    const mangaAtras = C().poly([[54, 33], [68, 22], [77, 25], [73, 31], [62, 43]]);
    sombrear(mangaAtras, g, V, { relieve: 3.5, max: 2 });
    trazo(g, mangaAtras, B, 2, [68, 22.5, 77, 25.5]);
    trazo(g, mangaAtras, V, 0, [60, 35, 70, 27]);
    const munecaA = C().linea(72, 24, 74, 20, 2);
    sombrear(munecaA, g, Hu, { relieve: 1, min: 2, tramado: 0 });
    /* Dedos de hueso, abiertos bajo la gema, con sus nudillos. */
    for (const [x0, y0, x1, y1] of [[72, 20, 70, 15], [73, 19, 73, 13], [74, 20, 76, 14], [75, 21, 79, 17]]) {
      new Capa(W, H).linea(x0, y0, x1, y1, 1).pintar(g, Hu, { plano: 3 });
      pon(g, Hu, 4, [Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2)]);
      pon(g, Hu, 1, [x1, y1]);
    }

    /* El manto: túnica violeta oscura hasta el suelo, deshilachada, con la cola barrida hacia atrás. */
    const manto = C().poly([[40, 30], [56, 30], [62, 41], [68, 60], [75, 78], [84, 94.5], [24, 94.5], [28, 78], [32, 60], [35, 41]]);
    for (const [x, y, a] of [[27, 88, 1.8], [34, 90, 1.5], [42, 87, 2], [57, 89, 1.8], [64, 86, 2.2], [72, 88, 2], [79, 91, 1.4]])
      manto.restar(C().poly([[x - a, 95.5], [x, y], [x + a, 95.5]]));
    sombrear(manto, g, V, { relieve: 7, volumen: 0.4, caida: 0.35, tramado: 0.25 });
    /* Pliegues largos: un surco de sombra con su cresta de luz a la izquierda. */
    const pliegue = (x0, y0, cx, cy, x1, y1, hondo = 0) => {
      const sur = C().curva(x0, y0, cx, cy, x1, y1, 1, 2.2).recortar(manto);
      tono(g, sur, 1, V);
      trazo(g, manto, V, hondo, [x0 + 0.5, y0, cx + 0.5, cy, x1 + 0.5, y1]);
      trazo(g, manto, V, 3, [x0 - 1.5, y0 + 3, cx - 1.5, cy, x1 - 2, y1 - 2]);
    };
    pliegue(60, 46, 66, 68, 72, 91);
    pliegue(55, 50, 58, 72, 61, 89);
    pliegue(65, 66, 71, 80, 78, 92, 1);
    pliegue(34, 62, 31, 76, 30, 89);
    trazo(g, manto, V, 4, [37, 44, 35, 58, 33, 70]);
    trazo(g, manto, V, 3, [59, 41, 61, 53, 62, 62]);
    /* Bordado de oro en el bajo, siguiendo los jirones. */
    cada(manto, (x, y) => {
      if (y < 80 || !manto.tiene(x, y) || manto.tiene(x, y + 3)) return;
      if (!manto.tiene(x, y + 2)) pon(g, B, (x + y) % 4 ? 2 : 3, [x, y]);
    });
    /* El faldón de delante, negro, con ribete de oro y runas que brillan. */
    const panel = C().poly([[44, 34], [51, 34], [53, 60], [55, 94.5], [37, 94.5], [40, 60]]).recortar(manto);
    sombrear(panel, g, N, { relieve: 3.5, caida: 0.3, max: 3, tramado: 0.12 });
    for (const [x0, y0, x1, y1] of [[44, 34, 40, 60], [40, 60, 37, 94], [51, 34, 53, 60], [53, 60, 55, 94]]) trazo(g, manto, B, 2, [x0, y0, x1, y1]);
    for (const [x0, y0, x1, y1] of [[44, 34, 40, 60], [40, 60, 37, 94]]) trazo(g, manto, B, 3, [x0 + 1, y0, x1 + 1, y1]);
    const RUNAS = [[[0, 0], [0, 1], [0, 2], [-1, 1], [1, 1]], [[-1, 0], [0, 1], [1, 0], [0, 2]], [[0, 0], [-1, 1], [1, 1], [0, 2], [0, 3]], [[-1, 0], [1, 0], [0, 1], [-1, 2], [1, 2]]];
    for (let i = 0, y = 64; y <= 88; y += 7, i++) {
      const xc = Math.round(46 + (y - 60) * 0.02);
      for (const [a, b] of RUNAS[i % 4]) pon(g, E, 3, [xc + a, y + b]);
      pon(g, E, 4, [xc, y]);
      for (const [a, b] of RUNAS[i % 4]) if (!RUNAS[i % 4].some(([c, d]) => c === a + 1 && d === b)) pon(g, N, 3, [xc + a + 1, y + b]);
    }
    /* Costillas a la vista por el escote. */
    const pecho = C().poly([[43, 32], [52, 32], [51, 48], [44, 48]]);
    pecho.pintar(g, N, { plano: 0 });
    for (const y of [35, 38.5, 42, 45.5]) {
      trazo(g, null, Hu, 2, [44, y + 1.5, 47.5, y, 51, y + 1.5]);
      pon(g, Hu, 4, [45, Math.round(y + 1)], [46, Math.round(y)]);
      pon(g, Hu, 1, [50, Math.round(y + 1.5)]);
    }
    trazo(g, null, Hu, 3, [47, 33, 47, 47]); trazo(g, null, Hu, 4, [47, 33, 47, 37]);
    /* Un resplandor verde entre las costillas: el corazón que ya no late. */
    pon(g, E, 2, [48, 40], [49, 41], [48, 44]); pon(g, E, 3, [49, 40]);
    /* Cinturón con hebilla de calavera. */
    const cinto = C().curva(35, 55, 48, 58.5, 64, 54, 3).recortar(manto);
    sombrear(cinto, g, B, { relieve: 1, max: 3, tramado: 0 });
    for (let x = 36; x < 64; x += 4) pon(g, B, 4, [x, Math.round(55.5 + Math.sin((x - 35) / 29 * Math.PI) * 2.6)]);
    const hebilla = new Capa(W, H).ell(47, 57, 2.8, 2.6).rect(45, 58, 5, 2);
    sombrear(hebilla, g, Hu, { relieve: 1.5, min: 2, tramado: 0 });
    pon(g, NEGRO, 0, [46, 57], [48, 57], [47, 59]);
    pon(g, E, 4, [46, 57]); pon(g, E, 3, [48, 57]);
    /* Cadena con un amuleto que cuelga del cinto. */
    for (let y = 59; y < 71; y += 2) pon(g, B, y % 4 ? 3 : 2, [Math.round(58 + (y - 59) * 0.15), y]);
    const engaste = new Capa(W, H).poly([[60, 70], [63, 74], [60, 78.5], [57, 74]]);
    sombrear(engaste, g, B, { relieve: 1, min: 1, tramado: 0 });
    new Capa(W, H).poly([[60, 71.5], [61.8, 74], [60, 76.8], [58.2, 74]]).pintar(g, E, { plano: 2 });
    pon(g, E, 4, [59, 73]); pon(g, E, 3, [60, 73], [59, 74]); pon(g, E, 1, [60, 76], [61, 75]);

    /* Esclavina sobre los hombros y el cuello alto, que se abre en dos puntas. */
    const cuello = C().poly([[34, 11], [41, 26], [55, 26], [63, 11], [60, 32], [37, 32]]);
    sombrear(cuello, g, V, { relieve: 3, max: 3, separar: true });
    const forro = C().poly([[37, 15], [42, 27], [54, 27], [60, 15], [57, 30], [39, 30]]).recortar(cuello);
    sombrear(forro, g, R.tela.granate, { relieve: 2, max: 2, tramado: 0 });
    trazo(g, cuello, B, 3, [34, 11, 41, 26], [63, 11, 55, 26]);
    pon(g, B, 4, [34, 11], [35, 13], [63, 11]);
    const esclavina = C().ell(48, 35, 17, 7.8).quitarRect(0, 0, W, 30);
    sombrear(esclavina, g, V, { relieve: 3.5, volumen: 0.45, separar: true });
    trazo(g, esclavina, V, 1, [38, 33, 37, 38], [58, 33, 60, 38], [48, 36, 48, 41]);
    cada(esclavina, (x, y) => { if (!esclavina.tiene(x, y + 1)) pon(g, B, x % 3 ? 2 : 3, [x, y]); if (!esclavina.tiene(x, y + 1) && !esclavina.tiene(x, y + 2) && x % 6 === 0) pon(g, B, 4, [x, y]); });
    /* Broche de esmeralda en el pecho. */
    new Capa(W, H).ell(47.5, 31.5, 2, 1.8).pintar(g, B, { plano: 2 });
    pon(g, E, 3, [47, 31], [48, 31], [47, 32]); pon(g, E, 4, [47, 31]); pon(g, E, 1, [48, 32]);

    /* La calavera coronada, con los ojos en llamas verdes. */
    const craneo = C().ell(48, 18, 7.8, 7.8).poly([[41.4, 20.4], [54.6, 20.4], [53.4, 25.2], [51, 29.4], [44.4, 29.4], [42, 25.8]]);
    sombrear(craneo, g, Hu, { relieve: 5, volumen: 0.4, separar: true, tramado: 0.25 });
    /* Pómulo, sien hundida y mandíbula. */
    trazo(g, craneo, Hu, 1, [53, 20, 54, 24, 52, 27], [44, 23, 46, 24.5, 48, 23.5]);
    pon(g, Hu, 4, [43, 23], [48, 22], [42, 21]);
    pon(g, Hu, 4, [44, 13], [45, 12], [46, 12], [43, 14]);
    /* Una grieta en el cráneo. */
    trazo(g, craneo, Hu, 0, [51, 11, 52, 14, 51, 16]); pon(g, Hu, 4, [52, 11]);
    /* Cuencas: hondas, con el fuego fatuo dentro. */
    /* El borde de arriba de cada cuenca baja hacia la nariz: un ceño de hueso, con mala cara. */
    for (const [x0, lado] of [[42, 1], [48, -1]]) {
      const c = new Capa(W, H).rect(x0, 18, 4, 4).off(x0, 21).off(x0 + 3, 21);
      c.off(lado > 0 ? x0 + 3 : x0, 18); c.off(lado > 0 ? x0 : x0 + 3, 18);
      c.pintar(g, NEGRO, { plano: 0 });
      const ci = lado > 0 ? x0 + 2 : x0 + 1;
      pon(g, E, 4, [ci, 19]); pon(g, E, 3, [ci - lado, 19], [ci, 20]); pon(g, E, 2, [ci - lado, 20], [ci + lado, 20]);
      trazo(g, null, Hu, 1, lado > 0 ? [x0, 17, x0 + 4, 18] : [x0 - 1, 18, x0 + 3, 17]);
      pon(g, Hu, 4, lado > 0 ? [x0, 16] : [x0 + 3, 16]);
    }
    /* Nariz y dientes. */
    pon(g, NEGRO, 0, [46, 22], [46, 23], [45, 23], [47, 23]);
    for (let x = 43; x <= 51; x++) { pon(g, x % 2 ? NEGRO : Hu, x % 2 ? 0 : 3, [x, 26]); if (x % 2 === 0) pon(g, Hu, 2, [x, 27]); }
    pon(g, NEGRO, 0, [43, 25], [51, 25]);
    trazo(g, null, Hu, 1, [44, 28, 50, 28]);
    /* La corona: aro de oro con cinco puntas y gemas verdes. */
    const corona = C().rect(40, 9.5, 17, 3.6).off(40, 9).off(56, 9);
    const PICOS = [[41, 5], [44.5, 7], [48.5, 9], [52.5, 7], [56, 5]];
    for (const [x, h] of PICOS) corona.poly([[x - 1.6, 10], [x, 10 - h], [x + 1.6, 10]]);
    sombrear(corona, g, B, { relieve: 1.6, min: 1, separar: true, tramado: 0 });
    for (const [x, h] of PICOS) { pon(g, B, 4, [Math.round(x - 0.5), Math.round(10 - h + 1)]); pon(g, B, 1, [Math.round(x + 1), 9]); }
    cada(C().rect(40, 12, 17, 1).recortar(corona), (x, y) => pon(g, B, x % 2 ? 1 : 2, [x, y]));
    new Capa(W, H).ell(48.5, 10.8, 1.8, 1.6).pintar(g, E, { plano: 2 });
    pon(g, E, 4, [48, 10]); pon(g, E, 3, [49, 10]);
    for (const x of [42, 55]) { pon(g, E, 3, [x, 11]); pon(g, E, 4, [x, 10]); }

    /* Brazo de delante: manga acampanada que cuelga y la mano de hueso en el cetro. */
    const manga = C().poly([[45, 32], [25, 38], [19, 54], [28, 53], [34, 46], [43, 44]]);
    sombrear(manga, g, V, { relieve: 4.5, volumen: 0.4, separar: true });
    trazo(g, manga, V, 1, [38, 37, 30, 43, 25, 51], [42, 41, 36, 44, 30, 51]);
    trazo(g, manga, V, 4, [40, 34, 31, 38, 26, 44]);
    cada(manga, (x, y) => { if (y > 46 && !manga.tiene(x, y + 1)) { pon(g, B, 2, [x, y]); if (manga.tiene(x, y - 1)) pon(g, B, 3, [x, y - 1]); } });
    /* La mano agarra el cetro: cuatro falanges por delante y el pulgar por detrás. */
    const mano = C();
    for (const y of [40, 43, 46]) mano.rect(15, y, 6, 2);
    mano.rect(15, 49, 5, 2).linea(20, 39, 22, 37, 1).linea(21, 42, 24, 41, 1);
    sombrear(mano, g, Hu, { relieve: 1, min: 2, separar: true, tramado: 0 });
    for (const y of [40, 43, 46, 49]) { pon(g, Hu, 4, [15, y], [16, y]); pon(g, Hu, 1, [18, y + 1]); }
    bordeLuz(g, V, 3);
    bordeLuz(g, N, 2);
    /* La luz verde de la filacteria baña de lado el hombro y la manga de atrás. */
    bordeReflejo(g, V, 2, V, (x, y) => y > 36);
    contornear(g);

    /* La filacteria: una gema verde en una jaula de oro, flotando sobre la mano. */
    const gx = 76, gy = 8;
    for (let a = 0; a < 6.28; a += 0.12) {
      const x = Math.round(gx + Math.cos(a) * 8), y = Math.round(gy + Math.sin(a) * 7.5);
      if (!g.get(x, y) && umbral(x, y) < 0.35) pon(g, E, 1, [x, y]);
    }
    for (let a = 0; a < 6.28; a += 0.1) {
      const x = Math.round(gx + Math.cos(a) * 6), y = Math.round(gy + Math.sin(a) * 5.6);
      if (!g.get(x, y) && umbral(x, y) < 0.6) pon(g, E, 2, [x, y]);
    }
    const gema = C().poly([[gx, gy - 6], [gx + 4.5, gy - 1], [gx, gy + 6.5], [gx - 4.5, gy - 1]]);
    sombrear(gema, g, E, { relieve: 3, min: 1, volumen: 0.55, tramado: 0 });
    trazo(g, gema, E, 4, [gx - 3, gy - 1, gx, gy - 5]); trazo(g, gema, E, 1, [gx, gy - 1, gx + 3, gy - 1]);
    trazo(g, gema, E, 2, [gx - 3, gy - 1, gx, gy + 5]);
    pon(g, HUESO, 4, [gx - 1, gy - 3]);
    trazo(g, null, B, 3, [gx, gy - 7, gx, gy + 7], [gx - 5, gy - 1, gx + 5, gy - 1]);
    pon(g, B, 4, [gx, gy - 7], [gx - 5, gy - 1], [gx, gy - 1]); pon(g, B, 1, [gx, gy + 7], [gx + 5, gy - 1]);
    /* Chispas de fuego fatuo, sin contorno, y las llamas que salen de las cuencas. */
    for (const [x, y, k] of [[67, 3, 3], [86, 6, 4], [84, 16, 2], [69, 14, 3], [7, 3, 3], [22, 2, 4], [4, 13, 2], [25, 20, 3], [9, 22, 2], [80, 0, 3], [89, 11, 2], [64, 9, 2], [28, 12, 2], [3, 30, 2], [30, 4, 2]])
      if (!g.get(x, y)) pon(g, E, k, [x, y]);
    
    destello(g, 15, 2, E, 2);
    destello(g, gx, gy - 9, E, 1);
    return g;
  }

  /* =====================================================================
     Lord Varkhul, el vampiro: abre la capa como alas de murciélago.
     ===================================================================== */
  function vampiro() {
    const g = new Rejilla(W, H), N = NOCHE, Rj = CARMIN, P = PALIDO, Pe = AZABACHE, Pl = R.plata, S = R.sangre;

    /* La capa abierta con las dos manos, enseñando el forro carmesí. Por fuera solo asoma un filo fino
       del paño negro (con su brillo de raso), para que el borde no pese. */
    const forroDe = ala => {
      const f = ala.copia();
      cada(ala, (x, y) => { if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !ala.tiene(x + a, y + b))) f.off(x, y); });
      return f;
    };
    const capa = (ala, mano, puntas, lado) => {
      const forro = forroDe(ala);
      /* El filo exterior: raso negro azulado, más claro arriba, donde le da la luz. */
      cada(ala, (x, y) => { if (!forro.tiene(x, y)) pon(g, N, y < mano[1] + 8 ? 4 : 3, [x, y]); });
      /* Tablas de la capa: entre varilla y varilla la tela se comba, clara del lado de la luz y oscura del otro. */
      const ang = (x, y) => Math.atan2(y - mano[1], (x - mano[0]) * lado);
      const cortes = [-0.6, ...puntas.map(([x, y]) => ang(x, y)), ang(mano[0] - lado * 14, 95), ang(mano[0] - lado * 30, 80), 3.2];
      const pliegues = (x, y) => {
        const a = ang(x, y);
        for (let i = 0; i < cortes.length - 1; i++) if (a >= cortes[i] && a < cortes[i + 1]) {
          const f = (a - cortes[i]) / (cortes[i + 1] - cortes[i]);
          return Math.cos(f * Math.PI) * 0.32 * (lado > 0 ? 1 : -1) * Math.min(1, Math.hypot(x - mano[0], y - mano[1]) / 14);
        }
        return 0;
      };
      sombrear(forro, g, Rj, { relieve: 6, volumen: 0.35, caida: 0.2, tramado: 0.15, sesgo: 0.08, min: 1, extra: pliegues });
      /* La sombra del cuerpo sobre el forro, junto a la levita. */
      tono(g, C().ell(48 + lado * 7, 62, 9, 34).recortar(forro), 1, Rj, 0.5);
      /* Varillas de la capa, como dedos de murciélago, desde la mano. */
      for (const [x1, y1] of puntas) {
        const cx = (mano[0] + x1) / 2 - lado * 3, cy = (mano[1] + y1) / 2;
        trazo(g, forro, Rj, 1, [mano[0] + lado, mano[1] + 2, cx, cy, x1 - lado, y1]);
      }
    };
    const alaD = C().poly([[53, 26], [67, 20], [79, 18], [86, 23], [91, 36], [92, 55], [89, 72], [83, 86], [74, 94.5], [50, 94.5]]);
    for (const [x, y, rx, ry] of [[98, 46, 8.6, 7.8], [97, 64, 8.4, 7.2], [92.5, 80, 7.6, 6], [82, 99, 6.6, 6]]) alaD.quitarEll(x, y, rx, ry);
    capa(alaD, [78, 21], [[91, 37], [92, 55], [89, 72], [83, 86]], 1);
    const alaI = C().poly([[43, 26], [29, 20], [17, 17], [10, 22], [5, 36], [4, 55], [7, 72], [13, 86], [22, 94.5], [46, 94.5]]);
    for (const [x, y, rx, ry] of [[-2, 46, 8.6, 7.8], [-1, 64, 8.4, 7.2], [3.5, 80, 7.6, 6], [14, 99, 6.6, 6]]) alaI.quitarEll(x, y, rx, ry);
    capa(alaI, [16, 20], [[5, 37], [4, 55], [7, 72], [13, 86]], -1);
    /* El cuello alto de la capa, que se abre por detrás de la cabeza. */
    const cuello = C().poly([[32, 5], [40, 23], [55, 23], [65, 4], [63, 29], [36, 30]]);
    sombrear(cuello, g, N, { relieve: 2, max: 3, tramado: 0 });
    const cuelloF = C().poly([[34.5, 9], [41, 24.5], [54, 24.5], [62.5, 8], [61, 28], [38, 28]]).recortar(cuello);
    sombrear(cuelloF, g, Rj, { relieve: 3, volumen: 0.6, tramado: 0.15 });
    trazo(g, cuelloF, Rj, 4, [35, 10, 40, 22]); trazo(g, cuelloF, Rj, 1, [61, 10, 56, 22]);
    pon(g, N, 4, [32, 5], [33, 6]);

    /* Piernas: pantalón negro y zapatos de punta con hebilla de plata. */
    const piernas = C().poly([[41, 62], [56, 62], [58, 91], [52, 91], [49, 72], [47, 91], [40, 91]]);
    sombrear(piernas, g, N, { relieve: 3, max: 3, tramado: 0 });
    trazo(g, piernas, N, 0, [49, 69, 49, 91]);
    trazo(g, piernas, N, 3, [42, 64, 41, 90], [51, 72, 53, 90]);
    const zapatos = C().poly([[40, 90], [47, 90], [47, 94.5], [33, 94.5]]).poly([[50, 90], [58, 90], [58, 94.5], [45, 94.5]]);
    sombrear(zapatos, g, N, { relieve: 1.5, min: 1, separar: true, tramado: 0 });
    for (const x of [36, 48]) { pon(g, N, 4, [x, 92], [x + 1, 92]); }
    for (const x of [42, 53]) { pon(g, Pl, 3, [x, 91], [x + 1, 91]); pon(g, Pl, 4, [x, 91]); }

    /* Levita negra con faldones, chaleco granate con botones de oro y solapas de seda. */
    const levita = C().poly([[40, 26], [56, 26], [59, 43], [60, 60], [64, 77], [55, 74], [53, 62], [44, 62], [42, 74], [34, 77], [37, 60], [38, 43]]);
    sombrear(levita, g, N, { relieve: 5, volumen: 0.45, separar: true, tramado: 0.15 });
    trazo(g, levita, N, 3, [39, 45, 38, 60, 36, 74], [57, 45, 58, 60, 61, 74]);
    trazo(g, levita, N, 0, [44, 62, 43, 73], [53, 62, 55, 73]);
    const chaleco = C().poly([[44, 26], [52, 26], [53, 55], [48, 59], [43, 55]]);
    sombrear(chaleco, g, R.tela.granate, { relieve: 2.5, max: 3, volumen: 0.4, tramado: 0 });
    /* Brocado del chaleco: rombos pequeños. */
    for (let y = 34; y < 56; y += 4) for (let x = 44 + (y % 8 ? 2 : 0); x < 53; x += 4) if (chaleco.tiene(x, y) && chaleco.tiene(x + 1, y)) pon(g, R.tela.granate, 1, [x, y]);
    for (const y of [38, 44, 50]) { pon(g, ORO, 3, [48, y], [49, y]); pon(g, ORO, 4, [48, y - 1]); pon(g, ORO, 1, [49, y + 1]); }
    const solapas = C().poly([[41.5, 26], [44, 26], [45.6, 48], [41.5, 40]]).poly([[52, 26], [54.5, 26], [54.5, 40], [50.4, 48]]);
    sombrear(solapas, g, Pl, { relieve: 1.2, max: 2, separar: 1, tramado: 0 });
    trazo(g, solapas, Pl, 3, [42, 27, 42, 39]);
    /* Chorrera blanca de encaje y un broche de rubí. */
    const chorrera = C().poly([[44, 24], [52, 24], [51, 34], [48, 37], [45, 34]]);
    sombrear(chorrera, g, HUESO, { relieve: 1.8, min: 2, tramado: 0 });
    trazo(g, chorrera, HUESO, 1, [45, 28, 48, 29.5, 51, 28], [45.5, 31.5, 48, 33, 50.5, 31.5]);
    pon(g, HUESO, 4, [45, 27], [46, 30], [45, 33]);
    new Capa(W, H).ell(48, 26, 1.9, 1.8).pintar(g, S, { plano: 3 });
    pon(g, S, 4, [47, 25]); pon(g, S, 1, [49, 27]); pon(g, ORO, 3, [46, 26], [50, 26], [48, 24], [48, 28]);
    bordeLuz(g, N, 3, N, (x, y) => y > 24);

    /* Brazo de atrás: sube hasta la mano que sostiene la capa. */
    const brazoAtras = C().curva(55, 31, 67, 31, 75, 23, 6, 4.8);
    sombrear(brazoAtras, g, N, { relieve: 2.5, max: 3, separar: 1, tramado: 0 });
    trazo(g, brazoAtras, N, 4, [56, 29, 66, 28.5, 73, 22]);
    const punoA = C().poly([[72, 21], [75.5, 19.5], [77, 24], [73, 25.5]]);
    sombrear(punoA, g, HUESO, { relieve: 1, min: 2, separar: true, tramado: 0 });
    const manoAtras = C().ell(78, 21.5, 3, 2.6).linea(79, 20, 83, 17, 1).linea(80, 22, 84, 21, 1).linea(78, 19, 79, 15, 1).linea(80, 23.5, 83, 25, 1);
    sombrear(manoAtras, g, P, { relieve: 1.6, separar: true, tramado: 0 });
    pon(g, S, 2, [83, 17], [84, 21], [79, 15], [83, 25]);

    /* La cabeza: piel de cera, pelo negro peinado hacia atrás con pico de viuda, oreja puntiaguda. */
    const cab = C().ell(46.5, 15, 7.2, 8.4).poly([[40, 14], [37, 19.5], [40, 21]]).poly([[40, 20], [52, 20], [49, 27], [42.5, 28.5]]);
    sombrear(cab, g, P, { relieve: 4, volumen: 0.5, separar: true, tramado: 0 });
    const pelo = C().poly([[38.6, 11.5], [40.5, 7], [45.6, 4.5], [52, 5], [56.5, 9.5], [57.6, 16], [57, 23.5], [53.5, 21.5], [52, 14.5], [49.6, 11.6], [47.2, 11.5], [44.8, 14.6], [43, 11.8], [40, 12.4]]);
    sombrear(pelo, g, Pe, { relieve: 3, volumen: 0.5, separar: true, tramado: 0, max: 3, sesgo: -0.15 });
    /* Mechones engominados: brillos largos que siguen el peinado hacia la nuca. */
    trazo(g, pelo, Pe, 4, [42, 8, 46.5, 6, 51, 6.5]);
    trazo(g, pelo, Pe, 3, [44, 10, 49, 8.5, 54, 11.5], [50, 10, 54.5, 13, 55.5, 20], [40.5, 10.5, 43.5, 8.5]);
    trazo(g, pelo, Pe, 1, [47, 10.5, 51.5, 10.5, 55, 15], [53, 16, 56, 22]);
    const oreja = C().poly([[52, 15], [59, 8.6], [55.6, 20], [52.6, 20.6]]);
    sombrear(oreja, g, P, { relieve: 1.6, separar: true, tramado: 0 });
    pon(g, P, 1, [54, 15], [55, 14], [54, 16], [54, 17], [56, 12]); pon(g, P, 4, [57, 10], [53, 18]);
    /* Cejas en punta, fruncidas hacia la nariz. */
    pon(g, Pe, 1, [39, 12], [40, 13], [41, 13], [42, 14], [44, 14], [45, 13], [46, 13], [47, 12], [48, 12]);
    pon(g, Pe, 3, [40, 12], [46, 12]);
    /* Ojos: párpado oscuro, iris rojo con su brasa y la ojera fría debajo. */
    pon(g, P, 0, [40, 14], [41, 14], [45, 14], [46, 14], [47, 14]);
    pon(g, S, 3, [40, 15]); pon(g, R.fuego, 4, [41, 15]); pon(g, S, 1, [42, 15]);
    pon(g, S, 3, [44, 15]); pon(g, R.fuego, 4, [45, 15]); pon(g, S, 4, [46, 15]); pon(g, S, 1, [47, 15]);
    pon(g, P, 1, [40, 16], [41, 16], [45, 16], [46, 16], [47, 16]);
    /* Nariz larga y aguileña. */
    pon(g, P, 4, [43, 15], [42, 16], [42, 17], [41, 18]); pon(g, P, 3, [40, 17], [39, 18], [38, 19]);
    pon(g, P, 1, [43, 17], [43, 18], [42, 19], [41, 20]);
    pon(g, P, 0, [39, 20], [40, 20]);
    /* Pómulo alto y mejilla hundida. */
    pon(g, P, 4, [45, 17], [46, 17]); pon(g, P, 3, [47, 17], [44, 18]);
    pon(g, P, 1, [47, 19], [48, 20], [47, 21], [46, 20], [49, 19]);
    /* Boca: sonrisa fina y cruel, colmillos y una gota de sangre. */
    pon(g, S, 1, [40, 22], [41, 22], [42, 22], [43, 22], [44, 22]); pon(g, S, 0, [45, 21], [46, 21]);
    pon(g, S, 2, [41, 21]);
    pon(g, HUESO, 4, [41, 23], [44, 23]); pon(g, HUESO, 2, [41, 24], [44, 24]);
    pon(g, P, 3, [40, 23], [42, 23], [43, 23]);
    pon(g, S, 3, [45, 23]); pon(g, S, 4, [45, 24]); pon(g, S, 2, [45, 25]);
    /* Barbilla en punta. */
    pon(g, P, 3, [42, 25], [43, 25], [42, 26]); pon(g, P, 1, [44, 26], [46, 24]); pon(g, P, 0, [43, 27], [44, 27]);

    /* Brazo de delante, alzado, con puño de encaje y la mano de garras agarrando la capa. */
    const brazo = C().curva(41, 33, 30, 33, 23, 24, 6.6, 5.4);
    sombrear(brazo, g, N, { relieve: 3, max: 3, separar: true, tramado: 0 });
    trazo(g, brazo, N, 4, [40, 31, 30, 30.5, 24, 22]);
    trazo(g, brazo, N, 0, [37, 36, 29, 35.5, 25, 29]);
    const puno = C().poly([[24, 19], [27.6, 22.8], [24, 27.6], [20.4, 24]]);
    sombrear(puno, g, HUESO, { relieve: 1.2, min: 2, separar: true, tramado: 0 });
    trazo(g, puno, HUESO, 1, [24, 21.5, 22.8, 25.2]);
    pon(g, HUESO, 4, [23, 20], [22, 22]);
    const mano = C().ell(18.6, 21, 3.1, 2.9);
    sombrear(mano, g, P, { relieve: 1.8, separar: true, tramado: 0 });
    for (const [x0, y0, x1, y1] of [[17, 19, 13, 14.5], [16.5, 20.5, 11, 18.5], [16.5, 22.5, 11.4, 25], [17.5, 23.5, 14.4, 28.4]]) {
      new Capa(W, H).linea(x0, y0, x1, y1, 1).pintar(g, P, { plano: 3 });
      pon(g, P, 1, [Math.round((x0 + x1) / 2) + 1, Math.round((y0 + y1) / 2)]);
      pon(g, S, 3, [x1, y1]);
    }
    pon(g, P, 4, [17, 19], [18, 19]);
    /* Anillo de sello con un rubí. */
    pon(g, ORO, 3, [16, 21]); pon(g, S, 4, [15, 21]);
    contornear(g);
    return g;
  }

  /* Ala de murciélago: del hombro a la muñeca y de ahí los dedos, con la membrana recortada entre ellos. */
  function alaMembrana(g, hombro, muneca, puntas, anclaje, membrana, opM, hueso, opH, curva = 0.4) {
    const c = C(), todos = [...puntas, anclaje];
    for (let i = 0; i < todos.length - 1; i++) {
      const [ax, ay] = todos[i], [bx, by] = todos[i + 1];
      const mx = (ax + bx) / 2 * (1 - curva) + muneca[0] * curva, my = (ay + by) / 2 * (1 - curva) + muneca[1] * curva;
      c.poly([muneca, [ax, ay], [mx, my], [bx, by]]);
    }
    c.poly([hombro, muneca, todos[todos.length - 1]]);
    sombrear(c, g, membrana, opM);
    const huesos = C().linea(hombro[0], hombro[1], muneca[0], muneca[1], opH.grueso || 4);
    puntas.forEach(([x, y], i) => huesos.curva(muneca[0], muneca[1], (muneca[0] + x) / 2 + 1, (muneca[1] + y) / 2 - 1, x, y, i === 0 ? 3 : 2.4, 1));
    sombrear(huesos, g, hueso, { relieve: 1.5, tramado: 0, ...opH });
    return [c, huesos];
  }

  /* =====================================================================
     Ignárax, el dragón rojo: alas alzadas y fuego en las fauces.
     El rojo es vivo y frío en la sombra (carmín), cálido en la luz (coral), con borde de lava por la izquierda
     y vientre dorado: así se despega del fondo pardo y rojizo de su guarida.
     ===================================================================== */
  function dragon() {
    const g = new Rejilla(W, H), E = ESCAMA, O = VIENTRE, F = R.fuego, B = ORO, Cn = CUERNO, Mb = MEMBRANA;

    /* El ala, abierta y alzada por detrás. */
    const [ala, huesosAla] = alaMembrana(g, [62, 50], [71, 7], [[86, 1], [93, 14], [93, 33], [90, 51]], [79, 63], Mb,
      { relieve: 3.5, volumen: 0.55, max: 3, tramado: 0.15 }, E, { min: 2, max: 4, grueso: 4.6 }, 0.5);
    /* Venas de la membrana y su filo, más claro, para que se lea sobre la roca oscura. */
    for (const [x0, y0, x1, y1] of [[75, 16, 87, 22], [75, 30, 90, 38], [74, 43, 85, 54], [70, 22, 66, 36]]) trazo(g, ala, Mb, 1, [x0, y0, (x0 + x1) / 2 + 1, (y0 + y1) / 2 + 2, x1, y1]);
    cada(ala, (x, y) => { if (!huesosAla.tiene(x, y) && (!ala.tiene(x + 1, y) || !ala.tiene(x, y + 1)) && g.rampa(x, y) === Mb) pon(g, Mb, 3, [x, y]); });
    /* La luz de la lava se cuela por la membrana cerca de los huesos. */
    cada(ala, (x, y) => { if (!huesosAla.tiene(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => huesosAla.tiene(x + a, y + b)) && umbral(x, y) < 0.5 && g.rampa(x, y) === Mb) pon(g, Mb, Math.min(4, Mb.indexOf(g.get(x, y)) + 1), [x, y]); });
    pua(g, Cn, 71, 7, 67, 1, 1.6, { relieve: 1, min: 2 });
    for (const [x, y] of [[86, 1], [93, 14], [93, 33]]) pon(g, E, 4, [x - 1, y + 1]);

    /* La cola, que da la vuelta por delante de la pata de atrás, con su punta de flecha. */
    const cola = C().curva(86, 70, 95, 92, 66, 91, 10, 5).curva(66, 91, 54, 90.5, 46, 93, 5, 2);
    sombrear(cola, g, E, { relieve: 3.5, volumen: 0.3, max: 3, tramado: 0.15 });
    escamas(g, cola, E, 3, 3, 1);
    const flecha = C().poly([[47, 93], [41, 90], [44, 94.5], [38, 94.5]]).poly([[47, 91], [42, 88], [40, 92]]);
    sombrear(flecha, g, E, { relieve: 1.5, min: 1, max: 3, separar: 1, tramado: 0 });
    for (const [x, y] of [[80, 91], [72, 90], [63, 90], [55, 90]]) pua(g, Cn, x, y, x + 2, y - 4, 1.4, { relieve: 1, min: 2 });

    /* El cuerpo y la pata de atrás. */
    const anca = C().ell(81, 77, 10.5, 12).poly([[73, 84], [88, 84], [91, 94.5], [71, 94.5]]);
    sombrear(anca, g, E, { relieve: 7, volumen: 0.45, max: 3, tramado: 0.15 });
    escamas(g, anca, E, 5, 4, 2);
    trazo(g, anca, E, 1, [74, 74, 77, 82, 76, 88]);
    const cuerpo = C().ell(68, 68, 18, 15.5).ell(58, 62, 11, 12);
    sombrear(cuerpo, g, E, { relieve: 12, volumen: 0.5, caida: 0.15, separar: true, tramado: 0.15 });
    escamas(g, cuerpo, E, 6, 4, 2);
    for (const x of [74, 80, 86]) pua(g, Cn, x, 93, x - 4, 94.6, 1.3, { relieve: 1, min: 2 });

    /* Pecho y cuello con las placas del vientre, doradas. */
    const cuello = C().curva(61, 60, 48, 43, 36, 32, 18, 12);
    sombrear(cuello, g, E, { relieve: 7, volumen: 0.45, separar: true, tramado: 0.15 });
    escamas(g, cuello, E, 4, 3, 1, 1);
    const vientre = C().curva(33, 37, 41, 50, 50, 65, 6, 11).ell(54, 72, 7.5, 10).recortar(cuello.copia().unir(cuerpo));
    sombrear(vientre, g, O, { relieve: 3.5, volumen: 0.45, max: 4, tramado: 0 });
    /* Placas: una raya oscura cada pocas filas, con un filo de luz encima. */
    for (let j = 36; j <= 82; j += 3) cada(C().rect(0, j, W, 1).recortar(vientre), (x, y) => { pon(g, O, 1, [x, y]); if (vientre.tiene(x, y - 1)) pon(g, O, Math.min(4, O.indexOf(g.get(x, y - 1)) + 1), [x, y - 1]); });
    /* Monedas y una gema del tesoro, pegadas a las placas de tanto dormir encima. */
    for (const [x, y] of [[51, 74], [55, 78], [49, 69], [57, 72]]) if (vientre.tiene(x, y)) { pon(g, B, 4, [x, y]); pon(g, B, 3, [x + 1, y]); pon(g, B, 2, [x, y + 1]); pon(g, B, 1, [x + 1, y + 1]); }
    if (vientre.tiene(53, 66)) { pon(g, R.magia, 4, [53, 66]); pon(g, R.magia, 2, [54, 66], [53, 67]); }
    /* Púas del lomo, del cogote hasta la cola. */
    for (const [x, y, a, b] of [[41, 26, 5, -6], [46, 31, 6, -6], [51, 37, 6, -6], [56, 43, 6, -5], [62, 48, 6, -4], [69, 52, 6, -3], [76, 56, 6, -2], [83, 60, 6, 0], [88, 66, 5, 2]]) {
      const c = C().poly([[x - 2.6, y + 1.8], [x + a, y + b], [x + 2.6, y + 1.8]]);
      sombrear(c, g, Cn, { relieve: 1.4, min: 1, separar: 2, tramado: 0 });
      pon(g, Cn, 4, [Math.round(x + a * 0.4 - 1), Math.round(y + b * 0.4)]);
    }

    /* La pata de delante, plantada, con zarpas negras. */
    const brazo = C().curva(56, 68, 49, 78, 43, 86, 13, 9.5).ell(40, 89.4, 8.4, 5);
    sombrear(brazo, g, E, { relieve: 5, volumen: 0.4, separar: true, tramado: 0.15 });
    escamas(g, brazo, E, 3, 3, 2);
    trazo(g, brazo, E, 1, [50, 76, 46, 80, 44, 85]);
    trazo(g, brazo, E, 4, [53, 69, 49, 74]);
    for (const [x, y, a] of [[32, 91, -4], [36, 92, -3.5], [41, 92, -2.4], [45, 92.5, -1.2]]) pua(g, UNA, x + 1, y, x + a, 94.7, 1.8, { relieve: 1, min: 2 });
    /* La otra pata, detrás y más oscura. */
    const brazo2 = C().curva(65, 79, 62, 86, 60, 90, 8.4, 7.2).ell(58, 91, 5.4, 3.6);
    detras(g, brazo2, E, { relieve: 2.5, max: 2, tramado: 0 });
    for (const x of [55, 59]) pua(g, UNA, x, 93, x - 2.5, 94.7, 1.2, { relieve: 1, min: 1 }, false);

    /* La cabeza: cuernos hacia atrás, ceño de púas, ojo de oro y las fauces abiertas con fuego dentro. */
    const cuernos = C().curva(34, 18, 43, 9, 56, 8, 5.4, 1).curva(37, 24, 46, 19, 54, 20, 4.2, 1);
    sombrear(cuernos, g, Cn, { relieve: 2.2, volumen: 0.4, min: 1, tramado: 0 });
    /* Anillos del cuerno. */
    for (const t of [0.2, 0.35, 0.5, 0.65]) { const [x, y] = bez(34, 18, 43, 9, 56, 8, t); pon(g, Cn, 1, [Math.round(x), Math.round(y) + 1], [Math.round(x) + 1, Math.round(y) + 1]); }
    trazo(g, cuernos, Cn, 4, [36, 15, 42, 10, 48, 8.5]);
    const craneo = C().ell(30, 25, 9.6, 7.8).poly([[29, 18], [14, 21], [5, 26], [4, 29], [10, 32], [29, 32], [37, 30]]);
    sombrear(craneo, g, E, { relieve: 6, volumen: 0.45, separar: true, tramado: 0.15 });
    escamas(g, craneo, E, 3, 3, 2);
    const mandibula = C().poly([[37, 34], [29, 36], [17, 40], [7, 44], [6, 47], [14, 47.5], [29, 44], [38, 40]]);
    sombrear(mandibula, g, E, { relieve: 3.5, volumen: 0.4, separar: true, tramado: 0.15 });
    trazo(g, mandibula, O, 2, [8, 46.5, 19, 45.5, 33, 41]);
    trazo(g, mandibula, O, 3, [9, 46, 18, 45]);
    /* El fuego de la garganta, más claro al fondo. */
    const boca = C().poly([[36, 31], [29, 32], [10, 32], [6, 34], [7, 44], [17, 40], [29, 36], [37, 34]]);
    boca.restar(craneo).restar(mandibula);
    cada(boca, (x, y) => {
      const f = Math.min(1, (x - 6) / 26) * 4 + (umbral(x, y) - 0.5) * 0.8;
      g.set(x, y, F[Math.max(1, Math.min(4, Math.round(f)))], F);
    });
    /* La lengua bífida. */
    trazo(g, boca, R.sangre, 3, [24, 37, 16, 39, 9, 40]); pon(g, R.sangre, 4, [20, 37]);
    /* Dientes arriba y abajo. */
    for (const x of [8, 11, 15, 19, 23, 27]) pua(g, HUESO, x, 31.5, x + 0.5, 35.5, 1.1, { relieve: 1, min: 3 }, false);
    for (const [x, y] of [[9, 43.5], [13, 42], [17, 40.5], [21, 39.2]]) pua(g, HUESO, x, y + 0.5, x + 0.5, y - 3, 1, { relieve: 1, min: 3 }, false);
    /* Ceño con púas, ojo y nariz humeante. */
    const ceno = C().curva(14, 22, 23, 17, 32, 18, 3.6, 3);
    sombrear(ceno, g, E, { relieve: 1.6, min: 2, separar: 1, tramado: 0 });
    for (const [x, y] of [[20, 18], [26, 17], [31, 18]]) pua(g, Cn, x, y, x + 3.5, y - 5, 1.2, { relieve: 1, min: 2 });
    new Capa(W, H).ell(24, 22, 2.8, 1.6).pintar(g, NEGRO, { plano: 0 });
    pon(g, B, 4, [23, 21], [24, 21], [22, 22]); pon(g, B, 3, [25, 21], [23, 22]);
    pon(g, F, 2, [24, 23], [25, 22]); pon(g, NEGRO, 0, [25, 23], [26, 22]);
    pon(g, HUESO, 4, [22, 21]);
    /* Ollar. */
    pon(g, E, 0, [7, 25], [8, 25], [8, 26]); pon(g, E, 1, [9, 26]);
    pon(g, E, 4, [10, 23], [13, 22], [16, 21], [5, 27], [6, 26]);
    /* Golas: púas de la mejilla hacia atrás. */
    for (const [x, y, a, b] of [[36, 29, 8, -2.4], [35, 40, 7, 4]]) {
      const c = C().poly([[x, y - 1.8], [x + a, y + b], [x, y + 1.8]]);
      sombrear(c, g, Cn, { relieve: 1, min: 2, separar: 1, tramado: 0 });
      pon(g, Cn, 4, [x + 1, y - 1]);
    }
    /* Sombra que la cabeza echa sobre el cuello. */
    tono(g, C().ell(43, 46, 8, 5), 1, E);
    tono(g, C().ell(43, 46, 8, 5), 1, O);
    trazo(g, craneo, E, 1, [29, 26, 32, 30]);
    /* Borde de lava: la luz cálida de la izquierda recorta la silueta. */
    for (const ram of [E, O]) bordeLuz(g, ram, 4, ram, (x, y) => !g.get(x - 1, y) && y > 18);
    /* Y un rebote más apagado por la derecha y por abajo, que la separa del suelo. */
    bordeReflejo(g, E, 2, E, (x, y) => y > 46 && E.indexOf(g.get(x, y)) < 2, true);
    for (let x = 0; x < W; x++) g.quitar(x, H - 1);
    contornear(g);

    /* Chispas y humo, sin contorno. */
    for (const [x, y, k] of [[2, 36, 4], [1, 40, 3], [3, 33, 3], [1, 38, 2], [4, 48, 2], [2, 43, 3], [1, 46, 1]]) if (!g.get(x, y)) pon(g, F, k, [x, y]);
    for (const [x, y, k] of [[5, 22, 3], [3, 19, 2], [6, 18, 2], [2, 15, 1], [4, 13, 1]]) if (!g.get(x, y)) pon(g, R.piedra, k, [x, y]);
    destello(g, 55, 8, Cn);
    return g;
  }

  /* =====================================================================
     Nhazgul, el Devorador de Estrellas: un ojo, unas fauces y un cielo dentro.
     ===================================================================== */
  function devorador() {
    const g = new Rejilla(W, H), V = VACIO, Mg = R.magia, Ci = CIAN, A = AURA, az = PX.azar(91);
    const tentaculos = (op, ...l) => { const c = C(); l.forEach(a => c.curva(...a)); sombrear(c, g, V, { relieve: 3.5, tramado: 0.2, ...op }); return c; };
    /* Ventosas que brillan en la cara de abajo de cada tentáculo. */
    const ventosas = (c, ram, k = 3) => {
      for (let y = 1; y < H; y++) for (let x = 1; x < W; x++)
        if (c.tiene(x, y) && !c.tiene(x, y + 1) && c.tiene(x - 1, y) && c.tiene(x, y - 2) && (x * 3 + y) % 5 === 0 && g.rampa(x, y) === V) {
          pon(g, ram, k, [x, y - 1]); pon(g, ram, k - 2, [x + 1, y - 1]); pon(g, ram, k - 1, [x, y - 2]);
        }
    };

    /* Tentáculos de atrás, más oscuros. */
    ventosas(tentaculos({ max: 2 }, [74, 53, 94, 58, 92, 36, 9.6, 2.4], [70, 62, 84, 84, 93, 82, 9.6, 2.4], [58, 67, 65, 86, 55, 94.5, 8.4, 2.4]), Ci, 3);

    /* La corona de cuernos, con anillos y las puntas encendidas. */
    const cuernos = new Capa(W, H);
    const PUNTAS = [[29, 27, 14, 17, 13, 2, 8.4], [40, 19, 34, 7, 37, 0.5, 7.2], [53, 16, 55, 5, 62, 0.5, 8.4], [66, 19, 76, 11, 82, 1, 7.2], [76, 28, 88, 25, 92, 13, 7.2]];
    for (const [x0, y0, cx, cy, x1, y1, gr] of PUNTAS) cuernos.curva(x0, y0, cx, cy, x1, y1, gr, 1);
    sombrear(cuernos, g, Mg, { relieve: 3, max: 3, volumen: 0.3, separar: true, tramado: 0.15 });
    for (const [x0, y0, cx, cy, x1, y1] of PUNTAS) {
      for (const t of [0.25, 0.4, 0.55, 0.68]) {
        const [x, y] = bez(x0, y0, cx, cy, x1, y1, t);
        pon(g, Mg, 1, [Math.round(x), Math.round(y)], [Math.round(x) + 1, Math.round(y)], [Math.round(x) - 1, Math.round(y)]);
        pon(g, Mg, 4, [Math.round(x) - 1, Math.round(y) - 1]);
      }
      for (const t of [0.8, 0.86, 0.92, 0.97, 1]) {
        const [x, y] = bez(x0, y0, cx, cy, x1, y1, t);
        pon(g, Ci, t > 0.95 ? 4 : t > 0.84 ? 3 : 2, [Math.round(x), Math.round(y)]);
        if (t < 0.9) pon(g, Ci, 2, [Math.round(x) + 1, Math.round(y)]);
      }
    }

    /* El cuerpo: una masa de vacío. */
    const cuerpo = C().ell(53, 41, 30, 24).ell(40, 50, 20, 17).ell(67, 53, 14, 12);
    sombrear(cuerpo, g, V, { relieve: 14, volumen: 0.5, separar: true, tramado: 0.2 });
    /* Nebulosa en espiral y estrellas sueltas dentro del vacío. */
    cada(cuerpo, (x, y) => {
      const a = Math.atan2(y - 46, x - 60), d = Math.hypot(x - 60, y - 46), v = Math.sin(a * 2 + d * 0.2);
      if (v > 0.45 && umbral(x, y) < (v - 0.45) * 1.8) pon(g, v > 0.9 && d > 10 ? A : Mg, v > 0.88 && d > 10 ? 1 : 1, [x, y]);
      else if (v > 0.8 && d < 26 && umbral(x, y) < 0.3) pon(g, Mg, 2, [x, y]);
      else if (v < -0.8 && d < 24 && umbral(x, y) < 0.2) pon(g, Ci, 1, [x, y]);
    });
    for (let i = 0; i < 240; i++) {
      const x = Math.floor(az() * W), y = Math.floor(az() * H), r = az();
      if (cuerpo.tiene(x - 2, y) && cuerpo.tiene(x + 2, y) && cuerpo.tiene(x, y - 2) && cuerpo.tiene(x, y + 2)) pon(g, r > 0.85 ? HUESO : r > 0.45 ? Ci : Mg, r > 0.93 ? 4 : 3, [x, y]);
    }
    /* Estrellas grandes con sus cuatro puntas, y una galaxia pequeña. */
    for (const [x, y, ram] of [[70, 36, Ci], [75, 48, HUESO], [60, 26, Mg], [58, 53, Ci], [80, 40, Mg]]) {
      if (!cuerpo.tiene(x, y)) continue;
      pon(g, ram, 4, [x, y]); pon(g, ram, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
      if (ram === HUESO) pon(g, Ci, 2, [x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2]);
    }
    for (let t = 0; t < 1; t += 0.04) {
      const a = t * 9, d = 1 + t * 5;
      const x = Math.round(68 + Math.cos(a) * d * 1.4), y = Math.round(60 + Math.sin(a) * d * 0.7);
      if (cuerpo.tiene(x, y)) pon(g, t < 0.3 ? HUESO : A, t < 0.3 ? 4 : 2, [x, y]);
    }
    /* Ojillos menores que se abren en la carne del vacío: almendras cian con la pupila rasgada. */
    for (const [x, y] of [[66, 26], [77, 44], [73, 58]]) {
      if (!cuerpo.tiene(x - 3, y) || !cuerpo.tiene(x + 3, y)) continue;
      new Capa(W, H).ell(x, y, 3.2, 1.9).pintar(g, A, { plano: 1 });
      new Capa(W, H).ell(x, y, 2.2, 1).pintar(g, Ci, { plano: 3 });
      pon(g, Ci, 4, [x - 1, y - 1], [x - 2, y]); pon(g, Ci, 2, [x + 1, y + 1], [x + 2, y]);
      pon(g, V, 0, [x, y - 1], [x, y], [x, y + 1]);
      pon(g, A, 3, [x - 2, y - 2], [x - 1, y - 2], [x, y - 2]);
    }

    /* El ojo: párpado de vacío con borde violeta, globo cian, iris claro y pupila rasgada. */
    const ox = 41, oy = 35;
    new Capa(W, H).ell(ox, oy, 17.4, 13.2).pintar(g, V, { plano: 0 });
    for (let a = 3.25; a < 6.2; a += 0.04) pon(g, A, a > 3.9 && a < 5.4 ? 3 : 2, [Math.round(ox + Math.cos(a) * 16.8), Math.round(oy + Math.sin(a) * 12.6)]);
    for (let a = 3.6; a < 5.6; a += 0.06) pon(g, Mg, 1, [Math.round(ox + Math.cos(a) * 15.4), Math.round(oy + Math.sin(a) * 11.5)]);
    for (let a = 0.4; a < 2.8; a += 0.05) pon(g, V, 3, [Math.round(ox + Math.cos(a) * 16.3), Math.round(oy + Math.sin(a) * 12.2)]);
    const ojo = C().ell(ox, oy, 14.4, 10.3);
    sombrear(ojo, g, Ci, { relieve: 6, volumen: 0.45, min: 1, tramado: 0.2 });
    /* Venas oscuras hacia el borde del ojo, ramificadas. */
    for (const [x0, y0, x1, y1] of [[27, 32, 32, 33], [28, 39, 33, 37], [29, 35, 31, 36], [53, 29, 49, 32], [54, 38, 50, 37], [43, 45, 42, 41], [36, 44, 37, 41], [47, 26, 46, 29]]) trazo(g, ojo, Ci, 1, [x0, y0, x1, y1]);
    /* Sombra del párpado de arriba sobre el globo. */
    cada(ojo, (x, y) => { if (!ojo.tiene(x, y - 2) && y < oy) pon(g, Ci, 1, [x, y]); });
    const iris = C().ell(ox - 1, oy, 7.7, 7.9).recortar(ojo);
    sombrear(iris, g, A, { relieve: 3.5, min: 1, max: 3, volumen: 0.45, tramado: 0.2 });
    /* Fibras del iris, radiales. */
    for (const a of [3.4, 3.9, 4.4, 4.9]) trazo(g, iris, A, 4, [ox - 1 + Math.cos(a) * 3.5, oy + Math.sin(a) * 3.5, ox - 1 + Math.cos(a) * 6.2, oy + Math.sin(a) * 6.4]);
    for (const a of [0.3, 0.9, 1.5, 2.1]) trazo(g, iris, A, 1, [ox - 1 + Math.cos(a) * 3.5, oy + Math.sin(a) * 3.5, ox - 1 + Math.cos(a) * 6.2, oy + Math.sin(a) * 6.4]);
    trazo(g, iris, Ci, 4, [ox - 6, oy - 3, ox - 5, oy - 7, ox - 1, oy - 7.5]);
    for (let a = 0; a < 6.28; a += 0.06) { const x = Math.round(ox - 1 + Math.cos(a) * 7.8), y = Math.round(oy + Math.sin(a) * 8); if (iris.tiene(x, y)) pon(g, Mg, 0, [x, y]); }
    const pupila = C().poly([[ox - 1, oy - 7.5], [ox + 0.8, oy], [ox - 1, oy + 7.5], [ox - 2.8, oy]]);
    pupila.pintar(g, V, { plano: 0 });
    pon(g, HUESO, 4, [ox - 7, oy - 6], [ox - 6, oy - 6], [ox - 7, oy - 5], [ox + 4, oy - 4]);
    pon(g, Ci, 4, [ox - 8, oy - 4], [ox + 5, oy + 4], [ox - 6, oy - 7]);

    /* Las fauces, llenas de colmillos y con un resplandor de estrellas tragadas al fondo. */
    const boca = C().poly([[20, 55], [43, 52], [64, 54], [60, 64], [48, 68.5], [31, 67.5]]);
    boca.pintar(g, V, { plano: 0 });
    cada(boca, (x, y) => {
      const f = 1 - Math.hypot((x - 43) / 17, (y - 61.5) / 5.5);
      if (f > 0 && umbral(x, y) < f * 1.5) pon(g, Ci, f > 0.6 ? 3 : f > 0.3 ? 2 : 1, [x, y]);
    });
    pon(g, HUESO, 4, [42, 61], [48, 62], [36, 62]);
    pon(g, Ci, 4, [43, 62], [37, 62], [47, 61]);
    /* La garganta: una espiral de luz que se pierde hacia dentro. */
    for (let t = 0; t < 1; t += 0.05) { const a = t * 10, d = t * 4; pon(g, t > 0.6 ? Ci : HUESO, t > 0.6 ? 3 : 4, [Math.round(42 + Math.cos(a) * d * 1.6), Math.round(62 + Math.sin(a) * d * 0.6)]); }
    const labio = C();
    for (let a = 0; a < 6.28; a += 0.02) {
      const x = Math.round(42 + Math.cos(a) * 22.2), y = Math.round(60 + Math.sin(a) * 8.2);
      if ((!boca.tiene(x, y) && boca.tiene(x + Math.sign(42 - x), y)) || (boca.tiene(x, y + Math.sign(60 - y)) && !boca.tiene(x, y))) labio.on(x, y);
    }
    cada(boca, (x, y) => { if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !boca.tiene(x + a, y + b) && cuerpo.tiene(x + a, y + b))) labio.on(x, y); });
    labio.recortar(cuerpo).pintar(g, A, { plano: 1 });
    /* Colmillos de arriba (largos) y de abajo (cortos), curvados. */
    const LARGO_A = [6, 4, 8.5, 5, 7.5, 4, 9, 5, 6.5, 4], LARGO_B = [4, 6, 3, 6.5, 4, 5.5, 3, 5];
    for (let i = 0; i < 10; i++) {
      const x = 23 + i * 4.1, ya = 54.6 - Math.sin(i / 9 * Math.PI) * 2 + (i > 5 ? (i - 5) * 0.25 : 0);
      pua(g, HUESO, x, ya, x + (i < 5 ? 1.2 : -0.6), ya + LARGO_A[i], LARGO_A[i] > 6 ? 1.7 : 1.3, { relieve: 1, min: 2 });
    }
    for (let i = 0; i < 8; i++) {
      const x = 28 + i * 4.4, yb = 67 - Math.sin(i / 7 * Math.PI) * 1.2 - (i > 5 ? 1 : 0);
      pua(g, HUESO, x, yb, x + (i < 4 ? 0.8 : -0.8), yb - LARGO_B[i], 1.4, { relieve: 1, min: 2 });
    }

    /* Tentáculos de delante, que cuelgan hasta abajo y se enroscan hacia los héroes. */
    const delante = tentaculos({ separar: true, volumen: 0.3 },
      [29, 62, 10, 65, 7, 84, 10.8, 3], [36, 67, 31, 86, 17, 92, 10.8, 3], [48, 68, 50, 84, 41, 94.5, 9.6, 2.4], [62, 62, 72, 79, 78, 94.5, 9.6, 3], [22, 46, 5, 43, 2, 60, 8.4, 2.4]);
    ventosas(delante, A, 3);
    /* Rizos al final de los tentáculos. */
    const rizos = C().curva(7, 84, 8, 90, 13, 89, 3, 1.8).curva(17, 92, 12, 94, 11, 89.5, 2.6, 1.4).curva(2, 60, 1, 66, 6, 66, 2.4, 1.4);
    sombrear(rizos, g, V, { relieve: 1.2, separar: true, tramado: 0 });

    /* Luz magenta por arriba y cian por abajo, para que el vacío se lea sobre el cielo del abismo. */
    const filos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.rampa(x, y) !== V) continue;
      if (!g.get(x - 1, y) || !g.get(x, y - 1)) filos.push([x, y, A, 3]);
      else if (!g.get(x + 1, y) || !g.get(x, y + 1)) filos.push([x, y, Ci, 2]);
      else if ((!g.get(x - 2, y) || !g.get(x, y - 2)) && umbral(x, y) < 0.5) filos.push([x, y, Mg, 2]);
      else if ((!g.get(x + 2, y) || !g.get(x, y + 2)) && umbral(x, y) < 0.3) filos.push([x, y, Ci, 1]);
    }
    for (const [x, y, ram, k] of filos) pon(g, ram, k, [x, y]);
    for (let x = 0; x < W; x++) g.quitar(x, H - 1);
    contornear(g, V[0], 0, V);

    /* Polvo de estrellas alrededor, sin contorno. */
    for (const [x, y, ram, k] of [[3, 14, Ci, 4], [9, 31, Mg, 3], [93, 60, Ci, 3], [1, 74, Mg, 4], [24, 7, Mg, 3], [89, 89, Ci, 4], [70, 5, Ci, 3], [4, 40, Ci, 3], [93, 42, Mg, 2], [46, 4, Mg, 2], [25, 79, Ci, 2], [71, 72, Mg, 2], [91, 7, Mg, 3], [30, 18, Ci, 2], [86, 70, Ci, 2]])
      if (!g.get(x, y)) pon(g, ram, k, [x, y]);
    destello(g, 6, 5, Ci, 2); destello(g, 87, 74, A, 2); destello(g, 19, 77, Ci, 1); destello(g, 47, 8, A, 1);
    return g;
  }

  /* ---------- Registro ---------- */
  window.MONSTRUOS_64 = window.MONSTRUOS_64 || {};
  Object.assign(window.MONSTRUOS_64, { trol, liche, vampiro, dragon, devorador });
})();
