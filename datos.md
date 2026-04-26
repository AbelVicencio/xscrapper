Esta extensión ha sido diseñada con un enfoque en la eficiencia quirúrgica y la protección de la identidad del usuario. Aquí tienes el desglose de su ADN:

🛡️ Filosofía: "Invisible y Resiliente"
Zero-Network Scraping: A diferencia de otros scrapers, esta extensión no hace peticiones de red a los servidores de X. En lugar de eso, actúa como un "observador silencioso" que captura únicamente lo que el navegador ya ha descargado y está mostrando en pantalla. Esto la hace virtualmente indetectable para los sistemas anti-bot basados en tráfico.
Privacidad Local: El 100% de los datos se procesan y guardan en el almacenamiento local de tu navegador (chrome.storage). Nada sale a la nube.
Automatización Humanizada: El motor de autoscroll no usa intervalos fijos (que son fáciles de detectar), sino un algoritmo de "desplazamiento orgánico" con variaciones aleatorias en velocidad y pausas de lectura, imitando el comportamiento de un humano real.
Integridad de Datos: Se ha puesto especial énfasis en la compatibilidad con Excel, resolviendo problemas clásicos como el truncamiento de IDs largos (usando prefijos de fórmula ="ID") y la codificación de caracteres especiales (BOM UTF-8).
💻 Stack Tecnológico
Lenguaje: TypeScript para un código robusto, tipado y libre de errores de lógica comunes.
Arquitectura: Chrome Extension Manifest V3, cumpliendo con los estándares de seguridad y rendimiento más modernos de Google.
Motor de Detección: MutationObserver API. Es la joya de la corona; permite reaccionar instantáneamente cuando X inyecta nuevos tuits en el DOM sin consumir apenas CPU.
Bundling: esbuild (vía build.mjs). Elegido por su velocidad extrema (compila todo el proyecto en milisegundos).
UI/UX:
Vanilla CSS: Diseño "Dark Mode" premium inspirado en la estética de X, sin frameworks pesados.
Animate API & requestAnimationFrame: Para que las transiciones de los números (efecto odómetro) sean fluidas a 60fps.
Persistencia: Chrome Storage Local con un sistema de caché en memoria de doble vía para evitar pérdidas de datos durante refrescos de página.
En resumen: es una herramienta de grado forense empaquetada en una interfaz ligera y divertida. 🕵️‍♂️🚀📊



Esta funcionando bien: Pregunta.. no importa lo rapido que yo escroleee se capturarn todos los tuits?  Es mejor escrolear ocn el raton o presionar  PG DOWN  ?    como funciona la captura de posts? 


¡Buena pregunta! Aquí te explico cómo funciona "bajo el capó" y cuál es la mejor forma de usarlo:

¿Cómo funciona la captura?
La extensión utiliza un MutationObserver. Imagínalo como un centinela que está mirando constantemente el código HTML de la página.

Detección: En cuanto X (Twitter) inyecta un nuevo post (<article>) en el código de la página, el centinela lo detecta al instante.
Filtrado: Usamos un WeakSet (una lista de memoria rápida) para marcar los elementos HTML que ya procesamos. Así, aunque X mueva el post de sitio o lo re-renderice, no gastamos recursos procesándolo dos veces.
Extracción Pasiva: No hacemos peticiones a internet; simplemente leemos lo que X ya descargó y puso en tu pantalla.
¿Importa la velocidad del scroll?
Sí, importa. X utiliza una técnica llamada "Virtualized Scrolling" (Desplazamiento Virtualizado). Para que la página no se vuelva lenta, X solo mantiene en el código HTML unos pocos posts (los que ves y unos pocos arriba/abajo).

Si escroleas normal (Ratón o Page Down): X tiene tiempo de cargar los posts, el MutationObserver los ve y los captura todos.
Si escroleas extremadamente rápido: X podría "saltarse" algunos posts para alcanzar tu posición de scroll, mostrando brevemente un icono de carga. Si el post nunca llega a estar en el código HTML (aunque sea por medio segundo), la extensión no podrá leerlo.
¿Ratón o Page Down?
Page Down: Es muy eficiente porque baja en "bloques" fijos. Es la forma más rápida de capturar mucho contenido de forma constante.
Ratón: Es mejor si quieres asegurarte de que cada post se cargue visualmente (por ejemplo, si quieres que se capturen también las imágenes o métricas actualizadas).
Mi recomendación: Usa Page Down a un ritmo constante (por ejemplo, un toque cada segundo). No hace falta ir lento, pero dale tiempo a X a que quite el "Cargando..." y muestre los posts.

