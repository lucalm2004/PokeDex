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
/* Solo para pruebas automáticas: #prueba-rapido acelera las esperas. */
const RAPIDO = /rapido/.test(location.hash);
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

/* Bendiciones: mejoras permanentes para todo el grupo que se eligen (1 de 3) tras vencer a un jefe o a una élite. */
const BENDICIONES = {
  filo: { nombre: "Filo bendito", desc: "+2 al daño físico de todo el grupo." },
  arcano: { nombre: "Chispa arcana", desc: "+2 al daño mágico y sagrado." },
  vigor: { nombre: "Vigor de gigante", desc: "+6 PG máximos para todos, desde ya." },
  ojo: { nombre: "Ojo de halcón", desc: "+2 a todas las tiradas de ataque." },
  respiro: { nombre: "Segundo respiro", desc: "Tras cada victoria, todos recuperan un 30 % de sus PG." },
  primer: { nombre: "Emboscada", desc: "Al empezar cada combate, el enemigo recibe 2d6 de daño." },
  reservas: { nombre: "Reservas", desc: "+1 uso a todas las habilidades limitadas." },
  fortuna: { nombre: "Fortuna", desc: "+50 % de oro en cada recompensa." },
  piedra: { nombre: "Piel de piedra", desc: "Recibís 1 punto menos de daño por golpe." },
  pulso: { nombre: "Pulso firme", desc: "La zona perfecta del golpe certero es el doble de grande." },
  vampiro: { nombre: "Sed de sangre", desc: "Cada crítico cura 4 PG a quien lo hace." }
};
const tiene = k => !!(S && S.bendiciones && S.bendiciones.includes(k));
function ofrecerBendiciones() {
  const libres = Object.keys(BENDICIONES).filter(k => !S.bendiciones.includes(k));
  const oferta = [];
  while (oferta.length < (S.opcionesB || 3) && libres.length) oferta.push(libres.splice(Math.floor(Math.random() * libres.length), 1)[0]);
  S.ofertaB = oferta.length ? oferta : null;
}
function elegirBendicion(id) {
  if (!S.ofertaB || !S.ofertaB.includes(id)) return;
  S.bendiciones.push(id);
  if (id === "vigor") S.players.forEach(p => { p.almaBase += 6; p.alma += 6; });
  S.ofertaB = null;
  log(`Bendición: ${BENDICIONES[id].nombre}.`, "nivel");
  fx({ tipo: "nivel", texto: BENDICIONES[id].nombre, sub: "Nueva bendición" });
  guardar(); render();
}

/* ---------- Progreso entre partidas: runas, logros y mejoras (se guardan en cada móvil) ---------- */
const LOGROS = {
  trol: { nombre: "Matatroles", desc: "Vence al trol del puente." },
  liche: { nombre: "Rompefilacterias", desc: "Destruye a Malakar, el liche." },
  vampiro: { nombre: "Alba roja", desc: "Acaba con Lord Varkhul." },
  dragon: { nombre: "Matadragones", desc: "Mata a Ignárax, el dragón rojo." },
  intactos: { nombre: "Nadie se queda atrás", desc: "Vence a un jefe sin que caiga nadie." },
  certero: { nombre: "Pulso de acero", desc: "5 golpes perfectos en un mismo combate." },
  combos: { nombre: "Trabajo en equipo", desc: "3 combos en un mismo combate." },
  muro: { nombre: "Muro viviente", desc: "Bloquea 15 ataques en total." },
  legendario: { nombre: "Tesoro de leyenda", desc: "Encuentra un objeto legendario." },
  nivel10: { nombre: "Leyenda viva", desc: "Llega a nivel 10." },
  pesadilla: { nombre: "Sin miedo", desc: "Termina la aventura en Pesadilla." },
  mimico: { nombre: "¿Era un cofre?", desc: "Derrota a un mímico." },
  devorador: { nombre: "Apagaestrellas", desc: "Vence a Nhazgul, el Devorador de Estrellas, en el Abismo." },
  estados: { nombre: "Alquimista del dolor", desc: "Ten a un enemigo con 3 estados a la vez." }
};
const MEJORAS = {
  alforjas: { nombre: "Alforjas", desc: "+1 poción al empezar.", coste: 6, max: 3 },
  herencia: { nombre: "Herencia", desc: "+10 po por héroe al empezar.", coste: 6, max: 3 },
  linaje: { nombre: "Linaje fuerte", desc: "+2 PG máximos por héroe.", coste: 10, max: 3 },
  favor: { nombre: "Favor divino", desc: "Empezáis con una bendición al azar.", coste: 20, max: 1 },
  abanico: { nombre: "Más donde elegir", desc: "Las bendiciones ofrecen 4 opciones.", coste: 15, max: 1 }
};
function meta() {
  const base = { runas: 0, logros: {}, mejoras: {}, bloqueos: 0 };
  try { return Object.assign(base, JSON.parse(leer("dym-meta", "{}")) || {}); } catch (e) { return base; }
}
function guardarMeta(m) { escribir("dym-meta", JSON.stringify(m)); }
function ganarLogro(id) {
  const m = meta();
  if (!LOGROS[id] || m.logros[id]) return;
  m.logros[id] = Date.now(); m.runas += 5;
  guardarMeta(m);
  setTimeout(() => { festejar("¡Logro!", `${LOGROS[id].nombre} · +5 runas`, "logro"); sonar("nivel"); }, 900);
}
function comprarMejora(k) {
  const m = meta(), mj = MEJORAS[k], nivel = m.mejoras[k] || 0;
  if (!mj || nivel >= mj.max || m.runas < mj.coste) return;
  m.runas -= mj.coste; m.mejoras[k] = nivel + 1;
  guardarMeta(m); sonar("botin");
  renderModal(); renderInicio();
}
function htmlAltar() {
  const m = meta();
  return `<h2>Altar de runas</h2><p class="runas-total"><b>${m.runas}</b> runas</p>
    <p class="quien">Ganas runas al vencer jefes y élites, al caer y con cada logro. Las mejoras sirven para las partidas que empieces desde este móvil.</p>
    <div class="menu">${Object.keys(MEJORAS).map(k => { const mj = MEJORAS[k], n = m.mejoras[k] || 0;
      return boton(`data-ui="mejora" data-k="${k}" data-tipo="apoyo"`, `${mj.nombre}${mj.max > 1 ? ` · ${n}/${mj.max}` : n ? " · ✓" : ""}`, n >= mj.max ? "Hecho" : `${mj.coste} ᚱ`, mj.desc, n >= mj.max || m.runas < mj.coste); }).join("")}</div>
    <h3>Logros · ${Object.keys(m.logros).length}/${Object.keys(LOGROS).length}</h3>
    <ul class="logros">${Object.keys(LOGROS).map(k => `<li class="${m.logros[k] ? "ok" : ""}"><b>${m.logros[k] ? "★" : "☆"} ${LOGROS[k].nombre}</b><span>${LOGROS[k].desc}</span></li>`).join("")}</ul>`;
}

/* ---------- Música: chiptune generado al vuelo, distinto en cada acto y más intenso con los jefes ---------- */
const MUSICA = { on: leer("dym-musica", "1") === "1", pista: null, iv: null, paso: 0, t: 0, salida: null };
const PISTAS = {
  taberna: { bpm: 104, raiz: 50, modo: [0, 2, 4, 5, 7, 9, 11], acordes: [0, 3, 4, 0], semilla: 3 },
  0: { bpm: 92, raiz: 52, modo: [0, 2, 3, 5, 7, 8, 10], acordes: [0, 5, 3, 6], semilla: 7 },
  1: { bpm: 78, raiz: 45, modo: [0, 1, 3, 5, 7, 8, 10], acordes: [0, 1, 0, 6], semilla: 11 },
  2: { bpm: 88, raiz: 48, modo: [0, 2, 3, 5, 7, 8, 11], acordes: [0, 5, 4, 0], semilla: 5 },
  3: { bpm: 100, raiz: 46, modo: [0, 1, 4, 5, 7, 8, 10], acordes: [0, 1, 0, 6], semilla: 13 },
  4: { bpm: 70, raiz: 43, modo: [0, 1, 3, 5, 6, 8, 10], acordes: [0, 6, 5, 1], semilla: 23 },
  jefe: { bpm: 138, raiz: 45, modo: [0, 1, 3, 5, 7, 8, 10], acordes: [0, 1, 5, 4], semilla: 17 }
};
function melodia(P) {
  if (P.mel) return P.mel;
  let x = P.semilla * 97;
  const azar = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  let g = 2;
  P.mel = Array.from({ length: 32 }, (_, i) => {
    if (azar() < (i % 4 === 0 ? 0.15 : 0.42)) return null;
    g = Math.max(-2, Math.min(7, g + Math.round((azar() - 0.5) * 4)));
    return g;
  });
  return P.mel;
}
function tonoEn(f, dur, tipo, vol, t, salida) {
  const a = SONIDO.ctx, o = a.createOscillator(), g = a.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(salida); o.start(t); o.stop(t + dur + 0.02);
}
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function musicaTick() {
  const a = SONIDO.ctx;
  if (!a || a.state !== "running" || !MUSICA.pista || !MUSICA.salida) return;
  const P = PISTAS[MUSICA.pista], paso = 60 / P.bpm / 2, mel = melodia(P);
  if (MUSICA.t < a.currentTime) MUSICA.t = a.currentTime + 0.05;
  while (MUSICA.t < a.currentTime + 0.25) {
    const i = MUSICA.paso % 32, acorde = P.acordes[Math.floor(MUSICA.paso / 8) % 4];
    const nota = gr => P.raiz + P.modo[((gr % 7) + 7) % 7] + 12 * Math.floor(gr / 7);
    if (i % 2 === 0) tonoEn(hz(nota(acorde) - 12), paso * 1.7, "triangle", 0.09, MUSICA.t, MUSICA.salida);
    if (i % 4 === 1) tonoEn(hz(nota(acorde + 2)), paso * 0.8, "square", 0.018, MUSICA.t, MUSICA.salida);
    if (mel[i] !== null) tonoEn(hz(nota(acorde + mel[i]) + 12), paso * 0.95, "square", 0.03, MUSICA.t, MUSICA.salida);
    if (MUSICA.pista === "jefe" && i % 2 === 1) tonoEn(90, 0.05, "square", 0.04, MUSICA.t, MUSICA.salida);
    MUSICA.t += paso; MUSICA.paso++;
  }
}
function musica(pista) {
  const on = MUSICA.on && SONIDO.on && pista !== null;
  if (!on) {
    if (MUSICA.salida) { try { MUSICA.salida.disconnect(); } catch (e) {} MUSICA.salida = null; }
    MUSICA.pista = null; clearInterval(MUSICA.iv); MUSICA.iv = null;
    return;
  }
  const a = audio();
  if (!a) return;
  if (!MUSICA.salida) { MUSICA.salida = a.createGain(); MUSICA.salida.gain.value = 0.5; MUSICA.salida.connect(a.destination); }
  if (MUSICA.pista !== pista) { MUSICA.pista = pista; MUSICA.paso = 0; MUSICA.t = a.currentTime + 0.1; }
  if (!MUSICA.iv) MUSICA.iv = setInterval(musicaTick, 80);
}
function pistaActual() {
  if (vista !== "juego" || !S) return "taberna";
  if (S.final) return "taberna";
  if (S.combate && S.combate.jefe) return "jefe";
  return Math.max(0, S.acto);
}

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
    equipo: { arma: null, armadura: null, talisman: null }, habs: APRENDE[clase][1].slice(), usosH: {}, est: {}, fl: {}
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
  const extras = [h.veneno ? "envenena" : "", h.debilita ? "debilita" : "", h.maldice ? "maldice" : "", h.aplica ? `${ESTADOS[h.aplica[0]].verbo}${h.aplica[2] < 1 ? ` ${Math.round(h.aplica[2] * 100)} %` : ""}` : ""].filter(Boolean);
  if (h.efecto === "dano") return `${dados} ${ABR_TIPO[h.tipo]}${h.tirada ? "" : " · seguro"}${h.area ? " · a todos" : ""}${extras.length ? " · " + extras.join(" · ") : ""}`;
  if (h.efecto === "cura") return `Cura ${dados}${h.a === "grupo" ? " al grupo" : h.a === "yo" ? " a ti" : ""}${h.regen ? " · regenera" : ""}`;
  return { escudo: "Bloquea un ataque", aturde: "Paraliza 1 turno", maldice: "Maldice: +2 daño recibido", debilita: "Debilita: −2 a su ataque", veneno: `Envenena ${h.turnos} turnos` }[h.efecto] + (h.area ? " · a todos" : "");
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
const sel = { heroes: [heroeAlAzar(0)], actual: 0, listo: false, fin: 0, online: false, dif: leer("dym-dif", "normal") };

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
  red.sala.presence(Object.assign({ id: miId, heroe: { nombre: h.nombre, raza: h.raza, clase: h.clase, look: h.look }, listo: sel.listo, dif: sel.dif }, extra)).catch(() => {});
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
  const reproducir = () => { if (!primero && escJuego) lista.forEach((e, k) => setTimeout(() => efectoLocal(e), k * 240)); };
  if (t && !primero && t.seq > dadoVisto && !ocupado) {
    dadoVisto = t.seq; render();
    return tirarDado(t.n, t.caras || 20, () => { mostrarTirada(t.texto, t.ok, false); reproducir(); }, t.det || undefined);
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
    if (ocupado && pr.acc.k !== "bloquear") return setTimeout(procesarAcciones, 300);
    red.vistoAcc[pr.id] = pr.acc.n;
    /* De alguien sin historial (p. ej. tras recargar el anfitrión) solo se acepta una jugada hecha sobre el estado actual. */
    if (!visto && pr.acc.rev !== S.rev && pr.acc.k !== "bloquear") continue;
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
  if (k === "bloquear") return !!S.bloqueo && S.players[S.bloqueo.i].uid === uid;
  if (k === "votar") return S.players.some(p => p.uid === uid);
  const p = S.players[S.turno];
  return !!p && p.uid === uid;
}
/* Votaciones: en línea, el camino y las decisiones las vota el grupo (15 s; si hay empate, manda quien tiene el turno). */
const VOTABLES = new Set(["nodo", "op", "resp", "final"]);
const hayVotacion = () => !!(S && S.online && S.players.length > 1);
const contextoVoto = () => `${S.modo}:${S.mapa ? S.mapa.fila : ""}:${S.esc ? S.esc.titulo : ""}:${S.fase}`;
function votantes() {
  const conectados = new Set([miId, ...red.peers.map(p => p.presence && p.presence.id).filter(Boolean)]);
  return [...new Set(S.players.map(p => p.uid))].filter(u => conectados.has(u));
}
function votar(uid, k, v) {
  if (!VOTABLES.has(k) || !S.players.some(p => p.uid === uid)) return;
  const ctx = contextoVoto();
  if (!S.votacion || S.votacion.ctx !== ctx || S.votacion.k !== k) S.votacion = { k, ctx, votos: {}, fin: Date.now() + 15000 };
  S.votacion.votos[uid] = String(v);
  if (votantes().every(u => S.votacion.votos[u] !== undefined)) return cerrarVotacion();
  guardar(); render();
  clearTimeout(votar.t);
  votar.t = setTimeout(cerrarVotacion, Math.max(0, S.votacion.fin - Date.now()) + 60);
}
function cerrarVotacion() {
  const vt = S && S.votacion;
  if (!vt || ocupado) return;
  clearTimeout(votar.t);
  S.votacion = null;
  if (vt.ctx !== contextoVoto()) { guardar(); return render(); }
  const cuenta = {};
  Object.values(vt.votos).forEach(v => { cuenta[v] = (cuenta[v] || 0) + 1; });
  const max = Math.max(...Object.values(cuenta));
  const empatados = Object.keys(cuenta).filter(v => cuenta[v] === max);
  const delTurno = vt.votos[S.players[S.turno].uid];
  const gana = empatados.includes(delTurno) ? delTurno : empatados[0];
  log(`El grupo vota (${Object.keys(vt.votos).length} votos).`, "esc");
  ejecutar(vt.k, gana);
}
/* Votos que lleva cada opción y si es la mía. */
function votosDe(k, v) {
  const vt = S && S.votacion;
  if (!vt || vt.k !== k) return { n: 0, mio: false };
  const vals = Object.entries(vt.votos);
  return { n: vals.filter(([, x]) => x === String(v)).length, mio: vt.votos[miId] === String(v) };
}
function lineaVotacion() {
  const vt = S && S.votacion;
  if (!hayVotacion()) return "";
  const n = vt ? Object.keys(vt.votos).length : 0, total = votantes().length;
  return `<p class="votacion"><b>Votación</b> · ${n}/${total} votos${vt ? ` · <span class="cuenta-voto">${Math.max(0, Math.ceil((vt.fin - Date.now()) / 1000))} s</span>` : " · toca una opción para votar"}</p>`;
}
setInterval(() => {
  if (!S || !S.votacion) return;
  const c = document.querySelector(".cuenta-voto");
  if (c) c.textContent = `${Math.max(0, Math.ceil((S.votacion.fin - Date.now()) / 1000))} s`;
  if (esHost() && Date.now() > S.votacion.fin + 500) cerrarVotacion();
}, 500);

