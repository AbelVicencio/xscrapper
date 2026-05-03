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
  /** Contenedor de nombre de usuario y handle */
  userName: '[data-testid="User-Name"], [data-testid="UserNames"]',
  /** Contenedor de tweet citado */
  quoteTweet: '[data-testid="quoteTweet"]',
  /** Contenedor de video embebido */
  videoComponent: '[data-testid="videoComponent"], [data-testid="videoPlayer"]',
  /** Contenedor de foto del tweet */
  tweetPhoto: '[data-testid="tweetPhoto"]',
  /** Tarjetas (pueden contener videos) */
  cardWrapper: '[data-testid="card.wrapper"]',
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
    const value = parseAriaMetric(ariaLabel);
    // Estandarizar: si el botón existe pero no tiene número en el aria-label, es 0
    return value === null ? 0 : value;
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
    // Si sigue siendo null pero el elemento existe, es 0
    if (views === null) views = 0;
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
  const userNameEl = article.querySelector(SELECTORS.userName);
  let author = "";
  let displayName = "";

  if (userNameEl) {
    // innerText es ideal aquí porque inserta saltos de línea naturales entre bloques
    // Ejemplo: "Javier Hidalgo\n@Javier_Hidalgo"
    const rawText = (userNameEl as HTMLElement).innerText || extractText(userNameEl);
    
    // Intentar separar por líneas primero
    const parts = rawText.split(/\n+/).map(p => p.trim()).filter(p => p);
    
    if (parts.length >= 2) {
      // Casi siempre: [0] es Nombre, [1] es @handle
      const first = parts[0];
      const second = parts.find(p => p.startsWith('@'));
      
      if (second) {
        author = second.replace('@', '');
        displayName = first;
      }
    }
    
    // Si no funcionó por líneas, intentar por regex sobre el texto corrido
    if (!author || !displayName) {
      const cleanText = rawText.replace(/\s+/g, ' ');
      const match = cleanText.match(/^(.+?)\s*(@[\w_]+)/);
      if (match) {
        displayName = match[1].trim();
        author = match[2].replace('@', '');
      }
    }
  }

  // Fallback final: buscar cualquier enlace que parezca de perfil
  if (!author || !displayName) {
    const links = article.querySelectorAll('a[role="link"]');
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (href.match(/^\/[a-zA-Z0-9_]{1,15}$/) && !href.includes("/status/") && !href.includes("/home")) {
        const foundAuthor = href.replace("/", "");
        if (!author) author = foundAuthor;
        
        const linkText = (link as HTMLElement).innerText?.trim();
        if (linkText && !linkText.startsWith('@') && !displayName) {
          displayName = linkText;
        }
      }
      if (author && displayName) break;
    }
  }

  return { author, displayName };
}

/**
 * Búsqueda recursiva y robusta para extraer la URL del MP4 de mayor calidad del estado de React.
 */
