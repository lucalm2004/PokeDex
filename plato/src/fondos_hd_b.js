/* Dados y Mazmorras · escenarios HD, segunda tanda (256×144): el sótano de la taberna, la cripta del liche,
   las minas enanas, la gran forja, el salón del castillo del vampiro y la sala del trono de Varkhul.
   Cada entrada { base(g), anim(ctx, t) } funciona como en fondos.js: base pinta el fondo fijo en una
   Rejilla de 256×144 y anim dibuja encima, en cada fotograma, los detalles que se mueven (t en milisegundos).
   El muro se junta con el suelo en y = 96; los personajes pisan entre y≈118 y 140
   (héroes a la izquierda, enemigos a la derecha), así que esa franja queda tranquila y legible. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, azar } = PX;
  const W = 256, H = 144, HZ = 96;
  const capa = () => new Capa(W, H);
  const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const M = R.madera, F = R.fuego, B = R.bronce, P = R.piedra, HU = R.hueso, SO = R.sombra, HI = R.hierro, MA = R.mar, MG = R.magia;
  const TE = R.tela.terracota, NE = R.tela.negro, AZ = R.tela.azul, GR = R.tela.granate, OC = R.tela.ocre;

  /* Rampas propias, en el mismo tono apagado que los escenarios antiguos. */
  const GRIS = ["#15161b", "#25272e", "#3b3e47", "#5a5e68", "#868a92"];        // piedra fría de mazmorra
  const CENIZA = ["#0f0c0c", "#1f1918", "#342b28", "#4f433e", "#776860"];      // roca volcánica y hollín
  const BRASA = ["#170908", "#30100c", "#561a10", "#8a2a12", "#c4461a"];       // roca al rojo
  const ESPECTRO = ["#0b1618", "#122e2d", "#1f5450", "#3b8a7a", "#8cd6ba"];    // luz fantasmal
  const CRISTAL = ["#10182e", "#1c3566", "#2f62a8", "#5ea0dc", "#bfe6ff"];     // cristales de la mina
  const VERDIN = ["#0b1513", "#13261f", "#1e3d33", "#2f5e4e", "#4f8c74"];      // piedra bañada de luz verde
  const CALIDO = ["#1a1411", "#2e241d", "#4c3c30", "#715a46", "#9e8062"];      // piedra a la luz de una vela
  const ROJIZO = ["#160b0d", "#28141a", "#40222a", "#5e343c", "#86505a"];      // piedra teñida por la vidriera roja
  const LUNAR = ["#0f141f", "#18223a", "#263756", "#3b5579", "#62809f"];       // piedra a la luz de la luna
  const ANTIGUA = ["#0b100f", "#152020", "#22322f", "#36493f", "#55695a"];     // sillares viejos de la mazmorra
  const VIDRIO = ["#081210", "#11241b", "#1d3b2a", "#346246", "#79b088"];      // botellas verdes
  const VINO = ["#12070a", "#2a0e14", "#4a1822", "#743040", "#a8606e"];        // botellas de tinto
  const NOCHE = ["#06080f", "#0c1222", "#152038", "#22355a", "#3a5582", "#6a88b4"];
  const LOSA_N = ["#0f1016", "#1a1c24", "#2a2d38", "#3e4250", "#5a5f70"];      // mármol negro pulido
  const LOSA_R = ["#120a0c", "#201216", "#311b20", "#47262c", "#64363c"];      // mármol granate
  const SOT = [GRIS[0], GRIS[1], GRIS[2], P[3], HU[1], HU[2]];                // piedra del sótano que se calienta con la luz
  const TIERRA = [CENIZA[0], CENIZA[1], M[0], M[1], P[2], M[2], P[3]];        // roca y tierra de la mina
  const FORJA = [CENIZA[0], CENIZA[1], CENIZA[2], CENIZA[3], BRASA[3], TE[3]]; // piedra al calor de la forja
  const CALOR = ["#160b08", "#2c140e", "#4a2216", "#6e341e", "#9c4a22", "#d0742f"];     // piedra encendida por la lava

  /* ---------- Herramientas ---------- */
  /* Azar sin estado: un valor fijo en [0, 1) para cada trío de enteros. */
  function hash(i, j, s = 0) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  /* Tono con tramado ordenado; s = anchura del tramado entre dos tonos. */
  const tono = (x, y, v, s = 1) => Math.floor(v + 0.5 + (umbral(x, y) - 0.5) * s);
  const pon = (g, x, y, ram, v, s = 0.3) => g.set(x, y, ram[lim(tono(x, y, v, s), 0, ram.length - 1)], ram);
  /* Foco de luz elíptico: 1 en el centro, 0 en el borde. */
  const foco = (x, y, lx, ly, rx, ry, p = 1.5) => { const d = 1 - Math.hypot((x - lx) / rx, (y - ly) / ry); return d > 0 ? d ** p : 0; };
  /* Probabilidad tramada con transición corta: evita que dos rampas se mezclen en sal y pimienta. */
  const paso = (p, c = 0.4, k = 3) => lim((p - c) * k + 0.5);
  /* Viñeta: oscurece las esquinas para centrar la mirada (en tonos). */
  const vin = (x, y) => { const d = Math.hypot((x - 128) / 150, (y - 76) / 100); return d > 0.6 ? (d - 0.6) * 3.2 : 0; };
  /* Altura de un arco apuntado (dos arcos de círculo) en u = |x - centro| / semiancho, de 1 (clave) a 0 (arranque). */
  const ojiva = u => Math.sqrt(Math.max(0, 4 - (1 + Math.min(1, u)) ** 2)) / Math.sqrt(3);
  function capaOjiva(cx, hw, top, ys, yb) {
    const c = capa();
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
      const y0 = Math.round(ys - (ys - top) * ojiva(Math.abs(x - cx) / hw));
      c.rect(x, y0, 1, yb - y0);
    }
    return c;
  }
  function rellenar(g, x0, y0, w, h, ram, f, s = 1, masc = null) {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      if (masc && !masc.tiene(x, y)) continue;
      const v = f(x, y);
      if (v === null || v === undefined) continue;
      const rm = typeof ram === "function" ? ram(x, y) : ram;
      pon(g, x, y, rm, v, s);
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
  function plantilla(g, filas, x, y, colores, espejo = false) {
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        const c = colores[fila[i]];
        if (c) g.set(espejo ? x + fila.length - 1 - i : x + i, y + j, c);
      }
    });
  }
  /* Índice color → [rampa, tono] para retocar lo ya pintado. */
  function indice(rams) {
    const m = new Map();
    rams.forEach(r => r.forEach((c, i) => { if (!m.has(c)) m.set(c, [r, i]); }));
    return m;
  }
  /* Aclara u oscurece lo ya pintado: cada color sube f(x, y) tonos dentro de su propia rampa. */
  function aclarar(g, x0, y0, w, h, rams, f, s = 1) {
    const idx = indice(rams);
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const e = idx.get(g.get(x, y));
      if (!e) continue;
      const d = f(x, y);
      if (!d) continue;
      const [r, i] = e, k = lim(tono(x, y, i + d, s), 0, r.length - 1);
      if (k !== i) g.set(x, y, r[k], r);
    }
  }
  /* Tiñe lo ya pintado: con probabilidad f(x, y), tramada, cambia cada tono de 'de' por el mismo tono de 'a'. */
  function tenir(g, x0, y0, w, h, de, a, f) {
    const idx = new Map(); de.forEach((c, i) => idx.set(c, i));
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const i = idx.get(g.get(x, y));
      if (i === undefined) continue;
      const p = f(x, y);
      if (p > 0 && umbral(x + 1, y + 2) < p) g.set(x, y, a[Math.min(i, a.length - 1)], a);
    }
  }

  /* Sillería: filas de bloques escalonados con bisel (luz desde arriba a la izquierda).
     ram puede ser una rampa o una función (x, y) → rampa, para teñir la piedra según la luz que le llega. */
  function sillares(g, x0, y0, x1, filas, ram, tonoEn, op = {}) {
    const az = azar(op.sem || 1), an = op.ancho || 16, bis = op.bisel ?? 0.7, RA = typeof ram === "function" ? ram : () => ram;
    let y = y0;
    for (const alto of filas) {
      let x = x0 - Math.floor(az() * an);
      while (x < x1) {
        const w = Math.max(4, Math.round(an * (0.65 + az() * 0.7))), vb = (az() - 0.5) * (op.vari ?? 0.6), sb = Math.floor(az() * 9999);
        for (let j = 0; j < alto; j++) for (let i = 0; i < w; i++) {
          const px = x + i, py = y + j;
          if (px < x0 || px >= x1 || py < 0 || py >= H || (op.masc && !op.masc.tiene(px, py))) continue;
          let v = tonoEn(px, py);
          if (v === null) continue;
          if (j === alto - 1 || i === w - 1) v -= op.junta ?? 1.6;
          else {
            v += vb;
            if (j === 0) v += bis; else if (j === alto - 2) v -= bis * 0.6;
            if (i === 0) v += bis * 0.4; else if (i === w - 2) v -= bis * 0.3;
            const hz = hash(px, py, sb);
            if (hz < (op.picado ?? 0.045)) v -= 0.9; else if (hz > 0.985) v += 0.6;
          }
          const rm = RA(px, py);
          g.set(px, py, rm[lim(tono(px, py, v, op.s ?? 0.3), 0, rm.length - 1)], rm);
        }
        x += w;
      }
      y += alto;
    }
    return g;
  }
  /* Teselas de Voronoi (roca): para cada píxel, la celda más cercana, la vecina y la distancia al borde. */
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
    const id = new Int16Array(W * H).fill(-1), id2 = new Int16Array(W * H).fill(-1), borde = new Float32Array(W * H);
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      let d1 = 1e9, d2 = 1e9, k = -1, k2 = -1;
      for (let i = 0; i < n; i++) {
        const dx = x - pts[i][0], dy = (y - pts[i][1]) * ay, d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; k2 = k; d1 = d; k = i; } else if (d < d2) { d2 = d; k2 = i; }
      }
      const sep = Math.hypot(pts[k][0] - pts[k2][0], (pts[k][1] - pts[k2][1]) * ay) || 1;
      id[y * W + x] = k; id2[y * W + x] = k2; borde[y * W + x] = (d2 - d1) / (2 * sep);
    }
    return { pts, id, id2, borde, grupo };
  }
  /* Roca facetada: base(x, y) da el tono, haciaLuz(x, y) = [lx, ly, fuerza] apunta a la luz. */
  function roca(g, tes, ram, base, haciaLuz, op = {}) {
    const vari = op.vari ?? 0.7, bisel = op.bisel ?? 2, relieve = op.relieve ?? 1.2, s = op.s ?? 0.3, RA = typeof ram === "function" ? ram : () => ram;
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
      if (hash(x, y, 3) < 0.03) v -= 0.8;
      const rm = RA(x, y);
      g.set(x, y, rm[lim(tono(x, y, v, s), 0, rm.length - 1)], rm);
    }
    return g;
  }
  /* Enlosado en perspectiva: filas cada vez más altas hacia delante, juntas que convergen hacia (vx, yh).
     op.ram2 = segunda rampa para un ajedrezado; op.motas = probabilidad de picaduras. */
  function losas(g, y0, filas, ancho, vx, yh, ram, tonoEn, sem, junta, op = {}) {
    const az = azar(sem), RA = typeof ram === "function" ? ram : () => ram;
    const col = (x, esc, off) => Math.floor((vx + (x - vx) / esc + off) / ancho);
    let ya = y0;
    filas.forEach((alto, f) => {
      const off = az() * ancho, vari = Array.from({ length: 64 }, () => (az() - 0.5) * (op.vari ?? 0.7));
      for (let y = ya; y < ya + alto && y < H; y++) {
        const esc = (y - yh) / (H - yh);
        for (let x = 0; x < W; x++) {
          const k = col(x, esc, off), k1 = col(x + 1, esc, off);
          if (y === ya || k1 !== k) { g.set(x, y, typeof junta === "function" ? junta(x, y) : junta); continue; }
          let rm = RA(x, y);
          if (op.ram2 && (k + f) % 2) rm = typeof op.ram2 === "function" ? op.ram2(x, y) : op.ram2;
          let v = tonoEn(x, y, k, f) + vari[((k % 64) + 64) % 64];
          if (y === ya + 1) v += 0.5;
          else if (y === ya + alto - 1) v -= 0.25;
          if (col(x - 1, esc, off) !== k) v += 0.35;
          else if (col(x + 2, esc, off) !== k) v -= 0.3;
          const hz = hash(x, y, sem);
          if (hz < (op.motas ?? 0.05)) v -= 0.8; else if (hz > 0.975) v += 0.6;
          g.set(x, y, rm[lim(tono(x, y, v, op.s ?? 0.35), 0, rm.length - 1)], rm);
        }
      }
      ya += alto;
    });
  }
  /* Madero con veta: horizontal (viga) o vertical (poste); luzF(x, y) ∈ [0, 1] lo ilumina. */
  function viga(g, x0, y0, w, h, luzF, op = {}) {
    const vert = !!op.vertical, ram = op.ram || M, n = ram.length - 1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = x0 + i, y = y0 + j, a = vert ? i : j, L = vert ? w : h;
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      let v = a === 0 ? 3 : a === L - 1 ? 0.4 : 2.1 - (a / L) * 1.1;
      v += (luzF ? luzF(x, y) : 0.5) * 1.6 - 0.7 + (op.sesgo || 0);
      const veta = vert ? hash(x, Math.floor(y / 7), 7) : hash(Math.floor(x / 7), y, 7);
      if (a > 0 && a < L - 1 && veta < 0.14) v -= 0.8;
      if (a > 0 && a < L - 1 && hash(x, y, 8) < 0.02) v -= 1;
      g.set(x, y, ram[lim(tono(x, y, v, 0.35), 0, n)], ram);
    }
  }
  /* Columna o pilar con estrías, capitel y basa; ramEn(x, y) da la rampa (para teñirla de luz). */
  function columna(g, x0, w, y0, y1, ramEn, luzF, op = {}) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x0 + w; x++) {
      const t = (x - x0 + 0.5) / w;
      let v = 2.6 - t * 2 + luzF(x, y) * 1.5 + (op.sesgo || 0);
      if (x === x0) v += 0.5; else if (x === x0 + w - 1) v -= 0.7;
      else if ((x - x0) % 3 === 0) v -= 0.55;
      pon(g, x, y, ramEn(x, y), v, 0.3);
    }
    const molduras = [[y0, 5], [y1 - 6, 6]];
    for (const [yy, hh] of molduras) for (let j = 0; j < hh; j++) for (let x = x0 - 2; x < x0 + w + 2; x++) {
      const t = (x - x0 + 2) / (w + 4), filete = j === 0 || j === hh - 1 || j === 2;
      let v = (filete ? 3.2 : 1.6) - t * 1.4 + luzF(x, yy + j) * 1.3 + (j === hh - 1 ? -1 : 0) + (op.sesgo || 0);
      if (x === x0 - 2) v += 0.4; else if (x === x0 + w + 1) v -= 0.6;
      pon(g, x, yy + j, ramEn(x, yy + j), v, 0.3);
    }
  }
  /* Telaraña en una esquina: hilos radiales y arcos colgantes (dx, dy dan hacia dónde se abre). */
  function telarana(g, x, y, r, dx, dy, ram = [GRIS[3], GRIS[4]]) {
    const hilos = 6;
    for (let k = 0; k < hilos; k++) {
      const a = (k / (hilos - 1)) * (Math.PI / 2);
      for (let s = 1; s < r; s++) if (s % 2 || k % 2) g.set(Math.round(x + dx * Math.cos(a) * s), Math.round(y + dy * Math.sin(a) * s), ram[s > r * 0.6 ? 0 : 1]);
    }
    for (const f of [0.3, 0.52, 0.74, 0.94]) {
      for (let k = 0; k < hilos - 1; k++) {
        const a0 = (k / (hilos - 1)) * (Math.PI / 2), a1 = ((k + 1) / (hilos - 1)) * (Math.PI / 2);
        for (let s = 0; s <= 5; s++) {
          const a = a0 + ((a1 - a0) * s) / 5, comba = Math.sin((s / 5) * Math.PI) * r * f * 0.08;
          g.set(Math.round(x + dx * (Math.cos(a) * r * f - comba * 0.5)), Math.round(y + dy * (Math.sin(a) * r * f - comba)), ram[0]);
        }
      }
    }
  }
  function cadena(g, x, y0, largo, ram = HI) {
    for (let j = 0; j < largo; j++) {
      if (j % 4 < 2) g.set(x - 1, y0 + j, ram[2]).set(x + 1, y0 + j, ram[1]);
      else g.set(x, y0 + j, ram[3]);
    }
  }
  /* Vela de cera; la llama se dibuja en la animación (justo encima de la mecha, en y - alto - 1). */
  function vela(g, x, y, alto, gorda = false) {
    for (let j = 0; j < alto; j++) {
      g.set(x, y - j, HU[j === alto - 1 ? 4 : 3]);
      if (gorda) g.set(x + 1, y - j, HU[j === alto - 1 ? 3 : 2]);
    }
    if (alto > 2) g.set(x - 1, y, HU[2]).set(x + (gorda ? 2 : 1), y, HU[1]);
    if (alto > 4) g.set(x + (gorda ? 2 : 1), y - alto + 2, HU[2]);
    g.set(x, y - alto, NE[1]);
  }
  /* Llama de vela: 3 o 4 rectángulos. (x, y) es la base de la llama. */
  function llama(ctx, x, y, t, fase = 0, chica = false, ram = F) {
    const a = Math.sin(t / 77 + fase) + Math.sin(t / 131 + fase * 1.7);
    const alto = (chica ? 3 : 4) + (a > 1 ? 1 : a < -1.1 ? -1 : 0);
    ctx.fillStyle = ram[2]; ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = ram[3]; ctx.fillRect(x, y - alto + 1, 1, alto - 1);
    if (!chica) { const l = Math.sin(t / 190 + fase); if (l > 0.55 || l < -0.55) ctx.fillRect(x + (l > 0 ? 1 : -1), y - alto + 2, 1, 1); }
    ctx.fillStyle = ram[4]; ctx.fillRect(x, y - 1, 1, 1);
  }
  /* Fuego de varias lenguas, tres rectángulos por lengua (exterior, núcleo y corazón). */
  function hoguera(ctx, cx, by, ancho, alto, t, fase = 0, ram = F, sep = 5) {
    const n = Math.max(2, Math.round(ancho / sep));
    for (let i = 0; i < n; i++) {
      const f = fase + i * 1.9, centro = 1 - Math.abs(i - (n - 1) / 2) / n;
      const hh = Math.max(2, Math.round(alto * centro * (0.55 + 0.45 * Math.abs(Math.sin(t / 110 + f) * Math.sin(t / 73 + f * 1.3) + 0.3))));
      const x = Math.round(cx - ancho / 2 + (i + 0.5) * (ancho / n)) + (Math.sin(t / 150 + f) > 0.6 ? 1 : 0);
      const h1 = Math.max(1, Math.round(hh * 0.6));
      ctx.fillStyle = ram[2]; ctx.fillRect(x - 1, by - h1, 3, h1 + 1);
      ctx.fillStyle = ram[3]; ctx.fillRect(x, by - hh, 1, hh + 1);
      ctx.fillStyle = ram[4]; ctx.fillRect(x, by - Math.round(hh * 0.3), 1, Math.round(hh * 0.3) + 1);
    }
  }
  /* Farol de hierro con cristales encendidos; y0 es la anilla de arriba. */
  function farol(g, cx, y0) {
    conBorde(g, NE[0], tmp => {
      tmp.set(cx, y0, HI[3], HI).set(cx - 1, y0 + 1, HI[3], HI).set(cx + 1, y0 + 1, HI[1], HI);
      for (let i = -1; i <= 1; i++) tmp.set(cx + i, y0 + 2, HI[i < 1 ? 3 : 2], HI);
      for (let i = -2; i <= 2; i++) tmp.set(cx + i, y0 + 3, HI[i < 0 ? 3 : 2], HI);
      for (let i = -3; i <= 3; i++) tmp.set(cx + i, y0 + 4, HI[i < -1 ? 4 : i < 2 ? 3 : 1], HI);
      for (let j = 5; j <= 11; j++) for (let i = -3; i <= 3; i++) {
        const marco = Math.abs(i) === 3;
        tmp.set(cx + i, y0 + j, marco ? HI[i < 0 ? 2 : 1] : j > 9 ? F[3] : Math.abs(i) === 2 ? OC[3] : OC[4], marco ? HI : OC);
      }
      for (let j = 5; j <= 11; j++) tmp.set(cx, y0 + j, j > 7 ? F[4] : OC[4], F);
      for (let i = -3; i <= 3; i++) tmp.set(cx + i, y0 + 12, HI[i < 0 ? 3 : 1], HI);
      for (let i = -2; i <= 2; i++) tmp.set(cx + i, y0 + 13, HI[1], HI);
      tmp.set(cx, y0 + 14, HI[1], HI);
    });
  }
  function llamaFarol(ctx, cx, y0, t, fase = 0) {
    const a = Math.sin(t / 90 + fase) + Math.sin(t / 157 + fase * 2.3);
    ctx.fillStyle = a > 0.6 ? F[4] : a < -0.6 ? F[2] : F[3];
    ctx.fillRect(cx - 1, y0 + 9, 3, 2);
    ctx.fillStyle = a > -0.2 ? HU[4] : OC[4];
    ctx.fillRect(cx, y0 + (a > 0.9 ? 6 : 7), 1, a > 0.9 ? 4 : 3);
  }
  /* Calavera de 7×7 (mira de frente; desplazada si mira a un lado). */
  const CRANEO = ["  aab  ", " aaabb ", "aaabbbc", "a##b##c", "abb#bbc", " bcccc ", " c c c "];
  function craneo(g, x, y, ram = HU, espejo = false) {
    plantilla(g, CRANEO, x, y, { a: ram[3], b: ram[2], c: ram[1], "#": SO[0] }, espejo);
  }
  /* Hueso largo tumbado, con sus cabezas. */
  function hueso(g, x0, y0, x1, y1, ram = HU) {
    capa().linea(x0, y0, x1, y1, 1).pintar(g, ram, { plano: 2 });
    for (const [x, y] of [[x0, y0], [x1, y1]]) g.set(x, y - 1, ram[3]).set(x, y + 1, ram[1]).set(x, y, ram[3]);
  }
  /* Barrica tumbada vista de frente: tapa de tablas, aros de hierro, chaflán y espita. */
  function barrica(g, cx, cy, r, op = {}) {
    conBorde(g, M[0], tmp => {
      const c = capa().ell(cx, cy, r, r);
      c.pintar(tmp, M, { relieve: r * 0.6, sesgo: op.sesgo || 0, max: op.max ?? 4 });
      cada(c, (x, y) => { if ((x - Math.round(cx) + 60) % 4 === 0 && Math.hypot(x - cx, y - cy) < r - 2.5) tmp.set(x, y, M[1], M); });
      for (let a = 0; a < 6.283; a += 0.025) {
        const luz = Math.cos(a + 2.36), px = (rr, col, ram) => tmp.set(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), col, ram);
        px(r - 0.4, HI[luz > 0.3 ? 3 : luz > -0.4 ? 2 : 1], HI);
        px(r - 1.4, HI[luz > 0.5 ? 2 : 1], HI);
        px(r - 2.6, M[luz > 0 ? 1 : 3 + (op.max === 2 ? -1 : 0)], M);
      }
      if (op.espita) tmp.set(Math.round(cx), Math.round(cy + r * 0.5), B[3], B).set(Math.round(cx), Math.round(cy + r * 0.5) + 1, B[1], B).set(Math.round(cx) + 1, Math.round(cy + r * 0.5), B[2], B);
      if (op.marca) for (const [i, j] of [[-2, -2], [-1, -1], [0, 0], [1, -1], [2, -2]]) tmp.set(Math.round(cx) + i, Math.round(cy - r * 0.3) + j, HU[3], HU);
    });
  }
  /* Cajón de madera con refuerzo en aspa. */
  function cajon(g, x, y, w, h, sesgo = 0) {
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, w, h).pintar(tmp, M, { relieve: 1.5, sesgo, max: 3 });
      for (let i = 0; i < w; i++) { tmp.set(x + i, y, M[3], M); tmp.set(x + i, y + 1, M[2], M); tmp.set(x + i, y + h - 1, M[1], M); }
      for (let j = 0; j < h; j++) { tmp.set(x, y + j, M[3], M); tmp.set(x + 1, y + j, M[2], M); tmp.set(x + w - 1, y + j, M[1], M); tmp.set(x + w - 2, y + j, M[1], M); }
      cada(capa().linea(x + 2, y + h - 3, x + w - 3, y + 2, 2), (px, py) => tmp.set(px, py, M[2], M));
      cada(capa().linea(x + 2, y + h - 4, x + w - 4, y + 2, 1), (px, py) => tmp.set(px, py, M[3], M));
      for (const [i, j] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) tmp.set(x + i, y + j, HI[3], HI);
    });
  }
  /* Murciélago pequeño (5 rectángulos). */
  function murcielago(ctx, x, y, t, col = SO[0]) {
    const ala = Math.floor(t / 110) % 2;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 2, 2);
    ctx.fillRect(x - 2, y - ala, 2, 1); ctx.fillRect(x + 2, y - ala, 2, 1);
    ctx.fillRect(x - 3, y + 1 - ala * 2, 1, 1); ctx.fillRect(x + 4, y + 1 - ala * 2, 1, 1);
  }
  /* Motas de polvo que flotan; dentro(x, y) devuelve la intensidad de luz (las motas solo se ven en la luz). */
  function motas(ctx, t, n, x0, y0, w, h, cols, dentro, sem = 1, vel = 1) {
    for (let i = 0; i < n; i++) {
      const f = (t / 1000) * vel * (0.04 + hash(i, sem, 1) * 0.05) + hash(i, sem, 2);
      const x = Math.round(x0 + ((hash(i, sem, 3) * w + Math.sin(t / 1300 + i * 2.1) * 4) % w));
      const y = Math.round(y0 + ((f * h) % h));
      const v = dentro ? dentro(x, y) : 1;
      if (v < 0.25 || Math.sin(t / 600 + i * 1.7) < -0.3) continue;
      ctx.fillStyle = v > 0.6 ? cols[1] : cols[0];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  /* =====================================================================
     El sótano de la taberna: barricas, botellero y la vieja entrada a la mazmorra
     ===================================================================== */
  const FAROL_SOT = [139, 36];          // anilla del farol, que cuelga de la viga
  const VELA_SOT = [9, 79, 4];          // vela sobre el cajón, bajo la escalera
  const PUERTA_SOT = [227, 54];         // arco de la mazmorra (centro y arranque)
  const hazSot = (x, y) => { const d = x - 8 - y * 0.7, a = 1 - Math.abs(d - 13) / (15 + y * 0.12); return a > 0 ? Math.min(1, a * 1.5) * Math.max(0, 1 - y / 170) : 0; };
  const luzSot = (x, y) => lim(foco(x, y, FAROL_SOT[0], FAROL_SOT[1] + 10, 120, 86, 1.25) * 0.8 + foco(x, y, FAROL_SOT[0], FAROL_SOT[1] + 9, 44, 38, 1.6) * 0.5 + hazSot(x, y) * 1.05 + foco(x, y, 20, 0, 60, 50, 1.6) * 0.5 + foco(x, y, 9, 72, 22, 18, 1.6) * 0.5);
  function sotano(g) {
    g.rect(0, 0, W, H, GRIS[0]);
    sillares(g, 0, 12, W, [7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7], SOT, (x, y) => 0.5 + luzSot(x, y) * 3.7 - vin(x, y), { sem: 21, ancho: 17, bisel: 0.7, junta: 1.3, vari: 0.6 });
    // regueros de humedad bajo la viga y salitre al pie del muro
    const regueros = Array.from({ length: 16 }, (_, i) => [Math.floor(hash(i, 1, 41) * W), 2 + Math.floor(hash(i, 2, 41) * 3), 10 + Math.floor(hash(i, 3, 41) * 34)]);
    aclarar(g, 0, 12, W, 85, [SOT], (x, y) => {
      let d = 0;
      for (const [rx, rw, rl] of regueros) if (x >= rx && x < rx + rw && y < 12 + rl * (1 - (x - rx) * 0.1)) d -= 0.7;
      if (y > 84) d += ((y - 84) / 12) * (0.5 + 0.5 * Math.sin(x * 0.13 + Math.sin(x * 0.05) * 2)) * 0.9;
      return d;
    });
    // techo: las tablas del suelo de la taberna, vistas desde abajo
    for (let y = 0; y < 5; y++) for (let x = 0; x < W; x++) pon(g, x, y, M, (x % 21 === 0 ? 0 : 1.2) + luzSot(x, 14) * 1.3 - (y === 4 ? 0.8 : 0) - vin(x, y + 20) * 0.5);
    // la trampilla abierta: luz cálida de la taberna
    for (let y = 0; y < 5; y++) for (let x = 4; x < 36; x++) g.set(x, y, tono(x, y, 3.5 - y * 0.3 - Math.abs(x - 20) * 0.03, 0.9) > 3 ? OC[4] : OC[3], OC);
    for (let y = 0; y < 5; y++) { g.set(3, y, M[1]); g.set(36, y, M[0]); }
    // la viga maestra, apoyada en una ménsula de piedra
    viga(g, 46, 5, W - 46, 7, luzSot);
    capa().poly([[44, 12], [54, 12], [52, 16], [46, 17]]).pintar(g, SOT, { relieve: 1.5, max: 4, separar: 1 });
    for (let x = 46; x < W; x++) g.set(x, 12, GRIS[0]);
    // la tapa de la trampilla, colgando de sus bisagras
    conBorde(g, M[0], tmp => {
      capa().poly([[36, 1], [41, 1], [44, 22], [39, 23]]).pintar(tmp, M, { relieve: 1.5, sesgo: 0.15, max: 3 });
      for (const y of [4, 17]) tmp.set(37 + Math.round(y * 0.13), y, HI[3], HI).set(38 + Math.round(y * 0.13), y, HI[2], HI).set(39 + Math.round(y * 0.13), y, HI[1], HI);
    });
    escaleraSot(g);
    bovedaSot(g);
    // pilar central, del que cuelga el farol
    const pilar = capa().rect(130, 13, 20, HZ - 13);
    sillares(g, 130, 13, 150, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], SOT, (x, y) => 1 + luzSot(x, y) * 3.2 + (x < 132 ? 0.7 : x > 147 ? -0.9 : 0), { sem: 8, ancho: 10, bisel: 0.7, junta: 1.2, masc: pilar });
    aclarar(g, 150, 13, 5, HZ - 13, [SOT], (x) => -(1.4 - (x - 150) * 0.28));
    capa().ell(136, 94, 3.5, 3.2).quitarRect(0, 96, W, 10).pintar(g, SO, { plano: 0 });
    botellero(g);
    entradaMazmorra(g);
    // la cadena del farol
    cadena(g, FAROL_SOT[0], 13, FAROL_SOT[1] - 13);
    farol(g, FAROL_SOT[0], FAROL_SOT[1]);
    // suelo de losas húmedas
    losas(g, HZ, [4, 5, 6, 7, 8, 9, 9], 22, 128, -80, SOT, (x, y) => 0.9 + luzSot(x, y - 26) * 2.8 - vin(x, y) * 0.9, 33, GRIS[0]);
    for (let x = 0; x < W; x++) aclarar(g, x, HZ + 1, 1, 2, [SOT], () => -0.8);
    // charco bajo la gotera, con el reflejo del farol
    const charco = capa().ell(146, 109, 15, 2.6).ell(136, 110, 7, 1.8);
    cada(charco, (x, y) => g.set(x, y, (x * 3 + y * 5) % 7 === 0 ? GRIS[3] : y < 109 ? GRIS[1] : GRIS[2]));
    for (const [x, y, c] of [[139, 108, OC[4]], [139, 109, F[3]], [138, 110, OC[3]], [140, 110, OC[3]], [139, 111, F[2]], [152, 109, GRIS[3]], [131, 110, GRIS[3]]]) g.set(x, y, c);
    // paja suelta junto a la escalera y las barricas
    for (let i = 0; i < 18; i++) {
      const x = Math.round(30 + hash(i, 1, 51) * 100), y = Math.round(98 + hash(i, 2, 51) * 14), l = 2 + Math.floor(hash(i, 3, 51) * 3), dir = hash(i, 4, 51) > 0.5 ? 1 : -1;
      for (let k = 0; k < l; k++) g.set(x + k, y + (k === l - 1 ? dir : 0), k ? M[3] : OC[2]);
    }
    // el cajón con la vela, bajo la escalera
    cajon(g, 0, 80, 17, 17, -0.2);
    vela(g, VELA_SOT[0], VELA_SOT[1], VELA_SOT[2], true);
    // cascotes caídos del boquete
    for (const [x, y, rx, ry] of [[201, 99, 4, 2.5], [208, 102, 3, 2], [215, 98, 2.5, 1.6], [196, 104, 2, 1.4], [246, 100, 3.5, 2.2], [238, 103, 2, 1.4], [252, 104, 3, 2]])
      conBorde(g, GRIS[0], tmp => capa().ell(x, y, rx, ry).pintar(tmp, ANTIGUA, { relieve: 1.5, sesgo: -0.15 }));
    telarana(g, 255, 13, 18, -1, 1);
    telarana(g, 54, 13, 10, 1, 1);
  }
  /* Escalera de madera que baja desde la trampilla. */
  function escaleraSot(g) {
    capa().linea(0, 22, 70, 98, 4).pintar(g, M, { relieve: 1.5, max: 2, separar: 1 });
    for (let i = 0; i < 9; i++) {
      const x = Math.round(1 + i * 7.6), y = Math.round(10 + i * 9.6);
      capa().rect(x, y, 13, 3).pintar(g, M, { relieve: 1, sesgo: 0.25 - i * 0.06, separar: 1 });
      for (let k = 0; k < 13; k++) g.set(x + k, y, M[lim(Math.round(2.6 + hazSot(x + k, y) * 1.6 - i * 0.08), 2, 4)]);
      for (let k = 1; k < 12; k++) g.set(x + k, y + 3, M[0]);
    }
    capa().linea(14, -4, 82, 72, 2).pintar(g, M, { relieve: 1, max: 3, separar: 1 });
    for (const x of [26, 48, 70]) {
      const yr = Math.round(-4 + (x - 14) * (76 / 68)), ys = Math.round(22 + x * (76 / 70));
      capa().rect(x, yr + 1, 2, ys - yr - 1).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
    }
  }
  /* Bóveda de cañón abierta en el muro, con barricas apiladas sobre su poyo. */
  function bovedaSot(g) {
    const x0 = 70, x1 = 125, cx = 97.5, r = 27, ys = 52;
    const hueco = capa().rect(x0, ys, x1 - x0, HZ - ys).ell(cx, ys, r - 0.5, r * 0.92);
    cada(hueco, (x, y) => {
      const fila = Math.floor((y - 20) / 4), sx = x + (fila % 2) * 4;
      const junta = (y - 20) % 4 === 3 || sx % 8 === 7;
      pon(g, x, y, SOT, 0.35 + luzSot(x, y) * 1.5 - (junta ? 0.9 : 0) + (hash(Math.floor(sx / 8), fila, 3) - 0.5) * 0.5 - (y < ys ? (ys - y) * 0.01 : 0));
    });
    const anillo = capa().ell(cx, ys, r + 5, (r + 5) * 0.92).rect(x0 - 5, ys, x1 - x0 + 10, HZ - ys).restar(hueco);
    cada(anillo, (x, y) => {
      const dy = (y - ys) / 0.92, a = Math.atan2(Math.min(0, dy), x - cx);
      const junta = y < ys ? ((((a + Math.PI) / Math.PI) * 13) % 1) < 0.1 : (y - ys) % 7 === 6;
      let v = 1.2 + luzSot(x, y) * 3 - (junta ? 1.4 : 0);
      if (hueco.tiene(x + 1, y) || hueco.tiene(x - 1, y) || hueco.tiene(x, y + 1)) v += 0.8;
      else if (!anillo.tiene(x, y - 1) || !anillo.tiene(x - 1, y)) v += 0.5;
      else if (!anillo.tiene(x + 1, y)) v -= 0.6;
      pon(g, x, y, SOT, v);
    });
    // poyo y calzos de madera
    viga(g, x0 + 1, 90, x1 - x0 - 2, 6, luzSot);
    const luzB = x => -0.55 + luzSot(x, 70) * 0.8;
    for (let k = 0; k < 3; k++) barrica(g, 80 + k * 17.5, 81, 8.6, { sesgo: luzB(80 + k * 17.5), max: 3, marca: k === 1 });
    for (let k = 0; k < 2; k++) barrica(g, 89 + k * 17.5, 65, 8.6, { sesgo: luzB(89 + k * 17.5) - 0.1, max: 3, espita: k === 0 });
    barrica(g, 97.5, 50, 6.4, { sesgo: luzB(97) - 0.2, max: 3 });
    for (const x of [74, 120]) capa().poly([[x - 2, 90], [x + 2, 90], [x + 1, 86]]).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
  }
  /* Botellero de madera con botellas, jarras y un queso; sacos de harina debajo. */
  function botellero(g) {
    for (const x of [157, 194]) viga(g, x, 30, 4, HZ - 30, luzSot, { vertical: true });
    for (const y of [44, 62, 80]) viga(g, 155, y, 45, 3, luzSot);
    // botellas tumbadas en pirámide sobre las dos baldas bajas
    for (const yb of [62, 80]) {
      for (let fila = 0; fila < 3; fila++) for (let k = 0; k < 6 - fila; k++) {
        const x = 164 + k * 5 + fila * 2.5, y = yb - 3 - fila * 4.4, ram = hash(k, fila + yb, 61) > 0.35 ? VIDRIO : VINO;
        if (x > 192) continue;
        conBorde(g, NE[0], tmp => {
          const c = capa().ell(x, y, 2, 2);
          cada(c, (px, py) => tmp.set(px, py, ram[c.tiene(px - 1, py) && c.tiene(px, py - 1) && c.tiene(px + 1, py) && c.tiene(px, py + 1) ? 0 : 1], ram));
          const rx = Math.round(x), ry = Math.round(y);
          tmp.set(rx - 1, ry - 1, ram[luzSot(x, y) > 0.55 ? 4 : 3], ram).set(rx - 1, ry, ram[2], ram).set(rx, ry - 1, ram[2], ram);
        });
      }
    }
    // jarras de barro y un queso en la balda alta
    for (const [x, h] of [[163, 9], [171, 7]]) conBorde(g, NE[0], tmp => {
      capa().ell(x, 44 - h / 2, 3.2, h / 2).rect(x - 1, 44 - h - 2, 3, 3).pintar(tmp, TE, { relieve: 2, max: 3, sesgo: -0.1 });
      tmp.set(x - 2, 44 - h - 2, TE[3], TE).set(x + 2, 44 - h - 2, TE[1], TE);
    });
    conBorde(g, NE[0], tmp => {
      capa().ell(184, 40, 7, 3.5).pintar(tmp, OC, { relieve: 2, max: 3, sesgo: -0.2 });
      for (let i = -5; i <= 5; i++) tmp.set(184 + i, 38, OC[3], OC);
    });
    // sacos de harina al pie
    for (const [x, rx, ry] of [[167, 7, 7], [181, 6, 8.5]]) conBorde(g, NE[0], tmp => {
      capa().ell(x, HZ + 2 - ry, rx, ry).ell(x, HZ - 2 * ry + 1, 2.5, 2).pintar(tmp, HU, { relieve: 3, max: 2, sesgo: -0.3 + luzSot(x, 88) * 0.3 });
      for (let i = -2; i <= 2; i++) tmp.set(x + i, HZ - 2 * ry + 2, TE[2], TE);
    });
  }
  /* El boquete en la pared que deja ver un arco mucho más antiguo: la bajada a la mazmorra. */
  function entradaMazmorra(g) {
    const [cx, ys] = PUERTA_SOT, hw = 16, top = 34, vx = cx, vy = 72;
    // 1) el boquete: detrás del sótano asoma la sillería antigua
    const boquete = capa();
    for (let y = 14; y < HZ; y++) {
      const xl = 194 + Math.round(Math.sin(y * 0.41) * 2 + hash(0, y >> 1, 9) * 4);
      boquete.rect(xl, y, W - xl, 1);
    }
    for (let x = 188; x < W; x++) boquete.quitarRect(x, 0, 1, 18 + Math.round(hash(x >> 1, 1, 9) * 4 + Math.sin(x * 0.23) * 2));
    sillares(g, 188, 10, W, [8, 9, 8, 9, 8, 9, 8, 9, 9, 9], ANTIGUA, (x, y) => 0.9 + luzSot(x, y) * 1.5 - vin(x, y) * 0.6 + (hash(x >> 2, y >> 2, 4) < 0.2 ? 0.7 : 0), { sem: 31, ancho: 13, bisel: 0.8, junta: 1.4, masc: boquete });
    // bordes rotos del muro del sótano: cara iluminada arriba, sombra hacia el hueco
    for (let y = 12; y < HZ; y++) for (let x = 186; x < W; x++) {
      if (boquete.tiene(x, y)) continue;
      if (boquete.tiene(x + 1, y) || boquete.tiene(x, y + 1)) g.set(x, y, SOT[4], SOT);
      else if (boquete.tiene(x + 2, y) || boquete.tiene(x, y + 2)) g.set(x, y, SOT[3], SOT);
    }
    for (let y = 12; y < HZ; y++) for (let x = 186; x < W; x++) if (boquete.tiene(x, y) && (!boquete.tiene(x - 1, y) || !boquete.tiene(x, y - 1) || !boquete.tiene(x - 2, y))) g.set(x, y, ANTIGUA[0], ANTIGUA);
    // 2) el túnel: anillos que se alejan y escalones que bajan a la oscuridad
    const hueco = capaOjiva(cx, hw, top, ys, HZ);
    cada(hueco, (x, y) => g.set(x, y, SO[0], SO));
    for (let k = 0; k < 7; k++) {
      const s = Math.pow(0.8, k), baja = k * 1.6;
      const sx = x => vx + (x - vx) * s, sy = y => vy + (y - vy) * s + baja;
      const anillo = capaOjiva(sx(cx), hw * s, sy(top), sy(ys), Math.round(sy(HZ)));
      const dentro = capaOjiva(sx(cx), hw * s * 0.8, sy(top) + 3 * s, sy(ys), Math.round(sy(HZ)));
      anillo.restar(dentro).recortar(hueco);
      const v0 = 2.6 - k * 0.42;
      cada(anillo, (x, y) => pon(g, x, y, ANTIGUA, v0 + (x < sx(cx) ? 0.5 : -0.3) - (y > sy(HZ) - 3 * s ? 0.2 : 0), 0.6));
      // peldaño
      const yb = Math.round(sy(HZ)), xa = Math.round(sx(cx - hw)), xb = Math.round(sx(cx + hw));
      for (let x = xa; x <= xb; x++) if (hueco.tiene(x, yb - 1)) { g.set(x, yb - 1, ANTIGUA[lim(Math.round(3.6 - k * 0.5), 0, 4)], ANTIGUA); g.set(x, yb, SO[0], SO); }
    }
    // 3) el arco antiguo: dovelas, jambas y una calavera en la clave
    const exterior = capaOjiva(cx, hw + 7, top - 8, ys, HZ).restar(hueco);
    cada(exterior, (x, y) => {
      const a = Math.atan2(y - ys, x - cx), seg = y < ys ? (((a + Math.PI) / Math.PI) * 11) % 1 : ((y - ys) % 8) / 8;
      let v = 1.7 + luzSot(x, y) * 1.6 - (seg < 0.1 ? 1.5 : 0) + (hash(x >> 1, y >> 1, 7) - 0.5) * 0.6;
      if (hueco.tiene(x + 1, y) || hueco.tiene(x, y + 1) || hueco.tiene(x - 1, y)) v += x < cx ? 1 : 0.2;
      else if (!exterior.tiene(x, y - 1) || !exterior.tiene(x - 1, y)) v += 0.8;
      else if (!exterior.tiene(x + 1, y)) v -= 0.8;
      if (hash(x, y, 77) < 0.09 && y > 60) v = 3.6;             // musgo y liquen en las jambas
      pon(g, x, y, ANTIGUA, v);
    });
    craneo(g, cx - 3, top - 7, ANTIGUA);
    for (const dx of [-11, 11]) for (let j = 0; j < 3; j++) g.set(cx + dx, top + 4 + j * 3, ANTIGUA[4], ANTIGUA);
    // 4) la reja de hierro, abierta hacia nosotros sobre su gozne
    for (let i = 0; i < 6; i++) {
      const x = 245 + i * 2, y0 = Math.round(40 - i * 0.9), y1 = Math.round(HZ + 2 + i * 0.4);
      for (let y = y0; y <= y1; y++) g.set(x, y, (y + i) % 9 === 0 ? TE[1] : i === 0 ? HI[3] : HI[1], HI);
      if (i < 5) for (const yy of [y0 + 1, Math.round((y0 + y1) / 2), y1 - 2]) g.set(x + 1, yy, HI[2], HI);
      g.set(x, y0 - 1, HI[3], HI);
    }
  }
  function sotanoAnim(ctx, t) {
    llamaFarol(ctx, FAROL_SOT[0], FAROL_SOT[1], t);
    llama(ctx, VELA_SOT[0], VELA_SOT[1] - VELA_SOT[2] - 1, t, 1.3);
    // polvo que flota en el haz de la trampilla
    motas(ctx, t, 16, 0, 6, 100, 90, [OC[3], OC[4]], hazSot, 3);
    // una gotera que cae de la viga al charco
    const p = (t % 2900) / 2900;
    if (p < 0.42) { ctx.fillStyle = GRIS[4]; ctx.fillRect(147, Math.round(13 + (p / 0.42) ** 2 * 95), 1, 2); }
    else if (p < 0.75) {
      const r = Math.round(1 + ((p - 0.42) / 0.33) * 6);
      ctx.fillStyle = p < 0.6 ? GRIS[4] : GRIS[3];
      ctx.fillRect(147 - r, 109, 1, 1); ctx.fillRect(147 + r, 109, 1, 1);
      if (p < 0.5) ctx.fillRect(147, 107, 1, 1);
    }
    // ojos de la rata en su agujero, y otros más rojos al fondo de la mazmorra
    const c = (t / 1000) % 11;
    if (c > 2 && c < 4.6 && Math.floor(t / 170) % 11) { ctx.fillStyle = F[3]; ctx.fillRect(134, 93, 1, 1); ctx.fillRect(137, 93, 1, 1); }
    if (c > 7 && c < 9.5 && Math.floor(t / 210) % 9) { ctx.fillStyle = BRASA[4]; ctx.fillRect(225, 78, 1, 1); ctx.fillRect(228, 78, 1, 1); }
    // aire frío que sale de la mazmorra
    for (let i = 0; i < 5; i++) {
      const q = ((t / 1000) * 0.07 + hash(i, 5, 3)) % 1, vis = Math.sin(q * Math.PI);
      if (vis < 0.25) continue;
      const x = Math.round(240 - q * 70), y = 93 + (i % 3) * 3 + Math.round(Math.sin(t / 900 + i)), l = 6 + (i % 3) * 3;
      ctx.fillStyle = vis > 0.7 ? ANTIGUA[4] : ANTIGUA[3];
      ctx.fillRect(x, y, l, 1); ctx.fillRect(x + 2, y - 1, Math.max(2, l - 5), 1);
    }
  }

  /* =====================================================================
     La cripta del liche: osarios, sarcófagos, velas y el sello verde
     ===================================================================== */
  const PUERTA_CRI = [128, 66];
  const BRASEROS_CRI = [[100, 74], [156, 74]];
  /* Velas: [x, base, alto]. Las de los sarcófagos y unas cuantas por el suelo. */
  const VELAS_CRI = [[17, 79, 5], [21, 79, 3], [74, 79, 4], [182, 79, 4], [236, 79, 5], [240, 79, 3], [83, 101, 4], [87, 102, 2], [168, 101, 3], [172, 102, 5]];
  const verdeCri = (x, y) => lim(foco(x, y, PUERTA_CRI[0], PUERTA_CRI[1], 78, 66, 1.3) + BRASEROS_CRI.reduce((v, [bx, by]) => v + foco(x, y, bx, by - 8, 42, 38, 1.5) * 0.7, 0));
  const calorCri = (x, y) => lim(VELAS_CRI.reduce((v, [vx, vy, a]) => v + foco(x, y, vx, vy - a - 2, 24, 20, 1.7) * 0.8, 0));
  const ramCri = (x, y) => (umbral(x + 2, y + 1) < paso(verdeCri(x, y), 0.34) ? VERDIN : umbral(x + 1, y + 3) < paso(calorCri(x, y), 0.3) ? CALIDO : GRIS);
  const luzCri = (x, y) => verdeCri(x, y) * 1.1 + calorCri(x, y);
  const runasCri = [];
  function cripta(g) {
    runasCri.length = 0;
    g.rect(0, 0, W, H, GRIS[0]);
    sillares(g, 0, 0, W, [7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 7], ramCri, (x, y) => 0.4 + luzCri(x, y) * 2.2 - vin(x, y), { sem: 3, ancho: 14, bisel: 0.6, junta: 1.4, vari: 0.5 });
    // bóveda de crucería: tres tramos apuntados con sus nervios
    for (let x = 0; x < W; x++) {
      const [a, b] = x < 90 ? [-2, 90] : x < 166 ? [90, 166] : [166, 258];
      const c = (a + b) / 2, hw = (b - a) / 2, u = Math.abs(x - c) / hw, y = Math.round(27 - 23 * ojiva(u));
      for (let j = 0; j < y; j++) pon(g, x, j, ramCri(x, j), 0.5 + luzCri(x, j) * 1.2 - ((j + Math.round(u * 5)) % 5 === 0 ? 0.8 : 0) - (j < 3 ? 0.4 : 0));
      pon(g, x, y, ramCri(x, y), 3.2 + luzCri(x, y));
      pon(g, x, y + 1, ramCri(x, y + 1), 2 + luzCri(x, y));
      g.set(x, y + 2, GRIS[0]);
    }
    for (const x of [44, 128, 212]) { capa().ell(x, 4, 3, 2.5).pintar(g, GRIS, { relieve: 1.5 }); g.set(x - 1, 4, SO[0]).set(x + 1, 4, SO[0]); }
    // osarios: tres filas de nichos con calaveras a cada lado
    for (const x0 of [8, 172]) for (const y of [29, 45, 61]) for (let i = 0; i < 6; i++) nichoCri(g, x0 + i * 13, y, i * 7 + y + x0);
    // pilares de haces de columnas
    for (const x of [86, 162]) columna(g, x, 9, 24, 97, ramCri, (px, py) => luzCri(px, py));
    for (const x of [-4, 251]) columna(g, x, 9, 24, 97, ramCri, (px, py) => luzCri(px, py));
    puertaCri(g);
    sarcofagoCri(g, 14, 78);
    sarcofagoCri(g, 178, 242);
    for (const [bx, by] of BRASEROS_CRI) braseroCri(g, bx, by);
    // cadenas con grilletes que cuelgan de la bóveda
    for (const [x, l] of [[44, 18], [212, 14], [60, 9]]) { cadena(g, x, 7, l); g.set(x - 1, 7 + l, HI[2]).set(x + 1, 7 + l, HI[1]).set(x, 8 + l, HI[2]).set(x - 2, 6 + l, HI[1]); }
    telarana(g, 7, 27, 12, 1, -1);
    telarana(g, 85, 27, 12, -1, -1);
    telarana(g, 249, 27, 12, -1, -1);
    // suelo de losas con niebla verde, polvo y huesos
    losas(g, HZ, [4, 5, 6, 7, 8, 9, 9], 22, 128, -80, ramCri, (x, y) => 0.95 + luzCri(x, y - 22) * 1.6 - vin(x, y), 23, GRIS[0]);
    aclarar(g, 0, HZ + 1, W, 16, [GRIS, VERDIN, CALIDO], (x, y) => (1 - (y - HZ) / 16) * (0.35 + 0.35 * Math.sin(x * 0.06 + Math.sin(x * 0.17))) * (0.5 + verdeCri(x, 90)));
    tenir(g, 60, HZ, 136, 20, GRIS, VERDIN, (x, y) => verdeCri(x, y - 10) * (1 - (y - HZ) / 20));
    // escalinata ante la puerta
    for (const [x0, x1, y0] of [[98, 158, 95], [104, 152, 92]]) for (let x = x0; x < x1; x++) for (let y = y0; y < y0 + 3 + (y0 === 95 ? 1 : 0); y++) {
      const borde = x === x0 || x === x1 - 1;
      pon(g, x, y, VERDIN, (y === y0 ? 3.4 : 1.6) + verdeCri(x, y) * 0.8 - (borde ? 0.8 : 0) - (y === y0 + 3 ? 1 : 0));
    }
    for (let x = 98; x < 158; x++) g.set(x, 99, SO[0]);
    craneo(g, 232, 104, HU);
    hueso(g, 222, 108, 230, 106);
    hueso(g, 18, 107, 28, 110);
    hueso(g, 34, 103, 39, 101);
    craneo(g, 6, 101, HU, true);
    // urna rota
    conBorde(g, GRIS[0], tmp => {
      capa().ell(247, 102, 4, 3.4).rect(245, 97, 5, 2).pintar(tmp, P, { relieve: 2, max: 3, sesgo: -0.2 });
      capa().ell(241, 104, 2, 1.2).pintar(tmp, P, { relieve: 1, max: 2 });
    });
    for (const [x, y, alto] of VELAS_CRI) vela(g, x, y, alto, alto > 3);
  }
  function nichoCri(g, x, y, sem) {
    for (let j = 0; j < 13; j++) for (let i = 0; i < 11; i++) {
      const px = x + i, py = y + j;
      if (j === 12) pon(g, px, py, ramCri(px, py), 3.2 + luzCri(px, py));
      else if (j === 0) pon(g, px, py, ramCri(px, py), 1);
      else g.set(px, py, j < 4 || i === 0 ? SO[0] : i < 3 ? GRIS[0] : (i + j) % 5 === 0 ? GRIS[1] : GRIS[0]);
    }
    const r = hash(sem, 1, 11), ram = verdeCri(x, y) > 0.35 ? [VERDIN[1], VERDIN[2], VERDIN[3], HU[3]] : HU;
    if (r < 0.62) craneo(g, x + 2, y + 5, ram, hash(sem, 2, 11) > 0.5);
    if (r > 0.3 && r < 0.62) craneo(g, x + 5, y + 6, ram, true);
    if (r >= 0.62 && r < 0.9) {
      // osario: cabezas de huesos largos apiladas, con una calavera encima
      for (let j = 6; j < 12; j++) for (let i = 1; i < 10; i++) {
        const q = (i + (j % 2) * 1.5) % 3;
        g.set(x + i, y + j, q < 0.8 ? GRIS[0] : q < 1.8 ? ram[j < 8 ? 2 : 3] : ram[1]);
      }
      craneo(g, x + 2, y + 1, ram, hash(sem, 3, 11) > 0.5);
    }
    for (let i = 1; i < 10; i++) if (hash(x + i, y, 12) > 0.4) g.set(x + i, y + 11, ram[1]);
    if (r >= 0.9) telarana(g, x + 10, y + 1, 7, -1, 1, [GRIS[2], GRIS[3]]);
  }
  /* La puerta sellada del liche: arquivoltas apuntadas, losa con un círculo de runas y una calavera coronada. */
  function puertaCri(g) {
    const [cx, cy] = PUERTA_CRI;
    for (let k = 0; k < 4; k++) {
      const hw = 30 - k * 4, top = 18 + k * 4.5, c = capaOjiva(cx, hw, top, 50, HZ);
      const v0 = 1.4 + k * 0.35;
      cada(c, (x, y) => {
        const borde = !c.tiene(x - 1, y) || !c.tiene(x, y - 1) ? 1 : !c.tiene(x + 1, y) ? -1 : 0;
        const seg = y < 50 ? (((Math.atan2(y - 50, x - cx) + Math.PI) / Math.PI) * (13 - k * 2)) % 1 : ((y - 50) % 9) / 9;
        pon(g, x, y, VERDIN, v0 + verdeCri(x, y) * 1.4 + borde * 0.9 - (seg < 0.08 ? 1.2 : 0));
      });
    }
    // la losa: dos hojas de piedra con el círculo de runas
    const losa = capaOjiva(cx, 14, 36, 50, HZ);
    cada(losa, (x, y) => {
      const f = foco(x, y, cx, cy, 20, 20, 1.2);
      pon(g, x, y, VERDIN, 1.1 + f * 1.6 - (x === cx ? 1.2 : 0) + (x === cx + 1 ? 0.5 : 0) - ((y - 50) % 15 === 14 ? 0.6 : 0), 0.5);
    });
    const runa = (x, y, col) => { g.set(x, y, col); runasCri.push([x, y]); };
    for (let a = 0; a < 6.283; a += 0.04) { g.set(Math.round(cx + Math.cos(a) * 13), Math.round(cy + Math.sin(a) * 13), ESPECTRO[2]); g.set(Math.round(cx + Math.cos(a) * 9), Math.round(cy + Math.sin(a) * 9), ESPECTRO[1]); }
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.283, x = Math.round(cx + Math.cos(a) * 11), y = Math.round(cy + Math.sin(a) * 11);
      runa(x, y, ESPECTRO[4]);
      runa(x + (k % 3 === 0 ? 1 : 0), y + (k % 3 === 1 ? 1 : 0), ESPECTRO[3]);
    }
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * 6.283 - Math.PI / 2;
      cada(capa().linea(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, cx + Math.cos(a + 2.094) * 8, cy + Math.sin(a + 2.094) * 8, 1), (x, y) => runa(x, y, ESPECTRO[3]));
    }
    plantilla(g, [" aaa ", "a#a#a", "aaaaa", " a.a "], cx - 2, cy - 2, { a: ESPECTRO[4], "#": SO[0], ".": ESPECTRO[2] });
    // runas en las jambas
    for (let y = 56; y < 92; y += 6) for (const x of [cx - 20, cx + 20]) { runa(x, y, ESPECTRO[3]); runa(x, y + 1, ESPECTRO[2]); runa(x + (y % 12 ? 1 : -1), y + 2, ESPECTRO[3]); }
    // calavera coronada en la clave
    craneo(g, cx - 3, 12, [VERDIN[1], VERDIN[3], VERDIN[4], HU[3]]);
    for (const dx of [-3, 0, 3]) g.set(cx + dx, 10, B[3]).set(cx + dx, 11, B[2]);
    for (let dx = -3; dx <= 3; dx++) g.set(cx + dx, 12, B[dx < 0 ? 3 : 2]);
    g.set(cx - 2, 15, ESPECTRO[4]).set(cx + 2, 15, ESPECTRO[4]);
  }
  /* Sarcófago con la efigie de un rey yacente. */
  function sarcofagoCri(g, x0, x1) {
    for (let y = 83; y < 98; y++) for (let x = x0; x < x1; x++) {
      const i = (x - x0) % 11, panel = i > 1 && i < 10 && y > 85 && y < 95;
      let v = 1.6 + luzCri(x, y) * 1.5 - (y > 95 ? 0.8 : 0);
      if (panel) { v -= 0.7; if (i === 2 || y === 86) v -= 0.5; if (i === 9 || y === 94) v += 0.8; }
      if (x === x0) v += 0.8; else if (x === x1 - 1) v -= 0.8;
      pon(g, x, y, ramCri(x, y), v);
    }
    for (let x = x0 + 2; x + 9 < x1; x += 11) for (let k = 0; k < 4; k++) g.set(x + 3 + k, 86 + Math.abs(k - 1.5) - 1.5 + 1, GRIS[0]);
    for (let y = 79; y < 83; y++) for (let x = x0 - 2; x < x1 + 2; x++) pon(g, x, y, ramCri(x, y), (y === 79 ? 3.4 : y === 82 ? 0.8 : 2.2) + luzCri(x, y) * 1.2 - (x === x1 + 1 ? 1 : 0));
    // la efigie del rey yacente: almohada, cabeza coronada, manto, manos sobre la espada y los pies
    const EF = GRIS;
    conBorde(g, GRIS[0], tmp => {
      const cab = x0 + 9, med = (x0 + x1) / 2;
      capa().rect(cab - 5, 76, 9, 3).pintar(tmp, EF, { relieve: 1, max: 3, sesgo: 0.1 });
      capa().ell(cab, 73.5, 3, 2.8).pintar(tmp, EF, { relieve: 1.5, max: 4, sesgo: 0.15 });
      for (const dx of [-2, 0, 2]) tmp.set(cab + dx, 70, B[3], B).set(cab + dx, 71, B[2], B);
      tmp.set(cab - 1, 71, B[3], B).set(cab + 1, 71, B[3], B);
      capa().poly([[cab + 3, 78], [cab + 4, 74], [cab + 10, 72], [med + 6, 73], [x1 - 12, 74], [x1 - 9, 76], [x1 - 9, 78]]).pintar(tmp, EF, { relieve: 2, max: 4, sesgo: 0.1 });
      capa().ell(x1 - 9, 74.5, 1.8, 3).ell(x1 - 5.5, 75, 1.6, 2.6).pintar(tmp, EF, { relieve: 1, max: 4, sesgo: 0.1 });
      for (let x = cab + 12; x < x1 - 13; x++) tmp.set(x, 72, HI[x < med ? 4 : 3], HI);
      tmp.set(cab + 11, 71, B[3], B).set(cab + 11, 72, B[4], B).set(cab + 11, 73, B[2], B).set(cab + 10, 72, B[2], B).set(cab + 12, 72, B[2], B).set(cab + 9, 72, B[3], B);
      capa().ell(cab + 10, 73.5, 2.4, 1.4).pintar(tmp, EF, { relieve: 1, max: 4, sesgo: 0.2 });
      for (let x = cab + 15; x < x1 - 12; x += 5) tmp.set(x, 76, EF[1], EF).set(x + 1, 75, EF[1], EF);
    });
  }
  function braseroCri(g, cx, by) {
    conBorde(g, NE[0], tmp => {
      capa().rect(cx - 2, by + 4, 5, HZ - by - 2).pintar(tmp, HI, { relieve: 1.5, max: 3, sesgo: -0.1 });
      capa().poly([[cx - 6, HZ + 3], [cx + 6, HZ + 3], [cx + 3, HZ - 1], [cx - 3, HZ - 1]]).pintar(tmp, HI, { relieve: 1.5, max: 3 });
      capa().poly([[cx - 8, by], [cx + 8, by], [cx + 5, by + 5], [cx - 5, by + 5]]).pintar(tmp, HI, { relieve: 2, max: 4, sesgo: -0.1 });
      for (let x = cx - 8; x <= cx + 8; x++) tmp.set(x, by, HI[x < cx ? 4 : 3], HI);
      for (let x = cx - 6; x <= cx + 6; x++) tmp.set(x, by - 1, hash(x, by, 5) > 0.5 ? ESPECTRO[3] : ESPECTRO[2], ESPECTRO);
      for (let x = cx - 4; x <= cx + 4; x += 2) tmp.set(x, by - 2, ESPECTRO[4], ESPECTRO);
      for (const dx of [-5, 0, 5]) tmp.set(cx + dx, by + 2, B[3], B);
    });
  }
  function criptaAnim(ctx, t) {
    VELAS_CRI.forEach(([x, y, a], i) => llama(ctx, x, y - a - 1, t, i * 2.1, true));
    BRASEROS_CRI.forEach(([x, y], i) => hoguera(ctx, x, y - 2, 11, 12, t, i * 3.3, ESPECTRO, 5));
    // un destello que recorre el círculo de runas
    const giro = (t / 1800) % 1, [cx, cy] = PUERTA_CRI;
    ctx.fillStyle = HU[4];
    let n = 0;
    for (const [x, y] of runasCri) {
      if (n > 6) break;
      const d = Math.hypot(x - cx, y - cy);
      if (d < 10 || d > 12) continue;
      const a = (Math.atan2(y - cy, x - cx) / 6.283 + 1) % 1, e = Math.abs(a - giro);
      if (Math.min(e, 1 - e) < 0.05) { ctx.fillRect(x, y, 1, 1); n++; }
    }
    // un fuego fatuo que vaga ante los osarios
    const p = (t / 8000) % 1, vis = Math.sin(p * Math.PI);
    if (vis > 0.25) {
      const izq = Math.floor(t / 8000) % 2, x = Math.round((izq ? 20 : 186) + p * 50 + Math.sin(t / 600) * 3), y = Math.round(50 + Math.sin(t / 450) * 4);
      ctx.fillStyle = ESPECTRO[2]; ctx.fillRect(x - 1, y, 3, 2); ctx.fillRect(x, y + 2, 1, 2);
      ctx.fillStyle = vis > 0.6 ? ESPECTRO[4] : ESPECTRO[3]; ctx.fillRect(x, y, 1, 2);
    }
    // jirones de niebla verde a ras de suelo
    for (let i = 0; i < 5; i++) {
      const largo = 10 + Math.floor(hash(i, 2, 1) * 14), y = Math.round(97 + hash(i, 2, 2) * 9);
      const x = Math.round(((hash(i, 2, 3) * (W + 40) + (t / 1000) * 3 * (0.6 + hash(i, 2, 4))) % (W + 40)) - 20);
      ctx.fillStyle = i % 2 ? ESPECTRO[2] : VERDIN[3];
      ctx.fillRect(x, y, largo, 1); ctx.fillRect(x + 3, y - 1, Math.max(2, largo - 8), 1);
    }
  }

  /* =====================================================================
     Las minas enanas: galería entibada, raíles, vagoneta, faroles y cristales
     ===================================================================== */
  const FAROLES_MINA = [[56, 28], [200, 28]];
  const VP_MINA = [128, 70];
  const CRISTALES_MINA = [[14, 18, 1, 5], [242, 14, -1, 5], [94, 9, 1, 3], [166, 7, -1, 3], [5, 50, 1, 4], [250, 46, -1, 4], [152, 24, -1, 2]];
  const luzMina = (x, y) => lim(FAROLES_MINA.reduce((v, [lx, ly]) => v + foco(x, y, lx, ly + 10, 74, 62, 1.35), 0));
  const brilloCristal = (x, y) => lim(CRISTALES_MINA.reduce((v, [cx, cy, , n]) => v + foco(x, y, cx, cy, 10 + n * 2, 9 + n * 2, 1.4), 0));
  const haciaFarol = (x, y) => {
    const [lx, ly] = Math.abs(x - FAROLES_MINA[0][0]) < Math.abs(x - FAROLES_MINA[1][0]) ? FAROLES_MINA[0] : FAROLES_MINA[1];
    const dx = lx - x, dy = ly + 10 - y, d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d, 1];
  };
  const ROCA_AZUL = ["#0c0e15", "#141a28", "#1d2a40", "#283a58", "#334c70", "#3e5e86", "#4c709a"];
  function mina(g) {
    g.rect(0, 0, W, H, CENIZA[0]);
    const tes = teselas(150, 17, 0, 0, W, 97, 1.4, 26);
    const ramRoca = (x, y) => (umbral(x + 1, y + 2) < paso(brilloCristal(x, y), 0.3, 2.2) * 0.85 ? ROCA_AZUL : TIERRA);
    roca(g, tes, ramRoca, (x, y) => 1.1 + luzMina(x, y) * 4 - vin(x, y) * 1.1 - (y < 8 ? 0.7 : 0) + brilloCristal(x, y) * 1.2, haciaFarol, { vari: 0.6, relieve: 1.4, bisel: 2.4, oscuro: 1.5 });
    // vetas de oro en la roca
    for (let k = 0; k < 7; k++) {
      let x = hash(k, 1, 91) * W, y = 8 + hash(k, 2, 91) * 70, a = hash(k, 3, 91) * 6.28;
      for (let s = 0; s < 8 + hash(k, 4, 91) * 10; s++) {
        if (hash(k, s, 94) < 0.25) a += (hash(k, s, 92) - 0.5) * 2.4;
        x += Math.cos(a); y += Math.sin(a) * 0.5;
        if (TIERRA.includes(g.get(Math.round(x), Math.round(y))) && hash(k, s, 95) > 0.2) g.set(Math.round(x), Math.round(y), hash(k, s, 93) > 0.85 ? B[4] : luzMina(x, y) > 0.35 ? B[2] : B[1], B);
      }
    }
    for (const [x, y, lado, n] of CRISTALES_MINA) cristales(g, x, y, lado, n);
    tunelMina(g);
    // entibados laterales con sus faroles
    for (const [x0, x1] of [[22, 88], [168, 234]]) {
      for (const x of [x0, x1 - 6]) viga(g, x, 26, 6, HZ - 26, luzMina, { vertical: true });
      viga(g, x0 - 4, 20, x1 - x0 + 8, 6, luzMina);
      for (const [a, s] of [[x0 + 6, 1], [x1 - 7, -1]]) capa().linea(a, 40, a + s * 11, 26, 2).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
      for (const x of [x0 + 2, x1 - 4]) g.set(x, 23, HI[3]).set(x + 1, 23, HI[1]);
    }
    for (const [x, y] of FAROLES_MINA) { for (let j = 26; j < y; j++) g.set(x, j, HI[j % 2 ? 1 : 2]); farol(g, x, y); }
    // suelo de tierra y grava
    for (let y = HZ; y < H; y++) for (let x = 0; x < W; x++) {
      const hz = hash(x, y, 31), pied = hash(Math.floor(x / 4), Math.floor(y / 3), 32);
      let v = 2.5 + luzMina(x, y - 34) * 2.4 - (y - HZ) * 0.01 - vin(x, y) * 1.1;
      if (hz < 0.06) v -= 1.1; else if (hz > 0.95) v += 0.9;
      if (pied < 0.12) { const lx = x % 4, ly = y % 3; v += lx < 2 && ly === 0 ? 1 : lx > 1 && ly === 2 ? -1 : 0.3; }
      pon(g, x, y, TIERRA, v, 0.4);
    }
    for (let x = 0; x < W; x++) aclarar(g, x, HZ, 1, 2, [TIERRA], () => -1);
    railes(g);
    vagoneta(g, 128, 104);
    // herramientas y trastos: pico, pala, cubo, montón de mineral, barril y cajas
    capa().linea(92, HZ + 1, 100, 66, 1).pintar(g, M, { plano: 3 });
    conBorde(g, NE[0], tmp => capa().curva(92, 66, 100, 62, 108, 67, 2, 1).pintar(tmp, HI, { relieve: 1, max: 3 }));
    capa().linea(160, HZ + 1, 155, 68, 1).pintar(g, M, { plano: 2 });
    conBorde(g, NE[0], tmp => capa().poly([[152, 61], [158, 61], [158, 67], [155, 70], [152, 67]]).pintar(tmp, HI, { relieve: 1.5, max: 3 }));
    conBorde(g, NE[0], tmp => {
      capa().ell(72, HZ + 2, 14, 6).quitarRect(0, HZ + 3, W, 10).pintar(tmp, TIERRA, { relieve: 4, max: 5, sesgo: -0.1 });
      for (const [x, y] of [[66, 92], [72, 90], [78, 93], [69, 95], [75, 96]]) tmp.set(x, y, B[4], B).set(x + 1, y, B[2], B);
      tmp.set(74, 91, CRISTAL[4], CRISTAL).set(75, 91, CRISTAL[2], CRISTAL);
    });
    conBorde(g, M[0], tmp => {
      capa().poly([[38, 89], [47, 89], [46, 98], [39, 98]]).pintar(tmp, M, { relieve: 1.5, max: 3 });
      for (let x = 38; x < 48; x++) tmp.set(x, 91, HI[2], HI).set(x, 96, HI[1], HI);
      capa().curva(38, 89, 42.5, 83, 47, 89, 1).pintar(tmp, HI, { plano: 2 });
    });
    for (const [x, y, w, h] of [[228, 78, 20, 19], [234, 62, 14, 16]]) cajon(g, x, y, w, h, -0.3);
    conBorde(g, NE[0], tmp => {
      capa().ell(240, 60, 7, 2.5).pintar(tmp, OC, { relieve: 1.5, max: 2 });
      capa().ell(240, 60, 3, 1).pintar(tmp, OC, { plano: 0 });
    });
    barrilMina(g, 4, 78);
    // polea con su cubo colgado del entibado de la derecha
    conBorde(g, NE[0], tmp => {
      capa().ell(216, 30, 3.5, 3.5).pintar(tmp, M, { relieve: 2, max: 3 });
      tmp.set(216, 30, HI[3], HI);
      for (let y = 30; y < 58; y++) tmp.set(219, y, y % 3 ? OC[2] : OC[1], OC);
      for (let y = 34; y < 46; y++) tmp.set(213, y, y % 3 ? OC[2] : OC[1], OC);
      capa().poly([[214, 58], [224, 58], [223, 66], [215, 66]]).pintar(tmp, M, { relieve: 1.5, max: 3, sesgo: -0.1 });
      for (let x = 214; x < 225; x++) tmp.set(x, 59, HI[2], HI).set(x, 64, HI[1], HI);
      capa().curva(214, 58, 219, 53, 224, 58, 1).pintar(tmp, HI, { plano: 2 });
      for (const [x, y] of [[217, 57], [220, 56]]) tmp.set(x, y, B[3], B);
    });
    // piedras sueltas por el suelo
    for (const [x, y, rx, ry] of [[14, 101, 3, 2], [22, 104, 2, 1.4], [168, 100, 2.5, 1.6], [96, 100, 2, 1.3], [242, 102, 3.5, 2.2], [250, 108, 2, 1.4], [152, 104, 1.6, 1.1]])
      conBorde(g, CENIZA[0], tmp => capa().ell(x, y, rx, ry).pintar(tmp, TIERRA, { relieve: 1.5, sesgo: -0.1 + luzMina(x, y - 30) * 0.3 }));
  }
  /* Racimo de cristales prismáticos que asoma de la roca. */
  function cristales(g, x, y, lado, n) {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + lado * (k - (n - 1) / 2) * 0.4, largo = 5 + ((k * 5) % 4) + (k === Math.floor(n / 2) ? 4 : 0);
      const ux = Math.cos(a), uy = Math.sin(a), px = x + (k - (n - 1) / 2) * 2, py = y + 3;
      conBorde(g, CRISTAL[0], tmp => {
        for (let s = 0; s <= largo; s++) {
          const ancho = s < largo - 1 ? 1.2 : s < largo ? 0.6 : 0, qx = px + ux * s, qy = py + uy * s;
          tmp.set(Math.round(qx - uy * ancho), Math.round(qy + ux * ancho), CRISTAL[s > largo - 3 ? 3 : 2], CRISTAL);
          tmp.set(Math.round(qx + uy * ancho), Math.round(qy - ux * ancho), CRISTAL[s > largo - 2 ? 4 : 3], CRISTAL);
          tmp.set(Math.round(qx), Math.round(qy), s >= largo - 1 ? CRISTAL[4] : CRISTAL[3], CRISTAL);
        }
      });
    }
  }
  /* La boca de la galería principal: marco de madera y el túnel que se pierde a lo lejos. */
  function tunelMina(g) {
    const [vx, vy] = VP_MINA;
    for (let y = 40; y < HZ; y++) for (let x = 106; x < 151; x++) {
      const d = Math.max(Math.abs(x - vx) / 22, Math.abs(y - vy) / 28);
      pon(g, x, y, TIERRA, -0.4 + d * 1.9 + luzMina(x, y) * 0.6 + (hash(x >> 1, y >> 1, 5) - 0.5) * 0.6, 0.6);
    }
    for (let k = 5; k >= 1; k--) {
      const s = Math.pow(0.68, k), gr = Math.max(1, Math.round(6 * s));
      const L = Math.round(vx + (106 - vx) * s), Rr = Math.round(vx + (150 - vx) * s), T = Math.round(vy + (40 - vy) * s), Bt = Math.round(vy + (HZ - vy) * s);
      const ton = lim(Math.round(2.4 - k * 0.5), 0, 4);
      capa().rect(L - gr, T, gr, Bt - T).rect(Rr, T, gr, Bt - T).rect(L - gr, T - gr, Rr - L + 2 * gr, gr).pintar(g, M, { plano: ton });
      if (gr > 1) capa().rect(L - gr, T - gr, Rr - L + 2 * gr, 1).pintar(g, M, { plano: Math.min(4, ton + 1) });
    }
    g.set(vx, vy - 1, F[3]).set(vx, vy, F[2]).set(vx + 1, vy - 1, F[2]);
    for (const x of [100, 150]) viga(g, x, 40, 6, HZ - 40, luzMina, { vertical: true, sesgo: x > 128 ? -0.3 : 0.1 });
    viga(g, 95, 34, 66, 6, luzMina);
    for (const [a, s] of [[106, 1], [149, -1]]) capa().linea(a, 54, a + s * 10, 41, 2).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
    // runas enanas grabadas en el dintel
    for (let k = 0; k < 9; k++) {
      const x = 106 + k * 5;
      for (const [i, j] of [[0, 0], [1, 1], [0, 2], [2, 0], [2, 2]].filter((_, q) => hash(k, q, 7) > 0.35)) g.set(x + i, 36 + j, B[2], B);
    }
  }
  /* Raíles y traviesas en perspectiva, que entran en la galería. */
  function railes(g) {
    const [vx, vy] = VP_MINA, f = y => (y - vy) / (H - 1 - vy);
    for (let k = 0; k < 20; k++) {
      const ff = 1 / (1 + k * 0.3), y = Math.round(vy + (H - 1 - vy) * ff);
      if (y < vy + 3) break;
      const hw = Math.round(36 * ff), th = Math.max(1, Math.round(4 * ff)), dentro = y < HZ;
      for (let j = 0; j < th; j++) for (let x = vx - hw; x <= vx + hw; x++) {
        const v = (j === 0 ? 3 : 1.8) + (dentro ? -1.4 : luzMina(x, y - 30) * 1.4) - vin(x, y) - (x > vx + hw - 2 ? 0.8 : 0);
        pon(g, x, y - th + 1 + j, M, v, 0.4);
      }
      if (!dentro) for (let x = vx - hw; x <= vx + hw; x++) g.set(x, y + 1, TIERRA[1], TIERRA);
    }
    for (let y = vy + 2; y < H; y++) {
      const ff = f(y), w = Math.max(1, Math.round(3 * ff)), dentro = y < HZ;
      for (const lado of [-1, 1]) {
        const xc = Math.round(vx + lado * 25 * ff - w / 2);
        for (let i = 0; i < w; i++) g.set(xc + i, y, dentro ? HI[i === 0 ? 2 : 1] : HI[i === 0 ? 4 : i === w - 1 ? 1 : 3], HI);
        if (!dentro) g.set(xc - 1, y, HI[0], HI).set(xc + w, y, HI[0], HI);
      }
    }
  }
  function vagoneta(g, cx, yb) {
    conBorde(g, NE[0], tmp => {
      capa().ell(cx, yb - 18, 15, 5).pintar(tmp, TIERRA, { relieve: 3, max: 5, sesgo: -0.1 });
      for (const [x, y] of [[cx - 8, yb - 21], [cx - 1, yb - 23], [cx + 7, yb - 20], [cx + 3, yb - 19]]) tmp.set(x, y, B[4], B).set(x + 1, y, B[2], B);
      for (const [x, y] of [[cx - 4, yb - 22], [cx + 10, yb - 19]]) tmp.set(x, y, CRISTAL[4], CRISTAL).set(x + 1, y, CRISTAL[3], CRISTAL).set(x, y + 1, CRISTAL[2], CRISTAL);
      capa().poly([[cx - 17, yb - 18], [cx + 17, yb - 18], [cx + 14, yb - 4], [cx - 14, yb - 4]]).pintar(tmp, HI, { relieve: 2.5, max: 3, sesgo: -0.15 + luzMina(cx, yb - 30) * 0.3 });
      for (let x = cx - 17; x <= cx + 17; x++) tmp.set(x, yb - 18, HI[4], HI).set(x, yb - 17, HI[2], HI);
      for (const x of [cx - 10, cx, cx + 10]) for (let y = yb - 16; y < yb - 4; y++) tmp.set(x, y, HI[3], HI).set(x + 1, y, HI[1], HI);
      for (let x = cx - 14; x < cx + 14; x += 4) tmp.set(x, yb - 15, HI[4], HI).set(x, yb - 7, HI[4], HI);
      for (const wx of [cx - 9, cx + 9]) {
        capa().ell(wx, yb - 2, 3.5, 3.5).pintar(tmp, HI, { relieve: 2, max: 3 });
        tmp.set(wx, yb - 2, HI[0], HI);
      }
    });
  }
  function barrilMina(g, x, y) {
    conBorde(g, M[0], tmp => {
      const c = capa(), w = 13, h = 19, cx = x + (w - 1) / 2;
      for (let j = 0; j < h; j++) { const hw = (w / 2) * (0.84 + 0.16 * Math.sin((Math.PI * j) / (h - 1))); c.rect(Math.round(cx - hw + 0.5), y + j, Math.round(hw * 2), 1); }
      c.pintar(tmp, M, { relieve: 3, sesgo: -0.1, max: 3 });
      cada(c, (px, py) => { if ((px - x) % 3 === 0 && py > y + 1) tmp.set(px, py, M[1], M); });
      for (const f of [0.15, 0.8]) { const yy = y + Math.round(h * f); cada(c, (px, py) => { if (py === yy || py === yy + 1) tmp.set(px, py, HI[py === yy ? 3 : 1], HI); }); }
      for (let i = 1; i < w - 1; i++) tmp.set(x + i, y, M[i < w / 2 ? 3 : 2], M);
    });
  }
  function minaAnim(ctx, t) {
    FAROLES_MINA.forEach(([x, y], i) => llamaFarol(ctx, x, y, t, i * 2.7));
    const [vx, vy] = VP_MINA;
    ctx.fillStyle = Math.sin(t / 230) + Math.sin(t / 97) > 0 ? F[4] : F[3]; ctx.fillRect(vx, vy - 1, 1, 1);
    // destellos en los cristales
    CRISTALES_MINA.forEach(([x, y, lado, n], i) => {
      const p = ((t / 1000) * 0.4 + hash(i, 4)) % 1;
      if (p > 0.1) return;
      const px = Math.round(x + lado * 1), py = Math.round(y - 6 - n);
      ctx.fillStyle = HU[4]; ctx.fillRect(px, py, 1, 1);
      if (p > 0.02 && p < 0.08) { ctx.fillStyle = CRISTAL[4]; ctx.fillRect(px - 1, py, 3, 1); ctx.fillRect(px, py - 1, 1, 3); }
    });
    // tierra que se desprende del techo, a ratos
    for (let k = 0; k < 2; k++) {
      const per = 3100 + k * 1300, p = ((t + k * 977) % per) / per, x = k ? 182 : 70;
      if (p > 0.5) continue;
      for (let i = 0; i < 3; i++) { const q = p * 2 - i * 0.06; if (q < 0) continue; ctx.fillStyle = TIERRA[4]; ctx.fillRect(x + (i % 2), Math.round(4 + q * q * 90), 1, 1); }
    }
    // motas de polvo en la luz de los faroles
    motas(ctx, t, 14, 10, 30, 236, 70, [TIERRA[5], OC[3]], (x, y) => luzMina(x, y), 7, 0.7);
  }

  /* =====================================================================
     La gran forja enana: horno, yunques, canal de lava y la cabeza que la vierte
     ===================================================================== */
  const BOCA_HORNO = [52, 72];
  const CHORRO = [209, 56];                  // boca de la cabeza enana
  const CANAL = [99, 104];                   // filas del canal de lava (de arriba abajo)
  const luzForja = (x, y) => lim(foco(x, y, BOCA_HORNO[0], 88, 112, 76, 1.2) + foco(x, y, CHORRO[0], 84, 80, 60, 1.35) * 0.9 + (x > 92 ? Math.max(0, 1 - Math.abs(y - 101) / 34) ** 2 * 0.45 : 0) + foco(x, y, 124, 74, 26, 18, 2) * 0.4);
  const ramForja = (x, y) => (umbral(x + 1, y + 2) < paso(luzForja(x, y), 0.42, 2.6) ? CALOR : FORJA);
  function forja(g) {
    g.rect(0, 0, W, H, CENIZA[0]);
    sillares(g, 0, 0, W, [9, 10, 12, 12, 12, 12, 10, 10, 10], ramForja, (x, y) => 0.6 + luzForja(x, y) * 3.4 - vin(x, y) - (y < 40 ? (1 - y / 40) * 0.9 : 0), { sem: 9, ancho: 26, bisel: 0.8, junta: 1.5, vari: 0.5 });
    // friso enano tallado: galones y runas de bronce
    for (let y = 13; y < 24; y++) for (let x = 0; x < W; x++) {
      const RF = CALOR.includes(g.get(x, y)) ? CALOR : FORJA, k = RF.indexOf(g.get(x, y));
      if (k < 0) continue;
      const zig = Math.abs((x % 10) - 5) === Math.abs(y - 18) % 6;
      g.set(x, y, y === 13 ? RF[Math.min(5, k + 2)] : y === 23 ? RF[0] : y === 14 || y === 22 ? RF[Math.max(0, k - 1)] : zig ? RF[Math.max(0, k - 2)] : RF[Math.min(4, k + 1)], RF);
    }
    for (let x = 6; x < W; x += 26) for (const [i, j] of [[0, 0], [1, 1], [2, 0], [1, 2], [0, 3], [2, 3], [1, 4]].filter((_, q) => hash(x, q, 5) > 0.3)) g.set(x + i, 16 + j, luzForja(x, 20) > 0.25 ? B[3] : B[2], B);
    // pilastras en los bordes
    for (const x of [0, 247]) {
      sillares(g, x, 0, x + 9, [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9], FORJA, (px, py) => 1.4 + luzForja(px, py) * 2.4 - vin(px, py) * 0.7 + (px === x ? 0.8 : px === x + 8 ? -1 : 0), { sem: 2 + x, ancho: 9, bisel: 0.6 });
    }
    // escudo enano con hachas cruzadas
    for (const s of [-1, 1]) {
      cada(capa().linea(131 - s * 14, 46, 131 + s * 11, 20, 1), (x, y) => g.set(x, y, M[2]));
      conBorde(g, NE[0], tmp => capa().poly([[131 + s * 9, 20], [131 + s * 15, 17], [131 + s * 15, 27], [131 + s * 10, 24]]).pintar(tmp, HI, { relieve: 1.5, max: 4, sesgo: -0.1 }));
    }
    conBorde(g, NE[0], tmp => {
      capa().ell(131, 30, 9, 9).pintar(tmp, M, { relieve: 4, max: 3, sesgo: -0.1 });
      for (let a = 0; a < 6.283; a += 0.04) tmp.set(Math.round(131 + Math.cos(a) * 8.6), Math.round(30 + Math.sin(a) * 8.6), B[Math.cos(a + 2.36) > 0.2 ? 4 : Math.cos(a + 2.36) > -0.4 ? 3 : 1], B);
      capa().ell(131, 30, 2.5, 2.5).pintar(tmp, B, { relieve: 1.5 });
      for (const [i, j] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) tmp.set(131 + i, 30 + j, B[3], B);
    });
    // estante de herramientas
    viga(g, 102, 44, 58, 3, luzForja);
    herramientas(g);
    // cadenas que bajan de la oscuridad, una con un crisol
    for (const [x, l] of [[98, 34], [178, 26]]) { cadena(g, x, 0, l); capa().curva(x, l, x + 3, l + 4, x, l + 6, 1).pintar(g, HI, { plano: 3 }); }
    for (const x of [154, 166]) cadena(g, x, 0, 30);
    conBorde(g, NE[0], tmp => {
      capa().poly([[152, 30], [168, 30], [166, 40], [160, 43], [154, 40]]).pintar(tmp, HI, { relieve: 2.5, max: 3, sesgo: -0.1 });
      for (let x = 153; x < 168; x++) tmp.set(x, 30, x % 3 ? F[3] : F[4], F);
      for (let x = 152; x < 169; x++) tmp.set(x, 31, HI[3], HI);
    });
    horno(g);
    cabezaEnana(g, CHORRO[0]);
    yunque(g, 123, HZ, 1, true);
    yunque(g, 171, HZ, 0.75, false);
    // pila de templar
    conBorde(g, NE[0], tmp => {
      capa().rect(140, 86, 20, 11).pintar(tmp, FORJA, { relieve: 2, max: 4, sesgo: -0.1 });
      for (let x = 141; x < 159; x++) tmp.set(x, 86, MA[3], MA).set(x, 87, MA[2], MA).set(x, 88, MA[1], MA);
      for (let x = 140; x < 160; x++) tmp.set(x, 85, FORJA[3], FORJA);
      capa().linea(146, 86, 151, 78, 1).linea(150, 86, 145, 78, 1).pintar(tmp, HI, { plano: 2 });
    });
    // suelo de losas al calor de la lava
    losas(g, HZ, [4, 5, 6, 7, 8, 9, 9], 26, 128, -80, (x, y) => ramForja(x, y - 20), (x, y) => 1.1 + luzForja(x, y - 20) * 2.6 - vin(x, y), 29, CENIZA[0], { motas: 0.08 });
    canalLava(g);
    // hollín y cascarilla de hierro por el suelo
    for (let i = 0; i < 60; i++) { const x = Math.floor(hash(i, 1, 81) * W), y = HZ + 10 + Math.floor(hash(i, 2, 81) * 36); if (g.get(x, y) !== CENIZA[0]) g.set(x, y, hash(i, 3, 81) > 0.8 ? BRASA[2] : CENIZA[0]); }
  }
  function herramientas(g) {
    conBorde(g, NE[0], tmp => {
      const mango = (x, y0, y1) => { for (let y = y0; y < y1; y++) tmp.set(x, y, M[3], M).set(x + 1, y, M[1], M); };
      // martillo
      mango(108, 47, 62); capa().rect(105, 47, 8, 4).pintar(tmp, HI, { relieve: 1.5, max: 4 });
      // tenazas
      cada(capa().linea(118, 47, 122, 66, 1), (x, y) => tmp.set(x, y, HI[3], HI));
      cada(capa().linea(122, 47, 118, 66, 1), (x, y) => tmp.set(x, y, HI[1], HI));
      tmp.set(120, 52, B[3], B);
      // mazo grande
      mango(131, 47, 66); capa().rect(127, 47, 10, 6).pintar(tmp, HI, { relieve: 2, max: 4 });
      for (let x = 127; x < 137; x++) tmp.set(x, 49, B[2], B);
      // otra tenaza y un martillo de peña
      cada(capa().linea(141, 47, 144, 63, 1), (x, y) => tmp.set(x, y, HI[3], HI));
      cada(capa().linea(145, 47, 142, 63, 1), (x, y) => tmp.set(x, y, HI[1], HI));
      mango(152, 47, 60); capa().poly([[149, 47], [157, 47], [156, 50], [150, 50]]).pintar(tmp, HI, { relieve: 1, max: 4 });
    });
  }
  /* El horno: cúpula de piedra con la boca al rojo, chimenea y un fuelle. */
  function horno(g) {
    const [cx, ys] = BOCA_HORNO;
    const c = capa().poly([[10, 97], [10, 52], [18, 40], [34, 33], [70, 33], [86, 40], [94, 52], [94, 97]]);
    sillares(g, 10, 30, 95, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7], ramForja, (x, y) => 1.9 + luzForja(x, y) * 2.6 - Math.abs(x - cx) * 0.018 + (x < 14 ? 0.6 : x > 90 ? -0.8 : 0), { sem: 4, ancho: 9, bisel: 0.6, junta: 1.4, masc: c });
    // campana y chimenea
    const ch = capa().poly([[34, 34], [40, 0], [64, 0], [70, 34]]);
    cada(ch, (x, y) => pon(g, x, y, FORJA, 1.2 + (x < 44 ? 0.6 : x > 62 ? -0.6 : 0) + luzForja(x, y) * 1.4 - ((y % 9) === 0 ? 1 : 0) - (1 - y / 34) * 0.6));
    for (const y of [8, 22]) for (let x = 36; x < 69; x++) if (ch.tiene(x, y)) { g.set(x, y, HI[2], HI); g.set(x, y + 1, HI[1], HI); if (x % 6 === 0) g.set(x, y, HI[4], HI); }
    // la boca al rojo
    const boca = capa().rect(cx - 19, ys, 39, HZ + 1 - ys).ell(cx, ys, 19, 14);
    cada(boca, (x, y) => {
      const d = Math.hypot((x - cx) / 19, (y - 92) / 30);
      g.set(x, y, F[lim(tono(x, y, 4.4 - d * 3.4, 0.6), 0, 4)], F);
    });
    for (let x = cx - 18; x < cx + 19; x++) { const h = hash(x, 3, 3); if (h < 0.55) { g.set(x, 95, BRASA[3]); g.set(x, 96, h < 0.2 ? F[3] : BRASA[2]); if (h < 0.25) g.set(x, 94, BRASA[2]); } }
    for (let a = Math.PI; a <= 2 * Math.PI; a += 0.02) for (let r = 19; r < 24; r++) {
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(ys + Math.sin(a) * r * 0.74), placa = Math.floor(((a - Math.PI) / Math.PI) * 9);
      g.set(x, y, r === 19 ? BRASA[3] : r === 23 ? NE[0] : B[r === 20 ? 4 : Math.cos(a + 0.8) < 0 ? 3 : 2]);
      if (r === 21 && Math.abs(((a - Math.PI) / Math.PI) * 9 - placa - 0.5) < 0.06) g.set(x, y, B[4]);
    }
    for (const x of [cx - 23, cx + 19]) for (let y = ys; y < HZ + 1; y++) for (let i = 0; i < 5; i++) g.set(x + i, y, i === 0 ? (x < cx ? B[3] : BRASA[3]) : i === 4 ? NE[0] : (y - ys) % 6 === 0 ? B[4] : B[i < 2 ? 3 : 2]);
    // placa de runas sobre la boca
    conBorde(g, NE[0], tmp => {
      capa().rect(cx - 9, 46, 19, 6).pintar(tmp, B, { relieve: 1.5, max: 3 });
      for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) if (hash(k, j, 13) > 0.4) tmp.set(cx - 7 + k * 4, 47 + j, B[1], B);
    });
    // fuelle de cuero junto al horno
    conBorde(g, NE[0], tmp => {
      capa().poly([[96, 78], [110, 72], [114, 84], [100, 90]]).pintar(tmp, TE, { relieve: 2, max: 2, sesgo: -0.2 });
      for (let k = 0; k < 4; k++) cada(capa().linea(99 + k * 3, 87 - k * 1.5, 104 + k * 3, 76 - k * 1.5, 1), (x, y) => tmp.set(x, y, TE[1], TE));
      capa().linea(96, 81, 89, 82, 2).pintar(tmp, B, { relieve: 1, max: 3 });
      capa().linea(110, 72, 118, 64, 1).pintar(tmp, M, { plano: 2 });
      capa().poly([[109, 71], [113, 70], [116, 85], [112, 86]]).pintar(tmp, M, { relieve: 1, max: 2 });
    });
  }
  /* La gran cabeza enana tallada en la roca, que vierte lava por la boca en una pila. */
  function cabezaEnana(g, cx) {
    const C = CALOR, L = [-0.4, 0.6, 0.6], y = v => Math.round(4 + v * 1.2);
    conBorde(g, CENIZA[0], tmp => {
      // yelmo de hierro con cuernos y una banda de bronce remachada
      capa().poly([[cx - 22, y(22)], [cx - 17, y(10)], [cx, y(5)], [cx + 17, y(10)], [cx + 22, y(22)]]).pintar(tmp, HI, { relieve: 5, max: 4, sesgo: -0.15 });
      for (const s of [-1, 1]) capa().curva(cx + s * 19, y(16), cx + s * 31, y(14), cx + s * 32, y(2), 4, 1.5).pintar(tmp, HU, { relieve: 1.5, max: 3 });
      for (let x = cx - 21; x <= cx + 21; x++) { tmp.set(x, y(20), B[x < cx ? 3 : 2], B); tmp.set(x, y(20) + 1, B[x < cx ? 2 : 1], B); if ((x - cx) % 5 === 0) tmp.set(x, y(20), B[4], B); }
      cada(capa().linea(cx, y(5) + 1, cx, y(19), 1), (x, yy) => tmp.set(x, yy, HI[4], HI));
      // frente y cejas, mejillas
      capa().rect(cx - 18, y(22), 37, 14).pintar(tmp, C, { relieve: 3, max: 4, luz: L, sesgo: 0.1 });
      for (const s of [-1, 1]) capa().poly([[cx + s * 3, y(23)], [cx + s * 17, y(22)], [cx + s * 16, y(25)], [cx + s * 4, y(26)]]).pintar(tmp, C, { relieve: 1.5, max: 5, luz: L, sesgo: 0.25, separar: 1 });
      // nariz
      capa().poly([[cx - 4, y(24)], [cx + 4, y(24)], [cx + 6, y(33)], [cx - 6, y(33)]]).pintar(tmp, C, { relieve: 2.5, max: 5, luz: [-0.4, 0.7, 0.6], sesgo: 0.35, separar: 1 });
      // bigote
      for (const s of [-1, 1]) capa().poly([[cx + s * 2, y(34)], [cx + s * 18, y(31)], [cx + s * 16, y(37)], [cx + s * 4, y(38)]]).pintar(tmp, C, { relieve: 2, max: 5, luz: [-0.4, 0.7, 0.6], sesgo: 0.15, separar: 1 });
      // barba en dos trenzas
      for (const s of [-1, 1]) capa().poly([[cx + s * 5, y(39)], [cx + s * 18, y(36)], [cx + s * 16, y(52)], [cx + s * 10, y(62)], [cx + s * 6, y(57)]]).pintar(tmp, C, { relieve: 3, max: 4, luz: [-0.3, 0.7, 0.6], sesgo: -0.05, separar: 1 });
    });
    // modelado a mano: yelmo con luz por la izquierda, nariz y bigote con canto iluminado desde abajo
    aclarar(g, cx - 23, y(5), 47, y(22) - y(5), [HI], (x, yy) => (cx - x) / 14 + (yy < y(12) ? 0.4 : 0), 0.8);
    aclarar(g, cx - 7, y(24), 15, y(33) - y(24), [CALOR], (x, yy) => (x < cx - 1 ? 1.2 : x > cx + 2 ? -0.9 : 0.4) + (yy - y(24)) * 0.06);
    aclarar(g, cx - 19, y(31), 39, y(38) - y(31) + 1, [CALOR], (x, yy) => (yy >= y(36) ? 1 : yy <= y(32) ? -0.6 : 0.2));
    aclarar(g, cx - 18, y(22), 37, 3, [CALOR], () => -0.8);
    for (const s of [-1, 1]) {
      for (let v = 40; v < 58; v += 3) for (let k = 0; k < 3; k++) { g.set(cx + s * (8 + k * 2), y(v) + k, CALOR[1]); g.set(cx + s * (8 + k * 2), y(v) + k - 1, CALOR[4]); }
      g.set(cx + s * 11, y(52), B[3]).set(cx + s * 12, y(52), B[2]).set(cx + s * 11, y(52) + 1, B[2]);
      for (let k = 0; k < 5; k++) g.set(cx + s * (4 + k * 2), y(22) - 1, B[k % 2 ? 2 : 3]);
      for (let i = 0; i < 4; i++) g.set(cx + s * (6 + i), y(27), i < 2 ? BRASA[3] : BRASA[4]).set(cx + s * (6 + i), y(27) + 1, BRASA[2]);
      g.set(cx + s * 7, y(27), F[3]).set(cx + s * 8, y(27), F[4]);
    }
    for (let yy = y(37); yy < CHORRO[1]; yy++) for (let x = cx - 4; x <= cx + 4; x++) g.set(x, yy, yy < CHORRO[1] - 2 ? SO[0] : F[2]);
    // la pila de piedra que recoge la lava
    const pila = capa().rect(cx - 24, 84, 49, 13);
    sillares(g, cx - 24, 84, cx + 25, [6, 7], CALOR, (x, yy) => 2.4 + (yy < 86 ? 1 : 0) - (x > cx + 20 ? 0.8 : 0), { sem: 5, ancho: 10, bisel: 0.7, junta: 1.3, masc: pila });
    for (let x = cx - 24; x < cx + 25; x++) { g.set(x, 82, BRASA[3]); g.set(x, 83, (x * 3) % 5 ? F[3] : F[4]); g.set(x, 84, F[2]); }
    // el chorro
    for (let yy = CHORRO[1]; yy < 83; yy++) for (let x = cx - 2; x <= cx + 2; x++) g.set(x, yy, Math.abs(x - cx) === 2 ? F[2] : (yy + x) % 3 ? F[3] : F[4]);
    // rebosadero hacia el canal
    for (let yy = 84; yy < CANAL[0]; yy++) for (let x = cx - 16; x < cx - 11; x++) g.set(x, yy, x === cx - 16 || x === cx - 12 ? BRASA[3] : (x + yy) % 3 ? F[3] : F[4]);
  }
  /* Yunque sobre su tajo; esc escala el tamaño. */
  function yunque(g, cx, yb, esc, caliente) {
    const e = v => Math.round(v * esc);
    conBorde(g, NE[0], tmp => {
      capa().rect(cx - e(7), yb - e(9), e(14) + 1, e(9) + 1).pintar(tmp, M, { relieve: 2, max: 3, sesgo: -0.1 });
      for (let x = cx - e(7); x <= cx + e(7); x++) tmp.set(x, yb - e(9), M[3], M);
      const top = yb - e(9) - e(12);
      capa().poly([[cx - e(17), top], [cx + e(12), top], [cx + e(12), top + e(4)], [cx + e(7), top + e(5)], [cx + e(5), top + e(8)], [cx - e(5), top + e(8)], [cx - e(7), top + e(5)], [cx - e(10), top + e(4)], [cx - e(17), top + 1]]).pintar(tmp, HI, { relieve: 2, max: 4, luz: [-0.5, -0.7, 0.5] });
      capa().poly([[cx - e(5), top + e(8)], [cx + e(5), top + e(8)], [cx + e(8), top + e(12)], [cx - e(8), top + e(12)]]).pintar(tmp, HI, { relieve: 1.5, max: 3 });
      for (let x = cx - e(15); x < cx + e(12); x++) tmp.set(x, top, HI[4], HI);
      if (caliente) {
        for (let x = cx - 3; x < cx + 4; x++) tmp.set(x, top - 1, x < cx + 2 ? F[4] : F[3], F).set(x, top - 2, x > cx - 2 ? F[3] : F[2], F);
        for (let x = cx - 4; x < cx + 5; x++) if (tmp.get(x, top)) tmp.set(x, top, F[2], F);
      } else {
        for (let x = cx - e(14); x < cx + e(10); x++) tmp.set(x, top - 1, x > cx + e(5) ? F[3] : HI[3], HI);
        tmp.set(cx - e(16), top - 1, HI[2], HI);
      }
    });
    if (caliente) {
      capa().linea(cx + 9, yb, cx + 15, yb - 14, 1).pintar(g, M, { plano: 3 });
      conBorde(g, NE[0], tmp => capa().rect(cx + 13, yb - 18, 6, 4).pintar(tmp, HI, { relieve: 1, max: 4 }));
    }
  }
  /* Canal de lava que corre al pie del muro y sale por la derecha. */
  function canalLava(g) {
    const [y0, y1] = CANAL;
    for (let x = 92; x < W; x++) {
      g.set(x, y0 - 2, FORJA[3], FORJA); g.set(x, y0 - 1, BRASA[3], BRASA);
      for (let y = y0; y <= y1; y++) {
        const c = hash(Math.floor(x / 3), y, 41), corte = (x * 2 + y * 5) % 11 === 0;
        g.set(x, y, y === y0 ? F[2] : y === y1 ? BRASA[3] : c < 0.18 ? BRASA[2] : corte ? F[4] : F[3], F);
      }
      g.set(x, y1 + 1, CENIZA[0]); g.set(x, y1 + 2, BRASA[2], BRASA);
    }
    // boca de desagüe por la izquierda
    for (let y = y0 - 3; y <= y1 + 2; y++) for (let x = 88; x < 94; x++) g.set(x, y, x === 88 || y === y0 - 3 ? FORJA[3] : x === 89 ? FORJA[2] : SO[0]);
    // resplandor en las losas cercanas
    aclarar(g, 0, y1 + 3, W, 10, [FORJA, CALOR], (x, y) => (x > 90 ? (1 - (y - y1 - 3) / 10) * 1.1 : 0));
    aclarar(g, 0, HZ, W, y0 - 2 - HZ, [FORJA, CALOR], x => (x > 90 ? 0.8 : 0));
  }
  function forjaAnim(ctx, t) {
    // llamas en la boca del horno
    hoguera(ctx, BOCA_HORNO[0], 94, 30, 18, t, 0.4, F, 6);
    // la lava baja por el chorro y corre por el canal hacia la derecha
    const [cx, cy] = CHORRO;
    ctx.fillStyle = HU[4];
    for (let i = 0; i < 4; i++) { const y = cy + Math.floor(((t / 55) + i * 6.7) % 26); ctx.fillRect(cx - 1 + (i % 3), y, 1, 2); }
    for (let i = 0; i < 9; i++) {
      const x = 94 + Math.floor(((t / 70) + i * 18.3) % (W - 94)), y = CANAL[0] + 1 + (i % 3);
      ctx.fillStyle = i % 3 ? F[4] : HU[4]; ctx.fillRect(x, y, 2 + (i % 2), 1);
    }
    // burbujas en la pila
    for (let i = 0; i < 2; i++) { const p = ((t / 900) + i * 0.5) % 1; if (p < 0.3) { ctx.fillStyle = p < 0.15 ? F[4] : BRASA[4]; ctx.fillRect(cx - 14 + i * 22, 83 - (p < 0.15 ? 1 : 0), 2, 1); } }
    // los ojos de la cabeza laten
    if (Math.sin(t / 700) > 0.3) { ctx.fillStyle = HU[4]; ctx.fillRect(cx - 8, Math.round(4 + 27 * 1.2), 1, 1); ctx.fillRect(cx + 8, Math.round(4 + 27 * 1.2), 1, 1); }
    // chispas del yunque, a golpes
    const golpe = (t % 1500) / 1500;
    if (golpe < 0.32) for (let i = 0; i < 8; i++) {
      const a = -0.4 - i * 0.3, v = 10 + (i % 3) * 6, p = golpe / 0.32;
      const x = Math.round(123 + Math.cos(a) * v * p), y = Math.round(73 + Math.sin(a) * v * p + 16 * p * p);
      ctx.fillStyle = p < 0.5 ? HU[4] : F[3]; ctx.fillRect(x, y, 1, 1);
    }
    // vapor de la pila de templar
    for (let i = 0; i < 2; i++) { const p = ((t / 1800) + i * 0.5) % 1; ctx.fillStyle = p < 0.5 ? CENIZA[4] : CENIZA[3]; ctx.fillRect(Math.round(146 + i * 7 + Math.sin(t / 400 + i) * 2), Math.round(84 - p * 18), 1, 2); }
    // pavesas que suben del horno y del canal
    for (let i = 0; i < 9; i++) {
      const p = (t / 2600 + i * 0.618) % 1;
      if (p > 0.85) continue;
      const x0 = i < 5 ? 40 + i * 6 : 120 + (i - 5) * 34, y0 = i < 5 ? 70 : CANAL[0];
      const x = Math.round(x0 + Math.sin(i * 7.3 + p * 6) * 4), y = Math.round(y0 - p * (i < 5 ? 60 : 40));
      ctx.fillStyle = p < 0.35 ? F[4] : p < 0.65 ? F[3] : F[2]; ctx.fillRect(x, y, 1, 1);
    }
  }

  /* =====================================================================
     El salón del castillo del vampiro: ventanales góticos, estandartes y luz de luna
     ===================================================================== */
  const VENTANAS = [45, 128, 211];
  const VENT = { hw: 14, top: 16, ys: 34, sill: 72 };
  const LUNA = [135, 51];
  const ANTORCHAS_CAS = [[104, 60], [152, 60], [20, 60], [236, 60]];
  const ESTANDARTES_CAS = [[81, 22], [161, 22]];   // esquina superior izquierda (15 de ancho)
  const enVentana = (x, y) => VENTANAS.some(cx => { const u = Math.abs(x - cx) / VENT.hw; return u <= 1 && y < VENT.sill && y >= VENT.ys - (VENT.ys - VENT.top) * ojiva(u); });
  const hazCas = (x, y) => {
    let v = 0;
    for (const cx of VENTANAS) {
      if (y < VENT.sill - 4) continue;
      const a = y - (VENT.sill - 4), c = cx + a * 0.32, w = 11 + a * 0.22;
      v = Math.max(v, Math.max(0, 1 - Math.abs(x - c) / w) * Math.max(0, 1 - a / 90) * (cx === 128 ? 1 : 0.8));
    }
    return v;
  };
  const lunaCas = (x, y) => lim(VENTANAS.reduce((v, cx) => v + foco(x, y, cx, 46, 42, 46, 1.5) * (cx === 128 ? 0.85 : 0.65), 0) + hazCas(x, y));
  const fuegoCas = (x, y) => lim(ANTORCHAS_CAS.reduce((v, [tx, ty]) => v + foco(x, y, tx, ty - 6, 36, 32, 1.5), 0));
  const ramCas = (x, y) => (umbral(x + 1, y + 2) < paso(fuegoCas(x, y), 0.3) ? CALIDO : umbral(x + 3, y) < paso(lunaCas(x, y), 0.38) ? LUNAR : GRIS);
  const luzCas = (x, y) => lunaCas(x, y) * 0.9 + fuegoCas(x, y);
  function castillo(g) {
    g.rect(0, 0, W, H, GRIS[0]);
    sillares(g, 0, 0, W, [7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 7], ramCas, (x, y) => 0.5 + luzCas(x, y) * 2.3 - vin(x, y), { sem: 61, ancho: 15, bisel: 0.6, junta: 1.3, vari: 0.5 });
    // bóveda nervada
    for (let x = 0; x < W; x++) {
      const [a, b] = x < 88 ? [-4, 88] : x < 168 ? [88, 168] : [168, 260];
      const c = (a + b) / 2, hw = (b - a) / 2, u = Math.abs(x - c) / hw, y = Math.round(16 - 13 * ojiva(u));
      for (let j = 0; j < y; j++) pon(g, x, j, ramCas(x, j), 0.4 + luzCas(x, j) - ((j + Math.round(u * 4)) % 4 === 0 ? 0.7 : 0));
      pon(g, x, y, ramCas(x, y), 3.2 + luzCas(x, y)); pon(g, x, y + 1, ramCas(x, y), 1.8 + luzCas(x, y)); g.set(x, y + 2, GRIS[0]);
    }
    for (const cx of VENTANAS) ventanal(g, cx);
    // pilares entre los ventanales
    for (const x of [83, 163]) columna(g, x, 11, 14, 97, ramCas, luzCas);
    for (const x of [-6, 251]) columna(g, x, 11, 14, 97, ramCas, luzCas);
    // friso de madera oscura con arcos tallados
    for (let y = 76; y < HZ; y++) for (let x = 0; x < W; x++) {
      const i = (x + 4) % 21, panel = i > 2 && i < 19 && y > 80 && y < 92, arco = panel && y < 84 && Math.abs(i - 10.5) > 7.5 - (y - 80) * 2;
      let v = 0.5 + Math.min(1, luzCas(x, y)) * 1.3;
      if (y === 76) v += 1.6; else if (y === 77) v += 0.6; else if (y === 79) v -= 1.2; else if (y >= 93) v -= 1 - (y === 93 ? -1.2 : 0);
      else if (panel && !arco) { v -= 0.4; if (i === 3 || y === 81) v -= 0.6; if (i === 18 || y === 91) v += 0.7; }
      else if (i === 0 || i === 2) v -= 0.6;
      pon(g, x, y, M, v - vin(x, y) * 0.6, 0.35);
    }
    for (const [x, y] of ESTANDARTES_CAS) estandarte(g, x, y, 15, 54);
    for (const [x, y] of ANTORCHAS_CAS) antorcha(g, x, y);
    // ajedrezado de mármol pulido, con el reflejo de los ventanales y la luz de la luna
    losas(g, HZ, [4, 5, 6, 7, 8, 9, 9], 20, 128, -80, LOSA_N, (x, y, k, f) => ((k + f) % 2 ? 1.4 : 0.9) + fuegoCas(x, y - 34) * 1.4 + hazCas(x, y) * 2.2 - vin(x, y), 77, GRIS[0], { ram2: LOSA_R, motas: 0.02, vari: 0.25, s: 0.6 });
    aclarar(g, 0, HZ, W, 30, [LOSA_N, LOSA_R], (x, y) => VENTANAS.reduce((v, cx) => v + (Math.abs(x - cx) < VENT.hw - 3 && (x - cx + 40) % 4 !== 0 ? 0.9 * (1 - (y - HZ) / 30) : 0), 0));
    for (const [tx] of ANTORCHAS_CAS) aclarar(g, tx - 2, HZ + 2, 5, 18, [LOSA_N, LOSA_R], (x, y) => (x === tx ? 1.4 : 0.6) * (1 - (y - HZ) / 20));
    telarana(g, 6, 14, 12, 1, 1);
    telarana(g, 250, 14, 12, -1, 1);
  }
  /* Ventanal apuntado con tracería: dos lancetas, un óculo y vidrio emplomado; detrás, la noche. */
  function ventanal(g, cx) {
    const { hw, top, ys, sill } = VENT;
    // derrame (abocinado) de piedra alrededor del vano
    const der = capaOjiva(cx, hw + 5, top - 5, ys, sill + 3), vano = capaOjiva(cx, hw, top, ys, sill);
    der.restar(vano);
    cada(der, (x, y) => {
      const lado = x < cx ? 1 : -1, v = (lado > 0 ? 2.6 : 1.3) + lunaCas(x, y) * 1.4 - (y >= sill ? -1 : 0);
      pon(g, x, y, LUNAR, v + (!der.tiene(x, y - 1) || !der.tiene(x - 1, y) ? 0.6 : 0) - (vano.tiene(x + 1, y) || vano.tiene(x - 1, y) || vano.tiene(x, y + 1) ? 1 : 0));
    });
    // el cielo nocturno
    cada(vano, (x, y) => {
      const lunaD = Math.hypot(x - LUNA[0], y - LUNA[1]);
      let v = 0.7 + (y / sill) * 2.2 + (cx === 128 ? Math.max(0, 1 - lunaD / 26) * 2 : 0);
      const nube = Math.sin(x * 0.21 + y * 0.05 + cx) * Math.sin(y * 0.33 + x * 0.04);
      if (nube > 0.55 && y > 40) v += 0.8;
      pon(g, x, y, NOCHE, v, 0.7);
    });
    if (cx === 128) {
      // halo y luna llena con sus mares
      cada(vano, (x, y) => { const d = Math.hypot(x - LUNA[0], y - LUNA[1]); if (d < 11 && umbral(x, y) < (11 - d) / 5) g.set(x, y, NOCHE[5]); });
      const [lx, ly] = LUNA;
      capa().ell(lx, ly, 5.5, 5.5).pintar(g, [HU[4]], { plano: 0 });
      for (const [x, y] of [[lx - 2, ly - 2], [lx - 1, ly - 2], [lx + 1, ly + 1], [lx + 2, ly + 1], [lx + 1, ly + 2], [lx - 2, ly + 2]]) g.set(x, y, HU[3]);
      for (let a = -0.4; a < 1.9; a += 0.05) g.set(Math.round(lx + Math.cos(a) * 5.5), Math.round(ly + Math.sin(a) * 5.5), HU[3]);
    } else for (let i = 0; i < 9; i++) {
      const x = Math.round(cx - hw + 2 + hash(i, cx, 9) * (hw * 2 - 4)), y = Math.round(top + 8 + hash(i, cx, 10) * 40);
      if (vano.tiene(x, y)) g.set(x, y, hash(i, cx, 11) > 0.6 ? HU[4] : HU[2]);
    }
    // emplomado en rombos, apenas visible
    cada(vano, (x, y) => { if ((x - cx + y) % 6 === 0 || (cx - x + y) % 6 === 0) { const k = NOCHE.indexOf(g.get(x, y)); if (k > 0) g.set(x, y, NOCHE[k - 1]); } });
    // tracería de piedra: parteluz, dos lancetas, óculo y travesaño
    const piedra = (x, y, v) => pon(g, x, y, GRIS, v * 0.7 + lunaCas(x, y) * 0.5);
    for (let y = 40; y < sill; y++) { piedra(cx - 1, y, 2.8); piedra(cx, y, 2); piedra(cx + 1, y, 0.9); }
    for (const s of [-1, 1]) {
      const c = cx + s * 7.5, l = capaOjiva(c, 6.5, 36, 44, 46), l2 = capaOjiva(c, 5.2, 38, 44, 47);
      l.restar(l2);
      cada(l, (x, y) => { if (y < 45) piedra(x, y, x < c ? 2.6 : 1.4); });
    }
    for (let a = 0; a < 6.283; a += 0.05) for (const r of [4, 5]) piedra(Math.round(cx + Math.cos(a) * r), Math.round(28 + Math.sin(a) * r), r === 4 ? (Math.sin(a) > 0 ? 3 : 1.4) : Math.sin(a) < 0 ? 3 : 1.2);
    for (let x = cx - hw; x <= cx + hw; x++) if (vano.tiene(x, 58)) { piedra(x, 58, 2.8); piedra(x, 59, 1.2); }
    // alféizar iluminado
    for (let x = cx - hw - 4; x <= cx + hw + 4; x++) { piedra(x, sill, 3.6); piedra(x, sill + 1, 2.2); piedra(x, sill + 2, 0.6); }
  }
  /* Estandarte de terciopelo granate con el murciélago del señor del castillo; cola de dos puntas. */
  function estandarte(g, x, y, w, largo) {
    for (let i = -2; i < w + 2; i++) g.set(x + i, y - 1, i === -2 || i === w + 1 ? B[4] : B[i < w / 2 ? 2 : 1]);
    for (let j = 0; j < largo; j++) for (let i = 0; i < w; i++) {
      const cola = j > largo - 8 && Math.abs(i - (w - 1) / 2) < (j - (largo - 8)) * 1.1;
      if (cola) continue;
      const borde = i === 0 || i === w - 1 || j === 1, pliegue = Math.sin((i / (w - 1)) * Math.PI * 2 - 0.6);
      g.set(x + i, y + j, borde ? B[i === 0 ? 3 : 2] : GR[lim(tono(x + i, y + j, 2 + pliegue * 0.9 + fuegoCas(x + i, y + j) * 0.8 - (j < 3 ? 0.6 : 0), 0.6), 0, 4)], GR);
    }
    for (let j = 0; j < largo - 8; j++) { g.set(x + 2, y + j, B[1]); g.set(x + w - 3, y + j, B[1]); }
    plantilla(g, ["x   x x   x", "xx  xxx  xx", "xxxxxxxxxxx", " xxxxxxxxx ", "  xx x xx  "], x + Math.round((w - 11) / 2), y + 14, { x: NE[0] });
    plantilla(g, ["  x  ", " xxx ", "xx xx", " xxx ", "  x  "], x + Math.round((w - 5) / 2), y + 26, { x: B[3] });
  }
  /* Antorcha en su argolla de hierro; la llama sale en la animación desde (x, y - 4). */
  function antorcha(g, x, y) {
    conBorde(g, NE[0], tmp => {
      capa().rect(x - 2, y + 4, 5, 2).pintar(tmp, HI, { relieve: 1, max: 3 });
      capa().rect(x - 1, y + 6, 3, 4).pintar(tmp, HI, { relieve: 1, max: 2 });
      capa().linea(x, y - 3, x, y + 8, 1).pintar(tmp, M, { plano: 2 });
      tmp.set(x, y + 9, M[1], M);
      capa().rect(x - 1, y - 3, 3, 3).pintar(tmp, TE, { relieve: 1, max: 2 });
      tmp.set(x - 1, y - 3, BRASA[3], BRASA).set(x, y - 3, F[3], F).set(x + 1, y - 3, BRASA[3], BRASA);
      for (let i = -2; i <= 2; i++) tmp.set(x + i, y + 3, HI[i < 0 ? 3 : 2], HI);
    });
  }
  function llamaAntorcha(ctx, x, y, t, fase) {
    const a = Math.sin(t / 83 + fase) + Math.sin(t / 137 + fase * 1.9), h = 6 + (a > 0.8 ? 1 : a < -0.8 ? -1 : 0), l = Math.sin(t / 170 + fase) > 0.5 ? 1 : Math.sin(t / 170 + fase) < -0.5 ? -1 : 0;
    ctx.fillStyle = F[2]; ctx.fillRect(x - 1, y - 3, 3, 3);
    ctx.fillStyle = F[3]; ctx.fillRect(x, y - h + 1, 1, h - 1); ctx.fillRect(x + l, y - h + 1, 1, 2);
    ctx.fillStyle = F[4]; ctx.fillRect(x, y - 3, 1, 2);
  }
  function castilloAnim(ctx, t) {
    ANTORCHAS_CAS.forEach(([x, y], i) => llamaAntorcha(ctx, x, y - 4, t, i * 2.3));
    // las colas de los estandartes ondean
    ESTANDARTES_CAS.forEach(([x, y], k) => {
      for (let j = 0; j < 4; j++) {
        const yy = y + 54 - 8 + j, d = Math.round(Math.sin(t / 360 + k * 1.3 + j * 0.7) * (j + 1) * 0.35), hueco = Math.ceil((j + 0.5) * 1.1);
        ctx.fillStyle = GR[1]; ctx.fillRect(x + d, yy, 7 - hueco, 1); ctx.fillRect(x + 8 + hueco + d, yy, 7 - hueco, 1);
        ctx.fillStyle = B[2]; ctx.fillRect(x + d, yy, 1, 1); ctx.fillRect(x + 14 + d, yy, 1, 1);
      }
    });
    // murciélagos que cruzan por detrás de los ventanales
    for (let k = 0; k < 2; k++) {
      const p = ((t / 1000) + k * 4.1) % 11;
      if (p > 2.6) continue;
      const cx = VENTANAS[(Math.floor((t / 1000 + k * 4.1) / 11) + k) % 3], x = Math.round(cx + 18 - p * 14), y = Math.round(30 + k * 10 + Math.sin(p * 5) * 3);
      if (enVentana(x, y) && enVentana(x - 3, y) && enVentana(x + 4, y)) murcielago(ctx, x, y, t, SO[0]);
    }
    // motas de polvo en los haces de luna
    motas(ctx, t, 14, 20, 74, 230, 62, [LUNAR[3], LUNAR[4]], hazCas, 5, 0.6);
  }

  /* =====================================================================
     La sala del trono de Varkhul: rosetón rojo, alfombra, trono y arañas de velas
     ===================================================================== */
  const ROSETON = [128, 41, 33];
  const ARANAS = [[56, 30], [200, 30]];                 // centro del aro de cada araña
  const BRAZOS_ARANA = [[-17, 0], [-9, 2], [0, 3], [9, 2], [17, 0]];
  const CANDELABROS = [[66, 60], [190, 60]];            // altura de las velas
  const rojoTr = (x, y) => foco(x, y, ROSETON[0], ROSETON[1] + 6, 96, 82, 1.3);
  const velasTr = (x, y) => lim(ARANAS.reduce((v, [ax, ay]) => v + foco(x, y, ax, ay - 2, 46, 36, 1.5), 0) + CANDELABROS.reduce((v, [cx, cy]) => v + foco(x, y, cx, cy - 2, 26, 30, 1.6) * 0.8, 0));
  const ramTr = (x, y) => (umbral(x + 1, y + 2) < paso(velasTr(x, y), 0.3) ? CALIDO : umbral(x + 3, y) < paso(rojoTr(x, y), 0.3) ? ROJIZO : GRIS);
  const luzTr = (x, y) => rojoTr(x, y) * 1.1 + velasTr(x, y);
  function trono(g) {
    g.rect(0, 0, W, H, GRIS[0]);
    sillares(g, 0, 0, W, [7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 6, 7, 7], ramTr, (x, y) => 0.4 + luzTr(x, y) * 2.1 - vin(x, y), { sem: 71, ancho: 13, bisel: 0.5, junta: 1.2, vari: 0.4 });
    // bóveda
    for (let x = 0; x < W; x++) {
      const [a, b] = x < 40 ? [-40, 40] : x < 216 ? [40, 216] : [216, 296];
      const c = (a + b) / 2, hw = (b - a) / 2, u = Math.abs(x - c) / hw, y = Math.round(14 - 12 * ojiva(u));
      for (let j = 0; j < y; j++) pon(g, x, j, ramTr(x, j), 0.3 + luzTr(x, j) - ((j + Math.round(u * 4)) % 4 === 0 ? 0.7 : 0));
      pon(g, x, y, ramTr(x, y), 3 + luzTr(x, y)); pon(g, x, y + 1, ramTr(x, y), 1.6 + luzTr(x, y)); g.set(x, y + 2, GRIS[0]);
    }
    roseton(g);
    // pilares y estandartes negros de Varkhul
    for (const x of [34, 212]) columna(g, x, 11, 12, 97, ramTr, luzTr);
    for (const x of [8, 230]) estandarteNegro(g, x, 18, 18, 60);
    cortinas(g);
    for (const [x] of CANDELABROS) candelabro(g, x);
    estrado(g);
    tronoVarkhul(g);
    for (const [x, y] of ARANAS) arana(g, x, y);
    // suelo de mármol negro pulido
    losas(g, HZ, [4, 5, 6, 7, 8, 9, 9], 22, 128, -80, LOSA_N, (x, y) => 0.9 + velasTr(x, y - 30) * 1.4 + rojoTr(x, y - 40) * 0.8 - vin(x, y), 77, GRIS[0], { motas: 0.02, vari: 0.4, s: 0.6 });
    tenir(g, 0, HZ, W, 30, LOSA_N, ROJIZO, (x, y) => rojoTr(x, y - 50) * 0.8);
    // reflejos de los candelabros en el suelo pulido
    for (const [cx] of CANDELABROS) aclarar(g, cx - 3, HZ + 2, 7, 22, [LOSA_N, ROJIZO], (x, y) => (Math.abs(x - cx) < 1 ? 1.6 : Math.abs(x - cx) < 3 ? 0.7 : 0.3) * (1 - (y - HZ) / 24));
    alfombra(g);
    telarana(g, 0, 0, 14, 1, 1);
    telarana(g, 255, 0, 14, -1, 1);
  }
  /* El gran rosetón: pétalos de vidrio granate y violeta, plomos negros y aro de piedra. */
  function roseton(g) {
    const [cx, cy, r] = ROSETON;
    for (let y = cy - r - 4; y <= cy + r + 4; y++) for (let x = cx - r - 4; x <= cx + r + 4; x++) {
      const d = Math.hypot(x - cx, y - cy), a = Math.atan2(y - cy, x - cx);
      if (d > r + 4) continue;
      if (d > r) { pon(g, x, y, ROJIZO, (d < r + 1.5 ? 3.4 : 2) + Math.cos(a + 2.36) * 0.8 - ((((a + Math.PI) / 6.283) * 24) % 1 < 0.08 ? 1.2 : 0)); continue; }
      const rn = d / r, u = ((a + Math.PI) / 6.283) * 12, sec = u % 1, pet = Math.abs(sec - 0.5) * 2;
      // doce lancetas que salen del óculo central, con tréboles entre sus puntas
      const lanceta = rn > 0.3 && rn < 0.9 && pet < 0.86 * Math.min(1, (0.92 - rn) * 4.5);
      const trebol = rn > 0.74 && Math.hypot((rn - 0.86) * 4.2, (1 - pet) * 1.25) < 0.42;
      let ram, v;
      if (rn < 0.12) { ram = B; v = 4 - rn * 10; }
      else if (rn < 0.3) { ram = Math.abs(((u * 2 / 3) % 1) - 0.5) < 0.25 ? GR : MG; v = 3.2 - rn * 3; }
      else if (lanceta) { ram = GR; v = 4.3 - rn * 1.9 - pet * 1.2; }
      else if (trebol) { ram = MG; v = 3.2; }
      else { ram = MG; v = 1.2 - rn * 0.6; }
      const plomo = Math.abs(rn - 0.12) < 0.03 || Math.abs(rn - 0.3) < 0.03 || (lanceta && (pet > 0.86 * Math.min(1, (0.92 - rn) * 4.5) - 0.12)) || (trebol && Math.hypot((rn - 0.86) * 4.2, (1 - pet) * 1.25) > 0.34);
      const col = plomo ? NE[0] : ram[lim(tono(x, y, v, 0.5), 0, 4)];
      g.set(x, y, col);
    }
  }
  /* Cortinas de terciopelo recogidas con cordón de oro y una galería con flecos. */
  function cortinas(g) {
    for (const s of [-1, 1]) {
      const borde = x => s < 0 ? x : 255 - x;
      for (let y = 6; y < HZ; y++) {
        const recogida = y < 62 ? 1 - Math.max(0, (y - 40) / 22) * 0.45 : 0.55 + Math.min(0.45, (y - 62) / 22);
        const ancho = Math.round(16 * recogida), x0 = 79;
        for (let i = 0; i < ancho; i++) {
          const xi = x0 + i, x = s < 0 ? xi : 255 - xi, pl = Math.sin(i * 1.2 + y * 0.02 * s);
          let v = 0.7 + pl * 0.9 + rojoTr(x, y) * 0.7 - (i === ancho - 1 ? 1 : 0) + (i === 0 ? 0.4 : 0) - (y > 90 ? 0.6 : 0);
          pon(g, borde(xi), y, GR, v, 0.5);
        }
      }
      for (let i = 0; i < 10; i++) { const x = borde(79 + i); g.set(x, 61, B[3]); g.set(x, 62, B[2]); }
      const bx = borde(88);
      for (let j = 0; j < 7; j++) g.set(bx, 63 + j, B[j < 5 ? 2 : 3]).set(bx + s, 63 + j, j > 3 ? B[3] : B[1]);
    }
    // galería superior con flecos de oro
    for (let x = 76; x < 180; x++) for (let y = 3; y < 10; y++) {
      const ondas = 7 + Math.round(Math.abs(Math.sin((x - 76) * 0.2)) * 2);
      if (y > ondas) continue;
      pon(g, x, y, GR, (y === 3 ? 2.6 : 1.4) + Math.sin((x - 76) * 0.2) * 0.3 + rojoTr(x, y) * 0.6 - (y === ondas ? 0.8 : 0), 0.4);
      if (y === ondas) { g.set(x, y + 1, x % 2 ? B[3] : B[2]); if (x % 2) g.set(x, y + 2, B[1]); }
    }
    for (let x = 74; x < 182; x++) g.set(x, 2, B[x < 128 ? 3 : 2]).set(x, 1, HI[1]);
  }
  /* Estandarte negro con el borde granate y la marca de Varkhul. */
  function estandarteNegro(g, x, y, w, largo) {
    for (let i = -2; i < w + 2; i++) g.set(x + i, y - 1, i === -2 || i === w + 1 ? B[4] : B[i < w / 2 ? 2 : 1]);
    for (let j = 0; j < largo; j++) for (let i = 0; i < w; i++) {
      const punta = j > largo - 9 && Math.abs(i - (w - 1) / 2) > (largo - j) * 1.05;
      if (punta) continue;
      const borde = i < 2 || i > w - 3, pl = Math.sin((i / (w - 1)) * Math.PI * 2 - 0.6);
      g.set(x + i, y + j, borde ? GR[i === 0 ? 3 : 2] : NE[lim(tono(x + i, y + j, 2 + pl * 0.8 + velasTr(x + i, y + j) * 0.5, 0.6), 0, 4)], borde ? GR : NE);
    }
    plantilla(g, ["x       x", "xx  x  xx", " xx x xx ", "  xxxxx  ", "   xxx   ", "    x    "], x + Math.round((w - 9) / 2), y + 16, { x: GR[3] });
    for (let k = 0; k < 3; k++) g.set(x + Math.round(w / 2) - 1 + k, y + 30 + k * 3, GR[2]);
  }
  /* Araña de hierro con cinco velas. */
  function arana(g, cx, cy) {
    cadena(g, cx, 0, cy - 14);
    conBorde(g, NE[0], tmp => {
      capa().ell(cx, cy - 12, 2, 2).pintar(tmp, B, { relieve: 1 });
      capa().rect(cx - 1, cy - 10, 3, 14).pintar(tmp, HI, { relieve: 1, max: 3 });
      for (const y of [cy - 6, cy + 1]) capa().ell(cx, y, 2.5, 1.5).pintar(tmp, B, { relieve: 1, max: 3 });
      capa().poly([[cx - 1, cy + 4], [cx + 1, cy + 4], [cx, cy + 9]]).pintar(tmp, HI, { relieve: 1, max: 3 });
      for (let a = 0; a < 6.283; a += 0.02) {
        const x = Math.round(cx + Math.cos(a) * 18), y = Math.round(cy + Math.sin(a) * 3);
        tmp.set(x, y, Math.sin(a) > 0 ? HI[3] : HI[1], HI);
      }
      for (const [dx, dy] of BRAZOS_ARANA) {
        cada(capa().curva(cx, cy - 2, cx + dx * 0.5, cy + dy + 2, cx + dx, cy + dy, 1), (x, y) => tmp.set(x, y, HI[2], HI));
        tmp.set(cx + dx - 1, cy + dy - 1, B[3], B).set(cx + dx, cy + dy - 1, B[4], B).set(cx + dx + 1, cy + dy - 1, B[2], B);
      }
    });
    for (const [dx, dy] of BRAZOS_ARANA) vela(g, cx + dx, cy + dy - 2, 4);
  }
  function candelabro(g, cx) {
    conBorde(g, NE[0], tmp => {
      capa().poly([[cx - 7, HZ + 4], [cx + 7, HZ + 4], [cx + 2, HZ - 1], [cx - 2, HZ - 1]]).pintar(tmp, HI, { relieve: 1.5, max: 3 });
      capa().rect(cx, 63, 1, HZ - 63).pintar(tmp, HI, { plano: 2 });
      for (const y of [72, 84]) capa().ell(cx, y, 1.6, 1.2).pintar(tmp, B, { relieve: 1, max: 3 });
      cada(capa().curva(cx - 7, 61, cx - 6, 68, cx, 68, 1).curva(cx + 7, 61, cx + 6, 68, cx, 68, 1), (x, y) => tmp.set(x, y, HI[2], HI));
      for (const dx of [-7, 0, 7]) tmp.set(cx + dx - 1, 62, B[3], B).set(cx + dx, 62, B[4], B).set(cx + dx + 1, 62, B[2], B);
    });
    for (const dx of [-7, 0, 7]) vela(g, cx + dx, 61, dx ? 4 : 6);
  }
  /* El estrado: cuatro escalones de mármol negro con la alfombra que sube hasta el trono. */
  function estrado(g) {
    const pasos = [[80, 176, 92, 5], [88, 168, 88, 4], [96, 160, 84, 4], [102, 154, 80, 4]];
    for (const [x0, x1, y0, h] of pasos) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x1; x++) {
      let v = (y === y0 ? 3.4 : y === y0 + 1 ? 2.2 : 1.4) + velasTr(x, y) * 1 + rojoTr(x, y) * 0.8 - (y === y0 + h - 1 ? 0.6 : 0);
      if (x === x0) v += 0.6; else if (x === x1 - 1) v -= 0.8;
      pon(g, x, y, LOSA_N, v, 0.4);
      if (y === y0 && (x === x0 + 3 || x === x1 - 4)) g.set(x, y, B[3]);
    }
    for (const [x0, x1, y0, h] of pasos) {
      const a = 128 - 16 - (y0 - 80) * 0.5, b = 128 + 16 + (y0 - 80) * 0.5;
      for (let y = y0; y < y0 + h; y++) for (let x = Math.round(a); x <= Math.round(b); x++) {
        const orla = x - a < 2 || b - x < 2;
        g.set(x, y, orla ? B[y === y0 ? 3 : 1] : GR[y === y0 ? 3 : y === y0 + 1 ? 2 : 1]);
      }
    }
  }
  /* El trono de Varkhul: respaldo de agujas negras, alas de murciélago, terciopelo y oro. */
  function tronoVarkhul(g) {
    const cx = 128;
    conBorde(g, NE[0], tmp => {
      // alas
      for (const s of [-1, 1]) {
        const ala = capa().poly([[cx + s * 15, 27], [cx + s * 21, 15], [cx + s * 29, 11], [cx + s * 27, 21], [cx + s * 28, 31], [cx + s * 24, 28], [cx + s * 21, 36], [cx + s * 18, 32], [cx + s * 15, 38]]);
        ala.pintar(tmp, NE, { relieve: 2, max: 3, sesgo: s < 0 ? 0.05 : -0.1 });
        for (const [x1, y1] of [[cx + s * 29, 11], [cx + s * 28, 31], [cx + s * 21, 36]]) cada(capa().linea(cx + s * 16, 27, x1, y1, 1), (x, y) => { if (ala.tiene(x, y)) tmp.set(x, y, NE[4], NE); });
      }
      // respaldo con agujas
      const resp = capa().rect(cx - 15, 22, 31, 42);
      for (const [dx, h] of [[-15, 10], [-8, 14], [0, 22], [8, 14], [15, 10]]) resp.poly([[cx + dx - 2.5, 22], [cx + dx, 22 - h], [cx + dx + 2.5, 22]]);
      resp.pintar(tmp, NE, { relieve: 2.5, max: 3 });
      for (const [dx, h] of [[-15, 10], [-8, 14], [0, 22], [8, 14], [15, 10]]) { tmp.set(cx + dx, 22 - h, B[4], B); tmp.set(cx + dx, 23 - h, B[3], B); }
      // marco de oro y terciopelo capitoné
      capa().rect(cx - 11, 27, 23, 35).pintar(tmp, B, { relieve: 1.5, max: 4 });
      capa().rect(cx - 9, 29, 19, 32).ell(cx, 29, 9.5, 5).pintar(tmp, GR, { relieve: 3, max: 3, sesgo: -0.1 });
      for (let y = 30; y < 60; y += 5) for (let x = cx - 7; x <= cx + 7; x += 5) { const dx = ((y - 30) / 5) % 2 ? 2 : 0; if (x + dx <= cx + 8) tmp.set(x + dx, y, GR[0], GR).set(x + dx - 1, y - 1, GR[3], GR); }
      // calavera coronada con la gema
      craneo(tmp, cx - 3, 13, HU);
      tmp.set(cx - 2, 16, GR[4], GR).set(cx + 2, 16, GR[4], GR);
      capa().ell(cx, 25, 2, 2).pintar(tmp, GR, { relieve: 1.5 });
      tmp.set(cx - 1, 24, HU[4], HU);
      // brazos con cabezas de murciélago
      for (const s of [-1, 1]) {
        capa().rect(s < 0 ? cx - 23 : cx + 16, 52, 8, 14).pintar(tmp, NE, { relieve: 1.5, max: 3, sesgo: -0.05 });
        for (let i = 0; i < 8; i++) tmp.set((s < 0 ? cx - 23 : cx + 16) + i, 52, B[i < 4 ? 4 : 3], B);
        const hx = s < 0 ? cx - 23 : cx + 23;
        tmp.set(hx, 50, NE[3], NE).set(hx - s * 2, 50, NE[3], NE).set(hx - s, 51, NE[2], NE).set(hx - s, 53, GR[4], GR);
      }
      // asiento, cojín y patas
      capa().rect(cx - 16, 60, 33, 6).pintar(tmp, GR, { relieve: 2, max: 4 });
      capa().rect(cx - 16, 66, 33, 10).pintar(tmp, NE, { relieve: 2, max: 3 });
      for (let x = cx - 16; x <= cx + 16; x++) tmp.set(x, 66, B[x < cx ? 4 : 3], B);
      for (const dx of [-16, 13]) capa().rect(cx + dx, 66, 4, 14).pintar(tmp, NE, { relieve: 1.5, max: 3 });
      for (const dx of [-15, 14]) tmp.set(cx + dx, 78, B[3], B).set(cx + dx + 1, 78, B[2], B);
      plantilla(tmp, [" x x ", "xxxxx", " xxx ", "  x  "], cx - 2, 69, { x: B[2] });
    });
  }
  /* Alfombra roja con orla de oro que llega hasta el estrado. */
  function alfombra(g) {
    for (let y = HZ + 1; y < H; y++) {
      const t = (y - HZ) / (H - HZ), a = 128 - (20 + t * 22), b = 128 + (20 + t * 22);
      for (let x = Math.round(a); x <= Math.round(b); x++) {
        const da = x - a, db = b - x, orla = da < 3 || db < 3, filete = da < 1 || db < 1;
        const rombo = Math.abs(x - 128) / (1 + t) + Math.abs(((y - HZ) % 10) - 5) * 1.2 < 4;
        const gr = !orla && (Math.abs(da - 5 - t * 2) < 0.7 || Math.abs(db - 5 - t * 2) < 0.7);
        if (filete) g.set(x, y, B[1]);
        else if (orla) g.set(x, y, (x + y) % 4 === 0 ? B[4] : B[da < 2 || db < 2 ? 3 : 2]);
        else if (rombo) g.set(x, y, (Math.abs(x - 128) < 1 ? B[3] : GR[3]));
        else if (gr) g.set(x, y, B[1]);
        else pon(g, x, y, GR, 1.4 + velasTr(x, y - 30) * 0.8 + rojoTr(x, y - 40) * 0.6 - (y - HZ) * 0.004, 0.5);
      }
      if (y < HZ + 3) for (let x = Math.round(a); x <= Math.round(b); x++) aclarar(g, x, y, 1, 1, [GR], () => -0.6);
    }
  }
  function tronoAnim(ctx, t) {
    let i = 0;
    for (const [ax, ay] of ARANAS) for (const [dx, dy] of BRAZOS_ARANA) llama(ctx, ax + dx, ay + dy - 7, t, (i++) * 1.7, true);
    for (const [cx] of CANDELABROS) for (const dx of [-7, 0, 7]) llama(ctx, cx + dx, 61 - (dx ? 4 : 6) - 1, t, (i++) * 1.3, true);
    // destellos en los vidrios del rosetón
    for (let k = 0; k < 3; k++) {
      if (Math.sin(t / 650 + k * 2.1) < 0.7) continue;
      const a = hash(k, Math.floor(t / 650), 2) * 6.283, d = 12 + hash(k, Math.floor(t / 650), 3) * 15;
      const x = Math.round(ROSETON[0] + Math.cos(a) * d), y = Math.round(ROSETON[1] + Math.sin(a) * d);
      if (x > 110 && x < 146 && y > 6) continue;
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 1);
    }
    // la gema del trono late
    if (Math.sin(t / 900) > 0.2) { ctx.fillStyle = GR[4]; ctx.fillRect(127, 24, 2, 2); ctx.fillStyle = HU[4]; ctx.fillRect(127, 24, 1, 1); }
    // polvo en la luz roja
    motas(ctx, t, 8, 90, 40, 76, 56, [ROJIZO[4], GR[4]], (x, y) => (x > 110 && x < 146 && y < 80 ? 0 : rojoTr(x, y)), 9, 0.5);
  }

  window.FONDOS_HD = window.FONDOS_HD || {};
  Object.assign(window.FONDOS_HD, {
    sotano: { base: sotano, anim: sotanoAnim },
    cripta: { base: cripta, anim: criptaAnim },
    mina: { base: mina, anim: minaAnim },
    forja: { base: forja, anim: forjaAnim },
    castillo: { base: castillo, anim: castilloAnim },
    trono: { base: trono, anim: tronoAnim }
  });
})();
