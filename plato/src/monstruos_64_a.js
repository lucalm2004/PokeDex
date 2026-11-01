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
  const PARDO = ["#1c0e10", "#3a1f18", "#5e3822", "#87552f", "#b47e4a"];                // pelo de la rata grande
  const ORO = ["#3a1f10", "#6e4518", "#b57d27", "#e9bf4e", "#fff2a6"];
  const GARGANTA = ["#14040a", "#2e0810", "#561018", "#86202a", "#b8403c"];            // fauces del mímico
  const FUEGO = R.fuego;
  const CALIENTE = tinte(R.hierro, ["#4a1404", "#8a2c08", "#c8561a", "#f08a34", "#ffc070"], 0.32);   // hierro al rojo junto al horno

  /* ---------- Utilidades ---------- */
  /* Capa con el mismo sombreado por relieve que PX.Capa, pero que solo recorre la caja que ocupa la máscara
     (el resultado es idéntico y mucho más rápido en rejillas de 64×64). */
  class CapaR extends Capa {
    pintar(rej, rampa, op = {}) {
      const w = this.w, h = this.h, m = this.m;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return rej;
      if (op.plano !== undefined) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const Rr = op.relieve || 4;
      const d = new Float32Array(w * h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) d[y * w + x] = 1e6;
      const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
      }
      for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) {
        const i = y * w + x;
        if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
      }
      /* Altura de cada píxel (cúpula redondeada según la distancia al borde). */
      const A = new Float32Array(w * h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (!m[i]) continue;
        const v = Math.min(d[i], Rr) / Rr;
        A[i] = Math.sqrt(1 - (1 - v) * (1 - v));
      }
      const alto = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : A[y * w + x]);
      const L = op.luz || [-0.5, -0.62, 0.6];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.4, sesgo = op.sesgo || 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!m[y * w + x]) continue;
        const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k;
        const ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
        const nl = Math.hypot(nx, ny, 1);
        const l = (nx * lx + ny * ly + lz) / nl + sesgo;
        let t = l > 0.965 ? 4 : l > 0.74 ? 3 : l > 0.4 ? 2 : l > 0.02 ? 1 : 0;
        if (t === 0 && !op.profundo) t = 1;
        if (op.max !== undefined) t = Math.min(t, op.max);
        if (op.min !== undefined) t = Math.max(t, op.min);
        if (op.separar) {
          const tiene = (a, b) => a >= 0 && b >= 0 && a < w && b < h && m[b * w + a];
          const borde = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !tiene(x + a, y + b) && rej.get(x + a, y + b));
          if (borde) t = Math.min(t, op.separar === true ? 1 : op.separar);
        }
        rej.set(x, y, rampa[Math.min(t, rampa.length - 1)], rampa);
      }
      return rej;
    }
  }
  const capa = () => new CapaR(W, W);
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
  /* Pelaje limpio: las fronteras entre tonos se vuelven dientes de sierra en la dirección del pelo (mechones claros
     que caen sobre la sombra) y unas pocas hebras oscuras separan los mechones en las zonas iluminadas. */
  function pelo(g, c, ram, dir, sem, hebras = 6) {
    const T = new Int8Array(W * W).fill(-1);
    cada(c, (x, y) => { T[y * W + x] = tonoDe(g, x, y, ram); });
    const tq = (x, y) => (x < 0 || y < 0 || x >= W || y >= W ? -1 : T[y * W + x]);
    cada(c, (x, y) => {
      const t = tq(x, y);
      if (t < 1) return;
      const [dx, dy] = typeof dir === "function" ? dir(x, y) : dir;
      const qx = Math.round(x + dx), qy = Math.round(y + dy);
      if (tq(qx, qy) !== t - 1 || !c.tiene(qx, qy)) return;
      const h = hash(x, y, sem);
      if (h < 0.5) {
        pon(g, ram, t, [qx, qy]);
        const rx = Math.round(x + dx * 2), ry = Math.round(y + dy * 2);
        if (h < 0.2 && tq(rx, ry) === t - 1 && c.tiene(rx, ry)) pon(g, ram, t, [rx, ry]);
      }
    });
    if (!hebras) return;
    for (let y = 0; y < W; y += hebras) for (let x = ((y / hebras) & 1) * (hebras >> 1); x < W; x += hebras) {
      const px = x + Math.floor(hash(x, y, sem + 3) * 3), py = y + Math.floor(hash(y, x, sem + 5) * 3);
      const t = tq(px, py);
      if (t < 2 || !c.tiene(px, py)) continue;
      const [dx, dy] = typeof dir === "function" ? dir(px, py) : dir;
      for (let k = 0; k < 3; k++) {
        const qx = Math.round(px + dx * k), qy = Math.round(py + dy * k);
        if (tq(qx, qy) === t && c.tiene(qx, qy)) pon(g, ram, t - 1, [qx, qy]);
      }
      const hx = Math.round(px - dx), hy = Math.round(py - dy);
      if (tq(hx, hy) === t && t < 4 && c.tiene(hx, hy)) pon(g, ram, t + 1, [hx, hy]);
    }
  }
  /* Volumen: une elipsoides ["e", cx, cy, rx, ry, z0] y cápsulas ["c", x0, y0, x1, y1, r0, r1, z0] y sombrea
     cada píxel con la normal de la forma que queda más cerca del ojo (las uniones forman pliegues suaves).
     op: min, max, separar, detras (solo donde no hay nada), rebote (luz rebotada en el borde de abajo),
     plano (aplana la normal: más contraste), sesgo. Devuelve la capa de lo pintado. */
  function volumen(g, ram, formas, op = {}) {
    const Lr = op.luz || [-0.55, -0.68, 0.5], ln = Math.hypot(...Lr), L = Lr.map(v => v / ln);
    const zb = new Float32Array(W * W).fill(-1e9), N = new Float32Array(W * W * 3);
    const c = capa();
    const prueba = (x, y, h, nx, ny, nz) => {
      const i = y * W + x;
      if (h <= zb[i]) return;
      zb[i] = h; N[i * 3] = nx; N[i * 3 + 1] = ny; N[i * 3 + 2] = nz; c.on(x, y);
    };
    for (const f of formas) {
      if (f[0] === "e") {
        const [, cx, cy, rx, ry, z0 = 0] = f, rz = Math.min(rx, ry);
        for (let y = Math.max(0, Math.floor(cy - ry - 1)); y <= Math.min(W - 1, Math.ceil(cy + ry + 1)); y++)
          for (let x = Math.max(0, Math.floor(cx - rx - 1)); x <= Math.min(W - 1, Math.ceil(cx + rx + 1)); x++) {
            const dx = (x - cx) / (rx + 0.25), dy = (y - cy) / (ry + 0.25), u = dx * dx + dy * dy;
            if (u > 1) continue;
            const z = Math.sqrt(1 - u);
            prueba(x, y, z0 + z * rz, dx / rx, dy / ry, z / rz);
          }
      } else {
        const [, x0, y0, x1, y1, r0, r1 = r0, z0 = 0] = f, vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1, rm = Math.max(r0, r1);
        for (let y = Math.max(0, Math.floor(Math.min(y0, y1) - rm - 1)); y <= Math.min(W - 1, Math.ceil(Math.max(y0, y1) + rm + 1)); y++)
          for (let x = Math.max(0, Math.floor(Math.min(x0, x1) - rm - 1)); x <= Math.min(W - 1, Math.ceil(Math.max(x0, x1) + rm + 1)); x++) {
            const t = lim(((x - x0) * vx + (y - y0) * vy) / l2, 0, 1), px = x0 + vx * t, py = y0 + vy * t, r = r0 + (r1 - r0) * t;
            const ex = x - px, ey = y - py, u = (ex * ex + ey * ey) / ((r + 0.25) * (r + 0.25));
            if (u > 1) continue;
            const z = Math.sqrt(1 - u);
            prueba(x, y, z0 + z * r, ex / r, ey / r, z / r);
          }
      }
    }
    if (op.detras) cada(c, (x, y) => { if (g.get(x, y)) c.off(x, y); });
    if (op.recorte) c.recortar(op.recorte);
    const k = op.plano || 1, sesgo = op.sesgo || 0, tonos = [];
    cada(c, (x, y) => {
      const i = (y * W + x) * 3, nx = N[i] * k, ny = N[i + 1] * k, nz = N[i + 2], nl = Math.hypot(nx, ny, nz) || 1;
      const l = (nx * L[0] + ny * L[1] + nz * L[2]) / nl + sesgo;
      let t = l > 0.84 ? 4 : l > 0.58 ? 3 : l > 0.27 ? 2 : l > -0.08 ? 1 : 0;
      if (op.rebote && t <= 1 && !c.tiene(x, y + 1) && ny > 0.5) t = 2;
      if (op.max !== undefined) t = Math.min(t, op.max);
      if (op.min !== undefined) t = Math.max(t, op.min);
      if (op.separar && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !c.tiene(x + a, y + b) && g.get(x + a, y + b))) t = Math.min(t, 1);
      tonos.push([x, y, t]);
    });
    for (const [x, y, t] of tonos) pon(g, ram, t, [x, y]);
    return c;
  }
  /* Garras de 1 píxel en abanico, con la punta más clara. */
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
  /* Oreja redonda: borde de pelo y pabellón rosado con su sombra. */
  function orejaRata(g, ram, x, y, r, max = 4) {
    capa().ell(x, y, r, r * 1.05).pintar(g, ram, { relieve: 1.6, max, separar: true });
    const dentro = capa().ell(x - 0.4, y + 0.5, r - 1.2, r - 1);
    cada(dentro, (i, j) => pon(g, ROSA, Math.min(max - 1, (i - x) + (j - y) < -0.5 ? 2 : 1), [i, j]));
    pon(g, ROSA, Math.min(max, 3), [Math.round(x - r + 1.4), Math.round(y)]);
    pon(g, ram, Math.min(max, 4), [Math.round(x - 1), Math.round(y - r)], [Math.round(x - r + 0.6), Math.round(y - 1)]);
  }
  /* Mechones erizados que asoman por la silueta (pintados detrás de lo que ya hay). */
  function crestas(g, ram, pts, k = 2) {
    for (const [i, j, a = 1] of pts) {
      const c = capa().poly([[i - 2.2, j + 2.4], [i + 1.6 * a, j - 2.6], [i + 2.2, j + 2.4]]);
      cada(c, (x, y) => { if (g.get(x, y)) c.off(x, y); });
      cada(c, (x, y) => pon(g, ram, x - i < 0 ? k + 1 : k, [x, y]));
    }
  }
  function rata() {
    const g = new Rejilla(W, W), G = R.piel.gris, C = PARDO, S = R.sangre, Oc = R.tela.ocre;

    /* --- Rata gris del fondo, encaramada al lomo de la grande --- */
    cola(g, 53, 38, 63, 41, 59, 26, 3, 1.2, 2);
    const gris = volumen(g, G, [["e", 46, 37.5, 10, 6.2, 0], ["e", 37, 37.6, 5.6, 5, 1.5], ["c", 36, 38, 26.5, 39.4, 4.4, 1.6, 1.5]], { max: 3, separar: true });
    crestas(g, G, [[42, 31.8], [47, 31.2], [52, 32.6]], 2);
    pelo(g, gris, G, [1, 1], 11, 6);
    orejaRata(g, G, 39.4, 32.2, 3, 3);
    /* Ojo rojo, nariz y boca. */
    pon(g, NEGRO, 0, [30, 35], [31, 34], [32, 34], [33, 35], [33, 36]);
    pon(g, OJO_R, 3, [31, 35], [32, 35]); pon(g, OJO_R, 4, [31, 35]); pon(g, OJO_R, 1, [31, 36], [32, 36]);
    pon(g, ROSA, 4, [25, 38]); pon(g, ROSA, 3, [26, 38], [25, 39]); pon(g, ROSA, 1, [26, 39]);
    pon(g, G, 3, [27, 37], [28, 36], [29, 36]);
    pon(g, NEGRO, 1, [27, 41], [28, 41], [29, 41], [30, 41]);
    pon(g, Oc, 4, [27, 42]); pon(g, Oc, 2, [28, 42]);

    /* --- Rata grande del frente --- */
    cola(g, 47, 55, 63, 63, 59, 44, 4.2, 1.2);
    /* Patas del fondo. */
    volumen(g, C, [["c", 38, 53, 36.5, 59.4, 2.4, 1.8, 0]], { max: 1, detras: true });
    pieRata(g, 33, 60, 2);
    /* Cuerpo: cuartos traseros, lomo, hombros, cabeza y hocico. */
    const cuerpo = volumen(g, C, [["e", 44, 50, 8.6, 9.2, 0], ["e", 33, 50, 13, 8, 0], ["e", 23, 51.5, 7.8, 7, 1],
      ["e", 15.5, 50, 6.4, 5.6, 2.5], ["c", 14, 50.6, 4, 52.6, 5, 1.9, 2.5]], { separar: true, rebote: true, sesgo: -0.06 });
    crestas(g, C, [[25, 44.6], [30.5, 43.2], [36, 42], [41.5, 41], [47, 41.2], [51.4, 43.4, 1.4]], 2);
    pelo(g, cuerpo, C, [1, 1], 7, 6);
    /* Muslo trasero y pliegue del cuello. */
    trazo(g, C, 1, 39, 43, 49, 45, 47, 57);
    trazo(g, C, 3, 38, 43.5, 47.6, 45.6, 46, 57);
    trazo(g, C, 1, 18.5, 45, 21.5, 50, 19, 56);
    /* Cicatrices y una calva de sarna con una llaga. */
    surco(g, ROSA, 2, 31, 45, 36, 49.5, C); surco(g, ROSA, 3, 33, 44.6, 37.6, 48.4, C);
    pon(g, ROSA, 1, [32, 47], [36, 50], [34, 45]);
    const calva = capa().ell(45, 46, 2.3, 1.7).recortar(cuerpo);
    calva.pintar(g, ROSA, { relieve: 1.2, min: 1, max: 3 });
    pon(g, S, 3, [45, 46]); pon(g, S, 1, [46, 47]); pon(g, ROSA, 4, [44, 45]);
    /* Pata trasera de delante. */
    volumen(g, C, [["c", 46.5, 53, 45.6, 59.4, 2.6, 1.9, 4]], { separar: true, max: 3 });
    pieRata(g, 41, 60);
    /* Patas delanteras: la del fondo y la de delante. */
    volumen(g, C, [["c", 25.5, 55.5, 26, 59.4, 1.9, 1.6, 0]], { max: 2, separar: true });
    pieRata(g, 22, 60, 3);
    volumen(g, C, [["c", 18, 53.6, 15.6, 59.4, 2.4, 1.8, 4]], { separar: true, max: 3 });
    pieRata(g, 11, 60);
    /* Oreja. */
    orejaRata(g, C, 20.6, 43.6, 3.4);
    /* Ojo rojo encendido bajo la ceja. */
    pon(g, NEGRO, 0, [10, 46], [11, 45], [12, 45], [13, 45], [14, 45], [15, 46], [15, 47], [15, 48], [11, 48]);
    pon(g, OJO_R, 2, [12, 47], [13, 47], [14, 47]); pon(g, OJO_R, 4, [12, 46]); pon(g, OJO_R, 3, [13, 46], [14, 46]);
    pon(g, OJO_R, 1, [12, 48], [13, 48], [14, 48]); pon(g, NEGRO, 0, [14, 47]);
    pon(g, C, 4, [12, 44], [13, 44]); pon(g, C, 3, [11, 44], [14, 44]);
    /* Hocico: nariz rosada, boca e incisivos amarillos. */
    pon(g, ROSA, 4, [3, 51]); pon(g, ROSA, 3, [2, 52], [3, 52], [4, 51]); pon(g, ROSA, 1, [4, 52], [3, 53]);
    pon(g, NEGRO, 1, [4, 54], [5, 54], [6, 55], [7, 55], [8, 55], [9, 55], [10, 55], [11, 55]);
    pon(g, NEGRO, 0, [12, 54]);
    pon(g, Oc, 4, [6, 56]); pon(g, Oc, 3, [7, 56], [6, 57]); pon(g, Oc, 1, [7, 57]);
    pon(g, C, 2, [8, 56], [9, 56], [10, 56]);
    /* Patas de la gris agarradas al lomo. */
    pon(g, ROSA, 3, [29, 42], [30, 42]); pon(g, ROSA, 2, [31, 42]); pon(g, ROSA, 1, [30, 43]);
    contornoSel(g);
    /* Bigotes. */
    for (const [x0, y0, x1, y1] of [[4, 52, 1, 49], [4, 53, 1, 56], [6, 51, 3, 46], [25, 39, 21, 37], [25, 40, 21, 42]]) hilo(g, x0, y0, x1, y1, HUESO, 2);
    return g;
  }

  /* ---------- Krug, el jefe goblin: chatarra por armadura, capa roja rota y una cuchilla ---------- */
  function goblin() {
    const g = new Rejilla(W, W), V = R.piel.verde, F = R.hierro, M = R.madera, T = R.tela.granate, Cu = R.pelo.castano, B = R.bronce, Ro = R.piel.roja, Oc = R.tela.ocre;
    /* Pie envuelto en trapos: vendas en diagonal. */
    const vendas = (x0, x1, y0, max) => { for (let j = y0 + 2; j <= 62; j += 3) { surco(g, M, 1, x0, j + 1, x1, j - 1, M); if (max > 2) surco(g, M, 3, x0, j, x1, j - 2, M); } };
    /* Capa raída detrás, con pliegues y agujeros. */
    const capaT = capa().poly([[31, 32], [43, 32], [48.5, 60], [45.5, 57], [43, 61.4], [39.5, 57.6], [36, 60.8], [33, 55.5]]);
    capaT.pintar(g, T, { relieve: 3, max: 3 });
    for (const [x0, y0, x1, y1] of [[38, 35, 39.5, 56], [42, 35, 45, 56]]) { surco(g, T, 1, x0, y0, x1, y1); surco(g, T, 3, x0 - 1, y0 + 1, x1 - 1, y1); }
    g.quitar(44, 47); g.quitar(45, 48); g.quitar(44, 48); g.quitar(45, 49);
    penumbra(g, capaT, T, 44, 60, 0.2);
    /* Oreja de atrás, con el pabellón rojizo en sombra. */
    capa().poly([[33.5, 17], [35.5, 26.5], [44.5, 19.8], [54, 11.5], [43, 14.4]]).pintar(g, V, { relieve: 2.4, max: 3 });
    cada(capa().poly([[36.4, 19.8], [37, 23.2], [43.6, 19.4], [49.6, 14.2], [43, 16.4]]), (x, y) => pon(g, Ro, 1, [x, y]));
    pon(g, V, 4, [52, 12], [50, 13], [48, 14]);
    /* Pierna y brazo de atrás. */
    volumen(g, V, [["c", 34, 49, 36.5, 56.5, 2.6, 2.2]], { max: 2 });
    capa().rect(34, 57, 8, 6).off(41, 57).pintar(g, M, { relieve: 1.8, max: 2, separar: true });
    vendas(34, 41, 57, 2);
    volumen(g, V, [["c", 37.5, 36, 41.5, 42.5, 2.2, 2], ["c", 41.5, 42.5, 41.5, 46, 2, 2]], { max: 2, separar: true });
    /* Saco del botín. */
    const saco = capa().ell(44, 52, 4.6, 4.8).poly([[42, 45.4], [46, 45.4], [45.6, 48.4], [42.4, 48.4]]);
    saco.pintar(g, Oc, { relieve: 2.5, max: 3, separar: true });
    trazo(g, Oc, 1, 42, 50, 43, 53, 42.5, 56); trazo(g, Oc, 1, 45.5, 49, 47, 52, 46, 56);
    surco(g, M, 2, 42, 48, 46, 48, null); pon(g, M, 4, [42, 48]);
    pon(g, ORO, 4, [43, 51]); pon(g, ORO, 3, [44, 51], [43, 52]); pon(g, ORO, 2, [45, 54]); pon(g, ORO, 3, [46, 53]);
    capa().ell(42, 46.4, 2, 1.8).pintar(g, V, { relieve: 1, max: 2, separar: true });

    /* Torso: jubón de cuero cosido bajo placas de chatarra. */
    const torso = capa().ell(29.5, 39.4, 8.5, 7.2).rect(21, 38.6, 17, 10.4);
    torso.pintar(g, Cu, { relieve: 3, separar: true });
    for (let j = 39; j <= 47; j += 2) { pon(g, Cu, 1, [36, j]); pon(g, Cu, 3, [35, j]); }
    /* Tres chapas desparejas, cada una con su canto, remaches y herrumbre. */
    for (const [pts, max, rem, oxi] of [
      [[[22, 35.4], [35.4, 34], [35.8, 40], [22.4, 40.8]], 4, [[24, 37], [33, 36]], [31, 38, 1.4]],
      [[[22.4, 41.8], [28.6, 41.4], [28.8, 46.4], [22.4, 45]], 3, [[24, 43]], [26, 45, 1.1]],
      [[[29.8, 41.2], [36.2, 40.8], [36.6, 44.4], [29.8, 46.4]], 3, [[34, 42]], [32, 44, 1]]]) {
      const ch = capa().poly(pts);
      ch.pintar(g, F, { relieve: 2.5, max, separar: true });
      bisel(g, ch, F, Math.min(max, 4), 1);
      for (const [i, j] of rem) remache(g, F, i, j, true);
      herrumbre(g, F, oxi[0], oxi[1], oxi[2], pts.length + max);
    }
    /* Abolladura en la chapa grande. */
    pon(g, F, 1, [27, 37], [28, 37]); pon(g, F, 4, [27, 38], [28, 38]);
    /* Correa en bandolera con hebilla, y cinturón. */
    capa().linea(35.5, 34.5, 23.5, 46.6, 1.8).recortar(torso).pintar(g, M, { plano: 2 });
    surco(g, M, 4, 35, 34, 23, 46, M);
    capa().rect(29, 39, 3, 3).pintar(g, B, { plano: 3 }); pon(g, B, 4, [29, 39]); pon(g, B, 1, [31, 41]); pon(g, M, 0, [30, 40]);
    capa().rect(21, 46.4, 17, 3).pintar(g, M, { relieve: 1, separar: true });
    surco(g, M, 3, 21, 46, 37, 46, M);
    capa().rect(25, 46, 4, 3).pintar(g, B, { plano: 3 });
    pon(g, B, 4, [25, 46], [26, 46]); pon(g, B, 1, [28, 48], [27, 48]); pon(g, M, 0, [26, 47], [27, 47]);
    /* Taparrabos. */
    const tapa = capa().poly([[22.2, 49], [35.2, 49], [34, 54.2], [31, 53], [28.7, 56.4], [26, 53.4], [23.5, 54.2]]);
    tapa.pintar(g, Cu, { relieve: 1.8, max: 3, separar: true });
    surco(g, Cu, 0, 26, 50, 26, 53); surco(g, Cu, 0, 31, 50, 31, 52.5);
    /* Pierna de delante y pie envuelto, con un dedo y su uña asomando. */
    volumen(g, V, [["c", 25, 50.4, 22.6, 56.4, 2.8, 2.4, 2]], { separar: true, sesgo: -0.12 });
    const pieD = capa().rect(17, 57, 10, 6).off(26, 57).off(17, 57).off(18, 57);
    pieD.pintar(g, M, { relieve: 1.8, separar: true });
    vendas(17, 26, 57, 4);
    capa().ell(16, 61.2, 1.6, 1.4).pintar(g, V, { relieve: 1, separar: true });
    pon(g, HUESO, 4, [14, 62]); pon(g, HUESO, 3, [14, 61]);

    /* Hombrera con pincho. */
    volumen(g, F, [["e", 23.5, 34.6, 5.4, 4, 0]], { separar: true });
    volumen(g, F, [["c", 21.4, 31.4, 19, 25.6, 1.9, 0.5, 2]], { min: 1 });
    herrumbre(g, F, 26, 36, 1.2, 11);
    remache(g, F, 22, 33, true);

    /* Cuello y cabeza grande: cráneo, mofletes, ceja y nariz ganchuda. */
    volumen(g, V, [["c", 27, 31, 28, 34.5, 3.2, 3.2]], { max: 2, separar: true });
    const cab = volumen(g, V, [["e", 28, 24, 8.6, 7.6, 0], ["e", 23.6, 29.4, 6.6, 4.4, 1.5], ["c", 17.5, 23.6, 31, 23.2, 1.7, 1.7, 5.5]], { separar: true });
    /* Oreja de delante con el pabellón rojo y una muesca. */
    const orD = capa().poly([[21.6, 17.2], [20.3, 26.4], [13.2, 22.4], [4, 12.6], [13.2, 15.2]]);
    orD.pintar(g, V, { relieve: 2.6, separar: true });
    cada(capa().poly([[19.4, 19.6], [19, 23.6], [14.6, 21.2], [8.4, 15.6], [13.6, 17.6]]), (x, y) => pon(g, Ro, y - 13 < (x - 5) * 0.62 ? 2 : 1, [x, y]));
    pon(g, Ro, 3, [11, 16], [13, 17]);
    for (const [i, j] of [[5, 13], [7, 14], [9, 15], [11, 15]]) pon(g, V, 4, [i, j]);
    g.quitar(9, 19); g.quitar(10, 20); g.quitar(10, 19);
    /* Nariz ganchuda, por delante de la cara. */
    volumen(g, V, [["c", 20.5, 25, 16, 28.6, 2.2, 1.5, 0], ["e", 15.8, 29, 1.5, 1.6, 0.8]], { separar: true, sesgo: 0.05 });
    pon(g, V, 4, [19, 24], [18, 25]); pon(g, V, 0, [17, 30]); pon(g, NEGRO, 0, [16, 30]);
    /* Ojos amarillos bajo un ceño fruncido. */
    surco(g, NEGRO, 1, 17, 24, 21, 25, null); surco(g, NEGRO, 1, 24, 25, 29, 24, null);
    pon(g, AMBAR, 4, [18, 26]); pon(g, AMBAR, 3, [19, 26]); pon(g, NEGRO, 0, [20, 26]); pon(g, AMBAR, 1, [18, 27], [19, 27]);
    pon(g, AMBAR, 4, [24, 26]); pon(g, AMBAR, 3, [25, 26]); pon(g, NEGRO, 0, [26, 26], [26, 27]); pon(g, AMBAR, 2, [27, 26]); pon(g, AMBAR, 1, [24, 27], [25, 27]);
    pon(g, HUESO, 4, [24, 26]);
    pon(g, V, 1, [18, 28], [19, 28], [24, 28], [25, 28], [26, 28]);
    /* Boca de oreja a oreja: labio, dientes torcidos, colmillos y lengua. */
    surco(g, NEGRO, 0, 17, 31, 28, 31, null); pon(g, NEGRO, 0, [29, 30], [30, 29]);
    surco(g, NEGRO, 0, 18, 32, 26, 32, null);
    surco(g, GARGANTA, 3, 20, 32, 24, 32, null);
    for (const x of [17, 19, 21, 24, 26]) pon(g, HUESO, x === 21 ? 3 : 4, [x, 31]);
    pon(g, HUESO, 3, [22, 31]);
    pon(g, HUESO, 4, [19, 33], [25, 33]); pon(g, HUESO, 3, [19, 32], [25, 32]);
    surco(g, V, 3, 18, 34, 26, 34, null); pon(g, V, 1, [20, 34], [21, 34], [22, 34], [23, 34]);
    pon(g, V, 4, [16, 31], [28, 29]);
    /* Arruga del moflete y cicatriz roja. */
    trazo(g, V, 1, 22, 28, 27, 28.5, 29, 30);
    surco(g, Ro, 1, 31, 25, 33, 29, V); pon(g, Ro, 3, [31, 26], [32, 28]);
    /* Cuerno de hueso en el casco. */
    volumen(g, HUESO, [["c", 29.6, 16.6, 33.6, 12, 2.2, 1.8], ["c", 33.6, 12, 34.4, 8, 1.8, 1.3], ["c", 34.4, 8, 33, 4.4, 1.3, 0.6]], { min: 1 });
    trazo(g, HUESO, 1, 31, 14, 33, 15, 35, 13); trazo(g, HUESO, 1, 32.5, 9.5, 34, 10.5, 35.5, 9.5);
    /* Casco abollado: cúpula lisa, banda remachada, una abolladura y dos manchas de herrumbre. */
    const casco = volumen(g, F, [["e", 28, 22.6, 9.9, 8.4, 0]], { recorte: capa().rect(0, 0, W, 21), separar: true, sesgo: -0.14 });
    trazo(g, F, 4, 20, 19, 23, 14.5, 29, 14);
    pon(g, F, 3, [21, 17], [22, 16], [30, 14], [31, 14]);
    const banda = capa().rect(17, 20, 22, 3).recortar(capa().ell(28, 21.6, 10.6, 8));
    banda.pintar(g, F, { relieve: 1.2, separar: true });
    bisel(g, banda, F, 3, 0);
    for (const i of [20, 26, 32, 36]) remache(g, F, i, 21);
    pon(g, F, 1, [33, 16], [34, 17]); pon(g, F, 0, [33, 17]); pon(g, F, 4, [32, 18], [33, 18]);
    herrumbre(g, F, 25, 17, 1.3, 21); herrumbre(g, F, 36, 18, 1.1, 22);
    /* Cuchilla de carnicero. */
    const hoja = capa().poly([[5.4, 27.6], [13.2, 25], [16.4, 40.6], [8, 43.2]]);
    hoja.pintar(g, ACERO, { relieve: 2.6, min: 1, max: 3 });
    surco(g, ACERO, 4, 5.6, 28.4, 8.4, 42.6, null);
    surco(g, ACERO, 3, 6.6, 28.4, 9.4, 42.4);
    surco(g, ACERO, 1, 13.4, 26, 16, 40.2);
    surco(g, ACERO, 0, 13.6, 25.6, 16.4, 40);
    pon(g, ACERO, 4, [10, 30], [10, 31], [11, 33]);
    /* Agujero, una mella del filo y sangre seca. */
    pon(g, NEGRO, 1, [11, 28], [12, 28]); pon(g, ACERO, 0, [11, 29]); pon(g, ACERO, 4, [12, 29]);
    g.quitar(6, 34); g.quitar(6, 35);
    for (const [i, j, k] of [[7, 37, 3], [8, 37, 2], [7, 38, 2], [8, 39, 1], [9, 40, 2], [8, 41, 1], [9, 41, 1], [6, 31, 2], [7, 32, 1]]) pon(g, R.sangre, k, [i, j]);
    capa().linea(14.6, 38.4, 15.2, 49, 2.6).pintar(g, M, { relieve: 1, separar: true });
    for (let j = 45; j <= 48; j += 2) pon(g, M, 1, [15, j]);
    pon(g, B, 3, [14, 49], [15, 49]); pon(g, B, 4, [14, 49]);
    /* Brazo de delante, brazalete y puño. */
    volumen(g, V, [["c", 23.5, 36, 20.4, 42.3, 2.4, 2.1, 0], ["c", 20.4, 42.5, 17.4, 43.8, 2.1, 2, 0]], { separar: true, sesgo: -0.1 });
    capa().rect(18, 41.6, 3, 4).pintar(g, M, { relieve: 1, separar: true });
    pon(g, M, 4, [18, 42]);
    volumen(g, V, [["e", 15.8, 43.8, 3, 2.6, 0]], { separar: true });
    pon(g, V, 0, [14, 44], [15, 45]); pon(g, V, 1, [13, 43]);
    contornoSel(g);
    destello(g, ACERO, 6, 29, true);
    destello(g, F, 22, 15);
    return g;
  }

  /* ---------- Oso-lechuza: cuerpo de oso, cabeza de lechuza con pico y plumas ---------- */
  function osolechuza() {
    const g = new Rejilla(W, W), C = R.pelo.castano, O = PLUMA_O, M = R.madera, P = R.piedra;
    /* Brazo levantado de atrás, zarpa abierta. */
    const brazoA = volumen(g, C, [["c", 44.6, 29.5, 51, 20.4, 3.4, 3.1], ["c", 51, 20.4, 49.8, 11.4, 3.1, 2.9], ["e", 49.8, 10, 4.2, 3.4, 1]], { max: 3, sesgo: -0.12 });
    pelo(g, brazoA, C, [1, 1], 3, 0);
    garras(g, 49.8, 7.4, [[-4.4, -2.6], [-1.4, -4.6], [1.8, -4.6], [4.4, -2.6]]);
    /* Pierna de atrás. */
    const piernaA = volumen(g, C, [["e", 45.6, 49.6, 5.6, 8, 0]], { max: 2, sesgo: -0.1 });
    volumen(g, C, [["e", 44.4, 59.6, 6.8, 3.2, 0], ["e", 39, 60.6, 2.2, 2.2, 1]], { max: 2, separar: true, sesgo: -0.1 });
    pelo(g, piernaA, C, [0, 1], 4, 0);
    /* Cuerpo enorme. */
    const cuerpo = volumen(g, C, [["e", 36.2, 38.6, 14.3, 15, 0], ["e", 31.6, 45.1, 11.7, 9.1, 1]], { separar: true, rebote: true, sesgo: -0.04 });
    pelo(g, cuerpo, C, [1, 1], 5, 8);
    /* Mechones en el borde de la espalda. */
    crestas(g, C, [[50, 30, 1.4], [51, 36, 1.6], [51, 42, 1.6], [49.6, 48, 1.4]], 1);
    /* Pierna de delante y pie con garras. */
    const pierna = volumen(g, C, [["e", 28.2, 50.6, 6.4, 7.4, 3]], { separar: true, sesgo: -0.04 });
    volumen(g, C, [["e", 26.4, 59.4, 7.4, 3.4, 0], ["e", 19.6, 60.6, 2.4, 2.2, 1], ["e", 23, 60.8, 2.2, 2, 1]], { separar: true, sesgo: -0.04 });
    pelo(g, pierna, C, [1, 1], 9, 6);
    for (const [x, y] of [[17, 61], [17, 62], [20, 62], [21, 62]]) pon(g, HUESO, 4, [x, y]);
    pon(g, HUESO, 2, [18, 62], [22, 62]); pon(g, HUESO, 3, [16, 62], [36, 62]); pon(g, HUESO, 2, [37, 62]);
    /* Pecho de plumas en escamas. */
    const pecho = capa().ell(29, 40.4, 7.8, 11).recortar(cuerpo);
    volumen(g, O, [["e", 29, 40.4, 7.8, 11, 0]], { recorte: pecho, max: 3, sesgo: -0.02 });
    for (let j = 30, f = 0; j <= 52; j += 3, f++) for (let i = 18 + (f % 2 ? 2 : 0); i <= 40; i += 4)
      if (pecho.tiene(i, j) && pecho.tiene(i + 3, j) && pecho.tiene(i, j + 1)) {
        const t = tonoDe(g, i + 1, j, O);
        pon(g, O, Math.max(0, t - 1), [i, j], [i + 3, j], [i + 1, j + 1], [i + 2, j + 1]);
        if (t >= 2) pon(g, O, Math.min(4, t + 1), [i + 1, j]);
      }
    penumbra(g, pecho, O, 45, 52, 0.25);
    /* Gorguera de plumas pardas sobre los hombros. */
    const plumas = [[17.5, 27.4], [21.5, 29], [25.6, 29.6], [29.6, 29.4], [33.5, 28.4], [37.5, 27.6], [41, 27]];
    const gorguera = capa();
    for (const [i, j] of plumas) gorguera.poly([[i - 3, j - 4], [i + 3, j - 4], [i, j + 3.2]]);
    gorguera.pintar(g, M, { relieve: 1.8, separar: true });
    for (const [i, j] of plumas) { surco(g, M, 1, i + 0.6, j - 3, i + 0.3, j + 2, M); pon(g, M, 4, [Math.round(i - 1), Math.round(j - 3)]); }
    /* Cabeza de lechuza con penachos. */
    capa().poly([[16.7, 14], [14, 3.6], [22, 10.7]]).poly([[30.3, 10.7], [38, 3.6], [36.2, 14.6]]).pintar(g, M, { relieve: 2, separar: true });
    const cab = volumen(g, M, [["e", 25.8, 19.2, 10.4, 9.4, 0]], { separar: true });
    for (const [x0, y0, x1, y1] of [[15, 4.5, 17, 12], [37, 4.5, 34, 12]]) surco(g, O, 3, x0, y0, x1, y1, M);
    pon(g, O, 4, [14, 4], [15, 5], [37, 4], [36, 5]); pon(g, O, 2, [16, 9], [35, 9]);
    /* Plumas de la coronilla y la nuca: escamas pequeñas. */
    for (let j = 11, f = 0; j <= 27; j += 2, f++) for (let i = 26 + (f % 2) * 2; i <= 36; i += 4) {
      if (!cab.tiene(i, j) || Math.hypot(i - 23.2, (j - 19.9) * 1.15) < 9) continue;
      const t = tonoDe(g, i, j, M);
      if (t < 1) continue;
      pon(g, M, t - 1, [i, j + 1], [i + 1, j + 1]);
      if (t < 4) pon(g, M, t + 1, [i, j]);
    }
    /* Disco facial: anillo ocre y cara clara con plumillas radiales. */
    capa().ell(23.2, 20, 8.8, 7.8).pintar(g, O, { relieve: 1.8, min: 2, max: 3 });
    pon(g, O, 1, [32, 20], [32, 21], [31, 24], [29, 27]);
    const cara = capa().ell(23.2, 20.2, 7.5, 6.6);
    volumen(g, HUESO, [["e", 23.2, 20.2, 7.5, 6.6, 0]], { recorte: cara, min: 1 });
    for (let a = 0; a < 20; a++) {
      const an = (a / 20) * Math.PI * 2, x = Math.round(23.2 + Math.cos(an) * 6.1), y = Math.round(20.2 + Math.sin(an) * 5.3);
      const t = tonoDe(g, x, y, HUESO);
      if (t >= 2) pon(g, HUESO, t - 1, [x, y]);
    }
    pon(g, O, 2, [23, 14], [23, 15], [24, 14]);
    /* Ojos enormes ámbar con pupila y brillo. */
    for (const ex of [19.2, 27.4]) {
      capa().ell(ex, 20, 3.1, 2.9).pintar(g, NEGRO, { plano: 1 });
      volumen(g, AMBAR, [["e", ex, 20, 2.5, 2.4, 0]], { min: 2, sesgo: 0.1 });
      const cx = Math.round(ex), cy = 20;
      pon(g, NEGRO, 0, [cx - 1, cy], [cx, cy], [cx - 1, cy + 1], [cx, cy + 1], [cx, cy - 1]);
      pon(g, HUESO, 4, [cx - 2, cy - 1]); pon(g, HUESO, 3, [cx - 1, cy - 1]); pon(g, AMBAR, 4, [cx + 1, cy + 1], [cx + 1, cy + 2]);
      pon(g, AMBAR, 1, [cx - 2, cy + 2], [cx - 1, cy + 2]);
    }
    /* Ceño en V que se junta sobre el pico. */
    surco(g, M, 1, 16, 15, 22, 17, HUESO); surco(g, M, 1, 24, 17, 30, 15, HUESO);
    surco(g, M, 2, 16, 14, 21, 16, HUESO); surco(g, M, 2, 25, 16, 30, 14, HUESO);
    /* Pico ganchudo de piedra. */
    const pico = capa().poly([[21.2, 21], [25.2, 21], [25.2, 25], [23.2, 29], [21.2, 27.6], [20.6, 24.3]]);
    volumen(g, P, [["c", 23.2, 21.6, 22.6, 26.6, 2.2, 1.4, 0]], { recorte: pico, min: 1 });
    cada(pico, (x, y) => { if (!g.get(x, y) || g.rampa(x, y) !== P) pon(g, P, 1, [x, y]); });
    pon(g, P, 4, [21, 22], [22, 22]); pon(g, P, 3, [21, 23], [21, 24]);
    pon(g, P, 0, [24, 26], [24, 27], [23, 28]); pon(g, NEGRO, 0, [22, 26], [23, 26]);
    /* Brazo de delante con zarpa abierta hacia los héroes. */
    const brazo = volumen(g, C, [["c", 27.7, 30.8, 19.9, 38.6, 3.4, 3.2, 8], ["c", 19.9, 38.6, 13.4, 38.6, 3.2, 2.6, 8], ["e", 11.4, 38.6, 3.6, 3.4, 8]], { separar: true });
    pelo(g, brazo, C, [1, 1], 13, 5);
    garras(g, 8.6, 38.6, [[-4, -4], [-4.6, -0.6], [-4, 2.6], [-1.4, 4.6]]);
    pon(g, C, 1, [10, 37], [10, 40]);
    contornoSel(g);
    return g;
  }

  /* ---------- La guardia esqueleto: yelmo oxidado, escudo con la cruz roja y espada mellada ---------- */
  function esqueleto() {
    const g = new Rejilla(W, W), H = HUESO, F = R.hierro, Sg = R.sangre, T = R.tela.granate, Md = R.madera;
    /* Hueso largo: cápsula fina con una cabeza en cada punta. */
    const hueso = (x0, y0, x1, y1, r, op = {}) => volumen(g, H, [["c", x0, y0, x1, y1, r, r, 0], ["e", x0, y0, r + 0.45, r + 0.35, 0.3], ["e", x1, y1, r + 0.45, r + 0.35, 0.3]], { min: 1, separar: true, ...op });
    /* Brazo de atrás, que sujeta el escudo. */
    hueso(37, 24, 40.4, 29.4, 0.9, { max: 2 });
    hueso(40.4, 29.6, 43, 31, 0.7, { max: 2 });
    /* Escudo de cometa de hierro viejo con la cruz roja de Valdren. */
    const escudo = capa().poly([[38.6, 23.4], [56.4, 23.4], [56.4, 37], [47.5, 49.6], [38.6, 37]]);
    escudo.pintar(g, F, { relieve: 3.5, separar: true });
    const campo = capa().poly([[40.6, 25.4], [54.4, 25.4], [54.4, 36.4], [47.5, 46.6], [40.6, 36.4]]);
    volumen(g, F, [["e", 47.5, 33, 11, 15, 0]], { recorte: campo, max: 3, sesgo: -0.05 });
    bisel(g, campo, F, 1, 3);
    const cruz = capa().rect(46, 25.4, 3, 21).rect(41, 30, 13, 3).recortar(campo);
    cada(cruz, (x, y) => pon(g, Sg, lim(tonoDe(g, x, y, F) - 0, 1, 3), [x, y]));
    bisel(g, cruz, Sg, 4, 1);
    /* Desconchones, óxido, arañazos y una mella. */
    herrumbre(g, F, 42, 27, 1.4, 1); herrumbre(g, F, 52, 34, 1.8, 2); herrumbre(g, F, 44, 40, 1.3, 3); herrumbre(g, F, 52, 27, 1, 4);
    pon(g, Sg, 1, [47, 35], [46, 39], [50, 31]);
    for (const [i, j] of [[39, 24], [55, 24], [39, 36], [55, 36], [47, 48]]) remache(g, F, i, j, true);
    for (const [x, y] of [[56, 29], [56, 30], [55, 30], [56, 31]]) g.quitar(x, y);
    surco(g, F, 4, 50, 38, 53, 35, F); surco(g, F, 1, 50, 39, 53, 36, F);
    /* Piernas: fémur, rótula, tibia y peroné, y los huesos del pie. */
    hueso(34.6, 46, 36.2, 51.2, 1.1, { max: 3 });
    hueso(36, 52.6, 37, 58.4, 0.7, { max: 3 });
    volumen(g, H, [["e", 39.4, 60.6, 2.9, 1.6, 0], ["e", 37.6, 59.6, 1.6, 1.3, 1]], { max: 3, min: 1, separar: true });
    hueso(27, 46, 25.2, 51.2, 1.1);
    hueso(25.2, 52.6, 24, 58.4, 0.7);
    volumen(g, H, [["e", 22, 60.6, 3, 1.6, 0], ["e", 24.2, 59.6, 1.6, 1.3, 1]], { min: 1, separar: true });
    for (const i of [19, 21, 23, 38, 40, 42]) pon(g, H, 1, [i, 62]);
    pon(g, H, 4, [19, 60], [37, 60]);
    for (const [x, y] of [[25, 51], [36, 51]]) { pon(g, H, 4, [x - 1, y]); pon(g, H, 1, [x + 1, y + 1]); }
    /* Faldón granate hecho jirones, bajo un cinto. */
    const falda = capa().poly([[24.4, 37.6], [36.8, 37.6], [38.2, 48.8], [35.4, 46], [33.6, 50.8], [30.9, 46.8], [28.3, 50.2], [26.3, 46], [23, 48.8]]);
    falda.pintar(g, T, { relieve: 2.5, max: 3, separar: true });
    for (const [x0, x1] of [[28, 28.3], [31, 31], [34, 34.5]]) { surco(g, T, 1, x0, 40, x1, 46); surco(g, T, 3, x0 - 1, 40, x1 - 1, 45); }
    penumbra(g, falda, T, 44, 50, 0.3);
    capa().rect(24, 36.6, 13, 2).pintar(g, Md, { relieve: 1, separar: true });
    surco(g, Md, 3, 24, 36, 36, 36, Md);
    capa().rect(29, 36.6, 3, 2).pintar(g, R.bronce, { plano: 3 }); pon(g, R.bronce, 4, [29, 37]); pon(g, R.bronce, 1, [31, 38]);
    /* Crestas de la pelvis asomando sobre el cinto, y columna. */
    volumen(g, H, [["e", 25.6, 35.6, 2.6, 1.4, 0], ["e", 35, 35.6, 2.6, 1.4, 0]], { min: 1, separar: true, detras: true });
    for (let j = 31; j <= 35; j += 1.4) volumen(g, H, [["e", 30, j, 1.6, 0.9, 0]], { min: 1, separar: true });
    /* Caja torácica: hueco oscuro, columna detrás, esternón y costillas curvas. */
    const caja = capa().ell(30, 27.4, 7.2, 5.2);
    caja.pintar(g, NEGRO, { plano: 1 });
    for (let j = 24; j <= 31; j += 2) pon(g, H, 1, [31, j], [32, j]);
    for (let k = 0; k < 4; k++) {
      const y = 23.6 + k * 2.4, ab = k * 0.3;
      const c = capa().curva(29.4, y, 25 + k * 0.3, y - 0.2, 23.4 + k * 0.6, y + 2.6 - ab, 1.3, 1);
      c.curva(30.8, y, 35 - k * 0.3, y - 0.2, 36.6 - k * 0.6, y + 2.6 - ab, 1.3, 1);
      volumen(g, H, [["e", 30, y + 2, 7.4, 3.4, 0]], { recorte: c, min: 1 });
      cada(c, (x, yy) => { if (!c.tiene(x, yy - 1)) pon(g, H, Math.min(4, tonoDe(g, x, yy, H) + 1), [x, yy]); else if (!c.tiene(x, yy + 1)) pon(g, H, 1, [x, yy]); });
    }
    volumen(g, H, [["c", 30, 23.4, 30, 31.6, 1, 0.8, 1]], { min: 2 });
    /* Clavículas y vértebras del cuello. */
    hueso(23, 23, 29, 22.4, 0.7); hueso(31, 22.4, 37, 23, 0.7, { max: 3 });
    volumen(g, H, [["e", 30.6, 21.2, 1.4, 1, 0], ["e", 30.4, 19.6, 1.3, 0.9, 0]], { min: 1, separar: true });
    /* Cráneo: bóveda, pómulo, hocico huesudo y mandíbula desencajada. */
    volumen(g, H, [["e", 28.2, 11.6, 6.3, 5.8, 0], ["e", 25.4, 15.6, 4.2, 2.8, 1], ["e", 30.4, 15.6, 2.4, 2.2, 0.5]], { min: 1, separar: true, sesgo: 0.04 });
    const mand = capa().poly([[21.6, 18.4], [30.4, 18.2], [31.4, 21.4], [28.6, 21.4], [26.6, 22], [22.6, 21]]);
    volumen(g, H, [["e", 26.4, 19.4, 5.2, 2.6, 0]], { recorte: mand, min: 1, max: 3, separar: true });
    /* Cuencas hondas con brasas, cavidad nasal y dientes. */
    for (const [x0, y0, w] of [[22, 12, 3], [27, 12, 4]]) {
      for (let j = 0; j < 3; j++) for (let i = 0; i < w; i++) if (!(j === 2 && (i === 0 || i === w - 1))) pon(g, NEGRO, 0, [x0 + i, y0 + j]);
      pon(g, FUEGO, 4, [x0 + 1, y0 + 1]); pon(g, FUEGO, 3, [x0 + 2, y0 + 1]); pon(g, FUEGO, 2, [x0 + 1, y0 + 2]);
      pon(g, H, 1, [x0, y0 - 1 + 0], [x0 + w - 1, y0 + 3]);
    }
    pon(g, NEGRO, 0, [25, 15], [26, 15], [25, 16]);
    pon(g, H, 4, [23, 15], [24, 15], [29, 16], [30, 16]);
    pon(g, H, 1, [27, 16], [28, 16], [31, 15]);
    for (let i = 22; i <= 29; i++) pon(g, H, i % 2 ? 2 : 4, [i, 17]);
    surco(g, NEGRO, 0, 22, 18, 30, 18, null);
    for (let i = 23; i <= 29; i++) pon(g, H, i % 2 ? 4 : 2, [i, 19]);
    pon(g, H, 1, [27, 21], [28, 20]);
    /* Grieta del cráneo. */
    pon(g, H, 0, [33, 12], [32, 11], [33, 10]); pon(g, H, 4, [34, 12]);
    /* Yelmo de nasal, oxidado. */
    const yelmo = volumen(g, F, [["e", 28, 10, 7.6, 6.4, 0]], { recorte: capa().rect(0, 0, W, 10), separar: true, sesgo: -0.1 });
    const ala = capa().rect(20, 9, 17, 2);
    ala.pintar(g, F, { relieve: 1, separar: true });
    bisel(g, ala, F, 3, 0);
    capa().rect(25, 10, 2, 5).pintar(g, F, { relieve: 1, min: 2, max: 3 });
    pon(g, F, 4, [25, 10], [25, 11]); pon(g, F, 1, [26, 13], [26, 14]);
    trazo(g, F, 4, 22, 7, 24, 4.5, 28, 4);
    herrumbre(g, F, 31, 6, 1.5, 7); herrumbre(g, F, 34, 9, 1, 9);
    for (const i of [22, 30, 34]) remache(g, F, i, 9);
    /* Brazo de la espada, levantado hacia delante. */
    hueso(23, 24, 19.4, 28.8, 0.9);
    hueso(19.2, 29, 15.8, 31.6, 0.6); hueso(19.8, 30.2, 16.6, 32.6, 0.5, { max: 3 });
    /* Espada oxidada y mellada: filo claro, acanaladura y lomo. */
    const ux = -0.367, uy = -0.93, nx = 0.93, ny = -0.367;
    const [bx, by] = [13.6, 28.4];
    const hoja = capa().poly([[bx - nx * 1.6, by - ny * 1.6], [bx + nx * 1.6, by + ny * 1.6], [bx + ux * 18 + nx * 1.4, by + uy * 18 + ny * 1.4], [bx + ux * 21, by + uy * 21], [bx + ux * 18 - nx * 1.4, by + uy * 18 - ny * 1.4]]);
    hoja.pintar(g, F, { relieve: 1.2, min: 2, max: 3 });
    surco(g, F, 4, bx - nx * 1.2, by - ny * 1.2, bx + ux * 18.6 - nx * 1, by + uy * 18.6 - ny * 1, F);
    surco(g, F, 1, bx + ux * 1, by + uy * 1, bx + ux * 16, by + uy * 16, F);
    surco(g, F, 1, bx + nx * 1.4, by + ny * 1.4, bx + ux * 18 + nx * 1.2, by + uy * 18 + ny * 1.2, F);
    for (const t of [6, 10.5]) { const x = Math.round(bx + ux * t - nx * 1.4), y = Math.round(by + uy * t - ny * 1.4); g.quitar(x, y); g.quitar(x, y + 1); }
    herrumbre(g, F, 10, 19, 1, 31); herrumbre(g, F, 12, 24, 1, 32);
    /* Gavilanes, puño y pomo. */
    const guarda = capa().linea(bx - nx * 4.2 + 0.4, by - ny * 4.2 + 0.8, bx + nx * 4.2 + 0.4, by + ny * 4.2 + 0.8, 2);
    guarda.pintar(g, F, { relieve: 1, min: 2, separar: true });
    bisel(g, guarda, F, 4, 1);
    capa().linea(bx + 0.8, by + 2.2, bx + 2, by + 5.4, 1.6).pintar(g, Md, { relieve: 1, separar: true });
    volumen(g, F, [["e", bx + 2.4, by + 6.4, 1.4, 1.3, 0]], { min: 2, separar: true });
    /* Mano huesuda alrededor del puño. */
    volumen(g, H, [["e", 14.6, 32, 1.8, 1.6, 0]], { min: 1, separar: true });
    pon(g, H, 1, [14, 33], [15, 32]); pon(g, H, 4, [13, 31]);
    contornoSel(g);
    destello(g, F, 7, 10);
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
    for (const [x, y0, y1] of [[22, 43, 45]]) for (let y = y0; y <= y1; y++) if (g.rampa(x, y) !== HUESO) pon(g, BABA, y === y1 ? 4 : 3, [x, y]);
    /* Hilos de saliva entre las dos filas de dientes. */
    for (const [x0, y0, x1, y1] of [[41, 31, 42, 37], [47, 34, 47.6, 38]]) surco(g, HUESO, 2, x0, y0, x1, y1, GARGANTA);
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
    /* Gelatina: tonos lisos con una franja estrecha de tramado en cada transición. */
    const banda = (c, f, tonos) => cada(c, (x, y) => {
      const v = lim(f(x, y), 0, 0.999) * tonos.length, i = Math.floor(v), r = v - i;
      const k = r > 0.86 && umbral(x, y) < (r - 0.86) / 0.14 ? Math.min(i + 1, tonos.length - 1) : i;
      pon(g, E, tonos[k], [x, y]);
    });
    banda(frente, (x, y) => 1.08 - ((x - X0) / L) * 0.4 - ((y - Y0) / (Y1 - Y0)) * 0.62, [1, 2, 2, 3, 3]);
    banda(arriba, (x, y) => 1 - ((x - X0 - (Y0 - y)) / L) * 0.6, [3, 4]);
    banda(lado, (x, y) => 1 - (y - (Y0 - PR)) / (Y1 - Y0 + PR) * 1.1, [0, 1, 1, 2]);
    /* Aristas del fondo, vistas a través de la gelatina (más oscuras: refractan). */
    for (const [x0, y0, x1, y1] of [[X0 + PR, Y0 - PR + 1, X0 + PR, Y1 - PR], [X0 + PR, Y1 - PR, X1 + PR, Y1 - PR], [X0, Y1, X0 + PR, Y1 - PR]])
      surco(g, E, 1, x0, y0, x1, y1, E);
    /* Lo que flota dentro, teñido de verde. */
    const dentro = new Rejilla(W, W);
    const tH = tinte(HUESO, E, 0.36), tF = tinte(R.hierro, E, 0.3), tB = tinte(ORO, E, 0.38), tM = tinte(R.madera, E, 0.32), tC = tinte(R.tela.granate, E, 0.4);
    /* Espada atravesada, con su guarda y puño. */
    const esp = capa().linea(19, 56, 36, 29, 2.6);
    esp.pintar(dentro, tF, { relieve: 1, min: 2 });
    surco(dentro, tF, 4, 18, 55, 35, 28, tF);
    capa().linea(32, 33, 39.5, 37.5, 1.8).pintar(dentro, tB, { relieve: 1, min: 2 });
    capa().linea(37, 28, 40.4, 22.6, 1.8).pintar(dentro, tM, { relieve: 1 });
    pon(dentro, tB, 3, [41, 21], [40, 21]); pon(dentro, tB, 4, [40, 21]);
    /* Calavera, de perfil, con la mandíbula suelta debajo. */
    volumen(dentro, tH, [["e", 13, 31, 5.2, 4.8, 0], ["e", 11, 35.4, 3.4, 2.2, 0]], { min: 1 });
    pon(dentro, tH, 0, [9, 30], [10, 30], [9, 31], [10, 31], [13, 30], [14, 30], [13, 31], [14, 31], [12, 33], [11, 34]);
    for (let i = 9; i <= 14; i += 2) pon(dentro, tH, 0, [i, 36]);
    volumen(dentro, tH, [["e", 12.6, 39.4, 3.4, 1.4, 0]], { min: 1, max: 3 });
    /* Fémur y costillas sueltas. */
    volumen(dentro, tH, [["c", 6.6, 49, 16.4, 45.4, 0.9, 0.9, 0], ["e", 6, 49.4, 1.6, 1.4, 0], ["e", 17, 45, 1.6, 1.4, 0]], { min: 1 });
    for (const k of [0, 1, 2, 3]) capa().curva(22 + k * 3.4, 48, 24 + k * 3.4, 43.6, 27.5 + k * 3.4, 46, 1).pintar(dentro, tH, { plano: 3 });
    /* Yelmo hundido y un jirón de capa. */
    volumen(dentro, tF, [["e", 35, 53, 4.4, 3.6, 0]], { min: 1, recorte: capa().rect(0, 0, W, 55) });
    surco(dentro, tF, 0, 31, 54, 39, 54, null); surco(dentro, tF, 3, 31, 55, 39, 55, null);
    /* Monedas posadas en el fondo. */
    for (const [i, j] of [[8, 59], [12, 60], [25, 60], [29, 59], [40, 60], [26, 51], [19, 27]]) {
      pon(dentro, tB, 3, [i, j], [i + 1, j]); pon(dentro, tB, 4, [i, j]); pon(dentro, tB, 1, [i, j + 1], [i + 1, j + 1]);
    }
    /* Se copia dentro del frente, con un halo oscuro alrededor (la gelatina refracta). */
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      if (!frente.tiene(i, j) || dentro.get(i, j)) continue;
      if (dentro.get(i - 1, j) || dentro.get(i, j - 1)) { const t = tonoDe(g, i, j, E); if (t > 1) pon(g, E, t - 1, [i, j]); }
    }
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const c = dentro.get(i, j);
      if (c && frente.tiene(i, j)) g.set(i, j, c, dentro.rampa(i, j));
    }
    /* Cáusticas: la luz que atraviesa la gelatina se concentra en el fondo. */
    for (const [x0, y0, cx, cy, x1, y1] of [[6, 57, 10, 55, 14, 57], [17, 58, 22, 56, 26, 58], [29, 57, 33, 55.5, 37, 57.4], [9, 52, 12, 50.5, 15, 52]])
      trazo(g, E, 3, x0, y0, cx, cy, x1, y1, E);
    /* Burbujas: aro claro arriba a la izquierda y sombra abajo. */
    for (const [i, j, r] of [[27, 37, 1.6], [9, 44, 0], [38, 43, 0], [21, 39, 0], [33, 27, 1], [42, 48, 1], [16, 52, 0], [44, 17, 1], [26, 15, 0], [52, 30, 1], [7, 26, 0]]) {
      if (r >= 1) {
        const c = capa().ell(i, j, r, r);
        cada(c, (x, y) => pon(g, E, (x - i) + (y - j) < 0 ? 4 : 2, [x, y]));
        pon(g, HUESO, 4, [Math.round(i - r * 0.5), Math.round(j - r * 0.5)]);
      } else { pon(g, Hj, 4, [i, j]); pon(g, E, 1, [i + 1, j + 1]); }
    }
    /* Aristas de delante: brillantes arriba y a la izquierda, con su reflejo interior. */
    for (let i = X0; i <= X1; i++) pon(g, Hj, 4, [i, Y0]);
    for (let i = X0 + 1; i <= X1 - 1; i++) pon(g, E, 4, [i, Y0 + 1]);
    for (let j = Y0; j <= Y1; j++) pon(g, Hj, j < Y0 + 22 ? 4 : 3, [X0, j]);
    for (let j = Y0 + 1; j <= Y1; j++) pon(g, E, j < Y0 + 16 ? 4 : 3, [X0 + 1, j]);
    for (let j = Y0; j <= Y1; j++) pon(g, E, 2, [X1, j]);
    surco(g, Hj, 4, X0, Y0, X0 + PR, Y0 - PR, null);
    surco(g, Hj, 4, X0 + PR, Y0 - PR, X1 + PR, Y0 - PR, null);
    surco(g, Hj, 3, X1 + 0.5, Y0, X1 + PR + 0.5, Y0 - PR, null);
    for (let j = Y0 - PR + 1; j <= Y1 - PR; j++) pon(g, E, 2, [X1 + PR, j]);
    /* Reflejos: ventana de luz arriba a la izquierda y vetas brillantes en la cara de arriba. */
    for (const [x, y] of [[5, 26], [6, 26], [7, 26], [8, 26], [9, 26], [5, 27], [5, 28], [5, 29], [5, 30], [5, 31], [6, 27]]) pon(g, HUESO, 4, [x, y]);
    pon(g, Hj, 4, [11, 26], [5, 33], [7, 28], [7, 27]);
    surco(g, Hj, 4, 15, 13, 26, 13, null); pon(g, HUESO, 4, [15, 13], [16, 13], [17, 13]);
    surco(g, Hj, 4, 12, 16, 15, 16, null);
    for (const [x0, y0, x1, y1] of [[8, 34, 11, 31], [40, 27, 43, 24], [48, 26, 52, 22]]) surco(g, Hj, 4, x0, y0, x1, y1, null);
    /* Babas que gotean por el frente y charco en la base. */
    for (const [i, h] of [[9, 3], [20, 5], [33, 2], [41, 4]]) for (let k = 0; k < h; k++) pon(g, E, k === h - 1 ? 4 : 3, [i, Y0 + 1 + k]);
    for (let i = 1; i <= X1 + 3; i++) {
      if (!g.get(i, Y1)) pon(g, E, 2, [i, Y1]);
      if (i < X0 && !g.get(i, Y1 - 1) && i > 1) pon(g, E, 3, [i, Y1 - 1]);
    }
    pon(g, Hj, 4, [2, 61]); pon(g, E, 1, [X1 + 1, 61], [X1 + 2, 62]);
    contornoSel(g, E[0], E);
    return g;
  }

  /* ---------- El gólem de hierro: placas remachadas, junturas al rojo y un horno en el pecho ---------- */
  function golem() {
    const g = new Rejilla(W, W), B = R.hierro, Fu = FUEGO, CAL = CALIENTE;
    /* Juntura al rojo: brasa entre dos placas, que se aviva y se apaga a trozos. */
    const juntura = (x0, x1, y, viva = 3) => {
      for (let x = x0; x <= x1; x++) if (g.rampa(x, y) === B || g.rampa(x, y) === CAL) pon(g, Fu, viva - (hash(x, y, 9) < 0.35 ? 1 : 0) + (hash(x, y, 4) < 0.15 ? 1 : 0), [x, y]);
    };
    /* Placa: cuerpo con relieve, canto de luz y de sombra. */
    const placa = (c, op = {}) => { c.pintar(g, B, { relieve: 2.5, separar: true, ...op }); bisel(g, c, B, Math.min(op.max ?? 4, 3), 1); return c; };
    /* Brazo de atrás. */
    volumen(g, B, [["c", 47.8, 21.7, 52.6, 33, 3.2, 3], ["c", 52.6, 33, 53.6, 42, 3.4, 3.6]], { max: 2, sesgo: -0.1 });
    juntura(49, 57, 34, 2);
    volumen(g, B, [["e", 53.6, 46.6, 5.2, 4.9, 0]], { max: 2, separar: true, sesgo: -0.1 });
    for (const y of [45, 48]) surco(g, B, 0, 49, y, 58, y, B);
    /* Pierna de atrás. */
    placa(capa().rect(36, 45, 10, 12), { max: 2 });
    placa(capa().rect(35, 57, 14, 6).off(48, 57), { max: 2 });
    juntura(36, 45, 50, 2);
    /* Torso enorme: pecho abombado y vientre de placas. */
    const pecho = volumen(g, B, [["e", 32.2, 26.6, 16.9, 12.4, 0]], { separar: true, sesgo: 0.1, plano: 0.7 });
    const vientre = capa().rect(20, 37, 24, 9).off(20, 45).off(43, 45);
    for (const [x0, x1, y0, y1] of [[20, 31, 37, 40], [32, 43, 37, 40], [21, 31, 41, 45], [32, 42, 41, 45]]) placa(capa().rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1).recortar(vientre), { max: 3 });
    juntura(21, 42, 36, 3);
    for (const [i, j] of [[22, 38], [29, 38], [34, 38], [41, 38], [23, 42], [29, 42], [34, 42], [40, 42]]) remache(g, B, i, j, true);
    /* Placas del pecho: costuras curvas y remaches. */
    trazo(g, B, 1, 24, 34, 32, 37, 41, 34); 
    for (const [i, j] of [[18, 28], [46, 28], [24, 17], [40, 17], [32, 15]]) remache(g, B, i, j, true);
    /* Horno del pecho con rejilla. */
    capa().ell(32.2, 25.6, 7.2, 6.6).pintar(g, B, { plano: 0 });
    const aro = capa().ell(32.2, 25.6, 7.2, 6.6).quitarEll(32.2, 25.6, 6, 5.4);
    volumen(g, B, [["e", 32.2, 25.6, 7.2, 6.6, 0]], { recorte: aro, min: 1 });
    const horno = capa().ell(32.2, 25.6, 5.4, 4.9);
    cada(horno, (x, y) => {
      const d = Math.hypot(x - 32.2, (y - 26.6) * 1.1);
      pon(g, Fu, d < 2 ? 4 : d < 3.3 ? 3 : d < 4.5 ? 2 : 1, [x, y]);
    });
    for (const x of [29, 32, 35]) cada(capa().rect(x, 19, 1, 14).recortar(horno), (xx, y) => pon(g, B, y < 24 ? 3 : 1, [xx, y]));
    cada(capa().rect(26, 25, 13, 1).recortar(horno), (x, y) => pon(g, B, 2, [x, y]));
    pon(g, B, 4, [28, 20], [29, 19], [30, 19]);
    /* Resplandor: el hierro alrededor del horno se calienta, con un borde tramado. */
    const calentar = (cx, cy, r) => {
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x - cx, (y - cy) * 1.15) / r, t = tonoDe(g, x, y, B);
        if (t < 0 || d > 1) continue;
        if (d < 0.62) pon(g, CAL, t, [x, y]);
      }
    };
    calentar(32.2, 27.4, 9.5);
    /* Pierna de delante: muslo, rodillera y pie. */
    placa(capa().rect(18, 45, 12, 12));
    juntura(18, 29, 50, 4);
    surco(g, B, 1, 19, 51, 29, 51, B);
    volumen(g, B, [["e", 23.6, 51, 4.2, 2.8, 2]], { separar: true });
    remache(g, B, 22, 50, true);
    placa(capa().rect(12, 57, 18, 6).off(12, 57).off(13, 57));
    remache(g, B, 15, 58, true); remache(g, B, 24, 58, true);
    surco(g, B, 0, 13, 60, 29, 60, B);
    /* Hombrera de atrás y respiradero con gas venenoso. */
    volumen(g, B, [["e", 47.2, 19.8, 6.5, 5.9, 0]], { max: 3, separar: true, plano: 0.85 });
    remache(g, B, 46, 17, true);
    placa(capa().rect(42, 10, 6, 5), { max: 3 });
    surco(g, NEGRO, 0, 43, 11, 46, 11, null); surco(g, BABA, 1, 43, 12, 46, 12, null);
    /* Cabeza baja entre los hombros: yelmo de cubo con visera de rendija ardiente. */
    placa(capa().rect(19, 13, 12, 5), { max: 2 });
    const cab = capa().rect(14, 5, 14, 11).off(14, 5).off(27, 5).off(14, 15);
    placa(cab);
    volumen(g, B, [["e", 20.5, 9, 7.5, 6, 0]], { recorte: cab, sesgo: 0.02 });
    bisel(g, cab, B, 3, 1);
    surco(g, B, 0, 15, 9, 26, 9); surco(g, B, 0, 15, 11, 26, 11);
    for (let x = 15; x <= 26; x++) pon(g, x <= 22 ? Fu : B, x <= 22 ? (x <= 17 ? 4 : x <= 20 ? 3 : 2) : 0, [x, 10]);
    pon(g, Fu, 3, [16, 9], [17, 9]); pon(g, Fu, 2, [16, 11], [17, 11]);
    pon(g, B, 4, [15, 6], [16, 6], [17, 6], [18, 6], [15, 7]);
    surco(g, B, 1, 21, 6, 21, 8); surco(g, B, 3, 20, 6, 20, 8);
    for (const [i, j] of [[16, 13], [18, 13], [17, 14]]) pon(g, NEGRO, 0, [i, j]);
    remache(g, B, 24, 6, true); remache(g, B, 25, 13);
    /* Barbilla de placas (una barba de hierro). */
    const barba = capa().poly([[14, 14.6], [27, 14.6], [25.7, 19.6], [20.5, 21.4], [15.3, 19]]);
    barba.pintar(g, B, { relieve: 1.8, max: 3, separar: true });
    for (const x of [17, 20, 23]) { surco(g, B, 0, x, 15, x, 21, B); surco(g, B, 3, x - 1, 15, x - 1, 20, B); }
    for (const x of [15, 18, 21, 24]) pon(g, R.bronce, 3, [x, 15]);
    pon(g, R.bronce, 4, [15, 15]);
    /* Hombrera y brazo de delante con el puño. */
    const hombro = volumen(g, B, [["e", 16.6, 24.3, 7.8, 7, 2]], { separar: true, plano: 0.85, sesgo: 0.04 });
    trazo(g, B, 1, 9.5, 27, 16, 31, 23.5, 27.6, B);
    remache(g, B, 13, 22, true); remache(g, B, 18, 20, true); remache(g, B, 20, 26, true);
    volumen(g, B, [["c", 15, 30, 11.6, 37, 3, 3], ["c", 11.6, 37.6, 10.2, 42.4, 3.6, 3.8]], { separar: true });
    juntura(7, 15, 35, 4);
    surco(g, B, 1, 8, 36, 15, 36, B);
    const puno = volumen(g, B, [["e", 10.1, 47.6, 6.2, 5.5, 1]], { separar: true });
    for (const y of [46, 50]) { surco(g, B, 0, 4, y, 15, y, B); surco(g, B, 3, 4, y + 1, 14, y + 1, B); }
    surco(g, B, 0, 9, 43, 9, 46, B);
    remache(g, B, 12, 44);
    /* Óxido en la parte baja y arañazos. */
    herrumbre(g, B, 38, 43, 1.4, 41); herrumbre(g, B, 22, 54, 1.2, 42); herrumbre(g, B, 9, 52, 1, 43); herrumbre(g, B, 44, 31, 1.2, 44);
    surco(g, B, 4, 40, 21, 44, 18, B); surco(g, B, 1, 40, 22, 44, 19, B);
    contornoSel(g);
    /* Volutas de gas que salen del respiradero. */
    for (const [i, j, t] of [[44, 9, 3], [45, 8, 2], [45, 7, 3], [46, 6, 2], [47, 5, 3], [48, 4, 1], [47, 3, 2], [46, 2, 1], [44, 8, 1]]) if (!g.get(i, j)) pon(g, BABA, t + 1, [i, j]);
    destello(g, Fu, 31, 27); destello(g, Fu, 33, 27);
    return g;
  }

  window.MONSTRUOS_64 = window.MONSTRUOS_64 || {};
  Object.assign(window.MONSTRUOS_64, { rata, goblin, osolechuza, esqueleto, mimico, cubo, golem });
})();
