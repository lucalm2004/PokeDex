/* Dados y Mazmorras · escenario: fondo, héroes, rival y efectos en un lienzo de 192×108 píxeles de arte,
   escalado a múltiplos enteros de los píxeles del dispositivo para que el pixel art quede nítido. */
const ESCENARIO = (() => {
  "use strict";
  const W = 192, H = 108;
  const R = PX.RAMPAS;
  const reducido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  /* Pies de cada héroe en el escenario (x centro, y suelo) y del rival. */
  const HUECOS = [[62, 101], [34, 97], [92, 97], [48, 88], [78, 88], [18, 89]];
  const POS_RIVAL = [150, 99];
  /* Con varios enemigos se reparten a la derecha (el principal, delante). */
  const POS_RIVALES = [[[150, 99]], [[138, 101], [170, 93]], [[132, 102], [162, 97], [180, 89]]];

  const cacheFondo = new Map();
  const cacheSprite = new Map();

  function lienzoDe(rej) { return rej.aCanvas(1); }
  function fondo(clave) {
    if (cacheFondo.has(clave)) return cacheFondo.get(clave);
    const g = new PX.Rejilla(W, H);
    const def = typeof FONDOS !== "undefined" && FONDOS[clave];
    if (def && def.base) {
      try { def.base(g); } catch (e) { console.error("fondo", clave, e); }
    } else {
      g.degradado(0, 0, W, 72, R.tela.violeta[1], R.tela.terracota[1]);
      g.degradado(0, 72, W, 36, R.madera[1], R.madera[0]);
    }
    const cv = lienzoDe(g);
    cacheFondo.set(clave, cv);
    return cv;
  }
  function provisional() {
    const g = new PX.Rejilla(36, 36);
    new PX.Capa().ell(18, 20, 9, 12).pintar(g, R.sombra, { relieve: 4 });
    g.set(14, 16, R.bronce[4]).set(20, 16, R.bronce[4]);
    return g.contorno();
  }
  /* Cada sprite guarda sus variantes ya dibujadas: normal, blanco (golpe), tumbado (caído) y piedra. */
  function sprite(clave, fabrica) {
    if (cacheSprite.has(clave)) return cacheSprite.get(clave);
    let rej;
    try { rej = fabrica(); } catch (e) { console.error("sprite", clave, e); }
    if (!rej) rej = provisional();
    const v = {
      normal: lienzoDe(rej),
      blanco: lienzoDe(rej.silueta("#fff7ea")),
      tumbado: lienzoDe(rej.tumbada().tenida(R.piedra)),
      piedra: lienzoDe(rej.tenida(R.marmol)),
      oscuro: lienzoDe(rej.tenida(R.sombra))
    };
    cacheSprite.set(clave, v);
    return v;
  }
  const spriteHeroe = look => sprite("h:" + JSON.stringify(look), () => HEROES.componer(look));
  const spriteRival = (tipo, clave) => sprite(tipo + ":" + clave, () => {
    const tabla = tipo === "pnj" ? (typeof PNJ !== "undefined" ? PNJ : null) : (typeof MONSTRUOS !== "undefined" ? MONSTRUOS : null);
    return tabla && tabla[clave] ? tabla[clave]() : null;
  });

  /* Ajusta un lienzo pequeño (36×36 de arte) al múltiplo entero de píxeles del dispositivo más cercano a su tamaño pedido. */
  function prepararLienzo(cv, tamPorDefecto) {
    const dpr = window.devicePixelRatio || 1;
    const tam = +cv.dataset.tam || parseFloat(getComputedStyle(cv).getPropertyValue("--tam")) || tamPorDefecto;
    const s = Math.max(1, Math.round((tam * dpr) / 36));
    if (cv.width !== 36 * s) { cv.width = 36 * s; cv.height = 36 * s; }
    const css = (36 * s) / dpr + "px";
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
    cara.forEach(([x, y], i) => { const [x2, y2] = hex[(variante ? [0, 2, 4] : [0, 2, 4])[i]]; aristas.linea(x, y, x2, y2, 1); });
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

  /* ---------- Instancias de escenario ---------- */
  const instancias = new Set();

  /* opciones.limites() devuelve el ancho y alto máximos (px CSS) que puede ocupar el escenario;
     el lienzo toma el mayor múltiplo entero que cabe y la caja se ajusta a su altura. */
  function crear(lienzo, opciones = {}) {
    const buf = Object.assign(document.createElement("canvas"), { width: W, height: H });
    const b = buf.getContext("2d");
    const ctx = lienzo.getContext("2d");
    let escala = 1;
    let vista = { fondo: "taberna", heroes: [], rival: null, activo: -1 };
    const efectos = [];

    function ajustar() {
      const caja = lienzo.parentElement;
      if (!caja || !caja.offsetParent) return;
      const dpr = window.devicePixelRatio || 1;
      const [aw, ah] = opciones.limites ? opciones.limites() : [caja.clientWidth, caja.clientHeight || 1e9];
      if (!aw || aw < 40) return;
      let s = Math.floor(Math.min((aw * dpr) / W, (Math.max(ah, 40) * dpr) / H));
      if (s < 1) s = 1;
      escala = s;
      if (lienzo.width !== W * s) { lienzo.width = W * s; lienzo.height = H * s; }
      const cw = (W * s) / dpr + "px", ch = (H * s) / dpr + "px";
      if (lienzo.style.width !== cw) { lienzo.style.width = cw; lienzo.style.height = ch; }
      if (opciones.limites) { const alto = (H * s) / dpr + 12 + "px"; if (caja.style.height !== alto) caja.style.height = alto; }
    }
    const ro = window.ResizeObserver ? new ResizeObserver(() => ajustar()) : null;
    if (ro) ro.observe(opciones.observar || lienzo.parentElement);
    window.addEventListener("resize", ajustar);
    ajustar();

    const posRivales = () => POS_RIVALES[Math.min(3, Math.max(1, (vista.rivales || []).length)) - 1];
    function posicion(obj) {
      const o = String(obj || "e");
      if (o[0] === "e") { const k = o === "e" ? 0 : +o.slice(1); return posRivales()[k] || POS_RIVAL; }
      const i = +o.slice(1);
      return HUECOS[i] || HUECOS[0];
    }
    function mostrar(v) {
      if (v.fondo && v.fondo !== vista.fondo) efectos.length = 0;
      if ("rival" in v && !("rivales" in v)) v = Object.assign({}, v, { rivales: v.rival ? [v.rival] : [] });
      vista = Object.assign({}, vista, v);
    }
    function efecto(e) {
      if (reducido && e.tipo !== "numero") return;
      if (e.objetivo === "e") e = Object.assign({}, e, { objetivo: "e0" });
      if (e.actor === "e") e = Object.assign({}, e, { actor: "e0" });
      efectos.push(Object.assign({ t0: performance.now(), dur: { numero: 1100, golpe: 260, ataque: 320, magia: 700, cura: 700, muerte: 800, proyectil: 300, tajo: 260, destello: 380, salto: 900 }[e.tipo] || 500 }, e));
    }
    function desplazamiento(id, ahora) {
      let dx = 0, dy = 0, blanco = false;
      for (const e of efectos) {
        const p = (ahora - e.t0) / e.dur;
        if (p < 0 || p > 1) continue;
        if (e.tipo === "ataque" && e.actor === id) dx += Math.round(Math.sin(p * Math.PI) * 10) * (id[0] === "e" ? -1 : 1);
        if (e.tipo === "golpe" && e.objetivo === id) { blanco = p < 0.45; dx += p < 0.8 ? (Math.floor(p * 12) % 2 ? 1 : -1) : 0; }
        if (e.tipo === "salto" && (e.actor === id || (e.actor === "h*" && id[0] === "h"))) dy -= Math.round(Math.abs(Math.sin(p * Math.PI * 2)) * 6);
      }
      return [dx, dy, blanco];
    }
    function sombraSuelo(x, y, ancho) {
      b.fillStyle = "rgba(10,6,4,0.38)";
      b.fillRect(x - ancho / 2 + 2, y, ancho - 4, 1);
      b.fillRect(x - ancho / 2, y + 1, ancho, 1);
      b.fillRect(x - ancho / 2 + 2, y + 2, ancho - 4, 1);
    }
    function flecha(x, y, color) {
      b.fillStyle = PX.CONTORNO;
      b.fillRect(x - 3, y - 1, 7, 1); b.fillRect(x - 3, y, 7, 2); b.fillRect(x - 2, y + 2, 5, 1); b.fillRect(x - 1, y + 3, 3, 1); b.fillRect(x, y + 4, 1, 1);
      b.fillStyle = color;
      b.fillRect(x - 2, y, 5, 1); b.fillRect(x - 1, y + 1, 3, 1); b.fillRect(x, y + 2, 1, 1);
    }
    /* Fila de puntitos de color, uno por estado (veneno, quemadura…). */
    function puntos(x, y, colores) {
      const n = (colores || []).length;
      if (!n) return;
      const x0 = Math.round(x - (n * 4 - 1) / 2);
      colores.forEach((col, k) => { b.fillStyle = PX.CONTORNO; b.fillRect(x0 + k * 4 - 1, y - 1, 5, 5); b.fillStyle = col; b.fillRect(x0 + k * 4, y, 3, 3); });
    }
    function barra(x, y, ancho, valor, max, color) {
      b.fillStyle = PX.CONTORNO; b.fillRect(x - 1, y - 1, ancho + 2, 4);
      b.fillStyle = R.sangre[0]; b.fillRect(x, y, ancho, 2);
      b.fillStyle = color; b.fillRect(x, y, Math.max(0, Math.round((ancho * valor) / max)), 2);
      b.fillStyle = "rgba(255,255,255,0.35)"; b.fillRect(x, y, Math.max(0, Math.round((ancho * valor) / max)), 1);
    }

    function pintar(ahora) {
      b.clearRect(0, 0, W, H);
      b.drawImage(fondo(vista.fondo), 0, 0);
      const def = typeof FONDOS !== "undefined" && FONDOS[vista.fondo];
      if (def && def.anim && !reducido) { try { def.anim(b, ahora); } catch (e) { /* un fallo de animación no debe parar el juego */ } }
      const actores = [];
      vista.heroes.forEach((h, i) => {
        const [fx, fy] = HUECOS[i] || HUECOS[0];
        actores.push({ id: "h" + i, h, fx, fy, i });
      });
      const pr = posRivales();
      (vista.rivales || []).forEach((rv, k) => { if (rv && pr[k]) actores.push({ id: "e" + k, k, rival: rv, fx: pr[k][0], fy: pr[k][1] }); });
      actores.sort((a, c) => a.fy - c.fy);
      for (const a of actores) {
        const [dx, dy, blanco] = desplazamiento(a.id, ahora);
        if (a.h) {
          const v = spriteHeroe(a.h.look);
          if (a.h.caido) {
            sombraSuelo(a.fx, a.fy - 1, 26);
            b.drawImage(v.tumbado, a.fx - 18, a.fy - 30 + 12);
            continue;
          }
          const bob = reducido ? 0 : Math.floor((ahora / 520 + a.i * 0.37) % 2);
          sombraSuelo(a.fx, a.fy - 1, 16);
          const img = blanco ? v.blanco : a.h.piedra ? v.piedra : v.normal;
          b.drawImage(img, a.fx - 18 + dx, a.fy - 35 + bob + dy);
          if (vista.activo === a.i && !vista.esperaRival) flecha(a.fx + 1, a.fy - 43 + (reducido ? 0 : Math.floor(ahora / 260) % 2), R.bronce[4]);
          let iy = a.fy - 40;
          if (a.h.aturdido) { PX.texto(b, "ZZ", a.fx - 9, iy, R.mar[4]); }
          puntos(a.fx + 1, a.fy - 48, a.h.estados);
        } else {
          const r = a.rival;
          const v = spriteRival(r.tipo, r.clave);
          let ix = a.fx - 18 + dx, iy = a.fy - 35 + dy;
          if (!reducido && r.flota) iy += Math.round(Math.sin(ahora / 400) * 2) - 3;
          else if (!reducido) iy += Math.floor((ahora / 640) % 2);
          const muerte = efectos.find(e => e.tipo === "muerte" && e.objetivo === a.id);
          if (r.derrotado && !muerte) continue;
          if (muerte) {
            const p = (ahora - muerte.t0) / muerte.dur;
            if (p > 1) continue;
            if (Math.floor(p * 10) % 2) continue;
          }
          if (r.tipo === "enemigo") sombraSuelo(a.fx, a.fy - 1, 22);
          b.drawImage(blanco ? v.blanco : r.petrificado || r.congelado ? v.piedra : v.normal, ix, iy);
          if (r.tipo === "enemigo" && r.max) {
            barra(a.fx - 15, a.fy - 41, 30, r.hp, r.max, R.sangre[4]);
            if (r.aturdido) PX.texto(b, "ZZ", a.fx - 22, a.fy - 43, R.mar[4]);
            puntos(a.fx, a.fy - 47, r.estados);
            if (vista.objetivo === a.k && (vista.rivales || []).length > 1 && !r.derrotado) flecha(a.fx, a.fy - 55 + (reducido ? 0 : Math.floor(ahora / 260) % 2), R.sangre[4]);
          }
        }
      }
      for (let k = efectos.length - 1; k >= 0; k--) {
        const e = efectos[k];
        const p = (ahora - e.t0) / e.dur;
        if (p > 1) { efectos.splice(k, 1); continue; }
        if (p < 0) continue;
        const [x, y] = posicion(e.objetivo || e.actor);
        if (e.tipo === "numero") {
          const sube = Math.round(Math.min(1, p * 1.6) * 12);
          const esc = e.grande ? 2 : 1;
          const ancho = PX.anchoTexto(e.texto, esc);
          if (p < 0.85 || Math.floor(p * 20) % 2) PX.texto(b, e.texto, Math.round(x - ancho / 2), y - 30 - sube - (e.fila || 0) * 7, e.color || "#fff7ea", PX.CONTORNO, esc);
        }
        if (e.tipo === "proyectil") {
          const [ox, oy] = posicion(e.actor), q = Math.min(1, p * 1.15);
          const px = Math.round(ox + (x - ox) * q), py = Math.round(oy - 20 + (y - oy) * q - Math.sin(q * Math.PI) * (e.forma === "flecha" ? 6 : 3));
          const col = e.forma === "luz" ? R.bronce : e.forma === "flecha" ? R.madera : (e.rampa || R.magia);
          if (e.forma === "flecha") { b.fillStyle = col[3]; b.fillRect(px - 4, py, 6, 1); b.fillStyle = R.hueso[4]; b.fillRect(px + 2, py - 1, 2, 3); }
          else if (e.forma === "luz") { b.fillStyle = col[4]; for (let t = 0; t < 7; t++) b.fillRect(Math.round(ox + (x - ox) * q * (t / 6)), Math.round(oy - 20 + (y - oy) * q * (t / 6)), 2, 1); b.fillRect(px - 1, py - 1, 3, 3); }
          else { b.fillStyle = col[2]; b.fillRect(px - 2, py - 2, 5, 5); b.fillStyle = col[4]; b.fillRect(px - 1, py - 1, 3, 3); b.fillStyle = "#fff7ea"; b.fillRect(px, py, 1, 1); }
        }
        if (e.tipo === "tajo") {
          b.fillStyle = "#fff7ea";
          const n = Math.round(p * 14);
          for (let t = 0; t < n; t++) b.fillRect(x - 8 + t, y - 30 + t, 2, 1);
          b.fillStyle = e.color || R.bronce[4];
          for (let t = 0; t < n - 3; t++) b.fillRect(x - 7 + t, y - 31 + t, 1, 1);
        }
        if (e.tipo === "destello" && Math.floor(p * 6) % 2 === 0) { b.fillStyle = e.color || "rgba(255,247,234,0.55)"; b.fillRect(0, 0, W, H); }
        if (e.tipo === "magia" || e.tipo === "cura") {
          const col = e.tipo === "cura" ? R.hoja : (e.rampa || R.magia);
          for (let n = 0; n < 9; n++) {
            const ang = n * 0.7 + p * 5;
            const rad = 4 + p * 12;
            const px = Math.round(x + Math.cos(ang) * rad * 0.8), py = Math.round(y - 16 + Math.sin(ang) * rad * 0.6 - p * 8);
            b.fillStyle = col[n % 2 ? 3 : 4];
            b.fillRect(px, py, 1 + (n % 3 === 0 ? 1 : 0), 1 + (n % 3 === 0 ? 1 : 0));
          }
        }
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(buf, 0, 0, W * escala, H * escala);
    }

    const inst = { mostrar, efecto, ajustar, pintar, lienzo, get vista() { return vista; }, destruir() { instancias.delete(inst); if (ro) ro.disconnect(); } };
    instancias.add(inst);
    return inst;
  }

  let ultimo = 0;
  function bucle(ahora) {
    requestAnimationFrame(bucle);
    if (ahora - ultimo < 1000 / 30) return;
    ultimo = ahora;
    for (const i of instancias) if (i.lienzo.isConnected && i.lienzo.offsetParent !== null) i.pintar(ahora);
  }
  requestAnimationFrame(bucle);

  /* Retrato pequeño de un héroe para fichas y botones. */
  function retrato(cv, look, opciones = {}) {
    const v = spriteHeroe(look);
    const [c, s] = prepararLienzo(cv, cv.classList.contains("retrato-grande") ? 144 : cv.classList.contains("mini") ? 54 : 60);
    c.drawImage(opciones.caido ? v.tumbado : v.normal, 0, 0, 36 * s, 36 * s);
  }
  function retratoRival(cv, tipo, clave) {
    const v = spriteRival(tipo, clave);
    const [c, s] = prepararLienzo(cv, 72);
    c.drawImage(cv.classList.contains("oculto") ? v.oscuro : v.normal, 0, 0, 36 * s, 36 * s);
  }

  return { W, H, HUECOS, crear, dibujarDado, retrato, retratoRival, limpiarCache() { cacheFondo.clear(); cacheSprite.clear(); } };
})();
