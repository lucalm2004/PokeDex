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
     op.tramado = anchura del tramado (0 = bandas limpias). */
  function sombrear(capa, g, ram, op = {}) {
    const w = W, h = H, Rr = op.relieve || 6, m = capa.m;
    const d = new Float32Array(w * h);
    for (let i = 0; i < d.length; i++) d[i] = m[i] ? 1e6 : 0;
    const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!d[i]) continue;
      d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
    }
    const alto = (x, y) => { if (!capa.tiene(x, y)) return 0; const v = Math.min(D(x, y), Rr) / Rr; return Math.sqrt(1 - (1 - v) * (1 - v)); };
    const L = op.luz || [-0.5, -0.62, 0.6], ln = Math.hypot(...L), k = op.fuerza || 2.4;
    let y0 = h, y1 = 0, x0 = w, x1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    const cx = op.centro ? op.centro[0] : (x0 + x1) / 2, cy = op.centro ? op.centro[1] : (y0 + y1) / 2;
    const rx = Math.max(1, (x1 - x0) / 2), ry = Math.max(1, (y1 - y0) / 2), vol = op.volumen || 0;
    const TH = [-0.4, 0.02, 0.4, 0.74, 0.965, 1.2], s = op.tramado === undefined ? 0.4 : op.tramado;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k, ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
      const l = (nx * L[0] + ny * L[1] + L[2]) / ln / Math.hypot(nx, ny, 1) + (op.sesgo || 0) - (op.caida || 0) * (y - y0) / Math.max(1, y1 - y0)
        - vol * (((x - cx) / rx) * 0.55 + ((y - cy) / ry) * 0.75);
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
     «claro» = tono de la rampa vecina para el contorno iluminado (0 = el más oscuro). */
  function contornear(g, oscuro = PX.CONTORNO, claro = 0) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      let col = oscuro, ram = null;
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

    /* El manto: túnica violeta oscura hasta el suelo, deshilachada. */
    const manto = C().poly([[40, 30], [56, 30], [62, 41], [67, 60], [72, 78], [78, 94.5], [24, 94.5], [28, 78], [32, 60], [35, 41]]);
    for (const [x, y, a] of [[27, 88, 1.8], [34, 90, 1.5], [42, 87, 2], [56, 89, 1.8], [63, 86, 2.2], [71, 89, 1.8], [76, 91, 1.2]])
      manto.restar(C().poly([[x - a, 95.5], [x, y], [x + a, 95.5]]));
    sombrear(manto, g, V, { relieve: 7, volumen: 0.4, caida: 0.35 });
    /* Pliegues largos, con su lado de luz. */
    for (const [l, k] of [[[60, 46, 65, 68, 69, 91], 0], [[55, 52, 58, 72, 60, 88], 0], [[34, 62, 31, 76, 30, 89], 0], [[64, 70, 68, 82, 72, 92], 1]]) {
      trazo(g, manto, V, k, l);
      trazo(g, manto, V, Math.min(4, k + 3), [l[0] - 1, l[1] + 2, l[2] - 1, l[3], l[4] - 1, l[5] - 1]);
    }
    trazo(g, manto, V, 3, [37, 43, 35, 60, 32, 74], [59, 41, 61, 53, 62, 62]);
    /* Bordado de oro en el bajo, siguiendo los jirones. */
    cada(manto, (x, y) => {
      if (y < 80 || !manto.tiene(x, y) || manto.tiene(x, y + 3)) return;
      if (!manto.tiene(x, y + 2)) pon(g, B, (x + y) % 4 ? 2 : 3, [x, y]);
    });
    /* El faldón de delante, negro, con ribete de oro y runas que brillan. */
    const panel = C().poly([[44, 34], [51, 34], [53, 60], [55, 94.5], [37, 94.5], [40, 60]]).recortar(manto);
    sombrear(panel, g, N, { relieve: 3.5, caida: 0.3, max: 3 });
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
    for (let y = 59; y < 72; y += 2) pon(g, B, y % 4 ? 3 : 2, [Math.round(58 + (y - 59) * 0.15), y]);
    const amuleto = new Capa(W, H).poly([[60, 72], [62, 75], [60, 78], [58, 75]]);
    sombrear(amuleto, g, E, { relieve: 1.5, min: 1, tramado: 0 });
    pon(g, E, 4, [59, 74]);

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

  /* ---------- Registro ---------- */
  window.MONSTRUOS_64 = window.MONSTRUOS_64 || {};
  Object.assign(window.MONSTRUOS_64, { trol, liche });
})();
