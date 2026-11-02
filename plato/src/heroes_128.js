/* Dados y Mazmorras · héroes a 128×128.
   HEROES_128.componer(aspecto) devuelve una Rejilla NUEVA de 128×128 mirando a la derecha, con los pies en la fila 124
   (de la 125 a la 127 solo queda el contorno). Acepta el mismo aspecto que HEROES_64.componer:
   { raza, clase, piel, pelo, tela, peinado, barba, gesto, pose, cuerpo, objeto, extras, espejo, sinContorno }
   y reutiliza las mismas tablas (RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS), así que todo aspecto guardado sigue valiendo.
   Estilo «acogedor»: proporciones de unas cuatro cabezas, formas redondeadas, sombreado por bandas limpias de 3–4 tonos
   con desplazamiento de matiz (sombras frías, luces cálidas), casi sin tramado, contorno fino teñido del color de cada
   zona, ojos grandes con brillo, mechones de pelo con reflejo, pliegues suaves, metal con brillo especular, madera con
   veta y pequeños detalles (costuras, hebillas, remaches, bolsitas, cintas, plumas, runas). */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R0 } = PX;
  const W = 128, H = 128;
  const SUELO = 124;
  const CONTORNO = "#2a1722";

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
  const hacia = (h, obj, grados) => { const d = ((obj - h + 540) % 360) - 180; return h + Math.sign(d) * Math.min(Math.abs(d), grados); };
  /* Sombras hacia el violeta, luces hacia el amarillo; las luces ganan un punto de saturación (aire cálido). */
  const AJUSTE = [[258, 18, 0.06], [255, 10, 0.04], [0, 0, 0.02], [48, 6, 0.03], [50, 12, 0]];
  const cacheMatiz = new Map();
  function matizar(ram) {
    if (!Array.isArray(ram) || ram.length !== 5) return ram;
    if (cacheMatiz.has(ram)) return cacheMatiz.get(ram);
    const o = ram.map((c, i) => {
      if (typeof c !== "string" || c[0] !== "#" || c.length !== 7) return c;
      const [h, s, l] = aHsl(aRgb(c));
      const [obj, gr, ds] = AJUSTE[i];
      const s2 = s < 0.08 ? s + (i < 2 ? 0.07 : 0.04) : Math.max(0, Math.min(1, s + ds));
      const h2 = s < 0.08 ? (gr ? obj : h) : gr ? hacia(h, obj, gr) : h;
      return deHsl(h2, s2, l);
    });
    cacheMatiz.set(ram, o);
    return o;
  }
  if (R0.tela && R0.tela.negro) cacheMatiz.set(R0.tela.negro, ["#0d0a12", "#1d1724", "#312a3a", "#4c4258", "#73677f"]);
  const R = {};
  for (const [k, v] of Object.entries(R0)) {
    if (Array.isArray(v)) R[k] = matizar(v);
    else { R[k] = {}; for (const [k2, v2] of Object.entries(v)) R[k][k2] = matizar(v2); }
  }

  /* ---------- Colores propios ---------- */
  const OJOS = "#2a1824";
  const BLANCO = "#fbf5ea";
  const BRILLO = "#fffef6";
  const ACERO = ["#262a3c", "#454e68", "#71809a", "#b2c0d0", "#f3f6f0"];       // filos y hojas
  const PLACA = ["#22223a", "#3e4260", "#66708a", "#9aa6b8", "#dce2e2"];       // armadura de placas
  const MALLA = ["#1e1f2c", "#363a4c", "#565c70", "#80889a", "#b4bcc4"];       // cota de malla
  const CUERO = ["#2c1512", "#52291c", "#7e4828", "#ad6c3a", "#d89a5c"];
  const CUERO2 = ["#221614", "#3d2820", "#5f3f2e", "#86603f", "#ae875c"];      // cuero oscuro de botas y correas
  const PELLIZA = ["#24202a", "#433c42", "#6c605a", "#9c8d7e", "#cbbca8"];     // piel de lobo
  const ORO = ["#4a2612", "#83521a", "#c48a28", "#f0c850", "#fff4b0"];
  const MADERA = ["#2c160f", "#4e2c18", "#784826", "#a26c38", "#cc965a"];
  const PLUMA = ["#5e5058", "#958680", "#c8bcac", "#ece4d6", "#fffaf0"];
  const IRISES = { castano: "#7a4a26", verde: "#3f8a48", azul: "#3f78c0", gris: "#6e8092", ambar: "#c88a1c" };
  const SUDOR = ["#1c3c66", "#3a6ea8", "#6aa8dc", "#a8dcf6", "#f0fcff"];
  const MEJILLA = ["#6a2430", "#a03a44", "#d8626a", "#f08c88", "#ffb4a8"];
  const BARBAS = Object.values(R.pelo);

  /* ---------- Capas a 128×128 ----------
     Igual que PX.Capa, pero el relieve solo se calcula en la caja que ocupa la capa, las líneas gruesas usan un
     pincel redondo y las curvas se muestrean según su largo (a esta resolución 40 pasos dejarían huecos). */
  class Capa128 extends Capa {
    copia() { const o = new Capa128(this.w, this.h); o.m = this.m.slice(); return o; }
    borrarDesde(fila) { this.m.fill(0, Math.max(0, Math.min(this.h, fila)) * this.w); return this; }
    borrarHasta(fila) { this.m.fill(0, 0, Math.max(0, Math.min(this.h, fila)) * this.w); return this; }
    disco(x, y, r) {
      const r2 = r * r + 0.15;
      for (let j = Math.floor(y - r); j <= Math.ceil(y + r); j++)
        for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++) {
          const dx = i - x, dy = j - y;
          if (dx * dx + dy * dy <= r2) this.on(i, j);
        }
      return this;
    }
    linea(x0, y0, x1, y1, g = 1) {
      const pasos = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 1.5);
      for (let s = 0; s <= pasos; s++) {
        const x = x0 + ((x1 - x0) * s) / pasos, y = y0 + ((y1 - y0) * s) / pasos;
        if (g <= 1) this.on(x, y);
        else if (g < 3) this.rect(Math.round(x - (g - 1) / 2), Math.round(y - (g - 1) / 2), Math.round(g), Math.round(g));
        else this.disco(x, y, g / 2);
      }
      return this;
    }
    curva(x0, y0, cx, cy, x1, y1, g = 1, g1 = g) {
      const largo = Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy);
      const n = Math.max(40, Math.ceil(largo * 1.6));
      for (let s = 0; s <= n; s++) {
        const t = s / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const gr = g + (g1 - g) * t;
        if (gr <= 1.2) this.on(x, y);
        else this.ell(x, y, (gr - 1) / 2, (gr - 1) / 2);
      }
      return this;
    }
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
    caja() {
      const w = this.w, h = this.h, m = this.m;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) if (m[o + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      return [x0, y0, x1, y1];
    }
    /* Mismo sombreado que PX.Capa.pintar (relieve por distancia al borde, luz arriba a la izquierda). */
    pintar(rej, rampa, op = {}) {
      const w = this.w, h = this.h, m = this.m;
      const [x0, y0, x1, y1] = this.caja();
      if (x1 < 0) return rej;
      if (op.plano !== undefined) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const RR = op.relieve || 4;
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
        if (m[i]) { const v = Math.min(d[i], RR) / RR; A[i] = Math.sqrt(1 - (1 - v) * (1 - v)); }
      }
      const alto = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : A[y * w + x]);
      const L = op.luz || [-0.5, -0.62, 0.6];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.4, sesgo = op.sesgo || 0;
      const u = op.umbrales || [0.965, 0.74, 0.4, 0.02];
      const tiene = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!m[y * w + x]) continue;
        const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k;
        const ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
        const nl = Math.hypot(nx, ny, 1);
        const l = (nx * lx + ny * ly + lz) / nl + sesgo;
        let t = l > u[0] ? 4 : l > u[1] ? 3 : l > u[2] ? 2 : l > u[3] ? 1 : 0;
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
  const capa = () => new Capa128(W, H);

  /* ---------- Utilidades de pintura ---------- */
  const lim = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pon = (g, ram, k, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[lim(k, 0, 4)], ram); return g; };
  const tono = (g, x, y) => { const r = g.rampa(x, y); return r ? r.indexOf(g.get(x, y)) : -1; };
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), i = tono(g, x, y);
    if (!r || i < 0) return;
    g.set(x, y, r[lim(i + d, 0, r.length - 1)], r);
  }
  function cada(g, ram, x0, y0, x1, y1, fn) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++)
        if (g.rampa(x, y) === ram) fn(x, y, tono(g, x, y));
  }
  /* Línea de un píxel en un tono, solo sobre lo que ya es de la rampa «soloSobre» (o sobre todo si es null). */
  function surco(g, ram, k, x0, y0, x1, y1, soloSobre = ram) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!soloSobre || g.rampa(x, y) === soloSobre) g.set(x, y, ram[k], ram);
    }
  }
  /* Surco que sube o baja un tono lo que ya hay (sirve para cualquier material). */
  function relieveLinea(g, d, x0, y0, x1, y1, soloSobre = null) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    let px = null, py = null;
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (x === px && y === py) continue;
      px = x; py = y;
      if (!soloSobre || g.rampa(x, y) === soloSobre) matiz(g, x, y, d);
    }
  }
  /* Pliegue de tela: surco oscuro con su luz al lado izquierdo, que se afina en las puntas. */
  function pliegue(g, ram, x0, y0, x1, y1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let s = 0; s <= n; s++) {
      const u = s / n, x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + (y1 - y0) * u);
      if (g.rampa(x, y) === ram) { const k = tono(g, x, y); g.set(x, y, ram[Math.max(0, Math.min(k, 2) - 1)], ram); }
      if (u > 0.12 && u < 0.85 && g.rampa(x - 1, y) === ram && tono(g, x - 1, y) < 4) matiz(g, x - 1, y, 1);
    }
  }
  /* Costura: puntadas de dos píxeles con hueco, un tono por encima o por debajo. */
  function costura(g, ram, x0, y0, x1, y1, d = 1, soloSobre = ram) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let s = 0; s <= n; s++) {
      if (s % 4 > 1) continue;
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!soloSobre || g.rampa(x, y) === soloSobre) matiz(g, x, y, d);
    }
  }
  /* Remache redondo de 2×2 con brillo arriba a la izquierda. */
  function remache(g, ram, x, y) {
    x = Math.round(x); y = Math.round(y);
    pon(g, ram, 4, [x, y]); pon(g, ram, 3, [x + 1, y], [x, y + 1]); pon(g, ram, 1, [x + 1, y + 1]);
  }
  /* Cota de malla: anillas de 3×2 al tresbolillo, con su brillo arriba y el hueco oscuro abajo. */
  function malla(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const fila = Math.floor(y / 3), col = ((x + (fila & 1) * 2) % 4 + 4) % 4, f = ((y % 3) + 3) % 3;
      if (f === 0 && (col === 1 || col === 2)) g.set(x, y, ram[Math.min(4, k + 1)], ram);
      else if (f === 1 && col === 0) g.set(x, y, ram[Math.max(0, k - 1)], ram);
      else if (f === 2 && (col === 1 || col === 2) && k > 1) g.set(x, y, ram[k - 1], ram);
    });
  }
  /* Ribete en el borde inferior de una capa. */
  function ribete(g, c, ram, k = 3, filas = 2) {
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      for (let f = 1; f <= filas; f++) if (!c.tiene(x, y + f)) { g.set(x, y, ram[f === 1 ? k - 1 : k], ram); break; }
    }
  }
  /* Sombra de la parte baja de una tela por bandas limpias (sin tramado), con un borde ondulado suave. */
  function penumbra(g, ram, x0, y0, x1, y1, fuerza = 0.45) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const t = (y - y0) / Math.max(1, y1 - y0);
      if (k > 1 && t > 1 - fuerza + Math.sin(x * 0.45) * 0.05) g.set(x, y, ram[k - 1], ram);
    });
  }
  /* Brillo especular: estrella de cuatro puntas con el centro blanco. */
  function destello(g, ram, x, y, grande) {
    x = Math.round(x); y = Math.round(y);
    pon(g, ram, 4, [x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]);
    if (grande) {
      pon(g, ram, 4, [x - 1, y], [x + 2, y + 1], [x, y - 1], [x + 1, y + 2]);
      pon(g, ram, 3, [x - 2, y], [x + 3, y + 1], [x, y - 2], [x + 1, y + 3]);
      g.set(x, y, BRILLO, ram);
    }
  }
  const hashTexto = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

  /* Sello: dibujo a mano en texto. Cada letra es un color de «mapa» ([color, rampa]); «.» y « » no pintan.
     «libre(x, y)» decide si se puede pintar en cada píxel (para respetar yelmos y capuchas). */
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
        g.set(x, y, c[0], c[1] || null);
      }
    }
  }

  /* Línea oscura alrededor de una capa sobre lo que ya hay pintado detrás: el tono más hondo del material
     vecino, así el objeto se separa del cuerpo sin una raya negra. */
  function perfilar(g, c) {
    const marcas = [];
    const [x0, y0, x1, y1] = c.caja();
    for (let y = Math.max(0, y0 - 1); y <= Math.min(H - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(W - 1, x1 + 1); x++) {
      if (c.tiene(x, y) || !g.get(x, y)) continue;
      if (c.tiene(x - 1, y) || c.tiene(x + 1, y) || c.tiene(x, y - 1) || c.tiene(x, y + 1)) marcas.push([x, y]);
    }
    for (const [x, y] of marcas) { const r = g.rampa(x, y); g.set(x, y, r ? (tono(g, x, y) >= 3 ? r[1] : r[0]) : CONTORNO, r); }
  }

  /* ---------- Contorno de color ----------
     Un píxel de grueso y solo en cruz (sin rellenar las esquinas), así queda fino y redondeado. Su color es una
     versión oscura del material que bordea: en el lado de la luz (arriba e izquierda), la sombra honda del propio
     color; en el lado de la sombra, esa misma sombra un poco más oscura y fría. Nunca negro puro. */
  const cacheOscuro = new Map();
  const oscuro = c => { if (!cacheOscuro.has(c)) cacheOscuro.set(c, mezcla(c, "#120a1a", 0.42)); return cacheOscuro.get(c); };
  const cacheLuz = new Map();
  const borde = c => { if (!cacheLuz.has(c)) cacheLuz.set(c, mezcla(c, "#1a0e18", 0.12)); return cacheLuz.get(c); };
  function contornoSel(g) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      const vec = ab ? [x, y + 1] : iz ? [x - 1, y] : de ? [x + 1, y] : [x, y - 1];
      const ram = g.rampa(vec[0], vec[1]);
      const base = ram ? ram[0] : mezcla(g.get(vec[0], vec[1]), "#120a1a", 0.55);
      const col = (!iz && !ar) ? borde(base) : oscuro(base);
      nuevos.push([x, y, col]);
    }
    for (const [x, y, col] of nuevos) g.set(x, y, col);
    return g;
  }

  /* ---------- Plantilla del cuerpo ----------
     Medidas a 128 (el doble que a 64), con la cabeza algo más grande y redonda. */
  const CUERPOS = {
    normal: { cabY: 28, rx: 12.8, ry: 13.6, torTop: 46, torBot: 76, hombros: 36, cintura: 26, pierna: 10, grosor: 8, abre: 6 },
    esbelto: { cabY: 28, rx: 12.3, ry: 13.4, torTop: 46, torBot: 76, hombros: 32, cintura: 22, pierna: 9, grosor: 8, abre: 6 },
    fornido: { cabY: 25, rx: 13.6, ry: 14, torTop: 43, torBot: 76, hombros: 44, cintura: 34, pierna: 12, grosor: 10, abre: 8 },
    bajo: { cabY: 50, rx: 12.6, ry: 12.8, torTop: 64, torBot: 90, hombros: 30, cintura: 26, pierna: 10, grosor: 8, abre: 4 },
    ancho: { cabY: 46, rx: 14, ry: 13.2, torTop: 60, torBot: 92, hombros: 44, cintura: 40, pierna: 12, grosor: 10, abre: 6 }
  };
  function plantilla(cuerpo) {
    const p = CUERPOS[cuerpo] || CUERPOS.normal;
    const bajo = cuerpo === "bajo" || cuerpo === "ancho";
    const grande = cuerpo === "fornido" || cuerpo === "ancho";
    const t = { cuerpo: CUERPOS[cuerpo] ? cuerpo : "normal", bajo, grande, W, H, cx: 63, suelo: SUELO };
    t.cabX = 64; t.cabY = p.cabY; t.cabRx = p.rx; t.cabRy = p.ry;
    t.ojoY = t.cabY + 2; t.bocaY = t.ojoY + 8;
    t.ojo1 = t.cabX + 1; t.ojo2 = t.cabX + 9;
    t.narizX = Math.round(t.cabX + t.cabRx + 0.6);
    t.torTop = p.torTop; t.torBot = p.torBot; t.pierTop = t.torBot + 2;
    t.torL = t.cx - Math.floor(p.hombros / 2); t.torR = t.torL + p.hombros - 1;
    t.wL = t.cx - Math.floor(p.cintura / 2); t.wR = t.wL + p.cintura - 1;
    t.grosor = p.grosor; t.pierna = p.pierna; t.abre = p.abre;
    t.hombro = [t.torR - 4, t.torTop + 6];
    t.codo = [t.torR + 2, t.torTop + (bajo ? 14 : 18)];
    t.mano = [t.torR + 10, t.torTop + (bajo ? 20 : 26)];
    t.hombroAtras = [t.torL + 6, t.torTop + 6];
    t.manoAtras = [t.torL, t.torBot + (bajo ? 0 : 2)];
    t.caderaAtras = t.cx - p.abre; t.caderaDelante = t.cx + p.abre;
    t.pieAtras = t.caderaAtras - 4; t.pieDelante = t.caderaDelante + 4;
    t.rodillaY = Math.round((t.pierTop + t.suelo) / 2) - 2;
    return t;
  }

  /* ---------- Cabeza y cara ---------- */
  const LUZ_CARA = [-0.45, -0.6, 0.85];
  function capaCabeza(t) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy;
    const c = capa().ell(x, y, rx, ry);
    /* Mofletes y barbilla redondos hacia delante. */
    c.poly([[x - 2, y + 4], [x + rx + 1.1, t.ojoY + 2], [x + rx + 0.9, t.bocaY + 0.8], [x + rx - 1.4, t.bocaY + 4], [x + rx - 4.5, y + ry + 0.9], [x + 4, y + ry + 1.5], [x - 2, y + ry + 0.6]]);
    /* Naricilla redonda. */
    c.rect(t.narizX, t.ojoY + 3, 1, 4).rect(t.narizX + 1, t.ojoY + 4, 1, 2);
    return c;
  }
  function cabeza(g, t, piel) {
    const x = t.cabX, y = t.cabY;
    /* Cuello con la sombra que deja la mandíbula. */
    const cu = capa().rect(x - 5, y + 8, 11, t.torTop - y - 6);
    cu.pintar(g, piel, { plano: 2 });
    for (let j = y + 8; j < t.torTop + 2; j++) pon(g, piel, 1, [x - 5, j], [x - 4, j]);
    for (let i = x - 5; i <= x + 5; i++) pon(g, piel, 1, [i, Math.round(y + t.cabRy + 1)], [i, Math.round(y + t.cabRy + 2)]);
    const c = capaCabeza(t);
    c.pintar(g, piel, { relieve: 11, min: 1, luz: LUZ_CARA, umbrales: [0.985, 0.8, 0.42, 0.02] });
    /* Banda de sombra limpia en la nuca y bajo la barbilla. */
    const [x0, y0, x1, y1] = c.caja();
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      if (!c.tiene(i, j)) continue;
      if (!c.tiene(i, j + 1) || !c.tiene(i, j + 2)) { if (i < x + 9) pon(g, piel, 1, [i, j]); else if (tono(g, i, j) > 2) pon(g, piel, 2, [i, j]); }
    }
    /* Nariz con su brillo y su sombra debajo; brillo del pómulo y del mentón. */
    const nx = t.narizX, oy = t.ojoY;
    pon(g, piel, 4, [nx, oy + 3], [nx, oy + 4], [nx - 1, oy + 3]);
    pon(g, piel, 3, [nx + 1, oy + 4]);
    pon(g, piel, 1, [nx - 1, oy + 6], [nx, oy + 6], [nx - 2, oy + 6]);
    pon(g, piel, 2, [nx + 1, oy + 5], [nx - 1, oy + 5]);
    pon(g, piel, 4, [t.ojo1 - 1, oy + 4], [t.ojo1, oy + 4]);
    pon(g, piel, 3, [x + 9, t.bocaY + 4], [x + 10, t.bocaY + 4], [x + 8, t.bocaY + 4]);
  }
  function oreja(g, t, piel, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "elfo") {
      const c = capa().poly([[x - 4, y + 9], [x - 4, y - 1], [x - 24, y - 13], [x - 14, y + 3]]);
      c.pintar(g, piel, { relieve: 3.2, separar: 2 });
      surco(g, piel, 1, x - 6, y + 4, x - 16, y - 4, piel);
      surco(g, piel, 1, x - 6, y + 5, x - 12, y, piel);
      surco(g, piel, 3, x - 8, y + 1, x - 19, y - 7, piel);
      surco(g, piel, 4, x - 10, y, x - 17, y - 5, piel);
      return;
    }
    if (raza === "gnomo") {
      capa().poly([[x - 4, y + 9], [x - 4, y - 1], [x - 18, y - 6], [x - 12, y + 6]]).pintar(g, piel, { relieve: 3.2, separar: 2 });
      surco(g, piel, 1, x - 6, y + 4, x - 12, y, piel);
      surco(g, piel, 3, x - 7, y + 1, x - 14, y - 3, piel);
      return;
    }
    if (raza === "semiorco") {
      capa().poly([[x - 4, y + 9], [x - 4, y - 1], [x - 16, y - 4], [x - 11, y + 8]]).pintar(g, piel, { relieve: 3.2, separar: 2 });
      surco(g, piel, 1, x - 6, y + 4, x - 10, y + 2, piel);
      surco(g, piel, 3, x - 7, y + 1, x - 12, y - 1, piel);
      /* Aro de hueso en la oreja. */
      pon(g, ORO, 3, [x - 12, y + 1], [x - 13, y + 2]); pon(g, ORO, 4, [x - 12, y]); pon(g, ORO, 1, [x - 13, y + 3], [x - 12, y + 3]);
      return;
    }
    capa().ell(x - 6, y + 3, 3.8, 5.6).pintar(g, piel, { relieve: 3, separar: 2 });
    /* Pabellón en «C» con su sombra y el lóbulo iluminado. */
    pon(g, piel, 1, [x - 6, y + 1], [x - 7, y + 2], [x - 7, y + 3], [x - 7, y + 4], [x - 6, y + 5], [x - 5, y + 5]);
    pon(g, piel, 2, [x - 6, y + 2], [x - 6, y + 3], [x - 6, y + 4]);
    pon(g, piel, 3, [x - 8, y - 1], [x - 9, y + 1], [x - 7, y + 7]);
    pon(g, piel, 4, [x - 8, y]);
  }

  /* Ojos, cejas y boca dibujados a mano (letras = colores):
     K párpado y pestaña, W blanco, H brillo, I iris, L iris claro, P pupila, s sombra de la piel. */
  const OJO = {
    normal: { cerca: [".KKKK.", "KWHHIK", "KWHPIK", "KWIPPK", ".WLLI.", "..ss.."], lejos: ["KKKK", "WHIK", "WPIK", "IPPK", "LLI."] },
    furia: { cerca: ["KKKKKK", "KWIPPK", ".WIPK.", "..ss.."], lejos: ["KKKK", "WIPK", "IPK."] },
    alegre: { cerca: ["..KK..", ".K..K.", "K....K"], lejos: [".KK.", "K..K"] },
    dolor: { cerca: ["KK....", "s.KK..", "....KK", "s.KK..", "KK...."], lejos: ["..KK", ".K..", "K...", ".K..", "..KK"] }
  };
  const BOCA = {
    normal: ["s....s", ".mmmm.", "..ll.."],
    alegre: ["s........s", "KKKKKKKKKK", ".KTTTTTTK.", "..KMMMMK..", "...KRRK...", "....KK...."],
    furia: [".KKKKKKKK.", "KTTtTTtTTK", "KTTtTTtTTK", ".KKKKKKKK."],
    dolor: ["...KKKKK.", "..KTTTTTK", ".KMMMMMK.", "KRRRRK...", ".KKKK...."]
  };
  const GOTA = [".a..", ".ab.", "abcb", "bccb", ".bb."];
  /* Ceja de dos píxeles de grueso: abajo el tono oscuro, encima el claro. */
  function cejaLinea(g, libre, ceja, cejaC, ram, pts, grueso = 2) {
    for (let p = 0; p < pts.length - 1; p++) {
      const [x0, y0] = pts[p], [x1, y1] = pts[p + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let s = 0; s <= n; s++) {
        const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
        for (let e = 0; e < grueso; e++) if (libre(x, y - e)) g.set(x, y - e, e === grueso - 1 && grueso > 1 ? cejaC : ceja, ram);
      }
    }
  }

  /* Rasgos de la cara. Todo se pinta solo sobre la piel (y la boca también sobre la barba),
     así que lo que se pinte después (yelmos, capuchas, máscaras) los respeta. */
  function cara(g, t, o) {
    const { piel, raza, gesto, iris } = o;
    const y = t.ojoY, a = t.ojo1, b = t.ojo2, by = t.bocaY, x = t.cabX;
    const libre = (i, j) => g.rampa(i, j) === piel || (j >= by - 3 && BARBAS.includes(g.rampa(i, j)));
    const soloPiel = (i, j) => g.rampa(i, j) === piel;
    const sombra = o.sombra;
    const cejaR = o.cejas || piel;
    const ceja = sombra ? piel[0] : cejaR === piel ? piel[1] : cejaR[1];
    const cejaC = sombra ? piel[1] : cejaR === piel ? piel[2] : cejaR[2];
    const tief = raza === "tiefling", orco = raza === "semiorco";
    const ir = iris || IRISES.castano;
    const mapaOjo = {
      K: [OJOS], s: [piel[1], piel],
      W: [tief ? "#ffd27a" : sombra ? piel[3] : BLANCO],
      H: [sombra ? piel[4] : BRILLO],
      I: [tief ? "#ffb63a" : sombra ? mezcla(ir, OJOS, 0.45) : ir],
      L: [tief ? "#ffe9a0" : sombra ? mezcla(ir, OJOS, 0.2) : mezcla(ir, "#ffffff", 0.38)],
      P: [tief ? "#b8461a" : mezcla(ir, OJOS, 0.78)]
    };
    const lengua = piel === R.piel.roja ? R.fuego : R.sangre;
    const mapaBoca = {
      K: [mezcla(piel[0], OJOS, 0.5)], m: [piel[0], piel], l: [piel[3], piel], s: [piel[1], piel],
      T: [R.hueso[4], R.hueso], t: [R.hueso[2], R.hueso], M: [lengua[1], lengua], R: [lengua[3], lengua]
    };
    const rubor = mezcla(piel[3], MEJILLA[2], 0.5), rubor2 = mezcla(piel[3], MEJILLA[3], 0.62);
    const mejilla = fuerte => {
      if (sombra || tief) return;
      const c1 = fuerte ? MEJILLA[2] : rubor, c2 = fuerte ? MEJILLA[3] : rubor2;
      for (const [i, j, c] of [[a - 1, y + 4, c1], [a, y + 4, c2], [a + 1, y + 4, c2], [a + 2, y + 4, c1], [a, y + 5, c1], [a + 1, y + 5, c1], [b + 2, y + 4, c1], [b + 3, y + 4, c1]])
        if (soloPiel(i, j)) g.set(i, j, c, piel);
      if (fuerte && soloPiel(a, y + 4)) g.set(a, y + 4, MEJILLA[4], piel);
    };
    const O = OJO[gesto] || OJO.normal;
    const ojos = () => {
      if (gesto === "furia") { sello(g, a, y - 2, O.cerca, mapaOjo, soloPiel); sello(g, b, y - 2, O.lejos, mapaOjo, soloPiel); }
      else if (gesto === "alegre") { sello(g, a, y - 1, O.cerca, mapaOjo, soloPiel); sello(g, b, y - 1, O.lejos, mapaOjo, soloPiel); }
      else if (gesto === "dolor") { sello(g, a, y - 2, O.cerca, mapaOjo, soloPiel); sello(g, b, y - 2, O.lejos, mapaOjo, soloPiel); }
      else { sello(g, a, y - 3, O.cerca, mapaOjo, soloPiel); sello(g, b, y - 3, O.lejos, mapaOjo, soloPiel); }
    };
    const cejas = (cerca, lejos, gr = 2) => {
      if (orco) { cejaLinea(g, soloPiel, piel[0], piel[1], piel, cerca, 3); cejaLinea(g, soloPiel, piel[0], piel[1], piel, lejos, 3); return; }
      cejaLinea(g, soloPiel, ceja, cejaC, cejaR, cerca, gr); cejaLinea(g, soloPiel, ceja, cejaC, cejaR, lejos, gr);
    };
    ojos();
    if (gesto === "dolor") {
      /* Ojos apretados (> <), cejas de angustia, boca torcida con los dientes y una gota de sudor. */
      cejas([[a - 1, y - 5], [a + 5, y - 8]], [[b - 1, y - 8], [b + 3, y - 5]]);
      pon(g, piel, 1, ...[[a + 6, y - 7], [a + 7, y - 6]].filter(([i, j]) => soloPiel(i, j)));
      sello(g, x + 5, by - 2, BOCA.dolor, mapaBoca, libre);
      const gx = x - 8, gy = y - 9;
      sello(g, gx, gy, GOTA, { a: [SUDOR[4], SUDOR], b: [SUDOR[2], SUDOR], c: [SUDOR[3], SUDOR] }, (i, j) => soloPiel(i, j) || BARBAS.includes(g.rampa(i, j)));
    } else if (gesto === "alegre") {
      /* Ojos en arco (^ ^), cejas arriba, mofletes sonrosados y sonrisa abierta. */
      cejas([[a - 1, y - 6], [a + 1, y - 8], [a + 5, y - 7]], [[b, y - 8], [b + 3, y - 7]]);
      mejilla(true);
      sello(g, x + 3, by - 3, BOCA.alegre, mapaBoca, libre);
    } else if (gesto === "furia") {
      /* Cejas en V sobre ojos entornados, arruga en la nariz y los dientes apretados. */
      cejas([[a - 1, y - 8], [a + 5, y - 4]], [[b - 1, y - 4], [b + 3, y - 7]], 3);
      pon(g, piel, 1, ...[[t.narizX - 2, y + 1], [t.narizX - 3, y + 2]].filter(([i, j]) => soloPiel(i, j)));
      sello(g, x + 4, by - 2, BOCA.furia, mapaBoca, libre);
    } else {
      cejas([[a - 1, y - 5], [a + 1, y - 6], [a + 5, y - 6]], [[b, y - 6], [b + 3, y - 5]]);
      mejilla(false);
      sello(g, x + 6, by - 1, BOCA.normal, mapaBoca, libre);
    }
    if (orco) {
      /* Colmillos que suben desde la mandíbula. */
      for (const cx of [x + 5, x + 11]) {
        pon(g, R.hueso, 4, [cx, by - 2], [cx, by - 1]); pon(g, R.hueso, 3, [cx + 1, by - 1], [cx, by], [cx + 1, by]); pon(g, R.hueso, 2, [cx + 1, by + 1], [cx, by + 1]);
      }
    }
    if (raza === "gnomo") {
      /* Nariz grande y redonda, con su brillo. */
      const n = capa().ell(t.narizX - 1, y + 4, 3.4, 3);
      n.pintar(g, piel, { relieve: 3, min: 2 });
      pon(g, piel, 4, [t.narizX - 2, y + 2], [t.narizX - 1, y + 2], [t.narizX - 2, y + 3]);
      pon(g, piel, 1, [t.narizX - 4, y + 6], [t.narizX - 3, y + 7], [t.narizX - 2, y + 7]);
    }
  }

  /* ---------- Dracónido: cabeza de reptil ---------- */
  function cabezaDraconido(g, t, piel, gesto) {
    const x = t.cabX, y = t.cabY;
    capa().rect(x - 10, y + 4, 18, t.torTop - y + 2).pintar(g, piel, { relieve: 5, max: 2 });
    /* Placas claras de la garganta. */
    for (let j = y + 13; j <= t.torTop + 1; j += 4) capa().ell(x + 3, j, 4.2, 1.5).pintar(g, R.hueso, { relieve: 1.6, min: 2, max: 3, separar: 2 });
    const c = capa().ell(x - 2, y, 13.2, 13.6);
    c.poly([[x + 2, y - 11], [x + 14, y - 9], [x + 25, y - 3], [x + 26, y + 3], [x + 23, y + 9], [x + 12, y + 13], [x - 2, y + 14]]);
    c.pintar(g, piel, { relieve: 8, luz: LUZ_CARA });
    /* Mandíbula inferior más clara. */
    for (let i = x + 4; i <= x + 26; i++) for (let j = y + 6; j <= y + 14; j++) if (g.rampa(i, j) === piel && tono(g, i, j) >= 2) pon(g, piel, j <= y + 7 ? 4 : 3, [i, j]);
    /* Escamas en «U» al tresbolillo, con su brillo arriba. */
    cada(g, piel, x - 16, y - 14, x + 22, y + 3, (i, j, k) => {
      const fila = Math.floor(j / 4), u = ((i + (fila & 1) * 3) % 6 + 6) % 6, v = ((j % 4) + 4) % 4;
      if (k >= 2 && ((v === 3 && u >= 1 && u <= 4) || (v === 2 && (u === 0 || u === 5)))) pon(g, piel, k - 1, [i, j]);
      else if (k >= 2 && k < 4 && v === 0 && u === 2) pon(g, piel, k + 1, [i, j]);
    });
    /* Cresta de pinchos por la nuca y cuernos hacia atrás. */
    const cr = capa();
    for (let k = 0; k < 3; k++) cr.poly([[x - 10 - k * 2.8, y - 10 + k * 6.8], [x - 21 - k * 2.8, y - 10 + k * 7.2], [x - 13 - k * 2.8, y - 4 + k * 6.8]]);
    cr.pintar(g, piel, { relieve: 2, max: 3, separar: true });
    const cu = capa().curva(x - 4, y - 10, x - 14, y - 20, x - 28, y - 18, 8, 2).curva(x - 8, y - 2, x - 18, y - 8, x - 30, y - 6, 6.4, 2);
    cu.pintar(g, R.hueso, { relieve: 3, separar: true });
    cada(g, R.hueso, x - 32, y - 22, x - 2, y + 2, (i, j, k) => { if (cu.tiene(i, j) && k >= 2 && ((i - Math.round(j * 0.5)) % 5 + 5) % 5 === 0) pon(g, R.hueso, k - 1, [i, j]); });
    /* Arco de la ceja, fosa nasal y la línea de la boca. */
    for (let i = x; i <= x + 11; i++) if (g.rampa(i, y - 8) === piel) pon(g, piel, 1, [i, y - 8]);
    for (let i = x + 2; i <= x + 8; i++) if (g.rampa(i, y - 10) === piel) pon(g, piel, 4, [i, y - 10]);
    pon(g, piel, 0, [x + 21, y - 2], [x + 22, y - 2], [x + 23, y - 1]);
    pon(g, piel, 4, [x + 18, y - 6], [x + 19, y - 6], [x + 20, y - 5]);
    for (let i = x + 6; i <= x + 26; i++) if (g.rampa(i, y + 6) === piel) pon(g, piel, 0, [i, y + 5]);
    pon(g, piel, 0, [x + 4, y + 3], [x + 5, y + 4]);
    const ex = x + 6, ey = y - 4;
    const libre = (i, j) => g.rampa(i, j) === piel || g.rampa(i, j) === R.hueso;
    const mapa = { K: [OJOS], O: [ORO[3], ORO], o: [ORO[2], ORO], H: [BRILLO], P: [OJOS], T: [R.hueso[4], R.hueso], R: [R.sangre[3], R.sangre], F: [R.fuego[3], R.fuego], f: [R.fuego[4], R.fuego] };
    if (gesto === "dolor") {
      sello(g, ex - 2, ey - 2, OJO.dolor.cerca, mapa, libre);
      sello(g, x + 8, y + 4, ["KKKKKKKKKKK", ".KTKKKKKTK.", "..KKRRRKK..", "....KKK...."], mapa, libre);
      sello(g, x - 8, y - 10, GOTA, { a: [SUDOR[4], SUDOR], b: [SUDOR[2], SUDOR], c: [SUDOR[3], SUDOR] }, libre);
    } else if (gesto === "alegre") {
      sello(g, ex - 2, ey - 1, OJO.alegre.cerca, mapa, libre);
      pon(g, MEJILLA, 3, [ex, ey + 4], [ex + 1, ey + 4], [ex + 2, ey + 4]); pon(g, MEJILLA, 2, [ex - 1, ey + 4]);
      sello(g, x + 5, y + 3, ["..................KK", "KTKTKTKTKTKTKTKTKT.", ".KKKKKKKKKKKKKKKK.."], mapa, libre);
    } else if (gesto === "furia") {
      sello(g, ex - 3, ey - 3, ["KK.....", ".KKK...", "..KKKKK", "..FFfK.", "..KFK.."], mapa, libre);
      sello(g, x + 7, y + 4, ["TKTKTKTKTKTKTKTKTK", "KTKTKTKTKTKTKTKTKT"], mapa, libre);
      pon(g, R.fuego, 4, [x + 28, y - 4], [x + 29, y - 5]); pon(g, R.fuego, 3, [x + 28, y - 3], [x + 30, y - 4], [x + 29, y - 6]); pon(g, R.fuego, 2, [x + 31, y - 5], [x + 30, y - 7]);
    } else {
      /* Ojo de reptil: párpado oscuro, iris dorado con brillo y pupila en rendija. */
      sello(g, ex - 2, ey - 2, [".KKKK.", "KHOPOK", "KOOPOK", "KooPoK", ".KKKK."], mapa, libre);
    }
  }

  /* ---------- Pelo y barba ---------- */
  /* Mechones: separaciones finas que salen de la coronilla y un reflejo en arco, partido en hebras, arriba a la izquierda. */
  function texturaPelo(g, ram, cx, cy, x0, y0, x1, y1, r0 = 6, r1 = 12) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const ang = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
      const banda = ((ang * 3.4 + d * 0.035) % 1 + 1) % 1;
      if (k >= 2 && banda < 0.17 && d > 4) g.set(x, y, ram[k - 1], ram);
      else if (k >= 2 && d > r0 && d < r1 && ang < -0.5 && ang > -2.8 && banda > 0.3 && banda < 0.9) {
        const centro = banda > 0.48 && banda < 0.72 && d > r0 + 1.5 && d < r1 - 2;
        g.set(x, y, ram[Math.min(4, k + (centro ? 2 : 1))], ram);
      }
    });
  }
  function pelo(g, t, ram, peinado, raza, soloCabeza) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy;
    if (peinado === "rapado") {
      /* Rapado: sombra uniforme del pelo corto sobre el cráneo, con el nacimiento del pelo partido. */
      const piel = g.rampa(x, y - 8);
      if (!piel) return;
      cada(g, piel, x - 18, y - 18, x + 8, y + 6, (i, j, k) => {
        const borde = t.ojoY - 8 - (i > x + 2 ? 2 : 0) + (i < x - 6 ? Math.min(12, (x - 6 - i) * 2) : 0);
        if (j < borde || (j === borde && (i & 1))) g.set(i, j, ram[k >= 4 ? 4 : k >= 3 ? 3 : k === 2 ? 2 : 1], ram);
      });
      return;
    }
    const c = capa().ell(x - 1, y - 2, rx + 2.4, ry + 0.8);
    /* Flequillo hasta la frente, en mechones con punta. */
    const PUNTAS = [0, 1, 2, 3, 2, 1];
    const frente = i => t.ojoY - 9 - (i >= x + 7 ? 1 : 0) - (i >= x + 11 ? 2 : 0) + PUNTAS[((i - x) % 6 + 6) % 6];
    for (let j = t.ojoY - 14; j < Math.min(H, y + 24); j++) for (let i = x - 1; i < Math.min(W, x + 26); i++) if (j >= frente(i)) c.off(i, j);
    /* Patilla delante de la oreja. */
    c.rect(x - 4, t.ojoY - 9, 3, 9).off(x - 2, t.ojoY - 1).off(x - 2, t.ojoY - 2);
    c.borrarDesde(y + 10);
    c.rect(x - 17, y + 2, 9, 8); // nuca
    for (let i = x - 16; i <= x - 8; i += 4) c.ell(i + 1, y + 10, 1.6, 1.4);
    if (peinado === "corto") c.poly([[x - 3, y - ry - 1], [x + 1, y - ry - 6], [x + 4, y - ry - 1]]); // remolino de la coronilla
    if (peinado === "largo") c.poly([[x - 18, y - 2], [x - 2, y], [x - 2, y + 10], [x - 4, t.torTop + 6], [x - 10, t.torTop + 15], [x - 16, t.torTop + 12], [x - 21, t.torTop + 13], [x - 23, t.torTop]]);
    if (peinado === "recogido") c.ell(x - 18, y - 10, 6.8, 6.4);
    if (peinado === "rizado") {
      c.ell(x - 2, y - 8, rx + 5.2, 10.4);
      c.ell(x - 15, y + 3, 6.8, 8);
      for (let j = t.ojoY - 14; j < Math.min(H, y + 24); j++) for (let i = x - 1; i < Math.min(W, x + 26); i++) if (j >= t.ojoY - 7 - (i >= x + 10 ? 2 : 0)) c.off(i, j);
      c.rect(x - 4, t.ojoY - 9, 3, 8);
    }
    if (raza === "elfo" || raza === "gnomo" || raza === "satiro" || raza === "semiorco") c.quitarRect(x - 11, y - 2, 7, 9);
    if (soloCabeza) c.recortar(capa().ell(t.cabX, t.cabY, t.cabRx, t.cabRy));
    c.pintar(g, ram, { relieve: 7 });
    if (peinado === "rizado") {
      /* Rizos: bultos redondos que atrapan la luz, cada uno con su espiral. */
      const rizos = [[x - 14, y - 14], [x - 6, y - 19], [x + 4, y - 18], [x + 12, y - 13], [x + 15, y - 6], [x - 19, y - 6], [x - 19, y + 4], [x - 12, y - 5], [x - 2, y - 11], [x + 7, y - 9], [x - 14, y + 9], [x - 8, y + 3]];
      for (const [i, j] of rizos) {
        const r = capa().ell(i, j, 4.2, 3.8).recortar(c);
        if (r.vacia()) continue;
        r.pintar(g, ram, { relieve: 3.6, min: 1, separar: 2 });
        pon(g, ram, 1, [i + 1, j + 1], [i, j + 1]);
        if (j < y) pon(g, ram, 4, [i - 2, j - 2], [i - 1, j - 2]);
      }
    } else texturaPelo(g, ram, x - 2, y - 14, x - 28, y - 22, x + 18, t.torTop + 18, 6, 13);
    if (peinado === "recogido" && !soloCabeza) {
      /* Coleta que cae desde el moño, con su lazo granate. */
      const co = capa().curva(x - 20, y - 4, x - 29, y + 7, x - 22, y + 19, 7.2, 3);
      co.pintar(g, ram, { relieve: 3.2, separar: 2 });
      surco(g, ram, 1, x - 22, y - 1, x - 25, y + 11, ram);
      surco(g, ram, 3, x - 24, y, x - 26, y + 6, ram);
      surco(g, ram, 1, x - 20, y + 4, x - 21, y + 15, ram);
      const G = R.tela.granate;
      const lazo = capa().ell(x - 23, y - 6, 2.6, 2).ell(x - 17, y - 6, 2.6, 2);
      lazo.pintar(g, G, { relieve: 1.6, min: 1, separar: true });
      capa().ell(x - 20, y - 5.5, 1.5, 1.6).pintar(g, G, { relieve: 1, min: 2 });
      pon(g, G, 4, [x - 24, y - 7], [x - 18, y - 7]);
      pon(g, G, 2, [x - 21, y - 3], [x - 22, y - 2], [x - 19, y - 3], [x - 18, y - 2]);
    }
    if (peinado === "largo" && !soloCabeza) for (let i = x - 20; i <= x - 4; i += 4) surco(g, ram, 1, i, y + 4, i - 1, t.torTop + 12, ram);
  }
  function barba(g, t, ram, larga) {
    const x = t.cabX, y = t.ojoY, by = t.bocaY;
    const c = capa().poly([[x - 4, y + 1], [x, y + 6], [x + 6, by - 3], [x + 17, by - 3], [x + 17, by + 3], [x + 12, by + 8], [x + 2, by + 7], [x - 5, y + 7]]);
    if (larga) c.poly([[x - 6, by - 2], [x + 16, by], [x + 15, t.torTop + 12], [x + 8, t.torTop + 22], [x + 2, t.torTop + 18], [x - 4, t.torTop + 10]]);
    c.pintar(g, ram, { relieve: 5.6, separar: 2 });
    /* Mechones verticales que ondulan, en grupos de cuatro píxeles. */
    const [x0, y0, x1, y1] = c.caja();
    cada(g, ram, x0, by, x1, y1, (i, j, k) => {
      if (!c.tiene(i, j)) return;
      const f = ((i + ((j >> 2) & 1) * 2) % 4 + 4) % 4;
      if (k >= 2 && f === 0) g.set(i, j, ram[k - 1], ram);
      else if (k >= 2 && k < 4 && f === 2 && (j & 3) === 1) g.set(i, j, ram[k + 1], ram);
    });
    /* Bigote en dos alas con su brillo. */
    const bi = capa().ell(x + 8, by - 2, 4.6, 1.8).ell(x + 14, by - 2, 3.4, 1.6);
    bi.pintar(g, ram, { relieve: 2, min: 2, separar: 2 });
    pon(g, ram, 4, [x + 6, by - 3], [x + 7, by - 3], [x + 13, by - 3]);
    pon(g, ram, 1, [x + 11, by - 2], [x + 11, by - 1]);
    if (larga) {
      /* Trenza central con dos anillas de oro. */
      for (let j = by + 3; j < t.torTop + 19; j += 3) { pon(g, ram, 1, [x + 6, j], [x + 7, j + 1]); pon(g, ram, 3, [x + 8, j], [x + 9, j + 1]); pon(g, ram, 4, [x + 9, j]); }
      for (const ty of [t.torTop + 6, t.torTop + 15]) {
        capa().rect(x + 5, ty, 6, 3).pintar(g, ORO, { relieve: 1.4, min: 1, separar: true });
        pon(g, ORO, 4, [x + 5, ty], [x + 6, ty]); pon(g, ORO, 1, [x + 5, ty + 2], [x + 10, ty + 2]);
      }
    }
  }

  /* ---------- Cuernos y colas ---------- */
  function cuernos(g, t, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "tiefling") {
      const N = R.pelo.negro;
      const a = t.bajo ? 30 : 26;
      const c = capa().curva(x + 2, y - 12, x, y - a, x - 16, y - a + 1, 8.4, 2);
      c.curva(x - 8, y - 12, x - 10, y - a + 6, x - 22, y - a + 8, 6.8, 2);
      c.pintar(g, N, { relieve: 3.6, min: 2, separar: true });
      /* Anillos del cuerno y brillo. */
      cada(g, N, x - 26, y - a - 4, x + 8, y - 10, (i, j, k) => { if (c.tiene(i, j) && k >= 3 && ((i + j * 2) % 6 + 6) % 6 === 0) pon(g, N, 2, [i, j]); });
      pon(g, N, 4, [x, y - a + 8], [x - 1, y - a + 7], [x - 2, y - a + 5], [x - 10, y - a + 8], [x - 11, y - a + 9]);
    }
    if (raza === "satiro") {
      const c = capa().curva(x + 2, y - 12, x + 2, y - 26, x - 8, y - 26, 6.8, 2.8).curva(x - 6, y - 12, x - 8, y - 20, x - 16, y - 20, 5.2, 2.4);
      c.pintar(g, R.hueso, { relieve: 2.8, min: 1, separar: true });
      cada(g, R.hueso, x - 18, y - 30, x + 8, y - 10, (i, j, k) => { if (c.tiene(i, j) && k >= 3 && ((j + Math.round(i * 0.3)) % 3 + 3) % 3 === 0) pon(g, R.hueso, 2, [i, j]); });
    }
  }
  function cola(g, t, piel, raza) {
    if (raza === "tiefling") {
      capa().curva(t.torL + 4, t.torBot - 2, t.torL - 26, t.torBot + 24, t.torL - 24, t.torBot - 8, 6.4, 3.6).pintar(g, piel, { relieve: 2.8 });
      const px = t.torL - 24, py = t.torBot - 10;
      capa().poly([[px - 6, py + 3], [px, py - 10], [px + 6, py + 3], [px, py + 1]]).pintar(g, piel, { relieve: 2.4, min: 2 });
      pon(g, piel, 4, [px - 2, py - 4], [px - 1, py - 6], [px - 3, py - 2]);
      pon(g, piel, 1, [px + 1, py - 2], [px + 2, py]);
    }
    if (raza === "draconido") {
      const c = capa().curva(t.torL + 8, t.torBot - 8, t.torL - 8, t.suelo + 2, t.torL - 30, t.suelo - 6, 17, 4.4);
      c.borrarDesde(t.suelo + 1);
      c.pintar(g, piel, { relieve: 6 });
      /* Panza de placas claras por debajo y escamas por encima. */
      const [x0, y0, x1, y1] = c.caja();
      for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++)
        if (c.tiene(i, j) && !c.tiene(i, j + 1)) {
          pon(g, R.hueso, i % 5 === 0 ? 1 : 2, [i, j]);
          if (c.tiene(i, j - 1)) pon(g, R.hueso, i % 5 === 0 ? 2 : 3, [i, j - 1]);
          if (c.tiene(i, j - 2) && i % 5 !== 0) pon(g, R.hueso, 3, [i, j - 2]);
        }
      cada(g, piel, x0, y0, x1, y1, (i, j, k) => {
        const fila = Math.floor(j / 4), u = ((i + (fila & 1) * 3) % 6 + 6) % 6, v = ((j % 4) + 4) % 4;
        if (k >= 2 && v === 3 && u >= 1 && u <= 4) pon(g, piel, k - 1, [i, j]);
        else if (k >= 2 && k < 4 && v === 0 && u === 2) pon(g, piel, k + 1, [i, j]);
      });
    }
  }

  /* ---------- Brazos, manos y piernas ---------- */
  function puno(g, mx, my, ram, tapa) {
    /* Puño cerrado alrededor de un mango vertical: cuatro dedos con sus nudillos y el pulgar encima. */
    const c = capa().ell(mx - 0.5, my + 1, 4.4, 5.2);
    c.pintar(g, ram, { relieve: 3.2, separar: true });
    const X = Math.round(mx), Y = Math.round(my);
    for (const j of [Y, Y + 3]) for (let i = X; i <= X + 3; i++) if (c.tiene(i, j)) pon(g, ram, 1, [i, j]);
    pon(g, ram, 3, [X + 3, Y - 1], [X + 3, Y + 2], [X + 3, Y + 5]);
    pon(g, ram, 2, [X + 4, Y + 1], [X + 4, Y + 4]);
    capa().ell(mx + 0.5, my - 3.6, 3.2, 1.9).pintar(g, ram, { relieve: 1.8, separar: true });
    pon(g, ram, 4, [X - 2, Y - 5], [X - 1, Y - 5], [X - 3, Y - 4]);
    pon(g, ram, 1, [X - 1, Y - 2], [X, Y - 2], [X + 1, Y - 2]);
    if (tapa) pon(g, tapa, 2, [X - 4, Y + 2], [X - 4, Y + 3], [X - 4, Y + 4]);
  }
  function mano(g, x, y, ram, sombra) {
    /* Mano abierta colgando, con el pulgar delante y los dedos marcados. */
    const c = capa().ell(x + 1, y + 3, 3.6, 3.4).rect(x - 2, y + 5, 6, 4).ell(x + 1, y + 9, 3, 1.4).linea(x + 4.5, y + 2, x + 5.5, y + 6, 2);
    c.pintar(g, ram, { relieve: 2.4, max: sombra ? 2 : 4, separar: true });
    pon(g, ram, 1, [x, y + 7], [x, y + 8], [x + 2, y + 7], [x + 2, y + 8], [x + 4, y + 5]);
    pon(g, ram, sombra ? 2 : 3, [x - 1, y + 1], [x - 1, y + 2]);
  }
  /* manga: { sup, inf, guante, ancha, ribete, brazal } */
  function brazoDelante(g, t, piel, m, conPuno = true) {
    const [hx, hy] = t.hombro, [ex, ey] = t.codo, [mx, my] = t.mano;
    const gr = t.grosor;
    const sup = capa().linea(hx, hy, ex, ey, gr + 2);
    const inf = capa().linea(ex, ey, mx - 2, my - 2, gr + (m.ancha ? 2 : 0));
    sup.pintar(g, m.sup || piel, { relieve: 4.8, separar: true });
    inf.pintar(g, m.inf || piel, { relieve: 4.4, separar: true });
    if (!m.ancha && !m.brazal && (m.inf || piel) === piel) {
      /* Músculo del antebrazo y codo. */
      pon(g, piel, 3, [ex, ey - 2], [ex - 1, ey - 1]); pon(g, piel, 1, [ex + 2, ey + 2], [ex + 3, ey + 2]);
    }
    if (m.ancha) mangaAncha(g, m, [ex, ey], [mx - 2, my - 2]);
    else if ((m.inf || piel) !== piel && m.inf !== m.guante) puno0(g, m.inf, [ex, ey], [mx - 2, my - 2], gr);
    if (m.brazal) brazal(g, m.brazal, inf, [ex, ey], [mx - 2, my - 2], gr);
    if (conPuno) puno(g, mx, my, m.guante || piel);
  }
  /* Bocamanga de tela: un anillo un poco más ancho junto a la muñeca. */
  function puno0(g, ram, E, M, gr) {
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const c = capa().linea(M[0] - ux * 4, M[1] - uy * 4, M[0] - ux * 1, M[1] - uy * 1, gr + 2);
    c.pintar(g, ram, { relieve: 2.2, separar: true });
    surco(g, ram, 4, M[0] - ux * 4 - uy * gr * 0.4, M[1] - uy * 4 + ux * gr * 0.4, M[0] - ux * 4 + uy * gr * 0.6, M[1] - uy * 4 - ux * gr * 0.6, ram);
  }
  /* Brazal de cuero con correas cruzadas y su hebilla. */
  function brazal(g, ram, inf, E, M, gr) {
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const bz = capa().linea(E[0] + ux * 2, E[1] + uy * 2, M[0] - ux * 2, M[1] - uy * 2, gr + 2);
    bz.recortar(inf.copia().unir(capa().linea(E[0], E[1], M[0], M[1], gr + 2))).pintar(g, ram, { relieve: 3, separar: true });
    for (let s = 1; s < 4; s++) {
      const cx = E[0] + ux * (2 + s * (d - 4) / 4), cy = E[1] + uy * (2 + s * (d - 4) / 4);
      surco(g, CUERO2, 1, cx - uy * gr * 0.6, cy + ux * gr * 0.6, cx + uy * gr * 0.6, cy - ux * gr * 0.6, ram);
      surco(g, CUERO2, 2, cx - uy * gr * 0.6 + ux, cy + ux * gr * 0.6 + uy, cx + uy * gr * 0.6 + ux, cy - ux * gr * 0.6 + uy, ram);
    }
    const hx = Math.round(E[0] + ux * d * 0.5 - uy * 2), hy = Math.round(E[1] + uy * d * 0.5 + ux * 2);
    pon(g, ORO, 4, [hx, hy]); pon(g, ORO, 2, [hx + 1, hy + 1]);
  }
  /* Manga ancha de túnica que cae desde el antebrazo, con ribete. */
  function mangaAncha(g, m, E, M) {
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d;
    const cae = 6.4 + Math.abs(ux) * 3.2, bajoY = Math.max(E[1], M[1]);
    const b = capa().poly([[E[0] - 2.4, E[1] - 2], [M[0] - 1, M[1] - 5], [M[0] + 1.2, M[1] + 5], [E[0] + (M[0] - E[0]) * 0.6, bajoY + cae], [E[0] - 3.2, E[1] + 6]]);
    b.pintar(g, m.inf, { relieve: 4.4, separar: true });
    const rib = m.ribete || m.inf;
    const [x0, y0, x1, y1] = b.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!b.tiene(x, y)) continue;
      if (!b.tiene(x, y + 1)) g.set(x, y, rib[m.ribete ? 2 : 1], rib);
      else if (!b.tiene(x, y + 2)) g.set(x, y, rib[m.ribete ? 3 : 1], rib);
      else if (!b.tiene(x, y + 3) && m.ribete) g.set(x, y, rib[4], rib);
    }
    pliegue(g, m.inf, E[0] + 2, E[1] + 2, (E[0] + M[0]) / 2, bajoY + cae - 4);
    pliegue(g, m.inf, E[0] + (M[0] - E[0]) * 0.75, E[1] + 3, M[0] - 1, bajoY + cae - 5);
  }
  function brazoAtras(g, t, piel, m) {
    const [hx, hy] = t.hombroAtras, [mx, my] = t.manoAtras;
    const ex = hx - 4, ey = Math.round((hy + my) / 2);
    capa().linea(hx, hy, ex, ey, t.grosor + 2).pintar(g, m.sup || piel, { relieve: 4, max: 2 });
    capa().linea(ex, ey, mx, my, t.grosor).pintar(g, m.inf || m.sup || piel, { relieve: 4, max: 2 });
    if (m.ancha) capa().poly([[mx - 4, my - 10], [mx + 4, my - 10], [mx + 5, my + 3], [mx - 5, my + 3]]).pintar(g, m.inf, { relieve: 3.2, max: 2 });
    mano(g, mx - 1, my + 1, m.guante || piel, true);
  }

  function pieDesnudo(g, t, x0, piel, peludo, atras, mediano) {
    const s = t.suelo, l = mediano ? 17 : 12;
    const c = capa().ell(x0 + l / 2 - 1, s - 2.2, l / 2, 2.8).rect(x0 - 1, s - 6, 9, 5);
    c.borrarDesde(s + 1);
    c.pintar(g, piel, { relieve: 2.8, max: atras ? 2 : 4, separar: true });
    for (let i = x0 - 1; i < x0 + l; i++) if (c.tiene(i, s)) pon(g, piel, 1, [i, s]);
    for (let k = 0; k < 3; k++) pon(g, piel, 1, [x0 + l - 4 - k * 3, s - 1], [x0 + l - 4 - k * 3, s]);
    pon(g, piel, atras ? 2 : 4, [x0 + l - 5, s - 3], [x0 + l - 4, s - 3]);
    if (peludo) {
      /* Pies de mediano: mechones de pelo encima, con su brillo. */
      for (let i = x0 - 1; i <= x0 + 9; i++) {
        const k = (i - x0) % 3;
        pon(g, peludo, k === 0 ? 1 : 2, [i, s - 6]);
        if (k !== 2) pon(g, peludo, atras ? 2 : 3, [i, s - 5]);
        if (k === 1) pon(g, peludo, 2, [i, s - 4]);
      }
      pon(g, peludo, atras ? 2 : 4, [x0, s - 6], [x0 + 3, s - 6]);
    }
  }
  /* Bota: caña con vuelta, empeine redondeado, suela de dos tonos, costura y una correa con hebilla. */
  function bota(g, t, xc, ram, atras, alto = 16, puntera = null, hebilla = ORO) {
    const s = t.suelo, gw = t.pierna;
    const x0 = Math.round(xc - gw / 2);
    const c = capa().rect(x0, s - alto, gw + 2, alto - 2).rect(x0, s - 6, gw + 4, 6).ell(x0 + gw + 4, s - 2.6, 3.4, 2.6);
    c.borrarDesde(s + 1);
    c.pintar(g, ram, { relieve: 3.6, max: atras ? 2 : 4, separar: true });
    /* Vuelta de la caña. */
    const vu = capa().rect(x0 - 2, s - alto - 2, gw + 6, 4);
    vu.pintar(g, ram, { relieve: 2, max: atras ? 2 : 4, separar: true });
    for (let i = x0 - 2; i <= x0 + gw + 3; i++) { pon(g, ram, atras ? 2 : 3, [i, s - alto - 2]); pon(g, ram, 1, [i, s - alto + 1]); }
    /* Suela y tacón. */
    for (let i = x0 - 1; i <= x0 + gw + 8; i++) {
      if (g.rampa(i, s) === ram || (c.tiene(i, s - 1) && !g.get(i, s))) pon(g, CUERO2, 0, [i, s]);
      if (c.tiene(i, s - 1)) pon(g, CUERO2, atras ? 1 : 2, [i, s - 1]);
    }
    pon(g, CUERO2, 0, [x0, s - 1], [x0 + 1, s - 1], [x0 + 2, s - 1]);
    /* Brillo del empeine y arruga del tobillo. */
    pon(g, ram, atras ? 2 : 4, [x0 + gw + 3, s - 5], [x0 + gw + 4, s - 5], [x0 + gw + 5, s - 4]);
    surco(g, ram, 1, x0 + 2, s - 7, x0 + gw, s - 8, ram);
    costura(g, ram, x0 + gw, s - alto + 3, x0 + gw, s - 9, atras ? 0 : 1);
    if (ram === PLACA) {
      /* Escarpe de placas: láminas con su brillo y remaches. */
      for (let j = s - alto + 4; j < s - 7; j += 4) for (let i = x0; i <= x0 + gw + 1; i++) if (g.rampa(i, j) === ram) { pon(g, ram, 1, [i, j]); if (g.rampa(i, j + 1) === ram) matiz(g, i, j + 1, 1); }
      if (!atras) remache(g, ORO, x0 + 1, s - alto + 5);
    }
    if (puntera) { capa().ell(x0 + gw + 5, s - 3, 2.4, 2.2).pintar(g, puntera, { relieve: 1.6, min: 2, max: atras ? 3 : 4 }); }
    /* Correa del tobillo con hebilla. */
    if (alto >= 14 && ram !== PLACA) {
      const cy = s - 10;
      for (let i = x0; i <= x0 + gw + 1; i++) { pon(g, CUERO2, atras ? 0 : 1, [i, cy]); pon(g, CUERO2, atras ? 1 : 2, [i, cy + 1]); }
      if (!atras) {
        const hx = x0 + gw - 2;
        pon(g, hebilla, 4, [hx, cy - 1], [hx + 1, cy - 1]); pon(g, hebilla, 3, [hx, cy], [hx, cy + 1]); pon(g, hebilla, 2, [hx + 2, cy], [hx + 2, cy + 1]);
        pon(g, hebilla, 1, [hx, cy + 2], [hx + 1, cy + 2], [hx + 2, cy + 2], [hx + 2, cy - 1]);
        pon(g, CUERO2, 0, [hx + 1, cy], [hx + 1, cy + 1]);
      }
    }
  }
  /* o: { ramPierna, ramBota, descalzo, alto, rodillera, puntera, zapato } */
  function piernas(g, t, piel, raza, ramPelo, o) {
    const { pierTop, suelo, pierna: gw } = t;
    const xa = t.caderaAtras, xd = t.caderaDelante, fa = t.pieAtras, fd = t.pieDelante, ky = t.rodillaY;
    if (raza === "satiro") {
      /* Patas de cabra: cadera peluda, corvejón hacia atrás y pezuñas partidas. */
      capa().ell(t.cx, pierTop + 4, (t.wR - t.wL) / 2 + 3, 8).pintar(g, ramPelo, { relieve: 6 });
      const pata = (x, f, atras) => {
        const kx = x + 4 + (atras ? t.kAx || 0 : t.kDx || 0);
        const c = capa().linea(x, pierTop + 4, kx, ky + 2, gw + 3).linea(kx, ky + 2, f - 2, suelo - 10, gw + 1).linea(f - 2, suelo - 10, f, suelo - 4, gw - 1);
        c.pintar(g, ramPelo, { relieve: 4, max: atras ? 2 : 4, separar: true });
        /* Pelo en mechones: trazos cortos inclinados. */
        cada(g, ramPelo, x - 12, pierTop + 2, x + 14, suelo - 4, (i, j, k) => {
          if (!c.tiene(i, j)) return;
          const u = ((i + j * 2 + ((j >> 3) & 1) * 3) % 7 + 7) % 7;
          if (k >= 2 && u === 0) g.set(i, j, ramPelo[k - 1], ramPelo);
          else if (k >= 2 && k < 4 && u === 2 && (j & 1)) g.set(i, j, ramPelo[k + 1], ramPelo);
        });
        const pz = capa().rect(f - 4, suelo - 3, 10, 4).ell(f + 5, suelo - 1, 2, 1.6);
        pz.borrarDesde(suelo + 1);
        pz.pintar(g, R.pelo.negro, { relieve: 2, min: 2, max: atras ? 3 : 4, separar: true });
        pon(g, R.pelo.negro, 0, [f + 2, suelo - 2], [f + 2, suelo - 1], [f + 2, suelo]);
        pon(g, R.pelo.negro, 4, [f - 3, suelo - 3], [f - 2, suelo - 3], [f + 3, suelo - 3]);
      };
      pata(xa - 2, fa, true); pata(xd, fd, false);
      return;
    }
    const rp = o.ramPierna || piel;
    /* Muslo, rodilla y pantorrilla: la de atrás en sombra. */
    const pierna = (x, f, dk) => { const kx = (x + f) / 2 + dk; return capa().linea(x, pierTop - 2, kx, ky, gw + 2).linea(kx, ky, f, suelo - 6, gw).ell(kx - 0.6 + (dk ? (f - kx) * 0.3 : 0), ky + 8 + (dk ? 1 : 0), gw / 2 + 0.4, 4.4); };
    const kA = t.kAx || 0, kD = t.kDx || 0;
    const atras = pierna(xa, fa, kA), delante = pierna(xd, fd, kD);
    atras.pintar(g, rp, { relieve: 4.4, max: 2 });
    delante.pintar(g, rp, { relieve: 4.8, separar: true });
    const rx = Math.round((xd + fd) / 2 + kD);
    if (rp !== piel) {
      /* Arrugas de la tela en la corva y el tobillo, y la costura del costado. */
      pliegue(g, rp, rx + 2, ky - 2, rx - 2, ky + 2);
      pliegue(g, rp, rx + 3, ky + 1, rx, ky + 4);
      surco(g, rp, 1, fd - 2, suelo - 18, fd + 2, suelo - 20, rp);
      if (rp !== MALLA) costura(g, rp, xd + 2, pierTop + 2, rx + 2, ky - 4, -1);
    } else {
      pon(g, piel, 3, [rx, ky], [rx - 1, ky - 1]); pon(g, piel, 4, [rx - 1, ky]);
      pon(g, piel, 1, [rx + 2, ky + 10], [rx + 2, ky + 11]);
    }
    if (o.rodillera) {
      capa().ell((xd + fd) / 2 + kD + 0.4, ky, gw / 2 + 1.2, 3.6).pintar(g, o.rodillera, { relieve: 2.8, separar: true });
      destello(g, o.rodillera, rx - 2, ky - 2);
      remache(g, ORO, rx + 2, ky + 1);
      capa().ell((xa + fa) / 2 + kA, ky, gw / 2 + 0.4, 3.2).pintar(g, o.rodillera, { relieve: 2, max: 2, separar: true });
    }
    if (o.descalzo || !o.ramBota) {
      const med = raza === "mediano";
      const peludo = med ? ramPelo : null;
      pieDesnudo(g, t, Math.round(fa - gw / 2) - 2, piel, peludo, true, med);
      pieDesnudo(g, t, Math.round(fd - gw / 2), piel, peludo, false, med);
      return;
    }
    bota(g, t, fa - 2, o.ramBota, true, o.alto || 16, o.puntera);
    bota(g, t, fd, o.ramBota, false, o.alto || 16, o.puntera);
  }

  /* ---------- Formas de la ropa ---------- */
  /* Torso en V redondeado: hombros anchos, pecho hacia delante y cintura estrecha. */
  const torso = t => capa().poly([
    [t.torL + 4, t.torTop - 1], [t.torR - 4, t.torTop - 1], [t.torR, t.torTop + 2], [t.torR + 1.5, t.torTop + 7], [t.torR + 1, t.torTop + 13],
    [t.wR + 1, t.torBot + 1], [t.wL - 1, t.torBot + 1], [t.torL - 1, t.torTop + 13], [t.torL - 1.5, t.torTop + 7], [t.torL, t.torTop + 2]
  ]);
  const falda = (t, largo, vuelo) => capa().poly([[t.wL - 1, t.torBot - 3], [t.wR + 1, t.torBot - 3], [t.wR + 3 + vuelo + (t.faldaD || 0), t.pierTop + largo + 1 + (t.faldaDy || 0)], [t.wL - 3 - vuelo + (t.faldaI || 0), t.pierTop + largo + 1 + (t.faldaIy || 0)]]);
  function cinturon(g, t, ram = CUERO, hebilla = ORO, y = t.torBot - 4, ancho = 5) {
    for (let x = t.wL - 4; x <= t.wR + 4; x++) for (let j = 0; j < ancho; j++) if (g.get(x, y + j)) g.set(x, y + j, ram[j === 0 ? 3 : j === ancho - 1 ? 1 : 2], ram);
    for (let x = t.wL - 4; x <= t.wR + 4; x++) if (g.get(x, y + ancho) && g.rampa(x, y + ancho) !== ram) matiz(g, x, y + ancho, -1);
    /* Pespunte claro arriba y abajo, y los agujeros de la correa. */
    costura(g, ram, t.wL - 2, y + 1, t.wR + 2, y + 1, 1);
    if (ancho > 4) costura(g, ram, t.wL - 1, y + ancho - 2, t.wR + 2, y + ancho - 2, 1);
    for (let x = t.wL + 1; x < t.cx - 1; x += 5) if (g.rampa(x, y + 2) === ram) pon(g, ram, 0, [x, y + 2]);
    /* Hebilla: marco de metal con su brillo, el hueco y el pasador. */
    const hx = t.cx + 3;
    const hb = capa().rect(hx, y - 1, 7, ancho + 2);
    hb.pintar(g, hebilla, { relieve: 1.6, min: 2, separar: true });
    for (let j = y + 1; j < y + ancho - 1; j++) for (let i = hx + 2; i <= hx + 4; i++) pon(g, ram, 1, [i, j]);
    for (let i = hx + 2; i <= hx + 6; i++) pon(g, hebilla, 3, [i, y + Math.floor(ancho / 2)]);
    pon(g, hebilla, 4, [hx, y - 1], [hx + 1, y - 1], [hx, y]);
    g.set(hx + 1, y, BRILLO, hebilla);
    pon(g, hebilla, 1, [hx + 6, y + ancho], [hx + 5, y + ancho]);
    /* Cabo suelto de la correa que cuelga. */
    pon(g, ram, 1, [hx + 7, y + 2], [hx + 8, y + 2], [hx + 9, y + 3], [hx + 9, y + 4], [hx + 9, y + 5]);
    pon(g, ram, 3, [hx + 7, y + 1], [hx + 8, y + 1], [hx + 10, y + 4], [hx + 10, y + 5]);
    pon(g, ram, 0, [hx + 10, y + 6], [hx + 9, y + 6]);
  }
  /* Bolsita de cuero con solapa y botón. */
  function bolsita(g, x, y, ram = CUERO, boton = ORO, rx = 4.4, ry = 4.8) {
    const b = capa().ell(x, y + 1, rx, ry);
    b.pintar(g, ram, { relieve: 3, separar: true });
    const s = capa().ell(x, y - ry * 0.45, rx + 0.6, ry * 0.55).recortar(capa().rect(0, 0, W, Math.round(y + 1)));
    s.pintar(g, ram, { relieve: 1.8, min: 2, separar: true });
    for (let i = Math.round(x - rx); i <= Math.round(x + rx); i++) if (s.tiene(i, Math.round(y)) && !s.tiene(i, Math.round(y) + 1)) pon(g, ram, 1, [i, Math.round(y) + 1]);
    costura(g, ram, x - rx + 1.5, y + ry - 0.5, x + rx - 1.5, y + ry - 0.5, 1);
    pon(g, boton, 4, [Math.round(x), Math.round(y)]); pon(g, boton, 2, [Math.round(x) + 1, Math.round(y)], [Math.round(x), Math.round(y) + 1]);
  }
  function capucha(t, punta) {
    const x = t.cabX, y = t.cabY;
    const c = capa().ell(x - 1.6, y - 1.2, t.cabRx + 4, t.cabRy + 3.2);
    c.poly([[x - 20, y], [x - 2, y + 12], [t.torL + 8, t.torTop + 8], [t.torL - 6, t.torTop + 8], [x - 24, t.torTop - 2]]);
    c.poly([[x - 8, y + 10], [x + 14, y + 13], [t.torR - 2, t.torTop + 7], [t.torL + 2, t.torTop + 7]]);
    if (punta) c.poly([[x - 4, y - 17.2], [x - 14, y - 16.8], [x - 32, y - 6], [x - 16, y - 1]]);
    const hueco = capa().ell(x + 10, t.ojoY + 3, 11.2, 12.8).rect(x + 14, t.ojoY - 6, 12, 22);
    c.restar(hueco);
    return c;
  }
  function pintarCapucha(g, t, ram, piel, punta) {
    const c = capucha(t, punta);
    c.pintar(g, ram, { relieve: 7, separar: true });
    /* Borde de la abertura iluminado (dobladillo), y la sombra que cae sobre la cara. */
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      const cara = (i, j) => !c.tiene(i, j) && g.rampa(i, j) === piel;
      if (cara(x + 1, y) || (cara(x, y + 1) && y < t.ojoY)) g.set(x, y, ram[3], ram);
      else if (cara(x + 2, y) || (cara(x, y + 2) && y < t.ojoY)) g.set(x, y, ram[4], ram);
      else if (cara(x + 3, y)) g.set(x, y, ram[1], ram);
    }
    cada(g, piel, t.cabX - 4, t.ojoY - 12, t.cabX + 24, t.bocaY + 8, (x, y, k) => {
      let cerca = false;
      for (let e = 1; e <= 3 && !cerca; e++) cerca = c.tiene(x - e, y) || c.tiene(x, y - e);
      if (cerca || y < t.ojoY - 3) g.set(x, y, piel[Math.max(0, k - 1)], piel);
    });
    /* Pliegues de la caída. */
    pliegue(g, ram, t.cabX - 14, t.cabY + 6, t.cabX - 20, t.torTop + 4);
    pliegue(g, ram, t.cabX - 6, t.cabY + 12, t.cabX - 10, t.torTop + 6);
    pliegue(g, ram, t.cabX + 2, t.cabY + 14, t.cabX, t.torTop + 6);
    surco(g, ram, 1, t.cabX - 10, t.cabY - 12, t.cabX - 16, t.cabY - 2, ram);
    surco(g, ram, 3, t.cabX - 11, t.cabY - 12, t.cabX - 17, t.cabY - 2, ram);
    return c;
  }

  /* ---------- Lo que va a la espalda ---------- */
  function capaEspalda(t, largo, vuelo) {
    const dx = t.capaDx || 0, dy = t.capaDy || 0;
    return capa().poly([[t.torL + 2, t.torTop], [t.torL + 14, t.torTop], [t.torL + 6 + dx / 2, t.pierTop + largo + dy / 2], [t.torL - vuelo / 2 + dx * 0.75, t.pierTop + largo + 1 + dy * 0.8], [t.torL - vuelo + dx, t.pierTop + largo - 2 + dy], [t.torL - 6, t.torTop + 10]]);
  }
  function espalda(g, t, clase, tela) {
    if (clase === "explorador") {
      const cp = capaEspalda(t, 20, 16);
      cp.pintar(g, tela, { relieve: 6, max: 3 });
      pliegue(g, tela, t.torL - 2, t.torTop + 14, t.torL - 8, t.pierTop + 16);
      pliegue(g, tela, t.torL + 4, t.torTop + 18, t.torL - 2, t.pierTop + 18);
      penumbra(g, tela, t.torL - 18, t.pierTop, t.torL + 8, t.pierTop + 20, 0.3);
      ribete(g, cp, tela, 2);
      /* Carcaj de cuero con correas de cobre, costura y flechas emplumadas. */
      const q = capa().linea(t.torL + 8, t.torTop - 6, t.torL - 4, t.torBot, 10);
      q.pintar(g, CUERO, { relieve: 4, separar: true });
      for (const [dx, dy] of [[0, 2], [-4, 16], [-6, 26]]) {
        surco(g, ORO, 2, t.torL + 2 + dx, t.torTop + dy + 2, t.torL + 12 + dx, t.torTop + dy - 2, CUERO);
        surco(g, ORO, 3, t.torL + 2 + dx, t.torTop + dy + 1, t.torL + 12 + dx, t.torTop + dy - 3, CUERO);
      }
      costura(g, CUERO, t.torL + 9, t.torTop - 3, t.torL - 1, t.torBot - 2, 1);
      const plumas = [[t.torL + 12, t.torTop - 18, PLUMA], [t.torL + 6, t.torTop - 16, R.tela.granate], [t.torL + 16, t.torTop - 12, PLUMA], [t.torL + 2, t.torTop - 12, R.tela.granate]];
      for (const [px, py, ram] of plumas) {
        surco(g, MADERA, 3, px, py + 6, px - 2, py + 12, null);
        surco(g, MADERA, 1, px + 1, py + 6, px - 1, py + 12, null);
        const pl = capa().poly([[px - 3, py - 3], [px + 1, py - 5], [px + 3, py + 5], [px - 1, py + 7]]);
        pl.pintar(g, ram, { relieve: 2, min: 1, separar: true });
        surco(g, ram, 1, px, py - 3, px + 1, py + 5, ram);
        pon(g, ram, 4, [px - 2, py - 2], [px - 1, py - 3]);
      }
    }
    if (clase === "bardo" || clase === "picaro") {
      const cp = capaEspalda(t, clase === "bardo" ? 10 : 16, 14);
      cp.pintar(g, tela, { relieve: 6, max: 3 });
      pliegue(g, tela, t.torL, t.torTop + 12, t.torL - 6, t.pierTop + 8);
      pliegue(g, tela, t.torL + 4, t.torTop + 18, t.torL, t.pierTop + 10);
      ribete(g, cp, clase === "bardo" ? R.tela.granate : tela, clase === "bardo" ? 3 : 2, clase === "bardo" ? 3 : 2);
    }
    if (clase === "barbaro") {
      /* Piel de lobo colgando por la espalda, con el borde deshilachado. */
      const cp = capa().poly([[t.torL, t.torTop], [t.torL + 12, t.torTop], [t.torL + 4, t.torBot + 6], [t.torL - 12, t.torBot + 2], [t.torL - 6, t.torTop + 8]]);
      const [x0, y0, x1, y1] = cp.caja();
      for (let i = x0; i <= x1; i++) { const corte = (i % 5 + 5) % 5; for (let j = y0; j <= y1; j++) if (cp.tiene(i, j) && !cp.tiene(i, j + 4 - Math.abs(corte - 2))) cp.off(i, j); }
      cp.pintar(g, PELLIZA, { relieve: 6, max: 2 });
      pelaje(g, PELLIZA, x0 - 1, y0, x1 + 1, y1);
    }
  }
  /* Pelaje: mechones cortos en «v» con su brillo. */
  function pelaje(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const u = ((x * 2 + y * 3) % 9 + 9) % 9, v = ((x * 3 - y * 2) % 11 + 11) % 11;
      if (u === 0 && k >= 1) g.set(x, y, ram[Math.max(0, k - 1)], ram);
      else if (v === 0 && k < 4) g.set(x, y, ram[k + 1], ram);
    });
  }

  /* ---------- Ropa de cada clase ---------- */
  const LAUD = matizar(["#2e150c", "#5a2e16", "#8f5426", "#c4823c", "#eab56a"]);
  const LOBO = matizar(["#29242c", "#4a4248", "#72686a", "#a29690", "#d2c8bc"]);
  const CALZAS = matizar(["#26180f", "#422c1c", "#664630", "#8a6646", "#b08a62"]);
  /* Estrella bordada de cuatro puntas. */
  function estrellaBordada(g, borda, x, y, grande) {
    borda(ORO, 4, [x, y]); borda(ORO, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
    if (grande) { borda(ORO, 3, [x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2]); borda(ORO, 2, [x - 3, y], [x + 3, y], [x, y - 3], [x, y + 3]); }
  }
  /* Músculo: bulto con su luz arriba y el borde de abajo y del lado de la sombra hundido. */
  function musculo(g, piel, c, r = 4) {
    c.pintar(g, piel, { relieve: r, min: 2 });
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      if (!c.tiene(x, y + 1)) pon(g, piel, 1, [x, y]);
      else if (!c.tiene(x + 1, y) || !c.tiene(x, y + 2)) pon(g, piel, 2, [x, y]);
    }
  }
  function vestir(g, t, clase, tela, piel) {
    const T = torso(t);
    const { torL, torR, torTop, torBot, pierTop, cx, wL, wR } = t;
    const suelo = t.suelo;
    switch (clase) {
      case "guerrero": {
        /* Cota de malla hasta medio muslo. */
        const F = falda(t, 16, 4);
        F.pintar(g, MALLA, { relieve: 6 });
        malla(g, MALLA, wL - 12, torBot - 4, wR + 12, pierTop + 20);
        ribete(g, F, MALLA, 2);
        /* Peto de placas: gola, arista central, brillo especular, faja inferior con remaches. */
        T.pintar(g, PLACA, { relieve: 10, separar: true });
        for (let x = torL; x <= torR; x++) if (g.rampa(x, torTop + 1) === PLACA) { pon(g, PLACA, 3, [x, torTop]); pon(g, PLACA, 4, [x, torTop + 1]); pon(g, PLACA, 1, [x, torTop + 3]); }
        for (let y = torTop + 5; y <= torBot - 14; y++) { pon(g, PLACA, 4, [cx + 4, y]); pon(g, PLACA, 2, [cx + 5, y]); pon(g, PLACA, 1, [cx + 6, y]); }
        destello(g, PLACA, cx - 7, torTop + 9, true);
        surco(g, PLACA, 4, cx - 10, torTop + 16, cx - 8, torTop + 13, PLACA);
        for (let x = wL - 4; x <= wR + 4; x++) if (g.rampa(x, torBot - 12) === PLACA) { pon(g, PLACA, 1, [x, torBot - 12]); pon(g, PLACA, 0, [x, torBot - 11]); pon(g, PLACA, 3, [x, torBot - 10]); }
        for (let x = wL; x <= wR; x += 6) if (g.rampa(x, torBot - 15) === PLACA) remache(g, ORO, x, torBot - 15);
        /* Lamas de la escarcela con remaches. */
        for (const [k, py] of [[0, torBot - 8], [1, torBot - 2], [2, pierTop + 4]]) {
          const l = capa().rect(wL - 2 - k * 2, py, wR - wL + 5 + k * 4, 6);
          l.pintar(g, PLACA, { relieve: 2.8, separar: true });
          for (let x = wL - 8; x <= wR + 8; x++) if (l.tiene(x, py)) { pon(g, PLACA, 3, [x, py]); if (l.tiene(x, py + 1)) pon(g, PLACA, 4, [x, py + 1]); }
          for (let x = wL; x <= wR; x += 8) remache(g, ORO, x, py + 2);
        }
        /* Sobreveste de la tela de la clase cayendo por delante, con ribete de oro y orla clara. */
        const sv = capa().rect(cx - 4, torTop + 18, 16, pierTop - torTop - 16).poly([[cx - 5, pierTop - 1], [cx + 11, pierTop - 1], [cx + 13, pierTop + 25], [cx - 7, pierTop + 25]]);
        sv.pintar(g, tela, { relieve: 5.2, separar: true });
        cada(g, tela, cx - 9, torTop + 16, cx + 15, pierTop + 26, (x, y) => {
          if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, R.hueso[x < cx + 3 ? 3 : 2], R.hueso);
          else if (!sv.tiene(x - 2, y) || !sv.tiene(x + 2, y)) g.set(x, y, R.hueso[x < cx + 3 ? 4 : 3], R.hueso);
        });
        ribete(g, sv, ORO, 3, 2);
        pliegue(g, tela, cx + 2, pierTop + 2, cx + 1, pierTop + 22);
        pliegue(g, tela, cx + 8, pierTop + 8, cx + 10, pierTop + 22);
        penumbra(g, tela, cx - 6, pierTop + 4, cx + 14, pierTop + 24, 0.3);
        cinturon(g, t, CUERO, ORO, torBot - 6);
        /* Hombrera de atrás. */
        capa().ell(torL + 4, torTop + 3, 8, 6).pintar(g, PLACA, { relieve: 4.8, max: 3, separar: true });
        break;
      }
      case "barbaro": {
        T.pintar(g, piel, { relieve: 11 });
        /* Clavícula, pectorales, esternón, abdominales y oblicuos como bultos con su luz. */
        const py = torTop + 14;
        surco(g, piel, 1, cx - 9, torTop + 4, cx + 2, torTop + 6, piel); surco(g, piel, 4, cx - 9, torTop + 3, cx + 1, torTop + 5, piel);
        surco(g, piel, 1, cx + 6, torTop + 6, torR - 3, torTop + 4, piel);
        musculo(g, piel, capa().ell(cx - 3, py - 5, 8, 5.4).recortar(T), 5);
        musculo(g, piel, capa().ell(cx + 10, py - 5, 5.4, 5).recortar(T), 4);
        for (const yy of [py + 5, py + 10]) {
          musculo(g, piel, capa().ell(cx, yy, 3.4, 2.4).recortar(T), 2.4);
          musculo(g, piel, capa().ell(cx + 7.5, yy, 2.6, 2.4).recortar(T), 2.2);
        }
        surco(g, piel, 1, cx + 4, torTop + 8, cx + 4, torBot - 4, piel);
        surco(g, piel, 1, cx - 7, py + 3, cx - 9, torBot - 5, piel);
        pon(g, piel, 4, [cx - 7, py - 9], [cx - 6, py - 9], [cx - 8, py - 8]);
        /* Pintura de guerra en el pecho: tres zarpazos. */
        for (let k = 0; k < 3; k++) {
          surco(g, R.sangre, 3, cx - 10 + k * 4, torTop + 15, cx - 6 + k * 4, torTop + 25, piel);
          surco(g, R.sangre, 2, cx - 9 + k * 4, torTop + 15, cx - 5 + k * 4, torTop + 25, piel);
        }
        /* Taparrabos con caída delante, flecos y pespunte. */
        const tp = capa().poly([[wL - 2, torBot - 6], [wR + 2, torBot - 6], [wR + 5, pierTop + 8], [cx + 2, pierTop + 2], [wL - 5, pierTop + 8]])
          .poly([[cx - 3, torBot], [cx + 11, torBot], [cx + 10, pierTop + 22], [cx + 4, pierTop + 19], [cx - 2, pierTop + 22]]);
        tp.pintar(g, tela, { relieve: 6, separar: true });
        pliegue(g, tela, cx + 4, pierTop + 2, cx + 4, pierTop + 16);
        pliegue(g, tela, cx - 4, pierTop, cx - 8, pierTop + 6);
        ribete(g, tp, tela, 2);
        costura(g, tela, cx - 1, pierTop + 18, cx + 9, pierTop + 18, -1);
        for (let x = cx - 2; x <= cx + 10; x += 3) pon(g, tela, 0, [x, pierTop + 20], [x, pierTop + 21]);
        cinturon(g, t, CUERO, R.hierro, torBot - 8, 7);
        break;
      }
      case "picaro": {
        const tr = T.copia().unir(falda(t, 10, 2));
        tr.pintar(g, tela, { relieve: 10 });
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 2, pierTop, cx - 4, pierTop + 10);
        pliegue(g, tela, cx - 8, torTop + 8, cx - 6, torBot - 8);
        /* Jubón de cuero ceñido con costuras y tachuelas. */
        const jb = T.copia().quitarRect(0, 0, W, torTop + 10);
        jb.pintar(g, CUERO2, { relieve: 6, separar: true });
        for (let y = torTop + 12; y < torBot - 6; y++) { pon(g, CUERO2, 1, [cx + 7, y]); if (y % 4 === 0) pon(g, CUERO2, 4, [cx + 6, y]); }
        costura(g, CUERO2, torL + 3, torTop + 12, wL + 1, torBot - 6, 1);
        for (let x = torL + 2; x <= torR - 2; x += 5) if (g.rampa(x, torTop + 11) === CUERO2) remache(g, R.hierro, x, torTop + 11);
        /* Correaje en bandolera con cuchillos arrojadizos. */
        const bd = capa().linea(torL + 2, torTop, torR, torBot - 8, 6).recortar(T);
        bd.pintar(g, CUERO, { relieve: 2.4, separar: true });
        costura(g, CUERO, torL + 3, torTop - 1, torR, torBot - 10, 1);
        for (let k = 0; k < 4; k++) {
          const X = Math.round(torL + 6 + k * 7.2), Y = Math.round(torTop + 2 + k * 5.8);
          pon(g, ACERO, 4, [X, Y - 7], [X, Y - 6]); pon(g, ACERO, 3, [X, Y - 5], [X + 1, Y - 6]); pon(g, ACERO, 2, [X + 1, Y - 5], [X + 1, Y - 4]); pon(g, ACERO, 1, [X + 2, Y - 4]);
          pon(g, CUERO2, 1, [X, Y - 3], [X, Y - 2], [X + 1, Y - 1]); pon(g, CUERO2, 3, [X + 1, Y - 3], [X, Y - 1]);
          pon(g, ORO, 4, [X, Y]); pon(g, ORO, 2, [X + 1, Y]);
        }
        cinturon(g, t, CUERO, R.hierro);
        /* Bolsa y puñal en la cadera. */
        bolsita(g, wL, torBot + 3, CUERO, ORO, 4.6, 5.2);
        break;
      }
      case "explorador": {
        const tr = T.copia().unir(falda(t, 12, 2));
        tr.pintar(g, tela, { relieve: 10 });
        ribete(g, tr, tela, 2);
        costura(g, tela, cx + 4, torBot, cx + 4, pierTop + 12, -1);
        pliegue(g, tela, cx - 4, pierTop, cx - 6, pierTop + 10);
        pliegue(g, tela, cx + 10, pierTop + 2, cx + 12, pierTop + 10);
        /* Jubón de cuero sin mangas, abierto en el pecho y cerrado con cordones cruzados. */
        const jb = capa().rect(torL, torTop + 2, torR - torL + 1, torBot - torTop - 2).quitarRect(cx + 2, torTop + 2, 8, 6).off(cx + 4, torTop + 8).off(cx + 5, torTop + 8);
        jb.recortar(T).pintar(g, CUERO, { relieve: 7, separar: true });
        for (let y = torTop + 9; y < torBot - 7; y += 4) {
          pon(g, R.hueso, 4, [cx + 3, y], [cx + 6, y + 2]); pon(g, R.hueso, 3, [cx + 4, y + 1], [cx + 5, y + 1]); pon(g, R.hueso, 2, [cx + 6, y], [cx + 3, y + 2]);
          pon(g, CUERO, 0, [cx + 2, y], [cx + 7, y]);
        }
        pliegue(g, CUERO, cx - 6, torTop + 8, cx - 8, torBot - 8);
        costura(g, CUERO, torL + 2, torTop + 4, torL + 1, torBot - 8, 1);
        /* Correa del carcaj en bandolera con su anilla de latón. */
        const co = capa().linea(torL + 2, torTop, torR, torBot - 8, 4).recortar(T.copia().unir(capa().rect(torL - 4, torTop - 4, torR - torL + 8, 6)));
        co.pintar(g, CUERO2, { relieve: 1.6, separar: true });
        costura(g, CUERO2, torL + 2, torTop - 1, torR, torBot - 9, 2);
        capa().ell(cx - 2, torTop + 12, 2.4, 2.4).quitarEll(cx - 2, torTop + 12, 0.8, 0.8).pintar(g, ORO, { relieve: 1.4, min: 2 });
        pon(g, ORO, 4, [cx - 3, torTop + 10]);
        cinturon(g, t, CUERO2, ORO);
        bolsita(g, wR - 1, torBot + 4, CUERO, ORO, 4, 4.6);
        break;
      }
      case "mago":
      case "brujo": {
        const bru = clase === "brujo";
        const largo = suelo - pierTop - 4;
        const tn = T.copia().unir(falda(t, largo, bru ? 12 : 10));
        tn.pintar(g, tela, { relieve: 10 });
        penumbra(g, tela, wL - 14, pierTop, wR + 14, suelo, 0.35);
        pliegue(g, tela, cx - 4, pierTop + 2, cx - 10, suelo - 6);
        pliegue(g, tela, cx + 12, pierTop + 6, cx + 18, suelo - 6);
        pliegue(g, tela, cx - 12, pierTop + 12, cx - 16, suelo - 6);
        pliegue(g, tela, cx + 2, pierTop + 16, cx + 1, suelo - 8);
        if (!bru) {
          /* Abertura delantera ribeteada de oro, greca en el bajo y estrellas bordadas. */
          surco(g, ORO, 2, cx + 4, torTop + 4, cx + 8, suelo - 4, tela);
          surco(g, ORO, 3, cx + 3, torTop + 4, cx + 7, suelo - 4, tela);
          surco(g, ORO, 4, cx + 2, torTop + 4, cx + 6, suelo - 4, tela);
          surco(g, tela, 1, cx + 5, torTop + 5, cx + 9, suelo - 4, tela);
          ribete(g, tn, ORO, 3, 2);
          cada(g, tela, wL - 14, suelo - 8, wR + 14, suelo - 3, (x, y) => { if (!tn.tiene(x, y + 3) && tn.tiene(x, y + 2) && (x % 4) === 0) { g.set(x, y, ORO[3], ORO); g.set(x + 1, y, ORO[2], ORO); } });
          const borda = (ram, k, ...pts) => { for (const [i, j] of pts) if (g.rampa(i, j) === tela && j < suelo - 4) pon(g, ram, k, [i, j]); };
          estrellaBordada(g, borda, cx - 6, torTop + 12, true); estrellaBordada(g, borda, cx + 14, pierTop + 12, true); estrellaBordada(g, borda, cx - 10, pierTop + 20, true);
          estrellaBordada(g, borda, cx - 2, pierTop + 34, false); estrellaBordada(g, borda, cx + 18, pierTop + 30, false); estrellaBordada(g, borda, cx - 14, pierTop + 6, false);
          /* Lunas crecientes. */
          for (const [mx, my] of [[cx - 14, pierTop + 30], [cx + 10, pierTop + 38]]) {
            borda(R.hueso, 4, [mx, my], [mx + 1, my - 1], [mx + 2, my - 2]); borda(R.hueso, 3, [mx, my + 1], [mx, my + 2], [mx + 1, my + 3], [mx + 2, my + 4]); borda(R.hueso, 2, [mx + 3, my + 4]);
          }
          /* Fajín con borlas. */
          for (let x = wL - 2; x <= wR + 2; x++) { pon(g, R.tela.granate, 3, [x, torBot - 6], [x, torBot - 5]); pon(g, R.tela.granate, 2, [x, torBot - 4], [x, torBot - 3]); pon(g, R.tela.granate, 1, [x, torBot - 2]); }
          for (let x = wL; x <= wR; x += 3) pon(g, R.tela.granate, 4, [x, torBot - 6]);
          for (const bx of [cx - 6, cx - 3]) {
            surco(g, R.tela.granate, 2, bx, torBot - 1, bx - 1, torBot + 4, null);
            capa().ell(bx - 1, torBot + 7, 1.6, 2.4).pintar(g, ORO, { relieve: 1.2, min: 2 });
            pon(g, ORO, 1, [bx - 2, torBot + 9], [bx, torBot + 9]);
          }
          /* Cuello alto con ribete. */
          capa().rect(t.cabX - 6, torTop - 2, 16, 6).pintar(g, tela, { relieve: 2.4, min: 2, separar: true });
          for (let x = t.cabX - 6; x <= t.cabX + 9; x++) { pon(g, ORO, 3, [x, torTop - 2]); pon(g, ORO, 4, [x, torTop - 1]); }
        } else {
          /* Panel central oscuro con runas que brillan, fajín negro y broche con gema. */
          const pn = capa().poly([[cx - 1, torTop + 4], [cx + 11, torTop + 4], [cx + 15, suelo], [cx - 5, suelo]]).recortar(tn);
          pn.pintar(g, R.tela.negro, { relieve: 5, separar: true });
          const RUNAS = [["K..", "KK.", "K.K", "K.."], [".K.", "K.K", ".K.", ".K."], ["KKK", ".K.", "K.K", "..."], ["K.K", "KKK", "..K", "..K"], [".KK", "K..", ".K.", "KK."]];
          let k = 0;
          for (let y = pierTop; y < suelo - 8; y += 9, k++) {
            const rx = cx + 3 + Math.round((y - pierTop) / 12);
            sello(g, rx, y, RUNAS[k % RUNAS.length], { K: [R.magia[3], R.magia] }, (i, j) => g.rampa(i, j) === R.tela.negro);
            pon(g, R.magia, 4, [rx, y]);
            for (const [i, j] of [[rx - 1, y + 1], [rx + 3, y + 2]]) if (g.rampa(i, j) === R.tela.negro) pon(g, R.magia, 1, [i, j]);
          }
          ribete(g, tn, R.magia, 2, 2);
          cada(g, tela, wL - 16, suelo - 8, wR + 16, suelo - 3, (x, y) => { if (!tn.tiene(x, y + 3) && tn.tiene(x, y + 2) && (x % 3) === 0) g.set(x, y, R.magia[2], R.magia); });
          for (let x = wL - 2; x <= wR + 2; x++) { pon(g, R.tela.negro, 3, [x, torBot - 6], [x, torBot - 5]); pon(g, R.tela.negro, 2, [x, torBot - 4], [x, torBot - 3]); pon(g, R.tela.negro, 1, [x, torBot - 2]); }
          capa().ell(cx + 5, torBot - 4, 3.6, 3.6).pintar(g, ORO, { relieve: 2.4, min: 2 });
          capa().ell(cx + 5, torBot - 4, 2, 2).pintar(g, R.magia, { relieve: 1.6, min: 2 });
          pon(g, R.magia, 4, [cx + 4, torBot - 5]); g.set(cx + 4, torBot - 5, BRILLO, R.magia);
          /* Hombreras de tela con picos. */
          capa().poly([[torL - 2, torTop + 2], [torL + 10, torTop - 2], [torL + 12, torTop + 8], [torL - 6, torTop + 12]]).pintar(g, tela, { relieve: 4, max: 3, separar: true });
          capa().rect(t.cabX - 6, torTop - 2, 16, 5).pintar(g, tela, { relieve: 2.4, min: 2, separar: true });
          for (let x = t.cabX - 6; x <= t.cabX + 9; x++) pon(g, R.magia, 2, [x, torTop - 2]);
        }
        break;
      }
      case "clerigo": {
        const F = falda(t, 16, 4);
        F.pintar(g, MALLA, { relieve: 6 });
        T.pintar(g, MALLA, { relieve: 10, separar: true });
        malla(g, MALLA, torL - 6, torTop, torR + 6, pierTop + 20);
        ribete(g, F, MALLA, 2);
        /* Tabardo con el sol sagrado. */
        const sv = capa().rect(cx - 8, torTop + 2, 22, torBot - torTop).poly([[cx - 11, torBot - 3], [cx + 15, torBot - 3], [cx + 17, pierTop + 19], [cx - 13, pierTop + 19]]);
        sv.pintar(g, tela, { relieve: 7, separar: true });
        ribete(g, sv, ORO, 3, 2);
        cada(g, tela, cx - 14, torTop, cx + 18, pierTop + 20, (x, y) => {
          if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, ORO[x < cx + 3 ? 3 : 2], ORO);
          else if (!sv.tiene(x - 2, y) || !sv.tiene(x + 2, y)) g.set(x, y, ORO[x < cx + 3 ? 4 : 3], ORO);
        });
        pliegue(g, tela, cx - 4, pierTop, cx - 6, pierTop + 16);
        pliegue(g, tela, cx + 8, pierTop, cx + 10, pierTop + 16);
        penumbra(g, tela, cx - 12, pierTop + 4, cx + 18, pierTop + 20, 0.3);
        /* Sol sagrado: disco con brillo y doce rayos alternos. */
        const sx = cx + 2, sy = torTop + 14;
        capa().ell(sx, sy, 4.4, 4.4).pintar(g, ORO, { relieve: 3.2, min: 2 });
        destello(g, ORO, sx - 2, sy - 2);
        for (let k = 0; k < 12; k++) {
          const an = (k / 12) * Math.PI * 2, r = k % 2 ? 8 : 10;
          surco(g, ORO, k % 2 ? 2 : 3, sx + Math.cos(an) * 6, sy + Math.sin(an) * 6, sx + Math.cos(an) * r, sy + Math.sin(an) * r, tela);
          if (!(k % 2)) surco(g, ORO, 4, sx + Math.cos(an) * 6, sy + Math.sin(an) * 6, sx + Math.cos(an) * 7.5, sy + Math.sin(an) * 7.5, tela);
        }
        cinturon(g, t, CUERO, ORO);
        capa().ell(torL + 4, torTop + 3, 7.2, 5.6).pintar(g, PLACA, { relieve: 4.4, max: 3, separar: true });
        break;
      }
      case "bardo": {
        const tr = T.copia().unir(falda(t, 10, 2));
        tr.pintar(g, tela, { relieve: 10 });
        ribete(g, tr, R.tela.granate, 3, 3);
        /* Jubón acordonado: pechera con cordón en zigzag y botonadura al costado. */
        for (let y = torTop + 4; y <= torBot - 8; y++) pon(g, R.tela.granate, 1, [cx + 4, y], [cx + 5, y]), pon(g, R.tela.granate, 2, [cx + 6, y]);
        for (let y = torTop + 4; y <= torBot - 10; y += 4) {
          pon(g, R.hueso, 4, [cx + 2, y], [cx + 3, y + 1]); pon(g, R.hueso, 3, [cx + 4, y + 2], [cx + 5, y + 2], [cx + 6, y + 3]); pon(g, R.hueso, 4, [cx + 7, y + 4]);
          pon(g, ORO, 3, [cx + 2, y + 1]); pon(g, ORO, 3, [cx + 7, y + 3]);
        }
        for (let y = torTop + 6; y <= torBot - 8; y += 6) { capa().ell(torR - 2, y, 1.4, 1.4).pintar(g, ORO, { relieve: 1, min: 2 }); pon(g, ORO, 4, [torR - 3, y - 1]); }
        /* Cuchilladas en la tela con el forro granate asomando. */
        for (const [x0, y0] of [[cx - 8, torTop + 8], [cx - 4, torTop + 18], [cx - 10, torTop + 20], [cx - 2, pierTop + 2]]) {
          const c = capa().ell(x0, y0 + 2, 1.2, 3);
          c.pintar(g, R.tela.granate, { relieve: 1.4, min: 1, max: 3 });
          pon(g, tela, 4, [x0 - 2, y0], [x0 - 2, y0 + 1], [x0 - 2, y0 + 2]); pon(g, tela, 1, [x0 + 2, y0 + 3], [x0 + 2, y0 + 4]);
        }
        pliegue(g, tela, cx - 6, torTop + 6, cx - 6, torBot - 8);
        pliegue(g, tela, cx - 2, pierTop, cx - 4, pierTop + 8);
        /* Gorguera plisada. */
        capa().ell(t.cabX - 1, torTop, 10, 3.6).pintar(g, R.hueso, { relieve: 2.4, min: 2, separar: true });
        cada(g, R.hueso, t.cabX - 12, torTop - 4, t.cabX + 10, torTop + 4, (x, y, k) => { if (x % 3 === 0) pon(g, R.hueso, Math.max(1, k - 1), [x, y]); else if (x % 3 === 1 && k < 4) pon(g, R.hueso, k + 1, [x, y]); });
        cinturon(g, t, CUERO, ORO);
        bolsita(g, wL + 1, torBot + 3, CUERO, ORO, 3.8, 4.2);
        break;
      }
      default: {
        /* Túnica sencilla de los personajes llanos, con cordón. */
        const tr = T.copia().unir(falda(t, 12, 2));
        tr.pintar(g, tela, { relieve: 9 });
        penumbra(g, tela, wL - 6, pierTop, wR + 6, pierTop + 14, 0.35);
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 4, pierTop, cx - 6, pierTop + 12);
        pliegue(g, tela, cx + 8, pierTop + 2, cx + 10, pierTop + 12);
        pliegue(g, tela, cx - 8, torTop + 8, cx - 6, torBot - 6);
        /* Escote con lazada. */
        capa().ell(t.cabX + 1, torTop + 1, 3.4, 2.6).pintar(g, piel, { relieve: 1.6, max: 2 });
        surco(g, tela, 1, t.cabX - 3, torTop, t.cabX + 1, torTop + 4, tela); surco(g, tela, 1, t.cabX + 5, torTop, t.cabX + 1, torTop + 4, tela);
        pon(g, R.hueso, 3, [t.cabX + 1, torTop + 4], [t.cabX, torTop + 5], [t.cabX + 2, torTop + 5]); pon(g, R.hueso, 4, [t.cabX + 1, torTop + 3]);
        /* Cordón trenzado con borlas. */
        for (let x = wL - 2; x <= wR + 2; x++) if (g.get(x, torBot - 4)) { pon(g, MADERA, (x % 3) ? 3 : 4, [x, torBot - 4]); pon(g, MADERA, (x % 3) ? 2 : 1, [x, torBot - 3]); pon(g, MADERA, 1, [x, torBot - 2]); }
        surco(g, MADERA, 3, cx + 6, torBot - 2, cx + 7, torBot + 5, null);
        capa().ell(cx + 7, torBot + 7, 1.6, 2.2).pintar(g, MADERA, { relieve: 1.2, min: 2 });
      }
    }
  }

  /* ---------- Tocados ---------- */
  function tocado(g, t, clase, tela, piel) {
    const x = t.cabX, y = t.cabY;
    switch (clase) {
      case "guerrero": {
        const yelmo = capa().ell(x - 0.4, y - 2, t.cabRx + 2.8, t.cabRy + 1.6);
        yelmo.quitarRect(x, t.ojoY - 6, 26, 22);
        yelmo.borrarDesde(y + 12);
        /* Carrillera que baja por delante de la oreja. */
        yelmo.rect(x - 3, t.ojoY - 6, 4, 17).rect(x + 1, t.bocaY - 1, 2, 4);
        yelmo.pintar(g, PLACA, { relieve: 9, separar: true });
        /* Nasal, banda de la frente con remaches, cresta y visera. */
        for (let j = t.ojoY - 6; j <= t.ojoY + 4; j++) { if (j < t.ojoY + 4) pon(g, PLACA, j < t.ojoY ? 4 : 3, [x + 7, j]); pon(g, PLACA, j < t.ojoY ? 3 : 2, [x + 8, j]); }
        pon(g, PLACA, 1, [x + 8, t.ojoY + 4], [x + 7, t.ojoY + 4]);
        for (let i = x - 18; i <= x + 18; i++) {
          if (g.rampa(i, t.ojoY - 8) !== PLACA) continue;
          pon(g, PLACA, 1, [i, t.ojoY - 12]); pon(g, PLACA, 3, [i, t.ojoY - 11]); pon(g, PLACA, 4, [i, t.ojoY - 10]); pon(g, PLACA, 2, [i, t.ojoY - 9]); pon(g, PLACA, 2, [i, t.ojoY - 8]);
          if (((i - x) % 6 + 6) % 6 === 0) remache(g, ORO, i, t.ojoY - 10);
        }
        for (let i = x - 18; i <= x + 18; i++) if (g.rampa(i, t.ojoY - 6) === PLACA && g.rampa(i + 1, t.ojoY - 6) !== PLACA) pon(g, PLACA, 1, [i, t.ojoY - 6], [i, t.ojoY - 5]);
        for (let j = y - 15; j <= y - 3; j++) { const i = x - 2 + Math.round((j - y) * 0.15); if (g.rampa(i, j) === PLACA) pon(g, PLACA, 4, [i, j]), pon(g, PLACA, 2, [i + 1, j]), pon(g, PLACA, 1, [i + 2, j]); }
        destello(g, PLACA, x - 9, y - 10, true);
        /* Malla del cuello por detrás. */
        const cm = capa().poly([[x - 18, y + 4], [x - 4, y + 10], [x - 2, t.torTop + 2], [x - 19, t.torTop + 2]]);
        cm.pintar(g, MALLA, { relieve: 3.6, max: 3, separar: true });
        malla(g, MALLA, x - 20, y + 5, x - 2, t.torTop + 3);
        /* Penacho de crines que cae hacia atrás, con sus hebras. */
        const pc = Math.max(y - 30, 3);
        const pe = capa().curva(x, y - 16, x - 12, pc, x - 28, y - 14, 8.4, 3.2).curva(x - 4, y - 18, x - 18, pc + 6, x - 30, y - 4, 6.4, 2.4);
        pe.pintar(g, tela, { relieve: 4, separar: true });
        cada(g, tela, x - 34, y - 34, x + 4, y - 3, (i, j, k) => {
          if (!pe.tiene(i, j)) return;
          const u = ((i * 2 + j) % 6 + 6) % 6;
          if (u === 0 && k >= 2) g.set(i, j, tela[k - 1], tela); else if (u === 3 && k === 3) g.set(i, j, tela[4], tela);
        });
        capa().rect(x - 4, y - 18, 6, 4).pintar(g, ORO, { relieve: 2, min: 2 });
        pon(g, ORO, 4, [x - 4, y - 18], [x - 3, y - 18]);
        break;
      }
      case "brujo": pintarCapucha(g, t, tela, piel, true); break;
      case "explorador": pintarCapucha(g, t, tela, piel, false); break;
      case "picaro": pintarCapucha(g, t, tela, piel, false); break;
      case "clerigo": {
        /* Cofia de malla con su diadema de oro y una gema. */
        pintarCapucha(g, t, MALLA, piel, false);
        malla(g, MALLA, x - 28, y - 20, x + 18, t.torTop + 8);
        for (let i = x - 18; i <= x + 8; i++) {
          const j = t.ojoY - 10 + (i > x + 2 ? 1 : 0);
          if (g.rampa(i, j) === MALLA || g.rampa(i, j + 1) === MALLA) { pon(g, ORO, (i - x) % 6 === 0 ? 4 : 3, [i, j]); pon(g, ORO, 2, [i, j + 1]); pon(g, ORO, 1, [i, j + 2]); }
        }
        capa().ell(x + 2, t.ojoY - 9, 1.8, 1.8).pintar(g, R.sangre, { relieve: 1.4, min: 2 });
        g.set(x + 1, t.ojoY - 10, BRILLO, R.sangre);
        break;
      }
      case "mago": {
        const by = y - 8;
        const ala = capa().ell(x - 1, by, t.cabRx + 9, 3.8);
        /* Copa cónica que se dobla hacia atrás: más alta cuando hay sitio por encima. */
        const alt = Math.min(t.altSombrero || 30, by - 2);
        const cono = alt >= 24
          ? capa().poly([[x - 13, by - 1], [x + 11, by - 1], [x + 6, by - alt * 0.55], [x + 1, by - alt * 0.85], [x - 5, by - alt], [x - 14, by - alt + 1], [x - 26, by - alt * 0.45],
            [x - 17, by - alt * 0.62], [x - 11, by - alt * 0.45], [x - 12, by - 4]])
          : capa().poly([[x - 11, by - 1], [x + 10, by - 1], [x + 5, by - alt * 0.6], [x - 1, by - alt], [x - 10, by - alt], [x - 20, by - alt + 4], [x - 29, by + 1],
            [x - 24, by + 1], [x - 19, by - alt + 9], [x - 12, by - alt + 8], [x - 11, by - 4]]);
        cono.quitarRect(0, 0, W, 2);
        cono.pintar(g, tela, { relieve: 7, separar: true });
        ala.pintar(g, tela, { relieve: 3.6, separar: true });
        const [ax0, , ax1] = ala.caja();
        for (let i = ax0; i <= ax1; i++) {
          for (let j = by - 4; j <= by + 4; j++) {
            if (!ala.tiene(i, j)) continue;
            if (!ala.tiene(i, j + 1)) pon(g, tela, 1, [i, j]);
            else if (!ala.tiene(i, j - 1) && !cono.tiene(i, j - 1)) pon(g, tela, 4, [i, j]);
          }
        }
        /* Cinta de oro con hebilla y estrellas en la copa. */
        const b1 = Math.round(by - 2), b2 = Math.round(by - 6);
        for (let i = x - 14; i <= x + 12; i++) for (let j = b2; j <= b1; j++) if (cono.tiene(i, j) && g.rampa(i, j) === tela) pon(g, ORO, j === b1 ? 1 : j === b2 ? 3 : j === b2 + 1 ? 4 : 2, [i, j]);
        capa().rect(x - 2, b2 - 1, 6, 7).quitarRect(x, b2 + 1, 2, 3).pintar(g, ORO, { relieve: 1.6, min: 2 });
        pon(g, ORO, 4, [x - 2, b2 - 1], [x - 1, b2 - 1]);
        const borda = (ram, k, ...pts) => { for (const [i, j] of pts) if (g.rampa(i, j) === tela && cono.tiene(i, j)) pon(g, ram, k, [i, j]); };
        estrellaBordada(g, borda, x - 2, Math.round(by - alt * 0.5), true);
        if (alt >= 24) estrellaBordada(g, borda, x - 16, Math.round(by - alt * 0.58), false);
        else estrellaBordada(g, borda, x - 21, by - 4, false);
        estrellaBordada(g, borda, x + 4, Math.round(by - alt * 0.28), false);
        pliegue(g, tela, x + 6, Math.round(by - 8), x + 2, Math.round(by - alt * 0.7));
        pliegue(g, tela, x - 8, Math.round(by - alt * 0.8), x - 18, Math.round(by - alt * 0.6));
        break;
      }
      case "bardo": {
        /* Chambergo: copa redonda, ala ancha levantada por delante, cinta granate y una pluma larga. */
        const by = Math.round(y - 12);
        const copa = capa().ell(x - 3, by - 3, 11.2, 8.8).borrarDesde(by + 4);
        const ala = capa().ell(x - 1, by + 4, t.cabRx + 11, 3.4).poly([[x + 8, by + 7], [x + 18, by - 1], [x + 25, by - 5], [x + 25, by + 1], [x + 18, by + 7]]);
        copa.pintar(g, tela, { relieve: 6.4, separar: true });
        surco(g, tela, 1, x - 2, by - 10, x, by - 2, tela);
        surco(g, tela, 4, x - 10, by - 6, x - 6, by - 10, tela);
        const [cx0, , cx1] = copa.caja();
        for (let i = cx0; i <= cx1; i++) {
          if (copa.tiene(i, by)) pon(g, R.tela.granate, 4, [i, by]);
          if (copa.tiene(i, by + 1)) pon(g, R.tela.granate, 3, [i, by + 1]);
          if (copa.tiene(i, by + 2)) pon(g, R.tela.granate, 1, [i, by + 2]);
        }
        ala.pintar(g, tela, { relieve: 3.6, separar: true });
        const [ax0, , ax1] = ala.caja();
        for (let i = ax0; i <= ax1; i++) for (let j = by - 6; j <= by + 8; j++) {
          if (!ala.tiene(i, j)) continue;
          if (!ala.tiene(i, j + 1)) pon(g, tela, 1, [i, j]);
          else if (!ala.tiene(i, j - 1) && !copa.tiene(i, j - 1)) pon(g, tela, 4, [i, j]);
        }
        /* Pluma con su raquis, barbas en hebras y la punta teñida. */
        const pl = capa().curva(x - 10, by, x - 22, by - 24, x - 38, by - 18, 8.8, 2);
        pl.pintar(g, PLUMA, { relieve: 2.8, min: 2, separar: true });
        surco(g, PLUMA, 1, x - 12, by - 2, x - 20, by - 16, PLUMA);
        surco(g, PLUMA, 1, x - 21, by - 18, x - 34, by - 18, PLUMA);
        cada(g, PLUMA, x - 42, by - 26, x - 30, by - 10, (i, j, k) => { if (i <= x - 32) pon(g, R.tela.granate, k >= 3 ? 3 : 2, [i, j]); });
        cada(g, PLUMA, x - 30, by - 26, x - 8, by, (i, j, k) => { if (((i - j) % 4 + 4) % 4 === 0 && k > 1) pon(g, PLUMA, k - 1, [i, j]); });
        capa().ell(x - 10, by + 1, 2.8, 2.8).pintar(g, ORO, { relieve: 2, min: 2 });
        pon(g, ORO, 4, [x - 11, by]); g.set(x - 11, by - 1, BRILLO, ORO);
        break;
      }
    }
  }
  /* Hombrera de placas superpuestas con remaches de oro. */
  function hombrera(g, t) {
    const [hx, hy] = t.hombro;
    capa().ell(hx, hy - 1, 8.8, 6.8).pintar(g, PLACA, { relieve: 5.2, separar: true });
    capa().ell(hx + 1, hy + 6, 7.2, 3.6).pintar(g, PLACA, { relieve: 3.2, separar: true });
    capa().ell(hx + 2, hy + 10, 5.6, 2.8).pintar(g, PLACA, { relieve: 2.8, separar: true });
    destello(g, PLACA, hx - 4, hy - 4, true);
    remache(g, ORO, hx + 4, hy + 5); remache(g, ORO, hx - 4, hy + 5); remache(g, ORO, hx, hy + 6);
  }

  /* ---------- Escudo ---------- */
  function escudo(g, sx, sy, tela) {
    /* Escudo de cometa: reborde de hierro con remaches, campo de la tela con su brillo y una cruz clara;
       un perfil oscuro lo separa de la armadura. */
    const hw = 15;
    const borde = capa().poly([[sx - hw, sy - 13], [sx - hw + 4, sy - 15], [sx + hw - 4, sy - 15], [sx + hw, sy - 13], [sx + hw, sy + 4], [sx + 7, sy + 22], [sx, sy + 29], [sx - 7, sy + 22], [sx - hw, sy + 4]]);
    borde.pintar(g, PLACA, { relieve: 5, min: 1 });
    perfilar(g, borde);
    const campo = capa().poly([[sx - hw + 3, sy - 12], [sx + hw - 3, sy - 12], [sx + hw - 3, sy + 3.2], [sx + 4.8, sy + 20], [sx, sy + 25.4], [sx - 4.8, sy + 20], [sx - hw + 3, sy + 3.2]]);
    campo.pintar(g, tela, { relieve: 10, luz: [-0.6, -0.5, 0.7] });
    penumbra(g, tela, Math.round(sx - hw), sy + 4, Math.round(sx + hw), sy + 26, 0.25);
    const cxs = Math.round(sx), cys = sy - 2;
    for (let j = sy - 10; j <= sy + 22; j++) { pon(g, R.hueso, 4, [cxs - 2, j]); pon(g, R.hueso, 3, [cxs - 1, j], [cxs, j]); pon(g, R.hueso, 2, [cxs + 1, j]); pon(g, tela, 0, [cxs + 2, j]); }
    for (let i = cxs - 10; i <= cxs + 10; i++) { pon(g, R.hueso, i < cxs ? 4 : 3, [i, cys - 2]); pon(g, R.hueso, 3, [i, cys - 1]); pon(g, R.hueso, 2, [i, cys]); pon(g, tela, 0, [i, cys + 1]); }
    for (let j = sy - 10; j <= sy + 22; j++) if (g.rampa(cxs + 2, j) === tela) pon(g, tela, 0, [cxs + 2, j]);
    pon(g, R.hueso, 4, [cxs - 1, cys - 2], [cxs - 2, cys - 1], [cxs - 1, cys - 1]);
    g.set(cxs - 2, cys - 2, BRILLO, R.hueso);
    /* Brillo del reborde y remaches. */
    for (let i = Math.round(sx - hw); i <= Math.round(sx + hw); i++) if (g.rampa(i, sy - 14) === PLACA) pon(g, PLACA, 4, [i, sy - 14]);
    for (let j = sy - 12; j <= sy + 4; j++) if (g.rampa(Math.round(sx - hw) + 1, j) === PLACA) pon(g, PLACA, 3, [Math.round(sx - hw) + 1, j]);
    for (const [i, j] of [[sx - hw + 1.5, sy - 13], [sx + hw - 2.5, sy - 13], [sx - hw + 1, sy + 2], [sx + hw - 2, sy + 2], [sx - 0.5, sy + 26.5], [sx - 9.5, sy + 14], [sx + 8.5, sy + 14], [sx - 0.5, sy - 14]]) remache(g, ORO, i, j);
    destello(g, tela, cxs - 9, sy - 9, false);
    surco(g, tela, 4, cxs - 10, sy - 5, cxs - 6, sy - 9, tela);
  }

  /* ---------- Poses ----------
     aspecto.pose: "ataque", "conjuro", "herido" o "victoria" (cualquier otra cosa es la postura de siempre).
     Igual que a 64: la pose mueve la plantilla, inclina lo que hay por encima de la cadera desplazando sus filas
     y vuelve a dibujar brazos y armas con articulaciones libres; cada arma se dibuja en un marco local girado. */
  const POSES = ["normal", "ataque", "conjuro", "herido", "victoria"];
  const LUZ = {
    mago: ["#1d1650", "#3b36a6", "#6a6fe2", "#a9b2fa", "#eef0ff"],
    brujo: ["#2a1240", "#6a2c9a", "#46b064", "#9cf08e", "#efffe0"],
    clerigo: ["#4a2a0c", "#9a6418", "#dca632", "#ffe27c", "#fffbe2"],
    bardo: ["#0b2c30", "#167068", "#27ae9e", "#66e8d2", "#dcfff6"],
    neutro: ["#3a3848", "#6c6a80", "#a8aabe", "#dcdeea", "#ffffff"]
  };
  const ESTELA = ["#4a4e66", "#7c8298", "#b0b8cc", "#dce2ee", "#fbfcff"];

  function mover(t, dx, dy) {
    for (const k of ["cx", "cabX", "ojo1", "ojo2", "narizX", "torL", "torR", "wL", "wR", "caderaAtras", "caderaDelante"]) t[k] += dx;
    for (const k of ["cabY", "ojoY", "bocaY", "torTop", "torBot", "pierTop"]) t[k] += dy;
    for (const k of ["hombro", "codo", "mano", "hombroAtras", "manoAtras", "tiro"]) if (t[k]) t[k] = [t[k][0] + dx, t[k][1] + dy];
    t.rodillaY = Math.round((t.pierTop + t.suelo) / 2) - 2;
    return t;
  }
  function posar(t, pose) {
    const P = { pose, incl: 0, cab: 0 };
    t.pose = pose;
    t.altSombrero = Math.min(30, t.cabY - 10);
    if (pose === "ataque") {
      mover(t, 2, 6); P.incl = 0.075;
      t.pieAtras -= 6; t.pieDelante += 8; t.kDx = 7;
      t.faldaI = -6; t.faldaD = 6; t.capaDx = -10; t.capaDy = -6;
    } else if (pose === "conjuro") {
      t.pieAtras -= 2; t.pieDelante += 2; P.incl = -0.03;
      t.faldaI = -6; t.faldaIy = -6; t.faldaD = 4; t.faldaDy = -2; t.capaDx = -12; t.capaDy = -8;
    } else if (pose === "herido") {
      mover(t, -2, 4); P.incl = -0.085; P.cab = -0.11;
      t.pieAtras -= 2; t.kDx = 7; t.kAx = -1;
      t.faldaI = -2; t.faldaD = 4; t.capaDx = 4; t.capaDy = 2;
    } else if (pose === "victoria") {
      t.pieAtras -= 2; t.pieDelante += 2; P.incl = -0.025;
    }
    const piv = t.pierTop, cuello = t.torTop + 2;
    P.desp = y => y >= piv ? 0 : Math.round(P.incl * (piv - y)) + (P.cab && y < cuello ? Math.round(P.cab * (cuello - y)) : 0);
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
  /* Dibuja algo por detrás de lo ya pintado: solo ocupa los huecos, en sombra, y con una línea honda donde asoma junto al cuerpo. */
  function detras(g, dibujar) {
    const gb = new Rejilla(W, H);
    dibujar(gb);
    const nuevo = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (gb.c[i] && !g.c[i]) {
      const r = gb.r[i], k = r ? r.indexOf(gb.c[i]) : -1;
      g.c[i] = r && k > 2 ? r[k - 1] : gb.c[i]; g.r[i] = r; nuevo[i] = 1;
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
      ell: (k, cx, cy, rx, ry = rx) => { const pts = []; for (let i = 0; i < 32; i++) { const b = (i / 32) * Math.PI * 2; pts.push([cx + Math.cos(b) * (rx + 0.3), cy + Math.sin(b) * (ry + 0.3)]); } return m.poly(k, pts); },
      rect: (k, x, y, w, h) => m.poly(k, [[x - 0.5, y - 0.5], [x + w - 0.5, y - 0.5], [x + w - 0.5, y + h - 0.5], [x - 0.5, y + h - 0.5]]),
      linea: (k, x0, y0, x1, y1, gr) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); return k.linea(a0, b0, a1, b1, gr); },
      curva: (k, x0, y0, cx, cy, x1, y1, g0, g1) => { const [a0, b0] = f(x0, y0), [ca, cb] = f(cx, cy), [a1, b1] = f(x1, y1); return k.curva(a0, b0, ca, cb, a1, b1, g0, g1); },
      pon: (g, ram, k, ...pts) => { for (const [x, y] of pts) { const [X, Y] = m.at(x, y); g.set(X, Y, ram[lim(k, 0, 4)], ram); } },
      surco: (g, ram, k, x0, y0, x1, y1, solo) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); surco(g, ram, k, a0, b0, a1, b1, solo); },
      costura: (g, ram, x0, y0, x1, y1, d, solo) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); costura(g, ram, a0, b0, a1, b1, d, solo); }
    };
    return m;
  }
  /* Hoja de acero en cualquier ángulo: bisel claro del lado de la luz, vaceo central y filo en sombra. */
  function pintarHoja(g, c, m, punta, ancho = 3, vaceo = true) {
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      const [lx, ly] = m.inv(x, y);
      let k;
      if (lx < -ancho * 0.55) k = 4;
      else if (lx < -ancho * 0.15) k = 3;
      else if (lx < ancho * 0.2) k = vaceo && ly > punta + 8 && ly < -10 ? 2 : 3;
      else if (lx < ancho * 0.6) k = 2;
      else k = 1;
      g.set(x, y, ACERO[k], ACERO);
    }
  }

  /* ---------- Armas en su marco ---------- */
  function espadaL(g, m, largo) {
    const hj = capa();
    m.poly(hj, [[-3.5, -7], [3.5, -7], [3.5, -largo + 3], [0, -largo - 3.5], [-3.5, -largo + 3]]);
    pintarHoja(g, hj, m, -largo, 3.5);
    for (const [bx, by] of [m.at(-2, -largo + 8), m.at(-2, -largo + 9), m.at(-3, -largo * 0.55)]) g.set(bx, by, BRILLO, ACERO);
    perfilar(g, hj);
    const gd = capa(); m.rect(gd, -8, -7, 17, 4); m.ell(gd, -9.5, -8.5, 1.6); m.ell(gd, 9.5, -8.5, 1.6);
    gd.pintar(g, ORO, { relieve: 2, min: 2, separar: true });
    m.pon(g, ORO, 4, [-7, -7], [-6, -7], [-5, -7], [-10, -9]);
    const gm = capa(); m.ell(gm, 0, -5, 1.8); gm.pintar(g, R.sangre, { relieve: 1.6, min: 2 });
    m.pon(g, R.sangre, 4, [-1, -6]);
    const pu = capa(); m.rect(pu, -2, -3, 4, 13); pu.pintar(g, CUERO, { relieve: 1.6, min: 1 });
    for (let j = -2; j <= 9; j += 2) m.pon(g, CUERO, 3, [-1, j], [0, j - 1]);
    const pm = capa(); m.ell(pm, 0, 11, 2.6, 2.2); pm.pintar(g, ORO, { relieve: 2, min: 2 });
    m.pon(g, ORO, 4, [-1, 10]);
  }
  function hachaL(g, m) {
    const mango = capa(); m.linea(mango, 0, 22, 0, -34, 5);
    mango.pintar(g, MADERA, { relieve: 2.8, min: 1 });
    m.surco(g, MADERA, 4, -1, 20, -1, -6, MADERA); m.surco(g, MADERA, 1, 1, 18, 1, -30, MADERA);
    m.surco(g, MADERA, 3, -1, -14, -1, -30, MADERA);
    for (let j = -4; j <= 16; j += 3) m.pon(g, CUERO, 2, [-1, j], [0, j], [1, j]), m.pon(g, CUERO, 4, [-1, j + 1]), m.pon(g, CUERO, 1, [1, j + 1]);
    const hx = 4, hy = -32;
    const hj = capa(); m.poly(hj, [[hx, hy - 6], [hx + 12, hy - 18], [hx + 22, hy - 8], [hx + 24, hy + 6], [hx + 16, hy + 18], [hx + 2, hy + 8]]);
    hj.restar(m.ell(capa(), hx + 8, hy - 15, 4.6, 4)).restar(m.ell(capa(), hx + 8, hy + 16, 4.6, 4));
    hj.pintar(g, ACERO, { relieve: 6, separar: true });
    /* El filo curvo brilla: el borde del lado del corte. */
    const marcas = [];
    const [x0, y0, x1, y1] = hj.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!hj.tiene(x, y)) continue;
      const [lx, ly] = m.inv(x, y);
      const [a1, b1] = m.at(lx + 1.3, ly), [a2, b2] = m.at(lx + 2.6, ly), [a3, b3] = m.at(lx + 4, ly);
      if (!hj.tiene(a1, b1)) marcas.push([x, y, 4]); else if (!hj.tiene(a2, b2)) marcas.push([x, y, 3]); else if (!hj.tiene(a3, b3)) marcas.push([x, y, 2]);
    }
    for (const [x, y, k] of marcas) g.set(x, y, ACERO[k], ACERO);
    /* Grabado de nudos en la hoja. */
    m.surco(g, ACERO, 1, hx + 8, hy - 2, hx + 14, hy + 4, ACERO); m.surco(g, ACERO, 1, hx + 8, hy + 4, hx + 14, hy - 2, ACERO);
    m.surco(g, ACERO, 3, hx + 8, hy - 3, hx + 14, hy + 3, ACERO);
    const [dx, dy] = m.at(hx + 17, hy - 4); destello(g, ACERO, dx, dy, true);
    const ab = capa(); m.rect(ab, hx - 4, hy - 6, 8, 14); ab.pintar(g, R.hierro, { relieve: 2.4, separar: true });
    m.pon(g, R.hierro, 4, [hx - 4, hy - 6], [hx - 3, hy - 6], [hx - 4, hy - 5]);
    const [r1x, r1y] = m.at(hx, hy - 3); remache(g, ORO, r1x, r1y);
    const [r2x, r2y] = m.at(hx, hy + 4); remache(g, ORO, r2x, r2y);
    const pc = capa(); m.poly(pc, [[hx - 4, hy - 3], [hx - 14, hy + 1], [hx - 4, hy + 5]]); pc.pintar(g, ACERO, { relieve: 2, separar: true });
  }
  function dagaL(g, m) {
    const hj = capa(); m.poly(hj, [[-2.2, -7], [2.2, -7], [2.2, -20], [0, -26], [-2.2, -20]]);
    pintarHoja(g, hj, m, -24, 2.2, false);
    const [bx, by] = m.at(-1, -16); g.set(bx, by, BRILLO, ACERO);
    perfilar(g, hj);
    const gd = capa(); m.rect(gd, -6, -7, 12, 3); gd.pintar(g, ORO, { relieve: 1.6, min: 2 });
    m.pon(g, ORO, 4, [-6, -7], [-5, -7]);
    const pm = capa(); m.ell(pm, 0, 7, 2.2, 2); pm.pintar(g, ORO, { relieve: 1.6, min: 2 });
    m.pon(g, ORO, 4, [-1, 6]);
  }
  function mazaL(g, m) {
    const mg = capa(); m.rect(mg, -2, -20, 4, 32); mg.pintar(g, MADERA, { relieve: 2, min: 1 });
    for (let j = -16; j <= 10; j += 3) m.pon(g, CUERO, 2, [-2, j], [-1, j], [0, j], [1, j]), m.pon(g, CUERO, 4, [-2, j + 1]);
    const cy = -26;
    const cb = capa(); m.ell(cb, 0, cy, 5.2, 6.4); cb.pintar(g, R.hierro, { relieve: 3.6, min: 1, separar: true });
    const al = capa();
    m.poly(al, [[-11, cy - 5], [-4, cy - 7], [-4, cy + 7], [-11, cy + 5]]); m.poly(al, [[11, cy - 5], [4, cy - 7], [4, cy + 7], [11, cy + 5]]); m.rect(al, -2, cy - 12, 4, 6);
    al.pintar(g, R.hierro, { relieve: 2.4, min: 1, separar: true });
    for (let j = cy - 5; j <= cy + 5; j++) m.pon(g, R.hierro, 4, [-10, j]), m.pon(g, R.hierro, 3, [4, j]), m.pon(g, R.hierro, 1, [10, j]);
    const [dx, dy] = m.at(-2, cy - 4); destello(g, R.hierro, dx, dy, true);
    const pm = capa(); m.ell(pm, 0, cy - 14, 2.4); pm.pintar(g, ORO, { relieve: 2, min: 2 });
    const co = capa(); m.rect(co, -3, -21, 6, 3); co.pintar(g, ORO, { relieve: 1.4, min: 2 });
    m.pon(g, ORO, 4, [-3, -21], [-2, -21]);
    const po = capa(); m.ell(po, 0, 14, 2.4, 2); po.pintar(g, ORO, { relieve: 2, min: 2 });
  }
  /* Báculo: el orbe a «arriba» píxeles de la mano y el regatón a «abajo». */
  function bastonL(g, m, arriba, abajo) {
    const oy = -arriba;
    const vara = capa(); m.rect(vara, -2, oy + 6, 4, abajo - oy - 6); vara.pintar(g, MADERA, { relieve: 2.4, min: 1 });
    m.surco(g, MADERA, 4, -2, oy + 10, -2, abajo - 2, MADERA);
    for (let j = oy + 14; j < abajo - 2; j += 12) { m.pon(g, MADERA, 1, [0, j], [1, j + 1], [-1, j + 1]); m.pon(g, MADERA, 4, [-1, j - 1]); m.pon(g, MADERA, 3, [0, j + 2]); }
    const ga = capa(); m.curva(ga, -3, oy + 7, -9, oy + 3, -5, oy - 5, 3, 1.6); m.curva(ga, 3, oy + 7, 9, oy + 3, 5, oy - 5, 3, 1.6);
    const [X, Y] = m.at(0, oy);
    const orbe = capa().ell(X, Y, 6.6, 6.6);
    orbe.pintar(g, R.mar, { relieve: 5, min: 2 });
    capa().ell(X + 1, Y + 1, 3, 3).pintar(g, R.mar, { relieve: 2, min: 3 });
    pon(g, R.mar, 4, [X - 3, Y - 3], [X - 2, Y - 4], [X - 4, Y - 2], [X - 3, Y - 2]);
    g.set(X - 3, Y - 3, BRILLO, R.mar); g.set(X - 2, Y - 3, BRILLO, R.mar);
    pon(g, R.mar, 1, [X + 4, Y + 3], [X + 3, Y + 4], [X + 5, Y + 2]);
    ga.pintar(g, MADERA, { relieve: 1.6, min: 1, separar: true });
    const an = capa(); m.rect(an, -3, oy + 7, 6, 3); an.pintar(g, ORO, { relieve: 1.4, min: 2 });
    m.pon(g, ORO, 4, [-3, oy + 7], [-2, oy + 7]);
    return [X, Y];
  }
  function chispa(g, ram, X, Y, grande) {
    X = Math.round(X); Y = Math.round(Y);
    pon(g, ram, 4, [X, Y]);
    pon(g, ram, 3, [X - 1, Y], [X + 1, Y], [X, Y - 1], [X, Y + 1]);
    if (grande) pon(g, ram, 2, [X - 2, Y], [X + 2, Y], [X, Y - 2], [X, Y + 2]), pon(g, ram, 1, [X - 3, Y], [X + 3, Y], [X, Y - 3], [X, Y + 3]);
  }
  function cristal(g, cx, cy) {
    const cr = capa().poly([[cx + 1, cy - 12], [cx + 7, cy - 2], [cx + 1, cy + 10], [cx - 5, cy - 2]]);
    cr.pintar(g, R.magia, { relieve: 4, min: 1 });
    /* Facetas: arista clara a la izquierda, sombra abajo a la derecha. */
    surco(g, R.magia, 4, cx, cy - 10, cx - 3, cy - 2, R.magia);
    surco(g, R.magia, 3, cx + 1, cy - 11, cx + 1, cy + 8, R.magia);
    surco(g, R.magia, 2, cx + 2, cy - 2, cx + 2, cy + 7, R.magia);
    surco(g, R.magia, 1, cx + 5, cy - 1, cx + 2, cy + 6, R.magia);
    g.set(cx - 2, cy - 6, BRILLO, R.magia); g.set(cx - 1, cy - 7, BRILLO, R.magia); g.set(cx - 2, cy - 5, R.magia[4], R.magia);
  }
  /* Arco: «cuerda» es el punto (en la rejilla) del que tira la mano, o null con la cuerda suelta y recta. */
  function arcoL(g, m, alto, bajo, cuerda) {
    const ax = 4, top = -alto, bot = bajo;
    const a = capa();
    m.curva(a, ax - 8, top, ax + 10, top / 2 - 4, ax + 2, 0, 4.4, 5.6); m.curva(a, ax + 2, 0, ax + 10, bot / 2 + 4, ax - 8, bot, 5.6, 4.4);
    a.pintar(g, MADERA, { relieve: 2.8, min: 1 });
    /* Veta de la madera y empuñadura forrada. */
    m.surco(g, MADERA, 4, ax - 3, top + 4, ax + 3, top + 14, MADERA);
    m.surco(g, MADERA, 4, ax + 5, 8, ax + 3, 16, MADERA);
    m.surco(g, MADERA, 1, ax + 4, top + 8, ax + 7, top / 2 - 2, MADERA);
    for (let j = -5; j <= 5; j += 2) m.pon(g, CUERO, j === -5 ? 4 : 2, [ax, j], [ax + 1, j], [ax + 2, j], [ax + 3, j]);
    m.pon(g, R.hueso, 4, [ax - 10, top - 2], [ax - 10, bot + 2], [ax - 9, top - 2]); m.pon(g, R.hueso, 3, [ax - 8, top - 2], [ax - 8, bot + 2], [ax - 9, bot + 2]);
    const linea = (x0, y0, x1, y1) => {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
      for (let s = 0; s <= n; s++) { const X = Math.round(x0 + (x1 - x0) * s / n), Y = Math.round(y0 + (y1 - y0) * s / n); if (g.rampa(X, Y) !== MADERA) g.set(X, Y, R.hueso[3], R.hueso); }
    };
    const [t0, t1] = m.f(ax - 10, top), [b0, b1] = m.f(ax - 10, bot);
    if (cuerda) { linea(t0, t1, cuerda[0], cuerda[1]); linea(b0, b1, cuerda[0], cuerda[1]); }
    else linea(t0, t1, b0, b1);
  }
  function laudL(g, m) {
    const lx = -2, ly = 8;
    const mast = capa(); m.linea(mast, lx + 8, ly - 8, lx + 22, ly - 28, 6);
    mast.pintar(g, MADERA, { relieve: 2, max: 2 });
    perfilar(g, mast);
    for (let k = 1; k < 6; k++) m.pon(g, R.hueso, 3, [Math.round(lx + 9 + k * 2.3) - 1, Math.round(ly - 10 - k * 3.3)], [Math.round(lx + 9 + k * 2.3), Math.round(ly - 10 - k * 3.3)], [Math.round(lx + 9 + k * 2.3) + 1, Math.round(ly - 10 - k * 3.3)]);
    const cl = capa(); m.poly(cl, [[lx + 20, ly - 27], [lx + 26, ly - 32], [lx + 31, ly - 28], [lx + 25, ly - 23]]);
    cl.pintar(g, MADERA, { relieve: 2, max: 3, separar: true });
    for (const [i, j] of [[lx + 22, ly - 34], [lx + 28, ly - 34], [lx + 33, ly - 28], [lx + 31, ly - 24]]) { m.pon(g, R.hueso, 4, [i, j]); m.pon(g, R.hueso, 2, [i + 1, j + 1]); }
    const caja = capa(); m.ell(caja, lx, ly, 12.8, 10.8); m.ell(caja, lx + 7.2, ly - 6, 7.6, 6.4);
    caja.pintar(g, LAUD, { relieve: 8, luz: [-0.55, -0.6, 0.7] });
    perfilar(g, caja);
    const [x0, y0, x1, y1] = caja.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (caja.tiene(x, y) && !caja.tiene(x, y + 1)) { pon(g, MADERA, 1, [x, y]); if (caja.tiene(x, y - 1)) pon(g, MADERA, 2, [x, y - 1]); }
    /* Vetas de la tapa. */
    for (const k of [-6, 6]) m.surco(g, LAUD, 2, lx - 8, ly + k * 0.5 + 2, lx + 10, ly + k * 0.5 - 6, LAUD);
    const bo = capa(); m.ell(bo, lx + 3, ly - 2, 3.2); bo.pintar(g, MADERA, { plano: 0 });
    for (let k = 0; k < 10; k++) { const an = (k / 10) * Math.PI * 2; m.pon(g, ORO, k % 2 ? 2 : 4, [lx + 3 + Math.cos(an) * 4.6, ly - 2 + Math.sin(an) * 4.6]); }
    const pu = capa(); m.rect(pu, lx - 8, ly + 4, 8, 2); pu.pintar(g, MADERA, { plano: 1 });
    m.pon(g, MADERA, 3, [lx - 8, ly + 3], [lx - 7, ly + 3]);
    m.surco(g, R.hueso, 4, lx - 6, ly + 4, lx + 22, ly - 30, null);
    m.surco(g, R.hueso, 2, lx - 5, ly + 4, lx + 23, ly - 30, null);
    m.surco(g, R.hueso, 3, lx - 4, ly + 5, lx + 24, ly - 29, null);
    return m.at(lx + 26, ly - 30);
  }

  /* ---------- Manos de las poses ---------- */
  /* Mano abierta con la palma hacia delante y los dedos arriba (para conjurar o al recibir un golpe). */
  function manoAbierta(g, x, y, ram) {
    const c = capa().ell(x, y, 3.8, 3.6);
    for (let i = 0; i < 4; i++) c.linea(x - 3 + i * 2.1, y - 2, x - 3.6 + i * 2.4, y - 7 + Math.abs(i - 1.5) * 0.9, 2);
    c.linea(x + 3, y + 1, x + 6, y - 3, 2.4);
    c.pintar(g, ram, { relieve: 2.4, separar: true });
    for (let i = 0; i < 3; i++) surco(g, ram, 1, x - 2 + i * 2.2, y - 3, x - 2.4 + i * 2.5, y - 6, ram);
    pon(g, ram, 4, [x - 4, y - 7], [x - 2, y - 8], [x - 3, y - 1]);
    pon(g, ram, 1, [x + 1, y + 3], [x + 2, y + 2], [x + 3, y + 3]);
  }
  /* Palma hacia arriba, plana, bajo el cristal del brujo. */
  function palmaArriba(g, mx, my, ram) {
    const c = capa().ell(mx + 1, my, 5, 2.4).linea(mx + 5, my - 1, mx + 6.5, my - 4, 2).rect(mx - 4, my - 2, 2, 2);
    c.pintar(g, ram, { relieve: 2.2, separar: true });
    pon(g, ram, 1, [mx - 1, my + 2], [mx + 1, my + 2], [mx + 3, my + 2]);
    pon(g, ram, 4, [mx - 2, my - 2], [mx - 1, my - 2], [mx, my - 2]);
  }
  function codoIK(Hm, M, l1, l2, pref) {
    let dx = M[0] - Hm[0], dy = M[1] - Hm[1], d = Math.hypot(dx, dy) || 1;
    const max = l1 + l2 - 0.4;
    if (d > max) { M = [Hm[0] + (dx / d) * max, Hm[1] + (dy / d) * max]; dx = M[0] - Hm[0]; dy = M[1] - Hm[1]; d = max; }
    const a = Math.acos(lim((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), b = Math.atan2(dy, dx);
    const e1 = [Hm[0] + Math.cos(b + a) * l1, Hm[1] + Math.sin(b + a) * l1], e2 = [Hm[0] + Math.cos(b - a) * l1, Hm[1] + Math.sin(b - a) * l1];
    const p = (e) => (e[0] - Hm[0]) * pref[0] + (e[1] - Hm[1]) * pref[1];
    return [p(e1) >= p(e2) ? e1 : e2, M];
  }
  function brazoLibre(g, t, piel, m, Hm, E, M) {
    const gr = t.grosor;
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const Wm = [M[0] - ux * 3, M[1] - uy * 3];
    const sup = capa().linea(Hm[0], Hm[1], E[0], E[1], gr + 2);
    const inf = capa().linea(E[0], E[1], Wm[0], Wm[1], gr + (m.ancha ? 2 : 0));
    sup.pintar(g, m.sup || piel, { relieve: 4.8, separar: true });
    inf.pintar(g, m.inf || piel, { relieve: 4.4, separar: true });
    if (!m.ancha && !m.brazal && (m.inf || piel) === piel) pon(g, piel, 3, [Math.round(E[0]), Math.round(E[1]) - 2], [Math.round(E[0]) - 1, Math.round(E[1]) - 1]);
    if (m.ancha) mangaAncha(g, m, E, Wm);
    else if ((m.inf || piel) !== piel && m.inf !== m.guante) puno0(g, m.inf, E, Wm, gr);
    if (m.brazal) brazal(g, m.brazal, inf, E, Wm, gr);
  }
  /* Luz de magia: halo redondo por bandas limpias con el corazón blanco, cuatro rayos y unas motas. */
  function luzMagia(g, x, y, ram, grande = true) {
    x = Math.round(x); y = Math.round(y);
    const R0g = grande ? 5.4 : 3.4;
    for (let j = -8; j <= 8; j++) for (let i = -8; i <= 8; i++) {
      const d = Math.hypot(i, j);
      if (d > R0g + 0.3) continue;
      const k = d <= R0g * 0.3 ? -1 : d <= R0g * 0.55 ? 4 : d <= R0g * 0.8 ? 3 : 2;
      if (k === -1) g.set(x + i, y + j, BRILLO, ram); else pon(g, ram, k, [x + i, y + j]);
    }
    const L = grande ? 10 : 6;
    for (let s = Math.ceil(R0g); s <= L; s++) {
      const k = s > L - 2 ? 1 : s > L - 4 ? 2 : 3;
      pon(g, ram, k, [x + s, y], [x - s, y], [x, y + s], [x, y - s]);
    }
    if (grande) {
      for (let s = 4; s <= 6; s++) pon(g, ram, s > 5 ? 1 : 2, [x + s, y - s], [x - s, y + s], [x + s, y + s], [x - s, y - s]);
      for (const [i, j] of [[x + 9, y - 8], [x - 8, y + 7], [x + 10, y + 6]]) chispa(g, ram, i, j, false);
    }
  }
  /* Estela del golpe: arco claro alrededor de «c» de a0 a a1 (grados de pantalla), que se afina y se apaga hacia a0.
     Se pinta después del contorno y solo en los huecos, sin línea, como un barrido de movimiento. */
  function estela(g, c, r, a0, a1, ancho) {
    const pasos = Math.ceil(Math.abs(a1 - a0) * r / 18) + 10;
    const vistos = new Set();
    for (let s = 0; s <= pasos; s++) {
      const u = s / pasos, a = ((a0 + (a1 - a0) * u) * Math.PI) / 180;
      const gr = 0.6 + ancho * Math.pow(u, 0.8);
      for (let e = -gr; e <= gr + 0.01; e += 0.4) {
        const X = Math.round(c[0] + Math.cos(a) * (r + e)), Y = Math.round(c[1] + Math.sin(a) * (r + e));
        const k = X + Y * W;
        if (vistos.has(k) || X < 1 || Y < 1 || X > W - 2 || Y > H - 4 || g.get(X, Y)) continue;
        if (u < 0.2 && (s & 1)) continue;
        vistos.add(k);
        const tn = u > 0.75 ? 4 : u > 0.45 ? 3 : u > 0.2 ? 2 : 1;
        const fuera = e > gr - 1.2, dentro = e < -gr + 0.8;
        g.set(X, Y, ESTELA[Math.max(1, tn - (dentro ? 2 : fuera ? 1 : 0))], ESTELA);
      }
    }
  }
  /* Rayas rectas de velocidad (estocadas, flechas): solo en los huecos, en trazos que se alargan hacia la punta. */
  function rayas(g, x0, x1, y, tn = 3) {
    x0 = Math.round(x0); x1 = Math.round(x1);
    for (let x = x0; x <= x1; x++) {
      if (x < 1 || x > W - 2 || g.get(x, y)) continue;
      const u = (x - x0) / Math.max(1, x1 - x0);
      if (u < 0.45 && ((x - x0) % 6) > 2 + u * 6) continue;
      g.set(x, y, ESTELA[u > 0.7 ? tn : Math.max(1, tn - 1)], ESTELA);
    }
  }

  const ARMA = { guerrero: "espada", barbaro: "hacha", picaro: "daga", explorador: "arco", mago: "baston", brujo: "cristal", clerigo: "maza", bardo: "laud" };
  function dibujarArma(g, tipo, M, o) {
    const m = marco(M[0], M[1], o.ang || 0);
    switch (tipo) {
      case "espada": espadaL(g, m, o.largo || 40); return m.at(0, -(o.largo || 40));
      case "hacha": hachaL(g, m); return m.at(16, -32);
      case "daga": dagaL(g, m); return m.at(0, -24);
      case "maza": mazaL(g, m); return m.at(0, -26);
      case "baston": return bastonL(g, m, o.arriba || 28, o.abajo || 40);
      case "arco": arcoL(g, m, o.alto || 36, o.bajo || 36, o.cuerda || null); return m.at(8, 0);
      case "laud": return laudL(g, m);
      case "cristal": { const [X, Y] = m.at(o.cx || 0, o.cy || -20); cristal(g, X, Y); return [X, Y]; }
    }
    return M;
  }
  const cacheCaja = new Map();
  function cajaArma(tipo, o) {
    const clave = [tipo, o.ang, o.largo, o.arriba, o.abajo, o.alto, o.bajo, o.cx, o.cy].join();
    if (cacheCaja.has(clave)) return cacheCaja.get(clave);
    const g = new Rejilla(W, H);
    dibujarArma(g, tipo, [64, 64], o);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.get(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const caja = { x0: x0 - 64, y0: y0 - 64, x1: x1 - 64, y1: y1 - 64 };
    cacheCaja.set(clave, caja);
    return caja;
  }
  /* Corchea para el bardo. */
  function nota(g, x, y, ram) {
    x = Math.round(x); y = Math.round(y);
    const c = capa().ell(x, y, 2.4, 1.8).rect(x + 2, y - 9, 2, 9).linea(x + 3, y - 9, x + 6, y - 6, 2);
    c.pintar(g, ram, { relieve: 1.4, min: 2 });
    pon(g, ram, 4, [x - 1, y - 1], [x + 2, y - 8]);
  }

  function planPose(pose, tipo, clase) {
    const B = (d, mano, pref = [0, 1], mas = {}) => Object.assign({ d, mano, pref }, mas);
    const luzC = LUZ[clase] || LUZ.neutro;
    const colgando = B([-4, 11], "colgando", [-1, 0]);
    if (pose === "ataque") {
      const atras = B([-8, 8], "puno", [0, 1]);
      switch (tipo) {
        case "espada": return { cerca: B([8, 4], "puno"), lejos: null, arma: { tipo, ang: 118 }, escudo: [-4, 18], estela: { barrido: 115, ancho: 5 } };
        case "hacha": return { cerca: B([10, 7], "puno"), lejos: B([0, 0], "puno", [0, 1], { mango: 7 }), arma: { tipo, ang: 118 }, estela: { barrido: 120, ancho: 5 } };
        case "daga": return { cerca: B([12, 4], "puno"), lejos: atras, arma: { tipo, ang: 100 }, rayas: true, luz: { en: "arma", ram: LUZ.neutro, d: [2, 0], grande: false } };
        case "arco": return { cerca: B([12, -1], "puno", [0, 1]), lejos: null, arma: { tipo, ang: 0, cuerda: null }, flecha: true, suelta: true };
        case "baston": return { cerca: B([9, 2], "puno"), lejos: colgando, arma: { tipo, ang: 74, arriba: 30, abajo: 34 }, luz: { en: "arma", ram: LUZ.mago, d: [6, -2], grande: false }, rayas: true };
        case "cristal": return { cerca: B([12, 0], "abierta"), lejos: colgando, arma: { tipo, ang: 0, cx: 12, cy: -6 }, luz: { en: "arma", ram: LUZ.brujo, d: [10, 2], grande: false }, rayas: true };
        case "maza": return { cerca: B([10, 5], "puno"), lejos: colgando, arma: { tipo, ang: 122 }, estela: { barrido: 115, ancho: 4.8 }, simbolo: true };
        case "laud": return { cerca: B([9, 5], "puno"), lejos: colgando, arma: { tipo, ang: 38, antes: true }, luz: { en: "arma", ram: LUZ.bardo, d: [4, -2], grande: false }, nota: true };
      }
      return { cerca: B([12, 2], "puno"), lejos: atras, arma: null, rayas: true };
    }
    if (pose === "conjuro") {
      const alzada = B([8, -9], "abierta", [1, 1]);
      const atras = B([6, -9], "abierta", [1, 1]);
      const luzMano = ram => ({ en: "mano", ram, d: [2, -15], grande: true });
      switch (tipo) {
        case "espada": return { cerca: B([7, -7], "puno", [1, 1]), lejos: null, arma: { tipo, ang: 32 }, escudo: [6, 14], luz: { en: "arma", ram: LUZ.neutro, d: [0, 0], grande: true } };
        case "hacha": return { cerca: alzada, lejos: B([-3, 11], "puno", [-1, 0]), arma: { tipo, ang: -18, en: "lejos" }, luz: luzMano(LUZ.neutro) };
        case "daga": return { cerca: alzada, lejos: B([-3, 10], "puno", [-1, 0]), arma: { tipo, ang: 180, en: "lejos" }, luz: luzMano(LUZ.neutro) };
        case "arco": return { cerca: alzada, lejos: B([-2, 10], "puno", [-1, 0]), arma: { tipo, ang: 0, en: "lejos", alto: 30, bajo: 28 }, luz: luzMano(LUZ.neutro) };
        case "baston": return { cerca: B([7, -6], "puno", [1, 1]), lejos: atras, arma: { tipo, ang: 12, arriba: 30, abajo: 44 }, luz: { en: "arma", ram: LUZ.mago, d: [8, -8], grande: true } };
        case "cristal": return { cerca: B([9, -7], "palma", [1, 1]), lejos: atras, arma: { tipo, ang: 0, cx: 2, cy: -18 }, luz: { en: "arma", ram: LUZ.brujo, d: [10, -6], grande: true } };
        case "maza": return { cerca: alzada, lejos: B([-3, 9], "puno", [-1, 0]), arma: { tipo, ang: 180, en: "lejos" }, luz: luzMano(LUZ.clerigo) };
        case "laud": return { cerca: B([7, -3], "puno", [1, 1]), lejos: atras, arma: { tipo, ang: -12, antes: true }, luz: { en: "arma", ram: LUZ.bardo, d: [6, -4], grande: true }, nota: true };
      }
      return { cerca: alzada, lejos: atras, arma: null, luz: luzMano(luzC) };
    }
    if (pose === "herido") {
      const atras = B([-10, 1], "abierta", [0, 1]);
      const fuera = B([9, 6], "puno", [0, 1]);
      switch (tipo) {
        case "espada": return { cerca: B([8, 8], "puno"), lejos: null, arma: { tipo, ang: 38 }, escudo: [0, 8] };
        case "hacha": return { cerca: B([8, 8], "puno"), lejos: atras, arma: { tipo, ang: 42 } };
        case "daga": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 205 } };
        case "arco": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 22, alto: 32, bajo: 28 } };
        case "baston": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 24, arriba: 28, abajo: 40 } };
        case "cristal": return { cerca: B([9, 5], "abierta"), lejos: atras, arma: { tipo, ang: 0, cx: 14, cy: -14 } };
        case "maza": return { cerca: B([8, 8], "puno"), lejos: atras, arma: { tipo, ang: 40 } };
        case "laud": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 28, antes: true } };
      }
      return { cerca: B([9, 5], "abierta"), lejos: atras, arma: null };
    }
    if (pose === "victoria") {
      const arriba = B([9, -11], "puno", [1, 0]);
      const otra = B([-1, -12], "puno", [-1, 0]);
      switch (tipo) {
        case "espada": return { cerca: arriba, lejos: null, arma: { tipo, ang: 40 }, escudo: [4, 16] };
        case "hacha": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 22 } };
        case "daga": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 15 } };
        case "arco": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 10, alto: 28, bajo: 24 } };
        case "baston": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 6, arriba: 26, abajo: 48 }, luz: { en: "arma", ram: LUZ.mago, d: [8, -6], grande: false } };
        case "cristal": return { cerca: B([9, -11], "palma", [1, 0]), lejos: otra, arma: { tipo, ang: 0, cx: 2, cy: -18 }, luz: { en: "arma", ram: LUZ.brujo, d: [10, -4], grande: false } };
        case "maza": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 15 } };
        case "laud": return { cerca: B([10, -9], "puno", [1, 0]), lejos: otra, arma: { tipo, ang: -30, antes: true }, nota: true };
      }
      return { cerca: arriba, lejos: otra, arma: null };
    }
    return null;
  }

  /* Símbolo sagrado colgando de una cadena. */
  function simboloSagrado(g, ax, ay) {
    ax = Math.round(ax); ay = Math.round(ay);
    for (let j = ay + 6; j <= ay + 13; j++) pon(g, ORO, (j & 1) ? 2 : 4, [ax, j]);
    capa().ell(ax, ay + 17, 3.6, 3.6).pintar(g, ORO, { relieve: 2.4, min: 2 });
    destello(g, ORO, ax - 2, ay + 15);
    pon(g, ORO, 2, [ax - 6, ay + 17], [ax + 6, ay + 17], [ax, ay + 23], [ax - 4, ay + 21], [ax + 4, ay + 21]);
    pon(g, ORO, 3, [ax - 5, ay + 17], [ax + 5, ay + 17], [ax, ay + 22]);
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
    if (A && A.tipo === "espada") A.largo = t.bajo ? 42 : 52;
    const conArmaEn = A ? (A.en === "lejos" ? L : C) : null;
    /* Que el arma quepa: se acorta la espada o se recoge la mano. */
    if (A && conArmaEn) for (let it = 0; it < 10; it++) {
      const [, M] = codoIK(conArmaEn.Hm, conArmaEn.M, l1, l2, conArmaEn.pref);
      conArmaEn.M = M;
      const b = cajaArma(A.tipo, A);
      const dr = M[0] + b.x1 - 122, du = 3 - (M[1] + b.y0), dl = 3 - (M[0] + b.x0), dd = M[1] + b.y1 - 123;
      if (dr <= 0 && du <= 0 && dl <= 0 && dd <= 0) break;
      if (A.tipo === "espada" && A.largo > 26 && (dr > 0 || du > 0)) { A.largo = Math.max(26, A.largo - Math.max(2, Math.max(dr, du))); continue; }
      conArmaEn.M = [M[0] - Math.max(0, dr) + Math.max(0, dl), M[1] + Math.max(0, du) - Math.max(0, dd)];
    }
    for (const X of [C, L]) if (X) { const [E, M] = codoIK(X.Hm, X.M, l1, l2, X.pref); X.E = E; X.M = M; }
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
      else if (X.mano === "colgando") mano(gg, Math.round(x) - 1, Math.round(y), ram, true);
    };
    let punta = null;
    /* 1. El brazo de atrás (con su arma si la lleva él), por detrás de todo. */
    if (L) detras(g, gb => {
      brazoLibre(gb, t, piel, manga, L.Hm, L.E, L.M);
      if (A && A.en === "lejos") punta = dibujarArma(gb, A.tipo, L.M, A);
      ponMano(gb, L);
      if (pl.simbolo || (L.mano === "colgando" && clase === "clerigo" && conArma && !extra)) simboloSagrado(gb, L.M[0], L.M[1] + 2);
    });
    /* 2. El escudo delante del cuerpo. */
    if (pl.escudo) escudo(g, t.torR + pl.escudo[0], t.torTop + pl.escudo[1], tela);
    /* 3. El brazo de delante y su arma (el laúd va por debajo del brazo). */
    const tX = Object.assign({}, t, { mano: [Math.round(C.M[0]), Math.round(C.M[1])], piel });
    if (A && A.en !== "lejos" && A.antes) punta = dibujarArma(g, A.tipo, C.M, A);
    if (extra && nombreExtra !== "martillo") OBJETOS_EXTRA[nombreExtra](g, tX);
    brazoLibre(g, t, piel, manga, C.Hm, C.E, C.M);
    if (A && A.en !== "lejos" && !A.antes) punta = dibujarArma(g, A.tipo, C.M, A);
    if (extra && nombreExtra === "martillo") OBJETOS_EXTRA.martillo(g, tX);
    else ponMano(g, C);
    /* 4. Lo que va sobre el hombro. */
    if (clase === "guerrero" || clase === "clerigo") hombrera(g, t);
    if (clase === "bardo") mangaAbullonada(g, t, tela);
    /* 5. Luz de la magia y destellos. */
    if (pl.luz) {
      const base = pl.luz.en === "arma" && punta ? punta : C.M;
      luzMagia(g, base[0] + pl.luz.d[0], base[1] + pl.luz.d[1], pl.luz.ram, pl.luz.grande);
    }
    if (pl.nota && punta) { nota(g, Math.min(punta[0] - 6, 112), Math.max(punta[1] - 8, 14), LUZ.bardo); nota(g, Math.min(punta[0] + 4, 120), Math.max(punta[1] - 16, 12), LUZ.bardo); }
    /* La mano que suelta la cuerda sale despedida hacia atrás, junto al hombro. */
    if (pl.suelta) {
      const hx = t.cx - 2, hy = t.torTop + 4;
      capa().linea(t.torL + 4, t.torTop + 10, hx, hy + 2, t.grosor).pintar(g, manga.sup === PLACA ? PLACA : piel, { relieve: 3.2, separar: true });
      manoAbierta(g, hx, hy, piel);
    }
    /* La flecha ya se va: solo asoma su punta en el borde. */
    if (pl.flecha) {
      const y = Math.round(C.M[1]) - 2;
      pon(g, ACERO, 4, [118, y], [119, y], [120, y]); pon(g, ACERO, 2, [118, y - 1], [118, y + 1], [117, y - 2], [117, y + 2]); pon(g, ACERO, 3, [121, y]);
      pon(g, MADERA, 3, [113, y], [114, y], [115, y], [116, y]);
    }
    const post = [];
    if (pl.estela && punta) {
      const [hx, hy] = t.hombro, r = Math.hypot(punta[0] - hx, punta[1] - hy) - 3, a1 = (Math.atan2(punta[1] - hy, punta[0] - hx) * 180) / Math.PI;
      post.push(gg => estela(gg, t.hombro, r, a1 - pl.estela.barrido, a1 - 6, pl.estela.ancho));
    }
    if (pl.rayas) {
      const y = Math.round(C.M[1]), x = Math.round(C.M[0]), x1 = punta ? Math.min(Math.round(punta[0]) - 4, 120) : x + 8;
      post.push(gg => { rayas(gg, x - 12, x1, y - 8); rayas(gg, x - 8, x1 - 4, y + 8); rayas(gg, x - 16, x1 - 8, y - 14, 2); });
    }
    if (pl.flecha) {
      const y = Math.round(C.M[1]) - 2, x = Math.round(C.M[0]);
      post.push(gg => { rayas(gg, x + 10, 112, y, 4); rayas(gg, x + 18, 110, y - 4, 3); rayas(gg, x + 18, 110, y + 4, 3); });
    }
    return post;
  }

  /* Manga abullonada del bardo, con cuchilladas granates. */
  function mangaAbullonada(g, t, tela) {
    const [hx, hy] = t.hombro;
    capa().ell(hx + 1, hy + 2, 6.8, 6.8).pintar(g, tela, { relieve: 4.8, separar: true });
    for (const i of [hx - 2, hx + 2, hx + 6]) { pon(g, R.tela.granate, 3, [i, hy - 1], [i, hy], [i, hy + 1], [i, hy + 2]); pon(g, R.tela.granate, 1, [i, hy + 3], [i, hy + 4]); pon(g, tela, 4, [i - 1, hy - 1], [i - 1, hy]); }
  }

  /* Objetos extra para personajes no jugadores (los mismos que HEROES_64.OBJETOS_EXTRA, a 128×128). */
  const OBJETOS_EXTRA = {
    martillo(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx - 2, my - 24, 4, 36).pintar(g, MADERA, { relieve: 2, min: 1 });
      surco(g, MADERA, 4, mx - 2, my - 20, mx - 2, my + 10, MADERA);
      capa().rect(mx - 10, my - 36, 20, 14).pintar(g, R.hierro, { relieve: 4.8, separar: true });
      for (let i = mx - 9; i <= mx + 9; i++) pon(g, R.hierro, 4, [i, my - 36]);
      destello(g, R.hierro, mx - 7, my - 34, true);
      puno(g, mx, my, t.piel || R.piel.clara);
    },
    caduceo(g, t) {
      const [mx] = t.mano;
      capa().rect(mx - 2, 16, 4, t.suelo - 16).pintar(g, R.bronce, { relieve: 2, min: 2 });
      capa().ell(mx, 12, 4.8, 4.8).pintar(g, R.bronce, { relieve: 2, min: 3 });
      for (let y = 24; y < 64; y++) { const ox = Math.round(Math.sin(y * 0.4) * 5); pon(g, R.hoja, 3, [mx + ox, y], [mx + ox + 1, y]); }
      for (const s of [-1, 1]) capa().poly([[mx + s * 2, 16], [mx + s * 14, 10], [mx + s * 10, 18]]).pintar(g, R.hueso, { relieve: 1.6, min: 2 });
    },
    copa(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 1, my - 12, 7, 5).borrarHasta(my - 13).pintar(g, R.oricalco, { relieve: 2.4, min: 2 });
      capa().rect(mx, my - 8, 3, 7).pintar(g, R.oricalco, { relieve: 1.6, min: 2 });
      for (let i = mx - 5; i <= mx + 7; i++) pon(g, R.sangre, 3, [i, my - 13]);
    },
    odre(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 2, my + 7, 10, 8).pintar(g, CUERO, { relieve: 4.8 });
      costura(g, CUERO, mx - 6, my + 7, mx + 10, my + 7, 1);
      pon(g, CUERO, 1, [mx + 12, my + 4], [mx + 12, my + 5]);
    },
    cayado(g, t) {
      const [mx] = t.mano;
      capa().rect(mx - 2, 22, 4, t.suelo - 22).curva(mx - 1, 22, mx, 8, mx + 12, 14, 4, 4).pintar(g, MADERA, { relieve: 2, min: 2 });
      surco(g, MADERA, 4, mx - 2, 26, mx - 2, t.suelo - 4, MADERA);
    },
    anillo(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 3, my - 9, 2.6, 2.6).quitarEll(mx + 3, my - 9, 1, 1).pintar(g, R.bronce, { relieve: 1.4, min: 2 });
      pon(g, R.hueso, 4, [mx + 10, my - 16], [mx - 2, my - 16]);
    },
    balanza(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx, my - 22, 2, 22).rect(mx - 12, my - 22, 26, 2).pintar(g, R.bronce, { plano: 3 });
      capa().rect(mx - 14, my - 10, 10, 2).rect(mx + 6, my - 10, 10, 2).pintar(g, R.bronce, { plano: 2 });
      for (const i of [mx - 13, mx - 5, mx + 7, mx + 15]) surco(g, R.bronce, 1, mx + (i < mx ? -11 : 13), my - 20, i, my - 11, null);
    }
  };

  /* ---------- Composición ---------- */
  const PIERNAS = {
    guerrero: { ramPierna: PLACA, ramBota: PLACA, rodillera: PLACA, alto: 18 },
    clerigo: { ramPierna: MALLA, ramBota: CUERO, alto: 18 },
    picaro: { ramPierna: R.tela.negro, ramBota: CUERO2, alto: 24 },
    explorador: { ramPierna: CALZAS, ramBota: CUERO, alto: 22 },
    bardo: { ramPierna: R.tela.negro, ramBota: CUERO, alto: 16, puntera: ORO },
    barbaro: { ramPierna: null, ramBota: PELLIZA, alto: 18 }
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
    const t = plantilla(typeof a.cuerpo === "string" && CUERPOS[a.cuerpo] ? a.cuerpo : vis.cuerpo || "normal");
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
      t.codo = [t.torR + 8, t.torTop + 8];
      t.mano = [t.torR + 16, t.torTop + 10];
      t.tiro = [t.cx + 6, t.torTop + 10];
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
      capa().linea(hx, hy, hx - 10, hy + 2, t.grosor + 2).pintar(g, manga.sup, { relieve: 4, max: 2 });
    }
    const descalzo = raza === "mediano" && !["guerrero", "clerigo"].includes(clase);
    const op = Object.assign({ ramPierna: CALZAS, ramBota: CUERO2, alto: 12 }, PIERNAS[clase] || {});
    if (descalzo) op.descalzo = true;
    if (!largas || raza === "satiro") piernas(g, t, piel, raza, ramPelo, op);
    else if (draco) {
      /* Garras asomando bajo la túnica. */
      for (const x0 of [t.pieAtras - 8, t.pieDelante - 2]) {
        capa().rect(x0, t.suelo - 4, 14, 5).ell(x0 + 12, t.suelo - 1, 2.4, 2).borrarDesde(t.suelo + 1).pintar(g, piel, { relieve: 2.4, separar: true });
        for (const dx of [5, 9, 14]) { pon(g, R.hueso, 4, [x0 + dx, t.suelo - 1]); pon(g, R.hueso, 3, [x0 + dx, t.suelo], [x0 + dx + 1, t.suelo]); }
      }
    } else if (raza === "mediano") piernas(g, t, piel, raza, ramPelo, { descalzo: true });
    else {
      /* Zapatos puntiagudos asomando bajo la túnica. */
      for (const [x0, at] of [[t.pieAtras - 6, true], [t.pieDelante - 2, false]]) {
        const z = capa().rect(x0, t.suelo - 4, 14, 5).ell(x0 + 13, t.suelo - 1, 2.4, 1.6).off(x0, t.suelo - 4).off(x0 + 1, t.suelo - 4);
        z.borrarDesde(t.suelo + 1);
        z.pintar(g, CUERO2, { relieve: 2.4, max: at ? 2 : 4, separar: true });
        for (let i = x0; i <= x0 + 15; i++) if (z.tiene(i, t.suelo)) pon(g, CUERO2, 0, [i, t.suelo]);
        if (!at) pon(g, CUERO2, 4, [x0 + 10, t.suelo - 3], [x0 + 11, t.suelo - 3]);
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
      /* Pintura de guerra: franja en zigzag bajo los ojos y dos rayas en la mejilla del otro lado. */
      const y = t.ojoY, a1 = t.ojo1;
      for (let i = a1 - 4; i <= a1 + 6; i++) {
        const j = y + 4 + ((i >> 1) & 1);
        for (const jj of [j, j + 1]) if (g.rampa(i, jj) === piel) pon(g, R.sangre, jj === j ? 3 : 2, [i, jj]);
      }
      for (const dx of [0, 3]) for (let s = 0; s < 4; s++) { const i = t.ojo2 + 1 + dx - s, j = y + 4 + s; if (g.rampa(i, j) === piel) pon(g, R.sangre, 3, [i, j]); }
    }
    /* Con sombrero, los cuernos del tiefling van debajo y asoman por detrás del ala. */
    const bajoSombrero = clase === "mago" || clase === "bardo";
    if (bajoSombrero && raza === "tiefling") cuernos(g, t, raza);
    tocado(g, t, clase, tela, piel);
    if (!bajoSombrero && (clase !== "guerrero" || raza === "tiefling")) cuernos(g, t, raza);
    if (clase === "picaro" && !draco) {
      /* Embozo que tapa nariz y boca, con sus pliegues y el borde iluminado. */
      const em = capa().rect(t.cabX - 2, t.ojoY + 4, 24, 12).poly([[t.cabX - 2, t.bocaY + 4], [t.cabX + 18, t.bocaY + 2], [t.cabX + 12, t.bocaY + 10], [t.cabX, t.bocaY + 10]]);
      em.recortar(capa().ell(t.cabX + 1, t.cabY + 1, t.cabRx + 2.6, t.cabRy + 2.2));
      em.pintar(g, tela, { relieve: 4, separar: true });
      surco(g, tela, 1, t.cabX + 2, t.bocaY, t.cabX + 16, t.bocaY - 2, tela);
      surco(g, tela, 3, t.cabX + 2, t.bocaY - 1, t.cabX + 16, t.bocaY - 3, tela);
      surco(g, tela, 3, t.cabX + 2, t.ojoY + 4, t.cabX + 18, t.ojoY + 4, tela);
      surco(g, tela, 4, t.cabX + 4, t.ojoY + 5, t.cabX + 14, t.ojoY + 5, tela);
      surco(g, tela, 1, t.cabX + 4, t.bocaY + 4, t.cabX + 14, t.bocaY + 2, tela);
    }
    let tt = t, post = [];
    if (P) {
      /* Inclina el tronco y la cabeza, y dibuja brazos y armas ya en su sitio inclinado. */
      cizallar(g, P.desp);
      tt = mover(Object.assign({}, t), P.desp(t.torTop + 6), 0);
      post = armarPose(g, tt, { pose, clase, piel, tela, manga, conArma, extra, objeto: a.objeto });
    } else if (clase === "guerrero" && conArma) {
      /* El escudo tapa el brazo; el puño asoma a su lado con la espada. */
      t.mano = [t.torR + 24, t.torTop + (t.bajo ? 16 : 18)];
      brazoDelante(g, t, piel, manga, false);
      hombrera(g, t);
      escudo(g, t.torR + 6, t.torTop + (t.bajo ? 10 : 12), tela);
      const largo = Math.min(t.bajo ? 44 : 54, t.mano[1] - 8);
      dibujarArma(g, "espada", t.mano, { ang: 0, largo });
      puno(g, t.mano[0], t.mano[1], PLACA);
    } else if (clase === "brujo" && conArma) {
      /* Mano abierta con la palma hacia arriba bajo el cristal, rodeado de chispas. */
      brazoDelante(g, t, piel, manga, false);
      const [mx, my] = t.mano;
      palmaArriba(g, mx, my, piel);
      const cx = mx + 6, cy = my - 20;
      cristal(g, cx, cy);
      for (const [i, j, gr] of [[cx - 10, cy - 8, true], [cx + 10, cy - 12, false], [cx + 12, cy + 4, true], [cx - 8, cy + 6, false], [cx + 2, cy + 15, false]]) chispa(g, R.magia, i, j, gr);
    } else {
      const [mx, my] = t.mano;
      if (extra) OBJETOS_EXTRA[a.objeto](g, t);
      else if (conArma) {
        if (clase === "barbaro") dibujarArma(g, "hacha", [mx + 1, my], { ang: 9.5 });
        else if (clase === "picaro") dibujarArma(g, "daga", [mx, my + 2], { ang: 166 });
        else if (clase === "explorador") {
          dibujarArma(g, "arco", [mx, my], { ang: 0, alto: t.bajo ? 34 : 42, bajo: t.bajo ? 30 : 40, cuerda: t.tiro });
          /* Flecha montada: astil, punta de acero y plumas. */
          const [dx, dy] = t.tiro, ax = mx + 4;
          for (let i = dx - 2; i <= ax + 16; i++) pon(g, MADERA, i % 3 ? 3 : 2, [i, dy]);
          capa().poly([[ax + 16, dy - 3], [ax + 23, dy], [ax + 16, dy + 3]]).pintar(g, ACERO, { relieve: 1.6, min: 2 });
          pon(g, ACERO, 4, [ax + 17, dy - 1], [ax + 18, dy - 1]);
          for (const [sy, k] of [[-1, 3], [-2, 3], [1, 2], [2, 2]]) pon(g, R.tela.granate, k, [dx - 6, dy + sy], [dx - 5, dy + sy], [dx - 4, dy + sy]);
          pon(g, R.tela.granate, 4, [dx - 6, dy - 2]);
        } else if (clase === "mago") {
          const oy = Math.max(10, t.cabY - 20);
          const [X, Y] = dibujarArma(g, "baston", [mx, my], { ang: 0, arriba: my - oy, abajo: t.suelo - my });
          chispa(g, R.mar, X + 12, Y - 6, true); chispa(g, R.mar, X - 10, Y + 12, false); chispa(g, R.mar, X + 10, Y + 8, false);
        } else if (clase === "clerigo") dibujarArma(g, "maza", [mx, my], { ang: 0 });
        else if (clase === "bardo") dibujarArma(g, "laud", [mx, my], { ang: 0 });
        else if (clase === "guerrero") dibujarArma(g, "espada", [mx, my], { ang: 0, largo: Math.min(52, my - 8) });
      }
      if (!extra || a.objeto !== "martillo") brazoDelante(g, t, piel, manga, !arquero);
      if (arquero) puno(g, mx, my, piel);
    }
    if (arquero && !P) {
      /* Mano que tensa la cuerda, delante del pecho, con el antebrazo cruzado y el brazal. */
      const [dx, dy] = t.tiro;
      capa().linea(t.torL + 4, t.torTop + 8, dx - 4, dy, t.grosor).pintar(g, piel, { relieve: 3.2, separar: true });
      capa().ell(dx - 1, dy, 3.6, 3.6).pintar(g, piel, { relieve: 2.4, separar: true });
      pon(g, piel, 1, [dx - 1, dy + 1], [dx, dy + 2], [dx + 1, dy + 1]); pon(g, piel, 4, [dx - 3, dy - 3], [dx - 2, dy - 3]);
      for (let i = dx - 9; i <= dx - 4; i++) { pon(g, CUERO, 3, [i, dy - 3]); pon(g, CUERO, 2, [i, dy - 2], [i, dy + 2]); pon(g, CUERO, 1, [i, dy + 3]); }
    }
    if (!P && ((clase === "guerrero" && !conArma) || clase === "clerigo")) hombrera(g, t);
    if (clase === "bardo" && !P) mangaAbullonada(g, t, tela);
    if (clase === "barbaro") {
      /* Pelliza de lobo sobre el hombro de atrás y la nuca, con la cabeza del lobo en el hombro de delante. */
      const pz = capa().ell(tt.torL + 8, tt.torTop + 2, 13, 5.6).ell(tt.torL + 2, tt.torTop + 6, 8, 11);
      const [x0, y0, x1, y1] = pz.caja();
      for (let i = x0; i <= x1; i++) { const corte = (i % 4 + 4) % 4; for (let j = y0; j <= y1; j++) if (pz.tiene(i, j) && !pz.tiene(i, j + 3 - Math.abs(corte - 1.5) * 1.5)) pz.off(i, j); }
      pz.pintar(g, PELLIZA, { relieve: 5.6, separar: true });
      pelaje(g, PELLIZA, tt.torL - 12, tt.torTop - 8, tt.torR + 12, tt.torTop + 18);
      const [hx, hy] = tt.hombro;
      const lobo = capa().ell(hx - 2, hy - 2, 8.8, 6.8).poly([[hx + 2, hy - 7], [hx + 17, hy - 3], [hx + 17, hy + 3], [hx + 2, hy + 5]]).poly([[hx - 9, hy - 4], [hx - 7, hy - 16], [hx - 1, hy - 7]]);
      lobo.pintar(g, LOBO, { relieve: 4.4, min: 1 });
      perfilar(g, lobo);
      pelaje(g, LOBO, hx - 12, hy - 10, hx + 2, hy + 6);
      /* Oreja, ceño, ojo ámbar con brillo, trufa y colmillos. */
      pon(g, LOBO, 1, [hx - 6, hy - 10], [hx - 6, hy - 9], [hx - 5, hy - 8], [hx - 6, hy - 11]); pon(g, LOBO, 4, [hx - 8, hy - 13], [hx - 8, hy - 12], [hx - 4, hy - 6], [hx - 3, hy - 7]);
      for (let i = hx; i <= hx + 7; i++) pon(g, LOBO, 1, [i, hy - 4]);
      sello(g, hx + 1, hy - 3, ["KKAA", "KAHK"], { K: [OJOS], A: ["#e0a83a"], H: [BRILLO] });
      pon(g, LOBO, 0, [hx + 16, hy - 2], [hx + 16, hy - 1], [hx + 15, hy - 2]); pon(g, LOBO, 4, [hx + 10, hy - 4], [hx + 12, hy - 4], [hx + 15, hy - 3]);
      for (let i = hx + 2; i <= hx + 16; i++) if (g.rampa(i, hy + 2) === LOBO) pon(g, LOBO, 0, [i, hy + 2]);
      for (const i of [hx + 6, hx + 12]) { g.set(i, hy + 4, R.hueso[4], R.hueso); g.set(i, hy + 3, R.hueso[3], R.hueso); g.set(i + 1, hy + 3, R.hueso[2], R.hueso); }
    }
    if (clase === "clerigo" && conArma && !extra && !P) simboloSagrado(g, t.manoAtras[0] - 1, t.manoAtras[1] + 2);
    if (Array.isArray(a.extras)) a.extras.forEach(fn => { if (typeof fn === "function") fn(g, tt, { piel, pelo: ramPelo, tela }); });
    /* De la fila 125 a la 127 solo queda sitio para el contorno: los pies pisan la 124. */
    for (let y = SUELO + 1; y < H; y++) for (let x = 0; x < W; x++) g.quitar(x, y);
    /* En las poses, la fila de arriba y las columnas de los lados también quedan para el contorno. */
    if (P) { for (let x = 0; x < W; x++) g.quitar(x, 0); for (let y = 0; y < H; y++) g.quitar(0, y).quitar(W - 1, y); }
    if (!a.sinContorno) contornoSel(g);
    for (const fn of post) fn(g);
    return a.espejo ? g.espejo() : g;
  }

  window.HEROES_128 = { W, H, RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS, RAMPAS: R, POSES, plantilla, componer, matizar, OBJETOS_EXTRA };
})();
