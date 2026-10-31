/* Dados y Mazmorras · más sucesos y lore: nuevas decisiones con consecuencias en los cuatro actos
   y el acto secreto, El Abismo, donde aguarda Nhazgul, el Devorador de Estrellas.
   Se carga después de datos.js y amplía el objeto global DATOS. */
(() => {
  "use strict";
  const { EVENTOS, LORE } = DATOS;

  EVENTOS.push(
    /* ---------- Acto I · El Camino del Bosque ---------- */
    { id: "ciervo", acto: 0, tipo: "prueba", pnj: "driada", titulo: "El ciervo blanco",
      texto: "Un ciervo blanco, sagrado para las dríadas, sangra atrapado en un cepo de cazador furtivo.",
      opciones: [
        { txt: "Abrir el cepo con calma", stat: "tem", cd: 12, ok: { t: "El ciervo se aleja despacio y os mira una última vez. El bosque lo recordará.", fx: { xp: 4, moral: 1, marca: "ciervo" } }, ko: { t: "Se revuelve y os cocea antes de huir cojeando.", fx: { alma: -2, xp: 1 } } },
        { txt: "Rematarlo y vender las astas", stat: null, ok: { t: "Las astas valen buena plata. Las hojas dejan de susurrar a vuestro paso.", fx: { oro: 14, moral: -1, marca: "furtivo" } } },
        { txt: "No meterse en líos feéricos", stat: null, ok: { t: "Seguís adelante. El bramido se apaga a vuestra espalda.", fx: {} } }] },
    { id: "moneda", acto: 0, tipo: "prueba", pnj: "forastero", titulo: "La moneda negra",
      texto: "Un encapuchado en el cruce os ofrece una moneda negra, fría como el fondo de un pozo. «Paga cualquier deuda», susurra.",
      opciones: [
        { txt: "Aceptar la moneda", stat: null, ok: { t: "Pesa más de lo que debería. El forastero sonríe y ya no está.", fx: { oro: 10, marca: "moneda" } } },
        { txt: "Estudiarla antes", stat: "raz", cd: 12, ok: { t: "No tiene cara ni cruz: solo un cielo sin estrellas. La tiráis al río.", fx: { xp: 4 } }, ko: { t: "Os quema los dedos de frío. Al soltarla, ha desaparecido.", fx: { alma: -2 } } },
        { txt: "Echar al forastero", stat: "ani", cd: 11, ok: { t: "Retrocede sin pisar el barro. Sus ojos no reflejan la luz.", fx: { xp: 3, moral: 1 } }, ko: { t: "Os empuja con una fuerza imposible y se esfuma.", fx: { alma: -3 } } }] },
    { id: "tabernero", acto: 0, tipo: "enigma", pnj: "tabernero", titulo: "La apuesta del Grifo Tuerto",
      texto: "El tabernero os detiene en la puerta: «Si acertáis, la ronda corre de mi cuenta. Cuanto más seca, más mojada está. ¿Qué es?»",
      respuestas: ["Una esponja", "Una toalla", "La sal", "Una jarra"], correcta: 1,
      ok: { t: "«¡Una toalla!» Os llena el zurrón para el camino.", fx: { xp: 4, pocion: 1 } },
      ko: { t: "«Una toalla.» Os cobra la ronda entera.", fx: { oro: -4 } } },

    /* ---------- Acto II · La Mazmorra ---------- */
    { id: "fizwick", acto: 1, tipo: "prueba", pnj: "gnomo", titulo: "Un gnomo en apuros",
      texto: "Fizwick, el buhonero gnomo, cuelga boca abajo de una trampa de red. «¡Mi carromato! ¡Mis inventos!»",
      opciones: [
        { txt: "Bajarlo con cuidado", stat: "ani", cd: 11, ok: { t: "«¡Os debo una, y yo siempre pago!» Apunta vuestros nombres en una libreta.", fx: { xp: 3, moral: 1, marca: "gnomo" } }, ko: { t: "Se os escurre. Se levanta ofendido, pero agradecido.", fx: { xp: 1, marca: "gnomo" } } },
        { txt: "Cobrarle por bajarlo", stat: "elo", cd: 12, ok: { t: "Paga refunfuñando. No os invitará a su cumpleaños.", fx: { oro: 12 } }, ko: { t: "Se suelta solo y os saca la lengua.", fx: {} } },
        { txt: "Vaciarle los bolsillos", stat: null, ok: { t: "Monedas y un frasco. Sus maldiciones gnomas os siguen un buen rato.", fx: { oro: 8, sueno: 1, moral: -1 } } }] },
    { id: "grimorio", acto: 1, tipo: "prueba", titulo: "El grimorio de Malakar",
      texto: "En un atril de hueso descansa un libro negro. Sus páginas pasan solas y murmuran vuestro nombre.",
      opciones: [
        { txt: "Leerlo hasta el final", stat: "raz", cd: 14, ok: { t: "Habla de una grieta y de algo que come estrellas. Os lo lleváis.", fx: { xp: 7, marca: "grimorio" } }, ko: { t: "Las letras se os clavan en los ojos. Os lo lleváis igual.", fx: { almaTodos: -3, marca: "grimorio" } } },
        { txt: "Quemarlo", stat: "tem", cd: 12, ok: { t: "Arde con llamas verdes y un chillido. El aire se aligera.", fx: { xp: 4, moral: 1 } }, ko: { t: "Las cenizas os buscan la garganta.", fx: { alma: -2, xp: 1 } } },
        { txt: "Cerrarlo y no mirar atrás", stat: null, ok: { t: "Prudente. Seguís oyendo el murmullo dos pasillos más allá.", fx: { xp: 1 } } }] },
    { id: "silencio", acto: 1, tipo: "enigma", pnj: "fantasma", titulo: "La guardiana muda",
      texto: "Una guardia fantasma se lleva un dedo a los labios: «Si me nombras, me rompes. ¿Qué soy?»",
      respuestas: ["El cristal", "Un juramento", "El silencio", "El hielo"], correcta: 2,
      ok: { t: "Asiente sin decir nada y os señala un nicho con monedas.", fx: { xp: 5, oro: 12 } },
      ko: { t: "Su grito sin voz os hiela la sangre.", fx: { almaTodos: -2, xp: 1 } } },

    /* ---------- Acto III · El Castillo ---------- */
    { id: "reina", acto: 2, tipo: "prueba", pnj: "fantasma", titulo: "La novia de Varkhul",
      texto: "El fantasma de la reina Aldara llora en la torre. Varkhul la mató en su boda y nunca le dio sepultura.",
      opciones: [
        { txt: "Enterrar sus huesos", stat: "tem", cd: 12, ok: { t: "Rezáis sobre su tumba. «No os dejaré solos en la oscuridad», promete.", fx: { xp: 5, moral: 1, marca: "reina" } }, ko: { t: "La tierra del castillo está maldita. Sangráis cavando.", fx: { almaTodos: -2, xp: 2 } } },
        { txt: "Preguntarle por Varkhul", stat: "elo", cd: 12, ok: { t: "«Teme a la luz del alba.» Os entrega su bendición nupcial.", fx: { bendicion: 1, xp: 3 } }, ko: { t: "Solo sabe llorar. Su pena os pesa.", fx: { xp: 1 } } },
        { txt: "Quedarse sus joyas", stat: null, ok: { t: "Oro y rubíes. El llanto se vuelve un grito que no os deja dormir.", fx: { oro: 22, alma: -2, moral: -1 } } }] },
    { id: "celdas", acto: 2, tipo: "prueba", titulo: "La despensa del vampiro",
      texto: "En las mazmorras, aldeanos de Villabruma esperan pálidos y encadenados. Varkhul los guarda para cenar.",
      opciones: [
        { txt: "Liberarlos a todos", stat: "ani", cd: 13, ok: { t: "Huyen por el desagüe. «¡Villabruma sabrá de esto!»", fx: { xp: 5, moral: 1, marca: "aldeanos" } }, ko: { t: "Los guardias os oyen. Los sacáis, pero a golpes.", fx: { almaTodos: -3, xp: 3, marca: "aldeanos" } } },
        { txt: "Abrir solo la cerradura", stat: "raz", cd: 12, ok: { t: "Clic. Que se busquen la vida. Os dan las gracias igual.", fx: { xp: 3 } }, ko: { t: "La ganzúa se parte. No podéis hacer nada.", fx: { xp: 1 } } },
        { txt: "Dejarlos: son un estorbo", stat: null, ok: { t: "Sus súplicas resuenan en la piedra mucho rato.", fx: { moral: -1 } } }] },
    { id: "caliz", acto: 2, tipo: "prueba", titulo: "El cáliz de sangre",
      texto: "Sobre el altar, un cáliz rebosa sangre caliente. Dicen que quien bebe de él ya no siente el frío de la muerte.",
      opciones: [
        { txt: "Beber un trago", stat: "ani", cd: 14, ok: { t: "Una fuerza oscura os recorre las venas. No sabe tan mal.", fx: { maxTodos: 1, xp: 3, moral: -1 } }, ko: { t: "Os retuerce el estómago durante horas.", fx: { almaTodos: -4 } } },
        { txt: "Verterlo en el suelo", stat: null, ok: { t: "La sangre sisea al tocar la piedra. Algo grita en el castillo.", fx: { xp: 3, moral: 1 } } },
        { txt: "Venderlo al Mercader de los Planos", stat: "elo", cd: 13, ok: { t: "Paga sin preguntar y se relame.", fx: { oro: 20 } }, ko: { t: "«Está agria», dice. Os da calderilla.", fx: { oro: 4 } } }] },

    /* ---------- Acto IV · El Volcán ---------- */
    { id: "forja_runas", acto: 3, tipo: "prueba", pnj: "herrero", titulo: "La forja de los ancestros",
      texto: "Una forja enana apagada desde hace un siglo. El yunque está grabado con runas de sellado.",
      opciones: [
        { txt: "Encender la forja", stat: "ani", cd: 13, ok: { t: "El fuego enano despierta y templa algo que dormía en el yunque.", fx: { botin: true, xp: 3 } }, ko: { t: "El fuelle revienta y os escupe brasas.", fx: { almaTodos: -2 } } },
        { txt: "Leer las runas", stat: "raz", cd: 12, ok: { t: "«Sellamos la grieta bajo el pico. Que nadie cave más hondo.»", fx: { xp: 6 } }, ko: { t: "Son enano antiguo. Ni idea.", fx: { xp: 1 } } }] },
    { id: "susurro", acto: 3, tipo: "prueba", titulo: "Una grieta que susurra",
      texto: "Bajo las monedas del dragón se abre una grieta fría. De ella sube una voz que no es la de Ignárax: «Venid».",
      opciones: [
        { txt: "Escuchar la voz", stat: "tem", cd: 14, ok: { t: "Resistís y oís su nombre: Nhazgul. Él también oye el vuestro.", fx: { xp: 6, marca: "susurro" } }, ko: { t: "La voz os vacía por dentro. Ya sabe quiénes sois.", fx: { almaTodos: -3, marca: "susurro" } } },
        { txt: "Taparla con rocas", stat: "ani", cd: 12, ok: { t: "La grieta calla. Por ahora.", fx: { xp: 3 } }, ko: { t: "Las rocas caen hacia dentro y no se oye el fondo.", fx: { alma: -2 } } },
        { txt: "Echarle una ofrenda de oro", stat: null, ok: { t: "Las monedas caen sin hacer ruido. La voz se ríe, complacida.", fx: { oro: -10, bendicion: 1, moral: -1 } } }] },
    { id: "puerta_enana", acto: 3, tipo: "enigma", titulo: "La puerta de Barak-Thur",
      texto: "Unas runas brillan en la puerta de piedra: «Tengo dientes y no muerdo; abro lo que está cerrado. ¿Qué soy?»",
      respuestas: ["Un peine", "Una llave", "Una sierra", "Un rastrillo"], correcta: 1,
      ok: { t: "La puerta se abre a un almacén enano intacto.", fx: { xp: 5, oro: 18 } },
      ko: { t: "Un chorro de vapor sale de las juntas.", fx: { almaTodos: -2, xp: 1 } } },

    /* ---------- Acto V · El Abismo ---------- */
    { id: "puente_sombras", acto: 4, tipo: "prueba", titulo: "El puente de sombra",
      texto: "Un puente de humo negro cruza un vacío sin fondo. Abajo flotan estrellas apagadas, como ojos muertos.",
      opciones: [
        { txt: "Cruzar sin mirar abajo", stat: "tem", cd: 13, ok: { t: "Llegáis al otro lado con el corazón en un puño.", fx: { xp: 7 } }, ko: { t: "Miráis. El vacío os mira a vosotros.", fx: { almaTodos: -4, xp: 2 } } },
        { txt: "Solidificarlo con magia", stat: "raz", cd: 14, ok: { t: "El humo se vuelve cristal. En él hay monedas atrapadas.", fx: { xp: 8, oro: 20 } }, ko: { t: "El conjuro se deshace a medio puente.", fx: { almaTodos: -3 } } },
        { txt: "Rodear por el borde", stat: null, ok: { t: "Es más largo y más frío, pero seguro.", fx: { almaTodos: -1, xp: 3 } } }] },
    { id: "capullos", acto: 4, tipo: "prueba", pnj: "forastero", titulo: "Capullos de seda",
      texto: "Telarañas del tamaño de velas cuelgan del techo. Dentro de un capullo, alguien todavía respira.",
      opciones: [
        { txt: "Cortar la seda", stat: "ani", cd: 13, ok: { t: "Sale un aventurero medio muerto. Os da su bolsa en agradecimiento.", fx: { oro: 15, xp: 6, moral: 1 } }, ko: { t: "La seda vibra. Algo grande baja a mordiscos.", fx: { almaTodos: -4, xp: 2 } } },
        { txt: "Quemar toda la telaraña", stat: "raz", cd: 12, ok: { t: "Arde en un instante. Entre las cenizas brilla algo.", fx: { botin: true, xp: 4, moral: -1 } }, ko: { t: "El humo es venenoso.", fx: { almaTodos: -3 } } },
        { txt: "Saquear los capullos secos", stat: null, ok: { t: "Los muertos no necesitan oro. Las arañas no opinan igual.", fx: { oro: 25, alma: -4, moral: -1 } } }] },
    { id: "dados_diablillos", acto: 4, tipo: "prueba", titulo: "Los dados de los diablillos",
      texto: "Tres diablillos juegan a los dados sobre una calavera. «¿Una partida? Se apuesta oro… o algo mejor.»",
      opciones: [
        { txt: "Apostar y jugar limpio", stat: "tem", cd: 13, ok: { t: "Les ganáis. Pagan entre chillidos de rabia.", fx: { oro: 30, xp: 4 } }, ko: { t: "Pierden los dados, ganan ellos. Siempre.", fx: { oro: -15 } } },
        { txt: "Hacerles trampa", stat: "elo", cd: 14, ok: { t: "Engañar a un diablillo: hazaña para los bardos.", fx: { oro: 20, xp: 8, moral: -1 } }, ko: { t: "Os pillan. Las trampas se pagan con sangre.", fx: { almaTodos: -4, oro: -10 } } },
        { txt: "Patear la calavera", stat: null, ok: { t: "Huyen insultándoos en infernal.", fx: { xp: 2 } } }] },
    { id: "reflejo", acto: 4, tipo: "prueba", titulo: "Vuestras sombras",
      texto: "Vuestras sombras se despegan del suelo y se ponen en pie. Tienen vuestra cara, pero sonríen distinto.",
      opciones: [
        { txt: "Plantarles cara", stat: "ani", cd: 14, ok: { t: "Se deshacen como humo y vuelven a vuestros pies, dóciles.", fx: { xp: 9 } }, ko: { t: "Pegan como vosotros, pero sin cansarse.", fx: { almaTodos: -5, xp: 3 } } },
        { txt: "Recordar quiénes sois", stat: "tem", cd: 13, ok: { t: "Les habláis de Villabruma. Las sombras bajan la cabeza.", fx: { xp: 7, curaPct: 0.3 } }, ko: { t: "Dudáis. Ellas no.", fx: { maxTodos: -1, xp: 2 } } }] },
    { id: "estrella_caida", acto: 4, tipo: "prueba", titulo: "Una estrella a medio comer",
      texto: "Un fragmento de estrella late en el suelo, mordido por unos dientes enormes. Su luz aún calienta.",
      opciones: [
        { txt: "Rezar a Solara junto a ella", stat: "tem", cd: 13, ok: { t: "La luz responde. Solara os oye incluso aquí.", fx: { bendicion: 2, almaTodos: 5, xp: 4 } }, ko: { t: "La estrella se apaga un poco más. Solo silencio.", fx: { xp: 2 } } },
        { txt: "Usar su luz para curaros", stat: null, ok: { t: "Las heridas se cierran. La estrella se apaga para siempre.", fx: { curaPct: 0.6, moral: -1 } } },
        { txt: "Arrancar un pedazo", stat: "ani", cd: 13, ok: { t: "Quema, pero brilla como un arma sagrada.", fx: { botin: true, alma: -3, xp: 4 } }, ko: { t: "Os abrasa las manos y se os cae al vacío.", fx: { alma: -5 } } }] },
    { id: "voz_estrellas", acto: 4, tipo: "enigma", pnj: "planar", titulo: "El mercader perdido",
      texto: "El Mercader de los Planos tiembla: «Respondedme y os saco algo bueno. Murió hace mil años y aún brilla en tu cielo. ¿Qué es?»",
      respuestas: ["Un dios", "La luna", "Una estrella", "Un fantasma"], correcta: 2,
      ok: { t: "«Y él se las come.» Os da su mejor mercancía y huye.", fx: { xp: 8, superior: 1, oro: 15 } },
      ko: { t: "«Una estrella…» Se desvanece. Algo en la oscuridad se relame.", fx: { almaTodos: -3, xp: 2 } } },

    /* ---------- Consecuencias de decisiones anteriores ---------- */
    { id: "ciervo2", requiere: "ciervo", actos: [1, 2], tipo: "prueba", pnj: "driada", titulo: "Un destello blanco",
      texto: "Entre la piedra húmeda aparece el ciervo blanco, hecho de luz. La dríada lo envía a pagar su deuda.",
      opciones: [
        { txt: "Beber donde pisa", stat: null, ok: { t: "Brota agua clara del suelo. Sabe a bosque.", fx: { curaPct: 0.5, xp: 2, quita: "ciervo" } } },
        { txt: "Seguirlo", stat: "tem", cd: 12, ok: { t: "Os guía hasta un tesoro escondido y se desvanece.", fx: { botin: true, xp: 4, quita: "ciervo" } }, ko: { t: "Lo perdéis de vista en la oscuridad.", fx: { xp: 1, quita: "ciervo" } } }] },
    { id: "furtivo2", requiere: "furtivo", actos: [1, 2], tipo: "prueba", pnj: "driada", titulo: "Raíces en la piedra",
      texto: "Raíces negras revientan los muros. La voz de la dríada brota de ellas: «Mataste a mi ciervo».",
      opciones: [
        { txt: "Pedirle perdón", stat: "elo", cd: 13, ok: { t: "Las raíces se retiran despacio. Os perdona, por esta vez.", fx: { xp: 4, moral: 1, quita: "furtivo" } }, ko: { t: "Las raíces os aprietan hasta crujir.", fx: { almaTodos: -3, quita: "furtivo" } } },
        { txt: "Cortarlas a hachazos", stat: "ani", cd: 13, ok: { t: "Sangran savia y se repliegan. Ella no olvidará.", fx: { xp: 3 } }, ko: { t: "Por cada raíz cortada salen dos.", fx: { almaTodos: -4 } } },
        { txt: "Ofrecer las ganancias", stat: null, ok: { t: "Las monedas se hunden en la tierra. Silencio.", fx: { oro: -14, quita: "furtivo" } } }] },
    { id: "moneda2", requiere: "moneda", actos: [3, 4], tipo: "prueba", pnj: "forastero", titulo: "La moneda pesa",
      texto: "La moneda negra se hiela en vuestra bolsa. El encapuchado vuelve: «Ha llegado la hora de pagar».",
      opciones: [
        { txt: "Pagar con sangre", stat: null, ok: { t: "Os araña la palma y bebe. A cambio, os llena la bolsa.", fx: { oro: 25, maxTodos: -1, moral: -1, quita: "moneda" } } },
        { txt: "Arrojarla a la lava", stat: "tem", cd: 13, ok: { t: "La moneda grita al fundirse. El forastero se deshace en humo.", fx: { xp: 7, moral: 1, quita: "moneda" } }, ko: { t: "Vuelve a vuestra bolsa. Y el frío, a vuestros huesos.", fx: { almaTodos: -3 } } }] },
    { id: "gnomo2", requiere: "gnomo", actos: [2, 3, 4], tipo: "prueba", pnj: "gnomo", titulo: "Fizwick paga sus deudas",
      texto: "¡Puf! Fizwick aparece en una nube de humo. «¡Os encontré! Os traigo mi último invento. Casi no explota.»",
      opciones: [
        { txt: "Aceptarlo sin preguntar", stat: null, ok: { t: "Es un artilugio rarísimo, pero funciona de maravilla.", fx: { botin: true, xp: 3, quita: "gnomo" } } },
        { txt: "Pedir algo más práctico", stat: "elo", cd: 11, ok: { t: "Refunfuña y os da frascos de su propia cosecha.", fx: { pocion: 2, sueno: 1, quita: "gnomo" } }, ko: { t: "Se ofende y os deja un frasco por educación.", fx: { pocion: 1, quita: "gnomo" } } }] },
    { id: "reina2", requiere: "reina", actos: [3, 4], tipo: "prueba", pnj: "fantasma", titulo: "La reina cumple",
      texto: "Una luz pálida baja de la oscuridad. Es la reina Aldara, en paz por fin. «Os prometí no dejaros solos.»",
      opciones: [
        { txt: "Aceptar su abrazo", stat: null, ok: { t: "Su frío es dulce. Las heridas se cierran y el miedo se va.", fx: { curaPct: 0.5, bendicion: 1, xp: 4, quita: "reina" } } },
        { txt: "Pedirle que vigile el camino", stat: "elo", cd: 12, ok: { t: "Os muestra un atajo y un tesoro olvidado.", fx: { botin: true, xp: 5, quita: "reina" } }, ko: { t: "Se desvanece antes de responder, pero os deja su calma.", fx: { almaTodos: 3, quita: "reina" } } }] },
    { id: "aldeanos2", requiere: "aldeanos", actos: [3], tipo: "prueba", pnj: "tabernero", titulo: "Noticias de Villabruma",
      texto: "El tabernero del Grifo Tuerto sube la ladera con una mula: «Los que salvasteis volvieron a casa. El pueblo os manda esto».",
      opciones: [
        { txt: "Aceptarlo con gratitud", stat: null, ok: { t: "Pociones, pan y una carta que os hace un nudo en la garganta.", fx: { pocion: 2, superior: 1, xp: 3, quita: "aldeanos" } } },
        { txt: "Que lo guarden para el pueblo", stat: null, ok: { t: "«Sois buena gente.» Os da al menos su bendición.", fx: { bendicion: 1, xp: 5, moral: 1, quita: "aldeanos" } } }] },
    { id: "grimorio2", requiere: "grimorio", actos: [4], tipo: "prueba", titulo: "El libro vuelve a casa",
      texto: "El grimorio de Malakar se abre solo en vuestras manos. Aquí, junto a su amo, por fin lee lo que oculta.",
      opciones: [
        { txt: "Leer la última página", stat: "raz", cd: 13, ok: { t: "Es el punto débil de Nhazgul: la luz que robó. Sabéis cómo usarla.", fx: { bendicion: 2, xp: 9, quita: "grimorio" } }, ko: { t: "El libro lee vuestra mente a la vez. Grita en ella.", fx: { almaTodos: -5, quita: "grimorio" } } },
        { txt: "Tirarlo al vacío", stat: null, ok: { t: "Cae chillando. Una cadena invisible se rompe dentro de vosotros.", fx: { xp: 4, almaTodos: 3, quita: "grimorio" } } }] },
    { id: "susurro2", requiere: "susurro", actos: [4], tipo: "prueba", titulo: "Nhazgul os conoce",
      texto: "«Os oí bajo el oro del dragón», dice la voz. «Él me servía. Servidme vosotros y os daré todo lo que brilla.»",
      opciones: [
        { txt: "Rechazarlo con firmeza", stat: "tem", cd: 14, ok: { t: "La voz retrocede, herida. Ahora es ella la que duda.", fx: { xp: 10, bendicion: 1, moral: 1, quita: "susurro" } }, ko: { t: "Ríe. Su risa os desgarra por dentro.", fx: { almaTodos: -5, quita: "susurro" } } },
        { txt: "Aceptar su oro", stat: null, ok: { t: "Llueve oro frío. Algo de vosotros se queda en la oscuridad.", fx: { oro: 30, maxTodos: -2, moral: -1, quita: "susurro" } } }] },
    { id: "aliado2", requiere: "aliado", actos: [4], tipo: "prueba", pnj: "herrero", titulo: "Las runas de Thrain",
      texto: "Thrain se arrodilla ante una pared con runas enanas. «Mis ancestros sellaron esto. Puedo despertar su sello.»",
      opciones: [
        { txt: "Protegerlo mientras canta", stat: "ani", cd: 12, ok: { t: "Las runas arden de oro. Las sombras huyen chillando.", fx: { xp: 8, curaPct: 0.4, bendicion: 1 } }, ko: { t: "Las sombras os muerden, pero Thrain termina el canto.", fx: { almaTodos: -3, xp: 5 } } },
        { txt: "Buscar el tesoro de los ancestros", stat: "raz", cd: 13, ok: { t: "Tras las runas hay una cámara enana intacta.", fx: { oro: 25, botin: true } }, ko: { t: "Solo hay polvo y huesos de enano.", fx: { xp: 2 } } }] },
    { id: "sacrilegio2", requiere: "sacrilegio", actos: [4], tipo: "prueba", titulo: "Las sombras huelen la plata",
      texto: "Las sombras se arremolinan a vuestro alrededor. Huelen la plata robada a Solara: sin su luz, sois presa fácil.",
      opciones: [
        { txt: "Invocar a Solara de todos modos", stat: "tem", cd: 15, ok: { t: "Un rayo de alba atraviesa el Abismo. Solara os perdona.", fx: { xp: 8, almaTodos: 4, moral: 1, quita: "sacrilegio" } }, ko: { t: "Nadie responde. Las sombras se alimentan.", fx: { almaTodos: -5 } } },
        { txt: "Echarles la plata para que se distraigan", stat: null, ok: { t: "Se lanzan sobre las monedas. Huis mientras pelean.", fx: { oro: -20, xp: 3 } } }] }
  );

  LORE.mundo.push(
    { titulo: "La historia de Valdren", texto: [
      "Durante la Era de las Escamas, los dragones gobernaban Valdren y los hombres les pagaban tributo en oro y en doncellas. Hasta que Aldric el Alzado unió a humanos, elfos y enanos y los expulsó en la Guerra de las Cenizas.",
      "De aquella alianza nació la Corona de Valdren. Duró cuatrocientos años, hasta que Malakar envenenó al último rey. Desde entonces solo quedan reinos pequeños, ruinas y la Cripta de los Reyes Olvidados."] },
    { titulo: "Los reinos enanos", texto: [
      "Bajo las montañas hubo tres reinos enanos: Kor-Ammon, de los canteros; Hondaroca, de los mineros de gemas, y Barak-Thur, la mayor forja del mundo, al pie del Pico Cenizo.",
      "Los enanos de Barak-Thur cavaron más hondo que nadie. Un día encontraron una grieta fría donde no debía haber nada y la sellaron con siete runas. Poco después llegó Ignárax, y nadie se preguntó por qué eligió dormir justo encima."] },
    { titulo: "Los dioses y las estrellas", texto: [
      "Los sacerdotes de Solara enseñan que cada estrella es la mirada de un dios antiguo que vela por el mundo. Cuando una estrella se apaga, su dios cae en el olvido.",
      "Los astrónomos de Valdren llevan siglos contando cómo desaparecen estrellas del cielo, una a una. Los templos prefieren no hablar de ello."] },
    { titulo: "El Abismo", texto: [
      "Bajo el Reino de las Sombras, donde los muertos sin descanso ya no se atreven a bajar, está el Abismo: un vacío sin suelo ni cielo, lleno de estrellas apagadas que flotan como ojos ciegos.",
      "Allí viven diablillos que apuestan almas a los dados, arañas del tamaño de una casa y sombras que fueron personas y ya no recuerdan su nombre."] },
    { titulo: "Nhazgul, el Devorador de Estrellas", texto: [
      "Antes de los dioses ya existía el hambre. Nhazgul es lo que queda de ella: una oscuridad con dientes que se alimenta de la luz de las estrellas, y de los dioses que viven en ellas.",
      "No puede salir del Abismo por sí mismo, así que susurra. Le susurró a Malakar el secreto de la inmortalidad. Le susurró a Ignárax en sueños durante cien años. Y ahora os susurra a vosotros."] },
    { titulo: "La cadena de susurros", texto: [
      "Malakar sirvió al dragón, el dragón prometió el reino a Varkhul, y todos creían mandar sobre alguien. Ninguno sabía que obedecía a la misma voz.",
      "Por eso la muerte de Ignárax no es el final: es la grieta que Nhazgul esperaba."] }
  );

  LORE.lugares[4] = { titulo: "El Abismo", texto: [
    "Al caer Ignárax, el sello enano bajo su tesoro se resquebraja. La grieta lleva al plano de las sombras, donde Nhazgul, el Devorador de Estrellas, espera con hambre de mil años."] };
})();
