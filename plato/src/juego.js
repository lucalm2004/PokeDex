/* Dados y Mazmorras · el juego: selección de personajes con cuenta atrás, mapa de caminos por actos,
   combates por iniciativa, sucesos, tiendas y jefes. En línea, el móvil del anfitrión lleva la partida:
   guarda el estado en db y los demás le mandan sus jugadas por la presencia de la sala (room). */
(() => {
"use strict";
const D = DATOS;
const { STATS, ABREV, ROMANOS, NIVELES, NOMBRES, RAZAS, CLASES, ALINEAMIENTOS, HABILIDADES, APRENDE, OBJETOS, RAREZAS, rareza, BOTIN, RANURAS, TIENDAS, TIPOS_DANO, ENEMIGOS, ACTOS, EVENTOS, HOGUERA, FINALES, EPILOGOS, LORE } = D;
const RP = PX.RAMPAS;

const CLAVE = "dym-partida-v5";
const CLAVE_MESA = "dym-mesa-v5";
const MAX_HEROES = 4;
const SEGUNDOS = 90;
const $ = s => document.querySelector(s);
const d = n => 1 + Math.floor(Math.random() * n);
const tirar = (c, s, b = 0) => { let t = b; for (let i = 0; i < c; i++) t += d(s); return t; };
const fmt = n => (n >= 0 ? "+" : "−") + Math.abs(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const azarDe = a => a[Math.floor(Math.random() * a.length)];
const reducido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const CONSUMIBLES = ["pocion", "superior", "bendicion", "fuego", "sueno"];
const leer = (k, def) => { try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; } };
const escribir = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

/* Cada pestaña tiene su propia identidad de jugador (sobrevive a recargar la página). */
const miId = (() => {
  try { let v = sessionStorage.getItem("dym-id"); if (!v) { v = "j" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("dym-id", v); } return v; }
  catch (e) { return "j" + Math.random().toString(36).slice(2, 10); }
})();

let S = null;
let vista = "inicio";
let ocupado = false, submenu = null, modal = null, esperandoHost = false, remoto = null;
let dadoVisto = 0, efectosVistos = 0;
let escJuego = null, escSel = null, escInicio = null;

/* ---------- Héroes ---------- */
function heroeAlAzar(i = 0) {
  const razas = Object.keys(RAZAS), clases = Object.keys(CLASES);
  const raza = razas[(i * 3 + Math.floor(Math.random() * 8)) % razas.length], clase = clases[(i * 5 + Math.floor(Math.random() * 8)) % clases.length];
  const vis = HEROES.RAZAS[raza];
  return {
    nombre: NOMBRES[(i * 7 + Math.floor(Math.random() * NOMBRES.length)) % NOMBRES.length], raza, clase, alin: "N",
    look: { piel: azarDe(vis.pieles), pelo: vis.pelos.length ? azarDe(vis.pelos) : null, tela: HEROES.TELA_CLASE[clase], peinado: azarDe(["corto", "largo", "recogido", "rizado"]), barba: Math.random() < 0.3 }
  };
}
function nuevoHeroe(def) {
  const raza = RAZAS[def.raza] ? def.raza : "humano", clase = CLASES[def.clase] ? def.clase : "guerrero";
  const c = CLASES[clase], r = RAZAS[raza];
  const base = {};
  for (const k of Object.keys(STATS)) base[k] = c.stats[k] + (r.mods[k] || 0);
  const almaBase = c.alma + r.alma;
  return {
    nombre: String(def.nombre || "").trim().slice(0, 16) || "Anónimo", raza, clase, alin: ALINEAMIENTOS[def.alin] ? def.alin : "N",
    look: Object.assign({}, def.look || {}), uid: def.uid || null, base, almaBase, alma: almaBase, xp: 0, nivel: 1, oro: 15,
    equipo: { arma: null, armadura: null, talisman: null }, habs: APRENDE[clase][1].slice(), usosH: {}, est: { aturdido: 0, cegado: 0 }, fl: {}
  };
}
const lookDe = p => Object.assign({ raza: p.raza, clase: p.clase }, p.look);
const obj = id => (id ? OBJETOS[id] : null);
function stat(p, k) { const t = obj(p.equipo.talisman); return p.base[k] + (t && t.stat === k ? 1 : 0); }
function maxAlma(p) { const a = obj(p.equipo.armadura); return p.almaBase + (a && a.alma ? a.alma : 0); }
function ca(p) {
  const a = obj(p.equipo.armadura), t = obj(p.equipo.talisman);
  return 10 + stat(p, "ani") + (a && a.ca ? a.ca : 0) + (t && t.ca ? t.ca : 0) + (p.clase === "guerrero" ? 2 : 0);
}
function iniMod(p) { const t = obj(p.equipo.talisman); return stat(p, "tem") + (t && t.ini ? t.ini : 0); }
function critMin(p) { const t = obj(p.equipo.talisman); return t && t.critico ? t.critico : 20; }
const H = id => HABILIDADES[id];
const ABR_TIPO = { fisica: "físico", arcana: "mágico", sagrada: "sagrado" };
/* Resumen corto de una habilidad para los botones: «1d8+3 físico», «Cura 1d8+2»… */
function resumenHab(id, p) {
  const h = H(id), m = h.stat ? statHab(p, h) : 0;
  const dados = h.dado ? `${h.golpes ? h.golpes + "×" : ""}${h.dado[0]}d${h.dado[1]}${fmt(m + (h.bono || 0))}` : "";
  if (h.efecto === "dano") return `${dados} ${ABR_TIPO[h.tipo]}${h.tirada ? "" : " · seguro"}`;
  if (h.efecto === "cura") return `Cura ${dados}${h.a === "grupo" ? " al grupo" : h.a === "yo" ? " a ti" : ""}`;
  return { escudo: "Bloquea un ataque", aturde: "Pierde un turno", maldice: "+2 daño recibido", debilita: "−2 a su ataque", veneno: `Veneno ${h.turnos} turnos` }[h.efecto];
}
function statHab(p, h) { return h.stat ? stat(p, h.stat) : 0; }
/* Próxima habilidad que aprenderá el héroe. */
function proximaHab(p) {
  const t = APRENDE[p.clase];
  const n = Object.keys(t).map(Number).filter(l => l > p.nivel).sort((a, b) => a - b)[0];
  return n ? { nivel: n, ids: t[n] } : null;
}
const nombreRazaClase = p => `${CLASES[p.clase].nombre} ${RAZAS[p.raza].nombre.toLowerCase()}`;
const EJEMPLO = [
  { nombre: "Aldric", raza: "humano", clase: "guerrero", look: { piel: "oliva", pelo: "castano", tela: "granate", peinado: "corto", barba: true } },
  { nombre: "Lyra", raza: "elfo", clase: "mago", look: { piel: "clara", pelo: "rubio", tela: "azul", peinado: "largo" } },
  { nombre: "Borin", raza: "enano", clase: "clerigo", look: { piel: "morena", pelo: "cobrizo", tela: "blanco", peinado: "corto", barba: true } }
];

/* ---------- Estado local, en línea y turnos ---------- */
const red = { listo: false, db: null, room: null, sala: null, mesa: null, doc: null, peers: [], subs: [], ultimo: null, pendiente: null, escribiendo: false, vistoAcc: {}, empezando: false };
const sel = { heroes: [heroeAlAzar(0)], actual: 0, listo: false, fin: 0, online: false };

const esHost = () => !!red.doc && red.doc.host === miId;
/* ¿Puede actuar ahora este dispositivo (o el jugador remoto cuyo turno ejecuta el anfitrión)? */
function puedoActuar() {
  if (!S || !S.online) return true;
  const p = S.players[S.turno];
  return !!p && p.uid === (remoto || miId);
}
const turnoMio = () => !S || !S.online || (!!S.players[S.turno] && S.players[S.turno].uid === miId);

function guardar() {
  if (!S) return;
  S.rev = (S.rev || 0) + 1;
  if (S.online) {
    if (!esHost()) return;
    if (S.efectos && S.efectos.lista.length) S.efectos.seq++;
    escribirPartida();
    if (S.efectos) S.efectos.lista = [];
    return;
  }
  escribir(CLAVE, JSON.stringify(S));
}
function cargar() { try { const g = JSON.parse(leer(CLAVE, "null")); return g && g.v === 5 && !g.online ? g : null; } catch (e) { return null; } }

function avisar(t) {
  const a = $("#aviso");
  a.textContent = t || ""; a.hidden = !t;
  clearTimeout(avisar.t);
  if (t) avisar.t = setTimeout(() => { a.hidden = true; }, 6000);
}
function avisarError(e) {
  const code = e && e.code;
  if (code === "invalid_argument") avisar("Tu cuenta no puede crear partidas en este juego. Únete con el código de quien lo compartió.");
  else if (code === "quota_exceeded") avisar("El almacén de partidas está lleno.");
  else avisar("No se pudo guardar la jugada. Revisa la conexión.");
}

async function conectar() {
  if (!window.claude || !window.claude.use) { red.listo = true; return render(); }
  const [db, room] = await Promise.all(["db", "room"].map(n => window.claude.use(n).catch(() => null)));
  red.db = db; red.room = room; red.listo = true;
  const recordada = leer(CLAVE_MESA, null);
  if (recordada && red.db && red.room && !S) return entrarPartida(recordada, true);
  render();
}

async function crearPartida() {
  if (!red.db || !red.room) return avisar("Para jugar en línea hay que abrir el juego en claude.ai con tu cuenta.");
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let c = "";
  for (let i = 0; i < 4; i++) c += letras[Math.floor(Math.random() * letras.length)];
  try {
    await red.db.doc(`partidas/${c}`).set({ v: 5, codigo: c, host: miId, estado: "seleccion", fin: Date.now() + SEGUNDOS * 1000, creada: Date.now(), juego: null });
    entrarPartida(c);
  } catch (e) { avisarError(e); }
}

function entrarPartida(codigo, silencioso) {
  salirPartida(true);
  if (!red.db || !red.room) { vista = "inicio"; render(); return avisar("Para jugar en línea hay que abrir el juego en claude.ai con tu cuenta."); }
  red.mesa = codigo; sel.online = true; sel.listo = false;
  sel.heroes = [sel.heroes[sel.actual] || heroeAlAzar(0)]; sel.actual = 0;
  escribir(CLAVE_MESA, codigo);
  vista = "seleccion"; render();
  let confirmado = false;
  const reloj = setTimeout(() => { if (!confirmado) avisar("La partida tarda en responder. Revisa la conexión."); }, 10000);
  red.subs.push(red.db.doc(`partidas/${codigo}`).onSnapshot(snap => {
    if (!snap.metadata.fromCache && !confirmado) { confirmado = true; clearTimeout(reloj); }
    if (!snap.exists) {
      if (confirmado) { salirPartida(); if (!silencioso) avisar(`No hay ninguna partida con el código ${codigo}.`); }
      return;
    }
    recibirPartida(snap.data());
  }, e => { clearTimeout(reloj); avisarError(e); }));
  red.room.join(`p-${codigo.toLowerCase()}`).then(r => {
    if (red.mesa !== codigo) return r.leave();
    red.sala = r;
    publicarPresencia();
    red.subs.push(r.onPeers(ch => { red.peers = ch.peers.slice(); procesarAcciones(); if (S) renderGrupo(); else render(); }, () => {}));
  }).catch(() => avisar("No se pudo entrar en la sala. Comprueba que tienes la sesión iniciada en claude.ai."));
}
function salirPartida(silencioso) {
  red.subs.forEach(u => u()); red.subs = [];
  if (red.sala) red.sala.leave().catch(() => {});
  red.sala = null; red.peers = []; red.doc = null; red.ultimo = null; red.vistoAcc = {}; red.empezando = false;
  if (S && S.online) S = null;
  red.mesa = null; sel.online = false;
  escribir(CLAVE_MESA, null);
  if (!silencioso) { vista = "inicio"; render(); }
}
function publicarPresencia(extra = {}) {
  if (!red.sala) return;
  const h = sel.heroes[0];
  red.sala.presence(Object.assign({ id: miId, heroe: { nombre: h.nombre, raza: h.raza, clase: h.clase, look: h.look }, listo: sel.listo }, extra)).catch(() => {});
}
/* Jugadores de la sala con héroe elegido (yo incluido); el anfitrión primero. */
function jugadoresSala() {
  const vistos = new Map();
  vistos.set(miId, { id: miId, heroe: sel.heroes[0], listo: sel.listo, host: esHost() });
  for (const p of red.peers) {
    const pr = p.presence || {};
    if (!pr.id || !pr.heroe || vistos.has(pr.id)) continue;
    vistos.set(pr.id, { id: pr.id, heroe: pr.heroe, listo: !!pr.listo, host: !!red.doc && red.doc.host === pr.id });
  }
  return [...vistos.values()].sort((a, b) => b.host - a.host).slice(0, MAX_HEROES);
}
function hostConectado() { return esHost() || red.peers.some(p => p.presence && red.doc && p.presence.id === red.doc.host); }

function recibirPartida(m) {
  red.doc = m;
  if (m.estado === "seleccion" || !m.juego) {
    sel.fin = m.fin || Date.now();
    if (S && S.online) { S = null; red.empezando = false; sel.listo = false; }
    vista = "seleccion";
    return render();
  }
  if (m.juego === red.ultimo) return;
  let nuevo;
  try { nuevo = JSON.parse(m.juego); } catch (e) { return; }
  const primero = !S || !S.online;
  if (!primero && (nuevo.rev || 0) <= (S.rev || 0)) return;
  S = nuevo; red.ultimo = m.juego; esperandoHost = false; vista = "juego";
  const t = S.dado;
  const lista = S.efectos && S.efectos.seq > efectosVistos ? S.efectos.lista : [];
  if (S.efectos) efectosVistos = S.efectos.seq;
  const reproducir = () => { if (!primero && escJuego) lista.forEach((e, k) => setTimeout(() => escJuego && escJuego.efecto(e), k * 240)); };
  if (t && !primero && t.seq > dadoVisto && !ocupado) {
    dadoVisto = t.seq; render();
    return tirarDado(t.n, t.caras || 20, () => { mostrarTirada(t.texto, t.ok, false); reproducir(); });
  }
  if (t) { dadoVisto = t.seq; ESCENARIO.dibujarDado($("#dado"), t.n); mostrarTirada(t.texto, t.ok, false); }
  render(); reproducir();
}
function escribirPartida() {
  red.pendiente = JSON.stringify(S);
  red.ultimo = red.pendiente;
  if (!red.escribiendo) vaciarCola();
}
async function vaciarCola() {
  red.escribiendo = true;
  while (red.pendiente && red.mesa) {
    const juego = red.pendiente;
    red.pendiente = null;
    const datos = { juego, estado: JSON.parse(juego).final ? "fin" : "jugando", actualizada: Date.now() };
    for (let intento = 0; intento < 2; intento++) {
      try { await red.db.doc(`partidas/${red.mesa}`).update(datos); break; }
      catch (e) {
        if (e.code === "unavailable" && intento === 0) { await new Promise(r => setTimeout(r, 700)); continue; }
        avisarError(e); break;
      }
    }
  }
  red.escribiendo = false;
}
/* El anfitrión ejecuta las jugadas que los demás publican en su presencia. */
function procesarAcciones() {
  if (!S || !S.online || !esHost()) return;
  for (const p of red.peers) {
    const pr = p.presence || {};
    if (!pr.id || pr.id === miId) continue;
    const visto = red.vistoAcc[pr.id] || 0;
    if (!pr.acc || pr.acc.n <= visto) continue;
    if (ocupado) return setTimeout(procesarAcciones, 300);
    red.vistoAcc[pr.id] = pr.acc.n;
    /* De alguien sin historial (p. ej. tras recargar el anfitrión) solo se acepta una jugada hecha sobre el estado actual. */
    if (!visto && pr.acc.rev !== S.rev) continue;
    /* Solo vale si quien la manda puede hacerla ahora (una jugada vieja se descarta). */
    if (pr.acc.k === "reintentar" || !permitido(pr.acc.k, pr.id)) continue;
    remoto = pr.id;
    try { ejecutar(pr.acc.k, pr.acc.v); } finally { remoto = null; }
  }
}
/* ¿Puede el jugador uid hacer la jugada k? Equipar botín vale para cualquiera; aprender, para el dueño del héroe. */
function permitido(k, uid) {
  if (!S || !S.online) return true;
  if (k === "equipar") return S.players.some(p => p.uid === uid);
  if (k === "aprender") return !!S.aprender[0] && S.players[S.aprender[0].i].uid === uid;
  const p = S.players[S.turno];
  return !!p && p.uid === uid;
}
function enviarJugada(k, v) {
  if (!red.sala) return avisar("Sin conexión con la sala.");
  if (!hostConectado()) return avisar("El anfitrión no está conectado.");
  red.sala.presence({ acc: { n: Date.now(), k, v, rev: S.rev } }).catch(() => avisar("No se pudo enviar la jugada."));
  esperandoHost = true; render();
  clearTimeout(enviarJugada.t);
  enviarJugada.t = setTimeout(() => { if (esperandoHost) { esperandoHost = false; avisar("El anfitrión no responde. Comprobad que tiene el juego abierto."); render(); } }, 8000);
}
function comenzarEnLinea() {
  if (!esHost() || red.empezando) return;
  red.empezando = true;
  nuevaPartida(jugadoresSala().map(j => Object.assign({}, j.heroe, { uid: j.id })), red.mesa);
}

/* ---------- Utilidades de partida ---------- */
function log(t, cls = "") { S.log.push({ t, cls }); if (S.log.length > 120) S.log.shift(); }
function vivos() { return S.players.map((p, i) => i).filter(i => S.players[i].alma > 0); }
function siguienteVivo(desde) {
  const n = S.players.length;
  for (let k = 0; k < n; k++) { const i = (((desde + k) % n) + n) % n; if (S.players[i].alma > 0) return i; }
  return 0;
}
function masHerido() { return S.players.slice().sort((a, b) => a.alma / maxAlma(a) - b.alma / maxAlma(b))[0]; }
function curar(p, n) { const antes = p.alma; p.alma = Math.min(maxAlma(p), p.alma + Math.max(0, n)); return p.alma - antes; }
function fx(e) {
  if (escJuego) escJuego.efecto(e);
  if (S && S.online) { S.efectos = S.efectos || { seq: 0, lista: [] }; S.efectos.lista.push(e); if (S.efectos.lista.length > 24) S.efectos.lista.shift(); }
}
const idx = p => S.players.indexOf(p);

function ganarXp(n) {
  const out = [];
  if (!n) return out;
  out.push(`${fmt(n)} PX`);
  S.players.forEach(p => {
    p.xp = Math.max(0, p.xp + n + (n > 0 && p.raza === "humano" ? 1 : 0));
    while (p.nivel < NIVELES.length && p.xp >= NIVELES[p.nivel]) subirNivel(p, out);
  });
  return out;
}
function subirNivel(p, out) {
  p.nivel++; p.almaBase += 3; p.alma = Math.min(maxAlma(p), p.alma + 3);
  if (p.nivel % 2 === 0) {
    const bajo = Object.keys(STATS).reduce((a, k) => (p.base[k] < p.base[a] ? k : a), "raz");
    if (p.base[bajo] < 5) p.base[bajo]++;
  }
  const t = `${p.nombre} sube a nivel ${p.nivel}`;
  log(t, "nivel"); out.push(t);
  for (const id of APRENDE[p.clase][p.nivel] || []) {
    if (p.habs.includes(id)) continue;
    if (p.habs.length < 4) { p.habs.push(id); const a = `${p.nombre} aprende ${H(id).nombre}`; log(a, "nivel"); out.push(a); }
    else S.aprender.push({ i: idx(p), hab: id });
  }
}
/* Aprender una habilidad nueva olvidando otra (slot 0-3), o renunciar a ella (-1). */
function aprender(slot) {
  const a = S.aprender[0];
  if (!a) return;
  const p = S.players[a.i];
  if (slot >= 0 && slot < p.habs.length) {
    log(`${p.nombre} olvida ${H(p.habs[slot]).nombre} y aprende ${H(a.hab).nombre}.`, "nivel");
    p.habs[slot] = a.hab;
  } else log(`${p.nombre} decide no aprender ${H(a.hab).nombre}.`);
  S.aprender.shift();
  guardar(); render();
}
function aplicarFx(f = {}, actor) {
  const out = [];
  const vida = (p, n) => { p.alma = Math.max(1, Math.min(maxAlma(p), p.alma + n)); };
  if (f.alma && actor) { vida(actor, f.alma); out.push(`${fmt(f.alma)} PG ${actor.nombre}`); }
  if (f.almaTodos) { S.players.forEach(p => vida(p, f.almaTodos)); out.push(`${fmt(f.almaTodos)} PG al grupo`); }
  if (f.maxTodos) { S.players.forEach(p => { p.almaBase = Math.max(4, p.almaBase + f.maxTodos); p.alma = Math.min(p.alma, maxAlma(p)); }); out.push(`${fmt(f.maxTodos)} PG máx.`); }
  if (f.curaPct) { S.players.forEach(p => { p.alma = Math.max(1, p.alma); curar(p, Math.ceil(maxAlma(p) * f.curaPct)); }); out.push("Recuperáis PG"); }
  if (f.curarTodo) { S.players.forEach(p => { p.alma = maxAlma(p); }); out.push("PG al máximo"); }
  ["pocion", "bendicion", "superior", "sueno"].forEach(k => { if (f[k]) { S.zurron[k] = Math.max(0, S.zurron[k] + f[k]); out.push(`${fmt(f[k])} ${OBJETOS[k].nombre}`); } });
  if (f.oro) { S.players.forEach(p => { p.oro = Math.max(0, p.oro + f.oro); }); out.push(`${fmt(f.oro)} po c/u`); }
  if (f.anillo) { S.anillo = true; out.push("Anillo de invisibilidad"); }
  if (f.moral && actor) {
    const antes = actor.alin;
    actor.alin = D.moverMoral(actor.alin, f.moral);
    if (actor.alin !== antes) out.push(`${actor.nombre}: ${ALINEAMIENTOS[actor.alin].toLowerCase()}`);
  }
  out.push(...ganarXp(f.xp));
  return out;
}

/* ---------- Dados ---------- */
function tirarDado(final, caras, cb) {
  const cv = $("#dado");
  ocupado = true; document.body.classList.add("ocupado");
  const terminar = () => {
    if (cv) ESCENARIO.dibujarDado(cv, final);
    ocupado = false; document.body.classList.remove("ocupado");
    cb();
  };
  if (reducido || !cv || cv.offsetParent === null) return terminar();
  let k = 0;
  const iv = setInterval(() => { k++; ESCENARIO.dibujarDado(cv, d(caras), k % 2, (k % 3) - 1, k % 2 ? -1 : 0); }, 70);
  setTimeout(() => { clearInterval(iv); terminar(); }, 700);
}
function mostrarTirada(texto, ok, enPartida = true) {
  const info = $("#dado-info");
  info.textContent = texto;
  info.className = ok === true ? "ok" : ok === false ? "ko" : "";
  if (enPartida && S) {
    const seq = ((S.dado && S.dado.seq) || 0) + 1;
    S.dado = { seq, n: mostrarTirada.ultimo || 20, caras: 20, texto, ok };
    dadoVisto = seq;
  }
}
function tiradaD20(p) {
  let r = d(20), nota = "";
  if (r === 1 && p.raza === "mediano") { const r2 = d(20); nota = ` (afortunado: ${r2})`; r = r2; }
  mostrarTirada.ultimo = r;
  return { r, nota };
}
function usarOlivo() { if (S.olivoActivo && S.zurron.bendicion > 0) { S.zurron.bendicion--; S.olivoActivo = false; return 2; } return 0; }
function lineaTirada(quien, accion, r, mod, bono, total, contra, crit) {
  let t = `${quien} ${accion}: ${r} ${fmt(mod)}${bono ? " +2" : ""} = ${total} vs ${contra}`;
  if (crit) t += " · ¡crítico!";
  else if (r === 1) t += " · ¡pifia!";
  return t;
}

/* ---------- Mapa de caminos ---------- */
function generarMapa() {
  const filas = [[{ tipo: "inicio", sig: [] }]];
  for (let f = 1; f <= 5; f++) {
    const n = f === 5 ? 2 : 2 + (Math.random() < 0.5 ? 1 : 0);
    const fila = [];
    for (let i = 0; i < n; i++) fila.push({ tipo: f === 1 || Math.random() < 0.5 ? "combate" : "evento", sig: [] });
    if (f === 2 || (f === 4 && Math.random() < 0.5)) fila[Math.floor(Math.random() * n)].tipo = "tesoro";
    if (f === 3) fila[Math.floor(Math.random() * n)].tipo = "tienda";
    if (f === 5) fila[Math.floor(Math.random() * n)].tipo = "hoguera";
    filas.push(fila);
  }
  filas.push([{ tipo: "jefe", sig: [] }]);
  for (let f = 0; f < filas.length - 1; f++) {
    const a = filas[f], b = filas[f + 1];
    a.forEach((nodo, i) => {
      const centro = a.length === 1 ? (b.length - 1) / 2 : (i * (b.length - 1)) / (a.length - 1);
      nodo.sig = b.map((_, j) => j).filter(j => Math.abs(j - centro) <= 1);
    });
    b.forEach((_, j) => { if (!a.some(x => x.sig.includes(j))) a[Math.min(a.length - 1, Math.round((j * (a.length - 1)) / Math.max(1, b.length - 1)))].sig.push(j); });
  }
  filas[0][0].hecho = true;
  return { filas, fila: 0, col: 0 };
}
const NOMBRE_NODO = { combate: "Combate", evento: "Suceso", tesoro: "Cofre", tienda: "Tienda", hoguera: "Hoguera", jefe: "Jefe", inicio: "Salida" };
const VICTORIAS = ["Cae el último golpe. El camino queda libre.", "Recogéis el botín y seguís adelante.", "Victoria. Os curáis las heridas como podéis.", "El enemigo cae. Hay monedas entre los restos."];
const VICTORIAS_JEFE = [
  "El trol cae al barranco. Al otro lado del puente empieza la mazmorra.",
  "Malakar se deshace en polvo y rompéis su filacteria. Un pasadizo sube hacia un castillo.",
  "Lord Varkhul arde al primer rayo de sol. El paso hacia el Pico Cenizo está abierto.",
  "Ignárax cae sobre su tesoro con un rugido que hace temblar la montaña. El dragón ha muerto."
];

function crearEscena(tipo) {
  const A = ACTOS[S.acto];
  if (tipo === "evento") {
    const pool = EVENTOS.filter(e => (e.acto === S.acto || e.acto === null) && !S.vistosEv.includes(e.id));
    if (pool.length) {
      const ev = azarDe(pool);
      S.vistosEv.push(ev.id);
      return Object.assign({ fondo: azarDe(A.fondos) }, JSON.parse(JSON.stringify(ev)));
    }
    tipo = "combate";
  }
  if (tipo === "combate") {
    const k = azarDe(A.enemigos.filter(x => x !== S.ultimoEnemigo));
    S.ultimoEnemigo = k;
    return { tipo: "combate", enemigo: k, fondo: azarDe(A.fondos), titulo: ENEMIGOS[k].nombre,
      victoria: { t: azarDe(VICTORIAS), fx: { xp: 5 + S.acto * 2, oro: 8 + S.acto * 4, pocion: Math.random() < 0.35 ? 1 : 0 } } };
  }
  if (tipo === "tesoro") return { tipo: "tesoro", fondo: azarDe(A.fondos), titulo: "Un cofre olvidado", texto: azarDe(COFRES) };
  if (tipo === "tienda") return { tipo: "tienda", tienda: A.tienda, fondo: azarDe(A.fondos), pnj: TIENDAS[A.tienda].pnj, titulo: TIENDAS[A.tienda].nombre };
  if (tipo === "hoguera") return Object.assign({ tipo: "prueba", fondo: azarDe(A.fondos) }, JSON.parse(JSON.stringify(HOGUERA)));
  return { tipo: "combate", esJefe: true, enemigo: A.jefe, fondo: A.fondoJefe, titulo: ENEMIGOS[A.jefe].nombre, texto: A.jefeTexto,
    victoria: { t: VICTORIAS_JEFE[S.acto], fx: { xp: 10 + S.acto * 3, oro: 25, superior: 1 } } };
}

const COFRES = [
  "Medio enterrado entre raíces hay un cofre con remaches de hierro. La cerradura está oxidada.",
  "Junto a un esqueleto con armadura descansa un cofre cerrado. Nadie ha vuelto a por él.",
  "Un cofre de roble con runas talladas espera en un rincón, cubierto de polvo.",
  "Tras una losa suelta aparece un pequeño cofre. Alguien lo escondió con prisa."
];
/* ---------- Botín ---------- */
const PESO_RAREZA = { comun: 50, raro: 30, epico: 14, legendario: 6 };
function sacarBotin(bueno) {
  const pool = BOTIN[Math.max(0, S.acto)].filter(id => !bueno || rareza(id) !== "comun");
  let t = pool.reduce((a, id) => a + PESO_RAREZA[rareza(id)], 0) * Math.random();
  for (const id of pool) { t -= PESO_RAREZA[rareza(id)]; if (t <= 0) return id; }
  return pool[pool.length - 1];
}
function abrirCofre() {
  const sc = S.esc;
  if (ocupado || !sc || sc.tipo !== "tesoro" || S.fase === "resultado") return;
  if (S.acto >= 1 && Math.random() < 0.25) {
    log("¡El cofre tenía dientes! Es un mímico.", "ko");
    S.esc = { tipo: "combate", enemigo: "mimico", fondo: sc.fondo, titulo: ENEMIGOS.mimico.nombre, botinSeguro: true,
      victoria: { t: "El mímico cae. Dentro de su panza hay de todo.", fx: { xp: 5 + S.acto * 2, oro: 12 } } };
    return iniciarCombate(S.esc);
  }
  S.botin = [sacarBotin(false)];
  if (S.acto >= 2 && Math.random() < 0.5) S.botin.push(sacarBotin(false));
  const efectos = aplicarFx({ oro: 6 + S.acto * 4, pocion: Math.random() < 0.5 ? 1 : 0, xp: 2 });
  S.fase = "resultado";
  S.resultado = { ok: true, tipo: "cofre", texto: "La tapa cede con un crujido. ¡Hay algo dentro!", efectos };
  log(`${S.players[S.turno].nombre} abre el cofre: ${S.botin.map(id => OBJETOS[id].nombre).join(", ")}.`, "ok");
  guardar(); render();
}
/* Darle a un héroe un objeto del botín (se vende lo que llevaba). */
function equipar(k, i) {
  const id = S.botin[k], p = S.players[i];
  if (!id || !p || ocupado) return;
  const o = OBJETOS[id], viejo = p.equipo[o.tipo];
  p.equipo[o.tipo] = id; S.botin.splice(k, 1);
  let t = `${p.nombre} se equipa ${o.nombre}`;
  if (viejo) { const v = Math.floor(OBJETOS[viejo].precio / 2); p.oro += v; t += ` y vende ${OBJETOS[viejo].nombre} (+${v} po)`; }
  p.alma = Math.min(p.alma + (o.alma || 0), maxAlma(p));
  fx({ tipo: "magia", objetivo: "h" + i, rampa: RP.bronce });
  log(t + ".", "ok"); avisar(t + ".");
  guardar(); render();
}
function venderSobrante() {
  if (!S.botin.length) return;
  const total = S.botin.reduce((a, id) => a + Math.floor(OBJETOS[id].precio / 2), 0), cada = Math.max(1, Math.floor(total / S.players.length));
  S.players.forEach(p => { p.oro += cada; });
  log(`Vendéis lo que nadie quiere: +${cada} po cada uno.`, "ok");
  S.botin = [];
}

/* ---------- Flujo de partida ---------- */
function nuevaPartida(defs, codigo) {
  S = {
    v: 5, online: codigo ? { codigo } : null, rev: 0, dado: null, efectos: codigo ? { seq: 0, lista: [] } : null,
    players: defs.slice(0, MAX_HEROES).map(nuevoHeroe),
    zurron: { pocion: 2, superior: 0, bendicion: 0, fuego: 0, sueno: 0 }, olivoActivo: false, anillo: false,
    acto: -1, mapa: null, modo: "escena", esc: null, turno: 0, fase: "elegir", resultado: null, combate: null, tienda: null,
    derrota: false, final: null, guardadoActo: null, aprender: [], botin: [], log: [], vistos: { bestias: [], lugares: [] }, vistosEv: [], ultimoEnemigo: null
  };
  log(`Comienza la aventura: ${S.players.map(p => `${p.nombre} (${nombreRazaClase(p)})`).join(", ")}.`);
  if (S.players.length === 1) { const p = S.players[0]; p.almaBase += 4; p.alma += 4; }
  submenu = null; modal = null; vista = "juego";
  siguienteActo();
}
function siguienteActo() {
  S.modo = "escena"; S.fase = "elegir"; S.resultado = null; S.combate = null; S.tienda = null;
  if (S.acto >= ACTOS.length - 1) {
    S.esc = { tipo: "final", fondo: "guarida", titulo: "El tesoro del dragón", texto: "Oro de mil reinos. Villabruma está medio quemada y los enanos llevan cien años sin hogar. ¿Qué hacéis con él?",
      opciones: [{ txt: "Repartirlo con Villabruma y los enanos", final: "heroes" }, { txt: "Quedároslo todo", final: "codicia" }] };
    guardar(); return render();
  }
  S.acto++;
  S.mapa = generarMapa();
  if (!S.vistos.lugares.includes(S.acto)) S.vistos.lugares.push(S.acto);
  S.players.forEach(p => { if (p.alma <= 0) p.alma = 1; });
  S.esc = { tipo: "relato", fondo: ACTOS[S.acto].fondos[0], titulo: `Acto ${ROMANOS[S.acto]}: ${ACTOS[S.acto].nombre}`, texto: ACTOS[S.acto].intro, boton: "Ver el mapa" };
  S.guardadoActo = null; S.guardadoActo = JSON.stringify(S);
  log(`Acto ${ROMANOS[S.acto]} · ${ACTOS[S.acto].nombre}`, "esc");
  guardar(); render();
}
function volverAlMapa() {
  S.modo = "mapa"; S.esc = null; S.resultado = null; S.combate = null; S.tienda = null; S.fase = "elegir";
  submenu = null;
  guardar(); render();
}
function elegirNodo(j) {
  if (ocupado || S.modo !== "mapa") return;
  const m = S.mapa, actual = m.filas[m.fila][m.col];
  if (!actual.sig.includes(j)) return;
  m.fila++; m.col = j;
  const nodo = m.filas[m.fila][j];
  nodo.hecho = true;
  S.esc = crearEscena(nodo.tipo);
  S.modo = "escena"; S.fase = "elegir"; S.resultado = null;
  log(`${S.players[S.turno].nombre} elige: ${NOMBRE_NODO[nodo.tipo]} · ${S.esc.titulo}`, "esc");
  if (S.esc.tipo === "combate") return iniciarCombate(S.esc);
  if (S.esc.tipo === "tienda") abrirTienda(S.esc);
  S.botin = [];
  guardar(); render();
}
function elegirOpcion(i) {
  if (ocupado) return;
  const sc = S.esc, op = sc.opciones[i], p = S.players[S.turno];
  if (!op.stat) return resolver(op.ok, op.ok, true, null, false);
  const mod = stat(p, op.stat) + (op.stat === "raz" && p.raza === "gnomo" ? 2 : 0);
  const bono = usarOlivo();
  const { r, nota } = tiradaD20(p);
  tirarDado(r, 20, () => {
    const total = r + mod + bono, crit = r >= critMin(p);
    const ok = crit || (r !== 1 && total >= op.cd);
    const linea = lineaTirada(p.nombre, ABREV[op.stat], r, mod, bono, total, `CD ${op.cd}`, crit) + nota;
    mostrarTirada(linea, ok);
    resolver(op.ok, op.ko, ok, linea, crit);
  });
}
function respuestaTachada(sc) {
  if (!S.players.some(p => p.raza === "gnomo")) return -1;
  for (let k = 1; k < sc.respuestas.length; k++) { const i = (sc.correcta + k * 2) % sc.respuestas.length; if (i !== sc.correcta) return i; }
  return -1;
}
function responder(i) {
  if (ocupado) return;
  const sc = S.esc, ok = i === sc.correcta;
  resolver(sc.ok, sc.ko, ok, `${S.players[S.turno].nombre}: «${sc.respuestas[i]}»`, false, "enigma");
}
function resolver(okRama, koRama, ok, linea, critico, tipo = "prueba") {
  const p = S.players[S.turno], rama = ok ? okRama : koRama;
  const efectos = aplicarFx(rama.fx, p);
  if (critico) efectos.push(...ganarXp(1));
  S.fase = "resultado";
  S.resultado = { ok, tipo, linea, texto: rama.t, efectos };
  log(linea ? `${linea} → ${ok ? "éxito" : "fracaso"}` : `${p.nombre}: ${rama.t}`, ok ? "ok" : "ko");
  guardar(); render();
}
function continuar() {
  if (ocupado) return;
  const sc = S.esc;
  if (sc && sc.tipo === "relato") return volverAlMapa();
  if (!S.resultado || S.aprender.length) return;
  venderSobrante();
  S.turno = siguienteVivo(S.turno + 1);
  if (sc && sc.esJefe) return siguienteActo();
  volverAlMapa();
}
function elegirFinal(clave) { S.final = clave; log(`Final: ${FINALES[clave].titulo}`, "esc"); guardar(); render(); }
function reintentar() {
  const g = JSON.parse(S.guardadoActo);
  g.log = S.log; g.guardadoActo = S.guardadoActo; g.rev = S.rev; g.dado = S.dado; g.efectos = S.efectos;
  S = g;
  S.players.forEach(p => { p.alma = maxAlma(p); });
  log("Solara os devuelve a la vida al inicio del acto.", "esc");
  guardar(); render();
}

/* ---------- Tiendas ---------- */
function abrirTienda(sc) {
  const n = S.players.length, cola = [];
  for (let k = 0; k < n; k++) { const i = (S.turno + k) % n; if (S.players[i].alma > 0) cola.push(i); }
  S.tienda = { clave: sc.tienda, cola, pos: 0 };
  S.turno = cola[0];
}
function precio(p, id) {
  const t = TIENDAS[S.tienda.clave];
  const base = (t.precios && t.precios[id]) || OBJETOS[id].precio;
  return p.clase === "picaro" ? Math.ceil(base * 0.75) : base;
}
function comprar(id) {
  if (ocupado || !S.tienda) return;
  const p = S.players[S.turno], o = OBJETOS[id], pr = precio(p, id);
  if (p.oro < pr) return;
  if (o.tipo !== "consumible" && o.tipo !== "servicio" && p.equipo[o.tipo] === id) return;
  p.oro -= pr;
  let t = `${p.nombre} compra ${o.nombre} (${pr} po)`;
  if (o.tipo === "consumible") S.zurron[id]++;
  else if (o.tipo === "servicio") S.players.forEach((x, i) => { x.alma = maxAlma(x); fx({ tipo: "cura", objetivo: "h" + i }); });
  else {
    const viejo = p.equipo[o.tipo];
    if (viejo) { const vuelta = Math.floor(OBJETOS[viejo].precio / 2); p.oro += vuelta; t += ` y vende ${OBJETOS[viejo].nombre} (${vuelta} po)`; }
    p.equipo[o.tipo] = id;
    p.alma = Math.min(p.alma + (o.alma || 0), maxAlma(p));
    fx({ tipo: "magia", objetivo: "h" + S.turno, rampa: RP.bronce });
  }
  log(t + ".", "ok");
  avisar(t + ".");
  guardar(); render();
}
function terminarCompras() {
  if (ocupado || !S.tienda) return;
  const tienda = S.tienda;
  tienda.pos++;
  if (tienda.pos >= tienda.cola.length) { S.turno = tienda.cola[0]; S.resultado = { ok: true, tipo: "tienda", efectos: [] }; return continuar(); }
  S.turno = tienda.cola[tienda.pos];
  guardar(); render();
}
function usarFuera(id, i) {
  if (ocupado || S.combate || !puedoActuar() || !S.zurron[id]) return;
  const p = S.players[i];
  if (!p || p.alma >= maxAlma(p)) return;
  S.zurron[id]--;
  const real = curar(p, id === "pocion" ? 8 : maxAlma(p));
  log(`${p.nombre} bebe ${OBJETOS[id].nombre.toLowerCase()}: +${real} PG.`, "ok");
  fx({ tipo: "cura", objetivo: "h" + i }); fx({ tipo: "numero", objetivo: "h" + i, texto: "+" + real, color: RP.hoja[4] });
  guardar(); render();
}

/* ---------- Combate ---------- */
function iniciarCombate(sc) {
  const e = ENEMIGOS[sc.enemigo], n = S.players.length;
  const hp = Math.round(e.alma * (0.45 + 0.28 * n));
  const c = S.combate = {
    enemigo: sc.enemigo, hp, hpMax: hp, ataques: e.ataques + (n >= 4 ? 1 : 0), blando: n === 1, ronda: 1, orden: [], pos: 0,
    aturdido: false, escudo: false, maldito: false, anilloUsado: false, partido: false, quemado: false,
    resiste: e.resiste, debil: e.debil, robado: {}, enemigoActua: false, veneno: 0, atkMod: 0
  };
  if (!S.vistos.bestias.includes(sc.enemigo)) S.vistos.bestias.push(sc.enemigo);
  S.players.forEach(p => { p.usosH = {}; p.habs.forEach(h => { p.usosH[h] = H(h).usos; }); p.fl = {}; p.est = { aturdido: 0, cegado: 0 }; });
  const orden = S.players.map((p, i) => ({ t: "h", i, ini: d(20) + iniMod(p) }));
  orden.push({ t: "e", ini: d(20) + e.ini });
  orden.sort((a, b) => b.ini - a.ini || (a.t === "h" ? -1 : 1));
  c.orden = orden;
  log(`Iniciativa: ${orden.map(x => `${x.t === "e" ? e.nombre : S.players[x.i].nombre} ${x.ini}`).join(" · ")}`);
  S.players.forEach((p, i) => {
    if (p.raza !== "draconido" || p.alma <= 0) return;
    fx({ tipo: "ataque", actor: "h" + i });
    log(`${p.nombre} exhala su aliento → ${danarRival(tirar(1, 6), "arcana", false, 1, RP.fuego)}`, "ok");
  });
  if (c.hp <= 0) return victoria();
  prepararTurno();
}
function avanzar() { const c = S.combate; c.pos++; if (c.pos >= c.orden.length) { c.pos = 0; c.ronda++; } }
function prepararTurno() {
  const c = S.combate;
  for (let guarda = 0; guarda < 50; guarda++) {
    if (!vivos().length) return derrota();
    const a = c.orden[c.pos];
    if (a.t === "e") return turnoEnemigo();
    const p = S.players[a.i];
    if (p.alma <= 0) { avanzar(); continue; }
    if (p.est.aturdido > 0) { p.est.aturdido--; log(`${p.nombre} no puede moverse y pierde el turno.`, "ko"); avanzar(); continue; }
    S.turno = a.i; submenu = null;
    guardar(); render();
    return;
  }
}
function danarRival(base, clase, crit, extra = 1, rampa) {
  const c = S.combate;
  let dmg = Math.max(1, base) + (c.maldito ? 2 : 0);
  let mult = 1, nota = "";
  if (c.resiste === clase) { mult = 0.5; nota = " (lo resiste)"; }
  if (c.debil === clase) { mult = 2; nota = " (¡punto débil!)"; }
  if (extra > 1 && extra > mult) { mult = extra; nota = " (¡doble contra no muertos!)"; }
  dmg = mult < 1 ? Math.max(1, Math.floor(dmg * mult)) : Math.round(dmg * mult);
  c.hp = Math.max(0, c.hp - dmg);
  if (clase === "arcana") c.quemado = true;
  fx({ tipo: "golpe", objetivo: "e" });
  if (clase !== "fisica") fx({ tipo: "magia", objetivo: "e", rampa: rampa || (clase === "sagrada" ? RP.bronce : RP.magia) });
  fx({ tipo: "numero", objetivo: "e", texto: "-" + dmg, color: crit ? RP.bronce[4] : mult > 1 ? RP.fuego[3] : "#fff7ea", grande: crit || mult > 1 });
  return `${dmg} de daño${nota}`;
}
function danarHeroe(i, dmg, directo) {
  const p = S.players[i], c = S.combate;
  if (p.raza === "enano") dmg = Math.max(1, dmg - 1);
  p.alma = Math.max(0, p.alma - dmg);
  fx({ tipo: "golpe", objetivo: "h" + i });
  fx({ tipo: "numero", objetivo: "h" + i, texto: "-" + dmg, color: RP.sangre[4] });
  let t = `${dmg} de daño`;
  if (p.alma === 0 && p.raza === "semiorco" && !p.fl.aguante) { p.fl.aguante = true; p.alma = 1; t += `. ${p.nombre} aguanta con 1 PG`; }
  else if (p.alma === 0) t += `. ¡${p.nombre} cae!`;
  if (directo && p.raza === "tiefling" && c) { c.hp = Math.max(0, c.hp - 2); fx({ tipo: "numero", objetivo: "e", texto: "-2", color: RP.fuego[3], fila: 1 }); t += ". Reprensión infernal: 2 de fuego"; }
  return t;
}
function accion(tipo, arg) {
  if (ocupado || !S.combate || S.combate.enemigoActua || !puedoActuar()) return;
  const c = S.combate, e = ENEMIGOS[c.enemigo], p = S.players[S.turno], yo = "h" + S.turno, cl = CLASES[p.clase];
  const arma = obj(p.equipo.arma) || {};
  const fin = () => { submenu = null; if (c.hp <= 0) return victoria(); avanzar(); prepararTurno(); };
  if (tipo === "hab") {
    const id = p.habs[+arg], h = id && H(id);
    if (!h || (h.usos && !(p.usosH[id] > 0))) return;
    if (h.usos) p.usosH[id]--;
    const m = statHab(p, h);
    const efectosExtra = (dmg, partes) => {
      if (h.veneno) { c.veneno = Math.max(c.veneno, h.veneno); partes.push("veneno"); }
      if (h.debilita) { c.atkMod = Math.max(-4, c.atkMod - 2); partes.push("−2 a su ataque"); }
      if (h.maldice) { c.maldito = true; partes.push("maldito"); }
      if (h.drena && dmg > 0) { const cu = curar(p, Math.max(1, Math.floor(dmg / 2))); fx({ tipo: "cura", objetivo: yo }); partes.push(`te curas ${cu}`); }
    };
    if (h.efecto === "dano") {
      const extraArma = h.tipo === "fisica" ? arma.fis || 0 : (arma.arc || 0) + (p.clase === "mago" && h.tipo === "arcana" ? 2 : 0);
      const golpes = crit => {
        const antes = c.hp, partes = [];
        for (let k = 0; k < (h.golpes || 1) && c.hp > 0; k++)
          partes.push(danarRival(tirar(h.dado[0] * (crit ? 2 : 1), h.dado[1], m + (h.bono || 0)) + extraArma, h.tipo, crit, h.noMuerto && e.nomuerto ? h.noMuerto : 1, h.tipo === "arcana" ? RP.fuego : undefined));
        efectosExtra(antes - c.hp, partes);
        return partes.join(" · ");
      };
      fx({ tipo: "ataque", actor: yo });
      if (!h.tirada) {
        const t = `${p.nombre} usa ${h.nombre} → ${golpes(false)}`;
        log(t, "ok"); mostrarTirada(t, true);
        return fin();
      }
      const mod = m + (arma.golpe || 0) + (h.tipo === "fisica" && p.clase === "explorador" ? 2 : 0);
      const bono = usarOlivo();
      const { r, nota } = tiradaD20(p);
      tirarDado(r, 20, () => {
        const total = r + mod + bono, crit = r >= Math.min(critMin(p), h.critico || 20);
        const ok = crit || (r !== 1 && total >= e.ca);
        let linea = lineaTirada(p.nombre, h.nombre, r, mod, bono, total, `CA ${e.ca}`, crit) + nota;
        if (ok) { linea += ` → ${golpes(crit)}`; log(linea, "ok"); mostrarTirada(linea, true); }
        else { linea += " → falla"; fx({ tipo: "numero", objetivo: "e", texto: "FALLO", color: RP.hueso[3] }); log(linea, "ko"); mostrarTirada(linea, false); }
        fin();
      });
      return;
    }
    if (h.efecto === "cura") {
      const base = Math.max(1, tirar(h.dado[0], h.dado[1], m) + (arma.cura || 0));
      const n = p.clase === "clerigo" ? Math.ceil(base * 1.5) : base;
      const objetivos = h.a === "grupo" ? S.players : h.a === "yo" ? [p] : [masHerido()];
      const partes = objetivos.map(o => {
        const real = curar(o, n), oi = idx(o);
        fx({ tipo: "cura", objetivo: "h" + oi }); fx({ tipo: "numero", objetivo: "h" + oi, texto: "+" + real, color: RP.hoja[4] });
        return `${o.nombre} +${real}`;
      });
      const t = `${p.nombre} usa ${h.nombre} → ${partes.join(", ")} PG`;
      log(t, "ok"); mostrarTirada(t, true);
      return fin();
    }
    fx({ tipo: "magia", objetivo: h.efecto === "escudo" ? yo : "e" });
    if (h.efecto === "escudo") c.escudo = true;
    if (h.efecto === "aturde") c.aturdido = true;
    if (h.efecto === "maldice") c.maldito = true;
    if (h.efecto === "debilita") c.atkMod = Math.max(-4, c.atkMod - 2);
    if (h.efecto === "veneno") c.veneno = Math.max(c.veneno, h.turnos);
    const t = `${p.nombre} usa ${h.nombre}: ${resumenHab(id, p).toLowerCase()}.`;
    log(t, "ok"); mostrarTirada(t, true);
    return fin();
  }
  if (tipo === "objeto") {
    if (!S.zurron[arg] || arg === "bendicion") return;
    S.zurron[arg]--;
    if (arg === "pocion" || arg === "superior") {
      const o = masHerido(), oi = idx(o);
      const real = curar(o, arg === "pocion" ? 8 : maxAlma(o));
      fx({ tipo: "cura", objetivo: "h" + oi }); fx({ tipo: "numero", objetivo: "h" + oi, texto: "+" + real, color: RP.hoja[4] });
      log(`${p.nombre} da ${OBJETOS[arg].nombre.toLowerCase()} a ${o.nombre}: +${real} PG.`, "ok");
    }
    if (arg === "fuego") { fx({ tipo: "ataque", actor: yo }); log(`${p.nombre} lanza fuego de alquimista → ${danarRival(tirar(3, 6), "arcana", false, 1, RP.fuego)}`, "ok"); }
    if (arg === "sueno") { c.aturdido = true; log(`${p.nombre} sopla polvo de sueño: ${e.nombre} se duerme un turno.`, "ok"); }
    return fin();
  }
  if (tipo === "anillo") {
    if (!S.anillo || c.anilloUsado) return;
    c.anilloUsado = true; c.aturdido = true;
    log(`${p.nombre} se vuelve invisible. ${e.nombre} no sabe a quién atacar.`, "ok");
    return fin();
  }
}
function heroeAlAzarVivo() { const l = vivos(); return l.length ? l[Math.floor(Math.random() * l.length)] : -1; }
function turnoEnemigo() {
  const c = S.combate, e = ENEMIGOS[c.enemigo];
  c.enemigoActua = true;
  ocupado = true; document.body.classList.add("ocupado");
  render();
  setTimeout(() => {
    const atk = e.atk + c.atkMod;
    if (c.veneno > 0) {
      c.veneno--;
      const v = d(6);
      c.hp = Math.max(0, c.hp - v);
      fx({ tipo: "numero", objetivo: "e", texto: "-" + v, color: RP.hoja[4] });
      log(`El veneno quema a ${e.nombre}: ${v} de daño.`, "ok");
    }
    if (c.hp <= 0) { /* el veneno lo ha rematado */ }
    else if (c.aturdido) { log(`${e.nombre} pierde su turno.`, "ok"); c.aturdido = false; c.quemado = false; }
    else {
      const cada = n => c.ronda % n === 0;
      if (e.regenera) {
        if (c.quemado) log(`${e.nombre} no puede regenerarse: el fuego le ha cauterizado.`, "ok");
        else if (c.hp < c.hpMax) { const cu = Math.min(e.regenera, c.hpMax - c.hp); c.hp += cu; log(`${e.nombre} se regenera: +${cu} PG.`, "ko"); fx({ tipo: "cura", objetivo: "e" }); }
        c.quemado = false;
      }
      if (e.cura && cada(e.cura.cada) && c.hp < c.hpMax) { const cu = Math.min(e.cura.n, c.hpMax - c.hp); c.hp += cu; log(`${e.cura.txt} (+${cu} PG).`, "ko"); fx({ tipo: "cura", objetivo: "e" }); }
      if (e.furia && !c.partido && c.hp <= c.hpMax / 2) { c.partido = true; log(`${e.nombre} entra en furia: ataca una vez más por ronda.`, "ko"); }
      if (c.escudo) { log(`${e.nombre} ataca, pero el muro de escudos lo para todo.`, "ok"); c.escudo = false; }
      else {
        const n = c.ataques + (c.partido ? 1 : 0);
        fx({ tipo: "ataque", actor: "e" });
        for (let k = 0; k < n; k++) {
          const ti = heroeAlAzarVivo();
          if (ti < 0) break;
          const t = S.players[ti];
          if (t.clase === "barbaro" && !t.fl.reflejos) { t.fl.reflejos = true; log(`${t.nombre} esquiva sin mirar (sentido del peligro).`, "ok"); fx({ tipo: "numero", objetivo: "h" + ti, texto: "FALLO", color: RP.hueso[3] }); continue; }
          const r = d(20), def = ca(t);
          const ok = r === 20 || (r !== 1 && r + atk >= def);
          mostrarTirada.ultimo = r;
          if ($("#dado")) ESCENARIO.dibujarDado($("#dado"), r);
          if (ok) {
            const dmg = Math.max(1, tirar(e.dano[0] * (r === 20 ? 2 : 1), e.dano[1], e.dano[2]) - (c.blando ? 2 : 0));
            let txt = `${e.nombre} → ${t.nombre}: ${r} ${fmt(atk)} vs CA ${def} → ${danarHeroe(ti, dmg, true)}`;
            if (e.drena) { const cu = Math.max(1, Math.floor(dmg / 2)); c.hp = Math.min(c.hpMax, c.hp + cu); txt += `. Bebe y se cura ${cu}`; }
            if (e.roba && t.oro > 0) { const rob = Math.min(e.roba, t.oro); t.oro -= rob; c.robado[ti] = (c.robado[ti] || 0) + rob; txt += `. Roba ${rob} po`; }
            log(txt, "ko"); mostrarTirada(txt, false);
          } else {
            const txt = `${e.nombre} → ${t.nombre}: ${r} ${fmt(atk)} vs CA ${def} → falla`;
            fx({ tipo: "numero", objetivo: "h" + ti, texto: "FALLO", color: RP.hueso[3] });
            log(txt, "ok"); mostrarTirada(txt, true);
          }
        }
        if (e.area && cada(e.area.cada)) {
          const partes = vivos().map(i => { fx({ tipo: "magia", objetivo: "h" + i, rampa: RP.fuego }); return `${S.players[i].nombre} ${danarHeroe(i, d(e.area.dado), false).split(".")[0]}`; });
          log(`${e.area.txt}: ${partes.join(", ")}.`, "ko");
        }
        if (e.estado && cada(e.estado.cada)) {
          const ti = heroeAlAzarVivo();
          if (ti >= 0) {
            const t = S.players[ti];
            if (t.raza === "elfo") log(`${e.nombre} no puede con ${t.nombre}: linaje feérico.`, "ok");
            else { t.est.aturdido = 1; log(`${e.estado.txt.replace("{x}", t.nombre)}.`, "ko"); fx({ tipo: "golpe", objetivo: "h" + ti }); }
          }
        }
      }
    }
    c.enemigoActua = false;
    ocupado = false; document.body.classList.remove("ocupado");
    if (c.hp <= 0) return victoria();
    if (!vivos().length) return derrota();
    avanzar(); prepararTurno();
  }, reducido ? 200 : 950);
}
function victoria() {
  const sc = S.esc, c = S.combate, e = ENEMIGOS[c.enemigo];
  fx({ tipo: "muerte", objetivo: "e" });
  const extra = [];
  let robado = 0;
  S.players.forEach((p, i) => { if (c.robado[i]) { p.oro += c.robado[i]; robado += c.robado[i]; } });
  if (robado) extra.push(`+${robado} po recuperadas`);
  S.players.forEach(p => { if (p.alma <= 0) p.alma = 1; p.est = { aturdido: 0, cegado: 0 }; });
  if (S.players.some(p => p.clase === "bardo")) { S.players.forEach(p => curar(p, 3)); extra.push("Inspiración +3 PG"); }
  S.players.forEach(p => { if (p.clase === "brujo") { curar(p, 4); extra.push(`Pacto: +4 PG ${p.nombre}`); } });
  S.combate = null;
  S.botin = [];
  if (sc.esJefe || sc.botinSeguro || Math.random() < 0.5) S.botin.push(sacarBotin(sc.esJefe));
  if (sc.esJefe && S.players.length >= 3) S.botin.push(sacarBotin(false));
  const efectos = aplicarFx(sc.victoria.fx).concat(extra);
  S.fase = "resultado";
  S.resultado = { ok: true, tipo: "victoria", enemigo: c.enemigo, linea: null, texto: sc.victoria.t, efectos };
  log(`¡Victoria contra ${e.nombre}!`, "ok");
  guardar(); render();
}
function derrota() { S.derrota = true; log("Todo el grupo ha caído.", "ko"); guardar(); render(); }

/* ---------- Iconos pixelados del mapa ---------- */
const cacheIconos = {};
function iconoNodo(tipo) {
  if (cacheIconos[tipo]) return cacheIconos[tipo];
  const g = new PX.Rejilla(14, 14), C = PX.Capa;
  if (tipo === "combate") {
    new C(14, 14).linea(2, 2, 10, 10, 2).linea(11, 2, 3, 10, 2).pintar(g, RP.hierro, { relieve: 1, min: 2 });
    new C(14, 14).rect(1, 9, 4, 2).rect(9, 9, 4, 2).pintar(g, RP.bronce, { plano: 3 });
    new C(14, 14).rect(1, 11, 2, 2).rect(11, 11, 2, 2).pintar(g, RP.madera, { plano: 2 });
  } else if (tipo === "evento") {
    new C(14, 14).ell(6.5, 6.5, 5.5, 5.5).pintar(g, RP.tela.azul, { relieve: 3 });
    const pinta = { set fillStyle(v) {}, fillRect: (x, y, w, h) => { for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) g.set(x + a, y + b, RP.hueso[4]); } };
    PX.texto(pinta, "?", 4, 2, RP.hueso[4], null, 2);
  } else if (tipo === "tesoro") {
    new C(14, 14).rect(2, 3, 10, 3).pintar(g, RP.madera, { relieve: 1 });
    new C(14, 14).rect(2, 6, 10, 6).pintar(g, RP.madera, { relieve: 2 });
    new C(14, 14).rect(2, 6, 10, 1).rect(6, 3, 2, 9).pintar(g, RP.bronce, { plano: 3 });
    g.set(6, 7, RP.bronce[4]).set(7, 7, RP.bronce[4]).set(6, 8, PX.CONTORNO).set(7, 8, PX.CONTORNO);
  } else if (tipo === "tienda") {
    new C(14, 14).ell(7, 8.5, 4.8, 4.2).pintar(g, RP.madera, { relieve: 2 });
    new C(14, 14).rect(5, 3, 5, 2).pintar(g, RP.madera, { plano: 1 });
    g.set(7, 8, RP.bronce[4]).set(6, 9, RP.bronce[3]).set(8, 9, RP.bronce[3]).set(7, 10, RP.bronce[3]);
  } else if (tipo === "hoguera") {
    new C(14, 14).linea(2, 12, 11, 10, 2).linea(2, 10, 11, 12, 2).pintar(g, RP.madera, { relieve: 1 });
    new C(14, 14).ell(7, 6.5, 3.5, 4).on(7, 2).on(6, 3).pintar(g, RP.fuego, { relieve: 2, min: 2 });
    g.set(7, 8, RP.fuego[4]).set(7, 7, RP.fuego[4]);
  } else if (tipo === "jefe") {
    new C(14, 14).ell(7, 6, 5.2, 4.8).rect(4, 9, 7, 3).pintar(g, RP.hueso, { relieve: 2 });
    [[5, 6], [9, 6]].forEach(([x, y]) => { g.set(x, y, PX.CONTORNO).set(x, y + 1, PX.CONTORNO).set(x - 1, y, RP.sangre[3]); });
    g.set(7, 9, PX.CONTORNO).set(5, 11, PX.CONTORNO).set(7, 11, PX.CONTORNO).set(9, 11, PX.CONTORNO);
  } else {
    new C(14, 14).rect(3, 2, 1, 11).pintar(g, RP.madera, { plano: 2 });
    new C(14, 14).poly([[4, 2], [12, 4], [4, 7]]).pintar(g, RP.tela.granate, { relieve: 1, min: 2 });
  }
  g.contorno();
  return (cacheIconos[tipo] = g.aCanvas(1));
}
function pintarIconos(raiz) {
  raiz.querySelectorAll("canvas[data-icono]").forEach(cv => {
    const img = iconoNodo(cv.dataset.icono), dpr = window.devicePixelRatio || 1;
    const s = Math.max(1, Math.round(((+cv.dataset.tam || 28) * dpr) / 14));
    cv.width = cv.height = 14 * s; cv.style.width = cv.style.height = (14 * s) / dpr + "px";
    const c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
    c.drawImage(img, 0, 0, 14 * s, 14 * s);
  });
}
function pintarRetratos(raiz = document) {
  raiz.querySelectorAll("canvas[data-look]").forEach(cv => { try { ESCENARIO.retrato(cv, JSON.parse(cv.dataset.look)); } catch (e) {} });
  raiz.querySelectorAll("canvas[data-rival]").forEach(cv => { const [t, k] = cv.dataset.rival.split(":"); ESCENARIO.retratoRival(cv, t, k); });
  pintarIconos(raiz);
}

/* ---------- Pantallas ---------- */
function render() {
  if (S) vista = "juego";
  for (const id of ["inicio", "unirse", "seleccion", "juego"]) $("#p-" + id).hidden = vista !== id;
  if (vista === "inicio") renderInicio();
  if (vista === "unirse") renderUnirse();
  if (vista === "seleccion") renderSeleccion();
  if (vista === "juego") renderJuego();
  if (modal) renderModal();
}
function renderInicio() {
  if (!escInicio) escInicio = ESCENARIO.crear($("#lienzo-inicio"), { observar: $("#p-inicio"), limites: () => [$("#caja-inicio").clientWidth - 12, Math.max(110, window.innerHeight * 0.3)] });
  escInicio.ajustar();
  escInicio.mostrar({ fondo: "taberna", heroes: EJEMPLO.map(h => ({ look: lookDe(nuevoHeroe(h)) })), rival: { tipo: "pnj", clave: "tabernero" }, activo: -1 });
  const guardada = cargar();
  const online = red.listo ? !!(red.db && red.room) : true;
  $("#inicio-botones").innerHTML = `
    ${guardada ? `<button type="button" class="boton grande" data-ui="cargar">Continuar partida</button>` : ""}
    <button type="button" class="boton grande${guardada ? " sec" : ""}" data-ui="crear" ${online ? "" : "disabled"}>Crear partida en línea</button>
    <button type="button" class="boton grande sec" data-ui="ir-unirse" ${online ? "" : "disabled"}>Unirse con un código</button>
    <button type="button" class="boton grande sec" data-ui="local">Jugar en este móvil</button>
    ${online ? "" : `<p class="nota">Para jugar en línea, abre el juego en claude.ai con tu cuenta.</p>`}`;
}
function renderUnirse() {
  const i = $("#codigo-mesa");
  if (document.activeElement !== i) setTimeout(() => i.focus(), 50);
}

/* Selección de personajes: 90 segundos para elegir clase, raza y aspecto. */
let relojSel = null;
function empezarSeleccionLocal() {
  sel.online = false; sel.listo = false;
  if (!sel.heroes.length) sel.heroes = [heroeAlAzar(0)];
  sel.actual = 0;
  sel.fin = Date.now() + SEGUNDOS * 1000;
  vista = "seleccion"; render();
}
function tickSeleccion() {
  if (vista !== "seleccion") return;
  const quedan = Math.max(0, Math.ceil((sel.fin - Date.now()) / 1000));
  const r = $("#sel-reloj");
  r.textContent = `${Math.floor(quedan / 60)}:${String(quedan % 60).padStart(2, "0")}`;
  r.classList.toggle("urgente", quedan <= 10);
  $("#sel-barra i").style.width = `${(100 * quedan) / SEGUNDOS}%`;
  if (quedan > 0 || !sel.fin) return;
  if (!sel.online) return comenzarLocal();
  if (esHost()) comenzarEnLinea();
}
function comenzarLocal() { sel.fin = 0; nuevaPartida(sel.heroes.map(h => JSON.parse(JSON.stringify(h)))); }
function heroeEditado() { return sel.heroes[sel.online ? 0 : sel.actual]; }
function renderSeleccion() {
  if (!relojSel) relojSel = setInterval(tickSeleccion, 250);
  const h = heroeEditado();
  $("#sel-codigo").innerHTML = sel.online ? `Código <b>${esc(red.mesa || "")}</b>` : "En este móvil";
  const jugadores = sel.online ? jugadoresSala() : sel.heroes.map((x, i) => ({ id: "l" + i, heroe: x, listo: false }));
  if (!escSel) escSel = ESCENARIO.crear($("#lienzo-sel"), { observar: $("#p-seleccion"), limites: () => [$("#caja-sel").clientWidth - 12, Math.max(90, window.innerHeight * 0.23)] });
  escSel.ajustar();
  escSel.mostrar({ fondo: "taberna", heroes: jugadores.map(j => ({ look: Object.assign({ raza: j.heroe.raza, clase: j.heroe.clase }, j.heroe.look) })), rival: { tipo: "pnj", clave: "tabernero" }, activo: sel.online ? 0 : sel.actual });
  const nombre = $("#sel-nombre");
  if (document.activeElement !== nombre) nombre.value = h.nombre;
  const cl = CLASES[h.clase], rz = RAZAS[h.raza], p = nuevoHeroe(h);
  $("#sel-clase").innerHTML = `<p class="sel-tit"><strong>${cl.nombre}</strong><span class="etiqueta">${cl.rol}</span></p>
    <ul class="habs-ini">${p.habs.map(id => `<li><b>${H(id).nombre}</b><span>${resumenHab(id, p)}</span></li>`).join("")}</ul>
    <p><b>${cl.pasiva}:</b> ${cl.pasivaDesc}</p>`;
  $("#sel-raza").innerHTML = `<p class="sel-tit"><strong>${rz.nombre}</strong><span class="etiqueta">${Object.keys(rz.mods).map(s => `${ABREV[s]} ${fmt(rz.mods[s])}`).join(" · ")}${rz.alma ? ` · PG +${rz.alma}` : ""}</span></p>
    <p><b>${rz.pasiva}:</b> ${rz.pasivaDesc}</p>`;
  $("#sel-stats").innerHTML = Object.keys(STATS).map(k => `<span><b>${fmt(p.base[k])}</b>${ABREV[k]}</span>`).join("") + `<span><b>${p.almaBase}</b>PG</span><span><b>${ca(p)}</b>CA</span>`;
  $("#sel-jugadores").innerHTML = jugadores.map((j, i) => `
    <button type="button" class="chip-jugador${(!sel.online && i === sel.actual) || (sel.online && j.id === miId) ? " sel" : ""}${j.listo || j.host ? " listo" : ""}" ${sel.online ? "disabled" : `data-ui="sel-heroe" data-i="${i}"`}>
      <canvas class="mini" data-tam="26" data-look='${esc(JSON.stringify(Object.assign({ raza: j.heroe.raza, clase: j.heroe.clase }, j.heroe.look)))}'></canvas>
      <span>${esc(j.heroe.nombre || "?")}${j.host ? " ★" : j.listo ? " ✓" : ""}</span></button>`).join("")
    + (!sel.online && sel.heroes.length < MAX_HEROES ? `<button type="button" class="chip-jugador mas" data-ui="sel-anadir">+ Héroe</button>` : "")
    + (!sel.online && sel.heroes.length > 1 ? `<button type="button" class="chip-jugador mas" data-ui="sel-quitar">Quitar</button>` : "");
  const listo = $("#sel-listo");
  if (!sel.online) listo.textContent = "¡A la aventura!";
  else if (esHost()) listo.textContent = `Empezar ya · ${jugadores.length} jugador${jugadores.length === 1 ? "" : "es"}`;
  else listo.textContent = sel.listo ? "Listo ✓ · esperando al anfitrión" : "¡Estoy listo!";
  pintarRetratos($("#p-seleccion"));
  tickSeleccion();
}
function cambiarSeleccion(campo, paso) {
  const h = heroeEditado();
  if (campo === "clase" || campo === "raza") {
    const lista = Object.keys(campo === "clase" ? CLASES : RAZAS);
    const viejo = h[campo];
    h[campo] = lista[(lista.indexOf(viejo) + paso + lista.length) % lista.length];
    if (campo === "clase" && h.look.tela === HEROES.TELA_CLASE[viejo]) h.look.tela = HEROES.TELA_CLASE[h.clase];
    if (campo === "raza") {
      const vis = HEROES.RAZAS[h.raza];
      if (!vis.pieles.includes(h.look.piel)) h.look.piel = vis.pieles[0];
      if (vis.pelos.length && !vis.pelos.includes(h.look.pelo)) h.look.pelo = vis.pelos[0];
    }
  } else {
    const vis = HEROES.RAZAS[h.raza];
    const listas = { piel: vis.pieles, pelo: vis.pelos.length ? vis.pelos : [null], tela: HEROES.TELAS, peinado: HEROES.PEINADOS };
    const l = listas[campo];
    h.look[campo] = l[(l.indexOf(h.look[campo]) + 1) % l.length];
  }
  if (sel.online) publicarPresencia();
  renderSeleccion();
}

/* ---------- Pantalla de juego ---------- */
function limitesJuego() {
  const ancho = $("#p-juego").clientWidth;
  return [ancho - 12, Math.max(96, Math.min(window.innerHeight * 0.27, (ancho * 9) / 16))];
}
function renderJuego() {
  if (!escJuego) escJuego = ESCENARIO.crear($("#lienzo"), { observar: $("#p-juego"), limites: limitesJuego });
  const enMapa = S.modo === "mapa" && !S.derrota && !S.final;
  /* Tienda, aprender habilidad y reparto de botín necesitan sitio: se oculta el escenario. */
  const vivo = !enMapa && !S.final && !S.derrota;
  const enTienda = vivo && !(S.fase === "resultado" && S.resultado) && S.esc && S.esc.tipo === "tienda";
  const enPanel = enTienda || (vivo && S.aprender.length > 0) || (vivo && S.fase === "resultado" && S.botin.length > 0);
  $("#p-juego").classList.toggle("modo-mapa", enMapa);
  $("#p-juego").classList.toggle("modo-panel", enPanel);
  escJuego.ajustar();
  if (!$("#dado").dataset.listo) { $("#dado").dataset.listo = "1"; ESCENARIO.dibujarDado($("#dado"), 20); }
  const acto = Math.max(0, S.acto);
  $("#barra-titulo").innerHTML = `<span class="progreso">${ACTOS.map((_, i) => `<i class="${i < acto ? "hecho" : i === acto ? "ahora" : ""}"></i>`).join("")}</span><span>Acto ${ROMANOS[acto]} · ${ACTOS[acto].nombre}</span>`;
  sincronizarEscenario();
  renderGrupo();
  if (enMapa) renderMapa(); else { $("#mapa").innerHTML = ""; renderEscena(); }
  const u = S.log[S.log.length - 1];
  if (u && !$("#dado-info").textContent.trim()) $("#dado-info").textContent = u.t;
}
function tipoRival(clave) { return typeof PNJ !== "undefined" && PNJ[clave] ? "pnj" : "enemigo"; }
function sincronizarEscenario() {
  const sc = S.esc;
  let rival = null;
  if (S.combate) {
    const k = S.combate.enemigo;
    rival = { tipo: "enemigo", clave: k, hp: S.combate.hp, max: S.combate.hpMax, maldito: S.combate.maldito, aturdido: S.combate.aturdido, flota: k === "elemental" };
  } else if (S.resultado && S.resultado.tipo === "victoria") rival = { tipo: "enemigo", clave: S.resultado.enemigo, derrotado: true };
  else if (sc && sc.pnj) rival = { tipo: tipoRival(sc.pnj), clave: sc.pnj, flota: sc.pnj === "fantasma" };
  const fondo = (sc && sc.fondo) || ACTOS[Math.max(0, S.acto)].fondos[0];
  escJuego.mostrar({
    fondo, rival, activo: S.final || S.derrota ? -1 : S.turno, esperaRival: !!(S.combate && S.combate.enemigoActua),
    heroes: S.players.map(p => ({ look: lookDe(p), caido: p.alma <= 0, aturdido: !!(p.est && p.est.aturdido) }))
  });
}
function renderGrupo() {
  if (!S) return;
  $("#grupo").innerHTML = S.players.map((p, i) => {
    const activo = i === S.turno && !S.final && !S.derrota && !(S.combate && S.combate.enemigoActua);
    const max = maxAlma(p), pct = Math.round((100 * p.alma) / max);
    const conectado = !S.online || p.uid === miId || red.peers.some(x => x.presence && x.presence.id === p.uid);
    return `<button type="button" class="heroe${activo ? " activo" : ""}${p.alma <= 0 ? " caido" : ""}${pct <= 30 && p.alma > 0 ? " grave" : ""}${conectado ? "" : " fuera"}" data-ui="ficha" data-i="${i}" aria-label="Ficha de ${esc(p.nombre)}">
      <canvas class="retrato" data-tam="28" data-look='${esc(JSON.stringify(lookDe(p)))}'></canvas>
      <span class="heroe-datos"><strong>${esc(p.nombre)}${S.online && p.uid === miId ? " (tú)" : ""}</strong>
      <span class="barra-alma"><i style="width:${pct}%"></i></span><span class="cifras"><span>${p.alma}/${max}</span><span class="nv">Nv ${p.nivel}</span></span>
      <span class="barra-xp"><i style="width:${pctXp(p)}%"></i></span></span></button>`;
  }).join("");
  pintarRetratos($("#grupo"));
}
function pctXp(p) {
  const a = NIVELES[p.nivel - 1] || 0, b = NIVELES[p.nivel];
  return b === undefined ? 100 : Math.max(0, Math.min(100, Math.round((100 * (p.xp - a)) / (b - a))));
}
function tarjetaBotin(id, k) {
  const o = OBJETOS[id], r = rareza(id), puede = permitido("equipar", miId) && !esperandoHost;
  return `<div class="objeto r-${r}"><p class="obj-cab"><strong>${o.nombre}</strong><span class="rareza">${RAREZAS[r]}</span></p>
    <small>${RANURAS[o.tipo]} · ${o.desc}</small>
    <div class="para"><span class="etiqueta">Dar a</span>${S.players.map((p, i) => {
      const v = p.equipo[o.tipo], mejor = !v || OBJETOS[v].precio < o.precio;
      return `<button type="button" class="chip-heroe${mejor ? " mejor" : ""}" data-juego="equipar" data-v="${k}:${i}" ${puede ? "" : "disabled"} title="${v ? `Lleva ${esc(OBJETOS[v].nombre)}` : "Sin objeto"}">${esc(p.nombre)}${mejor ? " ▲" : ""}</button>`;
    }).join("")}</div></div>`;
}
const parrafo = t => `<p class="texto">${t}</p>`;
function boton(attrs, titulo, chip, sub, off) {
  return `<button type="button" class="opcion" ${attrs}${off ? " disabled" : ""}><span class="op-txt">${titulo}${sub ? `<small>${sub}</small>` : ""}</span>${chip ? `<span class="chip">${chip}</span>` : ""}</button>`;
}
function quienLinea(p, verbo) {
  if (esperandoHost) return `<p class="quien espera">Enviando tu jugada…</p>`;
  if (turnoMio()) return verbo ? `<p class="quien">${verbo} <b>${esc(p.nombre)}</b>${S.olivoActivo && S.zurron.bendicion > 0 ? " · bendición +2" : ""}</p>` : "";
  return `<p class="quien espera">Le toca a <b>${esc(p.nombre)}</b> en su móvil…</p>`;
}
function renderMapa() {
  const m = S.mapa, p = S.players[S.turno];
  const libres = m.filas[m.fila][m.col].sig;
  const mio = turnoMio() && !esperandoHost;
  const filas = m.filas.map((fila, f) => `<div class="fila-mapa">${fila.map((n, j) => {
    const aqui = f === m.fila && j === m.col, libre = f === m.fila + 1 && libres.includes(j);
    const cls = `nodo${n.hecho ? " hecho" : ""}${aqui ? " aqui" : ""}${libre ? " libre" : ""}${n.tipo === "jefe" ? " jefe" : ""}`;
    return `<button type="button" class="${cls}" data-f="${f}" data-j="${j}" ${libre && mio ? `data-juego="nodo" data-v="${j}"` : "disabled"} aria-label="${NOMBRE_NODO[n.tipo]}">
      <canvas data-icono="${n.tipo}" data-tam="${n.tipo === "jefe" ? 34 : 26}"></canvas></button>`;
  }).join("")}</div>`).reverse().join("");
  $("#mapa").innerHTML = `<svg class="lineas" aria-hidden="true"></svg>${filas}`;
  pintarIconos($("#mapa"));
  requestAnimationFrame(dibujarLineas);
  $("#panel").innerHTML = `${quienLinea(p, "Elige el camino:")}
    <p class="leyenda">${["combate", "evento", "tesoro", "tienda", "hoguera", "jefe"].map(t => `<span><canvas data-icono="${t}" data-tam="16"></canvas>${NOMBRE_NODO[t]}</span>`).join("")}</p>`;
  pintarIconos($("#panel"));
}
function dibujarLineas() {
  const mapa = $("#mapa"), svg = mapa && mapa.querySelector(".lineas");
  if (!svg || !S || !S.mapa) return;
  const caja = mapa.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${caja.width} ${caja.height}`);
  const centro = (f, j) => { const b = mapa.querySelector(`.nodo[data-f="${f}"][data-j="${j}"]`); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left - caja.left + r.width / 2, r.top - caja.top + r.height / 2]; };
  let html = "";
  S.mapa.filas.forEach((fila, f) => fila.forEach((n, j) => n.sig.forEach(k => {
    const a = centro(f, j), b = centro(f + 1, k);
    if (!a || !b) return;
    const abierta = f === S.mapa.fila && j === S.mapa.col;
    const usada = n.hecho && S.mapa.filas[f + 1][k].hecho;
    html += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${usada ? "usada" : abierta ? "abierta" : ""}"/>`;
  })));
  svg.innerHTML = html;
}
function renderEscena() {
  const sc = S.esc, p = S.players[S.turno];
  const el = $("#panel");
  const mio = turnoMio() && !esperandoHost, off = !mio;
  if (S.final) {
    const f = FINALES[S.final];
    el.innerHTML = `<h2>${f.titulo}</h2>${parrafo(f.texto[0])}
      <ul class="epilogo">${S.players.map(x => `<li><b>${esc(x.nombre)}</b> ${EPILOGOS[D.ejesAlin(x.alin)[1]]}</li>`).join("")}</ul>
      <div class="pie">${!S.online || esHost() ? `<button type="button" class="boton" data-ui="otra">Otra aventura</button>` : `<p class="espera">¡Fin! El anfitrión puede empezar otra.</p>`}</div>`;
    return;
  }
  if (S.derrota) {
    el.innerHTML = `<h2 class="ko">Habéis caído</h2>${parrafo("Una sacerdotisa de Solara os encuentra y os devuelve a la vida.")}
      <div class="pie">${!S.online || esHost() ? `<button type="button" class="boton" data-juego="reintentar">Volver al inicio del acto</button>` : `<p class="espera">El anfitrión decide.</p>`}</div>`;
    return;
  }
  if (S.aprender.length) {
    const a = S.aprender[0], q = S.players[a.i], nueva = H(a.hab);
    const mia = !S.online || q.uid === miId;
    el.innerHTML = `<p class="sello ok">¡Nivel ${q.nivel}!</p><h2>${esc(q.nombre)} quiere aprender ${nueva.nombre}</h2>
      <div class="hab-nueva"><p><b>${nueva.nombre}</b><span>${resumenHab(a.hab, q)}${nueva.usos ? ` · ${nueva.usos} usos` : " · sin límite"}</span></p><small>${nueva.desc}</small></div>
      <p class="quien${mia ? "" : " espera"}">${mia ? "Solo caben 4 habilidades. ¿Cuál olvida?" : `${esc(q.nombre)} está eligiendo en su móvil…`}</p>
      <div class="menu dos olvidar">${q.habs.map((id, k) => boton(`data-juego="aprender" data-v="${k}"`, H(id).nombre, "Olvidar", resumenHab(id, q), !mia)).join("")}</div>
      ${mia ? `<button type="button" class="boton sec" data-juego="aprender" data-v="-1">No aprender ${nueva.nombre}</button>` : ""}`;
    return;
  }
  const cab = `<h2>${sc.titulo}</h2>`;
  if (S.fase === "resultado" && S.resultado) {
    const r = S.resultado;
    const sello = r.tipo === "victoria" ? "Victoria" : r.tipo === "cofre" ? "¡Botín!" : r.tipo === "enigma" ? (r.ok ? "Correcto" : "Incorrecto") : r.linea ? (r.ok ? "Éxito" : "Fracaso") : "Hecho";
    const sigue = sc.esJefe ? (S.acto >= ACTOS.length - 1 ? "Ver el tesoro" : "Siguiente acto") : "Volver al mapa";
    el.innerHTML = `${cab}<p class="sello ${r.ok ? "ok" : "ko"}">${sello}</p>${parrafo(r.texto || "")}
      ${r.efectos.length ? `<ul class="efectos">${r.efectos.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${S.botin.length ? `<div class="botin">${S.botin.map(tarjetaBotin).join("")}</div>` : ""}
      <div class="pie">${mio ? `<button type="button" class="boton" data-juego="continuar">${sigue}${S.botin.length ? " · vender el resto" : ""}</button>` : quienLinea(p, "")}</div>`;
    return;
  }
  if (sc.tipo === "tesoro") {
    el.innerHTML = `${cab}${parrafo(sc.texto)}${quienLinea(p, "Decide")}<div class="pie">${mio ? `<button type="button" class="boton" data-juego="abrir">Abrir el cofre</button>` : ""}</div>`;
    return;
  }
  if (sc.tipo === "relato") {
    el.innerHTML = `${cab}${parrafo(sc.texto)}<div class="pie">${mio ? `<button type="button" class="boton" data-juego="continuar">${sc.boton}</button>` : quienLinea(p, "")}</div>`;
    return;
  }
  if (sc.tipo === "prueba") {
    el.innerHTML = `${cab}${parrafo(sc.texto)}${quienLinea(p, "Decide")}<div class="menu">${sc.opciones.map((op, i) => {
      const chip = op.stat ? `${ABREV[op.stat]}${fmt(stat(p, op.stat) + (op.stat === "raz" && p.raza === "gnomo" ? 2 : 0))} · CD ${op.cd}` : "";
      return boton(`data-juego="op" data-v="${i}"`, op.txt, chip, "", off);
    }).join("")}</div>`;
    return;
  }
  if (sc.tipo === "enigma") {
    const tachada = respuestaTachada(sc);
    el.innerHTML = `${cab}${parrafo(sc.texto)}${quienLinea(p, "Responde")}<div class="menu dos">${sc.respuestas.map((t, i) => boton(`data-juego="resp" data-v="${i}"`, i === tachada ? `<s>${t}</s>` : t, "", "", off || i === tachada)).join("")}</div>`;
    return;
  }
  if (sc.tipo === "final") {
    el.innerHTML = `${cab}${parrafo(sc.texto)}${quienLinea(p, "Decidid juntos. Elige")}<div class="menu">${sc.opciones.map(op => boton(`data-juego="final" data-v="${op.final}"`, op.txt, "", "", off)).join("")}</div>`;
    return;
  }
  if (sc.tipo === "tienda") return renderTienda(el, p, mio);
  if (sc.tipo === "combate") return renderCombate(el, sc, p, mio);
}
function renderTienda(el, p, mio) {
  const t = TIENDAS[S.tienda.clave];
  const items = t.objetos.map(id => {
    const o = OBJETOS[id], pr = precio(p, id);
    const equipado = o.tipo !== "consumible" && o.tipo !== "servicio" && p.equipo[o.tipo] === id;
    return `<button type="button" class="articulo" data-juego="comprar" data-v="${id}" ${!mio || equipado || p.oro < pr ? "disabled" : ""}>
      <strong>${o.nombre}</strong><small>${o.desc}</small><span class="chip">${equipado ? "Llevas" : `${pr} po`}</span></button>`;
  }).join("");
  const resto = S.tienda.cola.slice(S.tienda.pos + 1).map(i => S.players[i].nombre);
  el.innerHTML = `<div class="tendero"><canvas data-tam="40" data-rival="${tipoRival(t.pnj)}:${t.pnj}"></canvas><div><h2>${t.nombre}</h2>${mio ? `<p class="quien">Compra <b>${esc(p.nombre)}</b> · tiene <b class="oro">${p.oro} po</b>${p.clase === "picaro" ? " · −25 %" : ""}</p>` : quienLinea(p, "")}</div></div>
    <div class="articulos">${items}</div>
    <div class="pie">${mio ? `<button type="button" class="boton" data-juego="terminar">${resto.length ? `Listo · le toca a ${esc(resto[0])}` : "Salir de la tienda"}</button>` : ""}</div>`;
  pintarRetratos(el);
}
function renderCombate(el, sc, p, mio) {
  const c = S.combate;
  if (!c) { el.innerHTML = `<h2>${sc.titulo}</h2>`; return; }
  const e = ENEMIGOS[c.enemigo];
  const consumibles = ["pocion", "superior", "fuego", "sueno"].filter(k => S.zurron[k] > 0);
  const chips = [`CA ${e.ca}`, c.debil ? `Débil: ${TIPOS_DANO[c.debil]}` : "", c.resiste ? `Resiste ${TIPOS_DANO[c.resiste]}` : "", c.maldito ? "Maldito" : "", c.veneno ? `Veneno ${c.veneno}` : "", c.atkMod ? `Ataque ${c.atkMod}` : "", c.aturdido ? "Sin turno" : "", c.escudo ? "Bloqueado" : ""].filter(Boolean);
  const orden = c.orden.map((a, k) => `<li class="${k === c.pos ? "ahora" : ""}${a.t === "e" ? " rival" : ""}${a.t === "h" && S.players[a.i].alma <= 0 ? " caido" : ""}">${esc(a.t === "e" ? e.nombre.split(",")[0] : S.players[a.i].nombre)}</li>`).join("");
  let menu;
  if (c.enemigoActua) menu = `<p class="quien espera"><b>${e.nombre}</b> ataca…</p>`;
  else if (submenu === "objetos" && mio) menu = `<div class="menu dos">${consumibles.map(k => boton(`data-juego="objeto" data-v="${k}"`, OBJETOS[k].nombre, `×${S.zurron[k]}`, "", false)).join("")}${boton('data-ui="volver-menu"', "Volver", "", "", false)}</div>`;
  else menu = `${quienLinea(p, "Turno de")}<div class="menu dos acciones">${p.habs.map((id, k) => {
      const h = H(id), quedan = h.usos ? p.usosH[id] || 0 : 0;
      return boton(`data-juego="hab" data-v="${k}" data-tipo="${h.efecto === "dano" ? h.tipo : h.efecto === "cura" ? "cura" : "apoyo"}"`, h.nombre, h.usos ? `${quedan}/${h.usos}` : "∞", resumenHab(id, p), !mio || (h.usos && quedan <= 0));
    }).join("")}</div>
    <div class="fila-extra">${boton('data-ui="objetos"', "Objetos", `${consumibles.reduce((a, k) => a + S.zurron[k], 0)}`, "", !mio || !consumibles.length)}${S.anillo ? boton('data-juego="accion" data-v="anillo"', "Anillo", c.anilloUsado ? "usado" : "×1", "", !mio || c.anilloUsado) : ""}</div>`;
  el.innerHTML = `<div class="rival-info"><button type="button" class="rival-nombre" data-ui="bestia" data-k="${c.enemigo}">${e.nombre}</button><span class="chips">${chips.map(x => `<span>${x}</span>`).join("")}</span></div>
    <ol class="orden">${orden}</ol>${menu}`;
}

/* ---------- Ventanas ---------- */
function abrirModal(m) { modal = m; renderModal(); $("#capa").hidden = false; }
function cerrarModal() { modal = null; $("#capa").hidden = true; }
function renderModal() {
  if (!modal) return cerrarModal();
  const el = $("#modal");
  let html = "";
  if (modal.tipo === "ficha" && S) html = htmlFicha(S.players[modal.i]);
  if (modal.tipo === "mochila" && S) html = htmlMochila();
  if (modal.tipo === "compendio") html = htmlCompendio(modal.pestana || "bestiario", modal.k);
  if (modal.tipo === "cronica" && S) html = `<h2>Crónica</h2><ol class="cronica-larga">${S.log.slice().reverse().map(l => `<li class="${l.cls}">${esc(l.t)}</li>`).join("")}</ol>`;
  if (modal.tipo === "ayuda") html = htmlAyuda();
  if (modal.tipo === "menu") html = `<h2>Menú</h2><div class="menu">
      ${S ? boton('data-ui="modal" data-m="cronica"', "Crónica", "", "Todo lo que ha pasado", false) : ""}
      ${boton('data-ui="modal" data-m="compendio"', "Compendio", "", "Bestiario, razas, clases y el mundo", false)}
      ${boton('data-ui="modal" data-m="ayuda"', "Cómo se juega", "", "", false)}
      ${S && S.online ? boton('data-ui="salir"', "Salir de la partida", "", "Sigue para los demás", false) : S ? boton('data-ui="abandonar"', "Volver al inicio", "", "La partida queda guardada", false) : ""}</div>`;
  el.innerHTML = `<button type="button" class="cerrar" data-ui="cerrar" aria-label="Cerrar">×</button>${html}`;
  pintarRetratos(el);
}
function htmlFicha(p) {
  if (!p) return "";
  const rz = RAZAS[p.raza], cl = CLASES[p.clase], max = maxAlma(p), sig = NIVELES[p.nivel];
  return `<div class="ficha"><canvas class="retrato-grande" data-tam="84" data-look='${esc(JSON.stringify(lookDe(p)))}'></canvas>
    <div><h2>${esc(p.nombre)}</h2><p>${rz.nombre} · ${cl.nombre} · ${ALINEAMIENTOS[p.alin]}</p>
    <p class="cifras">Nv ${p.nivel} · PX ${p.xp}${sig !== undefined ? `/${sig}` : ""} · PG ${p.alma}/${max} · CA ${ca(p)} · ${p.oro} po</p>
    <p class="stats">${Object.keys(STATS).map(k => `<span><b>${fmt(stat(p, k))}</b>${ABREV[k]}</span>`).join("")}</p></div></div>
    <span class="barra-xp grande"><i style="width:${pctXp(p)}%"></i></span>
    <h3>Habilidades (${p.habs.length}/4)</h3>
    <ul class="lista-habs">${p.habs.map(id => `<li><p><b>${H(id).nombre}</b><span>${resumenHab(id, p)}${H(id).usos ? ` · ${H(id).usos} usos` : ""}</span></p><small>${H(id).desc}</small></li>`).join("")}</ul>
    ${proximaHab(p) ? `<p class="proxima">Nivel ${proximaHab(p).nivel}: aprenderá <b>${proximaHab(p).ids.map(x => H(x).nombre).join(", ")}</b></p>` : ""}
    <dl class="habilidades"><dt>${cl.pasiva}</dt><dd>${cl.pasivaDesc}</dd><dt>${rz.pasiva}</dt><dd>${rz.pasivaDesc}</dd></dl>
    <ul class="equipo">${Object.keys(RANURAS).map(k => `<li><span class="etiqueta">${RANURAS[k]}</span> ${p.equipo[k] ? OBJETOS[p.equipo[k]].nombre : "—"}</li>`).join("")}</ul>`;
}
function htmlMochila() {
  const libre = turnoMio() && !S.combate && !ocupado && !esperandoHost;
  return `<h2>Mochila</h2><ul class="mochila">${CONSUMIBLES.map(k => {
    const n = S.zurron[k];
    let acc = "";
    if (libre && n > 0 && (k === "pocion" || k === "superior")) acc = S.players.map((p, i) => p.alma < maxAlma(p) ? `<button type="button" class="boton sec mini" data-juego="usar" data-v="${k}:${i}">${esc(p.nombre)}</button>` : "").join("");
    if (k === "bendicion" && n > 0 && turnoMio()) acc = `<button type="button" class="boton ${S.olivoActivo ? "" : "sec "}mini" data-juego="olivo">${S.olivoActivo ? "Preparada" : "Usar en la próxima tirada"}</button>`;
    return `<li><div><b>${OBJETOS[k].nombre} ×${n}</b><span>${OBJETOS[k].desc}</span></div><div class="acciones-mochila">${acc}</div></li>`;
  }).join("")}</ul>${S.anillo ? "<p>Anillo de invisibilidad: una vez por combate, el enemigo pierde su turno.</p>" : ""}`;
}
function htmlCompendio(pestana, k) {
  const tabs = { bestiario: "Bestiario", mundo: "Mundo", razas: "Razas", clases: "Clases" };
  let cuerpo = "";
  if (pestana === "mundo") cuerpo = LORE.mundo.map(x => `<article><h3>${x.titulo}</h3>${x.texto.map(t => `<p>${t}</p>`).join("")}</article>`).join("")
    + Object.keys(LORE.lugares).filter(i => S && S.vistos.lugares.includes(+i)).map(i => `<article><h3>${LORE.lugares[i].titulo}</h3><p>${LORE.lugares[i].texto[0]}</p></article>`).join("");
  if (pestana === "bestiario") cuerpo = Object.keys(ENEMIGOS).filter(x => (S && S.vistos.bestias.includes(x)) || x === k).map(x => {
    const e = ENEMIGOS[x];
    return `<article class="bestia${x === k ? " destacada" : ""}"><canvas class="mini" data-tam="54" data-rival="enemigo:${x}"></canvas><div><h3>${e.nombre}</h3>
      <p class="bloque-stats">${e.tipo} · VD ${e.vd} · CA ${e.ca} · PG ${e.alma}${e.resiste ? ` · resiste ${TIPOS_DANO[e.resiste]}` : ""}${e.debil ? ` · débil a ${TIPOS_DANO[e.debil]}` : ""}</p>
      <p><b>${e.rasgoDesc}</b> ${e.lore}</p></div></article>`;
  }).join("") || `<p class="espera">Aún no os habéis cruzado con ningún monstruo.</p>`;
  if (pestana === "razas") cuerpo = Object.keys(RAZAS).map(x => { const r = RAZAS[x]; return `<article><h3>${r.nombre}</h3><p><b>${r.pasiva}:</b> ${r.pasivaDesc}</p><p>${r.lore}</p></article>`; }).join("");
  if (pestana === "clases") cuerpo = Object.keys(CLASES).map(x => { const c = CLASES[x]; return `<article><h3>${c.nombre} · ${c.rol}</h3><p>${Object.keys(APRENDE[x]).map(l => `<b>Nv ${l}:</b> ${APRENDE[x][l].map(id => H(id).nombre).join(", ")}`).join(" · ")}</p><p><b>${c.pasiva}:</b> ${c.pasivaDesc}</p></article>`; }).join("");
  return `<h2>Compendio</h2><div class="pestanas">${Object.keys(tabs).map(t => `<button type="button" data-ui="pestana" data-p="${t}" aria-selected="${t === pestana}">${tabs[t]}</button>`).join("")}</div><div class="compendio">${cuerpo}</div>`;
}
function htmlAyuda() {
  return `<h2>Cómo se juega</h2><ul class="ayuda">
    <li><b>En línea:</b> uno crea la partida y pasa el código de 4 letras. Cada amigo abre este mismo juego en claude.ai con su cuenta, pulsa «Unirse» y lo escribe. El móvil del anfitrión lleva la partida: que no lo cierre.</li>
    <li><b>Personaje:</b> 90 segundos para elegir clase, raza y aspecto. Al acabar el tiempo, empieza la aventura.</li>
    <li><b>Mapa:</b> en cada acto elegís camino entre combates, sucesos, una tienda y una hoguera. Al final espera el jefe. Son 4 actos: bosque, mazmorra, castillo y volcán.</li>
    <li><b>Habilidades:</b> cada héroe lleva hasta 4, como los movimientos de un Pokémon. Al subir de nivel aprende otras; si ya tiene 4, elige cuál olvida. Las de usos limitados se recargan en cada combate.</li>
    <li><b>Botín:</b> los cofres y los enemigos sueltan armas, armaduras y objetos mágicos. Pulsa el nombre del héroe que se lo queda (▲ = mejor que lo que lleva). Lo que nadie coge se vende.</li>
    <li><b>Tiradas:</b> d20 + atributo contra la CD (o la CA del enemigo). 20 es crítico y 1 es pifia.</li>
    <li><b>Turnos:</b> decide quien tiene el marco dorado. En combate manda la iniciativa.</li>
    <li><b>Si caéis todos,</b> volvéis al inicio del acto.</li></ul>`;
}

/* ---------- Jugadas ---------- */
function ejecutar(k, v) {
  switch (k) {
    case "nodo": return elegirNodo(+v);
    case "op": return elegirOpcion(+v);
    case "resp": return responder(+v);
    case "final": return elegirFinal(v);
    case "accion": return accion(v);
    case "hab": return accion("hab", v);
    case "abrir": return abrirCofre();
    case "equipar": { const [k, i] = String(v).split(":"); return equipar(+k, +i); }
    case "aprender": return aprender(+v);
    case "objeto": return accion("objeto", v);
    case "comprar": return comprar(v);
    case "terminar": return terminarCompras();
    case "continuar": return continuar();
    case "reintentar": return reintentar();
    case "olivo": S.olivoActivo = !S.olivoActivo; guardar(); return render();
    case "usar": { const [id, i] = String(v).split(":"); return usarFuera(id, +i); }
  }
}
async function volverASeleccion() {
  if (!esHost()) return;
  try { await red.db.doc(`partidas/${red.mesa}`).update({ estado: "seleccion", juego: null, fin: Date.now() + SEGUNDOS * 1000 }); }
  catch (e) { avisarError(e); }
}
document.addEventListener("click", ev => {
  if (ev.target.id === "capa") return cerrarModal();
  const b = ev.target.closest("button");
  if (!b || b.disabled) return;
  const ds = b.dataset;
  if (ds.juego) {
    if (!S || ocupado || esperandoHost) return;
    const k = ds.juego, v = ds.v;
    if (k === "reintentar" ? S.online && !esHost() : !permitido(k, miId)) return;
    if (S.online && !esHost()) return enviarJugada(k, v);
    return ejecutar(k, v);
  }
  switch (ds.ui) {
    case "crear": return crearPartida();
    case "ir-unirse": vista = "unirse"; return render();
    case "volver-inicio": vista = "inicio"; return render();
    case "local": sel.heroes = [heroeAlAzar(0)]; return empezarSeleccionLocal();
    case "cargar": S = cargar(); vista = "juego"; return render();
    case "sel-ant": return cambiarSeleccion(ds.c, -1);
    case "sel-sig": return cambiarSeleccion(ds.c, 1);
    case "sel-azar": { const h = heroeEditado(); const n = heroeAlAzar(Math.floor(Math.random() * 9)); Object.assign(h, { raza: n.raza, clase: n.clase, look: n.look }); if (sel.online) publicarPresencia(); return renderSeleccion(); }
    case "sel-heroe": sel.actual = +ds.i; return renderSeleccion();
    case "sel-anadir": sel.heroes.push(heroeAlAzar(sel.heroes.length)); sel.actual = sel.heroes.length - 1; return renderSeleccion();
    case "sel-quitar": sel.heroes.splice(sel.actual, 1); sel.actual = Math.max(0, sel.actual - 1); return renderSeleccion();
    case "sel-listo":
      if (!sel.online) return comenzarLocal();
      if (esHost()) return comenzarEnLinea();
      sel.listo = !sel.listo; publicarPresencia(); return renderSeleccion();
    case "sel-salir": if (sel.online) return salirPartida(); sel.fin = 0; vista = "inicio"; return render();
    case "ficha": return abrirModal({ tipo: "ficha", i: +ds.i });
    case "mochila": return abrirModal({ tipo: "mochila" });
    case "menu": return abrirModal({ tipo: "menu" });
    case "modal": return abrirModal({ tipo: ds.m });
    case "bestia": return abrirModal({ tipo: "compendio", pestana: "bestiario", k: ds.k });
    case "pestana": modal.pestana = ds.p; return renderModal();
    case "cronica": return abrirModal({ tipo: "cronica" });
    case "objetos": submenu = "objetos"; return renderEscena();
    case "volver-menu": submenu = null; return renderEscena();
    case "cerrar": return cerrarModal();
    case "salir": cerrarModal(); return salirPartida();
    case "abandonar": cerrarModal(); S = null; vista = "inicio"; return render();
    case "otra": if (S && S.online) return volverASeleccion(); escribir(CLAVE, null); S = null; return empezarSeleccionLocal();
  }
});
document.addEventListener("input", ev => {
  if (ev.target.id !== "sel-nombre") return;
  heroeEditado().nombre = ev.target.value.slice(0, 16);
  clearTimeout(document.nombreT);
  document.nombreT = setTimeout(() => { if (sel.online) publicarPresencia(); renderSeleccion(); }, 400);
});
document.addEventListener("submit", ev => {
  ev.preventDefault();
  if (ev.target.id === "form-unirse") {
    const c = ($("#codigo-mesa").value || "").trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(c)) return avisar("El código tiene 4 letras, por ejemplo KRTO.");
    return entrarPartida(c);
  }
});
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && modal) cerrarModal(); });
window.addEventListener("resize", () => { if (S && S.modo === "mapa") requestAnimationFrame(dibujarLineas); });

if (location.hash === "#prueba") window.__dym = { estado: () => S };
render();
conectar();
})();
