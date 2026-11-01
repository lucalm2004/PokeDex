/* Dados y Mazmorras · escenarios HD (256×144), tanda C: la senda del pico, la guarida de Ignárax,
   el Abismo, el nido de arañas y las ruinas del templo élfico.
   FONDOS_HD[clave].base(g) pinta el fondo fijo en una Rejilla de 256×144 y
   FONDOS_HD[clave].anim(ctx, t) dibuja encima los detalles animados (t en milisegundos).
   Los personajes pisan entre y≈118 y y≈140: ahí el suelo es tranquilo y el detalle va a los bordes. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, azar } = PX;
  const W = 256, H = 144;
  const capa = () => new Capa(W, H);
  const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const M = R.madera, F = R.fuego, B = R.bronce, P = R.piedra, HU = R.hueso, HO = R.hoja, SO = R.sombra, HI = R.hierro, PL = R.plata;
  const NE = R.tela.negro, AZ = R.tela.azul, GR = R.tela.granate, OC = R.tela.ocre, OL = R.tela.oliva, VI = R.tela.violeta, TE = R.tela.terracota, MG = R.magia;
  const PV = R.piel.violeta;

  /* Rampas propias, en el mismo tono apagado que los escenarios antiguos. */
  const GRIS = ["#15161b", "#25272e", "#3b3e47", "#5a5e68", "#868a92"];
  const MUSGO = ["#0b1510", "#14261a", "#213d27", "#365c34", "#5a8346"];
  const CENIZA = ["#0f0c0c", "#1f1918", "#342b28", "#4f433e", "#776860"];
  const BRASA = ["#170908", "#30100c", "#561a10", "#8a2a12", "#c4461a"];
  const ESPECTRO = ["#0b1618", "#122e2d", "#1f5450", "#3b8a7a", "#8cd6ba"];
  const CRISTAL = ["#10182e", "#1c3566", "#2f62a8", "#5ea0dc", "#bfe6ff"];
  const RUBI = ["#2a0610", "#5a0c1c", "#9a1a2a", "#d8384a", "#ff9aa0"];
  const ESMERALDA = ["#06200f", "#0c3e1e", "#17703a", "#36b062", "#a8f0b8"];

  /* ---------- Herramientas ---------- */
  const tono = (x, y, v, s = 1) => Math.floor(v + 0.5 + (umbral(x, y) - 0.5) * s);
  function hash(i, j, s = 0) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  /* Ruido de valor suave y su suma en octavas (para nubes, humo y texturas de roca). */
  function ruido(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s = 0, oct = 3) {
    let v = 0, a = 0.5, f = 1, tot = 0;
    for (let i = 0; i < oct; i++) { v += ruido(x * f, y * f, s + i * 17) * a; tot += a; a *= 0.5; f *= 2.03; }
    return v / tot;
  }
  /* Rellena una zona con una rampa según f(x, y) (tono 0 … n-1; null no pinta). */
  function rellenar(g, x0, y0, w, h, ram, f, s = 1, masc = null) {
    const n = ram.length - 1;
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      if (masc && !masc.tiene(x, y)) continue;
      const v = f(x, y);
      if (v === null || v === undefined) continue;
      g.set(x, y, ram[lim(tono(x, y, v, s), 0, n)], ram);
    }
    return g;
  }
  /* Objetos con contorno propio: se pintan aparte y se pegan con un borde oscuro. */
  function conBorde(g, color, fn) {
    const tmp = new Rejilla(W, H);
    fn(tmp);
    tmp.contorno(color);
    return g.pegar(tmp);
  }
  function cada(c, fn) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (c.m[y * W + x]) fn(x, y);
  }
  /* Contraluz: los píxeles de una capa que dan hacia (dx, dy) toman el color del borde. */
  function contraluz(g, c, col, dx, dy) {
    cada(c, (x, y) => { if (!c.tiene(x + dx, y + dy)) g.set(x, y, typeof col === "function" ? col(x, y) : col); });
  }
  /* Sube o baja un tono el color de un píxel dentro de su rampa. */
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), c = g.get(x, y);
    if (!r || !c) return;
    const k = r.indexOf(c);
    if (k >= 0) g.set(x, y, r[lim(k + d, 0, r.length - 1)], r);
  }
  /* Tramado: pinta col sobre los píxeles donde f(x, y) supera el umbral de Bayer. */
  function velo(g, x0, y0, w, h, f, col) {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const v = f(x, y);
      if (v > 0 && umbral(x, y) < v) g.set(x, y, typeof col === "function" ? col(x, y, v) : col);
    }
  }
  function plantilla(g, filas, x, y, colores, espejo = false) {
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        const c = colores[fila[i]];
        if (c) g.set(espejo ? x + fila.length - 1 - i : x + i, y + j, c);
      }
    });
  }

  /* Teselas de Voronoi para roca facetada (ver fondos.js). */
  function teselas(n, sem, x0, y0, w, h, ay = 1, grupos = 0) {
    const az = azar(sem), pts = [];
    for (let i = 0; i < n; i++) pts.push([x0 + az() * w, y0 + az() * h, az()]);
    const mac = Array.from({ length: grupos }, () => [x0 + az() * w, y0 + az() * h]);
    const grupo = pts.map(([px, py], i) => {
      if (!grupos) return i;
      let best = 0, bd = 1e9;
      mac.forEach(([mx, my], j) => { const d = (px - mx) ** 2 + ((py - my) * ay) ** 2; if (d < bd) { bd = d; best = j; } });
      return best;
    });
    /* Rejilla de cubos para no comparar cada píxel con todas las celdas. */
    const T = 16, cols = Math.ceil(w / T) + 1, filas = Math.ceil(h / T) + 1, cubos = Array.from({ length: cols * filas }, () => []);
    pts.forEach(([px, py], i) => cubos[lim(Math.floor((py - y0) / T), 0, filas - 1) * cols + lim(Math.floor((px - x0) / T), 0, cols - 1)].push(i));
    const id = new Int16Array(W * H).fill(-1), id2 = new Int16Array(W * H).fill(-1), borde = new Float32Array(W * H);
    const alcance = Math.ceil(Math.sqrt((w * h) / n) * 2.2 / T) + 1;
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      let d1 = 1e9, d2 = 1e9, k = -1, k2 = -1;
      const cx = Math.floor((x - x0) / T), cy = Math.floor((y - y0) / T);
      for (let b = cy - alcance; b <= cy + alcance; b++) for (let a = cx - alcance; a <= cx + alcance; a++) {
        if (a < 0 || b < 0 || a >= cols || b >= filas) continue;
        for (const i of cubos[b * cols + a]) {
          const dx = x - pts[i][0], dy = (y - pts[i][1]) * ay, d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; k2 = k; d1 = d; k = i; } else if (d < d2) { d2 = d; k2 = i; }
        }
      }
      if (k < 0 || k2 < 0) continue;
      const sep = Math.hypot(pts[k][0] - pts[k2][0], (pts[k][1] - pts[k2][1]) * ay) || 1;
      id[y * W + x] = k; id2[y * W + x] = k2; borde[y * W + x] = (d2 - d1) / (2 * sep);
    }
    return { pts, id, id2, borde, grupo };
  }
  function roca(g, tes, ram, base, haciaLuz, op = {}) {
    const n = ram.length - 1, vari = op.vari ?? 0.7, bisel = op.bisel ?? 2, relieve = op.relieve ?? 1.2, s = op.s ?? 0.3;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, k = tes.id[i];
      if (k < 0 || (op.masc && !op.masc.tiene(x, y))) continue;
      let v = base(x, y);
      if (v === null) continue;
      const [cx, cy, r] = tes.pts[k], b = tes.borde[i], mismo = tes.grupo[k] === tes.grupo[tes.id2[i]];
      v += (r - 0.5) * vari;
      const dx = x - cx, dy = y - cy, dl = Math.hypot(dx, dy) || 1, [lx, ly, li] = haciaLuz(x, y);
      const cara = (dx * lx + dy * ly) / dl;
      if (!mismo && b < (op.grieta ?? 0.6)) v -= (op.oscuro ?? 1.6) * (cara < 0 ? 1 : 0.6);
      else if (b < bisel) v += cara * relieve * li * (1 - b / bisel) * (mismo ? 0.45 : 1);
      g.set(x, y, ram[lim(tono(x, y, v, s), 0, n)], ram);
    }
    return g;
  }
  /* Estalactitas que cuelgan desde y0; brillo(x, y) ∈ [0, 1] enciende el borde. */
  function estalactitas(g, lista, y0, ram, brillo, haciaLuz) {
    for (const [x, ancho, largo] of lista) {
      const c = capa().poly([[x - ancho, y0], [x + ancho, y0], [x + ancho * 0.45, y0 + largo * 0.55], [x + 0.7, y0 + largo], [x - 0.5, y0 + largo], [x - ancho * 0.55, y0 + largo * 0.45]]);
      const tes = teselas(4, x * 7 + largo, x - ancho, y0, ancho * 2 + 1, largo + 1, 1);
      roca(g, tes, ram, (px, py) => 0.6 + brillo(px, py) * (ram.length - 3), haciaLuz, { masc: c, vari: 0.4, bisel: 2, relieve: 1.2, s: 0.3 });
      cada(c, (px, py) => {
        if (!c.tiene(px + 1, py)) g.set(px, py, ram[1], ram);
        else if (!c.tiene(px - 1, py) || !c.tiene(px, py + 1)) g.set(px, py, ram[lim(Math.round(1.5 + brillo(px, py) * (ram.length - 2)), 2, ram.length - 2)], ram);
      });
    }
  }
  /* Tronco o rama: tramos de línea gruesa con corteza. */
  function tronco(g, pts, grueso, ram, op = {}) {
    const c = capa();
    for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], grueso[i]);
    c.pintar(g, ram, { relieve: op.relieve || 2, luz: op.luz || [-0.85, -0.3, 0.5], max: op.max ?? 3, sesgo: op.sesgo || 0 });
    cada(c, (x, y) => { if ((x * 3 + y * 7) % 11 === 0 && c.tiene(x + 1, y) && c.tiene(x - 1, y)) g.set(x, y, ram[Math.max(0, (op.max ?? 3) - 3)], ram); });
    return c;
  }
  /* Copa o mata frondosa: masas redondeadas con hojas sueltas en el borde. */
  function copa(g, masas, ram, sem, op = {}) {
    const c = capa(), az = azar(sem);
    for (const [x, y, rx, ry] of masas) c.ell(x, y, rx, ry);
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) && az() < 0.35) c.on(x, y - 1); if (!c.tiene(x - 1, y) && az() < 0.25) c.on(x - 1, y); });
    c.pintar(g, ram, { relieve: op.relieve || 4, luz: op.luz, sesgo: op.sesgo || 0, max: op.max, min: op.min });
    for (const [x, y, rx, ry] of masas) for (let i = 0; i < rx * ry * 0.3; i++) {
      const px = Math.round(x + (az() - 0.5) * rx * 1.6), py = Math.round(y + (az() - 0.5) * ry * 1.6);
      if (!c.tiene(px, py) || !c.tiene(px + 1, py)) continue;
      matiz(g, px, py, 1); matiz(g, px + 1, py, -1);
    }
    return c;
  }
  /* Calavera de 7×7 (mira = -1 la gira hacia la izquierda). */
  function calavera(g, x, y, ram = HU, mira = 1) {
    plantilla(g, ["  aab  ", " aaabc ", "aaabbbc", "a##b##c", "ab#.#bc", " bbbbc ", "  b.c  "], x, y, { a: ram[4], b: ram[3], c: ram[2], "#": SO[0], ".": SO[1] }, mira < 0);
  }
  /* Calavera pequeña de 5×5 para los montones de huesos. */
  function calaverita(g, x, y, ram = HU, mira = 1) {
    plantilla(g, [" aab ", "aaabc", "a#b#c", " bbc ", " b.c "], x, y, { a: ram[3], b: ram[2], c: ram[1], "#": SO[0], ".": SO[1] }, mira < 0);
  }
  /* Hueso largo con cabezas en los extremos. */
  function hueso(g, x0, y0, x1, y1, ram = HU) {
    const c = capa().linea(x0, y0, x1, y1, 2).ell(x0, y0, 1.4, 1.4).ell(x1, y1, 1.4, 1.4);
    c.pintar(g, ram, { relieve: 1.2, max: 4, min: 1 });
    return c;
  }
  /* Línea de píxeles sueltos entre dos puntos (para hilos, grietas y vetas). */
  function trazo(g, x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) g.set(Math.round(x0 + ((x1 - x0) * s) / n), Math.round(y0 + ((y1 - y0) * s) / n), typeof col === "function" ? col(s / n) : col);
  }
  /* Recorrido de un río o grieta: una polilínea muestreada píxel a píxel, con meandros. */
  function recorrido(pts, sem, amp = 1.5) {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let s = 0; s < n; s++) {
        const f = s / n, nx = -(y1 - y0) / n, ny = (x1 - x0) / n, d = Math.hypot(nx, ny) || 1;
        const m = (ruido((out.length) * 0.12, sem) - 0.5) * 2 * amp;
        out.push([x0 + (x1 - x0) * f + (nx / d) * m, y0 + (y1 - y0) * f + (ny / d) * m]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* ---------- Animación ---------- */
  /* Puntos que flotan y se encienden a ratos dentro de una caja. */
  function luciernagas(ctx, t, n, x0, y0, w, h, cols, sem = 1) {
    for (let i = 0; i < n; i++) {
      const fase = (t / 1000) * (0.35 + hash(i, sem, 1) * 0.4) + hash(i, sem, 2) * 6.28;
      const brillo = Math.sin(fase * 1.7 + i);
      if (brillo < 0) continue;
      const x = Math.round(x0 + hash(i, sem, 3) * w + Math.sin(fase) * 6), y = Math.round(y0 + hash(i, sem, 4) * h + Math.sin(fase * 0.7 + 1) * 4);
      ctx.fillStyle = brillo > 0.6 ? cols[1] : cols[0];
      ctx.fillRect(x, y, 1, 1);
      if (brillo > 0.85 && cols[2]) { ctx.fillStyle = cols[2]; ctx.fillRect(x - 1, y, 3, 1); }
    }
  }
  /* Pavesas que suben (n rectángulos). */
  function pavesas(ctx, t, n, x0, w, y0, alto, cols, sem = 1, vel = 0.12) {
    for (let i = 0; i < n; i++) {
      const v = 0.5 + hash(i, sem, 1) * 0.8, p = ((t / 1000) * v * vel + hash(i, sem, 2)) % 1;
      const x = Math.round(x0 + hash(i, sem, 3) * w + Math.sin(p * 9 + i) * 4 + p * 16), y = Math.round(y0 - p * alto);
      ctx.fillStyle = p < 0.3 ? cols[0] : p < 0.6 ? cols[1] : p < 0.85 ? cols[2] : cols[3];
      ctx.fillRect(((x % W) + W) % W, y, 1, 1);
    }
  }

  /* ======================================================================
     La senda del pico: ladera de ceniza bajo el volcán, con ríos de lava.
     ====================================================================== */
  const CIELO_PICO = ["#0c0808", "#170f0e", "#24120f", "#341510", "#4c1b11", "#6a2412", "#8f3416", "#b84c1c"];
  const HUMO = [CENIZA[0], CENIZA[1], CENIZA[2], BRASA[2], BRASA[3], TE[3]];
  const CRATER_PICO = [192, 24];
  const RIOS_PICO = [];
  const RIO_LLANO = [];
  const FUMAROLAS = [[66, 108], [190, 104], [140, 103]];
  const luzCrater = (x, y) => Math.max(0, 1 - Math.hypot((x - CRATER_PICO[0]) / 90, (y - CRATER_PICO[1]) / 60));
  /* Silueta del volcán: altura de la ladera en cada x. */
  const cimaVolcan = x => {
    const [kx, ky] = CRATER_PICO;
    if (x < kx - 13) return ky + 2 + Math.pow((kx - 13 - x) / 96, 1.35) * 76 + (ruido(x * 0.15, 3) - 0.5) * 3;
    if (x > kx + 13) return ky + 2 + Math.pow((x - kx - 13) / 70, 1.25) * 42 + (ruido(x * 0.15, 4) - 0.5) * 3;
    return ky + (Math.abs(x - kx) > 10 ? 0 : 2) + (hash(x, 5) > 0.6 ? 1 : 0);
  };
  function pico(g) {
    const [kx, ky] = CRATER_PICO;
    RIOS_PICO.length = 0; RIO_LLANO.length = 0;
    // cielo de ceniza que enrojece hacia el horizonte y alrededor del cráter
    rellenar(g, 0, 0, W, 100, CIELO_PICO, (x, y) => Math.min(7, Math.pow(y / 86, 1.8) * 7) + luzCrater(x, y) * 1.6 + (fbm(x / 30, y / 9, 8) - 0.5) * 1.2, 0.6);
    // bancos de ceniza: nubes alargadas con la panza encendida por la lava
    const nube = (x, y) => {
      const banda = Math.max(0, 1 - Math.abs(y - 16 - Math.sin(x * 0.02) * 5) / 10) * 0.9 + Math.max(0, 1 - Math.abs(y - 44 - Math.sin(x * 0.03 + 2) * 4) / 7) * 0.8;
      return fbm(x / 34, y / 10, 21, 4) * banda;
    };
    for (let y = 0; y < 70; y++) for (let x = 0; x < W; x++) {
      const v = nube(x, y);
      if (v < 0.36) continue;
      const abajo = nube(x, y + 3), arriba = nube(x, y - 3), luz = luzCrater(x, y);
      let k = v > 0.5 ? 2 : 1;
      if (abajo < 0.36) k = luz > 0.25 ? 4 : 3;
      else if (abajo < v - 0.04 && luz > 0.15) k = 3;
      if (arriba < 0.36 && k < 3) k = 1;
      if (v < 0.4 && umbral(x, y) > 0.5) continue;
      g.set(x, y, HUMO[k], HUMO);
    }
    // cordilleras lejanas, en dos planos, con el filo encendido
    for (let x = 0; x < W; x++) {
      const t1 = Math.round(80 - fbm(x / 34, 1, 31) * 26 - Math.max(0, Math.sin(x * 0.05 + 0.6)) * 8);
      const t2 = Math.round(90 - fbm(x / 22, 2, 37) * 14 - Math.max(0, Math.sin(x * 0.09)) * 3);
      for (let y = t1; y < 100; y++) {
        const neblina = (y - t1) / 30;
        g.set(x, y, y === t1 ? CIELO_PICO[7] : y === t1 + 1 ? CIELO_PICO[5] : umbral(x, y) < 0.35 - neblina * 0.5 ? CIELO_PICO[4] : CIELO_PICO[3]);
      }
      for (let y = t2; y < 100; y++) g.set(x, y, y === t2 ? BRASA[3] : y === t2 + 1 ? CENIZA[2] : umbral(x, y) < (y - t2) / 40 ? BRASA[1] : CENIZA[1]);
    }
    // la columna de humo que sale del cráter y se tumba hacia la izquierda
    const humo = capa();
    for (let i = 0; i < 40; i++) {
      const f = i / 39, x = kx - 4 - f * 160 + Math.sin(f * 6) * 8, y = ky - 7 - Math.sqrt(f) * 6 + Math.sin(f * 9) * 3, r = 5 + f * 11;
      humo.ell(x, y, r * (1 + hash(i, 9) * 0.4), r * (0.5 + hash(i, 10) * 0.2));
    }
    cada(humo, (x, y) => { if (fbm(x / 7, y / 5, 45) > 0.66 && !humo.tiene(x, y - 2)) humo.off(x, y); });
    humo.pintar(g, CENIZA, { relieve: 6, max: 3, min: 1 });
    cada(humo, (x, y) => {
      const d = Math.hypot(x - kx, y - ky), cerca = Math.max(0, 1 - d / 120);
      if (!humo.tiene(x, y + 2) || !humo.tiene(x, y + 1)) g.set(x, y, cerca > 0.35 ? BRASA[4] : cerca > 0.1 ? BRASA[3] : BRASA[2], BRASA);
      else if (!humo.tiene(x, y + 4) && umbral(x, y) < 0.5 + cerca) g.set(x, y, BRASA[2], BRASA);
      else if (fbm(x / 5, y / 4, 44) > 0.6) matiz(g, x, y, -1);
      else if (fbm(x / 5, y / 4, 46) > 0.68) matiz(g, x, y, 1);
    });
    // el volcán: ladera estriada por barrancos que bajan del cráter
    const cono = capa();
    for (let x = 60; x < W; x++) for (let y = Math.round(cimaVolcan(x)); y < 100; y++) cono.on(x, y);
    const tesCono = teselas(70, 57, 60, 20, W - 60, 82, 1.6, 22);
    roca(g, tesCono, CENIZA, (x, y) => {
      const ang = Math.atan2(x - kx, Math.max(1, y - ky)), barranco = Math.sin(ang * 26 + fbm(x / 9, y / 9, 51) * 3), alto = Math.max(0, 1 - (y - ky) / 18);
      return 1.5 + (x < kx ? 0.6 * (1 - (kx - x) / 140) : -0.4) + (barranco > 0.55 ? 0.6 : barranco < -0.6 ? -0.6 : 0) + alto * 1.4 + (fbm(x / 5, y / 5, 52) - 0.5) * 0.8 - Math.max(0, (y - 80) / 20) * 0.6;
    }, () => [-0.7, -0.7, 1], { masc: cono, vari: 0.5, relieve: 1, bisel: 1.6, oscuro: 1.2, grieta: 0.45, s: 0.4 });
    contraluz(g, cono, (x, y) => (x < kx ? CENIZA[4] : BRASA[3]), 0, -1);
    // el cráter encendido, con el labio de roca más claro
    for (let x = kx - 10; x <= kx + 10; x++) {
      const y = Math.round(cimaVolcan(x));
      g.set(x, y, F[(x & 1) ? 4 : 3], F).set(x, y + 1, F[2], F).set(x, y + 2, BRASA[3], BRASA);
      if (Math.abs(x - kx) < 7) g.set(x, y - 1, F[3], F);
    }
    for (let i = 0; i < 26; i++) { const x = kx - 12 + Math.floor(hash(i, 61) * 24), y = ky - 1 - Math.floor(hash(i, 62) * 5); if (hash(i, 63) > 0.4) g.set(x, y, hash(i, 64) > 0.5 ? F[3] : F[2], F); }
    // ríos de lava que bajan por la ladera, con costra en los bordes y halo
    const rios = [
      [[kx - 4, ky + 3], [kx - 14, ky + 16], [kx - 12, ky + 30], [kx - 30, ky + 46], [kx - 42, ky + 62], [kx - 64, ky + 72]],
      [[kx + 3, ky + 3], [kx + 10, ky + 18], [kx + 22, ky + 32], [kx + 26, ky + 50], [kx + 40, ky + 68]],
      [[kx - 13, ky + 30], [kx - 4, ky + 44], [kx - 8, ky + 60], [kx + 2, ky + 74]]
    ];
    rios.forEach((pts, r) => {
      const camino = recorrido(pts, 70 + r, 1.6);
      RIOS_PICO.push(camino);
      const c = capa();
      camino.forEach(([x, y], i) => { const gr = 1 + Math.min(2.2, (i / camino.length) * 2.4) * (r === 2 ? 0.6 : 1); c.ell(x, y, gr * 0.5, 0.5); });
      // halo rojizo sobre la roca de alrededor
      for (const [x, y] of camino) for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) {
        const px = Math.round(x + i), py = Math.round(y + j), d = Math.hypot(i, j);
        if (d < 5 && cono.tiene(px, py) && !c.tiene(px, py) && umbral(px, py) < (1 - d / 5) * 0.45) g.set(px, py, d < 2.5 ? BRASA[3] : BRASA[2], BRASA);
      }
      cada(c, (x, y) => {
        const borde = !c.tiene(x - 1, y) || !c.tiene(x + 1, y);
        g.set(x, y, borde ? (c.tiene(x - 1, y) ? F[1] : F[2]) : hash(x, y, 71) > 0.7 ? F[4] : F[3], F);
      });
      // costras oscuras flotando
      camino.forEach(([x, y], i) => { if (i % 9 === 4 && i > 10) g.set(Math.round(x), Math.round(y), BRASA[2], BRASA); });
    });
    // la boca de la guarida, en la ladera, con su resplandor y la senda que sube
    const [bx, by] = [150, 70];
    for (let j = -12; j < 10; j++) for (let i = -16; i <= 16; i++) {
      const d = Math.hypot(i / 16, j / 11), x = bx + i, y = by + j;
      if (d < 1 && cono.tiene(x, y) && umbral(x, y) < (1 - d) * 0.8) g.set(x, y, d < 0.5 ? BRASA[3] : BRASA[2], BRASA);
    }
    conBorde(g, CENIZA[0], tmp => {
      const boca = capa().ell(bx, by, 7, 6).quitarRect(0, by + 3, W, 20);
      cada(boca, (x, y) => { const d = Math.hypot(x - bx, (y - by - 3) * 1.2); tmp.set(x, y, d < 3 ? F[2] : d < 5 ? BRASA[3] : d < 6 ? BRASA[1] : SO[0], F); });
      // colmillos de roca en el borde de la boca
      for (const [x, l] of [[bx - 5, 3], [bx - 2, 2], [bx + 1, 3], [bx + 4, 2]]) for (let j = 0; j < l; j++) tmp.set(x + (j > 1 ? 1 : 0), by - 5 + j, CENIZA[3 - Math.min(j, 2)], CENIZA);
      for (let x = bx - 8; x <= bx + 8; x++) tmp.set(x, by + 3, CENIZA[3], CENIZA);
    });
    const senda = [[52, 100], [96, 94], [124, 88], [108, 82], [136, 78], [124, 75], [bx, by + 3]];
    for (let i = 0; i + 1 < senda.length; i++) {
      const [x0, y0] = senda[i], [x1, y1] = senda[i + 1];
      const c = capa().linea(x0, y0, x1, y1, Math.max(1, (y0 - 66) / 9));
      cada(c, (x, y) => { if (cono.tiene(x, y) || y > 90) g.set(x, y, !c.tiene(x, y - 1) ? CENIZA[4] : CENIZA[3], CENIZA); });
    }
    // estandartes rotos junto a la boca: dos picas con calaveras
    for (const x of [bx - 11, bx + 11]) {
      for (let j = 0; j < 9; j++) g.set(x, by + 2 - j, j === 8 ? HI[3] : M[1], M);
      calaverita(g, x - 2, by - 10, HU, x < bx ? 1 : -1);
    }
    // llanura de basalto con un río de lava que la cruza, roto por la orilla
    for (let y = 90; y < 101; y++) for (let x = 0; x < W; x++) if (!cono.tiene(x, y) || y > 95) g.set(x, y, CENIZA[y < 93 ? 1 : 2], CENIZA);
    const rio = recorrido([[-4, 95], [40, 96], [80, 94], [120, 96], [150, 93], [190, 95], [230, 93], [260, 94]], 77, 1);
    RIO_LLANO.push(...rio);
    rio.forEach(([x, y], i) => {
      const X = Math.round(x), Y = Math.round(y), ancho = ruido(i * 0.05, 7) > 0.5 ? 1 : 0;
      g.set(X, Y - 1, BRASA[3], BRASA).set(X, Y, hash(X, 3) > 0.8 ? F[4] : F[3], F).set(X, Y + 1, ancho ? F[3] : F[2], F).set(X, Y + 2, ancho ? F[2] : BRASA[3], F).set(X, Y + 3, CENIZA[1], CENIZA);
    });
    // la orilla de delante: piedras negras que tapan trozos del río
    for (let x = 0; x < W; x += 3 + Math.floor(hash(x, 98) * 9)) {
      const r = 1 + hash(x, 99) * 2.6, y = 98 + hash(x, 97) * 2;
      const c = capa().ell(x, y, r * 1.5, r).quitarRect(0, 101, W, 10);
      c.pintar(g, CENIZA, { relieve: 1.5, max: 3 });
      contraluz(g, c, BRASA[3], 0, -1);
    }
    // columnas de basalto a la izquierda, prismas que suben escalonados
    conBorde(g, CENIZA[0], tmp => {
      const prismas = [[2, 50, 9], [11, 58, 8], [19, 46, 9], [28, 64, 8], [36, 72, 7], [43, 80, 7], [-6, 62, 8]];
      for (const [x, top, w] of prismas) {
        const c = capa().rect(x, top + 2, w, 104 - top - 2).poly([[x, top + 2], [x + w / 2, top], [x + w, top + 2]]);
        c.pintar(tmp, CENIZA, { relieve: 3, luz: [-0.8, -0.4, 0.5], max: 4 });
        for (let y = top + 2; y < 104; y++) { tmp.set(x + w - 1, y, CENIZA[1], CENIZA); if (hash(x, y, 81) > 0.93) tmp.set(x + 1 + Math.floor(hash(x, y, 82) * (w - 3)), y, CENIZA[1], CENIZA); }
        for (let i = 0; i < w; i++) tmp.set(x + i, top + 1 + (i < w / 2 ? 0 : 1), CENIZA[4], CENIZA);
        // grieta incandescente entre prismas
        for (let y = top + 6; y < 104; y += 1) if (hash(x, y >> 2, 83) > 0.78) tmp.set(x + w - 1, y, BRASA[3], BRASA);
      }
    });
    // suelo de ceniza: más claro donde se pisa, con piedras y grietas que aún arden
    const yS = 100;
    for (let y = yS; y < H; y++) for (let x = 0; x < W; x++) {
      if (y < 104 && g.get(x, y) && CENIZA.indexOf(g.get(x, y)) >= 0 && x < 51) continue;
      const pisada = Math.max(0, 1 - Math.abs(y - 128) / 18), ola = fbm(x / 14, y / 5, 91);
      let v = 1.4 + pisada * 0.9 + (ola - 0.5) * 1.3 + luzCrater(x, 60) * 0.5 - Math.max(0, y - 136) * 0.05;
      v += Math.max(0, 1 - (y - yS) / 8) * 0.8;
      if (Math.sin(x * 0.09 + fbm(x / 20, y / 6, 97) * 6 + y * 0.9) > 0.93) v -= 0.8;
      if (hash(x, y, 92) > 0.97) v -= 1;
      if (hash(x, y, 93) > 0.985) v += 1;
      g.set(x, y, CENIZA[lim(tono(x, y, v, 0.45), 0, 4)], CENIZA);
    }
    for (let x = 0; x < W; x++) { g.set(x, yS, CENIZA[1], CENIZA); if (umbral(x, yS + 1) < 0.5) g.set(x, yS + 1, CENIZA[1], CENIZA); }
    // piedras sueltas por el suelo, más grandes delante
    for (let i = 0; i < 44; i++) {
      const y = yS + 3 + Math.floor(hash(i, 94) * 40), x = Math.floor(hash(i, 95) * W), r = 0.6 + ((y - yS) / 44) * 1.8 * hash(i, 96);
      if (y > 112 && y < 140 && x > 20 && x < 236 && r > 1.2) continue;
      capa().ell(x, y, r * 1.4, r).pintar(g, CENIZA, { relieve: 1.5, max: 4, min: 1 });
      g.set(x - Math.round(r), y + Math.round(r) + 1, CENIZA[0], CENIZA);
    }
    // grietas encendidas: en los bordes del suelo y alguna fina en medio
    for (const [pts, fino] of [
      [[[0, 112], [14, 116], [22, 114], [38, 120], [46, 119]], false], [[[208, 108], [222, 112], [236, 110], [256, 116]], false],
      [[[96, 104], [108, 106], [118, 105]], true], [[[150, 140], [166, 136], [178, 138], [192, 135]], true], [[[0, 136], [12, 134], [24, 140], [30, 144]], false],
      [[[226, 144], [236, 136], [250, 134], [256, 130]], false]
    ]) {
      const c = recorrido(pts, pts[0][0] + 5, 1);
      c.forEach(([x, y], i) => {
        const X = Math.round(x), Y = Math.round(y);
        g.set(X, Y, fino ? BRASA[3] : i % 5 ? F[2] : F[3], F);
        if (!fino) { g.set(X, Y + 1, BRASA[3], BRASA); if (umbral(X, Y - 1) < 0.5) g.set(X, Y - 1, BRASA[2], BRASA); }
      });
    }
    // rocas grandes en las esquinas de delante, con el canto rojo de la lava
    for (const [x, y, w, h, lado] of [[-6, 124, 30, 22, 1], [228, 120, 34, 26, -1], [40, 136, 16, 9, 1], [196, 138, 18, 7, -1]]) {
      const c = capa().poly([[x, y + h], [x + w * 0.1, y + h * 0.35], [x + w * 0.38, y], [x + w * 0.7, y + h * 0.12], [x + w * 0.95, y + h * 0.5], [x + w, y + h]]);
      const tes = teselas(5, x + 300, x, y, w + 1, h + 1, 1);
      roca(g, tes, CENIZA, (px, py) => 2.6 - ((py - y) / h) * 1.6, () => [-0.7, -0.7, 1], { masc: c, vari: 0.5, relieve: 1.6, bisel: 2.5, s: 0.3 });
      contraluz(g, c, BRASA[3], lado, 0);
      contraluz(g, c, CENIZA[4], 0, -1);
    }
    // árboles muertos y calcinados a los lados, con el canto que mira a la lava encendido
    for (const [pts, gr] of [
      [[[9, 110], [11, 86], [7, 66], [13, 44], [11, 28]], [6, 5, 4, 3]], [[[10, 72], [22, 62], [26, 50]], [3, 2]], [[[12, 50], [3, 42], [0, 36]], [2, 1]],
      [[[22, 62], [31, 63]], [1]], [[[12, 38], [19, 31]], [1]], [[[247, 114], [244, 90], [250, 70], [246, 50]], [6, 5, 4]],
      [[[246, 84], [234, 74], [228, 62]], [3, 2]], [[[249, 66], [256, 58]], [2]], [[[234, 74], [226, 76]], [1]], [[[247, 56], [240, 46]], [1]]
    ]) {
      const c = tronco(g, pts, gr, CENIZA, { max: 3 });
      contraluz(g, c, (x, y) => (umbral(x, y) < 0.6 ? BRASA[3] : BRASA[2]), 1, 0);
    }
    for (const [x, y] of [[11, 28], [26, 50], [228, 62], [246, 50], [0, 36], [19, 31], [240, 46]]) g.set(x, y - 1, BRASA[3], BRASA);
    // fumarolas: bocas de roca que humean (el vapor se anima)
    for (const [x, y] of FUMAROLAS) {
      const c = capa().ell(x, y, 4, 2);
      c.pintar(g, CENIZA, { relieve: 1.5, max: 4, min: 2 });
      g.set(x - 1, y - 1, SO[0]).set(x, y - 1, SO[0]).set(x + 1, y - 1, SO[0]).set(x, y - 2, BRASA[3], BRASA);
      velo(g, x - 8, y - 3, 17, 6, (px, py) => (1 - Math.hypot((px - x) / 8, (py - y) / 3)) * 0.5, CENIZA[3]);
    }
    // esquirlas de obsidiana y huesos medio enterrados en la ceniza
    for (const [x, y, alto, lado] of [[52, 112, 6, 1], [56, 113, 4, 1], [206, 110, 7, -1], [210, 112, 4, -1], [120, 107, 3, 1]]) {
      conBorde(g, CENIZA[0], tmp => {
        capa().poly([[x - 2, y], [x + lado, y - alto], [x + 2, y]]).pintar(tmp, SO, { relieve: 1.5, min: 1, max: 4, luz: [-0.7, -0.5, 0.5] });
        tmp.set(x + lado, y - alto + 1, BRASA[4], BRASA);
      });
    }
    hueso(g, 62, 141, 72, 138);
    calaverita(g, 74, 136, HU, -1);
    hueso(g, 178, 108, 186, 110);
    // una espada rota y un yelmo de algún incauto
    conBorde(g, CENIZA[0], tmp => {
      capa().linea(30, 128, 36, 117, 1).pintar(tmp, HI, { plano: 3 });
      capa().linea(27, 121, 33, 124, 1).pintar(tmp, B, { plano: 2 });
      capa().ell(222, 140, 4, 3).quitarRect(0, 141, W, 4).pintar(tmp, HI, { relieve: 2, max: 4 });
      tmp.set(220, 140, SO[0]).set(221, 140, SO[0]).set(223, 140, SO[0]);
    });
  }
  function picoAnim(ctx, t) {
    if (!RIOS_PICO.length) pico(new Rejilla(W, H));
    // pavesas que suben desde el suelo
    pavesas(ctx, t, 18, -10, W, H, H + 10, [F[4], F[3], F[2], BRASA[3]], 3);
    // la lava corre ladera abajo
    RIOS_PICO.forEach((c, r) => {
      for (let i = 0; i < 5; i++) {
        const p = ((t / 1000) * 0.09 + i / 5 + r * 0.13) % 1, [x, y] = c[Math.floor(p * (c.length - 1))];
        ctx.fillStyle = i % 2 ? F[4] : HU[4];
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    });
    for (let i = 0; i < 6; i++) {
      const p = ((t / 1000) * 0.03 + i / 6) % 1, [x, y] = RIO_LLANO[Math.floor(p * (RIO_LLANO.length - 1))];
      ctx.fillStyle = F[4]; ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
    }
    // vapor de las fumarolas
    FUMAROLAS.forEach(([x, y], k) => {
      for (let i = 0; i < 3; i++) {
        const p = ((t / 1000) * 0.35 + i / 3 + k * 0.21) % 1;
        ctx.fillStyle = p < 0.4 ? CENIZA[4] : CENIZA[3];
        ctx.fillRect(Math.round(x + Math.sin(p * 6 + k) * 2 + p * 4), Math.round(y - 3 - p * 14), p < 0.5 ? 1 : 2, 1);
      }
    });
    // un relámpago en la nube de ceniza, de vez en cuando
    const ciclo = (t / 1000) % 7.3;
    if (ciclo < 0.16) {
      const az = azar(Math.floor(t / 7300) + 3);
      let x = 120 + Math.floor(az() * 60), y = 4 + Math.floor(az() * 6);
      ctx.fillStyle = ciclo < 0.08 ? HU[4] : MG[4];
      for (let i = 0; i < 8; i++) { ctx.fillRect(x, y, 1, 2); x += Math.round((az() - 0.5) * 5); y += 2; }
    }
    // el cráter escupe chispas
    const [kx, ky] = CRATER_PICO;
    for (let i = 0; i < 6; i++) {
      const p = ((t / 1000) * 0.7 + hash(i, 5)) % 1, x = Math.round(kx + (hash(i, 6) - 0.5) * 18 * p * 2), y = Math.round(ky - p * 14 + p * p * 10);
      ctx.fillStyle = p < 0.5 ? F[4] : F[2]; ctx.fillRect(x, y, 1, 1);
    }
  }


  /* ======================================================================
     La guarida de Ignárax: montañas de oro, lava y huesos de dragón.
     ====================================================================== */
  const CUEVA = [CENIZA[0], CENIZA[1], BRASA[1], BRASA[2], CENIZA[3], BRASA[3], TE[3]];
  const ORO = ["#3a2008", "#6b4512", "#a8721e", "#e0aa3a", "#ffe08a"];
  const CASCADA = [22, 14];
  const LAGO_G = [24, 101, 26];
  const BRILLOS_G = [];
  const BURBUJAS_G = [];
  const luzG = (x, y) => lim(
    Math.max(0, 1 - Math.hypot((x - 24) / 76, (y - 80) / 76)) ** 1.2 * 1.25 +
    Math.max(0, 1 - Math.hypot((x - 240) / 50, (y - 98) / 40)) ** 1.4 * 0.8 +
    Math.max(0, 1 - Math.hypot((x - 132) / 100, (y - 70) / 56)) ** 1.5 * 0.95);
  const desdeAbajo = () => [0, 1, 1];
  /* Altura del montón de oro principal en cada x. */
  const MONTONES = [[132, 36, 76, 1], [176, 58, 40, 2], [96, 62, 40, 3], [130, 70, 36, 4], [60, 88, 22, 5], [206, 84, 24, 6], [160, 84, 26, 7], [104, 88, 24, 8]];
  function guarida(g) {
    BRILLOS_G.length = 0; BURBUJAS_G.length = 0;
    g.rect(0, 0, W, H, CENIZA[0]);
    // pared de roca de la cueva, encendida desde abajo
    const tes = teselas(130, 23, 0, 0, W, 102, 1.5, 22);
    roca(g, tes, CUEVA, (x, y) => 0.8 + luzG(x, y) * 4.6 - Math.max(0, 16 - y) * 0.08, desdeAbajo, { vari: 0.6, relieve: 1.3, bisel: 2.2, oscuro: 1.6 });
    // una gran grieta por la que cae la lava, a la izquierda
    const [cx0, cy0] = CASCADA;
    const grieta = capa().poly([[cx0 - 6, cy0], [cx0 + 6, cy0 - 2], [cx0 + 9, cy0 + 10], [cx0 + 8, 98], [cx0 - 8, 98], [cx0 - 9, cy0 + 8]]);
    cada(grieta, (x, y) => g.set(x, y, SO[0]));
    contraluz(g, grieta, BRASA[3], 1, 0); contraluz(g, grieta, BRASA[2], -1, 0);
    for (let y = cy0; y < 100; y++) {
      const ancho = 3 + Math.min(3, (y - cy0) / 14), cx = cx0 + Math.sin(y * 0.15) * 0.8;
      for (let x = Math.round(cx - ancho); x <= Math.round(cx + ancho); x++) {
        const f = (x - (cx - ancho)) / (2 * ancho), raya = Math.sin(x * 2.1 + y * 0.35) > 0.4;
        g.set(x, y, f < 0.15 ? F[1] : f > 0.85 ? BRASA[3] : raya ? F[4] : f < 0.5 ? F[3] : F[2], F);
      }
    }
    // estalactitas con la punta encendida por la lava
    estalactitas(g, [[8, 5, 20], [40, 4, 12], [62, 5, 18], [86, 3, 10], [104, 4, 15], [130, 3, 9], [150, 5, 20], [176, 3, 11], [198, 5, 17], [222, 4, 13], [246, 6, 24]], 0, CUEVA, (x, y) => luzG(x, y + 30), desdeAbajo);
    // costillar del dragón antiguo, medio enterrado bajo el oro
    conBorde(g, CENIZA[0], tmp => {
      const espina = t0 => { const u = 1 - t0; return [u * u * 36 + 2 * u * t0 * 58 + t0 * t0 * 112, u * u * 102 + 2 * u * t0 * 40 + t0 * t0 * 52]; };
      for (let k = 6; k >= 0; k--) {
        const [sx, sy] = espina(0.22 + k * 0.1), fin = 103 - k * 0.5;
        const c = capa().curva(sx, sy, sx - 16 + k * 0.5, sy + (fin - sy) * 0.45, sx - 6 + k, fin, 3.4, 2);
        c.pintar(tmp, HU, { relieve: 1.6, max: 4, luz: [-0.7, -0.5, 0.5] });
        contraluz(tmp, c, BRASA[3], -1, 0);
      }
      const lomo = capa();
      for (let k = 0; k <= 40; k++) { const [x, y] = espina(k / 40); lomo.ell(x, y, 2.2, 2.2); }
      lomo.pintar(tmp, HU, { relieve: 2, max: 4, luz: [-0.5, -0.8, 0.5] });
      for (let k = 0; k < 13; k++) { const [x, y] = espina(0.05 + k * 0.075); capa().poly([[x - 2, y - 1], [x - 1, y - 6], [x + 1, y - 5], [x + 2, y - 1]]).pintar(tmp, HU, { relieve: 1, max: 3 }); }
    });
    // la montaña de oro: varios montones que se solapan, cubiertos de monedas
    const oro = capa();
    for (const [cx, top, hw, sem] of MONTONES) {
      const m = capa();
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const f = (x - cx) / hw;
        if (Math.abs(f) > 1) continue;
        const y0 = top + Math.pow(Math.abs(f), 1.6) * (104 - top) + (ruido(x * 0.3, sem) - 0.5) * 2.4;
        const pie = 102 + Math.round(ruido(x * 0.4, sem + 1) * 4);
        for (let y = Math.round(y0); y <= pie; y++) m.on(x, y);
      }
      m.pintar(g, ORO, { relieve: Math.max(5, hw / 4), luz: [-0.4, -0.8, 0.45], separar: 2 });
      oro.unir(m);
    }
    // monedas: cada una con su canto claro arriba y su sombra debajo
    const azM = azar(404);
    for (let i = 0; i < 1500; i++) {
      const x = Math.floor(40 + azM() * 176), y = Math.floor(30 + azM() * 76);
      if (!oro.tiene(x, y) || !oro.tiene(x + 2, y + 1)) continue;
      matiz(g, x, y, 1); matiz(g, x + 1, y, 1); matiz(g, x + 2, y + 1, -1); matiz(g, x + 1, y + 1, -1); matiz(g, x, y + 1, -1);
      if (azM() < 0.08) g.set(x, y, ORO[4], ORO);
    }
    cada(oro, (x, y) => {
      const sombra = (x - 120) / 110 + (y - 50) / 90, luz = (128 - x) / 90 + (64 - y) / 50;
      if (umbral(x, y) < sombra * 0.45) matiz(g, x, y, -1);
      else if (umbral(x, y) < luz * 0.35) matiz(g, x, y, 1);
      if (y > 94 && umbral(x, y) < (y - 94) / 14) matiz(g, x, y, -1);
      if (hash(x, y, 8) > 0.985 && y < 98) BRILLOS_G.push([x, y]);
    });
    // monedas sueltas en el perfil del montón
    cada(oro, (x, y) => { if (!oro.tiene(x, y - 1) && hash(x, y, 9) > 0.7) g.set(x, y - 1, ORO[3], ORO); });
    // tesoros sobre el oro
    conBorde(g, BRASA[0], tmp => {
      // cofre abierto con joyas, a la izquierda
      cofre(tmp, 76, 76, true);
      cofre(tmp, 174, 70, false);
      // corona en la cima y espada clavada
      capa().rect(124, 32, 11, 4).pintar(tmp, ORO, { relieve: 1, min: 2 });
      for (const dx of [0, 5, 10]) tmp.set(124 + dx, 31, ORO[4], ORO).set(124 + dx, 30, ORO[3], ORO);
      tmp.set(126, 33, RUBI[3], RUBI).set(129, 33, CRISTAL[3], CRISTAL).set(132, 33, ESMERALDA[3], ESMERALDA);
      capa().rect(148, 22, 3, 22).poly([[148, 44], [149.5, 47], [151, 44]]).pintar(tmp, PL, { relieve: 1.2, max: 4 });
      for (let y = 23; y < 43; y++) tmp.set(149, y, PL[4], PL);
      capa().rect(143, 20, 13, 2).pintar(tmp, ORO, { relieve: 1, min: 2 });
      capa().rect(148, 13, 3, 7).pintar(tmp, M, { plano: 2 });
      for (const y of [14, 16, 18]) tmp.set(148, y, M[3], M).set(149, y, M[1], M);
      capa().ell(149.5, 11.5, 2, 2).pintar(tmp, ORO, { relieve: 1.5 });
      tmp.set(149, 11, RUBI[4], RUBI);
      // copas y jarras
      for (const [x, y] of [[104, 56], [160, 52], [196, 80]]) {
        capa().ell(x + 3, y + 1, 3, 2).rect(x + 2, y + 3, 2, 3).rect(x, y + 6, 6, 1).pintar(tmp, ORO, { relieve: 1.2, min: 1 });
        tmp.set(x + 1, y, ORO[4], ORO).set(x + 3, y + 2, RUBI[3], RUBI);
      }
      capa().ell(116, 48, 3, 4).rect(115, 42, 3, 3).pintar(tmp, PL, { relieve: 1.5 });
      // escudos apoyados
      escudo(tmp, 96, 66, GR);
      escudo(tmp, 188, 62, AZ);
      // un gran rubí y un yelmo con cuernos
      capa().poly([[138, 58], [142, 54], [146, 58], [142, 63]]).pintar(tmp, RUBI, { relieve: 1.5, luz: [-0.7, -0.7, 0.5] });
      tmp.set(141, 56, RUBI[4], RUBI);
      capa().ell(112, 74, 5, 4).quitarRect(0, 76, W, 4).rect(107, 76, 11, 1).pintar(tmp, HI, { relieve: 2, max: 4 });
      capa().curva(107, 73, 103, 71, 103, 66, 2, 1).curva(117, 73, 121, 71, 121, 66, 2, 1).pintar(tmp, HU, { relieve: 1, max: 4 });
      tmp.set(110, 75, SO[0]).set(111, 75, SO[0]).set(113, 75, SO[0]).set(114, 75, SO[0]);
    });
    for (const [x, y, ram] of [[90, 80, RUBI], [118, 62, ESMERALDA], [134, 46, CRISTAL], [156, 66, RUBI], [168, 80, ESMERALDA], [100, 90, CRISTAL], [146, 86, RUBI], [128, 72, ESMERALDA], [60, 94, CRISTAL]]) {
      g.set(x, y, ram[3], ram).set(x + 1, y, ram[2], ram).set(x, y - 1, ram[4], ram).set(x + 1, y + 1, ram[1], ram);
    }
    // la calavera del dragón antiguo, a la derecha, mirando a los héroes
    conBorde(g, CENIZA[0], tmp => calaveraDragon(tmp, 200, 62));
    // la vértebra que baja por la pared, a la derecha
    for (let k = 0; k < 7; k++) {
      const x = 246 - k * 1.5, y = 22 + k * 6;
      conBorde(g, CENIZA[0], tmp => { capa().ell(x, y, 3.2, 2.2).pintar(tmp, HU, { relieve: 1.5, max: 3 }); tmp.set(Math.round(x + 3), y, HU[1], HU).set(Math.round(x + 4), y - 1, HU[2], HU); });
    }
    // lago de lava a la izquierda, donde cae la cascada, y un canal a la derecha
    const [lx, ly, lr] = LAGO_G;
    const lago = capa().ell(lx, ly + 2, lr, 6).quitarRect(0, 0, W, ly - 2);
    cada(lago, (x, y) => {
      const d = Math.hypot((x - lx) / lr, (y - ly - 2) / 6);
      g.set(x, y, d > 0.88 ? BRASA[3] : F[lim(tono(x, y, 3.8 - d * 2.4 + Math.sin(x * 0.5 + y) * 0.4, 0.6), 0, 4)], F);
    });
    for (let x = lx - lr; x <= lx + lr; x++) g.set(x, ly - 2, BRASA[2], BRASA);
    capa().ell(CASCADA[0], ly, 7, 2.5).pintar(g, F, { relieve: 2, min: 3 });
    for (const [x, y] of [[CASCADA[0] - 8, ly - 2], [CASCADA[0] + 8, ly - 1], [CASCADA[0] - 5, ly - 4], [CASCADA[0] + 6, ly - 4]]) g.set(x, y, F[4], F);
    for (let i = 0; i < 6; i++) BURBUJAS_G.push([Math.round(lx - lr * 0.7 + hash(i, 1, 9) * lr * 1.4), ly + 1 + (i % 3)]);
    // suelo de roca: zarpazos, monedas sueltas y el resplandor de la lava
    const yS = 102;
    for (let y = yS; y < H; y++) for (let x = 0; x < W; x++) {
      if (lago.tiene(x, y)) continue;
      const v = 1.7 + luzG(x, 96) * 2.4 - (y - yS) * 0.02 + (fbm(x / 10, y / 4, 33) - 0.5) * 1.2 + (hash(x, y, 34) > 0.975 ? -1 : 0);
      g.set(x, y, CUEVA[lim(tono(x, y, v, 0.4), 0, 6)], CUEVA);
    }
    for (let x = 0; x < W; x++) if (!lago.tiene(x, yS)) g.set(x, yS, CUEVA[1], CUEVA);
    // monedas desparramadas: muchas al pie del montón, pocas donde se pisa
    for (let i = 0; i < 150; i++) {
      const x = Math.floor(hash(i, 21) * W), y = yS + 1 + Math.floor(Math.pow(hash(i, 22), 1.8) * 42);
      if (lago.tiene(x, y) || lago.tiene(x + 1, y)) continue;
      if (y > 112 && x > 28 && x < 228 && hash(i, 23) > 0.12) continue;
      g.set(x, y, ORO[3], ORO).set(x + 1, y, ORO[2], ORO).set(x, y + 1, ORO[1], ORO);
      if (hash(i, 24) > 0.8) g.set(x, y - 1, ORO[4], ORO);
    }
    // montoncitos de monedas en las esquinas de delante
    for (const [x, y, r] of [[8, 142, 12], [248, 142, 14], [66, 106, 8], [206, 104, 10]]) {
      const c = capa().ell(x, y, r, r * 0.45).quitarRect(0, y + 1, W, 10);
      c.pintar(g, ORO, { relieve: 4, luz: [-0.35, -0.85, 0.45] });
      cada(c, (px, py) => { if ((px + (py & 1) * 2) % 4 === 0) matiz(g, px, py, -1); else if (py % 2 === 0 && hash(px, py, 26) > 0.7) matiz(g, px, py, 1); });
      contraluz(g, c, ORO[4], 0, -1);
    }
    // zarpazos del dragón en la roca
    for (const [x, y] of [[132, 128], [96, 136]]) for (let k = 0; k < 4; k++) trazo(g, x + k * 4, y, x + k * 4 + 14, y - 6, (f) => (f > 0.1 && f < 0.9 ? CENIZA[0] : CUEVA[1]));
    calavera(g, 238, 128, HU, -1);
    hueso(g, 18, 132, 32, 136);
    hueso(g, 224, 136, 234, 132);
    const quedan = BRILLOS_G.filter(([x, y]) => ORO.includes(g.get(x, y)));
    BRILLOS_G.length = 0; BRILLOS_G.push(...quedan);
  }
  /* Cofre de madera con herrajes de oro (abierto, con joyas asomando). */
  function cofre(tmp, x, y, abierto) {
    capa().rect(x, y, 18, 10).pintar(tmp, M, { relieve: 1.5, max: 3 });
    for (let i = 0; i < 18; i++) { tmp.set(x + i, y, ORO[3], ORO); tmp.set(x + i, y + 9, ORO[1], ORO); }
    for (const dx of [2, 15]) for (let j = 0; j < 10; j++) tmp.set(x + dx, y + j, ORO[j < 2 ? 4 : 2], ORO);
    if (abierto) {
      capa().poly([[x, y], [x + 1, y - 7], [x + 17, y - 9], [x + 18, y]]).quitarRect(x + 2, y - 5, 15, 5).pintar(tmp, M, { relieve: 1.2, max: 2 });
      for (let i = 1; i < 17; i++) tmp.set(x + i, y - 1, hash(i, x, 3) > 0.6 ? RUBI[3] : hash(i, x, 4) > 0.5 ? ORO[4] : CRISTAL[3]);
      for (let i = 3; i < 15; i += 3) tmp.set(x + i, y - 2, ORO[4], ORO);
      capa().linea(x + 12, y - 1, x + 20, y + 4, 1).pintar(tmp, ORO, { plano: 3 });
    } else {
      capa().ell(x + 9, y, 9, 4).quitarRect(0, y + 1, W, 8).pintar(tmp, M, { relieve: 2, max: 3 });
      for (let i = 0; i < 18; i++) tmp.set(x + i, y, ORO[2], ORO);
    }
    capa().rect(x + 8, y + 2, 3, 3).pintar(tmp, ORO, { relieve: 1, min: 3 });
    tmp.set(x + 9, y + 4, SO[0]);
  }
  function escudo(tmp, x, y, ram) {
    const c = capa().rect(x - 5, y - 5, 11, 6).poly([[x - 5.5, y], [x + 5.5, y], [x, y + 8]]);
    c.pintar(tmp, ram, { relieve: 2.5, max: 4 });
    contraluz(tmp, c, ORO[2], 1, 0); contraluz(tmp, c, ORO[3], -1, 0); contraluz(tmp, c, ORO[4], 0, -1);
    for (let j = -3; j < 6; j++) tmp.set(x, y + j, ORO[3], ORO);
    for (let i = -3; i <= 3; i++) tmp.set(x + i, y - 1, ORO[3], ORO);
  }
  /* Calavera de dragón: cráneo largo, cuernos hacia atrás, cuenca vacía y colmillos. Mira a la izquierda. */
  function calaveraDragon(tmp, x, y) {
    const luz = [-0.5, -0.7, 0.5];
    // cuernos curvos hacia atrás (detrás del cráneo)
    capa().curva(x + 34, y + 8, x + 54, y + 6, x + 54, y - 10, 5, 1.5).pintar(tmp, HU, { relieve: 2, luz, max: 3 });
    capa().curva(x + 28, y + 6, x + 46, y - 2, x + 44, y - 16, 4, 1.2).pintar(tmp, HU, { relieve: 2, luz, max: 4 });
    // mandíbula, abierta y apoyada en el suelo
    const mand = capa().poly([[x - 2, y + 34], [x + 4, y + 30], [x + 36, y + 30], [x + 44, y + 22], [x + 48, y + 26], [x + 42, y + 38], [x, y + 39]]);
    mand.pintar(tmp, HU, { relieve: 3, luz, max: 3 });
    // cráneo y hocico
    const cra = capa().poly([[x - 4, y + 22], [x - 2, y + 15], [x + 10, y + 11], [x + 20, y + 4], [x + 30, y], [x + 42, y + 4], [x + 48, y + 14], [x + 44, y + 24], [x + 30, y + 24], [x + 12, y + 26], [x - 2, y + 26]]);
    cra.pintar(tmp, HU, { relieve: 5, luz, max: 4 });
    // cresta de púas sobre el cráneo
    for (let k = 0; k < 5; k++) { const px = x + 20 + k * 5, py = y + 3 - (k < 2 ? k : 4 - k) * 0.5; capa().poly([[px - 2, py + 2], [px + 1, py - 4], [px + 3, py + 2]]).pintar(tmp, HU, { relieve: 1, luz, max: 3 }); }
    // cuenca del ojo con un rescoldo dentro, fosa nasal y grietas
    const ojo = capa().ell(x + 30, y + 11, 5, 4);
    cada(ojo, (px, py) => tmp.set(px, py, Math.hypot(px - x - 31, py - y - 12) < 1.6 ? BRASA[3] : SO[0], SO));
    contraluz(tmp, ojo, HU[1], 0, -1);
    for (const [a, b] of [[x + 1, y + 17], [x + 2, y + 17], [x + 1, y + 18]]) tmp.set(a, b, SO[0], SO);
    trazo(tmp, x + 36, y + 3, x + 40, y + 11, HU[1]);
    trazo(tmp, x + 14, y + 13, x + 20, y + 17, HU[1]);
    // la línea de la boca y los colmillos
    for (let i = x - 2; i < x + 40; i++) tmp.set(i, y + 26, SO[0], SO).set(i, y + 27, SO[1], SO);
    for (let k = 0; k < 8; k++) {
      const px = x + k * 5, largo = k === 0 || k === 3 ? 4 : 2;
      for (let j = 0; j < largo; j++) tmp.set(px + (j > 1 ? 1 : 0), y + 26 + j, HU[j ? 3 : 4], HU).set(px + 1, y + 26 + j, HU[2], HU);
      if (k < 7) for (let j = 0; j < 2; j++) tmp.set(px + 2, y + 29 - j, HU[3], HU);
    }
    // contraluz rojo de la lava en la parte de abajo
    contraluz(tmp, mand, BRASA[3], 0, 1);
    contraluz(tmp, cra, (px, py) => (py > y + 18 ? TE[3] : HU[4]), -1, 0);
  }
  function guaridaAnim(ctx, t) {
    if (!BRILLOS_G.length) guarida(new Rejilla(W, H));
    // destellos en el oro
    BRILLOS_G.forEach(([x, y], i) => {
      const p = ((t / 1000) * 0.4 + hash(i, 31)) % 1;
      if (p > 0.05) return;
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 1);
      if (p > 0.012 && p < 0.038) { ctx.fillStyle = ORO[4]; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
    });
    // la cascada de lava: grumos claros que bajan
    const [cx0, cy0] = CASCADA;
    for (let i = 0; i < 10; i++) {
      const p = ((t / 1000) * 0.5 + i / 10) % 1, y = Math.round(cy0 + p * (98 - cy0)), x = Math.round(cx0 + Math.sin(y * 0.15) * 0.8 + (hash(i, 7) - 0.5) * 5);
      ctx.fillStyle = i % 3 ? F[4] : HU[4]; ctx.fillRect(x, y, 1, 2);
    }
    // burbujas del lago
    BURBUJAS_G.forEach(([x, y], k) => {
      const p = ((t / 1000) * (0.45 + k * 0.07) + hash(k, 3)) % 1;
      if (p < 0.6) { ctx.fillStyle = p < 0.3 ? F[3] : F[4]; ctx.fillRect(x, y - (p > 0.3 ? 1 : 0), p > 0.3 ? 2 : 1, 1); }
      else if (p < 0.75) { ctx.fillStyle = F[4]; ctx.fillRect(x - 1, y - 2, 1, 1); ctx.fillRect(x + 2, y - 2, 1, 1); }
    });
    // pavesas que suben desde la lava
    pavesas(ctx, t, 12, 0, 60, 100, 90, [F[4], F[3], F[2], BRASA[3]], 5, 0.18);
    // el rescoldo del ojo de la calavera late
    if (Math.sin(t / 700) > 0.2) { ctx.fillStyle = Math.sin(t / 700) > 0.8 ? F[4] : F[3]; ctx.fillRect(231, 73, 1, 1); }
  }


  /* ======================================================================
     El Abismo: cielo de vacío, sol negro, islas de obsidiana que flotan.
     ====================================================================== */
  const NADA = ["#05030a", "#0c0717", "#170d2a", "#251543", "#3a2160", "#57357f"];
  const OBSIDIANA = ["#07050b", "#110c19", "#1d1529", "#2d2242", "#463563", "#6a5290"];
  const AZUR = ["#08222a", "#0f4a56", "#1c8590", "#47c6c8", "#b6fff2"];
  const SOL_NEGRO = [180, 34];
  const ESTRELLAS_AB = [];
  const CHORRO_AB = [];
  const nebulosa = (x, y) => fbm(x / 46, y / 22, 101, 4) * 1.4 - 0.55 + Math.max(0, 1 - Math.abs(y - (60 - x * 0.16)) / 22) * 0.35;
  function abismo(g) {
    ESTRELLAS_AB.length = 0; CHORRO_AB.length = 0;
    const [sx, sy] = SOL_NEGRO;
    // el vacío: oscuro arriba, violeta hacia el horizonte, con nebulosas
    rellenar(g, 0, 0, W, 100, NADA, (x, y) => 0.15 + Math.pow(y / 96, 2) * 2.8 + Math.max(0, nebulosa(x, y)) * 2.4 + Math.max(0, 1 - Math.hypot(x - sx, y - sy) / 60) * 1.4, 0.8);
    // vetas de polvo cian y magenta dentro de la nebulosa
    for (let y = 0; y < 96; y++) for (let x = 0; x < W; x++) {
      const n = nebulosa(x, y), v = fbm(x / 12, y / 8, 103, 3);
      if (n > 0.42 && v > 0.66) g.set(x, y, v > 0.7 ? AZUR[2] : AZUR[1], AZUR);
    }
    // estrellas: muchas pequeñas, algunas con cruz
    for (let i = 0; i < 220; i++) {
      const x = Math.floor(hash(i, 1, 41) * W), y = Math.floor(Math.pow(hash(i, 2, 41), 1.3) * 90), h = hash(i, 3, 41);
      if (Math.hypot(x - sx, y - sy) < 18) continue;
      g.set(x, y, h > 0.85 ? HU[4] : h > 0.55 ? AZUR[3] : h > 0.3 ? MG[3] : NADA[5]);
      if (h > 0.96) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.set(x + a, y + b, h > 0.98 ? AZUR[3] : MG[2]);
      if (h > 0.99) for (const [a, b] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) g.set(x + a, y + b, MG[1]);
      ESTRELLAS_AB.push([x, y, h]);
    }
    // el sol negro: disco de vacío, anillo encendido y corona de rayos
    for (let y = sy - 40; y <= sy + 40; y++) for (let x = sx - 44; x <= sx + 44; x++) {
      const d = Math.hypot(x - sx, y - sy), a = Math.atan2(y - sy, x - sx), rayo = Math.max(0, Math.sin(a * 9 + 0.5) * 0.6 + Math.sin(a * 5 - 1) * 0.5) ** 2;
      if (d < 12) g.set(x, y, d > 11 ? NADA[2] : d > 10 && a < -1.4 && a > -2.6 ? NADA[3] : NADA[0], NADA);
      else if (d < 13.2) g.set(x, y, a < -0.9 && a > -2.9 ? AZUR[4] : HU[4]);
      else if (d < 14.4) g.set(x, y, a < -0.6 && a > -3 ? AZUR[3] : MG[4]);
      else if (d < 15.6) g.set(x, y, MG[3]);
      else {
        const f = (1 - (d - 15) / 28) * (0.3 + rayo * 1.1) + Math.max(0, 1 - (d - 15) / 5) * 0.5;
        const k = tono(x, y, f * 4.2, 0.7);
        if (k >= 1) g.set(x, y, [NADA[3], NADA[4], MG[2], MG[3], MG[4]][lim(k - 1, 0, 4)]);
      }
    }
    // islas lejanas en silueta
    for (const [cx, cy, w, h, sem] of [[98, 44, 14, 7, 1], [136, 60, 10, 5, 2], [68, 12, 9, 4, 3], [234, 14, 11, 5, 4], [124, 26, 7, 3, 5], [216, 66, 12, 6, 6], [30, 70, 10, 5, 7]]) isla(g, cx, cy, w, h, sem, true);
    // cadenas que bajan del cielo hasta la isla grande
    for (const [x0, x1, y1] of [[36, 30, 28], [72, 66, 30]]) {
      for (let y = 0; y < y1; y++) {
        const x = Math.round(x0 + ((x1 - x0) * y) / y1 + Math.sin((y / y1) * Math.PI) * 2);
        if (y % 4 < 2) g.set(x, y, HI[2], HI).set(x + 1, y, HI[1], HI);
        else g.set(x - (y % 4 === 2 ? 0 : 0), y, HI[3], HI).set(x + 1, y, HI[1], HI).set(x, y, y % 4 === 3 ? HI[1] : HI[3], HI);
      }
    }
    // islas cercanas de obsidiana, con cristales debajo
    const grande = isla(g, 48, 32, 60, 22, 11, false);
    isla(g, 222, 48, 34, 14, 12, false);
    isla(g, 128, 14, 18, 8, 13, false);
    isla(g, 150, 74, 14, 6, 14, false);
    // en la isla grande: un templo roto y un chorro de luz que cae por su borde
    conBorde(g, NADA[0], tmp => {
      capa().poly([[40, 31], [40, 12], [43, 8], [46, 12], [46, 31]]).pintar(tmp, OBSIDIANA, { relieve: 2, max: 5 });
      for (const y of [14, 19, 24]) tmp.set(42, y, AZUR[3], AZUR).set(43, y, AZUR[4], AZUR).set(44, y, AZUR[2], AZUR);
      for (const [x, alto] of [[26, 14], [32, 9], [56, 11], [62, 16]]) {
        capa().rect(x, 31 - alto, 4, alto).pintar(tmp, OBSIDIANA, { relieve: 2, max: 5 });
        for (let k = 0; k < 4; k++) if (hash(k, x, 1) > 0.4) tmp.quitar(x + k, 31 - alto);
      }
      capa().rect(25, 15, 13, 2).pintar(tmp, OBSIDIANA, { relieve: 1, max: 4 });
      capa().rect(54, 12, 10, 2).pintar(tmp, OBSIDIANA, { relieve: 1, max: 4 });
    });
    for (let y = 33; y < 92; y++) {
      const f = (y - 33) / 59, x = Math.round(76 + Math.sin(y * 0.2) * 0.6 + f * 3);
      if (umbral(x, y) > 1 - f * 0.9) continue;
      g.set(x, y, f < 0.4 ? AZUR[4] : AZUR[3], AZUR);
      if (umbral(x + 1, y) > f) g.set(x + 1, y, AZUR[2], AZUR);
      if (umbral(x - 1, y) > f + 0.3) g.set(x - 1, y, AZUR[2], AZUR);
      CHORRO_AB.push([x, y]);
    }
    // agujas de obsidiana en el horizonte, en dos planos, y bruma violeta
    for (const [plano, base, alt, sem] of [[0, 92, 22, 4], [1, 97, 12, 9]]) {
      for (let x = 0; x < W; x++) {
        const k = Math.floor(x / 9), lx = x - k * 9, ancho = 3 + hash(k, sem, 1) * 5, alto = hash(k, sem, 2) > (plano ? 0.5 : 0.6) ? alt * (0.3 + hash(k, sem, 3) * 0.7) : 0;
        const aguja = Math.max(0, 1 - Math.abs(lx - 4.5) / ancho) * alto;
        const top = Math.round(base - Math.abs(Math.sin(x * 0.05 + sem)) * 4 - aguja);
        for (let y = top; y < 100; y++) {
          const lado = lx > 4.5 ? -1 : 1;
          let c = plano ? NADA[1] : y === top ? NADA[5] : lado > 0 && aguja > 2 ? NADA[4] : NADA[3];
          if (plano && y === top) c = NADA[3];
          if (!plano && y > base + 2) c = NADA[2];
          g.set(x, y, c, NADA);
        }
      }
    }
    velo(g, 0, 84, W, 16, (x, y) => (1 - Math.abs(y - 94) / 6) * (0.3 + 0.2 * Math.sin(x * 0.03 + 2)), MG[1]);
    // suelo de obsidiana cuarteada; las grietas más hondas brillan
    const yS = 99;
    const tes = teselas(220, 77, 0, yS, W, H - yS, 2.6, 60);
    const brillo = (x, y) => Math.max(0, 1 - Math.abs(x - sx) / (16 + (y - yS) * 0.9)) * 1.1;
    roca(g, tes, OBSIDIANA, (x, y) => 1.5 + ((y - yS) / 45) * 0.8 + brillo(x, y), () => [-0.4, -1, 1], { vari: 0.6, relieve: 1.3, bisel: 1.6, oscuro: 1.6, grieta: 0.5, s: 0.3 });
    for (let y = yS + 1; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, k = tes.id[i], k2 = tes.id2[i];
      if (k < 0 || tes.grupo[k] === tes.grupo[k2] || tes.borde[i] > 0.45) continue;
      const par = hash(Math.min(k, k2), Math.max(k, k2), 5), paso = y > 112 && y < 141 && x > 16 && x < 240;
      if (par > (paso ? 0.82 : 0.55)) g.set(x, y, paso ? (par > 0.95 ? MG[2] : MG[1]) : par > 0.85 ? AZUR[3] : par > 0.7 ? AZUR[2] : MG[2]);
    }
    for (let x = 0; x < W; x++) { g.set(x, yS, OBSIDIANA[0], OBSIDIANA); if (umbral(x, yS + 1) < 0.25) g.set(x, yS + 1, OBSIDIANA[4], OBSIDIANA); }
    // reflejo del sol negro en el suelo pulido
    for (let y = yS + 2; y < yS + 30; y += 2) {
      const f = 1 - (y - yS) / 30, ancho = Math.round((3 + hash(y, 3, 7) * 6) * f);
      const x0 = Math.round(sx - ancho + (hash(y, 4, 7) - 0.5) * 3);
      for (let x = x0; x <= x0 + ancho * 2; x++) g.set(x, y, Math.abs(x - sx) < ancho * 0.4 && f > 0.5 ? MG[3] : MG[2], MG);
    }
    // cristales que brotan en los bordes del suelo
    for (const [x, y, alto, lado] of [[6, 142, 16, 1], [13, 143, 9, 1], [1, 143, 7, -1], [20, 143, 5, 1], [246, 141, 18, -1], [238, 143, 10, -1], [253, 143, 7, 1], [231, 143, 5, -1], [48, 106, 7, 1], [54, 106, 4, 1], [206, 104, 8, -1], [200, 105, 4, -1], [118, 103, 4, 1]]) {
      conBorde(g, NADA[0], tmp => {
        capa().poly([[x - alto * 0.18 - 1, y], [x + lado * alto * 0.15, y - alto], [x + alto * 0.18 + 1, y]]).pintar(tmp, AZUR, { relieve: 2, min: 1, max: 3, luz: [-0.7, -0.5, 0.5] });
        for (let j = 1; j < alto * 0.7; j++) tmp.set(Math.round(x + lado * alto * 0.15 * (j / alto) - 0.5), y - j, AZUR[j < alto * 0.4 ? 3 : 4], AZUR);
      });
    }
    // piedras sueltas que flotan un palmo por encima del suelo, con su sombra
    for (const [x, y, r] of [[92, 104, 2], [168, 102, 1.6], [30, 112, 2.4], [226, 110, 2.2]]) {
      for (let i = -r - 1; i <= r + 1; i++) g.set(Math.round(x + i), Math.round(y + 5), OBSIDIANA[0], OBSIDIANA);
      conBorde(g, NADA[0], tmp => { capa().poly([[x - r * 1.6, y], [x, y - r], [x + r * 1.6, y], [x, y + r * 1.4]]).pintar(tmp, OBSIDIANA, { relieve: 1.5, min: 2, max: 5 }); tmp.set(Math.round(x), Math.round(y + r), AZUR[3], AZUR); });
    }
  }
  /* Isla de roca que flota: arriba casi plana, abajo un cono mellado con cristales. */
  function isla(g, cx, cy, w, h, sem, lejos) {
    const abajo = [];
    for (let k = 0; k <= 10; k++) {
      const f = k / 10;
      abajo.push([cx + w / 2 - f * w, cy + 1 + h * Math.pow(Math.sin(f * Math.PI), 1.4) * (0.7 + hash(k, sem, 2) * 0.55)]);
    }
    const c = capa().ell(cx, cy, w / 2, Math.max(1.2, w / 14)).poly([[cx + w / 2, cy], ...abajo, [cx - w / 2, cy]]);
    if (lejos) { cada(c, (x, y) => g.set(x, y, c.tiene(x, y - 1) ? (c.tiene(x - 1, y) ? NADA[3] : NADA[4]) : NADA[5], NADA)); return c; }
    const tes = teselas(Math.max(5, Math.round(w / 2.5)), sem, Math.floor(cx - w / 2) - 1, cy - 4, w + 3, h + 8, 1.2);
    roca(g, tes, OBSIDIANA, (x, y) => 3.2 - ((y - cy) / h) * 2.6, () => [-0.6, -0.8, 1], { masc: c, vari: 0.6, relieve: 1.4, bisel: 1.8, s: 0.3 });
    cada(c, (x, y) => {
      if (!c.tiene(x, y - 1)) g.set(x, y, umbral(x, y) < 0.5 ? MG[3] : OBSIDIANA[5]);
      else if (!c.tiene(x, y + 1) && hash(x, y, sem) > 0.6) g.set(x, y, AZUR[hash(x, sem) > 0.5 ? 3 : 2]);
      else if (!c.tiene(x - 1, y)) g.set(x, y, OBSIDIANA[4]);
    });
    contraluz(g, c, NADA[1], 0, 1);
    // cristales colgando debajo
    for (let k = 0; k < Math.max(2, w / 8); k++) {
      const x = Math.round(cx - w * 0.35 + hash(k, sem, 7) * w * 0.7);
      let y = cy; while (c.tiene(x, y + 1)) y++;
      const largo = 2 + Math.floor(hash(k, sem, 8) * (h * 0.4));
      for (let j = 1; j <= largo; j++) { g.set(x, y + j, AZUR[j === largo ? 4 : 3], AZUR); if (j < largo - 1) g.set(x + 1, y + j, AZUR[2], AZUR); }
    }
    return c;
  }
  function abismoAnim(ctx, t) {
    if (!ESTRELLAS_AB.length) abismo(new Rejilla(W, H));
    // las estrellas titilan (solo las que toca en este instante)
    let n = 0;
    for (let i = 0; i < ESTRELLAS_AB.length && n < 16; i++) {
      const [x, y, h] = ESTRELLAS_AB[i], p = ((t / 1000) * (0.15 + h * 0.2) + hash(i, 43)) % 1;
      if (p > 0.09) continue;
      n++;
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 1);
      if (p > 0.03 && p < 0.06 && h > 0.5) { ctx.fillStyle = h > 0.8 ? AZUR[3] : MG[3]; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); n++; }
    }
    // motas de sombra que suben despacio desde las grietas
    for (let i = 0; i < 14; i++) {
      const p = ((t / 1000) * (0.05 + hash(i, 44) * 0.05) + hash(i, 45)) % 1;
      if (p > 0.9) continue;
      const x = Math.round(hash(i, 46) * W + Math.sin(t / 900 + i * 2.3) * 3), y = Math.round(142 - p * 90);
      ctx.fillStyle = p < 0.3 ? AZUR[3] : p < 0.65 ? MG[3] : MG[2];
      ctx.fillRect(x, y, 1, 1);
    }
    // el chorro de luz de la isla
    for (let i = 0; i < 7; i++) {
      const p = ((t / 1000) * 0.35 + i / 7) % 1, [x, y] = CHORRO_AB[Math.floor(p * (CHORRO_AB.length - 1))];
      ctx.fillStyle = p < 0.5 ? HU[4] : AZUR[4]; ctx.fillRect(x, y, 1, 2);
    }
    // la corona del sol negro late y gira
    const v = Math.sin(t / 900), [sx, sy] = SOL_NEGRO;
    if (v > 0.2) {
      ctx.fillStyle = v > 0.75 ? AZUR[4] : MG[4];
      for (let a = 0; a < 6.283; a += 0.42) ctx.fillRect(Math.round(sx + Math.cos(a + t / 4000) * 16), Math.round(sy + Math.sin(a + t / 4000) * 16), 1, 1);
    }
  }


  /* ======================================================================
     El nido de las arañas: cueva de telarañas gruesas, capullos y setas que brillan.
     ====================================================================== */
  const ROCA_NIDO = ["#08090c", "#121519", "#1c2125", "#283033", "#384443", "#52645c"];
  const SEDA = ["#3b3e47", "#6a6e78", "#9a9ea6", "#c8ccd0"];
  const SETAS_N = [[20, 106, ESPECTRO, 1.2], [46, 103, MG, 0.8], [214, 104, ESPECTRO, 0.9], [240, 107, MG, 1.3], [12, 142, MG, 1.1], [246, 143, ESPECTRO, 1.1], [176, 68, ESPECTRO, 0.6], [70, 74, MG, 0.55]];
  const TUNEL = [128, 66, 30, 26];
  const luzNido = (x, y) => lim(SETAS_N.reduce((v, [sx, sy, , k]) => v + Math.max(0, 1 - Math.hypot((x - sx) / (40 * k), (y - sy) / (30 * k))) ** 1.6, 0));
  const GOTA_N = [160, 18];
  const HILO_N = [96, 0];
  const ESPORAS_N = [];
  const haciaArriba = () => [0, 1, 1];
  function nido(g) {
    ESPORAS_N.length = 0;
    g.rect(0, 0, W, H, ROCA_NIDO[0]);
    const [tx, ty, trx, try_] = TUNEL;
    const tes = teselas(140, 33, 0, 0, W, 102, 1.4, 24);
    roca(g, tes, ROCA_NIDO, (x, y) => 1.4 + luzNido(x, y) * 3.2 - Math.max(0, 14 - y) * 0.06 - Math.max(0, 1 - Math.hypot((x - tx) / 50, (y - ty) / 40)) * 0.7, haciaArriba, { vari: 0.7, relieve: 1.4, bisel: 2.2, oscuro: 1.5 });
    // la boca del túnel por donde salen las arañas
    const tunel = capa().ell(tx, ty, trx, try_).quitarRect(0, 100, W, 50);
    cada(tunel, (x, y) => { const d = Math.hypot((x - tx) / trx, (y - ty) / try_); g.set(x, y, ROCA_NIDO[lim(tono(x, y, d * 2.6 - 0.9, 0.8), 0, 2)], ROCA_NIDO); });
    contraluz(g, tunel, ROCA_NIDO[4], 0, -1);
    contraluz(g, tunel, ROCA_NIDO[3], -1, 0);
    // dos ojos que brillan al fondo del túnel
    for (const [x, y] of [[122, 76], [126, 75], [131, 75], [135, 76]]) g.set(x, y, R.sangre[4]).set(x + 1, y, R.sangre[3]);
    estalactitas(g, [[10, 5, 18], [34, 4, 11], [58, 4, 16], [84, 3, 9], [104, 3, 12], [150, 4, 14], [168, 3, 8], [196, 5, 18], [222, 4, 12], [244, 5, 20]], 0, ROCA_NIDO, (x, y) => luzNido(x, y + 40), haciaArriba);
    // racimo de huevos pegado a la pared, a la derecha
    conBorde(g, ROCA_NIDO[0], tmp => {
      for (const [x, y, r] of [[200, 60, 3.4], [206, 58, 3], [211, 62, 3.6], [203, 66, 3.2], [209, 68, 2.8], [196, 66, 2.6], [215, 56, 2.4], [214, 68, 2.4]]) {
        capa().ell(x, y, r, r * 1.1).pintar(tmp, ["#3a3a2c", "#6a6a4e", "#a4a47a", "#d2d2a8", "#f4f4d8"], { relieve: r, separar: 1 });
      }
    });
    // velo de seda roto delante del túnel
    tela(g, tx, ty - 2, 30, 0, 6.283 * 11 / 12, 14, 5, [ROCA_NIDO[3], SEDA[1], SEDA[2]], 4, 0.3);
    // telarañas gruesas en las esquinas de arriba
    tela(g, -3, -3, 62, 0.18, Math.PI / 2 - 0.18, 9, 6, SEDA, 1, 0, true);
    tela(g, 259, -3, 56, Math.PI / 2 + 0.18, Math.PI - 0.18, 8, 5, SEDA, 2, 0.1, true);
    // hilos colgantes que cruzan el techo
    for (const [x0, y0, x1, y1, comba] of [[40, 8, 100, 4, 10], [150, 6, 214, 10, 12], [96, 2, 160, 2, 8]]) {
      for (let s = 0; s <= 1; s += 1 / 120) {
        const x = x0 + (x1 - x0) * s, y = y0 + (y1 - y0) * s + Math.sin(s * Math.PI) * comba;
        g.set(Math.round(x), Math.round(y), SEDA[2]).set(Math.round(x), Math.round(y) + 1, SEDA[0]);
      }
    }
    // capullos colgados con presas envueltas
    capullo(g, 62, 0, 22, 16, 1);
    capullo(g, 82, 4, 18, 11, 2);
    capullo(g, 186, 0, 26, 20, 3, true);
    capullo(g, 168, 6, 18, 10, 4);
    capullo(g, 230, 18, 34, 13, 5);
    // setas que brillan y su halo sobre la roca
    for (const [sx, sy, ram, k] of SETAS_N) {
      const r = 24 * k;
      for (let j = -r; j < r * 0.6; j++) for (let i = -r; i <= r; i++) {
        const d = Math.hypot(i, j * 1.3), x = Math.round(sx + i), y = Math.round(sy + j);
        if (d < r && ROCA_NIDO.includes(g.get(x, y)) && umbral(x, y) < (1 - d / r) * 0.75) g.set(x, y, d < r * 0.3 ? ram[3] : d < r * 0.6 ? ram[2] : ram[1]);
      }
    }
    // suelo de roca con hilos sueltos y polvo
    const yS = 101;
    for (let y = yS; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 1.6 + luzNido(x, y) * 2.2 - (y - yS) * 0.01 + (fbm(x / 12, y / 4, 55) - 0.5) * 1.1 + (hash(x, y, 56) > 0.975 ? -1 : 0);
      g.set(x, y, ROCA_NIDO[lim(tono(x, y, v, 0.4), 0, 5)], ROCA_NIDO);
    }
    for (let x = 0; x < W; x++) g.set(x, yS, ROCA_NIDO[1], ROCA_NIDO);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(i, 51) * W), y = yS + 3 + Math.floor(hash(i, 52) * 40);
      g.set(x, y, ROCA_NIDO[4], ROCA_NIDO).set(x + 1, y, ROCA_NIDO[3], ROCA_NIDO).set(x, y + 1, ROCA_NIDO[1], ROCA_NIDO);
    }
    // telarañas a ras de suelo, en las esquinas de delante
    tela(g, -3, 147, 34, -Math.PI / 2 + 0.15, -0.15, 6, 4, SEDA, 3, 0, true);
    tela(g, 259, 147, 30, Math.PI + 0.15, Math.PI * 1.5 - 0.15, 6, 4, SEDA, 5, 0, true);
    for (const [x0, y0, x1, y1] of [[60, 104, 92, 107], [160, 106, 190, 103], [0, 116, 18, 113], [236, 118, 256, 114], [110, 103, 128, 104]]) {
      for (let s = 0; s <= 1; s += 1 / 40) g.set(Math.round(x0 + (x1 - x0) * s), Math.round(y0 + (y1 - y0) * s + Math.sin(s * Math.PI) * 2), SEDA[1]);
    }
    // huesos de los que no salieron y un escudo enredado en seda
    calavera(g, 198, 96, HU, -1);
    hueso(g, 206, 101, 218, 98);
    calavera(g, 30, 126, HU, 1);
    hueso(g, 40, 132, 52, 130);
    hueso(g, 92, 100, 102, 102);
    conBorde(g, ROCA_NIDO[0], tmp => { escudo(tmp, 64, 98, R.tela.oliva); });
    for (let k = 0; k < 6; k++) trazo(g, 56 + k * 3, 92, 60 + k * 2, 106, SEDA[1]);
    // las setas
    for (const [sx, sy, ram, k] of SETAS_N) grupoSetas(g, sx, sy, ram, k);
    for (let i = 0; i < 18; i++) ESPORAS_N.push(SETAS_N[i % SETAS_N.length]);
  }
  /* Telaraña: radios desde (x, y) entre los ángulos a0 y a1 y vueltas combadas hacia el centro;
     gruesa = hilos con sombra debajo; hueco = parte de hilos rotos. */
  function tela(g, x, y, r, a0, a1, radios, vueltas, cols, sem = 1, hueco = 0, gruesa = false) {
    const cerrada = a1 - a0 > 6, ang = k => a0 + ((a1 - a0) * k) / (cerrada ? radios : radios - 1);
    const pon = (px, py, c) => { g.set(px, py, c); if (gruesa && !SEDA.includes(g.get(px, py + 1))) g.set(px, py + 1, cols[0]); };
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const d = Math.hypot(i, j), a = (Math.atan2(j, i) + 6.283) % 6.283;
      const dentro = cerrada || (a >= ((a0 + 6.283) % 6.283) - 0.01 && a <= ((a0 + 6.283) % 6.283) + (a1 - a0) + 0.01);
      if (dentro && d < r * 0.38 && umbral(x + i, y + j) < (1 - d / (r * 0.38)) * 0.6) g.set(x + i, y + j, cols[0]);
    }
    for (let k = 0; k < radios; k++) {
      if (hash(k, 99, sem) < hueco * 0.5) continue;
      for (let s = 0; s <= r; s += 0.5) pon(Math.round(x + Math.cos(ang(k)) * s), Math.round(y + Math.sin(ang(k)) * s), cols[s < r * 0.55 ? cols.length - 1 : cols.length - 2]);
    }
    for (let v = 1; v <= vueltas; v++) {
      const rr = (r * v) / (vueltas + 0.3);
      for (let k = 0; k < (cerrada ? radios : radios - 1); k++) {
        if (hash(k, v, sem) < hueco) continue;
        const p0 = [x + Math.cos(ang(k)) * rr, y + Math.sin(ang(k)) * rr], p1 = [x + Math.cos(ang(k + 1)) * rr, y + Math.sin(ang(k + 1)) * rr];
        const n = Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1])) + 1;
        for (let s = 0; s <= n; s++) {
          const f = s / n, comba = Math.sin(f * Math.PI) * rr * 0.12, mx = p0[0] + (p1[0] - p0[0]) * f, my = p0[1] + (p1[1] - p0[1]) * f;
          const dx = x - mx, dy = y - my, dl = Math.hypot(dx, dy) || 1;
          pon(Math.round(mx + (dx / dl) * comba), Math.round(my + (dy / dl) * comba), cols[rr < r * 0.5 ? cols.length - 1 : cols.length - 2]);
        }
      }
    }
  }
  /* Capullo de seda colgado de un hilo; mano = asoma la mano huesuda de la presa. */
  function capullo(g, x, y0, y, largo, sem, mano = false) {
    for (let j = y0; j < y; j++) g.set(x, j, SEDA[2]);
    conBorde(g, ROCA_NIDO[0], tmp => {
      const ancho = Math.max(2.5, largo * 0.32);
      const c = capa().ell(x, y + largo * 0.42, ancho, largo * 0.42).ell(x, y + largo * 0.75, ancho * 0.75, largo * 0.25).poly([[x - 1.5, y + largo * 0.9], [x, y + largo + 2], [x + 1.5, y + largo * 0.9]]);
      c.pintar(tmp, HU, { relieve: 3, max: 3, min: 1 });
      // vueltas de la seda, en diagonal
      cada(c, (px, py) => {
        const banda = (((py - y) * 1 + (px - x) * 0.7 + sem * 3) % 4 + 4) % 4;
        if (banda < 1) matiz(tmp, px, py, -1); else if (banda < 2 && px <= x) matiz(tmp, px, py, 1);
      });
      for (let j = 0; j < 3; j++) trazo(tmp, x - ancho + 1, Math.round(y + largo * (0.25 + j * 0.25)), x + ancho - 1, Math.round(y + largo * (0.32 + j * 0.25)), HU[4]);
      if (mano) {
        const mx = x - Math.round(ancho) - 1, my = Math.round(y + largo * 0.55);
        capa().rect(mx - 3, my, 4, 1).pintar(tmp, HU, { plano: 3 });
        for (const [a, b] of [[-4, -1], [-5, -1], [-4, 1], [-5, 1], [-4, 0], [-6, 0]]) tmp.set(mx + a, my + b, HU[a === -6 ? 4 : 3], HU);
      }
    });
  }
  /* Grupo de setas: una grande y varias pequeñas, con sombrero abombado, láminas y pie claro. */
  function grupoSetas(g, x, y, ram, k) {
    const az = azar(x * 31 + y), pie = ram === MG ? ["#3a2a40", "#6a5070", "#a688a8", "#d8c0d4", "#f6e8f2"] : ["#24343a", "#4a6a6a", "#86aaa0", "#c0dcd0", "#eefcf4"];
    conBorde(g, ROCA_NIDO[0], tmp => {
      const lista = [[-7 * k, 5 * k, 3.4 * k], [8 * k, 4 * k, 2.8 * k], [12 * k, 2.2 * k, 1.8 * k], [0, 9 * k, 5.6 * k], [-11 * k, 2.4 * k, 1.8 * k], [4 * k, 2 * k, 1.6 * k]];
      for (const [dx, alto, r] of lista) {
        const sx = Math.round(x + dx), top = Math.round(y - alto - r * 0.5), ancho = Math.max(1, Math.round(r * 0.45));
        capa().rect(sx - Math.floor(ancho / 2), top, ancho, y - top + 1).ell(sx, y, ancho * 0.8, 0.8).pintar(tmp, pie, { relieve: 1.2, min: 1, luz: [-0.9, -0.2, 0.5] });
        const som = capa().ell(sx, top, r, r * 0.72).quitarRect(0, Math.round(top + r * 0.2) + 1, W, 30);
        som.pintar(tmp, ram, { relieve: Math.max(1.5, r * 0.7), min: 1, luz: [-0.5, -0.8, 0.4] });
        const yL = Math.round(top + r * 0.2) + 1;
        for (let i = Math.round(sx - r + 1); i <= Math.round(sx + r - 1); i++) tmp.set(i, yL, (i & 1) ? ram[1] : ram[0], ram);
        for (let i = 0; i < r * 1.2; i++) {
          const px = Math.round(sx + (az() - 0.5) * r * 1.4), py = Math.round(top - az() * r * 0.5);
          if (som.tiene(px, py) && som.tiene(px + 1, py)) tmp.set(px, py, ram === MG ? HU[4] : ram[4]);
        }
      }
    });
  }
  function nidoAnim(ctx, t) {
    if (!ESPORAS_N.length) nido(new Rejilla(W, H));
    // una araña baja y sube por su hilo, que se mece
    const [hx] = HILO_N, largo = Math.round(34 + Math.sin(t / 2100) * 16), mece = Math.sin(t / 900) * 2;
    ctx.fillStyle = SEDA[2];
    for (let j = 0; j < largo; j += 3) ctx.fillRect(Math.round(hx + (mece * j) / largo), j, 1, 3);
    const ax = Math.round(hx + mece), pata = Math.floor(t / 180) % 2, ay = largo;
    ctx.fillStyle = NE[0]; ctx.fillRect(ax - 2, ay, 5, 4); ctx.fillRect(ax - 1, ay + 4, 3, 3);
    ctx.fillStyle = SO[3];
    for (const [lx, dy] of [[-5, 0], [4, 0], [-5, 3], [4, 3]]) ctx.fillRect(ax + lx, ay + dy + (pata ^ (lx < 0 ? 1 : 0)), 2, 1);
    ctx.fillRect(ax - 4, ay + 1, 1, 2); ctx.fillRect(ax + 4, ay + 1, 1, 2);
    ctx.fillStyle = R.sangre[4]; ctx.fillRect(ax - 1, ay + 5, 1, 1); ctx.fillRect(ax + 1, ay + 5, 1, 1);
    ctx.fillStyle = SO[4]; ctx.fillRect(ax - 1, ay + 1, 1, 1);
    // gota que cae de una estalactita
    const [gx, gy] = GOTA_N, p = (t / 2600) % 1, caida = 101 - gy;
    ctx.fillStyle = CRISTAL[3];
    if (p < 0.55) ctx.fillRect(gx, gy, 1, p > 0.3 ? 2 : 1);
    else if (p < 0.8) { const y = Math.round(gy + ((p - 0.55) / 0.25) ** 2 * caida); ctx.fillRect(gx, y, 1, 2); }
    else if (p < 0.88) { ctx.fillStyle = CRISTAL[4]; ctx.fillRect(gx - 1, gy + caida, 1, 1); ctx.fillRect(gx + 1, gy + caida, 1, 1); ctx.fillRect(gx, gy + caida - 1, 1, 1); }
    // esporas que suben de las setas
    ESPORAS_N.forEach(([sx, sy, ram, k], i) => {
      const q = ((t / 1000) * (0.08 + hash(i, 81) * 0.06) + hash(i, 82)) % 1;
      if (q > 0.85) return;
      const x = Math.round(sx + (hash(i, 83) - 0.5) * 16 * k + Math.sin(q * 8 + i) * 3), y = Math.round(sy - 6 * k - q * 40);
      ctx.fillStyle = q < 0.4 ? ram[4] : ram[3]; ctx.fillRect(x, y, 1, 1);
    });
    // los ojos del túnel parpadean
    if ((t / 1000) % 5 < 0.15) { ctx.fillStyle = ROCA_NIDO[0]; ctx.fillRect(122, 75, 15, 2); }
  }

  window.FONDOS_HD = window.FONDOS_HD || {};
  Object.assign(window.FONDOS_HD, {
    pico: { base: pico, anim: picoAnim },
    guarida: { base: guarida, anim: guaridaAnim },
    abismo: { base: abismo, anim: abismoAnim },
    telarana: { base: nido, anim: nidoAnim }
  });
})();
