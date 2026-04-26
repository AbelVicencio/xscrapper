// ─────────────────────────────────────────────────────
// observer.ts — MutationObserver para detectar tweets nuevos
// ─────────────────────────────────────────────────────
// Observa el DOM y detecta cuando X.com inyecta nuevos artículos
// en el timeline (scroll infinito, navegación SPA).
// ─────────────────────────────────────────────────────

import { PostData } from "../types";
import { extractPostFromNode, isDetailViewPage, TWEET_ARTICLE_SELECTOR } from "../extractors/tweetExtractor";
import { upsertToMemory, getMemorySize } from "../storage/store";

/** Conjunto de IDs ya procesados en esta sesión para evitar re-procesar */
const processedNodeSet: WeakSet<Node> = new WeakSet();

/** Callback cuando se extraen nuevos posts */
type OnNewPostsCallback = (posts: PostData[]) => void;

/** Configuración del observer */
interface ObserverConfig {
  /** Callback cuando se detectan posts nuevos o actualizados */
  onNewPosts: OnNewPostsCallback;
  /** Intervalo en ms para hacer batch de las mutaciones (debounce) */
  batchInterval?: number;
  /** Habilitar logging verbose */
  verbose?: boolean;
}

/**
 * Crea y configura un MutationObserver que detecta tweets nuevos
 * inyectados en el DOM por X.com.
 *
 * X.com usa una SPA (Single Page Application) con scroll infinito.
 * Los tweets se inyectan como nodos <article> dentro del timeline.
 * Este observer detecta esas inyecciones sin hacer peticiones de red.
 *
 * @param config - Configuración del observer
 * @returns Objeto con métodos para controlar el observer
 */
export function createTweetObserver(config: ObserverConfig) {
  const { onNewPosts, batchInterval = 500, verbose = false } = config;

  let pendingNodes: Element[] = [];
  let batchTimer: ReturnType<typeof setTimeout> | null = null;
  let observer: MutationObserver | null = null;
  let active = false;

  const log = verbose
    ? (...args: unknown[]) => console.log("[X-Scraper 🔍]", ...args)
    : () => {};

  /**
   * Procesa un lote de nodos acumulados.
   * Extrae datos de cada tweet y los inserta/actualiza en el store.
   */
  function processBatch(): void {
    if (pendingNodes.length === 0) return;

    const nodesToProcess = [...pendingNodes];
    pendingNodes = [];
    batchTimer = null;

    const newPosts: PostData[] = [];

    for (const node of nodesToProcess) {
      // Verificar si ya procesamos este nodo DOM específico
      if (processedNodeSet.has(node)) continue;
      processedNodeSet.add(node);

      // Intentar extraer datos del tweet
      const post = extractPostFromNode(node);
      if (!post) continue;

      // Marcar si estamos en vista detallada
      if (isDetailViewPage()) {
        post.isDetailView = true;
      }

      // Upsert en memoria
      const isNew = upsertToMemory(post);

      if (isNew) {
        log(`✨ Nuevo post: @${post.author} — "${post.text.slice(0, 60)}..."`);
      } else {
        log(`🔄 Actualizado: ${post.id}`);
      }

      newPosts.push(post);
    }

    if (newPosts.length > 0) {
      log(`📊 Batch: ${newPosts.length} posts procesados. Total en memoria: ${getMemorySize()}`);
      onNewPosts(newPosts);
    }
  }

  /**
   * Programa el procesamiento de nodos con debounce.
   */
  function scheduleBatch(): void {
    if (batchTimer) return;
    batchTimer = setTimeout(processBatch, batchInterval);
  }

  /**
   * Callback del MutationObserver.
   * Filtra las mutaciones para encontrar artículos de tweets.
   */
  function handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType !== Node.ELEMENT_NODE) continue;

        const el = addedNode as Element;

        // Caso 1: El nodo agregado ES un article de tweet
        if (el.matches?.(TWEET_ARTICLE_SELECTOR)) {
          pendingNodes.push(el);
          continue;
        }

        // Caso 2: El nodo agregado CONTIENE articles de tweet
        const articles = el.querySelectorAll?.(TWEET_ARTICLE_SELECTOR);
        if (articles && articles.length > 0) {
          for (const article of articles) {
            pendingNodes.push(article);
          }
        }
      }
    }

    if (pendingNodes.length > 0) {
      scheduleBatch();
    }
  }

  /**
   * Inicia la observación del DOM.
   */
  function start(): void {
    if (observer) {
      log("⚠️ Observer ya está activo");
      return;
    }

    // Primero, procesar los tweets que ya están visibles en la página
    const existingArticles = document.querySelectorAll(TWEET_ARTICLE_SELECTOR);
    log(`📄 Encontrados ${existingArticles.length} tweets existentes en la página`);
    for (const article of existingArticles) {
      pendingNodes.push(article);
    }
    if (pendingNodes.length > 0) {
      scheduleBatch();
    }

    // Crear el MutationObserver
    observer = new MutationObserver(handleMutations);

    // Observar todo el body — X.com reemplaza secciones completas
    // durante la navegación SPA
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    active = true;
    log("🚀 MutationObserver iniciado");
  }

  /**
   * Detiene la observación del DOM.
   */
  function stop(): void {
    active = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (batchTimer) {
      clearTimeout(batchTimer);
      batchTimer = null;
    }
    // Procesar cualquier nodo pendiente
    processBatch();
    log("⏹️ MutationObserver detenido");
  }

  /**
   * Escanea manualmente todos los tweets visibles.
   * Útil como fallback o para captura inicial.
   */
  function scanVisible(): void {
    const articles = document.querySelectorAll(TWEET_ARTICLE_SELECTOR);
    for (const article of articles) {
      pendingNodes.push(article);
    }
    log(`🔎 Escaneo manual: ${articles.length} tweets`);
    processBatch();
  }

  return {
    start,
    stop,
    scanVisible,
    isActive: () => active
  };
}
