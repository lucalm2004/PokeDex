/* Dados y Mazmorras · historia continuada, viaje y mascotas.
   Se carga después de datos.js y contenido.js y amplía el objeto global DATOS.

   Reparto que acompaña toda la partida:
   · Ascua, la guía encapuchada que huele a ceniza. En el castillo se descubre que es la hija de Ignárax:
     quiere salvar a su padre de la voz que le susurra desde abajo. Si confiáis en ella, os acompaña hasta el Abismo.
   · Ulrika Mediaoreja y la Compañía del Colmillo, aventureros rivales. Amigos, deudores o enemigos según lo que hagáis.
   · Los Hijos de la Ceniza y Madre Hollín: dicen adorar al dragón, pero sirven al Ojo de Nhazgul.

   HISTORIA[acto] = { intro, medio, antesJefe }. Cada escena puede llevar «variantes»: la primera cuya marca esté
   guardada sustituye el texto (y las opciones, si las trae; si no, se mantienen las de la escena).
   AYUDAS_JEFE[marca] = efecto al empezar el combate contra el jefe de ese acto si la marca sigue guardada:
   dano (PG que pierde el jefe), debilita (turnos con −2 para atacar), aturde (turnos que pierde), maldice (turnos
   recibiendo +2 de cada golpe; 99 = todo el combate), cura (PG que gana el jefe) y fuerte (+valor para atacar). */
