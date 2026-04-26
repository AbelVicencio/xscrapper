// ─────────────────────────────────────────────────────
// parseMetric.ts — Parser de métricas en español
// ─────────────────────────────────────────────────────
// Convierte strings de métricas de X.com a números:
//   "1 mil"    → 1000
//   "74,5 mil" → 74500
//   "1,2 M"    → 1200000
//   "698"      → 698
//   "2.5K"     → 2500  (formato inglés también soportado)
//   ""         → null
// ─────────────────────────────────────────────────────

/**
 * Tabla de multiplicadores para sufijos de métricas.
 * Soporta tanto formatos en español como en inglés.
 */
const MULTIPLIERS: Record<string, number> = {
  // Español
  "mil": 1_000,
  "m":   1_000_000,   // "M" en español = millón
  "mill": 1_000_000,  // variante
  // Inglés (fallback)
  "k":   1_000,
  "b":   1_000_000_000,
};

/**
 * Parsea un string de métrica (español o inglés) y devuelve su valor numérico.
 *
 * @param raw - El string crudo de la métrica (ej. "74,5 mil", "1.2M", "698")
 * @returns El valor numérico, o null si el string está vacío o no es parseable
 *
 * @example
 * parseMetricString("1 mil")     // → 1000
 * parseMetricString("74,5 mil")  // → 74500
 * parseMetricString("698")       // → 698
 * parseMetricString("1,2 M")     // → 1200000
 * parseMetricString("2.5K")      // → 2500
 * parseMetricString("")          // → null
 */
export function parseMetricString(raw: string | null | undefined): number | null {
  if (!raw) return null;

  // Limpiar: quitar espacios extra, puntos de separación de miles
  let cleaned = raw.trim().toLowerCase();
  if (cleaned === "" || cleaned === "—" || cleaned === "-") return null;

  // Separar la parte numérica del sufijo
  // Regex: captura número (con coma o punto decimal) + opcional sufijo alfanumérico
  const match = cleaned.match(
    /^([0-9]+(?:[.,][0-9]+)?)\s*(mil|mill|m|k|b)?$/
  );

  if (!match) {
    // Intentar parsear como número puro (sin sufijo)
    const asNumber = Number(cleaned.replace(/,/g, "."));
    return isNaN(asNumber) ? null : asNumber;
  }

  const [, numPart, suffix] = match;

  // Normalizar: coma decimal → punto decimal
  const numValue = parseFloat(numPart.replace(",", "."));
  if (isNaN(numValue)) return null;

  if (!suffix) return numValue;

  const multiplier = MULTIPLIERS[suffix];
  if (!multiplier) return numValue;

  return Math.round(numValue * multiplier);
}

/**
 * Extrae y parsea el número de una cadena que puede contener texto adicional.
 * Útil para aria-labels como "1234 Me gusta" o "567 replies".
 *
 * @param ariaLabel - El aria-label completo
 * @returns El valor numérico extraído, o null
 */
export function parseAriaMetric(ariaLabel: string | null | undefined): number | null {
  if (!ariaLabel) return null;

  // Buscar el primer número en el aria-label
  // Soporta formatos: "1234", "1,234", "1.234", "1234 Me gusta"
  const match = ariaLabel.match(/^([\d.,]+)/);
  if (!match) return null;

  // Quitar separadores de miles y parsear
  const numStr = match[1].replace(/[.,](?=\d{3})/g, "");
  const value = parseFloat(numStr.replace(",", "."));
  return isNaN(value) ? null : Math.round(value);
}
