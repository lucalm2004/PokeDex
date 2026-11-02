/* Dados y Mazmorras · vista cenital (desde arriba) al estilo de los RPG de 16 bits.
   window.CENITAL = { heroe, escena, anim, cartel }
   · heroe(look, dir, paso) → Rejilla 24×32: el héroe visto desde arriba (cabeza grande, pies en la fila 30).
       dir: "abajo" | "arriba" | "izquierda" | "derecha"; paso: 0 (quieto), 1 y 2 (pasos alternos).
   · escena(acto, n, semilla) → { g, entrada, cruce, salidas, ramas, camino, puntos }:
       cruce de caminos de 256×144 con el tema del acto y n ramales (1..4) ordenados de izquierda a derecha.
   · anim(ctx, t, acto, esc?) dibuja encima los detalles animados (t en milisegundos) de la última escena del acto.
   · cartel(tipo) → Rejilla 16×16 con el icono que marca el final de una rama.
   Todo es determinista: nada de Math.random, solo hashes y el generador con semilla de PX. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, azar } = PX;

  /* ================= Utilidades ================= */
  /* Hash entero → [0,1). */
  function hash(x, y, s = 0) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  /* Ruido de valor suavizado (para manchas de hierba, lava, nubes...). */
  function ruido(x, y, esc, s = 0) {
    const fx = x / esc, fy = y / esc, xi = Math.floor(fx), yi = Math.floor(fy);
    let u = fx - xi, v = fy - yi;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const fbm = (x, y, esc, s) => ruido(x, y, esc, s) * 0.62 + ruido(x, y, esc / 2.3, s + 7) * 0.38;
  /* Tono tramado: v continuo (0..4) → índice entero con dithering ordenado. */
  const tono = (v, x, y) => {
    const b = Math.floor(v), f = v - b;
    return Math.max(0, Math.min(4, f > umbral(x, y) ? b + 1 : b));
  };
  /* Igual que tono pero con el tramado solo cerca del salto de tono (menos «ruido» de ajedrez). */
  const suave = (v, x, y) => {
    const b = Math.floor(v), f = v - b;
    const t = f < 0.3 ? b : f > 0.7 ? b + 1 : (f - 0.3) / 0.4 > umbral(x, y) ? b + 1 : b;
    return Math.max(0, Math.min(4, t));
  };
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= Rampas propias de la vista cenital ================= */
  const OJOS = "#1b1210", BLANCO = "#f6eedf";
  const CUERNO = ["#1a1014", "#33222c", "#54404a", "#7d6670", "#a8949a"];
  const LOBO = ["#2a2c30", "#4a4e54", "#767c82", "#a6abae", "#dcdedc"];
  const TIERRA = ["#3b2414", "#5e3c20", "#8a5c36", "#b58552", "#dcb17c"];
  const HIERBA = ["#123010", "#1f5418", "#337d22", "#55a62e", "#8fd04a"];
  const ARBOL = ["#081a0c", "#123414", "#1d5420", "#2f7a2c", "#58a83e"];
  const PINO = ["#06160f", "#0d2c1c", "#164428", "#22623a", "#3e8a4e"];
  const AGUA = ["#0c2450", "#16438a", "#2468bc", "#4498e0", "#b0e6ff"];
  const LOSA = ["#16141c", "#2a2733", "#433f4e", "#5f5a6c", "#837d90"];
  const MURO = ["#09080c", "#131119", "#1f1c27", "#312c3c", "#474152"];
  const LADRILLO = ["#1c1418", "#36262a", "#563e40", "#78585a", "#9c7a74"];
  const PATIO = ["#3e3a44", "#5e5966", "#827c8a", "#a8a2b0", "#d2ccd8"];
  const ALFOMBRA = ["#3a0712", "#66101e", "#9c1c2a", "#cc343c", "#f0665a"];
  const SETO = ["#0a1e10", "#14361a", "#1f5226", "#2e7234", "#4c9a46"];
  const BASALTO = ["#0e0909", "#1d1414", "#302220", "#48352e", "#644c40"];
  const CENIZA = ["#2a2220", "#473b36", "#6a5b51", "#8f7f72", "#b8a898"];
  const LAVA = ["#5a0c04", "#a82206", "#e85a10", "#ffa424", "#fff07a"];
  const OBSIDIANA = ["#0a0612", "#1a1028", "#2e1e46", "#4c3670", "#8268b0"];
  const VACIO = ["#040208", "#0b0616", "#160c2a", "#251646", "#3c2668"];
  const ROCA_AB = ["#160f24", "#281c40", "#3e2e5e", "#5a4682", "#8068aa"];
  const MUSGO_AB = ["#0c2428", "#143e44", "#1f6462", "#32947e", "#6cd2aa"];
  const LUZ = ["#2c2350", "#4a3c7c", "#7262ae", "#a294d8", "#e2d8ff"];
  const CRISTAL = ["#0c2448", "#1a4a90", "#3480d8", "#78c4ff", "#e8faff"];
  const CRISTAL_V = ["#2a0c48", "#4e1a86", "#8234c8", "#c078f0", "#f6e0ff"];
  const FLORES = ["#ff5a6a", "#ffd23a", "#f4f0ff", "#c07aff", "#ff9a3a", "#6ab8ff"];

  /* Datos de las razas (si no está cargado HEROES, valores por defecto). */
  const RAZAS_DEF = {
    humano: { cuerpo: "normal", pieles: ["clara"], pelos: ["castano"] },
    elfo: { cuerpo: "esbelto", pieles: ["clara"], pelos: ["rubio"] },
    enano: { cuerpo: "ancho", pieles: ["clara"], pelos: ["cobrizo"], barba: true },
    mediano: { cuerpo: "bajo", pieles: ["clara"], pelos: ["castano"] },
    semiorco: { cuerpo: "fornido", pieles: ["verde"], pelos: ["negro"] },
    tiefling: { cuerpo: "normal", pieles: ["roja"], pelos: ["negro"] },
    draconido: { cuerpo: "fornido", pieles: ["bronce"], pelos: [], sinPelo: true },
    gnomo: { cuerpo: "bajo", pieles: ["clara"], pelos: ["rubio"] },
    satiro: { cuerpo: "normal", pieles: ["oliva"], pelos: ["castano"] }
  };
  const razas = () => (typeof HEROES !== "undefined" && HEROES.RAZAS) || RAZAS_DEF;
  const TELA_DEF = { guerrero: "granate", barbaro: "terracota", picaro: "negro", explorador: "oliva", mago: "azul", brujo: "violeta", clerigo: "blanco", bardo: "ocre" };
  const telaClase = c => ((typeof HEROES !== "undefined" && HEROES.TELA_CLASE) || TELA_DEF)[c];

  /* ================= 1) Héroe cenital 24×32 ================= */
  const HW = 24, HH = 32;

  function heroe(look = {}, dir = "abajo", paso = 0) {
    const RZ = razas();
    const raza = RZ[look.raza] ? look.raza : "humano";
    const vis = RZ[raza] || RAZAS_DEF.humano;
    const clase = TELA_DEF[look.clase] ? look.clase : "guerrero";
    const piel = R.piel[look.piel] || R.piel[(vis.pieles || [])[0]] || R.piel.clara;
    const pelo = R.pelo[look.pelo] || R.pelo[(vis.pelos || [])[0] || "negro"] || R.pelo.negro;
    const tela = R.tela[look.tela] || R.tela[telaClase(clase)] || R.tela.terracota;
    const peinado = vis.sinPelo ? "rapado" : (look.peinado || "corto");
    const barba = (vis.barba || look.barba) && raza !== "draconido" && clase !== "picaro";
    paso = paso === 1 || paso === 2 ? paso : 0;
    const lado = dir === "izquierda" || dir === "derecha";
    const g = new Rejilla(HW, HH);
    const D = { g, raza, clase, piel, pelo, tela, peinado, barba, paso, vis, t: plantillaC(vis.cuerpo || "normal", paso) };
    if (lado) dibujarLado(D);
    else dibujarFrente(D, dir === "arriba");
    g.contorno();
    return dir === "izquierda" ? g.espejo() : g;
  }

  /* Medidas del cuerpo: cabeza enorme, cuerpo pequeño. Los bajos (enano, mediano, gnomo) 3 px más abajo. */
  function plantillaC(cuerpo, paso) {
    const bajo = cuerpo === "bajo" || cuerpo === "ancho";
    const bob = paso ? 1 : 0; /* al dar el paso, el cuerpo baja un píxel */
    const t = { cuerpo, bajo, cx: 11.5, pie: 30 };
    t.hy = (bajo ? 13 : 10) + bob;
    t.hrx = cuerpo === "fornido" ? 7 : 6.5;
    t.hry = bajo ? 5.6 : 6;
    t.top = (bajo ? 18 : 16) + bob;
    t.bot = (bajo ? 25 : 24) + bob;
    const mitad = { normal: 5, esbelto: 4, fornido: 6, bajo: 5, ancho: 6 }[cuerpo] || 5;
    t.L = 12 - mitad; t.R = 11 + mitad; /* columnas del torso, simétricas respecto a 11.5 */
    t.pierna = cuerpo === "esbelto" ? 2 : cuerpo === "ancho" || cuerpo === "fornido" ? 4 : 3;
    return t;
  }
  const K = () => new Capa(HW, HH);
  /* Une a una capa su reflejo respecto al eje vertical del sprite. */
  const simetrica = c => { for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (c.m[y * HW + x]) c.m[y * HW + (HW - 1 - x)] = 1; return c; };

  /* Rampas de ropa por clase. */
  function ropa(D) {
    const { clase, tela, piel } = D;
    const o = {
      guerrero: { torso: R.hierro, manga: R.hierro, pierna: R.hierro, bota: R.hierro, capa: tela },
      clerigo: { torso: R.hierro, manga: R.hierro, pierna: R.hierro, bota: R.madera, capa: null },
      barbaro: { torso: piel, manga: null, pierna: piel, bota: R.pelo.castano, capa: null },
      picaro: { torso: tela, manga: tela, pierna: R.tela.negro, bota: R.madera, capa: tela },
      explorador: { torso: tela, manga: tela, pierna: R.madera, bota: R.madera, capa: tela },
      mago: { torso: tela, manga: tela, pierna: null, bota: R.madera, capa: null, tunica: true },
      brujo: { torso: tela, manga: tela, pierna: null, bota: R.tela.negro, capa: tela, tunica: true },
      bardo: { torso: tela, manga: tela === R.tela.granate ? R.tela.azul : R.tela.granate, pierna: R.tela.negro, bota: R.madera, capa: null }
    }[clase];
    if (D.raza === "satiro") { o.pierna = D.pelo; o.bota = CUERNO; o.tunica = false; }
    if (D.raza === "mediano" && !["guerrero", "clerigo"].includes(clase)) o.bota = piel;
    if (D.raza === "draconido" && o.tunica) o.bota = piel;
    return o;
  }

  /* ---------- Vista de frente (abajo) y de espaldas (arriba) ---------- */
  function dibujarFrente(D, espalda) {
    const { g, t, raza, clase, piel, pelo, tela, paso } = D;
    const ro = ropa(D);
    const cx = t.cx;
    /* Pies: al andar, uno adelantado (fila 30) y el otro recogido (fila 28). */
    const pieI = paso === 2 ? 28 : 30, pieD = paso === 1 ? 28 : 30;
    const mano = { i: t.top + 6 + (paso === 1 ? 1 : paso === 2 ? -1 : 0), d: t.top + 6 + (paso === 2 ? 1 : paso === 1 ? -1 : 0) };
    const xI = t.L - 2, xD = t.R + 1; /* columna izquierda de cada brazo (2 px) */

    /* Detrás de todo: cola, aljaba (de frente), armas que asoman por detrás. */
    if (raza === "tiefling" && !espalda) cola(g, [cx + 3, t.bot - 1], [cx + 10, t.bot + 3], [cx + 9, t.bot - 5 + (paso === 1 ? 1 : 0)], piel);
    if (clase === "explorador" && !espalda) {
      new Capa(HW, HH).rect(t.L - 1, t.top - 4, 3, 7).pintar(g, R.madera, { relieve: 1 });
      for (const x of [t.L - 1, t.L + 1]) g.set(x, t.top - 5, BLANCO, R.hueso).set(x, t.top - 6, R.tela.granate[3], R.tela.granate);
    }
    if (espalda) armasMano(D, true, mano, xI, xD, "detras");

    /* Piernas y botas. */
    if (ro.tunica) {
      for (const [x, p] of [[cx - 3, pieI], [cx + 1, pieD]]) new Capa(HW, HH).rect(Math.round(x - 0.5), p - 1, 3, 2).pintar(g, ro.bota, { relieve: 1 });
    } else {
      const pw = t.pierna;
      const pies = [[10 - pw + 1, pieI], [13, pieD]];
      for (const [x, p] of pies) {
        new Capa(HW, HH).rect(x, t.bot - 1, pw, p - 1 - (t.bot - 1)).pintar(g, ro.pierna, { relieve: 1, max: 3 });
        new Capa(HW, HH).rect(x - (x < 12 ? 1 : 0), p - 1, pw + 1, 2).pintar(g, ro.bota, { relieve: 1, separar: true });
        if (D.raza === "satiro") g.set(x + (x < 12 ? 0 : pw - 1), p, CUERNO[0], CUERNO);
      }
    }

    /* Torso (o túnica larga). */
    const tor = new Capa(HW, HH);
    if (ro.tunica) tor.poly([[t.L, t.top], [t.R + 1, t.top], [t.R + 3, 29], [t.L - 2, 29]]);
    else tor.rect(t.L, t.top, t.R - t.L + 1, t.bot - t.top + 1);
    tor.off(t.L, t.top).off(t.R, t.top);
    tor.pintar(g, ro.torso, { relieve: 3, separar: true });
    detallesTorso(D, espalda);

    /* Brazos con manga y manos. */
    for (const [x, my] of [[xI, mano.i], [xD, mano.d]]) {
      const largo = my - (t.top + 1);
      if (ro.manga) new Capa(HW, HH).rect(x, t.top + 1, 2, largo).pintar(g, ro.manga, { relieve: 1, separar: true });
      else new Capa(HW, HH).rect(x, t.top + 1, 2, largo).pintar(g, piel, { relieve: 1, separar: true });
      if (D.clase === "bardo") new Capa(HW, HH).rect(x - (x < 12 ? 1 : 0), t.top + 1, 3, 3).pintar(g, ro.manga, { relieve: 2, separar: true });
      new Capa(HW, HH).rect(x, my, 2, 2).pintar(g, ["guerrero"].includes(clase) ? R.hierro : piel, { relieve: 1 });
    }

    /* Capa a la espalda (solo se ve de espaldas) o piel de lobo. */
    if (espalda && ro.capa) {
      const vuelo = paso === 1 ? 1 : paso === 2 ? -1 : 0;
      const c = new Capa(HW, HH).poly([[t.L - 0.5, t.top - 1], [t.R + 1.5, t.top - 1], [t.R + 2 + vuelo, t.bot + 3], [t.L - 1 + vuelo, t.bot + 3]]);
      c.pintar(g, D.clase === "guerrero" ? tela : ro.capa, { relieve: 3, separar: true });
      for (let y = t.top + 2; y < t.bot + 2; y += 3) g.set(cx - 2 + (y % 2), y, ro.capa[1], ro.capa).set(cx + 3 - (y % 2), y + 1, ro.capa[1], ro.capa);
    }
    if (espalda && clase === "barbaro") {
      const c = new Capa(HW, HH).poly([[t.L - 1, t.top - 2], [t.R + 2, t.top - 2], [t.R + 1, t.bot], [cx + 2, t.bot + 3], [cx - 1, t.bot + 3], [t.L, t.bot]]);
      c.pintar(g, LOBO, { relieve: 3, separar: true });
      for (let y = t.top; y < t.bot + 2; y += 2) for (let x = t.L; x <= t.R; x += 3) if (hash(x, y, 3) > 0.5) g.set(x + (y % 3), y, LOBO[1], LOBO);
    }

    /* Cabeza, pelo y tocado. */
    cabezaFrente(D, espalda);

    /* Cosas a la espalda (encima de la capa) o en la mano por delante. */
    if (espalda) espaldaObjetos(D);
    if (raza === "tiefling" && espalda) cola(g, [cx, t.bot], [cx + 1, t.bot + 6], [cx + 7, t.bot + 2 + (paso === 1 ? 1 : 0)], piel);
    if (!espalda) armasMano(D, false, mano, xI, xD, "delante");
    else armasMano(D, true, mano, xI, xD, "delante");
  }

  /* Cola de tiefling: curva fina con punta de flecha. */
  function cola(g, a, c, b, piel) {
    new Capa(HW, HH).curva(a[0], a[1], c[0], c[1], b[0], b[1], 1.6, 1.2).pintar(g, piel, { relieve: 1, separar: true });
    new Capa(HW, HH).poly([[b[0] - 1.5, b[1] + 0.5], [b[0] + 1.5, b[1] + 0.5], [b[0], b[1] - 2.5]]).rect(b[0] - 1, b[1] - 1, 2, 2).pintar(g, piel, { relieve: 1, min: 2 });
  }

  function detallesTorso(D, espalda) {
    const { g, t, clase, tela, piel } = D;
    const cx = t.cx;
    if (clase === "guerrero") {
      if (!espalda) {
        new Capa(HW, HH).rect(10, t.top + 2, 4, t.bot - t.top + 2).pintar(g, tela, { relieve: 2, separar: true });
        g.set(11, t.top + 4, R.bronce[4], R.bronce).set(12, t.top + 4, R.bronce[3], R.bronce);
      }
      for (let x = t.L; x <= t.R; x++) g.set(x, t.bot - 2, R.madera[x % 3 ? 2 : 3], R.madera);
      g.set(11, t.bot - 2, R.bronce[4], R.bronce).set(12, t.bot - 2, R.bronce[3], R.bronce);
    } else if (clase === "clerigo") {
      /* Cota de malla tramada y tabardo blanco largo con el sol de Solara. */
      for (let y = t.top; y <= t.bot; y++) for (let x = t.L; x <= t.R; x++) if ((x + y) % 2 === 0 && g.rampa(x, y) === R.hierro) g.set(x, y, R.hierro[1], R.hierro);
      new Capa(HW, HH).rect(t.L + 1, t.top + 1, t.R - t.L - 1, t.bot - t.top + 3).off(t.L + 1, t.bot + 3).off(t.R - 1, t.bot + 3).pintar(g, tela, { relieve: 2, separar: true });
      if (!espalda) {
        const y = t.top + 4;
        g.set(11, y, R.bronce[4], R.bronce).set(12, y, R.bronce[3], R.bronce).set(11, y - 1, R.bronce[3], R.bronce).set(12, y + 1, R.bronce[2], R.bronce);
        g.set(10, y, R.bronce[3], R.bronce).set(13, y, R.bronce[2], R.bronce).set(11, y + 1, R.bronce[3], R.bronce).set(12, y - 1, R.bronce[3], R.bronce);
      }
      for (let x = t.L + 1; x < t.R; x++) g.set(x, t.bot - 1, R.bronce[x % 2 ? 2 : 3], R.bronce);
    } else if (clase === "barbaro") {
      if (!espalda) {
        g.set(cx - 2.5, t.top + 3, piel[1], piel).set(cx + 2.5, t.top + 3, piel[1], piel);
        for (let x = t.L; x <= t.R; x++) g.set(x, t.top + 5, piel[1], piel);
        /* Correa en bandolera. */
        for (let k = 0; k < 7; k++) g.set(t.L + 1 + k, t.top + k, R.madera[2], R.madera);
        /* Piel de lobo sobre los hombros. */
        new Capa(HW, HH).rect(t.L - 1, t.top - 1, 3, 3).rect(t.R - 1, t.top - 1, 3, 3).pintar(g, LOBO, { relieve: 1 });
      }
      for (let x = t.L; x <= t.R; x++) g.set(x, t.bot - 1, R.madera[x % 3 ? 1 : 2], R.madera);
      new Capa(HW, HH).rect(t.L + 1, t.bot, t.R - t.L - 1, 3).pintar(g, tela, { relieve: 1, separar: true });
    } else if (clase === "picaro" || clase === "explorador" || clase === "bardo") {
      for (let x = t.L; x <= t.R; x++) g.set(x, t.bot - 2, R.madera[x % 3 ? 1 : 2], R.madera);
      g.set(cx + 0.5, t.bot - 2, R.bronce[4], R.bronce);
      if (clase === "explorador" && !espalda) { for (let k = 0; k < 7; k++) g.set(t.R - 1 - k, t.top + k, R.madera[3], R.madera); }
      if (clase === "bardo" && !espalda) for (let y = t.top + 1; y < t.bot - 2; y += 2) g.set(11, y, R.bronce[4], R.bronce).set(12, y, R.bronce[3], R.bronce);
      if (clase === "picaro" && !espalda) { new Capa(HW, HH).rect(t.L, t.top, t.R - t.L + 1, 2).pintar(g, R.tela.granate, { relieve: 1, max: 2 }); }
    } else if (clase === "mago" || clase === "brujo") {
      const borde = clase === "mago" ? R.bronce : R.sombra;
      for (let x = t.L; x <= t.R; x++) g.set(x, t.bot - 3, borde[x % 2 ? 3 : 2], borde);
      if (!espalda) for (let y = t.bot - 2; y <= 28; y++) g.set(11, y, borde[3], borde).set(12, y, borde[2], borde);
      if (clase === "brujo" && !espalda) g.set(11, t.top + 3, R.magia[4], R.magia).set(12, t.top + 3, R.magia[3], R.magia);
    }
  }

  /* Cabeza vista de frente o desde la nuca, con pelo, tocado y rasgos de la raza. */
  function cabezaFrente(D, espalda) {
    const { g, t, raza, clase, piel, pelo, tela, peinado } = D;
    const cx = t.cx, hy = t.hy, rx = t.hrx, ry = t.hry;
    const drac = raza === "draconido";
    const cabeza = new Capa(HW, HH).ell(cx, hy, drac ? rx - 0.4 : rx, drac ? ry - 0.4 : ry);
    cabeza.pintar(g, piel, { relieve: 4 });
    if (drac) escamas(g, piel, hy - ry, hy + ry);
    const tapa = ["guerrero", "picaro", "explorador", "brujo", "clerigo"].includes(clase);
    if (!tapa && !drac) peloFrente(D, espalda);
    if (raza === "draconido" && espalda) {
      for (let y = hy - ry + 1; y <= hy + ry + 1; y += 2) g.set(11, y, R.hueso[3], R.hueso).set(12, y, R.hueso[2], R.hueso);
    }
    /* Cara (de frente). */
    if (!espalda) cara(D);
    if (D.barba && !espalda) barbaFrente(D);
    tocadoFrente(D, espalda);
    /* Rasgos que asoman por encima de todo. */
    if (raza === "elfo" || raza === "gnomo") orejasPicudas(g, t, piel, raza === "elfo" ? 3 : 1.5);
    else if (raza === "semiorco") orejasPicudas(g, t, piel, 1);
    if (raza === "tiefling") cuernosFrente(g, t, CUERNO, 1);
    if (raza === "satiro") cuernosFrente(g, t, R.hueso, 0.6);
    if (drac) {
      const cu = new Capa(HW, HH).linea(cx - 3, hy - ry + 2, cx - 5, hy - ry - 2, 2).linea(cx + 3, hy - ry + 2, cx + 5, hy - ry - 2, 2);
      cu.pintar(g, R.hueso, { relieve: 1, separar: true });
      if (!espalda) hocicoFrente(D);
    }
  }

  function escamas(g, piel, y0, y1) {
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = 0; x < HW; x++)
      if ((x + y * 2) % 4 === 0 && g.rampa(x, y) === piel && g.get(x, y) === piel[2]) g.set(x, y, piel[3], piel);
  }

  function peloFrente(D, espalda) {
    const { g, t, pelo, peinado, raza } = D;
    const cx = t.cx, hy = t.hy, rx = t.hrx, ry = t.hry;
    const c = new Capa(HW, HH);
    if (peinado === "rapado") {
      c.ell(cx, hy - 0.5, rx + 0.3, ry + 0.2);
      for (let y = 0; y < HH; y++) if (y > hy - (espalda ? 0 : 3)) c.quitarRect(0, y, HW, 1);
      c.pintar(g, pelo, { relieve: 3, max: 2 });
      for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (c.tiene(x, y) && (x + y) % 2) g.set(x, y, pelo[1], pelo);
      return;
    }
    const grande = peinado === "rizado" ? 1.2 : 0.6;
    c.ell(cx, hy - 0.8, rx + grande, ry + 0.3);
    const corte = espalda ? hy + ry - 2 : hy - 1;
    for (let y = Math.ceil(corte) + 1; y < HH; y++) c.quitarRect(0, y, HW, 1);
    if (!espalda) {
      /* Patillas y flequillo. */
      c.rect(Math.floor(cx - rx), hy - 1, 2, 3); c.rect(Math.ceil(cx + rx) - 1, hy - 1, 2, 3);
      c.on(cx - 2, hy).on(cx + 1, hy).on(cx + 2, hy);
    }
    if (peinado === "largo") { c.rect(Math.floor(cx - rx) - 1, hy - 2, 3, ry + 4); c.rect(Math.ceil(cx + rx) - 1, hy - 2, 3, ry + 4); if (espalda) c.rect(cx - 4, hy, 9, ry + 4); }
    if (peinado === "recogido") c.ell(cx, hy - ry - 1, 2.6, 2.2);
    if (peinado === "rizado") for (let k = -3; k <= 3; k++) c.ell(cx + k * 2, hy - ry + Math.abs(k) * 0.9, 1.6, 1.6);
    c.pintar(g, pelo, { relieve: 3, separar: !espalda });
    /* Mechones: líneas de sombra para que se lea como pelo. */
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (c.tiene(x, y) && hash(x, 0, 5) > 0.62 && g.get(x, y) === pelo[2]) g.set(x, y, pelo[1], pelo);
    if (peinado === "rizado") for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (c.tiene(x, y) && (x * 3 + y * 5) % 7 === 0) g.set(x, y, pelo[3], pelo);
  }

  function cara(D) {
    const { g, t, raza, clase, piel } = D;
    const hy = t.hy, y = hy + 1;
    const enSombra = ["picaro", "explorador", "brujo", "clerigo"].includes(clase);
    if (raza === "draconido") return;
    if (clase === "brujo") {
      /* Cara hundida en la sombra de la capucha: solo brillan los ojos. */
      for (let j = hy - 1; j <= hy + 5; j++) for (let x = 6; x <= 17; x++) if (g.rampa(x, j) === piel) g.set(x, j, (j < hy + 2 ? R.sombra[2] : piel[0]), piel);
      g.set(9, y, R.magia[4], R.magia).set(14, y, R.magia[4], R.magia).set(8, y, R.magia[3], R.magia).set(15, y, R.magia[3], R.magia);
      return;
    }
    if (raza === "tiefling") {
      g.set(9, y, R.bronce[4], R.bronce).set(9, y + 1, R.fuego[2], R.fuego).set(14, y, R.bronce[4], R.bronce).set(14, y + 1, R.fuego[2], R.fuego);
    } else {
      g.set(8, y, BLANCO).set(9, y, OJOS).set(8, y + 1, OJOS).set(9, y + 1, OJOS);
      g.set(14, y, BLANCO).set(15, y, OJOS).set(14, y + 1, OJOS).set(15, y + 1, OJOS);
    }
    if (enSombra) for (let x = 6; x <= 17; x++) if (g.rampa(x, hy - 1) === piel) g.set(x, hy - 1, piel[1], piel);
    g.set(7, y + 2, piel[3] === piel[4] ? piel[3] : R.piel.roja[4], R.piel.roja).set(16, y + 2, R.piel.roja[4], R.piel.roja);
    if (raza === "semiorco") {
      for (const x of [8, 9, 14, 15]) g.set(x, y - 1, piel[0], piel);
      g.set(11, y + 3, piel[0], piel).set(12, y + 3, piel[0], piel);
      g.set(10, y + 3, R.hueso[4], R.hueso).set(10, y + 2, R.hueso[3], R.hueso).set(13, y + 3, R.hueso[4], R.hueso).set(13, y + 2, R.hueso[3], R.hueso);
    } else {
      g.set(11, y + 3, piel[1], piel).set(12, y + 3, piel[1], piel);
    }
    if (raza === "gnomo") { g.set(11, y + 1, piel[4], piel).set(12, y + 1, piel[3], piel).set(11, y + 2, piel[3], piel).set(12, y + 2, piel[2], piel).set(11, y + 3, piel[1], piel).set(12, y + 3, piel[1], piel); }
    if (clase === "picaro") new Capa(HW, HH).rect(7, y + 2, 10, 3).pintar(g, D.tela, { relieve: 1, max: 2, separar: true });
  }

  function barbaFrente(D) {
    const { g, t, pelo, vis } = D;
    const hy = t.hy, cx = t.cx;
    const larga = !!vis.barba;
    const c = new Capa(HW, HH).poly(larga
      ? [[5.5, hy + 1.5], [18.5, hy + 1.5], [17, t.top + 4], [cx + 1.5, t.top + 7.5], [cx - 1.5, t.top + 7.5], [6, t.top + 4]]
      : [[6.5, hy + 2.5], [17.5, hy + 2.5], [15, hy + 6.5], [8, hy + 6.5]]);
    c.quitarRect(10, hy + 3, 4, 1);
    c.pintar(g, pelo, { relieve: 2, separar: true });
    /* Bigote y boca. */
    for (let x = 9; x <= 14; x++) g.set(x, hy + 3, pelo[x === 9 || x === 14 ? 2 : 3], pelo);
    g.set(11, hy + 4, OJOS).set(12, hy + 4, OJOS);
    if (larga) for (let y = hy + 6; y < t.top + 7; y += 2) g.set(cx - 0.5 + ((y >> 1) % 2), y, pelo[1], pelo);
  }

  function orejasPicudas(g, t, piel, largo) {
    const hy = t.hy;
    const izq = t.cx - t.hrx;
    const c = new Capa(HW, HH).poly([[izq + 1.5, hy + 2.5], [izq + 1.5, hy - 0.5], [izq - largo, hy - 1 - largo * 0.7]]);
    simetrica(c).pintar(g, piel, { relieve: 1, separar: true });
  }

  function cuernosFrente(g, t, ram, tam) {
    const hy = t.hy, top = hy - t.hry;
    const c = new Capa(HW, HH).curva(8, top + 3, 6.5 - tam, top - 1.5 * tam, 4.5 - tam * 1.5, top - 2 * tam + 1, 2.4, 1);
    simetrica(c).pintar(g, ram, { relieve: 1, separar: true });
  }

  function hocicoFrente(D) {
    const { g, t, piel } = D;
    const hy = t.hy, cx = t.cx;
    new Capa(HW, HH).ell(cx, hy + 3, 3.6, 2.4).pintar(g, piel, { relieve: 2, min: 2, separar: true });
    g.set(10, hy + 3, piel[0], piel).set(13, hy + 3, piel[0], piel);
    for (let x = 9; x <= 14; x++) g.set(x, hy + 5, piel[1], piel);
    for (const x of [7, 16]) g.set(x, hy, R.bronce[4], R.bronce).set(x + (x < 12 ? 1 : -1), hy, OJOS);
    g.set(7, hy - 1, piel[1], piel).set(16, hy - 1, piel[1], piel);
  }

  /* Yelmo con penacho, capuchas, cofia de malla, sombreros y piel de lobo. */
  function tocadoFrente(D, espalda) {
    const { g, t, clase, tela, piel, pelo, raza, paso } = D;
    const cx = t.cx, hy = t.hy, rx = t.hrx, ry = t.hry;
    const top = hy - ry;
    if (clase === "guerrero") {
      const y = new Capa(HW, HH).ell(cx, hy - 0.5, rx + 0.6, ry + 0.4);
      for (let j = Math.ceil(hy + (espalda ? 4 : 0)) + 1; j < HH; j++) y.quitarRect(0, j, HW, 1);
      if (!espalda) { y.rect(Math.floor(cx - rx), hy, 2, 4); y.rect(Math.ceil(cx + rx) - 1, hy, 2, 4); y.rect(11, hy, 2, 2); }
      y.pintar(g, R.hierro, { relieve: 3 });
      for (let x = 5; x <= 18; x++) if (g.rampa(x, hy) === R.hierro && !espalda) g.set(x, hy, R.bronce[x % 2 ? 2 : 3], R.bronce);
      /* Penacho de la tela (de delante atrás, se ve como una cresta). */
      const p = new Capa(HW, HH).ell(cx, top - 0.5, 1.6, 3).rect(11, top - 3, 2, 6);
      if (espalda) p.rect(11, top, 2, 6);
      p.pintar(g, tela, { relieve: 2, separar: true });
      for (let j = top - 3; j <= top + 2; j += 2) g.set(11, j, tela[4], tela);
    } else if (clase === "picaro" || clase === "explorador" || clase === "brujo" || clase === "clerigo") {
      const ram = clase === "clerigo" ? R.hierro : tela;
      const c = new Capa(HW, HH).ell(cx, hy - 0.3, rx + 1, ry + 0.9);
      c.rect(t.L - 1, t.top - 1, t.R - t.L + 3, 3); /* cae sobre los hombros */
      if (clase !== "clerigo") c.poly([[cx - 2.5, top + 1], [cx + 2.5, top + 1], [cx + (clase === "explorador" ? 1 : 0), top - 3]]);
      if (!espalda) c.quitarEll(cx, hy + 2.4, rx - 2.2, ry - 2.6);
      c.pintar(g, ram, { relieve: 3, separar: !espalda });
      if (clase === "clerigo") {
        for (let j = 0; j < HH; j++) for (let x = 0; x < HW; x++) if (c.tiene(x, j) && (x + j) % 2 === 0) g.set(x, j, ram[Math.max(1, ram.indexOf(g.get(x, j)) - 1)], ram);
        for (let x = 7; x <= 16; x++) if (g.rampa(x, top + 2) === ram) g.set(x, top + 2, R.bronce[x % 2 ? 3 : 4], R.bronce);
      } else {
        /* Pliegue del borde de la capucha. */
        if (!espalda) for (let j = 0; j < HH; j++) for (let x = 0; x < HW; x++) if (c.tiene(x, j) && !c.tiene(x, j + 1) && g.rampa(x, j + 1) === piel) g.set(x, j, ram[1], ram);
        if (espalda) for (let j = top + 2; j < hy + ry; j += 2) g.set(cx + 0.5, j, ram[1], ram);
      }
    } else if (clase === "mago") {
      const ala = new Capa(HW, HH).ell(cx, hy - 3.4, rx + 2.4, 2.2);
      ala.pintar(g, tela, { relieve: 2, separar: true });
      const cono = new Capa(HW, HH).poly([[7, hy - 3.5], [16, hy - 3.5], [14.5, hy - 6.5], [16 + (paso ? 1 : 0), hy - 10.5], [11.5, hy - 8], [8.5, hy - 6]]);
      cono.pintar(g, tela, { relieve: 3, separar: true });
      for (let x = 6; x <= 17; x++) if (cono.tiene(x, hy - 4)) g.set(x, hy - 4, R.bronce[x % 2 ? 3 : 4], R.bronce);
      if (!espalda) g.set(11, hy - 6, R.bronce[4], R.bronce).set(10, hy - 6, R.bronce[3], R.bronce).set(11, hy - 7, R.bronce[3], R.bronce);
    } else if (clase === "bardo") {
      const ala = new Capa(HW, HH).ell(cx, hy - 3, rx + 1.6, 2.2);
      const copa = new Capa(HW, HH).ell(cx, hy - 5, 4, 2.6);
      ala.pintar(g, tela, { relieve: 2, separar: true });
      copa.pintar(g, tela, { relieve: 3, separar: true });
      for (let x = 7; x <= 16; x++) if (copa.tiene(x, hy - 3) || copa.tiene(x, hy - 4)) g.set(x, hy - 3, R.tela.granate[3], R.tela.granate);
      const pluma = tela === R.tela.granate ? R.tela.blanco : R.tela.granate;
      new Capa(HW, HH).curva(cx + 3, hy - 5, cx + 8, hy - 7, cx + 9, hy - 12 - (paso ? 1 : 0), 2.4, 1).pintar(g, pluma, { relieve: 1, separar: true });
    } else if (clase === "barbaro") {
      /* Cabeza de lobo encima de la cabeza: hocico hacia delante y orejas. */
      const c = new Capa(HW, HH).ell(cx, hy - 2, rx + 0.8, ry - 1.4);
      for (let j = Math.ceil(hy - (espalda ? -2 : 1)) + 1; j < HH; j++) c.quitarRect(0, j, HW, 1);
      if (espalda) c.rect(t.L - 2, hy - 2, 3, 8).rect(t.R, hy - 2, 3, 8);
      c.pintar(g, LOBO, { relieve: 3, separar: !espalda });
      const o = new Capa(HW, HH).poly([[6, top + 2], [9.5, top + 1], [6.5, top - 3]]);
      simetrica(o).pintar(g, LOBO, { relieve: 1, separar: true });
      g.set(7, top - 1, LOBO[1], LOBO).set(16, top - 1, LOBO[1], LOBO);
      if (!espalda) {
        new Capa(HW, HH).ell(cx, hy - 1.5, 2.6, 1.8).pintar(g, LOBO, { relieve: 1, min: 3, separar: true });
        g.set(11, hy - 1, OJOS).set(12, hy - 1, OJOS);
        g.set(9, hy - 3, "#ffd23a").set(14, hy - 3, "#ffd23a");
        for (let x = 9; x <= 14; x++) if (g.rampa(x, hy) === LOBO) g.set(x, hy, BLANCO, R.hueso);
      }
    }
  }

  /* Objetos de la mano (y escudo) en las vistas de frente y espalda. */
  function armasMano(D, espalda, mano, xI, xD, capaDibujo) {
    const { g, t, clase, tela } = D;
    /* De frente la mano derecha del héroe queda a la izquierda de la imagen; de espaldas, al revés. */
    const der = espalda ? { x: xD + 0.5, y: mano.d, lado: 1 } : { x: xI + 0.5, y: mano.i, lado: -1 };
    const izq = espalda ? { x: xI + 0.5, y: mano.i, lado: -1 } : { x: xD + 0.5, y: mano.d, lado: 1 };
    const delante = capaDibujo === "delante";
    const ex = (m, d) => Math.round(m.x + m.lado * d);
    if (clase === "guerrero") {
      if (delante) {
        const x = ex(der, 1);
        new Capa(HW, HH).rect(x, der.y + 2, 1, 7).pintar(g, R.hierro, { plano: 4 });
        g.set(x + der.lado, der.y + 3, R.hierro[2], R.hierro);
        for (let k = 3; k < 8; k++) g.set(x - der.lado * 0, der.y + 2 + k, R.hierro[k % 2 ? 3 : 4], R.hierro);
        new Capa(HW, HH).rect(x - 1, der.y + 1, 3, 1).pintar(g, R.bronce, { plano: 3 });
        /* Escudo redondo con la tela y un umbo de hierro. */
        const sx = ex(izq, 1.5), sy = izq.y - 2;
        const e = new Capa(HW, HH).ell(sx, sy, 3.4, 4);
        e.pintar(g, R.bronce, { relieve: 2, separar: true });
        new Capa(HW, HH).ell(sx, sy, 2.2, 2.8).pintar(g, espalda ? R.madera : tela, { relieve: 2 });
        if (!espalda) g.set(sx, sy, R.hierro[4], R.hierro).set(sx, sy + 1, R.hierro[2], R.hierro);
        else for (let j = -2; j <= 2; j += 2) g.set(sx - 1, sy + j, R.madera[1], R.madera).set(sx + 1, sy + j, R.madera[1], R.madera);
      }
    } else if (clase === "barbaro") {
      if (delante) {
        const x = ex(der, espalda ? 1 : 0);
        new Capa(HW, HH).rect(x, t.top - 6, 1, der.y - t.top + 9).pintar(g, R.madera, { plano: 3 });
        const hx = x + der.lado * 1;
        const hoja = new Capa(HW, HH).poly(der.lado < 0
          ? [[hx + 1, t.top - 7], [hx - 4, t.top - 9], [hx - 4.5, t.top - 1.5], [hx + 1, t.top - 3]]
          : [[hx - 1, t.top - 7], [hx + 4, t.top - 9], [hx + 4.5, t.top - 1.5], [hx - 1, t.top - 3]]);
        hoja.pintar(g, R.hierro, { relieve: 2, separar: true });
        g.set(hx + der.lado * 3, t.top - 5, R.hierro[4], R.hierro);
      }
    } else if (clase === "picaro") {
      if (delante) for (const m of [der, izq]) {
        const x = Math.round(m.x);
        new Capa(HW, HH).rect(x, m.y + 2, 1, 4).pintar(g, R.plata, { plano: 4 });
        g.set(x - 1, m.y + 2, R.bronce[2], R.bronce).set(x + 1, m.y + 2, R.bronce[2], R.bronce);
      }
    } else if (clase === "explorador") {
      if (delante) {
        const x = ex(izq, 1.5), y0 = t.top - 5, y1 = t.top + 13;
        const arco = new Capa(HW, HH).curva(x, y0, x + izq.lado * 4.5, (y0 + y1) / 2, x, y1, 1.8, 1.8);
        arco.pintar(g, R.madera, { relieve: 1, separar: true });
        for (let y = y0 + 1; y < y1; y++) if (!g.get(x - izq.lado, y) || g.rampa(x - izq.lado, y) !== R.madera) g.set(x - izq.lado * 0, y, R.hueso[2], R.hueso);
      }
    } else if (clase === "mago") {
      if (delante) {
        const x = ex(der, 1);
        new Capa(HW, HH).rect(x, t.hy - 6, 1, 29 - (t.hy - 6)).pintar(g, R.madera, { plano: 3 });
        for (let y = t.hy - 4; y < 29; y += 3) g.set(x, y, R.madera[2], R.madera);
        new Capa(HW, HH).ell(x, t.hy - 7.5, 1.7, 1.7).pintar(g, R.mar, { relieve: 1, min: 3 });
        g.set(x - 1, t.hy - 8, BLANCO);
        g.set(x - 1, t.hy - 6, R.bronce[3], R.bronce).set(x + 1, t.hy - 6, R.bronce[3], R.bronce);
      }
    } else if (clase === "brujo") {
      if (delante) {
        const x = ex(izq, 1.5), y = izq.y - 2;
        new Capa(HW, HH).ell(x, y, 2, 2).pintar(g, R.magia, { relieve: 2, min: 2 });
        g.set(x - 1, y - 1, R.magia[4], R.magia);
      }
    } else if (clase === "clerigo") {
      if (delante) {
        const x = ex(der, 1);
        new Capa(HW, HH).rect(x, der.y - 3, 1, 6).pintar(g, R.madera, { plano: 3 });
        new Capa(HW, HH).ell(x, der.y - 4.5, 1.8, 1.8).pintar(g, R.hierro, { relieve: 1, min: 2, separar: true });
        g.set(x - 2, der.y - 5, R.hierro[3], R.hierro).set(x + 2, der.y - 5, R.hierro[2], R.hierro).set(x, der.y - 7, R.hierro[3], R.hierro);
      }
    } else if (clase === "bardo") {
      if (delante && !espalda) {
        /* Laúd cruzado sobre el cuerpo. */
        const cx = t.R - 2, cy = t.top + 5;
        new Capa(HW, HH).linea(cx - 2, cy - 2, t.L - 2, t.top - 2, 2).pintar(g, R.madera, { relieve: 1, max: 2, separar: true });
        new Capa(HW, HH).ell(cx, cy, 3.4, 2.8).pintar(g, R.madera, { relieve: 2, min: 2, separar: true });
        g.set(cx, cy, OJOS).set(cx - 1, cy, R.madera[0], R.madera);
        new Capa(HW, HH).rect(t.L - 3, t.top - 3, 2, 2).pintar(g, R.madera, { plano: 1 });
        for (let k = 0; k < 4; k++) g.set(cx - 2 - k, cy - 2 - Math.round(k * 0.6), R.hueso[2], R.hueso);
      }
    }
  }

  /* Lo que se lleva a la espalda: aljaba, laúd, cresta del dracónido. */
  function espaldaObjetos(D) {
    const { g, t, clase, raza } = D;
    if (clase === "explorador") {
      const c = new Capa(HW, HH).linea(t.R - 1, t.top - 3, t.L + 2, t.bot - 1, 3);
      c.pintar(g, R.madera, { relieve: 1, separar: true });
      for (const [x, y] of [[t.R, t.top - 4], [t.R - 2, t.top - 5], [t.R + 1, t.top - 6]]) g.set(x, y, BLANCO, R.hueso).set(x, y - 1, R.tela.granate[3], R.tela.granate);
    }
    if (clase === "bardo") {
      const cx = t.L + 3, cy = t.bot - 1;
      new Capa(HW, HH).linea(cx + 2, cy - 3, t.R + 1, t.top - 4, 2).pintar(g, R.madera, { relieve: 1, max: 2, separar: true });
      new Capa(HW, HH).ell(cx, cy, 3.4, 2.8).pintar(g, R.madera, { relieve: 2, separar: true });
      new Capa(HW, HH).rect(t.R + 1, t.top - 6, 2, 2).pintar(g, R.madera, { plano: 1 });
    }
    if (clase === "mago") for (let y = t.top + 1; y < 28; y += 2) g.set(11 + (y % 4 ? 1 : 0), y, D.tela[1], D.tela);
  }

  /* ---------- Vista de lado (mirando a la derecha) ---------- */
  function dibujarLado(D) {
    const { g, t, raza, clase, piel, pelo, tela, paso } = D;
    const ro = ropa(D);
    const cx = t.cx;
    const L = t.L + 2, Rr = t.R - 1; /* torso más estrecho de perfil */
    /* Pierna cercana y lejana: adelante (+) o atrás (−). */
    const zanc = paso === 1 ? 3 : paso === 2 ? -3 : 0;
    const swing = -zanc; /* el brazo cercano va al revés que la pierna cercana */

    /* Detrás: capa, cola, aljaba, brazo lejano. */
    if (ro.capa && clase !== "guerrero") {
      const c = new Capa(HW, HH).poly([[L + 1, t.top - 1], [L - 3 - (paso ? 1 : 0), t.bot + 3], [L + 3, t.bot + 3]]);
      c.pintar(g, ro.capa, { relieve: 2, max: 2 });
    }
    if (clase === "guerrero") new Capa(HW, HH).poly([[L + 1, t.top - 1], [L - 3 - (paso ? 1 : 0), t.bot + 2], [L + 3, t.bot + 2]]).pintar(g, tela, { relieve: 2, max: 2 });
    if (raza === "tiefling") cola(g, [L + 1, t.bot - 1], [L - 7, t.bot + 3], [L - 6, t.bot - 4 + (paso === 1 ? 1 : 0)], piel);
    if (clase === "explorador") {
      new Capa(HW, HH).linea(L - 1, t.top - 3, L + 2, t.bot - 1, 3).pintar(g, R.madera, { relieve: 1, max: 2 });
      g.set(L - 1, t.top - 4, BLANCO, R.hueso).set(L - 2, t.top - 5, R.tela.granate[3], R.tela.granate).set(L, t.top - 5, BLANCO, R.hueso);
    }
    if (clase === "barbaro") new Capa(HW, HH).poly([[L - 1, t.hy], [L + 4, t.top], [L + 3, t.bot + 1], [L - 3, t.bot + 2]]).pintar(g, LOBO, { relieve: 2, max: 3 });
    if (clase === "bardo") {
      new Capa(HW, HH).ell(L - 1, t.bot - 1, 2.8, 3.2).pintar(g, R.madera, { relieve: 2 });
      new Capa(HW, HH).linea(L, t.bot - 4, L + 2, t.top - 6, 2).pintar(g, R.madera, { relieve: 1, max: 2 });
    }
    const manoLejos = [cx + 1 + Math.round(-swing * 0.6), t.top + 6];
    new Capa(HW, HH).linea(cx + 0.5, t.top + 1, manoLejos[0], manoLejos[1] - 1, 2).pintar(g, ro.manga || piel, { relieve: 1, max: 1 });
    objetoLejano(D, manoLejos, "detras");

    /* Piernas. */
    const pierna = (dx, cerca) => {
      const fx = Math.round(cx - 1 + dx), alza = cerca ? 0 : (paso ? 1 : 0);
      if (ro.tunica) {
        new Capa(HW, HH).rect(fx, 29 - alza, 3, 2).rect(fx + 2, 30 - alza, 1, 1).pintar(g, ro.bota, { relieve: 1, max: cerca ? 4 : 2 });
        return;
      }
      const pw = Math.min(t.pierna, 3);
      new Capa(HW, HH).linea(cx - 0.5, t.bot - 1, fx + pw / 2 - 0.5, 28 - alza, pw).pintar(g, ro.pierna, { relieve: 1, max: cerca ? 3 : 1, separar: !cerca ? false : true });
      new Capa(HW, HH).rect(fx, 29 - alza, pw + 1, 2).pintar(g, ro.bota, { relieve: 1, max: cerca ? 4 : 2, separar: true });
    };
    pierna(-zanc * 0.8, false);
    pierna(zanc, true);

    /* Torso. */
    const tor = new Capa(HW, HH);
    if (ro.tunica) tor.poly([[L, t.top], [Rr + 1, t.top], [Rr + 3, 29], [L - 2, 29]]);
    else tor.rect(L, t.top, Rr - L + 1, t.bot - t.top + 1);
    tor.off(L, t.top).off(Rr, t.top);
    tor.pintar(g, ro.torso, { relieve: 3, separar: true });
    if (clase === "guerrero") { new Capa(HW, HH).rect(Rr - 1, t.top + 2, 2, t.bot - t.top + 2).pintar(g, tela, { relieve: 1 }); }
    if (clase === "clerigo") {
      for (let y = t.top; y <= t.bot; y++) for (let x = L; x <= Rr; x++) if ((x + y) % 2 === 0) g.set(x, y, R.hierro[1], R.hierro);
      new Capa(HW, HH).rect(L + 1, t.top + 1, Rr - L, t.bot - t.top + 3).pintar(g, tela, { relieve: 2, separar: true });
    }
    if (clase === "barbaro") {
      new Capa(HW, HH).rect(L, t.bot, Rr - L + 1, 3).pintar(g, tela, { relieve: 1, separar: true });
      new Capa(HW, HH).rect(L - 1, t.top - 1, 4, 3).pintar(g, LOBO, { relieve: 1 });
    }
    const cin = clase === "mago" ? R.bronce : clase === "brujo" ? R.sombra : R.madera;
    if (clase !== "barbaro") for (let x = L; x <= Rr + (ro.tunica ? 1 : 0); x++) g.set(x, t.bot - (ro.tunica ? 3 : 2), cin[x % 2 ? 2 : 3], cin);
    else for (let x = L; x <= Rr; x++) g.set(x, t.bot - 1, R.madera[2], R.madera);

    /* Cabeza de perfil. */
    cabezaLado(D);

    /* Objetos delante (escudo, arco, laúd) y brazo cercano con su arma. */
    objetoLejano(D, manoLejos, "delante");
    const manoCerca = [Math.round(cx + swing * 0.8), t.top + 6];
    new Capa(HW, HH).linea(cx - 0.5, t.top + 1, manoCerca[0], manoCerca[1] - 1, 2).pintar(g, ro.manga || piel, { relieve: 1, separar: true });
    new Capa(HW, HH).rect(manoCerca[0] - 0.5, manoCerca[1] - 0.5, 2, 2).pintar(g, clase === "guerrero" ? R.hierro : piel, { relieve: 1 });
    objetoCercano(D, manoCerca);
  }

  function cabezaLado(D) {
    const { g, t, raza, clase, piel, pelo, tela, peinado, paso } = D;
    const cx = t.cx + 0.5, hy = t.hy, rx = t.hrx - 0.5, ry = t.hry;
    const top = hy - ry;
    const drac = raza === "draconido";
    const cab = new Capa(HW, HH).ell(cx, hy, rx, ry);
    if (!drac) cab.on(cx + rx + 1, hy + 2).on(cx + rx + 0.5, hy + 1);
    cab.pintar(g, piel, { relieve: 4 });
    if (drac) {
      new Capa(HW, HH).poly([[cx, hy - 2], [cx + 8, hy], [cx + 9.5, hy + 2.5], [cx + 8, hy + 4.5], [cx, hy + 5]]).pintar(g, piel, { relieve: 2, separar: true });
      escamas(g, piel, top, hy + ry);
      g.set(cx + 2, hy - 1, R.bronce[4], R.bronce).set(cx + 3, hy - 1, OJOS);
      g.set(cx + 8, hy + 1, piel[0], piel);
      for (let x = Math.round(cx + 2); x <= cx + 8; x++) g.set(x, hy + 3, piel[1], piel);
    }
    const tapa = ["guerrero", "picaro", "explorador", "brujo", "clerigo"].includes(clase);
    /* Pelo: cubre la nuca y la coronilla. */
    if (!tapa && !drac) {
      const c = new Capa(HW, HH);
      if (peinado === "rapado") {
        c.ell(cx, hy - 0.5, rx + 0.3, ry + 0.2);
        for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (y > hy - 3 && x > cx - 3) c.off(x, y);
        for (let y = Math.ceil(hy + 2); y < HH; y++) c.quitarRect(0, y, HW, 1);
        c.pintar(g, pelo, { relieve: 3, max: 2 });
      } else {
        c.ell(cx - 0.3, hy - 0.8, rx + (peinado === "rizado" ? 1.2 : 0.6), ry + 0.3);
        for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if ((y > hy - 1 && x > cx - 1) || y > hy + ry - 1) c.off(x, y);
        c.on(cx + 3, hy - 1).on(cx + 4, hy - 1).on(cx + 1, hy).on(cx, hy);
        if (peinado === "largo") c.rect(Math.round(cx - rx) - 1, hy - 2, 5, ry + 5);
        if (peinado === "recogido") c.ell(cx - rx + 0.5, hy - 3, 2.4, 2.4);
        if (peinado === "rizado") for (let k = -3; k <= 2; k++) c.ell(cx + k * 2, top + Math.abs(k + 0.5) * 0.8, 1.6, 1.6);
        c.pintar(g, pelo, { relieve: 3, separar: true });
        for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (c.tiene(x, y) && hash(x + y, 0, 9) > 0.65 && g.get(x, y) === pelo[2]) g.set(x, y, pelo[1], pelo);
      }
    }
    /* Ojo, oreja y boca. */
    const ex = Math.round(cx + 3);
    if (!drac) {
      if (clase === "brujo") {
        for (let y = hy - 1; y <= hy + 5; y++) for (let x = ex - 2; x < HW; x++) if (g.rampa(x, y) === piel) g.set(x, y, y < hy + 2 ? R.sombra[2] : piel[0], piel);
        g.set(ex + 1, hy + 1, R.magia[4], R.magia).set(ex, hy + 1, R.magia[3], R.magia);
      } else {
        if (raza === "tiefling") g.set(ex + 1, hy + 1, R.bronce[4], R.bronce).set(ex + 1, hy + 2, R.fuego[2], R.fuego);
        else g.set(ex + 1, hy + 1, OJOS).set(ex + 1, hy + 2, OJOS).set(ex + 2, hy + 1, BLANCO);
        g.set(ex + 3, hy + 4, piel[1], piel);
        g.set(ex, hy + 3, R.piel.roja[4], R.piel.roja);
        if (raza === "semiorco") { g.set(ex + 3, hy + 3, R.hueso[4], R.hueso).set(ex + 3, hy + 4, R.hueso[3], R.hueso); g.set(ex, hy, piel[0], piel).set(ex + 1, hy, piel[0], piel); }
        if (raza === "gnomo") new Capa(HW, HH).rect(ex + 4, hy + 1, 2, 2).pintar(g, piel, { relieve: 1, min: 2 });
        if (clase === "picaro") new Capa(HW, HH).rect(ex - 1, hy + 3, 6, 3).pintar(g, tela, { relieve: 1, max: 2, separar: true });
      }
      if (!["guerrero", "picaro", "explorador", "brujo", "clerigo"].includes(clase) && raza !== "elfo")
        new Capa(HW, HH).rect(cx - 2, hy + 1, 2, 2).pintar(g, piel, { relieve: 1, max: 2, separar: true });
    }
    if (D.barba) {
      const larga = !!D.vis.barba;
      const c = new Capa(HW, HH).poly(larga ? [[cx - 1, hy + 2], [cx + 7.5, hy + 2], [cx + 7, hy + 6], [cx + 4, t.top + 6], [cx, t.top + 4]] : [[cx, hy + 3], [cx + 7, hy + 3], [cx + 5.5, hy + 6.5], [cx + 1, hy + 6]]);
      c.pintar(g, pelo, { relieve: 2, separar: true });
      g.set(ex + 3, hy + 4, OJOS);
    }
    /* Tocados de perfil. */
    if (clase === "guerrero") {
      const y = new Capa(HW, HH).ell(cx, hy - 0.5, rx + 0.6, ry + 0.4);
      for (let j = 0; j < HH; j++) for (let x = 0; x < HW; x++) if ((j > hy && x > cx - 2) || j > hy + 3) y.off(x, j);
      y.rect(ex + 2, hy, 2, 2);
      y.pintar(g, R.hierro, { relieve: 3 });
      for (let x = 0; x < HW; x++) if (g.rampa(x, hy) === R.hierro) g.set(x, hy, R.bronce[x % 2 ? 2 : 3], R.bronce);
      new Capa(HW, HH).curva(cx + 2, top - 1, cx - 2, top - 4, cx - 7, top + 3 + (paso ? 1 : 0), 2.6, 1.6).pintar(g, tela, { relieve: 2, separar: true });
    } else if (["picaro", "explorador", "brujo", "clerigo"].includes(clase)) {
      const ram = clase === "clerigo" ? R.hierro : tela;
      const c = new Capa(HW, HH).ell(cx - 0.5, hy - 0.3, rx + 1, ry + 0.9);
      c.rect(t.L + 1, t.top - 1, t.R - t.L - 1, 3);
      if (clase !== "clerigo") c.poly([[cx - 4, top + 1], [cx, top], [cx - 7, top + 3 + (paso ? 1 : 0)]]);
      c.quitarEll(cx + 3.6, hy + 2.4, 3.4, ry - 2.4);
      c.pintar(g, ram, { relieve: 3, separar: true });
      if (clase === "clerigo") for (let j = 0; j < HH; j++) for (let x = 0; x < HW; x++) if (c.tiene(x, j) && (x + j) % 2 === 0) g.set(x, j, ram[Math.max(1, ram.indexOf(g.get(x, j)) - 1)], ram);
    } else if (clase === "mago") {
      new Capa(HW, HH).ell(cx, hy - 3.4, rx + 3, 2).pintar(g, tela, { relieve: 2, separar: true });
      const cono = new Capa(HW, HH).poly([[cx - 5, hy - 2.5], [cx + 5, hy - 2.5], [cx + 2, hy - 6.5], [cx - 5 - (paso ? 1 : 0), hy - 10.5], [cx - 2, hy - 6.5]]);
      cono.pintar(g, tela, { relieve: 3, separar: true });
      for (let x = 0; x < HW; x++) if (cono.tiene(x, hy - 3)) g.set(x, hy - 3, R.bronce[x % 2 ? 3 : 4], R.bronce);
    } else if (clase === "bardo") {
      new Capa(HW, HH).ell(cx + 0.5, hy - 3, rx + 2, 2).pintar(g, tela, { relieve: 2, separar: true });
      new Capa(HW, HH).ell(cx - 0.5, hy - 5, 4, 2.6).pintar(g, tela, { relieve: 3, separar: true });
      for (let x = Math.round(cx - 4); x <= cx + 3; x++) g.set(x, hy - 3, R.tela.granate[3], R.tela.granate);
      const pluma = tela === R.tela.granate ? R.tela.blanco : R.tela.granate;
      new Capa(HW, HH).curva(cx - 2, hy - 5, cx - 6, hy - 7, cx - 8, hy - 11 - (paso ? 1 : 0), 2.4, 1).pintar(g, pluma, { relieve: 1, separar: true });
    } else if (clase === "barbaro") {
      const c = new Capa(HW, HH).ell(cx - 0.5, hy - 2, rx + 0.8, ry - 1.4);
      for (let j = Math.ceil(hy) + 1; j < HH; j++) c.quitarRect(0, j, HW, 1);
      c.rect(cx - rx - 1, hy - 2, 4, 7);
      c.pintar(g, LOBO, { relieve: 3, separar: true });
      new Capa(HW, HH).ell(cx + 4.5, hy - 2, 2.6, 1.6).pintar(g, LOBO, { relieve: 1, min: 3, separar: true });
      g.set(cx + 7, hy - 2, OJOS).set(cx + 3, hy - 3, "#ffd23a");
      new Capa(HW, HH).poly([[cx - 2, top + 2], [cx + 1, top + 1], [cx - 1.5, top - 3]]).pintar(g, LOBO, { relieve: 1, separar: true });
    }
    /* Rasgos de raza por encima. */
    if (raza === "elfo" || raza === "gnomo" || raza === "semiorco") {
      const l = raza === "elfo" ? 4 : 1.5;
      new Capa(HW, HH).poly([[cx - 0.5, hy + 2.5], [cx - 0.5, hy - 0.5], [cx - 1.5 - l, hy - 1 - l * 0.6]]).pintar(g, piel, { relieve: 1, separar: true });
    }
    if (raza === "tiefling" || raza === "satiro") {
      const ram = raza === "tiefling" ? CUERNO : R.hueso, k = raza === "tiefling" ? 1 : 0.6;
      new Capa(HW, HH).curva(cx + 1, top + 2, cx - 1, top - 3 * k, cx - 4 - 2 * k, top - 1 * k, 2.4, 1).pintar(g, ram, { relieve: 1, separar: true });
    }
    if (drac) {
      new Capa(HW, HH).linea(cx - 2, top + 2, cx - 7, top - 1, 2).pintar(g, R.hueso, { relieve: 1, separar: true });
      for (let y = top + 3; y < hy + ry; y += 2) g.set(cx - rx, y, R.hueso[3], R.hueso);
    }
  }

  /* Mano lejana (izquierda del héroe al mirar a la derecha): escudo, arco, orbe o laúd delante. */
  function objetoLejano(D, m, capaDibujo) {
    const { g, t, clase, tela } = D;
    const delante = capaDibujo === "delante";
    if (clase === "guerrero" && delante) {
      const sx = t.cx + 5.5, sy = t.top + 3;
      new Capa(HW, HH).ell(sx, sy, 2, 4.2).pintar(g, R.bronce, { relieve: 2, separar: true });
      new Capa(HW, HH).ell(sx + 0.5, sy, 1, 3).pintar(g, tela, { relieve: 1 });
    } else if (clase === "explorador" && delante) {
      const x = t.cx + 6, y0 = t.top - 5, y1 = t.top + 12;
      new Capa(HW, HH).curva(x, y0, x + 4, (y0 + y1) / 2, x, y1, 1.8, 1.8).pintar(g, R.madera, { relieve: 1, separar: true });
      for (let y = y0 + 1; y < y1; y++) g.set(x, y, R.hueso[2], R.hueso);
    } else if (clase === "brujo" && delante) {
      const x = t.cx + 6, y = t.top + 3;
      new Capa(HW, HH).ell(x, y, 2, 2).pintar(g, R.magia, { relieve: 2, min: 2 });
      g.set(x - 1, y - 1, R.magia[4], R.magia);
    } else if (clase === "bardo" && delante) {
      const x = t.cx + 3, y = t.top + 5;
      new Capa(HW, HH).linea(x + 1, y - 1, x + 8, y - 5, 2).pintar(g, R.madera, { relieve: 1, max: 2, separar: true });
      new Capa(HW, HH).ell(x, y, 2.6, 2.6).pintar(g, R.madera, { relieve: 2, min: 2, separar: true });
      g.set(x, y, OJOS);
      for (let k = 1; k < 6; k++) g.set(x + k, y - Math.round(k * 0.6), R.hueso[2], R.hueso);
    }
  }

  /* Mano cercana: espada, hacha, dagas, bastón o maza. */
  function objetoCercano(D, m) {
    const { g, t, clase } = D;
    const [mx, my] = m;
    if (clase === "guerrero") {
      new Capa(HW, HH).linea(mx + 2, my + 2, mx + 6, my + 6, 1).pintar(g, R.hierro, { plano: 4 });
      new Capa(HW, HH).linea(mx + 1, my + 3, mx + 3, my + 1, 1).pintar(g, R.bronce, { plano: 3 });
    } else if (clase === "barbaro") {
      new Capa(HW, HH).rect(mx, t.top - 5, 1, my - t.top + 8).pintar(g, R.madera, { plano: 3 });
      new Capa(HW, HH).poly([[mx + 1, t.top - 6], [mx + 5, t.top - 8], [mx + 5.5, t.top - 1], [mx + 1, t.top - 2.5]]).pintar(g, R.hierro, { relieve: 2, separar: true });
    } else if (clase === "picaro") {
      new Capa(HW, HH).linea(mx + 2, my + 1, mx + 5, my + 1, 1).pintar(g, R.plata, { plano: 4 });
      g.set(mx + 1, my, R.bronce[2], R.bronce).set(mx + 1, my + 2, R.bronce[2], R.bronce);
    } else if (clase === "mago") {
      const x = mx + 1;
      new Capa(HW, HH).rect(x, t.hy - 5, 1, 29 - (t.hy - 5)).pintar(g, R.madera, { plano: 3 });
      new Capa(HW, HH).ell(x, t.hy - 6.5, 1.7, 1.7).pintar(g, R.mar, { relieve: 1, min: 3 });
      g.set(x - 1, t.hy - 7, BLANCO);
    } else if (clase === "clerigo") {
      new Capa(HW, HH).rect(mx + 1, my - 3, 1, 6).pintar(g, R.madera, { plano: 3 });
      new Capa(HW, HH).ell(mx + 1, my - 4.5, 1.8, 1.8).pintar(g, R.hierro, { relieve: 1, min: 2, separar: true });
    }
  }

  /* ================= 2) Escena del cruce de caminos 256×144 ================= */
  const EW = 256, EH = 144;
  const ULTIMA = {};

  /* Geometría: entrada, cruce, salidas en orden de izquierda a derecha y ramas como curvas. */
  function geometria(n, rnd) {
    const j = a => Math.round((rnd() - 0.5) * 2 * a);
    const cruce = [128 + j(8), 74 + j(5)];
    const entrada = [cruce[0], 140];
    let sal;
    if (n === 1) sal = [[lim(cruce[0] + j(36), 40, 216), 0]];
    else if (n === 2) {
      const v = rnd();
      sal = v < 0.34 ? [[0, 40 + j(10)], [150 + j(30), 0]] : v < 0.67 ? [[106 + j(30), 0], [EW - 1, 40 + j(10)]] : [[62 + j(16), 0], [194 + j(16), 0]];
    } else if (n === 3) sal = [[0, 48 + j(10)], [128 + j(24), 0], [EW - 1, 48 + j(10)]];
    else sal = [[0, 56 + j(8)], [80 + j(12), 0], [176 + j(12), 0], [EW - 1, 56 + j(8)]];
    const ramas = sal.map(s => {
      const lateral = s[0] === 0 || s[0] === EW - 1;
      const ctrl = lateral ? [cruce[0] + (s[0] - cruce[0]) * 0.42 + j(6), s[1] + 4 + j(5)] : [s[0] + j(6), cruce[1] * 0.5 + j(5)];
      const pts = [];
      const N = 12;
      for (let k = 0; k <= N; k++) {
        const t = k / N, u = 1 - t;
        pts.push([Math.round(u * u * cruce[0] + 2 * u * t * ctrl[0] + t * t * s[0]), Math.round(u * u * cruce[1] + 2 * u * t * ctrl[1] + t * t * s[1])]);
      }
      pts[0] = cruce.slice(); pts[N] = s.slice();
      return pts;
    });
    return { cruce, entrada, salidas: sal, ramas };
  }

  /* Campo de distancias al camino: E < 0 dentro del sendero (negativo = más al centro). */
  function campo(geo) {
    const E = new Float32Array(EW * EH).fill(99);
    const segs = [];
    const tronco = [[geo.entrada[0], EH + 8], geo.entrada, geo.cruce];
    for (let k = 0; k < tronco.length - 1; k++) segs.push([...tronco[k], ...tronco[k + 1], 7]);
    for (const r of geo.ramas) for (let k = 0; k < r.length - 1; k++) {
      const [x0, y0] = r[k], [x1, y1] = r[k + 1];
      /* más allá del borde el sendero sigue un poco */
      segs.push([x0, y0, x1, y1, 6]);
    }
    for (const r of geo.ramas) { const a = r[r.length - 2], b = r[r.length - 1]; segs.push([b[0], b[1], b[0] + (b[0] - a[0]) * 2, b[1] + (b[1] - a[1]) * 2, 6]); }
    const M = 40;
    for (const [x0, y0, x1, y1, hw] of segs) {
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
      const xa = Math.max(0, Math.floor(Math.min(x0, x1) - M)), xb = Math.min(EW - 1, Math.ceil(Math.max(x0, x1) + M));
      const ya = Math.max(0, Math.floor(Math.min(y0, y1) - M)), yb = Math.min(EH - 1, Math.ceil(Math.max(y0, y1) + M));
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
        let t = ((x - x0) * dx + (y - y0) * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = x - x0 - t * dx, ey = y - y0 - t * dy;
        const v = Math.sqrt(ex * ex + ey * ey) - hw, i = y * EW + x;
        if (v < E[i]) E[i] = v;
      }
    }
    /* Plazoleta en el cruce. */
    const [cx, cy] = geo.cruce;
    for (let y = Math.max(0, cy - 50); y < Math.min(EH, cy + 50); y++) for (let x = Math.max(0, cx - 50); x < Math.min(EW, cx + 50); x++) {
      const v = Math.hypot(x - cx, (y - cy) * 1.15) - 11, i = y * EW + x;
      if (v < E[i]) E[i] = v;
    }
    return E;
  }

  /* Pequeños sprites con contorno, pegados en la escena (ordenados por su base). */
  function sprite(w, h, fn) {
    const g = new Rejilla(w, h);
    fn(g, () => new Capa(w, h));
    g.contorno();
    return g;
  }
  /* Oscurece un tono el suelo en una elipse (sombra proyectada). */
  function sombra(g, cx, cy, rx, ry, pasos = 1) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1 || !g.dentro(x, y)) continue;
      const ram = g.rampa(x, y), col = g.get(x, y);
      if (!ram) continue;
      const i = ram.indexOf(col);
      if (i > 0) g.set(x, y, ram[Math.max(0, i - pasos)], ram);
    }
  }
  const pegar = (g, s, x, y) => g.pegar(s, Math.round(x - s.w / 2), Math.round(y - s.h + 1));

  /* Coloca objetos: prueba posiciones al azar que cumplan la condición y no se pisen. */
  function sembrar(rnd, cuantos, intentos, ok, sep, lista = []) {
    const out = [];
    for (let k = 0; k < intentos && out.length < cuantos; k++) {
      const x = Math.floor(rnd() * EW), y = Math.floor(rnd() * EH);
      if (!ok(x, y)) continue;
      if (lista.concat(out).some(p => Math.abs(p[0] - x) < sep && Math.abs(p[1] - y) < sep * 0.8)) continue;
      out.push([x, y]);
    }
    return out;
  }

  /* ---------- Sprites de decorado ---------- */
  const SPR = {
    arbol(v) {
      const r = 8 + Math.floor(v * 4);
      return sprite(2 * r + 6, 2 * r + 8, (g, C) => {
        const cx = r + 3, cy = r + 2;
        new Capa(g.w, g.h).rect(cx - 1, cy + r - 3, 3, 6).pintar(g, R.madera, { relieve: 1 });
        const c = new Capa(g.w, g.h).ell(cx, cy, r, r - 0.5);
        for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + v * 3; c.ell(cx + Math.cos(a) * (r - 2.5), cy + Math.sin(a) * (r - 3), 3.2, 3); }
        c.pintar(g, ARBOL, { relieve: r * 0.9, fuerza: 2.6 });
        /* Matas de hojas: pequeños bultos con brillo arriba a la izquierda. */
        for (let k = 0; k < r * 2.2; k++) {
          const a = hash(k, r, 11) * Math.PI * 2, d = Math.sqrt(hash(k, r, 12)) * (r - 2);
          const x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
          const i = ARBOL.indexOf(g.get(x, y));
          if (i < 0) continue;
          g.set(x, y, ARBOL[Math.min(4, i + 1)], ARBOL).set(x + 1, y + 1, ARBOL[Math.max(0, i - 1)], ARBOL);
        }
      });
    },
    pino(v) {
      const r = 7 + Math.floor(v * 3);
      return sprite(2 * r + 4, 2 * r + 8, (g) => {
        const cx = r + 2, cy = r + 2;
        new Capa(g.w, g.h).rect(cx - 1, cy + r - 2, 2, 5).pintar(g, R.madera, { relieve: 1 });
        const c = new Capa(g.w, g.h);
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; c.poly([[cx, cy], [cx + Math.cos(a - 0.35) * r * 0.7, cy + Math.sin(a - 0.35) * r * 0.7], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]]); }
        c.ell(cx, cy, r * 0.65);
        c.pintar(g, PINO, { relieve: r * 0.7, fuerza: 3 });
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; for (let d = 2; d < r - 1; d++) g.set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, PINO[d < r * 0.5 ? 3 : 2], PINO); }
        g.set(cx, cy, PINO[4], PINO);
      });
    },
    roca(ram, v, tam = 1) {
      const w = Math.round(7 + v * 4 * tam), h = Math.round(5 + v * 3 * tam);
      return sprite(w + 2, h + 2, (g) => {
        const c = new Capa(g.w, g.h).ell(g.w / 2 - 0.5, g.h / 2, w / 2, h / 2);
        c.on(Math.round(g.w / 2 + w / 4), 1).on(Math.round(g.w / 2 + w / 4) - 1, 1);
        c.pintar(g, ram, { relieve: 3, fuerza: 3 });
        g.set(Math.round(g.w / 2 - w / 4), Math.round(g.h / 2 - h / 4), ram[4], ram);
      });
    },
    seta(v) {
      return sprite(7, 7, (g) => {
        new Capa(7, 7).rect(2, 3, 2, 3).pintar(g, R.hueso, { relieve: 1, min: 3 });
        new Capa(7, 7).ell(3, 2.5, 2.6, 1.8).pintar(g, v > 0.5 ? R.sangre : R.bronce, { relieve: 2, min: 2 });
        g.set(2, 2, BLANCO).set(4, 1, BLANCO);
      });
    },
    arbusto(ram) {
      return sprite(12, 9, (g) => {
        const c = new Capa(12, 9).ell(4, 5, 3.4, 3).ell(7.5, 4.5, 3.6, 3.3).ell(6, 6, 4, 2.4);
        c.pintar(g, ram, { relieve: 3, fuerza: 3 });
        g.set(4, 3, ram[4], ram).set(8, 2, ram[4], ram);
      });
    },
    hueso(v) {
      return sprite(9, 6, (g) => {
        if (v > 0.55) {
          /* calavera */
          new Capa(9, 6).ell(4, 2.5, 2.6, 2.2).rect(3, 3, 3, 2).pintar(g, R.hueso, { relieve: 2, min: 2 });
          g.set(3, 3, OJOS).set(5, 3, OJOS).set(4, 4, R.hueso[1], R.hueso);
        } else {
          new Capa(9, 6).linea(1.5, 3.5, 7, 1.5, 1).ell(1.5, 3.5, 1, 1).ell(7, 1.5, 1, 1).pintar(g, R.hueso, { relieve: 1, min: 2 });
          new Capa(9, 6).linea(2, 1.5, 6, 4.5, 1).pintar(g, R.hueso, { relieve: 1, min: 3 });
        }
      });
    },
    charco(ram, v) {
      const w = 8 + Math.round(v * 8), h = 4 + Math.round(v * 2);
      const g = new Rejilla(w + 2, h + 2);
      const c = new Capa(w + 2, h + 2).ell(w / 2 + 0.5, h / 2 + 0.5, w / 2, h / 2).ell(w / 2 + 2.5, h / 2 + 1, w / 3, h / 2.2);
      c.pintar(g, ram, { relieve: 2, max: 3, min: 1, luz: [0.5, 0.62, 0.6] });
      g.set(Math.round(w / 2 - 1), Math.round(h / 2), ram[4], ram);
      return g;
    },
    antorcha() {
      return sprite(7, 10, (g) => {
        new Capa(7, 10).rect(3, 4, 1, 5).pintar(g, R.madera, { plano: 2 });
        new Capa(7, 10).rect(2, 4, 3, 2).pintar(g, R.hierro, { relieve: 1 });
        new Capa(7, 10).ell(3, 2, 1.6, 2).pintar(g, R.fuego, { relieve: 1, min: 2 });
        g.set(3, 2, R.fuego[4], R.fuego);
      });
    },
    estatua(v) {
      return sprite(14, 22, (g) => {
        new Capa(14, 22).rect(1, 14, 12, 7).pintar(g, PATIO, { relieve: 2 });
        new Capa(14, 22).rect(2, 14, 10, 2).pintar(g, PATIO, { plano: 4 });
        /* figura de un caballero visto desde arriba */
        new Capa(14, 22).ell(7, 10, 4, 4).pintar(g, R.marmol, { relieve: 3 });
        new Capa(14, 22).ell(7, 5, 3.4, 3.2).pintar(g, R.marmol, { relieve: 3, separar: true });
        new Capa(14, 22).rect(v > 0.5 ? 11 : 2, 1, 1, 12).pintar(g, R.marmol, { plano: 2 });
        g.set(6, 4, R.marmol[1], R.marmol).set(8, 4, R.marmol[1], R.marmol);
      });
    },
    brasero() {
      return sprite(11, 13, (g) => {
        new Capa(11, 13).rect(4, 8, 3, 4).rect(2, 11, 7, 1).pintar(g, R.hierro, { relieve: 1 });
        new Capa(11, 13).ell(5, 7, 4.5, 2.5).pintar(g, R.hierro, { relieve: 2 });
        new Capa(11, 13).ell(5, 6.5, 3.2, 1.4).pintar(g, R.fuego, { plano: 1 });
        new Capa(11, 13).ell(5, 4, 2.6, 3).pintar(g, R.fuego, { relieve: 2, min: 2 });
        g.set(5, 3, R.fuego[4], R.fuego).set(4, 5, R.fuego[4], R.fuego);
      });
    },
    columna() {
      return sprite(12, 14, (g) => {
        new Capa(12, 14).rect(1, 9, 10, 4).pintar(g, PATIO, { relieve: 2 });
        new Capa(12, 14).ell(6, 6, 4.4, 4.4).pintar(g, R.marmol, { relieve: 3, fuerza: 3 });
        new Capa(12, 14).ell(6, 6, 2.4, 2.4).pintar(g, R.marmol, { relieve: 2, min: 3 });
      });
    },
    rocaHumo(v) {
      return sprite(14, 11, (g) => {
        new Capa(14, 11).ell(7, 6, 6, 4).ell(4, 7, 3.5, 3).pintar(g, BASALTO, { relieve: 3, fuerza: 3, profundo: true });
        new Capa(14, 11).ell(7.5, 5, 1.8, 1.2).pintar(g, LAVA, { relieve: 1, min: 2 });
        g.set(7, 5, LAVA[4], LAVA);
      });
    },
    obsidiana(v) {
      return sprite(10, 12, (g) => {
        const c = new Capa(10, 12).poly([[2, 11], [3.5, 2], [5, 11]]).poly([[4, 11], [6.5, 4], [8, 11]]).poly([[1, 11], [1.5, 7], [3, 11]]);
        c.pintar(g, OBSIDIANA, { relieve: 1, fuerza: 3 });
        g.set(3, 4, OBSIDIANA[4], OBSIDIANA).set(6, 6, OBSIDIANA[4], OBSIDIANA);
      });
    },
    cristal(ram, v) {
      return sprite(12, 15, (g) => {
        const c = new Capa(12, 15).poly([[4, 14], [5.5, 1], [7.5, 14]]).poly([[6.5, 14], [9.5, 5], [10.5, 14]]).poly([[1, 14], [2, 7], [4.5, 14]]);
        c.pintar(g, ram, { relieve: 1.5, fuerza: 3 });
        for (let y = 3; y < 13; y++) g.set(5, y, ram[4], ram);
        g.set(9, 7, ram[4], ram);
      });
    },
    flor(col, v) {
      return null;
    }
  };

  /* ---------- Temas por acto ---------- */
  const TEMAS = [
    /* 0 · Pradera y bosque: sendero de tierra, río con puente, flores, setas y rocas. */
    function bosque(c) {
      const { g, E, rnd, s, geo } = c;
      const fase = hash(s, 1, 1) * 6, fase2 = hash(s, 2, 1) * 6;
      const rioY = x => 110 + Math.sin(x / 26 + fase) * 5 + Math.sin(x / 11 + fase2) * 2;
      const enRio = (x, y) => Math.abs(y - rioY(x)) < 6.5;
      const tx = geo.cruce[0];
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const i = y * EW + x, e = E[i] + (ruido(x, y, 5, s) - 0.5) * 2.2;
        const ry = rioY(x), dr = Math.abs(y - ry);
        if (dr < 6.5) {
          /* Agua: más honda en el centro, orillas claras y vetas de corriente. */
          let v = 1.6 + (dr / 6.5) * 1.6 + (ruido(x * 0.4, y * 2, 3, s + 4) - 0.5) * 1.2;
          if (dr > 5.5) v = 3.4;
          if (((x + Math.round(ry * 3)) % 13 === 0) && dr < 4) v = 3.6;
          g.set(x, y, AGUA[tono(v, x, y)], AGUA);
        } else if (dr < 8 && e > -1) {
          g.set(x, y, TIERRA[y < ry ? 2 : 1], TIERRA);
        } else if (e < 0) {
          let v = 2.3 + (ruido(x, y, 4, s + 2) - 0.5) * 1.4;
          if (e > -1.2) v = 1.4;
          else if (e > -2.2) v = 1.9;
          if (hash(x, y, s) > 0.95) v = 3.8;
          g.set(x, y, TIERRA[tono(v, x, y)], TIERRA);
        } else {
          let v = 2.1 + (fbm(x, y, 18, s + 3) - 0.5) * 2.2;
          if (e < 1.6) v -= 0.7;
          const h = hash(x, y, s + 5);
          if (h > 0.93) v += 1.3; else if (h < 0.05) v -= 1.2;
          g.set(x, y, HIERBA[suave(lim(v, 0.6, 4), x, y)], HIERBA);
        }
      }
      /* Matas de hierba en forma de «v». */
      for (let k = 0; k < 220; k++) {
        const x = Math.floor(hash(k, 1, s + 6) * EW), y = Math.floor(hash(k, 2, s + 6) * EH);
        if (E[y * EW + x] < 2 || enRio(x, y) || enRio(x, y + 2)) continue;
        g.set(x, y, HIERBA[1], HIERBA).set(x + 2, y, HIERBA[1], HIERBA).set(x + 1, y + 1, HIERBA[1], HIERBA).set(x, y - 1, HIERBA[4], HIERBA).set(x + 2, y - 1, HIERBA[3], HIERBA);
      }
      /* Puente de madera sobre el río. */
      const yR = rioY(tx);
      for (let y = Math.floor(yR - 9); y <= yR + 9; y++) for (let x = tx - 9; x <= tx + 9; x++) {
        const borde = x <= tx - 8 || x >= tx + 8;
        const v = borde ? (x <= tx - 8 ? 1 : 2) : ((y - Math.floor(yR - 9)) % 3 === 2 ? 1 : 3 - (hash(x >> 2, y, s) > 0.7 ? 1 : 0));
        g.set(x, y, R.madera[v], R.madera);
      }
      for (const yy of [Math.floor(yR - 9), Math.floor(yR + 8)]) for (const xx of [tx - 9, tx + 8]) new Capa(EW, EH).rect(xx, yy - 1, 2, 3).pintar(g, R.madera, { relieve: 1 });
      sombra(g, tx, yR + 10, 9, 1.2);
      /* Flores en grupos. */
      const flores = [];
      for (let k = 0; k < 46; k++) {
        const x = Math.floor(hash(k, 3, s + 7) * EW), y = Math.floor(hash(k, 4, s + 7) * EH);
        if (E[y * EW + x] < 3 || enRio(x, y) || Math.abs(y - rioY(x)) < 9) continue;
        const col = FLORES[Math.floor(hash(k, 5, s) * FLORES.length)];
        for (let m = 0; m < 4; m++) {
          const fx = x + Math.round((hash(k, m, 8) - 0.5) * 8), fy = y + Math.round((hash(k, m, 9) - 0.5) * 6);
          if (E[lim(fy, 0, EH - 1) * EW + lim(fx, 0, EW - 1)] < 2) continue;
          g.set(fx, fy + 1, HIERBA[1], HIERBA).set(fx, fy, col).set(fx - 1, fy, col).set(fx + 1, fy, col).set(fx, fy - 1, col).set(fx, fy, "#fff4b0");
          if (m === 0) flores.push([fx, fy, col]);
        }
      }
      /* Árboles al fondo y por los bordes, lejos del camino y del río. */
      const objs = [];
      const pos = sembrar(rnd, 30, 900, (x, y) => E[y * EW + x] > 14 + hash(x, y, 3) * 6 && Math.abs(y - rioY(x)) > 16, 15);
      pos.forEach(([x, y], k) => { const v = hash(x, y, s + 8); objs.push({ x, y: y + 10, s: v > 0.6 ? SPR.pino(v) : SPR.arbol(v), som: v > 0.6 ? 7 : 10 }); });
      sembrar(rnd, 10, 400, (x, y) => E[y * EW + x] > 4 && E[y * EW + x] < 14 && Math.abs(y - rioY(x)) > 10, 12, pos).forEach(([x, y]) => objs.push({ x, y, s: SPR.arbusto(HIERBA), som: 5 }));
      sembrar(rnd, 8, 400, (x, y) => E[y * EW + x] > 6 && E[y * EW + x] < 18 && Math.abs(y - rioY(x)) > 10, 10, pos).forEach(([x, y]) => objs.push({ x, y, s: SPR.roca(R.piedra, hash(x, y, 3)), som: 4 }));
      sembrar(rnd, 7, 400, (x, y) => E[y * EW + x] > 3 && E[y * EW + x] < 20 && Math.abs(y - rioY(x)) > 10, 8, pos).forEach(([x, y]) => objs.push({ x, y, s: SPR.seta(hash(x, y, 4)), som: 2 }));
      /* Rocas en las orillas. */
      for (const x of [20 + Math.floor(rnd() * 40), 180 + Math.floor(rnd() * 50)]) if (Math.abs(x - tx) > 20) objs.push({ x, y: Math.round(rioY(x) + 5), s: SPR.roca(R.piedra, 0.5), som: 0 });
      c.dibujar(objs);
      const brillos = [];
      for (let k = 0; k < 14; k++) { const x = 4 + Math.floor(hash(k, 1, s + 9) * 248); if (Math.abs(x - tx) > 11) brillos.push([x, Math.round(rioY(x) + (hash(k, 2, s) - 0.5) * 7)]); }
      c.puntos = { agua: brillos, flores: flores.slice(0, 18), rioY: Array.from({ length: EW }, (_, x) => Math.round(rioY(x))), puente: tx };
    },

    /* 1 · Mazmorra: pasillos de losas entre muros, antorchas, charcos y huesos. */
    function mazmorra(c) {
      const { g, E, rnd, s, geo } = c;
      const [cx, cy] = geo.cruce;
      const suelo = new Uint8Array(EW * EH);
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const sala = Math.abs(x - cx) < 26 && Math.abs(y - cy) < 17;
        if (E[y * EW + x] < 4 || sala) suelo[y * EW + x] = 1;
      }
      const S = (x, y) => x < 0 || y < 0 || x >= EW ? 0 : suelo[Math.min(y, EH - 1) * EW + x];
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        if (S(x, y)) {
          /* Losas de 8×8 a tresbolillo con juntas oscuras. */
          const fila = Math.floor(y / 8), ox = (fila % 2) * 4, col = Math.floor((x + ox) / 8);
          const jx = (x + ox) % 8, jy = y % 8;
          let v = 2 + (hash(col, fila, s) - 0.5) * 1.4;
          if (jx === 0 || jy === 0) v = 0.6;
          else if (jx === 1 || jy === 1) v += 0.7;
          else if (jx === 7 || jy === 7) v -= 0.5;
          if (hash(x, y, s + 1) > 0.97) v -= 1;
          if (E[y * EW + x] < -2 && hash(col, fila, s + 3) > 0.8) v += 0.4;
          /* sombra junto a los muros */
          if (!S(x, y - 1) || !S(x, y - 2)) v -= 1.2;
          if (!S(x - 1, y) || !S(x + 1, y)) v -= 0.6;
          g.set(x, y, LOSA[suave(lim(v, 0, 4), x, y)], LOSA);
        } else {
          /* Muro: cara de ladrillo si debajo hay suelo; si no, la parte de arriba. */
          let cara = 0;
          for (let k = 1; k <= 8; k++) if (S(x, y + k)) { cara = k; break; }
          if (cara) {
            const fila = Math.floor(y / 4), ox = (fila % 2) * 4;
            const jun = y % 4 === 0 || (x + ox) % 8 === 0;
            let v = jun ? 0.8 : 2.4 + (hash(Math.floor((x + ox) / 8), fila, s) - 0.5) * 1.2;
            if (cara === 1) v = 0.4;
            else if (cara === 2) v -= 0.8;
            if (cara === 8 || !S(x, y + 9) && cara === 8) v = 3.6;
            g.set(x, y, LADRILLO[suave(lim(v, 0, 4), x, y)], LADRILLO);
          } else {
            /* Parte de arriba del muro: grandes sillares oscuros con el canto iluminado. */
            const fila = Math.floor(y / 8), ox = (fila % 2) * 8, bx = Math.floor((x + ox) / 16);
            const jx = (x + ox) % 16, jy = y % 8;
            let v = 1.25 + (hash(bx, fila, s + 2) - 0.5) * 0.6;
            if (jx === 0 || jy === 0) v = 0.3;
            else if (jx === 1 || jy === 1) v += 0.5;
            if (fbm(x, y, 16, s + 5) > 0.66 && hash(x, y, s) > 0.6) v -= 0.8;
            const borde = S(x, y + 9) || S(x - 1, y) || S(x + 1, y) || S(x, y - 1);
            if (borde) v = 3.6;
            g.set(x, y, MURO[suave(lim(v, 0, 4), x, y)], MURO);
          }
        }
      }
      /* Grietas y musgo en el suelo. */
      for (let k = 0; k < 40; k++) {
        let x = Math.floor(hash(k, 1, s + 4) * EW), y = Math.floor(hash(k, 2, s + 4) * EH);
        if (!S(x, y)) continue;
        for (let m = 0; m < 5; m++) { g.set(x, y, LOSA[0], LOSA); x += hash(k, m, 5) > 0.5 ? 1 : 0; y += 1; }
      }
      for (let k = 0; k < 60; k++) {
        const x = Math.floor(hash(k, 3, s + 4) * EW), y = Math.floor(hash(k, 4, s + 4) * EH);
        if (S(x, y) && (!S(x - 2, y) || !S(x + 2, y) || !S(x, y - 3))) g.set(x, y, R.hoja[2], R.hoja).set(x + 1, y, R.hoja[1], R.hoja);
      }
      /* Antorchas en las caras de los muros. */
      const antorchas = [];
      for (let x = 6; x < EW - 6; x += 5) for (let y = 4; y < EH - 2; y++) {
        if (S(x, y + 1) && !S(x, y) && !S(x, y - 5) && !S(x - 3, y - 4) && !S(x + 3, y - 4) && hash(x, y, s + 6) > 0.6 && !antorchas.some(a => Math.abs(a[0] - x) < 30 && Math.abs(a[1] - y) < 20)) {
          antorchas.push([x, y - 4]);
        }
      }
      const objs = [];
      for (const [x, y] of antorchas) {
        /* resplandor cálido en la pared y el suelo */
        for (let j = -10; j <= 12; j++) for (let i = -10; i <= 10; i++) {
          const d = Math.hypot(i, j * 0.9);
          if (d > 10 || !g.dentro(x + i, y + j)) continue;
          const ram = g.rampa(x + i, y + j), idx = ram ? ram.indexOf(g.get(x + i, y + j)) : -1;
          if (idx >= 0 && idx < 4 && (10 - d) / 10 > umbral(x + i, y + j) * 1.3) g.set(x + i, y + j, ram[idx + 1], ram);
        }
        objs.push({ x, y: y + 5, s: SPR.antorcha(), som: 0 });
      }
      const libre = (x, y, m) => S(x, y) && S(x - m, y) && S(x + m, y) && S(x, y - m) && S(x, y + m);
      sembrar(rnd, 5, 500, (x, y) => libre(x, y, 6) && Math.hypot(x - cx, y - cy) > 8, 20).forEach(([x, y]) => {
        const p = SPR.charco(AGUA, hash(x, y, 2));
        g.pegar(p, x - (p.w >> 1), y - (p.h >> 1));
      });
      sembrar(rnd, 9, 600, (x, y) => libre(x, y, 4) && E[y * EW + x] > -3, 12).forEach(([x, y]) => objs.push({ x, y, s: SPR.hueso(hash(x, y, s + 2)), som: 0 }));
      sembrar(rnd, 5, 500, (x, y) => libre(x, y, 3) && E[y * EW + x] > 1.5, 14).forEach(([x, y]) => objs.push({ x, y, s: SPR.roca(LOSA, hash(x, y, 7), 0.6), som: 2 }));
      c.dibujar(objs);
      c.puntos = { antorchas };
    },

    /* 2 · Castillo: patio enlosado, pasillos con alfombra roja, estatuas, columnas y braseros. */
    function castillo(c) {
      const { g, E, rnd, s, geo } = c;
      const [cx, cy] = geo.cruce;
      /* Jardines: parterres rectangulares de 20×20 lejos de los pasillos (2 césped, 1 seto). */
      const Ec = (x, y) => E[lim(y, 0, EH - 1) * EW + lim(x, 0, EW - 1)];
      const celdas = new Map();
      const jardin = (x, y) => {
        const i = Math.floor(x / 20), j = Math.floor(y / 20), k = i + j * 100;
        if (!celdas.has(k)) {
          const x0 = i * 20, y0 = j * 20;
          let ok = hash(i, j, s + 11) > 0.55;
          for (let a = -4; a <= 24 && ok; a += 4) for (let b = -4; b <= 24 && ok; b += 4) if (Ec(x0 + a, y0 + b) < 7) ok = false;
          celdas.set(k, ok);
        }
        if (!celdas.get(k)) return 0;
        const lx = x % 20, ly = y % 20;
        if (lx < 2 || ly < 2 || lx > 17 || ly > 17) return 0;
        if (lx < 4 || ly < 4 || lx > 15 || ly > 15) return 1;
        return 2;
      };
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const i = y * EW + x, e = E[i];
        const dC = Math.hypot(x - cx, (y - cy) * 1.15);
        if (e < -1.5 || dC < 9) {
          /* Alfombra roja con ribete dorado y rombos. */
          let col, ram = ALFOMBRA;
          const borde = e > -2.6 && dC > 9.5;
          if (dC < 9) {
            const anillo = Math.abs(dC - 7.5) < 1;
            col = anillo ? R.bronce[3] : ALFOMBRA[(Math.floor(dC) % 3 === 0) ? 2 : 3]; ram = anillo ? R.bronce : ALFOMBRA;
          } else if (borde) { col = R.bronce[(x + y) % 2 ? 3 : 2]; ram = R.bronce; }
          else {
            const rombo = (Math.abs(((x + y) % 12) - 6) + Math.abs(((x - y + 600) % 12) - 6)) < 3;
            col = rombo ? ALFOMBRA[4] : ALFOMBRA[e < -4.5 ? 2 : 3];
            if (e > -3) col = ALFOMBRA[1];
          }
          g.set(x, y, col, ram);
        } else if (e < 5) {
          /* Pasillo de piedra oscura junto a la alfombra. */
          const jx = x % 6 === 0, jy = y % 6 === 0;
          let v = jx || jy ? 1 : 2.3 + (hash(Math.floor(x / 6), Math.floor(y / 6), s) - 0.5);
          if (e > 3.8) v = 0.8;
          if (e < -0.5) v = 1.2;
          g.set(x, y, PATIO[tono(v, x, y)], PATIO);
        } else {
          const J = jardin(x, y);
          if (J === 2) {
            let v = 2.4 + (ruido(x, y, 4, s) - 0.5) * 1.1;
            if (hash(x, y, s + 3) > 0.95) v = 4;
            g.set(x, y, HIERBA[suave(v, x, y)], HIERBA);
          } else if (J === 1) {
            g.set(x, y, SETO[suave(2.4 + (hash(x >> 1, y >> 1, s) - 0.5) * 1.4, x, y)], SETO);          } else {
            /* Losas grandes del patio. */
            const fila = Math.floor(y / 10), ox = (fila % 2) * 5;
            const jx = (x + ox) % 10, jy = y % 10;
            let v = 2.6 + (hash(Math.floor((x + ox) / 10), fila, s + 1) - 0.5) * 0.9;
            if (jx === 0 || jy === 0) v = 1.2;
            else if (jx === 1 || jy === 1) v += 0.8;
            else if (jx === 9 || jy === 9) v -= 0.5;
            if (e < 7) v -= 0.6;
            g.set(x, y, PATIO[suave(lim(v, 0, 4), x, y)], PATIO);
          }
        }
      }
      /* Bordes de seto con relieve alrededor de los jardines. */
      for (let y = 1; y < EH - 1; y++) for (let x = 1; x < EW - 1; x++) {
        if (g.rampa(x, y) === SETO && g.rampa(x, y + 1) !== SETO) g.set(x, y, SETO[1], SETO);
        if (g.rampa(x, y) === SETO && g.rampa(x, y - 1) !== SETO) g.set(x, y, SETO[4], SETO);
      }
      /* Estatuas, columnas y braseros a los lados de los pasillos. */
      const objs = [];
      const braseros = [];
      const usados = [];
      for (const r of geo.ramas.concat([[geo.cruce, geo.entrada]])) {
        for (let k = 1; k < r.length - 1; k += 1) {
          const [x0, y0] = r[k], [x1, y1] = r[k + 1] || r[k];
          const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
          for (const lado of [-1, 1]) {
            const px = Math.round(x0 - dy / l * 14 * lado), py = Math.round(y0 + dx / l * 14 * lado);
            if (px < 6 || py < 12 || px > EW - 7 || py > EH - 2) continue;
            if (E[py * EW + px] < 6 || E[(py - 8) * EW + px] < 3) continue;
            if (usados.some(u => Math.abs(u[0] - px) < 22 && Math.abs(u[1] - py) < 18)) continue;
            usados.push([px, py]);
            const v = hash(px, py, s + 4);
            if (v < 0.4) { objs.push({ x: px, y: py, s: SPR.brasero(), som: 0 }); braseros.push([px, py - 9]); }
            else if (v < 0.7) objs.push({ x: px, y: py, s: SPR.estatua(v), som: 7 });
            else objs.push({ x: px, y: py, s: SPR.columna(), som: 6 });
          }
        }
      }
      sembrar(rnd, 6, 400, (x, y) => g.rampa(x, y) === HIERBA && E[y * EW + x] > 18, 18).forEach(([x, y]) => objs.push({ x, y, s: SPR.arbusto(SETO), som: 4 }));
      c.dibujar(objs);
      c.puntos = { braseros };
    },

    /* 3 · Volcán: roca negra agrietada, ríos de lava con puente de piedra, rocas humeantes. */
    function volcan(c) {
      const { g, E, rnd, s, geo } = c;
      const tx = geo.cruce[0];
      const fase = hash(s, 3, 1) * 6;
      const lavaY = x => 112 + Math.sin(x / 22 + fase) * 6 + Math.sin(x / 9) * 1.5;
      const lava = new Uint8Array(EW * EH);
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const i = y * EW + x, e = E[i];
        const enRio = Math.abs(y - lavaY(x)) < 6;
        const charca = e > 14 && fbm(x, y, 22, s + 5) > 0.7;
        if (enRio || charca) lava[i] = 1;
      }
      const Lv = (x, y) => x >= 0 && y >= 0 && x < EW && y < EH && lava[y * EW + x];
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const i = y * EW + x, e = E[i] + (ruido(x, y, 4, s) - 0.5) * 2.4;
        if (lava[i]) {
          const cerca = !Lv(x, y - 2) || !Lv(x, y + 2) || !Lv(x - 2, y) || !Lv(x + 2, y);
          let v = 2.6 + (fbm(x + y * 0.3, y, 7, s + 6) - 0.5) * 2.6;
          if (cerca) v = 1.4;
          /* costra flotante */
          if (fbm(x, y, 5, s + 9) > 0.72) v = 0.6;
          g.set(x, y, LAVA[tono(lim(v, 0, 4), x, y)], LAVA);
        } else if (e < 0) {
          let v = 2.2 + (ruido(x, y, 3, s + 2) - 0.5) * 1.4;
          if (e > -1.2) v = 1.2;
          if (hash(x, y, s + 1) > 0.95) v = 3.8;
          g.set(x, y, CENIZA[tono(lim(v, 0, 4), x, y)], CENIZA);
        } else {
          let v = 1.8 + (fbm(x, y, 12, s + 3) - 0.5) * 2;
          /* resplandor junto a la lava */
          let cerca = 0;
          for (const [a, b] of [[0, -3], [0, 3], [-3, 0], [3, 0], [0, -6], [0, 6]]) if (Lv(x + a, y + b)) cerca++;
          if (e < 1.6) v -= 0.7;
          if (cerca) { g.set(x, y, (cerca > 2 ? LAVA[1] : BASALTO[4]), cerca > 2 ? LAVA : BASALTO); continue; }
          /* grietas incandescentes */
          const gr = Math.abs(ruido(x, y, 14, s + 8) - 0.5);
          if (gr < 0.011 && e > 3) { g.set(x, y, LAVA[2], LAVA); continue; }
          if (gr < 0.026 && e > 3) { g.set(x, y, BASALTO[0], BASALTO); continue; }
          g.set(x, y, BASALTO[tono(lim(v, 0, 4), x, y)], BASALTO);
        }
      }
      /* Puente de piedra sobre el río de lava. */
      const yL = lavaY(tx);
      for (let y = Math.floor(yL - 9); y <= yL + 9; y++) for (let x = tx - 9; x <= tx + 9; x++) {
        const borde = x <= tx - 8 || x >= tx + 8;
        const fila = Math.floor((y - yL + 20) / 4), jun = (y - Math.floor(yL)) % 4 === 0 || (x + fila * 3) % 6 === 0;
        const v = borde ? (x <= tx - 8 ? 3 : 1) : jun ? 1 : 3 - (hash(x >> 1, fila, s) > 0.6 ? 1 : 0);
        g.set(x, y, R.piedra[v], R.piedra);
      }
      sombra(g, tx, yL + 10, 9, 1.2);
      const objs = [], humos = [];
      sembrar(rnd, 7, 600, (x, y) => E[y * EW + x] > 4 && !Lv(x, y) && !Lv(x, y - 6) && !Lv(x, y + 3) && Math.abs(y - lavaY(x)) > 12, 22).forEach(([x, y]) => {
        objs.push({ x, y, s: SPR.rocaHumo(hash(x, y, 1)), som: 4 }); humos.push([x, y - 7]);
      });
      sembrar(rnd, 8, 600, (x, y) => E[y * EW + x] > 6 && !Lv(x, y) && !Lv(x, y + 3) && Math.abs(y - lavaY(x)) > 10, 16, humos).forEach(([x, y]) => objs.push({ x, y, s: SPR.obsidiana(hash(x, y, 2)), som: 3 }));
      sembrar(rnd, 8, 600, (x, y) => E[y * EW + x] > 2 && !Lv(x, y) && !Lv(x, y + 3), 12, humos).forEach(([x, y]) => objs.push({ x, y, s: SPR.roca(BASALTO.map((q, k) => k ? q : q), hash(x, y, 4)), som: 3 }));
      c.dibujar(objs);
      const burbujas = [];
      for (let k = 0; k < 400 && burbujas.length < 16; k++) {
        const x = Math.floor(hash(k, 1, s + 7) * EW), y = Math.floor(hash(k, 2, s + 7) * EH);
        if (Lv(x, y) && Lv(x - 2, y) && Lv(x + 2, y) && Lv(x, y - 2) && Lv(x, y + 2) && Math.abs(x - tx) > 11) burbujas.push([x, y]);
      }
      c.puntos = { lava: burbujas, humo: humos };
    },

    /* 4 · Abismo: islas flotantes unidas por el sendero sobre el vacío, cristales. */
    function abismo(c) {
      const { g, E, rnd, s, geo } = c;
      const isla = new Uint8Array(EW * EH);
      const islotes = [];
      for (let k = 0; k < 6; k++) islotes.push([hash(k, 1, s + 3) * EW, hash(k, 2, s + 3) * EH * 0.85, 5 + hash(k, 3, s + 3) * 7]);
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const i = y * EW + x;
        const borde = 7 + (fbm(x, y, 10, s + 1) - 0.5) * 10;
        let dentro = E[i] < borde;
        if (!dentro) for (const [a, b, r] of islotes) if (Math.hypot(x - a, (y - b) * 1.3) < r + (ruido(x, y, 4, s) - 0.5) * 3 && E[i] > 16) dentro = true;
        if (dentro) isla[i] = 1;
      }
      const I = (x, y) => x >= 0 && y >= 0 && x < EW && y < EH && isla[y * EW + x];
      for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
        const i = y * EW + x, e = E[i] + (ruido(x, y, 4, s) - 0.5) * 1.6;
        if (isla[i]) {
          const bordeArriba = !I(x, y - 1) || !I(x - 1, y) || !I(x + 1, y);
          if (e < 0) {
            /* Losas de luz con runas. */
            const fila = Math.floor(y / 6), ox = (fila % 2) * 3, jun = (x + ox) % 6 === 0 || y % 6 === 0;
            let v = jun ? 1.4 : 2.6 + (hash(Math.floor((x + ox) / 6), fila, s) - 0.5) * 1.2;
            if (e > -1.2) v = 1;
            if (!jun && hash(Math.floor((x + ox) / 6), fila, s + 2) > 0.86 && (x + ox) % 6 === 3 && y % 6 === 3) v = 4;
            g.set(x, y, LUZ[tono(lim(v, 0, 4), x, y)], LUZ);
          } else {
            let v = 2.2 + (fbm(x, y, 8, s + 4) - 0.5) * 2;
            if (bordeArriba) v = 3.8;
            if (hash(x, y, s + 5) > 0.95) v = 4;
            g.set(x, y, MUSGO_AB[tono(lim(v, 0, 4), x, y)], MUSGO_AB);
          }
        } else {
          /* ¿Acantilado colgando debajo de una isla? */
          let k = 0;
          const prof = 9 + Math.floor(hash(x >> 2, 0, s + 6) * 7);
          for (let d = 1; d <= prof; d++) if (I(x, y - d)) { k = d; break; }
          if (k) {
            const estr = (y + Math.floor(hash(x >> 3, 1, s) * 3)) % 4 === 0;
            let v = 3 - k * 0.32 + (estr ? -0.8 : 0) + (hash(x, y, s + 7) - 0.5) * 0.6;
            /* se afila hacia abajo */
            const ancho = !I(x - 2, y - k) || !I(x + 2, y - k);
            if (ancho && k > prof * 0.5) { k = 0; }
            if (k) { g.set(x, y, ROCA_AB[tono(lim(v, 0, 4), x, y)], ROCA_AB); continue; }
          }
          /* Vacío: nebulosa tenue y estrellas. */
          let v = 0.8 + (fbm(x, y, 40, s + 8) - 0.4) * 2.4 + (1 - y / EH) * 0.3;
          const st = hash(x, y, s + 9);
          if (st > 0.996) { g.set(x, y, BLANCO, VACIO); continue; }
          if (st > 0.99) { g.set(x, y, VACIO[4], VACIO); continue; }
          g.set(x, y, VACIO[tono(lim(v, 0, 3), x, y)], VACIO);
        }
      }
      const objs = [];
      const cristales = [];
      sembrar(rnd, 12, 900, (x, y) => I(x, y) && I(x - 6, y) && I(x + 6, y) && I(x, y + 2) && I(x, y - 12) && E[y * EW + x] > 3, 14).forEach(([x, y]) => {
        const v = hash(x, y, s + 2);
        objs.push({ x, y, s: SPR.cristal(v > 0.5 ? CRISTAL : CRISTAL_V, v), som: 0 }); cristales.push([x, y - 8]);
      });
      sembrar(rnd, 6, 600, (x, y) => I(x, y) && I(x - 5, y) && I(x + 5, y) && I(x, y + 2) && E[y * EW + x] > 2, 14, cristales).forEach(([x, y]) => objs.push({ x, y, s: SPR.roca(ROCA_AB, hash(x, y, 5)), som: 2 }));
      c.dibujar(objs);
      c.puntos = { cristales };
    }
  ];

  function escena(acto = 0, n = 2, semilla = 1) {
    acto = lim(acto | 0, 0, 4);
    n = lim(n | 0, 1, 4);
    const s = (semilla | 0) * 7919 + acto * 131 + n * 17 + 1;
    const rnd = azar((Math.imul(s, 2654435761) >>> 0) || 1);
    const geo = geometria(n, rnd);
    const E = campo(geo);
    const g = new Rejilla(EW, EH);
    const c = {
      g, E, rnd, s, geo, puntos: {},
      dibujar(objs) {
        objs.sort((a, b) => a.y - b.y);
        for (const o of objs) if (o.som) sombra(g, o.x + 2, o.y - 1, o.som, Math.max(1.5, o.som * 0.45));
        for (const o of objs) pegar(g, o.s, o.x, o.y);
      }
    };
    TEMAS[acto](c);
    /* Rellena cualquier hueco (no debería haber ninguno). */
    for (let i = 0; i < g.c.length; i++) if (!g.c[i]) g.c[i] = CONTORNO_ESC;
    const res = { g, entrada: geo.entrada.slice(), cruce: geo.cruce.slice(), salidas: geo.salidas.map(p => p.slice()), ramas: geo.ramas, camino: [geo.entrada.slice(), geo.cruce.slice()], puntos: c.puntos, acto };
    ULTIMA[acto] = res;
    return res;
  }
  const CONTORNO_ESC = "#140b07";

  /* ================= 3) Animación ligera sobre la escena ================= */
  function anim(ctx, t, acto, esc) {
    acto = lim(acto | 0, 0, 4);
    const e = esc || ULTIMA[acto];
    const P = (e && e.puntos) || {};
    const T = t / 1000;
    const r = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w, h); };
    if (acto === 0) {
      /* Destellos en el agua. */
      (P.agua || []).forEach(([x, y], k) => {
        const f = (T * 1.3 + k * 0.37) % 1.6;
        if (f < 0.5) r(x + Math.floor(f * 6), y, f < 0.25 ? 2 : 1, 1, f < 0.25 ? "#ffffff" : "#b0e6ff");
      });
      /* Flores que se mecen: el pétalo superior cambia de lado. */
      (P.flores || []).forEach(([x, y, col], k) => {
        const m = Math.sin(T * 2.2 + k) > 0.3 ? 1 : 0;
        if (m) { r(x, y - 1, 1, 1, "#55a62e"); r(x + 1, y - 1, 1, 1, col); }
      });
      /* Mariposas. */
      for (let k = 0; k < 3; k++) {
        const bx = 40 + k * 80 + Math.sin(T * 0.4 + k * 2) * 30, by = 30 + k * 18 + Math.sin(T * 0.9 + k) * 10;
        const ala = Math.floor(T * 8 + k) % 2;
        const col = ["#ffd23a", "#f4f0ff", "#ff9ad0"][k];
        r(bx, by, 1, 1, "#2a1a10");
        r(bx - 1 - ala, by - 1 + ala, 1 + ala, 1, col); r(bx + 1, by - 1 + ala, 1 + ala, 1, col);
      }
      /* Pájaros que cruzan el cielo de vez en cuando (con su sombra en el suelo). */
      for (let k = 0; k < 2; k++) {
        const ciclo = 14 + k * 5, f = ((T + k * 7) % ciclo) / ciclo;
        if (f > 0.6) continue;
        const x = -10 + f / 0.6 * 280, y = 20 + k * 30 + Math.sin(f * 9) * 4;
        const ala = Math.floor(T * 6 + k) % 2;
        r(x + 6, y + 22, 3, 1, "rgba(0,0,0,0.25)");
        r(x, y + ala, 2, 1, "#2a2028"); r(x + 2, y + 1, 1, 1, "#2a2028"); r(x + 3, y + ala, 2, 1, "#2a2028");
      }
      /* Hojas que caen. */
      for (let k = 0; k < 4; k++) {
        const f = ((T * 0.12 + k * 0.29) % 1);
        r(20 + k * 61 + Math.sin(T * 1.5 + k) * 6, f * 150 - 4, 2, 1, k % 2 ? "#8fd04a" : "#dcb17c");
      }
    } else if (acto === 1) {
      (P.antorchas || []).forEach(([x, y], k) => {
        const f = Math.floor(T * 9 + k * 3);
        const a = hash(f, k, 1), b = hash(f, k, 2);
        ctx.fillStyle = `rgba(255,150,60,${0.07 + a * 0.06})`; ctx.fillRect(x - 6, y - 4, 13, 12);
        r(x - 1 + (a > 0.5 ? 1 : 0), y - 3 - (b > 0.6 ? 1 : 0), 2, 2, "#ffa53a");
        r(x + (a > 0.5 ? 0 : -1) + 1, y - 2, 1, 1, "#ffe08a");
        if (b > 0.7) r(x + (a > 0.3 ? 1 : -1), y - 6 - Math.floor(b * 3), 1, 1, "#ffcf6a");
      });
      /* Gotas que caen en los charcos (ondas). */
      for (let k = 0; k < 3; k++) {
        const f = ((T * 0.5 + k * 0.33) % 1);
        const x = 30 + Math.floor(hash(Math.floor(T * 0.5 + k * 0.33), k, 3) * 200), y = 20 + Math.floor(hash(Math.floor(T * 0.5 + k * 0.33), k, 4) * 110);
        if (f < 0.3) { const w = 1 + Math.floor(f * 12); ctx.fillStyle = "rgba(180,220,255,0.35)"; ctx.fillRect(x - w, y, w * 2 + 1, 1); }
      }
      /* Polvo en el aire. */
      for (let k = 0; k < 8; k++) r((k * 37 + T * 3) % 256, (k * 53 + Math.sin(T * 0.5 + k) * 8 + 144) % 144, 1, 1, "rgba(200,190,220,0.35)");
    } else if (acto === 2) {
      (P.braseros || []).forEach(([x, y], k) => {
        const f = Math.floor(T * 8 + k * 5), a = hash(f, k, 1), b = hash(f, k, 2);
        ctx.fillStyle = `rgba(255,170,70,${0.08 + a * 0.06})`; ctx.fillRect(x - 7, y - 3, 15, 12);
        r(x - 2 + (a > 0.5 ? 1 : 0), y - 1, 3, 2, "#ffa53a");
        r(x - 1 + (b > 0.5 ? 1 : 0), y - 3, 1, 2, "#ffe08a");
        const ch = (T * 1.2 + k * 0.3) % 1;
        r(x + Math.sin(T * 3 + k) * 2, y - 4 - ch * 12, 1, 1, ch < 0.7 ? "#ffcf6a" : "#a8360e");
      });
      /* Rayos de sol con motas de polvo y pétalos. */
      for (let k = 0; k < 10; k++) {
        const x = (k * 29 + T * 4 + Math.sin(T * 0.7 + k) * 6) % 256, y = (k * 41 + T * 2.5) % 144;
        r(x, y, 1, 1, k % 3 ? "rgba(255,240,200,0.5)" : "rgba(240,120,140,0.7)");
      }
      /* Estandarte de luz: banda suave que cruza. */
      ctx.fillStyle = "rgba(255,240,200,0.05)";
      ctx.fillRect(((T * 8) % 400) - 80, 0, 26, 144);
    } else if (acto === 3) {
      (P.lava || []).forEach(([x, y], k) => {
        const f = (T * 0.8 + k * 0.23) % 1.4;
        if (f < 0.6) r(x, y, 1, 1, "#ffa424");
        else if (f < 1.0) { r(x - 1, y - 1, 3, 2, "#ffa424"); r(x, y - 1, 1, 1, "#fff07a"); }
        else if (f < 1.15) { r(x - 2, y - 1, 1, 1, "#fff07a"); r(x + 2, y - 1, 1, 1, "#fff07a"); r(x, y - 3, 1, 1, "#ffa424"); }
      });
      (P.humo || []).forEach(([x, y], k) => {
        for (let m = 0; m < 3; m++) {
          const f = (T * 0.35 + k * 0.17 + m / 3) % 1;
          const tam = 2 + Math.floor(f * 4);
          ctx.fillStyle = `rgba(110,100,105,${0.45 * (1 - f)})`;
          ctx.fillRect(Math.round(x + Math.sin(f * 5 + k) * 3 - tam / 2), Math.round(y - f * 22), tam, tam);
        }
      });
      for (let k = 0; k < 10; k++) {
        const f = (T * 0.25 + k * 0.1) % 1;
        r((k * 47 + Math.sin(T + k) * 8) % 256, 144 - f * 160, 1, 1, f < 0.6 ? "#ffa424" : "#a82206");
      }
    } else {
      /* Motas del vacío que suben y cristales que destellan. */
      for (let k = 0; k < 22; k++) {
        const f = (T * 0.06 + hash(k, 1, 5)) % 1;
        const x = (hash(k, 2, 5) * 256 + Math.sin(T * 0.8 + k) * 4) % 256, y = 150 - f * 160;
        r(x, y, 1, 1, k % 3 === 0 ? "#e2d8ff" : k % 3 === 1 ? "#a294d8" : "#6cd2aa");
      }
      (P.cristales || []).forEach(([x, y], k) => {
        const f = (T * 0.6 + k * 0.41) % 2.2;
        if (f < 0.3) { r(x - 1, y, 3, 1, "#ffffff"); r(x, y - 1, 1, 3, "#ffffff"); }
        else if (f < 0.45) r(x, y, 1, 1, "#e8faff");
      });
      /* Estrellas que titilan. */
      for (let k = 0; k < 10; k++) {
        const x = Math.floor(hash(k, 7, 9) * 256), y = Math.floor(hash(k, 8, 9) * 144);
        if (Math.sin(T * 2 + k * 1.7) > 0.7) r(x, y, 1, 1, "#ffffff");
      }
    }
  }

  /* ================= 4) Carteles 16×16 ================= */
  const CARTELES = {
    huellas(g) {
      for (const [ox, oy, f] of [[3, 8, 0], [9, 2, 1]]) {
        new Capa(16, 16).ell(ox + 1.5, oy + 2, 1.8, 2.6).pintar(g, TIERRA, { relieve: 1, max: 2 });
        new Capa(16, 16).ell(ox + 1.5, oy + 5.5, 1.4, 1.2).pintar(g, TIERRA, { relieve: 1, max: 2 });
        for (let k = 0; k < 3; k++) g.set(ox + k + 0.5, oy - 1, TIERRA[3], TIERRA);
      }
    },
    combate(g) {
      for (const sgn of [1, -1]) {
        const a = sgn > 0 ? [2, 2] : [13, 2], b = sgn > 0 ? [12, 12] : [3, 12];
        new Capa(16, 16).linea(a[0], a[1], b[0] - sgn * 2, b[1] - 2, 2).pintar(g, R.plata, { relieve: 1, min: 2 });
        new Capa(16, 16).linea(b[0] - sgn * 3, b[1] - 1, b[0] - sgn * 1, b[1] - 3, 1).linea(b[0] - sgn * 4, b[1] - 2, b[0] - sgn * 2, b[1] - 4, 1).pintar(g, R.bronce, { plano: 3 });
        new Capa(16, 16).linea(b[0] - sgn * 1, b[1] - 1, b[0], b[1], 2).pintar(g, R.madera, { plano: 2 });
      }
    },
    elite(g) {
      /* Yelmo con cuernos. */
      new Capa(16, 16).curva(4, 8, 1, 6, 1.5, 1, 2.6, 1).curva(11, 8, 14, 6, 13.5, 1, 2.6, 1).pintar(g, R.hueso, { relieve: 1, min: 2 });
      new Capa(16, 16).ell(7.5, 9, 5, 4.5).rect(3, 9, 10, 5).pintar(g, R.hierro, { relieve: 3 });
      new Capa(16, 16).rect(4, 10, 3, 2).rect(9, 10, 3, 2).pintar(g, R.sombra, { plano: 0 });
      g.set(5, 10, "#ff4a3a").set(10, 10, "#ff4a3a");
      new Capa(16, 16).rect(7, 9, 2, 5).pintar(g, R.hierro, { plano: 3 });
      for (let x = 3; x < 13; x++) g.set(x, 8, R.bronce[x % 2 ? 3 : 4], R.bronce);
    },
    tesoro(g) {
      new Capa(16, 16).rect(2, 7, 12, 7).pintar(g, R.madera, { relieve: 2 });
      new Capa(16, 16).ell(8, 6, 6, 3).rect(2, 6, 12, 2).pintar(g, R.madera, { relieve: 3, separar: true });
      for (const x of [3, 12]) for (let y = 4; y < 14; y++) g.set(x, y, R.bronce[3], R.bronce);
      for (let x = 2; x < 14; x++) g.set(x, 8, R.bronce[x % 2 ? 2 : 3], R.bronce);
      new Capa(16, 16).rect(7, 8, 2, 3).pintar(g, R.bronce, { relieve: 1, min: 3 });
      g.set(7, 9, OJOS);
      g.set(5, 3, R.bronce[4], R.bronce).set(10, 2, "#ffffff");
    },
    tienda(g) {
      /* Bolsa de monedas. */
      new Capa(16, 16).ell(8, 10, 5.4, 4.6).poly([[5.5, 6], [10.5, 6], [9, 3], [7, 3]]).pintar(g, TIERRA, { relieve: 3 });
      for (let x = 5; x < 11; x++) g.set(x, 6, R.tela.granate[3], R.tela.granate);
      new Capa(16, 16).ell(5.5, 2.5, 1.6, 1.2).ell(10.5, 2.5, 1.6, 1.2).pintar(g, TIERRA, { relieve: 1 });
      new Capa(16, 16).ell(10.5, 11.5, 2.8, 2.6).pintar(g, R.bronce, { relieve: 2, min: 2, separar: true });
      g.set(10, 11, R.bronce[1], R.bronce).set(10, 12, R.bronce[1], R.bronce).set(9, 10, R.bronce[4], R.bronce);
    },
    hoguera(g) {
      new Capa(16, 16).linea(2, 13, 13, 11, 2).linea(2, 11, 13, 13, 2).pintar(g, R.madera, { relieve: 1 });
      new Capa(16, 16).ell(7.5, 8, 4, 4.4).poly([[4, 8], [7.5, 0.5], [11, 8]]).pintar(g, R.fuego, { relieve: 3, min: 1 });
      new Capa(16, 16).ell(7.5, 9, 2, 2.4).poly([[6, 9], [8, 4], [9.5, 9]]).pintar(g, R.fuego, { plano: 4 });
    },
    santuario(g) {
      /* Fuente sagrada de piedra con llama azul. */
      new Capa(16, 16).rect(3, 9, 10, 5).rect(2, 13, 12, 2).pintar(g, R.marmol, { relieve: 2 });
      new Capa(16, 16).rect(4, 9, 8, 1).pintar(g, R.mar, { plano: 3 });
      new Capa(16, 16).ell(8, 5, 3, 3.6).poly([[5.5, 5], [8, 0], [10.5, 5]]).pintar(g, CRISTAL, { relieve: 2, min: 2 });
      g.set(8, 5, "#ffffff").set(7, 4, CRISTAL[4], CRISTAL);
      for (const [x, y] of [[2, 4], [13, 3], [12, 7]]) g.set(x, y, "#fff3b0");
    },
    forja(g) {
      new Capa(16, 16).poly([[1, 6], [14, 6], [12, 9], [10, 9], [11, 13], [4, 13], [5, 9], [3, 9]]).pintar(g, R.hierro, { relieve: 2 });
      new Capa(16, 16).rect(1, 6, 13, 1).pintar(g, R.hierro, { plano: 4 });
      new Capa(16, 16).linea(9, 5, 13, 1, 1.6).pintar(g, R.madera, { plano: 3 });
      new Capa(16, 16).rect(5, 1, 5, 3).pintar(g, R.hierro, { relieve: 1, min: 2 });
      for (const [x, y] of [[3, 3], [12, 4], [4, 1]]) g.set(x, y, "#ffcf6a");
    },
    ruinas(g) {
      new Capa(16, 16).rect(2, 3, 4, 11).off(5, 3).off(4, 3).pintar(g, R.marmol, { relieve: 2 });
      new Capa(16, 16).rect(9, 7, 4, 7).off(12, 7).pintar(g, R.marmol, { relieve: 2 });
      new Capa(16, 16).rect(1, 13, 14, 2).pintar(g, R.piedra, { relieve: 1, min: 2 });
      new Capa(16, 16).rect(6, 11, 3, 2).pintar(g, R.marmol, { relieve: 1 });
      for (const y of [5, 8, 11]) g.set(3, y, R.marmol[1], R.marmol);
      g.set(10, 9, R.hoja[3], R.hoja).set(11, 10, R.hoja[2], R.hoja).set(2, 12, R.hoja[3], R.hoja);
    },
    altar(g) {
      new Capa(16, 16).rect(2, 9, 12, 5).pintar(g, R.piedra, { relieve: 2 });
      new Capa(16, 16).rect(1, 8, 14, 2).pintar(g, R.piedra, { relieve: 1, min: 3 });
      new Capa(16, 16).rect(6, 9, 4, 4).pintar(g, R.sangre, { relieve: 1 });
      for (const x of [3, 12]) {
        new Capa(16, 16).rect(x, 4, 1, 4).pintar(g, R.hueso, { plano: 4 });
        g.set(x, 3, "#ffa53a").set(x, 2, "#ffe08a");
      }
      g.set(7, 10, R.magia[4], R.magia).set(8, 11, R.magia[3], R.magia);
    },
    misterio(g) {
      const c = new Capa(16, 16).curva(4, 5, 5, 0.5, 9, 1.5, 3, 3).curva(9, 1.5, 13, 3, 10, 7, 3, 3).curva(10, 7, 8, 8, 8, 10, 3, 3).rect(7, 12, 3, 3);
      c.pintar(g, CRISTAL_V, { relieve: 2, min: 2 });
      g.set(6, 2, CRISTAL_V[4], CRISTAL_V);
    },
    jefe(g) {
      /* Calavera grande con ojos encendidos. */
      const c = new Capa(16, 16).ell(7.5, 6.5, 7, 6).rect(3, 9, 10, 6);
      c.quitarRect(0, 15, 16, 1).off(3, 14).off(12, 14);
      c.pintar(g, R.hueso, { relieve: 4 });
      new Capa(16, 16).ell(4.5, 7.5, 2, 2).ell(10.5, 7.5, 2, 2).pintar(g, R.sombra, { plano: 0 });
      g.set(4, 7, "#ff3a2a").set(10, 7, "#ff3a2a").set(5, 8, "#ffa53a").set(11, 8, "#ffa53a");
      g.set(7, 10, OJOS).set(8, 10, OJOS).set(7, 11, R.hueso[1], R.hueso);
      for (const x of [4, 6, 8, 10]) g.set(x, 13, OJOS).set(x + 1, 14, R.hueso[1], R.hueso);
      for (let x = 3; x < 13; x++) g.set(x, 12, R.hueso[1], R.hueso);
      g.set(2, 3, R.hueso[1], R.hueso).set(3, 2, R.hueso[1], R.hueso);
    }
  };
  function cartel(tipo) {
    const g = new Rejilla(16, 16);
    (CARTELES[tipo] || CARTELES.misterio)(g);
    g.contorno();
    return g;
  }

  window.CENITAL = { heroe, escena, anim, cartel, TIPOS: Object.keys(CARTELES) };
})();
