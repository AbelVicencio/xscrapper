# 🕵️‍♂️ X Content Scraper

[![Version](https://img.shields.io/badge/version-1.20-blue.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-Chrome%20|%20Edge-lightgrey.svg)](manifest.json)
[![License](https://img.shields.io/badge/license-Private-red.svg)](package.json)

Una extensión de navegador diseñada para investigadores de datos, periodistas y analistas que permite capturar información estructurada de X (Twitter) de forma masiva, discreta y resiliente.

## 🌟 Características Principales

- **Zero-Network Scraping**: Actúa como un observador pasivo del DOM. No realiza peticiones adicionales a la API de X, lo que la hace **indetectable** para sistemas de detección de bots.
- **Extracción de Video Stealth (React Fiber)**: Utiliza ingeniería inversa profunda para acceder al estado interno de React (`__reactFiber$`) e interceptar enlaces directos de video (MP4) con la máxima calidad, esquivando restricciones de streaming por fragmentos (`blob:`).
- **Privacidad Local Total**: El 100% de los datos recolectados se almacenan localmente en el navegador, con sincronización `FORCE_PERSIST` que asegura descargas de datos siempre actualizadas.
- **Integridad Forense**:
    - Manejo de IDs de 18 dígitos (evita redondeos en Excel).
    - Mapeo dinámico y estructurado de columnas para múltiples `imageUrls`, `videoUrls` y `linkUrls`.
    - Exportación optimizada con BOM UTF-8 para caracteres internacionales.
- **Búsqueda Avanzada Autónoma**: Genera URLs de búsqueda avanzada con parámetros precisos (fechas, idiomas, menciones) y almacena el formulario utilizado dentro del archivo JSON exportado.
- **Autoscroll Orgánico**: Emula el comportamiento humano para cargar contenido automáticamente.
- **Fusión Inteligente**: Sistema de *Double-Buffer* (Caché + Storage local). Al importar JSONs previos, fusiona la data preservando registros completos y previniendo duplicidad de contenido multimedia.

## 🛠️ Stack Tecnológico

- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [esbuild](https://esbuild.github.io/)
- **Runtime**: Browser Extension (Manifest V3)
- **API Principal**: `MutationObserver` para detección de contenido en tiempo real.

## 🚀 Instalación (Modo Desarrollador)

1. **Clonar el repositorio**:
   ```bash
   git clone <repo-url>
   cd scrap-twitter-x
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Compilar el proyecto**:
   ```bash
   npm run build
   ```

4. **Cargar en el navegador**:
   - Abre `chrome://extensions/` en Chrome (o `edge://extensions/` en Edge).
   - Activa el **"Modo de desarrollador"** (Developer mode).
   - Haz clic en **"Cargar descomprimida"** (Load unpacked).
   - Selecciona la carpeta raíz del proyecto (donde se encuentra el `manifest.json`).

## 📖 Uso

1. **Activación**: Activa el interruptor principal en el popup de la extensión.
2. **Navegación**: Simplemente navega por X.com. Los tuits se capturarán automáticamente al aparecer en pantalla.
3. **Escaneo Manual**: Pulsa "Escanear" para procesar el contenido que ya está visible.
4. **Autoscroll**: Activa el autoscroll para dejar que la herramienta recolecte datos por ti de forma orgánica.
5. **Exportación**: Descarga tus datos en formato JSON o CSV (optimizado para analistas).

## 📂 Estructura del Proyecto

```text
src/
├── background/    # Lógica del Service Worker y gestión de descargas.
├── content/       # Scripts que interactúan con el DOM de X.
├── extractors/    # Lógica específica para parsear elementos de la UI de X.
├── popup/         # Interfaz de usuario (HTML/CSS/TS).
├── storage/       # Capa de persistencia y sincronización de datos.
├── types.ts       # Definiciones de tipos globales.
└── utils/         # Funciones de utilidad comunes.
```

## 🛠️ Desarrollo

- **Compilación en tiempo real**:
  ```bash
  npm run watch
  ```
- **Limpiar compilación**:
  ```bash
  npm run clean
  ```

---

*Desarrollado para misiones de inteligencia de datos y análisis forense digital.* 🚀