function findVideoUrlInObject(obj: any, depth = 0, visited = new WeakSet()): string | null {
  if (depth > 15 || !obj || typeof obj !== 'object') return null;
  if (visited.has(obj)) return null;
  visited.add(obj);

  // Check for variants array directamente
  const variants = obj.variants || obj.video_info?.variants;
  if (Array.isArray(variants)) {
    const mp4Variants = variants
      .filter((v: any) => v.content_type === 'video/mp4' && v.url)
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    
    if (mp4Variants.length > 0) {
      return mp4Variants[0].url;
    }
  }

  // Iterate over properties
  for (const key of Object.keys(obj)) {
    // Skip React internal properties that might cause deep recursion or circular refs
    if (key === 'return' || key === 'child' || key === 'sibling' || key === '_owner' || key.startsWith('__')) continue;
    
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      const result = findVideoUrlInObject(val, depth + 1, visited);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Intenta extraer URLs directas de videos MP4 utilizando el estado interno de React (React Fiber).
 * Esto permite evitar los enlaces "blob:" y obtener la variante de máxima calidad sin peticiones de red adicionales.
 */
function extractVideoFromReactFiber(article: Element): string | null {
  try {
    // Buscar el nodo DOM del video (si no existe, usa el article)
    const videoNode = article.querySelector('[data-testid="videoComponent"], [data-testid="videoPlayer"]') || article;
    
    let fiberKey = Object.keys(videoNode).find(key => key.startsWith('__reactFiber$'));
    let fiber = fiberKey ? (videoNode as any)[fiberKey] : null;

    if (!fiber) {
      const propsKey = Object.keys(videoNode).find(key => key.startsWith('__reactProps$'));
      if (propsKey) {
        fiber = { memoizedProps: (videoNode as any)[propsKey], return: null };
      }
    }

    if (!fiber) return null;

    let current = fiber;
    let attempts = 0;
    while (current && attempts < 15) {
      const visited = new WeakSet();
      
      if (current.memoizedProps) {
        const url = findVideoUrlInObject(current.memoizedProps, 0, visited);
        if (url) return url;
      }
      
      if (current.pendingProps) {
        const url = findVideoUrlInObject(current.pendingProps, 0, visited);
        if (url) return url;
      }
      
      current = current.return;
      attempts++;
    }
  } catch (error) {
    console.warn("React Fiber video extraction failed:", error);
  }
  return null;
}

/**
 * Resultado de la extracción de medios, separando imágenes y videos.
 */
interface ExtractedMedia {
  imageUrls: string[];
  videoUrls: string[];
  linkUrls: string[];
}

/**
 * Extrae URLs de medios adjuntos.
 * Imágenes: captura desde img[src*="pbs.twimg.com/media"]
 * Videos: captura poster, <source> mp4, y construye URL canónica
 */
function extractMediaUrls(article: Element, permalink: string): ExtractedMedia {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];
  const linkUrls: string[] = [];
  const seen = new Set<string>();

  const addUnique = (arr: string[], url: string) => {
    if (url && !seen.has(url)) {
      seen.add(url);
      arr.push(url);
    }
  };

  // ── IMÁGENES ──────────────────────────────────────────
  // Imágenes directas del tweet (pbs.twimg.com/media/...)
  const images = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');
  for (const img of images) {
    const src = img.getAttribute("src");
    if (src) addUnique(imageUrls, src);
  }

  // ── VIDEOS ────────────────────────────────────────────
  // Estrategia 0 (Stealth): Extraer video directo del estado de React Fiber
  const stealthVideoUrl = extractVideoFromReactFiber(article);
  if (stealthVideoUrl) {
    addUnique(videoUrls, stealthVideoUrl);
  }

  // Estrategia 3: Buscar thumbnails que son específicamente de video o media player
  const videoThumbs = article.querySelectorAll('img[src*="ext_tw_video_thumb"], img[src*="tweet_video_thumb"], img[src*="amplify_video_thumb"], img[src*="media_proxy"]');
  for (const img of videoThumbs) {
    const src = img.getAttribute("src");
    // El usuario prefiere las miniaturas en imageUrls
    if (src) addUnique(imageUrls, src);
  }

  // Estrategia 1: Buscar componente de video por data-testid
  const videoComponent = article.querySelector(SELECTORS.videoComponent);
  const cardWrapper = article.querySelector(SELECTORS.cardWrapper);
  const hasVideoSuspect = !!videoComponent || !!cardWrapper || videoThumbs.length > 0;

  // Estrategia 2: Buscar el tag <video> y su poster
  const videos = article.querySelectorAll("video");
  for (const video of videos) {
    const poster = video.getAttribute("poster");
    // El usuario prefiere que los posters de video vayan a imágenes
    if (poster) addUnique(imageUrls, poster);

    const videoSrc = video.getAttribute("src");
    if (videoSrc && !videoSrc.startsWith("blob:")) {
      addUnique(videoUrls, videoSrc);
    }
  }

  // Estrategia 4: Si hay un videoComponent o Card, buscar cualquier imagen dentro (poster)
  if (hasVideoSuspect) {
    const container = videoComponent || cardWrapper;
    if (container) {
      const imgs = container.querySelectorAll('img');
      for (const img of imgs) {
        const src = img.getAttribute("src");
        if (src && !seen.has(src)) addUnique(imageUrls, src);
      }
    }
  }

  // Estrategia 5: URL canónica /video/1
  // Si detectamos un video o el contenedor de video, agregamos el permalink de video
  if ((videos.length > 0 || hasVideoSuspect) && permalink) {
    const canonicalVideoUrl = `https://x.com${permalink}/video/1`;
    addUnique(videoUrls, canonicalVideoUrl);
  }

  // ── ENLACES EXTERNOS ──────────────────────────────────
  // Buscar enlaces de video o multimedia en todo el article, y también enlaces genéricos (t.co)
  const allLinks = article.querySelectorAll('a[href*="video.twimg.com"], a[href*="amplify_video"], a[href*="/video/"], a[href*="t.co/"]');
  for (const link of allLinks) {
    const href = link.getAttribute("href");
    if (href) {
      const fullUrl = href.startsWith('http') ? href : `https://x.com${href}`;
      // Si es un enlace de video directamente, lo ponemos en videos, de lo contrario en enlaces
      if (href.includes("video.twimg.com") || href.includes("amplify_video") || href.includes("/video/")) {
        addUnique(videoUrls, fullUrl);
      } else {
        addUnique(linkUrls, fullUrl);
      }
    }
  }

  return { imageUrls, videoUrls, linkUrls };
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

  // Medios (imágenes y videos por separado) y enlaces
  const { imageUrls, videoUrls, linkUrls } = extractMediaUrls(article, permalink);

  // Idioma
  const lang = tweetTextEl?.getAttribute("lang") || null;

  // URL canónica
  const url = permalink ? `https://x.com${permalink}` : "";

  // Citas (Quote Tweets)
  const quoteBox = article.querySelector(SELECTORS.quoteTweet);
  const isQuote = !!quoteBox;
  let quotedPostId: string | null = null;
  if (isQuote && quoteBox) {
    const quoteLink = quoteBox.querySelector('a[href*="/status/"]');
    if (quoteLink) {
      quotedPostId = extractTweetId(quoteLink.getAttribute("href") || "");
    }
  }

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
    imageUrls: imageUrls,
    videoUrls,
    linkUrls,
    lang,
    isQuote,
    quotedPostId,
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
