/* Dados y Mazmorras · enemigos normales a 64×64, primera tanda.
   rata, goblin, osolechuza, esqueleto, mimico, cubo y golem. Cada función devuelve una Rejilla NUEVA de 64×64,
   mirando a la izquierda (hacia los héroes), con los pies en la fila 62 (la 63 solo lleva contorno).
   Misma criatura, colores y accesorios que en monstruos_hd_a.js (48×48), con más resolución y mejor acabado:
   rampas con desplazamiento de matiz (sombras frías, luces cálidas), luz desde arriba a la izquierda,
   texturas propias de cada material y contorno selectivo. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R0, umbral } = PX;
  const W = 64;
  const CONTORNO = PX.CONTORNO || "#140b07";

  /* ---------- Color: desplazamiento de matiz ---------- */
  const aRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const aHex = (r, g, b) => "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  function aHsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function deHsl(h, s, l) {
    h = (((h % 360) + 360) % 360) / 360;
    if (s === 0) return aHex(l * 255, l * 255, l * 255);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return aHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
  }
  const mezcla = (a, b, t) => { const x = aRgb(a), y = aRgb(b); return aHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  const hacia = (h, obj, grados) => { const d = ((obj - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), grados); };
  /* Por tono: [matiz objetivo, grados como mucho, cambio de saturación]. Sombras al violeta, luces al ámbar. */
  const AJUSTE = [[255, 18, 0.05], [255, 9, 0.03], [0, 0, 0], [48, 6, 0], [48, 12, -0.02]];
  function matizar(ram) {
    return ram.map((c, i) => {
      const [h, s, l] = aHsl(aRgb(c));
      const [obj, gr, ds] = AJUSTE[i];
      if (!gr) return c;
      const s2 = s < 0.08 ? s + (i < 2 ? 0.06 : 0.04) : Math.max(0, Math.min(1, s + ds));
      return deHsl(s < 0.08 ? obj : hacia(h, obj, gr), s2, l);
    });
  }
  const R = {};
  for (const [k, v] of Object.entries(R0)) {
    if (Array.isArray(v)) R[k] = matizar(v);
    else { R[k] = {}; for (const [k2, v2] of Object.entries(v)) R[k][k2] = matizar(v2); }
  }
  /* Mezcla dos rampas tono a tono (lo que se ve a través de la gelatina del cubo). */
  const tinte = (a, b, t) => a.map((c, i) => mezcla(c, b[i], t));

  /* ---------- Rampas propias ---------- */
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  const LINEA = [CONTORNO, "#2a1712", "#3e241a", "#583626", "#74503a"];                 // contorno exterior
  const OXIDO = matizar(["#2e1408", "#4e220e", "#7a3a16", "#a4582a", "#c97c44"]);       // herrumbre
  const BABA = matizar(["#14321e", "#215230", "#337a44", "#5aa860", "#a6e08a"]);        // gas y ácido
  const ROSA = ["#4a2028", "#7e3c40", "#b5645e", "#e09484", "#f9c8b4"];                 // colas y patas de rata
  const OJO_R = ["#3a0608", "#7a0e0e", "#c0201a", "#ff5a2e", "#ffd27a"];                // ojos de rata encendidos
  const AMBAR = ["#4a2008", "#8a4410", "#d08a1e", "#f6c440", "#fff4b0"];                // ojos de lechuza y goblin
  const ACERO = ["#1b1d2b", "#383f55", "#626e84", "#a5b1c1", "#f1f4ee"];                // filos
  const PLUMA_O = matizar(["#3a2408", "#6b4a1a", "#a8782a", "#e0b04a", "#fff0a0"]);    // plumas ocres
  const ORO = ["#3a1f10", "#6e4518", "#b57d27", "#e9bf4e", "#fff2a6"];
  const GARGANTA = ["#14040a", "#2e0810", "#561018", "#86202a", "#b8403c"];            // fauces del mímico
  const FUEGO = R.fuego;

  /* ---------- Utilidades ---------- */
  const capa = () => new Capa(W, W);
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pon = (g, ram, k, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[lim(k, 0, 4)], ram); return g; };
  const tonoDe = (g, x, y, ram) => (g.rampa(x, y) === ram ? ram.indexOf(g.get(x, y)) : -1);
  const hash = (a, b, s = 0) => {
    let h = (Math.imul(a + 101, 374761393) + Math.imul(b + 57, 668265263) + Math.imul(s + 13, 1442695041)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  /* Recorre los píxeles de una capa. */
  const cada = (c, fn) => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (c.tiene(x, y)) fn(x, y); };
  /* Sube o baja un tono los píxeles de una rampa dentro de una capa. */
  function matiz(g, c, ram, d, min = 0, max = 4) {
    cada(c, (x, y) => { const t = tonoDe(g, x, y, ram); if (t >= 0) pon(g, ram, lim(t + d, min, max), [x, y]); });
  }
  /* Pinta una capa solo donde aún no hay nada, como si quedara detrás. */
  function detras(g, c, ram, op) {
    cada(c, (x, y) => { if (g.get(x, y)) c.off(x, y); });
    return c.pintar(g, ram, op);
  }
  /* Línea de un tono que solo cae sobre lo ya pintado con «sobre» (o sobre todo si es null). */
  function surco(g, ram, k, x0, y0, x1, y1, sobre = ram) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!sobre || g.rampa(x, y) === sobre) pon(g, ram, k, [x, y]);
    }
  }
  /* Curva de un píxel de un tono, recortada a lo que ya es de la rampa. */
  function trazo(g, ram, k, x0, y0, cx, cy, x1, y1, sobre = ram) {
    const n = 48;
    for (let s = 0; s <= n; s++) {
      const t = s / n, u = 1 - t;
      const x = Math.round(u * u * x0 + 2 * u * t * cx + t * t * x1), y = Math.round(u * u * y0 + 2 * u * t * cy + t * t * y1);
      if (!sobre || g.rampa(x, y) === sobre) pon(g, ram, k, [x, y]);
    }
  }
  /* Hilo fino sin contorno: solo pinta los píxeles vacíos (bigotes, babas). */
  function hilo(g, x0, y0, x1, y1, ram, k) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!g.get(x, y)) pon(g, ram, k, [x, y]);
    }
  }
  /* Bisel: canto de luz arriba a la izquierda y de sombra abajo a la derecha (placas, tablas). */
  function bisel(g, c, ram, luz = 3, sombra = 1) {
    const lu = [], so = [];
    cada(c, (x, y) => {
      if (!c.tiene(x - 1, y) || !c.tiene(x, y - 1)) lu.push([x, y]);
      else if (!c.tiene(x + 1, y) || !c.tiene(x, y + 1)) so.push([x, y]);
    });
    if (luz !== null) pon(g, ram, luz, ...lu);
    if (sombra !== null) pon(g, ram, sombra, ...so);
  }
  /* Penumbra tramada en la parte baja de una capa (la luz viene de arriba). */
  function penumbra(g, c, ram, y0, y1, fuerza = 0.4) {
    cada(c, (x, y) => {
      const t = tonoDe(g, x, y, ram);
      if (t > 1 && y >= y0 && (y - y0) / Math.max(1, y1 - y0) > umbral(x, y) + fuerza) pon(g, ram, t - 1, [x, y]);
    });
  }
  /* Remache: cabeza con brillo y sombra proyectada. */
  function remache(g, ram, x, y, grande = false) {
    if (grande) {
      pon(g, ram, 4, [x, y]); pon(g, ram, 3, [x + 1, y], [x, y + 1]); pon(g, ram, 1, [x + 1, y + 1]);
      for (const [a, b] of [[2, 1], [1, 2], [2, 2]]) if (g.rampa(x + a, y + b) === ram) pon(g, ram, 0, [x + a, y + b]);
    } else {
      pon(g, ram, 4, [x, y]);
      if (g.rampa(x + 1, y + 1) === ram) pon(g, ram, 0, [x + 1, y + 1]);
    }
  }
  /* Brillo especular: cruz pequeña con el centro en el tono más claro. */
  function destello(g, ram, x, y, grande = false) {
    pon(g, ram, 4, [x, y]);
    if (grande) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!g.get(x + a, y + b) || tonoDe(g, x + a, y + b, ram) >= 0) pon(g, ram, 3, [x + a, y + b]);
  }
  /* Mancha de herrumbre: una mancha compacta, más oscura en el centro, solo sobre el metal. */
  function herrumbre(g, metal, x, y, r, sem) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i, j * 1.2) + hash(x + i, y + j, sem) * 0.9;
      if (d > r + 0.3 || g.rampa(x + i, y + j) !== metal) continue;
      pon(g, OXIDO, d < r * 0.45 ? 1 : d < r * 0.8 ? 2 : 3, [x + i, y + j]);
    }
  }
  /* Mechones de pelo: trazos cortos de sombra en una dirección con su brillo detrás. */
  function mechones(g, c, ram, sem, paso, dir, largo = 3, minT = 1) {
    for (let y = 0; y < W; y += paso) for (let x = ((y / paso) & 1) * (paso >> 1); x < W; x += paso) {
      const px = x + Math.floor(hash(x, y, sem) * paso), py = y + Math.floor(hash(y, x, sem + 7) * paso);
      if (!c.tiene(px, py)) continue;
      const t = tonoDe(g, px, py, ram);
      if (t < minT) continue;
      const [dx, dy] = typeof dir === "function" ? dir(px, py) : dir;
      for (let k = 0; k < largo; k++) {
        const qx = Math.round(px + dx * k), qy = Math.round(py + dy * k), tq = tonoDe(g, qx, qy, ram);
        if (c.tiene(qx, qy) && tq >= 1) pon(g, ram, tq - 1, [qx, qy]);
      }
      const hx = Math.round(px - dx), hy = Math.round(py - dy), th = tonoDe(g, hx, hy, ram);
      if (t >= 2 && c.tiene(hx, hy) && th >= 1 && th < 4) pon(g, ram, th + 1, [hx, hy]);
    }
  }
  /* Abanico de garras de 1 píxel. */
  const abanico = (c, x, y, puntas) => { puntas.forEach(([a, b]) => c.linea(x, y, x + a, y + b, 1)); return c; };
  function garras(g, x, y, puntas, ram = HUESO) {
    for (const [a, b] of puntas) {
      const n = Math.max(Math.abs(a), Math.abs(b));
      for (let s = 1; s <= n; s++) {
        const px = Math.round(x + (a * s) / n), py = Math.round(y + (b * s) / n);
        pon(g, ram, s === n ? 4 : s === n - 1 ? 3 : 2, [px, py]);
      }
    }
  }

  /* ---------- Contorno selectivo ----------
     Fuera, en el lado de la luz (sin vecino a la izquierda ni arriba), el contorno toma la sombra más honda del
     material vecino; en el resto es casi negro. Cada píxel guarda su rampa para que .tenida() funcione. */
  function contornoSel(g, oscuro = CONTORNO, ramOscura = LINEA) {
    const nuevos = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      const vec = ab ? [x, y + 1] : de ? [x + 1, y] : iz ? [x - 1, y] : [x, y - 1];
      const ram = g.rampa(vec[0], vec[1]);
      if (!iz && !ar && ram && ram !== LINEA && y < W - 1) nuevos.push([x, y, ram[0], ram]);
      else nuevos.push([x, y, oscuro, ramOscura]);
    }
    for (const [x, y, c, r] of nuevos) g.set(x, y, c, r);
    return g;
  }
  /* Antialias del contorno en escalones: el píxel de dentro de cada esquina toma un tono intermedio. */
  function suavizar(g) {
    const cambios = [];
    for (let y = 1; y < W - 1; y++) for (let x = 1; x < W - 1; x++) {
      const r = g.rampa(x, y);
      if (!r || r === LINEA) continue;
      const t = r.indexOf(g.get(x, y));
      if (t < 2) continue;
      const fuera = (a, b) => g.rampa(a, b) === LINEA || !g.get(a, b);
      /* Esquina convexa: dos lados contiguos dan al contorno. */
      const n = [fuera(x - 1, y), fuera(x, y - 1), fuera(x + 1, y), fuera(x, y + 1)];
      const esq = (n[0] && n[1]) || (n[1] && n[2]) || (n[2] && n[3]) || (n[3] && n[0]);
      if (esq && n.filter(Boolean).length === 2) cambios.push([x, y, r, t - 1]);
    }
    for (const [x, y, r, t] of cambios) g.set(x, y, r[t], r);
    return g;
  }

  /* ---------- La plaga de ratas: una rata enorme y sarnosa delante y otra gris detrás ---------- */
  /* Cola de rata con anillos. */
  function cola(g, x0, y0, cx, cy, x1, y1, g0, g1, max = 4) {
    const c = capa().curva(x0, y0, cx, cy, x1, y1, g0, g1);
    detras(g, c, ROSA, { relieve: 1.4, max });
    const n = 60;
    let ant = null;
    for (let s = 0; s <= n; s++) {
      const t = s / n, u = 1 - t;
      const x = Math.round(u * u * x0 + 2 * u * t * cx + t * t * x1), y = Math.round(u * u * y0 + 2 * u * t * cy + t * t * y1);
      if (ant && Math.hypot(x - ant[0], y - ant[1]) < 2.6) continue;
      ant = [x, y];
      if (tonoDe(g, x, y, ROSA) > 0 && c.tiene(x, y)) pon(g, ROSA, tonoDe(g, x, y, ROSA) - 1, [x, y]);
    }
  }
  /* Pie de rata rosado con dedos y uñas, apuntando a la izquierda. */
  function pieRata(g, x, y, max = 4) {
    const c = capa().rect(x + 2, y, 4, 1).rect(x, y + 1, 7, 2);
    c.pintar(g, ROSA, { relieve: 1.2, max, separar: true });
    pon(g, ROSA, Math.min(max, 3), [x + 2, y], [x, y + 1]);
    pon(g, ROSA, 1, [x + 2, y + 2], [x + 4, y + 2]);
    pon(g, HUESO, max >= 3 ? 4 : 2, [x - 1, y + 2]);
    pon(g, HUESO, 2, [x + 1, y + 2]);
  }
  function rata() {
    const g = new Rejilla(W, W), G = R.piel.gris, C = R.pelo.castano, S = R.sangre;

    /* --- Rata gris del fondo, encaramada al lomo de la grande --- */
    cola(g, 53, 38, 63, 41, 59, 26, 3, 1.2, 2);
    const gris = capa().ell(46, 37, 10.5, 6.4).ell(37, 37.6, 6, 5.4).poly([[37, 32.6], [25.5, 38], [26, 40], [37, 42.6]]);
    for (const [i, j] of [[42, 31.4], [47, 30.6], [52, 32]]) gris.poly([[i - 2, j + 1.8], [i + 1.2, j - 2], [i + 2, j + 1.8]]);
    gris.pintar(g, G, { relieve: 4.5, max: 3, separar: true });
    mechones(g, gris, G, 11, 3, [1, 0.25], 3);
    trazo(g, G, 1, 40, 33, 41.5, 38, 40, 42);
    trazo(g, G, 3, 39, 33, 40.5, 37.5, 39, 41);
    /* Oreja. */
    const orG = capa().ell(39.5, 31.6, 3.2, 3.4);
    orG.pintar(g, G, { relieve: 2, max: 3, separar: true });
    capa().ell(39.3, 32.1, 1.8, 2.1).pintar(g, ROSA, { relieve: 1, min: 1, max: 2 });
    pon(g, ROSA, 3, [38, 31]);
    /* Ojo rojo, nariz y boca. */
    pon(g, NEGRO, 0, [30, 34], [31, 34], [32, 34], [33, 35], [33, 36]);
    pon(g, OJO_R, 3, [31, 35], [32, 35]); pon(g, OJO_R, 4, [31, 35]); pon(g, OJO_R, 1, [31, 36], [32, 36]);
    pon(g, ROSA, 4, [25, 38]); pon(g, ROSA, 3, [26, 38], [25, 39]); pon(g, ROSA, 1, [26, 39]);
    pon(g, G, 4, [28, 36], [29, 36], [27, 37]);
    pon(g, NEGRO, 1, [27, 41], [28, 41], [29, 41], [30, 41]);
    pon(g, R.tela.ocre, 4, [27, 42]); pon(g, R.tela.ocre, 2, [28, 42]);

    /* --- Rata grande del frente --- */
    cola(g, 47, 55, 63, 63, 59, 44, 4.2, 1.2);
    /* Pata trasera del fondo. */
    detras(g, capa().linea(38, 53, 36, 59, 4.2), C, { relieve: 1.5, max: 1 });
    pieRata(g, 33, 60, 2);
    /* Cuerpo: lomo arqueado, cuartos traseros, hombros, cabeza y hocico. */
    const cuerpo = capa().ell(34, 50, 14.5, 8.2).ell(44, 49.5, 8.6, 9.4).ell(23, 51, 8, 7.2).ell(15.5, 50, 6.5, 5.6)
      .poly([[15, 44.6], [3, 51.4], [3.4, 53.8], [15, 55.6]]);
    /* Mechones de pelo sucio erizados en el lomo. */
    for (const [i, j] of [[24, 44], [29.5, 42.6], [35, 41.4], [40.5, 40.4], [46, 40.6], [50.5, 42.6]]) cuerpo.poly([[i - 2.6, j + 2.2], [i + 1.8, j - 2.8], [i + 2.6, j + 2.2]]);
    cuerpo.pintar(g, C, { relieve: 6, separar: true });
    /* Pelaje que va hacia atrás. */
    mechones(g, cuerpo, C, 7, 3, (x, y) => (x > 38 ? [0.7, 1] : [1, 0.3]), 3);
    /* Capas de pelo: arcos oscuros con su brillo encima. */
    for (const [x0, y0, cx, cy, x1, y1] of [[20, 47, 25, 43.5, 31, 44.5], [27, 49, 33, 45.5, 39, 46.5], [34, 44, 40, 42, 45, 44],
      [24, 53, 29, 50.5, 35, 52], [33, 54, 38, 51.5, 43, 54], [41, 46, 46, 44, 50, 47]]) {
      trazo(g, C, 1, x0, y0, cx, cy, x1, y1);
      trazo(g, C, 3, x0, y0 - 1, cx, cy - 1, x1, y1 - 1);
    }
    /* Muslo trasero y mejilla. */
    trazo(g, C, 1, 40, 42, 50, 45, 47, 57);
    trazo(g, C, 0, 47, 55, 48, 57, 47, 58);
    trazo(g, C, 1, 18, 45, 21, 50, 18.5, 55.5);
    trazo(g, C, 3, 17, 45, 20, 50, 17.5, 55);
    /* Vientre más claro, con luz rebotada. */
    cada(cuerpo, (x, y) => {
      if (y < 52 || x < 9) return;
      if (!cuerpo.tiene(x, y + 1)) pon(g, C, 3, [x, y]);
      else if (!cuerpo.tiene(x, y + 2) && (x + y) % 2) pon(g, C, 2, [x, y]);
    });
    /* Cicatrices y una calva de sarna con una llaga. */
    surco(g, ROSA, 2, 31, 45, 36, 49.5, C); surco(g, ROSA, 3, 33, 44.6, 37.6, 48.4, C);
    pon(g, ROSA, 1, [32, 47], [36, 50], [34, 45]);
    const calva = capa().ell(45, 46, 2.3, 1.7).recortar(cuerpo);
    calva.pintar(g, ROSA, { relieve: 1.2, min: 1, max: 3 });
    pon(g, S, 3, [45, 46]); pon(g, S, 1, [46, 47]); pon(g, ROSA, 4, [44, 45]);
    /* Pata trasera de delante y su pie. */
    capa().linea(47, 53, 46, 59, 4.2).pintar(g, C, { relieve: 1.6, separar: true });
    pon(g, C, 3, [45, 54], [45, 55]);
    pieRata(g, 41, 60);
    /* Patas delanteras: la del fondo y la de delante. */
    capa().linea(25.5, 56, 26, 59.5, 3.2).pintar(g, C, { relieve: 1.2, max: 2, separar: true });
    pieRata(g, 22, 60, 3);
    capa().linea(17.5, 54.5, 15, 59.5, 3.6).pintar(g, C, { relieve: 1.4, separar: true });
    pon(g, C, 4, [16, 56]); pon(g, C, 3, [15, 57]);
    pieRata(g, 10, 60);
    /* Oreja redonda con el pabellón rosado. */
    const oreja = capa().ell(20.5, 43, 4, 4);
    oreja.pintar(g, C, { relieve: 2, separar: true });
    capa().ell(20.2, 43.6, 2.4, 2.7).pintar(g, ROSA, { relieve: 1.2, min: 1, max: 3 });
    pon(g, ROSA, 4, [19, 42]); pon(g, C, 4, [18, 40], [19, 39]);
    /* Ojo rojo encendido bajo la ceja. */
    pon(g, NEGRO, 0, [10, 46], [11, 45], [12, 45], [13, 45], [14, 46], [15, 46], [15, 47], [15, 48], [11, 48]);
    pon(g, OJO_R, 2, [12, 47], [13, 47], [14, 47]); pon(g, OJO_R, 4, [12, 46]); pon(g, OJO_R, 3, [13, 46]);
    pon(g, OJO_R, 1, [12, 48], [13, 48], [14, 48]); pon(g, NEGRO, 0, [14, 47]);
    pon(g, C, 4, [12, 44], [13, 44], [14, 44]);
    /* Hocico: caña iluminada, nariz rosada y boca con incisivos amarillos. */
    for (let i = 5; i <= 11; i++) pon(g, C, i < 8 ? 4 : 3, [i, Math.round(51.2 - (i - 3) * 0.55)]);
    pon(g, ROSA, 4, [3, 51]); pon(g, ROSA, 3, [3, 52], [4, 51]); pon(g, ROSA, 1, [4, 52], [3, 53]);
    pon(g, NEGRO, 1, [4, 54], [5, 54], [6, 55], [7, 55], [8, 55], [9, 55], [10, 55], [11, 55]);
    pon(g, NEGRO, 0, [12, 54]);
    pon(g, R.tela.ocre, 4, [6, 56]); pon(g, R.tela.ocre, 3, [7, 56], [6, 57]); pon(g, R.tela.ocre, 1, [7, 57]);
    pon(g, C, 1, [8, 56], [9, 56], [10, 56]);
    /* Patas de la gris agarradas al lomo. */
    pon(g, ROSA, 3, [29, 42], [30, 42]); pon(g, ROSA, 2, [31, 42]); pon(g, ROSA, 1, [30, 43]);
    contornoSel(g);
    suavizar(g);
    /* Bigotes. */
    for (const [x0, y0, x1, y1] of [[4, 52, 1, 49], [4, 53, 1, 56], [6, 51, 3, 46], [25, 39, 21, 37], [25, 40, 21, 42]]) hilo(g, x0, y0, x1, y1, HUESO, 2);
    return g;
  }

  /* ---------- Krug, el jefe goblin: chatarra por armadura, capa roja rota y una cuchilla ---------- */
  function goblin() {
    const g = new Rejilla(W, W), V = R.piel.verde, F = R.hierro, M = R.madera, T = R.tela.granate, Cu = R.pelo.castano, B = R.bronce, Ro = R.piel.roja;
    /* Capa raída detrás, con pliegues y agujeros. */
    const capaT = capa().poly([[31, 32], [43, 32], [48.5, 60], [45.5, 57], [43, 61.4], [39.5, 57.6], [36, 60.8], [33, 55.5]]);
    capaT.pintar(g, T, { relieve: 3, max: 3 });
    for (const [x0, y0, x1, y1] of [[38, 35, 39.5, 56], [42, 35, 45, 56], [35, 36, 35, 54]]) { surco(g, T, 1, x0, y0, x1, y1); surco(g, T, 3, x0 - 1, y0 + 1, x1 - 1, y1); }
    g.quitar(44, 47); g.quitar(45, 48); g.quitar(44, 48);
    penumbra(g, capaT, T, 44, 60, 0.2);
    /* Oreja de atrás. */
    capa().poly([[33.5, 17], [35.5, 26.5], [44.5, 19.8], [54, 11.5], [43, 14.4]]).pintar(g, V, { relieve: 2.4, max: 3 });
    surco(g, Ro, 1, 36, 20, 47, 15.5, V); surco(g, Ro, 2, 36, 21, 46, 16.5, V);
    pon(g, V, 4, [52, 12], [50, 13]);
    /* Pierna y brazo de atrás. */
    capa().linea(34, 49, 36.5, 56.5, 5).pintar(g, V, { relieve: 1.8, max: 2 });
    const pieA = capa().rect(34, 57, 8, 6).off(41, 57);
    pieA.pintar(g, M, { relieve: 1.8, max: 2, separar: true });
    for (const j of [58, 60]) surco(g, M, 0, 34, j, 41, j, M);
    capa().linea(37.5, 36, 41.5, 42.5, 4).linea(41.5, 42.5, 41.5, 46.5, 4).pintar(g, V, { relieve: 1.8, max: 2, separar: true });
    /* Saco del botín. */
    const saco = capa().ell(44, 52, 4.6, 4.8).poly([[42, 45.4], [46, 45.4], [45.6, 48.4], [42.4, 48.4]]);
    saco.pintar(g, R.tela.ocre, { relieve: 2.5, max: 3, separar: true });
    trazo(g, R.tela.ocre, 1, 42, 50, 43, 53, 42.5, 56); trazo(g, R.tela.ocre, 1, 45.5, 49, 47, 52, 46, 56);
    surco(g, M, 2, 42, 48, 46, 48, null); pon(g, M, 4, [42, 48]);
    pon(g, ORO, 4, [43, 51]); pon(g, ORO, 3, [44, 51], [43, 52]); pon(g, ORO, 2, [45, 54]); pon(g, ORO, 3, [46, 53]);
    /* Mano de atrás cerrada sobre el cuello del saco. */
    capa().ell(42, 46.4, 2, 1.8).pintar(g, V, { relieve: 1, max: 2, separar: true });

    /* Torso: jubón de cuero bajo placas de chatarra. */
    const torso = capa().ell(29.5, 39.4, 8.5, 7.2).rect(21, 38.6, 17, 10.4);
    torso.pintar(g, Cu, { relieve: 3, separar: true });
    for (let j = 40; j <= 47; j += 2) { pon(g, Cu, 1, [36, j]); pon(g, Cu, 3, [36, j + 1]); }
    const peto = capa().poly([[22, 35.4], [35.4, 34], [36.6, 44], [29.4, 46.6], [22, 44.6]]);
    peto.pintar(g, F, { relieve: 3, separar: true });
    /* Tres chapas desparejas: costura, cantos y remaches. */
    const chapa1 = capa().poly([[22, 35.4], [35.4, 34], [35.8, 39.6], [22.3, 40.4]]).recortar(peto);
    bisel(g, chapa1, F, null, 1);
    surco(g, F, 3, 23, 41, 35, 40.4);
    surco(g, F, 1, 29, 41, 29.5, 46);
    surco(g, F, 3, 30, 41, 30.5, 46);
    for (const [i, j] of [[24, 37], [33, 36], [24, 42], [27, 44], [33, 42]]) remache(g, F, i, j);
    herrumbre(g, F, 27, 38, 1.6, 3); herrumbre(g, F, 34, 44, 1.4, 5); herrumbre(g, F, 23, 44, 1, 8);
    pon(g, F, 4, [25, 36], [26, 36], [27, 36]);
    /* Correa en bandolera y cinturón con hebilla. */
    capa().linea(35.5, 34.5, 23.5, 46.6, 1.6).recortar(torso).pintar(g, M, { plano: 2 });
    surco(g, M, 4, 35, 34, 23, 46, M);
    capa().rect(21, 46.4, 17, 3).pintar(g, M, { relieve: 1, separar: true });
    surco(g, M, 3, 21, 46, 37, 46, M);
    capa().rect(25, 46, 4, 3).pintar(g, B, { plano: 3 });
    pon(g, B, 4, [25, 46], [26, 46]); pon(g, B, 1, [28, 48], [27, 48]); pon(g, M, 0, [26, 47], [27, 47]);
    /* Taparrabos. */
    const tapa = capa().poly([[22.2, 49], [35.2, 49], [34, 54.2], [31, 53], [28.7, 56.4], [26, 53.4], [23.5, 54.2]]);
    tapa.pintar(g, Cu, { relieve: 1.8, max: 3, separar: true });
    surco(g, Cu, 0, 26, 50, 26, 53); surco(g, Cu, 0, 31, 50, 31, 52.5);
    for (let i = 23; i <= 34; i += 3) pon(g, Cu, 4, [i, 49]);
    /* Pierna de delante y pie envuelto en trapos. */
    capa().linea(25, 50.5, 22.5, 56.6, 5.2).pintar(g, V, { relieve: 1.8, separar: true });
    pon(g, V, 4, [22, 53], [21, 55]);
    const pieD = capa().rect(16, 57, 11, 6).off(26, 57).off(16, 57).off(17, 57);
    pieD.pintar(g, M, { relieve: 1.8, separar: true });
    for (const [j, a] of [[58, 18], [60, 16]]) { surco(g, M, 1, a, j, 26, j); surco(g, M, 3, a, j + 1, 26, j + 1); }
    pon(g, V, 2, [16, 62], [17, 62]); pon(g, HUESO, 4, [15, 62]); pon(g, HUESO, 3, [15, 61]);

    /* Hombrera con pincho. */
    const hombrera = capa().ell(23.5, 34.6, 5.4, 4).poly([[20.6, 32], [18.6, 25.6], [24.4, 31.2]]);
    hombrera.pintar(g, F, { relieve: 2.5, separar: true });
    surco(g, F, 4, 19, 26.5, 21, 31);
    herrumbre(g, F, 25, 36, 1.3, 11);
    remache(g, F, 22, 33, true);

    /* Cabeza grande, orejas de soplillo y nariz ganchuda. */
    capa().rect(24.5, 30.5, 7, 4).pintar(g, V, { relieve: 1.2, max: 2, separar: true });
    const cab = capa().ell(27.4, 24.4, 9.1, 8).poly([[21, 24.4], [14.4, 28.9], [16.4, 31.6], [21, 30.2]]).ell(24.4, 29.6, 6.2, 4);
    cab.pintar(g, V, { relieve: 5, separar: true });
    /* Oreja de delante con el borde rojo y una muesca. */
    const orD = capa().poly([[21.6, 17.2], [20.3, 26.4], [13.2, 22.4], [4, 12.6], [13.2, 15.2]]);
    orD.pintar(g, V, { relieve: 2.6, separar: true });
    surco(g, Ro, 1, 18.5, 20.5, 8, 14.5, V); surco(g, Ro, 2, 18.5, 21.5, 9, 15.6, V); pon(g, Ro, 3, [17, 21], [14, 19]);
    for (const [i, j] of [[5, 13], [7, 14], [9, 15], [11, 16]]) pon(g, V, 4, [i, j]);
    g.quitar(9, 19); g.quitar(10, 20); g.quitar(10, 19);
    /* Cuerno de hueso en el casco. */
    const cuerno = capa().curva(29.4, 16.6, 36, 12.6, 33, 4.6, 4.2, 1.2);
    cuerno.pintar(g, HUESO, { relieve: 1.8, min: 2 });
    for (const [i, j] of [[33, 13], [34, 10], [34, 8]]) { pon(g, HUESO, 1, [i, j]); pon(g, HUESO, 1, [i + 1, j]); }
    /* Casco abollado. */
    const casco = capa().ell(28, 21.4, 9.9, 7.3);
    casco.quitarRect(0, 23, W, W);
    casco.pintar(g, F, { relieve: 3, separar: true });
    for (let i = 17; i <= 38; i++) if (g.rampa(i, 22) === F) pon(g, F, i % 4 ? 1 : 3, [i, 22]);
    surco(g, F, 3, 18, 21, 37, 21, F);
    herrumbre(g, F, 31, 16, 1.6, 21); herrumbre(g, F, 35, 19, 1.2, 22); herrumbre(g, F, 22, 18, 1, 23);
    /* Abolladura: hondón oscuro con su brillo abajo. */
    pon(g, F, 1, [25, 17], [26, 16], [27, 16]); pon(g, F, 0, [26, 17]); pon(g, F, 4, [26, 18], [27, 18]);
    pon(g, F, 4, [22, 15], [23, 15], [21, 16]);
    remache(g, F, 21, 19, true); remache(g, F, 32, 19, true);
    /* Cara: ceño, ojos amarillos, nariz y sonrisa de colmillos torcidos. */
    surco(g, V, 0, 18, 23, 23, 24, null); surco(g, V, 0, 25, 24, 30, 23, null);
    pon(g, V, 1, [18, 24], [24, 25], [25, 25]);
    for (const ex of [19, 26]) {
      pon(g, HUESO, 4, [ex, 25]); pon(g, AMBAR, 4, [ex + 1, 25]); pon(g, AMBAR, 3, [ex + 2, 25]);
      pon(g, AMBAR, 2, [ex, 26]); pon(g, NEGRO, 0, [ex + 1, 26], [ex + 2, 26]); pon(g, AMBAR, 1, [ex + 3, 26]);
      pon(g, V, 1, [ex, 27], [ex + 1, 27], [ex + 2, 27]);
    }
    /* Nariz ganchuda. */
    capa().poly([[18, 25], [14, 29.4], [16, 30.4], [19.4, 28.6]]).pintar(g, V, { relieve: 1.4, separar: true });
    pon(g, V, 4, [17, 26], [16, 27], [15, 28]); pon(g, V, 0, [17, 30], [18, 29]);
    /* Boca: labio, hueco, colmillos y encías. */
    surco(g, NEGRO, 0, 16, 31, 27, 32, null);
    pon(g, NEGRO, 0, [17, 32], [18, 32], [19, 33], [20, 33], [21, 33], [22, 33], [23, 33], [24, 32], [25, 32]);
    pon(g, Ro, 1, [19, 34], [20, 34], [21, 34], [22, 34]);
    pon(g, HUESO, 4, [17, 31], [20, 32], [23, 31]); pon(g, HUESO, 3, [17, 32], [21, 32], [24, 31], [25, 31]);
    pon(g, HUESO, 4, [18, 34]); pon(g, HUESO, 3, [18, 35]); pon(g, HUESO, 3, [23, 34]);
    pon(g, V, 3, [19, 35], [20, 35], [21, 35]);
    /* Mejilla, arruga y cicatriz. */
    trazo(g, V, 1, 27, 27, 30, 29, 28, 32);
    pon(g, V, 4, [29, 26], [30, 26]);
    surco(g, Ro, 1, 31, 25, 34, 29, V); pon(g, Ro, 3, [32, 25]);
    /* Cuchilla de carnicero en la mano de delante. */
    const hoja = capa().poly([[5.4, 27.6], [13.2, 25], [16.4, 40.6], [8, 43.2]]);
    hoja.pintar(g, ACERO, { relieve: 2.6, min: 1 });
    surco(g, ACERO, 4, 5.6, 28.4, 8.4, 42.6, null);
    surco(g, ACERO, 3, 6.6, 28.4, 9.4, 42.4);
    surco(g, ACERO, 1, 13.4, 26, 16, 40.2);
    surco(g, ACERO, 0, 13.6, 25.6, 16.4, 40);
    /* Agujero, muescas del filo y sangre seca. */
    pon(g, NEGRO, 1, [11, 28], [12, 28]); pon(g, ACERO, 0, [11, 29]); pon(g, ACERO, 4, [12, 29]);
    g.quitar(6, 33); g.quitar(6, 34);
    for (const [i, j, k] of [[6, 31, 3], [7, 32, 2], [7, 36, 3], [8, 37, 2], [8, 39, 1], [9, 40, 2], [8, 41, 1], [6, 29, 2]]) pon(g, R.sangre, k, [i, j]);
    capa().linea(14.6, 38.4, 15.2, 49, 2.6).pintar(g, M, { relieve: 1, separar: true });
    for (let j = 45; j <= 48; j += 2) pon(g, M, 1, [15, j]);
    pon(g, B, 3, [14, 49], [15, 49]); pon(g, B, 4, [14, 49]);
    /* Brazo de delante y puño. */
    capa().linea(23.5, 36, 20.4, 42.5, 4.4).linea(20.4, 42.5, 17.2, 43.8, 4).pintar(g, V, { relieve: 1.8, separar: true });
    pon(g, V, 4, [22, 37], [21, 38], [21, 39]);
    capa().ell(15.8, 43.8, 3, 2.6).pintar(g, V, { relieve: 1.4, separar: true });
    pon(g, V, 0, [14, 43], [14, 45], [15, 44]); pon(g, V, 4, [14, 42], [15, 42]);
    /* Brazalete de cuero. */
    capa().rect(18, 41.6, 3, 4).pintar(g, M, { relieve: 1, separar: true });
    pon(g, M, 4, [18, 42]);
    contornoSel(g);
    suavizar(g);
    destello(g, ACERO, 6, 29, true);
    return g;
  }

  /* ---------- Oso-lechuza: cuerpo de oso, cabeza de lechuza con pico y plumas ---------- */
  function osolechuza() {
    const g = new Rejilla(W, W), C = R.pelo.castano, O = PLUMA_O, M = R.madera, P = R.piedra;
    const abajo = (x, y) => [0.3, 1];
    /* Brazo levantado de atrás, zarpa abierta. */
    const brazoA = capa().linea(44.6, 29.5, 51, 20.4, 6.5).linea(51, 20.4, 49.8, 11.4, 6.2).ell(49.8, 10, 4.2, 3.4);
    brazoA.pintar(g, C, { relieve: 3, max: 2 });
    mechones(g, brazoA, C, 3, 3, [0, 1], 3);
    garras(g, 49.8, 7.4, [[-4.4, -2.6], [-1.4, -4.6], [1.8, -4.6], [4.4, -2.6]]);
    /* Pierna de atrás. */
    const piernaA = capa().rect(40.7, 46.4, 10.4, 11).ell(45.9, 46, 5.2, 3).rect(37, 57, 14, 6).off(37, 57).off(50, 57);
    piernaA.pintar(g, C, { relieve: 3, max: 2 });
    mechones(g, piernaA, C, 4, 3, [0, 1], 3);
    /* Cuerpo enorme. */
    const cuerpo = capa().ell(36.2, 38.6, 14.3, 15).ell(31.6, 45.1, 11.7, 9.1);
    cuerpo.pintar(g, C, { relieve: 7, separar: true });
    mechones(g, cuerpo, C, 5, 3, abajo, 4);
    /* Mechones en el borde de la espalda. */
    for (const [i, j] of [[49, 32], [50.5, 38], [50.5, 44], [48.5, 49]]) capa().poly([[i - 1, j - 2.4], [i + 2.4, j + 0.4], [i - 1, j + 2.4]]).pintar(g, C, { plano: 1 });
    /* Pierna de delante. */
    const pierna = capa().rect(22.5, 47.7, 11.7, 9.5).ell(28.3, 48, 6, 3).rect(17.4, 57, 16, 6).off(17.4, 57).off(33, 57);
    pierna.pintar(g, C, { relieve: 3.5, separar: true });
    mechones(g, pierna, C, 9, 3, [0, 1], 3);
    surco(g, C, 1, 22, 56.5, 33, 56.5); surco(g, C, 3, 21, 57, 26, 57);
    pon(g, HUESO, 4, [16, 62], [19, 62], [22, 62], [38, 62], [41, 62]);
    pon(g, HUESO, 2, [17, 62], [20, 62], [23, 62], [39, 62], [42, 62]);
    pon(g, HUESO, 3, [16, 61]);
    /* Pecho de plumas en escamas. */
    const pecho = capa().ell(29, 39.9, 7.8, 11).recortar(cuerpo);
    pecho.pintar(g, O, { relieve: 3.5, max: 3 });
    for (let j = 30, f = 0; j <= 52; j += 3, f++) for (let i = 18 + (f % 2 ? 2 : 0); i <= 40; i += 4)
      if (pecho.tiene(i, j) && pecho.tiene(i + 3, j) && pecho.tiene(i, j + 1)) {
        const t = tonoDe(g, i + 1, j, O);
        pon(g, O, Math.max(0, t - 2), [i, j], [i + 3, j]);
        pon(g, O, Math.max(0, t - 1), [i + 1, j + 1], [i + 2, j + 1]);
        if (t >= 2) pon(g, O, Math.min(4, t + 1), [i + 1, j], [i + 2, j]);
      }
    penumbra(g, pecho, O, 44, 52, 0.3);
    /* Gorguera de plumas pardas sobre los hombros. */
    const gorguera = capa();
    for (const [i, j] of [[17.5, 27], [21.5, 28.8], [25.6, 29.4], [29.6, 29.4], [33.5, 28.2], [37.5, 27.6], [41, 27], [14.5, 25.6]])
      gorguera.poly([[i - 3, j - 4], [i + 3, j - 4], [i, j + 3.2]]);
    gorguera.pintar(g, M, { relieve: 1.8, separar: true });
    for (const [i, j] of [[17.5, 27], [21.5, 28.8], [25.6, 29.4], [29.6, 29.4], [33.5, 28.2], [37.5, 27.6], [41, 27]]) { surco(g, M, 1, i, j - 3, i, j + 2, M); pon(g, M, 4, [Math.round(i - 1), Math.round(j - 3)]); }
    /* Cabeza de lechuza con penachos. */
    const cab = capa().ell(25.8, 19.2, 10.4, 9.4).poly([[16.7, 14], [14, 3.6], [22, 10.7]]).poly([[30.3, 10.7], [38, 3.6], [36.2, 14.6]]);
    cab.pintar(g, M, { relieve: 5, separar: true });
    /* Plumas de la coronilla: trazos en V. */
    for (const [i, j] of [[29, 12], [32, 15], [34, 19], [31, 21], [34, 23], [27, 10], [33, 12], [30, 17], [24, 10]]) {
      pon(g, M, 1, [i, j], [i + 1, j + 1]); pon(g, M, 1, [i + 2, j]);
      if (tonoDe(g, i, j - 1, M) >= 2) pon(g, M, 4, [i, j - 1]);
    }
    for (const [x0, y0, x1, y1] of [[15, 4.5, 17, 12], [37, 4.5, 34, 12]]) surco(g, O, 3, x0, y0, x1, y1, M);
    pon(g, O, 4, [14, 4], [15, 5], [37, 4], [36, 5]); pon(g, O, 2, [16, 9], [35, 9]);
    /* Disco facial: anillo ocre y cara clara con plumillas radiales. */
    capa().ell(23.2, 19.8, 8.3, 7.3).pintar(g, O, { relieve: 1.8, min: 2, max: 3 });
    const cara = capa().ell(23.2, 19.9, 7, 6.1);
    cara.pintar(g, HUESO, { relieve: 3, min: 2 });
    for (let a = 0; a < 16; a++) {
      const an = (a / 16) * Math.PI * 2, x = 23.2 + Math.cos(an) * 5.8, y = 19.9 + Math.sin(an) * 5;
      if (tonoDe(g, Math.round(x), Math.round(y), HUESO) >= 2) pon(g, HUESO, tonoDe(g, Math.round(x), Math.round(y), HUESO) - 1, [Math.round(x), Math.round(y)]);
    }
    pon(g, O, 2, [23, 14], [23, 15], [24, 14]);
    /* Ojos enormes ámbar con pupila y brillo; ceño fruncido. */
    for (const ex of [18.6, 27.4]) {
      capa().ell(ex, 19.2, 3.4, 3.1).pintar(g, NEGRO, { plano: 1 });
      capa().ell(ex, 19.2, 2.8, 2.6).pintar(g, AMBAR, { relieve: 2, min: 2 });
      const cx = Math.round(ex), cy = 19;
      pon(g, NEGRO, 0, [cx - 1, cy], [cx, cy], [cx - 1, cy + 1], [cx, cy + 1], [cx - 1, cy - 1], [cx, cy + 2]);
      pon(g, HUESO, 4, [cx - 2, cy - 1]); pon(g, AMBAR, 4, [cx + 1, cy + 1]);
      pon(g, AMBAR, 1, [cx - 2, cy + 2], [cx - 1, cy + 2], [cx + 1, cy + 2]);
    }
    /* Ceño en V que se junta sobre el pico. */
    surco(g, M, 0, 14, 15, 22, 17, null); surco(g, M, 0, 24, 17, 31, 14, null);
    surco(g, M, 2, 14, 14, 22, 16, null); surco(g, M, 2, 24, 16, 31, 13, null);
    /* Pico ganchudo de piedra. */
    const pico = capa().poly([[21.2, 21], [25.2, 21], [25.2, 25], [23.2, 29], [21.2, 27.6], [20.6, 24.3]]);
    pico.pintar(g, P, { relieve: 1.8, min: 1, separar: true });
    pon(g, P, 4, [21, 22], [22, 22]); pon(g, P, 3, [21, 23], [21, 24]);
    pon(g, P, 0, [24, 26], [24, 27], [23, 28]); pon(g, NEGRO, 0, [22, 26], [23, 26]);
    /* Brazo de delante con zarpa abierta hacia los héroes. */
    const brazo = capa().linea(27.7, 30.8, 19.9, 38.6, 6.5).linea(19.9, 38.6, 13.4, 38.6, 5.2).ell(11.4, 38.6, 3.6, 3.4);
    brazo.pintar(g, C, { relieve: 3, separar: true });
    mechones(g, brazo, C, 13, 3, [1, 0.4], 3);
    garras(g, 8.6, 38.6, [[-4, -4], [-4.6, -0.6], [-4, 2.6], [-1.4, 4.6]]);
    pon(g, C, 1, [10, 37], [10, 40]); pon(g, C, 4, [11, 36], [12, 36]);
    contornoSel(g);
    suavizar(g);
    return g;
  }

  /* ---------- La guardia esqueleto: yelmo oxidado, escudo con la cruz roja y espada mellada ---------- */
  function esqueleto() {
    const g = new Rejilla(W, W), H = HUESO, F = R.hierro, Sg = R.sangre, T = R.tela.granate;
    const hueso = (c, op = {}) => c.pintar(g, H, { relieve: 1.2, min: 2, ...op });
    /* Brazo de atrás, que sujeta el escudo. */
    hueso(capa().linea(36, 23, 40, 29.5, 2.2).linea(40, 29.5, 42.6, 30.8, 2), { max: 2 });
    /* Escudo de cometa de hierro viejo con la cruz roja de Valdren. */
    const escudo = capa().poly([[38.6, 22.4], [56.4, 22.4], [56.4, 36], [47.5, 48.6], [38.6, 36]]);
    escudo.pintar(g, F, { relieve: 3.5, separar: true });
    const campo = capa().poly([[40.6, 24.4], [54.4, 24.4], [54.4, 35.4], [47.5, 45.6], [40.6, 35.4]]);
    campo.pintar(g, F, { relieve: 2.5, max: 3 });
    bisel(g, campo, F, 1, 3);
    const cruz = capa().rect(46, 24.4, 3, 21).rect(41, 29, 13, 3).recortar(campo);
    cruz.pintar(g, Sg, { relieve: 1.4, max: 3 });
    bisel(g, cruz, Sg, 4, 1);
    /* Desconchones, óxido y una mella. */
    herrumbre(g, F, 42, 26, 1.4, 1); herrumbre(g, F, 52, 33, 1.8, 2); herrumbre(g, F, 44, 39, 1.3, 3); herrumbre(g, F, 52, 26, 1, 4);
    pon(g, Sg, 1, [47, 34], [46, 38], [50, 30]); pon(g, OXIDO, 2, [48, 40], [47, 41]);
    for (const [i, j] of [[39, 23], [55, 23], [39, 35], [55, 35], [47, 47]]) remache(g, F, i, j, true);
    for (const [x, y] of [[56, 28], [56, 29], [55, 29], [56, 30]]) g.quitar(x, y);
    /* Arañazos. */
    surco(g, F, 4, 50, 37, 53, 34, F); surco(g, F, 1, 50, 38, 53, 35, F);
    /* Piernas: fémur, rodilla, tibia y pie. */
    const pierna = (x0, x1, x2, op) => {
      hueso(capa().linea(x0, 40, x1, 49, 2.6), op);
      hueso(capa().linea(x1, 51, x2, 58, 2.2).linea(x1 + 1.4, 51, x2 + 1.2, 58, 1), op);
      hueso(capa().ell(x1 + 0.4, 50, 1.8, 1.6), { ...op, separar: true });
    };
    pierna(33.5, 36, 37.4, { max: 3 });
    hueso(capa().rect(36, 59, 7, 4).off(42, 59).off(36, 59), { max: 3, separar: true });
    pierna(27, 24.4, 23, {});
    hueso(capa().rect(18, 59, 7, 4).off(18, 59).off(24, 59), { separar: true });
    for (const i of [19, 21, 23, 38, 40]) pon(g, H, 1, [i, 62]);
    pon(g, H, 4, [18, 61], [36, 61]);
    /* Faldón granate hecho jirones. */
    const falda = capa().poly([[24.4, 36.6], [36.8, 36.6], [38.2, 47.8], [35.4, 45], [33.6, 49.8], [30.9, 45.8], [28.3, 49.2], [26.3, 45], [23, 47.8]]);
    falda.pintar(g, T, { relieve: 2.5, max: 3, separar: true });
    for (const [x0, x1] of [[28, 28.3], [31, 31], [34, 34.5]]) { surco(g, T, 1, x0, 39, x1, 45); surco(g, T, 3, x0 - 1, 39, x1 - 1, 44); }
    surco(g, T, 4, 25, 37, 36, 37, T);
    /* Cinto con hebilla de bronce. */
    capa().rect(24, 36, 13, 2).pintar(g, R.madera, { relieve: 1, separar: true });
    capa().rect(29, 36, 3, 2).pintar(g, R.bronce, { plano: 3 }); pon(g, R.bronce, 4, [29, 36]); pon(g, R.bronce, 1, [31, 37]);
    /* Pelvis asomando y columna. */
    hueso(capa().ell(30.2, 34.4, 5.2, 1.8), { separar: true });
    pon(g, NEGRO, 0, [28, 34], [32, 34]);
    hueso(capa().rect(29, 28, 3, 6));
    for (let j = 28; j <= 33; j += 2) { pon(g, H, 1, [29, j], [30, j], [31, j]); pon(g, H, 4, [29, j + 1]); }
    /* Costillas: arcos con huecos y esternón. */
    const costillas = capa().ell(30.2, 24.4, 7, 5.4);
    hueso(costillas, { relieve: 3, separar: true });
    for (const j of [21, 23.4, 25.8, 28]) for (let i = 22; i <= 38; i++) {
      const jj = Math.round(j + Math.abs(i - 30) * 0.12);
      if (costillas.tiene(i, jj) && (i < 29 || i > 31)) pon(g, NEGRO, i > 31 ? 0 : 1, [i, jj]);
    }
    for (let i = 22; i <= 38; i++) for (let j = 19; j <= 30; j++)
      if (costillas.tiene(i, j) && g.get(i, j - 1) && g.rampa(i, j - 1) === NEGRO && tonoDe(g, i, j, H) >= 0 && i < 29) pon(g, H, 4, [i, j]);
    pon(g, H, 3, [29, 20], [29, 22], [29, 24], [29, 26]);
    /* Clavículas y cuello. */
    hueso(capa().linea(21.8, 19.8, 37.4, 19.8, 1.2).rect(29, 16, 3, 3));
    pon(g, H, 4, [22, 19], [23, 19], [35, 19]); pon(g, H, 1, [30, 17], [30, 18]);
    /* Cráneo con mandíbula desencajada. */
    hueso(capa().ell(27.6, 12, 6, 5.8).rect(23.6, 15, 7, 3.2), { relieve: 3.5, separar: true });
    hueso(capa().rect(23, 18, 7, 2).off(29, 19), { max: 3, separar: true });
    /* Cuencas con brasas, nariz y dientes. */
    for (const [x0, y0] of [[22, 11], [28, 11]]) {
      pon(g, NEGRO, 0, [x0, y0], [x0 + 1, y0], [x0 + 2, y0], [x0, y0 + 1], [x0 + 1, y0 + 1], [x0 + 2, y0 + 1], [x0 + 1, y0 + 2], [x0 + 2, y0 + 2]);
      pon(g, FUEGO, 4, [x0 + 1, y0]); pon(g, FUEGO, 3, [x0 + 1, y0 + 1], [x0 + 2, y0]); pon(g, FUEGO, 2, [x0 + 2, y0 + 1]);
    }
    pon(g, H, 1, [22, 13], [31, 13]);
    pon(g, NEGRO, 0, [26, 14], [26, 15], [25, 15]);
    for (let i = 23; i <= 30; i++) pon(g, i % 2 ? H : NEGRO, i % 2 ? 4 : 0, [i, 17]);
    for (let i = 23; i <= 28; i++) pon(g, i % 2 ? NEGRO : H, i % 2 ? 0 : 3, [i, 18]);
    pon(g, H, 1, [31, 14], [31, 15], [30, 16]);
    /* Grieta del cráneo. */
    pon(g, H, 0, [32, 10], [31, 9], [32, 8]); pon(g, H, 4, [33, 10]);
    /* Yelmo de nasal, oxidado. */
    const yelmo = capa().ell(28, 9.6, 7.4, 6).rect(19.8, 9, 17, 2);
    yelmo.quitarRect(0, 11, W, W);
    yelmo.pintar(g, F, { relieve: 3, separar: true });
    capa().rect(26, 10, 2, 5).pintar(g, F, { relieve: 1, min: 2 });
    pon(g, F, 4, [26, 10], [26, 11]); pon(g, F, 1, [27, 13], [27, 14]);
    for (let i = 20; i <= 36; i++) if (g.rampa(i, 10) === F && i !== 26 && i !== 27) pon(g, F, i % 3 ? 1 : 3, [i, 10]);
    surco(g, F, 4, 22, 6, 25, 4, F);
    herrumbre(g, F, 31, 6, 1.5, 7); herrumbre(g, F, 22, 8, 1, 8); herrumbre(g, F, 34, 8, 1, 9);
    remache(g, F, 22, 9); remache(g, F, 33, 9);
    /* Brazo de la espada, levantado hacia delante. */
    hueso(capa().linea(23, 20.4, 19.2, 27, 2.2).linea(19.2, 27, 15.3, 30.8, 2), { separar: true });
    pon(g, H, 4, [19, 26], [22, 21]); pon(g, H, 1, [19, 28]);
    /* Espada oxidada y mellada. */
    const hoja = capa().linea(14, 27, 6.2, 8.6, 2.8).poly([[4.8, 10.8], [5.4, 4.8], [8.4, 9.4]]);
    hoja.pintar(g, F, { relieve: 1.2, min: 2 });
    surco(g, F, 4, 12.6, 26.6, 4.8, 8, F);
    surco(g, F, 1, 14.6, 25.6, 7.4, 8.8, F);
    surco(g, F, 2, 13.6, 26, 6, 8.4, F);
    g.quitar(5, 13); g.quitar(5, 12); g.quitar(6, 16);
    herrumbre(g, F, 9, 18, 1, 31); herrumbre(g, F, 11, 22, 1, 32);
    capa().linea(10, 31, 18, 27, 2.2).pintar(g, F, { relieve: 1, min: 2, max: 3, separar: true });
    pon(g, F, 4, [10, 30], [11, 30]);
    capa().linea(15.4, 31, 16.6, 34.8, 1.6).pintar(g, R.madera, { relieve: 1, separar: true });
    capa().ell(16.8, 36, 1.4, 1.2).pintar(g, F, { relieve: 1, min: 2 });
    hueso(capa().ell(14.6, 30.4, 1.8, 1.7), { separar: true });
    pon(g, H, 1, [14, 31], [15, 31]);
    contornoSel(g);
    suavizar(g);
    destello(g, F, 6, 9);
    return g;
  }

  /* ---------- El mímico: cofre con la tapa abierta, dientes, lengua y un ojo ---------- */
  function mimico() {
    const g = new Rejilla(W, W), M = R.madera, F = R.hierro, B = R.bronce, L = R.piel.roja;
    /* Bisagra y giro de la tapa. */
    const [hx, hy] = [55, 41], a = 34 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const girar = pts => pts.map(([x, y]) => [hx + (x - hx) * ca - (y - hy) * sa, hy + (x - hx) * sa + (y - hy) * ca]);
    const [bocaX, bocaY] = girar([[12, 41]])[0];
    /* Garganta roja, más honda al fondo. */
    const boca = capa().poly([[12, 42.5], [bocaX, bocaY], [55, 41.5]]);
    boca.pintar(g, GARGANTA, { relieve: 4, max: 3 });
    cada(boca, (x, y) => { const f = (x - 30) / 18 + (y - 30) / 22; if (f > umbral(x, y) + 0.2) pon(g, GARGANTA, Math.max(0, tonoDe(g, x, y, GARGANTA) - 1), [x, y]); });
    /* Paladar con pliegues. */
    for (const [x0, y0, x1, y1] of [[27, 30, 40, 38], [33, 27, 45, 36], [21, 34, 32, 40]]) surco(g, GARGANTA, 3, x0, y0, x1, y1, GARGANTA);
    /* Monedas y una gema dentro de las fauces. */
    for (const [i, j] of [[24, 39], [28, 38], [33, 39], [37, 37], [40, 39], [30, 36], [43, 38], [35, 41], [26, 41]]) {
      pon(g, ORO, 3, [i, j], [i + 1, j]); pon(g, ORO, 4, [i, j]); pon(g, ORO, 1, [i + 1, j + 1], [i, j + 1]);
    }
    pon(g, R.piel.esmeralda, 4, [36, 39]); pon(g, R.piel.esmeralda, 3, [37, 39]); pon(g, R.piel.esmeralda, 1, [36, 40], [37, 40]);
    /* Cofre: tablas con vetas. */
    const caja = capa().rect(12, 42, 43, 21);
    caja.pintar(g, M, { relieve: 4, separar: true });
    for (const j of [48, 55]) { surco(g, M, 0, 12, j, 54, j); surco(g, M, 3, 12, j + 1, 54, j + 1, M); }
    for (let k = 0; k < 40; k++) {
      const i = 13 + Math.floor(hash(k, 1, 5) * 40), j = 43 + Math.floor(hash(k, 2, 5) * 19), n = 2 + Math.floor(hash(k, 3, 5) * 4);
      if ([48, 49, 55, 56].includes(j)) continue;
      for (let s = 0; s < n; s++) if (tonoDe(g, i + s, j, M) >= 2) pon(g, M, tonoDe(g, i + s, j, M) - 1, [i + s, j]);
    }
    /* Nudos de la madera. */
    for (const [i, j] of [[22, 52], [44, 59], [31, 45]]) { pon(g, M, 0, [i, j]); pon(g, M, 1, [i - 1, j], [i + 1, j]); pon(g, M, 3, [i, j - 1]); }
    penumbra(g, caja, M, 52, 62, 0.25);
    /* Herrajes verticales y zócalo. */
    const herrajes = capa().rect(15, 42, 4, 21).rect(47, 42, 4, 21);
    herrajes.pintar(g, F, { relieve: 1.6, separar: true });
    bisel(g, herrajes, F, 4, 1);
    for (const i of [16, 48]) for (const j of [44, 50, 57]) remache(g, F, i, j, true);
    capa().rect(12, 59, 43, 1).pintar(g, F, { plano: 1 });
    const zocalo = capa().rect(12, 60, 43, 3);
    zocalo.pintar(g, F, { relieve: 1.2, max: 3 });
    for (const i of [13, 22, 32, 41, 52]) remache(g, F, i, 61);
    herrumbre(g, F, 49, 54, 1.2, 2); herrumbre(g, F, 17, 47, 1, 3);
    /* Cerradura de latón con ojo de llave. */
    const cerr = capa().rect(30, 42, 7, 8).off(30, 49).off(36, 49);
    cerr.pintar(g, B, { relieve: 1.8, separar: true });
    bisel(g, cerr, B, 4, 1);
    pon(g, NEGRO, 0, [32, 44], [33, 44], [32, 45], [33, 45], [32, 46]);
    pon(g, B, 4, [31, 43]);
    /* Tapa abovedada, abierta. */
    const tapa = capa().poly(girar([[12, 41], [55, 41], [55, 33], [51, 29], [16, 29], [12, 33]]));
    tapa.pintar(g, M, { relieve: 4.5, separar: true });
    for (const yy of [33, 37]) { const [p0, p1] = girar([[13, yy], [54, yy]]); surco(g, M, 0, p0[0], p0[1], p1[0], p1[1], M); surco(g, M, 3, p0[0], p0[1] + 1, p1[0], p1[1] + 1, M); }
    for (const bx of [17, 49]) {
      const [p0, p1] = girar([[bx, 41], [bx, 29.5]]);
      const fleje = capa().linea(p0[0], p0[1], p1[0], p1[1], 4).recortar(tapa);
      fleje.pintar(g, F, { relieve: 1.8 });
      bisel(g, fleje, F, 4, 1);
      for (const ry of [39, 32]) { const [r] = girar([[bx, ry]]); remache(g, F, Math.round(r[0]), Math.round(r[1]), true); }
    }
    /* Dientes de la tapa y del cofre. */
    const dx = ca, dy = sa, nx = -sa, ny = ca;
    for (let s = 2.5; s <= 41; s += 4) {
      const bx = bocaX + dx * s, by = bocaY + dy * s, lg = s < 8 ? 5.6 : s > 34 ? 3 : 4;
      const d = capa().poly([[bx - dx * 1.8, by - dy * 1.8], [bx + nx * lg, by + ny * lg], [bx + dx * 1.8, by + dy * 1.8]]);
      d.pintar(g, HUESO, { relieve: 1.2, min: 2 });
    }
    for (let i = 14.5; i <= 53; i += 4) {
      const lg = i < 19 ? 6 : i > 46 ? 3.4 : 4.4;
      capa().poly([[i - 1.8, 42.4], [i, 42.4 - lg], [i + 1.8, 42.4]]).pintar(g, HUESO, { relieve: 1.2, min: 2 });
      pon(g, HUESO, 4, [Math.round(i - 1), 41]);
    }
    /* Lengua larga que cuelga hasta el suelo. */
    const lengua = capa().curva(30, 39, 1, 47, 6.5, 31, 7, 4.2).ell(6.4, 31, 3, 2.8);
    lengua.pintar(g, L, { relieve: 3, separar: true });
    trazo(g, L, 1, 27, 39.5, 4, 45, 6.6, 32, L);
    trazo(g, L, 4, 25, 37.5, 4, 42, 5, 31, L);
    pon(g, L, 4, [13, 38], [14, 38], [5, 36], [5, 35], [4, 33]);
    pon(g, L, 0, [10, 45], [11, 45], [12, 44], [8, 44]);
    /* Ojo amarillo inyectado en sangre, en la tapa. */
    const [ox, oy] = girar([[23, 35]])[0].map(Math.round);
    capa().ell(ox, oy, 3.6, 2.8).pintar(g, M, { plano: 0 });
    capa().ell(ox, oy, 3, 2.3).pintar(g, AMBAR, { relieve: 1.5, min: 2 });
    pon(g, NEGRO, 0, [ox, oy - 2], [ox, oy - 1], [ox, oy], [ox, oy + 1], [ox + 1, oy], [ox + 1, oy - 1]);
    pon(g, HUESO, 4, [ox - 2, oy - 1]);
    pon(g, R.sangre, 3, [ox + 3, oy], [ox - 3, oy + 1], [ox + 2, oy + 1]);
    for (let i = -4; i <= 2; i++) pon(g, M, 0, [ox + i, oy - 3 + (i < -2 ? 1 : 0)]);
    pon(g, M, 4, [ox - 3, oy - 4], [ox - 2, oy - 4]);
    /* Un ojillo más pequeño en el cofre. */
    capa().ell(41, 46, 1.8, 1.5).pintar(g, AMBAR, { relieve: 1, min: 2 });
    pon(g, NEGRO, 0, [41, 46], [41, 45]); pon(g, HUESO, 4, [40, 45]);
    pon(g, M, 0, [39, 44], [40, 43], [41, 43], [42, 43], [43, 44]);
    contornoSel(g);
    suavizar(g);
    /* Babas que cuelgan de los dientes. */
    for (const [x, y0, y1] of [[18, 43, 46], [24, 43, 45]]) for (let y = y0; y <= y1; y++) if (g.rampa(x, y) !== HUESO) pon(g, BABA, y === y1 ? 4 : 3, [x, y]);
    destello(g, ORO, 25, 38, true); destello(g, ORO, 41, 36);
    return g;
  }

  /* ---------- Cubo gelatinoso: casi transparente, con los restos de otros aventureros dentro ---------- */
  function cubo() {
    const g = new Rejilla(W, W), E = R.piel.esmeralda, Hj = R.hoja;
    const X0 = 3, Y0 = 23, L = 42, PR = 13;
    const X1 = X0 + L - 1, Y1 = 62;
    const frente = capa().rect(X0, Y0, L, Y1 - Y0 + 1);
    const arriba = capa().poly([[X0, Y0], [X0 + PR, Y0 - PR], [X1 + PR + 0.5, Y0 - PR], [X1 + 0.5, Y0]]).restar(frente);
    const lado = capa().poly([[X1 + 0.5, Y0], [X1 + PR + 0.5, Y0 - PR], [X1 + PR + 0.5, Y1 - PR], [X1 + 0.5, Y1 + 0.5]]).restar(frente).restar(arriba);
    /* Gelatina: bandas suaves, tramadas solo en la transición. */
    const banda = (c, f, tonos) => cada(c, (x, y) => {
      const v = f(x, y) * (tonos.length - 1), i = Math.floor(v), r = v - i;
      const rr = lim((r - 0.5) * 3 + 0.5, 0, 1);
      const k = tonos[lim(i + (rr > umbral(x, y) ? 1 : 0), 0, tonos.length - 1)];
      pon(g, E, k, [x, y]);
    });
    banda(frente, (x, y) => lim(1 - ((x - X0) / L) * 0.55 - ((y - Y0) / (Y1 - Y0)) * 0.6, 0, 0.999), [1, 2, 3]);
    banda(arriba, x => lim(1 - (x - X0) / (L + PR) * 0.8, 0, 0.999), [3, 4]);
    banda(lado, (x, y) => lim(0.9 - (y - Y0 + PR) / (Y1 - Y0 + PR) * 0.9, 0, 0.999), [0, 1, 2]);
    /* Aristas del fondo, vistas a través de la gelatina. */
    for (const [x0, y0, x1, y1] of [[X0 + PR, Y0 - PR, X0 + PR, Y1 - PR], [X0 + PR, Y1 - PR, X1 + PR, Y1 - PR], [X0, Y1, X0 + PR, Y1 - PR]])
      surco(g, E, 3, x0, y0, x1, y1, E);
    /* Lo que flota dentro, teñido de verde. */
    const dentro = new Rejilla(W, W);
    const tH = tinte(HUESO, E, 0.42), tF = tinte(R.hierro, E, 0.35), tB = tinte(ORO, E, 0.3), tM = tinte(R.madera, E, 0.35);
    /* Espada atravesada. */
    const esp = capa().linea(19, 56, 36, 29, 2.6);
    esp.pintar(dentro, tF, { relieve: 1, min: 2 });
    surco(dentro, tF, 4, 18, 55, 35, 28, tF);
    capa().linea(29, 35.5, 37.5, 37.5, 1.6).pintar(dentro, tB, { relieve: 1, min: 2 });
    capa().linea(37, 28, 40, 23, 1.8).pintar(dentro, tM, { relieve: 1 });
    pon(dentro, tB, 3, [40, 22], [41, 22]);
    /* Calavera. */
    capa().ell(13, 32, 5.2, 4.8).rect(10.4, 35, 5.4, 3.2).pintar(dentro, tH, { relieve: 2.5, min: 2 });
    pon(dentro, tH, 0, [10, 31], [11, 31], [10, 32], [11, 32], [14, 31], [15, 31], [14, 32], [15, 32], [13, 34], [12, 35]);
    for (let i = 10; i <= 15; i += 2) pon(dentro, tH, 0, [i, 37]);
    pon(dentro, tH, 4, [10, 29], [11, 28]);
    /* Fémur y costillas sueltas. */
    capa().linea(6, 49, 17, 45, 1.8).pintar(dentro, tH, { relieve: 1, min: 3 });
    pon(dentro, tH, 4, [5, 48], [5, 50], [17, 44], [18, 46]);
    for (const k of [0, 1, 2, 3]) capa().curva(22 + k * 3.4, 47, 24 + k * 3.4, 43, 27.5 + k * 3.4, 45.5, 1).pintar(dentro, tH, { plano: 3 });
    /* Yelmo hundido. */
    capa().ell(35, 53, 4.4, 3.4).pintar(dentro, tF, { relieve: 2, min: 1 });
    surco(dentro, tF, 0, 31, 54, 39, 54, null); pon(dentro, tF, 4, [33, 51], [34, 50]);
    /* Monedas. */
    for (const [i, j] of [[8, 58], [13, 56], [22, 59], [29, 60], [39, 58], [25, 51], [17, 25], [36, 44], [41, 52], [8, 41], [42, 32]]) {
      pon(dentro, tB, 3, [i, j], [i + 1, j]); pon(dentro, tB, 4, [i, j]); pon(dentro, tB, 1, [i + 1, j + 1]);
    }
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const c = dentro.get(i, j);
      if (c && frente.tiene(i, j)) g.set(i, j, c, dentro.rampa(i, j));
    }
    /* Burbujas: aro claro arriba a la izquierda y sombra abajo. */
    for (const [i, j, r] of [[27, 28, 1.6], [9, 44, 0], [38, 34, 0], [21, 39, 0], [32, 25, 1], [41, 46, 1], [16, 52, 0], [44, 18, 1], [26, 15, 0]]) {
      if (r >= 1) {
        const c = capa().ell(i, j, r, r);
        cada(c, (x, y) => pon(g, E, (x - i) + (y - j) < 0 ? 4 : 2, [x, y]));
        pon(g, Hj, 4, [Math.round(i - r * 0.5), Math.round(j - r * 0.5)]);
      } else { pon(g, Hj, 4, [i, j]); pon(g, E, 1, [i + 1, j + 1]); }
    }
    /* Aristas de delante: brillantes arriba y a la izquierda. */
    for (let i = X0; i <= X1; i++) pon(g, Hj, 4, [i, Y0]);
    for (let i = X0 + 1; i <= X1 - 1; i++) pon(g, E, 4, [i, Y0 + 1]);
    for (let j = Y0; j <= Y1; j++) pon(g, Hj, j < Y0 + 20 ? 4 : 3, [X0, j]);
    for (let j = Y0 + 1; j <= Y1; j++) pon(g, E, 3, [X0 + 1, j]);
    for (let j = Y0; j <= Y1; j++) pon(g, E, 2, [X1, j]);
    surco(g, Hj, 4, X0, Y0, X0 + PR, Y0 - PR, null);
    surco(g, Hj, 4, X0 + PR, Y0 - PR, X1 + PR, Y0 - PR, null);
    surco(g, Hj, 3, X1 + 0.5, Y0, X1 + PR + 0.5, Y0 - PR, null);
    for (let j = Y0 - PR + 1; j <= Y1 - PR; j++) pon(g, E, 2, [X1 + PR, j]);
    /* Reflejos: ventana de luz arriba a la izquierda y vetas brillantes. */
    for (const [x, y] of [[5, 26], [6, 26], [7, 26], [8, 26], [5, 27], [5, 28], [5, 29], [5, 30], [6, 27]]) pon(g, HUESO, 4, [x, y]);
    pon(g, Hj, 4, [10, 26], [5, 32], [7, 28]);
    surco(g, Hj, 4, 15, 13, 24, 13, null); pon(g, HUESO, 4, [15, 13], [16, 13], [17, 13]);
    for (const [x0, y0, x1, y1] of [[8, 33, 12, 29], [7, 39, 9, 37], [40, 27, 43, 24]]) surco(g, Hj, 4, x0, y0, x1, y1, null);
    /* Babas que gotean y charco en la base. */
    for (const [i, h] of [[9, 1], [20, 2], [33, 1], [41, 2]]) for (let k = 0; k < h; k++) pon(g, E, 2, [i, Y1 - k]);
    contornoSel(g, E[0], E);
    return g;
  }

  /* ---------- El gólem de hierro: placas remachadas, junturas al rojo y un horno en el pecho ---------- */
  function golem() {
    const g = new Rejilla(W, W), B = R.hierro, Fu = FUEGO;
    /* Juntura al rojo: brasa entre dos placas, más viva en el centro. */
    const juntura = (x0, x1, y, viva = 3) => { for (let x = x0; x <= x1; x++) if (g.rampa(x, y) === B || g.rampa(x, y) === Fu) pon(g, Fu, (x - x0) % 3 === 1 ? viva : viva - 1, [x, y]); };
    /* Brazo de atrás. */
    const brazoA = capa().linea(47.8, 21.7, 53, 33.4, 6.5).linea(53, 33.4, 53.6, 42.5, 6.4);
    brazoA.pintar(g, B, { relieve: 3, max: 2 });
    juntura(49, 57, 36, 2);
    const punoA = capa().ell(53.6, 46.6, 5.2, 4.9);
    punoA.pintar(g, B, { relieve: 2.5, max: 2, separar: true });
    for (const y of [45, 48]) surco(g, B, 0, 49, y, 58, y, B);
    /* Pierna de atrás. */
    const piernaA = capa().rect(36, 45, 10, 12).rect(35, 57, 14, 6).off(48, 57);
    piernaA.pintar(g, B, { relieve: 3, max: 2 });
    juntura(36, 45, 50, 2);
    surco(g, B, 0, 35, 60, 47, 60, B);
    /* Torso enorme. */
    const cuerpo = capa().ell(32.2, 26.9, 16.9, 12.4).rect(20, 33, 24, 13).off(20, 45).off(43, 45);
    cuerpo.pintar(g, B, { relieve: 6, separar: true });
    /* Placas del vientre: juntas, cantos y remaches. */
    for (const [x0, y0, x1, y1] of [[20, 35, 43, 35], [21, 40, 42, 40], [32, 35, 32, 45]]) surco(g, B, 0, x0, y0, x1, y1);
    for (const [x0, y0, x1, y1] of [[20, 36, 43, 36], [21, 41, 42, 41]]) cada(capa().linea(x0, y0, x1, y1, 1).recortar(cuerpo), (x, y) => { const t = tonoDe(g, x, y, B); if (t >= 1) pon(g, B, Math.min(4, t + 1), [x, y]); });
    surco(g, B, 3, 33, 36, 33, 45);
    juntura(22, 41, 35, 3);
    for (const [i, j] of [[22, 37], [29, 37], [35, 37], [41, 37], [23, 42], [29, 42], [35, 42], [40, 42], [17, 23], [47, 22], [24, 15], [40, 15]]) remache(g, B, i, j, true);
    /* Horno del pecho con rejilla. */
    capa().ell(32.2, 25.6, 7.2, 6.6).pintar(g, B, { plano: 0 });
    capa().ell(32.2, 25.6, 7.2, 6.6).quitarEll(32.2, 25.6, 6.2, 5.6).pintar(g, B, { relieve: 1.2, min: 2 });
    const horno = capa().ell(32.2, 25.6, 5.6, 5.1);
    cada(horno, (x, y) => {
      const d = Math.hypot(x - 32.2, (y - 26.4) * 1.1);
      pon(g, Fu, d < 2 ? 4 : d < 3.4 ? 3 : d < 4.6 ? 2 : 1, [x, y]);
    });
    for (const x of [29, 32, 35]) cada(capa().rect(x, 19, 1, 14).recortar(horno), (xx, y) => pon(g, B, y < 24 ? 3 : 1, [xx, y]));
    cada(capa().rect(26, 25, 13, 1).recortar(horno), (x, y) => pon(g, B, 2, [x, y]));
    pon(g, B, 4, [28, 20], [29, 19], [30, 19]);
    /* Resplandor del horno sobre el pecho y la parte baja del aro. */
    for (const [i, j] of [[25, 31], [39, 31], [26, 32], [38, 32], [32, 33], [31, 33], [33, 33], [24, 29], [40, 29]]) if (tonoDe(g, i, j, B) >= 0) pon(g, OXIDO, 3, [i, j]);
    pon(g, Fu, 2, [30, 31], [34, 31]);
    /* Pierna de delante. */
    const pierna = capa().rect(18, 45, 12, 12).rect(12, 57, 18, 6).off(12, 57).off(13, 57);
    pierna.pintar(g, B, { relieve: 3, separar: true });
    bisel(g, capa().rect(18, 45, 12, 5), B, 3, null);
    juntura(18, 29, 50, 4);
    surco(g, B, 1, 19, 51, 29, 51, B);
    remache(g, B, 19, 46, true); remache(g, B, 26, 46, true); remache(g, B, 15, 58, true); remache(g, B, 24, 58, true);
    surco(g, B, 0, 13, 60, 29, 60, B); surco(g, B, 3, 13, 61, 29, 61, B);
    /* Hombrera de atrás. */
    const hombroA = capa().ell(47.2, 19.8, 6.5, 5.9);
    hombroA.pintar(g, B, { relieve: 3, max: 3, separar: true });
    remache(g, B, 46, 17, true);
    /* Respiradero del hombro con gas venenoso. */
    capa().rect(42, 11, 6, 5).pintar(g, B, { relieve: 1.2, max: 3, separar: true });
    surco(g, NEGRO, 0, 43, 12, 46, 12, null); surco(g, BABA, 1, 43, 13, 46, 13, null);
    /* Cabeza baja entre los hombros, con visera de rendija ardiente. */
    capa().rect(19, 14, 12, 5).pintar(g, B, { relieve: 1.6, max: 2, separar: true });
    const cab = capa().rect(14, 5, 14, 11).off(14, 5).off(27, 5);
    cab.pintar(g, B, { relieve: 3, separar: true });
    bisel(g, cab, B, 3, null);
    surco(g, B, 0, 15, 9, 26, 9); surco(g, B, 0, 15, 11, 26, 11);
    for (let x = 15; x <= 26; x++) pon(g, x <= 22 ? Fu : B, x <= 22 ? (x <= 17 ? 4 : x <= 20 ? 3 : 2) : 0, [x, 10]);
    pon(g, Fu, 3, [16, 9], [17, 9]); pon(g, Fu, 2, [16, 11]);
    pon(g, B, 4, [15, 6], [16, 6], [17, 6], [18, 6], [15, 7]);
    surco(g, B, 1, 21, 6, 21, 8); surco(g, B, 3, 20, 6, 20, 8);
    remache(g, B, 24, 6, true); remache(g, B, 25, 13);
    /* Barbilla de placas (una barba de hierro). */
    const barba = capa().poly([[14, 13.9], [27, 13.9], [25.7, 19.1], [20.5, 21], [15.3, 18.5]]);
    barba.pintar(g, B, { relieve: 1.8, max: 3, separar: true });
    for (const x of [16, 19, 22, 25]) { surco(g, B, 0, x, 15, x, 21, B); surco(g, B, 3, x - 1, 15, x - 1, 20, B); }
    for (const x of [15, 18, 21, 24]) pon(g, R.bronce, 3, [x, 14]);
    pon(g, R.bronce, 4, [15, 14]);
    /* Hombrera y brazo de delante con el puño. */
    const hombro = capa().ell(16.6, 24.3, 7.8, 7);
    hombro.pintar(g, B, { relieve: 3.5, separar: true });
    trazo(g, B, 4, 11, 22, 14, 18, 19, 18, B);
    remache(g, B, 13, 22, true); remache(g, B, 18, 20, true); remache(g, B, 16, 27, true);
    const brazo = capa().linea(15.3, 29.5, 11.4, 38.6, 6.5).linea(11.4, 38.6, 10.1, 42.5, 6.4);
    brazo.pintar(g, B, { relieve: 3, separar: true });
    juntura(7, 15, 35, 4);
    surco(g, B, 1, 8, 36, 15, 36, B);
    const puno = capa().ell(10.1, 47.7, 6.2, 5.5);
    puno.pintar(g, B, { relieve: 3, separar: true });
    for (const y of [46, 50]) { surco(g, B, 0, 4, y, 15, y, B); surco(g, B, 3, 4, y + 1, 14, y + 1, B); }
    pon(g, B, 4, [6, 44], [7, 43], [8, 43]);
    remache(g, B, 12, 44);
    /* Óxido en la parte baja y arañazos. */
    herrumbre(g, B, 38, 43, 1.4, 41); herrumbre(g, B, 22, 54, 1.2, 42); herrumbre(g, B, 9, 52, 1, 43); herrumbre(g, B, 44, 27, 1.2, 44);
    surco(g, B, 4, 37, 21, 41, 18, B); surco(g, B, 1, 37, 22, 41, 19, B);
    contornoSel(g);
    suavizar(g);
    /* Volutas de gas que salen del respiradero. */
    for (const [i, j, t] of [[44, 10, 3], [45, 9, 2], [45, 8, 3], [46, 7, 2], [47, 6, 3], [48, 5, 1], [47, 4, 2], [46, 3, 1], [44, 9, 1]]) if (!g.get(i, j)) pon(g, BABA, t + 1, [i, j]);
    /* Brasas del horno, con brillo. */
    destello(g, Fu, 31, 27); destello(g, Fu, 33, 27);
    return g;
  }

  window.MONSTRUOS_64 = window.MONSTRUOS_64 || {};
  Object.assign(window.MONSTRUOS_64, { rata, goblin, osolechuza, esqueleto, mimico, cubo, golem });
})();
