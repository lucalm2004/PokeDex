/* Dados y Mazmorras · héroes en alta definición (48×48).
   HEROES_HD.componer(aspecto) devuelve una Rejilla NUEVA de 48×48 mirando a la derecha, con los pies en la fila 46.
   Acepta el mismo aspecto que HEROES.componer:
   { raza, clase, piel, pelo, tela, peinado, barba, gesto, cuerpo, objeto, extras, espejo, sinContorno }
   y reutiliza sus tablas (RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS), así que todo aspecto guardado sigue valiendo.
   Misma luz que el arte antiguo (arriba a la izquierda), contorno oscuro y rampas de 5 tonos. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral } = PX;
  const W = 48, H = 48;

  /* ---------- Tablas compartidas con el arte antiguo ---------- */
  const H0 = typeof HEROES !== "undefined" ? HEROES : {};
  const RAZAS = H0.RAZAS || {
    humano: { cuerpo: "normal", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["castano", "negro", "cobrizo", "rubio", "canoso"] }
  };
  const TELA_CLASE = H0.TELA_CLASE || { guerrero: "granate", barbaro: "terracota", picaro: "negro", explorador: "oliva", mago: "azul", brujo: "violeta", clerigo: "blanco", bardo: "ocre" };
  const PEINADOS = H0.PEINADOS || ["corto", "largo", "recogido", "rizado", "rapado"];
  const TELAS = H0.TELAS || Object.keys(R.tela);
  const GESTOS = H0.GESTOS || ["normal", "dolor", "alegre", "furia"];

  /* ---------- Colores propios ---------- */
  const OJOS = "#1b1210";
  const BLANCO = "#f4ead8";
  const IRIS = "#4a3426";
  const CUERO = ["#26130a", "#462612", "#6e3f1f", "#9a6034", "#c4864e"];
  const ACERO = ["#1d1f24", "#3a3e46", "#646a75", "#9aa1ab", "#e4e8ee"];
  const PELLIZA = R.pelo.castano;
  const SUDOR = R.mar;
  const BARBAS = Object.values(R.pelo);
  const MEJILLA = R.piel.roja;

  /* ---------- Utilidades ---------- */
  const capa = () => new Capa(W, H);
  const pon = (g, ram, k, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[Math.max(0, Math.min(4, k))], ram); return g; };
  const tono = (g, x, y) => { const r = g.rampa(x, y); return r ? r.indexOf(g.get(x, y)) : -1; };
  /* Sube o baja el tono de un píxel dentro de su propia rampa. */
  function matiz(g, x, y, d) {
    const r = g.rampa(x, y), i = tono(g, x, y);
    if (!r || i < 0) return;
    g.set(x, y, r[Math.max(0, Math.min(r.length - 1, i + d))], r);
  }
  /* Recorre los píxeles de una rampa dentro de un rectángulo. */
  function cada(g, ram, x0, y0, x1, y1, fn) {
    for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++)
        if (g.rampa(x, y) === ram) fn(x, y, tono(g, x, y));
  }
  /* Línea de un píxel en un tono de la rampa, solo sobre lo que ya es de esa rampa (pliegues, costuras). */
  function surco(g, ram, k, x0, y0, x1, y1, soloSobre = ram) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), y = Math.round(y0 + ((y1 - y0) * s) / n);
      if (!soloSobre || g.rampa(x, y) === soloSobre) g.set(x, y, ram[k], ram);
    }
  }
  /* Pliegue de tela: surco oscuro con su brillo a la izquierda. */
  function pliegue(g, ram, x0, y0, x1, y1) {
    surco(g, ram, 3, x0 - 1, y0 + 1, x1 - 1, y1, ram);
    surco(g, ram, 1, x0, y0, x1, y1, ram);
  }
  /* Cota de malla: anillas de 2×2 con su brillo y su hueco. */
  function malla(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      if (k < 1 || k > 3) return;
      const a = (x + (y >> 1) * 1) & 1, b = y & 1;
      if (!a && !b) g.set(x, y, ram[Math.min(4, k + 1)], ram);
      else if (a && b) g.set(x, y, ram[k - 1], ram);
    });
  }

  /* ---------- Plantilla del cuerpo ---------- */
  function plantilla(cuerpo) {
    const bajo = cuerpo === "bajo" || cuerpo === "ancho";
    const grande = cuerpo === "fornido" || cuerpo === "ancho";
    const ancho = { normal: 12, esbelto: 10, fornido: 15, bajo: 11, ancho: 15 }[cuerpo] || 12;
    const t = { cuerpo, bajo, grande, W, H, cx: 23, suelo: 46 };
    t.cabX = 23; t.cabY = bajo ? 22 : 14;
    t.cabRx = grande ? 7.2 : cuerpo === "esbelto" ? 6.5 : 6.8;
    t.cabRy = bajo ? 6.6 : 7;
    t.ojoY = t.cabY + 1; t.bocaY = t.ojoY + 4;
    t.ojo1 = t.cabX + 1; t.ojo2 = t.cabX + (grande ? 5 : 4);
    t.narizX = Math.round(t.cabX + t.cabRx + 0.7);
    t.torTop = bajo ? 29 : 22; t.torBot = bajo ? 38 : 34; t.pierTop = t.torBot + 1;
    t.torL = t.cx - Math.floor((ancho - 1) / 2); t.torR = t.torL + ancho - 1;
    t.grosor = grande ? 4 : 3;
    t.pierna = grande ? 5 : cuerpo === "esbelto" ? 3 : 4;
    t.hombro = [t.torR - 1, t.torTop + 2];
    t.codo = [t.torR + 2, t.torTop + (bajo ? 5 : 6)];
    t.mano = [t.torR + 5, t.torTop + (bajo ? 7 : 9)];
    t.hombroAtras = [t.torL + 1, t.torTop + 2];
    t.manoAtras = [t.torL - 1, t.torBot - 1];
    /* Columnas de las piernas: la de atrás a la izquierda, la de delante a la derecha. */
    t.pieAtras = t.cx - 3 - (grande ? 1 : 0);
    t.pieDelante = t.cx + 3 + (grande ? 1 : 0);
    return t;
  }

  /* ---------- Cabeza y cara ---------- */
  function cabeza(g, t, piel) {
    capa().rect(t.cabX - 2, t.cabY + 4, 5, t.torTop - t.cabY - 3).pintar(g, piel, { relieve: 1.5, max: 2 });
    const c = capa().ell(t.cabX, t.cabY, t.cabRx, t.cabRy);
    /* Mandíbula y barbilla hacia delante. */
    c.poly([[t.cabX - 1, t.cabY + 2], [t.cabX + t.cabRx + 0.6, t.ojoY + 1], [t.cabX + t.cabRx + 0.4, t.bocaY + 0.5], [t.cabX + 5, t.cabY + t.cabRy + 0.6], [t.cabX - 1, t.cabY + t.cabRy + 0.2]]);
    c.on(t.narizX, t.ojoY + 1).on(t.narizX, t.ojoY + 2).on(t.narizX - 1, t.ojoY + 3);
    c.pintar(g, piel, { relieve: 5 });
    /* Sombra bajo la barbilla y bajo la nariz. */
    pon(g, piel, 1, [t.narizX - 1, t.ojoY + 3]);
    pon(g, piel, 3, [t.narizX, t.ojoY + 1]);
    for (let x = t.cabX - 2; x <= t.cabX + 2; x++) if (g.rampa(x, t.cabY + 5) === piel) matiz(g, x, Math.round(t.cabY + t.cabRy) - 1, -1);
  }
  function oreja(g, t, piel, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "elfo") {
      const c = capa().poly([[x - 2, y + 3.5], [x - 2, y - 0.5], [x - 9, y - 5], [x - 6, y + 1]]);
      c.pintar(g, piel, { relieve: 1.5, separar: 2 });
      surco(g, piel, 1, x - 3, y + 1, x - 6, y - 2, piel);
      return;
    }
    if (raza === "gnomo") {
      capa().poly([[x - 2, y + 3.5], [x - 2, y - 0.5], [x - 7, y - 2], [x - 5, y + 2.5]]).pintar(g, piel, { relieve: 1.5, separar: 2 });
      pon(g, piel, 1, [x - 3, y + 1], [x - 4, y + 1]);
      return;
    }
    if (raza === "semiorco") {
      capa().poly([[x - 2, y + 3.5], [x - 2, y - 0.5], [x - 6, y - 1.5], [x - 4.5, y + 3]]).pintar(g, piel, { relieve: 1.5, separar: 2 });
      pon(g, piel, 1, [x - 3, y + 1]);
      return;
    }
    capa().ell(x - 3, y + 1.5, 1.6, 2.2).pintar(g, piel, { relieve: 1.5, separar: 2 });
    pon(g, piel, 1, [x - 3, y + 1], [x - 3, y + 2]);
    pon(g, piel, 3, [x - 4, y]);
  }

  /* Rasgos de la cara. Todo se pinta solo sobre la piel (y la boca también sobre la barba),
     así que lo que se pinte después (yelmos, capuchas, máscaras) los respeta. */
  function cara(g, t, o) {
    const { piel, raza, gesto } = o;
    const y = t.ojoY, a = t.ojo1, b = t.ojo2, by = t.bocaY, x = t.cabX;
    const libre = (i, j) => g.rampa(i, j) === piel || (j >= by - 1 && BARBAS.includes(g.rampa(i, j)));
    const m = (col, ram, ...pts) => { for (const [i, j] of pts) if (libre(i, j)) g.set(i, j, col, ram); };
    const mk = (ram, k, ...pts) => m(ram[k], ram, ...pts);
    const sombra = o.sombra;
    const cejaR = o.cejas || piel;
    const ceja = sombra ? piel[0] : cejaR === piel ? piel[1] : cejaR[1];
    const blanco = sombra ? piel[3] : BLANCO;
    const tief = raza === "tiefling", orco = raza === "semiorco";
    const ojoNormal = (e) => {
      m(OJOS, null, [e, y - 1], [e + 1, y - 1]);
      if (tief) { mk(R.bronce, 4, [e, y], [e + 1, y]); mk(R.fuego, 2, [e, y + 1], [e + 1, y + 1]); return; }
      m(blanco, null, [e, y], [e, y + 1]);
      m(OJOS, null, [e + 1, y]);
      m(sombra ? OJOS : IRIS, null, [e + 1, y + 1]);
    };
    const nariz = () => { mk(piel, 1, [t.narizX - 1, y + 3]); };
    if (gesto === "dolor") {
      /* Ojos apretados (> <), cejas de angustia, boca abierta en mueca y una gota de sudor. */
      m(OJOS, null, [a, y - 1], [a + 1, y], [a, y + 1], [b + 1, y - 1], [b, y], [b + 1, y + 1]);
      mk(piel, 2, [a, y], [b + 1, y]);
      m(ceja, cejaR, [a - 1, y - 2], [a, y - 3], [a + 1, y - 3], [b, y - 3], [b + 1, y - 3], [b + 2, y - 2]);
      if (orco) m(piel[0], piel, [a, y - 2], [a + 1, y - 2], [b, y - 2], [b + 1, y - 2]);
      m(OJOS, null, [x + 3, by - 1], [x + 4, by - 1], [x + 5, by - 1], [x + 6, by - 1], [x + 3, by], [x + 6, by], [x + 4, by + 1], [x + 5, by + 1]);
      mk(R.hueso, 4, [x + 4, by - 1], [x + 5, by - 1]);
      mk(R.sangre, 3, [x + 4, by], [x + 5, by]);
      mk(SUDOR, 4, [x - 1, y - 3]); mk(SUDOR, 3, [x - 1, y - 2]); mk(SUDOR, 2, [x - 2, y - 1], [x - 1, y - 1]);
    } else if (gesto === "alegre") {
      /* Ojos en arco (^ ^), mejillas sonrosadas y sonrisa abierta. */
      const arco = tief ? R.bronce[4] : OJOS;
      m(arco, null, [a - 1, y + 1], [a, y], [a + 1, y], [a + 2, y + 1], [b, y], [b + 1, y], [b + 2, y + 1]);
      if (orco) m(piel[0], piel, [a - 1, y - 2], [a, y - 2], [a + 1, y - 2], [b, y - 2], [b + 1, y - 2]);
      else m(ceja, cejaR, [a - 1, y - 3], [a, y - 4], [a + 1, y - 4], [b, y - 4], [b + 1, y - 3]);
      if (!sombra) mk(MEJILLA, 4, [a, y + 2], [a + 1, y + 2]);
      m(OJOS, null, [x + 3, by - 1], [x + 4, by - 1], [x + 5, by - 1], [x + 6, by - 1], [x + 7, by - 1], [x + 4, by + 1], [x + 5, by + 1]);
      m(OJOS, null, [x + 3, by], [x + 6, by]);
      const lengua = piel === R.piel.roja ? R.fuego : R.sangre;
      mk(R.hueso, 4, [x + 4, by - 1], [x + 5, by - 1], [x + 6, by - 1]);
      mk(lengua, 3, [x + 4, by], [x + 5, by]);
    } else if (gesto === "furia") {
      /* Cejas en V sobre ojos entornados y los dientes apretados. */
      const fr = sombra ? piel[0] : orco ? OJOS : cejaR === piel ? piel[0] : cejaR[0];
      m(fr, cejaR, [a - 1, y - 3], [a, y - 2], [a + 1, y - 2], [a + 2, y - 1], [b - 1, y - 1], [b, y - 2], [b + 1, y - 2], [b + 2, y - 3]);
      m(OJOS, null, [a, y], [a + 1, y], [b, y], [b + 1, y]);
      if (tief) mk(R.bronce, 4, [a, y + 1], [a + 1, y + 1], [b, y + 1], [b + 1, y + 1]);
      else { m(blanco, null, [a, y + 1], [b, y + 1]); m(OJOS, null, [a + 1, y + 1], [b + 1, y + 1]); }
      m(OJOS, null, [x + 3, by - 1], [x + 4, by - 1], [x + 5, by - 1], [x + 6, by - 1], [x + 3, by], [x + 7, by], [x + 4, by + 1], [x + 5, by + 1], [x + 6, by + 1]);
      mk(R.hueso, 4, [x + 4, by], [x + 6, by]);
      mk(R.hueso, 3, [x + 5, by]);
    } else {
      ojoNormal(a); ojoNormal(b);
      if (orco) m(piel[0], piel, [a - 1, y - 2], [a, y - 2], [a + 1, y - 2], [a + 2, y - 2], [b, y - 2], [b + 1, y - 2], [b + 2, y - 2]);
      else m(ceja, cejaR, [a - 1, y - 3], [a, y - 3], [a + 1, y - 3], [b, y - 3], [b + 1, y - 3]);
      mk(piel, 1, [x + 4, by], [x + 5, by]);
      mk(piel, 3, [x + 4, by + 1]);
      if (!sombra && !tief && !orco) mk(MEJILLA, 4, [a, y + 2]);
    }
    nariz();
    if (orco) {
      /* Colmillos que suben desde la mandíbula. */
      mk(R.hueso, 4, [x + 3, by - 1], [x + 6, by - 1]);
      mk(R.hueso, 3, [x + 3, by], [x + 6, by]);
      mk(piel, 1, [x + 4, by + 1], [x + 5, by + 1]);
    }
    if (raza === "gnomo") {
      /* Nariz grande y redonda. */
      const n = capa().ell(t.narizX - 0.5, y + 2, 1.6, 1.5);
      n.pintar(g, piel, { relieve: 1.5, min: 2 });
      pon(g, piel, 4, [t.narizX - 1, y + 1]);
      pon(g, piel, 1, [t.narizX - 2, y + 3]);
    }
  }

  /* ---------- Dracónido: cabeza de reptil ---------- */
  function cabezaDraconido(g, t, piel, gesto) {
    const x = t.cabX, y = t.cabY;
    capa().rect(x - 4, y + 2, 7, t.torTop - y + 1).pintar(g, piel, { relieve: 2, max: 2 });
    /* Placas claras de la garganta. */
    for (let j = y + 5; j <= t.torTop; j += 2) pon(g, R.hueso, 2, [x + 1, j], [x + 2, j]);
    const c = capa().ell(x - 1, y, 5.8, 6);
    c.poly([[x + 1, y - 4.5], [x + 6, y - 3.5], [x + 10, y - 1], [x + 10.5, y + 1.5], [x + 9, y + 4], [x + 5, y + 5.5], [x - 1, y + 6]]);
    c.pintar(g, piel, { relieve: 3.5 });
    /* Mandíbula inferior más clara. */
    for (let i = x + 1; i <= x + 9; i++) for (let j = y + 3; j <= y + 6; j++) if (g.rampa(i, j) === piel && tono(g, i, j) >= 2) pon(g, R.hueso, 2 + (j === y + 3 ? 1 : 0), [i, j]);
    /* Escamas. */
    cada(g, piel, x - 7, y - 6, x + 8, y + 2, (i, j, k) => { if (k === 2 && (i + j * 2) % 4 === 0) pon(g, piel, 3, [i, j]); if (k === 3 && (i * 3 + j) % 5 === 0) pon(g, piel, 2, [i, j]); });
    /* Cresta de pinchos por la nuca y cuernos hacia atrás. */
    const cr = capa();
    for (let k = 0; k < 3; k++) cr.poly([[x - 5 - k * 1.5, y - 4 + k * 3], [x - 9 - k * 1.5, y - 4 + k * 3.2], [x - 6 - k * 1.5, y - 1.5 + k * 3]]);
    cr.pintar(g, piel, { relieve: 1, max: 2, separar: true });
    const cu = capa().curva(x - 2, y - 4, x - 6, y - 8, x - 11, y - 8, 3, 1).curva(x - 4, y - 1, x - 8, y - 3, x - 12, y - 2, 2.6, 1);
    cu.pintar(g, R.hueso, { relieve: 1.5, separar: true });
    /* Arco de la ceja, fosa nasal y la línea de la boca. */
    for (let i = x; i <= x + 4; i++) if (g.rampa(i, y - 3) === piel) pon(g, piel, 1, [i, y - 3]);
    pon(g, piel, 4, [x + 1, y - 4], [x + 2, y - 4]);
    pon(g, piel, 0, [x + 9, y - 1]);
    for (let i = x + 3; i <= x + 10; i++) if (g.get(i, y + 2)) pon(g, piel, 0, [i, y + 2]);
    pon(g, piel, 0, [x + 2, y + 1]);
    const ex = x + 2, ey = y - 1;
    const libre = (i, j) => g.rampa(i, j) === piel || g.rampa(i, j) === R.hueso;
    const m = (col, ram, ...pts) => { for (const [i, j] of pts) if (libre(i, j)) g.set(i, j, col, ram); };
    if (gesto === "dolor") {
      m(OJOS, null, [ex, ey - 1], [ex + 1, ey], [ex, ey + 1], [ex + 2, ey]);
      m(OJOS, null, [x + 4, y + 3], [x + 5, y + 3], [x + 6, y + 4], [x + 7, y + 3], [x + 5, y + 4]);
      m(R.hueso[4], R.hueso, [x + 8, y + 3], [x + 4, y + 2]);
      m(R.sangre[3], R.sangre, [x + 6, y + 3]);
      m(SUDOR[4], SUDOR, [x - 2, y - 3]); m(SUDOR[3], SUDOR, [x - 2, y - 2]); m(SUDOR[2], SUDOR, [x - 2, y - 1]);
    } else if (gesto === "alegre") {
      m(OJOS, null, [ex - 1, ey + 1], [ex, ey], [ex + 1, ey], [ex + 2, ey + 1]);
      m(piel[0], piel, [x + 2, y + 1], [x + 1, y]);
      m(MEJILLA[4], MEJILLA, [ex, ey + 2]);
      for (let i = x + 3; i <= x + 8; i++) m(i % 2 ? R.hueso[4] : OJOS, i % 2 ? R.hueso : null, [i, y + 3]);
      m(OJOS, null, [x + 9, y + 2]);
    } else if (gesto === "furia") {
      m(piel[0], piel, [ex - 1, ey - 1], [ex, ey - 1], [ex + 1, ey], [ex + 2, ey]);
      m(R.fuego[3], R.fuego, [ex, ey + 1], [ex + 1, ey + 1]);
      m(OJOS, null, [ex + 1, ey + 1]);
      for (let i = x + 3; i <= x + 9; i++) m(i % 2 ? R.hueso[4] : OJOS, i % 2 ? R.hueso : null, [i, y + 2], [i, y + 3]);
      m(R.fuego[4], R.fuego, [x + 11, y - 2]); m(R.fuego[2], R.fuego, [x + 11, y - 1]);
    } else {
      m(R.bronce[4], R.bronce, [ex, ey], [ex + 1, ey]);
      m(R.bronce[2], R.bronce, [ex, ey + 1]);
      m(OJOS, null, [ex + 1, ey + 1], [ex + 1, ey - 1], [ex, ey - 1], [ex + 2, ey], [ex + 2, ey + 1]);
      m(OJOS, null, [ex + 1, ey]);
      m(R.bronce[4], R.bronce, [ex, ey]);
    }
  }

  /* ---------- Pelo y barba ---------- */
  /* Mechones: surcos oscuros que salen de la coronilla y un brillo en la parte alta. */
  function texturaPelo(g, ram, cx, cy, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => {
      const ang = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
      const banda = ((ang * 5.1 + d * 0.18) % 1 + 1) % 1;
      if (k >= 2 && banda < 0.16 && d > 2) g.set(x, y, ram[k - 1], ram);
      else if (k === 3 && d > 2.5 && d < 5.5 && ang < -1 && ang > -2.9 && banda > 0.5 && banda < 0.75) g.set(x, y, ram[4], ram);
    });
  }
  function pelo(g, t, ram, peinado, raza, soloCabeza) {
    if (peinado === "rapado") {
      /* Rapado: la sombra del pelo corto sobre el cráneo. */
      cada(g, g.rampa(t.cabX, t.cabY - 4), t.cabX - 7, t.cabY - 8, t.cabX + 3, t.cabY - 3, (x, y) => {
        if (y < t.ojoY - 4 - (x > t.cabX ? 1 : 0) && (x + y) % 2 === 0 && umbral(x, y) > 0.3) g.set(x, y, ram[1], ram);
      });
      return;
    }
    const x = t.cabX, y = t.cabY, rx = t.cabRx, ry = t.cabRy;
    const c = capa().ell(x - 0.4, y - 1, rx + 1, ry + 0.4);
    /* Cara despejada: flequillo hasta la frente con unas puntas. */
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const frente = t.ojoY - 3 - (i >= x + 4 ? 1 : 0) - (i >= x + 6 ? 1 : 0);
      if (i >= x - 1 && j >= frente) c.off(i, j);
    }
    c.on(x, t.ojoY - 3).on(x + 3, t.ojoY - 4).on(x - 1, t.ojoY - 2).on(x - 1, t.ojoY - 1);
    c.quitarRect(0, y + 4, W, H);
    c.rect(x - 7, y + 1, 3, 3); // nuca
    if (peinado === "largo") c.poly([[x - 8, y - 1], [x - 1, y], [x - 1, y + 4], [x - 2, t.torTop + 2], [x - 4, t.torTop + 5], [x - 8, t.torTop + 4], [x - 9, t.torTop]]);
    if (peinado === "recogido") c.ell(x - 7.5, y - 4, 2.8, 2.6);
    if (peinado === "rizado") {
      c.ell(x - 1, y - 3.5, rx + 2, 4.2);
      c.ell(x - 6.5, y + 1.5, 2.6, 3);
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (i >= x - 1 && j >= t.ojoY - 3 - (i >= x + 5 ? 1 : 0)) c.off(i, j);
    }
    if (raza === "elfo" || raza === "gnomo" || raza === "satiro" || raza === "semiorco") c.quitarRect(x - 4, y - 1, 2, 3);
    if (soloCabeza) c.recortar(capa().ell(t.cabX, t.cabY, t.cabRx, t.cabRy));
    c.pintar(g, ram, { relieve: 3 });
    if (peinado === "rizado") {
      /* Rizos: bultos redondos que atrapan la luz. */
      const rizos = [[x - 6, y - 6], [x - 2, y - 8], [x + 2, y - 7.5], [x + 5, y - 5.5], [x - 8, y - 2], [x - 8, y + 2], [x - 5, y - 3], [x - 1, y - 4.5], [x + 3, y - 4]];
      for (const [i, j] of rizos) {
        const r = capa().ell(i, j, 1.6, 1.4).recortar(c);
        r.pintar(g, ram, { relieve: 1.5, min: 1, separar: 2 });
      }
    } else texturaPelo(g, ram, x - 1, y - 6, x - 10, y - 9, x + 8, t.torTop + 6);
    if (peinado === "recogido") {
      /* Moño con su cinta y una coleta que cae. */
      const cl = capa().curva(x - 8, y - 2, x - 11, y + 2, x - 9, y + 7, 3, 1.5);
      if (!soloCabeza) cl.pintar(g, ram, { relieve: 1.5, separar: 2 });
      if (!soloCabeza) { surco(g, ram, 1, x - 9, y - 1, x - 10, y + 4, ram); pon(g, R.tela.granate, 3, [x - 9, y - 2], [x - 8, y - 2]); pon(g, R.tela.granate, 2, [x - 7, y - 2]); }
    }
    if (peinado === "largo" && !soloCabeza) for (let i = x - 8; i <= x - 2; i += 2) surco(g, ram, 1, i, y + 2, i - 0.5, t.torTop + 4, ram);
  }
  function barba(g, t, ram, larga) {
    const x = t.cabX, y = t.ojoY, by = t.bocaY;
    const c = capa().poly([[x - 2, y + 0.5], [x, y + 2.5], [x + 3, by - 1.5], [x + 8, by - 1.5], [x + 8, by + 1.5], [x + 5.5, by + 3.5], [x + 1, by + 3], [x - 2.5, y + 3]]);
    if (larga) c.poly([[x - 3, by - 1], [x + 7.5, by], [x + 7, t.torTop + 5], [x + 4, t.torTop + 9], [x + 1, t.torTop + 7], [x - 2, t.torTop + 4]]);
    c.pintar(g, ram, { relieve: 2.5, separar: 2 });
    /* Bigote y boca. */
    for (let i = x + 3; i <= x + 8; i++) if (g.rampa(i, by - 1) === ram) pon(g, ram, i === x + 3 ? 1 : 3, [i, by - 1]);
    pon(g, ram, 0, [x + 4, by], [x + 5, by], [x + 6, by]);
    /* Mechones verticales. */
    cada(g, ram, x - 3, by + 1, x + 8, t.torTop + 9, (i, j, k) => { if (k >= 2 && (i + (j >> 2)) % 3 === 0) g.set(i, j, ram[k - 1], ram); });
    if (larga) {
      /* Trenza central con una anilla de bronce. */
      const ty = t.torTop + 5;
      pon(g, R.bronce, 4, [x + 3, ty]); pon(g, R.bronce, 3, [x + 4, ty]); pon(g, R.bronce, 2, [x + 3, ty + 1], [x + 4, ty + 1]);
      for (let j = by + 2; j < ty; j += 2) { pon(g, ram, 1, [x + 3, j]); pon(g, ram, 3, [x + 4, j]); }
    }
  }

  /* ---------- Cuernos y colas ---------- */
  function cuernos(g, t, raza) {
    const x = t.cabX, y = t.cabY;
    if (raza === "tiefling") {
      const N = R.pelo.negro;
      const c = capa().curva(x + 1, y - 5, x, y - 12.5, x - 6, y - 11.5, 3.4, 1);
      c.curva(x - 3, y - 5, x - 4, y - 10, x - 9, y - 8.5, 2.8, 1);
      c.pintar(g, N, { relieve: 1.5, min: 2, separar: true });
      /* Anillos del cuerno. */
      for (let j = y - 11; j <= y - 5; j += 2) for (let i = x - 9; i <= x + 3; i++) if (g.rampa(i, j) === N && tono(g, i, j) >= 3) pon(g, N, 2, [i, j]);
      pon(g, N, 4, [x, y - 9], [x - 4, y - 8]);
    }
    if (raza === "satiro") {
      const c = capa().curva(x + 1, y - 5, x + 1, y - 10, x - 3, y - 10, 2.6, 1.2).curva(x - 2, y - 5, x - 3, y - 8, x - 6, y - 8, 2, 1);
      c.pintar(g, R.hueso, { relieve: 1.2, min: 1, separar: true });
      for (let j = y - 10; j <= y - 5; j += 2) for (let i = x - 6; i <= x + 3; i++) if (g.rampa(i, j) === R.hueso && tono(g, i, j) >= 3) pon(g, R.hueso, 2, [i, j]);
    }
  }
  function cola(g, t, piel, raza) {
    if (raza === "tiefling") {
      capa().curva(t.torL + 1, t.torBot - 1, t.torL - 10, t.torBot + 9, t.torL - 9, t.torBot - 3, 2.6, 1.6).pintar(g, piel, { relieve: 1.2 });
      const px = t.torL - 9, py = t.torBot - 4;
      capa().poly([[px - 2.5, py + 1], [px, py - 4], [px + 2.5, py + 1], [px, py]]).pintar(g, piel, { relieve: 1, min: 2 });
      pon(g, piel, 4, [px - 1, py - 1]);
    }
    if (raza === "draconido") {
      const c = capa().curva(t.torL + 3, t.torBot - 3, t.torL - 3, t.suelo + 1, t.torL - 12, t.suelo - 2, 6.5, 2);
      c.pintar(g, piel, { relieve: 2.5 });
      /* Panza clara por debajo y pinchos por encima. */
      for (let i = t.torL - 12; i <= t.torL + 3; i++) for (let j = t.torBot; j < t.suelo + 1; j++)
        if (c.tiene(i, j) && !c.tiene(i, j + 1)) pon(g, R.hueso, 2, [i, j]);
      cada(g, piel, t.torL - 12, t.torBot - 3, t.torL + 3, t.suelo, (i, j, k) => { if (k === 2 && (i + j) % 3 === 0) pon(g, piel, 3, [i, j]); });
    }
  }

  /* ---------- Brazos, manos y piernas ---------- */
  function puno(g, mx, my, ram, tapa) {
    /* Puño cerrado alrededor de un mango vertical: cuatro dedos, nudillos con brillo y el pulgar encima. */
    capa().rect(mx - 1, my - 1, 3, 4).on(mx + 2, my).on(mx + 2, my + 1).pintar(g, ram, { relieve: 1.5, separar: true });
    pon(g, ram, 1, [mx, my], [mx, my + 1], [mx, my + 2]);
    pon(g, ram, 3, [mx + 1, my - 1], [mx + 1, my], [mx + 1, my + 1]);
    pon(g, ram, 1, [mx + 1, my + 2], [mx + 2, my + 1]);
    pon(g, ram, 4, [mx - 1, my - 1]);
    if (tapa) pon(g, tapa, 2, [mx - 1, my + 2], [mx - 1, my + 1]);
  }
  function mano(g, x, y, ram, sombra) {
    /* Mano abierta colgando, con los dedos marcados. */
    capa().rect(x - 1, y, 3, 3).on(x, y + 3).on(x + 1, y + 3).pintar(g, ram, { relieve: 1, max: sombra ? 2 : 4 });
    pon(g, ram, 1, [x, y + 2], [x, y + 3]);
  }
  /* manga: { sup, inf, puno, guante, puño (rampa del puño de la manga) } */
  function brazoDelante(g, t, piel, m, conPuno = true) {
    const [hx, hy] = t.hombro, [ex, ey] = t.codo, [mx, my] = t.mano;
    const gr = t.grosor;
    const sup = capa().linea(hx, hy, ex, ey, gr);
    const inf = capa().linea(ex, ey, mx - 1, my - 1, gr - 1 + (m.ancha ? 1 : 0));
    sup.pintar(g, m.sup || piel, { relieve: 2, separar: true });
    inf.pintar(g, m.inf || piel, { relieve: 2, separar: true });
    if (m.ancha) {
      /* Manga ancha de túnica que cae desde el antebrazo. */
      const b = capa().poly([[ex - 1, ey], [mx - 1, my - 2], [mx - 1, my + 2], [ex + 1, my + 3]]);
      b.pintar(g, m.inf, { relieve: 2, separar: true });
      cada(g, m.inf, ex - 2, my + 1, mx, my + 4, (x, y, k) => { if (!b.tiene(x, y + 1)) g.set(x, y, (m.ribete || m.inf)[m.ribete ? 3 : 1], m.ribete || m.inf); });
    }
    if (m.brazal) {
      const bz = capa().linea(ex + 0.5, ey + 0.5, mx - 1.5, my - 1.5, gr);
      bz.recortar(inf).pintar(g, m.brazal, { relieve: 1.5, separar: true });
      cada(g, m.brazal, ex - 2, ey - 2, mx + 1, my + 1, (x, y, k) => { if ((x + y) % 3 === 0) g.set(x, y, m.brazal[Math.max(0, k - 1)], m.brazal); });
    }
    if (conPuno) puno(g, mx, my, m.guante || piel);
  }
  function brazoAtras(g, t, piel, m) {
    const [hx, hy] = t.hombroAtras, [mx, my] = t.manoAtras;
    capa().linea(hx, hy, mx, my, t.grosor).pintar(g, m.sup || piel, { relieve: 2, max: 2 });
    if (m.ancha) capa().poly([[mx - 1, my - 4], [mx + 2, my - 4], [mx + 2, my + 1], [mx - 2, my + 1]]).pintar(g, m.inf, { relieve: 1.5, max: 2 });
    mano(g, mx, my + 1, m.guante || piel, true);
  }

  function pieDesnudo(g, t, x0, piel, peludo, atras, mediano) {
    const s = t.suelo, l = mediano ? 7 : 5;
    const c = capa().rect(x0 - 1, s - 1, l, 2).rect(x0, s - 2, 3, 1);
    c.pintar(g, piel, { relieve: 1.2, max: atras ? 2 : 4, separar: true });
    for (let i = x0 + 2; i < x0 + l - 1; i += 2) pon(g, piel, 1, [i, s]);
    pon(g, piel, atras ? 2 : 3, [x0 + l - 2, s - 1]);
    if (peludo) pon(g, peludo, 2, [x0, s - 2], [x0 + 2, s - 2], [x0 + 1, s - 1], [x0 + 3, s - 1]), pon(g, peludo, 3, [x0 + 1, s - 2]);
  }
  function bota(g, t, x0, ram, atras, alto = 5, puntera = 0) {
    const s = t.suelo, gw = t.pierna;
    const c = capa().rect(x0 - 1 + (atras ? 0 : 0), s - alto, gw + 1, alto - 1).rect(x0 - 1, s - 1, gw + 3, 2).on(x0 + gw + 2, s);
    c.pintar(g, ram, { relieve: 1.6, max: atras ? 2 : 4, separar: true });
    /* Vuelta de la caña, suela y empeine. */
    for (let i = x0 - 1; i <= x0 + gw; i++) { pon(g, ram, atras ? 2 : 3, [i, s - alto]); pon(g, ram, 1, [i, s - alto + 1]); }
    for (let i = x0 - 1; i <= x0 + gw + 2; i++) pon(g, ram, 0, [i, s]);
    pon(g, ram, atras ? 2 : 4, [x0 + gw + 1, s - 1]);
    if (puntera) pon(g, puntera, 3, [x0 + gw + 2, s - 1]);
  }
  /* o: { ramPierna, ramBota, peludo, descalzo, alto, rodillera } */
  function piernas(g, t, piel, raza, ramPelo, o) {
    const { pierTop, suelo, pierna: gw } = t;
    const xa = t.pieAtras, xd = t.pieDelante;
    if (raza === "satiro") {
      /* Patas de cabra: cadera peluda, corvejón hacia atrás y pezuñas. */
      capa().ell(t.cx, pierTop + 2, t.torR - t.torL - 4, 3.4).pintar(g, ramPelo, { relieve: 2.5 });
      const pata = (x, atras) => {
        const c = capa().linea(x, pierTop + 2, x + 1.5, pierTop + 6, gw).linea(x + 1.5, pierTop + 6, x - 1, suelo - 4, gw - 1).linea(x - 1, suelo - 4, x, suelo - 2, gw - 1);
        c.pintar(g, ramPelo, { relieve: 1.8, max: atras ? 2 : 4, separar: true });
        cada(g, ramPelo, x - 4, pierTop + 1, x + 4, suelo - 2, (i, j, k) => { if (k >= 2 && (i * 2 + j) % 5 === 0) g.set(i, j, ramPelo[k - 1], ramPelo); });
        capa().rect(x - 2, suelo - 1, 4, 2).pintar(g, R.pelo.negro, { relieve: 1, min: 2, max: atras ? 3 : 4, separar: true });
        pon(g, R.pelo.negro, 0, [x, suelo - 1], [x, suelo]);
      };
      pata(xa - 1, true); pata(xd, false);
      return;
    }
    const rp = o.ramPierna || piel;
    const atras = capa().linea(xa + 0.5, pierTop - 1, xa - 0.5, suelo - 2, gw);
    const delante = capa().linea(xd - 0.5, pierTop - 1, xd + 0.5, suelo - 2, gw);
    atras.pintar(g, rp, { relieve: 2, max: 2 });
    delante.pintar(g, rp, { relieve: 2, separar: true });
    if (o.rodillera) {
      const ky = Math.round((pierTop + suelo) / 2) - 1;
      capa().ell(xd + 0.5, ky, gw / 2 + 0.3, 1.4).pintar(g, o.rodillera, { relieve: 1.2, separar: true });
      pon(g, o.rodillera, 4, [xd, ky - 1]);
      capa().ell(xa - 0.5, ky, gw / 2, 1.2).pintar(g, o.rodillera, { relieve: 1, max: 2, separar: true });
    }
    const pa = xa - Math.floor(gw / 2) - 1, pd = xd - Math.floor(gw / 2);
    if (o.descalzo || !o.ramBota) {
      const med = raza === "mediano";
      const peludo = med ? ramPelo : null;
      pieDesnudo(g, t, pa, piel, peludo, true, med);
      pieDesnudo(g, t, pd, piel, peludo, false, med);
      if (o.zapato && !med) {
        for (const [x0, at] of [[pa, true], [pd, false]]) {
          capa().rect(x0 - 1, suelo - 1, 5, 2).on(x0 + 4, suelo).pintar(g, o.zapato, { relieve: 1, max: at ? 2 : 3, separar: true });
          for (let i = x0 - 1; i <= x0 + 4; i++) pon(g, o.zapato, 0, [i, suelo]);
          pon(g, o.zapato, at ? 2 : 3, [x0 + 2, suelo - 1]);
        }
      }
      return;
    }
    bota(g, t, pa + 1, o.ramBota, true, o.alto || 5, o.puntera);
    bota(g, t, pd + 1, o.ramBota, false, o.alto || 5, o.puntera);
  }

  /* ---------- Formas de la ropa ---------- */
  const torso = t => {
    const c = capa().rect(t.torL, t.torTop, t.torR - t.torL + 1, t.torBot - t.torTop + 1);
    c.off(t.torL, t.torTop).off(t.torR, t.torTop);
    return c;
  };
  const falda = (t, largo, vuelo) => capa().poly([[t.torL, t.torBot - 1], [t.torR + 1, t.torBot - 1], [t.torR + 1 + vuelo, t.pierTop + largo], [t.torL - vuelo, t.pierTop + largo]]);
  function cinturon(g, t, ram = CUERO, hebilla = R.bronce, y = t.torBot - 2, ancho = 2) {
    for (let x = t.torL; x <= t.torR; x++) for (let j = 0; j < ancho; j++) if (g.get(x, y + j)) g.set(x, y + j, ram[j === 0 ? 2 : 1], ram);
    for (let x = t.torL; x <= t.torR; x++) if (g.get(x, y - 1)) matiz(g, x, y - 1, -1);
    /* Hebilla: marco de metal con su brillo. */
    const hx = t.cx + 2;
    pon(g, hebilla, 3, [hx, y], [hx + 1, y], [hx + 2, y]);
    pon(g, hebilla, 2, [hx, y + ancho - 1], [hx + 2, y + ancho - 1]);
    pon(g, hebilla, 4, [hx, y]);
    if (ancho > 1) pon(g, ram, 0, [hx + 1, y + ancho - 1]);
    pon(g, hebilla, 1, [hx, y + ancho], [hx + 1, y + ancho], [hx + 2, y + ancho]);
    if (!g.get(hx + 1, y + ancho)) for (let i = 0; i < 3; i++) g.quitar(hx + i, y + ancho);
  }
  /* Ribete en el borde inferior de una capa. */
  function ribete(g, c, ram, k = 3, filas = 1) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      for (let f = 1; f <= filas; f++) if (!c.tiene(x, y + f)) { g.set(x, y, ram[f === 1 ? k - 1 : k], ram); break; }
    }
  }
  /* Oscurece con tramado la parte baja de una tela (la luz viene de arriba). */
  function penumbra(g, ram, x0, y0, x1, y1) {
    cada(g, ram, x0, y0, x1, y1, (x, y, k) => { if (k > 1 && (y - y0) / Math.max(1, y1 - y0) > umbral(x, y) + 0.35) g.set(x, y, ram[k - 1], ram); });
  }
  function capucha(t, punta) {
    const x = t.cabX, y = t.cabY;
    const c = capa().ell(x - 0.8, y - 0.6, t.cabRx + 1.6, t.cabRy + 1.4);
    c.poly([[x - 8, y], [x - 1, y + 5], [t.torL + 3, t.torTop + 3], [t.torL - 3, t.torTop + 3], [x - 9.5, t.torTop - 1]]);
    c.poly([[x - 3, y + 4], [x + 6, y + 5.5], [t.torR - 1, t.torTop + 2.5], [t.torL + 1, t.torTop + 2.5]]);
    if (punta) c.poly([[x - 3, y - 6], [x - 10, y - 9], [x - 8, y - 3]]);
    const cara = capa().ell(x + 4.2, t.ojoY + 1.3, 4.8, 5.4).rect(x + 6, t.ojoY - 2, 4, 9);
    c.restar(cara);
    return c;
  }
  function pintarCapucha(g, t, ram, piel, punta) {
    const c = capucha(t, punta);
    c.pintar(g, ram, { relieve: 3, separar: true });
    /* Borde de la abertura iluminado y sombra que cae sobre la cara. */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      if (!c.tiene(x + 1, y) && g.rampa(x + 1, y) === piel || !c.tiene(x, y + 1) && g.rampa(x, y + 1) === piel && y < t.ojoY) g.set(x, y, ram[3], ram);
    }
    cada(g, piel, t.cabX - 2, t.ojoY - 4, t.cabX + 9, t.bocaY + 3, (x, y, k) => {
      const cerca = c.tiene(x - 1, y) || c.tiene(x, y - 1) || c.tiene(x - 2, y) || c.tiene(x, y - 2);
      if (cerca || y < t.ojoY) g.set(x, y, piel[Math.max(0, k - 1)], piel);
    });
    /* Pliegues de la caída. */
    surco(g, ram, 1, t.cabX - 6, t.cabY + 3, t.cabX - 8, t.torTop + 1, ram);
    surco(g, ram, 1, t.cabX - 3, t.cabY + 5, t.cabX - 4, t.torTop + 2, ram);
    return c;
  }

  /* ---------- Lo que va a la espalda ---------- */
  function espalda(g, t, clase, tela) {
    const capaEsp = (largo, vuelo) => capa().poly([[t.torL + 1, t.torTop], [t.torL + 5, t.torTop], [t.torL + 2, t.pierTop + largo], [t.torL - vuelo, t.pierTop + largo - 1], [t.torL - 2, t.torTop + 4]]);
    if (clase === "explorador") {
      const cp = capaEsp(6, 6);
      cp.pintar(g, tela, { relieve: 2.5, max: 3 });
      pliegue(g, tela, t.torL - 1, t.torTop + 6, t.torL - 3, t.pierTop + 4);
      ribete(g, cp, tela, 2);
      /* Carcaj de cuero con flechas. */
      const q = capa().linea(t.torL + 3, t.torTop - 2, t.torL - 1, t.torBot - 1, 4);
      q.pintar(g, CUERO, { relieve: 1.6, separar: true });
      for (const [dx, dy] of [[0, 0], [-1, 6], [-2, 10]]) surco(g, R.bronce, 2, t.torL + 1 + dx, t.torTop + dy + 1, t.torL + 4 + dx, t.torTop + dy, CUERO);
      const plumas = [[t.torL + 4, t.torTop - 6, R.hueso], [t.torL + 2, t.torTop - 6, R.tela.granate], [t.torL + 5, t.torTop - 4, R.hueso]];
      for (const [px, py, ram] of plumas) {
        surco(g, R.madera, 2, px, py + 2, px - 1, py + 4, null);
        capa().rect(px - 1, py - 1, 2, 3).pintar(g, ram, { relieve: 1, min: 2, separar: true });
      }
    }
    if (clase === "bardo" || clase === "picaro") {
      const cp = capaEsp(clase === "bardo" ? 3 : 4, 5);
      cp.pintar(g, tela, { relieve: 2.5, max: 3 });
      pliegue(g, tela, t.torL, t.torTop + 5, t.torL - 2, t.pierTop + 2);
      ribete(g, cp, clase === "bardo" ? R.tela.granate : tela, clase === "bardo" ? 3 : 2);
    }
    if (clase === "barbaro") {
      const cp = capa().poly([[t.torL, t.torTop], [t.torL + 4, t.torTop], [t.torL + 1, t.torBot + 1], [t.torL - 4, t.torBot], [t.torL - 2, t.torTop + 3]]);
      for (let j = t.torBot - 2; j <= t.torBot + 1; j++) for (let i = t.torL - 4; i <= t.torL + 2; i++) if ((i + j) % 3 === 0) cp.off(i, j);
      cp.pintar(g, PELLIZA, { relieve: 2.5, max: 2 });
    }
  }

  /* ---------- Ropa de cada clase ---------- */
  function vestir(g, t, clase, tela, piel) {
    const T = torso(t);
    const { torL, torR, torTop, torBot, pierTop, cx } = t;
    switch (clase) {
      case "guerrero": {
        const F = falda(t, 5, 1);
        F.pintar(g, R.hierro, { relieve: 2.5 });
        malla(g, R.hierro, torL - 2, torBot, torR + 2, pierTop + 6);
        ribete(g, F, R.hierro, 2);
        T.pintar(g, R.hierro, { relieve: 4, separar: true });
        /* Peto: arista central brillante y placas del faldar con remaches. */
        for (let y = torTop + 2; y <= torTop + 7; y++) { pon(g, R.hierro, 4, [cx + 2, y]); pon(g, R.hierro, 2, [cx + 3, y]); }
        for (const py of [torBot - 5, torBot - 3]) for (let x = torL; x <= torR; x++) if (g.rampa(x, py) === R.hierro) pon(g, R.hierro, 1, [x, py]), pon(g, R.hierro, 3, [x, py + 1]);
        pon(g, R.hierro, 4, [torL + 2, torBot - 4], [torR - 2, torBot - 4]);
        /* Sobreveste de la tela de la clase, con ribete claro. */
        const sv = capa().rect(cx - 1, torTop + 6, 5, pierTop + 7 - torTop - 6).poly([[cx - 1, pierTop + 4], [cx + 4, pierTop + 4], [cx + 4.5, pierTop + 8], [cx - 1.5, pierTop + 8]]);
        sv.pintar(g, tela, { relieve: 2, separar: true });
        cada(g, tela, cx - 2, torTop + 6, cx + 5, pierTop + 9, (x, y) => { if (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) g.set(x, y, R.hueso[2], R.hueso); });
        ribete(g, sv, R.hueso, 3);
        pliegue(g, tela, cx + 1, pierTop, cx + 1, pierTop + 6);
        cinturon(g, t, CUERO, R.bronce);
        /* Hombrera de atrás. */
        capa().ell(torL + 1, torTop + 1, 3, 2.4).pintar(g, R.hierro, { relieve: 2, max: 3, separar: true });
        break;
      }
      case "barbaro": {
        T.pintar(g, piel, { relieve: 4 });
        /* Pectorales y abdominales. */
        for (let x = cx - 2; x <= torR - 1; x++) if (x !== cx + 2) pon(g, piel, 1, [x, torTop + 5]);
        pon(g, piel, 3, [cx - 1, torTop + 3], [cx + 3, torTop + 3], [cx, torTop + 3]);
        for (let y = torTop + 7; y < torBot - 3; y += 2) { pon(g, piel, 1, [cx, y], [cx + 3, y]); pon(g, piel, 3, [cx + 1, y]); }
        pon(g, piel, 1, [cx + 2, torTop + 6], [cx + 2, torTop + 8], [cx + 2, torTop + 10]);
        /* Taparrabos con caída delante. */
        const tp = capa().poly([[torL, torBot - 2], [torR + 1, torBot - 2], [torR + 2, pierTop + 3], [cx + 1, pierTop + 1], [torL - 1, pierTop + 3]]).poly([[cx - 1, torBot], [cx + 5, torBot], [cx + 4, pierTop + 7], [cx, pierTop + 7]]);
        tp.pintar(g, tela, { relieve: 2.5, separar: true });
        pliegue(g, tela, cx + 2, pierTop, cx + 2, pierTop + 6);
        ribete(g, tp, tela, 2);
        for (let x = cx; x <= cx + 4; x += 2) pon(g, tela, 0, [x, pierTop + 7]);
        cinturon(g, t, CUERO, R.hierro, torBot - 3, 3);
        /* Pelliza sobre los hombros. */
        const pz = capa().ell(cx - 0.5, torTop + 0.8, (torR - torL) / 2 + 2.4, 3).ell(torL + 1, torTop + 2, 3, 4);
        for (let i = torL - 3; i <= torR + 3; i++) if ((i & 1) === 0) pz.off(i, Math.round(torTop + 3.6));
        pz.pintar(g, PELLIZA, { relieve: 2.5, separar: true });
        cada(g, PELLIZA, torL - 4, torTop - 3, torR + 4, torTop + 7, (x, y, k) => {
          if ((x * 5 + y * 3) % 7 === 0) g.set(x, y, PELLIZA[Math.max(1, k - 1)], PELLIZA);
          else if ((x * 3 + y * 5) % 11 === 0 && k < 4) g.set(x, y, PELLIZA[k + 1], PELLIZA);
        });
        /* Correa del hombro. */
        surco(g, CUERO, 2, torL + 2, torTop + 2, torR - 1, torBot - 4, piel);
        break;
      }
      case "picaro": {
        const tr = T.copia().unir(falda(t, 3, 1));
        tr.pintar(g, tela, { relieve: 4 });
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 1, pierTop, cx - 2, pierTop + 3);
        /* Correaje en bandolera con cuchillos arrojadizos. */
        const bd = capa().linea(torL + 1, torTop, torR, torBot - 3, 2).recortar(T);
        bd.pintar(g, CUERO, { relieve: 1, separar: true });
        for (let k = 0; k < 3; k++) {
          const px = torL + 3 + k * 3, py = torTop + 2 + Math.round(k * 2.3);
          pon(g, R.hierro, 4, [px, py - 1]); pon(g, R.hierro, 3, [px, py]);
        }
        cinturon(g, t, CUERO, R.hierro);
        /* Bolsa y puñal en la cadera. */
        capa().rect(torL - 1, torBot - 1, 4, 4).pintar(g, CUERO, { relieve: 1.5, separar: true });
        pon(g, CUERO, 1, [torL - 1, torBot], [torL, torBot], [torL + 1, torBot], [torL + 2, torBot]);
        pon(g, R.bronce, 3, [torL, torBot + 1]);
        break;
      }
      case "explorador": {
        const tr = T.copia().unir(falda(t, 4, 1));
        tr.pintar(g, tela, { relieve: 4 });
        ribete(g, tr, tela, 2);
        /* Abertura de la túnica y pliegues. */
        surco(g, tela, 1, cx + 2, torBot, cx + 2, pierTop + 4, tela);
        pliegue(g, tela, cx - 2, pierTop, cx - 3, pierTop + 3);
        /* Jubón de cuero sin mangas. */
        const jb = capa().rect(torL, torTop + 1, torR - torL + 1, torBot - torTop - 1).quitarRect(cx + 1, torTop + 1, 3, 3).off(cx + 1, torTop + 4);
        jb.recortar(T).pintar(g, CUERO, { relieve: 3, separar: true });
        for (let y = torTop + 5; y < torBot - 2; y += 2) pon(g, R.hueso, 3, [cx + 2, y]);
        /* Correa del carcaj. */
        surco(g, R.madera, 1, torL + 1, torTop, torR, torBot - 3, null);
        surco(g, R.madera, 3, torL + 1, torTop + 1, torR, torBot - 2, CUERO);
        pon(g, R.bronce, 4, [cx - 1, torTop + 5]);
        cinturon(g, t, R.madera, R.bronce);
        capa().rect(torR - 2, torBot - 1, 3, 3).pintar(g, CUERO, { relieve: 1, separar: true });
        break;
      }
      case "mago": {
        const largo = t.suelo - pierTop - 1;
        const tn = T.copia().unir(falda(t, largo, 3));
        tn.pintar(g, tela, { relieve: 4 });
        penumbra(g, tela, torL - 3, pierTop, torR + 4, t.suelo);
        /* Abertura delantera ribeteada y bajo con greca. */
        surco(g, R.bronce, 2, cx + 2, torTop + 2, cx + 3, t.suelo - 1, tela);
        surco(g, tela, 1, cx + 1, torTop + 2, cx + 2, t.suelo - 1, tela);
        ribete(g, tn, R.bronce, 3, 1);
        cada(g, tela, torL - 3, t.suelo - 2, torR + 4, t.suelo - 1, (x, y) => { if (!tn.tiene(x, y + 2) && x % 2 === 0) g.set(x, y, R.bronce[2], R.bronce); });
        pliegue(g, tela, cx - 2, pierTop + 1, cx - 4, t.suelo - 2);
        pliegue(g, tela, cx + 5, pierTop + 2, cx + 7, t.suelo - 2);
        /* Estrellas bordadas. */
        const estrella = (x, y) => { pon(g, R.bronce, 4, [x, y]); pon(g, R.bronce, 2, [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]); };
        estrella(cx - 2, torTop + 5); estrella(torR - 1, pierTop + 3); estrella(cx - 3, pierTop + 6);
        pon(g, R.bronce, 3, [cx + 5, torTop + 4], [torL, pierTop + 2]);
        /* Fajín. */
        for (let x = torL; x <= torR; x++) { pon(g, R.bronce, 2, [x, torBot - 2]); pon(g, R.bronce, 1, [x, torBot - 1]); }
        pon(g, R.bronce, 4, [cx + 2, torBot - 2], [cx + 3, torBot - 2]);
        /* Cuello alto. */
        capa().rect(t.cabX - 3, torTop - 1, 7, 2).pintar(g, tela, { relieve: 1, min: 2, separar: true });
        break;
      }
      case "brujo": {
        const largo = t.suelo - pierTop - 1;
        const tn = T.copia().unir(falda(t, largo, 4));
        tn.pintar(g, tela, { relieve: 4 });
        penumbra(g, tela, torL - 4, pierTop, torR + 5, t.suelo);
        /* Panel central oscuro con runas, fajín negro y broche. */
        const pn = capa().poly([[cx, torTop + 2], [cx + 4, torTop + 2], [cx + 5, t.suelo], [cx - 1, t.suelo]]).recortar(tn);
        pn.pintar(g, R.tela.negro, { relieve: 2, separar: true });
        for (let y = pierTop; y < t.suelo - 1; y += 3) { pon(g, R.magia, 3, [cx + 2, y]); pon(g, R.magia, 2, [cx + 1, y + 1], [cx + 3, y + 1]); }
        ribete(g, tn, R.magia, 2);
        pliegue(g, tela, cx - 3, pierTop + 1, cx - 5, t.suelo - 2);
        pliegue(g, tela, torR + 1, pierTop + 3, torR + 3, t.suelo - 2);
        for (let x = torL; x <= torR; x++) { pon(g, R.tela.negro, 2, [x, torBot - 3]); pon(g, R.tela.negro, 1, [x, torBot - 2]); }
        capa().ell(cx + 2.5, torBot - 2.5, 1.4, 1.4).pintar(g, R.bronce, { relieve: 1, min: 2 });
        pon(g, R.magia, 4, [cx + 2, torBot - 3]);
        surco(g, R.bronce, 3, cx + 2, torBot - 1, cx + 3, torBot + 2, null);
        break;
      }
      case "clerigo": {
        const F = falda(t, 5, 1);
        F.pintar(g, R.hierro, { relieve: 2.5 });
        T.pintar(g, R.hierro, { relieve: 4, separar: true });
        malla(g, R.hierro, torL - 2, torTop, torR + 2, pierTop + 6);
        ribete(g, F, R.hierro, 2);
        /* Sobreveste con el sol sagrado. */
        const sv = capa().rect(cx - 3, torTop + 1, 8, torBot - torTop).poly([[cx - 4, torBot - 1], [cx + 6, torBot - 1], [cx + 7, pierTop + 6], [cx - 5, pierTop + 6]]);
        sv.pintar(g, tela, { relieve: 3, separar: true });
        ribete(g, sv, R.bronce, 3);
        cada(g, tela, cx - 6, torTop, cx + 8, pierTop + 7, (x, y) => { if (sv.tiene(x, y) && (!sv.tiene(x - 1, y) || !sv.tiene(x + 1, y)) && y > torTop + 1) g.set(x, y, R.bronce[2], R.bronce); });
        pliegue(g, tela, cx - 1, pierTop, cx - 2, pierTop + 5);
        pliegue(g, tela, cx + 4, pierTop, cx + 5, pierTop + 5);
        const sx = cx + 1, sy = torTop + 5;
        capa().ell(sx, sy, 1.6, 1.6).pintar(g, R.bronce, { relieve: 1.2, min: 2 });
        pon(g, R.bronce, 4, [sx - 1, sy - 1]);
        pon(g, R.bronce, 3, [sx, sy - 3], [sx, sy + 3], [sx - 3, sy], [sx + 3, sy]);
        pon(g, R.bronce, 2, [sx - 2, sy - 2], [sx + 2, sy - 2], [sx - 2, sy + 2], [sx + 2, sy + 2]);
        cinturon(g, t, CUERO, R.bronce);
        capa().ell(torL + 1, torTop + 1, 2.6, 2.2).pintar(g, R.hierro, { relieve: 2, max: 3, separar: true });
        malla(g, R.hierro, torL - 2, torTop - 1, torL + 4, torTop + 3);
        break;
      }
      case "bardo": {
        const tr = T.copia().unir(falda(t, 3, 1));
        tr.pintar(g, tela, { relieve: 4 });
        ribete(g, tr, R.tela.granate, 3);
        /* Jubón acuchillado: aberturas con la tela de debajo, lazada y botones. */
        for (let y = torTop + 2; y < torBot - 3; y += 3) for (const x of [torL + 2, cx - 1]) { pon(g, R.tela.granate, 3, [x, y], [x, y + 1]); pon(g, tela, 1, [x + 1, y], [x + 1, y + 1]); }
        for (let y = torTop + 2; y <= torBot - 4; y += 2) { pon(g, R.hueso, 3, [cx + 1, y]); pon(g, R.hueso, 4, [cx + 3, y + 1]); pon(g, OJOS, null, [cx + 2, y]); }
        for (let y = torTop + 2; y <= torBot - 3; y++) pon(g, tela, 1, [cx + 2, y]);
        for (let y = torTop + 2; y <= torBot - 3; y += 2) pon(g, R.hueso, 3, [cx + 1, y]), pon(g, R.hueso, 3, [cx + 3, y + 1]);
        for (let y = torTop + 3; y <= torBot - 3; y += 3) pon(g, R.bronce, 4, [torR - 1, y]);
        /* Cuello de gorguera. */
        capa().ell(t.cabX - 0.5, torTop, 4, 1.4).pintar(g, R.hueso, { relieve: 1, min: 2, separar: true });
        cada(g, R.hueso, t.cabX - 5, torTop - 2, t.cabX + 4, torTop + 2, (x, y) => { if (x % 2) pon(g, R.hueso, 2, [x, y]); });
        cinturon(g, t, CUERO, R.bronce);
        break;
      }
      default: {
        /* Túnica sencilla de los personajes llanos. */
        const tr = T.copia().unir(falda(t, 4, 1));
        tr.pintar(g, tela, { relieve: 4 });
        ribete(g, tr, tela, 2);
        pliegue(g, tela, cx - 1, pierTop, cx - 2, pierTop + 4);
        pliegue(g, tela, cx + 4, pierTop, cx + 5, pierTop + 4);
        /* Escote y cordón. */
        pon(g, piel, 2, [t.cabX, torTop], [t.cabX + 1, torTop], [t.cabX + 1, torTop + 1]);
        pon(g, tela, 1, [t.cabX - 1, torTop], [t.cabX + 2, torTop], [t.cabX + 2, torTop + 1], [t.cabX, torTop + 1]);
        for (let x = torL; x <= torR; x++) pon(g, R.madera, (x & 1) ? 2 : 3, [x, torBot - 2]);
        pon(g, R.madera, 3, [cx + 3, torBot - 1]); pon(g, R.madera, 2, [cx + 3, torBot], [cx + 4, torBot + 1]);
      }
    }
  }

  /* ---------- Tocados ---------- */
  function tocado(g, t, clase, tela, piel) {
    const x = t.cabX, y = t.cabY;
    switch (clase) {
      case "guerrero": {
        const yelmo = capa().ell(x - 0.2, y - 1, t.cabRx + 1.2, t.cabRy + 0.6);
        yelmo.quitarRect(x, t.ojoY - 3, 10, 9);
        yelmo.quitarRect(0, y + 5, W, H);
        /* Carrillera que baja por delante de la oreja. */
        yelmo.rect(x - 1, t.ojoY - 3, 2, 7).on(x + 1, t.bocaY);
        yelmo.pintar(g, R.hierro, { relieve: 4, separar: true });
        /* Nasal, banda de la frente con remaches y la cresta. */
        for (let j = t.ojoY - 3; j <= t.ojoY + 2; j++) { pon(g, R.hierro, 3, [x + 3, j]); }
        pon(g, R.hierro, 1, [x + 3, t.ojoY + 2]);
        for (let i = x - 7; i <= x + 7; i++) if (g.rampa(i, t.ojoY - 4) === R.hierro) { pon(g, R.hierro, 1, [i, t.ojoY - 3 - 2]); pon(g, R.hierro, (i - x) % 3 === 0 ? 4 : 2, [i, t.ojoY - 4]); }
        for (let i = x - 7; i <= x + 7; i++) if (g.rampa(i, t.ojoY - 3) === R.hierro) pon(g, R.hierro, 1, [i, t.ojoY - 3]);
        for (let j = y - 7; j <= y; j++) { const i = x - 1 + Math.round((j - y) * 0.15); if (g.rampa(i, j) === R.hierro) pon(g, R.hierro, 4, [i, j]); }
        /* Malla del cuello por detrás. */
        const cm = capa().poly([[x - 8, y + 2], [x - 2, y + 4], [x - 1, t.torTop + 1], [x - 8, t.torTop + 1]]);
        cm.pintar(g, R.hierro, { relieve: 1.5, max: 3, separar: true });
        malla(g, R.hierro, x - 9, y + 3, x - 1, t.torTop + 2);
        /* Penacho. */
        const pe = capa().curva(x, y - 7, x - 5, y - 13, x - 11, y - 7, 3.4, 1.4).curva(x - 2, y - 8, x - 7, y - 11, x - 12, y - 4, 2.4, 1.2);
        pe.pintar(g, tela, { relieve: 1.6, separar: true });
        cada(g, tela, x - 13, y - 14, x + 1, y - 3, (i, j, k) => { if ((i * 2 + j) % 4 === 0 && k >= 2) g.set(i, j, tela[k - 1], tela); });
        pon(g, R.bronce, 3, [x, y - 7]); pon(g, R.bronce, 4, [x - 1, y - 8]);
        break;
      }
      case "brujo": pintarCapucha(g, t, tela, piel, true); break;
      case "explorador": pintarCapucha(g, t, tela, piel, false); break;
      case "picaro": pintarCapucha(g, t, tela, piel, false); break;
      case "clerigo": {
        pintarCapucha(g, t, R.hierro, piel, false);
        malla(g, R.hierro, x - 11, y - 9, x + 7, t.torTop + 3);
        /* Diadema de bronce. */
        for (let i = x - 7; i <= x + 3; i++) {
          const j = t.ojoY - 5 + (i > x ? 1 : 0);
          if (g.rampa(i, j) === R.hierro) pon(g, R.bronce, (i - x) % 4 === 0 ? 4 : 2, [i, j]);
        }
        break;
      }
      case "mago": {
        const by = y - 4.5;
        const ala = capa().ell(x - 0.5, by, t.cabRx + 3.4, 1.7);
        const cono = capa().poly([[x - 5.5, by - 0.5], [x + 4.5, by - 0.5], [x + 1.5, by - 6], [x - 1.5, by - 9.5], [x - 7, by - 12], [x - 4.5, by - 7]]);
        if (by - 12 < 1) cono.quitarRect(0, 0, W, 1);
        cono.pintar(g, tela, { relieve: 3, separar: true });
        ala.pintar(g, tela, { relieve: 1.6, separar: true });
        for (let i = 0; i < W; i++) if (ala.tiene(i, Math.round(by + 1)) && !ala.tiene(i, Math.round(by + 2))) pon(g, tela, 1, [i, Math.round(by + 1)]);
        /* Cinta de bronce con hebilla y una estrella en la copa. */
        for (let i = x - 6; i <= x + 5; i++) for (const j of [Math.round(by - 1), Math.round(by - 2)]) if (cono.tiene(i, j) && g.rampa(i, j) === tela) pon(g, R.bronce, j === Math.round(by - 1) ? 2 : 3, [i, j]);
        pon(g, R.bronce, 4, [x, Math.round(by - 2)], [x - 2, Math.round(by - 2)]); pon(g, OJOS, null, [x - 1, Math.round(by - 1)]);
        const sx = x - 2, sy = Math.round(by - 6);
        pon(g, R.bronce, 4, [sx, sy]); pon(g, R.bronce, 3, [sx - 1, sy], [sx + 1, sy], [sx, sy - 1], [sx, sy + 1]);
        pliegue(g, tela, x + 1, Math.round(by - 3), x - 1, Math.round(by - 7));
        break;
      }
      case "bardo": {
        const by = y - 5;
        const copa = capa().ell(x - 1, by - 0.5, t.cabRx - 0.5, 2.6);
        const ala = capa().ell(x - 0.5, by + 1.5, t.cabRx + 1.8, 1.4);
        copa.pintar(g, tela, { relieve: 2, separar: true });
        ala.pintar(g, tela, { relieve: 1.5, separar: true });
        for (let i = x - 8; i <= x + 6; i++) if (copa.tiene(i, Math.round(by + 0.5)) && !ala.tiene(i, Math.round(by + 0.5))) pon(g, R.tela.granate, 3, [i, Math.round(by + 0.5)]);
        for (let i = x - 8; i <= x + 6; i++) if (copa.tiene(i, Math.round(by + 0.5))) pon(g, R.tela.granate, 2, [i, Math.round(by + 0.5)]);
        /* Pluma larga con su raquis. */
        const pl = capa().curva(x - 3, by - 1, x - 8, by - 9, x - 14, by - 6, 3, 1);
        pl.pintar(g, R.hueso, { relieve: 1.2, min: 2, separar: true });
        surco(g, R.hueso, 1, x - 4, by - 2, x - 7, by - 6, R.hueso);
        surco(g, R.hueso, 1, x - 8, by - 7, x - 12, by - 7, R.hueso);
        cada(g, R.hueso, x - 15, by - 9, x - 11, by - 4, (i, j) => { if (i <= x - 12) pon(g, R.tela.granate, (i + j) % 2 ? 3 : 2, [i, j]); });
        break;
      }
    }
  }

  /* ---------- Armas y objetos ---------- */
  function hoja(g, x, y0, y1, ram = ACERO) {
    /* Hoja vertical de 2 píxeles con filo brillante y punta. */
    for (let y = y1; y <= y0; y++) { g.set(x, y, ram[4], ram); g.set(x + 1, y, ram[2], ram); }
    g.set(x, y1 - 1, ram[3], ram);
    for (let y = y1 + 2; y <= y0; y += 3) g.set(x + 1, y, ram[1], ram);
  }
  function objeto(g, t, clase, tela) {
    const [mx, my] = t.mano;
    switch (clase) {
      case "guerrero": {
        /* Escudo de cometa: borde de hierro con remaches, campo de la tela y una cruz clara. */
        const sx = t.torR + 2, sy = t.torTop + 6;
        const borde = capa().poly([[sx - 6, sy - 6], [sx + 6, sy - 6], [sx + 6, sy + 2], [sx, sy + 10], [sx - 6, sy + 2]]);
        borde.pintar(g, R.hierro, { relieve: 2, separar: true });
        const campo = capa().poly([[sx - 5, sy - 5], [sx + 5, sy - 5], [sx + 5, sy + 1.5], [sx, sy + 8.5], [sx - 5, sy + 1.5]]);
        campo.pintar(g, tela, { relieve: 4 });
        for (let j = sy - 4; j <= sy + 6; j++) { pon(g, R.hueso, 4, [sx - 1, j]); pon(g, R.hueso, 2, [sx, j]); }
        for (let i = sx - 4; i <= sx + 4; i++) { pon(g, R.hueso, i < sx ? 4 : 3, [i, sy - 1]); pon(g, R.hueso, 2, [i, sy]); }
        pon(g, R.hueso, 4, [sx - 1, sy]);
        for (const [i, j] of [[sx - 5, sy - 5], [sx + 5, sy - 5], [sx - 5, sy + 1], [sx + 5, sy + 1], [sx, sy + 9]]) pon(g, R.hierro, 4, [i, j]);
        /* Espada en alto. */
        const tope = Math.max(2, my - (t.bajo ? 15 : 18));
        hoja(g, mx - 1, my - 3, tope);
        pon(g, ACERO, 1, [mx, my - 3]);
        capa().rect(mx - 4, my - 2, 8, 1).on(mx - 4, my - 1).on(mx + 3, my - 1).pintar(g, R.bronce, { relieve: 1, min: 2 });
        pon(g, R.bronce, 4, [mx - 3, my - 2], [mx - 1, my - 2]);
        pon(g, CUERO, 2, [mx - 1, my + 3]);
        capa().rect(mx - 1, my + 4, 2, 2).pintar(g, R.bronce, { relieve: 1, min: 2 });
        pon(g, R.bronce, 4, [mx - 1, my + 4]);
        break;
      }
      case "barbaro": {
        /* Hacha a dos manos: mango con empuñadura de cuero y hoja en media luna. */
        const mango = capa().linea(mx - 1, my + 8, mx + 2, my - 13, 2);
        mango.pintar(g, R.madera, { relieve: 1, min: 2 });
        for (let j = my - 1; j <= my + 5; j += 2) pon(g, CUERO, 1, [mx, j], [mx - 1, j + 1]);
        const hx = mx + 2, hy = my - 13;
        const hj = capa().poly([[hx, hy - 2], [hx + 5, hy - 6], [hx + 8.5, hy - 2], [hx + 9, hy + 3], [hx + 6, hy + 7], [hx + 1, hy + 3]]);
        hj.quitarEll(hx + 1, hy + 0.5, 1.5, 1.6);
        hj.pintar(g, ACERO, { relieve: 2.5, separar: true });
        /* Filo brillante en el borde curvo. */
        for (let j = hy - 6; j <= hy + 7; j++) { let xx = -1; for (let i = hx + 10; i >= hx; i--) if (hj.tiene(i, j)) { xx = i; break; } if (xx > 0) { pon(g, ACERO, 4, [xx, j]); pon(g, ACERO, 3, [xx - 1, j]); } }
        capa().rect(hx - 2, hy - 2, 3, 5).pintar(g, R.hierro, { relieve: 1, separar: true });
        pon(g, R.hierro, 4, [hx - 2, hy - 2]);
        /* Pincho de atrás. */
        capa().poly([[hx - 2, hy - 1], [hx - 5, hy + 0.5], [hx - 2, hy + 2]]).pintar(g, R.hierro, { relieve: 1, separar: true });
        break;
      }
      case "picaro": {
        /* Daga con la punta hacia delante. */
        for (let i = mx + 2; i <= mx + 7; i++) { pon(g, ACERO, 4, [i, my]); pon(g, ACERO, 2, [i, my + 1]); }
        pon(g, ACERO, 3, [mx + 8, my]); pon(g, ACERO, 1, [mx + 7, my + 1]);
        pon(g, R.bronce, 3, [mx + 2, my - 1], [mx + 2, my + 2]); pon(g, R.bronce, 4, [mx + 2, my - 2]); pon(g, R.bronce, 2, [mx + 2, my + 3]);
        pon(g, R.bronce, 3, [mx - 2, my + 1]);
        break;
      }
      case "explorador": {
        /* Arco largo con cuerda y empuñadura forrada. */
        const top = t.torTop - (t.bajo ? 7 : 9), bot = t.torBot + 6;
        const arco = capa().curva(mx + 1, top, mx + 8, my - 1, mx + 1, bot, 2, 2);
        arco.pintar(g, R.madera, { relieve: 1, min: 2 });
        surco(g, R.madera, 4, mx + 2, top + 2, mx + 4, top + 5, R.madera);
        for (let y = top + 1; y <= bot - 1; y++) if (g.rampa(mx + 1, y) !== R.madera) g.set(mx + 1, y, R.hueso[3], R.hueso);
        for (const [i, j] of [[mx + 1, top - 1], [mx + 1, bot + 1]]) pon(g, R.hueso, 4, [i, j]);
        for (let j = my - 2; j <= my + 2; j++) pon(g, CUERO, j % 2 ? 2 : 3, [mx + 4, j], [mx + 5, j]);
        break;
      }
      case "mago": {
        /* Báculo hasta el suelo con un orbe sujeto por garras. */
        const oy = Math.max(4, t.cabY - 9);
        capa().rect(mx, oy + 2, 2, t.suelo - oy - 2).pintar(g, R.madera, { relieve: 1, min: 1 });
        for (let j = oy + 4; j < t.suelo; j += 5) pon(g, R.madera, 1, [mx + 1, j]), pon(g, R.madera, 4, [mx, j - 1]);
        capa().ell(mx + 0.5, oy, 2.6, 2.6).pintar(g, R.mar, { relieve: 2, min: 2 });
        pon(g, R.mar, 4, [mx - 1, oy - 1], [mx, oy - 2]);
        pon(g, R.hueso, 4, [mx - 1, oy - 1]);
        pon(g, R.madera, 3, [mx - 2, oy + 2], [mx + 3, oy + 2], [mx - 2, oy + 1], [mx + 3, oy + 1]);
        pon(g, R.madera, 2, [mx - 1, oy + 3], [mx + 2, oy + 3]);
        break;
      }
      case "brujo": {
        /* Vara corta con un cristal de magia flotante. */
        capa().rect(mx, my - 6, 1, 8).pintar(g, R.madera, { plano: 2 });
        pon(g, R.madera, 3, [mx, my - 6]);
        pon(g, R.bronce, 3, [mx - 1, my - 7], [mx + 1, my - 7]);
        const cy = my - 11;
        capa().poly([[mx + 0.5, cy - 4.5], [mx + 3, cy], [mx + 0.5, cy + 3.5], [mx - 2, cy]]).pintar(g, R.magia, { relieve: 1.6, min: 2 });
        pon(g, R.magia, 4, [mx, cy - 2], [mx - 1, cy - 1], [mx, cy - 1]);
        pon(g, R.magia, 1, [mx + 1, cy + 1], [mx + 1, cy + 2]);
        break;
      }
      case "clerigo": {
        /* Maza de aletas. */
        capa().rect(mx, my - 7, 1, 11).pintar(g, R.madera, { plano: 2 });
        pon(g, R.madera, 3, [mx, my - 6]);
        const cy = my - 9;
        capa().ell(mx + 0.5, cy, 2.2, 2.6).pintar(g, R.hierro, { relieve: 1.5, min: 1, separar: true });
        capa().rect(mx - 3, cy - 1, 1, 3).rect(mx + 3, cy - 1, 1, 3).rect(mx, cy - 4, 2, 1).pintar(g, R.hierro, { relieve: 1, min: 2 });
        pon(g, R.hierro, 4, [mx - 1, cy - 2], [mx, cy - 2]);
        pon(g, R.bronce, 3, [mx, my - 6], [mx, my + 4]);
        break;
      }
      case "bardo": {
        /* Laúd: caja de madera con boca, mástil hacia arriba y clavijero. */
        const lx = mx + 1, ly = my + 3;
        const mast = capa().linea(lx + 2, ly - 2, lx + 8, ly - 9, 2);
        mast.pintar(g, R.madera, { plano: 1 });
        surco(g, R.madera, 3, lx + 2, ly - 3, lx + 7, ly - 9, R.madera);
        capa().rect(lx + 8, ly - 12, 3, 3).pintar(g, R.madera, { relieve: 1, max: 2 });
        pon(g, R.hueso, 4, [lx + 7, ly - 12], [lx + 11, ly - 11], [lx + 9, ly - 13]);
        const caja = capa().ell(lx, ly, 4, 3.4).ell(lx + 2, ly - 1.5, 2.4, 2);
        caja.pintar(g, R.madera, { relieve: 2.5, separar: true });
        capa().ell(lx + 0.5, ly - 0.5, 1, 1).pintar(g, R.madera, { plano: 0 });
        pon(g, R.madera, 1, [lx - 1, ly + 2], [lx, ly + 2]);
        surco(g, R.hueso, 3, lx - 1, ly + 1, lx + 7, ly - 8, null);
        break;
      }
    }
  }

  /* Objetos extra para personajes no jugadores (los mismos que HEROES.OBJETOS_EXTRA, a 48×48). */
  const OBJETOS_EXTRA = {
    martillo(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx, my - 9, 1, 13).pintar(g, R.madera, { plano: 2 });
      capa().rect(mx - 3, my - 13, 7, 5).pintar(g, R.hierro, { relieve: 2, separar: true });
      pon(g, R.hierro, 4, [mx - 3, my - 13], [mx - 2, my - 13]);
    },
    caduceo(g, t) {
      const [mx] = t.mano;
      capa().rect(mx, 6, 2, t.suelo - 6).pintar(g, R.bronce, { relieve: 1, min: 2 });
      capa().ell(mx + 0.5, 5, 1.8, 1.8).pintar(g, R.bronce, { relieve: 1, min: 3 });
      for (let y = 10; y < 24; y++) pon(g, R.hoja, 3, [mx + ((y >> 1) % 2 ? 2 : -1), y]);
      pon(g, R.hueso, 4, [mx - 2, 6], [mx + 3, 6], [mx - 4, 5], [mx + 5, 5]);
      pon(g, R.hueso, 3, [mx - 3, 6], [mx + 4, 6]);
    },
    copa(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx - 2, my - 5, 6, 3).pintar(g, R.oricalco, { relieve: 1, min: 2 });
      pon(g, R.oricalco, 2, [mx, my - 2], [mx + 1, my - 2]);
      pon(g, R.sangre, 3, [mx - 1, my - 5], [mx + 1, my - 5], [mx + 2, my - 5]);
    },
    odre(g, t) {
      const [mx, my] = t.mano;
      capa().ell(mx + 1, my + 2, 4, 3).pintar(g, CUERO, { relieve: 2 });
      pon(g, CUERO, 1, [mx + 5, my + 1]);
    },
    cayado(g, t) {
      const [mx] = t.mano;
      capa().rect(mx, 8, 2, t.suelo - 8).curva(mx, 8, mx + 1, 3, mx + 5, 5, 2, 2).pintar(g, R.madera, { relieve: 1, min: 2 });
    },
    anillo(g, t) {
      const [mx, my] = t.mano;
      pon(g, R.bronce, 4, [mx + 1, my - 3], [mx + 2, my - 4]); pon(g, R.bronce, 3, [mx + 2, my - 3], [mx + 1, my - 4]);
      pon(g, R.hueso, 4, [mx + 4, my - 6], [mx, my - 6]);
    },
    balanza(g, t) {
      const [mx, my] = t.mano;
      capa().rect(mx, my - 8, 1, 8).rect(mx - 4, my - 8, 9, 1).pintar(g, R.bronce, { plano: 3 });
      capa().rect(mx - 5, my - 4, 4, 1).rect(mx + 2, my - 4, 4, 1).pintar(g, R.bronce, { plano: 2 });
    }
  };

  /* ---------- Composición ---------- */
  const PIERNAS = {
    guerrero: { ramPierna: R.hierro, ramBota: R.hierro, rodillera: R.hierro, alto: 6 },
    clerigo: { ramPierna: R.hierro, ramBota: CUERO, alto: 5 },
    picaro: { ramPierna: R.tela.negro, ramBota: CUERO, alto: 6 },
    explorador: { ramPierna: R.madera, ramBota: CUERO, alto: 7 },
    bardo: { ramPierna: R.tela.negro, ramBota: CUERO, alto: 5, puntera: R.bronce },
    barbaro: { ramPierna: null, ramBota: PELLIZA, alto: 6 }
  };

  function componer(a = {}) {
    a = a || {};
    const raza = RAZAS[a.raza] ? a.raza : "humano";
    const vis = RAZAS[raza] || {};
    const clase = a.clase || "guerrero";
    const t = plantilla(a.cuerpo || vis.cuerpo || "normal");
    const piel = R.piel[a.piel] || R.piel[(vis.pieles || [])[0]] || R.piel.clara;
    const ramPelo = R.pelo[a.pelo] || R.pelo[(vis.pelos || [])[0] || "negro"] || R.pelo.negro;
    const tela = R.tela[a.tela] || R.tela[TELA_CLASE[clase]] || R.tela.terracota;
    const peinado = vis.sinPelo ? "rapado" : (PEINADOS.includes(a.peinado) ? a.peinado : "corto");
    const gesto = GESTOS.includes(a.gesto) ? a.gesto : "normal";
    const draco = raza === "draconido";
    const g = new Rejilla(W, H);
    const tapaPelo = ["guerrero", "brujo", "picaro", "explorador", "clerigo"].includes(clase);
    const largas = ["mago", "brujo"].includes(clase);

    cola(g, t, piel, raza);
    espalda(g, t, clase, tela);
    const MANGAS = {
      guerrero: { sup: R.hierro, inf: R.hierro, guante: R.hierro },
      clerigo: { sup: R.hierro, inf: R.hierro, guante: CUERO },
      mago: { sup: tela, inf: tela, ancha: true, ribete: R.bronce },
      brujo: { sup: tela, inf: tela, ancha: true, ribete: R.magia },
      picaro: { sup: tela, inf: tela, guante: CUERO },
      explorador: { sup: tela, inf: piel, brazal: CUERO },
      bardo: { sup: tela, inf: tela },
      barbaro: { sup: piel, inf: piel, brazal: CUERO }
    };
    const manga = MANGAS[clase] || { sup: tela, inf: piel };
    brazoAtras(g, t, piel, manga);
    const descalzo = raza === "mediano" && !["guerrero", "clerigo"].includes(clase);
    const op = Object.assign({ zapato: R.madera }, PIERNAS[clase] || {});
    if (descalzo) op.descalzo = true;
    if (!largas || raza === "satiro") piernas(g, t, piel, raza, ramPelo, op);
    else if (draco) {
      /* Garras asomando bajo la túnica. */
      for (const x0 of [t.pieAtras - 3, t.pieDelante - 1]) {
        capa().rect(x0, t.suelo - 1, 5, 2).pintar(g, piel, { relieve: 1, separar: true });
        pon(g, R.hueso, 4, [x0 + 5, t.suelo]); pon(g, R.hueso, 3, [x0 + 3, t.suelo]);
      }
    } else if (raza === "mediano") piernas(g, t, piel, raza, ramPelo, { descalzo: true });
    else piernas(g, t, piel, raza, ramPelo, { ramPierna: tela, ramBota: R.madera, alto: 3 });
    vestir(g, t, clase, tela, piel);
    if (clase === "clerigo" || clase === "guerrero") malla(g, R.hierro, t.cx - 6, t.pierTop, t.cx + 6, t.suelo - 6);
    if (draco) cabezaDraconido(g, t, piel, gesto);
    else cabeza(g, t, piel);
    if (!draco) pelo(g, t, ramPelo, peinado, raza, tapaPelo);
    if (!draco) oreja(g, t, piel, raza);
    if ((a.barba || vis.barba) && !draco && clase !== "picaro") barba(g, t, ramPelo, !!vis.barba);
    if (!draco) cara(g, t, { piel, raza, gesto, sombra: ["brujo", "picaro", "explorador"].includes(clase), cejas: vis.sinPelo ? null : ramPelo });
    if (clase === "barbaro" && !draco) {
      /* Pintura de guerra en las mejillas. */
      for (const [i, j] of [[t.ojo1, t.ojoY + 2], [t.ojo1 + 1, t.ojoY + 2], [t.ojo1, t.ojoY + 3], [t.ojo2 + 1, t.ojoY + 2]])
        if (g.rampa(i, j) === piel || g.rampa(i, j) === MEJILLA) pon(g, R.sangre, 3, [i, j]);
    }
    tocado(g, t, clase, tela, piel);
    if (!["guerrero", "mago", "bardo"].includes(clase) || raza === "tiefling") cuernos(g, t, raza);
    if (clase === "picaro" && !draco) {
      /* Embozo que tapa nariz y boca. */
      const em = capa().rect(t.cabX - 1, t.ojoY + 2, 10, 5).poly([[t.cabX - 1, t.bocaY + 2], [t.cabX + 8, t.bocaY + 1], [t.cabX + 5, t.bocaY + 4], [t.cabX, t.bocaY + 4]]);
      em.recortar(capa().ell(t.cabX + 1, t.cabY + 1, t.cabRx + 2.4, t.cabRy + 1).rect(t.cabX, t.ojoY + 2, 10, 4));
      em.pintar(g, tela, { relieve: 1.8, separar: true });
      surco(g, tela, 1, t.cabX + 1, t.bocaY, t.cabX + 7, t.bocaY - 1, tela);
      surco(g, tela, 3, t.cabX + 1, t.ojoY + 2, t.cabX + 8, t.ojoY + 2, tela);
    }
    if (a.objeto && OBJETOS_EXTRA[a.objeto]) OBJETOS_EXTRA[a.objeto](g, t);
    else if (a.objeto !== "ninguno") objeto(g, t, clase, tela);
    if (clase === "guerrero" || clase === "clerigo") {
      brazoDelante(g, t, piel, manga);
      /* Hombrera de placas superpuestas. */
      const [hx, hy] = t.hombro;
      const hb = capa().ell(hx, hy, 3.2, 2.6);
      hb.pintar(g, R.hierro, { relieve: 2, separar: true });
      capa().ell(hx + 0.5, hy + 2.5, 2.6, 1.4).pintar(g, R.hierro, { relieve: 1.5, separar: true });
      pon(g, R.hierro, 4, [hx - 1, hy - 1]);
      if (clase === "clerigo") malla(g, R.hierro, hx - 4, hy - 3, hx + 4, hy + 4);
    } else brazoDelante(g, t, piel, manga, a.objeto !== "ninguno" || true);
    if (clase === "bardo") {
      /* Manga abullonada con cuchilladas. */
      const [hx, hy] = t.hombro;
      capa().ell(hx + 0.5, hy + 0.5, 2.6, 2.6).pintar(g, tela, { relieve: 2, separar: true });
      pon(g, R.tela.granate, 3, [hx, hy], [hx, hy + 1]); pon(g, R.tela.granate, 3, [hx + 2, hy + 1]);
    }
    if (a.extras) a.extras.forEach(fn => fn(g, t, { piel, pelo: ramPelo, tela }));
    if (!a.sinContorno) g.contorno();
    return a.espejo ? g.espejo() : g;
  }

  window.HEROES_HD = { W, H, RAZAS, TELA_CLASE, PEINADOS, TELAS, GESTOS, plantilla, componer, OBJETOS_EXTRA };
})();
