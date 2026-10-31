/* Diálogos y Dados · el juego: estado, reglas, combate por iniciativa, tiendas, creación de personajes,
   pantallas y mesas en línea (db guarda la partida, room dice quién está conectado, user de quién es cada héroe). */
(() => {
"use strict";
const D = DATOS;
const { STATS, ABREV, CAPITULOS, ROMANOS, NIVELES, NOMBRES, RAZAS, CLASES, ALINEAMIENTOS, ORDEN_ALIN, OBJETOS, RANURAS, TIENDAS, TIPOS_DANO, ENEMIGOS, ESCENAS, FINALES, EPILOGOS, LORE } = D;
const RP = PX.RAMPAS;

const CLAVE = "dialogos-y-dados-v2";
const CLAVE_MESA = "dialogos-y-dados-mesa-v2";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const d = n => 1 + Math.floor(Math.random() * n);
const tirar = (c, s, b = 0) => { let t = b; for (let i = 0; i < c; i++) t += d(s); return t; };
const fmt = n => (n >= 0 ? "+" : "−") + Math.abs(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const azarDe = a => a[Math.floor(Math.random() * a.length)];
const reducido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const CONSUMIBLES = ["nectar", "ambrosia", "olivo", "fuego", "leteo"];

let S = null;
let ocupado = false, confirmando = false, modal = null, submenu = null;
let pantalla = "", dadoVisto = 0, efectosVistos = 0;
let escJuego = null, escTaberna = null;

/* ---------- Héroes ---------- */
function heroeAlAzar(i = 0) {
  const razas = Object.keys(RAZAS), clases = Object.keys(CLASES);
  const raza = razas[(i * 3 + Math.floor(Math.random() * 8)) % 8], clase = clases[(i * 5 + Math.floor(Math.random() * 8)) % 8];
  const vis = HEROES.RAZAS[raza];
  return {
    nombre: NOMBRES[(i * 7 + Math.floor(Math.random() * NOMBRES.length)) % NOMBRES.length], raza, clase, alin: azarDe(["LB", "NB", "CB", "LN", "N", "CN"]),
    look: { piel: azarDe(vis.pieles), pelo: vis.pelos.length ? azarDe(vis.pelos) : null, tela: HEROES.TELA_CLASE[clase], peinado: azarDe(["corto", "largo", "recogido", "rizado"]), barba: Math.random() < 0.3 }
  };
}
const EJEMPLO = [
  { nombre: "Aristocles", raza: "humano", clase: "filosofo", alin: "LB", look: { piel: "oliva", pelo: "castano", tela: "azul", peinado: "corto", barba: true } },
  { nombre: "Hiparquia", raza: "elfo", clase: "cazadora", alin: "CB", look: { piel: "clara", pelo: "rubio", tela: "oliva", peinado: "recogido", barba: false } },
  { nombre: "Jenofonte", raza: "enano", clase: "guardian", alin: "LN", look: { piel: "morena", pelo: "cobrizo", tela: "granate", peinado: "corto", barba: true } }
];
const borrador = {
  modo: window.claude && window.claude.use ? "online" : "local",
  local: { heroes: EJEMPLO.map(h => JSON.parse(JSON.stringify(h))), sel: 0 },
  mios: { heroes: [heroeAlAzar(Math.floor(Math.random() * 6))], sel: 0 }
};

function nuevoHeroe(def) {
  const raza = RAZAS[def.raza] ? def.raza : "humano", clase = CLASES[def.clase] ? def.clase : "filosofo";
  const c = CLASES[clase], r = RAZAS[raza];
  const base = {};
  for (const k of Object.keys(STATS)) base[k] = c.stats[k] + (r.mods[k] || 0);
  const almaBase = c.alma + r.alma;
  return {
    nombre: String(def.nombre || "").trim().slice(0, 24) || "Anónimo", raza, clase, alin: ALINEAMIENTOS[def.alin] ? def.alin : "N",
    look: Object.assign({}, def.look || {}), uid: def.uid || null, base, almaBase, alma: almaBase, xp: 0, nivel: 1, dracmas: 15,
    equipo: { arma: null, armadura: null, talisman: null }, usos: 1, est: { aturdido: 0, cegado: 0, petrificado: 0 }, fl: {}
  };
}
const lookDe = p => Object.assign({ raza: p.raza, clase: p.clase }, p.look);
const obj = id => (id ? OBJETOS[id] : null);
function stat(p, k) { const t = obj(p.equipo.talisman); return p.base[k] + (t && t.stat === k ? 1 : 0); }
function maxAlma(p) { const a = obj(p.equipo.armadura); return p.almaBase + (a && a.alma ? a.alma : 0); }
function ca(p) {
  const a = obj(p.equipo.armadura), t = obj(p.equipo.talisman);
  return 10 + stat(p, "ani") + (a && a.ca ? a.ca : 0) + (t && t.ca ? t.ca : 0) + (p.clase === "guardian" ? 2 : 0);
}
function iniMod(p) { const t = obj(p.equipo.talisman); return stat(p, "tem") + (t && t.ini ? t.ini : 0); }
function critMin(p) { const t = obj(p.equipo.talisman); return t && t.critico ? t.critico : 20; }
const usosHab = p => (p.nivel >= 3 ? 2 : 1);
const nombreRazaClase = p => `${CLASES[p.clase].nombre} ${RAZAS[p.raza].nombre.toLowerCase()}`;
/* Valores de una definición todavía sin crear (para el editor). */
function vistaPrevia(def) { const p = nuevoHeroe(def); return { p, ca: ca(p) }; }

/* ---------- Guardado y mesa en línea ---------- */
const red = { listo: false, db: null, room: null, yo: null, mesas: [], info: null, asientos: [], enLinea: new Set(), sala: null, subs: [], ultimo: null, pendiente: null, escribiendo: false };
let mesa = null;

function guardar() {
  if (!S) return;
  S.rev = (S.rev || 0) + 1;
  if (S.online) {
    if (S.efectos && S.efectos.lista.length) S.efectos.seq++;
    if (mesa) escribirMesa();
    if (S.efectos) S.efectos.lista = [];
    return;
  }
  try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) {}
}
function cargar() {
  try { const t = localStorage.getItem(CLAVE); const g = t ? JSON.parse(t) : null; return g && g.v === 2 && !g.online ? g : null; } catch (e) { return null; }
}
function borrar() { try { localStorage.removeItem(CLAVE); } catch (e) {} }
function puedoActuar() { return !S || !S.online || (!!S.players[S.turno] && S.players[S.turno].uid === red.yo); }
function esAnfitrion() { return (!!S && !S.online) || (!!red.info && red.info.anfitrion === red.yo); }

function avisar(t) { const a = $("#aviso"); a.textContent = t || ""; a.hidden = !t; }
function avisarError(e) {
  const code = e && e.code;
  if (code === "invalid_argument") avisar("No tienes permiso para jugar en esta mesa. Pide al dueño del juego que te invite por correo con permiso de edición (el enlace público solo deja mirar).");
  else if (code === "quota_exceeded") avisar("El almacén de partidas está lleno. Borrad mesas antiguas o jugad en este dispositivo.");
  else if (code === "revoked") avisar("Has perdido el acceso a este juego.");
  else avisar("No se pudo guardar la jugada. Revisa la conexión e inténtalo de nuevo.");
}

async function conectar() {
  if (!window.claude || !window.claude.use) { red.listo = true; pantalla = ""; return render(); }
  const [db, user, room] = await Promise.all(["db", "user", "room"].map(n => window.claude.use(n).catch(() => null)));
  red.db = db; red.room = room;
  red.yo = user ? await user.id().catch(() => null) : null;
  red.listo = true;
  if (red.db && red.yo) {
    red.db.collection("mesas").orderBy("creada", "desc").limit(20).onSnapshot(snap => {
      red.mesas = snap.docs.map(x => x.data()).filter(m => m.v === 2 && m.estado !== "fin" && Date.now() - (m.creada || 0) < 2 * 864e5);
      if (!S && !mesa) actualizarListaMesas();
    }, () => { red.mesas = []; });
    let recordada = null;
    try { recordada = localStorage.getItem(CLAVE_MESA); } catch (e) {}
    if (recordada && !S) return entrarMesa(recordada, true);
  } else if (!S) borrador.modo = "local";
  pantalla = ""; render();
}

async function crearMesa() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let c = "";
  for (let i = 0; i < 4; i++) c += letras[Math.floor(Math.random() * letras.length)];
  try {
    await red.db.doc(`mesas/${c}`).set({ v: 2, codigo: c, anfitrion: red.yo, estado: "sala", creada: Date.now(), actualizada: Date.now(), juego: null, jugadores: 0, capitulo: 0 });
    entrarMesa(c);
  } catch (e) { avisarError(e); }
}

function entrarMesa(codigo, silencioso) {
  salirMesa(true);
  mesa = codigo; avisar("");
  try { localStorage.setItem(CLAVE_MESA, codigo); } catch (e) {}
  let confirmado = false;
  const reloj = setTimeout(() => { if (!confirmado) avisar("La mesa tarda en responder. Puede que la conexión vaya lenta."); }, 10000);
  red.subs.push(red.db.doc(`mesas/${codigo}`).onSnapshot(snap => {
    if (!snap.metadata.fromCache && !confirmado) { confirmado = true; clearTimeout(reloj); avisar(""); }
    if (!snap.exists) {
      if (confirmado) { salirMesa(); if (!silencioso) avisar(`No hay ninguna mesa con el código ${codigo}.`); }
      return;
    }
    recibirMesa(snap.data());
  }, e => { clearTimeout(reloj); avisarError(e); }));
  red.subs.push(red.db.collection(`mesas/${codigo}/asientos`).onSnapshot(s => {
    red.asientos = s.docs.map(x => x.data()).sort((a, b) => (a.t || 0) - (b.t || 0));
    if (!S) render();
  }, () => {}));
  if (red.room) {
    red.room.join(`mesa-${codigo.toLowerCase()}`).then(r => {
      if (mesa !== codigo) return r.leave();
      red.sala = r;
      r.presence({ uid: red.yo }).catch(() => {});
      red.subs.push(r.onPeers(ch => {
        red.enLinea = new Set(ch.peers.map(p => p.presence && p.presence.uid).filter(Boolean));
        if (S) { renderGrupo(); renderHerramientas(); } else render();
      }, () => {}));
    }).catch(() => {});
  }
  pantalla = ""; render();
}

function salirMesa(silencioso) {
  if (mesa && red.yo && red.info && red.info.estado === "sala") red.db.doc(`mesas/${mesa}/asientos/${red.yo}`).delete().catch(() => {});
  red.subs.forEach(u => u()); red.subs = [];
  if (red.sala) red.sala.leave().catch(() => {});
  red.sala = null; red.enLinea = new Set(); red.info = null; red.asientos = []; red.ultimo = null;
  if (S && S.online) S = null;
  mesa = null;
  try { localStorage.removeItem(CLAVE_MESA); } catch (e) {}
  if (!silencioso) { pantalla = ""; render(); }
}

function recibirMesa(m) {
  red.info = m;
  if (m.estado === "sala" || !m.juego) {
    if (S && S.online) { S = null; pantalla = ""; }
    return render();
  }
  if (m.juego === red.ultimo) return;
  let nuevo;
  try { nuevo = JSON.parse(m.juego); } catch (e) { return; }
  const primero = !S || !S.online;
  if (!primero && (nuevo.rev || 0) <= (S.rev || 0)) return;
  S = nuevo; red.ultimo = m.juego;
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

function escribirMesa() {
  red.pendiente = JSON.stringify(S);
  red.ultimo = red.pendiente;
  if (!red.escribiendo) vaciarCola();
}
async function vaciarCola() {
  red.escribiendo = true;
  while (red.pendiente && mesa) {
    const juego = red.pendiente, g = JSON.parse(juego);
    red.pendiente = null;
    const datos = { juego, estado: g.final ? "fin" : "jugando", capitulo: ESCENAS[g.escena].cap, jugadores: g.players.length, actualizada: Date.now() };
    for (let intento = 0; intento < 2; intento++) {
      try { await red.db.doc(`mesas/${mesa}`).update(datos); break; }
      catch (e) {
        if (e.code === "unavailable" && intento === 0) { await new Promise(r => setTimeout(r, 600 + Math.random() * 800)); continue; }
        avisarError(e); break;
      }
    }
  }
  red.escribiendo = false;
}

async function sentarse() {
  const heroes = borrador.mios.heroes.map(h => ({ nombre: String(h.nombre || "").trim().slice(0, 24) || "Anónimo", raza: h.raza, clase: h.clase, alin: h.alin, look: h.look }));
  const previo = red.asientos.find(a => a.uid === red.yo);
  try {
    await red.db.doc(`mesas/${mesa}/asientos/${red.yo}`).set({ uid: red.yo, heroes, t: previo ? previo.t : Date.now() });
    avisar("");
  } catch (e) { avisarError(e); }
}
function heroesSentados() {
  const lista = [];
  red.asientos.forEach(a => (a.heroes || []).forEach(h => lista.push(Object.assign({}, h, { uid: a.uid }))));
  return lista;
}
function comenzarEnLinea() {
  const filas = heroesSentados();
  if (!filas.length || !esAnfitrion()) return;
  nuevaPartida(filas.slice(0, 6), mesa);
}
async function volverASala() {
  try { await red.db.doc(`mesas/${mesa}`).update({ estado: "sala", juego: null, actualizada: Date.now() }); }
  catch (e) { avisarError(e); }
}

/* ---------- Utilidades del estado ---------- */
function log(t, cls = "") { S.log.push({ t, cls }); if (S.log.length > 150) S.log.shift(); }
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

/* ---------- Progreso ---------- */
function ganarXp(n) {
  const out = [];
  if (!n) return out;
  out.push(`${fmt(n)} Sabiduría`);
  S.players.forEach(p => {
    p.xp = Math.max(0, p.xp + n + (n > 0 && p.raza === "humano" ? 1 : 0));
    while (p.nivel < NIVELES.length && p.xp >= NIVELES[p.nivel]) subirNivel(p, out);
  });
  return out;
}
function subirNivel(p, out) {
  p.nivel++; p.almaBase += 2; p.alma = Math.min(maxAlma(p), p.alma + 2);
  const bajo = Object.keys(STATS).reduce((a, k) => (p.base[k] < p.base[a] ? k : a), "raz");
  if (p.base[bajo] < 5) p.base[bajo]++;
  let t = `${p.nombre} sube a nivel ${p.nivel}: +2 Alma máxima y +1 ${STATS[bajo]}`;
  if (p.nivel === 3) t += `. Ya puede usar ${CLASES[p.clase].hab} dos veces por combate`;
  log(t, "nivel"); out.push(t);
}

function aplicarFx(f = {}, actor) {
  const out = [];
  const vida = (p, n) => { p.alma = Math.max(1, Math.min(maxAlma(p), p.alma + n)); };
  if (f.alma && actor) { vida(actor, f.alma); out.push(`${fmt(f.alma)} Alma para ${actor.nombre}`); }
  if (f.almaTodos) { S.players.forEach(p => vida(p, f.almaTodos)); out.push(`${fmt(f.almaTodos)} Alma para el grupo`); }
  if (f.maxTodos) {
    S.players.forEach(p => { p.almaBase = Math.max(4, p.almaBase + f.maxTodos); p.alma = Math.min(p.alma, maxAlma(p)); });
    out.push(`${fmt(f.maxTodos)} Alma máxima para todos`);
  }
  if (f.curarTodo) { S.players.forEach(p => { p.alma = maxAlma(p); }); out.push("Alma restaurada por completo"); }
  ["nectar", "olivo"].forEach(k => { if (f[k]) { S.zurron[k] = Math.max(0, S.zurron[k] + f[k]); out.push(`${fmt(f[k])} ${OBJETOS[k].nombre}`); } });
  if (f.dracmas) { S.players.forEach(p => { p.dracmas = Math.max(0, p.dracmas + f.dracmas); }); out.push(`${fmt(f.dracmas)} dracmas cada uno`); }
  if (f.anillo) { S.anillo = true; out.push("Anillo de Giges"); }
  if (f.moral && actor) {
    const antes = actor.alin;
    actor.alin = D.moverMoral(actor.alin, f.moral);
    if (actor.alin !== antes) out.push(`${actor.nombre} ahora es ${ALINEAMIENTOS[actor.alin].toLowerCase()}`);
  }
  out.push(...ganarXp(f.xp));
  return out;
}

/* ---------- Dados ---------- */
function tirarDado(final, caras, cb) {
  const cv = $("#dado");
  ocupado = true; document.body.classList.add("ocupado");
  const terminar = () => {
    if (cv) { ESCENARIO.dibujarDado(cv, final); cv.dataset.estado = caras === 20 && final === 20 ? "critico" : caras === 20 && final === 1 ? "pifia" : ""; }
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
/* Tirada de d20 de un héroe: los medianos repiten los unos. */
function tiradaD20(p) {
  let r = d(20), nota = "";
  if (r === 1 && p.raza === "mediano") { const r2 = d(20); nota = ` (afortunado: repite el 1 y saca ${r2})`; r = r2; }
  mostrarTirada.ultimo = r;
  return { r, nota };
}
function usarOlivo() {
  if (S.olivoActivo && S.zurron.olivo > 0) { S.zurron.olivo--; S.olivoActivo = false; return 2; }
  return 0;
}
function cegueraDe(p) { if (p.est && p.est.cegado > 0) { p.est.cegado = 0; return -4; } return 0; }
function lineaTirada(quien, accion, r, mod, bono, pen, total, contra, crit) {
  let t = `${quien} ${accion}: ${r} ${fmt(mod)}${bono ? " +2 olivo" : ""}${pen ? " −4 ceguera" : ""} = ${total} contra ${contra}`;
  if (crit) t += " · ¡crítico!";
  else if (r === 1) t += " · ¡pifia!";
  return t;
}

/* ---------- Escenas ---------- */
function nuevaPartida(filas, codigo) {
  S = {
    v: 2, online: codigo ? { codigo } : null, rev: 0, dado: null, efectos: codigo ? { seq: 0, lista: [] } : null,
    players: filas.map(nuevoHeroe),
    zurron: { nectar: 1, ambrosia: 0, olivo: 0, fuego: 0, leteo: 0 }, olivoActivo: false, anillo: false,
    escena: null, turno: 0, fase: "elegir", resultado: null, combate: null, tienda: null,
    derrota: false, final: null, guardadoCap: null, log: [], vistos: { bestias: [], lugares: [] }
  };
  log(`Comienza la partida: ${S.players.map(p => `${p.nombre} (${nombreRazaClase(p)})`).join(", ")}.`);
  if (S.players.length === 1) { const p = S.players[0]; p.almaBase += 4; p.alma += 4; log(`${p.nombre} viaja sin compañía: +4 Alma máxima.`, "nivel"); }
  submenu = null; modal = null;
  entrarEscena("c1_sombras");
}

function entrarEscena(id) {
  const sc = ESCENAS[id];
  S.escena = id; S.fase = "elegir"; S.resultado = null; S.combate = null; S.tienda = null;
  S.turno = siguienteVivo(S.turno);
  submenu = null;
  if (sc.inicio) { S.guardadoCap = null; S.guardadoCap = JSON.stringify(S); }
  if (!S.vistos.lugares.includes(sc.cap)) S.vistos.lugares.push(sc.cap);
  log(`${ROMANOS[sc.cap]} · ${sc.titulo}`, "esc");
  if (sc.tipo === "combate") return iniciarCombate(sc);
  if (sc.tipo === "tienda") abrirTienda(sc);
  guardar(); render();
}

function elegirOpcion(i) {
  if (ocupado) return;
  const sc = ESCENAS[S.escena], op = sc.opciones[i], p = S.players[S.turno];
  const sig = op.sig || sc.sig;
  if (!op.stat) return resolver(op.ok, op.ok, true, null, sig, false);
  if (op.inmuneElfo && p.raza === "elfo") return resolver(op.ok, op.ko, true, `${p.nombre} es elfo: el canto de la sirena no le afecta (ascendencia feérica).`, sig, false);
  const mod = stat(p, op.stat) + (op.stat === "raz" && p.clase === "filosofo" ? 2 : 0);
  const bono = usarOlivo();
  const { r, nota } = tiradaD20(p);
  tirarDado(r, 20, () => {
    const total = r + mod + bono;
    const crit = r >= critMin(p);
    const ok = crit || (r !== 1 && total >= op.cd);
    const linea = lineaTirada(p.nombre, `tira ${STATS[op.stat]}`, r, mod, bono, 0, total, `CD ${op.cd}`, crit) + nota;
    mostrarTirada(linea, ok);
    resolver(op.ok, op.ko, ok, linea, sig, crit);
  });
}
function respuestaTachada(sc) {
  if (!S.players.some(p => p.clase === "filosofo")) return -1;
  for (let k = 1; k < sc.respuestas.length; k++) { const i = (sc.correcta + k * 2) % sc.respuestas.length; if (i !== sc.correcta) return i; }
  return -1;
}
function responder(i) {
  if (ocupado) return;
  const sc = ESCENAS[S.escena], ok = i === sc.correcta;
  resolver(sc.ok, sc.ko, ok, `${S.players[S.turno].nombre} responde: «${sc.respuestas[i]}»`, ok ? sc.sigOk || sc.sig : sc.sigKo || sc.sig, false, "enigma");
}
function resolver(okRama, koRama, ok, linea, sig, critico, tipo = "prueba") {
  const p = S.players[S.turno], rama = ok ? okRama : koRama;
  const efectos = aplicarFx(rama.fx, p);
  if (critico) efectos.push(...ganarXp(1));
  S.fase = "resultado";
  S.resultado = { ok, tipo, linea, texto: rama.t, efectos, siguiente: sig };
  log(linea ? `${linea} → ${ok ? "éxito" : "fracaso"}` : `${p.nombre} decide sin tirar.`, ok ? "ok" : "ko");
  if (ok && tipo !== "enigma") fx({ tipo: "cura", objetivo: "h" + S.turno });
  guardar(); render();
}
function continuar() {
  if (ocupado || !S.resultado) return;
  S.turno = siguienteVivo(S.turno + 1);
  entrarEscena(S.resultado.siguiente);
}
function continuarRelato() {
  const sc = ESCENAS[S.escena];
  const efectos = aplicarFx(sc.fx);
  if (efectos.length) log(efectos.join(" · "), "ok");
  S.turno = siguienteVivo(S.turno + 1);
  entrarEscena(sc.sig);
}
function elegirFinal(clave) {
  S.final = clave;
  log(`Final: ${FINALES[clave].titulo}`, "esc");
  guardar(); render();
}
function reencarnar() {
  const g = JSON.parse(S.guardadoCap);
  g.log = S.log; g.guardadoCap = S.guardadoCap; g.rev = S.rev; g.dado = S.dado; g.efectos = S.efectos;
  S = g;
  S.players.forEach(p => { p.alma = maxAlma(p); });
  log("Como en el mito de Er, vuestras almas eligen una nueva vida y volvéis al inicio del capítulo.", "esc");
  entrarEscena(S.escena);
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
  return p.clase === "sofista" ? Math.ceil(base * 0.75) : base;
}
function comprar(id) {
  if (ocupado || !S.tienda) return;
  const p = S.players[S.turno], o = OBJETOS[id], pr = precio(p, id);
  if (p.dracmas < pr) return;
  if (o.tipo !== "consumible" && o.tipo !== "servicio" && p.equipo[o.tipo] === id) return;
  p.dracmas -= pr;
  let t = `${p.nombre} compra ${o.nombre} por ${pr} dracmas`;
  if (o.tipo === "consumible") S.zurron[id]++;
  else if (o.tipo === "servicio") { S.players.forEach((x, i) => { x.alma = maxAlma(x); fx({ tipo: "cura", objetivo: "h" + i }); }); t += ". Todo el grupo duerme a pierna suelta y recupera el Alma"; }
  else {
    const viejo = p.equipo[o.tipo];
    if (viejo) { const vuelta = Math.floor(OBJETOS[viejo].precio / 2); p.dracmas += vuelta; t += ` y vende su ${OBJETOS[viejo].nombre} por ${vuelta}`; }
    p.equipo[o.tipo] = id;
    p.alma = Math.min(p.alma + (o.alma || 0), maxAlma(p));
    fx({ tipo: "magia", objetivo: "h" + S.turno, rampa: RP.bronce });
  }
  log(t + ".", "ok");
  guardar(); render();
}
function terminarCompras() {
  if (ocupado || !S.tienda) return;
  const tienda = S.tienda;
  tienda.pos++;
  if (tienda.pos >= tienda.cola.length) {
    const sc = ESCENAS[S.escena];
    S.turno = siguienteVivo(tienda.cola[0] + 1);
    return entrarEscena(sc.sig);
  }
  S.turno = tienda.cola[tienda.pos];
  guardar(); render();
}
function usarFuera(id, i) {
  if (ocupado || S.combate || !puedoActuar() || !S.zurron[id]) return;
  const p = S.players[i];
  if (!p || p.alma >= maxAlma(p)) return;
  S.zurron[id]--;
  const base = id === "nectar" ? 8 : maxAlma(p);
  const real = curar(p, p.raza === "satiro" ? base * 2 : base);
  log(`${p.nombre} toma ${OBJETOS[id].nombre.toLowerCase()} y recupera ${real} de Alma.`, "ok");
  fx({ tipo: "cura", objetivo: "h" + i }); fx({ tipo: "numero", objetivo: "h" + i, texto: "+" + real, color: RP.hoja[4] });
  guardar(); render();
}

/* ---------- Combate ---------- */
function iniciarCombate(sc) {
  const e = ENEMIGOS[sc.enemigo], n = S.players.length;
  /* Los enemigos crecen con el grupo; en solitario pegan un poco menos. */
  const hp = Math.round(e.alma * (0.45 + 0.28 * n));
  const c = S.combate = {
    enemigo: sc.enemigo, hp, hpMax: hp, ataques: e.ataques + (n >= 4 ? 1 : 0) + (n >= 6 ? 1 : 0), blando: n === 1, ronda: 1, orden: [], pos: 0,
    aturdido: false, escudo: false, maldito: false, anilloUsado: false, partido: false,
    resiste: e.resiste, debil: e.debil, robado: {}, enemigoActua: false
  };
  if (!S.vistos.bestias.includes(sc.enemigo)) S.vistos.bestias.push(sc.enemigo);
  S.players.forEach(p => { p.usos = usosHab(p); p.fl = {}; p.est = { aturdido: 0, cegado: 0, petrificado: 0 }; });
  const orden = S.players.map((p, i) => ({ t: "h", i, ini: d(20) + iniMod(p) }));
  orden.push({ t: "e", ini: d(20) + e.ini });
  orden.sort((a, b) => b.ini - a.ini || (a.t === "h" ? -1 : 1));
  c.orden = orden;
  log(`Iniciativa: ${orden.map(x => `${x.t === "e" ? e.nombre : S.players[x.i].nombre} ${x.ini}`).join(" · ")}`);
  S.players.forEach((p, i) => {
    if (p.raza !== "draconido" || p.alma <= 0) return;
    fx({ tipo: "ataque", actor: "h" + i });
    log(`${p.nombre} exhala su aliento de dragón → ${danarRival(tirar(1, 6), "magica", false, 1, RP.fuego)}`, "ok");
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
    if (p.est.petrificado > 0) { p.est.petrificado--; log(`${p.nombre} sigue siendo de piedra y pierde el turno.`, "ko"); avanzar(); continue; }
    if (p.est.aturdido > 0) { p.est.aturdido--; log(`${p.nombre} está aturdido y pierde el turno.`, "ko"); avanzar(); continue; }
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
  if (extra > 1 && extra > mult) { mult = extra; nota = " (¡doble contra las sombras!)"; }
  dmg = mult < 1 ? Math.max(1, Math.floor(dmg * mult)) : Math.round(dmg * mult);
  c.hp = Math.max(0, c.hp - dmg);
  fx({ tipo: "golpe", objetivo: "e" });
  if (clase === "magica") fx({ tipo: "magia", objetivo: "e", rampa });
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
  if (p.alma === 0 && p.raza === "semiorco" && !p.fl.aguante) { p.fl.aguante = true; p.alma = 1; t += `. ${p.nombre} se niega a caer y aguanta con 1 de Alma`; }
  else if (p.alma === 0) t += `. ¡${p.nombre} cae!`;
  if (directo && p.raza === "tiefling" && c) {
    c.hp = Math.max(0, c.hp - 2);
    fx({ tipo: "numero", objetivo: "e", texto: "-2", color: RP.fuego[3], fila: 1 });
    t += `. Su legado infernal le devuelve 2 de fuego`;
  }
  return t;
}

function accion(tipo, arg) {
  if (ocupado || !S.combate || S.combate.enemigoActua || !puedoActuar()) return;
  const c = S.combate, e = ENEMIGOS[c.enemigo], p = S.players[S.turno], yo = "h" + S.turno, cl = CLASES[p.clase];
  const arma = obj(p.equipo.arma) || {};
  const fin = () => { submenu = null; if (c.hp <= 0) return victoria(); avanzar(); prepararTurno(); };

  if (tipo === "golpear" || tipo === "refutar") {
    const clase = tipo === "golpear" ? "fisica" : "dialectica";
    const st = tipo === "golpear" ? "ani" : stat(p, "raz") >= stat(p, "elo") ? "raz" : "elo";
    const mod = stat(p, st) + (arma.golpe || 0) + (clase === "fisica" && p.clase === "cazadora" ? 2 : 0);
    const bono = usarOlivo(), pen = cegueraDe(p);
    const { r, nota } = tiradaD20(p);
    tirarDado(r, 20, () => {
      const total = r + mod + bono + pen;
      const crit = r >= critMin(p);
      const ok = crit || (r !== 1 && total >= e.ca);
      let linea = lineaTirada(p.nombre, tipo === "golpear" ? "golpea" : "refuta", r, mod, bono, pen, total, `CA ${e.ca}`, crit) + nota;
      fx({ tipo: "ataque", actor: yo });
      if (ok) {
        const base = tirar(crit ? 2 : 1, 8, stat(p, st)) + (clase === "fisica" ? arma.fis || 0 : arma.dial || 0);
        linea += ` → ${danarRival(base, clase, crit)}`;
        log(linea, "ok"); mostrarTirada(linea, true);
      } else {
        linea += " → falla";
        fx({ tipo: "numero", objetivo: "e", texto: "FALLO", color: RP.hueso[3] });
        log(linea, "ko"); mostrarTirada(linea, false);
      }
      fin();
    });
    return;
  }
  if (tipo === "meditar") {
    const bono = usarOlivo(), pen = cegueraDe(p);
    const { r, nota } = tiradaD20(p);
    tirarDado(r, 20, () => {
      const o = masHerido(), mod = stat(p, "tem");
      const ok = r >= critMin(p) || (r !== 1 && r + mod + bono + pen >= 10);
      let cura = ok ? Math.max(1, d(6) + mod) + (arma.cura || 0) : 1;
      if (p.clase === "oraculo") cura *= 2;
      const real = curar(o, cura), oi = idx(o);
      const t = `${p.nombre} medita (TEM ${r} ${fmt(mod)}${bono ? " +2" : ""}${pen ? " −4" : ""} contra CD 10)${nota} y ${o === p ? "recupera" : "devuelve a " + o.nombre} ${real} de Alma`;
      fx({ tipo: "cura", objetivo: "h" + oi }); fx({ tipo: "numero", objetivo: "h" + oi, texto: "+" + real, color: RP.hoja[4] });
      log(t, ok ? "ok" : "ko"); mostrarTirada(t, ok);
      fin();
    });
    return;
  }
  if (tipo === "objeto") {
    if (!S.zurron[arg] || arg === "olivo") return;
    S.zurron[arg]--;
    if (arg === "nectar" || arg === "ambrosia") {
      const o = masHerido(), oi = idx(o), base = arg === "nectar" ? 8 : maxAlma(o);
      const real = curar(o, o.raza === "satiro" ? base * 2 : base);
      fx({ tipo: "cura", objetivo: "h" + oi }); fx({ tipo: "numero", objetivo: "h" + oi, texto: "+" + real, color: RP.hoja[4] });
      log(`${p.nombre} da ${OBJETOS[arg].nombre.toLowerCase()} a ${o.nombre}: +${real} Alma.`, "ok");
    }
    if (arg === "fuego") { fx({ tipo: "ataque", actor: yo }); log(`${p.nombre} lanza fuego griego → ${danarRival(tirar(3, 6), "magica", false, 1, RP.fuego)}`, "ok"); }
    if (arg === "leteo") { c.aturdido = true; log(`${p.nombre} le hace beber agua del Leteo a ${e.nombre}, que olvida lo que iba a hacer.`, "ok"); }
    return fin();
  }
  if (tipo === "anillo") {
    if (!S.anillo || c.anilloUsado) return;
    c.anilloUsado = true; c.aturdido = true;
    log(`${p.nombre} gira el Anillo de Giges y desaparece. ${e.nombre} no sabe a quién atacar.`, "ok");
    return fin();
  }
  if (tipo === "habilidad") {
    if (p.usos <= 0) return;
    p.usos--;
    fx({ tipo: "ataque", actor: yo });
    switch (p.clase) {
      case "filosofo": log(`${p.nombre} usa la ${cl.hab}: «Solo sé que no sé nada... ¿y tú?» → ${danarRival(tirar(2, 6, stat(p, "raz")), "dialectica", false)}`, "ok"); break;
      case "atleta": log(`${p.nombre} se lanza al ${cl.hab} → ${danarRival(tirar(2, 8, stat(p, "ani")), "fisica", false)}`, "ok"); break;
      case "oraculo": log(`${p.nombre} invoca la ${cl.hab} → ${danarRival(tirar(2, 6, stat(p, "tem")), "magica", false, e.sombra ? 2 : 1, RP.bronce)}`, "ok"); break;
      case "cazadora": {
        const a1 = danarRival(tirar(1, 6, stat(p, "ani")) + (arma.fis || 0), "fisica", false);
        const a2 = c.hp > 0 ? danarRival(tirar(1, 6, stat(p, "ani")) + (arma.fis || 0), "fisica", false) : "nada más, ya no hace falta";
        log(`${p.nombre} suelta una ${cl.hab}: ${a1} y ${a2}`, "ok");
        break;
      }
      case "guardian": c.escudo = true; log(`${p.nombre} alza el ${cl.hab}. El próximo turno del enemigo no hará daño.`, "ok"); break;
      case "sofista": c.aturdido = true; log(`${p.nombre} plantea la ${cl.hab}: Aquiles nunca alcanzará a la tortuga. ${e.nombre} se queda pensando.`, "ok"); break;
      case "rapsoda": {
        const n = Math.max(1, tirar(1, 6, stat(p, "elo")) + (arma.cura || 0));
        S.players.forEach((x, i) => { curar(x, n); fx({ tipo: "cura", objetivo: "h" + i }); });
        log(`${p.nombre} entona el ${cl.hab}: todo el grupo recupera ${n} de Alma.`, "ok");
        break;
      }
      case "hechicero": c.maldito = true; fx({ tipo: "magia", objetivo: "e" }); log(`${p.nombre} lanza la ${cl.hab}. ${e.nombre} queda maldito: cada golpe le hará 2 de daño más.`, "ok"); break;
    }
    return fin();
  }
}

function heroeAlAzarVivo(sinElfos) {
  const lista = vivos().filter(i => !(sinElfos && S.players[i].raza === "elfo"));
  return lista.length ? lista[Math.floor(Math.random() * lista.length)] : -1;
}
function turnoEnemigo() {
  const c = S.combate, e = ENEMIGOS[c.enemigo];
  c.enemigoActua = true;
  ocupado = true; document.body.classList.add("ocupado");
  render();
  setTimeout(() => {
    if (c.aturdido) { log(`${e.nombre} pierde su turno.`, "ok"); c.aturdido = false; }
    else {
      const cada = n => c.ronda % n === 0;
      if (e.rasgo === "reafirmarse" && cada(2)) { c.hp = Math.min(c.hpMax, c.hp + 5); log(`${e.nombre} grita todavía más fuerte y recupera 5 de Alma.`, "ko"); fx({ tipo: "cura", objetivo: "e" }); }
      if (e.rasgo === "cambiar" && cada(2)) { const r0 = c.resiste; c.resiste = c.debil; c.debil = r0; log(`${e.nombre} cambia de forma: ahora resiste ${TIPOS_DANO[c.resiste]} y le duelen los ${TIPOS_DANO[c.debil]}.`, "ko"); fx({ tipo: "magia", objetivo: "e", rampa: RP.sombra }); }
      if (e.rasgo === "partirse" && !c.partido && c.hp <= c.hpMax / 2) { c.partido = true; log(`${e.nombre} se enfurece: sus dos mitades atacan por separado.`, "ko"); }
      if (c.escudo) { log(`${e.nombre} ataca, pero el Escudo de la Polis lo detiene todo.`, "ok"); c.escudo = false; }
      else {
        const n = c.ataques + (c.partido ? 1 : 0);
        fx({ tipo: "ataque", actor: "e" });
        for (let k = 0; k < n; k++) {
          const ti = heroeAlAzarVivo(false);
          if (ti < 0) break;
          const t = S.players[ti];
          if (t.clase === "atleta" && !t.fl.reflejos) { t.fl.reflejos = true; log(`${e.nombre} ataca a ${t.nombre}, que lo esquiva sin mirar (reflejos olímpicos).`, "ok"); fx({ tipo: "numero", objetivo: "h" + ti, texto: "FALLO", color: RP.hueso[3] }); continue; }
          const r = d(20), def = ca(t);
          const ok = r === 20 || (r !== 1 && r + e.atk >= def);
          mostrarTirada.ultimo = r;
          if (ok) {
            const dmg = Math.max(1, tirar(e.dano[0] * (r === 20 ? 2 : 1), e.dano[1], e.dano[2]) - (c.blando ? 2 : 0));
            let txt = `${e.nombre} ataca a ${t.nombre}: ${r} ${fmt(e.atk)} contra CA ${def} → ${danarHeroe(ti, dmg, true)}`;
            if (e.rasgo === "drenar") { const cu = Math.max(1, Math.floor(dmg / 2)); c.hp = Math.min(c.hpMax, c.hp + cu); txt += `. Se cura ${cu}`; }
            if (e.rasgo === "robar" && t.dracmas > 0) { const rob = Math.min(5, t.dracmas); t.dracmas -= rob; c.robado[ti] = (c.robado[ti] || 0) + rob; txt += `. Le roba ${rob} dracmas`; }
            log(txt, "ko"); mostrarTirada(txt, false);
          } else {
            const txt = `${e.nombre} ataca a ${t.nombre}: ${r} ${fmt(e.atk)} contra CA ${def} → falla`;
            fx({ tipo: "numero", objetivo: "h" + ti, texto: "FALLO", color: RP.hueso[3] });
            log(txt, "ok"); mostrarTirada(txt, true);
          }
        }
        if ((e.rasgo === "vapor" || e.rasgo === "sismo") && cada(3)) {
          const dado = e.rasgo === "vapor" ? 4 : 6;
          const partes = vivos().map(i => `${S.players[i].nombre} ${danarHeroe(i, d(dado), false).split(".")[0]}`);
          log(`${e.rasgo === "vapor" ? `${e.nombre} suelta un chorro de vapor hirviente` : `${e.nombre} golpea el suelo y todo tiembla`}: ${partes.join(", ")}.`, "ko");
        }
        if ((e.rasgo === "cegar" || e.rasgo === "petrificar") && cada(2)) {
          const ti = heroeAlAzarVivo(false);
          if (ti >= 0) {
            const t = S.players[ti];
            if (t.raza === "elfo") log(`${e.nombre} intenta ${e.rasgo === "cegar" ? "cegar" : "petrificar"} a ${t.nombre}, pero su ascendencia feérica le protege.`, "ok");
            else if (e.rasgo === "cegar") { t.est.cegado = 1; log(`${e.nombre} proyecta una sombra en los ojos de ${t.nombre}: −4 a su próxima tirada.`, "ko"); }
            else { t.est.petrificado = 1; log(`La mirada de ${e.nombre} convierte a ${t.nombre} en piedra durante un turno.`, "ko"); fx({ tipo: "golpe", objetivo: "h" + ti }); }
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
  const sc = ESCENAS[S.escena], c = S.combate, e = ENEMIGOS[c.enemigo];
  fx({ tipo: "muerte", objetivo: "e" });
  const extra = [];
  let robado = 0;
  S.players.forEach((p, i) => { if (c.robado[i]) { p.dracmas += c.robado[i]; robado += c.robado[i]; } });
  if (robado) extra.push(`Recuperáis ${robado} dracmas robadas`);
  S.players.forEach(p => { if (p.alma <= 0) p.alma = 1; p.est = { aturdido: 0, cegado: 0, petrificado: 0 }; });
  if (S.players.some(p => p.clase === "rapsoda")) { S.players.forEach(p => curar(p, 3)); extra.push("Épica del rapsoda: +3 Alma para el grupo"); }
  S.players.forEach(p => { if (p.clase === "hechicero") { curar(p, 4); extra.push(`Pacto con Hécate: +4 Alma para ${p.nombre}`); } });
  S.combate = null;
  const efectos = aplicarFx(sc.victoria.fx).concat(extra);
  S.fase = "resultado";
  S.resultado = { ok: true, tipo: "victoria", enemigo: c.enemigo, linea: null, texto: sc.victoria.t, efectos, siguiente: sc.sig };
  log(`¡${e.nombre} ha sido derrotado!`, "ok");
  guardar(); render();
}
function derrota() {
  S.derrota = true;
  log("Todo el grupo ha caído.", "ko");
  guardar(); render();
}

/* ---------- Pantalla de la taberna: creación de personajes y salas ---------- */
function grupoEditor() { return borrador.modo === "online" ? borrador.mios : borrador.local; }

function renderTaberna() {
  const online = borrador.modo === "online";
  $("#modos").innerHTML = `
    <button type="button" role="tab" data-modo="local" aria-selected="${!online}">Este dispositivo</button>
    <button type="button" role="tab" data-modo="online" aria-selected="${online}">Mesa en línea</button>`;
  const clave = online ? (mesa ? `sala-${mesa}` : `online-${red.listo}-${!!red.db}`) : "local";
  if (clave !== pantalla) {
    pantalla = clave;
    $("#taberna-cuerpo").innerHTML = online ? (mesa ? htmlSala() : htmlOnline()) : htmlLocal();
  }
  if (online && mesa) actualizarSala();
  if (online && !mesa) actualizarListaMesas();
  const editor = $("#editor");
  if (editor) editor.innerHTML = htmlEditor(grupoEditor());
  const plantel = $("#plantel");
  if (plantel) plantel.innerHTML = htmlPlantel(grupoEditor(), online ? 3 : 6);
  pintarRetratos();
  if (!escTaberna) {
    const caja = $("#caja-taberna");
    escTaberna = ESCENARIO.crear($("#lienzo-taberna"), { observar: $("#taberna"), limites: () => [caja.clientWidth - 12, Math.min(340, Math.max(170, window.innerWidth * 0.31))] });
  }
  escTaberna.ajustar();
  const heroes = online && mesa ? heroesSentados() : grupoEditor().heroes;
  escTaberna.mostrar({ fondo: "taberna", heroes: heroes.slice(0, 6).map(h => ({ look: Object.assign({ raza: h.raza, clase: h.clase }, h.look) })), rival: { tipo: "pnj", clave: "cefalo" }, activo: online && mesa ? -1 : grupoEditor().sel });
}

function htmlLocal() {
  const guardada = cargar();
  return `
    <div class="creacion">
      <aside class="plantel marco" id="plantel" aria-label="Vuestro grupo"></aside>
      <section class="editor marco" id="editor" aria-label="Ficha del héroe"></section>
    </div>
    <div class="arranque">
      ${guardada && !guardada.final ? `<button type="button" class="boton sec" data-acc="cargar">Continuar la partida guardada (${esc(CAPITULOS[ESCENAS[guardada.escena].cap])})</button>` : ""}
      <button type="button" class="boton grande" data-acc="comenzar-local">Comenzar la aventura</button>
    </div>
    ${htmlReglas()}`;
}
function htmlReglas() {
  return `
    <details class="reglas marco">
      <summary>Cómo se juega</summary>
      <ul>
        <li><b>Por turnos.</b> Cada escena la decide un héroe y el turno va pasando. En los enigmas, discutidlo antes de responder.</li>
        <li><b>Tiradas.</b> d20 + atributo contra una Clase de Dificultad (CD). Un 20 natural es un crítico y un 1, una pifia.</li>
        <li><b>Combate.</b> Al empezar se tira iniciativa (d20 + Templanza). Golpear usa Ánimo y hace daño físico; Refutar usa tu mejor Razón o Elocuencia y hace daño dialéctico. Para acertar hay que igualar la Clase de Armadura (CA) del enemigo.</li>
        <li><b>Habilidades.</b> Cada clase tiene una habilidad activa (una vez por combate, dos desde el nivel 3) y una pasiva. Cada raza tiene otra pasiva.</li>
        <li><b>Tiendas.</b> En el Ágora, en el Banquete, en el Pireo y en el Mundo de las Ideas cada héroe compra con sus propias dracmas.</li>
        <li><b>Alma</b> es la vida. Si cae todo el grupo, podéis reencarnar al inicio del capítulo, como en el mito de Er.</li>
      </ul>
    </details>`;
}
function htmlPlantel(g, max) {
  const filas = g.heroes.map((h, i) => `
    <li class="plantel-fila${i === g.sel ? " sel" : ""}">
      <button type="button" class="plantel-heroe" data-sel="${i}" aria-pressed="${i === g.sel}">
        <canvas class="mini" data-look='${esc(JSON.stringify(Object.assign({ raza: h.raza, clase: h.clase }, h.look)))}'></canvas>
        <span><strong>${esc(h.nombre || "Sin nombre")}</strong><span class="etiqueta">${RAZAS[h.raza].nombre} · ${CLASES[h.clase].nombre}</span></span>
      </button>
      ${g.heroes.length > 1 ? `<button type="button" class="quitar" data-quitar="${i}" aria-label="Quitar a ${esc(h.nombre)}">×</button>` : ""}
    </li>`).join("");
  return `<h3>Vuestro grupo <span class="etiqueta">${g.heroes.length} de ${max}</span></h3>
    <ol class="plantel-lista">${filas}</ol>
    ${g.heroes.length < max ? `<button type="button" class="boton sec mini" data-acc="anadir">Añadir héroe</button>` : ""}`;
}
function htmlEditor(g) {
  const h = g.heroes[g.sel];
  if (!h) return "";
  const vis = HEROES.RAZAS[h.raza], rz = RAZAS[h.raza], cl = CLASES[h.clase];
  const { p, ca: caP } = vistaPrevia(h);
  const look = Object.assign({ raza: h.raza, clase: h.clase }, h.look);
  const opRaza = Object.keys(RAZAS).map(k => `
    <button type="button" class="opcion-ficha" data-ed="raza" data-valor="${k}" aria-pressed="${k === h.raza}">
      <canvas class="mini" data-look='${esc(JSON.stringify(Object.assign({}, look, { raza: k, piel: HEROES.RAZAS[k].pieles.includes(look.piel) ? look.piel : HEROES.RAZAS[k].pieles[0], pelo: HEROES.RAZAS[k].pelos.includes(look.pelo) ? look.pelo : HEROES.RAZAS[k].pelos[0] })))}'></canvas>
      <span>${RAZAS[k].nombre}</span></button>`).join("");
  const opClase = Object.keys(CLASES).map(k => `
    <button type="button" class="opcion-ficha" data-ed="clase" data-valor="${k}" aria-pressed="${k === h.clase}">
      <canvas class="mini" data-look='${esc(JSON.stringify(Object.assign({}, look, { clase: k, tela: h.look.tela === HEROES.TELA_CLASE[h.clase] ? HEROES.TELA_CLASE[k] : h.look.tela })))}'></canvas>
      <span>${CLASES[k].nombre}</span></button>`).join("");
  const opAlin = ORDEN_ALIN.map(k => `<button type="button" class="alin" data-ed="alin" data-valor="${k}" aria-pressed="${k === h.alin}">${ALINEAMIENTOS[k]}</button>`).join("");
  const muestras = (campo, lista, rampas) => lista.map(k => `<button type="button" class="muestra" data-ed="look.${campo}" data-valor="${k}" aria-pressed="${h.look[campo] === k}" aria-label="${k}" style="--c1:${rampas[k][3]};--c2:${rampas[k][1]}"></button>`).join("");
  const statsHtml = Object.keys(STATS).map(k => {
    const mr = rz.mods[k] || 0;
    return `<div><b>${fmt(p.base[k])}</b><span>${ABREV[k]}</span>${mr ? `<small>${fmt(mr)} raza</small>` : "<small>&nbsp;</small>"}</div>`;
  }).join("");
  return `
    <div class="ed-cabecera">
      <canvas class="retrato-grande" data-look='${esc(JSON.stringify(look))}'></canvas>
      <div class="ed-nombre">
        <label class="etiqueta" for="ed-nombre">Nombre</label>
        <div class="fila-nombre"><input id="ed-nombre" maxlength="24" value="${esc(h.nombre)}" autocomplete="off"><button type="button" class="boton sec mini" data-acc="nombre-azar">Al azar</button></div>
        <p class="ed-linea">${rz.nombre} · ${cl.nombre} <span class="etiqueta">(${cl.dnd})</span> · ${ALINEAMIENTOS[h.alin]}</p>
        <div class="ed-stats">${statsHtml}</div>
        <p class="ed-cifras">Alma ${p.almaBase} · CA ${caP} · Patrón: ${cl.patron}</p>
      </div>
    </div>
    <div class="ed-bloque">
      <h4>Raza</h4>
      <div class="rejilla-fichas">${opRaza}</div>
      <p class="ed-desc">${rz.lore} <b>${rz.pasiva}:</b> ${rz.pasivaDesc}</p>
    </div>
    <div class="ed-bloque">
      <h4>Clase</h4>
      <div class="rejilla-fichas">${opClase}</div>
      <p class="ed-desc">${cl.desc}</p>
      <dl class="habilidades">
        <dt>Habilidad · ${cl.hab}</dt><dd>${cl.habDesc} Una vez por combate (dos desde el nivel 3).</dd>
        <dt>Pasiva · ${cl.pasiva}</dt><dd>${cl.pasivaDesc}</dd>
      </dl>
    </div>
    <div class="ed-bloque">
      <h4>Alineamiento</h4>
      <div class="rejilla-alin">${opAlin}</div>
    </div>
    <div class="ed-bloque">
      <h4>Aspecto</h4>
      <div class="aspecto">
        <span class="etiqueta">Piel</span><div class="muestras">${muestras("piel", vis.pieles, RP.piel)}</div>
        ${vis.pelos.length ? `<span class="etiqueta">Pelo</span><div class="muestras">${muestras("pelo", vis.pelos, RP.pelo)}</div>` : ""}
        <span class="etiqueta">Ropa</span><div class="muestras">${muestras("tela", HEROES.TELAS, RP.tela)}</div>
        ${vis.pelos.length ? `<span class="etiqueta">Peinado</span><div class="muestras">${HEROES.PEINADOS.map(k => `<button type="button" class="peinado" data-ed="look.peinado" data-valor="${k}" aria-pressed="${h.look.peinado === k}">${k}</button>`).join("")}${vis.barba ? "" : `<button type="button" class="peinado" data-ed="look.barba" data-valor="${!h.look.barba}" aria-pressed="${!!h.look.barba}">barba</button>`}</div>` : ""}
      </div>
    </div>`;
}
function pintarRetratos(raiz = document) {
  raiz.querySelectorAll("canvas[data-look]").forEach(cv => { try { ESCENARIO.retrato(cv, JSON.parse(cv.dataset.look)); } catch (e) {} });
  raiz.querySelectorAll("canvas[data-rival]").forEach(cv => { const [t, k] = cv.dataset.rival.split(":"); ESCENARIO.retratoRival(cv, t, k); });
}
function editar(campo, valor) {
  const g = grupoEditor(), h = g.heroes[g.sel];
  if (!h) return;
  if (campo === "raza") {
    h.raza = valor;
    const vis = HEROES.RAZAS[valor];
    if (!vis.pieles.includes(h.look.piel)) h.look.piel = vis.pieles[0];
    if (vis.pelos.length && !vis.pelos.includes(h.look.pelo)) h.look.pelo = vis.pelos[0];
  } else if (campo === "clase") {
    if (h.look.tela === HEROES.TELA_CLASE[h.clase]) h.look.tela = HEROES.TELA_CLASE[valor];
    h.clase = valor;
  } else if (campo === "alin") h.alin = valor;
  else if (campo.startsWith("look.")) {
    const k = campo.slice(5);
    h.look[k] = k === "barba" ? valor === "true" : valor;
  }
  renderTaberna();
}

function htmlOnline() {
  if (!red.listo) return `<p class="espera">Conectando con las mesas…</p>`;
  if (!red.db || !red.yo) return `<p class="aviso-fijo marco">Las mesas en línea funcionan al abrir el juego en claude.ai con la sesión iniciada. Mientras tanto podéis jugar todos en este dispositivo.</p>`;
  return `
    <div class="online">
      <div class="bloque marco">
        <h3>Crear una mesa</h3>
        <p>Serás el anfitrión. Tus amigos entran con el código y cada uno juega su héroe desde su móvil.</p>
        <button type="button" class="boton" data-acc="crear">Crear mesa nueva</button>
      </div>
      <form class="bloque marco" id="form-unirse">
        <h3>Entrar con un código</h3>
        <div class="unirse">
          <input id="codigo-mesa" maxlength="4" autocomplete="off" spellcheck="false" placeholder="ABCD" aria-label="Código de la mesa">
          <button type="submit" class="boton sec">Entrar</button>
        </div>
      </form>
      <div class="bloque marco">
        <h3>Mesas abiertas</h3>
        <div id="lista-mesas" class="mesas"></div>
      </div>
    </div>
    ${htmlReglas()}`;
}
function actualizarListaMesas() {
  const el = $("#lista-mesas");
  if (!el) return;
  if (!red.mesas.length) { el.innerHTML = `<p class="espera">No hay mesas abiertas. Crea una y comparte el código.</p>`; return; }
  el.innerHTML = red.mesas.map(m => {
    const min = Math.max(1, Math.round((Date.now() - (m.creada || 0)) / 60000));
    const hace = min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`;
    const estado = m.estado === "jugando" ? `Jugando · capítulo ${ROMANOS[m.capitulo || 0]} · ${m.jugadores} héroes` : "En la sala, esperando";
    return `<div class="mesa-fila"><b>${esc(m.codigo)}</b><span>${estado} · creada ${hace}</span>
      <button type="button" class="boton sec mini" data-unirse="${esc(m.codigo)}">Entrar</button></div>`;
  }).join("");
}
function htmlSala() {
  return `
    <div class="sala">
      <div class="sala-info marco">
        <p class="etiqueta">Código de la mesa</p>
        <p class="codigo">${esc(mesa)}</p>
        <p>Pasa este código a tus amigos. Tienen que abrir este mismo juego en claude.ai, elegir «Mesa en línea» y escribirlo.</p>
        <div id="sala-asientos" class="asientos"></div>
        <div id="sala-acciones" class="acciones-sala"></div>
      </div>
      <div class="creacion">
        <aside class="plantel marco" id="plantel" aria-label="Tus héroes"></aside>
        <section class="editor marco" id="editor" aria-label="Ficha del héroe"></section>
      </div>
    </div>`;
}
function actualizarSala() {
  const lista = $("#sala-asientos"), acc = $("#sala-acciones");
  if (!lista) return;
  const anfitrion = red.info && red.info.anfitrion;
  const heroes = heroesSentados();
  lista.innerHTML = heroes.length ? heroes.map(h => {
    const etiquetas = [`${RAZAS[h.raza] ? RAZAS[h.raza].nombre : ""} ${CLASES[h.clase] ? CLASES[h.clase].nombre.toLowerCase() : ""}`, h.uid === red.yo ? "tú" : "", h.uid === anfitrion ? "anfitrión" : ""].filter(Boolean).join(" · ");
    const on = red.enLinea.has(h.uid) || h.uid === red.yo;
    return `<div class="asiento"><canvas class="mini" data-look='${esc(JSON.stringify(Object.assign({ raza: h.raza, clase: h.clase }, h.look)))}'></canvas>
      <div><strong>${esc(h.nombre)}</strong><span class="etiqueta">${esc(etiquetas)}</span></div>
      <span class="punto${on ? " on" : ""}" title="${on ? "Conectado" : "Sin conexión"}"></span></div>`;
  }).join("") : `<p class="espera">Todavía no se ha sentado nadie.</p>`;
  const sentado = red.asientos.some(a => a.uid === red.yo);
  const extra = heroes.length > 6 ? `<p class="espera">Hay ${heroes.length} héroes: solo jugarán los 6 primeros.</p>` : "";
  acc.innerHTML = `<button type="button" class="boton" data-acc="sentarse">${sentado ? "Actualizar mis héroes" : "Sentarme a la mesa"}</button>`
    + (esAnfitrion()
      ? `<button type="button" class="boton grande" data-acc="comenzar-online" ${heroes.length ? "" : "disabled"}>Comenzar con ${Math.min(6, heroes.length)} héroe${heroes.length === 1 ? "" : "s"}</button>`
      : `<p class="espera">Esperando a que el anfitrión empiece la partida.</p>`)
    + `<button type="button" class="boton sec" data-acc="salir">Salir de la mesa</button>` + extra;
  pintarRetratos(lista);
}

/* ---------- Pantalla de juego ---------- */
function render() {
  const enJuego = !!S;
  $("#taberna").hidden = enJuego; $("#juego").hidden = !enJuego;
  document.body.classList.toggle("jugando", enJuego);
  if (!enJuego) { renderTaberna(); return; }
  pantalla = "juego";
  if (!escJuego) escJuego = ESCENARIO.crear($("#lienzo"), { observar: $(".tablero"), limites: limitesJuego });
  escJuego.ajustar();
  if (!$("#dado").dataset.listo) { $("#dado").dataset.listo = "1"; ESCENARIO.dibujarDado($("#dado"), 20); }
  renderCapitulos(); renderHerramientas(); sincronizarEscenario(); renderGrupo(); renderEscena(); renderCronica();
  if (modal) renderModal();
}
/* Espacio para el escenario: en móvil, una franja de ~30 % de la altura; en escritorio, lo que dejan libre
   el grupo y la mesa de dados en la columna izquierda. */
function limitesJuego() {
  const tablero = $(".tablero"), izq = $(".izquierda");
  if (window.matchMedia("(max-width: 760px)").matches) return [tablero.clientWidth - 12, Math.max(120, window.innerHeight * 0.3)];
  const grupo = $("#grupo");
  const bajo = window.innerHeight < 560;
  return [izq.clientWidth - 12, izq.clientHeight - grupo.offsetHeight - (bajo ? $(".mesa").offsetHeight + 4 : 150) - (bajo ? 22 : 32)];
}
function renderCapitulos() {
  const actual = ESCENAS[S.escena].cap;
  $("#capitulos").innerHTML = CAPITULOS.map((c, i) => {
    const cls = S.final || i < actual ? "hecho" : i === actual ? "actual" : "";
    return `<li class="${cls}" title="${c}"><b>${ROMANOS[i]}</b><span>${c}</span></li>`;
  }).join("");
}
function renderHerramientas() {
  const h = $("#herramientas");
  if (!S) { h.innerHTML = ""; return; }
  const chip = S.online ? `<span class="chip-mesa">Mesa <b>${esc(mesa || S.online.codigo)}</b> · ${S.players.filter(p => p.uid === red.yo || red.enLinea.has(p.uid)).length}/${S.players.length}</span>` : "";
  const salir = S.online
    ? (confirmando ? `<span class="confirmar"><span>La partida sigue para los demás.</span><button type="button" class="boton mini" data-acc="salir">Salir</button><button type="button" class="boton sec mini" data-acc="cancelar">Quedarme</button></span>` : `<button type="button" class="boton sec mini" data-acc="confirmar">Salir</button>`)
    : (confirmando ? `<span class="confirmar"><span>Se perderá la partida.</span><button type="button" class="boton mini" data-acc="reiniciar">Empezar de nuevo</button><button type="button" class="boton sec mini" data-acc="cancelar">Seguir</button></span>` : `<button type="button" class="boton sec mini" data-acc="confirmar">Nueva</button>`);
  h.innerHTML = `${chip}<button type="button" class="boton sec mini" data-modal="zurron">Zurrón</button><button type="button" class="boton sec mini" data-modal="codice">Códice</button>${salir}`;
}
function tipoRival(clave) { return typeof PNJ !== "undefined" && PNJ[clave] ? "pnj" : "enemigo"; }
function sincronizarEscenario() {
  const sc = ESCENAS[S.escena];
  let rival = null;
  if (S.combate) {
    const k = S.combate.enemigo;
    rival = { tipo: "enemigo", clave: k, hp: S.combate.hp, max: S.combate.hpMax, maldito: S.combate.maldito, aturdido: S.combate.aturdido, flota: k === "harpia" || k === "doxa" };
  } else if (S.resultado && S.resultado.tipo === "victoria") rival = { tipo: "enemigo", clave: S.resultado.enemigo, derrotado: true };
  else if (S.tienda) rival = { tipo: tipoRival(TIENDAS[S.tienda.clave].pnj), clave: TIENDAS[S.tienda.clave].pnj };
  else if (sc.pnj) rival = { tipo: tipoRival(sc.pnj), clave: sc.pnj };
  escJuego.mostrar({
    fondo: sc.fondo, rival, activo: S.final || S.derrota ? -1 : S.turno, esperaRival: !!(S.combate && S.combate.enemigoActua),
    heroes: S.players.map(p => ({ look: lookDe(p), caido: p.alma <= 0, aturdido: !!(p.est && p.est.aturdido), cegado: !!(p.est && p.est.cegado), piedra: !!(p.est && p.est.petrificado) }))
  });
}
function renderGrupo() {
  const enCombate = !!S.combate;
  $("#grupo").innerHTML = S.players.map((p, i) => {
    const activo = i === S.turno && !S.final && !S.derrota && !(S.combate && S.combate.enemigoActua);
    const max = maxAlma(p), pct = Math.round((100 * p.alma) / max);
    const on = S.online ? (p.uid === red.yo || red.enLinea.has(p.uid)) : null;
    const estados = [p.est && p.est.cegado ? "cegado" : "", p.est && p.est.aturdido ? "aturdido" : "", p.est && p.est.petrificado ? "de piedra" : ""].filter(Boolean).join(", ");
    return `
      <button type="button" class="heroe${activo ? " activo" : ""}${p.alma <= 0 ? " caido" : ""}${pct <= 30 && p.alma > 0 ? " grave" : ""}" data-ficha="${i}" aria-label="Ficha de ${esc(p.nombre)}">
        <canvas class="retrato" data-look='${esc(JSON.stringify(lookDe(p)))}'></canvas>
        <span class="heroe-datos">
          <strong>${esc(p.nombre)}${S.online && p.uid === red.yo ? ' <span class="tu">tú</span>' : ""}</strong>
          <span class="etiqueta">${CLASES[p.clase].nombre} · Nv ${p.nivel}${enCombate ? ` · ${p.usos} hab.` : ""}</span>
          <span class="barra-alma" role="img" aria-label="Alma ${p.alma} de ${max}"><i style="width:${pct}%"></i></span>
          <span class="cifras">${p.alma}/${max} · CA ${ca(p)}<span class="dr"> · ${p.dracmas} dr</span>${estados ? ` · ${estados}` : ""}</span>
        </span>
        ${on !== null ? `<span class="punto${on ? " on" : ""}" title="${on ? "Conectado" : "Sin conexión"}"></span>` : ""}
      </button>`;
  }).join("");
  pintarRetratos($("#grupo"));
}
const parrafos = arr => `<div class="texto">${arr.map(t => `<p>${t}</p>`).join("")}</div>`;
const cabeceraEscena = sc => `<p class="etiqueta">Capítulo ${ROMANOS[sc.cap]} · ${CAPITULOS[sc.cap]}</p><h2>${sc.titulo}</h2>`;
function boton(attrs, titulo, chip, sub, off) {
  return `<li><button type="button" class="opcion" ${attrs}${off ? " disabled" : ""}><span class="cursor" aria-hidden="true">▸</span><span class="op-txt">${titulo}${sub ? `<small>${sub}</small>` : ""}</span>${chip ? `<span class="chip">${chip}</span>` : ""}</button></li>`;
}

function renderEscena() {
  const sc = ESCENAS[S.escena], p = S.players[S.turno], cl = CLASES[p.clase];
  const el = $("#escena");
  /* En móvil se oculta el texto de ambientación cuando ya se ha leído (ver estilo.css). */
  el.dataset.leido = (S.combate && S.combate.ronda > 1) || (S.tienda && S.tienda.pos > 0) ? "1" : "";
  if (S.final) {
    const f = FINALES[S.final];
    const epi = S.players.map(x => `<li><b>${esc(x.nombre)}</b>, ${nombreRazaClase(x).toLowerCase()} de nivel ${x.nivel} (${ALINEAMIENTOS[x.alin].toLowerCase()}), ${EPILOGOS[D.ejesAlin(x.alin)[1]]}</li>`).join("");
    el.innerHTML = `<p class="etiqueta">Fin de la aventura</p><h2>${f.titulo}</h2>${parrafos(f.texto)}<ul class="epilogo">${epi}</ul>
      <div class="pie-escena">${!S.online ? `<button type="button" class="boton" data-acc="reiniciar">Jugar otra vez</button>`
        : esAnfitrion() ? `<button type="button" class="boton" data-acc="volver-sala">Volver a la sala con el grupo</button><button type="button" class="boton sec" data-acc="salir">Salir de la mesa</button>`
        : `<p class="espera">El anfitrión puede llevaros de vuelta a la sala para otra partida.</p><button type="button" class="boton sec" data-acc="salir">Salir de la mesa</button>`}</div>`;
    return;
  }
  if (S.derrota) {
    el.innerHTML = `${cabeceraEscena(sc)}<h3 class="sello ko">Descenso al Hades</h3>
      ${parrafos(["Vuestras almas cruzan el río del Olvido. Pero, como cuenta el soldado Er, las almas pueden elegir una nueva vida antes de volver."])}
      <div class="pie-escena">${esAnfitrion() ? `<button type="button" class="boton" data-acc="reencarnar">Reencarnar al inicio del capítulo</button>
        ${S.online ? `<button type="button" class="boton sec" data-acc="volver-sala">Volver a la sala</button>` : `<button type="button" class="boton sec" data-acc="reiniciar">Empezar desde la caverna</button>`}`
        : `<p class="espera">El anfitrión decide si reencarnáis.</p>`}</div>`;
    return;
  }
  const mio = puedoActuar(), off = !mio;
  const quien = mio
    ? `<p class="quien">Decide <b>${esc(p.nombre)}</b> · ${nombreRazaClase(p)}${S.olivoActivo && S.zurron.olivo > 0 ? " · la rama de olivo dará +2" : ""}</p>`
    : `<p class="quien espera">Le toca a <b>${esc(p.nombre)}</b> (${nombreRazaClase(p)}). Esperando su decisión en su dispositivo…</p>`;

  if (S.fase === "resultado") {
    const r = S.resultado;
    const sello = r.tipo === "victoria" ? "Victoria" : r.tipo === "enigma" ? (r.ok ? "Correcto" : "Incorrecto") : r.linea ? (r.ok ? "Éxito" : "Fracaso") : "Decisión tomada";
    const siguiente = S.players[siguienteVivo(S.turno + 1)];
    el.innerHTML = `${cabeceraEscena(sc)}
      <p class="sello ${r.ok ? "ok" : "ko"}">${sello}</p>
      ${r.linea ? `<p class="linea-tirada">${esc(r.linea)}</p>` : ""}
      ${parrafos([r.texto])}
      ${r.efectos.length ? `<ul class="efectos">${r.efectos.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="pie-escena">${mio ? `<button type="button" class="boton" data-acc="continuar">Continuar · turno de ${esc(siguiente.nombre)}</button>` : `<p class="espera">${esc(p.nombre)} pasará el turno a ${esc(siguiente.nombre)}.</p>`}</div>`;
    return;
  }
  if (sc.tipo === "prueba") {
    el.innerHTML = `${cabeceraEscena(sc)}${parrafos(sc.texto)}${quien}<ul class="menu">${sc.opciones.map((op, i) => {
      let chip = "Sin tirada";
      if (op.stat) {
        const mod = stat(p, op.stat) + (op.stat === "raz" && p.clase === "filosofo" ? 2 : 0);
        chip = op.inmuneElfo && p.raza === "elfo" ? "Inmune" : `${ABREV[op.stat]} ${fmt(mod)} · CD ${op.cd}`;
      }
      return boton(`data-op="${i}"`, op.txt, chip, "", off);
    }).join("")}</ul>`;
  } else if (sc.tipo === "enigma") {
    const tachada = respuestaTachada(sc);
    el.innerHTML = `${cabeceraEscena(sc)}${parrafos(sc.texto)}
      ${mio ? `<p class="quien">Responde <b>${esc(p.nombre)}</b>. Aquí no hay dados: discutidlo antes.${tachada >= 0 ? " Gracias al filósofo del grupo, una respuesta falsa está tachada." : ""}</p>` : quien}
      <ul class="menu">${sc.respuestas.map((t, i) => boton(`data-resp="${i}"${i === tachada ? ' data-tachada="1"' : ""}`, i === tachada ? `<s>${t}</s>` : t, "", "", off || i === tachada)).join("")}</ul>`;
  } else if (sc.tipo === "relato") {
    el.innerHTML = `${cabeceraEscena(sc)}${parrafos(sc.texto)}
      <ul class="efectos">${sc.fx.curarTodo ? "<li>Alma restaurada por completo</li>" : ""}${sc.fx.almaTodos ? `<li>+${sc.fx.almaTodos} Alma para el grupo</li>` : ""}<li>+${sc.fx.xp} Sabiduría</li></ul>
      <div class="pie-escena">${mio ? `<button type="button" class="boton" data-acc="relato">${sc.boton}</button>` : quien}</div>`;
  } else if (sc.tipo === "final") {
    el.innerHTML = `${cabeceraEscena(sc)}${parrafos(sc.texto)}
      <p class="quien">Decidid entre todos. Esta elección cierra la partida${mio ? "" : ` y la marca ${esc(p.nombre)}`}.</p>
      <ul class="menu">${sc.opciones.map(op => boton(`data-final="${op.final}"`, op.txt, "", "", off)).join("")}</ul>`;
  } else if (sc.tipo === "tienda") renderTienda(el, sc, p, mio);
  else if (sc.tipo === "combate") renderCombate(el, sc, p, cl, mio);
}

function renderTienda(el, sc, p, mio) {
  const t = TIENDAS[S.tienda.clave];
  const items = t.objetos.map(id => {
    const o = OBJETOS[id], pr = precio(p, id);
    const equipado = o.tipo !== "consumible" && o.tipo !== "servicio" && p.equipo[o.tipo] === id;
    const actual = o.tipo !== "consumible" && o.tipo !== "servicio" ? p.equipo[o.tipo] : null;
    const sub = `${o.desc}${actual && !equipado ? ` Sustituye a ${OBJETOS[actual].nombre} (te devuelven ${Math.floor(OBJETOS[actual].precio / 2)}).` : ""}${o.tipo === "consumible" ? ` Tenéis ${S.zurron[id]}.` : ""}`;
    const tipo = o.tipo === "consumible" ? "Zurrón" : o.tipo === "servicio" ? "Servicio" : RANURAS[o.tipo];
    return boton(`data-comprar="${id}"`, `${o.nombre} <span class="etiqueta">${tipo}</span>`, equipado ? "Equipado" : `${pr} dr`, sub, !mio || equipado || p.dracmas < pr);
  }).join("");
  const resto = S.tienda.cola.slice(S.tienda.pos + 1).map(i => S.players[i].nombre);
  el.innerHTML = `${cabeceraEscena(sc)}${parrafos(sc.texto)}
    <p class="saludo"><b>${t.nombre}:</b> ${t.saludo}</p>
    ${mio ? `<p class="quien">Compra <b>${esc(p.nombre)}</b> con sus <b>${p.dracmas} dracmas</b>${p.clase === "sofista" ? " (lengua de plata: −25 %)" : ""}.</p>` : `<p class="quien espera">Está comprando <b>${esc(p.nombre)}</b> en su dispositivo…</p>`}
    <ul class="menu tienda">${items}</ul>
    <div class="pie-escena">${mio ? `<button type="button" class="boton" data-acc="terminar-compras">${resto.length ? `Terminar · le toca a ${esc(resto[0])}` : "Terminar las compras y seguir"}</button>` : ""}</div>`;
}

function renderCombate(el, sc, p, cl, mio) {
  const c = S.combate;
  if (!c) { el.innerHTML = cabeceraEscena(sc); return; }
  const e = ENEMIGOS[c.enemigo];
  const arma = obj(p.equipo.arma) || {};
  const refStat = stat(p, "raz") >= stat(p, "elo") ? "raz" : "elo";
  const modG = stat(p, "ani") + (arma.golpe || 0) + (p.clase === "cazadora" ? 2 : 0), modR = stat(p, refStat) + (arma.golpe || 0);
  const consumibles = ["nectar", "ambrosia", "fuego", "leteo"].filter(k => S.zurron[k] > 0);
  const orden = c.orden.map((a, k) => {
    const nombre = a.t === "e" ? e.nombre.split(",")[0] : S.players[a.i].nombre;
    const caido = a.t === "h" && S.players[a.i].alma <= 0;
    return `<li class="${k === c.pos ? "ahora" : ""}${caido ? " caido" : ""}${a.t === "e" ? " rival" : ""}">${esc(nombre)}</li>`;
  }).join("");
  const rasgos = [
    `<span>CA ${e.ca}</span>`, `<span>Alma ${c.hp}/${c.hpMax}</span>`,
    c.resiste ? `<span>Resiste ${TIPOS_DANO[c.resiste]}</span>` : "", c.debil ? `<span class="alerta">Débil a ${TIPOS_DANO[c.debil]}</span>` : "",
    c.maldito ? `<span class="alerta">Maldito</span>` : "", c.aturdido ? `<span class="alerta">Perderá su turno</span>` : "", c.escudo ? `<span class="alerta">Escudo de la Polis</span>` : ""
  ].join("");
  let menu;
  if (c.enemigoActua) menu = `<p class="quien espera"><b>${e.nombre}</b> contraataca…</p>`;
  else if (submenu === "objetos" && mio) {
    menu = `${quien(p, mio)}<ul class="menu">${consumibles.map(k => boton(`data-objeto="${k}"`, OBJETOS[k].nombre, `× ${S.zurron[k]}`, OBJETOS[k].desc, false)).join("")}${boton('data-acc="volver-menu"', "Volver", "", "", false)}</ul>`;
  } else {
    const acciones = [
      boton('data-accion="golpear"', "Golpear", `d20 ${fmt(modG)}`, `1d8 ${fmt(stat(p, "ani"))}${arma.fis ? ` +${arma.fis}` : ""} de daño físico`, !mio),
      boton('data-accion="refutar"', "Refutar", `d20 ${fmt(modR)}`, `1d8 ${fmt(stat(p, refStat))}${arma.dial ? ` +${arma.dial}` : ""} de daño dialéctico (${ABREV[refStat]})`, !mio),
      boton('data-accion="meditar"', "Meditar", `TEM ${fmt(stat(p, "tem"))}`, `Cura al más herido${p.clase === "oraculo" ? " (doble)" : ""}`, !mio),
      boton('data-accion="habilidad"', cl.hab, `${p.usos} uso${p.usos === 1 ? "" : "s"}`, cl.habDesc, !mio || p.usos <= 0),
      boton('data-acc="objetos"', "Objetos", `${consumibles.reduce((a, k) => a + S.zurron[k], 0)}`, consumibles.length ? consumibles.map(k => `${OBJETOS[k].nombre} ×${S.zurron[k]}`).join(", ") : "El zurrón está vacío", !mio || !consumibles.length),
      S.anillo ? boton('data-accion="anillo"', "Anillo de Giges", c.anilloUsado ? "usado" : "1 vez", "El enemigo pierde su turno", !mio || c.anilloUsado) : ""
    ];
    menu = `${quien(p, mio)}<ul class="menu acciones">${acciones.join("")}</ul>`;
  }
  el.innerHTML = `${cabeceraEscena(sc)}
    <div class="rival-info"><button type="button" class="rival-nombre" data-modal="bestia" data-bestia="${c.enemigo}">${e.nombre}</button><span class="etiqueta">${e.tipo} · VD ${e.vd} · ronda ${c.ronda}</span><div class="rasgos">${rasgos}</div><p class="rasgo-desc">${e.rasgoDesc}</p></div>
    <ol class="orden" aria-label="Orden de iniciativa">${orden}</ol>
    ${menu}`;
}
function quien(p, mio) {
  return mio
    ? `<p class="quien">Turno de <b>${esc(p.nombre)}</b> · ${nombreRazaClase(p)}${S.olivoActivo && S.zurron.olivo > 0 ? " · olivo +2 preparado" : ""}</p>`
    : `<p class="quien espera">Le toca a <b>${esc(p.nombre)}</b>. Esperando su decisión en su dispositivo…</p>`;
}
function renderCronica() {
  const ol = $("#cronica");
  ol.innerHTML = S.log.slice(-70).map(l => `<li class="${l.cls}">${esc(l.t)}</li>`).join("");
  ol.scrollTop = ol.scrollHeight;
}

/* ---------- Ventanas: ficha, zurrón, códice y crónica ---------- */
function abrirModal(m) { modal = m; renderModal(); $("#capa").hidden = false; const b = $("#modal button"); if (b) b.focus(); }
function cerrarModal() { modal = null; $("#capa").hidden = true; }
function renderModal() {
  if (!modal || !S && modal.tipo !== "codice") return cerrarModal();
  const el = $("#modal");
  let html = "";
  if (modal.tipo === "ficha") html = htmlFicha(S.players[modal.i]);
  if (modal.tipo === "zurron") html = htmlZurron();
  if (modal.tipo === "codice") html = htmlCodice(modal.pestana || "mundo", modal.bestia);
  if (modal.tipo === "cronica") html = `<h2>Crónica</h2><ol class="cronica-larga">${S.log.slice().reverse().map(l => `<li class="${l.cls}">${esc(l.t)}</li>`).join("")}</ol>`;
  el.innerHTML = `<button type="button" class="cerrar" data-acc="cerrar-modal" aria-label="Cerrar">×</button>${html}`;
  pintarRetratos(el);
}
function htmlFicha(p) {
  if (!p) return "";
  const rz = RAZAS[p.raza], cl = CLASES[p.clase], max = maxAlma(p);
  const sig = NIVELES[p.nivel] !== undefined ? NIVELES[p.nivel] : null;
  const equipo = Object.keys(RANURAS).map(k => `<li><span class="etiqueta">${RANURAS[k]}</span> ${p.equipo[k] ? `<b>${OBJETOS[p.equipo[k]].nombre}</b> · ${OBJETOS[p.equipo[k]].desc}` : "—"}</li>`).join("");
  return `
    <div class="ficha">
      <canvas class="retrato-grande" data-look='${esc(JSON.stringify(lookDe(p)))}'></canvas>
      <div>
        <h2>${esc(p.nombre)}</h2>
        <p class="ed-linea">${rz.nombre} · ${cl.nombre} <span class="etiqueta">(${cl.dnd})</span> · ${ALINEAMIENTOS[p.alin]}</p>
        <p class="ed-cifras">Nivel ${p.nivel} · Sabiduría ${p.xp}${sig !== null ? `/${sig}` : ""} · Alma ${p.alma}/${max} · CA ${ca(p)} · Iniciativa ${fmt(iniMod(p))} · ${p.dracmas} dracmas</p>
        <div class="ed-stats">${Object.keys(STATS).map(k => `<div><b>${fmt(stat(p, k))}</b><span>${ABREV[k]}</span><small>${STATS[k]}</small></div>`).join("")}</div>
      </div>
    </div>
    <dl class="habilidades">
      <dt>Habilidad · ${cl.hab}</dt><dd>${cl.habDesc} ${usosHab(p)} uso${usosHab(p) === 1 ? "" : "s"} por combate.</dd>
      <dt>Pasiva de clase · ${cl.pasiva}</dt><dd>${cl.pasivaDesc}</dd>
      <dt>Pasiva de raza · ${rz.pasiva}</dt><dd>${rz.pasivaDesc}</dd>
      <dt>Patrón</dt><dd>${cl.patron}. ${cl.desc}</dd>
    </dl>
    <h3>Equipo</h3><ul class="equipo">${equipo}</ul>`;
}
function htmlZurron() {
  const mio = puedoActuar() && !S.combate && !ocupado;
  const filas = CONSUMIBLES.map(k => {
    const n = S.zurron[k];
    let acciones = "";
    if (mio && n > 0 && (k === "nectar" || k === "ambrosia")) acciones = S.players.map((p, i) => p.alma < maxAlma(p) ? `<button type="button" class="boton sec mini" data-usar="${k}" data-en="${i}">${esc(p.nombre)}</button>` : "").join("");
    if (k === "olivo" && n > 0 && (puedoActuar())) acciones = `<button type="button" class="boton ${S.olivoActivo ? "" : "sec "}mini" data-acc="olivo" aria-pressed="${S.olivoActivo}">${S.olivoActivo ? "Preparada: +2" : "Usar en la próxima tirada"}</button>`;
    return `<li><div><b>${OBJETOS[k].nombre} × ${n}</b><span>${OBJETOS[k].desc}</span></div><div class="zurron-acciones">${acciones}</div></li>`;
  }).join("");
  return `<h2>Zurrón del grupo</h2>
    <ul class="zurron">${filas}${S.anillo ? `<li><div><b>Anillo de Giges</b><span>Una vez por combate: el enemigo pierde su turno.</span></div></li>` : ""}</ul>
    ${S.combate ? `<p class="espera">En combate, los objetos se usan desde el menú «Objetos» en tu turno.</p>` : !puedoActuar() ? `<p class="espera">Solo puede usar objetos quien tiene el turno.</p>` : ""}
    <h3>Bolsas</h3><ul class="bolsas">${S.players.map(p => `<li><b>${esc(p.nombre)}</b> ${p.dracmas} dracmas</li>`).join("")}</ul>`;
}
function htmlCodice(pestana, bestia) {
  const pestanas = { mundo: "Mundo", lugares: "Lugares", bestiario: "Bestiario", razas: "Razas", clases: "Clases" };
  const tabs = Object.keys(pestanas).map(k => `<button type="button" role="tab" data-pestana="${k}" aria-selected="${k === pestana}">${pestanas[k]}</button>`).join("");
  let cuerpo = "";
  if (pestana === "mundo") cuerpo = LORE.mundo.map(x => `<article><h3>${x.titulo}</h3>${x.texto.map(t => `<p>${t}</p>`).join("")}</article>`).join("");
  if (pestana === "lugares") cuerpo = Object.keys(LORE.lugares).map(k => {
    const visto = S && S.vistos.lugares.includes(+k);
    const l = LORE.lugares[k];
    return `<article><h3>${ROMANOS[k]} · ${visto ? l.titulo : "???"}</h3>${visto ? l.texto.map(t => `<p>${t}</p>`).join("") : "<p class=\"espera\">Todavía no habéis llegado.</p>"}</article>`;
  }).join("");
  if (pestana === "bestiario") cuerpo = Object.keys(ENEMIGOS).map(k => {
    const e = ENEMIGOS[k], visto = (S && S.vistos.bestias.includes(k)) || bestia === k;
    if (!visto) return `<article class="bestia"><canvas class="mini oculto" data-rival="${tipoRival(k)}:${k}"></canvas><div><h3>???</h3><p class="espera">Todavía no os habéis cruzado con esta criatura.</p></div></article>`;
    return `<article class="bestia${bestia === k ? " destacada" : ""}"><canvas class="mini" data-rival="enemigo:${k}"></canvas><div>
      <h3>${e.nombre}</h3><p class="etiqueta">${e.tipo}, ${e.alin.toLowerCase()} · VD ${e.vd}</p>
      <p class="bloque-stats">CA ${e.ca} · Alma ${e.alma} · Ataque ${fmt(e.atk)} · ${e.ataques} ataque${e.ataques > 1 ? "s" : ""} de ${e.dano[0]}d${e.dano[1]}${e.dano[2] ? fmt(e.dano[2]) : ""}${e.resiste ? ` · Resiste ${TIPOS_DANO[e.resiste]}` : ""}${e.debil ? ` · Débil a ${TIPOS_DANO[e.debil]}` : ""}</p>
      <p><b>${e.rasgoDesc}</b></p><p>${e.lore}</p></div></article>`;
  }).join("");
  if (pestana === "razas") cuerpo = Object.keys(RAZAS).map(k => { const r = RAZAS[k]; return `<article><h3>${r.nombre}</h3><p>${r.lore}</p><p><b>${r.pasiva}:</b> ${r.pasivaDesc}</p><p class="etiqueta">${Object.keys(r.mods).map(s => `${ABREV[s]} ${fmt(r.mods[s])}`).join(" · ")}${r.alma ? ` · Alma +${r.alma}` : ""}</p></article>`; }).join("");
  if (pestana === "clases") cuerpo = Object.keys(CLASES).map(k => { const c = CLASES[k]; return `<article><h3>${c.nombre} <span class="etiqueta">(${c.dnd})</span></h3><p>${c.desc} Patrón: ${c.patron}.</p><p><b>${c.hab}:</b> ${c.habDesc}</p><p><b>${c.pasiva}:</b> ${c.pasivaDesc}</p></article>`; }).join("");
  return `<h2>Códice de la Hélade</h2><div class="pestanas" role="tablist">${tabs}</div><div class="codice">${cuerpo}</div>`;
}

/* ---------- Eventos ---------- */
const DE_TURNO = new Set(["continuar", "relato", "terminar-compras", "objetos", "volver-menu"]);
document.addEventListener("click", ev => {
  const b = ev.target.closest("button");
  if (ev.target.id === "capa") return cerrarModal();
  if (!b || b.disabled) return;
  const ds = b.dataset;
  if (ds.modo) { borrador.modo = ds.modo; avisar(""); return render(); }
  if (ds.sel !== undefined) { grupoEditor().sel = +ds.sel; return renderTaberna(); }
  if (ds.quitar !== undefined) { const g = grupoEditor(); g.heroes.splice(+ds.quitar, 1); g.sel = Math.min(g.sel, g.heroes.length - 1); return renderTaberna(); }
  if (ds.ed) return editar(ds.ed, ds.valor);
  if (ds.unirse) return entrarMesa(ds.unirse);
  if (ds.ficha !== undefined) return abrirModal({ tipo: "ficha", i: +ds.ficha });
  if (ds.modal) return abrirModal({ tipo: ds.modal === "bestia" ? "codice" : ds.modal, pestana: ds.modal === "bestia" ? "bestiario" : null, bestia: ds.bestia });
  if (ds.pestana) { modal.pestana = ds.pestana; modal.bestia = null; return renderModal(); }
  if (ds.usar) { usarFuera(ds.usar, +ds.en); return renderModal(); }
  if (ds.libre) {
    if (ocupado) return;
    const caras = +ds.libre, r = d(caras);
    return tirarDado(r, caras, () => { mostrarTirada(`Tirada libre de d${caras}: ${r}`, undefined, false); if (S) { log(`Tirada libre de d${caras}: ${r}`); renderCronica(); } });
  }
  const juega = ds.op || ds.resp || ds.final || ds.accion || ds.objeto || ds.comprar || DE_TURNO.has(ds.acc);
  if (S && juega && !puedoActuar()) return;
  if (ds.op) return elegirOpcion(+ds.op);
  if (ds.resp) return responder(+ds.resp);
  if (ds.final) return elegirFinal(ds.final);
  if (ds.accion) return accion(ds.accion);
  if (ds.objeto) return accion("objeto", ds.objeto);
  if (ds.comprar) return comprar(ds.comprar);
  switch (ds.acc) {
    case "continuar": return continuar();
    case "relato": return continuarRelato();
    case "terminar-compras": return terminarCompras();
    case "objetos": submenu = "objetos"; return renderEscena();
    case "volver-menu": submenu = null; return renderEscena();
    case "olivo": if (puedoActuar()) { S.olivoActivo = !S.olivoActivo; guardar(); render(); } return;
    case "reencarnar": return esAnfitrion() && reencarnar();
    case "confirmar": confirmando = true; return renderHerramientas();
    case "cancelar": confirmando = false; return renderHerramientas();
    case "reiniciar": confirmando = false; S = null; borrar(); pantalla = ""; cerrarModal(); return render();
    case "cargar": S = cargar(); return arrancar();
    case "anadir": { const g = grupoEditor(); g.heroes.push(heroeAlAzar(g.heroes.length)); g.sel = g.heroes.length - 1; return renderTaberna(); }
    case "nombre-azar": { const g = grupoEditor(); g.heroes[g.sel].nombre = azarDe(NOMBRES); return renderTaberna(); }
    case "comenzar-local": return nuevaPartida(borrador.local.heroes);
    case "crear": return crearMesa();
    case "sentarse": return sentarse();
    case "comenzar-online": return comenzarEnLinea();
    case "salir": confirmando = false; cerrarModal(); return salirMesa();
    case "volver-sala": return volverASala();
    case "cerrar-modal": return cerrarModal();
    case "ver-cronica": return abrirModal({ tipo: "cronica" });
  }
});
document.addEventListener("input", ev => {
  if (ev.target.id !== "ed-nombre") return;
  const g = grupoEditor();
  g.heroes[g.sel].nombre = ev.target.value;
  const fila = document.querySelector(`.plantel-heroe[data-sel="${g.sel}"] strong`);
  if (fila) fila.textContent = ev.target.value || "Sin nombre";
});
document.addEventListener("submit", ev => {
  ev.preventDefault();
  if (ev.target.id === "form-unirse") {
    const c = ($("#codigo-mesa").value || "").trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(c)) return avisar("El código tiene 4 letras, por ejemplo KRTO.");
    return entrarMesa(c);
  }
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && modal) return cerrarModal();
  if (!S || modal || ocupado || ev.target.closest("input, textarea")) return;
  if (/^[1-9]$/.test(ev.key)) {
    const botones = $$("#escena .menu button:not([disabled])");
    const b = botones[+ev.key - 1];
    if (b) { ev.preventDefault(); b.click(); }
  } else if (ev.key === "Enter" && !ev.target.closest("button")) {
    const b = $("#escena .pie-escena .boton:not([disabled])");
    if (b) { ev.preventDefault(); b.click(); }
  }
});

function arrancar() {
  if (S && S.combate) {
    S.combate.enemigoActua = false;
    if (S.combate.orden[S.combate.pos].t === "e") { pantalla = ""; render(); return turnoEnemigo(); }
  }
  pantalla = ""; render();
}
render();
conectar();
})();
