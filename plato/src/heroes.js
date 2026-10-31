/* Diálogos y Dados · héroes en pixel art.
   componer(aspecto) devuelve una Rejilla de 36×36 mirando a la derecha.
   aspecto = { raza, clase, piel, pelo, tela, peinado, barba, objeto, extras, espejo, sinContorno } */
const HEROES = (() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, CONTORNO } = PX;

  /* Lo visual de cada raza: silueta y tonos permitidos (el primero es el de por defecto). */
  const RAZAS = {
    humano: { cuerpo: "normal", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["castano", "negro", "cobrizo", "rubio", "canoso"] },
    elfo: { cuerpo: "esbelto", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["rubio", "canoso", "negro", "cobrizo", "castano"] },
    enano: { cuerpo: "ancho", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["cobrizo", "castano", "negro", "canoso", "rubio"], barba: true },
    mediano: { cuerpo: "bajo", pieles: ["clara", "oliva", "morena", "oscura"], pelos: ["castano", "rubio", "cobrizo", "negro", "canoso"] },
    semiorco: { cuerpo: "fornido", pieles: ["verde", "gris", "oliva"], pelos: ["negro", "castano", "canoso"] },
    tiefling: { cuerpo: "normal", pieles: ["roja", "violeta", "azul"], pelos: ["negro", "violeta", "canoso", "cobrizo"] },
    draconido: { cuerpo: "fornido", pieles: ["bronce", "roja", "esmeralda", "plata", "azul"], pelos: [], sinPelo: true },
    satiro: { cuerpo: "normal", pieles: ["oliva", "clara", "morena", "oscura"], pelos: ["castano", "negro", "cobrizo", "rubio", "canoso"] }
  };
  /* Tela por defecto de cada clase. */
  const TELA_CLASE = { filosofo: "azul", guardian: "granate", sofista: "violeta", rapsoda: "terracota", atleta: "blanco", oraculo: "azul", cazadora: "oliva", hechicero: "violeta" };
  const PEINADOS = ["corto", "largo", "recogido", "rizado", "rapado"];
  const TELAS = ["terracota", "azul", "oliva", "violeta", "ocre", "blanco", "granate", "negro"];
  const OJOS = "#1b1210";

  function plantilla(cuerpo) {
    const bajo = cuerpo === "bajo" || cuerpo === "ancho";
    const ancho = { normal: 9, esbelto: 7, fornido: 11, bajo: 9, ancho: 12 }[cuerpo] || 9;
    const t = { cuerpo, bajo, cx: 17, suelo: 34 };
    t.cabX = 17; t.cabY = bajo ? 16 : 10;
    t.cabRx = cuerpo === "fornido" ? 5.6 : 5.2; t.cabRy = bajo ? 5 : 5.4;
    t.ojoY = bajo ? t.cabY - 1 : t.cabY;
    t.torTop = bajo ? 21 : 16;
    t.torBot = bajo ? 28 : 25;
    t.pierTop = t.torBot + 1;
    t.torL = t.cx - Math.floor((ancho - 1) / 2);
    t.torR = t.torL + ancho - 1;
    t.hombro = [t.torR - 1, t.torTop + 1];
    t.codo = [t.torR + 1, t.torTop + (bajo ? 3 : 4)];
    t.mano = [t.torR + 3, t.torTop + (bajo ? 5 : 6)];
    t.hombroAtras = [t.torL + 1, t.torTop + 1];
    t.manoAtras = [t.torL - 1, t.torBot - 2];
    return t;
  }

  /* ---------- Partes del cuerpo ---------- */
  function cabeza(g, t, piel) {
    new Capa().rect(t.cabX - 1, t.cabY + 3, 3, t.torTop - t.cabY - 1).pintar(g, piel, { relieve: 1, max: 2 }); // cuello
    const c = new Capa().ell(t.cabX, t.cabY, t.cabRx, t.cabRy);
    c.on(t.cabX + 6, t.cabY + 1); // nariz
    c.pintar(g, piel, { relieve: 4 });
  }
  function cabezaDraconido(g, t, piel) {
    new Capa().rect(t.cabX - 3, t.cabY + 2, 5, t.torTop - t.cabY).pintar(g, piel, { relieve: 2, max: 2 });
    const c = new Capa().ell(t.cabX - 1, t.cabY, 4.6, 4.8);
    c.poly([[t.cabX + 1, t.cabY - 3], [t.cabX + 5, t.cabY - 2], [t.cabX + 7.5, t.cabY], [t.cabX + 7.5, t.cabY + 2], [t.cabX + 6, t.cabY + 4], [t.cabX + 1, t.cabY + 4.5]]);
    c.pintar(g, piel, { relieve: 3 });
    const cuernos = new Capa().linea(t.cabX - 3, t.cabY - 3, t.cabX - 8, t.cabY - 6, 2).linea(t.cabX - 4, t.cabY, t.cabX - 9, t.cabY - 1, 2);
    cuernos.pintar(g, R.hueso, { relieve: 1, separar: true });
    for (let y = t.cabY - 3; y <= t.cabY + 4; y++) for (let x = t.cabX - 4; x <= t.cabX + 6; x++)
      if ((x + y * 2) % 4 === 0 && g.rampa(x, y) === piel && g.get(x, y) === piel[2]) g.set(x, y, piel[3], piel);
    g.set(t.cabX + 2, t.cabY - 1, R.bronce[4], R.bronce).set(t.cabX + 3, t.cabY - 1, OJOS);
    g.set(t.cabX + 7, t.cabY, OJOS);
    for (let x = t.cabX + 2; x <= t.cabX + 7; x++) g.set(x, t.cabY + 2, piel[1], piel);
  }
  function cara(g, t, piel, raza, enSombra) {
    const y = t.ojoY, x = t.cabX;
    const ceja = enSombra ? piel[0] : piel[1];
    if (raza === "tiefling") {
      g.set(x + 1, y, R.bronce[4]).set(x + 1, y + 1, R.fuego[2]).set(x + 4, y, R.bronce[4]).set(x + 4, y + 1, R.fuego[2]);
    } else {
      const blanco = enSombra ? piel[2] : "#f4ead8";
      g.set(x, y + 1, blanco).set(x + 1, y, OJOS).set(x + 1, y + 1, OJOS);
      g.set(x + 3, y + 1, blanco).set(x + 4, y, OJOS).set(x + 4, y + 1, OJOS);
    }
    g.set(x + 1, y - 1, ceja).set(x + 2, y - 1, ceja).set(x + 4, y - 1, ceja).set(x + 5, y - 1, ceja);
    if (raza === "semiorco") for (let i = x; i <= x + 5; i++) g.set(i, y - 1, piel[0], piel);
    g.set(x + 5, y + 2, piel[1], piel);
    g.set(x + 3, y + 3, piel[1], piel).set(x + 4, y + 3, piel[1], piel);
    if (raza === "semiorco") { g.set(x + 3, y + 2, R.hueso[4], R.hueso); g.set(x + 5, y + 3, R.hueso[4], R.hueso); }
  }
  function oreja(g, t, piel, raza) {
    if (raza === "draconido") return;
    if (raza === "elfo") {
      new Capa().linea(t.cabX - 2, t.cabY + 1, t.cabX - 6, t.cabY - 3, 2).on(t.cabX - 3, t.cabY + 2).pintar(g, piel, { relieve: 1, separar: 2 });
      g.set(t.cabX - 3, t.cabY, piel[1], piel);
      return;
    }
    new Capa().rect(t.cabX - 3, t.cabY, 2, 3).pintar(g, piel, { relieve: 1, separar: 2 });
    g.set(t.cabX - 2, t.cabY + 1, piel[1], piel);
  }
  function cuernos(g, t, raza) {
    if (raza === "tiefling") {
      const c = new Capa().curva(t.cabX + 1, t.cabY - 4, t.cabX, t.cabY - 9, t.cabX - 4, t.cabY - 8, 2.4, 1);
      c.curva(t.cabX - 2, t.cabY - 4, t.cabX - 3, t.cabY - 7, t.cabX - 6, t.cabY - 6, 2, 1);
      c.pintar(g, R.pelo.negro, { relieve: 1, min: 2, separar: true });
    }
    if (raza === "satiro") {
      const c = new Capa().linea(t.cabX + 1, t.cabY - 4, t.cabX, t.cabY - 7, 2).linea(t.cabX - 2, t.cabY - 4, t.cabX - 3, t.cabY - 6, 1);
      c.pintar(g, R.hueso, { relieve: 1, min: 1, separar: true });
    }
  }
  function pelo(g, t, ram, peinado, raza) {
    if (peinado === "rapado") return;
    const c = new Capa().ell(t.cabX - 0.3, t.cabY - 0.6, t.cabRx + 0.8, t.cabRy + 0.6);
    for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++)
      if (x >= t.cabX - 1 && y >= t.ojoY - 1 - (x >= t.cabX + 4 ? 1 : 0)) c.off(x, y);
    c.quitarRect(0, t.cabY + 3, 36, 36);
    if (peinado === "largo") c.poly([[t.cabX - 6, t.cabY - 1], [t.cabX - 1, t.cabY], [t.cabX - 1, t.cabY + 3], [t.cabX - 3, t.torTop + 3], [t.cabX - 7, t.torTop + 2]]);
    if (peinado === "recogido") c.ell(t.cabX - 6, t.cabY - 3, 2.2, 2).curva(t.cabX - 6, t.cabY - 2, t.cabX - 9, t.cabY + 2, t.cabX - 7, t.cabY + 6, 2.5, 1.5);
    if (peinado === "rizado") {
      c.ell(t.cabX - 1, t.cabY - 3.2, t.cabRx + 1.6, 3.4);
      for (let x = t.cabX - 6; x <= t.cabX + 5; x += 3) c.off(x, t.cabY - 7);
      c.ell(t.cabX - 5, t.cabY + 1, 2, 2.2);
      for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (x >= t.cabX - 1 && y >= t.ojoY - 1) c.off(x, y);
    }
    if (raza === "elfo" || raza === "satiro") c.off(t.cabX - 3, t.cabY);
    c.pintar(g, ram, { relieve: 2.5 });
    if (peinado !== "rizado") {
      for (let x = t.cabX - 4; x <= t.cabX + 3; x += 2) { const y = t.cabY - 4; if (g.rampa(x, y) === ram) g.set(x, y, ram[3], ram); }
    } else {
      for (let y = t.cabY - 7; y <= t.cabY; y++) for (let x = t.cabX - 7; x <= t.cabX + 5; x++)
        if (g.rampa(x, y) === ram && (x * 3 + y * 5) % 7 === 0) g.set(x, y, ram[1], ram);
    }
  }
  function barba(g, t, ram, larga) {
    const c = new Capa();
    const y = t.ojoY;
    c.poly([[t.cabX - 1, y + 1.5], [t.cabX + 5.5, y + 2], [t.cabX + 5.5, y + 4], [t.cabX + 3, y + 6.5], [t.cabX, y + 6], [t.cabX - 2, y + 3]]);
    if (larga) c.poly([[t.cabX - 3, y + 3], [t.cabX + 5, y + 3], [t.cabX + 4, t.torTop + 5], [t.cabX + 1, t.torTop + 8], [t.cabX - 2, t.torTop + 5]]);
    c.pintar(g, ram, { relieve: 2, separar: 2 });
    g.set(t.cabX + 3, y + 3, ram[0], ram).set(t.cabX + 4, y + 3, ram[0], ram);
    if (larga) for (let j = y + 5; j < t.torTop + 7; j += 2) g.set(t.cabX + 1, j, ram[1], ram);
  }
  function brazo(g, t, piel, manga, delante) {
    if (delante) {
      const [hx, hy] = t.hombro, [cx, cy] = t.codo, [mx, my] = t.mano;
      const sup = new Capa().linea(hx, hy, cx, cy, 2);
      const inf = new Capa().linea(cx, cy, mx - 1, my, 2);
      sup.pintar(g, manga || piel, { relieve: 1.5, separar: true });
      inf.pintar(g, manga && manga.largo ? manga : piel, { relieve: 1.5, separar: true });
      new Capa().rect(mx - 1, my - 1, 2, 2).pintar(g, piel, { relieve: 1, separar: true });
    } else {
      const [hx, hy] = t.hombroAtras, [mx, my] = t.manoAtras;
      new Capa().linea(hx, hy, mx, my, 2).pintar(g, manga || piel, { relieve: 1.5, max: 2 });
      new Capa().rect(mx - 1, my + 1, 2, 2).pintar(g, piel, { relieve: 1, max: 2 });
    }
  }
  function piernas(g, t, piel, raza, pelo, calzado) {
    const pie = R.madera;
    if (raza === "satiro") {
      new Capa().ell(t.cx - 0.5, t.pierTop + 1.5, 4.2, 2.6).pintar(g, pelo, { relieve: 2 });
      const c = new Capa();
      c.linea(t.cx - 2, t.pierTop + 2, t.cx - 3, t.pierTop + 5, 2).linea(t.cx - 3, t.pierTop + 5, t.cx - 2, t.suelo - 2, 2);
      c.linea(t.cx + 2, t.pierTop + 2, t.cx + 3, t.pierTop + 5, 2).linea(t.cx + 3, t.pierTop + 5, t.cx + 2, t.suelo - 2, 2);
      c.pintar(g, pelo, { relieve: 1.5 });
      new Capa().rect(t.cx - 3, t.suelo - 1, 3, 2).rect(t.cx + 1, t.suelo - 1, 3, 2).pintar(g, R.pelo.negro, { relieve: 1, min: 2 });
      return;
    }
    const c = new Capa();
    c.linea(t.cx - 2, t.pierTop, t.cx - 3, t.suelo - 2, 2);
    c.linea(t.cx + 2, t.pierTop, t.cx + 3, t.suelo - 2, 2);
    c.pintar(g, piel, { relieve: 1.5 });
    const grande = raza === "mediano";
    const p = new Capa().rect(t.cx - 5, t.suelo - 1, grande ? 4 : 3, 2).rect(t.cx + 2, t.suelo - 1, grande ? 5 : 4, 2);
    p.pintar(g, grande ? piel : piel, { relieve: 1 });
    if (!grande) {
      for (let x = t.cx - 5; x <= t.cx + 5; x++) if (g.rampa(x, t.suelo) === piel) g.set(x, t.suelo, pie[2], pie);
      g.set(t.cx - 3, t.suelo - 1, pie[1], pie).set(t.cx + 3, t.suelo - 1, pie[1], pie);
      if (calzado === "alto") for (let y = t.suelo - 5; y < t.suelo - 1; y += 2) { g.set(t.cx - 3, y, pie[2], pie); g.set(t.cx + 3, y, pie[2], pie); }
    } else {
      g.set(t.cx - 4, t.suelo - 1, pelo[2], pelo).set(t.cx + 4, t.suelo - 1, pelo[2], pelo);
    }
  }
  function cola(g, t, piel, raza) {
    if (raza === "tiefling") {
      new Capa().curva(t.torL + 1, t.torBot - 1, t.torL - 7, t.torBot + 7, t.torL - 6, t.torBot - 3, 2, 1.2).pintar(g, piel, { relieve: 1 });
      new Capa().poly([[t.torL - 8, t.torBot - 3], [t.torL - 6, t.torBot - 7], [t.torL - 4, t.torBot - 3]]).pintar(g, piel, { relieve: 1, min: 2 });
    }
    if (raza === "draconido") new Capa().curva(t.torL + 2, t.torBot - 2, t.torL - 3, t.suelo + 1, t.torL - 9, t.suelo - 1, 4.5, 1.5).pintar(g, piel, { relieve: 2 });
  }

  /* ---------- Ropa, tocados y objetos de cada clase ---------- */
  const falda = (t, largo, vuelo) => new Capa().poly([[t.torL, t.torBot - 1], [t.torR + 1, t.torBot - 1], [t.torR + 1 + vuelo, t.pierTop + largo], [t.torL - vuelo, t.pierTop + largo]]);
  const torso = t => new Capa().rect(t.torL, t.torTop, t.torR - t.torL + 1, t.torBot - t.torTop + 1).off(t.torL, t.torTop).off(t.torR, t.torTop);

  function espalda(g, t, clase, tela) {
    if (clase === "cazadora") {
      new Capa().linea(t.torL + 1, t.torTop - 2, t.torL - 1, t.torBot - 2, 3).pintar(g, R.madera, { relieve: 1.5 });
      [[t.torL + 2, t.torTop - 4], [t.torL, t.torTop - 4], [t.torL + 1, t.torTop - 5]].forEach(([x, y], i) => {
        g.set(x, y, i === 2 ? R.tela.granate[3] : R.hueso[4], R.hueso).set(x, y + 1, R.hueso[2], R.hueso);
      });
    }
    if (clase === "rapsoda") new Capa().poly([[t.torL + 1, t.torTop], [t.torL + 3, t.torTop], [t.torL - 1, t.pierTop + 5], [t.torL - 5, t.pierTop + 4]]).pintar(g, tela, { relieve: 2, max: 2 });
    if (clase === "sofista") new Capa().poly([[t.torL + 1, t.torTop], [t.torL + 4, t.torTop], [t.torL + 1, t.torBot + 1], [t.torL - 3, t.torBot]]).pintar(g, tela, { relieve: 2, max: 2 });
  }

  function vestir(g, t, clase, tela, piel) {
    const T = torso(t);
    switch (clase) {
      case "filosofo": {
        T.unir(falda(t, t.suelo - t.pierTop - 2, 2)).pintar(g, tela, { relieve: 3 });
        new Capa().linea(t.torR, t.torTop + 1, t.torL, t.torBot + 2, 1).recortar(T).pintar(g, tela, { plano: 1 });
        new Capa().linea(t.torR - 1, t.torTop + 3, t.torL + 2, t.pierTop + 5, 1).pintar(g, tela, { plano: 1 });
        g.set(t.cx + 1, t.torTop, R.hueso[3], R.hueso).set(t.cx + 2, t.torTop, R.hueso[3], R.hueso);
        break;
      }
      case "guardian": {
        falda(t, 3, 1).pintar(g, tela, { relieve: 2 });
        for (let x = t.torL - 1; x <= t.torR + 1; x += 2) for (let y = t.torBot; y <= t.pierTop + 3; y++) if (g.rampa(x, y) === tela) g.set(x, y, tela[1], tela);
        T.pintar(g, R.bronce, { relieve: 3, separar: true });
        for (let y = t.torTop + 3; y < t.torBot - 1; y++) g.set(t.cx + 1, y, R.bronce[1], R.bronce);
        g.set(t.cx - 1, t.torTop + 4, R.bronce[1], R.bronce).set(t.cx + 3, t.torTop + 4, R.bronce[1], R.bronce);
        for (let x = t.torL; x <= t.torR; x++) g.set(x, t.torBot - 1, R.bronce[1], R.bronce);
        break;
      }
      case "sofista": {
        T.unir(falda(t, 4, 1)).pintar(g, tela, { relieve: 3 });
        for (let x = t.torL - 1; x <= t.torR + 2; x++) if (g.rampa(x, t.pierTop + 4) === tela) g.set(x, t.pierTop + 4, R.bronce[3], R.bronce);
        for (let x = t.cx - 1; x <= t.cx + 2; x++) g.set(x, t.torTop, R.bronce[3], R.bronce);
        g.set(t.cx + 2, t.torTop + 1, R.bronce[4], R.bronce);
        break;
      }
      case "rapsoda": {
        T.unir(falda(t, 4, 1)).pintar(g, tela, { relieve: 3 });
        for (let x = t.torL; x <= t.torR; x++) g.set(x, t.torBot - 3, R.madera[2], R.madera);
        g.set(t.cx + 2, t.torBot - 3, R.bronce[4], R.bronce);
        break;
      }
      case "atleta": {
        T.pintar(g, piel, { relieve: 3 });
        g.set(t.cx - 1, t.torTop + 3, piel[1], piel).set(t.cx, t.torTop + 3, piel[1], piel).set(t.cx + 2, t.torTop + 3, piel[1], piel).set(t.cx + 3, t.torTop + 3, piel[1], piel);
        for (let y = t.torTop + 5; y < t.torBot - 2; y += 2) g.set(t.cx + 1, y, piel[1], piel);
        new Capa().poly([[t.torL, t.torBot - 2], [t.torR + 1, t.torBot - 2], [t.torR + 1, t.pierTop + 1], [t.cx + 1, t.pierTop + 3], [t.torL, t.pierTop + 1]]).pintar(g, tela, { relieve: 2, separar: true });
        break;
      }
      case "oraculo": {
        T.unir(falda(t, t.suelo - t.pierTop - 2, 2)).pintar(g, R.tela.blanco, { relieve: 3 });
        new Capa().linea(t.torR - 1, t.torTop, t.torR - 2, t.suelo - 3, 2).recortar(T.copia().unir(falda(t, t.suelo - t.pierTop - 2, 2))).pintar(g, tela, { relieve: 1 });
        for (let x = t.torL; x <= t.torR; x++) g.set(x, t.torBot - 3, R.bronce[3], R.bronce);
        g.set(t.cx + 1, t.torTop + 3, R.bronce[4], R.bronce).set(t.cx + 1, t.torTop + 2, R.bronce[3], R.bronce);
        break;
      }
      case "cazadora": {
        T.unir(falda(t, 2, 1)).pintar(g, tela, { relieve: 3 });
        new Capa().linea(t.torL + 1, t.torTop, t.torR, t.torBot - 3, 1).recortar(T).pintar(g, R.madera, { plano: 2 });
        for (let x = t.torL; x <= t.torR; x++) g.set(x, t.torBot - 2, R.madera[1], R.madera);
        break;
      }
      case "hechicero": {
        T.unir(falda(t, t.suelo - t.pierTop - 2, 3)).pintar(g, tela, { relieve: 3 });
        for (let y = t.torTop + 2; y < t.suelo - 2; y += 3) g.set(t.cx + 1, y, tela[1], tela);
        for (let x = t.torL; x <= t.torR; x++) g.set(x, t.torBot - 3, R.tela.negro[2], R.tela.negro);
        g.set(t.cx + 2, t.torBot - 2, R.bronce[3], R.bronce).set(t.cx + 2, t.torBot - 1, R.bronce[2], R.bronce);
        break;
      }
      default:
        T.unir(falda(t, 3, 1)).pintar(g, tela, { relieve: 3 });
    }
  }
  /* Grebas de bronce del guardián, encima de las piernas. */
  function grebas(g, t) {
    new Capa().rect(t.cx - 4, t.pierTop + 3, 2, t.suelo - t.pierTop - 4).rect(t.cx + 2, t.pierTop + 3, 2, t.suelo - t.pierTop - 4).pintar(g, R.bronce, { relieve: 1 });
  }

  function tocado(g, t, clase, tela, raza, peinado) {
    const enCorona = (ram, joya) => {
      const c = new Capa();
      for (let x = t.cabX - 5; x <= t.cabX + 3; x++) c.on(x, t.cabY - 4 + (x < t.cabX - 3 ? 1 : 0) + (x > t.cabX + 1 ? 1 : 0));
      c.pintar(g, ram, { relieve: 1, min: 2 });
      for (let x = t.cabX - 4; x <= t.cabX + 2; x += 2) g.set(x, t.cabY - 5 + (x > t.cabX + 1 ? 1 : 0), ram[3], ram);
      if (joya) g.set(t.cabX + 3, t.cabY - 3, joya[4], joya);
    };
    switch (clase) {
      case "guardian": {
        const casco = new Capa().ell(t.cabX - 0.2, t.cabY - 0.8, t.cabRx + 0.9, t.cabRy + 0.4);
        casco.quitarRect(t.cabX, t.cabY - 1, 5, 3);
        casco.off(t.cabX + 3, t.cabY + 4); casco.off(t.cabX + 4, t.cabY + 4);
        casco.quitarRect(0, t.cabY + 5, 36, 36);
        casco.pintar(g, R.bronce, { relieve: 3 });
        for (let y = t.cabY - 1; y <= t.cabY + 2; y++) g.set(t.cabX + 3, y, R.bronce[2], R.bronce);
        new Capa().curva(t.cabX + 3, t.cabY - 6, t.cabX - 3, t.cabY - 11, t.cabX - 9, t.cabY - 1, 3.2, 2.2).pintar(g, R.tela.granate, { relieve: 1.5, separar: true });
        break;
      }
      case "hechicero": {
        const capucha = new Capa().ell(t.cabX - 0.8, t.cabY - 0.4, t.cabRx + 1.3, t.cabRy + 1.2);
        capucha.poly([[t.cabX - 6, t.cabY], [t.cabX - 1, t.cabY + 4], [t.torL, t.torTop + 2], [t.cabX - 8, t.torTop + 1]]);
        for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (x >= t.cabX && y >= t.cabY - 2 && y <= t.cabY + 4) capucha.off(x, y);
        capucha.pintar(g, tela, { relieve: 2.5, separar: true });
        break;
      }
      case "oraculo": {
        const velo = new Capa().ell(t.cabX - 1, t.cabY - 1.2, t.cabRx + 0.6, t.cabRy);
        for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) if (x >= t.cabX - 2 && y >= t.cabY - 3) velo.off(x, y);
        velo.poly([[t.cabX - 6, t.cabY - 2], [t.cabX - 3, t.cabY - 2], [t.cabX - 3, t.torTop + 3], [t.cabX - 8, t.torTop + 4]]);
        velo.pintar(g, tela, { relieve: 2, separar: true });
        enCorona(R.bronce, R.fuego);
        break;
      }
      case "rapsoda":
      case "atleta":
        enCorona(R.hoja);
        break;
      case "sofista":
        for (let x = t.cabX - 4; x <= t.cabX + 3; x++) g.set(x, t.cabY - 3 + (x > t.cabX + 1 ? 1 : 0), R.bronce[3], R.bronce);
        break;
      case "cazadora":
        g.set(t.cabX + 2, t.cabY - 3, R.plata[4], R.plata).set(t.cabX + 1, t.cabY - 4, R.plata[3], R.plata).set(t.cabX + 3, t.cabY - 4, R.plata[3], R.plata);
        break;
    }
  }

  function objeto(g, t, clase, tela) {
    const [mx, my] = t.mano;
    switch (clase) {
      case "filosofo": {
        new Capa().rect(mx - 2, my - 1, 6, 3).pintar(g, R.hueso, { relieve: 1.5 });
        g.set(mx + 3, my - 1, R.hueso[1], R.hueso).set(mx + 3, my, R.hueso[2], R.hueso).set(mx + 3, my + 1, R.hueso[1], R.hueso);
        g.set(mx + 1, my, R.madera[1], R.madera).set(mx + 2, my, R.madera[1], R.madera);
        break;
      }
      case "guardian": {
        new Capa().rect(mx, 3, 1, t.suelo - 3).pintar(g, R.madera, { plano: 2 });
        new Capa().poly([[mx, -0.5], [mx + 1.6, 3.5], [mx - 1.6, 3.5]]).pintar(g, R.bronce, { relieve: 1, min: 2 });
        const cx = t.torR + 1, cy = t.torTop + 6;
        new Capa().ell(cx, cy, 5.6, 6.2).pintar(g, R.bronce, { relieve: 2, separar: true });
        new Capa().ell(cx, cy, 4.4, 5).pintar(g, tela, { relieve: 4 });
        [[0, -2], [-1, -1], [1, -1], [-1, 0], [1, 0], [-2, 1], [2, 1], [-2, 2], [2, 2]].forEach(([a, b]) => g.set(cx + a, cy + b, R.hueso[4], R.hueso));
        break;
      }
      case "sofista": {
        new Capa().ell(mx + 1, my + 2.5, 2, 2.2).on(mx + 1, my).pintar(g, R.tela.ocre, { relieve: 2 });
        g.set(mx + 1, my + 1, R.madera[1], R.madera).set(mx + 2, my + 2, R.bronce[4], R.bronce);
        break;
      }
      case "rapsoda": {
        const marco = new Capa().curva(mx - 1, my + 1, mx - 3, my - 3, mx - 1, my - 6, 2, 1.5).curva(mx + 3, my + 1, mx + 5, my - 3, mx + 3, my - 6, 2, 1.5);
        marco.linea(mx - 1, my - 6, mx + 3, my - 6, 1);
        marco.pintar(g, R.bronce, { relieve: 1, min: 2 });
        for (let y = my - 5; y <= my; y++) { g.set(mx, y, R.hueso[4]); g.set(mx + 2, y, R.hueso[4]); }
        new Capa().ell(mx + 1, my + 2, 2.6, 1.6).pintar(g, R.madera, { relieve: 1.5, separar: true });
        break;
      }
      case "atleta": {
        new Capa().rect(mx - 1, my - 1, 3, 3).pintar(g, R.hueso, { relieve: 1 });
        break;
      }
      case "oraculo": {
        new Capa().rect(mx, 6, 1, t.suelo - 6).pintar(g, R.madera, { plano: 2 });
        new Capa().ell(mx, 4, 2.3, 2.3).pintar(g, R.bronce, { relieve: 2, min: 2 });
        [[0, -4], [0, 8], [-4, 4], [4, 4], [-3, 1], [3, 1]].forEach(([a, b]) => g.set(mx + a, b, R.bronce[4], R.bronce));
        g.set(mx, 4, R.fuego[4], R.fuego);
        break;
      }
      case "cazadora": {
        new Capa().curva(mx + 1, t.torTop - 4, mx + 6, my, mx + 1, t.torBot + 4, 1.6, 1.6).pintar(g, R.madera, { relieve: 1, min: 2 });
        for (let y = t.torTop - 3; y <= t.torBot + 3; y++) if (!g.get(mx + 1, y) || g.rampa(mx + 1, y) !== R.madera) g.set(mx + 1, y, R.hueso[3], R.hueso);
        break;
      }
      case "hechicero": {
        new Capa().rect(mx, my - 4, 1, 6).pintar(g, R.madera, { plano: 2 });
        new Capa().ell(mx, my - 6.5, 1.8, 2.6).on(mx, my - 9.5).pintar(g, R.magia, { relieve: 1.5, min: 2 });
        g.set(mx, my - 6, R.magia[4], R.magia).set(mx, my - 5, R.magia[4], R.magia);
        break;
      }
    }
    return [mx, my];
  }

  /* Objetos extra para personajes no jugadores (los dibuja el bestiario). */
  const OBJETOS_EXTRA = {
    martillo(g, t) {
      const [mx, my] = t.mano;
      new Capa().rect(mx, my - 7, 1, 9).pintar(g, R.madera, { plano: 2 });
      new Capa().rect(mx - 2, my - 10, 5, 4).pintar(g, R.hierro, { relieve: 1.5 });
    },
    caduceo(g, t) {
      const [mx, my] = t.mano;
      new Capa().rect(mx, 5, 1, t.suelo - 5).pintar(g, R.bronce, { plano: 3 });
      new Capa().ell(mx, 4, 1.4, 1.4).pintar(g, R.bronce, { relieve: 1, min: 3 });
      for (let y = 8; y < 18; y++) g.set(mx + ((y >> 1) % 2 ? 1 : -1), y, R.hoja[3], R.hoja);
      g.set(mx - 2, 5, R.hueso[4]).set(mx + 2, 5, R.hueso[4]).set(mx - 3, 4, R.hueso[3]).set(mx + 3, 4, R.hueso[3]);
    },
    copa(g, t) {
      const [mx, my] = t.mano;
      new Capa().rect(mx - 2, my - 3, 5, 2).pintar(g, R.oricalco, { relieve: 1, min: 2 });
      g.set(mx, my - 1, R.oricalco[2], R.oricalco).set(mx - 1, my - 4, R.sangre[3], R.sangre).set(mx + 1, my - 4, R.sangre[3], R.sangre);
    },
    odre(g, t) {
      const [mx, my] = t.mano;
      new Capa().ell(mx + 1, my + 1, 3, 2.4).pintar(g, R.madera, { relieve: 2 });
      g.set(mx + 4, my, R.madera[1], R.madera);
    },
    cayado(g, t) {
      const [mx, my] = t.mano;
      new Capa().rect(mx, 6, 1, t.suelo - 6).curva(mx, 6, mx + 1, 2, mx + 4, 4, 1, 1).pintar(g, R.madera, { relieve: 1, min: 2 });
    },
    anillo(g, t) {
      const [mx, my] = t.mano;
      g.set(mx + 1, my - 2, R.bronce[4], R.bronce).set(mx + 2, my - 2, R.bronce[3], R.bronce).set(mx + 1, my - 3, R.bronce[3], R.bronce).set(mx + 2, my - 3, R.bronce[4], R.bronce);
      g.set(mx + 3, my - 4, R.hueso[4]).set(mx, my - 4, R.hueso[4]);
    },
    balanza(g, t) {
      const [mx, my] = t.mano;
      new Capa().rect(mx, my - 6, 1, 6).rect(mx - 3, my - 6, 7, 1).pintar(g, R.bronce, { plano: 3 });
      new Capa().rect(mx - 4, my - 3, 3, 1).rect(mx + 2, my - 3, 3, 1).pintar(g, R.bronce, { plano: 2 });
    }
  };

  function componer(a = {}) {
    const raza = RAZAS[a.raza] ? a.raza : "humano";
    const vis = RAZAS[raza];
    const clase = a.clase || "filosofo";
    const t = plantilla(a.cuerpo || vis.cuerpo);
    const piel = R.piel[a.piel] || R.piel[vis.pieles[0]];
    const ramPelo = R.pelo[a.pelo] || R.pelo[vis.pelos[0] || "negro"];
    const tela = R.tela[a.tela] || R.tela[TELA_CLASE[clase]] || R.tela.terracota;
    const peinado = vis.sinPelo ? "rapado" : (a.peinado || "corto");
    const g = new Rejilla(36, 36);
    const tapaPelo = clase === "guardian" || clase === "hechicero";

    cola(g, t, piel, raza);
    espalda(g, t, clase, tela);
    const manga = ["filosofo", "oraculo", "hechicero"].includes(clase) ? (clase === "oraculo" ? R.tela.blanco : tela) : null;
    brazo(g, t, piel, manga, false);
    const largas = ["filosofo", "oraculo", "hechicero"].includes(clase);
    if (!largas || raza === "satiro") piernas(g, t, piel, raza, ramPelo, clase === "cazadora" ? "alto" : null);
    else {
      const pies = new Capa().rect(t.cx - 5, t.suelo - 1, 3, 2).rect(t.cx + 2, t.suelo - 1, 4, 2);
      pies.pintar(g, raza === "draconido" ? piel : R.madera, { relieve: 1 });
    }
    if (clase === "guardian" && raza !== "satiro") grebas(g, t);
    vestir(g, t, clase, tela, piel);
    if (raza === "draconido") cabezaDraconido(g, t, piel);
    else cabeza(g, t, piel);
    if (!tapaPelo) pelo(g, t, ramPelo, peinado, raza);
    if (raza !== "draconido") oreja(g, t, piel, raza);
    if ((a.barba || vis.barba) && raza !== "draconido" && clase !== "guardian") barba(g, t, ramPelo, !!vis.barba);
    tocado(g, t, clase, tela, raza, peinado);
    if (clase !== "guardian") cuernos(g, t, raza);
    else if (raza === "tiefling") cuernos(g, t, raza);
    if (raza !== "draconido") cara(g, t, piel, raza, clase === "hechicero");
    if (a.objeto && OBJETOS_EXTRA[a.objeto]) OBJETOS_EXTRA[a.objeto](g, t);
    else if (a.objeto !== "ninguno") objeto(g, t, clase, tela);
    brazo(g, t, piel, manga, true);
    if (clase === "atleta") new Capa().rect(t.mano[0] - 1, t.mano[1] - 1, 2, 2).pintar(g, R.hueso, { relieve: 1, separar: true });
    if (a.extras) a.extras.forEach(fn => fn(g, t, { piel, pelo: ramPelo, tela }));
    if (!a.sinContorno) g.contorno();
    return a.espejo ? g.espejo() : g;
  }

  return { RAZAS, TELA_CLASE, PEINADOS, TELAS, plantilla, componer, OBJETOS_EXTRA };
})();
