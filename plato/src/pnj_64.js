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
  const SAVIA = ["#2c4434", "#4d7550", "#7ea868", "#b4d48c", "#e8f6c0"];
  const FRONDA = ["#0a1a14", "#15331d", "#265a2a", "#3f8636", "#78b452"];
  const HOJA = ["#16240f", "#2b4318", "#4a6c22", "#7a9c34", "#b6d062"];
  const CORTEZA = ["#1a110f", "#36231a", "#58392a", "#7f5a3c", "#a8845a"];
  const CUERNO = ["#1e1424", "#3c2c44", "#64526c", "#927e96", "#cab8c4"];
  const BRASA = ["#4a0f0c", "#952612", "#dc5418", "#ffa032", "#ffe68c"];
  /* Fantasma: túnica añil profunda, barba casi blanca, manto azul medio, luz de alma cian. */
  const TUNICA_E = ["#0e1030", "#1d2558", "#30408a", "#4d67b4", "#7c96d6"];
  const MANTO_E = ["#0f1f36", "#1d3a5c", "#2e5a84", "#4a80a8", "#78aacc"];
  const BARBA_E = ["#5a7c94", "#8eb4c8", "#c2e0ea", "#e4f6fa", "#ffffff"];
  const CARA_E = ["#1a2846", "#34557c", "#5f8cb4", "#93bcd8", "#c6e4f2"];
  const ARMINO_E = ["#2c2c5c", "#5c5c96", "#9494c8", "#c8c8ea", "#f0f0ff"];
  const CORONA_E = ["#1e3432", "#466a5c", "#86ac8a", "#c6e0a8", "#f4ffd8"];
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
  /* Capa con el mismo sombreado que PX.Capa, pero que solo recorre el rectángulo que ocupa
     (pintar una pieza pequeña no cuesta como pintar toda la rejilla). */
  class CapaR extends Capa {
    caja() {
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (this.m[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return [x0, y0, x1, y1];
    }
    copia() { const o = new CapaR(this.w, this.h); o.m = this.m.slice(); return o; }
    pintar(rej, rampa, op = {}) {
      const [x0, y0, x1, y1] = this.caja();
      if (x1 < 0) return rej;
      const m = this.m;
      if (op.plano !== undefined) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * W + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const R2 = op.relieve || 4;
      const d = new Float32Array(W * H);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * W + x]) d[y * W + x] = 1e6;
      const D = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x]);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
      }
      for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) {
        const i = y * W + x;
        if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
      }
      const al = new Float32Array(W * H);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        if (!m[i]) continue;
        const v = Math.min(d[i], R2) / R2;
        al[i] = Math.sqrt(1 - (1 - v) * (1 - v));
      }
      const alto = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : al[y * W + x]);
      const L = op.luz || [-0.5, -0.62, 0.6];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.4, sesgo = op.sesgo || 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!m[y * W + x]) continue;
        const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k;
        const ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
        const nl = Math.hypot(nx, ny, 1);
        const l = (nx * lx + ny * ly + lz) / nl + sesgo;
        let t = l > 0.965 ? 4 : l > 0.74 ? 3 : l > 0.4 ? 2 : l > 0.02 ? 1 : 0;
        if (t === 0 && !op.profundo) t = 1;
        if (op.max !== undefined) t = Math.min(t, op.max);
        if (op.min !== undefined) t = Math.max(t, op.min);
        if (op.separar) {
          const borde = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !this.tiene(x + a, y + b) && rej.get(x + a, y + b));
          if (borde) t = Math.min(t, op.separar === true ? 1 : op.separar);
        }
        rej.set(x, y, rampa[Math.min(t, rampa.length - 1)], rampa);
      }
      return rej;
    }
  }
  const capa = () => new CapaR(W, H);
  /* Al acabar: todo píxel cuyo color no esté en su rampa (brillos blancos, ojos, el rosa de las orejas)
     pasa a una copia de la rampa con ese color en el tono de luminosidad más parecida, para que
     .tenida() lo traduzca con sentido. */
  const cacheFin = new Map();
  const cacheLum = new Map();
  const lum = c => { if (!cacheLum.has(c)) { const [r, g, b] = aRgb(c); cacheLum.set(c, 0.3 * r + 0.59 * g + 0.11 * b); } return cacheLum.get(c); };
  function final(g) {
    for (let i = 0; i < g.c.length; i++) {
      const c = g.c[i], r = g.r[i];
      if (!c || (r && r.indexOf(c) >= 0)) continue;
      const base = r || rampaContorno(c);
      if (!r) { g.r[i] = base; continue; }
      let mejor = 0, dm = 1e9;
      r.forEach((x, k) => { const dd = Math.abs(lum(x) - lum(c)); if (dd < dm) { dm = dd; mejor = k; } });
      const clave = r.join() + "|" + c + "|" + mejor;
      if (!cacheFin.has(clave)) { const o = r.slice(); o[mejor] = c; cacheFin.set(clave, o); }
      g.r[i] = cacheFin.get(clave);
    }
    return g;
  }
  /* Cada pieza se dibuja una sola vez; las llamadas siguientes devuelven una copia nueva (misma imagen). */
  const acabar = fs => {
    const o = {};
    for (const [k, f] of Object.entries(fs)) { let hecha = null; o[k] = () => (hecha || (hecha = final(f()))).copia(); }
    return o;
  };
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
  const cacheOscuro = new Map();
  const oscuro = c => { if (!cacheOscuro.has(c)) cacheOscuro.set(c, mezcla(c, "#0b0610", 0.62)); return cacheOscuro.get(c); };
  const cacheMedio = new Map();
  const medio = ram => { if (!cacheMedio.has(ram)) cacheMedio.set(ram, mezcla(ram[0], ram[1], 0.5)); return cacheMedio.get(ram); };
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
          if (!ab && de && tono(g, x + 1, y) >= 3) col = medio(ram);
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
    todo((i, j) => { if (i < x - 4) cofia.off(i, j); if (j > t.cabY - 4 && i < x + 4) cofia.off(i, j); if (j > t.cabY + 1) cofia.off(i, j); });
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

  /* Hoja con nervio: forma de lanza entre (x0,y0) y (x1,y1), el nervio oscuro y un filo de luz. */
  function hojita(g, ram, x0, y0, x1, y1, ancho = 1.6, op = {}) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * ancho, ny = dx / l * ancho;
    const mx = x0 + dx * 0.45, my = y0 + dy * 0.45;
    capa().poly([[x0, y0], [mx + nx, my + ny], [x1, y1], [mx - nx, my - ny]]).pintar(g, ram, { relieve: 1.2, min: op.min || 1, max: op.max || 4, separar: true });
    surco(g, ram, op.nervio ?? 1, x0 + dx * 0.15, y0 + dy * 0.15, x0 + dx * 0.8, y0 + dy * 0.8, ram);
  }
  /* Follaje en matas: cada mata es una bola con su luz arriba a la izquierda y su sombra abajo;
     se pintan de atrás (abajo a la derecha) hacia delante, así las de delante pisan las sombras. */
  function follaje(g, ram, matas, op = {}) {
    const orden = matas.slice().sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]));
    const todoC = capa();
    for (const [i, j, r] of orden) todoC.ell(i, j, r, r * 0.85);
    if (op.recorte) todoC.recortar(op.recorte);
    if (op.detras) detras(g, todoC.copia(), ram, { plano: 1 }); else todoC.pintar(g, ram, { plano: 1 });
    for (const [i, j, r] of orden) {
      const c = capa().ell(i, j, r, r * 0.85).recortar(todoC);
      if (op.detras) todo((a, b) => { if (c.tiene(a, b) && g.rampa(a, b) !== ram) c.off(a, b); });
      c.pintar(g, ram, { relieve: Math.max(1.2, r * 0.7), min: 1, max: op.max || 4, separar: 1 });
    }
    return todoC;
  }
  /* Flor de cinco pétalos con el centro dorado. */
  function flor(g, ram, i, j, grande) {
    pon(g, ram, 4, [i, j - 1], [i - 1, j]); pon(g, ram, 3, [i + 1, j], [i, j + 1]);
    if (grande) { pon(g, ram, 3, [i - 1, j - 1], [i + 1, j - 1]); pon(g, ram, 2, [i + 1, j + 1], [i - 1, j + 1]); pon(g, ram, 4, [i, j - 2]); }
    pon(g, ORO, 4, [i, j]);
  }

  /* Dríada: piel de savia, corpiño de corteza con vetas y un nudo, faldón de hojas con nervios, piernas de
     tronco que acaban en raíces, melena frondosa con flores rosas y blancas, orejas de punta, una hiedra
     enroscada en el brazo y una ramita florida en la mano. */
  function driada() {
    const g = new Rejilla(W, H), t = plantilla("esbelto");
    const P = SAVIA, M = CORTEZA, Hj = FRONDA, Hf = HOJA;
    const x = t.cabX, y = t.ojoY;
    /* Melena detrás: cae por la espalda en matas de hojas. */
    follaje(g, Hj, [[x + 3, t.cabY - 1, 7], [x + 8, t.cabY + 4, 4.4], [x + 11, t.cabY - 4, 3.6], [x + 13, t.cabY + 3, 3.2], [x + 12, t.torTop + 3, 3.4], [x + 10, t.torTop + 8, 3.4],
      [x + 12, t.torTop + 12, 2.8], [x + 9, t.torTop + 15, 2.4], [x + 6, t.cabY - 8, 3.6], [x - 1, t.cabY - 9, 3.4], [x + 14, t.cabY - 1, 2.4], [x + 7, t.torTop + 4, 3]], { max: 3 });
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 1, t.torTop + 10], [t.torR + 1, t.torTop + 16]], P, P, { atras: true, grueso: 4, fino: 3 });
    /* Piernas de tronco y raíces por pies. */
    const xa = t.cx + 3, xd = t.cx - 3;
    const pier = capa().linea(xd, t.pierTop, xd - 1, t.suelo - 1, 4).linea(xa, t.pierTop, xa + 1, t.suelo - 1, 4);
    pier.pintar(g, M, { relieve: 1.8 });
    cada(g, M, xa - 3, t.pierTop, xa + 4, t.suelo, (i, j, k) => { if (k > 1) pon(g, M, k - 1, [i, j]); });
    const raiz = capa();
    for (const [o, d] of [[xd - 1, -1], [xa + 1, 1]]) {
      raiz.curva(o, t.suelo - 2, o + d * 3, t.suelo, o + d * 6, t.suelo, 2.4, 1).curva(o, t.suelo - 2, o - d * 3, t.suelo, o - d * 5, t.suelo, 2.4, 1);
      raiz.curva(o, t.suelo - 3, o - d * 2, t.suelo - 1, o - d * 3, t.suelo, 1.8, 1);
    }
    raiz.pintar(g, M, { relieve: 1.2, max: 3, separar: true });
    for (let i = 0; i < W; i++) if (g.rampa(i, t.suelo) === M) pon(g, M, 1, [i, t.suelo]);
    /* Vetas verticales de corteza y musgo. */
    for (let j = t.pierTop + 1; j < t.suelo - 1; j++) { if (j % 3) ponSi(g, M, M, 1, [xd - 1 + (j % 5 === 0 ? 1 : 0), j]); if (j % 4 === 1) ponSi(g, M, M, 3, [xd - 2, j]); if (j % 3 === 2) ponSi(g, M, M, 0, [xa + 1, j]); }
    for (const [i, j] of [[xd - 3, t.pierTop + 9], [xd - 2, t.pierTop + 10], [xa + 2, t.pierTop + 6], [xd + 1, t.suelo - 3]]) ponSi(g, M, Hf, 3, [i, j]);
    /* Torso de savia y corpiño de corteza. */
    torso(t).pintar(g, P, { relieve: 5 });
    const corteza = capa().rect(t.torL, t.torTop + 6, t.torR - t.torL + 1, t.torBot - t.torTop - 7).ell(t.cx - 1, t.torTop + 6, 5.4, 2);
    corteza.recortar(torso(t)).pintar(g, M, { relieve: 3, separar: true });
    /* Vetas onduladas y un nudo en la corteza. */
    cada(g, M, t.torL, t.torTop + 4, t.torR, t.torBot, (i, j, k) => { const v = Math.sin((j + i * 0.3) * 0.9 + i * 1.7); if (v > 0.82 && k > 0) pon(g, M, k - 1, [i, j]); else if (v < -0.9 && k < 4) pon(g, M, k + 1, [i, j]); });
    capa().ell(t.cx + 2, t.torTop + 12, 1.6, 1.2).pintar(g, M, { plano: 0 });
    pon(g, M, 3, [t.cx + 1, t.torTop + 11], [t.cx + 2, t.torTop + 11]); pon(g, M, 4, [t.cx + 1, t.torTop + 10]);
    /* Hojitas en el escote. */
    for (const [i, j, a, b] of [[t.torL + 1, t.torTop + 7, -3, -2], [t.torR - 1, t.torTop + 8, 3, -2], [t.cx - 2, t.torTop + 6, -2, -3]]) hojita(g, Hf, i, j, i + a, j + b, 1.1, { min: 2 });
    /* Faldón de hojas en punta, en dos capas. */
    for (let capaH = 0; capaH < 2; capaH++)
      for (let i = t.wL - 3 + capaH * 2; i <= t.wR + 3; i += 4) {
        const largo = 8 + ((i * 7) % 3) - capaH * 3;
        hojita(g, capaH ? Hj : Hf, i, t.torBot - 2, i + (i < t.cx ? -1.5 : 1.2), t.pierTop + largo, 2.1, { min: capaH ? 2 : 1, nervio: capaH ? 2 : 1 });
      }
    capa().rect(t.wL - 1, t.torBot - 2, t.wR - t.wL + 3, 2).pintar(g, Hf, { relieve: 1, min: 2, separar: true });
    /* Cabeza, oreja de punta y flequillo de hojas que enmarca la frente. */
    cabeza(g, t, P);
    oreja(g, t, P, 4);
    const limite = capa().ell(x + 0.8, t.cabY - 1.8, t.cabRx + 2, t.cabRy + 0.4);
    todo((i, j) => { if ((i < x + 3 && j > t.cabY - 4 + Math.max(0, x - 2 - i) * 0.4) || (i >= x + 3 && j > t.cabY - 1)) limite.off(i, j); });
    follaje(g, Hj, [[x - 8, t.cabY - 5, 2.8], [x - 4, t.cabY - 8, 3], [x + 1, t.cabY - 9, 3.2], [x + 5, t.cabY - 7, 3.2], [x + 8, t.cabY - 3, 3], [x - 6, t.cabY - 3, 2.2], [x - 1, t.cabY - 5, 2.6], [x + 4, t.cabY - 3, 2.6]], { recorte: limite });
    /* Nervios de hoja sueltos en las matas. */
    cada(g, Hj, 0, 0, W - 1, H - 1, (i, j, k) => { if (k === 3 && (i * 5 + j * 3) % 11 === 0 && es(g, i + 1, j + 1, Hj)) pon(g, Hj, 2, [i + 1, j + 1]); });
    cara(g, t, P, { iris: AMBAR[3], iris2: AMBAR[2], ceja: Hj, mejilla: false });
    pon(g, ROSA, 3, [t.ojo1 + 1, y + 3], [t.ojo1 + 2, y + 3]); pon(g, ROSA, 4, [t.ojo1 + 1, y + 2]);
    pon(g, P, 1, [x - 6, t.bocaY], [x - 5, t.bocaY]); pon(g, ROSA, 2, [x - 5, t.bocaY + 1]);
    /* Marcas de savia en la mejilla, como vetas de hoja. */
    pon(g, P, 1, [x - 1, y + 4], [x, y + 5]); pon(g, P, 3, [x - 1, y + 5]);
    /* Flores en la melena. */
    for (const [i, j, c, gr] of [[x - 5, t.cabY - 9, 0, 1], [x + 5, t.cabY - 10, 1, 0], [x + 12, t.cabY + 3, 0, 1], [x + 1, t.cabY - 12, 1, 0], [x + 12, t.torTop + 8, 1, 1], [x - 9, t.cabY - 4, 1, 0], [x + 10, t.cabY - 5, 0, 0], [x + 9, t.torTop + 14, 0, 0]]) flor(g, c ? HUESO : ROSA, i, j, gr);
    /* Brazo de delante con hiedra y una ramita florida. */
    const [mx, my] = [t.torL - 4, t.torTop + 12];
    capa().curva(mx, my + 3, mx - 4, my - 3, mx - 3, my - 12, 1).pintar(g, M, { plano: 2 });
    hojita(g, Hf, mx - 2, my - 4, mx - 7, my - 6, 1.3, { min: 2 });
    hojita(g, Hf, mx - 3, my - 8, mx + 1, my - 10, 1.2, { min: 2 });
    brazo(g, [[t.torL + 3, t.torTop + 3], [t.torL, t.torTop + 9], [mx + 1, my]], P, P, { grueso: 4, fino: 3 });
    for (let s2 = 0; s2 < 6; s2++) { const i = Math.round(t.torL + 2 - s2 * 1.1), j = t.torTop + 4 + s2 * 1.6; ponSi(g, P, Hf, 2 + (s2 % 2), [i + (s2 % 2), j]); }
    flor(g, ROSA, mx - 3, my - 13, true);
    flor(g, HUESO, mx - 6, my - 9, false);
    g.set(mx - 3, my - 13, BRILLO, ORO);
    bordeLuz(g, Hj, 3, (i, j) => j < t.cabY);
    contornoSel(g);
    /* Polen y una hojita que cae. */
    for (const [i, j, k] of [[mx - 8, my - 15, 4], [t.torR + 11, t.torTop + 18, 3], [x - 12, t.cabY - 9, 4], [t.torL - 9, t.suelo - 10, 3]]) mota(g, ORO, k, i, j);
    for (const [i, j, k] of [[t.torR + 13, t.torTop + 22, 3], [t.torR + 14, t.torTop + 23, 2]]) mota(g, Hf, k, i, j);
    return g;
  }

  /* Gnomo (Fizwick): bajito, de pelo blanco rizado, narizota colorada, bigote blanco, gafas de latón en
     la frente, túnica granate con bolsillos y botones, mochila de inventor con petate, llave inglesa y
     una antena con bombilla, y un matraz de vidrio con un líquido verde que burbujea. */
  function gnomo() {
    const g = new Rejilla(W, H), t = plantilla("bajo");
    const P = R.piel.clara, Pe = R.pelo.canoso, T = R.tela.granate, O = ORO, Pl = R.plata;
    const x = t.cabX, y = t.ojoY;
    /* Mochila a la espalda: marco de madera con travesaños, petate azul encima y herramientas. */
    const mx0 = t.torR - 3, my0 = t.torTop - 7;
    detras(g, capa().rect(mx0 + 7, my0 - 12, 2, 10).ell(mx0 + 8, my0 - 13, 2.6, 2).off(mx0 + 8, my0 - 15).off(mx0 + 8, my0 - 14), Pl, { relieve: 1, min: 2 });
    pon(g, Pl, 4, [mx0 + 7, my0 - 11], [mx0 + 7, my0 - 8], [mx0 + 6, my0 - 14]);
    capa().rect(mx0, my0 - 10, 1, 6).pintar(g, O, { relieve: 1, min: 2 });
    capa().ell(mx0 + 0.5, my0 - 11.5, 1.8, 1.8).pintar(g, AMBAR, { relieve: 1.2, min: 3 });
    g.set(mx0, my0 - 12, BRILLO, AMBAR);
    const moch = capa().rect(mx0, my0, 11, 18).off(mx0 + 10, my0).off(mx0 + 10, my0 + 17);
    moch.pintar(g, CUERO, { relieve: 3 });
    for (const j of [my0 + 5, my0 + 11]) surco(g, CUERO, 0, mx0 + 1, j, mx0 + 10, j, CUERO), surco(g, CUERO, 3, mx0 + 1, j - 1, mx0 + 10, j - 1, CUERO);
    capa().rect(mx0 + 10, my0 + 2, 2, 14).pintar(g, MADERA, { relieve: 1, max: 3 });
    capa().rect(mx0 + 3, my0 + 13, 6, 4).pintar(g, CUERO, { relieve: 1, separar: true });
    pon(g, O, 4, [mx0 + 5, my0 + 14]); pon(g, O, 2, [mx0 + 6, my0 + 14]);
    const pet = capa().ell(mx0 + 5, my0 - 1, 6.6, 2.8);
    pet.pintar(g, R.tela.azul, { relieve: 2.4, separar: true });
    for (const i of [mx0 + 1, mx0 + 8]) surco(g, CUERO, 2, i, my0 - 3, i, my0 + 1, R.tela.azul);
    surco(g, R.tela.azul, 1, mx0, my0 - 1, mx0 + 10, my0, R.tela.azul);
    /* Llave inglesa asomando por detrás del petate. */
    detras(g, capa().rect(mx0 - 3, my0 - 10, 2, 8).ell(mx0 - 2, my0 - 11, 2.4, 1.8).off(mx0 - 2, my0 - 12).off(mx0 - 2, my0 - 13), Pl, { relieve: 1, min: 2, separar: true });
    pon(g, Pl, 4, [mx0 - 3, my0 - 9], [mx0 - 3, my0 - 6], [mx0 - 4, my0 - 12]);
    brazo(g, [[t.torR - 2, t.torTop + 2], [t.torR + 1, t.torTop + 6], [t.torR - 1, t.torTop + 10]], T, P, { atras: true, grueso: 4, fino: 3.5 });
    piernas(g, t, R.tela.ocre, CUERO, { grosor: 4, alto: 5 });
    /* Túnica granate con bolsillos, botones y cinturón. */
    torso(t).unir(falda(t, 3, 1)).pintar(g, T, { relieve: 4.5 });
    volumen(g, T, t.wL - 2, t.wR + 2, t.torTop, t.pierTop + 4, 0.8);
    pliegue(g, T, t.cx + 4, t.torBot - 1, t.cx + 5, t.pierTop + 3);
    for (let i = 0; i < W; i++) for (let j = t.torBot; j <= t.pierTop + 4; j++) if (g.rampa(i, j) === T && g.rampa(i, j + 1) !== T) pon(g, T, 1, [i, j]);
    cinturon(g, t, t.torBot - 3, CUERO, O, 2);
    capa().rect(t.wL + 1, t.torBot - 1, 4, 4).pintar(g, CUERO, { relieve: 1, separar: true });
    pon(g, O, 3, [t.wL + 2, t.torBot]); pon(g, CUERO, 4, [t.wL + 1, t.torBot - 1]);
    for (const j of [t.torTop + 3, t.torTop + 6]) { pon(g, O, 4, [t.torL + 6, j]); pon(g, O, 2, [t.torL + 7, j]); }
    /* Destornillador y lápiz en el bolsillo del pecho. */
    const bp = t.torL + 9;
    for (const [i, r, alt] of [[bp + 1, Pl, 5]]) capa().rect(i, t.torTop + 1 - alt + 4, 1, alt).pintar(g, r, { relieve: 1, min: 2, separar: true });
    capa().rect(bp - 1, t.torTop + 4, 5, 4).pintar(g, T, { relieve: 1, min: 1, max: 3, separar: true });
    surco(g, T, 4, bp - 1, t.torTop + 4, bp + 3, t.torTop + 4, T);
    /* Correa de la mochila. */
    capa().linea(t.torR - 3, t.torTop, t.torR - 6, t.torBot - 4, 2).pintar(g, CUERO, { relieve: 1, separar: true });
    pon(g, O, 4, [t.torR - 5, t.torTop + 5]);
    /* Cabeza con narizota y pelo rizado detrás. */
    const rizos = [[x + 4, t.cabY, 6.6], [x + 9, t.cabY + 4, 2.8], [x + 7, t.cabY + 7, 2.6], [x + 10, t.cabY - 1, 2.8], [x + 8, t.cabY - 5, 2.8], [x + 3, t.cabY - 7, 2.8], [x - 2, t.cabY - 8, 2.6], [x - 7, t.cabY - 5, 2.4], [x + 4, t.cabY + 6, 2.4]];
    const lim0 = capa().rect(0, 0, W, H);
    todo((i, j) => { if (i < x + 2 && j > t.cabY - 4) lim0.off(i, j); });
    cabeza(g, t, P, { nariz: 1 });
    follaje(g, Pe, rizos, { recorte: lim0, max: 4 });
    /* Narizota redonda y colorada. */
    const nx = t.narizX - 1;
    capa().ell(nx + 0.6, y + 2.6, 2.6, 2.4).pintar(g, P, { relieve: 1.8, separar: true });
    pon(g, NARIZ, 2, [nx - 1, y + 3], [nx, y + 4]); pon(g, NARIZ, 3, [nx - 1, y + 2]); g.set(nx, y + 1, BRILLO, P);
    pon(g, P, 1, [nx + 1, y + 5], [nx + 2, y + 4]);
    /* Oreja de punta. */
    capa().poly([[x + 2.5, y + 3.5], [x + 3, y - 0.5], [x + 9, y - 4], [x + 6, y + 3]]).pintar(g, P, { relieve: 1.6, separar: 2 });
    surco(g, P, 1, x + 3, y + 2, x + 6, y, P); surco(g, P, 3, x + 4, y, x + 7, y - 2, P);
    cara(g, t, P, { iris: "#3d6fa8", ceja: Pe, sinBoca: true });
    /* Bigote blanco y sonrisa. */
    capa().poly([[x - 9, y + 5], [x - 3, y + 4.6], [x - 1, y + 7], [x - 4, y + 6.4], [x - 7, y + 7.4], [x - 10, y + 6.6]]).pintar(g, Pe, { relieve: 1.2, min: 2, separar: 2 });
    pon(g, Pe, 4, [x - 7, y + 5], [x - 6, y + 5]);
    pon(g, P, 0, [x - 6, y + 8], [x - 5, y + 8]); pon(g, P, 1, [x - 7, y + 8], [x - 4, y + 7]); pon(g, P, 3, [x - 5, y + 9]);
    /* Gafas de latón en la frente con cristales azules. */
    for (let i = x - 9; i <= x + 4; i++) ponSi(g, [Pe, P], CUERO2, 2, [i, y - 5]);
    for (const ex of [x - 6, x - 1.5]) capa().ell(ex, y - 5, 2.2, 2).pintar(g, O, { relieve: 1, min: 2, separar: true });
    for (const ex of [x - 6, x - 1]) { pon(g, R.mar, 3, [ex - 1, y - 5], [ex, y - 5]); pon(g, R.mar, 2, [ex, y - 4], [ex - 1, y - 4]); g.set(ex - 1, y - 6, BRILLO, R.mar); pon(g, R.mar, 4, [ex, y - 6]); }
    /* Brazo de delante con el matraz. */
    const [mx, my] = [t.torL - 4, t.torTop + 5];
    brazo(g, [[t.torL + 3, t.torTop + 2], [t.torL, t.torTop + 6], [mx + 1, my]], T, P, { grueso: 4, fino: 3.5, sinMano: true });
    const mat = capa().ell(mx - 3, my - 1, 3.6, 3.2).rect(mx - 4, my - 8, 3, 6);
    mat.pintar(g, VIDRIO, { relieve: 1.2, min: 1, separar: true });
    const liq = capa().ell(mx - 3, my - 0.4, 2.8, 2.4);
    todo((i, j) => { if (j < my - 1) liq.off(i, j); });
    liq.pintar(g, LIMO, { relieve: 1.4, min: 2 });
    pon(g, LIMO, 4, [mx - 5, my - 1], [mx - 4, my - 1]); pon(g, LIMO, 1, [mx - 1, my + 1], [mx - 2, my + 2]);
    pon(g, LIMO, 4, [mx - 3, my]); pon(g, LIMO, 3, [mx - 2, my - 3]);
    pon(g, VIDRIO, 4, [mx - 5, my - 3], [mx - 6, my - 2], [mx - 4, my - 7]); g.set(mx - 5, my - 3, BRILLO, VIDRIO);
    capa().rect(mx - 4, my - 9, 3, 2).pintar(g, MADERA, { relieve: 1, min: 2 });
    capa().ell(mx + 0.6, my, 2, 2).pintar(g, P, { relieve: 1.2, separar: true });
    pon(g, P, 4, [mx, my - 1]); pon(g, P, 1, [mx + 1, my + 1]);
    bordeLuz(g, T, 3);
    contornoSel(g);
    /* Burbujas que suben del matraz. */
    for (const [i, j, k] of [[mx - 3, my - 11, 3], [mx - 4, my - 13, 4], [mx - 2, my - 15, 2], [mx - 5, my - 17, 3], [mx - 3, my - 20, 2]]) mota(g, LIMO, k, i, j);
    destello(g, LIMO, mx - 4, my - 13, false, true);
    return g;
  }

  /* Fantasma de un rey: corona espectral con gemas, barba larga casi blanca bien separada de la túnica
     añil, manto azul con cuello de armiño lavanda, cuencas vacías con dos puntos de luz y una cola de
     niebla que se deshace en tramado; flota sobre un resplandor en el suelo. */
  function fantasma() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const Tu = TUNICA_E, Ma = MANTO_E, Ba = BARBA_E, Ca = CARA_E, Ar = ARMINO_E, Co = CORONA_E, A = ALMA;
    const sube = 2;
    t.cabY -= sube; t.ojoY -= sube; t.bocaY -= sube; t.torTop -= sube; t.torBot -= sube;
    const x = t.cabX, y = t.ojoY;
    /* Manto real detrás, que ondea hacia atrás. */
    const manto = capa().poly([[t.torL + 3, t.torTop], [t.torR + 2, t.torTop], [t.torR + 11, t.torBot + 6], [t.torR + 8, t.torBot + 9], [t.torR + 5, t.torBot + 7], [t.torR + 2, t.torBot + 9], [t.torR, t.torBot + 4]]);
    manto.pintar(g, Ma, { relieve: 4, max: 2 });
    pliegue(g, Ma, t.torR + 4, t.torTop + 7, t.torR + 7, t.torBot + 6, 0);
    pliegue(g, Ma, t.torR + 1, t.torTop + 10, t.torR + 2, t.torBot + 6, 0);
    for (let i = 0; i < W; i++) for (let j = t.torBot; j < H; j++) if (manto.tiene(i, j) && !manto.tiene(i, j + 1)) pon(g, Ar, 2, [i, j]), manto.tiene(i, j - 1) && pon(g, Ar, 3, [i, j - 1]);
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 2, t.torTop + 10], [t.torR + 1, t.torTop + 16]], Tu, Ca, { atras: true, largo: true, grueso: 6, fino: 5 });
    /* Túnica añil que se estrecha en una cola curvada hacia atrás. */
    const tun = torso(t).unir(capa().poly([[t.wL - 1, t.torBot - 3], [t.wR + 1, t.torBot - 3], [t.wR + 2, t.torBot + 4], [t.cx + 4, t.torBot + 9], [t.wL, t.torBot + 4]]));
    tun.curva(t.cx, t.torBot + 4, t.cx + 1, t.suelo - 4, t.torR + 12, t.suelo - 6, 10, 1.2);
    tun.pintar(g, Tu, { relieve: 5, min: 1 });
    volumen(g, Tu, t.wL - 2, t.wR + 4, t.torTop, t.suelo, 0.9, 3);
    pliegue(g, Tu, t.wL + 5, t.torTop + 9, t.wL + 4, t.torBot + 6, 1);
    pliegue(g, Tu, t.cx + 4, t.torBot - 2, t.cx + 5, t.torBot + 7, 1);
    pliegue(g, Tu, t.cx, t.torBot + 4, t.cx + 6, t.suelo - 7, 0);
    /* Cinturón con gema de alma. */
    for (let i = t.wL - 2; i <= t.wR + 2; i++) { ponSi(g, Tu, Co, 2, [i, t.torBot - 3]); ponSi(g, Tu, Co, 1, [i, t.torBot - 2]); }
    capa().ell(t.cx - 2, t.torBot - 2.6, 1.6, 1.4).pintar(g, A, { relieve: 1, min: 2 });
    pon(g, A, 4, [t.cx - 3, t.torBot - 3]); g.set(t.cx - 3, t.torBot - 3, BRILLO, A);
    /* Cuello de armiño lavanda sobre los hombros, con sus motas oscuras. */
    const armino = capa().ell(t.cx + 1, t.torTop + 1.5, 9.4, 3.2);
    armino.pintar(g, Ar, { relieve: 2.4, min: 2, separar: true });
    for (const [i, j] of [[t.cx + 5, t.torTop + 1], [t.cx + 8, t.torTop + 2], [t.cx + 7, t.torTop - 1], [t.cx - 6, t.torTop + 2], [t.cx + 3, t.torTop + 3], [t.cx - 3, t.torTop + 3]]) { ponSi(g, Ar, Tu, 0, [i, j]); ponSi(g, Ar, Tu, 1, [i, j + 1]); }
    /* Orla de armiño bajando por delante de la túnica. */
    const orla = capa().poly([[t.wL - 1, t.torTop + 3], [t.wL + 2, t.torTop + 3], [t.wL + 1, t.torBot + 4], [t.wL - 2, t.torBot + 4]]).recortar(tun);
    orla.pintar(g, Ar, { relieve: 1.4, min: 2, separar: true });
    for (let j = t.torTop + 6; j <= t.torBot + 3; j += 4) ponSi(g, Ar, Tu, 0, [t.wL, j]);
    /* Melena blanca detrás. */
    const pelo = capa().ell(x + 1.6, t.cabY, t.cabRx + 1.2, t.cabRy + 0.6).poly([[x + 3, t.cabY], [x + 10, t.cabY + 1], [x + 9, t.cabY + 9], [x + 3, t.cabY + 8]]);
    todo((i, j) => { if (i < x + 3 || j < t.cabY - 3) pelo.off(i, j); });
    pelo.pintar(g, Ba, { relieve: 2.4, min: 1, separar: 2 });
    for (let k = 0; k < 4; k++) surco(g, Ba, 1, x + 4 + k * 1.6, t.cabY - 1, x + 3 + k * 1.8, t.cabY + 8, Ba);
    /* Cabeza azul pálida. */
    const cab = capaCabeza(t, 1);
    cab.pintar(g, Ca, { relieve: 5, min: 1, luz: LUZ_CARA });
    pon(g, Ca, 4, [x - 4, t.cabY - 5], [x - 3, t.cabY - 5], [x - 5, t.cabY - 4], [t.narizX, y + 1]);
    /* Cuencas vacías con un punto de luz, y cejas pobladas. */
    for (const [ex, an] of [[t.ojo2, 2], [t.ojo1, 3]]) {
      for (let k = 0; k < an; k++) pon(g, Tu, 0, [ex + k, y - 1], [ex + k, y], [ex + k, y + 1], [ex + k, y + 2]);
      pon(g, Tu, 1, [ex + an - 1, y + 2]);
      pon(g, A, 4, [ex, y]); pon(g, A, 2, [ex + 1, y]); pon(g, A, 1, [ex, y + 1]);
      g.set(ex, y, BRILLO, A);
    }
    const cejas = capa().rect(t.ojo2 - 1, y - 3, 3, 2).rect(t.ojo1, y - 3, 4, 2).on(t.ojo2 - 2, y - 2);
    cejas.pintar(g, Ba, { relieve: 1, min: 2, separar: 2 });
    pon(g, Ba, 4, [t.ojo2 - 1, y - 3], [t.ojo1, y - 3], [t.ojo1 + 1, y - 3]);
    /* Barba larga casi blanca, con mechones, y el bigote encima. Lleva una línea oscura que la
       separa de la túnica añil. */
    const barba = capa().poly([[x - 9, y + 3], [x + 4, y + 2], [x + 4, t.torTop + 4], [x + 2, t.torTop + 11], [x - 1, t.torTop + 17], [x - 4, t.torTop + 11], [x - 7, t.torTop + 7], [x - 10, t.torTop + 2]]);
    barba.pintar(g, Ba, { relieve: 3, min: 1, separar: 1 });
    sombra(g, barba, -2, Tu);
    sombra(g, barba, -1, Ar);
    for (const [a0, b0, a1, b1] of [[x - 7, y + 6, x - 5, t.torTop + 8], [x - 3, y + 6, x - 2, t.torTop + 14], [x + 1, y + 6, x, t.torTop + 10], [x - 5, y + 8, x - 3, t.torTop + 11]]) { surco(g, Ba, 1, a0, b0, a1, b1, Ba); surco(g, Ba, 4, a0 - 1, b0, a1 - 1, b1 - 1, Ba); }
    const big = capa().poly([[x - 10, y + 3], [x - 2, y + 3], [x + 1, y + 5.4], [x - 5, y + 4.8], [x - 11, y + 6]]);
    big.pintar(g, Ba, { relieve: 1.2, min: 2, separar: 2 });
    pon(g, Ba, 4, [x - 7, y + 3], [x - 6, y + 3], [x - 5, y + 3]);
    pon(g, Tu, 0, [x - 6, y + 6], [x - 5, y + 6]);
    /* Corona espectral de puntas con gemas de alma. */
    const cor = capa().rect(x - 6, t.cabY - 8, 14, 4);
    for (const i of [x - 6, x, x + 6]) cor.poly([[i - 2, t.cabY - 7], [i + 0.5, t.cabY - 11.6], [i + 3, t.cabY - 7]]);
    cor.pintar(g, Co, { relieve: 1.6, min: 2, separar: true });
    surco(g, Co, 1, x - 6, t.cabY - 5, x + 7, t.cabY - 5, Co);
    surco(g, Co, 4, x - 6, t.cabY - 8, x + 2, t.cabY - 8, Co);
    for (const i of [x - 6, x, x + 6]) { mota(g, A, 4, i, t.cabY - 12); pon(g, Co, 4, [i, t.cabY - 11]); }
    for (const [i, c] of [[x - 3, A], [x + 3, A], [x, ROSA]]) { pon(g, c, 4, [i, t.cabY - 7]); pon(g, c, 2, [i, t.cabY - 6]); pon(g, c, 3, [i + 1, t.cabY - 7]); }
    /* Brazo de delante extendido, con la manga ancha y la mano que llama. */
    const [mx, my] = [t.torL - 6, t.torTop + 11];
    const manga = capa().poly([[t.torL + 4, t.torTop + 2], [t.torL, t.torTop + 2], [mx + 1, my - 3], [mx + 2, my + 5], [t.torL + 5, t.torTop + 11]]);
    sombra(g, manga, -2);
    manga.pintar(g, Tu, { relieve: 3, separar: true });
    surco(g, Tu, 4, t.torL, t.torTop + 3, mx + 2, my - 2, Tu);
    capa().linea(mx + 1, my - 3, mx + 2, my + 5, 2).pintar(g, Ar, { relieve: 1, min: 2, max: 3 });
    const mano = capa().ell(mx - 0.6, my + 1, 2, 1.8).linea(mx - 1, my, mx - 4, my - 1.6, 1).linea(mx - 1, my + 1.6, mx - 4, my + 1.6, 1).linea(mx - 1, my + 2.6, mx - 3, my + 3.6, 1);
    mano.pintar(g, Ca, { relieve: 1, min: 2, separar: true });
    pon(g, Ca, 4, [mx - 4, my - 2], [mx - 1, my - 1]);
    contornoSel(g, { color: "#0a0c26" });
    /* Translucidez: la cola se deshace en tramado y deja ver el fondo. */
    todo((i, j) => {
      if (!g.get(i, j) || j < t.torBot + 6) return;
      const f = (j - (t.torBot + 6)) / 12;
      if (umbral(i, j) < f * f * 1.1) g.quitar(i, j);
    });
    /* Resplandor en el suelo bajo el fantasma y motas de luz. */
    for (let i = t.cx - 11; i <= t.cx + 11; i++) if (umbral(i, 62) < 0.95 - Math.abs(i - t.cx) / 12) mota(g, A, Math.abs(i - t.cx) < 5 ? 2 : 1, i, 62);
    for (let i = t.cx - 6; i <= t.cx + 6; i++) if (umbral(i, 61) < 0.5) mota(g, A, 1, i, 61);
    for (const [i, j, k] of [[t.torR + 12, t.torTop + 2, 3], [t.torL - 10, t.torTop - 5, 2], [t.torR + 6, t.cabY - 10, 3], [mx - 6, my + 9, 2], [t.torL - 3, t.suelo - 6, 3], [t.torR + 14, t.torBot + 1, 2]]) mota(g, A, k, i, j);
    destello(g, A, t.torL - 9, t.torTop + 2, false, true);
    return g;
  }

  /* Herrero (Thrain): enano ancho, calvo de coronilla con melena gris, cejas pobladas, barbaza con dos
     trenzas y anillas de bronce, camisa terracota, delantal de cuero con pespunte y tachuelas, unas
     tenazas en el bolsillo, muñequera de cuero y el martillo en alto con el filo al rojo echando chispas. */
  function herrero() {
    const g = new Rejilla(W, H), t = plantilla("ancho");
    const P = R.piel.oliva, Pe = R.pelo.canoso, T = R.tela.terracota, Hi = HIERRO, F = BRASA, D = CUERO2;
    const x = t.cabX, y = t.ojoY;
    brazo(g, [[t.torR - 3, t.torTop + 3], [t.torR + 2, t.torTop + 7], [t.torR + 1, t.torTop + 13]], T, P, { atras: true, grueso: 6, fino: 5 });
    capa().linea(t.torR + 1.6, t.torTop + 9, t.torR + 1.2, t.torTop + 11, 6).pintar(g, CUERO, { relieve: 1, max: 2 });
    piernas(g, t, R.tela.negro, CUERO, { grosor: 6, alto: 6 });
    torso(t).pintar(g, T, { relieve: 5 });
    volumen(g, T, t.torL, t.torR, t.torTop, t.torBot, 0.8);
    /* Delantal de cuero con pespunte claro, tachuelas y un bolsillo con tenazas. */
    const del = capa().poly([[t.torL + 2, t.torTop + 4], [t.torR - 3, t.torTop + 4], [t.torR - 1, t.pierTop + 4], [t.torL - 1, t.pierTop + 4]]);
    del.pintar(g, D, { relieve: 3.5, separar: true });
    volumen(g, D, t.torL, t.torR, t.torTop + 4, t.pierTop + 4, 0.8);
    todo((i, j) => { if (del.tiene(i, j) && j > t.torTop + 5 && j < t.pierTop + 3) { const b = !del.tiene(i - 2, j) || !del.tiene(i + 2, j); if (b && (!del.tiene(i - 1, j) ? false : !del.tiene(i + 1, j) ? false : true) && j % 2 === 0) pon(g, D, 4, [i, j]); } });
    for (let i = t.torL + 1; i <= t.torR - 2; i++) if (del.tiene(i, t.pierTop + 2) && i % 2 === 0) pon(g, D, 4, [i, t.pierTop + 2]);
    for (let j = t.torTop + 6; j <= t.pierTop + 1; j += 3) { pon(g, Hi, 4, [t.torR - 5, j]); pon(g, Hi, 1, [t.torR - 4, j + 1]); }
    /* Chamuscones en el cuero. */
    for (const [i, j] of [[t.torL + 5, t.torBot + 1], [t.torL + 6, t.torBot + 2], [t.cx - 1, t.torTop + 12], [t.torL + 4, t.torTop + 9]]) ponSi(g, D, D, 0, [i, j]);
    /* Tirantes del delantal. */
    for (const xx of [t.torL + 4, t.torR - 5]) capa().linea(xx, t.torTop - 1, xx + (xx < t.cx ? -1 : 1), t.torTop + 4, 2).pintar(g, D, { relieve: 1, separar: true });
    /* Bolsillo con tenazas. */
    const bx = t.cx + 2, by = t.torBot - 1;
    capa().rect(bx - 1, by - 6, 1, 6).rect(bx + 2, by - 6, 1, 6).rect(bx - 1, by - 7, 4, 1).pintar(g, Hi, { relieve: 1, min: 2, separar: true });
    pon(g, Hi, 4, [bx - 1, by - 7], [bx - 1, by - 5]);
    capa().rect(bx - 3, by, 8, 5).pintar(g, D, { relieve: 1.2, max: 3, separar: true });
    surco(g, D, 4, bx - 3, by, bx + 4, by, D); surco(g, D, 1, bx - 3, by + 1, bx + 4, by + 1, D);
    cinturon(g, t, t.torBot - 4, R.tela.negro, Hi, 3);
    /* Cabeza: coronilla calva y brillante, melena gris por detrás. */
    cabeza(g, t, P, { nariz: 2 });
    const pelo = capa().ell(x + 1.6, t.cabY + 0.6, t.cabRx + 1.2, t.cabRy + 0.6).ell(x + 8, t.cabY + 5, 3, 3.6);
    todo((i, j) => { if (i < x + 3 || j < t.cabY - 5) pelo.off(i, j); });
    pelo.pintar(g, Pe, { relieve: 2.6, min: 2, separar: true });
    for (let k = 0; k < 4; k++) surco(g, Pe, 1, x + 4 + k * 1.7, t.cabY - 3, x + 4 + k * 2, t.cabY + 7, Pe);
    oreja(g, t, P);
    pon(g, P, 4, [x - 3, t.cabY - 6], [x - 2, t.cabY - 6], [x - 4, t.cabY - 5], [x - 1, t.cabY - 7], [x, t.cabY - 7]);
    g.set(x - 3, t.cabY - 5, BRILLO, P);
    cara(g, t, P, { iris: "#5a3a22", sinBoca: true, sinCejas: true });
    /* Hollín en la frente y la mejilla. */
    for (const [i, j] of [[x - 6, t.cabY - 3], [x - 5, t.cabY - 3], [x - 4, t.cabY - 4], [x + 1, y + 3], [x + 2, y + 4]]) ponSi(g, P, P, 1, [i, j]);
    /* Cejas pobladas que sobresalen hacia delante. */
    capa().rect(t.ojo2 - 2, y - 3, 4, 2).rect(t.ojo1, y - 3, 5, 2).on(t.ojo2 - 3, y - 2).pintar(g, Pe, { relieve: 1, min: 2, separar: 2 });
    pon(g, Pe, 4, [t.ojo2 - 2, y - 3], [t.ojo1, y - 3], [t.ojo1 + 1, y - 3]);
    /* Barbaza con dos trenzas y bigote. */
    const barba = capa().poly([[x - 9, y + 3], [x + 5, y + 1], [x + 5, y + 6], [x + 3, t.torTop + 7], [x - 1, t.torTop + 10], [x - 5, t.torTop + 7], [x - 10, y + 6]]);
    barba.pintar(g, Pe, { relieve: 3.4, separar: 2 });
    for (const [a0, b0, a1, b1] of [[x - 7, y + 6, x - 5, t.torTop + 5], [x - 3, y + 6, x - 2, t.torTop + 8], [x + 1, y + 5, x + 1, t.torTop + 6], [x + 3, y + 4, x + 3, t.torTop + 4]]) { surco(g, Pe, 1, a0, b0, a1, b1, Pe); surco(g, Pe, 4, a0 - 1, b0, a1 - 1, b1 - 1, Pe); }
    sombra(g, barba, -2, [T, D]);
    /* Dos trenzas que cuelgan con anillas de bronce. */
    for (const [i0, l] of [[x - 5, 9], [x, 8]]) {
      const tr = capa().rect(i0, t.torTop + 6, 3, l);
      tr.pintar(g, Pe, { relieve: 1.2, separar: 2 });
      for (let j = t.torTop + 7; j < t.torTop + 6 + l; j += 2) { pon(g, Pe, 1, [i0, j], [i0 + 2, j + 1]); pon(g, Pe, 4, [i0 + 1, j - 1]); }
      const ry = t.torTop + 6 + l - 4;
      capa().rect(i0 - 0.5, ry, 4, 2).pintar(g, ORO, { relieve: 1, min: 2 });
      pon(g, ORO, 4, [i0, ry]); g.set(i0, ry, BRILLO, ORO); pon(g, ORO, 1, [i0 + 3, ry + 1]);
      pon(g, Pe, 3, [i0 + 1, t.torTop + 6 + l]);
    }
    capa().poly([[x - 10, y + 3.5], [x - 1, y + 3], [x + 2, y + 5.4], [x - 5, y + 5], [x - 11, y + 6.6]]).pintar(g, Pe, { relieve: 1.2, min: 3, separar: 2 });
    pon(g, Pe, 4, [x - 7, y + 3], [x - 6, y + 3]);
    pon(g, NARIZ, 3, [t.narizX - 1, y + 2], [t.narizX, y + 2]); pon(g, NARIZ, 2, [t.narizX, y + 3]); g.set(t.narizX - 1, y + 1, P[4], P);
    /* Martillo en alto, lejos de la cabeza. */
    const [mx, my] = [t.torL - 5, t.torTop - 2];
    capa().linea(mx + 1, my + 5, mx - 1, my - 12, 3).pintar(g, MADERA, { relieve: 1, separar: true });
    surco(g, MADERA, 4, mx, my + 3, mx - 2, my - 11, MADERA);
    const ch = my - 19;
    const cabM = capa().rect(mx - 8, ch, 15, 7).off(mx - 8, ch).off(mx + 6, ch).off(mx - 8, ch + 6).off(mx + 6, ch + 6);
    cabM.pintar(g, Hi, { relieve: 2.4, separar: true });
    surco(g, Hi, 4, mx - 7, ch, mx + 5, ch, Hi);
    surco(g, Hi, 1, mx - 7, ch + 6, mx + 5, ch + 6, Hi);
    surco(g, Hi, 0, mx - 2, ch + 1, mx - 2, ch + 5, Hi); surco(g, Hi, 3, mx - 3, ch + 1, mx - 3, ch + 5, Hi);
    g.set(mx - 6, ch + 1, BRILLO, Hi);
    /* El filo de la boca, al rojo. */
    for (let j = ch + 1; j <= ch + 5; j++) { pon(g, F, j === ch + 3 ? 4 : 3, [mx - 8, j]); pon(g, F, 1, [mx - 7, j]); }
    pon(g, F, 2, [mx + 6, ch + 3]);
    brazo(g, [[t.torL + 4, t.torTop + 3], [t.torL - 2, t.torTop + 5], [mx, my + 1]], T, P, { grueso: 6, fino: 5 });
    capa().linea(mx + 0.5, my + 3, mx + 2, my + 7, 6).pintar(g, CUERO, { relieve: 1.2, separar: true });
    for (const j of [my + 4, my + 6]) ponSi(g, CUERO, Hi, 3, [mx + 1, j]);
    capa().ell(mx, my, 2.6, 2.6).pintar(g, P, { relieve: 1.4, separar: true });
    pon(g, P, 4, [mx - 1, my - 1]); pon(g, P, 1, [mx + 1, my + 1], [mx, my + 1]);
    bordeLuz(g, R.tela.negro, 2);
    contornoSel(g);
    for (const [i, j, k] of [[mx - 12, ch + 1, 4], [mx - 12, ch + 5, 3], [mx - 14, ch + 3, 2], [mx - 10, ch - 3, 3], [mx - 3, ch - 3, 2], [mx - 14, ch - 2, 1], [mx + 9, ch - 1, 3], [mx - 11, ch + 8, 2]]) mota(g, F, k, i, j);
    destello(g, F, mx - 12, ch + 1, true, true);
    return g;
  }

  /* Mercader planar: tiefling de piel azul con cuernos que salen del turbante, ojos dorados, perilla
     negra y aro de oro, túnica granate larga con ribetes y bordados de oro, fajín ocre anudado, babuchas
     doradas, cola de punta de flecha y una bolsa violeta que chisporrotea de magia. */
  function planar() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const P = R.piel.azul, T = R.tela.granate, O = ORO, V = R.tela.violeta, Cu = CUERNO, Oc = R.tela.ocre, Mg = R.magia;
    const x = t.cabX, y = t.ojoY;
    /* Cola detrás, con la punta de flecha. */
    capa().curva(t.torR - 1, t.torBot - 2, t.torR + 13, t.torBot + 9, t.torR + 10, t.torTop + 8, 3, 1.8).pintar(g, P, { relieve: 1.4, max: 3 });
    capa().poly([[t.torR + 7, t.torTop + 7], [t.torR + 10, t.torTop + 1], [t.torR + 14, t.torTop + 7], [t.torR + 10, t.torTop + 9]]).pintar(g, P, { relieve: 1.2, min: 2, max: 3 });
    pon(g, P, 4, [t.torR + 10, t.torTop + 2], [t.torR + 9, t.torTop + 4]);
    brazo(g, [[t.torR - 3, t.torTop + 3], [t.torR + 1, t.torTop + 10], [t.torR + 1, t.torTop + 16]], T, P, { atras: true, largo: true, grueso: 5, fino: 4 });
    /* Babuchas doradas con la punta vuelta. */
    for (const [i, at] of [[t.cx - 9, false], [t.cx + 1, true]]) {
      capa().rect(i, t.suelo - 2, 7, 3).on(i - 1, t.suelo - 1).on(i - 1, t.suelo - 3).on(i - 2, t.suelo - 3).pintar(g, O, { relieve: 1.2, max: at ? 3 : 4, separar: true });
      pon(g, O, 1, [i + 2, t.suelo], [i + 3, t.suelo], [i + 4, t.suelo]);
    }
    /* Túnica larga con ribetes y bordados. */
    const tun = torso(t).unir(falda(t, t.suelo - t.pierTop - 3, 4, 5));
    tun.pintar(g, T, { relieve: 5 });
    volumen(g, T, t.wL - 5, t.wR + 6, t.torTop, t.suelo, 1);
    for (const [a, b] of [[t.cx + 5, t.cx + 7], [t.cx + 9, t.cx + 11], [t.wL + 1, t.wL - 2]]) pliegue(g, T, a, t.pierTop + 1, b, t.suelo - 4);
    for (let i = 0; i < W; i++) for (let j = t.torBot; j <= t.suelo; j++) if (g.rampa(i, j) === T && g.rampa(i, j + 1) !== T) { pon(g, O, 2, [i, j]); if (es(g, i, j - 1, T)) pon(g, O, i % 2 ? 3 : 4, [i, j - 1]); }
    /* Tira bordada que baja por delante. */
    for (let j = t.torBot; j <= t.suelo - 3; j++) { ponSi(g, T, O, j % 3 ? 2 : 4, [t.wL + 3, j]); ponSi(g, T, O, 1, [t.wL + 4, j]); }
    for (let i = t.torL + 2; i <= t.torR - 2; i++) ponSi(g, T, O, i % 2 ? 3 : 4, [i, t.torTop]);
    for (const [i, j] of [[t.wL, t.suelo - 8], [t.cx + 2, t.suelo - 7], [t.cx + 7, t.suelo - 9]]) { ponSi(g, T, O, 2, [i, j], [i + 1, j + 1], [i - 1, j + 1], [i, j + 2]); ponSi(g, T, O, 4, [i, j + 1]); }
    /* Fajín ocre anudado, con las puntas colgando. */
    const faj = capa().rect(t.wL - 2, t.torBot - 5, t.wR - t.wL + 5, 4);
    faj.pintar(g, Oc, { relieve: 1.6, separar: true });
    for (let i = t.wL - 2; i <= t.wR + 2; i++) if (i % 3 === 0) ponSi(g, Oc, Oc, 1, [i, t.torBot - 3], [i + 1, t.torBot - 2]);
    capa().ell(t.wL, t.torBot - 3, 2, 2).pintar(g, Oc, { relieve: 1, separar: true });
    capa().linea(t.wL, t.torBot - 1, t.wL - 2, t.torBot + 6, 2).linea(t.wL + 1, t.torBot - 1, t.wL + 2, t.torBot + 5, 2).pintar(g, Oc, { relieve: 1, max: 3, separar: true });
    for (const [i, j] of [[t.wL - 2, t.torBot + 6], [t.wL - 3, t.torBot + 6], [t.wL + 2, t.torBot + 5], [t.wL + 3, t.torBot + 5]]) pon(g, O, 3, [i, j]);
    /* Cabeza, perilla negra y aro de oro. */
    cabeza(g, t, P);
    oreja(g, t, P, 3);
    cara(g, t, P, { iris: R.fuego[2], iris2: R.fuego[3], brillo: R.bronce[4], blanco: R.bronce[3], ceja: NEGRO, mejilla: false });
    capa().poly([[x - 8, t.bocaY + 1], [x - 4, t.bocaY + 1], [x - 4, t.bocaY + 4], [x - 7, t.bocaY + 6]]).pintar(g, NEGRO, { relieve: 1, min: 2, max: 3, separar: 2 });
    pon(g, NEGRO, 4, [x - 7, t.bocaY + 2]);
    pon(g, NEGRO, 2, [x - 8, t.bocaY - 1], [x - 7, t.bocaY - 1], [x - 4, t.bocaY - 1], [x - 3, t.bocaY]);
    pon(g, HUESO, 4, [x - 5, t.bocaY]);
    capa().ell(x + 3.6, y + 5.4, 1.4, 1.6).pintar(g, O, { relieve: 1, min: 2 });
    g.set(x + 3, y + 4, BRILLO, O);
    /* Cuernos: salen por detrás del turbante y se curvan hacia atrás y arriba, con anillos. */
    const c1 = capa().curva(x - 3, t.cabY - 6, x - 3, t.cabY - 12, x + 3, t.cabY - 13.6, 4.4, 1.4);
    c1.pintar(g, Cu, { relieve: 2, min: 1, max: 3 });
    const c2 = capa().curva(x + 5, t.cabY - 5, x + 10, t.cabY - 12, x + 16, t.cabY - 10.6, 5.6, 1.6);
    c2.pintar(g, Cu, { relieve: 2.2, min: 1, separar: true });
    for (const [a0, b0, a1, b1] of [[x + 7, t.cabY - 11, x + 9, t.cabY - 8], [x + 10, t.cabY - 13, x + 11, t.cabY - 10], [x + 13, t.cabY - 14, x + 13, t.cabY - 11], [x - 4, t.cabY - 11, x - 1, t.cabY - 11], [x - 2, t.cabY - 14, x, t.cabY - 13]]) { surco(g, Cu, 1, a0, b0, a1, b1, Cu); surco(g, Cu, 4, a0 - 1, b0, a1 - 1, b1, Cu); }
    /* Turbante blanco enrollado con gema de magia y su engarce de oro. */
    const turb = capa().ell(x + 0.6, t.cabY - 3.4, t.cabRx + 1, 4.4).ell(x + 1.6, t.cabY - 7.4, 5.4, 3);
    turb.quitarRect(0, y - 1, W, H);
    turb.pintar(g, R.tela.blanco, { relieve: 3.4, separar: true });
    for (let k = 0; k < 4; k++) surco(g, R.tela.blanco, 1, x - 8 + k * 3, t.cabY - 2, x - 4 + k * 3.4, t.cabY - 9, R.tela.blanco);
    for (let k = 0; k < 4; k++) surco(g, R.tela.blanco, 4, x - 9 + k * 3, t.cabY - 2, x - 5 + k * 3.4, t.cabY - 9, R.tela.blanco);
    capa().ell(x - 4, t.cabY - 4, 2, 2.2).pintar(g, O, { relieve: 1, min: 2, separar: true });
    capa().ell(x - 4, t.cabY - 4, 1.2, 1.4).pintar(g, Mg, { relieve: 1, min: 2 });
    pon(g, Mg, 4, [x - 5, t.cabY - 5]); g.set(x - 5, t.cabY - 5, BRILLO, Mg);
    capa().ell(x + 6, t.cabY - 1, 1.2, 1).linea(x + 6, t.cabY, x + 8, t.cabY + 5, 1.6).pintar(g, R.tela.blanco, { relieve: 1, min: 2, separar: true });
    /* Brazo de delante con la bolsa violeta. */
    const [mx, my] = [t.torL - 3, t.torTop + 11];
    brazo(g, [[t.torL + 4, t.torTop + 3], [t.torL + 1, t.torTop + 9], [mx + 1, my]], T, P, { largo: true, sinMano: true, grueso: 5, fino: 4 });
    capa().linea(t.torL, t.torTop + 9, t.torL - 2, t.torTop + 11, 3).pintar(g, O, { relieve: 1, min: 2, separar: true });
    const bolsa = capa().ell(mx - 3, my + 5, 4, 4.4).rect(mx - 4, my, 3, 2);
    bolsa.pintar(g, V, { relieve: 3, separar: true });
    surco(g, V, 1, mx - 5, my + 3, mx - 5, my + 7, V); surco(g, V, 1, mx - 2, my + 3, mx - 1, my + 8, V);
    for (let i = mx - 5; i <= mx - 1; i++) pon(g, O, i === mx - 5 ? 4 : 2, [i, my + 1]);
    pon(g, Mg, 4, [mx - 4, my + 5]); pon(g, Mg, 3, [mx - 3, my + 6], [mx - 5, my + 6], [mx - 4, my + 4]);
    pon(g, Mg, 3, [mx - 3, my - 1]); pon(g, Mg, 4, [mx - 4, my - 1]);
    capa().ell(mx + 0.6, my, 2, 2).pintar(g, P, { relieve: 1.2, separar: true });
    pon(g, P, 4, [mx, my - 1]); pon(g, P, 1, [mx + 1, my + 1]);
    bordeLuz(g, P, 3, (i, j) => j < t.torTop);
    contornoSel(g);
    destello(g, Mg, mx - 9, my + 1, true, true);
    for (const [i, j, k] of [[mx - 8, my + 9, 4], [mx - 2, my - 4, 3], [mx - 10, my - 4, 2], [mx - 6, my - 7, 3], [mx - 11, my + 6, 2]]) mota(g, Mg, k, i, j);
    return g;
  }

  window.PNJ_64 = window.PNJ_64 || {};
  Object.assign(window.PNJ_64, acabar({ tabernero, forastero, mercader, driada, gnomo, fantasma, herrero, planar }));
  /* ========================================================================
     Mascotas (mirando a la derecha, de 26 a 34 píxeles de alto)
     ======================================================================== */

  /* Ojo de mascota mirando a la derecha: 3×3 con la pupila delante, brillo arriba y el iris abajo. */
  function ojoM(g, x, y, iris, op = {}) {
    const osc = op.oscuro || OJOS;
    const I = Array.isArray(iris) ? iris : null;
    const c = (k) => I ? I[k] : iris;
    pon(g, op.ramPiel || [osc, osc, osc, osc, osc], 0, [x, y - 1], [x + 1, y - 1], [x + 2, y - 1]);
    g.set(x, y, op.brillo || BRILLO, I).set(x + 1, y, osc, I).set(x + 2, y, osc, I);
    g.set(x, y + 1, c(2), I).set(x + 1, y + 1, osc, I).set(x + 2, y + 1, c(3), I);
    g.set(x, y + 2, c(3), I).set(x + 1, y + 2, c(4), I).set(x + 2, y + 2, c(3), I);
    if (op.rasgada) { g.set(x + 1, y + 1, osc, I).set(x + 1, y + 2, osc, I).set(x + 1, y, osc, I); g.set(x + 2, y, c(3), I); }
  }
  /* Mechones de pelo en un borde: picos de un píxel hacia fuera donde la capa acaba. */
  function mechones(g, c, ram, k, lados, paso = 3) {
    todo((i, j) => {
      if (!c.tiene(i, j) || (i * 7 + j * 3) % paso) return;
      for (const [a, b] of lados) if (!c.tiene(i + a, j + b) && !g.get(i + a, j + b)) { g.set(i + a, j + b, ram[k], ram); break; }
    });
  }

  /* Lobezno gris: cabezón y orejudo, con antifaz y pechera claros, la cola tupida en alto y pelaje
     con mechones en las mejillas y el lomo. */
  function lobezno() {
    const g = new Rejilla(W, H), G = PELAJE, Pi = R.piel.clara;
    /* Cola tupida que sube detrás. */
    const cola = capa().curva(26, 55, 15, 55, 17, 41, 7, 4.4).ell(17.4, 41, 2.6, 3);
    cola.pintar(g, G, { relieve: 2.6, max: 3 });
    for (const [a, b, c2, d] of [[19, 53, 16, 47], [21, 55, 18, 50], [18, 46, 17, 42]]) surco(g, G, 1, a, b, c2, d, G);
    pon(g, G, 4, [16, 39], [17, 39], [16, 40]); pon(g, G, 3, [15, 41], [18, 39]);
    mechones(g, cola, G, 2, [[-1, 0], [0, -1]], 3);
    /* Patas de atrás (en sombra). */
    capa().rect(25, 56, 4, 7).rect(38, 56, 4, 7).pintar(g, G, { relieve: 1.2, max: 2 });
    /* Cuerpo. */
    const cuerpo = capa().ell(31, 53.4, 9.6, 6.2);
    cuerpo.pintar(g, G, { relieve: 5, separar: true });
    for (const [a, b, c2, d] of [[24, 49, 27, 48], [28, 48, 31, 47], [25, 52, 28, 51], [33, 49, 35, 48]]) { surco(g, G, 2, a, b, c2, d, G); surco(g, G, 4, a, b - 1, c2 - 1, d - 1, G); }
    mechones(g, cuerpo, G, 3, [[0, -1]], 4);
    /* Patas de delante. */
    capa().rect(22, 56, 4, 7).rect(35, 56, 4, 7).pintar(g, G, { relieve: 1.4, max: 3, separar: true });
    for (const i of [22, 35]) { pon(g, G, 4, [i, 56], [i, 62]); pon(g, G, 1, [i + 2, 62], [i + 3, 62]); pon(g, G, 0, [i + 1, 62]); }
    /* Cabeza: cráneo, hocico hacia la derecha y orejas grandes. */
    const cab = capa().ell(41, 45.4, 8.2, 7.2).poly([[44, 45], [51.4, 46.6], [51.4, 50.4], [44, 52.4]]);
    cab.poly([[32.4, 42.4], [34.6, 30.4], [42, 38.6]]).poly([[40.8, 38.4], [47.4, 30], [49.6, 42.4]]);
    cab.pintar(g, G, { relieve: 5, separar: true });
    /* Rosa dentro de las orejas (con la rampa gris, para que el contorno siga gris). */
    capa().poly([[35, 39], [35.6, 33.4], [39.6, 38.6]]).pintar(g, G, { plano: 1 });
    capa().poly([[43.4, 38], [46.8, 33], [47.6, 40]]).pintar(g, G, { plano: 1 });
    for (const [i, j] of [[36, 36], [36, 37], [37, 37], [36, 38], [45, 36], [46, 36], [46, 37], [45, 38], [46, 38]]) g.set(i, j, Pi[2], G);
    pon(g, G, 4, [34, 32], [34, 33], [47, 32]);
    /* Mejillas con mechones hacia atrás. */
    mechones(g, cab, G, 2, [[-1, 0], [0, 1]], 2);
    /* Pechera y antifaz claros. */
    capa().ell(39, 54, 4, 4.2).recortar(cuerpo.copia().unir(cab)).pintar(g, G, { relieve: 2, min: 3 });
    capa().ell(46.6, 48.8, 4.6, 2.6).ell(38, 48, 2.4, 1.6).recortar(cab).pintar(g, G, { relieve: 1.6, min: 3 });
    pon(g, G, 4, [44, 47], [45, 47], [37, 47]);
    mechones(g, capa().ell(39, 54, 4, 4.2), G, 4, [[1, 0], [0, 1]], 2);
    /* Ojos ámbar, nariz negra con brillo, boca y lengua. */
    ojoM(g, 37, 43, AMBAR); ojoM(g, 43, 43, AMBAR);
    pon(g, G, 1, [37, 41], [38, 41], [43, 41], [44, 41]);
    pon(g, NEGRO, 0, [50, 46], [51, 46], [49, 46], [50, 47], [51, 47], [49, 47]);
    pon(g, NEGRO, 3, [50, 46]); g.set(49, 46, NEGRO[2], NEGRO);
    surco(g, G, 1, 45, 50, 50, 50, G);
    pon(g, MEJILLA, 3, [47, 51], [48, 51]); pon(g, MEJILLA, 2, [48, 52]); pon(g, MEJILLA, 4, [47, 51]);
    pon(g, MEJILLA, 3, [40, 48]);
    contornoSel(g);
    return g;
  }

  /* Búho: bola de plumas parda con el disco de la cara blanco, ojos ámbar enormes, orejitas de pluma,
     pecho moteado de uves, ala recogida con las primarias marcadas y garras de bronce. */
  function buho() {
    const g = new Rejilla(W, H), C = PLUMA, B = PLUMON, A = AMBAR, Pi = ORO;
    /* Cola corta detrás. */
    capa().poly([[25, 56], [20, 62.4], [27, 62.4], [29, 58]]).pintar(g, C, { relieve: 1, max: 2 });
    const cuerpo = capa().ell(32.6, 49.4, 9.8, 11);
    cuerpo.poly([[24.4, 40], [24.6, 30.6], [30.4, 37.6]]).poly([[35.4, 37.2], [41, 30.4], [41.6, 40]]);
    cuerpo.pintar(g, C, { relieve: 5.5, separar: true });
    /* Plumas del lomo en escamas. */
    cada(g, C, 20, 36, 44, 62, (i, j, k) => { const f = ((i + ((j >> 1) & 1) * 2) % 4 === 0) && j % 2 === 0; if (f && k > 1) { pon(g, C, k - 1, [i, j]); if (es(g, i, j - 1, C)) pon(g, C, Math.min(4, k + 1), [i, j - 1]); } });
    pon(g, C, 4, [25, 32], [25, 33], [26, 34], [40, 32]);
    /* Pecho claro con uves pardas. */
    const pecho = capa().ell(35, 52.4, 6, 7).recortar(cuerpo);
    pecho.pintar(g, B, { relieve: 2.6, min: 2, max: 4 });
    for (const [i, j] of [[32, 49], [36, 49], [34, 52], [38, 52], [31, 53], [33, 55], [37, 55], [35, 58], [39, 57], [31, 57]]) { pon(g, C, 2, [i, j], [i + 1, j + 1]); pon(g, C, 3, [i + 2, j]); ponSi(g, B, B, 4, [i + 1, j - 1]); }
    /* Disco de la cara, ojos enormes y pico. */
    const disco = capa().ell(31.6, 42.4, 4.4, 4.4).ell(39.6, 42.4, 4.4, 4.4).ell(35.6, 45, 5.6, 4).recortar(cuerpo);
    disco.pintar(g, B, { relieve: 2.4, min: 3 });
    todo((i, j) => { if (disco.tiene(i, j) && !disco.tiene(i, j + 1) && g.rampa(i, j + 1) !== B) pon(g, B, 2, [i, j]); });
    for (const [i, j] of [[28, 39], [29, 38], [30, 38], [41, 38], [42, 38], [43, 39]]) pon(g, C, 1, [i, j]);
    for (const ex of [31.6, 39.6]) capa().ell(ex, 42.6, 2.8, 2.8).pintar(g, A, { relieve: 1.6, min: 2 });
    for (const ex of [31, 39]) {
      pon(g, NEGRO, 0, [ex, 42], [ex + 1, 42], [ex, 43], [ex + 1, 43], [ex + 2, 42], [ex + 2, 43], [ex + 1, 41], [ex + 1, 44]);
      g.set(ex, 41, BRILLO, A); pon(g, A, 4, [ex + 1, 45]); pon(g, NEGRO, 2, [ex + 2, 42]);
    }
    pon(g, C, 1, [28, 40], [29, 39], [36, 39], [37, 39], [42, 39], [43, 40]);
    const pico = capa().poly([[34.4, 45], [37.6, 45], [36.4, 49.4], [35.4, 49.4]]);
    pico.pintar(g, R.oricalco, { relieve: 1, min: 1, separar: true });
    pon(g, R.oricalco, 4, [35, 45], [35, 46]); pon(g, R.oricalco, 1, [37, 45], [36, 48]);
    /* Ala recogida con las primarias marcadas. */
    const ala = capa().ell(26.6, 50.4, 5, 8.4).poly([[22.6, 54], [24.6, 61.6], [30.4, 56]]);
    sombra(g, ala, -1);
    ala.pintar(g, C, { relieve: 3, max: 3, separar: true });
    for (let k = 0; k < 4; k++) surco(g, C, 1, 24 + k * 1.6, 50 + k, 24 + k * 1.2, 60 - k, C);
    for (let k = 0; k < 4; k++) surco(g, C, 3, 23 + k * 1.6, 50 + k, 23 + k * 1.2, 59 - k, C);
    for (const [i, j] of [[25, 44], [27, 45], [24, 47], [28, 47]]) { pon(g, B, 3, [i, j]); pon(g, C, 1, [i, j + 1]); }
    pon(g, C, 4, [23, 43], [24, 42], [25, 42]);
    /* Garras de bronce. */
    for (const i of [31, 33, 37, 39]) { pon(g, Pi, 3, [i, 61], [i, 62]); pon(g, Pi, 1, [i + 1, 62]); }
    pon(g, Pi, 4, [31, 61], [37, 61]);
    contornoSel(g);
    return g;
  }

  /* Diablillo familiar: cabezón y redondo, cuernitos de hueso, alas de murciélago diminutas con sus
     dedos, sonrisa pícara con un colmillo, barriguita y la cola en punta de flecha. */
  function diablillo() {
    const g = new Rejilla(W, H), Rj = ESCARLATA, S = MEMBRANA;
    /* Ala de atrás: membrana entre los dedos y los huesos marcados. */
    const raiz = [29, 50], codo = [23, 40];
    const ala = capa().poly([raiz, codo, [19, 35], [15, 40.6], [14.6, 45.6], [17.6, 47.4], [24, 51.6]]);
    for (const [a, b] of [[[15, 40.6], [17.4, 45]], [[14.6, 45.6], [19.6, 48]]]) ala.restar(capa().ell((a[0] + b[0]) / 2 + 1.2, (a[1] + b[1]) / 2 + 0.6, 1.6, 1.6));
    ala.pintar(g, S, { relieve: 2, max: 3 });
    const hue = capa().linea(raiz[0], raiz[1], codo[0], codo[1], 2).linea(codo[0], codo[1], 19, 35, 1).linea(codo[0], codo[1], 15, 40.6, 1).linea(codo[0], codo[1], 14.6, 45.6, 1);
    hue.pintar(g, Rj, { relieve: 1, min: 2, max: 3 });
    pon(g, HUESO, 3, [23, 39]);
    /* Cola en punta de flecha. */
    capa().curva(31, 59, 21, 62, 18, 55, 2.8, 1.8).pintar(g, Rj, { relieve: 1.2, max: 3 });
    capa().poly([[13.6, 55], [16.6, 50], [20.6, 54], [16.6, 55.4]]).pintar(g, Rj, { relieve: 1, min: 2, max: 3 });
    pon(g, Rj, 4, [16, 51], [15, 53]);
    /* Piernas y pezuñas. */
    capa().rect(30, 56, 4, 6).rect(35, 56, 4, 6).pintar(g, Rj, { relieve: 1.2, max: 3, separar: true });
    capa().rect(29, 60, 5, 3).rect(35, 60, 5, 3).pintar(g, NEGRO, { relieve: 1, min: 1, max: 3 });
    pon(g, NEGRO, 4, [29, 60], [35, 60]);
    /* Cuerpo con barriguita. */
    const cuerpo = capa().ell(34, 53.4, 6, 5.2);
    cuerpo.pintar(g, Rj, { relieve: 4, separar: true });
    capa().ell(35.6, 54.6, 3, 3).recortar(cuerpo).pintar(g, Rj, { relieve: 1.6, min: 3 });
    pon(g, Rj, 1, [31, 56], [32, 57]);
    /* Cabeza grande, con las orejas de punta hacia atrás. */
    const cab = capa().ell(36.4, 43, 8.4, 7.4).poly([[29, 41.6], [23.6, 37.4], [29.4, 45.6]]);
    cab.pintar(g, Rj, { relieve: 5.5, separar: true });
    surco(g, Rj, 1, 28, 42, 25, 39, Rj); surco(g, Rj, 3, 28, 41, 25, 38, Rj);
    /* Cuernitos de hueso con anillos. */
    const cu = capa().poly([[29.6, 37.6], [34.4, 35.6], [32.4, 32], [28.4, 28]]).poly([[39, 35.6], [43.6, 37.4], [44.4, 28], [41, 32]]);
    cu.pintar(g, HUESO, { relieve: 1.6, min: 1, separar: true });
    pon(g, HUESO, 4, [29, 29], [29, 30], [30, 31], [44, 29]); pon(g, HUESO, 1, [31, 34], [43, 34], [42, 32]);
    surco(g, HUESO, 1, 30, 33, 32, 32, HUESO); surco(g, HUESO, 1, 41, 33, 43, 33, HUESO);
    /* Ojos dorados enormes de pupila negra. */
    for (const ex of [34, 40]) {
      capa().rect(ex, 41, 4, 4).off(ex, 41).off(ex + 3, 41).pintar(g, AMBAR, { relieve: 1, min: 3 });
      pon(g, NEGRO, 0, [ex + 2, 42], [ex + 2, 43], [ex + 3, 42], [ex + 3, 43]);
      g.set(ex + 1, 42, BRILLO, AMBAR); pon(g, AMBAR, 2, [ex, 44], [ex + 1, 44]);
    }
    /* Cejas pícaras. */
    pon(g, Rj, 0, [33, 40], [34, 39], [35, 39], [36, 39], [40, 39], [41, 39], [42, 39], [43, 40]);
    /* Sonrisa pícara con colmillo. */
    pon(g, NEGRO, 0, [36, 47], [37, 48], [38, 48], [39, 48], [40, 48], [41, 47], [42, 46]);
    pon(g, HUESO, 4, [39, 49]); pon(g, HUESO, 3, [39, 48]);
    pon(g, MEJILLA, 4, [33, 46], [44, 45]); pon(g, MEJILLA, 3, [32, 46], [44, 46]);
    pon(g, Rj, 4, [31, 38], [32, 37], [33, 37], [30, 40]);
    /* Bracito de delante. */
    capa().linea(37, 52, 42, 49, 3).pintar(g, Rj, { relieve: 1, separar: true });
    capa().ell(43, 48.6, 1.8, 1.8).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    pon(g, Rj, 4, [42, 48]);
    contornoSel(g);
    for (const [i, j, k] of [[47, 35, 3], [50, 40, 2], [20, 30, 2], [49, 31, 4]]) mota(g, BRASA, k, i, j);
    return g;
  }

  /* Gato negro sentado: orejas de punta, ojos amarillos de pupila rasgada, bigotes, collar granate con
     cascabel, pelo con brillo azulado y la cola enroscada en el suelo. */
  function gato() {
    const g = new Rejilla(W, H), N = NOCHE, A = AMBAR, Pi = R.piel.clara;
    capa().curva(27, 61, 14, 62.4, 15, 49, 4.4, 2.6).pintar(g, N, { relieve: 2, max: 3 });
    pon(g, N, 3, [14, 50], [14, 51], [15, 49]);
    const cuerpo = capa().ell(30, 54, 8.2, 8.4).ell(35, 51, 5, 7);
    cuerpo.pintar(g, N, { relieve: 5, separar: true });
    capa().rect(34, 52, 4, 11).rect(39, 52, 4, 11).pintar(g, N, { relieve: 1.4, max: 3, separar: true });
    for (const j of [54, 57, 60]) pon(g, N, 1, [38, j]);
    for (const i of [34, 39]) { pon(g, N, 3, [i, 62], [i + 1, 62]); pon(g, N, 1, [i + 3, 62]); }
    pon(g, N, 4, [34, 53], [39, 53]);
    /* Cabeza con orejas de punta. */
    const cab = capa().ell(38, 42, 7.6, 6.2).poly([[31, 41], [31.4, 30.6], [37.4, 36]]).poly([[39, 36], [44.6, 30.6], [45.2, 41]]);
    cab.pintar(g, N, { relieve: 5, separar: true });
    capa().poly([[32.6, 38], [33, 33], [36, 36.2]]).pintar(g, N, { plano: 0 });
    capa().poly([[40.4, 36.2], [43.6, 33], [43.6, 38]]).pintar(g, N, { plano: 0 });
    for (const [i, j] of [[33, 35], [33, 36], [34, 36], [43, 35], [42, 36], [43, 36]]) g.set(i, j, Pi[1], N);
    /* Ojos amarillos rasgados. */
    for (const ex of [34, 40]) {
      capa().rect(ex, 40, 4, 4).off(ex, 40).off(ex + 3, 43).pintar(g, A, { relieve: 1, min: 3 });
      pon(g, A, 2, [ex, 43], [ex + 1, 43], [ex + 2, 43]);
      pon(g, NEGRO, 0, [ex + 2, 40], [ex + 2, 41], [ex + 2, 42], [ex + 2, 43]);
      g.set(ex + 1, 41, BRILLO, A);
    }
    /* Hocico, nariz rosa y boquita. */
    pon(g, R.piel.roja, 4, [42, 45], [43, 45]); pon(g, R.piel.roja, 3, [42, 46]);
    pon(g, N, 4, [41, 46], [44, 46], [41, 47], [43, 47]); pon(g, N, 0, [42, 47]);
    /* Brillo azulado del pelo. */
    bordeLuz(g, N, 3);
    for (const [a, b, c2, d] of [[25, 49, 28, 47], [32, 37, 35, 36], [24, 53, 25, 51]]) surco(g, N, 4, a, b, c2, d, N);
    /* Collar granate con cascabel. */
    capa().rect(32, 47, 9, 2).pintar(g, R.tela.granate, { relieve: 1, min: 2, max: 3 });
    surco(g, R.tela.granate, 4, 32, 47, 36, 47, R.tela.granate);
    capa().ell(37, 50, 1.6, 1.6).pintar(g, ORO, { relieve: 1, min: 2, separar: true });
    g.set(36, 49, BRILLO, ORO); pon(g, ORO, 0, [37, 51]);
    contornoSel(g);
    for (const [x0, y0, x1, y1] of [[46, 44, 50, 43], [46, 46, 51, 46], [46, 47, 49, 49], [30, 45, 27, 44], [30, 46, 27, 47]]) hilo(g, x0, y0, x1, y1, HUESO, 2);
    return g;
  }

  /* Dragoncito rojo: cabeza grande, cuernos romos, alitas de cría, cresta de púas ocres, pecho a franjas,
     escamas en el lomo, cola con punta y una voluta de humo saliendo del hocico. */
  function dragoncito() {
    const g = new Rejilla(W, H), Rj = ESCARLATA, S = MEMBRANA, O = R.tela.ocre;
    /* Ala de atrás. */
    const ala1 = capa().poly([[28, 50], [22, 38], [17, 36.6], [15.4, 42], [21, 49]]);
    ala1.pintar(g, S, { relieve: 1.6, max: 1 });
    /* Cola con punta. */
    capa().curva(25, 57, 16, 62, 10, 54.6, 4.6, 2).pintar(g, Rj, { relieve: 1.8, max: 3 });
    capa().poly([[6, 54.4], [9, 49.4], [12.6, 53.6], [9, 56]]).pintar(g, O, { relieve: 1, min: 2, max: 3 });
    pon(g, O, 4, [9, 50], [8, 52]);
    capa().rect(24, 56, 5, 7).rect(35, 56, 5, 7).pintar(g, Rj, { relieve: 1, max: 2 });
    const cuerpo = capa().ell(31, 53.4, 8.6, 6.2).ell(37, 49.4, 4.8, 4.8);
    cuerpo.pintar(g, Rj, { relieve: 5, separar: true });
    /* Escamas del lomo. */
    cada(g, Rj, 22, 46, 40, 60, (i, j, k) => { if ((i + ((j >> 1) & 1) * 2) % 4 === 0 && j % 2 === 0 && k > 1 && !es(g, i, j, O)) { pon(g, Rj, k - 1, [i, j]); pon(g, Rj, Math.min(4, k + 1), [i - 1, j - 1]); } });
    /* Cresta de púas. */
    for (const [i, j] of [[24, 48], [29, 46.6], [34, 44.4]]) capa().poly([[i - 2, j + 1], [i + 0.6, j - 3], [i + 2, j + 1]]).pintar(g, O, { relieve: 1, min: 2, separar: true });
    const pecho = capa().ell(38, 53, 4, 5.6).recortar(cuerpo);
    pecho.pintar(g, O, { relieve: 1.8, min: 2, max: 4 });
    for (const j of [49, 52, 55, 58]) for (let i = 32; i <= 43; i++) if (pecho.tiene(i, j)) pon(g, O, 1, [i, j]), pecho.tiene(i, j - 1) && pon(g, O, 4, [i, j - 1]);
    capa().rect(20, 57, 5, 6).rect(31, 57, 5, 6).pintar(g, Rj, { relieve: 1.4, max: 3, separar: true });
    for (const i of [20, 31]) pon(g, HUESO, 4, [i - 1, 62], [i + 1, 62], [i + 3, 62]);
    /* Cabeza grande con hocico. */
    const cab = capa().ell(40.6, 42, 7, 6.2).poly([[43, 38.6], [51.4, 41], [51.4, 46.4], [43, 48.4]]);
    cab.pintar(g, Rj, { relieve: 5, separar: true });
    surco(g, Rj, 1, 44, 46, 50, 46, Rj);
    surco(g, Rj, 4, 44, 38, 50, 41, Rj);
    /* Cuernos romos. */
    capa().poly([[33.4, 39], [39.2, 36], [30, 29.4]]).poly([[39.2, 36.6], [44.6, 37.6], [39.6, 28.4]]).pintar(g, HUESO, { relieve: 1.6, min: 2, separar: true });
    pon(g, HUESO, 4, [31, 31], [32, 32], [39, 30], [40, 31]); surco(g, HUESO, 1, 34, 35, 36, 34, HUESO); surco(g, HUESO, 1, 40, 34, 42, 34, HUESO);
    /* Ojo grande. */
    ojoM(g, 41, 40, AMBAR);
    pon(g, Rj, 0, [40, 38], [41, 38], [42, 38], [43, 38], [44, 39]);
    /* Narina, dientecitos y mejilla. */
    pon(g, NEGRO, 0, [49, 42], [50, 42]);
    pon(g, HUESO, 4, [47, 47], [44, 47]); pon(g, HUESO, 3, [48, 47]);
    pon(g, O, 3, [43, 47], [45, 47], [46, 47]);
    pon(g, MEJILLA, 3, [39, 45]);
    /* Ala de delante, plegada en alto. */
    const raiz = [31, 49], codo = [27, 36.6];
    const ala2 = capa().poly([raiz, codo, [21.4, 34], [19.6, 39.6], [23, 45], [28.6, 49]]);
    sombra(g, ala2, -1);
    ala2.pintar(g, S, { relieve: 1.8, max: 3, separar: true });
    capa().linea(raiz[0], raiz[1], codo[0], codo[1], 2).linea(codo[0], codo[1], 21.4, 34, 1).linea(codo[0], codo[1], 19.6, 39.6, 1).pintar(g, Rj, { relieve: 1, min: 2, max: 3 });
    pon(g, HUESO, 4, [27, 35]);
    contornoSel(g);
    /* Voluta de humo. */
    detras(g, capa().ell(53.6, 40.4, 1.4, 1.4).ell(55.6, 36.6, 2, 1.8).ell(54.4, 32.4, 1.5, 1.4).ell(56.4, 30.2, 0.8, 0.8), CENIZA, { relieve: 1.6, min: 2 });
    pon(g, CENIZA, 4, [54, 35], [55, 35]);
    return g;
  }

  /* Babosa: cubo gelatinoso en miniatura, translúcido, con ojitos, sonrisa, burbujas dentro, una moneda
     y un huesecillo tragados, brillos en las aristas y un charquito de baba. */
  function babosa() {
    const g = new Rejilla(W, H), E = GELATINA;
    const x0 = 19, y0 = 42, w = 22, h = 19, d = 7;
    const frente = capa().rect(x0, y0, w, h).off(x0, y0).off(x0 + w - 1, y0).off(x0, y0 + h - 1).off(x0 + w - 1, y0 + h - 1);
    const arriba = capa().poly([[x0 + 0.5, y0 + 0.5], [x0 + d, y0 - d + 0.5], [x0 + w + d, y0 - d + 0.5], [x0 + w - 0.5, y0 + 0.5]]).restar(frente);
    const lado = capa().poly([[x0 + w - 0.5, y0 + 0.5], [x0 + w + d - 0.5, y0 - d + 0.5], [x0 + w + d - 0.5, y0 + h - d - 0.5], [x0 + w - 0.5, y0 + h - 0.5]]).restar(frente).restar(arriba);
    const charco = capa().ell(x0 + w / 2 + 2, 62, w / 2 + 5, 1.2).restar(frente).restar(lado);
    const tramar = (c, i0, i1, f) => todo((i, j) => { if (c.tiene(i, j)) g.set(i, j, E[lim((f(i, j) - 0.5) * 5 + 0.5, 0, 1) > umbral(i, j) ? i1 : i0], E); });
    tramar(frente, 2, 3, (i, j) => 0.9 - ((i - x0) + (j - y0)) / 34);
    tramar(arriba, 3, 4, i => 0.85 - (i - x0) / 30);
    tramar(lado, 1, 2, (i, j) => 0.75 - (j - y0 + d) / 22);
    charco.pintar(g, E, { plano: 2 });
    for (let i = 0; i < W; i++) if (charco.tiene(i, 62) && !charco.tiene(i, 61)) pon(g, E, 3, [i, 61]);
    /* Burbujas, moneda y huesecillo flotando dentro (vistos a través de la baba). */
    capa().ell(x0 + 4.5, y0 + 14, 2.2, 1.4).pintar(g, ORO, { relieve: 1, min: 2, max: 3 });
    pon(g, ORO, 4, [x0 + 3, y0 + 13]); pon(g, ORO, 1, [x0 + 6, y0 + 15]);
    pon(g, HUESO, 2, [x0 + 13, y0 + 16], [x0 + 14, y0 + 16], [x0 + 15, y0 + 15]); pon(g, HUESO, 3, [x0 + 12, y0 + 15], [x0 + 16, y0 + 14]);
    for (const [i, j, r] of [[x0 + 9, y0 + 15, 1], [x0 + 17, y0 + 8, 1.4], [x0 + 3, y0 + 9, 0.8], [x0 + 19, y0 + 15, 1], [x0 + w + 3, y0 + 2, 1]]) {
      const b = capa().ell(i, j, r, r);
      todo((a, c) => { if (b.tiene(a, c)) matiz(g, a, c, -1); });
      pon(g, E, 4, [Math.round(i - r * 0.5), Math.round(j - r * 0.5)]);
    }
    /* Aristas iluminadas y el brillo de la esquina. */
    for (let i = x0 + 1; i < x0 + w - 1; i++) pon(g, E, 4, [i, y0]);
    for (let j = y0 + 1; j < y0 + h - 1; j++) pon(g, E, 3, [x0, j]);
    for (let i = x0 + d + 1; i <= x0 + w + d - 1; i++) pon(g, E, 4, [i, y0 - d + 1]);
    surco(g, E, 4, x0 + 1, y0, x0 + d, y0 - d + 1, null);
    surco(g, E, 3, x0 + w - 1, y0, x0 + w + d - 1, y0 - d + 1, null);
    for (let j = y0 + 1; j < y0 + h - 1; j++) pon(g, E, 1, [x0 + w - 1, j]);
    g.set(x0 + 1, y0 + 1, BRILLO, E); pon(g, E, 4, [x0 + 2, y0 + 1], [x0 + 1, y0 + 2], [x0 + 3, y0 + 1], [x0 + 1, y0 + 3]);
    pon(g, E, 4, [x0 + 9, y0 - 4], [x0 + 10, y0 - 4], [x0 + 11, y0 - 5]);
    /* Ojitos brillantes y sonrisa. */
    for (const ex of [x0 + 7, x0 + 14]) {
      capa().rect(ex, y0 + 4, 4, 5).off(ex, y0 + 4).off(ex + 3, y0 + 4).off(ex, y0 + 8).off(ex + 3, y0 + 8).pintar(g, HUESO, { plano: 4 });
      pon(g, NEGRO, 0, [ex + 1, y0 + 5], [ex + 2, y0 + 5], [ex + 1, y0 + 6], [ex + 2, y0 + 6], [ex + 1, y0 + 7], [ex + 2, y0 + 7], [ex + 3, y0 + 6], [ex + 3, y0 + 5]);
      g.set(ex + 2, y0 + 5, BRILLO, NEGRO); pon(g, NEGRO, 3, [ex + 1, y0 + 7]);
    }
    pon(g, E, 0, [x0 + 10, y0 + 11], [x0 + 11, y0 + 12], [x0 + 12, y0 + 12], [x0 + 13, y0 + 12], [x0 + 14, y0 + 11]);
    pon(g, ROSA, 3, [x0 + 12, y0 + 13]);
    pon(g, MEJILLA, 4, [x0 + 5, y0 + 10], [x0 + 6, y0 + 10], [x0 + 19, y0 + 10], [x0 + 18, y0 + 10]);
    contornoSel(g, { color: E[0] });
    /* Burbujas que escapan por arriba. */
    for (const [i, j, k] of [[x0 + 12, y0 - 10, 3], [x0 + 16, y0 - 13, 4], [x0 + 21, y0 - 11, 2], [x0 + 18, y0 - 16, 3]]) mota(g, E, k, i, j);
    return g;
  }

  /* Espíritu: fuego fatuo cian que flota; una gota de luz con la llama echada hacia atrás en lenguas,
     el núcleo blanco, dos ojitos, mejillas rosadas, chispas y un halo en el suelo. */
  function espiritu() {
    const g = new Rejilla(W, H), F = FATUO;
    const cx = 35, cy = 47;
    const cuerpo = capa().ell(cx, cy, 8, 7.4);
    cuerpo.curva(cx - 4.4, cy - 3.6, cx - 11, cy - 6.6, cx - 15, cy - 17, 10, 1.4);
    cuerpo.curva(cx - 5.4, cy + 1, cx - 10.6, cy + 1.6, cx - 14, cy - 2, 6.4, 1.6);
    cuerpo.curva(cx - 2, cy - 5.4, cx - 3, cy - 10, cx - 1.6, cy - 13, 4.6, 1.4);
    cuerpo.pintar(g, F, { relieve: 5, min: 1 });
    /* Lenguas de llama: surcos claros que siguen la forma. */
    for (const [a, b, c2, d] of [[cx - 7, cy - 4, cx - 14, cy - 15], [cx - 8, cy, cx - 12, cy - 2], [cx - 3, cy - 7, cx - 2, cy - 11]]) surco(g, F, 3, a, b, c2, d, F);
    capa().ell(cx + 0.6, cy + 0.6, 5.4, 5).pintar(g, F, { relieve: 2.6, min: 3 });
    capa().ell(cx - 0.8, cy - 0.6, 2.8, 2.4).pintar(g, F, { plano: 4 });
    g.set(cx - 2, cy - 2, BRILLO, F); g.set(cx - 1, cy - 2, BRILLO, F); g.set(cx - 2, cy - 1, BRILLO, F);
    pon(g, F, 4, [cx - 9, cy - 6], [cx - 12, cy - 11], [cx - 14, cy - 15], [cx - 3, cy - 10]);
    /* Ojitos y boquita. */
    for (const ex of [cx + 1, cx + 5]) {
      pon(g, F, 0, [ex, cy - 1], [ex + 1, cy - 1], [ex, cy], [ex + 1, cy], [ex, cy + 1], [ex + 1, cy + 1]);
      pon(g, F, 4, [ex, cy - 1]); pon(g, F, 1, [ex + 1, cy + 1]);
    }
    pon(g, F, 1, [cx + 3, cy + 3], [cx + 4, cy + 3]); pon(g, F, 0, [cx + 3, cy + 4]);
    pon(g, ROSA, 3, [cx - 1, cy + 2], [cx + 7, cy + 2]); pon(g, ROSA, 4, [cx - 1, cy + 2]);
    contornoSel(g, { color: F[0] });
    /* Chispas alrededor y halo en el suelo. */
    for (const [i, j, k] of [[cx + 10, cy - 8, 3], [cx - 20, cy - 4, 3], [cx + 11, cy + 4, 3], [cx - 18, cy + 7, 2], [cx - 9, cy - 20, 3], [cx - 6, cy + 11, 2], [cx + 6, cy + 11, 2], [cx - 3, cy - 18, 2], [cx + 13, cy - 2, 2]]) mota(g, F, k, i, j);
    destello(g, F, cx + 9, cy - 11, true, true);
    for (let i = cx - 10; i <= cx + 8; i++) if (umbral(i, 62) < 1 - Math.abs(i - cx + 1) / 10) mota(g, F, Math.abs(i - cx + 1) > 5 ? 1 : 2, i, 62);
    for (let i = cx - 6; i <= cx + 4; i++) mota(g, F, Math.abs(i - cx + 1) > 3 ? 2 : 3, i, 61);
    return g;
  }

  window.MASCOTAS_64 = window.MASCOTAS_64 || {};
  Object.assign(window.MASCOTAS_64, acabar({ lobezno, buho, diablillo, gato, dragoncito, babosa, espiritu }));
})();
