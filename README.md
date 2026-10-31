# PokeDex

## Dados y Mazmorras

Juego de rol por turnos al estilo de Dungeons & Dragons, dibujado en pixel art (sprites de 36×36): una partida de espada y brujería contra el dragón rojo Ignárax.

- **Jugar:** abre `plato/index.html` en el navegador. Funciona sin servidor ni instalación.
- **De 1 a 6 jugadores**, en un mismo dispositivo o, publicado en claude.ai, en una mesa en línea donde cada amigo controla su héroe desde su móvil.
- **Personajes:** 8 razas (humano, elfo, enano, mediano, semiorco, tiefling, dracónido, gnomo) y 8 clases (guerrero, bárbaro, pícaro, explorador, mago, brujo, clérigo, bardo), cada una con su habilidad activa y su pasiva, alineamiento y aspecto personalizable.
- **Aventura:** 5 capítulos (Villabruma, el Bosque Susurrante, la Cripta de los Reyes, las Minas de Barak-Thur y la Guarida de Ignárax) con combates por iniciativa, acertijos, cuatro tiendas y un compendio con el lore de Valdren y el bestiario.

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
| `datos.js` | Razas, clases, objetos, tiendas, enemigos, escenas y lore |
| `escenario.js` | Dibujo del escenario, efectos y dado |
| `juego.js` | Reglas, combate, tiendas, pantallas y mesas en línea |
| `estilo.css`, `plantilla.html` | Estilos y estructura de la página |

`plato/dev/` tiene páginas para revisar los sprites y los fondos.
