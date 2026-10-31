/* Diálogos y Dados · datos de la aventura: razas, clases, alineamientos, objetos, tiendas,
   enemigos, escenas y lore del códice. */
const DATOS = (() => {
  "use strict";

  const STATS = { raz: "Razón", ani: "Ánimo", elo: "Elocuencia", tem: "Templanza" };
  const ABREV = { raz: "RAZ", ani: "ÁNI", elo: "ELO", tem: "TEM" };
  const CAPITULOS = ["La Caverna", "Atenas", "El Banquete", "Atlántida", "El Mundo de las Ideas"];
  const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];
  /* Sabiduría acumulada necesaria para cada nivel (nivel 1 = índice 0). */
  const NIVELES = [0, 10, 25, 45, 70, 100];
  const NOMBRES = ["Aristocles", "Diotima", "Jenofonte", "Aspasia", "Fedón", "Hiparquia", "Teeteto", "Arete", "Critón", "Axiotea", "Glaucón", "Perictíone", "Lisis", "Teano", "Cármides", "Damo"];

  const RAZAS = {
    humano: {
      nombre: "Humano", mods: { raz: 1, ani: 1, elo: 1, tem: 1 }, alma: 0,
      pasiva: "Ambición", pasivaDesc: "Gana 1 de Sabiduría extra cada vez que el grupo gana Sabiduría.",
      lore: "Los mortales de la Hélade. Viven poco, preguntan mucho y fundan ciudades por todas partes."
    },
    elfo: {
      nombre: "Elfo", mods: { raz: 1, tem: 1 }, alma: 0,
      pasiva: "Ascendencia feérica", pasivaDesc: "No le afectan la ceguera, el aturdimiento ni la petrificación, y no oye cantos de sirena.",
      lore: "Llegaron de los bosques de Arcadia antes que los dioses del Olimpo. Recuerdan cosas que los humanos ya olvidaron."
    },
    enano: {
      nombre: "Enano", mods: { ani: 1, tem: 1 }, alma: 4,
      pasiva: "Aguante enano", pasivaDesc: "Recibe 1 punto menos de daño de cada golpe (mínimo 1).",
      lore: "Herreros de las entrañas del Etna. Trabajaron en la fragua de Hefesto y no dejan que nadie lo olvide."
    },
    mediano: {
      nombre: "Mediano", mods: { tem: 2 }, alma: 0,
      pasiva: "Afortunado", pasivaDesc: "Si saca un 1 natural, repite la tirada.",
      lore: "Gente pequeña de las colinas de Beocia. Tique, la diosa de la fortuna, les tiene un cariño especial."
    },
    semiorco: {
      nombre: "Semiorco", mods: { ani: 2 }, alma: 2,
      pasiva: "Aguante implacable", pasivaDesc: "La primera vez que cae en cada combate, se queda con 1 de Alma.",
      lore: "Hijos de dos mundos que nunca los quisieron. En las palestras de Esparta aprendieron a no rendirse."
    },
    tiefling: {
      nombre: "Tiefling", mods: { elo: 2 }, alma: 0,
      pasiva: "Legado infernal", pasivaDesc: "Cuando un enemigo le hiere, recibe 2 de daño de fuego de vuelta.",
      lore: "Su sangre guarda una gota del Tártaro. Tienen cuernos, cola y una labia de abogado."
    },
    draconido: {
      nombre: "Dracónido", mods: { ani: 1, elo: 1 }, alma: 2,
      pasiva: "Aliento de dragón", pasivaDesc: "Al empezar cada combate, inflige 1d6 de daño mágico al enemigo.",
      lore: "Descienden de los dientes de dragón que Cadmo sembró en Tebas. Nacieron de la tierra ya armados."
    },
    satiro: {
      nombre: "Sátiro", mods: { elo: 1, tem: 1 }, alma: 0,
      pasiva: "Juerga de Dioniso", pasivaDesc: "El néctar y la ambrosía le curan el doble.",
      lore: "Del cortejo de Dioniso. Mitad cabra, mitad poeta, y siempre con sed."
    }
  };

  const CLASES = {
    filosofo: {
      nombre: "Filósofo", dnd: "Mago", alma: 8, stats: { raz: 3, ani: 0, elo: 1, tem: 1 }, patron: "Atenea",
      hab: "Ironía socrática", habDesc: "2d6 + RAZ de daño dialéctico, sin tirada.",
      pasiva: "Docta ignorancia", pasivaDesc: "+2 en las pruebas de Razón. Con un filósofo en el grupo, los enigmas tachan una respuesta falsa.",
      desc: "Sabe que no sabe nada, y lo usa como arma."
    },
    guardian: {
      nombre: "Guardián", dnd: "Guerrero", alma: 13, stats: { raz: 0, ani: 3, elo: -1, tem: 1 }, patron: "Ares",
      hab: "Escudo de la Polis", habDesc: "El próximo turno del enemigo no hace daño a nadie.",
      pasiva: "Falange", pasivaDesc: "+2 a la Clase de Armadura.",
      desc: "Soldado de la República ideal: valiente, leal y educado en gimnasia y música."
    },
    sofista: {
      nombre: "Sofista", dnd: "Pícaro", alma: 9, stats: { raz: 1, ani: 0, elo: 3, tem: 0 }, patron: "Hermes",
      hab: "Paradoja de Zenón", habDesc: "El enemigo se queda pensando en Aquiles y la tortuga y pierde su próximo turno.",
      pasiva: "Lengua de plata", pasivaDesc: "Paga un 25 % menos en las tiendas.",
      desc: "Cobra por enseñar a ganar cualquier discusión, tenga o no razón."
    },
    rapsoda: {
      nombre: "Rapsoda", dnd: "Bardo", alma: 10, stats: { raz: 0, ani: 1, elo: 2, tem: 1 }, patron: "Apolo y las Musas",
      hab: "Canto de las Musas", habDesc: "Cura 1d6 + ELO a todo el grupo y levanta a los caídos.",
      pasiva: "Épica", pasivaDesc: "Tras cada victoria, todo el grupo recupera 3 de Alma.",
      desc: "Recita a Homero de memoria. Platón no se fía de él."
    },
    atleta: {
      nombre: "Atleta olímpico", dnd: "Monje", alma: 11, stats: { raz: 0, ani: 2, elo: 0, tem: 2 }, patron: "Heracles",
      hab: "Pancracio", habDesc: "Golpe seguro de 2d8 + ÁNI de daño físico.",
      pasiva: "Reflejos olímpicos", pasivaDesc: "El primer ataque que recibe en cada combate falla.",
      desc: "Campeón de lucha. Dicen que Platón también lo fue, y que de ahí le viene el nombre: «el ancho»."
    },
    oraculo: {
      nombre: "Oráculo", dnd: "Clérigo", alma: 10, stats: { raz: 1, ani: 0, elo: 0, tem: 3 }, patron: "Apolo",
      hab: "Luz de Apolo", habDesc: "2d6 + TEM de daño mágico. Las criaturas de sombra reciben el doble.",
      pasiva: "Don de sanación", pasivaDesc: "Meditar cura el doble.",
      desc: "Sacerdotisa de Delfos. Sus profecías se cumplen, aunque nadie las entiende a la primera."
    },
    cazadora: {
      nombre: "Cazadora", dnd: "Explorador", alma: 10, stats: { raz: 1, ani: 2, elo: 0, tem: 1 }, patron: "Artemisa",
      hab: "Lluvia de flechas", habDesc: "Dos disparos seguros de 1d6 + ÁNI de daño físico.",
      pasiva: "Ojo de halcón", pasivaDesc: "+2 a las tiradas de ataque físico.",
      desc: "Del séquito de Artemisa. Rastrea cualquier bestia del Peloponeso."
    },
    hechicero: {
      nombre: "Hechicero", dnd: "Brujo", alma: 8, stats: { raz: 2, ani: -1, elo: 2, tem: 1 }, patron: "Hécate",
      hab: "Maldición de Hécate", habDesc: "El enemigo queda maldito: recibe +2 de daño de cada golpe hasta el final del combate.",
      pasiva: "Pacto con Hécate", pasivaDesc: "Cada vez que el grupo gana un combate, recupera 4 de Alma.",
      desc: "Hizo un pacto en una encrucijada a medianoche. Hécate cumple, pero cobra."
    }
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
    nectar: { nombre: "Néctar", tipo: "consumible", precio: 10, desc: "Cura 8 de Alma al que más lo necesite." },
    ambrosia: { nombre: "Ambrosía", tipo: "consumible", precio: 30, desc: "Cura todo el Alma y levanta a un caído." },
    olivo: { nombre: "Rama de olivo", tipo: "consumible", precio: 8, desc: "+2 a la próxima tirada del grupo." },
    fuego: { nombre: "Fuego griego", tipo: "consumible", precio: 25, desc: "En combate: 3d6 de daño mágico." },
    leteo: { nombre: "Agua del Leteo", tipo: "consumible", precio: 20, desc: "En combate: el enemigo olvida qué hacía y pierde su turno." },
    posada: { nombre: "Noche en la posada", tipo: "servicio", precio: 15, desc: "Todo el grupo recupera todo el Alma." },
    xifos: { nombre: "Xifos de bronce", tipo: "arma", precio: 30, fis: 2, desc: "+2 al daño físico." },
    lanza: { nombre: "Lanza de fresno", tipo: "arma", precio: 25, golpe: 1, fis: 1, desc: "+1 para golpear y +1 al daño físico." },
    arco: { nombre: "Arco de tejo", tipo: "arma", precio: 35, golpe: 2, fis: 1, desc: "+2 para golpear y +1 al daño físico." },
    zenon: { nombre: "Pergamino de Zenón", tipo: "arma", precio: 30, dial: 2, desc: "+2 al daño dialéctico." },
    lira: { nombre: "Lira de Orfeo", tipo: "arma", precio: 40, cura: 2, dial: 1, desc: "+2 a tus curaciones y +1 al daño dialéctico." },
    hoz: { nombre: "Hoz de Crono", tipo: "arma", precio: 90, golpe: 1, fis: 4, desc: "+1 para golpear y +4 al daño físico." },
    parmenides: { nombre: "Poema de Parménides", tipo: "arma", precio: 90, golpe: 1, dial: 4, desc: "+1 para refutar y +4 al daño dialéctico." },
    linotorax: { nombre: "Linotórax", tipo: "armadura", precio: 25, ca: 1, desc: "+1 a la Clase de Armadura." },
    coraza: { nombre: "Coraza de bronce", tipo: "armadura", precio: 50, ca: 2, desc: "+2 a la Clase de Armadura." },
    egida: { nombre: "Égida de oricalco", tipo: "armadura", precio: 95, ca: 3, alma: 4, desc: "+3 a la CA y +4 de Alma máxima." },
    lechuza: { nombre: "Lechuza de Atenea", tipo: "talisman", precio: 40, stat: "raz", desc: "+1 a Razón." },
    laurel: { nombre: "Corona de laurel", tipo: "talisman", precio: 40, stat: "elo", desc: "+1 a Elocuencia." },
    heracles: { nombre: "Brazalete de Heracles", tipo: "talisman", precio: 40, stat: "ani", desc: "+1 a Ánimo." },
    hestia: { nombre: "Amuleto de Hestia", tipo: "talisman", precio: 40, stat: "tem", desc: "+1 a Templanza." },
    sandalias: { nombre: "Sandalias aladas", tipo: "talisman", precio: 60, ca: 1, ini: 3, desc: "+1 a la CA y +3 a la iniciativa." },
    tique: { nombre: "Dado de Tique", tipo: "talisman", precio: 90, critico: 19, desc: "Críticos con 19 o 20." }
  };
  const RANURAS = { arma: "Arma", armadura: "Armadura", talisman: "Talismán" };

  const TIENDAS = {
    agora: {
      nombre: "El puesto de Demetria", pnj: "demetria",
      saludo: "«Todo lo que un héroe necesita, a precio de ágora. Y si regateas bien, a precio de sofista.»",
      objetos: ["nectar", "olivo", "posada", "xifos", "lanza", "zenon", "linotorax", "lechuza", "laurel"]
    },
    bodega: {
      nombre: "La bodega de Sileno", pnj: "sileno", precios: { nectar: 8 },
      saludo: "«¡Pasad, pasad! El vino es para los invitados, pero todo lo demás está a la venta.»",
      objetos: ["nectar", "ambrosia", "leteo", "olivo", "lira", "hestia", "laurel"]
    },
    pireo: {
      nombre: "La armería de Hefesto", pnj: "hefesto",
      saludo: "«Me echaron del Olimpo por cojo y aquí sigo, forjando lo mejor de la Hélade. Se paga en dracmas.»",
      objetos: ["nectar", "fuego", "posada", "arco", "xifos", "coraza", "heracles", "sandalias"]
    },
    bazar: {
      nombre: "El bazar de Hermes", pnj: "hermes",
      saludo: "«Soy el dios de los mercaderes, de los viajeros y de los ladrones. Elegid en cuál de los tres confiáis.»",
      objetos: ["ambrosia", "fuego", "leteo", "hoz", "parmenides", "egida", "tique"]
    }
  };

  /* Tipos de daño: fisica (golpes), dialectica (argumentos), magica (luz, fuego y hechizos). */
  const TIPOS_DANO = { fisica: "golpes", dialectica: "argumentos", magica: "magia" };

  const ENEMIGOS = {
    sombra: {
      nombre: "Sombra hambrienta", tipo: "No muerto mediano", alin: "Neutral malvado", vd: "1/2", sombra: true,
      alma: 12, ca: 10, atk: 2, dano: [1, 4, 1], ataques: 1, ini: 1, resiste: "fisica", debil: "magica",
      rasgo: "drenar", rasgoDesc: "Drena: se cura la mitad del daño que hace.",
      lore: "Una silueta de la pared que lleva tanto tiempo siendo mirada que ha empezado a tener hambre."
    },
    titiritero: {
      nombre: "El Titiritero de Sombras", tipo: "Feérico grande", alin: "Legal malvado", vd: "2", sombra: true,
      alma: 18, ca: 11, atk: 3, dano: [1, 6, 0], ataques: 1, ini: 2, resiste: "fisica", debil: "dialectica",
      rasgo: "cegar", rasgoDesc: "Teatro de sombras: cada 2 rondas ciega a un héroe (−4 a su próxima tirada).",
      lore: "Mueve las figuras delante del fuego para que los prisioneros crean que el mundo es eso. Vive de que nadie se dé la vuelta."
    },
    trasimaco: {
      nombre: "Trasímaco", tipo: "Humanoide mediano (sofista)", alin: "Legal malvado", vd: "2",
      alma: 22, ca: 12, atk: 4, dano: [1, 6, 1], ataques: 1, ini: 3, resiste: "fisica", debil: null,
      rasgo: "reafirmarse", rasgoDesc: "Se reafirma: cada 2 rondas recupera 5 de Alma gritando más fuerte.",
      lore: "Sofista de Calcedonia. En el libro I de la República sostiene que la justicia es lo que le conviene al más fuerte."
    },
    harpia: {
      nombre: "Harpías del Pireo", tipo: "Monstruosidad mediana", alin: "Caótico malvado", vd: "2",
      alma: 20, ca: 12, atk: 4, dano: [1, 6, 0], ataques: 2, ini: 4, resiste: null, debil: "fisica",
      rasgo: "robar", rasgoDesc: "Rapiña: cada golpe roba hasta 5 dracmas. Si las vencéis, lo recuperáis.",
      lore: "Las «arrebatadoras». Zeus las mandó a robarle la comida al rey Fineo. Ahora roban bolsas en el puerto."
    },
    androgino: {
      nombre: "El Andrógino", tipo: "Monstruosidad grande", alin: "Caótico neutral", vd: "3",
      alma: 26, ca: 12, atk: 4, dano: [1, 8, 0], ataques: 2, ini: 2, resiste: "dialectica", debil: "fisica",
      rasgo: "partirse", rasgoDesc: "Dos mitades: por debajo de la mitad de Alma se enfurece y ataca una vez más por ronda.",
      lore: "Según Aristófanes, los primeros humanos eran dobles y rodaban como ruedas. Zeus los partió en dos, y desde entonces cada mitad busca a la otra."
    },
    talos: {
      nombre: "Talos", tipo: "Constructo enorme", alin: "Neutral", vd: "4",
      alma: 30, ca: 14, atk: 5, dano: [1, 8, 1], ataques: 1, ini: 0, resiste: "fisica", debil: "magica",
      rasgo: "vapor", rasgoDesc: "Vapor hirviente: cada 3 rondas abrasa a todo el grupo (1d4).",
      lore: "Gigante de bronce forjado por Hefesto. Una sola vena le recorre el cuerpo, cerrada con un clavo en el tobillo."
    },
    atlas: {
      nombre: "Atlas, rey de la Atlántida", tipo: "Gigante enorme", alin: "Legal malvado", vd: "5",
      alma: 40, ca: 14, atk: 5, dano: [1, 10, 0], ataques: 2, ini: 3, resiste: null, debil: null,
      rasgo: "sismo", rasgoDesc: "Hybris: cada 3 rondas golpea el suelo y hiere a todo el grupo (1d6).",
      lore: "Hijo de Poseidón y primer rey de la isla. Su pueblo olvidó la virtud y se llenó de desmesura."
    },
    esfinge: {
      nombre: "La Esfinge", tipo: "Monstruosidad grande", alin: "Legal neutral", vd: "4",
      alma: 30, ca: 13, atk: 5, dano: [1, 8, 1], ataques: 2, ini: 3, resiste: "dialectica", debil: null,
      rasgo: "petrificar", rasgoDesc: "Mirada antigua: cada 2 rondas deja de piedra a un héroe, que pierde su turno.",
      lore: "Guardiana de los umbrales. Quien no responde a su enigma no pasa, y quien lo responde no suele volver igual."
    },
    doxa: {
      nombre: "Doxa, la Gran Opinión", tipo: "Aberración gargantuesca", alin: "Caótico neutral", vd: "7",
      alma: 46, ca: 13, atk: 5, dano: [1, 10, 0], ataques: 2, ini: 2, resiste: "fisica", debil: "dialectica",
      rasgo: "cambiar", rasgoDesc: "Cambia de forma: cada 2 rondas intercambia lo que resiste y lo que le duele.",
      lore: "Está hecha de todo lo que se repite sin pensarlo. Cuanta más gente la cree, más grande se vuelve."
    }
  };

  /* Escenas. Tipos: prueba (tirada), enigma (respuesta en grupo), combate, relato, tienda y final.
     fx: alma (quien decide), almaTodos, curarTodo, maxTodos, xp (todos), nectar, olivo, dracmas (cada héroe),
     anillo, moral (mueve el alineamiento de quien decide: +1 hacia bueno, −1 hacia malvado). */
  const ESCENAS = {
    c1_sombras: {
      cap: 0, inicio: true, tipo: "prueba", fondo: "caverna", titulo: "Las sombras en la pared",
      texto: ["Despertáis encadenados en el fondo de una caverna. Desde que nacisteis solo habéis visto sombras que bailan sobre la roca: caballos, héroes, dioses.",
        "Detrás de vosotros crepita un fuego que nunca habéis mirado. Hoy, por primera vez, uno de los grilletes cede un poco."],
      opciones: [
        { txt: "Romper las cadenas a la fuerza", stat: "ani", cd: 12,
          ok: { t: "El hierro estalla. El ruido despierta ecos por toda la caverna, pero sois libres.", fx: { xp: 2 } },
          ko: { t: "La cadena aguanta y os desgarra las muñecas antes de ceder por fin.", fx: { alma: -2 } } },
        { txt: "Deducir qué hay detrás de las sombras", stat: "raz", cd: 11,
          ok: { t: "Si las sombras tiemblan cuando tiembla el fuego, hay algo detrás. Palpáis el grillete y encontráis su cierre oxidado.", fx: { xp: 3 } },
          ko: { t: "Pasáis horas convencidos de que las sombras son lo único real. El frío de la roca os cala a todos.", fx: { almaTodos: -1, xp: 1 } } },
        { txt: "Convencer a los demás prisioneros de que os ayuden", stat: "elo", cd: 12,
          ok: { t: "Un viejo prisionero os presta un clavo que guardaba desde hace años, y una vasija de néctar escondida.", fx: { nectar: 1, xp: 2 } },
          ko: { t: "Los prisioneros se burlan: «¡Ahí fuera solo hay más sombras!». Os tiran piedras hasta que os soltáis solos.", fx: { alma: -2 } } }
      ],
      sig: "c1_sombra"
    },
    c1_sombra: {
      cap: 0, tipo: "combate", fondo: "caverna", titulo: "Una sombra con hambre", enemigo: "sombra",
      texto: ["Al moveros, una de las siluetas de la pared se despega de la roca. Tiene forma de hombre, pero camina a cuatro patas.",
        "Lleva tanto tiempo siendo mirada que ha empezado a tener hambre."],
      victoria: { t: "La sombra se deshace como humo frío. Donde estaba queda un frasco de néctar que algún prisionero escondió hace siglos.", fx: { xp: 3, nectar: 1, dracmas: 5 } },
      sig: "c1_subida"
    },
    c1_subida: {
      cap: 0, tipo: "prueba", fondo: "salida", titulo: "La cuesta hacia la luz",
      texto: ["Al giraros, el fuego os ciega. Más allá hay un pasadizo empinado que sube hacia una claridad dolorosa.",
        "Los ojos necesitan tiempo para acostumbrarse a la verdad."],
      opciones: [
        { txt: "Trepar a toda velocidad", stat: "ani", cd: 13,
          ok: { t: "Llegáis arriba jadeando, con los ojos llorosos pero enteros.", fx: { xp: 2 } },
          ko: { t: "Resbaláis en la roca húmeda y rodáis varios metros cuesta abajo.", fx: { alma: -3 } } },
        { txt: "Subir despacio, dejando que la vista se adapte", stat: "tem", cd: 11,
          ok: { t: "La paciencia es la virtud de un alma ordenada. Llegáis descansados.", fx: { xp: 3, almaTodos: 1 } },
          ko: { t: "Os impacientáis a mitad de camino y acabáis subiendo a ciegas.", fx: { alma: -1 } } },
        { txt: "Mirar primero los reflejos en los charcos", stat: "raz", cd: 12,
          ok: { t: "Primero los reflejos, luego las cosas, luego el sol. Junto a la salida encontráis una rama de olivo.", fx: { xp: 3, olivo: 1 } },
          ko: { t: "Miráis directamente al sol. Error de principiante.", fx: { alma: -2 } } }
      ],
      sig: "c1_titiritero"
    },
    c1_titiritero: {
      cap: 0, tipo: "combate", fondo: "salida", titulo: "El Titiritero de Sombras", enemigo: "titiritero",
      texto: ["Un ser larguísimo os corta el paso con sus figuras de madera. Si la gente ve el sol, se le acaba el espectáculo, y no piensa permitirlo."],
      victoria: { t: "Le demostráis que sus figuras son copias de copias. El Titiritero se deshace y suelta su bolsa: los prisioneros le pagaban sin saberlo.", fx: { xp: 5, dracmas: 15, nectar: 1 } },
      sig: "c1_sol"
    },
    c1_sol: {
      cap: 0, tipo: "relato", fondo: "superficie", titulo: "El sol",
      texto: ["Salís a la superficie. Todo es más nítido de lo que imaginabais: los árboles tienen color y el agua refleja el cielo.",
        "Lo de abajo era una copia pobre de esto. A lo lejos brillan las murallas de Atenas y, sobre su colina, el Partenón."],
      fx: { curarTodo: true, xp: 2 }, boton: "Caminar hacia Atenas", sig: "c2_agora"
    },

    c2_agora: {
      cap: 1, inicio: true, tipo: "tienda", fondo: "agora", pnj: "demetria", tienda: "agora", titulo: "El Ágora",
      texto: ["Atenas hierve. En el Ágora se mezclan mercaderes, sacerdotes, charlatanes y algún que otro filósofo descalzo.",
        "Demetria, la mercader más lista de la Stoa, os hace señas desde su puesto. Cada héroe pasa por el mostrador con sus propias dracmas."],
      sig: "c2_menon"
    },
    c2_menon: {
      cap: 1, tipo: "prueba", fondo: "agora", pnj: "muchacho", titulo: "El esclavo de Menón",
      texto: ["Junto a una fuente, un muchacho esclavo dibuja cuadrados en la arena. Su amo, Menón, dice que es incapaz de aprender nada.",
        "Pero Sócrates decía que saber es recordar. Quizá el chico ya lo sepa y solo haya que preguntarle bien."],
      opciones: [
        { txt: "Enseñarle a duplicar un cuadrado solo con preguntas", stat: "raz", cd: 12,
          ok: { t: "Sin darle la respuesta, pregunta tras pregunta, el muchacho descubre que la diagonal es la clave. Su amo, avergonzado, os paga.", fx: { xp: 4, dracmas: 10, moral: 1 } },
          ko: { t: "Os liáis con las diagonales y el muchacho acaba enseñándoos a vosotros.", fx: { xp: 2 } } },
        { txt: "Regatear con un vendedor de ánforas de néctar", stat: "elo", cd: 11,
          ok: { t: "Le convencéis de que la virtud del comercio es el precio justo. Os lleváis dos ánforas.", fx: { nectar: 2 } },
          ko: { t: "Salís con un ánfora vacía y la bolsa más ligera.", fx: { dracmas: -5 } } },
        { txt: "Echar un pulso a un hoplita borracho", stat: "ani", cd: 13,
          ok: { t: "El hoplita acaba con el brazo en la mesa y paga la apuesta entre risas.", fx: { dracmas: 15, xp: 2 } },
          ko: { t: "El hoplita gana y, para celebrarlo, os da un abrazo que os cruje las costillas.", fx: { alma: -3 } } }
      ],
      sig: "c2_trasimaco"
    },
    c2_trasimaco: {
      cap: 1, tipo: "combate", fondo: "agora", titulo: "Trasímaco el Sofista", enemigo: "trasimaco",
      texto: ["Salta a vuestro paso como una fiera: «¡La justicia no es más que lo que le conviene al más fuerte!». Sus discípulos os rodean.",
        "Darle un puñetazo solo le daría la razón."],
      victoria: { t: "Trasímaco se pone rojo y se calla, cosa que nadie en Atenas había visto antes. Sus discípulos os pagan para que les deis clase.", fx: { xp: 6, dracmas: 15 } },
      sig: "c2_giges"
    },
    c2_giges: {
      cap: 1, tipo: "prueba", fondo: "pireo", pnj: "pastor", titulo: "El anillo de Giges",
      texto: ["Al caer la tarde, en los muelles del Pireo, un pastor lidio os enseña un anillo de oro. «Si giras el engaste, nadie te ve», susurra.",
        "Con él podríais entrar en el tesoro del tirano sin ser vistos. Nadie lo sabría nunca, salvo vuestra alma."],
      opciones: [
        { txt: "Usarlo para saquear el tesoro del tirano", stat: null,
          ok: { t: "Volvéis cargados de oro. Pero esa noche nadie duerme bien: un alma injusta está en guerra consigo misma.", fx: { dracmas: 40, maxTodos: -2, moral: -1 } } },
        { txt: "Arrojarlo al mar", stat: "tem", cd: 13,
          ok: { t: "Ser justo cuando nadie te ve: esa es la prueba de verdad. El anillo se hunde y os sentís más ligeros.", fx: { xp: 6, moral: 1 } },
          ko: { t: "El anillo os quema en la mano y cuesta soltarlo. Al final cae al agua, pero algo vuestro se va con él.", fx: { alma: -2, xp: 2 } } },
        { txt: "Estudiar su magia y usarla solo contra el mal", stat: "raz", cd: 14,
          ok: { t: "Comprendéis su mecanismo. Una vez por combate podréis volveros invisibles y confundir al enemigo.", fx: { anillo: true, xp: 2 } },
          ko: { t: "Os volvéis invisibles sin querer y tardáis horas en volver. El pastor desaparece con el anillo.", fx: { alma: -2 } } }
      ],
      sig: "c2_harpias"
    },
    c2_harpias: {
      cap: 1, tipo: "combate", fondo: "pireo", titulo: "Harpías en el puerto", enemigo: "harpia",
      texto: ["Un graznido rasga el aire. Una bandada de harpías se lanza sobre los muelles arrancando bolsas, cestas y algún que otro sombrero.",
        "Van directas a vuestras dracmas."],
      victoria: { t: "Las harpías huyen chillando hacia el mar y sueltan todo lo robado. Entre el botín hay una rama de olivo de Delfos.", fx: { xp: 6, olivo: 1, dracmas: 5 } },
      sig: "c3_banquete"
    },

    c3_banquete: {
      cap: 2, inicio: true, tipo: "prueba", fondo: "banquete", pnj: "alcibiades", titulo: "La casa de Agatón",
      texto: ["Agatón celebra su victoria en el teatro. Los invitados, coronados de hiedra, se recuestan en los divanes.",
        "De pronto irrumpe Alcibíades, borracho, y exige que alguien se beba con él una crátera entera."],
      opciones: [
        { txt: "Beber sin perder la compostura, como Sócrates", stat: "tem", cd: 13,
          ok: { t: "Al amanecer seguís hablando de filosofía mientras Alcibíades ronca bajo la mesa.", fx: { xp: 4, nectar: 1 } },
          ko: { t: "El vino sin mezclar os tumba antes del tercer brindis.", fx: { alma: -2 } } },
        { txt: "Pronunciar un discurso en honor de Eros", stat: "elo", cd: 12,
          ok: { t: "Los invitados aplauden. Hasta a Aristófanes se le quita el hipo.", fx: { xp: 4, almaTodos: 2 } },
          ko: { t: "El discurso es tan flojo que Aristófanes lo imita entre hipos.", fx: { alma: -1 } } },
        { txt: "Sacar a Alcibíades por la puerta", stat: "ani", cd: 12,
          ok: { t: "Alcibíades acaba en la calle, cantando. Agatón os da una propina por el servicio.", fx: { xp: 2, dracmas: 10 } },
          ko: { t: "Alcibíades era luchador. El que acaba en la calle sois vosotros.", fx: { alma: -3 } } }
      ],
      sig: "c3_bodega"
    },
    c3_bodega: {
      cap: 2, tipo: "tienda", fondo: "banquete", pnj: "sileno", tienda: "bodega", titulo: "La bodega de Sileno",
      texto: ["Entre ánforas que huelen a resina os espera Sileno, el viejo sátiro que crió a Dioniso.",
        "Dice que en su juventud vio a Sócrates beber toda una noche sin emborracharse. Nadie le cree, pero sus precios son buenos."],
      sig: "c3_diotima"
    },
    c3_diotima: {
      cap: 2, tipo: "enigma", fondo: "banquete", pnj: "diotima", titulo: "El enigma de Diotima",
      texto: ["Una sacerdotisa de Mantinea, Diotima, se levanta y os mira fijamente:",
        "«Si Eros desea lo bello, es porque no lo tiene. Entonces, ¿qué es Eros?»"],
      respuestas: ["Un dios hermoso y perfecto", "Un daimon: algo intermedio entre lo mortal y lo divino", "Un simple capricho del cuerpo", "El hijo de Zeus y Hera"],
      correcta: 1,
      ok: { t: "«Exacto. Eros es un intermediario: ni sabio ni ignorante, sino amante de la sabiduría. Como el filósofo.»", fx: { xp: 6, almaTodos: 3 } },
      ko: { t: "Diotima suspira: «Si fuera bello, no desearía la belleza». Os explica que Eros es un daimon, a medio camino entre mortales y dioses.", fx: { almaTodos: -1, xp: 2 } },
      sig: "c3_androgino"
    },
    c3_androgino: {
      cap: 2, tipo: "combate", fondo: "banquete", titulo: "El Andrógino", enemigo: "androgino",
      texto: ["Aristófanes cuenta su mito: al principio los humanos eran seres dobles, con cuatro brazos, cuatro piernas y dos caras.",
        "Mientras habla, uno de ellos entra rodando por el patio."],
      victoria: { t: "Como hizo Zeus, lo partís en dos. Cada mitad se marcha buscando a la otra, y así nació el amor, según Aristófanes.", fx: { xp: 7, nectar: 1, dracmas: 15 } },
      sig: "c4_pireo"
    },

    c4_pireo: {
      cap: 3, inicio: true, tipo: "tienda", fondo: "pireo", pnj: "hefesto", tienda: "pireo", titulo: "La armería de Hefesto",
      texto: ["Alquiláis un trirreme para cruzar las Columnas de Heracles en busca de la Atlántida que describió Critias.",
        "Antes de zarpar, un herrero cojo os llama desde su fragua. Es Hefesto en persona, que ha bajado del Olimpo a hacer negocio."],
      sig: "c4_tormenta"
    },
    c4_tormenta: {
      cap: 3, tipo: "prueba", fondo: "mar", titulo: "La tormenta de Poseidón",
      texto: ["Más allá de las Columnas de Heracles el mar se oscurece. Poseidón, señor de la Atlántida, no quiere visitas.",
        "El agua se alza como una muralla."],
      opciones: [
        { txt: "Remar contra las olas", stat: "ani", cd: 13,
          ok: { t: "Con los brazos ardiendo, atravesáis la ola más alta.", fx: { xp: 3 } },
          ko: { t: "Una ola barre la cubierta y os estrella contra el mástil.", fx: { almaTodos: -2 } } },
        { txt: "Orientarse por las estrellas", stat: "raz", cd: 13,
          ok: { t: "Las Pléyades marcan el rumbo. Encontráis un paso de agua tranquila y, flotando en él, una rama de olivo.", fx: { xp: 4, olivo: 1 } },
          ko: { t: "Confundís Venus con una estrella y navegáis en círculos durante horas.", fx: { almaTodos: -2 } } },
        { txt: "Rezar a Poseidón con palabras justas", stat: "elo", cd: 14,
          ok: { t: "Al dios le divierte vuestra osadía y calma el mar.", fx: { xp: 4, almaTodos: 2 } },
          ko: { t: "A Poseidón no le gusta vuestro tono. El mar se enfada todavía más.", fx: { almaTodos: -2 } } }
      ],
      sig: "c4_sirenas"
    },
    c4_sirenas: {
      cap: 3, tipo: "prueba", fondo: "mar", pnj: "sirena", titulo: "El canto de las sirenas",
      texto: ["Cuando la tormenta amaina, una canción cruza el agua. Sobre una roca, una sirena canta vuestros nombres.",
        "Quien la escucha demasiado tiempo se olvida de remar, de comer y de volver a casa."],
      opciones: [
        { txt: "Taparse los oídos con cera y seguir remando", stat: "tem", cd: 12, inmuneElfo: true,
          ok: { t: "El barco pasa de largo. La sirena se queda cantándole a una gaviota.", fx: { xp: 3 } },
          ko: { t: "Alguien se quita la cera para oír «solo un poco» y el barco roza las rocas.", fx: { almaTodos: -2 } } },
        { txt: "Responderle con un canto todavía mejor", stat: "elo", cd: 14,
          ok: { t: "La sirena se calla, ofendida, y os lanza una perla para que os vayáis.", fx: { xp: 5, dracmas: 20 } },
          ko: { t: "La sirena se ríe y canta más fuerte. Os zumban los oídos durante horas.", fx: { alma: -3 } } },
        { txt: "Atarse al mástil, como Odiseo, y escucharla entera", stat: "ani", cd: 13,
          ok: { t: "Aguantáis la canción entera sin soltaros. Ahora sabéis dónde está la Atlántida.", fx: { xp: 5, olivo: 1 } },
          ko: { t: "Las cuerdas aguantan, pero la cabeza no tanto.", fx: { alma: -2 } } }
      ],
      sig: "c4_templo"
    },
    c4_templo: {
      cap: 3, tipo: "enigma", fondo: "atlantida", titulo: "La puerta de oricalco",
      texto: ["La Atlántida es una ciudad de anillos de agua y de tierra alrededor de un templo cubierto de oricalco.",
        "En la puerta hay una inscripción: «Soy lo que no cambia aunque todo cambie. Las cosas me imitan, pero nadie me ha visto con los ojos. ¿Qué soy?»"],
      respuestas: ["El tiempo", "El reflejo en el agua", "Una Idea, una Forma", "El oricalco"],
      correcta: 2,
      ok: { t: "La puerta gira en silencio. Dentro hay ofrendas: néctar y una rama de olivo dorada.", fx: { xp: 6, nectar: 1, olivo: 1 } },
      ko: { t: "La puerta escupe agua hirviendo antes de abrirse a regañadientes. La respuesta era «una Idea».", fx: { almaTodos: -2, xp: 2 } },
      sig: "c4_talos"
    },
    c4_talos: {
      cap: 3, tipo: "combate", fondo: "atlantida", titulo: "Talos, el autómata", enemigo: "talos",
      texto: ["Ante el palacio vigila un gigante de bronce. Cada paso suyo hace temblar el muelle.",
        "Medea lo derrotó una vez quitándole el clavo del tobillo. Vosotros no sois Medea, pero algo se os ocurrirá."],
      victoria: { t: "Alguien arranca el clavo del tobillo. El icor dorado se escapa y Talos se queda quieto para siempre, como una estatua más.", fx: { xp: 8, dracmas: 20 } },
      sig: "c4_palacio"
    },
    c4_palacio: {
      cap: 3, tipo: "relato", fondo: "palacio", titulo: "El palacio de oricalco",
      texto: ["Dentro todo es oricalco: las columnas, los muros, hasta las bañeras. En el centro, una estatua de Poseidón en un carro tirado por caballos alados.",
        "Os escondéis tras una columna para recuperar el aliento. Al fondo se oyen los pasos de un rey."],
      fx: { almaTodos: 6, xp: 2 }, boton: "Enfrentarse al rey", sig: "c4_atlas"
    },
    c4_atlas: {
      cap: 3, tipo: "combate", fondo: "palacio", titulo: "Atlas, rey de la Atlántida", enemigo: "atlas",
      texto: ["El primer rey de la isla, hijo de Poseidón, se alza en su trono con un tridente de oricalco.",
        "Su pueblo dejó de ser virtuoso y se llenó de hybris. Ahora quiere conquistar Atenas."],
      victoria: { t: "Con la caída de Atlas la isla tiembla y empieza a hundirse en el mar, como contaba el mito. Escapáis por los pelos.", fx: { xp: 10, nectar: 2, dracmas: 25 } },
      sig: "c5_linea"
    },

    c5_linea: {
      cap: 4, inicio: true, tipo: "prueba", fondo: "ideas", titulo: "La línea dividida",
      texto: ["Un rayo de luz os arranca de la cubierta. Subís por los cuatro tramos del conocimiento: imágenes, cosas, números y, por fin, Ideas.",
        "Cada tramo os pide algo distinto."],
      opciones: [
        { txt: "Resolver una demostración geométrica", stat: "raz", cd: 14,
          ok: { t: "El teorema cierra como una puerta bien hecha. Subís un tramo entero de golpe.", fx: { xp: 5 } },
          ko: { t: "Un error en el tercer paso os hace caer de nuevo al mundo de las opiniones.", fx: { almaTodos: -2 } } },
        { txt: "Vaciar la mente de deseos", stat: "tem", cd: 13,
          ok: { t: "Sin hambre ni miedo, flotáis hacia arriba.", fx: { xp: 5, almaTodos: 2 } },
          ko: { t: "Os acordáis del vino de Agatón y perdéis la concentración.", fx: { almaTodos: -2 } } },
        { txt: "Dialogar con las Formas", stat: "elo", cd: 14,
          ok: { t: "La Idea de lo Igual y la Idea de lo Bello os responden y os indican el camino.", fx: { xp: 5 } },
          ko: { t: "Las Formas no responden a la retórica barata.", fx: { almaTodos: -2 } } }
      ],
      sig: "c5_bazar"
    },
    c5_bazar: {
      cap: 4, tipo: "tienda", fondo: "ideas", pnj: "hermes", tienda: "bazar", titulo: "El bazar de Hermes",
      texto: ["Entre los números y las Formas, alguien ha montado un puesto. Es Hermes, que viaja entre los planos con sus sandalias aladas.",
        "«Aquí arriba todo es perfecto», dice, «incluso los precios»."],
      sig: "c5_esfinge"
    },
    c5_esfinge: {
      cap: 4, tipo: "enigma", fondo: "ideas", pnj: "esfinge", titulo: "La Esfinge",
      texto: ["Antes de la cima, una esfinge os cierra el paso. «Responded y pasaréis. Fallad y veréis lo que pasa», dice sin moverse.",
        "«¿Qué ser camina a cuatro patas al amanecer, a dos al mediodía y a tres al atardecer?»"],
      respuestas: ["La propia Esfinge", "El ser humano", "El sol", "Un sátiro con bastón"],
      correcta: 1,
      ok: { t: "La Esfinge sonríe por primera vez en mil años y se aparta. «Edipo también acertó. Mirad cómo le fue.»", fx: { xp: 8 } },
      ko: { t: "«Incorrecto», dice la Esfinge. Y se levanta.", fx: {} },
      sigOk: "c5_doxa", sigKo: "c5_esfinge_combate"
    },
    c5_esfinge_combate: {
      cap: 4, tipo: "combate", fondo: "ideas", titulo: "La Esfinge despierta", enemigo: "esfinge",
      texto: ["La Esfinge despliega las alas. Su mirada pesa como la piedra."],
      victoria: { t: "La Esfinge cae y, antes de desvanecerse, susurra: «El ser humano. Era el ser humano».", fx: { xp: 8, dracmas: 20 } },
      sig: "c5_doxa"
    },
    c5_doxa: {
      cap: 4, tipo: "combate", fondo: "ideas", titulo: "Doxa, la Gran Opinión", enemigo: "doxa",
      texto: ["Una nube enorme hecha de rumores, prejuicios y verdades a medias. Cambia de forma cada vez que la miráis.",
        "Las espadas apenas la rozan. Solo la razón la disuelve."],
      victoria: { t: "La última opinión se disuelve en el aire. Detrás de la niebla aparece una luz que no se parece a nada.", fx: { xp: 12, curarTodo: true } },
      sig: "c5_bien"
    },
    c5_bien: {
      cap: 4, tipo: "final", fondo: "ideas", titulo: "La Idea del Bien",
      texto: ["Ante vosotros brilla algo que no es un objeto, sino la luz que hace visibles todas las cosas. Por un instante lo entendéis todo.",
        "Entonces os acordáis de la caverna, y de los prisioneros que siguen allí encadenados, mirando sombras."],
      opciones: [
        { txt: "Bajar a la caverna a liberar a los demás", final: "rey" },
        { txt: "Quedarse para siempre contemplando el Bien", final: "contemplacion" }
      ]
    }
  };

  const FINALES = {
    rey: {
      titulo: "Los filósofos-reyes",
      texto: ["Bajáis de nuevo a la oscuridad. Los prisioneros se ríen: tenéis los ojos torpes en la penumbra y habláis de un sol que nadie ha visto.",
        "Pero insistís, pregunta tras pregunta, como hacía Sócrates. Uno a uno, los grilletes caen."]
    },
    contemplacion: {
      titulo: "La contemplación eterna",
      texto: ["Os quedáis en la luz. No hay hambre, ni miedo, ni opinión. Sois felices como lo son las cosas perfectas.",
        "Abajo, en la caverna, las sombras siguen bailando sobre la roca. Platón diría que el sabio está obligado a volver, pero eso ya es otra partida."]
    }
  };
  /* Epílogo de cada héroe según su alineamiento moral. */
  const EPILOGOS = {
    B: "dedicó el resto de su vida a sacar prisioneros de cavernas.",
    N: "volvió a su oficio, más sabio y con mejores historias que contar.",
    M: "abrió una escuela de retórica carísima y se hizo rico vendiendo sombras."
  };

  /* El códice: lore del mundo (siempre visible), lugares (al llegar) y bestiario (al encontrar). */
  const LORE = {
    mundo: [
      { titulo: "Los tres planos", texto: [
        "En la Hélade se cruzan tres planos. Abajo está el Plano de las Sombras, donde queda la caverna: el reflejo de un reflejo. En medio, el Plano Material, donde viven los mortales con sus ciudades y sus guerras.",
        "Arriba está el Plano de las Formas, donde existe lo que de verdad es: lo Bello, lo Justo, lo Igual. El Demiurgo modeló el mundo mirando esas Formas, como un artesano que copia un modelo. Por eso las cosas se parecen a lo perfecto, pero nunca llegan a serlo.",
        "Por encima de todo brilla la Idea del Bien, que hace visibles las demás, como el sol hace visibles las cosas."] },
      { titulo: "Los alineamientos", texto: [
        "Platón dividía el alma en tres partes: la razón, que guía; el ánimo, que empuja, y el deseo, que tira. Un alma ordenada es como una ciudad bien gobernada.",
        "Los aventureros de la Hélade se describen con dos ejes. Legal o caótico dice si su alma sigue un orden o va a donde la lleve el momento. Bueno o malvado dice para quién trabaja ese orden. Las decisiones que toméis en la aventura pueden cambiarlo."] },
      { titulo: "Los dioses patronos", texto: [
        "Atenea protege a los filósofos y Ares a los guardianes. Hermes, dios de los mercaderes y los ladrones, sonríe a los sofistas. Apolo y las Musas inspiran a rapsodas y oráculos, Artemisa guía a las cazadoras y Hécate, señora de las encrucijadas, escucha los pactos de los hechiceros.",
        "Heracles es el modelo de todos los atletas. Tique, la Fortuna, decide los dados de todos los demás."] },
      { titulo: "Tiradas, CA y desafío", texto: [
        "Toda acción arriesgada se resuelve con un d20 más el atributo que corresponda. Si iguala o supera la Clase de Dificultad (CD), sale bien. Un 20 natural es un crítico y un 1 natural, una pifia.",
        "Para golpear a alguien hay que igualar su Clase de Armadura (CA). El Valor de Desafío (VD) del bestiario indica lo peligroso que es un monstruo para un grupo de cuatro héroes de nivel 1.",
        "Razón equivale a la Inteligencia y la Sabiduría; Ánimo, a la Fuerza y la Constitución; Elocuencia, al Carisma, y Templanza, a la Destreza y el autocontrol."] }
    ],
    lugares: {
      0: { titulo: "La Caverna", texto: ["Un demiplano de sombras bajo la Hélade. Sus prisioneros nacen encadenados mirando una pared, y creen que las sombras que ven son lo único que existe. Platón la describe en el libro VII de la República."] },
      1: { titulo: "Atenas", texto: ["La ciudad de Atenea, con su Ágora, su Stoa y su puerto del Pireo. Aquí se discute de todo: de leyes, de dioses y del precio del aceite. Aquí condenaron a Sócrates por hacer demasiadas preguntas."] },
      2: { titulo: "El Banquete", texto: ["La casa del poeta Agatón la noche de su victoria. Los invitados acordaron no emborracharse y pronunciar discursos en honor de Eros. Lo de no emborracharse duró poco."] },
      3: { titulo: "Atlántida", texto: ["Una isla más allá de las Columnas de Heracles, mayor que Libia y Asia juntas, según cuenta Critias en el Timeo. Sus reyes descendían de Poseidón. Cuando se llenaron de hybris, la isla se hundió en un solo día y una noche."] },
      4: { titulo: "El Mundo de las Ideas", texto: ["El Plano de las Formas. Allí flotan los cinco sólidos perfectos con los que el Demiurgo construyó los elementos: el tetraedro del fuego, el cubo de la tierra, el octaedro del aire, el icosaedro del agua y el dodecaedro del cosmos."] }
    }
  };

  return {
    STATS, ABREV, CAPITULOS, ROMANOS, NIVELES, NOMBRES, RAZAS, CLASES, ALINEAMIENTOS, ORDEN_ALIN,
    ejesAlin, moverMoral, OBJETOS, RANURAS, TIENDAS, TIPOS_DANO, ENEMIGOS, ESCENAS, FINALES, EPILOGOS, LORE
  };
})();