(() => {
  "use strict";
  const D = DATOS;

  /* ---------- Opciones compartidas entre escenas y variantes ---------- */
  const espantar = () => ({ txt: "Espantarlos", stat: "ani", cd: 12,
    ok: { t: "Huyen. A uno se le cae un medallón: un ojo cerrado entre llamas.", fx: { xp: 3, marca: "medallon" } },
    ko: { t: "Os arrojan ceniza ardiente y escapan riendo.", fx: { almaTodos: -2 } } });
  const espiar = () => ({ txt: "Espiar su rito", stat: "tem", cd: 12,
    ok: { t: "«Cuando el dragón caiga, el Ojo se abrirá.» No lo entendéis. Aún.", fx: { xp: 4, marca: "profecia" } },
    ko: { t: "Os descubren. Huyen gritando y despiertan al trol de mal humor.", fx: { xp: 1, marca: "enfurecido" } } });
  const romperFilacteria = () => ({ txt: "Romper la filacteria", stat: null,
    ok: { t: "Encontráis el cáliz de hueso y lo hacéis añicos. En el trono, Malakar grita.", fx: { xp: 3, marca: "filacteria" } } });
  const exigirVerdad = cd => ({ txt: "Exigirle la verdad", stat: "elo", cd,
    ok: { t: "«Algo le habla a mi padre en sueños. Quiero detenerlo.» Parece sincera.", fx: { xp: 4, marca: "verdad" } },
    ko: { t: "«No lo entenderíais.» Desde entonces camina sola, unos pasos detrás.", fx: { xp: 1, marca: "recelo" } } });
  const retratoResto = () => [
    { txt: "Fingir que no lo habéis visto", stat: null, ok: { t: "Nadie dice nada. El silencio pesa más que el retrato.", fx: { xp: 2 } } },
    { txt: "Descolgar el retrato", stat: "ani", cd: 10,
      ok: { t: "Detrás hay un hueco con monedas antiguas y una escama roja.", fx: { oro: 15, xp: 2 } },
      ko: { t: "El marco os cae encima. Ascua ni se inmuta.", fx: { alma: -2 } } }];
  const precioPaso = cd => [
    { txt: "Negarse: es de los nuestros", stat: null,
      ok: { t: "Ascua os mira como si no lo esperara. «No lo olvidaré.»", fx: { xp: 4, moral: 1, marca: "lealtad" } } },
    { txt: "Entregarla", stat: null,
      ok: { t: "Varkhul la encadena con plata. Ascua no grita: solo os mira.", fx: { oro: 25, moral: -1, marca: "traicion" } } },
    { txt: "Fingir el trato", stat: "elo", cd,
      ok: { t: "Ascua os sigue el juego. Cuando Varkhul se acerca, le escupe fuego a la cara.", fx: { xp: 6, marca: "llamarada" } },
      ko: { t: "Varkhul huele el engaño y os araña. Ascua, al menos, sabe de qué lado estáis.", fx: { almaTodos: -3, marca: "lealtad" } } }];
  const padreHija = requiere => ({ requiere,
    texto: "Ascua se quita la capucha ante la guarida. «Algo le susurra a mi padre desde abajo. Si no logro despertarlo, lucharé con vosotros.»",
    opciones: [
      { txt: "Que luche a nuestro lado", stat: null, ok: { t: "Sus ojos de oro arden. «Juntos, entonces.»", fx: { xp: 4, marca: "hija" } } },
      { txt: "Que intente despertarlo", stat: "tem", cd: 13,
        ok: { t: "Le canta en dracónico. Ignárax duda, y su duda os da aliento. Ella sigue a vuestro lado.", fx: { xp: 7, curaPct: 0.3, marca: "hija" } },
        ko: { t: "La canción se rompe. Ignárax la lanza contra el oro, malherida.", fx: { xp: 3 } } }] });
  const cantoHollin = (cdFue, cdInt) => [
    { txt: "Interrumpir el canto", stat: "ani", cd: cdFue,
      ok: { t: "Los sectarios se dispersan. El Ojo se queda a medio abrir, adormilado.", fx: { xp: 8, bendicion: 1 } },
      ko: { t: "Cantan más alto. El Ojo parpadea y os araña el alma.", fx: { almaTodos: -4, xp: 3 } } },
    { txt: "Volver el rito contra ella", stat: "raz", cd: cdInt,
      ok: { t: "Cambiáis una palabra del canto. El Ojo mira a Madre Hollín… y se la traga.", fx: { xp: 10, pm: 4 } },
      ko: { t: "Os equivocáis de palabra. El Ojo os mira a vosotros.", fx: { almaTodos: -4, xp: 3 } } },
    { txt: "Esconderse y escuchar", stat: "tem", cd: 12,
      ok: { t: "Aprendéis la letra del canto. Ya sabéis cuándo parpadea el Ojo.", fx: { xp: 5, bendicion: 1 } },
      ko: { t: "El canto se os mete en la cabeza y no hay forma de sacarlo.", fx: { almaTodos: -2 } } }];

  /* ---------- La historia, acto por acto ---------- */
  D.HISTORIA = [
    /* Acto I · El Camino del Bosque: se presentan Ascua, la Compañía y los Hijos de la Ceniza. */
    {
      intro: {
        titulo: "Una guía en la niebla", pnj: "forastero",
        texto: "A la salida de Villabruma os espera una mujer encapuchada que huele a ceniza. «Me llamo Ascua. Conozco el camino al Pico Cenizo.»",
        opciones: [
          { txt: "Aceptar su guía", stat: null,
            ok: { t: "«Por el bosque, nunca de noche.» Echa a andar sin esperar a nadie.", fx: { comida: 2, xp: 2, marca: "ascua" } } },
          { txt: "Regatear su precio", stat: "elo", cd: 12,
            ok: { t: "«Gratis, pues. Me interesa que lleguéis vivos.» Raro, pero barato.", fx: { xp: 3, marca: "ascua" } },
            ko: { t: "«Cinco monedas por cabeza, por listos.» Pagáis, y os guía igual.", fx: { oro: -5, marca: "ascua" } } },
          { txt: "Ir sin guía", stat: null,
            ok: { t: "Se encoge de hombros. «Nos veremos más adelante. Siempre nos vemos.»", fx: { xp: 2 } } }]
      },
      medio: {
        titulo: "La Compañía del Colmillo",
        texto: "Junto al camino acampa otra partida. Su jefa, Ulrika Mediaoreja, dejó media oreja en el puente del trol. «¿También vais a por el dragón?»",
        opciones: [
          { txt: "Compartir su fuego", stat: "elo", cd: 11,
            ok: { t: "Brindáis. Ulrika os da un frasco de aceite: «Para el trol. Que arda por mi oreja.»", fx: { xp: 3, comida: 1, marca: "aceite" } },
            ko: { t: "La charla se agria con el vino. Os despedís con frialdad.", fx: { xp: 1 } } },
          { txt: "Robarles las provisiones", stat: null,
            ok: { t: "Al alba os vais con sus sacos. Ulrika jura que lo pagaréis caro.", fx: { comida: 3, oro: 8, moral: -1, marca: "rencor" } } },
          { txt: "Echarle un pulso", stat: "ani", cd: 13,
            ok: { t: "Ulrika pierde y se ríe. «Tenéis brazo. Nos veremos más abajo.»", fx: { xp: 4, oro: 6 } },
            ko: { t: "Os tumba el brazo y toda la Compañía se burla.", fx: { alma: -2, xp: 1 } } }]
      },
      antesJefe: {
        titulo: "Ofrendas bajo el puente",
        texto: "Bajo el puente, unos encapuchados con un ojo cerrado bordado entre llamas dejan corderos al trol. «Que nadie suba al Pico», rezan.",
        opciones: [espantar(), espiar(),
          { txt: "Robar los corderos", stat: null,
            ok: { t: "Cena asada para días. El trol se queda sin comer… y con muy mal humor.", fx: { comida: 3, marca: "enfurecido" } } }],
        variantes: [
          { requiere: "ascua",
            texto: "Ascua se tensa: «Hijos de la Ceniza. Adoran al dragón». Bajo el puente dejan corderos al trol y rezan: «Que nadie suba al Pico».",
            opciones: [espantar(), espiar(),
              { txt: "Dejar que Ascua les hable", stat: null,
                ok: { t: "Les habla en una lengua que chisporrotea. Se arrodillan ante ella y huyen.", fx: { xp: 4, marca: "reverencia" } } }] }]
      }
    },

    /* Acto II · La Mazmorra: la Compañía cae en manos de Malakar y el liche delata a Ascua. */
    {
      intro: {
        titulo: "Huellas en la cripta",
        texto: "En la entrada de la Cripta de los Reyes Olvidados hay huellas frescas: la Compañía del Colmillo baja delante. Huele a polvo y a antorcha.",
        opciones: [
          { txt: "Seguir sus huellas", stat: "tem", cd: 12,
            ok: { t: "Pisáis donde ellos pisaron. Hasta encontráis un saco que se les cayó.", fx: { comida: 2, xp: 3 } },
            ko: { t: "Ellos esquivaron la trampa. Vosotros no.", fx: { almaTodos: -2 } } },
          { txt: "Abrir vuestro propio camino", stat: "raz", cd: 12,
            ok: { t: "Un pasadizo lateral os lleva a un nicho lleno de monedas.", fx: { oro: 12, xp: 3 } },
            ko: { t: "Os perdéis una hora entre huesos y telarañas.", fx: { xp: 1 } } }],
        variantes: [
          { requiere: "aceite",
            texto: "Ulrika os ha dejado flechas de tiza: «Trampas a la izquierda. Si veis luz verde, corred». Al lado, un saco con pan.",
            opciones: [
              { txt: "Seguir la tiza", stat: null, ok: { t: "Ni una trampa. Y el pan aún está tierno.", fx: { comida: 2, xp: 4 } } },
              { txt: "Dejarle una respuesta", stat: "elo", cd: 10,
                ok: { t: "Escribís un chiste malo bajo su flecha. Bajáis de buen humor.", fx: { xp: 3, bendicion: 1 } },
                ko: { t: "No se os ocurre nada gracioso. Seguís bajando.", fx: { xp: 2 } } }] },
          { requiere: "rencor",
            texto: "En la entrada de la cripta, un hilo tenso y un cartel con letra torcida: «Por los sacos, ladrones». La Compañía baja delante.",
            opciones: [
              { txt: "Desmontar la trampa", stat: "raz", cd: 12,
                ok: { t: "Era una ballesta cargada. Os quedáis sus virotes de plata.", fx: { oro: 6, xp: 4 } },
                ko: { t: "Clac. El virote os encuentra antes que vosotros a él.", fx: { alma: -4 } } },
              { txt: "Saltar el hilo", stat: "tem", cd: 13,
                ok: { t: "Pasáis limpios. Ulrika se llevará un disgusto.", fx: { xp: 3 } },
                ko: { t: "Lo rozáis con la bota. Os cae una red con piedras.", fx: { almaTodos: -2 } } }] }]
      },
      medio: {
        titulo: "La jaula de hueso",
        texto: "Una jaula de hueso cuelga sobre un pozo. Dentro, Ulrika Mediaoreja y lo que queda de su Compañía. «¡Sacadnos antes de que vuelva el liche!»",
        opciones: [
          { txt: "Romper la jaula", stat: "ani", cd: 13,
            ok: { t: "Los barrotes ceden. Ulrika os aprieta el brazo: «Os debo la vida».", fx: { xp: 4, moral: 1, marca: "deuda" } },
            ko: { t: "Cede tarde y os cuesta sangre, pero los sacáis a todos.", fx: { almaTodos: -3, xp: 2, marca: "deuda" } } },
          { txt: "Abrirla a cambio de su oro", stat: "elo", cd: 12,
            ok: { t: "Paga hasta la última moneda y se marcha. No os debe nada.", fx: { oro: 18, xp: 2 } },
            ko: { t: "No le queda oro. La dejáis colgada mientras sube una luz verde.", fx: { moral: -1, marca: "jaula" } } },
          { txt: "Quedarse sus mochilas", stat: null,
            ok: { t: "Sus mochilas estaban en el suelo. A vuestra espalda, una luz verde llena el pozo.", fx: { oro: 10, comida: 1, moral: -1, marca: "jaula" } } }],
        variantes: [
          { requiere: "aceite", texto: "Las flechas de tiza acaban en una jaula de hueso sobre un pozo. Dentro, Ulrika y los suyos: «¡Amigos! ¡Sacadnos antes de que vuelva!»" },
          { requiere: "rencor", texto: "Una jaula de hueso cuelga sobre un pozo. Dentro, Ulrika, la que juró vengarse por sus sacos. «Sacadnos… Os lo suplico.»" }]
      },
      antesJefe: {
        titulo: "La cría del dragón", pnj: "forastero",
        texto: "Ante la sala del trono os espera una figura encapuchada: Ascua, la guía que rechazasteis. «Malakar esconde su filacteria en un cáliz de hueso.»",
        opciones: [romperFilacteria(),
          { txt: "Preguntarle cómo lo sabe", stat: "tem", cd: 13,
            ok: { t: "«Me lo contó mi padre.» Se muerde la lengua. Sus ojos brillan, dorados y rasgados.", fx: { xp: 5, marca: "ojos" } },
            ko: { t: "«Lo sé y basta.» Se funde con las sombras de las tumbas.", fx: { xp: 1 } } }],
        variantes: [
          { requiere: "ascua",
            texto: "La voz de Malakar retumba en la cripta: «La cría de Ignárax me trae la cena». Ascua palidece y os susurra dónde esconde su filacteria.",
            opciones: [romperFilacteria(),
              { txt: "Preguntarle qué es eso de «cría»", stat: "tem", cd: 12,
                ok: { t: "Se baja la capucha: ojos de oro, pupila rasgada. «Luego. Primero el liche.»", fx: { xp: 5, marca: "ojos" } },
                ko: { t: "«Los liches deliran.» No la creéis del todo.", fx: { xp: 2 } } }] }]
      }
    },

    /* Acto III · El Castillo: el giro. Ascua es la hija de Ignárax y Varkhul quiere venderla. */
    {
      intro: {
        titulo: "El retrato de la galería", pnj: "forastero",
        texto: "En la galería cuelga un retrato centenario: un señor de ojos de fuego y una niña encapuchada. «Ignárax y su hija, Ascua». Ascua, a vuestra espalda, calla.",
        opciones: [exigirVerdad(12), ...retratoResto()],
        variantes: [
          { requiere: "ojos",
            texto: "Ya visteis sus ojos de oro. El retrato de la galería lo confirma: un señor de ojos de fuego y una niña. «Ignárax y su hija, Ascua».",
            opciones: [exigirVerdad(9), ...retratoResto()] },
          { requiere: "reverencia",
            texto: "Ahora entendéis por qué los sectarios se arrodillaron en el puente. En la galería, un retrato: «Ignárax y su hija, Ascua». Ella baja la mirada." }]
      },
      medio: {
        titulo: "La cena de Varkhul",
        texto: "Varkhul os invita a cenar antes de mataros. Velas negras, copas de cristal y un vino demasiado espeso. «Sería de mala educación negarse.»",
        opciones: [
          { txt: "Beber por cortesía", stat: "ani", cd: 13,
            ok: { t: "Aguantáis el trago y escucháis: el vampiro teme a la plata más que al sol.", fx: { xp: 4, bendicion: 1 } },
            ko: { t: "El vino era sangre. Os pasáis la noche vomitando.", fx: { almaTodos: -3 } } },
          { txt: "Echar plata en su copa", stat: "raz", cd: 14,
            ok: { t: "Varkhul bebe vuestro polvo de plata. Tose y sonríe… pero le arde.", fx: { xp: 5, marca: "plata" } },
            ko: { t: "Os pilla. «Qué invitados tan groseros.» Os araña al pasar.", fx: { alma: -3 } } },
          { txt: "Rechazar la invitación", stat: null,
            ok: { t: "Os vais a la cama sin cenar. Un criado os deja pan, al menos.", fx: { comida: 1, xp: 1 } } }],
        variantes: [
          { requiere: "jaula",
            texto: "La criada que os sirve el vino es Ulrika Mediaoreja, pálida y con colmillos. Malakar se la vendió a Varkhul. «Huid», susurra.",
            opciones: [
              { txt: "Liberarla con luz sagrada", stat: "tem", cd: 13,
                ok: { t: "La luz le quema el mordisco. Llora, libre: «Os debo dos vidas».", fx: { xp: 6, moral: 1, marca: "deuda" } },
                ko: { t: "Ulrika chilla y huye a las sombras, junto a su amo.", fx: { almaTodos: -2, marca: "sierva" } } },
              { txt: "Darle descanso", stat: null,
                ok: { t: "Le dais una muerte limpia. Su último aliento: «Gracias».", fx: { xp: 4, quita: "rencor" } } },
              { txt: "Fingir que no la conocéis", stat: null,
                ok: { t: "Cenáis en silencio. Ella os mira toda la noche, cada vez con más hambre.", fx: { xp: 1, marca: "sierva" } } }] },
          { requiere: "deuda",
            texto: "Ulrika se ha colado en las cocinas del castillo. «Os debía una: he echado plata en el vino de Varkhul. Brindad, pero no bebáis.»",
            opciones: [
              { txt: "Brindar sin beber", stat: null,
                ok: { t: "Varkhul apura su copa de un trago. Tose. Algo le arde por dentro.", fx: { xp: 4, marca: "plata" } } },
              { txt: "Pedirle que huya", stat: null,
                ok: { t: "«Nos veremos en el volcán.» Os deja provisiones antes de irse.", fx: { comida: 2, pocion: 1, xp: 2 } } }] }]
      },
      antesJefe: {
        titulo: "El precio del paso", pnj: "forastero",
        texto: "Varkhul os espera en lo alto de la escalera: «Entregadme a la hija del dragón y os abro el paso al Pico. Ignárax paga bien por ella.»",
        opciones: precioPaso(14),
        variantes: [
          { requiere: "verdad",
            texto: "Varkhul ríe en la escalera: «¿Os contó la verdad? Entonces sabéis lo que vale. Dádmela y os abro el paso». Ascua ni pestañea.",
            opciones: precioPaso(11) },
          { requiere: "recelo",
            texto: "Varkhul, en lo alto de la escalera: «Esa cría os ha mentido desde Villabruma. Entregádmela y os abro el paso». Ascua no se defiende.",
            opciones: precioPaso(16) }]
      }
    },

    /* Acto IV · El Volcán: primera recompensa. Aliados, enemigos y una hija frente a su padre. */
    {
      intro: {
        titulo: "Los Hijos de la Ceniza",
        texto: "Los Hijos de la Ceniza vigilan la boca de la mina. Su sacerdotisa, Madre Hollín, lleva un ojo cerrado pintado en la frente y predica a gritos.",
        opciones: [
          { txt: "Abrirse paso a la fuerza", stat: "ani", cd: 13,
            ok: { t: "Los sectarios se dispersan como ceniza al viento. Dejan oro atrás.", fx: { oro: 12, xp: 5 } },
            ko: { t: "Son muchos y pelean como fanáticos.", fx: { almaTodos: -3, xp: 2 } } },
          { txt: "Colarse por un túnel", stat: "tem", cd: 12,
            ok: { t: "Pasáis bajo sus pies. En el túnel hay barricas de cecina enana.", fx: { comida: 2, xp: 4 } },
            ko: { t: "El túnel se derrumba a medias sobre vosotros.", fx: { alma: -3 } } }],
        variantes: [
          { requiere: "medallon",
            texto: "Con el medallón del ojo al cuello, los Hijos de la Ceniza os toman por hermanos. Madre Hollín os invita a su rito: «El Ojo se abrirá pronto».",
            opciones: [
              { txt: "Sabotear el rito", stat: "raz", cd: 12,
                ok: { t: "Cambiáis su incienso por azufre. Madre Hollín tose hasta quedarse sin voz.", fx: { xp: 6, marca: "rito" } },
                ko: { t: "Os pillan con las manos en el incienso. Salís a golpes.", fx: { almaTodos: -3, xp: 2 } } },
              { txt: "Saquear sus ofrendas", stat: null,
                ok: { t: "Mientras rezan, vaciáis el cepillo. El oro de un fanático pesa igual.", fx: { oro: 20, moral: -1 } } },
              { txt: "Escuchar el sermón", stat: "tem", cd: 12,
                ok: { t: "«El dragón es el tapón. Cuando caiga, el Ojo despierta.» Escalofríos.", fx: { xp: 5, marca: "profecia" } },
                ko: { t: "Os quedáis dormidos. Por suerte, nadie lo nota.", fx: { xp: 1 } } }] },
          { requiere: "moneda",
            texto: "Madre Hollín ve brillar la moneda negra en vuestra bolsa y sonríe: «El Ojo ya os ha pagado. Pasad, hermanos».",
            opciones: [
              { txt: "Pasar sin rechistar", stat: null,
                ok: { t: "Os abren paso entre reverencias. Uno os regala pan de ofrenda.", fx: { xp: 3, comida: 1 } } },
              { txt: "Tirarle la moneda a la cara", stat: "ani", cd: 12,
                ok: { t: "La moneda le quema la frente. Los sectarios huyen chillando.", fx: { xp: 6, moral: 1, quita: "moneda" } },
                ko: { t: "La atrapa al vuelo. «Gracias.» Os echan a pedradas.", fx: { almaTodos: -3, quita: "moneda" } } }] }]
      },
      medio: {
        titulo: "Viejos conocidos",
        texto: "Encontráis el campamento de la Compañía del Colmillo abandonado y cubierto de ceniza. Ni rastro de Ulrika, pero sus cosas siguen ahí.",
        opciones: [
          { txt: "Registrar el campamento", stat: null,
            ok: { t: "Cecina, una poción y una nota a medias: «Si leéis esto…».", fx: { comida: 2, pocion: 1 } } },
          { txt: "Enterrar sus cosas", stat: null,
            ok: { t: "Levantáis un túmulo de piedras. Valdur premia a quien honra a los caídos.", fx: { xp: 4, moral: 1, bendicion: 1 } } }],
        variantes: [
          { requiere: "deuda",
            texto: "Ulrika Mediaoreja os espera en la ladera con lo que queda de su Compañía. «Os debo la vida. Contad con nuestras espadas contra el dragón.»",
            opciones: [
              { txt: "Aceptar sus espadas", stat: null,
                ok: { t: "«¡Por mi oreja!», grita la Compañía. Subiréis juntos.", fx: { xp: 3, marca: "compania" } } },
              { txt: "Que vuelvan a casa", stat: null,
                ok: { t: "«Alguien tiene que contarlo.» Os dejan todas sus provisiones.", fx: { comida: 3, pocion: 2, moral: 1 } } }] },
          { requiere: "sierva",
            texto: "Muerto su amo, la sierva de Varkhul vaga por las minas, famélica. Es Ulrika. Os reconoce y os enseña los colmillos.",
            opciones: [
              { txt: "Darle descanso", stat: "ani", cd: 12,
                ok: { t: "Cae sin un grito. Por fin descansa.", fx: { xp: 5 } },
                ko: { t: "Os muerde antes de caer.", fx: { almaTodos: -3, xp: 3 } } },
              { txt: "Llevarla a la luz del alba", stat: "tem", cd: 13,
                ok: { t: "El sol del pico la quema y la libera. Muere sonriendo: «Gracias».", fx: { xp: 7, moral: 1, bendicion: 1 } },
                ko: { t: "Se os escapa hacia la oscuridad de las minas.", fx: { xp: 2 } } }] },
          { requiere: "rencor",
            texto: "Ulrika os ha seguido hasta el volcán. Grita hacia la cumbre: «¡Ignárax! ¡Vienen a por tu oro!». Y se ríe.",
            opciones: [
              { txt: "Hacerla callar", stat: "ani", cd: 13,
                ok: { t: "La derribáis antes del segundo grito. Se va cojeando y maldiciendo.", fx: { xp: 4 } },
                ko: { t: "Su grito retumba en todo el pico. Caen rocas y kobolds.", fx: { almaTodos: -3 } } },
              { txt: "Devolverle lo robado", stat: null,
                ok: { t: "Lo cuenta dos veces. «En paz, ladrones.» Y se marcha.", fx: { oro: -15, xp: 3, moral: 1, quita: "rencor" } } }] }]
      },
      antesJefe: {
        titulo: "Padre e hija", pnj: "forastero",
        texto: "Ante la guarida, Ascua os corta el paso sin capucha. «Algo le habla a mi padre desde abajo. Dejadme hablar con él antes de que lo matéis.»",
        opciones: [
          { txt: "Dejarla ir delante", stat: "tem", cd: 13,
            ok: { t: "Le habla en dracónico. Ignárax duda, y Ascua se queda a vuestro lado.", fx: { xp: 5, marca: "hija" } },
            ko: { t: "Ignárax la aparta de un zarpazo. Ascua cae malherida entre el oro.", fx: { xp: 2 } } },
          { txt: "Apartarla de un empujón", stat: "ani", cd: 12,
            ok: { t: "Cae sobre el oro. «Lo lamentaréis abajo», susurra.", fx: { xp: 3 } },
            ko: { t: "Ni se mueve. Os mira con lástima y se aparta sola.", fx: { alma: -2 } } }],
        variantes: [
          { requiere: "traicion",
            texto: "Ascua está junto a su padre, libre de la plata de Varkhul. «Me vendisteis por un puñado de oro. Él, al menos, es mi familia.»",
            opciones: [
              { txt: "Pedirle perdón", stat: "elo", cd: 15,
                ok: { t: "Duda. Baja la cabeza. «No lucharé contra vosotros. Ni por vosotros.»", fx: { xp: 6, quita: "traicion" } },
                ko: { t: "«Tarde.» Su fuego se une al de su padre.", fx: { almaTodos: -2 } } },
              { txt: "Desenvainar sin más", stat: null,
                ok: { t: "Dos dragones contra vosotros. Que los dioses os oigan.", fx: { xp: 3, bendicion: 1 } } }] },
          padreHija("lealtad"),
          padreHija("llamarada")]
      }
    },

    /* Acto V · El Abismo: el verdadero amo de la secta y el último fuego de Ascua. */
    {
      intro: {
        titulo: "La grieta bajo el oro",
        texto: "Bajo el tesoro de Ignárax, la grieta baja hasta un cielo negro sin estrellas. Alguien ha clavado cuerdas: los Hijos de la Ceniza bajaron antes.",
        opciones: [
          { txt: "Bajar por sus cuerdas", stat: "tem", cd: 12,
            ok: { t: "Bajáis sin un tropiezo. En una cornisa hay víveres de los sectarios.", fx: { comida: 2, xp: 5 } },
            ko: { t: "Una cuerda estaba cortada. A propósito.", fx: { almaTodos: -3, xp: 2 } } },
          { txt: "Saltar a la oscuridad", stat: null,
            ok: { t: "Caéis una eternidad. El golpe duele, pero el aire os llena de magia fría.", fx: { almaTodos: -2, xp: 4, pm: 3 } } }],
        variantes: [
          { requiere: "hija",
            texto: "Ascua despliega unas alas rojas que nunca le habíais visto. «Agarraos. Ahí abajo está lo que envenenó a mi padre.»",
            opciones: [
              { txt: "Volar con ella", stat: null,
                ok: { t: "Planeáis entre estrellas muertas. Su calor os cierra las heridas.", fx: { curaPct: 0.3, xp: 4 } } },
              { txt: "Preguntarle por su padre", stat: "elo", cd: 11,
                ok: { t: "«Antes del sueño, me enseñaba el nombre de cada estrella.» Vuela más rápido.", fx: { xp: 6, bendicion: 1 } },
                ko: { t: "No contesta. Solo bate las alas, más fuerte.", fx: { xp: 3 } } }] },
          { requiere: "compania",
            texto: "Ulrika ata la última cuerda al borde de la grieta. «Hasta aquí llega la Compañía. Alguien tiene que volver para contarlo.»",
            opciones: [
              { txt: "Abrazarla y bajar", stat: null,
                ok: { t: "Os da sus últimas provisiones. «Si no volvéis, os haré una canción.»", fx: { comida: 3, pocion: 1, xp: 3 } } },
              { txt: "Pedirle que avise a Villabruma", stat: null,
                ok: { t: "Asiente y sube a la carrera. Villabruma sabrá lo que hicisteis.", fx: { xp: 5, moral: 1, bendicion: 1 } } }] }]
      },
      medio: {
        titulo: "El canto de Madre Hollín",
        texto: "Madre Hollín y los Hijos de la Ceniza cantan ante un ojo cerrado del tamaño de una luna. «Gracias por matar al dragón. Él era el sello.»",
        opciones: cantoHollin(14, 14),
        variantes: [
          { requiere: "rito",
            texto: "Madre Hollín intenta cantar ante un ojo cerrado del tamaño de una luna, pero el azufre de la mina le dejó la voz rota. Solo tose.",
            opciones: cantoHollin(10, 12) },
          { requiere: "profecia",
            texto: "«Cuando el dragón caiga, el Ojo se abrirá.» Ahora lo entendéis. Ante un ojo enorme, Madre Hollín os da las gracias por cumplirlo.",
            opciones: cantoHollin(14, 11) }]
      },
      antesJefe: {
        titulo: "La última ascua",
        texto: "El Ojo empieza a abrirse. Ya no hay guías ni aliados: solo vosotros, vuestras heridas y un hambre más vieja que los dioses.",
        opciones: [
          { txt: "Rezar a Solara", stat: "tem", cd: 13,
            ok: { t: "Una chispa de alba os responde, incluso aquí abajo.", fx: { bendicion: 2, xp: 5 } },
            ko: { t: "Solo responde el eco.", fx: { xp: 2 } } },
          { txt: "Gritar vuestros nombres", stat: "elo", cd: 12,
            ok: { t: "El eco os los devuelve con fuerza. Seguís siendo vosotros.", fx: { almaTodos: 4, xp: 5 } },
            ko: { t: "El vacío se traga vuestros nombres. Os cuesta recordarlos.", fx: { almaTodos: -2, xp: 2 } } },
          { txt: "Comer algo antes del final", stat: null,
            ok: { t: "Pan duro y queso. Sabe a Villabruma.", fx: { comida: -1, curaPct: 0.4 } } }],
        variantes: [
          { requiere: "hija",
            texto: "Ascua se detiene ante el Ojo. «El fuego de dragón no nace de ninguna estrella: no puede comérselo. Dejad que arda dentro de él.»",
            opciones: [
              { txt: "Aceptar su sacrificio", stat: null,
                ok: { t: "Ascua se vuelve una llama blanca. «Contadlo en Villabruma.»", fx: { xp: 5, marca: "sacrificio" } } },
              { txt: "Luchar juntos, sin sacrificios", stat: "elo", cd: 12,
                ok: { t: "«Juntos, entonces. Hasta el final.» Su calor dorado os cierra las heridas.", fx: { curaPct: 0.5, bendicion: 1, xp: 6, moral: 1 } },
                ko: { t: "No os escucha. «Contadlo en Villabruma.» Y vuela hacia el Ojo.", fx: { xp: 4, marca: "sacrificio" } } }] },
          { requiere: "traicion",
            texto: "Ascua flota entre las sombras con las alas rotas. «Mi padre ha muerto. El Ojo me juró que volvería. ¿También me mintió?»",
            opciones: [
              { txt: "Decirle la verdad", stat: "elo", cd: 14,
                ok: { t: "«Lo sabía.» Se lanza contra el Ojo y arde como una estrella nueva.", fx: { xp: 8, moral: 1, marca: "sacrificio" } },
                ko: { t: "No os cree. Se hunde en la oscuridad sin decir nada.", fx: { xp: 2 } } },
              { txt: "Dejarla en la oscuridad", stat: null,
                ok: { t: "No miráis atrás. Algo en vosotros se apaga un poco.", fx: { xp: 2, moral: -1 } } }] }]
      }
    }
  ];

  /* ---------- Consecuencias en los combates de jefe ---------- */
  D.AYUDAS_JEFE = {
    aceite: { acto: 0, texto: "¡El aceite de Ulrika! El trol arde como una antorcha.", efecto: "dano", valor: 8 },
    enfurecido: { acto: 0, texto: "El trol os esperaba con hambre y rabia: golpea con más fuerza.", efecto: "fuerte", valor: 2 },
    filacteria: { acto: 1, texto: "Sin su filacteria, Malakar tiembla: sus golpes pierden fuerza.", efecto: "debilita", valor: 3 },
    jaula: { acto: 1, texto: "Malakar ha bebido la vida de la Compañía del Colmillo. Llega rebosante.", efecto: "cura", valor: 8 },
    plata: { acto: 2, texto: "La plata del vino le quema por dentro: Varkhul recibe más daño.", efecto: "maldice", valor: 99 },
    llamarada: { acto: 2, texto: "Varkhul aún humea por el fuego de Ascua.", efecto: "dano", valor: 10 },
    hija: { acto: 3, texto: "Ascua se lanza al cuello de su padre: Ignárax pierde el turno.", efecto: "aturde", valor: 1 },
    compania: { acto: 3, texto: "«¡Por mi oreja!» La Compañía del Colmillo carga contra Ignárax.", efecto: "dano", valor: 12 },
    traicion: { acto: 3, texto: "Ascua escupe fuego junto a su padre: Ignárax ataca con más rabia.", efecto: "fuerte", valor: 2 },
    sacrificio: { acto: 4, texto: "Ascua arde dentro del Ojo como una estrella nueva. Nhazgul aúlla.", efecto: "dano", valor: 15 }
  };

  /* ---------- Sucesos de camino entre casillas del mapa ---------- */
  D.VIAJE = [
    { id: "v_moras", actos: [0], titulo: "Zarzas con moras",
      texto: "Las zarzas del camino están negras de moras maduras. Pinchan, pero merecen la pena.",
      opciones: [{ txt: "Seguir", stat: null, ok: { t: "Llenáis los bolsillos y la boca. Manos moradas todo el día.", fx: { comida: 2 } } }] },
    { id: "v_manantial", actos: [0, 1], titulo: "Un manantial azul",
      texto: "Un hilo de agua azulada brota de una roca y zumba bajito, como una colmena. Huele a tormenta.",
      opciones: [
        { txt: "Beber", stat: null, ok: { t: "Un cosquilleo os sube hasta las orejas. La magia vuelve a vosotros.", fx: { pm: 4 } } },
        { txt: "Estudiar la roca", stat: "raz", cd: 12,
          ok: { t: "Es una piedra rúnica enterrada. Aprendéis algo y luego bebéis.", fx: { pm: 3, xp: 3 } },
          ko: { t: "La roca os da un calambre. Bebéis igual, con el pelo de punta.", fx: { pm: 2, alma: -1 } } }] },
    { id: "v_emboscada", actos: [0, 2], titulo: "Silencio en el camino",
      texto: "Ramas rotas, huellas frescas y ni un pájaro. Alguien os espera más adelante, agazapado.",
      opciones: [
        { txt: "Dar un rodeo", stat: "tem", cd: 12,
          ok: { t: "Los veis antes que ellos a vosotros. Pasáis de largo.", fx: { xp: 3 } },
          ko: { t: "El rodeo acaba justo en su campamento.", fx: { almaTodos: -2, xp: 1 } } },
        { txt: "Atacar primero", stat: "ani", cd: 13,
          ok: { t: "Salen corriendo y se dejan la bolsa.", fx: { oro: 10, xp: 3 } },
          ko: { t: "Eran más de los que parecía.", fx: { almaTodos: -3, xp: 1 } } },
        { txt: "Seguir en guardia", stat: null, ok: { t: "Avanzáis con la mano en la empuñadura. Nadie se atreve.", fx: { xp: 1 } } }] },
    { id: "v_buhonero", actos: [0, 1, 2], titulo: "Un buhonero con mula",
      texto: "Un buhonero tira de una mula cargada de quesos y hogazas. «¡Comida de verdad! Seis monedas el lote.»",
      opciones: [
        { txt: "Comprar un lote", stat: null, ok: { t: "Queso curado y pan de pueblo. Huele a casa.", fx: { oro: -6, comida: 3 } } },
        { txt: "Regatear", stat: "elo", cd: 12,
          ok: { t: "Os lo deja a mitad de precio y encima os cuenta un chiste.", fx: { oro: -3, comida: 3 } },
          ko: { t: "Se ofende y os cobra de más. Ya no hay vuelta atrás.", fx: { oro: -9, comida: 3 } } },
        { txt: "Seguir", stat: null, ok: { t: "La mula os mira con pena mientras os alejáis.", fx: {} } }] },
    { id: "v_gato", actos: [0, 1, 2], titulo: "Un gato que os sigue",
      texto: "Un gato negro y flaco lleva una legua siguiéndoos con una moneda en la boca. Cuando paráis, mira fijamente vuestras alforjas.",
      opciones: [
        { txt: "Darle cecina", stat: null, ok: { t: "Se la zampa, se os enrosca en las botas y ya no se va. Es vuestro.", fx: { comida: -1, mascota: "gato" } } },
        { txt: "Espantarlo", stat: null, ok: { t: "Bufa ofendido y se esfuma entre la maleza.", fx: {} } }] },
    { id: "v_babosa", actos: [1], titulo: "Algo se come la cena",
      texto: "Al abrir el saco, una babosa luminosa del tamaño de un puño se ha comido media ración. Os mira, feliz y pegajosa.",
      opciones: [
        { txt: "Adoptarla", stat: null, ok: { t: "Brilla más fuerte. Ahora tenéis un farol con hambre.", fx: { comida: -1, mascota: "babosa" } } },
        { txt: "Echarla del saco", stat: null, ok: { t: "Se va dejando un rastro brillante. La ración ya no tiene arreglo.", fx: { comida: -1 } } }] },
    { id: "v_setas", actos: [0, 1], titulo: "Setas que brillan",
      texto: "Un corro de setas azules brilla en la penumbra. Dicen que los magos las mastican para recuperar fuerzas.",
      opciones: [
        { txt: "Probar una", stat: "tem", cd: 12,
          ok: { t: "Saben a tierra y a relámpago. La magia os chisporrotea en los dedos.", fx: { pm: 5 } },
          ko: { t: "Eran de las otras. Veis colores durante una hora.", fx: { almaTodos: -2 } } },
        { txt: "Guardarlas para la cena", stat: null, ok: { t: "Cocinadas pierden la magia, pero llenan.", fx: { comida: 1 } } }] },
    { id: "v_trilero", actos: [0, 1, 2, 3], titulo: "Tres cubiletes",
      texto: "Un trilero mueve tres cubiletes sobre un tonel. «¿Dónde está la bolita? Diez monedas, y os pago el doble.»",
      opciones: [
        { txt: "Apostar", stat: "tem", cd: 14,
          ok: { t: "¡Ahí! Paga con una mueca y recoge el tenderete.", fx: { oro: 10 } },
          ko: { t: "La bolita no estaba en ninguno. Nunca lo está.", fx: { oro: -10 } } },
        { txt: "Destapar su truco", stat: "raz", cd: 12,
          ok: { t: "Le sacáis la bolita de la manga. Os paga para que calléis.", fx: { oro: 6, xp: 3 } },
          ko: { t: "No veis el truco. Él os mira con desprecio.", fx: { xp: 1 } } },
        { txt: "Seguir", stat: null, ok: { t: "Los listos no juegan contra trileros.", fx: {} } }] },
    { id: "v_pozo", actos: [1, 2], titulo: "Un pozo de los deseos",
      texto: "Un pozo seco con monedas en el fondo. Una inscripción reza: «Pide con fe y paga con plata».",
      opciones: [
        { txt: "Echar una moneda y pedir", stat: "tem", cd: 12,
          ok: { t: "Una brisa cálida sube del pozo. Alguien os ha escuchado.", fx: { oro: -2, bendicion: 1 } },
          ko: { t: "Plinc. Nada. Ni siquiera eco.", fx: { oro: -2 } } },
        { txt: "Pescar las monedas", stat: "ani", cd: 13,
          ok: { t: "Subís un puñado de monedas verdes. Os sentís un poco ladrones.", fx: { oro: 8, moral: -1 } },
          ko: { t: "Os escurrís por la pared y os dais un buen golpe.", fx: { alma: -3 } } }] },
    { id: "v_ratas", actos: [1, 2], titulo: "Visita nocturna",
      texto: "Por la noche oís roer. Al despertar, las ratas han hecho un agujero en las alforjas.",
      opciones: [{ txt: "Seguir", stat: null, ok: { t: "Perdéis parte de la comida. Las ratas, en cambio, han cenado bien.", fx: { comida: -2 } } }] },
    { id: "v_esqueleto", actos: [1, 2, 3], titulo: "Un viajero que no llegó",
      texto: "Un esqueleto con mochila descansa contra la pared. La comida está podrida; el zurrón, no.",
      opciones: [{ txt: "Seguir", stat: null, ok: { t: "Dentro hay una poción intacta. Gracias, amigo.", fx: { pocion: 1 } } }] },
    { id: "v_cuervos", actos: [0, 2], titulo: "Cuervos en desbandada",
      texto: "Una bandada de cuervos alza el vuelo de golpe, más adelante. Algo los ha asustado.",
      opciones: [
        { txt: "Esperar escondidos", stat: "tem", cd: 12,
          ok: { t: "Una patrulla pasa sin veros. Respiráis cuando se pierde de vista.", fx: { xp: 3 } },
          ko: { t: "Os encuentran agazapados. Pelea sucia entre matorrales.", fx: { almaTodos: -2 } } },
        { txt: "Seguir", stat: null, ok: { t: "Lo que fuera ya se ha ido. Solo queda un nido con huevos.", fx: { comida: 1 } } }] },
    { id: "v_peregrinos", actos: [0, 1], titulo: "Peregrinos del alba",
      texto: "Unos peregrinos de Solara comparten su fuego y su pan. Os piden una limosna para el templo de Villabruma.",
      opciones: [
        { txt: "Dar una limosna", stat: null, ok: { t: "Os bendicen con la señal del alba.", fx: { oro: -5, bendicion: 1, moral: 1 } } },
        { txt: "Aceptar solo el pan", stat: null, ok: { t: "Pan bendito, un poco duro. Os sabe a gloria.", fx: { comida: 1 } } }] },
    { id: "v_pila", actos: [2], titulo: "Agua bendita olvidada",
      texto: "En la capilla del castillo, una pila conserva agua bendita. Ningún vampiro se ha atrevido a vaciarla.",
      opciones: [
        { txt: "Beber", stat: null, ok: { t: "Agua fresca con sabor a alba.", fx: { pm: 3, almaTodos: 2 } } },
        { txt: "Llenar un frasco", stat: "tem", cd: 11,
          ok: { t: "El frasco brilla en la oscuridad. Bendición embotellada.", fx: { bendicion: 1 } },
          ko: { t: "El frasco se rompe al tocar el agua.", fx: { xp: 1 } } }] },
    { id: "v_aviso", actos: [2, 3, 4], titulo: "Un aviso garabateado",
      texto: "En la pared alguien ha rascado con prisa: «No durmáis aquí. Vienen de noche».",
      opciones: [
        { txt: "Hacer guardia por turnos", stat: "tem", cd: 12,
          ok: { t: "Los oís llegar y os vais a tiempo. Ni un rasguño.", fx: { xp: 4 } },
          ko: { t: "Alguien se duerme en su turno. Mordiscos al alba.", fx: { almaTodos: -2, comida: -1 } } },
        { txt: "Seguir sin parar", stat: null, ok: { t: "Caminar de noche agota, pero seguís vivos.", fx: { almaTodos: -1 } } }] },
    { id: "v_despensa", actos: [3], titulo: "Una despensa enana",
      texto: "Tras una puerta de hierro hay barricas de cecina enana, salada hace un siglo. Sigue comestible: los enanos son así.",
      opciones: [{ txt: "Seguir", stat: null, ok: { t: "Cargáis todo lo que podéis. Sabe a sal y a orgullo.", fx: { comida: 3 } } }] },
    { id: "v_ceniza", actos: [3], titulo: "Lluvia de ceniza",
      texto: "Del cielo cae ceniza caliente. Os cubrís con las capas y apretáis el paso.",
      opciones: [{ txt: "Seguir", stat: null, ok: { t: "Llegáis con las capas agujereadas y la garganta en carne viva.", fx: { almaTodos: -1 } } }] },
    { id: "v_kobold", actos: [3], titulo: "Un kobold con prisa",
      texto: "Un kobold diminuto tropieza con vosotros y se le cae un saco. «¡No es oro! Bueno, un poco.»",
      opciones: [
        { txt: "Dejarlo marchar", stat: null, ok: { t: "Se va corriendo. Os deja una moneda por las molestias.", fx: { oro: 2, moral: 1 } } },
        { txt: "Quedarse el saco", stat: null, ok: { t: "Monedas, tuercas y un queso. Más o menos un tesoro.", fx: { oro: 8, comida: 1, moral: -1 } } }] },
    { id: "v_cristales", actos: [3, 4], titulo: "Cristales que laten",
      texto: "Una veta de cristales violetas late en la roca como un corazón lento. El aire sabe a magia.",
      opciones: [
        { txt: "Absorber su energía", stat: null, ok: { t: "La magia os entra a borbotones. Los cristales se apagan.", fx: { pm: 5, almaTodos: -1 } } },
        { txt: "Arrancar uno para venderlo", stat: "ani", cd: 12,
          ok: { t: "Sale entero. Algún mago pagará bien por él.", fx: { oro: 12 } },
          ko: { t: "Estalla en esquirlas.", fx: { alma: -3 } } }] },
    { id: "v_estrella", actos: [4], titulo: "Una estrella apagada",
      texto: "Una estrella muerta flota a vuestro lado, fría como una piedra de río. Cuando la miráis, susurra.",
      opciones: [
        { txt: "Escuchar su susurro", stat: "tem", cd: 13,
          ok: { t: "Os cuenta un secreto antiguo. La magia os vuelve, limpia.", fx: { pm: 6, xp: 3 } },
          ko: { t: "Su voz es puro frío. Os hiela los huesos.", fx: { almaTodos: -3 } } },
        { txt: "Seguir", stat: null, ok: { t: "La dejáis atrás. Sigue susurrando a nadie.", fx: {} } }] },
    { id: "v_pan_planar", actos: [4], pnj: "planar", titulo: "Pan de otro plano",
      texto: "El Mercader de los Planos asoma de una grieta: «¿Hambre? Pan que no se pudre nunca. Diez monedas».",
      opciones: [
        { txt: "Comprar pan", stat: null, ok: { t: "No sabe a nada, pero llena muchísimo.", fx: { oro: -10, comida: 3 } } },
        { txt: "Comprar un vial de maná", stat: null, ok: { t: "Brilla como un relámpago embotellado. Os lo repartís.", fx: { oro: -8, pm: 5 } } },
        { txt: "Seguir", stat: null, ok: { t: "«Volveréis», dice. Siempre vuelven.", fx: {} } }] },
    { id: "v_eco", actos: [4], titulo: "Un eco con hambre",
      texto: "El vacío repite vuestros pasos con un segundo de retraso. Luego, con dos. Luego, sin vosotros.",
      opciones: [{ txt: "Seguir", stat: null, ok: { t: "Apretáis el paso hasta que el eco se cansa. Os ha robado el aliento.", fx: { almaTodos: -2, xp: 2 } } }] }
  ];

  /* ---------- Pistas en las cartas de camino (no nombran lo que hay) ---------- */
  D.PISTAS = {
    combate: ["Huellas recientes y ramas rotas", "Se oyen gruñidos tras el recodo", "Huele a sangre fresca",
      "Algo se mueve entre las sombras", "Un silencio demasiado espeso", "Armas oxidadas tiradas por el suelo"],
    elite: ["Marcas de garras enormes en la piedra", "Huesos roídos, apilados con cuidado", "Un rugido hace temblar el suelo",
      "Escudos abollados de quien pasó antes", "Ni los cuervos se acercan por aquí"],
    evento: ["Una voz pide ayuda a lo lejos", "Alguien dejó una señal en el camino", "Se oye una conversación en voz baja",
      "Una luz extraña parpadea más adelante", "Huellas que van y vienen, indecisas"],
    tesoro: ["Algo brilla entre el barro", "Un destello metálico al fondo", "Huele a polvo y a cerradura vieja",
      "Unas monedas sueltas marcan el camino", "Una losa suelta que suena hueca"],
    tienda: ["Huele a pan recién hecho y a especias", "Se oye un regateo animado", "El tintineo de muchas campanillas",
      "Un farol cuelga de un poste", "Rodadas de carro en la tierra"],
    hoguera: ["Un rincón tranquilo y resguardado", "Huele a leña seca", "El viento se calma más adelante",
      "Un refugio de piedra con techo", "Se oye agua correr, despacio"],
    altar: ["La piedra late como un corazón", "Velas negras consumidas hasta el final", "Las plantas se marchitan hacia allí",
      "Un murmullo que no es del viento", "Símbolos rascados en las rocas"],
    misterio: ["Una niebla que no deja ver nada", "El camino se tuerce y se pierde", "Ningún sonido llega de ahí",
      "Algo os observa, aunque no tiene ojos", "Las sombras no caen donde deberían"],
    jefe: ["Todos los caminos llevan hacia allí", "Algo terrible espera al final", "Las sombras se alargan en esa dirección",
      "Hasta el aire tiene miedo", "Allí acaba el camino, y algo lo sabe"],
    engano: ["Un sendero como cualquier otro", "Nada fuera de lo normal", "Huellas viejas, quizá de nadie",
      "El viento trae olores confusos", "Parece tranquilo. Demasiado, tal vez", "No se distingue bien desde aquí"]
  };

  /* ---------- Sucesos nuevos: mascotas y consecuencias de la historia ---------- */
  D.EVENTOS.push(
    /* Mascotas: el grupo lleva como mucho una; la nueva sustituye a la anterior. */
    { id: "cepo_lobezno", acto: 0, tipo: "prueba", titulo: "Un lobezno en el cepo",
      texto: "Un lobezno gris gime con la pata atrapada en un cepo. Su manada aúlla lejos, demasiado lejos para ayudarle.",
      opciones: [
        { txt: "Liberarlo y vendarle la pata", stat: "tem", cd: 11,
          ok: { t: "Os lame la mano y ya no se separa de vosotros. Tenéis lobo.", fx: { mascota: "lobezno", xp: 3, moral: 1 } },
          ko: { t: "Os muerde del susto, pero al calmarse os sigue cojeando.", fx: { alma: -2, mascota: "lobezno" } } },
        { txt: "Abrir el cepo y dejarlo ir", stat: null,
          ok: { t: "Corre hacia los aullidos. El bosque parece daros las gracias.", fx: { xp: 4, moral: 1 } } },
        { txt: "Venderlo a un peletero", stat: null,
          ok: { t: "Doce monedas para cada uno. Los aullidos os siguen toda la tarde.", fx: { oro: 12, moral: -1 } } }] },
    { id: "buho_zarzas", acto: 0, tipo: "prueba", titulo: "Un búho enredado",
      texto: "Un búho de ojos de ámbar se ha enredado en unas zarzas. Lleva una anilla de plata con un nombre grabado: «Sabio».",
      opciones: [
        { txt: "Desenredarlo", stat: "tem", cd: 12,
          ok: { t: "Se os posa en el hombro y ulula. Parece que os ha adoptado él a vosotros.", fx: { mascota: "buho", xp: 3 } },
          ko: { t: "Os picotea las manos, pero cuando por fin sale, se queda.", fx: { alma: -1, mascota: "buho" } } },
        { txt: "Quedarse la anilla", stat: null,
          ok: { t: "Plata buena. El búho se queda en las zarzas, mirándoos.", fx: { oro: 8, moral: -1 } } }] },
    { id: "babosa_tumba", acto: 1, tipo: "prueba", titulo: "Una babosa de tumba",
      texto: "Una babosa del tamaño de un gato brilla en la oscuridad mientras se come el moho de una tumba. Os mira con cariño.",
      opciones: [
        { txt: "Darle un trozo de pan", stat: null,
          ok: { t: "Se le enciende la panza de felicidad. Ya es vuestra, os guste o no.", fx: { comida: -1, mascota: "babosa", xp: 2 } } },
        { txt: "Usar su baba como ungüento", stat: "tem", cd: 12,
          ok: { t: "La baba cierra los cortes. Da asco, pero funciona.", fx: { almaTodos: 3, xp: 2 } },
          ko: { t: "Pica muchísimo. La babosa se ofende y se va.", fx: { alma: -2 } } },
        { txt: "Pisarla", stat: null,
          ok: { t: "Plof. Vuestras botas no volverán a ser las mismas.", fx: { moral: -1 } } }] },
    { id: "gato_negro", acto: 2, tipo: "prueba", titulo: "Un gato negro en las almenas",
      texto: "Un gato negro y flaco maúlla en las almenas. Los criados dicen que da mala suerte… pero solo a los vampiros.",
      opciones: [
        { txt: "Darle de comer", stat: null,
          ok: { t: "Se come vuestra cena y se os sube al regazo. Ronronea como un brasero.", fx: { comida: -1, mascota: "gato", xp: 2 } } },
        { txt: "Seguirlo", stat: "tem", cd: 12,
          ok: { t: "Os lleva a una despensa olvidada. Por la noche, vuelve a buscaros.", fx: { comida: 2, mascota: "gato" } },
          ko: { t: "Lo perdéis entre las sombras del pasillo.", fx: { xp: 1 } } },
        { txt: "Espantarlo", stat: null,
          ok: { t: "Bufa y se va. Dicen que espantar a un gato negro trae desgracias.", fx: { almaTodos: -1 } } }] },
    { id: "huevo_brasas", acto: 3, tipo: "prueba", titulo: "Un huevo entre brasas",
      texto: "Un huevo rojo y escamoso late entre las brasas, a punto de romperse. Se oyen kobolds buscándolo con antorchas.",
      opciones: [
        { txt: "Incubarlo en la lava", stat: "tem", cd: 13,
          ok: { t: "Sale un dragoncito del tamaño de un gato. Estornuda chispas: sois su familia.", fx: { mascota: "dragoncito", xp: 4 } },
          ko: { t: "La cáscara os quema, pero el dragoncito sale igual y os sigue.", fx: { alma: -3, mascota: "dragoncito" } } },
        { txt: "Vendérselo a los kobolds", stat: "elo", cd: 12,
          ok: { t: "Pagan con todo lo que brilla. Algún día será otro Ignárax.", fx: { oro: 30, moral: -1 } },
          ko: { t: "Os pagan con tuercas y piedras pintadas.", fx: { oro: 6, moral: -1 } } },
        { txt: "Destruirlo", stat: "ani", cd: 12,
          ok: { t: "Ya no habrá otro dragón rojo en el Pico.", fx: { xp: 5 } },
          ko: { t: "La cáscara arde como el hierro al rojo.", fx: { alma: -3 } } }] },
    { id: "diablillo_jaula", acto: 3, tipo: "prueba", titulo: "Un diablillo enjaulado",
      texto: "Los kobolds han enjaulado a un diablillo escapado de la grieta. «¡Sacadme y os serviré! Palabra de diablillo… que algo vale.»",
      opciones: [
        { txt: "Firmar su contrato", stat: "raz", cd: 13,
          ok: { t: "Leéis la letra pequeña y la tacháis. Os sirve, fastidiado pero leal.", fx: { mascota: "diablillo", xp: 4 } },
          ko: { t: "Firmáis sin leer. Os sirve, pero cobra en sangre.", fx: { mascota: "diablillo", maxTodos: -1 } } },
        { txt: "Dejarlo encerrado", stat: null,
          ok: { t: "Os maldice en infernal hasta que lo perdéis de vista.", fx: { xp: 1 } } },
        { txt: "Devolverlo a la grieta", stat: "tem", cd: 12,
          ok: { t: "Lo arrojáis a la oscuridad. Algo allí abajo os lo agradece. Mal asunto.", fx: { xp: 3, pm: 3 } },
          ko: { t: "Se escapa antes y os quema la mano al huir.", fx: { alma: -2 } } }] },
    { id: "fuego_fatuo", acto: 4, tipo: "prueba", titulo: "Una lucecita azul",
      texto: "Una lucecita azul tirita entre estrellas apagadas. Las sombras la persiguen para comérsela.",
      opciones: [
        { txt: "Protegerla", stat: "ani", cd: 13,
          ok: { t: "Las sombras retroceden. La luz se os posa en la mano: ya no estáis solos.", fx: { mascota: "espiritu", xp: 6 } },
          ko: { t: "Os muerden, pero la salváis. Se queda con vosotros.", fx: { almaTodos: -3, mascota: "espiritu" } } },
        { txt: "Esconderla en un farol", stat: "tem", cd: 12,
          ok: { t: "Se acurruca dentro y os ilumina el camino. Su luz huele a primavera.", fx: { mascota: "espiritu", pm: 3, xp: 4 } },
          ko: { t: "Se asusta y se escapa hacia la oscuridad.", fx: { xp: 2 } } },
        { txt: "Absorber su luz", stat: null,
          ok: { t: "Os llena de energía. La lucecita se apaga sin hacer ruido.", fx: { pm: 6, curaPct: 0.3, moral: -1 } } }] },

    /* Consecuencias de la historia continuada. */
    { id: "ascua_estrellas", requiere: "ascua", actos: [0, 1], tipo: "prueba", pnj: "forastero", titulo: "Ascua cuenta estrellas",
      texto: "De noche, Ascua cuenta las estrellas en voz baja. «Faltan tres desde ayer», murmura sin apartar la vista.",
      opciones: [
        { txt: "Preguntarle por qué las cuenta", stat: "tem", cd: 12,
          ok: { t: "«Mi familia las vigila desde hace siglos.» Y se calla. Sus ojos brillan, dorados.", fx: { xp: 4, marca: "ojos" } },
          ko: { t: "«Manías de viajera.» Se da la vuelta y finge dormir.", fx: { xp: 1 } } },
        { txt: "Compartir la guardia con ella", stat: null,
          ok: { t: "Os cuenta historias de dragones hasta el alba. Descansáis tranquilos.", fx: { curaPct: 0.3, xp: 2 } } }] },
    { id: "colmillo_venganza", requiere: "rencor", actos: [1, 2], tipo: "prueba", titulo: "La firma del Colmillo",
      texto: "Al despertar, vuestras alforjas están abiertas. En el barro hay una huella de bota y un colmillo de lobo: la firma de Ulrika.",
      opciones: [
        { txt: "Perseguirlos", stat: "tem", cd: 13,
          ok: { t: "Los alcanzáis y recuperáis lo vuestro. Ulrika escupe al suelo.", fx: { comida: 2, oro: 5, xp: 3 } },
          ko: { t: "Se os escapan. Os han dejado sin cena.", fx: { comida: -2 } } },
        { txt: "Dejarles oro y una disculpa", stat: null,
          ok: { t: "Al día siguiente encontráis la nota respondida: «Aceptada. Por esta vez».", fx: { oro: -10, moral: 1, quita: "rencor" } } }] },
    { id: "medallon_ojo", requiere: "medallon", actos: [1, 2], tipo: "prueba", titulo: "El medallón se calienta",
      texto: "El medallón del ojo cerrado arde por la noche. En sueños, una voz os pide que lo abráis.",
      opciones: [
        { txt: "Tirarlo a un pozo", stat: null,
          ok: { t: "Cae sin hacer ruido. Esa noche dormís mejor que nunca.", fx: { xp: 3, almaTodos: 2, quita: "medallon" } } },
        { txt: "Abrir el ojo del medallón", stat: "tem", cd: 13,
          ok: { t: "Veis el Abismo un instante y volvéis con la mente afilada.", fx: { pm: 5, xp: 5 } },
          ko: { t: "Algo os mira desde dentro. Despertáis temblando.", fx: { almaTodos: -3 } } }] },
    { id: "profecia_sabio", requiere: "profecia", actos: [1, 2], tipo: "prueba", pnj: "fantasma", titulo: "Un sabio sin cuerpo",
      texto: "Un fantasma erudito os oye murmurar la frase del puente. «¿El Ojo? Los enanos lo sellaron bajo el Pico. Y el dragón duerme encima…»",
      opciones: [
        { txt: "Preguntarle cómo vencerlo", stat: "raz", cd: 12,
          ok: { t: "«Con una luz que no venga de ninguna estrella.» Lo apuntáis todo.", fx: { xp: 5, bendicion: 1 } },
          ko: { t: "Se desvanece a media frase. Los fantasmas son así.", fx: { xp: 1 } } },
        { txt: "Pedirle su bendición", stat: null,
          ok: { t: "Os toca la frente con un dedo helado. Os sentís más despiertos.", fx: { pm: 3, xp: 2 } } }] },
    { id: "escama_ascua", requiere: "lealtad", actos: [3], tipo: "prueba", pnj: "forastero", titulo: "Una escama caliente",
      texto: "Ascua se arranca una escama del brazo y os la tiende, aún humeante. «Para que el fuego de mi padre os respete.»",
      opciones: [
        { txt: "Aceptarla", stat: null,
          ok: { t: "La escama se funde con vuestro equipo y lo vuelve rojo y duro.", fx: { botin: true, xp: 3 } } },
        { txt: "Que se la quede", stat: null,
          ok: { t: "«Testarudos.» Pero sonríe por primera vez desde Villabruma.", fx: { xp: 5, moral: 1, almaTodos: 3 } } }] },
    { id: "cadenas_rotas", requiere: "traicion", actos: [3], tipo: "prueba", titulo: "Cadenas fundidas",
      texto: "En la mina encontráis cadenas de plata fundidas. En la roca, alguien ha grabado con una garra: «Un puñado de oro».",
      opciones: [
        { txt: "Seguir el rastro de ceniza", stat: "tem", cd: 13,
          ok: { t: "La encontráis dormida. Dejáis vuestro oro a su lado: no es perdón, pero es algo.", fx: { oro: -15, xp: 4, moral: 1, quita: "traicion" } },
          ko: { t: "El rastro se pierde junto a un río de lava.", fx: { xp: 1 } } },
        { txt: "Seguir adelante", stat: null,
          ok: { t: "Lo hecho, hecho está. Las cadenas se quedan atrás.", fx: { xp: 1 } } }] }
  );
})();
