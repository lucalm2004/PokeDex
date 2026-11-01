/* Dados y Mazmorras · enemigos normales a 64×64 (segunda tanda).
   Cada entrada de MONSTRUOS_64 devuelve una Rejilla nueva de 64×64, con contorno, mirando a la izquierda
   (hacia los héroes) y con los pies en la fila 62 (la 63 solo lleva contorno). Los que flotan (elemental,
   sombra) acaban en llamas o jirones en vez de pies. Misma criatura, paleta y accesorios que en
   monstruos_hd_b.js (48×48), pero con más píxeles: rampas con desplazamiento de matiz (sombras frías,
   luces cálidas), texturas propias de cada material y contorno selectivo. */
(() => {
  "use strict";
  const { Rejilla, Capa, RAMPAS: R, umbral, CONTORNO } = PX;
  const W = 64;
  /* La silueta de cada criatura sale de la de 48×48 escalada (K) y se repinta a la resolución nueva. */
  const K = 4 / 3;

  /* ---------- Rampas propias (5 tonos, de la sombra al brillo) ---------- */
  const NEGRO = ["#08070c", "#16131c", "#2a2430", "#463c48", "#6e6270"];   // pezuñas, cejas, pupilas
  const MARFIL = ["#4a3e3a", "#7d6c60", "#b5a38c", "#e3d5bb", "#fffaec"];  // colmillos, garras, cuernos
  const PELO = ["#22252f", "#3a3f4b", "#5c626b", "#8a8e8a", "#bdb9a7"];    // pelaje gris del huargo
  const LOMO = ["#0e1018", "#191c27", "#272b37", "#3a3f4b", "#555a63"];    // pelaje oscuro del lomo
  const AMBAR = ["#5a1606", "#a83e0c", "#e88618", "#ffc848", "#fff3b4"];   // ojos encendidos
  const ENCIA = ["#22050e", "#4a0c18", "#7e1e2a", "#b63e48", "#e47a76"];   // boca, lengua, encías
  const BABA = ["#34465a", "#587488", "#8aaebc", "#c6e0e6", "#f4fcfd"];    // hilo de baba
  const ACERO = ["#141420", "#292b38", "#4a4d5b", "#7a7e89", "#c3c1ba"];   // hierro pavonado de la armadura
  const GRANATE = ["#1c0612", "#3c0c1a", "#6c1a22", "#a2302c", "#d45c40"]; // capa y tabardo
  const ORO = ["#3a1c08", "#784810", "#c08a22", "#f0c64a", "#fff4b0"];     // emblema, guarnición, monedas
  const AZUL = ["#0a1a36", "#164476", "#2c82bc", "#78ccee", "#e2fbff"];    // luz de dentro de la armadura
  const VACIO = ["#040307", "#0b0711", "#150d1d", "#221630", "#342246"];   // el hueco vacío de la armadura
  const CUERO = ["#1c100c", "#382016", "#5c3822", "#885834", "#b6844e"];   // empuñaduras, correas, bolsa
  const OXIDO = ["#2a0e06", "#55200c", "#8a3e16", "#bc6628", "#e09a4a"];   // manchas de herrumbre
  const ESCAMA = ["#2a0914", "#541524", "#8c282a", "#c44a34", "#ec8852"];  // escamas rojas del kobold
  const VIENTRE = ["#4a1a18", "#7c3424", "#b45a36", "#de8a52", "#f8bc7c"]; // placas del vientre
  const MADERA = ["#1c0e0c", "#3a2016", "#62381e", "#8e5a2e", "#bd8848"];  // astas
  const CUERDA = ["#33240f", "#5a4420", "#886a36", "#b8945a", "#e0c690"];  // la red
  const TELA = ["#2c1008", "#52200e", "#86381a", "#bc5c2c", "#e48c4c"];    // taparrabos terracota
  const FUEGO = ["#480a10", "#9c220e", "#e05612", "#ff9a28", "#ffd75e"];   // llamas
  const CENIZA = ["#2e0608", "#480a10", "#6a1410", "#8e2410", "#b03a14"]; // borde oscuro del fuego
  const CALOR = ["#ff9a28", "#ffc446", "#ffe486", "#fff6cc", "#ffffff"];   // corazón del fuego, hasta el blanco
  const DIABLO = ["#2a0818", "#561226", "#8e1e2c", "#c83c32", "#f0744a"];  // piel del diablillo
  const ALA = ["#170512", "#30091c", "#541224", "#82202e", "#b4403c"];     // membrana de las alas
  const HIERRO = ["#18161a", "#33303a", "#57535c", "#89848a", "#cfc9c2"];  // tridente, puntas
  const QUITINA = ["#08050c", "#140c1c", "#251832", "#3e2a52", "#62487e"]; // caparazón de la araña
  const BRILLO = ["#1c0a2a", "#3a1856", "#6a30a0", "#a066d8", "#dcc0ff"];  // reflejos violetas
  const RELOJ = ["#360408", "#680a10", "#ac1a1a", "#e43c28", "#ff8c5a"];   // reloj de arena y ojos
  const HUMO = ["#06040a", "#110a18", "#201430", "#36234a", "#54386e"];    // cuerpo de la sombra
  const ESPECTRO = ["#1e2c3e", "#3a5a76", "#6892b0", "#9cc4da", "#dcf0f8"]; // ojos y garras pálidas

  /* ---------- Utilidades ---------- */
  /* Capa que solo recorre su recuadro al pintarse (mismo resultado que Capa.pintar, pero más rápido). */
  class Capa64 extends Capa {
    constructor() { super(W, W); }
    pintar(rej, rampa, op = {}) {
      const w = this.w, h = this.h, m = this.m;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return rej;
      if (op.plano !== undefined) {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) rej.set(x, y, rampa[op.plano], rampa);
        return rej;
      }
      const R = op.relieve || 4;
      const d = new Float32Array(w * h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (m[y * w + x]) d[y * w + x] = 1e6;
      const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (d[i]) d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
      }
      for (let y = y1; y >= y0; y--) for (let x = x1; x >= x0; x--) {
        const i = y * w + x;
        if (d[i]) d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
      }
      /* Altura del relieve (0 fuera de la capa), precalculada en el recuadro y un píxel de margen. */
      const A = new Float32Array(w * h);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (!m[i]) continue;
        const v = Math.min(d[i], R) / R;
        A[i] = Math.sqrt(1 - (1 - v) * (1 - v));
      }
      const alto = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : A[y * w + x]);
      const L = op.luz || [-0.5, -0.62, 0.6];
      const ln = Math.hypot(L[0], L[1], L[2]);
      const lx = L[0] / ln, ly = L[1] / ln, lz = L[2] / ln;
      const k = op.fuerza || 2.4, sesgo = op.sesgo || 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!m[y * w + x]) continue;
        const nx = (alto(x - 1, y) - alto(x + 1, y)) * 0.5 * k;
        const ny = (alto(x, y - 1) - alto(x, y + 1)) * 0.5 * k;
        const nl = Math.hypot(nx, ny, 1);
        const l = (nx * lx + ny * ly + lz) / nl + sesgo;
        let t = l > 0.965 ? 4 : l > 0.74 ? 3 : l > 0.4 ? 2 : l > 0.02 ? 1 : 0;
        if (t === 0 && !op.profundo) t = 1;
        if (op.max !== undefined) t = Math.min(t, op.max);
        if (op.min !== undefined) t = Math.max(t, op.min);
        if (op.separar) {
          const borde = (!this.tiene(x + 1, y) && rej.get(x + 1, y)) || (!this.tiene(x - 1, y) && rej.get(x - 1, y)) ||
            (!this.tiene(x, y + 1) && rej.get(x, y + 1)) || (!this.tiene(x, y - 1) && rej.get(x, y - 1));
          if (borde) t = Math.min(t, op.separar === true ? 1 : op.separar);
        }
        rej.set(x, y, rampa[Math.min(t, rampa.length - 1)], rampa);
      }
      return rej;
    }
    copia() { const o = new Capa64(); o.m = this.m.slice(); return o; }
  }
  const capa = () => new Capa64();
  /* Capa en coordenadas de la versión de 48×48: escala por K y desplaza (dx, dy). */
  class Molde {
    constructor(dx = 0, dy = 0) { this.c = new Capa64(); this.dx = dx; this.dy = dy; }
    p(x, y) { return [x * K + this.dx, y * K + this.dy]; }
    ell(x, y, rx, ry = rx) { const [a, b] = this.p(x, y); this.c.ell(a, b, rx * K, ry * K); return this; }
    quitarEll(x, y, rx, ry = rx) { const [a, b] = this.p(x, y); this.c.quitarEll(a, b, rx * K, ry * K); return this; }
    poly(pts) { this.c.poly(pts.map(([x, y]) => this.p(x, y))); return this; }
    rect(x, y, w, h) { return this.poly([[x - 0.5, y - 0.5], [x + w - 0.5, y - 0.5], [x + w - 0.5, y + h - 0.5], [x - 0.5, y + h - 0.5]]); }
    linea(x0, y0, x1, y1, gr = 1) { const [a, b] = this.p(x0, y0), [c, d] = this.p(x1, y1); this.c.linea(a, b, c, d, Math.max(1, Math.round(gr * K))); return this; }
    curva(x0, y0, cx, cy, x1, y1, gr = 1, g1 = gr) {
      const [a, b] = this.p(x0, y0), [c, d] = this.p(cx, cy), [e, f] = this.p(x1, y1);
      this.c.curva(a, b, c, d, e, f, gr * K, g1 * K); return this;
    }
    /* Lengua de fuego o mechón: triángulo de la base (x0..x1, y) a una punta. */
    lengua(x0, x1, y, px, py) { return this.poly([[x0, y], [px, py], [x1, y]]); }
    pintar(g, ram, op = {}) { return this.c.pintar(g, ram, { ...op, relieve: (op.relieve || 4) * K }); }
  }
  const lengua = (c, x0, x1, y, px, py) => c.poly([[x0, y], [px, py], [x1, y]]);
  /* Varios píxeles del mismo tono de una rampa. */
  const pon = (g, ram, i, ...pts) => { for (const [x, y] of pts) g.set(x, y, ram[i], ram); return g; };
  /* Solo donde ya hay algo pintado (para detalles que no deben salirse de la silueta). */
  const sobre = (g, ram, i, ...pts) => { for (const [x, y] of pts) if (g.get(x, y)) g.set(x, y, ram[i], ram); return g; };
  /* Pinta una capa solo donde no hay nada todavía, como si quedara detrás. */
  function detras(g, c, ram, op) {
    c = c.c || c;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (g.get(x, y)) c.off(x, y);
    return c.pintar(g, ram, op);
  }
  /* Rellena una capa con un degradado tramado entre dos tonos; f(x, y) va de 0 a 1. */
  function tramar(g, c, ram, i0, i1, f) {
    c = c.c || c;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (c.tiene(x, y)) g.set(x, y, ram[f(x, y) > umbral(x, y) ? i1 : i0], ram);
  }
  /* Línea fina sin contorno: solo pinta los píxeles vacíos. */
  function hilo(g, x0, y0, x1, y1, ram, i) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (!g.get(x, y)) g.set(x, y, ram[i], ram);
    }
  }
  /* Trazo de un tono sobre lo ya pintado (pliegues, juntas, vetas). */
  function trazo(g, x0, y0, x1, y1, ram, i, mascara = null) {
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= pasos; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / pasos), y = Math.round(y0 + ((y1 - y0) * s) / pasos);
      if (g.get(x, y) && (!mascara || mascara.tiene(x, y))) g.set(x, y, ram[i], ram);
    }
  }
  /* Cambia de tono (±d) los píxeles de una rampa que caen dentro de la capa. */
  function tono(g, c, ram, d, cond = () => true) {
    c = c.c || c;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y) || g.rampa(x, y) !== ram || !cond(x, y)) continue;
      const k = ram.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, ram[Math.max(0, Math.min(4, k + d))], ram);
    }
  }
  /* Un píxel un tono más claro u oscuro dentro de su propia rampa. */
  function matiz(g, x, y, d) {
    const ram = g.rampa(x, y);
    if (!ram) return;
    const k = ram.indexOf(g.get(x, y));
    if (k >= 0) g.set(x, y, ram[Math.max(0, Math.min(4, k + d))], ram);
  }
  /* Pasa a otra rampa (mismo índice de tono) los píxeles de una rampa dentro de la capa. */
  function cambiar(g, c, de, a, cond = () => true) {
    c = c.c || c;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y) || g.rampa(x, y) !== de || !cond(x, y)) continue;
      const k = de.indexOf(g.get(x, y));
      if (k >= 0) g.set(x, y, a[k], a);
    }
  }
  /* Borde iluminado arriba a la izquierda, para que lo muy oscuro se lea sobre fondos oscuros. */
  function bordeLuz(g, ram, t = 3, cond = () => true) {
    const borde = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (g.rampa(x, y) === ram && cond(x, y) && (!g.get(x - 1, y) || !g.get(x, y - 1)) && ram.indexOf(g.get(x, y)) < t) borde.push([x, y]);
    pon(g, ram, t, ...borde);
  }
  /* Filo de luz: los píxeles de la capa que dan a la izquierda (o arriba) suben al tono t. */
  function filo(g, c, ram, t, { arriba = false, cond = () => true } = {}) {
    c = c.c || c;
    const pts = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y) || g.rampa(x, y) !== ram || !cond(x, y)) continue;
      if ((!c.tiene(x - 1, y) || (arriba && !c.tiene(x, y - 1))) && ram.indexOf(g.get(x, y)) < t) pts.push([x, y]);
    }
    pon(g, ram, t, ...pts);
  }
  /* Metal pulido: bandas verticales de reflejo según la posición dentro de cada fila de la capa
     (borde, luz, brillo duro, medio, reflejo oscuro y rebote de luz al otro lado). */
  const BANDAS = [[0.1, 2], [0.27, 3], [0.36, 4], [0.56, 2], [0.84, 1], [1.01, 2]];
  function metal(g, c, ram, { bandas = BANDAS, arriba = 1, separar = true } = {}) {
    c = c.c || c;
    let y0 = W;
    for (let y = 0; y < W && y0 === W; y++) for (let x = 0; x < W; x++) if (c.tiene(x, y)) { y0 = y; break; }
    for (let y = 0; y < W; y++) {
      let a = -1, b = -1;
      for (let x = 0; x < W; x++) if (c.tiene(x, y)) { if (a < 0) a = x; b = x; }
      if (a < 0) continue;
      for (let x = a; x <= b; x++) {
        if (!c.tiene(x, y)) continue;
        const u = b > a ? (x - a) / (b - a) : 0.5;
        let t = bandas.find(([lim]) => u < lim)[1];
        if (y - y0 < arriba && t < 4) t++;
        if (separar && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => !c.tiene(x + i, y + j) && g.get(x + i, y + j))) t = Math.min(t, 1);
        g.set(x, y, ram[t], ram);
      }
    }
  }
  /* Sombra propia de un volumen redondo: un tono menos en el lado contrario a la luz (abajo a la
     derecha de (cx, cy)), con el corte tramado para que no quede una línea dura. */
  function sombraPropia(g, c, ram, cx, cy, corte, d = -1) {
    tono(g, c, ram, d, (x, y) => (x - cx) * 0.6 + (y - cy) * 0.8 + (umbral(x, y) - 0.5) * 2.2 > corte);
  }
  /* Perfil interior: oscurece lo ya pintado justo alrededor de la capa, para despegarla de lo de detrás. */
  function perfil(g, c, ram, i = 0) {
    c = c.c || c;
    const pts = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++)
      if (!c.tiene(x, y) && g.get(x, y) && (c.tiene(x + 1, y) || c.tiene(x - 1, y) || c.tiene(x, y + 1) || c.tiene(x, y - 1))) pts.push([x, y]);
    pon(g, ram, i, ...pts);
  }
  /* Distancia (aproximada) de cada píxel de la capa a su borde. */
  function distancia(c) {
    const d = new Float32Array(W * W);
    for (let i = 0; i < d.length; i++) d[i] = c.m[i] ? 1e6 : 0;
    const D = (x, y) => (x < 0 || y < 0 || x >= W || y >= W ? 0 : d[y * W + x]);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (d[i]) d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414);
    }
    for (let y = W - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (d[i]) d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414);
    }
    return d;
  }
  /* Pinta algo que da luz propia (fuego): más claro cuanto más hacia dentro, con tramado en los saltos. */
  function brasa(g, c, ram, cortes, base = 0, sesgo = () => 0, trama = 0.8) {
    c = c.c || c;
    const d = distancia(c);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y)) continue;
      const v = d[y * W + x] + sesgo(x, y) + (umbral(x, y) - 0.5) * trama;
      let t = base;
      for (const k of cortes) if (v > k) t++;
      g.set(x, y, ram[Math.min(4, t)], ram);
    }
  }
  /* Pelaje: mechones cortos en la dirección del pelo (oscuros) con la punta de arriba iluminada.
     Repartidos en una rejilla con algo de holgura para que no se amontonen. */
  function pelaje(g, c, ram, az, { paso = 3, largo = 3, dx = 1, dy = 1, luz = true, cond = () => true } = {}) {
    c = c.c || c;
    for (let y0 = 0; y0 < W; y0 += paso) for (let x0 = (y0 / paso) % 2 ? 2 : 0; x0 < W; x0 += paso + 1) {
      const x = x0 + Math.floor(az() * 2), y = y0 + Math.floor(az() * 2);
      if (!c.tiene(x, y) || g.rampa(x, y) !== ram || !cond(x, y)) continue;
      const k0 = ram.indexOf(g.get(x, y));
      if (k0 < 1) continue;
      const n = largo - (az() < 0.4 ? 1 : 0);
      for (let s = 0; s < n; s++) {
        const px = Math.round(x + dx * s), py = Math.round(y + dy * s);
        if (!c.tiene(px, py) || g.rampa(px, py) !== ram) break;
        const k = ram.indexOf(g.get(px, py));
        if (k > 0) g.set(px, py, ram[k - 1], ram);
      }
      if (luz && k0 >= 3 && k0 < 4 && c.tiene(x - dx, y - dy) && g.rampa(x - dx, y - dy) === ram) {
        const k = ram.indexOf(g.get(x - dx, y - dy));
        if (k >= 2) g.set(x - dx, y - dy, ram[Math.min(4, k + 1)], ram);
      }
    }
  }
  /* Escamas en hileras: cada escama es un arco (∪) más oscuro; las hileras se alternan a media escama.
     Con luz, un punto claro dentro de la escama donde ya da la luz. */
  function escamas(g, c, ram, { cond = () => true, luz = false } = {}) {
    c = c.c || c;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!c.tiene(x, y) || g.rampa(x, y) !== ram || !cond(x, y)) continue;
      const fila = y >> 1, u = (x + (fila & 1) * 2) & 3, v = y & 1;
      const k = ram.indexOf(g.get(x, y));
      if (k < 1) continue;
      if ((v === 0 && u === 0) || (v === 1 && (u === 1 || u === 2))) g.set(x, y, ram[k - 1], ram);
      else if (luz && v === 0 && u === 2 && k === 3) g.set(x, y, ram[4], ram);
    }
  }
  /* Contorno selectivo: oscuro por fuera; en los bordes de arriba y de la izquierda (de cara a la luz),
     teñido con la sombra del material de al lado, y algo más claro si ese material está muy iluminado. */
  function contornear(g, color = CONTORNO, ramColor = null) {
    const nuevos = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (g.get(x, y)) continue;
      const ab = g.get(x, y + 1), de = g.get(x + 1, y), iz = g.get(x - 1, y), ar = g.get(x, y - 1);
      if (!(ab || de || iz || ar)) continue;
      let col = color, ram = ramColor;
      if (!iz && !ar) {
        const [vx, vy] = ab ? [x, y + 1] : [x + 1, y], r = g.rampa(vx, vy);
        if (r) { ram = r; col = r.indexOf(g.get(vx, vy)) >= 3 ? r[1] : r[0]; }
      }
      nuevos.push([x, y, col, ram]);
    }
    for (const [x, y, col, ram] of nuevos) g.set(x, y, col, ram);
    return g;
  }
  /* Destello de cuatro puntas, sin contorno. */
  function destello(g, x, y, ram, brazo = 1) {
    pon(g, ram, 4, [x, y]);
    for (let s = 1; s <= brazo; s++)
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!g.get(x + a * s, y + b * s)) pon(g, ram, s === 1 ? 3 : 2, [x + a * s, y + b * s]);
  }

  /* ---------- Huargo: un lobo enorme, agazapado y gruñendo, con el lomo erizado ---------- */
  function lobo() {
    const g = new Rejilla(W, W), G = PELO, D = LOMO;
    const az = PX.azar(7);
    const m = () => new Molde(1, 0);
    /* Cola tupida, baja y tensa. */
    const cola = m().curva(38, 26, 45, 27, 44.5, 37, 5.2, 2.5);
    cola.lengua(43.5, 46, 30, 45.8, 33.5).lengua(42.5, 45, 34, 45, 38.8).lengua(40, 43, 28, 44, 25.6).lengua(41, 44.5, 32, 45.6, 30);
    cola.pintar(g, D, { relieve: 2, max: 3 });
    pelaje(g, cola, D, az, { paso: 2, largo: 3, dx: 0.4, dy: 1 });
    /* Patas del lado de lejos, en sombra. */
    m().ell(36, 32, 4, 5).linea(37, 35, 40, 40, 3).linea(40, 40, 39, 44, 2).ell(38.5, 45.4, 2.4, 1.3)
      .linea(21, 32, 22, 43, 3).ell(21, 45.4, 2.5, 1.3).pintar(g, D, { relieve: 1.5, max: 2 });
    pon(g, MARFIL, 2, [50, 62], [52, 62], [27, 62], [25, 62]);
    /* Cuerpo: pecho hondo, lomo arqueado y el pelo de la cruz de punta. */
    const cuerpo = m().ell(28, 29.5, 11, 6.5).ell(19, 29, 7.5, 8).ell(36, 30, 5, 6);
    for (const [x, b, h] of [[12, 24, 3], [14.5, 22.5, 4.5], [17.5, 21.5, 6], [20.5, 21.5, 6.5], [23.5, 22.5, 5.5], [26.5, 23, 4.5], [29.5, 23, 3.5], [32.5, 23.5, 3], [35.5, 24.5, 2.5], [38, 26, 1.8]])
      cuerpo.poly([[x - 2, b + 1.5], [x + 2.2, b - h], [x + 1.8, b + 1.5]]);
    for (const x of [21, 25, 29, 33]) cuerpo.lengua(x - 1.6, x + 1.4, 35, x - 0.4, 38.2);
    cuerpo.pintar(g, G, { relieve: 4, separar: true });
    /* Lomo más oscuro, con un borde tramado que ondula. */
    cambiar(g, cuerpo, G, D, (x, y) => y < 34.2 + Math.sin(x * 0.55) * 1.6 + (umbral(x, y) > 0.5 ? 1 : 0));
    pelaje(g, cuerpo, G, az, { paso: 3, largo: 3, dx: 1, dy: 1 });
    pelaje(g, cuerpo, D, az, { paso: 2, largo: 3, dx: 0.7, dy: 1 });
    /* Las púas del lomo con la punta iluminada. */
    for (const [x, y] of [[20, 25], [24, 23], [28, 23], [32, 25], [36, 26], [40, 28], [44, 29]]) {
      for (let j = 0; j < 4; j++) if (cuerpo.c.tiene(x + j, y + j)) { pon(g, D, 3, [x, y + j]); break; }
    }
    /* Pechera más clara, con mechones que cuelgan. */
    tono(g, m().ell(15, 31, 4, 5.2), G, 1, (x, y) => y > 39);
    /* Sombra propia bajo el vientre: el pelo se oscurece hacia abajo, con el corte tramado. */
    tono(g, cuerpo, G, -1, (x, y) => x > 22 && y > 45.5 - (x > 40 ? (x - 40) * 0.3 : 0) + (umbral(x, y) > 0.5 ? 1 : 0));
    for (const [x, y] of [[17, 44], [19, 46], [21, 45], [23, 47]]) { pon(g, G, 4, [x, y]); pon(g, G, 2, [x + 1, y + 1]); }
    /* Una cicatriz vieja en la paletilla. */
    trazo(g, 28, 39, 31, 43, ENCIA, 1, cuerpo.c);
    trazo(g, 29, 39, 32, 43, G, 4, cuerpo.c);
    /* Patas de este lado: la delantera recta y la trasera con el corvejón. */
    const pd = m().linea(16, 31, 14, 39, 4).linea(14, 39, 13, 43, 3).ell(11.5, 45.2, 3, 1.6);
    pd.pintar(g, G, { relieve: 2, separar: true });
    filo(g, pd, G, 3, { cond: (x, y) => y > 44 && y < 59 });
    tono(g, pd, G, -1, (x, y) => x > 20 && y > 46);
    const pt = m().ell(33, 32.5, 5, 5.5).linea(34, 36, 37, 40, 3).linea(37, 40, 36, 44, 2).ell(34, 45.4, 2.8, 1.3);
    pt.pintar(g, G, { relieve: 2.5, separar: true });
    pelaje(g, pt, G, az, { paso: 3, largo: 3, dx: 0.6, dy: 1, cond: (x, y) => y < 50 });
    tono(g, pt, G, -1, (x, y) => y > 52 && x > 47);
    /* Dedos y garras. */
    pon(g, G, 1, [14, 60], [17, 60], [20, 60], [45, 61], [48, 61]);
    pon(g, MARFIL, 4, [11, 62], [14, 62], [43, 62]);
    pon(g, MARFIL, 3, [12, 62], [17, 62], [46, 62]);
    pon(g, MARFIL, 2, [15, 62], [18, 62], [47, 62]);
    /* Cabeza gacha, orejas aplastadas, hocico arrugado y las fauces abiertas. */
    m().poly([[10, 22.5], [13.5, 17.5], [14, 23]]).pintar(g, D, { relieve: 1.5, max: 2 });
    const cab = m().ell(12, 26, 5.5, 4.8)
      .poly([[10, 23.5], [3, 25.5], [1, 27.2], [1.5, 29.4], [11, 30]])
      .poly([[11, 31.4], [3.5, 32.2], [4.5, 34.4], [12, 34]]);
    cab.lengua(15, 17.5, 24, 21, 20.5); // oreja
    for (const [y, h] of [[27, 3], [29.5, 3.5], [32, 2.5]]) cab.poly([[16, y - 1.5], [16 + h + 1.5, y + 0.5], [16, y + 1.5]]); // gorguera
    cab.pintar(g, G, { relieve: 3, separar: true });
    pelaje(g, cab, G, az, { paso: 3, largo: 2, dx: 1, dy: 0.5, cond: (x) => x > 17 });
    /* Lo de dentro de la oreja. */
    const oreja = capa().poly([[21, 30], [27, 27.5], [23, 32]]);
    tono(g, oreja, G, -2);
    /* Fauces: el hueco de la boca, encía, lengua y colmillos. */
    const boca = capa().poly([[3.5, 39.4], [17, 38.6], [17, 42.8], [5.5, 42.8]]);
    detras(g, boca, ENCIA, { plano: 0 });
    for (let x = 4; x <= 16; x++) { if (g.rampa(x, 39) === G) pon(g, ENCIA, 2, [x, 39]); }
    for (let x = 6; x <= 16; x++) if (g.rampa(x, 43) === G || g.rampa(x, 42) === ENCIA) pon(g, ENCIA, 1, [x, 42]);
    pon(g, ENCIA, 3, [9, 41], [10, 41], [11, 41], [12, 42], [10, 42]);
    pon(g, ENCIA, 4, [10, 41]);
    /* Colmillos de arriba (hacia abajo) y de abajo (hacia arriba). */
    pon(g, MARFIL, 4, [4, 40], [4, 41], [7, 40], [12, 40], [14, 40]);
    pon(g, MARFIL, 3, [4, 42], [5, 40], [7, 41], [9, 40], [13, 40]);
    pon(g, MARFIL, 2, [5, 41], [15, 40]);
    pon(g, MARFIL, 4, [6, 42], [8, 42], [6, 41]);
    pon(g, MARFIL, 3, [13, 42], [14, 42]);
    /* Un hilo de baba que cuelga de la mandíbula. */
    hilo(g, 9, 47, 9, 48, BABA, 2);
    pon(g, BABA, 4, [9, 49]);
    /* Trufa húmeda con brillo. */
    pon(g, NEGRO, 1, [2, 35], [2, 36], [3, 35], [2, 37]);
    pon(g, NEGRO, 0, [3, 37]);
    pon(g, NEGRO, 4, [2, 35]);
    pon(g, G, 4, [3, 34], [4, 34]);
    /* Arrugas del gruñido, ceño y ojo ámbar que brilla. */
    for (const [x, y] of [[5, 35], [6, 34], [8, 35], [9, 34], [11, 35], [6, 37], [8, 37], [10, 37]]) { pon(g, G, 1, [x, y]); if (g.get(x + 1, y + 1)) matiz(g, x + 1, y + 1, 1); }
    pon(g, NEGRO, 1, [11, 31], [12, 31], [13, 31], [14, 32], [15, 32], [10, 32]);
    pon(g, AMBAR, 3, [12, 33], [13, 33]);
    pon(g, AMBAR, 4, [12, 33]);
    pon(g, AMBAR, 2, [14, 33], [13, 34]);
    pon(g, NEGRO, 0, [15, 33], [14, 34]);
    pon(g, AMBAR, 1, [11, 33]);
    pon(g, G, 1, [12, 35], [13, 35], [14, 35]);
    /* Bigotes de la mandíbula. */
    pon(g, G, 1, [8, 45], [10, 46], [12, 45], [15, 45]);
    bordeLuz(g, D, 3, (x, y) => y < 40);
    return contornear(g);
  }

  /* ---------- Armadura animada: placas de hierro sin nadie dentro, ojos azules en la celada y un mandoble ---------- */
  function armadura() {
    const g = new Rejilla(W, W), F = ACERO, Gr = GRANATE, V = VACIO, Az = AZUL, O = ORO;
    const m = () => new Molde(0, 0);
    /* Capa raída a la espalda, con pliegues. */
    const manto = m().poly([[26, 16], [33, 16], [38.5, 27], [42.5, 44], [33, 45], [28, 40]]);
    for (const [x, y] of [[31.5, 41], [35.5, 39], [39.5, 41.5]]) manto.c.restar(m().poly([[x - 1.4, 46], [x, y], [x + 1.4, 46]]).c);
    manto.pintar(g, Gr, { relieve: 2.5, max: 2 });
    /* Pliegues: un surco oscuro y su canto iluminado, abriéndose hacia el bajo. */
    for (const [x0, y0, x1, y1] of [[44, 26, 46, 55], [48, 34, 51, 56], [51, 44, 54, 57]]) { trazo(g, x0, y0, x1, y1, Gr, 0, manto.c); trazo(g, x0 - 1, y0 + 2, x1 - 1, y1, Gr, 2, manto.c); }
    /* Lo de dentro: vacío oscuro, que se ve por las juntas. */
    m().rect(19, 14, 10, 30).pintar(g, V, { relieve: 2, max: 1 });
    /* Pierna de atrás. */
    m().rect(27, 35, 5, 8).pintar(g, F, { relieve: 1.5, max: 2, separar: true });
    m().ell(29.5, 38.5, 3, 2.2).pintar(g, F, { relieve: 1.5, max: 2, separar: true });
    m().poly([[25, 46.6], [26.5, 43], [32.5, 43], [33, 46.6]]).pintar(g, F, { relieve: 1.5, max: 2, separar: true });
    /* Hombrera de atrás. */
    m().ell(30.5, 19.5, 4.5, 4).pintar(g, F, { relieve: 2, max: 2, separar: true });
    /* Peto abombado, con una arista central, ristre y remaches. */
    const peto = m().poly([[17, 18], [30, 18], [31.5, 23], [29.5, 30.5], [18.5, 30.5], [16, 23]]);
    metal(g, peto, F, { arriba: 2 });
    /* La curva del peto: el pecho abombado brilla más arriba y se apaga hacia la cintura. */
    tono(g, peto, F, -1, (x, y) => y > 32 + (umbral(x, y) > 0.5 ? 1 : 0) && g.get(x, y) !== F[4]);
    for (let x = 22; x <= 40; x++) if (peto.c.tiene(x, 35)) pon(g, F, 1, [x, 35]);
    for (let x = 23; x <= 39; x++) if (peto.c.tiene(x, 36)) pon(g, F, x < 30 ? 3 : 2, [x, 36]);
    for (const x of [25, 31, 37]) { pon(g, F, 4, [x, 37]); pon(g, F, 1, [x + 1, 38]); }
    /* Destello en el pecho. */
    pon(g, MARFIL, 4, [28, 27]);
    destello(g, 28, 27, MARFIL, 0);
    /* Faldar: tres láminas solapadas. */
    for (let i = 0; i < 3; i++) {
      const l = m().poly([[18 - i * 0.7, 30.5 + i * 2], [30 + i * 0.6, 30.5 + i * 2], [30.5 + i * 0.6, 32.5 + i * 2], [17.5 - i * 0.7, 32.5 + i * 2]]);
      l.pintar(g, F, { relieve: 1.2, separar: true });
      const y = Math.round((30.5 + i * 2) * K) + 1;
      for (let x = 22; x <= 42; x++) if (l.c.tiene(x, y) && g.rampa(x, y) === F) pon(g, F, x < 25 ? 3 : 2, [x, y]);
    }
    /* Tabardo hecho jirones colgando por delante, con el sol de oro. */
    const tab = m().poly([[20, 30], [26, 30], [26.5, 40.8], [24.5, 39.5], [23, 41.5], [21.5, 39.8], [19.5, 40.8]]);
    tab.pintar(g, Gr, { relieve: 1.5, separar: true });
    trazo(g, 28, 46, 28, 53, Gr, 1, tab.c); trazo(g, 33, 45, 33, 52, Gr, 2, tab.c);
    trazo(g, 27, 41, 34, 41, O, 2, tab.c); trazo(g, 27, 42, 34, 42, Gr, 1, tab.c);
    /* El sol de oro bordado: disco con el centro granate y ocho rayos. */
    const SOL = ["...r...", ".r...r.", "..aab..", "r.aGb.r", "..bbb..", ".r...r.", "...r..."];
    SOL.forEach((fila, j) => [...fila].forEach((ch, i) => {
      const x = 28 + i, y = 44 + j;
      if (ch === "r") pon(g, O, j < 3 ? 3 : 2, [x, y]);
      else if (ch === "a") pon(g, O, 4, [x, y]);
      else if (ch === "b") pon(g, O, 2, [x, y]);
      else if (ch === "G") pon(g, Gr, 1, [x, y]);
    }));
    /* Pierna de delante: muslera, rodillera, greba y escarpe puntiagudo. */
    for (const pieza of [m().rect(18, 36, 5, 4), m().rect(18, 41, 5, 3)]) { pieza.pintar(g, F, { relieve: 1.5, separar: true }); metal(g, pieza, F); }
    const rodilla = m().ell(20.5, 40, 3, 2);
    rodilla.pintar(g, F, { relieve: 1.5, min: 2, separar: true });
    metal(g, rodilla, F, { arriba: 1, separar: false });
    pon(g, F, 1, [26, 55], [27, 55], [28, 55], [29, 55]);
    pon(g, MARFIL, 4, [26, 52]);
    const escarpe = m().poly([[13, 46.6], [15, 43.6], [18, 43], [23.5, 43], [23.5, 46.6]]);
    escarpe.pintar(g, F, { relieve: 1.5, separar: true });
    filo(g, escarpe, F, 3, { arriba: true });
    for (let x = 19; x <= 31; x++) if (g.rampa(x, 60) === F) pon(g, F, 1, [x, 60]);
    pon(g, F, 4, [20, 59], [21, 59], [22, 58]);
    /* Cresta de crin roja, con hebras. */
    const cresta = m().curva(21, 3.5, 28, 1, 34, 6, 3, 1.5);
    cresta.lengua(31, 34, 5, 37, 9.5).lengua(28, 31, 4, 34, 9.2).lengua(33, 35.5, 7, 37.6, 12.5);
    cresta.pintar(g, Gr, { relieve: 1.5, separar: true });
    pelaje(g, cresta, Gr, PX.azar(3), { paso: 2, largo: 3, dx: 1, dy: 1 });
    pon(g, Gr, 4, [30, 2], [31, 2], [32, 2], [29, 3]);
    /* Yelmo cerrado: frente plana hacia la izquierda, rendija de los ojos y respiraderos. */
    const yelmo = m().ell(24, 9, 6, 5.6).rect(18, 9, 12, 7);
    yelmo.c.off(39, 20).off(39, 21).off(24, 20).off(24, 21);
    yelmo.pintar(g, F, { relieve: 4, separar: true });
    for (let y = 6; y <= 21; y++) if (yelmo.c.tiene(25, y)) pon(g, F, 3, [24, y]);
    /* Arista del yelmo y el borde del visor. */
    for (let x = 24; x <= 38; x++) if (yelmo.c.tiene(x, 11)) pon(g, F, x < 31 ? 4 : 3, [x, 11]);
    for (let x = 25; x <= 38; x++) if (yelmo.c.tiene(x, 12)) pon(g, F, 1, [x, 12]);
    pon(g, MARFIL, 4, [28, 7], [29, 6], [27, 8]);
    pon(g, F, 4, [30, 6], [31, 6], [26, 9]);
    /* Rendija del visor, con la luz azul de dentro. */
    for (let x = 23; x <= 31; x++) pon(g, V, 0, [x, 13], [x, 14]);
    for (let x = 24; x <= 31; x++) pon(g, F, 1, [x, 15]);
    pon(g, Az, 4, [25, 13], [29, 13]);
    pon(g, Az, 3, [24, 13], [26, 13], [28, 13], [30, 13], [25, 14], [29, 14]);
    pon(g, Az, 2, [23, 13], [27, 14], [31, 13], [24, 14], [30, 14]);
    pon(g, Az, 1, [26, 14], [28, 14]);
    for (const [x, y] of [[24, 12], [25, 12], [26, 12], [28, 12], [29, 12], [30, 12]]) pon(g, Az, 1, [x, y]);
    /* Respiraderos. */
    for (const [x, y] of [[25, 17], [27, 17], [29, 17], [25, 19], [27, 19], [29, 19], [31, 18]]) { pon(g, V, 1, [x, y]); pon(g, F, 3, [x, y - 1]); }
    pon(g, Az, 2, [27, 19]);
    /* Bisagra de la celada. */
    for (let y = 12; y <= 20; y++) pon(g, F, 1, [35, y]);
    pon(g, F, 4, [36, 15]); pon(g, F, 3, [36, 16]); pon(g, F, 0, [37, 16]);
    /* Gola: hueco oscuro bajo el yelmo, con el brillo azul de dentro. */
    m().rect(20, 16, 8, 2).pintar(g, V, { relieve: 1, max: 2, separar: true });
    pon(g, Az, 1, [30, 22], [32, 23], [31, 22], [33, 22]);
    pon(g, Az, 2, [31, 22], [32, 22]);
    pon(g, Az, 3, [32, 22]);
    /* Hombrera de delante con tres láminas. */
    const hom = m().ell(17.5, 19.5, 5.5, 4.2);
    hom.pintar(g, F, { relieve: 3, separar: true });
    for (const y of [28, 31]) for (let x = 15; x <= 31; x++) if (hom.c.tiene(x, y) && hom.c.tiene(x, y + 2)) { pon(g, F, 1, [x, y]); if (hom.c.tiene(x, y + 1)) pon(g, F, x < 21 ? 3 : 2, [x, y + 1]); }
    pon(g, F, 4, [19, 23], [20, 23], [21, 22], [18, 24]);
    pon(g, MARFIL, 4, [20, 22]);
    pon(g, F, 4, [25, 24]); pon(g, F, 1, [26, 25]);
    /* Brazo: codal, avambrazo y los guanteletes cerrados sobre el puño del mandoble. */
    m().linea(16, 22, 14, 26, 4).pintar(g, F, { relieve: 1.5, separar: true });
    pon(g, V, 0, [20, 35], [21, 35]);
    m().ell(14, 27, 2.4, 1.8).pintar(g, F, { relieve: 1.5, min: 2, separar: true });
    m().linea(14, 28, 12, 30, 4).pintar(g, F, { relieve: 1.5, separar: true });
    pon(g, F, 4, [17, 34], [17, 35]);
    /* Mandoble alzado: hoja de plata con su canal, gavilanes de oro y empuñadura de cuero. */
    const hoja = m().rect(8, 3, 3, 24).poly([[8, 3.5], [9.5, -0.6], [11, 3.5]]);
    hoja.pintar(g, F, { relieve: 1, min: 2, separar: true });
    for (let y = 4; y <= 34; y++) {
      if (!hoja.c.tiene(13, y)) continue;
      pon(g, F, 1, [13, y]);
      pon(g, F, 3, [11, y]);
      pon(g, F, 2, [12, y]); pon(g, F, 2, [14, y]);
    }
    for (let y = 3; y <= 34; y++) if (hoja.c.tiene(10, y)) pon(g, F, 4, [10, y]);
    for (const y of [6, 7, 8, 16, 17, 25]) sobre(g, MARFIL, 4, [11, y]);
    pon(g, MARFIL, 4, [12, 2], [12, 3]);
    /* Mellas en el filo. */
    pon(g, F, 1, [10, 20], [10, 28], [14, 12]);
    destello(g, 12, 1, MARFIL, 1);
    m().rect(4, 27, 11, 2).pintar(g, O, { relieve: 1, min: 2, separar: true });
    pon(g, O, 4, [6, 36], [7, 36], [8, 36]);
    pon(g, O, 1, [12, 37], [13, 37], [14, 37]);
    m().ell(4.3, 28, 1.3, 1.3).ell(14.7, 28, 1.3, 1.3).pintar(g, O, { relieve: 1, min: 2, separar: true });
    pon(g, O, 4, [5, 36], [19, 36]);
    m().rect(8, 29, 3, 6).pintar(g, CUERO, { relieve: 1, max: 2 });
    for (let y = 39; y <= 46; y += 2) { pon(g, CUERO, 3, [11, y], [12, y]); pon(g, CUERO, 1, [13, y], [14, y]); }
    m().ell(9.5, 35.8, 1.6, 1.3).pintar(g, O, { relieve: 1, min: 2, separar: true });
    pon(g, ENCIA, 3, [12, 47]); pon(g, ENCIA, 4, [12, 47]);
    m().rect(7, 29, 5, 3).pintar(g, F, { relieve: 1.2, min: 2, separar: true });
    m().rect(7, 32, 5, 2).pintar(g, F, { relieve: 1.2, min: 1, max: 2, separar: true });
    pon(g, F, 4, [10, 39], [11, 39], [12, 39], [9, 40]);
    pon(g, F, 1, [11, 41], [13, 41], [15, 41]);
    /* Arañazos y herrumbre. */
    for (const [x, y] of [[37, 30], [39, 55], [17, 27], [23, 58]]) { sobre(g, OXIDO, 2, [x, y]); sobre(g, OXIDO, 1, [x + 1, y + 1]); sobre(g, OXIDO, 3, [x, y - 1]); }
    bordeLuz(g, Gr, 2, (x, y) => x > 36);
    return contornear(g);
  }

  /* ---------- Kobold trampero: pequeño, de escamas rojas, con lanza, red y una bolsa de lo que ha robado ---------- */
  function kobold() {
    const g = new Rejilla(W, W), P = ESCAMA, T = TELA, Md = MADERA, Fe = HIERRO, C = CUERDA;
    const m = () => new Molde(0, 0);
    /* Cola enroscada en el suelo. */
    const cola = m().curva(28, 35, 38, 45, 44, 38, 4, 1.5);
    cola.pintar(g, P, { relieve: 2 });
    escamas(g, cola, P);
    /* Red recogida colgando de la mano de atrás: malla de cuerda con nudos. */
    const red = m().poly([[31, 24], [37, 27], [40.5, 36], [37, 42], [30, 41.5], [29, 33]]);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (red.c.tiene(x, y) && (x + y) % 5 && (x - y + 130) % 5) red.c.off(x, y);
    red.pintar(g, C, { relieve: 2, min: 1, max: 3 });
    tono(g, red, C, -1, (x, y) => x > 47 || y > 52);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (g.rampa(x, y) === C && (x + y) % 5 === 0 && (x - y + 130) % 5 === 0) pon(g, C, x < 46 ? 4 : 3, [x, y]);
    m().ell(33, 40.5, 1.6, 1.3).ell(38.5, 38, 1.3, 1.3).ell(36, 42, 1.2, 1.2).pintar(g, Fe, { relieve: 1, min: 1 });
    pon(g, Fe, 4, [43, 54], [51, 50], [47, 55]);
    /* Pierna de atrás, en sombra. */
    m().ell(27, 36, 3, 3.5).linea(28, 38, 30, 42, 2).linea(30, 42, 29, 45, 2).rect(27, 45, 4, 2).pintar(g, P, { relieve: 1.5, max: 2 });
    pon(g, MARFIL, 2, [36, 62], [38, 62], [40, 62]);
    /* Brazo de atrás que sujeta la red. */
    m().linea(27, 24, 31, 28, 3).ell(31.5, 28.5, 1.6, 1.6).pintar(g, P, { relieve: 1.5, max: 2, separar: true });
    /* Torso encorvado con las placas del vientre. */
    const tor = m().ell(23, 29, 5.5, 6.5);
    tor.pintar(g, P, { relieve: 3.5, separar: true });
    escamas(g, tor, P);
    const vientre = m().ell(20, 30, 2.6, 4.6);
    cambiar(g, vientre, P, VIENTRE);
    /* Placas del vientre: juntas un tono más oscuras, curvadas con la barriga. */
    for (const y of [36, 39, 42]) for (let x = 22; x <= 31; x++) if (vientre.c.tiene(x, y) && vientre.c.tiene(x, y + 1)) matiz(g, x, y + (x > 28 ? 1 : 0), -1);
    /* Pierna de delante: muslo, espinilla hacia atrás y pie de tres dedos con garras. */
    const pierna = m().ell(20.5, 37.5, 3.4, 3.5).linea(21, 40, 22.5, 43, 3).linea(22.5, 43, 21, 45, 2).poly([[16, 46.6], [17, 44.5], [23, 44.5], [23.5, 46.6]]);
    pierna.pintar(g, P, { relieve: 2, separar: true });
    escamas(g, pierna, P, { cond: (x, y) => y < 57 });
    pon(g, MARFIL, 4, [21, 62], [24, 62]);
    pon(g, MARFIL, 3, [22, 62], [27, 62]);
    pon(g, P, 1, [23, 61], [26, 61], [23, 62], [26, 62]);
    /* Taparrabos y cinturón con la bolsa de oro. */
    const tap = m().poly([[17.5, 33], [28.5, 33], [29, 38], [25, 39.8], [23, 37], [20.5, 39.8], [17, 38]]);
    tap.pintar(g, T, { relieve: 2, separar: true });
    for (const [x0, y0, x1, y1] of [[27, 46, 26, 51], [31, 46, 32, 49], [35, 46, 36, 51]]) trazo(g, x0, y0, x1, y1, T, 1, tap.c);
    for (let x = 22; x <= 39; x++) { if (tap.c.tiene(x, 44)) pon(g, CUERO, x % 4 ? 2 : 1, [x, 44]); if (tap.c.tiene(x, 45)) pon(g, CUERO, 1, [x, 45]); }
    pon(g, ORO, 4, [29, 44]); pon(g, ORO, 3, [30, 44], [29, 45]);
    const bolsa = m().ell(28, 36.2, 2.6, 2.4);
    bolsa.pintar(g, CUERO, { relieve: 1.5, separar: true });
    pon(g, CUERO, 1, [36, 46], [37, 46], [38, 46], [39, 46]);
    pon(g, ORO, 4, [35, 45], [38, 44]);
    pon(g, ORO, 3, [36, 44], [37, 45], [39, 45]);
    pon(g, ORO, 2, [36, 45], [38, 45]);
    /* Cuernos que se curvan hacia atrás, con anillos. */
    const cuernos = m().curva(24, 15, 29, 11, 33, 12.5, 2.5, 1).curva(25, 18, 30, 16.5, 32, 18.5, 2, 1);
    cuernos.pintar(g, MARFIL, { relieve: 1, separar: true });
    for (const [x, y] of [[35, 17], [38, 15], [41, 15], [36, 23], [39, 22]]) sobre(g, MARFIL, 1, [x, y], [x, y + 1]);
    /* Cresta de piel granate entre los cuernos. */
    const cresta = capa();
    for (const [x, y] of [[33, 24], [35, 27.5], [36, 30.5]]) cresta.poly([[x - 1.3, y], [x + 4.5, y + 0.6], [x, y + 2.8]]);
    cresta.pintar(g, GRANATE, { relieve: 1, separar: true });
    /* Cabeza de lagarto: cráneo, hocico largo y mandíbula. */
    const cab = m().ell(22, 18, 5, 4.5)
      .poly([[19, 15], [11, 17], [10, 18.8], [11, 20.5], [20, 21]])
      .poly([[19, 21], [12, 21.2], [13, 22.8], [21, 23.5]]);
    cab.pintar(g, P, { relieve: 3, separar: true });
    escamas(g, cab, P, { cond: (x, y) => x > 28 && y < 30 });
    /* Boca con dientecillos y la comisura. */
    for (let x = 15; x <= 25; x++) pon(g, P, 0, [x, 28]);
    pon(g, P, 0, [26, 29], [25, 29]);
    pon(g, MARFIL, 4, [17, 29], [21, 29]);
    pon(g, MARFIL, 3, [19, 29], [23, 28]);
    pon(g, VIENTRE, 3, [17, 30], [18, 30], [19, 30], [20, 30], [21, 30]);
    /* Narina y escamas de luz del hocico. */
    pon(g, NEGRO, 0, [15, 24]);
    pon(g, P, 4, [17, 21], [18, 21], [19, 21], [28, 19]);
    /* Ojo grande y amarillo, con ceja de escamas. */
    pon(g, P, 0, [21, 20], [22, 19], [23, 19], [24, 19], [25, 19], [26, 20], [27, 21]);
    pon(g, P, 4, [22, 18], [23, 18], [24, 18]);
    pon(g, ORO, 4, [22, 21], [23, 21]);
    pon(g, ORO, 3, [22, 22], [25, 21], [26, 22]);
    pon(g, ORO, 2, [23, 23], [25, 23], [26, 23]);
    pon(g, NEGRO, 0, [24, 21], [24, 22], [24, 23]);
    pon(g, P, 0, [22, 23], [27, 22], [27, 23]);
    pon(g, P, 1, [23, 24], [24, 24], [25, 24], [26, 24]);
    /* Brazo de delante con la lanza. */
    const brazo = m().linea(20, 24, 16, 28, 3).linea(16, 28, 12.5, 29, 2);
    brazo.pintar(g, P, { relieve: 1.5, separar: true });
    const lanza = capa().linea(20, 59, 8, 12, 2);
    lanza.pintar(g, Md, { relieve: 1.3, min: 1, max: 3 });
    for (let y = 13; y <= 58; y++) if (y % 5 === 0) for (let x = 0; x < W; x++) if (lanza.tiene(x, y)) pon(g, Md, 1, [x, y]);
    /* Ataduras de cuerda bajo la punta. */
    for (const y of [15, 17, 19]) for (let x = 0; x < W; x++) if (lanza.tiene(x, y)) pon(g, C, x % 2 ? 3 : 2, [x, y]);
    /* Punta de hierro forjada a golpes. */
    const punta = capa().poly([[4.5, 13], [6, 3], [11.8, 11.5], [8.4, 14.2]]);
    punta.pintar(g, Fe, { relieve: 1.3, min: 1, separar: true });
    trazo(g, 6, 4, 8, 12, Fe, 4, punta);
    trazo(g, 7, 5, 10, 11, Fe, 2, punta);
    pon(g, OXIDO, 2, [9, 12], [6, 11]);
    /* Cinta granate que ondea. */
    const cinta = capa().curva(10, 15, 13, 18, 12, 21, 2, 1).curva(10, 15, 14, 15, 15, 18, 1.8, 1);
    cinta.pintar(g, GRANATE, { relieve: 1, min: 2, separar: true });
    pon(g, GRANATE, 4, [10, 15], [11, 15]);
    /* Mano con garras alrededor del asta. */
    m().ell(11.5, 29, 1.8, 1.8).pintar(g, P, { relieve: 1, separar: true });
    pon(g, MARFIL, 3, [13, 40], [14, 41]);
    pon(g, P, 1, [14, 40], [15, 39]);
    bordeLuz(g, P, 3, (x, y) => y > 30);
    return contornear(g);
  }

  /* ---------- Elemental de fuego: fuego vivo con forma de cuerpo; flota y acaba en una cola de llamas ---------- */
  function elemental() {
    const g = new Rejilla(W, W), F = FUEGO, C = CALOR;
    const m = () => new Molde(0, 0);
    /* Brazo de atrás alzado, con una bola de fuego en la mano. */
    const atras = m().linea(30, 20, 35, 15, 4).linea(35, 15, 37, 9, 3).ell(37.5, 6.5, 3.4, 3.4);
    atras.lengua(35, 39.5, 5, 38, 0.4).lengua(37.5, 41, 6, 42, 1.5).lengua(34, 36.5, 6, 33.5, 2).lengua(39, 41.5, 8, 44.5, 5.5);
    brasa(g, atras, F, [1.2, 2.6], 1);
    brasa(g, m().ell(37.5, 6.8, 1.8, 1.8), C, [1, 2], 1);
    /* Cuerpo: cabeza, pecho ancho y una cintura que se deshace en lenguas de fuego hacia abajo. */
    const cuerpo = m().ell(23, 12.5, 5.2, 5.5).ell(23.5, 24, 8.5, 7).ell(23, 31, 5.5, 4.5)
      .curva(23, 32, 16, 39, 26, 46.4, 8, 1);
    cuerpo.lengua(17, 20, 37, 13, 40).lengua(25, 27.5, 35, 30, 39.5).lengua(22, 25, 42, 27.5, 44).lengua(19, 21.5, 40, 16.5, 44);
    for (const [x0, x1, y, px, py] of [[18, 22, 10, 18, 1.8], [21, 26, 9, 23, 0.4], [24.5, 29, 10, 29.5, 2.5], [27, 30, 13, 32.5, 8], [15, 19, 21, 13, 15], [28, 32, 20, 34.5, 16.5], [28, 30, 30, 33.5, 27], [16, 18.5, 12, 14.5, 7.5], [29, 31.5, 23, 34, 22]])
      cuerpo.lengua(x0, x1, y, px, py);
    /* Brazo de delante: un zarpazo de fuego hacia los héroes. */
    const brazo = m().linea(17, 21, 12, 25, 4).linea(12, 25, 7, 22, 3).ell(6, 21.5, 2.4, 2.4);
    brazo.lengua(3.5, 6, 21, 1.4, 17).lengua(5, 7.5, 20, 5.5, 15.5).lengua(4, 6.5, 23, 1.2, 23.5).lengua(10, 13, 24, 9, 29.5).lengua(13, 15.5, 25, 13.5, 30);
    brasa(g, brazo, F, [1.2, 2.6], 1);
    brasa(g, cuerpo, F, [1.3, 2.8, 4.6], 1, (x, y) => (y > 46 ? -(y - 46) * 0.1 : 0));
    /* Corazón blanco del fuego en el pecho y en la frente. */
    brasa(g, m().ell(23.5, 24.5, 4, 4.5).ell(22, 33, 2, 3).ell(20.5, 37.5, 1.2, 1.5).ell(6.3, 21.5, 1.2, 1.2), C, [1, 2.4, 4], 1);
    brasa(g, capa().ell(29, 18, 3.2, 2.6).ell(31, 10, 1.4, 2.4), C, [1.2], 0);
    /* Vetas oscuras que suben por las llamas, como el humo de dentro. */
    for (const [x0, y0, x1, y1] of [[22, 46, 20, 42], [34, 45, 35, 42], [27, 57, 28, 53], [17, 31, 18, 28], [40, 25, 40, 22]]) trazo(g, x0, y0, x1, y1, F, 1, cuerpo.c.copia().unir(brazo.c).unir(atras.c));
    /* Cara tallada: ojos que arden en blanco bajo un ceño oscuro y una boca abierta. */
    /* Lenguas claras que suben por dentro de las llamas. */
    const todo = cuerpo.c.copia().unir(brazo.c).unir(atras.c);
    for (const [x, y, l] of [[22, 30, 4], [37, 29, 5], [40, 36, 4], [24, 44, 4], [35, 49, 3], [26, 54, 4], [29, 59, 3], [13, 33, 3], [50, 22, 4], [47, 12, 3], [33, 8, 4], [26, 9, 3], [42, 44, 3]])
      for (let j = 0; j < l; j++) {
        const px = x + Math.round(Math.sin((y - j) * 0.7) * 0.6), py = y - j;
        if (todo.tiene(px, py) && g.rampa(px, py) === F && F.indexOf(g.get(px, py)) < 4) g.set(px, py, F[Math.min(4, F.indexOf(g.get(px, py)) + 1)], F);
      }
    /* Ceño en V, de ascuas oscuras. */
    pon(g, F, 0, [23, 13], [24, 13], [25, 14], [26, 14], [27, 15], [31, 15], [32, 14], [33, 14], [34, 13]);
    pon(g, F, 1, [24, 14], [33, 13], [35, 13], [22, 13]);
    /* Ojos al rojo blanco, con la cuenca algo más oscura. */
    pon(g, F, 2, [24, 15], [28, 16], [30, 16], [34, 15], [24, 17], [27, 17]);
    pon(g, C, 4, [25, 15], [26, 15], [32, 15], [33, 15], [26, 16], [32, 16]);
    pon(g, C, 3, [25, 16], [27, 16], [31, 16], [33, 16]);
    pon(g, C, 2, [26, 17], [32, 17]);
    /* Boca abierta en un rugido: borde de brasa y el fuego blanco dentro. */
    pon(g, F, 0, [26, 20], [27, 20], [28, 20], [29, 20], [30, 20], [31, 20], [25, 21], [32, 21], [26, 22], [31, 22], [27, 23], [28, 23], [29, 23], [30, 23]);
    pon(g, F, 1, [27, 21], [30, 21], [29, 21], [28, 21]);
    pon(g, C, 3, [27, 22], [30, 22]);
    pon(g, C, 4, [28, 22], [29, 22]);
    contornear(g, CENIZA[0], CENIZA);
    /* Chispas y pavesas sueltas alrededor. */
    for (const [i, j, k] of [[15, 10, 4], [45, 33, 3], [15, 44, 3], [42, 49, 4], [11, 38, 2], [53, 17, 4], [19, 58, 2], [40, 60, 3], [4, 15, 3], [57, 8, 2], [46, 40, 2], [13, 52, 4], [33, 61, 2], [50, 27, 2], [8, 46, 3], [48, 56, 2]])
      if (!g.get(i, j)) pon(g, F, k, [i, j]);
    for (const [i, j] of [[15, 10], [42, 49], [53, 17], [13, 52]]) destello(g, i, j, F, 1);
    return g;
  }

  /* ---------- Diablillo: pequeño y cabezón, alas de murciélago, cuernos, cola de flecha y tridente ---------- */
  function diablillo() {
    const g = new Rejilla(W, W), Rj = DIABLO, S = ALA, N = NEGRO, Fe = HIERRO;
    const m = () => new Molde(0, 0);
    /* Ala de murciélago: membrana con el borde festoneado, venas y varillas desde la muñeca. */
    const ala = (pts, muneca, puntas, op, tonoHueso) => {
      const mem = m().poly(pts);
      mem.pintar(g, S, op);
      /* Venas finas entre las varillas. */
      const [mx, my] = mem.p(muneca[0], muneca[1]);
      for (let i = 0; i + 1 < puntas.length; i++) {
        const [ax, ay] = mem.p(...puntas[i]), [bx, by] = mem.p(...puntas[i + 1]);
        trazo(g, mx, my, (ax + bx) / 2 - (ax - bx) * 0.1, (ay + by) / 2, S, Math.max(0, (op.max || 1) - 1), mem.c);
      }
      const h = m().linea(pts[0][0], pts[0][1], muneca[0], muneca[1], 2);
      puntas.forEach(([x, y]) => h.linea(muneca[0], muneca[1], x, y, 1));
      h.pintar(g, Rj, { relieve: 1, min: tonoHueso - 1, max: tonoHueso });
      pon(g, MARFIL, tonoHueso - 1, [Math.round(mx) - 1, Math.round(my) - 2]);
      return mem;
    };
    ala([[25, 26], [28, 13], [33, 7], [38, 10], [35, 13], [37.5, 17], [33.5, 17], [31.5, 22]], [28, 13], [[33, 7], [38, 10], [37.5, 17]], { relieve: 1.5, max: 1, profundo: true }, 1);
    const alaD = ala([[27, 28], [32, 15], [39, 10], [45.5, 16.5], [41.5, 18], [44.5, 24.5], [39, 23], [36, 27.5], [31, 30]], [32, 15], [[39, 10], [45.5, 16.5], [44.5, 24.5]], { relieve: 2, max: 3, separar: 0 }, 3);
    /* La membrana del ala de delante se transparenta hacia el borde (tramado oscuro). */
    const dAla = distancia(alaD.c);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (alaD.c.tiene(x, y) && g.rampa(x, y) === S && dAla[y * W + x] < 2.5 && umbral(x, y) > 0.4) matiz(g, x, y, -1);
    /* Cola acabada en flecha. */
    m().curva(28, 38, 42, 46, 41, 34, 2.5, 1.5).pintar(g, Rj, { relieve: 1, max: 3, separar: true });
    m().poly([[37.5, 35.5], [41.5, 28.5], [45, 35.5], [41.3, 33.8]]).pintar(g, Rj, { relieve: 1, min: 2, max: 3, separar: true });
    pon(g, Rj, 4, [55, 40], [54, 42], [53, 44]);
    /* Pierna de atrás. */
    m().linea(27, 38, 29.5, 41, 3).linea(29.5, 41, 28.5, 44, 2).pintar(g, Rj, { relieve: 1, max: 2 });
    /* Pezuña de atrás, hendida. */
    capa().poly([[35, 62.6], [36, 57.6], [40.4, 57.6], [41.4, 62.6]]).pintar(g, N, { relieve: 1.5, min: 1, max: 2, separar: true });
    pon(g, N, 0, [38, 61], [38, 62]);
    /* Cuerpo: barriga redonda. */
    const cuerpo = m().ell(25, 34, 4.8, 5.2);
    cuerpo.pintar(g, Rj, { relieve: 3, min: 2, separar: true });
    sombraPropia(g, cuerpo, Rj, 33, 45, 2);
    tono(g, m().ell(23, 35, 2, 2.8), Rj, 1);
    for (const y of [45, 47, 49]) for (let x = 29; x <= 33; x++) if (g.rampa(x, y) === Rj) matiz(g, x, y, -1);
    pon(g, Rj, 1, [32, 51], [33, 51], [34, 50]);
    /* Pierna de delante, de cabra, con pelo y pezuña brillante. */
    const pierna = m().linea(23, 37, 20, 41, 3).linea(20, 41, 21.5, 44, 2);
    pierna.pintar(g, Rj, { relieve: 1.5, min: 2, separar: true });
    filo(g, pierna, Rj, 3);
    /* Mechones de pelo de cabra sobre la pezuña. */
    for (const [x, y] of [[26, 56], [28, 57], [30, 56]]) { pon(g, Rj, 1, [x, y]); pon(g, Rj, 3, [x - 1, y - 1]); }
    /* Pezuña negra y brillante, hendida. */
    capa().poly([[23.6, 62.6], [25, 57.6], [30.4, 57.6], [31.4, 62.6]]).pintar(g, N, { relieve: 1.5, min: 1, separar: true });
    pon(g, N, 4, [25, 58], [26, 58], [25, 59]);
    pon(g, N, 3, [27, 58], [24, 61]);
    pon(g, N, 0, [28, 61], [28, 62]);
    /* Tridente: asta de madera y tres puntas de hierro con fuego en la punta. */
    m().rect(10, 15, 2, 32).pintar(g, MADERA, { relieve: 1, max: 3 });
    for (let y = 23; y <= 62; y += 5) pon(g, MADERA, 1, [14, y], [15, y]);
    const tri = m().rect(6, 14, 10, 2).rect(6, 9, 2, 5).rect(10, 7, 2, 7).rect(14, 9, 2, 5);
    tri.poly([[5.5, 9.5], [7, 6], [8.5, 9.5]]).poly([[9.5, 7.5], [11, 3.5], [12.5, 7.5]]).poly([[13.5, 9.5], [15, 6], [16.5, 9.5]]);
    tri.pintar(g, Fe, { relieve: 1, min: 2, separar: true });
    for (const x of [8, 14, 19]) for (let y = 8; y <= 18; y++) if (tri.c.tiene(x, y) && tri.c.tiene(x + 1, y)) pon(g, Fe, 4, [x, y]);
    pon(g, ORO, 3, [12, 20], [13, 20], [14, 20], [15, 20], [16, 20]);
    pon(g, ORO, 4, [12, 20]);
    /* Llamitas en las puntas. */
    for (const [x, y] of [[9, 6], [15, 3], [20, 6]]) {
      const ll = capa().poly([[x - 1.6, y + 1.5], [x - 0.5, y - 3.5], [x + 1.5, y + 1.5]]);
      detras(g, ll, FUEGO, { plano: 3 });
      pon(g, CALOR, 2, [x, y + 1]);
    }
    /* Cabeza grande: orejas puntiagudas, cuernos curvos, sonrisa de dientes. */
    const cab = m().ell(21, 23, 6, 5.5)
      .poly([[17.5, 25], [15, 30.5], [21.5, 28.5]])     // barbilla
      .poly([[25, 21.5], [32, 19], [26, 25.5]])         // oreja
      .poly([[15.5, 22], [12.5, 24.5], [15.5, 25]]);    // nariz
    cab.pintar(g, Rj, { relieve: 4, min: 1, separar: true });
    sombraPropia(g, cab, Rj, 27, 30, 3.5);
    tono(g, cab, Rj, 1, (x, y) => (x - 25) * 0.6 + (y - 26) * 0.8 + (umbral(x, y) - 0.5) * 2 < -2.5);
    tono(g, m().poly([[26, 22], [31, 19.6], [26.5, 24.5]]), Rj, -1);
    pon(g, ENCIA, 3, [36, 29], [37, 28], [38, 28]);
    /* Cuernos con anillos. */
    const cuernos = m().curva(18, 19, 15, 16, 16.5, 12, 3, 1).curva(23, 18.5, 26, 16, 25, 11.5, 3, 1);
    cuernos.pintar(g, MARFIL, { relieve: 1.2, separar: true });
    for (const [x, y] of [[21, 22], [20, 20], [32, 22], [33, 20]]) sobre(g, MARFIL, 1, [x, y], [x + 1, y]);
    pon(g, MARFIL, 4, [22, 17], [33, 16]);
    /* Ceja en pico y ojos amarillos con pupila de rendija. */
    pon(g, Rj, 0, [19, 27], [20, 27], [21, 27], [22, 28], [23, 28], [26, 28], [27, 27], [28, 27], [29, 27], [30, 28]);
    pon(g, Rj, 4, [20, 26], [21, 26], [28, 26], [29, 26]);
    pon(g, ORO, 4, [21, 28], [27, 28], [28, 28]);
    pon(g, ORO, 3, [22, 29], [21, 29], [27, 29], [29, 29], [29, 28]);
    pon(g, ORO, 2, [22, 30], [28, 30], [27, 30]);
    pon(g, N, 0, [23, 29], [23, 30], [28, 29], [28, 30]);
    pon(g, Rj, 1, [21, 31], [22, 31], [23, 31], [27, 31], [28, 31], [29, 31]);
    /* Nariz con su brillo. */
    pon(g, Rj, 4, [18, 31], [19, 30]);
    pon(g, Rj, 0, [17, 33], [18, 33]);
    /* Sonrisa: boca oscura de oreja a oreja con dientes en sierra. */
    pon(g, N, 0, [19, 34], [20, 35], [21, 35], [22, 35], [23, 35], [24, 35], [25, 35], [26, 35], [27, 35], [28, 34], [29, 33]);
    pon(g, N, 0, [21, 36], [22, 36], [23, 36], [24, 36], [25, 36], [26, 36], [23, 37], [24, 37]);
    pon(g, MARFIL, 4, [20, 35], [22, 35], [24, 35], [26, 35], [28, 34]);
    pon(g, MARFIL, 3, [21, 36], [25, 36]);
    pon(g, ENCIA, 3, [23, 37], [24, 36]);
    pon(g, Rj, 1, [29, 34], [30, 34], [30, 33], [24, 38], [25, 38]);
    pon(g, Rj, 4, [22, 25], [23, 24], [24, 24]);
    /* Brazo hacia el tridente. */
    m().linea(24, 31, 18, 33, 3).linea(18, 33, 13, 31, 2).pintar(g, Rj, { relieve: 1.5, min: 2, separar: true });
    m().ell(11.5, 30.5, 2, 1.8).pintar(g, Rj, { relieve: 1, min: 2, separar: true });
    pon(g, Rj, 1, [14, 41], [15, 41], [16, 41]);
    pon(g, MARFIL, 3, [13, 40], [13, 42]);
    filo(g, capa().rect(14, 38, 16, 6), Rj, 3, { arriba: true, cond: (x, y) => y < 41 });
    bordeLuz(g, S, 2, (x, y) => x > 36);
    return contornear(g);
  }

  /* ---------- Araña de las sombras: negra violácea, patas acodadas, ojos en racimo y el reloj de arena rojo ---------- */
  function arana() {
    const g = new Rejilla(W, W), S = QUITINA, Sg = RELOJ, Mg = BRILLO, V = VACIO;
    const m = () => new Molde(0, 0), M = new Molde();
    const P = (x, y) => M.p(x, y).map(Math.round);
    /* Pata acodada: fémur grueso, tibia y tarso finos. */
    const pata = (pts, ram, op) => {
      const c = m();
      const gr = [3, 2.2, 1.2];
      for (let i = 0; i + 1 < pts.length; i++) c.linea(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], gr[i]);
      c.pintar(g, ram, { relieve: 1.2, ...op });
      return c;
    };
    /* Patas del lado de lejos, casi negras, con la rodilla apenas marcada. */
    for (const p of [[[16, 31], [11, 17], [6, 37], [5, 41]], [[19, 31], [20, 19], [17, 38], [16, 42]], [[24, 31], [33, 29], [37, 38], [38, 42]], [[25, 30], [44.5, 27], [45.6, 35], [45.6, 40]]]) {
      const c = pata(p, V, { max: 2 });
      filo(g, c, V, 2, { arriba: true });
      const [x, y] = P(...p[1]);
      pon(g, V, 4, [x, y]);
    }
    /* Abdomen grande y abombado con el reloj de arena. */
    const abd = m().ell(34, 18, 10, 9).ell(28, 23, 4, 4);
    abd.pintar(g, S, { relieve: 5.5, separar: true });
    sombraPropia(g, abd, S, 46, 24, 5);
    /* Reflejo violeta del caparazón: una media luna arriba a la izquierda y un brillo duro. */
    const dAbd = distancia(abd.c);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (!abd.c.tiene(x, y) || g.rampa(x, y) !== S) continue;
      const dd = dAbd[y * W + x], lado = (x - 45) * 0.6 + (y - 24) * 0.8;
      if (lado < -4 && dd > 1 && dd < 3.4) g.set(x, y, Mg[dd < 2.2 && lado < -8 ? 2 : 1], Mg);
    }
    for (const [x, y, t] of [[37, 14, 3], [38, 13, 3], [39, 13, 3], [40, 13, 2], [36, 15, 2], [38, 14, 2]]) pon(g, Mg, t, [x, y]);
    pon(g, Mg, 4, [38, 13]);
    /* Anillos finos del abdomen. */
    for (const r of [8, 11.5]) for (let a = -2.5; a < 0.9; a += 0.04) {
      const x = Math.round(46 + Math.cos(a) * r), y = Math.round(25 + Math.sin(a) * r);
      if (abd.c.tiene(x, y) && g.rampa(x, y) === S && S.indexOf(g.get(x, y)) > 0) matiz(g, x, y, -1);
    }
    /* El reloj de arena: brilla con luz propia. */
    const reloj = m().poly([[31, 12], [38, 12], [34.5, 18], [38, 24], [31, 24], [34.5, 18]]).c.recortar(abd.c);
    brasa(g, reloj, Sg, [0.8, 1.8, 2.8], 1);
    pon(g, Sg, 4, [46, 24], [42, 17], [43, 17]);
    /* Pelos cortos y tiesos en el borde del abdomen (del lado de la sombra). */
    for (const [x, y, a, b] of [[55, 13, 1, -1], [60, 22, 1, 0], [58, 33, 1, 1], [50, 12, 0, -1]]) {
      let px = x, py = y;
      while (g.get(px, py) && px > 0 && px < 63) { px += a; py += b; }
      for (let s2 = 0; s2 < 2; s2++) if (px + a * s2 < 63 && !g.get(px + a * s2, py + b * s2)) pon(g, S, 2, [px + a * s2, py + b * s2]);
    }
    /* Cefalotórax y cabeza. */
    const tor = m().ell(20.5, 31.5, 6.5, 5).ell(14, 31.5, 4.4, 4);
    tor.pintar(g, S, { relieve: 3.5, separar: true });
    sombraPropia(g, tor, S, 26, 43, 2.5);
    pon(g, Mg, 2, [24, 37], [25, 37], [26, 37], [27, 37], [23, 38]);
    pon(g, Mg, 3, [25, 37]);
    /* Surco del cefalotórax. */
    trazo(g, 28, 40, 31, 44, S, 0, tor.c);
    /* Patas de este lado: cuatro, bien acodadas, con las articulaciones rojas y púas. */
    for (const p of [[[15, 34], [7, 21], [2, 41], [1.6, 46.4]], [[18, 35], [14, 25], [11, 43], [10, 46.4]], [[22, 35], [28, 29], [27, 42], [25, 46.4]], [[25, 34], [40, 30], [44, 41], [45, 46.4]]]) {
      const c = pata(p, S, { max: 3, separar: true });
      filo(g, c, S, 3, { arriba: true });
      const [rx, ry] = P(...p[1]), [tx, ty] = P(...p[2]);
      /* Rodilla con brillo y la articulación roja del tarso. */
      pon(g, Mg, 3, [rx, ry]); pon(g, Mg, 2, [rx - 1, ry + 1], [rx + 1, ry]);
      pon(g, Mg, 4, [rx, ry]);
      pon(g, Sg, 2, [tx, ty], [tx + 1, ty]);
      pon(g, Sg, 3, [tx, ty - 1]);
      pon(g, S, 0, [tx, ty + 1]);
      /* Púas en las tibias, hacia fuera. */
      for (let k = 1; k < 5; k++) {
        const x = Math.round(rx + (tx - rx) * k / 5), y = Math.round(ry + (ty - ry) * k / 5);
        const dx = tx < rx ? -1 : 1;
        let px = x;
        while (g.get(px, y) && g.rampa(px, y) === S && Math.abs(px - x) < 4) px -= dx;
        if (!g.get(px, y) && k % 2) pon(g, S, 3, [px, y]);
      }
    }
    /* La cabeza, delante del arranque de las patas. */
    const cabeza = m().ell(14, 31.2, 4.2, 3.8);
    perfil(g, cabeza, S, 0);
    cabeza.pintar(g, S, { relieve: 3, min: 2, sesgo: 0.25 });
    sombraPropia(g, cabeza, S, 20, 44, 1.5);
    filo(g, cabeza, Mg, 2);
    for (let y = 36; y < 48; y++) for (let x = 10; x < 26; x++) if (cabeza.c.tiene(x, y) && (!cabeza.c.tiene(x - 1, y) || !cabeza.c.tiene(x, y - 1)) && x + y < 56) pon(g, Mg, 2, [x, y]);
    /* Quelíceros con colmillos de marfil que gotean veneno. */
    const queli = m().curva(11, 33, 8.5, 36, 10, 39, 3, 1.5).curva(14.5, 34, 13, 37, 14, 40, 3, 1.5);
    queli.pintar(g, S, { relieve: 1, min: 1, max: 3, separar: true });
    filo(g, queli, Mg, 1);
    pon(g, MARFIL, 3, [13, 51], [19, 53], [12, 52]);
    pon(g, MARFIL, 4, [13, 52], [19, 54], [13, 53]);
    hilo(g, 13, 55, 13, 56, BRILLO, 3);
    pon(g, BRILLO, 4, [13, 57]);
    /* Racimo de ojos: dos grandes delante y cuatro pequeños, rojos y encendidos, cada uno con su brillo. */
    const ojo = (x, y, grande) => {
      if (grande) { pon(g, Sg, 4, [x, y]); pon(g, Sg, 3, [x + 1, y], [x, y + 1]); pon(g, Sg, 2, [x + 1, y + 1]); pon(g, MARFIL, 4, [x, y]); }
      else { pon(g, Sg, 4, [x, y]); }
    };
    /* Cuencas oscuras y un resplandor rojo alrededor de los ojos. */
    for (const [x, y] of [[14, 39], [15, 39], [16, 39], [17, 39], [18, 38], [19, 38], [20, 38], [21, 38], [22, 38], [13, 41], [14, 41], [17, 41], [21, 40], [23, 39], [13, 42], [15, 42], [16, 42], [20, 41], [16, 37], [17, 37], [22, 37]]) pon(g, S, 0, [x, y]);
    for (const [x, y] of [[13, 43], [14, 43], [17, 42], [21, 41], [22, 41], [23, 40], [18, 37], [24, 39]]) pon(g, Sg, 1, [x, y]);
    ojo(15, 40, true); ojo(19, 39, true);
    ojo(17, 38, false); ojo(21, 37, false); ojo(14, 42, false); ojo(22, 39, false);
    bordeLuz(g, S, 3);
    return contornear(g);
  }

  /* ---------- Sombra famélica: espectro de humo violeta, capucha vacía, ojos pálidos y garras; flota en jirones ---------- */
  function sombra() {
    const g = new Rejilla(W, W), S = HUMO, Mg = R.magia, E = ESPECTRO;
    const m = () => new Molde(0, 0);
    /* Brazo de atrás, colgando con garras. */
    m().curva(31, 18, 38, 24, 39, 32, 3, 2).pintar(g, S, { relieve: 1, max: 2 });
    const ga = capa(); for (const [a, b] of [[-2, 5.5], [0.5, 6], [3, 5]]) ga.linea(52, 43, 52 + a, 43 + b, 1);
    ga.pintar(g, E, { relieve: 1, max: 2 });
    /* Cuerpo de humo: capucha, hombros caídos y faldón que se deshace en jirones y se arrastra hacia atrás. */
    const cuerpo = m().ell(24, 11, 6.2, 6.8)
      .poly([[17, 12], [31, 12], [35, 19], [37, 27], [36.5, 34], [34, 39], [28, 42], [21, 42], [16.5, 39], [15, 33], [15, 26], [16, 18]]);
    cuerpo.lengua(26, 31, 7, 34, 3.5); // pico de la capucha, echado hacia atrás
    for (const [x0, x1, y, px, py] of [[16, 20.5, 38, 13.5, 45], [20, 25, 40, 20.5, 47], [24.5, 29.5, 40, 28.5, 46.5], [29, 34, 39, 35, 46], [33, 37, 34, 41, 42], [22, 24, 41, 24, 45], [27, 29.5, 41, 31.5, 45.5], [31.5, 35, 37, 38, 43]]) cuerpo.lengua(x0, x1, y, px, py);
    /* Huecos entre los jirones. */
    for (const [x, y] of [[19, 42.5], [26.5, 43], [33, 42.5]]) cuerpo.c.restar(m().poly([[x - 1.3, 48], [x, y], [x + 1.3, 48]]).c);
    cuerpo.pintar(g, S, { relieve: 5, separar: true });
    /* Volumen: el lado de la derecha, lejos de la luz, en sombra. */
    sombraPropia(g, cuerpo, S, 33, 24, 7);
    /* El humo se apaga hacia abajo en hebras verticales: cada columna se oscurece a su altura. */
    const hebra = x => Math.sin(x * 1.7) * 2.2 + Math.sin(x * 0.53 + 1) * 2.5;
    tono(g, cuerpo, S, -1, (x, y) => y > 47 + hebra(x));
    /* Pliegues del manto: surcos largos y luz en los cantos. */
    for (const [x0, y0, x1, y1] of [[27, 31, 25, 52], [35, 29, 36, 55], [42, 31, 45, 52]]) trazo(g, x0, y0, x1, y1, S, 0, cuerpo.c);
    for (const [x0, y0, x1, y1] of [[26, 33, 24, 44], [34, 31, 35, 44]]) trazo(g, x0, y0, x1, y1, S, 3, cuerpo.c);
    /* Vetas violetas que serpentean hacia abajo y se apagan. */
    for (const [x0, fase, y0, y1] of [[30.5, 0, 27, 50], [39.5, 2.5, 26, 47], [22, 4, 30, 42]])
      for (let y = y0; y <= y1; y++) {
        const x = Math.round(x0 + Math.sin(y * 0.22 + fase) * 2.4);
        if (!cuerpo.c.tiene(x, y)) continue;
        const t = y < y0 + 6 ? 3 : y < (y0 + y1) / 2 ? 2 : 1;
        if (y > y1 - 5 && (y & 1)) continue;
        pon(g, Mg, t, [x, y]);
      }
    /* Hueco de la capucha y el borde iluminado. */
    m().ell(21.5, 13, 3.8, 4.4).rect(18, 13, 6, 5).pintar(g, S, { plano: 0 });
    m().linea(17, 9, 23, 5, 1).linea(17, 9, 16.5, 17, 1).linea(16.5, 17, 18, 19, 1).c.recortar(cuerpo.c).pintar(g, Mg, { plano: 3 });
    pon(g, Mg, 4, [25, 9], [26, 8], [27, 7], [23, 13]);
    pon(g, Mg, 2, [32, 7], [33, 7], [23, 24], [29, 25], [30, 25], [22, 17]);
    /* Ojos pálidos, con un halo frío que se pierde en la capucha. */
    for (const [x, y] of [[23, 15], [24, 14], [25, 14], [26, 15], [30, 15], [31, 14], [32, 14], [33, 15], [24, 18], [25, 19], [31, 18], [32, 19]]) pon(g, E, 0, [x, y]);
    pon(g, E, 1, [23, 16], [26, 16], [30, 16], [33, 16], [24, 17], [32, 17]);
    pon(g, E, 4, [24, 15], [25, 15], [31, 15], [32, 15]);
    pon(g, E, 3, [24, 16], [25, 16], [31, 16], [32, 16]);
    pon(g, E, 2, [25, 17], [31, 17]);
    /* Una boca abierta, apenas un desgarro en la oscuridad. */
    pon(g, E, 0, [27, 21], [28, 22], [29, 22], [28, 21]);
    /* Brazo de delante que se estira hacia los héroes con garras largas. */
    const brazo = m().curva(18, 21, 13, 23.5, 8, 21, 3.4, 2);
    brazo.pintar(g, S, { relieve: 1.2, max: 3, separar: true });
    trazo(g, 22, 29, 13, 28, Mg, 2, brazo.c);
    pon(g, Mg, 3, [17, 28], [15, 28]);
    /* Muñeca huesuda y dedos largos. */
    const garra = capa();
    for (const [a, b] of [[-5.5, -4.5], [-6.5, -0.5], [-5, 3.5], [-1.5, -5]]) garra.linea(10, 28, 10 + a, 28 + b, 1);
    garra.ell(10, 28, 1.6, 1.6);
    garra.pintar(g, E, { relieve: 1, min: 2, max: 4, separar: true });
    pon(g, E, 4, [4, 23], [3, 27], [5, 31], [8, 23]);
    pon(g, E, 1, [11, 29], [10, 29]);
    bordeLuz(g, S, 3, (x, y) => y < 40);
    contornear(g, S[0], S);
    /* Las puntas de los jirones se deshacen en el aire. */
    for (let y = 57; y < W; y++) for (let x = 0; x < W; x++) if (g.get(x, y) && umbral(x, y) < (y - 56) / 8) g.quitar(x, y);
    /* Jirones sueltos y motas de humo. */
    for (const [x0, y0, x1, y1] of [[17, 58, 15, 62], [48, 60, 50, 62], [19, 47, 14, 52], [55, 55, 58, 58], [36, 60, 37, 62]]) hilo(g, x0, y0, x1, y1, S, 3);
    for (const [i, j, k] of [[10, 57, 2], [56, 44, 3], [48, 10, 3], [14, 14, 2], [55, 35, 2], [8, 44, 3], [51, 61, 2], [40, 2, 2], [58, 52, 2], [6, 36, 2], [28, 62, 2]]) if (!g.get(i, j)) pon(g, Mg, k, [i, j]);
    return g;
  }

  window.MONSTRUOS_64 = window.MONSTRUOS_64 || {};
  Object.assign(window.MONSTRUOS_64, { lobo, armadura, kobold, elemental, diablillo, arana, sombra });
})();
