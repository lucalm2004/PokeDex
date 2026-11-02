/* Dados y Mazmorras · escenario: fondo, héroes, rivales y efectos en un lienzo de 256×144 píxeles de arte.
   Usa el arte HD (48×48, jefes 80×80) cuando está registrado y, si falta alguna pieza, el arte antiguo de 36×36. */
const ESCENARIO = (() => {
  "use strict";
  const W = 256, H = 144;
  const SS = 2; /* el búfer trabaja al doble de resolución: los sprites de 128 caben con todo su detalle */
  const W0 = 192, H0 = 108; /* tamaño de los fondos antiguos */
  const R = PX.RAMPAS;
  const reducido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  /* Pies de cada héroe (x centro, y suelo): tres delante y tres detrás. */
  const HUECOS = [[80, 140], [44, 137], [116, 135], [62, 125], [98, 124], [24, 125]];
  const POS_MASCOTA = [146, 141];
  const POS_COMPA = [10, 132];
  /* Con varios enemigos se reparten a la derecha (el principal, delante). */
  const POS_RIVALES = [[[196, 137]], [[178, 139], [214, 128]], [[166, 140], [198, 132], [224, 124]]];
  const POS_RIVAL = POS_RIVALES[0][0];

  const tabla = nombre => (typeof window[nombre] === "object" && window[nombre]) || null;
  const cacheFondo = new Map();
  const cacheSprite = new Map();

  function lienzoDe(rej) { return rej.aCanvas(1); }
  /* Un fondo es { cv, anim, viejo }: los antiguos (192×108) se pintan en su tamaño y se escalan al dibujar. */
  function fondo(clave) {
    if (cacheFondo.has(clave)) return cacheFondo.get(clave);
    const hd = tabla("FONDOS_HD"), viejo = typeof FONDOS !== "undefined" ? FONDOS : {};
    let res = null;
    if (hd && hd[clave] && hd[clave].base) {
      try { const g = new PX.Rejilla(W, H); hd[clave].base(g); res = { cv: lienzoDe(g), anim: hd[clave].anim, viejo: false }; }
      catch (e) { console.error("fondo HD", clave, e); }
    }
    if (!res) {
      const def = viejo[clave];
      const g = new PX.Rejilla(W0, H0);
      if (def && def.base) { try { def.base(g); } catch (e) { console.error("fondo", clave, e); } }
      else { g.degradado(0, 0, W0, 72, R.tela.violeta[1], R.tela.terracota[1]); g.degradado(0, 72, W0, 36, R.madera[1], R.madera[0]); }
      res = { cv: lienzoDe(g), anim: def && def.anim, viejo: true };
    }
    cacheFondo.set(clave, res);
    return res;
  }
  function provisional() {
    const g = new PX.Rejilla(48, 48);
    new PX.Capa(48, 48).ell(24, 30, 11, 15).pintar(g, R.sombra, { relieve: 4 });
    g.set(19, 25, R.bronce[4]).set(27, 25, R.bronce[4]);
    return g.contorno();
  }
  /* Caja de lo pintado: fila más alta (cima), más baja (pie) y columnas. */
  function medir(rej) {
    let x0 = rej.w, x1 = -1, y0 = rej.h, y1 = -1;
    for (let y = 0; y < rej.h; y++) for (let x = 0; x < rej.w; x++) if (rej.c[y * rej.w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { x0: 0, x1: rej.w - 1, y0: 0, y1: rej.h - 1 };
    return { x0, x1, y0, y1 };
  }
  /* Cada sprite guarda sus variantes ya dibujadas y sus medidas. */
  function sprite(clave, fabricas) {
    if (cacheSprite.has(clave)) return cacheSprite.get(clave);
    let rej = null;
    for (const f of fabricas) {
      if (!f) continue;
      try { rej = f(); } catch (e) { console.error("sprite", clave, e); rej = null; }
      if (rej) break;
    }
    if (!rej) rej = provisional();
    const k = rej.escala || 1;
    const tum = rej.tumbada().tenida(R.piedra);
    const m = medir(rej), mt = medir(tum);
    const v = {
      normal: lienzoDe(rej),
      blanco: lienzoDe(rej.silueta("#fff7ea")),
      tumbado: lienzoDe(tum),
      piedra: lienzoDe(rej.tenida(R.marmol)),
      oscuro: lienzoDe(rej.tenida(R.sombra)),
      k, w: rej.w, h: rej.h, cima: m.y0, pie: m.y1, ancho: m.x1 - m.x0 + 1, cx: (m.x0 + m.x1 + 1) / 2,
      tw: tum.w, tpie: mt.y1, tcx: (mt.x0 + mt.x1 + 1) / 2
    };
    cacheSprite.set(clave, v);
    return v;
  }
  const spriteHeroe = look => sprite("h:" + JSON.stringify(look), [
    tabla("HEROES_FR") && tabla("HEROES_FR").componer ? () => { const g = tabla("HEROES_FR").componer(look); if (g) g.escala = 0.5; return g; } : null,
    tabla("HEROES_BG") && tabla("HEROES_BG").componer ? () => { const g = tabla("HEROES_BG").componer(look); if (g) g.escala = 0.5; return g; } : null,
    tabla("HEROES_128") && tabla("HEROES_128").componer ? () => { const g = tabla("HEROES_128").componer(look); if (g) g.escala = 0.5; return g; } : null,
    tabla("HEROES_64") && tabla("HEROES_64").componer ? () => tabla("HEROES_64").componer(look) : null,
    tabla("HEROES_HD") && tabla("HEROES_HD").componer ? () => tabla("HEROES_HD").componer(look) : null,
    () => HEROES.componer(look)
  ]);
  const hayMascota = clave => !!((tabla("MASCOTAS_64") || {})[clave] || (tabla("MASCOTAS_HD") || {})[clave] || (typeof MASCOTAS !== "undefined" && MASCOTAS[clave]));
  const spriteMascota = clave => sprite("m:" + clave, [
    (tabla("MASCOTAS_64") || {})[clave],
    (tabla("MASCOTAS_HD") || {})[clave],
    typeof MASCOTAS !== "undefined" ? MASCOTAS[clave] : null
  ]);
  const spriteRival = (tipo, clave) => sprite(tipo + ":" + clave, tipo === "pnj"
    ? [(tabla("PNJ_64") || {})[clave], (tabla("PNJ_HD") || {})[clave], typeof PNJ !== "undefined" ? PNJ[clave] : null]
    : [(tabla("MONSTRUOS_64") || {})[clave], (tabla("MONSTRUOS_HD") || {})[clave], typeof MONSTRUOS !== "undefined" ? MONSTRUOS[clave] : null]);

  /* Ajusta un lienzo pequeño al múltiplo entero de píxeles del dispositivo más cercano a su tamaño pedido.
     base es el lado en píxeles de arte de lo que se va a dibujar. */
  function prepararLienzo(cv, tamPorDefecto, base = 36) {
    const dpr = window.devicePixelRatio || 1;
    const tam = +cv.dataset.tam || parseFloat(getComputedStyle(cv).getPropertyValue("--tam")) || tamPorDefecto;
    const s = Math.max(1, Math.round((tam * dpr) / base));
    if (cv.width !== base * s || cv.height !== base * s) { cv.width = base * s; cv.height = base * s; }
    const css = (base * s) / dpr + "px";
    if (cv.style.width !== css) { cv.style.width = css; cv.style.height = css; }
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    return [c, s];
  }

  /* ---------- Dado de veinte caras ---------- */
  function rejillaDado(variante) {
    const g = new PX.Rejilla(36, 36);
    const hex = variante ? [[4, 18], [11, 4], [25, 4], [32, 18], [25, 32], [11, 32]] : [[18, 2], [32, 10], [32, 26], [18, 34], [4, 26], [4, 10]];
    new PX.Capa().poly(hex).pintar(g, R.tela.terracota, { relieve: 4 });
    const cara = variante ? [[10, 12], [26, 12], [18, 27]] : [[18, 8], [28, 25], [8, 25]];
    new PX.Capa().poly(cara).pintar(g, R.tela.terracota, { min: 3, max: 4, relieve: 2 });
    const aristas = new PX.Capa();
    cara.forEach(([x, y], i) => { const [x2, y2] = hex[[0, 2, 4][i]]; aristas.linea(x, y, x2, y2, 1); });
    aristas.pintar(g, R.tela.terracota, { plano: 1 });
    return g.contorno();
  }
  let dadoCache = null;
  function dibujarDado(cv, numero, variante = 0, dx = 0, dy = 0) {
    if (!cv) return;
    if (!dadoCache) dadoCache = [lienzoDe(rejillaDado(0)), lienzoDe(rejillaDado(1))];
    const [c, s] = prepararLienzo(cv, 72);
    const tmp = dibujarDado.tmp || (dibujarDado.tmp = Object.assign(document.createElement("canvas"), { width: 36, height: 36 }));
    const t = tmp.getContext("2d");
    t.clearRect(0, 0, 36, 36);
    t.drawImage(dadoCache[variante ? 1 : 0], dx, dy);
    const txt = String(numero);
    const ancho = PX.anchoTexto(txt, 2);
    PX.texto(t, txt, Math.round(18 - ancho / 2) + dx, 14 + dy + (variante ? -1 : 2), "#fff7ea", R.tela.terracota[0], 2);
    c.drawImage(tmp, 0, 0, 36 * s, 36 * s);
  }

  /* ---------- Capas de ambiente: niebla del camino y viñeta ---------- */
  let nieblaCv = null, vinetaCv = null;
  function capaNiebla() {
    if (nieblaCv) return nieblaCv;
    const cv = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const c = cv.getContext("2d");
    /* Bancos de niebla hechos con ondas y tramado: más densos abajo y a lo lejos (derecha). */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ola = Math.sin(x * 0.045 + y * 0.11) * 0.5 + Math.sin(x * 0.017 - y * 0.06 + 1.7) * 0.5 + Math.sin(x * 0.09 + 3.1) * 0.25;
      const banda = Math.max(0, 1 - Math.abs(y - 108) / 40);
      const v = 0.12 + ola * 0.22 + banda * 0.5 + (x / W) * 0.22;
      if (v > PX.umbral(x, y) + 0.2) { c.fillStyle = v > 0.82 ? "rgba(228,224,238,0.55)" : "rgba(198,196,220,0.42)"; c.fillRect(x, y, 1, 1); }
    }
    nieblaCv = cv;
    return cv;
  }
  function capaVineta() {
    if (vinetaCv) return vinetaCv;
    const cv = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const c = cv.getContext("2d");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
      const d = dx * dx * 0.7 + dy * dy * 0.9;
      if (d > 0.62 + PX.umbral(x, y) * 0.5) { c.fillStyle = d > 1.05 ? "rgba(8,5,12,0.42)" : "rgba(8,5,12,0.22)"; c.fillRect(x, y, 1, 1); }
    }
    vinetaCv = cv;
    return cv;
  }

  /* ---------- Brillos (se suman con "lighter") ---------- */
  const cacheBrillo = new Map();
  function brillo(color, r) {
    const k = color + r;
    if (cacheBrillo.has(k)) return cacheBrillo.get(k);
    const d = r * 2 + 1, cv = Object.assign(document.createElement("canvas"), { width: d, height: d }), c = cv.getContext("2d");
    for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
      const t = Math.hypot(x - r, y - r) / r;
      if (t > 1) continue;
      const a = (1 - t) * (1 - t);
      if (a > PX.umbral(x, y) * 0.9) { c.globalAlpha = Math.min(1, a * 0.9 + 0.1); c.fillStyle = color; c.fillRect(x, y, 1, 1); }
    }
    cacheBrillo.set(k, cv);
    return cv;
  }
  /* Elemento de cada efecto: color de brillo y rampa. */
  const ELEM = {
    fuego: { brillo: "#ff7a2a", rampa: () => R.fuego, nucleo: "#fff2b0" },
    hielo: { brillo: "#7fd8ff", rampa: () => R.mar, nucleo: "#ffffff" },
    rayo: { brillo: "#b9a8ff", rampa: () => R.magia, nucleo: "#ffffff" },
    luz: { brillo: "#ffd76a", rampa: () => R.bronce, nucleo: "#fffbe0" },
    veneno: { brillo: "#8fe05a", rampa: () => R.hoja, nucleo: "#e8ffd0" },
    sombra: { brillo: "#a45cff", rampa: () => R.magia, nucleo: "#f0d8ff" },
    onda: { brillo: "#5ee0d0", rampa: () => R.mar, nucleo: "#e0fffa" },
    arcano: { brillo: "#9a7bff", rampa: () => R.magia, nucleo: "#ffffff" }
  };

  /* ---------- Instancias de escenario ---------- */
  const instancias = new Set();

  /* opciones.limites() devuelve el ancho y alto máximos (px CSS) que puede ocupar el escenario. */
  function crear(lienzo, opciones = {}) {
    const buf = Object.assign(document.createElement("canvas"), { width: W * SS, height: H * SS });
    const b = buf.getContext("2d");
    const viejoBuf = Object.assign(document.createElement("canvas"), { width: W0, height: H0 });
    const vb = viejoBuf.getContext("2d");
    const ctx = lienzo.getContext("2d");
    let vista = { fondo: "taberna", heroes: [], rival: null, activo: -1 };
    /* Pantalla completa (combate): el escenario se alarga por arriba (cielo) y por abajo (suelo) hasta llenar la pantalla. */
    let completa = null, ext = { arriba: 0, abajo: 0 }, escCss = 1, offX = 0;
    const efectos = [];
    /* Partículas: chispas de impacto, polvo, humo de muerte, destellos de conjuro. */
    const parts = [];
    let temblor = 0, zum = null, transicion = null;
    const amb = [];
    const chispa = (x, y, o) => { if (parts.length < 160) parts.push(Object.assign({ x, y, vx: 0, vy: 0, g: 0.12, vida: 420, t0: performance.now(), color: "#fff7ea", tam: 1 }, o)); };
    /* Altura visible de cada actor en el último fotograma (para colocar números y efectos). */
    const marcas = {};

    function ajustar() {
      const caja = lienzo.parentElement;
      if (!caja || (!caja.offsetParent && !(completa && caja.getClientRects().length))) return;
      const dpr = window.devicePixelRatio || 1;
      if (completa) {
        const aw = window.innerWidth, ah = window.innerHeight;
        /* Cámara más cerca: se recortan un poco los lados (se ven ~206 de 256 px) si hay alto de sobra. */
        const sc = Math.max(aw / W, Math.min(aw / 206, (completa.fin - 60) / H));
        offX = Math.max(0, (W - aw / sc) / 2);
        const arriba = Math.max(0, Math.round(completa.fin / sc - H)), total = Math.max(H, Math.ceil(ah / sc));
        ext = { arriba, abajo: Math.max(0, total - H - arriba) };
        escCss = sc;
        if (buf.height !== total * SS) buf.height = total * SS;
        const pw = Math.round(aw * dpr), ph = Math.round(total * sc * dpr);
        if (lienzo.width !== pw || lienzo.height !== ph) { lienzo.width = pw; lienzo.height = ph; }
        const cw = aw + "px", ch = total * sc + "px";
        if (lienzo.style.width !== cw || lienzo.style.height !== ch) { lienzo.style.width = cw; lienzo.style.height = ch; }
        caja.style.height = "";
        return;
      }
      ext = { arriba: 0, abajo: 0 }; offX = 0;
      if (buf.height !== H * SS) buf.height = H * SS;
      const [aw, ah] = opciones.limites ? opciones.limites() : [caja.clientWidth, caja.clientHeight || 1e9];
      if (!aw || aw < 40) return;
      let s = Math.min((aw * dpr) / W, (Math.max(ah, 40) * dpr) / H);
      /* Un múltiplo entero queda más nítido: se usa si apenas encoge la imagen. */
      const ent = Math.floor(s);
      if (ent >= 1 && ent >= s * 0.86) s = ent;
      s = Math.max(1, s);
      const pw = Math.round(W * s), ph = Math.round(H * s);
      escCss = s / dpr;
      if (lienzo.width !== pw || lienzo.height !== ph) { lienzo.width = pw; lienzo.height = ph; }
      const cw = pw / dpr + "px", ch = ph / dpr + "px";
      if (lienzo.style.width !== cw) { lienzo.style.width = cw; lienzo.style.height = ch; }
      if (opciones.limites) { const alto = ph / dpr + 12 + "px"; if (caja.style.height !== alto) caja.style.height = alto; }
    }
    const ro = window.ResizeObserver ? new ResizeObserver(() => ajustar()) : null;
    if (ro) ro.observe(opciones.observar || lienzo.parentElement);
    window.addEventListener("resize", ajustar);
    ajustar();

    const posRivales = () => POS_RIVALES[Math.min(3, Math.max(1, (vista.rivales || []).length)) - 1];
    function normalizar(obj) { const o = String(obj || "e"); return o === "e" ? "e0" : o; }
    /* Delante: huecos 0–2; detrás: 3–5. */
    function huecosHeroes() {
      const hs = vista.heroes || [], libresDel = [0, 1, 2], libresDet = [3, 4, 5], out = [];
      hs.forEach((h, i) => { if (h.fila !== "detras") out[i] = libresDel.length ? libresDel.shift() : libresDet.shift(); });
      hs.forEach((h, i) => { if (h.fila === "detras") out[i] = libresDet.length ? libresDet.shift() : libresDel.shift(); });
      return out.map(k => HUECOS[k] || HUECOS[0]);
    }
    function posicion(obj) {
      const o = normalizar(obj);
      if (o === "m") return POS_MASCOTA;
      if (o === "c") return POS_COMPA;
      if (o[0] === "h") return huecosHeroes()[+o.slice(1)] || HUECOS[0];
      if (o[0] === "e") return posRivales()[+o.slice(1)] || POS_RIVAL;
      return HUECOS[+o.slice(1)] || HUECOS[0];
    }
    function alto(obj) { const m = marcas[normalizar(obj)]; return m ? Math.max(14, m.alto) : 36; }
    function mostrar(v) {
      if (v.fondo && v.fondo !== vista.fondo) {
        for (let k = efectos.length - 1; k >= 0; k--) if (efectos[k].tipo !== "viaje") efectos.splice(k, 1);
        amb.length = 0;
        if (!reducido && buf.width) { const cp = Object.assign(document.createElement("canvas"), { width: buf.width, height: buf.height }); cp.getContext("2d").drawImage(buf, 0, 0); transicion = { cv: cp, t0: performance.now(), dur: 520 }; }
      }
      if ("rival" in v && !("rivales" in v)) v = Object.assign({}, v, { rivales: v.rival ? [v.rival] : [] });
      vista = Object.assign({}, vista, v);
    }
    function efecto(e) {
      if (reducido && e.tipo !== "numero") return;
      if (e.objetivo === "e") e = Object.assign({}, e, { objetivo: "e0" });
      if (e.actor === "e") e = Object.assign({}, e, { actor: "e0" });
      const t = performance.now();
      if (e.tipo === "ataque" && e.corre) e = Object.assign({ dur: 720 }, e);
      /* El golpe llega cuando el atacante ha corrido hasta su objetivo. */
      if (["golpe", "tajo", "numero", "muerte", "magia"].includes(e.tipo)) {
        const carrera = efectos.find(x => x.tipo === "ataque" && x.corre && x.objetivo === e.objetivo && t - x.t0 < 200);
        if (carrera) e = Object.assign({ t0: carrera.t0 + carrera.dur * 0.42 }, e);
      }
      efectos.push(Object.assign({ t0: performance.now(), dur: { numero: 1100, golpe: 320, ataque: 420, magia: 700, cura: 800, muerte: 950, proyectil: 300, tajo: 260, destello: 380, salto: 900, conjuro: 650, viaje: 1300 }[e.tipo] || 500 }, e));
      if (e.tipo === "golpe" && !e.fuerte && !reducido) zum = { t0: e.t0 || t, dur: 260, id: e.objetivo, f: 0.025 };
      if (e.tipo === "golpe" && e.fuerte) {
        const t0 = e.t0 || t;
        temblor = t0 + 300;
        /* Pausa de impacto: todo se congela un instante; y la cámara se acerca al golpeado. */
        efectos.forEach(x => { if (x !== efectos[efectos.length - 1]) x.t0 += 90; });
        zum = { t0: t0, dur: 420, id: e.objetivo, f: 0.07 };
      }
    }
    function desplazamiento(id, ahora) {
      let dx = 0, dy = 0, blanco = false;
      for (const e of efectos) {
        const p = (ahora - e.t0) / e.dur;
        if (p < 0 || p > 1) continue;
        if (e.tipo === "ataque" && e.actor === id && e.corre && e.objetivo) {
          /* Corre hasta su objetivo, golpea y vuelve a su sitio. */
          const dir = id[0] === "e" ? -1 : 1, [ox] = posicion(id), [tx] = posicion(e.objetivo);
          const dist = (tx - ox) - dir * 26;
          const ida = p < 0.12 ? -3 * dir * (p / 0.12) / dist * dist : p < 0.4 ? ((p - 0.12) / 0.28) : p < 0.58 ? 1 : 1 - (p - 0.58) / 0.42;
          const f = p < 0.12 ? 0 : Math.max(0, Math.min(1, p < 0.4 ? 1 - Math.pow(1 - ida, 2) : p < 0.58 ? 1 : 1 - Math.pow((p - 0.58) / 0.42, 1.6)));
          dx += Math.round(p < 0.12 ? -3 * dir * (p / 0.12) : dist * f);
          if ((p > 0.12 && p < 0.4) || p > 0.58) dy -= Math.floor((ahora / 70) % 2) * 2;
          continue;
        }
        if (e.tipo === "ataque" && e.actor === id) {
          /* Coge impulso hacia atrás, embiste rápido y vuelve. */
          const dir = id[0] === "e" ? -1 : 1;
          const desp = p < 0.22 ? -4 * (p / 0.22) : p < 0.45 ? -4 + 24 * ((p - 0.22) / 0.23) : p < 0.6 ? 20 : 20 * (1 - (p - 0.6) / 0.4);
          dx += Math.round(desp) * dir;
          if (p > 0.22 && p < 0.5) dy -= 2;
        }
        if (e.tipo === "golpe" && e.objetivo === id) {
          /* Destello blanco, sacudida y retroceso hacia atrás. */
          blanco = p < 0.4;
          const atras = id[0] === "e" ? 1 : -1;
          dx += Math.round((p < 0.5 ? p / 0.5 : 1 - (p - 0.5) / 0.5) * (e.fuerte ? 7 : 4)) * atras + (p < 0.7 ? (Math.floor(p * 14) % 2 ? 1 : -1) : 0);
        }
        if (e.tipo === "salto" && (e.actor === id || (e.actor === "h*" && id[0] === "h"))) dy -= Math.round(Math.abs(Math.sin(p * Math.PI * 2)) * 8);
      }
      return [dx, dy, blanco];
    }
    function sombraSuelo(x, y, ancho) {
      ancho = Math.round(ancho);
      b.fillStyle = "rgba(10,6,4,0.36)";
      b.fillRect(Math.round(x - ancho / 2 + 3), y - 1, ancho - 6, 1);
      b.fillRect(Math.round(x - ancho / 2), y, ancho, 2);
      b.fillRect(Math.round(x - ancho / 2 + 3), y + 2, ancho - 6, 1);
    }
    function flecha(x, y, color) {
      x = Math.round(x); y = Math.round(y);
      b.fillStyle = PX.CONTORNO;
      b.fillRect(x - 4, y - 1, 9, 1); b.fillRect(x - 4, y, 9, 2); b.fillRect(x - 3, y + 2, 7, 1); b.fillRect(x - 2, y + 3, 5, 1); b.fillRect(x - 1, y + 4, 3, 1); b.fillRect(x, y + 5, 1, 1);
      b.fillStyle = color;
      b.fillRect(x - 3, y, 7, 1); b.fillRect(x - 2, y + 1, 5, 1); b.fillRect(x - 1, y + 2, 3, 1); b.fillRect(x, y + 3, 1, 1);
      b.fillStyle = "rgba(255,255,255,0.5)"; b.fillRect(x - 3, y, 3, 1);
    }
    /* Fila de puntitos de color, uno por estado (veneno, quemadura…). */
    function puntos(x, y, colores) {
      const n = (colores || []).length;
      if (!n) return;
      const x0 = Math.round(x - (n * 5 - 1) / 2);
      colores.forEach((col, k) => { b.fillStyle = PX.CONTORNO; b.fillRect(x0 + k * 5 - 1, y - 1, 6, 6); b.fillStyle = col; b.fillRect(x0 + k * 5, y, 4, 4); b.fillStyle = "rgba(255,255,255,0.45)"; b.fillRect(x0 + k * 5, y, 2, 1); });
    }
    function barra(x, y, ancho, valor, max, color) {
      x = Math.round(x); y = Math.round(y);
      const lleno = Math.max(0, Math.round((ancho * valor) / max));
      b.fillStyle = PX.CONTORNO; b.fillRect(x - 1, y - 1, ancho + 2, 5);
      b.fillStyle = R.sangre[0]; b.fillRect(x, y, ancho, 3);
      b.fillStyle = color; b.fillRect(x, y, lleno, 3);
      b.fillStyle = "rgba(255,255,255,0.4)"; b.fillRect(x, y, lleno, 1);
      b.fillStyle = "rgba(0,0,0,0.25)"; b.fillRect(x, y + 2, lleno, 1);
    }
    function zz(x, y, ahora) {
      const f = reducido ? 0 : Math.floor(ahora / 380) % 3;
      PX.texto(b, "Z", Math.round(x), Math.round(y - f), R.mar[4]);
      if (f) PX.texto(b, "z", Math.round(x + 5), Math.round(y - 4 - f), R.mar[3]);
    }

    const cacheExt = new Map();
    /* Cielo y suelo prolongados a partir de la primera y la última fila del fondo, oscureciendo con tramado. */
    function extension(clave, arriba, abajo) {
      const k = `${clave}|${arriba}|${abajo}`;
      if (cacheExt.has(k)) return cacheExt.get(k);
      const fd = fondo(clave), tmp = Object.assign(document.createElement("canvas"), { width: W, height: H }), t = tmp.getContext("2d");
      t.imageSmoothingEnabled = false;
      t.drawImage(fd.cv, 0, 0, W, H);
      const px = t.getImageData(0, 0, W, H).data;
      const media = (x, y0, y1) => { let r = 0, g = 0, bl = 0, n = 0; for (let y = y0; y <= y1; y++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.max(0, Math.min(W - 1, x + dx)), i = (y * W + xx) * 4; r += px[i]; g += px[i + 1]; bl += px[i + 2]; n++; } return [r / n, g / n, bl / n]; };
      const cv = Object.assign(document.createElement("canvas"), { width: W, height: arriba + H + abajo }), c = cv.getContext("2d");
      const pon = (x, y, [r, g, bl], f) => { c.fillStyle = `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(bl * f)})`; c.fillRect(x, y, 1, 1); };
      /* Color medio de toda la primera fila: hacia arriba, cada columna se funde con él (sin franjas). */
      const filaMedia = [0, 1, 2].map(k => { let t = 0; for (let x = 0; x < W; x++) t += media(x, 0, 2)[k]; return t / W; });
      for (let x = 0; x < W; x++) {
        const cielo = media(x, 0, 2), suelo = media(x, H - 4, H - 1);
        for (let j = 0; j < arriba; j++) {
          const d = (arriba - j) / Math.max(1, arriba), mezcla = Math.min(1, d * 1.6 + (PX.umbral(x, j) - 0.5) * 0.25);
          const col = cielo.map((v, k) => v * (1 - mezcla) + filaMedia[k] * mezcla);
          pon(x, j, col, Math.max(0.16, 1 - d * 0.8));
        }
        for (let j = 0; j < abajo; j++) { const d = j / Math.max(1, abajo); const ruido = PX.umbral(x * 3, j) < 0.12 ? 0.85 : 1; pon(x, arriba + H + j, suelo, Math.max(0.1, (1 - d * 0.92) * ruido)); }
      }
      cacheExt.set(k, cv);
      return cv;
    }
    function pintarFondo(ahora) {
      const fd = fondo(vista.fondo);
      if (fd.viejo) {
        vb.clearRect(0, 0, W0, H0);
        vb.drawImage(fd.cv, 0, 0);
        if (fd.anim && !reducido) { try { fd.anim(vb, ahora); } catch (e) { /* un fallo de animación no debe parar el juego */ } }
        b.imageSmoothingEnabled = false;
        b.drawImage(viejoBuf, 0, 0, W, H);
      } else {
        /* De viaje: el paisaje se desliza hacia la izquierda mientras el grupo camina. */
        const v = !reducido && efectos.find(e => e.tipo === "viaje");
        if (v) {
          const p = Math.min(1, (ahora - v.t0) / v.dur), off = Math.round((1 - Math.pow(1 - p, 2)) * 96);
          b.drawImage(fd.cv, -off, 0); b.drawImage(fd.cv, W - off, 0);
        } else b.drawImage(fd.cv, 0, 0);
        if (fd.anim && !reducido && !v) { try { fd.anim(b, ahora); } catch (e) { /* idem */ } }
      }
    }
    function pintarNiebla(ahora, fuerza) {
      if (!fuerza) return;
      const n = capaNiebla();
      const off = reducido ? 0 : (ahora / 90) % W;
      b.globalAlpha = Math.min(1, fuerza);
      b.drawImage(n, -off, 0); b.drawImage(n, W - off, 0);
      b.globalAlpha = Math.min(1, fuerza) * 0.6;
      const off2 = reducido ? 0 : (ahora / 47) % W;
      b.drawImage(n, off2 - W, 8); b.drawImage(n, off2, 8);
      b.globalAlpha = 1;
    }

    function lanzarParticulas(e, ahora) {
      if (e.lanzado) return;
      e.lanzado = true;
      const id = e.objetivo || e.actor, [x, y] = posicion(id), al = alto(id), cy = y - al * 0.55;
      if (e.tipo === "golpe") {
        const n = e.fuerte ? 14 : 8, col = e.clase === "arcana" ? ["#d7c9ff", "#9a7bff"] : e.clase === "sagrada" ? ["#fff3b0", "#ffd24a"] : ["#fff7ea", "#ffcf6a", "#ff8a3d"];
        for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + Math.random() * 0.4, v = 0.8 + Math.random() * (e.fuerte ? 2.4 : 1.6); chispa(x, cy, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.8, color: col[k % col.length], vida: 300 + Math.random() * 260, tam: k % 4 === 0 ? 2 : 1 }); }
        if (String(id)[0] === "h") for (let k = 0; k < 5; k++) chispa(x - 4 + k * 2, cy + 2, { vx: (Math.random() - 0.5) * 1.2, vy: -0.4 - Math.random(), color: "#c8352a", vida: 420, g: 0.15, tam: 1 });
      }
      if (e.tipo === "muerte") for (let k = 0; k < 22; k++) chispa(x - 14 + Math.random() * 28, y - Math.random() * al, { vx: (Math.random() - 0.5) * 0.5, vy: -0.25 - Math.random() * 0.6, g: -0.004, color: k % 3 ? "rgba(70,60,80,0.8)" : "#9a8fa8", vida: 900 + Math.random() * 500, tam: 2 });
      if (e.tipo === "cura") for (let k = 0; k < 7; k++) chispa(x - 10 + Math.random() * 20, y - Math.random() * al * 0.7, { vx: 0, vy: -0.45 - Math.random() * 0.3, g: 0, color: "#8ff08a", vida: 800, cruz: true });
      if (e.tipo === "proyectil" && e.actor) { const [ax, ay] = posicion(e.actor), aal = alto(e.actor); for (let k = 0; k < 8; k++) chispa(ax + (Math.random() - 0.5) * 16, ay - aal * 0.4 + (Math.random() - 0.5) * 12, { vx: 0, vy: -0.6 - Math.random() * 0.5, g: 0, color: e.forma === "flecha" ? "#e9d8b0" : e.forma === "luz" ? "#ffe9a0" : "#c8b5ff", vida: 420 }); }
      if (e.tipo === "ataque" && String(e.actor)[0] !== "m") { const [ax, ay] = posicion(e.actor); for (let k = 0; k < 4; k++) chispa(ax + (Math.random() - 0.5) * 10, ay - 1, { vx: (Math.random() - 0.5) * 0.8, vy: -0.3, g: 0.02, color: "rgba(160,130,100,0.7)", vida: 380, tam: 2 }); }
    }
    function pintarParticulas(ahora) {
      for (let k = parts.length - 1; k >= 0; k--) {
        const q = parts[k], t = ahora - q.t0;
        if (t > q.vida) { parts.splice(k, 1); continue; }
        const f = t / 16.7;
        const x = Math.round(q.x + q.vx * f), y = Math.round(q.y + q.vy * f + 0.5 * q.g * f * f);
        if (t > q.vida * 0.7 && Math.floor(t / 50) % 2) continue;
        b.fillStyle = q.color;
        if (q.cruz) { b.fillRect(x - 1, y, 3, 1); b.fillRect(x, y - 1, 1, 3); }
        else b.fillRect(x, y, q.tam, q.tam);
      }
    }
    function pintar(ahora) {
      b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, buf.width, buf.height);
      b.setTransform(SS, 0, 0, SS, 0, 0); b.imageSmoothingEnabled = false;
      if (ext.arriba || ext.abajo) b.drawImage(extension(vista.fondo, ext.arriba, ext.abajo), 0, 0);
      b.save();
      b.translate(0, ext.arriba);
      if (temblor > ahora && !reducido) b.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
      pintarFondo(ahora);
      pintarHora();
      if (vista.niebla) pintarNiebla(ahora, vista.niebla * 0.55);
      const actores = [];
      const marcha = (!!vista.marcha || efectos.some(e => e.tipo === "viaje")) && !reducido;
      const huecosH = huecosHeroes();
      vista.heroes.forEach((h, i) => {
        const [fx, fy] = huecosH[i] || HUECOS[0];
        actores.push({ id: "h" + i, h, fx, fy, i });
      });
      if (vista.companero) actores.push({ id: "c", rival: { tipo: "pnj", clave: vista.companero.clave }, compa: true, fx: POS_COMPA[0], fy: POS_COMPA[1] });
      if (vista.mascota && hayMascota(vista.mascota)) actores.push({ id: "m", mascota: vista.mascota, fx: POS_MASCOTA[0], fy: POS_MASCOTA[1] });
      const pr = posRivales();
      (vista.rivales || []).forEach((rv, k) => { if (rv && pr[k]) actores.push({ id: "e" + k, k, rival: rv, fx: pr[k][0], fy: pr[k][1] }); });
      actores.sort((a, c) => a.fy - c.fy);
      for (const a of actores) {
        const [dx, dy, blanco] = desplazamiento(a.id, ahora);
        if (a.mascota) {
          const v = spriteMascota(a.mascota);
          const bob = reducido ? 0 : marcha ? -Math.abs(Math.round(Math.sin(ahora / 120) * 2)) : Math.floor((ahora / 420) % 2);
          const x = Math.round(a.fx - (v.w * v.k) / 2 + dx), y = Math.round(a.fy - (v.pie * v.k) + bob + dy);
          sombraSuelo(a.fx, a.fy, Math.max(12, (v.ancho * v.k) * 0.7));
          b.drawImage(blanco ? v.blanco : v.normal, x, y, v.w * v.k, v.h * v.k);
          marcas.m = { alto: (v.pie * v.k) - (v.cima * v.k), x0: a.fx - (v.ancho * v.k) / 2, x1: a.fx + (v.ancho * v.k) / 2, y0: y + (v.cima * v.k), y1: a.fy, cx: a.fx };
          continue;
        }
        if (a.h) {
          let pose = "normal";
          if (!reducido) for (const e of efectos) {
            const p = (ahora - e.t0) / e.dur;
            if (p < 0 || p > 1) continue;
            if (e.tipo === "ataque" && e.actor === a.id && (e.corre ? p > 0.36 && p < 0.62 : p > 0.18 && p < 0.78)) pose = e.conjuro ? "conjuro" : "ataque";
            else if (e.tipo === "conjuro" && e.actor === a.id) pose = "conjuro";
            else if (e.tipo === "golpe" && e.objetivo === a.id && p < 0.7 && pose === "normal") pose = "herido";
            else if (e.tipo === "salto" && (e.actor === a.id || e.actor === "h*") && pose === "normal") pose = "victoria";
          }
          const v = spriteHeroe(pose === "normal" ? a.h.look : Object.assign({}, a.h.look, { pose }));
          if (a.h.caido) {
            sombraSuelo(a.fx, a.fy, (v.ancho * v.k) * 0.9);
            b.drawImage(v.tumbado, Math.round(a.fx - (v.tcx * v.k)), Math.round(a.fy - (v.tpie * v.k)), v.tw * v.k, v.w * v.k);
            marcas[a.id] = { alto: 12 };
            continue;
          }
          let bob;
          if (reducido) bob = 0;
          else if (marcha) bob = -Math.abs(Math.round(Math.sin(ahora / 160 + a.i * 1.3) * 2));
          else bob = Math.floor((ahora / 520 + a.i * 0.37) % 2);
          sombraSuelo(a.fx, a.fy, Math.max(16, (v.ancho * v.k) * 0.8));
          const img = blanco ? v.blanco : a.h.piedra ? v.piedra : v.normal;
          const x = Math.round(a.fx - (v.w * v.k) / 2 + dx), y = Math.round(a.fy - (v.pie * v.k) + bob + dy);
          if (Math.abs(dx) > 8 && !blanco) { b.globalAlpha = 0.25; b.drawImage(img, x - Math.sign(dx) * 6, y, v.w * v.k, v.h * v.k); b.globalAlpha = 1; }
          b.drawImage(img, x, y, v.w * v.k, v.h * v.k);
          const cima = y + (v.cima * v.k);
          marcas[a.id] = { alto: (v.pie * v.k) - (v.cima * v.k), x0: a.fx - (v.ancho * v.k) / 2, x1: a.fx + (v.ancho * v.k) / 2, y0: cima, y1: a.fy, cx: a.fx };
          if (vista.activo === a.i && !vista.esperaRival) flecha(a.fx + 1, cima - 10 + (reducido ? 0 : Math.floor(ahora / 260) % 2), R.bronce[4]);
          if (a.h.aturdido) zz(a.fx + 8, cima - 2, ahora);
          puntos(a.fx + 1, cima - (vista.activo === a.i ? 17 : 8), a.h.estados);
        } else {
          const r = a.rival;
          const v = spriteRival(r.tipo, r.clave);
          const ix = Math.round(a.fx - (v.w * v.k) / 2 + dx);
          let iy = Math.round(a.fy - (v.pie * v.k) + dy);
          if (!reducido && r.flota) iy += Math.round(Math.sin(ahora / 400) * 2) - 4;
          else if (!reducido) iy += Math.floor((ahora / 640) % 2);
          const muerte = efectos.find(e => e.tipo === "muerte" && e.objetivo === a.id);
          if (r.derrotado && !muerte) continue;
          let alfa = 1;
          if (muerte) {
            const p = (ahora - muerte.t0) / muerte.dur;
            if (p > 1) continue;
            if (p < 0.25 && Math.floor(p * 16) % 2) continue;
            alfa = p < 0.25 ? 1 : Math.max(0, 1 - (p - 0.25) / 0.75);
            iy += Math.round(Math.max(0, p - 0.25) * 10);
          }
          if (r.tipo === "enemigo" && !r.silueta) sombraSuelo(a.fx, a.fy, Math.max(18, (v.ancho * v.k) * 0.8));
          b.globalAlpha = alfa;
          if (Math.abs(dx) > 8 && !blanco) { b.globalAlpha = alfa * 0.25; b.drawImage(v.normal, ix - Math.sign(dx) * 6, iy, v.w * v.k, v.h * v.k); b.globalAlpha = alfa; }
          if (a.compa) { b.save(); b.translate(ix * 2 + v.w * v.k, 0); b.scale(-1, 1); }
          b.drawImage(blanco ? v.blanco : r.silueta ? v.oscuro : r.petrificado || r.congelado ? v.piedra : v.normal, ix, iy, v.w * v.k, v.h * v.k);
          if (a.compa) b.restore();
          b.globalAlpha = 1;
          const cima = iy + (v.cima * v.k);
          marcas[a.id] = r.derrotado ? null : { alto: (v.pie * v.k) - (v.cima * v.k), x0: a.fx - (v.ancho * v.k) / 2, x1: a.fx + (v.ancho * v.k) / 2, y0: cima, y1: a.fy, cx: a.fx };
          if (r.tipo === "enemigo" && r.max) {
            const ancho = (v.h * v.k) > 60 ? 46 : 32;
            const by = Math.max(4, cima - 7);
            barra(a.fx - ancho / 2, by, ancho, r.hp, r.max, R.sangre[4]);
            if (r.aturdido) zz(a.fx - ancho / 2 - 9, by - 2, ahora);
            puntos(a.fx, by - 8, r.estados);
            if (vista.objetivo === a.k && (vista.rivales || []).length > 1 && !r.derrotado) flecha(a.fx, by - (r.estados && r.estados.length ? 17 : 10) + (reducido ? 0 : Math.floor(ahora / 260) % 2), R.sangre[4]);
          }
        }
      }
      if (vista.niebla) pintarNiebla(ahora + 4000, vista.niebla * 0.35);
      for (let k = efectos.length - 1; k >= 0; k--) {
        const e = efectos[k];
        const p = (ahora - e.t0) / e.dur;
        if (p > 1) { efectos.splice(k, 1); continue; }
        if (p < 0) continue;
        const [x, y] = posicion(e.objetivo || e.actor);
        const al = alto(e.objetivo || e.actor);
        if (!reducido && ["golpe", "muerte", "cura", "proyectil", "ataque"].includes(e.tipo)) lanzarParticulas(e, ahora);
        if (e.tipo === "numero") {
          const sube = Math.round(Math.min(1, p * 1.6) * 14);
          const esc = e.grande ? 2 : 1;
          const ancho = PX.anchoTexto(e.texto, esc);
          const yy = Math.max(10, y - al - 4 - sube - (e.fila || 0) * 8);
          if (p < 0.85 || Math.floor(p * 20) % 2) PX.texto(b, e.texto, Math.round(x - ancho / 2), yy, e.color || "#fff7ea", PX.CONTORNO, esc);
        }
        if (e.tipo === "proyectil" && e.elem && ELEM[e.elem] && !reducido) {
          const E = ELEM[e.elem], [ox, oy] = posicion(e.actor), oal = alto(e.actor), sy = oy - oal * 0.55, ty = y - al * 0.5;
          b.save(); b.globalCompositeOperation = "lighter";
          if (e.elem === "rayo") {
            /* Rayo en zigzag que parpadea entre lanzador y objetivo. */
            if (Math.floor(p * 12) % 3 !== 2) {
              let px0 = ox, py0 = sy;
              b.fillStyle = E.nucleo;
              for (let t = 1; t <= 8; t++) { const px1 = ox + (x - ox) * (t / 8), py1 = sy + (ty - sy) * (t / 8) + (t < 8 ? (PX.umbral(t * 3, Math.floor(p * 9)) - 0.5) * 14 : 0); const n = Math.max(Math.abs(px1 - px0), Math.abs(py1 - py0)); for (let u = 0; u <= n; u++) b.fillRect(Math.round(px0 + (px1 - px0) * u / n), Math.round(py0 + (py1 - py0) * u / n), 1, 1); px0 = px1; py0 = py1; }
              b.drawImage(brillo(E.brillo, 10), Math.round(x - 10), Math.round(ty - 10));
            }
          } else if (e.elem === "luz") {
            /* Haz de luz que cae del cielo sobre el objetivo. */
            const ancho = Math.round(4 + Math.sin(p * Math.PI) * 6);
            b.globalAlpha = Math.sin(p * Math.PI);
            b.fillStyle = E.brillo; b.fillRect(Math.round(x - ancho), -ext.arriba, ancho * 2, y + ext.arriba);
            b.fillStyle = E.nucleo; b.fillRect(Math.round(x - ancho / 3), -ext.arriba, Math.max(1, Math.round(ancho * 2 / 3)), y + ext.arriba);
            b.globalAlpha = 1;
            b.drawImage(brillo(E.brillo, 14), Math.round(x - 14), Math.round(y - 20));
          } else if (e.elem === "onda") {
            /* Ondas de sonido concéntricas. */
            for (let k2 = 0; k2 < 3; k2++) { const q = Math.min(1, p * 1.3 - k2 * 0.15); if (q <= 0) continue; const cx = ox + (x - ox) * q, cy = sy + (ty - sy) * q; b.fillStyle = E.brillo; for (let a2 = -0.9; a2 <= 0.9; a2 += 0.15) b.fillRect(Math.round(cx + Math.cos(a2) * (4 + k2 * 2)), Math.round(cy + Math.sin(a2) * (5 + k2 * 2)), 1, 2); }
          } else {
            /* Bola (fuego, hielo, veneno, sombra, arcano) con estela y brillo. */
            const q = Math.min(1, p * 1.15), px = Math.round(ox + (x - ox) * q), py = Math.round(sy + (ty - sy) * q - Math.sin(q * Math.PI) * 6);
            const rp = E.rampa();
            if (q < 1) {
              for (let t = 1; t <= 5; t++) { const qq = Math.max(0, q - t * 0.05); const tx = Math.round(ox + (x - ox) * qq), tyy = Math.round(sy + (ty - sy) * qq - Math.sin(qq * Math.PI) * 6); b.fillStyle = rp[Math.max(0, 4 - t)]; const sz = Math.max(1, 4 - t); b.fillRect(tx - (sz >> 1), tyy - (sz >> 1), sz, sz); }
              b.drawImage(brillo(E.brillo, 9), px - 9, py - 9);
              if (e.elem === "hielo") { b.fillStyle = E.nucleo; b.fillRect(px - 1, py - 4, 2, 8); b.fillRect(px - 4, py - 1, 8, 2); b.fillStyle = rp[3]; b.fillRect(px - 2, py - 2, 4, 4); }
              else { b.fillStyle = rp[3]; b.fillRect(px - 3, py - 3, 7, 7); b.fillStyle = rp[4]; b.fillRect(px - 2, py - 2, 5, 5); b.fillStyle = E.nucleo; b.fillRect(px - 1, py - 1, 2, 2); if (Math.floor(ahora / 60) % 2) { b.fillStyle = rp[4]; b.fillRect(px - 4, py, 1, 1); b.fillRect(px + 3, py - 3, 1, 1); } }
            } else if (!e.estallido) {
              e.estallido = true;
              for (let k2 = 0; k2 < 16; k2++) { const a2 = (k2 / 16) * Math.PI * 2, v2 = 0.8 + Math.random() * 1.8; chispa(x, ty, { vx: Math.cos(a2) * v2, vy: Math.sin(a2) * v2 - 0.5, color: k2 % 3 ? rp[4] : E.nucleo, vida: 380 + Math.random() * 300, tam: k2 % 4 ? 1 : 2, g: e.elem === "fuego" ? -0.02 : 0.08 }); }
            }
            if (q >= 1) { const f = Math.max(0, 1 - (p - 0.87) / 0.13); b.globalAlpha = f; b.drawImage(brillo(E.brillo, 16), Math.round(x - 16), Math.round(ty - 16)); b.globalAlpha = 1; }
          }
          b.restore();
        }
        else if (e.tipo === "proyectil") {
          const [ox, oy] = posicion(e.actor), oal = alto(e.actor), q = Math.min(1, p * 1.15);
          const sy = oy - oal * 0.55, ty = y - al * 0.5;
          const px = Math.round(ox + (x - ox) * q), py = Math.round(sy + (ty - sy) * q - Math.sin(q * Math.PI) * (e.forma === "flecha" ? 8 : 4));
          const col = e.forma === "luz" ? R.bronce : e.forma === "flecha" ? R.madera : (e.rampa || R.magia);
          if (e.forma === "flecha") { b.fillStyle = col[3]; b.fillRect(px - 6, py, 8, 1); b.fillStyle = R.hueso[4]; b.fillRect(px + 2, py - 1, 3, 3); b.fillStyle = R.tela.terracota[3]; b.fillRect(px - 7, py - 1, 2, 3); }
          else if (e.forma === "luz") { b.fillStyle = col[4]; for (let t = 0; t < 9; t++) b.fillRect(Math.round(ox + (x - ox) * q * (t / 8)), Math.round(sy + (ty - sy) * q * (t / 8)), 2, 1); b.fillRect(px - 2, py - 2, 4, 4); b.fillStyle = "#fff7ea"; b.fillRect(px - 1, py - 1, 2, 2); }
          else {
            b.fillStyle = col[1]; b.fillRect(px - 5, py - 1, 3, 3);
            b.fillStyle = col[2]; b.fillRect(px - 3, py - 3, 7, 7);
            b.fillStyle = col[4]; b.fillRect(px - 2, py - 2, 5, 5);
            b.fillStyle = "#fff7ea"; b.fillRect(px - 1, py - 1, 2, 2);
          }
        }
        if (e.tipo === "tajo") {
          /* Arco de tajo en media luna que se abre y se desvanece. */
          const cy = y - al * 0.6, rad = 12 + al * 0.12, fin = Math.min(1, p * 2), ini = Math.max(0, p * 2 - 1);
          b.save(); b.globalCompositeOperation = "lighter";
          for (let t = ini; t <= fin; t += 0.03) {
            const a2 = -2.2 + t * 2.6, gr = 1 + Math.round(Math.sin(t * Math.PI) * 2);
            const px = Math.round(x + Math.cos(a2) * rad), py = Math.round(cy + Math.sin(a2) * rad * 0.9);
            b.fillStyle = "#fff7ea"; b.fillRect(px, py, gr, gr);
            b.fillStyle = e.color || "#ffd27a"; b.fillRect(px - 1, py + 1, 1, 1);
          }
          if (p < 0.5) b.drawImage(brillo("#ffcf6a", 8), Math.round(x - 8), Math.round(cy - 8));
          b.restore();
        }
        if (e.tipo === "destello" && Math.floor(p * 6) % 2 === 0) { b.fillStyle = e.color || "rgba(255,247,234,0.55)"; b.fillRect(0, 0, W, H); }
        if (e.tipo === "magia" || e.tipo === "cura") {
          const col = e.tipo === "cura" ? R.hoja : (e.rampa || R.magia);
          const cy = y - al * 0.45;
          if (!reducido) { b.save(); b.globalCompositeOperation = "lighter"; b.globalAlpha = Math.sin(p * Math.PI) * 0.8; b.drawImage(brillo(e.tipo === "cura" ? "#7fe08a" : (col[3] || "#9a7bff"), 14), Math.round(x - 14), Math.round(cy - 14)); b.restore(); }
          for (let n = 0; n < 14; n++) {
            const ang = n * 0.45 + p * 5;
            const rad = 5 + p * 16;
            const px = Math.round(x + Math.cos(ang) * rad * 0.8), py = Math.round(cy + Math.sin(ang) * rad * 0.6 - p * 10);
            const t = n % 3 === 0 ? 2 : 1;
            b.fillStyle = col[n % 2 ? 3 : 4];
            b.fillRect(px, py, t, t);
          }
        }
      }
      pintarParticulas(ahora);
      if (!reducido) pintarAmbiente(ahora);
      if (!reducido && vista.clima && FUERA.has(vista.fondo)) pintarClima(ahora);
      if (!ext.arriba && !ext.abajo) b.drawImage(capaVineta(), 0, 0);
      b.restore();
      if (transicion) pintarTransicion(ahora);
      ctx.imageSmoothingEnabled = false;
      const BH = buf.height / SS;
      let zx = offX, zy = 0, zw = W - 2 * offX, zh = BH;
      if (zum && !reducido) {
        const p = (ahora - zum.t0) / zum.dur;
        if (p > 1) zum = null;
        else {
          const f = 1 + (zum.f || 0.07) * Math.sin(Math.max(0, Math.min(1, p)) * Math.PI), [cx, cy] = posicion(zum.id);
          const bw = W - 2 * offX;
          zw = bw / f; zh = BH / f;
          zx = Math.max(offX, Math.min(offX + bw - zw, cx - zw / 2)); zy = Math.max(0, Math.min(BH - zh, cy + ext.arriba - alto(zum.id) / 2 - zh / 2));
        }
      }
      ctx.drawImage(buf, Math.round(zx * SS), Math.round(zy * SS), Math.round(zw * SS), Math.round(zh * SS), 0, 0, lienzo.width, lienzo.height);
    }
    /* Al aire libre la luz cambia con el avance por el mapa y hay clima. */
    const FUERA = new Set(["camino", "bosque", "aldea", "puente", "encrucijada", "pico", "ruinas"]);
    function pintarHora() {
      const h = vista.hora || 0;
      if (!FUERA.has(vista.fondo) || h < 0.3) return;
      /* Tarde dorada, atardecer anaranjado y noche azulada (se tiñe el fondo, no los personajes). */
      const [col, a] = h < 0.55 ? ["#ffc27a", (h - 0.3) * 0.5] : h < 0.8 ? ["#ff8a50", 0.14 + (h - 0.55) * 0.3] : ["#3a4a9a", 0.2 + (h - 0.8) * 1.2];
      b.save(); b.globalCompositeOperation = "multiply"; b.globalAlpha = Math.min(0.42, a * 1.6); b.fillStyle = col; b.fillRect(0, -ext.arriba, W, buf.height / SS); b.restore();
      if (h >= 0.8) { b.save(); b.globalAlpha = Math.min(0.3, (h - 0.8) * 1.2); b.fillStyle = "#0a0c20"; b.fillRect(0, -ext.arriba, W, buf.height / SS); b.restore(); }
    }
    const gotas = [];
    let rayoHasta = 0, proximoRayo = 0;
    function pintarClima(ahora) {
      const tormenta = vista.clima === "tormenta";
      if (vista.clima === "lluvia" || tormenta) {
        const max = tormenta ? 90 : 55, y0 = -ext.arriba, y1 = H + ext.abajo;
        while (gotas.length < max) gotas.push({ x: Math.random() * (W + 40), y: y0 + Math.random() * (y1 - y0), v: 2.2 + Math.random() * 1.6 });
        b.save(); b.fillStyle = tormenta ? "rgba(190,205,240,0.55)" : "rgba(170,190,230,0.45)";
        for (const g of gotas) {
          g.y += g.v * 2.2; g.x -= g.v * 0.7;
          if (g.y > y1 || g.x < -4) { g.y = y0 - Math.random() * 20; g.x = Math.random() * (W + 40); }
          b.fillRect(Math.round(g.x), Math.round(g.y), 1, 3);
        }
        b.restore();
        b.save(); b.globalAlpha = 0.12; b.fillStyle = "#1a2030"; b.fillRect(0, -ext.arriba, W, buf.height / SS); b.restore();
      }
      if (tormenta) {
        if (!proximoRayo) proximoRayo = ahora + 2500 + Math.random() * 4000;
        if (ahora > proximoRayo) { rayoHasta = ahora + 140; proximoRayo = ahora + 3000 + Math.random() * 5000; }
        if (ahora < rayoHasta) { b.save(); b.globalAlpha = Math.floor(ahora / 40) % 2 ? 0.55 : 0.25; b.fillStyle = "#eef2ff"; b.fillRect(0, -ext.arriba, W, buf.height / SS); b.restore(); }
      }
    }
    /* Ambiente según el lugar: brasas, polvo, luciérnagas, nieve o motas del vacío. */
    const TIPO_AMB = { pico: "brasas", forja: "brasas", guarida: "brasas", bosque: "luciernagas", camino: "hojas", aldea: "luciernagas", sotano: "polvo", cripta: "polvo", mina: "polvo", castillo: "polvo", trono: "polvo", puente: "nieve", abismo: "vacio", telarana: "esporas", ruinas: "hojas", taberna: "polvo", encrucijada: "hojas" };
    function pintarAmbiente(ahora) {
      const tipo = TIPO_AMB[vista.fondo];
      if (!tipo) return;
      const max = tipo === "nieve" ? 40 : tipo === "polvo" ? 16 : 22;
      const alto0 = -ext.arriba, alto1 = H + ext.abajo;
      while (amb.length < max) {
        const nuevo = { x: Math.random() * W, y: alto0 + Math.random() * (alto1 - alto0), f: Math.random() * 6.28, t0: ahora - Math.random() * 6000, vida: 4000 + Math.random() * 5000 };
        if (tipo === "brasas" || tipo === "esporas" || tipo === "vacio") nuevo.y = H - 10 + Math.random() * 20;
        if (tipo === "nieve" || tipo === "hojas") nuevo.y = alto0 - Math.random() * 30;
        amb.push(nuevo);
      }
      b.save();
      if (tipo !== "hojas" && tipo !== "nieve") b.globalCompositeOperation = "lighter";
      for (let k = amb.length - 1; k >= 0; k--) {
        const q = amb[k], t = (ahora - q.t0) / 1000;
        if (ahora - q.t0 > q.vida) { amb.splice(k, 1); continue; }
        let x = q.x, y = q.y, col = "#fff", tam = 1, alfa = 1;
        if (tipo === "brasas") { y -= t * 14; x += Math.sin(t * 2 + q.f) * 4; col = t % 1 < 0.5 ? "#ff9a3a" : "#ffd27a"; alfa = Math.max(0, 1 - t / 5); }
        if (tipo === "esporas") { y -= t * 6; x += Math.sin(t + q.f) * 5; col = q.f > 3 ? "#7ff0e8" : "#e08aff"; alfa = Math.max(0, 1 - t / 7); }
        if (tipo === "vacio") { y -= t * 5; x += Math.sin(t * 0.7 + q.f) * 3; col = q.f > 3 ? "#9a7bff" : "#5ec8ff"; alfa = Math.max(0, 1 - t / 8); }
        if (tipo === "luciernagas") { x += Math.sin(t * 0.8 + q.f) * 10; y += Math.cos(t * 0.6 + q.f) * 6; col = "#d8ff7a"; alfa = (Math.sin(t * 3 + q.f) + 1) / 2; if (q.y < 40) alfa = 0; }
        if (tipo === "polvo") { x += Math.sin(t * 0.4 + q.f) * 6 + t * 1.5; y += Math.cos(t * 0.3 + q.f) * 4; col = "#e8dcc0"; alfa = 0.35 + Math.sin(t + q.f) * 0.25; }
        if (tipo === "nieve") { y += t * 16; x += Math.sin(t * 1.2 + q.f) * 6 - t * 3; col = "#f4f8ff"; tam = q.f > 4 ? 2 : 1; if (y > alto1) { amb.splice(k, 1); continue; } }
        if (tipo === "hojas") { y += t * 10; x += Math.sin(t * 1.5 + q.f) * 9 - t * 4; col = q.f > 3 ? "#d88a3a" : "#a8c050"; tam = 2; alfa = 0.9; if (y > alto1) { amb.splice(k, 1); continue; } }
        b.globalAlpha = Math.max(0, Math.min(1, alfa));
        b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), tam, tam);
        if (tipo === "luciernagas" && alfa > 0.6) { b.globalAlpha = (alfa - 0.6) * 1.5; b.drawImage(brillo("#c8ff5a", 3), Math.round(x) - 3, Math.round(y) - 3); }
      }
      b.restore();
    }
    /* Disolución en bloques tramados entre la escena anterior y la nueva. */
    function pintarTransicion(ahora) {
      const p = (ahora - transicion.t0) / transicion.dur;
      if (p >= 1 || transicion.cv.width !== buf.width || transicion.cv.height !== buf.height) { transicion = null; return; }
      const m = transicion.m || (transicion.m = Object.assign(document.createElement("canvas"), { width: buf.width, height: buf.height }));
      const c = m.getContext("2d");
      c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, m.width, m.height); c.drawImage(transicion.cv, 0, 0);
      c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000";
      const B = 4 * SS;
      for (let y = 0; y < m.height; y += B) for (let x = 0; x < m.width; x += B) if (PX.umbral(x / B, y / B) < p * 1.05) c.fillRect(x, y, B, B);
      b.setTransform(1, 0, 0, 1, 0, 0); b.drawImage(m, 0, 0); b.setTransform(SS, 0, 0, SS, 0, 0);
    }

    /* Qué actor hay en un punto del lienzo (px CSS) y dónde está la cabeza de un actor en pantalla. */
    function actorEn(x, y) {
      const ax = x / escCss + offX, ay = y / escCss - ext.arriba;
      let mejor = null, d = 1e9;
      for (const [id, m] of Object.entries(marcas)) {
        if (!m || m.x0 === undefined) continue;
        if (ax >= m.x0 - 4 && ax <= m.x1 + 4 && ay >= m.y0 - 6 && ay <= m.y1 + 2) { const dd = Math.abs(ax - m.cx); if (dd < d) { d = dd; mejor = id; } }
      }
      return mejor;
    }
    function pantalla(id) {
      const m = marcas[id];
      if (!m || m.x0 === undefined) return null;
      return { x: (m.cx - offX) * escCss, y: (m.y0 + ext.arriba) * escCss, pie: (m.y1 + ext.arriba) * escCss };
    }
    function ponerCompleta(fin) {
      const nuevo = fin === null ? null : { fin };
      if (JSON.stringify(nuevo) === JSON.stringify(completa)) return;
      completa = nuevo; ajustar();
    }
    const inst = { mostrar, efecto, ajustar, pintar, lienzo, actorEn, pantalla, completa: ponerCompleta, get vista() { return vista; }, destruir() { instancias.delete(inst); if (ro) ro.disconnect(); } };
    instancias.add(inst);
    return inst;
  }

  let ultimo = 0;
  function bucle(ahora) {
    requestAnimationFrame(bucle);
    if (ahora - ultimo < 1000 / 30) return;
    ultimo = ahora;
    for (const i of instancias) if (i.lienzo.isConnected && i.lienzo.getClientRects().length) i.pintar(ahora);
  }
  requestAnimationFrame(bucle);

  /* Retrato de un héroe: en fichas pequeñas, cabeza y hombros; en grande, de cuerpo entero. */
  function retrato(cv, look, opciones = {}) {
    const v = spriteHeroe(look);
    const grande = cv.classList.contains("retrato-grande");
    const tamCss = +cv.dataset.tam || (grande ? 144 : cv.classList.contains("mini") ? 54 : 60);
    if (opciones.caido) {
      const [c, s] = prepararLienzo(cv, tamCss, v.tw);
      c.drawImage(v.tumbado, 0, 0, v.tw * s, v.tw * s);
      return;
    }
    if (grande || tamCss >= 90) {
      const [c, s] = prepararLienzo(cv, tamCss, v.w);
      c.drawImage(v.normal, 0, 0, v.w * s, v.h * s);
      return;
    }
    /* Recorte cuadrado desde la cabeza: escala entera y el recorte se ajusta para llenar el tamaño pedido. */
    const dpr = window.devicePixelRatio || 1, ideal = Math.max(20, Math.round((v.pie - v.cima) * 0.6));
    const esc_ = Math.max(1, Math.round((tamCss * dpr) / ideal)), lado = Math.max(16, Math.min(v.w, Math.floor((tamCss * dpr) / esc_)));
    const [c, s] = prepararLienzo(cv, tamCss, lado);
    const sx = Math.round(v.cx - lado / 2), sy = Math.max(0, v.cima - 1);
    c.drawImage(v.normal, sx, sy, lado, lado, 0, 0, lado * s, lado * s);
  }
  function retratoRival(cv, tipo, clave) {
    const v = spriteRival(tipo, clave);
    const [c, s] = prepararLienzo(cv, 72, v.w);
    c.drawImage(cv.classList.contains("oculto") ? v.oscuro : v.normal, 0, 0, v.w * s, v.h * s);
  }

  /* Icono de interfaz HD (20×20); devuelve false si no existe para que se use el antiguo. */
  const cacheIcono = new Map();
  function icono(cv, clave, tamCss) {
    const T = tabla("ICONOS_HD");
    if (!T || !T[clave]) return false;
    let img = cacheIcono.get(clave);
    if (!img) { try { const g = T[clave](); img = { cv: lienzoDe(g), w: g.w }; } catch (e) { console.error("icono", clave, e); return false; } cacheIcono.set(clave, img); }
    const [c, s] = prepararLienzo(cv, tamCss || 22, img.w);
    c.drawImage(img.cv, 0, 0, img.w * s, img.w * s);
    return true;
  }

  /* Precalienta en los ratos libres el arte que va a hacer falta (fondos y rivales del acto) para que no haya tirones. */
  function precalentar(lista) {
    const cola = lista.slice(), ric = window.requestIdleCallback || (f => setTimeout(() => f({ timeRemaining: () => 8 }), 60));
    const paso = dl => { while (cola.length && dl.timeRemaining() > 4) { const [t, k] = cola.shift(); try { if (t === "fondo") fondo(k); else if (t === "heroe") spriteHeroe(k); else spriteRival(t, k); } catch (e) {} } if (cola.length) ric(paso); };
    ric(paso);
  }
  return { W, H, HUECOS, crear, precalentar, dibujarDado, retrato, retratoRival, icono, hayIcono: k => !!(tabla("ICONOS_HD") || {})[k], limpiarCache() { cacheFondo.clear(); cacheSprite.clear(); cacheIcono.clear(); } };
})();
