/* Dados y Mazmorras · interfaz en pixel art medieval.
   Genera con el motor de píxeles las texturas de 36×36 que visten paneles, botones y fichas
   (madera con herrajes, losas de piedra, cuero, pergamino, laca roja con oro) y los iconos de 36×36
   de la barra. Las texturas se usan como border-image en 9 partes (esquinas de 6 px) a 2 px por píxel. */
const INTERFAZ = (() => {
  "use strict";
  const { Rejilla } = PX;
  const N = 36, B = 6;
  const hash = (x, y, s = 0) => {
    let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) % 1000 / 1000;
  };
  /* Coordenadas locales periódicas del centro (24 px) para que las texturas casen al repetirse. */
  const loc = v => (((v - B) % 24) + 24) % 24;

  /* Marco genérico: fondo(u, v, x, y) pinta el interior; luego el borde con luz arriba-izquierda,
     sombra abajo-derecha y unas placas en las esquinas. */
  function marco(o) {
    const g = new Rejilla(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) g.set(x, y, o.fondo(loc(x), loc(y), x, y));
    const anillo = (x, y) => Math.min(x, y, N - 1 - x, N - 1 - y);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const a = anillo(x, y);
      if (a >= (o.grosor || 4)) continue;
      const arribaIzq = x + y < N - 1 ? (Math.min(x, y) === a) : false;
      const abajoDer = Math.max(x, y) === N - 1 - a && !arribaIzq;
      let c;
      if (a === 0) c = o.contorno || PX.CONTORNO;
      else if (a === 1) c = arribaIzq ? o.luz : abajoDer ? o.sombra : o.borde;
      else if (a === (o.grosor || 4) - 1) c = o.interior || o.sombra;
      else c = o.borde;
      if (o.vetas && a > 0 && a < (o.grosor || 4) - 1 && hash(x, y, 7) < 0.18) c = o.vetas;
      g.set(x, y, c);
    }
    /* Esquinas recortadas para que no parezca un rectángulo de ordenador. */
    [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1]].forEach(([x, y]) => g.quitar(x, y));
    if (o.placa) [[0, 0], [N - B, 0], [0, N - B], [N - B, N - B]].forEach(([px, py]) => o.placa(g, px, py));
    if (o.extra) o.extra(g);
    return g;
  }
  /* Placa de hierro con remache dorado en una esquina de 6×6. */
  const placa = (hierro, remache) => (g, px, py) => {
    for (let j = 1; j < 5; j++) for (let i = 1; i < 5; i++) g.set(px + i, py + j, j === 1 || i === 1 ? hierro[3] : j === 4 || i === 4 ? hierro[0] : hierro[2]);
    g.set(px + 2, py + 2, remache[4]).set(px + 3, py + 2, remache[3]).set(px + 2, py + 3, remache[2]).set(px + 3, py + 3, remache[1]);
  };
  const HIERRO = ["#1b1a22", "#34323f", "#4f4c5c", "#77738a", "#a9a4bd"];
  const ORO = ["#4a2c0e", "#8a5a1c", "#c48a2c", "#f0c25a", "#fff0b0"];
  const BRONCE = ["#2e1b10", "#5c3a1f", "#8a5a30", "#b98448", "#e0b070"];

  /* Remache de un píxel en cada esquina: el único adorno de la interfaz minimalista. */
  const puntos = col => (g, px, py) => { g.set(px + 2, py + 2, col); };
  const TEXTURAS = {
    /* Panel minimalista: fondo liso casi negro con un leve grano, borde de hierro fino y biselado. */
    panel: () => marco({
      grosor: 3, luz: "#5d5868", borde: "#38343f", sombra: "#0d0b10", interior: "#100d12",
      fondo: (u, v) => (hash(u, v, 1) < 0.05 ? "#1d1820" : "#18141b"),
      placa: puntos(ORO[3])
    }),
    /* Versión translúcida para la interfaz que flota sobre el combate. */
    hud: () => marco({
      grosor: 3, luz: "rgba(255,240,210,0.45)", borde: "rgba(70,62,80,0.9)", sombra: "rgba(0,0,0,0.9)", interior: "rgba(0,0,0,0.55)",
      fondo: (u, v) => (hash(u, v, 2) < 0.05 ? "rgba(24,19,28,0.8)" : "rgba(12,9,15,0.72)"),
      placa: puntos(ORO[3])
    }),
    /* Botón: losa lisa con bisel claro arriba y sombra abajo. */
    boton: () => marco({
      grosor: 3, luz: "#7d7790", borde: "#45405a", sombra: "#120f18", interior: "#1d1a26",
      fondo: (u, v) => (v < 2 ? "#3a3548" : hash(u, v, 3) < 0.05 ? "#332f40" : "#2b2737")
    }),
    /* El mismo botón hundido, al pulsar. */
    botonOn: () => marco({
      grosor: 3, luz: "#120f18", borde: "#3a3548", sombra: "#615b74", interior: "#120f18",
      fondo: () => "#221f2c"
    }),
    /* Marco dorado: lo elegido, lo activo. */
    sel: () => marco({
      grosor: 3, luz: ORO[4], borde: ORO[3], sombra: ORO[1], interior: ORO[0],
      fondo: (u, v) => { const n = hash(u, v, 5); return n < 0.1 ? "#3d2e1a" : "#2e2416"; },
      placa: (g, px, py) => { g.set(px + 2, py + 2, ORO[4]).set(px + 3, py + 3, ORO[2]); }
    }),
    /* Laca roja con ribete de oro: el botón principal. */
    oro: () => marco({
      grosor: 3, luz: ORO[4], borde: ORO[2], sombra: ORO[0], interior: "#4a0e14",
      fondo: (u, v) => { const n = hash(u, v, 9); return v < 3 ? "#b8323c" : n < 0.1 ? "#7a1a24" : "#93222e"; },
      placa: (g, px, py) => { g.set(px + 2, py + 2, ORO[4]).set(px + 3, py + 2, ORO[3]).set(px + 2, py + 3, ORO[3]).set(px + 3, py + 3, ORO[1]); }
    }),
    /* Ficha de héroe: translúcida con ribete de bronce fino. */
    carta: () => marco({
      grosor: 2, luz: BRONCE[4], borde: BRONCE[2], sombra: "rgba(0,0,0,0.9)", interior: "rgba(0,0,0,0.6)",
      fondo: (u, v) => (v < 1 ? "rgba(70,48,30,0.75)" : "rgba(16,11,10,0.74)")
    }),
    /* Pergamino: los textos de la historia. */
    pergamino: () => marco({
      grosor: 2, contorno: "#4a3118", luz: "#f6e7c1", borde: "#c9a86c", sombra: "#8a6a3c", interior: "#b8955a",
      fondo: (u, v) => { const n = hash(u, v, 13); return n < 0.06 ? "#d6bb85" : n < 0.12 ? "#f2e2bb" : "#e8d4a6"; }
    }),
    /* Pastilla pequeña (chips) con esquinas de 3 px. */
    chip: () => marco({
      grosor: 2, luz: BRONCE[3], borde: BRONCE[1], sombra: BRONCE[0], interior: "#140d09",
      fondo: () => "#1c130e"
    })
  };
  /* Suelo de mazmorra para el fondo de la página. */
  function losas() {
    const g = new Rejilla(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fila = Math.floor(y / 12), bx = (x + (fila % 2) * 9) % 18, by = y % 12;
      const junta = by === 11 || bx === 17;
      const n = hash(x, y, 17);
      g.set(x, y, junta ? "#07060a" : by === 0 || bx === 0 ? "#1a1720" : n < 0.1 ? "#16131b" : n < 0.2 ? "#0d0b10" : "#121016");
    }
    return g;
  }

  /* ---------- Iconos de 36×36 ---------- */
  const ICONOS = {
    /* Mochila de cuero con hebilla. */
    mochila: () => {
      const g = new Rejilla(N, N);
      const C = PX.Capa;
      new C(N, N).rect(9, 10, 18, 20).rect(10, 9, 16, 1).pintar(g, PX.RAMPAS.madera, { relieve: 3 });
      new C(N, N).rect(11, 5, 14, 2).rect(11, 5, 2, 6).rect(23, 5, 2, 6).pintar(g, PX.RAMPAS.madera, { plano: 1 });
      new C(N, N).rect(9, 10, 18, 7).pintar(g, PX.RAMPAS.madera, { relieve: 2, min: 1, max: 3 });
      new C(N, N).rect(16, 15, 4, 5).pintar(g, ORO, { relieve: 2, min: 2 });
      g.set(17, 17, ORO[0]).set(18, 17, ORO[0]);
      new C(N, N).rect(12, 22, 12, 5).pintar(g, PX.RAMPAS.madera, { relieve: 1, min: 2, max: 3 });
      return g.contorno();
    },
    /* Libro de hechizos cerrado con cierre. */
    menu: () => {
      const g = new Rejilla(N, N), C = PX.Capa;
      new C(N, N).rect(8, 6, 20, 25).pintar(g, PX.RAMPAS.tela.granate, { relieve: 3 });
      new C(N, N).rect(10, 7, 17, 22).pintar(g, PX.RAMPAS.tela.granate, { relieve: 2, min: 2, max: 3 });
      for (let y = 8; y < 29; y++) g.set(27, y, PX.RAMPAS.hueso[y % 2 ? 3 : 4]);
      new C(N, N).ell(18, 17, 4, 4).pintar(g, ORO, { relieve: 2 });
      g.set(18, 17, "#7fd8ff").set(17, 16, "#e8fbff");
      [[9, 7], [9, 28], [26, 7], [26, 28]].forEach(([x, y]) => g.set(x, y, ORO[3]).set(x + 1, y, ORO[2]));
      new C(N, N).rect(27, 15, 3, 5).pintar(g, ORO, { plano: 2 });
      return g.contorno();
    },
    /* Pergamino enrollado con pluma. */
    cronica: () => {
      const g = new Rejilla(N, N), C = PX.Capa;
      new C(N, N).rect(9, 8, 16, 21).pintar(g, PX.RAMPAS.hueso, { relieve: 2 });
      new C(N, N).ell(17, 8, 9, 2).pintar(g, PX.RAMPAS.hueso, { relieve: 2, min: 1 });
      new C(N, N).ell(17, 29, 9, 2).pintar(g, PX.RAMPAS.hueso, { relieve: 2, min: 1 });
      [13, 16, 19, 22].forEach((y, k) => { for (let x = 12; x < 22 - (k === 3 ? 4 : 0); x++) if ((x + y) % 5) g.set(x, y, "#5a4026"); });
      new C(N, N).linea(22, 25, 30, 6, 2).pintar(g, PX.RAMPAS.tela.azul, { relieve: 1 });
      g.set(21, 27, PX.CONTORNO).set(22, 26, PX.CONTORNO);
      return g.contorno();
    },
    /* Flecha de vuelta, tallada en hierro. */
    volver: () => {
      const g = new Rejilla(N, N), C = PX.Capa;
      new C(N, N).poly([[8, 18], [17, 9], [17, 14], [28, 14], [28, 22], [17, 22], [17, 27]]).pintar(g, HIERRO, { relieve: 3 });
      return g.contorno();
    },
    /* Aspa de cierre. */
    cerrar: () => {
      const g = new Rejilla(N, N), C = PX.Capa;
      new C(N, N).linea(10, 10, 26, 26, 4).linea(26, 10, 10, 26, 4).pintar(g, PX.RAMPAS.sangre || HIERRO, { relieve: 2 });
      return g.contorno();
    }
  };

  /* ---------- Hoja de estilo con las texturas ---------- */
  const url = g => `url(${g.aCanvas(1).toDataURL()})`;
  function instalar() {
    if (document.getElementById("estilo-pixel")) return;
    const raiz = document.documentElement.style;
    Object.keys(TEXTURAS).forEach(k => { try { raiz.setProperty(`--px-${k}`, url(TEXTURAS[k]())); } catch (e) { console.error("textura", k, e); } });
    try { raiz.setProperty("--px-losas", url(losas())); } catch (e) { console.error("losas", e); }
  }
  const cache = {};
  function pintarIcono(cv) {
    const k = cv.dataset.pxicono, f = ICONOS[k];
    if (!f) return;
    const img = cache[k] || (cache[k] = f().aCanvas(1));
    const dpr = window.devicePixelRatio || 1, tam = +cv.dataset.tam || 36;
    const s = Math.max(1, Math.round((tam * dpr) / N));
    if (cv.width !== N * s) { cv.width = cv.height = N * s; cv.style.width = cv.style.height = (N * s) / dpr + "px"; }
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(img, 0, 0, N * s, N * s);
  }
  function pintar(raiz = document) { raiz.querySelectorAll("canvas[data-pxicono]").forEach(pintarIcono); }
  instalar();
  return { pintar, instalar, TEXTURAS, ICONOS };
})();
