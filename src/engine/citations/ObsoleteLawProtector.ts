import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";
import { getArticleMetadata } from "./LimitationArticleMapper";

/**
 * P6-07: Obsolete-Law Protection.
 * 
 * Prevents the engine from applying or citing repealed/omitted laws.
 * Fails closed if an obsolete article is invoked.
 */

export function isArticleObsolete(articleNumber: string | number): boolean {
  const meta = getArticleMetadata(articleNumber);
  
  // If the article doesn't exist in the corpus at all, it is not "obsolete" 
  // in the statutory sense, but it is invalid. We treat it as non-obsolete 
  // here so the caller can handle the "Not found" case separately.
  if (!meta) {
    return false;
  }

  // If the metadata explicitly contains an 'omitted' field, it is obsolete.
  return "omitted" in meta && meta.omitted !== undefined;
}

export function getObsoleteReason(articleNumber: string | number): string | null {
  const meta = getArticleMetadata(articleNumber);
  if (!meta || !("omitted" in meta) || !meta.omitted) {
    return null;
  }
  return meta.omitted;
}

/**
 * Hard fail-closed guard. Throws an error if an obsolete article is used.
 */
export function assertArticleNotObsolete(articleNumber: string | number): void {
  if (isArticleObsolete(articleNumber)) {
    const reason = getObsoleteReason(articleNumber);
    throw new Error(`Illegal State: Attempted to apply obsolete Article ${articleNumber}. Reason: ${reason}`);
  }
}
