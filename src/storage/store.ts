// ─────────────────────────────────────────────────────
// store.ts — Almacenamiento con lógica de Upsert
// ─────────────────────────────────────────────────────
// Mantiene un Map en memoria como caché y sincroniza
// con chrome.storage.local para persistencia.
//
// UPSERT: Si un post ya existe:
//   - Actualiza métricas si los nuevos valores son mayores
//   - Extiende el texto si la nueva versión es más larga
//     (ej. cuando el usuario abre la vista detallada)
//   - Preserva firstSeen, actualiza lastUpdated
//   - Marca isDetailView=true si se capturó desde un status page
// ─────────────────────────────────────────────────────

import { PostData } from "../types";

/** Caché en memoria — evita procesar el mismo nodo dos veces */
const memoryCache: Map<string, PostData> = new Map();

/** Clave de almacenamiento en chrome.storage.local */
const STORAGE_KEY = "scraped_posts";

/**
 * Combina dos objetos PostData aplicando la lógica de Upsert:
 *
 * 1. **Texto**: Si el nuevo texto es más largo (ej. vista detallada
 *    con thread expandido), se reemplaza. Si no, se conserva el existente.
 *
 * 2. **Métricas**: Se toma el valor máximo de cada métrica.
 *    Esto es porque las métricas solo crecen con el tiempo.
 *
 * 3. **Timestamps**: firstSeen se preserva del original,
 *    lastUpdated se actualiza al más reciente.
 *
 * 4. **isDetailView**: Se marca true si alguna de las dos fuentes
 *    viene de una vista detallada.
 *
 * 5. **mediaUrls**: Se hace merge sin duplicados.
 *
 * @param existing - El registro existente en el almacenamiento
 * @param incoming - El nuevo registro recién extraído
 * @returns El registro combinado
 */
export function mergePost(existing: PostData, incoming: PostData): PostData {
  return {
    // Datos base — preservar los existentes
    id: existing.id,
    author: incoming.author || existing.author,
    displayName: incoming.displayName || existing.displayName,
    date: existing.date, // La fecha original del tweet no cambia
    url: existing.url || incoming.url,
    lang: incoming.lang || existing.lang,

    // TEXTO: usar el más largo (vista detallada tiene más contexto)
    text: incoming.text.length > existing.text.length
      ? incoming.text
      : existing.text,

    // MÉTRICAS (Elegir siempre el valor máximo observado)
    likes: Math.max(existing.likes || 0, incoming.likes || 0),
    views: Math.max(existing.views || 0, incoming.views || 0),
    reposts: Math.max(existing.reposts || 0, incoming.reposts || 0),
    replies: Math.max(existing.replies || 0, incoming.replies || 0),
    bookmarks: Math.max(existing.bookmarks || 0, incoming.bookmarks || 0),

    // TIMESTAMPS
    firstSeen: existing.firstSeen, // Preservar primera captura
    lastUpdated: new Date().toISOString(),

    // CONTADOR DE APARICIONES
    appearanceCount: (existing.appearanceCount || 1) + 1,

    // DETAIL VIEW: true si alguna vez se capturó desde vista detallada
    isDetailView: existing.isDetailView || incoming.isDetailView,

    // MEDIA: merge sin duplicados
    mediaUrls: [...new Set([...existing.mediaUrls, ...incoming.mediaUrls])],
  };
}

/**
 * Retorna el máximo entre dos métricas, tratando null como 0.
 */
function maxMetric(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return Math.max(a ?? 0, b ?? 0);
}

/**
 * Inserta o actualiza un post en el caché de memoria.
 *
 * @param post - El PostData a insertar/actualizar
 * @returns true si fue una inserción nueva, false si fue actualización
 */
export function upsertToMemory(post: PostData): boolean {
  const existing = memoryCache.get(post.id);

  if (existing) {
    // UPDATE: combinar con datos existentes
    const merged = mergePost(existing, post);
    memoryCache.set(post.id, merged);
    return false; // No es nuevo
  } else {
    // INSERT: agregar directamente
    memoryCache.set(post.id, post);
    return true; // Es nuevo
  }
}

/**
 * Verifica si un ID ya está en el caché de memoria.
 * Útil para evitar re-procesar nodos del DOM.
 */
export function hasInMemory(id: string): boolean {
  return memoryCache.has(id);
}

/**
 * Obtiene un post del caché por su ID.
 */
export function getFromMemory(id: string): PostData | undefined {
  return memoryCache.get(id);
}

/**
 * Retorna el número total de posts en memoria.
 */
export function getMemorySize(): number {
  return memoryCache.size;
}

/**
 * Retorna todos los posts del caché como un array.
 */
export function getAllFromMemory(): PostData[] {
  return Array.from(memoryCache.values());
}

/**
 * Persiste todos los posts del caché en memoria a chrome.storage.local.
 * Se llama periódicamente o cuando hay nuevos datos.
 */
export async function persistToStorage(): Promise<void> {
  const posts = getAllFromMemory();
  const data: Record<string, PostData> = {};
  for (const post of posts) {
    data[post.id] = post;
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
  console.log(`[X-Scraper] 💾 Persistidos ${posts.length} posts a storage`);
}

/**
 * Carga los posts previamente guardados desde chrome.storage.local
 * al caché de memoria. Se llama al iniciar el content script.
 */
export async function loadFromStorage(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const storedData: Record<string, PostData> = result[STORAGE_KEY] || {};
  let mergedCount = 0;
  let newCount = 0;

  for (const [id, post] of Object.entries(storedData)) {
    if (memoryCache.has(id)) {
      const existing = memoryCache.get(id)!;
      memoryCache.set(id, mergePost(existing, post));
      mergedCount++;
    } else {
      memoryCache.set(id, post);
      newCount++;
    }
  }
  console.log(`[X-Scraper] 📂 Cargados ${Object.keys(storedData).length} desde storage. Nuevos: ${newCount}, Fusionados: ${mergedCount}. Total en memoria: ${memoryCache.size}`);
}

/**
 * Exporta todos los posts como un string JSON formateado.
 */
export function exportAsJSON(): string {
  const posts = getAllFromMemory();
  // Ordenar por fecha descendente
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return JSON.stringify(posts, null, 2);
}

/**
 * Limpia todo el caché y el almacenamiento persistente.
 */
export async function clearAll(): Promise<void> {
  memoryCache.clear();
  await chrome.storage.local.remove(STORAGE_KEY);
  console.log("[X-Scraper] 🗑️ Datos borrados");
}
