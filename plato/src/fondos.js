/* Diálogos y Dados · escenarios en pixel art (192×108).
   FONDOS[clave].base(g) pinta el fondo fijo en una Rejilla de 192×108 y
   FONDOS[clave].anim(ctx, t), si existe, dibuja encima los detalles animados (t en milisegundos). */
const FONDOS = (() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, azar } = PX;
  const W = 192, H = 108;
  const capa = () => new Capa(W, H);
  const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const M = R.madera, F = R.fuego, B = R.bronce, P = R.piedra, HU = R.hueso, HO = R.hoja, MA = R.mar, SO = R.sombra;
  const TE = R.tela.terracota, NE = R.tela.negro, AZ = R.tela.azul, GR = R.tela.granate, OC = R.tela.ocre;

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
  const elipse = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * 6.2832) * rx, cy + Math.sin((i / n) * 6.2832) * ry]);
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

  /* Lo que cambia entre dos rejillas dentro de una caja, como tiras horizontales agrupadas por color. */
  function diferencias(a, b, x0, y0, x1, y1) {
    const porColor = new Map();
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const c = b.get(x, y);
      if (c === a.get(x, y)) continue;
      let x2 = x + 1, fin = x + 1;
      while (x2 < x1 && b.get(x2, y) === c) { if (a.get(x2, y) !== c) fin = x2 + 1; x2++; }
      if (!porColor.has(c)) porColor.set(c, []);
      porColor.get(c).push(x, y, fin - x);
      x = fin - 1;
    }
    return [...porColor];
  }
  function dibujarTiras(ctx, lista) {
    if (!lista) return;
    for (const [c, t] of lista) { ctx.fillStyle = c; for (let i = 0; i < t.length; i += 3) ctx.fillRect(t[i], t[i + 1], t[i + 2], 1); }
  }
  /* Ánfora de transporte apoyada en su punta (cx, by); ang inclina en radianes. Devuelve la capa y su eje local. */
  function anfora(cx, by, alto, ang = 0, panza = 0.22) {
    const c = capa(), co = Math.cos(ang), si = Math.sin(ang);
    const rot = (x, y) => [cx + x * co - y * si, by + x * si + y * co];
    const P_ = pts => c.poly(pts.map(([x, y]) => rot(x, y)));
    const L_ = (x0, y0, x1, y1) => { const [a, b] = rot(x0, y0), [d, e] = rot(x1, y1); c.linea(a, b, d, e, 1); };
    const rx = alto * panza, cy = -alto * 0.56, ry = alto * 0.27;
    P_(elipse(0, cy, rx, ry, 22));
    P_([[-rx * 0.86, cy + ry * 0.45], [rx * 0.86, cy + ry * 0.45], [1.1, -0.5], [-1.1, -0.5]]);
    P_([[-1.6, -alto + 1], [1.6, -alto + 1], [1.6, cy - ry + 1], [-1.6, cy - ry + 1]]);
    P_([[-2.5, -alto - 0.5], [2.5, -alto - 0.5], [2.5, -alto + 1.5], [-2.5, -alto + 1.5]]);
    for (const s of [-1, 1]) { L_(s * 1.5, -alto + 2.5, s * (rx * 0.62 + 1), -alto + 3.5); L_(s * (rx * 0.62 + 1), -alto + 3.5, s * rx * 0.62, cy - ry * 0.55); }
    const local = (x, y) => { const dx = x - cx, dy = y - by; return [dx * co + dy * si, -dx * si + dy * co]; };
    return { c, local };
  }
  function pintarAnfora(g, a, ram, luz, op = {}) {
    a.c.pintar(g, ram, { relieve: 3, luz, ...op });
    const alto = op.alto || 24;
    cada(a.c, (x, y) => {
      const [, ly] = a.local(x, y);
      if (ly > -alto * 0.79 && ly < -alto * 0.72) g.set(x, y, NE[op.max !== undefined ? 1 : 2], NE);
      if (ly > -alto * 0.3 && ly < -alto * 0.26) g.set(x, y, ram[Math.max(0, (op.max ?? 3) - 2)], ram);
    });
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
  /* Llama pequeña de lámpara de aceite en (x, y) = punta de la mecha. */
  function llamita(ctx, x, y, t, fase = 0) {
    const a = Math.sin(t / 83 + fase) + Math.sin(t / 137 + fase * 2);
    const alto = a > 0.9 ? 4 : a < -0.9 ? 2 : 3;
    const lado = Math.sin(t / 211 + fase) > 0.5 ? 1 : 0;
    ctx.fillStyle = F[2]; ctx.fillRect(x - 1, y - 1, 3, 2);
    ctx.fillStyle = F[3]; ctx.fillRect(x, y - alto + 1, 1, alto); ctx.fillRect(x + lado, y - alto + 1, 1, 1);
    ctx.fillStyle = F[4]; ctx.fillRect(x, y - 1, 1, 2);
  }

  /* ---------- La taberna de Céfalo ---------- */
  function taberna(g) {
    const PM = R.piel.morena;
    const luz = (x, y) => {
      const f = 1 - Math.hypot((x - 12) / 125, (y - 60) / 80);
      const l = 1 - Math.hypot((x - 72) / 46, (y - 27) / 32);
      return lim(Math.max(f, 0) ** 1.25 + Math.max(l, 0) ** 1.6 * 0.55);
    };
    g.rect(0, 0, W, H, M[0]);
    // techo: tablas y viguetas
    rellenar(g, 0, 0, W, 9, M, (x, y) => (y === 3 || y === 6 ? 0.2 : 1) + luz(x, y) * 0.6, 0.3);
    for (let x = 10; x < W; x += 24) {
      capa().poly([[x - 3, 0], [x + 3, 0], [x + 2, 9], [x - 2, 9]]).pintar(g, M, { relieve: 1.5, luz: [-0.4, 0.6, 0.6], max: 2 });
    }
    // pared de revoque
    rellenar(g, 0, 13, W, 39, PM, (x, y) => 0.6 + luz(x, y) * 3 - (y < 17 ? 0.4 : 0), 0.18);
    escudo(g, 56, 29);
    // friso inferior de tablas
    rellenar(g, 0, 50, W, 22, M, (x, y) => {
      let v = 0.7 + luz(x, y) * 2.4;
      if (y <= 51) v += 0.9;
      else if (y === 52) v -= 0.6;
      else if (x % 7 === 0) v -= 0.9;
      else if (x % 7 === 1) v += 0.3;
      return v - (y > 66 ? 0.5 : 0);
    }, 0.1);
    // postes
    for (const [px, sesgo] of [[38, 0.12], [103, -0.05], [158, -0.2]]) {
      const c = capa().rect(px, 9, 6, 63);
      c.pintar(g, M, { relieve: 2, luz: [-0.8, -0.3, 0.6], sesgo, separar: 1 });
    }
    // viga maestra
    const viga = capa().rect(0, 9, W, 5);
    viga.pintar(g, M, { relieve: 2, luz: [-0.3, 0.7, 0.6], sesgo: -0.1, max: 3 });
    for (let x = 0; x < W; x++) g.set(x, 14, M[0]);

    hogar(g, luz);
    ventana(g);
    estante(g);
    mesa(g);
    // ánforas junto a la pared derecha
    conBorde(g, M[0], tmp => {
      pintarAnfora(tmp, anfora(173, 71, 25, 0.1), TE, [-0.7, -0.6, 0.6], { alto: 25, sesgo: 0.05 });
      pintarAnfora(tmp, anfora(186, 71, 22, -0.18, 0.25), TE, [-0.7, -0.6, 0.6], { alto: 22, sesgo: -0.05 });
    });
    manojo(g, 84, 18, 11, HO, R.tela.violeta);
    manojo(g, 91, 18, 9, R.tela.oliva, null);
    manojo(g, 97, 18, 12, HO, HU);
    for (const x of [84, 91, 97]) for (let y = 15; y < 18; y++) g.set(x, y, HU[1]);
    ajos(g, 127, 18);
    lampara(g, 72, 24);
    suelo(g, luz);
  }

  /* Escudo de bronce colgado (Céfalo fabricaba escudos), con un trisquel de Siracusa. */
  function escudo(g, cx, cy) {
    for (let y = 15; y < cy - 9; y++) g.set(cx, y, HU[0]);
    conBorde(g, M[0], tmp => {
      capa().ell(cx, cy, 9, 9).pintar(tmp, B, { relieve: 3, sesgo: -0.05 });
      capa().ell(cx, cy, 7, 7).pintar(tmp, B, { relieve: 6, max: 3, sesgo: -0.15 });
      const tri = capa();
      for (let k = 0; k < 3; k++) {
        const a = k * 2.094 - 1.2, b = a + 0.9;
        tri.curva(cx, cy, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, cx + Math.cos(b) * 5.2, cy + Math.sin(b) * 5.2, 1.6, 1);
      }
      tri.ell(cx, cy, 1.2).pintar(tmp, NE, { plano: 1 });
    });
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

  function ajos(g, x, y) {
    for (let j = 15; j < y; j++) g.set(x, j, HU[1]);
    conBorde(g, M[1], tmp => {
      for (let k = 0; k < 5; k++) {
        const bx = x + (k % 2 ? 1.4 : -1.4), by = y + 1.5 + k * 2.6;
        capa().ell(bx, by, 1.7, 1.5).pintar(tmp, HU, { relieve: 1.5, max: 3, sesgo: -0.1 });
        tmp.set(Math.round(bx), Math.round(by) - 2, HU[2], HU);
      }
    });
  }

  function hogar(g, luz) {
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
    conBorde(g, M[0], tmp => {
      capa().ell(8, 34, 2.2, 2.4).rect(7, 30, 3, 2).pintar(tmp, TE, { relieve: 2, max: 3 });
      capa().ell(22, 34.5, 3, 2).rect(20, 31, 5, 2).pintar(tmp, NE, { relieve: 2 });
      tmp.set(21, 34, TE[3], TE).set(22, 34, TE[3], TE).set(23, 34, TE[3], TE);
    });
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
    // mástil lejano
    for (let y = 22; y < y0 + h - 3; y++) g.set(175, y, SO[2]);
    for (let x = 172; x < 179; x++) g.set(x, 25, SO[2]);
    // contraventanas
    for (const sx of [x0 - 6, x0 + w + 2]) {
      const c = capa().rect(sx, y0 - 1, 4, h + 2);
      c.pintar(g, M, { relieve: 1, sesgo: -0.3, separar: 1 });
      for (let y = y0 + 2; y < y0 + h; y += 5) g.set(sx + 1, y, M[0]).set(sx + 2, y, M[0]);
    }
    for (let x = x0 - 2; x < x0 + w + 2; x++) g.set(x, y0 + h + 2, M[3]);
  }

  function estante(g) {
    const y = 34;
    capa().rect(109, y, 48, 2).pintar(g, M, { relieve: 1, separar: 1 });
    for (let x = 109; x < 157; x++) g.set(x, y, M[3]);
    for (const bx of [113, 152]) { g.set(bx, y + 2, M[1]).set(bx, y + 3, M[1]).set(bx + 1, y + 2, M[1]); }
    conBorde(g, M[0], tmp => {
      // platos de pie
      capa().ell(115, y - 5, 4.5).pintar(tmp, TE, { relieve: 2, max: 3 });
      capa().ell(115, y - 5, 2.5).pintar(tmp, NE, { relieve: 1, min: 1 });
      tmp.set(115, y - 5, TE[2], TE);
      // jarra (enócoe)
      capa().ell(125, y - 4, 3.2, 3.6).rect(124, y - 10, 3, 4).rect(123, y - 11, 4, 1).pintar(tmp, TE, { relieve: 2.5, max: 3 });
      capa().curva(127, y - 9, 130, y - 8, 128, y - 4, 1).pintar(tmp, TE, { plano: 2 });
      // copas apiladas
      for (let k = 0; k < 3; k++) {
        capa().rect(133, y - 2 - k * 2, 9, 2).off(133, y - 1 - k * 2).off(141, y - 1 - k * 2).pintar(tmp, NE, { relieve: 1, min: 1 });
        tmp.set(137, y - 1 - k * 2, TE[2], TE);
      }
      // lécito
      capa().ell(147, y - 5, 2.2, 4).rect(146, y - 11, 2, 2).rect(145, y - 12, 4, 1).pintar(tmp, NE, { relieve: 2 });
      tmp.set(146, y - 5, TE[3], TE).set(147, y - 6, TE[3], TE).set(148, y - 4, TE[2], TE);
      // cuenco
      capa().ell(153, y - 2, 3.5, 2).quitarRect(0, 0, W, y - 2).pintar(tmp, B, { relieve: 1.5, max: 3 });
    });
  }

  function mesa(g) {
    const y = 57;
    // patas y tablero
    capa().rect(114, y + 2, 2, 13).rect(147, y + 2, 2, 13).pintar(g, M, { relieve: 1, max: 2, separar: 1 });
    capa().rect(110, y, 43, 3).pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1 });
    for (let x = 110; x < 153; x++) g.set(x, y, M[3]);
    conBorde(g, M[0], tmp => {
      capa().ell(119, y - 4, 3, 3.6).rect(118, y - 10, 3, 3).rect(117, y - 11, 5, 1).pintar(tmp, TE, { relieve: 2, max: 3, sesgo: -0.1 });
      capa().curva(117, y - 9, 114, y - 7, 117, y - 4, 1).pintar(tmp, TE, { plano: 1 });
      capa().rect(126, y - 2, 7, 1).rect(128, y - 1, 3, 1).pintar(tmp, NE, { relieve: 1, min: 1 });
      tmp.set(129, y - 2, TE[2], TE);
      capa().ell(139, y - 1.5, 4, 2).quitarRect(0, 0, W, y - 2).pintar(tmp, M, { relieve: 1.5, sesgo: -0.1 });
      for (const [x, yy] of [[137, y - 3], [139, y - 3], [141, y - 3], [138, y - 4], [140, y - 4]]) tmp.set(x, yy, HO[1 + ((x + yy) & 1)], HO);
      capa().ell(147, y - 2, 3.5, 2.2).pintar(tmp, OC, { relieve: 2, max: 3, sesgo: -0.1 });
      tmp.set(146, y - 3, OC[1], OC).set(148, y - 3, OC[1], OC);
    });
  }

  /* Lámpara de bronce colgada de tres cadenas; la llama queda en (x + 6, y - 2). */
  function lampara(g, x, y) {
    for (let j = 15; j <= y - 7; j++) g.set(x, j, j % 2 ? R.hierro[2] : B[1]);
    for (let j = 0; j < 5; j++) { g.set(x - 1 - j * 0.6, y - 6 + j, B[1]); g.set(x + 1 + j * 0.6, y - 6 + j, B[1]); }
    conBorde(g, M[0], tmp => {
      const c = capa().ell(x, y, 3.6, 1.6).poly([[x + 2, y - 1.4], [x + 6.5, y - 1.2], [x + 6.5, y + 0.5], [x + 2, y + 1.4]]);
      c.pintar(tmp, B, { relieve: 1.5, luz: [-0.3, 0.7, 0.6], max: 3 });
      tmp.set(x, y - 1, B[0], B).set(x - 1, y - 1, B[1], B);
      tmp.set(x - 4, y + 1, B[2], B).set(x, y + 2, B[2], B);
    });
    g.set(x + 6, y - 2, F[3]).set(x + 6, y - 3, F[4]).set(x + 6, y - 4, F[3]);
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

  function tabernaAnim(ctx, t) {
    lengua(ctx, 9, 66, 9, 11, t, 0.3);
    lengua(ctx, 17, 66, 8, 10, t, 2.1);
    lengua(ctx, 13, 66, 10, 13, t, 4.4);
    chispas(ctx, 13, 60, 5, 20, t, 0, [5, 42, 22, 58]);
    llamita(ctx, 78, 22, t, 1.7);
  }

  /* ---------- La caverna de Platón ---------- */
  const ROCA = [SO[0], SO[1], SO[2], M[0], M[1], M[2], M[3], TE[3]];
  const FUEGO_CUEVA = [22, 50];
  const cueva = { fondo: null, base: null, final: null, sombras: null };
  const haciaFuego = (x, y) => {
    const dx = FUEGO_CUEVA[0] - x, dy = FUEGO_CUEVA[1] - y, d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d, 1];
  };
  const brilloCueva = (x, y) => Math.max(0, 1 - Math.hypot((x - FUEGO_CUEVA[0]) / 190, (y - FUEGO_CUEVA[1]) / 85)) ** 1.15;

  /* Siluetas que proyectan los titiriteros: caballo, guerrero y ánfora, cada una con su palo. */
  const SILUETAS = [
    { caja: [44, 14, 86, 58], forma(ox, oy) {
      const c = capa(), x = 46 + ox, y = 17 + oy;
      c.ell(x + 17, y + 12, 10, 5);
      c.poly([[x + 22, y + 8], [x + 28, y + 1], [x + 31, y], [x + 32, y + 4], [x + 28, y + 12], [x + 23, y + 14]]);
      c.poly([[x + 29, y - 1], [x + 34, y + 1], [x + 38, y + 5], [x + 37, y + 7.5], [x + 34, y + 6.5], [x + 30, y + 4]]);
      c.on(x + 30, y - 2).on(x + 31, y - 3).on(x + 29, y - 2);
      c.curva(x + 8, y + 9, x + 2, y + 11, x + 3, y + 21, 2.4, 1.2);
      c.linea(x + 24, y + 15, x + 28, y + 19, 2).linea(x + 28, y + 19, x + 28, y + 24, 2);
      c.linea(x + 21, y + 16, x + 20, y + 25, 2);
      c.linea(x + 11, y + 15, x + 8, y + 20, 2).linea(x + 8, y + 20, x + 9, y + 25, 2);
      c.linea(x + 14, y + 16, x + 16, y + 21, 2).linea(x + 16, y + 21, x + 15, y + 25, 2);
      c.linea(x + 18, y + 16, x + 18, y + 38, 1);
      c.ell(x + 18, y + 38, 1.8, 1.5);
      return c;
    } },
    { caja: [88, 7, 130, 64], forma(ox, oy) {
      const c = capa(), x = 90 + ox, y = 15 + oy;
      c.ell(x + 14, y + 8, 3, 3.4);
      c.curva(x + 10, y + 5, x + 12, y - 4, x + 20, y + 3, 3, 1.8);
      c.curva(x + 11, y + 4, x + 6, y + 5, x + 4, y + 12, 2.2, 1);
      c.poly([[x + 11, y + 11], [x + 17, y + 11], [x + 18, y + 24], [x + 10, y + 24]]);
      c.linea(x + 12, y + 12, x + 8, y + 6, 2).linea(x + 8, y + 6, x + 9, y + 1, 2);
      c.linea(x + 1, y, x + 31, y + 3, 1);
      c.poly([[x + 30, y + 1], [x + 35, y + 3.2], [x + 30, y + 5]]);
      c.ell(x + 21, y + 17, 7.5, 8);
      c.linea(x + 15, y + 24, x + 21, y + 30, 2.6).linea(x + 21, y + 30, x + 22, y + 37, 2.2);
      c.linea(x + 12, y + 24, x + 7, y + 31, 2.6).linea(x + 7, y + 31, x + 4, y + 37, 2.2);
      c.rect(x + 21, y + 37, 3, 1).rect(x + 2, y + 37, 3, 1);
      c.linea(x + 13, y + 38, x + 13, y + 46, 1);
      c.ell(x + 13, y + 46, 1.8, 1.5);
      return c;
    } },
    { caja: [134, 18, 158, 58], forma(ox, oy) {
      const c = capa(), x = 146 + ox, y = 21 + oy;
      c.ell(x, y + 12, 6.5, 7);
      c.poly([[x - 5.5, y + 14], [x + 5.5, y + 14], [x + 2, y + 22], [x - 2, y + 22]]);
      c.rect(x - 3, y + 22, 7, 2);
      c.rect(x - 1.5, y + 1, 4, 6);
      c.rect(x - 3, y, 7, 2);
      for (const s of [-1, 1]) c.linea(x + s * 2, y + 2, x + s * 6, y + 3, 1).linea(x + s * 6, y + 3, x + s * 5, y + 7, 1);
      c.linea(x, y + 24, x, y + 34, 1);
      c.ell(x, y + 34, 1.8, 1.5);
      return c;
    } }
  ];
  /* La sombra oscurece la roca que tapa, sin borrar su textura. */
  function pintarSilueta(g, sil, ox, oy) {
    cada(sil.forma(ox, oy), (x, y) => {
      const k = ROCA.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, ROCA[Math.max(1, k - 4)], ROCA);
    });
  }

  function caverna(g) {
    g.rect(0, 0, W, H, SO[0]);
    // pared del fondo, iluminada desde abajo a la izquierda
    const tes = teselas(90, 5, 0, 0, W, 74, 1.6, 16);
    roca(g, tes, ROCA, (x, y) => 0.9 + brilloCueva(x, y) * 6 - Math.max(0, 16 - y) * 0.22, haciaFuego, { vari: 0.6, relieve: 1.5, bisel: 2.4, oscuro: 1.8 });
    // techo y estalactitas
    estalactitas(g);
    cueva.fondo = g.copia();
    for (const s of SILUETAS) pintarSilueta(g, s, 0, 0);
    cueva.base = g.copia();
    cueva.sombras = null;
    // salida lejana, a la derecha
    boca(g);
    // parapeto, a contraluz
    sillares(g, 0, 57, 70, [7, 8], ROCA, (x, y) => 2.3 - (y - 57) * 0.05 + x * 0.004, { sem: 4, ancho: 13, bisel: 0.8, junta: 1.5, vari: 0.7 });
    for (let x = 0; x < 70; x++) if (x % 9 !== 4) g.set(x, 57, x < 44 ? F[1] : M[2], ROCA);
    for (let x = 0; x < 70; x++) if (x % 9 !== 4 && x < 50 && (x * 7) % 3) g.set(x, 58, M[1], ROCA);
    for (let y = 57; y < 72; y++) g.set(70, y, ROCA[1]);
    // suelo de roca
    const ts = teselas(70, 13, 0, 72, W, 36, 2.6, 14);
    roca(g, ts, ROCA, (x, y) => {
      const sombraPar = x < 70 ? lim((74 - x) / 30) * 0.9 : 0;
      return 3 + brilloCueva(x, y) * 2.6 - sombraPar * 0.8 - (y - 72) * 0.012;
    }, haciaFuego, { vari: 0.5, relieve: 0.9, bisel: 1.6, s: 0.25, oscuro: 1.1 });
    for (let x = 0; x < W; x++) { g.set(x, 72, ROCA[1]); if (x >= 70) g.set(x, 73, ROCA[2]); }
    cadena(g, [[0, 99], [14, 103], [30, 104], [46, 102], [58, 105]], 3);
    grillete(g, 60, 104);
    cadena(g, [[126, 86], [138, 92], [150, 97], [160, 98], [172, 104]], 7);
    argolla(g, 124, 85);
    cueva.final = g.copia();
  }

  /* Un túnel que sube hacia la luz del día, al fondo a la derecha. */
  function boca(g) {
    const c = capa().poly([[168, 72], [170, 62], [168, 52], [171, 43], [174, 36], [179, 31], [185, 32], [189, 38], [191, 47], [192, 58], [192, 72]]);
    cada(c, (x, y) => g.set(x, y, SO[0]));
    capa().poly([[175, 66], [176, 55], [178, 45], [182, 39], [186, 43], [188, 52], [188, 66]]).pintar(g, SO, { plano: 1 });
    capa().poly([[179, 58], [180, 49], [183, 44], [186, 48], [186, 58]]).pintar(g, SO, { plano: 2 });
    capa().poly([[181, 54], [182, 49], [184, 47], [185, 50], [185, 54]]).pintar(g, MA, { plano: 1 });
    g.set(183, 48, MA[2]).set(184, 48, MA[2]).set(183, 49, MA[2]).set(184, 47, MA[3]);
    for (let x = 179; x < 187; x++) if (x & 1) g.set(x, 58, SO[3]);
    cada(c, (x, y) => { if (!c.tiene(x - 1, y) || !c.tiene(x, y - 1)) g.set(x - 1, y, ROCA[3]); });
  }

  function estalactitas(g) {
    rellenar(g, 0, 0, W, 10, ROCA, (x, y) => 0.6 + (y > 6 ? 0.5 : 0) + brilloCueva(x, y) * 1.2, 0.3);
    const lista = [[4, 5, 22], [13, 3, 13], [32, 4, 24], [41, 3, 12], [56, 3, 8], [74, 2, 7], [86, 3, 6], [131, 3, 8], [162, 5, 28], [172, 3, 12], [186, 4, 18]];
    for (const [x, ancho, largo] of lista) {
      const c = capa().poly([[x - ancho, 5], [x + ancho, 5], [x + ancho * 0.4, 5 + largo * 0.6], [x + 0.6, 5 + largo], [x - 0.4, 5 + largo], [x - ancho * 0.5, 5 + largo * 0.5]]);
      const tes = teselas(3, x, x - ancho, 5, ancho * 2 + 1, largo + 1, 1);
      roca(g, tes, ROCA, (px, py) => 0.6 + brilloCueva(px, py) * 3.2, haciaFuego, { masc: c, vari: 0.4, bisel: 2, relieve: 1.2, s: 0.3 });
      cada(c, (px, py) => {
        if (!c.tiene(px + 1, py)) g.set(px, py, ROCA[1]);
        else if (!c.tiene(px - 1, py) || !c.tiene(px, py + 1)) g.set(px, py, ROCA[lim(Math.round(1.5 + brilloCueva(px, py) * 5.5), 2, 6)]);
      });
    }
  }

  function cadena(g, pts, sem) {
    const az = azar(sem), H_ = R.hierro;
    let n = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], pasos = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2.5));
      for (let s = 0; s < pasos; s++, n++) {
        const x = Math.round(x0 + (x1 - x0) * s / pasos), y = Math.round(y0 + (y1 - y0) * s / pasos) + (az() < 0.3 ? 1 : 0);
        if (n % 2 === 0) {
          g.set(x - 1, y, H_[1]).set(x, y - 1, H_[3]).set(x + 1, y - 1, H_[2]).set(x + 2, y, H_[1]).set(x, y + 1, H_[0]).set(x + 1, y + 1, H_[0]);
          g.set(x, y, ROCA[1]).set(x + 1, y, ROCA[1]);
        } else {
          g.set(x, y, H_[2]).set(x + 1, y, H_[1]).set(x, y + 1, H_[0]);
        }
      }
    }
  }
  function grillete(g, x, y) {
    const H_ = R.hierro;
    const c = capa().ell(x + 3, y - 1, 3.4, 2.4);
    c.quitarEll(x + 3, y - 1, 1.8, 1);
    c.pintar(g, H_, { relieve: 1, luz: [-0.7, -0.4, 0.6], max: 3, separar: 1 });
  }
  function argolla(g, x, y) {
    const H_ = R.hierro;
    capa().rect(x - 1, y - 2, 3, 4).pintar(g, P, { relieve: 1, separar: 1 });
    const c = capa().ell(x + 1, y + 1, 2.6, 2.6);
    c.quitarEll(x + 1, y + 1, 1.2, 1.2);
    c.pintar(g, H_, { relieve: 1, max: 3, separar: 1 });
  }

  /* Diferencias de una silueta desplazada, calculadas la primera vez que hacen falta. */
  function sombraMovida(i, dx, dy) {
    const m = cueva.sombras[i], k = dx + "," + dy;
    if (!m[k]) {
      const s = SILUETAS[i], v = cueva.fondo.copia();
      for (const o of SILUETAS) pintarSilueta(v, o, o === s ? dx : 0, o === s ? dy : 0);
      // lo que se pintó después de las sombras (parapeto, suelo) queda delante y no se toca
      for (let j = 0; j < v.c.length; j++) if (cueva.final.c[j] !== cueva.base.c[j]) v.c[j] = cueva.base.c[j];
      const [x0, y0, x1, y1] = s.caja;
      m[k] = diferencias(cueva.base, v, x0 - 2, y0 - 2, x1 + 2, y1 + 2);
    }
    return m[k];
  }
  function cavernaAnim(ctx, t) {
    if (!cueva.fondo) caverna(new Rejilla(W, H));
    if (!cueva.sombras) cueva.sombras = SILUETAS.map(() => ({}));
    // los titiriteros mueven sus figuras por turnos: el caballo trota, el guerrero se balancea, el ánfora cabecea
    const fase = (t % 4200) / 4200;
    const caballo = fase < 0.5 && Math.floor(t / 330) % 2 ? -1 : 0;
    const guerrero = fase >= 0.5 ? (fase < 0.62 || fase > 0.88 ? 0 : fase < 0.75 ? 1 : -1) : 0;
    const anfora = Math.sin(t / 900) > 0.55 ? -1 : 0;
    if (caballo) dibujarTiras(ctx, sombraMovida(0, 0, caballo));
    if (guerrero) dibujarTiras(ctx, sombraMovida(1, guerrero, 0));
    if (anfora) dibujarTiras(ctx, sombraMovida(2, 0, anfora));
    lengua(ctx, 13, 56, 10, 12, t, 0.5);
    lengua(ctx, 29, 56, 9, 11, t, 3.3);
    lengua(ctx, 21, 56, 12, 17, t, 1.9);
    chispas(ctx, 21, 46, 5, 30, t);
  }

  /* ---------- La subida hacia la boca de la caverna ---------- */
  const DIA = [SO[0], SO[1], SO[2], P[1], P[2], P[3], P[4], HU[2], HU[3], HU[4]];
  const BOCA = [176, 9];
  const RAYOS = [[0.47, 0.045, 1], [0.62, 0.07, 0.8], [0.8, 0.04, 1], [0.97, 0.06, 0.7], [1.13, 0.035, 0.6]];
  /* Intensidad de los rayos de luz que entran por la boca (0 … 1). */
  function rayo(x, y) {
    const dx = BOCA[0] - x, dy = y - BOCA[1], r = Math.hypot(dx, dy);
    if (r < 8) return 1;
    const a = Math.atan2(dy, dx);
    let v = 0;
    for (const [ai, wi, k] of RAYOS) v += Math.exp(-(((a - ai) / wi) ** 2)) * k;
    return lim(v) * Math.max(0, 1 - r / 250);
  }
  const brilloBoca = (x, y) => Math.max(0, 1 - Math.hypot((x - BOCA[0]) / 130, (y - BOCA[1]) / 100)) ** 1.6;
  const haciaBoca = (x, y) => { const dx = BOCA[0] - x, dy = BOCA[1] - y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d, 1]; };
  const ESCALONES = Array.from({ length: 8 }, (_, i) => [104 + i * 9 + (i % 2), 65 - i * 6]);
  const techoSalida = x => 40 - x * 0.3 - Math.sin(x * 0.21) * 2.5 - Math.sin(x * 0.07 + 1) * 3;

  function salida(g) {
    g.rect(0, 0, W, H, SO[0]);
    const pared = teselas(80, 21, 0, 0, W, 74, 1.3, 14);
    roca(g, pared, DIA, (x, y) => 2.5 + brilloBoca(x, y) * 3.4 + rayo(x, y) * 2.8, haciaBoca, { vari: 0.6, relieve: 1.3, bisel: 2.2, s: 0.35, oscuro: 1.3 });
    // escalones tallados que suben hacia la luz: huella clara, tabica en sombra
    ESCALONES.forEach(([x, y], i) => {
      for (let py = y; py < y + 7 && py < 72; py++) for (let px = x; px < W; px++) {
        let t;
        if (py === y) t = 5.6 + brilloBoca(px, py) * 3.2 + rayo(px, py);
        else if (py === y + 1) t = 4.4 + brilloBoca(px, py) * 3;
        else t = 2.4 + brilloBoca(px, py) * 2.4 + rayo(px, py) * 1.6 - (py - y) * 0.12;
        if (px <= x + 1 && py > y) t -= 1.2;
        if (py > y + 1 && ((px * 7 + i * 13) % 19 === 0 || (px * 3 + py * 5 + i) % 29 === 0)) t -= 1;
        g.set(px, py, DIA[lim(tono(px, py, t, 0.4), 0, 9)], DIA);
      }
      g.set(x, y, DIA[lim(Math.round(7 + brilloBoca(x, y) * 2), 0, 9)]);
    });
    // techo que baja en diagonal, a contraluz
    const techo = capa();
    for (let x = 0; x < W; x++) for (let y = 0; y < techoSalida(x); y++) techo.on(x, y);
    const tt = teselas(40, 31, 0, 0, 160, 48, 1.2, 9);
    roca(g, tt, DIA, (x, y) => 0.8 + brilloBoca(x, y) * 2.4 + (techoSalida(x) - y < 2.5 ? 2.8 + brilloBoca(x, y) * 2 : 0), haciaBoca, { masc: techo, vari: 0.5, relieve: 1.2, bisel: 2, s: 0.3 });
    for (const [x, largo] of [[14, 9], [27, 5], [46, 8], [63, 4], [79, 7], [104, 5], [121, 6]]) {
      const y0 = Math.floor(techoSalida(x)) - 1;
      for (let j = 0; j < largo; j++) {
        const w = Math.max(0, Math.round((largo - j) / largo * 2));
        for (let k = -w; k <= w; k++) g.set(x + k, y0 + j, k === w ? DIA[lim(Math.round(3 + brilloBoca(x, y0) * 4), 3, 7)] : DIA[1]);
      }
    }
    // la boca deslumbrante
    const boca = capa().poly([[150, 0], [192, 0], [192, 23], [168, 23], [163, 16], [158, 9], [154, 4]]);
    cada(boca, (x, y) => {
      const d = Math.hypot(x - 182, y - 4);
      g.set(x, y, d < 11 ? HU[4] : tono(x, y, 1.6 - (d - 11) / 7, 1) > 0 ? HU[4] : B[4]);
    });
    // rama de olivo que asoma por arriba, a contraluz
    const rama = capa().curva(192, 3, 182, 1, 171, 6, 1.6, 1);
    for (const [x, y, a] of [[188, 4, 1], [185, 1, -1], [181, 4, 1], [178, 2, -1], [175, 6, 1], [172, 4, -1], [170, 8, 1]]) rama.linea(x, y, x - 2, y + a * 2, 1).on(x - 3, y + a * 2.5);
    rama.pintar(g, HO, { plano: 2 });
    cada(rama, (x, y) => { if (!rama.tiene(x, y - 1)) g.set(x, y, HO[3]); });
    // hierbas a contraluz en el borde de la boca
    for (const [x, y, alto] of [[156, 6, 4], [160, 12, 5], [164, 17, 3], [169, 22, 4], [176, 22, 3], [183, 22, 5], [189, 22, 3]]) {
      for (let j = 0; j < alto; j++) { g.set(x + (j > 1 ? 1 : 0), y - j, HO[1]); if (j === alto - 1) g.set(x + 2, y - j + 1, HO[2]); }
      g.set(x - 1, y - 1, HO[2]);
    }
    cada(boca, (x, y) => { if (!boca.tiene(x - 1, y) || !boca.tiene(x, y + 1)) g.set(x, y, HU[3]); });
    // haces de luz en el aire
    for (let y = 0; y < 72; y++) for (let x = 0; x < W; x++) {
      const k = DIA.indexOf(g.get(x, y));
      if (k < 0) continue;
      const r = rayo(x, y) * (techoSalida(x) > y ? 0.5 : 1);
      if (r < 0.1) continue;
      g.set(x, y, DIA[Math.min(9, k + tono(x, y, r * 2.2, 1))], DIA);
    }
    // rellano de roca donde están los personajes
    const ts = teselas(60, 41, 0, 72, W, 36, 2.6, 12);
    roca(g, ts, DIA, (x, y) => 2.4 + rayo(x, y) * 2.8 + brilloBoca(x, y) * 1.5 - (y - 72) * 0.012 - Math.max(0, 30 - x) * 0.02, haciaBoca, { vari: 0.5, relieve: 0.9, bisel: 1.5, s: 0.3, oscuro: 1 });
    for (let x = 0; x < W; x++) g.set(x, 72, x >= ESCALONES[0][0] ? DIA[2] : DIA[1]);
    for (let y = 73; y < H; y++) for (let x = 0; x < W; x++) {
      const k = DIA.indexOf(g.get(x, y)), r = rayo(x, y) * (1.1 - (y - 72) / 60);
      if (k >= 0 && r > 0.1) g.set(x, y, DIA[Math.min(9, k + tono(x, y, r * 1.6, 1))], DIA);
    }
    const az = azar(77);
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(az() * W), y = 76 + Math.floor(az() * 30);
      const t = Math.round(3.6 + rayo(x, y) * 3);
      capa().ell(x, y, 1.5 + az(), 1).pintar(g, DIA.slice(Math.max(0, t - 3), t + 1), { relieve: 1.5, luz: [0.6, -0.6, 0.6] });
      g.set(x - 1, y + 1, DIA[1]).set(x, y + 1, DIA[1]).set(x + 1, y + 1, DIA[1]);
    }
  }

  /* Motas de polvo que flotan dentro de los rayos. */
  const MOTAS = (() => {
    const az = azar(99), l = [];
    while (l.length < 30) {
      const x = 20 + az() * 160, y = 10 + az() * 92;
      if (rayo(x, y) > 0.28) l.push([x, y, az() * 6.28, 0.6 + az() * 0.8]);
    }
    return l;
  })();
  function salidaAnim(ctx, t) {
    for (const [x0, y0, f, v] of MOTAS) {
      const fase = (t / 1000) * v + f;
      if (Math.sin(fase * 0.7) < -0.55) continue;
      const x = Math.round(x0 + Math.sin(fase) * 4), y = Math.round(y0 + Math.sin(fase * 0.6 + 1) * 3 - ((t / 140) * v) % 6);
      const k = rayo(x, y);
      if (k < 0.15) continue;
      ctx.fillStyle = k > 0.5 ? HU[4] : HU[3];
      ctx.fillRect(x, y, 1, 1);
    }
  }

  /* ---------- La superficie, al amanecer ---------- */
  const PC = R.piel.clara, PV = R.piel.verde, VI = R.tela.violeta;
  const ALBA = [AZ[3], MA[4], AZ[4], HU[3], PC[3], PC[4]];
  const LEJOS = [VI[2], SO[4], VI[3], R.piel.violeta[4]];
  const SOL = [58, 45];
  const halo = (x, y, r) => Math.max(0, 1 - Math.hypot(x - SOL[0], (y - SOL[1]) * 1.3) / r);
  const colinas = x => 47 + Math.sin(x * 0.045 + 0.6) * 3.5 + Math.sin(x * 0.11 + 2) * 1.6;

  /* Copa de olivo: varias masas redondeadas de hojas plateadas, luz desde el sol bajo a la izquierda. */
  function copaOlivo(g, masas, sem) {
    const c = capa();
    for (const [x, y, rx, ry] of masas) c.ell(x, y, rx, ry);
    const az = azar(sem);
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) && az() < 0.35) c.on(x, y - 1); });
    c.pintar(g, PV, { relieve: 4, luz: [-0.8, -0.35, 0.6], sesgo: -0.05 });
    for (const [x, y, rx, ry] of masas) for (let i = 0; i < rx * ry * 0.28; i++) {
      const px = Math.round(x + (az() - 0.5) * rx * 1.6), py = Math.round(y + (az() - 0.5) * ry * 1.6);
      if (!c.tiene(px, py) || !c.tiene(px + 1, py)) continue;
      const k = PV.indexOf(g.get(px, py));
      if (k >= 2) g.set(px, py, k >= 3 ? HU[2] : PV[k + 1], PV).set(px + 1, py, PV[Math.max(0, k - 1)], PV);
      else g.set(px, py, PV[0], PV);
    }
    cada(c, (x, y) => { if (!c.tiene(x, y + 1) || !c.tiene(x + 1, y)) g.set(x, y, PV[0], PV); });
  }
  function tronco(g, pts, grueso) {
    const c = capa();
    for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], grueso[i]);
    c.pintar(g, P, { relieve: 2, luz: [-0.85, -0.3, 0.5], max: 3 });
    cada(c, (x, y) => { if ((x * 3 + y * 7) % 11 === 0 && c.tiene(x + 1, y)) g.set(x, y, M[1]); });
  }

  function superficie(g) {
    g.rect(0, 0, W, H, R.tela.oliva[2]);
    // cielo del alba, en franjas
    rellenar(g, 0, 0, W, 60, ALBA, (x, y) => Math.pow(y / 50, 1.3) * 3.2 + halo(x, y, 62) * 2.2, 0.55);
    capa().ell(SOL[0], SOL[1], 10, 9).pintar(g, [PC[4]], { plano: 0 });
    rellenar(g, SOL[0] - 12, SOL[1] - 12, 25, 25, [PC[4], HU[4]], (x, y) => (Math.hypot(x - SOL[0], y - SOL[1]) < 10.5 ? (10.5 - Math.hypot(x - SOL[0], y - SOL[1])) / 4 : null), 1);
    capa().ell(SOL[0], SOL[1], 5.5, 5.5).pintar(g, [HU[4]], { plano: 0 });
    // montes lejanos, violetas por la bruma; el Licabeto a la derecha
    for (let x = 0; x < W; x++) {
      const top = Math.round(colinas(x)) - (x > 166 ? Math.max(0, 15 - Math.abs(x - 181) * 1.15) : 0);
      for (let y = top; y < 62; y++) {
        const v = 1.6 + halo(x, y, 70) * 1.8 + (y === top ? 0.7 : 0) - (y - top) * 0.02;
        g.set(x, y, LEJOS[lim(tono(x, y, v, 0.4), 0, 3)], LEJOS);
      }
    }
    // la Acrópolis sobre su colina, y Atenas a sus pies
    acropolis(g);
    // campos y olivares a media distancia
    for (let y = 56; y < 80; y++) for (let x = 0; x < W; x++) {
      const h = 56 + Math.sin(x * 0.05 + 1) * 1.5;
      if (y < h) continue;
      const banda = Math.floor((y - 56) / 4 + Math.sin(x * 0.03) * 1.2) % 3;
      const ram = banda === 1 ? R.tela.ocre : R.tela.oliva;
      const v = 2 + (y - 56) * 0.03 + halo(x, y, 90) * 1.2 - (banda === 1 ? 0.4 : 0);
      g.set(x, y, ram[lim(tono(x, y, v, 0.4), 0, 4)], ram);
    }
    const az = azar(31);
    for (let fila = 0; fila < 4; fila++) {
      const y = 59 + fila * 4 + fila;
      for (let x = 2 + fila * 3; x < W; x += 7 + fila * 2 + Math.floor(az() * 4)) {
        if (Math.abs(x - caminoX((y - 56) / 52)) < 4 + fila * 2) continue;
        const r = 1.2 + fila * 0.5;
        capa().ell(x, y - r, r + 0.6, r).pintar(g, PV, { relieve: 1.5 + fila * 0.3, luz: [-0.8, -0.4, 0.5], max: 3 });
        g.set(x, y + 1, R.tela.oliva[0]).set(x + 1, y + 1, R.tela.oliva[0]);
      }
    }
    // suelo cercano, el camino y las piedras
    suelo_(g);
    // olivos que enmarcan
    tronco(g, [[5, 77], [8, 66], [3, 54], [8, 40], [14, 24]], [8, 7, 5, 4]);
    tronco(g, [[6, 52], [-3, 40]], [4]);
    tronco(g, [[9, 38], [22, 26]], [3]);
    copaOlivo(g, [[8, 12, 14, 9], [24, 9, 11, 6], [2, 28, 8, 6], [20, 23, 8, 5], [37, 4, 9, 5]], 3);
    tronco(g, [[187, 76], [184, 64], [189, 50], [185, 36]], [8, 6, 5]);
    tronco(g, [[186, 50], [176, 40]], [3]);
    copaOlivo(g, [[184, 22, 12, 9], [172, 15, 9, 6], [190, 7, 8, 6], [168, 30, 6, 4]], 8);
  }
  const caminoX = t => 136 - 46 * t + Math.sin(t * 5.2) * 9 * t;

  function acropolis(g) {
    const MM = R.marmol;
    const colina = capa().poly([[108, 61], [118, 55], [125, 50], [128, 45], [131, 41], [136, 39.5], [162, 38.5], [166, 41], [169, 46], [176, 52], [188, 61]]);
    const ROC = [SO[4], R.tela.ocre[1], R.tela.ocre[2], R.piel.oliva[2], R.piel.oliva[3]];
    rellenar(g, 104, 36, 88, 26, ROC, (x, y) => {
      const lado = x < 147 ? 1 : x < 153 ? 0.4 : -0.5, ladera = y > 47 ? -0.5 : 0;
      return 1.8 + lado + ladera + (y < 41 ? 0.5 : 0) - (y - 40) * 0.02 + halo(x, y, 140) * 0.6;
    }, 0.3, colina);
    for (const [x, y, l] of [[129, 44, 6], [135, 42, 9], [160, 41, 5], [165, 44, 4], [126, 48, 5], [168, 48, 6]]) for (let k = 0; k < l; k++) if (colina.tiene(x + k, y)) g.set(x + k, y, ROC[x < 147 ? 1 : 0]);
    cada(colina, (x, y) => { if (!colina.tiene(x, y - 1)) g.set(x, y, x < 150 ? ROC[4] : ROC[2]); });
    const az0 = azar(4);
    for (let i = 0; i < 24; i++) {
      const x = 112 + Math.floor(az0() * 72), y = 49 + Math.floor(az0() * 9);
      if (colina.tiene(x, y) && colina.tiene(x + 1, y)) g.set(x, y, PV[1]).set(x + 1, y, PV[x < 147 ? 2 : 1]).set(x, y + 1, R.tela.oliva[0]);
    }
    // el Partenón
    const x0 = 140, y0 = 31;
    for (let x = x0 + 1; x < x0 + 18; x++) g.set(x, y0 - 2 + Math.round(Math.abs(x - x0 - 9.5) / 4.5), MM[1]);
    capa().poly([[x0, y0], [x0 + 9.5, y0 - 3], [x0 + 19, y0], [x0 + 19, y0 + 1], [x0, y0 + 1]]).pintar(g, MM, { plano: 3 });
    for (let x = x0; x < x0 + 20; x++) g.set(x, y0 + 1, MM[2]);
    for (let x = x0 + 1; x < x0 + 19; x++) for (let y = y0 + 2; y < y0 + 7; y++) g.set(x, y, (x - x0) % 2 ? MM[0] : (x < x0 + 10 ? MM[4] : MM[2]));
    for (let x = x0 - 1; x < x0 + 21; x++) { g.set(x, y0 + 7, MM[3]); g.set(x, y0 + 8, MM[1]); }
    // Propileos y Erecteion
    for (let x = 130; x < 137; x++) for (let y = 36; y < 39; y++) g.set(x, y, (x % 2) ? MM[1] : MM[3]);
    for (let x = 129; x < 138; x++) g.set(x, 35, MM[2]);
    for (let x = 160; x < 166; x++) for (let y = 34; y < 38; y++) g.set(x, y, (x % 2) ? MM[1] : MM[2]);
    for (let x = 159; x < 167; x++) g.set(x, 33, MM[1]);
    // casas de Atenas al pie de la colina
    const az = azar(17);
    for (let i = 0; i < 46; i++) {
      const x = 100 + Math.floor(az() * 92), y = 50 + Math.floor(az() * 9), w = 3 + Math.floor(az() * 3);
      if (colina.tiene(x, y - 3) && y < 54) continue;
      for (let j = 0; j < 3; j++) for (let k = 0; k < w; k++) g.set(x + k, y + j, k === 0 ? HU[3] : HU[2]);
      for (let k = -1; k <= w; k++) g.set(x + k, y - 1, TE[2]);
      g.set(x + 1, y + 1, HU[0]);
    }
  }

  function suelo_(g) {
    const az = azar(55);
    for (let y = 70; y < H; y++) for (let x = 0; x < W; x++) {
      const t = (y - 56) / 52, cx = caminoX(t), an = 1 + 30 * t ** 1.6;
      const d = Math.abs(x - cx);
      if (y < 74 - Math.sin(x * 0.05 + 1) * 1.5 && d > an) continue;
      if (d < an) {
        const borde = d > an - 1.5;
        const v = 1.25 + halo(x, y, 140) * 0.8 - (borde ? 0.7 : 0) + ((x * 7 + y * 13) % 23 === 0 ? -0.7 : 0) - (y - 80) * 0.01;
        g.set(x, y, HU[lim(tono(x, y, v, 0.35), 0, 4)], HU);
      } else {
        const sec = Math.sin(x * 0.075 + Math.sin(y * 0.21) * 2.2) + Math.sin(y * 0.33 + x * 0.021 + 1.3) * 0.9;
        const ram = sec > 1.15 ? R.tela.ocre : R.tela.oliva;
        let v = 1.9 + halo(x, y, 150) * 1.2 - (y - 72) * 0.012 - (ram === R.tela.ocre ? 0.45 : 0);
        if ((x * 5 + y * 11) % 13 === 0 || (x * 7 + y * 3) % 17 === 0) v += 0.9;
        g.set(x, y, ram[lim(tono(x, y, v, 0.3), 0, 4)], ram);
      }
    }
    // matas y piedras
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(az() * W), y = 74 + Math.floor(az() * 34);
      const t = (y - 56) / 52;
      if (Math.abs(x - caminoX(t)) < 2 + 30 * t ** 1.6) continue;
      if (az() < 0.7) {
        const al = 2 + Math.floor(t * 3);
        for (let j = 0; j < al; j++) { g.set(x, y - j, R.tela.oliva[j === al - 1 ? 3 : 2]); if (j < al - 1) g.set(x - 1 + (j % 2) * 2, y - j - 1, R.tela.oliva[3]); }
      } else {
        capa().ell(x, y, 1.6 + t * 1.5, 1 + t).pintar(g, HU, { relieve: 2, luz: [-0.8, -0.5, 0.5], max: 3 });
        for (let k = -1; k <= 2; k++) g.set(x + k, y + Math.round(1 + t) + 1, R.tela.oliva[1]);
      }
    }
  }

  /* Nubes y pájaros del amanecer. Cada nube es un dibujo de filas: # blanco, + rosado, = panza. */
  const FORMAS_NUBE = [
    ["    ##   ", "  ######  ", " ++######### ", "+++==========", "  ======="],
    ["      ###    ", "  ### #####  ", " ++#########  ", "++++###########", " +=============", "    ======"],
    ["   ##  ", " +#### ", "++=======", " ====="]
  ];
  const TIRAS_NUBE = FORMAS_NUBE.map(f => {
    const tiras = [];
    f.forEach((fila, y) => {
      let x = 0;
      while (x < fila.length) {
        const c = fila[x];
        if (c === " ") { x++; continue; }
        let x2 = x;
        while (x2 < fila.length && fila[x2] === c) x2++;
        tiras.push([c === "#" ? HU[4] : c === "+" ? PC[4] : PC[3], x, y, x2 - x]);
        x = x2;
      }
    });
    return tiras;
  });
  const NUBES = [[20, 9, 0.9, 1], [96, 5, 0.6, 0], [150, 17, 0.75, 2], [60, 22, 0.5, 2]];
  function superficieAnim(ctx, t) {
    for (const [x0, y, v, k] of NUBES) {
      const x = Math.round(((x0 + (t / 1000) * v * 1.2) % (W + 40)) - 20);
      for (const [c, dx, dy, w] of TIRAS_NUBE[k]) { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, 1); }
    }
    // bandada que cruza despacio
    const ciclo = (t / 1000) % 40;
    if (ciclo < 26) {
      const bx = Math.round(-10 + ciclo * 8.5), by = Math.round(30 - ciclo * 0.6);
      [[0, 0], [5, -2], [9, 1]].forEach(([dx, dy], i) => {
        const ala = Math.floor(t / 160 + i) % 2;
        ctx.fillStyle = SO[3];
        ctx.fillRect(bx + dx, by + dy, 1, 1);
        ctx.fillRect(bx + dx - 1, by + dy - ala, 1, 1);
        ctx.fillRect(bx + dx + 1, by + dy - ala, 1, 1);
      });
    }
  }

  /* ---------- El Ágora de Atenas ---------- */
  const MM = R.marmol;
  /* Enlosado en perspectiva: filas cada vez más altas hacia delante, juntas que convergen hacia (vx, yh). */
  function losas(g, y0, filas, ancho, vx, yh, ram, tonoEn, sem) {
    const az = azar(sem), n = ram.length - 1;
    let ya = y0;
    filas.forEach((alto, f) => {
      const off = az() * ancho, vari = Array.from({ length: 40 }, () => (az() - 0.5) * 0.7);
      for (let y = ya; y < ya + alto && y < H; y++) {
        const esc = (y - yh) / (H - yh);
        for (let x = 0; x < W; x++) {
          const u = vx + (x - vx) / esc + off, k = Math.floor(u / ancho), k1 = Math.floor((vx + (x + 1 - vx) / esc + off) / ancho);
          let v = tonoEn(x, y) + vari[((k % 40) + 40) % 40];
          if (y === ya) v -= 1.5;
          else if (k1 !== k) v -= 1.3;
          else if (y === ya + 1) v += 0.4;
          g.set(x, y, ram[lim(Math.round(v), 0, n)], ram);
        }
      }
      ya += alto;
    });
  }
  /* Toldo a rayas visto desde delante: lona inclinada y faldón festoneado. */
  function toldo(g, x0, x1, y0, y1, c1, c2) {
    for (let y = y0; y < y1; y++) {
      const k = (y - y0) / (y1 - y0), a = x0 + (1 - k) * 3, b = x1 - (1 - k) * 3;
      for (let x = Math.round(a); x < Math.round(b); x++) {
        const u = Math.floor(((x - (x0 + x1) / 2) / (1 - (1 - k) * 0.08) + 200) / 4) % 2;
        const ram = u ? c1 : c2, v = 3 - k * 0.9 - (x > b - 3 ? 0.8 : 0) + (x < a + 2 ? 0.4 : 0);
        g.set(x, y, ram[lim(tono(x, y, v, 0.3), 0, 4)], ram);
      }
    }
    for (let x = x0; x < x1; x++) {
      const u = Math.floor((x - (x0 + x1) / 2 + 200) / 4) % 2, ram = u ? c1 : c2, fondo = (x - x0) % 4 === 1 || (x - x0) % 4 === 2 ? 3 : 2;
      g.set(x, y1, ram[1], ram);
      for (let y = y1 + 1; y < y1 + fondo + 1; y++) g.set(x, y, ram[y === y1 + 1 ? 3 : 2], ram);
      g.set(x, y1 + fondo + 1, R.tela.negro[1]);
    }
  }
  function cesta(g, x, y, w, h, fruta) {
    const c = capa().rect(x, y, w, h).off(x, y + h - 1).off(x + w - 1, y + h - 1);
    c.pintar(g, OC, { relieve: 1.5, max: 3, separar: 1 });
    for (let j = y + 1; j < y + h - 1; j += 2) for (let i = x + ((j >> 1) & 1); i < x + w; i += 2) g.set(i, j, OC[1], OC);
    for (let i = x; i < x + w; i++) g.set(i, y, M[2]);
    if (fruta) for (let i = 0; i < w - 1; i += 2) capa().ell(x + 1 + i, y - 1, 1.2, 1.1).pintar(g, fruta, { relieve: 1, max: 4, min: 1 });
  }
  function columnaDorica(g, x, y0, y1) {
    capa().rect(x - 1, y0, 7, 1).pintar(g, MM, { plano: 3 });
    capa().rect(x, y0 + 1, 5, 2).off(x, y0 + 2).off(x + 4, y0 + 2).pintar(g, MM, { plano: 2 });
    for (let y = y0 + 3; y < y1; y++) {
      for (let i = 0; i < 5; i++) g.set(x + i, y, MM[[4, 3, 3, 2, 1][i]], MM);
      if (y % 2 === 0) g.set(x + 2, y, MM[2], MM);
    }
    for (let y = y0 + 3; y < y1; y++) g.set(x + 5, y, MM[0]);
  }

  function agora(g) {
    g.rect(0, 0, W, H, MM[1]);
    rellenar(g, 0, 0, W, 16, [AZ[3], MA[4], AZ[4]], (x, y) => y / 13 * 2 + 0.1, 0.5);
    // tejado de tejas
    for (let y = 10; y < 18; y++) for (let x = 0; x < W; x++) {
      const v = (x % 3 === 0 ? 3.2 : 2) - (y < 12 ? 0.6 : 0) + (y - 10) * 0.05;
      g.set(x, y, TE[lim(tono(x, y, v, 0.3), 0, 4)], TE);
    }
    for (let x = 0; x < W; x++) g.set(x, 10, TE[1]);
    for (let x = 1; x < W; x += 6) { g.set(x, 17, HU[3]).set(x + 1, 17, HU[4]).set(x + 2, 17, HU[3]).set(x + 1, 16, HU[3]); }
    // cornisa, friso de triglifos y arquitrabe
    for (let x = 0; x < W; x++) { g.set(x, 18, MM[4]); g.set(x, 19, MM[2]); g.set(x, 20, MM[0]); }
    for (let y = 21; y < 25; y++) for (let x = 0; x < W; x++) {
      const k = (x + 2) % 12;
      if (k < 4) g.set(x, y, k === 1 || k === 2 ? AZ[1] : AZ[2]);
      else g.set(x, y, k === 4 ? MM[1] : MM[3]);
    }
    for (let x = 0; x < W; x++) { const k = (x + 2) % 12; if (k > 5 && k < 10 && (x * 7) % 3 === 0) g.set(x, 23, GR[2]); }
    for (let x = 0; x < W; x++) { g.set(x, 25, GR[2]); g.set(x, 26, MM[3]); g.set(x, 27, MM[2]); g.set(x, 28, MM[1]); }
    // interior en sombra con las pinturas de la Stoa Pecile
    rellenar(g, 0, 29, W, 27, P, (x, y) => 2.1 - (y - 29) * 0.012 + (y < 32 ? -0.6 : 0), 0.3);
    for (let px = 6; px < W - 10; px += 36) pintura(g, px, 33, 26, 13);
    for (let x = 0; x < W; x++) for (let y = 29; y < 31; y++) g.set(x, y, P[1]);
    // columnas
    for (let x = 4; x < W; x += 12) columnaDorica(g, x, 29, 56);
    // crepidoma
    for (let k = 0; k < 3; k++) for (let x = 0; x < W; x++) { g.set(x, 56 + k * 2, MM[2 - (k > 1 ? 1 : 0)]); g.set(x, 57 + k * 2, MM[0]); }
    for (let y = 46; y < 56; y++) for (let x = 0; x < W; x++) { const c = g.get(x, y), k = MM.indexOf(c); if (k > 0 && (y > 50 || (x + y) % 2)) g.set(x, y, MM[k - 1], MM); }
    for (let x = 0; x < W; x++) g.set(x, 62, MM[0]);
    // enlosado
    losas(g, 62, [3, 4, 4, 5, 6, 7, 8, 9], 22, 96, -70, HU, (x, y) => 1.25 + (y - 62) * 0.004 - Math.abs(x - 96) * 0.002, 6);
    for (const [x0, x1] of [[0, 44], [150, 192]]) for (let x = x0; x < x1; x++) for (let y = 72; y < 76; y++) if (y < 74 || (x + y) % 2) g.set(x, y, HU[0]);
    // plátano que da sombra, arriba a la derecha
    tronco(g, [[188, 30], [184, 14], [178, 4]], [5, 4]);
    copaPlatano(g);
    puestos(g);
  }

  /* Un cuadro de la Stoa Pecile: hoplitas en negro sobre fondo claro, con marco. */
  function pintura(g, x0, y0, w, h) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const marco = y === y0 || y === y0 + h - 1 || x === x0 || x === x0 + w - 1;
      g.set(x, y, marco ? M[1] : (y > y0 + h - 4 ? TE[1] : HU[1]));
    }
    for (let i = 0; i < 4; i++) {
      const fx = x0 + 3 + i * 6, fy = y0 + 2;
      for (let j = 0; j < 7; j++) g.set(fx + 1, fy + 1 + j, NE[1]);
      g.set(fx + 1, fy, NE[1]).set(fx, fy + 3, TE[2]).set(fx, fy + 4, TE[2]).set(fx + 2, fy + 2, NE[1]).set(fx + 3, fy + 1, M[2]);
      g.set(fx, fy + 8, NE[1]).set(fx + 2, fy + 8, NE[1]).set(fx, fy + 2, TE[2]);
    }
  }

  function copaPlatano(g) {
    const c = capa();
    for (const [x, y, rx, ry] of [[182, 6, 14, 8], [168, 2, 9, 5], [190, 18, 7, 7], [176, 14, 8, 5]]) c.ell(x, y, rx, ry);
    const az = azar(21);
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) && az() < 0.4) c.on(x, y - 1); if (!c.tiene(x, y + 1) && az() < 0.4) c.on(x, y + 1); });
    c.pintar(g, HO, { relieve: 4, sesgo: 0.05 });
    for (let i = 0; i < 70; i++) {
      const x = 156 + Math.floor(az() * 36), y = Math.floor(az() * 26);
      if (c.tiene(x, y) && c.tiene(x + 1, y + 1)) { const k = HO.indexOf(g.get(x, y)); g.set(x, y, HO[Math.min(4, k + 1)], HO).set(x + 1, y + 1, HO[Math.max(0, k - 1)], HO); }
    }
  }

  function puestos(g) {
    // puesto de la izquierda: ánforas, cestas de higos y aceitunas
    for (const x of [2, 38]) capa().rect(x, 40, 2, 32).pintar(g, M, { relieve: 1, separar: 1 });
    toldo(g, 0, 42, 31, 40, TE, HU);
    for (let y = 18; y < 31; y++) g.set(38, y, M[1]);
    g.set(38, 17, B[3]);
    capa().rect(0, 58, 41, 14).pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1 });
    for (let x = 0; x < 41; x++) { g.set(x, 58, M[3]); if (x % 6 === 0) for (let y = 60; y < 72; y++) g.set(x, y, M[1]); }
    conBorde(g, M[0], tmp => {
      pintarAnfora(tmp, anfora(8, 57, 12, -0.05, 0.25), TE, undefined, { alto: 12 });
      pintarAnfora(tmp, anfora(33, 57, 11, 0.06, 0.25), TE, undefined, { alto: 11 });
    });
    cesta(g, 15, 53, 7, 5, R.tela.violeta);
    cesta(g, 22, 54, 6, 4, R.hoja);
    // puesto de la derecha: telas colgadas y cerámica de barniz negro
    for (const x of [152, 189]) capa().rect(x, 42, 2, 30).pintar(g, M, { relieve: 1, separar: 1 });
    toldo(g, 150, 192, 33, 42, AZ, HU);
    for (const [x, ram, largo] of [[157, R.tela.ocre, 11], [163, R.tela.violeta, 9], [175, GR, 12], [182, R.tela.oliva, 8]]) {
      const c = capa().rect(x, 47, 5, largo).off(x, 46 + largo).off(x + 4, 46 + largo);
      c.pintar(g, ram, { relieve: 2, max: 3, separar: 1 });
      for (let y = 49; y < 46 + largo; y += 3) g.set(x + 2, y, ram[1], ram);
    }
    capa().rect(151, 60, 41, 12).pintar(g, M, { relieve: 1.5, sesgo: -0.1, separar: 1 });
    for (let x = 151; x < 192; x++) g.set(x, 60, M[3]);
    conBorde(g, M[0], tmp => {
      for (const [x, alto] of [[157, 7], [165, 9], [173, 6], [181, 8], [188, 7]]) {
        capa().ell(x, 59 - alto * 0.45, 2.4, alto * 0.42).rect(x - 1, 59 - alto, 3, 2).rect(x - 1, 58, 3, 1).pintar(tmp, NE, { relieve: 2 });
        for (let k = -1; k <= 1; k++) tmp.set(x + k, Math.round(59 - alto * 0.45), TE[2], TE);
      }
    });
  }

  function agoraAnim(ctx, t) {
    // banderola en lo alto del poste del toldo
    for (let i = 0; i < 12; i++) {
      const y = 19 + Math.round(Math.sin(t / 180 - i * 0.6) * (i / 12) * 1.6);
      ctx.fillStyle = i < 6 ? GR[3] : GR[2];
      ctx.fillRect(39 + i, y, 1, Math.max(1, 3 - Math.floor(i / 5)));
    }
    // el faldón del toldo azul se mece
    for (let x = 150; x < 192; x += 2) {
      if (Math.sin(t / 260 + x * 0.4) > 0.3) { ctx.fillStyle = ((Math.floor((x - 171 + 200) / 4) % 2) ? AZ : HU)[2]; ctx.fillRect(x, 46, 1, 1); }
    }
    // paloma que pasea y picotea
    const p = (t / 1000) % 12, x = Math.round(172 + Math.sin(p * 0.52) * 7), izq = Math.cos(p * 0.52) < 0;
    const forma = Math.floor(t / 260) % 4 === 0 && Math.abs(Math.cos(p * 0.52)) < 0.6 ? PALOMA[1] : PALOMA[0];
    for (const [c, dx, dy, w] of forma) { ctx.fillStyle = c; ctx.fillRect(izq ? x + 7 - dx - w : x + dx, 99 + dy, w, 1); }
  }
  /* Paloma de 8×5 mirando a la derecha: T cola, B cuerpo, A ala, H cabeza, N cuello tornasolado, k pico, f patas. */
  const PALOMA = [
    ["     HH ", "    NHk ", "TTBBBBN ", " TBAAB  ", "   f f  "],
    ["        ", "        ", "TTBBBBN ", " TBAABHH", "   f fHk"]
  ].map(f => {
    const col = { T: P[2], B: P[3], A: P[2], H: P[3], N: HO[3], k: HU[2], f: TE[3] }, tiras = [];
    f.forEach((fila, y) => { for (let x = 0; x < fila.length; x++) if (fila[x] !== " ") tiras.push([col[fila[x]], x, y, 1]); });
    return tiras;
  });

  /* ---------- El puerto del Pireo ---------- */
  const CASCO = [NE[0], NE[1], NE[2], NE[3], NE[4]];
  const MAR_DIA = [MA[1], MA[2], MA[3], MA[4], AZ[4]];
  const LINEA_AGUA = 58, NORAYS = [26, 98, 158];

  function pireo(g) {
    g.rect(0, 0, W, H, MA[2]);
    rellenar(g, 0, 0, W, 40, [AZ[3], MA[4], AZ[4], HU[3]], (x, y) => Math.pow(y / 38, 1.2) * 3, 0.55);
    // costa lejana
    for (let x = 0; x < W; x++) {
      const top = Math.round(36 + Math.sin(x * 0.04 + 2) * 2.5 + Math.sin(x * 0.13) * 1);
      for (let y = top; y < 42; y++) g.set(x, y, y === top ? AZ[4] : (tono(x, y, 3.4 - (y - top) * 0.15, 0.5) > 3 ? AZ[4] : MA[4]), MA);
    }
    // el mar
    rellenar(g, 0, 42, W, 26, MAR_DIA, (x, y) => 3.2 - (y - 42) * 0.09, 0.5);
    for (let y = 43; y < 68; y++) for (let x = 0; x < W; x++) if ((x * 7 + y * 13) % 31 === 0 || ((x + y * 3) % 47 === 0)) g.set(x, y, MAR_DIA[lim(Math.round(4 - (y - 42) * 0.09), 0, 4)], MAR_DIA);
    // atarazanas
    atarazanas(g);
    // el trirreme amarrado
    trirreme(g);
    // muelle de piedra
    sillares(g, 0, 66, W, [3, 3], P, (x, y) => (y < 68 ? 3.4 : 2.6), { sem: 12, ancho: 16, bisel: 0.5, junta: 1.4, vari: 0.4 });
    for (let x = 0; x < W; x++) { g.set(x, 66, P[4]); g.set(x, 72, P[1]); }
    losas(g, 73, [3, 4, 5, 6, 7, 8, 10], 26, 96, -60, P, (x, y) => 2.6 + (y - 73) * 0.004, 14);
    for (const x of NORAYS) {
      capa().rect(x - 2, 60, 5, 7).ell(x, 60, 2.6, 1.4).pintar(g, P, { relieve: 2, separar: 1 });
      for (let k = -2; k <= 2; k++) g.set(x + k, 62, M[2]);
    }
    for (const [x0, x1, y1] of [[98, 108, 48], [158, 150, 48], [26, 76, 44]]) {
      const c = capa().curva(x0, 61, (x0 + x1) / 2, Math.max(61, y1) + 3, x1, y1, 1);
      c.pintar(g, HU, { plano: 1 });
    }
    // cosas del muelle
    conBorde(g, M[0], tmp => {
      for (const [x, ang] of [[6, -0.3], [12, 0.25]]) pintarAnfora(tmp, anfora(x, 72, 11, ang, 0.25), TE, undefined, { alto: 11 });
    });
    for (let k = 0; k < 3; k++) capa().ell(186 - k * 5, 71, 2.5, 1.6).pintar(g, HU, { relieve: 1.5, max: 2, separar: 1 });
  }

  function atarazanas(g) {
    for (let i = 0; i < 5; i++) {
      const x = i * 15 - 4, y = 30;
      for (let j = 0; j < 7; j++) for (let k = -j; k <= j; k++) g.set(x + 7 + k, y - 6 + j, Math.abs(k) >= j - 1 ? TE[k < 0 ? 3 : 1] : (j > 2 ? HU[2] : TE[2]));
      for (let k = -1; k < 16; k++) g.set(x + k, y + 1, HU[3]);
      for (let yy = y + 2; yy < 54; yy++) {
        for (let k = 0; k < 15; k++) {
          const fondo = yy < y + 3 ? P[1] : yy === y + 3 ? M[2] : yy > 46 ? M[1] : M[0];
          g.set(x + k, yy, k < 2 ? (k === 0 ? HU[3] : HU[2]) : fondo);
        }
      }
      for (let yy = 50; yy < 58; yy++) for (let k = 2 - (yy - 50) * 0.3; k < 15; k++) g.set(x + k, yy, P[yy < 54 ? 3 : 2]);
    }
    // proa de una nave guardada
    capa().poly([[34, 44], [44, 42], [46, 46], [44, 50], [34, 50]]).pintar(g, CASCO, { relieve: 1.5, max: 3 });
    g.set(45, 49, B[3]).set(46, 49, B[3]).set(44, 45, HU[3]);
  }

  function trirreme(g) {
    const x0 = 78, x1 = 186, L = LINEA_AGUA;
    // casco: negro de brea, con la franja de color y las portas de los remos
    const casco = capa().poly([[x0, L - 14], [x1 - 6, L - 13], [x1, L - 11], [x1 + 2, L - 6], [x1 - 2, L], [x0 + 10, L], [x0 + 2, L - 5]]);
    casco.pintar(g, CASCO, { relieve: 3, luz: [-0.4, -0.7, 0.6], max: 3 });
    for (let x = x0 + 2; x < x1; x++) { g.set(x, L - 13, GR[2]); g.set(x, L - 12, GR[3]); g.set(x, L - 11, OC[2]); }
    for (const [fy, paso, desde] of [[L - 9, 4, 0], [L - 7, 4, 2], [L - 5, 4, 1]]) for (let x = x0 + 8 + desde; x < x1 - 8; x += paso) g.set(x, fy, CASCO[0]).set(x + 1, fy, CASCO[1]);
    // borda, mamparo y escudos
    for (let x = x0 + 2; x < x1 - 2; x++) { g.set(x, L - 15, M[3]); g.set(x, L - 14, M[1]); }
    for (let x = x0 + 4; x < x1 - 10; x += 3) { g.set(x, L - 18, M[2]); g.set(x, L - 17, M[2]); g.set(x, L - 16, M[2]); }
    for (let x = x0 + 4; x < x1 - 10; x++) g.set(x, L - 18, M[3]);
    for (let x = x0 + 14; x < x1 - 16; x += 9) capa().ell(x, L - 16.5, 2.2, 2).pintar(g, x % 2 ? B : GR, { relieve: 1.5, max: 3, separar: 1 });
    // popa curvada (aplustre)
    const popa = capa().curva(x0 + 4, L - 12, x0 - 4, L - 18, x0 + 2, L - 36, 4, 2).curva(x0 + 2, L - 35, x0 + 6, L - 40, x0 + 9, L - 36, 2, 1);
    popa.pintar(g, CASCO, { relieve: 2, luz: [-0.4, -0.7, 0.6], max: 3 });
    for (const [x, y] of [[x0 + 1, L - 31], [x0, L - 26], [x0 + 1, L - 21]]) g.set(x, y, OC[3]);
    // proa: ojo pintado, espolón de bronce
    capa().curva(x1 - 4, L - 12, x1 + 2, L - 15, x1 + 1, L - 21, 2.5, 1.5).pintar(g, CASCO, { relieve: 1.5, max: 3 });
    capa().poly([[x1 - 2, L - 4], [x1 + 6, L - 3], [x1 + 6, L - 0.5], [x1 - 2, L]]).pintar(g, B, { relieve: 1.5, separar: 1 });
    capa().poly([[x1 - 1, L - 8.5], [x1 + 4, L - 8], [x1 + 4, L - 6.5], [x1 - 1, L - 6]]).pintar(g, B, { relieve: 1, max: 3, separar: 1 });
    const ex = x1 - 9, ey = L - 8;
    capa().ell(ex, ey, 3.2, 1.8).pintar(g, HU, { plano: 4 });
    g.set(ex + 1, ey, NE[0]).set(ex + 2, ey, NE[0]).set(ex + 1, ey - 1, NE[0]).set(ex, ey, GR[3]);
    for (let k = -3; k <= 3; k++) g.set(ex + k, ey - 2, GR[2]);
    // mástil, verga y vela recogida
    const mx = 132;
    for (let y = 2; y < L - 14; y++) { g.set(mx, y, M[3]); g.set(mx + 1, y, M[1]); }
    g.set(mx, 1, M[2]).set(mx + 1, 1, M[2]);
    for (let x = 100; x < 164; x++) { const y = 9 + Math.round(Math.abs(x - mx) * 0.03); g.set(x, y, M[2]); g.set(x, y + 1, M[1]); }
    const vela = capa();
    for (let x = 101; x < 163; x++) { const y = 10 + Math.round(Math.abs(x - mx) * 0.03); vela.rect(x, y + 1, 1, 3 + (Math.sin(x * 0.9) > 0.6 ? 1 : 0)); }
    vela.pintar(g, HU, { relieve: 1.5, max: 3, separar: 1 });
    for (let x = 103; x < 162; x += 5) for (let y = 11; y < 15; y++) if (vela.tiene(x, y)) g.set(x, y, HU[1]);
    // jarcia
    const cab = (xa, ya, xb, yb) => { const c = capa().linea(xa, ya, xb, yb, 1); cada(c, (x, y) => { if (!g.get(x, y) || CASCO.includes(g.get(x, y)) === false) g.set(x, y, M[1]); }); };
    cab(mx, 2, x1 + 1, L - 20); cab(mx + 1, 2, x0 + 4, L - 35); cab(101, 11, 104, L - 18); cab(162, 11, 160, L - 18);
    for (let x = mx - 1; x <= mx + 2; x++) g.set(x, 4, M[1]);
    // gaviota posada en la verga
    g.set(158, 7, HU[4]).set(159, 7, HU[4]).set(160, 8, HU[3]).set(157, 8, P[2]).set(159, 6, HU[4]).set(160, 6, OC[3]);
    // reflejo del casco en el agua
    for (let y = L; y < L + 6; y++) for (let x = x0 + 8 + (y - L) * 2; x < x1 - (y - L) * 2; x++) if ((x + y * 3) % (y - L + 3) !== 0) g.set(x, y, (y - L) % 2 ? MA[1] : NE[3]);
  }

  /* Gaviotas: [x, y, velocidad, fase]. */
  const GAVIOTAS = [[20, 14, 7, 0], [90, 8, 5, 2], [150, 22, 6, 4]];
  function pireoAnim(ctx, t) {
    // destellos en el agua
    for (let i = 0; i < 22; i++) {
      const x = (i * 37 + 11) % W, y = 59 + ((i * 5) % 6);
      const v = Math.sin(t / 300 + i * 1.7);
      if (v < 0.25 || NORAYS.some(n => Math.abs(x - n) < 7)) continue;
      ctx.fillStyle = v > 0.75 ? HU[4] : AZ[4];
      ctx.fillRect(x + Math.round(Math.sin(t / 900 + i) * 2), y, v > 0.6 ? 3 : 2, 1);
    }
    // gaviotas que planean y aletean
    for (const [x0, y0, v, f] of GAVIOTAS) {
      const x = Math.round(((x0 + (t / 1000) * v) % (W + 30)) - 15), y = Math.round(y0 + Math.sin(t / 1300 + f) * 3);
      ctx.fillStyle = HU[4];
      if (Math.floor(t / 180 + f) % 3 === 0) {
        ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x - 2, y - 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1);
        ctx.fillStyle = P[2]; ctx.fillRect(x - 3, y - 2, 1, 1); ctx.fillRect(x + 3, y - 2, 1, 1);
      } else {
        ctx.fillRect(x - 2, y - 1, 2, 1); ctx.fillRect(x + 1, y - 1, 2, 1); ctx.fillRect(x, y, 1, 1);
        ctx.fillStyle = P[2]; ctx.fillRect(x - 3, y, 1, 1); ctx.fillRect(x + 3, y, 1, 1);
      }
    }
  }

  /* ---------- El banquete en casa de Agatón ---------- */
  const LAMPARAS_BANQUETE = [[7, 27], [185, 27], [96, 33]];
  const luzBanquete = (x, y) => lim(LAMPARAS_BANQUETE.reduce((v, [lx, ly], i) => v + Math.max(0, 1 - Math.hypot((x - lx) / (i < 2 ? 52 : 60), (y - ly) / 40)) ** 1.4 * (i < 2 ? 1 : 0.8), 0));

  /* Greca de un friso: trazo continuo en espiral, de 8 píxeles de periodo y 7 de alto. */
  function greca(g, x0, x1, y0, tinta) {
    const pasos = [[0, 6, 8, 6], [0, 0, 0, 6], [0, 0, 6, 0], [6, 0, 6, 4], [2, 4, 6, 4], [2, 2, 2, 4], [2, 2, 4, 2]];
    for (let u = x0 - 8; u < x1; u += 8) for (const [a, b, c, d] of pasos) {
      for (let y = Math.min(b, d); y <= Math.max(b, d); y++) for (let x = Math.min(a, c); x <= Math.max(a, c); x++) if (u + x >= x0 && u + x < x1) g.set(u + x, y0 + y, tinta);
    }
  }
  /* Guirnalda de hiedra colgada entre dos clavos, con cintas. */
  function guirnalda(g, xa, xb, y, caida) {
    const az = azar(xa * 3 + 1), m = (xa + xb) / 2, h = (xb - xa) / 2;
    for (let x = xa; x <= xb; x++) {
      const yy = y + caida * (1 - ((x - m) / h) ** 2);
      g.set(x, Math.round(yy), HO[1]);
      if ((x - xa) % 2 === 0) {
        const k = az();
        g.set(x, Math.round(yy) + 1, HO[k < 0.5 ? 2 : 3]).set(x + 1, Math.round(yy) - 1, HO[2]).set(x - 1, Math.round(yy) + 1, HO[1]);
        if (k > 0.85) g.set(x, Math.round(yy) + 2, NE[1]);
      }
    }
    for (const x of [xa, xb]) {
      g.set(x, y - 1, B[3]).set(x, y, B[2]);
      for (let j = 1; j < 7; j++) { g.set(x - 1, y + j, j % 3 ? TE[3] : TE[2]); g.set(x + 1, y + j + 1, j % 3 ? R.tela.violeta[3] : R.tela.violeta[2]); }
    }
  }
  function lira(g, x, y) {
    conBorde(g, GR[0], tmp => {
      capa().curva(x - 3, y + 8, x - 6, y + 2, x - 3, y - 3, 1.6, 1.2).curva(x + 3, y + 8, x + 6, y + 2, x + 3, y - 3, 1.6, 1.2).pintar(tmp, M, { relieve: 1, min: 2 });
      capa().rect(x - 4, y - 3, 9, 1).pintar(tmp, M, { plano: 3 });
      capa().ell(x, y + 9, 4.2, 3).pintar(tmp, HU, { relieve: 2, max: 3 });
      for (let j = y - 2; j < y + 8; j++) for (const k of [-2, 0, 2]) tmp.set(x + k, j, HU[3], HU);
      tmp.set(x - 1, y + 9, M[1], M).set(x + 1, y + 10, M[1], M).set(x, y + 8, M[1], M);
    });
  }
  function corona(g, x, y) {
    for (let a = 0; a < 6.28; a += 0.35) {
      const px = Math.round(x + Math.cos(a) * 5), py = Math.round(y + Math.sin(a) * 4.5);
      g.set(px, py, HO[2]).set(px + (Math.cos(a) > 0 ? 1 : -1), py, HO[Math.sin(a) < 0 ? 3 : 1]);
    }
    g.set(x, y - 6, B[3]).set(x, y - 5, B[2]);
    for (let j = 0; j < 5; j++) { g.set(x - 1, y + 5 + j, R.tela.violeta[3]); g.set(x + 1, y + 5 + j, R.tela.violeta[2]); }
  }
  function lampadario(g, x, yLamp) {
    capa().rect(x, yLamp + 3, 1, 69 - yLamp - 3).pintar(g, B, { plano: 2 });
    for (let y = yLamp + 3; y < 68; y++) g.set(x + 1, y, B[1]);
    capa().linea(x, 66, x - 4, 71, 1).linea(x + 1, 66, x + 5, 71, 1).rect(x - 1, 65, 4, 2).pintar(g, B, { relieve: 1, min: 1, max: 3 });
    capa().rect(x - 3, yLamp + 2, 8, 1).pintar(g, B, { plano: 3 });
    capa().ell(x + 1, yLamp + 1, 3, 1.3).pintar(g, TE, { relieve: 1, max: 3 });
    g.set(x + 4, yLamp, TE[2]).set(x + 5, yLamp, TE[2]);
  }
  function kline(g, x0, x1, cabecera) {
    const dir = cabecera === "izq" ? 1 : -1, xc = dir > 0 ? x0 : x1;
    // patas torneadas
    for (const lx of [x0 + 2, x1 - 3]) for (let y = 60; y < 72; y++) {
      const w = (y === 63 || y === 67) ? 3 : 2, ox = w === 3 ? -0.5 : 0;
      for (let k = 0; k < w; k++) g.set(Math.round(lx + k + ox), y, k === 0 ? M[3] : M[1]);
      if (y === 63 || y === 67) g.set(lx, y, B[3]);
    }
    capa().rect(x0, 58, x1 - x0 + 1, 3).pintar(g, M, { relieve: 1.5, separar: 1 });
    // colchón y manta que cuelga
    capa().rect(x0, 53, x1 - x0 + 1, 5).pintar(g, HU, { relieve: 2, max: 2, sesgo: -0.1 });
    for (let x = x0; x <= x1; x++) g.set(x, 55, AZ[2]);
    const manta = capa().rect(x0 + 8, 56, x1 - x0 - 15, 5);
    for (let x = x0 + 8; x < x1 - 7; x += 3) manta.on(x, 61);
    manta.pintar(g, R.tela.violeta, { relieve: 2, max: 3, sesgo: -0.1 });
    for (let x = x0 + 9; x < x1 - 7; x += 4) g.set(x, 58, OC[3]);
    // cabecero curvo y cojines
    capa().curva(xc, 59, xc - dir * 2, 50, xc + dir * 3, 47, 2.5, 2).pintar(g, M, { relieve: 1.2, separar: 1 });
    g.set(xc + dir * 3, 47, B[4]);
    capa().ell(xc + dir * 5, 51, 4, 3).pintar(g, GR, { relieve: 2.5, max: 3, separar: 1 });
    capa().ell(xc + dir * 11, 52, 3.5, 2.5).pintar(g, OC, { relieve: 2, max: 3, separar: 1 });
    for (let k = -3; k <= 3; k += 2) g.set(xc + dir * 5 + k, 51, GR[2]);
  }
  function crateraFigurasRojas(g, cx, by) {
    conBorde(g, SO[0], tmp => {
      const c = capa();
      c.poly([[cx - 11, by - 27], [cx + 11, by - 27], [cx + 8, by - 13], [cx + 5, by - 9], [cx - 5, by - 9], [cx - 8, by - 13]]);
      c.rect(cx - 12, by - 28, 25, 2);
      c.ell(cx, by - 9, 5, 2.5);
      c.rect(cx - 1.5, by - 8, 4, 4);
      c.rect(cx - 5, by - 4, 11, 2).rect(cx - 6, by - 2, 13, 2);
      c.pintar(tmp, NE, { relieve: 4, luz: [-0.8, -0.4, 0.6] });
      for (const s of [-1, 1]) capa().ell(cx + s * 9, by - 12, 2.2, 1.4).quitarEll(cx + s * 9, by - 12, 0.8, 0.5).pintar(tmp, NE, { relieve: 1, min: 1 });
      // figuras rojas: un sátiro y una ménade danzando, y una greca bajo el labio
      for (let x = cx - 10; x <= cx + 10; x++) { tmp.set(x, by - 25, TE[2], TE); if ((x - cx) % 3 === 0) tmp.set(x, by - 24, TE[2], TE); }
      const fig = (fx, fy, s) => {
        const P_ = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [1, 3], [0, 4], [1, 4], [-1, 2], [-2, 1], [-3, 0], [2, 2], [3, 3], [-1, 5], [-2, 6], [-2, 7], [2, 5], [2, 6], [3, 7]];
        for (const [a, b] of P_) tmp.set(fx + a * s, fy + b, b < 2 ? TE[3] : TE[2], TE);
        tmp.set(fx + s, fy - 1, TE[2], TE).set(fx, fy - 1, NE[1], NE);
      };
      fig(cx - 5, by - 22, 1); fig(cx + 5, by - 22, -1);
      tmp.set(cx, by - 18, TE[2], TE).set(cx, by - 17, TE[2], TE).set(cx - 1, by - 19, TE[3], TE).set(cx + 1, by - 19, TE[3], TE);
      for (let x = cx - 10; x <= cx + 10; x++) tmp.set(x, by - 28, x < cx - 4 ? NE[3] : NE[2], NE);
      for (let x = cx - 9; x <= cx + 9; x++) tmp.set(x, by - 27, GR[1], GR);
    });
  }
  function mosaico(g) {
    // banda de olas
    for (let y = 72; y < 81; y++) for (let x = 0; x < W; x++) g.set(x, y, NE[2]);
    for (let x = 0; x < W; x++) { g.set(x, 72, NE[0]); g.set(x, 73, HU[1]); g.set(x, 80, HU[1]); }
    for (let x = 0; x < W; x++) {
      const f = (x % 12) / 12, y = Math.round(77 - Math.sin(f * 6.28) * 2.2 - (f > 0.55 && f < 0.8 ? 1 : 0));
      g.set(x, y, HU[2]);
      if (f > 0.15 && f < 0.3) g.set(x, y - 1, HU[2]);
    }
    for (let x = 0; x < W; x += 12) { g.set(x + 7, 75, HU[2]).set(x + 8, 76, HU[2]); g.set(x + 2, 78, HU[1]); }
    // campo de guijarros con un rosetón
    const az = azar(19);
    for (let y = 81; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 1.15 + luzBanquete(x, y) * 0.9 - (az() < 0.07 ? 0.7 : 0) - (y - 81) * 0.006;
      g.set(x, y, HU[lim(tono(x, y, v, 0.15), 0, 4)], HU);
    }
    const cx = 96, cy = 95, rx = 46, ry = 10;
    for (let a = 0; a < 6.283; a += 0.004) {
      for (const [k, col] of [[1, TE[1]], [0.92, TE[2]]]) g.set(Math.round(cx + Math.cos(a) * rx * k), Math.round(cy + Math.sin(a) * ry * k), col);
    }
    for (let p = 0; p < 12; p++) {
      const a = (p / 12) * 6.283, px = cx + Math.cos(a) * rx * 0.55, py = cy + Math.sin(a) * ry * 0.55;
      const c = capa().ell(px, py, 7 * (0.6 + 0.4 * Math.abs(Math.cos(a))), 2.4 * (0.6 + 0.4 * Math.abs(Math.sin(a))));
      c.pintar(g, p % 2 ? TE : GR, { relieve: 1.5, max: 2, min: 1 });
    }
    capa().ell(cx, cy, 5, 1.8).pintar(g, OC, { relieve: 1, max: 3 });
    for (let y = 81; y < 84; y++) for (let x = 0; x < W; x++) if (g.rampa(x, y) === HU && (x + y) % 2) g.set(x, y, HU[0]);
  }

  function banquete(g) {
    g.rect(0, 0, W, H, GR[1]);
    // techo de vigas
    rellenar(g, 0, 0, W, 8, M, (x, y) => (x % 16 < 3 ? 2.2 : 1) + (y === 7 ? -0.8 : 0) + luzBanquete(x, y + 10) * 0.6, 0.3);
    // pared roja
    rellenar(g, 0, 8, W, 48, GR, (x, y) => 1.5 + luzBanquete(x, y) * 1.9 - (y < 12 ? 0.4 : 0), 0.16);
    // friso negro con greca
    for (let y = 13; y < 24; y++) for (let x = 0; x < W; x++) g.set(x, y, y === 13 || y === 23 ? HU[2] : y === 14 || y === 22 ? NE[2] : NE[1]);
    greca(g, 0, W, 15, TE[3]);
    for (let x = 0; x < W; x++) g.set(x, 24, GR[0]);
    // guirnaldas
    for (let x = 16; x < W - 20; x += 40) guirnalda(g, x, x + 40, 25, 7);
    lira(g, 56, 33);
    corona(g, 136, 36);
    // zócalo oscuro
    for (let y = 56; y < 72; y++) for (let x = 0; x < W; x++) g.set(x, y, y === 56 ? GR[3] : y === 57 ? NE[0] : y === 70 ? NE[2] : NE[1]);
    kline(g, 12, 60, "izq");
    kline(g, 132, 180, "der");
    crateraFigurasRojas(g, 114, 71);
    lampadario(g, 6, 28);
    lampadario(g, 184, 28);
    // lámpara colgada en el centro
    for (let y = 8; y < 30; y++) g.set(96, y, y % 2 ? B[1] : B[2]);
    conBorde(g, GR[0], tmp => {
      capa().ell(96, 32, 5, 1.6).pintar(tmp, B, { relieve: 1.2, max: 3 });
      tmp.set(91, 31, B[3], B).set(101, 31, B[3], B);
    });
    mosaico(g);
  }

  function banqueteAnim(ctx, t) {
    llamita(ctx, 11, 27, t, 0.4);
    llamita(ctx, 189, 27, t, 2.2);
    llamita(ctx, 91, 30, t, 4.1);
    llamita(ctx, 101, 30, t, 5.3);
  }

  /* ---------- Tormenta en el mar ---------- */
  const NUBARRON = [SO[0], SO[1], SO[2], SO[3], SO[4], P[3]];
  const OLEAJE = [MA[0], MA[1], MA[2], MA[3], MA[4]];
  const OLAS = [[41, 2, 23, 0.1], [45, 3, 31, 0.6], [50, 5, 43, 0.3], [56, 7, 57, 0.8], [62, 8, 71, 0.45]];
  const perfil = u => Math.pow(0.5 + 0.5 * Math.cos(6.2832 * (u - 0.5)), 2.2);
  const olaY = (k, x) => { const [b, A, L, f] = OLAS[k]; return b - A * perfil((((x / L + f) % 1) + 1) % 1); };

  function mar(g) {
    g.rect(0, 0, W, H, SO[1]);
    // nubarrones: bultos redondeados en tres capas, más oscuros cuanto más cerca
    rellenar(g, 0, 0, W, 46, NUBARRON, (x, y) => 1 + Math.pow(Math.max(0, y - 14) / 30, 1.4) * 3.8, 0.5);
    const capas = [[31, 9, 3.5, 2, 5, 6], [19, 13, 5.5, 1, 4, 11], [4, 18, 7, 0, 3, 5]];
    for (const [yc, rx, ry, min, max, sem] of capas) {
      const az = azar(sem);
      for (let x = -12; x < W + 12; x += rx * (0.9 + az() * 0.6)) {
        const r = rx * (0.7 + az() * 0.6);
        capa().ell(x, yc + (az() - 0.5) * ry, r, ry * (0.8 + az() * 0.5)).pintar(g, NUBARRON, { relieve: 6, luz: [-0.2, -0.95, 0.4], min, max, separar: min + 1 });
      }
    }
    // horizonte y olas, de lejos a cerca
    for (let k = 0; k < OLAS.length; k++) {
      for (let x = 0; x < W; x++) {
        const top = Math.round(olaY(k, x)), pend = olaY(k, x + 1) - olaY(k, x - 1);
        for (let y = top; y < 72; y++) {
          let v = 2.6 - (y - top) * 0.18 + (pend > 0 ? 0.4 : -0.3) - k * 0.15;
          if (y === top) v += 0.9;
          const cresta = perfil((((x / OLAS[k][2] + OLAS[k][3]) % 1) + 1) % 1);
          if (y - top < 2 && cresta > 0.75) { g.set(x, y, y === top ? HU[2] : HU[1]); continue; }
          if ((x * 5 + y * 3 + k * 7) % 23 === 0 && y - top < 6) { g.set(x, y, MA[3]); continue; }
          g.set(x, y, OLEAJE[lim(tono(x, y, v, 0.4), 0, 4)], OLEAJE);
        }
      }
    }
    olaGigante(g);
    // mástil y obenques a la izquierda
    capa().rect(2, 0, 6, 72).pintar(g, M, { relieve: 2, sesgo: -0.15, separar: 1 });
    for (let y = 0; y < 72; y += 9) for (let x = 2; x < 8; x++) g.set(x, y, M[0]);
    for (let x = 0; x < 34; x++) { g.set(x, 7, M[2]); g.set(x, 8, M[0]); }
    capa().rect(8, 9, 26, 3).pintar(g, HU, { relieve: 1, max: 1, separar: 1 });
    for (const [x1, y1] of [[40, 62], [62, 62]]) capa().linea(7, 12, x1, y1, 1).pintar(g, M, { plano: 1 });
    // borda mojada
    for (let y = 61; y < 72; y++) for (let x = 0; x < W; x++) {
      let v = y <= 62 ? 3.2 : y === 63 ? 0.4 : 1.4 + ((y - 64) % 3 === 2 ? -0.9 : 0) + ((x * 3 + y) % 37 === 0 ? 1.2 : 0);
      g.set(x, y, M[lim(tono(x, y, v, 0.3), 0, 4)], M);
    }
    for (let x = 0; x < W; x++) if ((x * 7) % 11 < 3) g.set(x, 61, HU[1]);
    for (const x of [36, 84, 132, 180]) {
      capa().rect(x, 56, 4, 16).pintar(g, M, { relieve: 1.5, separar: 1 });
      g.set(x + 1, 56, HU[1]).set(x + 2, 57, M[3]);
    }
    // cubierta: tablas mojadas que convergen
    for (let y = 72; y < H; y++) for (let x = 0; x < W; x++) {
      const esc = (y - 30) / (H - 30), u = (x - 96) / esc, k = Math.floor(u / 11), k1 = Math.floor(((x + 1 - 96) / esc) / 11);
      let v = 1.2 + Math.sin(k * 2.3) * 0.2 - (y - 72) * 0.006;
      if (k1 !== k) v = 0.2;
      else if ((Math.floor(u) + k * 5) % 19 === 0 || (Math.abs(Math.sin(u * 0.13 + y * 0.31)) > 0.985)) v += 1.4;
      if (y === 72) v = 0;
      g.set(x, y, M[lim(tono(x, y, v, 0.15), 0, 4)], M);
    }
    for (const [cx, cy, rx] of [[24, 97, 8], [142, 84, 6], [112, 105, 10]]) {
      const c = capa().ell(cx, cy, rx, Math.max(1, rx * 0.2));
      cada(c, (x, y) => g.set(x, y, M[0]));
      for (let k = -2; k < 3; k++) g.set(cx + k - 1, cy, k < 0 ? MA[2] : SO[3]);
    }
    // rollo de cabo junto al mástil
    capa().ell(16, 75, 6, 2.4).pintar(g, OC, { relieve: 1.5, max: 2, separar: 1 });
    for (let a = 0; a < 6.28; a += 0.2) g.set(Math.round(16 + Math.cos(a) * 3.6), Math.round(75 + Math.sin(a) * 1.3), OC[1]);
    g.set(15, 75, M[0]).set(16, 75, M[0]).set(17, 75, M[0]);
  }
  function olaGigante(g) {
    const c = capa().poly([[110, 64], [128, 58], [140, 50], [149, 42], [155, 34], [160, 27], [165, 21], [171, 17], [178, 14], [186, 13], [192, 15], [192, 64]]);
    const labio = capa().curva(189, 13, 170, 8, 161, 19, 5, 2.4);
    cada(c, (x, y) => {
      let v = 1 + (64 - y) * 0.05 + Math.sin(x * 0.3 + y * 0.15) * 0.2 - Math.max(0, x - 180) * 0.06;
      g.set(x, y, OLEAJE[lim(tono(x, y, v, 0.4), 0, 4)], OLEAJE);
    });
    // hueco oscuro bajo el labio que se curva
    const hueco = capa().ell(171, 22, 7, 5).recortar(c);
    cada(hueco, (x, y) => g.set(x, y, OLEAJE[lim(tono(x, y, 1.1 + (y - 18) * 0.1, 0.4), 0, 4)], OLEAJE));
    cada(labio, (x, y) => {
      const v = labio.tiene(x, y - 1) ? 3.2 : 4;
      g.set(x, y, OLEAJE[lim(tono(x, y, v, 0.4), 0, 4)], OLEAJE);
    });
    cada(labio, (x, y) => { if (!labio.tiene(x, y - 1)) g.set(x, y, HU[3]); else if (!labio.tiene(x, y + 1) && x < 168) g.set(x, y, HU[1]); });
    cada(c, (x, y) => { if (!c.tiene(x, y - 1) && !labio.tiene(x, y - 1) && x < 162) { g.set(x, y, HU[2]); if (c.tiene(x, y + 1)) g.set(x, y + 1, MA[4]); } });
    // vetas de espuma que bajan por la cara de la ola
    for (let i = 0; i < 8; i++) {
      let x = 150 + i * 5, y = 28 + (i % 3) * 5;
      for (let j = 0; j < 9; j++) { if (c.tiene(x, y) && !hueco.tiene(x, y)) g.set(x, y, j < 3 ? MA[4] : MA[3]); x -= 1; y += 2; }
    }
    for (const [x, y] of [[162, 22], [160, 24], [163, 25], [159, 21]]) g.set(x, y, HU[2]);
  }

  /* Lluvia, espuma que corre por las crestas y relámpagos que iluminan solo un trozo de cielo. */
  const GOTAS = Array.from({ length: 64 }, (_, i) => [(i * 53) % W, (i * 29) % 108, 1 + (i % 3) * 0.35]);
  function relampago(ctx, t) {
    const ciclo = 5200, n = Math.floor(t / ciclo), fase = t - n * ciclo;
    if (fase > 300 || (fase > 110 && fase < 170)) return;
    const az = azar(Math.imul(n + 1, 2654435761) >>> 0);
    az();
    const x0 = 36 + Math.floor(az() * 96);
    // la nube se enciende alrededor del rayo
    for (let dy = -5; dy <= 5; dy++) {
      const w = Math.round(17 * Math.sqrt(1 - (dy / 5.6) ** 2)), wi = Math.round(10 * Math.sqrt(Math.max(0, 1 - (dy / 3.6) ** 2)));
      ctx.fillStyle = SO[4]; ctx.fillRect(x0 - w + (dy & 1), 7 + dy, w * 2, 1);
      if (wi > 0) { ctx.fillStyle = P[3]; ctx.fillRect(x0 - wi, 7 + dy, wi * 2, 1); }
    }
    let x = x0, y = 7;
    ctx.fillStyle = HU[4];
    while (y < 38) {
      const paso = 2 + Math.floor(az() * 4), dx = Math.floor(az() * 5) - 2;
      ctx.fillRect(Math.min(x, x + dx), y, Math.abs(dx) + 1, 1);
      ctx.fillRect(x + dx, y, 1, paso);
      x += dx; y += paso;
      if (az() < 0.2) { ctx.fillStyle = HU[2]; ctx.fillRect(x + 1, y - 1, 3, 1); ctx.fillRect(x + 3, y, 1, 2); ctx.fillStyle = HU[4]; }
    }
  }
  function marAnim(ctx, t) {
    relampago(ctx, t);
    // espuma deslizándose por las crestas
    for (let k = 2; k < OLAS.length; k++) {
      const [, , L] = OLAS[k], fase = (t / 1000) * (0.05 + k * 0.012);
      for (let x0 = 0; x0 < W + L; x0 += L) {
        const x = Math.round(x0 - ((fase * L) % L) + L * 0.5 - OLAS[k][3] * L);
        if (x < -4 || x > W) continue;
        const y = Math.round(olaY(k, x));
        if (y >= 61) continue;
        ctx.fillStyle = HU[3]; ctx.fillRect(x - 2, y, 4, 1);
        ctx.fillStyle = HU[1]; ctx.fillRect(x - 3, y + 1, 2, 1);
      }
    }
    // rocío en la cresta de la ola grande
    for (let i = 0; i < 6; i++) {
      const p = (t / 900 + i * 0.37) % 1, x = Math.round(160 - i * 3 - p * 10), y = Math.round(14 + p * 8 - Math.sin(p * 3.14) * 4);
      ctx.fillStyle = p < 0.5 ? HU[3] : HU[1]; ctx.fillRect(x, y, 1, 1);
    }
    // lluvia sesgada por el viento
    for (const [x0, y0, v] of GOTAS) {
      const y = Math.floor((y0 + t * 0.11 * v) % 116) - 6, x = Math.floor((x0 - (y - y0) * 0.45 + 400) % W);
      ctx.fillStyle = v > 1.5 ? P[4] : MA[3];
      ctx.fillRect(x, y, 1, 2);
      ctx.fillRect(x - 1, y + 2, 1, 2);
    }
  }

  /* ---------- La Atlántida, vista desde el muelle ---------- */
  const OR = R.oricalco, PL = R.plata;
  const CIUDAD = { cx: 100, cy: 42, k: 0.2 };
  /* Anillos de agua y tierra (radio exterior, tipo, rampa del muro). */
  const ANILLOS = [[77, "tierra", B], [66, "agua"], [55, "tierra", PL], [44, "agua"], [33, "isla", OR]];
  const radioCiudad = (x, y) => Math.hypot(x - CIUDAD.cx, (y - CIUDAD.cy) / CIUDAD.k);

  function atlantida(g) {
    g.rect(0, 0, W, H, MA[2]);
    rellenar(g, 0, 0, W, 40, [AZ[2], AZ[3], MA[4], AZ[4], HU[3]], (x, y) => Math.pow(y / 36, 1.1) * 4, 0.5);
    // montañas que protegen la llanura, al norte
    for (const [cx, cy, rx, ry] of [[22, 12, 12, 3], [140, 8, 16, 3.5], [176, 15, 9, 2.5]]) {
      capa().ell(cx, cy, rx, ry).ell(cx - rx * 0.4, cy - ry * 0.7, rx * 0.5, ry).ell(cx + rx * 0.35, cy - ry * 0.4, rx * 0.4, ry * 0.8).pintar(g, [AZ[4], HU[3], HU[4]], { relieve: 3, min: 0 });
    }
    const MONTE = [MA[1], AZ[2], MA[2], AZ[3], MA[4]];
    const PICOS = [[8, 13, 30], [38, 8, 22], [70, 11, 26], [118, 15, 34], [150, 9, 20], [182, 13, 28]];
    const cresta = x => 37 - Math.max(...PICOS.map(([px, h, w]) => h * Math.max(0, 1 - Math.abs(x - px) / w) ** 1.15)) + Math.sin(x * 0.7) * 0.4;
    for (let x = 0; x < W; x++) {
      const top = Math.round(cresta(x)), pend = cresta(x + 1) - cresta(x - 1);
      for (let y = top; y < 40; y++) {
        const v = 2.5 - (y - top) * 0.05 + (pend > 0 ? 0.6 : -0.4) + (y === top ? 0.7 : 0);
        g.set(x, y, MONTE[lim(tono(x, y, v, 0.3), 0, 4)], MONTE);
      }
    }
    // mar abierto
    rellenar(g, 0, 36, W, 32, [MA[1], MA[2], MA[3], MA[4]], (x, y) => 2.8 - (y - 36) * 0.07, 0.45);
    for (let y = 37; y < 66; y++) for (let x = 0; x < W; x++) if ((x * 11 + y * 7) % 41 === 0) g.set(x, y, MA[4]);
    // la ciudad en anillos
    const az = azar(9);
    for (let y = 24; y < 62; y++) for (let x = 0; x < W; x++) {
      const r = radioCiudad(x, y);
      if (r > ANILLOS[0][0]) continue;
      let i = 0;
      while (i < ANILLOS.length - 1 && r <= ANILLOS[i + 1][0]) i++;
      const [rad, tipo] = ANILLOS[i];
      if (tipo === "agua") g.set(x, y, (x * 3 + y * 5) % 13 === 0 ? MA[4] : MA[3]);
      else {
        const ang = Math.atan2((y - CIUDAD.cy) / CIUDAD.k, x - CIUDAD.cx), casa = Math.floor(ang * rad / 5) % 2 === 0 && (r % 11) > 3 && (r % 11) < 7;
        g.set(x, y, casa ? (y < CIUDAD.cy ? HU[2] : HU[3]) : (x * 5 + y * 3) % 7 === 0 ? HO[1] : (y > CIUDAD.cy ? HO[3] : HO[2]));
        if (casa && !(radioCiudad(x, y - 1) % 11 > 3 && radioCiudad(x, y - 1) % 11 < 7)) g.set(x, y, TE[3]);
      }
    }
    // muros en el borde de cada anillo de tierra (bronce, estaño, oricalco), con su cara delantera
    for (const [rad, tipo, ram] of ANILLOS) {
      if (!ram) continue;
      for (let x = 0; x < W; x++) {
        const dx = x - CIUDAD.cx;
        if (Math.abs(dx) > rad) continue;
        const dy = Math.sqrt(rad * rad - dx * dx) * CIUDAD.k;
        const yf = Math.round(CIUDAD.cy + dy), yb = Math.round(CIUDAD.cy - dy);
        g.set(x, yf, ram[3]).set(x, yf + 1, ram[2]).set(x, yf + 2, ram[1]);
        if (x % 7 === 0) g.set(x, yf - 1, ram[4]);
        g.set(x, yb, ram[3]);
      }
    }
    // puente que cruza los anillos por delante
    for (let y = Math.round(CIUDAD.cy + 33 * CIUDAD.k); y < Math.round(CIUDAD.cy + 77 * CIUDAD.k) + 3; y++) {
      for (let x = 97; x < 104; x++) g.set(x, y, x === 97 ? MM[1] : x === 103 ? MM[0] : MM[3]);
      g.set(96, y, MA[1]);
    }
    for (const yy of [Math.round(CIUDAD.cy + 44 * CIUDAD.k), Math.round(CIUDAD.cy + 66 * CIUDAD.k)]) {
      capa().rect(95, yy - 3, 3, 4).rect(103, yy - 3, 3, 4).pintar(g, MM, { relieve: 1, separar: 1 });
      g.set(96, yy - 4, OR[4]).set(104, yy - 4, OR[4]);
    }
    templo(g, CIUDAD.cx, 38);
    // muelle de piedras blancas, negras y rojas
    for (let y = 64; y < 72; y++) for (let x = 0; x < W; x++) g.set(x, y, y === 64 ? MM[2] : y === 65 ? MM[1] : y === 71 ? NE[1] : ((x + (y > 67 ? 6 : 0)) % 12 === 0 ? NE[3] : MM[0]));
    for (let x = 0; x < W; x++) if (x % 24 === 5) { capa().ell(x, 68, 1.8, 1.4).quitarEll(x, 68, 0.7, 0.5).pintar(g, B, { relieve: 1, min: 2 }); }
    piedrasTricolor(g);
  }
  function piedrasTricolor(g) {
    const filas = [3, 4, 4, 5, 6, 7, 8, 9], ancho = 20, vx = 96, yh = -60, rams = [MM, MM, TE, MM, NE, MM, TE];
    let ya = 72;
    filas.forEach((alto, f) => {
      for (let y = ya; y < ya + alto && y < H; y++) {
        const esc = (y - yh) / (H - yh);
        for (let x = 0; x < W; x++) {
          const u = vx + (x - vx) / esc + f * 7, k = Math.floor(u / ancho), k1 = Math.floor((vx + (x + 1 - vx) / esc + f * 7) / ancho);
          const ram = rams[(((k * 3 + f * 5) % 7) + 7) % 7];
          let v = ram === NE ? 3 : ram === TE ? 1.6 : 0.6;
          if (y === ya || k1 !== k) { v -= 1.4; if (ram === MM) { g.set(x, y, NE[2], NE); continue; } }
          else if (y === ya + 1) v += 0.5;
          g.set(x, y, ram[lim(Math.round(v - (y - 72) * 0.01), 0, 4)], ram);
        }
      }
      ya += alto;
    });
  }
  function templo(g, cx, base) {
    // muralla de oricalco de la isla central y el templo de Poseidón
    const x0 = cx - 15, x1 = cx + 15;
    capa().rect(x0 - 2, base, 35, 3).pintar(g, OR, { relieve: 1, separar: 1 });
    for (let x = x0 - 2; x < x1 + 3; x++) g.set(x, base, OR[4]);
    capa().rect(x0, base - 9, 31, 9).pintar(g, OR, { relieve: 1.5, sesgo: -0.1 });
    for (let x = x0 + 1; x < x1; x += 3) for (let y = base - 8; y < base; y++) { g.set(x, y, x < cx ? OR[4] : OR[3]); g.set(x + 1, y, OR[x < cx ? 3 : 2]); g.set(x + 2, y, OR[1]); }
    for (let x = x0 - 1; x < x1 + 2; x++) { g.set(x, base - 10, OR[4]); g.set(x, base - 11, OR[2]); g.set(x, base - 12, OR[3]); }
    for (let j = 0; j < 7; j++) for (let x = x0 + j * 2 - 1; x <= x1 - j * 2 + 1; x++) g.set(x, base - 13 - j, j === 0 ? OR[1] : x < cx ? OR[4 - (j > 4 ? 1 : 0)] : OR[2]);
    for (let x = cx - 3; x <= cx + 3; x++) g.set(x, base - 15, PL[3]);
    g.set(cx, base - 20, B[4]).set(cx, base - 21, B[4]).set(cx - 1, base - 20, B[3]).set(x0 - 1, base - 14, B[4]).set(x1 + 1, base - 14, B[4]);
    // brillo del oricalco
    for (const [x, y] of [[x0 + 2, base - 7], [x0 + 5, base - 4], [cx - 6, base - 16]]) g.set(x, y, R.tela.ocre[4]);
    // palacios menores
    for (const [x, w, h] of [[cx - 26, 7, 5], [cx + 20, 8, 6], [cx - 20, 5, 4], [cx + 29, 5, 3]]) {
      capa().rect(x, base - h + 1, w, h).pintar(g, HU, { relieve: 1.2, max: 3 });
      for (let k = -1; k <= w; k++) g.set(x + k, base - h, TE[2]);
    }
  }

  function atlantidaAnim(ctx, t) {
    for (let i = 0; i < 30; i++) {
      const x = (i * 41 + 7) % W, y = 52 + ((i * 7) % 12);
      if (radioCiudad(x, y) < 79) continue;
      const v = Math.sin(t / 340 + i * 2.1);
      if (v < 0.35) continue;
      ctx.fillStyle = v > 0.8 ? HU[4] : AZ[4];
      ctx.fillRect(x + Math.round(Math.sin(t / 1000 + i) * 2), y, v > 0.65 ? 3 : 2, 1);
    }
    // destello que recorre el tejado de oricalco
    const p = (t / 2600) % 1;
    if (p < 0.4) { ctx.fillStyle = R.tela.ocre[4]; ctx.fillRect(Math.round(86 + p * 70), 24 + Math.round(p * 2), 1, 1); }
  }

  /* ---------- El palacio de oricalco de Atlas ---------- */
  const BRASEROS = [[22, 47], [170, 47]];
  const luzPalacio = (x, y) => lim(BRASEROS.reduce((v, [bx, by]) => v + Math.max(0, 1 - Math.hypot((x - bx) / 46, (y - by) / 38)) ** 1.5, 0) + Math.max(0, 1 - Math.hypot((x - 96) / 40, (y - 30) / 40)) ** 2 * 0.5);
  const COLUMNAS_PALACIO = [8, 40, 146, 178];

  function columnaRoja(g, x, y0, y1, w = 7) {
    for (let y = y0 + 4; y < y1 - 4; y++) for (let i = 0; i < w; i++) {
      const v = [2.2, 3.1, 3, 2.6, 2.1, 1.6, 1.1][Math.min(i, 6)] + luzPalacio(x + i, y) * 0.8 - (i % 2 && y % 3 === 0 ? 0.3 : 0);
      g.set(x + i, y, GR[lim(tono(x + i, y, v, 0.3), 0, 4)], GR);
    }
    for (const yy of [y0 + 12, y1 - 12]) for (let i = 0; i < w; i++) g.set(x + i, yy, OR[3]).set(x + i, yy + 1, OR[1]);
    capa().rect(x - 2, y0, w + 4, 2).rect(x - 1, y0 + 2, w + 2, 2).pintar(g, OR, { relieve: 1.5, separar: 1 });
    for (let i = -1; i <= w; i += 2) g.set(x + i, y0 + 3, B[4]);
    capa().rect(x - 1, y1 - 4, w + 2, 2).rect(x - 2, y1 - 2, w + 4, 2).pintar(g, OR, { relieve: 1.5, separar: 1 });
  }
  function brasero(g, x, y) {
    capa().linea(x, y + 3, x - 6, 71, 1).linea(x, y + 3, x + 6, 71, 1).linea(x, y + 3, x, 71, 1).pintar(g, B, { plano: 2 });
    for (const dx of [-6, 0, 6]) g.set(x + dx, 71, B[3]).set(x + dx - 1, 71, B[2]);
    capa().rect(x - 4, y + 12, 9, 1).pintar(g, B, { plano: 2 });
    conBorde(g, NE[0], tmp => {
      capa().ell(x, y + 1, 7, 3).quitarRect(0, 0, W, y).rect(x - 8, y - 1, 17, 2).pintar(tmp, B, { relieve: 2, luz: [-0.5, -0.6, 0.6] });
      for (let i = -7; i <= 7; i++) tmp.set(x + i, y - 1, i % 3 ? F[2] : F[1], F);
    });
  }
  function poseidon(g, cx, by) {
    const OROS = B;
    conBorde(g, NE[0], tmp => {
      const c = capa();
      c.ell(cx, by - 41, 2.6, 3);
      c.poly([[cx - 2.5, by - 39], [cx + 2.5, by - 39], [cx + 2, by - 35], [cx, by - 34], [cx - 2, by - 35]]);
      c.poly([[cx - 6, by - 36], [cx + 6, by - 36], [cx + 5, by - 26], [cx + 4, by - 22], [cx - 4, by - 22], [cx - 5, by - 26]]);
      c.linea(cx + 5, by - 35, cx + 9, by - 29, 2).linea(cx + 9, by - 29, cx + 10, by - 38, 2);
      c.linea(cx - 5, by - 35, cx - 8, by - 28, 2).linea(cx - 8, by - 28, cx - 7, by - 22, 2);
      c.poly([[cx - 4.5, by - 23], [cx + 4.5, by - 23], [cx + 5, by - 14], [cx - 5, by - 14]]);
      c.linea(cx - 2, by - 14, cx - 3, by - 2, 2.5).linea(cx + 2, by - 14, cx + 3, by - 2, 2.5);
      c.rect(cx - 5, by - 2, 4, 2).rect(cx + 2, by - 2, 4, 2);
      c.pintar(tmp, OROS, { relieve: 3, luz: [-0.6, -0.6, 0.6] });
      // manto, barba, corona y tridente
      const manto = capa().poly([[cx - 6, by - 36], [cx - 3, by - 36], [cx + 5, by - 22], [cx + 5, by - 13], [cx - 1, by - 17], [cx - 6, by - 26]]);
      manto.pintar(tmp, GR, { relieve: 2, max: 3, luz: [-0.6, -0.6, 0.6] });
      for (let k = 0; k < 4; k++) tmp.set(cx - 3 + k * 2, by - 23 + k * 2, GR[1], GR);
      for (const [x, y] of [[cx - 1, by - 37], [cx, by - 36], [cx + 1, by - 37], [cx - 2, by - 38], [cx + 2, by - 38], [cx, by - 37]]) tmp.set(x, y, OROS[1], OROS);
      for (let k = -2; k <= 2; k++) tmp.set(cx + k, by - 44, OR[4], OR);
      tmp.set(cx - 2, by - 45, OR[4], OR).set(cx, by - 46, OR[4], OR).set(cx + 2, by - 45, OR[4], OR);
      tmp.set(cx - 1, by - 41, NE[1], NE).set(cx + 1, by - 41, NE[1], NE);
      capa().rect(cx + 10, by - 48, 1, 46).pintar(tmp, OR, { plano: 3 });
      capa().rect(cx + 7, by - 48, 7, 1).rect(cx + 7, by - 52, 1, 4).rect(cx + 13, by - 52, 1, 4).rect(cx + 10, by - 54, 1, 6).pintar(tmp, OR, { plano: 4 });
      tmp.set(cx + 7, by - 53, OR[4], OR).set(cx + 13, by - 53, OR[4], OR).set(cx + 10, by - 55, OR[4], OR);
    });
  }

  function palacio(g) {
    g.rect(0, 0, W, H, GR[1]);
    // techo artesonado
    for (let y = 0; y < 9; y++) for (let x = 0; x < W; x++) {
      const k = x % 16, caja = k > 1 && k < 15 && y > 1 && y < 8;
      g.set(x, y, caja ? (y === 2 || k === 2 ? NE[1] : GR[1]) : OR[y === 8 ? 1 : 2]);
    }
    for (let x = 8; x < W; x += 16) g.set(x, 4, B[4]).set(x - 1, 5, B[3]).set(x + 1, 5, B[3]).set(x, 6, B[3]).set(x, 5, OR[3]);
    // friso con greca de oro
    for (let y = 9; y < 20; y++) for (let x = 0; x < W; x++) g.set(x, y, y === 9 || y === 19 ? OR[3] : GR[1]);
    greca(g, 0, W, 11, B[3]);
    for (let x = 0; x < W; x++) g.set(x, 20, NE[1]);
    // pared con placas de oricalco
    rellenar(g, 0, 21, W, 51, GR, (x, y) => 1.1 + luzPalacio(x, y) * 1.6 - (y > 60 ? 0.4 : 0), 0.2);
    for (const [x0, x1] of [[16, 37], [48, 70], [122, 143], [154, 176]]) {
      for (let y = 26; y < 60; y++) for (let x = x0; x < x1; x++) {
        const marco = y === 26 || y === 59 || x === x0 || x === x1 - 1;
        const v = marco ? 3.2 : 1.6 + luzPalacio(x, y) * 1.4 + (y < 30 ? 0.5 : 0);
        g.set(x, y, OR[lim(tono(x, y, v, 0.2), 0, 4)], OR);
      }
      const cx = (x0 + x1) / 2;
      for (let a = 0; a < 6.28; a += 0.3) g.set(Math.round(cx + Math.cos(a) * 5), Math.round(42 + Math.sin(a) * 6), OR[3]);
      g.set(Math.round(cx), 42, B[4]);
    }
    // ábside oscuro detrás del dios
    const abside = capa().rect(74, 30, 45, 42).ell(96.5, 30, 22.5, 14);
    cada(abside, (x, y) => g.set(x, y, tono(x, y, 0.4 + Math.max(0, 1 - Math.hypot((x - 96) / 22, (y - 34) / 30)) * 1.4, 0.4) > 0 ? NE[2] : NE[1]));
    cada(abside, (x, y) => { if (!abside.tiene(x, y - 1) || !abside.tiene(x - 1, y) || !abside.tiene(x + 1, y)) g.set(x, y, OR[3]); });
    for (let a = 0; a < 3.14; a += 0.12) g.set(Math.round(96.5 - Math.cos(a) * 24), Math.round(30 - Math.sin(a) * 15.5), B[3]);
    // pedestal y estatua de Poseidón
    capa().rect(84, 62, 25, 10).pintar(g, NE, { relieve: 2, max: 3, separar: 1 });
    for (let x = 84; x < 109; x++) { g.set(x, 62, OR[3]); g.set(x, 63, OR[1]); g.set(x, 70, OR[2]); }
    for (let x = 88; x < 106; x += 4) g.set(x, 66, OR[3]).set(x + 1, 66, OR[2]);
    poseidon(g, 95, 62);
    for (const x of COLUMNAS_PALACIO) columnaRoja(g, x, 21, 72);
    for (const [x, y] of BRASEROS) brasero(g, x, y);
    // suelo pulido en damero, con reflejos
    for (let y = 72; y < H; y++) {
      const esc = (y - 20) / (H - 20);
      for (let x = 0; x < W; x++) {
        const u = (x - 96) / esc, prof = 400 / (y - 20);
        const casilla = (Math.floor(u / 16) + Math.floor(prof * 2.2)) & 1;
        const ram = casilla ? OR : NE;
        let t = (casilla ? 1.2 : 2) + luzPalacio(x, 60) * 1.1 - (y - 72) * 0.012;
        g.set(x, y, ram[lim(tono(x, y, t, 0.12), 0, 4)], ram);
        // reflejos en el suelo pulido: columnas, braseros y la estatua, cada uno con su color
        const lejos = (y - 72) / 22;
        let refl = null;
        for (const cxl of COLUMNAS_PALACIO) if (x >= cxl + 1 && x < cxl + 6) refl = [GR, x < cxl + 3 ? 2 : 1];
        for (const [bx] of BRASEROS) if (Math.abs(x - bx) < 3 && y < 84) refl = [F, 1];
        if (x > 89 && x < 101 && y < 90) refl = [B, 1];
        if (refl && umbral(x, y) > lejos && (y & 1 || lejos < 0.4)) g.set(x, y, refl[0][refl[1] + (lejos < 0.25 ? 1 : 0)], refl[0]);
      }
    }
    for (let x = 0; x < W; x++) { g.set(x, 72, OR[3]); g.set(x, 73, OR[1]); }
  }

  function palacioAnim(ctx, t) {
    for (const [x, y] of BRASEROS) {
      lengua(ctx, x - 4, y - 2, 7, 10, t, x * 0.1);
      lengua(ctx, x + 3, y - 2, 7, 9, t, x * 0.1 + 2.5);
      lengua(ctx, x, y - 2, 9, 14, t, x * 0.1 + 4.6);
      chispas(ctx, x, y - 10, 3, 18, t, x * 0.01);
    }
    const p = (t / 3100) % 1;
    if (p < 0.12) { ctx.fillStyle = B[4]; ctx.fillRect(91 + Math.round(p * 40), 22, 1, 1); ctx.fillRect(90 + Math.round(p * 40), 23, 1, 1); }
  }

  /* ---------- El mundo de las Ideas ---------- */
  const MG = R.magia;
  const VACIO = [SO[0], SO[1], SO[2], MG[1], SO[3], MG[2]];
  const SOL_BIEN = [158, 24];
  /* Los cinco sólidos: cada uno se obtiene de sus vértices y de los de su dual (que dan las normales de las caras). */
  const FI = (1 + Math.sqrt(5)) / 2;
  const signos = (base, n) => { const out = []; for (let m = 0; m < 1 << n; m++) out.push(base(m)); return out; };
  const V_TETRA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  const V_CUBO = signos(m => [m & 1 ? 1 : -1, m & 2 ? 1 : -1, m & 4 ? 1 : -1], 3);
  const V_OCTA = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const V_ICOSA = [].concat(...[0, 1, 2].map(r => signos(m => { const v = [0, m & 1 ? FI : -FI, m & 2 ? 1 : -1]; return [v[(3 - r) % 3], v[(4 - r) % 3], v[(5 - r) % 3]]; }, 2)));
  const V_DODECA = V_CUBO.concat(...[0, 1, 2].map(r => signos(m => { const v = [0, m & 1 ? 1 / FI : -1 / FI, m & 2 ? FI : -FI]; return [v[(3 - r) % 3], v[(4 - r) % 3], v[(5 - r) % 3]]; }, 2)));
  const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function caras(V, N) {
    return N.map(n => {
      const m = Math.max(...V.map(v => punto(v, n)));
      const idx = V.map((v, i) => [i, punto(v, n)]).filter(([, d]) => d > m - 1e-6).map(([i]) => i);
      const c = [0, 1, 2].map(k => idx.reduce((s, i) => s + V[i][k], 0) / idx.length);
      const nl = Math.hypot(...n), nn = n.map(v => v / nl);
      const u0 = V[idx[0]].map((v, k) => v - c[k]), ul = Math.hypot(...u0), u = u0.map(v => v / ul);
      const w = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]];
      idx.sort((i, j) => {
        const di = V[i].map((v, k) => v - c[k]), dj = V[j].map((v, k) => v - c[k]);
        return Math.atan2(punto(di, w), punto(di, u)) - Math.atan2(punto(dj, w), punto(dj, u));
      });
      return { idx, n: nn };
    });
  }
  const SOLIDOS = [
    { V: V_TETRA, N: V_TETRA.map(v => v.map(c => -c)), x: 24, y: 30, tam: 7.6, giro: [1.15, -0.3, 3.5], ram: F },
    { V: V_CUBO, N: V_OCTA, x: 58, y: 18, tam: 5.6, giro: [0.62, 0.78, 0], ram: HO },
    { V: V_OCTA, N: V_CUBO, x: 93, y: 36, tam: 9.5, giro: [0.35, 0.55, 0.15], ram: R.plata },
    { V: V_ICOSA, N: V_DODECA, x: 124, y: 17, tam: 6.4, giro: [0.3, 0.45, 0.1], ram: MA },
    { V: V_DODECA, N: V_ICOSA, x: 180, y: 52, tam: 6.2, giro: [0.4, 0.3, 0.2], ram: MG }
  ];
  const LUZ_BIEN = (() => { const l = [0.55, 0.62, 0.56], n = Math.hypot(...l); return l.map(v => v / n); })();
  function girar([x, y, z], [a, b, c]) {
    let t;
    t = y * Math.cos(a) - z * Math.sin(a); z = y * Math.sin(a) + z * Math.cos(a); y = t;
    t = x * Math.cos(b) + z * Math.sin(b); z = -x * Math.sin(b) + z * Math.cos(b); x = t;
    t = x * Math.cos(c) - y * Math.sin(c); y = x * Math.sin(c) + y * Math.cos(c); x = t;
    return [x, y, z];
  }
  /* Pinta un sólido platónico con caras planas, aristas encendidas y contorno (en una rejilla pequeña). */
  const LADO = 48;
  function pintarSolido(g, so, dy = 0) {
    if (!so.caras) so.caras = caras(so.V, so.N);
    const ox = Math.round(so.x) - LADO / 2, oy = Math.round(so.y + dy) - LADO / 2;
    const tmp = new Rejilla(LADO, LADO), cara = new Int16Array(LADO * LADO).fill(-1), tonos = [];
    const P_ = so.V.map(v => { const r = girar(v, so.giro); return [so.x - ox + r[0] * so.tam, so.y + dy - oy - r[1] * so.tam]; });
    so.caras.forEach(({ idx, n }, i) => {
      const nr = girar(n, so.giro);
      if (nr[2] <= 0.02) return;
      const l = punto(nr, LUZ_BIEN), t = l > 0.85 ? 4 : l > 0.55 ? 3 : l > 0.2 ? 2 : 1;
      tonos[i] = t;
      const c = new Capa(LADO, LADO).poly(idx.map(k => [P_[k][0] - 0.5, P_[k][1] - 0.5]));
      for (let j = 0; j < c.m.length; j++) if (c.m[j]) { tmp.c[j] = so.ram[t]; tmp.r[j] = so.ram; cara[j] = i; }
    });
    for (let y = 0; y < LADO - 1; y++) for (let x = 0; x < LADO - 1; x++) {
      const j = y * LADO + x, i = cara[j];
      if (i < 0) continue;
      const d = cara[j + 1], b = cara[j + LADO], otra = d >= 0 && d !== i ? d : b >= 0 && b !== i ? b : -1;
      if (otra >= 0) tmp.set(x, y, so.ram[Math.min(4, Math.max(tonos[i], tonos[otra]) + 1)], so.ram);
    }
    tmp.contorno(SO[0]);
    g.pegar(tmp, ox, oy);
  }
  const cajaSolido = so => [Math.round(so.x) - LADO / 2, Math.round(so.y) - LADO / 2 - 2, Math.round(so.x) + LADO / 2, Math.round(so.y) + LADO / 2 + 2];
  const ideasCache = { fondo: null, base: null, saltos: null, destellos: [] };

  function ideas(g) {
    rellenar(g, 0, 0, W, 66, VACIO, (x, y) => 0.4 + Math.pow(y / 64, 1.6) * 4.6 + Math.max(0, 1 - Math.hypot(x - SOL_BIEN[0], y - SOL_BIEN[1]) / 60) * 1.4, 0.5);
    // estrellas; algunas, lejos de los sólidos, titilarán
    const az = azar(61);
    ideasCache.destellos = [];
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(az() * W), y = Math.floor(az() * 60), k = az();
      if (Math.hypot(x - SOL_BIEN[0], y - SOL_BIEN[1]) < 20) continue;
      if (ideasCache.destellos.length < 10 && Math.hypot(x - SOL_BIEN[0], y - SOL_BIEN[1]) > 28 && SOLIDOS.every(so => Math.hypot(x - so.x, y - so.y) > so.tam * 2.2 + 4)) ideasCache.destellos.push([x, y]);
      g.set(x, y, k < 0.6 ? MG[3] : k < 0.9 ? HU[3] : HU[4]);
      if (k > 0.94) { g.set(x - 1, y, MG[2]).set(x + 1, y, MG[2]).set(x, y - 1, MG[2]).set(x, y + 1, MG[2]); }
    }
    // el Sol del Bien
    const [sx, sy] = SOL_BIEN;
    rellenar(g, sx - 20, sy - 20, 41, 41, [MG[2], MG[3], B[3], B[4]], (x, y) => { const d = Math.hypot(x - sx, y - sy); return d < 19 ? (19 - d) / 4.5 : null; }, 0.55);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.2832, largo = k % 2 ? 15 : 20;
      for (let r = 9; r < largo; r++) g.set(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), r < 13 ? HU[4] : k % 2 ? B[3] : B[4]);
    }
    capa().ell(sx, sy, 8, 8).pintar(g, [B[4]], { plano: 0 });
    capa().ell(sx, sy, 6.5, 6.5).pintar(g, [HU[4]], { plano: 0 });
    // horizonte luminoso y suelo de baldosas en perspectiva
    for (let y = 60; y < 66; y++) for (let x = 0; x < W; x++) if (tono(x, y, (y - 59) / 6 * 2, 1) > 0) g.set(x, y, y > 63 ? MG[3] : MG[2]);
    for (let x = 0; x < W; x++) { g.set(x, 65, MG[3]); g.set(x, 66, MG[4]); }
    for (let y = 67; y < H; y++) {
      const d = y - 62, Z = 150 / d, Z1 = 150 / (d + 1);
      for (let x = 0; x < W; x++) {
        const niebla = lim((24 - d) / 9);
        if (niebla > 0 && umbral(x, y) < niebla) { g.set(x, y, [SO[2], MG[1], MG[2]][lim(tono(x, y, 2.4 - d / 9, 1), 0, 2)]); continue; }
        const X = ((x - 96) * 2.5) / d, X1 = ((x + 1 - 96) * 2.5) / d;
        const i = Math.floor(X), j = Math.floor(Z);
        const linea = Math.floor(X1) !== i || Math.floor(Z1) !== j;
        const encendida = ((i * 7 + j * 13) % 11 + 11) % 11 === 0;
        let col = (i + j) & 1 ? SO[2] : SO[1];
        if (encendida) col = MG[1];
        if (linea) col = y > 92 ? MG[3] : MG[2];
        if (Math.floor(X1) !== i && Math.floor(Z1) !== j) col = MG[4];
        g.set(x, y, col);
      }
    }
    ideasCache.fondo = g.copia();
    for (const so of SOLIDOS) pintarSolido(g, so, 0);
    ideasCache.base = g.copia();
    ideasCache.saltos = null;
  }

  function solidoMovido(i, dy) {
    const m = ideasCache.saltos[i];
    if (!m[dy]) {
      const so = SOLIDOS[i], [x0, y0, x1, y1] = cajaSolido(so), v = ideasCache.base.copia();
      for (let y = y0 - 3; y < y1 + 3; y++) for (let x = x0; x < x1; x++) if (v.dentro(x, y)) v.set(x, y, ideasCache.fondo.get(x, y));
      pintarSolido(v, so, dy);
      m[dy] = diferencias(ideasCache.base, v, x0, y0 - 3, x1, y1 + 3);
    }
    return m[dy];
  }
  function ideasAnim(ctx, t) {
    if (!ideasCache.fondo) ideas(new Rejilla(W, H));
    if (!ideasCache.saltos) ideasCache.saltos = SOLIDOS.map(() => ({}));
    // cada sólido sube un segundo y baja otro, por turnos: nunca se mueven más de dos a la vez
    const tramo = Math.floor(t / 500) % 10;
    SOLIDOS.forEach((so, i) => {
      const sube = tramo === 2 * i || tramo === 2 * i + 1, baja = tramo === (2 * i + 5) % 10 || tramo === (2 * i + 6) % 10;
      if (sube || baja) dibujarTiras(ctx, solidoMovido(i, sube ? -1 : 1));
    });
    // rayos del Sol del Bien que laten
    const [sx, sy] = SOL_BIEN;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.2832, base = k % 2 ? 15 : 20, extra = Math.round(2 + 2 * Math.sin(t / 420 - k * 0.8));
      ctx.fillStyle = k % 2 ? B[3] : B[4];
      for (let r = base; r < base + extra; r++) ctx.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), 1, 1);
    }
    // destellos de estrellas
    ideasCache.destellos.forEach(([x, y], i) => {
      const v = Math.sin(t / 500 + i * 2.3);
      if (v < 0.7) return;
      ctx.fillStyle = HU[4]; ctx.fillRect(x, y, 1, 1);
      if (v > 0.93) { ctx.fillStyle = MG[3]; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
    });
  }

  return {
    taberna: { base: taberna, anim: tabernaAnim },
    caverna: { base: caverna, anim: cavernaAnim },
    salida: { base: salida, anim: salidaAnim },
    superficie: { base: superficie, anim: superficieAnim },
    agora: { base: agora, anim: agoraAnim },
    pireo: { base: pireo, anim: pireoAnim },
    banquete: { base: banquete, anim: banqueteAnim },
    mar: { base: mar, anim: marAnim },
    atlantida: { base: atlantida, anim: atlantidaAnim },
    palacio: { base: palacio, anim: palacioAnim },
    ideas: { base: ideas, anim: ideasAnim }
  };
})();
