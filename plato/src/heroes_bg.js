/* Dados y Mazmorras · héroes a 128×128, estilo «Infinity Engine».
   HEROES_BG.componer(aspecto) devuelve una Rejilla NUEVA de 128×128 mirando a la derecha, con los pies en la fila 124
   (de la 125 a la 127 solo queda el contorno). Acepta el mismo aspecto que HEROES_128.componer:
   { raza, clase, piel, pelo, tela, peinado, barba, gesto, pose, cuerpo, objeto, extras, espejo, sinContorno }
   y reutiliza las mismas tablas (RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS), así que todo aspecto guardado sigue valiendo.
   Estilo de los juegos de rol clásicos de los noventa: proporciones realistas (unas siete cabezas; las razas bajas,
   adultas pero más bajas), caras serias de ojos pequeños, paleta terrosa y apagada, luz dura desde arriba a la izquierda
   con sombras hondas, cinco tonos por material, tramado fino en telas y cueros, contorno casi negro por fuera y detalles
   internos marcados con sombra (correas, remaches, malla, pliegues pesados, vetas). */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R0, umbral } = PX;
  const W = 128, H = 128;
  const SUELO = 124;
  const NEGRO = "#0b0908";

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

  /* ---------- Color ---------- */
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

  /* Paleta apagada: menos saturación, sombras más hondas y luces contenidas. Las rampas de PX que más se ven
     tienen su versión pintada a mano; el resto sale de esta fórmula. */
  const CURVA_L = [0.5, 0.72, 0.9, 0.98, 1];
  const cacheApagado = new Map();
  function apagar(ram) {
    if (!Array.isArray(ram)) return ram;
    if (cacheApagado.has(ram)) return cacheApagado.get(ram);
    const o = ram.map((c, i) => {
      if (typeof c !== "string" || c[0] !== "#" || c.length !== 7) return c;
      const [h, s, l] = aHsl(aRgb(c));
      const k = Math.min(i, 4);
      return deHsl(h, s * 0.55, k === 4 ? Math.min(l, 0.8) * 0.93 : l * CURVA_L[k]);
    });
    cacheApagado.set(ram, o);
    return o;
  }
  const A_MANO = {
    piel: {
      clara: ["#3a241c", "#6b4334", "#9c6950", "#c59276", "#e2b99b"],
      oliva: ["#30211a", "#5c412f", "#886344", "#ae8760", "#cda880"],
      morena: ["#22150e", "#432d1e", "#694830", "#8f6647", "#b08463"],
      oscura: ["#140c08", "#2c1c13", "#482f21", "#664632", "#86624a"],
      verde: ["#161b10", "#2d3621", "#495534", "#67764a", "#8b9a68"],
      gris: ["#1a1b1c", "#353839", "#545857", "#777b78", "#9ea19b"],
      roja: ["#200b0a", "#421915", "#682b22", "#8e4434", "#b26651"],
      violeta: ["#170e1c", "#2f1f37", "#4e3556", "#6e5076", "#917096"],
      azul: ["#0e131e", "#1d283b", "#32445d", "#4c6381", "#7187a3"],
      bronce: ["#211508", "#463014", "#715028", "#9b773f", "#c4a162"],
      esmeralda: ["#0c1810", "#1b3222", "#2e5037", "#497150", "#739776"],
      plata: ["#1c1e22", "#393c42", "#5d6168", "#878b92", "#b6b9bd"]
    },
    pelo: {
      negro: ["#0a0807", "#161211", "#251f1e", "#38302e", "#524543"],
      castano: ["#160d08", "#2d1c12", "#4a301f", "#6a4a31", "#8c6947"],
      cobrizo: ["#1d0b05", "#40190c", "#6a2d15", "#924722", "#b36a3b"],
      rubio: ["#2c200f", "#584220", "#886b38", "#b09353", "#d2b97f"],
      canoso: ["#282624", "#53504c", "#817d76", "#aaa59c", "#d0cbc0"],
      violeta: ["#120a16", "#291731", "#44284e", "#623f6d", "#825e8b"]
    },
    tela: {
      terracota: ["#1f1009", "#422518", "#693c25", "#8e5634", "#ae764c"],
      azul: ["#0a0e1a", "#171f38", "#283357", "#3c4a74", "#5c6a93"],
      oliva: ["#10150b", "#232c17", "#3a4625", "#536134", "#72814b"],
      violeta: ["#110a15", "#26192d", "#3d2a46", "#583f62", "#795d83"],
      ocre: ["#1b1209", "#3a2913", "#5c431f", "#7f5f2f", "#a27e46"],
      blanco: ["#38322a", "#5f584b", "#898070", "#b0a690", "#d3c9b2"],
      granate: ["#180706", "#38110f", "#5a1c17", "#7d2e24", "#a04a39"],
      negro: ["#0a090b", "#19171b", "#2a272d", "#403b43", "#5e5862"]
    },
    hueso: ["#27231e", "#4e4738", "#7b725e", "#a49a82", "#cac1a7"],
    sangre: ["#160504", "#320c0a", "#531611", "#78251b", "#9b3b2b"],
    madera: ["#160d07", "#301d11", "#4f331e", "#70502f", "#927148"],
    hierro: ["#121110", "#2a2826", "#474440", "#6c6863", "#9a948c"],
    magia: ["#140a1b", "#2c1440", "#542878", "#8150aa", "#c4a2dc"],
    mar: ["#081018", "#122434", "#1e3d58", "#336486", "#7ca8c6"],
    fuego: ["#3a1206", "#7a2a0c", "#b8521a", "#e08a34", "#f6c870"]
  };
  for (const [k, v] of Object.entries(A_MANO)) {
    if (Array.isArray(v)) { if (R0[k]) cacheApagado.set(R0[k], v); }
    else for (const [k2, v2] of Object.entries(v)) if (R0[k] && R0[k][k2]) cacheApagado.set(R0[k][k2], v2);
  }
  const R = {};
  for (const [k, v] of Object.entries(R0)) {
    if (Array.isArray(v)) R[k] = apagar(v);
    else { R[k] = {}; for (const [k2, v2] of Object.entries(v)) R[k][k2] = apagar(v2); }
  }

  /* ---------- Materiales propios ---------- */
  const OSCURO = [NEGRO, "#1c1512", "#2e2420", "#463a34", "#6a5c54"];
  const ACERO = ["#15171a", "#363a40", "#626870", "#9aa0a7", "#e6e9eb"];      // filos y hojas
  const PLACA = ["#111317", "#2a2f35", "#4a515a", "#7a828b", "#c6cbd0"];      // armadura de placas
  const MALLA = ["#0f1012", "#25272b", "#3f4248", "#61656b", "#8e9398"];      // cota de malla
  const HIERRO = R.hierro;
  const CUERO = ["#170d08", "#352114", "#553720", "#765232", "#97714b"];
  const CUERO2 = ["#100b08", "#231812", "#3a291d", "#533d2c", "#6f5641"];     // cuero oscuro de botas y correas
  const PELLIZA = ["#161517", "#302d30", "#4e4847", "#736a63", "#9d9387"];    // piel de lobo
  const LOBO = ["#131215", "#29282c", "#444247", "#686669", "#94918b"];
  const ORO = ["#221706", "#4b3510", "#7b5c1f", "#a8883c", "#d2b874"];         // oro viejo
  const MADERA = R.madera;
  const PLUMA = ["#2a2723", "#534e48", "#827b70", "#aca495", "#cfc8b8"];
  const HUESO = R.hueso, SANGRE = R.sangre;
  const CALZAS = ["#151009", "#2b2116", "#463524", "#614c35", "#7f6749"];
  const LAUD = ["#1c0e07", "#3d2111", "#62381c", "#8a552c", "#ad7744"];
  const RUNA = ["#101a22", "#1c303c", "#2c5262", "#4a8094", "#a6dbe6"];        // runas del bastón
  const TIEF = ["#2a0a04", "#6a220a", "#b0501a", "#e09440", "#f8d088"];        // ojos del tiefling
  const SANO = ["#1b0f0b", "#3a2a22", "#6d6158", "#a1968a", "#c6bdb0"];        // blanco del ojo, apagado
  const BARBAS = Object.values(R.pelo);
  /* El contorno también lleva rampa (el propio color en todas las posiciones) para que .tenida() lo respete. */
  const cacheRC = new Map();
  const rampaDe = c => { if (!cacheRC.has(c)) cacheRC.set(c, [c, c, c, c, c]); return cacheRC.get(c); };

  /* ---------- Capas a 128×128 ----------
     Como PX.Capa, pero el relieve solo se calcula en la caja de la capa, las líneas gruesas usan pincel redondo,
     las curvas se muestrean según su largo, y el sombreado admite un tramado fino entre bandas (op.tramado). */
  class CapaBG extends Capa {
    copia() { const o = new CapaBG(this.w, this.h); o.m = this.m.slice(); return o; }
    borrarDesde(fila) { this.m.fill(0, Math.max(0, Math.min(this.h, fila)) * this.w); return this; }
    borrarHasta(fila) { this.m.fill(0, 0, Math.max(0, Math.min(this.h, fila)) * this.w); return this; }
    disco(x, y, r) {
      const r2 = r * r + 0.15, w = this.w, m = this.m;
      const j0 = Math.max(0, Math.floor(y - r)), j1 = Math.min(this.h - 1, Math.ceil(y + r));
      const i0 = Math.max(0, Math.floor(x - r)), i1 = Math.min(w - 1, Math.ceil(x + r));
      for (let j = j0; j <= j1; j++) { const dy = j - y, o = j * w; for (let i = i0; i <= i1; i++) { const dx = i - x; if (dx * dx + dy * dy <= r2) m[o + i] = 1; } }
      return this;
    }
    ell(cx, cy, rx, ry = rx) {
      const w = this.w, m = this.m, ax = rx + 0.25, ay = ry + 0.25;
      const j0 = Math.max(0, Math.floor(cy - ry)), j1 = Math.min(this.h - 1, Math.ceil(cy + ry));
      const i0 = Math.max(0, Math.floor(cx - rx)), i1 = Math.min(w - 1, Math.ceil(cx + rx));
      for (let j = j0; j <= j1; j++) { const dy = (j - cy) / ay, o = j * w; for (let i = i0; i <= i1; i++) { const dx = (i - cx) / ax; if (dx * dx + dy * dy <= 1) m[o + i] = 1; } }
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
      const n = Math.max(30, Math.ceil(largo * 1.8));
      for (let s = 0; s <= n; s++) {
        const t = s / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const gr = g + (g1 - g) * t;
        if (gr <= 1.2) this.on(x, y);
        else if (gr < 2.4) this.rect(Math.round(x - 0.5), Math.round(y - 0.5), 2, 2);
        else this.disco(x, y, gr / 2);
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
    /* Sombreado por relieve con luz arriba a la izquierda. Más contraste que el de PX: umbrales más altos
       (más sombra) y, con op.tramado, un tramado ordenado de 4×4 en los bordes de cada banda. */
    pintar(rej, rampa, op = {}) {
      const w = this.w, h = this.h, m = this.m;
      const [x0, y0, x1, y1] = this.caja();
      if (x1 < 0) return rej;
      if (op.plano !== undefined) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const RR = op.relieve || 4;
      if (!BUF_D || BUF_D.length !== w * h) { BUF_D = new Float32Array(w * h); BUF_A = new Float32Array(w * h); }
      const d = BUF_D, A = BUF_A;
      for (let y = Math.max(0, y0 - 1); y <= Math.min(h - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(w - 1, x1 + 1); x++) { const i = y * w + x; d[i] = m[i] ? 1e6 : 0; A[i] = 0; }
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
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (m[i]) { const v = Math.min(d[i], RR) / RR; A[i] = Math.sqrt(1 - (1 - v) * (1 - v)); }
      }
      const alto = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : A[y * w + x]);
      const L = op.luz || [-0.55, -0.7, 0.5];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.6, sesgo = op.sesgo || 0, tr = op.tramado || 0;
      const u = op.umbrales || [0.93, 0.74, 0.36, 0.12];
      /* Degradado de lado a lado de la caja: el costado derecho cae en sombra (luz de la izquierda). */
      const lado = op.lado !== undefined ? op.lado : 0.16, xc = (x0 + x1) / 2, hw = Math.max(4, (x1 - x0) / 2);
      const tiene = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!m[y * w + x]) continue;
        const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k;
        const ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
        const nl = Math.hypot(nx, ny, 1);
        let l = (nx * lx + ny * ly + lz) / nl + sesgo;
        if (lado) l -= ((x - xc) / hw) * lado;
        if (tr) l += (umbral(x, y) - 0.5) * tr;
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
  let BUF_D = null, BUF_A = null;
  const capa = () => new CapaBG(W, H);
  /* Opciones de sombreado por material. */
  const METAL = { umbrales: [0.9, 0.7, 0.4, 0.2], profundo: true, lado: 0.24 };
  const TELA_OP = { tramado: 0.12 };

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
  function surco(g, ram, k, x0, y0, x1, y1, soloSobre = ram) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!soloSobre || g.rampa(x, y) === soloSobre) g.set(x, y, ram[k], ram);
    }
  }
  /* Pliegue de tela pesada: surco hondo con su luz al lado izquierdo, que se afina en las puntas. */
  function pliegue(g, ram, x0, y0, x1, y1, hondo = 1) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let s = 0; s <= n; s++) {
      const u = s / n, x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + (y1 - y0) * u);
      if (g.rampa(x, y) === ram) { const k = tono(g, x, y); g.set(x, y, ram[Math.max(0, Math.min(k, 2) - hondo)], ram); }
      if (u > 0.15 && u < 0.85 && g.rampa(x - 1, y) === ram && tono(g, x - 1, y) < 4) matiz(g, x - 1, y, 1);
    }
  }
  function costura(g, ram, x0, y0, x1, y1, d = 1, soloSobre = ram) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
    for (let s = 0; s <= n; s++) {
      if (s % 3 === 2) continue;
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!soloSobre || g.rampa(x, y) === soloSobre) matiz(g, x, y, d);
    }
  }
  /* Remache de un píxel con su sombra abajo a la derecha. */
  function remache(g, ram, x, y) {
    x = Math.round(x); y = Math.round(y);
    pon(g, ram, 4, [x, y]); pon(g, ram, 1, [x + 1, y + 1]);
  }
  /* Cota de malla: anillas de 2×2 al tresbolillo (brillo arriba a la izquierda, hueco oscuro). */
  function malla(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const f = ((x + ((y >> 1) & 1)) & 1), v = y & 1;
      if (v === 0 && f === 0) g.set(x, y, ram[Math.min(4, k + 1)], ram);
      else if (v === 1 && f === 1) g.set(x, y, ram[Math.max(0, k - 1)], ram);
    });
  }
  /* Textura de tela basta / cuero gastado: motas sueltas un tono arriba o abajo. */
  function grano(g, ram, x0, y0, x1, y1, semilla = 1, dens = 0.1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const h = ((x * 73856093) ^ (y * 19349663) ^ (semilla * 83492791)) >>> 0;
      const r = (h % 1000) / 1000;
      const vec = (x, y) => g.rampa(x, y) === ram && Math.abs(tono(g, x, y) - k) <= 0;
      if (r < dens * 0.6 && k > 1 && vec(x - 1, y) && vec(x + 1, y)) g.set(x, y, ram[k - 1], ram);
      else if (r > 1 - dens * 0.3 && k > 0 && k < 3 && vec(x, y - 1)) g.set(x, y, ram[k + 1], ram);
    });
  }
  function ribete(g, c, ram, k = 3, filas = 2) {
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      for (let f = 1; f <= filas; f++) if (!c.tiene(x, y + f)) { g.set(x, y, ram[f === 1 ? k - 1 : k], ram); break; }
    }
  }
  /* Sombra de la parte baja de una tela, con tramado en el borde. */
  function penumbra(g, ram, x0, y0, x1, y1, fuerza = 0.45) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const t = (y - y0) / Math.max(1, y1 - y0);
      if (k > 1 && t + (umbral(x, y) - 0.5) * 0.18 > 1 - fuerza) g.set(x, y, ram[k - 1], ram);
    });
  }
  /* Brillo especular duro: un píxel blanco con una cruz corta del tono claro. */
  function destello(g, ram, x, y, grande) {
    x = Math.round(x); y = Math.round(y);
    pon(g, ram, 4, [x, y]);
    if (grande) pon(g, ram, 3, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
  }
  const hashTexto = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
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
        g.set(x, y, c[0], c[1] || rampaDe(c[0]));
      }
    }
  }
  /* Línea honda alrededor de una capa sobre lo ya pintado detrás. */
  function perfilar(g, c) {
    const marcas = [];
    const [x0, y0, x1, y1] = c.caja();
    for (let y = Math.max(0, y0 - 1); y <= Math.min(H - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(W - 1, x1 + 1); x++) {
      if (c.tiene(x, y) || !g.get(x, y)) continue;
      if (c.tiene(x - 1, y) || c.tiene(x + 1, y) || c.tiene(x, y - 1) || c.tiene(x, y + 1)) marcas.push([x, y]);
    }
    for (const [x, y] of marcas) { const r = g.rampa(x, y); if (r) g.set(x, y, r[0], r); }
  }

  /* ---------- Contorno ----------
     Un píxel casi negro alrededor de todo; en el lado de la luz (arriba e izquierda) toma un poco del color del
     material que bordea, para que la silueta no quede recortada a tijera. */
  const cacheLuz = new Map();
  const bordeLuz = c => { if (!cacheLuz.has(c)) cacheLuz.set(c, mezcla(c, NEGRO, 0.55)); return cacheLuz.get(c); };
  function contornoSel(g) {
    const nuevos = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      let col = NEGRO;
      if (!iz && !ar) {
        const vec = ab ? [x, y + 1] : [x + 1, y];
        const ram = g.rampa(vec[0], vec[1]);
        if (ram) col = bordeLuz(ram[1]);
      }
      nuevos.push([x, y, col]);
    }
    for (const [x, y, col] of nuevos) g.set(x, y, col, rampaDe(col));
    return g;
  }

  /* ---------- Plantilla del cuerpo ----------
     Unas siete cabezas en las razas medianas (figura de ~108 px); enanos de ~80 px anchos y macizos;
     medianos y gnomos de ~66 px con proporciones de adulto; semiorcos y dracónidos de ~112 px y pesados. */
  const CUERPOS = {
    normal: { cabY: 23, rx: 5.4, ry: 7, torTop: 34, torBot: 67, hombros: 26, cintura: 18, pierna: 7, grosor: 6, abre: 4 },
    esbelto: { cabY: 22, rx: 5.1, ry: 6.9, torTop: 33, torBot: 66, hombros: 22, cintura: 15, pierna: 6, grosor: 5, abre: 4 },
    fornido: { cabY: 20, rx: 6, ry: 7.4, torTop: 31, torBot: 67, hombros: 34, cintura: 26, pierna: 9, grosor: 8, abre: 6 },
    bajo: { cabY: 64, rx: 5, ry: 6.3, torTop: 74, torBot: 97, hombros: 20, cintura: 16, pierna: 6, grosor: 5, abre: 3 },
    ancho: { cabY: 52, rx: 5.8, ry: 7, torTop: 62, torBot: 95, hombros: 32, cintura: 29, pierna: 9, grosor: 8, abre: 5 }
  };
  function plantilla(cuerpo) {
    const p = CUERPOS[cuerpo] || CUERPOS.normal;
    const bajo = cuerpo === "bajo" || cuerpo === "ancho";
    const grande = cuerpo === "fornido" || cuerpo === "ancho";
    const t = { cuerpo: CUERPOS[cuerpo] ? cuerpo : "normal", bajo, grande, W, H, cx: 63, suelo: SUELO };
    t.cabX = 64; t.cabY = p.cabY; t.cabRx = p.rx; t.cabRy = p.ry;
    t.ojoY = t.cabY; t.bocaY = t.cabY + 5;
    t.ojo1 = t.cabX + 1; t.ojo2 = t.cabX + Math.round(p.rx) - 1;
    t.narizX = Math.round(t.cabX + p.rx);
    t.torTop = p.torTop; t.torBot = p.torBot; t.pierTop = t.torBot + 2;
    const h = t.torBot - t.torTop;
    t.alto = h;
    t.torL = t.cx - Math.floor(p.hombros / 2); t.torR = t.torL + p.hombros - 1;
    t.wL = t.cx - Math.floor(p.cintura / 2); t.wR = t.wL + p.cintura - 1;
    t.grosor = p.grosor; t.pierna = p.pierna; t.abre = p.abre;
    t.hombro = [t.torR - 3, t.torTop + 4];
    t.codo = [t.torR + 1, t.torTop + Math.round(h * 0.6)];
    t.mano = [t.torR + 8, t.torTop + Math.round(h * 0.6) + Math.round(h * 0.36)];
    t.hombroAtras = [t.torL + 4, t.torTop + 4];
    t.manoAtras = [t.torL - 1, t.torBot + 4];
    t.caderaAtras = t.cx - p.abre; t.caderaDelante = t.cx + p.abre;
    t.pieAtras = t.caderaAtras - 3; t.pieDelante = t.caderaDelante + 3;
    t.rodillaY = Math.round((t.pierTop + t.suelo) / 2) - 1;
    return t;
  }

  /* ---------- Cabeza y cara ---------- */
  const LUZ_CARA = [-0.55, -0.6, 0.6];
  function capaCabeza(t, raza) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy;
    const c = capa().ell(x - 0.6, y - 1.4, rx, ry - 1.3);
    const f = x + rx;
    const orco = raza === "semiorco", enano = raza === "enano";
    c.poly([[x - 3, y + 1.5], [f - 1.2, y - 4.5], [f + 0.2, y - 2.6], [f + 0.7, y - 1.4], [f + 0.3, y - 0.4], [f + 1.4, y + 1.6], [f + 1.8, y + 2.6],
      [f + 0.4, y + 3.3], [f + 0.8, y + 4.2], [f + 0.2, y + 5.1], [f + 0.6, y + 5.9], [f + (orco ? 0.9 : 0.1), y + ry - 0.2], [f - 2.6, y + ry + (orco ? 1.4 : 0.8)],
      [x + 0.5, y + ry + (orco || enano ? 0.6 : 0)], [x - 2.8, y + 4.6]]);
    if (raza === "elfo") c.quitarRect(Math.round(f - 1), Math.round(y + ry), 3, 2);
    return c;
  }
  function cabeza(g, t, piel, raza) {
    const x = t.cabX, y = t.cabY, ry = t.cabRy;
    /* Cuello con la sombra que deja la mandíbula y el tendón marcado. */
    const ancho = t.grande ? 9 : 7;
    const cu = capa().rect(x - Math.floor(ancho / 2) - 1, y + 3, ancho, t.torTop - y - 1);
    cu.pintar(g, piel, { relieve: 3, max: 2 });
    for (let j = y + 3; j < t.torTop + 2; j++) pon(g, piel, 1, [x - Math.floor(ancho / 2) - 1, j]);
    for (let i = x - 4; i <= x + 4; i++) pon(g, piel, 0, [i, Math.round(y + ry + 0.5)]), pon(g, piel, 1, [i, Math.round(y + ry + 1.5)]);
    surco(g, piel, 3, x + 1, Math.round(y + ry + 2), x + 3, t.torTop, piel);
    const c = capaCabeza(t, raza);
    c.pintar(g, piel, { relieve: 4.2, min: 1, luz: LUZ_CARA, umbrales: [0.95, 0.76, 0.46, 0.14] });
    /* Sombra dura bajo la mandíbula y en la nuca. */
    const [x0, y0, x1, y1] = c.caja();
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      if (!c.tiene(i, j)) continue;
      if (!c.tiene(i, j + 1)) pon(g, piel, i < x + 3 ? 0 : 1, [i, j]);
      else if (!c.tiene(i, j + 2) && i < x + 3 && tono(g, i, j) > 1) pon(g, piel, 1, [i, j]);
      else if (!c.tiene(i - 1, j) && j > y) pon(g, piel, 1, [i, j]);
    }
  }
  function oreja(g, t, piel, raza) {
    const x = t.cabX, y = t.ojoY;
    const tramo = (pts, r = 1.6) => { const c = capa().poly(pts); c.pintar(g, piel, { relieve: r, separar: 1 }); return c; };
    if (raza === "elfo") {
      tramo([[x - 1, y + 3.5], [x - 1, y - 0.5], [x - 9, y - 5.5], [x - 4, y + 1.5]]);
      surco(g, piel, 1, x - 2, y + 2, x - 6, y - 2, piel); surco(g, piel, 3, x - 3, y, x - 7, y - 3.5, piel);
      return;
    }
    if (raza === "gnomo") {
      tramo([[x - 1, y + 3.5], [x - 1, y - 0.5], [x - 6, y - 3.5], [x - 3.5, y + 2.5]]);
      surco(g, piel, 1, x - 2, y + 2, x - 4, y - 1, piel); pon(g, piel, 3, [x - 4, y - 2]);
      return;
    }
    if (raza === "semiorco") {
      tramo([[x - 1, y + 4], [x - 1, y - 0.5], [x - 6, y - 2.5], [x - 3.5, y + 3.5]]);
      surco(g, piel, 1, x - 2, y + 2, x - 4, y, piel);
      pon(g, HIERRO, 4, [x - 4, y + 2]); pon(g, HIERRO, 2, [x - 4, y + 3]);
      return;
    }
    capa().ell(x - 1.8, y + 1.6, 1.5, 2.4).pintar(g, piel, { relieve: 1.6, separar: 1 });
    pon(g, piel, 0, [x - 1, y + 1], [x - 1, y + 2]); pon(g, piel, 3, [x - 3, y], [x - 3, y + 1]); pon(g, piel, 1, [x - 2, y + 4]);
  }

  /* Rasgos de la cara. Todo se pinta solo sobre la piel (la boca también sobre la barba). */
  function cara(g, t, o) {
    const { piel, raza, gesto } = o;
    const x = t.cabX, y = t.ojoY, by = t.bocaY, a = t.ojo1, b = t.ojo2, f = t.narizX;
    const sp = (i, j) => g.rampa(i, j) === piel;
    const P = (k, ...pts) => { for (const [i, j] of pts) if (sp(i, j)) g.set(i, j, piel[k], piel); };
    const enBoca = (i, j) => sp(i, j) || BARBAS.includes(g.rampa(i, j));
    const B = (ram, k, ...pts) => { for (const [i, j] of pts) if (enBoca(i, j)) g.set(i, j, ram[k], ram); };
    const cj = o.cejas || piel, kc = o.cejas ? 1 : 0;
    const C = (...pts) => { for (const [i, j] of pts) if (sp(i, j)) g.set(i, j, cj[kc], cj); };
    const ojoR = raza === "tiefling" ? TIEF : o.ojoR || SANO;
    const O = (k, ...pts) => { for (const [i, j] of pts) if (sp(i, j)) g.set(i, j, ojoR[k], ojoR); };
    const tief = raza === "tiefling", orco = raza === "semiorco";
    const sombra = o.sombra;
    /* Arco de la ceja iluminado y cuenca en sombra. */
    P(3, [a - 1, y - 2], [a, y - 2]);
    P(2, [a + 2, y - 1]);
    P(1, [f - 1, y], [a + 2, y]);
    /* Pómulo: luz encima y la mejilla hundida debajo. */
    P(4, [a - 1, y + 2], [a, y + 2]); P(3, [a + 1, y + 2]);
    P(2, [a + 1, y + 3], [a + 2, y + 4]);
    /* Nariz: lomo claro, punta y la sombra que deja debajo. */
    P(3, [f, y]); P(4, [f, y + 1], [f + 1, y + 2]); P(2, [f + 1, y + 3]);
    P(0, [f, y + 3]); P(1, [f - 1, y + 3], [f - 1, y + 2]);
    /* Surco nasolabial y mentón. */
    P(1, [f - 2, y + 4]);
    P(3, [f - 1, by + 2]); P(1, [f - 2, by + 2]);
    if (orco) P(1, [a - 1, y - 1], [a, y - 1], [a + 1, y - 1], [a + 2, y - 1], [b, y - 1]);
    const ojoN = () => { O(tief ? 4 : 3, [a, y]); O(tief ? 3 : 1, [a + 1, y]); O(tief ? 3 : 1, [b, y]); P(2, [a, y + 1], [a + 1, y + 1]); };
    if (gesto === "dolor") {
      /* Ojos apretados, ceño de angustia y la boca torcida con los dientes. */
      P(0, [a, y], [a + 1, y], [b, y]); P(1, [a - 1, y + 1], [a + 2, y - 1]);
      C([a - 1, y - 1], [a, y - 2], [a + 1, y - 2]); C([b, y - 2], [b + 1, y - 1]);
      P(1, [a + 2, y - 2]);
      B(OSCURO, 0, [f - 3, by + 1], [f - 2, by], [f - 1, by], [f, by], [f, by + 1], [f - 2, by + 1]);
      B(HUESO, 3, [f - 1, by]); B(HUESO, 2, [f - 1, by + 1]);
      P(1, [f - 3, by + 2], [f - 4, by + 1]);
    } else if (gesto === "furia") {
      /* Cejas en V bajas, ojos entornados, arruga de la nariz y los dientes apretados. */
      C([a - 1, y - 2], [a, y - 2], [a + 1, y - 1], [a + 2, y - 1]); C([b, y - 1], [b + 1, y - 2]);
      P(0, [a + 2, y - 2]);
      O(1, [a + 1, y]); O(1, [b, y]); O(2, [a, y]);
      P(1, [f - 1, y + 1]);
      B(OSCURO, 0, [f - 3, by], [f - 2, by - 1], [f - 1, by - 1], [f, by - 1], [f, by + 1], [f - 1, by + 1], [f - 2, by + 1]);
      B(HUESO, 4, [f - 2, by], [f - 1, by]); B(HUESO, 2, [f, by]);
    } else if (gesto === "alegre") {
      /* Media sonrisa fiera: la comisura sube, un colmillo asoma y el pómulo se levanta. */
      C([a - 1, y - 1], [a, y - 2], [a + 1, y - 2]); C([b, y - 2]);
      O(3, [a, y]); O(1, [a + 1, y]); O(1, [b, y]); P(3, [a, y + 1], [a + 1, y + 1]);
      B(OSCURO, 0, [f - 3, by - 1], [f - 2, by], [f - 1, by], [f, by]);
      B(HUESO, 3, [f - 1, by]);
      P(1, [f - 4, by - 1]); P(3, [f - 3, by + 1]);
    } else {
      C([a - 1, y - 1], [a, y - 1], [a + 1, y - 1]); C([b, y - 1]);
      ojoN();
      B(piel, 0, [f - 2, by], [f - 1, by], [f, by]); B(piel, 1, [f - 3, by]);
      P(3, [f - 1, by + 1]);
    }
    if (sombra) cada(g, piel, x - 4, y - 4, f + 2, y + 2, (i, j, k) => { if (k > 1 && j < y + 1) g.set(i, j, piel[k - 1], piel); });
    if (orco) {
      /* Colmillos que suben desde la mandíbula. */
      pon(g, HUESO, 4, [f - 1, by - 1]); pon(g, HUESO, 3, [f - 1, by]); pon(g, HUESO, 2, [f - 3, by]);
    }
    if (raza === "gnomo") {
      const n = capa().ell(f, y + 2, 1.6, 1.8);
      n.pintar(g, piel, { relieve: 1.4, min: 2 });
      pon(g, piel, 4, [f - 1, y + 1]); pon(g, piel, 0, [f, y + 4], [f - 1, y + 4]);
    }
    if (raza === "enano") { P(3, [f + 1, y + 2]); P(0, [f + 1, y + 3]); }
  }

  /* ---------- Dracónido: cabeza de reptil ---------- */
  function cabezaDraconido(g, t, piel, gesto) {
    const x = t.cabX, y = t.cabY;
    capa().rect(x - 6, y + 2, 11, t.torTop - y + 2).pintar(g, piel, { relieve: 4, max: 2 });
    for (let j = y + 7; j <= t.torTop; j += 3) capa().ell(x + 2, j, 2.6, 1).pintar(g, HUESO, { relieve: 1.2, min: 1, max: 3, separar: 1 });
    const c = capa().ell(x - 1, y - 1, 6.6, 6.8);
    c.poly([[x + 1, y - 6], [x + 8, y - 4.4], [x + 13, y - 1.4], [x + 13.6, y + 1.6], [x + 12, y + 3.8], [x + 6, y + 6.4], [x - 2, y + 7]]);
    c.pintar(g, piel, { relieve: 4.6, luz: LUZ_CARA, umbrales: [0.95, 0.76, 0.46, 0.14] });
    /* Mandíbula inferior más clara y la línea de la boca. */
    for (let i = x + 2; i <= x + 13; i++) for (let j = y + 3; j <= y + 7; j++) if (g.rampa(i, j) === piel && tono(g, i, j) >= 2) pon(g, HUESO, j <= y + 4 ? 3 : 2, [i, j]);
    for (let i = x + 1; i <= x + 13; i++) { if (g.rampa(i, y + 2) === piel || g.rampa(i, y + 2) === HUESO) pon(g, piel, 0, [i, y + 2]); }
    /* Escamas al tresbolillo. */
    cada(g, piel, x - 9, y - 8, x + 14, y + 2, (i, j, k) => {
      const fila = Math.floor(j / 3), u = ((i + (fila & 1) * 2) % 4 + 4) % 4, v = ((j % 3) + 3) % 3;
      if (k >= 2 && v === 2 && u >= 1) pon(g, piel, k - 1, [i, j]);
      else if (k >= 1 && k < 4 && v === 0 && u === 2) pon(g, piel, k + 1, [i, j]);
    });
    /* Cresta de pinchos y cuernos hacia atrás. */
    const cr = capa();
    for (let k = 0; k < 3; k++) cr.poly([[x - 5 - k * 1.6, y - 6 + k * 4.2], [x - 11 - k * 1.6, y - 6 + k * 4.6], [x - 7 - k * 1.6, y - 2.5 + k * 4.2]]);
    cr.pintar(g, piel, { relieve: 1.4, max: 3, separar: true });
    const cu = capa().curva(x - 2, y - 6, x - 8, y - 12, x - 15, y - 11, 4, 1).curva(x - 4, y - 2, x - 10, y - 5, x - 16, y - 4, 3.4, 1);
    cu.pintar(g, HUESO, { relieve: 2, separar: true });
    cada(g, HUESO, x - 18, y - 14, x, y, (i, j, k) => { if (cu.tiene(i, j) && k >= 2 && ((i - j) % 3 + 3) % 3 === 0) pon(g, HUESO, k - 1, [i, j]); });
    /* Arco de la ceja, ojo de rendija y fosa nasal. */
    for (let i = x + 1; i <= x + 6; i++) if (g.rampa(i, y - 4) === piel) pon(g, piel, i < x + 4 ? 4 : 3, [i, y - 4]);
    pon(g, piel, 0, [x + 12, y - 1], [x + 11, y - 1]);
    const ex = x + 3, ey = y - 2;
    const libre = (i, j) => g.rampa(i, j) === piel || g.rampa(i, j) === HUESO;
    const mapa = { K: [NEGRO, OSCURO], O: [TIEF[3], TIEF], o: [TIEF[2], TIEF], T: [HUESO[4], HUESO], t: [HUESO[2], HUESO], F: [R.fuego[3], R.fuego], f: [R.fuego[4], R.fuego] };
    if (gesto === "dolor") {
      sello(g, ex - 1, ey, ["KKK."], mapa, libre);
      sello(g, x + 5, y + 2, ["KKKKKKKK", ".KTtTtK."], mapa, libre);
    } else if (gesto === "alegre") {
      sello(g, ex - 1, ey, ["KOK"], mapa, libre);
      sello(g, x + 6, y + 2, [".......K", "KTKTKTK."], mapa, libre);
    } else if (gesto === "furia") {
      sello(g, ex - 1, ey - 1, ["K...", ".KK.", ".OK."], mapa, libre);
      sello(g, x + 4, y + 2, ["TKTKTKTKT", "KtKtKtKtK"], mapa, libre);
      pon(g, R.fuego, 4, [x + 15, y - 1]); pon(g, R.fuego, 3, [x + 15, y], [x + 16, y - 2]); pon(g, R.fuego, 2, [x + 17, y - 1]);
    } else sello(g, ex - 1, ey, ["KOK"], mapa, libre);
  }

  /* ---------- Pelo y barba ---------- */
  function texturaPelo(g, ram, cx, cy, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const ang = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
      const banda = ((ang * 4.5 + d * 0.06) % 1 + 1) % 1;
      if (k >= 2 && banda < 0.22 && d > 2) g.set(x, y, ram[k - 1], ram);
      else if (k >= 2 && k < 4 && d > 2.5 && d < 6 && ang < -0.6 && ang > -2.6 && banda > 0.45 && banda < 0.75) g.set(x, y, ram[k + 1], ram);
    });
  }
  function pelo(g, t, ram, peinado, raza, soloCabeza) {
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy;
    if (peinado === "rapado") {
      const piel = g.rampa(x, y - 4);
      if (!piel) return;
      cada(g, piel, x - 8, y - 9, x + 6, y + 3, (i, j, k) => {
        const borde = y - 4 + (i < x - 2 ? Math.min(6, (x - 2 - i)) : 0);
        if (j < borde && ((i + j) & 1 || k < 2)) g.set(i, j, ram[k >= 3 ? 2 : 1], ram);
      });
      return;
    }
    const c = capa().ell(x - 0.9, y - 2.2, rx + 1.1, ry - 0.8);
    c.rect(Math.round(x - rx - 1.5), y - 3, Math.round(rx), 7);
    /* Nacimiento del pelo en la frente y patilla delante de la oreja. */
    for (let j = y - 9; j <= y + 8; j++) for (let i = x; i <= x + 10; i++) if (j >= y - 4 - (i >= x + 3 ? 1 : 0) + ((i & 1) && i > x + 1 ? 1 : 0)) c.off(i, j);
    for (let j = y - 1; j <= y + 8; j++) c.off(x - 1, j), c.off(x - 0, j);
    c.rect(x - 1, y - 3, 2, 5);
    c.borrarDesde(y + 5);
    if (peinado === "corto") c.quitarRect(x - 9, y + 3, 4, 2);
    if (peinado === "largo") c.poly([[x - rx - 1.5, y - 2], [x - 1, y], [x - 1, y + 6], [x - 2, t.torTop + 7], [x - 5, t.torTop + 9], [x - 8, t.torTop + 7], [x - rx - 3, t.torTop + 2]]);
    if (peinado === "recogido") c.ell(x - rx - 1.5, y - 3, 2.4, 2.4);
    if (peinado === "rizado") {
      c.ell(x - 1.5, y - 4.4, rx + 2, ry - 2);
      for (const [i, j] of [[x - 7, y + 2], [x - 6, y + 5], [x - 4, y - 8], [x + 1, y - 8.4], [x + 4, y - 7]]) c.ell(i, j, 2, 1.8);
      for (let j = y - 9; j <= y + 8; j++) for (let i = x + 1; i <= x + 10; i++) if (j >= y - 4) c.off(i, j);
      c.borrarDesde(y + 7);
    }
    if (raza === "elfo" || raza === "gnomo" || raza === "satiro" || raza === "semiorco") c.quitarRect(x - 3, y - 1, 3, 5);
    if (soloCabeza) c.recortar(capa().ell(t.cabX - 0.6, t.cabY - 1.4, t.cabRx, t.cabRy - 1.3));
    c.pintar(g, ram, { relieve: 3.6, tramado: 0.1 });
    texturaPelo(g, ram, x - 1, y - 8, x - 14, y - 12, x + 8, t.torTop + 12);
    if (peinado === "rizado") {
      for (const [i, j] of [[x - 6, y - 6], [x - 2, y - 8], [x + 2, y - 7], [x - 8, y - 1], [x - 7, y + 3], [x - 4, y - 3]]) {
        if (g.rampa(i, j) !== ram) continue;
        pon(g, ram, 1, [i + 1, j + 1], [i, j + 1]); pon(g, ram, j < y ? 3 : 2, [i - 1, j - 1]);
      }
    }
    if (peinado === "recogido" && !soloCabeza) {
      /* Coleta atada con un cordón de cuero. */
      const co = capa().curva(x - rx - 2, y - 1, x - rx - 5, y + 5, x - rx - 3, y + 11, 3.2, 1.6);
      co.pintar(g, ram, { relieve: 1.6, separar: 2 });
      surco(g, ram, 1, x - rx - 3, y + 1, x - rx - 4, y + 9, ram);
      pon(g, CUERO2, 3, [x - rx - 3, y - 1], [x - rx - 2, y - 1]); pon(g, CUERO2, 1, [x - rx - 3, y], [x - rx - 2, y]);
    }
    if (peinado === "largo" && !soloCabeza) for (let i = x - 8; i <= x - 2; i += 2) surco(g, ram, 1, i, y + 3, i - 1, t.torTop + 7, ram);
  }
  function barba(g, t, ram, larga) {
    const x = t.cabX, y = t.ojoY, by = t.bocaY, f = t.narizX;
    const c = capa().poly([[x - 1.5, y + 0.5], [x + 0.5, y + 2.5], [f - 3, by - 1.5], [f + 1, by - 1.4], [f + 1.6, by + 1], [f + 0.6, by + 3.2], [x + 1, by + 3.4], [x - 2, y + 4.4]]);
    if (larga) c.poly([[x - 2.5, by - 1], [f + 1.6, by], [f + 1.6, t.torTop + 8], [f - 1, t.torTop + 14], [x + 1, t.torTop + 13], [x - 3, t.torTop + 6]]);
    c.pintar(g, ram, { relieve: 3, separar: 2, tramado: 0.1 });
    /* Mechones verticales que ondulan. */
    const [x0, , x1, y1] = c.caja();
    cada(g, ram, x0, by - 1, x1, y1, (i, j, k) => {
      if (!c.tiene(i, j)) return;
      const fr = ((i + ((j >> 2) & 1)) % 2 + 2) % 2;
      if (k >= 2 && fr === 0 && (j % 3)) g.set(i, j, ram[k - 1], ram);
      else if (k >= 1 && k < 4 && fr === 1 && (j & 3) === 1) g.set(i, j, ram[k + 1], ram);
    });
    /* Bigote pesado sobre la boca. */
    const bi = capa().ell(f - 1, by - 1, 2.6, 1).ell(f - 3, by - 0.2, 1.4, 1.4);
    bi.pintar(g, ram, { relieve: 1.2, min: 2, separar: 1 });
    pon(g, ram, 3, [f - 2, by - 2], [f - 1, by - 2]);
    if (larga) {
      /* Dos trenzas con anillas de hierro. */
      for (const bx of [x + 1, f - 1]) {
        for (let j = by + 3; j < t.torTop + 12; j += 2) { pon(g, ram, 1, [bx, j]); pon(g, ram, 3, [bx + 1, j]); pon(g, ram, 2, [bx, j + 1]); }
        const ty = t.torTop + 6 + (bx === x + 1 ? 0 : 2);
        pon(g, HIERRO, 4, [bx, ty]); pon(g, HIERRO, 3, [bx + 1, ty]); pon(g, HIERRO, 1, [bx, ty + 1], [bx + 1, ty + 1]);
      }
    }
  }

  /* ---------- Cuernos y colas ---------- */
  function cuernos(g, t, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "tiefling") {
      const N = R.pelo.negro;
      const c = capa().curva(x + 1, y - 5, x + 1, y - 13, x - 6, y - 14, 3.6, 1).curva(x - 3, y - 5, x - 5, y - 10, x - 10, y - 10, 3, 1);
      c.pintar(g, N, { relieve: 1.8, min: 1, separar: true });
      cada(g, N, x - 12, y - 16, x + 4, y - 4, (i, j, k) => { if (c.tiene(i, j) && k >= 2 && ((i + j * 2) % 4 + 4) % 4 === 0) pon(g, N, 1, [i, j]); });
      pon(g, N, 4, [x, y - 10], [x - 1, y - 12]);
    }
    if (raza === "satiro") {
      const c = capa().curva(x + 1, y - 5, x + 1, y - 12, x - 4, y - 12, 3.2, 1.4).curva(x - 3, y - 5, x - 4, y - 9, x - 8, y - 9, 2.6, 1.2);
      c.pintar(g, HUESO, { relieve: 1.6, min: 1, separar: true });
      cada(g, HUESO, x - 10, y - 14, x + 4, y - 4, (i, j, k) => { if (c.tiene(i, j) && k >= 2 && ((j + i) % 2 + 2) % 2 === 0) pon(g, HUESO, k - 1, [i, j]); });
    }
  }
  function cola(g, t, piel, raza) {
    if (raza === "tiefling") {
      capa().curva(t.torL + 4, t.torBot - 2, t.torL - 16, t.torBot + 18, t.torL - 14, t.torBot - 6, 3, 1.8).pintar(g, piel, { relieve: 1.6 });
      const px = t.torL - 14, py = t.torBot - 7;
      capa().poly([[px - 3, py + 2], [px, py - 5], [px + 3, py + 2], [px, py + 1]]).pintar(g, piel, { relieve: 1.4, min: 1 });
      pon(g, piel, 4, [px - 1, py - 2]);
    }
    if (raza === "draconido") {
      const c = capa().curva(t.torL + 6, t.torBot - 6, t.torL - 6, t.suelo + 2, t.torL - 22, t.suelo - 4, 11, 3);
      c.borrarDesde(t.suelo + 1);
      c.pintar(g, piel, { relieve: 4.4, profundo: true });
      const [x0, y0, x1, y1] = c.caja();
      for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++)
        if (c.tiene(i, j) && !c.tiene(i, j + 1)) { pon(g, HUESO, i % 3 === 0 ? 1 : 2, [i, j]); if (c.tiene(i, j - 1)) pon(g, HUESO, i % 3 === 0 ? 1 : 3, [i, j - 1]); }
      cada(g, piel, x0, y0, x1, y1, (i, j, k) => {
        const fila = Math.floor(j / 3), u = ((i + (fila & 1) * 2) % 4 + 4) % 4, v = ((j % 3) + 3) % 3;
        if (k >= 2 && v === 2 && u >= 1) pon(g, piel, k - 1, [i, j]);
        else if (k >= 1 && k < 4 && v === 0 && u === 2) pon(g, piel, k + 1, [i, j]);
      });
    }
  }

  /* ---------- Brazos, manos y piernas ---------- */
  function puno(g, mx, my, ram) {
    /* Puño cerrado alrededor de un mango vertical: nudillos marcados y el pulgar encima. */
    const c = capa().ell(mx - 0.2, my + 0.6, 2.4, 2.9);
    c.pintar(g, ram, { relieve: 2, separar: true });
    const X = Math.round(mx), Y = Math.round(my);
    pon(g, ram, 1, [X + 1, Y], [X + 1, Y + 2], [X, Y + 3]);
    pon(g, ram, 3, [X + 2, Y - 1], [X + 2, Y + 1]);
    capa().ell(mx + 0.4, my - 2, 1.6, 1).pintar(g, ram, { relieve: 1, separar: 1 });
    pon(g, ram, 4, [X - 1, Y - 2]); pon(g, ram, 0, [X - 1, Y - 1], [X, Y - 1]);
  }
  function mano(g, x, y, ram, sombra) {
    const c = capa().ell(x + 0.5, y + 2, 2, 2.2).rect(x - 1, y + 3, 3, 3).linea(x + 2.5, y + 1, x + 3, y + 4, 1);
    c.pintar(g, ram, { relieve: 1.6, max: sombra ? 2 : 4, separar: true });
    pon(g, ram, 1, [x, y + 5], [x + 1, y + 4]);
  }
  function brazoDelante(g, t, piel, m, conPuno = true) {
    brazoLibre(g, t, piel, m, t.hombro, t.codo, t.mano);
    if (conPuno) puno(g, t.mano[0], t.mano[1], m.guante || piel);
  }
  function puno0(g, ram, E, M, gr) {
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const c = capa().linea(M[0] - ux * 3, M[1] - uy * 3, M[0] - ux * 1, M[1] - uy * 1, gr + 1);
    c.pintar(g, ram, { relieve: 1.6, separar: true });
  }
  /* Brazal de cuero con dos correas. */
  function brazal(g, ram, inf, E, M, gr) {
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const bz = capa().linea(E[0] + ux * d * 0.35, E[1] + uy * d * 0.35, M[0] - ux * 1, M[1] - uy * 1, gr + 1);
    bz.pintar(g, ram, { relieve: 2, separar: true });
    for (const s of [0.5, 0.8]) {
      const cx = E[0] + ux * d * s, cy = E[1] + uy * d * s;
      surco(g, CUERO2, 1, cx - uy * gr * 0.7, cy + ux * gr * 0.7, cx + uy * gr * 0.7, cy - ux * gr * 0.7, ram);
    }
    const hx = Math.round(E[0] + ux * d * 0.5 - uy * 1.5), hy = Math.round(E[1] + uy * d * 0.5 + ux * 1.5);
    pon(g, HIERRO, 4, [hx, hy]);
  }
  /* Manga ancha de túnica que cae desde el antebrazo, con ribete. */
  function mangaAncha(g, m, E, M) {
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d;
    const cae = 4.4 + Math.abs(ux) * 2.6, bajoY = Math.max(E[1], M[1]);
    const b = capa().poly([[E[0] - 2, E[1] - 2], [M[0] - 0.5, M[1] - 3.6], [M[0] + 1, M[1] + 3.6], [E[0] + (M[0] - E[0]) * 0.6, bajoY + cae], [E[0] - 2.6, E[1] + 4]]);
    b.pintar(g, m.inf, Object.assign({ relieve: 3, separar: true }, TELA_OP));
    const rib = m.ribete || m.inf;
    const [x0, y0, x1, y1] = b.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!b.tiene(x, y)) continue;
      if (!b.tiene(x, y + 1)) g.set(x, y, rib[m.ribete ? 2 : 1], rib);
    }
    pliegue(g, m.inf, E[0] + 1, E[1] + 1, (E[0] + M[0]) / 2, bajoY + cae - 2);
  }
  function brazoAtras(g, t, piel, m) {
    const [hx, hy] = t.hombroAtras, [mx, my] = t.manoAtras;
    const ex = hx - 3, ey = Math.round((hy + my) / 2) - 1;
    capa().linea(hx, hy, ex, ey, t.grosor + 1).pintar(g, m.sup || piel, { relieve: 3, max: 2 });
    capa().linea(ex, ey, mx, my, t.grosor).pintar(g, m.inf || m.sup || piel, { relieve: 3, max: 2 });
    if (m.ancha) capa().poly([[mx - 3, my - 8], [mx + 3, my - 8], [mx + 4, my + 2], [mx - 4, my + 2]]).pintar(g, m.inf, { relieve: 2.4, max: 2 });
    mano(g, mx - 1, my + 1, m.guante || piel, true);
  }

  function pieDesnudo(g, t, x0, piel, peludo, atras) {
    const s = t.suelo, l = 9;
    const c = capa().ell(x0 + l / 2 - 1, s - 1.4, l / 2, 1.8).rect(x0 - 1, s - 4, 6, 3);
    c.borrarDesde(s + 1);
    c.pintar(g, piel, { relieve: 1.8, max: atras ? 2 : 4, separar: true });
    for (let i = x0 - 1; i < x0 + l; i++) if (c.tiene(i, s)) pon(g, piel, 0, [i, s]);
    pon(g, piel, 1, [x0 + l - 3, s - 1], [x0 + l - 5, s - 1]);
    if (peludo) for (let i = x0 - 1; i <= x0 + 5; i++) { pon(g, peludo, (i & 1) ? 1 : 2, [i, s - 4]); if (i & 1) pon(g, peludo, atras ? 1 : 3, [i, s - 3]); }
  }
  /* Bota de cuero: caña con vuelta, empeine, suela y tacón, arrugas del tobillo y una correa con hebilla de hierro. */
  function bota(g, t, xc, ram, atras, alto = 14, puntera = null) {
    const s = t.suelo, gw = t.pierna;
    const x0 = Math.round(xc - gw / 2);
    const c = capa().rect(x0, s - alto, gw + 1, alto - 1).rect(x0, s - 4, gw + 3, 4).ell(x0 + gw + 3, s - 1.6, 2.4, 1.6);
    c.borrarDesde(s + 1);
    c.pintar(g, ram, { relieve: 2.6, max: atras ? 2 : 4, separar: true, tramado: ram === PLACA ? 0 : 0.1 });
    if (ram !== PLACA) {
      capa().rect(x0 - 1, s - alto - 1, gw + 3, 3).pintar(g, ram, { relieve: 1.4, max: atras ? 2 : 3, separar: true });
      for (let i = x0 - 1; i <= x0 + gw + 1; i++) pon(g, ram, 1, [i, s - alto + 2]);
    }
    for (let i = x0 - 1; i <= x0 + gw + 6; i++) {
      if (c.tiene(i, s)) pon(g, CUERO2, 0, [i, s]);
      if (c.tiene(i, s - 1) && i < x0 + 3) pon(g, CUERO2, 1, [i, s - 1]);
    }
    pon(g, ram, atras ? 2 : 3, [x0 + gw + 2, s - 3], [x0 + gw + 3, s - 3]);
    surco(g, ram, 1, x0 + 1, s - 5, x0 + gw, s - 6, ram);
    if (ram === PLACA) {
      for (let j = s - alto + 3; j < s - 4; j += 3) for (let i = x0; i <= x0 + gw; i++) if (g.rampa(i, j) === ram) pon(g, ram, 0, [i, j]);
      if (!atras) for (let j = s - alto + 1; j < s - 4; j++) if (g.rampa(x0 + 1, j) === ram) pon(g, ram, 4, [x0 + 1, j]);
      for (let i = x0; i <= x0 + gw + 4; i++) if (g.rampa(i, s - 3) === ram) pon(g, ram, 0, [i, s - 3]);
    }
    if (puntera) pon(g, puntera, atras ? 2 : 3, [x0 + gw + 4, s - 2], [x0 + gw + 5, s - 1]);
    if (alto >= 12 && ram !== PLACA) {
      const cy = s - 8;
      for (let i = x0; i <= x0 + gw; i++) pon(g, CUERO2, atras ? 0 : 1, [i, cy]);
      if (!atras) { pon(g, HIERRO, 4, [x0 + gw - 2, cy]); pon(g, HIERRO, 2, [x0 + gw - 1, cy]); }
    }
  }
  function piernas(g, t, piel, raza, ramPelo, o) {
    const { pierTop, suelo, pierna: gw } = t;
    const xa = t.caderaAtras, xd = t.caderaDelante, fa = t.pieAtras, fd = t.pieDelante, ky = t.rodillaY;
    if (raza === "satiro") {
      capa().ell(t.cx, pierTop + 2, (t.wR - t.wL) / 2 + 2, 5).pintar(g, ramPelo, { relieve: 4, tramado: 0.12 });
      const pata = (x, f, atras) => {
        const kx = x + 3 + (atras ? t.kAx || 0 : t.kDx || 0);
        const c = capa().linea(x, pierTop + 2, kx, ky + 1, gw + 2).linea(kx, ky + 1, f - 2, suelo - 7, gw).linea(f - 2, suelo - 7, f, suelo - 3, gw - 2);
        c.pintar(g, ramPelo, { relieve: 3, max: atras ? 2 : 4, separar: true, tramado: 0.14 });
        cada(g, ramPelo, x - 10, pierTop, x + 12, suelo - 3, (i, j, k) => {
          if (!c.tiene(i, j)) return;
          const u = ((i + j * 2) % 5 + 5) % 5;
          if (k >= 2 && u === 0) g.set(i, j, ramPelo[k - 1], ramPelo);
        });
        const pz = capa().rect(f - 2, suelo - 2, 6, 3);
        pz.borrarDesde(suelo + 1);
        pz.pintar(g, R.pelo.negro, { relieve: 1.4, min: 1, max: atras ? 3 : 4, separar: true });
        pon(g, R.pelo.negro, 0, [f + 1, suelo - 1], [f + 1, suelo]);
      };
      pata(xa - 2, fa, true); pata(xd, fd, false);
      return;
    }
    const rp = o.ramPierna || piel;
    const pierna = (x, f, dk) => { const kx = (x + f) / 2 + dk; return capa().linea(x, pierTop - 2, kx, ky, gw + 2).linea(kx, ky, f, suelo - 4, gw).ell(kx - 0.4 + (dk ? (f - kx) * 0.3 : 0), ky + 6 + (dk ? 1 : 0), gw / 2 + 0.3, 3.4); };
    const kA = t.kAx || 0, kD = t.kDx || 0;
    const atras = pierna(xa, fa, kA), delante = pierna(xd, fd, kD);
    const opT = rp === PLACA || rp === MALLA ? METAL : TELA_OP;
    atras.pintar(g, rp, Object.assign({ relieve: 3.4, max: 2 }, opT));
    delante.pintar(g, rp, Object.assign({ relieve: 3.6, separar: true }, opT));
    const rx = Math.round((xd + fd) / 2 + kD);
    if (rp === MALLA) malla(g, MALLA, xa - 8, pierTop - 2, fd + 8, suelo);
    else if (rp !== piel && rp !== PLACA) {
      pliegue(g, rp, rx + 2, ky - 2, rx - 1, ky + 1);
      pliegue(g, rp, rx + 2, ky + 2, rx, ky + 4);
      costura(g, rp, xd + 2, pierTop + 2, rx + 2, ky - 3, -1);
      grano(g, rp, xa - 8, pierTop - 2, fd + 8, suelo, 3, 0.08);
    } else if (rp === piel) {
      pon(g, piel, 3, [rx, ky], [rx - 1, ky - 1]); pon(g, piel, 1, [rx + 2, ky + 7]);
    }
    if (rp === PLACA) {
      /* Quijotes y grebas: láminas con su arista clara y una línea honda entre piezas. */
      for (const [xx, ff, dk, at] of [[xa, fa, kA, true], [xd, fd, kD, false]]) {
        const kx = Math.round((xx + ff) / 2 + dk);
        for (let i = kx - gw; i <= kx + gw; i++) for (const j of [pierTop + 4, ky - 4]) if (g.rampa(i, j) === PLACA) pon(g, PLACA, 0, [i, j]);
        if (!at) for (let j = pierTop; j < suelo - 6; j++) { const i = Math.round(xx + (kx - xx) * Math.min(1, (j - pierTop) / (ky - pierTop))) - 1; if (g.rampa(i, j) === PLACA) pon(g, PLACA, 4, [i, j]); }
      }
    }
    if (o.rodillera) {
      for (const [xx, ff, dk, at] of [[xa, fa, kA, true], [xd, fd, kD, false]]) {
        const kx = (xx + ff) / 2 + dk;
        const rc = capa().ell(kx + 0.4, ky, gw / 2 + 0.8, 2.6);
        rc.pintar(g, o.rodillera, Object.assign({ relieve: 2, max: at ? 2 : 4, separar: true }, METAL));
        if (!at) { destello(g, o.rodillera, kx - 1, ky - 1); remache(g, HIERRO, kx + 2, ky + 1); }
        /* Aleta lateral de la rodillera. */
        capa().ell(kx - 2.6, ky + 0.5, 1.6, 2.4).pintar(g, o.rodillera, Object.assign({ relieve: 1.2, max: at ? 2 : 3, separar: true }, METAL));
      }
    }
    if (o.descalzo || !o.ramBota) {
      const med = raza === "mediano";
      pieDesnudo(g, t, Math.round(fa - gw / 2) - 2, piel, med ? ramPelo : null, true);
      pieDesnudo(g, t, Math.round(fd - gw / 2), piel, med ? ramPelo : null, false);
      return;
    }
    bota(g, t, fa - 2, o.ramBota, true, o.alto || 14, o.puntera);
    bota(g, t, fd, o.ramBota, false, o.alto || 14, o.puntera);
  }

  /* ---------- Formas de la ropa ---------- */
  const torso = t => {
    const h = t.torBot - t.torTop;
    return capa().poly([
      [t.torL + 3, t.torTop - 1], [t.torR - 3, t.torTop - 1], [t.torR, t.torTop + 2], [t.torR + 1, t.torTop + 7], [t.torR, t.torTop + h * 0.45],
      [t.wR + 1, t.torBot + 1], [t.wL - 1, t.torBot + 1], [t.torL, t.torTop + h * 0.45], [t.torL - 1, t.torTop + 6], [t.torL, t.torTop + 2]
    ]);
  };
  const falda = (t, largo, vuelo) => capa().poly([[t.wL - 1, t.torBot - 3], [t.wR + 1, t.torBot - 3], [t.wR + 2 + vuelo + (t.faldaD || 0), t.pierTop + largo + 1 + (t.faldaDy || 0)], [t.wL - 2 - vuelo + (t.faldaI || 0), t.pierTop + largo + 1 + (t.faldaIy || 0)]]);
  function cinturon(g, t, ram = CUERO, hebilla = HIERRO, y = t.torBot - 3, ancho = 3) {
    for (let x = t.wL - 4; x <= t.wR + 4; x++) for (let j = 0; j < ancho; j++) if (g.get(x, y + j)) g.set(x, y + j, ram[j === 0 ? 3 : j === ancho - 1 ? 1 : 2], ram);
    for (let x = t.wL - 4; x <= t.wR + 4; x++) if (g.get(x, y + ancho) && g.rampa(x, y + ancho) !== ram) matiz(g, x, y + ancho, -1);
    for (let x = t.wL + 1; x < t.cx - 1; x += 4) if (g.rampa(x, y + 1) === ram) pon(g, ram, 0, [x, y + 1]);
    /* Hebilla de hierro: marco con brillo y pasador, y el cabo de la correa. */
    const hx = t.cx + 3;
    for (let j = y - 1; j <= y + ancho; j++) pon(g, hebilla, j === y - 1 ? 4 : 2, [hx, j]), pon(g, hebilla, 1, [hx + 3, j]);
    pon(g, hebilla, 3, [hx + 1, y - 1], [hx + 2, y - 1]); pon(g, hebilla, 1, [hx + 1, y + ancho], [hx + 2, y + ancho]);
    pon(g, hebilla, 3, [hx + 1, y + 1], [hx + 2, y + 1]);
    pon(g, ram, 1, [hx + 4, y + 1], [hx + 5, y + 2]); pon(g, ram, 2, [hx + 5, y + 3], [hx + 5, y + 4]);
  }
  /* Bolsa de cuero con solapa. */
  function bolsita(g, x, y, ram = CUERO, rx = 2.6, ry = 3) {
    const b = capa().ell(x, y + 1, rx, ry);
    b.pintar(g, ram, { relieve: 2, separar: true, tramado: 0.1 });
    for (let i = Math.round(x - rx); i <= Math.round(x + rx); i++) if (b.tiene(i, Math.round(y))) pon(g, ram, i < x ? 3 : 2, [i, Math.round(y) - 1]), pon(g, ram, 0, [i, Math.round(y)]);
    pon(g, HIERRO, 4, [Math.round(x), Math.round(y) + 1]);
  }
  /* Daga envainada colgando del cinturón, un poco inclinada. */
  function vaina(g, x, y, largo = 10, inc = 0.25) {
    x = Math.round(x); y = Math.round(y);
    const c = capa().linea(x, y + 2, x - largo * inc, y + largo, 2);
    c.pintar(g, CUERO2, { relieve: 1.2, separar: true });
    const [px, py] = [Math.round(x - largo * inc), y + largo];
    pon(g, HIERRO, 3, [px, py]); pon(g, HIERRO, 1, [px + 1, py]);
    pon(g, HIERRO, 4, [x - 1, y + 1]); pon(g, HIERRO, 2, [x, y + 1], [x + 1, y + 1]);
    pon(g, CUERO2, 3, [x, y]); pon(g, CUERO2, 1, [x, y - 1]); pon(g, HIERRO, 3, [x, y - 2]);
  }
  function capucha(t, punta) {
    const x = t.cabX, y = t.cabY;
    const c = capa().ell(x - 1, y - 1.2, t.cabRx + 2, t.cabRy + 0.6);
    c.poly([[x - 8, y], [x - 1, y + 6], [t.torL + 6, t.torTop + 5], [t.torL - 3, t.torTop + 5], [x - 10, t.torTop - 2]]);
    c.poly([[x - 4, y + 5], [x + 7, y + 7], [t.torR - 2, t.torTop + 4], [t.torL + 2, t.torTop + 4]]);
    if (punta) c.poly([[x - 2, y - 8], [x - 7, y - 7.6], [x - 15, y - 1], [x - 7, y + 1]]);
    const hueco = capa().ell(x + 4.6, t.ojoY + 1.6, 5.4, 6.6).rect(x + 6, t.ojoY - 4, 8, 13);
    c.restar(hueco);
    return c;
  }
  function pintarCapucha(g, t, ram, piel, punta) {
    const c = capucha(t, punta);
    c.pintar(g, ram, Object.assign({ relieve: 4, separar: true }, TELA_OP));
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      const cara = (i, j) => !c.tiene(i, j) && g.rampa(i, j) === piel;
      if (cara(x + 1, y) || (cara(x, y + 1) && y < t.ojoY)) g.set(x, y, ram[3], ram);
      else if (cara(x + 2, y)) g.set(x, y, ram[1], ram);
    }
    /* Sombra que la capucha echa sobre la cara. */
    cada(g, piel, t.cabX - 4, t.ojoY - 8, t.cabX + 10, t.bocaY + 5, (x, y, k) => {
      let cerca = false;
      for (let e = 1; e <= 2 && !cerca; e++) cerca = c.tiene(x - e, y) || c.tiene(x, y - e);
      if (cerca || y < t.ojoY - 1) g.set(x, y, piel[Math.max(0, k - 1)], piel);
    });
    pliegue(g, ram, t.cabX - 7, t.cabY + 3, t.cabX - 10, t.torTop + 3);
    pliegue(g, ram, t.cabX - 3, t.cabY + 6, t.cabX - 5, t.torTop + 4);
    pliegue(g, ram, t.cabX + 2, t.cabY + 8, t.cabX + 1, t.torTop + 4);
    surco(g, ram, 1, t.cabX - 5, t.cabY - 6, t.cabX - 8, t.cabY, ram);
    return c;
  }

  /* ---------- Lo que va a la espalda ---------- */
  function capaEspalda(t, largo, vuelo) {
    const dx = t.capaDx || 0, dy = t.capaDy || 0;
    return capa().poly([[t.torL + 2, t.torTop - 1], [t.torL + 11, t.torTop - 1], [t.torL + 5 + dx / 2, t.pierTop + largo + dy / 2], [t.torL - vuelo / 2 + dx * 0.75, t.pierTop + largo + 1 + dy * 0.8], [t.torL - vuelo + dx, t.pierTop + largo - 2 + dy], [t.torL - 5, t.torTop + 8]]);
  }
  function capaPesada(g, t, tela, largo, vuelo, forro) {
    const cp = capaEspalda(t, largo, vuelo);
    cp.pintar(g, tela, { relieve: 5, max: 3, tramado: 0.14 });
    const [x0, y0, x1, y1] = cp.caja();
    /* Pliegues hondos que se abren hacia abajo. */
    for (let k = 0; k < 4; k++) {
      const xs = t.torL - 1 + k * 3, xe = x0 + 2 + k * ((x1 - x0 - 2) / 3.2);
      pliegue(g, tela, xs, t.torTop + 6 + k, xe, y1 - 2, 1);
    }
    penumbra(g, tela, x0, y0 + (y1 - y0) * 0.5, x1, y1, 0.4);
    ribete(g, cp, forro || tela, 2);
    return cp;
  }
  function espalda(g, t, clase, tela) {
    if (clase === "explorador") {
      capaPesada(g, t, tela, Math.max(14, t.rodillaY - t.pierTop + 6), 12);
      /* Carcaj de cuero con correas y flechas emplumadas. */
      const q = capa().linea(t.torL + 6, t.torTop - 4, t.torL - 3, t.torBot - 4, 6);
      q.pintar(g, CUERO, { relieve: 3, separar: true, tramado: 0.12 });
      for (const dy of [2, 14]) surco(g, CUERO2, 1, t.torL - 2 + (dy > 5 ? -3 : 0), t.torTop + dy + 2, t.torL + 8 + (dy > 5 ? -3 : 0), t.torTop + dy - 2, CUERO);
      costura(g, CUERO, t.torL + 7, t.torTop - 2, t.torL - 1, t.torBot - 5, 1);
      for (const [px, py, ram] of [[t.torL + 8, t.torTop - 11, PLUMA], [t.torL + 5, t.torTop - 10, R.tela.granate], [t.torL + 11, t.torTop - 8, PLUMA]]) {
        surco(g, MADERA, 3, px, py + 4, px - 1, py + 8, null);
        const pl = capa().poly([[px - 1.5, py - 2], [px + 0.5, py - 3], [px + 1.5, py + 3], [px - 0.5, py + 4]]);
        pl.pintar(g, ram, { relieve: 1.2, min: 1, separar: true });
        pon(g, ram, 1, [px, py], [px, py + 2]);
      }
    }
    if (clase === "bardo") capaPesada(g, t, tela, 6, 10, R.tela.granate);
    if (clase === "picaro") capaPesada(g, t, tela, 14, 12);
    if (clase === "guerrero" || clase === "clerigo") {
      const cp = capaPesada(g, t, clase === "guerrero" ? tela : R.tela.granate, Math.max(16, t.rodillaY - t.pierTop + 10), 10);
      void cp;
    }
    if (clase === "barbaro") {
      /* Piel de lobo colgando por la espalda, con el borde deshilachado. */
      const cp = capa().poly([[t.torL, t.torTop - 1], [t.torL + 9, t.torTop - 1], [t.torL + 3, t.torBot + 6], [t.torL - 9, t.torBot + 2], [t.torL - 5, t.torTop + 6]]);
      const [x0, y0, x1, y1] = cp.caja();
      for (let i = x0; i <= x1; i++) { const corte = (i % 3 + 3) % 3; for (let j = y0; j <= y1; j++) if (cp.tiene(i, j) && !cp.tiene(i, j + 3 - corte)) cp.off(i, j); }
      cp.pintar(g, PELLIZA, { relieve: 4, max: 2, tramado: 0.14 });
      pelaje(g, PELLIZA, x0 - 1, y0, x1 + 1, y1);
    }
  }
  function pelaje(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const u = ((x * 2 + y * 3) % 7 + 7) % 7, v = ((x * 3 - y * 2) % 9 + 9) % 9;
      if (u === 0 && k >= 1) g.set(x, y, ram[Math.max(0, k - 1)], ram);
      else if (v === 0 && k < 4) g.set(x, y, ram[k + 1], ram);
    });
  }

  /* ---------- Ropa de cada clase ---------- */
  function estrellaBordada(g, borda, x, y, grande) {
    borda(ORO, grande ? 3 : 2, [x, y]);
    if (grande) borda(ORO, 2, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
  }
  function musculo(g, piel, c, r = 3) {
    c.pintar(g, piel, { relieve: r, min: 1 });
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      if (!c.tiene(x, y + 1)) pon(g, piel, 0, [x, y]);
      else if (!c.tiene(x + 1, y)) pon(g, piel, 1, [x, y]);
    }
  }
  /* Peto de placas: arista central, brillo especular duro en una franja, faja con remaches. */
  function peto(g, t, T) {
    const { torL, torR, torTop, torBot, cx } = t, h = torBot - torTop;
    T.pintar(g, PLACA, Object.assign({ relieve: 7, separar: true }, METAL));
    for (let x = torL; x <= torR; x++) if (g.rampa(x, torTop) === PLACA) { pon(g, PLACA, 3, [x, torTop]); pon(g, PLACA, 0, [x, torTop + 2]); }
    for (let y = torTop + 3; y <= torTop + h * 0.6; y++) { pon(g, PLACA, 4, [cx + 3, y]); pon(g, PLACA, 1, [cx + 4, y]); }
    for (let y = torTop + 4; y <= torTop + h * 0.42; y++) { pon(g, PLACA, y < torTop + 7 ? 4 : 3, [cx - 4, y]); if (y < torTop + 10) pon(g, PLACA, 4, [cx - 3, y]); }
    pon(g, ACERO, 4, [cx - 3, torTop + 5]);
    const yp = Math.round(torTop + h * 0.62);
    for (let x = torL; x <= torR + 1; x++) if (g.rampa(x, yp) === PLACA) { pon(g, PLACA, 0, [x, yp]); pon(g, PLACA, 3, [x, yp + 1]); }
    for (let x = t.wL + 1; x <= t.wR; x += 4) if (g.rampa(x, yp + 3) === PLACA) remache(g, HIERRO, x, yp + 3);
    /* Rayas y golpes del uso. */
    for (const [i, j] of [[cx - 6, torTop + 14], [cx + 6, torTop + 11], [cx - 1, torTop + 18]]) if (g.rampa(i, j) === PLACA) { matiz(g, i, j, 1); matiz(g, i + 1, j + 1, -1); }
  }
  function faldar(g, t, n = 2) {
    const { wL, wR, torBot } = t;
    for (let k = 0; k < n; k++) {
      const py = torBot - 2 + k * 4;
      const l = capa().rect(wL - 1 - k, py, wR - wL + 3 + k * 2, 4);
      l.pintar(g, PLACA, Object.assign({ relieve: 2, separar: true }, METAL));
      for (let x = wL - 4; x <= wR + 4; x++) if (l.tiene(x, py)) { pon(g, PLACA, 3, [x, py]); if (l.tiene(x, py + 3)) pon(g, PLACA, 0, [x, py + 3]); }
      for (let x = wL + 1; x <= wR; x += 5) remache(g, HIERRO, x, py + 1);
    }
  }
  function vestir(g, t, clase, tela, piel) {
    const T = torso(t);
    const { torL, torR, torTop, torBot, pierTop, cx, wL, wR } = t;
    const h = torBot - torTop, suelo = t.suelo, ky = t.rodillaY;
    switch (clase) {
      case "guerrero": {
        /* Loriga de malla hasta la rodilla bajo el peto, con faldar de lamas. */
        const F = falda(t, Math.max(8, ky - pierTop - 2), 3);
        F.pintar(g, MALLA, Object.assign({ relieve: 4 }, METAL));
        malla(g, MALLA, wL - 10, torBot - 4, wR + 10, ky + 2);
        ribete(g, F, MALLA, 2);
        peto(g, t, T);
        faldar(g, t, 2);
        /* Sobreveste de la tela de la clase cayendo por delante, con orla de oro viejo. */
        const sv = capa().poly([[cx - 3, torBot - 5], [cx + 8, torBot - 5], [cx + 10, ky + 4], [cx - 5, ky + 4]]);
        sv.pintar(g, tela, Object.assign({ relieve: 4, separar: true }, TELA_OP));
        cada(g, tela, cx - 7, torBot - 6, cx + 12, ky + 5, (x, y) => { if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, ORO[x < cx + 2 ? 3 : 1], ORO); });
        ribete(g, sv, ORO, 2, 1);
        pliegue(g, tela, cx + 2, torBot, cx + 1, ky + 2);
        pliegue(g, tela, cx + 6, torBot + 4, cx + 7, ky + 2);
        penumbra(g, tela, cx - 4, torBot, cx + 10, ky + 4, 0.35);
        cinturon(g, t, CUERO, HIERRO, torBot - 5);
        vaina(g, wL + 2, torBot - 3, 11, 0.3);
        /* Gola sobre el cuello. */
        capa().rect(t.cabX - 4, torTop - 3, 9, 4).pintar(g, PLACA, Object.assign({ relieve: 1.6, separar: true }, METAL));
        for (let x = t.cabX - 4; x <= t.cabX + 4; x++) pon(g, PLACA, 3, [x, torTop - 3]), pon(g, PLACA, 0, [x, torTop - 1]);
        capa().ell(torL + 3, torTop + 2, 5.4, 4).pintar(g, PLACA, Object.assign({ relieve: 3, max: 3, separar: true }, METAL));
        break;
      }
      case "barbaro": {
        T.pintar(g, piel, { relieve: 11, lado: 0.26 });
        /* Pectorales, abdominales y oblicuos como bultos con su sombra honda. */
        const py = torTop + Math.round(h * 0.3);
        surco(g, piel, 1, cx - 6, torTop + 2, cx + 1, torTop + 4, piel); surco(g, piel, 3, cx - 6, torTop + 1, cx, torTop + 3, piel);
        musculo(g, piel, capa().ell(cx - 2, py - 3, 5.6, 3.6).recortar(T), 3.4);
        musculo(g, piel, capa().ell(cx + 7, py - 3, 3.6, 3.4).recortar(T), 2.6);
        for (const yy of [py + 4, py + 8, py + 12]) {
          musculo(g, piel, capa().ell(cx + 0.5, yy, 2.2, 1.6).recortar(T), 1.6);
          musculo(g, piel, capa().ell(cx + 5.5, yy, 1.8, 1.6).recortar(T), 1.4);
        }
        surco(g, piel, 1, cx + 3, torTop + 6, cx + 3, torBot - 3, piel);
        surco(g, piel, 1, cx - 5, py + 2, cx - 6, torBot - 4, piel);
        pon(g, piel, 4, [cx - 5, py - 6], [cx - 4, py - 6]);
        /* Cicatriz y pintura de guerra. */
        surco(g, piel, 4, cx - 4, py + 2, cx + 1, py + 7, piel); surco(g, piel, 1, cx - 3, py + 2, cx + 2, py + 7, piel);
        for (let k = 0; k < 2; k++) surco(g, SANGRE, 3, cx + 6 + k * 3, torTop + 5, cx + 4 + k * 3, torTop + 11, piel);
        /* Correa en bandolera con una hebilla. */
        const bd = capa().linea(torR - 1, torTop, torL + 3, torBot - 5, 3).recortar(T);
        bd.pintar(g, CUERO, { relieve: 1.4, separar: true, tramado: 0.1 });
        pon(g, HIERRO, 4, [cx - 2, torTop + Math.round(h * 0.5)]); pon(g, HIERRO, 2, [cx - 1, torTop + Math.round(h * 0.5) + 1]);
        /* Calzas de cuero y faldellín de la tela de la clase con flecos. */
        const tp = capa().poly([[wL - 2, torBot - 4], [wR + 2, torBot - 4], [wR + 4, pierTop + 8], [cx + 2, pierTop + 3], [wL - 4, pierTop + 8]])
          .poly([[cx - 3, torBot], [cx + 8, torBot], [cx + 7, pierTop + 15], [cx + 2, pierTop + 13], [cx - 2, pierTop + 15]]);
        tp.pintar(g, tela, Object.assign({ relieve: 4, separar: true }, TELA_OP));
        pliegue(g, tela, cx + 3, pierTop, cx + 3, pierTop + 12);
        pliegue(g, tela, cx - 3, pierTop - 1, cx - 6, pierTop + 6);
        ribete(g, tp, tela, 2);
        for (let x = cx - 2; x <= cx + 7; x += 2) pon(g, tela, 0, [x, pierTop + 14]);
        cinturon(g, t, CUERO, HIERRO, torBot - 6, 5);
        bolsita(g, wL - 1, torBot + 1, CUERO);
        break;
      }
      case "picaro": {
        const tr = T.copia().unir(falda(t, 8, 1));
        tr.pintar(g, tela, Object.assign({ relieve: 6 }, TELA_OP));
        ribete(g, tr, tela, 2);
        /* Jubón de cuero ceñido con costuras, tachuelas y cuello alto. */
        const jb = T.copia().quitarRect(0, 0, W, torTop + 6);
        jb.pintar(g, CUERO2, { relieve: 4, separar: true, tramado: 0.14 });
        for (let y = torTop + 7; y < torBot - 3; y++) { pon(g, CUERO2, 0, [cx + 5, y]); if (y % 3 === 0) pon(g, CUERO2, 4, [cx + 4, y]); }
        costura(g, CUERO2, torL + 2, torTop + 8, wL + 1, torBot - 4, 1);
        for (let x = torL + 2; x <= torR - 2; x += 3) if (g.rampa(x, torTop + 7) === CUERO2) remache(g, HIERRO, x, torTop + 7);
        grano(g, CUERO2, torL, torTop + 6, torR, torBot, 5, 0.12);
        /* Correaje en bandolera con cuchillos arrojadizos. */
        const bd = capa().linea(torL + 2, torTop, torR, torBot - 6, 3).recortar(T);
        bd.pintar(g, CUERO, { relieve: 1.4, separar: true });
        for (let k = 0; k < 4; k++) {
          const X = Math.round(torL + 5 + k * ((torR - torL - 6) / 4)), Y = Math.round(torTop + 2 + k * ((h - 8) / 4));
          pon(g, ACERO, 4, [X, Y - 4]); pon(g, ACERO, 3, [X, Y - 3]); pon(g, ACERO, 1, [X + 1, Y - 3]);
          pon(g, CUERO2, 2, [X, Y - 2], [X, Y - 1]); pon(g, HIERRO, 3, [X, Y]);
        }
        cinturon(g, t, CUERO, HIERRO);
        bolsita(g, wL, torBot + 2, CUERO);
        vaina(g, wR - 2, torBot - 1, 9, -0.2);
        break;
      }
      case "explorador": {
        const tr = T.copia().unir(falda(t, 9, 2));
        tr.pintar(g, tela, Object.assign({ relieve: 6 }, TELA_OP));
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 3, pierTop, cx - 5, pierTop + 8);
        pliegue(g, tela, cx + 7, pierTop, cx + 9, pierTop + 8);
        /* Jubón de cuero sin mangas, cerrado con cordones cruzados. */
        const jb = capa().rect(torL, torTop + 1, torR - torL + 1, h - 1).quitarRect(cx + 2, torTop + 1, 5, 4);
        jb.recortar(T).pintar(g, CUERO, { relieve: 5, separar: true, tramado: 0.14 });
        for (let y = torTop + 6; y < torBot - 5; y += 3) { pon(g, HUESO, 3, [cx + 2, y], [cx + 4, y + 1]); pon(g, HUESO, 2, [cx + 3, y + 1], [cx + 5, y]); pon(g, CUERO, 0, [cx + 1, y], [cx + 6, y]); }
        pliegue(g, CUERO, cx - 5, torTop + 5, cx - 6, torBot - 6);
        costura(g, CUERO, torL + 2, torTop + 3, torL + 1, torBot - 6, 1);
        grano(g, CUERO, torL, torTop, torR, torBot, 7, 0.12);
        /* Correa del carcaj en bandolera. */
        const co = capa().linea(torL + 2, torTop, torR, torBot - 6, 3).recortar(T.copia().unir(capa().rect(torL - 3, torTop - 3, torR - torL + 6, 4)));
        co.pintar(g, CUERO2, { relieve: 1.2, separar: true });
        pon(g, HIERRO, 4, [cx - 2, torTop + Math.round(h * 0.35)]); pon(g, HIERRO, 1, [cx - 1, torTop + Math.round(h * 0.35) + 1]);
        cinturon(g, t, CUERO2, HIERRO);
        bolsita(g, wR - 1, torBot + 2, CUERO);
        vaina(g, wL + 1, torBot - 1, 11, 0.25);
        break;
      }
      case "mago":
      case "brujo": {
        const bru = clase === "brujo";
        const largo = suelo - pierTop - 3;
        const tn = T.copia().unir(falda(t, largo, bru ? 9 : 7));
        tn.pintar(g, tela, Object.assign({ relieve: 7 }, TELA_OP));
        penumbra(g, tela, wL - 12, pierTop, wR + 12, suelo, 0.4);
        /* Pliegues pesados que caen rectos desde la cintura. */
        for (const [a0, a1, b0] of [[-3, -8, 2], [9, 13, 4], [-9, -13, 8], [3, 3, 10], [-1, -3, 18]]) pliegue(g, tela, cx + a0, pierTop + b0, cx + a1, suelo - 4);
        grano(g, tela, wL - 12, torTop, wR + 12, suelo, bru ? 11 : 9, 0.03);
        if (!bru) {
          /* Abertura delantera con galón de oro viejo y estrellas bordadas, discretas. */
          surco(g, ORO, 1, cx + 4, torTop + 3, cx + 7, suelo - 3, tela);
          surco(g, ORO, 2, cx + 3, torTop + 3, cx + 6, suelo - 3, tela);
          ribete(g, tn, ORO, 2, 1);
          const borda = (ram, k, ...pts) => { for (const [i, j] of pts) if (g.rampa(i, j) === tela && j < suelo - 3) pon(g, ram, Math.min(k, tono(g, i, j) + 1), [i, j]); };
          for (const [sx, sy, gr] of [[cx - 4, torTop + 9, true], [cx + 10, pierTop + 10, true], [cx - 8, pierTop + 18, true], [cx - 1, pierTop + 30, false], [cx + 13, pierTop + 26, false], [cx - 11, pierTop + 5, false], [cx + 2, pierTop + 4, false]])
            estrellaBordada(g, borda, sx, sy, gr);
          /* Fajín de tela granate con borla, y un portapergaminos. */
          for (let x = wL - 2; x <= wR + 2; x++) { pon(g, R.tela.granate, 3, [x, torBot - 4]); pon(g, R.tela.granate, 2, [x, torBot - 3]); pon(g, R.tela.granate, 1, [x, torBot - 2]); }
          surco(g, R.tela.granate, 2, cx - 4, torBot - 1, cx - 5, torBot + 5, null);
          pon(g, ORO, 3, [cx - 5, torBot + 6]); pon(g, ORO, 1, [cx - 5, torBot + 7]);
          capa().rect(wL - 2, torBot - 2, 3, 10).pintar(g, CUERO, { relieve: 1.4, separar: true });
          pon(g, ORO, 3, [wL - 2, torBot - 2], [wL - 1, torBot - 2]); pon(g, ORO, 2, [wL - 2, torBot + 7], [wL - 1, torBot + 7]);
          /* Cuello alto. */
          capa().rect(t.cabX - 4, torTop - 3, 9, 4).pintar(g, tela, { relieve: 1.6, min: 2, separar: true });
          for (let x = t.cabX - 4; x <= t.cabX + 4; x++) pon(g, ORO, 2, [x, torTop - 3]);
        } else {
          /* Panel central oscuro con runas tenues, fajín negro y broche con gema. */
          const pn = capa().poly([[cx - 1, torTop + 3], [cx + 8, torTop + 3], [cx + 11, suelo], [cx - 4, suelo]]).recortar(tn);
          pn.pintar(g, R.tela.negro, Object.assign({ relieve: 4, separar: true }, TELA_OP));
          const RUNAS = [["K.", "KK", "K."], [".K", "K.", ".K"], ["KK", ".K", "K."], ["K.", ".K", "KK"]];
          let k = 0;
          for (let y = pierTop; y < suelo - 6; y += 7, k++) {
            const rx = cx + 2 + Math.round((y - pierTop) / 14);
            sello(g, rx, y, RUNAS[k % RUNAS.length], { K: [R.magia[3], R.magia] }, (i, j) => g.rampa(i, j) === R.tela.negro);
          }
          ribete(g, tn, R.magia, 2, 1);
          for (let x = wL - 2; x <= wR + 2; x++) { pon(g, R.tela.negro, 3, [x, torBot - 4]); pon(g, R.tela.negro, 2, [x, torBot - 3]); pon(g, R.tela.negro, 1, [x, torBot - 2]); }
          capa().ell(cx + 4, torBot - 3, 2, 2).pintar(g, ORO, { relieve: 1.6, min: 1 });
          pon(g, R.magia, 3, [cx + 4, torBot - 3]); pon(g, R.magia, 4, [cx + 3, torBot - 4]);
          capa().poly([[torL - 1, torTop + 1], [torL + 7, torTop - 2], [torL + 9, torTop + 5], [torL - 4, torTop + 8]]).pintar(g, tela, { relieve: 3, max: 3, separar: true });
          capa().rect(t.cabX - 4, torTop - 3, 9, 4).pintar(g, tela, { relieve: 1.6, min: 2, separar: true });
          vaina(g, wR - 1, torBot - 1, 8, -0.2);
        }
        break;
      }
      case "clerigo": {
        const F = falda(t, Math.max(8, ky - pierTop), 3);
        F.pintar(g, MALLA, Object.assign({ relieve: 4 }, METAL));
        T.pintar(g, MALLA, Object.assign({ relieve: 7, separar: true }, METAL));
        malla(g, MALLA, torL - 5, torTop - 2, torR + 5, ky + 4);
        ribete(g, F, MALLA, 2);
        /* Tabardo de lino con el sol sagrado bordado. */
        const sv = capa().rect(cx - 6, torTop + 1, 16, h).poly([[cx - 8, torBot - 2], [cx + 11, torBot - 2], [cx + 12, ky + 2], [cx - 9, ky + 2]]);
        sv.pintar(g, tela, Object.assign({ relieve: 5, separar: true }, TELA_OP));
        cada(g, tela, cx - 10, torTop, cx + 13, ky + 3, (x, y) => { if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, ORO[x < cx + 2 ? 3 : 1], ORO); });
        ribete(g, sv, ORO, 2, 1);
        pliegue(g, tela, cx - 3, torBot, cx - 5, ky);
        pliegue(g, tela, cx + 6, torBot, cx + 8, ky);
        penumbra(g, tela, cx - 9, torBot, cx + 13, ky + 2, 0.35);
        grano(g, tela, cx - 9, torTop, cx + 13, ky + 2, 13, 0.08);
        const sx = cx + 2, sy = torTop + Math.round(h * 0.36);
        capa().ell(sx, sy, 2.6, 2.6).pintar(g, ORO, { relieve: 2, min: 1 });
        pon(g, ORO, 4, [sx - 1, sy - 1]);
        for (let k = 0; k < 8; k++) {
          const an = (k / 8) * Math.PI * 2, r = k % 2 ? 4.6 : 5.8;
          surco(g, ORO, k % 2 ? 1 : 2, sx + Math.cos(an) * 3.6, sy + Math.sin(an) * 3.6, sx + Math.cos(an) * r, sy + Math.sin(an) * r, tela);
        }
        cinturon(g, t, CUERO, HIERRO);
        bolsita(g, wL, torBot + 2, CUERO);
        capa().ell(torL + 3, torTop + 2, 5, 3.8).pintar(g, PLACA, Object.assign({ relieve: 3, max: 3, separar: true }, METAL));
        break;
      }
      case "bardo": {
        const tr = T.copia().unir(falda(t, 8, 2));
        tr.pintar(g, tela, Object.assign({ relieve: 6 }, TELA_OP));
        ribete(g, tr, R.tela.granate, 2, 2);
        /* Jubón con botonadura, cuchilladas con el forro granate y gorguera. */
        for (let y = torTop + 2; y <= torBot - 4; y++) pon(g, tela, 1, [cx + 4, y]), pon(g, tela, 3, [cx + 3, y]);
        for (let y = torTop + 4; y <= torBot - 5; y += 4) { pon(g, ORO, 3, [cx + 5, y]); pon(g, ORO, 1, [cx + 6, y + 1]); }
        for (const [x0, y0] of [[cx - 5, torTop + 6], [cx - 2, torTop + 13], [cx - 7, torTop + 16], [cx - 1, pierTop + 1]]) {
          pon(g, R.tela.granate, 3, [x0, y0], [x0, y0 + 1]); pon(g, R.tela.granate, 1, [x0, y0 + 2]);
          pon(g, tela, 4, [x0 - 1, y0], [x0 - 1, y0 + 1]); pon(g, tela, 0, [x0 + 1, y0 + 1], [x0 + 1, y0 + 2]);
        }
        pliegue(g, tela, cx - 4, torTop + 4, cx - 4, torBot - 6); pliegue(g, tela, cx + 8, torTop + 8, cx + 9, torBot - 4); pliegue(g, tela, torL + 3, torTop + 10, torL + 4, torBot - 4);
        pliegue(g, tela, cx - 1, pierTop, cx - 3, pierTop + 7);
        grano(g, tela, torL, torTop, torR, pierTop + 9, 17, 0.04);
        capa().ell(t.cabX - 0.5, torTop - 0.5, 5.6, 2).pintar(g, HUESO, { relieve: 1.4, min: 2, separar: true });
        cada(g, HUESO, t.cabX - 7, torTop - 3, t.cabX + 6, torTop + 2, (x, y, k) => { if (x % 2 === 0) pon(g, HUESO, Math.max(1, k - 1), [x, y]); });
        cinturon(g, t, CUERO, ORO);
        bolsita(g, wL + 1, torBot + 2, CUERO);
        vaina(g, wL - 1, torBot - 1, 10, 0.3);
        break;
      }
      default: {
        const tr = T.copia().unir(falda(t, 10, 2));
        tr.pintar(g, tela, Object.assign({ relieve: 6 }, TELA_OP));
        penumbra(g, tela, wL - 6, pierTop, wR + 6, pierTop + 12, 0.35);
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 3, pierTop, cx - 5, pierTop + 10);
        pliegue(g, tela, cx + 6, pierTop + 1, cx + 8, pierTop + 10);
        pliegue(g, tela, cx - 6, torTop + 5, cx - 5, torBot - 4);
        grano(g, tela, torL, torTop, torR, pierTop + 12, 19, 0.08);
        capa().ell(t.cabX + 1, torTop + 1, 2, 1.6).pintar(g, piel, { relieve: 1.2, max: 2 });
        for (let x = wL - 2; x <= wR + 2; x++) if (g.get(x, torBot - 3)) { pon(g, CUERO, (x % 3) ? 3 : 2, [x, torBot - 3]); pon(g, CUERO, 1, [x, torBot - 2]); }
        surco(g, CUERO, 2, cx + 4, torBot - 2, cx + 5, torBot + 4, null);
      }
    }
  }

  /* ---------- Tocados ---------- */
  function tocado(g, t, clase, tela, piel) {
    const x = t.cabX, y = t.cabY, oy = t.ojoY, f = t.narizX;
    switch (clase) {
      case "guerrero": {
        /* Yelmo de cara abierta: cúpula, banda con remaches, nasal, carrilleras y cubrenuca. */
        const yelmo = capa().ell(x - 0.6, y - 2.4, t.cabRx + 1, t.cabRy - 0.6);
        yelmo.quitarRect(x + 1, oy - 2, 12, 14);
        yelmo.borrarDesde(y + 6);
        yelmo.rect(x - 1, oy - 2, 2, 8);
        yelmo.rect(Math.round(x - t.cabRx - 1.5), oy - 2, 5, 7);
        yelmo.pintar(g, PLACA, Object.assign({ relieve: 5, separar: true }, METAL));
        for (let j = oy - 3; j <= oy + 2; j++) { pon(g, PLACA, j < oy + 2 ? 3 : 1, [f - 1, j]); pon(g, PLACA, 1, [f, j]); }
        for (let i = x - 8; i <= f + 1; i++) {
          if (g.rampa(i, oy - 3) !== PLACA) continue;
          pon(g, PLACA, 0, [i, oy - 5]); pon(g, PLACA, 3, [i, oy - 4]); pon(g, PLACA, 2, [i, oy - 3]);
          if (((i - x) % 3 + 3) % 3 === 0) pon(g, HIERRO, 4, [i, oy - 4]);
        }
        /* Cresta y brillo especular duro. */
        for (let j = y - 9; j <= y - 3; j++) { const i = x - 1 + Math.round((j - y) * 0.1); if (g.rampa(i, j) === PLACA) pon(g, PLACA, 4, [i, j]), pon(g, PLACA, 1, [i + 1, j]); }
        pon(g, ACERO, 4, [x - 4, y - 6]); pon(g, PLACA, 4, [x - 5, y - 6], [x - 4, y - 7], [x - 5, y - 5]);
        /* Penacho de crin que cae hacia atrás. */
        const pe = capa().curva(x - 1, y - 9, x - 6, y - 16, x - 13, y - 9, 4.2, 1.6).curva(x - 3, y - 9, x - 9, y - 13, x - 14, y - 3, 3, 1);
        pe.pintar(g, tela, { relieve: 2.4, separar: true, tramado: 0.1 });
        cada(g, tela, x - 17, y - 18, x + 2, y - 2, (i, j, k) => { if (pe.tiene(i, j) && ((i + j * 2) % 3 + 3) % 3 === 0 && k >= 1) g.set(i, j, tela[k - 1], tela); });
        capa().rect(x - 2, y - 10, 3, 2).pintar(g, HIERRO, { relieve: 1, min: 2 });
        break;
      }
      case "brujo": pintarCapucha(g, t, tela, piel, true); break;
      case "explorador": pintarCapucha(g, t, tela, piel, false); break;
      case "picaro": pintarCapucha(g, t, tela, piel, false); break;
      case "clerigo": {
        pintarCapucha(g, t, MALLA, piel, false);
        malla(g, MALLA, x - 14, y - 10, x + 10, t.torTop + 6);
        for (let i = x - 8; i <= x + 5; i++) {
          const j = oy - 4 + (i > x + 1 ? 1 : 0);
          if (g.rampa(i, j) === MALLA || g.rampa(i, j + 1) === MALLA) { pon(g, ORO, (i - x) % 4 === 0 ? 4 : 3, [i, j]); pon(g, ORO, 1, [i, j + 1]); }
        }
        pon(g, SANGRE, 4, [x + 1, oy - 4]); pon(g, SANGRE, 2, [x + 2, oy - 4]);
        break;
      }
      case "mago": {
        /* Sombrero de ala ancha y copa alta que se dobla hacia atrás, con cinta y dos estrellas bordadas. */
        const by = y - 5;
        const ala = capa().ell(x - 0.5, by, t.cabRx + 5, 1.7);
        const alt = Math.min(t.altSombrero || 18, by - 2);
        const cono = capa().poly([[x - 6, by - 0.5], [x + 5, by - 0.5], [x + 2.5, by - alt * 0.5], [x - 0.5, by - alt * 0.85], [x - 4, by - alt], [x - 8, by - alt + 1],
          [x - 13, by - alt * 0.5], [x - 9, by - alt * 0.62], [x - 6, by - alt * 0.4], [x - 6.5, by - 2]]);
        cono.quitarRect(0, 0, W, 2);
        cono.pintar(g, tela, Object.assign({ relieve: 4, separar: true }, TELA_OP));
        ala.pintar(g, tela, { relieve: 2, separar: true });
        const [ax0, , ax1] = ala.caja();
        for (let i = ax0; i <= ax1; i++) for (let j = by - 3; j <= by + 3; j++) {
          if (!ala.tiene(i, j)) continue;
          if (!ala.tiene(i, j + 1)) pon(g, tela, 0, [i, j]);
          else if (!ala.tiene(i, j - 1) && !cono.tiene(i, j - 1)) pon(g, tela, 3, [i, j]);
        }
        /* Sombra del ala sobre la frente. */
        cada(g, piel, x - 4, by + 2, f + 2, by + 3, (i, j, k) => g.set(i, j, piel[Math.max(0, k - 2)], piel));
        const b1 = Math.round(by - 1), b2 = Math.round(by - 3);
        for (let i = x - 8; i <= x + 6; i++) for (let j = b2; j <= b1; j++) if (cono.tiene(i, j) && g.rampa(i, j) === tela) pon(g, j === b1 ? R.tela.granate : R.tela.granate, j === b1 ? 1 : 2, [i, j]);
        pon(g, ORO, 3, [x, b2]); pon(g, ORO, 1, [x, b1]);
        const borda = (ram, k, ...pts) => { for (const [i, j] of pts) if (g.rampa(i, j) === tela && cono.tiene(i, j)) pon(g, ram, Math.min(k, tono(g, i, j) + 1), [i, j]); };
        estrellaBordada(g, borda, x - 2, Math.round(by - alt * 0.5), true);
        estrellaBordada(g, borda, x - 9, Math.round(by - alt * 0.56), false);
        estrellaBordada(g, borda, x + 1, Math.round(by - alt * 0.25), false);
        pliegue(g, tela, x + 3, by - 4, x, Math.round(by - alt * 0.7));
        pliegue(g, tela, x - 4, Math.round(by - alt * 0.8), x - 9, Math.round(by - alt * 0.6));
        break;
      }
      case "bardo": {
        /* Chambergo de fieltro: copa baja, ala ancha levantada por delante, cinta granate y una pluma larga. */
        const by = Math.round(y - 6);
        const copa = capa().ell(x - 1.5, by - 2, 5.4, 3.6).borrarDesde(by + 1);
        const ala = capa().ell(x - 0.5, by + 1, t.cabRx + 5, 1.6).poly([[x + 4, by + 2.5], [x + 9, by - 1], [x + 12, by - 3], [x + 12, by], [x + 9, by + 2.5]]);
        copa.pintar(g, tela, Object.assign({ relieve: 3.4, separar: true }, TELA_OP));
        for (let i = x - 8; i <= x + 5; i++) { if (copa.tiene(i, by - 1)) pon(g, R.tela.granate, 3, [i, by - 1]); if (copa.tiene(i, by)) pon(g, R.tela.granate, 1, [i, by]); }
        ala.pintar(g, tela, { relieve: 2, separar: true });
        const [ax0, , ax1] = ala.caja();
        for (let i = ax0; i <= ax1; i++) for (let j = by - 4; j <= by + 4; j++) {
          if (!ala.tiene(i, j)) continue;
          if (!ala.tiene(i, j + 1)) pon(g, tela, 0, [i, j]);
          else if (!ala.tiene(i, j - 1) && !copa.tiene(i, j - 1)) pon(g, tela, 3, [i, j]);
        }
        cada(g, piel, x - 4, by + 3, f + 2, by + 4, (i, j, k) => g.set(i, j, piel[Math.max(0, k - 2)], piel));
        const pl = capa().curva(x - 5, by - 1, x - 11, by - 13, x - 20, by - 10, 3.4, 1);
        pl.pintar(g, PLUMA, { relieve: 1.6, min: 1, separar: true });
        surco(g, PLUMA, 1, x - 6, by - 2, x - 10, by - 9, PLUMA);
        surco(g, PLUMA, 1, x - 11, by - 10, x - 18, by - 10, PLUMA);
        cada(g, PLUMA, x - 22, by - 14, x - 15, by - 6, (i, j, k) => pon(g, R.tela.granate, k >= 3 ? 3 : 2, [i, j]));
        pon(g, ORO, 3, [x - 5, by - 1]); pon(g, ORO, 1, [x - 4, by]);
        break;
      }
    }
  }
  /* Hombrera de placas: tres lamas solapadas con su arista clara y remaches. */
  function hombrera(g, t) {
    const [hx, hy] = t.hombro;
    capa().ell(hx, hy - 1, 5.6, 4.4).pintar(g, PLACA, Object.assign({ relieve: 3.4, separar: true }, METAL));
    capa().ell(hx + 0.5, hy + 3, 4.8, 2.4).pintar(g, PLACA, Object.assign({ relieve: 2, separar: true }, METAL));
    capa().ell(hx + 1, hy + 5.6, 3.8, 1.8).pintar(g, PLACA, Object.assign({ relieve: 1.6, separar: true }, METAL));
    destello(g, PLACA, hx - 2, hy - 3, true);
    remache(g, HIERRO, hx + 2, hy + 3); remache(g, HIERRO, hx - 2, hy + 3);
  }

  /* ---------- Escudo ---------- */
  function escudo(g, sx, sy, tela) {
    /* Escudo de lágrima: reborde de hierro con remaches, campo de la tela gastado y una cruz de lino; arañazos. */
    const hw = 9;
    const borde = capa().poly([[sx - hw, sy - 9], [sx - hw + 3, sy - 10], [sx + hw - 3, sy - 10], [sx + hw, sy - 9], [sx + hw, sy + 3], [sx + 5, sy + 13], [sx, sy + 17], [sx - 5, sy + 13], [sx - hw, sy + 3]]);
    borde.pintar(g, HIERRO, Object.assign({ relieve: 3, min: 1 }, METAL));
    perfilar(g, borde);
    const campo = capa().poly([[sx - hw + 2, sy - 8], [sx + hw - 2, sy - 8], [sx + hw - 2, sy + 2.4], [sx + 3.6, sy + 12], [sx, sy + 14.6], [sx - 3.6, sy + 12], [sx - hw + 2, sy + 2.4]]);
    campo.pintar(g, tela, { relieve: 7, luz: [-0.6, -0.5, 0.7], tramado: 0.14 });
    penumbra(g, tela, sx - hw, sy + 2, sx + hw, sy + 15, 0.3);
    const cxs = Math.round(sx), cys = sy - 2;
    const cruz = (i, j, k) => { if (campo.tiene(i, j)) pon(g, HUESO, k, [i, j]); };
    for (let j = sy - 7; j <= sy + 13; j++) { cruz(cxs - 1, j, 3); cruz(cxs, j, 2); cruz(cxs + 1, j, 1); }
    for (let i = cxs - 6; i <= cxs + 6; i++) { cruz(i, cys - 1, i < cxs ? 3 : 2); cruz(i, cys, 2); cruz(i, cys + 1, 1); }
    grano(g, HUESO, sx - hw, sy - 9, sx + hw, sy + 15, 23, 0.18);
    for (let i = Math.round(sx - hw); i <= Math.round(sx + hw); i++) if (g.rampa(i, sy - 10) === HIERRO) pon(g, HIERRO, 4, [i, sy - 10]);
    for (let j = sy - 9; j <= sy + 3; j++) if (g.rampa(Math.round(sx - hw), j) === HIERRO) pon(g, HIERRO, 3, [Math.round(sx - hw), j]);
    for (const [i, j] of [[sx - hw + 1, sy - 9], [sx + hw - 1, sy - 9], [sx - hw, sy + 2], [sx + hw - 1, sy + 2], [sx, sy + 16], [sx - 5, sy + 11], [sx + 4, sy + 11]]) pon(g, HIERRO, 4, [Math.round(i), Math.round(j)]);
    /* Arañazos y golpes en la pintura. */
    for (const [i, j, l] of [[sx - 6, sy - 5, 3], [sx + 3, sy + 4, 4], [sx - 4, sy + 7, 2]]) for (let s = 0; s < l; s++) if (g.rampa(i + s, j + s) === tela) pon(g, tela, 4, [i + s, j + s]);
  }

  /* ---------- Poses ---------- */
  const POSES = ["normal", "ataque", "conjuro", "herido", "victoria"];
  const LUZ = {
    mago: ["#1a1840", "#343890", "#5e6ad0", "#a0aef0", "#eef0ff"],
    brujo: ["#221034", "#5a2a86", "#3c9a58", "#8ce08a", "#ecffe0"],
    clerigo: ["#3e260c", "#8a5c18", "#c8982e", "#f0d878", "#fffbe2"],
    bardo: ["#0a2628", "#14625c", "#249888", "#5cd8c2", "#dcfff6"],
    neutro: ["#33323e", "#605e70", "#9a9cae", "#d4d6e2", "#ffffff"]
  };
  const ESTELA = ["#3a3d44", "#575b63", "#7e838b", "#a9aeb5", "#d6d9dc"];

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
    t.altSombrero = Math.min(18, t.cabY - 9);
    if (pose === "ataque") {
      mover(t, 2, 4); P.incl = 0.07;
      t.pieAtras -= 6; t.pieDelante += 7; t.kDx = 5;
      t.faldaI = -5; t.faldaD = 5; t.capaDx = -8; t.capaDy = -5;
    } else if (pose === "conjuro") {
      t.pieAtras -= 2; t.pieDelante += 2; P.incl = -0.03;
      t.faldaI = -5; t.faldaIy = -4; t.faldaD = 3; t.faldaDy = -2; t.capaDx = -10; t.capaDy = -6;
    } else if (pose === "herido") {
      mover(t, -2, 3); P.incl = -0.08; P.cab = -0.12;
      t.pieAtras -= 2; t.kDx = 5; t.kAx = -1;
      t.faldaI = -2; t.faldaD = 3; t.capaDx = 3; t.capaDy = 2;
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
  function marco(ox, oy, angGrados) {
    const a = (angGrados * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const f = (x, y) => [ox + x * c - y * s, oy + x * s + y * c];
    const m = {
      f,
      inv: (X, Y) => { const dx = X - ox, dy = Y - oy; return [dx * c + dy * s, -dx * s + dy * c]; },
      at: (x, y) => { const [X, Y] = f(x, y); return [Math.round(X), Math.round(Y)]; },
      poly: (k, pts) => k.poly(pts.map(p => f(p[0], p[1]))),
      ell: (k, cx, cy, rx, ry = rx) => { const pts = []; for (let i = 0; i < 28; i++) { const b = (i / 28) * Math.PI * 2; pts.push([cx + Math.cos(b) * (rx + 0.3), cy + Math.sin(b) * (ry + 0.3)]); } return m.poly(k, pts); },
      rect: (k, x, y, w, h) => m.poly(k, [[x - 0.5, y - 0.5], [x + w - 0.5, y - 0.5], [x + w - 0.5, y + h - 0.5], [x - 0.5, y + h - 0.5]]),
      linea: (k, x0, y0, x1, y1, gr) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); return k.linea(a0, b0, a1, b1, gr); },
      curva: (k, x0, y0, cx, cy, x1, y1, g0, g1) => { const [a0, b0] = f(x0, y0), [ca, cb] = f(cx, cy), [a1, b1] = f(x1, y1); return k.curva(a0, b0, ca, cb, a1, b1, g0, g1); },
      pon: (g, ram, k, ...pts) => { for (const [x, y] of pts) { const [X, Y] = m.at(x, y); g.set(X, Y, ram[lim(k, 0, 4)], ram); } },
      surco: (g, ram, k, x0, y0, x1, y1, solo) => { const [a0, b0] = f(x0, y0), [a1, b1] = f(x1, y1); surco(g, ram, k, a0, b0, a1, b1, solo); }
    };
    return m;
  }
  /* Hoja de acero: bisel claro del lado de la luz, canal central y filo en sombra. */
  function pintarHoja(g, c, m, punta, ancho = 1.5, vaceo = true) {
    const [x0, y0, x1, y1] = c.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!c.tiene(x, y)) continue;
      const [lx, ly] = m.inv(x, y);
      let k;
      if (lx < -ancho * 0.35) k = 3;
      else if (lx < ancho * 0.35) k = vaceo && ly > punta + 6 && ly < -7 ? 2 : 3;
      else k = 1;
      g.set(x, y, ACERO[k], ACERO);
    }
  }

  /* ---------- Armas en su marco (mano en 0,0; la punta hacia y negativas) ---------- */
  function espadaL(g, m, largo) {
    const hj = capa();
    m.poly(hj, [[-1.6, -4], [1.6, -4], [1.4, -largo + 4], [0, -largo - 0.5], [-1.4, -largo + 4]]);
    pintarHoja(g, hj, m, -largo, 1.6);
    for (const [bx, by] of [m.at(-1, -largo + 5), m.at(-1, -largo * 0.5), m.at(-1, -largo * 0.5 + 1)]) pon(g, ACERO, 4, [bx, by]);
    perfilar(g, hj);
    const gd = capa(); m.rect(gd, -5, -4, 11, 2);
    gd.pintar(g, HIERRO, Object.assign({ relieve: 1, min: 1, separar: true }, METAL));
    m.pon(g, HIERRO, 4, [-5, -4], [-4, -4]); m.pon(g, HIERRO, 1, [5, -3]);
    const pu = capa(); m.rect(pu, -1, -2, 2, 7); pu.pintar(g, CUERO2, { relieve: 1, min: 1 });
    for (let j = -2; j <= 4; j += 2) m.pon(g, CUERO2, 3, [-1, j]);
    const pm = capa(); m.ell(pm, 0, 6, 1.4, 1.2); pm.pintar(g, HIERRO, Object.assign({ relieve: 1, min: 1 }, METAL));
    m.pon(g, HIERRO, 4, [-1, 5]);
  }
  function hachaL(g, m) {
    const mango = capa(); m.linea(mango, 0, 16, 0, -30, 3);
    mango.pintar(g, MADERA, { relieve: 1.6, min: 1 });
    m.surco(g, MADERA, 3, -1, 14, -1, -26, MADERA);
    for (let j = 2; j <= 12; j += 2) m.pon(g, CUERO2, 2, [-1, j], [0, j], [1, j]), m.pon(g, CUERO2, 3, [-1, j + 1]);
    const hy = -27;
    /* Hoja barbada de hierro forjado, filo curvo afilado y brillante. */
    const hj = capa(); m.poly(hj, [[1, hy - 4], [5, hy - 6], [11, hy - 9], [12.5, hy - 2], [11.5, hy + 5], [8, hy + 9], [5, hy + 5], [1, hy + 2]]);
    hj.restar(m.ell(capa(), 6.6, hy + 7.4, 2.6, 2.6));
    hj.pintar(g, HIERRO, Object.assign({ relieve: 3, separar: true }, METAL));
    const marcas = [];
    const [x0, y0, x1, y1] = hj.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!hj.tiene(x, y)) continue;
      const [lx, ly] = m.inv(x, y);
      const [a1, b1] = m.at(lx + 1.2, ly), [a2, b2] = m.at(lx + 2.4, ly);
      if (!hj.tiene(a1, b1)) marcas.push([x, y, 4]); else if (!hj.tiene(a2, b2)) marcas.push([x, y, 3]);
    }
    for (const [x, y, k] of marcas) g.set(x, y, ACERO[k], ACERO);
    m.surco(g, HIERRO, 1, 3, hy - 3, 3, hy + 2, HIERRO);
    const pc = capa(); m.poly(pc, [[-1, hy - 2], [-6, hy], [-1, hy + 2]]); pc.pintar(g, HIERRO, Object.assign({ relieve: 1, separar: true }, METAL));
    m.pon(g, HIERRO, 4, [0, hy - 3]);
  }
  function dagaL(g, m) {
    const hj = capa(); m.poly(hj, [[-1.2, -3], [1.2, -3], [1, -11], [0, -14], [-1, -11]]);
    pintarHoja(g, hj, m, -13, 1.2, false);
    const [bx, by] = m.at(-1, -9); pon(g, ACERO, 4, [bx, by]);
    perfilar(g, hj);
    const gd = capa(); m.rect(gd, -3, -3, 7, 1); gd.pintar(g, HIERRO, { relieve: 1, min: 2 });
    const pu = capa(); m.rect(pu, -1, -2, 2, 5); pu.pintar(g, CUERO2, { relieve: 1, min: 1 });
    m.pon(g, HIERRO, 4, [0, 4]);
  }
  function mazaL(g, m) {
    const mg = capa(); m.rect(mg, -1, -18, 3, 26); mg.pintar(g, MADERA, { relieve: 1.4, min: 1 });
    for (let j = -2; j <= 6; j += 2) m.pon(g, CUERO2, 2, [-1, j], [0, j], [1, j]);
    const cy = -22;
    /* Cabeza de pestañas: seis aletas de hierro alrededor de un núcleo. */
    const cb = capa(); m.rect(cb, -2, cy - 5, 5, 10); cb.pintar(g, HIERRO, Object.assign({ relieve: 1.6, min: 1, separar: true }, METAL));
    const al = capa();
    m.poly(al, [[-6, cy - 3], [-2, cy - 5], [-2, cy + 5], [-6, cy + 3]]); m.poly(al, [[7, cy - 3], [3, cy - 5], [3, cy + 5], [7, cy + 3]]);
    al.pintar(g, HIERRO, Object.assign({ relieve: 1.4, min: 1, separar: true }, METAL));
    for (let j = cy - 3; j <= cy + 3; j++) m.pon(g, HIERRO, 4, [-5, j]), m.pon(g, HIERRO, 3, [0, j]), m.pon(g, HIERRO, 1, [6, j]);
    m.pon(g, ACERO, 4, [-5, cy - 2], [-1, cy - 4]);
    m.pon(g, HIERRO, 3, [0, cy - 7], [1, cy - 7]); m.pon(g, HIERRO, 1, [1, cy - 6]);
    m.pon(g, HIERRO, 3, [0, 9]); m.pon(g, HIERRO, 1, [1, 9]);
  }
  /* Bastón de fresno con runas talladas que brillan tenues y un orbe engarzado en la horquilla. */
  function bastonL(g, m, arriba, abajo) {
    const oy = -arriba;
    const vara = capa(); m.rect(vara, -1, oy + 4, 3, abajo - oy - 4); vara.pintar(g, MADERA, { relieve: 1.4, min: 1 });
    m.surco(g, MADERA, 3, -1, oy + 6, -1, abajo - 2, MADERA);
    for (let j = oy + 9; j < abajo - 2; j += 7) { m.pon(g, MADERA, 0, [0, j], [1, j + 1]); m.pon(g, MADERA, 4, [-1, j - 1]); }
    let k = 0;
    for (let j = oy + 9; j < Math.min(abajo - 8, oy + 27); j += 6, k++) { m.pon(g, RUNA, 2, [0, j], [0, j + 2]); m.pon(g, RUNA, k % 2 ? 1 : 3, [0, j + 1]); }
    const ga = capa(); m.curva(ga, -1.5, oy + 5, -5, oy + 2, -3, oy - 3.5, 2, 1); m.curva(ga, 1.5, oy + 5, 5, oy + 2, 3, oy - 3.5, 2, 1);
    const [X, Y] = m.at(0, oy);
    const orbe = capa().ell(X, Y, 3.2, 3.2);
    orbe.pintar(g, R.mar, { relieve: 2.6, min: 1 });
    pon(g, R.mar, 4, [X - 1, Y - 2]); pon(g, R.mar, 3, [X - 2, Y - 1], [X, Y - 2]); pon(g, R.mar, 0, [X + 2, Y + 1], [X + 1, Y + 2]);
    ga.pintar(g, MADERA, { relieve: 1.2, min: 1, separar: true });
    const an = capa(); m.rect(an, -2, oy + 4, 5, 2); an.pintar(g, HIERRO, Object.assign({ relieve: 1, min: 1 }, METAL));
    m.pon(g, HIERRO, 4, [-2, oy + 4]);
    return [X, Y];
  }
  function chispa(g, ram, X, Y, grande) {
    X = Math.round(X); Y = Math.round(Y);
    pon(g, ram, 4, [X, Y]);
    pon(g, ram, 2, [X - 1, Y], [X + 1, Y], [X, Y - 1], [X, Y + 1]);
    if (grande) pon(g, ram, 1, [X - 2, Y], [X + 2, Y], [X, Y - 2], [X, Y + 2]);
  }
  function cristal(g, cx, cy) {
    const cr = capa().poly([[cx, cy - 7], [cx + 3.5, cy - 1], [cx, cy + 6], [cx - 3.5, cy - 1]]);
    cr.pintar(g, R.magia, { relieve: 2.4, min: 1 });
    surco(g, R.magia, 4, cx - 1, cy - 5, cx - 2, cy - 1, R.magia);
    surco(g, R.magia, 3, cx, cy - 6, cx, cy + 5, R.magia);
    surco(g, R.magia, 1, cx + 2, cy, cx + 1, cy + 4, R.magia);
  }
  /* Arco largo de tejo: palas finas, empuñadura forrada y cuerda de cáñamo. */
  function arcoL(g, m, alto, bajo, cuerda) {
    const ax = 2, top = -alto, bot = bajo;
    const a = capa();
    m.curva(a, ax - 6, top, ax + 6, top / 2 - 2, ax + 1, 0, 2, 3.2); m.curva(a, ax + 1, 0, ax + 6, bot / 2 + 2, ax - 6, bot, 3.2, 2);
    a.pintar(g, MADERA, { relieve: 1.6, min: 1 });
    m.surco(g, MADERA, 4, ax - 3, top + 3, ax + 2, top + 12, MADERA);
    m.surco(g, MADERA, 3, ax + 3, 6, ax + 2, 14, MADERA);
    for (let j = -3; j <= 3; j++) m.pon(g, CUERO2, j === -3 ? 3 : 2, [ax, j], [ax + 1, j], [ax + 2, j]);
    m.pon(g, HUESO, 3, [ax - 7, top - 1], [ax - 7, bot + 1]);
    const linea = (x0, y0, x1, y1) => {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1));
      for (let s = 0; s <= n; s++) { const X = Math.round(x0 + (x1 - x0) * s / n), Y = Math.round(y0 + (y1 - y0) * s / n); if (g.rampa(X, Y) !== MADERA) g.set(X, Y, HUESO[2], HUESO); }
    };
    const [t0, t1] = m.f(ax - 6.5, top), [b0, b1] = m.f(ax - 6.5, bot);
    if (cuerda) { linea(t0, t1, cuerda[0], cuerda[1]); linea(b0, b1, cuerda[0], cuerda[1]); }
    else linea(t0, t1, b0, b1);
  }
  /* Laúd de madera: caja de duelas, tapa clara con su roseta, mástil con trastes y clavijero doblado. */
  function laudL(g, m) {
    const lx = -1, ly = 5;
    const mast = capa(); m.linea(mast, lx + 4, ly - 5, lx + 13, ly - 18, 3);
    mast.pintar(g, MADERA, { relieve: 1.2, max: 2 });
    perfilar(g, mast);
    for (let k = 1; k < 5; k++) m.pon(g, HUESO, 2, [Math.round(lx + 5 + k * 1.8), Math.round(ly - 7 - k * 2.6)]);
    const cl = capa(); m.poly(cl, [[lx + 12, ly - 18], [lx + 15, ly - 21], [lx + 18, ly - 19], [lx + 15, ly - 16]]);
    cl.pintar(g, MADERA, { relieve: 1.2, max: 3, separar: true });
    for (const [i, j] of [[lx + 14, ly - 22], [lx + 17, ly - 21], [lx + 19, ly - 18]]) m.pon(g, HUESO, 3, [i, j]);
    const caja = capa(); m.ell(caja, lx, ly, 7.4, 6.2); m.ell(caja, lx + 4, ly - 3.6, 4.4, 3.8);
    caja.pintar(g, LAUD, { relieve: 5, luz: [-0.55, -0.6, 0.7] });
    perfilar(g, caja);
    const [x0, y0, x1, y1] = caja.caja();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (caja.tiene(x, y) && !caja.tiene(x, y + 1)) pon(g, MADERA, 0, [x, y]);
    for (const k of [-4, 4]) m.surco(g, LAUD, 2, lx - 5, ly + k * 0.5 + 1, lx + 6, ly + k * 0.5 - 4, LAUD);
    const bo = capa(); m.ell(bo, lx + 2, ly - 1, 1.8); bo.pintar(g, MADERA, { plano: 0 });
    for (let k = 0; k < 8; k++) { const an = (k / 8) * Math.PI * 2; m.pon(g, ORO, k % 2 ? 1 : 3, [lx + 2 + Math.cos(an) * 2.8, ly - 1 + Math.sin(an) * 2.8]); }
    const pu = capa(); m.rect(pu, lx - 5, ly + 2, 5, 1); pu.pintar(g, MADERA, { plano: 1 });
    m.surco(g, HUESO, 3, lx - 4, ly + 2, lx + 13, ly - 19, null);
    m.surco(g, HUESO, 2, lx - 3, ly + 3, lx + 14, ly - 18, null);
    return m.at(lx + 16, ly - 20);
  }

  /* ---------- Manos de las poses ---------- */
  function manoAbierta(g, x, y, ram) {
    const c = capa().ell(x, y, 2.2, 2.2);
    for (let i = 0; i < 3; i++) c.linea(x - 1.6 + i * 1.6, y - 1, x - 2 + i * 1.8, y - 4.4 + Math.abs(i - 1) * 0.6, 1);
    c.linea(x + 1.8, y + 0.5, x + 3.6, y - 1.6, 1.6);
    c.pintar(g, ram, { relieve: 1.6, separar: true });
    pon(g, ram, 3, [x - 2, y - 4], [x - 2, y - 1]);
    pon(g, ram, 1, [x + 1, y + 2], [x, y + 2]);
  }
  function palmaArriba(g, mx, my, ram) {
    const c = capa().ell(mx + 0.5, my, 3, 1.5).linea(mx + 3, my - 0.5, mx + 4, my - 2.5, 1).rect(mx - 3, my - 1, 1, 1);
    c.pintar(g, ram, { relieve: 1.4, separar: true });
    pon(g, ram, 1, [mx - 1, my + 1], [mx + 1, my + 1]);
    pon(g, ram, 4, [mx - 1, my - 1], [mx, my - 1]);
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
  /* Brazo con su material: piel con el bíceps marcado, tela con pliegue en el codo, placas con codal y remache. */
  function brazoLibre(g, t, piel, m, Hm, E, M) {
    const gr = t.grosor;
    const d = Math.hypot(M[0] - E[0], M[1] - E[1]) || 1, ux = (M[0] - E[0]) / d, uy = (M[1] - E[1]) / d;
    const Wm = [M[0] - ux * 2, M[1] - uy * 2];
    const rs = m.sup || piel, ri = m.inf || piel;
    const sup = capa().linea(Hm[0], Hm[1], E[0], E[1], gr + 1);
    const inf = capa().linea(E[0], E[1], Wm[0], Wm[1], gr - (m.ancha ? 0 : 1) + (rs === PLACA ? 1 : 0));
    const op = r => r === PLACA || r === MALLA ? METAL : r === piel ? {} : TELA_OP;
    sup.pintar(g, rs, Object.assign({ relieve: 3.2, separar: true }, op(rs)));
    inf.pintar(g, ri, Object.assign({ relieve: 3, separar: true }, op(ri)));
    const ex = Math.round(E[0]), ey = Math.round(E[1]);
    if (ri === piel && !m.ancha && !m.brazal) pon(g, piel, 3, [ex, ey - 2], [ex - 1, ey - 1]);
    if (rs === MALLA) malla(g, MALLA, Math.min(Hm[0], E[0], M[0]) - gr, Math.min(Hm[1], E[1], M[1]) - gr, Math.max(Hm[0], E[0], M[0]) + gr, Math.max(Hm[1], E[1], M[1]) + gr);
    if (rs === PLACA) {
      /* Codal: rodaja con su aleta y un remache. */
      capa().ell(E[0], E[1], gr / 2 + 0.6, gr / 2 + 0.2).pintar(g, PLACA, Object.assign({ relieve: 1.6, separar: true }, METAL));
      pon(g, PLACA, 4, [ex - 1, ey - 1]); remache(g, HIERRO, ex + 1, ey);
      const ds = Math.hypot(E[0] - Hm[0], E[1] - Hm[1]) || 1;
      for (const s of [0.45]) { const cx = Hm[0] + (E[0] - Hm[0]) * s, cy = Hm[1] + (E[1] - Hm[1]) * s, vx = (E[0] - Hm[0]) / ds, vy = (E[1] - Hm[1]) / ds; surco(g, PLACA, 0, cx - vy * gr, cy + vx * gr, cx + vy * gr, cy - vx * gr, PLACA); }
      for (const s of [0.5]) { const cx = E[0] + ux * d * s, cy = E[1] + uy * d * s; surco(g, PLACA, 0, cx - uy * gr, cy + ux * gr, cx + uy * gr, cy - ux * gr, PLACA); }
    }
    if (m.ancha) mangaAncha(g, m, E, Wm);
    else if (ri !== piel && ri !== m.guante && rs !== PLACA) puno0(g, ri, E, Wm, gr - 1);
    if (m.brazal) brazal(g, m.brazal, inf, E, Wm, gr - 1);
  }
  function luzMagia(g, x, y, ram, grande = true) {
    x = Math.round(x); y = Math.round(y);
    const R0g = grande ? 4.4 : 2.8;
    for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) {
      const d = Math.hypot(i, j);
      if (d > R0g + 0.3) continue;
      const k = d <= R0g * 0.35 ? 4 : d <= R0g * 0.65 ? 3 : 2;
      if (d > R0g * 0.65 && ((i + j) & 1)) continue;
      pon(g, ram, k, [x + i, y + j]);
    }
    const L = grande ? 8 : 5;
    for (let s = Math.ceil(R0g); s <= L; s++) { const k = s > L - 2 ? 1 : 2; pon(g, ram, k, [x + s, y], [x - s, y], [x, y + s], [x, y - s]); }
    if (grande) for (const [i, j] of [[x + 7, y - 6], [x - 6, y + 5], [x + 8, y + 5]]) chispa(g, ram, i, j, false);
  }
  function estela(g, c, r, a0, a1, ancho) {
    const pasos = Math.ceil(Math.abs(a1 - a0) * r / 18) + 10;
    const vistos = new Set();
    for (let s = 0; s <= pasos; s++) {
      const u = s / pasos, a = ((a0 + (a1 - a0) * u) * Math.PI) / 180;
      const gr = 0.5 + ancho * Math.pow(u, 0.8);
      for (let e = -gr; e <= gr + 0.01; e += 0.4) {
        const X = Math.round(c[0] + Math.cos(a) * (r + e)), Y = Math.round(c[1] + Math.sin(a) * (r + e));
        const k = X + Y * W;
        if (vistos.has(k) || X < 1 || Y < 1 || X > W - 2 || Y > H - 4 || g.get(X, Y)) continue;
        if (u < 0.3 && (s & 1)) continue;
        vistos.add(k);
        const tn = u > 0.75 ? 3 : u > 0.45 ? 2 : 1;
        const fuera = e > gr - 1.2;
        g.set(X, Y, ESTELA[Math.max(1, tn - (fuera ? 1 : 0)) + (u > 0.9 && !fuera ? 1 : 0)], ESTELA);
      }
    }
  }
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
      case "espada": espadaL(g, m, o.largo || 34); return m.at(0, -(o.largo || 34));
      case "hacha": hachaL(g, m); return m.at(10, -27);
      case "daga": dagaL(g, m); return m.at(0, -14);
      case "maza": mazaL(g, m); return m.at(0, -22);
      case "baston": return bastonL(g, m, o.arriba || 28, o.abajo || 40);
      case "arco": arcoL(g, m, o.alto || 36, o.bajo || 36, o.cuerda || null); return m.at(6, 0);
      case "laud": return laudL(g, m);
      case "cristal": { const [X, Y] = m.at(o.cx || 0, o.cy || -14); cristal(g, X, Y); return [X, Y]; }
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
  function nota(g, x, y, ram) {
    x = Math.round(x); y = Math.round(y);
    const c = capa().ell(x, y, 1.4, 1).rect(x + 1, y - 5, 1, 5).linea(x + 1, y - 5, x + 3, y - 3, 1);
    c.pintar(g, ram, { relieve: 1, min: 2 });
    pon(g, ram, 4, [x - 1, y - 1]);
  }

  function planPose(pose, tipo, clase) {
    const B = (d, mano, pref = [0, 1], mas = {}) => Object.assign({ d, mano, pref }, mas);
    const luzC = LUZ[clase] || LUZ.neutro;
    const colgando = B([-4, 11], "colgando", [-1, 0]);
    if (pose === "ataque") {
      const atras = B([-8, 8], "puno", [0, 1]);
      switch (tipo) {
        case "espada": return { cerca: B([8, 4], "puno"), lejos: null, arma: { tipo, ang: 118 }, escudo: [-6, 16], estela: { barrido: 100, ancho: 2.4 } };
        case "hacha": return { cerca: B([10, 7], "puno"), lejos: B([0, 0], "puno", [0, 1], { mango: 6 }), arma: { tipo, ang: 118 }, estela: { barrido: 105, ancho: 2.6 } };
        case "daga": return { cerca: B([12, 4], "puno"), lejos: atras, arma: { tipo, ang: 100 }, rayas: true, luz: { en: "arma", ram: LUZ.neutro, d: [2, 0], grande: false } };
        case "arco": return { cerca: B([12, -1], "puno", [0, 1]), lejos: null, arma: { tipo, ang: 0, cuerda: null, alto: 34, bajo: 34 }, flecha: true, suelta: true };
        case "baston": return { cerca: B([9, 2], "puno"), lejos: colgando, arma: { tipo, ang: 74, arriba: 28, abajo: 30 }, luz: { en: "arma", ram: LUZ.mago, d: [5, -2], grande: false }, rayas: true };
        case "cristal": return { cerca: B([12, 0], "abierta"), lejos: colgando, arma: { tipo, ang: 0, cx: 8, cy: -4 }, luz: { en: "arma", ram: LUZ.brujo, d: [8, 1], grande: false }, rayas: true };
        case "maza": return { cerca: B([10, 5], "puno"), lejos: colgando, arma: { tipo, ang: 122 }, estela: { barrido: 100, ancho: 2.4 }, simbolo: true };
        case "laud": return { cerca: B([9, 5], "puno"), lejos: colgando, arma: { tipo, ang: 38, antes: true }, luz: { en: "arma", ram: LUZ.bardo, d: [3, -2], grande: false }, nota: true };
      }
      return { cerca: B([12, 2], "puno"), lejos: atras, arma: null, rayas: true };
    }
    if (pose === "conjuro") {
      const alzada = B([8, -9], "abierta", [1, 1]);
      const atras = B([6, -9], "abierta", [1, 1]);
      const luzMano = ram => ({ en: "mano", ram, d: [1, -10], grande: true });
      switch (tipo) {
        case "espada": return { cerca: B([7, -7], "puno", [1, 1]), lejos: null, arma: { tipo, ang: 32 }, escudo: [4, 12], luz: { en: "arma", ram: LUZ.neutro, d: [0, 0], grande: true } };
        case "hacha": return { cerca: alzada, lejos: B([-3, 11], "puno", [-1, 0]), arma: { tipo, ang: -18, en: "lejos" }, luz: luzMano(LUZ.neutro) };
        case "daga": return { cerca: alzada, lejos: B([-3, 10], "puno", [-1, 0]), arma: { tipo, ang: 180, en: "lejos" }, luz: luzMano(LUZ.neutro) };
        case "arco": return { cerca: alzada, lejos: B([-2, 10], "puno", [-1, 0]), arma: { tipo, ang: 0, en: "lejos", alto: 30, bajo: 28 }, luz: luzMano(LUZ.neutro) };
        case "baston": return { cerca: B([7, -6], "puno", [1, 1]), lejos: atras, arma: { tipo, ang: 12, arriba: 28, abajo: 44 }, luz: { en: "arma", ram: LUZ.mago, d: [6, -6], grande: true } };
        case "cristal": return { cerca: B([9, -7], "palma", [1, 1]), lejos: atras, arma: { tipo, ang: 0, cx: 1, cy: -11 }, luz: { en: "arma", ram: LUZ.brujo, d: [8, -5], grande: true } };
        case "maza": return { cerca: alzada, lejos: B([-3, 9], "puno", [-1, 0]), arma: { tipo, ang: 180, en: "lejos" }, luz: luzMano(LUZ.clerigo) };
        case "laud": return { cerca: B([7, -3], "puno", [1, 1]), lejos: atras, arma: { tipo, ang: -12, antes: true }, luz: { en: "arma", ram: LUZ.bardo, d: [5, -3], grande: true }, nota: true };
      }
      return { cerca: alzada, lejos: atras, arma: null, luz: luzMano(luzC) };
    }
    if (pose === "herido") {
      const atras = B([-10, 1], "abierta", [0, 1]);
      const fuera = B([9, 6], "puno", [0, 1]);
      switch (tipo) {
        case "espada": return { cerca: B([8, 8], "puno"), lejos: null, arma: { tipo, ang: 38 }, escudo: [-2, 8] };
        case "hacha": return { cerca: B([8, 8], "puno"), lejos: atras, arma: { tipo, ang: 42 } };
        case "daga": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 205 } };
        case "arco": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 22, alto: 32, bajo: 28 } };
        case "baston": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 24, arriba: 28, abajo: 40 } };
        case "cristal": return { cerca: B([9, 5], "abierta"), lejos: atras, arma: { tipo, ang: 0, cx: 10, cy: -10 } };
        case "maza": return { cerca: B([8, 8], "puno"), lejos: atras, arma: { tipo, ang: 40 } };
        case "laud": return { cerca: fuera, lejos: atras, arma: { tipo, ang: 28, antes: true } };
      }
      return { cerca: B([9, 5], "abierta"), lejos: atras, arma: null };
    }
    if (pose === "victoria") {
      const arriba = B([9, -11], "puno", [1, 0]);
      const otra = B([-1, -12], "puno", [-1, 0]);
      switch (tipo) {
        case "espada": return { cerca: arriba, lejos: null, arma: { tipo, ang: 40 }, escudo: [2, 14] };
        case "hacha": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 22 } };
        case "daga": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 15 } };
        case "arco": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 10, alto: 28, bajo: 24 } };
        case "baston": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 6, arriba: 26, abajo: 46 }, luz: { en: "arma", ram: LUZ.mago, d: [6, -5], grande: false } };
        case "cristal": return { cerca: B([9, -11], "palma", [1, 0]), lejos: otra, arma: { tipo, ang: 0, cx: 1, cy: -11 }, luz: { en: "arma", ram: LUZ.brujo, d: [8, -3], grande: false } };
        case "maza": return { cerca: arriba, lejos: otra, arma: { tipo, ang: 15 } };
        case "laud": return { cerca: B([10, -9], "puno", [1, 0]), lejos: otra, arma: { tipo, ang: -30, antes: true }, nota: true };
      }
      return { cerca: arriba, lejos: otra, arma: null };
    }
    return null;
  }

  function simboloSagrado(g, ax, ay) {
    ax = Math.round(ax); ay = Math.round(ay);
    for (let j = ay + 4; j <= ay + 9; j++) pon(g, ORO, (j & 1) ? 1 : 3, [ax, j]);
    capa().ell(ax, ay + 12, 2.2, 2.2).pintar(g, ORO, { relieve: 1.6, min: 1 });
    pon(g, ORO, 4, [ax - 1, ay + 11]);
    pon(g, ORO, 2, [ax - 4, ay + 12], [ax + 4, ay + 12], [ax, ay + 16], [ax, ay + 8]);
  }

  function armarPose(g, t, o) {
    const { clase, piel, tela, manga, conArma, extra } = o, nombreExtra = o.objeto;
    const tipo = extra || !conArma ? null : ARMA[clase] || null;
    const pl = planPose(o.pose, tipo, clase);
    const l1 = Math.hypot(t.codo[0] - t.hombro[0], t.codo[1] - t.hombro[1]), l2 = Math.hypot(t.mano[0] - t.codo[0], t.mano[1] - t.codo[1]);
    const s = (l1 + l2) / 12.4;
    const lado = (b, Hm) => b && { Hm, M: [Hm[0] + b.d[0] * s, Hm[1] + b.d[1] * s], pref: b.pref, mano: b.mano, mango: b.mango };
    const C = lado(pl.cerca, t.hombro), L = lado(pl.lejos, t.hombroAtras);
    const A = pl.arma ? Object.assign({}, pl.arma) : null;
    if (A && A.tipo === "espada") A.largo = t.bajo ? 28 : 36;
    const conArmaEn = A ? (A.en === "lejos" ? L : C) : null;
    if (A && conArmaEn) for (let it = 0; it < 10; it++) {
      const [, M] = codoIK(conArmaEn.Hm, conArmaEn.M, l1, l2, conArmaEn.pref);
      conArmaEn.M = M;
      const b = cajaArma(A.tipo, A);
      const dr = M[0] + b.x1 - 122, du = 3 - (M[1] + b.y0), dl = 3 - (M[0] + b.x0), dd = M[1] + b.y1 - 123;
      if (dr <= 0 && du <= 0 && dl <= 0 && dd <= 0) break;
      if (A.tipo === "espada" && A.largo > 20 && (dr > 0 || du > 0)) { A.largo = Math.max(20, A.largo - Math.max(2, Math.max(dr, du))); continue; }
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
    if (L) detras(g, gb => {
      brazoLibre(gb, t, piel, manga, L.Hm, L.E, L.M);
      if (A && A.en === "lejos") punta = dibujarArma(gb, A.tipo, L.M, A);
      ponMano(gb, L);
      if (pl.simbolo || (L.mano === "colgando" && clase === "clerigo" && conArma && !extra)) simboloSagrado(gb, L.M[0], L.M[1] + 2);
    });
    if (pl.escudo) escudo(g, t.torR + pl.escudo[0], t.torTop + pl.escudo[1], tela);
    const tX = Object.assign({}, t, { mano: [Math.round(C.M[0]), Math.round(C.M[1])], piel });
    if (A && A.en !== "lejos" && A.antes) punta = dibujarArma(g, A.tipo, C.M, A);
    if (extra && nombreExtra !== "martillo") OBJETOS_EXTRA[nombreExtra](g, tX);
    brazoLibre(g, t, piel, manga, C.Hm, C.E, C.M);
    if (A && A.en !== "lejos" && !A.antes) punta = dibujarArma(g, A.tipo, C.M, A);
    if (extra && nombreExtra === "martillo") OBJETOS_EXTRA.martillo(g, tX);
    else ponMano(g, C);
    if (clase === "guerrero" || clase === "clerigo") hombrera(g, t);
    if (clase === "bardo") mangaAbullonada(g, t, tela);
    if (pl.luz) {
      const base = pl.luz.en === "arma" && punta ? punta : C.M;
      luzMagia(g, base[0] + pl.luz.d[0], base[1] + pl.luz.d[1], pl.luz.ram, pl.luz.grande);
    }
    if (pl.nota && punta) { nota(g, Math.min(punta[0] - 5, 114), Math.max(punta[1] - 6, 10), LUZ.bardo); nota(g, Math.min(punta[0] + 3, 120), Math.max(punta[1] - 12, 8), LUZ.bardo); }
    if (pl.suelta) {
      const hx = t.cx - 1, hy = t.torTop + 3;
      capa().linea(t.torL + 3, t.torTop + 7, hx, hy + 2, t.grosor - 1).pintar(g, manga.sup === PLACA ? PLACA : piel, { relieve: 2.4, separar: true });
      manoAbierta(g, hx, hy, piel);
    }
    if (pl.flecha) {
      const y = Math.round(C.M[1]) - 1;
      pon(g, ACERO, 4, [119, y], [120, y]); pon(g, ACERO, 2, [118, y - 1], [118, y + 1]); pon(g, ACERO, 3, [121, y]);
      pon(g, MADERA, 3, [115, y], [116, y], [117, y]);
    }
    const post = [];
    if (pl.estela && punta) {
      const [hx, hy] = t.hombro, r = Math.hypot(punta[0] - hx, punta[1] - hy) - 2, a1 = (Math.atan2(punta[1] - hy, punta[0] - hx) * 180) / Math.PI;
      post.push(gg => estela(gg, t.hombro, r, a1 - pl.estela.barrido, a1 - 6, pl.estela.ancho));
    }
    if (pl.rayas) {
      const y = Math.round(C.M[1]), x = Math.round(C.M[0]), x1 = punta ? Math.min(Math.round(punta[0]) - 4, 120) : x + 8;
      post.push(gg => { rayas(gg, x - 12, x1, y - 6); rayas(gg, x - 8, x1 - 4, y + 6); rayas(gg, x - 16, x1 - 8, y - 11, 2); });
    }
    if (pl.flecha) {
      const y = Math.round(C.M[1]) - 1, x = Math.round(C.M[0]);
      post.push(gg => { rayas(gg, x + 10, 113, y, 4); rayas(gg, x + 18, 110, y - 3, 3); rayas(gg, x + 18, 110, y + 3, 3); });
    }
    return post;
  }

  /* Manga abullonada del bardo, con cuchilladas granates. */
  function mangaAbullonada(g, t, tela) {
    const [hx, hy] = t.hombro;
    capa().ell(hx + 0.5, hy + 1.5, 4.4, 4.4).pintar(g, tela, Object.assign({ relieve: 3, separar: true }, TELA_OP));
    for (const i of [hx - 1, hx + 2]) { pon(g, R.tela.granate, 3, [i, hy], [i, hy + 1]); pon(g, R.tela.granate, 1, [i, hy + 2], [i, hy + 3]); pon(g, tela, 4, [i - 1, hy]); }
  }

  /* Objetos extra para personajes no jugadores (los mismos nombres que HEROES_64.OBJETOS_EXTRA). */
  const OBJETOS_EXTRA = {
    martillo(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx - 1, my - 18, 3, 26).pintar(g, MADERA, { relieve: 1.4, min: 1 });
      surco(g, MADERA, 3, mx - 1, my - 14, mx - 1, my + 6, MADERA);
      capa().rect(mx - 6, my - 26, 13, 8).pintar(g, HIERRO, Object.assign({ relieve: 3, separar: true }, METAL));
      for (let i = mx - 5; i <= mx + 6; i++) pon(g, HIERRO, 4, [i, my - 26]);
      destello(g, HIERRO, mx - 4, my - 24, true);
      puno(g, mx, my, t.piel || R.piel.clara);
    },
    caduceo(g, t) {
      const [mx] = t.mano;
      const top = Math.max(6, t.cabY - 14);
      capa().rect(mx - 1, top + 4, 3, t.suelo - top - 4).pintar(g, R.bronce, { relieve: 1.4, min: 1 });
      capa().ell(mx, top + 2, 2.6, 2.6).pintar(g, R.bronce, { relieve: 1.6, min: 2 });
      for (let y = top + 8; y < top + 36; y++) { const ox = Math.round(Math.sin(y * 0.5) * 3); pon(g, R.hoja, 2, [mx + ox, y]); }
      for (const s of [-1, 1]) capa().poly([[mx + s * 1, top + 4], [mx + s * 8, top], [mx + s * 6, top + 6]]).pintar(g, HUESO, { relieve: 1.2, min: 1 });
    },
    copa(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 1, my - 8, 4, 3).borrarHasta(my - 9).pintar(g, R.oricalco, { relieve: 1.6, min: 1 });
      capa().rect(mx, my - 6, 2, 5).pintar(g, R.oricalco, { relieve: 1.2, min: 1 });
      for (let i = mx - 2; i <= mx + 4; i++) pon(g, SANGRE, 3, [i, my - 9]);
    },
    odre(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 2, my + 5, 6, 5).pintar(g, CUERO, { relieve: 3, tramado: 0.12 });
      costura(g, CUERO, mx - 3, my + 5, mx + 7, my + 5, 1);
      pon(g, CUERO, 1, [mx + 8, my + 2], [mx + 8, my + 3]);
    },
    cayado(g, t) {
      const [mx] = t.mano;
      const top = Math.max(8, t.cabY - 10);
      capa().rect(mx - 1, top + 6, 3, t.suelo - top - 6).curva(mx, top + 6, mx, top - 2, mx + 8, top + 2, 3, 3).pintar(g, MADERA, { relieve: 1.4, min: 1 });
      surco(g, MADERA, 3, mx - 1, top + 8, mx - 1, t.suelo - 3, MADERA);
    },
    anillo(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 2, my - 6, 1.8, 1.8).quitarEll(mx + 2, my - 6, 0.6, 0.6).pintar(g, R.bronce, { relieve: 1, min: 2 });
      pon(g, HUESO, 4, [mx + 6, my - 11], [mx - 2, my - 11]);
    },
    balanza(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx, my - 16, 1, 16).rect(mx - 9, my - 16, 19, 1).pintar(g, R.bronce, { plano: 3 });
      capa().rect(mx - 10, my - 8, 7, 1).rect(mx + 4, my - 8, 7, 1).pintar(g, R.bronce, { plano: 2 });
      for (const i of [mx - 10, mx - 4, mx + 4, mx + 10]) surco(g, R.bronce, 1, mx + (i < mx ? -8 : 9), my - 15, i, my - 9, null);
    }
  };

  /* ---------- Composición ---------- */
  const PIERNAS = {
    guerrero: { ramPierna: PLACA, ramBota: PLACA, rodillera: PLACA, alto: 14 },
    clerigo: { ramPierna: MALLA, ramBota: CUERO, alto: 14 },
    picaro: { ramPierna: R.tela.negro, ramBota: CUERO2, alto: 20 },
    explorador: { ramPierna: CALZAS, ramBota: CUERO, alto: 18 },
    bardo: { ramPierna: R.tela.granate, ramBota: CUERO, alto: 16 },
    barbaro: { ramPierna: CUERO2, ramBota: PELLIZA, alto: 14 }
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
    const piel = apagar(R0.piel[a.piel] || R0.piel[(vis.pieles || [])[0]] || R0.piel.clara);
    const ramPelo = apagar(R0.pelo[a.pelo] || R0.pelo[(vis.pelos || [])[0] || "negro"] || R0.pelo.negro);
    const tela = apagar(R0.tela[a.tela] || R0.tela[TELA_CLASE[clase]] || R0.tela.terracota);
    const peinado = vis.sinPelo ? "rapado" : (PEINADOS.includes(a.peinado) ? a.peinado : "corto");
    const pose = POSES.includes(a.pose) ? a.pose : "normal";
    const gesto0 = GESTOS.includes(a.gesto) ? a.gesto : "normal";
    const gesto = pose === "herido" ? "dolor" : pose === "victoria" ? "alegre" : pose === "ataque" && gesto0 === "normal" ? "furia" : gesto0;
    const draco = raza === "draconido";
    const g = new Rejilla(W, H);
    t.piel = piel;
    t.altSombrero = Math.min(18, t.cabY - 9);
    const tapaPelo = ["guerrero", "brujo", "picaro", "explorador", "clerigo"].includes(clase);
    const largas = clase === "mago" || clase === "brujo";
    const extra = typeof a.objeto === "string" && OBJETOS_EXTRA[a.objeto];
    const conArma = !extra && a.objeto !== "ninguno";
    const arquero = clase === "explorador" && conArma;
    const h = t.torBot - t.torTop;
    if (arquero) {
      t.codo = [t.torR + 7, t.torTop + Math.round(h * 0.25)];
      t.mano = [t.torR + 15, t.torTop + Math.round(h * 0.3)];
      t.tiro = [t.cx + 4, t.torTop + Math.round(h * 0.3)];
    }
    const P = pose !== "normal" ? posar(t, pose) : null;

    cola(g, t, piel, raza);
    espalda(g, t, clase, tela);
    const mg = MANGAS[clase] || {};
    const manga = { sup: mg.sup || (clase === "barbaro" ? piel : tela), inf: mg.inf || (mg.ancha || ["picaro", "bardo"].includes(clase) ? tela : piel), guante: mg.guante, ancha: mg.ancha, ribete: mg.ribete, brazal: mg.brazal };
    if (clase === "explorador") manga.sup = tela;
    if (P) { /* en las poses el brazo de atrás se dibuja al final, por detrás */ }
    else if (!arquero) brazoAtras(g, t, piel, manga);
    else {
      const [hx, hy] = t.hombroAtras;
      capa().linea(hx, hy, hx - 8, hy + 2, t.grosor + 1).pintar(g, manga.sup, { relieve: 3, max: 2 });
    }
    const descalzo = raza === "mediano" && !["guerrero", "clerigo"].includes(clase);
    const op = Object.assign({ ramPierna: CALZAS, ramBota: CUERO2, alto: 10 }, PIERNAS[clase] || {});
    if (descalzo) op.descalzo = true;
    if (!largas || raza === "satiro") piernas(g, t, piel, raza, ramPelo, op);
    else if (draco) {
      for (const x0 of [t.pieAtras - 6, t.pieDelante - 2]) {
        capa().rect(x0, t.suelo - 3, 10, 4).ell(x0 + 9, t.suelo - 1, 1.6, 1.4).borrarDesde(t.suelo + 1).pintar(g, piel, { relieve: 1.6, separar: true });
        for (const dx of [4, 7, 10]) { pon(g, HUESO, 3, [x0 + dx, t.suelo - 1]); pon(g, HUESO, 2, [x0 + dx, t.suelo]); }
      }
    } else if (raza === "mediano") piernas(g, t, piel, raza, ramPelo, { descalzo: true });
    else {
      for (const [x0, at] of [[t.pieAtras - 5, true], [t.pieDelante - 2, false]]) {
        const z = capa().rect(x0, t.suelo - 3, 10, 4).ell(x0 + 9, t.suelo - 1, 1.8, 1.2).off(x0, t.suelo - 3);
        z.borrarDesde(t.suelo + 1);
        z.pintar(g, CUERO2, { relieve: 1.6, max: at ? 2 : 4, separar: true });
        for (let i = x0; i <= x0 + 11; i++) if (z.tiene(i, t.suelo)) pon(g, CUERO2, 0, [i, t.suelo]);
      }
    }
    vestir(g, t, clase, tela, piel);
    if (draco) cabezaDraconido(g, t, piel, gesto);
    else cabeza(g, t, piel, raza);
    if (!draco) pelo(g, t, ramPelo, peinado, raza, tapaPelo);
    if (!draco) oreja(g, t, piel, raza);
    if ((a.barba || vis.barba) && !draco && clase !== "picaro") barba(g, t, ramPelo, !!vis.barba);
    const ojoR = raza === "elfo" ? ["#0b0908", "#1e3424", "#6d6158", "#a1968a", "#c6bdb0"] : raza === "semiorco" ? ["#0b0908", "#5a3a10", "#7a6a50", "#a1968a", "#c6bdb0"] : SANO;
    if (!draco) cara(g, t, { piel, raza, gesto, ojoR, sombra: ["brujo", "picaro", "explorador"].includes(clase), cejas: vis.sinPelo ? null : ramPelo });
    if (clase === "barbaro" && !draco) {
      /* Pintura de guerra: una franja oscura sobre los ojos. */
      for (const [i, j] of [[t.ojo1 - 2, t.ojoY + 2], [t.ojo1 - 1, t.ojoY + 2], [t.ojo1 - 2, t.ojoY + 3], [t.ojo1 - 1, t.ojoY + 4]]) if (g.rampa(i, j) === piel) pon(g, SANGRE, 2, [i, j]);
    }
    const bajoSombrero = clase === "mago" || clase === "bardo";
    if (bajoSombrero && raza === "tiefling") cuernos(g, t, raza);
    tocado(g, t, clase, tela, piel);
    if (!bajoSombrero && (clase !== "guerrero" || raza === "tiefling")) cuernos(g, t, raza);
    if (clase === "picaro" && !draco) {
      /* Embozo que tapa nariz y boca, con sus pliegues. */
      const em = capa().rect(t.cabX - 1, t.ojoY + 2, 12, 8).poly([[t.cabX - 1, t.bocaY + 2], [t.narizX + 2, t.bocaY + 1], [t.narizX - 1, t.bocaY + 5], [t.cabX, t.bocaY + 5]]);
      em.recortar(capa().ell(t.cabX + 0.5, t.cabY + 1, t.cabRx + 2, t.cabRy + 1.2));
      em.pintar(g, tela, Object.assign({ relieve: 2.4, separar: true }, TELA_OP));
      surco(g, tela, 1, t.cabX + 1, t.bocaY, t.narizX, t.bocaY - 1, tela);
      surco(g, tela, 3, t.cabX + 1, t.ojoY + 2, t.narizX + 1, t.ojoY + 2, tela);
      surco(g, tela, 1, t.cabX + 2, t.bocaY + 3, t.narizX - 1, t.bocaY + 2, tela);
    }
    let tt = t, post = [];
    if (P) {
      cizallar(g, P.desp);
      tt = mover(Object.assign({}, t), P.desp(t.torTop + 6), 0);
      post = armarPose(g, tt, { pose, clase, piel, tela, manga, conArma, extra, objeto: a.objeto });
    } else if (clase === "guerrero" && conArma) {
      /* El escudo tapa el brazo; el puño asoma a su lado con la espada. */
      t.mano = [t.torR + 15, t.torTop + Math.round(h * 0.6)];
      brazoDelante(g, t, piel, manga, false);
      hombrera(g, t);
      escudo(g, t.torR + 3, t.torTop + Math.round(h * 0.42), tela);
      const largo = Math.min(t.bajo ? 30 : 38, t.mano[1] - 6);
      dibujarArma(g, "espada", t.mano, { ang: 0, largo });
      puno(g, t.mano[0], t.mano[1], PLACA);
    } else if (clase === "brujo" && conArma) {
      brazoDelante(g, t, piel, manga, false);
      const [mx, my] = t.mano;
      palmaArriba(g, mx, my, piel);
      const cx = mx + 4, cy = my - 12;
      cristal(g, cx, cy);
      for (const [i, j, gr] of [[cx - 6, cy - 5, true], [cx + 6, cy - 8, false], [cx + 7, cy + 3, false]]) chispa(g, R.magia, i, j, gr);
    } else {
      const [mx, my] = t.mano;
      if (extra) OBJETOS_EXTRA[a.objeto](g, t);
      else if (conArma) {
        if (clase === "barbaro") dibujarArma(g, "hacha", [mx + 1, my], { ang: 9 });
        else if (clase === "picaro") dibujarArma(g, "daga", [mx, my + 1], { ang: 166 });
        else if (clase === "explorador") {
          dibujarArma(g, "arco", [mx, my], { ang: 0, alto: t.bajo ? 26 : 40, bajo: t.bajo ? 24 : 38, cuerda: t.tiro });
          const [dx, dy] = t.tiro, ax = mx + 3;
          for (let i = dx - 2; i <= ax + 10; i++) pon(g, MADERA, i % 3 ? 3 : 2, [i, dy]);
          capa().poly([[ax + 10, dy - 1.6], [ax + 14, dy], [ax + 10, dy + 1.6]]).pintar(g, HIERRO, Object.assign({ relieve: 1, min: 1 }, METAL));
          pon(g, ACERO, 4, [ax + 11, dy - 1]);
          for (const [sy, k] of [[-1, 3], [1, 2]]) pon(g, R.tela.granate, k, [dx - 4, dy + sy], [dx - 3, dy + sy], [dx - 2, dy + sy]);
        } else if (clase === "mago") {
          const oy = Math.max(8, t.cabY - 12);
          const [X, Y] = dibujarArma(g, "baston", [mx, my], { ang: 0, arriba: my - oy, abajo: t.suelo - my });
          chispa(g, R.mar, X + 7, Y - 4, false); chispa(g, R.mar, X - 6, Y + 7, false);
        } else if (clase === "clerigo") dibujarArma(g, "maza", [mx, my], { ang: 0 });
        else if (clase === "bardo") dibujarArma(g, "laud", [mx, my], { ang: 0 });
        else if (clase === "guerrero") dibujarArma(g, "espada", [mx, my], { ang: 0, largo: Math.min(36, my - 6) });
      }
      if (!extra || a.objeto !== "martillo") brazoDelante(g, t, piel, manga, !arquero);
      if (arquero) puno(g, mx, my, piel);
    }
    if (arquero && !P) {
      /* Mano que tensa la cuerda junto al pecho, con el antebrazo cruzado. */
      const [dx, dy] = t.tiro;
      capa().linea(t.torL + 3, t.torTop + 5, dx - 3, dy, t.grosor - 1).pintar(g, piel, { relieve: 2.4, separar: true });
      capa().ell(dx - 1, dy, 2.2, 2.2).pintar(g, piel, { relieve: 1.6, separar: true });
      pon(g, piel, 1, [dx - 1, dy + 1], [dx, dy + 1]);
      for (let i = dx - 7; i <= dx - 3; i++) { pon(g, CUERO, 3, [i, dy - 2]); pon(g, CUERO, 2, [i, dy - 1], [i, dy + 1]); pon(g, CUERO, 1, [i, dy + 2]); }
    }
    if (!P && ((clase === "guerrero" && !conArma) || clase === "clerigo")) hombrera(g, t);
    if (clase === "bardo" && !P) mangaAbullonada(g, t, tela);
    if (clase === "barbaro") {
      /* Pelliza de lobo sobre los hombros, con la cabeza del lobo en el hombro de delante. */
      const pz = capa().ell(tt.torL + 6, tt.torTop + 1, 9, 3.6).ell(tt.torL + 1, tt.torTop + 4, 5, 7);
      const [x0, y0, x1, y1] = pz.caja();
      for (let i = x0; i <= x1; i++) { const corte = (i % 3 + 3) % 3; for (let j = y0; j <= y1; j++) if (pz.tiene(i, j) && !pz.tiene(i, j + 2 - corte)) pz.off(i, j); }
      pz.pintar(g, PELLIZA, { relieve: 3.6, separar: true, tramado: 0.14 });
      pelaje(g, PELLIZA, tt.torL - 8, tt.torTop - 6, tt.torR + 8, tt.torTop + 12);
      const [hx, hy] = tt.hombro;
      const lobo = capa().ell(hx - 1, hy - 1, 5.2, 4).poly([[hx + 1, hy - 4], [hx + 10, hy - 2], [hx + 10, hy + 1.5], [hx + 1, hy + 3]]).poly([[hx - 5, hy - 2], [hx - 4, hy - 9], [hx, hy - 4]]);
      lobo.pintar(g, LOBO, { relieve: 2.8, min: 1, tramado: 0.12 });
      perfilar(g, lobo);
      pelaje(g, LOBO, hx - 7, hy - 6, hx + 2, hy + 4);
      pon(g, LOBO, 0, [hx - 3, hy - 6], [hx - 3, hy - 5]);
      for (let i = hx; i <= hx + 4; i++) pon(g, LOBO, 1, [i, hy - 3]);
      pon(g, OSCURO, 0, [hx + 2, hy - 2]); pon(g, TIEF, 3, [hx + 3, hy - 2]);
      pon(g, LOBO, 0, [hx + 10, hy - 1], [hx + 9, hy - 1]); pon(g, LOBO, 3, [hx + 6, hy - 3], [hx + 8, hy - 2]);
      for (let i = hx + 1; i <= hx + 9; i++) if (g.rampa(i, hy + 1) === LOBO) pon(g, LOBO, 0, [i, hy + 1]);
      for (const i of [hx + 4, hx + 8]) pon(g, HUESO, 4, [i, hy + 2]);
    }
    if (clase === "clerigo" && conArma && !extra && !P) simboloSagrado(g, t.manoAtras[0] - 1, t.manoAtras[1] + 2);
    if (Array.isArray(a.extras)) a.extras.forEach(fn => { if (typeof fn === "function") fn(g, tt, { piel, pelo: ramPelo, tela }); });
    for (let y = SUELO + 1; y < H; y++) for (let x = 0; x < W; x++) g.quitar(x, y);
    if (P) { for (let x = 0; x < W; x++) g.quitar(x, 0); for (let y = 0; y < H; y++) g.quitar(0, y).quitar(W - 1, y); }
    if (!a.sinContorno) contornoSel(g);
    for (const fn of post) fn(g);
    return a.espejo ? g.espejo() : g;
  }

  window.HEROES_BG = { W, H, RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS, RAMPAS: R, POSES, plantilla, componer, matizar: apagar, OBJETOS_EXTRA };
})();
