# 📖 Manual Maestro: Búsqueda y Análisis en X (Twitter) para Power Users
**Versión Definitiva | Actualizado al 28 de abril de 2026**

## 1. Fundamentos de la Búsqueda en X (2026)
La búsqueda en X dejó de ser una base de datos cronológica pura hace años; hoy es un **sistema de recomendación de relevancia profundamente filtrado por IA (Grok)**.

*   **La Regla de Oro:** El motor de búsqueda prioriza la "salud de la cuenta", el engagement y la calidad sobre la exactitud cronológica.
*   **Filtrado Algorítmico y *Ghost Bans*:** X invisibiliza contenido duplicado, comportamiento bot, perfiles incompletos o cuentas marcadas por "baja calidad". Si el algoritmo detecta *engagement farming* (granjas de interacciones), aplica un **Search Ban** silencioso. Esto explica por qué un post visible en el timeline de un usuario puede ser inexistente al buscarlo, incluso usando la frase exacta.
*   **El Estado de las Búsquedas:** No hay "búsqueda directa" o sin filtros. Toda consulta atraviesa capas de relevancia, *Safe Search* (filtro de contenido sensible) y restricciones personales (mutes/blocks).

## 2. Dominio de Operadores (La "Navaja Suiza")
Olvída la interfaz gráfica de búsqueda avanzada. Escribir estos operadores directamente en la barra es más rápido, preciso y evade ciertos sesgos de la UI.

| Operador | Uso | Ejemplo |
| :--- | :--- | :--- |
| `""` | Frase exacta | `"remote work"` |
| `OR` | Disyunción | `(Tesla OR BMW)` |
| `-` | Exclusión de palabra/filtro | `diet -keto` |
| `from:@user` | Autor específico | `from:@elonmusk` |
| `since:` / `until:` | Rango fechas (YYYY-MM-DD) | `since:2026-01-01 until:2026-01-03` |
| `min_faves:N` | Calidad mínima (Likes) | `min_faves:50` |
| `min_retweets:N` | Viralidad mínima (Reposts) | `min_retweets:20` |
| `min_replies:N` | Discusión mínima (Respuestas)| `min_replies:10` |
| `-filter:replies` | Elimina conversaciones (solo post original) | `IA -filter:replies` |
| `-filter:retweets` | Elimina retweets del feed | `bitcoin -filter:retweets` |
| `lang:es` | Filtro estricto de idioma | `cripto lang:es` |

⚠️ **Nota crítica sobre Geolocalización (2026):** Los operadores `near:"Ciudad" within:mi` están **casi obsoletos**. Por recortes a la API y nuevas políticas de privacidad, menos del 1% de los posts tienen coordenadas reales. 
*   **Alternativa Power User:** Usa el nombre de la ciudad como palabra clave textual: `"CDMX" lang:es min_faves:5`.
*   **Aclaración sobre Visualizaciones:** No existe el operador `min_views:`. El motor solo indexa likes, retweets y respuestas.

## 3. La Ciencia de las Métricas: Umbrales y Estrategias
El mayor desafío en X es el equilibrio: filtrar la basura sin matar los resultados valiosos (falsos negativos). Dado que las cuentas Premium (verificadas) reciben un impulso algorítmico masivo (muchas veces operadas por bots que saturan respuestas), **usar filtros de engagement ya no es opcional, es obligatorio.**

### Tabla de Umbrales Mínimos según Estrategia (2026)
| Tipo de Búsqueda / Estrategia | `min_faves:` (Likes) | `min_retweets:` (Reposts) | `min_replies:` (Respuestas) | Operador Extra y Contexto |
| :--- | :--- | :--- | :--- | :--- |
| **1. Anti-Spam Básico** (Limpiar bots y cuentas granja) | **3 a 5** | N/A | N/A | `-filter:replies`<br>*Con solo 3 likes eliminas el 90% del ruido automatizado.* |
| **2. Búsqueda Local / Hiper-Nicho** (Eventos locales, fallos) | **1 a 5** | N/A | **1** | `"keyword"`<br>*En nichos pequeños, exigir >5 likes ocultará testimonios reales.* |
| **3. Monitoreo de Marca** (Customer Success / Quejas) | **10** | **2 a 5** | **5** | `(TuMarca) -from:TuMarca`<br>*Filtra usuarios que lograron tracción al hablar de tu producto.* |
| **4. Búsqueda de Hilos / Tutoriales** (Contenido educativo) | **150 a 300** | **50** | N/A | `(hilo OR thread)`<br>*Un buen hilo siempre tiene alta tasa de guardados y retweets.* |
| **5. Descubrimiento Viral / Tendencias** (Content Curation) | **500+** | **100+** | N/A | `-filter:retweets`<br>*Encuentra el post original que detonó la tendencia en el sector.* |
| **6. Discusiones y Debates** (Buscar controversias / feedback) | N/A | N/A | **30 a 50** | `? min_replies:30`<br>*Busca preguntas ("?") con muchas respuestas para hallar "puntos de dolor".* |
| **7. Auditoría OSINT a un VIP** (Ej. Políticos, celebridades) | **5,000+** | **1,000+** | **500+** | `from:@usuarioVIP`<br>*Para cuentas masivas, debes subir el umbral o la búsqueda colapsará.* |

