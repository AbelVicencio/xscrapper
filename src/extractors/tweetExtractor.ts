// ─────────────────────────────────────────────────────
// tweetExtractor.ts — Extracción de datos de tweets del DOM
// ─────────────────────────────────────────────────────
// Toma un nodo HTML de un tweet y devuelve un PostData estructurado.
// Usa selectores basados en data-testid y aria-labels de X.com.
// ─────────────────────────────────────────────────────

import { PostData, PostMetrics } from "../types";
import { parseMetricString, parseAriaMetric } from "../utils/parseMetric";

/**
 * Selectores CSS estables de X.com (basados en data-testid y estructura).
 * Estos se pueden actualizar fácilmente si X cambia su DOM.
 */
const SELECTORS = {
  /** Cada artículo/tweet individual */
  article: 'article[data-testid="tweet"]',
  /** Contenedor del texto del tweet */
  tweetText: '[data-testid="tweetText"]',
  /** Enlace con timestamp (contiene el permalink) */
  timestamp: 'time[datetime]',
  /** Nombre de usuario (@handle) */
  userLink: 'a[role="link"][href*="/"]',
  /** Grupo de botones de métricas */
  replyBtn: '[data-testid="reply"]',
  repostBtn: '[data-testid="retweet"]',
  likeBtn: '[data-testid="like"], [data-testid="unlike"]',
  bookmarkBtn: '[data-testid="bookmark"], [data-testid="removeBookmark"]',
  /** Contador de vistas */
  viewCount: 'a[href*="/analytics"]',
} as const;

/**
 * Extrae el ID del tweet desde la URL del permalink.
 * Formato: https://x.com/{user}/status/{tweetId}
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extrae el texto visible de un nodo de tweet.
 * Maneja emojis (img alt text) y saltos de línea.
 */
function extractText(tweetTextEl: Element | null): string {
  if (!tweetTextEl) return "";

  let text = "";
  const walker = document.createTreeWalker(
    tweetTextEl,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          // Incluir alt text de emojis
          if (el.tagName === "IMG" && el.getAttribute("alt")) return NodeFilter.FILTER_ACCEPT;
          // Respetar saltos de línea
          if (el.tagName === "BR") return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      text += currentNode.textContent;
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const el = currentNode as Element;
      if (el.tagName === "IMG") {
        text += el.getAttribute("alt") || "";
      } else if (el.tagName === "BR") {
        text += "\n";
      }
    }
  }

  return text.trim();
}

/**
 * Extrae las métricas de interacción de un tweet.
 * Lee los aria-labels de los botones de acción.
 */
function extractMetrics(article: Element): PostMetrics {
  const getMetric = (selector: string): number | null => {
    const btn = article.querySelector(selector);
    if (!btn) return null;
    const ariaLabel = btn.getAttribute("aria-label");
    return parseAriaMetric(ariaLabel);
  };

  // Vistas: pueden estar en un enlace a analytics o como texto visible
  let views: number | null = null;
  const viewEl = article.querySelector(SELECTORS.viewCount);
  if (viewEl) {
    const ariaLabel = viewEl.getAttribute("aria-label");
    views = parseAriaMetric(ariaLabel);
    if (views === null) {
      // Intentar leer el texto visible del contador
      const visibleText = viewEl.textContent?.trim();
      views = parseMetricString(visibleText);
    }
  }

  return {
    views,
    replies: getMetric(SELECTORS.replyBtn),
    reposts: getMetric(SELECTORS.repostBtn),
    likes: getMetric(SELECTORS.likeBtn),
    bookmarks: getMetric(SELECTORS.bookmarkBtn),
  };
}

/**
 * Extrae información del autor desde el article.
 */
function extractAuthor(article: Element): { author: string; displayName: string } {
  // Buscar todos los enlaces dentro del tweet
  const links = article.querySelectorAll('a[role="link"]');
  let author = "";
  let displayName = "";

  for (const link of links) {
    const href = link.getAttribute("href") || "";
    // El enlace al perfil tiene formato /{username}
    if (href.match(/^\/[a-zA-Z0-9_]+$/) && !href.includes("/status/")) {
      author = href.replace("/", "");
      // El display name está en un span dentro de este enlace o hermano cercano
      const nameSpan = link.querySelector("span");
      if (nameSpan && nameSpan.textContent) {
        displayName = nameSpan.textContent.trim();
      }
      break;
    }
  }

  return { author, displayName };
}

/**
 * Extrae URLs de medios adjuntos (imágenes, videos).
 */
function extractMediaUrls(article: Element): string[] {
  const urls: string[] = [];

  // Imágenes del tweet
  const images = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');
  for (const img of images) {
    const src = img.getAttribute("src");
    if (src) urls.push(src);
  }

  // Videos (poster thumbnails)
  const videos = article.querySelectorAll("video");
  for (const video of videos) {
    const poster = video.getAttribute("poster");
    if (poster) urls.push(poster);
  }

  return urls;
}

/**
 * Función principal de extracción.
 * Toma un nodo HTML (article) y devuelve un PostData estructurado.
 *
 * @param node - Elemento DOM del tweet (article[data-testid="tweet"])
 * @returns PostData si la extracción fue exitosa, null en caso contrario
 */
export function extractPostFromNode(node: Element): PostData | null {
  // Asegurar que es un article de tweet
  const article = node.matches(SELECTORS.article)
    ? node
    : node.querySelector(SELECTORS.article);

  if (!article) return null;

  // Buscar el permalink (timestamp link)
  const timeEl = article.querySelector(SELECTORS.timestamp);
  if (!timeEl) return null;

  const permalinkAnchor = timeEl.closest("a");
  const permalink = permalinkAnchor?.getAttribute("href") || "";
  const tweetId = extractTweetId(permalink);

  if (!tweetId) return null;

  // Fecha
  const dateISO = timeEl.getAttribute("datetime") || new Date().toISOString();

  // Texto
  const tweetTextEl = article.querySelector(SELECTORS.tweetText);
  const text = extractText(tweetTextEl);

  // Autor
  const { author, displayName } = extractAuthor(article);

  // Métricas
  const metrics = extractMetrics(article);

  // Medios
  const mediaUrls = extractMediaUrls(article);

  // Idioma
  const lang = tweetTextEl?.getAttribute("lang") || null;

  // URL canónica
  const url = permalink ? `https://x.com${permalink}` : "";

  const now = new Date().toISOString();

  return {
    id: tweetId,
    author,
    displayName,
    date: dateISO,
    text,
    url,
    // Métricas aplanadas
    likes: metrics.likes,
    views: metrics.views,
    reposts: metrics.reposts,
    replies: metrics.replies,
    bookmarks: metrics.bookmarks,
    
    firstSeen: now,
    lastUpdated: now,
    appearanceCount: 1,
    isDetailView: false,
    mediaUrls,
    lang,
  };
}

/**
 * Detecta si estamos en una vista detallada (thread/status page).
 */
export function isDetailViewPage(): boolean {
  return /\/status\/\d+/.test(window.location.pathname);
}

/**
 * Selector CSS para encontrar artículos de tweets en el DOM.
 */
export const TWEET_ARTICLE_SELECTOR = SELECTORS.article;