Tip Pro: El botón "Escanear tweets visibles"
Si sientes que te saltaste un tramo o acabas de abrir una búsqueda con muchos resultados ya cargados, abre el popup y dale a "🔎 Escanear tweets visibles". Esto forzará una revisión de todo lo que hay en pantalla en ese momento, por si el observador se perdió algo durante un scroll muy brusco.

En resumen: No hace falta ir a paso de tortuga, pero un scroll fluido y constante es mejor que un "salto" violento al final de la página. ¡Ya tienes 178+ capturados, vas por muy buen camino! 🕵️‍♂️🚀




Así es como funciona ese proceso de actualización automática:

1. El problema del texto truncado
En el timeline principal, X suele cortar los posts largos (los que tienen el botón "Mostrar más"). Si la extensión lo captura ahí, solo guarda el fragmento visible.

2. La lógica de "Mejor Texto"
Cuando haces clic y abres el tuit individual, la extensión detecta que es el mismo ID de tuit y aplica esta regla:

Compara longitudes: Si el texto nuevo es más largo que el que ya tenemos guardado, lo reemplaza.
Resultado: Al abrir el tuit, el fragmento corto en tu base de datos se actualiza automáticamente con el texto completo.
3. Actualización de Métricas (Máximos)
Las métricas (Likes, Vistas, Reposts) en la vista detallada suelen estar más actualizadas. La lógica que programamos es:

Maximizador: Compara, por ejemplo, los Likes viejos con los nuevos y se queda siempre con el número más alto. Así nunca pierdes progreso si el tuit se vuelve viral mientras lo miras.
4. Marca de "Vista Detallada"
En el JSON verás un campo llamado isDetailView.

Si solo lo viste en el timeline, será false.
En cuanto entras al detalle, cambia a true. Esto te sirve después para saber qué tuits tienen el texto garantizado al 100% y cuáles podrían estar truncados.
5. Fusión de Imágenes y Videos
Si en la vista detallada aparecen más imágenes (por ejemplo, en un hilo o una galería que no cargó completa en el timeline), la función mediaUrls combina ambas listas y elimina duplicados, asegurándose de que tengas todos los enlaces a fotos y videos.

En resumen: No tienes que hacer nada. Solo por el hecho de entrar a ver un tuit, la extensión "enriquece" silenciosamente los datos que ya tenías en memoria. 🧠✨


Tienes previsto que a veces ponen 'mil'  para agregar 000


¡Sí, está totalmente cubierto! De hecho, esa fue una de las partes clave de la función utilitaria que creamos al principio en src/utils/parseMetric.ts.

Como X en español usa abreviaturas como "mil" o "M" (millones), el código está entrenado para detectarlas y convertirlas en números reales para tu JSON.

Aquí te muestro cómo lo está interpretando el scraper:

2 mil → El código detecta el multiplicador "mil" y lo convierte en 2000.
205 mil → Se convierte en 205000.
74,5 mil → El código sabe manejar la coma decimal española y lo convierte en 74500.
1,2 M → Entiende que "M" en la interfaz española significa millones y lo guarda como 1200000.
¿Cómo lo hace?
Usamos una expresión regular (Regex) que separa el número de la palabra:

typescript
const MULTIPLIERS = {
  "mil": 1000,
  "m": 1000000, // Millones
  "k": 1000,    // Por si cambias el idioma a inglés
};
Así que no te preocupes por los ceros; en tu archivo exportado verás los números limpios (ej: 205000 en lugar de "205 mil") listos para que los puedas procesar en un Excel o base de datos. ¡Todo bajo control! 🎯🕵️‍♂️

Supongo en el json están todos los campos posibles de datos verdad? Incluso los ocultos interesantes?


Como estamos leyendo el DOM (el código visual de la página) y no interceptando las peticiones de red internas (la API de X), estamos limitados a lo que X decide pintar en el navegador.

Sin embargo, he incluido varios campos "ocultos" o técnicos que no saltan a la vista pero están ahí para quien sabe buscar:

1. El Número Exacto vs el Redondeado
Este es un truco interesante: a veces en pantalla ves "2 mil", pero en el atributo aria-label del botón (para lectores de pantalla), X suele poner el número exacto. Mi código intenta leer ese aria-label primero. Si el dato está ahí, tendrás el número preciso (ej: 2048) en lugar del redondeado (2000).

