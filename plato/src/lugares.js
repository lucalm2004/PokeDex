/* Dados y Mazmorras · lugares del mapa, sus sucesos, historietas encadenadas y encargos.
   Se carga después de datos.js, contenido.js e historia.js y amplía el objeto global DATOS.

   LUGARES[acto] = [{ id, nombre, fondo, pistas, tipos, enemigos }]: cada casilla del mapa pertenece a un lugar;
   las pistas se ven desde el cruce y los sucesos con `lugar` solo salen al llegar allí.
   Efectos nuevos: combate: "<enemigo>" (pelea tras el resultado) y encargo: "<id>" (acepta un encargo).
   ENCARGOS: tipo "matar" (objetivo = enemigo), "visitar" (objetivo = tipo de casilla) o "sobrevivir" (combates ganados). */
(() => {
  "use strict";
  const { EVENTOS } = DATOS;

  /* ---------- Lugares ---------- */
  DATOS.LUGARES = {
    /* Acto I · El Camino del Bosque */
    0: [
      { id: "molino_hollin", nombre: "El molino quemado", fondo: "aldea",
        pistas: ["Un molino sin aspas humea a lo lejos", "Huele a harina quemada y a sebo", "Alguien canta bajito, desafinado"],
        tipos: ["evento", "misterio", "altar", "combate"], enemigos: ["rata", "goblin"] },
      { id: "grifo_tuerto", nombre: "El Grifo Tuerto", fondo: "taberna",
        pistas: ["Un letrero con un grifo tuerto chirría al viento", "Risas, jarras y alguna silla rota", "Huele a cerveza agria y a estofado"],
        tipos: ["tienda", "evento", "hoguera"], enemigos: ["rata"] },
      { id: "campamento_krug", nombre: "El campamento de Krug", fondo: "bosque",
        pistas: ["Humo de hoguera mal apagada entre los pinos", "Risas agudas y un tambor de calabaza", "Huesos de gallina por todas partes"],
        tipos: ["combate", "elite", "tesoro"], enemigos: ["goblin", "lobo"] },
      { id: "robledal", nombre: "El Robledal Susurrante", fondo: "bosque",
        pistas: ["Robles tan viejos que se inclinan para escuchar", "Las hojas susurran nombres que no son los vuestros", "Plumas enormes enganchadas en la corteza"],
        tipos: ["evento", "santuario", "hoguera", "misterio"], enemigos: ["osolechuza", "lobo"] },
      { id: "vado_ahorcado", nombre: "El vado del Ahorcado", fondo: "puente",
        pistas: ["Una cuerda vieja cuelga sobre el río", "El agua ruge entre las piedras", "Aullidos en la otra orilla"],
        tipos: ["combate", "evento", "tesoro"], enemigos: ["lobo", "goblin"] },
      { id: "cruz_peregrinos", nombre: "La cruz de los peregrinos", fondo: "encrucijada",
        pistas: ["Una cruz de piedra en un cruce de cuatro caminos", "Cintas de colores atadas a un poste", "Un himno de Solara, cantado a medias"],
        tipos: ["santuario", "altar", "tienda", "evento"], enemigos: ["goblin", "rata"] },
      { id: "torre_vigia", nombre: "La torre del vigía", fondo: "ruinas",
        pistas: ["Una torre partida en dos asoma sobre los árboles", "Plumas y huesos al pie de la muralla", "Un ulular grave. Demasiado grave"],
        tipos: ["ruinas", "tesoro", "elite", "combate"], enemigos: ["osolechuza", "rata"] },
      { id: "posta_abandonada", nombre: "La posta abandonada", fondo: "camino",
        pistas: ["Un letrero de posta cuelga de un solo clavo", "Huele a heno viejo y a caballo muerto", "Aullidos que se acercan al atardecer"],
        tipos: ["hoguera", "tesoro", "combate"], enemigos: ["lobo", "rata"] }
    ],
    /* Acto II · La Mazmorra */
    1: [
      { id: "bodega_reyes", nombre: "La bodega de los reyes", fondo: "sotano",
        pistas: ["Huele a vino picado y a barrica podrida", "Algo gotea despacio, como un reloj", "Un chillido agudo entre los toneles"],
        tipos: ["tesoro", "combate", "evento"], enemigos: ["rata", "mimico"] },
      { id: "osario", nombre: "El osario", fondo: "cripta",
        pistas: ["Calaveras apiladas formando muros", "Un crujido rítmico, como pasos en grava", "Velas que nadie ha encendido y arden"],
        tipos: ["combate", "elite", "altar"], enemigos: ["esqueleto"] },
      { id: "galeria_limpia", nombre: "La galería limpia", fondo: "mina",
        pistas: ["Un túnel limpio, demasiado limpio", "Ni polvo, ni huesos, ni ratas", "Un leve olor a vinagre"],
        tipos: ["combate", "elite", "misterio", "tesoro"], enemigos: ["cubo", "rata"] },
      { id: "capilla_hundida", nombre: "La capilla hundida", fondo: "cripta",
        pistas: ["Un himno sin voz sube del suelo", "Agua estancada con velas flotando", "Notas de laúd, muy lejos"],
        tipos: ["santuario", "altar", "hoguera"], enemigos: ["esqueleto"] },
      { id: "mina_plata", nombre: "La mina de plata vieja", fondo: "mina",
        pistas: ["Raíles torcidos que se pierden en lo oscuro", "Un carro de mineral volcado", "Una mujer maldice a una mula"],
        tipos: ["forja", "tesoro", "combate", "tienda"], enemigos: ["rata", "cubo"] },
      { id: "carromato_fizwick", nombre: "El carromato de Fizwick", fondo: "sotano",
        pistas: ["Un carromato de colores imposibles en un sótano", "Explosiones pequeñas y muy frecuentes", "Una campanilla y una voz aguda: «¡Ofertas!»"],
        tipos: ["tienda", "evento"], enemigos: ["mimico", "rata"] },
      { id: "camara_tesorero", nombre: "La cámara del tesorero", fondo: "cripta",
        pistas: ["Un brillo dorado tras una reja", "Huele a cerradura y a aliento", "Monedas sueltas que parecen moverse"],
        tipos: ["tesoro", "elite", "misterio"], enemigos: ["mimico", "esqueleto"] },
      { id: "pozo_ecos", nombre: "El pozo de los ecos", fondo: "sotano",
        pistas: ["Una voz repite lo que decís, pero cambiado", "Un frío que sube de abajo", "Cadenas que tintinean solas"],
        tipos: ["misterio", "evento", "hoguera"], enemigos: ["cubo", "esqueleto"] }
    ],
    /* Acto III · El Castillo */
    2: [
      { id: "patio_armas", nombre: "El patio de armas", fondo: "castillo",
        pistas: ["Choque de metal contra metal, sin un grito", "Estandartes rasgados al viento", "Pasos pesados que marcan el compás"],
        tipos: ["combate", "elite", "forja"], enemigos: ["armadura", "lobo"] },
      { id: "perrera", nombre: "La perrera del conde", fondo: "sotano",
        pistas: ["Gruñidos y cadenas tensas", "Huele a perro mojado y a carne cruda", "Un silbato suena, pero nadie lo sopla"],
        tipos: ["combate", "evento"], enemigos: ["lobo"] },
      { id: "cocinas", nombre: "Las cocinas del castillo", fondo: "sotano",
        pistas: ["Huele a ajo, curiosamente", "Ollas que hierven sin fuego", "Alguien canturrea mientras pela algo"],
        tipos: ["tienda", "evento", "hoguera"], enemigos: ["mimico", "lobo"] },
      { id: "galeria_retratos", nombre: "La galería de retratos", fondo: "castillo",
        pistas: ["Ojos pintados que siguen vuestros pasos", "Marcos dorados sin una mota de polvo", "Una armadura en cada esquina, quieta"],
        tipos: ["misterio", "evento", "tesoro"], enemigos: ["armadura", "mimico"] },
      { id: "capilla_profanada", nombre: "La capilla profanada", fondo: "cripta",
        pistas: ["Una campana rajada que suena sola", "Huele a incienso viejo y a sangre", "Luz de vela tras una vidriera rota"],
        tipos: ["santuario", "altar"], enemigos: ["esqueleto"] },
      { id: "salon_baile", nombre: "El salón de baile", fondo: "trono",
        pistas: ["Un vals suena en una sala vacía", "Lámparas que se balancean sin viento", "Risas de damas que nadie ve"],
        tipos: ["evento", "elite", "misterio"], enemigos: ["armadura", "esqueleto"] },
      { id: "torre_reina", nombre: "La torre de la reina", fondo: "castillo",
        pistas: ["Una escalera de caracol sin fin", "Un llanto de mujer que sube y baja", "Pétalos secos en los escalones"],
        tipos: ["evento", "hoguera", "santuario"], enemigos: ["esqueleto"] },
      { id: "tesoreria", nombre: "La tesorería de Varkhul", fondo: "trono",
        pistas: ["Una puerta con siete cerraduras", "Un tintineo de monedas que se cuentan solas", "Huele a cuero y a sangre seca"],
        tipos: ["tesoro", "elite"], enemigos: ["mimico", "armadura"] }
    ],
    /* Acto IV · El Volcán */
    3: [
      { id: "ladera_ceniza", nombre: "La ladera de ceniza", fondo: "pico",
        pistas: ["Ceniza caliente que cruje bajo las botas", "El cielo rojo sobre la cumbre", "Gritos de kobold a lo lejos"],
        tipos: ["combate", "hoguera", "evento"], enemigos: ["kobold", "elemental"] },
      { id: "boca_mina", nombre: "La boca de Barak-Thur", fondo: "mina",
        pistas: ["Una puerta de piedra con runas enanas", "Golpes de pico que no paran", "Chillidos y olor a sebo de lámpara"],
        tipos: ["combate", "tienda", "evento"], enemigos: ["kobold", "golem"] },
      { id: "gran_forja", nombre: "La gran forja", fondo: "forja",
        pistas: ["Un resplandor naranja que late como un corazón", "El yunque suena solo, de vez en cuando", "El aire tiembla de calor"],
        tipos: ["forja", "elite"], enemigos: ["golem", "elemental"] },
      { id: "templo_kobold", nombre: "El templo de los kobolds", fondo: "guarida",
        pistas: ["Cánticos agudos y desafinados", "Un dragón de barro de tres metros", "Montones de cacharros que brillan"],
        tipos: ["altar", "combate", "tesoro"], enemigos: ["kobold"] },
      { id: "rio_lava", nombre: "El río de lava", fondo: "pico",
        pistas: ["Un río de fuego que alumbra la noche", "Rocas que flotan y se hunden", "Una lucecita que llama desde un farol"],
        tipos: ["evento", "misterio", "combate"], enemigos: ["elemental"] },
      { id: "salas_ancestros", nombre: "La sala de los ancestros", fondo: "mina",
        pistas: ["Estatuas de reyes enanos con barba hasta el suelo", "Un canto grave que sale de la piedra", "Polvo que brilla como oro"],
        tipos: ["santuario", "ruinas", "tesoro"], enemigos: ["golem"] },
      { id: "campamento_hollin", nombre: "El campamento de Madre Hollín", fondo: "pico",
        pistas: ["Tiendas negras alrededor de una hoguera de huesos", "Un cántico que repite «el Ojo, el Ojo»", "Un ojo cerrado pintado en las rocas"],
        tipos: ["evento", "altar", "combate"], enemigos: ["kobold", "elemental"] },
      { id: "muladar_dragon", nombre: "El muladar del dragón", fondo: "guarida",
        pistas: ["Montañas de huesos y oro revueltos", "Azufre que pica en los ojos", "Una respiración enorme y lenta, al fondo"],
        tipos: ["tesoro", "elite", "misterio"], enemigos: ["kobold", "golem"] }
    ],
    /* Acto V · El Abismo */
    4: [
      { id: "orilla_estrellas", nombre: "La orilla de las estrellas muertas", fondo: "abismo",
        pistas: ["Estrellas apagadas flotan como piedras", "Un frío que no viene de ninguna parte", "Tanto silencio que se oye el corazón"],
        tipos: ["misterio", "evento", "hoguera"], enemigos: ["sombra"] },
      { id: "bosque_seda", nombre: "El bosque de seda", fondo: "telarana",
        pistas: ["Hilos gruesos como maromas de barco", "Algo grande cruje sobre vuestras cabezas", "Bultos envueltos que aún se mueven"],
        tipos: ["combate", "elite", "tesoro"], enemigos: ["arana"] },
      { id: "garito_diablillos", nombre: "El garito de los diablillos", fondo: "ruinas",
        pistas: ["Risas chillonas y un tintineo de dados", "Huele a azufre y a cerveza barata", "Luz roja en una casa sin tejado"],
        tipos: ["tienda", "evento", "combate"], enemigos: ["diablillo"] },
      { id: "ciudad_hundida", nombre: "La ciudad devorada", fondo: "ruinas",
        pistas: ["Torres de una ciudad hundida en la nada", "Campanas que suenan bajo los pies", "Sombras asomadas a ventanas sin casa"],
        tipos: ["ruinas", "tesoro", "combate"], enemigos: ["sombra", "diablillo"] },
      { id: "nido_arana", nombre: "El nido de la madre araña", fondo: "telarana",
        pistas: ["Huevos negros pegados a la roca", "Un olor dulce que marea", "Un chasquido de patas. Muchas"],
        tipos: ["elite", "tesoro"], enemigos: ["arana"] },
      { id: "altar_ojo", nombre: "El altar del Ojo", fondo: "abismo",
        pistas: ["Un ojo cerrado tallado en roca negra", "Velas que dan oscuridad en vez de luz", "Un susurro que dice vuestros nombres"],
        tipos: ["altar", "misterio", "evento"], enemigos: ["sombra", "diablillo"] },
      { id: "templo_olvidado", nombre: "El templo del dios olvidado", fondo: "ruinas",
        pistas: ["Columnas rotas con las caras borradas", "Una vela que nunca se apaga", "Rezos en una lengua muerta"],
        tipos: ["santuario", "hoguera", "ruinas"], enemigos: ["sombra"] },
      { id: "escalera_rota", nombre: "La escalera sin fondo", fondo: "abismo",
        pistas: ["Una escalera de piedra que baja a ninguna parte", "Faltan escalones, a trozos", "Risas que suben desde abajo"],
        tipos: ["combate", "evento", "misterio"], enemigos: ["diablillo", "sombra"] }
    ]
  };

  /* ---------- Encargos ---------- */
  DATOS.ENCARGOS = [
    { id: "enc_bodega", titulo: "Ratas en la bodega", desc: "El tabernero del Grifo Tuerto paga por cada plaga de ratas que dejéis tiesa. Tres, ni una menos.",
      tipo: "matar", objetivo: "rata", n: 3, actos: [0, 1], recompensa: { oro: 18, pocion: 1, xp: 6 },
      texto: "El tabernero os manda la ronda de la casa con un mozo. Y la cuenta de la anterior, roto el papel." },
    { id: "enc_pieles", titulo: "Pieles de huargo", desc: "El peletero de la posta quiere pieles de huargo. Las de su caballo ya no le sirven.",
      tipo: "matar", objetivo: "lobo", n: 3, actos: [0, 2], recompensa: { oro: 20, botin: true, xp: 6 },
      texto: "Las pieles valen buen dinero. El peletero, por fin, duerme con la puerta abierta." },
    { id: "enc_krug", titulo: "Orejas verdes", desc: "Los granjeros del vado pagan por los goblins de Krug. Dos bandas, y que no vuelvan.",
      tipo: "matar", objetivo: "goblin", n: 2, actos: [0], recompensa: { oro: 22, xp: 8 },
      texto: "Los granjeros clavan las orejas en la puerta del vado. Feo, pero eficaz." },
    { id: "enc_plumas", titulo: "Plumas para la dríada", desc: "La dríada del robledal quiere al oso-lechuza fuera de su bosque. Del todo.",
      tipo: "matar", objetivo: "osolechuza", n: 1, actos: [0], recompensa: { bendicionB: true, pocion: 1, xp: 10 },
      texto: "Las hojas susurran vuestros nombres, esta vez bien dichos. Vuestras armas huelen a lluvia." },
    { id: "enc_huesos", titulo: "Muertos sin permiso", desc: "El enterrador fantasma del osario quiere sus muertos tumbados. Tres guardias, como mínimo.",
      tipo: "matar", objetivo: "esqueleto", n: 3, actos: [1, 2], recompensa: { oro: 25, xp: 10 },
      texto: "Una voz de pala y polvo: «Gracias. Ya puedo morirme tranquilo. Otra vez»." },
    { id: "enc_lengua", titulo: "Pegamento de mímico", desc: "Fizwick necesita dos lenguas de mímico para su pegamento. No preguntéis.",
      tipo: "matar", objetivo: "mimico", n: 2, actos: [1, 2], recompensa: { oro: 30, superior: 1 },
      texto: "¡Puf! Fizwick aparece, mete las lenguas en un frasco y paga. Casi todo." },
    { id: "enc_armaduras", titulo: "Armaduras sin señor", desc: "El escudero fantasma no soporta ver armaduras vacías paseando. Tumbad dos.",
      tipo: "matar", objetivo: "armadura", n: 2, actos: [2], recompensa: { botin: true, xp: 10 },
      texto: "El escudero os entrega la espada de su amo con una reverencia que le cuesta la cabeza." },
    { id: "enc_kobolds", titulo: "Ladrones de dientes", desc: "Los mineros de Barak-Thur quieren tres bandas de kobolds menos. Les roban hasta los dientes.",
      tipo: "matar", objetivo: "kobold", n: 3, actos: [3], recompensa: { oro: 30, xp: 10 },
      texto: "Los enanos os pagan y, lo que es más raro, os dan las gracias." },
    { id: "enc_brasas", titulo: "Fuego robado", desc: "El herrero de la gran forja quiere apagar dos elementales que le roban el fuego.",
      tipo: "matar", objetivo: "elemental", n: 2, actos: [3], recompensa: { mejora: 1, xp: 12 },
      texto: "El herrero mete vuestras armas en su fuego recuperado. Salen cantando." },
    { id: "enc_telas", titulo: "Seda para el amo", desc: "Un diablillo sastre paga en oro de verdad por seda de dos arañas de las sombras.",
      tipo: "matar", objetivo: "arana", n: 2, actos: [4], recompensa: { oro: 40, xp: 12 },
      texto: "El sastre mide la seda con la cola y paga. Por una vez, el oro no quema." },
    { id: "enc_peregrino", titulo: "El rosario del ciego", desc: "Llevad el rosario del peregrino ciego a dos santuarios del camino.",
      tipo: "visitar", objetivo: "santuario", n: 2, actos: [0, 1, 2], recompensa: { bendicion: 2, xp: 8 },
      texto: "El rosario se calienta en vuestras manos. Lejos, un ciego sonríe." },
    { id: "enc_cartografo", titulo: "Ruinas para el mapa", desc: "Al cartógrafo de la torre le faltan dos ruinas en su mapa y le sobran miedos.",
      tipo: "visitar", objetivo: "ruinas", n: 2, actos: [0, 4], recompensa: { oro: 25, xp: 10 },
      texto: "Mandáis los dibujos con un cuervo. Vuelve con monedas y una nota: «¿Eso es una torre o un pie?»." },
    { id: "enc_escolta", titulo: "Escolta para Brunilda", desc: "Brunilda cruza la mazmorra con su mula. Ganad tres peleas sin perderla de vista.",
      tipo: "sobrevivir", objetivo: "combate", n: 3, actos: [1, 2], recompensa: { oro: 25, pocion: 2, xp: 6 },
      texto: "«¡Ni un queso roto!» Brunilda paga lo pactado y os da género de regalo." },
    { id: "enc_recado", titulo: "Cartas de la cocinera", desc: "Entregad las cartas de la cocinera del castillo en dos tiendas del camino.",
      tipo: "visitar", objetivo: "tienda", n: 2, actos: [2, 3], recompensa: { oro: 15, superior: 1, xp: 8 },
      texto: "Un mercader lee la carta en voz alta y se le quiebra la voz. Os paga el porte de su bolsillo." }
  ];

  /* ---------- Sucesos de lugar ---------- */
  EVENTOS.push(
    /* ===== Acto I ===== */
    { id: "l_molino_novicio", acto: 0, lugar: "molino_hollin", tipo: "prueba", titulo: "Un novicio con miedo",
      texto: "En el molino quemado, un novicio de los Hijos de la Ceniza llora sobre un saco de harina negra. Se llama Tizón. Quiere irse a casa.",
      opciones: [
        { txt: "Ayudarle a desertar", stat: "elo", cd: 11, ok: { t: "Le quitáis la túnica y le dais una capa. «No os olvidaré.»", fx: { xp: 3, moral: 1, marca: "tizon" } }, ko: { t: "Se asusta y huye al bosque. Al menos huye del culto.", fx: { xp: 1 } } },
        { txt: "Entregarlo al concejo", stat: null, ok: { t: "Pagan diez monedas por sectario. Tizón no aparta la vista mientras se lo llevan.", fx: { oro: 10, moral: -1 } } },
        { txt: "Sacarle lo que sabe", stat: "ani", cd: 12, ok: { t: "Habla a trompicones: «Madre Hollín dice que el dragón es una puerta».", fx: { xp: 4, pm: 2 } }, ko: { t: "Grita. Del molino salen ratas a docenas, como si las llamara.", fx: { combate: "rata" } } }] },
    { id: "l_molino_piedra", acto: 0, lugar: "molino_hollin", tipo: "prueba", titulo: "La piedra que gira sola",
      texto: "La piedra de moler gira sola, despacio, sin agua ni viento. Debajo, algo rasca y chilla.",
      opciones: [
        { txt: "Atascarla con una barra", stat: "ani", cd: 12, ok: { t: "Cruje y se para. En el hueco hay una bolsa de monedas chamuscadas.", fx: { oro: 9, xp: 2 } }, ko: { t: "La barra sale volando. De abajo salen ratas muy ofendidas.", fx: { alma: -1, combate: "rata" } } },
        { txt: "Mirar por el hueco", stat: "tem", cd: 12, ok: { t: "Un goblin roba la harina de los sectarios. Os ve y huye dejando lo robado.", fx: { botin: true, xp: 2 } }, ko: { t: "El goblin os ve primero. Silba. Vienen sus primos.", fx: { combate: "goblin" } } },
        { txt: "Desmontar el mecanismo", clase: ["picaro"], ok: { t: "Un pícaro sabe dónde esconde un molinero lo que no declara. Doble fondo. Plata.", fx: { oro: 14, xp: 2 } } }] },

    { id: "l_grifo_ratas", acto: 0, lugar: "grifo_tuerto", tipo: "prueba", pnj: "tabernero", titulo: "Las ratas del tabernero",
      texto: "El tabernero del Grifo Tuerto se seca las manos en el delantal: «Las ratas se beben mis beneficios. Os pago si limpiáis la comarca».",
      opciones: [
        { txt: "Aceptar el encargo", stat: null, ok: { t: "«Tres plagas, ni una menos. Y no me rompáis los toneles.»", fx: { encargo: "enc_bodega", xp: 1 } } },
        { txt: "Bajar ya a la bodega", stat: "ani", cd: 11, ok: { t: "Las echáis a escobazos. El tabernero os invita a estofado.", fx: { curaPct: 0.25, xp: 3 } }, ko: { t: "Bajáis. Ellas suben.", fx: { combate: "rata" } } },
        { txt: "Pedir un adelanto", stat: "elo", cd: 13, ok: { t: "Os suelta cinco monedas «a cuenta». Ya hablaréis.", fx: { oro: 5, encargo: "enc_bodega" } }, ko: { t: "«¿Adelanto? Adelantaos hacia la puerta.»", fx: {} } }] },
    { id: "l_grifo_carta", acto: 0, lugar: "grifo_tuerto", tipo: "prueba", pnj: "tabernero", titulo: "Una carta para Odo",
      texto: "El tabernero os da una carta lacrada. «Para mi hermano Odo. Bajó a la cripta de los reyes hace un año. Si lo veis, dádsela.»",
      opciones: [
        { txt: "Aceptar la carta", stat: null, ok: { t: "Pesa poco. Lo que dice, quizá mucho.", fx: { xp: 2, moral: 1, marca: "carta_odo" } } },
        { txt: "Cobrar el porte", stat: "elo", cd: 12, ok: { t: "Refunfuña y paga. La carta va con vosotros.", fx: { oro: 6, marca: "carta_odo" } }, ko: { t: "«Pues ni carta ni nada.» Os la quita de la mano.", fx: {} } },
        { txt: "Abrirla delante de él", stat: null, ok: { t: "Pone «Te perdono». El tabernero os echa a la calle con la escoba.", fx: { xp: 1, moral: -1 } } }] },

    { id: "l_krug_snig", acto: 0, lugar: "campamento_krug", tipo: "prueba", titulo: "El goblin atado",
      texto: "Un goblin flaco está atado a un pino, castigado. «Snig no robó la gallina de Krug. Snig solo la miró mucho.»",
      opciones: [
        { txt: "Desatarlo", stat: null, ok: { t: "Snig se frota las muñecas. «Snig debe favor. Snig siempre paga. A veces.»", fx: { xp: 2, moral: 1, marca: "snig" } } },
        { txt: "Usarlo de rehén", stat: "elo", cd: 12, ok: { t: "Krug paga por no perder la cara. Snig, por no perder la cabeza.", fx: { oro: 12, xp: 2 } }, ko: { t: "A Krug le da igual Snig. A vosotros no os da igual Krug.", fx: { combate: "goblin" } } },
        { txt: "Dejarlo atado", stat: null, ok: { t: "Snig os insulta en goblin con mucha imaginación.", fx: {} } }] },
    { id: "l_krug_siesta", acto: 0, lugar: "campamento_krug", tipo: "prueba", titulo: "La siesta de los goblins",
      texto: "Los goblins duermen la siesta alrededor de un cofre robado. Casi todos roncan. Uno, no.",
      opciones: [
        { txt: "Llevarse el cofre a hurtadillas", stat: "tem", cd: 13, ok: { t: "Pesa, pero no tanto como la culpa. Es decir, nada.", fx: { botin: true, oro: 6 } }, ko: { t: "El que no roncaba grita. Despiertan todos.", fx: { combate: "goblin" } } },
        { txt: "Atacar mientras duermen", stat: null, ok: { t: "La sorpresa vale por dos espadas. Queda uno despierto: el más grande.", fx: { xp: 2, moral: -1, combate: "goblin" } } },
        { txt: "Volver sus cepos contra ellos", clase: ["explorador", "picaro"], ok: { t: "Al despertar pisan sus propias trampas. Recogéis lo que sueltan al huir.", fx: { oro: 10, xp: 4 } } }] },

    { id: "l_robledal_driada", acto: 0, lugar: "robledal", tipo: "prueba", pnj: "driada", titulo: "La corteza arañada",
      texto: "Una dríada sale de un roble con la corteza llena de zarpazos. «Un oso-lechuza anida en mi bosque y se afila en mí. Echadlo.»",
      opciones: [
        { txt: "Prometer que lo cazaréis", stat: null, ok: { t: "Os besa la frente. Huele a lluvia. «Traedme sus plumas.»", fx: { encargo: "enc_plumas", bendicion: 1 } } },
        { txt: "Curarle la corteza", stat: "tem", cd: 12, ok: { t: "La savia se cierra. El robledal entero suspira y os alivia a vosotros también.", fx: { curaPct: 0.3, xp: 3, moral: 1 } }, ko: { t: "Os pringáis de savia. Ella sonríe por lástima.", fx: { xp: 1 } } },
        { txt: "Pedir algo a cambio primero", stat: "elo", cd: 13, ok: { t: "«Mercenarios.» Pero os da una bellota que cura.", fx: { pocion: 1, encargo: "enc_plumas" } }, ko: { t: "«Fuera de mi bosque.» Las raíces os ponen la zancadilla.", fx: { almaTodos: -2 } } }] },
    { id: "l_robledal_ronquido", acto: 0, lugar: "robledal", tipo: "prueba", titulo: "Un roble que ronca",
      texto: "Los robles susurran vuestros nombres. Uno los dice mal, con voz de ronquido.",
      opciones: [
        { txt: "Corregirle", stat: "elo", cd: 11, ok: { t: "El roble se avergüenza y suelta bellotas doradas.", fx: { oro: 8, xp: 2 } }, ko: { t: "Se ofende. Una rama os sacude la cabeza.", fx: { alma: -2 } } },
        { txt: "Seguir el ronquido", stat: "tem", cd: 13, ok: { t: "Es un oso-lechuza dormido. Le robáis el nido sin despertarlo.", fx: { botin: true, xp: 3 } }, ko: { t: "El ronquido se vuelve ulular. Luego, rugido.", fx: { combate: "osolechuza" } } },
        { txt: "Acampar bajo las ramas", stat: null, ok: { t: "Dormís arrullados por mil voces. Soñáis con raíces.", fx: { curaPct: 0.4 } } }] },

    { id: "l_vado_granjeros", acto: 0, lugar: "vado_ahorcado", tipo: "prueba", titulo: "Horcas en el vado",
      texto: "Dos granjeros con horcas vigilan el vado. «Los goblins de Krug nos roban las cabras. El concejo paga por orejas verdes.»",
      opciones: [
        { txt: "Aceptar la cacería", stat: null, ok: { t: "«Dos bandas, y que no vuelvan.» Os dan un queso de cabra de las que quedan.", fx: { encargo: "enc_krug", comida: 1 } } },
        { txt: "Enseñarles a defenderse", stat: "raz", cd: 12, ok: { t: "Les montáis un cepo con cuerda y campana. Pagan contentos.", fx: { oro: 7, xp: 3, moral: 1 } }, ko: { t: "La campana suena sola toda la noche. Nadie duerme.", fx: { xp: 1 } } },
        { txt: "Cobrar el paso vosotros", stat: null, ok: { t: "Les quitáis la bolsa del peaje. Ahora los bandidos sois vosotros.", fx: { oro: 10, moral: -1 } } }] },
    { id: "l_vado_cuerda", acto: 0, lugar: "vado_ahorcado", tipo: "prueba", titulo: "La cuerda del ahorcado",
      texto: "La cuerda del ahorcado sigue colgando sobre el agua. Dicen que quien la toca oye al muerto.",
      opciones: [
        { txt: "Tocarla", stat: "tem", cd: 13, ok: { t: "Una voz ronca: «Enterré mi bolsa bajo la tercera piedra». Allí está.", fx: { oro: 12, xp: 2 } }, ko: { t: "Oís al muerto. Y el muerto no se calla. Nunca.", fx: { almaTodos: -2 } } },
        { txt: "Cortarla y quemarla", stat: null, ok: { t: "Arde con un suspiro de alivio. El río suena más tranquilo.", fx: { xp: 3, moral: 1 } } },
        { txt: "Cruzar sin mirar", stat: "ani", cd: 11, ok: { t: "Agua hasta la cintura, fría como un mal recuerdo.", fx: { xp: 2 } }, ko: { t: "La corriente os arrastra a una orilla con lobos.", fx: { combate: "lobo" } } }] },

    { id: "l_cruz_ciego", acto: 0, lugar: "cruz_peregrinos", tipo: "prueba", titulo: "El rosario del ciego",
      texto: "Un peregrino ciego de Solara os tiende su rosario. «Llevadlo a dos santuarios del camino. Yo ya no los veré. Que los vea él.»",
      opciones: [
        { txt: "Llevar el rosario", stat: null, ok: { t: "«Que el alba os encuentre despiertos.»", fx: { encargo: "enc_peregrino", moral: 1, xp: 1 } } },
        { txt: "Pedirle su bendición antes", stat: "tem", cd: 11, ok: { t: "Os toca la frente con dedos calientes.", fx: { bendicion: 1, encargo: "enc_peregrino" } }, ko: { t: "Os bendice y no pasa nada. «La fe tarda», dice.", fx: { encargo: "enc_peregrino" } } },
        { txt: "Robarle el cuenco", stat: null, ok: { t: "Es ciego, no tonto. «Solara lo ha visto.»", fx: { oro: 6, alma: -1, moral: -1 } } }] },
    { id: "l_cruz_letreros", acto: 0, lugar: "cruz_peregrinos", tipo: "prueba", titulo: "Los letreros cambiados",
      texto: "Cuatro caminos y un poste con los letreros arrancados. Alguien los ha cambiado de sitio a propósito.",
      opciones: [
        { txt: "Recolocarlos", stat: "raz", cd: 12, ok: { t: "Por el sol y el barro sabéis cuál va adónde. Y dónde esconde el bromista lo robado.", fx: { oro: 8, xp: 3 } }, ko: { t: "Una hora de rodeo. Un goblin se ríe desde un árbol.", fx: { almaTodos: -1 } } },
        { txt: "Leer las huellas", clase: ["explorador"], ok: { t: "Pies pequeños y descalzos. Les tendéis la emboscada vosotros a ellos.", fx: { botin: true, xp: 5 } } },
        { txt: "Esperar a ver quién vuelve", stat: null, ok: { t: "Vuelve el bromista: un goblin con un martillo. Y sus amigos.", fx: { xp: 1, combate: "goblin" } } }] },

    { id: "l_torre_huevo", acto: 0, lugar: "torre_vigia", tipo: "prueba", titulo: "Un huevo en la torre",
      texto: "En lo alto de la torre partida hay un nido de ramas y un huevo moteado del tamaño de una cabeza. La madre ha salido. Por ahora.",
      opciones: [
        { txt: "Llevarse el huevo", stat: "ani", cd: 12, ok: { t: "Lo bajáis envuelto en una capa. Está caliente y a veces da patadas.", fx: { xp: 2, marca: "huevo_ol" } }, ko: { t: "Os pilla a media escalera. La madre ha vuelto.", fx: { combate: "osolechuza" } } },
        { txt: "Hacer una tortilla", stat: null, ok: { t: "Tortilla para seis. La madre no lo sabrá nunca. O sí.", fx: { curaPct: 0.3, moral: -1 } } },
        { txt: "Estudiar la torre", stat: "raz", cd: 12, ok: { t: "En la piedra hay un mapa grabado de las ruinas del valle.", fx: { xp: 4 } }, ko: { t: "Solo hay cacas de lechuza. Muchas.", fx: {} } }] },
    { id: "l_torre_cartografo", acto: 0, lugar: "torre_vigia", tipo: "prueba", pnj: "forastero", titulo: "El cartógrafo miedoso",
      texto: "Un cartógrafo con las gafas rotas os para: «Me faltan dos ruinas en el mapa y me sobran miedos. Os pago si las visitáis por mí».",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«Dibujad lo que veáis. Si es feo, dibujadlo bonito.»", fx: { encargo: "enc_cartografo", xp: 1 } } },
        { txt: "Venderle un mapa inventado", stat: "elo", cd: 14, ok: { t: "Lo compra encantado. Algún día alguien se perderá por vuestra culpa.", fx: { oro: 12, moral: -1 } }, ko: { t: "«Aquí pone ‘dragones’ en mitad del lago.» Os echa.", fx: {} } },
        { txt: "Explorar la torre con él", stat: "tem", cd: 12, ok: { t: "Os enseña a leer piedras. Dais con un sótano olvidado.", fx: { botin: true, encargo: "enc_cartografo" } }, ko: { t: "La escalera cede. Abajo hay ratas. Y ahora, vosotros.", fx: { combate: "rata" } } }] },

    { id: "l_posta_peletero", acto: 0, lugar: "posta_abandonada", tipo: "prueba", titulo: "El peletero manco",
      texto: "El último inquilino de la posta es un peletero con el brazo vendado. «Los huargos se comieron mi caballo. Traedme pieles y os pago como a señores.»",
      opciones: [
        { txt: "Aceptar el encargo", stat: null, ok: { t: "«Tres pieles. Sin agujeros, si puede ser.»", fx: { encargo: "enc_pieles", xp: 1 } } },
        { txt: "Curarle el brazo", stat: "tem", cd: 12, ok: { t: "Os regala su piedra de afilar. Deja los filos como el miedo.", fx: { mejora: 1, xp: 2, encargo: "enc_pieles" } }, ko: { t: "Le dolía menos antes de vosotros.", fx: { xp: 1 } } },
        { txt: "Preguntar por qué vive solo", stat: "elo", cd: 12, ok: { t: "Confiesa: cazaba furtivo en el bosque y la dríada lo maldijo. Os paga por callar.", fx: { oro: 8 } }, ko: { t: "«Preguntas, preguntas.» Os cierra la puerta.", fx: {} } }] },
    { id: "l_posta_noche", acto: 0, lugar: "posta_abandonada", tipo: "prueba", titulo: "Noche en la posta",
      texto: "Cae la noche. Los huargos rodean el establo y rascan la puerta con paciencia de lobo.",
      opciones: [
        { txt: "Atrancar y aguantar", stat: "ani", cd: 12, ok: { t: "Aguantan hasta el alba y se van. Dormís lo que se puede.", fx: { curaPct: 0.3, xp: 3 } }, ko: { t: "La puerta cede de madrugada.", fx: { combate: "lobo" } } },
        { txt: "Echarles una ración", stat: null, ok: { t: "Se pelean entre ellos por la carne y se van. Vosotros cenáis menos.", fx: { comida: -1, xp: 2 } } },
        { txt: "Salir a por ellos", stat: null, ok: { t: "La mejor defensa es un buen hachazo.", fx: { xp: 2, combate: "lobo" } } }] },

    /* ===== Acto II ===== */
    { id: "l_bodega_tonel", acto: 1, lugar: "bodega_reyes", tipo: "prueba", titulo: "Un tonel real",
      texto: "Un tonel con el sello del rey lleva trescientos años esperando. El grifo está sospechosamente limpio.",
      opciones: [
        { txt: "Probarlo", stat: "tem", cd: 12, ok: { t: "Vino de reyes. Sabe a victoria y a polvo.", fx: { curaPct: 0.3, pm: 3 } }, ko: { t: "Vinagre y muerto. Pasáis una hora regular.", fx: { almaTodos: -2 } } },
        { txt: "Darle una patada antes", stat: "ani", cd: 11, ok: { t: "Suena a madera de verdad. Dentro, vino y una bolsa escondida.", fx: { oro: 10, xp: 2 } }, ko: { t: "El tonel abre una boca llena de dientes.", fx: { combate: "mimico" } } },
        { txt: "Rodarlo hasta Fizwick", stat: null, ok: { t: "Fizwick paga, que para eso es gnomo. A vosotros os duele la espalda.", fx: { oro: 12, almaTodos: -1 } } }] },
    { id: "l_bodega_reina_rata", acto: 1, lugar: "bodega_reyes", tipo: "prueba", titulo: "La corte de las ratas",
      texto: "Ratas del tamaño de perros se han hecho un trono de corchos. La más gorda lleva al cuello el sello del copero real.",
      opciones: [
        { txt: "Robarle el sello", stat: "tem", cd: 13, ok: { t: "Plata del copero. Vale su peso en oro, más o menos.", fx: { oro: 15, xp: 2 } }, ko: { t: "La reina chilla. La corte responde.", fx: { combate: "rata" } } },
        { txt: "Ofrecerles una ración", stat: null, ok: { t: "Os abren paso con reverencias. La reina os guiña un ojo.", fx: { comida: -1, xp: 3, moral: 1 } } },
        { txt: "Quemarles el trono", stat: "raz", cd: 12, ok: { t: "Los corchos arden fatal, pero el humo las espanta. Bajo el trono, su tesoro.", fx: { botin: true, xp: 3 } }, ko: { t: "Humo, tos y toneles. Os perdéis un buen rato.", fx: { almaTodos: -2 } } }] },

    { id: "l_osario_lista", acto: 1, lugar: "osario", tipo: "prueba", titulo: "La lista de los muertos",
      texto: "Una guardia esqueleto pasa lista a los muertos del osario. Al llegar a vosotros, se detiene. «No estáis en la lista.»",
      opciones: [
        { txt: "Decir que sois nuevos", stat: "elo", cd: 13, ok: { t: "Os apunta con letra de hueso. Oficialmente estáis muertos. Tiene ventajas.", fx: { xp: 5, bendicion: 1 } }, ko: { t: "«Mentira.» Desenvaina con un chasquido.", fx: { combate: "esqueleto" } } },
        { txt: "Romperle la lista", stat: "ani", cd: 12, ok: { t: "Sin lista no hay orden. Se queda quieta, perdida, y pasáis.", fx: { xp: 3 } }, ko: { t: "Hay copia.", fx: { combate: "esqueleto" } } },
        { txt: "Darle la extremaunción", clase: ["clerigo"], ok: { t: "Solara lo apunta en su propia lista. El esqueleto se tumba, en paz.", fx: { xp: 6, almaTodos: 3, moral: 1 } } }] },
    { id: "l_osario_enterrador", acto: 1, lugar: "osario", tipo: "prueba", pnj: "fantasma", titulo: "El enterrador sin pala",
      texto: "El fantasma de un enterrador repasa sus muertos con el ceño fruncido. «Se levantan sin permiso. Tumbadlos y os pagaré con lo que se dejan los vivos.»",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«Tres guardias. Y ponedlos bien, con los pies hacia el este.»", fx: { encargo: "enc_huesos", xp: 1 } } },
        { txt: "Preguntar por qué se levantan", stat: "raz", cd: 12, ok: { t: "«Malakar los llama. Y yo ya no tengo pala.» Os dice por dónde se rompen.", fx: { xp: 4, encargo: "enc_huesos" } }, ko: { t: "«Porque sí.» Los fantasmas explican fatal.", fx: { encargo: "enc_huesos" } } },
        { txt: "Saquear los nichos mientras habla", stat: null, ok: { t: "Anillos y dientes de oro. Él lo apunta todo, despacio, en una lista nueva.", fx: { oro: 14, alma: -2, moral: -1 } } }] },

    { id: "l_galeria_espada", acto: 1, lugar: "galeria_limpia", tipo: "prueba", titulo: "Una espada en el aire",
      texto: "En mitad del túnel flota una espada, quieta a la altura del pecho. Dentro de nada.",
      opciones: [
        { txt: "Arrancarla", stat: "ani", cd: 14, ok: { t: "Sale con un chupetón. La nada se retira, ofendida.", fx: { mejora: 1, xp: 3 } }, ko: { t: "La nada os coge a vosotros.", fx: { combate: "cubo" } } },
        { txt: "Lanzarle fuego a la nada", stat: "raz", cd: 12, ok: { t: "La nada hierve y encoge. La espada cae al suelo, limpia.", fx: { botin: true, xp: 3 } }, ko: { t: "No hierve. Se enfada.", fx: { combate: "cubo" } } },
        { txt: "Rodearla pegados a la pared", stat: "tem", cd: 11, ok: { t: "Pasáis rozando la roca. La espada se queda para el siguiente.", fx: { xp: 2 } }, ko: { t: "Rozáis algo frío y pegajoso. Os quita una bota y media piel.", fx: { alma: -3 } } }] },
    { id: "l_galeria_aviso", acto: 1, lugar: "galeria_limpia", tipo: "prueba", titulo: "«No paréis»",
      texto: "El túnel está tan limpio que os veis reflejados en la roca. Alguien ha escrito en el suelo con huesos: «No paréis».",
      opciones: [
        { txt: "Hacer caso y correr", stat: "ani", cd: 12, ok: { t: "Corréis. A vuestra espalda, algo gelatinoso se traga el silencio.", fx: { xp: 3 } }, ko: { t: "Alguien tropieza. Lo que viene detrás, no.", fx: { combate: "cubo" } } },
        { txt: "Buscar a quien lo escribió", stat: "tem", cd: 12, ok: { t: "Un minero encajado en una grieta. Lo sacáis y os da su jornal.", fx: { oro: 10, xp: 3, moral: 1 } }, ko: { t: "Lo escribió un cadáver. No hay más que hablar.", fx: { xp: 1 } } },
        { txt: "Parar a ver qué pasa", stat: null, ok: { t: "Lo que pasa es grande, transparente y tiene hambre.", fx: { xp: 1, combate: "cubo" } } }] },

    { id: "l_capilla_laud", acto: 1, lugar: "capilla_hundida", tipo: "prueba", pnj: "fantasma", titulo: "El juglar sin laúd",
      texto: "El fantasma de un juglar rebusca bajo el agua de la capilla. «Mi laúd. Sin él no termino la canción, y sin canción no me voy.»",
      opciones: [
        { txt: "Bucear a por el laúd", stat: "ani", cd: 12, ok: { t: "Sale lleno de lodo. «Tocadla en el baile del castillo. Allí la empecé.»", fx: { xp: 3, marca: "laud" } }, ko: { t: "Tragáis agua de muertos, pero lo sacáis.", fx: { almaTodos: -2, marca: "laud" } } },
        { txt: "Terminar la canción por él", clase: ["bardo"], ok: { t: "Un bardo reconoce la melodía. El juglar se desvanece aplaudiendo.", fx: { xp: 6, bendicion: 1, moral: 1 } } },
        { txt: "Dejarle buscando", stat: null, ok: { t: "Lleva así doscientos años. Puede seguir.", fx: {} } }] },
    { id: "l_capilla_agua", acto: 1, lugar: "capilla_hundida", tipo: "prueba", titulo: "Agua bendita y fría",
      texto: "El agua de la capilla está bendita y helada. En el fondo brillan monedas de ofrenda.",
      opciones: [
        { txt: "Lavaros las heridas", stat: null, ok: { t: "Escuece como la verdad. Luego alivia.", fx: { curaPct: 0.4 } } },
        { txt: "Rezar con el agua a la cintura", stat: "tem", cd: 13, ok: { t: "Por un momento, la cripta huele a alba. Vuestras armas brillan.", fx: { bendicionB: true, xp: 3 } }, ko: { t: "Solo os mojáis las rodillas.", fx: { xp: 1 } } },
        { txt: "Pescar las monedas", stat: null, ok: { t: "Plata santa. En los nichos, los muertos giran la cabeza.", fx: { oro: 12, moral: -1, combate: "esqueleto" } } }] },

    { id: "l_mina_brunilda", acto: 1, lugar: "mina_plata", tipo: "prueba", pnj: "mercader", titulo: "Brunilda y la mula",
      texto: "Brunilda, la mercader, tira de una mula que no quiere bajar ni un escalón más. «Tengo que cruzar esta mazmorra con género. Escoltadme y os haré precio.»",
      opciones: [
        { txt: "Escoltarla", stat: null, ok: { t: "«Tres peleas y salgo de aquí. Ni una más, que se me cortan los quesos.»", fx: { encargo: "enc_escolta", xp: 1 } } },
        { txt: "Comprarle pociones", stat: null, ok: { t: "Precio de amiga. Casi.", fx: { oro: -8, pocion: 2 } } },
        { txt: "Asustar a la mula", stat: "ani", cd: 13, ok: { t: "La mula baja. Brunilda os mira con respeto y algo de miedo, y os paga.", fx: { oro: 6, xp: 2 } }, ko: { t: "La mula os coce. Brunilda se ríe hasta llorar.", fx: { alma: -3 } } }] },
    { id: "l_mina_veta", acto: 1, lugar: "mina_plata", tipo: "prueba", titulo: "La veta de plata",
      texto: "Una veta de plata asoma en la pared. Los picos de los mineros siguen clavados donde los dejaron hace un siglo.",
      opciones: [
        { txt: "Picar la veta", stat: "ani", cd: 12, ok: { t: "Plata pura. Las manos os sangran; la bolsa, no.", fx: { oro: 14, alma: -1 } }, ko: { t: "El techo cruje. Cae piedra, y algo blando.", fx: { combate: "cubo" } } },
        { txt: "Templar las armas con plata", stat: "raz", cd: 13, ok: { t: "En la fragua enana bañáis los filos. A los muertos no les va a gustar.", fx: { mejora: 1, xp: 3 } }, ko: { t: "La fragua escupe chispas. Plata perdida.", fx: { almaTodos: -1 } } },
        { txt: "Dejarla: es de los muertos", stat: null, ok: { t: "Un minero fantasma os saluda desde lo oscuro.", fx: { xp: 3, moral: 1 } } }] },

    { id: "l_fizwick_lenguas", acto: 1, lugar: "carromato_fizwick", tipo: "prueba", pnj: "gnomo", titulo: "Pegamento de mímico",
      texto: "Fizwick ha metido el carromato en un sótano. Nadie sabe cómo. «Necesito lenguas de mímico para mi pegamento. ¿Dos? Pago bien. Pago casi siempre.»",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«¡Frescas, a ser posible!»", fx: { encargo: "enc_lengua", xp: 1 } } },
        { txt: "Preguntar para qué quiere pegamento", stat: "raz", cd: 11, ok: { t: "«¡Para pegar cosas!» Os regala una muestra que duerme a quien la huele.", fx: { sueno: 1, encargo: "enc_lengua" } }, ko: { t: "Os lo explica. Una hora. No entendéis nada.", fx: { encargo: "enc_lengua" } } },
        { txt: "Venderle un cofre cualquiera", stat: "elo", cd: 14, ok: { t: "Lo compra como mímico. Lo descubrirá en tres días.", fx: { oro: 15, moral: -1 } }, ko: { t: "Lo abre. Es un cofre. «¿Me tomáis por humano?»", fx: {} } }] },
    { id: "l_fizwick_fiado", acto: 1, lugar: "carromato_fizwick", tipo: "prueba", pnj: "gnomo", titulo: "Se fía, pero se apunta",
      texto: "Fizwick os enseña su último invento: una poción que cura y además da la hora. «¿No tenéis oro? ¡Os la fío! Lo apunto en mi libreta.»",
      opciones: [
        { txt: "Comprarla fiada", stat: null, ok: { t: "Apunta vuestros nombres con letra diminuta. Y debajo algo más, todavía más diminuto.", fx: { superior: 1, marca: "fiado_fizwick" } } },
        { txt: "Pagar al contado", stat: null, ok: { t: "«¡Clientes serios! Qué raro.»", fx: { oro: -12, superior: 1 } } },
        { txt: "Probarla antes", stat: "tem", cd: 12, ok: { t: "Funciona. Cura, y son las tres y cuarto.", fx: { curaPct: 0.4, xp: 2 } }, ko: { t: "Os da la hora a gritos durante un rato largo.", fx: { alma: -1 } } }] },

    { id: "l_camara_cofres", acto: 1, lugar: "camara_tesorero", tipo: "prueba", titulo: "Tres cofres",
      texto: "Tres cofres en fila. Uno respira. Los otros dos fingen que no.",
      opciones: [
        { txt: "Abrir el de la izquierda", stat: "tem", cd: 12, ok: { t: "Oro de reyes. Es solo un cofre, gracias a todos los dioses.", fx: { oro: 18 } }, ko: { t: "Era el que respiraba.", fx: { combate: "mimico" } } },
        { txt: "Patearlos todos", stat: "ani", cd: 12, ok: { t: "Dos suenan a madera. El tercero gime y huye cojeando, dejando su bolsa.", fx: { oro: 10, botin: true } }, ko: { t: "Los tres gimen. Los tres.", fx: { alma: -2, combate: "mimico" } } },
        { txt: "Escuchar las cerraduras", clase: ["picaro"], ok: { t: "Un pícaro sabe cómo suena un cofre de verdad. Abrís el bueno, en silencio.", fx: { oro: 15, botin: true } } }] },
    { id: "l_camara_tesorero", acto: 1, lugar: "camara_tesorero", tipo: "prueba", pnj: "fantasma", titulo: "Falta una moneda",
      texto: "El tesorero del último rey cuenta monedas que ya no tiene. «Falta una. Siempre falta una. ¿La tenéis vosotros?»",
      opciones: [
        { txt: "Darle una moneda vuestra", stat: null, ok: { t: "Sonríe por fin. Os enseña dónde escondió el rey su vajilla.", fx: { oro: -1, botin: true, xp: 3, moral: 1 } } },
        { txt: "Decirle que la robó Malakar", stat: "elo", cd: 12, ok: { t: "«¡Lo sabía!» Os da la llave de la cámara pequeña.", fx: { oro: 14, xp: 3 } }, ko: { t: "«Malakar no roba monedas. Roba reyes.» Llama a la guardia.", fx: { combate: "esqueleto" } } },
        { txt: "Contar con él", stat: "raz", cd: 13, ok: { t: "Tres horas después la encontráis: en su bolsillo. Llora de alivio y os bendice.", fx: { bendicion: 1, xp: 5 } }, ko: { t: "Os equivocáis. Empieza otra vez. Y vosotros con él.", fx: { almaTodos: -1, xp: 1 } } }] },

    { id: "l_pozo_eco", acto: 1, lugar: "pozo_ecos", tipo: "prueba", titulo: "Un eco con ideas",
      texto: "Gritáis al pozo y el eco contesta otra cosa: «Bajad. Aquí hay sitio para todos».",
      opciones: [
        { txt: "Bajar por la cadena", stat: "ani", cd: 13, ok: { t: "Abajo hay un nicho seco y una bolsa olvidada. El eco se calla, decepcionado.", fx: { oro: 12, xp: 3 } }, ko: { t: "La cadena se acaba antes que el pozo.", fx: { alma: -4 } } },
        { txt: "Contestarle una grosería", stat: "elo", cd: 11, ok: { t: "El eco se ríe. Hacía siglos que nadie le hacía gracia. Os cuenta un secreto.", fx: { xp: 4, pm: 3 } }, ko: { t: "El eco os repite el insulto toda la hora. A vosotros.", fx: { almaTodos: -1 } } },
        { txt: "Tapar el pozo", stat: null, ok: { t: "Con una losa. Algo empuja desde abajo, flojo, y se rinde.", fx: { xp: 2 } } }] },
    { id: "l_pozo_paja", acto: 1, lugar: "pozo_ecos", tipo: "prueba", titulo: "Paja seca junto al pozo",
      texto: "Junto al pozo hay un rincón seco con paja y las brasas de alguien que se fue con prisa.",
      opciones: [
        { txt: "Dormir aquí", stat: "tem", cd: 12, ok: { t: "Dormís como piedras. El eco os canta una nana.", fx: { curaPct: 0.5 } }, ko: { t: "A medianoche, algo transparente sube del pozo.", fx: { curaPct: 0.2, combate: "cubo" } } },
        { txt: "Registrar lo que dejó", stat: null, ok: { t: "Un diario: «Los huesos cuentan los días». Y una poción.", fx: { pocion: 1, xp: 2 } } },
        { txt: "No fiarse y seguir", stat: null, ok: { t: "Prudentes y cansados. Como siempre.", fx: { xp: 1 } } }] },

    /* ===== Acto III ===== */
    { id: "l_patio_escudero", acto: 2, lugar: "patio_armas", tipo: "prueba", pnj: "fantasma", titulo: "El escudero sin amo",
      texto: "El fantasma de un escudero lustra una armadura vacía. «Se pasean sin señor. Es indecente. Tumbad dos y os doy la espada de mi amo.»",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«Dos. Y con respeto, que fueron buenas armaduras.»", fx: { encargo: "enc_armaduras", xp: 1 } } },
        { txt: "Pedirle un adelanto", stat: "elo", cd: 13, ok: { t: "Os afila las armas «a cuenta». Pesan como una promesa.", fx: { mejora: 1, encargo: "enc_armaduras" } }, ko: { t: "«Primero el trabajo.»", fx: { encargo: "enc_armaduras" } } },
        { txt: "Disfrazaros con la armadura vacía", stat: null, ok: { t: "Las armaduras del patio os toman por una de ellas. Hasta que estornudáis.", fx: { xp: 2, combate: "armadura" } } }] },
    { id: "l_patio_instruccion", acto: 2, lugar: "patio_armas", tipo: "prueba", titulo: "Instrucción sin nadie",
      texto: "Armaduras vacías hacen instrucción en el patio, golpe a golpe. Todas se equivocan en el mismo paso.",
      opciones: [
        { txt: "Imitar el entrenamiento", stat: "ani", cd: 12, ok: { t: "Aprendéis el paso. Y por qué se equivocan.", fx: { xp: 6 } }, ko: { t: "Os equivocáis en otro paso. Se giran todas.", fx: { combate: "armadura" } } },
        { txt: "Saquear el armero", stat: "tem", cd: 13, ok: { t: "Una piedra de afilar del armero real. Corta hasta las excusas.", fx: { mejora: 1 } }, ko: { t: "El armero tiene guardián.", fx: { combate: "armadura" } } },
        { txt: "Darles la voz de mando", clase: ["guerrero"], ok: { t: "Un guerrero sabe gritar como un sargento. Se cuadran y ya no se mueven.", fx: { xp: 6, botin: true } } }] },

    { id: "l_perrera_perrero", acto: 2, lugar: "perrera", tipo: "prueba", titulo: "El perrero tuerto",
      texto: "Los huargos de Varkhul duermen encadenados. El perrero, un viejo tuerto, os mira sin dar la voz. «A mí tampoco me gustan.»",
      opciones: [
        { txt: "Pedirle que los suelte lejos", stat: "elo", cd: 12, ok: { t: "Sonríe con tres dientes. Esta noche Varkhul cenará solo.", fx: { xp: 4, moral: 1 } }, ko: { t: "«Ni hablar. Me comerían a mí.»", fx: { xp: 1 } } },
        { txt: "Envenenar su comida", stat: "raz", cd: 13, ok: { t: "Duermen y no despiertan. Mal oficio, buen camino.", fx: { xp: 4, moral: -1 } }, ko: { t: "Huelen el veneno. Se despiertan muy ofendidos.", fx: { combate: "lobo" } } },
        { txt: "Llevarse un cachorro", stat: null, ok: { t: "Uno pequeño os lame la mano. El perrero mira hacia otro lado.", fx: { mascota: "lobezno" } } }] },
    { id: "l_perrera_silbato", acto: 2, lugar: "perrera", tipo: "prueba", titulo: "El silbato de hueso",
      texto: "De un clavo cuelga un silbato de hueso. Dicen que llama a los lobos del castillo. O que los manda lejos, según cómo se sople.",
      opciones: [
        { txt: "Soplar flojito", stat: "tem", cd: 13, ok: { t: "Los aullidos se alejan por las almenas. Camino libre.", fx: { xp: 4, bendicion: 1 } }, ko: { t: "Flojito, no. Los lobos llegan corriendo.", fx: { combate: "lobo" } } },
        { txt: "Romperlo", stat: null, ok: { t: "Se parte con un aullido. En todo el castillo, los lobos se quedan sordos.", fx: { xp: 3 } } },
        { txt: "Guardarlo para venderlo", stat: null, ok: { t: "Pesa poco. De noche suena solo, y os despierta.", fx: { oro: 10, alma: -1 } } }] },

    { id: "l_cocinas_pip", acto: 2, lugar: "cocinas", tipo: "prueba", titulo: "Pip, el pinche",
      texto: "Un pinche flaco llamado Pip os chista desde la despensa. «Conozco los pasadizos. Os llevo al trono a cambio de mi libertad.»",
      opciones: [
        { txt: "Aceptar su guía", stat: null, ok: { t: "«Esta noche, por la chimenea.» Se muerde las uñas al decirlo.", fx: { xp: 2, marca: "pip" } } },
        { txt: "Preguntarle quién le envía", stat: "tem", cd: 14, ok: { t: "Tartamudea. Lleva al cuello la llave del mayordomo. Pip trabaja para el castillo.", fx: { xp: 5, marca: "pip_espia" } }, ko: { t: "«Nadie, señor. Lo juro por mi madre.» Que también trabaja aquí.", fx: { marca: "pip" } } },
        { txt: "Darle oro para que huya", stat: null, ok: { t: "Sale corriendo. No sabéis hacia dónde.", fx: { oro: -5, xp: 1, moral: 1 } } }] },
    { id: "l_cocinas_cartas", acto: 2, lugar: "cocinas", tipo: "prueba", titulo: "Las cartas de la cocinera",
      texto: "La cocinera del castillo, viva y asustada, os da dos cartas. «Para los mercaderes. Que avisen a mi familia de que sigo viva. Por favor.»",
      opciones: [
        { txt: "Llevar las cartas", stat: null, ok: { t: "Las guarda en vuestro zurrón como si fueran pan caliente.", fx: { encargo: "enc_recado", moral: 1, xp: 1 } } },
        { txt: "Pedir comida a cambio", stat: "elo", cd: 12, ok: { t: "Os da un pastel de carne. Mejor no preguntar de qué.", fx: { comida: 1, encargo: "enc_recado" } }, ko: { t: "«¡Ni que fuera rica!» Lleváis las cartas igual.", fx: { encargo: "enc_recado" } } },
        { txt: "Probar las ollas", stat: "tem", cd: 12, ok: { t: "Sopa de ajo, hecha a escondidas. A Varkhul le da alergia.", fx: { curaPct: 0.3, pm: 2 } }, ko: { t: "Una olla tiene dientes y hambre.", fx: { combate: "mimico" } } }] },

    { id: "l_retratos_bigote", acto: 2, lugar: "galeria_retratos", tipo: "prueba", titulo: "Varkhul con bigote",
      texto: "Un retrato de Varkhul joven, con sol en la cara. Alguien, hace mucho, le pintó un bigote.",
      opciones: [
        { txt: "Añadirle orejas de burro", stat: null, ok: { t: "Os sentís mucho mejor. En algún lugar del castillo, un vampiro estornuda.", fx: { almaTodos: 2, xp: 2 } } },
        { txt: "Mirar detrás del cuadro", stat: "tem", cd: 12, ok: { t: "Una caja fuerte de bisagras oxidadas. Cede.", fx: { oro: 16 } }, ko: { t: "El marco abre la boca. No era un marco.", fx: { combate: "mimico" } } },
        { txt: "Estudiar la pintura", stat: "raz", cd: 13, ok: { t: "Bajo el bigote hay una firma: Aldara. La reina pintaba. Y lo odiaba.", fx: { xp: 5 } }, ko: { t: "Es un cuadro. De un señor. Con bigote.", fx: { xp: 1 } } }] },
    { id: "l_retratos_espejo", acto: 2, lugar: "galeria_retratos", tipo: "prueba", titulo: "Un espejo con frío",
      texto: "Entre los retratos cuelga un espejo sin reflejo. Detrás, alguien susurra que tiene frío.",
      opciones: [
        { txt: "Romper el espejo", stat: "ani", cd: 12, ok: { t: "Sale una doncella muerta de risa y de frío. Os da su broche.", fx: { botin: true, moral: 1 } }, ko: { t: "Siete años de mala suerte. Y una armadura que viene a cobrarlos.", fx: { combate: "armadura" } } },
        { txt: "Hablarle al espejo", stat: "elo", cd: 12, ok: { t: "Os cuenta por dónde pasea Varkhul de noche. Para no estar.", fx: { xp: 4, bendicion: 1 } }, ko: { t: "Os cuenta su vida. Entera. Tres siglos.", fx: { almaTodos: -1, xp: 2 } } },
        { txt: "Seguir de largo", stat: null, ok: { t: "Los espejos no hablan, decís. Este os llama groseros.", fx: {} } }] },

    { id: "l_capilla_solara", acto: 2, lugar: "capilla_profanada", tipo: "prueba", titulo: "Misa de huesos",
      texto: "La imagen de Solara tiene la cara rayada a zarpazos. Los bancos están llenos de huesos sentados, esperando misa.",
      opciones: [
        { txt: "Limpiar la imagen", stat: "tem", cd: 13, ok: { t: "Le limpiáis la cara con la manga. Un rayo de luz entra por la vidriera y os bendice el acero.", fx: { bendicionB: true, xp: 4, moral: 1 } }, ko: { t: "Las rayas son demasiado hondas. Solara llora resina.", fx: { xp: 2 } } },
        { txt: "Dar misa a los huesos", stat: "elo", cd: 13, ok: { t: "Se arrodillan. Al amén, se deshacen en polvo tranquilo.", fx: { xp: 6, almaTodos: 3 } }, ko: { t: "No les gusta el sermón. Se ponen en pie.", fx: { combate: "esqueleto" } } },
        { txt: "Llevarse el cáliz de oro", stat: null, ok: { t: "Ningún dios lo usa ya. Eso creéis.", fx: { oro: 18, moral: -1, marca: "sacrilegio" } } }] },
    { id: "l_capilla_campana", acto: 2, lugar: "capilla_profanada", tipo: "prueba", titulo: "La campana rajada",
      texto: "La campana rajada tañe a medianoche. Cada vez que suena, algo se levanta en la cripta de abajo.",
      opciones: [
        { txt: "Sujetar el badajo", stat: "ani", cd: 13, ok: { t: "Calla. Abajo, alguien suspira y vuelve a dormirse.", fx: { xp: 4 } }, ko: { t: "El badajo os golpea a vosotros. Y suena.", fx: { combate: "esqueleto" } } },
        { txt: "Tocar a difuntos al revés", stat: "raz", cd: 12, ok: { t: "Los muertos se acuestan solos, confundidos.", fx: { xp: 5, pm: 2 } }, ko: { t: "Tocáis a fiesta. Los muertos suben a bailar.", fx: { combate: "esqueleto" } } },
        { txt: "Dormir en el campanario", stat: null, ok: { t: "Pasada la medianoche, silencio. Y una siesta de las buenas.", fx: { curaPct: 0.4 } } }] },

    { id: "l_baile_dama", acto: 2, lugar: "salon_baile", tipo: "prueba", pnj: "fantasma", titulo: "Un vals eterno",
      texto: "Parejas de fantasmas bailan un vals que no acaba. Una dama sin pareja os tiende la mano enguantada.",
      opciones: [
        { txt: "Bailar con ella", stat: "elo", cd: 12, ok: { t: "Bailáis fatal, pero ella ríe por primera vez en un siglo. Os da su guante.", fx: { bendicion: 1, xp: 4 } }, ko: { t: "Le pisáis el pie. Todo el salón se gira.", fx: { almaTodos: -2 } } },
        { txt: "Robar joyas a la pareja de al lado", stat: null, ok: { t: "Los muertos no se fijan. Este sí.", fx: { oro: 16, moral: -1, combate: "esqueleto" } } },
        { txt: "Cambiar la música", clase: ["bardo"], ok: { t: "Tocáis una jota. Los fantasmas, escandalizados, vuelven a sus tumbas. Sala libre.", fx: { xp: 6, botin: true } } }] },
    { id: "l_baile_lampara", acto: 2, lugar: "salon_baile", tipo: "prueba", titulo: "Un cofre en la lámpara",
      texto: "Las lámparas del salón tienen trescientos años de polvo. De una cuelga un cofre.",
      opciones: [
        { txt: "Bajar la lámpara", stat: "ani", cd: 13, ok: { t: "Baja con estrépito y el cofre se abre solo.", fx: { oro: 14, botin: true } }, ko: { t: "Baja con estrépito. Sobre vosotros.", fx: { almaTodos: -3 } } },
        { txt: "Disparar a la cadena", stat: "tem", cd: 13, ok: { t: "Clinc. El cofre cae a vuestros pies.", fx: { oro: 14 } }, ko: { t: "Falláis. La cadena se balancea y despierta la guardia del salón.", fx: { combate: "armadura" } } },
        { txt: "Dejarlo colgado", stat: null, ok: { t: "Hay cosas que se ven mejor de lejos.", fx: { xp: 1 } } }] },

    { id: "l_reina_cuarto", acto: 2, lugar: "torre_reina", tipo: "prueba", pnj: "fantasma", titulo: "El cuarto de Aldara",
      texto: "En lo alto de la torre, el cuarto de la reina Aldara sigue como la noche de su boda. El velo descansa sobre la cama.",
      opciones: [
        { txt: "Llevar el velo", stat: "tem", cd: 12, ok: { t: "Pesa como un pañuelo y protege como un escudo.", fx: { bendicion: 2, xp: 2 } }, ko: { t: "El velo os quema las manos de frío.", fx: { alma: -2 } } },
        { txt: "Dormir en su cama", stat: null, ok: { t: "No soñáis nada. Es lo mejor que os pasa en semanas.", fx: { curarTodo: true } } },
        { txt: "Vaciar el joyero", stat: null, ok: { t: "Pendientes de rubí. La puerta se cierra sola a vuestra espalda, de un portazo helado.", fx: { oro: 18, almaTodos: -2, moral: -1 } } }] },
    { id: "l_reina_flores", acto: 2, lugar: "torre_reina", tipo: "prueba", titulo: "Flores para la reina",
      texto: "Una dama de compañía, esqueleto con delantal, sube flores secas cada noche. Se le caen todas por el camino.",
      opciones: [
        { txt: "Ayudarle a subirlas", stat: null, ok: { t: "Arriba os hace una reverencia que le cuesta un fémur.", fx: { xp: 4, almaTodos: 2, moral: 1 } } },
        { txt: "Preguntarle por la boda", stat: "elo", cd: 12, ok: { t: "«La mordió en el brindis. Llevaba la copa en la izquierda: es zurdo.» Lo apuntáis.", fx: { xp: 5, bendicion: 1 } }, ko: { t: "Se le cae la mandíbula. Literalmente.", fx: { xp: 1 } } },
        { txt: "Apartarla del camino", stat: "ani", cd: 10, ok: { t: "Se desmonta en el suelo y se recompone, ofendida.", fx: { xp: 1 } }, ko: { t: "Se recompone. Con amigas.", fx: { combate: "esqueleto" } } }] },

    { id: "l_tesoreria_puerta", acto: 2, lugar: "tesoreria", tipo: "prueba", titulo: "Siete cerraduras",
      texto: "Siete cerraduras. Siete llaves colgadas de siete esqueletos. Seis encajan. Una muerde.",
      opciones: [
        { txt: "Probar las llaves con paciencia", stat: "raz", cd: 13, ok: { t: "Seis clics. La séptima la dejáis colgando. Entráis igual.", fx: { oro: 20, xp: 3 } }, ko: { t: "La séptima os muerde el dedo. La puerta grita.", fx: { combate: "mimico" } } },
        { txt: "Echar la puerta abajo", stat: "ani", cd: 15, ok: { t: "Siete cerraduras y ni una bisagra decente. Cae.", fx: { oro: 20, xp: 2 } }, ko: { t: "La puerta aguanta. Las armaduras del pasillo vienen a ver.", fx: { combate: "armadura" } } },
        { txt: "Entrar por el respiradero", clase: ["picaro"], ok: { t: "Para qué siete cerraduras si hay un agujero.", fx: { oro: 24, botin: true } } }] },
    { id: "l_tesoreria_balanza", acto: 2, lugar: "tesoreria", tipo: "prueba", titulo: "La balanza de almas",
      texto: "Una balanza de oro pesa almas en un platillo y monedas en el otro. Ahora mismo gana el oro.",
      opciones: [
        { txt: "Poner vuestro oro", stat: null, ok: { t: "La balanza se equilibra. Os devuelve algo que habíais perdido por el camino.", fx: { oro: -10, maxTodos: 1, xp: 2 } } },
        { txt: "Robar las monedas del platillo", stat: "tem", cd: 13, ok: { t: "Sin oro, la balanza suelta las almas. Pasan dándoos las gracias.", fx: { oro: 15, xp: 3, moral: 1 } }, ko: { t: "La balanza se inclina hacia vosotros. Pesáis poco.", fx: { oro: 8, almaTodos: -3 } } },
        { txt: "Romperla", stat: "ani", cd: 12, ok: { t: "Monedas y almas por el suelo. Escapan las dos.", fx: { xp: 3 } }, ko: { t: "Está hechizada. Os pesa a vosotros.", fx: { maxTodos: -1 } } }] },

    /* ===== Acto IV ===== */
    { id: "l_ladera_kobold", acto: 3, lugar: "ladera_ceniza", tipo: "prueba", titulo: "Peregrinos con cola",
      texto: "Unos kobolds suben hacia la cumbre con ofrendas para Ignárax. Uno se ha caído en la ceniza y nadie lo espera.",
      opciones: [
        { txt: "Ayudarle a levantarse", stat: null, ok: { t: "Os da una piedra brillante y el nombre de un atajo.", fx: { oro: 6, xp: 4, moral: 1 } } },
        { txt: "Quitarle la ofrenda", stat: null, ok: { t: "Una escama de oro. El kobold silba. Vuelven todos.", fx: { oro: 10, moral: -1, combate: "kobold" } } },
        { txt: "Haceros pasar por sacerdotes", stat: "elo", cd: 13, ok: { t: "Os entregan las ofrendas con reverencias. Ignárax no las echará de menos.", fx: { oro: 18, xp: 3 } }, ko: { t: "«Los sacerdotes del dragón tienen más cola.»", fx: { combate: "kobold" } } }] },
    { id: "l_ladera_cueva", acto: 3, lugar: "ladera_ceniza", tipo: "prueba", titulo: "Una cueva tibia",
      texto: "Una cueva en la ladera guarda el calor del volcán. Dentro, huesos de cabra y una manta seca.",
      opciones: [
        { txt: "Descansar", stat: null, ok: { t: "El volcán os arropa como una abuela de mal genio.", fx: { curaPct: 0.5 } } },
        { txt: "Explorar el fondo", stat: "tem", cd: 13, ok: { t: "Una fumarola sopla sobre un cofre enano olvidado.", fx: { botin: true, xp: 2 } }, ko: { t: "El fondo está vivo y en llamas.", fx: { combate: "elemental" } } },
        { txt: "Sacudir la manta", stat: null, ok: { t: "Cae una moneda. Y una pulga de fuego que os muerde.", fx: { oro: 4, alma: -1 } } }] },

    { id: "l_boca_mineros", acto: 3, lugar: "boca_mina", tipo: "prueba", pnj: "herrero", titulo: "Mineros con picos",
      texto: "Tres mineros enanos defienden la boca de Barak-Thur. «Los kobolds nos roban hasta los dientes. Tres bandas menos, y la mina os da de comer.»",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«Tres. Contadlas bien, que los kobolds se parecen todos.»", fx: { encargo: "enc_kobolds", xp: 1 } } },
        { txt: "Aceptar su aguardiente", stat: "ani", cd: 13, ok: { t: "Aguantáis el trago. Os respetan para siempre.", fx: { xp: 4, pm: 2, encargo: "enc_kobolds" } }, ko: { t: "Despertáis dentro de una vagoneta.", fx: { almaTodos: -2, encargo: "enc_kobolds" } } },
        { txt: "Preguntar por Thrain", stat: "elo", cd: 12, ok: { t: "«¿Thrain? Mi primo. Tonto, pero honrado.» Os dan su parte de la paga.", fx: { oro: 8, xp: 2 } }, ko: { t: "«No hay ningún Thrain aquí.» Los enanos mienten fatal.", fx: { xp: 1 } } }] },
    { id: "l_boca_gong", acto: 3, lugar: "boca_mina", tipo: "prueba", titulo: "El gong del guardián",
      texto: "Un gong enano cuelga en la entrada. Debajo, un letrero: «No tocar. Despierta al guardián».",
      opciones: [
        { txt: "Tocarlo", stat: null, ok: { t: "El guardián despierta. No está de humor.", fx: { xp: 3, combate: "golem" } } },
        { txt: "Descolgarlo y venderlo", stat: "ani", cd: 13, ok: { t: "Bronce enano del bueno. Pesa como un remordimiento.", fx: { oro: 16 } }, ko: { t: "Se os escurre. GONG.", fx: { combate: "golem" } } },
        { txt: "Leer la letra pequeña", stat: "raz", cd: 11, ok: { t: "«Salvo para pasar: decid ‘Thur’ tres veces.» Lo decís. Las runas os saludan.", fx: { xp: 4, bendicion: 1 } }, ko: { t: "Lo leéis en voz alta. Mal. El suelo da un calambrazo.", fx: { alma: -2 } } }] },

    { id: "l_forja_martillo", acto: 3, lugar: "gran_forja", tipo: "prueba", titulo: "Un martillo caliente",
      texto: "Junto al yunque mayor hay un martillo rúnico, todavía caliente. Grabado en el mango: «Para Dorna, que me espere».",
      opciones: [
        { txt: "Llevarse el martillo", stat: null, ok: { t: "Pesa como diez. Golpea como cien.", fx: { mejora: 2, marca: "martillo_dorna" } } },
        { txt: "Afilar aquí y dejarlo", stat: "ani", cd: 12, ok: { t: "Las armas cantan bajo el martillo. Lo devolvéis a su yunque.", fx: { mejora: 1, xp: 3, moral: 1 } }, ko: { t: "El martillo rebota y os muerde la mano.", fx: { alma: -2 } } },
        { txt: "No tocarlo", stat: null, ok: { t: "Hay cosas que pesan más de lo que parece.", fx: { xp: 2 } } }] },
    { id: "l_forja_herrero", acto: 3, lugar: "gran_forja", tipo: "prueba", pnj: "herrero", titulo: "Ladrones de fuego",
      texto: "Un herrero enano tuerto aviva la forja con brasas que se le escapan a saltos. «Elementales. Me roban el fuego. Apagad dos y os templo lo que queráis.»",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«Dos. Y no los traigáis aquí, que se comen el carbón.»", fx: { encargo: "enc_brasas", xp: 1 } } },
        { txt: "Pagarle un temple ya", stat: null, ok: { t: "Mete vuestras armas al fuego sin pedir permiso. Salen mejores. Y más caras.", fx: { oro: -10, mejora: 1 } } },
        { txt: "Atrapar una brasa con las manos", stat: "ani", cd: 14, ok: { t: "Quema, pero la metéis en el yunque. El herrero os mira con respeto.", fx: { xp: 5, encargo: "enc_brasas" } }, ko: { t: "La brasa crece. Y crece. Y tiene cara.", fx: { combate: "elemental" } } }] },

    { id: "l_templo_idolo", acto: 3, lugar: "templo_kobold", tipo: "prueba", titulo: "El ídolo tuerto",
      texto: "Los kobolds adoran un Ignárax de barro y tapones. Le falta un ojo. El otro es un rubí.",
      opciones: [
        { txt: "Ponerle una moneda de ojo", stat: null, ok: { t: "Los kobolds aplauden. Os nombran sacerdotes honorarios.", fx: { oro: -2, xp: 4, bendicion: 1 } } },
        { txt: "Llevarse el rubí", stat: "tem", cd: 13, ok: { t: "Nadie mira. Bueno, el ídolo, con el ojo que le queda.", fx: { oro: 20, moral: -1 } }, ko: { t: "Toda la congregación se gira a la vez.", fx: { combate: "kobold" } } },
        { txt: "Derribar el ídolo", stat: "ani", cd: 11, ok: { t: "Se desmorona. Los kobolds huyen llorando y dejan sus ofrendas.", fx: { botin: true, xp: 3, moral: -1 } }, ko: { t: "Se os cae encima. Luego, los kobolds.", fx: { alma: -2, combate: "kobold" } } }] },
    { id: "l_templo_diezmo", acto: 3, lugar: "templo_kobold", tipo: "prueba", titulo: "El contable del dragón",
      texto: "Un kobold con gafas apunta en un libro todo lo que roban para el dragón. «¿Venís a pagar el diezmo?»",
      opciones: [
        { txt: "Pagar el diezmo", stat: null, ok: { t: "Os da un recibo con sello de garra y una poción de la reserva del templo.", fx: { oro: -8, pocion: 1, xp: 2 } } },
        { txt: "Robarle el libro", stat: "tem", cd: 12, ok: { t: "Sin libro, nadie sabe qué es de quién. Los kobolds se pelean entre ellos.", fx: { oro: 10, xp: 4 } }, ko: { t: "Chilla como una tetera.", fx: { combate: "kobold" } } },
        { txt: "Revisarle las cuentas", stat: "raz", cd: 13, ok: { t: "¡Faltan monedas! El contable os soborna para que calléis.", fx: { oro: 16, xp: 3 } }, ko: { t: "Las cuentas cuadran. Os cobra la consulta.", fx: { oro: -5 } } }] },

    { id: "l_rio_farol", acto: 3, lugar: "rio_lava", tipo: "prueba", titulo: "Una llama enjaulada",
      texto: "Un farol de bronce flota sobre la lava. Dentro, una llamita con cara os suplica: «Sacadme. Me encerraron los Hijos de la Ceniza».",
      opciones: [
        { txt: "Abrir el farol", stat: "raz", cd: 12, ok: { t: "La llamita sale, se mete en vuestra linterna y se acomoda. «Os debo un favor de fuego.»", fx: { xp: 3, marca: "farol_fuego" } }, ko: { t: "Sale entera. Muy entera. Y con rencor.", fx: { combate: "elemental" } } },
        { txt: "Sacar el farol de la lava", stat: "ani", cd: 13, ok: { t: "Os chamuscáis las cejas, pero lo sacáis. La llama os sigue, agradecida.", fx: { alma: -2, xp: 2, marca: "farol_fuego" } }, ko: { t: "La lava os lame las botas.", fx: { almaTodos: -3 } } },
        { txt: "Venderlo al Mercader de los Planos", stat: null, ok: { t: "Paga bien por fuego enjaulado. La llamita llora chispas.", fx: { oro: 20, moral: -1 } } }] },
    { id: "l_rio_pasaderas", acto: 3, lugar: "rio_lava", tipo: "prueba", titulo: "Pasaderas con ojos",
      texto: "Las rocas flotan en fila sobre la lava. Algunas tienen ojos.",
      opciones: [
        { txt: "Pisar solo las que no miran", stat: "tem", cd: 13, ok: { t: "Pasáis. Las rocas con ojos os miran con envidia.", fx: { xp: 5 } }, ko: { t: "Una roca parpadea y se pone de pie.", fx: { combate: "elemental" } } },
        { txt: "Esperar a que bajen", stat: null, ok: { t: "Bajan. El calor os cuece mientras tanto.", fx: { almaTodos: -2, xp: 2 } } },
        { txt: "Helar el paso con magia", clase: ["mago", "brujo"], ok: { t: "Un puente de escarcha humeante. Cruzáis mientras dura, y dura justo.", fx: { xp: 6 } } }] },

    { id: "l_ancestros_barba", acto: 3, lugar: "salas_ancestros", tipo: "prueba", titulo: "La barba rota",
      texto: "Siete estatuas de reyes enanos vigilan una grieta sellada. Una tiene la barba rota, y cara de enfado.",
      opciones: [
        { txt: "Arreglarle la barba", stat: "ani", cd: 12, ok: { t: "Las siete estatuas asienten. Una runa se enciende en vuestras armas.", fx: { bendicionB: true, xp: 4 } }, ko: { t: "Le queda torcida. Peor que antes.", fx: { xp: 1 } } },
        { txt: "Rezar a los ancestros", stat: "tem", cd: 13, ok: { t: "La piedra canta. Os sentís más duros, como roca vieja.", fx: { maxTodos: 1, xp: 3 } }, ko: { t: "Los ancestros no rezan con forasteros.", fx: { xp: 1 } } },
        { txt: "Arrancar las gemas de los ojos", stat: null, ok: { t: "Gemas como puños. Las estatuas ya no ven, y algo despierta para mirar por ellas.", fx: { oro: 22, moral: -1, combate: "golem" } } }] },
    { id: "l_ancestros_nota", acto: 3, lugar: "salas_ancestros", tipo: "prueba", titulo: "«Vuelvo enseguida»",
      texto: "Una tumba enana vacía. Dentro solo hay una nota: «He ido a la forja. Vuelvo enseguida». Fechada hace un siglo.",
      opciones: [
        { txt: "Dejar una flor de ceniza", stat: null, ok: { t: "La losa se cierra sola, despacio.", fx: { xp: 3, almaTodos: 2, moral: 1 } } },
        { txt: "Llevarse el ajuar", stat: null, ok: { t: "Cerveza, un pico y oro. El enano no vuelve. Por ahora.", fx: { oro: 15, moral: -1 } } },
        { txt: "Leer la nota con calma", stat: "raz", cd: 12, ok: { t: "Al dorso hay un plano de la forja con una cruz. Bajo la cruz, un cofre.", fx: { botin: true, xp: 3 } }, ko: { t: "Solo es una nota. Triste, pero nota.", fx: { xp: 1 } } }] },

    { id: "l_hollin_sermon", acto: 3, lugar: "campamento_hollin", tipo: "prueba", titulo: "El sermón de Madre Hollín",
      texto: "Madre Hollín predica desde una roca con la voz ronca de azufre. «¡El dragón es la puerta! ¡Y la puerta se abrirá!»",
      opciones: [
        { txt: "Escuchar entre la gente", stat: "tem", cd: 13, ok: { t: "Aprendéis cuándo cambian la guardia y qué tienda guarda las ofrendas.", fx: { oro: 15, xp: 4 } }, ko: { t: "Os piden que cantéis. No os sabéis la letra.", fx: { combate: "kobold" } } },
        { txt: "Interrumpirla a gritos", stat: "elo", cd: 14, ok: { t: "La dejáis en ridículo. Hasta los kobolds se ríen. Pierde medio rebaño.", fx: { xp: 6, moral: 1 } }, ko: { t: "«¡Herejes!» Los Hijos invocan el fuego.", fx: { combate: "elemental" } } },
        { txt: "Echar azufre en su agua", stat: null, ok: { t: "Tose toda la noche. Se la oye desde la cumbre.", fx: { xp: 3, moral: -1 } } }] },
    { id: "l_hollin_ofrendas", acto: 3, lugar: "campamento_hollin", tipo: "prueba", titulo: "Las ofrendas del Ojo",
      texto: "Junto a la hoguera de huesos hay cofres de ofrendas para el Ojo. Un sectario dormita encima.",
      opciones: [
        { txt: "Robar las ofrendas", stat: "tem", cd: 13, ok: { t: "Oro, joyas y un frasco que brilla negro.", fx: { oro: 15, pocion: 1 } }, ko: { t: "El sectario despierta y llama a sus kobolds.", fx: { combate: "kobold" } } },
        { txt: "Quemar las ofrendas", stat: null, ok: { t: "Arden con un chillido. El ojo pintado en las rocas se emborrona.", fx: { xp: 4, bendicion: 1 } } },
        { txt: "Despertarlo y sobornarlo", stat: "elo", cd: 12, ok: { t: "Por diez monedas os cuenta que Madre Hollín no adora al dragón: lo quiere muerto.", fx: { oro: -10, xp: 6 } }, ko: { t: "Coge las monedas y grita igual.", fx: { oro: -10, combate: "kobold" } } }] },

    { id: "l_muladar_monedas", acto: 3, lugar: "muladar_dragon", tipo: "prueba", titulo: "La basura del dragón",
      texto: "Aquí tira Ignárax lo que no le gusta: huesos, armaduras abolladas y monedas falsas. Algunas no lo son.",
      opciones: [
        { txt: "Rebuscar en silencio", stat: "tem", cd: 13, ok: { t: "Monedas buenas entre las malas y una armadura casi entera.", fx: { oro: 16, botin: true } }, ko: { t: "Una armadura se mueve. Era un gólem en reparación.", fx: { combate: "golem" } } },
        { txt: "Coger a puñados", stat: null, ok: { t: "Oro, sí. También falso. Y pulgas de dragón.", fx: { oro: 10, almaTodos: -1 } } },
        { txt: "Morder las monedas", clase: ["picaro"], ok: { t: "Un pícaro conoce el oro por los dientes. Solo cogéis lo bueno.", fx: { oro: 25 } } }] },
    { id: "l_muladar_centinela", acto: 3, lugar: "muladar_dragon", tipo: "prueba", titulo: "Un centinela muy pequeño",
      texto: "Un kobold tuerto vigila el muladar con una lanza más alta que él. Tiembla. «¡Alto! ¡O… o no! ¿Qué preferís?»",
      opciones: [
        { txt: "Convencerle de que se vaya a casa", stat: "elo", cd: 12, ok: { t: "Os cuenta que el dragón duerme del lado izquierdo. Luego se va a casa.", fx: { xp: 5, bendicion: 1 } }, ko: { t: "Pide ayuda a gritos. Llega ayuda.", fx: { combate: "kobold" } } },
        { txt: "Comprarle la lanza", stat: null, ok: { t: "Acero enano robado. Buena punta.", fx: { oro: -5, mejora: 1 } } },
        { txt: "Darle un susto", stat: "ani", cd: 10, ok: { t: "Huye dejando la lanza y una bolsa.", fx: { oro: 8, xp: 1 } }, ko: { t: "No se asusta: se enfada. Y silba.", fx: { combate: "kobold" } } }] },

    /* ===== Acto V ===== */
    { id: "l_orilla_pescador", acto: 4, lugar: "orilla_estrellas", tipo: "prueba", pnj: "forastero", titulo: "El pescador de estrellas",
      texto: "Un viejo pesca estrellas apagadas con una caña de hueso. «Algunas aún tienen un poco de luz. Esas se las vendo a los que bajan.»",
      opciones: [
        { txt: "Comprar una con luz", stat: null, ok: { t: "Os calienta las manos y algo más adentro.", fx: { oro: -12, curaPct: 0.4, bendicion: 1 } } },
        { txt: "Preguntarle quién es", stat: "tem", cd: 13, ok: { t: "«Era el dios de los pescadores. Me comieron la estrella. Ahora pesco.» Os enseña un truco antiguo.", fx: { talento: 1, xp: 5 } }, ko: { t: "«Nadie.» Y es verdad: se desvanece.", fx: { xp: 2 } } },
        { txt: "Quitarle la caña", stat: null, ok: { t: "Tira desde el otro lado de la nada. Y desde allí tiran más fuerte.", fx: { moral: -1, combate: "sombra" } } }] },
    { id: "l_orilla_hoguera", acto: 4, lugar: "orilla_estrellas", tipo: "prueba", titulo: "Una estrella de hoguera",
      texto: "Una estrella aún tibia hace de hoguera en mitad del vacío. Las sombras no se acercan a su luz.",
      opciones: [
        { txt: "Dormir junto a ella", stat: null, ok: { t: "Dormís sin sueños y despertáis enteros.", fx: { curaPct: 0.5 } } },
        { txt: "Avivarla con magia", stat: "raz", cd: 13, ok: { t: "Brilla otra vez, un poco. Os devuelve el favor.", fx: { pm: 5, almaTodos: 3, xp: 3 } }, ko: { t: "La apagáis del todo. Oscuridad y frío.", fx: { almaTodos: -2, xp: 1 } } },
        { txt: "Montar guardia", stat: "tem", cd: 12, ok: { t: "Una sombra se acerca y la espantáis con un tizón de estrella.", fx: { xp: 5 } }, ko: { t: "Os dormís. Ella no.", fx: { combate: "sombra" } } }] },

    { id: "l_seda_trompeta", acto: 4, lugar: "bosque_seda", tipo: "prueba", titulo: "Un capullo que protesta",
      texto: "Un capullo de seda pide ayuda con voz de trompeta. Dentro hay un diablillo atrapado, de muy mal humor.",
      opciones: [
        { txt: "Liberarlo", stat: "ani", cd: 12, ok: { t: "Se sacude, os insulta y os da una moneda. Es lo más amable que sabe hacer.", fx: { oro: 10, xp: 3, moral: 1 } }, ko: { t: "La seda vibra. Baja la dueña.", fx: { combate: "arana" } } },
        { txt: "Dejarlo para la araña", stat: null, ok: { t: "Su trompeteo os sigue un rato. Luego se calla.", fx: { xp: 1, moral: -1 } } },
        { txt: "Usarlo de cebo", stat: "raz", cd: 13, ok: { t: "La araña baja a por él y vosotros vais a por su despensa.", fx: { botin: true, xp: 4 } }, ko: { t: "La araña baja a por él. Y a por vosotros.", fx: { combate: "arana" } } }] },
    { id: "l_seda_arpa", acto: 4, lugar: "bosque_seda", tipo: "prueba", titulo: "El arpa de seda",
      texto: "Toda la seda vibra a la vez, como un arpa enorme. Si la tocáis, sabrán dónde estáis.",
      opciones: [
        { txt: "Cruzar sin rozar un hilo", stat: "tem", cd: 14, ok: { t: "Pasáis como fantasmas. Las arañas siguen esperando.", fx: { xp: 7 } }, ko: { t: "Un hilo. Solo uno. Basta.", fx: { combate: "arana" } } },
        { txt: "Quemar los hilos", stat: "raz", cd: 12, ok: { t: "La seda arde como paja. Entre las cenizas, capullos con oro.", fx: { oro: 16, xp: 3 } }, ko: { t: "El fuego trepa por la seda hasta vosotros.", fx: { almaTodos: -3 } } },
        { txt: "Seguir las sendas de las arañas", clase: ["explorador"], ok: { t: "Hasta las arañas usan caminos. Las esquiváis por el suyo.", fx: { xp: 6, curaPct: 0.2 } } }] },

    { id: "l_garito_prestamo", acto: 4, lugar: "garito_diablillos", tipo: "prueba", titulo: "Un préstamo sin interés",
      texto: "Un diablillo prestamista os ofrece oro sin interés. «Bueno, con un interés pequeñito. Casi nada. Firmad aquí.»",
      opciones: [
        { txt: "Firmar", stat: null, ok: { t: "Veinticinco monedas por cabeza. La firma brilla un momento y se borra.", fx: { oro: 25, marca: "pagare" } } },
        { txt: "Leer la letra pequeña", stat: "raz", cd: 13, ok: { t: "«…y el alma del firmante». Tacháis esa línea. Os da menos oro y mucho odio.", fx: { oro: 12, xp: 4 } }, ko: { t: "Es tan pequeña que no se lee. Firmáis igual.", fx: { oro: 25, marca: "pagare" } } },
        { txt: "Rechazarlo", stat: null, ok: { t: "«Volveréis. Todos vuelven.»", fx: { xp: 1 } } }] },
    { id: "l_garito_sastre", acto: 4, lugar: "garito_diablillos", tipo: "prueba", titulo: "El sastre infernal",
      texto: "Un diablillo sastre os toma medidas con la cola. «Necesito seda de araña de las sombras para la capa de mi amo. Pago en oro de verdad.»",
      opciones: [
        { txt: "Aceptar", stat: null, ok: { t: "«Dos arañas. La seda, sin agujeros de flecha, por favor.»", fx: { encargo: "enc_telas", xp: 1 } } },
        { txt: "Pedirle un forro para vosotros", stat: "elo", cd: 13, ok: { t: "Os cose un forro de seda infernal. Abriga y da mala suerte a los demás.", fx: { bendicion: 1, encargo: "enc_telas" } }, ko: { t: "Os mide mal a propósito. Os pica todo.", fx: { alma: -1, encargo: "enc_telas" } } },
        { txt: "Jugarle a los dados", stat: "tem", cd: 13, ok: { t: "Le ganáis el alfiletero de oro.", fx: { oro: 18 } }, ko: { t: "Os gana hasta los cordones.", fx: { oro: -8 } } }] },

    { id: "l_ciudad_vecinos", acto: 4, lugar: "ciudad_hundida", tipo: "prueba", titulo: "Pan sin pan",
      texto: "Las sombras de la ciudad repiten su vida de antes: compran, venden, discuten. Una os vende pan sin pan.",
      opciones: [
        { txt: "Pagarle una moneda", stat: null, ok: { t: "Os da las gracias con la voz de antes. Os sentís menos en el Abismo.", fx: { oro: -1, almaTodos: 3, xp: 3, moral: 1 } } },
        { txt: "Recordarle su nombre", stat: "tem", cd: 14, ok: { t: "Está grabado en la puerta: Mirta. Lo decís y se deshace en luz, libre.", fx: { xp: 8, bendicion: 1 } }, ko: { t: "Lo decís mal. La sombra solo recuerda el hambre.", fx: { combate: "sombra" } } },
        { txt: "Saquear las casas", stat: null, ok: { t: "Oro de una ciudad que ya no existe. Las sombras dejan de vender y os miran.", fx: { oro: 20, moral: -1, combate: "sombra" } } }] },
    { id: "l_ciudad_campanario", acto: 4, lugar: "ciudad_hundida", tipo: "prueba", titulo: "El campanario al revés",
      texto: "Bajo vuestros pies suena una campana. El campanario está hundido del revés, apuntando al vacío.",
      opciones: [
        { txt: "Bajar por el campanario", stat: "ani", cd: 13, ok: { t: "En la campana hay ofrendas de una ciudad entera.", fx: { oro: 18, botin: true } }, ko: { t: "Abajo esperan diablillos colgados como murciélagos.", fx: { combate: "diablillo" } } },
        { txt: "Tocar la campana", stat: null, ok: { t: "Suena hacia abajo. Algo enorme, muy abajo, se da la vuelta.", fx: { xp: 4, almaTodos: -2 } } },
        { txt: "Dibujar la ciudad", stat: "raz", cd: 11, ok: { t: "Nadie la ha dibujado nunca. El mapa os pesa de orgullo.", fx: { xp: 5 } }, ko: { t: "Os sale torcida. Como ella.", fx: { xp: 2 } } }] },

    { id: "l_nido_huevos", acto: 4, lugar: "nido_arana", tipo: "prueba", titulo: "Mil huevos negros",
      texto: "Cientos de huevos negros laten pegados a la roca. Si eclosionan, el Abismo tendrá arañas para mil años.",
      opciones: [
        { txt: "Quemarlos", stat: "raz", cd: 13, ok: { t: "Arden con un chillido de mil voces. La madre lo ha oído.", fx: { xp: 7, moral: 1, combate: "arana" } }, ko: { t: "No prenden. La madre, en cambio, llega encendida.", fx: { combate: "arana" } } },
        { txt: "Robar un huevo", stat: "tem", cd: 13, ok: { t: "El Mercader de los Planos pagará una fortuna. Mejor no saber para qué.", fx: { oro: 22, moral: -1 } }, ko: { t: "El huevo eclosiona en vuestra mano.", fx: { alma: -2, combate: "arana" } } },
        { txt: "Salir de puntillas", stat: null, ok: { t: "Hay batallas que no son vuestras.", fx: { xp: 2 } } }] },
    { id: "l_nido_caballero", acto: 4, lugar: "nido_arana", tipo: "prueba", titulo: "Un caballero envuelto",
      texto: "Entre las presas del nido hay un caballero de Solara, envuelto en seda hasta el cuello. Respira. Aún aprieta la espada.",
      opciones: [
        { txt: "Cortar la seda", stat: "ani", cd: 13, ok: { t: "Os da su espada antes de desmayarse. «Para el Ojo.» Su bendición se os pega al acero.", fx: { botin: true, bendicionB: true, moral: 1 } }, ko: { t: "La seda os atrapa a vosotros también. Algo baja a comprobarlo.", fx: { combate: "arana" } } },
        { txt: "Rezar con él", clase: ["clerigo"], ok: { t: "Solara os oye a los dos. La seda se pudre sola.", fx: { curaPct: 0.4, bendicion: 1, xp: 4 } } },
        { txt: "Quitarle la espada", stat: null, ok: { t: "Para morir no la necesita.", fx: { mejora: 1, moral: -1 } } }] },

    { id: "l_ojo_ofrenda", acto: 4, lugar: "altar_ojo", tipo: "prueba", titulo: "El cuenco del Ojo",
      texto: "Un altar en forma de ojo cerrado pide una ofrenda. En el cuenco hay dientes, monedas y un papel con un nombre.",
      opciones: [
        { txt: "Ofrecer sangre", stat: null, ok: { t: "El ojo os da algo de lo que guarda. Y se queda algo vuestro.", fx: { maxTodos: -1, botin: true, xp: 4 } } },
        { txt: "Leer el papel", stat: "tem", cd: 13, ok: { t: "Es vuestro nombre, con la letra de Madre Hollín. Lo quemáis en una vela negra.", fx: { xp: 6, bendicion: 1 } }, ko: { t: "Al leerlo en voz alta, el ojo se entreabre.", fx: { almaTodos: -3 } } },
        { txt: "Volcar el altar", stat: "ani", cd: 13, ok: { t: "Cae y se parte. Muy lejos, un susurro grita.", fx: { xp: 5 } }, ko: { t: "Pesa como un mundo. Los diablillos que lo guardan se parten de risa.", fx: { combate: "diablillo" } } }] },
    { id: "l_ojo_voz", acto: 4, lugar: "altar_ojo", tipo: "prueba", titulo: "Una voz conocida",
      texto: "Una voz os habla desde el altar con el tono de vuestra madre: «Quedaos. Aquí no duele nada».",
      opciones: [
        { txt: "Taparos los oídos", stat: "tem", cd: 13, ok: { t: "Seguís. Nadie dice nada del temblor de manos.", fx: { xp: 5 } }, ko: { t: "La voz entra por donde puede. Os duele todo.", fx: { almaTodos: -3 } } },
        { txt: "Contestarle", stat: "elo", cd: 14, ok: { t: "Le decís lo que pensáis de él. Nhazgul, por primera vez, se calla.", fx: { xp: 8, bendicion: 1 } }, ko: { t: "Os contesta. Peor.", fx: { maxTodos: -1 } } },
        { txt: "Quedaros un rato", stat: null, ok: { t: "No duele nada. Tampoco sentís nada. Cuesta irse.", fx: { curaPct: 0.5, moral: -1 } } }] },

    { id: "l_templo_vela", acto: 4, lugar: "templo_olvidado", tipo: "prueba", titulo: "La vela del dios sin nombre",
      texto: "En el templo de un dios sin nombre arde una vela. Lleva así desde que se comieron su estrella.",
      opciones: [
        { txt: "Rezarle", stat: "tem", cd: 12, ok: { t: "No sabéis su nombre. Él tampoco. Os bendice igual.", fx: { bendicion: 2, xp: 3 } }, ko: { t: "Silencio. Pero la vela parpadea más fuerte.", fx: { xp: 2 } } },
        { txt: "Llevarse la vela", stat: null, ok: { t: "Su luz espanta a las sombras. El templo se queda a oscuras para siempre.", fx: { bendicionB: true, moral: -1 } } },
        { txt: "Inventarle un nombre", stat: "elo", cd: 12, ok: { t: "Le llamáis Bartolo. Le encanta. Os cura a todos.", fx: { curaPct: 0.5, xp: 4 } }, ko: { t: "No le gusta el nombre. Se apaga un poco.", fx: { xp: 1 } } }] },
    { id: "l_templo_sacerdote", acto: 4, lugar: "templo_olvidado", tipo: "prueba", pnj: "fantasma", titulo: "El último sacerdote",
      texto: "El último sacerdote del templo os pide que recéis por él. «Si alguien me recuerda, quizá no me coma.»",
      opciones: [
        { txt: "Rezar por él", stat: null, ok: { t: "Su silueta se vuelve luz. Os deja su frasco de óleo santo.", fx: { pocion: 1, xp: 5, moral: 1 } } },
        { txt: "Pedirle su bendición a cambio", stat: "elo", cd: 12, ok: { t: "Os bendice con lo poco que le queda.", fx: { bendicion: 1, almaTodos: 3 } }, ko: { t: "No le queda nada que dar. Os mira, avergonzado.", fx: { xp: 1 } } },
        { txt: "No hacerle caso", stat: null, ok: { t: "Se oscurece. A vuestra espalda hay una sombra más.", fx: { combate: "sombra" } } }] },

    { id: "l_escalera_peaje", acto: 4, lugar: "escalera_rota", tipo: "prueba", titulo: "Peaje en el escalón",
      texto: "Un diablillo cobra peaje en un escalón. «Una moneda por cabeza. O una cabeza. Vosotros decidís.»",
      opciones: [
        { txt: "Pagar", stat: null, ok: { t: "Os deja pasar con una reverencia. Y un pellizco.", fx: { oro: -10, xp: 2 } } },
        { txt: "Empujarlo escaleras abajo", stat: "ani", cd: 13, ok: { t: "Cae chillando hasta que no se oye. Se le queda la bolsa.", fx: { oro: 15, xp: 3 } }, ko: { t: "Se agarra a vuestra bota y llama a sus primos.", fx: { combate: "diablillo" } } },
        { txt: "Negociar", stat: "elo", cd: 13, ok: { t: "Le convencéis de que el peaje es vuestro. Os paga él.", fx: { oro: 10, xp: 4 } }, ko: { t: "Os sube el precio. Y la sonrisa.", fx: { oro: -15 } } }] },
    { id: "l_escalera_hueco", acto: 4, lugar: "escalera_rota", tipo: "prueba", titulo: "Una mano en el hueco",
      texto: "Falta un tramo entero de escalera. Al otro lado, una sombra os tiende la mano.",
      opciones: [
        { txt: "Saltar", stat: "ani", cd: 13, ok: { t: "Llegáis. La sombra retira la mano, decepcionada.", fx: { xp: 6 } }, ko: { t: "Llegáis a medias. Os agarráis a lo que hay.", fx: { alma: -4, xp: 2 } } },
        { txt: "Aceptar la mano", stat: null, ok: { t: "Tira de vosotros. Hacia ella.", fx: { combate: "sombra" } } },
        { txt: "Flotar con un conjuro", clase: ["mago", "brujo", "bardo"], ok: { t: "Cruzáis el hueco como plumas con miedo.", fx: { xp: 6 } } }] },

    /* ---------- Historietas: continuaciones entre lugares y actos ---------- */
    /* Snig, el goblin que paga sus favores */
    { id: "h_snig2", requiere: "snig", actos: [1, 2], tipo: "prueba", titulo: "Snig paga",
      texto: "Una cabeza verde asoma de una grieta con una antorcha y un saco. «¡Snig! Snig paga favor. Snig robó a esqueletos. ¡Para vosotros!»",
      opciones: [
        { txt: "Aceptar el saco", stat: null, ok: { t: "Monedas, una poción y un diente que no es de nadie conocido.", fx: { oro: 12, pocion: 1, quita: "snig", marca: "snig_amigo" } } },
        { txt: "Invitarle a venir", stat: "elo", cd: 12, ok: { t: "«¿Snig? ¿Con héroes?» Llora un poco, os enseña un atajo y se va a buscar fortuna.", fx: { xp: 5, curaPct: 0.2, quita: "snig", marca: "snig_amigo" } }, ko: { t: "Tanta amabilidad le asusta. Huye y os deja el saco.", fx: { oro: 8, quita: "snig" } } }] },
    { id: "h_snig3", requiere: "snig_amigo", actos: [3], tipo: "prueba", titulo: "El rey Snig",
      texto: "Una banda de kobolds os rodea. Su jefe lleva una corona de lata: es Snig. «¡Snig es rey! Los kobolds creen que Snig es un dragón pequeño.»",
      opciones: [
        { txt: "Pedirle paso", stat: null, ok: { t: "«¡Paso a los amigos de Snig!» Los kobolds os abren camino tirando flores secas.", fx: { xp: 6, bendicion: 1, quita: "snig_amigo" } } },
        { txt: "Pedirle parte del tesoro", stat: "elo", cd: 13, ok: { t: "«Snig comparte. Un poco. Bastante.»", fx: { oro: 25, botin: true, quita: "snig_amigo" } }, ko: { t: "«¡Snig es rey, no tonto!» Os echa, ofendido pero sin rencor.", fx: { xp: 3, quita: "snig_amigo" } } },
        { txt: "Quitarle la corona", stat: null, ok: { t: "Sin corona, nadie sabe a quién obedecer. Atacan a todo el mundo.", fx: { oro: 10, moral: -1, quita: "snig_amigo", combate: "kobold" } } }] },

    /* La carta del tabernero */
    { id: "h_carta2", requiere: "carta_odo", actos: [1], tipo: "prueba", pnj: "fantasma", titulo: "Odo",
      texto: "Un fantasma con delantal rasca la pared de la cripta. Se parece mucho al tabernero del Grifo Tuerto. «Soy Odo. ¿Esa carta es de mi hermano?»",
      opciones: [
        { txt: "Leérsela", stat: null, ok: { t: "«Te perdono.» Odo sonríe y os da una llave oxidada. «Mi cofre, en el castillo. Serví allí.»", fx: { xp: 4, moral: 1, quita: "carta_odo", marca: "llave_odo" } } },
        { txt: "Pedirle oro por ella", stat: "elo", cd: 13, ok: { t: "Os da su paga de fantasma. La carta se queda sin leer para siempre.", fx: { oro: 12, moral: -1, quita: "carta_odo" } }, ko: { t: "«No tengo oro. Tengo frío.» Y os lo pega.", fx: { almaTodos: -2, quita: "carta_odo" } } }] },
    { id: "h_carta3", requiere: "llave_odo", actos: [2], tipo: "prueba", titulo: "El cofre de Odo",
      texto: "En un rincón del castillo hay un cofre con una O grabada. La llave de Odo entra a la primera.",
      opciones: [
        { txt: "Abrirlo", stat: null, ok: { t: "Los ahorros de una vida y una botella del Grifo Tuerto. Odo invita.", fx: { oro: 20, superior: 1, quita: "llave_odo" } } },
        { txt: "Dejarlo para el tabernero", stat: null, ok: { t: "Lo cerráis otra vez. Desde algún sitio, Odo os sonríe.", fx: { xp: 6, bendicion: 1, moral: 1, quita: "llave_odo" } } }] },

    /* La libreta de Fizwick */
    { id: "h_fiado2", requiere: "fiado_fizwick", actos: [2], tipo: "prueba", pnj: "gnomo", titulo: "El cobrador automático",
      texto: "Una armadura con una libreta atornillada al pecho os corta el paso. Habla con la voz de Fizwick: «Cobrador automático. Deuda: una poción. Intereses: muchos».",
      opciones: [
        { txt: "Pagar con intereses", stat: null, ok: { t: "Sella el recibo de un martillazo y se va silbando.", fx: { oro: -20, xp: 2, quita: "fiado_fizwick" } } },
        { txt: "Regatear con la máquina", stat: "raz", cd: 13, ok: { t: "Le encontráis un error de cálculo. Se avergüenza y perdona la deuda.", fx: { xp: 6, quita: "fiado_fizwick" } }, ko: { t: "La máquina no regatea. La máquina cobra.", fx: { quita: "fiado_fizwick", combate: "armadura" } } },
        { txt: "Salir corriendo", stat: "tem", cd: 12, ok: { t: "Las armaduras de alquiler no corren. La deuda, en cambio, os seguirá.", fx: { xp: 1 } }, ko: { t: "Esta sí corre.", fx: { quita: "fiado_fizwick", combate: "armadura" } } }] },

    /* Pip, el pinche */
    { id: "h_pip2", requiere: "pip", actos: [2], tipo: "prueba", titulo: "Pip silba",
      texto: "Pip os guía por un pasadizo detrás de la chimenea. Se para. «Perdón», dice. Y silba. Al fondo, gruñidos.",
      opciones: [
        { txt: "Agarrar a Pip", stat: "ani", cd: 13, ok: { t: "Lo atrapáis. Los lobos no se atreven con él en medio. Lo soltáis lejos, avergonzado.", fx: { xp: 5, quita: "pip" } }, ko: { t: "Se escurre. Los lobos, no.", fx: { quita: "pip", combate: "lobo" } } },
        { txt: "Ofrecerle más que Varkhul", stat: "elo", cd: 12, ok: { t: "Pip duda, coge vuestro oro y os enseña la salida buena.", fx: { oro: -5, xp: 5, moral: 1, quita: "pip" } }, ko: { t: "Pip no se fía de nadie. Los lobos tampoco.", fx: { quita: "pip", combate: "lobo" } } },
        { txt: "Desenvainar", stat: null, ok: { t: "Pues a ello.", fx: { quita: "pip", combate: "lobo" } } }] },
    { id: "h_pip_espia", requiere: "pip_espia", actos: [2], tipo: "prueba", titulo: "Pip se arrepiente",
      texto: "Pip vuelve a buscaros, temblando. «Lo sabéis, ¿verdad?» Lleva en la mano la llave del mayordomo.",
      opciones: [
        { txt: "Usar la llave", stat: null, ok: { t: "Abre la bodega privada del conde: sangre embotellada y su oro de bolsillo.", fx: { oro: 20, xp: 3, quita: "pip_espia" } } },
        { txt: "Convencerle de que huya", stat: "elo", cd: 12, ok: { t: "Se va de madrugada. Os deja escrito en hollín: «Gracias. Odia el ajo».", fx: { xp: 6, bendicion: 1, moral: 1, quita: "pip_espia" } }, ko: { t: "Tiene demasiado miedo. Se queda, pero os deja la llave.", fx: { oro: 10, quita: "pip_espia" } } }] },

    /* El huevo de la torre */
    { id: "h_huevo2", requiere: "huevo_ol", actos: [1], tipo: "prueba", titulo: "Pío",
      texto: "El huevo de la torre se rompe en plena mazmorra. Sale un polluelo con pico, garras y un hambre infinita. Os llama «mamá». A todos.",
      opciones: [
        { txt: "Darle de comer", stat: null, ok: { t: "Se come la ración, las migas y casi un dedo. Ya es vuestro.", fx: { comida: -1, xp: 2, quita: "huevo_ol", marca: "polluelo" } } },
        { txt: "Vendérselo a Fizwick", stat: null, ok: { t: "«¡Un oso-lechuza! ¡Mi sueño!» Paga sin regatear.", fx: { oro: 20, quita: "huevo_ol" } } },
        { txt: "Dejarlo en la mazmorra", stat: null, ok: { t: "Pía detrás de vosotros un buen rato. Las mazmorras crían cosas peores.", fx: { moral: -1, quita: "huevo_ol" } } }] },
    { id: "h_huevo3", requiere: "polluelo", actos: [2, 3], tipo: "prueba", titulo: "Ya no es un polluelo",
      texto: "El polluelo es ahora un oso-lechuza del tamaño de un poni. Os trae regalos: un brazo de armadura, una bota, medio esqueleto.",
      opciones: [
        { txt: "Dejarle pelear un día con vosotros", stat: null, ok: { t: "Arrasa con todo lo que se mueve antes de que digáis «quieto». Luego vuelve al bosque, que es su casa.", fx: { xp: 8, botin: true, quita: "polluelo" } } },
        { txt: "Despedirlo con cariño", stat: "tem", cd: 11, ok: { t: "Abrazo de oso y picotazo de lechuza. Se va volando. Mal, pero volando.", fx: { curaPct: 0.3, xp: 5, moral: 1, quita: "polluelo" } }, ko: { t: "No quiere irse. Al final se va, enfadado y con vuestra capa.", fx: { xp: 3, quita: "polluelo" } } }] },

    /* El laúd del juglar */
    { id: "h_laud2", requiere: "laud", actos: [2], tipo: "prueba", pnj: "fantasma", titulo: "La canción del juglar",
      texto: "En el salón del castillo, los fantasmas bailan sin música. El laúd del juglar vibra solo en vuestra mochila.",
      opciones: [
        { txt: "Tocar su canción", stat: "elo", cd: 12, ok: { t: "Los fantasmas se detienen. Al acabar, se inclinan y se van en paz, dejando sus joyas.", fx: { oro: 15, bendicion: 1, xp: 6, quita: "laud" } }, ko: { t: "Os sale fatal, pero el juglar aparece y la termina. Aplausos de huesos.", fx: { xp: 4, quita: "laud" } } },
        { txt: "Vender el laúd a un duque muerto", stat: null, ok: { t: "Paga en oro de verdad. En algún sitio, el juglar llora.", fx: { oro: 25, moral: -1, quita: "laud" } } }] },

    /* La llama del río de lava */
    { id: "h_farol2", requiere: "farol_fuego", actos: [4], tipo: "prueba", titulo: "Un favor de fuego",
      texto: "En la oscuridad del Abismo, vuestra linterna se enciende sola. La llamita del río de lava asoma: «Os dije que os debía un favor».",
      opciones: [
        { txt: "Que alumbre el camino", stat: null, ok: { t: "Las sombras huyen de su luz. Por primera vez desde que bajasteis, os veis las manos.", fx: { curaPct: 0.4, xp: 4, quita: "farol_fuego" } } },
        { txt: "Que arda en vuestras armas", stat: null, ok: { t: "Las hojas se encienden y ya no se apagan.", fx: { mejora: 1, bendicion: 1, quita: "farol_fuego" } } }] },

    /* El pagaré infernal */
    { id: "h_pagare2", requiere: "pagare", actos: [4], tipo: "prueba", titulo: "Vienen a cobrar",
      texto: "Un diablillo con gafas y cartera os alcanza resoplando. «El pagaré. Con intereses. Muchos intereses.»",
      opciones: [
        { txt: "Pagar el doble", stat: null, ok: { t: "Cuenta dos veces y se va riendo.", fx: { oro: -40, xp: 2, quita: "pagare" } } },
        { txt: "Discutir la letra pequeña", stat: "raz", cd: 14, ok: { t: "Encontráis una coma mal puesta. Deuda anulada y diablillo despedido.", fx: { xp: 8, quita: "pagare" } }, ko: { t: "La letra pequeña tiene su propia letra pequeña.", fx: { maxTodos: -1, quita: "pagare" } } },
        { txt: "Robarle el pagaré", clase: ["picaro"], ok: { t: "El papel arde en vuestros dedos. Sin papel, no hay deuda.", fx: { xp: 6, quita: "pagare" } } },
        { txt: "Negarse a pagar", stat: null, ok: { t: "Sus primos ya estaban esperando.", fx: { quita: "pagare", combate: "diablillo" } } }] },

    /* El martillo de Borgar */
    { id: "h_martillo2", requiere: "martillo_dorna", actos: [3, 4], tipo: "prueba", pnj: "fantasma", titulo: "Dorna",
      texto: "Una enana fantasma con delantal de cuero mira vuestro martillo. «Es de mi Borgar. Le dije que no tardara.» Se llama Dorna.",
      opciones: [
        { txt: "Devolvérselo", stat: null, ok: { t: "Lo abraza. Las runas brillan y vuestras armas quedan benditas por la forja de los ancestros.", fx: { bendicionB: true, xp: 6, moral: 1, quita: "martillo_dorna" } } },
        { txt: "Quedároslo", stat: null, ok: { t: "Dorna no dice nada. Desde entonces, todo os pesa el doble.", fx: { maxTodos: -1, moral: -1, quita: "martillo_dorna" } } },
        { txt: "Prometer llevárselo a Borgar", stat: "tem", cd: 13, ok: { t: "«Cayó al Abismo con los que cavaron hondo.» Os deja el martillo y su bendición.", fx: { bendicion: 1, xp: 4, quita: "martillo_dorna" } }, ko: { t: "No os cree. Se lleva el martillo y se desvanece.", fx: { xp: 2, quita: "martillo_dorna" } } }] },

    /* Tizón, el novicio */
    { id: "h_tizon2", requiere: "tizon", actos: [3], tipo: "prueba", pnj: "forastero", titulo: "El vigía Tizón",
      texto: "Un vigía de los Hijos de la Ceniza os da el alto y se quita la capucha. Es Tizón, el novicio del molino. «No pude volver a casa. Pero puedo ayudaros.»",
      opciones: [
        { txt: "Pedirle información", stat: null, ok: { t: "«Madre Hollín canta al Ojo, no al dragón. Si el dragón cae, el Ojo se abre.» Os pasa un saco de ofrendas.", fx: { oro: 10, xp: 6, quita: "tizon", marca: "tizon_aliado" } } },
        { txt: "Convencerle de desertar de verdad", stat: "elo", cd: 13, ok: { t: "Esta vez sí. Baja la ladera corriendo, sin mirar atrás.", fx: { xp: 5, moral: 1, quita: "tizon" } }, ko: { t: "Tiene miedo. Os deja pasar y se queda en su puesto.", fx: { xp: 2, quita: "tizon", marca: "tizon_aliado" } } },
        { txt: "Desconfiar", stat: "tem", cd: 12, ok: { t: "Hacéis bien: no está solo. Pero os avisa con los ojos y esquiváis la trampa.", fx: { xp: 4, quita: "tizon" } }, ko: { t: "Os dais la vuelta. Llegan los de verdad.", fx: { quita: "tizon", combate: "kobold" } } }] },
    { id: "h_tizon3", requiere: "tizon_aliado", actos: [4], tipo: "prueba", pnj: "forastero", titulo: "Tizón corta las cuerdas",
      texto: "Al borde del vacío, alguien corta las cuerdas de los Hijos de la Ceniza. Es Tizón. «Madre Hollín no bajará más rápido que vosotros.»",
      opciones: [
        { txt: "Darle las gracias", stat: null, ok: { t: "«Decidle a mi madre que fui bueno.» Y se va hacia la luz de arriba.", fx: { xp: 6, bendicion: 1, moral: 1, quita: "tizon_aliado" } } },
        { txt: "Pedirle que baje con vosotros", stat: "elo", cd: 13, ok: { t: "Baja y os cura con los pocos rezos que sabe. Luego se queda vigilando la cuerda.", fx: { curaPct: 0.4, xp: 5, quita: "tizon_aliado" } }, ko: { t: "Se queda arriba. Alguien tiene que cortar cuerdas.", fx: { xp: 3, quita: "tizon_aliado" } } }] }
  );
})();
