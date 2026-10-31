/* Dados y Mazmorras · escenarios en pixel art (192×108).
   FONDOS[clave].base(g) pinta el fondo fijo en una Rejilla de 192×108 y
   FONDOS[clave].anim(ctx, t), si existe, dibuja encima los detalles animados (t en milisegundos). */
const FONDOS = (() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, azar } = PX;
  const W = 192, H = 108;
  const capa = () => new Capa(W, H);
  const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const M = R.madera, F = R.fuego, B = R.bronce, P = R.piedra, HU = R.hueso, HO = R.hoja, MA = R.mar, SO = R.sombra, HI = R.hierro, PL = R.plata;
  const TE = R.tela.terracota, NE = R.tela.negro, AZ = R.tela.azul, GR = R.tela.granate, OC = R.tela.ocre, OL = R.tela.oliva, VI = R.tela.violeta, MG = R.magia;
  /* Rampas propias de los escenarios, en el mismo tono apagado. */
  const GRIS = ["#15161b", "#25272e", "#3b3e47", "#5a5e68", "#868a92"];      // piedra fría de mazmorra
  const MUSGO = ["#0b1510", "#14261a", "#213d27", "#365c34", "#5a8346"];     // bosque profundo
  const CENIZA = ["#0f0c0c", "#1f1918", "#342b28", "#4f433e", "#776860"];    // roca volcánica y ceniza
  const BRASA = ["#170908", "#30100c", "#561a10", "#8a2a12", "#c4461a"];     // roca al rojo
  const ESPECTRO = ["#0b1618", "#122e2d", "#1f5450", "#3b8a7a", "#8cd6ba"];  // luz fantasmal
  const CRISTAL = ["#10182e", "#1c3566", "#2f62a8", "#5ea0dc", "#bfe6ff"];   // cristales de la mina

  /* ---------- Herramientas ---------- */
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

  /* Teselas de Voronoi (roca, piedras): para cada píxel de la caja, la celda más cercana, la vecina y la distancia
     al borde. Las celdas se agrupan en bloques mayores (grupo) para que no todo sean grietas. */
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
  /* Pinta roca facetada: base(x, y) da el tono, haciaLuz(x, y) = [lx, ly, fuerza] apunta a la luz.
     Entre bloques distintos hay grieta; dentro de un bloque, solo un bisel suave. */
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

  /* Sillería: filas de bloques escalonados con bisel (luz desde arriba a la izquierda).
     filas = altos de cada fila; tonoEn(x, y) da el tono de la piedra en cada punto. */
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

  /* ---------- Animación ---------- */
  /* Lengua de fuego con base en (cx, by): capas de la rampa de fuego, de fuera adentro. */
  const CAPAS_FUEGO = [[1, 1, 1], [2, 0.74, 0.8], [3, 0.46, 0.55], [4, 0.2, 0.3]];
  function lengua(ctx, cx, by, ancho, alto, t, fase, ram = F) {
    const hT = alto * (0.72 + 0.28 * Math.sin(t / 97 + fase * 3.1) * Math.sin(t / 61 + fase));
    for (const [k, kw, kh] of CAPAS_FUEGO) {
      ctx.fillStyle = ram[k];
      const hk = hT * kh;
      for (let j = 0; j < hk; j++) {
        const h = j / hT;
        const hw = (ancho / 2) * Math.pow(1 - j / hk, 0.65) * kw * (1 + 0.12 * Math.sin(t / 53 + j + fase));
        const s = Math.sin(t / 140 + fase + j * 0.5) * h * 1.8;
        const x0 = Math.round(cx + s - hw), x1 = Math.round(cx + s + hw);
        if (x1 > x0) ctx.fillRect(x0, by - j, x1 - x0, 1);
        else if (j < hk - 1) ctx.fillRect(x0, by - j, 1, 1);
      }
    }
  }
  /* Chispas que suben desde (cx, by). */
  function chispas(ctx, cx, by, n, alto, t, fase = 0, evitar = null) {
    for (let i = 0; i < n; i++) {
      const p = (t / 1700 + i * 0.618 + fase) % 1;
      if (p > 0.85) continue;
      const x = Math.round(cx + Math.sin(i * 7.3 + p * 5) * 4 + (i - n / 2) * 2);
      const y = Math.round(by - p * alto);
      if (evitar && x >= evitar[0] && x < evitar[2] && y >= evitar[1] && y < evitar[3]) continue;
      ctx.fillStyle = p < 0.4 ? F[4] : p < 0.65 ? F[3] : F[2];
      ctx.fillRect(x, y, 1, 1);
    }
  }


  /* Azar sin estado: un valor fijo en [0, 1) para cada par de enteros. */
  function hash(i, j, s = 0) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  /* Escribe con las letras de 3×5 del motor directamente en una rejilla. */
  function escribir(g, texto, x, y, color, borde = null) {
    const lienzo = { fillStyle: "", fillRect(px, py, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(px + i, py + j, this.fillStyle); } };
    PX.texto(lienzo, texto, x, y, color, borde);
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
  /* Enlosado en perspectiva: filas cada vez más altas hacia delante, juntas que convergen hacia (vx, yh). */
  function losas(g, y0, filas, ancho, vx, yh, ram, tonoEn, sem, junta = M[0]) {
    const az = azar(sem), n = ram.length - 1;
    let ya = y0;
    filas.forEach(alto => {
      const off = az() * ancho, vari = Array.from({ length: 40 }, () => (az() - 0.5) * 0.7);
      for (let y = ya; y < ya + alto && y < H; y++) {
        const esc = (y - yh) / (H - yh);
        for (let x = 0; x < W; x++) {
          const u = vx + (x - vx) / esc + off, k = Math.floor(u / ancho), k1 = Math.floor((vx + (x + 1 - vx) / esc + off) / ancho);
          if (y === ya || k1 !== k) { g.set(x, y, typeof junta === "function" ? junta(x, y) : junta); continue; }
          let v = tonoEn(x, y) + vari[((k % 40) + 40) % 40];
          if (y === ya + 1) v += 0.4;
          g.set(x, y, ram[lim(Math.round(v), 0, n)], ram);
        }
      }
      ya += alto;
    });
  }
  /* Adoquines redondeados en perspectiva (celdas de Voronoi en el plano del suelo). */
  function adoquines(g, y0, vx, yh, tam, ram, tonoEn, junta) {
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
        if (borde < 0.55) { g.set(x, y, junta); continue; }
        let t = tonoEn(x, y) + (hash(k[0], k[1], 3) - 0.5) * 0.8;
        if (borde < 1.8) t += ((u - k[2]) < 0 && (v - k[3]) > 0 ? 0.9 : (u - k[2]) > 0 && (v - k[3]) < 0 ? -0.9 : 0) * (1 - borde / 1.8);
        g.set(x, y, ram[lim(tono(x, y, t, 0.2), 0, n)], ram);
      }
    }
  }

  /* ---------- Objetos de atrezo ---------- */
  /* Tonel de pie: duelas, aros de hierro y tapa. */
  function tonel(g, x, y, w, h, op = {}) {
    conBorde(g, op.borde || M[0], tmp => {
      const c = capa(), cx = x + (w - 1) / 2;
      for (let j = 0; j < h; j++) { const hw = (w / 2) * (0.84 + 0.16 * Math.sin((Math.PI * j) / (h - 1))); c.rect(Math.round(cx - hw + 0.5), y + j, Math.round(hw * 2), 1); }
      c.pintar(tmp, M, { relieve: 3, sesgo: op.sesgo || 0, max: op.max ?? 4 });
      cada(c, (px, py) => { if ((px - x) % 3 === 0 && py > y + 1) tmp.set(px, py, M[1], M); });
      for (const f of [0.18, 0.78]) { const yy = y + Math.round(h * f); cada(c, (px, py) => { if (py === yy || py === yy + 1) tmp.set(px, py, HI[py === yy ? 3 : 1], HI); }); }
      for (let i = 1; i < w - 1; i++) tmp.set(x + i, y, M[i < w / 2 ? 3 : 2], M);
    });
  }
  /* Tonel tumbado visto de frente: tablas, aros y espita. */
  function tonelTumbado(g, cx, cy, r, op = {}) {
    conBorde(g, op.borde || M[0], tmp => {
      const c = capa().ell(cx, cy, r, r);
      c.pintar(tmp, M, { relieve: r * 0.7, sesgo: op.sesgo || 0, max: op.max ?? 4 });
      cada(c, (x, y) => { if ((x - Math.round(cx) + 40) % 3 === 0) tmp.set(x, y, M[1], M); });
      for (let a = 0; a < 6.283; a += 0.05) {
        tmp.set(Math.round(cx + Math.cos(a) * (r - 0.6)), Math.round(cy + Math.sin(a) * (r - 0.6)), HI[Math.sin(a) < -0.2 ? 3 : 1], HI);
        tmp.set(Math.round(cx + Math.cos(a) * (r - 2.4)), Math.round(cy + Math.sin(a) * (r - 2.4)), M[1], M);
      }
      if (op.espita) { tmp.set(Math.round(cx), Math.round(cy + r * 0.45), B[3], B).set(Math.round(cx), Math.round(cy + r * 0.45) + 1, B[1], B); }
    });
  }
  /* Cajón de madera con refuerzo en aspa. */
  function cajon(g, x, y, w, h, sesgo = 0) {
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, w, h).pintar(tmp, M, { relieve: 1.5, sesgo, max: 3 });
      for (let i = 0; i < w; i++) { tmp.set(x + i, y, M[3], M); tmp.set(x + i, y + h - 1, M[1], M); }
      for (let j = 0; j < h; j++) { tmp.set(x, y + j, M[2], M); tmp.set(x + w - 1, y + j, M[1], M); }
      const l = capa().linea(x + 1, y + h - 2, x + w - 2, y + 1, 1);
      cada(l, (px, py) => tmp.set(px, py, M[3], M));
      for (let j = 2; j < h - 2; j += 3) tmp.set(x + 1, y + j, M[1], M);
    });
  }
  /* Calavera pequeña de 5×5. */
  function calavera(g, x, y, ram = HU, mira = 0) {
    plantilla(g, [" aab ", "aaabc", "a#b#c", " bbc ", " b.c "], x, y, { a: ram[3], b: ram[2], c: ram[1], "#": SO[0], ".": SO[1] }, mira < 0);
  }
  /* Vela de cera de pie; la llama se dibuja en la animación (mecha en x, y - alto). */
  function vela(g, x, y, alto, gorda = false) {
    for (let j = 0; j < alto; j++) {
      g.set(x, y - j, HU[j === alto - 1 ? 4 : 3]);
      if (gorda) g.set(x + 1, y - j, HU[2]);
    }
    if (alto > 2) g.set(x + (gorda ? 2 : 1), y - 1, HU[2]).set(x - 1, y, HU[2]);
    g.set(x, y - alto, NE[1]).set(x, y - alto - 1, F[3]);
  }
  /* Llama de vela: más fina que la del candil. */
  function llamaVela(ctx, x, y, t, fase = 0) {
    const a = Math.sin(t / 77 + fase) + Math.sin(t / 131 + fase * 1.7);
    const alto = a > 1 ? 4 : a < -1.1 ? 2 : 3;
    const lado = Math.sin(t / 190 + fase) > 0.55 ? 1 : Math.sin(t / 190 + fase) < -0.55 ? -1 : 0;
    ctx.fillStyle = F[2]; ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = F[3]; ctx.fillRect(x, y - alto + 1, 1, alto - 1); ctx.fillRect(x + lado, y - alto + 1, 1, 1);
    ctx.fillStyle = F[4]; ctx.fillRect(x, y - 1, 1, 1);
  }
  /* Telaraña en una esquina: hilos radiales y arcos colgantes (dx, dy dan hacia dónde se abre). */
  function telarana(g, x, y, r, dx, dy, ram = [GRIS[3], GRIS[4]]) {
    const hilos = 5;
    for (let k = 0; k < hilos; k++) {
      const a = (k / (hilos - 1)) * (Math.PI / 2);
      for (let s = 1; s < r; s++) if (s % 2 || k % 2) g.set(Math.round(x + dx * Math.cos(a) * s), Math.round(y + dy * Math.sin(a) * s), ram[s > r * 0.6 ? 0 : 1]);
    }
    for (const f of [0.35, 0.62, 0.88]) {
      for (let k = 0; k < hilos - 1; k++) {
        const a0 = (k / (hilos - 1)) * (Math.PI / 2), a1 = ((k + 1) / (hilos - 1)) * (Math.PI / 2);
        for (let s = 0; s <= 4; s++) {
          const a = a0 + ((a1 - a0) * s) / 4, comba = Math.sin((s / 4) * Math.PI) * r * f * 0.08;
          g.set(Math.round(x + dx * (Math.cos(a) * r * f - comba * 0.5)), Math.round(y + dy * (Math.sin(a) * r * f - comba)), ram[0]);
        }
      }
    }
  }
  /* Farol de hierro con cristales encendidos (la llama late en la animación). */
  function farol(g, x, y) {
    conBorde(g, NE[0], tmp => {
      tmp.set(x, y - 4, HI[2], HI).set(x - 1, y - 3, HI[2], HI).set(x + 1, y - 3, HI[2], HI);
      capa().rect(x - 2, y - 2, 5, 1).pintar(tmp, HI, { plano: 3 });
      capa().rect(x - 2, y - 1, 5, 6).pintar(tmp, OC, { plano: 4 });
      for (let j = -1; j < 5; j++) { tmp.set(x - 2, y + j, HI[1], HI); tmp.set(x + 2, y + j, HI[1], HI); tmp.set(x, y + j, j > 1 ? F[3] : OC[4], F); }
      tmp.set(x - 1, y + 1, F[4], F).set(x + 1, y + 1, OC[4], OC).set(x, y + 2, F[4], F);
      capa().rect(x - 2, y + 5, 5, 1).pintar(tmp, HI, { plano: 2 });
    });
  }
  function llamaFarol(ctx, x, y, t, fase = 0) {
    const a = Math.sin(t / 90 + fase) + Math.sin(t / 157 + fase * 2.3);
    ctx.fillStyle = a > 0.6 ? F[4] : a < -0.6 ? F[2] : F[3];
    ctx.fillRect(x - 1, y + 1, 3, 2);
    ctx.fillStyle = a > -0.2 ? F[4] : OC[4];
    ctx.fillRect(x, y + (a > 0.9 ? 0 : 1), 1, a > 0.9 ? 3 : 2);
  }
  /* Pino: pisos triangulares con bordes dentados. plano = tono fijo (silueta) o null para modelar. */
  function pino(g, x, by, alto, ancho, ram, op = {}) {
    const c = capa(), pisos = op.pisos || Math.max(3, Math.round(alto / 7));
    for (let p = 0; p < pisos; p++) {
      const t0 = p / pisos, yTop = by - alto + t0 * alto * 0.92, yBot = Math.min(by - alto * 0.12, yTop + alto / pisos * 1.7);
      const w = ancho * (0.25 + 0.75 * ((p + 1) / pisos));
      c.poly([[x, yTop], [x + w / 2, yBot], [x - w / 2, yBot]]);
      for (let k = -2; k <= 2; k++) if (hash(x + p, k, by) > 0.4) c.off(Math.round(x + (k * w) / 5), Math.round(yBot));
    }
    c.rect(x - Math.max(0.5, ancho * 0.06), by - alto * 0.16, Math.max(1, ancho * 0.12), alto * 0.16);
    if (op.plano !== undefined) cada(c, (px, py) => g.set(px, py, typeof op.plano === "function" ? op.plano(px, py) : ram[op.plano]));
    else c.pintar(g, ram, { relieve: op.relieve || 2, luz: op.luz, sesgo: op.sesgo || 0, max: op.max, separar: op.separar });
    return c;
  }
  /* Copa de árbol frondoso: masas redondeadas con hojas sueltas en el borde. */
  function copa(g, masas, ram, sem, op = {}) {
    const c = capa(), az = azar(sem);
    for (const [x, y, rx, ry] of masas) c.ell(x, y, rx, ry);
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) && az() < 0.35) c.on(x, y - 1); if (!c.tiene(x - 1, y) && az() < 0.25) c.on(x - 1, y); });
    c.pintar(g, ram, { relieve: op.relieve || 4, luz: op.luz, sesgo: op.sesgo || 0, max: op.max, min: op.min });
    for (const [x, y, rx, ry] of masas) for (let i = 0; i < rx * ry * 0.25; i++) {
      const px = Math.round(x + (az() - 0.5) * rx * 1.6), py = Math.round(y + (az() - 0.5) * ry * 1.6);
      if (!c.tiene(px, py) || !c.tiene(px + 1, py)) continue;
      const k = ram.indexOf(g.get(px, py));
      if (k >= 0) g.set(px, py, ram[Math.min(ram.length - 1, k + 1)], ram).set(px + 1, py, ram[Math.max(0, k - 1)], ram);
    }
    return c;
  }
  /* Tronco o rama: tramos de línea gruesa con corteza. */
  function tronco(g, pts, grueso, ram, op = {}) {
    const c = capa();
    for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], grueso[i]);
    c.pintar(g, ram, { relieve: op.relieve || 2, luz: op.luz || [-0.85, -0.3, 0.5], max: op.max ?? 3, sesgo: op.sesgo || 0 });
    cada(c, (x, y) => { if ((x * 3 + y * 7) % 11 === 0 && c.tiene(x + 1, y)) g.set(x, y, ram[Math.max(0, (op.max ?? 3) - 3)]); });
    return c;
  }
  /* Estalactitas que cuelgan desde y0 con borde encendido por la luz (brillo(x, y) ∈ [0, 1]). */
  function estalactitas(g, lista, y0, ram, brillo, haciaLuz) {
    for (const [x, ancho, largo] of lista) {
      const c = capa().poly([[x - ancho, y0], [x + ancho, y0], [x + ancho * 0.4, y0 + largo * 0.6], [x + 0.6, y0 + largo], [x - 0.4, y0 + largo], [x - ancho * 0.5, y0 + largo * 0.5]]);
      const tes = teselas(3, x, x - ancho, y0, ancho * 2 + 1, largo + 1, 1);
      roca(g, tes, ram, (px, py) => 0.6 + brillo(px, py) * (ram.length - 3), haciaLuz, { masc: c, vari: 0.4, bisel: 2, relieve: 1.2, s: 0.3 });
      cada(c, (px, py) => {
        if (!c.tiene(px + 1, py)) g.set(px, py, ram[1]);
        else if (!c.tiene(px - 1, py) || !c.tiene(px, py + 1)) g.set(px, py, ram[lim(Math.round(1.5 + brillo(px, py) * (ram.length - 2)), 2, ram.length - 2)]);
      });
    }
  }
  /* Luciérnagas: puntos que flotan y se encienden a ratos dentro de una caja. */
  function luciernagas(ctx, t, n, x0, y0, w, h, cols, sem = 1) {
    for (let i = 0; i < n; i++) {
      const fase = (t / 1000) * (0.35 + hash(i, sem, 1) * 0.4) + hash(i, sem, 2) * 6.28;
      const brillo = Math.sin(fase * 1.7 + i);
      if (brillo < 0) continue;
      const x = Math.round(x0 + hash(i, sem, 3) * w + Math.sin(fase) * 6), y = Math.round(y0 + hash(i, sem, 4) * h + Math.sin(fase * 0.7 + 1) * 4);
      ctx.fillStyle = brillo > 0.6 ? cols[1] : cols[0];
      ctx.fillRect(x, y, 1, 1);
      if (brillo > 0.85 && cols[2]) { ctx.fillStyle = cols[2]; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); }
    }
  }
  /* Jirones de niebla que se deslizan: tiras horizontales finas. */
  function jirones(ctx, t, n, x0, y0, w, h, cols, vel = 4, sem = 2) {
    for (let i = 0; i < n; i++) {
      const largo = 8 + Math.floor(hash(i, sem, 1) * 16), y = Math.round(y0 + hash(i, sem, 2) * h);
      const x = Math.round(x0 + ((hash(i, sem, 3) * (w + 40) + (t / 1000) * vel * (0.6 + hash(i, sem, 4))) % (w + 40)) - 20);
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(x, y, largo, 1);
      ctx.fillRect(x + 3, y - 1, Math.max(2, largo - 8), 1);
    }
  }

  /* ---------- La taberna de El Grifo Tuerto ---------- */
  const VELAS_TABERNA = [[87, 19], [91, 19], [97, 19], [101, 19], [29, 29], [152, 47]];
  function taberna(g) {
    const PM = R.piel.morena;
    const luz = (x, y) => {
      const f = 1 - Math.hypot((x - 12) / 125, (y - 60) / 80);
      const l = 1 - Math.hypot((x - 94) / 48, (y - 24) / 32);
      return lim(Math.max(f, 0) ** 1.25 + Math.max(l, 0) ** 1.6 * 0.55);
    };
    g.rect(0, 0, W, H, M[0]);
    // techo: tablas y viguetas
    rellenar(g, 0, 0, W, 9, M, (x, y) => (y === 3 || y === 6 ? 0.2 : 1) + luz(x, y) * 0.6, 0.3);
    for (let x = 10; x < W; x += 24) capa().poly([[x - 3, 0], [x + 3, 0], [x + 2, 9], [x - 2, 9]]).pintar(g, M, { relieve: 1.5, luz: [-0.4, 0.6, 0.6], max: 2 });
    // pared de revoque
    rellenar(g, 0, 13, W, 39, PM, (x, y) => 0.6 + luz(x, y) * 3 - (y < 17 ? 0.4 : 0), 0.18);
    // friso inferior de tablas
    rellenar(g, 0, 50, W, 22, M, (x, y) => {
      let v = 0.7 + luz(x, y) * 2.4;
      if (y <= 51) v += 0.9;
      else if (y === 52) v -= 0.6;
      else if (x % 7 === 0) v -= 0.9;
      else if (x % 7 === 1) v += 0.3;
      return v - (y > 66 ? 0.5 : 0);
    }, 0.1);
    // postes y viga maestra
    for (const [px, sesgo] of [[38, 0.12], [103, -0.05], [158, -0.2]]) capa().rect(px, 9, 6, 63).pintar(g, M, { relieve: 2, luz: [-0.8, -0.3, 0.6], sesgo, separar: 1 });
    capa().rect(0, 9, W, 5).pintar(g, M, { relieve: 2, luz: [-0.3, 0.7, 0.6], sesgo: -0.1, max: 3 });
    for (let x = 0; x < W; x++) g.set(x, 14, M[0]);
    hogar(g);
    ventana(g);
    letrero(g, 55, 16);
    tablon(g, 50, 31);
    estante(g);
    barra(g);
    // toneles junto a la ventana
    tonel(g, 164, 54, 13, 18, { sesgo: -0.1 });
    tonel(g, 178, 54, 13, 18, { sesgo: -0.18 });
    tonelTumbado(g, 177, 47, 6.5, { espita: true, sesgo: -0.1 });
    for (const x of [143, 148, 153]) for (let y = 15; y < 18; y++) g.set(x, y, HU[1]);
    manojo(g, 143, 18, 10, HO, R.tela.violeta);
    manojo(g, 148, 18, 8, OL, null);
    manojo(g, 153, 18, 11, HO, HU);
    candelabro(g, 94);
    suelo(g, luz);
    for (let x = 164; x < 192; x++) if ((x & 1) === 0) g.set(x, 73, M[0]);
  }

  /* Cornamenta de ciervo sobre una placa de madera. */
  function cornamenta(g, cx, cy) {
    conBorde(g, M[0], tmp => {
      capa().poly([[cx - 4, cy - 1], [cx + 4, cy - 1], [cx + 4, cy + 5], [cx, cy + 8], [cx - 4, cy + 5]]).pintar(tmp, M, { relieve: 2, max: 3 });
      for (const s of [-1, 1]) {
        const c = capa().curva(cx + s * 2, cy - 1, cx + s * 9, cy - 2, cx + s * 11, cy - 10, 2, 1.2);
        c.linea(cx + s * 5, cy - 2, cx + s * 6, cy - 8, 1).linea(cx + s * 8, cy - 4, cx + s * 9, cy - 9, 1).linea(cx + s * 10, cy - 6, cx + s * 13, cy - 8, 1);
        c.pintar(tmp, HU, { relieve: 1, min: 2, max: 4 });
      }
      capa().ell(cx, cy + 1, 2.4, 2).poly([[cx - 2, cy + 2], [cx + 2, cy + 2], [cx + 1, cy + 6], [cx - 1, cy + 6]]).pintar(tmp, HU, { relieve: 1.5, max: 4 });
      tmp.set(cx - 1, cy + 1, NE[1], NE).set(cx + 1, cy + 1, NE[1], NE).set(cx, cy + 5, HU[1], HU);
    });
  }
  /* El letrero de la casa: un grifo tuerto pintado en una tabla colgada de cadenas. */
  const GRIFO = [
    "  aaaa        ",
    " aasaaaa      ",
    "aaaas###a     ",
    "aaaaa###bkk   ",
    "aaaaaa#abkkk  ",
    "aaaaaaaabkkkk ",
    " aaaaaaab  kk ",
    " baaaabb    k ",
    "  bbbbb       ",
    "   bb         "
  ];
  function letrero(g, x, y) {
    for (const cx of [x + 3, x + 20]) g.set(cx, y - 1, HI[2]);
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, 24, 14).pintar(tmp, M, { relieve: 1.5, sesgo: 0.05, max: 3 });
      for (let i = 1; i < 23; i++) { tmp.set(x + i, y + 1, M[1], M); tmp.set(x + i, y + 12, M[1], M); }
      for (let j = 2; j < 12; j++) for (let i = 2; i < 22; i++) tmp.set(x + i, y + j, (i + j) % 7 ? M[2] : M[1], M);
      plantilla(tmp, GRIFO, x + 5, y + 2, { a: OC[3], b: OC[2], k: B[4], s: NE[1], "#": NE[0] });
    });
  }
  /* Tablón de anuncios con carteles de encargos. */
  const CARTEL_BUSCA = ["nnnnnn", "      ", " gggg ", "g g gg", "g    g", " gggg ", "      ", "nnn nn", "n nnn ", "rr rr "];
  const CARTEL_DRAGON = ["r    r   ", "rr  rr   ", " rrrrr  r", "  rrrrrrr", "  r  r   ", "nnnn nn  "];
  const CARTEL_CALAVERA = [" nn ", "n.n.", "nnnn", " nn "];
  const CARTEL_NOTA = ["nnn nnn", "nn nnnn", "nnnn n "];
  function cartel(g, x, y, w, h, dibujo) {
    conBorde(g, M[0], tmp => {
      capa().rect(x, y, w, h).pintar(tmp, HU, { relieve: 1, min: 2, max: 3 });
      plantilla(tmp, dibujo, x + 1, y + 2, { n: M[1], r: GR[2], g: M[1], ".": HU[3] });
      tmp.set(x + Math.floor(w / 2), y, GR[3]);
    });
  }
  function tablon(g, x0, y0) {
    const w = 34, h = 19;
    conBorde(g, M[0], tmp => capa().rect(x0, y0, w, h).pintar(tmp, M, { relieve: 1.5, sesgo: 0.05 }));
    rellenar(g, x0 + 2, y0 + 2, w - 4, h - 4, OC, (x, y) => 1 + ((x * 3 + y * 7) % 13 === 0 ? -0.7 : 0), 0.2);
    cartel(g, x0 + 3, y0 + 2, 8, 13, CARTEL_BUSCA);
    cartel(g, x0 + 13, y0 + 3, 11, 9, CARTEL_DRAGON);
    cartel(g, x0 + 26, y0 + 4, 6, 7, CARTEL_CALAVERA);
    cartel(g, x0 + 14, y0 + 13, 9, 4, CARTEL_NOTA);
  }
  function estante(g) {
    const y = 34;
    capa().rect(109, y, 48, 2).pintar(g, M, { relieve: 1, separar: 1 });
    for (let x = 109; x < 157; x++) g.set(x, y, M[3]);
    for (const bx of [113, 152]) g.set(bx, y + 2, M[1]).set(bx, y + 3, M[1]).set(bx + 1, y + 2, M[1]);
    conBorde(g, M[0], tmp => {
      // jarras de peltre
      for (const x of [112, 120]) {
        capa().rect(x, y - 6, 5, 6).pintar(tmp, PL, { relieve: 2, max: 3 });
        for (let i = 0; i < 5; i++) tmp.set(x + i, y - 4, PL[1], PL);
        tmp.set(x + 5, y - 5, PL[2], PL).set(x + 6, y - 4, PL[2], PL).set(x + 6, y - 3, PL[1], PL).set(x + 5, y - 2, PL[1], PL);
      }
      // botellas
      capa().rect(128, y - 7, 3, 7).rect(129, y - 10, 1, 3).pintar(tmp, HO, { relieve: 1.5, max: 3 });
      tmp.set(129, y - 11, M[2], M);
      capa().rect(132, y - 8, 3, 8).rect(133, y - 11, 1, 3).pintar(tmp, GR, { relieve: 1.5, max: 3 });
      tmp.set(133, y - 12, M[2], M).set(132, y - 4, HU[2], HU).set(133, y - 4, HU[3], HU).set(134, y - 4, HU[2], HU);
      // queso con una cuña cortada
      const q = capa().ell(139.5, y - 3, 3.6, 2.8).quitarRect(0, y, W, 4);
      q.pintar(tmp, OC, { relieve: 1.5, max: 3 });
      for (const [a, b] of [[140, y - 3], [141, y - 3], [141, y - 4], [142, y - 3], [142, y - 4], [142, y - 5]]) tmp.set(a, b, OC[4], OC);
    });
  }
  function barra(g) {
    const y = 55;
    capa().rect(109, y + 2, 49, 15).pintar(g, M, { relieve: 1.5, sesgo: -0.15, separar: 1 });
    for (let x = 110; x < 158; x++) for (let j = y + 3; j < 72; j++) if ((x - 109) % 6 === 0) g.set(x, j, M[0]);
    for (let x = 109; x < 158; x++) g.set(x, y + 9, M[1]).set(x, y + 10, M[3]);
    capa().rect(107, y, 52, 2).pintar(g, M, { relieve: 1, separar: 1 });
    for (let x = 107; x < 159; x++) g.set(x, y, M[3]);
    conBorde(g, M[0], tmp => {
      for (const x of [116, 125]) {
        capa().rect(x, y - 5, 5, 5).pintar(tmp, M, { relieve: 1.5, sesgo: 0.1 });
        for (let i = 0; i < 5; i++) { tmp.set(x + i, y - 6, HU[i < 3 ? 4 : 3], HU); tmp.set(x + i, y - 3, HI[2], HI); }
        tmp.set(x + 1, y - 7, HU[4], HU).set(x + 2, y - 7, HU[3], HU).set(x + 5, y - 4, M[2], M).set(x + 6, y - 3, M[2], M).set(x + 5, y - 2, M[1], M);
      }
      capa().rect(133, y - 1, 9, 1).pintar(tmp, PL, { plano: 2 });
      capa().ell(137, y - 3, 3, 1.8).pintar(tmp, OC, { relieve: 1.5, max: 3 });
      tmp.set(136, y - 4, OC[1], OC).set(138, y - 4, OC[1], OC);
      capa().rect(149, y - 1, 6, 1).pintar(tmp, B, { plano: 3 });
      tmp.set(155, y - 2, B[2], B).set(156, y - 2, B[2], B);
    });
    vela(g, 152, y - 2, 5, true);
  }
  /* Corona de hierro con cuatro velas, colgada de la viga. */
  function candelabro(g, x) {
    for (const dx of [-7, 0, 7]) { const c = capa().linea(x, 14, x + dx, 23, 1); cada(c, (px, py) => g.set(px, py, py % 2 ? HI[1] : HI[2])); }
    for (let i = -8; i <= 8; i++) { g.set(x + i, 24, HI[Math.abs(i) > 6 ? 1 : 2]); if (Math.abs(i) < 7) g.set(x + i, 25, HI[1]); }
    g.set(x - 9, 23, HI[1]).set(x + 9, 23, HI[1]);
    for (const dx of [-7, -3, 3, 7]) vela(g, x + dx, 23, 3);
  }
  function tabernaAnim(ctx, t) {
    lengua(ctx, 9, 66, 9, 11, t, 0.3);
    lengua(ctx, 17, 66, 8, 10, t, 2.1);
    lengua(ctx, 13, 66, 10, 13, t, 4.4);
    chispas(ctx, 13, 60, 5, 20, t, 0, [5, 42, 22, 58]);
    VELAS_TABERNA.forEach(([x, y], i) => llamaVela(ctx, x, y, t, i * 1.9));
  }

  function hogar(g) {
    const PM = R.piel.morena;
    // campana de la chimenea, ennegrecida por el humo
    const camp = capa().poly([[0, 14], [25, 14], [33, 38], [0, 38]]);
    rellenar(g, 0, 14, 36, 26, PM, (x, y) => {
      const k = (38 - y) / 24, ancho = 5 + k * 9;
      const hollin = lim(1 - Math.abs(x - 13) / ancho) * (0.5 + k * 0.7);
      return 2.5 - k * 0.6 - hollin * 2.4;
    }, 0.15, camp);
    for (let y = 14; y < 38; y++) { const xb = Math.floor(25 + (y - 14) / 3); g.set(xb, y, PM[3]); g.set(xb + 1, y, M[0]); }
    // repisa
    capa().rect(0, 37, 38, 4).pintar(g, M, { relieve: 1.5, luz: [-0.5, 0.6, 0.6], separar: 1 });
    cornamenta(g, 14, 25);
    conBorde(g, M[0], tmp => {
      capa().rect(5, 31, 5, 6).pintar(tmp, PL, { relieve: 2, max: 3 });
      for (let x = 5; x < 11; x++) tmp.set(x, 30, PL[x < 8 ? 3 : 2], PL);
      tmp.set(10, 32, PL[2], PL).set(11, 33, PL[2], PL).set(11, 34, PL[1], PL).set(10, 35, PL[1], PL).set(6, 29, PL[3], PL);
      for (let x = 5; x < 10; x++) tmp.set(x, 33, PL[1], PL);
      capa().rect(26, 36, 7, 1).pintar(tmp, B, { plano: 3 });
      tmp.set(33, 35, B[2], B);
    });
    vela(g, 29, 35, 5, true);
    // boca del hogar
    rellenar(g, 0, 42, 27, 26, M, (x, y) => -0.4 + Math.max(0, 1 - Math.hypot((x - 13) / 16, (y - 68) / 18)) * 3.2, 1);
    for (let y = 42; y < 68; y++) for (let x = 0; x < 27; x++) if (g.get(x, y) === M[3] || g.get(x, y) === M[4]) g.set(x, y, TE[3], TE);
    // jamba de piedra y dintel
    for (const [x, y, w, h] of [[26, 41, 9, 9], [26, 50, 9, 9], [26, 59, 9, 9], [0, 40, 27, 3]]) {
      capa().rect(x, y, w, h).pintar(g, P, { relieve: 2, luz: [-0.85, 0.2, 0.55], sesgo: 0.15, separar: 1 });
    }
    for (let y = 44; y < 68; y++) { g.set(26, y, TE[2], TE); if (y > 52) g.set(27, y, F[1], F); }
    // losa
    rellenar(g, 0, 67, 40, 5, P, (x, y) => (y === 67 ? 3.3 : 2) + Math.max(0, 1 - Math.abs(x - 13) / 18) * 1.2 - (x > 33 ? 0.8 : 0), 0.4);
    for (let x = 0; x < 40; x++) g.set(x, 71, P[0]);
    for (let x = 0; x < 27; x++) if ((x * 7) % 5 < 2) g.set(x, 67, F[2], F);
    // leños con brasas
    capa().linea(3, 66, 21, 62, 3).linea(6, 62, 24, 66, 3).pintar(g, M, { relieve: 1.5, luz: [0, 0.8, 0.6], max: 2 });
    for (const [x, y] of [[8, 64], [12, 63], [16, 64], [19, 62], [10, 66], [17, 66], [21, 64], [6, 65]]) g.set(x, y, F[2], F);
    for (const [x, y] of [[12, 64], [15, 63], [18, 65]]) g.set(x, y, F[3], F);
    // caldero colgado
    for (let y = 43; y < 49; y++) g.set(13, y, y % 2 ? R.hierro[1] : R.hierro[2]);
    conBorde(g, SO[0], tmp => {
      capa().ell(13, 52, 6.5, 4.5).quitarRect(0, 0, W, 50).rect(6, 49, 15, 2).pintar(tmp, B, { relieve: 2.5, luz: [-0.2, 0.8, 0.5], max: 3 });
      for (let x = 6; x < 21; x++) tmp.set(x, 49, B[1], B);
    });
  }

  function ventana(g) {
    const x0 = 167, y0 = 17, w = 21, h = 19;
    capa().rect(x0 - 2, y0 - 2, w + 4, h + 4).pintar(g, M, { relieve: 1.5, sesgo: -0.25, separar: 1 });
    rellenar(g, x0, y0, w, h, MA, (x, y) => 0.3 + (y - y0) / h * 1.6, 1);
    for (let x = x0; x < x0 + w; x++) g.set(x, y0 + h - 4, MA[2]);
    for (let x = x0; x < x0 + w; x++) if (x % 3 === 0) g.set(x, y0 + h - 3, MA[3]);
    rellenar(g, x0, y0 + h - 3, w, 3, MA, (x, y) => 1.2 + ((x + y) % 4 === 0 ? 1 : 0), 0);
    // luna menguante y estrellas
    capa().ell(181, 22, 2.6).pintar(g, HU, { plano: 4 });
    capa().ell(182.4, 21.2, 2.4).pintar(g, MA, { plano: 0 });
    g.set(172, 20, HU[3]).set(176, 26, HU[2]).set(170, 28, HU[2]);
    // pinos lejanos contra el cielo de noche
    for (const [px, alto] of [[169, 6], [173, 9], [178, 7], [183, 10], [187, 6]]) pino(g, px, y0 + h - 3, alto, alto * 0.75, SO, { plano: 1 });
    // contraventanas
    for (const sx of [x0 - 6, x0 + w + 2]) {
      const c = capa().rect(sx, y0 - 1, 4, h + 2);
      c.pintar(g, M, { relieve: 1, sesgo: -0.3, separar: 1 });
      for (let y = y0 + 2; y < y0 + h; y += 5) g.set(sx + 1, y, M[0]).set(sx + 2, y, M[0]);
    }
    for (let x = x0 - 2; x < x0 + w + 2; x++) g.set(x, y0 + h + 2, M[3]);
  }

  /* Manojo de hierbas colgado boca abajo desde (x, y). */
  function manojo(g, x, y, largo, ram, flor) {
    const az = azar(x * 31 + y);
    const tmp = new Rejilla(W, H);
    for (let i = 0; i < 6; i++) {
      const a = -0.42 + i * 0.17 + (az() - 0.5) * 0.12, l = largo * (0.72 + az() * 0.3);
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
    tmp.contorno(M[1]);
    g.pegar(tmp);
    for (let k = -1; k <= 1; k++) g.set(x + k, y + 1, HU[2]).set(x + k, y + 2, HU[1]);
  }

  function suelo(g, luz) {
    const filas = [72, 75, 78, 82, 86, 91, 96, 102, 108];
    const az = azar(11);
    for (let f = 0; f < filas.length - 1; f++) {
      const y0 = filas[f], y1 = filas[f + 1];
      const juntas = [];
      for (let x = -Math.floor(az() * 30); x < W; x += 26 + Math.floor(az() * 26)) juntas.push(x);
      const vari = juntas.map(() => (az() - 0.5) * 0.5);
      const vetas = Array.from({ length: 5 }, () => [Math.floor(az() * W), y0 + 2 + Math.floor(az() * Math.max(1, y1 - y0 - 3)), 4 + Math.floor(az() * 8)]);
      rellenar(g, 0, y0, W, y1 - y0, M, (x, y) => {
        let j = 0;
        while (j + 1 < juntas.length && juntas[j + 1] <= x) j++;
        if (juntas.includes(x)) return 0;
        let v = 0.9 + luz(x, y) * 2.5 + vari[j];
        if (y === y0) v = Math.min(v, 0.4);
        else if (y === y0 + 1) v += 0.35;
        if (y > y0 + 1 && vetas.some(([vx, vy, vl]) => y === vy && x >= vx && x < vx + vl)) v -= 0.8;
        v -= Math.max(0, 74 - y) * 0.45;
        return v - Math.max(0, y - 98) * 0.04;
      }, 0.14);
    }
    // sombras al pie de la pared, de la mesa y de las ánforas
    for (let x = 0; x < W; x++) g.set(x, 72, M[0]);
    for (let x = 112; x < 151; x++) if ((x & 1) === 0) g.set(x, 73, M[0]);
    for (let x = 166; x < W; x++) if ((x & 1) === 0) g.set(x, 73, M[0]);
  }

  /* ---------- El sótano de la taberna ---------- */
  const PIEDRA_SOTANO = [GRIS[0], GRIS[1], GRIS[2], P[3], HU[1], HU[2]];
  const FAROL_SOTANO = [117, 41];
  const luzSotano = (x, y) => lim(Math.max(0, 1 - Math.hypot((x - FAROL_SOTANO[0]) / 74, (y - FAROL_SOTANO[1]) / 56)) ** 1.3 + Math.max(0, 1 - Math.hypot((x - 10) / 44, (y - 2) / 66)) ** 1.5 * 0.7);
  function sotano(g) {
    g.rect(0, 0, W, H, GRIS[0]);
    sillares(g, 0, 0, W, [5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 6], PIEDRA_SOTANO, (x, y) => 0.8 + luzSotano(x, y) * 3.4, { sem: 21, ancho: 14, bisel: 0.7, junta: 1.3, vari: 0.6 });
    for (const [x0, x1] of [[46, 108], [126, 188]]) boveda(g, x0, x1);
    // pilar con el farol colgado de una escarpia
    for (let x = 108; x < 112; x++) g.set(x, 32, HI[2]);
    for (let y = 32; y < 37; y++) g.set(117, y, HI[1]);
    for (let x = 111; x < 118; x++) g.set(x, 31, HI[1]);
    farol(g, 117, 41);
    escaleraSotano(g);
    // cajones y un saco a la derecha
    cajon(g, 182, 54, 12, 18, -0.3);
    cajon(g, 186, 42, 8, 12, -0.35);
    capa().ell(177, 68, 5, 4.5).ell(177, 63, 3, 2.5).pintar(g, HU, { relieve: 3, max: 2, sesgo: -0.3, separar: 1 });
    // telarañas
    telarana(g, 191, 0, 16, -1, 1);
    telarana(g, 46, 28, 9, 1, -1);
    telarana(g, 126, 30, 7, 1, -1);
    // ratonera al pie del pilar
    capa().ell(116, 72, 3.5, 4).pintar(g, SO, { plano: 0 });
    for (let x = 112; x < 121; x++) if (!g.get(x, 67) || g.get(x, 67) !== SO[0]) g.set(x, 67, PIEDRA_SOTANO[1]);
    // suelo de losas húmedas, con un charco que refleja el farol
    losas(g, 72, [3, 4, 4, 5, 6, 7, 7], 18, 96, -60, PIEDRA_SOTANO, (x, y) => 1.1 + luzSotano(x, y) * 2.3, 33, GRIS[0]);
    const charco = capa().ell(128, 86, 13, 2.2);
    cada(charco, (x, y) => g.set(x, y, (x + y) % 3 ? GRIS[1] : GRIS[2]));
    for (const [x, y] of [[118, 86], [121, 86], [124, 85], [119, 87]]) g.set(x, y, OC[3]);
    for (let x = 0; x < W; x++) g.set(x, 72, GRIS[0]);
  }
  /* Bóveda de cañón abierta en el muro, con barricas apiladas sobre un poyo. */
  function boveda(g, x0, x1) {
    const cx = (x0 + x1) / 2, r = (x1 - x0) / 2, ys = 42;
    const hueco = capa().rect(x0, ys, x1 - x0, 72 - ys).ell(cx, ys, r - 0.5, r * 0.88);
    cada(hueco, (x, y) => g.set(x, y, PIEDRA_SOTANO[lim(tono(x, y, 0.3 + luzSotano(x, y) * 1.7 + (y - 16) * 0.01, 0.3), 0, 5)], PIEDRA_SOTANO));
    // dovelas
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI + (k / 12) * Math.PI;
      for (let d = 0; d < 4; d++) {
        const x = Math.round(cx + Math.cos(a) * (r + d)), y = Math.round(ys + Math.sin(a) * (r * 0.88 + d));
        g.set(x, y, PIEDRA_SOTANO[1]);
      }
    }
    for (let a = Math.PI; a <= 2 * Math.PI; a += 0.01) {
      g.set(Math.round(cx + Math.cos(a) * (r + 4)), Math.round(ys + Math.sin(a) * (r * 0.88 + 4)), PIEDRA_SOTANO[1]);
      g.set(Math.round(cx + Math.cos(a) * r), Math.round(ys + Math.sin(a) * r * 0.88), PIEDRA_SOTANO[lim(Math.round(2 + luzSotano(cx, ys) * 3), 2, 5)]);
    }
    // poyo de madera y barricas
    capa().rect(x0 + 1, 68, x1 - x0 - 2, 4).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
    const luzB = x => -0.45 + luzSotano(x, 55) * 0.7;
    for (let k = 0; k < 3; k++) tonelTumbado(g, x0 + 11 + k * 20, 59, 9.2, { sesgo: luzB(x0 + 11 + k * 20), max: 3 });
    for (let k = 0; k < 2; k++) tonelTumbado(g, x0 + 21 + k * 20, 42, 9.2, { sesgo: luzB(x0 + 21 + k * 20) - 0.1, max: 3, espita: k === 1 });
  }
  /* Escalera de madera que baja desde la trampilla de la taberna. */
  function escaleraSotano(g) {
    // trampilla abierta: luz cálida que cae por la escalera
    for (let y = 0; y < 4; y++) for (let x = 0; x < 26; x++) g.set(x, y, x > 22 ? M[1] : tono(x, y, 2.6 - y * 0.4 - x * 0.03, 0.5) > 2 ? OC[4] : OC[3]);
    for (let x = 0; x < 27; x++) g.set(x, 4, M[1]).set(x, 5, M[0]);
    for (let y = 6; y < 70; y++) for (let x = 0; x < 60; x++) {
      const d = x - (y - 6) * 0.62, k = PIEDRA_SOTANO.indexOf(g.get(x, y));
      if (k < 0 || d < -2 || d > 24) continue;
      const f = (1 - Math.abs(d - 11) / 13) * (1 - (y - 6) / 70);
      if (f > 0.05) g.set(x, y, PIEDRA_SOTANO[Math.min(5, k + tono(x, y, f * 1.6, 1))], PIEDRA_SOTANO);
    }
    capa().linea(0, 16, 46, 74, 3).pintar(g, M, { relieve: 1.2, max: 2, separar: 1 });
    for (let i = 0; i < 8; i++) {
      const x = 1 + i * 5.6, y = 10 + i * 7.4;
      capa().rect(x, y, 9, 2).pintar(g, M, { relieve: 1, sesgo: 0.2 - i * 0.07, separar: 1 });
      for (let k = 0; k < 9; k++) g.set(Math.round(x) + k, Math.round(y), M[lim(Math.round(4 - i * 0.3), 2, 4)]);
    }
    capa().linea(4, 2, 52, 62, 1).pintar(g, M, { plano: 2 });
    for (const [x, y] of [[16, 16], [32, 36], [48, 56]]) capa().rect(x, y, 1, 12).pintar(g, M, { plano: 1 });
  }
  function sotanoAnim(ctx, t) {
    llamaFarol(ctx, FAROL_SOTANO[0], FAROL_SOTANO[1], t);
    // ojos de la rata que se asoma de vez en cuando
    const ciclo = (t / 1000) % 9;
    if (ciclo > 5.5 && ciclo < 7.6 && Math.floor(t / 180) % 9) { ctx.fillStyle = F[3]; ctx.fillRect(115, 70, 1, 1); ctx.fillRect(117, 70, 1, 1); }
  }

  /* ---------- La plaza de Villabruma ---------- */
  const LOMAS = [MUSGO[3], OL[3], R.piel.verde[3], R.piel.verde[4]];
  const CHIMENEA_ALDEA = [118, 23];
  function aldea(g) {
    g.rect(0, 0, W, H, P[2]);
    rellenar(g, 0, 0, W, 50, [AZ[3], MA[4], AZ[4], HU[3]], (x, y) => Math.pow(y / 44, 1.2) * 3, 0.55);
    for (const [cx, cy, rx, ry] of [[40, 9, 12, 3], [150, 6, 15, 3.5], [104, 15, 8, 2.4]]) {
      capa().ell(cx, cy, rx, ry).ell(cx - rx * 0.4, cy - ry * 0.7, rx * 0.5, ry).ell(cx + rx * 0.35, cy - ry * 0.4, rx * 0.4, ry * 0.8).pintar(g, [AZ[4], HU[3], HU[4]], { relieve: 3, min: 0 });
    }
    // lomas lejanas con un castillo
    for (let x = 0; x < W; x++) {
      const top = Math.round(38 + Math.sin(x * 0.04 + 1) * 4 + Math.sin(x * 0.11) * 1.5);
      for (let y = top; y < 64; y++) g.set(x, y, LOMAS[lim(tono(x, y, 2.6 - (y - top) * 0.06 + (y === top ? 0.6 : 0), 0.4), 0, 3)], LOMAS);
    }
    castillo(g, 30, 34);
    // adoquines de la plaza
    adoquines(g, 58, 96, -70, 6.5, P, (x, y) => 2.05 - (y - 60) * 0.004, P[1]);
    // casas de entramado
    casa(g, { x0: 54, x1: 92, base: 66, muro: 18, tejado: "paja", sem: 2, claro: 2.2 });
    casa(g, { x0: 96, x1: 134, base: 64, muro: 18, tejado: "pizarra", hastial: true, sem: 3, chimenea: CHIMENEA_ALDEA, claro: 2.3 });
    casa(g, { x0: -3, x1: 50, base: 72, muro: 32, tejado: "teja", hastial: true, sem: 1, cartel: true });
    casa(g, { x0: 148, x1: 195, base: 72, muro: 30, tejado: "pizarra", hastial: true, sem: 4 });
    pozo(g, 130, 74);
    puestoMercado(g, 150, 191);
  }
  /* Castillo lejano en lo alto de una loma, azulado por la distancia. */
  function castillo(g, x, y) {
    const C = [GRIS[2], GRIS[3], AZ[3], GRIS[4]];
    const c = capa().rect(x, y, 20, 8).rect(x - 3, y - 6, 6, 14).rect(x + 17, y - 6, 6, 14).rect(x + 7, y - 10, 7, 18);
    for (const [tx, ty, w] of [[x - 3, y - 6, 6], [x + 17, y - 6, 6], [x + 7, y - 10, 7], [x, y, 20]]) for (let i = 0; i < w; i += 2) c.on(tx + i, ty - 1);
    cada(c, (px, py) => g.set(px, py, C[c.tiene(px - 1, py) ? (px > x + 12 ? 1 : 2) : 3]));
    for (const [wx, wy] of [[x + 9, y - 6], [x - 1, y - 2], [x + 19, y - 2], [x + 10, y + 2]]) g.set(wx, wy, GRIS[1]).set(wx, wy + 1, GRIS[1]);
    for (let j = 1; j < 6; j++) g.set(x + 10, y - 10 - j, GRIS[1]);
  }
  /* Casa de entramado: muro encalado con vigas oscuras, ventanas con postigos, puerta y tejado. */
  function casa(g, op) {
    const { x0, x1, base, muro, tejado, hastial } = op, yTop = base - muro, cx = (x0 + x1) / 2, an = x1 - x0;
    const az = azar(op.sem || 1);
    const TEJ = tejado === "teja" ? TE : tejado === "paja" ? OC : GRIS;
    // tejado
    const t = capa();
    if (hastial) t.poly([[x0 - 3, yTop + 1], [cx, yTop - an * 0.55], [x1 + 3, yTop + 1]]);
    else t.poly([[x0 - 3, yTop + 1], [x0 + 5, yTop - 12], [x1 - 5, yTop - 12], [x1 + 3, yTop + 1]]);
    cada(t, (x, y) => {
      let v = 2.3 + (x < cx ? 0.5 : -0.3);
      if (tejado === "paja") v += ((x * 7 + y * 3) % 5 === 0 ? -0.9 : 0) + ((y - yTop) % 4 === 0 ? -0.5 : 0);
      else if ((y - yTop + 40) % 3 === 0) v -= 1.1;
      else if ((x + Math.floor((y - yTop + 40) / 3) * 2) % 5 === 0) v -= 0.6;
      g.set(x, y, TEJ[lim(tono(x, y, v, 0.2), 0, 4)], TEJ);
    });
    if (hastial) {
      // muro del hastial: triángulo encalado con su entramado
      const m = capa().poly([[x0 + 1, yTop + 1], [cx, yTop - an * 0.55 + 4], [x1 - 1, yTop + 1]]);
      cada(m, (x, y) => g.set(x, y, HU[x < cx ? 3 : 2]));
      capa().linea(cx, yTop - an * 0.55 + 6, cx, yTop, 2).linea(x0 + 4, yTop, cx, yTop - an * 0.25, 1).linea(x1 - 4, yTop, cx, yTop - an * 0.25, 1).recortar(m).pintar(g, M, { plano: 1 });
      for (const [a, b] of [[x0 - 3, yTop + 1], [x1 + 3, yTop + 1]]) capa().linea(a, b, cx, yTop - an * 0.55, 1).pintar(g, M, { plano: 1 });
      g.set(Math.round(cx), Math.round(yTop - an * 0.55) - 1, M[1]);
    }
    // muro con entramado (más apagado en las casas del fondo) y, en las altas, planta baja de piedra
    const claro = op.claro ?? 2.9;
    rellenar(g, x0, yTop, an, muro, HU, (x, y) => claro - ((x - x0) / an) * 0.7 - (y < yTop + 2 ? 0.8 : 0), 0.2);
    if (muro > 24) sillares(g, x0, yTop + Math.round(muro * 0.48) + 2, x1, [4, 4, 4, 4], P, (x, y) => 2.4 - ((x - x0) / an) * 0.8, { sem: op.sem + 30, ancho: 7, bisel: 0.6, junta: 1.2 });
    const postes = [];
    for (let x = x0; x < x1; x += 9) postes.push(x);
    postes.push(x1 - 2);
    const pisos = muro > 24 ? [yTop, yTop + Math.round(muro * 0.48), base - 1] : [yTop, base - 1];
    for (const y of pisos) for (let x = x0; x < x1; x++) g.set(x, y, M[1]).set(x, y + 1, y < base - 1 ? M[0] : M[1]);
    const finPostes = muro > 24 ? pisos[1] + 2 : base;
    for (const x of postes) for (let y = yTop; y < finPostes; y++) g.set(x, y, M[1]).set(x + 1, y, M[0]);
    const pisosEntramado = muro > 24 ? 1 : pisos.length - 1;
    for (let p = 0; p < pisosEntramado; p++) for (let k = 0; k + 1 < postes.length; k++) {
      if (az() < 0.45) continue;
      const a = postes[k] + 2, b = postes[k + 1] - 1, ya = pisos[p] + 2, yb = pisos[p + 1] - 1;
      capa().linea(a, yb, b, ya, 1).pintar(g, M, { plano: 1 });
      if (az() < 0.5) capa().linea(a, ya, b, yb, 1).pintar(g, M, { plano: 1 });
    }
    // ventanas con postigos y una puerta
    for (let p = 0; p + 1 < pisos.length; p++) for (let k = 0; k + 1 < postes.length; k++) {
      if (p === pisos.length - 2 && k === Math.floor((postes.length - 1) / 2)) continue;
      if (az() < 0.45) continue;
      const wx = postes[k] + 3, wy = pisos[p] + 4;
      if (postes[k + 1] - postes[k] < 7 || pisos[p + 1] - pisos[p] < 10) continue;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) g.set(wx + i, wy + j, (i === 0 && j === 0) ? AZ[3] : AZ[1]);
      for (let i = -1; i < 5; i++) g.set(wx + i, wy + 4, M[2]);
      for (let j = 0; j < 4; j++) { g.set(wx - 1, wy + j, OL[2]); g.set(wx + 4, wy + j, OL[1]); }
      if (az() < 0.5) for (let i = 0; i < 4; i++) g.set(wx + i, wy + 5, i % 2 ? GR[3] : HO[2]);
    }
    const k = Math.floor((postes.length - 1) / 2), dx = postes[k] + 2, dy = base - 9;
    capa().rect(dx, dy, 5, 9).off(dx, dy).off(dx + 4, dy).pintar(g, M, { relieve: 1.5, max: 2 });
    g.set(dx + 3, dy + 5, B[3]).set(dx + 1, dy + 2, HI[2]).set(dx + 1, dy + 6, HI[2]);
    if (op.cartel) {
      for (let y = dy - 5; y < dy - 1; y++) g.set(dx + 7, y, HI[1]);
      for (let x = dx + 5; x < dx + 12; x++) g.set(x, dy - 6, HI[1]);
      conBorde(g, M[0], tmp => { capa().rect(dx + 7, dy - 4, 8, 5).pintar(tmp, M, { relieve: 1, max: 3 }); tmp.set(dx + 9, dy - 2, OC[3]).set(dx + 10, dy - 2, OC[3]).set(dx + 11, dy - 3, B[4]); });
    }
    if (op.chimenea) {
      const [chx, chy] = op.chimenea;
      capa().rect(chx - 2, chy, 5, Math.max(4, Math.round(yTop - an * 0.55 + (Math.abs(chx - cx) / (an / 2)) * an * 0.55) - chy + 2)).pintar(g, P, { relieve: 1.5, separar: 1 });
      for (let x = chx - 3; x < chx + 4; x++) g.set(x, chy, P[1]);
    }
  }
  function pozo(g, cx, base) {
    const ar = capa().rect(cx - 10, base - 12, 21, 12).ell(cx, base, 10.5, 2).ell(cx, base - 12, 10.5, 2.4);
    cada(ar, (x, y) => {
      const fila = Math.floor((base - y) / 3), junta = (base - y) % 3 === 0 || (x + fila * 3) % 6 === 0;
      const v = 3.2 - (x - cx + 10) / 21 * 1.3 + (junta ? -1.1 : 0);
      g.set(x, y, P[lim(tono(x, y, v, 0.2), 0, 4)], P);
    });
    capa().ell(cx, base - 12, 8.5, 1.4).pintar(g, SO, { plano: 0 });
    for (let x = cx - 10; x <= cx + 10; x++) g.set(x, base - 15 + (Math.abs(x - cx) > 8 ? 1 : 0), P[4]);
    capa().rect(cx - 11, base - 30, 2, 18).rect(cx + 10, base - 30, 2, 18).pintar(g, M, { relieve: 1, separar: 1 });
    const techo = capa().poly([[cx - 15, base - 27], [cx, base - 35], [cx + 16, base - 27], [cx + 16, base - 25], [cx - 15, base - 25]]);
    cada(techo, (x, y) => g.set(x, y, (y - base + 40) % 2 ? TE[x < cx ? 3 : 2] : TE[1]));
    for (let x = cx - 9; x <= cx + 10; x++) g.set(x, base - 23, M[1]);
    for (let y = base - 22; y < base - 17; y++) g.set(cx, y, HU[1]);
    capa().rect(cx - 2, base - 17, 5, 4).pintar(g, M, { relieve: 1, separar: 1 });
    g.set(cx - 2, base - 16, HI[2]).set(cx + 2, base - 16, HI[2]).set(cx + 11, base - 22, M[2]).set(cx + 12, base - 21, M[2]);
  }
  function puestoMercado(g, x0, x1) {
    for (const x of [x0 + 1, x1 - 3]) capa().rect(x, 48, 2, 24).pintar(g, M, { relieve: 1, separar: 1 });
    for (let y = 40; y < 48; y++) {
      const k = (y - 40) / 8, a = x0 + (1 - k) * 3, b = x1 - (1 - k) * 3;
      for (let x = Math.round(a); x < Math.round(b); x++) {
        const ram = Math.floor((x - x0 + 200) / 4) % 2 ? GR : HU;
        g.set(x, y, ram[lim(tono(x, y, 3 - k * 0.9 - (x > b - 3 ? 0.8 : 0), 0.3), 0, 4)], ram);
      }
    }
    for (let x = x0; x < x1; x++) {
      const ram = Math.floor((x - x0 + 200) / 4) % 2 ? GR : HU, hondo = (x - x0) % 4 === 1 || (x - x0) % 4 === 2 ? 3 : 2;
      for (let y = 48; y < 48 + hondo; y++) g.set(x, y, ram[y === 48 ? 1 : 2], ram);
      g.set(x, 48 + hondo, NE[1]);
    }
    capa().rect(x0, 60, x1 - x0, 12).pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1 });
    for (let x = x0; x < x1; x++) g.set(x, 60, M[3]);
    // cestos con manzanas y coles, y unas calabazas
    for (const [x, ram] of [[x0 + 5, GR], [x0 + 15, HO], [x0 + 25, GR]]) {
      capa().rect(x, 55, 8, 5).off(x, 59).off(x + 7, 59).pintar(g, OC, { relieve: 1.2, max: 3, separar: 1 });
      for (let i = 0; i < 4; i++) capa().ell(x + 1.5 + i * 1.7, 54, 1.3, 1.2).pintar(g, ram, { relieve: 1, max: 4, min: 2 });
    }
    for (const [x, r] of [[x1 - 8, 3.5], [x1 - 13, 2.8]]) { capa().ell(x, 72 - r, r + 1, r).pintar(g, TE, { relieve: 2, max: 4, separar: 1 }); g.set(x, 72 - r * 2, HO[2]); }
  }
  function aldeaAnim(ctx, t) {
    // humo de la chimenea
    const [cx, cy] = CHIMENEA_ALDEA;
    for (let i = 0; i < 7; i++) {
      const p = (t / 2400 + i / 7) % 1, x = Math.round(cx + p * 14 + Math.sin(p * 7 + i) * 1.5), y = Math.round(cy - 2 - p * 26), s = Math.round(1 + p * 3);
      ctx.fillStyle = p < 0.35 ? HU[3] : p < 0.7 ? GRIS[4] : AZ[4];
      ctx.fillRect(x - s, y, s * 2 + 1, 1);
      ctx.fillRect(x - s + 1, y - 1, s * 2 - 1, 1);
      if (s > 1) ctx.fillRect(x - s + 1, y + 1, s * 2 - 1, 1);
    }
    // estandarte en la torre del castillo
    for (let i = 0; i < 6; i++) {
      const y = 18 + Math.round(Math.sin(t / 200 - i * 0.8) * (i / 6) * 1.4);
      ctx.fillStyle = i < 3 ? GR[3] : GR[2];
      ctx.fillRect(41 + i, y, 1, i < 4 ? 3 : 2);
    }
  }

  /* Contraluz: los píxeles de una capa que dan hacia la luz (dx, dy) toman el color del borde. */
  function contraluz(g, c, col, dx, dy) {
    cada(c, (x, y) => { if (!c.tiene(x + dx, y + dy)) g.set(x, y, typeof col === "function" ? col(x, y) : col); });
  }

  /* ---------- El camino del bosque, al atardecer ---------- */
  const OCASO = [SO[2], SO[3], VI[2], R.piel.violeta[3], GR[2], TE[3], F[3], F[4]];
  const SOL_OCASO = [122, 50];
  const caminoOcaso = t => [122 - 50 * t + Math.sin(t * 3.2) * 7 * t, 1 + 34 * t ** 1.5];
  function camino(g) {
    const [sx, sy] = SOL_OCASO;
    rellenar(g, 0, 0, W, 62, OCASO, (x, y) => Math.pow(y / 54, 1.1) * 6.3 + Math.max(0, 1 - Math.hypot(x - sx, (y - sy) * 1.7) / 52) * 1.5, 0.55);
    // nubes alargadas con la panza encendida
    for (const [x0, x1, y, k] of [[6, 74, 12, 1], [88, 176, 8, 1], [36, 112, 24, 2], [128, 188, 31, 2]]) {
      for (let x = x0; x < x1; x++) {
        const f = (x - x0) / (x1 - x0), alto = Math.round(1 + Math.sin(f * Math.PI) * 2.4);
        for (let j = 0; j < alto; j++) g.set(x + j, y - j, OCASO[k]);
        g.set(x, y + 1, f > 0.15 && f < 0.85 ? OCASO[k + 3] : OCASO[k + 1]);
      }
    }
    capa().ell(sx, sy, 7.5, 7.5).pintar(g, [F[4]], { plano: 0 });
    capa().ell(sx, sy, 5, 5).pintar(g, [HU[4]], { plano: 0 });
    // bosque lejano contra el sol
    for (let x = 0; x < W; x++) {
      const pico = (hash(x >> 2, 3) * 4 + (x % 4 === 1 ? 2 : 0)) * (hash(x >> 3, 5) > 0.4 ? 1 : 0.5);
      const top = Math.round(50 - pico - Math.sin(x * 0.05) * 1.5);
      for (let y = top; y < 64; y++) g.set(x, y, Math.abs(x - sx) < 26 && y < top + 1 ? GR[2] : SO[3]);
    }
    // árboles a ambos lados del camino, en dos filas
    const fila = (lista, col, borde) => {
      for (const [x, by, alto] of lista) {
        const c = pino(g, x, by, alto, alto * 0.55, SO, { plano: () => col });
        contraluz(g, c, borde, x < sx ? 1 : -1, 0);
      }
    };
    fila([[8, 66, 34], [22, 64, 26], [36, 66, 30], [52, 63, 22], [66, 62, 16], [78, 61, 12], [160, 62, 18], [172, 64, 26], [186, 66, 34]], SO[2], GR[2]);
    fila([[2, 74, 48], [16, 72, 40], [30, 73, 44], [178, 72, 40], [191, 74, 52]], SO[1], TE[2]);
    // camino de tierra hacia el ocaso
    for (let y = 52; y < H; y++) for (let x = 0; x < W; x++) {
      const t = (y - 52) / 56, [cx, an] = caminoOcaso(t), d = Math.abs(x - cx);
      const k = g.get(x, y);
      if (d < an) {
        const rodada = Math.abs(d - an * 0.45) < 0.6 + t * 0.8;
        let v = 2.5 + Math.max(0, 1 - Math.hypot(x - sx, (y - sy) * 1.3) / 60) * 2 - t * 0.6 - (rodada ? 0.9 : 0) - (d > an - 1.5 ? 0.6 : 0);
        g.set(x, y, [SO[2], M[0], M[1], TE[1], TE[2], OC[2]][lim(tono(x, y, v, 0.4), 0, 5)]);
      } else if (y > 60 || !k || k === SO[3]) {
        let v = 2.1 + Math.max(0, 1 - Math.hypot(x - sx, (y - sy) * 1.3) / 70) * 1.4 - t * 0.5 + ((x * 7 + y * 5) % 11 === 0 ? 0.8 : 0);
        g.set(x, y, [SO[1], MUSGO[0], MUSGO[1], OL[1], OL[2]][lim(tono(x, y, v, 0.3), 0, 4)]);
      }
    }
    // matas de hierba alta en las cunetas
    for (let i = 0; i < 34; i++) {
      const x = Math.floor(hash(i, 7) * W), y = 64 + Math.floor(hash(i, 8) * 44), t = (y - 52) / 56, [cx, an] = caminoOcaso(t);
      if (Math.abs(x - cx) < an + 2) continue;
      const al = 2 + Math.floor(t * 4);
      for (let j = 0; j < al; j++) { g.set(x, y - j, MUSGO[1]); g.set(x + (j % 2 ? 1 : -1), y - j - 1, j === al - 1 ? TE[2] : MUSGO[2]); }
    }
    carroVolcado(g);
  }
  /* El carro asaltado: volcado, con una rueda rota, la carga por el suelo y flechas clavadas. */
  function carroVolcado(g) {
    conBorde(g, SO[0], tmp => {
      const caja = capa().poly([[148, 61], [184, 52], [189, 66], [153, 74]]);
      caja.pintar(tmp, M, { relieve: 2, max: 2, sesgo: -0.25 });
      cada(caja, (x, y) => { if (Math.round((y - 61) + (x - 148) * 0.25) % 4 === 0) tmp.set(x, y, M[0], M); });
      capa().linea(150, 63, 136, 52, 2).pintar(tmp, M, { relieve: 1, max: 2 });
      const rueda = capa().ell(162, 68, 7.5, 7.5).quitarEll(162, 68, 5.6, 5.6);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283 + 0.3; rueda.linea(162, 68, 162 + Math.cos(a) * 6, 68 + Math.sin(a) * 6, 1); }
      rueda.ell(162, 68, 1.4, 1.4).pintar(tmp, M, { relieve: 1, max: 3, sesgo: -0.1 });
      cajon(tmp, 170, 67, 8, 7, -0.3);
      capa().ell(181, 73, 4.5, 2.6).pintar(tmp, HU, { relieve: 2, max: 2, sesgo: -0.3 });
    });
    const rota = capa().ell(186, 79, 7, 2).quitarEll(186, 79, 5, 1.2).linea(181, 79, 191, 79, 1);
    rota.pintar(g, M, { plano: 1 });
    for (const [x, y, dx, dy] of [[171, 57, -5, -3], [178, 55, -4, -4], [143, 77, -2, -6], [158, 64, -5, -2]]) {
      capa().linea(x, y, x + dx, y + dy, 1).pintar(g, M, { plano: 3 });
      g.set(x + dx, y + dy, HU[2]).set(x + dx + (dx < 0 ? -1 : 1), y + dy, GR[2]).set(x + dx, y + dy - 1, HU[3]);
    }
    for (const x of [126, 132]) g.set(x, 76, M[1]).set(x + 1, 76, OC[3]);
  }
  function caminoAnim(ctx, t) {
    luciernagas(ctx, t, 16, 0, 52, W, 48, [OL[3], HO[4], OC[4]], 5);
  }

  /* ---------- El Bosque de los Susurros ---------- */
  const CORTEZA = [MUSGO[0], M[0], M[1], P[2], MUSGO[3]];
  const BRUMA = [MUSGO[2], ESPECTRO[2], ESPECTRO[3]];
  const SETAS = [[34, 75], [44, 78], [9, 93], [162, 74], [184, 79], [176, 95]];
  function bosque(g) {
    rellenar(g, 0, 0, W, 76, MUSGO, (x, y) => 0.7 + Math.max(0, 1 - Math.abs(y - 50) / 34) * 2.2 - Math.abs(x - 96) / 160, 0.45);
    // troncos lejanos y medios, con bancos de niebla entre ellos
    const az = azar(41);
    const banco = (lista, col, dens) => {
      for (const [cx, cy, rx, ry] of lista) for (let y = Math.round(cy - ry); y <= cy + ry; y++) for (let x = Math.round(cx - rx); x <= cx + rx; x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
        if (d < 1 && umbral(x, y) < (1 - d) * dens) g.set(x, y, col);
      }
    };
    for (let capaT = 0; capaT < 2; capaT++) {
      const col = capaT ? MUSGO[1] : MUSGO[2];
      for (let i = 0; i < 9; i++) {
        const x = 30 + Math.floor(az() * 130), w = capaT ? 5 + az() * 5 : 2 + az() * 3;
        for (let y = 0; y < 72; y++) for (let k = 0; k < w; k++) g.set(x + k, y, k === 0 && capaT ? MUSGO[2] : col);
        if (capaT) for (let k = -3; k < w + 3; k++) g.set(x + k, 72 - Math.max(0, 2 - Math.abs(k - w / 2) / 2), col);
      }
      if (!capaT) banco([[70, 56, 40, 6], [140, 60, 36, 5], [104, 50, 22, 3]], BRUMA[1], 1.3);
      else banco([[46, 66, 34, 4], [122, 68, 40, 4], [170, 62, 22, 3]], BRUMA[0], 1.1);
    }
    // haces de luz entre las copas
    for (let y = 0; y < 72; y++) for (let x = 0; x < W; x++) {
      let r = 0;
      for (const [x0, w] of [[70, 6], [104, 9], [134, 5]]) { const c = x0 + y * 0.3; r = Math.max(r, 1 - Math.abs(x - c) / w); }
      r *= 1 - y / 90;
      if (r <= 0 || umbral(x, y) > r * 0.42) continue;
      const k = MUSGO.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, MUSGO[Math.min(4, k + 1)]);
      else if (BRUMA.includes(g.get(x, y))) g.set(x, y, ESPECTRO[3]);
    }
    // copas
    copa(g, [[18, 2, 26, 9], [64, -2, 22, 8], [112, 1, 20, 7], [160, -1, 24, 9], [190, 6, 14, 8], [88, 4, 10, 5]], MUSGO, 13, { relieve: 5, max: 3 });
    // árboles enormes a los lados, con raíces
    arbolViejo(g, [[2, 0], [14, 30], [10, 60], [6, 80]], [26, 22, 24], 1);
    arbolViejo(g, [[184, 0], [176, 32], [180, 58], [186, 80]], [24, 22, 26], -1);
    capa().ell(178, 42, 4, 6).pintar(g, SO, { plano: 0 });
    for (let y = 37; y < 48; y++) g.set(174 + (y > 42 ? 0 : 1), y, MUSGO[3]);
    // suelo: musgo y hojarasca
    for (let y = 74; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 1.6 + Math.sin(x * 0.07 + y * 0.2) * 0.3 - (y - 74) * 0.008 + ((x * 5 + y * 3) % 13 === 0 ? 0.9 : 0);
      g.set(x, y, (x * 3 + y * 11) % 17 === 0 ? M[1] : MUSGO[lim(tono(x, y, v, 0.3), 0, 4)], MUSGO);
    }
    for (const [x0, y0, x1, y1] of [[24, 74, 52, 79], [168, 73, 140, 78], [30, 80, 58, 86]]) capa().curva(x0, y0, (x0 + x1) / 2, y0 + 3, x1, y1, 3, 1.5).pintar(g, CORTEZA, { relieve: 1.5, max: 3 });
    for (let x = 0; x < W; x++) if (g.get(x, 74) !== CORTEZA[1]) g.set(x, 74, MUSGO[1]);
    SETAS.forEach(([x, y], i) => setas(g, x, y, i === 5 || i === 2 ? MG : ESPECTRO));
    helecho(g, 0, 108, 1);
    helecho(g, 192, 108, -1);
  }
  function arbolViejo(g, pts, grueso, lado) {
    const c = tronco(g, pts, grueso, CORTEZA, { relieve: 4, max: 4, luz: [-0.7, -0.4, 0.6] });
    cada(c, (x, y) => { if (!c.tiene(x - 1, y) && hash(x, y, 9) > 0.3) g.set(x, y, MUSGO[4]); else if (!c.tiene(x - 2, y) && hash(x, y, 8) > 0.6) g.set(x, y, MUSGO[3]); });
    const base = pts[pts.length - 2];
    for (const [dx, dy] of [[lado * 22, 6], [lado * 30, 2], [lado * -6, 8]]) capa().curva(base[0], base[1] + 6, base[0] + dx * 0.5, base[1] + dy + 4, base[0] + dx, base[1] + dy + 10, 5, 2).pintar(g, CORTEZA, { relieve: 2, max: 3 });
  }
  /* Setas que brillan con luz propia, con su halo. */
  function setas(g, x, y, ram = ESPECTRO) {
    for (let j = -10; j < 4; j++) for (let i = -11; i < 12; i++) {
      const d = Math.hypot(i, j * 1.3);
      if (d < 11 && umbral(x + i, y + j) < (1 - d / 11) * 0.75 && (MUSGO.includes(g.get(x + i, y + j)) || CORTEZA.includes(g.get(x + i, y + j)))) g.set(x + i, y + j, d < 5 ? ram[2] : ram[1]);
    }
    for (const [dx, h, r] of [[0, 5, 3], [-4, 3, 2], [4, 3, 2.2], [7, 2, 1.4]]) {
      for (let j = 0; j < h; j++) { g.set(x + dx, y - j, HU[3]); if (r > 2) g.set(x + dx + 1, y - j, HU[2]); }
      const c = capa().ell(x + dx + 0.5, y - h - 0.5, r + 0.5, r * 0.65).quitarRect(0, y - h + 1, W, 12);
      c.pintar(g, ram, { relieve: 1.5, min: 2, max: 4 });
      if (r > 2) g.set(x + dx - 1, y - h - 1, HU[4]).set(x + dx + 2, y - h, HU[4]);
    }
  }
  function helecho(g, x0, y0, lado) {
    for (let k = 0; k < 6; k++) {
      const a = -0.25 - k * 0.22, largo = 14 + (k % 3) * 4;
      let px = x0, py = y0;
      for (let s = 0; s < largo; s++) {
        const aa = a - s * 0.035;
        px += Math.cos(aa) * lado; py += Math.sin(aa);
        g.set(Math.round(px), Math.round(py), MUSGO[3]);
        if (s % 2 === 0 && s > 2) {
          const hoja = Math.max(1, Math.round((largo - s) / 5));
          for (let h = 1; h <= hoja; h++) { g.set(Math.round(px), Math.round(py) - h, MUSGO[4]); g.set(Math.round(px) + lado, Math.round(py) + h, MUSGO[2]); }
        }
      }
    }
  }
  function bosqueAnim(ctx, t) {
    jirones(ctx, t, 9, 0, 46, W, 24, [ESPECTRO[2], MUSGO[3]], 3, 4);
    luciernagas(ctx, t, 14, 10, 30, 172, 66, [OL[3], HO[4], ESPECTRO[4]], 9);
  }

  /* ---------- El puente viejo sobre el barranco ---------- */
  const FUGA_PUENTE = [96, 40];
  function puente(g) {
    rellenar(g, 0, 0, W, 50, [GRIS[3], AZ[3], GRIS[4], AZ[4], HU[2]], (x, y) => Math.pow(y / 44, 1.1) * 4, 0.5);
    // montañas al fondo del barranco
    for (let x = 0; x < W; x++) {
      const top = Math.round(30 + Math.abs(Math.sin(x * 0.04 + 0.5)) * -7 + Math.sin(x * 0.13) * 1.5 + 6);
      for (let y = top; y < 46; y++) g.set(x, y, y === top ? GRIS[4] : (x > 96 ? GRIS[3] : AZ[3]));
    }
    // paredes del barranco: la de la izquierda en sombra, la de la derecha a la luz
    const [vx, vy] = FUGA_PUENTE;
    const borde = (y, lado) => (lado < 0 ? vx - 2 - (y - vy) * 1.05 : vx + 2 + (y - vy) * 1.05) + Math.sin(y * 0.9) * 1.5 + Math.sin(y * 0.37 + lado) * 2.5;
    const izq = capa().poly([[0, 4], [vx - 2, vy - 2], [vx - 2, vy + 1], [0, vy + 30]]), der = capa().poly([[192, 2], [vx + 2, vy - 2], [vx + 2, vy + 1], [192, vy + 30]]);
    for (let y = vy; y < 66; y++) for (let x = 0; x < W; x++) { if (x < borde(y, -1)) izq.on(x, y); if (x > borde(y, 1)) der.on(x, y); }
    const est = teselas(110, 51, 0, 0, W, 66, 3.2, 20);
    roca(g, est, GRIS, (x, y) => (izq.tiene(x, y) ? 1.3 : 2.4) + Math.min(1, Math.hypot(x - vx, y - vy) / 110) * 0.5, () => [-0.6, -0.8, 1], { masc: izq, vari: 0.7, relieve: 1.4, bisel: 1.8, oscuro: 1.4, s: 0.3 });
    roca(g, est, GRIS, (x, y) => 2.4 + Math.min(1, Math.hypot(x - vx, y - vy) / 110) * 0.6, () => [-0.6, -0.8, 1], { masc: der, vari: 0.7, relieve: 1.4, bisel: 1.8, oscuro: 1.4, s: 0.3 });
    for (let y = 1; y < 66; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, k = est.id[i];
      if (k < 0 || est.borde[i] > 1.2 || (!izq.tiene(x, y) && !der.tiene(x, y))) continue;
      if (est.pts[k][1] > y && hash(k, 2) > 0.55 && est.id[(y - 1) * W + x] !== k) g.set(x, y, MUSGO[izq.tiene(x, y) ? 2 : 3]);
    }
    // bosque en lo alto de ambas paredes, cada vez más pequeño hacia el fondo
    for (const lado of [-1, 1]) for (let k = 0; k < 13; k++) {
      const f = k / 12, x = lado < 0 ? f * (vx - 6) : W - f * (W - vx - 6), y = lado < 0 ? 4 + f * (vy - 6) : 2 + f * (vy - 4);
      const alto = 28 * (1 - f) + 4;
      const c = pino(g, Math.round(x + lado * -2), Math.round(y + 3), alto, alto * 0.5, MUSGO, { relieve: 2, max: lado < 0 ? 2 : 3, luz: [-0.8, -0.4, 0.5] });
      if (lado > 0) contraluz(g, c, MUSGO[4], -1, 0);
    }
    // cascada en la pared de la derecha
    for (let y = 16; y < 54; y++) {
      const x = Math.round(150 - (y - 16) * 0.42 + Math.sin(y * 0.3) * 0.6);
      g.set(x, y, HU[3]).set(x + 1, y, AZ[4]).set(x - 1, y, GRIS[4]);
    }
    // río al fondo y niebla que llena el barranco
    for (let y = 30; y < 66; y++) for (let x = 0; x < W; x++) if (!g.get(x, y)) g.set(x, y, GRIS[4]);
    for (let y = vy + 2; y < 62; y++) {
      const t = (y - vy) / 22, w = 2 + t * 16;
      for (let x = Math.round(vx - w); x <= Math.round(vx + w); x++) g.set(x, y, Math.abs(x - vx) > w - 1.5 ? MA[3] : (x + y) % 5 ? AZ[4] : HU[3]);
    }
    for (let y = 36; y < 64; y++) for (let x = 0; x < W; x++) {
      const f = Math.max(0, 1 - Math.abs(y - 56) / 16) * Math.max(0, 1 - Math.abs(x - vx) / 90);
      if (umbral(x, y) < f) g.set(x, y, f > 0.6 ? HU[2] : GRIS[4]);
    }
    // pretil de piedra con musgo, mellado
    const PRETIL = [GRIS[1], GRIS[2], P[2], P[3], HU[1]];
    sillares(g, 0, 60, W, [6, 6], PRETIL, (x, y) => (y < 62 ? 3.3 : 2.4), { sem: 7, ancho: 13, bisel: 0.6, junta: 1.5, vari: 0.6 });
    for (let x = 0; x < W; x++) if (hash(x, 61, 2) > 0.62) g.set(x, 60 + (hash(x, 3) > 0.5 ? 1 : 0), MUSGO[3]);
    const mella = capa().poly([[42, 60], [55, 60], [53, 65], [44, 64]]);
    cada(mella, (x, y) => g.set(x, y, HU[2]));
    for (let x = 0; x < W; x++) g.set(x, 72, GRIS[0]);
    // tablero del puente: losas viejas con musgo en las juntas
    losas(g, 73, [4, 4, 5, 6, 7, 9], 22, 96, -60, P, (x, y) => 1.7 + (y - 73) * 0.004, 17, (x, y) => (hash(x, y, 5) > 0.7 ? MUSGO[2] : P[0]));
    // el cartel del peaje, con una calavera clavada
    capa().rect(123, 50, 2, 16).pintar(g, M, { relieve: 1, separar: 1 });
    conBorde(g, M[0], tmp => {
      capa().rect(110, 44, 27, 9).pintar(tmp, M, { relieve: 1.5, max: 3, sesgo: 0.1 });
      escribir(tmp, "PEAJE", 114, 46, M[0]);
    });
    calavera(g, 122, 54);
    calavera(g, 140, 76, HU, 1);
    capa().linea(146, 79, 156, 77, 2).pintar(g, HU, { relieve: 1, max: 3 });
  }
  function puenteAnim(ctx, t) {
    jirones(ctx, t, 7, 56, 46, 80, 14, [GRIS[4], GRIS[4], HU[2]], 2.5, 6);
    for (let i = 0; i < 5; i++) {
      const y = 16 + Math.floor(((t / 90) + i * 8) % 38), x = Math.round(150 - (y - 16) * 0.42 + Math.sin(y * 0.3) * 0.6);
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 2);
    }
    for (let i = 0; i < 6; i++) {
      const v = Math.sin(t / 260 + i * 1.9);
      if (v < 0.4) continue;
      ctx.fillStyle = HU[4]; ctx.fillRect(FUGA_PUENTE[0] - 6 + i * 2 + Math.round(Math.sin(t / 700 + i) * 2), 50 + (i % 3) * 3, 2, 1);
    }
  }

  /* ---------- La Cripta de los Reyes Olvidados ---------- */
  const PIEDRA_CRIPTA = [GRIS[0], GRIS[1], GRIS[2], GRIS[3], P[3], HU[1]];
  const LUCES_CRIPTA = [[16, 50], [176, 50], [68, 34], [124, 34]];
  const PUERTA_RUNAS = [96, 46];
  const VELAS_CRIPTA = [];
  const luzCripta = (x, y) => lim(LUCES_CRIPTA.reduce((v, [lx, ly]) => v + Math.max(0, 1 - Math.hypot((x - lx) / 44, (y - ly) / 40)) ** 1.6 * 0.75, 0));
  const fulgorRunas = (x, y) => Math.max(0, 1 - Math.hypot(x - PUERTA_RUNAS[0], (y - PUERTA_RUNAS[1]) * 0.9) / 30) ** 1.5;
  const cripta_ = { runas: [] };
  function cripta(g) {
    VELAS_CRIPTA.length = 0;
    g.rect(0, 0, W, H, GRIS[0]);
    sillares(g, 0, 0, W, [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], PIEDRA_CRIPTA, (x, y) => 0.7 + luzCripta(x, y) * 2.6 + (y < 12 ? -0.5 : 0), { sem: 3, ancho: 12, bisel: 0.6, junta: 1.4, vari: 0.5 });
    for (let y = 0; y < 72; y++) for (let x = 0; x < W; x++) {
      const f = fulgorRunas(x, y), k = PIEDRA_CRIPTA.indexOf(g.get(x, y));
      if (k >= 0 && f > 0.05 && umbral(x, y) < f * 0.9) g.set(x, y, f > 0.45 ? ESPECTRO[2] : ESPECTRO[1]);
    }
    // bóveda de arcos apuntados
    for (let x = 0; x < W; x++) {
      const f = (x % 48) / 48, y = Math.round(9 - Math.min(f, 1 - f) * 2 * 7);
      for (let j = 0; j <= y; j++) g.set(x, j, j === y ? GRIS[2] : GRIS[0]);
      g.set(x, y + 1, GRIS[1]);
    }
    // nichos del osario con calaveras
    for (const [x0, x1] of [[4, 66], [128, 190]]) for (const y of [15, 30]) for (let x = x0; x + 9 <= x1; x += 11) nicho(g, x, y);
    puertaRunas(g);
    sarcofago(g, 6, 58);
    sarcofago(g, 134, 186);
    // candelabros de hierro junto a la puerta
    for (const x of [68, 124]) {
      capa().rect(x, 38, 1, 33).pintar(g, HI, { plano: 2 });
      capa().linea(x, 66, x - 4, 71, 1).linea(x, 66, x + 4, 71, 1).rect(x - 3, 37, 7, 1).pintar(g, HI, { plano: 1 });
      vela(g, x, 36, 3, true);
      VELAS_CRIPTA.push([x, 32]);
    }
    telarana(g, 0, 10, 14, 1, 1);
    telarana(g, 191, 10, 14, -1, 1);
    telarana(g, 66, 30, 8, -1, -1);
    // suelo de losas con polvo y huesos
    losas(g, 72, [3, 4, 4, 5, 6, 7, 7], 20, 96, -60, PIEDRA_CRIPTA, (x, y) => 1.3 + luzCripta(x, 66) * 1.6 + fulgorRunas(x, 60) * 0.8, 23, GRIS[0]);
    for (let x = 0; x < W; x++) g.set(x, 72, GRIS[0]);
    calavera(g, 168, 78);
    capa().linea(174, 81, 183, 79, 2).pintar(g, HU, { relieve: 1, max: 2 });
    capa().linea(8, 84, 16, 87, 2).pintar(g, HU, { relieve: 1, max: 2 });
  }
  function nicho(g, x, y) {
    for (let j = 0; j < 10; j++) for (let i = 0; i < 9; i++) {
      const borde = j === 0 ? PIEDRA_CRIPTA[1] : i === 0 ? GRIS[0] : j === 9 ? PIEDRA_CRIPTA[3] : null;
      g.set(x + i, y + j, borde || (j < 3 ? SO[0] : GRIS[0]));
    }
    calavera(g, x + 2, y + 4, HU, hash(x, y) > 0.5 ? 1 : -1);
    g.set(x + 1, y + 8, HU[1]).set(x + 7, y + 8, HU[1]).set(x + 6, y + 8, HU[2]);
  }
  /* La puerta sellada: losa de piedra con un círculo de runas que brilla. */
  function puertaRunas(g) {
    const [cx, cy] = PUERTA_RUNAS;
    for (const x of [76, 111]) capa().rect(x, 22, 6, 50).pintar(g, PIEDRA_CRIPTA, { relieve: 2, max: 4, separar: 1 });
    capa().rect(73, 18, 46, 6).pintar(g, PIEDRA_CRIPTA, { relieve: 2, max: 4, separar: 1 });
    rellenar(g, 82, 24, 29, 48, PIEDRA_CRIPTA, (x, y) => 1.3 + fulgorRunas(x, y) * 1.2 - (x === 96 ? 1 : 0), 0.3);
    cripta_.runas = [];
    const runa = (x, y, col) => { g.set(x, y, col); cripta_.runas.push([x, y]); };
    for (let k = 0; k < 10; k++) { const x = 77 + k * 4; runa(x, 20, ESPECTRO[3]); runa(x + 1, 21, ESPECTRO[3]); if (k % 2) runa(x, 22, ESPECTRO[3]); }
    for (let a = 0; a < 6.283; a += 0.06) g.set(Math.round(cx + Math.cos(a) * 10), Math.round(cy + Math.sin(a) * 10), ESPECTRO[2]);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * 6.283, x = Math.round(cx + Math.cos(a) * 8), y = Math.round(cy + Math.sin(a) * 8);
      runa(x, y, ESPECTRO[4]);
      runa(x + (k % 2 ? 1 : 0), y + (k % 2 ? 0 : 1), ESPECTRO[3]);
    }
    const ojo = [[cx, cy - 4], [cx - 1, cy - 3], [cx + 1, cy - 3], [cx - 2, cy - 2], [cx + 2, cy - 2], [cx - 3, cy - 1], [cx + 3, cy - 1], [cx - 4, cy], [cx + 4, cy], [cx - 4, cy + 1], [cx - 3, cy + 1], [cx - 2, cy + 1], [cx - 1, cy + 1], [cx, cy + 1], [cx + 1, cy + 1], [cx + 2, cy + 1], [cx + 3, cy + 1], [cx + 4, cy + 1]];
    for (const [x, y] of ojo) runa(x, y, ESPECTRO[3]);
    runa(cx, cy - 1, ESPECTRO[4]);
  }
  /* Sarcófago con la efigie de un rey yacente: corona, espada y velas en los extremos. */
  function sarcofago(g, x0, x1) {
    const C = PIEDRA_CRIPTA;
    capa().rect(x0, 61, x1 - x0, 11).pintar(g, C, { relieve: 2, max: 3, sesgo: -0.1, separar: 1 });
    for (let x = x0 + 3; x + 8 < x1; x += 11) for (let j = 63; j < 70; j++) { g.set(x, j, C[3]); g.set(x + 8, j, C[1]); }
    for (let x = x0 + 3; x + 8 < x1; x += 11) for (let i = 0; i <= 8; i++) { g.set(x + i, 63, C[3]); g.set(x + i, 69, C[1]); }
    capa().rect(x0 - 1, 58, x1 - x0 + 2, 3).pintar(g, C, { relieve: 1, max: 4, separar: 1 });
    conBorde(g, GRIS[0], tmp => {
      const cab = x0 + 6;
      capa().rect(cab - 3, 55, 6, 3).pintar(tmp, C, { relieve: 1, max: 3 });
      capa().ell(cab, 53, 2.6, 2.4).pintar(tmp, C, { relieve: 1.5, max: 4 });
      for (const dx of [-2, 0, 2]) tmp.set(cab + dx, 50, B[3], B).set(cab + dx, 51, B[2], B);
      capa().ell((x0 + x1) / 2 + 3, 56, (x1 - x0) / 2 - 10, 2.6).pintar(tmp, C, { relieve: 2, max: 4 });
      capa().ell(x1 - 7, 55, 2, 2.4).ell(x1 - 4, 55, 1.6, 2).pintar(tmp, C, { relieve: 1, max: 4 });
      for (let x = cab + 8; x < x1 - 10; x++) tmp.set(x, 54, HI[3], HI);
      tmp.set(cab + 7, 53, B[3], B).set(cab + 7, 54, B[4], B).set(cab + 7, 55, B[2], B).set(cab + 6, 54, B[2], B);
    });
    for (const [x, alto] of [[x0 + 1, 4], [x0 + 3, 2], [x1 - 2, 3]]) { vela(g, x, 57, alto); VELAS_CRIPTA.push([x, 57 - alto - 1]); }
  }
  function criptaAnim(ctx, t) {
    if (!VELAS_CRIPTA.length) cripta(new Rejilla(W, H));
    VELAS_CRIPTA.forEach(([x, y], i) => llamaVela(ctx, x, y, t, i * 2.1));
    // las runas laten: un brillo que recorre el círculo
    const giro = (t / 1600) % 1, [cx, cy] = PUERTA_RUNAS;
    ctx.fillStyle = ESPECTRO[4];
    for (const [x, y] of cripta_.runas) {
      const a = (Math.atan2(y - cy, x - cx) / 6.283 + 1) % 1, d = Math.abs(a - giro);
      if (y < 30 ? Math.abs(((x - 76) / 44) - giro) < 0.08 : Math.min(d, 1 - d) < 0.09) ctx.fillRect(x, y, 1, 1);
    }
    // un fuego fatuo que vaga junto al osario
    const p = (t / 7000) % 1, vis = Math.sin(p * Math.PI);
    if (vis > 0.25) {
      const x = Math.round(20 + p * 36 + Math.sin(t / 600) * 3), y = Math.round(44 + Math.sin(t / 450) * 3);
      ctx.fillStyle = ESPECTRO[2]; ctx.fillRect(x - 1, y, 3, 2); ctx.fillRect(x, y + 2, 1, 2);
      ctx.fillStyle = vis > 0.6 ? ESPECTRO[4] : ESPECTRO[3]; ctx.fillRect(x, y, 1, 2);
    }
  }

  /* ---------- Las minas enanas de Barak-Thur ---------- */
  const TIERRA = [CENIZA[0], CENIZA[1], M[0], M[1], P[2], M[2], P[3]];
  const FAROLES_MINA = [[36, 31], [156, 31]];
  const CRISTALES = [[9, 12, 1, 5], [182, 10, -1, 5], [188, 46, -1, 3], [62, 6, 1, 3], [134, 5, -1, 3], [4, 50, 1, 3]];
  const luzMina = (x, y) => lim(FAROLES_MINA.reduce((v, [lx, ly]) => v + Math.max(0, 1 - Math.hypot((x - lx) / 52, (y - ly) / 44)) ** 1.4, 0));
  const haciaFarol = (x, y) => {
    const [lx, ly] = Math.abs(x - FAROLES_MINA[0][0]) < Math.abs(x - FAROLES_MINA[1][0]) ? FAROLES_MINA[0] : FAROLES_MINA[1];
    const dx = lx - x, dy = ly - y, d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d, 1];
  };
  function mina(g) {
    g.rect(0, 0, W, H, CENIZA[0]);
    const tes = teselas(85, 17, 0, 0, W, 74, 1.4, 15);
    roca(g, tes, TIERRA, (x, y) => 1.2 + luzMina(x, y) * 4 - (y < 6 ? 0.6 : 0), haciaFarol, { vari: 0.6, relieve: 1.4, bisel: 2.2, oscuro: 1.5 });
    for (const [x, y, lado, n] of CRISTALES) cristales(g, x, y, lado, n);
    portalEnano(g, 96);
    // entibado de madera
    for (const [x0, x1] of [[12, 60], [132, 180]]) {
      for (const x of [x0, x1 - 4]) capa().rect(x, 24, 5, 48).pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1 });
      capa().rect(x0 - 3, 19, x1 - x0 + 6, 5).pintar(g, M, { relieve: 1.5, separar: 1 });
      for (const [a, s] of [[x0 + 5, 1], [x1 - 5, -1]]) capa().linea(a, 34, a + s * 9, 24, 2).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
    }
    for (const [x, y] of FAROLES_MINA) { for (let j = 24; j < y - 4; j++) g.set(x, j, HI[1]); farol(g, x, y); }
    // raíles y traviesas
    for (let x = 0; x < W; x += 6) capa().rect(x, 68, 4, 3).pintar(g, M, { relieve: 1, max: 2 });
    for (let x = 0; x < W; x++) { g.set(x, 66, HI[3]).set(x, 67, HI[1]); g.set(x, 70, HI[3]).set(x, 71, HI[1]); }
    vagoneta(g, 122, 66);
    // pico apoyado, un cubo y un montón de mineral
    capa().linea(58, 72, 66, 50, 1).pintar(g, M, { plano: 3 });
    capa().curva(60, 49, 66, 47, 72, 51, 2, 1).pintar(g, HI, { relieve: 1, max: 3 });
    tonel(g, 72, 64, 7, 8, { sesgo: -0.2 });
    capa().ell(170, 72, 9, 4).pintar(g, TIERRA, { relieve: 3, max: 5, separar: 1 });
    for (const [x, y] of [[166, 70], [172, 69], [175, 71]]) g.set(x, y, B[4]);
    g.set(169, 70, CRISTAL[4]);
    // suelo de tierra y grava
    for (let y = 72; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 2.9 + luzMina(x, 64) * 1.6 - (y - 72) * 0.018 + ((x * 7 + y * 13) % 19 === 0 ? 1 : 0) + ((x * 11 + y * 5) % 23 === 0 ? -0.8 : 0);
      g.set(x, y, TIERRA[lim(tono(x, y, v, 0.3), 0, 6)], TIERRA);
    }
    for (let x = 0; x < W; x++) g.set(x, 72, TIERRA[1]);
  }
  /* Racimo de cristales prismáticos que asoma de la roca, con un halo tenue. */
  function cristales(g, x, y, lado, n) {
    for (let j = -5; j < 6; j++) for (let i = -6; i < 7; i++) {
      const d = Math.hypot(i, j);
      if (d < 6 && umbral(x + i, y + j) < (1 - d / 6) * 0.55 && TIERRA.includes(g.get(x + i, y + j))) g.set(x + i, y + j, CRISTAL[d < 3 ? 2 : 1]);
    }
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + lado * (k - (n - 1) / 2) * 0.42, largo = 4 + ((k * 5) % 3) + (k === Math.floor(n / 2) ? 3 : 0);
      const ux = Math.cos(a), uy = Math.sin(a), px = x + (k - (n - 1) / 2) * 1.4, py = y + 2;
      for (let s = 0; s <= largo; s++) {
        const ancho = s < largo - 1 ? 1 : 0, qx = px + ux * s, qy = py + uy * s;
        g.set(Math.round(qx - uy * ancho), Math.round(qy + ux * ancho), CRISTAL[2]);
        g.set(Math.round(qx), Math.round(qy), s === largo ? CRISTAL[4] : CRISTAL[3]);
        g.set(Math.round(qx + uy * ancho), Math.round(qy - ux * ancho), s > largo - 2 ? CRISTAL[4] : CRISTAL[3]);
      }
    }
  }
  /* Portal tallado por los enanos, con runas en el dintel y un túnel que se pierde a lo lejos. */
  function portalEnano(g, cx) {
    const hueco = capa().poly([[cx - 15, 72], [cx - 15, 40], [cx - 9, 33], [cx + 9, 33], [cx + 15, 40], [cx + 15, 72]]);
    cada(hueco, (x, y) => {
      const prof = Math.max(Math.abs(x - cx) / 15, (72 - y) / 39);
      g.set(x, y, prof > 0.7 ? CENIZA[1] : prof > 0.4 ? CENIZA[0] : SO[0]);
    });
    g.set(cx, 58, F[3]).set(cx, 57, F[2]);
    const marco = capa().poly([[cx - 21, 72], [cx - 21, 38], [cx - 12, 27], [cx + 12, 27], [cx + 21, 38], [cx + 21, 72]]).restar(hueco);
    cada(marco, (x, y) => {
      const bloque = (Math.floor((y - 27) / 5) + (x < cx ? 0 : 1)) % 2, junta = (y - 27) % 5 === 0 || Math.abs(x - cx) === 17;
      g.set(x, y, junta ? GRIS[1] : GRIS[bloque ? 3 : 2]);
    });
    for (const x of [cx - 21, cx + 20]) for (let y = 38; y < 72; y++) g.set(x, y, GRIS[1]);
    for (let k = 0; k < 8; k++) { const x = cx - 13 + k * 3.5; g.set(Math.round(x), 30, B[3]).set(Math.round(x) + 1, 31, B[2]).set(Math.round(x), 32, k % 2 ? B[3] : GRIS[2]); }
    plantilla(g, [" aaa ", "a#a#a", "aaaaa", " bbb ", "b b b"], cx - 2, 21, { a: GRIS[4], b: GRIS[3], "#": SO[0] });
  }
  function vagoneta(g, x, y) {
    conBorde(g, NE[0], tmp => {
      capa().ell(x + 15, y - 12, 13, 5).pintar(tmp, TIERRA, { relieve: 3, max: 5 });
      capa().poly([[x, y - 13], [x + 30, y - 13], [x + 27, y - 2], [x + 3, y - 2]]).pintar(tmp, HI, { relieve: 2, max: 3, sesgo: -0.1 });
      for (let i = x + 2; i < x + 29; i += 4) tmp.set(i, y - 11, HI[3], HI).set(i, y - 5, HI[3], HI);
      for (let i = x; i <= x + 30; i++) tmp.set(i, y - 13, HI[3], HI);
      for (const wx of [x + 7, x + 23]) capa().ell(wx, y - 1, 3, 3).pintar(tmp, HI, { relieve: 1.5, max: 2 });
      for (const [a, b] of [[x + 10, y - 16], [x + 16, y - 18], [x + 21, y - 15]]) tmp.set(a, b, B[4], B);
      tmp.set(x + 13, y - 15, CRISTAL[4], CRISTAL).set(x + 14, y - 15, CRISTAL[3], CRISTAL);
    });
  }
  function minaAnim(ctx, t) {
    FAROLES_MINA.forEach(([x, y], i) => llamaFarol(ctx, x, y, t, i * 2.7));
    CRISTALES.forEach(([x, y, lado, n], i) => {
      const p = ((t / 1000) * 0.45 + hash(i, 4)) % 1;
      if (p > 0.12) return;
      const px = Math.round(x + lado * 2), py = Math.round(y - 4 - (i % 3));
      ctx.fillStyle = HU[4]; ctx.fillRect(px, py, 1, 1);
      ctx.fillStyle = CRISTAL[4]; ctx.fillRect(px - 1, py, 1, 1); ctx.fillRect(px + 1, py, 1, 1); ctx.fillRect(px, py - 1, 1, 1); ctx.fillRect(px, py + 1, 1, 1);
    });
  }

  /* ---------- La gran forja enana ---------- */
  const PIEDRA_FORJA = [CENIZA[0], CENIZA[1], CENIZA[2], CENIZA[3], BRASA[3], TE[3]];
  const CHORRO = [158, 39];
  const luzForja = (x, y) => lim(Math.max(0, 1 - Math.hypot((x - 40) / 70, (y - 58) / 48)) ** 1.3 + Math.max(0, 1 - Math.hypot((x - CHORRO[0]) / 46, (y - 60) / 40)) ** 1.4 * 0.9);
  function forja(g) {
    g.rect(0, 0, W, H, CENIZA[0]);
    sillares(g, 0, 0, W, [8, 8, 10, 10, 10, 10, 8, 8], PIEDRA_FORJA, (x, y) => 1 + luzForja(x, y) * 3.3, { sem: 9, ancho: 22, bisel: 0.8, junta: 1.5, vari: 0.5 });
    // friso enano tallado: galones y runas
    for (let y = 10; y < 18; y++) for (let x = 0; x < W; x++) {
      const k = PIEDRA_FORJA.indexOf(g.get(x, y)), zig = Math.abs(((x % 8) - 4)) === Math.abs(y - 14) % 5;
      if (k >= 0) g.set(x, y, y === 10 || y === 17 ? PIEDRA_FORJA[Math.min(5, k + 1)] : zig ? PIEDRA_FORJA[Math.max(0, k - 2)] : g.get(x, y));
    }
    // pilastras talladas en los bordes
    for (const x of [0, 182]) {
      capa().rect(x, 0, 10, 72).pintar(g, PIEDRA_FORJA, { relieve: 2, max: 4, sesgo: -0.1, separar: 1 });
      for (let y = 4; y < 72; y += 9) for (let i = 1; i < 9; i++) g.set(x + i, y, PIEDRA_FORJA[1]);
    }
    horno(g);
    cabezaEnana(g, CHORRO[0]);
    // cadenas con garfios y estante de martillos
    for (const [x, largo] of [[84, 30], [118, 22]]) { cadena(g, x, 0, largo); capa().curva(x, largo, x + 3, largo + 4, x, largo + 6, 1).pintar(g, HI, { plano: 3 }); }
    capa().rect(90, 28, 26, 2).pintar(g, M, { relieve: 1, separar: 1 });
    for (const [x, w] of [[93, 7], [103, 6], [111, 3]]) {
      capa().rect(x + Math.floor(w / 2), 30, 1, 12).pintar(g, M, { plano: 2 });
      capa().rect(x, 42, w, 4).pintar(g, HI, { relieve: 1.5, separar: 1 });
    }
    // yunque y pila de templar
    conBorde(g, NE[0], tmp => {
      capa().rect(88, 64, 14, 8).pintar(tmp, PIEDRA_FORJA, { relieve: 2, max: 4 });
      capa().poly([[82, 56], [104, 56], [104, 59], [100, 60], [99, 63], [91, 63], [90, 60], [86, 59]]).pintar(tmp, HI, { relieve: 2, max: 4, luz: [-0.5, -0.7, 0.5] });
      for (let x = 86; x < 104; x++) tmp.set(x, 56, HI[4], HI);
    });
    tonel(g, 108, 61, 12, 11, { sesgo: -0.1 });
    for (let x = 109; x < 119; x++) g.set(x, 61, MA[3]).set(x, 62, MA[2]);
    // canal de lava: corre al fondo y gira hacia delante por la derecha
    canalLava(g);
    // suelo de losas al calor de la lava
    losas(g, 73, [3, 4, 5, 6, 8, 9], 24, 96, -50, PIEDRA_FORJA, (x, y) => 1.6 + luzForja(x, y) * 2.2, 29, CENIZA[0]);
    for (let y = 73; y < H; y++) for (let x = 172; x < 192; x++) {
      const c = 182 + (y - 72) * 0.12, d = Math.abs(x - c);
      if (d < 4.5) g.set(x, y, d > 3.4 ? CENIZA[0] : d > 2.4 ? BRASA[3] : (x + y) % 4 ? F[2] : F[3]);
      else if (d < 7 && umbral(x, y) < 0.5) g.set(x, y, BRASA[2]);
    }
    for (let x = 0; x < W; x++) g.set(x, 72, CENIZA[0]);
  }
  function cadena(g, x, y0, largo) {
    for (let j = 0; j < largo; j++) {
      if (j % 4 < 2) g.set(x - 1, y0 + j, HI[1]).set(x + 1, y0 + j, HI[2]);
      else g.set(x, y0 + j, HI[3]);
    }
  }
  /* El horno: cúpula escalonada de piedra con la boca al rojo y un fuelle. */
  function horno(g) {
    const c = capa().poly([[14, 72], [14, 40], [22, 30], [32, 26], [52, 26], [62, 30], [70, 40], [70, 72]]);
    sillares(g, 14, 24, 71, [6, 6, 6, 6, 6, 6, 6, 6], PIEDRA_FORJA, (x, y) => 2 + luzForja(x, y) * 2.2 - Math.abs(x - 42) * 0.02, { sem: 4, ancho: 8, bisel: 0.6, junta: 1.4, masc: c });
    capa().rect(34, 0, 16, 27).pintar(g, PIEDRA_FORJA, { relieve: 2, max: 3, sesgo: -0.15, separar: 1 });
    for (let y = 4; y < 27; y += 6) for (let x = 35; x < 49; x++) g.set(x, y, PIEDRA_FORJA[0]);
    const boca = capa().rect(28, 50, 28, 22).ell(42, 50, 14, 10);
    cada(boca, (x, y) => {
      const d = Math.hypot((x - 42) / 14, (y - 66) / 18);
      g.set(x, y, F[lim(tono(x, y, 4.3 - d * 3.4, 0.6), 0, 4)], F);
    });
    for (let a = Math.PI; a <= 2 * Math.PI; a += 0.03) for (let r = 14; r < 17; r++) g.set(Math.round(42 + Math.cos(a) * r), Math.round(50 + Math.sin(a) * r * 0.72), r === 14 ? BRASA[3] : PIEDRA_FORJA[r === 16 ? 1 : 3]);
    for (let x = 30; x < 55; x++) if (hash(x, 70) > 0.4) g.set(x, 70, F[4]).set(x, 71, F[3]);
    conBorde(g, NE[0], tmp => {
      capa().poly([[72, 60], [82, 56], [86, 64], [76, 70]]).pintar(tmp, TE, { relieve: 2, max: 2, sesgo: -0.2 });
      capa().linea(72, 61, 64, 62, 2).pintar(tmp, B, { relieve: 1, max: 3 });
      capa().linea(84, 58, 90, 52, 1).pintar(tmp, M, { plano: 2 });
    });
  }
  /* La gran cabeza enana tallada en la roca, que vierte lava por la boca. */
  function cabezaEnana(g, cx) {
    const C = PIEDRA_FORJA;
    conBorde(g, CENIZA[0], tmp => {
      capa().poly([[cx - 18, 22], [cx - 14, 10], [cx, 6], [cx + 14, 10], [cx + 18, 22]]).pintar(tmp, C, { relieve: 3, max: 4, luz: [-0.4, 0.6, 0.6] });
      for (const s of [-1, 1]) capa().curva(cx + s * 16, 16, cx + s * 26, 14, cx + s * 27, 4, 3, 1.4).pintar(tmp, HU, { relieve: 1, max: 2 });
      capa().rect(cx - 15, 22, 31, 12).pintar(tmp, C, { relieve: 2, max: 4, luz: [-0.4, 0.6, 0.6] });
      capa().poly([[cx - 3, 22], [cx + 3, 22], [cx + 5, 32], [cx - 5, 32]]).pintar(tmp, C, { relieve: 2, max: 5, luz: [-0.4, 0.7, 0.6] });
      for (const s of [-1, 1]) capa().poly([[cx + s * 2, 33], [cx + s * 15, 31], [cx + s * 13, 36], [cx + s * 4, 37]]).pintar(tmp, C, { relieve: 1.5, max: 4, luz: [-0.4, 0.7, 0.6] });
      for (const s of [-1, 1]) capa().poly([[cx + s * 4, 38], [cx + s * 15, 36], [cx + s * 13, 50], [cx + s * 8, 58], [cx + s * 5, 54]]).pintar(tmp, C, { relieve: 2, max: 4, luz: [-0.3, 0.7, 0.6] });
    });
    for (const s of [-1, 1]) {
      for (let y = 39; y < 56; y += 3) for (let k = 0; k < 3; k++) g.set(cx + s * (7 + k * 2), y + k, PIEDRA_FORJA[1]);
      g.set(cx + s * 9, 50, B[3]).set(cx + s * 10, 50, B[2]).set(cx + s * 9, 51, B[2]);
      for (let k = 0; k < 4; k++) g.set(cx + s * (4 + k * 2), 26, BRASA[3]);
      g.set(cx + s * 6, 26, F[3]).set(cx + s * 7, 26, F[4]);
    }
    for (let x = cx - 14; x <= cx + 14; x++) g.set(x, 22, PIEDRA_FORJA[1]);
    for (let y = 36; y < 40; y++) for (let x = cx - 3; x <= cx + 3; x++) g.set(x, y, y < 38 ? SO[0] : F[2]);
    for (let y = CHORRO[1]; y < 65; y++) for (let x = cx - 2; x <= cx + 2; x++) g.set(x, y, Math.abs(x - cx) === 2 ? F[2] : (y + x) % 3 ? F[3] : F[4]);
  }
  /* Pila de piedra al pie de la cabeza: la lava solo asoma por arriba y sale por un canal hacia delante. */
  function canalLava(g) {
    const [cx] = CHORRO;
    for (let x = cx - 14; x <= cx + 26; x++) { g.set(x, 59, BRASA[3]); g.set(x, 60, (x * 3) % 5 ? F[3] : F[4]); g.set(x, 61, F[2]); }
    sillares(g, cx - 16, 62, cx + 28, [5, 5], PIEDRA_FORJA, (x, y) => 2.6 + (y < 64 ? 1 : 0), { sem: 5, ancho: 9, bisel: 0.7, junta: 1.3 });
    for (let x = cx - 16; x < cx + 28; x++) g.set(x, 62, BRASA[3]);
    for (let y = 60; y < 72; y++) for (let x = cx + 20; x < cx + 28; x++) {
      const d = Math.abs(x - (cx + 24));
      g.set(x, y, d > 3 ? CENIZA[0] : d > 2 ? BRASA[3] : (x + y) % 4 ? F[2] : F[3]);
    }
  }
  function forjaAnim(ctx, t) {
    // la lava baja por el chorro y corre por el canal
    const [cx, cy] = CHORRO;
    ctx.fillStyle = F[4];
    for (let i = 0; i < 5; i++) { const y = cy + Math.floor(((t / 60) + i * 5.2) % 25); ctx.fillRect(cx - 1 + (i % 2), y, 1, 2); }
    for (let i = 0; i < 6; i++) {
      const x = cx - 13 + Math.floor(((t / 90) + i * 6.7) % 38);
      ctx.fillStyle = i % 3 ? F[4] : HU[4]; ctx.fillRect(x, 60, 2, 1);
    }
    for (let i = 0; i < 3; i++) { const y = 60 + Math.floor(((t / 80) + i * 4) % 12); ctx.fillStyle = F[4]; ctx.fillRect(cx + 24, y, 1, 2); }
    for (let i = 0; i < 6; i++) {
      const y = 73 + Math.floor(((t / 80) + i * 6) % 35), x = Math.round(182 + (y - 72) * 0.12) + (i % 2 ? -1 : 0);
      ctx.fillStyle = F[4]; ctx.fillRect(x, y, 1, 2);
    }
    // llamas en la boca del horno
    lengua(ctx, 35, 69, 9, 13, t, 0.4);
    lengua(ctx, 44, 69, 11, 16, t, 2.2);
    lengua(ctx, 52, 69, 8, 11, t, 4.1);
    // chispas del yunque, a golpes
    const golpe = (t % 1400) / 1400;
    if (golpe < 0.35) for (let i = 0; i < 7; i++) {
      const a = -0.5 - i * 0.33, v = 10 + (i % 3) * 5, p = golpe / 0.35;
      const x = Math.round(94 + Math.cos(a) * v * p), y = Math.round(55 + Math.sin(a) * v * p + 14 * p * p);
      ctx.fillStyle = p < 0.5 ? F[4] : F[3]; ctx.fillRect(x, y, 1, 1);
    }
    chispas(ctx, 42, 46, 4, 26, t);
  }

  /* ---------- La senda del Pico Ceniciento ---------- */
  const CIELO_CENIZA = [CENIZA[0], CENIZA[1], BRASA[1], BRASA[2], GR[2], BRASA[3], TE[3]];
  const CRATER = [150, 13];
  function pico(g) {
    const [kx, ky] = CRATER;
    rellenar(g, 0, 0, W, 64, CIELO_CENIZA, (x, y) => Math.pow(y / 60, 1.1) * 5 + Math.max(0, 1 - Math.hypot(x - kx, y - ky) / 70) * 1.6, 0.5);
    // columna de humo que sale del cráter y se extiende
    for (let i = 0; i < 26; i++) {
      const f = i / 25, x = kx + 4 + f * 40 + Math.sin(f * 5) * 6, y = ky - 2 - f * 14, r = 3 + f * 9;
      capa().ell(x, y, r, r * 0.6).pintar(g, CENIZA, { relieve: 3, max: 3, min: 1 });
    }
    // el volcán
    const cono = capa().poly([[70, 64], [kx - 7, ky + 1], [kx + 7, ky + 2], [W + 10, 50], [W + 10, 64]]);
    cada(cono, (x, y) => {
      const surco = Math.sin((x - kx) * 0.6 / Math.max(1, (y - ky) * 0.12)) > 0.6 ? -0.6 : 0;
      const v = 1.5 + (x < kx ? 0.5 : -0.2) + surco + Math.max(0, 1 - (y - ky) / 12) * 1.5;
      g.set(x, y, CENIZA[lim(tono(x, y, v, 0.3), 0, 4)], CENIZA);
    });
    for (let x = kx - 7; x <= kx + 7; x++) g.set(x, ky + 1, F[x % 3 ? 3 : 4]).set(x, ky + 2, F[2]);
    // ríos de lava por la ladera
    for (const pts of [[[kx - 3, ky + 3], [kx - 10, ky + 14], [kx - 8, ky + 24], [kx - 20, ky + 36], [kx - 30, ky + 48]], [[kx + 3, ky + 3], [kx + 9, ky + 16], [kx + 18, ky + 26], [kx + 22, ky + 40]]]) {
      for (let i = 0; i + 1 < pts.length; i++) {
        const c = capa().linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], i < 2 ? 2 : 1);
        cada(c, (x, y) => g.set(x, y, (x + y) % 3 ? F[3] : F[4]));
        cada(c, (x, y) => { if (!c.tiene(x - 1, y)) g.set(x - 1, y, F[1]); if (!c.tiene(x + 1, y)) g.set(x + 1, y, BRASA[3]); });
      }
    }
    // la boca de la guarida, con resplandor rojo
    const boca = capa().ell(118, 42, 6, 5).quitarRect(0, 45, W, 20);
    cada(boca, (x, y) => g.set(x, y, Math.hypot(x - 118, y - 44) < 3 ? BRASA[3] : SO[0]));
    for (let x = 111; x < 126; x++) g.set(x, 45, CENIZA[3]);
    // lagos de lava en la llanura lejana
    for (let x = 0; x < 72; x++) for (let y = 54; y < 64; y++) g.set(x, y, y === 54 ? CENIZA[2] : CENIZA[1]);
    for (const [x0, x1, y] of [[4, 30, 57], [20, 52, 60], [40, 66, 56]]) for (let x = x0; x < x1; x++) { g.set(x, y, F[2]); if ((x - x0) % 5 && x < x1 - 2) g.set(x, y + 1, F[1]); }
    // rocas negras de la media distancia
    for (const [x, y, w, h] of [[0, 58, 30, 14], [26, 62, 22, 10], [150, 58, 24, 14], [168, 52, 30, 20]]) {
      const c = capa().poly([[x, y + h], [x + w * 0.2, y + h * 0.3], [x + w * 0.45, y], [x + w * 0.7, y + h * 0.35], [x + w, y + h]]);
      c.pintar(g, CENIZA, { relieve: 3, max: 2 });
      contraluz(g, c, BRASA[3], 1, 0);
    }
    // la senda que sube en zigzag hasta la guarida
    const senda = [[40, 108], [70, 94], [100, 84], [80, 72], [110, 62], [96, 54], [118, 46]];
    for (let i = 0; i + 1 < senda.length; i++) {
      const [x0, y0] = senda[i], [x1, y1] = senda[i + 1], g0 = Math.max(1, (y0 - 40) / 6), g1 = Math.max(1, (y1 - 40) / 6);
      capa().curva(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, g0, g1).pintar(g, CENIZA, { relieve: 1, min: 3, max: 4 });
    }
    // suelo de ceniza con grietas que aún arden
    for (let y = 56; y < H; y++) for (let x = 0; x < W; x++) {
      const k = g.get(x, y);
      if (y < 72 ? k : k === CENIZA[3] || k === CENIZA[4]) continue;
      const v = 2 + Math.sin(x * 0.11 + y * 0.3) * 0.3 - (y - 72) * 0.012 + ((x * 7 + y * 3) % 17 === 0 ? -1 : 0);
      g.set(x, y, CENIZA[lim(tono(x, y, v, 0.3), 0, 4)], CENIZA);
    }
    for (const pts of [[[10, 92], [22, 96], [30, 94], [44, 99]], [[140, 84], [152, 88], [166, 86], [180, 92]], [[110, 100], [124, 104], [134, 102]]]) {
      for (let i = 0; i + 1 < pts.length; i++) cada(capa().linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1), (x, y) => g.set(x, y, i % 2 ? F[1] : BRASA[3]));
    }
    // árboles muertos y calcinados
    tronco(g, [[6, 78], [8, 60], [4, 46], [10, 32]], [5, 4, 3], CENIZA, { max: 2 });
    tronco(g, [[7, 52], [18, 44]], [2], CENIZA, { max: 2 });
    tronco(g, [[187, 76], [184, 58], [189, 42]], [5, 4], CENIZA, { max: 2 });
    tronco(g, [[185, 56], [174, 50], [170, 42]], [2, 1], CENIZA, { max: 2 });
  }
  function picoAnim(ctx, t) {
    for (let i = 0; i < 30; i++) {
      const v = 0.5 + hash(i, 1) * 0.8, p = ((t / 1000) * v * 0.12 + hash(i, 2)) % 1;
      const x = Math.round(hash(i, 3) * W + Math.sin(p * 9 + i) * 5 + p * 14), y = Math.round(H - p * (H + 6));
      ctx.fillStyle = p < 0.3 ? F[4] : p < 0.6 ? F[3] : p < 0.85 ? F[2] : BRASA[3];
      ctx.fillRect(x % W, y, 1, 1);
    }
    const p = (t / 900) % 1;
    ctx.fillStyle = p < 0.5 ? F[4] : F[3];
    ctx.fillRect(CRATER[0] - 3 + Math.floor(p * 6), CRATER[1] + 1, 2, 1);
  }

  /* ---------- La guarida de Ignárax ---------- */
  const CUEVA_DRAGON = [CENIZA[0], CENIZA[1], BRASA[1], BRASA[2], CENIZA[3], BRASA[3], TE[3]];
  const LAGOS = [[17, 66, 17], [177, 65, 15]];
  const luzGuarida = (x, y) => lim(LAGOS.reduce((v, [lx, ly, r]) => v + Math.max(0, 1 - Math.hypot((x - lx) / (r * 3.4), (y - ly) / 46)) ** 1.4, 0) + Math.max(0, 1 - Math.hypot((x - 98) / 80, (y - 52) / 40)) ** 1.6 * 0.7);
  const haciaAbajo = () => [0, 1, 1];
  const BRILLOS_ORO = [];
  function guarida(g) {
    g.rect(0, 0, W, H, CENIZA[0]);
    const tes = teselas(80, 23, 0, 0, W, 74, 1.5, 15);
    roca(g, tes, CUEVA_DRAGON, (x, y) => 0.9 + luzGuarida(x, y) * 4.6 - Math.max(0, 14 - y) * 0.1, haciaAbajo, { vari: 0.6, relieve: 1.3, bisel: 2.2, oscuro: 1.6 });
    estalactitas(g, [[10, 4, 16], [30, 3, 9], [56, 4, 13], [84, 2, 7], [120, 3, 10], [146, 4, 15], [170, 3, 9], [186, 4, 18]], 0, CUEVA_DRAGON, (x, y) => luzGuarida(x, y + 20), haciaAbajo);
    // lagos de lava a los lados
    for (const [lx, ly, r] of LAGOS) {
      const c = capa().ell(lx, ly + 3, r, 5).quitarRect(0, 0, W, ly - 1);
      cada(c, (x, y) => { const d = Math.hypot((x - lx) / r, (y - ly - 3) / 5); g.set(x, y, d > 0.85 ? BRASA[3] : F[lim(tono(x, y, 3.6 - d * 2.6, 0.6), 0, 4)], F); });
      for (let x = lx - r; x <= lx + r; x++) g.set(x, ly - 1, BRASA[2]);
    }
    // huesos de antiguos visitantes
    costillar(g, 170, 50);
    calavera(g, 30, 66, HU, 1);
    // el tesoro
    tesoro(g);
    // suelo de roca con monedas sueltas y zarpazos
    for (let y = 72; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 2.3 + luzGuarida(x, 66) * 2 - (y - 72) * 0.025 + ((x * 5 + y * 9) % 19 === 0 ? -1 : 0);
      g.set(x, y, CUEVA_DRAGON[lim(tono(x, y, v, 0.3), 0, 6)], CUEVA_DRAGON);
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(i, 21) * W), y = 73 + Math.floor(hash(i, 22) * (6 + (i % 4) * 7));
      g.set(x, y, B[3]).set(x + 1, y, B[2]);
    }
    for (const [x, y] of [[120, 92], [128, 96], [136, 100]]) capa().linea(x, y, x + 14, y - 4, 1).pintar(g, CENIZA, { plano: 0 });
    for (let x = 0; x < W; x++) g.set(x, 72, CUEVA_DRAGON[1]);
  }
  function costillar(g, x, y) {
    capa().curva(x, y + 10, x + 10, y - 2, x + 22, y + 4, 2, 1.5).pintar(g, HU, { relieve: 1, max: 3 });
    for (let k = 0; k < 5; k++) capa().curva(x + 3 + k * 4, y + 6 - k, x + 6 + k * 4, y + 12, x + 3 + k * 3, y + 16, 1, 1).pintar(g, HU, { relieve: 1, max: 2 });
    calavera(g, x + 21, y + 1, HU, -1);
  }
  /* Montaña de monedas de oro con cofres, copas, una corona y una espada clavada. */
  function tesoro(g) {
    BRILLOS_ORO.length = 0;
    const c = capa().ell(98, 74, 66, 36).ell(52, 72, 22, 14).ell(146, 72, 20, 12).quitarRect(0, 72, W, H);
    c.pintar(g, B, { relieve: 10, luz: [-0.3, -0.85, 0.5], sesgo: -0.15 });
    cada(c, (x, y) => {
      const alto = (72 - y) / 36;
      if (y > 62 && umbral(x, y) < (y - 62) / 14) g.set(x, y, B[1], B);
      const h = hash(x, y, 7);
      if (h < 0.12) g.set(x, y, B[Math.min(4, B.indexOf(g.get(x, y)) + 1)], B);
      else if (h < 0.2) g.set(x, y, B[Math.max(0, B.indexOf(g.get(x, y)) - 1)], B);
      if (h > 0.985 && alto > 0.2) BRILLOS_ORO.push([x, y]);
    });
    // objetos
    conBorde(g, BRASA[0], tmp => {
      // cofre abierto a la izquierda
      capa().rect(40, 56, 16, 9).pintar(tmp, M, { relieve: 1.5, max: 3 });
      capa().rect(40, 50, 16, 5).pintar(tmp, M, { relieve: 1.2, max: 2 });
      for (let x = 40; x < 56; x++) { tmp.set(x, 56, B[3], B); tmp.set(x, 60, B[2], B); }
      for (let x = 42; x < 54; x++) tmp.set(x, 55, (x * 7) % 3 ? B[4] : GR[4], B);
      tmp.set(47, 58, B[4], B).set(48, 58, B[3], B);
      // corona en la cima
      capa().rect(94, 34, 9, 3).pintar(tmp, B, { relieve: 1, min: 3 });
      for (const dx of [0, 4, 8]) tmp.set(94 + dx, 33, B[4], B).set(94 + dx, 32, B[3], B);
      tmp.set(98, 35, GR[4], GR).set(95, 35, CRISTAL[3], CRISTAL);
      // espada clavada
      capa().rect(122, 30, 2, 16).pintar(tmp, PL, { relieve: 1, max: 4 });
      capa().rect(118, 29, 10, 2).pintar(tmp, B, { relieve: 1, min: 2 });
      capa().rect(122, 24, 2, 5).pintar(tmp, M, { plano: 2 });
      tmp.set(122, 23, B[4], B).set(123, 23, B[3], B);
      // copa
      capa().rect(140, 50, 6, 3).rect(142, 53, 2, 3).rect(140, 56, 6, 1).pintar(tmp, B, { relieve: 1, min: 2 });
      // escudo apoyado
      capa().ell(70, 55, 5, 6).pintar(tmp, GR, { relieve: 2, max: 3 });
      for (let a = 0; a < 6.283; a += 0.25) tmp.set(Math.round(70 + Math.cos(a) * 5), Math.round(55 + Math.sin(a) * 6), B[3], B);
      tmp.set(70, 55, B[4], B);
    });
    for (const [x, y, col] of [[60, 60, GR[4]], [84, 48, HO[4]], [112, 44, CRISTAL[3]], [130, 58, GR[4]], [76, 66, CRISTAL[3]], [150, 64, HO[4]]]) g.set(x, y, col).set(x + 1, y, HU[4]);
    calavera(g, 104, 48, HU, -1);
    const quedan = BRILLOS_ORO.filter(([x, y]) => B.includes(g.get(x, y)));
    BRILLOS_ORO.length = 0;
    BRILLOS_ORO.push(...quedan);
  }
  function guaridaAnim(ctx, t) {
    if (!BRILLOS_ORO.length) guarida(new Rejilla(W, H));
    // destellos en el oro
    BRILLOS_ORO.forEach(([x, y], i) => {
      const p = ((t / 1000) * 0.5 + hash(i, 31)) % 1;
      if (p > 0.08) return;
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 1);
      if (p > 0.02 && p < 0.06) { ctx.fillStyle = B[4]; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
    });
    // burbujas en la lava
    LAGOS.forEach(([lx, ly, r], k) => {
      for (let i = 0; i < 3; i++) {
        const p = ((t / 1000) * (0.5 + i * 0.2) + hash(i, k, 3)) % 1, x = Math.round(lx - r * 0.6 + hash(i, k, 4) * r * 1.2), y = ly + 2 + (i % 2);
        if (p < 0.6) { ctx.fillStyle = p < 0.3 ? F[3] : F[4]; ctx.fillRect(x, y - (p > 0.3 ? 1 : 0), p > 0.3 ? 2 : 1, 1); }
        else if (p < 0.75) { ctx.fillStyle = F[4]; ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1); }
      }
    });
  }

  return {
    taberna: { base: taberna, anim: tabernaAnim },
    sotano: { base: sotano, anim: sotanoAnim },
    aldea: { base: aldea, anim: aldeaAnim },
    camino: { base: camino, anim: caminoAnim },
    bosque: { base: bosque, anim: bosqueAnim },
    puente: { base: puente, anim: puenteAnim },
    cripta: { base: cripta, anim: criptaAnim },
    mina: { base: mina, anim: minaAnim },
    forja: { base: forja, anim: forjaAnim },
    pico: { base: pico, anim: picoAnim },
    guarida: { base: guarida, anim: guaridaAnim }
  };
})();
