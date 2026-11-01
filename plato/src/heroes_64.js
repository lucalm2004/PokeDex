/* Dados y Mazmorras · héroes a 64×64.
   HEROES_64.componer(aspecto) devuelve una Rejilla NUEVA de 64×64 mirando a la derecha, con los pies en la fila 62
   (la 63 queda para el contorno). Acepta el mismo aspecto que HEROES.componer y HEROES_HD.componer:
   { raza, clase, piel, pelo, tela, peinado, barba, gesto, cuerpo, objeto, extras, espejo, sinContorno }
   y reutiliza sus tablas (RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS), así que todo aspecto guardado sigue valiendo.
   Proporciones heroicas (unas cuatro cabezas), luz desde arriba a la izquierda, rampas de 5 tonos con desplazamiento
   de matiz (sombras más frías, luces más cálidas) y contorno selectivo: oscuro por fuera en la sombra y teñido del
   color vecino en el lado iluminado. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R0, umbral } = PX;
  const W = 64, H = 64;
  const CONTORNO = PX.CONTORNO || "#140b07";

  /* ---------- Tablas compartidas con el arte antiguo ---------- */
  const H0 = typeof HEROES !== "undefined" ? HEROES : {};
  const RAZAS = H0.RAZAS || {
    humano: { cuerpo: "normal", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["castano", "negro", "cobrizo", "rubio", "canoso"] },
    elfo: { cuerpo: "esbelto", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["rubio", "canoso", "negro", "cobrizo", "castano"] },
    enano: { cuerpo: "ancho", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["cobrizo", "castano", "negro", "canoso", "rubio"], barba: true },
    mediano: { cuerpo: "bajo", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["castano", "rubio", "cobrizo", "negro", "canoso"] },
    semiorco: { cuerpo: "fornido", pieles: ["verde", "gris", "oliva"], pelos: ["negro", "castano", "canoso"] },
    tiefling: { cuerpo: "normal", pieles: ["roja", "violeta", "azul"], pelos: ["negro", "violeta", "canoso", "cobrizo"] },
    draconido: { cuerpo: "fornido", pieles: ["bronce", "roja", "esmeralda", "plata", "azul"], pelos: [], sinPelo: true },
    gnomo: { cuerpo: "bajo", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["rubio", "canoso", "cobrizo", "violeta", "castano"] },
    satiro: { cuerpo: "normal", pieles: ["oliva", "clara", "morena", "oscura"], pelos: ["castano", "negro", "cobrizo", "rubio", "canoso"] }
  };
  const TELA_CLASE = H0.TELA_CLASE || { guerrero: "granate", barbaro: "terracota", picaro: "negro", explorador: "oliva", mago: "azul", brujo: "violeta", clerigo: "blanco", bardo: "ocre" };
  const PEINADOS = H0.PEINADOS || ["corto", "largo", "recogido", "rizado", "rapado"];
  const TELAS = H0.TELAS || Object.keys(R0.tela);
  const GESTOS = H0.GESTOS || ["normal", "dolor", "alegre", "furia"];

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
  /* Gira el matiz h hacia el objetivo como mucho «grados». */
  const hacia = (h, obj, grados) => { const d = ((obj - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), grados); };
  const AJUSTE = [[255, 16, 0.05], [255, 8, 0.03], [0, 0, 0], [52, 5, 0], [52, 11, -0.02]];
  const cacheMatiz = new Map();
  /* Rampa con las sombras hacia el violeta y las luces hacia el amarillo, sin cambiar la luminosidad. */
  function matizar(ram) {
    if (!Array.isArray(ram) || ram.length !== 5) return ram;
    if (cacheMatiz.has(ram)) return cacheMatiz.get(ram);
    const o = ram.map((c, i) => {
      if (typeof c !== "string" || c[0] !== "#" || c.length !== 7) return c;
      const [h, s, l] = aHsl(aRgb(c));
      const [obj, gr, ds] = AJUSTE[i];
      if (!gr) return c;
      const s2 = s < 0.08 ? s + (i < 2 ? 0.07 : 0.05) : Math.max(0, Math.min(1, s + ds));
      const h2 = s < 0.08 ? obj : hacia(h, obj, gr);
      return deHsl(h2, s2, l);
    });
    cacheMatiz.set(ram, o);
    return o;
  }
  /* La tela negra, con las luces algo más abiertas para que capuchas y capas se lean sobre fondos oscuros. */
  if (R0.tela && R0.tela.negro) cacheMatiz.set(R0.tela.negro, ["#0b080d", "#1a141c", "#2e2633", "#4a3f50", "#716478"]);
  /* Todas las rampas del motor, matizadas (misma forma que PX.RAMPAS). */
  const R = {};
  for (const [k, v] of Object.entries(R0)) {
    if (Array.isArray(v)) R[k] = matizar(v);
    else { R[k] = {}; for (const [k2, v2] of Object.entries(v)) R[k][k2] = matizar(v2); }
  }

  /* ---------- Colores propios ---------- */
  const OJOS = "#160d10";
  const BLANCO = "#f2eadc";
  const BRILLO = "#fffdf4";
  const ACERO = ["#191b29", "#353c52", "#5f6a80", "#a3afbf", "#f1f3ec"];       // filos y hojas
  const PLACA = ["#1a1a27", "#363849", "#5c6274", "#8f98a8", "#d3d9dc"];       // armadura de placas
  const MALLA = ["#17171f", "#2e2f3c", "#4c4f5e", "#757b8a", "#a6adb7"];       // cota de malla
  const CUERO = ["#22110f", "#43231a", "#6c3e25", "#985f34", "#c58a50"];
  const CUERO2 = ["#1c1210", "#33221c", "#523629", "#77513a", "#a07552"];      // cuero oscuro de botas y correas
  const PELLIZA = ["#1d1a22", "#3a3438", "#615650", "#8f8275", "#c0b2a0"];     // piel de lobo
  const ORO = ["#3a1f10", "#6e4518", "#b57d27", "#e9bf4e", "#fff2a6"];
  const MADERA = ["#24130e", "#432616", "#6a4022", "#946234", "#c08d55"];
  const PLUMA = ["#5a4c52", "#8f8079", "#c4b8a8", "#e9e1d2", "#fffaf0"];
  const IRISES = { castano: "#5a3a22", verde: "#3f7a3c", azul: "#3d6fa8", gris: "#6c7882", ambar: "#b07a1c" };
  const SUDOR = R.mar;
  const MEJILLA = ["#5a1c22", "#8a2e34", "#c2525a", "#e88078", "#f8a898"];
  const BARBAS = Object.values(R.pelo);

  /* ---------- Utilidades ---------- */
  /* Capa que solo sombrea la caja que ocupa (mismo resultado que Capa.pintar, mucho más barato a 64×64). */
  class Capa64 extends Capa {
    copia() { const o = new Capa64(this.w, this.h); o.m = this.m.slice(); return o; }
    /* Borra todas las filas desde «fila» hacia abajo. */
    borrarDesde(fila) { this.m.fill(0, Math.max(0, fila) * this.w); return this; }
    /* Mismo criterio que Capa.poly (centro del píxel dentro, regla par-impar), recorriendo solo los cruces de cada fila. */
    poly(pts) {
      let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
      for (const [x, y] of pts) { if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; }
      const n = pts.length, cs = [];
      for (let y = Math.max(0, Math.floor(ay)); y <= Math.min(this.h - 1, Math.ceil(by)); y++) {
        cs.length = 0;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y)) cs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
        }
        if (!cs.length) continue;
        for (let x = Math.max(0, Math.floor(ax)); x <= Math.min(this.w - 1, Math.ceil(bx)); x++) {
          let par = false;
          for (const c of cs) if (x < c) par = !par;
          if (par) this.m[y * this.w + x] = 1;
        }
      }
      return this;
    }
    pintar(rej, rampa, op = {}) {
      const w = this.w, h = this.h, m = this.m;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return rej;
      if (op.plano !== undefined) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const R = op.relieve || 4;
      const d = new Float32Array(w * h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * w + x; d[i] = m[i] ? 1e6 : 0; }
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
      const A = new Float32Array(w * h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (m[i]) { const v = Math.min(d[i], R) / R; A[i] = Math.sqrt(1 - (1 - v) * (1 - v)); }
      }
      const alto = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : A[y * w + x]);
      const L = op.luz || [-0.5, -0.62, 0.6];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.4, sesgo = op.sesgo || 0;
      const tiene = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      const res = [];
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
          const borde = (!tiene(x + 1, y) && rej.get(x + 1, y)) || (!tiene(x - 1, y) && rej.get(x - 1, y)) || (!tiene(x, y + 1) && rej.get(x, y + 1)) || (!tiene(x, y - 1) && rej.get(x, y - 1));
          if (borde) t = Math.min(t, op.separar === true ? 1 : op.separar);
        }
        rej.set(x, y, rampa[Math.min(t, rampa.length - 1)], rampa);
      }
      return rej;
    }
  }
  const capa = () => new Capa64(W, H);
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pon = (g, ram, k, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[lim(k, 0, 4)], ram); return g; };
  const tono = (g, x, y) => { const r = g.rampa(x, y); return r ? r.indexOf(g.get(x, y)) : -1; };
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), i = tono(g, x, y);
    if (!r || i < 0) return;
    g.set(x, y, r[lim(i + d, 0, r.length - 1)], r);
  }
  function cada(g, ram, x0, y0, x1, y1, fn) {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++)
        if (g.rampa(x, y) === ram) fn(x, y, tono(g, x, y));
  }
  /* Línea de un píxel en un tono, solo sobre lo que ya es de la rampa «soloSobre» (o sobre todo si es null). */
  function surco(g, ram, k, x0, y0, x1, y1, soloSobre = ram) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!soloSobre || g.rampa(x, y) === soloSobre) g.set(x, y, ram[k], ram);
    }
  }
  /* Pliegue de tela: surco oscuro con su brillo a la izquierda. */
  function pliegue(g, ram, x0, y0, x1, y1) {
    surco(g, ram, 3, x0 - 1, y0 + 1, x1 - 1, y1, ram);
    surco(g, ram, 1, x0, y0, x1, y1, ram);
  }
  /* Cota de malla: anillas en filas alternas, cada una con su brillo arriba y su hueco abajo. */
  function malla(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const f = ((x + ((y >> 1) & 1)) & 1);
      if ((y & 1) === 0) { if (f === 0) g.set(x, y, ram[Math.min(4, k + 1)], ram); }
      else if (f === 1) g.set(x, y, ram[Math.max(0, k - 1)], ram);
    });
  }
  /* Ribete en el borde inferior de una capa. */
  function ribete(g, c, ram, k = 3, filas = 1) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      for (let f = 1; f <= filas; f++) if (!c.tiene(x, y + f)) { g.set(x, y, ram[f === 1 ? k - 1 : k], ram); break; }
    }
  }
  /* Oscurece con tramado ligero la parte baja de una tela (la luz viene de arriba). */
  function penumbra(g, ram, x0, y0, x1, y1, fuerza = 0.45) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => { if (k > 1 && (y - y0) / Math.max(1, y1 - y0) > umbral(x, y) + fuerza) g.set(x, y, ram[k - 1], ram); });
  }
  /* Brillo especular: una cruz pequeña con el centro en el tono más claro. */
  function destello(g, ram, x, y, grande) {
    pon(g, ram, 4, [x, y]);
    if (grande) { pon(g, ram, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]); g.set(x, y, BRILLO, ram); }
  }
  const hash = (...v) => { let h = 2166136261; for (const n of v) { h ^= n & 0xffff; h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const hashTexto = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

  /* Línea oscura alrededor de una capa sobre lo que ya hay pintado detrás: el tono más hondo del material
     vecino, así el objeto se separa del cuerpo sin una raya negra. */
  function perfilar(g, c) {
    const marcas = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (c.tiene(x, y) || !g.get(x, y)) continue;
      if (c.tiene(x - 1, y) || c.tiene(x + 1, y) || c.tiene(x, y - 1) || c.tiene(x, y + 1)) marcas.push([x, y]);
    }
    for (const [x, y] of marcas) { const r = g.rampa(x, y); g.set(x, y, r ? r[0] : CONTORNO, r); }
  }

  /* ---------- Contorno selectivo ----------
     Por fuera, en el lado de la luz (arriba e izquierda) el contorno toma la sombra más honda del color vecino;
     en el lado de la sombra es casi negro, teñido del material. */
  const cacheOscuro = new Map();
  const oscuro = c => { if (!cacheOscuro.has(c)) cacheOscuro.set(c, mezcla(c, "#0b0610", 0.62)); return cacheOscuro.get(c); };
  function contornoSel(g) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      let col = CONTORNO;
      const vec = ab ? [x, y + 1] : de ? [x + 1, y] : iz ? [x - 1, y] : [x, y - 1];
      const ram = g.rampa(vec[0], vec[1]);
      if (!iz && !ar && ram && y < H - 1) {
        col = ram[0];
        /* Muy arriba a la izquierda, donde la luz pega de lleno, el borde se aclara un poco más. */
        if (!ab && de && tono(g, x + 1, y) >= 3) col = mezcla(ram[0], ram[1], 0.5);
      } else if (ram) col = oscuro(ram[0]);
      nuevos.push([x, y, col]);
    }
    for (const [x, y, col] of nuevos) g.set(x, y, col);
    return g;
  }

  /* ---------- Plantilla del cuerpo ---------- */
  const CUERPOS = {
    normal: { cabY: 14, rx: 6.2, ry: 6.8, torTop: 23, torBot: 38, hombros: 18, cintura: 13, pierna: 5, grosor: 4, abre: 3 },
    esbelto: { cabY: 14, rx: 5.9, ry: 6.7, torTop: 23, torBot: 38, hombros: 16, cintura: 11, pierna: 4, grosor: 4, abre: 3 },
    fornido: { cabY: 12, rx: 6.8, ry: 7, torTop: 21, torBot: 38, hombros: 22, cintura: 17, pierna: 6, grosor: 5, abre: 4 },
    bajo: { cabY: 25, rx: 6.1, ry: 6.3, torTop: 32, torBot: 45, hombros: 15, cintura: 13, pierna: 5, grosor: 4, abre: 2 },
    ancho: { cabY: 23, rx: 6.9, ry: 6.5, torTop: 30, torBot: 46, hombros: 22, cintura: 20, pierna: 6, grosor: 5, abre: 3 }
  };
  function plantilla(cuerpo) {
    const p = CUERPOS[cuerpo] || CUERPOS.normal;
    const bajo = cuerpo === "bajo" || cuerpo === "ancho";
    const grande = cuerpo === "fornido" || cuerpo === "ancho";
    const t = { cuerpo: CUERPOS[cuerpo] ? cuerpo : "normal", bajo, grande, W, H, cx: 31, suelo: 62 };
    t.cabX = 32; t.cabY = p.cabY; t.cabRx = p.rx; t.cabRy = p.ry;
    t.ojoY = t.cabY + 1; t.bocaY = t.ojoY + 4;
    t.ojo1 = t.cabX + 1; t.ojo2 = t.cabX + 5;
    t.narizX = Math.round(t.cabX + t.cabRx + 0.6);
    t.torTop = p.torTop; t.torBot = p.torBot; t.pierTop = t.torBot + 1;
    t.torL = t.cx - Math.floor(p.hombros / 2); t.torR = t.torL + p.hombros - 1;
    t.wL = t.cx - Math.floor(p.cintura / 2); t.wR = t.wL + p.cintura - 1;
    t.grosor = p.grosor; t.pierna = p.pierna; t.abre = p.abre;
    t.hombro = [t.torR - 2, t.torTop + 3];
    t.codo = [t.torR + 1, t.torTop + (bajo ? 7 : 9)];
    t.mano = [t.torR + 5, t.torTop + (bajo ? 10 : 13)];
    t.hombroAtras = [t.torL + 3, t.torTop + 3];
    t.manoAtras = [t.torL, t.torBot + (bajo ? 0 : 1)];
    /* Piernas abiertas en A: caderas y pies de la de atrás (izquierda) y la de delante (derecha). */
    t.caderaAtras = t.cx - p.abre; t.caderaDelante = t.cx + p.abre;
    t.pieAtras = t.caderaAtras - 2; t.pieDelante = t.caderaDelante + 2;
    t.rodillaY = Math.round((t.pierTop + t.suelo) / 2) - 1;
    return t;
  }

  /* ---------- Cabeza y cara ---------- */
  const LUZ_CARA = [-0.42, -0.6, 0.85];
  function capaCabeza(t) {
    const x = t.cabX, y = t.cabY;
    const c = capa().ell(x, y, t.cabRx, t.cabRy);
    /* Mandíbula y barbilla hacia delante. */
    c.poly([[x - 1, y + 2], [x + t.cabRx + 0.6, t.ojoY + 1], [x + t.cabRx + 0.4, t.bocaY + 0.6], [x + t.cabRx - 1, t.bocaY + 2.2], [x + 4, y + t.cabRy + 0.8], [x - 1, y + t.cabRy + 0.3]]);
    c.on(t.narizX, t.ojoY + 1).on(t.narizX, t.ojoY + 2);
    return c;
  }
  function cabeza(g, t, piel) {
    const x = t.cabX, y = t.cabY;
    /* Cuello con la sombra que deja la mandíbula. */
    const cu = capa().rect(x - 2, y + 4, 6, t.torTop - y - 3);
    cu.pintar(g, piel, { relieve: 1.5, max: 2 });
    for (let i = x - 2; i <= x + 3; i++) pon(g, piel, 0, [i, Math.round(y + t.cabRy + 1)]);
    const c = capaCabeza(t);
    c.pintar(g, piel, { relieve: 5, min: 1, luz: LUZ_CARA });
    /* La nuca y el borde de abajo en sombra; frente, pómulo y nariz con luz. */
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (!c.tiene(i, j)) continue;
      if (!c.tiene(i, j + 1) && i < x + 3) pon(g, piel, 1, [i, j]);
    }
    for (let i = x + 1; i <= x + 4; i++) if (c.tiene(i, t.bocaY + 2) && !c.tiene(i, t.bocaY + 3)) pon(g, piel, 1, [i, t.bocaY + 2]);
    pon(g, piel, 4, [t.narizX, t.ojoY + 1], [t.narizX - 1, t.ojoY]);
    pon(g, piel, 1, [t.narizX - 1, t.ojoY + 3], [t.narizX, t.ojoY + 3]);
    pon(g, piel, 3, [t.ojo1, t.ojoY + 2], [t.ojo1 + 1, t.ojoY + 2]);
    pon(g, piel, 4, [t.ojo1 - 1, t.ojoY + 2]);
    /* Mentón con su brillo. */
    pon(g, piel, 3, [x + 4, t.bocaY + 2]);
  }
  function oreja(g, t, piel, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "elfo") {
      const c = capa().poly([[x - 2, y + 4.5], [x - 2, y - 0.5], [x - 12, y - 6.5], [x - 7, y + 1.5]]);
      c.pintar(g, piel, { relieve: 1.6, separar: 2 });
      surco(g, piel, 1, x - 3, y + 2, x - 8, y - 2, piel);
      surco(g, piel, 3, x - 4, y + 1, x - 9, y - 3, piel);
      return;
    }
    if (raza === "gnomo") {
      capa().poly([[x - 2, y + 4.5], [x - 2, y - 0.5], [x - 9, y - 3], [x - 6, y + 3]]).pintar(g, piel, { relieve: 1.6, separar: 2 });
      surco(g, piel, 1, x - 3, y + 2, x - 6, y, piel);
      return;
    }
    if (raza === "semiorco") {
      capa().poly([[x - 2, y + 4.5], [x - 2, y - 0.5], [x - 8, y - 2], [x - 5.5, y + 4]]).pintar(g, piel, { relieve: 1.6, separar: 2 });
      surco(g, piel, 1, x - 3, y + 2, x - 5, y + 1, piel);
      pon(g, R.hueso, 3, [x - 6, y]); // aro en la oreja
      return;
    }
    capa().ell(x - 3, y + 1.5, 2, 2.9).pintar(g, piel, { relieve: 1.6, separar: 2 });
    pon(g, piel, 1, [x - 3, y + 1], [x - 3, y + 2], [x - 2, y + 3]);
    pon(g, piel, 3, [x - 4, y]);
  }

  /* Rasgos de la cara. Todo se pinta solo sobre la piel (y la boca también sobre la barba),
     así que lo que se pinte después (yelmos, capuchas, máscaras) los respeta. */
  function cara(g, t, o) {
    const { piel, raza, gesto, iris } = o;
    const y = t.ojoY, a = t.ojo1, b = t.ojo2, by = t.bocaY, x = t.cabX;
    const libre = (i, j) => g.rampa(i, j) === piel || (j >= by - 1 && BARBAS.includes(g.rampa(i, j)));
    const m = (col, ram, ...pts) => { for (const [i, j] of pts) if (libre(i, j)) g.set(i, j, col, ram); };
    const mk = (ram, k, ...pts) => m(ram[k], ram, ...pts);
    const sombra = o.sombra;
    const cejaR = o.cejas || piel;
    const ceja = sombra ? piel[0] : cejaR === piel ? piel[1] : cejaR[1];
    const cejaC = sombra ? piel[1] : cejaR === piel ? piel[2] : cejaR[2];
    const blanco = sombra ? piel[3] : BLANCO;
    const tief = raza === "tiefling", orco = raza === "semiorco";
    const ojoAbierto = () => {
      /* Ojo cercano de 3×2 con pestaña, iris y brillo; el lejano, de 2×2. */
      m(OJOS, null, [a, y - 1], [a + 1, y - 1], [a + 2, y - 1], [b, y - 1], [b + 1, y - 1]);
      if (tief) {
        mk(R.bronce, 4, [a + 1, y], [a + 2, y], [b, y], [b + 1, y]);
        mk(R.fuego, 2, [a, y], [a + 1, y + 1], [a + 2, y + 1], [b, y + 1], [b + 1, y + 1]);
        m(OJOS, null, [a + 2, y + 1], [b + 1, y + 1]);
        return;
      }
      m(blanco, null, [a, y], [a, y + 1], [b, y]);
      m(OJOS, null, [a + 1, y], [a + 2, y], [b + 1, y]);
      m(sombra ? OJOS : iris, null, [a + 1, y + 1], [a + 2, y + 1], [b + 1, y + 1]);
      m(sombra ? piel[2] : piel[2], piel, [b, y + 1]);
      if (!sombra) m(BRILLO, null, [a + 2, y]);
    };
    const nariz = () => { mk(piel, 1, [t.narizX - 1, y + 3]); mk(piel, 0, [t.narizX, y + 3]); };
    if (gesto === "dolor") {
      /* Ojos apretados (> <), cejas de angustia, boca torcida con los dientes y una gota de sudor. */
      m(OJOS, null, [a, y - 1], [a + 1, y], [a + 2, y], [a, y + 1], [b + 1, y - 1], [b, y], [b + 1, y], [b + 1, y + 1]);
      mk(piel, 1, [a + 1, y - 1], [a + 1, y + 1], [a + 2, y + 1], [b, y + 1]);
      m(ceja, cejaR, [a - 1, y - 2], [a, y - 2], [a + 1, y - 3], [a + 2, y - 4], [b, y - 4], [b + 1, y - 3]);
      mk(piel, 1, [a + 3, y - 3], [a + 3, y - 2]);
      if (orco) m(piel[0], piel, [a, y - 3], [a + 1, y - 4], [b + 1, y - 4]);
      m(OJOS, null, [x + 2, by + 1], [x + 3, by], [x + 4, by - 1], [x + 5, by - 1], [x + 6, by - 1], [x + 3, by + 1], [x + 4, by + 2], [x + 5, by + 1], [x + 6, by]);
      mk(R.hueso, 4, [x + 4, by], [x + 5, by]);
      mk(R.sangre, 3, [x + 4, by + 1]);
      mk(piel, 1, [x + 3, by - 1], [x + 6, by + 1]);
      mk(SUDOR, 4, [x - 2, y - 5]); mk(SUDOR, 3, [x - 2, y - 4], [x - 3, y - 3]); mk(SUDOR, 2, [x - 2, y - 3]);
    } else if (gesto === "alegre") {
      /* Ojos en arco (^ ^), mejillas sonrosadas y sonrisa abierta. */
      const arco = tief ? R.bronce[4] : OJOS;
      m(arco, null, [a, y], [a + 1, y - 1], [a + 2, y - 1], [a + 3, y], [b, y - 1], [b + 1, y - 1], [b + 2, y]);
      mk(piel, 3, [a + 1, y], [a + 2, y], [b, y], [b + 1, y]);
      if (orco) m(piel[0], piel, [a - 1, y - 3], [a, y - 3], [a + 1, y - 3], [a + 2, y - 3], [b, y - 3], [b + 1, y - 3]);
      else m(ceja, cejaR, [a - 1, y - 3], [a, y - 4], [a + 1, y - 4], [a + 2, y - 4], [b, y - 4], [b + 1, y - 4]);
      if (!sombra) { mk(MEJILLA, 3, [a, y + 2], [a + 1, y + 2]); mk(MEJILLA, 4, [a, y + 1]); }
      const lengua = piel === R.piel.roja ? R.fuego : R.sangre;
      m(OJOS, null, [x + 1, by - 1], [x + 2, by], [x + 7, by - 1], [x + 6, by], [x + 3, by + 1], [x + 6, by + 1], [x + 4, by + 2], [x + 5, by + 2]);
      mk(R.hueso, 4, [x + 3, by], [x + 4, by], [x + 5, by]);
      mk(lengua, 3, [x + 4, by + 1], [x + 5, by + 1]);
      mk(piel, 1, [x + 2, by - 1], [x + 6, by - 1]);
    } else if (gesto === "furia") {
      /* Cejas en V sobre ojos entornados y los dientes apretados. */
      const fr = sombra ? piel[0] : orco ? OJOS : cejaR === piel ? piel[0] : cejaR[0];
      m(fr, cejaR, [a - 1, y - 4], [a, y - 3], [a + 1, y - 3], [a + 2, y - 2], [a + 3, y - 1], [b, y - 2], [b + 1, y - 3], [b + 2, y - 4]);
      mk(piel, 1, [a, y - 2], [a + 1, y - 2], [b + 1, y - 2]);
      m(OJOS, null, [a, y], [a + 1, y], [a + 2, y], [b, y], [b + 1, y]);
      if (tief) mk(R.bronce, 4, [a, y + 1], [a + 1, y + 1], [a + 2, y + 1], [b, y + 1], [b + 1, y + 1]);
      else { m(blanco, null, [a, y + 1], [b, y + 1]); m(OJOS, null, [a + 1, y + 1], [b + 1, y + 1]); m(sombra ? OJOS : iris, null, [a + 2, y + 1]); }
      mk(piel, 1, [t.narizX - 2, y + 2]);
      m(OJOS, null, [x + 2, by - 1], [x + 3, by - 1], [x + 4, by - 1], [x + 5, by - 1], [x + 6, by - 1], [x + 2, by], [x + 7, by], [x + 3, by + 1], [x + 4, by + 1], [x + 5, by + 1], [x + 6, by + 1]);
      mk(R.hueso, 4, [x + 3, by], [x + 5, by], [x + 6, by]);
      mk(R.hueso, 2, [x + 4, by]);
    } else {
      ojoAbierto();
      if (orco) m(piel[0], piel, [a - 1, y - 3], [a, y - 3], [a + 1, y - 3], [a + 2, y - 3], [b, y - 3], [b + 1, y - 3], [a + 3, y - 2]);
      else { m(ceja, cejaR, [a - 1, y - 2], [a, y - 3], [a + 1, y - 3], [a + 2, y - 3], [b, y - 3], [b + 1, y - 3]); m(cejaC, cejaR, [a, y - 4]); }
      mk(piel, 0, [x + 4, by], [x + 5, by]);
      mk(piel, 1, [x + 3, by - 1], [x + 6, by]);
      mk(piel, 3, [x + 4, by + 1]);
      if (!sombra && !tief && !orco) mk(MEJILLA, 3, [a, y + 2]);
    }
    nariz();
    if (orco) {
      /* Colmillos que suben desde la mandíbula. */
      mk(R.hueso, 4, [x + 3, by - 1], [x + 6, by - 1]);
      mk(R.hueso, 3, [x + 3, by], [x + 6, by]);
    }
    if (raza === "gnomo") {
      /* Nariz grande y redonda. */
      const n = capa().ell(t.narizX - 0.5, y + 2, 1.9, 1.7);
      n.pintar(g, piel, { relieve: 1.6, min: 2 });
      pon(g, piel, 4, [t.narizX - 1, y + 1]);
      pon(g, piel, 1, [t.narizX - 2, y + 3], [t.narizX - 1, y + 4]);
    }
  }

  /* ---------- Dracónido: cabeza de reptil ---------- */
  function cabezaDraconido(g, t, piel, gesto) {
    const x = t.cabX, y = t.cabY;
    capa().rect(x - 5, y + 2, 9, t.torTop - y + 1).pintar(g, piel, { relieve: 2.5, max: 2 });
    /* Placas claras de la garganta. */
    for (let j = y + 6; j <= t.torTop; j += 2) pon(g, R.hueso, 3, [x + 1, j], [x + 2, j], [x + 3, j]), pon(g, R.hueso, 2, [x + 1, j + 1], [x + 2, j + 1], [x + 3, j + 1]);
    const c = capa().ell(x - 1, y, 6.6, 6.8);
    c.poly([[x + 1, y - 5.5], [x + 7, y - 4.5], [x + 12.5, y - 1.5], [x + 13, y + 1.5], [x + 11.5, y + 4.5], [x + 6, y + 6.5], [x - 1, y + 7]]);
    c.pintar(g, piel, { relieve: 4, luz: LUZ_CARA });
    /* Mandíbula inferior más clara. */
    for (let i = x + 2; i <= x + 12; i++) for (let j = y + 3; j <= y + 7; j++) if (g.rampa(i, j) === piel && tono(g, i, j) >= 2) pon(g, piel, j === y + 3 ? 4 : 3, [i, j]);
    /* Escamas en rombo. */
    cada(g, piel, x - 8, y - 7, x + 10, y + 1, (i, j, k) => {
      const u = (i + j * 2) % 6, v = (i * 2 - j + 60) % 6;
      if (k >= 2 && u === 0) pon(g, piel, k - 1, [i, j]);
      else if (k >= 2 && k < 4 && v === 0) pon(g, piel, k + 1, [i, j]);
    });
    /* Cresta de pinchos por la nuca y cuernos hacia atrás. */
    const cr = capa();
    for (let k = 0; k < 3; k++) cr.poly([[x - 5 - k * 1.4, y - 5 + k * 3.4], [x - 10.5 - k * 1.4, y - 5 + k * 3.6], [x - 6.5 - k * 1.4, y - 2 + k * 3.4]]);
    cr.pintar(g, piel, { relieve: 1, max: 2, separar: true });
    const cu = capa().curva(x - 2, y - 5, x - 7, y - 10, x - 14, y - 9, 4, 1).curva(x - 4, y - 1, x - 9, y - 4, x - 15, y - 3, 3.2, 1);
    cu.pintar(g, R.hueso, { relieve: 1.6, separar: true });
    for (let j = y - 10; j <= y; j += 2) for (let i = x - 15; i <= x; i++) if (g.rampa(i, j) === R.hueso && tono(g, i, j) >= 3 && (i & 1)) pon(g, R.hueso, 2, [i, j]);
    /* Arco de la ceja, fosa nasal y la línea de la boca. */
    for (let i = x; i <= x + 5; i++) if (g.rampa(i, y - 4) === piel) pon(g, piel, 1, [i, y - 4]);
    pon(g, piel, 4, [x + 1, y - 5], [x + 2, y - 5], [x + 3, y - 5]);
    pon(g, piel, 0, [x + 11, y - 1], [x + 12, y - 1]);
    for (let i = x + 3; i <= x + 13; i++) if (g.get(i, y + 3) && g.rampa(i, y + 3) === piel) pon(g, piel, 0, [i, y + 2]);
    pon(g, piel, 0, [x + 2, y + 1], [x + 2, y + 2]);
    pon(g, piel, 4, [x + 9, y - 3], [x + 10, y - 3]);
    const ex = x + 3, ey = y - 2;
    const libre = (i, j) => g.rampa(i, j) === piel || g.rampa(i, j) === R.hueso;
    const m = (col, ram, ...pts) => { for (const [i, j] of pts) if (libre(i, j)) g.set(i, j, col, ram); };
    if (gesto === "dolor") {
      m(OJOS, null, [ex - 1, ey - 1], [ex, ey], [ex + 1, ey], [ex - 1, ey + 1], [ex + 2, ey]);
      for (let i = x + 4; i <= x + 10; i++) m(OJOS, null, [i, y + 3]);
      m(OJOS, null, [x + 6, y + 4], [x + 7, y + 4], [x + 8, y + 4]);
      m(R.hueso[4], R.hueso, [x + 5, y + 3], [x + 9, y + 3]);
      m(R.sangre[3], R.sangre, [x + 7, y + 3]);
      m(SUDOR[4], SUDOR, [x - 3, y - 4]); m(SUDOR[3], SUDOR, [x - 3, y - 3]); m(SUDOR[2], SUDOR, [x - 3, y - 2], [x - 4, y - 2]);
    } else if (gesto === "alegre") {
      m(OJOS, null, [ex - 1, ey + 1], [ex, ey], [ex + 1, ey], [ex + 2, ey + 1]);
      m(MEJILLA[3], MEJILLA, [ex, ey + 2], [ex + 1, ey + 2]);
      for (let i = x + 3; i <= x + 11; i++) m(i % 2 ? R.hueso[4] : OJOS, i % 2 ? R.hueso : null, [i, y + 3]);
      m(OJOS, null, [x + 12, y + 2], [x + 4, y + 4], [x + 5, y + 4], [x + 6, y + 4]);
    } else if (gesto === "furia") {
      m(piel[0], piel, [ex - 2, ey - 2], [ex - 1, ey - 1], [ex, ey - 1], [ex + 1, ey], [ex + 2, ey]);
      m(R.fuego[3], R.fuego, [ex - 1, ey + 1], [ex, ey + 1]);
      m(OJOS, null, [ex + 1, ey + 1]);
      for (let i = x + 4; i <= x + 12; i++) m(i % 2 ? R.hueso[4] : OJOS, i % 2 ? R.hueso : null, [i, y + 2], [i, y + 3]);
      m(R.fuego[4], R.fuego, [x + 14, y - 2]); m(R.fuego[3], R.fuego, [x + 14, y - 1], [x + 15, y - 2]);
    } else {
      /* Ojo de reptil: párpado oscuro, iris dorado con brillo y pupila en rendija. */
      m(OJOS, null, [ex - 1, ey - 1], [ex, ey - 1], [ex + 1, ey - 1], [ex + 2, ey - 1], [ex + 3, ey]);
      m(ORO[4], ORO, [ex - 1, ey]); m(ORO[3], ORO, [ex + 2, ey], [ex, ey]);
      m(ORO[2], ORO, [ex - 1, ey + 1], [ex, ey + 1], [ex + 2, ey + 1]);
      m(OJOS, null, [ex + 1, ey], [ex + 1, ey + 1]);
      m(BRILLO, null, [ex - 1, ey]);
    }
  }

  /* ---------- Pelo y barba ---------- */
  /* Mechones: surcos oscuros que salen de la coronilla y un halo de brillo partido en hebras. */
  function texturaPelo(g, ram, cx, cy, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const ang = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
      const banda = ((ang * 6.3 + d * 0.12) % 1 + 1) % 1;
      if (k >= 2 && banda < 0.14 && d > 2) g.set(x, y, ram[k - 1], ram);
      else if (k >= 2 && d > 3.2 && d < 6.2 && ang < -0.7 && ang > -2.9 && banda > 0.42 && banda < 0.78) g.set(x, y, ram[Math.min(4, k + 1)], ram);
    });
  }
  function pelo(g, t, ram, peinado, raza, soloCabeza) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy;
    if (peinado === "rapado") {
      /* Rapado: la sombra del pelo corto sobre el cráneo, con un poco de grano. */
      /* Rapado: sombra uniforme del pelo corto sobre el cráneo, con el nacimiento del pelo tramado. */
      cada(g, g.rampa(x, y - 4), x - 8, y - 9, x + 4, y + 3, (i, j, k) => {
        const borde = t.ojoY - 4 - (i > x + 1 ? 1 : 0) + (i < x - 3 ? Math.min(6, (x - 3 - i) * 2) : 0);
        if (j < borde - 1 || (j === borde - 1 && umbral(i, j) > 0.4)) g.set(i, j, k >= 3 ? ram[3] : k === 2 ? ram[2] : ram[1], ram);
      });
      return;
    }
    const c = capa().ell(x - 0.5, y - 1, rx + 1.2, ry + 0.4);
    /* Cara despejada: flequillo hasta la frente con unas puntas. */
    for (let j = t.ojoY - 5; j < Math.min(H, y + 12); j++) for (let i = x - 1; i < Math.min(W, x + 12); i++) {
      const frente = t.ojoY - 3 - (i >= x + 4 ? 1 : 0) - (i >= x + 6 ? 1 : 0);
      if (j >= frente) c.off(i, j);
    }
    c.on(x, t.ojoY - 3).on(x + 3, t.ojoY - 4).on(x + 4, t.ojoY - 4).on(x - 1, t.ojoY - 2).on(x - 1, t.ojoY - 1).on(x - 1, t.ojoY);
    c.borrarDesde(y + 5);
    c.rect(x - 8, y + 1, 4, 4); // nuca
    for (let i = x - 8; i <= x - 4; i += 2) c.on(i, y + 5);
    c.on(x - 9, y + 3).on(x + 2, t.ojoY - 3).on(x + 5, t.ojoY - 5);
    if (peinado === "largo") c.poly([[x - 9, y - 1], [x - 1, y], [x - 1, y + 5], [x - 2, t.torTop + 3], [x - 5, t.torTop + 7], [x - 10, t.torTop + 5], [x - 11, t.torTop]]);
    if (peinado === "recogido") c.ell(x - 9, y - 5, 3.4, 3.2);
    if (peinado === "rizado") {
      c.ell(x - 1, y - 4, rx + 2.6, 5.2);
      c.ell(x - 7.5, y + 1.5, 3.4, 4);
      for (let j = t.ojoY - 5; j < Math.min(H, y + 12); j++) for (let i = x - 1; i < Math.min(W, x + 12); i++) if (j >= t.ojoY - 3 - (i >= x + 5 ? 1 : 0)) c.off(i, j);
    }
    if (raza === "elfo" || raza === "gnomo" || raza === "satiro" || raza === "semiorco") c.quitarRect(x - 5, y - 1, 3, 4);
    if (soloCabeza) c.recortar(capa().ell(t.cabX, t.cabY, t.cabRx, t.cabRy));
    c.pintar(g, ram, { relieve: 3.5 });
    if (peinado === "rizado") {
      /* Rizos: bultos redondos que atrapan la luz. */
      const rizos = [[x - 7, y - 7], [x - 3, y - 9.5], [x + 2, y - 9], [x + 6, y - 6.5], [x - 9.5, y - 3], [x - 9.5, y + 2], [x - 6, y - 3], [x - 1, y - 5.5], [x + 3.5, y - 5], [x - 7, y + 4]];
      for (const [i, j] of rizos) {
        const r = capa().ell(i, j, 2, 1.8).recortar(c);
        r.pintar(g, ram, { relieve: 1.8, min: 1, separar: 2 });
      }
    } else texturaPelo(g, ram, x - 1, y - 7, x - 12, y - 10, x + 9, t.torTop + 8);
    if (peinado === "recogido") {
      /* Moño con su cinta y una coleta que cae. */
      if (!soloCabeza) {
        capa().curva(x - 10, y - 2, x - 14, y + 3, x - 11, y + 9, 3.6, 1.6).pintar(g, ram, { relieve: 1.6, separar: 2 });
        surco(g, ram, 1, x - 11, y - 1, x - 12, y + 5, ram);
        surco(g, ram, 3, x - 12, y, x - 13, y + 3, ram);
        pon(g, R.tela.granate, 3, [x - 10, y - 2], [x - 9, y - 2]); pon(g, R.tela.granate, 2, [x - 8, y - 2], [x - 10, y - 1]);
        pon(g, R.tela.granate, 4, [x - 10, y - 3]);
      }
    }
    if (peinado === "largo" && !soloCabeza) for (let i = x - 10; i <= x - 2; i += 2) surco(g, ram, 1, i, y + 2, i - 0.5, t.torTop + 6, ram);
  }
  function barba(g, t, ram, larga) {
    const x = t.cabX, y = t.ojoY, by = t.bocaY;
    const c = capa().poly([[x - 2, y + 0.5], [x, y + 3], [x + 3, by - 1.5], [x + 8.5, by - 1.5], [x + 8.5, by + 1.5], [x + 6, by + 4], [x + 1, by + 3.5], [x - 2.5, y + 3.5]]);
    if (larga) c.poly([[x - 3, by - 1], [x + 8, by], [x + 7.5, t.torTop + 6], [x + 4, t.torTop + 11], [x + 1, t.torTop + 9], [x - 2, t.torTop + 5]]);
    c.pintar(g, ram, { relieve: 2.8, separar: 2 });
    /* Bigote con su brillo y la boca. */
    for (let i = x + 2; i <= x + 8; i++) if (g.rampa(i, by - 1) === ram) pon(g, ram, i === x + 2 ? 1 : i === x + 4 ? 4 : 3, [i, by - 1]);
    pon(g, ram, 0, [x + 4, by], [x + 5, by], [x + 6, by]);
    /* Mechones verticales que ondulan. */
    cada(g, ram, x - 3, by + 1, x + 9, t.torTop + 12, (i, j, k) => {
      const f = (i + ((j >> 2) & 1)) % 3;
      if (k >= 2 && f === 0) g.set(i, j, ram[k - 1], ram);
      else if (k >= 2 && k < 4 && f === 1 && (j & 3) === 1) g.set(i, j, ram[k + 1], ram);
    });
    if (larga) {
      /* Trenza central con dos anillas de oro. */
      for (const ty of [t.torTop + 3, t.torTop + 8]) {
        pon(g, ORO, 4, [x + 3, ty]); pon(g, ORO, 3, [x + 4, ty], [x + 5, ty]); pon(g, ORO, 1, [x + 3, ty + 1], [x + 4, ty + 1], [x + 5, ty + 1]);
      }
      for (let j = by + 2; j < t.torTop + 10; j += 2) { pon(g, ram, 1, [x + 3, j]); pon(g, ram, 3, [x + 4, j]); }
    }
  }

  /* ---------- Cuernos y colas ---------- */
  function cuernos(g, t, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "tiefling") {
      const N = R.pelo.negro;
      const a = t.bajo ? 15 : 13;
      const c = capa().curva(x + 1, y - 6, x, y - a, x - 8, y - a + 0.5, 4.2, 1);
      c.curva(x - 4, y - 6, x - 5, y - a + 3, x - 11, y - a + 4, 3.4, 1);
      c.pintar(g, N, { relieve: 1.8, min: 2, separar: true });
      /* Anillos del cuerno y brillo. */
      for (let j = y - a; j <= y - 6; j += 2) for (let i = x - 12; i <= x + 3; i++) if (g.rampa(i, j) === N && tono(g, i, j) >= 3) pon(g, N, 2, [i, j]);
      pon(g, N, 4, [x, y - a + 4], [x - 1, y - a + 3], [x - 5, y - a + 4]);
    }
    if (raza === "satiro") {
      const c = capa().curva(x + 1, y - 6, x + 1, y - 13, x - 4, y - 13, 3.4, 1.4).curva(x - 3, y - 6, x - 4, y - 10, x - 8, y - 10, 2.6, 1.2);
      c.pintar(g, R.hueso, { relieve: 1.4, min: 1, separar: true });
      for (let j = y - 13; j <= y - 6; j += 2) for (let i = x - 8; i <= x + 3; i++) if (g.rampa(i, j) === R.hueso && tono(g, i, j) >= 3) pon(g, R.hueso, 2, [i, j]);
    }
  }
  function cola(g, t, piel, raza) {
    if (raza === "tiefling") {
      capa().curva(t.torL + 2, t.torBot - 1, t.torL - 13, t.torBot + 12, t.torL - 12, t.torBot - 4, 3.2, 1.8).pintar(g, piel, { relieve: 1.4 });
      const px = t.torL - 12, py = t.torBot - 5;
      capa().poly([[px - 3, py + 1.5], [px, py - 5], [px + 3, py + 1.5], [px, py + 0.5]]).pintar(g, piel, { relieve: 1.2, min: 2 });
      pon(g, piel, 4, [px - 1, py - 2], [px, py - 3]);
    }
    if (raza === "draconido") {
      const c = capa().curva(t.torL + 4, t.torBot - 4, t.torL - 4, t.suelo + 1, t.torL - 15, t.suelo - 3, 8.5, 2.2);
      c.pintar(g, piel, { relieve: 3 });
      /* Panza clara por debajo y escamas por encima. */
      for (let i = t.torL - 16; i <= t.torL + 4; i++) for (let j = t.torBot; j < t.suelo + 1; j++)
        if (c.tiene(i, j) && !c.tiene(i, j + 1)) pon(g, R.hueso, 2, [i, j]), c.tiene(i, j - 1) && pon(g, R.hueso, 3, [i, j - 1]);
      cada(g, piel, t.torL - 16, t.torBot - 4, t.torL + 4, t.suelo, (i, j, k) => { if (k >= 2 && (i + j * 2) % 5 === 0) pon(g, piel, k - 1, [i, j]); });
    }
  }

  /* ---------- Brazos, manos y piernas ---------- */
  function puno(g, mx, my, ram, tapa) {
    /* Puño cerrado alrededor de un mango vertical: cuatro dedos con sus nudillos y el pulgar encima. */
    capa().rect(mx - 2, my - 1, 4, 5).on(mx + 2, my).on(mx + 2, my + 1).on(mx + 2, my + 2).pintar(g, ram, { relieve: 1.6, separar: true });
    for (let j = my; j <= my + 3; j++) pon(g, ram, 1, [mx + 1, j]);
    pon(g, ram, 3, [mx + 2, my], [mx + 2, my + 2]);
    pon(g, ram, 2, [mx + 2, my + 1]);
    pon(g, ram, 1, [mx - 1, my + 1], [mx - 1, my + 3]);
    pon(g, ram, 4, [mx - 2, my - 1], [mx - 1, my - 1]);
    pon(g, ram, 3, [mx, my - 1]);
    if (tapa) pon(g, tapa, 2, [mx - 2, my + 2], [mx - 2, my + 3]);
  }
  function mano(g, x, y, ram, sombra) {
    /* Mano abierta colgando, con el pulgar y los dedos marcados. */
    capa().rect(x - 1, y, 4, 3).rect(x - 1, y + 3, 3, 2).on(x + 2, y + 3).pintar(g, ram, { relieve: 1.2, max: sombra ? 2 : 4 });
    pon(g, ram, 1, [x, y + 3], [x, y + 4], [x + 1, y + 2]);
    pon(g, ram, sombra ? 2 : 3, [x - 1, y]);
  }
  /* manga: { sup, inf, guante, ancha, ribete, brazal } */
  function brazoDelante(g, t, piel, m, conPuno = true) {
    const [hx, hy] = t.hombro, [ex, ey] = t.codo, [mx, my] = t.mano;
    const gr = t.grosor;
    const sup = capa().linea(hx, hy, ex, ey, gr + 1);
    const inf = capa().linea(ex, ey, mx - 1, my - 1, gr + (m.ancha ? 1 : 0));
    sup.pintar(g, m.sup || piel, { relieve: 2.4, separar: true });
    inf.pintar(g, m.inf || piel, { relieve: 2.2, separar: true });
    if (!m.ancha && !m.brazal && (m.inf || piel) === piel) {
      /* Músculo del antebrazo y codo. */
      pon(g, piel, 3, [ex, ey - 1]); pon(g, piel, 1, [ex + 1, ey + 1]);
    }
    if (m.ancha) {
      /* Manga ancha de túnica que cae desde el antebrazo, con ribete. */
      const b = capa().poly([[ex - 1.5, ey], [mx - 1, my - 2.5], [mx - 1, my + 2.5], [ex + 1, my + 4], [ex - 1, my + 3]]);
      b.pintar(g, m.inf, { relieve: 2.2, separar: true });
      cada(g, m.inf, ex - 3, my, mx, my + 5, (x, y) => { if (!b.tiene(x, y + 1)) g.set(x, y, (m.ribete || m.inf)[m.ribete ? 3 : 1], m.ribete || m.inf); });
      pliegue(g, m.inf, ex + 1, ey + 1, mx - 3, my + 2);
    }
    if (m.brazal) {
      const bz = capa().linea(ex + 0.5, ey + 0.5, mx - 1.5, my - 1.5, gr + 1);
      bz.recortar(inf).pintar(g, m.brazal, { relieve: 1.6, separar: true });
      /* Correas cruzadas. */
      for (let s = 0; s < 3; s++) surco(g, m.brazal, 0, ex + s * 1.3 - 1, ey + 1 + s * 1.3, ex + s * 1.3 + 1, ey + s * 1.3 - 1, m.brazal);
    }
    if (conPuno) puno(g, mx, my, m.guante || piel);
  }
  function brazoAtras(g, t, piel, m) {
    const [hx, hy] = t.hombroAtras, [mx, my] = t.manoAtras;
    const ex = hx - 2, ey = Math.round((hy + my) / 2);
    capa().linea(hx, hy, ex, ey, t.grosor + 1).pintar(g, m.sup || piel, { relieve: 2, max: 2 });
    capa().linea(ex, ey, mx, my, t.grosor).pintar(g, m.inf || m.sup || piel, { relieve: 2, max: 2 });
    if (m.ancha) capa().poly([[mx - 2, my - 5], [mx + 2, my - 5], [mx + 2.5, my + 1.5], [mx - 2.5, my + 1.5]]).pintar(g, m.inf, { relieve: 1.6, max: 2 });
    mano(g, mx, my + 1, m.guante || piel, true);
  }

  function pieDesnudo(g, t, x0, piel, peludo, atras, mediano) {
    const s = t.suelo, l = mediano ? 9 : 6;
    const c = capa().rect(x0 - 1, s - 2, l, 3).rect(x0, s - 3, 4, 1);
    c.pintar(g, piel, { relieve: 1.4, max: atras ? 2 : 4, separar: true });
    for (let i = x0 + 2; i < x0 + l - 1; i += 2) pon(g, piel, 1, [i, s]);
    pon(g, piel, atras ? 2 : 4, [x0 + l - 3, s - 2]);
    pon(g, piel, 0, [x0 - 1, s]);
    if (peludo) {
      pon(g, peludo, 2, [x0, s - 3], [x0 + 2, s - 3], [x0 + 1, s - 2], [x0 + 3, s - 2], [x0 + 5, s - 2]);
      pon(g, peludo, 3, [x0 + 1, s - 3], [x0 + 4, s - 2]);
    }
  }
  /* Bota: caña con vuelta, empeine redondeado, suela y una correa con hebilla. */
  function bota(g, t, xc, ram, atras, alto = 8, puntera = null, hebilla = ORO) {
    const s = t.suelo, gw = t.pierna;
    const x0 = Math.round(xc - gw / 2);
    const c = capa().rect(x0, s - alto, gw + 1, alto - 1).rect(x0, s - 3, gw + 3, 3).rect(x0 + gw + 1, s - 2, 2, 2).off(x0 + gw + 3, s - 3);
    c.pintar(g, ram, { relieve: 1.8, max: atras ? 2 : 4, separar: true });
    for (let i = x0 - 1; i <= x0 + gw + 1; i++) { pon(g, ram, atras ? 2 : 3, [i, s - alto]); pon(g, ram, atras ? 1 : 2, [i, s - alto - 1]); pon(g, ram, 1, [i, s - alto + 1]); }
    capa().rect(x0 - 1, s - alto - 1, gw + 3, 2).pintar(g, ram, { relieve: 1, max: atras ? 2 : 4, separar: true }); // vuelta de la caña
    for (let i = x0 - 1; i <= x0 + gw + 3; i++) if (g.rampa(i, s) === ram || !g.get(i, s)) pon(g, CUERO2, 0, [i, s]);
    pon(g, ram, atras ? 2 : 4, [x0 + gw + 1, s - 2], [x0 + gw + 2, s - 2]);
    pon(g, ram, 1, [x0 + 1, s - 1], [x0 + 2, s - 1]);
    if (puntera) pon(g, puntera, 3, [x0 + gw + 3, s - 1]), pon(g, puntera, 4, [x0 + gw + 2, s - 2]);
    /* Correa del tobillo con hebilla. */
    if (alto >= 7) {
      const cy = s - 4;
      for (let i = x0; i <= x0 + gw; i++) pon(g, CUERO2, atras ? 0 : 1, [i, cy]);
      if (!atras) { pon(g, hebilla, 4, [x0 + gw - 1, cy]); pon(g, hebilla, 2, [x0 + gw, cy]); }
    }
  }
  /* o: { ramPierna, ramBota, descalzo, alto, rodillera, puntera, zapato } */
  function piernas(g, t, piel, raza, ramPelo, o) {
    const { pierTop, suelo, pierna: gw } = t;
    const xa = t.caderaAtras, xd = t.caderaDelante, fa = t.pieAtras, fd = t.pieDelante, ky = t.rodillaY;
    if (raza === "satiro") {
      /* Patas de cabra: cadera peluda, corvejón hacia atrás y pezuñas. */
      capa().ell(t.cx, pierTop + 2, (t.wR - t.wL) / 2 + 1.5, 4).pintar(g, ramPelo, { relieve: 3 });
      const pata = (x, f, atras) => {
        const kx = x + 2 + (atras ? t.kAx || 0 : t.kDx || 0);
        const c = capa().linea(x, pierTop + 2, kx, ky + 1, gw + 1).linea(kx, ky + 1, f - 1, suelo - 5, gw).linea(f - 1, suelo - 5, f, suelo - 2, gw - 1);
        c.pintar(g, ramPelo, { relieve: 2, max: atras ? 2 : 4, separar: true });
        cada(g, ramPelo, x - 6, pierTop + 1, x + 6, suelo - 2, (i, j, k) => { if (k >= 2 && (i * 2 + j) % 5 === 0) g.set(i, j, ramPelo[k - 1], ramPelo); else if (k >= 2 && k < 4 && (i * 2 + j) % 7 === 3) g.set(i, j, ramPelo[k + 1], ramPelo); });
        const pz = capa().rect(f - 2, suelo - 1, 5, 2).on(f + 3, suelo);
        pz.pintar(g, R.pelo.negro, { relieve: 1, min: 2, max: atras ? 3 : 4, separar: true });
        pon(g, R.pelo.negro, 0, [f + 1, suelo - 1], [f + 1, suelo]);
        pon(g, R.pelo.negro, 4, [f - 1, suelo - 1]);
      };
      pata(xa - 1, fa, true); pata(xd, fd, false);
      return;
    }
    const rp = o.ramPierna || piel;
    /* Muslo, rodilla y pantorrilla: la de atrás en sombra. */
    const pierna = (x, f, dk) => { const kx = (x + f) / 2 + dk; return capa().linea(x, pierTop - 1, kx, ky, gw + 1).linea(kx, ky, f, suelo - 3, gw).ell(kx - 0.3 + (dk ? (f - kx) * 0.3 : 0), ky + 4 + (dk ? 0.5 : 0), gw / 2 + 0.2, 2.2); };
    const kA = t.kAx || 0, kD = t.kDx || 0;
    const atras = pierna(xa, fa, kA), delante = pierna(xd, fd, kD);
    atras.pintar(g, rp, { relieve: 2.2, max: 2 });
    delante.pintar(g, rp, { relieve: 2.4, separar: true });
    if (rp !== piel) {
      /* Arrugas de la tela en la corva y el tobillo. */
      pliegue(g, rp, (xd + fd) / 2 + kD + 1, ky - 1, (xd + fd) / 2 + kD - 1, ky + 1);
      surco(g, rp, 1, fd - 1, suelo - 9, fd + 1, suelo - 10, rp);
    } else {
      pon(g, piel, 3, [(xd + fd) / 2 + kD | 0, ky]);
      pon(g, piel, 1, [((xd + fd) / 2 + kD | 0) + 1, ky + 5]);
    }
    if (o.rodillera) {
      capa().ell((xd + fd) / 2 + kD + 0.2, ky, gw / 2 + 0.6, 1.8).pintar(g, o.rodillera, { relieve: 1.4, separar: true });
      destello(g, o.rodillera, Math.round((xd + fd) / 2 + kD) - 1, ky - 1);
      capa().ell((xa + fa) / 2 + kA, ky, gw / 2 + 0.2, 1.6).pintar(g, o.rodillera, { relieve: 1, max: 2, separar: true });
    }
    if (o.descalzo || !o.ramBota) {
      const med = raza === "mediano";
      const peludo = med ? ramPelo : null;
      pieDesnudo(g, t, Math.round(fa - gw / 2) - 1, piel, peludo, true, med);
      pieDesnudo(g, t, Math.round(fd - gw / 2), piel, peludo, false, med);
      if (o.zapato && !med) {
        for (const [f, at] of [[fa - 1, true], [fd, false]]) {
          const x0 = Math.round(f - gw / 2);
          capa().rect(x0 - 1, suelo - 2, gw + 3, 3).on(x0 + gw + 2, suelo).off(x0 - 1, suelo - 2).pintar(g, o.zapato, { relieve: 1.2, max: at ? 2 : 3, separar: true });
          for (let i = x0 - 1; i <= x0 + gw + 2; i++) pon(g, o.zapato, 0, [i, suelo]);
          pon(g, o.zapato, at ? 2 : 4, [x0 + gw, suelo - 2]);
        }
      }
      return;
    }
    bota(g, t, fa - 1, o.ramBota, true, o.alto || 8, o.puntera);
    bota(g, t, fd, o.ramBota, false, o.alto || 8, o.puntera);
  }

  /* ---------- Formas de la ropa ---------- */
  /* Torso en V: hombros anchos, pecho hacia delante y cintura estrecha. */
  const torso = t => capa().poly([
    [t.torL + 1.5, t.torTop - 0.5], [t.torR - 1.5, t.torTop - 0.5], [t.torR + 0.5, t.torTop + 2], [t.torR + 0.5, t.torTop + 6],
    [t.wR + 0.5, t.torBot + 0.5], [t.wL - 0.5, t.torBot + 0.5], [t.torL - 0.5, t.torTop + 6], [t.torL - 0.5, t.torTop + 2]
  ]);
  const falda = (t, largo, vuelo) => capa().poly([[t.wL - 0.5, t.torBot - 1.5], [t.wR + 0.5, t.torBot - 1.5], [t.wR + 1.5 + vuelo + (t.faldaD || 0), t.pierTop + largo + 0.5 + (t.faldaDy || 0)], [t.wL - 1.5 - vuelo + (t.faldaI || 0), t.pierTop + largo + 0.5 + (t.faldaIy || 0)]]);
  function cinturon(g, t, ram = CUERO, hebilla = ORO, y = t.torBot - 2, ancho = 3) {
    for (let x = t.wL - 2; x <= t.wR + 2; x++) for (let j = 0; j < ancho; j++) if (g.get(x, y + j)) g.set(x, y + j, ram[j === 0 ? 3 : j === ancho - 1 ? 1 : 2], ram);
    for (let x = t.wL - 2; x <= t.wR + 2; x++) if (g.get(x, y - 1)) matiz(g, x, y - 1, -1);
    /* Agujeros de la correa. */
    for (let x = t.wL; x < t.cx; x += 3) if (g.rampa(x, y + 1) === ram) pon(g, ram, 0, [x, y + 1]);
    /* Hebilla: marco de metal con su brillo y el pasador. */
    const hx = t.cx + 2;
    for (let j = -1; j <= ancho; j++) pon(g, hebilla, j < 1 ? 4 : 2, [hx, y + j]), pon(g, hebilla, j < 1 ? 3 : 1, [hx + 3, y + j]);
    pon(g, hebilla, 4, [hx + 1, y - 1]); pon(g, hebilla, 3, [hx + 2, y - 1]);
    pon(g, hebilla, 1, [hx + 1, y + ancho], [hx + 2, y + ancho]);
    pon(g, hebilla, 3, [hx + 1, y + 1]);
    g.set(hx, y - 1, BRILLO, hebilla);
    /* Cabo suelto de la correa. */
    pon(g, ram, 1, [hx + 4, y + 1], [hx + 5, y + 1], [hx + 5, y + 2]);
  }
  function capucha(t, punta) {
    const x = t.cabX, y = t.cabY;
    const c = capa().ell(x - 0.8, y - 0.6, t.cabRx + 2, t.cabRy + 1.6);
    c.poly([[x - 10, y], [x - 1, y + 6], [t.torL + 4, t.torTop + 4], [t.torL - 3, t.torTop + 4], [x - 12, t.torTop - 1]]);
    c.poly([[x - 4, y + 5], [x + 7, y + 6.5], [t.torR - 1, t.torTop + 3.5], [t.torL + 1, t.torTop + 3.5]]);
    if (punta) c.poly([[x - 2, y - 8.6], [x - 7, y - 8.4], [x - 16, y - 3], [x - 8, y - 0.5]]);
    const hueco = capa().ell(x + 5, t.ojoY + 1.5, 5.6, 6.4).rect(x + 7, t.ojoY - 3, 5, 11);
    c.restar(hueco);
    return c;
  }
  function pintarCapucha(g, t, ram, piel, punta) {
    const c = capucha(t, punta);
    c.pintar(g, ram, { relieve: 3.5, separar: true });
    /* Borde de la abertura iluminado, dobladillo y sombra que cae sobre la cara. */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      if ((!c.tiene(x + 1, y) && g.rampa(x + 1, y) === piel) || (!c.tiene(x, y + 1) && g.rampa(x, y + 1) === piel && y < t.ojoY)) g.set(x, y, ram[3], ram);
      else if ((!c.tiene(x + 2, y) && g.rampa(x + 2, y) === piel)) g.set(x, y, ram[1], ram);
    }
    cada(g, piel, t.cabX - 2, t.ojoY - 5, t.cabX + 11, t.bocaY + 4, (x, y, k) => {
      const cerca = c.tiene(x - 1, y) || c.tiene(x, y - 1) || c.tiene(x - 2, y) || c.tiene(x, y - 2);
      if (cerca || y < t.ojoY) g.set(x, y, piel[Math.max(0, k - 1)], piel);
    });
    /* Pliegues de la caída. */
    pliegue(g, ram, t.cabX - 7, t.cabY + 3, t.cabX - 10, t.torTop + 2);
    pliegue(g, ram, t.cabX - 3, t.cabY + 6, t.cabX - 5, t.torTop + 3);
    surco(g, ram, 1, t.cabX - 5, t.cabY - 6, t.cabX - 8, t.cabY - 1, ram);
    return c;
  }

  /* ---------- Lo que va a la espalda ---------- */
  function capaEspalda(t, largo, vuelo) {
    return capa().poly([[t.torL + 1, t.torTop], [t.torL + 7, t.torTop], [t.torL + 3 + (t.capaDx || 0) / 2, t.pierTop + largo + (t.capaDy || 0) / 2], [t.torL - vuelo + (t.capaDx || 0), t.pierTop + largo - 1 + (t.capaDy || 0)], [t.torL - 3, t.torTop + 5]]);
  }
  function espalda(g, t, clase, tela) {
    if (clase === "explorador") {
      const cp = capaEspalda(t, 10, 8);
      cp.pintar(g, tela, { relieve: 3, max: 3 });
      pliegue(g, tela, t.torL - 1, t.torTop + 7, t.torL - 4, t.pierTop + 8);
      pliegue(g, tela, t.torL + 2, t.torTop + 9, t.torL - 1, t.pierTop + 9);
      penumbra(g, tela, t.torL - 9, t.pierTop, t.torL + 4, t.pierTop + 10, 0.3);
      ribete(g, cp, tela, 2);
      /* Carcaj de cuero con correas, boca de cobre y flechas emplumadas. */
      const q = capa().linea(t.torL + 4, t.torTop - 3, t.torL - 2, t.torBot, 5);
      q.pintar(g, CUERO, { relieve: 2, separar: true });
      for (const [dx, dy] of [[0, 1], [-2, 8], [-3, 13]]) surco(g, ORO, 2, t.torL + 1 + dx, t.torTop + dy + 1, t.torL + 6 + dx, t.torTop + dy - 1, CUERO);
      for (let j = t.torTop; j <= t.torBot - 2; j += 3) pon(g, CUERO, 4, [t.torL + Math.round((t.torTop - j) * 0.35) + 2, j]);
      const plumas = [[t.torL + 6, t.torTop - 9, PLUMA], [t.torL + 3, t.torTop - 8, R.tela.granate], [t.torL + 8, t.torTop - 6, PLUMA], [t.torL + 1, t.torTop - 6, R.tela.granate]];
      for (const [px, py, ram] of plumas) {
        surco(g, MADERA, 3, px, py + 3, px - 1, py + 6, null);
        const pl = capa().poly([[px - 1.5, py - 1.5], [px + 0.5, py - 2.5], [px + 1.5, py + 2.5], [px - 0.5, py + 3.5]]);
        pl.pintar(g, ram, { relieve: 1, min: 1, separar: true });
        pon(g, ram, 4, [px - 1, py - 1]);
      }
    }
    if (clase === "bardo" || clase === "picaro") {
      const cp = capaEspalda(t, clase === "bardo" ? 5 : 8, 7);
      cp.pintar(g, tela, { relieve: 3, max: 3 });
      pliegue(g, tela, t.torL, t.torTop + 6, t.torL - 3, t.pierTop + 4);
      pliegue(g, tela, t.torL + 2, t.torTop + 9, t.torL, t.pierTop + 5);
      ribete(g, cp, clase === "bardo" ? R.tela.granate : tela, clase === "bardo" ? 3 : 2);
    }
    if (clase === "barbaro") {
      /* Piel de lobo colgando por la espalda, con las patas deshilachadas. */
      const cp = capa().poly([[t.torL, t.torTop], [t.torL + 6, t.torTop], [t.torL + 2, t.torBot + 3], [t.torL - 6, t.torBot + 1], [t.torL - 3, t.torTop + 4]]);
      for (let j = t.torBot - 2; j <= t.torBot + 3; j++) for (let i = t.torL - 6; i <= t.torL + 2; i++) if ((i + j) % 3 === 0) cp.off(i, j);
      cp.pintar(g, PELLIZA, { relieve: 3, max: 2 });
      cada(g, PELLIZA, t.torL - 7, t.torTop, t.torL + 6, t.torBot + 4, (x, y, k) => { if ((x * 3 + y) % 5 === 0) g.set(x, y, PELLIZA[Math.max(0, k - 1)], PELLIZA); });
    }
  }

  /* ---------- Ropa de cada clase ---------- */
  const LAUD = matizar(["#2e150c", "#5a2e16", "#8f5426", "#c4823c", "#eab56a"]);
  const LOBO = matizar(["#29242c", "#4a4248", "#72686a", "#a29690", "#d2c8bc"]);
  const CALZAS = matizar(["#26180f", "#422c1c", "#664630", "#8a6646", "#b08a62"]);
  function vestir(g, t, clase, tela, piel) {
    const T = torso(t);
    const { torL, torR, torTop, torBot, pierTop, cx, wL, wR } = t;
    const suelo = t.suelo;
    switch (clase) {
      case "guerrero": {
        /* Cota de malla hasta medio muslo. */
        const F = falda(t, 8, 2);
        F.pintar(g, MALLA, { relieve: 3 });
        malla(g, MALLA, wL - 6, torBot - 2, wR + 6, pierTop + 10);
        ribete(g, F, MALLA, 2);
        /* Peto de placas: arista central, brillo especular y borde inferior. */
        T.pintar(g, PLACA, { relieve: 5, separar: true });
        for (let y = torTop + 2; y <= torBot - 7; y++) { pon(g, PLACA, 4, [cx + 2, y]); pon(g, PLACA, 2, [cx + 3, y]); }
        destello(g, PLACA, cx - 3, torTop + 4, true);
        pon(g, PLACA, 4, [cx - 4, torTop + 6], [cx - 2, torTop + 7]);
        for (let x = wL - 1; x <= wR + 1; x++) if (g.rampa(x, torBot - 6) === PLACA) pon(g, PLACA, 1, [x, torBot - 6]), pon(g, PLACA, 0, [x, torBot - 5]);
        /* Lamas de la escarcela con remaches. */
        for (const py of [torBot - 4, torBot - 1, pierTop + 2]) {
          const l = capa().rect(wL - 1 - (py - torBot + 4) / 2, py, wR - wL + 3 + (py - torBot + 4), 3);
          l.pintar(g, PLACA, { relieve: 1.4, separar: true });
          for (let x = wL - 4; x <= wR + 4; x++) if (l.tiene(x, py)) pon(g, PLACA, 3, [x, py]);
          for (let x = wL; x <= wR; x += 4) pon(g, PLACA, 4, [x, py + 1]), pon(g, PLACA, 1, [x + 1, py + 1]);
        }
        /* Sobreveste de la tela de la clase cayendo por delante, con ribete claro. */
        const sv = capa().rect(cx - 2, torTop + 9, 8, pierTop - torTop - 8).poly([[cx - 2.5, pierTop - 0.5], [cx + 5.5, pierTop - 0.5], [cx + 6.5, pierTop + 12.5], [cx - 3.5, pierTop + 12.5]]);
        sv.pintar(g, tela, { relieve: 2.6, separar: true });
        cada(g, tela, cx - 4, torTop + 8, cx + 8, pierTop + 13, (x, y) => { if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, R.hueso[x < cx ? 3 : 2], R.hueso); });
        ribete(g, sv, ORO, 3);
        pliegue(g, tela, cx + 1, pierTop + 1, cx + 1, pierTop + 11);
        pliegue(g, tela, cx + 4, pierTop + 4, cx + 5, pierTop + 11);
        penumbra(g, tela, cx - 3, pierTop + 2, cx + 7, pierTop + 12, 0.25);
        cinturon(g, t, CUERO, ORO, torBot - 3);
        /* Hombrera de atrás. */
        capa().ell(torL + 2, torTop + 1.5, 4, 3).pintar(g, PLACA, { relieve: 2.4, max: 3, separar: true });
        break;
      }
      case "barbaro": {
        T.pintar(g, piel, { relieve: 5.5 });
        /* Pectorales, esternón, abdominales y oblicuos marcados a mano. */
        const py = torTop + 7;
        /* Pectorales: borde inferior hondo, cara de luz encima y el pezón insinuado. */
        for (let x = cx - 5; x <= torR - 1; x++) if (x !== cx + 2) {
          pon(g, piel, x < cx - 3 || x > torR - 3 ? 1 : 0, [x, py]); pon(g, piel, 1, [x, py - 1]);
          if (x < cx + 1) pon(g, piel, x < cx - 2 ? 3 : 4, [x, py - 3]);
        }
        pon(g, piel, 4, [cx - 3, py - 4], [cx - 2, py - 4], [cx + 4, py - 3]);
        pon(g, piel, 1, [cx - 1, py - 2], [torR - 2, py - 2]);
        for (let y = torTop + 3; y < py; y++) pon(g, piel, 1, [cx + 2, y]);
        pon(g, piel, 4, [cx - 2, torTop + 3], [cx - 1, torTop + 3], [cx + 4, torTop + 3], [cx - 3, torTop + 4]);
        for (let y = py + 3; y < torBot - 3; y += 3) {
          pon(g, piel, 1, [cx - 1, y], [cx, y], [cx + 1, y], [cx + 3, y], [cx + 4, y]);
          pon(g, piel, 3, [cx, y + 1], [cx + 3, y + 1]); pon(g, piel, 4, [cx - 1, y + 1]);
        }
        for (let y = py + 1; y < torBot - 2; y++) pon(g, piel, 1, [cx + 2, y]);
        pon(g, piel, 1, [cx - 3, py + 3], [cx - 4, py + 5], [cx - 4, py + 7]);
        pon(g, piel, 0, [cx + 2, torBot - 3]);
        /* Pintura de guerra en el pecho: tres zarpazos. */
        for (let k = 0; k < 3; k++) surco(g, R.sangre, 3 - (k & 1), cx - 4 + k * 2, torTop + 9, cx - 2 + k * 2, torTop + 13, piel);
        /* Taparrabos con caída delante. */
        const tp = capa().poly([[wL - 1, torBot - 3], [wR + 1, torBot - 3], [wR + 2.5, pierTop + 4], [cx + 1, pierTop + 1], [wL - 2.5, pierTop + 4]]).poly([[cx - 1.5, torBot], [cx + 5.5, torBot], [cx + 5, pierTop + 11], [cx + 2, pierTop + 9.5], [cx - 1, pierTop + 11]]);
        tp.pintar(g, tela, { relieve: 3, separar: true });
        pliegue(g, tela, cx + 2, pierTop + 1, cx + 2, pierTop + 8);
        ribete(g, tp, tela, 2);
        for (let x = cx - 1; x <= cx + 5; x += 2) pon(g, tela, 0, [x, pierTop + 10]);
        cinturon(g, t, CUERO, R.hierro, torBot - 4, 4);
        break;
      }
      case "picaro": {
        const tr = T.copia().unir(falda(t, 5, 1));
        tr.pintar(g, tela, { relieve: 5 });
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 1, pierTop, cx - 2, pierTop + 5);
        pliegue(g, tela, cx - 4, torTop + 4, cx - 3, torBot - 4);
        /* Jubón de cuero ceñido con costuras. */
        const jb = T.copia().quitarRect(0, 0, W, torTop + 5);
        jb.pintar(g, CUERO2, { relieve: 3, separar: true });
        for (let y = torTop + 6; y < torBot - 3; y += 2) pon(g, CUERO2, 4, [cx + 3, y]), pon(g, CUERO2, 1, [cx + 4, y]);
        /* Correaje en bandolera con cuchillos arrojadizos. */
        const bd = capa().linea(torL + 1, torTop, torR, torBot - 4, 3).recortar(T);
        bd.pintar(g, CUERO, { relieve: 1.2, separar: true });
        for (let k = 0; k < 4; k++) {
          const px = torL + 3 + k * 3.6, py = torTop + 1 + k * 2.9;
          const X = Math.round(px), Y = Math.round(py);
          pon(g, ACERO, 4, [X, Y - 3]); pon(g, ACERO, 3, [X, Y - 2]); pon(g, ACERO, 2, [X + 1, Y - 2]);
          pon(g, CUERO2, 1, [X, Y - 1], [X, Y]); pon(g, ORO, 3, [X, Y + 1]);
        }
        cinturon(g, t, CUERO, R.hierro);
        /* Bolsa y puñal en la cadera. */
        capa().ell(wL, torBot + 1, 2.6, 3).pintar(g, CUERO, { relieve: 1.8, separar: true });
        pon(g, CUERO, 1, [wL - 2, torBot], [wL - 1, torBot], [wL, torBot], [wL + 1, torBot]);
        pon(g, ORO, 4, [wL, torBot + 1]);
        break;
      }
      case "explorador": {
        const tr = T.copia().unir(falda(t, 6, 1));
        tr.pintar(g, tela, { relieve: 5 });
        ribete(g, tr, tela, 2);
        surco(g, tela, 1, cx + 2, torBot, cx + 2, pierTop + 6, tela);
        pliegue(g, tela, cx - 2, pierTop, cx - 3, pierTop + 5);
        /* Jubón de cuero sin mangas con cordones. */
        const jb = capa().rect(torL, torTop + 1, torR - torL + 1, torBot - torTop - 1).quitarRect(cx + 1, torTop + 1, 4, 3).off(cx + 2, torTop + 4);
        jb.recortar(T).pintar(g, CUERO, { relieve: 3.5, separar: true });
        for (let y = torTop + 5; y < torBot - 3; y += 2) pon(g, R.hueso, 3, [cx + 2, y]), pon(g, R.hueso, 2, [cx + 3, y + 1]);
        pliegue(g, CUERO, cx - 3, torTop + 4, cx - 4, torBot - 4);
        /* Correa del carcaj en bandolera. */
        surco(g, CUERO2, 1, torL + 1, torTop, torR, torBot - 4, null);
        surco(g, CUERO2, 3, torL + 1, torTop + 1, torR, torBot - 3, null);
        surco(g, CUERO2, 2, torL + 2, torTop + 1, torR, torBot - 3, CUERO);
        pon(g, ORO, 4, [cx - 1, torTop + 6]); pon(g, ORO, 2, [cx, torTop + 7]);
        cinturon(g, t, CUERO2, ORO);
        capa().rect(wR - 2, torBot, 4, 4).pintar(g, CUERO, { relieve: 1.2, separar: true });
        pon(g, CUERO, 1, [wR - 2, torBot + 1], [wR - 1, torBot + 1], [wR, torBot + 1], [wR + 1, torBot + 1]);
        break;
      }
      case "mago":
      case "brujo": {
        const bru = clase === "brujo";
        const largo = suelo - pierTop - 2;
        const tn = T.copia().unir(falda(t, largo, bru ? 6 : 5));
        tn.pintar(g, tela, { relieve: 5 });
        penumbra(g, tela, wL - 7, pierTop, wR + 7, suelo, 0.35);
        pliegue(g, tela, cx - 2, pierTop + 1, cx - 5, suelo - 3);
        pliegue(g, tela, cx + 6, pierTop + 3, cx + 9, suelo - 3);
        pliegue(g, tela, cx - 6, pierTop + 6, cx - 8, suelo - 3);
        if (!bru) {
          /* Abertura delantera ribeteada de oro, greca en el bajo y estrellas bordadas. */
          surco(g, ORO, 2, cx + 2, torTop + 2, cx + 4, suelo - 2, tela);
          surco(g, ORO, 3, cx + 1, torTop + 2, cx + 3, suelo - 2, tela);
          surco(g, tela, 1, cx + 3, torTop + 3, cx + 5, suelo - 2, tela);
          ribete(g, tn, ORO, 3, 1);
          cada(g, tela, wL - 7, suelo - 4, wR + 7, suelo - 2, (x, y) => { if (!tn.tiene(x, y + 2) && tn.tiene(x, y + 1) && (x % 3) === 0) g.set(x, y, ORO[2], ORO); });
          /* Bordados: solo sobre la tela de la túnica (y nunca por debajo del bajo). */
          const borda = (ram, k, ...pts) => { for (const [i, j] of pts) if (g.rampa(i, j) === tela && j < suelo - 2) pon(g, ram, k, [i, j]); };
          const estrella = (x, y, grande) => {
            borda(ORO, 4, [x, y]); borda(ORO, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
            if (grande) borda(ORO, 2, [x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2]);
          };
          estrella(cx - 3, torTop + 6, true); estrella(cx + 7, pierTop + 6, true); estrella(cx - 5, pierTop + 10, true);
          estrella(cx - 1, pierTop + 17, false); estrella(cx + 9, pierTop + 15, false);
          /* Lunas crecientes. */
          borda(R.hueso, 4, [cx - 7, pierTop + 3], [cx - 6, pierTop + 2]); borda(R.hueso, 3, [cx - 7, pierTop + 4]);
          borda(R.hueso, 4, [cx + 5, pierTop + 19], [cx + 6, pierTop + 18]); borda(R.hueso, 3, [cx + 5, pierTop + 20]);
          /* Fajín con borlas. */
          for (let x = wL - 1; x <= wR + 1; x++) { pon(g, R.tela.granate, 3, [x, torBot - 3]); pon(g, R.tela.granate, 2, [x, torBot - 2]); pon(g, R.tela.granate, 1, [x, torBot - 1]); }
          pon(g, R.tela.granate, 3, [cx - 3, torBot], [cx - 3, torBot + 1], [cx - 2, torBot + 2]); pon(g, ORO, 3, [cx - 3, torBot + 3], [cx - 2, torBot + 3]);
          /* Cuello alto. */
          capa().rect(t.cabX - 3, torTop - 1, 8, 3).pintar(g, tela, { relieve: 1.2, min: 2, separar: true });
          for (let x = t.cabX - 3; x <= t.cabX + 4; x++) pon(g, ORO, 3, [x, torTop - 1]);
        } else {
          /* Panel central oscuro con runas que brillan, fajín negro y broche con gema. */
          const pn = capa().poly([[cx - 0.5, torTop + 2], [cx + 5.5, torTop + 2], [cx + 7.5, suelo], [cx - 2.5, suelo]]).recortar(tn);
          pn.pintar(g, R.tela.negro, { relieve: 2.5, separar: true });
          const runas = [[[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 0], [1, 1], [0, 2], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]], [[0, 0], [1, 0], [0, 1], [1, 2]]];
          let k = 0;
          for (let y = pierTop; y < suelo - 4; y += 5, k++) {
            const rx = cx + 1 + Math.round((y - pierTop) / 9);
            for (const [i, j] of runas[k % 4]) pon(g, R.magia, 3, [rx + i, y + j]);
            pon(g, R.magia, 4, [rx, y]);
          }
          ribete(g, tn, R.magia, 2);
          cada(g, tela, wL - 8, suelo - 4, wR + 8, suelo - 2, (x, y) => { if (!tn.tiene(x, y + 2) && tn.tiene(x, y + 1) && (x & 1)) g.set(x, y, R.magia[1], R.magia); });
          for (let x = wL - 1; x <= wR + 1; x++) { pon(g, R.tela.negro, 3, [x, torBot - 3]); pon(g, R.tela.negro, 2, [x, torBot - 2]); pon(g, R.tela.negro, 1, [x, torBot - 1]); }
          capa().ell(cx + 2.5, torBot - 2, 1.8, 1.8).pintar(g, ORO, { relieve: 1.2, min: 2 });
          pon(g, R.magia, 3, [cx + 2, torBot - 2], [cx + 3, torBot - 2]); pon(g, R.magia, 4, [cx + 2, torBot - 3]);
          /* Hombreras de tela con picos. */
          capa().poly([[torL - 1, torTop + 1], [torL + 5, torTop - 1], [torL + 6, torTop + 4], [torL - 3, torTop + 6]]).pintar(g, tela, { relieve: 2, max: 3, separar: true });
        }
        break;
      }
      case "clerigo": {
        const F = falda(t, 8, 2);
        F.pintar(g, MALLA, { relieve: 3 });
        T.pintar(g, MALLA, { relieve: 5, separar: true });
        malla(g, MALLA, torL - 3, torTop, torR + 3, pierTop + 10);
        ribete(g, F, MALLA, 2);
        /* Tabardo con el sol sagrado. */
        const sv = capa().rect(cx - 4, torTop + 1, 11, torBot - torTop).poly([[cx - 5.5, torBot - 1.5], [cx + 7.5, torBot - 1.5], [cx + 8.5, pierTop + 9.5], [cx - 6.5, pierTop + 9.5]]);
        sv.pintar(g, tela, { relieve: 3.5, separar: true });
        ribete(g, sv, ORO, 3);
        cada(g, tela, cx - 7, torTop, cx + 9, pierTop + 10, (x, y) => { if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, ORO[x < cx ? 3 : 2], ORO); });
        pliegue(g, tela, cx - 2, pierTop, cx - 3, pierTop + 8);
        pliegue(g, tela, cx + 4, pierTop, cx + 5, pierTop + 8);
        penumbra(g, tela, cx - 6, pierTop + 2, cx + 9, pierTop + 10, 0.3);
        /* Sol sagrado: disco con brillo y doce rayos alternos. */
        const sx = cx + 1, sy = torTop + 7;
        capa().ell(sx, sy, 2.2, 2.2).pintar(g, ORO, { relieve: 1.6, min: 2 });
        destello(g, ORO, sx - 1, sy - 1);
        for (let k = 0; k < 12; k++) {
          const an = (k / 12) * Math.PI * 2, r = k % 2 ? 4 : 5;
          surco(g, ORO, k % 2 ? 2 : 3, sx + Math.cos(an) * 3.2, sy + Math.sin(an) * 3.2, sx + Math.cos(an) * r, sy + Math.sin(an) * r, tela);
        }
        cinturon(g, t, CUERO, ORO);
        capa().ell(torL + 2, torTop + 1.5, 3.6, 2.8).pintar(g, PLACA, { relieve: 2.2, max: 3, separar: true });
        break;
      }
      case "bardo": {
        const tr = T.copia().unir(falda(t, 5, 1));
        tr.pintar(g, tela, { relieve: 5 });
        ribete(g, tr, R.tela.granate, 3, 2);
        /* Jubón acordonado: pechera abierta con cordón en zigzag y botonadura al costado. */
        for (let y = torTop + 2; y <= torBot - 4; y++) pon(g, R.tela.granate, 1, [cx + 2, y]), pon(g, R.tela.granate, 2, [cx + 3, y]);
        for (let y = torTop + 2; y <= torBot - 5; y += 2) { pon(g, R.hueso, 4, [cx + 1, y]); pon(g, R.hueso, 3, [cx + 2, y + 1], [cx + 3, y + 1]); pon(g, R.hueso, 4, [cx + 4, y + 2]); }
        for (let y = torTop + 3; y <= torBot - 4; y += 3) { pon(g, ORO, 4, [torR - 1, y]); pon(g, ORO, 1, [torR - 1, y + 1]); }
        /* Cuchilladas en la tela con el forro granate asomando. */
        for (const [x0, y0] of [[cx - 4, torTop + 4], [cx - 2, torTop + 9], [cx - 5, torTop + 10]]) {
          pon(g, R.tela.granate, 3, [x0, y0], [x0, y0 + 1]); pon(g, R.tela.granate, 1, [x0, y0 + 2]); pon(g, tela, 4, [x0 - 1, y0]);
        }
        pliegue(g, tela, cx - 3, torTop + 3, cx - 3, torBot - 4);
        pliegue(g, tela, cx - 1, pierTop, cx - 2, pierTop + 4);
        /* Gorguera. */
        capa().ell(t.cabX - 0.5, torTop, 5, 1.8).pintar(g, R.hueso, { relieve: 1.2, min: 2, separar: true });
        cada(g, R.hueso, t.cabX - 6, torTop - 2, t.cabX + 5, torTop + 2, (x, y) => { if (x % 2) pon(g, R.hueso, 2, [x, y]); });
        cinturon(g, t, CUERO, ORO);
        break;
      }
      default: {
        /* Túnica sencilla de los personajes llanos, con cordón. */
        const tr = T.copia().unir(falda(t, 6, 1));
        tr.pintar(g, tela, { relieve: 4.5 });
        penumbra(g, tela, wL - 3, pierTop, wR + 3, pierTop + 7, 0.35);
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 2, pierTop, cx - 3, pierTop + 6);
        pliegue(g, tela, cx + 4, pierTop + 1, cx + 5, pierTop + 6);
        pliegue(g, tela, cx - 4, torTop + 4, cx - 3, torBot - 3);
        /* Escote con lazada. */
        pon(g, piel, 2, [t.cabX, torTop], [t.cabX + 1, torTop], [t.cabX + 1, torTop + 1], [t.cabX + 2, torTop]);
        pon(g, piel, 1, [t.cabX + 1, torTop + 2]);
        pon(g, tela, 1, [t.cabX - 1, torTop], [t.cabX + 3, torTop], [t.cabX + 2, torTop + 1], [t.cabX, torTop + 1], [t.cabX + 1, torTop + 3]);
        pon(g, R.hueso, 3, [t.cabX + 1, torTop + 2]);
        /* Cordón trenzado con borlas. */
        for (let x = wL - 1; x <= wR + 1; x++) if (g.get(x, torBot - 2)) pon(g, MADERA, (x & 1) ? 2 : 4, [x, torBot - 2]), pon(g, MADERA, (x & 1) ? 3 : 1, [x, torBot - 1]);
        pon(g, MADERA, 3, [cx + 3, torBot], [cx + 4, torBot + 1]); pon(g, MADERA, 2, [cx + 3, torBot + 1], [cx + 4, torBot + 2], [cx + 3, torBot + 2]);
        pon(g, MADERA, 4, [cx + 4, torBot + 3]); pon(g, MADERA, 1, [cx + 3, torBot + 3]);
      }
    }
  }

  /* ---------- Tocados ---------- */
  function tocado(g, t, clase, tela, piel) {
    const x = t.cabX, y = t.cabY;
    switch (clase) {
      case "guerrero": {
        const yelmo = capa().ell(x - 0.2, y - 1, t.cabRx + 1.4, t.cabRy + 0.8);
        yelmo.quitarRect(x, t.ojoY - 3, 12, 11);
        yelmo.borrarDesde(y + 6);
        /* Carrillera que baja por delante de la oreja. */
        yelmo.rect(x - 1, t.ojoY - 3, 2, 9).on(x + 1, t.bocaY + 1).on(x + 1, t.bocaY);
        yelmo.pintar(g, PLACA, { relieve: 4.5, separar: true });
        /* Nasal, banda de la frente con remaches, cresta y visera. */
        for (let j = t.ojoY - 3; j <= t.ojoY + 2; j++) pon(g, PLACA, j < t.ojoY ? 3 : 2, [x + 4, j]);
        pon(g, PLACA, 1, [x + 4, t.ojoY + 2]);
        for (let i = x - 9; i <= x + 9; i++) {
          if (g.rampa(i, t.ojoY - 4) !== PLACA) continue;
          pon(g, PLACA, 1, [i, t.ojoY - 6]); pon(g, PLACA, 3, [i, t.ojoY - 5]); pon(g, PLACA, 2, [i, t.ojoY - 4]);
          if ((i - x) % 3 === 0) pon(g, PLACA, 4, [i, t.ojoY - 5]), pon(g, PLACA, 0, [i, t.ojoY - 4]);
        }
        for (let i = x - 9; i <= x + 9; i++) if (g.rampa(i, t.ojoY - 3) === PLACA && g.rampa(i + 1, t.ojoY - 3) !== PLACA) pon(g, PLACA, 1, [i, t.ojoY - 3]);
        for (let j = y - 8; j <= y - 2; j++) { const i = x - 1 + Math.round((j - y) * 0.15); if (g.rampa(i, j) === PLACA) pon(g, PLACA, 4, [i, j]), pon(g, PLACA, 2, [i + 1, j]); }
        destello(g, PLACA, x - 4, y - 5, true);
        /* Malla del cuello por detrás. */
        const cm = capa().poly([[x - 9, y + 2], [x - 2, y + 5], [x - 1, t.torTop + 1], [x - 9.5, t.torTop + 1]]);
        cm.pintar(g, MALLA, { relieve: 1.8, max: 3, separar: true });
        malla(g, MALLA, x - 10, y + 3, x - 1, t.torTop + 2);
        /* Penacho de crines que cae hacia atrás. */
        const pc = Math.max(y - 15, 1.5);
        const pe = capa().curva(x, y - 8, x - 6, pc, x - 14, y - 7, 4.2, 1.6).curva(x - 2, y - 9, x - 9, pc + 3, x - 15, y - 2, 3.2, 1.2);
        pe.pintar(g, tela, { relieve: 2, separar: true });
        cada(g, tela, x - 17, y - 17, x + 2, y - 2, (i, j, k) => { if ((i * 2 + j) % 4 === 0 && k >= 2) g.set(i, j, tela[k - 1], tela); else if ((i * 2 + j) % 4 === 2 && k === 3) g.set(i, j, tela[4], tela); });
        capa().rect(x - 2, y - 9, 3, 2).pintar(g, ORO, { relieve: 1, min: 2 });
        pon(g, ORO, 4, [x - 2, y - 9]);
        break;
      }
      case "brujo": pintarCapucha(g, t, tela, piel, true); break;
      case "explorador": pintarCapucha(g, t, tela, piel, false); break;
      case "picaro": pintarCapucha(g, t, tela, piel, false); break;
      case "clerigo": {
        /* Cofia de malla con su diadema de oro. */
        pintarCapucha(g, t, MALLA, piel, false);
        malla(g, MALLA, x - 14, y - 10, x + 9, t.torTop + 4);
        for (let i = x - 9; i <= x + 4; i++) {
          const j = t.ojoY - 5 + (i > x + 1 ? 1 : 0);
          if (g.rampa(i, j) === MALLA) pon(g, ORO, (i - x) % 4 === 0 ? 4 : 3, [i, j]), pon(g, ORO, 1, [i, j + 1]);
        }
        pon(g, R.sangre, 4, [x + 1, t.ojoY - 5]);
        break;
      }
      case "mago": {
        const by = y - 4;
        const ala = capa().ell(x - 0.5, by, t.cabRx + 4.5, 1.9);
        /* Copa cónica que se dobla hacia atrás: más alta cuando hay sitio por encima. */
        const alt = Math.min(t.altSombrero || 15, by - 1);
        /* Si hay poco sitio, la punta cae blanda por detrás de la cabeza. */
        const cono = alt >= 12
          ? capa().poly([[x - 6.5, by - 0.5], [x + 5.5, by - 0.5], [x + 3, by - alt * 0.55], [x + 0.5, by - alt * 0.85], [x - 2.5, by - alt], [x - 7, by - alt + 0.5], [x - 13, by - alt * 0.45],
            [x - 8.5, by - alt * 0.62], [x - 5.5, by - alt * 0.45], [x - 6, by - 2]])
          : capa().poly([[x - 5.5, by - 0.5], [x + 5, by - 0.5], [x + 2.5, by - alt * 0.6], [x - 0.5, by - alt], [x - 5, by - alt], [x - 10, by - alt + 2], [x - 14.5, by + 0.5],
            [x - 12, by + 0.5], [x - 9.5, by - alt + 4.5], [x - 6, by - alt + 4], [x - 5.5, by - 2]]);
        cono.quitarRect(0, 0, W, 1);
        cono.pintar(g, tela, { relieve: 3.5, separar: true });
        ala.pintar(g, tela, { relieve: 1.8, separar: true });
        for (let i = 0; i < W; i++) if (ala.tiene(i, Math.round(by + 1)) && !ala.tiene(i, Math.round(by + 2))) pon(g, tela, 1, [i, Math.round(by + 1)]);
        for (let i = 0; i < W; i++) if (ala.tiene(i, Math.round(by - 1)) && !ala.tiene(i, Math.round(by - 2)) && !cono.tiene(i, Math.round(by - 2))) pon(g, tela, 4, [i, Math.round(by - 1)]);
        /* Cinta de oro con hebilla y una estrella en la copa. */
        const b1 = Math.round(by - 1), b2 = Math.round(by - 3);
        for (let i = x - 7; i <= x + 6; i++) for (let j = b2; j <= b1; j++) if (cono.tiene(i, j) && g.rampa(i, j) === tela) pon(g, ORO, j === b1 ? 1 : j === b2 ? 3 : 2, [i, j]);
        pon(g, ORO, 4, [x - 1, b2], [x, b2], [x + 1, b2]); pon(g, ORO, 4, [x - 1, b1 - 1]); pon(g, ORO, 4, [x + 1, b1 - 1]);
        g.set(x, b1 - 1, OJOS);
        const sx = x - 1, sy = Math.round(by - alt * 0.5);
        pon(g, ORO, 4, [sx, sy]); pon(g, ORO, 3, [sx - 1, sy], [sx + 1, sy], [sx, sy - 1], [sx, sy + 1]);
        if (alt >= 12) pon(g, ORO, 4, [x - 8, Math.round(by - alt * 0.6)]); else pon(g, ORO, 4, [x - 11, by - 2]), pon(g, ORO, 3, [x - 13, by]);
        pliegue(g, tela, x + 3, Math.round(by - 4), x + 1, Math.round(by - alt * 0.7));
        pliegue(g, tela, x - 4, Math.round(by - alt * 0.8), x - 9, Math.round(by - alt * 0.6));
        break;
      }
      case "bardo": {
        /* Chambergo: copa redonda, ala ancha levantada por delante, cinta granate y una pluma larga. */
        const by = Math.round(y - 6);
        const copa = capa().ell(x - 1.5, by - 1.5, 5.6, 4.4).borrarDesde(by + 2);
        const ala = capa().ell(x - 0.5, by + 2, t.cabRx + 5.5, 1.7).poly([[x + 4, by + 3.5], [x + 9, by - 0.5], [x + 12.5, by - 2.5], [x + 12.5, by + 0.5], [x + 9, by + 3.5]]);
        copa.pintar(g, tela, { relieve: 3.2, separar: true });
        surco(g, tela, 1, x - 1, by - 5, x, by - 1, tela);
        pon(g, tela, 4, [x - 5, by - 3], [x - 4, by - 4], [x - 3, by - 5]);
        for (let i = 0; i < W; i++) {
          if (copa.tiene(i, by) ) pon(g, R.tela.granate, 3, [i, by]);
          if (copa.tiene(i, by + 1)) pon(g, R.tela.granate, 1, [i, by + 1]);
        }
        ala.pintar(g, tela, { relieve: 1.8, separar: true });
        for (let i = 0; i < W; i++) for (let j = by - 3; j <= by + 4; j++) if (ala.tiene(i, j) && !ala.tiene(i, j + 1)) pon(g, tela, 1, [i, j]);
        for (let i = 0; i < W; i++) for (let j = by - 3; j <= by + 4; j++) if (ala.tiene(i, j) && !ala.tiene(i, j - 1) && !copa.tiene(i, j - 1)) pon(g, tela, 4, [i, j]);
        /* Pluma con su raquis y las barbas teñidas. */
        const pl = capa().curva(x - 5, by, x - 11, by - 12, x - 19, by - 9, 4.4, 1);
        pl.pintar(g, PLUMA, { relieve: 1.4, min: 2, separar: true });
        surco(g, PLUMA, 1, x - 6, by - 1, x - 10, by - 8, PLUMA);
        surco(g, PLUMA, 1, x - 11, by - 9, x - 17, by - 9, PLUMA);
        cada(g, PLUMA, x - 21, by - 13, x - 15, by - 5, (i, j) => { if (i <= x - 16) pon(g, R.tela.granate, (i + j) % 2 ? 3 : 2, [i, j]); });
        cada(g, PLUMA, x - 13, by - 13, x - 4, by, (i, j, k) => { if ((i + j) % 3 === 0 && k > 1) pon(g, PLUMA, k - 1, [i, j]); });
        capa().ell(x - 5, by + 0.5, 1.4, 1.4).pintar(g, ORO, { relieve: 1, min: 2 });
        pon(g, ORO, 4, [x - 6, by]);
        break;
      }
    }
  }

  /* ---------- Armas y objetos ---------- */
  function hoja(g, x, y0, y1) {
    /* Hoja vertical de 3 píxeles: filo iluminado, vaceo central y filo en sombra, con punta. */
    for (let y = y1; y <= y0; y++) { g.set(x - 1, y, ACERO[4], ACERO); g.set(x, y, ACERO[3], ACERO); g.set(x + 1, y, ACERO[1], ACERO); }
    for (let y = y1 + 3; y <= y0 - 1; y++) g.set(x, y, ACERO[2], ACERO);
    g.set(x - 1, y1 - 1, ACERO[3], ACERO); g.set(x, y1 - 1, ACERO[2], ACERO); g.set(x, y1 - 2, ACERO[3], ACERO);
    g.quitar(x + 1, y1);
    g.set(x + 1, y1, ACERO[1], ACERO);
    g.set(x - 1, y1 + 4, BRILLO, ACERO); g.set(x - 1, y1 + 5, BRILLO, ACERO);
  }
  function objeto(g, t, clase, tela, piel) {
    const [mx, my] = t.mano;
    switch (clase) {
      case "guerrero": {
        /* Escudo de cometa por delante del cuerpo: reborde de hierro con remaches, campo de la tela con su
           brillo y una cruz clara; un perfil oscuro lo separa de la armadura. */
        const sx = t.escudo ? t.escudo[0] : t.torR + 3, sy = t.escudo ? t.escudo[1] : t.torTop + (t.bajo ? 5 : 6), hw = 7.5;
        const borde = capa().poly([[sx - hw, sy - 6.5], [sx - hw + 2, sy - 7.5], [sx + hw - 2, sy - 7.5], [sx + hw, sy - 6.5], [sx + hw, sy + 2], [sx + 3.5, sy + 11], [sx, sy + 14.5], [sx - 3.5, sy + 11], [sx - hw, sy + 2]]);
        borde.pintar(g, PLACA, { relieve: 2.6, min: 1 });
        perfilar(g, borde);
        const campo = capa().poly([[sx - hw + 1.5, sy - 6], [sx + hw - 1.5, sy - 6], [sx + hw - 1.5, sy + 1.6], [sx + 2.4, sy + 10], [sx, sy + 12.5], [sx - 2.4, sy + 10], [sx - hw + 1.5, sy + 1.6]]);
        campo.pintar(g, tela, { relieve: 5, luz: [-0.6, -0.5, 0.7] });
        penumbra(g, tela, Math.round(sx - hw), sy + 2, Math.round(sx + hw), sy + 13, 0.2);
        const cxs = Math.round(sx), cys = sy - 1;
        for (let j = sy - 5; j <= sy + 11; j++) { pon(g, R.hueso, 4, [cxs - 1, j]); pon(g, R.hueso, 3, [cxs, j]); pon(g, tela, 0, [cxs + 1, j]); }
        for (let i = cxs - 5; i <= cxs + 5; i++) { pon(g, R.hueso, i < cxs ? 4 : 3, [i, cys - 1]); pon(g, R.hueso, 2, [i, cys]); pon(g, tela, 0, [i, cys + 1]); }
        pon(g, R.hueso, 4, [cxs, cys - 1], [cxs - 1, cys]);
        g.set(cxs - 1, cys - 1, BRILLO, R.hueso);
        /* Brillo del reborde y remaches. */
        for (let i = Math.round(sx - hw); i <= Math.round(sx + hw); i++) if (g.rampa(i, Math.round(sy - 7)) === PLACA) pon(g, PLACA, 4, [i, Math.round(sy - 7)]);
        for (let j = sy - 6; j <= sy + 2; j++) if (g.rampa(Math.round(sx - hw) + 0, j) === PLACA) pon(g, PLACA, 3, [Math.round(sx - hw), j]);
        for (const [i, j] of [[sx - hw + 1, sy - 6], [sx + hw - 1, sy - 6], [sx - hw + 0.5, sy + 1], [sx + hw - 0.5, sy + 1], [sx, sy + 13.5], [sx - 4.5, sy + 7.5], [sx + 4.5, sy + 7.5]]) {
          const X = Math.round(i), Y = Math.round(j);
          pon(g, ORO, 4, [X, Y]); pon(g, ORO, 1, [X + 1, Y + 1]);
        }
        destello(g, tela, cxs - 4, sy - 4, false);
        pon(g, tela, 4, [cxs - 5, sy - 4], [cxs - 4, sy - 3]);
        break;
      }
      case "espada": {
        /* Espada en alto, con guarda de gavilanes curvos, gema, puño forrado y pomo. */
        const tope = Math.max(2, my - (t.bajo ? 22 : 28));
        const hj = capa().rect(mx - 1, tope - 2, 3, my - tope);
        hoja(g, mx, my - 3, tope);
        perfilar(g, hj);
        const gd = capa().rect(mx - 4, my - 3, 9, 2).on(mx - 5, my - 4).on(mx + 5, my - 4);
        gd.pintar(g, ORO, { relieve: 1, min: 2, separar: true });
        pon(g, ORO, 4, [mx - 3, my - 3], [mx - 2, my - 3], [mx - 5, my - 4]);
        pon(g, R.sangre, 4, [mx, my - 3]); pon(g, R.sangre, 2, [mx, my - 2]);
        pon(g, CUERO, 2, [mx, my + 4]); pon(g, CUERO, 3, [mx - 1, my + 4]);
        capa().ell(mx, my + 5.5, 1.4, 1.2).pintar(g, ORO, { relieve: 1, min: 2 });
        pon(g, ORO, 4, [mx - 1, my + 5]);
        break;
      }
      case "barbaro": {
        /* Hacha a dos manos: mango con empuñadura de cuero y hoja creciente de doble luna. */
        const mango = capa().linea(mx - 2, my + 12, mx + 3, my - 18, 3);
        mango.pintar(g, MADERA, { relieve: 1.4, min: 1 });
        for (let j = my - 2; j <= my + 8; j += 2) pon(g, CUERO, 1, [mx, j], [mx - 1, j + 1]), pon(g, CUERO, 3, [mx + 1, j]);
        const hx = mx + 3, hy = Math.max(9, my - 18);
        const hj = capa().poly([[hx, hy - 3], [hx + 6, hy - 9], [hx + 11, hy - 4], [hx + 12, hy + 3], [hx + 8, hy + 9], [hx + 1, hy + 4]]);
        hj.quitarEll(hx + 4, hy - 7.5, 2.5, 2.2).quitarEll(hx + 4, hy + 8, 2.5, 2.2);
        hj.pintar(g, ACERO, { relieve: 3, separar: true });
        /* Filo brillante en el borde curvo y un grabado. */
        for (let j = hy - 9; j <= hy + 9; j++) { let xx = -1; for (let i = hx + 13; i >= hx; i--) if (hj.tiene(i, j)) { xx = i; break; } if (xx > 0) { pon(g, ACERO, 4, [xx, j]); pon(g, ACERO, 3, [xx - 1, j]); } }
        surco(g, ACERO, 1, hx + 4, hy - 1, hx + 7, hy + 2, ACERO);
        destello(g, ACERO, hx + 9, hy - 2, true);
        capa().rect(hx - 2, hy - 3, 4, 7).pintar(g, R.hierro, { relieve: 1.2, separar: true });
        pon(g, R.hierro, 4, [hx - 2, hy - 3]); pon(g, R.hierro, 4, [hx, hy - 1]);
        /* Pincho de atrás. */
        capa().poly([[hx - 2, hy - 1.5], [hx - 7, hy + 0.5], [hx - 2, hy + 2.5]]).pintar(g, ACERO, { relieve: 1, separar: true });
        break;
      }
      case "picaro": {
        /* Daga en presa invertida: la hoja asoma por debajo del puño, con el filo hacia delante. */
        for (let j = 0; j < 9; j++) { const X = mx - 1 + Math.round(j * 0.25), Y = my + 4 + j; pon(g, ACERO, 4, [X, Y]); pon(g, ACERO, 2, [X + 1, Y]); }
        pon(g, ACERO, 3, [mx + 1, my + 13]); pon(g, ACERO, 1, [mx + 2, my + 12]);
        g.set(mx - 1, my + 6, BRILLO, ACERO);
        capa().rect(mx - 3, my + 3, 6, 1).pintar(g, ORO, { relieve: 1, min: 2 });
        pon(g, ORO, 4, [mx - 3, my + 3]);
        capa().ell(mx, my - 2.5, 1.2, 1.2).pintar(g, ORO, { relieve: 1, min: 2 });
        break;
      }
      case "explorador": {
        /* Arco largo tenso: palas curvadas hacia atrás, cuerda en V hasta la mano y flecha montada. */
        const top = Math.max(2, my - (t.bajo ? 17 : 22)), bot = my + (t.bajo ? 15 : 20);
        const ax = mx + 2;
        const arco = capa().curva(ax - 4, top, ax + 5, (top + my) / 2 - 2, ax + 1, my, 2.4, 2.8).curva(ax + 1, my, ax + 5, (bot + my) / 2 + 2, ax - 4, bot, 2.8, 2.4);
        arco.pintar(g, MADERA, { relieve: 1.4, min: 1 });
        surco(g, MADERA, 4, ax - 2, top + 2, ax + 1, top + 7, MADERA);
        surco(g, MADERA, 4, ax + 2, my + 4, ax + 1, my + 8, MADERA);
        pon(g, R.hueso, 4, [ax - 5, top - 1], [ax - 5, bot + 1]); pon(g, R.hueso, 3, [ax - 4, top - 1], [ax - 4, bot + 1]);
        /* Cuerda tensa hasta la mano que tira. */
        const [dx, dy] = t.tiro;
        const cuerda = (x0, y0) => {
          const n = Math.max(Math.abs(dx - x0), Math.abs(dy - y0));
          for (let s = 0; s <= n; s++) { const X = Math.round(x0 + (dx - x0) * s / n), Y = Math.round(y0 + (dy - y0) * s / n); if (g.rampa(X, Y) !== MADERA) g.set(X, Y, R.hueso[3], R.hueso); }
        };
        cuerda(ax - 5, top); cuerda(ax - 5, bot);
        /* Flecha: astil, punta de acero y plumas. */
        for (let i = dx - 1; i <= ax + 8; i++) pon(g, MADERA, 3, [i, dy]);
        pon(g, ACERO, 4, [ax + 9, dy], [ax + 10, dy]); pon(g, ACERO, 2, [ax + 9, dy - 1], [ax + 9, dy + 1]); pon(g, ACERO, 3, [ax + 11, dy]);
        pon(g, R.tela.granate, 3, [dx - 3, dy - 1], [dx - 2, dy - 1]); pon(g, R.tela.granate, 2, [dx - 3, dy + 1], [dx - 2, dy + 1]); pon(g, MADERA, 3, [dx - 2, dy], [dx - 3, dy]);
        break;
      }
      case "mago": {
        /* Báculo hasta el suelo con un orbe sujeto por garras y un halo de luz. */
        const oy = Math.max(5, t.cabY - 10);
        const bx = mx;
        capa().rect(bx - 1, oy + 3, 2, t.suelo - oy - 3).pintar(g, MADERA, { relieve: 1.2, min: 1 });
        for (let j = oy + 6; j < t.suelo; j += 6) pon(g, MADERA, 1, [bx, j], [bx - 1, j + 1]), pon(g, MADERA, 4, [bx - 1, j - 1]);
        /* Destellos de luz alrededor del orbe. */
        const chispa = (X, Y, grande) => { pon(g, R.mar, 4, [X, Y]); if (grande) pon(g, R.mar, 3, [X - 1, Y], [X + 1, Y], [X, Y - 1], [X, Y + 1]), pon(g, R.mar, 2, [X - 2, Y], [X + 2, Y], [X, Y - 2], [X, Y + 2]); };
        chispa(bx + 6, oy - 3, true); chispa(bx - 5, oy + 6, false); chispa(bx + 5, oy + 4, false);
        capa().ell(bx, oy, 3.4, 3.4).pintar(g, R.mar, { relieve: 2.6, min: 2 });
        pon(g, R.mar, 4, [bx - 1, oy - 1], [bx - 2, oy], [bx, oy - 2]);
        g.set(bx - 1, oy - 2, BRILLO, R.mar);
        pon(g, R.mar, 1, [bx + 2, oy + 1], [bx + 1, oy + 2]);
        pon(g, MADERA, 3, [bx - 3, oy + 2], [bx + 2, oy + 2], [bx - 3, oy + 1], [bx + 3, oy + 1], [bx - 4, oy], [bx + 3, oy]);
        pon(g, MADERA, 2, [bx - 2, oy + 3], [bx + 1, oy + 3]);
        pon(g, ORO, 3, [bx - 1, oy + 4], [bx, oy + 4]); pon(g, ORO, 4, [bx - 1, oy + 4]);
        break;
      }
      case "brujo": {
        /* Cristal de magia que flota sobre la mano abierta, con chispas. */
        const cx = mx + 3, cy = my - 10;
        const cr = capa().poly([[cx + 0.5, cy - 6], [cx + 3.5, cy - 1], [cx + 0.5, cy + 5], [cx - 2.5, cy - 1]]);
        cr.pintar(g, R.magia, { relieve: 2, min: 1 });
        surco(g, R.magia, 4, cx, cy - 5, cx - 1, cy - 1, R.magia);
        surco(g, R.magia, 2, cx + 1, cy - 1, cx + 1, cy + 3, R.magia);
        g.set(cx - 1, cy - 3, BRILLO, R.magia);
        for (const [i, j, k] of [[cx - 5, cy - 4, 4], [cx + 5, cy - 6, 3], [cx + 6, cy + 2, 4], [cx - 4, cy + 3, 3], [cx + 1, cy + 8, 3], [cx - 1, cy + 7, 2]]) pon(g, R.magia, k, [i, j]);
        pon(g, R.magia, 3, [cx - 5, cy - 5], [cx - 5, cy - 3], [cx - 6, cy - 4], [cx - 4, cy - 4]);
        break;
      }
      case "clerigo": {
        /* Maza de pestañas: mango forrado y cabeza de aletas con su pomo. */
        capa().rect(mx - 1, my - 10, 2, 16).pintar(g, MADERA, { relieve: 1, min: 1 });
        for (let j = my - 8; j <= my + 5; j += 2) pon(g, CUERO, 2, [mx - 1, j], [mx, j]);
        const cy = my - 13;
        capa().ell(mx, cy, 2.6, 3.2).pintar(g, R.hierro, { relieve: 1.8, min: 1, separar: true });
        const al = capa().poly([[mx - 5.5, cy - 2.5], [mx - 2, cy - 3.5], [mx - 2, cy + 3.5], [mx - 5.5, cy + 2.5]]).poly([[mx + 5.5, cy - 2.5], [mx + 2, cy - 3.5], [mx + 2, cy + 3.5], [mx + 5.5, cy + 2.5]]).rect(mx - 1, cy - 6, 2, 3);
        al.pintar(g, R.hierro, { relieve: 1.2, min: 1, separar: true });
        for (let j = cy - 3; j <= cy + 3; j++) pon(g, R.hierro, 4, [mx - 5, j]), pon(g, R.hierro, 3, [mx + 2, j]);
        destello(g, R.hierro, mx - 1, cy - 2, true);
        capa().ell(mx, cy - 7, 1.3, 1.3).pintar(g, ORO, { relieve: 1, min: 2 });
        pon(g, ORO, 3, [mx - 1, my - 10], [mx, my - 10]); pon(g, ORO, 4, [mx - 1, my - 10]);
        capa().ell(mx, my + 7, 1.4, 1.2).pintar(g, ORO, { relieve: 1, min: 2 });
        break;
      }
      case "bardo": {
        /* Laúd de caja de pera: tapa de madera clara con la boca y su roseta, puente, mástil con trastes,
           clavijero doblado hacia atrás y las cuerdas. */
        const lx = mx - 1, ly = my + 4;
        const mast = capa().linea(lx + 4, ly - 4, lx + 11, ly - 14, 3);
        mast.pintar(g, MADERA, { relieve: 1, max: 2 });
        perfilar(g, mast);
        for (let k = 1; k < 5; k++) pon(g, R.hueso, 2, [lx + 5 + k * 1.4 | 0, ly - 5 - k * 2]);
        const cl = capa().poly([[lx + 10, ly - 13.5], [lx + 13, ly - 16], [lx + 15.5, ly - 14], [lx + 12.5, ly - 11.5]]);
        cl.pintar(g, MADERA, { relieve: 1, max: 3, separar: true });
        pon(g, R.hueso, 4, [lx + 11, ly - 17], [lx + 14, ly - 17], [lx + 16, ly - 14], [lx + 15, ly - 12]);
        const caja = capa().ell(lx, ly, 6.4, 5.4).ell(lx + 3.6, ly - 3, 3.8, 3.2);
        caja.pintar(g, LAUD, { relieve: 4, luz: [-0.55, -0.6, 0.7] });
        perfilar(g, caja);
        /* Borde oscuro de la caja (los aros) por abajo. */
        for (let i = lx - 8; i <= lx + 8; i++) for (let j = ly - 8; j <= ly + 7; j++) if (caja.tiene(i, j) && !caja.tiene(i, j + 1)) pon(g, MADERA, 1, [i, j]), caja.tiene(i, j - 1) && pon(g, MADERA, 2, [i, j - 1]);
        capa().ell(lx + 1.5, ly - 1, 1.7, 1.7).pintar(g, MADERA, { plano: 0 });
        for (const [i, j] of [[lx + 1, ly - 3], [lx + 3, ly - 2], [lx + 3, ly], [lx + 1, ly + 1], [lx - 1, ly], [lx - 1, ly - 2]]) pon(g, ORO, 3, [i, j]);
        capa().rect(lx - 4, ly + 2, 4, 1).pintar(g, MADERA, { plano: 1 });
        pon(g, MADERA, 3, [lx - 4, ly + 1]);
        surco(g, R.hueso, 4, lx - 3, ly + 2, lx + 11, ly - 15, null);
        surco(g, R.hueso, 2, lx - 2, ly + 2, lx + 12, ly - 15, null);
        break;
      }
    }
  }

  /* Objetos extra para personajes no jugadores (los mismos que HEROES.OBJETOS_EXTRA, a 64×64). */
  const OBJETOS_EXTRA = {
    martillo(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx - 1, my - 12, 2, 18).pintar(g, MADERA, { relieve: 1, min: 1 });
      capa().rect(mx - 5, my - 18, 10, 7).pintar(g, R.hierro, { relieve: 2.4, separar: true });
      destello(g, R.hierro, mx - 4, my - 17, true);
      puno(g, mx, my, t.piel || R.piel.clara);
    },
    caduceo(g, t) {
      const [mx] = t.mano;
      capa().rect(mx - 1, 8, 2, t.suelo - 8).pintar(g, R.bronce, { relieve: 1, min: 2 });
      capa().ell(mx, 6, 2.4, 2.4).pintar(g, R.bronce, { relieve: 1, min: 3 });
      for (let y = 12; y < 32; y++) pon(g, R.hoja, 3, [mx + ((y >> 1) % 2 ? 2 : -3), y]);
      pon(g, R.hueso, 4, [mx - 3, 8], [mx + 3, 8], [mx - 5, 7], [mx + 5, 7]);
      pon(g, R.hueso, 3, [mx - 4, 8], [mx + 4, 8], [mx - 6, 6], [mx + 6, 6]);
    },
    copa(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx - 3, my - 7, 8, 4).pintar(g, R.oricalco, { relieve: 1.2, min: 2 });
      capa().rect(mx, my - 3, 2, 3).pintar(g, R.oricalco, { relieve: 1, min: 2 });
      pon(g, R.sangre, 3, [mx - 2, my - 7], [mx, my - 7], [mx + 2, my - 7], [mx + 3, my - 7]);
    },
    odre(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 1, my + 3, 5, 4).pintar(g, CUERO, { relieve: 2.4 });
      pon(g, CUERO, 1, [mx + 6, my + 2]);
    },
    cayado(g, t) {
      const [mx] = t.mano;
      capa().rect(mx - 1, 11, 2, t.suelo - 11).curva(mx - 1, 11, mx, 4, mx + 6, 7, 2, 2).pintar(g, MADERA, { relieve: 1, min: 2 });
    },
    anillo(g, t) {
      const [mx, my] = t.mano;
      pon(g, R.bronce, 4, [mx + 1, my - 4], [mx + 2, my - 5]); pon(g, R.bronce, 3, [mx + 2, my - 4], [mx + 1, my - 5]);
      pon(g, R.hueso, 4, [mx + 5, my - 8], [mx - 1, my - 8]);
    },
    balanza(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx, my - 11, 1, 11).rect(mx - 6, my - 11, 13, 1).pintar(g, R.bronce, { plano: 3 });
      capa().rect(mx - 7, my - 5, 5, 1).rect(mx + 3, my - 5, 5, 1).pintar(g, R.bronce, { plano: 2 });
      for (const i of [mx - 6, mx - 3, mx + 4, mx + 7]) surco(g, R.bronce, 1, mx + (i < mx ? -6 : 6), my - 10, i, my - 6, null);
    }
  };

  /* Hombrera de placas superpuestas con remaches de oro. */
  function hombrera(g, t) {
    const [hx, hy] = t.hombro;
    capa().ell(hx, hy - 0.5, 4.4, 3.4).pintar(g, PLACA, { relieve: 2.6, separar: true });
    capa().ell(hx + 0.5, hy + 3, 3.6, 1.8).pintar(g, PLACA, { relieve: 1.6, separar: true });
    capa().ell(hx + 1, hy + 5, 2.8, 1.4).pintar(g, PLACA, { relieve: 1.4, separar: true });
    destello(g, PLACA, hx - 2, hy - 2, true);
    pon(g, ORO, 3, [hx + 2, hy + 3], [hx - 2, hy + 3]);
  }

  /* ---------- Poses ----------
     aspecto.pose: "ataque", "conjuro", "herido" o "victoria" (cualquier otra cosa es la postura de siempre).
     La pose mueve la plantilla (tronco adelantado o echado atrás, rodillas y pies), inclina lo que hay por encima
     de la cadera desplazando sus filas (cizalla: escalones de un píxel, como se inclina a mano) y vuelve a dibujar
     brazos y armas con articulaciones libres. Cada arma se dibuja en un marco local (de pie, con la mano en 0,0)
     que luego se gira a la rejilla, así que sirve para cualquier ángulo; las formas se rasterizan ya giradas y el
     relieve se calcula después, con la luz de siempre. */
  const POSES = ["normal", "ataque", "conjuro", "herido", "victoria"];
  /* Luz de los conjuros: el tono 4 es el corazón y los bajos, el halo. El brujo, verde con el halo violeta. */
  const LUZ = {
    mago: ["#1d1650", "#3b36a6", "#6a6fe2", "#a9b2fa", "#eef0ff"],
    brujo: ["#2a1240", "#6a2c9a", "#46b064", "#9cf08e", "#efffe0"],
    clerigo: ["#4a2a0c", "#9a6418", "#dca632", "#ffe27c", "#fffbe2"],
    bardo: ["#0b2c30", "#167068", "#27ae9e", "#66e8d2", "#dcfff6"],
    neutro: ["#3a3848", "#6c6a80", "#a8aabe", "#dcdeea", "#ffffff"]
  };
  const ESTELA = ["#4a4e66", "#7c8298", "#b0b8cc", "#dce2ee", "#fbfcff"];

  /* Desplaza el tronco y la cabeza (los pies se quedan donde están). */
  function mover(t, dx, dy) {
    for (const k of ["cx", "cabX", "ojo1", "ojo2", "narizX", "torL", "torR", "wL", "wR", "caderaAtras", "caderaDelante"]) t[k] += dx;
    for (const k of ["cabY", "ojoY", "bocaY", "torTop", "torBot", "pierTop"]) t[k] += dy;
    for (const k of ["hombro", "codo", "mano", "hombroAtras", "manoAtras", "tiro"]) if (t[k]) t[k] = [t[k][0] + dx, t[k][1] + dy];
    t.rodillaY = Math.round((t.pierTop + t.suelo) / 2) - 1;
    return t;
  }
  function posar(t, pose) {
    const P = { pose, incl: 0, cab: 0 };
    t.pose = pose;
    /* El sombrero del mago no cambia de forma al agacharse. */
    t.altSombrero = Math.min(15, t.cabY - 5);
    if (pose === "ataque") {
      /* Zancada: el pie de delante avanza con la rodilla doblada sobre él, el de atrás se estira. */
      mover(t, 1, 3); P.incl = 0.075;
      t.pieAtras -= 3; t.pieDelante += 4; t.kDx = 3.5;
      t.faldaI = -3; t.faldaD = 3; t.capaDx = -5; t.capaDy = -3;
    } else if (pose === "conjuro") {
      t.pieAtras -= 1; t.pieDelante += 1; P.incl = -0.03;
      /* El aire de la magia levanta el bajo de la túnica y la capa hacia atrás. */
      t.faldaI = -3; t.faldaIy = -3; t.faldaD = 2; t.faldaDy = -1; t.capaDx = -6; t.capaDy = -4;
    } else if (pose === "herido") {
      /* Retroceso: el golpe echa el tronco atrás y la cabeza todavía más; la rodilla de delante cede. */
      mover(t, -1, 2); P.incl = -0.085; P.cab = -0.11;
      t.pieAtras -= 1; t.kDx = 3.5; t.kAx = -0.5;
      t.faldaI = -1; t.faldaD = 2; t.capaDx = 2; t.capaDy = 1;
    } else if (pose === "victoria") {
      t.pieAtras -= 1; t.pieDelante += 1; P.incl = -0.025;
    }
    const piv = t.pierTop, cuello = t.torTop + 1;
    P.desp = y => y >= piv ? 0 : Math.round(P.incl * (piv - y)) + (P.cab && y < cuello ? Math.round(P.cab * (cuello - y)) : 0);
    return P;
  }
  /* Desplaza cada fila según desp(y). */
  function cizallar(g, desp) {
    for (let y = 0; y < H; y++) {
      const d = desp(y);
      if (!d) continue;
      const o = y * W, c = g.c.slice(o, o + W), r = g.r.slice(o, o + W);
      for (let x = 0; x < W; x++) { g.c[o + x] = null; g.r[o + x] = null; }
      for (let x = 0; x < W; x++) if (c[x]) { const nx = x + d; if (nx >= 0 && nx < W) { g.c[o + nx] = c[x]; g.r[o + nx] = r[x]; } }
    }
  }
  /* Dibuja algo por detrás de lo ya pintado: solo ocupa los huecos, en sombra, y con una línea honda donde
     asoma junto al cuerpo. */
  function detras(g, dibujar) {
    const gb = new Rejilla(W, H);
    dibujar(gb);
    const nuevo = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (gb.c[i] && !g.c[i]) {
      const r = gb.r[i], k = r ? r.indexOf(gb.c[i]) : -1;
      g.c[i] = r && k > 2 ? r[2] : gb.c[i]; g.r[i] = r; nuevo[i] = 1;
    }
    const toca = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g.c[y * W + x] && !nuevo[y * W + x];
    const marcas = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (nuevo[y * W + x] && (toca(x + 1, y) || toca(x - 1, y) || toca(x, y - 1) || toca(x, y + 1))) marcas.push(y * W + x);
    for (const i of marcas) { const r = g.r[i]; if (r) g.c[i] = r[0]; }
  }

  /* Marco local girado: (x, y) del objeto de pie, con la mano en 0,0 y la punta hacia y negativas.
     ang en grados: 0 = hacia arriba, 90 = hacia delante (derecha), 180 = hacia abajo. */
  function marco(ox, oy, angGrados) {
    const a = (angGrados * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const f = (x, y) => [ox + x * c - y * s, oy + x * s + y * c];
    const m = {
      f,
      inv: (X, Y) => { const dx = X - ox, dy = Y - oy; return [dx * c + dy * s, -dx * s + dy * c]; },
      at: (x, y) => { const [X, Y] = f(x, y); return [Math.round(X), Math.round(Y)]; },
      poly: (k, pts) => k.poly(pts.map(p => f(p[0], p[1]))),
      ell: (k, cx, cy, rx, ry = rx) => { const pts = []; for (let i = 0; i < 24; i++) { const b = (i / 24) * Math.PI * 2; pts.push([cx + Math.cos(b) * (rx + 0.3), cy + Math.sin(b) * (ry + 0.3)]); } return m.poly(k, pts); },
      rect: (k, x, y, w, h) => m.poly(k, [[x - 0.5, y - 0.5], [x + w - 0.5, y - 0.5], [x + w - 0.5, y + h - 0.5], [x - 0.5, y + h - 0.5]]),
      linea: (k, x0, y0, x1, y1, gr) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); return k.linea(a0, b0, a1, b1, gr); },
      curva: (k, x0, y0, cx, cy, x1, y1, g0, g1) => { const [a0, b0] = f(x0, y0), [ca, cb] = f(cx, cy), [a1, b1] = f(x1, y1); return k.curva(a0, b0, ca, cb, a1, b1, g0, g1); },
      pon: (g, ram, k, ...pts) => { for (const [x, y] of pts) { const [X, Y] = m.at(x, y); g.set(X, Y, ram[lim(k, 0, 4)], ram); } },
      surco: (g, ram, k, x0, y0, x1, y1, solo) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); surco(g, ram, k, a0, b0, a1, b1, solo); }
    };
    return m;
  }
  /* Hoja de acero en cualquier ángulo: el filo de la izquierda local mira a la luz, el de la derecha a la sombra. */
  function pintarHoja(g, c, m, punta, ancho = 1.5) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      const [lx, ly] = m.inv(x, y);
      const k = lx < -ancho / 3 ? 4 : lx > ancho / 3 ? 1 : ly < punta + 3 ? 3 : 2;
      g.set(x, y, ACERO[ancho < 1.5 && k === 2 ? 3 : k], ACERO);
    }
  }

  /* ---------- Armas en su marco ---------- */
  function espadaL(g, m, largo) {
    const hj = capa();
    m.poly(hj, [[-1.5, -3.5], [1.5, -3.5], [1.5, -largo + 1.5], [0, -largo - 1.5], [-1.5, -largo + 1.5]]);
    pintarHoja(g, hj, m, -largo);
    const [bx, by] = m.at(-1, -largo + 5); g.set(bx, by, BRILLO, ACERO);
    perfilar(g, hj);
    const gd = capa(); m.rect(gd, -4, -3, 9, 2); m.rect(gd, -5, -4, 1, 1); m.rect(gd, 5, -4, 1, 1);
    gd.pintar(g, ORO, { relieve: 1, min: 2, separar: true });
    m.pon(g, ORO, 4, [-3, -3], [-2, -3], [-5, -4]);
    m.pon(g, R.sangre, 4, [0, -3]); m.pon(g, R.sangre, 2, [0, -2]);
    m.pon(g, CUERO, 2, [0, 4]); m.pon(g, CUERO, 3, [-1, 4]);
    const pm = capa(); m.ell(pm, 0, 5.5, 1.2, 1); pm.pintar(g, ORO, { relieve: 1, min: 2 });
  }
  function hachaL(g, m) {
    const mango = capa(); m.linea(mango, 0, 11, 0, -17, 3);
    mango.pintar(g, MADERA, { relieve: 1.4, min: 1 });
    for (let j = -2; j <= 8; j += 2) m.pon(g, CUERO, 1, [0, j], [-1, j + 1]), m.pon(g, CUERO, 3, [1, j]);
    const hx = 2, hy = -16;
    const hj = capa(); m.poly(hj, [[hx, hy - 3], [hx + 6, hy - 9], [hx + 11, hy - 4], [hx + 12, hy + 3], [hx + 8, hy + 9], [hx + 1, hy + 4]]);
    hj.restar(m.ell(capa(), hx + 4, hy - 7.5, 2.3, 2)).restar(m.ell(capa(), hx + 4, hy + 8, 2.3, 2));
    hj.pintar(g, ACERO, { relieve: 3, separar: true });
    /* El filo curvo brilla: el borde del lado del corte. */
    const marcas = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!hj.tiene(x, y)) continue;
      const [lx, ly] = m.inv(x, y);
      const [a1, b1] = m.at(lx + 1.3, ly), [a2, b2] = m.at(lx + 2.4, ly);
      if (!hj.tiene(a1, b1)) marcas.push([x, y, 4]); else if (!hj.tiene(a2, b2)) marcas.push([x, y, 3]);
    }
    for (const [x, y, k] of marcas) g.set(x, y, ACERO[k], ACERO);
    m.surco(g, ACERO, 1, hx + 4, hy - 1, hx + 7, hy + 2, ACERO);
    const [dx, dy] = m.at(hx + 8, hy - 2); destello(g, ACERO, dx, dy, true);
    const ab = capa(); m.rect(ab, hx - 2, hy - 3, 4, 7); ab.pintar(g, R.hierro, { relieve: 1.2, separar: true });
    m.pon(g, R.hierro, 4, [hx - 2, hy - 3], [hx, hy - 1]);
    const pc = capa(); m.poly(pc, [[hx - 2, hy - 1.5], [hx - 7, hy + 0.5], [hx - 2, hy + 2.5]]); pc.pintar(g, ACERO, { relieve: 1, separar: true });
  }
  function dagaL(g, m) {
    const hj = capa(); m.poly(hj, [[-1, -3.5], [1, -3.5], [1, -10], [0, -13], [-1, -10]]);
    pintarHoja(g, hj, m, -12, 1);
    const [bx, by] = m.at(-0.5, -8); g.set(bx, by, BRILLO, ACERO);
    perfilar(g, hj);
    const gd = capa(); m.rect(gd, -3, -3, 6, 1); gd.pintar(g, ORO, { relieve: 1, min: 2 });
    m.pon(g, ORO, 4, [-3, -3]);
    const pm = capa(); m.ell(pm, 0, 3.5, 1, 1); pm.pintar(g, ORO, { relieve: 1, min: 2 });
  }
  function mazaL(g, m) {
    const mg = capa(); m.rect(mg, -1, -10, 2, 16); mg.pintar(g, MADERA, { relieve: 1, min: 1 });
    for (let j = -8; j <= 5; j += 2) m.pon(g, CUERO, 2, [-1, j], [0, j]);
    const cy = -13;
    const cb = capa(); m.ell(cb, 0, cy, 2.6, 3.2); cb.pintar(g, R.hierro, { relieve: 1.8, min: 1, separar: true });
    const al = capa();
    m.poly(al, [[-5.5, cy - 2.5], [-2, cy - 3.5], [-2, cy + 3.5], [-5.5, cy + 2.5]]); m.poly(al, [[5.5, cy - 2.5], [2, cy - 3.5], [2, cy + 3.5], [5.5, cy + 2.5]]); m.rect(al, -1, cy - 6, 2, 3);
    al.pintar(g, R.hierro, { relieve: 1.2, min: 1, separar: true });
    for (let j = cy - 3; j <= cy + 3; j++) m.pon(g, R.hierro, 3, [-5, j], [2, j]);
    const [dx, dy] = m.at(-1, cy - 2); destello(g, R.hierro, dx, dy, true);
    const pm = capa(); m.ell(pm, 0, cy - 7, 1.2); pm.pintar(g, ORO, { relieve: 1, min: 2 });
    m.pon(g, ORO, 3, [-1, -10], [0, -10]); m.pon(g, ORO, 4, [-1, -10]);
    const po = capa(); m.ell(po, 0, 7, 1.2, 1); po.pintar(g, ORO, { relieve: 1, min: 2 });
  }
  /* Báculo: el orbe a «arriba» píxeles de la mano y el regatón a «abajo». */
  function bastonL(g, m, arriba, abajo) {
    const oy = -arriba;
    const vara = capa(); m.rect(vara, -1, oy + 3, 2, abajo - oy - 3); vara.pintar(g, MADERA, { relieve: 1.2, min: 1 });
    for (let j = oy + 7; j < abajo; j += 6) m.pon(g, MADERA, 1, [0, j], [-1, j + 1]), m.pon(g, MADERA, 4, [-1, j - 1]);
    const [X, Y] = m.at(0, oy);
    capa().ell(X, Y, 3.4, 3.4).pintar(g, R.mar, { relieve: 2.6, min: 2 });
    pon(g, R.mar, 4, [X - 1, Y - 1], [X - 2, Y], [X, Y - 2]);
    g.set(X - 1, Y - 2, BRILLO, R.mar);
    pon(g, R.mar, 1, [X + 2, Y + 1], [X + 1, Y + 2]);
    m.pon(g, MADERA, 3, [-3, oy + 2], [2, oy + 2], [-3, oy + 1], [3, oy + 1], [-4, oy], [3, oy]);
    m.pon(g, MADERA, 2, [-2, oy + 3], [1, oy + 3]);
    m.pon(g, ORO, 3, [-1, oy + 4], [0, oy + 4]); m.pon(g, ORO, 4, [-1, oy + 4]);
    return [X, Y];
  }
  function chispa(g, ram, X, Y, grande) {
    pon(g, ram, 4, [X, Y]);
    if (grande) pon(g, ram, 3, [X - 1, Y], [X + 1, Y], [X, Y - 1], [X, Y + 1]), pon(g, ram, 2, [X - 2, Y], [X + 2, Y], [X, Y - 2], [X, Y + 2]);
  }
  function cristal(g, cx, cy) {
    const cr = capa().poly([[cx + 0.5, cy - 6], [cx + 3.5, cy - 1], [cx + 0.5, cy + 5], [cx - 2.5, cy - 1]]);
    cr.pintar(g, R.magia, { relieve: 2, min: 1 });
    surco(g, R.magia, 4, cx, cy - 5, cx - 1, cy - 1, R.magia);
    surco(g, R.magia, 2, cx + 1, cy - 1, cx + 1, cy + 3, R.magia);
    g.set(cx - 1, cy - 3, BRILLO, R.magia);
  }
  /* Arco: «cuerda» es el punto (en la rejilla) del que tira la mano, o null con la cuerda suelta y recta. */
  function arcoL(g, m, alto, bajo, cuerda) {
    const ax = 2, top = -alto, bot = bajo;
    const a = capa();
    m.curva(a, ax - 4, top, ax + 5, top / 2 - 2, ax + 1, 0, 2.4, 2.8); m.curva(a, ax + 1, 0, ax + 5, bot / 2 + 2, ax - 4, bot, 2.8, 2.4);
    a.pintar(g, MADERA, { relieve: 1.4, min: 1 });
    m.surco(g, MADERA, 4, ax - 2, top + 2, ax + 1, top + 7, MADERA);
    m.surco(g, MADERA, 4, ax + 2, 4, ax + 1, 8, MADERA);
    m.pon(g, R.hueso, 4, [ax - 5, top - 1], [ax - 5, bot + 1]); m.pon(g, R.hueso, 3, [ax - 4, top - 1], [ax - 4, bot + 1]);
    const linea = (x0, y0, x1, y1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let s = 0; s <= n; s++) { const X = Math.round(x0 + (x1 - x0) * s / n), Y = Math.round(y0 + (y1 - y0) * s / n); if (g.rampa(X, Y) !== MADERA) g.set(X, Y, R.hueso[3], R.hueso); }
    };
    const [t0, t1] = m.f(ax - 5, top), [b0, b1] = m.f(ax - 5, bot);
    if (cuerda) { linea(t0, t1, cuerda[0], cuerda[1]); linea(b0, b1, cuerda[0], cuerda[1]); }
    else linea(t0, t1, b0, b1);
  }
  function laudL(g, m) {
    const lx = -1, ly = 4;
    const mast = capa(); m.linea(mast, lx + 4, ly - 4, lx + 11, ly - 14, 3);
    mast.pintar(g, MADERA, { relieve: 1, max: 2 });
    perfilar(g, mast);
    for (let k = 1; k < 5; k++) m.pon(g, R.hueso, 2, [lx + 5 + k * 1.4 | 0, ly - 5 - k * 2]);
    const cl = capa(); m.poly(cl, [[lx + 10, ly - 13.5], [lx + 13, ly - 16], [lx + 15.5, ly - 14], [lx + 12.5, ly - 11.5]]);
    cl.pintar(g, MADERA, { relieve: 1, max: 3, separar: true });
    m.pon(g, R.hueso, 4, [lx + 11, ly - 17], [lx + 14, ly - 17], [lx + 16, ly - 14], [lx + 15, ly - 12]);
    const caja = capa(); m.ell(caja, lx, ly, 6.4, 5.4); m.ell(caja, lx + 3.6, ly - 3, 3.8, 3.2);
    caja.pintar(g, LAUD, { relieve: 4, luz: [-0.55, -0.6, 0.7] });
    perfilar(g, caja);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (caja.tiene(x, y) && !caja.tiene(x, y + 1)) { pon(g, MADERA, 1, [x, y]); if (caja.tiene(x, y - 1)) pon(g, MADERA, 2, [x, y - 1]); }
    const bo = capa(); m.ell(bo, lx + 1.5, ly - 1, 1.5); bo.pintar(g, MADERA, { plano: 0 });
    m.pon(g, ORO, 3, [lx + 1, ly - 3], [lx + 3, ly - 2], [lx + 3, ly], [lx + 1, ly + 1], [lx - 1, ly], [lx - 1, ly - 2]);
    const pu = capa(); m.rect(pu, lx - 4, ly + 2, 4, 1); pu.pintar(g, MADERA, { plano: 1 });
    m.pon(g, MADERA, 3, [lx - 4, ly + 1]);
    m.surco(g, R.hueso, 4, lx - 3, ly + 2, lx + 11, ly - 15, null);
    m.surco(g, R.hueso, 2, lx - 2, ly + 2, lx + 12, ly - 15, null);
    return m.at(lx + 13, ly - 15);
  }

  /* ---------- Manos de las poses ---------- */
  /* Mano abierta con la palma hacia delante y los dedos arriba (para conjurar o al recibir un golpe). */
  function manoAbierta(g, x, y, ram) {
    const c = capa().rect(x - 2, y - 2, 4, 4).rect(x - 1, y + 2, 3, 1).on(x - 2, y - 3).on(x - 1, y - 4).on(x, y - 4).on(x + 1, y - 3).on(x + 2, y - 1).on(x + 2, y).on(x + 3, y - 2);
    c.pintar(g, ram, { relieve: 1.3, separar: true });
    pon(g, ram, 3, [x - 2, y - 3], [x, y - 4], [x - 2, y - 1]);
    pon(g, ram, 4, [x - 1, y - 4], [x - 1, y - 2]);
    pon(g, ram, 2, [x + 1, y - 3]);
    pon(g, ram, 1, [x - 1, y - 3], [x + 1, y - 2], [x, y + 1], [x + 1, y + 2], [x + 2, y]);
  }
  /* Palma hacia arriba, plana, bajo el cristal del brujo. */
  function palmaArriba(g, mx, my, ram) {
    capa().rect(mx - 2, my - 1, 5, 3).rect(mx + 3, my - 2, 1, 2).on(mx - 2, my - 2).pintar(g, ram, { relieve: 1.2, separar: true });
    pon(g, ram, 1, [mx - 1, my + 1], [mx + 1, my + 1]); pon(g, ram, 4, [mx - 1, my - 1], [mx, my - 1]);
  }
  /* Codo por cinemática inversa de dos huesos; «pref» dice hacia dónde se dobla. Devuelve [codo, mano]. */
  function codoIK(Hm, M, l1, l2, pref) {
    let dx = M[0] - Hm[0], dy = M[1] - Hm[1], d = Math.hypot(dx, dy) || 1;
    const max = l1 + l2 - 0.2;
    if (d > max) { M = [Hm[0] + (dx / d) * max, Hm[1] + (dy / d) * max]; dx = M[0] - Hm[0]; dy = M[1] - Hm[1]; d = max; }
    const a = Math.acos(lim((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), b = Math.atan2(dy, dx);
    const e1 = [Hm[0] + Math.cos(b + a) * l1, Hm[1] + Math.sin(b + a) * l1], e2 = [Hm[0] + Math.cos(b - a) * l1, Hm[1] + Math.sin(b - a) * l1];
    const p = (e) => (e[0] - Hm[0]) * pref[0] + (e[1] - Hm[1]) * pref[1];
    return [p(e1) >= p(e2) ? e1 : e2, M];
  }
  /* Brazo con articulaciones libres; la manga ancha cuelga siempre hacia el suelo. */
  function brazoLibre(g, t, piel, m, Hm, E, M, mano) {
    const gr = t.grosor;
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const Wm = [M[0] - ux * 1.5, M[1] - uy * 1.5];
    const sup = capa().linea(Hm[0], Hm[1], E[0], E[1], gr + 1);
    const inf = capa().linea(E[0], E[1], Wm[0], Wm[1], gr + (m.ancha ? 1 : 0));
    sup.pintar(g, m.sup || piel, { relieve: 2.4, separar: true });
    inf.pintar(g, m.inf || piel, { relieve: 2.2, separar: true });
    if (!m.ancha && !m.brazal && (m.inf || piel) === piel) pon(g, piel, 3, [E[0], E[1] - 1]);
    if (m.ancha) {
      const cae = 3.2 + Math.abs(ux) * 1.6, bajoY = Math.max(E[1], Wm[1]);
      const b = capa().poly([[E[0] - 1.2, E[1] - 1], [Wm[0] - uy * 0.5, Wm[1] - 2], [Wm[0] + 0.6, Wm[1] + 2.5], [E[0] + (Wm[0] - E[0]) * 0.6, bajoY + cae], [E[0] - 1.6, E[1] + 3]]);
      b.pintar(g, m.inf, { relieve: 2.2, separar: true });
      const rib = m.ribete || m.inf;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (b.tiene(x, y) && !b.tiene(x, y + 1) && g.rampa(x, y) === m.inf) g.set(x, y, rib[m.ribete ? 3 : 1], rib);
      pliegue(g, m.inf, E[0] + 1, E[1] + 1, (E[0] + Wm[0]) / 2, bajoY + cae - 2);
    }
    if (m.brazal) {
      const bz = capa().linea(E[0] + ux, E[1] + uy, Wm[0] - ux, Wm[1] - uy, gr + 1);
      bz.recortar(inf).pintar(g, m.brazal, { relieve: 1.6, separar: true });
      for (let s = 1; s < 4; s++) { const cx = E[0] + ux * s * 1.4, cy = E[1] + uy * s * 1.4; surco(g, m.brazal, 0, cx - uy * 1.5 - ux, cy + ux * 1.5 - uy, cx + uy * 1.5 + ux, cy - ux * 1.5 + uy, m.brazal); }
    }
    const ram = m.guante || piel;
    if (mano === "puno") puno(g, M[0], M[1], ram);
    else if (mano === "abierta") manoAbierta(g, Math.round(M[0]), Math.round(M[1]), ram);
    else if (mano === "palma") palmaArriba(g, Math.round(M[0]), Math.round(M[1]), ram);
    else if (mano === "colgando") mano(g, Math.round(M[0]), Math.round(M[1]), ram, false);
  }
  /* Luz de magia de 5×5 (cruz con el corazón blanco) y un par de motas. */
  function luzMagia(g, x, y, ram, grande = true) {
    x = Math.round(x); y = Math.round(y);
    if (grande) {
      pon(g, ram, 1, [x - 3, y], [x + 3, y], [x, y - 3], [x, y + 3]);
      pon(g, ram, 2, [x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]);
    }
    pon(g, ram, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    g.set(x, y, BRILLO, ram);
    if (grande) { pon(g, ram, 4, [x + 3, y - 3], [x - 3, y + 2]); pon(g, ram, 3, [x + 4, y + 2]); }
  }
  /* Estela del golpe: arco claro alrededor de «c» de a0 a a1 (grados de pantalla), que se apaga hacia a0.
     Se pinta después del contorno y solo en los huecos, sin línea, como un barrido de movimiento. */
  function estela(g, c, r, a0, a1, ancho) {
    const pasos = Math.ceil(Math.abs(a1 - a0) * r / 25) + 6;
    const vistos = new Set();
    for (let s = 0; s <= pasos; s++) {
      const u = s / pasos, a = ((a0 + (a1 - a0) * u) * Math.PI) / 180;
      const gr = 0.7 + ancho * Math.pow(u, 0.7);
      for (let e = -gr; e <= gr + 0.01; e += 0.5) {
        const X = Math.round(c[0] + Math.cos(a) * (r + e)), Y = Math.round(c[1] + Math.sin(a) * (r + e));
        const k = X + Y * W;
        if (vistos.has(k) || X < 1 || Y < 1 || X > W - 2 || Y > H - 2 || g.get(X, Y)) continue;
        if (u < 0.35 && umbral(X, Y) > u * 2.6) continue;
        vistos.add(k);
        const tono = u > 0.8 ? 4 : u > 0.5 ? 3 : u > 0.25 ? 2 : 1;
        g.set(X, Y, ESTELA[Math.max(1, tono - (Math.abs(e) > gr - 0.6 ? 1 : 0))], ESTELA);
      }
    }
  }
  /* Rayas rectas de velocidad (estocadas, flechas): solo en los huecos. */
  function rayas(g, x0, x1, y, tono = 3) {
    for (let x = Math.round(x0); x <= Math.round(x1); x++) {
      if (x < 1 || x > W - 2 || g.get(x, y)) continue;
      const u = (x - x0) / Math.max(1, x1 - x0);
      if (u < 0.5 && umbral(x, y) > u * 2) continue;
      g.set(x, y, ESTELA[u > 0.75 ? tono : Math.max(1, tono - 1)], ESTELA);
    }
  }

  /* Qué arma lleva cada clase y cómo la dibuja su marco. */
  const ARMA = { guerrero: "espada", barbaro: "hacha", picaro: "daga", explorador: "arco", mago: "baston", brujo: "cristal", clerigo: "maza", bardo: "laud" };
  function dibujarArma(g, tipo, M, o) {
    const m = marco(M[0], M[1], o.ang || 0);
    switch (tipo) {
      case "espada": espadaL(g, m, o.largo || 20); return m.at(0, -(o.largo || 20));
      case "hacha": hachaL(g, m); return m.at(8, -16);
      case "daga": dagaL(g, m); return m.at(0, -12);
      case "maza": mazaL(g, m); return m.at(0, -13);
      case "baston": return bastonL(g, m, o.arriba || 14, o.abajo || 20);
      case "arco": arcoL(g, m, o.alto || 18, o.bajo || 18, o.cuerda || null); return m.at(4, 0);
      case "laud": return laudL(g, m);
      case "cristal": { const [X, Y] = m.at(o.cx || 0, o.cy || -10); cristal(g, X, Y); return [X, Y]; }
    }
    return M;
  }
  /* Caja de lo que pinta un arma respecto a la mano (se dibuja en el centro de una rejilla de prueba). */
  const cacheCaja = new Map();
  function cajaArma(tipo, o) {
    const clave = [tipo, o.ang, o.largo, o.arriba, o.abajo, o.alto, o.bajo, o.cx, o.cy].join();
    if (cacheCaja.has(clave)) return cacheCaja.get(clave);
    const caja = cajaArma0(tipo, o);
    cacheCaja.set(clave, caja);
    return caja;
  }
  function cajaArma0(tipo, o) {
    const g = new Rejilla(W, H);
    dibujarArma(g, tipo, [32, 32], o);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.get(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { x0: x0 - 32, y0: y0 - 32, x1: x1 - 32, y1: y1 - 32 };
  }
  /* Nota musical de 3×5 para el bardo. */
  function nota(g, x, y, ram) {
    pon(g, ram, 3, [x + 1, y - 4], [x + 1, y - 3], [x + 1, y - 2], [x + 2, y - 4], [x + 3, y - 3]);
    pon(g, ram, 4, [x, y - 1], [x + 1, y - 1]); pon(g, ram, 2, [x, y], [x + 1, y]);
  }

  /* Plan de cada pose: adónde va cada mano (desde su hombro, en un cuerpo normal), qué forma tiene y cómo va el arma.
     cerca = brazo del lado del espectador; lejos = el otro, que se dibuja por detrás. */
  function planPose(pose, tipo, clase) {
    const B = (d, mano, pref = [0, 1], mas = {}) => Object.assign({ d, mano, pref }, mas);
    const luzC = LUZ[clase] || LUZ.neutro;
    const colgando = B([-4, 11], "colgando", [-1, 0]);
    if (pose === "ataque") {
      const atras = B([-8, 8], "puno", [0, 1]);
      switch (tipo) {
        case "espada": return { cerca: B([8, 4], "puno"), lejos: null, arma: { tipo, ang: 118 }, escudo: [-2, 9], estela: { barrido: 115, ancho: 2.6 } };
        case "hacha": return { cerca: B([10, 7], "puno"), lejos: B([0, 0], "puno", [0, 1], { mango: 3.5 }), arma: { tipo, ang: 118 }, estela: { barrido: 120, ancho: 2.6 } };
        case "daga": return { cerca: B([12, 4], "puno"), lejos: atras, arma: { tipo, ang: 100 }, rayas: true, luz: { en: "arma", ram: LUZ.neutro, d: [1, 0], grande: false } };
        case "arco": return { cerca: B([12, -1], "puno", [0, 1]), lejos: null, arma: { tipo, ang: 0, cuerda: null }, flecha: true, suelta: true };
        case "baston": return { cerca: B([9, 2], "puno"), lejos: colgando, arma: { tipo, ang: 74, arriba: 15, abajo: 17 }, luz: { en: "arma", ram: LUZ.mago, d: [3, -1], grande: false }, rayas: true };
        case "cristal": return { cerca: B([12, 0], "abierta"), lejos: colgando, arma: { tipo, ang: 0, cx: 6, cy: -3 }, luz: { en: "arma", ram: LUZ.brujo, d: [5, 1], grande: false }, rayas: true };
        case "maza": return { cerca: B([10, 5], "puno"), lejos: colgando, arma: { tipo, ang: 122 }, estela: { barrido: 115, ancho: 2.4 }, simbolo: true };
        case "laud": return { cerca: B([9, 5], "puno"), lejos: colgando, arma: { tipo, ang: 38, antes: true }, luz: { en: "arma", ram: LUZ.bardo, d: [2, -1], grande: false }, nota: true };
      }
      return { cerca: B([12, 2], "puno"), lejos: atras, arma: null, rayas: true };
    }
    if (pose === "conjuro") {
      const alzada = B([8, -9], "abierta", [1, 1]);
      const atras = B([6, -9], "abierta", [1, 1]);
      const luzMano = ram => ({ en: "mano", ram, d: [1, -7], grande: true });
      switch (tipo) {
        case "espada": return { cerca: B([7, -7], "puno", [1, 1]), lejos: null, arma: { tipo, ang: 32 }, escudo: [3, 7], luz: { en: "arma", ram: LUZ.neutro, d: [0, 0], grande: true } };
        case "hacha": return { cerca: alzada, lejos: B([-3, 11], "puno", [-1, 0]), arma: { tipo, ang: -18, en: "lejos" }, luz: luzMano(LUZ.neutro) };
        case "daga": return { cerca: alzada, lejos: B([-3, 10], "puno", [-1, 0]), arma: { tipo, ang: 180, en: "lejos" }, luz: luzMano(LUZ.neutro) };
        case "arco": return { cerca: alzada, lejos: B([-2, 10], "puno", [-1, 0]), arma: { tipo, ang: 0, en: "lejos", alto: 15, bajo: 14 }, luz: luzMano(LUZ.neutro) };
        case "baston": return { cerca: B([7, -6], "puno", [1, 1]), lejos: atras, arma: { tipo, ang: 12, arriba: 15, abajo: 22 }, luz: { en: "arma", ram: LUZ.mago, d: [4, -4], grande: true } };
        case "cristal": return { cerca: B([9, -7], "palma", [1, 1]), lejos: atras, arma: { tipo, ang: 0, cx: 1, cy: -9 }, luz: { en: "arma", ram: LUZ.brujo, d: [5, -3], grande: true } };
        case "maza": return { cerca: alzada, lejos: B([-3, 9], "puno", [-1, 0]), arma: { tipo, ang: 180, en: "lejos" }, luz: luzMano(LUZ.clerigo) };
        case "laud": return { cerca: B([7, -3], "puno", [1, 1]), lejos: atras, arma: { tipo, ang: -12, antes: true }, luz: { en: "arma", ram: LUZ.bardo, d: [3, -2], grande: true }, nota: true };
      }
      return { cerca: alzada, lejos: atras, arma: null, luz: luzMano(luzC) };
    }
    if (pose === "herido") {
      const atras = B([-10, 1], "abierta", [0, 1]);
      const fuera = B([9, 6], "puno", [0, 1]);
      switch (tipo) {
        case "espada": return { cerca: B([8, 8], "puno"), lejos: null, arma: { tipo, ang: 38 }, escudo: [0, 4] };
        case "hacha": return { cerca: B([8, 8], "puno"), lejos: atras, arma: { tipo, ang: 42 } };
        case "daga": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 205 } };
        case "arco": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 22, alto: 16, bajo: 14 } };
        case "baston": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 24, arriba: 14, abajo: 20 } };
        case "cristal": return { cerca: B([9, 5], "abierta"), lejos: atras, arma: { tipo, ang: 0, cx: 7, cy: -7 } };
        case "maza": return { cerca: B([8, 8], "puno"), lejos: atras, arma: { tipo, ang: 40 } };
        case "laud": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 28, antes: true } };
      }
      return { cerca: B([9, 5], "abierta"), lejos: atras, arma: null };
    }
    if (pose === "victoria") {
      const arriba = B([9, -11], "puno", [1, 0]);
      const otra = B([-1, -12], "puno", [-1, 0]);
      switch (tipo) {
        case "espada": return { cerca: arriba, lejos: null, arma: { tipo, ang: 40 }, escudo: [2, 8] };
        case "hacha": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 22 } };
        case "daga": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 15 } };
        case "arco": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 10, alto: 14, bajo: 12 } };
        case "baston": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 6, arriba: 13, abajo: 24 }, luz: { en: "arma", ram: LUZ.mago, d: [4, -3], grande: false } };
        case "cristal": return { cerca: B([9, -11], "palma", [1, 0]), lejos: otra, arma: { tipo, ang: 0, cx: 1, cy: -9 }, luz: { en: "arma", ram: LUZ.brujo, d: [5, -2], grande: false } };
        case "maza": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 15 } };
        case "laud": return { cerca: B([10, -9], "puno", [1, 0]), lejos: otra, arma: { tipo, ang: -30, antes: true }, nota: true };
      }
      return { cerca: arriba, lejos: otra, arma: null };
    }
    return null;
  }

  /* Brazos, armas y adornos de los hombros en una pose. Devuelve lo que se pinta después del contorno. */
  function armarPose(g, t, o) {
    const { clase, piel, tela, manga, conArma, extra } = o, nombreExtra = o.objeto;
    const tipo = extra || !conArma ? null : ARMA[clase] || null;
    const pl = planPose(o.pose, tipo, clase);
    const l1 = Math.hypot(t.codo[0] - t.hombro[0], t.codo[1] - t.hombro[1]), l2 = Math.hypot(t.mano[0] - t.codo[0], t.mano[1] - t.codo[1]);
    const s = (l1 + l2) / 12.4;
    const lado = (b, Hm) => b && { Hm, M: [Hm[0] + b.d[0] * s, Hm[1] + b.d[1] * s], pref: b.pref, mano: b.mano, mango: b.mango };
    const C = lado(pl.cerca, t.hombro), L = lado(pl.lejos, t.hombroAtras);
    const A = pl.arma ? Object.assign({}, pl.arma) : null;
    if (A && A.tipo === "espada") A.largo = t.bajo ? 21 : 26;
    const conArmaEn = A ? (A.en === "lejos" ? L : C) : null;
    /* Que el arma quepa: se acorta la espada o se recoge la mano. */
    if (A && conArmaEn) for (let it = 0; it < 8; it++) {
      const [, M] = codoIK(conArmaEn.Hm, conArmaEn.M, l1, l2, conArmaEn.pref);
      conArmaEn.M = M;
      const b = cajaArma(A.tipo, A);
      const dr = M[0] + b.x1 - 60, du = 2 - (M[1] + b.y0), dl = 2 - (M[0] + b.x0), dd = M[1] + b.y1 - 61;
      if (dr <= 0 && du <= 0 && dl <= 0 && dd <= 0) break;
      if (A.tipo === "espada" && A.largo > 13 && (dr > 0 || du > 0)) { A.largo = Math.max(13, A.largo - Math.max(1, Math.max(dr, du))); continue; }
      conArmaEn.M = [M[0] - Math.max(0, dr) + Math.max(0, dl), M[1] + Math.max(0, du) - Math.max(0, dd)];
    }
    for (const X of [C, L]) if (X) { const [E, M] = codoIK(X.Hm, X.M, l1, l2, X.pref); X.E = E; X.M = M; }
    /* Hacha a dos manos: la mano de atrás agarra el mango un poco más abajo. */
    if (L && L.mango && A) {
      const a = (A.ang * Math.PI) / 180;
      L.M = [C.M[0] - Math.sin(a) * L.mango, C.M[1] + Math.cos(a) * L.mango];
      const [E, M] = codoIK(L.Hm, L.M, l1, l2, L.pref); L.E = E; L.M = M;
    }
    const ram = manga.guante || piel;
    const ponMano = (gg, X) => {
      const x = X.M[0], y = X.M[1];
      if (X.mano === "puno") puno(gg, x, y, ram);
      else if (X.mano === "abierta") manoAbierta(gg, Math.round(x), Math.round(y), ram);
      else if (X.mano === "palma") palmaArriba(gg, Math.round(x), Math.round(y), ram);
      else if (X.mano === "colgando") mano(gg, Math.round(x), Math.round(y), ram, true);
    };
    let punta = null;
    /* 1. El brazo de atrás (con su arma si la lleva él), por detrás de todo. */
    if (L) detras(g, gb => {
      brazoLibre(gb, t, piel, manga, L.Hm, L.E, L.M, null);
      if (A && A.en === "lejos") punta = dibujarArma(gb, A.tipo, L.M, A);
      ponMano(gb, L);
      if (pl.simbolo || (L.mano === "colgando" && clase === "clerigo" && conArma && !extra)) {
        const ax = Math.round(L.M[0]), ay = Math.round(L.M[1]);
        surco(gb, ORO, 2, ax, ay + 4, ax, ay + 7, null);
        capa().ell(ax, ay + 9, 1.8, 1.8).pintar(gb, ORO, { relieve: 1.2, min: 2 });
        pon(gb, ORO, 4, [ax - 1, ay + 8]);
      }
    });
    /* 2. El escudo delante del cuerpo. */
    if (pl.escudo) objeto(g, Object.assign({}, t, { escudo: [t.torR + pl.escudo[0], t.torTop + pl.escudo[1]] }), "guerrero", tela, piel);
    /* 3. El brazo de delante y su arma (el laúd va por debajo del brazo). */
    const tX = Object.assign({}, t, { mano: [Math.round(C.M[0]), Math.round(C.M[1])], piel });
    if (A && A.en !== "lejos" && A.antes) punta = dibujarArma(g, A.tipo, C.M, A);
    if (extra && nombreExtra !== "martillo") OBJETOS_EXTRA[nombreExtra](g, tX);
    brazoLibre(g, t, piel, manga, C.Hm, C.E, C.M, null);
    if (A && A.en !== "lejos" && !A.antes) punta = dibujarArma(g, A.tipo, C.M, A);
    if (extra && nombreExtra === "martillo") OBJETOS_EXTRA.martillo(g, tX);
    else ponMano(g, C);
    /* 4. Lo que va sobre el hombro. */
    if (clase === "guerrero" || clase === "clerigo") hombrera(g, t);
    if (clase === "bardo") {
      const [hx, hy] = t.hombro;
      capa().ell(hx + 0.5, hy + 1, 3.4, 3.4).pintar(g, tela, { relieve: 2.4, separar: true });
      for (const i of [hx - 1, hx + 1, hx + 3]) pon(g, R.tela.granate, 3, [i, hy], [i, hy + 1]), pon(g, R.tela.granate, 1, [i, hy + 2]);
    }
    /* 5. Luz de la magia y destellos. */
    if (pl.luz) {
      const base = pl.luz.en === "arma" && punta ? punta : C.M;
      luzMagia(g, base[0] + pl.luz.d[0], base[1] + pl.luz.d[1], pl.luz.ram, pl.luz.grande);
    }
    if (pl.nota && punta) nota(g, Math.round(Math.min(punta[0] - 3, 57)), Math.round(Math.max(punta[1] - 4, 6)), LUZ.bardo);
    /* La mano que suelta la cuerda sale despedida hacia atrás, junto al hombro. */
    if (pl.suelta) {
      const hx = t.cx - 1, hy = t.torTop + 2;
      capa().linea(t.torL + 2, t.torTop + 5, hx, hy + 1, t.grosor).pintar(g, piel, { relieve: 1.6, separar: true });
      manoAbierta(g, hx, hy, piel);
    }
    /* La flecha ya se va: solo asoma su punta en el borde. */
    if (pl.flecha) {
      const y = Math.round(C.M[1]) - 1;
      pon(g, ACERO, 4, [59, y], [60, y]); pon(g, ACERO, 2, [59, y - 1], [59, y + 1]); pon(g, MADERA, 3, [57, y], [58, y]);
    }
    /* Lo de después del contorno: estelas y rayas de velocidad. */
    const post = [];
    if (pl.estela && punta) {
      const [hx, hy] = t.hombro, r = Math.hypot(punta[0] - hx, punta[1] - hy) - 1.5, a1 = (Math.atan2(punta[1] - hy, punta[0] - hx) * 180) / Math.PI;
      post.push(gg => estela(gg, t.hombro, r, a1 - pl.estela.barrido, a1 - 6, pl.estela.ancho));
    }
    if (pl.rayas) {
      const y = Math.round(C.M[1]), x = Math.round(C.M[0]), x1 = punta ? Math.min(Math.round(punta[0]) - 2, 60) : x + 4;
      post.push(gg => { rayas(gg, x - 6, x1, y - 4); rayas(gg, x - 4, x1 - 2, y + 4); });
    }
    if (pl.flecha) {
      const y = Math.round(C.M[1]) - 1, x = Math.round(C.M[0]);
      post.push(gg => { rayas(gg, x + 5, 56, y, 4); rayas(gg, x + 9, 55, y - 2, 3); rayas(gg, x + 9, 55, y + 2, 3); });
    }
    return post;
  }

  /* ---------- Composición ---------- */
  const PIERNAS = {
    guerrero: { ramPierna: PLACA, ramBota: PLACA, rodillera: PLACA, alto: 9 },
    clerigo: { ramPierna: MALLA, ramBota: CUERO, alto: 9 },
    picaro: { ramPierna: R.tela.negro, ramBota: CUERO2, alto: 12 },
    explorador: { ramPierna: CALZAS, ramBota: CUERO, alto: 11 },
    bardo: { ramPierna: R.tela.negro, ramBota: CUERO, alto: 8, puntera: ORO },
    barbaro: { ramPierna: null, ramBota: PELLIZA, alto: 9 }
  };
  const MANGAS = {
    guerrero: { sup: PLACA, inf: PLACA, guante: PLACA },
    clerigo: { sup: MALLA, inf: MALLA, guante: CUERO },
    mago: { ancha: true, ribete: ORO },
    brujo: { ancha: true, ribete: R.magia },
    picaro: { guante: CUERO2 },
    explorador: { brazal: CUERO },
    bardo: {},
    barbaro: { brazal: CUERO }
  };

  function componer(a = {}) {
    a = a && typeof a === "object" ? a : {};
    const raza = RAZAS[a.raza] ? a.raza : "humano";
    const vis = RAZAS[raza] || {};
    const clase = typeof a.clase === "string" && a.clase ? a.clase : "guerrero";
    const t = plantilla(a.cuerpo || vis.cuerpo || "normal");
    const piel = matizar(R0.piel[a.piel] || R0.piel[(vis.pieles || [])[0]] || R0.piel.clara);
    const ramPelo = matizar(R0.pelo[a.pelo] || R0.pelo[(vis.pelos || [])[0] || "negro"] || R0.pelo.negro);
    const tela = matizar(R0.tela[a.tela] || R0.tela[TELA_CLASE[clase]] || R0.tela.terracota);
    const peinado = vis.sinPelo ? "rapado" : (PEINADOS.includes(a.peinado) ? a.peinado : "corto");
    const pose = POSES.includes(a.pose) ? a.pose : "normal";
    const gesto0 = GESTOS.includes(a.gesto) ? a.gesto : "normal";
    /* Las poses traen su gesto: dolor al recibir, alegría al vencer y rabia al golpear (si no había otro). */
    const gesto = pose === "herido" ? "dolor" : pose === "victoria" ? "alegre" : pose === "ataque" && gesto0 === "normal" ? "furia" : gesto0;
    const draco = raza === "draconido";
    const iris = raza === "elfo" ? IRISES.verde : raza === "gnomo" ? IRISES.azul : raza === "semiorco" ? IRISES.ambar
      : [IRISES.castano, IRISES.azul, IRISES.verde, IRISES.castano, IRISES.gris][hashTexto((a.piel || "") + (a.pelo || "") + raza) % 5];
    const g = new Rejilla(W, H);
    t.piel = piel;
    const tapaPelo = ["guerrero", "brujo", "picaro", "explorador", "clerigo"].includes(clase);
    const largas = clase === "mago" || clase === "brujo";
    const extra = typeof a.objeto === "string" && OBJETOS_EXTRA[a.objeto];
    const conArma = !extra && a.objeto !== "ninguno";
    const arquero = clase === "explorador" && conArma;
    if (arquero) {
      /* Brazo de delante estirado con el arco; la otra mano tira de la cuerda junto al pecho. */
      t.codo = [t.torR + 4, t.torTop + 4];
      t.mano = [t.torR + 8, t.torTop + 5];
      t.tiro = [t.cx + 3, t.torTop + 5];
    }
    const P = pose !== "normal" ? posar(t, pose) : null;

    cola(g, t, piel, raza);
    espalda(g, t, clase, tela);
    const mg = MANGAS[clase] || {};
    const manga = { sup: mg.sup || (clase === "barbaro" ? piel : tela), inf: mg.inf || (mg.ancha || ["picaro", "bardo"].includes(clase) ? tela : piel), guante: mg.guante, ancha: mg.ancha, ribete: mg.ribete, brazal: mg.brazal };
    if (P) { /* en las poses el brazo de atrás se dibuja al final, por detrás */ }
    else if (!arquero) brazoAtras(g, t, piel, manga);
    else {
      /* Codo de atrás levantado a la altura del hombro. */
      const [hx, hy] = t.hombroAtras;
      capa().linea(hx, hy, hx - 5, hy + 1, t.grosor + 1).pintar(g, manga.sup, { relieve: 2, max: 2 });
    }
    const descalzo = raza === "mediano" && !["guerrero", "clerigo"].includes(clase);
    const op = Object.assign({ ramPierna: CALZAS, ramBota: CUERO2, alto: 6 }, PIERNAS[clase] || {});
    if (descalzo) op.descalzo = true;
    if (!largas || raza === "satiro") piernas(g, t, piel, raza, ramPelo, op);
    else if (draco) {
      /* Garras asomando bajo la túnica. */
      for (const x0 of [t.pieAtras - 4, t.pieDelante - 1]) {
        capa().rect(x0, t.suelo - 2, 7, 3).pintar(g, piel, { relieve: 1.2, separar: true });
        pon(g, R.hueso, 4, [x0 + 7, t.suelo]); pon(g, R.hueso, 3, [x0 + 4, t.suelo]); pon(g, R.hueso, 3, [x0 + 2, t.suelo]);
      }
    } else if (raza === "mediano") piernas(g, t, piel, raza, ramPelo, { descalzo: true });
    else {
      /* Zapatos puntiagudos asomando bajo la túnica. */
      for (const [x0, at] of [[t.pieAtras - 3, true], [t.pieDelante - 1, false]]) {
        const z = capa().rect(x0, t.suelo - 2, 7, 3).on(x0 + 7, t.suelo).off(x0, t.suelo - 2);
        z.pintar(g, CUERO2, { relieve: 1.2, max: at ? 2 : 4, separar: true });
        for (let i = x0; i <= x0 + 7; i++) pon(g, CUERO2, 0, [i, t.suelo]);
      }
    }
    vestir(g, t, clase, tela, piel);
    if (draco) cabezaDraconido(g, t, piel, gesto);
    else cabeza(g, t, piel);
    if (!draco) pelo(g, t, ramPelo, peinado, raza, tapaPelo);
    if (!draco) oreja(g, t, piel, raza);
    if ((a.barba || vis.barba) && !draco && clase !== "picaro") barba(g, t, ramPelo, !!vis.barba);
    if (!draco) cara(g, t, { piel, raza, gesto, iris, sombra: ["brujo", "picaro", "explorador"].includes(clase), cejas: vis.sinPelo ? null : ramPelo });
    if (clase === "barbaro" && !draco) {
      /* Pintura de guerra: franja por los ojos y dos rayas en la mejilla. */
      for (const [i, j] of [[t.ojo1 - 1, t.ojoY + 2], [t.ojo1, t.ojoY + 3], [t.ojo1 + 1, t.ojoY + 2], [t.ojo1 + 2, t.ojoY + 3], [t.ojo2 + 1, t.ojoY + 2], [t.ojo1 - 2, t.ojoY + 1], [t.ojo1 - 2, t.ojoY + 2]])
        if (g.rampa(i, j) === piel || g.rampa(i, j) === MEJILLA) pon(g, R.sangre, 3, [i, j]);
    }
    /* Con sombrero, los cuernos del tiefling van debajo y asoman por detrás del ala. */
    const bajoSombrero = clase === "mago" || clase === "bardo";
    if (bajoSombrero && raza === "tiefling") cuernos(g, t, raza);
    tocado(g, t, clase, tela, piel);
    if (!bajoSombrero && (clase !== "guerrero" || raza === "tiefling")) cuernos(g, t, raza);
    if (clase === "picaro" && !draco) {
      /* Embozo que tapa nariz y boca, con su pliegue y el borde iluminado. */
      const em = capa().rect(t.cabX - 1, t.ojoY + 2, 12, 6).poly([[t.cabX - 1, t.bocaY + 2], [t.cabX + 9, t.bocaY + 1], [t.cabX + 6, t.bocaY + 5], [t.cabX, t.bocaY + 5]]);
      em.recortar(capa().ell(t.cabX + 1, t.cabY + 1, t.cabRx + 2.6, t.cabRy + 1.2).rect(t.cabX, t.ojoY + 2, 11, 5));
      em.pintar(g, tela, { relieve: 2, separar: true });
      surco(g, tela, 1, t.cabX + 1, t.bocaY, t.cabX + 8, t.bocaY - 1, tela);
      surco(g, tela, 3, t.cabX + 1, t.ojoY + 2, t.cabX + 9, t.ojoY + 2, tela);
      surco(g, tela, 3, t.cabX + 2, t.bocaY + 1, t.cabX + 7, t.bocaY, tela);
    }
    let tt = t, post = [];
    if (P) {
      /* Inclina el tronco y la cabeza, y dibuja brazos y armas ya en su sitio inclinado. */
      cizallar(g, P.desp);
      tt = mover(Object.assign({}, t), P.desp(t.torTop + 3), 0);
      post = armarPose(g, tt, { pose, clase, piel, tela, manga, conArma, extra, objeto: a.objeto });
    } else if (clase === "guerrero" && conArma) {
      /* El escudo tapa el brazo; el puño asoma a su lado con la espada. */
      t.mano = [t.torR + 12, t.torTop + (t.bajo ? 8 : 9)];
      brazoDelante(g, t, piel, manga, false);
      hombrera(g, t);
      objeto(g, t, clase, tela, piel);
      objeto(g, t, "espada", tela, piel);
      puno(g, t.mano[0], t.mano[1], PLACA);
    } else if (clase === "brujo" && conArma) {
      /* Mano abierta con la palma hacia arriba bajo el cristal. */
      brazoDelante(g, t, piel, manga, false);
      const [mx, my] = t.mano;
      capa().rect(mx - 2, my - 1, 5, 3).rect(mx + 3, my - 2, 1, 2).on(mx - 2, my - 2).pintar(g, piel, { relieve: 1.2, separar: true });
      pon(g, piel, 1, [mx - 1, my + 1], [mx + 1, my + 1]); pon(g, piel, 4, [mx - 1, my - 1], [mx, my - 1]);
      objeto(g, t, clase, tela, piel);
    } else {
      if (extra) OBJETOS_EXTRA[a.objeto](g, t);
      else if (conArma) objeto(g, t, clase, tela, piel);
      if (!extra || a.objeto !== "martillo") brazoDelante(g, t, piel, manga, !(arquero));
      if (arquero) puno(g, t.mano[0], t.mano[1], piel);
    }
    if (arquero && !P) {
      /* Mano que tensa la cuerda, delante del pecho, con el antebrazo cruzado. */
      const [dx, dy] = t.tiro;
      capa().linea(t.torL + 2, t.torTop + 4, dx - 2, dy, t.grosor).pintar(g, piel, { relieve: 1.6, separar: true });
      capa().rect(dx - 2, dy - 2, 4, 4).pintar(g, piel, { relieve: 1.2, separar: true });
      pon(g, piel, 1, [dx - 1, dy], [dx, dy + 1]); pon(g, piel, 4, [dx - 2, dy - 2]);
      for (let i = dx - 4; i <= dx - 2; i++) pon(g, CUERO, 2, [i, dy - 1], [i, dy + 1]);
    }
    if (!P && ((clase === "guerrero" && !conArma) || clase === "clerigo")) hombrera(g, t);
    if (clase === "bardo" && !P) {
      /* Manga abullonada con cuchilladas. */
      const [hx, hy] = t.hombro;
      capa().ell(hx + 0.5, hy + 1, 3.4, 3.4).pintar(g, tela, { relieve: 2.4, separar: true });
      for (const i of [hx - 1, hx + 1, hx + 3]) pon(g, R.tela.granate, 3, [i, hy], [i, hy + 1]), pon(g, R.tela.granate, 1, [i, hy + 2]);
    }
    if (clase === "barbaro") {
      /* Pelliza de lobo sobre los hombros, con la cabeza del lobo en el hombro de delante. */
      /* Solo por el hombro de atrás y la nuca: el pecho queda al aire. */
      const pz = capa().ell(tt.torL + 4, tt.torTop + 1, 6.5, 2.8).ell(tt.torL + 1, tt.torTop + 3, 4, 5.5);
      for (let i = tt.torL - 5; i <= tt.torR + 5; i++) if ((i & 1) === 0) pz.off(i, Math.round(tt.torTop + 4.6));
      pz.pintar(g, PELLIZA, { relieve: 2.8, separar: true });
      cada(g, PELLIZA, tt.torL - 6, tt.torTop - 4, tt.torR + 6, tt.torTop + 9, (x, y, k) => {
        if ((x * 5 + y * 3) % 7 === 0) g.set(x, y, PELLIZA[Math.max(1, k - 1)], PELLIZA);
        else if ((x * 3 + y * 5) % 11 === 0 && k < 4) g.set(x, y, PELLIZA[k + 1], PELLIZA);
      });
      const [hx, hy] = tt.hombro;
      const lobo = capa().ell(hx - 1, hy - 1, 4.4, 3.4).poly([[hx + 1, hy - 3.5], [hx + 8.5, hy - 1.5], [hx + 8.5, hy + 1.5], [hx + 1, hy + 2.5]]).poly([[hx - 4.5, hy - 2], [hx - 3.5, hy - 8], [hx - 0.5, hy - 3.5]]);
      lobo.pintar(g, LOBO, { relieve: 2.2, min: 1 });
      perfilar(g, lobo);
      /* Oreja, ceño, ojo ámbar, trufa y colmillos. */
      pon(g, LOBO, 1, [hx - 3, hy - 5], [hx - 3, hy - 4]); pon(g, LOBO, 4, [hx - 4, hy - 6], [hx - 2, hy - 3], [hx - 1, hy - 4]);
      for (let i = hx; i <= hx + 3; i++) pon(g, LOBO, 1, [i, hy - 2]);
      g.set(hx + 1, hy - 1, OJOS); g.set(hx + 2, hy - 1, "#e0a83a"); g.set(hx + 2, hy - 2, OJOS);
      pon(g, LOBO, 0, [hx + 8, hy - 1], [hx + 8, hy]); pon(g, LOBO, 4, [hx + 5, hy - 2], [hx + 6, hy - 2]);
      for (let i = hx + 1; i <= hx + 8; i++) if (g.rampa(i, hy + 1) === LOBO) pon(g, LOBO, 0, [i, hy + 1]);
      for (const i of [hx + 3, hx + 6]) g.set(i, hy + 2, R.hueso[4], R.hueso), g.set(i, hy + 1, R.hueso[3], R.hueso);
      cada(g, LOBO, hx - 6, hy - 4, hx + 1, hy + 3, (x, y, k) => { if ((x * 3 + y * 2) % 5 === 0 && k > 1) g.set(x, y, LOBO[k - 1], LOBO); });
    }
    if (clase === "clerigo" && conArma && !extra && !P) {
      /* Símbolo sagrado colgando de la mano de atrás. */
      const [ax, ay] = t.manoAtras;
      surco(g, ORO, 2, ax, ay + 4, ax, ay + 7, null);
      capa().ell(ax, ay + 9, 1.8, 1.8).pintar(g, ORO, { relieve: 1.2, min: 2 });
      pon(g, ORO, 4, [ax - 1, ay + 8]); pon(g, ORO, 3, [ax, ay + 6.5 | 0]);
      pon(g, ORO, 2, [ax - 3, ay + 9], [ax + 3, ay + 9], [ax, ay + 12]);
    }
    if (Array.isArray(a.extras)) a.extras.forEach(fn => { if (typeof fn === "function") fn(g, tt, { piel, pelo: ramPelo, tela }); });
    /* La fila 63 queda libre para el contorno: los pies pisan la 62. */
    for (let x = 0; x < W; x++) g.quitar(x, H - 1);
    /* En las poses, la fila de arriba y las columnas de los lados también quedan para el contorno. */
    if (P) { for (let x = 0; x < W; x++) g.quitar(x, 0); for (let y = 0; y < H; y++) g.quitar(0, y).quitar(W - 1, y); }
    if (!a.sinContorno) contornoSel(g);
    for (const fn of post) fn(g);
    return a.espejo ? g.espejo() : g;
  }

  window.HEROES_64 = { W, H, RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS, RAMPAS: R, POSES, plantilla, componer, matizar, OBJETOS_EXTRA };
})();
