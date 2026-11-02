/* Dados y Mazmorras · mapa ilustrado de Valdren (256×144).
   Un pergamino viejo con la costa, el mar, los montes, el Bosque Susurrante, Villabruma, el puente del trol,
   la Cripta de los Reyes Olvidados, el castillo de Varkhul en su risco, el Pico Cenizo con la forja de
   Barak-Thur y, en el rincón del sureste, la grieta del Abismo.
   window.MUNDO = { W, H, base(g), anim(ctx, t), puntos, camino }:
   · base(g) pinta el mapa fijo en una Rejilla de 256×144 (sin píxeles vacíos).
   · anim(ctx, t) dibuja encima los detalles animados (olas, humo, la grieta que late, nubes); t en milisegundos.
   · puntos: un destino por acto, en orden (puente, cripta, castillo, guarida del dragón, grieta).
   · camino: polilínea por tierra que une Villabruma con los cinco destinos. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral } = PX;
  const W = 256, H = 144;
  const lim = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const M = R.madera, F = R.fuego, MG = R.magia, HU = R.hueso;

  /* Rampas del mapa: tonos apagados, como tinta y acuarela sobre pergamino. */
  const TINTA = "#24160c";
  const PERG = ["#5a3e22", "#86643a", "#b08c58", "#d2b47c", "#e8d4a0"];      // pergamino
  const MAR = ["#142a32", "#1d3b44", "#2a5256", "#416e66", "#68907c"];        // mar entintado
  const PRADO = ["#383a1c", "#565b2a", "#787c3a", "#9c9b52", "#c0b874"];      // praderas
  const SUELO_B = ["#1f2a14", "#2e3d1e", "#435428", "#5e6e36", "#7e8a48"];    // suelo del bosque
  const ALTO = ["#46361f", "#6a5536", "#8e744a", "#b09862", "#ceb884"];       // tierras altas
  const ARENA = ["#76603c", "#9c8352", "#bfa56e", "#d9c28c", "#ecdaa8"];      // playa
  const CENIZA = ["#1c1513", "#30221c", "#483228", "#644636", "#84624c"];     // tierra quemada
  const VACIO = ["#0a0510", "#1a0c24", "#2c1538", "#462158", "#6c3a84"];      // tierra corrompida
  const ROCA = ["#2c241e", "#4a3e33", "#71624d", "#9a8868", "#c4b08a"];       // montes
  const NIEVE = ["#4e4e58", "#7e7e88", "#aeaaa6", "#d6d0c2", "#f2ecdc"];
  const COPA = ["#142010", "#213419", "#355024", "#4f6e32", "#76944a"];       // copas de árbol
  const PINO = ["#0f1a12", "#18291b", "#273f28", "#3a5a36", "#587a48"];
  const GRIS = ["#17181c", "#2a2b31", "#43454c", "#63666c", "#8e9094"];       // piedra del castillo
  const TEJA = ["#2a0c0c", "#4a1512", "#73241a", "#a33a26", "#c95a3a"];       // tejados de Villabruma
  const ESPECTRO = ["#0b1618", "#122e2d", "#1f5450", "#3b8a7a", "#8cd6ba"];   // fuego verde del liche
  const MESA = ["#120a06", "#1e120a", "#2a1a10"];                              // la mesa bajo el pergamino

  /* ---------- Azar determinista y ruido ---------- */
  function hash(i, j, s = 0) {
    let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function ruido(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, s = 0) => ruido(x, y, s) * 0.55 + ruido(x * 2.1, y * 2.1, s + 7) * 0.3 + ruido(x * 4.3, y * 4.3, s + 13) * 0.15;
  const tono = (x, y, v, s = 1) => Math.floor(v + 0.5 + (umbral(x, y) - 0.5) * s);
  const pon = (g, x, y, ram, v, s = 1) => g.set(x, y, ram[lim(tono(x, y, v, s), 0, ram.length - 1)], ram);
  function desplazar(g, x, y, d) {
    if (!d) return;
    const ram = g.rampa(x, y);
    if (!ram) return;
    const k = ram.indexOf(g.get(x, y));
    if (k >= 0) g.set(x, y, ram[lim(k + d, 0, ram.length - 1)], ram);
  }
  /* Distancia de un punto a una polilínea; devuelve [distancia, parámetro 0..1 a lo largo]. */
  function distPoli(px, py, pts) {
    let mejor = 1e9, par = 0, total = 0;
    const largos = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); largos.push(l); total += l; }
    let acum = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const u = lim(((px - ax) * dx + (py - ay) * dy) / l2);
      const d = Math.hypot(px - ax - u * dx, py - ay - u * dy);
      if (d < mejor) { mejor = d; par = (acum + u * largos[i - 1]) / total; }
      acum += largos[i - 1];
    }
    return [mejor, par];
  }
  /* Recorre una polilínea píxel a píxel. */
  function recorrer(pts, fn) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
      for (let s = 0; s < n; s++) fn(ax + ((bx - ax) * s) / n, ay + ((by - ay) * s) / n, i, s / n);
    }
    const u = pts[pts.length - 1]; fn(u[0], u[1], pts.length - 1, 1);
  }
  /* Objeto con contorno de tinta: se pinta en una rejilla pequeña (coordenadas del mapa) y se pega. */
  function figura(g, x0, y0, x1, y1, fn, tinta = TINTA) {
    const w = x1 - x0 + 3, h = y1 - y0 + 3, s = new Rejilla(w, h);
    const p = (x, y, col, ram = null) => s.set(x - x0 + 1, y - y0 + 1, col, ram);
    fn(p);
    s.contorno(tinta);
    g.pegar(s, x0 - 1, y0 - 1);
  }

  /* ---------- Geografía ---------- */
  const MARCO = 7;                       // dentro de este margen está el mapa; fuera, el borde del pergamino
  const borde = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y);
  /* La costa: el mar ocupa el oeste, se ensancha al noroeste y entra en una bahía al suroeste. */
  function costa(y) {
    let c = 34 + (fbm(0.5, y / 18, 3) - 0.5) * 16;
    c += Math.max(0, 50 - y) * 0.95;
    c += 30 * Math.exp(-(((y - 132) / 9) ** 2));
    return c;
  }
  const ISLAS = [[17, 76, 6, 3.5], [14, 104, 3, 2]];
  function esTierra(x, y) {
    if (x - costa(y) + (fbm(x / 9, y / 9, 21) - 0.5) * 10 > 0) return true;
    for (const [ix, iy, rx, ry] of ISLAS) {
      const d = ((x - ix) / rx) ** 2 + ((y - iy) / ry) ** 2;
      if (d + (fbm(x / 3, y / 3, 33) - 0.5) * 0.9 < 1) return true;
    }
    return false;
  }

  /* Lugares (coordenadas del mapa). */
  const VILLA = [52, 90], PUENTE = [114, 96], CRIPTA = [146, 110], CASTILLO = [150, 47];
  const VOLCAN = { x: 205, cima: 21, base: 62, ancho: 26 }, FORJA = [184, 66], ABISMO = [224, 113];
  const RIO = [[111, 33], [109, 44], [115, 56], [111, 68], [117, 82], [114, 96], [107, 108], [97, 117], [86, 124], [74, 131], [66, 136]];
  /* La grieta del Abismo cruza en diagonal el rincón del sureste. */
  const GRIETA = [[196, 137], [203, 130], [209, 126], [214, 120], [219, 117], [224, 113], [230, 109], [235, 104], [241, 101], [246, 95], [249, 92]];
  const anchoGrieta = u => 0.6 + 5.2 * Math.pow(Math.sin(Math.PI * u), 0.9);

  const puntos = [[114, 96], [146, 109], [150, 46], [205, 26], [224, 113]];
  const camino = [
    [54, 91], [60, 93], [68, 96], [78, 98], [88, 97], [98, 95], [106, 96], [114, 96],
    [122, 99], [130, 104], [138, 108], [146, 109],
    [153, 104], [157, 96], [154, 87], [157, 78], [154, 70], [151, 62], [150, 54], [150, 46],
    [156, 52], [164, 58], [172, 63], [180, 67], [186, 66], [192, 60], [197, 55], [194, 48], [200, 42], [203, 34], [205, 26],
    [210, 33], [215, 41], [219, 50], [224, 60], [228, 71], [226, 82], [229, 93], [226, 104], [224, 113]
  ];

  /* Altura del terreno (para el sombreado del suelo y para elegir el bioma). */
  function altura(x, y) {
    let h = fbm(x / 22, y / 22, 5) * 0.5;
    h += lim((48 - y) / 34) * (x > 86 ? 1 : lim((x - 60) / 26)) * 0.9;           // la cordillera del norte
    h += Math.exp(-(((x - 148) / 16) ** 2 + ((y - 112) / 9) ** 2)) * 0.45;          // las colinas de la cripta
    h += Math.exp(-(((x - 150) / 12) ** 2 + ((y - 56) / 10) ** 2)) * 0.6;           // el risco del castillo
    const dv = Math.hypot((x - VOLCAN.x) / 30, (y - 44) / 22);
    h += Math.max(0, 1 - dv) * 1.0;
    return h;
  }
  /* Bosque Susurrante: una mancha irregular al este de Villabruma. */
  function enBosque(x, y) {
    const d = Math.hypot((x - 86) / 26, (y - 82) / 20) + (fbm(x / 8, y / 8, 41) - 0.5) * 0.7;
    return d < 1;
  }
  const quemado = (x, y) => lim(1.25 - Math.hypot((x - VOLCAN.x) / 40, (y - 48) / 30) + (fbm(x / 7, y / 7, 51) - 0.5) * 0.5);
  function corrupto(x, y) {
    const [d] = distPoli(x, y, GRIETA);
    return lim(1.2 - d / 15 + (fbm(x / 6, y / 6, 61) - 0.5) * 0.6);
  }

  /* Distancias al otro elemento (mar ↔ tierra), con un barrido de chaflán. */
  function distancias(tierra) {
    const dm = new Float32Array(W * H), dt = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) { dm[i] = tierra[i] ? 0 : 1e6; dt[i] = tierra[i] ? 1e6 : 0; }
    for (const d of [dm, dt]) {
      const D = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1e6 : d[y * W + x]);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x; if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
      }
      for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
        const i = y * W + x; if (!d[i]) continue;
        d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
      }
    }
    return { dm, dt };   // dm: en el mar, distancia a tierra; dt: en tierra, distancia al mar
  }

  /* ---------- Figuras del mapa ---------- */
  /* Monte: triángulo con la ladera izquierda al sol, la derecha rayada a plumilla y nieve en los altos. */
  function monte(g, mx, my, hw, hh, nieve, roca = ROCA) {
    const px = mx + Math.round((hash(mx, my, 1) - 0.5) * hw * 0.6), py = my - hh;
    const sub = hash(mx, my, 2) > 0.45;   // cresta secundaria en la ladera soleada
    figura(g, mx - hw, py, mx + hw, my, p => {
      for (let y = py; y <= my; y++) {
        const t = (y - py) / hh;
        const xl = px + (mx - hw - px) * t, xr = px + (mx + hw - px) * t, cresta = px + (mx + hw * 0.2 - px) * t;
        for (let x = Math.ceil(xl - 0.2); x <= Math.floor(xr + 0.2); x++) {
          const sol = x < cresta;
          let k = sol ? (t < 0.45 ? 4 : 3) : 1;
          if (sol && x < xl + 1.2 && t > 0.3) k = 2;
          if (!sol && (x + y) % 3 === 0) k = 0;
          if (!sol && x < cresta + 1) k = 2;
          if (sub && sol && t > 0.4 && Math.abs(x - (px - hw * 0.5 * (t - 0.4) * 1.6)) < 0.6) k = 1;
          let ram = roca;
          if (nieve && t < 0.32 + (hash(x, 3, mx) - 0.5) * 0.12) { ram = NIEVE; k = sol ? 4 : 2; }
          if (y === my && !sol) k = 0;
          p(x, y, ram[k], ram);
        }
      }
    });
  }
  /* Colina redondeada (más baja que un monte). */
  function colina(g, cx, by, rx, ry, ram = PRADO) {
    figura(g, cx - rx, by - ry, cx + rx, by, p => {
      for (let y = by - ry; y <= by; y++) for (let x = cx - rx; x <= cx + rx; x++) {
        const dx = (x - cx) / (rx + 0.3), dy = (y - by) / (ry + 0.3);
        if (dx * dx + dy * dy > 1) continue;
        const l = -dx * 0.8 - dy * 0.3;
        let k = l > 0.45 ? 4 : l > 0.05 ? 3 : 2;
        if (dx > 0.25 && (x + y) % 3 === 0) k = 1;
        p(x, y, ram[k], ram);
      }
    });
  }
  /* Árbol de copa redonda. */
  function arbol(g, tx, ty, ram = COPA) {
    figura(g, tx - 2, ty - 6, tx + 2, ty, p => {
      for (let y = ty - 6; y <= ty - 2; y++) for (let x = tx - 2; x <= tx + 2; x++) {
        const dx = x - tx, dy = y - (ty - 4);
        if (dx * dx * 0.8 + dy * dy * 0.9 > 4.6) continue;
        const l = -dx - dy;
        p(x, y, ram[l >= 2 ? 4 : l >= 0 ? 3 : l >= -1 ? 2 : 1], ram);
      }
      p(tx, ty - 1, M[1], M); p(tx, ty, M[0], M);
    });
  }
  /* Pino: triángulos apilados. */
  function pino(g, tx, ty, ram = PINO) {
    figura(g, tx - 2, ty - 7, tx + 2, ty, p => {
      const filas = [0, 1, 1, 2, 1, 2, 2];
      filas.forEach((a, j) => { for (let i = -a; i <= a; i++) p(tx + i, ty - 7 + j, ram[i < 0 ? 4 : i === 0 ? 3 : 1], ram); });
      p(tx, ty, M[1], M);
    });
  }
  /* Árbol seco y retorcido (tierras del castillo y del abismo). */
  function seco(g, tx, ty, col = "#3a2a22") {
    figura(g, tx - 2, ty - 6, tx + 2, ty, p => {
      for (let j = 0; j < 5; j++) p(tx, ty - j, col);
      p(tx - 1, ty - 3, col); p(tx - 2, ty - 4, col); p(tx + 1, ty - 4, col); p(tx + 2, ty - 5, col); p(tx - 1, ty - 5, col); p(tx, ty - 6, col);
    });
  }
  /* Casita de Villabruma: muro claro, tejado rojo a dos aguas. */
  function casa(g, x, y, w = 4, alta = 2) {
    figura(g, x, y - alta - 2, x + w - 1, y, p => {
      for (let j = 0; j <= alta; j++) for (let i = 0; i < w; i++) p(x + i, y - j, HU[i === w - 1 ? 2 : 3], HU);
      p(x + 1, y, M[1], M);
      if (w > 3) p(x + w - 2, y - 1, "#f0c050");
      for (let j = 1; j <= 2; j++) for (let i = j - 1; i < w - j + 1; i++) p(x + i, y - alta - j, TEJA[i < w / 2 ? 4 - j : 2], TEJA);
      for (let i = 0; i < w; i++) p(x + i, y - alta - 1, TEJA[i < w / 2 ? 3 : 1], TEJA);
    });
  }

  /* ---------- Pintado del mapa ---------- */
  function base(g) {
    /* 1. Mesa oscura de fondo (asoma por los desgarros del pergamino). */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) pon(g, x, y, MESA, fbm(x / 10, y / 3, 1) * 2.4, 1);

    /* 2. Tierra y mar. */
    const tierra = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tierra[y * W + x] = esTierra(x, y) ? 1 : 0;
    const { dm, dt } = distancias(tierra);
    for (let y = MARCO; y < H - MARCO; y++) for (let x = MARCO; x < W - MARCO; x++) {
      const i = y * W + x;
      if (!tierra[i]) {
        // Mar: más hondo lejos de la costa, con líneas de nivel paralelas a la orilla.
        const d = dm[i], n = fbm(x / 16, y / 10, 71);
        let v = d < 2.2 ? 3.4 : d < 7 ? 2.6 - d * 0.08 : 1.7 - lim((d - 7) / 30) * 0.9 + (n - 0.5) * 1.2;
        if (Math.abs(d - 4.5) < 0.5) v = (x + y) % 2 ? 3 : 2;       // línea de nivel punteada
        if (Math.abs(d - 9) < 0.5 && (x % 3 === 0)) v = 2.6;          // segunda línea, más rala
        pon(g, x, y, MAR, v, 0.8);
        continue;
      }
      // Tierra: bioma por altura y lugar, sombreado por relieve (luz del noroeste).
      const h = altura(x, y), hs = (altura(x - 1, y - 1) - altura(x + 1, y + 1)) * 9;
      const n = (fbm(x / 6, y / 6, 81) - 0.5) * 0.9;
      let ram = PRADO, v = 2.2 + hs + n;
      if (h > 0.78) { ram = ALTO; v = 2.3 + hs + n; }
      if (enBosque(x, y)) { ram = SUELO_B; v = 2 + hs + n; }
      if (dt[i] < 2.2 && h < 0.7) { ram = ARENA; v = 3 + n * 0.5; }
      const q = quemado(x, y), c = corrupto(x, y);
      if (q > umbral(x, y) * 0.9 + 0.05) { ram = CENIZA; v = 2.6 + hs * 0.8 + n * 0.6; }
      if (c > umbral(x, y) * 0.9 + 0.05) { ram = VACIO; v = 2.2 + hs * 0.5 + n * 0.6 - c * 1.2; }
      pon(g, x, y, ram, v, ram === VACIO || ram === CENIZA ? 0.5 : 1);
    }
    // Línea de costa a tinta y espuma clara justo fuera.
    for (let y = MARCO; y < H - MARCO; y++) for (let x = MARCO; x < W - MARCO; x++) {
      const i = y * W + x;
      if (tierra[i] && dt[i] < 1.01) g.set(x, y, TINTA);
      else if (!tierra[i] && dm[i] < 1.5 && (x * 7 + y * 3) % 5) g.set(x, y, MAR[4], MAR);
    }
    // Olas pintadas en mar abierto: pequeñas «uves» de tinta clara.
    const OLA = ["#..#", ".##."];
    for (let k = 0; k < 140; k++) {
      const x = Math.floor(MARCO + 2 + hash(k, 1, 91) * (W - 20)), y = Math.floor(MARCO + 2 + hash(k, 2, 91) * (H - 20));
      if (!dentroMar(dm, tierra, x, y, 4) || (Math.hypot(x - 24, y - 28) < 15) || (y > 120 && x < 64)) continue;
      OLA.forEach((f, j) => { for (let a = 0; a < 4; a++) if (f[a] === "#") g.set(x + a, y + j, MAR[3], MAR); });
    }

    /* 3. Río (de la cordillera a la bahía), con orillas oscuras. */
    const rio = new Capa(W, H);
    recorrer(RIO, (x, y, i) => { const gr = i < 3 ? 1 : i < 7 ? 2 : 3; rio.rect(Math.round(x - (gr - 1) / 2), Math.round(y - (gr - 1) / 2), gr, gr); });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rio.tiene(x, y) && tierra[y * W + x]) {
      const orilla = !rio.tiene(x - 1, y) || !rio.tiene(x, y - 1);
      g.set(x, y, MAR[orilla ? 2 : 3], MAR);
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!rio.tiene(x + a, y + b) && tierra[(y + b) * W + x + a]) desplazar(g, x + a, y + b, -2);
    }
    // Un afluente desde el bosque.
    recorrer([[92, 72], [100, 78], [108, 80], [116, 82]], (x, y) => { g.set(x, y, MAR[3], MAR); desplazar(g, Math.round(x), Math.round(y) + 1, -1); });

    /* 4. Senda de tierra: el camino entre lugares, a puntos claros. */
    recorrer([[48, 89]].concat(camino), (x, y, i, u) => {
      const xi = Math.round(x), yi = Math.round(y);
      if (rio.tiene(xi, yi)) return;
      if ((xi + yi) % 3 !== 0) g.set(xi, yi, ARENA[3], ARENA); else g.set(xi, yi, ARENA[1], ARENA);
    });

    /* 5. La grieta del Abismo: un tajo negro de bordes morados y venas que se extienden por la tierra. */
    const az = PX.azar(77);
    const venas = [];
    for (let k = 0; k < 16; k++) {
      const u = 0.1 + az() * 0.8, idx = Math.floor(u * (GRIETA.length - 1)), a = GRIETA[idx], b = GRIETA[idx + 1], f = u * (GRIETA.length - 1) - idx;
      let x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
      let ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + (az() < 0.5 ? 1 : -1) * (1.1 + az() * 0.9);
      const largo = 6 + az() * 14, v = [];
      for (let s = 0; s < largo; s++) { x += Math.cos(ang); y += Math.sin(ang); ang += (az() - 0.5) * 0.9; v.push([Math.round(x), Math.round(y)]); }
      venas.push(v);
    }
    for (const v of venas) v.forEach(([x, y], s) => {
      if (borde(x, y) < MARCO) return;
      g.set(x, y, s < v.length * 0.5 ? MG[2] : VACIO[4], MG);
      if (s < v.length * 0.3) g.set(x + 1, y, VACIO[3], VACIO);
    });
    for (let y = 80; y < H - MARCO; y++) for (let x = 180; x < W - MARCO; x++) {
      const [d, u] = distPoli(x, y, GRIETA), w = anchoGrieta(u) * (0.85 + (fbm(x / 2.5, y / 2.5, 101) - 0.5) * 0.8);
      if (d < w) {
        const r = d / w;
        const col = r < 0.45 ? "#030106" : r < 0.7 ? "#0e0418" : r < 0.88 ? MG[1] : MG[3];
        g.set(x, y, col, MG);
      } else if (d < w + 1.5) {
        g.set(x, y, umbral(x, y) < 0.6 ? MG[4] : MG[3], MG);
      } else if (d < w + 4 && umbral(x, y) < 0.45 * (1 - (d - w - 1.5) / 2.5)) {
        g.set(x, y, MG[2], MG);
      }
    }

    /* 6. Figuras ordenadas de atrás adelante: montes, colinas, árboles y construcciones. */
    const obj = [];
    const lejosDe = (x, y, r) => distPoli(x, y, camino)[0] > r && distPoli(x, y, RIO)[0] > r * 0.7;
    // La cordillera del norte.
    for (let fila = 0; fila < 4; fila++) {
      const yb = 20 + fila * 8;
      for (let x = 88 + (fila % 2) * 5; x < 250; x += 9 + Math.floor(hash(x, fila, 3) * 4)) {
        const mx = x + Math.round((hash(x, fila, 4) - 0.5) * 4), my = yb + Math.round((hash(x, fila, 5) - 0.5) * 4);
        const hw = 6 + Math.floor(hash(x, fila, 6) * 4) - (fila === 3 ? 1 : 0), hh = 9 + Math.floor(hash(x, fila, 7) * 6) - fila;
        if (Math.hypot(mx - VOLCAN.x, (my - 40) * 1.2) < 30) continue;
        if (Math.hypot(mx - CASTILLO[0], my - CASTILLO[1]) < 14) continue;
        if (distPoli(mx, my - 2, camino)[0] < hw * 0.8) continue;
        if (mx > 106 && mx < 118 && my > 30) continue;   // deja pasar el río
        if (my - hh < MARCO + 1 || mx + hw > W - MARCO - 1) continue;
        obj.push([my, () => monte(g, mx, my, hw, hh, hh > 11)]);
      }
    }
    // Montes sueltos que bajan hacia el oeste y alrededor del castillo.
    [[74, 40, 5, 8], [84, 34, 6, 10], [64, 46, 4, 6], [136, 62, 5, 8], [166, 50, 6, 9], [170, 72, 5, 7], [238, 68, 6, 10], [244, 52, 4, 8], [96, 40, 4, 6]]
      .forEach(([mx, my, hw, hh]) => obj.push([my, () => monte(g, mx, my, hw, hh, hh > 10)]));
    // Colinas de la cripta.
    [[136, 116, 8, 5], [160, 118, 9, 5], [130, 124, 6, 3], [168, 108, 6, 4], [184, 120, 6, 4]]
      .forEach(([cx, by, rx, ry]) => obj.push([by, () => colina(g, cx, by, rx, ry)]));
    // Bosque Susurrante: árboles en grupos apretados.
    for (let y = 60; y < 108; y += 3) for (let x = 56; x < 120; x += 4) {
      const tx = x + Math.floor(hash(x, y, 11) * 3) - ((y / 3) % 2 ? 2 : 0), ty = y + Math.floor(hash(x, y, 12) * 2);
      if (!enBosque(tx, ty) || !tierra[ty * W + tx] || !lejosDe(tx, ty, 3)) continue;
      if (Math.hypot(tx - VILLA[0], ty - VILLA[1]) < 11) continue;
      obj.push([ty, () => arbol(g, tx, ty, hash(tx, ty, 13) < 0.2 ? PINO : COPA)]);
    }
    // Pinares al pie de la cordillera y arboledas sueltas.
    for (let k = 0; k < 90; k++) {
      const tx = Math.floor(60 + hash(k, 1, 14) * 180), ty = Math.floor(34 + hash(k, 2, 14) * 96);
      const i = ty * W + tx;
      if (!tierra[i] || dt[i] < 3 || enBosque(tx, ty) || !lejosDe(tx, ty, 4)) continue;
      if (quemado(tx, ty) > 0.3 || corrupto(tx, ty) > 0.25) continue;
      if (Math.hypot(tx - CASTILLO[0], ty - 52) < 13 || Math.hypot(tx - CRIPTA[0], ty - CRIPTA[1]) < 10 || Math.hypot(tx - VILLA[0], ty - VILLA[1]) < 10) continue;
      const h = altura(tx, ty);
      if (h > 0.9) continue;
      // cada árbol suelto arrastra dos o tres compañeros: grupos, no confeti
      const n = 1 + Math.floor(hash(k, 3, 14) * 3);
      for (let j = 0; j < n; j++) {
        const ax = tx + [0, 3, -2, 2][j], ay = ty + [0, 1, 2, -2][j];
        if (!tierra[ay * W + ax]) continue;
        obj.push([ay, () => (h > 0.55 ? pino(g, ax, ay) : arbol(g, ax, ay))]);
      }
    }
    // Árboles secos: junto al castillo y al borde del abismo.
    [[140, 70], [162, 66], [168, 62], [145, 76], [200, 104], [236, 122], [208, 98], [244, 112], [176, 76]]
      .forEach(([x, y]) => obj.push([y, () => seco(g, x, y, y > 90 ? "#2c1838" : "#3a2a22")]));
    // Construcciones.
    obj.push([98, () => villabruma(g)]);
    obj.push([99, () => puente(g)]);
    obj.push([112, () => cripta(g)]);
    obj.push([64, () => castillo(g)]);
    obj.push([62, () => volcan(g)]);
    obj.push([63, () => monte(g, FORJA[0] + 2, FORJA[1] - 1, 12, 17, false, GRIS)]);
    obj.push([69, () => forja(g)]);
    obj.sort((a, b) => a[0] - b[0]);
    for (const [, fn] of obj) fn();

    /* 7. Rosa de los vientos y cartela con el nombre. */
    rosa(g, 24, 29);
    cartela(g);

    /* 8. Envejecido: manchas, vetas y oscurecido hacia los bordes. */
    for (let y = MARCO; y < H - MARCO; y++) for (let x = MARCO; x < W - MARCO; x++) {
      const d = borde(x, y) - MARCO, mancha = fbm(x / 18, y / 14, 121);
      let s = 0;
      if (d < 6 && umbral(x, y) > d / 6) s -= 1;
      if (mancha > 0.68 && umbral(x, y) < (mancha - 0.68) * 5) s -= 1;
      if (hash(x, y, 131) < 0.012) s -= 1;
      desplazar(g, x, y, s);
    }

    /* 9. Borde del pergamino: margen claro, doble filete de tinta y desgarros en el canto. */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = borde(x, y);
      if (d >= MARCO) continue;
      const roto = 0.4 + fbm(x / 5 + y / 7, (x + y) / 9, 141) * 2.8;
      if (d < roto - 0.8) continue;                                     // asoma la mesa
      if (d < roto + 0.4) { g.set(x, y, PERG[0], PERG); continue; }     // canto chamuscado
      if (d === 3 || d === 6) { g.set(x, y, TINTA); continue; }          // filetes
      if (d === 4 || d === 5) { pon(g, x, y, PERG, d === 4 ? 2.4 : 3.2, 0.6); continue; }
      pon(g, x, y, PERG, 2.6 + (fbm(x / 6, y / 6, 151) - 0.5) * 2 - (d < roto + 1.4 ? 1 : 0), 1);
    }
    // Esquinas: rombos de latón.
    for (const [cx, cy] of [[4, 4], [W - 5, 4], [4, H - 5], [W - 5, H - 5]]) {
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
        const a = Math.abs(i) + Math.abs(j);
        if (a > 2) continue;
        g.set(cx + i, cy + j, a === 2 ? TINTA : i + j < 0 ? R.bronce[4] : R.bronce[2], R.bronce);
      }
    }
    return g;
  }
  function dentroMar(dm, tierra, x, y, r) {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
      const xx = x + i, yy = y + j;
      if (xx < MARCO || yy < MARCO || xx >= W - MARCO || yy >= H - MARCO) return false;
      const k = yy * W + xx;
      if (tierra[k] || dm[k] < r) return false;
    }
    return true;
  }

  /* Villabruma: casas apiñadas junto a la costa, campanario y un muelle con su barca. */
  function villabruma(g) {
    const [vx, vy] = VILLA;
    // muelle y barca
    for (let x = vx - 14; x <= vx - 6; x++) { g.set(x, vy + 4, M[2], M); g.set(x, vy + 5, M[0], M); }
    figura(g, vx - 20, vy + 1, vx - 15, vy + 6, p => {
      for (let i = 0; i < 6; i++) p(vx - 20 + i, vy + 5, M[2], M);
      for (let i = 1; i < 5; i++) p(vx - 20 + i, vy + 6, M[1], M);
      for (let j = 1; j <= 3; j++) p(vx - 18, vy + 5 - j, M[1], M);
      p(vx - 17, vy + 2, HU[4], HU); p(vx - 17, vy + 3, HU[3], HU); p(vx - 16, vy + 3, HU[3], HU); p(vx - 17, vy + 4, HU[2], HU); p(vx - 16, vy + 4, HU[2], HU); p(vx - 15, vy + 4, HU[2], HU);
    });
    // empalizada baja
    for (let x = vx - 6; x <= vx + 10; x++) if (x % 2 === 0) { g.set(x, vy + 6, M[3], M); g.set(x, vy + 7, M[1], M); }
    // campanario
    figura(g, vx + 1, vy - 10, vx + 3, vy - 1, p => {
      for (let j = 0; j < 6; j++) for (let i = 0; i < 3; i++) p(vx + 1 + i, vy - 1 - j, HU[i === 2 ? 2 : 4 - (j > 3 ? 1 : 0)], HU);
      p(vx + 2, vy - 5, TINTA);
      p(vx + 1, vy - 7, TEJA[3], TEJA); p(vx + 2, vy - 7, TEJA[3], TEJA); p(vx + 3, vy - 7, TEJA[1], TEJA);
      p(vx + 2, vy - 8, TEJA[4], TEJA); p(vx + 2, vy - 9, TEJA[3], TEJA); p(vx + 2, vy - 10, R.bronce[4], R.bronce);
    });
    // casas (de atrás adelante)
    [[-6, -2, 4], [5, -3, 4], [-2, 1, 4], [3, 2, 5], [9, 0, 4], [-7, 4, 4], [8, 5, 3], [1, 6, 4]]
      .forEach(([dx, dy, w]) => casa(g, vx + dx, vy + dy, w));
  }
  /* El puente de madera del trol, sobre el río. */
  function puente(g) {
    const [bx, by] = PUENTE;
    figura(g, bx - 4, by - 2, bx + 4, by + 2, p => {
      for (let x = bx - 4; x <= bx + 4; x++) {
        p(x, by - 1, M[x % 2 ? 4 : 3], M); p(x, by, M[3], M); p(x, by + 1, M[1], M);
        if ((x - bx) % 2 === 0) p(x, by - 2, M[2], M);
      }
      p(bx - 3, by + 2, M[0], M); p(bx + 3, by + 2, M[0], M);
    });
    // el trol asoma bajo el puente
    g.set(bx + 1, by + 3, R.piel.verde[3], R.piel.verde); g.set(bx + 2, by + 3, R.piel.verde[2], R.piel.verde);
    g.set(bx + 1, by + 4, R.piel.verde[1], R.piel.verde); g.set(bx + 2, by + 4, "#f0e040");
  }
  /* La cripta: fachada de piedra excavada en la colina, con el fuego verde del liche dentro. */
  function cripta(g) {
    const [cx, cy] = CRIPTA;
    colina(g, cx, cy + 1, 10, 7, ALTO);
    figura(g, cx - 5, cy - 7, cx + 5, cy + 1, p => {
      for (let j = 0; j <= 5; j++) for (let i = -5; i <= 5; i++) {
        const k = i < -3 || i > 3 ? (i < 0 ? 3 : 1) : 2;
        p(cx + i, cy + 1 - j, GRIS[k + (j === 5 ? 1 : 0)], GRIS);
      }
      for (let j = 0; j < 2; j++) for (let i = -5 + j * 2; i <= 5 - j * 2; i++) p(cx + i, cy - 5 - j, GRIS[i < 0 ? 4 : 2], GRIS);
      p(cx, cy - 7, GRIS[4], GRIS);
      // puerta en arco
      for (let j = 0; j < 4; j++) for (let i = -2; i <= 2; i++) {
        if (j === 3 && Math.abs(i) === 2) continue;
        p(cx + i, cy + 1 - j, j < 2 && Math.abs(i) < 2 ? ESPECTRO[2] : "#05080a", ESPECTRO);
      }
      p(cx, cy, ESPECTRO[4], ESPECTRO); p(cx, cy - 1, ESPECTRO[3], ESPECTRO);
      // calavera sobre el dintel
      p(cx, cy - 4, HU[4], HU);
    });
    // lápidas
    for (const [dx, dy] of [[-10, 2], [-8, 5], [9, 3], [11, 6], [-13, 6], [7, 7]]) {
      g.set(cx + dx, cy + dy - 1, GRIS[4], GRIS); g.set(cx + dx, cy + dy, GRIS[2], GRIS); g.set(cx + dx + 1, cy + dy, TINTA);
      if ((dx & 1) === 0) { g.set(cx + dx - 1, cy + dy - 1, GRIS[3], GRIS); g.set(cx + dx + 1, cy + dy - 1, GRIS[3], GRIS); g.set(cx + dx, cy + dy - 2, GRIS[4], GRIS); }
    }
  }
  /* El castillo de Varkhul sobre su risco: torres afiladas, tejados granate y una ventana encendida. */
  function castillo(g) {
    const [cx] = CASTILLO;
    // el risco
    figura(g, cx - 12, 50, cx + 12, 64, p => {
      for (let y = 50; y <= 64; y++) {
        const t = (y - 50) / 14, a = 7 + t * 5 + (hash(y, 1, 171) - 0.5) * 2, b = 7 + t * 5 + (hash(y, 2, 171) - 0.5) * 2;
        for (let x = Math.round(cx - a); x <= Math.round(cx + b); x++) {
          const r = (x - (cx - a)) / (a + b);
          let k = r < 0.3 ? 3 : r < 0.62 ? 2 : 1;
          if (r > 0.62 && (x + y) % 3 === 0) k = 0;
          if ((x * 3 + y) % 7 === 0 && r < 0.6) k = 1;   // estratos
          if (y === 50) k = 4;
          p(x, y, ROCA[k], ROCA);
        }
      }
    });
    figura(g, cx - 9, 31, cx + 9, 50, p => {
      const muro = (x0, x1, y0, y1) => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const r = (x - x0) / Math.max(1, x1 - x0);
          p(x, y, GRIS[r < 0.25 ? 4 : r < 0.7 ? 3 : 1], GRIS);
        }
        for (let x = x0; x <= x1; x += 2) p(x, y0 - 1, GRIS[3], GRIS);   // almenas
      };
      const aguja = (x0, x1, y0, alto) => {
        const m = (x0 + x1) / 2;
        for (let j = 0; j < alto; j++) {
          const a = ((x1 - x0) / 2 + 0.6) * (1 - j / alto);
          for (let x = Math.ceil(m - a); x <= Math.floor(m + a); x++) p(x, y0 - j, TEJA[x < m ? 3 : x === Math.round(m) ? 2 : 1], TEJA);
        }
      };
      muro(cx - 8, cx + 8, 45, 50);           // muralla
      muro(cx - 8, cx - 6, 40, 50); aguja(cx - 8, cx - 6, 39, 5);
      muro(cx + 6, cx + 8, 40, 50); aguja(cx + 6, cx + 8, 39, 5);
      muro(cx - 3, cx + 3, 38, 50);           // torre del homenaje
      for (let y = 37; y >= 34; y--) for (let x = cx - 3; x <= cx + 3; x++) p(x, y, TEJA[x < cx ? 3 : 1], TEJA);
      aguja(cx - 1, cx + 1, 33, 3);
      p(cx, 31, R.tela.granate[4]);
      // puerta y ventanas
      for (let j = 0; j < 3; j++) { p(cx, 50 - j, "#0a0606"); p(cx - 1, 50 - j + (j === 2 ? 1 : 0), "#0a0606"); p(cx + 1, 50 - j + (j === 2 ? 1 : 0), "#0a0606"); }
      p(cx, 41, "#ffd060"); p(cx - 2, 44, "#2a0a0a"); p(cx + 2, 44, "#2a0a0a"); p(cx - 7, 43, "#c03a20"); p(cx + 7, 43, "#2a0a0a");
    });
  }
  /* El Pico Cenizo: cono de ceniza con ríos de lava y el cráter al rojo. */
  function volcan(g) {
    const { x: vx, cima, base: vb, ancho } = VOLCAN;
    const lava = new Set();
    for (const [ox, sem] of [[-3, 1], [2, 2], [5, 3]]) {
      let x = vx + ox;
      for (let y = cima + 1; y < vb - 6 - sem * 3; y++) { x += Math.round((hash(y, sem, 181) - 0.5 + ox * 0.04) * 1.4); lava.add(x + "," + y); }
    }
    figura(g, vx - ancho, cima - 1, vx + ancho, vb, p => {
      for (let y = cima; y <= vb; y++) {
        const t = (y - cima) / (vb - cima), a = 5 + Math.pow(t, 1.35) * (ancho - 5) + (hash(y, 3, 182) - 0.5) * 1.5;
        for (let x = Math.round(vx - a); x <= Math.round(vx + a); x++) {
          const r = (x - (vx - a)) / (2 * a);
          let k = r < 0.12 ? 4 : r < 0.3 ? 3 : r < 0.5 ? 2 : 1;
          if (r > 0.55 && (x + y) % 3 === 0) k = 0;
          if (Math.abs(r - 0.5 + 0.04 * Math.sin(y / 3)) < 0.03 * (1 + t)) k = 1;   // barranco central
          let ram = CENIZA;
          if (lava.has(x + "," + y)) { ram = F; k = y < cima + 8 ? 4 : 3; }
          else if (lava.has((x - 1) + "," + y) || lava.has((x + 1) + "," + y)) { ram = F; k = 1; }
          if (y === cima) { ram = F; k = 2; }
          p(x, y, ram[k], ram);
        }
      }
      // el cráter
      for (let x = vx - 4; x <= vx + 4; x++) { p(x, cima, F[Math.abs(x - vx) < 3 ? 4 : 3], F); p(x, cima - 1, Math.abs(x - vx) < 4 ? CENIZA[3] : CENIZA[1], CENIZA); }
      p(vx, cima + 1, F[4], F); p(vx - 1, cima + 1, F[3], F); p(vx + 1, cima + 1, F[3], F);
    });
    // oro del dragón asomando junto al cráter
    g.set(vx + 6, cima + 6, R.bronce[4], R.bronce); g.set(vx + 7, cima + 6, R.bronce[3], R.bronce); g.set(vx + 6, cima + 7, R.bronce[2], R.bronce);
  }
  /* La forja de Barak-Thur: puerta enana en la roca, con el fuego dentro y dos chimeneas. */
  function forja(g) {
    const [fx, fy] = FORJA;
    figura(g, fx - 7, fy - 9, fx + 7, fy + 2, p => {
      for (let y = fy - 6; y <= fy + 2; y++) for (let x = fx - 7; x <= fx + 7; x++) {
        const r = (x - fx + 7) / 14;
        p(x, y, GRIS[y === fy - 6 ? 4 : r < 0.3 ? 3 : r < 0.7 ? 2 : 1], GRIS);
      }
      for (let x = fx - 7; x <= fx + 7; x++) if ((x - fx) % 3 === 0) p(x, fy - 2, GRIS[1], GRIS);
      for (let y = fy - 9; y < fy - 6; y++) { p(fx - 5, y, GRIS[3], GRIS); p(fx - 4, y, GRIS[1], GRIS); p(fx + 4, y, GRIS[3], GRIS); p(fx + 5, y, GRIS[1], GRIS); }
      // portón con forma de runa y fuego
      for (let y = fy - 4; y <= fy + 2; y++) for (let x = fx - 2; x <= fx + 2; x++) {
        if (y === fy - 4 && Math.abs(x - fx) === 2) continue;
        p(x, y, F[y > fy ? 4 : Math.abs(x - fx) < 2 ? 3 : 2], F);
      }
      p(fx, fy - 5, R.bronce[4], R.bronce); p(fx - 1, fy - 5, R.bronce[2], R.bronce); p(fx + 1, fy - 5, R.bronce[2], R.bronce);
    });
  }
  /* Rosa de los vientos: ocho puntas a dos tonos, aro fino y la N de norte. */
  function rosa(g, cx, cy) {
    const OR = R.bronce, GRA = R.tela.granate;
    figura(g, cx - 13, cy - 13, cx + 13, cy + 13, p => {
      // aro doble entre las puntas
      for (let y = cy - 8; y <= cy + 8; y++) for (let x = cx - 8; x <= cx + 8; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > 6.4 && d < 7.6) p(x, y, OR[(x + y) & 1 ? 3 : 2], OR);
      }
      // estrella de ocho puntas por su radio: las cuatro grandes (el norte en rojo) y cuatro diagonales;
      // la mitad de cada punta que mira a la luz es clara y la otra oscura
      const Q = Math.PI / 4;
      for (let y = cy - 13; y <= cy + 13; y++) for (let x = cx - 13; x <= cx + 13; x++) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d < 0.5) continue;
        const th = Math.atan2(dy, dx) + Math.PI / 2;                  // 0 = norte
        const km = Math.round(th / (2 * Q)), om = th - km * 2 * Q;     // eje mayor más cercano
        const kd = Math.round((th - Q) / (2 * Q)), od = th - Q - kd * 2 * Q;
        const rm = 12.4 * Math.pow(lim(1 - Math.abs(om) / Q), 1.7), rd = 7.6 * Math.pow(lim(1 - Math.abs(od) / Q), 1.7);
        if (d <= rm + 0.35 && rm >= rd) {
          const norte = ((km % 4) + 4) % 4 === 0, ram = norte ? GRA : OR;
          p(x, y, om < -0.02 ? ram[4] : om > 0.02 ? ram[1] : ram[3], ram);
        } else if (d <= rd + 0.35) p(x, y, od < 0 ? HU[4] : HU[1], HU);
      }
      p(cx, cy, TINTA);
    });
    // flor de lis diminuta sobre el norte
    g.set(cx, cy - 15, GRA[4], GRA); g.set(cx - 1, cy - 14, GRA[3], GRA); g.set(cx + 1, cy - 14, GRA[3], GRA);
  }
  /* Cartela con el nombre del reino, en la bahía del suroeste. */
  function cartela(g) {
    const x0 = 11, y0 = 121, w = 41, h = 11;
    figura(g, x0 - 3, y0, x0 + w + 2, y0 + h - 1, p => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const r = (y - y0) / (h - 1);
        p(x, y, PERG[r < 0.15 ? 4 : r > 0.85 ? 2 : 3], PERG);
      }
      // colas de la cinta
      for (let j = 0; j < h - 2; j++) {
        const a = Math.abs(j - (h - 3) / 2) < 1.5 ? 1 : 3;
        for (let i = 1; i <= a; i++) { p(x0 - i, y0 + 2 + j, PERG[1], PERG); p(x0 + w - 1 + i, y0 + 2 + j, PERG[1], PERG); }
      }
      p(x0, y0 + h - 1, PERG[0], PERG); p(x0 + w - 1, y0 + h - 1, PERG[0], PERG);
    });
    escribir(g, "VALDREN", x0 + 7, y0 + 3, TINTA, null);
    for (let x = x0 + 3; x < x0 + w - 3; x++) if (x < x0 + 6 || x > x0 + w - 7) g.set(x, y0 + 5, PERG[1], PERG);
  }
  /* Escribe con las letras 3×5 del motor en la rejilla. */
  function escribir(g, texto, x, y, color, bordeCol) {
    const lienzo = { fillStyle: "", fillRect(px, py, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g.set(px + i, py + j, this.fillStyle); } };
    PX.texto(lienzo, texto, x, y, color, bordeCol);
  }

  /* ---------- Animación ---------- */
  /* Puntos de mar abierto donde brillan las olas (se calculan una vez con la misma geografía). */
  let olas = null;
  function sitiosOla() {
    if (olas) return olas;
    olas = [];
    for (let k = 0; olas.length < 13 && k < 400; k++) {
      const x = Math.floor(MARCO + 3 + hash(k, 1, 201) * 70), y = Math.floor(MARCO + 3 + hash(k, 2, 201) * (H - 2 * MARCO - 8));
      let ok = true;
      for (let j = -2; j <= 2 && ok; j++) for (let i = -3; i <= 4 && ok; i++) if (esTierra(x + i, y + j)) ok = false;
      if (!ok || Math.hypot(x - 24, y - 29) < 13 || (x < 56 && y > 117)) continue;
      olas.push([x, y, hash(k, 3, 201) * 6.283]);
    }
    return olas;
  }
  function anim(ctx, t) {
    const s = t / 1000;
    // Olas: destellos claros que van y vienen (2 rects cada una).
    for (const [x, y, f] of sitiosOla()) {
      const c = Math.sin(s * 1.6 + f);
      if (c < -0.2) continue;
      const dx = Math.round(Math.sin(s * 0.8 + f) * 1.5);
      ctx.fillStyle = c > 0.6 ? MAR[4] : MAR[3];
      ctx.fillRect(x + dx, y, 2, 1);
      ctx.fillRect(x + dx + (c > 0.3 ? 2 : -1), y + 1, 1, 1);
    }
    // Cráter: el rojo palpita.
    const vc = VOLCAN, lat = 0.5 + 0.5 * Math.sin(s * 2.3);
    ctx.fillStyle = lat > 0.5 ? F[4] : F[3];
    ctx.fillRect(vc.x - 2, vc.cima, 5, 1);
    // Humo del volcán: bocanadas que suben y se ladean con el viento (2 rects cada una).
    for (let i = 0; i < 7; i++) {
      const p = (s * 0.12 + i / 7) % 1, x = Math.round(vc.x + Math.sin(p * 5 + i) * 1.5 + p * 12), y = Math.round(vc.cima - 2 - p * 16);
      if (y < MARCO + 1) continue;
      const r = 1 + Math.round(p * 2);
      ctx.fillStyle = p < 0.25 ? "#3a2c28" : p < 0.6 ? "#6a5c54" : "#9a8c80";
      ctx.fillRect(x - r, y, r * 2 + 1, r);
      ctx.fillStyle = p < 0.6 ? "#8a7a70" : "#bcae9e";
      ctx.fillRect(x - r + 1, y - 1, r * 2 - 1, 1);
    }
    // Humo de las chimeneas de la forja.
    for (let i = 0; i < 4; i++) {
      const p = (s * 0.3 + i / 4) % 1, x = Math.round(FORJA[0] + (i % 2 ? 4 : -5) + p * 3), y = Math.round(FORJA[1] - 10 - p * 7);
      ctx.fillStyle = p < 0.5 ? "#5a4c46" : "#8a7c70";
      ctx.fillRect(x, y, 1 + (p > 0.5 ? 1 : 0), 1);
    }
    // Fuego de la forja que parpadea.
    ctx.fillStyle = Math.sin(s * 9) + Math.sin(s * 13.7) > 0 ? F[4] : F[3];
    ctx.fillRect(FORJA[0] - 1, FORJA[1] - 2, 3, 2);
    // Ventana del castillo y fuego verde de la cripta.
    if (Math.sin(s * 1.3) > -0.6) { ctx.fillStyle = "#ffd060"; ctx.fillRect(CASTILLO[0], 41, 1, 1); } else { ctx.fillStyle = "#3a1a10"; ctx.fillRect(CASTILLO[0], 41, 1, 1); }
    ctx.fillStyle = Math.sin(s * 4.1) > 0 ? ESPECTRO[4] : ESPECTRO[3];
    ctx.fillRect(CRIPTA[0], CRIPTA[1] - 1, 1, 2);
    // Murciélagos alrededor del castillo (1 rect cada uno; las alas baten).
    for (let i = 0; i < 3; i++) {
      const a = s * (0.9 + i * 0.2) + i * 2.1, x = Math.round(CASTILLO[0] + Math.cos(a) * (12 + i * 3)), y = Math.round(36 + Math.sin(a * 1.3) * 5);
      ctx.fillStyle = TINTA;
      ctx.fillRect(x - 1, y - (Math.sin(s * 12 + i) > 0 ? 1 : 0), 3, 1);
    }
    // La grieta del Abismo late: el borde se enciende y suben motas moradas.
    const pulso = 0.5 + 0.5 * Math.sin(s * 1.7);
    ctx.fillStyle = pulso > 0.66 ? MG[4] : pulso > 0.33 ? MG[3] : MG[2];
    for (let k = 2; k < GRIETA.length - 2; k++) {
      const [x, y] = GRIETA[k];
      ctx.fillRect(x - 1, y, 2, 1);
    }
    for (let i = 0; i < 8; i++) {
      const p = (s * 0.25 + i / 8) % 1, k = 1 + (i * 3) % (GRIETA.length - 2), [gx, gy] = GRIETA[k];
      const x = Math.round(gx + Math.sin(p * 6 + i) * 2), y = Math.round(gy - 1 - p * 12);
      ctx.fillStyle = p < 0.4 ? MG[4] : p < 0.75 ? MG[3] : MG[2];
      ctx.fillRect(x, y, 1, 1);
    }
    // Nubes que cruzan el mapa de oeste a este, dentro del marco.
    ctx.save();
    ctx.beginPath(); ctx.rect(MARCO, MARCO, W - 2 * MARCO, H - 2 * MARCO); ctx.clip();
    for (let i = 0; i < 3; i++) {
      const vel = 3 + i * 1.3, x = Math.round(((s * vel + i * 97) % (W + 60)) - 40), y = 16 + i * 38 + Math.round(Math.sin(s * 0.2 + i) * 2);
      const w = 16 + i * 4;
      ctx.globalAlpha = 0.28;                       // sombra de la nube sobre la tierra
      ctx.fillStyle = TINTA;
      ctx.fillRect(x + 3, y + 7, w - 2, 2);
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = "#e9dfc8";
      ctx.fillRect(x + 4, y, w - 10, 2);
      ctx.fillRect(x + 1, y + 2, w - 2, 2);
      ctx.fillRect(x + 6, y - 1, 5, 1);
      ctx.fillStyle = "#b4a68c";
      ctx.fillRect(x + 2, y + 4, w - 4, 1);
    }
    ctx.restore();
  }

  window.MUNDO = { W, H, base, anim, puntos, camino };
})();
