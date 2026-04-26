// ─────────────────────────────────────────────────────
// types.ts — Modelos de datos para la extensión
// ─────────────────────────────────────────────────────

/** Métricas numéricas de una publicación */
export interface PostMetrics {
  /** Número de vistas */
  views: number | null;
  /** Número de respuestas */
  replies: number | null;
  /** Número de reposts / retweets */
  reposts: number | null;
  /** Número de likes */
  likes: number | null;
  /** Número de bookmarks */
  bookmarks: number | null;
}

/** Modelo principal de una publicación extraída */
export interface PostData {
  /** ID único del tweet/post (ej. "1784567890123456789") */
  id: string;
  /** Handle / nombre de usuario del autor */
  author: string;
  /** Nombre para mostrar del autor */
  displayName: string;
  /** Fecha ISO 8601 de la publicación */
  date: string;
  /** Texto completo de la publicación */
  text: string;
  /** URL canónica de la publicación */
  url: string;
  /** Métricas aplanadas */
  views?: number | null;
  replies?: number | null;
  reposts?: number | null;
  likes?: number | null;
  bookmarks?: number | null;
  /** Marca de tiempo de la primera extracción (ISO 8601) */
  firstSeen: string;
  /** Marca de tiempo de la última actualización (ISO 8601) */
  lastUpdated: string;
  /** Número de veces que el post ha sido detectado en el DOM */
  appearanceCount: number;
  /** Indica si el texto fue capturado desde la vista detallada */
  isDetailView: boolean;
  /** URLs de medios adjuntos (imágenes, videos) */
  mediaUrls: string[];
  /** Idioma detectado del texto */
  lang?: string | null;
}

/** Mensaje entre content script y service worker */
export type ExtensionMessage =
  | { type: "POSTS_EXTRACTED"; payload: PostData[] }
  | { type: "GET_STATS"; }
  | { type: "STATS_RESPONSE"; payload: { totalPosts: number; lastExport: string | null } }
  | { type: "EXPORT_JSON"; }
  | { type: "CLEAR_DATA"; };
