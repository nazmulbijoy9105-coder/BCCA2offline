import { getArticleMetadata } from "./LimitationArticleMapper";

/**
 * P6-07: Obsolete-Law Protection.
 * 
 * Prevents the engine from applying or citing repealed/omitted laws.
 * Fails closed by returning true, allowing the caller to gracefully
 * degrade to an INDETERMINATE verdict instead of crashing the process.
 */

export function isArticleObsolete(articleNumber: string | number): boolean {
  const meta = getArticleMetadata(articleNumber);
  if (!meta) {
    return false;
  }
  return "omitted" in meta && meta.omitted !== undefined;
}

export function getObsoleteReason(articleNumber: string | number): string | null {
  const meta = getArticleMetadata(articleNumber);
  if (!meta || !("omitted" in meta) || !meta.omitted) {
    return null;
  }
  return meta.omitted;
}
