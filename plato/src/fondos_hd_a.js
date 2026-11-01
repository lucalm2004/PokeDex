/* Dados y Mazmorras · escenarios en alta definición (256×144), primera parte:
   la taberna de El Grifo Tuerto, Villabruma, el camino del bosque, el Bosque de los Susurros,
   el puente del trol y la encrucijada donde el grupo elige su camino.
   Cada entrada de FONDOS_HD es { base(g), anim(ctx, t) } como en fondos.js: base pinta el fondo fijo en una
   Rejilla de 256×144 y anim dibuja encima, en cada fotograma, los pocos detalles animados (t en milisegundos).
   El suelo donde pisan los personajes queda en y≈118–140 y se mantiene tranquilo para que se lean bien. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, azar } = PX;
  const W = 256, H = 144;
  const capa = () => new Capa(W, H);
  const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const M = R.madera, F = R.fuego, B = R.bronce, P = R.piedra, HU = R.hueso, HO = R.hoja, MA = R.mar, SO = R.sombra, HI = R.hierro, PL = R.plata;
  const TE = R.tela.terracota, NE = R.tela.negro, AZ = R.tela.azul, GR = R.tela.granate, OC = R.tela.ocre, OL = R.tela.oliva, VI = R.tela.violeta, MG = R.magia;
  const PM = R.piel.morena;
  /* Rampas propias, en el mismo tono apagado que fondos.js. */
  const GRIS = ["#15161b", "#25272e", "#3b3e47", "#5a5e68", "#868a92"];      // piedra fría
  const MUSGO = ["#0b1510", "#14261a", "#213d27", "#365c34", "#5a8346"];     // bosque profundo
  const ESPECTRO = ["#0b1618", "#122e2d", "#1f5450", "#3b8a7a", "#8cd6ba"];  // luz fantasmal de las setas
  const LADRILLO = ["#2a0f0a", "#4a1c12", "#6e2e1c", "#94462a", "#b8653c"];  // ladrillo viejo
  const NOCHE = ["#0a0b18", "#111530", "#1b2148", "#2a3160", "#3e3f78"];     // cielo nocturno
  const PRADO = ["#16200f", "#25351a", "#3b5224", "#5c7432", "#8b9a48"];     // hierba al sol de la tarde
  const TIERRA = ["#2a1a10", "#4a2f1c", "#6e4a2c", "#987040", "#c09a5e"];    // tierra del camino

  /* ---------- Herramientas (las mismas ideas que fondos.js, a 256×144) ---------- */
  /* Tono con tramado ordenado; s = anchura del tramado entre dos tonos (1 = todo tramado, 0 = bandas planas). */
  const tono = (x, y, v, s = 1) => Math.floor(v + 0.5 + (umbral(x, y) - 0.5) * s);
  /* Rellena una zona con una rampa según f(x, y), que da el tono (0 = sombra … n-1 = brillo); null no pinta. */
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
  /* Recorre los píxeles de una capa. */
  function cada(c, fn) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (c.m[y * W + x]) fn(x, y);
  }
  /* Azar sin estado: un valor fijo en [0, 1) para cada par de enteros. */
  function hash(i, j, s = 0) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  /* Ruido suave de valor (interpolado) para manchas, nubes y texturas. */
  function ruido(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s = 0) => ruido(x, y, s) * 0.55 + ruido(x * 2.1, y * 2.1, s + 7) * 0.3 + ruido(x * 4.3, y * 4.3, s + 13) * 0.15;
  /* Mueve un píxel d tonos dentro de su propia rampa (luz y sombra sobre lo ya pintado). */
  function desplazar(g, x, y, d) {
    if (!d) return;
    const ram = g.rampa(x, y);
    if (!ram) return;
    const k = ram.indexOf(g.get(x, y));
    if (k >= 0) g.set(x, y, ram[lim(k + d, 0, ram.length - 1)], ram);
  }
  /* Luz (o sombra, si f es negativa) tramada sobre una zona: f(x, y) da cuántos tonos subir. */
  function iluminar(g, x0, y0, w, h, f, s = 1) {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const v = f(x, y);
      if (v) desplazar(g, x, y, tono(x, y, v, s));
    }
  }
  /* Velo de bruma: tramado de un color encima, con densidad f(x, y) ∈ [0, 1]. */
  function velo(g, x0, y0, w, h, f, col, ram = null) {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const d = f(x, y);
      if (d > 0 && umbral(x, y) < d) g.set(x, y, typeof col === "function" ? col(x, y) : col, ram);
    }
  }
  /* Dibuja una plantilla de texto (una fila por cadena) con un color por letra; " " es transparente. */
  function plantilla(g, filas, x, y, colores, espejo = false) {
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        const c = colores[fila[i]];
        if (c) g.set(espejo ? x + fila.length - 1 - i : x + i, y + j, c);
      }
    });
  }
  /* Escribe con las letras de 3×5 del motor directamente en una rejilla. */
  function escribir(g, texto, x, y, color, borde = null) {
    const lienzo = { fillStyle: "", fillRect(px, py, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(px + i, py + j, this.fillStyle); } };
    PX.texto(lienzo, texto, x, y, color, borde);
  }
  /* Contraluz: los píxeles de una capa que dan hacia la luz (dx, dy) toman el color del borde. */
  function contraluz(g, c, col, dx, dy) {
    cada(c, (x, y) => { if (!c.tiene(x + dx, y + dy)) g.set(x, y, typeof col === "function" ? col(x, y) : col); });
  }

  /* Teselas de Voronoi (roca): para cada píxel de la caja, la celda más cercana, la vecina y la distancia al borde. */
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
  /* Roca facetada: base(x, y) da el tono, haciaLuz(x, y) = [lx, ly, fuerza]. Grieta entre bloques, bisel dentro. */
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
  /* Sillería: filas de bloques escalonados con bisel (luz desde arriba a la izquierda). */
  function sillares(g, x0, y0, x1, filas, ram, tonoEn, op = {}) {
    const az = azar(op.sem || 1), n = ram.length - 1, an = op.ancho || 12, bis = op.bisel ?? 0.7;
    let y = y0;
    for (const alto of filas) {
      let x = x0 - Math.floor(az() * an);
      while (x < x1) {
        const w = Math.max(3, Math.round(an * (0.65 + az() * 0.7))), vb = (az() - 0.5) * (op.vari ?? 0.6);
        for (let j = 0; j < alto; j++) for (let i = 0; i < w; i++) {
          const px = x + i, py = y + j;
          if (px < x0 || px >= x1 || (op.masc && !op.masc.tiene(px, py))) continue;
          let v = tonoEn(px, py);
          if (j === alto - 1 || i === w - 1) v -= op.junta ?? 1.6;
          else {
            v += vb;
            if (j === 0) v += bis; else if (j === alto - 2) v -= bis * 0.6;
            if (i === 0) v += bis * 0.4; else if (i === w - 2) v -= bis * 0.3;
          }
          g.set(px, py, ram[lim(tono(px, py, v, op.s ?? 0.3), 0, n)], ram);
        }
        x += w;
      }
      y += alto;
    }
    return g;
  }
  /* Enlosado en perspectiva: filas cada vez más altas hacia delante, juntas que convergen hacia (vx, yh). */
  function losas(g, y0, filas, ancho, vx, yh, ram, tonoEn, sem, junta) {
    const az = azar(sem), n = ram.length - 1;
    let ya = y0;
    filas.forEach(alto => {
      const off = az() * ancho, vari = Array.from({ length: 40 }, () => (az() - 0.5) * 0.7);
      for (let y = ya; y < ya + alto && y < H; y++) {
        const esc = (y - yh) / (H - yh);
        for (let x = 0; x < W; x++) {
          const u = vx + (x - vx) / esc + off, k = Math.floor(u / ancho), k1 = Math.floor((vx + (x + 1 - vx) / esc + off) / ancho);
          if (y === ya || k1 !== k) { g.set(x, y, junta(x, y, k), null); continue; }
          let v = tonoEn(x, y, k) + vari[((k % 40) + 40) % 40];
          if (y === ya + 1) v += 0.4;
          g.set(x, y, ram[lim(tono(x, y, v, 0.25), 0, n)], ram);
        }
      }
      ya += alto;
    });
  }
  /* Adoquines redondeados en perspectiva (celdas de Voronoi en el plano del suelo). */
  function adoquines(g, y0, vx, yh, tam, ram, tonoEn, junta, vari = 0.8) {
    const n = ram.length - 1, alto = H - yh;
    for (let y = y0; y < H; y++) {
      const esc = (y - yh) / alto, v = (alto * Math.log(alto / (y - yh))) / tam;
      for (let x = 0; x < W; x++) {
        const u = (x - vx) / esc / tam;
        let d1 = 9, d2 = 9, k = null;
        const i0 = Math.floor(u), j0 = Math.floor(v);
        for (let j = j0 - 1; j <= j0 + 1; j++) for (let i = i0 - 1; i <= i0 + 1; i++) {
          const cu = i + 0.5 + (j & 1) * 0.5 + (hash(i, j, 1) - 0.5) * 0.45, cv = j + 0.5 + (hash(i, j, 2) - 0.5) * 0.35;
          const d = Math.hypot(u - cu, (v - cv) * 1.15);
          if (d < d1) { d2 = d1; d1 = d; k = [i, j, cu, cv]; } else if (d < d2) d2 = d;
        }
        const borde = ((d2 - d1) / 2) * tam * esc;
        if (borde < 0.55) { g.set(x, y, typeof junta === "function" ? junta(x, y) : junta, null); continue; }
        let t = tonoEn(x, y) + (hash(k[0], k[1], 3) - 0.5) * vari;
        if (borde < 1.9) t += ((u - k[2]) < 0 && (v - k[3]) > 0 ? 0.9 : (u - k[2]) > 0 && (v - k[3]) < 0 ? -0.9 : 0) * (1 - borde / 1.9);
        g.set(x, y, ram[lim(tono(x, y, t, 0.2), 0, n)], ram);
      }
    }
  }

  /* ---------- Atrezo ---------- */
  /* Tonel de pie: duelas, aros de hierro y tapa. */
  function tonel(g, x, y, w, h, op = {}) {
    conBorde(g, op.borde || M[0], tmp => {
      const c = capa(), cx = x + (w - 1) / 2;
      for (let j = 0; j < h; j++) { const hw = (w / 2) * (0.86 + 0.14 * Math.sin((Math.PI * j) / (h - 1))); c.rect(Math.round(cx - hw + 0.5), y + j, Math.round(hw * 2), 1); }
      c.pintar(tmp, M, { relieve: 4, sesgo: op.sesgo || 0, max: op.max ?? 4 });
      cada(c, (px, py) => { if ((px - x) % 4 === 0 && py > y + 2) tmp.set(px, py, M[1], M); });
      for (const f of [0.16, 0.8]) { const yy = y + Math.round(h * f); cada(c, (px, py) => { if (py === yy || py === yy + 1) tmp.set(px, py, HI[py === yy ? (px < cx ? 4 : 3) : 1], HI); }); }
      for (let i = 1; i < w - 1; i++) { tmp.set(x + i, y, M[i < w / 2 ? 3 : 2], M); tmp.set(x + i, y + 1, M[1], M); }
    });
  }
  /* Tonel tumbado visto de frente: tablas, aros y espita. */
  function tonelTumbado(g, cx, cy, r, op = {}) {
    conBorde(g, op.borde || M[0], tmp => {
      const c = capa().ell(cx, cy, r, r);
      c.pintar(tmp, M, { relieve: r * 0.7, sesgo: op.sesgo || 0, max: op.max ?? 4 });
      cada(c, (x, y) => { if ((x - Math.round(cx) + 40) % 4 === 0 && Math.hypot(x - cx, y - cy) < r - 3) tmp.set(x, y, M[1], M); });
      for (let a = 0; a < 6.283; a += 0.03) {
        tmp.set(Math.round(cx + Math.cos(a) * (r - 0.6)), Math.round(cy + Math.sin(a) * (r - 0.6)), HI[Math.sin(a + 0.6) < -0.3 ? 4 : Math.sin(a + 0.6) < 0.3 ? 2 : 1], HI);
        tmp.set(Math.round(cx + Math.cos(a) * (r - 1.6)), Math.round(cy + Math.sin(a) * (r - 1.6)), HI[1], HI);
        tmp.set(Math.round(cx + Math.cos(a) * (r - 3)), Math.round(cy + Math.sin(a) * (r - 3)), M[1], M);
      }
      if (op.espita) {
        const ex = Math.round(cx), ey = Math.round(cy + r * 0.4);
        tmp.set(ex - 1, ey, B[2], B).set(ex, ey, B[4], B).set(ex + 1, ey, B[2], B).set(ex, ey + 1, B[3], B).set(ex, ey + 2, B[1], B);
      }
    });
  }
  /* Cajón de madera con refuerzo en aspa. */
  function cajon(g, x, y, w, h, sesgo = 0) {
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, w, h).pintar(tmp, M, { relieve: 1.5, sesgo, max: 3 });
      for (let i = 0; i < w; i++) { tmp.set(x + i, y, M[3], M); tmp.set(x + i, y + 1, M[3], M); tmp.set(x + i, y + h - 1, M[1], M); }
      for (let j = 0; j < h; j++) { tmp.set(x, y + j, M[2], M); tmp.set(x + 1, y + j, M[2], M); tmp.set(x + w - 1, y + j, M[1], M); }
      cada(capa().linea(x + 2, y + h - 2, x + w - 2, y + 2, 2), (px, py) => tmp.set(px, py, M[3], M));
      for (const [a, b] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2]]) tmp.set(a, b, HI[3], HI);
    });
  }
  /* Vela de cera de pie; la llama se dibuja en la animación (mecha en x, y - alto). */
  function vela(g, x, y, alto, gorda = false) {
    for (let j = 0; j < alto; j++) {
      g.set(x, y - j, HU[j === alto - 1 ? 4 : 3], HU);
      if (gorda) g.set(x + 1, y - j, HU[2], HU);
    }
    if (alto > 2) g.set(x + (gorda ? 2 : 1), y - 2, HU[2], HU).set(x - 1, y - 1, HU[3], HU);
    g.set(x, y - alto, NE[1]);
  }
  /* Llama de vela: dos trazos que tiemblan. */
  function llamaVela(ctx, x, y, t, fase = 0) {
    const a = Math.sin(t / 77 + fase) + Math.sin(t / 131 + fase * 1.7);
    const alto = a > 1 ? 4 : a < -1.1 ? 2 : 3, lado = Math.sin(t / 190 + fase) > 0.6 ? 1 : 0;
    ctx.fillStyle = F[3]; ctx.fillRect(x, y - alto, 1, alto);
    ctx.fillStyle = F[4]; ctx.fillRect(x + lado, y - 2, 1, 2 - lado);
  }
  /* Lengua de fuego con base en (cx, by), a franjas de dos píxeles para no gastar demasiados rectángulos. */
  const CAPAS_FUEGO = [[2, 1, 1], [3, 0.6, 0.62], [4, 0.26, 0.32]];
  function lengua(ctx, cx, by, ancho, alto, t, fase) {
    const hT = alto * (0.74 + 0.26 * Math.sin(t / 97 + fase * 3.1) * Math.sin(t / 61 + fase));
    for (const [k, kw, kh] of CAPAS_FUEGO) {
      ctx.fillStyle = F[k];
      const hk = hT * kh;
      for (let j = 0; j < hk; j += 2) {
        const hw = (ancho / 2) * Math.pow(1 - j / hk, 0.7) * kw * (1 + 0.14 * Math.sin(t / 53 + j + fase));
        const s = Math.sin(t / 140 + fase + j * 0.45) * (j / hT) * 2.4;
        const x0 = Math.round(cx + s - hw), x1 = Math.round(cx + s + hw);
        ctx.fillRect(x0, by - j - 1, Math.max(1, x1 - x0), 2);
      }
    }
  }
  /* Chispas que suben desde (cx, by). */
  function chispas(ctx, cx, by, n, alto, t, fase = 0, evitar = null) {
    for (let i = 0; i < n; i++) {
      const p = (t / 1700 + i * 0.618 + fase) % 1;
      if (p > 0.85) continue;
      const x = Math.round(cx + Math.sin(i * 7.3 + p * 5) * 5 + (i - n / 2) * 2), y = Math.round(by - p * alto);
      if (evitar && x >= evitar[0] && x < evitar[2] && y >= evitar[1] && y < evitar[3]) continue;
      ctx.fillStyle = p < 0.4 ? F[4] : p < 0.65 ? F[3] : F[2];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  /* Luciérnagas: puntos que flotan y se encienden a ratos dentro de una caja. */
  function luciernagas(ctx, t, n, x0, y0, w, h, cols, sem = 1) {
    for (let i = 0; i < n; i++) {
      const fase = (t / 1000) * (0.35 + hash(i, sem, 1) * 0.4) + hash(i, sem, 2) * 6.28;
      const brillo = Math.sin(fase * 1.7 + i);
      if (brillo < 0) continue;
      const x = Math.round(x0 + hash(i, sem, 3) * w + Math.sin(fase) * 7), y = Math.round(y0 + hash(i, sem, 4) * h + Math.sin(fase * 0.7 + 1) * 5);
      ctx.fillStyle = brillo > 0.6 ? cols[1] : cols[0];
      ctx.fillRect(x, y, 1, 1);
      if (brillo > 0.88 && cols[2]) { ctx.fillStyle = cols[2]; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
    }
  }
  /* Jirones de niebla que se deslizan: tiras horizontales finas. */
  function jirones(ctx, t, n, x0, y0, w, h, cols, vel = 4, sem = 2) {
    for (let i = 0; i < n; i++) {
      const largo = 10 + Math.floor(hash(i, sem, 1) * 22), y = Math.round(y0 + hash(i, sem, 2) * h);
      const x = Math.round(x0 + ((hash(i, sem, 3) * (w + 50) + (t / 1000) * vel * (0.6 + hash(i, sem, 4))) % (w + 50)) - 25);
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(x, y, largo, 1);
      ctx.fillRect(x + 4, y - 1, Math.max(2, largo - 10), 1);
    }
  }
  /* Hojas que caen meciéndose desde una franja (x0..x0+w, y0) hasta yFin. */
  function hojas(ctx, t, n, x0, y0, w, yFin, cols, sem = 3, vel = 0.08) {
    for (let i = 0; i < n; i++) {
      const p = ((t / 1000) * (vel + hash(i, sem, 1) * vel * 0.6) + hash(i, sem, 2)) % 1;
      if (p > 0.94) continue;
      const x = Math.round(x0 + hash(i, sem, 3) * w + Math.sin(p * 12 + i) * 6 + p * 20), y = Math.round(y0 + p * (yFin - y0));
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(x, y, Math.sin(p * 24 + i) > 0 ? 2 : 1, 1);
    }
  }
  /* Pino: pisos triangulares con bordes dentados. plano = tono fijo (silueta) o undefined para modelar. */
  function pino(g, x, by, alto, ancho, ram, op = {}) {
    const c = capa(), pisos = op.pisos || Math.max(3, Math.round(alto / 7));
    for (let p = 0; p < pisos; p++) {
      const t0 = p / pisos, yTop = by - alto + t0 * alto * 0.9, yBot = Math.min(by - alto * 0.1, yTop + (alto / pisos) * 1.75);
      const w = ancho * (0.22 + 0.78 * ((p + 1) / pisos));
      c.poly([[x, yTop], [x + w / 2, yBot], [x + w * 0.18, yBot - 1], [x, yBot + 0.5], [x - w * 0.2, yBot - 1], [x - w / 2, yBot]]);
      for (let k = -3; k <= 3; k++) if (hash(x + p, k, by) > 0.45) c.off(Math.round(x + (k * w) / 7), Math.round(yBot));
    }
    c.rect(x - Math.max(0.5, ancho * 0.05), by - alto * 0.14, Math.max(1, ancho * 0.1), alto * 0.14);
    if (op.plano !== undefined) cada(c, (px, py) => g.set(px, py, typeof op.plano === "function" ? op.plano(px, py) : ram[op.plano], ram));
    else c.pintar(g, ram, { relieve: op.relieve || 2, luz: op.luz, sesgo: op.sesgo || 0, max: op.max, min: op.min, separar: op.separar });
    return c;
  }
  /* Copa de árbol frondoso: masas redondeadas con hojas sueltas en el borde y racimos de brillo. */
  function copa(g, masas, ram, sem, op = {}) {
    const c = capa(), az = azar(sem);
    for (const [x, y, rx, ry] of masas) c.ell(x, y, rx, ry);
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) && az() < 0.4) c.on(x, y - 1); if (!c.tiene(x - 1, y) && az() < 0.3) c.on(x - 1, y); if (!c.tiene(x, y + 1) && az() < 0.3) c.on(x, y + 1); });
    c.pintar(g, ram, { relieve: op.relieve || 4, luz: op.luz, sesgo: op.sesgo || 0, max: op.max, min: op.min });
    for (const [x, y, rx, ry] of masas) for (let i = 0; i < rx * ry * 0.35; i++) {
      const px = Math.round(x + (az() - 0.5) * rx * 1.7), py = Math.round(y + (az() - 0.5) * ry * 1.7);
      if (!c.tiene(px, py) || !c.tiene(px + 1, py) || !c.tiene(px, py + 1)) continue;
      const k = ram.indexOf(g.get(px, py));
      if (k >= 0) g.set(px, py, ram[Math.min(ram.length - 1, k + 1)], ram).set(px + 1, py + 1, ram[Math.max(0, k - 1)], ram);
    }
    return c;
  }
  /* Tronco o rama: tramos de línea gruesa con corteza. */
  function tronco(g, pts, grueso, ram, op = {}) {
    const c = capa();
    for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], grueso[i]);
    c.pintar(g, ram, { relieve: op.relieve || 2, luz: op.luz || [-0.85, -0.3, 0.5], max: op.max ?? 3, sesgo: op.sesgo || 0 });
    cada(c, (x, y) => {
      if (!c.tiene(x - 1, y) || !c.tiene(x + 1, y)) return;
      const v = ruido(x * 0.5, y * 0.08, 4);
      if (v < 0.3) desplazar(g, x, y, -1);
      else if (v > 0.78 && c.tiene(x - 2, y)) desplazar(g, x, y, 1);
    });
    return c;
  }
  /* Farol de hierro de 7×11 con cristales encendidos (la llama late en la animación). */
  function farol(g, x, y) {
    conBorde(g, NE[0], tmp => {
      tmp.set(x, y - 6, HI[3], HI).set(x, y - 5, HI[2], HI);
      for (let i = -2; i <= 2; i++) tmp.set(x + i, y - 4 + Math.abs(i) * 0, HI[i < 0 ? 3 : 2], HI);
      for (let i = -3; i <= 3; i++) tmp.set(x + i, y - 3, HI[i < 0 ? 3 : 1], HI);
      capa().rect(x - 3, y - 2, 7, 8).pintar(tmp, OC, { plano: 4 });
      for (let j = -2; j < 6; j++) { tmp.set(x - 3, y + j, HI[2], HI); tmp.set(x + 3, y + j, HI[1], HI); tmp.set(x, y + j, HI[1], HI); }
      for (let j = -1; j < 5; j++) { tmp.set(x - 2, y + j, j < 1 ? OC[4] : OC[3], OC); tmp.set(x + 2, y + j, OC[3], OC); tmp.set(x + 1, y + j, j > 2 ? F[3] : OC[4], F); tmp.set(x - 1, y + j, j > 2 ? F[3] : OC[4], F); }
      for (let i = -3; i <= 3; i++) tmp.set(x + i, y + 6, HI[i < 0 ? 2 : 1], HI);
      tmp.set(x, y + 7, HI[1], HI);
    });
  }
  function llamaFarol(ctx, x, y, t, fase = 0) {
    const a = Math.sin(t / 90 + fase) + Math.sin(t / 157 + fase * 2.3);
    ctx.fillStyle = a > 0.6 ? F[4] : a < -0.6 ? F[2] : F[3];
    ctx.fillRect(x - 1, y + 2, 3, 3);
    ctx.fillStyle = a > -0.2 ? HU[4] : F[4];
    ctx.fillRect(x, y + (a > 0.9 ? 1 : 2), 1, a > 0.9 ? 3 : 2);
  }
  /* Calavera pequeña de 7×7. */
  function calavera(g, x, y, mira = 0) {
    plantilla(g, ["  aab  ", " aaaabc", "aaaabbc", "a##b##c", "ab#.#bc", " bbbbc ", "  b.c  "], x, y, { a: HU[4], b: HU[3], c: HU[1], "#": SO[0], ".": HU[1] }, mira < 0);
  }

  /* ======================================================================
     La taberna de El Grifo Tuerto
     ====================================================================== */
  const FUEGO_T = [22, 90];
  const VELAS_T = [[108, 33], [114, 33], [126, 33], [132, 33], [44, 50], [194, 74]];
  const FAROLES_T = [[216, 44], [60, 24]];
  const luzT = (x, y) => lim(
    Math.max(0, 1 - Math.hypot((x - FUEGO_T[0]) / 150, (y - FUEGO_T[1]) / 100)) ** 1.25 +
    Math.max(0, 1 - Math.hypot((x - 120) / 70, (y - 36) / 46)) ** 1.6 * 0.55 +
    Math.max(0, 1 - Math.hypot((x - 216) / 40, (y - 48) / 40)) ** 1.6 * 0.5);
  function taberna(g) {
    g.rect(0, 0, W, H, M[0]);
    // techo: tablas, viguetas y viga maestra, alumbrados desde abajo
    rellenar(g, 0, 0, W, 15, M, (x, y) => (y % 5 === 4 ? 0.1 : 0.9 + (y % 5 === 0 ? 0.3 : 0)) + luzT(x, y + 10) * 0.9 + (hash(x >> 3, y / 5 | 0) - 0.5) * 0.4, 0.3);
    for (let x = 14; x < W + 20; x += 40) capa().poly([[x - 3, 0], [x + 4, 0], [x + 5, 15], [x - 4, 15]]).pintar(g, M, { relieve: 2, luz: [-0.4, 0.7, 0.6], max: 3, sesgo: luzT(x, 20) * 0.4 - 0.1 });
    capa().rect(0, 15, W, 7).pintar(g, M, { relieve: 2.5, luz: [-0.3, 0.75, 0.6], sesgo: -0.05, max: 3 });
    for (let x = 0; x < W; x++) { g.set(x, 22, M[0], M); if ((x * 7) % 23 < 2) g.set(x, 18, M[1], M); }
    // pared de revoque, con desconchones donde asoma el ladrillo
    rellenar(g, 0, 23, W, 46, PM, (x, y) => 1.15 + luzT(x, y) * 2.6 + (fbm(x / 9, y / 7, 3) - 0.5) * 1.1 - (y < 27 ? 0.7 : 0) - (y > 64 ? 0.4 : 0), 0.35);
    for (const [cx, cy, rx, ry] of [[104, 60, 9, 5], [186, 28, 7, 4], [6, 26, 5, 3], [236, 62, 8, 5]]) desconchon(g, cx, cy, rx, ry);
    // friso de tablas
    rellenar(g, 0, 69, W, 28, M, (x, y) => {
      let v = 0.6 + luzT(x, y) * 2.6;
      if (x % 9 === 0) v -= 1.2; else if (x % 9 === 1) v += 0.5; else if (x % 9 === 8) v -= 0.3;
      v += (ruido(x * 0.9, y * 0.12, 21) - 0.5) * 0.7;
      return v - Math.max(0, y - 90) * 0.12;
    }, 0.15);
    capa().rect(0, 67, W, 4).pintar(g, M, { relieve: 1.5, luz: [-0.4, -0.7, 0.6], separar: 1, sesgo: 0.05 });
    // postes con tornapuntas
    for (const [px, sesgo] of [[50, 0.15], [208, -0.1]]) {
      for (const s of [-1, 1]) capa().linea(px + 3 + s * 4, 26, px + 3 + s * 13, 22, 3).pintar(g, M, { relieve: 1.5, luz: [-0.5, 0.6, 0.6], max: 3, separar: 1 });
      capa().rect(px, 22, 8, 75).pintar(g, M, { relieve: 2.5, luz: [-0.85, -0.3, 0.6], sesgo, separar: 1 });
      for (const y of [30, 88]) g.set(px + 2, y, HI[3], HI).set(px + 5, y, HI[2], HI);
    }
    hogar(g);
    letreroGrifo(g, 70, 26);
    tablon(g, 66, 44);
    banco(g, 64, 84);
    estantes(g);
    barra(g);
    ventana(g);
    // toneles en su soporte, un cajón y un saco
    capa().rect(220, 92, 36, 5).pintar(g, M, { relieve: 1.5, separar: 1, sesgo: -0.1 });
    tonelTumbado(g, 231, 81, 11, { espita: true, sesgo: 0.05 });
    tonelTumbado(g, 254, 81, 11, { sesgo: -0.15 });
    tonelTumbado(g, 242, 61, 10, { espita: true, sesgo: -0.05 });
    cajon(g, 210, 84, 13, 12, -0.1);
    saco(g, 196, 86);
    // corona de velas colgada de la viga
    candelabro(g, 120);
    for (const [x, y] of FAROLES_T) { for (let j = 23; j < y - 6; j++) g.set(x, j, j % 2 ? HI[1] : HI[3], HI); farol(g, x, y); }
    // manojos de hierbas secándose
    for (const [x, largo, ram, flor] of [[150, 9, HO, VI], [157, 7, OL, null], [164, 10, HO, HU], [171, 8, OL, GR]]) manojo(g, x, 22, largo, ram, flor);
    suelo(g);
    alfombra(g);
    // halo cálido de las velas y faroles sobre lo que tienen detrás
    iluminar(g, 0, 23, W, 74, (x, y) => [...FAROLES_T, [120, 32]].reduce((v, [lx, ly]) => v + Math.max(0, 1 - Math.hypot(x - lx, (y - ly) * 1.2) / 16) * 1.1, 0), 1);
  }
  /* Un trozo de revoque caído, con el ladrillo a la vista. */
  function desconchon(g, cx, cy, rx, ry) {
    const c = capa().ell(cx, cy, rx, ry);
    cada(c, (x, y) => { if (hash(x, y, 77) < 0.25 && !c.tiene(x, y - 2)) c.off(x, y); });
    cada(c, (x, y) => {
      const fila = Math.floor((y + 40) / 3), junta = (y + 40) % 3 === 0 || (x + (fila & 1) * 3 + 40) % 7 === 0;
      const v = 1.3 + luzT(x, y) * 2.2 + (junta ? -1.3 : (hash(Math.floor((x + (fila & 1) * 3) / 7), fila, 5) - 0.5) * 0.9);
      g.set(x, y, LADRILLO[lim(tono(x, y, v, 0.3), 0, 4)], LADRILLO);
    });
    contraluz(g, c, (x, y) => PM[lim(Math.round(1 + luzT(x, y) * 3), 0, 4)], 1, 1);
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) || !c.tiene(x - 1, y)) g.set(x, y, PM[0], PM); });
  }
  /* El hogar: campana de piedra ennegrecida, repisa, boca con fogón de ladrillo, leños, caldero y morillos. */
  function hogar(g) {
    const campana = capa().poly([[0, 22], [34, 22], [46, 54], [0, 54]]);
    const hollin = (x, y) => lim(1 - Math.abs(x - 20) / (6 + (54 - y) * 0.25)) * (0.4 + (y - 22) / 32 * 0.9);
    sillares(g, 0, 22, 48, [6, 7, 6, 7, 6], P, (x, y) => 1.8 + luzT(x, y) * 1.5 - hollin(x, y) * 1.8, { sem: 5, ancho: 11, masc: campana, bisel: 0.8, junta: 1.4 });
    for (let y = 22; y < 54; y++) { const xb = Math.floor(34 + (y - 22) * 0.375); g.set(xb, y, P[3], P).set(xb + 1, y, M[0], M).set(xb + 2, y, M[0], M); }
    cornamenta(g, 21, 33);
    // repisa con jarra, botellita y vela
    capa().rect(0, 53, 50, 5).pintar(g, M, { relieve: 2, luz: [-0.5, 0.7, 0.6], separar: 1, sesgo: 0.1 });
    for (let x = 0; x < 50; x++) g.set(x, 53, M[4], M);
    for (const x of [8, 40]) capa().poly([[x - 2, 58], [x + 2, 58], [x, 62]]).pintar(g, M, { plano: 1 });
    conBorde(g, M[0], tmp => {
      capa().rect(5, 45, 7, 8).pintar(tmp, PL, { relieve: 2.5, max: 4 });
      for (let x = 5; x < 12; x++) { tmp.set(x, 44, PL[x < 9 ? 4 : 3], PL); tmp.set(x, 47, PL[1], PL); tmp.set(x, 50, PL[1], PL); }
      for (const [a, b] of [[12, 46], [13, 47], [13, 48], [13, 49], [12, 50]]) tmp.set(a, b, PL[2], PL);
      capa().rect(28, 47, 4, 6).rect(29, 44, 2, 3).pintar(tmp, HO, { relieve: 1.5, max: 4 });
      tmp.set(29, 43, M[2], M).set(30, 43, M[3], M);
      capa().rect(41, 52, 6, 1).pintar(tmp, B, { plano: 3 });
      tmp.set(47, 51, B[2], B);
    });
    vela(g, 44, 51, 7, true);
    // boca del hogar: fogón de ladrillo encendido por la lumbre
    const [fx, fy] = FUEGO_T, boca = capa().rect(0, 62, 36, 31);
    cada(boca, (x, y) => {
      const r = Math.max(0, 1 - Math.hypot((x - fx) / 26, (y - fy) / 28));
      const fila = Math.floor((y - 62) / 3), junta = (y - 62) % 3 === 2 || (x + (fila & 1) * 4) % 8 === 0;
      const v = 0.5 + r * 3.8 - (junta ? 1.1 : 0) - lim((72 - y) / 9) * 1.4;
      g.set(x, y, [SO[0], LADRILLO[0], LADRILLO[1], LADRILLO[2], TE[3], F[2]][lim(tono(x, y, v, 0.6), 0, 5)], LADRILLO);
    });
    // jambas y dintel de piedra
    for (const [x, y, w, h] of [[36, 58, 12, 12], [36, 70, 12, 12], [36, 82, 12, 11], [0, 58, 18, 5], [18, 58, 18, 5]]) {
      const c = capa().rect(x, y, w, h);
      c.pintar(g, P, { relieve: 2.5, luz: [-0.85, -0.2, 0.55], sesgo: 0.1 + luzT(x, y) * 0.3, separar: 1 });
      cada(c, (px, py) => { if (hash(px, py, 61) > 0.93) desplazar(g, px, py, -1); });
    }
    for (let y = 63; y < 93; y++) { g.set(36, y, TE[2], TE); if (y > 74) g.set(35, y, F[1], F); }
    for (let x = 0; x < 36; x++) g.set(x, 63, SO[0], SO);
    // losa del hogar
    rellenar(g, 0, 92, 52, 6, P, (x, y) => (y === 92 ? 3.4 : 2.2) + Math.max(0, 1 - Math.abs(x - fx) / 26) * 1.3 - (x > 46 ? 0.8 : 0) - (y > 95 ? 0.7 : 0), 0.4);
    for (let x = 0; x < 52; x++) g.set(x, 97, P[0], P);
    for (let x = 2; x < 34; x++) if (hash(x, 9, 4) > 0.55) g.set(x, 92, F[hash(x, 2) > 0.7 ? 3 : 2], F);
    // morillos de hierro
    for (const mx of [7, 33]) {
      capa().rect(mx - 1, 80, 3, 12).rect(mx - 3, 90, 7, 2).ell(mx, 79, 1.8, 1.8).pintar(g, HI, { relieve: 1, max: 3, separar: 1 });
    }
    // leños cruzados con brasas
    capa().linea(4, 90, 30, 84, 4).linea(9, 84, 36, 90, 4).pintar(g, M, { relieve: 2, luz: [0, 0.8, 0.6], max: 2, separar: 1 });
    for (const [x, y] of [[10, 88], [15, 87], [21, 86], [26, 85], [13, 90], [24, 89], [30, 88], [8, 89], [18, 84], [28, 88]]) g.set(x, y, F[2], F);
    for (const [x, y] of [[16, 88], [22, 87], [19, 89]]) g.set(x, y, F[3], F);
    for (let x = 2; x < 34; x++) if (hash(x, 91, 2) > 0.4) g.set(x, 91, hash(x, 4) > 0.5 ? F[1] : LADRILLO[2], F);
    // caldero colgado de una cremallera
    for (let y = 63; y < 70; y++) g.set(fx, y, y % 2 ? HI[1] : HI[3], HI);
    conBorde(g, SO[0], tmp => {
      capa().ell(fx, 74, 8.5, 6).quitarRect(0, 0, W, 71).rect(fx - 9, 70, 19, 2).pintar(tmp, HI, { relieve: 3, luz: [-0.2, 0.85, 0.5], max: 3 });
      for (let x = fx - 9; x <= fx + 9; x++) tmp.set(x, 70, HI[1], HI);
      for (let a = 3.3; a < 6.1; a += 0.1) tmp.set(Math.round(fx + Math.cos(a) * 7), Math.round(70 + Math.sin(a) * 3), HI[2], HI);
      tmp.set(fx - 10, 71, HI[2], HI).set(fx + 10, 71, HI[1], HI);
    });
  }
  /* Cornamenta de ciervo sobre una placa de madera, más grande que la antigua. */
  function cornamenta(g, cx, cy) {
    conBorde(g, M[0], tmp => {
      capa().poly([[cx - 6, cy - 2], [cx + 6, cy - 2], [cx + 6, cy + 7], [cx, cy + 12], [cx - 6, cy + 7]]).pintar(tmp, M, { relieve: 2.5, max: 3, sesgo: 0.1 });
      for (const s of [-1, 1]) {
        const c = capa().curva(cx + s * 3, cy - 1, cx + s * 13, cy - 2, cx + s * 15, cy - 13, 2.6, 1.3);
        c.curva(cx + s * 7, cy - 2, cx + s * 7, cy - 6, cx + s * 8, cy - 10, 1.6, 1).curva(cx + s * 11, cy - 5, cx + s * 12, cy - 8, cx + s * 11, cy - 13, 1.5, 1);
        c.curva(cx + s * 14, cy - 8, cx + s * 17, cy - 9, cx + s * 19, cy - 11, 1.5, 1);
        c.pintar(tmp, HU, { relieve: 1.2, min: 1, max: 4 });
      }
      capa().ell(cx, cy + 1, 3.4, 2.8).poly([[cx - 3, cy + 2], [cx + 3, cy + 2], [cx + 1.5, cy + 9], [cx - 1.5, cy + 9]]).pintar(tmp, HU, { relieve: 2, max: 4 });
      tmp.set(cx - 2, cy + 1, SO[0], SO).set(cx + 2, cy + 1, SO[0], SO).set(cx - 2, cy + 2, SO[1], SO).set(cx + 2, cy + 2, SO[1], SO).set(cx, cy + 7, HU[1], HU).set(cx - 1, cy + 8, HU[1], HU).set(cx + 1, cy + 8, HU[1], HU);
    });
  }
  /* El letrero de la casa: la cabeza de un grifo con un parche en el ojo, pintada en una tabla colgada de cadenas. */
  function letreroGrifo(g, x, y) {
    for (const cx of [x + 4, x + 27]) for (let j = 23; j < y; j++) g.set(cx, j, j % 2 ? HI[1] : HI[3], HI);
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, 32, 15).pintar(tmp, M, { relieve: 2, sesgo: 0.1, max: 3 });
      for (let i = 2; i < 30; i++) for (let j = 2; j < 13; j++) tmp.set(x + i, y + j, (i * 3 + j * 5) % 11 ? M[2] : M[1], M);
      // cabeza de grifo: plumas ocres, pico de bronce, parche negro
      capa().ell(x + 12, y + 8, 6, 4.5).poly([[x + 6, y + 6], [x + 4, y + 2], [x + 9, y + 4]]).pintar(tmp, OC, { relieve: 2, min: 1, max: 4 });
      capa().poly([[x + 17, y + 5], [x + 25, y + 7], [x + 26, y + 10], [x + 22, y + 9], [x + 17, y + 10]]).pintar(tmp, B, { relieve: 1.5, min: 2, max: 4 });
      for (let i = 13; i < 18; i++) tmp.set(x + i, y + 5 + Math.round((i - 13) * 0.2), NE[1], NE);
      tmp.set(x + 14, y + 7, NE[0], NE).set(x + 15, y + 7, NE[0], NE).set(x + 14, y + 8, NE[1], NE).set(x + 15, y + 8, NE[0], NE);
      tmp.set(x + 24, y + 9, B[1], B).set(x + 9, y + 11, OC[1], OC).set(x + 11, y + 12, OC[1], OC);
    });
  }
  /* Tablón de anuncios con encargos clavados. */
  const CARTEL_BUSCA = ["rrrrrrr", "       ", "  ggg  ", " g g g ", " ggggg ", "  g g  ", " ggggg ", "       ", "nnn nnn", "nn nn n", "       ", " rrrrr "];
  const CARTEL_DRAGON = ["r     r    ", "rr   rr    ", " rrrrrr   r", "  rrrrrrrr ", "  rr  rr   ", "           ", "nnnn nnn n ", "nn nnnn    "];
  const CARTEL_CALAVERA = ["  nn  ", " nnnn ", "n.nn.n", "nnnnnn", " n  n ", "      ", "nn nn "];
  const CARTEL_NOTA = ["nnn nnnn", "nn nnn n", "nnnn nn ", "n nnn   "];
  function cartel(g, x, y, w, h, dibujo, sesgo = 0) {
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, w, h).pintar(tmp, HU, { relieve: 1.5, min: 2, max: 4, sesgo });
      for (let i = 0; i < w; i++) if (hash(i, y, x) > 0.6) tmp.set(x + i, y + h - 1, HU[1], HU);
      plantilla(tmp, dibujo, x + 1, y + 2, { n: M[1], r: GR[2], g: M[1], ".": HU[3] });
      tmp.set(x + Math.floor(w / 2), y, GR[3], GR);
    });
  }
  function tablon(g, x0, y0) {
    const w = 38, h = 21;
    conBorde(g, M[0], tmp => capa().rect(x0, y0, w, h).pintar(tmp, M, { relieve: 2, sesgo: 0.1 }));
    rellenar(g, x0 + 2, y0 + 2, w - 4, h - 4, OC, (x, y) => 0.9 + luzT(x, y) * 0.8 + (hash(x, y, 3) > 0.85 ? -0.8 : 0), 0.3);
    cartel(g, x0 + 3, y0 + 2, 9, 15, CARTEL_BUSCA, 0.1);
    cartel(g, x0 + 14, y0 + 3, 13, 11, CARTEL_DRAGON);
    cartel(g, x0 + 29, y0 + 4, 7, 10, CARTEL_CALAVERA, -0.1);
    cartel(g, x0 + 15, y0 + 15, 10, 5, CARTEL_NOTA);
  }
  /* Banco junto a la pared con una jarra olvidada. */
  function banco(g, x, y) {
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, 36, 3).pintar(tmp, M, { relieve: 1.2, sesgo: 0.1 });
      for (let i = 0; i < 36; i++) tmp.set(x + i, y, M[4], M);
      for (const lx of [x + 3, x + 30]) capa().rect(lx, y + 3, 3, 10).pintar(tmp, M, { relieve: 1, max: 2 });
      capa().rect(x + 22, y - 6, 5, 6).pintar(tmp, M, { relieve: 1.5, sesgo: 0.1 });
      for (let i = 0; i < 5; i++) { tmp.set(x + 22 + i, y - 7, HU[i < 3 ? 4 : 3], HU); tmp.set(x + 22 + i, y - 4, HI[2], HI); }
      tmp.set(x + 27, y - 5, M[2], M).set(x + 28, y - 4, M[2], M).set(x + 27, y - 2, M[1], M);
    });
  }
  /* Estantes detrás de la barra: jarras de peltre, botellas, queso, platos y un barrilito. */
  function estantes(g) {
    for (const y of [46, 62]) {
      capa().rect(130, y, 74, 3).pintar(g, M, { relieve: 1, separar: 1, luz: [-0.4, -0.7, 0.6] });
      for (let x = 130; x < 204; x++) { g.set(x, y, M[4], M); if ((x & 1) === 0) g.set(x, y + 3, M[0], M); }
      for (const bx of [134, 198]) capa().poly([[bx, y + 3], [bx + 3, y + 3], [bx, y + 7]]).pintar(g, M, { plano: 1 });
    }
    conBorde(g, M[0], tmp => {
      let y = 46;
      for (const x of [134, 143]) {
        capa().rect(x, y - 8, 7, 8).pintar(tmp, PL, { relieve: 2.5, max: 4 });
        for (let i = 0; i < 7; i++) { tmp.set(x + i, y - 9, PL[i < 4 ? 4 : 3], PL); tmp.set(x + i, y - 6, PL[1], PL); tmp.set(x + i, y - 2, PL[1], PL); }
        for (const [a, b] of [[7, -7], [8, -6], [8, -5], [8, -4], [7, -3]]) tmp.set(x + a, y + b, PL[2], PL);
      }
      for (const [x, ram, alto] of [[155, HO, 10], [161, GR, 12], [167, M, 9], [172, VI, 11]]) {
        capa().rect(x, y - alto + 3, 4, alto - 3).rect(x + 1, y - alto, 2, 3).pintar(tmp, ram, { relieve: 1.5, max: 4, min: 1 });
        tmp.set(x + 1, y - alto - 1, M[3], M).set(x + 2, y - alto - 1, M[2], M);
        for (let i = 0; i < 4; i++) tmp.set(x + i, y - 5, HU[i < 2 ? 3 : 2], HU);
        tmp.set(x, y - alto + 4, HU[4], HU);
      }
      const q = capa().ell(186, y - 4, 6, 4.5).quitarRect(0, y, W, 6);
      q.pintar(tmp, OC, { relieve: 2.5, max: 4 });
      for (let i = 0; i < 4; i++) for (let j = 0; j <= i; j++) tmp.set(187 + i, y - 8 + j + 1, OC[4], OC);
      tmp.set(190, y - 3, OC[2], OC);
      capa().rect(195, y - 6, 6, 6).pintar(tmp, M, { relieve: 1.5, max: 3 });
      for (let i = 0; i < 6; i++) tmp.set(195 + i, y - 5, HI[2], HI);
      y = 62;
      for (let k = 0; k < 4; k++) {
        const cx = 138 + k * 9;
        capa().ell(cx, y - 6, 4.5, 5.5).quitarRect(0, y, W, 4).pintar(tmp, k % 2 ? HU : AZ, { relieve: 2, min: 1, max: 4 });
        capa().ell(cx, y - 6, 2.5, 3.2).pintar(tmp, k % 2 ? HU : AZ, { plano: 2 });
      }
      tonel(tmp, 176, y - 11, 9, 11, { sesgo: 0.05 });
      for (const x of [189, 196]) {
        capa().rect(x, y - 7, 5, 7).pintar(tmp, M, { relieve: 1.5, sesgo: 0.1 });
        for (let i = 0; i < 5; i++) tmp.set(x + i, y - 5, HI[2], HI);
        tmp.set(x + 5, y - 6, M[2], M).set(x + 6, y - 5, M[2], M).set(x + 5, y - 3, M[1], M);
      }
    });
  }
  /* La barra: tablero grueso y frente de cuarterones, con jarras de espuma, pan y una vela. */
  function barra(g) {
    const x0 = 124, x1 = 206, y = 76;
    const frente = capa().rect(x0 + 2, y + 4, x1 - x0 - 4, 97 - y - 4);
    frente.pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1, max: 3 });
    for (let k = 0; k < 5; k++) {
      const px = x0 + 6 + k * 15, pw = 12;
      rellenar(g, px, y + 7, pw, 13, M, (x, yy) => {
        const borde = x === px || yy === y + 7 ? 1.2 : x === px + pw - 1 || yy === y + 19 ? -1 : 0;
        return 1.4 + luzT(x, yy) * 1.3 + borde + (ruido(x * 0.8, yy * 0.15, 8) - 0.5) * 0.6;
      }, 0.2);
    }
    for (let x = x0 + 2; x < x1 - 2; x++) { g.set(x, y + 4, M[1], M); g.set(x, 95, M[1], M); g.set(x, 96, M[0], M); }
    capa().rect(x0, y, x1 - x0, 4).pintar(g, M, { relieve: 1.5, separar: 1, luz: [-0.4, -0.7, 0.6] });
    for (let x = x0; x < x1; x++) g.set(x, y, M[4], M).set(x, y + 1, M[3], M);
    conBorde(g, M[0], tmp => {
      for (const x of [134, 145]) {
        capa().rect(x, y - 7, 7, 7).pintar(tmp, M, { relieve: 2, sesgo: 0.1 });
        for (let i = 0; i < 7; i++) { tmp.set(x + i, y - 8, HU[i < 4 ? 4 : 3], HU); tmp.set(x + i, y - 4, HI[2], HI); }
        tmp.set(x + 1, y - 9, HU[4], HU).set(x + 2, y - 9, HU[4], HU).set(x + 3, y - 9, HU[3], HU).set(x + 1, y - 7, HU[3], HU);
        for (const [a, b] of [[7, -6], [8, -5], [8, -4], [8, -3], [7, -2]]) tmp.set(x + a, y + b, M[2], M);
      }
      capa().rect(160, y - 1, 15, 1).pintar(tmp, PL, { plano: 2 });
      capa().ell(167, y - 4, 5.5, 3).pintar(tmp, OC, { relieve: 2, max: 4 });
      for (const i of [-3, 0, 3]) tmp.set(167 + i, y - 5, OC[1], OC).set(168 + i, y - 6, OC[1], OC);
      capa().rect(189, y - 1, 9, 1).pintar(tmp, B, { plano: 3 });
      tmp.set(198, y - 2, B[2], B).set(199, y - 2, B[2], B);
    });
    vela(g, 194, y - 2, 7, true);
    // sombra al pie de la barra
    for (let x = x0; x < x1 + 3; x++) g.set(x, 97, M[0], M);
  }
  /* Ventana de noche: luna menguante, estrellas y pinos lejanos; con contraventanas. */
  function ventana(g) {
    const x0 = 226, y0 = 28, w = 24, h = 22;
    capa().rect(x0 - 3, y0 - 3, w + 6, h + 6).pintar(g, M, { relieve: 2, sesgo: -0.2, separar: 1 });
    rellenar(g, x0, y0, w, h, NOCHE, (x, y) => 0.4 + ((y - y0) / h) * 3.2, 1);
    capa().ell(242, 34, 3.6).pintar(g, HU, { plano: 4 });
    capa().ell(243.6, 33, 3.3).pintar(g, NOCHE, { plano: 1 });
    for (const [a, b, k] of [[230, 31, 3], [236, 38, 2], [229, 41, 2], [247, 42, 2], [233, 35, 3]]) g.set(a, b, HU[k], HU);
    for (const [px, alto] of [[228, 8], [232, 11], [237, 9], [242, 12], [247, 8], [250, 10]]) pino(g, px, y0 + h, alto, alto * 0.7, SO, { plano: 1 });
    for (let x = x0; x < x0 + w; x++) g.set(x, y0 + h - 1, SO[2], SO);
    // parteluz y travesaño
    for (let j = 0; j < h; j++) g.set(x0 + 11, y0 + j, M[2], M).set(x0 + 12, y0 + j, M[1], M);
    for (let i = 0; i < w; i++) g.set(x0 + i, y0 + 10, M[2], M).set(x0 + i, y0 + 11, M[1], M);
    for (let i = 0; i < 5; i++) g.set(x0 + 1 + i, y0 + 1 + i, NOCHE[4], NOCHE);
    capa().rect(x0 - 5, y0 + h + 2, w + 10, 3).pintar(g, M, { relieve: 1, separar: 1 });
    for (let i = -5; i < w + 5; i++) g.set(x0 + i, y0 + h + 2, M[4], M);
    capa().rect(x0 - 9, y0 - 2, 5, h + 4).pintar(g, M, { relieve: 1.2, sesgo: -0.1, separar: 1 });
    for (let y = y0 + 1; y < y0 + h; y += 6) g.set(x0 - 8, y, M[0], M).set(x0 - 7, y, M[0], M).set(x0 - 6, y, M[0], M);
  }
  function saco(g, x, y) {
    conBorde(g, M[0], tmp => {
      capa().ell(x + 6, y + 6, 6.5, 5.5).poly([[x + 3, y + 2], [x + 9, y + 2], [x + 7, y - 2], [x + 5, y - 2]]).pintar(tmp, HU, { relieve: 3, max: 3, min: 1, sesgo: -0.1 });
      for (let i = 4; i < 9; i++) tmp.set(x + i, y + 1, M[2], M);
      tmp.set(x + 4, y + 5, HU[1], HU).set(x + 5, y + 6, HU[1], HU).set(x + 9, y + 7, HU[1], HU);
    });
  }
  /* Corona de hierro con velas, colgada de la viga maestra. */
  function candelabro(g, x) {
    for (const dx of [-11, 0, 11]) { const c = capa().linea(x, 22, x + dx, 32, 1); cada(c, (px, py) => g.set(px, py, py % 2 ? HI[1] : HI[3], HI)); }
    conBorde(g, NE[0], tmp => {
      capa().ell(x, 34, 14, 2).quitarEll(x, 33.5, 11, 1).pintar(tmp, HI, { relieve: 1, max: 4 });
      for (const dx of [-12, -6, 6, 12]) tmp.set(x + dx, 33, HI[3], HI);
    });
    for (const [vx, vy] of VELAS_T.slice(0, 4)) vela(g, vx, vy + 1, 4);
  }
  /* Manojo de hierbas colgado boca abajo desde (x, y). */
  function manojo(g, x, y, largo, ram, flor) {
    const az = azar(x * 31 + y);
    const tmp = new Rejilla(W, H);
    for (let i = 0; i < 7; i++) {
      const a = -0.42 + i * 0.14 + (az() - 0.5) * 0.12, l = largo * (0.72 + az() * 0.3);
      for (let s = 0; s <= l; s++) {
        const px = Math.round(x + Math.sin(a) * s), py = Math.round(y + 1 + Math.cos(a) * s);
        tmp.set(px, py, ram[1], ram);
        if (s > 2 && s % 2 === (i & 1)) tmp.set(px + (s % 4 < 2 ? -1 : 1), py, ram[s % 4 < 2 ? 3 : 2], ram);
      }
      if (flor) {
        const fx = Math.round(x + Math.sin(a) * l), fy = Math.round(y + 1 + Math.cos(a) * l);
        tmp.set(fx, fy + 1, flor[3], flor).set(fx + 1, fy + 1, flor[2], flor);
      }
    }
    tmp.contorno(M[0]);
    g.pegar(tmp);
    for (let k = -1; k <= 1; k++) g.set(x + k, y + 1, HU[2], HU).set(x + k, y + 2, HU[1], HU);
  }
  /* Tarima de tablas en perspectiva, más clara junto al fuego, con clavos y vetas. */
  function suelo(g) {
    const filas = [97, 99, 102, 105, 109, 113, 118, 123, 129, 136, 144];
    const az = azar(11);
    for (let f = 0; f < filas.length - 1; f++) {
      const y0 = filas[f], y1 = filas[f + 1], alto = y1 - y0;
      const juntas = [];
      for (let x = -Math.floor(az() * 40); x < W; x += 34 + Math.floor(az() * 40)) juntas.push(x);
      const vari = juntas.map(() => (az() - 0.5) * 0.6);
      rellenar(g, 0, y0, W, alto, M, (x, y) => {
        let j = 0;
        while (j + 1 < juntas.length && juntas[j + 1] <= x) j++;
        if (juntas.includes(x)) return 0;
        let v = 0.9 + luzT(x, y) * 2.3 + vari[j];
        if (y === y0) v = Math.min(v, 0.35);
        else if (y === y0 + 1) v += 0.45;
        else v += (ruido(x * 0.12 + j * 5, (y - y0) * 1.7, 31) - 0.5) * 0.9;
        v -= Math.max(0, 101 - y) * 0.3;
        return v - Math.max(0, y - 136) * 0.05;
      }, 0.18);
      // clavos junto a las juntas
      for (const x of juntas) if (alto > 3) { const yy = y0 + Math.floor(alto / 2); g.set(x + 2, yy, HI[2], HI); g.set(x - 2, yy, HI[1], HI); }
    }
    for (let x = 0; x < W; x++) g.set(x, 97, M[0], M);
    // briznas de paja y migas por el suelo
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(hash(i, 1, 5) * W), y = 100 + Math.floor(hash(i, 2, 5) * 42);
      g.set(x, y, OC[2], OC).set(x + 1, y + (hash(i, 3) > 0.5 ? 1 : 0), OC[1], OC);
    }
  }
  /* Alfombra raída en el centro de la sala, en perspectiva, con greca. */
  function alfombra(g) {
    const top = 108, bot = 141, xa = [102, 160], xb = [92, 172];
    for (let y = top; y < bot; y++) {
      const k = (y - top) / (bot - top), l = xa[0] + (xb[0] - xa[0]) * k, r = xa[1] + (xb[1] - xa[1]) * k;
      for (let x = Math.ceil(l); x < r; x++) {
        const u = (x - l) / (r - l), bu = Math.min(u, 1 - u) * (r - l), bv = Math.min(y - top, bot - 1 - y);
        let ram = GR, v = 1.1 + luzT(x, y) * 1.3;
        if (bu < 2 || bv < 2) { ram = OC; v -= 0.7; }
        else if (bu < 4 || bv < 3) { ram = GR; v -= 0.8; }
        else if ((Math.round(bu) + Math.round(bv * 1.6)) % 6 === 0 && (bu < 7 || bv < 6)) ram = OC;
        else {
          const cu = u - 0.5, cv = (y - (top + bot) / 2) / (bot - top);
          const rombo = Math.abs(cu) + Math.abs(cv) * 1.4;
          if (rombo < 0.2) { ram = rombo < 0.09 ? OC : AZ; v -= 0.5; }
        }
        v += (hash(x, y, 17) > 0.9 ? -1 : 0) - (ruido(x * 0.2, y * 0.3, 41) > 0.72 ? 0.8 : 0);
        g.set(x, y, ram[lim(tono(x, y, v, 0.4), 0, 4)], ram);
      }
      if (y === bot - 1) for (let x = Math.ceil(l); x < r; x += 2) g.set(x, y + 1, OC[2], OC);
    }
  }
  function tabernaAnim(ctx, t) {
    const [fx, fy] = FUEGO_T;
    lengua(ctx, fx - 7, fy - 1, 11, 15, t, 0.3);
    lengua(ctx, fx + 7, fy - 1, 10, 13, t, 2.1);
    lengua(ctx, fx, fy, 13, 18, t, 4.4);
    chispas(ctx, fx, fy - 8, 5, 26, t, 0, [fx - 10, 66, fx + 11, 76]);
    VELAS_T.forEach(([x, y], i) => llamaVela(ctx, x, y, t, i * 1.9));
    FAROLES_T.forEach(([x, y], i) => llamaFarol(ctx, x, y, t, i * 2.7));
  }


  /* ======================================================================
     Villabruma de noche
     ====================================================================== */
  const CIELO_ALDEA = ["#07081a", "#0d1130", "#151b44", "#1f2756", "#2e3166", "#463d76", "#614a7e", "#7e5880", "#9c6a80"];
  const LUNA_ALDEA = [88, 22];
  const CHIMENEA_ALDEA = [181, 46];
  const FAROLA_ALDEA = [82, 74];
  const ADOQUIN = [GRIS[0], GRIS[1], GRIS[2], P[2], P[3], HU[1], OC[2]];
  /* Ventanas encendidas: [x, y, w, h]; se rellenan en casa() y titilan en la animación. */
  const VENTANAS_ALDEA = [];
  const luzLuna = (x, y) => Math.max(0, 1 - Math.hypot(x - LUNA_ALDEA[0], (y - LUNA_ALDEA[1]) * 1.3) / 80);
  const luzFarolas = (x, y) => lim(Math.max(0, 1 - Math.hypot((x - FAROLA_ALDEA[0]) / 54, (y - 114) / 26)) ** 1.2 + Math.max(0, 1 - Math.hypot((x - 222) / 46, (y - 112) / 20)) ** 1.2 * 0.8);
  function aldea(g) {
    VENTANAS_ALDEA.length = 0;
    const [lx, ly] = LUNA_ALDEA;
    // cielo de anochecer: azul profundo arriba, malva junto al horizonte, más claro alrededor de la luna
    rellenar(g, 0, 0, W, 96, CIELO_ALDEA, (x, y) => Math.pow(y / 84, 1.35) * 7.4 + luzLuna(x, y) ** 2 * 2.2, 0.7);
    // jirones de nube iluminados por la luna
    for (const [cx, cy, rx, ry, sem] of [[40, 14, 34, 3, 1], [150, 30, 44, 3.5, 2], [236, 12, 30, 2.5, 3], [110, 46, 30, 2.2, 4]]) {
      for (let y = Math.floor(cy - ry * 2); y <= cy + ry * 2; y++) for (let x = Math.floor(cx - rx * 1.4); x <= cx + rx * 1.4; x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(x / 12, y / 3, sem) - 0.5) * 1.4;
        if (d < 1 && umbral(x, y) < (1 - d) * 2.2) g.set(x, y, CIELO_ALDEA[lim(Math.round(3 + luzLuna(x, y) * 3 + (y < cy ? 1 : -1) * (d < 0.5 ? 1 : 0)), 2, 7)], CIELO_ALDEA);
      }
    }
    // estrellas
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(hash(i, 1, 3) * W), y = Math.floor(hash(i, 2, 3) ** 1.6 * 60);
      if (Math.hypot(x - lx, y - ly) < 22) continue;
      const k = hash(i, 4, 3);
      g.set(x, y, k > 0.85 ? HU[4] : k > 0.5 ? HU[2] : CIELO_ALDEA[5], null);
      if (k > 0.94) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.set(x + a, y + b, CIELO_ALDEA[5], null);
    }
    // la luna con su halo y sus mares
    for (let y = ly - 22; y <= ly + 22; y++) for (let x = lx - 26; x <= lx + 26; x++) {
      const d = Math.hypot(x - lx, y - ly);
      if (d > 12 && d < 22 && umbral(x, y) < (1 - (d - 12) / 10) * 0.5) desplazar(g, x, y, 1);
    }
    const luna = capa().ell(lx, ly, 10.5, 10.5);
    luna.pintar(g, ["#8c8aa0", "#b4b0bc", "#d8d2cc", "#efe8dc", "#fffaf0"], { relieve: 6, min: 1 });
    cada(luna, (x, y) => { if (fbm((x - lx) / 4, (y - ly) / 4, 9) > 0.58) desplazar(g, x, y, -1); });
    for (const [a, b, r] of [[-3, 3, 2], [4, -2, 1.5], [2, 5, 1.2], [-5, -4, 1]]) cada(capa().ell(lx + a, ly + b, r, r), (x, y) => desplazar(g, x, y, -1));
    // lomas lejanas con un castillo y pinares
    for (let x = 0; x < W; x++) {
      const top = Math.round(62 + Math.sin(x * 0.03 + 1.5) * 6 + Math.sin(x * 0.09) * 2);
      for (let y = top; y < 100; y++) g.set(x, y, CIELO_ALDEA[lim(tono(x, y, 4.2 - (y - top) * 0.08 + (y === top ? 1 : 0) + luzLuna(x, y) * 0.6, 0.6), 1, 6)], CIELO_ALDEA);
      const top2 = Math.round(76 + Math.sin(x * 0.05) * 3 + (hash(x >> 1, 9) - 0.5) * 3 - (hash(x >> 2, 8) > 0.6 ? 3 : 0));
      for (let y = top2; y < 100; y++) g.set(x, y, CIELO_ALDEA[lim(tono(x, y, 2.6 - (y - top2) * 0.08 + (y === top2 ? 0.7 : 0), 0.5), 1, 5)], CIELO_ALDEA);
    }
    castilloLejano(g, 176, 56);
    // tejados del fondo (siluetas con ventanitas encendidas) y el campanario
    tejadosFondo(g);
    campanario(g, 127, 88);
    // la plaza empedrada
    adoquines(g, 96, 128, -90, 7.5, ADOQUIN, (x, y) => 1.9 + luzLuna(x, y) * 0.7 + luzFarolas(x, y) * 4 - Math.max(0, 104 - y) * 0.12, (x, y) => (luzFarolas(x, y) > 0.45 ? GRIS[1] : GRIS[0]), 0.55);
    for (let x = 0; x < W; x++) g.set(x, 96, GRIS[0], null);
    // casas de entramado
    casa(g, { x0: 62, x1: 110, base: 98, muro: 27, tejado: "paja", sem: 2, claro: 1.1 });
    casa(g, { x0: 148, x1: 198, base: 98, muro: 27, tejado: "teja", hastial: true, sem: 3, chimenea: CHIMENEA_ALDEA, claro: 1.3 });
    casa(g, { x0: -6, x1: 58, base: 106, muro: 46, tejado: "teja", hastial: true, sem: 1, cartel: true, claro: 1.9 });
    casa(g, { x0: 202, x1: 262, base: 104, muro: 44, tejado: "pizarra", hastial: true, sem: 4, claro: 1.2 });
    pozo(g, 124, 108);
    puesto(g, 192, 244, 110);
    farola(g, FAROLA_ALDEA[0], 112);
    // resplandor de las ventanas encendidas sobre los muros y del farol sobre todo lo cercano
    iluminar(g, 0, 20, W, 92, (x, y) => VENTANAS_ALDEA.reduce((v, [wx, wy, ww, wh]) => v + Math.max(0, 1 - Math.hypot((x - wx - ww / 2) / (ww + 4), (y - wy - wh / 2) / (wh + 3))) * 1.2, 0) + Math.max(0, 1 - Math.hypot(x - FAROLA_ALDEA[0], y - FAROLA_ALDEA[1] - 2) / 24) * 1.4, 1);
    // un gato negro mirando desde el tejado y hojas secas en el empedrado
    plantilla(g, ["a  a ", "aaaa ", "abab ", "aaaa ", " aaa  a", " aaaaa", " aaaa "], 92, 47, { a: SO[0], b: OC[4] });
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(hash(i, 1, 44) * W), y = 112 + Math.floor(hash(i, 2, 44) * 30);
      g.set(x, y, i % 2 ? TE[2] : OC[1], null).set(x + 1, y, i % 2 ? TE[1] : M[2], null);
    }
  }
  /* Castillo lejano en lo alto de una loma, azulado por la distancia, con ventanas encendidas. */
  function castilloLejano(g, x, y) {
    const C = CIELO_ALDEA;
    const c = capa().rect(x, y, 24, 9).rect(x - 4, y - 7, 7, 16).rect(x + 21, y - 7, 7, 16).rect(x + 8, y - 13, 8, 22);
    for (const [tx, ty, w] of [[x - 4, y - 7, 7], [x + 21, y - 7, 7], [x + 8, y - 13, 8], [x, y, 24]]) for (let i = 0; i < w; i += 2) c.on(tx + i, ty - 1);
    cada(c, (px, py) => g.set(px, py, C[c.tiene(px - 1, py) && c.tiene(px, py - 1) ? (px > x + 14 ? 2 : 3) : 5], C));
    for (const [wx, wy] of [[x + 11, y - 8], [x - 1, y - 3], [x + 24, y - 2], [x + 5, y + 3], [x + 16, y + 3]]) g.set(wx, wy, OC[3], null).set(wx, wy + 1, F[2], null);
    for (let j = 1; j < 8; j++) g.set(x + 12, y - 13 - j, C[2], C);
  }
  /* Hilera de tejados detrás de la plaza: siluetas oscuras con el borde tocado por la luna. */
  function tejadosFondo(g) {
    const c = capa(), az = azar(71);
    let x = -4;
    while (x < W) {
      const w = 14 + Math.floor(az() * 16), base = 96, alto = 14 + Math.floor(az() * 10), cumbre = base - alto - Math.floor(w * 0.45);
      c.rect(x, base - alto, w, alto).poly([[x - 2, base - alto + 1], [x + w / 2, cumbre], [x + w + 2, base - alto + 1]]);
      if (az() < 0.5) c.rect(x + Math.floor(w * 0.7), cumbre + 2, 3, 6);
      const ventanas = [];
      for (let k = 0; k < 2; k++) if (az() < 0.6) ventanas.push([x + 3 + Math.floor(az() * (w - 6)), base - alto + 3 + Math.floor(az() * (alto - 8))]);
      c.__v = (c.__v || []).concat(ventanas);
      x += w + 2 + Math.floor(az() * 4);
    }
    cada(c, (px, py) => g.set(px, py, CIELO_ALDEA[(py * 3 + px) % 7 === 0 ? 2 : 1], CIELO_ALDEA));
    contraluz(g, c, (px, py) => CIELO_ALDEA[px < 128 ? 4 : 3], -1, -1);
    for (const [wx, wy] of c.__v) { g.set(wx, wy, OC[4], null).set(wx + 1, wy, OC[3], null).set(wx, wy + 1, F[2], null).set(wx + 1, wy + 1, F[2], null); }
  }
  /* Campanario de la iglesia, con la aguja y una luz en lo alto. */
  function campanario(g, cx, base) {
    const C = [CIELO_ALDEA[1], CIELO_ALDEA[2], CIELO_ALDEA[3], GRIS[3], CIELO_ALDEA[5]];
    const torre = capa().rect(cx - 8, 44, 17, base - 44);
    sillares(g, cx - 8, 44, cx + 9, Array(Math.ceil((base - 44) / 4)).fill(4), C, (x) => (x < cx - 4 ? 2.6 : 1.6), { sem: 9, ancho: 6, bisel: 0.5, junta: 0.9, masc: torre });
    const aguja = capa().poly([[cx - 10, 45], [cx + 0.5, 14], [cx + 11, 45]]);
    cada(aguja, (x, y) => g.set(x, y, ADOQUIN[(y % 3 === 0 ? 0 : x < cx ? 2 : 1)], ADOQUIN));
    for (let y = 8; y < 15; y++) g.set(cx, y, GRIS[3], GRIS);
    g.set(cx - 1, 10, GRIS[3], GRIS).set(cx + 1, 10, GRIS[3], GRIS);
    // ventanal del campanario con la campana encendida desde dentro
    capa().rect(cx - 4, 50, 9, 12).ell(cx + 0.5, 50, 4.5, 3).pintar(g, OC, { plano: 3 });
    capa().ell(cx + 0.5, 55, 2.6, 3).quitarRect(0, 58, W, 10).pintar(g, B, { relieve: 1.5, max: 4 });
    for (let i = -4; i <= 4; i++) g.set(cx + i, 62, GRIS[2], GRIS);
    for (let x = cx - 9; x <= cx + 9; x++) g.set(x, 44, GRIS[3], GRIS);
    VENTANAS_ALDEA.push([cx - 4, 48, 9, 14]);
  }
  /* Casa de entramado: muro encalado con vigas oscuras, ventanas encendidas, puerta y tejado. */
  function casa(g, op) {
    const { x0, x1, base, muro, tejado, hastial } = op, yTop = base - muro, cx = (x0 + x1) / 2, an = x1 - x0;
    const az = azar(op.sem || 1), claro = op.claro ?? 2;
    const TEJ = tejado === "teja" ? TE : tejado === "paja" ? OC : GRIS;
    const cumbre = yTop - an * 0.55;
    // tejado
    const t = capa();
    if (hastial) t.poly([[x0 - 4, yTop + 2], [cx, cumbre], [x1 + 4, yTop + 2]]);
    else t.poly([[x0 - 4, yTop + 2], [x0 + 6, yTop - 15], [x1 - 6, yTop - 15], [x1 + 4, yTop + 2]]);
    cada(t, (x, y) => {
      let v = claro * (tejado === "paja" ? 0.6 : 0.9) + (x < cx ? 0.6 : -0.4) + luzLuna(x, y) * 1.2;
      const fila = Math.floor((y - yTop + 60) / 3);
      if (tejado === "paja") v += (ruido(x * 0.9, y * 0.25, op.sem) - 0.5) * 1.6 + ((y - yTop + 60) % 5 === 0 ? -0.7 : 0);
      else if ((y - yTop + 60) % 3 === 0) v -= 1.2;
      else if ((x + fila * (tejado === "teja" ? 2 : 3)) % (tejado === "teja" ? 4 : 5) === 0) v -= 0.7;
      else if ((y - yTop + 60) % 3 === 1) v += 0.3;
      g.set(x, y, TEJ[lim(tono(x, y, v, 0.3), 0, 4)], TEJ);
    });
    contraluz(g, t, TEJ[4], -1, -1);
    // alero: sombra bajo el tejado
    for (let x = x0 - 4; x < x1 + 4; x++) g.set(x, yTop + 2, NE[0], NE);
    if (hastial) {
      const m = capa().poly([[x0 + 2, yTop + 1], [cx, cumbre + 5], [x1 - 2, yTop + 1]]);
      rellenar(g, 0, 0, W, H, HU, (x, y) => claro - 0.3 + (x < cx ? 0.3 : -0.3) - (y < cumbre + 10 ? 0.4 : 0), 0.3, m);
      capa().linea(cx, cumbre + 7, cx, yTop, 2).linea(x0 + 6, yTop, cx, yTop - an * 0.25, 2).linea(x1 - 6, yTop, cx, yTop - an * 0.25, 2).recortar(m).pintar(g, M, { plano: 1 });
      for (const [a, b] of [[x0 - 4, yTop + 2], [x1 + 4, yTop + 2]]) capa().linea(a, b, cx, cumbre, 2).pintar(g, M, { plano: 1 });
      // ventanuco del desván
      if (an > 44) ventanaCasa(g, Math.round(cx - 3), Math.round(yTop - an * 0.2), 6, 6, az() < 0.6);
    }
    // muro (más apagado en las casas del fondo) y, en las altas, planta baja de piedra
    rellenar(g, x0, yTop + 3, an, muro - 3, HU, (x, y) => claro - ((x - x0) / an) * 0.8 - (y < yTop + 6 ? 0.9 : 0) + (fbm(x / 6, y / 6, op.sem) - 0.5) * 0.7, 0.3);
    const alto = muro > 34;
    const pisos = alto ? [yTop + 3, yTop + Math.round(muro * 0.5), base - 1] : [yTop + 3, base - 1];
    if (alto) sillares(g, x0, pisos[1] + 2, x1, Array(Math.ceil((base - pisos[1] - 2) / 5)).fill(5), P, (x) => claro + 0.2 - ((x - x0) / an) * 0.9, { sem: op.sem + 30, ancho: 9, bisel: 0.7, junta: 1.3 });
    const postes = [];
    for (let x = x0 + 1; x < x1 - 4; x += 12) postes.push(x);
    postes.push(x1 - 3);
    for (const y of pisos) for (let x = x0; x < x1; x++) g.set(x, y, M[1], M).set(x, y + 1, M[0], M);
    const finPostes = alto ? pisos[1] + 2 : base;
    for (const x of postes) for (let y = yTop + 3; y < finPostes; y++) g.set(x, y, M[2], M).set(x + 1, y, M[1], M).set(x + 2, y, M[0], M);
    const pisosEntramado = alto ? 1 : pisos.length - 1;
    for (let p = 0; p < pisosEntramado; p++) for (let k = 0; k + 1 < postes.length; k++) {
      if (az() < 0.4) continue;
      const a = postes[k] + 3, b = postes[k + 1] - 1, ya = pisos[p] + 2, yb = pisos[p + 1] - 1;
      capa().linea(a, yb, b, ya, 2).pintar(g, M, { plano: 1 });
      if (az() < 0.4) capa().linea(a, ya, b, yb, 2).pintar(g, M, { plano: 1 });
    }
    // ventanas y puerta
    const kp = Math.floor((postes.length - 1) / 2);
    for (let p = 0; p + 1 < pisos.length; p++) for (let k = 0; k + 1 < postes.length; k++) {
      if (p === pisos.length - 2 && k === kp) continue;
      if (az() < 0.35) continue;
      const wx = postes[k] + 4, wy = pisos[p] + 5, ww = postes[k + 1] - postes[k] - 6, wh = Math.min(9, pisos[p + 1] - pisos[p] - 9);
      if (ww < 5 || wh < 5) continue;
      ventanaCasa(g, wx, wy, ww, wh, az() < 0.65, az() < 0.5);
    }
    const dx = postes[kp] + 3, dw = 8, dh = 14, dy = base - dh;
    const puerta = capa().rect(dx, dy + 2, dw, dh - 2).ell(dx + dw / 2 - 0.5, dy + 3, dw / 2 - 0.5, 3);
    puerta.pintar(g, M, { relieve: 1.5, max: 2, separar: 1 });
    cada(puerta, (x, y) => { if ((x - dx) % 3 === 2) g.set(x, y, M[0], M); });
    g.set(dx + 6, dy + 8, B[3], B).set(dx + 1, dy + 4, HI[2], HI).set(dx + 1, dy + 10, HI[2], HI);
    for (let x = dx - 1; x <= dx + dw; x++) g.set(x, base, P[3], P);
    if (op.cartel) {
      for (let x = dx + 8; x < dx + 20; x++) g.set(x, dy - 4, HI[2], HI);
      g.set(dx + 9, dy - 5, HI[2], HI).set(dx + 19, dy - 3, HI[1], HI).set(dx + 18, dy - 2, HI[1], HI);
      conBorde(g, M[0], tmp => {
        capa().rect(dx + 11, dy - 2, 11, 8).pintar(tmp, M, { relieve: 1.5, max: 3 });
        capa().rect(dx + 14, dy, 4, 4).pintar(tmp, OC, { relieve: 1, max: 4 });
        tmp.set(dx + 14, dy - 1, HU[4], HU).set(dx + 15, dy - 1, HU[4], HU).set(dx + 16, dy - 1, HU[3], HU).set(dx + 18, dy + 1, OC[2], OC).set(dx + 18, dy + 2, OC[2], OC);
      });
    }
    if (op.chimenea) {
      const [chx, chy] = op.chimenea;
      const ch = capa().rect(chx - 3, chy, 7, Math.max(6, Math.round(cumbre + (Math.abs(chx - cx) / (an / 2)) * (yTop - cumbre)) - chy + 3));
      sillares(g, chx - 3, chy, chx + 4, [3, 3, 3, 3, 3, 3, 3], P, (x) => (x < chx ? 2.3 : 1.4), { sem: 4, ancho: 4, masc: ch, junta: 1 });
      for (let x = chx - 4; x < chx + 5; x++) g.set(x, chy, P[3], P).set(x, chy + 1, P[1], P);
    }
  }
  /* Ventana con parteluz: encendida (cálida) o a oscuras, con postigos y, a veces, jardinera. */
  function ventanaCasa(g, x, y, w, h, encendida, flores = false) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const v = encendida ? 3.4 - j / h * 1.4 - (i === Math.floor(w / 2) || j === Math.floor(h / 2) ? 3 : 0) : 1 + (i + j < 3 ? 1.5 : 0) - (i === Math.floor(w / 2) ? 1 : 0);
      g.set(x + i, y + j, encendida ? [M[0], F[1], F[2], OC[3], OC[4]][lim(tono(x + i, y + j, v, 0.5), 0, 4)] : AZ[lim(Math.round(v), 0, 4)], encendida ? OC : AZ);
    }
    for (let i = -1; i <= w; i++) g.set(x + i, y + h, M[2], M).set(x + i, y - 1, M[1], M);
    for (let j = 0; j < h; j++) { g.set(x - 2, y + j, OL[2], OL); g.set(x - 1, y + j, OL[1], OL); g.set(x + w, y + j, OL[1], OL); g.set(x + w + 1, y + j, OL[0], OL); }
    if (flores) for (let i = -1; i <= w; i++) { g.set(x + i, y + h + 1, M[1], M); g.set(x + i, y + h - 1 + (i % 2), i % 3 ? HO[2] : (i % 2 ? GR[3] : HU[4]), null); }
    if (encendida) VENTANAS_ALDEA.push([x, y, w, h]);
  }
  /* Pozo de piedra con tejadillo, cubo y torno. */
  function pozo(g, cx, base) {
    const ar = capa().rect(cx - 13, base - 14, 27, 14).ell(cx, base, 13.5, 2.5).ell(cx, base - 14, 13.5, 3);
    cada(ar, (x, y) => {
      const fila = Math.floor((base - y) / 4), junta = (base - y) % 4 === 0 || (x + fila * 4) % 8 === 0;
      const v = 2.6 + luzFarolas(x, y) * 1.5 - (x - cx + 13) / 27 * 1.6 + (junta ? -1.2 : 0) + (hash(x >> 3, fila, 6) - 0.5) * 0.6;
      g.set(x, y, P[lim(tono(x, y, v, 0.3), 0, 4)], P);
    });
    capa().ell(cx, base - 14, 11, 1.8).pintar(g, SO, { plano: 0 });
    for (let x = cx - 13; x <= cx + 13; x++) g.set(x, base - 17 + (Math.abs(x - cx) > 10 ? 1 : 0), P[4], P);
    for (let x = cx - 12; x <= cx + 12; x++) if (hash(x, 3, 3) > 0.6) g.set(x, base - 16, MUSGO[3], MUSGO);
    capa().rect(cx - 14, base - 38, 3, 22).rect(cx + 12, base - 38, 3, 22).pintar(g, M, { relieve: 1.2, separar: 1 });
    const techo = capa().poly([[cx - 19, base - 35], [cx + 0.5, base - 46], [cx + 20, base - 35], [cx + 20, base - 33], [cx - 19, base - 33]]);
    cada(techo, (x, y) => g.set(x, y, (y - base + 60) % 2 ? TE[x < cx ? 3 : 2] : TE[1], TE));
    contraluz(g, techo, TE[4], 0, -1);
    for (let x = cx - 12; x <= cx + 12; x++) g.set(x, base - 30, M[2], M).set(x, base - 29, M[0], M);
    for (let y = base - 28; y < base - 22; y++) g.set(cx, y, HU[1], HU);
    capa().rect(cx - 3, base - 22, 7, 5).pintar(g, M, { relieve: 1, separar: 1 });
    g.set(cx - 3, base - 21, HI[3], HI).set(cx + 3, base - 21, HI[2], HI).set(cx + 15, base - 30, M[2], M).set(cx + 16, base - 29, M[2], M).set(cx + 16, base - 28, M[1], M);
  }
  /* Puesto del mercado: toldo a rayas, mostrador con cestos, calabazas y un farolillo. */
  function puesto(g, x0, x1, base) {
    for (const x of [x0 + 2, x1 - 4]) capa().rect(x, base - 34, 3, 34).pintar(g, M, { relieve: 1.2, separar: 1 });
    const yA = base - 44;
    for (let y = yA; y < yA + 10; y++) {
      const k = (y - yA) / 10, a = x0 + (1 - k) * 4, b = x1 - (1 - k) * 4;
      for (let x = Math.round(a); x < Math.round(b); x++) {
        const ram = Math.floor((x - x0 + 200) / 5) % 2 ? GR : HU;
        g.set(x, y, ram[lim(tono(x, y, 2.6 - k * 0.9 - (x > b - 4 ? 0.8 : 0) + luzFarolas(x, y + 30) * 0.8, 0.4), 0, 4)], ram);
      }
    }
    for (let x = x0; x < x1; x++) {
      const ram = Math.floor((x - x0 + 200) / 5) % 2 ? GR : HU, hondo = [2, 3, 4, 3, 2][(x - x0) % 5];
      for (let y = yA + 10; y < yA + 10 + hondo; y++) g.set(x, y, ram[y === yA + 10 ? 1 : 2], ram);
      g.set(x, yA + 10 + hondo, NE[1], NE);
    }
    capa().rect(x0, base - 16, x1 - x0, 16).pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1 });
    for (let x = x0; x < x1; x++) { g.set(x, base - 16, M[3], M); if ((x - x0) % 8 === 0) for (let y = base - 14; y < base; y++) g.set(x, y, M[0], M); }
    for (const [x, ram] of [[x0 + 5, GR], [x0 + 17, HO], [x0 + 29, OC]]) {
      capa().rect(x, base - 22, 10, 6).off(x, base - 17).off(x + 9, base - 17).pintar(g, OC, { relieve: 1.2, max: 3, separar: 1 });
      for (let i = 0; i < 9; i++) if ((x + i) % 3 === 0) for (let j = base - 21; j < base - 17; j++) g.set(x + i, j, OC[1], OC);
      for (let i = 0; i < 5; i++) capa().ell(x + 1.5 + i * 1.8, base - 23, 1.4, 1.3).pintar(g, ram, { relieve: 1, max: 4, min: 2 });
    }
    for (const [x, r] of [[x1 - 9, 4.5], [x1 - 17, 3.5]]) {
      const c = capa().ell(x, base - r, r + 1.5, r);
      c.pintar(g, TE, { relieve: 2.5, max: 4, separar: 1 });
      cada(c, (px, py) => { if (Math.abs(px - x) === Math.round(r * 0.5)) desplazar(g, px, py, -1); });
      g.set(x, base - r * 2, HO[2], HO).set(x + 1, base - r * 2 - 1, HO[3], HO);
    }
    for (let j = yA + 13; j < yA + 17; j++) g.set(x1 - 22, j, HI[1], HI);
    farol(g, x1 - 22, yA + 23);
  }
  /* Farola de hierro sobre un poste de madera. */
  function farola(g, x, base) {
    capa().rect(x - 1, FAROLA_ALDEA[1] + 7, 3, base - FAROLA_ALDEA[1] - 7).rect(x - 3, base - 3, 7, 3).pintar(g, HI, { relieve: 1, max: 3, separar: 1 });
    for (let i = -4; i <= 4; i++) g.set(x + i, FAROLA_ALDEA[1] - 7, HI[2], HI);
    farol(g, x, FAROLA_ALDEA[1]);
  }
  function aldeaAnim(ctx, t) {
    // humo de la chimenea
    const [cx, cy] = CHIMENEA_ALDEA;
    for (let i = 0; i < 7; i++) {
      const p = (t / 2600 + i / 7) % 1, x = Math.round(cx + p * 18 + Math.sin(p * 7 + i) * 2), y = Math.round(cy - 2 - p * 34), s = Math.round(1 + p * 3.5);
      ctx.fillStyle = p < 0.3 ? GRIS[4] : p < 0.65 ? CIELO_ALDEA[5] : CIELO_ALDEA[4];
      ctx.fillRect(x - s, y, s * 2 + 1, 1);
      ctx.fillRect(x - s + 1, y - 1, s * 2 - 1, 1);
      if (s > 1) ctx.fillRect(x - s + 1, y + 1, s * 2 - 1, 1);
    }
    // estrellas que titilan
    for (let i = 0; i < 6; i++) {
      if (Math.sin(t / 400 + i * 2.3) < 0.7) continue;
      const x = Math.floor(hash(i * 7, 1, 3) * W), y = Math.floor(hash(i * 7, 2, 3) ** 1.6 * 60);
      ctx.fillStyle = HU[4]; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
    }
    // una ventana que parpadea, como si alguien pasara por delante con un candil
    const v = VENTANAS_ALDEA[Math.floor(t / 3000) % Math.max(1, VENTANAS_ALDEA.length)];
    if (v && Math.sin(t / 300) > 0.3) { ctx.fillStyle = F[1]; ctx.fillRect(v[0] + 1, v[1] + 1, Math.max(1, Math.floor(v[2] / 2) - 1), v[3] - 2); }
    // polillas alrededor de los faroles y llamas
    for (const [fx, fy, k] of [[FAROLA_ALDEA[0], FAROLA_ALDEA[1], 0], [222, 89, 1]]) {
      llamaFarol(ctx, fx, fy, t, k * 2.1);
      for (let i = 0; i < 2; i++) {
        const a = t / (300 + i * 90) + i * 3 + k;
        ctx.fillStyle = HU[3]; ctx.fillRect(Math.round(fx + Math.cos(a) * (5 + i * 2)), Math.round(fy + 2 + Math.sin(a * 1.3) * 5), 1, 1);
      }
    }
    // estandarte en la torre del castillo
    for (let i = 0; i < 6; i++) {
      const y = 36 + Math.round(Math.sin(t / 220 - i * 0.8) * (i / 6) * 1.4);
      ctx.fillStyle = i < 3 ? GR[3] : GR[2];
      ctx.fillRect(189 + i, y, 1, i < 4 ? 3 : 2);
    }
  }


  /* ======================================================================
     El camino del bosque, al atardecer
     ====================================================================== */
  const CIELO_OCASO = ["#1c1230", "#2c1a44", "#452656", "#673366", "#8e3f68", "#b44f5c", "#d86a4a", "#f09a48", "#ffd27a", "#fff0b8"];
  const SILUETA = [SO[0], SO[1], "#24152e", "#3a1f40", "#56294e", "#7a3550", "#9a4450"];
  const SUELO_OCASO = [SO[1], "#1a1f16", PRADO[1], PRADO[2], PRADO[3], OL[3], OC[3]];
  const SOL = [150, 61], HORIZONTE = 80;
  /* El camino: centro y medio ancho a cada altura (se estrecha hacia el sol). */
  const caminoEn = y => {
    const t = lim((y - HORIZONTE) / (H - HORIZONTE));
    return [SOL[0] - 40 * t + Math.sin(t * 3.5) * 10 * t, 1 + 78 * t ** 1.6];
  };
  const brilloSol = (x, y) => Math.max(0, 1 - Math.hypot(x - SOL[0], (y - SOL[1]) * 1.6) / 120);
  /* Rayos de sol: cuñas que salen del sol hacia abajo y a los lados. */
  const rayo = (x, y) => {
    const a = Math.atan2(y - SOL[1], x - SOL[0]), d = Math.hypot(x - SOL[0], y - SOL[1]);
    const r = Math.sin(a * 9 + 0.6) * Math.sin(a * 4 - 1.2);
    return r > 0.35 && d > 14 ? (r - 0.35) * Math.max(0, 1 - d / 210) * 1.8 * lim((y - SOL[1] + 4) / 24) : 0;
  };
  function camino(g) {
    const [sx, sy] = SOL;
    rellenar(g, 0, 0, W, HORIZONTE + 4, CIELO_OCASO, (x, y) => Math.pow(y / HORIZONTE, 1.25) * 7.6 + brilloSol(x, y) ** 1.5 * 2.6, 0.7);
    // nubes alargadas con la panza encendida, en dos alturas
    for (const [x0, x1, y, k, sem] of [[-10, 96, 14, 2, 1], [120, 250, 9, 2, 2], [30, 150, 30, 3, 3], [170, 266, 36, 4, 4], [60, 120, 50, 5, 5], [196, 250, 56, 6, 6]]) nubeOcaso(g, x0, x1, y, k, sem);
    // el sol, con su halo
    for (let y = sy - 26; y <= sy + 26; y++) for (let x = sx - 30; x <= sx + 30; x++) {
      const d = Math.hypot(x - sx, y - sy);
      if (d > 10 && d < 26 && umbral(x, y) < (1 - (d - 10) / 16) * 0.7) desplazar(g, x, y, 1);
    }
    capa().ell(sx, sy, 10.5, 10.5).pintar(g, [F[4]], { plano: 0 });
    capa().ell(sx - 1, sy - 1, 7.5, 7.5).pintar(g, [HU[4]], { plano: 0 });
    // montañas lejanas, violeta y brumosas
    for (let x = 0; x < W; x++) {
      const top = Math.round(58 + Math.abs(Math.sin(x * 0.021 + 0.4)) * -12 + Math.sin(x * 0.07) * 3 + 10);
      for (let y = top; y < HORIZONTE + 4; y++) {
        const v = 4.2 + brilloSol(x, y) * 1.6 - (y - top) * 0.03 + (y === top ? 0.8 : 0) + (ruido(x / 7, y / 4, 8) - 0.5) * 0.8;
        g.set(x, y, CIELO_OCASO[lim(tono(x, y, v, 0.35), 2, 7)], CIELO_OCASO);
      }
    }
    // bosque lejano contra el sol
    for (let x = 0; x < W; x++) {
      const pico = (hash(x >> 2, 3) * 5 + (x % 4 === 1 ? 2 : 0)) * (hash(x >> 3, 5) > 0.35 ? 1 : 0.5);
      const top = Math.round(76 - pico - Math.sin(x * 0.04) * 2);
      for (let y = top; y < HORIZONTE + 6; y++) g.set(x, y, SILUETA[Math.abs(x - sx) < 34 && y === top ? 6 : 5], SILUETA);
    }
    // el suelo: prado al sol de la tarde y el camino de tierra
    for (let y = HORIZONTE; y < H; y++) for (let x = 0; x < W; x++) {
      const t = (y - HORIZONTE) / (H - HORIZONTE), [cx, an] = caminoEn(y), d = Math.abs(x - cx);
      const bs = brilloSol(x, y);
      const borde = an + (ruido(x * 0.3, y * 0.5, 12) - 0.5) * (1 + t * 5);
      if (d < borde) {
        const rodada = Math.abs(d - an * 0.42) < 0.5 + t * 1.6;
        const centro = d < an * 0.18 && t > 0.3;
        let v = 2.3 + bs * 2.2 - t * 0.5 - (rodada ? 1 : 0) - (d > borde - 1.5 - t * 2 ? 0.6 : 0) + (ruido(x * 0.4, y * 0.6, 14) - 0.5) * 0.9;
        if (centro && ruido(x * 0.5, y * 0.4, 15) > 0.64) g.set(x, y, SUELO_OCASO[lim(tono(x, y, 2.2 + bs * 1.8 - t * 0.4, 0.5), 1, 6)], SUELO_OCASO);
        else g.set(x, y, TIERRA[lim(tono(x, y, v, 0.4), 0, 4)], TIERRA);
      } else {
        const cerca = lim(1 - (d - an) / (30 + t * 60));
        let v = 1.6 + bs * 2.6 + cerca * 0.5 - t * 0.6 + (fbm(x / 10, y / (3 + t * 6), 16) - 0.5) * 1.6;
        if (t > 0.15 && hash(x, y, 17) > 0.86 - t * 0.1) v += hash(x, y, 18) > 0.5 ? 1 : -1;
        g.set(x, y, SUELO_OCASO[lim(tono(x, y, v, 0.5), 0, 6)], SUELO_OCASO);
      }
    }
    // árboles a ambos lados del camino, en tres filas, cada vez más cerca y más oscuros
    const fila = (lista, k, borde) => {
      for (const [x, by, alto] of lista) {
        const c = pino(g, x, by, alto, alto * 0.5, SILUETA, { plano: k });
        contraluz(g, c, borde, x < sx ? 1 : -1, 0);
        if (alto > 30) contraluz(g, c, borde, x < sx ? 1 : -1, -1);
      }
    };
    fila([[16, 84, 26], [30, 82, 20], [44, 83, 24], [60, 81, 16], [74, 81, 12], [88, 80, 9], [196, 81, 12], [208, 82, 18], [222, 84, 24], [238, 83, 20]], 4, CIELO_OCASO[6]);
    fila([[6, 92, 44], [24, 90, 36], [42, 92, 30], [58, 89, 22], [212, 90, 26], [228, 92, 38], [248, 91, 44]], 3, CIELO_OCASO[5]);
    fila([[-4, 104, 70], [16, 100, 56], [236, 100, 58], [258, 106, 78]], 2, CIELO_OCASO[4]);
    // el gran roble de la izquierda enmarca la escena
    roble(g);
    // rayos de sol entre los troncos
    iluminar(g, 0, 0, W, H, (x, y) => rayo(x, y) * (y > HORIZONTE ? 0.9 : 0.5), 1);
    // matas de hierba alta, flores y piedras en las cunetas
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(hash(i, 7) * W), y = 84 + Math.floor(hash(i, 8) ** 0.7 * 60), t = (y - HORIZONTE) / (H - HORIZONTE), [cx, an] = caminoEn(y);
      if (Math.abs(x - cx) < an + 2) continue;
      const al = 2 + Math.floor(t * 6), bs = brilloSol(x, y);
      for (let j = 0; j < al; j++) {
        g.set(x, y - j, SUELO_OCASO[j > al / 2 ? 3 : 2], SUELO_OCASO);
        g.set(x + (j % 2 ? 1 : -1), y - j - 1, j === al - 1 ? (bs > 0.3 ? OC[3] : PRADO[4]) : SUELO_OCASO[3], SUELO_OCASO);
      }
      if (hash(i, 9) > 0.7 && t > 0.3) g.set(x + 1, y - al - 1, [HU[4], VI[3], OC[4], GR[3]][i % 4], null);
    }
    for (const [x, y, r] of [[18, 128, 4], [226, 132, 3.5], [60, 104, 2.5], [184, 112, 3]]) {
      const c = capa().ell(x, y, r + 1, r * 0.7);
      c.pintar(g, P, { relieve: 2, max: 4, separar: 1 });
      for (let i = -r; i <= r; i++) g.set(Math.round(x + i), Math.round(y + r * 0.7 + 1), SO[1], SO);
    }
    carroVolcado(g);
    // poste de piedra que marca las leguas
    conBorde(g, SO[0], tmp => {
      capa().rect(96, 90, 5, 10).ell(98.5, 90, 2.5, 2).pintar(tmp, P, { relieve: 1.5, max: 4, sesgo: 0.1 });
      tmp.set(97, 93, P[1], P).set(98, 93, P[1], P).set(98, 95, P[1], P);
    });
  }
  /* Nube alargada de ocaso: lomo oscuro, panza encendida por el sol. */
  function nubeOcaso(g, x0, x1, y, k, sem) {
    for (let x = x0; x < x1; x++) {
      const f = (x - x0) / (x1 - x0), alto = Math.round((1 + Math.sin(f * Math.PI) * 3.2) * (0.7 + ruido(x / 9, 0, sem) * 0.6));
      for (let j = 0; j < alto; j++) if (umbral(x, y - j) < 0.92 - j * 0.08) g.set(x, y - j, CIELO_OCASO[lim(k - (j > 1 ? 1 : 0), 0, 9)], CIELO_OCASO);
      const lit = f > 0.12 && f < 0.88;
      g.set(x, y + 1, CIELO_OCASO[lim(k + (lit ? 3 : 1) + (brilloSol(x, y) > 0.5 ? 1 : 0), 0, 9)], CIELO_OCASO);
      if (lit && umbral(x, y + 2) < 0.5) g.set(x, y + 2, CIELO_OCASO[lim(k + 2, 0, 9)], CIELO_OCASO);
    }
  }
  /* Roble viejo en primer plano, a contraluz, con ramas que cuelgan por arriba. */
  function roble(g) {
    const c = capa();
    c.linea(8, 144, 12, 90, 14).linea(12, 90, 16, 60, 11).linea(16, 60, 30, 30, 7).linea(30, 30, 62, 14, 4).linea(14, 62, 2, 30, 6).linea(22, 44, 46, 34, 3).linea(30, 30, 40, 4, 3);
    for (const [dx, dy] of [[-12, 4], [18, 6], [28, 2]]) c.curva(10, 132, 10 + dx * 0.5, 136, 10 + dx, 140 + dy * 0.3, 5, 2);
    cada(c, (x, y) => g.set(x, y, SILUETA[1], SILUETA));
    contraluz(g, c, (x, y) => SILUETA[y < 80 ? 5 : 4], 1, 0);
    cada(c, (x, y) => { if (!c.tiene(x + 2, y) && c.tiene(x + 1, y) && umbral(x, y) < 0.5) g.set(x, y, SILUETA[3], SILUETA); });
    const hoja = capa(), azh = azar(33);
    for (const [x, y, rx, ry] of [[18, 4, 30, 12], [52, 6, 22, 9], [74, 2, 16, 6], [6, 24, 12, 10], [36, 20, 12, 6], [62, 13, 8, 4]]) hoja.ell(x, y, rx, ry);
    cada(hoja, (x, y) => { if (!hoja.tiene(x, y + 1) && azh() < 0.45) hoja.on(x, y + 1); if (!hoja.tiene(x + 1, y) && azh() < 0.35) hoja.on(x + 1, y); });
    cada(hoja, (x, y) => g.set(x, y, SILUETA[fbm(x / 5, y / 4, 34) > 0.62 ? 2 : 1], SILUETA));
    contraluz(g, hoja, (x, y) => CIELO_OCASO[brilloSol(x, y) > 0.3 ? 6 : 5], 1, 1);
    cada(hoja, (x, y) => { if (!hoja.tiene(x + 2, y + 1) && hoja.tiene(x + 1, y) && umbral(x, y) < 0.5) g.set(x, y, SILUETA[3], SILUETA); });
    // hojas sueltas colgando por el borde de la copa
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(i, 3, 33) * 92), y = 10 + Math.floor(hash(i, 4, 33) * 26);
      if (!hoja.tiene(x, y - 2) || hoja.tiene(x, y)) continue;
      g.set(x, y, SILUETA[2], SILUETA).set(x, y - 1, SILUETA[2], SILUETA);
    }
  }
  /* El carro asaltado: volcado, con una rueda rota, la carga por el suelo y flechas clavadas. */
  function carroVolcado(g) {
    const x = 190, y = 88;
    conBorde(g, SO[0], tmp => {
      const caja = capa().poly([[x, y + 10], [x + 40, y], [x + 46, y + 15], [x + 6, y + 25]]);
      caja.pintar(tmp, M, { relieve: 2.5, max: 3, sesgo: -0.15 });
      cada(caja, (px, py) => { if (Math.round((py - y - 10) + (px - x) * 0.25) % 5 === 0) tmp.set(px, py, M[0], M); });
      contraluz(tmp, caja, TE[3], -1, -1);
      capa().linea(x + 3, y + 13, x - 14, y, 3).pintar(tmp, M, { relieve: 1, max: 3 });
      const rueda = capa().ell(x + 16, y + 20, 9.5, 9.5).quitarEll(x + 16, y + 20, 7.4, 7.4);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283 + 0.3; rueda.linea(x + 16, y + 20, x + 16 + Math.cos(a) * 8, y + 20 + Math.sin(a) * 8, 1); }
      rueda.ell(x + 16, y + 20, 2, 2).pintar(tmp, M, { relieve: 1, max: 3, sesgo: -0.1 });
      cada(rueda, (px, py) => { if (Math.hypot(px - x - 16, py - y - 20) > 8.6 && px < x + 14) tmp.set(px, py, TE[3], TE); });
      cajon(tmp, x + 27, y + 18, 11, 9, -0.2);
      capa().ell(x + 44, y + 25, 5.5, 3.4).pintar(tmp, HU, { relieve: 2, max: 3, sesgo: -0.2 });
    });
    const rota = capa().ell(x + 52, y + 32, 9, 2.4).quitarEll(x + 52, y + 32, 6.6, 1.4).linea(x + 45, y + 32, x + 59, y + 32, 1);
    rota.pintar(g, M, { plano: 1 });
    for (const [ax, ay, dx, dy] of [[x + 24, y + 4, -6, -4], [x + 33, y + 3, -5, -5], [x + 8, y + 12, -6, -2], [x - 6, y + 28, -2, -7]]) {
      capa().linea(ax, ay, ax + dx, ay + dy, 1).pintar(g, M, { plano: 3 });
      g.set(ax + dx, ay + dy, HU[3], HU).set(ax + dx + (dx < 0 ? -1 : 1), ay + dy, GR[3], GR).set(ax + dx, ay + dy - 1, HU[4], HU);
    }
    for (const px of [x - 20, x - 12]) g.set(px, y + 26, M[1], M).set(px + 1, y + 26, OC[3], OC);
  }
  function caminoAnim(ctx, t) {
    luciernagas(ctx, t, 16, 0, 86, W, 50, [OL[3], HO[4], OC[4]], 5);
    // pájaros que cruzan el cielo, muy despacio
    for (let i = 0; i < 3; i++) {
      const p = ((t / 1000) * 0.018 + i * 0.33) % 1, x = Math.round(-10 + p * (W + 20) + i * 7), y = Math.round(24 + i * 6 + Math.sin(p * 9 + i) * 3);
      const ala = Math.sin(t / 140 + i * 2) > 0 ? -1 : 0;
      ctx.fillStyle = SILUETA[1];
      ctx.fillRect(x - 2, y + ala, 2, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillRect(x + 1, y + ala, 2, 1);
    }
    hojas(ctx, t, 6, 0, 10, 90, 140, [SILUETA[3], CIELO_OCASO[5], OC[2]], 8, 0.06);
  }


  /* ======================================================================
     El Bosque de los Susurros
     ====================================================================== */
  const BOSQ = ["#070e0b", "#0b1510", "#10201a", "#14261a", "#1a3324", "#213d27", "#2a4a35", "#365c44", "#4a7458", "#6a9478"];
  const CORTEZA = [MUSGO[0], "#1c140e", M[0], M[1], "#5a4a36", MUSGO[3]];
  const SETAS_B = [[40, 104, 0], [18, 132, 1], [214, 106, 0], [240, 130, 1], [150, 97, 0], [96, 99, 1]];
  const claroB = (x, y) => Math.max(0, 1 - Math.hypot((x - 128) / 150, (y - 72) / 46));
  /* Haces de luz que bajan de las copas, inclinados hacia la derecha. */
  const hazB = (x, y) => {
    let r = 0;
    for (const [x0, w, k] of [[62, 7, 1], [104, 11, 1.2], [146, 6, 0.9], [184, 9, 0.8]]) { const c = x0 + y * 0.34; r = Math.max(r, (1 - Math.abs(x - c) / w) * k); }
    return Math.max(0, r) * lim(1 - y / 130);
  };
  const brilloSetas = (x, y) => SETAS_B.reduce((v, [sx, sy]) => v + Math.max(0, 1 - Math.hypot(x - sx, (y - sy) * 1.4) / 24) ** 1.5, 0);
  function bosque(g) {
    rellenar(g, 0, 0, W, 104, BOSQ, (x, y) => 2.2 + claroB(x, y) * 4.8 - Math.max(0, 30 - y) * 0.04, 0.6);
    // tres hileras de troncos, cada vez más cerca y más oscuras, con bancos de niebla entre ellas
    const az = azar(41);
    const hilera = (n, w0, w1, dv, sueloY, niebla) => {
      for (let i = 0; i < n; i++) {
        const x = 20 + Math.floor(az() * 216), w = w0 + az() * (w1 - w0), incl = (az() - 0.5) * 0.06;
        for (let y = 0; y < sueloY; y++) {
          const xs = x + (y - sueloY) * incl, ancho = w + Math.max(0, y - sueloY + 6) * 0.9;
          for (let k = Math.round(xs - ancho / 2); k < xs + ancho / 2; k++) {
            const u = (k - (xs - ancho / 2)) / ancho;
            const v = 2.2 + claroB(k, y) * 4.8 - dv + (u < 0.25 ? 0.8 : u > 0.75 ? -0.6 : 0) + (ruido(k * 0.7, y * 0.08, i) - 0.5) * 0.8;
            g.set(k, y, BOSQ[lim(tono(k, y, v, 0.4), 0, 9)], BOSQ);
          }
        }
      }
      for (const [cx, cy, rx, ry] of niebla) velo(g, cx - rx, cy - ry, rx * 2, ry * 2, (x, y) => (1 - Math.hypot((x - cx) / rx, (y - cy) / ry)) * 1.1, (x, y) => BOSQ[lim(Math.round(4 + claroB(x, y) * 4.5), 0, 9)], BOSQ);
    };
    hilera(12, 3, 6, 1.4, 92, [[70, 74, 50, 7], [170, 78, 46, 6], [120, 66, 30, 4]]);
    hilera(8, 7, 12, 3, 96, [[50, 88, 44, 5], [140, 90, 56, 5], [220, 84, 30, 4]]);
    hilera(5, 13, 18, 4.6, 100, []);
    // haces de luz entre las copas
    iluminar(g, 0, 0, W, 104, (x, y) => hazB(x, y) * 2.6, 1);
    iluminar(g, 0, 96, W, 48, (x, y) => hazB(x, 96) * 1.6 * lim(1 - Math.abs(y - 108) / 14), 1);
    // las copas, con musgo colgando
    const cp = copa(g, [[16, 2, 30, 12], [64, -4, 26, 10], [112, -2, 22, 8], [160, -4, 28, 11], [214, 0, 26, 12], [250, 8, 14, 10], [90, 6, 12, 5], [188, 10, 12, 5]], MUSGO, 13, { relieve: 5, max: 3 });
    contraluz(g, cp, MUSGO[4], -1, -1);
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(hash(i, 1, 51) * W);
      let y = 0;
      while (y < 30 && cp.tiene(x, y + 1)) y++;
      const largo = 4 + Math.floor(hash(i, 2, 51) * 14);
      for (let j = 0; j < largo; j++) g.set(x + Math.round(Math.sin(j * 0.5 + i) * 0.6), y + j, j % 3 ? MUSGO[2] : MUSGO[3], MUSGO);
    }
    // el suelo: musgo, hojarasca y una senda que se pierde entre los árboles
    for (let y = 96; y < H; y++) for (let x = 0; x < W; x++) {
      const t = (y - 96) / (H - 96);
      const senda = Math.abs(x - (128 + (y - 96) * -0.35 + Math.sin(y * 0.08) * 6)) < 4 + t * 26 + (ruido(x * 0.2, y * 0.3, 52) - 0.5) * 6;
      let v = 3.6 + claroB(x, y) * 2.4 - t * 0.8 + (fbm(x / 9, y / (2 + t * 5), 53) - 0.5) * 1.6;
      if (y < 98) v -= 1.2;
      if (senda) {
        if (hash(x, y, 54) > 0.82) g.set(x, y, hash(x, y, 58) > 0.5 ? M[1] : TIERRA[1], M);
        else g.set(x, y, BOSQ[lim(tono(x, y, v + 0.7, 0.5), 0, 9)], BOSQ);
      } else if (hash(x >> 1, y, 55) > 0.985 - t * 0.01) g.set(x, y, [M[0], TE[1], OC[1], M[1]][Math.floor(hash(x, y, 56) * 4)], M);
      else g.set(x, y, BOSQ[lim(tono(x, y, v, 0.4), 0, 9)], BOSQ);
    }
    // hojas caídas (dos píxeles) sobre el musgo
    for (let i = 0; i < 34; i++) {
      const x = Math.floor(hash(i, 1, 57) * W), y = 100 + Math.floor(hash(i, 2, 57) * 44);
      const col = [TE[1], OC[1], M[2], TE[2]][i % 4];
      g.set(x, y, col, null).set(x + 1, y, col, null).set(x + 1, y - 1, TE[3], null);
    }
    // los dos árboles enormes de los lados, con raíces que se clavan en el suelo
    arbolViejo(g, [[4, -2], [16, 40], [12, 80], [8, 112]], [34, 30, 32], 1);
    arbolViejo(g, [[246, -2], [236, 44], [242, 80], [250, 112]], [32, 30, 34], -1);
    caraCorteza(g, 238, 60);
    // raíces sueltas sobre el suelo
    for (const [x0, y0, x1, y1, gr] of [[30, 108, 74, 114, 4], [30, 116, 52, 128, 3], [224, 108, 188, 112, 4], [226, 118, 206, 130, 3]]) capa().curva(x0, y0, (x0 + x1) / 2, y0 + 4, x1, y1, gr, 1.5).pintar(g, CORTEZA, { relieve: 1.5, max: 4, luz: [-0.5, -0.8, 0.6] });
    SETAS_B.forEach(([x, y, k]) => setas(g, x, y, k ? MG : ESPECTRO));
    // resplandor de las setas sobre lo que las rodea
    iluminar(g, 0, 60, W, 84, (x, y) => brilloSetas(x, y) * 1.4, 1);
    helecho(g, 0, 144, 1, 22);
    helecho(g, 256, 144, -1, 22);
    helecho(g, 58, 106, 1, 10);
    helecho(g, 196, 104, -1, 10);
  }
  function arbolViejo(g, pts, grueso, lado) {
    const c = tronco(g, pts, grueso, CORTEZA, { relieve: 6, max: 4, luz: [-0.7, -0.4, 0.6] });
    // surcos verticales de la corteza
    cada(c, (x, y) => { if (c.tiene(x - 2, y) && c.tiene(x + 2, y) && ruido(x * 0.45, y * 0.05, 60) > 0.66) desplazar(g, x, y, -2); });
    // musgo por el lado iluminado
    cada(c, (x, y) => { if (!c.tiene(x - 1, y) && hash(x, y, 9) > 0.25) g.set(x, y, MUSGO[4], MUSGO); else if (!c.tiene(x - 3, y) && fbm(x / 3, y / 5, 61) > 0.55) g.set(x, y, MUSGO[3], MUSGO); });
    contraluz(g, c, CORTEZA[0], lado < 0 ? -1 : 1, 0);
    const base = pts[pts.length - 2];
    for (const [dx, dy, gr] of [[lado * 30, 2, 7], [lado * 42, -4, 5], [lado * -10, 6, 6], [lado * 16, 10, 5]]) {
      const r = capa().curva(base[0], base[1] + 12, base[0] + dx * 0.5, base[1] + dy + 10, base[0] + dx, base[1] + dy + 22, gr, 2);
      r.pintar(g, CORTEZA, { relieve: 2.5, max: 4, luz: [-0.6, -0.7, 0.6] });
      cada(r, (x, y) => { if (!r.tiene(x, y - 1) && hash(x, y, 62) > 0.4) g.set(x, y, MUSGO[3], MUSGO); });
    }
  }
  /* Una cara dormida en la corteza: los árboles que susurran. */
  function caraCorteza(g, x, y) {
    for (const dx of [-6, 4]) {
      capa().ell(x + dx, y, 2.6, 1.4).pintar(g, CORTEZA, { plano: 0 });
      for (let i = -3; i <= 3; i++) g.set(x + dx + i, y - 2 - (Math.abs(i) < 2 ? 1 : 0), CORTEZA[4], CORTEZA);
    }
    capa().ell(x - 1, y + 9, 3.2, 4.2).pintar(g, CORTEZA, { plano: 0 });
    capa().ell(x - 1, y + 10, 1.8, 2.6).pintar(g, SO, { plano: 0 });
    for (let j = -2; j < 6; j++) g.set(x - 1 + Math.round(Math.sin(j) * 0.5), y + j, CORTEZA[2], CORTEZA);
  }
  /* Setas que brillan con luz propia, con su halo. */
  function setas(g, x, y, ram) {
    for (let j = -12; j < 5; j++) for (let i = -14; i < 15; i++) {
      const d = Math.hypot(i, j * 1.3);
      if (d < 14 && umbral(x + i, y + j) < (1 - d / 14) * 0.55 && BOSQ.includes(g.get(x + i, y + j))) g.set(x + i, y + j, d < 6 ? ram[2] : ram[1], ram);
    }
    for (const [dx, h, r] of [[0, 7, 4], [-5, 4, 2.6], [5, 4, 3], [9, 2, 1.6], [-9, 2, 1.4]]) {
      for (let j = 0; j < h; j++) { g.set(x + dx, y - j, HU[3], HU); if (r > 2.5) g.set(x + dx + 1, y - j, HU[2], HU); }
      const c = capa().ell(x + dx + 0.5, y - h - 0.5, r + 0.6, r * 0.62).quitarRect(0, y - h + 1, W, 12);
      c.pintar(g, ram, { relieve: 2, min: 2, max: 4 });
      for (let i = Math.round(x + dx - r); i <= x + dx + r + 1; i++) if (c.tiene(i, y - h)) g.set(i, y - h + 1, ram[1], ram);
      if (r > 2.5) g.set(x + dx - 1, y - h - 2, HU[4], HU).set(x + dx + 2, y - h - 1, HU[4], HU);
    }
  }
  function helecho(g, x0, y0, lado, largo0 = 14) {
    for (let k = 0; k < 7; k++) {
      const a = -0.2 - k * 0.2, largo = largo0 + (k % 3) * (largo0 / 4);
      let px = x0, py = y0;
      for (let s = 0; s < largo; s++) {
        const aa = a - s * (0.5 / largo);
        px += Math.cos(aa) * lado; py += Math.sin(aa);
        g.set(Math.round(px), Math.round(py), MUSGO[3], MUSGO);
        if (s % 2 === 0 && s > 1) {
          const hoja = Math.max(1, Math.round((largo - s) / 5));
          for (let h = 1; h <= hoja; h++) { g.set(Math.round(px), Math.round(py) - h, MUSGO[4], MUSGO); g.set(Math.round(px) + lado, Math.round(py) + h, MUSGO[2], MUSGO); }
        }
      }
    }
  }
  function bosqueAnim(ctx, t) {
    jirones(ctx, t, 9, 0, 70, W, 26, [BOSQ[7], BOSQ[6]], 3, 4);
    luciernagas(ctx, t, 12, 10, 40, 236, 70, [OL[3], HO[4], ESPECTRO[4]], 9);
    // esporas que suben despacio desde las setas
    SETAS_B.forEach(([x, y, k], i) => {
      const p = ((t / 1000) * 0.22 + hash(i, 3, 63)) % 1;
      ctx.fillStyle = (k ? MG : ESPECTRO)[p < 0.5 ? 4 : 3];
      ctx.fillRect(Math.round(x + Math.sin(p * 8 + i) * 4), Math.round(y - 8 - p * 26), 1, 1);
    });
  }


  /* ======================================================================
     El puente viejo del trol sobre el barranco
     ====================================================================== */
  const CIELO_FRIO = ["#262b40", "#343d56", "#465270", "#5e6c86", "#7c889c", "#a0a8b4", "#c4c8c8", "#e2e2da"];
  const PRETIL = [GRIS[1], GRIS[2], P[2], P[3], HU[1], HU[2]];
  const ROCA_P = [GRIS[0], GRIS[1], GRIS[2], GRIS[3], CIELO_FRIO[3], CIELO_FRIO[4], CIELO_FRIO[5]];
  const FUGA_P = [128, 56];
  const CASCADA = t => [Math.round(198 - t * 16 + Math.sin(t * 9) * 0.8), Math.round(20 + t * 50)];
  const nieblaP = (x, y) => Math.max(0, 1 - Math.abs(y - 72) / 14) * Math.max(0, 1 - Math.abs(x - FUGA_P[0]) / 110);
  function puente(g) {
    const [vx, vy] = FUGA_P;
    rellenar(g, 0, 0, W, 70, CIELO_FRIO, (x, y) => Math.pow(y / 60, 1.1) * 5.4 + Math.max(0, 1 - Math.hypot(x - vx, y - 40) / 90) * 0.8, 0.6);
    // nubes bajas, grises, deshilachadas
    for (const [cx, cy, rx, ry, sem] of [[40, 10, 40, 5, 1], [170, 6, 50, 5, 2], [110, 22, 30, 3, 3], [230, 26, 30, 3, 4]]) {
      for (let y = Math.floor(cy - ry * 2); y <= cy + ry * 2; y++) for (let x = Math.floor(cx - rx * 1.4); x <= cx + rx * 1.4; x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(x / 10, y / 4, sem) - 0.5) * 1.2;
        if (d < 1 && umbral(x, y) < (1 - d) * 2) g.set(x, y, CIELO_FRIO[lim(Math.round(4 + (y < cy ? 1.5 : 0) - d * 1.5), 1, 7)], CIELO_FRIO);
      }
    }
    // cordilleras lejanas con nieve
    for (let x = 0; x < W; x++) {
      const t1 = Math.round(40 - Math.abs(Math.sin(x * 0.028 + 0.3)) * 14 - Math.abs(Math.sin(x * 0.071 + 2)) * 4);
      for (let y = t1; y < 70; y++) {
        const nieve = y < t1 + 2 + Math.sin(x * 0.5) * 1.5 + (32 - t1) * 0.3 && t1 < 32;
        g.set(x, y, nieve ? CIELO_FRIO[(x + y) % 3 ? 7 : 6] : CIELO_FRIO[lim(tono(x, y, 4.6 - (y - t1) * 0.05 + (x < 128 ? -0.3 : 0.2), 0.4), 2, 6)], CIELO_FRIO);
      }
      const t2 = Math.round(50 - Math.abs(Math.sin(x * 0.045 + 1.1)) * 8 + Math.sin(x * 0.17) * 1.5);
      for (let y = t2; y < 70; y++) g.set(x, y, CIELO_FRIO[lim(tono(x, y, 3.4 - (y - t2) * 0.04 + (y === t2 ? 1 : 0), 0.4), 1, 5)], CIELO_FRIO);
    }
    // paredes del barranco: la izquierda en sombra, la derecha a la luz
    const borde = (y, lado) => (lado < 0 ? vx - 3 - (y - vy) * 1.15 : vx + 3 + (y - vy) * 1.15) + Math.sin(y * 0.9) * 1.5 + Math.sin(y * 0.37 + lado) * 3;
    const izq = capa().poly([[0, 28], [vx - 3, vy - 4], [vx - 3, vy + 1], [0, vy + 40]]), der = capa().poly([[W, 22], [vx + 3, vy - 5], [vx + 3, vy + 1], [W, vy + 40]]);
    for (let y = vy; y < 100; y++) for (let x = 0; x < W; x++) { if (x < borde(y, -1)) izq.on(x, y); if (x > borde(y, 1)) der.on(x, y); }
    const est = teselas(150, 51, 0, 0, W, 100, 3.2, 26);
    const lejos = (x, y) => 1 - Math.min(1, Math.hypot(x - vx, (y - vy) * 1.6) / 130);
    const estrato = (x, y) => Math.sin(y * 0.35 + x * (x < vx ? -0.09 : 0.09)) * 0.35;
    roca(g, est, ROCA_P, (x, y) => 1.1 + estrato(x, y) + lejos(x, y) ** 1.4 * 3.2, () => [-0.6, -0.8, 1], { masc: izq, vari: 0.6, relieve: 1.5, bisel: 1.8, oscuro: 1.2, s: 0.3 });
    roca(g, est, ROCA_P, (x, y) => 2.4 + estrato(x, y) + lejos(x, y) ** 1.4 * 2.4, () => [-0.6, -0.8, 1], { masc: der, vari: 0.6, relieve: 1.6, bisel: 1.8, oscuro: 1.4, s: 0.3 });
    // canto del barranco: la pared de la derecha recibe la luz en su borde, la de la izquierda se hunde en sombra
    contraluz(g, der, (x, y) => ROCA_P[lim(Math.round(4 + lejos(x, y) * 2), 0, 6)], -1, 0);
    contraluz(g, izq, (x, y) => ROCA_P[lim(Math.round(lejos(x, y) * 3), 0, 6)], 1, 0);
    // repisas con musgo y matojos
    for (let y = 1; y < 100; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, k = est.id[i];
      if (k < 0 || est.borde[i] > 1.3 || (!izq.tiene(x, y) && !der.tiene(x, y)) || lejos(x, y) > 0.62) continue;
      if (est.pts[k][1] > y && hash(k, 2) > 0.5 && est.id[(y - 1) * W + x] !== k) g.set(x, y, MUSGO[izq.tiene(x, y) ? 2 : 3 + (hash(x, y) > 0.7 ? 1 : 0)], MUSGO);
    }
    // bruma de la distancia sobre las paredes, junto al fondo
    // pinares en lo alto de ambas paredes, cada vez más pequeños hacia el fondo
    for (const lado of [-1, 1]) for (let k = 0; k < 16; k++) {
      const f = k / 15, x = lado < 0 ? f * (vx - 8) : W - f * (W - vx - 8), y = lado < 0 ? 28 + f * (vy - 32) : 22 + f * (vy - 27);
      const alto = 34 * (1 - f) ** 1.2 + 4;
      const c = pino(g, Math.round(x + lado * -3 + hash(k, lado + 5) * 4), Math.round(y + 3), alto, alto * 0.48, MUSGO, { relieve: 2, max: lado < 0 ? 2 : 3, luz: [-0.8, -0.4, 0.5] });
      if (lado > 0) contraluz(g, c, MUSGO[4], -1, 0);
      if (f > 0.4) cada(c, (px, py) => { if (umbral(px, py) < (f - 0.35) * 1.8) g.set(px, py, CIELO_FRIO[lim(MUSGO.indexOf(g.get(px, py)) + 1, 1, 4)], CIELO_FRIO); });
    }
    // el río al fondo del barranco, entre la niebla
    for (let y = vy + 1; y < 100; y++) {
      const w = 0.8 + (y - vy) * 0.3, c = vx + Math.sin(y * 0.16) * (y - vy) * 0.3;
      for (let x = Math.round(c - w); x <= Math.round(c + w); x++) {
        if (izq.tiene(x, y) || der.tiene(x, y)) continue;
        const v = 1.4 + (Math.abs(x - c) > w - 1.2 ? -0.9 : 0) + (ruido(x * 0.6, y * 0.9, 68) > 0.7 ? 2 : 0) + lejos(x, y) * 1.2;
        g.set(x, y, MA[lim(tono(x, y, v, 0.5), 0, 4)], MA);
      }
    }
    for (let y = vy; y < 100; y++) for (let x = 0; x < W; x++) if (!g.get(x, y)) g.set(x, y, ROCA_P[lim(tono(x, y, 2 + lejos(x, y) * 2.6, 0.4), 0, 6)], ROCA_P);
    for (const [x, y, r] of [[124, 74, 2], [136, 80, 2.5], [118, 86, 3]]) { capa().ell(x, y, r + 1, r * 0.7).pintar(g, GRIS, { relieve: 1, max: 3 }); g.set(x - 2, y + 1, HU[3], HU).set(x + 3, y + 1, HU[3], HU); }
    // la cascada de la pared derecha
    for (let s = 0; s <= 100; s++) {
      const [x, y] = CASCADA(s / 100);
      g.set(x - 1, y, GRIS[4], GRIS).set(x, y, HU[3], HU).set(x + 1, y, AZ[4], AZ).set(x + 2, y, HU[2], HU);
    }
    velo(g, 166, 62, 34, 14, (x, y) => (1 - Math.hypot((x - 182) / 16, (y - 70) / 6)) * 1.2, HU[2], HU);
    // la niebla que llena el barranco
    iluminar(g, 0, 50, W, 40, (x, y) => nieblaP(x, y) * 1.7, 1);
    velo(g, 0, 60, W, 24, (x, y) => (nieblaP(x, y) - 0.7) * 2.5, CIELO_FRIO[6], CIELO_FRIO);
    // el pretil de piedra, mellado y con musgo
    const hueco = capa().poly([[38, 82], [64, 82], [61, 90], [55, 93], [44, 92], [40, 88]]);
    const antes = g.copia();
    sillares(g, 0, 82, W, [6, 6, 6], PRETIL, (x, y) => (y < 88 ? 3.6 : 2.7) - Math.max(0, y - 94) * 0.15, { sem: 7, ancho: 16, bisel: 0.7, junta: 1.5, vari: 0.7 });
    cada(hueco, (x, y) => g.set(x, y, antes.get(x, y), antes.rampa(x, y)));
    contraluz(g, hueco, PRETIL[1], 0, 1);
    for (let x = 0; x < W; x++) {
      if (!hueco.tiene(x, 82)) { g.set(x, 82, PRETIL[5], PRETIL); if (hash(x, 61, 2) > 0.55) g.set(x, 82 + (hash(x, 3) > 0.6 ? 1 : 0), MUSGO[3 + (hash(x, 4) > 0.6 ? 1 : 0)], MUSGO); }
      if (hash(x, 95, 3) > 0.8) g.set(x, 99, MUSGO[2], MUSGO);
      g.set(x, 100, GRIS[0], GRIS);
    }
    // arañazos de garras en el pretil
    for (const x0 of [86, 90, 94]) capa().linea(x0, 86, x0 + 5, 97, 1).pintar(g, PRETIL, { plano: 0 });
    // tablero del puente: losas viejas con musgo en las juntas
    losas(g, 101, [4, 5, 6, 7, 9, 13], 26, 128, -70, PRETIL, (x, y) => 2.1 + (y - 101) * 0.004 + (fbm(x / 14, y / 6, 66) - 0.5) * 0.5, 17, (x, y) => (hash(x, y, 5) > 0.65 ? MUSGO[2] : GRIS[0]));
    for (let i = 0; i < 6; i++) {
      const x = 20 + Math.floor(hash(i, 1, 67) * 220), y = 106 + Math.floor(hash(i, 2, 67) * 34);
      capa().linea(x, y, x + 3 + hash(i, 3) * 6, y + 1 + hash(i, 4) * 3, 1).pintar(g, PRETIL, { plano: 0 });
    }
    // el cartel del peaje en su poste, con una calavera clavada y la hucha del trol
    capa().rect(219, 70, 3, 31).pintar(g, M, { relieve: 1, separar: 1 });
    conBorde(g, M[0], tmp => {
      capa().rect(202, 62, 37, 12).pintar(tmp, M, { relieve: 2, max: 3, sesgo: 0.1 });
      for (let i = 0; i < 37; i++) if (hash(i, 62) > 0.7) tmp.set(202 + i, 73, M[1], M);
      escribir(tmp, "PEAJE", 211, 65, M[0]);
      tmp.set(204, 64, HI[3], HI).set(236, 64, HI[3], HI);
    });
    calavera(g, 217, 76);
    conBorde(g, NE[0], tmp => {
      capa().rect(228, 90, 11, 10).pintar(tmp, M, { relieve: 1.5, max: 3 });
      for (let i = 0; i < 11; i++) tmp.set(228 + i, 93, HI[2], HI);
      tmp.set(232, 90, NE[0], NE).set(233, 90, NE[0], NE).set(234, 90, NE[0], NE).set(230, 89, B[4], B).set(236, 89, B[3], B);
    });
    // huesos roídos
    calavera(g, 186, 104, 1);
    capa().linea(193, 109, 207, 106, 2).pintar(g, HU, { relieve: 1, max: 4 });
    for (const [a, b] of [[193, 108], [193, 110], [207, 105], [207, 107]]) capa().ell(a, b, 1.3, 1.3).pintar(g, HU, { relieve: 1, max: 4 });
    capa().linea(30, 128, 40, 131, 2).pintar(g, HU, { relieve: 1, max: 3 });
    for (const [a, b] of [[29, 127], [41, 132]]) capa().ell(a, b, 1.2, 1.2).pintar(g, HU, { relieve: 1, max: 3 });
  }
  function puenteAnim(ctx, t) {
    jirones(ctx, t, 7, 30, 60, 150, 20, [CIELO_FRIO[5], HU[2]], 2.5, 6);
    // agua que cae por la cascada
    for (let i = 0; i < 6; i++) {
      const p = ((t / 1400) + i / 6) % 1, [x, y] = CASCADA(p);
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 2);
    }
    // destellos del río
    for (let i = 0; i < 5; i++) {
      const v = Math.sin(t / 260 + i * 1.9);
      if (v < 0.4) continue;
      const y = FUGA_P[1] + 12 + i * 5, c = FUGA_P[0] + Math.sin(y * 0.12) * (y - FUGA_P[1]) * 0.25;
      ctx.fillStyle = HU[4]; ctx.fillRect(Math.round(c - 3 + Math.sin(t / 700 + i) * 3), y, 2, 1);
    }
    // cuervos que planean sobre el barranco
    for (let i = 0; i < 2; i++) {
      const a = t / (5200 + i * 1700) + i * 3, x = Math.round(FUGA_P[0] + Math.cos(a) * (40 + i * 16)), y = Math.round(36 + i * 10 + Math.sin(a) * 8);
      const ala = Math.sin(t / 180 + i) > 0.5 ? -1 : 0;
      ctx.fillStyle = SO[1];
      ctx.fillRect(x - 2, y + ala, 2, 1); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + 1, y + ala, 2, 1);
    }
  }


  /* ======================================================================
     La encrucijada: el camino se abre en tres y el grupo elige
     ====================================================================== */
  const CIELO_TARDE = ["#34416c", "#465a88", "#5e76a0", "#7f96b8", "#a6b8cc", "#cfd4cc", "#f0e4c4", "#fff4d8"];
  const PRADO_LEJOS = ["#28343c", "#384a4c", "#506258", "#6c7c62", "#8e9878"];
  const HORIZONTE_E = 38;
  /* Los cuatro tramos del camino, como curvas de Bézier: el que llega desde abajo a la izquierda y los tres que se van. */
  const CRUCE = [116, 104];
  const TRAMOS_E = [
    [[-6, 150], [58, 132], CRUCE],
    [CRUCE, [72, 98], [60, 82]], [[60, 82], [50, 62], [34, 44]],
    [CRUCE, [128, 94], [128, 80]], [[128, 80], [129, 60], [133, 41]],
    [CRUCE, [172, 98], [196, 82]], [[196, 82], [212, 62], [224, 46]]
  ];
  const anchoE = y => Math.max(0.6, 0.6 + (y - HORIZONTE_E) * 0.15);
  let mapaCamino = null;
  /* Distancia (en anchos de camino) de cada píxel al camino más cercano: < 1 es camino. */
  function caminosE() {
    if (mapaCamino) return mapaCamino;
    const pts = [];
    for (const [a, c, b] of TRAMOS_E) for (let s = 0; s <= 60; s++) {
      const t = s / 60, u = 1 - t;
      pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
    mapaCamino = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const cerca = pts.filter(([, py]) => Math.abs(py - y) <= 30).map(([px, py]) => [px, py, anchoE(py)]);
      for (let x = 0; x < W; x++) {
        let best = 99;
        for (const [px, py, an] of cerca) {
          const d = Math.hypot(x - px, (y - py) * 1.25) / an;
          if (d < best) best = d;
        }
        mapaCamino[y * W + x] = best;
      }
    }
    return mapaCamino;
  }
  const sombraNube = (x, y) => fbm(x / 34 + 3, y / 14, 91) > 0.6;
  const MOLINO = [236, 34];
  function encrucijada(g) {
    const dc = caminosE();
    // cielo de media tarde, con nubes de algodón
    rellenar(g, 0, 0, W, HORIZONTE_E + 2, CIELO_TARDE, (x, y) => (y / HORIZONTE_E) * 4.2 + Math.max(0, 1 - Math.hypot(x - 20, y) / 120) * 1.2, 0.6);
    for (const [cx, cy, r, sem] of [[54, 10, 16, 1], [150, 6, 20, 2], [226, 14, 14, 3], [104, 22, 10, 4]]) {
      const c = capa();
      for (let k = 0; k < 6; k++) c.ell(cx - r + k * r * 0.4, cy + Math.sin(k * 2.1 + sem) * 2 - (k > 1 && k < 4 ? r * 0.25 : 0), r * (0.35 + hash(k, sem) * 0.2), r * 0.32);
      c.quitarRect(0, cy + r * 0.3, W, 30);
      c.pintar(g, [CIELO_TARDE[3], CIELO_TARDE[4], CIELO_TARDE[5], CIELO_TARDE[6], CIELO_TARDE[7]], { relieve: 3, min: 1 });
    }
    // montañas al fondo, por donde se pierde el camino del centro
    for (let x = 0; x < W; x++) {
      const top = Math.round(36 - Math.max(0, 1 - Math.abs(x - 136) / 70) * 24 - Math.abs(Math.sin(x * 0.11)) * 4 + Math.sin(x * 0.31) * 1.2);
      for (let y = top; y < HORIZONTE_E + 6; y++) {
        const nieve = y < top + 2 + (30 - top) * 0.3 && top < 28;
        const v = 1.6 + (x < 136 - (y - top) * 0.7 + Math.sin(y * 0.8) ? 1 : 0) + (y - top) * 0.03 + (y === top ? 1 : 0);
        g.set(x, y, nieve ? CIELO_TARDE[x < 136 - (y - top) * 0.7 ? 7 : 5] : CIELO_TARDE[lim(tono(x, y, v, 0.4), 0, 3)], CIELO_TARDE);
      }
    }
    // la torre lejana en lo alto de un risco
    conBorde(g, CIELO_TARDE[0], tmp => {
      capa().rect(133, 9, 4, 10).rect(132, 8, 6, 2).poly([[129, 20], [133, 16], [138, 16], [141, 20]]).pintar(tmp, CIELO_TARDE, { relieve: 1, min: 1, max: 3 });
      tmp.set(132, 7, CIELO_TARDE[2], CIELO_TARDE).set(134, 7, CIELO_TARDE[2], CIELO_TARDE).set(136, 7, CIELO_TARDE[2], CIELO_TARDE).set(134, 12, OC[3], OC);
    });
    // el suelo: prado con sombras de nubes, campos de labor a la derecha
    for (let y = HORIZONTE_E; y < H; y++) for (let x = 0; x < W; x++) {
      const t = (y - HORIZONTE_E) / (H - HORIZONTE_E);
      let v = 2.5 + (fbm(x / (8 + t * 20), y / (3 + t * 10), 92) - 0.5) * 1.3 + Math.max(0, 1 - Math.hypot(x - 20, y - 40) / 260) * 0.6;
      if (sombraNube(x, y)) v -= 1.1;
      let ram = PRADO;
      const campo = campoEn(x, y);
      if (campo) { ram = campo[0]; v = campo[1] - (sombraNube(x, y) ? 1 : 0); }
      else if (t > 0.12 && hash(x, y, 93) > 0.94 - t * 0.04) v += hash(x, y, 94) > 0.5 ? 1 : -1;
      g.set(x, y, ram[lim(tono(x, y, v, 0.38), 0, 4)], ram);
    }
    // el camino de tierra, con rodadas y hierba en el lomo
    for (let y = HORIZONTE_E; y < H; y++) for (let x = 0; x < W; x++) {
      const d = dc[y * W + x] + (ruido(x * 0.4, y * 0.5, 95) - 0.5) * 0.25;
      if (d > 1) { if (d < 1.25 && umbral(x, y) < 0.5) desplazar(g, x, y, -1); continue; }
      const rodada = Math.abs(d - 0.5) < 0.09 + (y - HORIZONTE_E) * 0.0008;
      let v = 2.8 + (ruido(x * 0.35, y * 0.5, 96) - 0.5) * 0.9 - (rodada ? 1 : 0) - (d > 0.85 ? 0.7 : 0) + (d < 0.3 ? 0.2 : 0);
      if (sombraNube(x, y)) v -= 1;
      if (d < 0.12 && y > 96 && ruido(x * 0.5, y * 0.3, 97) > 0.68) { g.set(x, y, PRADO[lim(tono(x, y, 2.4, 0.5), 1, 4)], PRADO); continue; }
      g.set(x, y, TIERRA[lim(tono(x, y, v, 0.4), 0, 4)], TIERRA);
    }
    // piedrecitas en el camino
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(i, 1, 98) * W), y = 60 + Math.floor(hash(i, 2, 98) * 84);
      if (dc[y * W + x] > 0.9) continue;
      g.set(x, y, TIERRA[4], TIERRA).set(x + 1, y + 1, TIERRA[1], TIERRA);
    }
    // el bosque oscuro donde se mete el camino de la izquierda
    for (let k = 0; k < 26; k++) {
      const x = Math.floor(hash(k, 1, 99) * 90) - 6, by = HORIZONTE_E + 4 + Math.floor(hash(k, 2, 99) * 14), alto = 12 + (by - HORIZONTE_E) * 1.1 + hash(k, 3, 99) * 6;
      if (Math.abs(x - (34 + (by - 44) * -0.9)) < 3 && by > 44) continue;
      const c = pino(g, x, by, alto, alto * 0.5, MUSGO, { relieve: 2, max: 3, luz: [-0.8, -0.5, 0.5] });
      contraluz(g, c, MUSGO[4], -1, -1);
    }
    capa().ell(34, 46, 3, 2).pintar(g, MUSGO, { plano: 0 });
    // colinas a la derecha con un molino
    molino(g, MOLINO[0], MOLINO[1] + 10);
    // árboles sueltos, matorrales y piedras, más grandes cuanto más cerca
    for (const [x, y, r] of [[92, 62, 5], [166, 58, 4], [180, 66, 5], [20, 76, 8], [246, 86, 10], [100, 76, 4], [82, 50, 3], [206, 104, 6]]) arbolito(g, x, y, r);
    for (const [x, y, r] of [[150, 76, 3], [14, 104, 5], [246, 124, 7], [236, 140, 8], [176, 128, 4], [86, 88, 3]]) matorral(g, x, y, r);
    for (const [x, y, r] of [[106, 116, 3], [232, 102, 3.5], [40, 96, 2.5], [170, 86, 2]]) {
      capa().ell(x, y, r + 1, r * 0.7).pintar(g, P, { relieve: 2, max: 4, separar: 1 });
      for (let i = -r; i <= r; i++) desplazar(g, Math.round(x + i), Math.round(y + r * 0.7 + 1), -2);
    }
    // flores silvestres en el prado
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(hash(i, 1, 100) * W), y = 56 + Math.floor(hash(i, 2, 100) ** 0.7 * 88);
      if (dc[y * W + x] < 1.2 || campoEn(x, y)) continue;
      g.set(x, y, [HU[4], OC[4], VI[3], GR[3], AZ[4]][i % 5], null);
      if (y > 100) g.set(x, y + 1, PRADO[1], PRADO);
    }
    // bruma de la distancia: lo lejano se vuelve azulado
    for (let y = HORIZONTE_E; y < 72; y++) for (let x = 0; x < W; x++) {
      if (umbral(x, y) >= (64 - y) / 26) continue;
      const k = PRADO.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, PRADO_LEJOS[k], PRADO_LEJOS);
    }
    letrero3(g, 158, 106);
    // rayos de sol que caen desde la esquina de arriba a la izquierda
    iluminar(g, 0, 0, W, H, (x, y) => {
      const a = Math.atan2(y + 30, x + 20), r = Math.sin(a * 22) * Math.sin(a * 7 + 1);
      return r > 0.45 && y > HORIZONTE_E ? (r - 0.45) * 1.4 * lim(1 - Math.hypot(x, y) / 300) : 0;
    }, 1);
  }
  /* Campos de labor (trigo, barbecho y huerta) en la ladera de la derecha. */
  function campoEn(x, y) {
    if (y < 44 || y > 76) return null;
    const lado = x - (y - 44) * 0.5;
    if (lado < 150 || x > 256) return null;
    const i = Math.floor((x - 150 + (y - 44) * 1.4) / 24), j = Math.floor((y - 44) / 8);
    const k = hash(i, j, 101), dentro = (x - 150 + (y - 44) * 1.4) % 24 > 1 && (y - 44) % 8 > 0;
    if (!dentro) return [PRADO, 1.4];
    if (k < 0.35) return [OC, 2.4 + ((x + y * 2) % 3 === 0 ? -1 : 0)];
    if (k < 0.6) return [TIERRA, 2 + ((y % 2) ? -0.8 : 0)];
    return [PRADO, 3 + ((x + y) % 4 === 0 ? -1 : 0)];
  }
  /* Molino de viento en lo alto de una colina (las aspas giran en la animación). */
  function molino(g, x, base) {
    for (let xx = 160; xx < W; xx++) {
      const top = Math.round(base - 2 - Math.max(0, 1 - Math.abs(xx - x) / 40) * 6 + Math.sin(xx * 0.1) * 1);
      for (let y = top; y < base + 6; y++) g.set(xx, y, PRADO_LEJOS[lim(tono(xx, y, 3 - (y - top) * 0.1 + (y === top ? 1 : 0), 0.4), 1, 4)], PRADO_LEJOS);
    }
    conBorde(g, PRADO_LEJOS[0], tmp => {
      capa().poly([[x - 4, base - 2], [x - 2, base - 12], [x + 2, base - 12], [x + 4, base - 2]]).pintar(tmp, HU, { relieve: 1.5, max: 3, min: 1 });
      capa().poly([[x - 3, base - 12], [x, base - 16], [x + 3, base - 12]]).pintar(tmp, TE, { relieve: 1, max: 3 });
      tmp.set(x, base - 4, M[1], M).set(x, base - 3, M[1], M);
    });
  }
  /* Árbol redondo con su sombra en el suelo (vista un poco desde arriba). */
  function arbolito(g, x, y, r) {
    for (let j = -2; j <= 2; j++) for (let i = -r - 2; i <= r + 3; i++) if (Math.hypot(i / (r + 2), j / 2.2) < 1) desplazar(g, x + i + 2, y + j + 1, -2);
    capa().rect(x - Math.max(0, r * 0.15), y - r * 0.9, Math.max(1, r * 0.3), r * 0.9).pintar(g, M, { relieve: 1, max: 3 });
    const c = copa(g, [[x, y - r * 1.4, r, r * 0.9], [x - r * 0.5, y - r * 1.1, r * 0.6, r * 0.55], [x + r * 0.55, y - r * 1.2, r * 0.6, r * 0.6]], HO, x * 7 + y, { relieve: Math.max(2, r * 0.6), max: 4 });
    contraluz(g, c, MUSGO[1], 1, 1);
  }
  function matorral(g, x, y, r) {
    for (let i = -r - 1; i <= r + 2; i++) desplazar(g, x + i + 1, y + 1, -2);
    const c = copa(g, [[x, y - r * 0.5, r, r * 0.6], [x - r * 0.4, y - r * 0.3, r * 0.6, r * 0.45]], HO, x * 3 + y, { relieve: Math.max(1.5, r * 0.5), max: 3 });
    contraluz(g, c, MUSGO[1], 1, 1);
    for (let i = 0; i < r; i++) g.set(Math.round(x - r * 0.6 + hash(i, x) * r * 1.2), Math.round(y - r * 0.6 + hash(i, y) * r * 0.5), i % 2 ? GR[3] : HU[4], null);
  }
  /* El poste de la encrucijada con tres brazos en forma de flecha: izquierda, adelante y derecha. */
  function letrero3(g, x, base) {
    for (let i = -6; i <= 7; i++) for (let j = -1; j <= 1; j++) if (Math.hypot(i / 7, j / 1.5) < 1) desplazar(g, x + i + 3, base + j, -2);
    conBorde(g, M[0], tmp => {
      capa().rect(x - 1, base - 37, 4, 37).pintar(tmp, M, { relieve: 1.5, max: 3, luz: [-0.85, -0.3, 0.6] });
      tmp.set(x - 1, base - 38, M[3], M).set(x, base - 38, M[3], M).set(x + 1, base - 38, M[2], M);
      // adelante: el brazo de arriba, sesgado hacia el fondo
      capa().poly([[x + 3, base - 37], [x - 9, base - 43], [x - 14, base - 42], [x - 9, base - 37], [x + 3, base - 32]]).pintar(tmp, M, { relieve: 1.5, max: 4, sesgo: 0.15 });
      // a la izquierda
      capa().poly([[x - 17, base - 26.5], [x - 13, base - 30], [x, base - 30], [x, base - 23], [x - 13, base - 23]]).pintar(tmp, M, { relieve: 1.5, max: 4, sesgo: 0.05 });
      // a la derecha
      capa().poly([[x + 2, base - 19], [x + 16, base - 19], [x + 20, base - 15.5], [x + 16, base - 12], [x + 2, base - 12]]).pintar(tmp, M, { relieve: 1.5, max: 3, sesgo: -0.1 });
      // muescas talladas en cada brazo
      for (let i = 0; i < 4; i++) tmp.set(x - 6 + i * 2, base - 39 + Math.round(i * -0.9), M[0], M);
      for (const [a, b, n] of [[x - 11, base - 27, 4], [x + 5, base - 16, 4]]) for (let i = 0; i < n; i++) tmp.set(a + i * 2, b, M[0], M).set(a + i * 2, b + 1, M[1], M);
      for (const [a, b] of [[x - 1, base - 27], [x + 2, base - 35], [x + 2, base - 16]]) tmp.set(a, b, HI[3], HI);
    });
  }
  function encrucijadaAnim(ctx, t) {
    // las aspas del molino
    const [mx, my] = MOLINO, a0 = t / 1400;
    ctx.fillStyle = HU[3];
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2;
      for (let s = 2; s <= 9; s += 2) ctx.fillRect(Math.round(mx + Math.cos(a) * s), Math.round(my + Math.sin(a) * s), 1, 1);
    }
    ctx.fillStyle = M[1]; ctx.fillRect(mx, my, 1, 1);
    // pájaros que cruzan muy alto
    for (let i = 0; i < 3; i++) {
      const p = ((t / 1000) * 0.02 + i * 0.37) % 1, x = Math.round(W + 10 - p * (W + 30) + i * 6), y = Math.round(16 + i * 5 + Math.sin(p * 8 + i) * 3);
      const ala = Math.sin(t / 150 + i * 2) > 0 ? -1 : 0;
      ctx.fillStyle = CIELO_TARDE[0];
      ctx.fillRect(x - 2, y + ala, 2, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillRect(x + 1, y + ala, 2, 1);
    }
    // mariposas sobre el prado
    for (let i = 0; i < 4; i++) {
      const f = t / 1000 * (0.5 + i * 0.1) + i * 2;
      const x = Math.round([40, 180, 220, 96][i] + Math.sin(f) * 10), y = Math.round([86, 96, 118, 70][i] + Math.sin(f * 2.3) * 4);
      ctx.fillStyle = [HU[4], OC[4], VI[3], AZ[4]][i];
      ctx.fillRect(x, y, 1, 1);
      if (Math.sin(t / 90 + i) > 0) { ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); }
    }
    // hojas y semillas que arrastra el viento
    hojas(ctx, t, 5, -20, 50, 200, 140, [HU[3], PRADO[4], OC[3]], 12, 0.05);
  }

  /* El resto de escenarios se añade más abajo. */
  window.FONDOS_HD = window.FONDOS_HD || {};
  Object.assign(window.FONDOS_HD, {
    taberna: { base: taberna, anim: tabernaAnim },
    aldea: { base: aldea, anim: aldeaAnim },
    camino: { base: camino, anim: caminoAnim },
    bosque: { base: bosque, anim: bosqueAnim },
    puente: { base: puente, anim: puenteAnim },
    encrucijada: { base: encrucijada, anim: encrucijadaAnim }
  });
})();
