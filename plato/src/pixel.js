/* Dados y Mazmorras · motor de pixel art.
   Rejillas pequeñas (36×36 para personajes, 192×108 para escenarios), capas con sombreado
   por relieve (luz desde arriba a la izquierda) y contorno automático. */
const PX = (() => {
  "use strict";

  const CONTORNO = "#140b07";

  /* Rampas de color, de la sombra más profunda al brillo. Todo el arte sale de aquí. */
  const RAMPAS = {
    piel: {
      clara: ["#7a4a36", "#a86a4f", "#d99a78", "#f2c4a0", "#ffe6cf"],
      oliva: ["#5e3c26", "#8a5a3a", "#b97d55", "#dca47a", "#f3cba3"],
      morena: ["#3e2418", "#5e3826", "#8a5638", "#b37a52", "#d6a27a"],
      oscura: ["#26140d", "#3a2218", "#5c3726", "#80513a", "#a87358"],
      verde: ["#26321a", "#3d4d2a", "#5d7440", "#83995a", "#adc07f"],
      gris: ["#2c2f31", "#45484a", "#676c6e", "#8d9294", "#b7bbbb"],
      roja: ["#3a0f0f", "#5a1a1a", "#8e2d27", "#c04a3c", "#e5776a"],
      violeta: ["#26142b", "#3a2040", "#5f3568", "#8a5596", "#b383c0"],
      azul: ["#141c33", "#1f2c4a", "#33497a", "#4f6fa8", "#7f9fd0"],
      bronce: ["#3a2408", "#5e3d12", "#9a6a1e", "#d49a32", "#f6d26b"],
      esmeralda: ["#12261a", "#1e3a24", "#2f5e36", "#4c8a4c", "#86c07a"],
      plata: ["#2e3036", "#4a4d55", "#7a7f8a", "#aeb3bd", "#e2e6ec"]
    },
    pelo: {
      negro: ["#0c0807", "#1a1210", "#2e221c", "#4a3a30", "#6a5646"],
      castano: ["#24140c", "#3a2014", "#5e3820", "#8a5830", "#b07a48"],
      cobrizo: ["#3a1408", "#5a1e0e", "#9a3a16", "#d0642a", "#f09050"],
      rubio: ["#5a4010", "#8a6420", "#c99a3a", "#f0d27a", "#fff0b8"],
      canoso: ["#4a4642", "#8f8a84", "#cfc8bf", "#ece6dc", "#fffaf2"],
      violeta: ["#1a0b20", "#2e1436", "#55286a", "#8a4aa6", "#b47cd0"]
    },
    tela: {
      terracota: ["#3e1a0c", "#5c2a14", "#8f4122", "#c2622f", "#e48b4e"],
      azul: ["#0e1622", "#1b2a3a", "#2c4a63", "#4f7ea0", "#8fc3d9"],
      oliva: ["#1a2212", "#2e3a1e", "#4f6230", "#7f9447", "#b4c46a"],
      violeta: ["#170c1c", "#2d1a33", "#553061", "#8a5a9e", "#c39bd3"],
      ocre: ["#3a2408", "#6b4a1a", "#a8782a", "#e0b04a", "#fff0a0"],
      blanco: ["#5a5048", "#8c7c6a", "#bfae98", "#e8dcc8", "#fff7ea"],
      granate: ["#2a0808", "#4a120e", "#7a1d17", "#b8342a", "#e2604a"],
      negro: ["#0a0708", "#171214", "#2a2226", "#40363a", "#5c5054"]
    },
    bronce: ["#3a2408", "#6b4a1a", "#a8782a", "#e0b04a", "#fff0a0"],
    oricalco: ["#3a1408", "#5a2212", "#9a4320", "#d0742f", "#f3b15a"],
    hierro: ["#1e1c1b", "#3a3634", "#5f5955", "#8f8780", "#c9c0b6"],
    plata: ["#2e3036", "#4a4d55", "#7a7f8a", "#aeb3bd", "#e2e6ec"],
    madera: ["#2a160a", "#4a2a14", "#6e4222", "#9a6236", "#c48a52"],
    piedra: ["#1c1a19", "#2a2624", "#48423e", "#6e6660", "#9c938a"],
    marmol: ["#6a625a", "#9c938a", "#cfc6bb", "#ebe4da", "#fffaf2"],
    hoja: ["#1a2410", "#2e4018", "#4a6a24", "#74963a", "#a8c860"],
    fuego: ["#5a1a08", "#a8360e", "#e0661a", "#ffa53a", "#ffe08a"],
    magia: ["#1c0a26", "#3d1658", "#7a2fa8", "#b86ae0", "#f0c8ff"],
    sombra: ["#07040a", "#120a18", "#22142c", "#3a2448", "#5a3a70"],
    mar: ["#0a1420", "#12263a", "#1e4060", "#33688e", "#5c9cc0"],
    sangre: ["#2a0606", "#4e0c0a", "#7e1812", "#b02a1e", "#d84a32"],
    hueso: ["#5a5048", "#8c7c6a", "#bfae98", "#e8dcc8", "#fff7ea"]
  };

  /* Ordered dithering 4×4 for pixel-art gradients. */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const umbral = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

  class Rejilla {
    constructor(w = 36, h = 36) {
      this.w = w; this.h = h;
      this.c = new Array(w * h).fill(null);
      this.r = new Array(w * h).fill(null);
    }
    dentro(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) { return this.dentro(x, y) ? this.c[y * this.w + x] : null; }
    rampa(x, y) { return this.dentro(x, y) ? this.r[y * this.w + x] : null; }
    set(x, y, color, rampa = null) {
      x = Math.round(x); y = Math.round(y);
      if (!this.dentro(x, y)) return this;
      this.c[y * this.w + x] = color; this.r[y * this.w + x] = rampa;
      return this;
    }
    quitar(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (this.dentro(x, y)) { this.c[y * this.w + x] = null; this.r[y * this.w + x] = null; }
      return this;
    }
    rect(x, y, w, h, color) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, color);
      return this;
    }
    /* Degradado vertical con tramado entre dos colores (para cielos y paredes). */
    degradado(x, y, w, h, arriba, abajo) {
      for (let j = 0; j < h; j++) {
        const t = h > 1 ? j / (h - 1) : 0;
        for (let i = 0; i < w; i++) this.set(x + i, y + j, t > umbral(x + i, y + j) ? abajo : arriba);
      }
      return this;
    }
    linea(x0, y0, x1, y1, color) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.set(x0, y0, color);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
      return this;
    }
    pegar(otra, dx = 0, dy = 0) {
      for (let y = 0; y < otra.h; y++) for (let x = 0; x < otra.w; x++) {
        const col = otra.c[y * otra.w + x];
        if (col) this.set(x + dx, y + dy, col, otra.r[y * otra.w + x]);
      }
      return this;
    }
    copia() {
      const o = new Rejilla(this.w, this.h);
      o.c = this.c.slice(); o.r = this.r.slice();
      return o;
    }
    espejo() {
      const o = new Rejilla(this.w, this.h);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        o.c[y * this.w + (this.w - 1 - x)] = this.c[y * this.w + x];
        o.r[y * this.w + (this.w - 1 - x)] = this.r[y * this.w + x];
      }
      return o;
    }
    /* Girada 90° (para los héroes caídos). */
    tumbada() {
      const o = new Rejilla(this.h, this.w);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const nx = this.h - 1 - y, ny = x;
        o.c[ny * o.w + nx] = this.c[y * this.w + x];
        o.r[ny * o.w + nx] = this.r[y * this.w + x];
      }
      return o;
    }
    /* Contorno oscuro alrededor de todo lo pintado. Por los lados iluminados (arriba e izquierda)
       usa la sombra más profunda del color vecino, que queda más suave. */
    contorno(color = CONTORNO) {
      const nuevos = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const ab = this.get(x, y + 1), de = this.get(x + 1, y), iz = this.get(x - 1, y), ar = this.get(x, y - 1);
        if (!(ab || de || iz || ar)) continue;
        let col = color;
        if (!iz && !ar) {
          const ram = ab ? this.rampa(x, y + 1) : this.rampa(x + 1, y);
          if (ram) col = ram[0];
        }
        nuevos.push([x, y, col]);
      }
      for (const [x, y, col] of nuevos) this.set(x, y, col);
      return this;
    }
    silueta(color) {
      const o = new Rejilla(this.w, this.h);
      for (let i = 0; i < this.c.length; i++) if (this.c[i]) o.c[i] = color;
      return o;
    }
    tenida(colorPorRampa) {
      /* Cambia cada color por el de otra rampa en la misma posición (para estados como petrificado). */
      const o = new Rejilla(this.w, this.h);
      for (let i = 0; i < this.c.length; i++) {
        const c = this.c[i];
        if (!c) continue;
        const r = this.r[i];
        const idx = r ? r.indexOf(c) : -1;
        o.c[i] = idx >= 0 ? colorPorRampa[Math.min(idx, colorPorRampa.length - 1)] : colorPorRampa[Math.min(2, colorPorRampa.length - 1)];
        o.r[i] = colorPorRampa;
      }
      return o;
    }
    aCanvas(escala = 1) {
      const cv = document.createElement("canvas");
      cv.width = this.w * escala; cv.height = this.h * escala;
      const ctx = cv.getContext("2d");
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const col = this.c[y * this.w + x];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * escala, y * escala, escala, escala);
      }
      return cv;
    }
  }

  /* Una capa es una máscara que se va dibujando con formas y luego se pinta sombreada. */
  class Capa {
    constructor(w = 36, h = 36) { this.w = w; this.h = h; this.m = new Uint8Array(w * h); }
    on(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = 1;
      return this;
    }
    off(x, y) {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = 0;
      return this;
    }
    tiene(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.m[y * this.w + x] === 1; }
    vacia() { return !this.m.some(v => v); }
    rect(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.on(x + i, y + j); return this; }
    quitarRect(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.off(x + i, y + j); return this; }
    ell(cx, cy, rx, ry = rx) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / (rx + 0.25), dy = (y - cy) / (ry + 0.25);
          if (dx * dx + dy * dy <= 1) this.on(x, y);
        }
      return this;
    }
    quitarEll(cx, cy, rx, ry = rx) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / (rx + 0.25), dy = (y - cy) / (ry + 0.25);
          if (dx * dx + dy * dy <= 1) this.off(x, y);
        }
      return this;
    }
    /* Polígono: [[x,y], ...]; rellena los píxeles cuyo centro cae dentro. */
    poly(pts) {
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
        for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
          let dentro = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i], [xj, yj] = pts[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
          }
          if (dentro) this.on(x, y);
        }
      return this;
    }
    /* Línea gruesa (g = grosor en píxeles). */
    linea(x0, y0, x1, y1, g = 1) {
      const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let s = 0; s <= pasos; s++) {
        const x = x0 + ((x1 - x0) * s) / pasos, y = y0 + ((y1 - y0) * s) / pasos;
        if (g <= 1) this.on(x, y);
        else this.rect(Math.round(x - (g - 1) / 2), Math.round(y - (g - 1) / 2), g, g);
      }
      return this;
    }
    /* Curva cuadrática de Bézier con grosor. */
    curva(x0, y0, cx, cy, x1, y1, g = 1, g1 = g) {
      const n = 40;
      for (let s = 0; s <= n; s++) {
        const t = s / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const gr = g + (g1 - g) * t;
        if (gr <= 1.2) this.on(x, y);
        else this.ell(x, y, (gr - 1) / 2, (gr - 1) / 2);
      }
      return this;
    }
    unir(otra) { for (let i = 0; i < this.m.length; i++) if (otra.m[i]) this.m[i] = 1; return this; }
    restar(otra) { for (let i = 0; i < this.m.length; i++) if (otra.m[i]) this.m[i] = 0; return this; }
    recortar(otra) { for (let i = 0; i < this.m.length; i++) if (!otra.m[i]) this.m[i] = 0; return this; }
    copia() { const o = new Capa(this.w, this.h); o.m = this.m.slice(); return o; }

    /* Pinta la capa en la rejilla. El relieve sale de la distancia al borde:
       op.relieve = radio de redondeo, op.separar = línea oscura donde toca lo ya pintado,
       op.plano = índice de tono fijo, op.luz = vector de luz opcional. */
    pintar(rej, rampa, op = {}) {
      const w = this.w, h = this.h;
      if (op.plano !== undefined) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
          if (this.m[y * w + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const R = op.relieve || 4;
      const d = new Float32Array(w * h);
      for (let i = 0; i < d.length; i++) d[i] = this.m[i] ? 1e6 : 0;
      const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
      }
      for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x;
        if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
      }
      const alto = (x, y) => {
        if (!this.tiene(x, y)) return 0;
        const v = Math.min(D(x, y), R) / R;
        return Math.sqrt(1 - (1 - v) * (1 - v));
      };
      const L = op.luz || [-0.5, -0.62, 0.6];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.4;
      const sesgo = op.sesgo || 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!this.m[y * w + x]) continue;
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

  /* Letras de 3×5 píxeles para los números y avisos del escenario. */
  const LETRAS = {
    "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111",
    "4": "101101111001001", "5": "111100111001111", "6": "111100111101111", "7": "111001010010010",
    "8": "111101111101111", "9": "111101111001111", "+": "000010111010000", "-": "000000111000000",
    "!": "010010010000010", "?": "110001010000010", ".": "000000000000010", " ": "000000000000000",
    "A": "010101111101101", "B": "110101110101110", "C": "011100100100011", "D": "110101101101110",
    "E": "111100110100111", "F": "111100110100100", "G": "011100101101011", "H": "101101111101101",
    "I": "111010010010111", "J": "001001001101010", "K": "101101110101101", "L": "100100100100111",
    "M": "101111101101101", "N": "110101101101101", "O": "010101101101010", "P": "110101110100100",
    "Q": "010101101110011", "R": "110101110101101", "S": "011100010001110", "T": "111010010010010",
    "U": "101101101101111", "V": "101101101101010", "W": "101101111111101", "X": "101101010101101",
    "Y": "101101010010010", "Z": "111001010100111", "/": "001001010100100", ":": "000010000010000"
  };
  const sinTildes = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

  /* Escribe texto pixelado en un contexto 2D (coordenadas en píxeles de arte). */
  function texto(ctx, str, x, y, color, borde = CONTORNO, escala = 1) {
    const s = sinTildes(str);
    const pinta = (ox, oy, col) => {
      ctx.fillStyle = col;
      let cx = x + ox;
      for (const ch of s) {
        const g = LETRAS[ch] || LETRAS["?"];
        for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++)
          if (g[j * 3 + i] === "1") ctx.fillRect(cx + i * escala, y + oy + j * escala, escala, escala);
        cx += 4 * escala;
      }
    };
    if (borde) for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) pinta(a * escala, b * escala, borde);
    pinta(0, 0, color);
    return s.length * 4 * escala - escala;
  }
  const anchoTexto = (str, escala = 1) => sinTildes(str).length * 4 * escala - escala;

  /* Pequeño generador pseudoaleatorio con semilla, para que el arte procedural sea siempre igual. */
  function azar(semilla = 1) {
    let s = semilla >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  return { CONTORNO, RAMPAS, Rejilla, Capa, umbral, texto, anchoTexto, azar };
})();
