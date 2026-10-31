/* Dados y Mazmorras · datos de la aventura: razas, clases, alineamientos, objetos, tiendas,
   monstruos, escenas y lore del compendio de Valdren. */
const DATOS = (() => {
  "use strict";

  /* Cuatro atributos abreviados: Fuerza cuenta también como Constitución y Sabiduría como Destreza. */
  const STATS = { raz: "Inteligencia", ani: "Fuerza", elo: "Carisma", tem: "Sabiduría" };
  const ABREV = { raz: "INT", ani: "FUE", elo: "CAR", tem: "SAB" };
  const CAPITULOS = ["El Camino del Bosque", "La Mazmorra", "El Castillo", "El Volcán"];
  const ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  /* PX acumulados necesarios para cada nivel (nivel 1 = índice 0). */
  const NIVELES = [0, 8, 18, 30, 44, 60, 78, 98, 120, 145];
  const NOMBRES = ["Aldric", "Lyra", "Borin", "Elowen", "Garrick", "Isolde", "Kael", "Mirela", "Rowan", "Sylva", "Thalor", "Vesna", "Wulfric", "Yara", "Corwin", "Ilsa"];

  const RAZAS = {
    humano: {
      nombre: "Humano", mods: { raz: 1, ani: 1, elo: 1, tem: 1 }, alma: 0,
      pasiva: "Ambición", pasivaDesc: "Gana 1 PX extra cada vez que el grupo gana PX.",
      lore: "La raza más numerosa de Valdren. Viven poco y por eso lo quieren todo ya."
    },
    elfo: {
      nombre: "Elfo", mods: { raz: 1, tem: 1 }, alma: 0,
      pasiva: "Linaje feérico", pasivaDesc: "No le afectan la parálisis, el sueño ni los encantamientos: nunca queda atrapado ni aturdido.",
      lore: "Llegaron del Reino Feérico hace milenios. No duermen: meditan cuatro horas y les basta."
    },
    enano: {
      nombre: "Enano", mods: { ani: 1, tem: 1 }, alma: 4,
      pasiva: "Resistencia enana", pasivaDesc: "Recibe 1 punto menos de daño de cada golpe (mínimo 1).",
      lore: "Mineros y herreros de las montañas. Nunca olvidan una deuda ni perdonan un agravio."
    },
    mediano: {
      nombre: "Mediano", mods: { tem: 2 }, alma: 0,
      pasiva: "Afortunado", pasivaDesc: "Si saca un 1 natural, repite la tirada.",
      lore: "Gente pequeña de las colinas. Les gustan las comidas largas, las pipas y volver a casa enteros."
    },
    semiorco: {
      nombre: "Semiorco", mods: { ani: 2 }, alma: 2,
      pasiva: "Aguante implacable", pasivaDesc: "La primera vez que cae en cada combate, se queda con 1 PG.",
      lore: "Hijos de dos pueblos que se odian. Han aprendido a no rendirse nunca."
    },
    tiefling: {
      nombre: "Tiefling", mods: { elo: 2 }, alma: 0,
      pasiva: "Reprensión infernal", pasivaDesc: "Cuando un enemigo le hiere, recibe 2 de daño de fuego de vuelta.",
      lore: "Algún antepasado hizo un trato con los Nueve Infiernos. Ellos heredaron los cuernos, la cola y la mala fama."
    },
    draconido: {
      nombre: "Dracónido", mods: { ani: 1, elo: 1 }, alma: 2,
      pasiva: "Aliento de dragón", pasivaDesc: "Al empezar cada combate, inflige 1d6 de daño arcano al enemigo.",
      lore: "Orgullosos descendientes de los dragones. Para ellos, Ignárax es una vergüenza de familia."
    },
    gnomo: {
      nombre: "Gnomo", mods: { raz: 2 }, alma: 0,
      pasiva: "Astucia gnoma", pasivaDesc: "+2 en las pruebas de Inteligencia. Con un gnomo en el grupo, los acertijos tachan una respuesta falsa.",
      lore: "Inventores, alquimistas y bromistas. Su curiosidad ha volado más laboratorios que cualquier dragón."
    }
  };

  const CLASES = {
    guerrero: {
      nombre: "Guerrero", rol: "Defensor", alma: 13, stats: { raz: 0, ani: 3, elo: -1, tem: 1 }, patron: "Valdur, señor de la guerra justa",
      hab: "Muro de escudos", habDesc: "El próximo turno del enemigo no hace daño a nadie.",
      pasiva: "Estilo defensivo", pasivaDesc: "+2 a la Clase de Armadura.",
      desc: "Veterano de mil batallas. Primero el escudo y luego las preguntas."
    },
    barbaro: {
      nombre: "Bárbaro", rol: "Atacante", alma: 14, stats: { raz: -1, ani: 3, elo: 0, tem: 1 }, patron: "Orsun, el Cazador Salvaje",
      hab: "Furia", habDesc: "Golpe seguro de 2d8 + FUE de daño físico.",
      pasiva: "Sentido del peligro", pasivaDesc: "El primer ataque que recibe en cada combate falla.",
      desc: "Viene de las tundras del norte. Habla poco y golpea mucho."
    },
    picaro: {
      nombre: "Pícaro", rol: "Astuto", alma: 9, stats: { raz: 1, ani: 2, elo: 2, tem: 0 }, patron: "Lysa, la de los Mil Caminos",
      hab: "Bomba de humo", habDesc: "El enemigo os pierde de vista y pierde su próximo turno.",
      pasiva: "Dedos largos", pasivaDesc: "Paga un 25 % menos en las tiendas.",
      desc: "Abre cerraduras, bolsillos y, si hace falta, gargantas."
    },
    explorador: {
      nombre: "Explorador", rol: "Tirador", alma: 10, stats: { raz: 1, ani: 2, elo: 0, tem: 1 }, patron: "Orsun, el Cazador Salvaje",
      hab: "Lluvia de flechas", habDesc: "Dos disparos seguros de 1d6 + FUE de daño físico.",
      pasiva: "Enemigo predilecto", pasivaDesc: "+2 a las tiradas de ataque físico.",
      desc: "Rastreador de las fronteras. Conoce cada sendero del Bosque Susurrante."
    },
    mago: {
      nombre: "Mago", rol: "Arcano", alma: 8, stats: { raz: 3, ani: -1, elo: 1, tem: 1 }, patron: "Myrrh, la Tejedora de Conjuros",
      hab: "Bola de fuego", habDesc: "2d6 + INT de daño arcano, sin tirada.",
      pasiva: "Erudición arcana", pasivaDesc: "Sus conjuros hacen 2 puntos más de daño.",
      desc: "Pasó veinte años estudiando en una torre. Ahora quiere probar lo aprendido."
    },
    brujo: {
      nombre: "Brujo", rol: "Arcano", alma: 8, stats: { raz: 1, ani: -1, elo: 3, tem: 1 }, patron: "El Príncipe sin Nombre, un archidemonio",
      hab: "Maleficio", habDesc: "El enemigo queda maldito: recibe +2 de daño de cada golpe hasta el final del combate.",
      pasiva: "Pacto oscuro", pasivaDesc: "Cada vez que el grupo gana un combate, recupera 4 PG.",
      desc: "Firmó un pacto con algo que vive entre las estrellas. Todavía no ha leído la letra pequeña."
    },
    clerigo: {
      nombre: "Clérigo", rol: "Sanador", alma: 10, stats: { raz: 0, ani: 1, elo: 0, tem: 3 }, patron: "Solara, la Dama del Alba",
      hab: "Luz sagrada", habDesc: "2d6 + SAB de daño sagrado. Los no muertos reciben el doble.",
      pasiva: "Manos sanadoras", pasivaDesc: "Sus curaciones curan un 50 % más.",
      desc: "Sacerdote de Solara. Cura heridas, bendice armas y no soporta a los no muertos."
    },
    bardo: {
      nombre: "Bardo", rol: "Apoyo", alma: 9, stats: { raz: 0, ani: 0, elo: 3, tem: 1 }, patron: "Myrrh, la Tejedora de Conjuros",
      hab: "Canción de descanso", habDesc: "Cura 1d6 + CAR a todo el grupo y levanta a los caídos.",
      pasiva: "Inspiración bárdica", pasivaDesc: "Tras cada victoria, todo el grupo recupera 3 PG.",
      desc: "Toca el laúd en todas las tabernas de Valdren. Sus canciones curan, aunque no lo parezca."
    }
  };

  /* Habilidades: cada héroe lleva como mucho 4 (como los movimientos de un Pokémon).
     efecto: dano | cura | escudo | aturde | maldice | debilita | veneno. usos: por combate (0 = sin límite). */
  const HABILIDADES = {
    golpe: { nombre: "Golpe", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 8], tirada: true, usos: 0, desc: "Ataque básico con el arma." },
    disparo: { nombre: "Disparo", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 8], tirada: true, usos: 0, desc: "Ataque básico a distancia." },
    estocada: { nombre: "Estocada", efecto: "dano", tipo: "fisica", stat: "elo", dado: [1, 8], tirada: true, usos: 0, desc: "Ataque elegante con estoque. Usa Carisma." },
    rayo: { nombre: "Rayo arcano", efecto: "dano", tipo: "arcana", stat: "raz", dado: [1, 8], tirada: true, usos: 0, desc: "Proyectil mágico básico." },
    descarga: { nombre: "Descarga sobrenatural", efecto: "dano", tipo: "arcana", stat: "elo", dado: [1, 8], tirada: true, usos: 0, desc: "Energía de tu patrón. Usa Carisma." },
    muro: { nombre: "Muro de escudos", efecto: "escudo", usos: 2, desc: "El próximo ataque enemigo no hace daño." },
    furia: { nombre: "Furia", efecto: "dano", tipo: "fisica", stat: "ani", dado: [2, 8], usos: 2, desc: "Golpe seguro y brutal." },
    humo: { nombre: "Bomba de humo", efecto: "aturde", usos: 1, desc: "El enemigo pierde su próximo turno." },
    flechas: { nombre: "Lluvia de flechas", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 6], golpes: 2, usos: 2, desc: "Dos disparos seguros." },
    bola: { nombre: "Bola de fuego", efecto: "dano", tipo: "arcana", stat: "raz", dado: [2, 6], bono: 2, area: true, usos: 2, desc: "Explosión segura que alcanza a todos los enemigos." },
    maleficio: { nombre: "Maleficio", efecto: "maldice", usos: 1, desc: "El enemigo recibe +2 de cada golpe todo el combate." },
    luz: { nombre: "Luz sagrada", efecto: "dano", tipo: "sagrada", stat: "tem", dado: [2, 6], noMuerto: 2, usos: 2, desc: "Daño seguro. Doble contra no muertos." },
    cancion: { nombre: "Canción de descanso", efecto: "cura", a: "grupo", stat: "elo", dado: [1, 6], usos: 2, desc: "Cura a todo el grupo y levanta a los caídos." },
    curar: { nombre: "Curar heridas", efecto: "cura", a: "uno", stat: "tem", dado: [1, 8], usos: 3, desc: "Cura al aliado más herido." },
    tajo: { nombre: "Tajo poderoso", efecto: "dano", tipo: "fisica", stat: "ani", dado: [2, 8], tirada: true, usos: 3, desc: "Golpe fuerte con tirada." },
    aliento: { nombre: "Segundo aliento", efecto: "cura", a: "yo", stat: "ani", dado: [1, 10], usos: 1, desc: "Te curas a ti mismo." },
    grito: { nombre: "Grito de guerra", efecto: "debilita", usos: 1, desc: "El enemigo tiene −2 para atacar todo el combate." },
    frenesi: { nombre: "Frenesí", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 8], golpes: 2, tirada: true, usos: 2, desc: "Dos golpes seguidos con tirada." },
    devastar: { nombre: "Golpe devastador", efecto: "dano", tipo: "fisica", stat: "ani", dado: [4, 8], usos: 1, desc: "Un golpe seguro enorme." },
    veneno: { nombre: "Hoja envenenada", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 6], tirada: true, veneno: 3, usos: 2, desc: "Golpe que envenena 3 turnos." },
    asesinar: { nombre: "Golpe furtivo", efecto: "dano", tipo: "fisica", stat: "ani", dado: [3, 6], tirada: true, critico: 17, usos: 2, desc: "Crítico con 17 o más." },
    danza: { nombre: "Danza de cuchillas", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 6], golpes: 3, tirada: true, usos: 1, desc: "Tres cuchilladas con tirada." },
    marca: { nombre: "Marca del cazador", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 6], maldice: true, usos: 1, desc: "Disparo seguro que maldice al enemigo (+2 daño)." },
    balsamo: { nombre: "Bálsamo silvestre", efecto: "cura", a: "uno", stat: "tem", dado: [1, 8], usos: 2, desc: "Cura al aliado más herido." },
    tormenta: { nombre: "Tormenta de flechas", efecto: "dano", tipo: "fisica", stat: "ani", dado: [3, 6], area: true, usos: 1, desc: "Lluvia segura sobre todos los enemigos." },
    escudoMag: { nombre: "Escudo mágico", efecto: "escudo", usos: 1, desc: "El próximo ataque enemigo no hace daño." },
    escarcha: { nombre: "Rayo de escarcha", efecto: "dano", tipo: "arcana", stat: "raz", dado: [1, 8], tirada: true, debilita: true, usos: 2, desc: "Daño y el enemigo queda con −2 para atacar." },
    sueno: { nombre: "Sueño", efecto: "aturde", usos: 1, desc: "El enemigo se duerme y pierde su turno." },
    meteoro: { nombre: "Lluvia de meteoros", efecto: "dano", tipo: "arcana", stat: "raz", dado: [4, 8], area: true, usos: 1, desc: "Cae sobre todos los enemigos." },
    drenar: { nombre: "Toque vampírico", efecto: "dano", tipo: "arcana", stat: "elo", dado: [2, 6], tirada: true, drena: true, usos: 2, desc: "Daño y te curas la mitad." },
    miedo: { nombre: "Susurro aterrador", efecto: "debilita", usos: 1, desc: "El enemigo tiene −2 para atacar todo el combate." },
    plaga: { nombre: "Nube de veneno", efecto: "veneno", turnos: 4, area: true, usos: 1, desc: "Envenena 4 turnos a todos los enemigos." },
    infernal: { nombre: "Fuego infernal", efecto: "dano", tipo: "arcana", stat: "elo", dado: [4, 6], usos: 1, desc: "Llamas del abismo, sin fallo." },
    plegaria: { nombre: "Plegaria de sanación", efecto: "cura", a: "grupo", stat: "tem", dado: [2, 4], usos: 1, desc: "Cura a todo el grupo y levanta a los caídos." },
    escudoFe: { nombre: "Escudo de fe", efecto: "escudo", usos: 1, desc: "El próximo ataque enemigo no hace daño." },
    orden: { nombre: "Orden divina", efecto: "aturde", usos: 1, desc: "El enemigo obedece y pierde su turno." },
    juicio: { nombre: "Juicio de Solara", efecto: "dano", tipo: "sagrada", stat: "tem", dado: [3, 6], noMuerto: 2, area: true, usos: 1, desc: "Luz sobre todos los enemigos. Doble contra no muertos." },
    burla: { nombre: "Burla cruel", efecto: "dano", tipo: "arcana", stat: "elo", dado: [1, 6], tirada: true, debilita: true, usos: 2, desc: "Daño y el enemigo queda con −2 para atacar." },
    cuna: { nombre: "Canción de cuna", efecto: "aturde", usos: 1, desc: "El enemigo se duerme y pierde su turno." },
    acorde: { nombre: "Acorde atronador", efecto: "dano", tipo: "arcana", stat: "elo", dado: [3, 6], area: true, usos: 1, desc: "Una onda de sonido que golpea a todos." }
  };
  /* Qué aprende cada clase y a qué nivel. */
  const APRENDE = {
    guerrero: { 1: ["golpe", "muro"], 2: ["tajo"], 3: ["aliento"], 5: ["grito"], 7: ["frenesi"], 9: ["devastar"] },
    barbaro: { 1: ["golpe", "furia"], 2: ["grito"], 3: ["aliento"], 5: ["frenesi"], 7: ["tajo"], 9: ["devastar"] },
    picaro: { 1: ["golpe", "humo"], 2: ["veneno"], 3: ["asesinar"], 5: ["danza"], 7: ["miedo"], 9: ["devastar"] },
    explorador: { 1: ["disparo", "flechas"], 2: ["veneno"], 3: ["marca"], 5: ["balsamo"], 7: ["frenesi"], 9: ["tormenta"] },
    mago: { 1: ["rayo", "bola"], 2: ["escudoMag"], 3: ["escarcha"], 5: ["sueno"], 7: ["miedo"], 9: ["meteoro"] },
    brujo: { 1: ["descarga", "maleficio"], 2: ["drenar"], 3: ["miedo"], 5: ["plaga"], 7: ["escarcha"], 9: ["infernal"] },
    clerigo: { 1: ["golpe", "curar", "luz"], 2: ["escudoFe"], 3: ["plegaria"], 5: ["orden"], 7: ["miedo"], 9: ["juicio"] },
    bardo: { 1: ["estocada", "cancion"], 2: ["burla"], 3: ["curar"], 5: ["cuna"], 7: ["drenar"], 9: ["acorde"] }
  };

  const ALINEAMIENTOS = {
    LB: "Legal bueno", NB: "Neutral bueno", CB: "Caótico bueno",
    LN: "Legal neutral", N: "Neutral", CN: "Caótico neutral",
    LM: "Legal malvado", NM: "Neutral malvado", CM: "Caótico malvado"
  };
  const ORDEN_ALIN = ["LB", "NB", "CB", "LN", "N", "CN", "LM", "NM", "CM"];
  /* Ejes: ética (L/N/C) y moral (B/N/M). "N" a secas es neutral en los dos. */
  function ejesAlin(c) { return c === "N" ? ["N", "N"] : [c[0], c[1]]; }
  function codigoAlin(etica, moral) { return etica === "N" && moral === "N" ? "N" : etica + moral; }
  /* paso > 0 acerca a bueno, paso < 0 a malvado. */
  function moverMoral(c, paso) {
    const [e, m] = ejesAlin(c), escala = ["M", "N", "B"];
    const i = Math.max(0, Math.min(2, escala.indexOf(m) + paso));
    return codigoAlin(e, escala[i]);
  }

  const OBJETOS = {
    pocion: { nombre: "Poción de curación", tipo: "consumible", precio: 10, desc: "Cura 8 PG al que más lo necesite." },
    superior: { nombre: "Poción de curación superior", tipo: "consumible", precio: 30, desc: "Cura todos los PG y levanta a un caído." },
    bendicion: { nombre: "Pergamino de bendición", tipo: "consumible", precio: 8, desc: "+2 a la próxima tirada del grupo." },
    fuego: { nombre: "Fuego de alquimista", tipo: "consumible", precio: 25, desc: "En combate: 3d6 de daño arcano." },
    sueno: { nombre: "Polvo de sueño", tipo: "consumible", precio: 20, desc: "En combate: el enemigo se duerme y pierde su turno." },
    posada: { nombre: "Noche en la posada", tipo: "servicio", precio: 15, desc: "Todo el grupo recupera todos sus PG." },
    espada: { nombre: "Espada larga", tipo: "arma", precio: 30, fis: 2, desc: "+2 al daño físico." },
    hacha: { nombre: "Hacha de batalla", tipo: "arma", precio: 25, golpe: 1, fis: 1, desc: "+1 para atacar y +1 al daño físico." },
    arco: { nombre: "Arco largo", tipo: "arma", precio: 35, golpe: 2, fis: 1, desc: "+2 para atacar y +1 al daño físico." },
    varita: { nombre: "Varita de proyectiles mágicos", tipo: "arma", precio: 30, arc: 2, desc: "+2 al daño arcano." },
    laud: { nombre: "Laúd encantado", tipo: "arma", precio: 40, cura: 2, arc: 1, desc: "+2 a tus curaciones y +1 al daño arcano." },
    vorpal: { nombre: "Espada vorpal", tipo: "arma", precio: 90, golpe: 1, fis: 4, desc: "+1 para atacar y +4 al daño físico." },
    baculo: { nombre: "Bastón del archimago", tipo: "arma", precio: 90, golpe: 1, arc: 4, desc: "+1 a los conjuros y +4 al daño arcano." },
    cuero: { nombre: "Cuero tachonado", tipo: "armadura", precio: 25, ca: 1, desc: "+1 a la Clase de Armadura." },
    malla: { nombre: "Cota de mallas", tipo: "armadura", precio: 50, ca: 2, desc: "+2 a la Clase de Armadura." },
    mithril: { nombre: "Armadura de mithril", tipo: "armadura", precio: 95, ca: 3, alma: 4, desc: "+3 a la CA y +4 PG máximos." },
    diadema: { nombre: "Diadema del intelecto", tipo: "talisman", precio: 40, stat: "raz", desc: "+1 a Inteligencia." },
    broche: { nombre: "Broche del orador", tipo: "talisman", precio: 40, stat: "elo", desc: "+1 a Carisma." },
    guanteletes: { nombre: "Guanteletes de fuerza de ogro", tipo: "talisman", precio: 40, stat: "ani", desc: "+1 a Fuerza." },
    amuleto: { nombre: "Amuleto de la sabiduría", tipo: "talisman", precio: 40, stat: "tem", desc: "+1 a Sabiduría." },
    botas: { nombre: "Botas aladas", tipo: "talisman", precio: 60, ca: 1, ini: 3, desc: "+1 a la CA y +3 a la iniciativa." },
    piedra: { nombre: "Piedra de la suerte", tipo: "talisman", precio: 90, critico: 19, desc: "Críticos con 19 o 20." }
  };
  /* Botín: solo se encuentra en cofres y enemigos. */
  Object.assign(OBJETOS, {
    daga: { nombre: "Daga de plata", tipo: "arma", precio: 20, golpe: 1, fis: 1, desc: "+1 para atacar y +1 al daño físico." },
    martillo: { nombre: "Martillo enano", tipo: "arma", precio: 60, golpe: 1, fis: 3, desc: "+1 para atacar y +3 al daño físico." },
    grimorio: { nombre: "Grimorio de las sombras", tipo: "arma", precio: 60, golpe: 1, arc: 3, desc: "+1 a los conjuros y +3 al daño arcano." },
    cetro: { nombre: "Cetro del alba", tipo: "arma", precio: 60, cura: 3, arc: 2, desc: "+3 a tus curaciones y +2 al daño mágico." },
    flamigera: { nombre: "Espada flamígera", tipo: "arma", precio: 120, golpe: 2, fis: 4, arc: 2, desc: "+2 para atacar, +4 físico y +2 mágico." },
    elfica: { nombre: "Cota élfica", tipo: "armadura", precio: 60, ca: 2, alma: 2, desc: "+2 a la CA y +2 PG máximos." },
    escamas: { nombre: "Armadura de escamas de dragón", tipo: "armadura", precio: 150, ca: 4, alma: 6, rareza: "legendario", desc: "+4 a la CA y +6 PG máximos." },
    sortija: { nombre: "Sortija de protección", tipo: "talisman", precio: 30, ca: 1, desc: "+1 a la Clase de Armadura." },
    capa: { nombre: "Capa élfica", tipo: "talisman", precio: 55, ca: 1, ini: 2, desc: "+1 a la CA y +2 a la iniciativa." },
    corona: { nombre: "Corona del rey muerto", tipo: "talisman", precio: 100, stat: "raz", ca: 1, desc: "+1 a Inteligencia y +1 a la CA." }
  });
  const RAREZAS = { comun: "Común", raro: "Raro", epico: "Épico", legendario: "Legendario" };
  const rareza = id => OBJETOS[id].rareza || (OBJETOS[id].precio > 80 ? "epico" : OBJETOS[id].precio > 35 ? "raro" : "comun");
  const BOTIN = [
    ["daga", "cuero", "hacha", "sortija", "espada", "diadema", "broche", "guanteletes", "amuleto", "varita"],
    ["martillo", "grimorio", "malla", "elfica", "laud", "capa", "arco", "sortija", "cetro"],
    ["martillo", "grimorio", "cetro", "elfica", "capa", "vorpal", "baculo", "corona", "mithril", "botas"],
    ["flamigera", "escamas", "vorpal", "baculo", "mithril", "piedra", "corona", "botas"]
  ];
  const RANURAS = { arma: "Arma", armadura: "Armadura", talisman: "Objeto mágico" };

  const TIENDAS = {
    villa: {
      nombre: "El bazar de Brunilda", pnj: "mercader",
      saludo: "«¿Aventureros? Entonces necesitáis de todo. Y yo tengo de todo.»",
      objetos: ["pocion", "bendicion", "posada", "espada", "hacha", "varita", "cuero", "diadema", "broche"]
    },
    gnomo: {
      nombre: "El carromato de Fizwick", pnj: "gnomo", precios: { pocion: 8 },
      saludo: "«¡Pociones recién hervidas! Solo explota una de cada diez.»",
      objetos: ["pocion", "superior", "sueno", "bendicion", "laud", "amuleto", "broche"]
    },
    forja: {
      nombre: "La forja de Durgan", pnj: "herrero",
      saludo: "«Acero enano. Si se rompe, os devuelvo el dinero. No se rompe.»",
      objetos: ["pocion", "fuego", "posada", "arco", "espada", "malla", "guanteletes", "botas"]
    },
    planar: {
      nombre: "El Mercader de los Planos", pnj: "planar",
      saludo: "«Vendo en todos los planos de existencia. Aquí, por suerte para vosotros, acepto oro.»",
      objetos: ["superior", "fuego", "sueno", "vorpal", "baculo", "mithril", "piedra"]
    }
  };

  /* Tipos de daño: fisica (armas), arcana (conjuros y fuego) y sagrada (luz divina). */
  const TIPOS_DANO = { fisica: "armas", arcana: "magia arcana", sagrada: "luz sagrada" };

  /* Monstruos. Trucos opcionales: roba (oro por golpe), furia (ataque extra bajo la mitad de PG),
     regenera (PG por turno salvo si recibió daño arcano), cura {cada, n, txt}, area {cada, dado, txt}
     y estado {cada, txt} (un héroe pierde su turno; los elfos son inmunes). */
  const ENEMIGOS = {
    rata: {
      nombre: "La plaga de ratas", tipo: "Enjambre de bestias pequeñas", alin: "Sin alineamiento", vd: "1/4",
      alma: 12, ca: 10, atk: 2, dano: [1, 4, 0], ataques: 2, ini: 2, resiste: null, debil: null,
      rasgoDesc: "Enjambre: ataca dos veces por ronda.",
      lore: "Del tamaño de un perro y con el hambre de diez. Todo sótano de taberna que se precie tiene unas cuantas."
    },
    goblin: {
      nombre: "Krug, el jefe goblin", tipo: "Humanoide pequeño (goblinoide)", alin: "Neutral malvado", vd: "1",
      alma: 18, ca: 12, atk: 3, dano: [1, 6, 1], ataques: 1, ini: 3, resiste: null, debil: null, roba: 5,
      rasgoDesc: "Ladrón: cada golpe roba hasta 5 po. Si lo vencéis, lo recuperáis.",
      lore: "Los goblins viven de asaltar caminos. Krug es el más listo de su tribu, lo cual no es mucho decir."
    },
    osolechuza: {
      nombre: "Oso-lechuza", tipo: "Monstruosidad grande", alin: "Sin alineamiento", vd: "3",
      alma: 24, ca: 12, atk: 4, dano: [1, 8, 1], ataques: 1, ini: 1, resiste: null, debil: null, furia: true,
      rasgoDesc: "Furia: por debajo de la mitad de sus PG ataca una vez más por ronda.",
      lore: "Nadie sabe qué mago loco cruzó un oso con una lechuza. Lo que sí se sabe es que no se le puede razonar."
    },
    trol: {
      nombre: "El trol del puente", tipo: "Gigante grande", alin: "Caótico malvado", vd: "5",
      alma: 26, ca: 12, atk: 4, dano: [1, 6, 0], ataques: 2, ini: 1, resiste: null, debil: "arcana", regenera: 3,
      rasgoDesc: "Regeneración: recupera 3 PG cada turno, salvo si ha recibido daño arcano (fuego) desde su último turno.",
      lore: "Los trols se regeneran de cualquier herida: se les puede cortar un brazo y les sale otro. Solo el fuego y el ácido les detienen."
    },
    esqueleto: {
      nombre: "La guardia esqueleto", tipo: "No muertos medianos", alin: "Legal malvado", vd: "2", nomuerto: true,
      alma: 22, ca: 13, atk: 4, dano: [1, 8, 0], ataques: 1, ini: 2, resiste: null, debil: "sagrada",
      cura: { cada: 2, n: 5, txt: "Los huesos de la guardia se recomponen" },
      rasgoDesc: "Se recompone: cada 2 rondas recupera 5 PG.",
      lore: "La guardia personal de los reyes de Valdren. Juraron protegerlos para siempre, y se lo tomaron al pie de la letra."
    },
    mimico: {
      nombre: "El mímico", tipo: "Monstruosidad mediana (cambiaformas)", alin: "Neutral", vd: "2",
      alma: 22, ca: 12, atk: 4, dano: [1, 8, 1], ataques: 1, ini: 1, resiste: "fisica", debil: null,
      estado: { cada: 2, txt: "{x} se queda pegado a la lengua del mímico y pierde su turno" },
      rasgoDesc: "Adhesivo: cada 2 rondas deja pegado a un héroe, que pierde su turno.",
      lore: "Se hace pasar por cofres, puertas o escaleras. Por eso los aventureros veteranos le dan una patada a todo antes de abrirlo."
    },
    liche: {
      nombre: "Malakar, el liche", tipo: "No muerto mediano", alin: "Legal malvado", vd: "6", nomuerto: true,
      alma: 32, ca: 14, atk: 5, dano: [1, 8, 0], ataques: 2, ini: 3, resiste: "arcana", debil: "sagrada",
      area: { cada: 3, dado: 6, txt: "Malakar lanza un rayo necrótico contra todo el grupo" },
      rasgoDesc: "Rayo necrótico: cada 3 rondas hiere a todo el grupo (1d6).",
      lore: "El consejero que traicionó al último rey. Guardó su alma en una filacteria para no morir nunca. Mientras exista, volverá."
    },
    cubo: {
      nombre: "Cubo gelatinoso", tipo: "Cieno grande", alin: "Sin alineamiento", vd: "2",
      alma: 28, ca: 8, atk: 4, dano: [1, 6, 2], ataques: 1, ini: -2, resiste: "fisica", debil: "arcana",
      estado: { cada: 2, txt: "El cubo engulle a {x}, que pierde su turno" },
      rasgoDesc: "Engullir: cada 2 rondas atrapa a un héroe, que pierde su turno.",
      lore: "Limpia las mazmorras de todo lo que encuentra, incluidos los aventureros. Es casi invisible hasta que lo tienes encima."
    },
    golem: {
      nombre: "El gólem de hierro", tipo: "Constructo grande", alin: "Sin alineamiento", vd: "5",
      alma: 32, ca: 14, atk: 5, dano: [1, 10, 0], ataques: 1, ini: 0, resiste: "arcana", debil: null,
      area: { cada: 3, dado: 4, txt: "El gólem suelta una nube de gas venenoso" },
      rasgoDesc: "Gas venenoso: cada 3 rondas hace 1d4 de daño a todo el grupo. Casi inmune a la magia.",
      lore: "Los enanos lo forjaron para guardar Barak-Thur. Obedece a quien tenga la llave de la forja, y la llave la tiene Ignárax."
    },
    lobo: {
      nombre: "Lobos huargos", tipo: "Manada de bestias grandes", alin: "Neutral malvado", vd: "1",
      alma: 16, ca: 12, atk: 3, dano: [1, 4, 1], ataques: 2, ini: 3, resiste: null, debil: null,
      rasgoDesc: "Manada: atacan dos veces por ronda.",
      lore: "Lobos del tamaño de un caballo que cazan en grupo. Los goblins a veces los montan."
    },
    armadura: {
      nombre: "Armadura animada", tipo: "Constructo mediano", alin: "Sin alineamiento", vd: "2",
      alma: 24, ca: 15, atk: 4, dano: [1, 8, 1], ataques: 1, ini: 0, resiste: "fisica", debil: "arcana",
      rasgoDesc: "Hueca: las armas rebotan en ella. La magia arcana la desarma.",
      lore: "Una armadura sin nadie dentro, movida por un hechizo de guardia. Patrulla el castillo desde hace siglos."
    },
    vampiro: {
      nombre: "Lord Varkhul, el vampiro", tipo: "No muerto mediano", alin: "Legal malvado", vd: "8", nomuerto: true,
      alma: 38, ca: 15, atk: 5, dano: [1, 8, 1], ataques: 2, ini: 4, resiste: null, debil: "sagrada", drena: true,
      estado: { cada: 3, txt: "Varkhul hipnotiza a {x}, que pierde su turno" },
      rasgoDesc: "Bebe sangre: se cura la mitad del daño que hace. Cada 3 rondas hipnotiza a un héroe.",
      lore: "Señor del castillo desde hace trescientos años. Ignárax le prometió el reino de los vivos."
    },
    kobold: {
      nombre: "Banda de kobolds", tipo: "Humanoides pequeños (dracónicos)", alin: "Legal malvado", vd: "1",
      alma: 20, ca: 12, atk: 4, dano: [1, 6, 1], ataques: 2, ini: 3, resiste: null, debil: null, roba: 5,
      rasgoDesc: "Rateros: cada golpe roba hasta 5 po. Si los vencéis, lo recuperáis.",
      lore: "Adoran a Ignárax como a un dios y le llevan todo lo que brilla."
    },
    elemental: {
      nombre: "Elemental de fuego", tipo: "Elemental grande", alin: "Neutral", vd: "5",
      alma: 30, ca: 13, atk: 5, dano: [1, 8, 1], ataques: 1, ini: 2, resiste: "fisica", debil: null,
      area: { cada: 2, dado: 4, txt: "El elemental estalla en llamas" },
      rasgoDesc: "Llamarada: cada 2 rondas quema a todo el grupo (1d4). Las armas apenas le hacen daño.",
      lore: "Fuego vivo escapado del Plano Elemental por las grietas del volcán."
    },
    dragon: {
      nombre: "Ignárax, el dragón rojo", tipo: "Dragón enorme", alin: "Caótico malvado", vd: "10",
      alma: 40, ca: 15, atk: 5, dano: [1, 10, 0], ataques: 2, ini: 2, resiste: "arcana", debil: null,
      area: { cada: 3, dado: 6, txt: "Ignárax escupe un torrente de fuego" },
      rasgoDesc: "Aliento de fuego: cada 3 rondas abrasa a todo el grupo (1d6).",
      lore: "El último de los grandes dragones rojos de Valdren. Durmió cien años sobre el oro de Barak-Thur y ha despertado con hambre."
    }
  };

  /* La aventura se juega por actos. Cada acto es un mapa de caminos con combates, sucesos, una tienda,
     una hoguera y un jefe al final. Los sucesos son cortos: caben en la pantalla del móvil. */
  const ACTOS = [
    { nombre: "El Camino del Bosque", fondos: ["camino", "bosque", "aldea"], enemigos: ["lobo", "rata", "goblin", "osolechuza"], jefe: "trol", fondoJefe: "puente", tienda: "villa",
      intro: "Salís de Villabruma con el encargo del concejo: matar a Ignárax. El camino cruza el Bosque Susurrante.",
      jefeTexto: "Un trol enorme vive bajo el único puente del barranco. Cobra el peaje en orejas. Solo el fuego le impide regenerarse." },
    { nombre: "La Mazmorra", fondos: ["sotano", "cripta", "mina"], enemigos: ["esqueleto", "mimico", "cubo", "rata"], jefe: "liche", fondoJefe: "cripta", tienda: "gnomo",
      intro: "Bajo las colinas está la Cripta de los Reyes Olvidados. Allí espera Malakar, el liche aliado del dragón.",
      jefeTexto: "Malakar se levanta de su trono con los ojos en llamas verdes. La luz sagrada le quema; la magia arcana, casi no." },
    { nombre: "El Castillo", fondos: ["castillo", "trono", "cripta"], enemigos: ["armadura", "esqueleto", "lobo", "mimico"], jefe: "vampiro", fondoJefe: "trono", tienda: "planar",
      intro: "El castillo de Varkhul guarda el único paso hacia el Pico Cenizo. Su señor no ha visto el sol en trescientos años.",
      jefeTexto: "Lord Varkhul despliega su capa en el salón del trono. Se cura con vuestra sangre y odia la luz sagrada." },
    { nombre: "El Volcán", fondos: ["pico", "forja", "mina"], enemigos: ["kobold", "elemental", "golem"], jefe: "dragon", fondoJefe: "guarida", tienda: "forja",
      intro: "El Pico Cenizo humea sobre las minas enanas. Arriba, Ignárax duerme sobre su oro.",
      jefeTexto: "Ignárax se levanta sobre su montaña de oro. Sus alas tapan el techo de la cueva. Es ahora o nunca." }
  ];

  /* Sucesos: tipo "prueba" (opciones con tirada o sin ella) o "enigma" (acertijo). acto: índice o null (cualquiera). */
  const EVENTOS = [
    /* Consecuencias: solo aparecen si antes se tomó cierta decisión (requiere = marca guardada). */
    { id: "mercader2", requiere: "mercader", actos: [1, 2], tipo: "prueba", pnj: "mercader", titulo: "Brunilda os reconoce",
      texto: "«¡Mis salvadores!» La mercader del carro volcado ha montado un puesto aquí. Insiste en pagaros la deuda.",
      opciones: [
        { txt: "Aceptar su regalo", stat: null, ok: { t: "Os da una poción superior y algo de su mejor género.", fx: { superior: 1, botin: true, xp: 3 } } },
        { txt: "Pedirle que guarde el favor", stat: "elo", cd: 10, ok: { t: "Sonríe y os llena las alforjas de pociones.", fx: { pocion: 3, xp: 4 } }, ko: { t: "Se ofende un poco, pero os da una poción.", fx: { pocion: 1 } } }] },
    { id: "enano2", requiere: "enano", actos: [2, 3], tipo: "prueba", pnj: "herrero", titulo: "Thrain cumple su palabra",
      texto: "El enano que liberasteis en la mazmorra os esperaba. «Una deuda es una deuda.» Ha forjado algo para vosotros.",
      opciones: [
        { txt: "Aceptar la pieza", stat: null, ok: { t: "Es una obra maestra enana. Y desde hoy luchará a vuestro lado cuando pueda.", fx: { botin: true, xp: 5, marca: "aliado" } } }] },
    { id: "castigo", requiere: "sacrilegio", actos: [2, 3], tipo: "prueba", titulo: "La ira de Solara",
      texto: "Una luz cegadora os rodea. Solara no ha olvidado las ofrendas robadas en el bosque.",
      opciones: [
        { txt: "Pedir perdón de rodillas", stat: "tem", cd: 13, ok: { t: "La luz se suaviza. Estáis perdonados.", fx: { xp: 5, almaTodos: 4, quita: "sacrilegio" } }, ko: { t: "La luz quema. Solara os marca.", fx: { maxTodos: -2, quita: "sacrilegio" } } },
        { txt: "Devolver el doble de plata", stat: null, ok: { t: "Pagáis. La luz se apaga en silencio.", fx: { oro: -20, quita: "sacrilegio" } } }] },

    { id: "mercader", acto: 0, tipo: "prueba", pnj: "mercader", titulo: "Un carro volcado",
      texto: "Una mercader herida pide ayuda junto a su carro.",
      opciones: [
        { txt: "Curarle las heridas", stat: "tem", cd: 11, ok: { t: "Se llama Brunilda y promete no olvidarlo. Os da una bolsa de monedas.", fx: { oro: 10, xp: 3, moral: 1, marca: "mercader" } }, ko: { t: "No sabéis vendarla bien, pero agradece el intento.", fx: { xp: 1 } } },
        { txt: "Registrar el carro mientras se distrae", stat: null, ok: { t: "Encontráis monedas y una poción. Ella os mira con rencor.", fx: { oro: 15, pocion: 1, moral: -1 } } },
        { txt: "Seguir el camino", stat: null, ok: { t: "Otro aventurero la ayudará. O no.", fx: {} } }] },
    { id: "santuario", acto: 0, tipo: "prueba", titulo: "Un santuario en el bosque",
      texto: "Un altar de Solara cubierto de musgo, con ofrendas de plata.",
      opciones: [
        { txt: "Rezar a Solara", stat: "tem", cd: 12, ok: { t: "Una luz cálida os cierra las heridas.", fx: { almaTodos: 4, xp: 2 } }, ko: { t: "Solara no contesta hoy.", fx: { xp: 1 } } },
        { txt: "Limpiar el altar", stat: "ani", cd: 10, ok: { t: "Debajo del musgo aparece un pergamino de bendición.", fx: { bendicion: 1, xp: 3 } }, ko: { t: "Os cortáis con las espinas.", fx: { alma: -1 } } },
        { txt: "Llevarse las ofrendas", stat: null, ok: { t: "Plata fácil. El viento se vuelve frío a vuestro paso. Solara lo ha visto.", fx: { oro: 12, alma: -2, moral: -1, marca: "sacrilegio" } } }] },
    { id: "peaje", acto: 0, tipo: "prueba", titulo: "Peaje de bandidos",
      texto: "Unos bandidos cierran el camino: «Cinco monedas cada uno».",
      opciones: [
        { txt: "Asustarlos", stat: "ani", cd: 13, ok: { t: "Huyen y se les cae la bolsa.", fx: { oro: 8, xp: 3 } }, ko: { t: "No se asustan. Os cuesta una paliza pasar.", fx: { alma: -3 } } },
        { txt: "Engañarlos", stat: "elo", cd: 12, ok: { t: "Les convencéis de que sois recaudadores del rey. Os pagan ellos.", fx: { oro: 10, xp: 3 } }, ko: { t: "No cuela. Pagáis el doble.", fx: { oro: -10 } } },
        { txt: "Pagar", stat: null, ok: { t: "Pagáis y pasáis.", fx: { oro: -5 } } }] },
    { id: "driada", acto: 0, tipo: "enigma", pnj: "driada", titulo: "El acertijo de la dríada",
      texto: "«Tengo ciudades, pero no casas; bosques, pero no árboles; ríos, pero no agua. ¿Qué soy?»",
      respuestas: ["Un sueño", "Un mapa", "Un espejo", "Una canción"], correcta: 1,
      ok: { t: "La dríada sonríe y os regala bayas curativas.", fx: { xp: 5, almaTodos: 4 } },
      ko: { t: "«Un mapa», suspira. Las raíces os hacen tropezar.", fx: { almaTodos: -2, xp: 1 } } },

    { id: "trampas", acto: 1, tipo: "prueba", titulo: "Pasillo de trampas",
      texto: "Baldosas sospechosamente limpias y un esqueleto atravesado por cuchillas.",
      opciones: [
        { txt: "Buscar los mecanismos", stat: "raz", cd: 12, ok: { t: "Desactiváis las placas una a una.", fx: { xp: 4 } }, ko: { t: "Salen dardos de las paredes.", fx: { almaTodos: -2 } } },
        { txt: "Cruzar saltando", stat: "tem", cd: 13, ok: { t: "Pasáis como bailarines.", fx: { xp: 3 } }, ko: { t: "Una cuchilla os alcanza.", fx: { alma: -3 } } },
        { txt: "Romperlas a golpes", stat: "ani", cd: 12, ok: { t: "Sutil no ha sido, pero funciona.", fx: { xp: 2 } }, ko: { t: "Las trampas aguantan más que vosotros.", fx: { alma: -2 } } }] },
    { id: "prisionero", acto: 1, tipo: "prueba", titulo: "El prisionero",
      texto: "Un enano encadenado suplica que lo liberéis antes de que vuelvan los esqueletos.",
      opciones: [
        { txt: "Romper las cadenas", stat: "ani", cd: 12, ok: { t: "Libre, Thrain os da la poción que escondía y jura devolveros el favor.", fx: { pocion: 1, xp: 3, moral: 1, marca: "enano" } }, ko: { t: "Las cadenas no ceden y os destrozáis las manos.", fx: { alma: -2 } } },
        { txt: "Forzar la cerradura", stat: "raz", cd: 12, ok: { t: "Clic. Thrain os paga con su oro escondido y jura devolveros el favor.", fx: { oro: 12, xp: 3, moral: 1, marca: "enano" } }, ko: { t: "Se rompe la ganzúa.", fx: { xp: 1 } } },
        { txt: "Dejarlo allí", stat: null, ok: { t: "Sus gritos os siguen por el pasillo.", fx: { moral: -1 } } }] },
    { id: "cofre", acto: 1, tipo: "prueba", titulo: "Un cofre con runas",
      texto: "Un cofre cerrado, cubierto de runas que brillan al acercaros.",
      opciones: [
        { txt: "Abrirlo con cuidado", stat: "raz", cd: 13, ok: { t: "Las runas se apagan. Dentro hay oro.", fx: { oro: 25 } }, ko: { t: "Las runas explotan.", fx: { almaTodos: -2 } } },
        { txt: "Romperlo a hachazos", stat: "ani", cd: 12, ok: { t: "Saltan astillas y monedas.", fx: { oro: 15 } }, ko: { t: "El cofre era más duro que el hacha.", fx: { alma: -2 } } },
        { txt: "No tocarlo", stat: null, ok: { t: "Prudente. Quizá era un mímico.", fx: { xp: 1 } } }] },
    { id: "rey", acto: 1, tipo: "enigma", pnj: "fantasma", titulo: "El fantasma del rey",
      texto: "«Cuanto más le quitas, más grande se hace. ¿Qué es?»",
      respuestas: ["Una deuda", "Un agujero", "Una sombra", "La fama"], correcta: 1,
      ok: { t: "El fantasma os bendice antes de desvanecerse.", fx: { xp: 5, bendicion: 1, almaTodos: 3 } },
      ko: { t: "«Un agujero», dice decepcionado.", fx: { xp: 1 } } },

    { id: "banquete", acto: 2, tipo: "prueba", titulo: "El banquete fantasma",
      texto: "Una mesa servida para fantasmas. La comida huele de maravilla.",
      opciones: [
        { txt: "Comer", stat: "tem", cd: 12, ok: { t: "Sabe a gloria y os repara.", fx: { almaTodos: 5 } }, ko: { t: "Era comida de muertos. Os sienta fatal.", fx: { almaTodos: -2 } } },
        { txt: "Brindar por los muertos", stat: "elo", cd: 11, ok: { t: "Los fantasmas aplauden y os dejan un regalo.", fx: { bendicion: 1, xp: 4 } }, ko: { t: "Brindáis mal. Os tiran el vino encima.", fx: { alma: -1 } } },
        { txt: "Llevarse la cubertería de plata", stat: null, ok: { t: "Plata buena. Los fantasmas no lo olvidarán.", fx: { oro: 20, moral: -1 } } }] },
    { id: "biblioteca", acto: 2, tipo: "prueba", titulo: "La biblioteca encantada",
      texto: "Los libros vuelan solos entre las estanterías.",
      opciones: [
        { txt: "Leer un grimorio", stat: "raz", cd: 13, ok: { t: "Aprendéis un conjuro antiguo.", fx: { xp: 7 } }, ko: { t: "El grimorio os muerde.", fx: { alma: -3 } } },
        { txt: "Atrapar un libro al vuelo", stat: "ani", cd: 12, ok: { t: "Entre sus páginas hay polvo de sueño.", fx: { sueno: 1, xp: 2 } }, ko: { t: "Un tomo enorme os cae en la cabeza.", fx: { alma: -2 } } }] },
    { id: "anillo", acto: 2, tipo: "prueba", pnj: "fantasma", titulo: "El anillo del rey muerto",
      texto: "Un esqueleto con corona lleva un anillo de plata. «Quien robe a los muertos, cargará con ellos», reza una inscripción.",
      opciones: [
        { txt: "Estudiar el anillo", stat: "raz", cd: 13, ok: { t: "Es de invisibilidad: una vez por combate, el enemigo pierde su turno.", fx: { anillo: true, xp: 2 } }, ko: { t: "El anillo os hiela la mano.", fx: { alma: -2 } } },
        { txt: "Arrancarle todo el oro", stat: null, ok: { t: "Oro a manos llenas. El frío de la tumba se os queda dentro.", fx: { oro: 35, maxTodos: -2, moral: -1 } } },
        { txt: "Dejar una ofrenda", stat: null, ok: { t: "El rey asiente desde la oscuridad.", fx: { oro: -5, xp: 5, moral: 1 } } }] },
    { id: "espejo", acto: 2, tipo: "enigma", titulo: "El espejo que habla",
      texto: "Un espejo os habla con vuestra voz: «Cuanto más hay, menos se ve. ¿Qué soy?»",
      respuestas: ["El humo", "La oscuridad", "Un secreto", "El viento"], correcta: 1,
      ok: { t: "El espejo se aparta y revela un pasadizo con tesoro.", fx: { oro: 15, xp: 5 } },
      ko: { t: "El espejo se ríe con vuestra risa. Da escalofríos.", fx: { almaTodos: -1 } } },

    { id: "lava", acto: 3, tipo: "prueba", titulo: "Un río de lava",
      texto: "La lava corta el camino. Hay rocas que asoman como pasaderas.",
      opciones: [
        { txt: "Saltar de roca en roca", stat: "tem", cd: 13, ok: { t: "Cruzáis sin quemaros ni una bota.", fx: { xp: 4 } }, ko: { t: "Una roca se hunde bajo vuestros pies.", fx: { almaTodos: -2 } } },
        { txt: "Buscar otro paso", stat: "raz", cd: 12, ok: { t: "Encontráis un túnel enano con monedas olvidadas.", fx: { oro: 10, xp: 3 } }, ko: { t: "Dais un rodeo larguísimo bajo el calor.", fx: { almaTodos: -1 } } }] },
    { id: "huevos", acto: 3, tipo: "prueba", titulo: "Huevos de dragón",
      texto: "Un nido con tres huevos rojos, todavía calientes.",
      opciones: [
        { txt: "Destruirlos", stat: "ani", cd: 12, ok: { t: "Ya no habrá más Ignárax.", fx: { xp: 5 } }, ko: { t: "La cáscara arde como brasas.", fx: { alma: -3 } } },
        { txt: "Llevárselos para venderlos", stat: null, ok: { t: "Valen una fortuna. Y algún día alguien los incubará.", fx: { oro: 35, moral: -1 } } },
        { txt: "Dejarlos", stat: null, ok: { t: "No es asunto vuestro.", fx: { xp: 1 } } }] },
    { id: "kobolds", acto: 3, tipo: "prueba", pnj: "planar", titulo: "Un trato extraño",
      texto: "El Mercader de los Planos aparece de la nada: «Información sobre el dragón, a buen precio».",
      opciones: [
        { txt: "Pagar 15 po por la información", stat: null, ok: { t: "Os cuenta su punto débil: odia que le hagan esperar. Os da un pergamino de bendición.", fx: { oro: -15, bendicion: 2 } } },
        { txt: "Regatear", stat: "elo", cd: 13, ok: { t: "Os lo cuenta gratis, impresionado.", fx: { bendicion: 1, xp: 4 } }, ko: { t: "Se ofende y desaparece.", fx: { xp: 1 } } }] },
    { id: "acertijo_dragon", acto: 3, tipo: "enigma", titulo: "Una voz en el humo",
      texto: "«¿Qué es más poderoso que los dioses y más malvado que los demonios? Los pobres lo tienen, los ricos lo necesitan y, si lo comes, mueres.»",
      respuestas: ["El oro", "El fuego", "Nada", "El tiempo"], correcta: 2,
      ok: { t: "La voz calla, impresionada. Sentís que vais por buen camino.", fx: { xp: 6, bendicion: 1 } },
      ko: { t: "«Nada», ríe la voz. Una lengua de fuego os roza.", fx: { almaTodos: -2 } } }
  ];

  const HOGUERA = {
    titulo: "Una hoguera", fondo: null,
    texto: "Un lugar tranquilo para acampar. ¿Qué hacéis esta noche?",
    opciones: [
      { txt: "Dormir junto al fuego", stat: null, ok: { t: "Despertáis descansados.", fx: { curaPct: 0.6 } } },
      { txt: "Entrenar hasta tarde", stat: null, ok: { t: "Cansados, pero más sabios.", fx: { xp: 6 } } },
      { txt: "Contar historias", stat: "elo", cd: 10, ok: { t: "La historia os inspira a todos.", fx: { bendicion: 1, almaTodos: 2 } }, ko: { t: "Nadie se ríe. Os vais a dormir.", fx: { almaTodos: 2 } } }
    ]
  };

  const FINALES = {
    heroes: {
      titulo: "Héroes de Villabruma",
      texto: ["Volvéis a Villabruma con carros llenos de oro. Reconstruís las casas quemadas y los enanos regresan a sus minas.",
        "Desde entonces, en el Grifo Tuerto hay una mesa reservada para vosotros y una canción que los bardos no se cansan de tocar."]
    },
    codicia: {
      titulo: "La maldición del oro",
      texto: ["Os quedáis con todo. Compráis castillos, títulos y ejércitos de criados.",
        "Pero el oro de un dragón siempre atrae a otro dragón. Dicen que algo nuevo ha empezado a crecer en el Pico Cenizo, y que ya huele vuestro tesoro."]
    }
  };
  /* Epílogo de cada héroe según su alineamiento moral. */
  const EPILOGOS = {
    B: "fundó un orfanato en Villabruma y todavía visita el Grifo Tuerto los viernes.",
    N: "siguió buscando aventuras y acabó en otra taberna, escuchando otro rumor.",
    M: "se hizo con el control del gremio de ladrones de la capital."
  };

  /* El compendio: lore del mundo (siempre visible), lugares (al llegar) y bestiario (al encontrar). */
  const LORE = {
    mundo: [
      { titulo: "Los Reinos de Valdren", texto: [
        "Valdren es una tierra de reinos pequeños separados por bosques, montañas y ruinas de imperios antiguos. Los caminos son peligrosos, las tabernas están llenas de rumores y siempre hay alguien dispuesto a pagar a un grupo de aventureros.",
        "Hace mil años, los dragones gobernaban Valdren. Los últimos fueron derrotados o se escondieron a dormir sobre su oro. Ignárax es uno de ellos, y acaba de despertar."] },
      { titulo: "Los planos", texto: [
        "Más allá del Plano Material existen otros mundos: el Reino Feérico, de donde vienen los elfos y las dríadas; el Reino de las Sombras, adonde van los muertos que no descansan; los Nueve Infiernos, de donde proceden los tieflings, y los planos elementales del fuego, el agua, el aire y la tierra.",
        "Unos pocos mercaderes viajan entre todos ellos y aceptan cualquier moneda, incluidas algunas que es mejor no preguntar."] },
      { titulo: "Los dioses", texto: [
        "Solara, la Dama del Alba, protege a los sanadores y detesta a los no muertos. Valdur es el dios de la guerra justa y de los juramentos. Myrrh, la Tejedora de Conjuros, vela por la magia arcana y la música. Orsun, el Cazador Salvaje, guía a exploradores y bárbaros. Lysa, la de los Mil Caminos, sonríe a viajeros, mercaderes y ladrones.",
        "Los brujos, en cambio, rezan a seres que no aparecen en ningún templo."] },
      { titulo: "Los alineamientos", texto: [
        "Cada aventurero se describe con dos ejes. Legal o caótico indica si respeta las normas, los juramentos y las jerarquías o si sigue su propio criterio. Bueno o malvado indica para quién trabaja: para los demás o solo para sí mismo.",
        "Las decisiones que toméis durante la aventura pueden cambiarlo."] },
      { titulo: "Tiradas, CA y desafío", texto: [
        "Toda acción arriesgada se resuelve con un d20 más el atributo que corresponda. Si iguala o supera la Clase de Dificultad (CD), sale bien. Un 20 natural es un crítico y un 1 natural, una pifia.",
        "Para golpear hay que igualar la Clase de Armadura (CA) del enemigo. Los Puntos de Golpe (PG) son la vida, y los Puntos de Experiencia (PX) os hacen subir de nivel. El Valor de Desafío (VD) del bestiario indica lo peligroso que es cada monstruo.",
        "Esta es una versión abreviada de las reglas: la Fuerza también cuenta como Constitución y la Sabiduría como Destreza para la iniciativa."] }
    ],
    lugares: {
      0: { titulo: "El Camino del Bosque", texto: ["El Bosque Susurrante, donde el Reino Feérico queda muy cerca. Los árboles hablan, las setas brillan y los goblins asaltan a los viajeros."] },
      1: { titulo: "La Mazmorra", texto: ["La Cripta de los Reyes Olvidados. Su último rey fue traicionado por Malakar, su consejero, que buscó la inmortalidad y la encontró convertido en liche."] },
      2: { titulo: "El Castillo", texto: ["La fortaleza de Lord Varkhul, un vampiro que no ha visto el sol en trescientos años. Guarda el único paso hacia el Pico Cenizo."] },
      3: { titulo: "El Volcán", texto: ["El Pico Cenizo y las minas enanas de Barak-Thur. En la cima, Ignárax duerme sobre el oro de cien reinos."] }
    }
  };

  return {
    STATS, ABREV, CAPITULOS, ROMANOS, NIVELES, NOMBRES, RAZAS, CLASES, ALINEAMIENTOS, ORDEN_ALIN,
    ejesAlin, moverMoral, HABILIDADES, APRENDE, OBJETOS, RAREZAS, rareza, BOTIN, RANURAS, TIENDAS, TIPOS_DANO, ENEMIGOS, ACTOS, EVENTOS, HOGUERA, FINALES, EPILOGOS, LORE
  };
})();
