# Sapientia — Ajedrez conceptual y red social cognitiva

Prototipo funcional de una plataforma donde cada captura de ajedrez se convierte en un desafío de conocimiento. Las 64 casillas pertenecen a una disciplina (Física, Historia, Arte o Filosofía); para conquistar una casilla ocupada, el jugador debe responder una pregunta en 15 segundos.

## Características

- Layout de 3 columnas: estadísticas y grafo 3D, tablero 8x8, chat y control.
- Movimiento de piezas con selección y casillas sugeridas (sin reglas de jaque ni enroque).
- Modal «Desafío de Sapientia» con temporizador de 15 s. Si fallas o se agota el tiempo, la captura se revoca.
- Grafo de conocimiento en Three.js: cada acierto añade un nodo.
- WebSocket simulado (`SocketSimulado`) para chat y presencia.
- Diseño oscuro con violeta de señal y acentos dorados.

## Estructura

```
sapientia/
├── index.html   # Estructura y modal
├── styles.css   # Tema oscuro, tablero y animaciones
├── app.js       # Lógica del juego, grafo y WebSocket simulado
└── README.md
```

## Ejecución local (paso a paso)

1. Descarga o copia los cuatro archivos en una misma carpeta (por ejemplo, `sapientia/`).
2. Verifica que tengas conexión a internet: Tailwind, Three.js y las fuentes se cargan por CDN.
3. Haz doble clic en `index.html` o arrástralo a tu navegador (Chrome, Edge, Firefox o Safari).
4. Juega con las blancas: selecciona una pieza, elige una casilla marcada y captura para activar el desafío.
5. Pulsa **Conectar** en el panel derecho para activar el chat simulado.

## Pasar a WebSockets reales

Sustituye la clase `SocketSimulado` por `new WebSocket('wss://tu-servidor')` y conserva los eventos `open`, `close`, `mensaje` y `presencia`. El resto de la interfaz no requiere cambios.

## Próximos pasos sugeridos

- Reglas completas (jaque, enroque, al paso) con `chess.js`.
- Banco de preguntas en JSON externo o API.
- Partidas multijugador reales con Node.js y `ws`.
- Perfiles, ranking y persistencia de datos.
- Modo instalable (PWA).
