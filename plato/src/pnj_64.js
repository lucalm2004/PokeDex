/* Dados y Mazmorras · personajes no jugadores y mascotas a 64×64.
   PNJ_64: rejillas de 64×64 mirando a la IZQUIERDA (hacia los héroes), con los pies en la fila 62
   (la 63 queda solo para el contorno). MASCOTAS_64: bichos pequeños (de 26 a 34 píxeles de alto)
   mirando a la DERECHA, centrados abajo con las patas en la fila 62.
   Conservan la identidad de PNJ_HD y MASCOTAS_HD (pnj_hd.js) con más píxeles y mejor acabado:
   rampas de 5 tonos con desplazamiento de matiz (sombras frías, luces cálidas), luz desde arriba a la
   izquierda, contorno selectivo, antialias a mano en las curvas, brillos especulares y texturas propias
   de cada material. Cada llamada devuelve una Rejilla nueva y siempre igual (nada de Math.random). */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R0, umbral } = PX;
  const W = 64, H = 64;
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
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) return aHex(l * 255, l * 255, l * 255);
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return aHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
  }
  const mezcla = (a, b, t) => { const x = aRgb(a), y = aRgb(b); return aHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  const hacia = (h, obj, grados) => { const d = ((obj - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), grados); };
  /* Por tono: [matiz objetivo, grados como mucho, cambio de saturación]. Sombras al violeta, luces al amarillo. */
  const AJUSTE = [[255, 18, 0.05], [255, 9, 0.03], [0, 0, 0], [50, 6, 0], [50, 12, -0.02]];
  function matizar(ram) {
    return ram.map((c, i) => {
      const [h, s, l] = aHsl(aRgb(c));
      const [obj, gr, ds] = AJUSTE[i];
      if (!gr) return c;
      const s2 = s < 0.08 ? s + (i < 2 ? 0.07 : 0.05) : Math.max(0, Math.min(1, s + ds));
      return deHsl(s < 0.08 ? obj : hacia(h, obj, gr), s2, l);
    });
  }
  const R = {};
  for (const [k, v] of Object.entries(R0)) {
    if (Array.isArray(v)) R[k] = matizar(v);
    else { R[k] = {}; for (const [k2, v2] of Object.entries(v)) R[k][k2] = matizar(v2); }
  }

  /* ---------- Rampas propias (de la sombra al brillo) ---------- */
  const OJOS = "#170d12", BLANCO = "#f3ecdf", BRILLO = "#fffdf4";
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  const CUERO = ["#21110f", "#43231a", "#6c3e25", "#985f34", "#c58a50"];
  const CUERO2 = ["#1b1110", "#33221c", "#523629", "#77513a", "#a07552"];
  const ORO = ["#3a1f10", "#6e4518", "#b57d27", "#e9bf4e", "#fff2a6"];
  const MADERA = ["#24130e", "#432616", "#6a4022", "#946234", "#c08d55"];
  const HIERRO = ["#17161d", "#33313a", "#575660", "#8d8c90", "#d6d3cc"];
  const ESPUMA = ["#7a6c62", "#b3a594", "#e0d6c4", "#f6efe0", "#fffef8"];
  const HOLLIN = ["#09070b", "#17121a", "#272029", "#3b3138", "#56484c"];
  const CENIZA = ["#27242a", "#46424a", "#6c6668", "#98918c", "#c7beb4"];
  const MEJILLA = ["#5a1c22", "#8a2e34", "#c2525a", "#e88078", "#f8a898"];
  const NARIZ = ["#4a1418", "#7a2228", "#b0403c", "#dc6a5a", "#f7a08a"];
  const LIMO = ["#0c2416", "#17432a", "#277a3a", "#50b04c", "#a6e884"];
  const VIDRIO = ["#26333e", "#45606e", "#7a98a4", "#b4ccd2", "#eef8f6"];
  const ROSA = ["#4e1430", "#86284c", "#c4506e", "#ef8aa2", "#ffd2dc"];
  const SAVIA = ["#1e3022", "#38553a", "#5f8650", "#93b56c", "#cde39a"];
  const FRONDA = ["#0a1a14", "#15331d", "#265a2a", "#3f8636", "#78b452"];
  const HOJA = ["#16240f", "#2b4318", "#4a6c22", "#7a9c34", "#b6d062"];
  const CORTEZA = ["#1a110f", "#36231a", "#58392a", "#7f5a3c", "#a8845a"];
  const CUERNO = ["#18111e", "#322538", "#4e3e56", "#76647c", "#a898aa"];
  const BRASA = ["#4a0f0c", "#952612", "#dc5418", "#ffa032", "#ffe68c"];
  /* Fantasma: túnica añil profunda, barba casi blanca, manto azul medio, luz de alma cian. */
  const TUNICA_E = ["#0e1030", "#1d2558", "#30408a", "#4d67b4", "#7c96d6"];
  const MANTO_E = ["#0f1f36", "#1d3a5c", "#2e5a84", "#4a80a8", "#78aacc"];
  const BARBA_E = ["#5a7c94", "#8eb4c8", "#c2e0ea", "#e4f6fa", "#ffffff"];
  const ALMA = ["#0f3a4c", "#227a94", "#4cc4dc", "#a2f0ff", "#f2ffff"];
  /* Mascotas. */
  const PELAJE = ["#22212d", "#3f3e4a", "#666670", "#97969a", "#cfccc6"];
  const PLUMA = ["#26150f", "#45281a", "#704426", "#a06a3a", "#d09a5c"];
  const PLUMON = ["#5e5650", "#958a7e", "#c9bca8", "#ebe0cc", "#fffaf0"];
  const AMBAR = ["#5a2a08", "#9a5210", "#dc8c1c", "#fcc640", "#fff0a0"];
  const ESCARLATA = ["#2a0a14", "#561420", "#90262a", "#c84a3a", "#f08458"];
  const MEMBRANA = ["#24081a", "#481024", "#76202e", "#a43a3c", "#d0645a"];
  const NOCHE = ["#0b0a14", "#17152a", "#26233e", "#3a3658", "#5a5480"];
  const GELATINA = ["#0b2a20", "#145238", "#24864c", "#46bc5e", "#9ce88a"];
  const FATUO = ["#0a3442", "#156c7c", "#33b2bf", "#8cecea", "#eafffc"];

  /* ---------- Utilidades ---------- */
  const capa = () => new Capa(W, H);
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pon = (g, ram, k, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[lim(k, 0, 4)], ram); return g; };
  const tono = (g, x, y) => { const r = g.rampa(x, y); return r ? r.indexOf(g.get(x, y)) : -1; };
  const todo = f => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f(x, y); };
  /* Solo donde ya hay algo de cierta rampa (o de alguna de una lista). */
  const es = (g, x, y, sobre) => Array.isArray(sobre[0]) ? sobre.includes(g.rampa(x, y)) : g.rampa(x, y) === sobre;
  const ponSi = (g, sobre, ram, k, ...pts) => { for (const [x, y] of pts) if (es(g, x, y, sobre)) g.set(x, y, ram[k], ram); return g; };
  /* Sube o baja el tono de un píxel dentro de su rampa. */
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), i = tono(g, x, y);
    if (!r || i < 0) return;
    g.set(x, y, r[lim(i + d, 0, r.length - 1)], r);
  }
  /* Recorre los píxeles de una rampa dentro de un rectángulo. */
  function cada(g, ram, x0, y0, x1, y1, fn) {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++)
        if (g.rampa(x, y) === ram) fn(x, y, tono(g, x, y));
  }
  /* Línea de un píxel en un tono, solo sobre la rampa «sobre» (o sobre lo que sea si es null). */
  function surco(g, ram, k, x0, y0, x1, y1, sobre = ram) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!sobre || es(g, x, y, sobre)) g.set(x, y, ram[k], ram);
    }
  }
  /* Pliegue de tela: surco oscuro con su filo de luz a la izquierda. */
  function pliegue(g, ram, x0, y0, x1, y1, osc = 1) {
    surco(g, ram, 3, x0 - 1, y0 + 1, x1 - 1, y1, ram);
    surco(g, ram, osc, x0, y0, x1, y1, ram);
  }
  /* Oscurece con tramado la parte baja de una tela (la luz viene de arriba). */
  function penumbra(g, ram, x0, y0, x1, y1, fuerza = 0.45) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => { if (k > 1 && (y - y0) / Math.max(1, y1 - y0) > umbral(x, y) + fuerza) g.set(x, y, ram[k - 1], ram); });
  }
  /* Volumen cilíndrico: aclara el lado izquierdo y oscurece el derecho de una rampa dentro de una
     franja [x0, x1], con transición tramada. */
  function volumen(g, ram, x0, x1, y0 = 0, y1 = H - 1, fuerza = 1, maxLuz = 3) {
    cada(g, ram, x0 - 4, y0, x1 + 4, y1, (x, y, k) => {
      const f = (x - x0) / Math.max(1, x1 - x0);
      if (f < 0.32 && k < maxLuz && (0.32 - f) * 3.2 * fuerza > umbral(x, y)) g.set(x, y, ram[k + 1], ram);
      else if (f > 0.62 && k > 1 && (f - 0.62) * 3 * fuerza > umbral(x, y)) g.set(x, y, ram[k - 1], ram);
    });
  }
  /* Sombra que una pieza deja sobre lo de detrás: oscurece los vecinos de abajo y de la derecha. */
  function sombra(g, c, d = -2, dentro = null) {
    const pts = [];
    todo((i, j) => {
      if (!c.tiene(i, j)) return;
      for (const [a, b] of [[1, 0], [0, 1], [1, 1]]) if (!c.tiene(i + a, j + b) && g.get(i + a, j + b) && (!dentro || es(g, i + a, j + b, dentro))) pts.push([i + a, j + b]);
    });
    const vistos = new Set();
    for (const [i, j] of pts) { const k = j * W + i; if (vistos.has(k)) continue; vistos.add(k); matiz(g, i, j, d); }
  }
  /* Pinta una capa solo donde aún no hay nada, como si quedara detrás. */
  function detras(g, c, ram, op) {
    todo((x, y) => { if (g.get(x, y)) c.off(x, y); });
    return c.pintar(g, ram, op);
  }
  /* Píxel suelto solo si el hueco está libre (chispas, motas, burbujas). */
  const mota = (g, ram, k, x, y) => { if (!g.get(x, y)) pon(g, ram, k, [x, y]); };
  /* Brillo especular: el centro blanco y una cruz en el tono más claro. */
  function destello(g, ram, x, y, grande, soloLibre) {
    const p = (i, j, col) => { if (!soloLibre || !g.get(i, j)) g.set(i, j, col, ram); };
    p(x, y, grande ? BRILLO : ram[4]);
    if (grande) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => p(x + a, y + b, ram[4]));
  }
  /* Borde iluminado arriba a la izquierda: lo muy oscuro se sigue leyendo sobre fondos oscuros. */
  function bordeLuz(g, ram, k = 3, solo = null) {
    const borde = [];
    todo((x, y) => {
      if (g.rampa(x, y) !== ram || tono(g, x, y) >= k) return;
      if (solo && !solo(x, y)) return;
      if (!g.get(x - 1, y) || !g.get(x, y - 1)) borde.push([x, y]);
    });
    pon(g, ram, k, ...borde);
  }
  /* Línea fina sin contorno: solo pinta los píxeles vacíos. */
  function hilo(g, x0, y0, x1, y1, ram, k) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!g.get(x, y)) g.set(x, y, ram[k], ram);
    }
  }
  /* Ruido determinista. */
  const hash = (...v) => { let h = 2166136261; for (const n of v) { h ^= n & 0xffff; h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

  /* ---------- Contorno selectivo ----------
     Por fuera, en el lado de la luz (arriba e izquierda) el contorno toma la sombra más honda del color
     vecino; en el lado de la sombra es casi negro teñido del material. Cada píxel de contorno lleva una
     rampa cuyo tono 0 es él mismo, para que .tenida() lo deje oscuro. */
  const cacheOsc = new Map();
  const rampaContorno = c => { if (!cacheOsc.has(c)) cacheOsc.set(c, [c, mezcla(c, "#ffffff", 0.15), mezcla(c, "#ffffff", 0.3), mezcla(c, "#ffffff", 0.45), mezcla(c, "#ffffff", 0.6)]); return cacheOsc.get(c); };
  const oscuro = c => mezcla(c, "#0b0610", 0.62);
  function contornoSel(g, op = {}) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      const vec = ab ? [x, y + 1] : de ? [x + 1, y] : iz ? [x - 1, y] : [x, y - 1];
      const ram = g.rampa(vec[0], vec[1]);
      let col = op.color || CONTORNO;
      if (!op.color && ram && ram.length === 5 && ram[0] !== ram[1]) {
        if (!iz && !ar && y < H - 1) {
          col = ram[0];
          if (!ab && de && tono(g, x + 1, y) >= 3) col = mezcla(ram[0], ram[1], 0.5);
        } else col = oscuro(ram[0]);
      }
      nuevos.push([x, y, col]);
    }
    for (const [x, y, col] of nuevos) g.set(x, y, col, rampaContorno(col));
    return g;
  }
  /* Línea interior: oscurece el borde de una rampa donde toca otra (separa materiales). */
  function separar(g, ram, contra, k = 1) {
    const pts = [];
    cada(g, ram, 0, 0, W - 1, H - 1, (x, y, t) => {
      if (t <= k) return;
      if ([[1, 0], [0, 1]].some(([a, b]) => { const r = g.rampa(x + a, y + b); return r && r !== ram && (!contra || es(g, x + a, y + b, contra)); })) pts.push([x, y]);
    });
    pon(g, ram, k, ...pts);
  }

  /* ---------- Cuerpo humanoide (mirando a la izquierda) ---------- */
  const CUERPOS = {
    normal: { cabY: 16, rx: 7.2, ry: 7.6, torTop: 26, torBot: 43, hombros: 18, cintura: 14 },
    esbelto: { cabY: 16, rx: 6.8, ry: 7.4, torTop: 26, torBot: 43, hombros: 15, cintura: 11 },
    fornido: { cabY: 14, rx: 7.6, ry: 7.8, torTop: 24, torBot: 43, hombros: 22, cintura: 20 },
    bajo: { cabY: 32, rx: 7.2, ry: 7, torTop: 41, torBot: 53, hombros: 15, cintura: 14 },
    ancho: { cabY: 27, rx: 7.6, ry: 7.2, torTop: 36, torBot: 52, hombros: 24, cintura: 22 }
  };
  function plantilla(tipo) {
    const p = CUERPOS[tipo];
    const t = { tipo, cx: 32, suelo: 62 };
    t.cabX = 31; t.cabY = p.cabY; t.cabRx = p.rx; t.cabRy = p.ry;
    t.ojoY = t.cabY + 1; t.bocaY = t.ojoY + 5;
    t.ojo1 = t.cabX - 4; t.ojo2 = t.cabX - 8;     // ojo cercano (3 de ancho) y lejano (2), junto a la nariz
    t.narizX = Math.round(t.cabX - t.cabRx - 0.6);
    t.torTop = p.torTop; t.torBot = p.torBot; t.pierTop = t.torBot + 1;
    t.torL = t.cx - Math.floor(p.hombros / 2); t.torR = t.torL + p.hombros - 1;
    t.wL = t.cx - Math.floor(p.cintura / 2); t.wR = t.wL + p.cintura - 1;
    return t;
  }
  /* Torso: hombros redondos y cintura algo más estrecha. */
  const torso = t => capa().poly([
    [t.torL + 2, t.torTop - 0.5], [t.torR - 2, t.torTop - 0.5], [t.torR + 0.5, t.torTop + 2.5], [t.torR + 0.5, t.torTop + 6],
    [t.wR + 0.5, t.torBot + 0.5], [t.wL - 0.5, t.torBot + 0.5], [t.torL - 0.5, t.torTop + 6], [t.torL - 0.5, t.torTop + 2.5]
  ]);
  const falda = (t, largo, vuelo, vueloAtras = vuelo) => capa().poly([[t.wL - 0.5, t.torBot - 2], [t.wR + 0.5, t.torBot - 2], [t.wR + 1.5 + vueloAtras, t.pierTop + largo + 0.5], [t.wL - 1.5 - vuelo, t.pierTop + largo + 0.5]]);

  /* Cabeza: cuello con la sombra de la mandíbula, cráneo, mandíbula hacia delante y nariz. */
  const LUZ_CARA = [-0.5, -0.6, 0.8];
  function capaCabeza(t, nariz = 1) {
    const x = t.cabX, y = t.cabY;
    const c = capa().ell(x, y, t.cabRx, t.cabRy);
    c.poly([[x + 1, y + 2], [x - t.cabRx - 0.4, t.ojoY + 1], [x - t.cabRx - 0.2, t.bocaY + 0.6], [x - t.cabRx + 1.2, t.bocaY + 2.4], [x - 4, y + t.cabRy + 0.8], [x + 1, y + t.cabRy + 0.3]]);
    for (let k = 0; k < nariz; k++) c.on(t.narizX - k, t.ojoY + 2).on(t.narizX - k, t.ojoY + 3);
    c.on(t.narizX, t.ojoY + 1);
    return c;
  }
  function cabeza(g, t, piel, op = {}) {
    const x = t.cabX, y = t.cabY;
    const cu = capa().rect(x - 2, y + 4, 7, t.torTop - y - 2);
    cu.pintar(g, piel, { relieve: 1.5, max: 2 });
    for (let i = x - 2; i <= x + 4; i++) pon(g, piel, 0, [i, Math.round(y + t.cabRy + 1)]);
    const c = capaCabeza(t, op.nariz || 1);
    c.pintar(g, piel, { relieve: 5, min: 1, luz: LUZ_CARA });
    /* Borde de abajo y nuca en sombra; frente, pómulo y nariz con luz. */
    todo((i, j) => { if (c.tiene(i, j) && !c.tiene(i, j + 1) && i > x - 4) pon(g, piel, 1, [i, j]); });
    const n = t.narizX - (op.nariz || 1) + 1;
    pon(g, piel, 4, [n, t.ojoY + 2], [t.narizX + 1, t.ojoY + 1]);
    pon(g, piel, 1, [n, t.ojoY + 4], [n + 1, t.ojoY + 4]);
    pon(g, piel, 0, [n + 1, t.ojoY + 4]);
    pon(g, piel, 3, [t.ojo1, t.ojoY + 3], [t.ojo1 + 1, t.ojoY + 3]);
    pon(g, piel, 4, [t.ojo1 + 2, t.ojoY + 3]);
    pon(g, piel, 3, [x - 5, t.bocaY + 2]);
    return c;
  }
  function oreja(g, t, piel, punta = 0) {
    const x = t.cabX + 3, y = t.ojoY;
    const c = capa().ell(x + 0.5, y + 1.5, 1.8, 2.8);
    if (punta) c.poly([[x - 0.5, y + 2], [x + 1.5, y - 1], [x + 2 + punta, y - 2 - punta * 1.4], [x + 2.5, y + 2]]);
    c.pintar(g, piel, { relieve: 1.6, separar: 2 });
    pon(g, piel, 1, [x, y + 1], [x, y + 2], [x + 1, y + 3]);
    pon(g, piel, 3, [x + 1, y]);
    if (punta) surco(g, piel, 3, x + 1, y - 1, x + 1 + punta, y - 1 - punta, piel);
  }
  /* Cara mirando a la izquierda: ojo lejano de 2 junto a la nariz, ojo cercano de 3 con su blanco detrás. */
  function cara(g, t, piel, op = {}) {
    const y = t.ojoY, a = t.ojo1, b = t.ojo2, by = t.bocaY, x = t.cabX;
    const ok = (i, j) => op.libre ? op.libre(i, j) : g.rampa(i, j) === piel;
    const m = (col, ram, ...pts) => { for (const [i, j] of pts) if (ok(i, j)) g.set(i, j, col, ram || piel); };
    const iris = op.iris || "#5a3a22", iris2 = op.iris2 || iris;
    const cejaR = op.ceja || piel;
    const ceja = cejaR === piel ? piel[1] : cejaR[1], cejaC = cejaR === piel ? piel[2] : cejaR[2];
    /* Pestaña, pupila, iris y brillo. */
    m(op.oscuro || OJOS, null, [a, y - 1], [a + 1, y - 1], [a + 2, y - 1], [b, y - 1], [b + 1, y - 1]);
    m(op.blanco || BLANCO, null, [a + 2, y], [a + 2, y + 1], [b + 1, y]);
    m(op.oscuro || OJOS, null, [a, y], [a + 1, y], [b, y]);
    m(iris, null, [a, y + 1], [b, y + 1]);
    m(iris2, null, [a + 1, y + 1]);
    m(op.brillo || BRILLO, null, [a, y]);
    m(piel[2], piel, [b + 1, y + 1]);
    pon(g, piel, 1, [a + 3, y]);
    if (!op.sinCejas) { m(ceja, cejaR, [a + 3, y - 2], [a + 2, y - 3], [a + 1, y - 3], [a, y - 3], [b + 1, y - 3], [b, y - 3]); m(cejaC, cejaR, [a + 2, y - 4]); }
    if (!op.sinBoca) {
      m(piel[0], piel, [x - 5, by], [x - 6, by]);
      m(piel[1], piel, [x - 4, by - 1], [x - 7, by]);
      m(piel[4], piel, [x - 5, by + 1]);
    }
    if (op.mejilla !== false) { m(MEJILLA[3], MEJILLA, [a + 1, y + 3], [a + 2, y + 3]); m(MEJILLA[4], MEJILLA, [a + 1, y + 2]); }
  }
  /* Bota: caña, empeine que apunta a la izquierda y suela. */
  function bota(g, t, xc, ram, atras, alto = 7, gw = 5) {
    const s = t.suelo, x0 = Math.round(xc - gw / 2);
    const c = capa().rect(x0, s - alto, gw + 1, alto - 1).rect(x0 - 2, s - 3, gw + 3, 3).rect(x0 - 3, s - 2, 2, 2).off(x0 - 3, s - 3);
    c.pintar(g, ram, { relieve: 1.8, max: atras ? 2 : 4, separar: true });
    for (let i = x0 - 1; i <= x0 + gw + 1; i++) { pon(g, ram, atras ? 2 : 3, [i, s - alto]); pon(g, ram, 1, [i, s - alto + 1]); }
    capa().rect(x0 - 1, s - alto - 1, gw + 3, 2).pintar(g, ram, { relieve: 1, max: atras ? 2 : 4, separar: true });
    for (let i = x0 - 3; i <= x0 + gw + 1; i++) if (g.rampa(i, s) === ram || !g.get(i, s)) pon(g, CUERO2, 0, [i, s]);
    pon(g, ram, atras ? 2 : 4, [x0 - 2, s - 2], [x0 - 1, s - 3]);
    pon(g, ram, 1, [x0 + gw - 1, s - 1], [x0 + gw - 2, s - 1]);
  }
  /* Piernas un poco abiertas: la de atrás (derecha) en sombra. */
  function piernas(g, t, ramP, ramB, op = {}) {
    const { pierTop: p, suelo: s, cx } = t;
    const gw = op.grosor || 5, alto = op.alto || 7;
    const xa = cx + 3, xd = cx - 3;
    const ky = Math.round((p + s) / 2);
    const pierna = (x, f) => capa().linea(x, p - 1, (x + f) / 2, ky, gw + 1).linea((x + f) / 2, ky, f, s - 3, gw);
    pierna(xa, xa + 1).pintar(g, ramP, { relieve: 2.2, max: 2 });
    pierna(xd, xd - 1).pintar(g, ramP, { relieve: 2.4, separar: true });
    pliegue(g, ramP, xd - 1, ky - 1, xd + 1, ky + 1);
    surco(g, ramP, 1, xd + 1, s - alto - 3, xd - 1, s - alto - 2, ramP);
    bota(g, t, xa + 1, ramB, true, alto, gw);
    bota(g, t, xd - 1, ramB, false, alto, gw);
  }
  /* Brazo en dos tramos (hombro → codo → mano). «atras» lo deja en sombra. */
  function brazo(g, [[hx, hy], [ex, ey], [mx, my]], manga, piel, op = {}) {
    const o = op.atras ? { relieve: 2, max: 2 } : { relieve: 2.2, separar: true };
    const c1 = capa().linea(hx, hy, ex, ey, op.grueso || 5), c2 = capa().linea(ex, ey, mx, my, op.fino || 4);
    if (!op.atras) sombra(g, c1.copia().unir(c2), -2);
    c1.pintar(g, manga, o);
    c2.pintar(g, op.largo ? manga : piel, o);
    if (op.puno) capa().linea(ex, ey, ex + (mx - ex) * 0.3, ey + (my - ey) * 0.3, (op.fino || 4) + 1.4).pintar(g, op.puno, o);
    if (!op.sinMano) {
      capa().ell(mx, my, 2.2, 2.2).pintar(g, piel, { ...o, relieve: 1.4 });
      if (!op.atras) { pon(g, piel, 4, [Math.round(mx) - 1, Math.round(my) - 1]); pon(g, piel, 1, [Math.round(mx) + 1, Math.round(my) + 1]); }
    }
  }
  function cinturon(g, t, y, ram = CUERO, hebilla = ORO, ancho = 3, x0 = t.wL - 3, x1 = t.wR + 3) {
    for (let x = x0; x <= x1; x++) for (let j = 0; j < ancho; j++) if (g.get(x, y + j)) g.set(x, y + j, ram[j === 0 ? 3 : j === ancho - 1 ? 1 : 2], ram);
    for (let x = x0; x <= x1; x++) if (g.get(x, y - 1)) matiz(g, x, y - 1, -1);
    if (!hebilla) return;
    const hx = t.wL + 1;
    pon(g, hebilla, 4, [hx, y]); pon(g, hebilla, 3, [hx + 1, y], [hx, y + 1], [hx + 2, y]);
    pon(g, hebilla, 2, [hx + 2, y + 1], [hx, y + ancho - 1], [hx + 1, y + ancho - 1], [hx + 2, y + ancho - 1]);
    pon(g, hebilla, 0, [hx + 1, y + 1]);
  }

  /* ========================================================================
     Personajes no jugadores
     ======================================================================== */

  /* Tabernero: grandote, calvo y brillante con la corona de pelo castaño, bigotazo de puntas
     retorcidas, nariz colorada, camisa ocre remangada, delantal blanco con bolsillo y una trapo de cuadros al hombro y una jarra de madera con aros de hierro rebosando espuma. */
  function tabernero() {
    const g = new Rejilla(W, H), t = plantilla("fornido");
    const P = R.piel.clara, Pe = R.pelo.castano, T = R.tela.ocre, B = R.tela.blanco, G = R.tela.granate;
    t.cabX = 30; t.ojo1 = t.cabX - 4; t.ojo2 = t.cabX - 8; t.narizX = Math.round(t.cabX - t.cabRx - 0.6);
    const x = t.cabX, y = t.ojoY;
    /* Brazo de atrás en jarras: manga remangada, antebrazo velludo y el puño en la cadera. */
    const [ex, ey] = [t.torR + 6, t.torTop + 10];
    capa().linea(ex - 1, ey, t.torR + 1, t.torBot - 4, 4).pintar(g, P, { relieve: 1.8, max: 2 });
    capa().ell(t.torR + 1, t.torBot - 4, 2.6, 2.4).pintar(g, P, { relieve: 1.4, max: 2, separar: true });
    capa().linea(t.torR - 3, t.torTop + 3, ex - 1, ey - 2, 6).pintar(g, T, { relieve: 2, max: 2 });
    capa().linea(ex - 3, ey - 3, ex, ey - 1, 4).pintar(g, T, { relieve: 1.2, min: 1, max: 2, separar: true });
    for (const [i, j] of [[ex - 2, ey + 2], [ex - 3, ey + 4], [ex - 1, ey + 3], [ex - 4, ey + 6]]) ponSi(g, P, Pe, 1, [i, j]);
    pon(g, P, 0, [t.torR + 2, t.torBot - 3], [t.torR + 1, t.torBot - 2]);
    piernas(g, t, R.pelo.castano, CUERO, { grosor: 6, alto: 7 });
    /* Torso con barriga hacia delante. */
    const cuerpo = torso(t).ell(t.torL + 6, t.torTop + 12, 8.4, 7.6);
    cuerpo.pintar(g, T, { relieve: 5 });
    pliegue(g, T, t.torR - 3, t.torTop + 5, t.torR - 4, t.torBot - 4);
    pliegue(g, T, t.torR - 7, t.torTop + 3, t.torR - 6, t.torTop + 8);
    /* Delantal: del pecho a las rodillas, con tirantes y bolsillo. */
    const del = capa().poly([[t.torL + 2, t.torTop + 6], [t.torR - 5, t.torTop + 6], [t.torR - 2, t.pierTop + 9], [t.torL - 3, t.pierTop + 9]]).ell(t.torL + 6, t.torTop + 13, 7.8, 7);
    del.quitarRect(0, 0, W, t.torTop + 6);
    del.pintar(g, B, { relieve: 4, separar: true });
    penumbra(g, B, 0, t.pierTop, W, t.pierTop + 9, 0.35);
    for (const xx of [t.torL + 3, t.torR - 6]) capa().linea(xx, t.torTop, xx + (xx < t.cx ? 0 : 1), t.torTop + 6, 2).pintar(g, B, { relieve: 1, separar: true });
    pliegue(g, B, t.torL + 3, t.pierTop + 1, t.torL + 1, t.pierTop + 8);
    pliegue(g, B, t.cx + 4, t.pierTop + 1, t.cx + 5, t.pierTop + 8);
    for (let i = 0; i < W; i++) if (del.tiene(i, t.pierTop + 9) && i % 2) pon(g, B, 1, [i, t.pierTop + 9]);
    /* Cordel del delantal con nudo. */
    cinturon(g, t, t.torBot - 3, MADERA, null, 2, t.torL - 3, t.torR + 1);
    capa().ell(t.torR - 1, t.torBot - 2, 1.6, 1.4).linea(t.torR - 1, t.torBot - 1, t.torR + 1, t.torBot + 4, 1).pintar(g, MADERA, { relieve: 1, min: 2, separar: true });
    /* Bolsillo con un cucharón asomando. */
    const bol = capa().rect(t.cx - 3, t.torBot + 1, 7, 5);
    capa().rect(t.cx + 1, t.torBot - 3, 2, 5).ell(t.cx + 1.5, t.torBot - 4, 1.6, 1.2).pintar(g, MADERA, { relieve: 1, min: 2, separar: true });
    bol.pintar(g, B, { relieve: 1.4, max: 3, separar: true });
    for (let i = t.cx - 3; i <= t.cx + 3; i++) pon(g, B, 1, [i, t.torBot + 1]), pon(g, B, 4, [i, t.torBot + 2]);
    /* Cabeza calva con la corona de pelo, patillas y el brillo de la calva. */
    cabeza(g, t, P, { nariz: 2 });
    const fleco = capa().ell(x + 1.4, t.cabY + 0.8, t.cabRx + 0.9, t.cabRy - 0.2);
    todo((i, j) => { if (i < x + 4 || j < t.cabY - 3 || j > t.cabY + 6) fleco.off(i, j); });
    fleco.rect(x + 1, y - 1, 3, 7).rect(x + 4, t.cabY - 3, 2, 2);
    fleco.pintar(g, Pe, { relieve: 1.8, separar: true });
    cada(g, Pe, 0, 0, W - 1, H - 1, (i, j, k) => { if (k >= 2 && (i * 3 + j * 2) % 5 === 0) pon(g, Pe, k - 1, [i, j]); else if (k === 2 && (i + j * 3) % 7 === 0) pon(g, Pe, 3, [i, j]); });
    oreja(g, t, P);
    pon(g, P, 4, [x - 3, t.cabY - 6], [x - 2, t.cabY - 6], [x - 4, t.cabY - 5], [x - 1, t.cabY - 7], [x, t.cabY - 7]);
    g.set(x - 3, t.cabY - 5, BRILLO, P);
    pon(g, P, 3, [x - 5, t.cabY - 4], [x - 4, t.cabY - 4], [x + 1, t.cabY - 7]);
    cara(g, t, P, { ceja: Pe, sinBoca: true, iris: "#4a6a3a" });
    /* Bigotazo con las puntas retorcidas hacia arriba, nariz roja y sonrisa debajo. */
    const n = t.narizX - 1;
    const big = capa().poly([[x - 9, y + 4], [x - 1.5, y + 4], [x + 0.5, y + 6.5], [x - 2, y + 6.8], [x - 5, y + 6.2], [x - 8, y + 6.8], [x - 10.5, y + 6]]);
    big.linea(x - 10.5, y + 6, x - 12, y + 4, 1.4).linea(x + 0.5, y + 6.5, x + 2, y + 4.5, 1.4);
    big.pintar(g, Pe, { relieve: 1.6, separar: 2 });
    surco(g, Pe, 4, x - 8, y + 4, x - 3, y + 4, Pe);
    surco(g, Pe, 1, x - 7, y + 6, x - 3, y + 6, Pe);
    pon(g, Pe, 3, [x - 12, y + 4], [x + 2, y + 4]);
    pon(g, Pe, 1, [x - 5, y + 5]);
    const nz = capa().ell(n + 1.2, y + 2.6, 1.7, 1.5);
    nz.pintar(g, NARIZ, { relieve: 1.4, separar: true });
    pon(g, NARIZ, 4, [n + 1, y + 2]); g.set(n, y + 2, NARIZ[3], NARIZ); g.set(n + 1, y + 1, BRILLO, NARIZ);
    pon(g, P, 0, [x - 6, y + 8], [x - 5, y + 8], [x - 4, y + 8]); pon(g, P, 1, [x - 7, y + 7], [x - 3, y + 7]);
    pon(g, P, 3, [x - 5, y + 9]);
    /* Trapo de cuadros al hombro de atrás. */
    const trapo = capa().rect(t.torR - 7, t.torTop - 1, 7, 3).rect(t.torR - 3, t.torTop + 2, 4, 9).off(t.torR, t.torTop + 10);
    trapo.pintar(g, B, { relieve: 1.4, min: 2, separar: true });
    todo((i, j) => { if (trapo.tiene(i, j) && ((i >> 1) + (j >> 1)) % 2 === 0) g.set(i, j, G[Math.min(4, tono(g, i, j) + (i % 2 ? 0 : 1))], G); });
    for (let j = t.torTop + 2; j <= t.torTop + 9; j++) matiz(g, t.torR - 3, j, -1);
    /* Brazo de delante remangado: el codo pegado a la barriga y el antebrazo hacia delante con la jarra. */
    const [mx, my] = [t.torL - 4, t.torTop + 12];
    const [cx2, cy2] = [t.torL + 4, t.torTop + 13];
    const hom = capa().linea(t.torL + 4, t.torTop + 3, cx2, cy2 - 3, 6);
    hom.pintar(g, T, { relieve: 2.2, separar: true });
    todo((i, j) => { if (hom.tiene(i, j) && !hom.tiene(i + 1, j) && j > t.torTop + 3) pon(g, T, 0, [i + 1, j]); });
    const ant = capa().linea(cx2, cy2, mx + 1, my, 5);
    ant.pintar(g, P, { relieve: 2, separar: true });
    surco(g, P, 4, cx2 - 2, cy2 - 2, mx + 3, my - 2, P);
    surco(g, P, 1, cx2, cy2 + 2, mx + 3, my + 2, P);
    todo((i, j) => { if (ant.tiene(i, j) && !ant.tiene(i, j + 1)) pon(g, T, 0, [i, j + 1]); });
    const vuelta = capa().ell(cx2 + 0.5, cy2 - 1.5, 3.6, 2);
    vuelta.pintar(g, T, { relieve: 1.5, min: 2, separar: true });
    surco(g, T, 1, cx2 - 2, cy2, cx2 + 3, cy2, T);
    surco(g, T, 4, cx2 - 2, cy2 - 3, cx2 + 1, cy2 - 3, T);
    for (const [i, j] of [[mx + 4, my - 1], [mx + 6, my], [mx + 3, my + 1], [mx + 7, my - 1], [mx + 5, my + 1]]) ponSi(g, P, Pe, 1, [i, j]);
    /* Jarra de madera con duelas, aros de hierro, asa y espuma que se derrama. */
    const jx = mx - 8, jy = my - 6;
    capa().rect(jx + 7, jy + 2, 3, 2).rect(jx + 9, jy + 2, 2, 7).rect(jx + 7, jy + 8, 3, 2).pintar(g, MADERA, { relieve: 1, max: 3, separar: true });
    const jarra = capa().rect(jx, jy, 8, 11).off(jx, jy + 10).off(jx + 7, jy + 10);
    jarra.pintar(g, MADERA, { relieve: 2.5, separar: true });
    for (let j = jy; j <= jy + 10; j++) { ponSi(g, MADERA, MADERA, 1, [jx + 3, j], [jx + 6, j]); ponSi(g, MADERA, MADERA, 3, [jx + 2, j]); }
    for (const j of [jy + 1, jy + 8]) for (let i = jx; i <= jx + 7; i++) pon(g, HIERRO, i === jx ? 3 : i === jx + 1 ? 4 : i > jx + 5 ? 1 : 2, [i, j]);
    pon(g, HIERRO, 0, [jx + 3, jy + 2], [jx + 5, jy + 9]);
    const esp = capa().ell(jx + 4, jy - 1, 4.8, 1.8).ell(jx + 1.5, jy - 2.4, 2.2, 1.6).ell(jx + 5, jy - 2.6, 2, 1.4).rect(jx - 1, jy, 2, 4).ell(jx - 0.5, jy + 4, 0.9, 1);
    esp.pintar(g, ESPUMA, { relieve: 1.6, min: 2, separar: true });
    pon(g, ESPUMA, 4, [jx + 1, jy - 3], [jx + 2, jy - 3], [jx, jy - 2], [jx + 5, jy - 3]);
    pon(g, ESPUMA, 1, [jx + 3, jy], [jx + 6, jy], [jx + 4, jy - 1]);
    /* Mano agarrando el asa. */
    capa().ell(mx + 1, my, 2.4, 2.4).pintar(g, P, { relieve: 1.4, separar: true });
    pon(g, P, 1, [mx, my + 1], [mx + 1, my + 1], [mx - 1, my]); pon(g, P, 4, [mx, my - 2]);
    bordeLuz(g, Pe, 2);
    contornoSel(g);
    destello(g, ESPUMA, jx - 2, jy - 5, false, true);
    return g;
  }

  /* Forastero (Ascua): guía encapuchada que huele a ceniza. Capa de hollín hasta el suelo con el borde
     deshilachado y encendido de brasas, capucha de punta caída, la cara en sombra con dos ojos dorados que
     brillan, broche con una brasa dentro, un mapa enrollado y lacrado en la mano y chispas que suben. */
  function forastero() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const P = R.piel.morena, C = HOLLIN, F = BRASA, O = ORO, N = R.tela.negro;
    const x = t.cabX, y = t.ojoY;
    piernas(g, t, N, CUERO2, { alto: 8 });
    /* Capa: de los hombros al bajo, con vuelo hacia atrás y jirones. */
    const s0 = t.suelo;
    const manto = capa().poly([[t.torL, t.torTop + 1], [t.torR + 2, t.torTop + 1], [t.torR + 9, s0 - 4], [t.torR + 6, s0 - 2], [t.cx + 3, s0 - 4], [t.cx - 3, s0 - 3], [t.torL - 3, s0 - 2], [t.torL - 7, s0 - 4]]);
    manto.ell(t.torR - 1, t.torTop + 4, 5.4, 5).ell(t.torL + 2, t.torTop + 4, 4.6, 5);
    for (const [i, j, a] of [[t.torL - 2, s0 - 2, 2], [t.cx + 1, s0 - 3, 1.6], [t.torR + 6, s0 - 2, 2], [t.torL + 4, s0 - 3, 1.4], [t.torR + 2, s0 - 3, 1.4]]) manto.restar(capa().poly([[i - a, j + 1.5], [i, j - 2], [i + a, j + 1.5]]));
    manto.pintar(g, C, { relieve: 5 });
    volumen(g, C, t.torL - 6, t.torR + 8, t.torTop + 6, s0);
    /* Pliegues largos con su filo de luz. */
    pliegue(g, C, t.torL + 2, t.torBot - 8, t.torL - 2, s0 - 5, 0);
    pliegue(g, C, t.cx + 2, t.torBot - 2, t.cx + 1, s0 - 5, 0);
    pliegue(g, C, t.torR + 1, t.torTop + 10, t.torR + 5, s0 - 5, 0);
    pliegue(g, C, t.torR - 3, t.torBot, t.torR - 2, s0 - 6, 1);
    penumbra(g, C, 0, t.torBot, W - 1, s0, 0.3);
    /* Forro granate oscuro que asoma por el borde delantero de la capa. */
    const forro = capa().poly([[t.torL, t.torTop + 9], [t.torL + 2, t.torTop + 9], [t.torL - 1, s0 - 4], [t.torL - 6, s0 - 4]]).recortar(manto);
    forro.pintar(g, R.tela.granate, { relieve: 1.5, max: 2 });
    surco(g, R.tela.granate, 0, t.torL + 2, t.torTop + 9, t.torL - 1, s0 - 4, R.tela.granate);
    surco(g, C, 1, t.torL + 3, t.torTop + 9, t.torL, s0 - 4, C);
    /* Capucha: copa redonda, punta que cae hacia la espalda, labio que enmarca la cara y esclavina. */
    const capu = capa().ell(x + 0.6, t.cabY - 0.6, t.cabRx + 2.4, t.cabRy + 1.8);
    capu.poly([[x + 3, t.cabY - 8.8], [x + 10, t.cabY - 5], [x + 14.5, t.cabY + 3], [x + 13, t.cabY + 8], [x + 8, t.cabY + 5]]);
    capu.poly([[x - 10, t.cabY + 5], [x + 10, t.cabY + 4], [x + 13, t.torTop + 7], [x + 4, t.torTop + 8.5], [x - 4, t.torTop + 8], [x - 11.5, t.torTop + 6]]);
    capu.pintar(g, C, { relieve: 5, separar: true });
    /* La punta: un surco que la separa de la copa. */
    surco(g, C, 0, x + 7, t.cabY - 3, x + 10, t.cabY + 5, C);
    surco(g, C, 3, x + 8, t.cabY - 4, x + 12, t.cabY + 3, C);
    pliegue(g, C, x + 3, t.torTop + 1, x + 4, t.torTop + 6, 1);
    pliegue(g, C, x - 5, t.torTop + 1, x - 6, t.torTop + 5, 1);
    for (let i = x - 12; i <= x + 14; i++) for (let j = t.torTop + 5; j <= t.torTop + 9; j++) if (capu.tiene(i, j) && !capu.tiene(i, j + 1) && g.rampa(i, j + 1) === C) pon(g, C, 0, [i, j + 1]), pon(g, C, 3, [i, j]);
    /* Hueco de la cara, en sombra; solo asoma la barbilla con un reflejo cálido de brasa. */
    const hueco = capa().ell(x - 2.6, y + 1.8, 4.2, 5.4);
    hueco.pintar(g, R.sombra, { plano: 1 });
    todo((i, j) => { if (hueco.tiene(i, j) && (!hueco.tiene(i - 1, j) || !hueco.tiene(i, j - 1) || !hueco.tiene(i + 1, j)) && j < y + 5) pon(g, R.sombra, 0, [i, j]); });
    const barb = capa().ell(x - 3.8, y + 6.2, 2.4, 1.3).recortar(hueco);
    barb.pintar(g, P, { relieve: 1.2, max: 2 });
    pon(g, P, 3, [x - 5, y + 6]); pon(g, P, 1, [x - 3, y + 7], [x - 2, y + 6]);
    pon(g, BRASA, 1, [x - 5, y + 7]);
    /* Labio de la capucha: grueso y con luz arriba a la izquierda. */
    todo((i, j) => {
      if (g.rampa(i, j) !== C || i > x + 3) return;
      const d1 = [[1, 0], [0, 1], [1, 1], [0, -1], [-1, 0], [1, -1], [-1, 1]].some(([a, b]) => hueco.tiene(i + a, j + b));
      const d2 = !d1 && [[2, 0], [0, 2], [2, 2], [2, -1], [-2, 0], [0, -2], [2, 1]].some(([a, b]) => hueco.tiene(i + a, j + b));
      if (d1) pon(g, j > y + 3 ? BRASA : C, j > y + 4 ? 1 : j > y + 3 ? 0 : 4, [i, j]);
      else if (d2 && j < y + 4) pon(g, C, j < y ? 3 : 2, [i, j]);
    });
    /* Ojos dorados: dos rendijas de oro que brillan desde dentro, con el resplandor en la mejilla. */
    for (const [ex, an] of [[x - 6, 2], [x - 2, 3]]) {
      for (let k = 0; k < an; k++) pon(g, O, 4, [ex + k, y]), pon(g, F, 3, [ex + k, y + 1]);
      g.set(ex, y, BRILLO, O);
      pon(g, F, 1, [ex + 1, y + 2]);
      pon(g, R.sombra, 3, [ex + an - 1, y - 1]);
    }
    /* Broche de bronce con una brasa dentro. */
    const bx = t.torL + 3, by = t.torTop + 6;
    capa().ell(bx, by, 2.2, 2.2).pintar(g, O, { relieve: 1.2, min: 1, separar: true });
    pon(g, F, 3, [bx, by], [bx + 1, by]); pon(g, F, 4, [bx, by]); pon(g, F, 1, [bx + 1, by + 1]); pon(g, O, 4, [bx - 1, by - 1]);
    g.set(bx - 1, by - 2, BRILLO, O);
    /* Brazo que asoma de la capa con un mapa enrollado y lacrado. */
    const [mx, my] = [t.torL - 4, t.torTop + 16];
    const manga = capa().poly([[t.torL + 1, t.torTop + 9], [t.torL + 5, t.torTop + 10], [mx + 3, my + 2.5], [mx, my + 1.5], [mx + 1, my - 2]]);
    manga.pintar(g, C, { relieve: 2.5, separar: true });
    surco(g, C, 4, t.torL + 1, t.torTop + 9, mx + 1, my - 2, C);
    const rollo = capa().rect(mx - 9, my - 2, 12, 4);
    rollo.pintar(g, HUESO, { relieve: 1.4, min: 1, separar: true });
    for (let i = mx - 9; i <= mx + 2; i++) pon(g, HUESO, 4, [i, my - 2]), pon(g, HUESO, 1, [i, my + 1]);
    pon(g, HUESO, 2, [mx - 9, my - 1], [mx - 9, my], [mx - 8, my]); pon(g, HUESO, 0, [mx - 9, my]);
    pon(g, HUESO, 3, [mx - 9, my - 2]);
    surco(g, CUERO2, 2, mx - 6, my - 2, mx - 6, my + 1, HUESO);
    surco(g, CUERO2, 2, mx - 1, my - 2, mx - 1, my + 1, HUESO);
    capa().ell(mx - 3.5, my - 0.2, 1.6, 1.6).pintar(g, R.sangre, { relieve: 1, min: 2, separar: true });
    pon(g, R.sangre, 4, [mx - 4, my - 1]); pon(g, R.sangre, 1, [mx - 3, my + 1]);
    capa().ell(mx + 1.5, my, 2, 2.2).pintar(g, P, { relieve: 1.2, separar: true });
    pon(g, P, 3, [mx + 1, my - 2]); pon(g, P, 1, [mx + 1, my + 1], [mx, my + 1]);
    /* Brasas en el bajo: el borde se enciende y el calor sube tramado. */
    todo((i, j) => {
      if (g.rampa(i, j) !== C || j < t.torBot + 4) return;
      const libre = k => !g.get(i, j + k) || g.rampa(i, j + k) === CUERO2 || g.rampa(i, j + k) === N || g.rampa(i, j + k) === F;
      if (libre(1)) pon(g, F, hash(i, j) < 0.2 ? 4 : hash(i, j, 3) < 0.6 ? 3 : 2, [i, j]);
      else if (libre(2)) pon(g, F, hash(i, j, 5) < 0.5 ? 1 : 2, [i, j]);
      else if (libre(3) && umbral(i, j) > 0.5) pon(g, F, 0, [i, j]);
      else if (libre(4) && umbral(i, j) > 0.8) pon(g, F, 0, [i, j]);
      else if (hash(i, j, 9) < 0.025) pon(g, CENIZA, 1, [i, j]);
    });
    /* Ceniza posada en la capucha y los hombros. */
    for (const [i, j] of [[x + 3, t.cabY - 8], [x + 7, t.cabY - 5], [x + 1, t.cabY - 9], [x + 10, t.cabY - 2], [x + 5, t.cabY - 8], [x - 6, t.torTop + 1], [x + 9, t.torTop + 2]]) ponSi(g, C, CENIZA, 2, [i, j]);
    bordeLuz(g, C, 3);
    contornoSel(g);
    /* Chispas que suben. */
    for (const [i, j, k] of [[t.torL - 9, s0 - 6, 3], [t.torL - 6, s0 - 11, 4], [t.torR + 10, s0 - 9, 3], [t.torR + 11, s0 - 15, 2], [t.torL - 10, s0 - 17, 2], [t.torR + 8, t.torTop + 3, 1], [t.torR + 12, t.torTop + 9, 3], [t.torL - 7, s0 - 22, 1]]) mota(g, F, k, i, j);
    destello(g, F, t.torL - 8, s0 - 13, false, true);
    for (const [i, j] of [[x + 17, t.cabY + 2], [x - 13, t.torTop + 1], [x + 16, t.cabY - 5]]) mota(g, CENIZA, 3, i, j);
    return g;
  }

  /* Mercader (Brunilda): pelirroja con pecas, moño y cofia blanca con cinta granate, vestido azul largo
     con corpiño de cordones y delantal, faja granate, bolsa de monedas a la cadera y una balanza de
     bronce en la mano, con una moneda en cada platillo. */
  function mercader() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const P = R.piel.clara, Pe = R.pelo.cobrizo, T = R.tela.azul, B = R.tela.blanco, Gr = R.tela.granate, O = ORO;
    const x = t.cabX, y = t.ojoY;
    /* Moño y trenza detrás. */
    capa().ell(x + 7.5, t.cabY - 4, 4, 3.8).pintar(g, Pe, { relieve: 2.4 });
    surco(g, Pe, 1, x + 5, t.cabY - 6, x + 9, t.cabY - 2, Pe); surco(g, Pe, 4, x + 6, t.cabY - 7, x + 9, t.cabY - 4, Pe);
    const tr = capa().curva(x + 7, t.cabY + 1, x + 12, t.cabY + 6, x + 9, t.torTop + 7, 4, 2);
    tr.pintar(g, Pe, { relieve: 1.6 });
    for (let j = t.cabY + 2; j <= t.torTop + 6; j += 2) cada(g, Pe, x + 6, j, x + 13, j, (i, jj, k) => { if (tr.tiene(i, jj)) pon(g, Pe, k > 1 ? k - 1 : k, [i, jj]); });
    /* Brazo de atrás colgando. */
    brazo(g, [[t.torR - 3, t.torTop + 3], [t.torR + 1, t.torTop + 10], [t.torR + 1, t.torTop + 16]], T, P, { atras: true, largo: true, grueso: 5, fino: 4 });
    /* Zapatos bajo la falda. */
    capa().rect(t.cx - 9, t.suelo - 2, 6, 3).rect(t.cx + 1, t.suelo - 2, 6, 3).pintar(g, CUERO, { relieve: 1.2 });
    pon(g, CUERO, 4, [t.cx - 9, t.suelo - 2], [t.cx + 1, t.suelo - 2]);
    /* Vestido: corpiño y falda larga acampanada. */
    const vestido = torso(t).unir(falda(t, t.suelo - t.pierTop - 2, 5, 6));
    vestido.pintar(g, T, { relieve: 5 });
    volumen(g, T, t.wL - 6, t.wR + 7, t.pierTop, t.suelo, 1, 3);
    for (const [a, b] of [[t.cx + 5, t.cx + 7], [t.cx + 9, t.cx + 12], [t.wL - 1, t.wL - 5]]) pliegue(g, T, a, t.pierTop + 1, b, t.suelo - 3);
    /* Bajo con ribete oscuro y un poco de vuelo ondulado. */
    for (let i = 0; i < W; i++) for (let j = t.pierTop; j <= t.suelo; j++) if (g.rampa(i, j) === T && g.rampa(i, j + 1) !== T) { pon(g, T, 1, [i, j]); if (g.rampa(i, j - 1) === T) pon(g, T, i % 4 === 0 ? 1 : 3, [i, j - 1]); }
    /* Delantal blanco con su volante. */
    const del = capa().poly([[t.wL - 0.5, t.torBot - 2], [t.cx + 3, t.torBot - 2], [t.cx + 5, t.suelo - 5], [t.wL - 6, t.suelo - 5]]);
    del.pintar(g, B, { relieve: 3, separar: true });
    pliegue(g, B, t.wL + 1, t.pierTop + 2, t.wL - 2, t.suelo - 6);
    pliegue(g, B, t.cx, t.pierTop + 2, t.cx + 1, t.suelo - 6);
    penumbra(g, B, 0, t.pierTop, W, t.suelo - 5, 0.4);
    for (let i = 0; i < W; i++) if (del.tiene(i, t.suelo - 5)) pon(g, B, i % 2 ? 4 : 2, [i, t.suelo - 5]), pon(g, B, 1, [i, t.suelo - 4]);
    /* Faja granate con hebilla y corpiño con cordones. */
    cinturon(g, t, t.torBot - 4, Gr, O, 3);
    for (let j = t.torTop + 4; j <= t.torBot - 6; j += 2) { pon(g, NEGRO, 2, [t.torL + 4, j], [t.torL + 6, j]); pon(g, NEGRO, 1, [t.torL + 5, j + 1]); }
    for (let j = t.torTop + 4; j <= t.torBot - 6; j++) ponSi(g, T, T, 1, [t.torL + 3, j], [t.torL + 7, j]);
    /* Escote con camisa blanca y cuello fruncido. */
    const cam = capa().rect(t.torL + 2, t.torTop, 9, 3).ell(t.torL + 6, t.torTop + 2.5, 3.4, 1.6);
    cam.pintar(g, B, { relieve: 1.2, min: 2, separar: true });
    for (let i = t.torL + 2; i <= t.torL + 10; i += 2) pon(g, B, 1, [i, t.torTop + 1]);
    /* Bolsa de monedas a la cadera de atrás, con cordón y monedas que asoman. */
    const bx = t.torR + 1, by = t.torBot + 2;
    capa().ell(bx, by, 3.2, 3.6).rect(bx - 1, by - 5, 3, 2).pintar(g, CUERO, { relieve: 1.8, separar: true });
    surco(g, CUERO, 0, bx - 2, by - 2, bx + 2, by - 2, CUERO);
    pon(g, O, 4, [bx - 1, by - 3]); pon(g, O, 3, [bx, by - 3]); pon(g, O, 2, [bx + 1, by - 3]);
    pon(g, CUERO, 4, [bx - 2, by]); pon(g, Gr, 3, [bx - 1, by - 5], [bx + 1, by - 5]);
    /* Cabeza, pelo cobrizo bajo la cofia y la cofia. */
    cabeza(g, t, P);
    const pelo = capa().ell(x + 0.8, t.cabY - 1, t.cabRx + 1, t.cabRy + 0.6);
    todo((i, j) => { if ((i < x + 2 && j > t.cabY - 4) || j > t.cabY + 5) pelo.off(i, j); });
    pelo.poly([[x - 9, t.cabY - 4], [x - 2, t.cabY - 8], [x + 1, t.cabY - 4], [x - 5, y - 4], [x - 8, y - 3], [x - 9, y - 1]]);
    pelo.rect(x + 2, y - 1, 3, 6);
    pelo.pintar(g, Pe, { relieve: 2.8, separar: true });
    cada(g, Pe, 0, 0, W - 1, t.torTop, (i, j, k) => { if (k >= 2 && (i * 2 + j) % 5 === 0) pon(g, Pe, k - 1, [i, j]); });
    pon(g, Pe, 4, [x - 6, t.cabY - 5], [x - 5, t.cabY - 5], [x - 7, t.cabY - 4], [x - 4, t.cabY - 6]);
    const cofia = capa().ell(x + 2, t.cabY - 4.4, t.cabRx - 0.4, t.cabRy - 3.2);
    todo((i, j) => { if (i < x - 4) cofia.off(i, j); if (j > t.cabY - 2 && i < x + 4) cofia.off(i, j); if (j > t.cabY + 1) cofia.off(i, j); });
    cofia.pintar(g, B, { relieve: 2.8, min: 2, separar: true });
    /* Volante del borde: festón de puntos claros con su sombra debajo. */
    todo((i, j) => { if (cofia.tiene(i, j) && !cofia.tiene(i, j + 1)) { pon(g, B, i % 2 ? 4 : 3, [i, j + 1]); if (i % 2) ponSi(g, [Pe, P], B, 2, [i, j + 2]); } });
    todo((i, j) => { if (cofia.tiene(i, j) && !cofia.tiene(i - 1, j) && j < t.cabY) pon(g, B, 4, [i - 1, j]); });
    surco(g, B, 1, x - 1, t.cabY - 6, x + 5, t.cabY - 2, B);
    surco(g, B, 4, x - 2, t.cabY - 6, x + 3, t.cabY - 3, B);
    pon(g, B, 4, [x - 1, t.cabY - 8], [x, t.cabY - 8], [x - 2, t.cabY - 7]);
    /* Cinta granate con lazo detrás. */
    capa().ell(x + 6.5, t.cabY, 1.4, 1.2).linea(x + 6, t.cabY + 1, x + 8, t.cabY + 5, 1.4).linea(x + 7, t.cabY + 1, x + 10, t.cabY + 4, 1).pintar(g, Gr, { relieve: 1, min: 2, separar: true });
    pon(g, Gr, 4, [x + 6, t.cabY - 1]);
    oreja(g, t, P);
    capa().ell(x + 3.5, y + 5, 1, 1.2).pintar(g, O, { relieve: 1, min: 3 });
    cara(g, t, P, { iris: "#3f7a3c", iris2: "#2a5a2e", ceja: Pe });
    /* Pecas. */
    for (const [i, j] of [[t.ojo1 - 1, y + 3], [t.ojo1 + 1, y + 4], [t.ojo2 + 1, y + 3], [t.ojo1 + 3, y + 3]]) ponSi(g, P, P, 1, [i, j]);
    /* Labios. */
    pon(g, MEJILLA, 2, [x - 6, t.bocaY], [x - 5, t.bocaY]); pon(g, MEJILLA, 3, [x - 5, t.bocaY + 1]);
    /* Brazo de delante con la balanza. */
    const [mx, my] = [t.torL - 6, t.torTop + 13];
    brazo(g, [[t.torL + 4, t.torTop + 3], [t.torL + 1, t.torTop + 11], [mx + 1, my]], T, P, { largo: true, sinMano: true, grueso: 5, fino: 4 });
    for (let i = 0; i < 3; i++) pon(g, B, i === 0 ? 4 : 2, [mx + 2, my - 1 + i], [mx + 3, my - 1 + i]);
    const top = my - 13;
    const bal = capa().rect(mx - 1, top, 2, 14).rect(mx - 8, top + 1, 17, 1).rect(mx - 2, top - 2, 4, 3);
    bal.pintar(g, O, { relieve: 1, min: 2, separar: true });
    surco(g, O, 4, mx - 1, top + 2, mx - 1, my - 2, O);
    pon(g, O, 4, [mx - 1, top - 2], [mx - 8, top + 1], [mx - 2, top - 1]); g.set(mx - 1, top - 2, BRILLO, O);
    pon(g, O, 1, [mx + 7, top + 1], [mx + 8, top + 1]);
    for (const [px, d] of [[mx - 7, 1], [mx + 7, -1]]) {
      hilo(g, px, top + 2, px - 3, top + 7, O, 1); hilo(g, px, top + 2, px + 3, top + 7, O, 1);
      const plato = capa().rect(px - 4, top + 7, 9, 1).rect(px - 3, top + 8, 7, 1);
      plato.pintar(g, O, { relieve: 1, min: 2 });
      pon(g, O, 4, [px - 4, top + 7], [px - 3, top + 7]); pon(g, O, 1, [px + 3, top + 8]);
      /* Moneda en el platillo. */
      pon(g, R.bronce, 4, [px - 1, top + 6]); pon(g, R.bronce, 3, [px, top + 6]); pon(g, R.bronce, 2, [px + 1, top + 6]);
    }
    capa().ell(mx + 0.6, my, 2, 2).pintar(g, P, { relieve: 1.2, separar: true });
    pon(g, P, 4, [mx, my - 1]); pon(g, P, 1, [mx + 1, my + 1]);
    bordeLuz(g, T, 3, (i, j) => j > t.torTop);
    contornoSel(g);
    destello(g, O, mx - 12, top - 1, false, true);
    return g;
  }

  window.PNJ_64 = window.PNJ_64 || {};
  Object.assign(window.PNJ_64, { tabernero, forastero, mercader });
  window.MASCOTAS_64 = window.MASCOTAS_64 || {};
})();
