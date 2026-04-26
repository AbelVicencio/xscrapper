# 🕵️‍♂️ X Scraper: Manual de Operaciones Forenses

Bienvenido al manual oficial de **X Scraper**. Esta herramienta ha sido diseñada para investigadores de datos, periodistas y analistas que necesitan capturar información de la red social X de forma masiva, discreta y con integridad garantizada para su posterior análisis en herramientas como Excel, Python o bases de datos.

---

## 🛡️ 1. Filosofía de Diseño: "Invisible y Resiliente"

La extensión no es un "bot" tradicional. Su diseño se basa en tres pilares:

*   **Zero-Network Scraping**: No realiza peticiones de red a las APIs de X. Actúa como un observador pasivo del DOM (Document Object Model). Captura lo que tu navegador ya ha descargado. Esto la hace **indetectable** para los sistemas de detección de tráfico automatizado.
*   **Privacidad Local Total**: El 100% de los datos recolectados se procesan y almacenan en el disco local de tu computadora (`chrome.storage`). Nada se envía a servidores externos.
*   **Integridad Forense**: Se han implementado soluciones específicas para evitar que los datos se corrompan al ser abiertos en software externo, como el manejo de IDs de 18 dígitos y codificaciones internacionales.

---

## 🚀 2. Guía de Uso Rápido

### Inicio del Scrapeo
1.  **Master Switch**: En la parte superior derecha del popup, encontrarás un interruptor. Si está en **Verde**, la extensión está escuchando activamente cualquier cambio en la pantalla.
2.  **Punto de Estado**: En la barra inferior, un punto verde parpadeante indica que el motor está "Observando cambios".

### Métodos de Captura
*   **Captura Automática**: Simplemente navega por el timeline. Cada vez que aparezca un nuevo tuit en pantalla, se guardará.
*   **Escaneo Manual (🔎 Escanear)**: Si abres una página y hay tuits que ya estaban ahí antes de encender la extensión, pulsa este botón para procesar todo lo visible en ese instante.
*   **Autoscroll Orgánico (🚀 Autoscroll)**: Activa un bucle de desplazamiento humano. El botón cambiará a **"🛑 Detener autoscroll"** y la página bajará sola a una velocidad variable para imitar a un lector real.

---

## 📊 3. Gestión de Datos y Exportación

### Formatos Soportados
*   **📁 JSON**: El formato crudo. Ideal para programadores o para re-importar datos en otra sesión.
*   **📊 CSV (Optimizado para Excel)**: Diseñado específicamente para analistas.
    *   **Acentos e Ñs**: Incluye una marca BOM UTF-8 para que Excel reconozca los caracteres en español sin errores.
    *   **IDs Intactos**: Los IDs de los tuits se exportan como fórmulas (`="ID"`) para evitar que Excel los redondee o los convierta a notación científica.
    *   **Media URLs**: Las URLs de imágenes y videos se expanden en columnas separadas (`mediaUrl1`, `mediaUrl2`, etc.) al final de la fila.

### Importación de Investigaciones (📥 Cargar)
Puedes cargar archivos JSON previamente exportados. La extensión realizará una **fusión inteligente**:
*   Si un tuit ya existe, comparará las métricas (likes, vistas) y se quedará con la versión más reciente o con las cifras más altas.
*   Si es nuevo, lo añadirá a la colección actual.

---

## ⚙️ 4. Especificaciones Técnicas (Stack)

Para los usuarios técnicos, este es el motor que mueve la herramienta:

*   **Motor de Detección**: `MutationObserver API`. Reacciona a cambios en el árbol del DOM con un impacto despreciable en el uso de CPU.
*   **Persistencia**: Sistema de caché en memoria de doble vía con persistencia asíncrona cada 20 segundos para no saturar el disco.
*   **Arquitectura**: Chrome Manifest V3 con Service Workers para gestión de procesos de fondo.
*   **Lenguaje**: TypeScript 5.0+, garantizando seguridad de tipos en la extracción de métricas.

---

## ❓ 5. Preguntas Frecuentes para Investigadores

### ¿Importa qué tan rápido haga scroll?
El motor de captura usa un sistema de **"Debounce de 500ms"**. Esto significa que acumula todos los tuits detectados durante medio segundo y los procesa en un solo lote. Puedes scrollear rápido, pero lo ideal es usar el **Autoscroll** o presionar **PAGE DOWN** rítmicamente para dar tiempo a que X cargue el contenido de los servidores.

### ¿Se capturan los datos de los botones (Métricas)?
Sí. Extraemos en tiempo real:
*   **Likes, Reposts, Replies y Bookmarks**.
*   **Views** (Vistas).
*   **Autor, Nombre mostrado e ID único**.
*   **Texto completo** (incluyendo emojis y saltos de línea).
*   **Multimedia**: Enlaces directos a fotos y videos.

### El contador de posts sube y baja, ¿por qué?
El contador del popup se refresca cada 500ms. Si ves fluctuaciones al refrescar la página, es el sistema de **Fusión de Memoria** sincronizando los datos que tenías en la pestaña con los que están guardados permanentemente en el disco. La extensión siempre prioriza no perder datos.

---

### 🗑️ Limpieza de Investigación
Cuando termines un proyecto y hayas exportado tus datos, usa el botón **"Borrar todo"**. Esto vaciará la base de datos local y reseteará los contadores para tu próxima investigación.

---
*Manual generado para la versión 1.0.0 — X Scraper: Inteligencia Forense al alcance de un clic.* 🕵️‍♂️🚀
