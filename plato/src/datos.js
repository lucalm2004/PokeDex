/* Dados y Mazmorras · datos de la aventura: razas, clases, alineamientos, objetos, tiendas,
   monstruos, escenas y lore del compendio de Valdren. */
const DATOS = (() => {
  "use strict";

  /* Cuatro atributos abreviados: Fuerza cuenta también como Constitución y Sabiduría como Destreza. */
  const STATS = { raz: "Inteligencia", ani: "Fuerza", elo: "Carisma", tem: "Sabiduría" };
  const ABREV = { raz: "INT", ani: "FUE", elo: "CAR", tem: "SAB" };
  const CAPITULOS = ["Villabruma", "El Bosque Susurrante", "La Cripta de los Reyes", "Las Minas de Barak-Thur", "La Guarida de Ignárax"];
  const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];
  /* PX acumulados necesarios para cada nivel (nivel 1 = índice 0). */
  const NIVELES = [0, 10, 25, 45, 70, 100];
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
      pasiva: "Manos sanadoras", pasivaDesc: "Curar heridas cura el doble.",
      desc: "Sacerdote de Solara. Cura heridas, bendice armas y no soporta a los no muertos."
    },
    bardo: {
      nombre: "Bardo", rol: "Apoyo", alma: 9, stats: { raz: 0, ani: 0, elo: 3, tem: 1 }, patron: "Myrrh, la Tejedora de Conjuros",
      hab: "Canción de descanso", habDesc: "Cura 1d6 + CAR a todo el grupo y levanta a los caídos.",
      pasiva: "Inspiración bárdica", pasivaDesc: "Tras cada victoria, todo el grupo recupera 3 PG.",
      desc: "Toca el laúd en todas las tabernas de Valdren. Sus canciones curan, aunque no lo parezca."
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
      alma: 28, ca: 13, atk: 5, dano: [1, 8, 0], ataques: 2, ini: 1, resiste: null, debil: "arcana", regenera: 3,
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
    dragon: {
      nombre: "Ignárax, el dragón rojo", tipo: "Dragón enorme", alin: "Caótico malvado", vd: "10",
      alma: 40, ca: 15, atk: 5, dano: [1, 10, 0], ataques: 2, ini: 2, resiste: "arcana", debil: null,
      area: { cada: 3, dado: 6, txt: "Ignárax escupe un torrente de fuego" },
      rasgoDesc: "Aliento de fuego: cada 3 rondas abrasa a todo el grupo (1d6).",
      lore: "El último de los grandes dragones rojos de Valdren. Durmió cien años sobre el oro de Barak-Thur y ha despertado con hambre."
    }
  };

  /* Escenas. Tipos: prueba (tirada), enigma (acertijo en grupo), combate, relato, tienda y final.
     fx: alma (quien decide), almaTodos, curarTodo, maxTodos, xp (todos), pocion, bendicion, superior,
     oro (cada héroe), anillo, moral (mueve el alineamiento de quien decide: +1 hacia bueno, −1 hacia malvado). */
  const ESCENAS = {
    c1_taberna: {
      cap: 0, inicio: true, tipo: "prueba", fondo: "taberna", pnj: "tabernero", titulo: "El Grifo Tuerto",
      texto: ["Toda gran aventura empieza en una taberna, y la vuestra no iba a ser menos. El Grifo Tuerto está lleno de humo, cerveza y rumores: dicen que el dragón Ignárax ha despertado en el Pico Cenizo.",
        "Antes de que podáis presentaros, un mercenario borracho tira vuestras jarras al suelo y se ríe en vuestra cara."],
      opciones: [
        { txt: "Echarle un pulso para darle una lección", stat: "ani", cd: 12,
          ok: { t: "El mercenario acaba con el brazo en la mesa y toda la taberna os invita a una ronda.", fx: { xp: 2, oro: 5 } },
          ko: { t: "El mercenario gana, os tira de la silla y toda la taberna se ríe.", fx: { alma: -2 } } },
        { txt: "Calmar los ánimos con una buena historia", stat: "elo", cd: 11,
          ok: { t: "Le contáis una historia tan buena que acaba llorando y pagando las bebidas.", fx: { xp: 3 } },
          ko: { t: "La historia es tan aburrida que el mercenario se duerme encima de la mesa. Al menos se calla.", fx: { xp: 1 } } },
        { txt: "Descubrir que juega con dados trucados", stat: "raz", cd: 12,
          ok: { t: "Sus dados están cargados. Se los cambiáis por unos buenos y le ganáis la bolsa en una apuesta.", fx: { oro: 10, xp: 2 } },
          ko: { t: "No veis el truco y perdéis la apuesta.", fx: { oro: -5 } } }
      ],
      sig: "c1_ratas"
    },
    c1_ratas: {
      cap: 0, tipo: "combate", fondo: "sotano", titulo: "Ratas en el sótano", enemigo: "rata",
      texto: ["Bram, el tabernero, os ofrece una habitación gratis si limpiáis su sótano. «Son solo unas ratas», dice.",
        "No son solo unas ratas. Son ratas del tamaño de un perro."],
      victoria: { t: "Las ratas huyen por un agujero de la pared. Bram cumple su palabra y además os da una poción que guardaba detrás de un barril.", fx: { xp: 3, pocion: 1, oro: 5 } },
      sig: "c1_encargo"
    },
    c1_encargo: {
      cap: 0, tipo: "relato", fondo: "taberna", pnj: "forastero", titulo: "El forastero encapuchado",
      texto: ["Al volver, un forastero encapuchado os espera en vuestra mesa y despliega un mapa: «Ignárax quemará Villabruma antes de la próxima luna. El único camino a su guarida cruza el Bosque Susurrante, la Cripta de los Reyes y las minas de los enanos».",
        "«El concejo paga quinientas monedas de oro por su cabeza. Yo os adelanto algo.» Y deja una bolsa sobre la mesa."],
      fx: { oro: 20, xp: 2, curarTodo: true }, boton: "Aceptar el encargo", sig: "c1_mercado"
    },
    c1_mercado: {
      cap: 0, tipo: "tienda", fondo: "aldea", pnj: "mercader", tienda: "villa", titulo: "El mercado de Villabruma",
      texto: ["A la mañana siguiente, la plaza de Villabruma está llena de puestos. Brunilda, la mercader, ya se ha enterado de lo del dragón y os ha preparado «un surtido para héroes».",
        "Cada héroe pasa por el mostrador con su propio oro."],
      sig: "c1_emboscada"
    },
    c1_emboscada: {
      cap: 0, tipo: "combate", fondo: "camino", titulo: "Emboscada en el camino", enemigo: "goblin",
      texto: ["Al caer la tarde, un carro volcado corta el camino del bosque. Demasiado fácil.",
        "De los arbustos salen goblins aullando y, detrás de ellos, su jefe Krug, con una cimitarra oxidada y una sonrisa podrida."],
      victoria: { t: "Krug huye chillando hacia el bosque y deja caer su botín. Entre las monedas robadas hay un pergamino de bendición.", fx: { xp: 5, bendicion: 1, oro: 10 } },
      sig: "c2_sendero"
    },

    c2_sendero: {
      cap: 1, inicio: true, tipo: "prueba", fondo: "bosque", titulo: "El Bosque Susurrante",
      texto: ["Los árboles del Bosque Susurrante son tan altos que no dejan ver el cielo. Entre las hojas se oyen voces que repiten vuestros nombres.",
        "El sendero se bifurca una y otra vez. Es fácil perderse aquí para siempre."],
      opciones: [
        { txt: "Orientarse por el musgo y las estrellas", stat: "raz", cd: 12,
          ok: { t: "El musgo crece hacia el norte. Encontráis el camino y, al lado, un corro de setas con monedas de plata.", fx: { xp: 3, oro: 5 } },
          ko: { t: "Dais vueltas durante horas hasta volver al mismo árbol.", fx: { almaTodos: -1, xp: 1 } } },
        { txt: "Seguir unas huellas sin hacer ruido", stat: "tem", cd: 12,
          ok: { t: "Las huellas os llevan a un claro tranquilo donde descansáis un rato.", fx: { xp: 3, almaTodos: 2 } },
          ko: { t: "Pisáis una rama seca, algo enorme se despierta y tenéis que correr.", fx: { alma: -2 } } },
        { txt: "Responder a las voces y pedirles el camino", stat: "elo", cd: 13,
          ok: { t: "Las voces son de duendecillos, que se ríen y os señalan el sendero.", fx: { xp: 4 } },
          ko: { t: "Los duendecillos os mandan directos a una zarza.", fx: { almaTodos: -1 } } }
      ],
      sig: "c2_osolechuza"
    },
    c2_osolechuza: {
      cap: 1, tipo: "combate", fondo: "bosque", titulo: "Un graznido en la maleza", enemigo: "osolechuza",
      texto: ["Un graznido grave hace temblar las hojas. De entre los helechos sale un oso enorme con cabeza de lechuza.",
        "Los oso-lechuzas no son malvados. Solo tienen mucha, mucha hambre."],
      victoria: { t: "El oso-lechuza huye entre los árboles. En su madriguera hay restos de aventureros menos afortunados, y sus bolsas.", fx: { xp: 6, oro: 15 } },
      sig: "c2_driada"
    },
    c2_driada: {
      cap: 1, tipo: "enigma", fondo: "bosque", pnj: "driada", titulo: "El acertijo de la dríada",
      texto: ["Una dríada sale del tronco de un roble milenario. «Nadie cruza mi bosque sin responder a mi acertijo», dice.",
        "«Tengo ciudades, pero no casas. Tengo bosques, pero no árboles. Tengo ríos, pero no agua. ¿Qué soy?»"],
      respuestas: ["Un sueño", "Un mapa", "Un espejo", "Una canción"],
      correcta: 1,
      ok: { t: "La dríada sonríe y os regala unas bayas que cierran las heridas. «Que el bosque os guarde.»", fx: { xp: 6, almaTodos: 4 } },
      ko: { t: "«Un mapa», suspira la dríada. Las raíces os hacen tropezar durante todo el camino.", fx: { almaTodos: -2, xp: 2 } },
      sig: "c2_carromato"
    },
    c2_carromato: {
      cap: 1, tipo: "tienda", fondo: "bosque", pnj: "gnomo", tienda: "gnomo", titulo: "El carromato de Fizwick",
      texto: ["En un claro hay un carromato envuelto en humo de colores. Un gnomo con gafas de soldador asoma la cabeza: «¡Clientes! ¡Por fin!».",
        "Fizwick vende pociones, polvos y cosas que ni él sabe muy bien para qué sirven."],
      sig: "c2_puente"
    },
    c2_puente: {
      cap: 1, tipo: "combate", fondo: "puente", titulo: "El puente del trol", enemigo: "trol",
      texto: ["Al salir del bosque, un viejo puente de piedra cruza un barranco. Debajo vive un trol que cobra un peaje de una oreja por cabeza.",
        "Los trols se curan de cualquier herida. De cualquiera menos del fuego."],
      victoria: { t: "El trol cae al barranco. Se oye un chapoteo al fondo y luego, por fin, silencio.", fx: { xp: 8, oro: 20, pocion: 1 } },
      sig: "c3_trampas"
    },

    c3_trampas: {
      cap: 2, inicio: true, tipo: "prueba", fondo: "cripta", titulo: "El pasillo de las trampas",
      texto: ["La Cripta de los Reyes Olvidados huele a polvo y a siglos. El pasillo de entrada tiene unas baldosas sospechosamente limpias.",
        "En mitad del camino hay un esqueleto atravesado por cuchillas. Es un buen consejo."],
      opciones: [
        { txt: "Buscar los mecanismos de las trampas", stat: "raz", cd: 12,
          ok: { t: "Encontráis las placas de presión y las desactiváis una a una.", fx: { xp: 4 } },
          ko: { t: "Pisáis una baldosa equivocada y salen dardos de las paredes.", fx: { almaTodos: -2 } } },
        { txt: "Cruzar saltando de baldosa en baldosa", stat: "tem", cd: 13,
          ok: { t: "Pasáis como bailarines entre las cuchillas.", fx: { xp: 3 } },
          ko: { t: "Una cuchilla os alcanza al pasar.", fx: { alma: -3 } } },
        { txt: "Romper las trampas a martillazos", stat: "ani", cd: 12,
          ok: { t: "Las cuchillas saltan en pedazos. Sutil no ha sido, pero funciona.", fx: { xp: 2 } },
          ko: { t: "Las trampas son más duras que vuestros brazos.", fx: { alma: -2 } } }
      ],
      sig: "c3_esqueletos"
    },
    c3_esqueletos: {
      cap: 2, tipo: "combate", fondo: "cripta", titulo: "La guardia de los reyes", enemigo: "esqueleto",
      texto: ["Los sarcófagos se abren con un chirrido. De ellos salen caballeros esqueleto con espadas oxidadas.",
        "Juraron proteger a sus reyes para siempre, y se lo tomaron al pie de la letra."],
      victoria: { t: "Los huesos caen al suelo y esta vez no se levantan. Un clérigo diría que por fin descansan.", fx: { xp: 6, oro: 10 } },
      sig: "c3_tesoro"
    },
    c3_tesoro: {
      cap: 2, tipo: "prueba", fondo: "cripta", pnj: "fantasma", titulo: "El tesoro del rey",
      texto: ["En la cámara funeraria descansa un rey con su corona, su oro y un anillo de plata en el dedo. Una inscripción avisa: «Quien robe a los muertos, cargará con ellos».",
        "Nadie os está mirando. Nadie vivo, al menos."],
      opciones: [
        { txt: "Llevarse todo el oro de la tumba", stat: null,
          ok: { t: "Os llenáis las bolsas de oro. Esa noche, el frío de la tumba se os mete en los huesos y ya no se va.", fx: { oro: 40, maxTodos: -2, moral: -1 } } },
        { txt: "Dejar una ofrenda y seguir adelante", stat: "tem", cd: 13,
          ok: { t: "Dejáis unas monedas en el altar. Una luz cálida os acompaña durante el resto de la cripta.", fx: { xp: 6, moral: 1 } },
          ko: { t: "Os cuesta apartar la vista del oro. Cuando por fin os vais, algo de codicia se viene con vosotros.", fx: { alma: -2, xp: 2 } } },
        { txt: "Estudiar el anillo de plata", stat: "raz", cd: 14,
          ok: { t: "Es un anillo de invisibilidad. El fantasma del rey os lo cede con un gesto: una vez por combate podréis desaparecer.", fx: { anillo: true, xp: 2 } },
          ko: { t: "Al tocarlo, el anillo os hiela la mano y el rey se revuelve en su tumba. Mejor no insistir.", fx: { alma: -2 } } }
      ],
      sig: "c3_mimico"
    },
    c3_mimico: {
      cap: 2, tipo: "combate", fondo: "cripta", titulo: "Un cofre demasiado bonito", enemigo: "mimico",
      texto: ["En una sala lateral hay un cofre dorado, solo, iluminado por un rayo de luz. Ningún aventurero con experiencia lo tocaría.",
        "Alguien lo toca. El cofre abre una boca llena de dientes."],
      victoria: { t: "El mímico se queda quieto con la lengua fuera. Dentro de su estómago hay monedas de verdad y una poción.", fx: { xp: 6, oro: 15, pocion: 1 } },
      sig: "c3_rey"
    },
    c3_rey: {
      cap: 2, tipo: "enigma", fondo: "cripta", pnj: "fantasma", titulo: "El fantasma del rey",
      texto: ["El fantasma de un rey os cierra el paso a la última cámara. «Malakar, mi consejero, me traicionó y se convirtió en liche. Si queréis enfrentaros a él, demostrad que tenéis seso.»",
        "«Cuanto más le quitas, más grande se hace. ¿Qué es?»"],
      respuestas: ["Una deuda", "Un agujero", "Una sombra", "La fama"],
      correcta: 1,
      ok: { t: "«Un agujero», asiente el fantasma. «Como el que dejó Malakar en mi reino.» Y os bendice antes de desvanecerse.", fx: { xp: 6, bendicion: 1, almaTodos: 3 } },
      ko: { t: "«Un agujero», dice el fantasma, decepcionado. «Id, pero id con cuidado.»", fx: { xp: 2 } },
      sig: "c3_liche"
    },
    c3_liche: {
      cap: 2, tipo: "combate", fondo: "cripta", titulo: "Malakar, el liche", enemigo: "liche",
      texto: ["En el trono del rey se sienta Malakar, un esqueleto con corona y túnica podrida. Sus ojos brillan con un fuego verde.",
        "«Ignárax me prometió la mitad del reino», susurra. «No vais a estropearlo.»"],
      victoria: { t: "Malakar se deshace en polvo. Entre las cenizas brilla su filacteria, y la rompéis para que no vuelva nunca.", fx: { xp: 10, oro: 25, superior: 1 } },
      sig: "c4_forja"
    },

    c4_forja: {
      cap: 3, inicio: true, tipo: "tienda", fondo: "forja", pnj: "herrero", tienda: "forja", titulo: "La forja de Durgan",
      texto: ["Las minas de Barak-Thur llevan cien años vacías desde que Ignárax echó a los enanos. Solo queda uno: Durgan Barbahierro, que se negó a abandonar su forja.",
        "«Si vais a por el dragón, no vais con esos juguetes», gruñe."],
      sig: "c4_vagoneta"
    },
    c4_vagoneta: {
      cap: 3, tipo: "prueba", fondo: "mina", titulo: "La vagoneta desbocada",
      texto: ["Para cruzar las minas montáis en una vieja vagoneta. A mitad de la bajada, los frenos se rompen.",
        "Al fondo del túnel, las vías se acaban en un precipicio."],
      opciones: [
        { txt: "Frenar a pulso con una palanca", stat: "ani", cd: 13,
          ok: { t: "La vagoneta se detiene a un palmo del abismo.", fx: { xp: 3 } },
          ko: { t: "La palanca se parte y salís despedidos contra la pared.", fx: { almaTodos: -2 } } },
        { txt: "Cambiar las agujas en el último momento", stat: "raz", cd: 13,
          ok: { t: "Acertáis con la palanca y la vagoneta entra en un túnel lleno de cristales.", fx: { xp: 4, oro: 10 } },
          ko: { t: "La palanca equivocada os lleva por un túnel todavía más empinado.", fx: { almaTodos: -2 } } },
        { txt: "Saltar a tiempo y agarrarse a una viga", stat: "tem", cd: 12,
          ok: { t: "Saltáis todos a la vez y la vagoneta se pierde en el abismo sin vosotros.", fx: { xp: 3 } },
          ko: { t: "Saltáis, pero no todos a tiempo.", fx: { alma: -3 } } }
      ],
      sig: "c4_cubo"
    },
    c4_cubo: {
      cap: 3, tipo: "combate", fondo: "mina", titulo: "Algo en el túnel", enemigo: "cubo",
      texto: ["El túnel está demasiado limpio. Ni una piedra, ni una telaraña, ni un hueso.",
        "Entonces veis por qué: un cubo transparente avanza hacia vosotros con las armas de sus últimas víctimas flotando dentro."],
      victoria: { t: "El cubo se derrite en un charco pegajoso. Entre los restos hay monedas y armas de otros aventureros.", fx: { xp: 7, oro: 20 } },
      sig: "c4_golem"
    },
    c4_golem: {
      cap: 3, tipo: "combate", fondo: "forja", titulo: "El guardián de la forja", enemigo: "golem",
      texto: ["En la gran sala de la forja, un gólem de hierro despierta con un rugido de vapor. Los enanos lo construyeron para proteger la mina.",
        "Ahora obedece a quien tiene la llave de la forja, y la llave la tiene Ignárax."],
      victoria: { t: "El gólem cae con un estruendo que se oye en toda la montaña. Desde lejos, Durgan levanta su martillo en señal de respeto.", fx: { xp: 9, oro: 25, pocion: 2 } },
      sig: "c4_descanso"
    },
    c4_descanso: {
      cap: 3, tipo: "relato", fondo: "mina", pnj: "herrero", titulo: "Un descanso en la mina",
      texto: ["Acampáis en una galería segura. Durgan os trae pan, cerveza enana y una advertencia: «El dragón duerme sobre su oro. Si os oye llegar, no volveréis a dormir nunca».",
        "Mañana subiréis al Pico Cenizo."],
      fx: { curarTodo: true, xp: 3 }, boton: "Subir al Pico Cenizo", sig: "c5_ascenso"
    },

    c5_ascenso: {
      cap: 4, inicio: true, tipo: "prueba", fondo: "pico", titulo: "El Pico Cenizo",
      texto: ["El camino a la guarida sube entre ríos de lava y nubes de ceniza. El aire quema los pulmones.",
        "Arriba, en la boca de una cueva, brilla el reflejo de una montaña de oro."],
      opciones: [
        { txt: "Escalar la pared de roca", stat: "ani", cd: 13,
          ok: { t: "Subís por la pared más directa y llegáis antes de que caiga la noche.", fx: { xp: 5 } },
          ko: { t: "Una roca se suelta y os arrastra ladera abajo.", fx: { almaTodos: -2 } } },
        { txt: "Esquivar las nubes de gas", stat: "tem", cd: 13,
          ok: { t: "Contenéis la respiración en el momento justo y pasáis sin un rasguño.", fx: { xp: 5, almaTodos: 2 } },
          ko: { t: "Respiráis el gas y os pasáis la subida tosiendo.", fx: { almaTodos: -2 } } },
        { txt: "Buscar el viejo paso de los enanos", stat: "raz", cd: 14,
          ok: { t: "Encontráis las escaleras secretas de los enanos, talladas en la roca, y un pergamino olvidado.", fx: { xp: 5, bendicion: 1 } },
          ko: { t: "El paso está derrumbado y perdéis medio día.", fx: { almaTodos: -2 } } }
      ],
      sig: "c5_mercader"
    },
    c5_mercader: {
      cap: 4, tipo: "tienda", fondo: "pico", pnj: "planar", tienda: "planar", titulo: "El Mercader de los Planos",
      texto: ["A la entrada de la guarida alguien ha montado un puesto. Un tiefling con turbante os saluda como si os estuviera esperando.",
        "«Nadie va a ver a un dragón sin pasar antes por mi tienda», dice, y abre una bolsa que por dentro es mucho más grande que por fuera."],
      sig: "c5_acertijo"
    },
    c5_acertijo: {
      cap: 4, tipo: "enigma", fondo: "guarida", pnj: "dragon", titulo: "El acertijo de Ignárax",
      texto: ["Ignárax abre un ojo del tamaño de un escudo. «Hace siglos que nadie me entretiene», dice. «Responded a mi acertijo y os dejaré atacar primero.»",
        "«¿Qué es más poderoso que los dioses y más malvado que los demonios? Los pobres lo tienen, los ricos lo necesitan y, si lo comes, mueres.»"],
      respuestas: ["El oro", "El fuego", "Nada", "El tiempo"],
      correcta: 2,
      ok: { t: "«Nada», gruñe Ignárax, impresionado a su pesar. «Nada os salvará, entonces.» Pero le habéis ganado la mano y empezáis con ventaja.", fx: { xp: 8, bendicion: 1 } },
      ko: { t: "«Nada», ríe Ignárax. «Y nada es lo que quedará de vosotros.» Y os escupe una bocanada de fuego para empezar.", fx: { almaTodos: -3 } },
      sig: "c5_dragon"
    },
    c5_dragon: {
      cap: 4, tipo: "combate", fondo: "guarida", titulo: "Ignárax, el dragón rojo", enemigo: "dragon",
      texto: ["El dragón se levanta sobre su montaña de oro. Sus alas tapan el techo de la cueva y sus escamas brillan como brasas.",
        "Es ahora o nunca."],
      victoria: { t: "Ignárax cae sobre su tesoro con un rugido que hace temblar el Pico Cenizo. El dragón rojo ha muerto y Villabruma está a salvo.", fx: { xp: 12, curarTodo: true } },
      sig: "c5_final"
    },
    c5_final: {
      cap: 4, tipo: "final", fondo: "guarida", titulo: "El tesoro del dragón",
      texto: ["Ante vosotros brilla el tesoro de Ignárax: oro de mil reinos, coronas, gemas y armas legendarias. Hay suficiente para comprar un castillo cada uno.",
        "Pero Villabruma está medio quemada y los enanos de Barak-Thur llevan cien años sin hogar."],
      opciones: [
        { txt: "Repartir el tesoro con Villabruma y los enanos", final: "heroes" },
        { txt: "Quedároslo todo", final: "codicia" }
      ]
    }
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
      0: { titulo: "Villabruma", texto: ["Un pueblo de leñadores y comerciantes a orillas del Bosque Susurrante. Su taberna, el Grifo Tuerto, es famosa por su cerveza negra y por mandar aventureros a morir a sitios interesantes."] },
      1: { titulo: "El Bosque Susurrante", texto: ["Un bosque antiguo donde el Reino Feérico queda muy cerca. Los árboles hablan, las setas brillan y los caminos cambian de sitio cuando nadie los mira."] },
      2: { titulo: "La Cripta de los Reyes", texto: ["El panteón de la vieja dinastía de Valdren. Su último rey fue traicionado por Malakar, su consejero, que buscó la inmortalidad y la encontró convertido en liche."] },
      3: { titulo: "Las Minas de Barak-Thur", texto: ["La mayor ciudad enana de Valdren, excavada bajo el Pico Cenizo. Ignárax la arrasó hace cien años y los enanos todavía sueñan con volver."] },
      4: { titulo: "La Guarida de Ignárax", texto: ["Una caverna en la cima del Pico Cenizo, rodeada de lava. Dentro, Ignárax duerme sobre el oro de cien reinos y los huesos de quienes intentaron llevárselo."] }
    }
  };

  return {
    STATS, ABREV, CAPITULOS, ROMANOS, NIVELES, NOMBRES, RAZAS, CLASES, ALINEAMIENTOS, ORDEN_ALIN,
    ejesAlin, moverMoral, OBJETOS, RANURAS, TIENDAS, TIPOS_DANO, ENEMIGOS, ESCENAS, FINALES, EPILOGOS, LORE
  };
})();
