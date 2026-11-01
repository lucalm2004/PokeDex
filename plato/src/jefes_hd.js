/* Dados y Mazmorras · jefes en alta definición (80×80).
   El trol del puente, Malakar el liche, Lord Varkhul, Ignárax y Nhazgul. Cada función devuelve una
   Rejilla nueva de 80×80 con contorno, mirando a la izquierda (hacia los héroes) y con los pies en la fila 78.
   Misma identidad que los de monstruos.js, con más detalle: luz desde arriba a la izquierda. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral } = PX;
  const W = 80, H = 80;
  const NEGRO = R.pelo.negro, HUESO = R.hueso;

  /* Rampas propias (5 tonos, de la sombra al brillo). */
  const TROL = ["#1c241d", "#313f2e", "#4f6247", "#788c63", "#a9bb8a"];        // piel gris verdosa del trol
  const TROL_V = ["#2e3324", "#4b5238", "#6f7653", "#979c72", "#c3c49a"];      // barriga y palmas, más claras
  const MUSGO = ["#141c0e", "#22321a", "#3a5226", "#5c7a36", "#8aa654"];       // líquenes y pelambre
  const PALIDO = ["#4a4656", "#77728a", "#a8a3b8", "#d6d2e0", "#f6f4fb"];      // piel del vampiro
  const NOCHE = ["#07060b", "#110f19", "#1d1a29", "#2e2a40", "#4a4462"];       // paño negro azulado del vampiro
  const AZABACHE = ["#050408", "#0e0c14", "#1c1826", "#342d46", "#5c5276"];    // su pelo engominado
  const VIOLETA = ["#120818", "#25122f", "#3f1f50", "#653579", "#9257a6"];     // túnica del liche
  const VERDE = ["#0a2414", "#145a2c", "#26a04a", "#5ee07a", "#d2ffd8"];       // fuego fatuo del liche
  const MEMBRANA = ["#1a0507", "#33090c", "#541310", "#7a2016", "#a0331f"];   // piel de las alas
  const ESCAMA = ["#2c0a0a", "#5a1410", "#8e2418", "#c4402a", "#ee7a52"];      // escamas de Ignárax
  const VACIO = ["#040208", "#0b0616", "#170d2c", "#2a1748", "#432670"];       // cuerpo de Nhazgul
  const CIAN = ["#08222a", "#0f4a56", "#1c8590", "#47c6c8", "#b6fff2"];        // su ojo y sus brillos
  const ORO = R.bronce;

  /* ---------- Herramientas ---------- */
  const C = () => new Capa(W, H);
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Pinta una capa solo donde no hay nada todavía, como si quedara detrás. */
  function detras(g, capa, ram, op) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.get(x, y)) capa.off(x, y);
    return capa.pintar(g, ram, op);
  }
  /* Rellena una capa con un degradado tramado entre dos tonos; f(x, y) va de 0 a 1. */
  function tramar(g, capa, ram, i0, i1, f) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (capa.tiene(x, y)) g.set(x, y, ram[f(x, y) > umbral(x, y) ? i1 : i0], ram);
  }
  /* Baja (o sube, con n negativo) el tono de lo ya pintado dentro de una capa: sombras arrojadas y reflejos. */
  function tono(g, capa, n, soloRam = null, tramado = 1) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!capa.tiene(x, y) || !g.get(x, y)) continue;
      const ram = g.rampa(x, y);
      if (!ram || (soloRam && ram !== soloRam)) continue;
      if (tramado < 1 && umbral(x, y) >= tramado) continue;
      const i = ram.indexOf(g.get(x, y));
      if (i < 0) continue;
      g.set(x, y, ram[Math.max(0, Math.min(ram.length - 1, i - n))], ram);
    }
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
  function destello(g, x, y, ram = ORO, largo = 1) {
    pon(g, ram, 4, [x, y]);
    for (let k = 1; k <= largo; k++)
      [[k, 0], [-k, 0], [0, k], [0, -k]].forEach(([a, b]) => { if (!g.get(x + a, y + b)) pon(g, k === largo && largo > 1 ? ram : HUESO, k === largo && largo > 1 ? 3 : 4, [x + a, y + b]); });
  }
  /* Borde iluminado arriba a la izquierda, para que lo muy oscuro se lea sobre fondos oscuros. */
  function bordeLuz(g, ram, t = 3) {
    const borde = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < t) borde.push([x, y]);
    pon(g, ram, t, ...borde);
  }
  /* Luz de rebote por el lado de la sombra (derecha): separa lo oscuro del fondo oscuro. */
  function bordeReflejo(g, ram, t = 2, destino = ram, f = () => true) {
    const borde = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && !g.get(x + 1, y) && g.get(x - 1, y) && f(x, y)) borde.push([x, y]);
    pon(g, destino, t, ...borde);
  }
  /* Línea de pliegue o de músculo de un tono fijo, recortada a una capa. */
  function trazo(g, capa, ram, i, ...lineas) {
    const c = C();
    for (const l of lineas) l.length === 4 ? c.linea(...l, 1) : c.curva(...l, 1);
    if (capa) c.recortar(capa);
    c.pintar(g, ram, { plano: i });
  }
  /* Como Capa.pintar, pero con el tono continuo y un tramado estrecho entre bandas, para volúmenes grandes.
     op.caida oscurece hacia abajo (luz cenital); op.tramado = anchura del tramado (0 = bandas limpias). */
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
    /* op.volumen: además del relieve del borde, un degradado de esfera desde arriba a la izquierda. */
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
  /* Garras o colmillos: triángulos finos de la base a la punta. */
  function pua(g, ram, x0, y0, x1, y1, ancho = 1.2, op = { relieve: 1, min: 2 }) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * ancho, ny = dx / l * ancho;
    new Capa(W, H).poly([[x0 + nx, y0 + ny], [x1, y1], [x0 - nx, y0 - ny]]).pintar(g, ram, op);
  }

  /* ---------- El trol del puente ---------- */
  function trol() {
    const g = new Rejilla(W, H), P = TROL, V = TROL_V, M = R.madera, F = R.hierro, Mu = MUSGO;

    /* La porra: un tronco con aros de hierro y clavos, alzada por encima de la cabeza. */
    const porra = C().curva(69, 19, 54, 8, 34, 6, 4, 11).ell(33, 6.5, 5.6, 5.2);
    sombrear(porra, g, M, { relieve: 5, volumen: 0.3 });
    for (const [i, j] of [[38, 4], [44, 5], [36, 9], [49, 8], [31, 3], [41, 8]]) pon(g, M, 1, [i, j], [i + 1, j]);
    for (const [i, j] of [[37, 3], [43, 4], [33, 2]]) pon(g, M, 4, [i, j]);
    for (const ax of [40.5, 51]) {
      const aro = C().linea(ax - 1.5, -2, ax + 1.5, 16, 2).recortar(porra);
      aro.pintar(g, F, { relieve: 1, min: 1 });
      pon(g, F, 4, [Math.round(ax - 1), 2]);
    }
    for (const [x, y, a, b] of [[30, 1, -2, -2], [27, 6, -3, 0], [30, 11, -2, 2], [36, 0, 0, -3], [35, 12, 0, 2]]) {
      pua(g, F, x, y, x + a, y + b, 1, { relieve: 1, min: 2 });
    }
    pon(g, F, 4, [28, 6], [36, 0]);

    /* Brazo de atrás, alzado: del hombro al codo, que asoma por la derecha, y la mano en el mango. */
    const brazoAtras = C().curva(52, 25, 64, 22, 70, 31, 11, 8).curva(70, 31, 73, 24, 66, 17, 8, 7);
    sombrear(brazoAtras, g, P, { relieve: 5, caida: 0.3, max: 3 });
    trazo(g, brazoAtras, P, 1, [62, 27, 66, 30, 68, 35]);
    const manoAtras = C().ell(64, 15, 4.6, 4.2).ell(61, 13.5, 2.4, 2.6);
    sombrear(manoAtras, g, P, { relieve: 3, max: 3, separar: true });
    for (const j of [12, 14.5, 17]) trazo(g, manoAtras, P, 1, [60, j, 63, j + 0.5]);
    pon(g, P, 4, [60, 11], [62, 10], [63, 11]);
    pon(g, M, 2, [68, 18], [69, 19]);

    /* Pierna de atrás. */
    const piernaAtras = C().curva(48, 54, 56, 62, 54, 72, 12, 9).rect(48, 72, 14, 6).ell(55, 74, 7, 3.5);
    sombrear(piernaAtras, g, P, { relieve: 5, max: 2, caida: 0.4 });
    for (const x of [49, 53, 57]) pua(g, NEGRO, x, 77, x - 2, 78.4, 1.1, { relieve: 1, min: 2 });

    /* El cuerpo: joroba enorme, hombros caídos y barriga. */
    const cuerpo = C().ell(43, 31, 17, 15).ell(50, 24, 10, 9).ell(40, 46, 15, 12).ell(32, 28, 9, 8);
    sombrear(cuerpo, g, P, { relieve: 10, volumen: 0.45, caida: 0.2, separar: true });
    const barriga = C().ell(37, 47, 11, 9.5).recortar(cuerpo);
    sombrear(barriga, g, V, { relieve: 7, volumen: 0.4, caida: 0.2 });
    tono(g, C().ell(43, 56, 14, 3), 1, V);
    trazo(g, barriga, V, 1, [30, 42, 36, 45, 43, 43], [31, 50, 36, 52, 42, 51]);
    pon(g, V, 0, [36, 47], [37, 48]);
    /* Pectoral y joroba marcados. */
    trazo(g, cuerpo, P, 1, [30, 33, 38, 38, 46, 34], [47, 16, 54, 18, 58, 26]);
    trazo(g, cuerpo, P, 3, [46, 15, 52, 16, 56, 21]);
    /* Pelambre de musgo por el lomo: mechones que caen hacia atrás. */
    const crin = C();
    for (let i = 0; i < 7; i++) {
      const x = 32 + i * 3.8, y = 18 + Math.abs(i - 3) * 0.9;
      crin.curva(x, y + 4, x + 1, y - 2, x + 5, y - 3 - (i % 2) * 2, 3.2, 1);
    }
    sombrear(crin, g, Mu, { relieve: 1.5, max: 3, separar: true });
    /* Taparrabos de cuero con cuerda y un hueso. */
    const trapo = C().poly([[26, 54], [54, 53], [55, 60], [50, 59], [47, 66], [43, 60], [38, 64], [34, 59], [28, 63], [25, 58]]);
    trapo.pintar(g, R.pelo.castano, { relieve: 3, separar: true });
    trazo(g, trapo, R.pelo.castano, 1, [32, 56, 33, 61], [44, 56, 46, 63], [39, 56, 38, 62]);
    const cuerda = C().curva(25, 54.5, 40, 57, 55, 53.5, 2);
    cuerda.pintar(g, R.tela.ocre, { relieve: 1, max: 3, separar: true });
    for (let x = 26; x <= 54; x += 3) pon(g, R.tela.ocre, 1, [x, Math.round(54.5 + Math.sin((x - 25) / 30 * Math.PI) * 2)]);
    new Capa(W, H).linea(29, 56, 27, 65, 2).ell(27, 66, 1.6, 1.4).ell(29, 55.5, 1.6, 1.4).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });

    /* Pierna de delante, combada, con el pie plantado y garras negras. */
    const pierna = C().curva(34, 56, 26, 64, 29, 72, 13, 9).rect(20, 72, 16, 6).ell(24, 74.5, 6, 3.6);
    sombrear(pierna, g, P, { relieve: 5, volumen: 0.35, separar: true });
    trazo(g, pierna, P, 1, [24, 63, 27, 66, 26, 70]);
    for (const x of [19, 23, 27]) pua(g, NEGRO, x + 1, 77, x - 2, 78.4, 1.2, { relieve: 1, min: 2 });
    pon(g, P, 1, [30, 66], [31, 67], [29, 67]);

    /* La cabeza, adelantada y baja: frente pesada, nariz ganchuda, mandíbula saliente con colmillos. */
    const oreja = C().poly([[25, 23], [38, 12], [34, 18], [31, 26]]);
    sombrear(oreja, g, P, { relieve: 2, separar: true });
    trazo(g, oreja, P, 1, [28, 23, 35, 15]);
    pon(g, P, 3, [33, 15], [34, 14]);
    const craneo = C().ell(22, 24, 8.5, 7.5).ell(25, 20.5, 5.5, 4);
    sombrear(craneo, g, P, { relieve: 6, volumen: 0.35, separar: true });
    /* Mandíbula de abajo, más ancha que la de arriba. */
    const mandibula = C().poly([[7, 33], [27, 31], [29, 37], [24, 42], [12, 42], [7, 38]]);
    sombrear(mandibula, g, P, { relieve: 4, volumen: 0.4, separar: true });
    tono(g, C().rect(8, 40, 20, 3), 1, P);
    trazo(g, mandibula, P, 1, [12, 39, 18, 40.5, 25, 38]);
    /* Hocico y labio de arriba. */
    const hocico = C().ell(18, 29.5, 8.5, 3.6);
    sombrear(hocico, g, P, { relieve: 3, volumen: 0.3, separar: 2 });
    /* Boca: una raja oscura con los dientes de abajo asomando. */
    trazo(g, null, NEGRO, 0, [8, 33, 17, 34.5, 27, 31.5]);
    trazo(g, null, NEGRO, 1, [12, 34, 17, 35.5, 24, 33]);
    for (const x of [13, 16, 19]) pon(g, HUESO, 2, [x, 35]);
    /* Colmillos que salen de la mandíbula y suben por fuera del labio. */
    for (const [x, y, h, a] of [[10, 35, 8, 2], [22, 34, 6, 1.6]]) {
      const c = C().poly([[x - a, y + 1], [x - 0.5, y - h], [x + 0.6, y - h + 1], [x + a, y + 1]]);
      sombrear(c, g, HUESO, { relieve: 1.5, min: 1 });
      pon(g, HUESO, 4, [x - 1, y - h + 2], [x - 1, y - h + 3]);
      pon(g, HUESO, 1, [x + 1, y]);
    }
    /* Ceño: una cresta de hueso sobre los ojos. */
    const cejo = C().curva(10, 23, 18, 18.5, 28, 20.5, 4, 3);
    sombrear(cejo, g, P, { relieve: 1.5, min: 2, separar: 2 });
    for (const [i, j] of [[13, 20], [14, 20], [16, 19], [18, 19], [20, 19]]) pon(g, P, 4, [i, j]);
    /* Ojos pequeños y amarillos hundidos bajo el ceño. */
    new Capa(W, H).rect(12, 23, 5, 3).rect(19, 23, 5, 3).pintar(g, P, { plano: 0 });
    pon(g, R.bronce, 4, [14, 24], [21, 24]);
    pon(g, R.bronce, 3, [13, 24], [20, 24], [15, 24], [22, 24]);
    pon(g, R.fuego, 1, [14, 25], [21, 25]);
    pon(g, NEGRO, 0, [15, 24], [22, 24]);
    pon(g, P, 1, [12, 26], [13, 26], [19, 26], [20, 26], [23, 26]);
    /* Nariz ganchuda y colgante. */
    const nariz = C().poly([[15, 21], [18, 23], [16, 29], [12, 32], [7.5, 31.5], [6.5, 29], [10, 26]]);
    sombrear(nariz, g, P, { relieve: 2.5, volumen: 0.5, separar: true });
    pon(g, P, 4, [13, 24], [12, 25], [11, 26]);
    pon(g, NEGRO, 1, [10, 31], [11, 31], [14, 30]);
    trazo(g, null, P, 1, [16, 28, 18, 30]);
    /* Arrugas, verrugas y liquen en la cara. */
    trazo(g, craneo, P, 1, [24, 25, 26, 28], [22, 16.5, 27, 17]);
    for (const [i, j] of [[26, 23], [27, 33], [16, 38], [21, 39], [8, 28]]) { pon(g, P, 4, [i, j]); pon(g, P, 1, [i, j + 1]); }
    pon(g, Mu, 2, [28, 26], [29, 27], [23, 40]);
    /* Mechones de pelo sucio en la coronilla. */
    const mechon = C().curva(20, 17, 24, 11, 29, 10, 3, 1).curva(24, 17, 29, 13, 33, 13, 3, 1).curva(17, 18, 18, 13, 22, 11, 2.5, 1);
    sombrear(mechon, g, Mu, { relieve: 1.5, max: 3, separar: true });

    /* Brazo de delante: largo hasta casi el suelo, con el puño apoyado. */
    const brazo = C().curva(32, 31, 21, 38, 19, 50, 13, 10).curva(19, 50, 16, 57, 14, 63, 10, 8);
    sombrear(brazo, g, P, { relieve: 5, volumen: 0.3, caida: 0.15, separar: true });
    trazo(g, brazo, P, 1, [24, 40, 21, 46, 23, 52], [16, 55, 14, 59]);
    trazo(g, brazo, P, 3, [27, 33, 22, 37, 19, 44]);
    tono(g, C().ell(25, 33, 5, 2), 1, P);
    const puno = C().ell(13, 66, 7, 6).ell(9, 70, 5, 3.5);
    sombrear(puno, g, P, { relieve: 5, separar: true });
    for (const [x0, y0, x1] of [[6, 68, 9], [8, 71, 11], [11, 72, 14]]) trazo(g, puno, P, 1, [x0, y0, x1, y0 + 1]);
    for (const [x, y] of [[5, 71], [8, 73.5], [12, 74]]) pua(g, NEGRO, x + 1, y, x - 1.5, y + 3.5, 1.2, { relieve: 1, min: 2 });
    pon(g, P, 4, [9, 63], [11, 62], [7, 66]);
    /* Aro de hierro oxidado en la muñeca. */
    const pulsera = C().curva(9, 59, 14, 61, 20, 58, 3).recortar(brazo.copia().unir(puno));
    pulsera.pintar(g, R.oricalco, { relieve: 1, max: 3 });
    pon(g, R.oricalco, 4, [11, 59], [12, 60]);

    /* Verrugas por todo el cuerpo: un brillo y su sombra debajo. */
    for (const [i, j] of [[38, 23], [45, 20], [52, 27], [41, 35], [55, 33], [48, 40], [57, 22], [22, 46], [19, 54], [44, 49], [52, 44], [53, 63], [26, 68], [67, 25], [36, 30], [31, 47]]) {
      if (!g.get(i, j)) continue;
      pon(g, g.rampa(i, j) === V ? V : P, 4, [i, j]); pon(g, g.rampa(i, j) === V ? V : P, 1, [i, j + 1]);
    }
    /* Manchas de liquen. */
    for (const [i, j] of [[50, 30], [51, 31], [58, 29], [46, 36], [21, 49], [64, 28], [33, 21]]) if (g.rampa(i, j) === P) pon(g, Mu, 2, [i, j]);
    g.contorno();
    return g;
  }

  /* ---------- Malakar, el liche ---------- */
  function liche() {
    const g = new Rejilla(W, H), V = VIOLETA, N = R.tela.negro, E = VERDE, B = ORO, Md = R.madera;

    /* El cetro: vara de madera negra con aros de oro y una calavera con cuernos en lo alto. */
    const vara = C().rect(11, 14, 3, 65);
    sombrear(vara, g, Md, { relieve: 1.5, max: 2 });
    for (const y of [22, 50, 70]) { new Capa(W, H).rect(10, y, 5, 2).pintar(g, B, { relieve: 1, min: 2 }); pon(g, B, 4, [10, y]); }
    const cuernosV = C().curva(10, 8, 4, 6, 5, 13, 2.4, 1).curva(15, 8, 21, 6, 20, 13, 2.4, 1);
    sombrear(cuernosV, g, B, { relieve: 1, min: 1 });
    const calV = C().ell(12.5, 8, 4.2, 4).rect(10, 10, 5, 4);
    sombrear(calV, g, HUESO, { relieve: 2.5, min: 1, separar: true });
    pon(g, NEGRO, 0, [10, 8], [11, 8], [10, 9], [14, 8], [13, 8], [12, 11], [11, 13], [13, 13]);
    pon(g, E, 4, [10, 8], [13, 8]);
    pon(g, E, 3, [11, 8], [14, 8]);
    pon(g, HUESO, 4, [11, 5], [12, 5]);

    /* Brazo de atrás alzado, con la manga caída, sosteniendo la filacteria. */
    const mangaAtras = C().poly([[45, 27], [57, 18], [63, 21], [60, 26], [52, 35]]);
    sombrear(mangaAtras, g, V, { relieve: 3, max: 2 });
    trazo(g, mangaAtras, B, 2, [57, 18.5, 63, 21.5]);
    const manoAtras = C().linea(60, 20, 62, 16, 2).linea(61, 16, 59, 12, 1).linea(62, 16, 62, 11, 1).linea(63, 17, 65, 12, 1).linea(64, 18, 67, 15, 1);
    manoAtras.pintar(g, HUESO, { relieve: 1, min: 2 });

    /* El manto: túnica violeta oscura hasta el suelo, deshilachada. */
    const manto = C().poly([[33, 25], [47, 25], [52, 34], [56, 50], [60, 66], [64, 78.5], [21, 78.5], [24, 66], [27, 50], [29, 34]]);
    for (const [x, y, a] of [[24, 73, 1.6], [30, 75, 1.4], [37, 72, 1.8], [45, 74, 1.5], [52, 72, 1.8], [59, 74, 1.6]]) manto.restar(C().poly([[x - a, 79.5], [x, y], [x + a, 79.5]]));
    sombrear(manto, g, V, { relieve: 6, volumen: 0.4, caida: 0.35 });
    /* Pliegues largos. */
    trazo(g, manto, V, 0, [50, 38, 54, 56, 57, 76], [46, 44, 48, 60, 50, 72], [28, 52, 26, 64, 25, 74]);
    trazo(g, manto, V, 3, [31, 36, 29, 50, 27, 62], [49, 34, 51, 44, 52, 52]);
    /* El faldón de delante, negro, con ribete de oro y runas. */
    const panel = C().poly([[37, 28], [42, 28], [44, 50], [45, 78.5], [31, 78.5], [33, 50]]).recortar(manto);
    sombrear(panel, g, N, { relieve: 3, caida: 0.3, max: 3 });
    for (const [x0, y0, x1, y1] of [[37, 28, 33, 50], [33, 50, 31, 78], [42, 28, 44, 50], [44, 50, 45, 78]]) trazo(g, manto, B, 2, [x0, y0, x1, y1]);
    for (let y = 56; y <= 74; y += 6) { pon(g, E, 3, [38, y], [37, y + 1], [39, y + 1], [38, y + 2]); pon(g, E, 1, [38, y + 1]); }
    /* Costillas a la vista por el escote. */
    const pecho = C().poly([[36, 27], [43, 27], [42, 40], [36, 40]]);
    pecho.pintar(g, N, { plano: 0 });
    for (const y of [30, 33, 36]) { trazo(g, null, HUESO, 2, [36, y + 1, 39, y, 42, y + 1]); pon(g, HUESO, 3, [37, y]); }
    trazo(g, null, HUESO, 3, [39, 28, 39, 39]);
    /* Cinturón con hebilla de calavera. */
    const cinto = C().curva(29, 46, 40, 48, 53, 45, 2.4).recortar(manto);
    cinto.pintar(g, B, { relieve: 1, max: 3 });
    new Capa(W, H).ell(39, 47, 2.4, 2.2).pintar(g, HUESO, { relieve: 1.5, min: 2 });
    pon(g, NEGRO, 0, [38, 47], [40, 47]);
    pon(g, E, 4, [38, 47]);

    /* Esclavina sobre los hombros y el cuello alto, que se abre en dos puntas. */
    const cuello = C().poly([[29, 10], [34, 22], [46, 22], [52, 10], [50, 27], [31, 27]]);
    sombrear(cuello, g, V, { relieve: 2.5, max: 3, separar: true });
    const forro = C().poly([[31, 13], [35, 23], [45, 23], [50, 13], [48, 25], [33, 25]]).recortar(cuello);
    forro.pintar(g, V, { plano: 1 });
    trazo(g, cuello, B, 3, [29, 10, 34, 22], [52, 10, 46, 22]);
    const esclavina = C().ell(40, 29, 14, 6.5).quitarRect(0, 0, W, 25);
    sombrear(esclavina, g, V, { relieve: 3, volumen: 0.4, separar: true });
    for (let x = 26; x <= 54; x++) for (let y = 29; y <= 36; y++) if (esclavina.tiene(x, y) && !esclavina.tiene(x, y + 1)) pon(g, B, x % 3 ? 2 : 3, [x, y]);

    /* La calavera coronada, con los ojos en llamas verdes. */
    const craneo = C().ell(40, 15, 6.5, 6.5).poly([[34.5, 17], [45.5, 17], [44.5, 21], [42.5, 24.5], [37, 24.5], [35, 21.5]]);
    sombrear(craneo, g, HUESO, { relieve: 4, volumen: 0.35, separar: true });
    pon(g, HUESO, 1, [44, 20], [43, 21], [43, 22], [42, 23]);
    pon(g, HUESO, 4, [35, 19], [40, 19]);
    for (const [x, y] of [[35, 16], [36, 16], [37, 16], [35, 17], [36, 17], [37, 17], [36, 18], [40, 16], [41, 16], [42, 16], [40, 17], [41, 17], [42, 17], [41, 18]]) pon(g, NEGRO, 0, [x, y]);
    pon(g, E, 4, [36, 16], [41, 16]);
    pon(g, E, 3, [35, 17], [37, 16], [40, 17], [42, 16]);
    pon(g, E, 2, [36, 17], [41, 17]);
    pon(g, NEGRO, 0, [38, 20], [37, 21], [38, 21]);
    for (let x = 36; x <= 42; x++) pon(g, x % 2 ? NEGRO : HUESO, x % 2 ? 0 : 3, [x, 23]);
    pon(g, NEGRO, 0, [36, 22], [42, 22]);
    pon(g, HUESO, 4, [37, 11], [38, 11], [36, 12]);
    const corona = C().rect(33, 8.5, 14, 3).off(33, 8).off(46, 8);
    for (const [x, h] of [[34, 4], [37, 6], [40, 8], [43, 6], [46, 4]]) corona.poly([[x - 1.3, 9], [x, 9 - h], [x + 1.3, 9]]);
    sombrear(corona, g, B, { relieve: 1.5, min: 1, separar: true });
    for (const [x, h] of [[34, 4], [37, 6], [40, 8], [43, 6], [46, 4]]) pon(g, B, 4, [x, 9 - h + 1]);
    new Capa(W, H).ell(40, 9.5, 1.5, 1.5).pintar(g, E, { relieve: 1, min: 2 });
    pon(g, E, 4, [39, 9]);

    /* Brazo de delante: manga acampanada que cuelga y la mano de hueso en el cetro. */
    const manga = C().poly([[37, 27], [21, 32], [16, 45], [23, 44], [28, 38], [36, 37]]);
    sombrear(manga, g, V, { relieve: 4, volumen: 0.35, separar: true });
    trazo(g, manga, V, 1, [32, 31, 25, 36, 21, 43]);
    for (let x = 16; x <= 23; x++) for (let y = 40; y <= 46; y++) if (manga.tiene(x, y) && !manga.tiene(x, y + 1)) pon(g, B, 2, [x, y]);
    const mano = C().rect(13, 33, 5, 2).rect(13, 36, 5, 2).rect(13, 39, 4, 2).linea(17, 32, 18, 31, 1).linea(18, 34, 20, 34, 1);
    mano.pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    pon(g, HUESO, 4, [14, 33], [14, 36], [14, 39]);
    bordeLuz(g, V, 3);
    bordeLuz(g, N, 2);
    bordeReflejo(g, V, 2, V, (x, y) => y > 30);
    g.contorno();

    /* La filacteria: una gema verde en una jaula de oro, flotando sobre la mano. */
    const gema = C().poly([[63, 2], [67, 7], [63, 12.5], [59, 7]]);
    sombrear(gema, g, E, { relieve: 2.5, min: 1, volumen: 0.5 });
    pon(g, E, 4, [61, 6], [62, 5], [62, 6]);
    trazo(g, null, B, 3, [63, 1, 63, 13], [59, 7, 67, 7]);
    pon(g, B, 4, [63, 1], [63, 13], [59, 7], [67, 7]);
    /* Resplandor y chispas de fuego fatuo, sin contorno. */
    for (let a = 0; a < 6.28; a += 0.3) {
      const x = Math.round(63 + Math.cos(a) * 6.5), y = Math.round(7 + Math.sin(a) * 6.5);
      if (!g.get(x, y) && umbral(x, y) < 0.5) pon(g, E, 2, [x, y]);
    }
    for (const [x, y, k] of [[56, 3, 3], [70, 5, 4], [68, 13, 2], [58, 11, 3], [6, 3, 3], [18, 2, 4], [4, 11, 2], [20, 16, 3], [8, 18, 2], [66, 0, 3]]) if (!g.get(x, y)) pon(g, E, k, [x, y]);
    destello(g, 12, 2, E);
    return g;
  }

  /* ---------- Lord Varkhul, el vampiro ---------- */
  function vampiro() {
    const g = new Rejilla(W, H), N = NOCHE, Rj = R.tela.granate, P = PALIDO, Pe = AZABACHE, Pl = R.plata, S = R.sangre;

    /* La capa abierta con las dos manos, como alas de murciélago, enseñando el forro rojo. */
    const forroDe = ala => {
      const f = ala.copia();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!ala.tiene(x, y)) continue;
        for (const [a, b] of [[2, 0], [-2, 0], [0, -2], [0, 2], [2, 2], [-2, 2], [2, -2], [-2, -2]]) if (!ala.tiene(x + a, y + b)) { f.off(x, y); break; }
      }
      return f;
    };
    const capa = (ala, mano, puntas) => {
      const forro = forroDe(ala);
      sombrear(ala, g, N, { relieve: 2, max: 2 });
      sombrear(forro, g, Rj, { relieve: 6, volumen: 0.5, caida: 0.35 });
      /* Varillas de la capa, como dedos de murciélago, desde la mano. */
      for (const [x1, y1] of puntas) trazo(g, forro, Rj, 1, [mano[0], mano[1], (mano[0] + x1) / 2 + (x1 > 40 ? -3 : 3), (mano[1] + y1) / 2, x1, y1]);
      for (const [x1, y1] of puntas.slice(0, 2)) trazo(g, forro, Rj, 4, [mano[0] + (x1 > 40 ? -1 : 1), mano[1] - 1, (mano[0] + x1) / 2 + (x1 > 40 ? -5 : 5), (mano[1] + y1) / 2 - 1, x1 + (x1 > 40 ? -2 : 2), y1 - 2]);
    };
    const alaD = C().poly([[44, 22], [56, 17], [66, 15], [72, 19], [76, 30], [77, 46], [74, 60], [69, 72], [62, 78.5], [42, 78.5]]);
    for (const [x, y, rx, ry] of [[80.5, 38, 7.5, 6.8], [80.5, 53, 7.5, 6.2], [77, 66.5, 6.5, 5.2], [68, 82, 5.5, 5]]) alaD.quitarEll(x, y, rx, ry);
    capa(alaD, [65, 18], [[75, 30], [76, 46], [73, 60], [68, 72]]);
    const alaI = C().poly([[36, 22], [24, 17], [14, 14], [8, 18], [4, 30], [3, 46], [6, 60], [11, 72], [18, 78.5], [40, 78.5]]);
    for (const [x, y, rx, ry] of [[-1, 38, 7.5, 6.8], [-1, 53, 7.5, 6.2], [2.5, 66.5, 6.5, 5.2], [11.5, 82, 5.5, 5]]) alaI.quitarEll(x, y, rx, ry);
    capa(alaI, [13, 17], [[5, 30], [4, 46], [7, 60], [12, 72]]);
    /* El cuello alto de la capa, que se abre por detrás de la cabeza. */
    const cuello = C().poly([[27, 5], [33, 20], [46, 20], [55, 4], [53, 24], [30, 25]]);
    sombrear(cuello, g, N, { relieve: 2, max: 3 });
    const cuelloF = C().poly([[29.5, 9], [34, 21], [45, 21], [52.5, 8], [51, 23], [32, 23]]).recortar(cuello);
    sombrear(cuelloF, g, Rj, { relieve: 2, volumen: 0.6 });
    trazo(g, cuello, Rj, 4, [29, 8, 33, 19]);

    /* Piernas: pantalón negro y zapatos de punta. */
    const piernas = C().poly([[34, 52], [47, 52], [48, 76], [43, 76], [41, 60], [39, 76], [33, 76]]);
    sombrear(piernas, g, N, { relieve: 2.5, max: 3 });
    trazo(g, piernas, N, 0, [41, 58, 41, 76]);
    const zapatos = C().poly([[33, 75], [39, 75], [39, 78.5], [28, 78.5]]).poly([[42, 75], [48, 75], [48, 78.5], [38.5, 78.5]]);
    sombrear(zapatos, g, N, { relieve: 1.5, min: 1, separar: true });
    pon(g, Pl, 4, [32, 76], [43, 76]);

    /* Levita negra con faldones, chaleco granate con botones de oro y solapas de seda. */
    const levita = C().poly([[33, 22], [47, 22], [49, 36], [50, 50], [53, 64], [46, 62], [44, 52], [37, 52], [35, 62], [29, 64], [31, 50], [32, 36]]);
    sombrear(levita, g, N, { relieve: 4, volumen: 0.45, separar: true });
    const chaleco = C().poly([[37, 22], [43, 22], [44, 46], [40, 49], [36, 46]]);
    sombrear(chaleco, g, Rj, { relieve: 2, max: 3, volumen: 0.4 });
    for (const y of [32, 37, 42]) { pon(g, ORO, 3, [40, y]); pon(g, ORO, 4, [39, y - 1]); }
    const solapas = C().poly([[35, 22], [37, 22], [38, 40], [35, 34]]).poly([[43, 22], [45, 22], [45, 34], [42, 40]]);
    sombrear(solapas, g, Pl, { relieve: 1, max: 2, separar: 1 });
    /* Chorrera blanca y un broche de rubí. */
    const chorrera = C().poly([[37, 21], [43, 21], [42, 29], [40, 31], [38, 29]]);
    sombrear(chorrera, g, HUESO, { relieve: 1.5, min: 2 });
    trazo(g, chorrera, HUESO, 1, [38, 24, 40, 25, 42, 24], [38, 27, 40, 28, 42, 27]);
    new Capa(W, H).ell(40, 23, 1.6, 1.6).pintar(g, S, { relieve: 1, min: 2 });
    pon(g, S, 4, [39, 22]);
    bordeLuz(g, N, 3);

    /* Brazo de atrás: sube hasta la mano que sostiene la capa. */
    const brazoAtras = C().curva(46, 26, 56, 26, 63, 20, 5, 4);
    sombrear(brazoAtras, g, N, { relieve: 2, max: 3, separar: 1 });
    trazo(g, brazoAtras, N, 3, [47, 24.5, 55, 23.5, 61, 18.5]);
    const manoAtras = C().ell(65, 18, 2.6, 2.2).linea(66, 17, 69, 15, 1).linea(66, 19, 70, 18, 1).linea(65, 16, 66, 13, 1);
    sombrear(manoAtras, g, P, { relieve: 1.5, separar: true });
    pon(g, S, 2, [70, 18], [69, 15], [66, 13]);
    pon(g, HUESO, 4, [61, 19], [62, 20]);

    /* La cabeza: piel de cera, pelo negro peinado hacia atrás con pico de viuda, oreja puntiaguda. */
    const cab = C().ell(38.5, 14, 5.6, 6.6).poly([[33, 15], [31.5, 17], [33, 18.5]]).poly([[34, 18], [42, 18], [40, 22.5], [36, 22.5]]);
    sombrear(cab, g, P, { relieve: 3.5, volumen: 0.45, separar: true });
    const pelo = C().poly([[32.5, 10.5], [34, 7], [38, 5.2], [43, 5.6], [46.5, 9], [47, 15], [45.5, 19.5], [43.5, 18.5], [42.5, 13], [41, 10.5], [39.2, 10.2], [37.6, 12.6], [36, 10.3], [33.5, 11]]);
    sombrear(pelo, g, Pe, { relieve: 2.5, volumen: 0.5, separar: true });
    trazo(g, pelo, Pe, 4, [35, 7.5, 39, 6, 43, 7]);
    trazo(g, pelo, Pe, 3, [38, 9, 42, 8, 45.5, 11], [43, 10, 45, 14, 45, 18]);
    const oreja = C().poly([[42.5, 13], [47.5, 8.5], [45.5, 17], [43, 17.5]]);
    sombrear(oreja, g, P, { relieve: 1.5, separar: true });
    pon(g, P, 1, [44, 14], [45, 13], [44, 15]);
    /* Cara: cejas en punta, ojos rojos, nariz aguileña y colmillos. */
    trazo(g, null, Pe, 1, [33, 12, 35, 13], [37, 13, 39, 12]);
    pon(g, P, 0, [33, 14], [34, 14], [37, 14], [38, 14], [39, 14]);
    pon(g, S, 4, [34, 14], [38, 14]);
    pon(g, R.fuego, 4, [38, 14]);
    pon(g, S, 3, [33, 14], [37, 14]);
    pon(g, P, 1, [34, 15], [38, 15], [39, 15]);
    pon(g, P, 1, [35, 16], [35, 17], [36, 17]);
    pon(g, P, 4, [33, 15], [34, 16]);
    pon(g, P, 1, [39, 16], [40, 17], [41, 18], [40, 19]);
    trazo(g, null, S, 1, [33, 19, 35, 19.6, 37, 19]);
    pon(g, HUESO, 4, [34, 20], [36, 20]);
    pon(g, P, 2, [35, 21], [36, 21]);
    pon(g, P, 0, [37, 22], [38, 22]);

    /* Brazo de delante, alzado, con puño de encaje y la mano de garras agarrando la capa. */
    const brazo = C().curva(34, 26, 25, 27, 19, 20, 5.5, 4.5);
    sombrear(brazo, g, N, { relieve: 2.5, max: 3, separar: true });
    trazo(g, brazo, N, 3, [33, 24.5, 25, 25, 19.5, 18.5]);
    trazo(g, brazo, N, 0, [30, 29, 24, 29, 21, 24]);
    const puno = C().poly([[20, 16], [23, 19], [20, 23], [17, 20]]);
    sombrear(puno, g, HUESO, { relieve: 1, min: 2, separar: true });
    trazo(g, puno, HUESO, 1, [20, 18, 19, 21]);
    const mano = C().ell(15.5, 17.5, 2.6, 2.4);
    sombrear(mano, g, P, { relieve: 1.5, separar: true });
    for (const [x0, y0, x1, y1] of [[14, 15.5, 11, 12], [13.5, 17, 9, 15.5], [13.5, 18.5, 9.5, 20.5], [14.5, 19.5, 12, 23.5]]) {
      new Capa(W, H).linea(x0, y0, x1, y1, 1).pintar(g, P, { plano: 3 });
      pon(g, S, 3, [x1, y1]);
    }
    pon(g, P, 4, [14, 16], [15, 16]);
    g.contorno();
    return g;
  }

  /* Escamas: medias lunas oscuras en tresbolillo, con un brillo encima en la parte iluminada. */
  function escamas(g, capa, ram, paso = 4, alto = 3, desde = 1) {
    for (let j = 0; j * alto < H; j++) for (let i = -1; i * paso < W; i++) {
      const x = i * paso + (j % 2 ? paso / 2 : 0), y = j * alto;
      if (!capa.tiene(x, y) || !capa.tiene(x - 1, y) || !capa.tiene(x + 1, y + 1)) continue;
      const k = ram.indexOf(g.get(x, y));
      if (k < desde) continue;
      pon(g, ram, Math.max(0, k - 1), [x - 1, y], [x, y + 1], [x + 1, y]);
      if (k >= 2 && capa.tiene(x, y - 1)) pon(g, ram, Math.min(4, k + 1), [x, y - 1]);
    }
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
    puntas.forEach(([x, y], i) => huesos.curva(muneca[0], muneca[1], (muneca[0] + x) / 2 + 1, (muneca[1] + y) / 2 - 1, x, y, i === 0 ? 2.5 : 2, 1));
    sombrear(huesos, g, hueso, { relieve: 1.5, ...opH });
    return c;
  }

  /* ---------- Ignárax, el dragón rojo ---------- */
  function dragon() {
    const g = new Rejilla(W, H), E = ESCAMA, S = R.sangre, O = R.tela.ocre, F = R.fuego, B = ORO;

    /* El ala, abierta y alzada por detrás. */
    const Mb = MEMBRANA;
    const ala = alaMembrana(g, [52, 40], [60, 5], [[73, 1], [79, 12], [79.5, 28], [77, 43]], [66, 52], Mb, { relieve: 3, volumen: 0.6, max: 3 }, E, { min: 2, max: 4, grueso: 4 }, 0.5);
    /* Venas de la membrana. */
    for (const [x0, y0, x1, y1] of [[63, 14, 73, 19], [63, 26, 75, 33], [62, 36, 70, 45]]) trazo(g, ala, Mb, 1, [x0, y0, x1, y1]);
    pua(g, HUESO, 60, 5, 57, 0.5, 1.3, { relieve: 1, min: 2 });

    /* La cola, que da la vuelta por delante de la pata de atrás. */
    const cola = C().curva(74, 62, 80, 78, 56, 76, 8, 4).curva(56, 76, 46, 75.5, 40, 77.5, 4, 1.5);
    sombrear(cola, g, E, { relieve: 3, volumen: 0.3, max: 3 });
    for (const [x, y] of [[66, 75], [58, 74], [50, 74]]) pua(g, HUESO, x, y, x + 2, y - 3, 1.2, { relieve: 1, min: 2 });

    /* El cuerpo y la pata de atrás. */
    const anca = C().ell(68, 64, 9, 10).poly([[62, 70], [74, 70], [76, 78.5], [60, 78.5]]);
    sombrear(anca, g, E, { relieve: 6, volumen: 0.45, max: 3, tramado: 0.15 });
    const cuerpo = C().ell(57, 57, 15, 13).ell(48, 52, 9, 10);
    sombrear(cuerpo, g, E, { relieve: 10, volumen: 0.5, caida: 0.15, separar: true, tramado: 0.15 });
    escamas(g, cuerpo, E, 4, 3, 1);
    for (const x of [60, 65, 70]) pua(g, HUESO, x, 77.5, x - 3, 78.6, 1.1, { relieve: 1, min: 3 });

    /* Pecho y cuello con las placas del vientre, doradas. */
    const cuello = C().curva(50, 50, 40, 36, 30, 27, 15, 10);
    sombrear(cuello, g, E, { relieve: 6, volumen: 0.45, separar: true, tramado: 0.15 });
    escamas(g, cuello, E, 4, 3, 1);
    const vientre = C().curva(28, 31, 34, 42, 42, 54, 5, 9).ell(45, 60, 6, 8).recortar(cuello.copia().unir(cuerpo));
    sombrear(vientre, g, O, { relieve: 3, volumen: 0.4, max: 3 });
    for (let j = 30; j <= 68; j += 3) for (let i = 20; i <= 56; i++) if (vientre.tiene(i, j) && g.rampa(i, j) === O) pon(g, O, 1, [i, j]);
    /* Púas del lomo, del cogote hasta los hombros. */
    for (const [x, y, a, b] of [[34, 22, 4, -5], [38, 26, 5, -5], [42, 31, 5, -5], [46, 36, 5, -4], [50, 40, 5, -3]]) {
      const c = C().poly([[x - 2.2, y + 1.5], [x + a, y + b], [x + 2.2, y + 1.5]]);
      sombrear(c, g, HUESO, { relieve: 1.2, min: 1, separar: 2 });
    }

    /* La pata de delante, plantada, con zarpas negras. */
    const brazo = C().curva(47, 57, 41, 65, 36, 72, 11, 8).ell(33, 74.5, 7, 4.2);
    sombrear(brazo, g, E, { relieve: 4, volumen: 0.4, separar: true, tramado: 0.15 });
    escamas(g, brazo, E, 3, 3, 2);
    for (const [x, y, a] of [[26, 76, -3.5], [30, 77, -3], [34, 77, -2], [38, 77.5, -1]]) pua(g, NEGRO, x + 1, y, x + a, 78.7, 1.5, { relieve: 1, min: 2 });
    pon(g, NEGRO, 4, [26, 77], [30, 78]);
    /* La otra pata, detrás y más oscura. */
    const brazo2 = C().curva(54, 66, 52, 72, 50, 75, 7, 6).ell(48, 76, 4.5, 2.8);
    detras(g, brazo2, E, { relieve: 2, max: 2 });

    /* La cabeza: cuernos hacia atrás, ceño de púas, ojo de oro y las fauces abiertas con fuego dentro. */
    const cuernos = C().curva(28, 15, 36, 8, 46, 7, 4.5, 1).curva(31, 20, 38, 16, 44, 17, 3.5, 1);
    sombrear(cuernos, g, HUESO, { relieve: 2, volumen: 0.4, min: 1 });
    for (const [x, y] of [[33, 10], [36, 9], [39, 8]]) pon(g, HUESO, 1, [x, y + 1]);
    const craneo = C().ell(25, 21, 8, 6.5).poly([[24, 15], [12, 17.5], [4, 21.5], [3, 24.5], [8, 26.5], [24, 27], [31, 25]]);
    sombrear(craneo, g, E, { relieve: 5, volumen: 0.45, separar: true, tramado: 0.2 });
    escamas(g, craneo, E, 3, 3, 2);
    const mandibula = C().poly([[31, 28], [24, 30], [14, 33.5], [6, 37], [5, 39], [12, 39.5], [24, 37], [32, 33]]);
    sombrear(mandibula, g, E, { relieve: 3, volumen: 0.4, separar: true });
    trazo(g, mandibula, O, 2, [7, 38.5, 16, 37.5, 28, 34]);
    /* El fuego de la garganta, más claro al fondo. */
    const boca = C().poly([[30, 26], [24, 27], [8, 27], [5, 28], [6, 36.5], [14, 33], [24, 30], [31, 28.5]]);
    boca.restar(craneo).restar(mandibula);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (boca.tiene(x, y)) {
      const f = Math.min(1, (x - 5) / 22) * 4 + (umbral(x, y) - 0.5) * 0.8;
      g.set(x, y, F[Math.max(1, Math.min(4, Math.round(f)))], F);
    }
    /* Dientes arriba y abajo. */
    for (const x of [7, 10, 13, 16, 19, 22]) pua(g, HUESO, x, 26.5, x + 0.5, 29.5, 1, { relieve: 1, min: 3 });
    for (const [x, y] of [[8, 36], [11, 34.6], [14, 33.3], [17, 32.2]]) pua(g, HUESO, x, y + 0.5, x + 0.5, y - 2.5, 0.9, { relieve: 1, min: 3 });
    /* Ceño con púas, ojo y nariz humeante. */
    const ceno = C().curva(12, 18, 19, 14, 27, 15, 3, 2.5);
    sombrear(ceno, g, E, { relieve: 1.5, min: 2, separar: 1 });
    for (const [x, y] of [[17, 15], [22, 14]]) pua(g, HUESO, x, y, x + 3, y - 4, 1, { relieve: 1, min: 2 });
    new Capa(W, H).ell(20, 18.5, 2.4, 1.4).pintar(g, NEGRO, { plano: 0 });
    pon(g, B, 4, [19, 18], [20, 18]);
    pon(g, B, 3, [21, 18], [18, 19]);
    pon(g, F, 2, [19, 19], [20, 19]);
    pon(g, NEGRO, 0, [21, 19], [22, 18]);
    pon(g, E, 0, [6, 21], [7, 21], [7, 22]);
    pon(g, E, 4, [9, 19], [12, 18], [14, 17], [5, 23]);
    /* Golas: púas de la mejilla hacia atrás. */
    for (const [x, y, a, b] of [[30, 24.5, 6, -2], [29, 33, 5, 3]]) {
      const c = C().poly([[x, y - 1.5], [x + a, y + b], [x, y + 1.5]]);
      sombrear(c, g, E, { relieve: 1, min: 2, separar: 1 });
      pon(g, E, 4, [x + 1, y - 1]);
    }
    /* Sombra que la cabeza echa sobre el cuello. */
    tono(g, C().ell(36, 38, 7, 4), 1, E);
    tono(g, C().ell(36, 38, 7, 4), 1, R.tela.ocre);
    trazo(g, craneo, E, 1, [24, 22, 27, 25]);
    for (let x = 0; x < W; x++) g.quitar(x, H - 1);
    g.contorno();

    /* Chispas y humo, sin contorno. */
    for (const [x, y, k] of [[2, 30, 4], [1, 33, 3], [3, 28, 3], [0, 31, 2], [4, 40, 2], [2, 36, 3]]) if (!g.get(x, y)) pon(g, F, k, [x, y]);
    for (const [x, y, k] of [[4, 18, 3], [2, 16, 2], [5, 15, 2], [1, 13, 1]]) if (!g.get(x, y)) pon(g, R.piedra, k, [x, y]);
    destello(g, 44, 7, HUESO);
    return g;
  }

  /* ---------- Nhazgul, el Devorador de Estrellas ---------- */
  function devorador() {
    const g = new Rejilla(W, H), V = VACIO, Mg = R.magia, Ci = CIAN, az = PX.azar(91);
    const tentaculos = (op, ...l) => { const c = C(); l.forEach(a => c.curva(...a)); sombrear(c, g, V, { relieve: 3, ...op }); return c; };
    /* Ventosas que brillan en la cara de abajo de cada tentáculo. */
    const ventosas = (c, ram, k = 3) => {
      for (let y = 1; y < H; y++) for (let x = 1; x < W; x++)
        if (c.tiene(x, y) && !c.tiene(x, y + 1) && c.tiene(x - 1, y) && c.tiene(x, y - 2) && (x * 3 + y) % 5 === 0) { pon(g, ram, k, [x, y - 1]); pon(g, ram, k - 2, [x + 1, y - 1]); }
    };

    /* Tentáculos de atrás, más oscuros. */
    ventosas(tentaculos({ max: 2 }, [62, 44, 78, 48, 77, 30, 8, 2], [58, 52, 70, 70, 79, 68, 8, 2], [48, 56, 54, 72, 46, 78.5, 7, 2]), Ci, 3);

    /* La corona de cuernos, con las puntas encendidas. */
    const cuernos = new Capa(W, H);
    const PUNTAS = [[24, 22, 12, 14, 11, 2, 7], [33, 16, 28, 6, 31, 0, 6], [44, 13, 46, 4, 52, 0, 7], [55, 16, 63, 9, 68, 1, 6], [63, 23, 73, 21, 77, 11, 6]];
    for (const [x0, y0, cx, cy, x1, y1, gr] of PUNTAS) cuernos.curva(x0, y0, cx, cy, x1, y1, gr, 1);
    sombrear(cuernos, g, Mg, { relieve: 2.5, max: 3, volumen: 0.3, separar: true });
    for (const [x0, y0, cx, cy, x1, y1] of PUNTAS) {
      /* Anillos a lo largo del cuerno y la punta de luz cian. */
      for (const t of [0.3, 0.5, 0.68]) {
        const u = 1 - t, x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        pon(g, Mg, 1, [Math.round(x), Math.round(y)], [Math.round(x) + 1, Math.round(y)]);
      }
      for (const t of [0.86, 0.93, 1]) {
        const u = 1 - t, x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        pon(g, Ci, t > 0.95 ? 4 : 3, [Math.round(x), Math.round(y)]);
        if (t < 0.9) pon(g, Ci, 2, [Math.round(x) + 1, Math.round(y)]);
      }
    }

    /* El cuerpo: una masa de vacío. */
    const cuerpo = C().ell(44, 34, 25, 20).ell(33, 42, 17, 14).ell(56, 44, 12, 10);
    sombrear(cuerpo, g, V, { relieve: 12, volumen: 0.5, separar: true });
    /* Nebulosa en espiral y estrellas sueltas dentro del vacío. */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!cuerpo.tiene(x, y)) continue;
      const a = Math.atan2(y - 38, x - 50), d = Math.hypot(x - 50, y - 38), v = Math.sin(a * 2 + d * 0.22);
      if (v > 0.45 && umbral(x, y) < (v - 0.45) * 1.8) pon(g, Mg, v > 0.88 && d > 8 ? 2 : 1, [x, y]);
      else if (v < -0.8 && d < 20 && umbral(x, y) < 0.2) pon(g, Ci, 1, [x, y]);
    }
    for (let i = 0; i < 160; i++) {
      const x = Math.floor(az() * W), y = Math.floor(az() * H), r = az();
      if (cuerpo.tiene(x - 2, y) && cuerpo.tiene(x + 2, y) && cuerpo.tiene(x, y - 2) && cuerpo.tiene(x, y + 2)) pon(g, r > 0.85 ? HUESO : r > 0.45 ? Ci : Mg, r > 0.93 ? 4 : 3, [x, y]);
    }
    for (const [x, y, ram] of [[58, 30, Ci], [62, 40, HUESO], [50, 22, Mg], [48, 44, Ci]]) {
      if (!cuerpo.tiene(x, y)) continue;
      pon(g, ram, 4, [x, y]); pon(g, ram, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    }

    /* El ojo: párpado de vacío con borde violeta, globo cian, iris claro y pupila rasgada. */
    const ox = 34, oy = 29;
    new Capa(W, H).ell(ox, oy, 14.5, 11).pintar(g, V, { plano: 0 });
    for (let a = 3.3; a < 6.2; a += 0.05) pon(g, Mg, a > 4.0 && a < 5.4 ? 3 : 2, [Math.round(ox + Math.cos(a) * 14), Math.round(oy + Math.sin(a) * 10.5)]);
    for (let a = 0.4; a < 2.8; a += 0.06) pon(g, V, 3, [Math.round(ox + Math.cos(a) * 13.6), Math.round(oy + Math.sin(a) * 10.2)]);
    const ojo = C().ell(ox, oy, 12, 8.6);
    sombrear(ojo, g, Ci, { relieve: 5, volumen: 0.45, min: 1 });
    /* Venas oscuras hacia el borde del ojo. */
    for (const [x0, y0, x1, y1] of [[23, 27, 27, 28], [24, 33, 28, 31], [44, 25, 41, 27], [45, 32, 42, 31], [36, 37, 35, 34]]) trazo(g, ojo, Ci, 1, [x0, y0, x1, y1]);
    const iris = C().ell(ox - 1, oy, 6.4, 6.6).recortar(ojo);
    sombrear(iris, g, Mg, { relieve: 3, min: 2, volumen: 0.4 });
    trazo(g, iris, Ci, 4, [ox - 5, oy - 3, ox - 4, oy - 6, ox - 1, oy - 6.5]);
    for (let a = 0; a < 6.28; a += 0.08) { const x = Math.round(ox - 1 + Math.cos(a) * 6.6), y = Math.round(oy + Math.sin(a) * 6.8); if (iris.tiene(x, y)) pon(g, Mg, 0, [x, y]); }
    const pupila = C().poly([[ox - 1, oy - 6.5], [ox + 0.6, oy], [ox - 1, oy + 6.5], [ox - 2.6, oy]]);
    pupila.pintar(g, V, { plano: 0 });
    pon(g, HUESO, 4, [ox - 6, oy - 5], [ox - 5, oy - 5], [ox - 6, oy - 4], [ox + 3, oy - 3]);
    pon(g, Ci, 4, [ox - 7, oy - 3], [ox + 4, oy + 3]);

    /* Las fauces, llenas de colmillos y con un resplandor de estrellas tragadas al fondo. */
    const boca = C().poly([[17, 46], [36, 43], [53, 45], [50, 53], [40, 57], [26, 56]]);
    boca.pintar(g, V, { plano: 0 });
    for (let y = 40; y < 60; y++) for (let x = 14; x < 56; x++) if (boca.tiene(x, y)) {
      const f = 1 - Math.hypot((x - 36) / 14, (y - 51) / 4.5);
      if (f > 0 && umbral(x, y) < f * 1.5) pon(g, Ci, f > 0.6 ? 3 : f > 0.3 ? 2 : 1, [x, y]);
    }
    pon(g, HUESO, 4, [35, 50], [40, 51]);
    pon(g, Ci, 4, [36, 51], [30, 52]);
    const labio = C();
    for (let a = 0; a < 6.28; a += 0.02) { const x = Math.round(35 + Math.cos(a) * 18.5), y = Math.round(50 + Math.sin(a) * 6.8); if (!boca.tiene(x, y) && boca.tiene(x + Math.sign(35 - x), y) || boca.tiene(x, y + Math.sign(50 - y)) && !boca.tiene(x, y)) labio.on(x, y); }
    labio.recortar(cuerpo).pintar(g, Mg, { plano: 1 });
    /* Colmillos de arriba (largos) y de abajo (cortos), curvados. */
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 3.8, ya = 45.2 - Math.sin(i / 8 * Math.PI) * 1.8 + (i > 4 ? (i - 4) * 0.2 : 0);
      pua(g, HUESO, x, ya, x + 0.6, ya + (i % 2 ? 4 : 6), 1.3, { relieve: 1, min: 2 });
    }
    for (let i = 0; i < 7; i++) {
      const x = 25 + i * 4, yb = 55.5 - Math.sin(i / 6 * Math.PI) * 1 - (i > 4 ? 1 : 0);
      pua(g, HUESO, x, yb, x - 0.4, yb - (i % 2 ? 3 : 4.5), 1.2, { relieve: 1, min: 2 });
    }

    /* Tentáculos de delante, que cuelgan hasta abajo y se enroscan hacia los héroes. */
    const delante = tentaculos({ separar: true, volumen: 0.3 },
      [24, 52, 8, 54, 6, 70, 9, 2.5], [30, 56, 26, 72, 14, 77, 9, 2.5], [40, 57, 42, 70, 34, 78, 8, 2], [52, 52, 60, 66, 64, 78, 8, 2.5], [18, 38, 4, 36, 2, 50, 7, 2]);
    ventosas(delante, Mg, 3);
    /* Rizos al final de los tentáculos. */
    const rizos = C().curva(6, 70, 7, 75, 11, 74, 2.5, 1.5).curva(14, 77, 10, 78, 9, 74.5, 2.2, 1.2).curva(2, 50, 1, 55, 5, 55, 2, 1.2);
    sombrear(rizos, g, V, { relieve: 1, separar: true });

    /* Luz violeta por arriba y cian por abajo, para que el vacío se lea sobre el fondo. */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.rampa(x, y) !== V) continue;
      if (!g.get(x - 1, y) || !g.get(x, y - 1)) pon(g, Mg, 2, [x, y]);
      else if (!g.get(x + 1, y) || !g.get(x, y + 1)) pon(g, Ci, 2, [x, y]);
      else if ((!g.get(x - 2, y) || !g.get(x, y - 2)) && umbral(x, y) < 0.5) pon(g, Mg, 1, [x, y]);
    }
    for (let x = 0; x < W; x++) g.quitar(x, H - 1);
    g.contorno(V[0]);

    /* Polvo de estrellas alrededor, sin contorno. */
    for (const [x, y, ram, k] of [[3, 12, Ci, 4], [8, 26, Mg, 3], [77, 50, Ci, 3], [1, 62, Mg, 4], [20, 6, Mg, 3], [74, 74, Ci, 4], [58, 4, Ci, 3], [3, 33, Ci, 3], [70, 33, Mg, 2], [38, 3, Mg, 2], [21, 66, Ci, 2], [59, 60, Mg, 2], [76, 6, Mg, 3]]) if (!g.get(x, y)) pon(g, ram, k, [x, y]);
    destello(g, 5, 4, Ci, 2); destello(g, 72, 58, Mg, 2); destello(g, 16, 64, Ci, 1);
    return g;
  }

  /* ---------- Registro ---------- */
  window.MONSTRUOS_HD = window.MONSTRUOS_HD || {};
  Object.assign(window.MONSTRUOS_HD, { trol, liche, vampiro, dragon, devorador });
})();
