# PokeDex

## Dados y Mazmorras

Juego de rol por turnos al estilo de Dungeons & Dragons, dibujado en pixel art (sprites de 36×36): una partida de espada y brujería contra el dragón rojo Ignárax.

- **Jugar:** abre `plato/index.html` en el navegador. Funciona sin servidor ni instalación. Está pensado para móvil: cada pantalla cabe entera, sin scroll.
- **De 1 a 4 héroes**, en un mismo móvil o en línea (publicado en claude.ai): uno crea la partida, comparte el artefacto con sus amigos por correo y les pasa el código de 4 letras; cada uno controla su héroe desde su móvil. El móvil del anfitrión lleva la partida y los demás le mandan sus jugadas.
- **Selección de personaje:** 90 segundos para elegir clase, raza, nombre y aspecto, viendo las habilidades y atributos de cada combinación. 8 razas (humano, elfo, enano, mediano, semiorco, tiefling, dracónido, gnomo) y 8 clases (guerrero, bárbaro, pícaro, explorador, mago, brujo, clérigo, bardo), cada una con su habilidad activa y su pasiva.
- **Niveles y habilidades:** hasta nivel 10. Cada héroe lleva como mucho 4 habilidades, como los movimientos de un Pokémon; al subir de nivel aprende otras y, si ya tiene 4, elige cuál olvida.
- **Botín:** cofres en el mapa y enemigos que sueltan armas, armaduras y objetos mágicos de rareza común, rara, épica o legendaria. Se reparten tocando el nombre del héroe.
- **Combate claro:** cada habilidad avisa si es «¡Eficaz!» o «Poco eficaz» contra el enemigo, que muestra su vida y qué hará en su próximo turno. Los enemigos crecen con el nivel del grupo.
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
