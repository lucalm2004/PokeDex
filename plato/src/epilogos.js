/* Dados y Mazmorras · codas del final: qué fue de cada cual según lo que hicisteis.
   Se carga después de lugares.js y amplía el objeto global DATOS.

   CODAS = [{ requiere, falta, final, texto, generica }]
   · requiere: marca de S.memoria (o lista de marcas, todas necesarias).
   · falta: marca que NO debe estar (opcional).
   · final: "heroes" | "codicia" | null (sirve para ambos).
   · generica: true para las de relleno, sin requiere, cuando la partida deja pocas marcas.
   Ojo: muchas marcas se quitan al resolver su historieta; las que quedan al final son las que se
   llevaron puestas, así que estas codas cuentan lo que pasó después, no lo que ya se vio en partida. */
(() => {
  "use strict";

  DATOS.CODAS = [
    /* ---------- Bosque y camino ---------- */
    { requiere: "ciervo", final: null,
      texto: "En el bosque de Valdren aún se ve a veces un ciervo blanco. No se acerca a nadie, salvo a quien huele a vosotros." },
    { requiere: "furtivo", final: null,
      texto: "Las astas del ciervo blanco acabaron en el salón de un barón. Desde entonces, en esa casa no crece ni el moho." },
    { requiere: "sacrilegio", final: "heroes",
      texto: "En el altar del bosque apareció plata nueva. No la dejasteis vosotros. Solara toma nota de todo." },
    { requiere: "sacrilegio", final: "codicia",
      texto: "Levantasteis una capilla a Solara con oro de dragón. En diez años no ha entrado un rayo de sol por sus ventanas." },

    /* ---------- Brunilda, Thrain y Fizwick ---------- */
    { requiere: "mercader", final: "heroes",
      texto: "Brunilda abrió tienda en Villabruma. A vosotros os hace descuento; a los demás les cuenta cómo la salvasteis y les sube el precio." },
    { requiere: "enano", falta: "aliado", final: null,
      texto: "Thrain volvió a las minas y brinda por vosotros cada vez que encuentra una veta. Brinda mucho; encuentra poco." },
    { requiere: "aliado", final: null,
      texto: "Thrain colgó el hacha sobre la chimenea. Dice que la deuda está saldada. La pieza que os forjó opina que no." },
    { requiere: "gnomo", final: null,
      texto: "Fizwick patentó tres inventos con vuestro nombre. Dos explotaron. El tercero funciona, aunque nadie sabe para qué." },
    { requiere: "fiado_fizwick", final: null,
      texto: "En la libreta de Fizwick vuestra deuda sigue abierta. Los intereses ya tienen sus propios intereses, y un abogado." },

    /* ---------- Mazmorra, castillo y sus fantasmas ---------- */
    { requiere: "grimorio", final: null,
      texto: "El grimorio de Malakar no ha vuelto a hablar. Pero si lo dejáis cerca del fuego, pasa las páginas solo para no quemarse." },
    { requiere: "reina", final: null,
      texto: "La reina Aldara ya no llora en la torre. En las bodas de Villabruma siempre sobra una silla, y nadie se atreve a ocuparla." },
    { requiere: "aldeanos", final: "heroes",
      texto: "Los aldeanos que sacasteis del castillo cuentan la fuga cada invierno. Cada invierno el desagüe es más estrecho y vosotros más altos." },
    { requiere: "plata", final: null,
      texto: "Los bardos dicen que Varkhul murió de plata en el vino. Los bardos exageran, pero esta vez no mucho." },
    { requiere: "laud", final: null,
      texto: "El laúd del juglar sigue en vuestra mochila y la canción sigue a medias. En la capilla hundida, alguien espera y cada vez tiene menos paciencia." },
    { requiere: "llave_odo", final: null,
      texto: "La llave de Odo cuelga detrás de la barra del Grifo Tuerto. El cofre sigue en el castillo; el perdón ya llegó." },
    { requiere: "pip", falta: "pip_espia", final: null,
      texto: "Pip sigue en las cocinas del castillo, silbando. Los lobos han aprendido a venir cuando silba. Él aún no ha aprendido a callarse." },
    { requiere: "pip_espia", final: null,
      texto: "Pip lleva todavía la llave del mayordomo al cuello. Ya no abre nada, pero le recuerda que una vez lo pillaron y nadie le pegó." },

    /* ---------- Snig, el huevo y otras criaturas ---------- */
    { requiere: "snig_amigo", final: null,
      texto: "Snig reina sobre los kobolds con una corona de lata. Su única ley: «Los amigos de Snig no pagan». La cumple a medias." },
    { requiere: "snig", final: null,
      texto: "Nadie volvió a ver a Snig. En el campamento de Krug siguen desapareciendo gallinas, solo las que alguien mira mucho." },
    { requiere: "polluelo", final: null,
      texto: "En el bosque vive un oso-lechuza que deja medio esqueleto en la puerta de quien le cae bien. La vuestra está siempre llena." },
    { requiere: "farol_fuego", final: null,
      texto: "La llamita del río de lava vive ahora en vuestra linterna. Paga el alquiler en luz y se queja del frío." },

    /* ---------- Ascua ---------- */
    { requiere: ["ascua", "sacrificio"], final: null,
      texto: "En Villabruma cuentan lo de Ascua, como ella pidió. Cada vez que alguien lo cuenta, la chimenea del Grifo Tuerto arde más alto." },
    { requiere: "hija", falta: "sacrificio", final: "heroes",
      texto: "Ascua volvió al Pico Cenizo a velar las cenizas de su padre. Os escribe con letra quemada, siempre demasiado corta." },
    { requiere: "lealtad", falta: "sacrificio", final: null,
      texto: "Cada solsticio, Ascua os manda una escama caliente. Dice que es costumbre dracónica. Se la acaba de inventar." },
    { requiere: "traicion", final: null,
      texto: "Ascua no volvió a cruzarse en vuestro camino. Desde entonces, ningún herrero de Valdren os vende cadenas de plata." },
    { requiere: "recelo", falta: "hija", final: null,
      texto: "Ascua caminó siempre unos pasos detrás, hasta que un día dejó de caminar. Nunca supisteis qué no os quiso contar." },
    { requiere: "reverencia", final: null,
      texto: "Algunos Hijos de la Ceniza dejaron de adorar al dragón y empezaron a adorar a Ascua. Ella les pide, por favor, que paren." },

    /* ---------- Ulrika Mediaoreja ---------- */
    { requiere: ["deuda", "compania"], final: "heroes",
      texto: "La Compañía del Colmillo tiene canción propia sobre el dragón. Salís en la segunda estrofa; la primera es sobre la oreja de Ulrika." },
    { requiere: "deuda", falta: "compania", final: null,
      texto: "Ulrika rehízo su Compañía. En la oreja que le queda lleva un pendiente con vuestros nombres grabados, mal escritos." },
    { requiere: "rencor", final: null,
      texto: "Ulrika no os ha perdonado. De vez en cuando aparece un colmillo de lobo en vuestra puerta y falta algo en la despensa." },
    { requiere: "jaula", final: null,
      texto: "Nadie volvió a ver a Ulrika Mediaoreja. En el pozo del liche, dicen, una luz verde todavía pregunta por vosotros." },
    { requiere: "sierva", final: null,
      texto: "En el castillo de Varkhul sirve el vino una criada pálida con media oreja. A los viajeros que se os parecen les sirve más." },

    /* ---------- Hijos de la Ceniza, el Ojo y la moneda negra ---------- */
    { requiere: "tizon", final: null,
      texto: "Tizón llegó por fin a casa. Su madre le dio un tortazo y un plato de sopa, por ese orden." },
    { requiere: "tizon_aliado", final: null,
      texto: "Tizón sigue de vigía en el Pico Cenizo, con la capucha del revés para que sepáis que es él." },
    { requiere: "rito", final: null,
      texto: "Madre Hollín no recuperó la voz. Predica por señas, y sus fieles, por no ofender, fingen entenderla." },
    { requiere: "susurro", final: null,
      texto: "Nhazgul aprendió vuestros nombres bajo el oro del dragón. Al borde del sueño aún los pronuncia, mal y a propósito." },
    { requiere: "moneda", final: "heroes",
      texto: "Guardasteis la moneda negra en el fondo de un cofre. Algunas noches llama a la tapa con los nudillos." },
    { requiere: "moneda", final: "codicia",
      texto: "La moneda negra sigue en vuestra bolsa. Cada año pesa un poco más, y vuestro oro, un poco menos." },
    { requiere: "pagare", final: null,
      texto: "El pagaré del diablillo sigue vigente. Vuestro oro crece; vuestra sombra, curiosamente, encoge." },
    { requiere: "martillo_dorna", final: null,
      texto: "El martillo de Borgar sigue con vosotros. Dorna espera en la gran forja. Ninguno de los tres tiene prisa, salvo ella." },

    /* ---------- Genéricas, para partidas con pocas marcas ---------- */
    { generica: true, final: "heroes",
      texto: "En Villabruma pusieron vuestros nombres a una calle. Es corta, está en cuesta y se inunda, pero es vuestra." },
    { generica: true, final: "heroes",
      texto: "Los bardos cambian la canción cada año. En la última versión matáis dos dragones y os casáis con uno." },
    { generica: true, final: "codicia",
      texto: "Vuestros criados os llaman «señores». A vuestras espaldas, «los del dragón». No lo dicen con cariño." },
    { generica: true, final: "codicia",
      texto: "Contratasteis guardias para el oro y guardias para vigilar a los guardias. Dormís igual de mal." },
    { generica: true, final: null,
      texto: "El Grifo Tuerto sigue sirviendo la misma cerveza aguada. Os la cobra igual, pero ahora con una sonrisa." },
    { generica: true, final: null,
      texto: "En el Pico Cenizo ya no humea nada. Los niños de Valdren suben a jugar a dragones, y siempre gana el que hace de vosotros." }
  ];
})();
