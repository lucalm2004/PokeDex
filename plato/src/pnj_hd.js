/* Dados y Mazmorras · personajes no jugadores y mascotas en alta definición.
   PNJ_HD: rejillas de 48×48 mirando a la IZQUIERDA (hacia los héroes), con los pies en la fila 46.
   MASCOTAS_HD: bichos pequeños (de 18 a 26 píxeles de alto) mirando a la DERECHA, abajo en el centro,
   con las patas en la fila 46. Todo se dibuja aquí mismo, sin depender de otros archivos HD;
   la luz viene de arriba a la izquierda y cada llamada devuelve una Rejilla nueva y siempre igual. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R } = PX;
  const W = 48, H = 48;
  const NEGRO = R.pelo.negro, HUESO = R.hueso;
  const OJOS = "#1b1210", BLANCO = "#f4ead8", BRILLO = "#ffffff";

  /* Rampas propias (5 tonos, de la sombra al brillo). */
  const CUERO = ["#1e110b", "#3a2216", "#5c3822", "#87552f", "#b07a48"];
  const HOLLIN = ["#0b0807", "#18120f", "#28201c", "#3c302a", "#574740"];
  const CENIZA = ["#2a2624", "#4a4440", "#6e6762", "#97908a", "#c4bdb6"];
  const ESPECTRO = ["#1e2c3c", "#3c5a74", "#6a92ae", "#9cc2d8", "#d8eef6"];
  const ALMA = ["#123a4a", "#2a7a94", "#5cc4dc", "#a8f0ff", "#f0ffff"];
  const FATUO = ["#0d3842", "#1a6f7c", "#3fb4bf", "#93ebe8", "#e8fffb"];
  const LIMO = ["#0f2a14", "#1d4a22", "#2f7a32", "#55b04a", "#9ae07a"];
  const ROSA = ["#5a1830", "#8e2c4c", "#c8506e", "#ef8aa0", "#ffd0da"];
  const SAVIA = ["#24331c", "#40582e", "#6a8a48", "#98b86a", "#c8e09a"];
  const FRONDA = ["#0c1c0e", "#183618", "#275a26", "#3f8438", "#6eb04e"];
  const CUERNO = ["#1a1220", "#33263a", "#4f3f58", "#76647e", "#a592a8"];

  /* ---------- Utilidades ---------- */
  const capa = () => new Capa(W, H);
  const cada = f => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f(x, y); };
  /* Varios píxeles del mismo tono de una rampa. */
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Solo donde ya hay algo de cierta rampa (para marcar detalles sin salirse). */
  const ponSi = (g, sobre, ram, i, ...pts) => { for (const [x, y] of pts) if (g.rampa(x, y) === sobre) g.set(x, y, ram[i], ram); return g; };
  /* Pinta una capa solo donde aún no hay nada, como si quedara detrás. */
  function detras(g, c, ram, op) {
    cada((x, y) => { if (g.get(x, y)) c.off(x, y); });
    return c.pintar(g, ram, op);
  }
  /* Rellena una capa con un degradado tramado entre dos tonos; f(x, y) va de 0 a 1. */
  function tramar(g, c, ram, i0, i1, f) {
    cada((x, y) => { if (c.tiene(x, y)) g.set(x, y, ram[f(x, y) > PX.umbral(x, y) ? i1 : i0], ram); });
  }
  /* Línea fina sin contorno: solo pinta los píxeles vacíos. */
  function hilo(g, x0, y0, x1, y1, color, ram = null) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (!g.get(x, y)) g.set(x, y, color, ram);
    }
  }
  /* Destello de cuatro puntas, sin contorno. */
  const destello = (g, x, y, ram = R.bronce) => {
    pon(g, ram, 4, [x, y]);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { if (!g.get(x + a, y + b)) pon(g, ram, 3, [x + a, y + b]); });
  };
  /* Píxel suelto solo si el hueco está libre (chispas, motas, burbujas). */
  const mota = (g, ram, i, x, y) => { if (!g.get(x, y)) pon(g, ram, i, [x, y]); };
  /* Borde iluminado arriba a la izquierda: lo muy oscuro se sigue leyendo sobre fondos oscuros. */
  function bordeLuz(g, ram, tono = 3) {
    const borde = [];
    cada((x, y) => {
      if (g.rampa(x, y) === ram && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < tono) borde.push([x, y]);
    });
    pon(g, ram, tono, ...borde);
  }
  /* Ojo expresivo de 2×3: párpado oscuro arriba, brillo a la izquierda, iris abajo. */
  function ojo(g, x, y, iris, op = {}) {
    const osc = op.oscuro || OJOS;
    g.set(x, y, osc).set(x + 1, y, osc);
    g.set(x, y + 1, op.brillo || BRILLO).set(x + 1, y + 1, osc);
    g.set(x, y + 2, iris).set(x + 1, y + 2, op.iris2 || iris);
    if (op.blanco) g.set(x + 2, y + 1, op.blanco).set(x + 2, y + 2, op.blanco);
  }
  /* Ala de murciélago: membrana entre la raíz, el codo y las puntas, con los dedos marcados. */
  function alaMembrana(g, raiz, codo, puntas, base, ramM, opM, ramH) {
    capa().poly([raiz, codo, ...puntas, base]).pintar(g, ramM, opM);
    const h = capa().linea(raiz[0], raiz[1], codo[0], codo[1], 2);
    puntas.forEach(([x, y]) => h.linea(codo[0], codo[1], x, y, 1));
    h.pintar(g, ramH, { relieve: 1, min: 2, max: 3 });
    pon(g, HUESO, 3, [Math.round(codo[0]), Math.round(codo[1]) - 1]);
  }

  /* ---------- Cuerpo humanoide (mirando a la izquierda) ---------- */
  function plantilla(tipo) {
    const bajo = tipo === "bajo" || tipo === "ancho";
    const ancho = { normal: 12, esbelto: 10, fornido: 16, bajo: 12, ancho: 16 }[tipo] || 12;
    const t = { tipo, bajo, cx: 24, suelo: 46 };
    t.cabX = 23; t.cabY = bajo ? 21 : 13;
    t.cabRx = tipo === "fornido" ? 7.2 : 6.8; t.cabRy = bajo ? 6.6 : 7;
    t.ojoY = t.cabY + 1;
    t.torTop = bajo ? 28 : 21;
    t.torBot = bajo ? 39 : 34;
    t.pierTop = t.torBot + 1;
    t.torL = t.cx - Math.floor(ancho / 2);
    t.torR = t.torL + ancho - 1;
    return t;
  }
  /* Cuello, cabeza redonda y nariz que asoma hacia la izquierda. */
  function cabeza(g, t, piel, nariz = 1) {
    capa().rect(t.cabX - 1, t.cabY + 4, 5, t.torTop - t.cabY - 3).pintar(g, piel, { relieve: 1, max: 2 });
    const c = capa().ell(t.cabX, t.cabY, t.cabRx, t.cabRy);
    const nx = Math.round(t.cabX - t.cabRx);
    c.rect(nx - nariz, t.ojoY + 2, nariz + 1, 2).on(nx, t.ojoY + 1);
    c.pintar(g, piel, { relieve: 5 });
    pon(g, piel, 1, [nx + 1, t.ojoY + 4]);
    pon(g, piel, 4, [nx - nariz, t.ojoY + 2]);
  }
  /* Cara: dos ojos, cejas, boca y mejilla. El ojo de delante queda junto a la nariz. */
  function cara(g, t, piel, op = {}) {
    const x = t.cabX, y = t.ojoY;
    const iris = op.iris || R.pelo.castano[2];
    ojo(g, x - 5, y, iris, { brillo: op.brillo, oscuro: op.oscuro, iris2: op.iris2 });
    ojo(g, x - 1, y, iris, { brillo: op.brillo, oscuro: op.oscuro, iris2: op.iris2, blanco: op.sinBlanco ? null : BLANCO });
    const ceja = op.ceja || piel;
    if (!op.sinCejas) pon(g, ceja, 1, [x - 6, y - 2], [x - 5, y - 2], [x - 4, y - 2], [x - 1, y - 2], [x, y - 2], [x + 1, y - 2]);
    if (!op.sinBoca) pon(g, piel, 1, [x - 5, y + 5], [x - 4, y + 5], [x - 3, y + 5]);
    if (!op.sinBoca) pon(g, piel, 0, [x - 4, y + 5]);
    if (op.mejilla !== false) pon(g, R.piel.roja, 4, [x + 1, y + 4], [x + 2, y + 4]);
  }
  function oreja(g, t, piel, punta = 0) {
    const x = t.cabX + 3, y = t.ojoY;
    const c = capa().ell(x + 0.5, y + 1.5, 1.4, 2.2);
    if (punta) c.linea(x + 1, y, x + 1 + punta, y - punta - 1, 2);
    c.pintar(g, piel, { relieve: 1.2, separar: 2 });
    pon(g, piel, 1, [x, y + 1], [x, y + 2]);
  }
  /* Piernas con botas; las puntas de los pies miran a la izquierda. */
  function piernas(g, t, ramP, ramB, op = {}) {
    const { cx, pierTop: p, suelo: s } = t;
    const alto = op.botaAlta ? 7 : 5;
    capa().rect(cx + 1, p, 4, s - p).pintar(g, ramP, { relieve: 1.5, max: 2 });
    capa().rect(cx - 5, p, 4, s - p).pintar(g, ramP, { relieve: 1.5, separar: true });
    capa().rect(cx + 1, s - alto + 1, 4, alto - 2).rect(cx - 1, s - 1, 6, 2).pintar(g, ramB, { relieve: 1.2, max: 2, separar: true });
    capa().rect(cx - 5, s - alto + 1, 4, alto - 2).rect(cx - 7, s - 1, 6, 2).pintar(g, ramB, { relieve: 1.2, separar: true });
    for (let i = cx - 7; i <= cx + 4; i++) if (g.rampa(i, s) === ramB) pon(g, ramB, 0, [i, s]);
    pon(g, ramB, 4, [cx - 6, s - 1], [cx - 5, s - alto + 1]);
    pon(g, ramB, 3, [cx, s - 1]);
  }
  /* Brazo en dos tramos (hombro → codo → mano). «atras» lo deja en sombra. */
  function brazo(g, [[hx, hy], [cx, cy], [mx, my]], manga, piel, op = {}) {
    const o = op.atras ? { relieve: 1.5, max: 2 } : { relieve: 1.5, separar: true };
    capa().linea(hx, hy, cx, cy, op.grueso || 3).pintar(g, manga || piel, o);
    capa().linea(cx, cy, mx, my, op.fino || 3).pintar(g, op.largo ? manga : piel, o);
    if (op.puno) capa().linea(cx, cy, cx + (mx - cx) * 0.25, cy + (my - cy) * 0.25, 3).pintar(g, op.puno, o);
    if (!op.sinMano) capa().ell(mx, my, 1.6, 1.6).pintar(g, piel, { ...o, relieve: 1.2 });
  }
  const torso = t => capa().rect(t.torL, t.torTop + 2, t.torR - t.torL + 1, t.torBot - t.torTop - 1)
    .ell(t.torL + 2.5, t.torTop + 2.5, 2.6, 2.4).ell(t.torR - 2.5, t.torTop + 2.5, 2.6, 2.4).rect(t.torL + 2, t.torTop, t.torR - t.torL - 3, 3);
  const falda = (t, largo, vuelo) => capa().poly([[t.torL, t.torBot - 2], [t.torR + 1, t.torBot - 2], [t.torR + 1 + vuelo, t.pierTop + largo], [t.torL - vuelo, t.pierTop + largo]]);
  function cinturon(g, t, y, ram = CUERO, hebilla = R.bronce) {
    for (let x = t.torL - 2; x <= t.torR + 2; x++) {
      if (!g.get(x, y) || !g.get(x, y + 1)) continue;
      g.set(x, y, ram[2], ram).set(x, y + 1, ram[1], ram);
    }
    pon(g, hebilla, 4, [t.torL + 2, y]); pon(g, hebilla, 3, [t.torL + 3, y], [t.torL + 2, y + 1]); pon(g, hebilla, 2, [t.torL + 3, y + 1]);
  }
  /* Pliegues verticales de tela: oscurece algunas columnas. */
  function pliegues(g, ram, xs, y0, y1, tono = 1) {
    for (const x of xs) for (let y = y0; y <= y1; y++) if (g.rampa(x, y) === ram && ram.indexOf(g.get(x, y)) > tono) g.set(x, y, ram[tono], ram);
  }

  /* ---------- Personajes no jugadores ---------- */

  /* Tabernero: grandote, calvo con flequillo castaño detrás, bigotazo, nariz colorada, camisa ocre
     remangada, delantal blanco con bolsillo, trapo al hombro y una jarra de cerveza con espuma. */
  function tabernero() {
    const g = new Rejilla(W, H), t = plantilla("fornido");
    const P = R.piel.clara, Pe = R.pelo.castano, T = R.tela.ocre, B = R.tela.blanco;
    t.cabX = 22;
    /* Brazo de atrás, con la mano en la cadera. */
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 2, t.torTop + 8], [t.torR + 1, t.torTop + 12]], T, P, { atras: true, puno: T });
    piernas(g, t, R.pelo.castano, CUERO);
    /* Torso con barriga hacia delante. */
    const cuerpo = torso(t).ell(t.torL + 4, t.torTop + 9, 6, 5.5);
    cuerpo.pintar(g, T, { relieve: 4 });
    pliegues(g, T, [t.torR - 3], t.torTop + 4, t.torBot - 3);
    /* Delantal: del pecho a las rodillas, con tirantes y bolsillo. */
    const del = capa().poly([[t.torL + 1, t.torTop + 4], [t.torR - 3, t.torTop + 4], [t.torR - 1, t.pierTop + 6], [t.torL - 3, t.pierTop + 6]]).ell(t.torL + 4, t.torTop + 10, 5.6, 5);
    del.quitarRect(0, 0, W, t.torTop + 4);
    del.pintar(g, B, { relieve: 3, separar: true });
    for (const x of [t.torL + 2, t.torR - 4]) capa().linea(x, t.torTop, x, t.torTop + 4, 2).pintar(g, B, { relieve: 1, separar: true });
    pliegues(g, B, [t.torL + 2, t.torR - 3], t.pierTop, t.pierTop + 5);
    cinturon(g, t, t.torBot - 3, R.madera, R.madera);
    capa().rect(t.torL + 6, t.torBot, 5, 4).pintar(g, B, { relieve: 1, max: 2, separar: true });
    pon(g, B, 1, ...[0, 1, 2, 3, 4].map(i => [t.torL + 6 + i, t.torBot]));
    capa().linea(t.torR - 2, t.torBot - 2, t.torR, t.torBot + 2, 2).pintar(g, B, { relieve: 1, max: 3, separar: true });
    /* Cabeza calva: corona de pelo detrás y patillas. */
    cabeza(g, t, P, 2);
    const fleco = capa().ell(t.cabX + 1, t.cabY + 0.6, t.cabRx + 0.7, t.cabRy - 0.2);
    cada((x, y) => { if (x < t.cabX + 5 || y < t.cabY - 3 || y > t.cabY + 5) fleco.off(x, y); });
    fleco.rect(t.cabX + 1, t.ojoY - 1, 2, 5);
    fleco.pintar(g, Pe, { relieve: 1.6, separar: true });
    oreja(g, t, P);
    pon(g, P, 4, [t.cabX - 3, t.cabY - 5], [t.cabX - 2, t.cabY - 5], [t.cabX - 4, t.cabY - 4], [t.cabX - 1, t.cabY - 6]);
    cara(g, t, P, { ceja: Pe, sinBoca: true });
    /* Bigotazo con las puntas caídas y nariz roja. */
    const x = t.cabX, y = t.ojoY;
    capa().poly([[x - 7, y + 3.5], [x - 1, y + 3.5], [x + 0.5, y + 6.5], [x - 2, y + 5], [x - 4, y + 5.2], [x - 6, y + 5], [x - 8.5, y + 6.5]]).pintar(g, Pe, { relieve: 1.5, separar: 2 });
    pon(g, Pe, 4, [x - 5, y + 3], [x - 4, y + 3]);
    pon(g, R.piel.roja, 3, [x - 8, y + 2], [x - 7, y + 2], [x - 8, y + 3]);
    pon(g, R.piel.roja, 4, [x - 8, y + 2]);
    pon(g, P, 1, [x - 4, y + 7], [x - 3, y + 7]);
    /* Trapo al hombro de atrás. */
    const trapo = capa().rect(t.torR - 5, t.torTop - 1, 5, 3).rect(t.torR - 2, t.torTop + 2, 3, 6);
    trapo.pintar(g, B, { relieve: 1.2, min: 2, separar: true });
    cada((i, j) => { if (trapo.tiene(i, j) && (i + j) % 3 === 0) pon(g, R.tela.granate, 3, [i, j]); });
    /* Brazo de delante con la jarra. */
    const [mx, my] = [t.torL - 3, t.torTop + 9];
    brazo(g, [[t.torL + 3, t.torTop + 3], [t.torL + 1, t.torTop + 8], [mx + 1, my]], T, P, { puno: T });
    const jarra = capa().rect(mx - 5, my - 5, 6, 8);
    jarra.pintar(g, R.madera, { relieve: 2, separar: true });
    for (let i = mx - 5; i <= mx; i++) pon(g, R.hierro, i === mx - 5 ? 4 : i === mx ? 1 : 2, [i, my - 4], [i, my + 1]);
    for (let j = my - 3; j <= my; j++) pon(g, R.madera, 1, [mx - 3, j]), pon(g, R.madera, 3, [mx - 4, j]);
    capa().ell(mx - 2, my - 5.6, 3.8, 1.3).ell(mx - 4, my - 6.6, 1.4, 1).pintar(g, HUESO, { relieve: 1, min: 3, separar: true });
    pon(g, HUESO, 2, [mx - 5, my - 4], [mx - 5, my - 3]);
    capa().ell(mx + 1.5, my - 1, 1.6, 1.6).pintar(g, P, { relieve: 1, separar: true });
    bordeLuz(g, Pe, 2);
    return g.contorno();
  }

  /* Forastero (Ascua): guía encapuchada que huele a ceniza. Capa de hollín hasta el suelo, la cara en
     sombra con dos ojos dorados que brillan, el bajo de la capa con brasas vivas y motas de ceniza. */
  function forastero() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const P = R.piel.morena, C = HOLLIN, F = R.fuego, O = R.bronce;
    const x = t.cabX, y = t.ojoY;
    piernas(g, t, R.tela.negro, CUERO);
    /* Capa: de los hombros al bajo, con vuelo y el borde deshilachado. */
    const manto = capa().poly([[t.torL - 1, t.torTop + 1], [t.torR + 2, t.torTop + 1], [t.torR + 6, t.suelo - 3], [t.torR + 3, t.suelo - 2], [t.cx + 1, t.suelo - 3], [t.torL - 2, t.suelo - 2], [t.torL - 5, t.suelo - 3]]);
    manto.ell(t.torR - 1, t.torTop + 3, 4.4, 4).ell(t.torL + 1.5, t.torTop + 3, 3.6, 4);
    for (const [i, j] of [[t.torL - 1, t.suelo - 2], [t.cx + 3, t.suelo - 2], [t.torR + 4, t.suelo - 2], [t.torL + 4, t.suelo - 3]]) manto.restar(capa().poly([[i - 1.4, j + 1], [i, j - 1.5], [i + 1.4, j + 1]]));
    manto.pintar(g, C, { relieve: 4 });
    pliegues(g, C, [t.torL + 1, t.cx + 1, t.torR + 1], t.torBot - 6, t.suelo - 3, 1);
    pliegues(g, C, [t.torR + 3, t.cx + 2], t.torBot - 1, t.suelo - 4, 0);
    /* Capucha con la punta caída hacia atrás y esclavina sobre los hombros. */
    const capu = capa().ell(x + 0.8, t.cabY - 0.2, t.cabRx + 1.8, t.cabRy + 1.4).poly([[x + 2, t.cabY - 7.4], [x + 11, t.cabY - 1], [x + 7, t.cabY + 5]]);
    capu.poly([[x - 8, t.cabY + 3], [x + 8, t.cabY + 3], [x + 11, t.torTop + 5], [x - 8, t.torTop + 5]]);
    capu.pintar(g, C, { relieve: 4, separar: true });
    for (let i = x - 8; i <= x + 11; i++) if (g.rampa(i, t.torTop + 5) === C && g.rampa(i, t.torTop + 6) === C) pon(g, C, 0, [i, t.torTop + 6]);
    /* Hueco de la cara, en sombra; solo asoma la barbilla, con un reflejo cálido de brasa. */
    const hueco = capa().ell(x - 3.4, y + 1.2, 3.8, 4.8);
    hueco.pintar(g, R.sombra, { plano: 1 });
    cada((i, j) => { if (hueco.tiene(i, j) && (!hueco.tiene(i - 1, j) || !hueco.tiene(i, j - 1)) && j < y + 4) pon(g, R.sombra, 0, [i, j]); });
    capa().ell(x - 4.4, y + 5.4, 2.4, 1.2).recortar(hueco).pintar(g, P, { relieve: 1, max: 2 });
    pon(g, F, 0, [x - 6, y + 5], [x - 5, y + 6]);
    pon(g, P, 3, [x - 7, y + 5]);
    /* Ojos dorados: dos rendijas de oro que brillan desde dentro. */
    pon(g, O, 4, [x - 6, y], [x - 5, y], [x - 2, y], [x - 1, y]);
    pon(g, F, 3, [x - 6, y + 1], [x - 5, y + 1], [x - 2, y + 1], [x - 1, y + 1]);
    pon(g, F, 1, [x - 5, y + 2], [x - 1, y + 2]);
    /* Borde de la capucha alrededor de la cara. */
    cada((i, j) => {
      if (g.rampa(i, j) !== C || i > x + 2) return;
      const junto = [[1, 0], [0, 1], [1, 1], [0, -1], [-1, 0]].some(([a, b]) => hueco.tiene(i + a, j + b));
      if (junto) pon(g, j > y + 2 ? F : C, j > y + 2 ? 0 : 4, [i, j]);
    });
    /* Broche de bronce con una brasa dentro. */
    const bx = t.torL + 2, by = t.torTop + 5;
    capa().ell(bx, by, 1.6, 1.6).pintar(g, O, { relieve: 1, min: 2, separar: true });
    pon(g, F, 4, [bx, by]); pon(g, F, 2, [bx + 1, by]); pon(g, O, 4, [bx - 1, by - 1]);
    /* Brazo que asoma de la capa con un mapa enrollado y lacrado. */
    const [mx, my] = [t.torL - 4, t.torTop + 12];
    brazo(g, [[t.torL + 2, t.torTop + 7], [t.torL, t.torTop + 10], [mx + 1, my]], C, P, { largo: true, sinMano: true, grueso: 4 });
    const rollo = capa().rect(mx - 6, my - 2, 9, 3);
    rollo.pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    pon(g, HUESO, 1, [mx - 6, my - 1], [mx - 6, my], [mx + 2, my]);
    pon(g, HUESO, 4, [mx - 5, my - 2], [mx - 4, my - 2], [mx - 1, my - 2]);
    pon(g, R.sangre, 3, [mx - 2, my - 1]); pon(g, R.sangre, 4, [mx - 2, my - 2]); pon(g, R.sangre, 2, [mx - 1, my - 1], [mx - 2, my]);
    capa().ell(mx + 1.5, my - 0.5, 1.6, 1.6).pintar(g, P, { relieve: 1, separar: true });
    /* Brasas en el bajo: el borde de abajo se enciende y el calor sube tramado. */
    cada((i, j) => {
      if (g.rampa(i, j) !== C || j < t.torBot) return;
      const libre = k => !g.get(i, j + k) || g.rampa(i, j + k) === CUERO || g.rampa(i, j + k) === F;
      if (libre(1)) pon(g, F, (i * 7 + j) % 5 === 0 ? 4 : (i + j) % 2 ? 2 : 1, [i, j]);
      else if (libre(2) && PX.umbral(i, j) > 0.55) pon(g, F, 0, [i, j]);
      else if (((i * 37 + j * 91) % 23) === 0) pon(g, CENIZA, 1, [i, j]);
    });
    /* Ceniza posada en la capucha. */
    for (const [i, j] of [[x + 3, t.cabY - 6], [x + 6, t.cabY - 3], [x + 1, t.cabY - 7], [x + 8, t.cabY], [x + 4, t.cabY - 7]]) ponSi(g, C, CENIZA, 1, [i, j]);
    bordeLuz(g, C, 3);
    g.contorno();
    /* Chispas que suben. */
    for (const [i, j, k] of [[t.torL - 6, t.suelo - 5, 3], [t.torL - 4, t.suelo - 9, 4], [t.torR + 7, t.suelo - 7, 3], [t.torR + 8, t.suelo - 12, 2], [t.torL - 7, t.suelo - 13, 2], [t.torR + 5, t.torTop + 2, 1], [t.torR + 9, t.torTop + 6, 3]]) mota(g, F, k, i, j);
    for (const [i, j] of [[x + 13, t.cabY + 2], [x - 10, t.torTop + 1], [x + 12, t.cabY - 4]]) mota(g, CENIZA, 3, i, j);
    return g;
  }

  /* Mercader (Brunilda): pelirroja con moño y cofia blanca, vestido azul largo con delantal,
     bolsa de monedas a la cadera y una balanza de bronce en la mano. */
  function mercader() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const P = R.piel.clara, Pe = R.pelo.cobrizo, T = R.tela.azul, B = R.tela.blanco, O = R.bronce;
    /* Moño detrás. */
    const x = t.cabX, y = t.ojoY;
    capa().ell(x + 6, t.cabY - 3, 3.2, 3).pintar(g, Pe, { relieve: 2 });
    capa().curva(x + 6, t.cabY + 1, x + 10, t.cabY + 5, x + 7, t.torTop + 5, 3, 1.5).pintar(g, Pe, { relieve: 1.5 });
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 1, t.torTop + 8], [t.torR, t.torTop + 12]], T, P, { atras: true, largo: true });
    /* Zapatos bajo la falda. */
    capa().rect(t.cx - 7, t.suelo - 1, 5, 2).rect(t.cx, t.suelo - 1, 5, 2).pintar(g, CUERO, { relieve: 1 });
    const vestido = torso(t).unir(falda(t, t.suelo - t.pierTop - 2, 4));
    vestido.pintar(g, T, { relieve: 4 });
    pliegues(g, T, [t.cx + 5, t.cx + 7], t.pierTop + 1, t.suelo - 2);
    for (let i = 0; i < W; i++) for (let j = t.pierTop; j <= t.suelo; j++) if (g.rampa(i, j) === T && g.rampa(i, j + 1) !== T) pon(g, T, 1, [i, j]);
    /* Delantal blanco y corpiño con cordones. */
    capa().poly([[t.torL + 1, t.torBot - 2], [t.cx + 2, t.torBot - 2], [t.cx + 3, t.suelo - 3], [t.torL - 3, t.suelo - 3]]).pintar(g, B, { relieve: 2.5, separar: true });
    pliegues(g, B, [t.torL + 1, t.cx - 1], t.pierTop + 2, t.suelo - 4);
    cinturon(g, t, t.torBot - 3, R.tela.granate, O);
    for (let j = t.torTop + 3; j <= t.torBot - 5; j += 2) pon(g, NEGRO, 2, [t.torL + 3, j], [t.torL + 4, j + 1]);
    capa().rect(t.torL + 1, t.torTop, 6, 2).pintar(g, B, { relieve: 1, min: 2, separar: true });
    /* Bolsa de monedas en la cadera de atrás. */
    capa().ell(t.torR + 1, t.torBot + 1, 2.4, 2.8).pintar(g, CUERO, { relieve: 1.5, separar: true });
    pon(g, O, 4, [t.torR + 1, t.torBot + 2]); pon(g, O, 2, [t.torR + 2, t.torBot + 3]);
    pon(g, R.tela.granate, 3, [t.torR, t.torBot - 1], [t.torR + 1, t.torBot - 1]);
    /* Cabeza, pelo cobrizo bajo la cofia y la cofia. */
    cabeza(g, t, P);
    const pelo = capa().ell(x + 0.6, t.cabY - 0.8, t.cabRx + 0.8, t.cabRy + 0.4);
    cada((i, j) => { if ((i < x + 2 && j > t.cabY - 4) || j > t.cabY + 4) pelo.off(i, j); });
    pelo.poly([[x - 7, t.cabY - 3], [x - 1, t.cabY - 6], [x + 1, t.cabY - 3], [x - 4, y - 2], [x - 7, y]]);
    pelo.pintar(g, Pe, { relieve: 2.5, separar: true });
    pon(g, Pe, 4, [x - 5, t.cabY - 5], [x - 4, t.cabY - 5], [x - 6, t.cabY - 4]);
    const cofia = capa().ell(x + 1.8, t.cabY - 3.6, t.cabRx - 0.6, t.cabRy - 3);
    cada((i, j) => { if (i < x - 3) cofia.off(i, j); if (j > t.cabY - 2 && i < x + 4) cofia.off(i, j); if (j > t.cabY) cofia.off(i, j); });
    cofia.pintar(g, B, { relieve: 2.5, separar: true });
    cada((i, j) => { if (cofia.tiene(i, j) && !cofia.tiene(i, j + 1) && i % 2 === 0) pon(g, B, 4, [i, j + 1]); });
    pon(g, R.tela.granate, 3, [x + 5, t.cabY - 1], [x + 6, t.cabY - 1]); pon(g, R.tela.granate, 2, [x + 6, t.cabY], [x + 7, t.cabY + 1]);
    oreja(g, t, P);
    pon(g, O, 4, [x + 4, y + 4]);
    cara(g, t, P, { iris: R.esmeralda ? R.esmeralda[3] : R.hoja[3], ceja: Pe });
    pon(g, P, 2, [x - 6, y + 3]);
    pon(g, P, 1, [x - 5, y + 5], [x - 4, y + 6], [x - 3, y + 5]);
    /* Brazo de delante con la balanza. */
    const [mx, my] = [t.torL - 3, t.torTop + 12];
    brazo(g, [[t.torL + 3, t.torTop + 3], [t.torL + 1, t.torTop + 8], [mx + 1, my]], T, P, { largo: true, sinMano: true });
    const bal = capa().rect(mx - 1, my - 10, 2, 11).rect(mx - 7, my - 9, 14, 1).rect(mx - 2, my - 11, 4, 2);
    bal.pintar(g, O, { relieve: 1, min: 2, separar: true });
    for (const px of [mx - 6, mx + 5]) {
      hilo(g, px, my - 8, px - 2, my - 3, O[1], O); hilo(g, px, my - 8, px + 2, my - 3, O[1], O);
      const plato = capa().rect(px - 3, my - 3, 7, 1).rect(px - 2, my - 2, 5, 1);
      plato.pintar(g, O, { relieve: 1, min: 2 });
      pon(g, O, 4, [px - 3, my - 3], [px - 2, my - 3]);
    }
    pon(g, O, 4, [mx - 1, my - 11], [mx - 7, my - 9], [mx - 1, my - 7]);
    pon(g, R.tela.ocre, 4, [mx - 7, my - 4], [mx - 6, my - 4]);
    pon(g, R.tela.ocre, 2, [mx - 5, my - 4]);
    capa().ell(mx + 0.5, my, 1.6, 1.6).pintar(g, P, { relieve: 1, separar: true });
    return g.contorno();
  }

  /* Dríada: piel de savia, cuerpo de corteza con vetas, faldón de hojas, pies de raíz, melena frondosa
     con flores rosas y blancas, orejas puntiagudas y una ramita florida en la mano. */
  function driada() {
    const g = new Rejilla(W, H), t = plantilla("esbelto");
    const P = SAVIA, M = R.madera, Hj = FRONDA, Hf = R.hoja;
    const x = t.cabX, y = t.ojoY;
    /* Melena detrás: cae por la espalda en mechones de hojas. */
    const melena = capa().ell(x + 2.6, t.cabY, t.cabRx + 1.4, t.cabRy + 1.2).poly([[x + 2, t.cabY], [x + 9, t.cabY + 2], [x + 10, t.torTop + 7], [x + 7, t.torTop + 11], [x + 3, t.torTop + 5]]);
    for (const [i, j] of [[x + 9, t.cabY - 3], [x + 10, t.cabY + 4], [x + 10, t.torTop + 4], [x + 8, t.torTop + 9], [x + 5, t.cabY - 7], [x - 1, t.cabY - 8]]) melena.ell(i, j, 2.2, 2);
    melena.pintar(g, Hj, { relieve: 3, max: 3 });
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 1, t.torTop + 8], [t.torR + 1, t.torTop + 12]], P, P, { atras: true, fino: 2 });
    /* Piernas de corteza y raíces por pies. */
    const pier = capa().linea(t.cx - 3, t.pierTop, t.cx - 4, t.suelo - 1, 3).linea(t.cx + 2, t.pierTop, t.cx + 3, t.suelo - 1, 3);
    pier.pintar(g, M, { relieve: 1.5 });
    const raiz = capa().curva(t.cx - 4, t.suelo - 1, t.cx - 7, t.suelo, t.cx - 10, t.suelo, 2, 1).curva(t.cx - 4, t.suelo - 1, t.cx - 3, t.suelo, t.cx - 1, t.suelo, 2, 1);
    raiz.curva(t.cx + 3, t.suelo - 1, t.cx + 1, t.suelo, t.cx, t.suelo, 2, 1).curva(t.cx + 3, t.suelo - 1, t.cx + 6, t.suelo, t.cx + 8, t.suelo, 2, 1);
    raiz.pintar(g, M, { relieve: 1, max: 3, separar: true });
    for (let j = t.pierTop + 1; j < t.suelo; j += 3) pon(g, M, 1, [t.cx - 4, j], [t.cx + 3, j + 1]);
    pon(g, Hf, 3, [t.cx - 5, t.pierTop + 6], [t.cx + 4, t.pierTop + 4]);
    /* Torso de savia, corpiño de corteza y faldón de hojas en punta. */
    torso(t).pintar(g, P, { relieve: 4 });
    const hojas = capa();
    for (let i = t.torL - 2; i <= t.torR + 2; i += 3) hojas.poly([[i - 1.8, t.torBot - 2], [i + 1.8, t.torBot - 2], [i + 0.6, t.pierTop + 5 + (i % 2)], [i - 0.4, t.pierTop + 6 - (i % 2)]]);
    hojas.rect(t.torL - 1, t.torBot - 2, t.torR - t.torL + 3, 3);
    hojas.pintar(g, Hf, { relieve: 2, separar: true });
    for (let i = t.torL - 2; i <= t.torR + 2; i += 3) for (let j = t.torBot; j <= t.pierTop + 4; j++) ponSi(g, Hf, Hf, 1, [i, j]);
    const corteza = capa().rect(t.torL, t.torTop + 5, t.torR - t.torL + 1, t.torBot - t.torTop - 6).ell(t.cx - 1, t.torTop + 5, 4.2, 1.6);
    corteza.recortar(torso(t)).pintar(g, M, { relieve: 2.5, separar: true });
    cada((i, j) => { if (corteza.tiene(i, j) && ((i * 5 + j) % 6 === 0 || (i * 5 + j + 1) % 6 === 0 && j % 3 === 0)) pon(g, M, 1, [i, j]); });
    for (const [i, j] of [[t.torL + 1, t.torTop + 6], [t.torR - 1, t.torTop + 10]]) capa().ell(i, j, 1.4, 1).pintar(g, Hf, { relieve: 1, min: 2, separar: true });
    /* Cabeza, oreja de punta y pelo que enmarca la frente sin taparla. */
    cabeza(g, t, P);
    oreja(g, t, P, 3);
    const fleq = capa().ell(x + 0.8, t.cabY - 1.6, t.cabRx + 1.2, t.cabRy - 0.6);
    cada((i, j) => { if ((i < x + 3 && j > t.cabY - 4 + Math.max(0, x - 2 - i) * 0.5) || (i >= x + 3 && j > t.cabY - 1)) fleq.off(i, j); });
    for (const [i, j] of [[x - 6, t.cabY - 5], [x - 2, t.cabY - 8], [x + 3, t.cabY - 8], [x + 7, t.cabY - 5]]) fleq.ell(i, j, 2, 1.8);
    fleq.pintar(g, Hj, { relieve: 2.5, separar: true });
    /* Textura de hojitas: un píxel oscuro con otro claro encima. */
    cada((i, j) => { if (g.rampa(i, j) === Hj && (i * 3 + j * 5) % 9 === 0 && Hj.indexOf(g.get(i, j)) > 1) { pon(g, Hj, 1, [i, j]); ponSi(g, Hj, Hj, 4, [i - 1, j - 1]); } });
    cara(g, t, P, { iris: R.bronce[3], iris2: R.bronce[2], ceja: Hj, mejilla: false });
    pon(g, ROSA, 2, [x + 1, y + 4], [x + 2, y + 4]);
    pon(g, P, 1, [x - 5, y + 5], [x - 4, y + 5]);
    pon(g, P, 4, [x - 7, y + 3]);
    /* Flores en la melena. */
    for (const [i, j, c] of [[x - 4, t.cabY - 7, 0], [x + 4, t.cabY - 8, 1], [x + 9, t.cabY + 3, 0], [x + 1, t.cabY - 10, 1], [x + 9, t.torTop + 6, 1], [x - 7, t.cabY - 3, 1], [x + 8, t.cabY - 4, 0]]) {
      const ram = c ? HUESO : ROSA;
      pon(g, ram, 4, [i, j - 1], [i - 1, j]); pon(g, ram, 3, [i + 1, j], [i, j + 1]);
      pon(g, R.bronce, 4, [i, j]);
    }
    /* Brazo de delante con una ramita florida. */
    const [mx, my] = [t.torL - 3, t.torTop + 9];
    capa().curva(mx, my + 2, mx - 3, my - 3, mx - 2, my - 9, 1).pintar(g, M, { plano: 2 });
    capa().ell(mx - 4, my - 4, 1.4, 0.9).ell(mx, my - 6, 1.4, 0.9).pintar(g, Hf, { relieve: 1, min: 2 });
    brazo(g, [[t.torL + 2, t.torTop + 3], [t.torL, t.torTop + 7], [mx + 1, my]], P, P, { fino: 2 });
    pon(g, ROSA, 4, [mx - 2, my - 11], [mx - 3, my - 10]); pon(g, ROSA, 3, [mx - 1, my - 10], [mx - 2, my - 9]); pon(g, R.bronce, 4, [mx - 2, my - 10]);
    g.contorno();
    for (const [i, j] of [[mx - 5, my - 12], [t.torR + 8, t.torTop + 14], [x - 9, t.cabY - 8]]) mota(g, Hf, 4, i, j);
    return g;
  }

  /* Gnomo (Fizwick): bajito, de pelo blanco rizado, narizota, gafas de latón en la frente, túnica
     granate con bolsillos, mochila de inventor con una llave inglesa y un matraz verde que burbujea. */
  function gnomo() {
    const g = new Rejilla(W, H), t = plantilla("bajo");
    const P = R.piel.clara, Pe = R.pelo.canoso, T = R.tela.granate, O = R.bronce;
    const x = t.cabX, y = t.ojoY;
    /* Mochila a la espalda con petate y herramientas. */
    const moch = capa().rect(t.torR - 2, t.torTop - 5, 9, 15).off(t.torR + 6, t.torTop - 5);
    moch.pintar(g, R.madera, { relieve: 2.5 });
    for (let j = t.torTop - 3; j <= t.torTop + 8; j += 3) pon(g, R.madera, 1, [t.torR + 5, j], [t.torR + 4, j]);
    capa().ell(t.torR + 2.5, t.torTop - 6, 5, 2.2).pintar(g, R.tela.azul, { relieve: 2, separar: true });
    pon(g, CUERO, 2, [t.torR, t.torTop - 7], [t.torR, t.torTop - 6], [t.torR, t.torTop - 5], [t.torR + 5, t.torTop - 7], [t.torR + 5, t.torTop - 6], [t.torR + 5, t.torTop - 5]);
    detras(g, capa().rect(t.torR + 5, t.torTop - 14, 2, 7).ell(t.torR + 6, t.torTop - 14, 2, 1.6).off(t.torR + 6, t.torTop - 16), R.plata, { relieve: 1, min: 2 });
    detras(g, capa().rect(t.torR - 1, t.torTop - 11, 1, 4).ell(t.torR - 1, t.torTop - 12, 1.2, 1.2), O, { relieve: 1, min: 2 });
    capa().rect(t.torR + 1, t.torTop + 2, 4, 3).pintar(g, CUERO, { relieve: 1, separar: true });
    pon(g, O, 4, [t.torR + 2, t.torTop + 3]);
    brazo(g, [[t.torR - 2, t.torTop + 2], [t.torR, t.torTop + 6], [t.torR - 1, t.torTop + 9]], T, P, { atras: true });
    piernas(g, t, R.tela.ocre, CUERO);
    /* Túnica granate con bolsillos y cinturón. */
    torso(t).unir(falda(t, 2, 1)).pintar(g, T, { relieve: 3.5 });
    cinturon(g, t, t.torBot - 3);
    capa().rect(t.torL + 1, t.torBot - 1, 3, 3).pintar(g, CUERO, { relieve: 1, separar: true });
    pon(g, O, 3, [t.torL + 2, t.torBot]);
    for (const i of [t.torL + 5, t.torL + 7]) capa().rect(i, t.torTop + 2, 1, 4).pintar(g, R.plata, { relieve: 1, min: 2, separar: true });
    pon(g, R.plata, 4, [t.torL + 5, t.torTop + 2], [t.torL + 7, t.torTop + 2]);
    /* Correa de la mochila. */
    capa().linea(t.torR - 3, t.torTop, t.torR - 5, t.torBot - 4, 2).pintar(g, CUERO, { relieve: 1, separar: true });
    /* Cabeza con narizota y pelo rizado detrás. */
    const rizo = capa().ell(x + 2.6, t.cabY + 0.4, t.cabRx + 1.6, t.cabRy + 1);
    for (const [i, j] of [[x + 8, t.cabY + 4], [x + 6, t.cabY + 6], [x + 9, t.cabY], [x + 7, t.cabY - 5], [x + 2, t.cabY - 7], [x - 3, t.cabY - 7], [x - 7, t.cabY - 4]]) rizo.ell(i, j, 2.2, 2);
    cada((i, j) => { if (i < x + 2 && j > t.cabY - 4) rizo.off(i, j); });
    capa().rect(x - 1, t.cabY + 4, 5, t.torTop - t.cabY - 3).pintar(g, P, { relieve: 1, max: 2 });
    const cab = capa().ell(x, t.cabY, t.cabRx, t.cabRy);
    cab.ell(x - 7.4, y + 2.5, 2, 1.8);
    cab.pintar(g, P, { relieve: 5 });
    pon(g, P, 4, [x - 8, y + 1]); pon(g, P, 1, [x - 6, y + 4], [x - 7, y + 4]);
    pon(g, R.piel.roja, 3, [x - 9, y + 2], [x - 8, y + 3]);
    rizo.pintar(g, Pe, { relieve: 2.5, separar: true });
    cada((i, j) => { if (g.rampa(i, j) === Pe && (i * 3 + j * 5) % 7 === 0) pon(g, Pe, 1, [i, j]); });
    /* Oreja de punta. */
    capa().ell(x + 3.5, y + 1.5, 1.4, 2).linea(x + 4, y, x + 6, y - 3, 2).pintar(g, P, { relieve: 1.2, separar: 2 });
    pon(g, P, 1, [x + 3, y + 1], [x + 3, y + 2]);
    cara(g, t, P, { iris: R.mar[3], ceja: Pe, sinBoca: true });
    /* Bigote blanco y sonrisa. */
    capa().poly([[x - 8, y + 4], [x - 2, y + 4], [x - 1, y + 6], [x - 4, y + 5.2], [x - 7, y + 6]]).pintar(g, Pe, { relieve: 1.2, min: 2, separar: 2 });
    pon(g, P, 0, [x - 5, y + 6], [x - 4, y + 6]);
    /* Gafas de latón en la frente. */
    for (let i = x - 7; i <= x + 3; i++) ponSi(g, Pe, CUERO, 2, [i, y - 4]), ponSi(g, P, CUERO, 2, [i, y - 4]);
    for (const ex of [x - 4.5, x - 0.5]) capa().ell(ex, y - 4, 1.8, 1.6).pintar(g, O, { relieve: 1, min: 2, separar: true });
    pon(g, R.mar, 3, [x - 5, y - 4], [x - 1, y - 4]); pon(g, R.mar, 2, [x - 4, y - 3], [x, y - 3]);
    pon(g, HUESO, 4, [x - 5, y - 5], [x - 1, y - 5]);
    /* Brazo de delante con el matraz. */
    const [mx, my] = [t.torL - 3, t.torTop + 6];
    brazo(g, [[t.torL + 2, t.torTop + 2], [t.torL, t.torTop + 5], [mx + 1, my]], T, P, {});
    const mat = capa().ell(mx - 2, my - 1, 2.6, 2.4).rect(mx - 3, my - 6, 2, 4);
    mat.pintar(g, R.plata, { relieve: 1, min: 2, separar: true });
    capa().ell(mx - 2, my - 0.4, 2, 1.6).pintar(g, LIMO, { relieve: 1.2, min: 2 });
    pon(g, LIMO, 4, [mx - 3, my - 1]); pon(g, R.plata, 4, [mx - 4, my - 2], [mx - 3, my - 5]);
    capa().rect(mx - 3, my - 7, 2, 1).pintar(g, R.madera, { plano: 3 });
    capa().ell(mx + 0.5, my, 1.6, 1.6).pintar(g, P, { relieve: 1, separar: true });
    bordeLuz(g, T, 3);
    g.contorno();
    for (const [i, j, k] of [[mx - 2, my - 9, 3], [mx - 3, my - 11, 4], [mx - 1, my - 13, 2], [mx - 4, my - 14, 3]]) mota(g, LIMO, k, i, j);
    return g;
  }

  /* Fantasma de un rey: barba larga, corona con gemas, manto de armiño y túnica que se deshace en una
     cola de niebla; flota sobre el suelo, translúcido y azul, con las cuencas vacías y dos puntos de luz. */
  function fantasma() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const E = ESPECTRO, A = ALMA;
    const x = t.cabX, sube = 1;
    t.cabY -= sube; t.ojoY -= sube; t.torTop -= sube; t.torBot -= sube;
    const y = t.ojoY;
    /* Manto real detrás, que ondea hacia atrás. */
    const manto = capa().poly([[t.torL + 2, t.torTop], [t.torR + 2, t.torTop], [t.torR + 8, t.torBot + 4], [t.torR + 5, t.torBot + 6], [t.torR + 2, t.torBot + 4]]);
    manto.pintar(g, E, { relieve: 3, max: 1 });
    pliegues(g, E, [t.torR + 4], t.torTop + 6, t.torBot + 4, 0);
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 1, t.torTop + 8], [t.torR, t.torTop + 12]], E, E, { atras: true, largo: true, grueso: 4 });
    /* Túnica que se estrecha en una cola curvada hacia atrás. */
    const tun = torso(t).unir(capa().poly([[t.torL - 1, t.torBot - 3], [t.torR + 1, t.torBot - 3], [t.torR + 2, t.torBot + 3], [t.cx + 3, t.torBot + 7], [t.torL, t.torBot + 3]]));
    tun.curva(t.cx, t.torBot + 3, t.cx + 1, t.suelo - 3, t.torR + 9, t.suelo - 4, 7.5, 1);
    tun.pintar(g, E, { relieve: 4, min: 1, max: 2 });
    pliegues(g, E, [t.torL + 5, t.cx + 3], t.torTop + 7, t.torBot + 5, 1);
    /* Cinturón con gema. */
    for (let i = t.torL; i <= t.torR + 1; i++) ponSi(g, E, E, 1, [i, t.torBot - 3]);
    pon(g, A, 3, [t.cx - 2, t.torBot - 3]); pon(g, A, 4, [t.cx - 3, t.torBot - 3]);
    /* Armiño: cuello y orla delantera, blancos con motas. */
    const armino = capa().ell(t.cx + 1, t.torTop + 1, 7.4, 2.6);
    armino.pintar(g, E, { relieve: 2, min: 3, separar: true });
    for (const [i, j] of [[t.cx + 4, t.torTop + 1], [t.cx + 7, t.torTop + 2], [t.cx + 6, t.torTop - 1]]) ponSi(g, E, E, 1, [i, j]);
    /* Cabeza. */
    capa().ell(x, t.cabY, t.cabRx, t.cabRy).rect(x - 8, y + 2, 2, 2).pintar(g, E, { relieve: 5, min: 2, max: 2 });
    pon(g, E, 4, [x - 4, t.cabY - 4], [x - 3, t.cabY - 4], [x - 5, t.cabY - 3]);
    /* Melena blanca detrás. */
    const pelo = capa().ell(x + 1.4, t.cabY, t.cabRx + 1, t.cabRy + 0.6).poly([[x + 3, t.cabY], [x + 8, t.cabY + 1], [x + 7, t.cabY + 7], [x + 3, t.cabY + 6]]);
    cada((i, j) => { if (i < x + 3 || j < t.cabY - 3) pelo.off(i, j); });
    pelo.pintar(g, E, { relieve: 2, min: 2, max: 3, separar: 2 });
    /* Cuencas vacías y ojos de luz, cejas pobladas. */
    for (const ex of [x - 5, x - 1]) {
      pon(g, E, 0, [ex, y], [ex + 1, y], [ex, y + 1], [ex + 1, y + 1], [ex, y + 2], [ex + 1, y + 2]);
      pon(g, A, 4, [ex, y + 1]); pon(g, A, 2, [ex + 1, y + 1]);
    }
    pon(g, E, 4, [x - 6, y - 2], [x - 5, y - 2], [x - 4, y - 2], [x - 1, y - 2], [x, y - 2], [x + 1, y - 2], [x - 7, y - 1]);
    pon(g, E, 1, [x - 5, y - 1], [x - 1, y - 1], [x, y - 1]);
    /* Barba larga y bigote. */
    const barba = capa().poly([[x - 7, y + 3], [x + 3, y + 2], [x + 3, t.torTop + 3], [x + 1, t.torTop + 9], [x - 2, t.torTop + 13], [x - 4, t.torTop + 8], [x - 8, t.torTop + 2]]);
    barba.pintar(g, E, { relieve: 2.5, min: 3, separar: 2 });
    for (let j = y + 7; j < t.torTop + 12; j++) ponSi(g, E, E, 2, [x - 3 + (j % 3 === 0 ? 1 : 0), j]);
    capa().poly([[x - 8, y + 3], [x - 1, y + 3], [x + 1, y + 5.4], [x - 4, y + 4.6], [x - 9, y + 5.4]]).pintar(g, E, { relieve: 1.2, min: 3, separar: 2 });
    pon(g, E, 0, [x - 5, y + 6], [x - 4, y + 6]);
    /* Corona de puntas con gemas. */
    const cor = capa().rect(x - 5, t.cabY - 7, 12, 3);
    for (const i of [x - 5, x - 1.5, x + 2, x + 5.5]) cor.poly([[i - 0.8, t.cabY - 6], [i + 0.6, t.cabY - 10.5], [i + 2, t.cabY - 6]]);
    cor.pintar(g, E, { relieve: 1.5, min: 3, separar: true });
    for (let i = x - 5; i <= x + 6; i++) ponSi(g, E, E, 2, [i, t.cabY - 5]);
    pon(g, A, 4, [x - 3, t.cabY - 6], [x + 4, t.cabY - 6]); pon(g, A, 2, [x - 3, t.cabY - 5], [x + 4, t.cabY - 5]);
    pon(g, A, 3, [x, t.cabY - 6]);
    /* Brazo de delante extendido, con la manga ancha y la mano que llama. */
    const [mx, my] = [t.torL - 5, t.torTop + 10];
    capa().poly([[t.torL + 3, t.torTop + 2], [t.torL, t.torTop + 2], [mx + 1, my - 2], [mx + 2, my + 4], [t.torL + 4, t.torTop + 9]]).pintar(g, E, { relieve: 2.5, max: 2, separar: true });
    capa().linea(mx + 1, my - 2, mx + 2, my + 4, 2).pintar(g, E, { relieve: 1, min: 3, max: 3 });
    capa().ell(mx - 0.4, my + 1, 1.6, 1.4).linea(mx - 1, my, mx - 3, my - 1, 1).linea(mx - 1, my + 2, mx - 3, my + 2, 1).pintar(g, E, { relieve: 1, min: 3, separar: true });
    g.contorno(E[0]);
    /* Translucidez: la cola se deshace en tramado y deja ver el fondo. */
    cada((i, j) => {
      if (!g.get(i, j) || j < t.torBot + 2) return;
      const f = (j - (t.torBot + 2)) / 13;
      if (PX.umbral(i, j) < f * 0.9) g.quitar(i, j);
    });
    /* Resplandor en el suelo bajo el fantasma y motas de luz. */
    for (let i = t.cx - 8; i <= t.cx + 8; i++) if (PX.umbral(i, 46) < 0.95 - Math.abs(i - t.cx) / 9) mota(g, A, Math.abs(i - t.cx) < 4 ? 2 : 1, i, 46);
    for (let i = t.cx - 4; i <= t.cx + 4; i++) if (PX.umbral(i, 45) < 0.5) mota(g, A, 1, i, 45);
    for (const [i, j, k] of [[t.torR + 9, t.torTop + 2, 3], [t.torL - 8, t.torTop - 4, 2], [t.torR + 4, t.cabY - 8, 3], [mx - 5, my + 7, 2], [t.torL - 2, t.suelo - 4, 3]]) mota(g, A, k, i, j);
    return g;
  }

  /* Herrero (Thrain): enano ancho, calvo de coronilla con melena gris, cejas pobladas, barbaza trenzada
     con anillas de bronce, delantal de cuero con tachuelas y el martillo en alto echando chispas. */
  function herrero() {
    const g = new Rejilla(W, H), t = plantilla("ancho");
    const P = R.piel.oliva, Pe = R.pelo.canoso, T = R.tela.terracota, Hi = R.hierro;
    const x = t.cabX, y = t.ojoY;
    brazo(g, [[t.torR - 3, t.torTop + 2], [t.torR + 1, t.torTop + 5], [t.torR, t.torTop + 9]], T, P, { atras: true, puno: T });
    piernas(g, t, R.tela.negro, CUERO, {});
    torso(t).pintar(g, T, { relieve: 4 });
    /* Delantal de cuero con pespunte claro, tachuelas y un bolsillo con tenazas. */
    const del = capa().poly([[t.torL + 1, t.torTop + 3], [t.torR - 2, t.torTop + 3], [t.torR, t.pierTop + 4], [t.torL - 2, t.pierTop + 4]]);
    del.pintar(g, CUERO, { relieve: 3, separar: true });
    cada((i, j) => { if (del.tiene(i, j) && j > t.torTop + 3 && (!del.tiene(i - 1, j) || !del.tiene(i + 1, j) || !del.tiene(i, j + 1)) && (i + j) % 2 === 0) pon(g, CUERO, 4, [i, j]); });
    for (let j = t.torTop + 5; j <= t.pierTop + 2; j += 3) pon(g, R.bronce, 4, [t.torR - 3, j]);
    capa().rect(t.cx + 1, t.torBot, 4, 4).pintar(g, CUERO, { relieve: 1, max: 2, separar: true });
    pon(g, Hi, 3, [t.cx + 2, t.torBot - 1], [t.cx + 3, t.torBot - 2]); pon(g, Hi, 4, [t.cx + 3, t.torBot - 3]);
    cinturon(g, t, t.torBot - 3, R.tela.negro, Hi);
    /* Cabeza: coronilla calva y brillante, melena gris por detrás. */
    cabeza(g, t, P, 2);
    const pelo = capa().ell(x + 1.4, t.cabY + 0.4, t.cabRx + 1, t.cabRy + 0.4).ell(x + 7, t.cabY + 4, 2.4, 3);
    cada((i, j) => { if (i < x + 3 || j < t.cabY - 4) pelo.off(i, j); });
    pelo.pintar(g, Pe, { relieve: 2.5, separar: true });
    cada((i, j) => { if (g.rampa(i, j) === Pe && (i * 2 + j * 3) % 5 === 0) pon(g, Pe, 1, [i, j]); });
    oreja(g, t, P);
    pon(g, P, 4, [x - 3, t.cabY - 5], [x - 2, t.cabY - 5], [x - 4, t.cabY - 4], [x - 1, t.cabY - 6], [x - 3, t.cabY - 4]);
    cara(g, t, P, { iris: R.pelo.castano[3], sinBoca: true, sinCejas: true });
    /* Cejas pobladas que sobresalen hacia delante. */
    capa().rect(x - 7, y - 2, 4, 2).rect(x - 2, y - 2, 4, 2).pintar(g, Pe, { relieve: 1, min: 2, separar: 2 });
    pon(g, Pe, 4, [x - 7, y - 2], [x - 2, y - 2]);
    /* Barbaza con dos trenzas y bigote. */
    const barba = capa().poly([[x - 7, y + 3], [x + 4, y + 1], [x + 4, y + 5], [x + 2, t.torTop + 6], [x - 1, t.torTop + 9], [x - 4, t.torTop + 6], [x - 8, y + 5]]);
    barba.pintar(g, Pe, { relieve: 3, separar: 2 });
    cada((i, j) => { if (barba.tiene(i, j) && j > y + 4 && (i * 2 + j) % 4 === 0) pon(g, Pe, 1, [i, j]); });
    const trenzas = capa().rect(x - 4, t.torTop + 5, 2, 7).rect(x, t.torTop + 6, 2, 6);
    trenzas.pintar(g, Pe, { relieve: 1, separar: 2 });
    for (let j = t.torTop + 6; j < t.torTop + 12; j += 2) pon(g, Pe, 1, [x - 4, j], [x, j + 1]);
    for (const [i, j] of [[x - 4, t.torTop + 9], [x, t.torTop + 10]]) { pon(g, R.bronce, 4, [i, j]); pon(g, R.bronce, 2, [i + 1, j]); pon(g, R.bronce, 3, [i, j + 1]); pon(g, R.bronce, 1, [i + 1, j + 1]); }
    capa().poly([[x - 8, y + 3.5], [x - 1, y + 3], [x + 1, y + 5], [x - 4, y + 4.6], [x - 9, y + 6]]).pintar(g, Pe, { relieve: 1.2, min: 3, separar: 2 });
    pon(g, R.piel.roja, 3, [x - 8, y + 2]);
    /* Hollín en la frente. */
    pon(g, P, 1, [x - 5, t.cabY - 3], [x - 4, t.cabY - 3], [x + 1, y + 3]);
    /* Martillo en alto, lejos de la cabeza. */
    const [mx, my] = [t.torL - 4, t.torTop - 1];
    capa().linea(mx + 1, my + 4, mx - 1, my - 10, 2).pintar(g, R.madera, { relieve: 1, separar: true });
    const cabM = capa().rect(mx - 6, my - 15, 11, 5).off(mx - 6, my - 15).off(mx + 4, my - 15).off(mx - 6, my - 11).off(mx + 4, my - 11);
    cabM.pintar(g, Hi, { relieve: 2, separar: true });
    for (let i = mx - 5; i <= mx + 3; i++) pon(g, Hi, 4, [i, my - 15]);
    pon(g, Hi, 1, [mx - 1, my - 14], [mx - 1, my - 13], [mx - 1, my - 12]);
    pon(g, R.fuego, 3, [mx - 6, my - 13], [mx - 6, my - 12]); pon(g, R.fuego, 4, [mx - 6, my - 14]);
    pon(g, R.fuego, 2, [mx + 4, my - 12]);
    brazo(g, [[t.torL + 3, t.torTop + 3], [t.torL - 2, t.torTop + 4], [mx, my + 1]], T, P, { puno: T, grueso: 4, fino: 3 });
    capa().rect(mx - 1, my + 2, 3, 3).pintar(g, CUERO, { relieve: 1, separar: true });
    capa().ell(mx, my, 2, 2).pintar(g, P, { relieve: 1.2, separar: true });
    g.contorno();
    for (const [i, j, k] of [[mx - 9, my - 15, 4], [mx - 9, my - 11, 3], [mx - 11, my - 13, 2], [mx - 8, my - 18, 3], [mx - 2, my - 18, 2], [mx - 11, my - 17, 1], [mx + 7, my - 16, 3]]) mota(g, R.fuego, k, i, j);
    return g;
  }

  /* Mercader planar: tiefling de piel azul con cuernos que salen del turbante, ojos dorados, perilla,
     túnica granate con ribetes de oro, fajín ocre anudado, cola de punta de flecha y una bolsa violeta mágica. */
  function planar() {
    const g = new Rejilla(W, H), t = plantilla("normal");
    const P = R.piel.azul, T = R.tela.granate, O = R.bronce, V = R.tela.violeta, Cu = CUERNO;
    const x = t.cabX, y = t.ojoY;
    /* Cola detrás. */
    capa().curva(t.torR - 1, t.torBot - 2, t.torR + 9, t.torBot + 6, t.torR + 7, t.torTop + 6, 2.4, 1.4).pintar(g, P, { relieve: 1.2, max: 3 });
    capa().poly([[t.torR + 5, t.torTop + 5], [t.torR + 8, t.torTop + 1], [t.torR + 10, t.torTop + 6], [t.torR + 7, t.torTop + 7]]).pintar(g, P, { relieve: 1, min: 2, max: 3 });
    brazo(g, [[t.torR - 2, t.torTop + 3], [t.torR + 1, t.torTop + 8], [t.torR, t.torTop + 12]], T, P, { atras: true, largo: true });
    capa().rect(t.cx - 7, t.suelo - 1, 5, 2).rect(t.cx, t.suelo - 1, 5, 2).pintar(g, O, { relieve: 1, max: 3 });
    /* Túnica larga con ribetes. */
    const tun = torso(t).unir(falda(t, t.suelo - t.pierTop - 2, 3));
    tun.pintar(g, T, { relieve: 4 });
    pliegues(g, T, [t.cx + 4, t.cx + 7], t.pierTop, t.suelo - 3);
    for (let i = 0; i < W; i++) for (let j = t.torBot; j <= t.suelo; j++) if (g.rampa(i, j) === T && g.rampa(i, j + 1) !== T) pon(g, O, 3, [i, j], [i, j - 1]);
    for (let j = t.torBot; j <= t.suelo - 2; j++) if (g.rampa(t.torL + 3, j) === T) pon(g, O, j % 3 ? 3 : 4, [t.torL + 3, j]);
    for (let i = t.torL + 2; i <= t.torR - 2; i++) ponSi(g, T, O, i % 2 ? 3 : 4, [i, t.torTop]);
    for (const [i, j] of [[t.torL + 1, t.suelo - 6], [t.cx + 2, t.suelo - 5], [t.cx + 6, t.suelo - 7]]) { pon(g, O, 2, [i, j], [i + 1, j + 1], [i - 1, j + 1]); pon(g, O, 4, [i, j - 1]); }
    /* Fajín ocre anudado, con las puntas colgando. */
    capa().rect(t.torL - 1, t.torBot - 4, t.torR - t.torL + 3, 3).pintar(g, R.tela.ocre, { relieve: 1.5, separar: true });
    pon(g, R.tela.ocre, 1, ...Array.from({ length: t.torR - t.torL + 3 }, (_, k) => [t.torL - 1 + k, t.torBot - 2]).filter(([i]) => i % 2));
    capa().ell(t.torL + 1, t.torBot - 3, 1.6, 1.6).pintar(g, R.tela.ocre, { relieve: 1, separar: true });
    capa().linea(t.torL + 1, t.torBot - 1, t.torL, t.torBot + 4, 2).linea(t.torL + 2, t.torBot - 1, t.torL + 3, t.torBot + 3, 1).pintar(g, R.tela.ocre, { relieve: 1, max: 3, separar: true });
    /* Cabeza, perilla negra y pendiente de oro. */
    cabeza(g, t, P);
    oreja(g, t, P, 2);
    cara(g, t, P, { iris: R.fuego[2], iris2: R.fuego[3], brillo: R.bronce[4], ceja: NEGRO, mejilla: false });
    capa().poly([[x - 6, y + 5], [x - 3, y + 5], [x - 3, y + 8], [x - 5, y + 9]]).pintar(g, NEGRO, { relieve: 1, min: 2, max: 3, separar: 2 });
    pon(g, P, 0, [x - 5, y + 4], [x - 4, y + 4]);
    pon(g, HUESO, 4, [x - 4, y + 4]);
    capa().ell(x + 3.5, y + 5, 1.2, 1.2).pintar(g, O, { relieve: 1, min: 2 });
    pon(g, O, 4, [x + 3, y + 4]);
    /* Cuernos: salen por detrás del turbante y se curvan hacia atrás y arriba. */
    capa().curva(x - 1, t.cabY - 7, x - 1, t.cabY - 13, x + 4, t.cabY - 14, 3, 1).pintar(g, Cu, { relieve: 1.4, min: 1, max: 3 });
    capa().curva(x + 4, t.cabY - 5, x + 8, t.cabY - 12, x + 12, t.cabY - 10, 3.8, 1.2).pintar(g, Cu, { relieve: 1.6, min: 1, separar: true });
    for (const [i, j] of [[x + 6, t.cabY - 8], [x + 8, t.cabY - 10], [x + 1, t.cabY - 12]]) ponSi(g, Cu, Cu, 1, [i, j]);
    /* Turbante con gema. */
    const turb = capa().ell(x + 0.6, t.cabY - 3, t.cabRx + 0.8, 3.8).ell(x + 1.6, t.cabY - 6.4, 4.4, 2.6);
    turb.quitarRect(0, y - 1, W, H);
    turb.pintar(g, R.tela.blanco, { relieve: 3, separar: true });
    for (let i = x - 7; i <= x + 8; i++) for (let j = t.cabY - 9; j <= y - 2; j++) if (turb.tiene(i, j) && (i + j * 2) % 6 === 0) pon(g, R.tela.blanco, 1, [i, j]);
    capa().ell(x - 3, t.cabY - 3.6, 1.6, 1.8).pintar(g, R.magia, { relieve: 1, min: 2, separar: true });
    pon(g, R.magia, 4, [x - 4, t.cabY - 5]);
    pon(g, O, 3, [x - 3, t.cabY - 6], [x - 5, t.cabY - 4], [x - 1, t.cabY - 4], [x - 3, t.cabY - 2]);
    pon(g, O, 4, [x - 3, t.cabY - 6]);
    /* Brazo de delante con la bolsa violeta. */
    const [mx, my] = [t.torL - 2, t.torTop + 9];
    brazo(g, [[t.torL + 3, t.torTop + 3], [t.torL + 1, t.torTop + 7], [mx + 1, my]], T, P, { largo: true, sinMano: true });
    capa().rect(t.torL - 1, t.torTop + 7, 3, 2).pintar(g, O, { relieve: 1, min: 2, separar: true });
    const bolsa = capa().ell(mx - 2, my + 4, 3.2, 3.4).rect(mx - 3, my, 2, 2);
    bolsa.pintar(g, V, { relieve: 2.5, separar: true });
    pon(g, O, 4, [mx - 3, my + 1]); pon(g, O, 3, [mx - 2, my + 1]);
    pon(g, R.magia, 4, [mx - 3, my + 4]); pon(g, R.magia, 3, [mx - 2, my + 5], [mx - 4, my + 5]);
    capa().ell(mx + 0.5, my, 1.6, 1.6).pintar(g, P, { relieve: 1, separar: true });
    bordeLuz(g, P, 3);
    g.contorno();
    destello(g, mx - 7, my + 1, R.magia);
    mota(g, R.magia, 4, mx - 6, my + 8); mota(g, R.magia, 3, mx - 1, my - 4); mota(g, R.magia, 2, mx - 8, my - 4);
    return g;
  }

  window.PNJ_HD = window.PNJ_HD || {};
  Object.assign(window.PNJ_HD, { tabernero, forastero, mercader, driada, gnomo, fantasma, herrero, planar });

  /* ---------- Mascotas (mirando a la derecha) ---------- */

  /* Lobezno gris: cabezón y orejudo, de tres cuartos, con antifaz y pechera claros y la cola tupida en alto. */
  function lobezno() {
    const g = new Rejilla(W, H), G = R.piel.gris, P = R.piel.clara;
    const cola = capa().curva(18, 38.5, 11.5, 38, 12, 30.5, 5, 3);
    cola.pintar(g, G, { relieve: 2, max: 3 });
    pon(g, G, 4, [11, 30], [12, 30], [11, 31]); pon(g, G, 1, [14, 37], [13, 36]);
    capa().rect(19, 42, 3, 5).rect(28, 42, 3, 5).pintar(g, G, { relieve: 1, max: 2 });
    const cuerpo = capa().ell(22.5, 39.6, 7, 4.6);
    cuerpo.pintar(g, G, { relieve: 4, separar: true });
    for (const [i, j] of [[18, 37], [21, 36], [24, 37], [17, 39]]) pon(g, G, 2, [i, j]);
    capa().rect(16, 42, 3, 5).rect(25, 42, 3, 5).pintar(g, G, { relieve: 1.2, max: 3, separar: true });
    pon(g, G, 4, [16, 46], [25, 46]); pon(g, G, 1, [17, 46], [26, 46], [18, 46], [27, 46]);
    const cab = capa().ell(30.5, 33.4, 6.2, 5.4).poly([[33, 33.4], [38.5, 34.6], [38.5, 37.4], [33, 38.8]]);
    cab.poly([[23.6, 31.6], [25.4, 22.6], [31.2, 28.8]]).poly([[30.6, 28.6], [35.6, 22.4], [37.2, 31.6]]);
    cab.pintar(g, G, { relieve: 4, separar: true });
    /* Rosa dentro de las orejas (con la rampa gris, para que el contorno siga gris). */
    for (const [i, j] of [[26, 26], [26, 27], [27, 27], [26, 28], [27, 28], [28, 28], [34, 26], [33, 27], [34, 27], [33, 28], [34, 28], [32, 28]]) g.set(i, j, P[2], G);
    pon(g, G, 4, [25, 24], [35, 24]);
    /* Pechera y antifaz claros. */
    capa().ell(29, 39.4, 3, 3.2).recortar(cuerpo.copia().unir(cab)).pintar(g, G, { relieve: 1.5, min: 3 });
    capa().ell(34.6, 36, 3.4, 2).ell(28, 35.6, 1.8, 1.2).recortar(cab).pintar(g, G, { plano: 4 });
    ojo(g, 28, 32, R.bronce[2]); ojo(g, 32, 32, R.bronce[2]);
    pon(g, G, 1, [27, 31], [28, 31], [32, 31], [33, 31]);
    pon(g, NEGRO, 0, [37, 34], [38, 34], [36, 34], [37, 35], [38, 35]);
    pon(g, NEGRO, 3, [37, 34]);
    pon(g, G, 1, [34, 37], [35, 37], [36, 37]);
    pon(g, R.piel.roja, 4, [35, 38], [34, 38]); pon(g, R.piel.roja, 3, [35, 39]);
    pon(g, R.piel.roja, 4, [30, 35]);
    return g.contorno();
  }

  /* Búho: bola de plumas parda con el disco de la cara blanco, ojos ámbar enormes y orejitas de pluma. */
  function buho() {
    const g = new Rejilla(W, H), C = R.pelo.castano, B = R.tela.blanco, A = R.bronce;
    capa().poly([[17.5, 41.5], [13.5, 46.5], [19, 46.5], [21, 43]]).pintar(g, C, { relieve: 1, max: 2 });
    const cuerpo = capa().ell(24.5, 38.4, 7, 7.6);
    cuerpo.poly([[18.4, 30], [18.8, 23.6], [23, 28.6]]).poly([[26.6, 28.2], [31, 23.4], [31.2, 30]]);
    cuerpo.pintar(g, C, { relieve: 4.5, separar: true });
    const pecho = capa().ell(26.4, 40.6, 4.4, 4.8).recortar(cuerpo);
    pecho.pintar(g, B, { relieve: 2, min: 2, max: 3 });
    for (const [i, j] of [[25, 38], [28, 38], [26, 40], [29, 40], [24, 42], [27, 42], [25, 44], [28, 44]]) { pon(g, C, 2, [i, j]); ponSi(g, B, C, 3, [i, j - 1]); }
    new Capa(W, H).ell(26.6, 31.4, 5.4, 4).recortar(cuerpo).pintar(g, B, { relieve: 2, min: 3 });
    pon(g, C, 1, [21, 28], [22, 28], [23, 28], [29, 28], [30, 28], [31, 28]);
    for (const ex of [23.8, 29]) capa().ell(ex, 31.4, 2, 2).pintar(g, A, { relieve: 1.2, min: 3 });
    for (const ex of [24, 29]) { pon(g, NEGRO, 0, [ex, 31], [ex + 1, 31], [ex, 32], [ex + 1, 32]); pon(g, HUESO, 4, [ex, 31]); }
    pon(g, A, 2, [23, 33], [28, 33]);
    pon(g, R.oricalco, 3, [26, 33], [27, 33]); pon(g, R.oricalco, 2, [26, 34], [27, 34]); pon(g, R.oricalco, 1, [27, 35]);
    pon(g, R.oricalco, 4, [26, 33]);
    const ala = capa().ell(20.4, 38.8, 3.6, 6.2).poly([[17.6, 42], [19.6, 46], [22.8, 42]]);
    ala.pintar(g, C, { relieve: 2.5, max: 3, separar: true });
    for (const [i, j] of [[20, 36], [21, 38], [19, 40], [21, 41], [20, 43], [18, 38]]) pon(g, C, 1, [i, j]);
    pon(g, C, 4, [18, 34], [19, 34], [19, 33]);
    for (const i of [24, 25, 28, 29]) pon(g, A, 3, [i, 46]);
    pon(g, A, 1, [26, 46], [27, 46]);
    pon(g, A, 4, [24, 46], [28, 46]);
    return g.contorno();
  }

  /* Diablillo familiar: cabezón y redondo, cuernitos, alas de murciélago diminutas, sonrisa pícara
     con un colmillo y la cola en punta de flecha. */
  function diablillo() {
    const g = new Rejilla(W, H), Rj = R.piel.roja, S = R.sangre;
    alaMembrana(g, [22, 35], [16.5, 27], [[13.5, 23.5], [10, 27.5], [11, 33]], [18, 37], S, { relieve: 1.5, max: 2, separar: true }, Rj);
    capa().curva(22.5, 44, 15.5, 46.6, 13, 42, 2.2, 1.4).pintar(g, Rj, { relieve: 1, max: 3 });
    capa().poly([[9.6, 42], [12, 38], [15, 41.4], [12, 41.6]]).pintar(g, Rj, { relieve: 1, min: 2, max: 3 });
    capa().rect(22, 42, 3, 5).rect(26, 42, 3, 5).pintar(g, Rj, { relieve: 1, max: 2 });
    const cuerpo = capa().ell(25, 39.8, 4.4, 4);
    cuerpo.pintar(g, Rj, { relieve: 3, separar: true });
    pon(g, Rj, 4, [26, 39]); pon(g, Rj, 1, [23, 41], [24, 42]);
    capa().rect(21, 45, 4, 2).rect(26, 45, 4, 2).pintar(g, NEGRO, { relieve: 1, min: 1, max: 3 });
    const cab = capa().ell(26.8, 31.4, 6.2, 5.6).poly([[21, 30], [17.4, 27.4], [21.6, 33]]);
    cab.pintar(g, Rj, { relieve: 4, separar: true });
    capa().curva(22.6, 27, 21.4, 24.4, 23.4, 22.8, 2.4, 1).curva(28.4, 26.4, 29.4, 23.6, 31.8, 23.2, 2.4, 1).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    for (const ex of [25, 29]) { capa().rect(ex, 29, 3, 3).pintar(g, R.bronce, { plano: 4 }); pon(g, R.bronce, 3, [ex, 31], [ex + 1, 31], [ex + 2, 31]); }
    pon(g, NEGRO, 0, [26, 29], [26, 30], [27, 29], [27, 30], [30, 29], [30, 30], [31, 29], [31, 30]);
    pon(g, HUESO, 4, [26, 29], [30, 29]);
    pon(g, Rj, 0, [24, 28], [25, 27], [26, 27], [29, 27], [30, 27], [31, 28]);
    /* Sonrisa pícara con colmillo. */
    pon(g, NEGRO, 0, [26, 34], [27, 35], [28, 35], [29, 35], [30, 34]);
    pon(g, HUESO, 4, [28, 35]);
    pon(g, R.piel.roja, 4, [23, 33], [32, 33]);
    pon(g, Rj, 4, [22, 29], [23, 28], [23, 27]);
    capa().linea(27, 38, 31, 36, 2).pintar(g, Rj, { relieve: 1, separar: true });
    capa().ell(31.6, 35.6, 1.3, 1.3).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    g.contorno();
    for (const [i, j, k] of [[34, 25, 3], [36, 28, 2], [14, 21, 2]]) mota(g, R.fuego, k, i, j);
    return g;
  }

  /* Gato negro sentado: orejas de punta, ojos amarillos de pupila rasgada, bigotes y la cola enroscada. */
  function gato() {
    const g = new Rejilla(W, H), N = R.tela.negro, A = R.bronce;
    capa().curva(18.4, 44.5, 10.5, 45.4, 12, 36, 3.2, 2).pintar(g, N, { relieve: 1.8, max: 3 });
    pon(g, N, 3, [11, 37], [11, 38]);
    const cuerpo = capa().ell(22.4, 40, 6, 6.4).ell(26.4, 37.8, 3.8, 5.2);
    cuerpo.pintar(g, N, { relieve: 4, separar: true });
    capa().rect(25, 39, 3, 8).rect(28.5, 39, 3, 8).pintar(g, N, { relieve: 1.2, max: 3, separar: true });
    pon(g, N, 1, [28, 40], [28, 42], [28, 44]);
    pon(g, N, 3, [25, 46], [29, 46]);
    const cab = capa().ell(28, 30, 5.6, 4.6).poly([[22.8, 29], [23, 22], [27.4, 26]]).poly([[29.2, 26], [33, 22], [33.4, 29]]);
    cab.pintar(g, N, { relieve: 4, separar: true });
    for (const [i, j] of [[24, 25], [24, 26], [25, 26], [32, 25], [31, 26], [32, 26]]) g.set(i, j, R.piel.clara[1], N);
    for (const ex of [25, 30]) {
      capa().rect(ex, 28, 3, 3).pintar(g, A, { plano: 4 });
      pon(g, A, 3, [ex, 30], [ex + 2, 30]); pon(g, A, 2, [ex + 1, 30]);
      pon(g, NEGRO, 0, [ex + 1, 28], [ex + 1, 29], [ex + 1, 30]);
      pon(g, HUESO, 4, [ex, 28]);
    }
    pon(g, R.piel.roja, 4, [31, 32], [32, 32]); pon(g, R.piel.roja, 3, [31, 33]);
    pon(g, N, 4, [30, 33], [32, 34], [30, 34], [31, 34]);
    pon(g, A, 3, [26, 41]);
    bordeLuz(g, N);
    capa().rect(24, 34, 6, 1).pintar(g, R.tela.granate, { plano: 3 });
    pon(g, R.bronce, 4, [27, 35]); pon(g, R.bronce, 2, [27, 36]);
    g.contorno();
    for (const [x0, y0, x1, y1] of [[34, 31, 37, 30], [34, 33, 37, 33], [34, 34, 36, 36]]) hilo(g, x0, y0, x1, y1, HUESO[2], HUESO);
    return g;
  }

  /* Dragoncito rojo: cabeza grande, cuernos romos, alitas de cría, pecho ocre a franjas, cola con
     punta y una voluta de humo saliendo del hocico. */
  function dragoncito() {
    const g = new Rejilla(W, H), Rj = R.piel.roja, S = R.sangre, O = R.tela.ocre;
    alaMembrana(g, [20, 35], [16, 27.5], [[12.5, 26.5], [11, 30.5]], [16, 35.5], S, { relieve: 1.5, max: 1 }, Rj);
    capa().curva(18.4, 42, 12, 46, 8, 40.6, 3.4, 1.6).pintar(g, Rj, { relieve: 1.5, max: 3 });
    capa().poly([[5.4, 40.4], [7.6, 36.4], [10.4, 39.6], [7.6, 41.8]]).pintar(g, O, { relieve: 1, min: 2, max: 3 });
    capa().rect(18, 42, 4, 5).rect(26, 42, 4, 5).pintar(g, Rj, { relieve: 1, max: 2 });
    const cuerpo = capa().ell(23, 39.6, 6.4, 4.6).ell(27.6, 36.6, 3.6, 3.6);
    cuerpo.pintar(g, Rj, { relieve: 4, separar: true });
    for (const [i, j] of [[18, 36], [22, 35], [26, 33]]) capa().poly([[i - 1.4, j + 0.6], [i + 0.6, j - 2.2], [i + 1.6, j + 0.6]]).pintar(g, O, { relieve: 1, min: 2, separar: true });
    const pecho = capa().ell(28.4, 39.2, 3, 4.2).recortar(cuerpo);
    pecho.pintar(g, O, { relieve: 1.5, min: 2, max: 3 });
    for (const j of [36, 39, 42]) for (let i = 24; i <= 32; i++) if (pecho.tiene(i, j)) pon(g, O, 1, [i, j]);
    capa().rect(15, 43, 4, 4).rect(23, 43, 4, 4).pintar(g, Rj, { relieve: 1.2, max: 3, separar: true });
    pon(g, HUESO, 4, [15, 46], [17, 46], [23, 46], [25, 46]);
    const cab = capa().ell(30.4, 31.6, 5.2, 4.6).poly([[32.4, 29.2], [38.4, 31], [38.4, 34.8], [32.4, 36.4]]);
    cab.pintar(g, Rj, { relieve: 4, separar: true });
    capa().curva(27.6, 28, 25.6, 26.4, 24.2, 23.8, 2.6, 1.2).curva(30.8, 27.2, 30.2, 24.6, 28.8, 22.6, 2.6, 1.2).pintar(g, HUESO, { relieve: 1, min: 2, separar: true });
    capa().rect(30, 30, 3, 3).pintar(g, R.bronce, { plano: 4 });
    pon(g, NEGRO, 0, [31, 30], [31, 31], [32, 30], [32, 31]); pon(g, HUESO, 4, [31, 30]);
    pon(g, R.bronce, 3, [30, 32], [31, 32], [32, 32]);
    pon(g, Rj, 1, [29, 29], [30, 29], [31, 29], [32, 29], [33, 29]);
    pon(g, NEGRO, 0, [37, 31], [36, 31]);
    for (let i = 33; i <= 37; i++) pon(g, Rj, 1, [i, 34]);
    pon(g, HUESO, 4, [35, 35], [33, 35]);
    pon(g, O, 3, [32, 35], [34, 35], [36, 35]);
    pon(g, Rj, 4, [26, 28], [27, 28], [34, 30]);
    alaMembrana(g, [22, 35], [20, 26.5], [[16, 25], [14.6, 29]], [19.4, 34], S, { relieve: 1.5, max: 2, separar: true }, Rj);
    g.contorno();
    for (const [i, j, k] of [[39, 29, 3], [40, 28, 4], [40, 27, 3], [41, 26, 2], [42, 25, 3], [41, 24, 2]]) mota(g, R.piedra, k, i, j);
    return g;
  }

  /* Babosa: cubo gelatinoso en miniatura y simpático, translúcido, con ojitos, sonrisa, burbujas
     y una moneda tragada. */
  function babosa() {
    const g = new Rejilla(W, H), E = R.piel.esmeralda, Hj = R.hoja;
    const frente = capa().rect(13, 32, 17, 14).off(13, 32).off(29, 32).off(13, 45);
    const arriba = capa().poly([[13, 32], [18, 27], [35, 27], [30, 32]]).restar(frente).off(18, 27).off(35, 27);
    const lado = capa().poly([[29.5, 32], [35.5, 26.5], [35.5, 40.5], [29.5, 46.5]]).restar(frente).restar(arriba).off(35, 40);
    const charco = capa().ell(24, 46, 12, 1).restar(frente).restar(lado);
    tramar(g, frente, E, 2, 3, (x, y) => 0.85 - (x - 13 + y - 32) / 30);
    tramar(g, arriba, E, 3, 4, x => 0.8 - (x - 13) / 24);
    tramar(g, lado, E, 1, 2, (x, y) => 0.7 - (y - 27) / 18);
    charco.pintar(g, E, { plano: 2 });
    /* Moneda y huesecillo flotando dentro. */
    capa().ell(16.5, 41.5, 1.6, 1).pintar(g, R.bronce, { plano: 3 });
    pon(g, R.bronce, 4, [16, 41]); pon(g, R.bronce, 1, [17, 42]);
    pon(g, HUESO, 2, [25, 43], [26, 43], [27, 42]); pon(g, HUESO, 3, [25, 42]);
    pon(g, E, 4, [21, 42], [32, 36], [20, 44], [33, 31]);
    /* Aristas iluminadas. */
    for (let i = 14; i <= 28; i++) pon(g, Hj, 4, [i, 32]);
    for (let j = 33; j <= 44; j++) pon(g, Hj, 3, [13, j]);
    for (let i = 19; i <= 34; i++) pon(g, Hj, 4, [i, 27]);
    pon(g, HUESO, 4, [14, 33], [15, 33], [14, 34], [19, 28], [20, 28], [21, 28]);
    /* Ojos y sonrisa. */
    for (const ex of [18, 24]) {
      capa().rect(ex, 34, 3, 4).off(ex, 34).off(ex + 2, 34).pintar(g, HUESO, { plano: 4 });
      pon(g, NEGRO, 0, [ex + 1, 35], [ex + 2, 35], [ex + 1, 36], [ex + 2, 36]);
      pon(g, HUESO, 4, [ex + 1, 35]);
    }
    pon(g, E, 0, [20, 39], [21, 40], [22, 40], [23, 40], [24, 39]);
    pon(g, R.piel.roja, 4, [16, 38], [17, 38], [27, 38]);
    g.contorno(E[0]);
    for (const [i, j, k] of [[24, 24, 3], [27, 22, 4], [31, 24, 2]]) mota(g, E, k, i, j);
    return g;
  }

  /* Espíritu: fuego fatuo cian que flota; una gota de luz con la llama echada hacia atrás, el núcleo
     blanco, dos ojitos y un halo en el suelo. */
  function espiritu() {
    const g = new Rejilla(W, H), F = FATUO;
    const cuerpo = capa().ell(27, 33.6, 6, 5.6).curva(23.6, 31, 18.6, 28.8, 16, 20.6, 7.4, 1.2);
    cuerpo.curva(23, 33.8, 18.4, 34.6, 15.4, 31.8, 4.4, 1.2).curva(25, 29, 24, 25, 25.6, 22.6, 3, 1);
    cuerpo.pintar(g, F, { relieve: 4, min: 2 });
    capa().ell(27.6, 34.2, 4, 3.6).pintar(g, F, { relieve: 2, min: 3 });
    capa().ell(26.4, 33, 2, 1.6).pintar(g, F, { plano: 4 });
    pon(g, F, 3, [20, 28], [19, 25], [18, 23], [19, 32], [24, 26]);
    pon(g, F, 4, [21, 29], [18, 22]);
    /* Ojitos y boquita. */
    ojo(g, 27, 33, F[1], { oscuro: F[0], brillo: F[4] });
    ojo(g, 31, 33, F[1], { oscuro: F[0], brillo: F[4] });
    pon(g, F, 1, [29, 37], [30, 37]);
    pon(g, ROSA, 3, [26, 36], [33, 36]);
    g.contorno(F[0]);
    for (const [i, j, k] of [[35, 27, 3], [12, 30, 3], [36, 38, 3], [14, 37, 2], [22, 20, 3], [21, 42, 2], [33, 42, 2], [28, 24, 2]]) mota(g, F, k, i, j);
    for (let i = 21; i <= 33; i++) mota(g, F, Math.abs(i - 27) > 4 ? 1 : 2, i, 46);
    for (let i = 24; i <= 30; i++) mota(g, F, 3, i, 45);
    destello(g, 34, 29, F);
    return g;
  }

  window.MASCOTAS_HD = window.MASCOTAS_HD || {};
  Object.assign(window.MASCOTAS_HD, { lobezno, buho, diablillo, gato, dragoncito, babosa, espiritu });
})();
