/* Dados y Mazmorras · escenario: fondo, héroes, rivales y efectos en un lienzo de 256×144 píxeles de arte.
   Usa el arte HD (48×48, jefes 80×80) cuando está registrado y, si falta alguna pieza, el arte antiguo de 36×36. */
const ESCENARIO = (() => {
  "use strict";
  const W = 256, H = 144;
  const W0 = 192, H0 = 108; /* tamaño de los fondos antiguos */
  const R = PX.RAMPAS;
  const reducido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  /* Pies de cada héroe (x centro, y suelo): tres delante y tres detrás. */
  const HUECOS = [[80, 140], [44, 137], [116, 135], [62, 125], [98, 124], [24, 125]];
  const POS_MASCOTA = [146, 141];
  /* Con varios enemigos se reparten a la derecha (el principal, delante). */
  const POS_RIVALES = [[[198, 137]], [[180, 139], [224, 128]], [[170, 140], [206, 133], [236, 124]]];
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
    const tum = rej.tumbada().tenida(R.piedra);
    const m = medir(rej), mt = medir(tum);
    const v = {
      normal: lienzoDe(rej),
      blanco: lienzoDe(rej.silueta("#fff7ea")),
      tumbado: lienzoDe(tum),
      piedra: lienzoDe(rej.tenida(R.marmol)),
      oscuro: lienzoDe(rej.tenida(R.sombra)),
      w: rej.w, h: rej.h, cima: m.y0, pie: m.y1, ancho: m.x1 - m.x0 + 1, cx: (m.x0 + m.x1 + 1) / 2,
      tw: tum.w, tpie: mt.y1, tcx: (mt.x0 + mt.x1 + 1) / 2
    };
    cacheSprite.set(clave, v);
    return v;
  }
  const spriteHeroe = look => sprite("h:" + JSON.stringify(look), [
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

  /* ---------- Instancias de escenario ---------- */
  const instancias = new Set();

  /* opciones.limites() devuelve el ancho y alto máximos (px CSS) que puede ocupar el escenario. */
  function crear(lienzo, opciones = {}) {
    const buf = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const b = buf.getContext("2d");
    const viejoBuf = Object.assign(document.createElement("canvas"), { width: W0, height: H0 });
    const vb = viejoBuf.getContext("2d");
    const ctx = lienzo.getContext("2d");
    let vista = { fondo: "taberna", heroes: [], rival: null, activo: -1 };
    /* Pantalla completa (combate): el escenario se alarga por arriba (cielo) y por abajo (suelo) hasta llenar la pantalla. */
    let completa = null, ext = { arriba: 0, abajo: 0 }, escCss = 1;
    const efectos = [];
    /* Partículas: chispas de impacto, polvo, humo de muerte, destellos de conjuro. */
    const parts = [];
    let temblor = 0;
    const chispa = (x, y, o) => { if (parts.length < 160) parts.push(Object.assign({ x, y, vx: 0, vy: 0, g: 0.12, vida: 420, t0: performance.now(), color: "#fff7ea", tam: 1 }, o)); };
    /* Altura visible de cada actor en el último fotograma (para colocar números y efectos). */
    const marcas = {};

    function ajustar() {
      const caja = lienzo.parentElement;
      if (!caja || (!caja.offsetParent && !(completa && caja.getClientRects().length))) return;
      const dpr = window.devicePixelRatio || 1;
      if (completa) {
        const aw = window.innerWidth, ah = window.innerHeight, sc = aw / W;
        const arriba = Math.max(0, Math.round(completa.fin / sc - H)), total = Math.max(H, Math.ceil(ah / sc));
        ext = { arriba, abajo: Math.max(0, total - H - arriba) };
        escCss = sc;
        if (buf.height !== total) buf.height = total;
        const pw = Math.round(aw * dpr), ph = Math.round(total * sc * dpr);
        if (lienzo.width !== pw || lienzo.height !== ph) { lienzo.width = pw; lienzo.height = ph; }
        const cw = aw + "px", ch = total * sc + "px";
        if (lienzo.style.width !== cw || lienzo.style.height !== ch) { lienzo.style.width = cw; lienzo.style.height = ch; }
        caja.style.height = "";
        return;
      }
      ext = { arriba: 0, abajo: 0 };
      if (buf.height !== H) buf.height = H;
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
    function posicion(obj) {
      const o = normalizar(obj);
      if (o === "m") return POS_MASCOTA;
      if (o[0] === "e") return posRivales()[+o.slice(1)] || POS_RIVAL;
      return HUECOS[+o.slice(1)] || HUECOS[0];
    }
    function alto(obj) { const m = marcas[normalizar(obj)]; return m ? Math.max(14, m.alto) : 36; }
    function mostrar(v) {
      if (v.fondo && v.fondo !== vista.fondo) efectos.length = 0;
      if ("rival" in v && !("rivales" in v)) v = Object.assign({}, v, { rivales: v.rival ? [v.rival] : [] });
      vista = Object.assign({}, vista, v);
    }
    function efecto(e) {
      if (reducido && e.tipo !== "numero") return;
      if (e.objetivo === "e") e = Object.assign({}, e, { objetivo: "e0" });
      if (e.actor === "e") e = Object.assign({}, e, { actor: "e0" });
      efectos.push(Object.assign({ t0: performance.now(), dur: { numero: 1100, golpe: 320, ataque: 420, magia: 700, cura: 800, muerte: 950, proyectil: 300, tajo: 260, destello: 380, salto: 900 }[e.tipo] || 500 }, e));
      if (e.tipo === "golpe" && e.fuerte) temblor = performance.now() + 260;
    }
    function desplazamiento(id, ahora) {
      let dx = 0, dy = 0, blanco = false;
      for (const e of efectos) {
        const p = (ahora - e.t0) / e.dur;
        if (p < 0 || p > 1) continue;
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
        b.drawImage(fd.cv, 0, 0);
        if (fd.anim && !reducido) { try { fd.anim(b, ahora); } catch (e) { /* idem */ } }
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
      b.clearRect(0, 0, W, buf.height);
      if (ext.arriba || ext.abajo) b.drawImage(extension(vista.fondo, ext.arriba, ext.abajo), 0, 0);
      b.save();
      b.translate(0, ext.arriba);
      if (temblor > ahora && !reducido) b.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
      pintarFondo(ahora);
      if (vista.niebla) pintarNiebla(ahora, vista.niebla * 0.55);
      const actores = [];
      const marcha = !!vista.marcha && !reducido;
      vista.heroes.forEach((h, i) => {
        const [fx, fy] = HUECOS[i] || HUECOS[0];
        actores.push({ id: "h" + i, h, fx, fy, i });
      });
      if (vista.mascota && hayMascota(vista.mascota)) actores.push({ id: "m", mascota: vista.mascota, fx: POS_MASCOTA[0], fy: POS_MASCOTA[1] });
      const pr = posRivales();
      (vista.rivales || []).forEach((rv, k) => { if (rv && pr[k]) actores.push({ id: "e" + k, k, rival: rv, fx: pr[k][0], fy: pr[k][1] }); });
      actores.sort((a, c) => a.fy - c.fy);
      for (const a of actores) {
        const [dx, dy, blanco] = desplazamiento(a.id, ahora);
        if (a.mascota) {
          const v = spriteMascota(a.mascota);
          const bob = reducido ? 0 : marcha ? -Math.abs(Math.round(Math.sin(ahora / 120) * 2)) : Math.floor((ahora / 420) % 2);
          const x = Math.round(a.fx - v.w / 2 + dx), y = Math.round(a.fy - v.pie + bob + dy);
          sombraSuelo(a.fx, a.fy, Math.max(12, v.ancho * 0.7));
          b.drawImage(blanco ? v.blanco : v.normal, x, y);
          marcas.m = { alto: v.pie - v.cima, x0: a.fx - v.ancho / 2, x1: a.fx + v.ancho / 2, y0: y + v.cima, y1: a.fy, cx: a.fx };
          continue;
        }
        if (a.h) {
          const v = spriteHeroe(a.h.look);
          if (a.h.caido) {
            sombraSuelo(a.fx, a.fy, v.ancho * 0.9);
            b.drawImage(v.tumbado, Math.round(a.fx - v.tcx), Math.round(a.fy - v.tpie));
            marcas[a.id] = { alto: 12 };
            continue;
          }
          let bob;
          if (reducido) bob = 0;
          else if (marcha) bob = -Math.abs(Math.round(Math.sin(ahora / 160 + a.i * 1.3) * 2));
          else bob = Math.floor((ahora / 520 + a.i * 0.37) % 2);
          sombraSuelo(a.fx, a.fy, Math.max(16, v.ancho * 0.8));
          const img = blanco ? v.blanco : a.h.piedra ? v.piedra : v.normal;
          const x = Math.round(a.fx - v.w / 2 + dx), y = Math.round(a.fy - v.pie + bob + dy);
          if (Math.abs(dx) > 8 && !blanco) { b.globalAlpha = 0.25; b.drawImage(img, x - Math.sign(dx) * 6, y); b.globalAlpha = 1; }
          b.drawImage(img, x, y);
          const cima = y + v.cima;
          marcas[a.id] = { alto: v.pie - v.cima, x0: a.fx - v.ancho / 2, x1: a.fx + v.ancho / 2, y0: cima, y1: a.fy, cx: a.fx };
          if (vista.activo === a.i && !vista.esperaRival) flecha(a.fx + 1, cima - 10 + (reducido ? 0 : Math.floor(ahora / 260) % 2), R.bronce[4]);
          if (a.h.aturdido) zz(a.fx + 8, cima - 2, ahora);
          puntos(a.fx + 1, cima - (vista.activo === a.i ? 17 : 8), a.h.estados);
        } else {
          const r = a.rival;
          const v = spriteRival(r.tipo, r.clave);
          const ix = Math.round(a.fx - v.w / 2 + dx);
          let iy = Math.round(a.fy - v.pie + dy);
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
          if (r.tipo === "enemigo" && !r.silueta) sombraSuelo(a.fx, a.fy, Math.max(18, v.ancho * 0.8));
          b.globalAlpha = alfa;
          if (Math.abs(dx) > 8 && !blanco) { b.globalAlpha = alfa * 0.25; b.drawImage(v.normal, ix - Math.sign(dx) * 6, iy); b.globalAlpha = alfa; }
          b.drawImage(blanco ? v.blanco : r.silueta ? v.oscuro : r.petrificado || r.congelado ? v.piedra : v.normal, ix, iy);
          b.globalAlpha = 1;
          const cima = iy + v.cima;
          marcas[a.id] = r.derrotado ? null : { alto: v.pie - v.cima, x0: a.fx - v.ancho / 2, x1: a.fx + v.ancho / 2, y0: cima, y1: a.fy, cx: a.fx };
          if (r.tipo === "enemigo" && r.max) {
            const ancho = v.h > 60 ? 46 : 32;
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
        if (e.tipo === "proyectil") {
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
          const cy = Math.round(y - al * 0.75);
          const n = Math.round(p * 20);
          b.fillStyle = "#fff7ea";
          for (let t = 0; t < n; t++) b.fillRect(x - 11 + t, cy + t, 3, 1);
          b.fillStyle = e.color || R.bronce[4];
          for (let t = 0; t < n - 4; t++) b.fillRect(x - 10 + t, cy - 1 + t, 1, 1);
        }
        if (e.tipo === "destello" && Math.floor(p * 6) % 2 === 0) { b.fillStyle = e.color || "rgba(255,247,234,0.55)"; b.fillRect(0, 0, W, H); }
        if (e.tipo === "magia" || e.tipo === "cura") {
          const col = e.tipo === "cura" ? R.hoja : (e.rampa || R.magia);
          const cy = y - al * 0.45;
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
      if (!ext.arriba && !ext.abajo) b.drawImage(capaVineta(), 0, 0);
      b.restore();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, lienzo.width, lienzo.height);
    }

    /* Qué actor hay en un punto del lienzo (px CSS) y dónde está la cabeza de un actor en pantalla. */
    function actorEn(x, y) {
      const ax = x / escCss, ay = y / escCss - ext.arriba;
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
      return { x: m.cx * escCss, y: (m.y0 + ext.arriba) * escCss, pie: (m.y1 + ext.arriba) * escCss };
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

  return { W, H, HUECOS, crear, dibujarDado, retrato, retratoRival, icono, hayIcono: k => !!(tabla("ICONOS_HD") || {})[k], limpiarCache() { cacheFondo.clear(); cacheSprite.clear(); cacheIcono.clear(); } };
})();