### 💡 4 Pro-Tips de Inteligencia Avanzada
1.  **La Ley de la Proporcionalidad:** Escala tus filtros según el autor. Un post promedio de una cuenta suele tener en likes el 1% de sus seguidores. Configura `min_faves` un poco por encima de ese umbral para aislar sus "éxitos".
2.  **La técnica `-filter:retweets` para virales:** Si pones `min_retweets:500`, X te inundará con usuarios que hicieron RT a ese post. Añadiendo `-filter:retweets` obligas al buscador a mostrarte **solo el post original**.
3.  **Búsqueda de Botnets (La inversa del Engagement):** Los investigadores OSINT buscan bots usando `URL_sospechosa min_faves:0 until:2026-04-28`. Buscan intencionalmente cuentas con *cero engagement* que publican enlaces en ráfaga antes de ser suspendidas.
4.  **Respuestas > Likes para cazar errores:** Los "Likes" miden aprobación, las "Respuestas" miden fricción. Nadie le da "Me gusta" a un fallo de software, pero muchos responden *"A mí también me pasa"*. Para cazar bugs usa `min_replies:20` en lugar de `min_faves`.

## 4. Estrategias Anti-Ruido y Mejora de Resultados
Para evitar que X "rellene" tus resultados de forma caótica (el problema de la mezcla de fechas) o te ahogue en spam de cuentas verificadas:
*   **Divide y vencerás:** No busques rangos de 1 mes. Busca en bloques de 24 a 48 horas como máximo (`since:` y `until:`).
*   **Pestaña correcta:** Haz clic **siempre en "Latest"** (Más reciente). La pestaña "Top" (Destacados) está contaminada por tus mutes, tu red personal y el historial de tu cuenta.
*   **Filtrado de idioma y spam:** La combinación `lang:es min_faves:3 -filter:replies` es tu escudo estándar de navegación para cualquier consulta general.

## 5. Gestión de Límites y Rate Limits (El error "Algo salió mal")
Si recibes el infame error *"Algo salió mal. Intenta recargar"*, has chocado contra un código HTTP 429 (*Too Many Requests*). En 2026, X usa un **sistema de bloqueo híbrido**:
1.  **Límite de Cuenta (Lectura de posts):** Si haces *scrolling* agresivo o scraping, quemas la cuota diaria de tu token de cuenta. **Usar una VPN no servirá de nada** aquí, porque tu usuario ya está restringido.
2.  **Límite de IP (Peticiones rápidas):** Si cambias tus queries muy rápido por segundo sin estar logueado (o cambiando ventanas), bloquean tu red.

*   **Duración del Cooldown:** 15 a 60 minutos.
*   **Prevención y Solución:** 
    *   No hagas cambios milimétricos en tu query rápidamente (no pulses "Enter" 10 veces ajustando una palabra).
    *   Si usas VPN, debe ir acompañada de un cambio de cuenta (multilogin).
    *   **Limpia la caché:** Muchos bloqueos fantasma en 2026 se deben a tokens de sesión corruptos. Limpiar el *Local Storage* de tu navegador a veces resuelve el "Algo salió mal" sin esperar.
    *   *Nota:* No existe un dashboard oficial para ver cuántas búsquedas te quedan.

## 6. X Pro vs. Interfaz Normal
X Pro (antes TweetDeck) es la herramienta nativa más cómoda, pero **no es un motor distinto**.
*   **Lo que SÍ hace:** Permite columnas múltiples persistentes (evitando refrescar y gastar peticiones), actualizaciones en tiempo real, alertas sonoras, historial de columnas y filtros en una GUI cómoda.
*   **Lo que NO hace:** No rompe los *rate limits*, no ignora el filtrado algorítmico de X y no tiene un motor "más potente" en el backend.
*   **Conclusión:** Indispensable para monitoreo 24/7 y *Social Listening*, pero inútil para evadir restricciones de un perfil o IP penalizada en una búsqueda profunda.

## 7. Alternativas Profesionales (Third-Party)
Cuando la búsqueda nativa es insuficiente:
*   **Fedica:** La herramienta líder unánime en 2026 (tras absorber a otros competidores) para monitoreo de keywords, análisis demográfico, detección de influencers y mapeo geográfico real. Supera a X nativo porque maneja bases de datos históricas propias sin sufrir la censura de la UI de X.
*   **Antidetect Browsers (Multilogin / Dolphin Anty):** Vitales para investigadores OSINT que necesitan múltiples identidades y proxies para evitar los *rate limits* globales rotando cuentas de manera segura.
*   **API Oficial (Developer Platform):** Hostil y prohibitiva para usuarios individuales en 2026. El plan *Basic* cuesta ~$200 USD/mes con límites bajísimos (10,000 posts), y el *Pro* salta a ~$5,000 USD/mes. Solo útil para desarrollo empresarial de software, pero es la única vía para datos 100% brutos sin alteraciones algorítmicas.

## 8. Protocolo de Ejecución del Power User
Cada vez que inicies una investigación profunda, sigue este flujograma estricto:

1.  **Objetivo y Contexto:** Define tu rango temporal (máx 48h por consulta). ¿Buscas a un VIP o a un usuario local? Define tus umbrales de métricas con la tabla del Capítulo 3.
2.  **Query Building:** Escribe tu búsqueda combinando operadores en un bloc de notas primero. Usa paréntesis para agrupar. *(Ej: `(huelga OR paro) lang:es min_faves:10 -filter:replies`)*.
3.  **Ejecución Limpia:** Pega en la barra y ve directamente a la pestaña **"Latest"**.
4.  **Recolección y Scraping:** Si usas herramientas para raspar el DOM de la página, **limpia los datos post-recolección**. El DOM de X muta dinámicamente sus clases CSS e inserta anuncios "fantasma" que rompen los extractores.
5.  **Iteración y Paciencia:** Si X arroja error, detente. Limpia la caché/local storage. Si no funciona, espera 30 minutos obligatorios. Insistir en el F5 solo reiniciará tu cronómetro de penalización.