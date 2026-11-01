# PokeDex

## Dados y Mazmorras

Juego de rol por turnos al estilo de Dungeons & Dragons, dibujado en pixel art (sprites de 36×36): una partida de espada y brujería contra el dragón rojo Ignárax.

- **Jugar:** abre `plato/index.html` en el navegador. Funciona sin servidor ni instalación. Está pensado para móvil: cada pantalla cabe entera, sin scroll.
- **De 1 a 4 héroes**, en un mismo móvil o en línea (publicado en claude.ai): uno crea la partida, comparte el artefacto con sus amigos por correo y les pasa el código de 4 letras; cada uno controla su héroe desde su móvil. El móvil del anfitrión lleva la partida y los demás le mandan sus jugadas.
- **Selección de personaje:** 90 segundos para elegir clase, raza, nombre y aspecto, viendo las habilidades y atributos de cada combinación. 8 razas (humano, elfo, enano, mediano, semiorco, tiefling, dracónido, gnomo) y 8 clases (guerrero, bárbaro, pícaro, explorador, mago, brujo, clérigo, bardo), cada una con su habilidad activa y su pasiva.
- **Niveles y habilidades:** hasta nivel 10. Cada héroe lleva como mucho 4 habilidades, como los movimientos de un Pokémon; al subir de nivel aprende otras y, si ya tiene 4, elige cuál olvida.
- **Botín:** cofres en el mapa y enemigos que sueltan armas, armaduras y objetos mágicos de rareza común, rara, épica o legendaria. Se reparten tocando el nombre del héroe.
- **Combate claro:** cada habilidad avisa si es «¡Eficaz!» o «Poco eficaz» contra el enemigo, que muestra su vida y qué hará en su próximo turno. Los enemigos crecen con el nivel del grupo.
- **Dificultad:** Aventurero, Héroe o Pesadilla (en Pesadilla los caídos no se levantan al ganar).
- **Varios enemigos a la vez:** se toca uno para apuntarle; algunas habilidades golpean a todos. Si un héroe aturde, envenena, maldice o debilita y otro remata, es un combo (×1,5).
- **Bloqueo activo:** cuando un ataque va a dar, aparece «¡BLOQUEA!» en el móvil del dueño del héroe; a tiempo, recibe la mitad de daño.
- **Jefes con fases:** a media vida cambian (el trol se enfurece, el liche invoca esqueletos, el vampiro llama a sus lobos, el dragón alza el vuelo).
- **Runas y logros:** 12 logros y un altar donde gastar runas en ventajas para las siguientes partidas.
- **Decisiones con memoria:** ayudar a la mercader, liberar al enano o saquear el santuario tiene consecuencias en actos posteriores.
- **Música y animaciones:** chiptune generado para cada acto y los jefes; flechas, tajos, orbes y rayos según la clase.
- **Estados:** veneno, quemadura, sangrado, parálisis, congelación, ceguera, debilidad, maldición y regeneración, para héroes y enemigos. Cada monstruo tiene un ataque especial anunciado de antemano.
- **Acto V, el Abismo:** tras matar al dragón (o siempre en Pesadilla) se baja al Abismo, con monstruos nuevos y el jefe secreto Nhazgul, el Devorador de Estrellas.
- **Votaciones:** en línea, el camino y las decisiones se votan entre todos.
- **Mapas más grandes:** 6 filas con hasta 4 caminos, altares malditos y casillas misterio; 46 sucesos y lore ampliado.
- **Final con premios:** más daño, mejor golpe, sanador, el muro… y la tabla de cada héroe.
- **Minijuegos:** 17 tipos. Ataque según clase y habilidad (barra, carga, frenesí, combo de flechas, trazar runas, ritmo, punto débil, diana, runas, anillo); las curas se juegan siguiendo la luz; las defensas cambian según el ataque (bloquear, parar deslizando, esquivar, zafarse, disipar, contrahechizo de memoria). Se ven el d20 y los dados de daño; en los sucesos tira todo el grupo.
- **Rachas, remates y réplicas:** encadenar minijuegos perfectos da +1 de daño por nivel (hasta +3); un perfecto contra un enemigo casi muerto lo remata; una parada perfecta replica y un contrahechizo devuelve el hechizo.
- **Sucesos del campo:** a veces aparece algo aprovechable en la pelea (lámpara, barril de aceite, rocas, fuente, cofre, runa, cadenas, avispero, grieta de lava) que un héroe puede usar en vez de atacar.
- **Arte HD:** escenario de 256×144 con héroes y monstruos de 48×48, jefes de 80×80, fondos e iconos nuevos. En el mapa, al tocar un camino se ve su paisaje entre la niebla.
- **Ataques en equipo:** según la clase y la raza de los dos héroes, o con la mascota.
- **Maná, comida y descanso:** las habilidades fuertes gastan maná; acampar gasta comida, cura, levanta a los caídos y recarga el maná.
- **Caminos con pistas e historia continuada:** el mapa no dice qué hay; sucesos por el camino y una historia con decisiones que vuelven en cada acto (Ascua, la Compañía del Colmillo, los Hijos de la Ceniza).
- **Mascotas, objetos especiales y caras:** siete mascotas que se consiguen con decisiones, armas con efectos (vampírica, ponzoñosa, ígnea, de escarcha…) y héroes que ponen cara de dolor, alegría o furia.
- **Golpe certero:** al atacar, una marca recorre una barra; tocar en el centro da +2 o, si es perfecto, +5 a la tirada (o más daño en los ataques seguros).
- **Bendiciones:** tras cada jefe o élite el grupo elige 1 de 3 mejoras permanentes (más daño, más vida, emboscadas, curas tras la victoria…).
- **Élites:** combates marcados en rojo en el mapa, más duros, con botín raro asegurado y una bendición.
- **Sensaciones:** sonidos sintetizados, vibración en el móvil, celebraciones al subir de nivel o encontrar botín épico y un tutorial de 3 pasos la primera vez. El sonido se apaga desde el menú.
- **Aventura:** 4 actos (el Camino del Bosque, la Mazmorra, el Castillo y el Volcán). En cada uno elegís camino en un mapa entre combates, sucesos con decisiones y acertijos, cofres, una tienda y una hoguera, hasta el jefe: el trol del puente, el liche Malakar, el vampiro Lord Varkhul y el dragón rojo Ignárax.

### Código

El juego se escribe en `plato/src/` y se junta en un solo archivo con:

```
python3 plato/construir.py
```

| Archivo | Contenido |
| --- | --- |
| `pixel.js` | Motor de pixel art: rejillas, capas sombreadas y contorno automático |
| `heroes.js` | Compositor de héroes por raza, clase y aspecto |
| `monstruos.js` | Monstruos y personajes no jugadores |
| `fondos.js` | Escenarios de 192×108 |
| `datos.js` | Razas, clases, habilidades, objetos y botín, tiendas, enemigos, actos, sucesos y lore |
| `escenario.js` | Dibujo del escenario, efectos y dado |
| `juego.js` | Reglas, selección, mapa, combate, tiendas, pantallas y partidas en línea |
| `estilo.css`, `plantilla.html` | Estilos y estructura de la página |

`plato/dev/` tiene páginas para revisar los sprites y los fondos.