2. Metadatos que ya incluimos:
id: El identificador numérico único de X (fundamental para evitar duplicados).
date (ISO 8601): En pantalla ves "hace 2h", pero yo extraigo el valor del atributo datetime (ej: 2026-04-25T18:30:00.000Z), que es la fecha y hora exacta del post.
lang: Extraigo el idioma que X ha detectado para ese post (ej: "es", "en").
mediaUrls: Los enlaces directos a las imágenes en los servidores de X (pbs.twimg.com), no solo la miniatura.
bookmarks: Aunque no siempre se ven en el timeline principal, intento extraerlos si están presentes en los atributos del tuit.


Esta es la estructura detallada del objeto **JSON** que genera la extensión por cada post capturado. Cada campo ha sido diseñado para facilitar el análisis posterior en herramientas como Excel, Python o bases de datos.

### 📋 Diccionario de Campos (Objeto `PostData`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| **`id`** | `string` | El identificador único y permanente del tuit (ej: `"178456..."`). Es la clave principal para evitar duplicados. |
| **`author`** | `string` | El handle o nombre de usuario único (el que va después de la `@`). Sin el símbolo `@`. |
| **`displayName`** | `string` | El nombre público que el usuario eligió mostrar (puede contener emojis). |
| **`date`** | `string` | Fecha y hora exacta de publicación en formato **ISO 8601**. No es un texto relativo como "hace 2h", sino una marca de tiempo real. |
| **`text`** | `string` | El contenido completo del post. Si el post tiene emojis, se capturan como texto o sus códigos alt. |
| **`url`** | `string` | El enlace permanente (permalink) directo al post en X.com. |
| **`lang`** | `string` | Código de idioma detectado por X (ej: `"es"`, `"en"`, `"pt"`). Muy útil para filtrar contenido por país. |
| **`mediaUrls`** | `array` | Una lista de enlaces directos a las imágenes o miniaturas de video adjuntas en el post. |



### 📊 El Objeto `metrics` (Métricas de Interacción)
*Nota: Todos los valores son numéricos. Si el dato no está disponible, será `null`.*

*   **`views`**: Número de reproducciones o visualizaciones.
*   **`replies`**: Cantidad de respuestas o comentarios.
*   **`reposts`**: Veces que el post fue compartido (Retweets).
*   **`likes`**: Cantidad de "Me gusta".
*   **`bookmarks`**: Cuántas personas guardaron el post (este dato suele ser más visible en la vista detallada).

---

### 🕵️‍♂️ Campos de Control (Seguimiento del Scraper)

*   **`firstSeen`**: Cuándo fue la **primera vez** que la extensión detectó este post en tu pantalla.
*   **`lastUpdated`**: Cuándo fue la **última vez** que se actualizaron sus datos (por ejemplo, si entraste al detalle y se refrescaron los likes).
*   **`isDetailView`**: Un booleano (`true`/`false`). Indica si el post fue capturado abriendo el tuit individualmente. Si es `true`, la fidelidad del texto y las métricas es máxima.
*   **`appearanceCount`**: Indica cuántas veces ha sido detectado el tuit en el DOM. Esto te permitirá identificar qué contenidos son los más "insistentes" o repetitivos en tu feed.


### 💡 Ejemplo de un registro real:

```json
{
  "id": "1849203154829312102",
  "author": "el_usuario",
  "displayName": "Juan Pérez 🚀",
  "date": "2026-04-25T20:15:30.000Z",
  "text": "Este es un ejemplo de cómo se captura el texto completo de un tuit largo...",
  "url": "https://x.com/el_usuario/status/1849203154829312102",
  "lang": "es",
  "metrics": {
    "views": 25400,
    "replies": 12,
    "reposts": 85,
    "likes": 420,
    "bookmarks": 7
  },
  "mediaUrls": [
    "https://pbs.twimg.com/media/GJ9a...jpg"
  ],
  "firstSeen": "2026-04-25T21:00:05.123Z",
  "lastUpdated": "2026-04-25T21:30:10.456Z",
  "isDetailView": true
}
```

¿Hay algún otro dato que te gustaría que intentáramos capturar? (Por ejemplo: si la cuenta está verificada, si es un hilo, etc.)🕵️‍♂️✨