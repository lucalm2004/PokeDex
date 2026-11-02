/* Dados y Mazmorras · especializaciones de clase (subclases).
   Se carga después de datos.js: añade 32 habilidades (4 por clase) y DATOS.SUBCLASES,
   dos especializaciones por clase con una pasiva propia y cuatro nodos (niveles 4, 6, 8 y 10). */
(() => {
  "use strict";

  Object.assign(DATOS.HABILIDADES, {
    /* Guerrero · Paladín */
    castigo: { nombre: "Castigo divino", efecto: "dano", tipo: "sagrada", stat: "ani", dado: [2, 6], tirada: true, noMuerto: 2, usos: 3, desc: "El acero se enciende con luz: doble daño contra no muertos." },
    juramento: { nombre: "Juramento cumplido", efecto: "dano", tipo: "sagrada", stat: "ani", dado: [3, 8], noMuerto: 2, aplica: ["ciego", 2, 1], usos: 1, desc: "Un tajo de luz que nunca falla y deja ciego al enemigo." },
    /* Guerrero · Campeón */
    embestida: { nombre: "Embestida", efecto: "dano", tipo: "fisica", stat: "ani", dado: [2, 6], tirada: true, aplica: ["paralisis", 1, 0.4], usos: 3, desc: "Cargas con el hombro por delante y puedes dejarlo aturdido." },
    golpeCampeon: { nombre: "Golpe del campeón", efecto: "dano", tipo: "fisica", stat: "ani", dado: [3, 10], tirada: true, critico: 17, ejecuta: 0.3, usos: 1, desc: "El golpe que gana torneos: crítico con 17 o más y doble daño a los malheridos." },

    /* Bárbaro · Berserker */
    tajoSediento: { nombre: "Tajo sediento", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 10], tirada: true, rabia: true, drena: true, usos: 3, desc: "Cuanto más sangras, más fuerte golpeas, y te bebes la mitad del daño." },
    carniceria: { nombre: "Carnicería", efecto: "dano", tipo: "fisica", stat: "ani", dado: [2, 10], golpes: 2, tirada: true, rabia: true, aplica: ["sangrado", 3, 1], usos: 1, desc: "Dos hachazos ciegos de furia que abren heridas profundas." },
    /* Bárbaro · Guardián tótem */
    aullido: { nombre: "Aullido de la manada", efecto: "provocar", turnos: 3, usos: 2, desc: "El espíritu del lobo atrae a los enemigos hacia ti y te endurece la piel (+2 CA)." },
    punoTotem: { nombre: "Puño del tótem", efecto: "dano", tipo: "fisica", stat: "ani", dado: [3, 8], debilita: true, aplica: ["paralisis", 1, 0.5], usos: 1, desc: "El gran oso golpea a través de ti: daño seguro, debilita y puede paralizar." },

    /* Pícaro · Asesino de sombras */
    medianoche: { nombre: "Hoja de medianoche", efecto: "dano", tipo: "fisica", stat: "ani", dado: [2, 6], tirada: true, critico: 18, aplica: ["ciego", 2, 0.5], usos: 3, desc: "Un corte desde la oscuridad: crítico con 18 o más y puede cegar." },
    muerteSilenciosa: { nombre: "Muerte silenciosa", efecto: "dano", tipo: "fisica", stat: "ani", dado: [4, 6], tirada: true, critico: 16, ejecuta: 0.35, usos: 1, desc: "Nadie oye el último golpe. Crítico con 16 o más y doble daño a los malheridos." },
    /* Pícaro · Duelista */
    floritura: { nombre: "Floritura", efecto: "dano", tipo: "fisica", stat: "elo", dado: [1, 6], golpes: 2, tirada: true, debilita: true, usos: 3, desc: "Dos fintas elegantes que dejan al rival desequilibrado. Usa Carisma." },
    estocadaMortal: { nombre: "Estocada mortal", efecto: "dano", tipo: "fisica", stat: "elo", dado: [3, 8], tirada: true, critico: 18, aplica: ["sangrado", 3, 1], usos: 1, desc: "La punta busca el hueco de la armadura. Crítico con 18 o más. Usa Carisma." },

    /* Explorador · Señor de las bestias */
    zarpazo: { nombre: "Zarpazo del compañero", efecto: "dano", tipo: "fisica", stat: "tem", dado: [1, 6], golpes: 2, tirada: true, aplica: ["sangrado", 2, 0.4], usos: 3, desc: "Tu lobo se lanza a morder dos veces. Usa Sabiduría." },
    estampida: { nombre: "Estampida", efecto: "dano", tipo: "fisica", stat: "tem", dado: [3, 8], area: true, aplica: ["paralisis", 1, 0.4], usos: 1, desc: "Llamas a la manada entera: arrolla a todos los enemigos. Usa Sabiduría." },
    /* Explorador · Francotirador */
    alOjo: { nombre: "Disparo al ojo", efecto: "dano", tipo: "fisica", stat: "ani", dado: [1, 8], tirada: true, aplica: ["ciego", 2, 0.8], usos: 3, desc: "Una flecha precisa a la cara: casi siempre ciega." },
    perforante: { nombre: "Disparo perforante", efecto: "dano", tipo: "fisica", stat: "ani", dado: [5, 8], tirada: true, critico: 17, usos: 1, desc: "Tensas el arco hasta el límite. Crítico con 17 o más." },

    /* Mago · Piromante */
    saetaIgnea: { nombre: "Saeta ígnea", efecto: "dano", tipo: "arcana", stat: "raz", dado: [2, 6], tirada: true, aplica: ["quemadura", 3, 0.8], usos: 3, desc: "Un dardo de fuego que prende la ropa del enemigo." },
    infierno: { nombre: "Infierno abrasador", efecto: "dano", tipo: "arcana", stat: "raz", dado: [5, 6], bono: 2, area: true, aplica: ["quemadura", 3, 1], usos: 1, desc: "El aire mismo arde: todos los enemigos se queman." },
    /* Mago · Cronomante */
    ralentizar: { nombre: "Ralentizar", efecto: "debilita", area: true, usos: 1, desc: "El tiempo se espesa: todos los enemigos tienen −2 para atacar." },
    paradoja: { nombre: "Paradoja", efecto: "aturde", area: true, usos: 1, desc: "Detienes el instante: todos los enemigos pierden su próximo turno." },

    /* Brujo · Infernal */
    latigo: { nombre: "Látigo de brasas", efecto: "dano", tipo: "arcana", stat: "elo", dado: [2, 6], tirada: true, aplica: ["quemadura", 2, 0.7], usos: 3, desc: "Un látigo de fuego del abismo. Usa Carisma." },
    abismo: { nombre: "Llamada del abismo", efecto: "dano", tipo: "arcana", stat: "elo", dado: [3, 8], area: true, aplica: ["quemadura", 3, 1], usos: 1, desc: "Se abre una grieta al infierno bajo todos los enemigos." },
    /* Brujo · Lazo del vacío */
    toqueVacio: { nombre: "Toque del vacío", efecto: "dano", tipo: "arcana", stat: "elo", dado: [1, 8], tirada: true, maldice: true, drena: true, usos: 2, desc: "Tu mano roza su alma: lo maldices y te curas la mitad." },
    devorarAlma: { nombre: "Devorar el alma", efecto: "dano", tipo: "arcana", stat: "elo", dado: [4, 8], tirada: true, ejecuta: 0.35, drena: true, usos: 1, desc: "El vacío se lo traga: te curas la mitad y doble daño a los malheridos." },

    /* Clérigo · Luz */
    rayoAlba: { nombre: "Rayo del alba", efecto: "dano", tipo: "sagrada", stat: "tem", dado: [2, 6], tirada: true, noMuerto: 2, aplica: ["ciego", 2, 0.6], usos: 3, desc: "Un haz de amanecer. Doble contra no muertos y puede cegar." },
    amanecer: { nombre: "Amanecer de Solara", efecto: "cura", a: "grupo", stat: "tem", dado: [3, 6], regen: 3, limpia: true, usos: 1, desc: "La Dama del Alba sonríe: cura, purifica y regenera a todo el grupo." },
    /* Clérigo · Tempestad */
    trueno: { nombre: "Martillo del trueno", efecto: "dano", tipo: "arcana", stat: "tem", dado: [2, 8], tirada: true, aplica: ["paralisis", 1, 0.4], usos: 3, desc: "Un martillo de relámpago que puede paralizar." },
    iraCielos: { nombre: "Ira de los cielos", efecto: "dano", tipo: "arcana", stat: "tem", dado: [4, 8], area: true, aplica: ["paralisis", 1, 0.6], usos: 1, desc: "La tormenta responde a tu plegaria y cae sobre todos los enemigos." },

    /* Bardo · Escaldo de guerra */
    cancionAcero: { nombre: "Canción de acero", efecto: "dano", tipo: "fisica", stat: "elo", dado: [2, 6], tirada: true, aplica: ["sangrado", 2, 0.5], usos: 3, desc: "Golpeas al ritmo del cántico de guerra. Usa Carisma." },
    saga: { nombre: "Saga de los caídos", efecto: "dano", tipo: "fisica", stat: "elo", dado: [3, 6], bono: 2, area: true, debilita: true, usos: 1, desc: "Cantas a los héroes muertos y su furia golpea a todos los enemigos y los debilita." },
    /* Bardo · Ilusionista */
    espejo: { nombre: "Imagen espejo", efecto: "escudo", usos: 2, desc: "Un doble ilusorio recibe el próximo ataque enemigo." },
    pesadilla: { nombre: "Pesadilla fantasmal", efecto: "dano", tipo: "arcana", stat: "elo", dado: [4, 6], maldice: true, aplica: ["ciego", 2, 1], usos: 1, desc: "Le muestras su peor miedo: daño seguro, queda maldito y ciego." }
  });

  const nh = hab => ({ hab });
  const np = (nombre, desc, pas) => ({ nombre, desc, pas });
  const sub = (id, nombre, lema, desc, pas, nodos) => ({ id, nombre, lema, desc, pas, nodos });

  DATOS.SUBCLASES = {
    guerrero: [
      sub("paladin", "Paladín", "Mi juramento es mi escudo.", "Guerrero sagrado que aguanta, protege y castiga a los no muertos con la luz de su fe.",
        { ca: 1, dano: { sagrada: 2 } },
        [nh("castigo"), np("Aura de protección", "Recibes 1 de daño menos por golpe y recuperas 1 PG cada ronda.", { reduccion: 1, regen: 1 }),
          np("Fe inquebrantable", "+5 PG máximos y +2 a tus curas.", { alma: 5, cura: 2 }), nh("juramento")]),
      sub("campeon", "Campeón", "Un golpe, una leyenda.", "Maestro del combate puro que busca el crítico perfecto y el remate glorioso.",
        { critico: 1, racha: 1 },
        [np("Atleta excepcional", "+2 a la iniciativa y minijuegos de ataque más fáciles.", { ini: 2, ataqueMini: 1.2 }), nh("embestida"),
          np("Crítico superior", "Crítico un punto antes y +2 al daño físico.", { critico: 1, dano: { fisica: 2 } }), nh("golpeCampeon")])
    ],
    barbaro: [
      sub("berserker", "Berserker", "Cuanto más sangro, más río.", "Furia sin freno que cambia defensa por daño y se cura matando.",
        { dano: { fisica: 1 }, vampiro: 2 },
        [nh("tajoSediento"), np("Furia ciega", "Racha máxima +1 y crítico un punto antes.", { racha: 1, critico: 1 }),
          np("Umbral del dolor", "+4 PG máximos y remates desde el 30 % de vida.", { alma: 4, remate: 0.3 }), nh("carniceria")]),
      sub("totem", "Guardián tótem", "La montaña no se aparta.", "Protector espiritual que atrae los golpes y los encaja como una roca.",
        { alma: 4, reduccion: 1 },
        [np("Espíritu del alce", "+2 iniciativa y defensas más fáciles.", { ini: 2, defensa: 1.25 }), nh("aullido"),
          np("Corteza ancestral", "Recibes 1 de daño menos y recuperas 1 PG cada ronda.", { reduccion: 1, regen: 1 }), nh("punoTotem")])
    ],
    picaro: [
      sub("sombra", "Asesino de sombras", "Nunca me verás venir.", "Asesino paciente que espera el momento exacto para un crítico letal.",
        { critico: 1, remate: 0.3 },
        [nh("medianoche"), np("Paso de sombra", "+3 iniciativa y 10 % de esquivar.", { ini: 3, esquivar: 0.1 }),
          np("Anatomía letal", "+2 al daño físico y crítico un punto antes.", { dano: { fisica: 2 }, critico: 1 }), nh("muerteSilenciosa")]),
      sub("duelista", "Duelista", "En guardia, si os atrevéis.", "Esgrimista elegante que pelea con Carisma, desarma al rival y no se deja tocar.",
        { ca: 1, ataqueMini: 1.2 },
        [np("Guardia de esgrima", "Defensas más fáciles y 10 % de esquivar.", { defensa: 1.3, esquivar: 0.1 }), nh("floritura"),
          np("Pies ligeros", "+2 iniciativa y racha máxima +1.", { ini: 2, racha: 1 }), nh("estocadaMortal")])
    ],
    explorador: [
      sub("bestias", "Señor de las bestias", "Nunca cazo solo.", "Rastreador unido a un lobo compañero: golpes múltiples, aguante y regeneración salvaje.",
        { alma: 3, regen: 1 },
        [nh("zarpazo"), np("Vínculo salvaje", "Te curas 2 PG al abatir a un enemigo y recuperas 1 PG cada ronda.", { vampiro: 2, regen: 1 }),
          np("Instinto de manada", "+1 al daño físico, +2 iniciativa y defensas más fáciles.", { dano: { fisica: 1 }, ini: 2, defensa: 1.2 }), nh("estampida")]),
      sub("francotirador", "Francotirador", "Una flecha, un nombre.", "Tirador paciente que ciega primero y luego atraviesa de un solo disparo.",
        { critico: 1, ataqueMini: 1.2 },
        [np("Paciencia del cazador", "+2 al daño físico.", { dano: { fisica: 2 } }), nh("alOjo"),
          np("Ojo de águila", "Crítico un punto antes y remates desde el 30 % de vida.", { critico: 1, remate: 0.3 }), nh("perforante")])
    ],
    mago: [
      sub("piromante", "Piromante", "Todo arde si sabes encenderlo.", "Evocador del fuego que lo quema todo: daño directo y quemaduras que no se apagan.",
        { dano: { arcana: 1 }, critico: 1 },
        [nh("saetaIgnea"), np("Corazón de ascuas", "+2 al daño mágico.", { dano: { arcana: 2 } }),
          np("Combustión", "Crítico un punto antes y racha máxima +1.", { critico: 1, racha: 1 }), nh("infierno")]),
      sub("cronomante", "Cronomante", "Tengo todo el tiempo del mundo.", "Manipulador del tiempo que no mata: congela a los enemigos y ayuda al grupo a actuar antes.",
        { ini: 4, pm: 2 },
        [np("Eco temporal", "Recuperas 1 PM cada ronda y racha máxima +1.", { meditar: 1, racha: 1 }), nh("ralentizar"),
          np("Desfase", "15 % de esquivar y defensas más fáciles.", { esquivar: 0.15, defensa: 1.2 }), nh("paradoja")])
    ],
    brujo: [
      sub("pactoInfernal", "Pacto infernal", "El Príncipe cobra en ceniza.", "Brujo de fuego del abismo que quema a grupos enteros y se alimenta de cada caída.",
        { dano: { arcana: 1 }, vampiro: 2 },
        [nh("latigo"), np("Sangre de azufre", "+4 PG máximos y 1 de daño menos por golpe.", { alma: 4, reduccion: 1 }),
          np("Ascuas del Príncipe", "+2 al daño mágico.", { dano: { arcana: 2 } }), nh("abismo")]),
      sub("vacio", "Lazo del vacío", "Algo me mira desde dentro.", "Brujo ligado a lo que hay entre las estrellas: maldice, roba vida y remata a los débiles.",
        { pm: 3, meditar: 1 },
        [np("Mente fracturada", "10 % de esquivar y +2 iniciativa.", { esquivar: 0.1, ini: 2 }), nh("toqueVacio"),
          np("Hambre insaciable", "Te curas 3 PG al abatir y remates desde el 30 % de vida.", { vampiro: 3, remate: 0.3 }), nh("devorarAlma")])
    ],
    clerigo: [
      sub("dominioLuz", "Dominio de la Luz", "Donde llego, amanece.", "Sanador radiante: cura más, regenera al grupo y ciega a las criaturas de la noche.",
        { cura: 2, dano: { sagrada: 1 } },
        [nh("rayoAlba"), np("Halo radiante", "+1 a la CA y recuperas 1 PG cada ronda.", { ca: 1, regen: 1 }),
          np("Mañana eterna", "+4 PG máximos y +2 a tus curas.", { alma: 4, cura: 2 }), nh("amanecer")]),
      sub("tempestad", "Dominio de la Tempestad", "Solara también habla con truenos.", "Sacerdote guerrero que invoca relámpagos y paraliza a sus enemigos.",
        { dano: { arcana: 2 }, ca: 1 },
        [np("Furia de la tormenta", "Crítico un punto antes y racha máxima +1.", { critico: 1, racha: 1 }), nh("trueno"),
          np("Ojo del huracán", "Defensas más fáciles y 10 % de esquivar.", { defensa: 1.25, esquivar: 0.1 }), nh("iraCielos")])
    ],
    bardo: [
      sub("escaldo", "Escaldo de guerra", "Cada golpe, un verso.", "Bardo de primera línea que canta con el hacha en la mano y aguanta en el frente.",
        { dano: { fisica: 2 }, alma: 3 },
        [nh("cancionAcero"), np("Coro de batalla", "Racha máxima +1 y +2 iniciativa.", { racha: 1, ini: 2 }),
          np("Sangre de escaldo", "1 de daño menos por golpe y te curas 2 PG al abatir.", { reduccion: 1, vampiro: 2 }), nh("saga")]),
      sub("ilusionista", "Ilusionista", "Lo que ves no es lo que hay.", "Embaucador que nunca está donde le golpean y llena de pesadillas a sus enemigos.",
        { esquivar: 0.1, ataqueMini: 1.2 },
        [np("Velo de engaños", "10 % más de esquivar y defensas más fáciles.", { esquivar: 0.1, defensa: 1.2 }), nh("espejo"),
          np("Mente prestidigitadora", "+3 PM máximos y recuperas 1 PM cada ronda.", { pm: 3, meditar: 1 }), nh("pesadilla")])
    ]
  };
})();