/* El bloqueo no espera respuesta: va directo y sin bloquear la pantalla. */
function enviarBloqueo() {
  if (!red.sala) return;
  red.sala.presence({ acc: { n: Date.now(), k: "bloquear", v: "", rev: S.rev } }).catch(() => {});
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
  nuevaPartida(jugadoresSala().map(j => Object.assign({}, j.heroe, { uid: j.id })), red.mesa, sel.dif);
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
/* ---------- Sonido, vibración y celebraciones ---------- */
const SONIDO = { on: leer("dym-sonido", "1") === "1", ctx: null };
function audio() {
  if (!SONIDO.on) return null;
  try {
    SONIDO.ctx = SONIDO.ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (SONIDO.ctx.state === "suspended") SONIDO.ctx.resume();
    return SONIDO.ctx;
  } catch (e) { return null; }
}
function tono(f, dur, tipo = "square", vol = 0.05, cuando = 0, hasta) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + cuando, o = a.createOscillator(), g = a.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t);
  if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function vibrar(p) { if (SONIDO.on && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }
const SONIDOS = {
  dado: () => tono(700 + Math.random() * 500, 0.03, "square", 0.025),
  golpe: () => tono(200, 0.12, "sawtooth", 0.06, 0, 60),
  herido: () => { tono(150, 0.18, "sawtooth", 0.07, 0, 45); vibrar(45); },
  magia: () => tono(480, 0.3, "triangle", 0.05, 0, 1300),
  cura: () => { tono(520, 0.12, "sine", 0.07); tono(780, 0.2, "sine", 0.06, 0.1); },
  fallo: () => tono(230, 0.1, "triangle", 0.04, 0, 150),
  victoria: () => [523, 659, 784, 1047].forEach((f, k) => tono(f, 0.2, "square", 0.04, k * 0.11)),
  nivel: () => { [392, 523, 659, 784, 1047].forEach((f, k) => tono(f, 0.22, "square", 0.04, k * 0.08)); vibrar([30, 40, 30]); },
  botin: () => [880, 1175, 1568].forEach((f, k) => tono(f, 0.15, "triangle", 0.05, k * 0.07)),
  derrota: () => [392, 330, 262, 196].forEach((f, k) => tono(f, 0.32, "triangle", 0.05, k * 0.18)),
  perfecto: () => { [784, 1175, 1568].forEach((f, k) => tono(f, 0.1, "square", 0.045, k * 0.05)); vibrar([15, 25, 15]); },
  bien: () => tono(660, 0.08, "square", 0.04)
};
function temblar() {
  const c = $("#caja-juego");
  if (!c || reducido) return;
  c.classList.remove("temblor"); void c.offsetWidth; c.classList.add("temblor");
  vibrar(30);
}
/* Golpe certero: una marca va y viene por una barra; tocar en el centro da bonus. Devuelve 0, 1 o 2. */
let certeroActivo = false;
function golpeCertero(cb) {
  const el = $("#precision"), marca = el.querySelector(".prec-marca"), res = el.querySelector(".prec-res");
  const pf = tiene("pulso") ? 0.12 : 0.06, bien = pf + 0.13;
  el.style.setProperty("--perf", `${pf * 200}%`); el.style.setProperty("--bien", `${bien * 200}%`);
  el.hidden = false; el.classList.remove("hecho"); res.textContent = "";
  certeroActivo = true;
  const t0 = performance.now(), periodo = 820;
  let parado = false, raf = 0;
  const pos = () => { const f = ((performance.now() - t0) % (2 * periodo)) / periodo; return f <= 1 ? f : 2 - f; };
  const animar = () => { if (parado) return; marca.style.left = pos() * 100 + "%"; raf = requestAnimationFrame(animar); };
  animar();
  const parar = () => {
    if (parado) return;
    parado = true; cancelAnimationFrame(raf); clearTimeout(limite);
    const x = pos(), dist = Math.abs(x - 0.5), q = dist <= pf ? 2 : dist <= bien ? 1 : 0;
    marca.style.left = x * 100 + "%";
    res.textContent = ["Fuera de ritmo", "¡Bien! +2", "¡PERFECTO! +5"][q];
    el.dataset.q = q; el.classList.add("hecho");
    sonar(["fallo", "bien", "perfecto"][q]);
    setTimeout(() => { el.hidden = true; el.onpointerdown = null; certeroActivo = false; cb(q); }, 480);
  };
  const limite = setTimeout(parar, 3200);
  el.onpointerdown = e => { e.preventDefault(); parar(); };
}
function necesitaCertero(v) {
  const c = S && S.combate;
  if (!c || c.enemigoActua) return false;
  const p = S.players[S.turno], id = p && p.habs[+v], h = id && H(id);
  return !!h && h.efecto === "dano" && (!h.usos || p.usosH[id] > 0);
}
function sonar(k) { if (SONIDO.on && SONIDOS[k]) try { SONIDOS[k](); } catch (e) {} }
function festejar(titulo, sub, clase = "") {
  const el = $("#festejo");
  if (!el) return;
  el.className = "festejo " + clase;
  el.innerHTML = `<p>${esc(titulo)}</p>${sub ? `<small>${esc(sub)}</small>` : ""}`;
  el.hidden = false;
  clearTimeout(festejar.t);
  festejar.t = setTimeout(() => { el.hidden = true; }, 1900);
}
const EFECTOS_ESCENA = new Set(["numero", "golpe", "ataque", "magia", "cura", "muerte", "proyectil", "tajo", "destello"]);
/* Un efecto se ve en el escenario y además suena y, si toca, se celebra (también en los móviles de los demás). */
/* Rótulo sobre el escenario con el nombre del ataque y quién lo hace. */
function anunciar(e) {
  const el = $("#anuncio");
  if (!el) return;
  el.className = "anuncio t-" + (e.tono || "apoyo");
  el.innerHTML = `<b>${esc(e.texto)}</b>${e.sub ? `<small>${esc(e.sub)}</small>` : ""}`;
  el.hidden = false;
  void el.offsetWidth; el.classList.add("ver");
  clearTimeout(anunciar.t);
  anunciar.t = setTimeout(() => { el.hidden = true; }, 1500);
}
/* Los retratos del grupo reaccionan: se sacuden al recibir daño, brillan al curarse y saltan al ganar. */
const GESTOS = {};
function gesto(i, clase) {
  const chips = document.querySelectorAll("#grupo .heroe");
  (i === "*" ? [...chips.keys()] : [i]).forEach(k => {
    GESTOS[k] = { clase, hasta: performance.now() + 650 };
    const ch = chips[k];
    if (ch) { ch.classList.remove("g-herido", "g-curado", "g-victoria"); void ch.offsetWidth; ch.classList.add(clase); }
  });
}
function efectoLocal(e) {
  if (escJuego && (EFECTOS_ESCENA.has(e.tipo) || e.tipo === "salto")) escJuego.efecto(e);
  if (e.tipo === "anuncio") anunciar(e);
  if (e.tipo === "golpe" && String(e.objetivo)[0] === "h") gesto(+String(e.objetivo).slice(1), "g-herido");
  if (e.tipo === "cura" && String(e.objetivo)[0] === "h") gesto(+String(e.objetivo).slice(1), "g-curado");
  if (e.tipo === "salto" || e.tipo === "victoria") gesto("*", "g-victoria");
  if (e.tipo === "golpe") sonar(e.objetivo === "e" ? "golpe" : "herido");
  else if (e.tipo === "magia") sonar("magia");
  else if (e.tipo === "cura") sonar("cura");
  else if (e.tipo === "muerte") sonar("golpe");
  else if (e.tipo === "victoria") sonar("victoria");
  else if (e.tipo === "fase") { sonar("derrota"); festejar(e.texto, e.sub, "fase"); vibrar([60, 40, 60]); }
  else if (e.tipo === "bloqueo") { sonar("bien"); vibrar(20); }
  else if (e.tipo === "proyectil" || e.tipo === "tajo") sonar(e.forma === "flecha" ? "dado" : "magia");
  else if (e.tipo === "logro") ganarLogro(e.id);
  else if (e.tipo === "runas") { const m = meta(); m.runas += e.n; guardarMeta(m); }
  else if (e.tipo === "bloqueos") { const m = meta(); m.bloqueos = (m.bloqueos || 0) + e.n; guardarMeta(m); if (m.bloqueos >= 15) ganarLogro("muro"); }
  else if (e.tipo === "numero" && e.texto === "FALLO") sonar("fallo");
  if (e.tipo === "numero" && e.grande) temblar();
  else if (e.tipo === "nivel") { sonar("nivel"); festejar(e.texto, e.sub, "nivel"); }
  else if (e.tipo === "botin") { sonar("botin"); if (e.rz === "epico" || e.rz === "legendario") festejar(e.texto, e.sub, "r-" + e.rz); }
  else if (e.tipo === "derrota") sonar("derrota");
}
function fx(e) {
  efectoLocal(e);
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
  if (p.nivel >= 10) fx({ tipo: "logro", id: "nivel10" });
  fx({ tipo: "nivel", texto: `¡Nivel ${p.nivel}!`, sub: `${p.nombre} · +3 PG máximos` });
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
  if (f.oro) {
    const oro = f.oro > 0 && tiene("fortuna") ? Math.ceil(f.oro * 1.5) : f.oro;
    S.players.forEach(p => { p.oro = Math.max(0, p.oro + oro); }); out.push(`${fmt(oro)} po c/u`);
  }
  if (f.anillo) { S.anillo = true; out.push("Anillo de invisibilidad"); }
  if (f.marca) S.memoria[f.marca] = true;
  if (f.quita) delete S.memoria[f.quita];
  if (f.botin) { S.botin.push(sacarBotin(true)); anunciarBotin(); out.push("¡Un objeto!"); }
  if (f.bendicionB) { ofrecerBendiciones(); out.push("¡Bendición!"); }
  if (f.moral && actor) {
    const antes = actor.alin;
    actor.alin = D.moverMoral(actor.alin, f.moral);
    if (actor.alin !== antes) out.push(`${actor.nombre}: ${ALINEAMIENTOS[actor.alin].toLowerCase()}`);
  }
  out.push(...ganarXp(f.xp));
  return out;
}

/* ---------- Dados ---------- */
/* El d20 rueda en grande por la pantalla, cae y enseña el resultado (en todos los móviles). */
let tiradaN = 0;
function veredicto(final, det) {
  if (det.crit) return ["¡CRÍTICO!", "crit"];
  if (final === 1) return ["¡PIFIA!", "pifia"];
  if (det.ok) return [det.tipo === "prueba" ? "¡ÉXITO!" : "¡IMPACTO!", "ok"];
  return [det.tipo === "prueba" ? "FRACASO" : "FALLO", "ko"];
}
function mostrarResultadoTirada(final, det) {
  const el = $("#tirada");
  if (!el || !det) return;
  const [txt, cls] = veredicto(final, det);
  el.querySelector(".t-quien").textContent = [det.quien, det.accion].filter(Boolean).join(" · ");
  el.querySelector(".t-calc").innerHTML = `${final} <span>${fmt(det.mod)}</span> = <b>${det.total}</b> vs ${esc(det.contra)}`;
  const v = el.querySelector(".t-veredicto");
  v.textContent = txt; v.className = "t-veredicto " + cls;
  el.dataset.res = cls;
  el.classList.add("caida");
  sonar(cls === "crit" ? "perfecto" : cls === "ok" ? "bien" : "fallo");
  if (cls === "crit") { vibrar([30, 40, 60]); temblar(); } else if (cls === "pifia") vibrar(80);
}
function tirarDado(final, caras, cb, det) {
  const cv = $("#dado");
  ocupado = true; document.body.classList.add("ocupado");
  mostrarTirada.det = det ? Object.assign({ n: final }, det) : null;
  const terminar = () => {
    if (cv) ESCENARIO.dibujarDado(cv, final);
    ocupado = false; document.body.classList.remove("ocupado");
    cb();
  };
  const el = $("#tirada"), grande = $("#dado-grande");
  const animar = !reducido && !RAPIDO && el && grande && det && vista === "juego";
  if (!animar) {
    if (reducido || RAPIDO || !cv || cv.offsetParent === null) return terminar();
    let k = 0;
    const iv = setInterval(() => { k++; if (k % 2) sonar("dado"); ESCENARIO.dibujarDado(cv, d(caras), k % 2, (k % 3) - 1, k % 2 ? -1 : 0); }, 70);
    setTimeout(() => { clearInterval(iv); terminar(); }, 450);
    return;
  }
  const n = ++tiradaN;
  el.className = "tirada rodando"; delete el.dataset.res; el.hidden = false;
  el.querySelector(".t-veredicto").textContent = ""; el.querySelector(".t-calc").textContent = ""; el.querySelector(".t-quien").textContent = "";
  let k = 0;
  const iv = setInterval(() => {
    k++;
    if (k % 2) sonar("dado");
    const x = d(caras);
    ESCENARIO.dibujarDado(grande, x, k % 2, (k % 3) - 1, k % 2 ? -1 : 0);
    if (cv) ESCENARIO.dibujarDado(cv, x, k % 2);
  }, 55);
  setTimeout(() => {
    clearInterval(iv);
    ESCENARIO.dibujarDado(grande, final);
    el.classList.remove("rodando");
    mostrarResultadoTirada(final, det);
    setTimeout(terminar, 260);
    setTimeout(() => { if (tiradaN === n) el.hidden = true; }, 1700);
  }, 760);
}
function mostrarTirada(texto, ok, enPartida = true) {
  const info = $("#dado-info");
  info.textContent = texto;
  info.className = ok === true ? "ok" : ok === false ? "ko" : "";
  if (enPartida && S) {
    const seq = ((S.dado && S.dado.seq) || 0) + 1;
    S.dado = { seq, n: mostrarTirada.ultimo || 20, caras: 20, texto, ok, det: mostrarTirada.det || null };
    mostrarTirada.det = null;
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
  let t = `${quien} ${accion}: ${r} ${fmt(mod)}${bono ? " " + fmt(bono) : ""} = ${total} vs ${contra}`;
  if (crit) t += " · ¡crítico!";
  else if (r === 1) t += " · ¡pifia!";
  return t;
}

/* ---------- Mapa de caminos ---------- */
function generarMapa() {
  /* 6 filas de caminos entre la salida y el jefe, de 2 a 4 nodos cada una. */
  const filas = [[{ tipo: "inicio", sig: [] }]];
  let elites = 0;
  for (let f = 1; f <= 6; f++) {
    const r = Math.random();
    const n = f === 1 ? 3 : f === 6 ? 2 + (r < 0.5 ? 1 : 0) : r < 0.25 ? 2 : r < 0.7 ? 3 : 4;
    const fila = [];
    for (let i = 0; i < n; i++) fila.push({ tipo: f === 1 || Math.random() < 0.5 ? "combate" : "evento", sig: [] });
    const libres = () => fila.filter(x => x.tipo === "combate" || x.tipo === "evento");
    if (f === 2 || (f === 5 && Math.random() < 0.5)) azarDe(libres()).tipo = "tesoro";
    if (f === 3) azarDe(libres()).tipo = "tienda";
    if (f === 4 && Math.random() < 0.6) azarDe(libres()).tipo = "altar";
    if (f >= 3 && f <= 5 && elites < 2 && Math.random() < 0.45 && libres().length) { azarDe(libres()).tipo = "elite"; elites++; }
    if (f >= 2 && f <= 5) libres().forEach(x => { if (Math.random() < 0.18) x.tipo = "misterio"; });
    if (f === 6) fila[Math.floor(Math.random() * n)].tipo = "hoguera";
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
const NOMBRE_NODO = { combate: "Combate", elite: "Élite", evento: "Suceso", misterio: "Misterio", altar: "Altar maldito", tesoro: "Cofre", tienda: "Tienda", hoguera: "Hoguera", jefe: "Jefe", inicio: "Salida" };
const VICTORIAS = ["Cae el último golpe. El camino queda libre.", "Recogéis el botín y seguís adelante.", "Victoria. Os curáis las heridas como podéis.", "El enemigo cae. Hay monedas entre los restos."];
const VICTORIAS_JEFE = [
  "El trol cae al barranco. Al otro lado del puente empieza la mazmorra.",
  "Malakar se deshace en polvo y rompéis su filacteria. Un pasadizo sube hacia un castillo.",
  "Lord Varkhul arde al primer rayo de sol. El paso hacia el Pico Cenizo está abierto.",
  "Ignárax cae sobre su tesoro con un rugido que hace temblar la montaña. El dragón ha muerto.",
  "El ojo de Nhazgul se apaga como una estrella vieja. El vacío se cierra y, por primera vez en mil años, Valdren duerme tranquila."
];

function crearEscena(tipo) {
  const A = ACTOS[S.acto];
  if (tipo === "misterio") {
    const r = Math.random();
    tipo = r < 0.35 ? "combate" : r < 0.75 ? "evento" : "tesoro";
    log(`El misterio resulta ser: ${NOMBRE_NODO[tipo].toLowerCase()}.`, "esc");
  }
  if (tipo === "altar") return { tipo: "prueba", fondo: azarDe(A.fondos), titulo: "Un altar maldito",
    texto: "Una piedra negra late como un corazón. Promete poder a cambio de algo vuestro.",
    opciones: [
      { txt: "Ofrecer vuestra sangre (−3 PG máx. a todos)", stat: null, ok: { t: "La piedra bebe. Algo os cambia por dentro.", fx: { maxTodos: -3, bendicionB: true, moral: -1 } } },
      { txt: "Ofrecer oro (−15 po cada uno)", stat: null, ok: { t: "El oro se funde en la piedra y escupe un objeto.", fx: { oro: -15, botin: true } } },
      { txt: "Destrozar el altar", stat: "ani", cd: 13, ok: { t: "La piedra estalla y libera la luz atrapada.", fx: { xp: 6, almaTodos: 4, moral: 1 } }, ko: { t: "La piedra se defiende con fuego negro.", fx: { almaTodos: -4 } } }] };
  if (tipo === "evento") {
    const mem = S.memoria || {};
    const pool = EVENTOS.filter(e => !S.vistosEv.includes(e.id) && (e.requiere ? !!mem[e.requiere] && e.actos.includes(S.acto) : e.acto === S.acto || e.acto === null));
    const consecuencias = pool.filter(e => e.requiere);
    if (pool.length) {
      const ev = consecuencias.length && Math.random() < 0.75 ? azarDe(consecuencias) : azarDe(pool);
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
  if (tipo === "elite") {
    const k = azarDe(A.enemigos);
    return { tipo: "combate", esElite: true, enemigo: k, fondo: azarDe(A.fondos), titulo: `Élite: ${ENEMIGOS[k].nombre}`,
      victoria: { t: "Una victoria difícil. El enemigo guardaba algo valioso.", fx: { xp: 9 + S.acto * 3, oro: 15 + S.acto * 5 } } };
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
    S.esc = { tipo: "combate", enemigo: "mimico", fondo: sc.fondo, titulo: ENEMIGOS.mimico.nombre, botinSeguro: true, unico: true,
      victoria: { t: "El mímico cae. Dentro de su panza hay de todo.", fx: { xp: 5 + S.acto * 2, oro: 12 } } };
    return iniciarCombate(S.esc);
  }
  S.botin = [sacarBotin(false)];
  if (S.acto >= 2 && Math.random() < 0.5) S.botin.push(sacarBotin(false));
  anunciarBotin();
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
function anunciarBotin() {
  const mejor = S.botin.slice().sort((a, b) => OBJETOS[b].precio - OBJETOS[a].precio)[0];
  if (S.botin.some(id => rareza(id) === "legendario")) fx({ tipo: "logro", id: "legendario" });
  if (mejor) fx({ tipo: "botin", rz: rareza(mejor), texto: `¡Botín ${RAREZAS[rareza(mejor)].toLowerCase()}!`, sub: OBJETOS[mejor].nombre });
}
function venderSobrante() {
  if (!S.botin.length) return;
  const total = S.botin.reduce((a, id) => a + Math.floor(OBJETOS[id].precio / 2), 0), cada = Math.max(1, Math.floor(total / S.players.length));
  S.players.forEach(p => { p.oro += cada; });
  log(`Vendéis lo que nadie quiere: +${cada} po cada uno.`, "ok");
  S.botin = [];
}

/* ---------- Flujo de partida ---------- */
function nuevaPartida(defs, codigo, dificultad = "normal") {
  S = {
    v: 5, online: codigo ? { codigo } : null, rev: 0, dado: null, efectos: codigo ? { seq: 0, lista: [] } : null,
    players: defs.slice(0, MAX_HEROES).map(nuevoHeroe),
    zurron: { pocion: 2, superior: 0, bendicion: 0, fuego: 0, sueno: 0 }, olivoActivo: false, anillo: false,
    acto: -1, mapa: null, modo: "escena", esc: null, turno: 0, fase: "elegir", resultado: null, combate: null, tienda: null,
    derrota: false, final: null, guardadoActo: null, aprender: [], botin: [], bendiciones: [], ofertaB: null, log: [], vistos: { bestias: [], lugares: [] }, vistosEv: [], ultimoEnemigo: null,
    dificultad: DIFICULTADES[dificultad] ? dificultad : "normal", memoria: {}, opcionesB: 3, bloqueo: null, votacion: null,
    abismo: dificultad === "dificil" || !!meta().logros.dragon, stats: defs.slice(0, MAX_HEROES).map(() => ({ dano: 0, mejor: 0, curado: 0, bloqueos: 0, criticos: 0, perfectos: 0, bajas: 0, recibido: 0 }))
  };
  /* Mejoras compradas con runas en el altar de este móvil. */
  const mj = meta().mejoras;
  S.zurron.pocion += mj.alforjas || 0;
  S.players.forEach(p => { p.oro += 10 * (mj.herencia || 0); p.almaBase += 2 * (mj.linaje || 0); p.alma = p.almaBase; });
  if (mj.abanico) S.opcionesB = 4;
  if (mj.favor) S.bendiciones.push(azarDe(Object.keys(BENDICIONES).filter(k => k !== "vigor")));
  log(`Comienza la aventura (${DIFICULTADES[S.dificultad].nombre}): ${S.players.map(p => `${p.nombre} (${nombreRazaClase(p)})`).join(", ")}.`);
  if (S.players.length === 1) { const p = S.players[0]; p.almaBase += 4; p.alma += 4; }
  submenu = null; modal = null; vista = "juego";
  siguienteActo();
}
/* El Acto V (el Abismo) se desbloquea tras matar al dragón una vez en este móvil, y siempre en Pesadilla. */
const ultimoActo = () => (S && S.abismo ? 4 : 3);
function siguienteActo() {
  S.modo = "escena"; S.fase = "elegir"; S.resultado = null; S.combate = null; S.tienda = null;
  if (S.acto >= ultimoActo()) {
    const abismo = S.acto >= 4;
    S.esc = { tipo: "final", fondo: abismo ? "ruinas" : "guarida", titulo: abismo ? "La luz vuelve" : "El tesoro del dragón",
      texto: (abismo ? "Subís del Abismo con las manos vacías y los ojos llenos de estrellas. Arriba sigue el tesoro del dragón. " : "Oro de mil reinos. ") + "Villabruma está medio quemada y los enanos llevan cien años sin hogar. ¿Qué hacéis con él?",
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
  const total0 = r + mod + bono, crit0 = r >= critMin(p);
  tirarDado(r, 20, () => {
    const total = r + mod + bono, crit = r >= critMin(p);
    const ok = crit || (r !== 1 && total >= op.cd);
    const linea = lineaTirada(p.nombre, ABREV[op.stat], r, mod, bono, total, `CD ${op.cd}`, crit) + nota;
    mostrarTirada(linea, ok);
    resolver(op.ok, op.ko, ok, linea, crit);
  }, { tipo: "prueba", quien: p.nombre, accion: STATS[op.stat], mod: mod + bono, total: total0, contra: `CD ${op.cd}`, crit: crit0, ok: crit0 || (r !== 1 && total0 >= op.cd) });
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
  if (!S.resultado || S.aprender.length || S.ofertaB) return;
  venderSobrante();
  S.turno = siguienteVivo(S.turno + 1);
  if (sc && sc.esJefe) return siguienteActo();
  volverAlMapa();
}
function elegirFinal(clave) {
  S.final = clave;
  log(`Final: ${FINALES[clave].titulo}`, "esc");
  fx({ tipo: "runas", n: Math.ceil(10 * dif().runas) });
  if (!S.abismo) log("Bajo el tesoro algo se mueve... El Acto V, el Abismo, queda desbloqueado en este móvil.", "esc");
  if (S.dificultad === "dificil") fx({ tipo: "logro", id: "pesadilla" });
  guardar(); render();
}
function reintentar() {
  const g = JSON.parse(S.guardadoActo);
  g.log = S.log; g.guardadoActo = S.guardadoActo; g.stats = S.stats; g.rev = S.rev; g.dado = S.dado; g.efectos = S.efectos;
  S = g;
  S.players.forEach(p => { p.alma = maxAlma(p); });
  S.intentos = (S.intentos || 0) + 1;
  S.zurron.pocion += 2; S.zurron.superior += 1;
  log("Solara os devuelve a la vida al inicio del acto y os regala 2 pociones y 1 poción superior.", "esc");
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
  /* Brunilda, si la salvasteis, ha corrido la voz: precio de amigos. */
  const amigos = S.memoria && S.memoria.mercader ? 0.85 : 1;
  return Math.ceil(base * amigos * (p.clase === "picaro" ? 0.75 : 1));
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
/* Estados que pueden sufrir héroes y enemigos (turnos restantes en obj.est). */
const ESTADOS = {
  veneno: { nombre: "Veneno", verbo: "envenena", color: "#7bdc5a", desc: "Pierde PG al empezar su turno." },
  quemadura: { nombre: "Quemadura", verbo: "quema", color: "#ff8a3d", desc: "Pierde 1d6 PG por turno y no puede regenerarse." },
  sangrado: { nombre: "Sangrado", verbo: "hace sangrar", color: "#ff5a6e", desc: "Pierde 2 PG por turno." },
  paralisis: { nombre: "Parálisis", verbo: "paraliza", color: "#ffd84a", desc: "Pierde su próximo turno." },
  congelado: { nombre: "Congelado", verbo: "congela", color: "#7fd8ff", desc: "Pierde su turno y, mientras tanto, recibe un 50 % más de daño." },
  debil: { nombre: "Debilitado", verbo: "debilita", color: "#b9a0ff", desc: "−2 para atacar." },
  maldito: { nombre: "Maldito", verbo: "maldice", color: "#c27bff", desc: "Recibe +2 de cada golpe." },
  ciego: { nombre: "Cegado", verbo: "ciega", color: "#d6daf0", desc: "Falla la mitad de sus ataques." },
  regen: { nombre: "Regeneración", verbo: "regenera", color: "#3ddc97", desc: "Recupera 3 PG por turno." }
};
const TIMIDOS = ["paralisis", "congelado"];
/* Ataque especial de cada monstruo: cada N rondas sustituye a su primer ataque. */
const ESPECIALES = {
  rata: { nombre: "Mordisco infecto", cada: 2, estado: ["veneno", 2, 0.8] },
  goblin: { nombre: "Puñalada sucia", cada: 2, estado: ["sangrado", 2, 0.8] },
  kobold: { nombre: "Red de trampero", cada: 3, estado: ["paralisis", 1, 0.7], sinDano: true },
  lobo: { nombre: "Desgarro", cada: 2, estado: ["sangrado", 2, 0.7] },
  osolechuza: { nombre: "Abrazo de oso", cada: 3, estado: ["paralisis", 1, 0.6], mult: 1.5 },
  esqueleto: { nombre: "Golpe de escudo", cada: 3, estado: ["paralisis", 1, 0.5] },
  cubo: { nombre: "Engullir", cada: 3, estado: ["veneno", 3, 1], mult: 1.3 },
  mimico: { nombre: "Lengua pegajosa", cada: 2, estado: ["paralisis", 1, 0.7] },
  armadura: { nombre: "Tajo pesado", cada: 3, estado: ["sangrado", 2, 1], mult: 1.5 },
  elemental: { nombre: "Llamarada", cada: 2, estado: ["quemadura", 2, 0.8], todos: true, mult: 0.6 },
  golem: { nombre: "Puño sísmico", cada: 3, estado: ["paralisis", 1, 0.35], todos: true, mult: 0.6 },
  trol: { nombre: "Garrazo", cada: 2, estado: ["sangrado", 2, 0.8] },
  liche: { nombre: "Toque helado", cada: 2, estado: ["congelado", 1, 0.6] },
  vampiro: { nombre: "Mordisco", cada: 2, estado: ["sangrado", 2, 0.8], mult: 1.2 },
  dragon: { nombre: "Coletazo", cada: 2, estado: ["paralisis", 1, 0.4], mult: 1.3 },
  diablillo: { nombre: "Pinchazo ígneo", cada: 2, estado: ["quemadura", 2, 0.9] },
  arana: { nombre: "Picadura", cada: 2, estado: ["veneno", 3, 1], extra: ["paralisis", 1, 0.4] },
  sombra: { nombre: "Toque gélido", cada: 2, estado: ["debil", 3, 1], extra: ["ciego", 2, 0.6] },
  devorador: { nombre: "Mirada del vacío", cada: 2, estado: ["ciego", 2, 0.8], extra: ["maldito", 3, 0.6], mult: 1.2 }
};
const ESTADO_AREA = { dragon: ["quemadura", 2, 1], devorador: ["ciego", 1, 1], liche: ["debil", 2, 0.5] };
const textoEstado = ([k, t, prob]) => `${ESTADOS[k].verbo}${prob < 1 ? ` (${Math.round(prob * 100)} %)` : ""}`;
/* Pone un estado; los elfos no se dejan paralizar ni congelar. Devuelve si ha prendido. */
function ponerEstado(obj, k, turnos, esHeroe, id) {
  if (!obj || !ESTADOS[k]) return false;
  if (esHeroe && TIMIDOS.includes(k) && obj.raza === "elfo") { log(`${obj.nombre} se libra: linaje feérico.`, "ok"); return false; }
  obj.est = obj.est || {};
  obj.est[k] = Math.max(obj.est[k] || 0, turnos);
  if (!esHeroe && Object.keys(obj.est).length >= 3) fx({ tipo: "logro", id: "estados" });
  fx({ tipo: "numero", objetivo: id, texto: ESTADOS[k].nombre.toUpperCase(), color: ESTADOS[k].color, fila: 2 });
  return true;
}
/* Daño de estados y paso del tiempo al empezar el turno de alguien. Devuelve true si pierde el turno. */
function tickEstados(obj, esHeroe, id) {
  const e = obj.est || {}, partes = [];
  const herir = (n, k) => {
    if (esHeroe) obj.alma = Math.max(0, obj.alma - n); else obj.hp = Math.max(0, obj.hp - n);
    fx({ tipo: "numero", objetivo: id, texto: "-" + n, color: ESTADOS[k].color });
    partes.push(`${ESTADOS[k].nombre.toLowerCase()} ${n}`);
  };
  const a = Math.max(0, S.acto);
  if (e.veneno) herir(2 + a, "veneno");
  if (e.quemadura) herir(d(6) + Math.floor(a / 2), "quemadura");
  if (e.sangrado) herir(2 + Math.floor(a / 2), "sangrado");
  if (e.regen && (esHeroe ? obj.alma : obj.hp) > 0) {
    const cu = esHeroe ? curar(obj, 3) : 0;
    if (cu) { fx({ tipo: "numero", objetivo: id, texto: "+" + cu, color: ESTADOS.regen.color }); partes.push(`regenera ${cu}`); }
  }
  if (partes.length) log(`${obj.nombre}: ${partes.join(", ")}.`, esHeroe ? "ko" : "ok");
  const pierde = !!(e.paralisis || e.congelado);
  for (const k of Object.keys(e)) { e[k]--; if (e[k] <= 0) delete e[k]; }
  if (pierde) log(`${obj.nombre} no puede moverse y pierde el turno.`, esHeroe ? "ko" : "ok");
  return pierde;
}
const DIFICULTADES = {
  facil: { nombre: "Aventurero", desc: "Para disfrutar de la historia.", hp: 0.8, dano: -1, atk: -1, runas: 0.5 },
  normal: { nombre: "Héroe", desc: "El reto pensado para el juego.", hp: 1, dano: 0, atk: 0, runas: 1 },
  dificil: { nombre: "Pesadilla", desc: "Enemigos más duros y los caídos no se levantan al ganar.", hp: 1.3, dano: 1, atk: 1, runas: 2 }
};
const dif = () => DIFICULTADES[S && S.dificultad] || DIFICULTADES.normal;
/* Enemigos menores que acompañan al principal en cada acto. */
const ESBIRROS = [["rata", "kobold"], ["rata", "esqueleto"], ["esqueleto", "lobo"], ["kobold", "elemental"], ["diablillo", "sombra"]];
const NOMBRE_ESBIRRO = { rata: "Rata gigante", kobold: "Kobold", esqueleto: "Esqueleto", lobo: "Huargo", elemental: "Chispa ígnea", goblin: "Goblin", diablillo: "Diablillo", sombra: "Sombra", arana: "Arañuela" };
/* Segunda fase de los jefes: al bajar a media vida cambian de táctica. */
const FASES = {
  trol: { txt: "El trol arranca un pilar del puente y entra en furia", cambia: r => { r.ataques++; r.regenera = 5; } },
  liche: { txt: "Malakar alza a sus guardianes de la tumba", invoca: ["esqueleto", "esqueleto"], cambia: r => { r.area = { cada: 2, dado: 6, txt: "Malakar lanza un rayo necrótico contra todo el grupo" }; } },
  vampiro: { txt: "Varkhul llama a sus lobos y su sed se vuelve insaciable", invoca: ["lobo"], cambia: r => { r.atk++; r.drena = true; } },
  devorador: { txt: "Nhazgul devora la luz y llama a sus siervos del vacío", invoca: ["sombra", "diablillo"], cambia: r => { r.atk++; r.area = { cada: 2, dado: 10, txt: "Nhazgul abre su ojo y la luz se apaga" }; } },
  dragon: { txt: "Ignárax alza el vuelo: las armas apenas le alcanzan", cambia: r => { r.resiste = "fisica"; r.debil = null; r.area = { cada: 2, dado: 8, txt: "Ignárax escupe fuego desde el cielo" }; } }
};
function crearRival(clave, o = {}) {
  const e = ENEMIGOS[clave], n = S.players.length, D_ = dif();
  /* Crecen con el nivel medio del grupo por encima de lo esperado en cada acto. */
  const niv = Math.max(0, S.players.reduce((a, p) => a + p.nivel, 0) / n - 1 - 1.4 * Math.max(0, S.acto));
  const hp = Math.max(4, Math.round(e.alma * (0.45 + 0.28 * n) * (1 + 0.18 * niv) * D_.hp * (o.factor || 1) * (o.elite ? 1.5 : 1)));
  const base = Math.floor(niv / 3) + (o.elite ? 1 : 0) + D_.atk;
  return {
    clave, nombre: o.esbirro ? NOMBRE_ESBIRRO[clave] || e.nombre : e.nombre, hp, hpMax: hp,
    ataques: o.esbirro ? 1 : e.ataques + (n >= 4 ? 1 : 0), atk: e.atk, atkMod: base, atkBase: base,
    danoExtra: Math.floor(niv / 2) + (o.elite ? 1 : 0) + D_.dano - (o.esbirro ? 1 : 0),
    regenera: o.esbirro ? 0 : e.regenera || 0, area: o.esbirro ? null : e.area || null, estado: o.esbirro ? null : e.estado || null,
    cura: o.esbirro ? null : e.cura || null, furia: !!e.furia, drena: !!e.drena, roba: e.roba || 0, nomuerto: !!e.nomuerto,
    resiste: e.resiste, debil: e.debil, est: {}, quemado: false, partido: false, areaEstado: ESTADO_AREA[clave] || null,
    jefe: !!o.jefe, fase: 1, esbirro: !!o.esbirro, marca: null
  };
}
function nombrarRivales(lista) {
  const cuenta = {};
  lista.forEach(r => { cuenta[r.nombre.replace(/ [A-C]$/, "")] = (cuenta[r.nombre.replace(/ [A-C]$/, "")] || 0) + 1; });
  const visto = {};
  lista.forEach(r => {
    const base = r.nombre.replace(/ [A-C]$/, "");
    if (cuenta[base] > 1) { visto[base] = (visto[base] || 0) + 1; r.nombre = `${base} ${"ABC"[visto[base] - 1]}`; } else r.nombre = base;
  });
}
const vivosR = () => S.combate.rivales.map((r, k) => k).filter(k => S.combate.rivales[k].hp > 0);
const todosCaidos = () => !!S.combate && S.combate.rivales.every(r => r.hp <= 0);
function objetivoValido(t) {
  const c = S.combate;
  if (!c) return 0;
  if (c.rivales[t] && c.rivales[t].hp > 0) return t;
  const l = vivosR();
  return l.length ? l[0] : 0;
}
let objetivoLocal = null;
const miObjetivo = () => objetivoValido(objetivoLocal === null ? S.combate.objetivo : objetivoLocal);
function iniciarCombate(sc) {
  const n = S.players.length;
  const rivales = [crearRival(sc.enemigo, { jefe: sc.esJefe, elite: sc.esElite })];
  if (!sc.esJefe && !sc.unico) {
    const extra = Math.random() < (S.acto === 0 ? 0.35 : 0.55) ? (S.acto >= 2 && Math.random() < 0.35 ? 2 : 1) : 0;
    if (extra) {
      rivales[0] = crearRival(sc.enemigo, { elite: sc.esElite, factor: 0.8 });
      for (let k = 0; k < extra; k++) rivales.push(crearRival(azarDe(ESBIRROS[Math.max(0, S.acto)]), { esbirro: true, factor: 0.45 }));
    }
  }
  nombrarRivales(rivales);
  const c = S.combate = { rivales, objetivo: 0, ronda: 1, orden: [], pos: 0, escudo: false, anilloUsado: false, enemigoActua: false, actua: -1,
    blando: n === 1, elite: !!sc.esElite, jefe: !!sc.esJefe, robado: {}, combos: 0, perfectos: 0, bloqueos: 0, caidos: 0 };
  objetivoLocal = null;
  rivales.forEach(r => { if (!S.vistos.bestias.includes(r.clave)) S.vistos.bestias.push(r.clave); });
  S.players.forEach(p => { p.usosH = {}; p.habs.forEach(h => { p.usosH[h] = H(h).usos ? H(h).usos + (tiene("reservas") ? 1 : 0) : 0; }); p.fl = {}; p.est = {}; });
  const orden = S.players.map((p, i) => ({ t: "h", i, ini: d(20) + iniMod(p) }));
  rivales.forEach((r, k) => orden.push({ t: "e", r: k, ini: d(20) + ENEMIGOS[r.clave].ini }));
  orden.sort((a, b) => b.ini - a.ini || (a.t === "h" ? -1 : 1));
  c.orden = orden;
  log(`${rivales.length > 1 ? `¡${rivales.length} enemigos! ` : ""}Iniciativa: ${orden.map(x => `${x.t === "e" ? rivales[x.r].nombre : S.players[x.i].nombre} ${x.ini}`).join(" · ")}`);
  S.players.forEach((p, i) => {
    if (p.raza !== "draconido" || p.alma <= 0) return;
    fx({ tipo: "ataque", actor: "h" + i });
    log(`${p.nombre} exhala su aliento → ${danarRival(0, tirar(1, 6), "arcana", false, 1, RP.fuego)}`, "ok");
  });
  if (tiene("primer")) { fx({ tipo: "ataque", actor: "h0" }); log(`Emboscada → ${danarRival(0, tirar(2, 6), "fisica", false)}`, "ok"); }
  if (S.memoria && S.memoria.aliado && Math.random() < 0.4) { fx({ tipo: "tajo", objetivo: "e0" }); log(`¡Thrain irrumpe con su hacha! → ${danarRival(0, tirar(2, 8), "fisica", false)}`, "ok"); }
  if (todosCaidos()) return victoria();
  prepararTurno();
}
function avanzar() { const c = S.combate; c.pos++; if (c.pos >= c.orden.length) { c.pos = 0; c.ronda++; } }
function prepararTurno() {
  const c = S.combate;
  for (let guarda = 0; guarda < 60; guarda++) {
    if (!vivos().length) return derrota();
    if (todosCaidos()) return victoria();
    const a = c.orden[c.pos];
    if (a.t === "e") { if (c.rivales[a.r].hp <= 0) { avanzar(); continue; } return turnoEnemigo(a.r); }
    const p = S.players[a.i];
    if (p.alma <= 0) { avanzar(); continue; }
    if (tickEstados(p, true, "h" + a.i) || p.alma <= 0) { if (p.alma <= 0) log(`¡${p.nombre} cae!`, "ko"); avanzar(); continue; }
    S.turno = a.i; submenu = null;
    c.objetivo = objetivoValido(c.objetivo);
    guardar(); render();
    return;
  }
}
/* Daño a un rival. Si otro héroe lo dejó marcado (aturdido, envenenado, maldito, debilitado), es un COMBO: ×1,5. */
function danarRival(k, base, clase, crit, extra = 1, rampa, porHeroe = -1) {
  const c = S.combate, r = c.rivales[k];
  if (!r || r.hp <= 0) return "ya había caído";
  let dmg = Math.max(1, base) + (r.est.maldito ? 2 : 0);
  let mult = 1, nota = "";
  if (r.resiste === clase) { mult = 0.5; nota = " (lo resiste)"; }
  if (r.debil === clase) { mult = 2; nota = " (¡punto débil!)"; }
  if (extra > 1 && extra > mult) { mult = extra; nota = " (¡doble contra no muertos!)"; }
  const combo = porHeroe >= 0 && !!r.marca && r.marca.por !== porHeroe;
  if (combo) { r.marca = null; c.combos++; }
  dmg = mult < 1 ? Math.max(1, Math.floor(dmg * mult)) : Math.round(dmg * mult);
  if (combo) dmg = Math.round(dmg * 1.5);
  if (r.est.congelado) { dmg = Math.round(dmg * 1.5); nota += " (¡congelado!)"; }
  r.hp = Math.max(0, r.hp - dmg);
  const st = porHeroe >= 0 && S.stats && S.stats[porHeroe];
  if (st) { st.dano += dmg; st.mejor = Math.max(st.mejor, dmg); if (r.hp <= 0) st.bajas++; }
  if (clase === "arcana") r.quemado = true;
  const o = "e" + k;
  fx({ tipo: "golpe", objetivo: o });
  if (clase !== "fisica") fx({ tipo: "magia", objetivo: o, rampa: rampa || (clase === "sagrada" ? RP.bronce : RP.magia) });
  fx({ tipo: "numero", objetivo: o, texto: "-" + dmg, color: crit ? RP.bronce[4] : mult > 1 || combo ? RP.fuego[3] : "#fff7ea", grande: crit || mult > 1 || combo });
  if (combo) fx({ tipo: "numero", objetivo: o, texto: "COMBO", color: RP.bronce[4], fila: 2 });
  if (r.hp <= 0) fx({ tipo: "muerte", objetivo: o });
  else comprobarFase(k);
  return `${dmg} de daño${c.rivales.length > 1 ? ` a ${r.nombre}` : ""}${nota}${combo ? " · ¡COMBO!" : ""}${r.hp <= 0 && c.rivales.length > 1 ? " · ¡cae!" : ""}`;
}
function comprobarFase(k) {
  const c = S.combate, r = c.rivales[k], F = FASES[r.clave];
  if (!r.jefe || r.fase !== 1 || r.hp > r.hpMax / 2 || !F) return;
  r.fase = 2;
  if (F.cambia) F.cambia(r);
  log(`¡Fase 2! ${F.txt}.`, "ko");
  fx({ tipo: "destello" });
  fx({ tipo: "fase", texto: "¡Fase 2!", sub: F.txt });
  (F.invoca || []).forEach(cl => {
    if (c.rivales.length >= 3) return;
    c.rivales.push(crearRival(cl, { esbirro: true, factor: 0.4 }));
    c.orden.splice(c.pos + 1, 0, { t: "e", r: c.rivales.length - 1, ini: 0 });
  });
  nombrarRivales(c.rivales);
}
function danarHeroe(i, dmg, directo, rk = -1) {
  const p = S.players[i], c = S.combate;
  if (p.raza === "enano") dmg = Math.max(1, dmg - 1);
  if (tiene("piedra")) dmg = Math.max(1, dmg - 1);
  if (p.est && p.est.maldito) dmg += 2;
  if (p.est && p.est.congelado) dmg = Math.round(dmg * 1.5);
  p.alma = Math.max(0, p.alma - dmg);
  if (S.stats && S.stats[i]) S.stats[i].recibido += dmg;
  fx({ tipo: "golpe", objetivo: "h" + i });
  fx({ tipo: "numero", objetivo: "h" + i, texto: "-" + dmg, color: RP.sangre[4] });
  let t = `${dmg} de daño`;
  if (p.alma === 0 && p.raza === "semiorco" && !p.fl.aguante) { p.fl.aguante = true; p.alma = 1; t += `. ${p.nombre} aguanta con 1 PG`; }
  else if (p.alma === 0) { t += `. ¡${p.nombre} cae!`; if (c) c.caidos++; }
  if (directo && p.raza === "tiefling" && c && rk >= 0 && c.rivales[rk].hp > 0) {
    const r = c.rivales[rk];
    r.hp = Math.max(0, r.hp - 2);
    fx({ tipo: "numero", objetivo: "e" + rk, texto: "-2", color: RP.fuego[3], fila: 1 });
    if (r.hp <= 0) fx({ tipo: "muerte", objetivo: "e" + rk });
    t += ". Reprensión infernal: 2 de fuego";
  }
  return t;
}
/* Forma del ataque en el escenario según la clase y el tipo de daño. */
function formaAtaque(p, h) {
  if (h.tipo === "fisica") return p.clase === "explorador" ? ["flecha"] : ["tajo"];
  if (h.tipo === "sagrada") return ["luz"];
  return ["orbe", p.clase === "mago" ? RP.fuego : p.clase === "bardo" ? RP.mar : RP.magia];
}
function accion(tipo, arg) {
  if (ocupado || !S.combate || S.combate.enemigoActua || !puedoActuar()) return;
  const c = S.combate, p = S.players[S.turno], yo = "h" + S.turno;
  const arma = obj(p.equipo.arma) || {};
  const fin = () => { submenu = null; if (todosCaidos()) return victoria(); avanzar(); prepararTurno(); };
  const marcar = r => { r.marca = { por: S.turno }; };
  if (tipo === "hab") {
    const [slot, qs, ts] = String(arg).split(":");
    const q = qs === undefined || qs === "" ? 1 : +qs; /* calidad del golpe certero: 0 fuera de ritmo, 1 bien, 2 perfecto */
    const t = objetivoValido(ts === undefined ? c.objetivo : +ts);
    c.objetivo = t;
    const id = p.habs[+slot], h = id && H(id);
    if (!h || (h.usos && !(p.usosH[id] > 0))) return;
    if (h.usos) p.usosH[id]--;
    if (q === 2) { c.perfectos++; if (S.stats) S.stats[S.turno].perfectos++; }
    fx({ tipo: "anuncio", texto: h.nombre, sub: p.nombre, tono: h.efecto === "dano" ? h.tipo : h.efecto === "cura" ? "cura" : "apoyo" });
    const m = statHab(p, h);
    const blancos = h.area ? vivosR() : [t];
    const r0 = c.rivales[t], e0 = ENEMIGOS[r0.clave];
    const efectosExtra = (rr, dmg, partes) => {
      if (rr.hp <= 0) return;
      const k = c.rivales.indexOf(rr), poner = (est, t) => { if (ponerEstado(rr, est, t, false, "e" + k)) { marcar(rr); partes.push(ESTADOS[est].nombre.toLowerCase()); } };
      if (h.veneno) poner("veneno", h.veneno);
      if (h.debilita) poner("debil", 3);
      if (h.maldice) poner("maldito", 99);
      if (h.aplica && Math.random() < h.aplica[2]) poner(h.aplica[0], h.aplica[1]);
      if (h.drena && dmg > 0) { const cu = curar(p, Math.max(1, Math.floor(dmg / 2))); fx({ tipo: "cura", objetivo: yo }); partes.push(`te curas ${cu}`); }
    };
    if (h.efecto === "dano") {
      const extraArma = (h.tipo === "fisica" ? arma.fis || 0 : (arma.arc || 0) + (p.clase === "mago" && h.tipo === "arcana" ? 2 : 0))
        + (tiene("filo") && h.tipo === "fisica" ? 2 : 0) + (tiene("arcano") && h.tipo !== "fisica" ? 2 : 0);
      const ritmo = q === 2 ? " · ¡perfecto!" : q === 0 ? " · fuera de ritmo" : "";
      const [forma, rampa] = formaAtaque(p, h);
      const golpes = (crit, mult = 1) => {
        const partes = [], reparto = blancos.length > 1 ? 0.8 : 1;
        blancos.forEach(k => {
          const rr = c.rivales[k];
          if (rr.hp <= 0) return;
          fx({ tipo: forma === "tajo" ? "tajo" : "proyectil", actor: yo, objetivo: "e" + k, forma, rampa });
          const antes = rr.hp;
          for (let g = 0; g < (h.golpes || 1) && rr.hp > 0; g++)
            partes.push(danarRival(k, Math.round((tirar(h.dado[0] * (crit ? 2 : 1), h.dado[1], m + (h.bono || 0)) + extraArma) * mult * reparto), h.tipo, crit, h.noMuerto && rr.nomuerto ? h.noMuerto : 1, h.tipo === "arcana" ? rampa : undefined, S.turno));
          efectosExtra(rr, antes - rr.hp, partes);
        });
        if (crit && tiene("vampiro")) { const cu = curar(p, 4); if (cu) partes.push(`sed de sangre +${cu}`); }
        return partes.join(" · ");
      };
      fx({ tipo: "ataque", actor: yo });
      if (!h.tirada) {
        const tx = `${p.nombre} usa ${h.nombre}${ritmo} → ${golpes(q === 2, q === 2 ? 1 : q === 0 ? 0.75 : 1)}`;
        log(tx, "ok"); mostrarTirada(tx, true);
        return fin();
      }
      if (p.est.ciego && Math.random() < 0.5) {
        const tx = `${p.nombre} está cegado y su ${h.nombre} falla.`;
        fx({ tipo: "numero", objetivo: "e" + t, texto: "FALLO", color: RP.hueso[3] }); log(tx, "ko"); mostrarTirada(tx, false);
        return fin();
      }
      const mod = m + (arma.golpe || 0) + (h.tipo === "fisica" && p.clase === "explorador" ? 2 : 0) + (tiene("ojo") ? 2 : 0) - (p.est.debil ? 2 : 0);
      const bono = usarOlivo() + (q === 2 ? 5 : q === 1 ? 2 : 0);
      const { r, nota } = tiradaD20(p);
      const total0 = r + mod + bono, crit0 = r >= Math.min(critMin(p), h.critico || 20);
      const det = { tipo: "ataque", quien: p.nombre, accion: h.nombre, mod: mod + bono, total: total0, contra: `CA ${e0.ca}`, crit: crit0, ok: crit0 || (r !== 1 && total0 >= e0.ca) };
      tirarDado(r, 20, () => {
        const total = r + mod + bono, crit = r >= Math.min(critMin(p), h.critico || 20);
        const ok = crit || (r !== 1 && total >= e0.ca);
        if (crit && S.stats) S.stats[S.turno].criticos++;
        let linea = lineaTirada(p.nombre, h.nombre, r, mod, bono, total, `CA ${e0.ca}`, crit) + nota + ritmo;
        if (ok) { linea += ` → ${golpes(crit)}`; log(linea, "ok"); mostrarTirada(linea, true); }
        else { linea += " → falla"; fx({ tipo: "numero", objetivo: "e" + t, texto: "FALLO", color: RP.hueso[3] }); log(linea, "ko"); mostrarTirada(linea, false); }
        fin();
      }, det);
      return;
    }
    if (h.efecto === "cura") {
      const base = Math.max(1, tirar(h.dado[0], h.dado[1], m) + (arma.cura || 0));
      const n = p.clase === "clerigo" ? Math.ceil(base * 1.5) : base;
      const objetivos = h.a === "grupo" ? S.players : h.a === "yo" ? [p] : [masHerido()];
      const partes = objetivos.map(o => {
        const real = curar(o, n), oi = idx(o);
        if (S.stats) S.stats[S.turno].curado += real;
        if (h.regen && o.alma > 0) { o.est = o.est || {}; o.est.regen = Math.max(o.est.regen || 0, h.regen); }
        if (h.a === "grupo" || o === p) ["veneno", "quemadura", "sangrado"].forEach(k => { if (o.est) delete o.est[k]; });
        fx({ tipo: "cura", objetivo: "h" + oi }); fx({ tipo: "numero", objetivo: "h" + oi, texto: "+" + real, color: RP.hoja[4] });
        return `${o.nombre} +${real}`;
      });
      const tx = `${p.nombre} usa ${h.nombre} → ${partes.join(", ")} PG`;
      log(tx, "ok"); mostrarTirada(tx, true);
      return fin();
    }
    if (h.efecto === "escudo") { c.escudo = true; fx({ tipo: "magia", objetivo: yo }); }
    else blancos.forEach(k => {
      const rr = c.rivales[k];
      fx({ tipo: "magia", objetivo: "e" + k });
      const est = { aturde: ["paralisis", 1], maldice: ["maldito", 99], debilita: ["debil", 3], veneno: ["veneno", h.turnos] }[h.efecto];
      if (est && ponerEstado(rr, est[0], est[1], false, "e" + k)) marcar(rr);
    });
    const tx = `${p.nombre} usa ${h.nombre}${blancos.length > 1 ? "" : c.rivales.length > 1 ? ` contra ${r0.nombre}` : ""}: ${resumenHab(id, p).toLowerCase()}.`;
    log(tx, "ok"); mostrarTirada(tx, true);
    return fin();
  }
  if (tipo === "objeto") {
    const [o, ts] = String(arg).split(":");
    if (!S.zurron[o] || o === "bendicion") return;
    const t = objetivoValido(ts === undefined ? c.objetivo : +ts), r = c.rivales[t];
    S.zurron[o]--;
    if (o === "pocion" || o === "superior") {
      const q = masHerido(), qi = idx(q);
      const real = curar(q, o === "pocion" ? 8 : maxAlma(q));
      fx({ tipo: "cura", objetivo: "h" + qi }); fx({ tipo: "numero", objetivo: "h" + qi, texto: "+" + real, color: RP.hoja[4] });
      log(`${p.nombre} da ${OBJETOS[o].nombre.toLowerCase()} a ${q.nombre}: +${real} PG.`, "ok");
    }
    if (o === "fuego") { fx({ tipo: "ataque", actor: yo }); fx({ tipo: "proyectil", actor: yo, objetivo: "e" + t, forma: "orbe", rampa: RP.fuego }); log(`${p.nombre} lanza fuego de alquimista → ${danarRival(t, tirar(3, 6), "arcana", false, 1, RP.fuego, S.turno)}`, "ok"); }
    if (o === "sueno") { ponerEstado(r, "paralisis", 1, false, "e" + t); marcar(r); log(`${p.nombre} sopla polvo de sueño: ${r.nombre} se duerme un turno.`, "ok"); }
    return fin();
  }
  if (tipo === "anillo") {
    if (!S.anillo || c.anilloUsado) return;
    c.anilloUsado = true;
    c.rivales.forEach((r, k) => { if (r.hp > 0) ponerEstado(r, "paralisis", 1, false, "e" + k); });
    log(`${p.nombre} se vuelve invisible. Los enemigos no saben a quién atacar.`, "ok");
    return fin();
  }
}
function heroeAlAzarVivo() { const l = vivos(); return l.length ? l[Math.floor(Math.random() * l.length)] : -1; }
const esperar = ms => new Promise(res => setTimeout(res, RAPIDO ? 10 : reducido ? Math.min(ms, 150) : ms));
/* Bloqueo activo: cuando un ataque va a dar, el dueño del héroe tiene un momento para tocar «¡Bloquea!» (mitad de daño). */
let ventana = null;
const DURACION_BLOQUEO = () => (RAPIDO ? 300 : S && S.online ? 1600 : 900);
function ventanaBloqueo(ti) {
  const p = S.players[ti];
  if (!p || p.alma <= 0) return Promise.resolve(false);
  S.bloqueo = { i: ti, n: Date.now(), hecho: false, dur: DURACION_BLOQUEO() };
  guardar(); render();
  return new Promise(res => {
    const cerrar = () => {
      if (!ventana) return;
      clearTimeout(ventana.t); ventana = null;
      const ok = !!(S && S.bloqueo && S.bloqueo.hecho);
      if (S) S.bloqueo = null;
      res(ok);
    };
    ventana = { cerrar, t: setTimeout(cerrar, DURACION_BLOQUEO()) };
  });
}
function bloquear() {
  if (!S || !S.bloqueo || S.bloqueo.hecho) return;
  S.bloqueo.hecho = true;
  if (ventana) ventana.cerrar();
}
async function turnoEnemigo(ri) {
  const S0 = S, c = S.combate, r = c.rivales[ri], e = ENEMIGOS[r.clave], o = "e" + ri;
  const sigue = () => S === S0 && S.combate === c;
  c.enemigoActua = true; c.actua = ri;
  ocupado = true; document.body.classList.add("ocupado");
  guardar(); render();
  await esperar(450);
  if (!sigue()) return;
  const atk = r.atk + r.atkMod - (r.est.debil ? 2 : 0);
  const quemandose = !!r.est.quemadura;
  const salta = tickEstados(r, false, o);
  if (r.hp <= 0) fx({ tipo: "muerte", objetivo: o }); else comprobarFase(ri);
  if (r.hp <= 0) { /* los estados lo han rematado */ }
  else if (salta) { r.quemado = false; await esperar(350); if (!sigue()) return; }
  else {
    const cada = n => c.ronda % n === 0;
    if (r.regenera) {
      if (r.quemado || quemandose) log(`${r.nombre} no puede regenerarse: el fuego le ha cauterizado.`, "ok");
      else if (r.hp < r.hpMax) { const cu = Math.min(r.regenera, r.hpMax - r.hp); r.hp += cu; log(`${r.nombre} se regenera: +${cu} PG.`, "ko"); fx({ tipo: "cura", objetivo: o }); }
      r.quemado = false;
    }
    if (r.cura && cada(r.cura.cada) && r.hp < r.hpMax) { const cu = Math.min(r.cura.n, r.hpMax - r.hp); r.hp += cu; log(`${r.cura.txt} (+${cu} PG).`, "ko"); fx({ tipo: "cura", objetivo: o }); }
    if (r.furia && !r.partido && r.hp <= r.hpMax / 2) { r.partido = true; log(`${r.nombre} entra en furia: ataca una vez más por ronda.`, "ko"); }
    if (c.escudo) { log(`${r.nombre} ataca, pero el escudo lo para todo.`, "ok"); c.escudo = false; fx({ tipo: "ataque", actor: o }); }
    else {
      const n = r.ataques + (r.partido ? 1 : 0);
      const sp = ESPECIALES[r.clave], usaEsp = !!sp && cada(sp.cada);
      if (usaEsp) {
        fx({ tipo: "anuncio", texto: sp.nombre, sub: r.nombre, tono: "ko" });
        log(`${r.nombre} usa ${sp.nombre}.`, "ko");
        await esperar(500);
        if (!sigue()) return;
      }
      if (usaEsp && sp.todos) {
        fx({ tipo: "ataque", actor: o }); fx({ tipo: "destello", color: "rgba(255,140,60,0.3)" });
        const partes = vivos().map(i => {
          const dmg = Math.max(1, Math.round(tirar(e.dano[0], e.dano[1], e.dano[2] + (r.danoExtra || 0)) * (sp.mult || 1)));
          let tx = `${S.players[i].nombre} ${danarHeroe(i, dmg, false).split(".")[0]}`;
          if (S.players[i].alma > 0 && Math.random() < sp.estado[2] && ponerEstado(S.players[i], sp.estado[0], sp.estado[1], true, "h" + i)) tx += ` (${ESTADOS[sp.estado[0]].nombre.toLowerCase()})`;
          return tx;
        });
        log(`${sp.nombre}: ${partes.join(", ")}.`, "ko");
        render();
        await esperar(400);
        if (!sigue()) return;
      }
      for (let k = usaEsp && sp.todos ? 1 : 0; k < n; k++) {
        const ti = heroeAlAzarVivo();
        if (ti < 0) break;
        const t = S.players[ti];
        const especial = usaEsp && !sp.todos && k === 0;
        fx({ tipo: "ataque", actor: o });
        if (t.clase === "barbaro" && !t.fl.reflejos) { t.fl.reflejos = true; log(`${t.nombre} esquiva sin mirar (sentido del peligro).`, "ok"); fx({ tipo: "numero", objetivo: "h" + ti, texto: "FALLO", color: RP.hueso[3] }); await esperar(300); if (!sigue()) return; continue; }
        const rr = d(20), def = ca(t);
        const ok = (rr === 20 || (rr !== 1 && rr + atk >= def)) && !(r.est.ciego && Math.random() < 0.5);
        mostrarTirada.ultimo = rr;
        if ($("#dado")) ESCENARIO.dibujarDado($("#dado"), rr);
        if (ok) {
          let dmg = Math.max(1, Math.round((tirar(e.dano[0] * (rr === 20 ? 2 : 1), e.dano[1], e.dano[2] + (r.danoExtra || 0)) - (c.blando ? 2 : 0)) * (especial ? sp.mult || 1 : 1)));
          if (especial && sp.sinDano) dmg = 0;
          const bloq = await ventanaBloqueo(ti);
          if (!sigue()) return;
          if (bloq) { dmg = Math.max(dmg ? 1 : 0, Math.ceil(dmg / 2)); c.bloqueos++; if (S.stats) S.stats[ti].bloqueos++; fx({ tipo: "numero", objetivo: "h" + ti, texto: "BLOQUEO", color: RP.mar[4], fila: 1 }); fx({ tipo: "bloqueo" }); }
          let txt = `${especial ? sp.nombre : r.nombre} → ${t.nombre}: ${rr} ${fmt(atk)} vs CA ${def}${bloq ? " · ¡bloqueado!" : ""} → ${dmg > 0 ? danarHeroe(ti, dmg, true, ri) : "sin daño"}`;
          if (especial && t.alma > 0) [sp.estado, sp.extra].forEach(es => { if (es && Math.random() < es[2] * (bloq ? 0.5 : 1) && ponerEstado(t, es[0], es[1], true, "h" + ti)) txt += `. ${ESTADOS[es[0]].nombre}`; });
          if (r.drena && r.hp > 0) { const cu = Math.max(1, Math.floor(dmg / 2)); r.hp = Math.min(r.hpMax, r.hp + cu); txt += `. Bebe y se cura ${cu}`; }
          if (r.roba && t.oro > 0) { const rob = Math.min(r.roba, t.oro); t.oro -= rob; c.robado[ti] = (c.robado[ti] || 0) + rob; txt += `. Roba ${rob} po`; }
          log(txt, "ko"); mostrarTirada(txt, false);
        } else {
          const txt = `${r.nombre} → ${t.nombre}: ${rr} ${fmt(atk)} vs CA ${def} → falla`;
          fx({ tipo: "numero", objetivo: "h" + ti, texto: "FALLO", color: RP.hueso[3] });
          log(txt, "ok"); mostrarTirada(txt, true);
        }
        render();
        if (r.hp <= 0) break;
        await esperar(320);
        if (!sigue()) return;
      }
      if (r.hp > 0 && r.area && cada(r.area.cada)) {
        const partes = vivos().map(i => {
          fx({ tipo: "magia", objetivo: "h" + i, rampa: RP.fuego });
          const tx = `${S.players[i].nombre} ${danarHeroe(i, d(r.area.dado) + Math.floor((r.danoExtra || 0) / 2), false).split(".")[0]}`;
          if (r.areaEstado && S.players[i].alma > 0 && Math.random() < r.areaEstado[2]) ponerEstado(S.players[i], r.areaEstado[0], r.areaEstado[1], true, "h" + i);
          return tx;
        });
        fx({ tipo: "anuncio", texto: r.area.txt.replace(/^[^ ]+ /, "").replace(/^./, x => x.toUpperCase()), sub: r.nombre, tono: "ko" });
        if (partes.length) { fx({ tipo: "destello", color: "rgba(255,120,60,0.35)" }); log(`${r.area.txt}: ${partes.join(", ")}.`, "ko"); }
      }
      if (r.hp > 0 && r.estado && cada(r.estado.cada)) {
        const ti = heroeAlAzarVivo();
        if (ti >= 0) {
          const t = S.players[ti];
          if (ponerEstado(t, "paralisis", 1, true, "h" + ti)) { log(`${r.estado.txt.replace("{x}", t.nombre)}.`, "ko"); fx({ tipo: "golpe", objetivo: "h" + ti }); }
        }
      }
    }
  }
  c.enemigoActua = false; c.actua = -1;
  ocupado = false; document.body.classList.remove("ocupado");
  if (todosCaidos()) return victoria();
  if (!vivos().length) return derrota();
  avanzar(); prepararTurno();
}
function victoria() {
  const sc = S.esc, c = S.combate, principal = c.rivales[0];
  fx({ tipo: "victoria" });
  fx({ tipo: "salto", actor: "h*" });
  const extra = [];
  let robado = 0;
  S.players.forEach((p, i) => { if (c.robado[i]) { p.oro += c.robado[i]; robado += c.robado[i]; } });
  if (robado) extra.push(`+${robado} po recuperadas`);
  const pesadilla = S.dificultad === "dificil";
  S.players.forEach(p => { if (p.alma <= 0 && !pesadilla) p.alma = 1; p.est = {}; });
  if (S.players.some(p => p.clase === "bardo")) { S.players.forEach(p => { if (p.alma > 0) curar(p, 3); }); extra.push("Inspiración +3 PG"); }
  S.players.forEach(p => { if (p.clase === "brujo" && p.alma > 0) { curar(p, 4); extra.push(`Pacto: +4 PG ${p.nombre}`); } });
  if (tiene("respiro")) { S.players.forEach(p => { if (p.alma > 0) curar(p, Math.ceil(maxAlma(p) * 0.3)); }); extra.push("Segundo respiro: +30 % PG"); }
  if (c.combos) extra.push(`${c.combos} combo${c.combos > 1 ? "s" : ""}`);
  if (c.bloqueos) extra.push(`${c.bloqueos} bloqueo${c.bloqueos > 1 ? "s" : ""}`);
  /* Logros y runas (cada móvil los guarda para sí al ver el efecto). */
  if (sc.esJefe && LOGROS[principal.clave]) fx({ tipo: "logro", id: principal.clave });
  if (sc.esJefe && !c.caidos) fx({ tipo: "logro", id: "intactos" });
  if (c.perfectos >= 5) fx({ tipo: "logro", id: "certero" });
  if (c.combos >= 3) fx({ tipo: "logro", id: "combos" });
  if (principal.clave === "mimico") fx({ tipo: "logro", id: "mimico" });
  if (c.bloqueos) fx({ tipo: "bloqueos", n: c.bloqueos });
  const runas = Math.ceil((sc.esJefe ? 3 : sc.esElite ? 1 : 0) * dif().runas);
  if (runas) { fx({ tipo: "runas", n: runas }); extra.push(`+${runas} runas`); }
  S.combate = null;
  objetivoLocal = null;
  S.botin = [];
  if (sc.esJefe || sc.esElite || sc.botinSeguro || Math.random() < 0.5 + 0.15 * (c.rivales.length - 1)) S.botin.push(sacarBotin(sc.esJefe || sc.esElite));
  if (sc.esJefe || sc.esElite) ofrecerBendiciones();
  if (sc.esJefe && S.players.length >= 3) S.botin.push(sacarBotin(false));
  anunciarBotin();
  const fxV = Object.assign({}, sc.victoria.fx);
  if (c.rivales.length > 1) { fxV.oro = (fxV.oro || 0) + 4 * (c.rivales.length - 1); fxV.xp = (fxV.xp || 0) + 2 * (c.rivales.length - 1); }
  const efectos = aplicarFx(fxV).concat(extra);
  S.fase = "resultado";
  S.resultado = { ok: true, tipo: "victoria", enemigo: principal.clave, rivales: c.rivales.map(r => r.clave), linea: null, texto: sc.victoria.t, efectos };
  log(`¡Victoria contra ${c.rivales.length > 1 ? c.rivales.map(r => r.nombre).join(", ") : principal.nombre}!`, "ok");
  guardar(); render();
}
function derrota() {
  S.derrota = true;
  fx({ tipo: "derrota" });
  fx({ tipo: "runas", n: Math.max(1, Math.ceil((S.acto + 1) * dif().runas)) });
  log("Todo el grupo ha caído.", "ko");
  guardar(); render();
}

/* ---------- Iconos pixelados del mapa ---------- */
const cacheIconos = {};
function iconoNodo(tipo) {
  if (cacheIconos[tipo]) return cacheIconos[tipo];
  const g = new PX.Rejilla(14, 14), C = PX.Capa;
  if (tipo === "combate" || tipo === "elite") {
    new C(14, 14).linea(2, 2, 10, 10, 2).linea(11, 2, 3, 10, 2).pintar(g, tipo === "elite" ? RP.sangre : RP.hierro, { relieve: 1, min: 2 });
    new C(14, 14).rect(1, 9, 4, 2).rect(9, 9, 4, 2).pintar(g, RP.bronce, { plano: 3 });
    new C(14, 14).rect(1, 11, 2, 2).rect(11, 11, 2, 2).pintar(g, RP.madera, { plano: 2 });
  } else if (tipo === "evento") {
    new C(14, 14).ell(6.5, 6.5, 5.5, 5.5).pintar(g, RP.tela.azul, { relieve: 3 });
    const pinta = { set fillStyle(v) {}, fillRect: (x, y, w, h) => { for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) g.set(x + a, y + b, RP.hueso[4]); } };
    PX.texto(pinta, "?", 4, 2, RP.hueso[4], null, 2);
  } else if (tipo === "altar") {
    new C(14, 14).rect(2, 8, 10, 4).rect(3, 6, 8, 2).pintar(g, RP.piedra, { relieve: 2 });
    new C(14, 14).ell(7, 4, 2.5, 2.5).pintar(g, RP.sangre, { relieve: 2 });
    g.set(7, 1, RP.fuego[3]).set(6, 2, RP.fuego[2]).set(8, 2, RP.fuego[2]);
  } else if (tipo === "misterio") {
    new C(14, 14).ell(6.5, 6.5, 5.5, 5.5).pintar(g, RP.tela.violeta, { relieve: 3 });
    const pinta = { set fillStyle(v) {}, fillRect: (x, y, w, h) => { for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) g.set(x + a, y + b, RP.bronce[4]); } };
    PX.texto(pinta, "?", 4, 2, RP.bronce[4], null, 2);
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
function renderBloqueo() {
  const el = $("#bloqueo");
  if (!el) return;
  const b = S && S.combate && S.bloqueo, p = b && S.players[b.i];
  const mio = !!b && !b.hecho && !!p && (!S.online || p.uid === miId);
  if (!mio) { el.hidden = true; return; }
  if (el.dataset.n !== String(b.n)) {
    el.dataset.n = b.n;
    el.style.setProperty("--dur", (b.dur || 900) + "ms");
    el.querySelector("small").textContent = `¡Atacan a ${p.nombre}!`;
    el.hidden = false;
    const i = el.querySelector("i"); i.style.animation = "none"; void i.offsetWidth; i.style.animation = "";
    vibrar(25);
  }
}
function render() {
  if (S) vista = "juego";
  if (SONIDO.ctx) musica(pistaActual());
  renderBloqueo();
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
    <button type="button" class="boton sec altar" data-ui="altar">Altar de runas · ${meta().runas} ᚱ · ${Object.keys(meta().logros).length}/${Object.keys(LOGROS).length} logros</button>
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
function comenzarLocal() { sel.fin = 0; nuevaPartida(sel.heroes.map(h => JSON.parse(JSON.stringify(h))), null, sel.dif); }
function heroeEditado() { return sel.heroes[sel.online ? 0 : sel.actual]; }
function renderSeleccion() {
  if (!relojSel) relojSel = setInterval(tickSeleccion, 250);
  const h = heroeEditado();
  $("#sel-codigo").innerHTML = sel.online ? `Código <b>${esc(red.mesa || "")}</b>` : "En este móvil";
  const jugadores = sel.online ? jugadoresSala() : sel.heroes.map((x, i) => ({ id: "l" + i, heroe: x, listo: false }));
  if (!escSel) escSel = ESCENARIO.crear($("#lienzo-sel"), { observar: $("#p-seleccion"), limites: () => [$("#caja-sel").clientWidth - 12, Math.max(80, window.innerHeight * 0.17)] });
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
  /* Dificultad: la elige quien juega en local o el anfitrión; los demás ven la suya. */
  const manda = !sel.online || esHost();
  if (!manda) { const hp = red.peers.find(x => x.presence && red.doc && x.presence.id === red.doc.host); if (hp && DIFICULTADES[hp.presence.dif]) sel.dif = hp.presence.dif; }
  if (!DIFICULTADES[sel.dif]) sel.dif = "normal";
  $("#sel-dif").innerHTML = Object.keys(DIFICULTADES).map(k => `<button type="button" class="${k === sel.dif ? "sel" : ""}" data-ui="dif" data-k="${k}" ${manda ? "" : "disabled"} title="${DIFICULTADES[k].desc}">${DIFICULTADES[k].nombre}</button>`).join("");
  $("#sel-dif-desc").textContent = DIFICULTADES[sel.dif].desc + (manda ? "" : " (la elige el anfitrión)");
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
  if (leer("dym-tuto", null) === null && !modal) { escribir("dym-tuto", "1"); setTimeout(() => abrirModal({ tipo: "tuto" }), 300); }
  const enMapa = S.modo === "mapa" && !S.derrota && !S.final;
  /* Tienda, aprender habilidad y reparto de botín necesitan sitio: se oculta el escenario. */
  const vivo = !enMapa && !S.final && !S.derrota;
  const enTienda = vivo && !(S.fase === "resultado" && S.resultado) && S.esc && S.esc.tipo === "tienda";
  const enPanel = enTienda || !!S.final || (vivo && S.aprender.length > 0) || (vivo && !!S.ofertaB) || (vivo && S.fase === "resultado" && S.botin.length > 0);
  $("#p-juego").classList.toggle("modo-mapa", enMapa);
  $("#p-juego").classList.toggle("modo-panel", enPanel);
  escJuego.ajustar();
  if (!$("#dado").dataset.listo) { $("#dado").dataset.listo = "1"; ESCENARIO.dibujarDado($("#dado"), 20); }
  const acto = Math.max(0, S.acto);
  $("#barra-titulo").innerHTML = `<span class="progreso">${ACTOS.slice(0, ultimoActo() + 1).map((_, i) => `<i class="${i < acto ? "hecho" : i === acto ? "ahora" : ""}"></i>`).join("")}</span><span>Acto ${ROMANOS[acto]} · ${ACTOS[acto].nombre}</span>`;
  sincronizarEscenario();
  renderGrupo();
  if (enMapa) renderMapa(); else { $("#mapa").innerHTML = ""; renderEscena(); }
  /* Cada pantalla nueva del panel entra con una pequeña animación; en combate, aviso de turno. */
  const clave = [S.modo, S.esc && S.esc.titulo, S.fase, !!S.combate, S.aprender.length, !!S.ofertaB, S.final, S.derrota].join("|");
  if (clave !== renderJuego.clave) { renderJuego.clave = clave; const pn = $("#panel"); pn.classList.remove("entra"); void pn.offsetWidth; pn.classList.add("entra"); clearTimeout(renderJuego.te); renderJuego.te = setTimeout(() => pn.classList.remove("entra"), 450); }
  const turnoClave = S.combate && !S.combate.enemigoActua ? `${S.combate.ronda}:${S.combate.pos}` : "";
  if (turnoClave && turnoClave !== renderJuego.turno) {
    const p = S.players[S.turno];
    if (p && (!S.online || p.uid === miId)) anunciar({ texto: S.online ? "¡Tu turno!" : `Turno de ${p.nombre}`, sub: S.online ? p.nombre : "", tono: "turno" });
  }
  renderJuego.turno = turnoClave;
  const u = S.log[S.log.length - 1];
  if (u && !$("#dado-info").textContent.trim()) $("#dado-info").textContent = u.t;
}
function tipoRival(clave) { return typeof PNJ !== "undefined" && PNJ[clave] ? "pnj" : "enemigo"; }
function sincronizarEscenario() {
  const sc = S.esc;
  let rivales = [];
  const colores = o => Object.keys((o && o.est) || {}).filter(k => ESTADOS[k]).map(k => ESTADOS[k].color);
  if (S.combate) rivales = S.combate.rivales.map(r => ({ tipo: "enemigo", clave: r.clave, hp: r.hp, max: r.hpMax, estados: colores(r), aturdido: !!(r.est.paralisis || r.est.congelado), congelado: !!r.est.congelado,
    flota: r.clave === "elemental" || (r.clave === "dragon" && r.fase === 2), derrotado: r.hp <= 0 }));
  else if (S.resultado && S.resultado.tipo === "victoria") rivales = (S.resultado.rivales || [S.resultado.enemigo]).map(k => ({ tipo: "enemigo", clave: k, derrotado: true }));
  else if (sc && sc.pnj) rivales = [{ tipo: tipoRival(sc.pnj), clave: sc.pnj, flota: sc.pnj === "fantasma" }];
  const fondo = (sc && sc.fondo) || ACTOS[Math.max(0, S.acto)].fondos[0];
  escJuego.mostrar({
    fondo, rivales, objetivo: S.combate ? miObjetivo() : -1, activo: S.final || S.derrota ? -1 : S.turno, esperaRival: !!(S.combate && S.combate.enemigoActua),
    heroes: S.players.map(p => ({ look: lookDe(p), caido: p.alma <= 0, aturdido: !!(p.est && (p.est.paralisis || p.est.congelado)), estados: S.combate ? colores(p) : [] }))
  });
}
function renderGrupo() {
  if (!S) return;
  $("#grupo").innerHTML = S.players.map((p, i) => {
    const activo = i === S.turno && !S.final && !S.derrota && !(S.combate && S.combate.enemigoActua);
    const max = maxAlma(p), pct = Math.round((100 * p.alma) / max);
    const conectado = !S.online || p.uid === miId || red.peers.some(x => x.presence && x.presence.id === p.uid);
    const g = GESTOS[i] && GESTOS[i].hasta > performance.now() ? " " + GESTOS[i].clase : "";
    return `<button type="button" class="heroe${g}${activo ? " activo" : ""}${p.alma <= 0 ? " caido" : ""}${pct <= 30 && p.alma > 0 ? " grave" : ""}${conectado ? "" : " fuera"}" data-ui="ficha" data-i="${i}" aria-label="Ficha de ${esc(p.nombre)}">
      <canvas class="retrato" data-tam="28" data-look='${esc(JSON.stringify(lookDe(p)))}'></canvas>
      <span class="heroe-datos"><strong>${esc(p.nombre)}${S.online && p.uid === miId ? " (tú)" : ""}</strong>
      <span class="barra-alma"><i style="width:${pct}%"></i></span><span class="cifras"><span>${p.alma}/${max}</span><span class="nv">Nv ${p.nivel}</span></span>
      <span class="barra-xp"><i style="width:${pctXp(p)}%"></i></span>
      ${p.est && Object.keys(p.est).length ? `<span class="ests">${Object.keys(p.est).filter(k => ESTADOS[k]).map(k => `<i style="--c:${ESTADOS[k].color}" title="${ESTADOS[k].nombre}: ${ESTADOS[k].desc}">${ESTADOS[k].nombre.slice(0, 3)}</i>`).join("")}</span>` : ""}</span></button>`;
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
/* Premios y números de la partida, para presumir al final. */
function htmlResumen() {
  const st = S.stats || [];
  if (!st.length) return "";
  const premio = (titulo, campo, unidad) => {
    let i = -1, mx = 0;
    st.forEach((x, k) => { if (x && x[campo] > mx) { mx = x[campo]; i = k; } });
    return i < 0 ? "" : `<li><span>${titulo}</span><b>${esc(S.players[i].nombre)}</b><i>${mx} ${unidad}</i></li>`;
  };
  const premios = [premio("Más daño", "dano", "de daño"), premio("Mejor golpe", "mejor", "de golpe"), premio("Sanador", "curado", "PG curados"),
    premio("El muro", "bloqueos", "bloqueos"), premio("Pulso firme", "perfectos", "perfectos"), premio("Matagigantes", "bajas", "enemigos")].join("");
  const filas = S.players.map((p, k) => `<tr><td>${esc(p.nombre)}</td><td>${st[k].dano}</td><td>${st[k].curado}</td><td>${st[k].bloqueos}</td><td>${st[k].criticos}</td><td>${st[k].bajas}</td></tr>`).join("");
  return `<ul class="premios">${premios}</ul>
    <table class="tabla-stats"><thead><tr><th></th><th>Daño</th><th>Cura</th><th>Bloq.</th><th>Crít.</th><th>Bajas</th></tr></thead><tbody>${filas}</tbody></table>`;
}
function renderMapa() {
  const m = S.mapa, p = S.players[S.turno];
  const libres = m.filas[m.fila][m.col].sig;
  const mio = (turnoMio() || hayVotacion()) && !esperandoHost;
  const filas = m.filas.map((fila, f) => `<div class="fila-mapa">${fila.map((n, j) => {
    const aqui = f === m.fila && j === m.col, libre = f === m.fila + 1 && libres.includes(j);
    const vt = libre ? votosDe("nodo", j) : { n: 0 };
    const cls = `nodo n-${n.tipo}${n.hecho ? " hecho" : ""}${aqui ? " aqui" : ""}${libre ? " libre" : ""}${n.tipo === "jefe" ? " jefe" : ""}${vt.mio ? " votado" : ""}`;
    return `<button type="button" class="${cls}" data-f="${f}" data-j="${j}" ${libre && mio ? `data-juego="nodo" data-v="${j}"` : "disabled"} aria-label="${NOMBRE_NODO[n.tipo]}">
      <canvas data-icono="${n.tipo}" data-tam="${n.tipo === "jefe" ? 32 : 24}"></canvas>${vt.n ? `<span class="votos">${vt.n}</span>` : ""}</button>`;
  }).join("")}</div>`).reverse().join("");
  $("#mapa").innerHTML = `<svg class="lineas" aria-hidden="true"></svg>${filas}`;
  pintarIconos($("#mapa"));
  requestAnimationFrame(dibujarLineas);
  $("#panel").innerHTML = `${hayVotacion() ? lineaVotacion() : quienLinea(p, "Elige el camino:")}
    <p class="leyenda">${["combate", "elite", "evento", "misterio", "tesoro", "altar", "tienda", "hoguera", "jefe"].map(t => `<span><canvas data-icono="${t}" data-tam="16"></canvas>${NOMBRE_NODO[t]}</span>`).join("")}</p>`;
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
    el.innerHTML = `<p class="sello ok">Fin de la aventura${S.acto >= 4 ? " · Abismo vencido" : ""}</p><h2>${f.titulo}</h2>${parrafo(f.texto[0])}
      <ul class="epilogo">${(() => {
        /* Quien comparte destino comparte frase. */
        const grupos = {};
        S.players.forEach(x => { const k = D.ejesAlin(x.alin)[1]; (grupos[k] = grupos[k] || []).push(esc(x.nombre)); });
        return Object.keys(grupos).map(k => `<li><b>${grupos[k].length > 1 ? grupos[k].slice(0, -1).join(", ") + " y " + grupos[k].slice(-1) : grupos[k][0]}</b> ${EPILOGOS[k]}</li>`).join("");
      })()}</ul>
      ${htmlResumen()}
      ${!S.abismo ? `<p class="proxima">Bajo el tesoro algo se mueve… El Acto V, el Abismo, queda desbloqueado.</p>` : ""}
      <div class="pie">${!S.online || esHost() ? `<button type="button" class="boton" data-ui="otra">Otra aventura</button>` : `<p class="espera">¡Fin! El anfitrión puede empezar otra.</p>`}</div>`;
    return;
  }
  if (S.derrota) {
    el.innerHTML = `<h2 class="ko">Habéis caído</h2>${parrafo("Una sacerdotisa de Solara os encuentra y os devuelve a la vida. Volvéis al inicio del acto con 2 pociones y 1 poción superior de regalo.")}
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
  if (S.ofertaB) {
    el.innerHTML = `<p class="sello ok">Bendición</p><h2>Elegid una bendición para el grupo</h2>
      <p class="quien${mio ? "" : " espera"}">${mio ? `Elige <b>${esc(p.nombre)}</b>. Dura toda la aventura.` : `${esc(p.nombre)} está eligiendo en su móvil…`}</p>
      <div class="menu bendiciones">${S.ofertaB.map(k => boton(`data-juego="bendicion" data-v="${k}" data-tipo="apoyo"`, BENDICIONES[k].nombre, "", BENDICIONES[k].desc, !mio)).join("")}</div>
      ${S.bendiciones.length ? `<p class="quien">Ya tenéis: ${S.bendiciones.map(k => BENDICIONES[k].nombre).join(", ")}</p>` : ""}`;
    return;
  }
  const cab = `<h2>${sc.titulo}</h2>`;
  if (S.fase === "resultado" && S.resultado) {
    const r = S.resultado;
    const sello = r.tipo === "victoria" ? "Victoria" : r.tipo === "cofre" ? "¡Botín!" : r.tipo === "enigma" ? (r.ok ? "Correcto" : "Incorrecto") : r.linea ? (r.ok ? "Éxito" : "Fracaso") : "Hecho";
    const sigue = sc.esJefe ? (S.acto >= ultimoActo() ? "Ver el tesoro" : S.acto === 3 ? "Bajar al Abismo" : "Siguiente acto") : "Volver al mapa";
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
  /* En línea se vota: todos pueden tocar; la tirada la hace quien tiene el turno. */
  const vot = hayVotacion(), offV = vot ? esperandoHost : off;
  const conVotos = (k, v, chip) => { const vt = votosDe(k, v); return [chip, vt.n ? `${vt.n} voto${vt.n > 1 ? "s" : ""}${vt.mio ? " · tú" : ""}` : ""].filter(Boolean).join(" · "); };
  const quienV = verbo => (vot ? lineaVotacion() + `<p class="quien">Tira los dados <b>${esc(p.nombre)}</b></p>` : quienLinea(p, verbo));
  if (sc.tipo === "prueba") {
    el.innerHTML = `${cab}${parrafo(sc.texto)}${quienV("Decide")}<div class="menu">${sc.opciones.map((op, i) => {
      const chip = op.stat ? `${ABREV[op.stat]}${fmt(stat(p, op.stat) + (op.stat === "raz" && p.raza === "gnomo" ? 2 : 0))} · CD ${op.cd}` : "";
      return boton(`data-juego="op" data-v="${i}"${votosDe("op", i).mio ? ' data-votado="1"' : ""}`, op.txt, conVotos("op", i, chip), "", offV);
    }).join("")}</div>`;
    return;
  }
  if (sc.tipo === "enigma") {
    const tachada = respuestaTachada(sc);
    el.innerHTML = `${cab}${parrafo(sc.texto)}${quienV("Responde")}<div class="menu dos">${sc.respuestas.map((t, i) => boton(`data-juego="resp" data-v="${i}"${votosDe("resp", i).mio ? ' data-votado="1"' : ""}`, i === tachada ? `<s>${t}</s>` : t, conVotos("resp", i, ""), "", offV || i === tachada)).join("")}</div>`;
    return;
  }
  if (sc.tipo === "final") {
    el.innerHTML = `${cab}${parrafo(sc.texto)}${vot ? lineaVotacion() : quienLinea(p, "Decidid juntos. Elige")}<div class="menu">${sc.opciones.map(op => boton(`data-juego="final" data-v="${op.final}"${votosDe("final", op.final).mio ? ' data-votado="1"' : ""}`, op.txt, conVotos("final", op.final, ""), "", offV)).join("")}</div>`;
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
/* Qué hará el rival en su próximo turno (para poder anticiparse). */
function intencion(c, k) {
  const r = c.rivales[k], ie = c.orden.findIndex(a => a.t === "e" && a.r === k);
  const ronda = c.pos <= ie ? c.ronda : c.ronda + 1;
  const cada = n => ronda % n === 0;
  if (r.est.paralisis || r.est.congelado) return "pierde el turno";
  const n = r.ataques + (r.partido ? 1 : 0), sp = ESPECIALES[r.clave];
  const partes = [c.escudo ? "su ataque está bloqueado" : `atacará ${n === 1 ? "1 vez" : n + " veces"}`];
  if (sp && cada(sp.cada) && !c.escudo) partes.push(`usará <b>${sp.nombre}</b> (${[sp.estado, sp.extra].filter(Boolean).map(textoEstado).join(", ")}${sp.todos ? ", a todos" : ""})`);
  if (r.area && cada(r.area.cada)) partes.push("<b>¡golpe a todo el grupo!</b>");
  if (r.estado && cada(r.estado.cada)) partes.push("<b>intentará paralizar a alguien</b>");
  if (r.cura && cada(r.cura.cada) && r.hp < r.hpMax) partes.push("se curará");
  if (r.regenera) partes.push(r.quemado ? "no podrá regenerarse" : "se regenera (usa magia)");
  if (r.furia && !r.partido) partes.push("con media vida, atacará más");
  if (r.jefe && r.fase === 1 && FASES[r.clave]) partes.push("a media vida, <b>¡fase 2!</b>");
  return partes.join(" · ");
}
function renderCombate(el, sc, p, mio) {
  const c = S.combate;
  if (!c) { el.innerHTML = `<h2>${sc.titulo}</h2>`; return; }
  const t = miObjetivo(), r = c.rivales[t], e = ENEMIGOS[r.clave];
  const consumibles = ["pocion", "superior", "fuego", "sueno"].filter(k => S.zurron[k] > 0);
  const chips = [c.elite && !r.esbirro ? "Élite" : "", r.jefe && r.fase === 2 ? "Fase 2" : "", `CA ${e.ca}`, r.debil ? `Débil: ${TIPOS_DANO[r.debil]}` : "", r.resiste ? `Resiste ${TIPOS_DANO[r.resiste]}` : "",
    r.marca ? "¡Listo para combo!" : "", c.escudo ? "Escudo" : ""].filter(Boolean)
    .concat(Object.keys(r.est).filter(k => ESTADOS[k]).map(k => `<i class="est" style="--c:${ESTADOS[k].color}">${ESTADOS[k].nombre}${r.est[k] < 90 ? ` ${r.est[k]}` : ""}</i>`));
  const varios = c.rivales.length > 1;
  const lista = c.rivales.map((x, k) => `<button type="button" class="riv${k === t ? " sel" : ""}${x.hp <= 0 ? " muerto" : ""}${k === c.actua ? " actua" : ""}" ${varios && x.hp > 0 ? `data-ui="objetivo" data-k="${k}"` : `data-ui="bestia" data-k="${x.clave}"`} ${x.hp <= 0 ? "disabled" : ""}>
      <span class="rn">${esc(x.nombre)}</span><span class="barra-rival"><i style="width:${Math.round((100 * x.hp) / x.hpMax)}%"></i></span><b>${x.hp}/${x.hpMax}</b></button>`).join("");
  const orden = c.orden.map((a, k) => `<li class="${k === c.pos ? "ahora" : ""}${a.t === "e" ? " rival" : ""}${(a.t === "h" && S.players[a.i].alma <= 0) || (a.t === "e" && c.rivales[a.r].hp <= 0) ? " caido" : ""}">${esc(a.t === "e" ? c.rivales[a.r].nombre.split(",")[0] : S.players[a.i].nombre)}</li>`).join("");
  let menu;
  if (c.enemigoActua) {
    const b = S.bloqueo, q = b && S.players[b.i];
    menu = `<p class="quien espera"><b>${esc(c.actua >= 0 ? c.rivales[c.actua].nombre : e.nombre)}</b> ataca…${q && !b.hecho && S.online && q.uid !== miId ? ` ${esc(q.nombre)} puede bloquear` : ""}</p>`;
  }
  else if (submenu === "objetos" && mio) menu = `<div class="menu dos">${consumibles.map(k => boton(`data-juego="objeto" data-v="${k}"`, OBJETOS[k].nombre, `×${S.zurron[k]}`, "", false)).join("")}${boton('data-ui="volver-menu"', "Volver", "", "", false)}</div>`;
  else menu = `${quienLinea(p, "Turno de")}<div class="menu dos acciones">${p.habs.map((id, k) => {
      const h = H(id), quedan = h.usos ? p.usosH[id] || 0 : 0;
      const ef = h.efecto !== "dano" ? "" : r.debil === h.tipo || (h.noMuerto && r.nomuerto) ? "alto" : r.resiste === h.tipo ? "bajo" : "";
      const sub = resumenHab(id, p) + (h.area && varios ? ` <b class="ef area">a todos</b>` : "") + (ef === "alto" ? ` <b class="ef alto">¡Eficaz!</b>` : ef === "bajo" ? ` <b class="ef bajo">Poco eficaz</b>` : "");
      return boton(`data-juego="hab" data-v="${k}" data-tipo="${h.efecto === "dano" ? h.tipo : h.efecto === "cura" ? "cura" : "apoyo"}"${ef ? ` data-ef="${ef}"` : ""}`, h.nombre, h.usos ? `${quedan}/${h.usos}` : "∞", sub, !mio || (h.usos && quedan <= 0));
    }).join("")}</div>
    <div class="fila-extra">${boton('data-ui="objetos"', "Objetos", `${consumibles.reduce((a, k) => a + S.zurron[k], 0)}`, "", !mio || !consumibles.length)}${S.anillo ? boton('data-juego="accion" data-v="anillo"', "Anillo", c.anilloUsado ? "usado" : "×1", "", !mio || c.anilloUsado) : ""}</div>`;
  el.innerHTML = `<div class="rivales${varios ? " varios" : ""}">${lista}</div>
    <div class="rival-info">${varios ? `<span class="etiqueta">Objetivo: ${esc(r.nombre)}</span>` : ""}<span class="chips">${chips.map(x => `<span>${x}</span>`).join("")}</span><button type="button" class="info" data-ui="bestia" data-k="${r.clave}" aria-label="Ver en el bestiario">ⓘ</button></div>
    <p class="intencion"><span>Su turno:</span> ${intencion(c, t)}</p>
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
  if (modal.tipo === "altar") html = htmlAltar();
  if (modal.tipo === "tuto") html = `<h2>Cómo se juega</h2><ol class="tuto">
      <li><canvas data-icono="combate" data-tam="34"></canvas><div><b>Elige el camino</b><span>En el mapa, toca un círculo que brille. Arriba del todo espera el jefe.</span></div></li>
      <li><canvas data-icono="evento" data-tam="34"></canvas><div><b>Ataca y defiende</b><span>Toca un enemigo para apuntarle y elige una habilidad. Para en el centro de la barra para un golpe perfecto. Cuando te ataquen, toca «¡BLOQUEA!».</span></div></li>
      <li><canvas data-icono="tesoro" data-tam="34"></canvas><div><b>Sube de nivel y coge botín</b><span>Aprenderás habilidades nuevas y encontrarás objetos en cofres y enemigos. Toca un nombre para dárselo.</span></div></li>
    </ol><button type="button" class="boton" data-ui="cerrar">¡A jugar!</button>`;
  if (modal.tipo === "menu") html = `<h2>Menú</h2><div class="menu">
      ${S ? boton('data-ui="modal" data-m="cronica"', "Crónica", "", "Todo lo que ha pasado", false) : ""}
      ${boton('data-ui="modal" data-m="compendio"', "Compendio", "", "Bestiario, razas, clases y el mundo", false)}
      ${boton('data-ui="modal" data-m="ayuda"', "Cómo se juega", "", "", false)}
      ${boton('data-ui="sonido"', `Sonido y vibración: ${SONIDO.on ? "sí" : "no"}`, "", "", false)}
      ${boton('data-ui="musica"', `Música: ${MUSICA.on ? "sí" : "no"}`, "", "", false)}
      ${boton('data-ui="altar"', "Altar de runas y logros", `${meta().runas} ᚱ`, "", false)}
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
  return `<h2>Mochila</h2>${S.bendiciones.length ? `<h3>Bendiciones del grupo</h3><ul class="lista-habs">${S.bendiciones.map(k => `<li><p><b>${BENDICIONES[k].nombre}</b></p><small>${BENDICIONES[k].desc}</small></li>`).join("")}</ul><h3>Consumibles</h3>` : ""}<ul class="mochila">${CONSUMIBLES.map(k => {
    const n = S.zurron[k];
    let acc = "";
    if (libre && n > 0 && (k === "pocion" || k === "superior")) acc = S.players.map((p, i) => p.alma < maxAlma(p) ? `<button type="button" class="boton sec mini" data-juego="usar" data-v="${k}:${i}">${esc(p.nombre)}</button>` : "").join("");
    if (k === "bendicion" && n > 0 && turnoMio()) acc = `<button type="button" class="boton ${S.olivoActivo ? "" : "sec "}mini" data-juego="olivo">${S.olivoActivo ? "Preparada" : "Usar en la próxima tirada"}</button>`;
    return `<li><div><b>${OBJETOS[k].nombre} ×${n}</b><span>${OBJETOS[k].desc}</span></div><div class="acciones-mochila">${acc}</div></li>`;
  }).join("")}</ul>${S.anillo ? "<p>Anillo de invisibilidad: una vez por combate, el enemigo pierde su turno.</p>" : ""}`;
}
function htmlCompendio(pestana, k) {
  const tabs = { bestiario: "Bestiario", estados: "Estados", mundo: "Mundo", razas: "Razas", clases: "Clases" };
  let cuerpo = "";
  if (pestana === "mundo") cuerpo = LORE.mundo.map(x => `<article><h3>${x.titulo}</h3>${x.texto.map(t => `<p>${t}</p>`).join("")}</article>`).join("")
    + Object.keys(LORE.lugares).filter(i => S && S.vistos.lugares.includes(+i)).map(i => `<article><h3>${LORE.lugares[i].titulo}</h3><p>${LORE.lugares[i].texto[0]}</p></article>`).join("");
  if (pestana === "bestiario") cuerpo = Object.keys(ENEMIGOS).filter(x => (S && S.vistos.bestias.includes(x)) || x === k).map(x => {
    const e = ENEMIGOS[x];
    return `<article class="bestia${x === k ? " destacada" : ""}"><canvas class="mini" data-tam="54" data-rival="enemigo:${x}"></canvas><div><h3>${e.nombre}</h3>
      <p class="bloque-stats">${e.tipo} · VD ${e.vd} · CA ${e.ca} · PG ${e.alma}${e.resiste ? ` · resiste ${TIPOS_DANO[e.resiste]}` : ""}${e.debil ? ` · débil a ${TIPOS_DANO[e.debil]}` : ""}</p>
      <p><b>${e.rasgoDesc}</b> ${e.lore}</p></div></article>`;
  }).join("") || `<p class="espera">Aún no os habéis cruzado con ningún monstruo.</p>`;
  if (pestana === "estados") cuerpo = Object.keys(ESTADOS).map(k => `<article><h3 style="color:${ESTADOS[k].color}">${ESTADOS[k].nombre}</h3><p>${ESTADOS[k].desc}</p></article>`).join("")
    + `<article><h3>Ataques especiales</h3><p>Cada monstruo tiene uno. «Su turno» avisa cuándo lo usará y qué estado provoca.</p></article>`;
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
    <li><b>Varios enemigos:</b> toca uno para que sea tu objetivo. Si un compañero lo aturde, envenena, maldice o debilita y tú le pegas después, haces un <b>COMBO</b> (×1,5).</li>
    <li><b>Golpe certero:</b> al atacar, para la marca en el centro de la barra: +2 a la tirada, o +5 si es perfecto.</li>
    <li><b>Bloqueo:</b> cuando un ataque va a darte, aparece «¡BLOQUEA!». Tócalo a tiempo y recibes la mitad de daño.</li>
    <li><b>Jefes:</b> a media vida entran en fase 2 y cambian de táctica.</li>
    <li><b>Estados:</b> veneno, quemadura y sangrado quitan vida cada turno; parálisis y congelación hacen perder el turno; cegado falla la mitad; debilitado pega peor; maldito recibe más daño. Los ves como puntitos de color sobre cada personaje y en el Compendio.</li>
    <li><b>Votaciones:</b> en línea, el camino y las decisiones se votan (15 s). Si hay empate, gana el voto de quien tiene el turno.</li>
    <li><b>El Abismo:</b> tras matar al dragón una vez, se desbloquea un quinto acto con un jefe secreto (siempre disponible en Pesadilla).</li>
    <li><b>Runas y logros:</b> al vencer jefes, al caer y con cada logro ganas runas. Gástalas en el altar para empezar con ventajas.</li>
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
    case "bendicion": return elegirBendicion(v);
    case "bloquear": return bloquear();
    case "votar": { const [k2, v2] = String(v).split("|"); return votar(remoto || miId, k2, v2); }
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
  audio();
  const ds = b.dataset;
  if (ds.juego) {
    let k = ds.juego, v = ds.v;
    if (S && VOTABLES.has(k) && hayVotacion()) { v = `${k}|${v}`; k = "votar"; }
    if (!S || (ocupado && k !== "bloquear") || (esperandoHost && k !== "bloquear") || certeroActivo) return;
    if (k === "reintentar" ? S.online && !esHost() : !permitido(k, miId)) return;
    const mandar = (vv = v) => (S.online && !esHost() ? (k === "bloquear" ? enviarBloqueo() : enviarJugada(k, vv)) : ejecutar(k, vv));
    if (k === "bloquear") { $("#bloqueo").hidden = true; sonar("bien"); return mandar(); }
    const t = S.combate ? miObjetivo() : 0;
    if (k === "hab" && necesitaCertero(v)) return golpeCertero(q => { if (S && S.combate) mandar(`${v}:${q}:${t}`); });
    if (k === "hab") return mandar(`${v}:1:${t}`);
    if (k === "objeto") return mandar(`${v}:${t}`);
    return mandar();
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
    case "sel-anadir": { const n = heroeAlAzar(sel.heroes.length), usados = sel.heroes.map(h => h.nombre); n.nombre = NOMBRES.find(x => !usados.includes(x) && Math.random() < 0.3) || NOMBRES.find(x => !usados.includes(x)) || n.nombre; sel.heroes.push(n); } sel.actual = sel.heroes.length - 1; return renderSeleccion();
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
    case "objetivo": objetivoLocal = +ds.k; if (S && S.combate && (!S.online || esHost()) && turnoMio()) S.combate.objetivo = +ds.k; renderEscena(); return sincronizarEscenario();
    case "altar": return abrirModal({ tipo: "altar" });
    case "mejora": return comprarMejora(ds.k);
    case "dif": sel.dif = ds.k; escribir("dym-dif", ds.k); if (sel.online) publicarPresencia(); return renderSeleccion();
    case "musica": MUSICA.on = !MUSICA.on; escribir("dym-musica", MUSICA.on ? "1" : "0"); musica(pistaActual()); return renderModal();
    case "volver-menu": submenu = null; return renderEscena();
    case "cerrar": return cerrarModal();
    case "sonido": SONIDO.on = !SONIDO.on; escribir("dym-sonido", SONIDO.on ? "1" : "0"); if (SONIDO.on) sonar("cura"); return renderModal();
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

if (/^#prueba/.test(location.hash)) window.__dym = { estado: () => S, H, render: () => render(), siguienteActo: () => siguienteActo() };
render();
conectar();
})();
