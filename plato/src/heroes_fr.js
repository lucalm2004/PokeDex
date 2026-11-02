/* Dados y Mazmorras · héroes a 128×128 en alta resolución con vista frontal/cenital.
   HEROES_FR.componer(aspecto) devuelve una Rejilla NUEVA de 128×128 con los pies en la fila 124
   (de la 125 a la 127 solo queda el contorno). Acepta el mismo aspecto que HEROES_BG.componer:
   { raza, clase, piel, pelo, tela, peinado, barba, gesto, pose, cuerpo, objeto, extras, espejo, sinContorno }
   y reutiliza las mismas tablas (RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS), así que todo aspecto guardado sigue valiendo.
   Estilo de los juegos de rol cenitales modernos: la cámara está delante y algo por encima, así que se ve la cara de
   frente (los dos ojos), la parte de arriba de la cabeza y de los hombros, y el cuerpo girado un poco hacia la derecha
   (hacia los enemigos) con el arma en esa mano. Proporciones heroicas de unas cinco cabezas, rampas de seis tonos con
   desplazamiento de matiz (sombras frías, luces cálidas), sombreado suave sin tramado, contorno de color (no negro) que
   se aclara por dentro, brillos especulares nítidos en metal y ojos, y caras grandes y expresivas. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R0 } = PX;
  const W = 128, H = 128;
  const SUELO = 124;

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
  const POSES = ["normal", "ataque", "conjuro", "herido", "victoria"];

  /* ---------- Color ---------- */
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const aRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const aHex = (r, g, b) => "#" + [r, g, b].map(v => lim(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
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
  /* Gira un matiz hacia otro, como mucho «grados». */
  function hacia(h, obj, grados) {
    const d = ((obj - h + 540) % 360) - 180;
    return Math.abs(d) <= grados ? obj : h + Math.sign(d) * grados;
  }
  /* Rampa de seis tonos a partir del tono medio: [contorno, sombra honda, sombra, medio, luz, brillo].
     Las sombras giran hacia un matiz frío y ganan saturación; las luces giran hacia el amarillo y la pierden. */
  function rampa(base, o = {}) {
    const [h, s, l] = aHsl(aRgb(base));
    const frio = o.frio !== undefined ? o.frio : 248, calido = o.calido !== undefined ? o.calido : 50, m = o.matiz !== undefined ? o.matiz : 1;
    const luz = o.luz !== undefined ? o.luz : 1, ss = o.ss !== undefined ? o.ss : 1;
    const P = [[-0.72, 30, 0.95], [-0.47, 20, 1.08], [-0.23, 9, 1.06], [0, 0, 1], [0.3, -10, 0.94], [0.62, -18, 0.8]];
    return P.map(([d, hs, sf0]) => {
      const sf = d < 0 ? 1 + (sf0 - 1) * ss - (1 - ss) * 0.3 * -d : sf0;
      const L = d < 0 ? l * (1 + d) : l + Math.min((1 - l) * d, l * d * 1.7) * luz;
      const Hh = hs > 0 ? hacia(h, frio, hs * m) : hacia(h, calido, -hs * m);
      return deHsl(Hh, lim(s * sf, 0, 1), lim(L, 0, 1));
    });
  }
  /* Convierte una rampa de PX (cinco tonos) en una de seis con el matiz desplazado. */
  const cacheRampa = new Map();
  function matizar(ram, o) {
    if (!Array.isArray(ram)) return ram;
    if (cacheRampa.has(ram)) return cacheRampa.get(ram);
    const ok = ram.length >= 4 && ram.every(c => typeof c === "string" && c[0] === "#" && c.length === 7);
    const r = ok ? rampa(mezcla(ram[2], ram[3], 0.5), o) : ram;
    cacheRampa.set(ram, r);
    return r;
  }
  /* Pieles: sombras hacia el rojo (sangre bajo la piel), no hacia el azul. */
  const PIELES = {};
  for (const [k, v] of Object.entries(R0.piel)) {
    const [h] = aHsl(aRgb(v[2]));
    const calida = h < 60 || h > 330;
    const base = k === "oscura" ? mezcla(v[3], v[4], 0.15) : k === "morena" ? mezcla(v[2], v[3], 0.65) : mezcla(v[2], v[3], 0.55);
    PIELES[k] = rampa(base, calida ? { frio: 345, calido: 42, matiz: 0.55, ss: 0.4 } : { frio: 255, calido: 60, matiz: 0.6, ss: 0.6 });
    cacheRampa.set(v, PIELES[k]);
  }
  const PELOS = {};
  for (const [k, v] of Object.entries(R0.pelo)) {
    const base = k === "negro" ? "#3a2c2c" : k === "canoso" ? "#bcb6ae" : mezcla(v[2], v[3], 0.6);
    PELOS[k] = rampa(base, k === "violeta" ? { frio: 270 } : { frio: 300, calido: 45, matiz: 0.8 });
    cacheRampa.set(v, PELOS[k]);
  }
  const TELAS_R = {};
  for (const [k, v] of Object.entries(R0.tela)) {
    const base = {
      terracota: "#b45a32", azul: "#33589a", oliva: "#5f7a34", violeta: "#6e3c86", ocre: "#c99a3c", blanco: "#ddd3c2", granate: "#9e2a2a", negro: "#3a3440"
    }[k] || mezcla(v[2], v[3], 0.6);
    TELAS_R[k] = rampa(base, k === "blanco" ? { frio: 230, calido: 45, matiz: 0.7 } : {});
    cacheRampa.set(v, TELAS_R[k]);
  }
  const R = {};
  for (const [k, v] of Object.entries(R0)) {
    if (Array.isArray(v)) R[k] = matizar(v);
    else { R[k] = {}; for (const [k2, v2] of Object.entries(v)) R[k][k2] = matizar(v2); }
  }

  /* ---------- Materiales ---------- */
  const ACERO = rampa("#9ea9b8", { frio: 228, calido: 48 });
  const PLACA = ["#1d2030", "#3a4256", "#5f6a80", "#8e9aae", "#c3cddb", "#f4f8ff"];
  const MALLA = rampa("#7d8697", { frio: 230 });
  const HIERRO = rampa("#5d6170", { frio: 240 });
  const ORO = ["#3a1a0c", "#7a3e12", "#b8701e", "#e0a63a", "#f6d670", "#fff6c2"];
  const CUERO = rampa("#8e5a34", { frio: 345, calido: 40 });
  const CUERO2 = rampa("#5a3c30", { frio: 300 });
  const MADERA = rampa("#8a5a30", { frio: 350, calido: 42 });
  const LAUD = rampa("#c4803e", { frio: 355, calido: 45 });
  const PELLIZA = rampa("#8c857e", { frio: 250 });
  const LOBO = rampa("#a8a198", { frio: 250 });
  const HUESO = rampa("#e2d6b8", { frio: 20, calido: 55, matiz: 0.6 });
  const CUERNO = rampa("#5e4a54", { frio: 270 });
  const CALZAS = rampa("#6c5444", { frio: 330 });
  const SOMBRA_SUELO = ["#140e16", "#1e1620", "#2a2030", "#3a2e40", "#4a3e50", "#5a4e60"];
  const BLANCO_OJO = ["#2a1c2a", "#5c4c62", "#a89cb0", "#dcd6e2", "#f4f2f6", "#ffffff"];
  const BOCA = ["#1e0a12", "#4a1420", "#7a2630", "#a8423e", "#cc6a5e", "#ea9a86"];
  const DIENTE = ["#3a2a2a", "#7a6a66", "#b8ada4", "#e2dad0", "#faf6ee", "#ffffff"];
  const SUDOR = ["#0e2240", "#1e4a80", "#3a80c0", "#6ab4e8", "#a8dcff", "#ffffff"];
  const TIEF = ["#4a1806", "#8a3a0a", "#d0761a", "#f6b030", "#ffe070", "#fffbe0"];
  const IRIS = {
    marron: rampa("#7a4a2a", { frio: 345 }), azul: rampa("#4a82c8"), verde: rampa("#4a9a5a", { frio: 200 }),
    ambar: rampa("#c48a22", { frio: 10 }), gris: rampa("#7a8a98"), violeta: rampa("#8a5ac0")
  };
  /* Luces mágicas de cada clase. */
  const LUZ = {
    mago: ["#14205a", "#2a48b0", "#4a80f0", "#8ec4ff", "#d4f0ff", "#ffffff"],
    brujo: ["#2a0e40", "#5a2a8a", "#38b066", "#7ae890", "#d0ffd0", "#ffffff"],
    clerigo: ["#5a2a08", "#a86414", "#e0a42a", "#ffd65a", "#fff2b0", "#ffffff"],
    bardo: ["#062a30", "#0e6a66", "#1ea898", "#5ae0cc", "#c8fff4", "#ffffff"],
    neutro: ["#30344a", "#5a6684", "#8ea0c0", "#c4d4ee", "#eef4ff", "#ffffff"]
  };
  const ESTELA = ["#3a4a70", "#7a90c0", "#b0c8f0", "#d8e8ff", "#f2f8ff", "#ffffff"];
  const ORBE = ["#0a1a3a", "#1a3a8a", "#2a6ad0", "#4aa8ff", "#a8e0ff", "#ffffff"];
  const CRISTAL = ["#1a0a2a", "#3a1a6a", "#6a2ab0", "#a85ae8", "#e0b0ff", "#ffffff"];
  const RUNA = ["#08261a", "#106a40", "#22b064", "#5ae890", "#b8ffd0", "#ffffff"];
  const cacheRC = new Map();
  const rampaDe = c => { if (!cacheRC.has(c)) cacheRC.set(c, [c, c, c, c, c, c]); return cacheRC.get(c); };

  /* ---------- Capas a 128×128 ----------
     Como PX.Capa, pero rápida (todo se calcula en la caja de la capa), con pinceles redondos, tubos que se afinan
     y un sombreado suave por relieve que usa los tonos 1–5 de las rampas de seis (el 0 es el contorno). */
  let BUF_D = null, BUF_A = null;
  const LUZ_DIR = [-0.46, -0.62, 0.64];
  class CapaFR extends Capa {
    constructor() { super(W, H); }
    copia() { const o = new CapaFR(); o.m = this.m.slice(); return o; }
    borrarDesde(fila) { this.m.fill(0, lim(Math.round(fila), 0, this.h) * this.w); return this; }
    borrarHasta(fila) { this.m.fill(0, 0, lim(Math.round(fila), 0, this.h) * this.w); return this; }
    disco(x, y, r) {
      const r2 = r * r + 0.2, w = this.w, m = this.m;
      const j0 = Math.max(0, Math.floor(y - r)), j1 = Math.min(this.h - 1, Math.ceil(y + r));
      const i0 = Math.max(0, Math.floor(x - r)), i1 = Math.min(w - 1, Math.ceil(x + r));
      for (let j = j0; j <= j1; j++) { const dy = j - y, o = j * w; for (let i = i0; i <= i1; i++) { const dx = i - x; if (dx * dx + dy * dy <= r2) m[o + i] = 1; } }
      return this;
    }
    ell(cx, cy, rx, ry = rx, quitar = false) {
      const w = this.w, m = this.m, ax = rx + 0.3, ay = ry + 0.3, v = quitar ? 0 : 1;
      const j0 = Math.max(0, Math.floor(cy - ry - 1)), j1 = Math.min(this.h - 1, Math.ceil(cy + ry + 1));
      const i0 = Math.max(0, Math.floor(cx - rx - 1)), i1 = Math.min(w - 1, Math.ceil(cx + rx + 1));
      for (let j = j0; j <= j1; j++) { const dy = (j - cy) / ay, o = j * w; for (let i = i0; i <= i1; i++) { const dx = (i - cx) / ax; if (dx * dx + dy * dy <= 1) m[o + i] = v; } }
      return this;
    }
    quitarEll(cx, cy, rx, ry = rx) { return this.ell(cx, cy, rx, ry, true); }
    /* Elipse girada (ang en grados). */
    ellG(cx, cy, rx, ry, ang, quitar = false) {
      const a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a), R2 = Math.max(rx, ry) + 1, v = quitar ? 0 : 1;
      for (let j = Math.floor(cy - R2); j <= Math.ceil(cy + R2); j++) for (let i = Math.floor(cx - R2); i <= Math.ceil(cx + R2); i++) {
        if (i < 0 || j < 0 || i >= this.w || j >= this.h) continue;
        const dx = i - cx, dy = j - cy, u = (dx * ca + dy * sa) / (rx + 0.3), w2 = (-dx * sa + dy * ca) / (ry + 0.3);
        if (u * u + w2 * w2 <= 1) this.m[j * this.w + i] = v;
      }
      return this;
    }
    linea(x0, y0, x1, y1, g = 1) {
      const pasos = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2);
      for (let s = 0; s <= pasos; s++) {
        const x = x0 + ((x1 - x0) * s) / pasos, y = y0 + ((y1 - y0) * s) / pasos;
        if (g <= 1.2) this.on(x, y); else this.disco(x, y, g / 2);
      }
      return this;
    }
    /* Tubo de radio r0 en (x0,y0) a r1 en (x1,y1). */
    tubo(x0, y0, x1, y1, r0, r1 = r0) {
      const pasos = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2);
      for (let s = 0; s <= pasos; s++) {
        const u = s / pasos;
        this.disco(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, r0 + (r1 - r0) * u);
      }
      return this;
    }
    curva(x0, y0, cx, cy, x1, y1, g = 1, g1 = g) {
      const largo = Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy);
      const n = Math.max(30, Math.ceil(largo * 2));
      for (let s = 0; s <= n; s++) {
        const t = s / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const gr = g + (g1 - g) * t;
        if (gr <= 1.2) this.on(x, y); else this.disco(x, y, gr / 2);
      }
      return this;
    }
    poly(pts, quitar = false) {
      let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
      for (const [x, y] of pts) { if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; }
      const n = pts.length, cs = [], v = quitar ? 0 : 1;
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
          if (par) this.m[y * this.w + x] = v;
        }
      }
      return this;
    }
    quitarPoly(pts) { return this.poly(pts, true); }
    caja() {
      const w = this.w, h = this.h, m = this.m;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) if (m[o + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      return [x0, y0, x1, y1];
    }
    /* Sombreado: op.relieve (radio de redondeo), op.luz, op.umbrales, op.min/op.max (tonos 0–4 → rampa 1–5),
       op.separar (línea honda donde toca lo ya pintado), op.lado (el costado derecho cae en sombra),
       op.reflejo (luz rebotada en el borde de abajo a la derecha), op.plano (tono fijo de la rampa). */
    pintar(rej, ram, op = {}) {
      const w = this.w, h = this.h, m = this.m;
      const [x0, y0, x1, y1] = this.caja();
      if (x1 < 0) return rej;
      const n = ram.length - 1;
      if (op.plano !== undefined) {
        const c = ram[lim(op.plano, 0, n)];
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) rej.set(x, y, c, ram);
        return rej;
      }
      const RR = op.relieve || 4;
      if (!BUF_D || BUF_D.length !== w * h) { BUF_D = new Float32Array(w * h); BUF_A = new Float32Array(w * h); }
      const d = BUF_D, A = BUF_A;
      const X0 = Math.max(0, x0 - 1), X1 = Math.min(w - 1, x1 + 1), Y0 = Math.max(0, y0 - 1), Y1 = Math.min(h - 1, y1 + 1);
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { const i = y * w + x; d[i] = m[i] ? 1e6 : 0; A[i] = 0; }
      const D = (x, y) => (x < X0 || y < Y0 || x > X1 || y > Y1 ? 0 : d[y * w + x]);
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
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (m[i]) { const v = Math.min(d[i] - 0.5, RR) / RR; A[i] = Math.sqrt(Math.max(0, 1 - (1 - v) * (1 - v))); }
      }
      const alto = (x, y) => (x < X0 || y < Y0 || x > X1 || y > Y1 ? 0 : A[y * w + x]);
      const L = op.luz || LUZ_DIR;
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.2, sesgo = op.sesgo || 0;
      const u = op.umbrales || [0.16, 0.44, 0.74, 0.93];
      const lado = op.lado !== undefined ? op.lado : 0.1, xc = (x0 + x1) / 2, hw = Math.max(4, (x1 - x0) / 2);
      const tiene = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!m[y * w + x]) continue;
        const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k;
        const ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
        const nl = Math.hypot(nx, ny, 1);
        let l = (nx * lx + ny * ly + lz) / nl + sesgo;
        if (lado) l -= ((x - xc) / hw) * lado;
        let t = l > u[3] ? 4 : l > u[2] ? 3 : l > u[1] ? 2 : l > u[0] ? 1 : 0;
        if (op.reflejo && t <= 1 && (!tiene(x + 1, y) || !tiene(x, y + 1)) && tiene(x - 1, y) && tiene(x, y - 1)) t = Math.min(2, t + 1);
        if (op.max !== undefined) t = Math.min(t, op.max);
        if (op.min !== undefined) t = Math.max(t, op.min);
        if (op.separar) {
          const borde = (!tiene(x + 1, y) && rej.get(x + 1, y)) || (!tiene(x - 1, y) && rej.get(x - 1, y)) || (!tiene(x, y + 1) && rej.get(x, y + 1)) || (!tiene(x, y - 1) && rej.get(x, y - 1));
          if (borde) t = Math.min(t, op.separar === true ? 0 : op.separar);
        }
        rej.set(x, y, ram[Math.min(t + 1, n)], ram);
      }
      return rej;
    }
  }
  const capa = () => new CapaFR();
  /* Opciones de sombreado por material. */
  const METAL = { umbrales: [0.2, 0.5, 0.8, 0.95], lado: 0.3, fuerza: 2.8 };
  const TELA_OP = { reflejo: true };

  /* ---------- Utilidades de pintura ---------- */
  const pon = (g, ram, k, ...pts) => { const c = ram[lim(k, 0, ram.length - 1)]; for (const [x, y] of pts) g.set(x, y, c, ram); return g; };
  const tono = (g, x, y) => { const r = g.rampa(x, y); return r ? r.indexOf(g.get(x, y)) : -1; };
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), i = tono(g, x, y);
    if (!r || i < 0) return;
    g.set(x, y, r[lim(i + d, 1, r.length - 1)], r);
  }
  function cada(g, ram, x0, y0, x1, y1, fn) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++)
        if (g.rampa(x, y) === ram) fn(x, y, tono(g, x, y));
  }
  /* Recorre una línea de píxeles. */
  function trazo(x0, y0, x1, y1, fn) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    let px = null, py = null;
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (x === px && y === py) continue;
      px = x; py = y; fn(x, y, s / n);
    }
  }
  function trazoCurva(x0, y0, cx, cy, x1, y1, fn) {
    const n = Math.ceil((Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy)) * 1.5) + 2;
    let px = null, py = null;
    for (let s = 0; s <= n; s++) {
      const t = s / n, u = 1 - t;
      const x = Math.round(u * u * x0 + 2 * u * t * cx + t * t * x1), y = Math.round(u * u * y0 + 2 * u * t * cy + t * t * y1);
      if (x === px && y === py) continue;
      px = x; py = y; fn(x, y, t);
    }
  }
  /* Surco: pinta el tono k de ram sobre los píxeles que ya son de «sobre» (o de ram). */
  function surco(g, ram, k, x0, y0, x1, y1, sobre = ram) {
    trazo(x0, y0, x1, y1, (x, y) => { if (!sobre || g.rampa(x, y) === sobre) pon(g, ram, k, [x, y]); });
  }
  /* Pliegue de tela: surco una o dos bandas más oscuro, con su luz al lado izquierdo; se afina en las puntas. */
  function pliegue(g, ram, x0, y0, x1, y1, cx, cy) {
    const f = (x, y, u) => {
      if (g.rampa(x, y) !== ram) return;
      const k = tono(g, x, y), hondo = u > 0.2 && u < 0.8 ? 2 : 1;
      g.set(x, y, ram[Math.max(1, k - hondo)], ram);
      if (u > 0.12 && u < 0.88 && g.rampa(x - 1, y) === ram) { const k2 = tono(g, x - 1, y); if (k2 < 5) g.set(x - 1, y, ram[Math.min(5, Math.max(k2, k) + 1)], ram); }
    };
    if (cx === undefined) trazo(x0, y0, x1, y1, f); else trazoCurva(x0, y0, cx, cy, x1, y1, f);
  }
  function costura(g, ram, x0, y0, x1, y1, d = 1, sobre = ram) {
    let i = 0;
    trazo(x0, y0, x1, y1, (x, y) => { if (i++ % 3 !== 2 && (!sobre || g.rampa(x, y) === sobre)) matiz(g, x, y, d); });
  }
  function remache(g, ram, x, y) {
    x = Math.round(x); y = Math.round(y);
    pon(g, ram, 5, [x, y]); pon(g, ram, 2, [x + 1, y + 1]); pon(g, ram, 4, [x + 1, y], [x, y + 1]);
  }
  /* Brillo especular: un píxel blanco con una cruz corta del tono claro. */
  function destello(g, ram, x, y, grande) {
    x = Math.round(x); y = Math.round(y);
    if (grande) pon(g, ram, 4, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    pon(g, ram, 5, [x, y]);
  }
  /* Cota de malla: anillas al tresbolillo con su brillo y su hueco. */
  function malla(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const f = (x + ((y >> 1) & 1)) & 1, v = y & 1;
      if (v === 0 && f === 0) g.set(x, y, ram[Math.min(5, k + 1)], ram);
      else if (v === 1 && f === 1) g.set(x, y, ram[Math.max(1, k - 1)], ram);
    });
  }
  /* Pelaje: mechones cortos en diagonal y el borde dentado. */
  function pelaje(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const h = ((x * 7 + y * 3) % 5 + 5) % 5, v = ((x - y * 2) % 6 + 6) % 6;
      if (v === 0 && k >= 2) g.set(x, y, ram[k - 1], ram);
      else if (v === 3 && h < 2 && k < 5 && k >= 2) g.set(x, y, ram[k + 1], ram);
    });
  }
  /* Línea honda alrededor de una capa sobre lo ya pintado detrás. */
  function perfilar(g, c) {
    const marcas = [];
    const [x0, y0, x1, y1] = c.caja();
    for (let y = Math.max(0, y0 - 1); y <= Math.min(H - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(W - 1, x1 + 1); x++) {
      if (c.tiene(x, y) || !g.get(x, y)) continue;
      if (c.tiene(x - 1, y) || c.tiene(x + 1, y) || c.tiene(x, y - 1) || c.tiene(x, y + 1)) marcas.push([x, y]);
    }
    for (const [x, y] of marcas) { const r = g.rampa(x, y); if (r) g.set(x, y, r[Math.min(1, r.length - 1)], r); }
  }
  /* Ribete: los píxeles del borde de abajo de una capa en otra rampa. */
  function ribete(g, c, ram, k = 4, filas = 2, sobre = null) {
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y) || (sobre && g.rampa(x, y) !== sobre)) continue;
      for (let f = 1; f <= filas; f++) if (!c.tiene(x, y + f)) { pon(g, ram, f === 1 ? k - 2 : k, [x, y]); break; }
    }
  }
  /* Sello de píxeles: filas de caracteres y un mapa carácter → [rampa, tono]. */
  function sello(g, x0, y0, filas, mapa, libre) {
    for (let j = 0; j < filas.length; j++) {
      const f = filas[j];
      for (let i = 0; i < f.length; i++) {
        const ch = f[i];
        if (ch === "." || ch === " ") continue;
        const c = mapa[ch];
        if (!c) continue;
        const x = x0 + i, y = y0 + j;
        if (libre && !libre(x, y)) continue;
        pon(g, c[0], c[1], [x, y]);
      }
    }
  }
  /* Estrella de cuatro puntas (bordados, chispas). */
  function estrella(g, ram, x, y, grande, k = 5) {
    x = Math.round(x); y = Math.round(y);
    pon(g, ram, k, [x, y]);
    pon(g, ram, k - 1, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    if (grande) pon(g, ram, k - 2, [x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2]);
  }

  /* ---------- Contorno ----------
     Contorno de color: el tono 0 de la rampa del material que bordea (no negro). Por el lado de la luz
     (arriba y a la izquierda) se suaviza mezclándolo con el tono 1. */
  const cacheSuave = new Map();
  const suave = (a, b) => { const k = a + b; if (!cacheSuave.has(k)) cacheSuave.set(k, mezcla(a, b, 0.4)); return cacheSuave.get(k); };
  function contornoFR(g) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      const vec = iz ? [x - 1, y] : ar ? [x, y - 1] : de ? [x + 1, y] : [x, y + 1];
      const ram = g.rampa(vec[0], vec[1]) || rampaDe("#1a1218");
      let col = ram[0];
      if (!iz && !ar && ram.length > 1) col = suave(ram[0], ram[1]);
      nuevos.push([x, y, col, ram]);
    }
    for (const [x, y, col, ram] of nuevos) g.set(x, y, col, ram.includes(col) ? ram : rampaDe(col));
    return g;
  }

  /* ---------- Plantilla del cuerpo ----------
     Unas cinco cabezas en las razas medianas (~101 px); enanos de ~80 px anchos y macizos; medianos y gnomos de ~70 px;
     semiorcos y dracónidos de ~109 px y pesados. La cabeza es grande para que la cara se lea bien. */
  const CUERPOS = {
    normal: { alto: 101, rx: 8.6, ry: 10, hom: 28, cin: 19, cad: 22, br: 3.3, pi: 4.4, pierna: 0.45 },
    esbelto: { alto: 103, rx: 8.2, ry: 9.8, hom: 25, cin: 16, cad: 19, br: 2.9, pi: 3.9, pierna: 0.47 },
    fornido: { alto: 109, rx: 9.6, ry: 10.4, hom: 38, cin: 28, cad: 29, br: 4.6, pi: 5.3, pierna: 0.43 },
    bajo: { alto: 70, rx: 8.6, ry: 9.2, hom: 20, cin: 18, cad: 20, br: 2.9, pi: 3.8, pierna: 0.34 },
    ancho: { alto: 80, rx: 9.2, ry: 9.6, hom: 34, cin: 30, cad: 30, br: 4.4, pi: 5, pierna: 0.32 }
  };
  function plantilla(cuerpo) {
    const nombre = CUERPOS[cuerpo] ? cuerpo : "normal";
    const p = CUERPOS[nombre];
    const bajo = nombre === "bajo" || nombre === "ancho";
    const grande = nombre === "fornido" || nombre === "ancho";
    const t = { cuerpo: nombre, bajo, grande, W, H, cx: 64, suelo: SUELO };
    const top = SUELO - p.alto;
    t.cima = top;
    t.cabX = 64; t.cabRx = p.rx; t.cabRy = p.ry; t.cabY = top + p.ry;
    t.giro = 2; t.fx = t.cabX + t.giro;
    t.ojoY = Math.round(t.cabY + (nombre === "bajo" ? 1.6 : 1));
    t.bocaY = t.ojoY + (nombre === "bajo" ? 5 : 6);
    t.menton = Math.round(t.cabY + p.ry);
    t.torTop = t.menton + (bajo ? 2 : 3);
    const pierna = Math.round(p.alto * p.pierna);
    t.cadY = SUELO - pierna;
    t.torBot = t.cadY; t.pierTop = t.cadY;
    t.cinY = t.torTop + Math.round((t.cadY - t.torTop) * 0.6);
    t.torL = t.cx - p.hom / 2 - 0.5; t.torR = t.cx + p.hom / 2 - 0.5;
    t.wL = t.cx - p.cin / 2; t.wR = t.cx + p.cin / 2 - 1;
    t.cadL = t.cx - p.cad / 2; t.cadR = t.cx + p.cad / 2 - 1;
    t.br = p.br; t.pi = p.pi; t.grosor = Math.round(p.br * 2);
    t.hombroI = [t.torL + p.br + 0.5, t.torTop + p.br + 0.5];
    t.hombroD = [t.torR - p.br - 0.5, t.torTop + p.br + 0.5];
    const largoBrazo = (t.cadY + 3 - t.hombroD[1]) * 0.53;
    t.l1 = largoBrazo; t.l2 = largoBrazo * 0.96;
    t.rodY = Math.round((t.cadY + SUELO) / 2) - 1;
    t.cadI = [t.cx - p.cad / 4 - 0.5, t.cadY + 1]; t.cadD = [t.cx + p.cad / 4 + 0.5, t.cadY + 1];
    t.pieI = [t.cx - p.cad / 4 - 2, SUELO - 2]; t.pieD = [t.cx + p.cad / 4 + 2.5, SUELO - 2];
    /* Manos en reposo (las que usan los objetos extra). */
    t.manoD = [t.hombroD[0] + 4, t.cadY + 2];
    t.manoI = [t.hombroI[0] - 3, t.cadY + 3];
    t.hombro = t.hombroD; t.mano = t.manoD; t.codo = [t.hombroD[0] + 3, (t.hombroD[1] + t.manoD[1]) / 2];
    t.hombroAtras = t.hombroI; t.manoAtras = t.manoI;
    t.caderaAtras = t.cadI[0]; t.caderaDelante = t.cadD[0];
    t.altSombrero = Math.min(24, t.ojoY - 8);
    return t;
  }

  /* ---------- Cabeza y cara ---------- */
  function capaCabeza(t, raza) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy, f = t.fx;
    const orco = raza === "semiorco", enano = raza === "enano", redonda = raza === "mediano" || raza === "gnomo", elfo = raza === "elfo";
    const c = capa().ell(x, y - 1.2, rx, ry - 0.8);
    const mand = orco ? 1.2 : enano ? 0.8 : redonda ? 0.4 : elfo ? -0.6 : 0;
    c.poly([[x - rx + 0.2, y - 1], [x + rx - 0.2, y - 1], [x + rx - 0.6 + mand * 0.3, y + ry * 0.45], [f + 4.6 + mand, y + ry - 2.4 + (redonda ? 0.6 : 0)],
      [f + 1.5 + mand * 0.5, y + ry + 0.2], [f - 2.5 - mand * 0.5, y + ry + 0.2], [x - rx + 2.6 - mand, y + ry - 2 + (redonda ? 0.6 : 0)], [x - rx + 0.4, y + ry * 0.4]]);
    if (redonda) c.ell(x - 0.2, y + 2, rx + 0.2, ry - 2.2);
    return c;
  }
  function cuello(g, t, piel, ancho) {
    const x = t.cabX + 0.5;
    const cu = capa().rect(Math.round(x - ancho / 2), t.menton - 4, Math.round(ancho), t.torTop - t.menton + 7);
    cu.pintar(g, piel, { relieve: 2.6, max: 2 });
    for (let i = Math.round(x - ancho / 2); i < Math.round(x + ancho / 2); i++) pon(g, piel, 2, [i, t.menton + 1]);
  }
  function cabeza(g, t, piel, raza) {
    cuello(g, t, piel, t.grande ? 9 : 7);
    const c = capaCabeza(t, raza);
    c.pintar(g, piel, { relieve: 7.5, umbrales: [0.04, 0.3, 0.72, 0.95], lado: 0.1, reflejo: true });
    /* Mejillas y sombra bajo la mandíbula del lado de la sombra. */
    const [x0, y0, x1, y1] = c.caja();
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      if (!c.tiene(i, j)) continue;
      if (!c.tiene(i, j + 1) && i > t.fx - 4) pon(g, piel, 2, [i, j]);
    }
    return c;
  }
  function oreja(g, t, piel, raza) {
    const x = t.cabX, y = t.ojoY, rx = t.cabRx;
    const tramo = pts => capa().poly(pts).pintar(g, piel, { relieve: 1.8, separar: 1, max: 3 });
    const iz = x - rx + 0.6, de = x + rx - 0.4;
    if (raza === "elfo") {
      tramo([[iz + 1, y + 4], [iz + 1, y - 0.5], [iz - 8, y - 6.5], [iz - 2.5, y + 3]]);
      surco(g, piel, 2, iz, y + 2, iz - 5, y - 3, piel);
      pon(g, piel, 4, [iz - 3, y - 3], [iz - 5, y - 5]);
      tramo([[de - 1, y + 3.5], [de - 1, y - 0.5], [de + 6, y - 5.5], [de + 1.6, y + 2.5]]);
      return;
    }
    if (raza === "gnomo" || raza === "semiorco") {
      const l = raza === "gnomo" ? 5 : 4;
      tramo([[iz + 1, y + 4], [iz + 1, y - 0.5], [iz - l, y - 3], [iz - 1.6, y + 3.5]]);
      tramo([[de - 1, y + 4], [de - 1, y - 0.5], [de + l - 1, y - 2.5], [de + 1, y + 3]]);
      surco(g, piel, 2, iz, y + 2, iz - 2, y, piel);
      if (raza === "semiorco") { pon(g, ORO, 5, [iz - 1, y + 3]); pon(g, ORO, 3, [iz - 1, y + 4]); }
      return;
    }
    capa().ell(iz - 0.4, y + 1.8, 1.6, 2.6).pintar(g, piel, { relieve: 1.6, separar: 1, max: 2 });
    pon(g, piel, 1, [iz, y + 1], [iz, y + 2]);
    capa().ell(de + 0.2, y + 1.8, 1, 2.2).pintar(g, piel, { relieve: 1.2, separar: 1, max: 2 });
  }

  /* Rasgos de la cara, de frente: ojos con iris y brillo, cejas, nariz y boca, con los cuatro gestos.
     Todo se pinta solo sobre la piel (la boca también sobre la barba), así que yelmos, capuchas y máscaras se respetan. */
  const OJOS = {
    normal: { I: ["kkkk", "whip", "vijp"], D: ["kkkk", "hipw", "ijpv"] },
    furia: { I: ["k...", "kkkk", "whip"], D: ["...k", "kkkk", "hipw"] },
    dolor: { I: ["kk..", "..kk", "kk.."], D: ["..kk", "kk..", "..kk"] },
    alegre: { I: ["....", ".kk.", "k..k"], D: ["....", ".kk.", "k..k"] }
  };
  const CEJAS = {
    normal: { I: [".bbbb", "b...."], D: ["bbbb.", "....b"] },
    furia: { I: ["bb...", ".bbb.", "...bb"], D: ["...bb", ".bbb.", "bb..."] },
    dolor: { I: ["...bb", ".bb..", "b...."], D: ["bb...", "..bb.", "....b"] },
    alegre: { I: [".bbb.", "b...b"], D: [".bbb.", "b...b"] }
  };
  const BOCAS = {
    normal: ["......", "..mmS.", "..ss.."],
    alegre: ["m....m", ".tttt.", ".mggm.", "..mm.."],
    dolor: ["......", ".mmmm.", "mtTtTm", "M....M"],
    furia: ["......", "mmmmmm", "mtTtTm", ".mmmm."]
  };
  function colorIris(raza, pelo) {
    if (raza === "elfo") return IRIS.verde;
    if (raza === "semiorco") return IRIS.ambar;
    if (raza === "gnomo") return IRIS.violeta;
    if (pelo === PELOS.rubio || pelo === PELOS.canoso) return IRIS.azul;
    if (pelo === PELOS.cobrizo) return IRIS.verde;
    return IRIS.marron;
  }
  function cara(g, t, o) {
    const { piel, raza, gesto, iris, cejas } = o;
    const fx = t.fx, y = t.ojoY, by = t.bocaY;
    const sp = (i, j) => g.rampa(i, j) === piel;
    const enBoca = (i, j) => sp(i, j) || (o.barba && g.rampa(i, j) === o.barba);
    const tief = raza === "tiefling";
    const ojo = tief ? TIEF : BLANCO_OJO;
    const ir = tief ? TIEF : iris;
    const pest = o.sombra ? [piel[0], piel[0]] : [rampaDe("#1e1014"), 0];
    const mapa = {
      k: pest, w: [ojo, tief ? 4 : 4], v: [ojo, tief ? 3 : 3], h: [ojo, 5],
      i: [ir, tief ? 4 : 3], j: [ir, tief ? 3 : 2], p: [tief ? TIEF : ir, tief ? 2 : 0],
      b: [cejas || piel, cejas ? 1 : 1], s: [piel, 2], S: [piel, 1], L: [piel, 4],
      m: [BOCA, 1], M: [BOCA, 0], n: [BOCA, 3], t: [DIENTE, 4], T: [DIENTE, 2], g: [BOCA, 4],
      r: [rampaDe(mezcla(piel[3], "#ff5a6a", 0.32)), 0]
    };
    if (o.sombra) { mapa.w = [ojo, 2]; mapa.v = [ojo, 1]; mapa.h = [ojo, 4]; }
    const ge = OJOS[gesto] ? gesto : "normal";
    const oj = OJOS[ge], ce = CEJAS[ge];
    const yo = y - 1;
    sello(g, fx - 6, yo, oj.I, mapa, sp);
    sello(g, fx + 2, yo, oj.D, mapa, sp);
    if (ge === "normal" || ge === "furia") sello(g, fx - 6, yo + 3, [".ss."], mapa, sp), sello(g, fx + 2, yo + 3, [".ss."], mapa, sp);
    const yc = y - 3 - (ce.I.length > 2 ? 1 : 0) - (ge === "alegre" ? 1 : 0);
    sello(g, fx - 7, yc, ce.I, mapa, sp);
    sello(g, fx + 2, yc, ce.D, mapa, sp);
    if (raza === "semiorco") {
      /* Ceño pesado. */
      for (let i = fx - 7; i <= fx + 5; i++) if (sp(i, y - 2) && tono(g, i, y - 2) > 1) pon(g, piel, 2, [i, y - 2]);
    }
    /* Nariz: luz en el caballete, sombra a la derecha y en la punta. */
    if (raza === "gnomo") {
      const c = capa().ell(fx - 0.5, y + 3, 2.4, 2);
      c.pintar(g, piel, { relieve: 2, min: 1, separar: 2 });
      pon(g, piel, 5, [fx - 1, y + 2]);
    } else if (raza === "semiorco") {
      sello(g, fx - 2, y + 1, ["..s..", ".Ls..", "sS.Ss"], mapa, sp);
    } else {
      sello(g, fx - 1, y + 1, [".s", "Ls", "sS"], mapa, sp);
    }
    if (ge === "alegre" || raza === "mediano" || raza === "gnomo") sello(g, fx - 7, y + 3, ["rr"], mapa, sp), sello(g, fx + 4, y + 3, ["rr"], mapa, sp);
    sello(g, fx - 3, by - 1, BOCAS[ge] || BOCAS.normal, mapa, enBoca);
    if (raza === "semiorco") {
      /* Colmillos que suben desde la mandíbula. */
      for (const i of [fx - 3, fx + 2]) { pon(g, HUESO, 5, [i, by - 1]); pon(g, HUESO, 4, [i, by]); pon(g, HUESO, 3, [i, by + 1]); }
    }
    if (ge === "dolor") {
      /* Gota de sudor en la sien. */
      const sx = fx + 6, sy = y - 4;
      if (sp(sx, sy + 2) || sp(sx, sy)) { pon(g, SUDOR, 5, [sx, sy]); pon(g, SUDOR, 4, [sx, sy + 1]); pon(g, SUDOR, 3, [sx - 1, sy + 2], [sx, sy + 2]); pon(g, SUDOR, 2, [sx, sy + 3]); }
    }
  }

  /* Cabeza de dracónido de frente: cráneo ancho, hocico corto hacia delante, ojos de rendija, cuernos hacia atrás
     y escamas al tresbolillo; el cuello lleva las placas claras de la garganta. */
  function cabezaDraconido(g, t, piel, gesto) {
    const x = t.cabX, y = Math.round(t.cabY), rx = t.cabRx, f = t.fx;
    const ven = HUESO;
    const cu = capa().rect(x - 5, t.menton - 6, 11, t.torTop - t.menton + 9);
    cu.pintar(g, piel, { relieve: 4, max: 2 });
    for (let j = t.menton; j <= t.torTop + 2; j += 2) capa().ell(x + 1, j, 3.4, 0.9).pintar(g, ven, { relieve: 1, min: 1, max: 3 });
    /* Cuernos hacia atrás y gola de pinchos. */
    const cn = capa().curva(x - 4, y - 5, x - 9, y - 12, x - 13, y - 18, 4, 1).curva(x + 5, y - 5, x + 9, y - 12, x + 11, y - 17, 3.6, 1);
    cn.pintar(g, HUESO, { relieve: 2, separar: true });
    cada(g, HUESO, x - 16, y - 20, x + 14, y - 3, (i, j, k) => { if (cn.tiene(i, j) && k >= 2 && ((i + j) % 3 + 3) % 3 === 0) pon(g, HUESO, k - 1, [i, j]); });
    const gola = capa().poly([[x - rx - 4, y - 3], [x - rx + 1, y - 1], [x - rx + 1, y + 3]]).poly([[x - rx - 3, y + 3], [x - rx + 1, y + 2], [x - rx + 2, y + 6]])
      .poly([[x + rx + 4, y - 3], [x + rx - 1, y - 1], [x + rx - 1, y + 3]]).poly([[x + rx + 3, y + 3], [x + rx - 1, y + 2], [x + rx - 2, y + 6]]);
    gola.pintar(g, piel, { relieve: 1.4, separar: true, max: 3 });
    const c = capa().ell(x, y - 1.5, rx + 0.6, t.cabRy - 1.6);
    c.ell(f - 0.5, y + 4.5, rx - 2.6, 5);
    c.pintar(g, piel, { relieve: 6, umbrales: [0.12, 0.4, 0.7, 0.9], lado: 0.14, reflejo: true });
    /* Hocico: placas claras de la mandíbula. */
    const ho = capa().ell(f - 0.5, y + 6.5, rx - 4, 3).recortar(c);
    ho.pintar(g, ven, { relieve: 2.4, min: 1, max: 4 });
    /* Escamas: pocas y ordenadas en la frente y las mejillas. */
    cada(g, piel, x - rx - 2, y - t.cabRy, x + rx + 2, y + 3, (i, j, k) => {
      const fila = Math.floor(j / 3), u = ((i + (fila & 1) * 3) % 6 + 6) % 6, v = ((j % 3) + 3) % 3;
      if (k >= 2 && v === 2 && u >= 1 && u <= 3) pon(g, piel, k - 1, [i, j]);
    });
    /* Caballete del hocico y fosas nasales. */
    for (let j = y; j <= y + 4; j++) { if (g.rampa(f - 1, j) === piel) pon(g, piel, 4, [f - 1, j]); if (g.rampa(f + 1, j) === piel) pon(g, piel, 2, [f + 1, j]); }
    /* Arco de las cejas y crestas. */
    for (let i = f - 8; i <= f + 6; i++) if (g.rampa(i, t.ojoY - 2) === piel) pon(g, piel, i < f ? 4 : 3, [i, t.ojoY - 2]);
    const libre = (i, j) => g.rampa(i, j) === piel || g.rampa(i, j) === ven;
    const K = [rampaDe("#140a0a"), 0];
    const mapa = { K, O: [TIEF, 4], o: [TIEF, 3], q: [TIEF, 2], h: [TIEF, 5], T: [DIENTE, 4], t: [DIENTE, 2], m: [BOCA, 1], g: [BOCA, 3], n: [piel, 1] };
    const oy = t.ojoY - 1;
    if (gesto === "dolor") {
      sello(g, f - 7, oy, ["KK...", "..KK.", "KK..."], mapa, libre); sello(g, f + 1, oy, ["...KK", ".KK..", "...KK"], mapa, libre);
    } else if (gesto === "alegre") {
      sello(g, f - 7, oy, [".KKK.", "K...K"], mapa, libre); sello(g, f + 1, oy, [".KKK.", "K...K"], mapa, libre);
    } else if (gesto === "furia") {
      sello(g, f - 7, oy - 1, ["nn...", ".nnn.", "KOhKK", ".oKq."], mapa, libre); sello(g, f + 1, oy - 1, ["...nn", ".nnn.", "KKhOK", ".qKo."], mapa, libre);
    } else {
      sello(g, f - 7, oy, [".KKK.", "KOhKq", ".oKq."], mapa, libre); sello(g, f + 1, oy, [".KKK.", "qOhKK", ".oKq."], mapa, libre);
    }
    /* Fosas nasales y boca. */
    pon(g, piel, 0, [f - 2, y + 4], [f + 1, y + 4]); pon(g, piel, 1, [f - 3, y + 4], [f + 2, y + 4]);
    const by = y + 7;
    if (gesto === "normal") sello(g, f - 4, by, ["m.....m", ".mmmmm."], mapa, libre);
    else if (gesto === "alegre") sello(g, f - 4, by - 1, ["m.....m", "mTtTtTm", ".mgggm.", "..mmm.."], mapa, libre);
    else if (gesto === "dolor") sello(g, f - 4, by, [".mmmmm.", "mTtTtTm", "m.....m"], mapa, libre);
    else sello(g, f - 4, by - 1, [".......", "mmmmmmm", "TtTtTtT", "mgggggm", ".mmmmm."], mapa, libre);
  }

  /* ---------- Pelo y barba ---------- */
  /* Mechones: líneas hondas desde la coronilla y un arco de brillo arriba a la izquierda. */
  function mechones(g, ram, cx, cy, x0, y0, x1, y1, radio) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const ang = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
      const banda = ((ang * 3.4 + d * 0.03) % 1 + 1) % 1;
      if (k >= 2 && banda < 0.1 && d > 4) g.set(x, y, ram[k - 1], ram);
      else if (k >= 3 && Math.abs(d - radio) < 0.8 && ang < -1.3 && ang > -2.8 && banda > 0.3 && banda < 0.85) g.set(x, y, ram[Math.min(5, k + 1)], ram);
    });
  }
  /* Pelo de atrás (melena larga o coleta), que queda detrás del cuerpo. */
  function peloDetras(g, t, ram, peinado) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx;
    if (peinado === "largo") {
      const c = capa().ell(x, y, rx + 1.6, t.cabRy).poly([[x - rx - 1.6, y], [x + rx + 1.6, y], [x + rx + 3, t.torTop + 10], [x + 4, t.torTop + 13], [x - 4, t.torTop + 13], [x - rx - 3, t.torTop + 10]]);
      c.pintar(g, ram, { relieve: 4, max: 2 });
      for (let i = x - rx; i <= x + rx; i += 3) surco(g, ram, 1, i, y + 4, i + (i < x ? -1 : 1), t.torTop + 12, ram);
    }
  }
  /* Pelo de la cabeza. modo: "todo", "lados" (bajo un sombrero) o "flequillo" (bajo una capucha). */
  function pelo(g, t, ram, peinado, raza, modo = "todo") {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy, f = t.fx, oy = t.ojoY;
    if (modo === "nada") return;
    if (peinado === "rapado") {
      /* Pelo al rape: la coronilla tiene el color del pelo y un borde limpio en la frente. */
      if (modo !== "todo") return;
      const c = capa().ell(x, y - 2.4, rx + 0.3, ry - 1.6);
      c.quitarEll(f - 0.5, y + 3.4, rx - 0.8, ry - 2.2);
      c.borrarDesde(oy - 1);
      c.recortar(capaCabeza(t, raza));
      c.pintar(g, ram, { relieve: 4, max: 3, min: 1 });
      cada(g, ram, x - rx - 1, y - ry - 1, x + rx + 1, oy, (i, j, k) => { if (((i + j) & 1) && k > 1) g.set(i, j, ram[k - 1], ram); });
      return;
    }
    const rizado = peinado === "rizado";
    const ext = rizado ? 2 : 1.3;
    const c = capa().ell(x - 0.3, y - 2.4, rx + ext, ry - 0.2 + (rizado ? 1 : 0));
    /* Despeje de la cara: el flequillo cae en mechones de punta hacia la derecha. */
    c.quitarEll(f - 0.5, y + 4.4, rx - 1.2, ry - 2.6);
    const linea = oy - 4;
    for (let i = Math.floor(x - rx - 3); i <= Math.ceil(x + rx + 3); i++) {
      const u = i - (f - 7);
      const diente = u >= 0 && u <= 13 ? [0, 1, 2, 3, 1, 0, 1, 2, 3, 4, 2, 0, 1, 2][u] : 0;
      for (let j = linea - 1; j <= linea + diente; j++) if (Math.abs(i - (f - 0.5)) < rx - 0.6) c.on(i, j);
    }
    for (let j = linea + 1; j <= oy + 8; j++) for (let i = Math.floor(f - rx + 1.5); i <= Math.ceil(f + rx - 1.5); i++) {
      const u = i - (f - 7);
      const diente = u >= 0 && u <= 13 ? [0, 1, 2, 3, 1, 0, 1, 2, 3, 4, 2, 0, 1, 2][u] : 0;
      if (j > linea + diente) c.off(i, j);
    }
    /* Patillas por delante de las orejas. */
    c.borrarDesde(oy + (peinado === "largo" ? 3 : 1));
    if (peinado === "largo") {
      c.poly([[x - rx - 1.5, y - 1], [x - rx + 2.6, y], [x - rx + 3, t.menton - 2], [x - rx + 2, t.torTop + 8], [x - rx - 2.2, t.torTop + 6], [x - rx - 2.6, y + 3]]);
      c.poly([[x + rx + 1.5, y - 1], [x + rx - 1.6, y], [x + rx - 1.8, t.menton - 2], [x + rx - 1, t.torTop + 6], [x + rx + 2.2, t.torTop + 4], [x + rx + 2.4, y + 3]]);
    }
    if (rizado) {
      for (let a = 0; a < 14; a++) {
        const an = Math.PI * (0.95 + (a / 13) * 1.1);
        c.disco(x - 0.3 + Math.cos(an) * (rx + 1.2), y - 2.4 + Math.sin(an) * (ry - 0.6), 2.4);
      }
      for (const s of [-1, 1]) for (let j = 0; j < 3; j++) c.disco(x + s * (rx + 0.6), oy - 2 + j * 3, 2.2);
      c.quitarEll(f - 0.5, y + 4.6, rx - 1.6, ry - 3);
      c.borrarDesde(oy + 6);
    }
    if (peinado === "recogido" && modo === "todo") c.ell(x - 1, t.cima - 1.5, 4.6, 3.6);
    if (modo === "lados") c.borrarHasta(oy - 5);
    if (modo === "flequillo") c.recortar(capa().ell(f - 0.5, oy - 3, rx - 1, 3.4));
    c.pintar(g, ram, { relieve: 4.2, umbrales: [0.14, 0.42, 0.7, 0.9], reflejo: true });
    mechones(g, ram, x - 2, t.cima + 2, x - rx - 6, t.cima - 8, x + rx + 6, t.torTop + 12, ry - 2.5);
    if (rizado) {
      for (let a = 0; a < 16; a++) {
        const i = Math.round(x - rx + ((a * 5) % 17)), j = Math.round(t.cima + 2 + ((a * 7) % 9));
        if (g.rampa(i, j) !== ram || tono(g, i, j) < 2) continue;
        pon(g, ram, 1, [i, j + 1], [i + 1, j + 1]); pon(g, ram, Math.min(5, tono(g, i - 1, j) + 1), [i - 1, j]);
      }
    }
    if (peinado === "recogido" && modo === "todo") {
      /* Moño con su cinta de cuero. */
      for (let i = x - 5; i <= x + 3; i++) if (g.rampa(i, t.cima + 1) === ram) pon(g, CUERO, 3, [i, t.cima + 1]), pon(g, CUERO, 1, [i, t.cima + 2]);
    }
  }
  function barba(g, t, ram, larga) {
    const f = t.fx, x = t.cabX, rx = t.cabRx, by = t.bocaY, oy = t.ojoY;
    const c = capa().poly([[x - rx + 0.6, oy + 1], [x - rx + 2, oy + 1], [f - 5, by - 2], [f + 4, by - 2], [x + rx - 1.6, oy + 1], [x + rx - 0.4, oy + 1],
      [x + rx - 1, by + 1.5], [f + 3.5, t.menton + 1.5], [f - 0.5, t.menton + 3], [f - 4.5, t.menton + 1.5], [x - rx + 1, by + 1.5]]);
    if (larga) c.poly([[x - rx + 1, by], [x + rx - 1, by], [x + rx - 0.5, t.torTop + 6], [f + 4, t.torTop + 13], [f - 0.5, t.torTop + 16], [f - 5, t.torTop + 13], [x - rx + 0.5, t.torTop + 6]]);
    c.recortar(capa().rect(0, oy + 1, W, H));
    c.quitarRect(f - 3, by - 1, 6, 2);
    c.pintar(g, ram, { relieve: 4, separar: 2, reflejo: true });
    const [x0, , x1, y1] = c.caja();
    cada(g, ram, x0, oy + 2, x1, y1, (i, j, k) => {
      if (!c.tiene(i, j)) return;
      const ond = Math.round(Math.sin(j * 0.7) * 0.6);
      const fr = (((i + ond - Math.round(f)) % 3) + 3) % 3;
      if (k >= 2 && fr === 0 && j > by + 1) g.set(i, j, ram[k - 1], ram);
      else if (k >= 2 && k < 5 && fr === 1 && i < f + 1 && j % 5 < 3) g.set(i, j, ram[k + 1], ram);
    });
    /* Bigote sobre la boca. */
    const bi = capa().ell(f - 2.6, by - 1.4, 2.8, 1.2).ell(f + 2, by - 1.4, 2.6, 1.2).ell(f - 5, by, 1.2, 1.4).ell(f + 4.4, by, 1.2, 1.4);
    bi.pintar(g, ram, { relieve: 1.4, min: 2, separar: 1 });
    pon(g, ram, 5, [f - 3, by - 2], [f - 2, by - 2]);
    if (larga) {
      /* Dos trenzas con anillas de oro. */
      for (const bx of [f - 3, f + 2]) {
        for (let j = t.menton + 3; j < t.torTop + 13; j += 2) { pon(g, ram, 1, [bx, j]); pon(g, ram, 4, [bx + 1, j]); pon(g, ram, 3, [bx, j + 1]); }
        const ty = t.torTop + 9;
        pon(g, ORO, 5, [bx, ty]); pon(g, ORO, 4, [bx + 1, ty]); pon(g, ORO, 2, [bx, ty + 1], [bx + 1, ty + 1]);
      }
    }
  }

  /* ---------- Cuernos y colas ---------- */
  function cuernos(g, t, raza) {
    const x = t.cabX, f = t.fx, oy = t.ojoY, top = t.cima;
    if (raza === "tiefling") {
      const c = capa().curva(f - 5, oy - 5, f - 9, top - 2, f - 13, top - 6, 4, 1.2).curva(f + 4, oy - 5, f + 8, top - 2, f + 11, top - 5, 3.6, 1.2);
      c.pintar(g, CUERNO, { relieve: 1.8, separar: true, reflejo: true });
      cada(g, CUERNO, x - 18, top - 10, x + 16, oy, (i, j, k) => { if (c.tiene(i, j) && k >= 2 && ((i + j * 2) % 4 + 4) % 4 === 0) pon(g, CUERNO, k - 1, [i, j]); });
      pon(g, CUERNO, 5, [f - 8, top + 1], [f - 9, top - 1]);
    }
    if (raza === "satiro") {
      const c = capa().curva(x - 4, top + 3, x - 8, top - 4, x - 11, top + 1, 3.4, 1.4).curva(x + 4, top + 3, x + 8, top - 4, x + 10, top + 1, 3, 1.4);
      c.pintar(g, HUESO, { relieve: 1.6, separar: true });
      cada(g, HUESO, x - 14, top - 8, x + 14, top + 6, (i, j, k) => { if (c.tiene(i, j) && k >= 2 && ((j + i) % 2 + 2) % 2 === 0) pon(g, HUESO, k - 1, [i, j]); });
    }
  }
  function cola(g, t, piel, raza) {
    const x0 = t.cx - 4, y0 = t.cadY - 2;
    if (raza === "tiefling") {
      capa().curva(x0, y0, t.torL - 14, SUELO + 2, t.torL - 12, t.cadY - 4, 3, 1.8).pintar(g, piel, { relieve: 1.6, reflejo: true });
      const px = t.torL - 12, py = t.cadY - 5;
      capa().poly([[px - 3.5, py + 2], [px, py - 5], [px + 3.5, py + 2], [px, py + 0.5]]).pintar(g, piel, { relieve: 1.4, min: 1 });
      pon(g, piel, 5, [px - 1, py - 2]);
    }
    if (raza === "draconido") {
      const c = capa().curva(x0, y0 - 4, t.torL - 6, SUELO + 2, t.torL - 22, SUELO - 5, 11, 3);
      c.borrarDesde(SUELO + 1);
      c.pintar(g, piel, { relieve: 4.4, reflejo: true });
      const [a0, b0, a1, b1] = c.caja();
      for (let i = a0; i <= a1; i++) for (let j = b0; j <= b1; j++)
        if (c.tiene(i, j) && !c.tiene(i, j + 1)) { pon(g, HUESO, i % 3 === 0 ? 2 : 3, [i, j]); if (c.tiene(i, j - 1)) pon(g, HUESO, i % 3 === 0 ? 2 : 4, [i, j - 1]); }
      cada(g, piel, a0, b0, a1, b1, (i, j, k) => {
        const fila = Math.floor(j / 3), u = ((i + (fila & 1) * 2) % 4 + 4) % 4, v = ((j % 3) + 3) % 3;
        if (k >= 2 && v === 2 && u >= 1 && u <= 2) pon(g, piel, k - 1, [i, j]);
        else if (k >= 2 && k < 5 && v === 0 && u === 2) pon(g, piel, k + 1, [i, j]);
      });
    }
  }

  /* ---------- Brazos y manos ---------- */
  function codoIK(S, M, l1, l2, pref) {
    let dx = M[0] - S[0], dy = M[1] - S[1], d = Math.hypot(dx, dy) || 0.01;
    const dmax = l1 + l2 - 0.05;
    if (d > dmax) { M = [S[0] + (dx / d) * dmax, S[1] + (dy / d) * dmax]; dx = M[0] - S[0]; dy = M[1] - S[1]; d = dmax; }
    d = Math.max(d, Math.abs(l1 - l2) + 0.5);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const ux = dx / d, uy = dy / d, bx = S[0] + ux * a, by = S[1] + uy * a;
    const e1 = [bx - uy * h, by + ux * h], e2 = [bx + uy * h, by - ux * h];
    const p1 = (e1[0] - bx) * pref[0] + (e1[1] - by) * pref[1], p2 = (e2[0] - bx) * pref[0] + (e2[1] - by) * pref[1];
    return [p1 >= p2 ? e1 : e2, M];
  }
  /* Mano: puño (alrededor de un mango), abierta (dedos separados) o palma hacia arriba. */
  function mano(g, M, tipo, ram, E) {
    const [mx, my] = M;
    const dx = E ? M[0] - E[0] : 0, dy = E ? M[1] - E[1] : 1, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    if (tipo === "abierta" || tipo === "palma") {
      const c = capa().ell(mx, my, 2.4, 2.4);
      for (let k = -1.5; k <= 1.5; k += 1) {
        const ax = ux * 0.9 - uy * k * 0.5, ay = uy * 0.9 + ux * k * 0.5;
        c.linea(mx + ax * 2, my + ay * 2, mx + ax * 4.6, my + ay * 4.6, 1);
      }
      c.linea(mx - uy * 2.4, my + ux * 2.4, mx - uy * 3.6 + ux * 1.6, my + ux * 3.6 + uy * 1.6, 1);
      c.pintar(g, ram, { relieve: 1.6, separar: 1, min: 1 });
      return;
    }
    const c = capa().ell(mx, my, 2.7, 2.6);
    c.pintar(g, ram, { relieve: 2, separar: 1, min: 1 });
    /* Nudillos y pulgar. */
    pon(g, ram, 4, [mx - 1, my - 1], [mx, my - 2]);
    pon(g, ram, 2, [mx - 1, my + 1], [mx, my + 1], [mx + 1, my + 1]);
    pon(g, ram, 1, [mx + 2, my]);
  }
  /* Brazo completo: brazo, antebrazo, manga y mano. m = { sup, inf, guante, ancha, ribete, brazal, hombrera, abullonada } */
  function brazo(g, t, S, M, pref, m, piel, tipoMano) {
    const [E, M2] = codoIK(S, M, t.l1, t.l2, pref);
    const r1 = t.br + 0.6, r2 = t.br;
    const sup = capa().tubo(S[0], S[1], E[0], E[1], r1 + 0.4, r1 - 0.2);
    sup.pintar(g, m.sup, { relieve: r1 + 0.6, separar: 1, reflejo: true, lado: 0.2 });
    if (m.abullonada) {
      capa().ell(S[0] + (S[0] < t.cx ? -1 : 1), S[1] + 1, r1 + 1.6, r1 + 2).pintar(g, m.sup, { relieve: 3, separar: true, reflejo: true });
      const yb = Math.round(S[1] + r1 + 2.2);
      for (let i = Math.round(S[0] - r1 - 3); i <= Math.round(S[0] + r1 + 3); i++) for (const [dj, k] of [[0, 3], [-1, 4]]) if (g.rampa(i, yb + dj) === m.sup && g.rampa(i, yb + dj + 2) !== m.sup) pon(g, TELAS_R.granate, k, [i, yb + dj]);
    }
    const inf = capa().tubo(E[0], E[1], M2[0], M2[1], r2 + 0.2, r2 - 0.4);
    inf.pintar(g, m.inf, { relieve: r2 + 0.5, separar: 1, reflejo: true, lado: 0.2 });
    if (m.ancha) {
      /* Manga acampanada con su ribete. */
      const dx = M2[0] - E[0], dy = M2[1] - E[1], dl = Math.hypot(dx, dy) || 1, px = -dy / dl, py = dx / dl;
      const ax = E[0] + dx * 0.25, ay = E[1] + dy * 0.25, bx = E[0] + dx * 0.82, by = E[1] + dy * 0.82;
      const ma = capa().tubo(E[0], E[1], ax, ay, r1, r1).poly([[ax + px * r1, ay + py * r1], [bx + px * (r2 + 3.2), by + py * (r2 + 3.2)], [bx - px * (r2 + 3.2), by - py * (r2 + 3.2)], [ax - px * r1, ay - py * r1]]);
      ma.pintar(g, m.inf, { relieve: 3, separar: 1, reflejo: true });
      if (m.ribete) trazo(bx + px * (r2 + 3.2), by + py * (r2 + 3.2), bx - px * (r2 + 3.2), by - py * (r2 + 3.2), (x, y, u) => pon(g, m.ribete, u < 0.5 ? 4 : 3, [x, y]));
    }
    if (m.brazal) {
      const a = 0.35, b = 0.85;
      const br = capa().tubo(E[0] + (M2[0] - E[0]) * a, E[1] + (M2[1] - E[1]) * a, E[0] + (M2[0] - E[0]) * b, E[1] + (M2[1] - E[1]) * b, r2 + 0.9, r2 + 0.7);
      br.pintar(g, m.brazal, { relieve: 2, separar: 1, reflejo: true });
      const mx = E[0] + (M2[0] - E[0]) * 0.6, my = E[1] + (M2[1] - E[1]) * 0.6;
      const dx = M2[0] - E[0], dy = M2[1] - E[1], dl = Math.hypot(dx, dy) || 1;
      surco(g, m.brazal, 1, mx + (dy / dl) * (r2 + 1), my - (dx / dl) * (r2 + 1), mx - (dy / dl) * (r2 + 1), my + (dx / dl) * (r2 + 1), m.brazal);
    }
    if (m.hombrera) {
      const hc = capa().ell(S[0], S[1] - 0.5, r1 + 2.8, r1 + 1.8).borrarDesde(S[1] + r1 + 1.2);
      hc.pintar(g, m.hombrera, Object.assign({ relieve: 3.4, separar: true }, METAL));
      for (let i = Math.round(S[0] - r1 - 2.6); i <= Math.round(S[0] + r1 + 2.6); i++) if (g.rampa(i, Math.round(S[1] + r1)) === m.hombrera) pon(g, m.hombrera, 1, [i, Math.round(S[1] + r1)]);
      for (let i = Math.round(S[0] - r1 - 2.4); i <= Math.round(S[0] + r1 + 2.4); i++) if (g.rampa(i, Math.round(S[1] + r1 - 1)) === m.hombrera) pon(g, m.hombrera, 4, [i, Math.round(S[1] + r1 - 1)]);
      destello(g, m.hombrera, S[0] - 2, S[1] - 2, true);
    }
    if (tipoMano !== "nada") mano(g, M2, tipoMano || "puno", m.guante || piel, E);
    return { E, M: M2 };
  }

  /* ---------- Piernas y pies ---------- */
  /* Zapato visto desde arriba y delante: una punta redondeada que mira un poco a la derecha. */
  function zapato(g, x, ram, alto = 3, max = 4) {
    const c = capa().ell(x + 0.8, SUELO - 1.6, 3.8, 2.2).ell(x, SUELO - 3, 3.2, 2.4);
    c.borrarDesde(SUELO + 1);
    c.pintar(g, ram, { relieve: 2, separar: true, max, reflejo: true });
    for (let i = Math.round(x - 4); i <= Math.round(x + 5); i++) if (c.tiene(i, SUELO)) pon(g, ram, 1, [i, SUELO]);
    pon(g, ram, 5, [Math.round(x) - 1, SUELO - 3]);
    return c;
  }
  function pierna(g, t, Hp, P, ram, rodilla) {
    const K = [(Hp[0] + P[0]) / 2 + (P[0] < t.cx ? -0.6 : 0.6), t.rodY];
    const A = [P[0], SUELO - 4];
    const c = capa().tubo(Hp[0], Hp[1], K[0], K[1], t.pi + 0.4, t.pi - 0.2).tubo(K[0], K[1], A[0], A[1], t.pi - 0.3, t.pi - 1.3);
    c.borrarDesde(SUELO - 1);
    c.pintar(g, ram, { relieve: t.pi + 0.4, separar: 1, reflejo: true, lado: 0.2 });
    if (rodilla) {
      capa().ell(K[0], K[1], t.pi + 0.6, t.pi * 0.7).pintar(g, rodilla, Object.assign({ relieve: 2.6, separar: true }, METAL));
      destello(g, rodilla, K[0] - 1, K[1] - 1, false);
    }
    return { K, A };
  }
  function bota(g, t, P, K, ram, alto, cana) {
    const top = Math.max(K[1] + 2, SUELO - alto);
    const c = capa().tubo(P[0] + (K[0] - P[0]) * 0.15, top, P[0], SUELO - 4, t.pi + 0.3, t.pi - 0.4);
    c.pintar(g, ram, { relieve: t.pi, separar: 1, reflejo: true, lado: 0.2 });
    zapato(g, P[0], ram);
    if (cana) {
      /* Vuelta de la caña con su luz. */
      const cc = capa().ell(P[0] + (K[0] - P[0]) * 0.15, top + 0.5, t.pi + 1.2, 1.8);
      cc.pintar(g, cana, { relieve: 1.4, separar: 1 });
    }
  }
  function pieDesnudo(g, x, piel, peludo, ramPelo) {
    const c = zapato(g, x, piel, 3, 4);
    pon(g, piel, 2, [Math.round(x) + 2, SUELO - 1], [Math.round(x), SUELO - 1], [Math.round(x) + 4, SUELO - 2]);
    if (peludo) {
      const h = capa().ell(x, SUELO - 4, 3.6, 1.8);
      h.pintar(g, ramPelo, { relieve: 1.4, min: 1, max: 3 });
      for (let i = Math.round(x - 3); i <= Math.round(x + 3); i += 2) pon(g, ramPelo, 1, [i, SUELO - 3]);
    }
    return c;
  }
  function garras(g, x, piel) {
    const c = capa().ell(x + 0.6, SUELO - 2, 4.4, 2.4).borrarDesde(SUELO + 1);
    c.pintar(g, piel, { relieve: 2, separar: true, reflejo: true });
    for (const d of [-2, 1, 4]) { pon(g, HUESO, 4, [Math.round(x + d), SUELO - 1]); pon(g, HUESO, 2, [Math.round(x + d), SUELO]); }
  }
  /* Piernas de cabra del sátiro: muslo peludo, corvejón hacia atrás y pezuña hendida. */
  function piernaCabra(g, t, Hp, P, ramPelo) {
    const K = [(Hp[0] + P[0]) / 2 + (P[0] < t.cx ? -1.6 : 1.6), t.rodY - 2];
    const C = [P[0] + (P[0] < t.cx ? -0.5 : 0.5), SUELO - 9];
    const c = capa().tubo(Hp[0], Hp[1], K[0], K[1], t.pi + 2.2, t.pi + 1.4).tubo(K[0], K[1], C[0], C[1], t.pi + 0.8, t.pi - 2).tubo(C[0], C[1], P[0], SUELO - 3, t.pi - 2.4, t.pi - 2.4);
    c.pintar(g, ramPelo, { relieve: t.pi + 1, separar: 1, reflejo: true });
    pelaje(g, ramPelo, Hp[0] - 8, Hp[1], P[0] + 8, SUELO - 4);
    const pz = capa().ell(P[0] + 0.4, SUELO - 1.8, 3.2, 2.4).borrarDesde(SUELO + 1);
    pz.pintar(g, CUERNO, { relieve: 1.6, separar: true });
    pon(g, CUERNO, 1, [Math.round(P[0] + 0.4), SUELO - 2], [Math.round(P[0] + 0.4), SUELO - 1], [Math.round(P[0] + 0.4), SUELO]);
  }
  function piernas(g, t, piel, raza, ramPelo, op) {
    if (raza === "satiro") {
      piernaCabra(g, t, t.cadD, t.pieD, ramPelo);
      piernaCabra(g, t, t.cadI, t.pieI, ramPelo);
      return;
    }
    for (const [Hp, P] of [[t.cadD, t.pieD], [t.cadI, t.pieI]]) {
      const { K } = pierna(g, t, Hp, P, op.ramPierna, op.rodillera);
      if (op.descalzo) {
        if (raza === "draconido") garras(g, P[0], piel);
        else pieDesnudo(g, P[0], piel, raza === "mediano", ramPelo);
      } else bota(g, t, P, K, op.ramBota, op.alto, op.cana);
    }
  }

  /* ---------- Torso y ropa ---------- */
  function torso(t, ext = 0, bajo = 1) {
    const { cx, torTop: y0, cinY, cadY } = t;
    return capa().poly([
      [cx - 4, y0 - 1.5], [t.torL + 3.5, y0 - 0.5], [t.torL - ext + 0.3, y0 + 3.5], [t.torL - ext + 1.2, y0 + 9],
      [t.wL - ext, cinY], [t.cadL - ext, cadY + bajo], [t.cadR + ext, cadY + bajo], [t.wR + ext, cinY],
      [t.torR + ext - 1.2, y0 + 9], [t.torR + ext - 0.3, y0 + 3.5], [t.torR - 3.5, y0 - 0.5], [cx + 4, y0 - 1.5]
    ]);
  }
  /* Falda o faldón desde la cadera; el bajo se curva hacia abajo en el centro (lo vemos desde arriba). */
  function falda(t, largo, vuelo, y0 = t.cinY) {
    const yb = t.cadY + largo;
    const pts = [[t.wL - 0.5, y0], [t.wR + 0.5, y0], [t.cadR + 1, t.cadY], [t.cadR + vuelo, yb - 1.5]];
    for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([t.cadR + vuelo - u * (t.cadR - t.cadL + vuelo * 2), yb - 1.5 + Math.sin(u * Math.PI) * 2]); }
    pts.push([t.cadL - 1, t.cadY]);
    return capa().poly(pts);
  }
  function cinturon(g, t, ram = CUERO, hebilla = ORO, y = t.cinY + 1, alto = 3, sobre = null) {
    const c = capa();
    for (let x = 0; x < W; x++) for (let j = 0; j < alto; j++) { const yy = y + j + Math.round(Math.abs(x - t.cx - 1) < 12 ? 0 : 0); if (g.get(x, yy) && (!sobre || sobre.tiene(x, yy))) c.on(x, yy); }
    const [x0, , x1] = c.caja();
    c.recortar(capa().rect(Math.max(x0, t.wL - 6), y, Math.min(x1, t.wR + 6) - Math.max(x0, t.wL - 6) + 1, alto));
    c.pintar(g, ram, { relieve: 1.4, separar: 1, min: 1 });
    const hx = t.cx + 1;
    const hb = capa().rect(hx - 2, y - 1, 5, alto + 2);
    hb.pintar(g, hebilla, Object.assign({ relieve: 1.6, min: 1 }, METAL));
    pon(g, hebilla, 5, [hx - 2, y - 1]);
    pon(g, ram, 1, [hx, y + 1]);
  }
  function bolsa(g, x, y, ram = CUERO) {
    capa().ell(x, y + 3, 3, 3.4).pintar(g, ram, { relieve: 2.4, separar: true, reflejo: true });
    capa().rect(Math.round(x - 3), Math.round(y), 7, 2).pintar(g, ram, { relieve: 1, min: 3, max: 3, separar: 1 });
    pon(g, ORO, 5, [Math.round(x), Math.round(y + 1)]);
  }
  /* Capa a la espalda: asoma a los lados del cuerpo y cae hasta casi el suelo. */
  function capaEspalda(g, t, tela, largo, vuelo = 0) {
    const yb = Math.min(SUELO - 1, t.cadY + largo);
    const c = capa().poly([[t.torL + 2, t.torTop], [t.torR - 2, t.torTop], [t.torR + 4 + vuelo * 0.3, t.cinY], [t.torR + 6 + vuelo, yb - 2], [t.cx + 2 + vuelo, yb + 1], [t.torL - 6 + vuelo, yb - 1], [t.torL - 4 + vuelo * 0.3, t.cinY]]);
    c.pintar(g, tela, Object.assign({ relieve: 6, max: 2, lado: 0.2 }, TELA_OP));
    for (const dx of [-8, -3, 3, 9]) pliegue(g, tela, t.cx + dx * 0.6, t.cinY, t.cx + dx + vuelo * 0.5, yb - 2);
    ribete(g, c, tela, 2, 1);
  }
  /* Carcaj a la espalda: las plumas de las flechas asoman por encima del hombro izquierdo. */
  function carcaj(g, t) {
    const x = t.torL + 5, y = t.torTop - 2;
    const c = capa().tubo(x - 1, y - 2, x + 6, y + 14, 3.4, 3.2);
    c.pintar(g, CUERO, { relieve: 2.6, separar: true, reflejo: true });
    for (let k = 0; k < 4; k++) {
      const ax = x - 3 + k * 2.2, ay = y - 5 - (k % 2) * 2;
      capa().linea(ax + 0.8, ay + 4, ax, ay - 2, 1).pintar(g, MADERA, { plano: 3 });
      const pl = capa().poly([[ax - 1.4, ay - 1], [ax, ay - 6], [ax + 1.4, ay - 1], [ax, ay + 1]]);
      pl.pintar(g, k % 2 ? TELAS_R.granate : HUESO, { relieve: 1, min: 1, separar: 1 });
    }
    for (let i = Math.round(x - 3); i <= Math.round(x + 4); i++) pon(g, CUERO, 4, [i, Math.round(y - 3 + (i - x) * 0.3)]);
  }

  /* Ropa de cada clase sobre el torso. */
  function vestir(g, t, clase, tela, piel, raza) {
    const T = torso(t);
    const { cx, torTop: y0, cinY: cy, cadY: hy } = t;
    const f = cx + 1;
    const ky = t.rodY;
    switch (clase) {
      case "guerrero": {
        /* Loriga de malla hasta medio muslo, peto de placas con arista, sobreveste por delante y gola. */
        const F = falda(t, Math.max(8, Math.round((ky - hy) * 0.8)), 3);
        F.pintar(g, MALLA, Object.assign({ relieve: 4 }, METAL));
        malla(g, MALLA, t.cadL - 6, cy, t.cadR + 6, ky + 4);
        ribete(g, F, MALLA, 4, 1);
        const sv = capa().poly([[f - 5, cy], [f + 5, cy], [f + 6, ky + 1], [f + 0.5, ky + 3], [f - 5, ky + 1]]);
        sv.pintar(g, tela, Object.assign({ relieve: 4, separar: true }, TELA_OP));
        cada(g, tela, f - 8, cy, f + 8, ky + 4, (x, y) => { if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y) || !sv.tiene(x, y + 1)) pon(g, ORO, x < f ? 4 : 2, [x, y]); });
        pliegue(g, tela, f - 1, cy + 3, f - 1.5, ky);
        pliegue(g, tela, f + 3, cy + 4, f + 3.5, ky);
        const P = torso(t, 0.5, -3).recortar(capa().rect(0, 0, W, cy + 3));
        P.pintar(g, PLACA, Object.assign({ relieve: 7 }, METAL));
        /* Arista del peto, lamas de la barriga y remaches. */
        for (let y = y0 + 1; y < cy + 1; y++) { pon(g, PLACA, 5, [f - 1, y]); pon(g, PLACA, 2, [f + 1, y]); }
        for (const yy of [cy - 5, cy - 1]) for (let x = t.wL - 2; x <= t.wR + 2; x++) if (P.tiene(x, yy)) pon(g, PLACA, 1, [x, yy]), P.tiene(x, yy + 1) && pon(g, PLACA, 4, [x, yy + 1]);
        destello(g, PLACA, f - 6, y0 + 5, true);
        pon(g, PLACA, 5, [f - 7, y0 + 7], [f - 5, y0 + 4]);
        for (const [x, y] of [[t.torL + 4, y0 + 3], [t.torR - 4, y0 + 3]]) remache(g, ORO, x, y);
        cinturon(g, t, CUERO, ORO, cy + 2, 3);
        capa().rect(t.cabX - 5, y0 - 3, 11, 4).pintar(g, PLACA, Object.assign({ relieve: 1.8, separar: true }, METAL));
        for (let x = t.cabX - 5; x <= t.cabX + 5; x++) pon(g, PLACA, 4, [x, y0 - 3]);
        break;
      }
      case "barbaro": {
        /* Torso desnudo con músculos marcados, faldellín de tela con orla de piel y cinturón ancho. */
        T.pintar(g, piel, { relieve: 9, lado: 0.2, reflejo: true });
        const py = y0 + Math.round((cy - y0) * 0.38);
        for (const s of [-1, 1]) {
          const pc = capa().ell(f + s * 5, py, 5.4, 3.6).recortar(T);
          pc.pintar(g, piel, { relieve: 3.2, separar: 2 });
          trazoCurva(f + s * 9.5, py + 1, f + s * 5, py + 5, f + s * 0.5, py + 3, (x, y) => { if (g.rampa(x, y) === piel) pon(g, piel, 1, [x, y]); });
        }
        trazo(f, y0 + 2, f, cy + 3, (x, y) => { if (g.rampa(x, y) === piel) pon(g, piel, 2, [x, y]); });
        for (const yy of [py + 6, py + 10, py + 14]) {
          if (yy > cy + 2) break;
          for (const s of [-1, 1]) {
            const ab = capa().ell(f + s * 2.4, yy, 2, 1.5).recortar(T);
            ab.pintar(g, piel, { relieve: 1.6, separar: 2 });
          }
        }
        for (const s of [-1, 1]) trazoCurva(f + s * 9, py + 5, f + s * 7.5, cy - 2, f + s * 5, cy + 4, (x, y) => { if (g.rampa(x, y) === piel) pon(g, piel, 2, [x, y]); });
        pon(g, piel, 1, [f, cy + 1]);
        /* Cicatriz. */
        surco(g, piel, 5, f - 7, py - 3, f - 2, py + 3, piel); surco(g, piel, 1, f - 6, py - 3, f - 1, py + 3, piel);
        const F = falda(t, Math.max(8, Math.round((ky - hy) * 0.75)), 2, cy + 3);
        F.quitarPoly([[f - 1, ky + 6], [f + 0.5, hy + 4], [f + 2, ky + 6]]);
        F.pintar(g, tela, Object.assign({ relieve: 4 }, TELA_OP));
        for (const dx of [-7, -3, 4, 8]) pliegue(g, tela, f + dx * 0.7, cy + 6, f + dx, ky);
        const orla = capa();
        const [fx0, , fx1, fy1] = F.caja();
        for (let x = fx0; x <= fx1; x++) for (let y = fy1; y >= cy; y--) if (F.tiene(x, y)) { for (let k = 0; k < 2 + ((x * 3) % 3); k++) orla.on(x, y - k); break; }
        orla.pintar(g, PELLIZA, { relieve: 1.4, min: 1, separar: 1 });
        cinturon(g, t, CUERO, HIERRO, cy + 1, 5);
        /* Calavera del cinturón. */
        capa().ell(f, cy + 3, 2.6, 2.4).pintar(g, HUESO, { relieve: 1.6, min: 1, separar: true });
        pon(g, HUESO, 0, [f - 1, cy + 3], [f + 1, cy + 3]); pon(g, HUESO, 2, [f, cy + 5]);
        break;
      }
      case "picaro": {
        /* Camisa oscura, chaleco de cuero cruzado de correas, cinturón con bolsas. */
        T.pintar(g, tela, Object.assign({ relieve: 8, lado: 0.2 }, TELA_OP));
        const F = falda(t, 5, 1, cy);
        F.pintar(g, tela, Object.assign({ relieve: 3 }, TELA_OP));
        for (const s of [-1, 1]) {
          const v = capa().poly(s < 0
            ? [[t.torL + 2, y0], [f - 2, y0 + 1], [f - 1, cy + 6], [t.wL - 0.5, cy + 6], [t.torL + 1, y0 + 9]]
            : [[f + 2, y0 + 1], [t.torR - 2, y0], [t.torR - 1, y0 + 9], [t.wR + 0.5, cy + 6], [f + 1, cy + 6]]).recortar(T.copia().unir(F));
          v.pintar(g, CUERO2, { relieve: 4, separar: true, reflejo: true, lado: 0.2 });
          ribete(g, v, CUERO2, 4, 1);
        }
        trazo(f - 2, y0 + 2, f - 1, cy + 5, (x, y) => pon(g, CUERO2, 4, [x, y]));
        /* Bandolera con dagas arrojadizas. */
        const ban = capa().linea(t.torL + 4, y0 + 1, t.wR + 1, cy + 2, 3);
        ban.recortar(T).pintar(g, CUERO, { relieve: 1.2, min: 1, separar: 1 });
        for (let k = 0; k < 3; k++) {
          const bx = t.torL + 7 + k * 3.4, byy = y0 + 4 + k * ((cy - y0 - 2) / 6);
          pon(g, ACERO, 4, [bx, byy - 2], [bx, byy - 1]); pon(g, ACERO, 5, [bx, byy - 3]); pon(g, ORO, 3, [bx, byy]);
        }
        cinturon(g, t, CUERO, HIERRO, cy + 2, 3);
        bolsa(g, t.wL + 2, cy + 4, CUERO);
        bolsa(g, t.wR - 1, cy + 4, CUERO2);
        break;
      }
      case "explorador": {
        /* Túnica verde hasta medio muslo, jubón de cuero con cordones y la correa del carcaj. */
        const tr = T.copia().unir(falda(t, Math.round((ky - hy) * 0.7), 2, cy));
        tr.pintar(g, tela, Object.assign({ relieve: 7, lado: 0.2 }, TELA_OP));
        for (const dx of [-6, -2, 3, 7]) pliegue(g, tela, f + dx * 0.8, hy + 1, f + dx, ky - 2);
        const jb = torso(t, -0.5, -4).recortar(capa().rect(0, y0 + 2, W, cy - y0 + 3));
        jb.pintar(g, CUERO, { relieve: 6, separar: true, reflejo: true, lado: 0.2 });
        trazo(f, y0 + 3, f, cy + 3, (x, y) => pon(g, CUERO, 1, [x, y]));
        for (let y = y0 + 5; y < cy; y += 3) { pon(g, HUESO, 4, [f - 1, y]); pon(g, HUESO, 3, [f + 1, y + 1]); }
        for (const [a, b] of [[t.torL + 4, y0 + 4], [t.torR - 4, y0 + 4]]) costura(g, CUERO, a, b, a + (a < cx ? 1 : -1), cy, 1);
        const ban = capa().linea(t.torR - 3, y0, t.wL - 1, cy + 3, 3).recortar(T);
        ban.pintar(g, CUERO2, { relieve: 1.2, min: 1, separar: 1 });
        cinturon(g, t, CUERO2, ORO, cy + 2, 3);
        bolsa(g, t.wR, cy + 4, CUERO);
        break;
      }
      case "mago":
      case "brujo": {
        /* Túnica hasta el suelo con ribete y estrellas (mago) o runas (brujo). */
        const sat = raza === "satiro";
        const yb = sat ? ky + 4 : SUELO - 1;
        const pts = [[t.torL + 1, y0 + 2], [t.torR - 1, y0 + 2], [t.wR + 1, cy], [t.cadR + 7, yb - 2]];
        for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([t.cadR + 7 - u * (t.cadR - t.cadL + 14), yb - 2 + Math.sin(u * Math.PI) * 2.4]); }
        pts.push([t.wL - 1, cy]);
        const tr = T.copia().unir(capa().poly(pts));
        if (!sat) tr.borrarDesde(SUELO + 1);
        tr.pintar(g, tela, Object.assign({ relieve: 8, lado: 0.22 }, TELA_OP));
        for (const dx of [-10, -5, 0, 6, 11]) pliegue(g, tela, f + dx * 0.4, cy + 4, f + dx, yb - 2, f + dx * 0.8, (cy + yb) / 2);
        const borda = clase === "mago" ? ORO : RUNA;
        /* Abertura delantera con ribete. */
        trazo(f, y0 + 1, f + 1, yb, (x, y) => { if (g.rampa(x, y) === tela) { pon(g, borda, 4, [x, y]); pon(g, borda, 2, [x + 1, y]); } });
        ribete(g, tr, borda, 5, 2, tela);
        if (clase === "mago") {
          for (const [ex, ey, gr] of [[f - 7, cy + 12, true], [f + 7, cy + 20, false], [f - 4, yb - 10, false], [f + 9, yb - 7, true], [f - 10, yb - 4, false], [f + 4, y0 + 8, false]])
            if (g.rampa(ex, ey) === tela) estrella(g, ORO, ex, ey, gr, 5);
        } else {
          for (let y = cy + 8; y < yb - 4; y += 7) for (const ex of [f - 5, f + 6]) if (g.rampa(ex, y) === tela) { pon(g, RUNA, 4, [ex, y], [ex + 1, y + 1], [ex, y + 2]); pon(g, RUNA, 2, [ex - 1, y + 1]); }
        }
        /* Fajín. */
        const fj = capa().rect(t.wL - 1, cy, t.wR - t.wL + 3, 4).recortar(tr);
        fj.pintar(g, clase === "mago" ? TELAS_R.granate : CUERO2, { relieve: 1.6, separar: 1, min: 1 });
        if (clase === "brujo") { capa().ell(f, cy + 2, 2.4, 2.4).pintar(g, CRISTAL, { relieve: 1.6, min: 1 }); pon(g, CRISTAL, 5, [f - 1, cy + 1]); }
        else for (let j = cy + 4; j < cy + 11; j++) pon(g, TELAS_R.granate, j & 1 ? 2 : 4, [f + 4, j]);
        /* Cuello de la túnica. */
        capa().ell(t.cabX + 0.5, y0 - 0.5, 6.4, 2.4).recortar(capa().rect(0, y0 - 2, W, 6)).pintar(g, tela, { relieve: 1.6, min: 2, separar: 1 });
        break;
      }
      case "clerigo": {
        /* Cota de malla, tabardo blanco con el sol de oro y cinturón con el símbolo sagrado. */
        const F = falda(t, Math.round((ky - hy) * 0.85), 3, cy);
        const tr = T.copia().unir(F);
        tr.pintar(g, MALLA, Object.assign({ relieve: 7 }, METAL));
        malla(g, MALLA, t.torL - 4, y0 - 2, t.torR + 4, ky + 6);
        ribete(g, F, MALLA, 4, 1);
        const tb = capa().poly([[f - 7, y0 + 1], [f + 7, y0 + 1], [f + 6, cy], [f + 7, ky + 2], [f + 0.5, ky + 4], [f - 6, ky + 2], [f - 5, cy]]);
        tb.pintar(g, tela, Object.assign({ relieve: 5, separar: true, lado: 0.2 }, TELA_OP));
        ribete(g, tb, ORO, 5, 1, tela);
        cada(g, tela, f - 9, y0, f + 9, ky + 5, (x, y) => { if (!tb.tiene(x - 1, y) || !tb.tiene(x + 1, y)) pon(g, ORO, x < f ? 4 : 2, [x, y]); });
        pliegue(g, tela, f - 2, cy + 4, f - 3, ky);
        pliegue(g, tela, f + 3, cy + 4, f + 4, ky);
        /* Sol radiante en el pecho. */
        const sx = f, sy = y0 + Math.round((cy - y0) * 0.45);
        capa().ell(sx, sy, 2.8, 2.8).pintar(g, ORO, { relieve: 2, min: 1 });
        for (let k = 0; k < 8; k++) {
          const an = (k / 8) * Math.PI * 2, r1 = 3.8, r2 = k % 2 ? 5 : 6.2;
          trazo(sx + Math.cos(an) * r1, sy + Math.sin(an) * r1, sx + Math.cos(an) * r2, sy + Math.sin(an) * r2, (x, y) => pon(g, ORO, k < 4 ? 4 : 3, [x, y]));
        }
        pon(g, ORO, 5, [sx - 1, sy - 1]);
        cinturon(g, t, CUERO, ORO, cy + 1, 3);
        break;
      }
      case "bardo": {
        /* Jubón con botonadura de oro y cuchilladas granates, gorguera blanca y calzas granates. */
        const tr = T.copia().unir(falda(t, 6, 2, cy));
        tr.pintar(g, tela, Object.assign({ relieve: 7, lado: 0.2 }, TELA_OP));
        ribete(g, tr, TELAS_R.granate, 4, 2, tela);
        for (let y = y0 + 2; y <= cy + 4; y++) pon(g, tela, 1, [f + 1, y]), pon(g, tela, 4, [f, y]);
        for (let y = y0 + 4; y <= cy + 2; y += 4) { pon(g, ORO, 5, [f + 2, y]); pon(g, ORO, 2, [f + 3, y + 1]); }
        for (const [x0, yy] of [[f - 6, y0 + 6], [f - 3, y0 + 12], [f + 6, y0 + 7], [f + 5, y0 + 14], [f - 7, cy + 1]]) {
          if (g.rampa(x0, yy) !== tela) continue;
          pon(g, TELAS_R.granate, 4, [x0, yy], [x0, yy + 1]); pon(g, TELAS_R.granate, 2, [x0, yy + 2]);
          pon(g, tela, 5, [x0 - 1, yy], [x0 - 1, yy + 1]); pon(g, tela, 1, [x0 + 1, yy + 1], [x0 + 1, yy + 2]);
        }
        pliegue(g, tela, f - 5, cy + 3, f - 6, hy + 5);
        pliegue(g, tela, f + 6, cy + 3, f + 7, hy + 5);
        const gor = capa().ell(t.cabX + 0.5, y0 - 0.5, 7.2, 2.6);
        gor.pintar(g, HUESO, { relieve: 1.6, min: 2, separar: true });
        for (let x = t.cabX - 7; x <= t.cabX + 8; x++) if (x % 2 === 0) for (let y = y0 - 3; y <= y0 + 2; y++) if (gor.tiene(x, y)) pon(g, HUESO, y < y0 ? 3 : 2, [x, y]);
        cinturon(g, t, CUERO, ORO, cy + 2, 3);
        bolsa(g, t.wL + 2, cy + 4, CUERO);
        break;
      }
      default: {
        /* Túnica sencilla con cinturón de cuerda. */
        const tr = T.copia().unir(falda(t, Math.round((ky - hy) * 0.55), 2, cy));
        tr.pintar(g, tela, Object.assign({ relieve: 7, lado: 0.2 }, TELA_OP));
        for (const dx of [-6, -1, 5]) pliegue(g, tela, f + dx * 0.7, cy + 3, f + dx, ky - 4);
        pliegue(g, tela, f - 5, y0 + 4, f - 4, cy - 2);
        capa().poly([[t.cabX - 3, y0 - 1], [t.cabX + 4, y0 - 1], [t.cabX + 0.5, y0 + 4]]).pintar(g, piel, { relieve: 1.4, max: 2 });
        for (let x = t.wL - 2; x <= t.wR + 2; x++) if (g.rampa(x, cy + 2) === tela) { pon(g, CALZAS, (x % 3) ? 4 : 3, [x, cy + 2]); pon(g, CALZAS, 2, [x, cy + 3]); }
        surco(g, CALZAS, 3, f + 3, cy + 3, f + 4, cy + 9, null);
      }
    }
  }

  /* ---------- Tocados ---------- */
  /* Capucha: «pre» pinta el hueco oscuro de dentro (antes de la cabeza), «post» el borde y la esclavina. */
  function capuchaPre(g, t, ram, punta) {
    const f = t.fx, y = t.cabY;
    const fondo = capa().ell(f - 0.5, y + 0.5, t.cabRx + 0.6, t.cabRy + 0.8);
    fondo.pintar(g, ram, { plano: 1 });
  }
  function capuchaPost(g, t, ram, punta, borde) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy, f = t.fx;
    const c = capa().ell(x, y - 0.5, rx + 3.2, ry + 2.4);
    c.poly([[x - 6, t.cima - 1], [x - 3 - punta * 0.6, t.cima - 3 - punta], [x + 4, t.cima - 1]]);
    const ma = Math.min(5, (t.torR - t.torL) * 0.18);
    c.poly([[x - rx - 2.6, y + 3], [t.torL + ma - 1, t.torTop + 1.5], [t.torL + ma, t.torTop + 5], [t.cx + 1, t.torTop + 7.5], [t.torR - ma, t.torTop + 5], [t.torR - ma + 1, t.torTop + 1.5], [x + rx + 2.6, y + 3]]);
    c.quitarEll(f - 0.5, y + 2.2, rx - 0.8, ry - 0.6);
    c.pintar(g, ram, Object.assign({ relieve: 5, separar: 2, lado: 0.18 }, TELA_OP));
    /* Pliegues del embozo y el borde de la abertura con luz. */
    const ab = capa().ell(f - 0.5, y + 2.2, rx + 0.4, ry + 0.6).quitarEll(f - 0.5, y + 2.2, rx - 0.8, ry - 0.6).recortar(c);
    const [a0, b0, a1, b1] = ab.caja();
    for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) if (ab.tiene(i, j)) pon(g, borde || ram, (borde ? (i < f ? 4 : 3) : (i < f && j < y + 2 ? 5 : 3)), [i, j]);
    pliegue(g, ram, x - rx - 1, y + 4, t.torL + ma + 1, t.torTop + 4);
    pliegue(g, ram, x + rx + 1, y + 4, t.torR - ma - 1, t.torTop + 4);
    pliegue(g, ram, x - 2, t.cima - 1, x - 5, y - 4);
  }
  /* Sombra de la capucha sobre la frente y los ojos. */
  function sombraCapucha(g, t, piel, filas) {
    for (let j = t.cima; j <= t.ojoY - 3 + filas; j++) for (let i = t.cabX - 12; i <= t.cabX + 12; i++)
      if (g.rampa(i, j) === piel) { const k = tono(g, i, j); pon(g, piel, Math.max(1, Math.min(k, j < t.ojoY - 2 ? 1 : 2)), [i, j]); }
  }
  function yelmo(g, t, tela) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy, f = t.fx, oy = t.ojoY;
    /* Penacho de crin que cae hacia atrás. */
    const pe = capa().curva(x + 1, t.cima + 1, x - 1, t.cima - 9, x - 12, t.cima - 3, 6, 2).curva(x - 2, t.cima - 4, x - 10, t.cima - 6, x - 15, t.cima + 7, 4, 1.5);
    pe.pintar(g, tela, { relieve: 3, reflejo: true });
    cada(g, tela, x - 20, t.cima - 12, x + 4, t.cima + 9, (i, j, k) => { if (pe.tiene(i, j) && ((i * 2 + j) % 5 + 5) % 5 === 0 && k >= 2) pon(g, tela, k - 1, [i, j]); });
    const c = capa().ell(x, y - 2.6, rx + 1.8, ry - 0.2).borrarDesde(oy - 1);
    c.poly([[x - rx - 1.8, oy - 3], [f - 6.5, oy - 3], [f - 7, oy + 2], [f - 4.5, t.bocaY + 1], [x - rx + 0.5, t.bocaY + 2.5], [x - rx - 1.8, oy + 3]]);
    c.poly([[f + 5.5, oy - 3], [x + rx + 1.8, oy - 3], [x + rx + 1.8, oy + 3], [x + rx - 0.4, t.bocaY + 2.5], [f + 4.5, t.bocaY + 1], [f + 6, oy + 2]]);
    c.rect(f - 1, oy - 3, 2, 6);
    c.pintar(g, PLACA, Object.assign({ relieve: 6 }, METAL));
    /* Banda de la frente con remaches, arista central y brillo. */
    for (let i = Math.round(x - rx - 2); i <= Math.round(x + rx + 2); i++) {
      if (c.tiene(i, oy - 3)) pon(g, PLACA, 1, [i, oy - 2 < oy - 1 && c.tiene(i, oy - 2) ? oy - 2 : oy - 3]);
      if (c.tiene(i, oy - 4)) pon(g, PLACA, i < f ? 5 : 3, [i, oy - 4]);
    }
    for (const i of [x - rx + 1, x - 3, f + 3, x + rx - 1]) remache(g, ORO, i, oy - 5);
    for (let j = t.cima; j < oy - 5; j++) { pon(g, PLACA, 5, [x - 1, j]); pon(g, PLACA, 2, [x + 1, j]); }
    destello(g, PLACA, x - 5, t.cima + 4, true);
    for (let j = oy - 2; j <= oy + 2; j++) { pon(g, PLACA, 4, [f - 1, j]); pon(g, PLACA, 2, [f, j]); }
  }
  function cofia(g, t) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy, f = t.fx, oy = t.ojoY;
    const c = capa().ell(x, y - 0.6, rx + 2, ry + 1.4);
    c.poly([[x - rx - 2, y + 2], [t.torL + 1, t.torTop + 3], [t.torL + 3, t.torTop + 7], [t.torR - 3, t.torTop + 7], [t.torR - 1, t.torTop + 3], [x + rx + 2, y + 2]]);
    c.quitarEll(f - 0.5, oy + 3, rx - 1.8, ry - 1.8);
    c.pintar(g, MALLA, Object.assign({ relieve: 5, separar: 1 }, METAL));
    malla(g, MALLA, x - rx - 6, t.cima - 3, x + rx + 6, t.torTop + 8);
    /* Borde de cuero alrededor de la cara y diadema de oro. */
    const ab = capa().ell(f - 0.5, oy + 3, rx - 0.6, ry - 0.6).quitarEll(f - 0.5, oy + 3, rx - 1.8, ry - 1.8).recortar(c);
    ab.pintar(g, CUERO, { relieve: 1, min: 2, max: 3 });
    for (let i = Math.round(x - rx - 1); i <= Math.round(x + rx + 1); i++) if (c.tiene(i, oy - 6)) pon(g, ORO, i < f ? 4 : 3, [i, oy - 6]), pon(g, ORO, 2, [i, oy - 5]);
    capa().ell(f - 0.5, oy - 6, 1.6, 1.6).pintar(g, ORO, { relieve: 1.2, min: 2 });
    pon(g, ORO, 5, [f - 1, oy - 7]);
  }
  function sombreroMago(g, t, tela) {
    const x = t.cabX, oy = t.ojoY, by = oy - 5;
    const ala = capa().ell(x - 0.5, by + 0.5, t.cabRx + 8.5, 3.8);
    ala.pintar(g, tela, Object.assign({ relieve: 3, lado: 0.2 }, TELA_OP));
    for (let i = Math.round(x - t.cabRx - 9); i <= Math.round(x + t.cabRx + 8); i++) for (let j = by + 2; j <= by + 5; j++) if (ala.tiene(i, j) && !ala.tiene(i, j + 1)) pon(g, tela, 1, [i, j]), ala.tiene(i, j - 1) && pon(g, tela, 2, [i, j - 1]);
    const alto = Math.min(t.altSombrero + 4, by - 4);
    const cono = capa().poly([[x - 7.5, by + 0.5], [x + 7.5, by + 0.5], [x + 4, by - alto * 0.55], [x - 3, by - alto * 0.92], [x - 9, by - alto + 1], [x - 4.5, by - alto * 0.55]]);
    cono.pintar(g, tela, Object.assign({ relieve: 4.6, separar: true, lado: 0.25 }, TELA_OP));
    pliegue(g, tela, x + 1, by - 1, x - 1, by - alto * 0.5);
    pliegue(g, tela, x - 4, by - alto * 0.55, x - 6, by - alto * 0.8);
    /* Cinta de oro con hebilla y estrellas bordadas. */
    for (let i = Math.round(x - 7); i <= Math.round(x + 7); i++) for (let j = by - 2; j <= by; j++) if (cono.tiene(i, j)) pon(g, ORO, j === by - 2 ? (i < x ? 5 : 4) : j === by - 1 ? 3 : 2, [i, j]);
    capa().rect(x - 2, by - 3, 4, 4).pintar(g, ORO, Object.assign({ relieve: 1.2, min: 1 }, METAL));
    pon(g, ORO, 1, [x - 1, by - 2], [x, by - 2], [x - 1, by - 1], [x, by - 1]);
    for (const [ex, ey, gr] of [[x - 2, by - alto * 0.4, true], [x + 3, by - alto * 0.22, false], [x - 5, by - alto * 0.75, false], [x + 6, by + 1, false], [x - 11, by + 1, true]])
      if (g.get(Math.round(ex), Math.round(ey))) estrella(g, ORO, ex, ey, gr, 5);
    pon(g, ORO, 5, [Math.round(x - 9), Math.round(by - alto + 1)]);
  }
  function sombreroBardo(g, t, tela) {
    const x = t.cabX, oy = t.ojoY, by = oy - 5;
    const pl = capa().curva(x + 3, by - 3, x - 4, by - 14, x - 17, by - 10, 5, 1).curva(x - 4, by - 8, x - 12, by - 13, x - 18, by - 5, 3, 1);
    pl.pintar(g, TELAS_R.granate, { relieve: 2.4, reflejo: true });
    trazoCurva(x + 2, by - 4, x - 4, by - 13, x - 16, by - 10, (i, j) => pon(g, TELAS_R.granate, 5, [i, j]));
    cada(g, TELAS_R.granate, x - 22, by - 18, x + 6, by, (i, j, k) => { if (pl.tiene(i, j) && ((i + j) % 3 + 3) % 3 === 0 && k > 2) pon(g, TELAS_R.granate, k - 1, [i, j]); });
    const ala = capa().ellG(x - 0.5, by + 0.5, t.cabRx + 6.5, 3.4, -6);
    ala.pintar(g, tela, Object.assign({ relieve: 3, lado: 0.2 }, TELA_OP));
    for (let i = Math.round(x - t.cabRx - 7); i <= Math.round(x + t.cabRx + 7); i++) for (let j = by - 2; j <= by + 5; j++) if (ala.tiene(i, j) && !ala.tiene(i, j + 1)) pon(g, tela, 1, [i, j]);
    const copa = capa().ell(x - 0.5, by - 3.2, t.cabRx - 1.4, 4.6).borrarDesde(by + 1);
    copa.pintar(g, tela, Object.assign({ relieve: 3.6, separar: true, lado: 0.2 }, TELA_OP));
    pliegue(g, tela, x, by - 7, x + 1, by - 1);
    for (let i = Math.round(x - t.cabRx); i <= Math.round(x + t.cabRx); i++) for (const [j, k] of [[by - 1, 4], [by, 2]]) if (copa.tiene(i, j)) pon(g, TELAS_R.granate, k, [i, j]);
    remache(g, ORO, x + 3, by - 1);
  }
  function tocadoPre(g, t, clase, tela) {
    if (clase === "picaro") capuchaPre(g, t, tela, 3);
    else if (clase === "explorador") capuchaPre(g, t, tela, 2);
    else if (clase === "brujo") capuchaPre(g, t, tela, 7);
  }
  function tocado(g, t, clase, tela, piel) {
    switch (clase) {
      case "guerrero": yelmo(g, t, tela); break;
      case "clerigo": cofia(g, t); break;
      case "picaro": {
        sombraCapucha(g, t, piel, 0);
        /* Embozo que tapa nariz y boca, con sus pliegues. */
        const f = t.fx;
        const em = capa().ell(f - 0.5, t.bocaY - 0.5, t.cabRx - 0.6, 5.6).recortar(capa().rect(0, t.ojoY + 2, W, H)).recortar(capa().ell(t.cabX, t.cabY + 0.5, t.cabRx + 1, t.cabRy + 1.4));
        em.pintar(g, tela, Object.assign({ relieve: 3, separar: true }, TELA_OP));
        for (let i = Math.round(f - 7); i <= Math.round(f + 6); i++) if (em.tiene(i, t.ojoY + 2)) pon(g, tela, i < f ? 5 : 4, [i, t.ojoY + 2]);
        pliegue(g, tela, f - 5, t.bocaY - 1, f + 4, t.bocaY - 2);
        pliegue(g, tela, f - 3, t.bocaY + 2, f + 3, t.bocaY + 1);
        capuchaPost(g, t, tela, 3);
        break;
      }
      case "explorador": sombraCapucha(g, t, piel, -1); capuchaPost(g, t, tela, 2); break;
      case "brujo": sombraCapucha(g, t, piel, 1); capuchaPost(g, t, tela, 7, RUNA); break;
      case "mago": sombreroMago(g, t, tela); break;
      case "bardo": sombreroBardo(g, t, tela); break;
    }
  }

  /* ---------- Armas (en un marco local: u a lo largo del arma hacia la punta, v hacia su derecha) ---------- */
  function marco(M, ang) {
    const a = (ang * Math.PI) / 180, dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
    return { ang, at: (u, v = 0) => [M[0] + dx * u + px * v, M[1] + dy * u + py * v] };
  }
  const polyL = (m, pts) => capa().poly(pts.map(([u, v]) => m.at(u, v)));
  const tuboL = (m, u0, u1, r0, r1 = r0, v = 0) => { const a = m.at(u0, v), b = m.at(u1, v); return capa().tubo(a[0], a[1], b[0], b[1], r0, r1); };
  const lineaL = (g, m, u0, v0, u1, v1, fn) => { const a = m.at(u0, v0), b = m.at(u1, v1); trazo(a[0], a[1], b[0], b[1], fn); };
  function espada(g, m, L) {
    capa().disco(...m.at(-5.5), 2).pintar(g, ORO, Object.assign({ relieve: 1.6, min: 1 }, METAL));
    tuboL(m, -4, 2, 1.3).pintar(g, CUERO, { relieve: 1.2, min: 1 });
    for (let u = -3; u <= 1; u += 2) { const [a, b] = m.at(u, 0); pon(g, CUERO, 1, [a, b]); }
    const hoja = polyL(m, [[3.5, -2.3], [L - 5, -2.3], [L, 0], [L - 5, 2.3], [3.5, 2.3]]);
    hoja.pintar(g, ACERO, Object.assign({ relieve: 2.2, separar: 1 }, METAL));
    lineaL(g, m, 5, -1.2, L - 4, -1.2, (x, y) => { if (hoja.tiene(x, y)) pon(g, ACERO, 5, [x, y]); });
    lineaL(g, m, 5, 0.4, L - 6, 0.4, (x, y) => { if (hoja.tiene(x, y)) pon(g, ACERO, 2, [x, y]); });
    polyL(m, [[2, -7], [4, -7.5], [4, 7.5], [2, 7]]).pintar(g, ORO, Object.assign({ relieve: 1.4, separar: true, min: 1 }, METAL));
    const [gx, gy] = m.at(3, -6);
    pon(g, ORO, 5, [gx, gy]);
    destello(g, ACERO, ...m.at(L - 7, -1), true);
  }
  function hacha(g, m) {
    tuboL(m, -12, 25, 1.6, 1.4).pintar(g, MADERA, { relieve: 1.6, min: 1, separar: 1 });
    lineaL(g, m, -10, -0.6, 22, -0.6, (x, y) => { if (g.rampa(x, y) === MADERA) pon(g, MADERA, 4, [x, y]); });
    tuboL(m, -9, -3, 1.9).pintar(g, CUERO, { relieve: 1.2, min: 1 });
    for (let u = -8; u <= -3; u += 2) { const [a, b] = m.at(u, 0); pon(g, CUERO, 1, [a, b]); }
    const filo = polyL(m, [[15, 1], [12, 6], [9.5, 11], [14, 13], [20, 13.6], [26, 13], [29, 11], [26.5, 6], [23.5, 1]]);
    filo.pintar(g, ACERO, Object.assign({ relieve: 3, separar: 1 }, METAL));
    lineaL(g, m, 10, 11.5, 28, 11.5, (x, y) => { if (filo.tiene(x, y)) pon(g, ACERO, 5, [x, y]); });
    polyL(m, [[17, -1], [19.5, -6], [22, -1]]).pintar(g, ACERO, Object.assign({ relieve: 1.4, separar: 1 }, METAL));
    tuboL(m, 16, 25, 2.4).pintar(g, HIERRO, Object.assign({ relieve: 1.6, separar: 1, min: 1 }, METAL));
    for (const u of [18, 23]) remache(g, ORO, ...m.at(u, 0));
    destello(g, ACERO, ...m.at(19, 9), true);
  }
  function daga(g, m) {
    tuboL(m, -3.5, 1.5, 1.2).pintar(g, CUERO2, { relieve: 1, min: 1 });
    capa().disco(...m.at(-4.5), 1.4).pintar(g, ORO, { relieve: 1, min: 2 });
    const h = polyL(m, [[2.5, -1.7], [11, -1.4], [15, 0], [11, 1.4], [2.5, 1.7]]);
    h.pintar(g, ACERO, Object.assign({ relieve: 1.6, separar: 1 }, METAL));
    lineaL(g, m, 3, -0.6, 12, -0.6, (x, y) => { if (h.tiene(x, y)) pon(g, ACERO, 5, [x, y]); });
    polyL(m, [[1.5, -4], [2.8, -4], [2.8, 4], [1.5, 4]]).pintar(g, ORO, { relieve: 1, min: 1, separar: 1 });
  }
  function maza(g, m) {
    tuboL(m, -7, 16, 1.4).pintar(g, MADERA, { relieve: 1.4, min: 1, separar: 1 });
    tuboL(m, -6, -1, 1.8).pintar(g, CUERO, { relieve: 1.2, min: 1 });
    tuboL(m, 14, 16, 2.2).pintar(g, ORO, Object.assign({ relieve: 1.2, min: 1 }, METAL));
    const cab = capa().disco(...m.at(20.5), 4.6);
    for (const v of [-1, 1]) cab.poly([m.at(17, v * 4), m.at(20.5, v * 7.2), m.at(24, v * 4)]);
    cab.poly([m.at(23, -2.4), m.at(27.5, 0), m.at(23, 2.4)]);
    cab.pintar(g, ACERO, Object.assign({ relieve: 3, separar: 1 }, METAL));
    destello(g, ACERO, ...m.at(22, -2), true);
    for (const v of [-1, 1]) pon(g, ACERO, 1, m.at(20.5, v * 2.4).map(Math.round));
  }
  function baston(g, m, arriba, abajo, orbe = ORBE) {
    tuboL(m, -abajo, arriba - 2, 1.5, 1.5).pintar(g, MADERA, { relieve: 1.6, min: 1, separar: 1 });
    lineaL(g, m, -abajo + 2, -0.6, arriba - 4, -0.6, (x, y) => { if (g.rampa(x, y) === MADERA && ((x + y) % 7)) pon(g, MADERA, 4, [x, y]); });
    for (const u of [arriba - 12, arriba - 18]) tuboL(m, u, u + 1.4, 2.1).pintar(g, ORO, Object.assign({ relieve: 1, min: 1 }, METAL));
    /* Garras de madera que sujetan el orbe. */
    const ga = capa();
    for (const v of [-1, 1]) { const a = m.at(arriba - 3, v * 1.2), c = m.at(arriba + 1, v * 5), b = m.at(arriba + 6, v * 2.4); ga.curva(a[0], a[1], c[0], c[1], b[0], b[1], 2.4, 1.2); }
    ga.pintar(g, MADERA, { relieve: 1.4, min: 1, separar: 1 });
    const [ox, oy] = m.at(arriba + 3);
    capa().disco(ox, oy, 3.6).pintar(g, orbe, { relieve: 3, min: 1, reflejo: true });
    pon(g, orbe, 5, [Math.round(ox) - 1, Math.round(oy) - 2], [Math.round(ox) - 2, Math.round(oy) - 1]);
    pon(g, orbe, 4, [Math.round(ox) - 1, Math.round(oy) - 1]);
    return [ox, oy];
  }
  function arco(g, m, alto, bajo, tensa) {
    const a = m.at(alto, -1.5), b = m.at(-bajo, -1.5), c = m.at(0, 12);
    const arc = capa().curva(a[0], a[1], c[0], c[1], b[0], b[1], 2, 2);
    const mid = m.at(0, 4.6);
    arc.disco(mid[0], mid[1], 1.9);
    arc.pintar(g, MADERA, { relieve: 1.4, min: 1, separar: 1 });
    trazoCurva(a[0], a[1], c[0], c[1], b[0], b[1], (x, y, u) => { if (u > 0.08 && u < 0.92 && g.rampa(x - 1, y) === MADERA) pon(g, MADERA, 4, [x - 1, y]); });
    for (const s of [-1, 1]) { const p = m.at(s > 0 ? alto - 1 : -bajo + 1, -1); pon(g, ORO, 4, p.map(Math.round)); }
    tuboL(m, -2.5, 2.5, 2, 2, 4.4).pintar(g, CUERO, { relieve: 1, min: 1 });
    const cu = tensa ? [a, tensa, b] : [a, b];
    for (let k = 0; k < cu.length - 1; k++) trazo(cu[k][0], cu[k][1], cu[k + 1][0], cu[k + 1][1], (x, y) => { if (!g.get(x, y) || g.rampa(x, y) !== MADERA) pon(g, HUESO, 4, [x, y]); });
  }
  function flecha(g, x0, y0, x1, y1) {
    trazo(x0, y0, x1, y1, (x, y) => pon(g, MADERA, 4, [x, y]));
    const dx = x1 - x0, dy = y1 - y0, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
    capa().poly([[x1 - uy * 1.8, y1 + ux * 1.8], [x1 + ux * 4, y1 + uy * 4], [x1 + uy * 1.8, y1 - ux * 1.8]]).pintar(g, ACERO, Object.assign({ relieve: 1, min: 1 }, METAL));
    for (const s of [-1, 1]) trazo(x0, y0, x0 + ux * 4 + uy * s * 2, y0 + uy * 4 - ux * s * 2, (x, y) => pon(g, TELAS_R.granate, 4, [x, y]));
  }
  function laud(g, m) {
    const pts = [];
    for (let k = 0; k < 24; k++) { const an = (k / 24) * Math.PI * 2, c = Math.cos(an); pts.push([-5 + c * (c > 0 ? 7.4 : 10), Math.sin(an) * 7.6]); }
    const cu = polyL(m, pts);
    cu.pintar(g, LAUD, { relieve: 5.5, separar: true, reflejo: true });
    /* Tapa más clara, boca con roseta y puente. */
    const tapa = polyL(m, pts.map(([u, v]) => [-5 + (u + 5) * 0.78, v * 0.78]));
    tapa.pintar(g, LAUD, { relieve: 4, min: 2, max: 4 });
    tuboL(m, 2, 21, 1.8, 1.4).pintar(g, MADERA, { relieve: 1.2, min: 1, separar: 1 });
    polyL(m, [[20.5, -2], [27, -3.2], [27.5, 1.6], [20.5, 2]]).pintar(g, MADERA, { relieve: 1.2, min: 1, separar: 1 });
    for (const u of [22, 24.5]) for (const v of [-3.4, 2.8]) pon(g, ORO, 5, m.at(u, v).map(Math.round));
    const [hx, hy] = m.at(-1.5, 0);
    capa().disco(hx, hy, 2.6).pintar(g, ORO, { plano: 2 });
    capa().disco(hx, hy, 1.7).pintar(g, rampaDe("#1a0c08"), { plano: 0 });
    tuboL(m, -11.5, -10, 1, 1, 0).unir(polyL(m, [[-11.5, -3.5], [-10, -3.5], [-10, 3.5], [-11.5, 3.5]])).pintar(g, MADERA, { plano: 1 });
    for (const v of [-0.7, 0.7]) lineaL(g, m, -11, v, 21, v, (x, y) => { const r = g.rampa(x, y); if ((r === LAUD || r === MADERA) && !(x === Math.round(hx) && y === Math.round(hy))) pon(g, DIENTE, 4, [x, y]); });
    destello(g, LAUD, ...m.at(-10, -5), true);
  }
  function cristal(g, X, Y, ram = CRISTAL) {
    const c = capa().poly([[X, Y - 7], [X + 4, Y - 1], [X, Y + 6], [X - 4, Y - 1]]);
    c.pintar(g, ram, { plano: 3 });
    for (let j = Y - 7; j <= Y + 6; j++) for (let i = X - 4; i <= X + 4; i++) {
      if (!c.tiene(i, j)) continue;
      const k = i < X ? (j < Y - 1 ? 5 : 4) : (j < Y - 1 ? 3 : 2);
      pon(g, ram, k, [i, j]);
    }
    trazo(X - 4, Y - 1, X + 4, Y - 1, (i, j) => { if (c.tiene(i, j)) pon(g, ram, i < X ? 5 : 2, [i, j]); });
    pon(g, ram, 5, [X - 1, Y - 4], [X - 2, Y - 3]);
  }
  function nota(g, x, y, ram) {
    x = Math.round(x); y = Math.round(y);
    const c = capa().ell(x, y, 1.6, 1.2).rect(x + 1, y - 6, 1, 6).linea(x + 1, y - 6, x + 4, y - 4, 1);
    c.pintar(g, ram, { relieve: 1, min: 2 });
    pon(g, ram, 5, [x - 1, y - 1]);
  }
  function luzMagia(g, x, y, ram, grande = true) {
    x = Math.round(x); y = Math.round(y);
    const r = grande ? 5.5 : 3.4;
    const set = (i, j, k) => { if (!g.get(i, j) || g.rampa(i, j) === ram || k >= 4) pon(g, ram, k, [i, j]); };
    for (let j = Math.floor(y - r - 6); j <= y + r + 6; j++) for (let i = Math.floor(x - r - 6); i <= x + r + 6; i++) {
      const d = Math.hypot(i - x, j - y);
      if (d <= r * 0.35) set(i, j, 5);
      else if (d <= r * 0.65) set(i, j, 4);
      else if (d <= r) set(i, j, 3);
      else if (d <= r + 1.2 && ((i + j) & 1) === 0) set(i, j, 2);
    }
    const rayo = r + (grande ? 5 : 3);
    for (let k = Math.ceil(r); k <= rayo; k++) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(x + a * k, y + b * k, k > rayo - 2 ? 3 : 4);
    if (grande) for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) for (let k = Math.ceil(r * 0.75); k <= r + 1; k++) set(x + a * k, y + b * k, 4);
  }
  function chispa(g, ram, x, y, grande) { estrella(g, ram, x, y, grande, 5); }
  /* Estela del golpe: media luna de aire blanco-azulado, gruesa en el centro y fina en las puntas. */
  function estela(g, C, r, a0, a1, ancho) {
    const [cx, cy] = C;
    for (let j = Math.floor(cy - r - 2); j <= Math.ceil(cy + r + 2); j++) for (let i = Math.floor(cx - r - 2); i <= Math.ceil(cx + r + 2); i++) {
      if (i < 1 || j < 1 || i > W - 2 || j > SUELO) continue;
      const d = Math.hypot(i - cx, j - cy);
      let an = (Math.atan2(j - cy, i - cx) * 180) / Math.PI;
      let u = (an - a0) / (a1 - a0);
      if (u < 0 || u > 1) { an += 360; u = (an - a0) / (a1 - a0); }
      if (u < 0 || u > 1) continue;
      const w = ancho * Math.sin(u * Math.PI) ** 0.8;
      const p = (r - d) / Math.max(0.5, w);
      if (p < 0 || p > 1) continue;
      if (g.get(i, j) && g.rampa(i, j) !== ESTELA) continue;
      pon(g, ESTELA, p < 0.3 ? 5 : p < 0.6 ? 4 : p < 0.85 ? 3 : 2, [i, j]);
    }
  }
  function rayas(g, x0, x1, ys, k = 4) {
    for (const [y, a, b] of ys) for (let x = Math.round(x0 + a); x <= Math.round(x1 - b); x++) if (!g.get(x, y)) pon(g, ESTELA, x < x0 + a + 3 ? k - 2 : k, [x, y]);
  }

  /* ---------- Poses ---------- */
  const ARMA = { guerrero: "espada", barbaro: "hacha", picaro: "daga", explorador: "arco", mago: "baston", brujo: "cristal", clerigo: "maza", bardo: "laud" };
  function mover(t, dx, dy) {
    for (const k of ["cx", "cabX", "fx", "torL", "torR", "wL", "wR", "cadL", "cadR", "caderaAtras", "caderaDelante"]) t[k] += dx;
    for (const k of ["cabY", "ojoY", "bocaY", "menton", "torTop", "cinY", "cima"]) t[k] += dy;
    for (const k of ["hombroI", "hombroD", "manoI", "manoD"]) t[k] = [t[k][0] + dx, t[k][1] + dy];
    t.hombro = t.hombroD; t.mano = t.manoD; t.hombroAtras = t.hombroI; t.manoAtras = t.manoI;
    return t;
  }
  function posar(t, pose) {
    const P = { pose, incl: 0 };
    if (pose === "ataque") {
      mover(t, -6, 2); P.incl = 0.09;
      t.pieI = [t.pieI[0] - 4, t.pieI[1]]; t.pieD = [t.pieD[0] + 6, t.pieD[1]];
      t.capaV = -8;
    } else if (pose === "conjuro") {
      P.incl = -0.03; t.pieI = [t.pieI[0] - 2, t.pieI[1]]; t.pieD = [t.pieD[0] + 2, t.pieD[1]]; t.capaV = -5;
    } else if (pose === "herido") {
      mover(t, -1, 3); P.incl = -0.11;
      t.pieI = [t.pieI[0] - 3, t.pieI[1]]; t.pieD = [t.pieD[0] + 1, t.pieD[1]]; t.capaV = 4;
    } else if (pose === "victoria") {
      P.incl = -0.02; t.pieI = [t.pieI[0] - 3, t.pieI[1]]; t.pieD = [t.pieD[0] + 3, t.pieD[1]];
    }
    const piv = t.cadY;
    P.desp = y => (y >= piv ? 0 : Math.round(P.incl * (piv - y)));
    return P;
  }
  function cizallar(g, desp) {
    for (let y = 0; y < H; y++) {
      const d = desp(y);
      if (!d) continue;
      const o = y * W, c = g.c.slice(o, o + W), r = g.r.slice(o, o + W);
      for (let x = 0; x < W; x++) { g.c[o + x] = null; g.r[o + x] = null; }
      for (let x = 0; x < W; x++) if (c[x]) { const nx = x + d; if (nx >= 0 && nx < W) { g.c[o + nx] = c[x]; g.r[o + nx] = r[x]; } }
    }
  }
  /* Plan de cada pose: destino de cada mano (en largos de brazo desde su hombro), tipo de mano, arma y efectos. */
  function planPose(pose, tipo, clase, t) {
    const B = (d, mano, pref, mas = {}) => Object.assign({ d, mano, pref }, mas);
    const luzC = LUZ[clase] || LUZ.neutro;
    const PD = [0.45, 1], PI = [-0.45, 1];
    const quieta = B([-0.12, 0.94], "puno", PI);
    if (pose === "normal") {
      switch (tipo) {
        case "espada": return { D: B([0.34, 0.86], "puno", PD), I: B([0.08, 0.6], "puno", PI), arma: { tipo, ang: 22 }, escudo: true };
        case "hacha": return { D: B([0.3, 0.88], "puno", PD), I: quieta, arma: { tipo, ang: 14 } };
        case "daga": return { D: B([0.26, 0.86], "puno", PD), I: B([-0.22, 0.86], "puno", PI), arma: { tipo, ang: 165 }, arma2: { tipo, ang: 195 } };
        case "arco": return { D: B([0.36, 0.72], "puno", PD), I: quieta, arma: { tipo, ang: 0, alto: t.bajo ? 22 : 30, bajo: t.bajo ? 20 : 28 } };
        case "baston": return { D: B([0.4, 0.56], "puno", PD), I: quieta, arma: { tipo, ang: 0, arriba: t.manoD[1] + 1 - Math.max(6, t.cima - (t.bajo ? 2 : 4)), abajo: 0 } };
        case "cristal": return { D: B([0.5, 0.5], "palma", PD), I: quieta, arma: { tipo, cx: 1, cy: -10 }, luz: { en: "arma", ram: LUZ.brujo, grande: false } };
        case "maza": return { D: B([0.32, 0.86], "puno", PD), I: quieta, arma: { tipo, ang: 18 } };
        case "laud": return { D: B([0.34, 0.66], "puno", PD), I: quieta, arma: { tipo, ang: 24 } };
      }
      return { D: B([0.18, 0.92], "puno", PD), I: quieta, arma: null };
    }
    if (pose === "ataque") {
      const atras = B([-0.36, 0.72], "puno", PI);
      switch (tipo) {
        case "espada": return { D: B([0.82, -0.06], "puno", [0.2, 1]), I: B([0.16, 0.52], "puno", PI), arma: { tipo, ang: 84 }, escudo: true, estela: { r: 34, a0: -100, a1: 10, ancho: 6 } };
        case "hacha": return { D: B([0.8, 0.22], "puno", [0.2, 1]), I: atras, arma: { tipo, ang: 104 }, estela: { r: 34, a0: -110, a1: 20, ancho: 7 } };
        case "daga": return { D: B([0.9, 0.06], "puno", [0, 1]), I: atras, arma: { tipo, ang: 90 }, arma2: { tipo, ang: 200 }, rayas: true };
        case "arco": return { D: B([0.88, -0.1], "puno", [0, 1]), I: B([0.82, -0.04], "puno", [-0.2, 1], { desde: "D" }), arma: { tipo, ang: 0, alto: 26, bajo: 24, tensa: true }, flecha: true };
        case "baston": return { D: B([0.82, 0.06], "puno", [0, 1]), I: atras, arma: { tipo, ang: 72, arriba: 26, abajo: 20 }, luz: { en: "arma", ram: LUZ.mago, grande: false }, rayas: true };
        case "cristal": return { D: B([0.9, 0], "abierta", [0, 1]), I: atras, arma: { tipo, cx: 10, cy: -2 }, luz: { en: "arma", ram: LUZ.brujo, grande: true }, rayas: true };
        case "maza": return { D: B([0.8, 0.16], "puno", [0.2, 1]), I: atras, arma: { tipo, ang: 104 }, estela: { r: 30, a0: -105, a1: 15, ancho: 6 } };
        case "laud": return { D: B([0.82, -0.12], "puno", [0, 1]), I: atras, arma: { tipo, ang: 62 }, notas: true, luz: { en: "arma", ram: LUZ.bardo, grande: false } };
      }
      return { D: B([0.92, -0.04], "puno", [0, 1]), I: atras, arma: null, rayas: true };
    }
    if (pose === "conjuro") {
      const alzada = B([0.56, -0.62], "abierta", [1, 0.5]);
      const abajo = B([-0.22, 0.84], "puno", PI);
      const luzMano = ram => ({ en: "mano", ram, grande: true });
      switch (tipo) {
        case "espada": return { D: B([0.5, -0.72], "puno", [1, 0.3]), I: B([0.08, 0.6], "puno", PI), arma: { tipo, ang: 8 }, escudo: true, luz: { en: "punta", ram: LUZ.neutro, grande: true } };
        case "baston": return { D: B([0.5, -0.42], "puno", [1, 0.4]), I: B([-0.36, 0.2], "abierta", PI), arma: { tipo, ang: 10, arriba: 26, abajo: 30 }, luz: { en: "arma", ram: LUZ.mago, grande: true } };
        case "cristal": return { D: B([0.6, -0.5], "palma", [1, 0.4]), I: B([-0.4, 0.3], "abierta", PI), arma: { tipo, cx: 1, cy: -11 }, luz: { en: "arma", ram: LUZ.brujo, grande: true } };
        case "laud": return { D: B([0.4, 0.5], "puno", PD), I: B([-0.4, 0.3], "abierta", PI), arma: { tipo, ang: 40 }, notas: true, luz: { en: "aire", ram: LUZ.bardo, grande: true } };
        case "hacha": case "daga": case "arco": case "maza":
          return { D: alzada, I: abajo, arma: Object.assign({ tipo, mano: "I" }, tipo === "arco" ? { ang: 0, alto: 26, bajo: 24 } : tipo === "daga" ? { ang: 180 } : { ang: -10 }), luz: luzMano(tipo === "maza" ? LUZ.clerigo : LUZ.neutro) };
      }
      return { D: alzada, I: abajo, arma: null, luz: luzMano(luzC) };
    }
    if (pose === "herido") {
      const atras = B([-0.6, 0.18], "abierta", [-0.4, 1]);
      const caida = B([0.5, 0.72], "puno", PD);
      switch (tipo) {
        case "espada": return { D: caida, I: B([-0.1, 0.52], "puno", PI), arma: { tipo, ang: 138 }, escudo: true };
        case "laud": return { D: caida, I: atras, arma: { tipo, ang: 150 } };
        case "cristal": return { D: B([0.6, 0.58], "abierta", PD), I: atras, arma: { tipo, cx: 9, cy: 6 } };
        case "baston": return { D: caida, I: atras, arma: { tipo, ang: 30, arriba: 24, abajo: 30 } };
        case "arco": return { D: caida, I: atras, arma: { tipo, ang: 26, alto: 26, bajo: 24 } };
        case "daga": return { D: caida, I: atras, arma: { tipo, ang: 150 } };
        case "hacha": case "maza": return { D: caida, I: atras, arma: { tipo, ang: 140 } };
      }
      return { D: B([0.5, 0.66], "abierta", PD), I: atras, arma: null };
    }
    if (pose === "victoria") {
      const arriba = B([0.32, -0.96], "puno", [1, 0]);
      const cadera = B([-0.3, 0.42], "puno", [-1, -0.2]);
      switch (tipo) {
        case "espada": return { D: arriba, I: B([0.08, 0.6], "puno", PI), arma: { tipo, ang: 8 }, escudo: true, luz: { en: "punta", ram: LUZ.neutro, grande: false } };
        case "hacha": return { D: arriba, I: cadera, arma: { tipo, ang: 4 } };
        case "daga": return { D: arriba, I: cadera, arma: { tipo, ang: 6 } };
        case "arco": return { D: arriba, I: cadera, arma: { tipo, ang: 0, alto: 24, bajo: 22 } };
        case "baston": return { D: B([0.38, -0.8], "puno", [1, 0]), I: cadera, arma: { tipo, ang: 4, arriba: 22, abajo: 36 }, luz: { en: "arma", ram: LUZ.mago, grande: false } };
        case "cristal": return { D: B([0.32, -0.96], "palma", [1, 0]), I: cadera, arma: { tipo, cx: 1, cy: -10 }, luz: { en: "arma", ram: LUZ.brujo, grande: false } };
        case "maza": return { D: arriba, I: cadera, arma: { tipo, ang: 6 } };
        case "laud": return { D: B([0.4, -0.86], "puno", [1, 0]), I: cadera, arma: { tipo, ang: 14 }, notas: true };
      }
      return { D: arriba, I: cadera, arma: null };
    }
    return null;
  }
  function dibujarArma(g, A, M, t) {
    const m = marco(M, A.ang || 0);
    switch (A.tipo) {
      case "espada": { const L = t.bajo ? 26 : 34; espada(g, m, L); return m.at(L - 2); }
      case "hacha": hacha(g, m); return m.at(20, 8);
      case "daga": daga(g, m); return m.at(13);
      case "maza": maza(g, m); return m.at(21);
      case "baston": return baston(g, m, A.arriba || 28, A.abajo !== undefined ? A.abajo : 30);
      case "arco": arco(g, m, A.alto || 28, A.bajo || 26, A.tensaEn || null); return m.at(0, 6);
      case "laud": laud(g, m); return m.at(-4, 0);
      case "cristal": { const X = Math.round(M[0] + (A.cx || 0)), Y = Math.round(M[1] + (A.cy || -10)); cristal(g, X, Y); return [X, Y]; }
    }
    return M;
  }
  function escudo(g, t, C, tela) {
    const [sx, sy] = C.map(Math.round);
    const w = t.bajo ? 7 : 8.5, h = t.bajo ? 17 : 21;
    const pts = [[sx - w, sy - h * 0.45], [sx + w, sy - h * 0.45], [sx + w, sy], [sx + w * 0.7, sy + h * 0.28], [sx, sy + h * 0.55], [sx - w * 0.7, sy + h * 0.28], [sx - w, sy]];
    const c = capa().poly(pts);
    c.pintar(g, ORO, Object.assign({ relieve: 3, separar: true }, METAL));
    const ins = capa().poly(pts.map(([x, y]) => [sx + (x - sx) * 0.8, sy - 0.6 + (y - sy) * 0.84]));
    ins.pintar(g, tela, { relieve: 7, lado: 0.25 });
    /* Cruz blanca con su sombra y brillo. */
    const cruz = capa().rect(sx - 1, sy - Math.round(h * 0.36), 3, Math.round(h * 0.82)).rect(sx - Math.round(w * 0.72), sy - Math.round(h * 0.14), Math.round(w * 1.44) + 1, 3).recortar(ins);
    cruz.pintar(g, HUESO, { relieve: 1.4, min: 1 });
    for (let j = sy - h; j <= sy + h; j++) for (let i = sx - 12; i <= sx + 12; i++) if (cruz.tiene(i, j) && !cruz.tiene(i + 1, j) && ins.tiene(i + 1, j)) pon(g, tela, 1, [i + 1, j]);
    destello(g, ORO, sx - w + 2, sy - h * 0.45 + 1, true);
    pon(g, tela, 5, [sx - Math.round(w * 0.6), sy - Math.round(h * 0.32)], [sx - Math.round(w * 0.6) + 1, sy - Math.round(h * 0.32)]);
    for (const [x, y] of [[sx - w + 1, sy - 1], [sx + w - 1, sy - 1], [sx, sy + h * 0.5 - 1]]) remache(g, ORO, x, y);
  }

  /* ---------- Objetos extra para personajes no jugadores ---------- */
  const OBJETOS_EXTRA = {
    martillo(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx - 1, my - 18, 3, 26).pintar(g, MADERA, { relieve: 1.4, min: 1 });
      capa().rect(mx - 6, my - 26, 13, 8).pintar(g, HIERRO, Object.assign({ relieve: 3, separar: true }, METAL));
      for (let i = mx - 5; i <= mx + 6; i++) pon(g, HIERRO, 5, [i, my - 26]);
      destello(g, HIERRO, mx - 4, my - 24, true);
    },
    caduceo(g, t) {
      const [mx] = t.mano;
      const top = Math.max(6, t.cabY - 14);
      capa().rect(mx - 1, top + 4, 3, SUELO - top - 4).pintar(g, ORO, { relieve: 1.4, min: 1 });
      capa().ell(mx, top + 2, 2.6, 2.6).pintar(g, ORO, { relieve: 1.6, min: 2 });
      for (let y = top + 8; y < top + 36; y++) pon(g, R.hoja, 3, [mx + Math.round(Math.sin(y * 0.5) * 3), y]);
      for (const s of [-1, 1]) capa().poly([[mx + s, top + 4], [mx + s * 8, top], [mx + s * 6, top + 6]]).pintar(g, HUESO, { relieve: 1.2, min: 1 });
    },
    copa(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 1, my - 8, 4, 3).borrarHasta(my - 9).pintar(g, ORO, { relieve: 1.6, min: 1 });
      capa().rect(mx, my - 6, 2, 5).pintar(g, ORO, { relieve: 1.2, min: 1 });
      for (let i = mx - 2; i <= mx + 4; i++) pon(g, R.sangre, 3, [i, my - 9]);
    },
    odre(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 2, my + 5, 6, 5).pintar(g, CUERO, { relieve: 3, reflejo: true });
      costura(g, CUERO, mx - 3, my + 5, mx + 7, my + 5, 1);
    },
    cayado(g, t) {
      const [mx] = t.mano;
      const top = Math.max(8, t.cabY - 10);
      capa().rect(mx - 1, top + 6, 3, SUELO - top - 6).curva(mx, top + 6, mx, top - 2, mx + 8, top + 2, 3, 3).pintar(g, MADERA, { relieve: 1.4, min: 1 });
    },
    anillo(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 2, my - 6, 1.8, 1.8).quitarEll(mx + 2, my - 6, 0.6, 0.6).pintar(g, ORO, { relieve: 1, min: 2 });
      pon(g, HUESO, 5, [mx + 6, my - 11], [mx - 2, my - 11]);
    },
    balanza(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx, my - 16, 1, 16).rect(mx - 9, my - 16, 19, 1).pintar(g, ORO, { plano: 4 });
      capa().rect(mx - 10, my - 8, 7, 1).rect(mx + 4, my - 8, 7, 1).pintar(g, ORO, { plano: 3 });
      for (const i of [mx - 10, mx - 4, mx + 4, mx + 10]) surco(g, ORO, 2, mx + (i < mx ? -8 : 9), my - 15, i, my - 9, null);
    }
  };

  /* ---------- Composición ---------- */
  const PIERNAS = {
    guerrero: { ramPierna: PLACA, ramBota: PLACA, rodillera: PLACA, alto: 13 },
    clerigo: { ramPierna: MALLA, ramBota: CUERO, alto: 12, cana: CUERO },
    picaro: { ramPierna: TELAS_R.negro, ramBota: CUERO2, alto: 18, cana: CUERO2 },
    explorador: { ramPierna: CALZAS, ramBota: CUERO, alto: 15, cana: CUERO },
    bardo: { ramPierna: TELAS_R.granate, ramBota: CUERO, alto: 14, cana: CUERO },
    barbaro: { ramPierna: CUERO2, ramBota: PELLIZA, alto: 12 }
  };
  const MANGAS = {
    guerrero: { sup: PLACA, inf: PLACA, guante: PLACA, hombrera: PLACA },
    clerigo: { sup: MALLA, inf: MALLA, guante: CUERO, hombrera: PLACA },
    mago: { ancha: true, ribete: ORO },
    brujo: { ancha: true, ribete: RUNA },
    picaro: { guante: CUERO2, brazal: CUERO2 },
    explorador: { brazal: CUERO },
    bardo: { abullonada: true },
    barbaro: { brazal: CUERO }
  };

  function componer(a = {}) {
    a = a && typeof a === "object" ? a : {};
    const raza = RAZAS[a.raza] ? a.raza : "humano";
    const vis = RAZAS[raza] || {};
    const clase = typeof a.clase === "string" && a.clase ? a.clase : "guerrero";
    const t = plantilla(typeof a.cuerpo === "string" && CUERPOS[a.cuerpo] ? a.cuerpo : vis.cuerpo || "normal");
    const piel = PIELES[a.piel] || PIELES[(vis.pieles || [])[0]] || PIELES.clara;
    const ramPelo = PELOS[a.pelo] || PELOS[(vis.pelos || [])[0] || "negro"] || PELOS.negro;
    const tela = TELAS_R[a.tela] || TELAS_R[TELA_CLASE[clase]] || TELAS_R.terracota;
    const peinado = vis.sinPelo ? "rapado" : (PEINADOS.includes(a.peinado) ? a.peinado : "corto");
    const pose = POSES.includes(a.pose) ? a.pose : "normal";
    const gesto0 = GESTOS.includes(a.gesto) ? a.gesto : "normal";
    const gesto = pose === "herido" ? "dolor" : pose === "victoria" ? "alegre" : pose === "ataque" && gesto0 === "normal" ? "furia" : gesto0;
    const draco = raza === "draconido";
    const g = new Rejilla(W, H);
    t.piel = piel;
    const extra = typeof a.objeto === "string" && OBJETOS_EXTRA[a.objeto] ? a.objeto : null;
    const conArma = !extra && a.objeto !== "ninguno";
    const tipo = conArma ? ARMA[clase] || null : null;
    const P = posar(t, pose);
    const pl = planPose(pose, tipo, clase, t);
    const largas = clase === "mago" || clase === "brujo";
    const capucha = clase === "picaro" || clase === "explorador" || clase === "brujo";
    const modoPelo = draco ? "nada" : clase === "guerrero" || clase === "clerigo" ? "nada" : capucha ? "flequillo" : clase === "mago" || clase === "bardo" ? "lados" : "todo";

    /* Detrás del cuerpo: cola, capa, melena y carcaj. */
    cola(g, t, piel, raza);
    if (clase === "guerrero") capaEspalda(g, t, tela, SUELO - t.cadY - 4, t.capaV || 0);
    if (clase === "explorador") { capaEspalda(g, t, tela, SUELO - t.cadY - 8, t.capaV || 0); carcaj(g, t); }
    if (modoPelo === "todo" || modoPelo === "lados") peloDetras(g, t, ramPelo, peinado);
    /* Piernas y ropa. */
    const descalzo = (raza === "mediano" && !["guerrero", "clerigo"].includes(clase)) || (draco && (largas || !PIERNAS[clase]));
    const op = Object.assign({ ramPierna: CALZAS, ramBota: CUERO2, alto: 9 }, PIERNAS[clase] || {});
    if (descalzo) op.descalzo = true;
    if (!largas || raza === "satiro") piernas(g, t, piel, raza, ramPelo, op);
    vestir(g, t, clase, tela, piel, raza);
    if (largas && raza !== "satiro") {
      /* Las puntas de los pies asoman bajo la túnica. */
      for (const P0 of [t.pieI, t.pieD]) {
        const zx = P0[0];
        if (draco) garras(g, zx, piel);
        else if (raza === "mediano") pieDesnudo(g, zx, piel, true, ramPelo);
        else {
          const z = capa().ell(zx + 0.8, SUELO - 1.2, 3.6, 1.8).borrarDesde(SUELO + 1);
          z.pintar(g, CUERO2, { relieve: 1.6, separar: true });
          pon(g, CUERO2, 5, [Math.round(zx) - 1, SUELO - 2]);
        }
      }
    }
    if (clase === "barbaro") {
      /* Pelliza de lobo sobre los hombros. */
      const pz = capa().ell(t.cx, t.torTop + 1, (t.torR - t.torL) / 2 + 3, 4.6).ell(t.torL + 3, t.torTop + 4, 5.6, 6).ell(t.torR - 3, t.torTop + 3, 5, 5);
      const [x0, y0, x1, y1] = pz.caja();
      for (let i = x0; i <= x1; i++) { const corte = ((i * 5) % 3 + 3) % 3; for (let j = y1; j >= y0; j--) if (pz.tiene(i, j)) { for (let k = 0; k < corte; k++) pz.off(i, j - k); break; } }
      pz.pintar(g, PELLIZA, { relieve: 4, separar: true, reflejo: true });
      pelaje(g, PELLIZA, x0, y0, x1, y1);
    }
    /* Cabeza. */
    if (capucha) tocadoPre(g, t, clase, tela);
    if (draco) cabezaDraconido(g, t, piel, gesto);
    else {
      oreja(g, t, piel, raza);
      cabeza(g, t, piel, raza);
      if (modoPelo !== "nada") pelo(g, t, ramPelo, peinado, raza, modoPelo);
      if ((a.barba || vis.barba) && clase !== "picaro") barba(g, t, ramPelo, !!vis.barba);
      cara(g, t, { piel, raza, gesto, iris: colorIris(raza, ramPelo), cejas: ramPelo, sombra: false, barba: ramPelo });
      if (clase === "barbaro") {
        /* Pintura de guerra: dos franjas bajo los ojos. */
        for (const i of [t.fx - 6, t.fx - 5, t.fx + 3, t.fx + 4]) for (const j of [t.ojoY + 2, t.ojoY + 3]) if (g.rampa(i, j) === piel) pon(g, R.sangre, j === t.ojoY + 2 ? 3 : 2, [i, j]);
      }
    }
    const bajoSombrero = clase === "mago" || clase === "bardo";
    if (bajoSombrero) cuernos(g, t, raza);
    tocado(g, t, clase, tela, piel);
    if (!bajoSombrero && (clase !== "guerrero" || raza === "tiefling")) cuernos(g, t, raza);
    if (clase === "barbaro") {
      /* Cabeza del lobo en el hombro izquierdo. */
      const [hx, hy] = [t.torL + 3, t.torTop + 1];
      const lobo = capa().ell(hx, hy, 5.4, 4.2).poly([[hx - 2, hy + 1], [hx + 2, hy + 1], [hx + 1, hy + 7], [hx - 1, hy + 7]]).poly([[hx - 5, hy - 1], [hx - 4, hy - 7], [hx - 1, hy - 3]]).poly([[hx + 5, hy - 1], [hx + 4, hy - 7], [hx + 1, hy - 3]]);
      lobo.pintar(g, LOBO, { relieve: 3, min: 1, reflejo: true });
      perfilar(g, lobo);
      pelaje(g, LOBO, hx - 6, hy - 7, hx + 6, hy + 7);
      pon(g, LOBO, 1, [hx - 4, hy - 5], [hx + 4, hy - 5]);
      pon(g, rampaDe("#140c0c"), 0, [hx - 2, hy], [hx + 2, hy], [hx, hy + 7], [hx - 1, hy + 6], [hx + 1, hy + 6]);
      pon(g, TIEF, 4, [hx - 2, hy - 1]); pon(g, TIEF, 4, [hx + 2, hy - 1]);
      for (const i of [hx - 1, hx + 1]) pon(g, HUESO, 5, [i, hy + 5]);
    }

    /* Brazos y arma. */
    const la = t.l1 + t.l2;
    const destino = (b, S) => [S[0] + b.d[0] * la, S[1] + b.d[1] * la];
    const mangaD = MANGAS[clase] || {};
    const manga = {
      sup: mangaD.sup || (clase === "barbaro" ? piel : tela), inf: mangaD.inf || (clase === "barbaro" || !MANGAS[clase] ? (MANGAS[clase] ? piel : piel) : tela),
      guante: mangaD.guante, ancha: mangaD.ancha, ribete: mangaD.ribete, brazal: mangaD.brazal, hombrera: mangaD.hombrera, abullonada: mangaD.abullonada
    };
    if (!MANGAS[clase]) { manga.sup = tela; manga.inf = piel; }
    const A = pl.arma ? Object.assign({}, pl.arma) : null;
    const post = [];
    const efecto = (fn) => post.push(fn);
    let MD = destino(pl.D, t.hombroD), MI = destino(pl.I, t.hombroI);
    if (pl.I.desde === "D") MI = [MD[0] - 0.82 * la * 0.4 - 6, MD[1] + 1];
    if (A && A.tipo === "laud" && A.en) {
      /* Laúd cruzado delante del cuerpo: la mano izquierda en el mástil, la derecha en las cuerdas. */
      const m = marco(A.en, A.ang);
      MI = m.at(15, 0); MD = m.at(-4, 5);
    }
    if (A && A.tipo === "arco" && A.tensa) A.tensaEn = MI;
    const enI = A && A.mano === "I";
    const armaPos = [];
    const pintarArma = (M) => { const p = dibujarArma(g, A, M, t); armaPos.push(p); return p; };
    if (A && A.antes) pintarArma(A.en || MD);
    /* Brazo izquierdo (el del escudo). */
    const conEscudo = pl.escudo && tipo === "espada";
    if (enI && !A.antes) pintarArma(MI);
    if (pl.arma2) { const m2 = Object.assign({}, pl.arma2); dibujarArma(g, m2, MI, t); }
    const bI = brazo(g, t, t.hombroI, MI, pl.I.pref, manga, piel, conEscudo ? "puno" : pl.I.mano);
    if (conEscudo) escudo(g, t, [bI.M[0] - 1, bI.M[1] - 2], tela);
    /* Brazo derecho (el del arma). */
    if (A && !A.antes && !enI && A.tipo !== "cristal") pintarArma(MD);
    if (extra && a.objeto !== "martillo") OBJETOS_EXTRA[extra](g, Object.assign({}, t, { mano: MD.map(Math.round) }));
    const bD = brazo(g, t, t.hombroD, MD, pl.D.pref, manga, piel, pl.D.mano);
    if (extra === "martillo") OBJETOS_EXTRA.martillo(g, Object.assign({}, t, { mano: bD.M.map(Math.round) }));
    if (A && A.tipo === "cristal") pintarArma(bD.M);
    if (clase === "clerigo" && conArma && pose === "normal") {
      /* Símbolo sagrado colgado del cinturón. */
      const sx = Math.round(t.wL + 2), sy = t.cinY + 5;
      for (let j = sy; j <= sy + 4; j++) pon(g, ORO, j & 1 ? 2 : 4, [sx, j]);
      capa().ell(sx, sy + 7, 2.4, 2.4).pintar(g, ORO, { relieve: 1.6, min: 1 });
      pon(g, ORO, 5, [sx - 1, sy + 6]);
    }
    if (clase === "brujo" && conArma) {
      const [X, Y] = armaPos[armaPos.length - 1] || bD.M;
      efecto(gg => { for (const [i, j, gr] of [[X - 7, Y - 5, true], [X + 7, Y - 8, false], [X + 7, Y + 4, false]]) chispa(gg, CRISTAL, i + P.desp(j), j, gr); });
    }
    if (clase === "mago" && conArma && pose === "normal") {
      const [X, Y] = armaPos[0] || bD.M;
      efecto(gg => { chispa(gg, ORBE, X + 6 + P.desp(Y), Y - 4, false); chispa(gg, ORBE, X - 6 + P.desp(Y), Y + 5, false); });
    }
    /* Efectos de la pose (después del contorno). */
    const dsp = ([x, y]) => [x + P.desp(Math.round(y)), y];
    if (pl.estela) {
      const S = dsp(t.hombroD), e = pl.estela;
      efecto(gg => estela(gg, [S[0] - 2, S[1] + 2], e.r * (t.bajo ? 0.78 : 1), e.a0, e.a1, e.ancho));
    }
    if (pl.rayas) {
      const [x, y] = dsp(bD.M);
      efecto(gg => rayas(gg, x - 30, x - 4, [[Math.round(y) - 4, 0, 4], [Math.round(y), 6, 0], [Math.round(y) + 4, 3, 6]]));
    }
    if (pl.flecha) {
      const [x, y] = dsp(bD.M);
      efecto(gg => { flecha(gg, x + 8, Math.round(y) - 1, Math.min(W - 6, x + 26), Math.round(y) - 1); rayas(gg, x + 2, x + 18, [[Math.round(y) - 4, 0, 4], [Math.round(y) + 2, 4, 0]]); });
    }
    if (pl.luz) {
      const L = pl.luz;
      let p = L.en === "mano" ? bD.M : armaPos[armaPos.length - 1] || bD.M;
      if (L.en === "mano") { const dx = bD.M[0] - bD.E[0], dy = bD.M[1] - bD.E[1], dl = Math.hypot(dx, dy) || 1; p = [bD.M[0] + (dx / dl) * 5, bD.M[1] + (dy / dl) * 5]; }
      if (L.en === "aire") p = [t.torR + 12, t.torTop - 2];
      const q = dsp(p);
      efecto(gg => {
        luzMagia(gg, q[0], q[1], L.ram, L.grande);
        for (const [i, j, gr] of [[-9, -6, true], [8, -9, false], [10, 5, true], [-7, 8, false]]) chispa(gg, L.ram, q[0] + i * (L.grande ? 1 : 0.7), q[1] + j * (L.grande ? 1 : 0.7), gr);
      });
    }
    if (pl.notas) {
      const q = dsp(armaPos[0] || bD.M), ram = LUZ.bardo;
      efecto(gg => { nota(gg, q[0] + 12, q[1] - 10, ram); nota(gg, q[0] + 20, q[1] - 2, ram); nota(gg, q[0] + 6, q[1] - 20, ram); });
    }
    if (Array.isArray(a.extras)) a.extras.forEach(fn => { if (typeof fn === "function") fn(g, t, { piel, pelo: ramPelo, tela }); });
    if (P.incl) cizallar(g, P.desp);
    for (let y = SUELO + 1; y < H; y++) for (let x = 0; x < W; x++) g.quitar(x, y);
    for (let x = 0; x < W; x++) g.quitar(x, 0);
    for (let y = 0; y < H; y++) g.quitar(0, y).quitar(W - 1, y);
    if (!a.sinContorno) {
      contornoFR(g);
      for (const fn of post) fn(g);
      /* Sombra de contacto bajo los pies. */
      const x0 = Math.min(t.pieI[0], t.pieD[0]) - 6, x1 = Math.max(t.pieI[0], t.pieD[0]) + 7, cxs = (x0 + x1) / 2, rxs = (x1 - x0) / 2;
      for (let y = SUELO - 3; y <= SUELO; y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        const dx = (x - cxs) / rxs, dy = (y - SUELO + 0.5) / 3.2;
        if (dx * dx + dy * dy <= 1 && !g.get(x, y)) pon(g, SOMBRA_SUELO, dx * dx + dy * dy < 0.45 ? 1 : 2, [x, y]);
      }
    } else for (const fn of post) fn(g);
    return a.espejo ? g.espejo() : g;
  }

  window.HEROES_FR = { W, H, RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS, RAMPAS: R, POSES, plantilla, componer, matizar, OBJETOS_EXTRA };
})();
